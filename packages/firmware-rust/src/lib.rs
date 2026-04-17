#![cfg_attr(not(test), no_std)]
//! maze-game-esp32 Rust firmware library.
//!
//! All pure game logic lives here, tested on the host.
//! `main.rs` wires this to real hardware using `esp-hal`.

pub mod config;
pub mod levels;
pub mod display;
pub mod motion;
pub mod feedback;
pub mod game;
