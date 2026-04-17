//! Hardware entry point for the ESP32.
//! Wires the generic GameEngine to real GPIO/I2C/LEDC peripherals.

#![no_std]
#![no_main]

use esp_backtrace as _;
use esp_hal::{
    clock::ClockControl,
    delay::Delay,
    gpio::{Io, Level, Output},
    i2c::I2C,
    ledc::{
        channel::{self, ChannelIFace},
        timer::{self, TimerIFace},
        LSGlobalClkSource, Ledc, LowSpeed,
    },
    peripherals::Peripherals,
    prelude::*,
    system::SystemControl,
    time::current_time,
};

use maze_game_lib::{
    config,
    display::{Display, DisplayBuffer},
    feedback::{BuzzerHal, Feedback, MotorHal},
    game::GameEngine,
    motion::{Motion, Tilt},
};

// ── Hardware Display ──────────────────────────────────────────
struct HardwareDisplay {
    rows: [Output<'static>; 8],
    cols: [Output<'static>; 8],
}

impl Display for HardwareDisplay {
    fn draw(&mut self, buf: &DisplayBuffer) {
        for row in 0..8 {
            for col in 0..8 {
                let lit = buf.get_pixel(col, row);
                if lit {
                    self.rows[row].set_high();
                    self.cols[col].set_low();
                } else {
                    self.cols[col].set_high();
                }
            }
        }
    }
    fn clear(&mut self) {
        for r in &mut self.rows {
            r.set_low();
        }
        for c in &mut self.cols {
            c.set_high();
        }
    }
}

// ── Hardware Buzzer ───────────────────────────────────────────
struct HardwareBuzzer<'d> {
    channel: channel::Channel<'d, LowSpeed, esp_hal::gpio::GpioPin<2>>,
    timer: &'d mut timer::Timer<'d, LowSpeed>,
}

impl BuzzerHal for HardwareBuzzer<'_> {
    fn play_tone(&mut self, hz: u16) {
        let _ = self.timer.configure(timer::config::Config {
            duty: timer::config::Duty::Duty8Bit,
            clock_source: timer::LSClockSource::APBClk,
            frequency: hz.into(),
        });
        let _ = self.channel.configure(channel::config::Config {
            timer: self.timer,
            duty_pct: 50,
            pin_config: channel::config::PinConfig::PushPull,
        });
    }
    fn stop_tone(&mut self) {
        let _ = self.channel.set_duty(0);
    }
}

// ── Hardware Motor ────────────────────────────────────────────
struct HardwareMotor<'d> {
    channel: channel::Channel<'d, LowSpeed, esp_hal::gpio::GpioPin<4>>,
}

impl MotorHal for HardwareMotor<'_> {
    fn set_duty(&mut self, duty: u8) {
        let pct = (duty as u32 * 100 / 255) as u8;
        let _ = self.channel.set_duty(pct);
    }
}

// ── Hardware Motion ───────────────────────────────────────────
struct HardwareMotion<'d> {
    i2c: I2C<'d, esp_hal::peripherals::I2C0>,
    offset_x: f32,
    offset_y: f32,
}

impl Motion for HardwareMotion<'_> {
    fn read(&mut self) -> Tilt {
        let raw = self.read_raw();
        let ax = raw.0 - self.offset_x;
        let ay = raw.1 - self.offset_y;
        Tilt {
            ax: if ax.abs() < config::DEADZONE { 0.0 } else { ax },
            ay: if ay.abs() < config::DEADZONE { 0.0 } else { ay },
        }
    }
}

impl<'d> HardwareMotion<'d> {
    fn read_raw(&mut self) -> (f32, f32) {
        // Read 6 bytes from MPU6050 ACCEL_XOUT_H (0x3B)
        let mut buf = [0u8; 6];
        let _ = self.i2c.write_read(0x68, &[0x3B], &mut buf);
        let raw_ax = i16::from_be_bytes([buf[0], buf[1]]) as f32 / 16384.0 * 9.81;
        let raw_ay = i16::from_be_bytes([buf[2], buf[3]]) as f32 / 16384.0 * 9.81;
        // Axis swap to match GY-521 orientation
        (-raw_ay, raw_ax)
    }

    fn calibrate(&mut self, delay: &mut Delay) {
        let mut sx = 0.0f32;
        let mut sy = 0.0f32;
        for _ in 0..config::IMU_CAL_SAMPLES {
            let (ax, ay) = self.read_raw();
            sx += ax;
            sy += ay;
            delay.delay_millis(5u32);
        }
        self.offset_x = sx / config::IMU_CAL_SAMPLES as f32;
        self.offset_y = sy / config::IMU_CAL_SAMPLES as f32;
    }
}

// ── Entry Point ───────────────────────────────────────────────
#[esp_hal::entry]
fn main() -> ! {
    let peripherals = Peripherals::take();
    let system = SystemControl::new(peripherals.SYSTEM);
    let clocks = ClockControl::max(system.clock_control).freeze();
    let io = Io::new(peripherals.GPIO, peripherals.IO_MUX);

    let mut delay = Delay::new(&clocks);

    // Read button
    let button = esp_hal::gpio::Input::new(io.pins.gpio34, esp_hal::gpio::Pull::None);

    // LEDC for motor and buzzer
    let mut ledc = Ledc::new(peripherals.LEDC, &clocks);
    ledc.set_global_slow_clock(LSGlobalClkSource::APBClk);

    let mut lstimer0 = ledc.get_timer::<LowSpeed>(timer::Number::Timer0);
    lstimer0
        .configure(timer::config::Config {
            duty: timer::config::Duty::Duty8Bit,
            clock_source: timer::LSClockSource::APBClk,
            frequency: 5000u32.Hz(),
        })
        .unwrap();

    // Build the engine
    let mut engine = GameEngine::new(
        HardwareDisplay {
            rows: [
                Output::new(io.pins.gpio13, Level::Low),
                Output::new(io.pins.gpio16, Level::Low),
                Output::new(io.pins.gpio17, Level::Low),
                Output::new(io.pins.gpio5, Level::Low),
                Output::new(io.pins.gpio18, Level::Low),
                Output::new(io.pins.gpio19, Level::Low),
                Output::new(io.pins.gpio23, Level::Low),
                Output::new(io.pins.gpio25, Level::Low),
            ],
            cols: [
                Output::new(io.pins.gpio26, Level::High),
                Output::new(io.pins.gpio32, Level::High),
                Output::new(io.pins.gpio33, Level::High),
                Output::new(io.pins.gpio27, Level::High),
                Output::new(io.pins.gpio14, Level::High),
                Output::new(io.pins.gpio12, Level::High),
                Output::new(io.pins.gpio15, Level::High),
                Output::new(io.pins.gpio0, Level::High),
            ],
        },
        {
            let i2c = I2C::new(
                peripherals.I2C0,
                io.pins.gpio21,
                io.pins.gpio22,
                400u32.kHz(),
                &clocks,
            );
            let mut m = HardwareMotion {
                i2c,
                offset_x: 0.0,
                offset_y: 0.0,
            };
            m.calibrate(&mut delay);
            m
        },
        Feedback::new(
            HardwareBuzzer {
                channel: ledc.get_channel(channel::Number::Channel0, io.pins.gpio2),
                timer: &mut lstimer0,
            },
            HardwareMotor {
                channel: ledc.get_channel(channel::Number::Channel1, io.pins.gpio4),
            },
        ),
    );

    let start_ms = 0u64;
    engine.init(start_ms);

    loop {
        let now_ms = current_time().to_millis();
        let btn = button.is_high();
        engine.tick(btn, now_ms);
        delay.delay_millis(20u32); // 50 Hz
    }
}
