//! State machine, physics, collision detection, and rendering.
//! Exact port of packages/firmware/src/Game.cpp.
//!
//! `GameEngine<D, M, F>` is generic over hardware traits so the
//! entire game loop can be unit-tested on the host without GPIO.

use crate::config;
use crate::display::{Display, DisplayBuffer};
use crate::feedback::FeedbackHal;
use crate::levels::{self, LEVELS};
use crate::motion::Motion;

// ── Pre-defined display frames ─────────────────────────────────
const FRAME_TITLE: [u8; 8] = [0x00, 0x00, 0x24, 0x00, 0x00, 0x42, 0x3C, 0x00];
const FRAME_GAMEOVER: [u8; 8] = [0x00, 0x42, 0x24, 0x18, 0x18, 0x24, 0x42, 0x00];
const FRAME_VICTORY: [u8; 8] = [0x00, 0x01, 0x02, 0x84, 0x48, 0x30, 0x00, 0x00];

/// Game state enum – exact analogue of the C++ enum.
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum State {
    Title = 0,
    Playing = 1,
    Crashed = 2,
    GameOver = 3,
    Victory = 4,
    /// Brief non-blocking pause between levels (replaces the blocking
    /// `delay(LEVELUP_PAUSE_MS)` that the C++ firmware originally used, which
    /// is a no-op in the WASM browser build).
    LevelUp = 5,
}

pub struct GameEngine<D: Display, M: Motion, F: FeedbackHal> {
    pub display: D,
    pub motion: M,
    pub feedback: F,

    state: State,
    lives: i32,
    level: usize,

    player_x: f32,
    player_y: f32,
    vel_x: f32,
    vel_y: f32,

    crashed_at_ms: u64,
    /// Timestamp set when entering `State::LevelUp`; advance to the next level
    /// once `LEVELUP_PAUSE_MS` has elapsed.
    levelup_at_ms: u64,
    /// Earliest `now_ms` at which the next button press will be accepted.
    /// Prevents a single held button from cascading through multiple state
    /// transitions (GAMEOVER → TITLE → PLAYING in one press).
    debounce_until_ms: u64,
    buf: DisplayBuffer,
}

impl<D: Display, M: Motion, F: FeedbackHal> GameEngine<D, M, F> {
    pub fn new(display: D, motion: M, feedback: F) -> Self {
        let mut engine = Self {
            display,
            motion,
            feedback,
            state: State::Title,
            lives: config::STARTING_LIVES,
            level: 0,
            // player_x / player_y / vel_x / vel_y are placeholder zeros here;
            // respawn() below immediately overwrites them with the correct
            // start coordinates for level 0.
            player_x: 0.0,
            player_y: 0.0,
            vel_x: 0.0,
            vel_y: 0.0,
            crashed_at_ms: 0,
            levelup_at_ms: 0,
            debounce_until_ms: 0,
            buf: DisplayBuffer::default(),
        };
        engine.respawn();
        engine
    }

    /// Reset the engine to its initial state and play the boot jingle.
    ///
    /// # Intentional divergence from C++
    ///
    /// In the C++ codebase `gameInit()` does **not** trigger audio; the boot
    /// jingle is started by `main.cpp::setup()` after `gameInit()` returns.
    /// Here the call is incorporated into `init()` so that any caller —
    /// including the WASM host and unit tests — gets a fully self-contained
    /// initialisation without needing to know about the audio subsystem.
    pub fn init(&mut self, now_ms: u64) {
        self.state = State::Title;
        self.lives = config::STARTING_LIVES;
        self.level = 0;
        self.crashed_at_ms = 0;
        self.levelup_at_ms = 0;
        self.debounce_until_ms = 0;
        self.respawn();
        self.feedback.play_boot(now_ms);
        self.buf.load(&FRAME_TITLE);
        let buf = self.buf;
        self.display.draw(&buf);
    }

    fn respawn(&mut self) {
        self.player_x = levels::START_X[self.level] as f32;
        self.player_y = levels::START_Y[self.level] as f32;
        self.vel_x = 0.0;
        self.vel_y = 0.0;
    }

    /// Advance state machine by one tick.
    /// `btn` = true while the start button is held.
    /// `now_ms` = current monotonic time in milliseconds.
    pub fn tick(&mut self, btn: bool, now_ms: u64) {
        self.feedback.update(now_ms);
        match self.state {
            State::Title => self.tick_title(btn, now_ms),
            State::Playing => self.tick_playing(now_ms),
            State::Crashed => self.tick_crashed(now_ms),
            State::GameOver => self.tick_gameover(btn, now_ms),
            State::Victory => self.tick_victory(btn, now_ms),
            State::LevelUp => self.tick_levelup(now_ms),
        }
    }

    fn tick_title(&mut self, btn: bool, now_ms: u64) {
        self.buf.load(&FRAME_TITLE);
        let buf = self.buf;
        self.display.draw(&buf);
        if btn && now_ms >= self.debounce_until_ms {
            self.lives = config::STARTING_LIVES;
            self.level = 0;
            self.respawn();
            self.state = State::Playing;
            self.debounce_until_ms = now_ms + config::DEBOUNCE_MS;
        }
    }

    fn tick_playing(&mut self, now_ms: u64) {
        let tilt = self.motion.read();
        // Physics: velocity + friction
        self.vel_x = (self.vel_x + tilt.ax * config::SENSITIVITY) * config::FRICTION;
        self.vel_y = (self.vel_y + tilt.ay * config::SENSITIVITY) * config::FRICTION;

        let next_x = self.player_x + self.vel_x;
        let next_y = self.player_y + self.vel_y;

        let mut crashed = false;

        // X-axis collision
        let next_x = if !(0.0..8.0).contains(&next_x)
            || levels::is_wall(self.level, next_x as usize, self.player_y as usize)
        {
            self.vel_x = -self.vel_x * 0.5;
            crashed = true;
            self.player_x
        } else {
            next_x
        };

        // Y-axis collision
        let next_y = if !(0.0..8.0).contains(&next_y)
            || levels::is_wall(self.level, self.player_x as usize, next_y as usize)
        {
            self.vel_y = -self.vel_y * 0.5;
            crashed = true;
            self.player_y
        } else {
            next_y
        };

        if crashed {
            self.feedback.play_crash(now_ms);
            self.lives -= 1;
            if self.lives <= 0 {
                self.state = State::GameOver;
            } else {
                self.crashed_at_ms = now_ms;
                self.state = State::Crashed;
            }
            return;
        }

        self.player_x = next_x;
        self.player_y = next_y;

        // Win condition
        if self.player_x as usize == levels::GOAL_X[self.level]
            && self.player_y as usize == levels::GOAL_Y[self.level]
        {
            self.level += 1;
            if self.level >= levels::NUM_LEVELS {
                self.feedback.play_victory(now_ms);
                self.state = State::Victory;
            } else {
                // Begin the level-up pause.  The display retains the current
                // frame (completed level with the player on the goal) until the
                // pause expires and tick_levelup() calls respawn().
                self.feedback.play_level_up(now_ms);
                self.levelup_at_ms = now_ms;
                self.state = State::LevelUp;
            }
            return;
        }

        // Render: level walls + player + blinking goal
        self.buf.load(&LEVELS[self.level]);
        let px = self.player_x as usize;
        let py = self.player_y as usize;
        self.buf.set_pixel(px, py, true);
        let goal_visible = (now_ms / 200).is_multiple_of(2);
        let gx = levels::GOAL_X[self.level];
        let gy = levels::GOAL_Y[self.level];
        self.buf.set_pixel(gx, gy, goal_visible);
        let buf = self.buf;
        self.display.draw(&buf);
    }

    fn tick_crashed(&mut self, now_ms: u64) {
        let elapsed = now_ms.saturating_sub(self.crashed_at_ms);
        let dots_visible = (elapsed / 160).is_multiple_of(2);
        self.buf.clear();
        if dots_visible {
            for i in 0..self.lives as usize {
                self.buf.set_pixel(i + 2, 3, true);
            }
        }
        let buf = self.buf;
        self.display.draw(&buf);
        if elapsed >= config::CRASH_DISPLAY_MS {
            self.respawn();
            self.state = State::Playing;
        }
    }

    fn tick_gameover(&mut self, btn: bool, now_ms: u64) {
        self.buf.load(&FRAME_GAMEOVER);
        let buf = self.buf;
        self.display.draw(&buf);
        if btn && now_ms >= self.debounce_until_ms {
            self.state = State::Title;
            self.debounce_until_ms = now_ms + config::DEBOUNCE_MS;
        }
    }

    fn tick_victory(&mut self, btn: bool, now_ms: u64) {
        self.buf.load(&FRAME_VICTORY);
        let buf = self.buf;
        self.display.draw(&buf);
        if btn && now_ms >= self.debounce_until_ms {
            self.state = State::Title;
            self.debounce_until_ms = now_ms + config::DEBOUNCE_MS;
        }
    }

    /// Non-blocking level-up pause: hold the completed level's last frame on
    /// screen for `LEVELUP_PAUSE_MS` then spawn the player on the next level.
    fn tick_levelup(&mut self, now_ms: u64) {
        if now_ms.saturating_sub(self.levelup_at_ms) >= config::LEVELUP_PAUSE_MS {
            self.respawn();
            self.state = State::Playing;
        }
        // Display buffer retains the last rendered frame (completed level with
        // player on goal) – no draw call needed here.
    }

    // ── Diagnostic getters ────────────────────────────────────
    #[must_use]
    pub fn state(&self) -> State {
        self.state
    }
    #[must_use]
    pub fn lives(&self) -> i32 {
        self.lives
    }
    #[must_use]
    pub fn level(&self) -> usize {
        self.level
    }
    #[must_use]
    pub fn player_x(&self) -> f32 {
        self.player_x
    }
    #[must_use]
    pub fn player_y(&self) -> f32 {
        self.player_y
    }
}

// ── Tests ─────────────────────────────────────────────────────
#[cfg(test)]
mod tests {
    use super::*;
    use crate::motion::{mock::MockMotion, Tilt};

    // ── Test doubles ─────────────────────────────────────────

    struct NullDisplay;
    impl Display for NullDisplay {
        fn draw(&mut self, _: &DisplayBuffer) {}
        fn clear(&mut self) {}
    }

    /// Captures the last frame written by `draw()` so rendering tests can
    /// inspect what would appear on the physical LED matrix.
    struct RecordingDisplay {
        pub last: DisplayBuffer,
    }
    impl Display for RecordingDisplay {
        fn draw(&mut self, buf: &DisplayBuffer) {
            self.last = *buf;
        }
        fn clear(&mut self) {
            self.last = DisplayBuffer::default();
        }
    }
    impl RecordingDisplay {
        fn new() -> Self {
            Self {
                last: DisplayBuffer::default(),
            }
        }
    }

    struct NullFeedback;
    impl FeedbackHal for NullFeedback {
        fn update(&mut self, _: u64) {}
        fn play_boot(&mut self, _: u64) {}
        fn play_crash(&mut self, _: u64) {}
        fn play_level_up(&mut self, _: u64) {}
        fn play_victory(&mut self, _: u64) {}
    }

    struct RecordingFeedback {
        pub crashes: u32,
        pub level_ups: u32,
        pub victories: u32,
    }
    impl RecordingFeedback {
        fn new() -> Self {
            Self {
                crashes: 0,
                level_ups: 0,
                victories: 0,
            }
        }
    }
    impl FeedbackHal for RecordingFeedback {
        fn update(&mut self, _: u64) {}
        fn play_boot(&mut self, _: u64) {}
        fn play_crash(&mut self, _: u64) {
            self.crashes += 1;
        }
        fn play_level_up(&mut self, _: u64) {
            self.level_ups += 1;
        }
        fn play_victory(&mut self, _: u64) {
            self.victories += 1;
        }
    }

    fn flat_engine() -> GameEngine<NullDisplay, MockMotion, NullFeedback> {
        GameEngine::new(
            NullDisplay,
            MockMotion {
                tilt: Tilt { ax: 0.0, ay: 0.0 },
            },
            NullFeedback,
        )
    }

    // ── Tests ─────────────────────────────────────────────────

    #[test]
    fn title_tick_draws_title_frame() {
        let mut e = GameEngine::new(
            RecordingDisplay::new(),
            MockMotion {
                tilt: Tilt { ax: 0.0, ay: 0.0 },
            },
            NullFeedback,
        );
        e.tick(false, 0);
        assert_eq!(
            e.display.last.rows, FRAME_TITLE,
            "tick_title must render FRAME_TITLE"
        );
    }

    #[test]
    fn gameover_tick_draws_gameover_frame() {
        let mut e = GameEngine::new(
            RecordingDisplay::new(),
            MockMotion {
                tilt: Tilt { ax: 0.0, ay: 0.0 },
            },
            NullFeedback,
        );
        e.state = State::GameOver;
        e.tick(false, 0);
        assert_eq!(
            e.display.last.rows, FRAME_GAMEOVER,
            "tick_gameover must render FRAME_GAMEOVER"
        );
    }

    #[test]
    fn victory_tick_draws_victory_frame() {
        let mut e = GameEngine::new(
            RecordingDisplay::new(),
            MockMotion {
                tilt: Tilt { ax: 0.0, ay: 0.0 },
            },
            NullFeedback,
        );
        e.state = State::Victory;
        e.tick(false, 0);
        assert_eq!(
            e.display.last.rows, FRAME_VICTORY,
            "tick_victory must render FRAME_VICTORY"
        );
    }

    #[test]
    fn initial_state_is_title() {
        let e = flat_engine();
        assert_eq!(e.state(), State::Title);
        assert_eq!(e.lives(), config::STARTING_LIVES);
        assert_eq!(e.level(), 0);
    }

    #[test]
    fn button_press_starts_game() {
        let mut e = flat_engine();
        e.tick(true, 0);
        assert_eq!(e.state(), State::Playing);
    }

    #[test]
    fn no_button_stays_on_title() {
        let mut e = flat_engine();
        e.tick(false, 0);
        assert_eq!(e.state(), State::Title);
    }

    #[test]
    fn flat_tilt_keeps_player_near_start() {
        let mut e = flat_engine();
        e.tick(true, 0); // start game
        let x0 = e.player_x();
        let y0 = e.player_y();
        for _ in 0..10 {
            e.tick(false, 0);
        }
        // With zero tilt, velocity stays near zero; player should barely move
        assert!((e.player_x() - x0).abs() < 0.1);
        assert!((e.player_y() - y0).abs() < 0.1);
    }

    #[test]
    fn wall_crash_decrements_lives_and_transitions_to_crashed() {
        let mut e = GameEngine::new(
            NullDisplay,
            MockMotion {
                tilt: Tilt { ax: 10.0, ay: 0.0 },
            }, // strong rightward push
            NullFeedback,
        );
        e.tick(true, 0); // start
                         // Drive into a wall
        for _ in 0..100 {
            e.tick(false, 0);
        }
        assert!(
            e.lives() < config::STARTING_LIVES
                || e.state() == State::Crashed
                || e.state() == State::GameOver
        );
    }

    #[test]
    fn losing_all_lives_reaches_gameover() {
        let mut e = GameEngine::new(
            NullDisplay,
            MockMotion {
                tilt: Tilt { ax: 10.0, ay: 0.0 },
            },
            NullFeedback,
        );
        e.tick(true, 0);
        // Run long enough to exhaust all lives
        let mut t = 0u64;
        for _ in 0..5000 {
            t += 20;
            e.tick(false, t);
            if e.state() == State::GameOver {
                break;
            }
        }
        assert_eq!(e.state(), State::GameOver);
    }

    #[test]
    fn gameover_button_returns_to_title() {
        let mut e = flat_engine();
        // Force gameover manually
        e.lives = 0;
        e.state = State::GameOver;
        e.tick(true, 0);
        assert_eq!(e.state(), State::Title);
    }

    #[test]
    fn victory_button_returns_to_title() {
        let mut e = flat_engine();
        e.state = State::Victory;
        e.tick(true, 0);
        assert_eq!(e.state(), State::Title);
    }

    #[test]
    fn crash_display_auto_resumes_after_timeout() {
        let mut e = flat_engine();
        e.tick(true, 0); // start
                         // Force crashed state
        e.state = State::Crashed;
        e.crashed_at_ms = 0;
        e.tick(false, config::CRASH_DISPLAY_MS + 1);
        assert_eq!(e.state(), State::Playing);
    }

    #[test]
    fn feedback_play_crash_called_on_wall_hit() {
        let mut e = GameEngine::new(
            NullDisplay,
            MockMotion {
                tilt: Tilt { ax: 20.0, ay: 0.0 },
            },
            RecordingFeedback::new(),
        );
        e.tick(true, 0);
        let mut t = 0u64;
        for _ in 0..200 {
            t += 20;
            e.tick(false, t);
            if e.feedback.crashes > 0 {
                break;
            }
        }
        assert!(e.feedback.crashes > 0);
    }

    #[test]
    fn levelup_pause_delays_respawn() {
        let mut e = flat_engine();
        e.tick(true, 0); // start game
                         // Force the engine into STATE_LEVELUP as it would be after reaching a goal.
        e.state = State::LevelUp;
        e.levelup_at_ms = 0;
        // Before the pause expires the state must not advance.
        e.tick(false, config::LEVELUP_PAUSE_MS - 1);
        assert_eq!(e.state(), State::LevelUp, "should still be in LevelUp");
        // After the pause expires the engine must transition to Playing.
        e.tick(false, config::LEVELUP_PAUSE_MS + 1);
        assert_eq!(e.state(), State::Playing, "should advance to Playing");
    }

    #[test]
    fn button_debounce_prevents_immediate_state_cascade() {
        let mut e = flat_engine();
        // Press the button at t=0 to go from Title → Playing.
        e.tick(true, 0);
        assert_eq!(e.state(), State::Playing);
        // Manually force back to Title and keep the button held.
        e.state = State::Title;
        // Within the debounce window the button must be ignored.
        e.tick(true, config::DEBOUNCE_MS - 1);
        assert_eq!(
            e.state(),
            State::Title,
            "button press within debounce window should be ignored"
        );
        // After the debounce window expires the button is accepted again.
        e.tick(true, config::DEBOUNCE_MS + 1);
        assert_eq!(
            e.state(),
            State::Playing,
            "button press after debounce window should be accepted"
        );
    }
}
