//! Non-blocking melody sequencer and haptic motor driver.
//!
//! Identical logic to packages/firmware/src/Feedback.cpp.

use crate::config;

/// A single note: frequency in Hz (0 = silent rest) + duration in ms.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Note {
    pub hz: u16,
    pub ms: u32,
}

/// Named note frequencies (Hz).
pub mod notes {
    pub const REST: u16 = 0;
    pub const E3: u16 = 165;
    pub const A3: u16 = 220;
    pub const C4: u16 = 262;
    pub const E4: u16 = 330;
    pub const G4: u16 = 392;
    pub const C5: u16 = 523;
    pub const E5: u16 = 659;
    pub const G5: u16 = 784;
    pub const B5: u16 = 988;
    pub const C6: u16 = 1047;
    pub const E6: u16 = 1319;
}

use notes::*;

static MELODY_BOOT: &[Note] = &[
    Note { hz: G4, ms: 80 },
    Note { hz: REST, ms: 20 },
    Note { hz: C5, ms: 80 },
    Note { hz: REST, ms: 20 },
    Note { hz: E5, ms: 80 },
    Note { hz: REST, ms: 20 },
    Note { hz: G5, ms: 160 },
];

static MELODY_CRASH: &[Note] = &[
    Note { hz: A3, ms: 80 },
    Note { hz: REST, ms: 20 },
    Note { hz: E3, ms: 130 },
];

static MELODY_LEVELUP: &[Note] = &[
    Note { hz: C5, ms: 90 },
    Note { hz: REST, ms: 25 },
    Note { hz: E5, ms: 90 },
    Note { hz: REST, ms: 25 },
    Note { hz: G5, ms: 90 },
    Note { hz: REST, ms: 25 },
    Note { hz: C6, ms: 280 },
];

static MELODY_VICTORY: &[Note] = &[
    Note { hz: C5, ms: 100 },
    Note { hz: REST, ms: 25 },
    Note { hz: E5, ms: 100 },
    Note { hz: REST, ms: 25 },
    Note { hz: G5, ms: 120 },
    Note { hz: REST, ms: 25 },
    Note { hz: E5, ms: 90 },
    Note { hz: REST, ms: 20 },
    Note { hz: C6, ms: 120 },
    Note { hz: REST, ms: 40 },
    Note { hz: G5, ms: 120 },
    Note { hz: REST, ms: 25 },
    Note { hz: B5, ms: 120 },
    Note { hz: REST, ms: 25 },
    Note { hz: E6, ms: 500 },
];

/// Tone output hardware trait.
pub trait BuzzerHal {
    fn play_tone(&mut self, hz: u16); // 0 = silence
    fn stop_tone(&mut self);
}

/// Motor hardware trait.
pub trait MotorHal {
    fn set_duty(&mut self, duty: u8); // 0 = off, 255 = full
}

/// Non-blocking melody sequencer + haptic motor driver.
pub struct Feedback<B: BuzzerHal, M: MotorHal> {
    pub buzzer: B,
    pub motor: M,

    melody: &'static [Note],
    melody_idx: usize,
    note_end_ms: u64,
    active_hz: u16,

    motor_end_ms: u64,
    motor_duty: u8,
}

impl<B: BuzzerHal, M: MotorHal> Feedback<B, M> {
    pub fn new(buzzer: B, motor: M) -> Self {
        Self {
            buzzer,
            motor,
            melody: &[],
            melody_idx: 0,
            note_end_ms: 0,
            active_hz: 0,
            motor_end_ms: 0,
            motor_duty: 0,
        }
    }

    fn schedule_note(&mut self, note: &Note, start_ms: u64) {
        self.active_hz = note.hz;
        if note.hz == 0 {
            self.buzzer.stop_tone();
        } else {
            self.buzzer.play_tone(note.hz);
        }
        self.note_end_ms = start_ms + note.ms as u64;
    }

    fn start_melody(&mut self, notes: &'static [Note], now_ms: u64) {
        self.melody = notes;
        self.melody_idx = 0;
        if !notes.is_empty() {
            let first = notes[0];
            self.schedule_note(&first, now_ms);
        }
    }

    fn start_motor(&mut self, duty: u8, duration_ms: u32, now_ms: u64) {
        self.motor.set_duty(duty);
        self.motor_duty = duty;
        self.motor_end_ms = now_ms + duration_ms as u64;
    }

    /// Advance sequencer – call every game tick.
    pub fn update(&mut self, now_ms: u64) {
        // Motor timeout
        if self.motor_duty > 0 && now_ms >= self.motor_end_ms {
            self.motor.set_duty(0);
            self.motor_duty = 0;
        }
        // Melody sequencer: advance through all notes whose end time has passed.
        // Using the previous note's scheduled end as the next note's start time
        // keeps the melody on its original schedule even when update() is called late.
        while !self.melody.is_empty() && now_ms >= self.note_end_ms {
            let prev_end = self.note_end_ms;
            self.melody_idx += 1;
            if self.melody_idx < self.melody.len() {
                let note = self.melody[self.melody_idx];
                self.schedule_note(&note, prev_end);
            } else {
                self.buzzer.stop_tone();
                self.active_hz = 0;
                self.melody = &[];
                break;
            }
        }
    }

    pub fn play_boot(&mut self, now_ms: u64) {
        self.start_melody(MELODY_BOOT, now_ms);
    }

    pub fn play_crash(&mut self, now_ms: u64) {
        self.start_melody(MELODY_CRASH, now_ms);
        self.start_motor(config::MOTOR_DUTY_CRASH, config::MOTOR_MS_CRASH, now_ms);
    }

    pub fn play_level_up(&mut self, now_ms: u64) {
        self.start_melody(MELODY_LEVELUP, now_ms);
        self.start_motor(config::MOTOR_DUTY_LEVELUP, config::MOTOR_MS_LEVELUP, now_ms);
    }

    pub fn play_victory(&mut self, now_ms: u64) {
        self.start_melody(MELODY_VICTORY, now_ms);
        self.start_motor(config::MOTOR_DUTY_VICTORY, config::MOTOR_MS_VICTORY, now_ms);
    }

    /// Current note frequency; 0 = silent.
    pub fn current_note(&self) -> u16 {
        self.active_hz
    }
    /// Current motor duty; 0 = off.
    pub fn motor_duty(&self) -> u8 {
        self.motor_duty
    }
}

// ── Feedback HAL trait (used by GameEngine) ─────────────────
pub trait FeedbackHal {
    fn update(&mut self, now_ms: u64);
    fn play_boot(&mut self, now_ms: u64);
    fn play_crash(&mut self, now_ms: u64);
    fn play_level_up(&mut self, now_ms: u64);
    fn play_victory(&mut self, now_ms: u64);
}

impl<B: BuzzerHal, M: MotorHal> FeedbackHal for Feedback<B, M> {
    fn update(&mut self, now_ms: u64) {
        Feedback::update(self, now_ms);
    }
    fn play_boot(&mut self, now_ms: u64) {
        Feedback::play_boot(self, now_ms);
    }
    fn play_crash(&mut self, now_ms: u64) {
        Feedback::play_crash(self, now_ms);
    }
    fn play_level_up(&mut self, now_ms: u64) {
        Feedback::play_level_up(self, now_ms);
    }
    fn play_victory(&mut self, now_ms: u64) {
        Feedback::play_victory(self, now_ms);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── Mock buzzer / motor ───────────────────────────────────
    #[derive(Default)]
    struct MockBuzzer {
        pub last_hz: u16,
        pub stopped: bool,
    }
    impl BuzzerHal for MockBuzzer {
        fn play_tone(&mut self, hz: u16) {
            self.last_hz = hz;
            self.stopped = false;
        }
        fn stop_tone(&mut self) {
            self.last_hz = 0;
            self.stopped = true;
        }
    }

    #[derive(Default)]
    struct MockMotor {
        pub duty: u8,
    }
    impl MotorHal for MockMotor {
        fn set_duty(&mut self, d: u8) {
            self.duty = d;
        }
    }

    fn make() -> Feedback<MockBuzzer, MockMotor> {
        Feedback::new(MockBuzzer::default(), MockMotor::default())
    }

    #[test]
    fn boot_starts_first_note() {
        let mut fb = make();
        fb.play_boot(0);
        assert_eq!(fb.current_note(), G4);
        assert_eq!(fb.buzzer.last_hz, G4);
        assert_eq!(fb.motor_duty(), 0); // no motor on boot
    }

    #[test]
    fn crash_starts_note_and_motor() {
        let mut fb = make();
        fb.play_crash(0);
        assert_eq!(fb.current_note(), A3);
        assert_eq!(fb.motor_duty(), config::MOTOR_DUTY_CRASH);
    }

    #[test]
    fn melody_advances_on_update() {
        let mut fb = make();
        fb.play_boot(0);
        // first note duration is 80 ms; at t=100 it should advance
        fb.update(100);
        // after G4(80ms) + REST(20ms) the second note C5 starts at t=100
        assert_eq!(fb.current_note(), C5);
    }

    #[test]
    fn melody_ends_and_clears_hz() {
        let mut fb = make();
        // MELODY_CRASH is only two notes: A3(80) + REST(20) + E3(130)
        fb.play_crash(0);
        fb.update(100); // advance past A3+REST
        fb.update(250); // advance past E3 (total 230 ms)
        assert_eq!(fb.current_note(), 0);
    }

    #[test]
    fn motor_stops_after_duration() {
        let mut fb = make();
        fb.play_crash(0);
        assert_eq!(fb.motor_duty(), config::MOTOR_DUTY_CRASH);
        fb.update(config::MOTOR_MS_CRASH as u64 + 1);
        assert_eq!(fb.motor_duty(), 0);
        assert_eq!(fb.motor.duty, 0);
    }

    #[test]
    fn level_up_sets_correct_motor_duty() {
        let mut fb = make();
        fb.play_level_up(0);
        assert_eq!(fb.motor_duty(), config::MOTOR_DUTY_LEVELUP);
    }

    #[test]
    fn victory_sets_max_motor_duty() {
        let mut fb = make();
        fb.play_victory(0);
        assert_eq!(fb.motor_duty(), config::MOTOR_DUTY_VICTORY);
    }

    #[test]
    fn rest_note_calls_stop_tone() {
        let mut fb = make();
        fb.play_boot(0);
        fb.update(80); // advance past G4(80ms); next note is REST
        assert!(fb.buzzer.stopped);
    }
}
