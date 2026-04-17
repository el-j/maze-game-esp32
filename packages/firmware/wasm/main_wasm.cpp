// ================================================================
//  main_wasm.cpp  –  WASM entry point for the browser demo
// ================================================================
//  Provides the C API that JavaScript / TypeScript calls.
//  Compiled with Emscripten alongside:
//    packages/firmware/src/Game.cpp      (identical to firmware)
//    packages/firmware/src/Feedback.cpp  (identical to firmware)
//    packages/firmware/wasm/Display_wasm.cpp
//    packages/firmware/wasm/Motion_wasm.cpp
//    packages/firmware/wasm/hal_wasm.cpp
//    packages/firmware/wasm/config_wasm.cpp
//
//  Build command (run by CI – see .github/workflows/pages.yml):
//    emcc [sources] -I wasm/ -I src/ -DWASM_BUILD \
//         -s EXPORTED_FUNCTIONS=[see EXPORTED_FUNCTIONS below] \
//         -s EXPORTED_RUNTIME_METHODS='["HEAPU8"]' \
//         -s MODULARIZE=1 -s EXPORT_NAME='MazeGame' \
//         -s ENVIRONMENT=web -s ALLOW_MEMORY_GROWTH=1 -O2 \
//         -o webapp/public/game.js
// ================================================================

#include "Arduino.h"
#include "../src/config.h"
#include "../src/Display.h"
#include "../src/Motion.h"
#include "../src/Feedback.h"
#include "../src/Game.h"
#include <emscripten.h>
#include <stdint.h>
#include <stdbool.h>

// Tilt injected from JavaScript (defined in Motion_wasm.cpp).
extern "C" void wasmSetTilt(float ax, float ay);

// Button state – held between ticks.
static bool _btn = false;

extern "C" {

// ── Lifecycle ────────────────────────────────────────────────

EMSCRIPTEN_KEEPALIVE
void wasmInit() {
  displayInit();
  feedbackInit();
  motionInit();
  motionCalibrate();
  displayStartMux();
  gameInit();
  feedbackPlayBoot();
}

// ── Per-tick update (call every 20 ms at 50 Hz) ──────────────
// feedbackUpdate() runs the non-blocking melody sequencer so melodies
// advance correctly even when there is no RTOS task scheduler.
EMSCRIPTEN_KEEPALIVE
void wasmTick() {
  feedbackUpdate();
  gameUpdate(_btn);
}

// ── Input injection ──────────────────────────────────────────

// wasmSetTilt is defined in Motion_wasm.cpp; re-export it here so
// the Emscripten EXPORTED_FUNCTIONS list has a single source of truth.
EMSCRIPTEN_KEEPALIVE
void wasmSetTiltExport(float ax, float ay) {
  wasmSetTilt(ax, ay);
}

EMSCRIPTEN_KEEPALIVE
void wasmSetButton(int pressed) {
  _btn = (pressed != 0);
}

// ── Display readback ─────────────────────────────────────────
// Copies the current 8-byte display buffer into caller-allocated memory.
// JavaScript: Module._wasmGetDisplay(ptr)
//             const buf = new Uint8Array(Module.HEAPU8.buffer, ptr, 8);
EMSCRIPTEN_KEEPALIVE
void wasmGetDisplay(uint8_t* out) {
  displayGetBuffer(out);
}

// ── Diagnostic readbacks (drive the Dev HUD) ─────────────────

EMSCRIPTEN_KEEPALIVE
uint16_t wasmNoteHz() {
  return feedbackCurrentNote();
}

EMSCRIPTEN_KEEPALIVE
uint8_t wasmMotorDuty() {
  return feedbackMotorDuty();
}

EMSCRIPTEN_KEEPALIVE
int wasmGetState() {
  return gameGetState();
}

EMSCRIPTEN_KEEPALIVE
int wasmGetLives() {
  return gameGetLives();
}

EMSCRIPTEN_KEEPALIVE
int wasmGetLevel() {
  return gameGetLevel();
}

// ── Dev HUD config setters ────────────────────────────────────
// Adjusting these mirrors editing config.h and re-flashing.

EMSCRIPTEN_KEEPALIVE
void wasmSetSensitivity(float v) { SENSITIVITY = v; }

EMSCRIPTEN_KEEPALIVE
void wasmSetFriction(float v) { FRICTION = v; }

EMSCRIPTEN_KEEPALIVE
void wasmSetDeadzone(float v) { DEADZONE = v; }

EMSCRIPTEN_KEEPALIVE
void wasmSetStartingLives(int v) { STARTING_LIVES = v; }

// ── Game control ─────────────────────────────────────────────

EMSCRIPTEN_KEEPALIVE
void wasmResetGame() {
  gameInit();
}

} // extern "C"
