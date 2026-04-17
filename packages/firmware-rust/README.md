# maze-game-esp32 Rust Firmware

A `no_std` Rust port of the C++ ESP32 firmware, using [`esp-hal`](https://github.com/esp-rs/esp-hal) for hardware access.  All game logic is in a library crate testable on the host; `main.rs` wires it to real GPIO/I2C/LEDC peripherals.

## What it does

Runs a tilt-controlled maze game on an ESP32 with an 8×8 LED matrix, MPU-6050 accelerometer, piezo buzzer and haptic motor – an exact functional port of `packages/firmware/`.

## Architecture

```
src/
├── lib.rs       – pub mod declarations; no_std gate; cfg(test) re-exports
├── config.rs    – all constants (mirrors config.h)
├── levels.rs    – maze byte data + is_wall() + BFS solvability tests
├── display.rs   – DisplayBuffer (pure) + Display trait
├── motion.rs    – Motion trait + MockMotion for tests
├── feedback.rs  – non-blocking melody sequencer + haptic driver
├── game.rs      – GameEngine<D,M,F> generic state machine + unit tests
└── main.rs      – #![no_std] #![no_main] ESP32 hardware wiring
```

**Key principle**: `GameEngine` is generic over `Display`, `Motion`, and `FeedbackHal` traits, so the entire game loop is unit-testable on the host (x86-64 / aarch64) without any embedded hardware.

## Toolchain setup

The binary target requires the Xtensa Rust fork. Install it once via [`espup`](https://github.com/esp-rs/espup):

```bash
cargo install espup
espup install          # installs the 'esp' toolchain
```

`rust-toolchain.toml` pins the crate to the `esp` channel automatically.

## Building

### Host tests (no hardware required)

Run all library unit tests on the host:

```bash
cargo test
```

No features are needed – the library compiles to `std` mode for testing.

### ESP32 firmware (requires esp toolchain)

```bash
cargo build --release --features esp32-target
```

## Flashing

Connect the ESP32 via USB, then:

```bash
cargo run --release --features esp32-target
```

`espflash` (configured in `.cargo/config.toml`) flashes and opens a serial monitor automatically.

## Running tests

```bash
cargo test          # runs all lib tests on the host
cargo test -- --nocapture   # show println! output during tests
```

Expected output – all tests green:

```
test display::tests::clear_zeros_all_bytes ... ok
test display::tests::set_pixel_col0_row0 ... ok
...
test result: ok. N passed; 0 failed
```

## Size comparison

| Build        | Size (bytes) |
|--------------|-------------|
| C++ (Arduino)| ~TBD        |
| Rust release | ~TBD        |

Build with `cargo build --release --features esp32-target` and inspect with `cargo size`.

## Links

- [esp-hal documentation](https://docs.esp-rs.org/esp-hal/)
- [esp-rs book](https://esp-rs.github.io/book/)
- [Xtensa Rust toolchain](https://github.com/esp-rs/rust)
