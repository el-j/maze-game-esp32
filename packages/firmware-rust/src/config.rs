//! All tuneable constants – same values as packages/firmware/src/config.h.
//! Change these, reflash, and feel the difference.

// ── GPIO Pin Numbers ──────────────────────────────────────────
pub const MOTOR_PIN: u8 = 4;
pub const BUZZER_PIN: u8 = 2;
pub const BUTTON_PIN: u8 = 34;

// Row pins (anodes – drive HIGH to activate a row)
pub const ROW_PINS: [u8; 8] = [13, 16, 17, 5, 18, 19, 23, 25];
// Column pins (cathodes – drive LOW to light an LED)
pub const COL_PINS: [u8; 8] = [26, 32, 33, 27, 14, 12, 15, 0];

// ── Physics ──────────────────────────────────────────────────
pub const SENSITIVITY: f32 = 0.05;
pub const FRICTION: f32 = 0.85;
pub const DEADZONE: f32 = 0.50;
pub const IMU_CAL_SAMPLES: u32 = 100;

// ── Haptic Motor PWM ─────────────────────────────────────────
pub const MOTOR_PWM_FREQ: u32 = 5_000; // Hz
pub const MOTOR_DUTY_CRASH: u8 = 160;
pub const MOTOR_DUTY_LEVELUP: u8 = 200;
pub const MOTOR_DUTY_VICTORY: u8 = 255;
pub const MOTOR_MS_CRASH: u32 = 250;
pub const MOTOR_MS_LEVELUP: u32 = 150;
pub const MOTOR_MS_VICTORY: u32 = 600;

// ── Game Rules ───────────────────────────────────────────────
pub const STARTING_LIVES: i32 = 3;
/// How long the crash screen is displayed before respawning (ms).
/// `u64` so it can be added directly to `now_ms` without a cast.
pub const CRASH_DISPLAY_MS: u64 = 1_500;
/// Duration of the non-blocking pause shown between levels (ms).
/// `u64` so it can be added directly to `now_ms` without a cast.
pub const LEVELUP_PAUSE_MS: u64 = 1_200;
/// Minimum milliseconds between accepted button presses.
/// Prevents a single held button from cascading through multiple state
/// transitions (e.g. GAMEOVER → TITLE → PLAYING in one press).
/// `u64` so it can be added directly to `now_ms` without a cast.
pub const DEBOUNCE_MS: u64 = 300;
