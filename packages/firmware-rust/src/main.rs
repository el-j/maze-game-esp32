//! Hardware entry point for the ESP32.
//! Wires the generic GameEngine to real GPIO/I2C/LEDC peripherals.

#![no_std]
#![no_main]

use esp_backtrace as _;
use esp_hal::{
    delay::Delay,
    gpio::{Input, Level, Output, Pull},
    i2c::master::{Config as I2cConfig, I2c},
    ledc::{
        channel::{self, ChannelIFace},
        timer::{self, TimerIFace},
        LSGlobalClkSource, Ledc, LowSpeed,
    },
    time::RateExtU32,
    Blocking,
};
use fugit::HertzU32;

use maze_game_lib::{
    config,
    display::{Display, DisplayBuffer},
    feedback::{BuzzerHal, Feedback, MotorHal},
    game::GameEngine,
    motion::{Motion, Tilt},
};

// ── Channel-timer sentinel ────────────────────────────────────
// Channel<'static, S> stores &'static dyn TimerIFace internally (for duty
// resolution lookups).  Configuring a channel with &lstimer0 would borrow
// lstimer0 for 'static, preventing us from also moving it into
// HardwareBuzzer.  Instead we configure both channels with this zero-cost
// static sentinel that advertises the correct duty resolution and timer
// number; the *actual* frequency is controlled by lstimer0 which HardwareBuzzer
// owns and reconfigures freely in play_tone().
struct ChannelTimerSentinel;

impl TimerIFace<LowSpeed> for ChannelTimerSentinel {
    fn freq(&self) -> Option<HertzU32> {
        None
    }
    fn configure(
        &mut self,
        _config: timer::config::Config<timer::LSClockSource>,
    ) -> Result<(), timer::Error> {
        Ok(())
    }
    fn is_configured(&self) -> bool {
        true
    }
    fn duty(&self) -> Option<timer::config::Duty> {
        Some(timer::config::Duty::Duty8Bit)
    }
    fn number(&self) -> timer::Number {
        timer::Number::Timer0
    }
    fn frequency(&self) -> u32 {
        5000
    }
}

// A single 'static sentinel instance shared by all LEDC channels.
static TIMER0_SENTINEL: ChannelTimerSentinel = ChannelTimerSentinel;

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
// Owns the LEDC timer so it can reconfigure its frequency freely in
// play_tone().  The channel is configured once (in main) with
// TIMER0_SENTINEL so that no borrow of lstimer0 is held.
struct HardwareBuzzer<'d> {
    channel: channel::Channel<'d, LowSpeed>,
    timer: timer::Timer<'d, LowSpeed>,
}

impl BuzzerHal for HardwareBuzzer<'_> {
    fn play_tone(&mut self, hz: u16) {
        // Reconfigure the timer frequency – channel already linked to timer-0
        // in hardware via the initial configure() call in main().
        let _ = self.timer.configure(timer::config::Config {
            duty: timer::config::Duty::Duty8Bit,
            clock_source: timer::LSClockSource::APBClk,
            frequency: (hz as u32).Hz(),
        });
        // set_duty reads TIMER0_SENTINEL.duty() = Duty8Bit for the computation.
        let _ = self.channel.set_duty(50);
    }
    fn stop_tone(&mut self) {
        let _ = self.channel.set_duty(0);
    }
}

// ── Hardware Motor ────────────────────────────────────────────
struct HardwareMotor<'d> {
    channel: channel::Channel<'d, LowSpeed>,
}

impl MotorHal for HardwareMotor<'_> {
    fn set_duty(&mut self, duty: u8) {
        let pct = (duty as u32 * 100 / 255) as u8;
        let _ = self.channel.set_duty(pct);
    }
}

// ── Hardware Motion ───────────────────────────────────────────
struct HardwareMotion<'d> {
    i2c: I2c<'d, Blocking>,
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
        let _ = self.i2c.write_read(0x68u8, &[0x3B], &mut buf);
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
#[esp_hal::main]
fn main() -> ! {
    let peripherals = esp_hal::init(esp_hal::Config::default());

    let mut delay = Delay::new();

    // Read button (GPIO34 is input-only on ESP32)
    let button = Input::new(peripherals.GPIO34, Pull::None);

    // LEDC for motor and buzzer
    let mut ledc = Ledc::new(peripherals.LEDC);
    ledc.set_global_slow_clock(LSGlobalClkSource::APBClk);

    // lstimer0 drives both the buzzer channel (frequency set per-tone in
    // play_tone) and the motor channel (fixed ~5 kHz carrier).
    let mut lstimer0 = ledc.timer::<LowSpeed>(timer::Number::Timer0);
    lstimer0
        .configure(timer::config::Config {
            duty: timer::config::Duty::Duty8Bit,
            clock_source: timer::LSClockSource::APBClk,
            frequency: 5000u32.Hz(),
        })
        .unwrap();

    // Configure both channels with the static sentinel so that lstimer0 is
    // NOT borrowed and can be moved into HardwareBuzzer below.
    let mut buzzer_channel = ledc.channel(channel::Number::Channel0, peripherals.GPIO2);
    buzzer_channel
        .configure(channel::config::Config {
            timer: &TIMER0_SENTINEL,
            duty_pct: 0,
            pin_config: channel::config::PinConfig::PushPull,
        })
        .unwrap();

    let mut motor_channel = ledc.channel(channel::Number::Channel1, peripherals.GPIO4);
    motor_channel
        .configure(channel::config::Config {
            timer: &TIMER0_SENTINEL,
            duty_pct: 0,
            pin_config: channel::config::PinConfig::PushPull,
        })
        .unwrap();

    // Build the engine
    let mut engine = GameEngine::new(
        HardwareDisplay {
            rows: [
                Output::new(peripherals.GPIO13, Level::Low),
                Output::new(peripherals.GPIO16, Level::Low),
                Output::new(peripherals.GPIO17, Level::Low),
                Output::new(peripherals.GPIO5, Level::Low),
                Output::new(peripherals.GPIO18, Level::Low),
                Output::new(peripherals.GPIO19, Level::Low),
                Output::new(peripherals.GPIO23, Level::Low),
                Output::new(peripherals.GPIO25, Level::Low),
            ],
            cols: [
                Output::new(peripherals.GPIO26, Level::High),
                Output::new(peripherals.GPIO32, Level::High),
                Output::new(peripherals.GPIO33, Level::High),
                Output::new(peripherals.GPIO27, Level::High),
                Output::new(peripherals.GPIO14, Level::High),
                Output::new(peripherals.GPIO12, Level::High),
                Output::new(peripherals.GPIO15, Level::High),
                Output::new(peripherals.GPIO0, Level::High),
            ],
        },
        {
            let mut i2c_cfg = I2cConfig::default();
            i2c_cfg.frequency = 400u32.kHz();
            let i2c = I2c::new(peripherals.I2C0, i2c_cfg)
                .unwrap()
                .with_sda(peripherals.GPIO21)
                .with_scl(peripherals.GPIO22);
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
                channel: buzzer_channel,
                timer: lstimer0,
            },
            HardwareMotor {
                channel: motor_channel,
            },
        ),
    );

    let start_ms = 0u64;
    engine.init(start_ms);

    loop {
        let now_ms = esp_hal::time::now().ticks() / 1000;
        let btn = button.is_high();
        engine.tick(btn, now_ms);
        delay.delay_millis(20u32); // 50 Hz
    }
}
