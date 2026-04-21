#![cfg_attr(not(test), no_std)]
//! maze-game-esp32 Rust firmware library.
//!
//! ## Architecture
//!
//! All pure game logic lives here and is tested on the host with `cargo test`.
//! `main.rs` (the `no_std` binary crate) wires this library to real ESP32
//! hardware using `esp-hal`.  The parallel C++ codebase in
//! `packages/firmware/` compiles the same logic to WebAssembly for the
//! browser demo via Emscripten.
//!
//! ## Hardware abstraction
//!
//! Hardware dependencies are hidden behind three trait families:
//!
//! | Trait | Implemented by |
//! |-------|----------------|
//! | [`display::Display`] | `HardwareDisplay` (main.rs) / `NullDisplay` (tests) |
//! | [`motion::Motion`] | `HardwareMotion` (main.rs) / [`motion::mock::MockMotion`] (tests) |
//! | [`feedback::FeedbackHal`] | [`feedback::Feedback<B, M>`] (main.rs + tests) |
//!
//! [`game::GameEngine`] is generic over all three, so the entire game loop
//! can be unit-tested without any GPIO or I²C dependency.

pub mod config;
pub mod display;
pub mod feedback;
pub mod game;
pub mod levels;
pub mod motion;
