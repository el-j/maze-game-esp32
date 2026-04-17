#pragma once
// ================================================================
//  config.h  –  Single Source of Truth for ALL Tuneable Values
// ================================================================
//  Everything a beginner might want to tweak lives here.
//  Change a constant, re-flash, and feel the difference.
//  No other file needs editing for basic customisation.
// ================================================================

// ── GPIO Pin Assignments ─────────────────────────────────────
//  These pins were chosen to avoid the ESP32's "strapping" and
//  serial-port pins so the Serial Monitor keeps working and the
//  board boots reliably.  See docs/WIRING_GUIDE.md for details.

#define MOTOR_PIN   4   // DC motor via NPN transistor (PWM output)
#define BUZZER_PIN  2   // Piezo buzzer positive leg
#define BUTTON_PIN  34  // Tactile start button.
                        // GPIO 34 is INPUT-ONLY – no internal
                        // pull-up/down.  Wire a 10 kΩ pull-down
                        // to GND and connect the other button
                        // leg to 3.3 V.

// ── Physics Tuning ──────────────────────────────────────────
//  These three values control the "feel" of the rolling ball.
//
//  Experiment tip: adjust one value at a time, re-flash, play
//  for 30 seconds, then decide whether to go higher or lower.

#ifdef WASM_BUILD
// In the browser demo these are runtime-adjustable via the Dev HUD
// sliders.  Defined as globals in packages/firmware/wasm/config_wasm.cpp
// and exposed through wasmSet*() exports.
extern float SENSITIVITY;
extern float FRICTION;
extern float DEADZONE;
extern int   STARTING_LIVES;
#else
// How strongly the tilt angle translates into ball speed.
// Too high → ball flies across the screen uncontrollably.
// Too low  → feels sluggish and unresponsive.
// Good starting range: 0.03 – 0.10
constexpr float SENSITIVITY = 0.05f;

// Speed multiplier applied every physics frame (0.0 – 1.0).
// 1.0 = frictionless ice rink.  0.70 = thick mud.
// Values around 0.80 – 0.90 feel most game-like.
constexpr float FRICTION = 0.85f;

// Minimum acceleration (m/s²) that counts as intentional tilt.
// Raise this if the ball creeps on its own from hand tremor.
// Lower this if you have to tilt the board very far to move.
constexpr float DEADZONE = 0.50f;

// ── Game Rules ──────────────────────────────────────────────
constexpr int STARTING_LIVES   = 3;    // Lives at game start
#endif

// ── IMU Calibration ─────────────────────────────────────────
// Number of sensor readings averaged during the boot calibration.
// More samples = more accurate zero-point, but longer startup.
constexpr int IMU_CAL_SAMPLES = 100;

// ── Haptic Motor PWM ────────────────────────────────────────
// The motor is driven via an NPN transistor from a PWM pin.
// The PWM duty cycle controls spin speed (0 = off, 255 = full).

constexpr uint32_t MOTOR_PWM_FREQ = 5000; // PWM carrier Hz
constexpr uint8_t  MOTOR_PWM_BITS = 8;    // 8-bit = 0..255 duty

// Duty cycle for each event.  Raise values for more aggressive
// rumble; lower for subtler vibration.
constexpr uint8_t MOTOR_DUTY_CRASH   = 160; // ~63 % – soft thump
constexpr uint8_t MOTOR_DUTY_LEVELUP = 200; // ~78 % – sharp buzz
constexpr uint8_t MOTOR_DUTY_VICTORY = 255; // 100 % – full shake

// How long (ms) each haptic event lasts.
constexpr uint16_t MOTOR_MS_CRASH   = 250;
constexpr uint16_t MOTOR_MS_LEVELUP = 150;
constexpr uint16_t MOTOR_MS_VICTORY = 600;

// ── Game Rules ──────────────────────────────────────────────
constexpr int CRASH_DISPLAY_MS = 1500; // ms to show crash screen
constexpr int LEVELUP_PAUSE_MS = 1200; // ms pause before next level
