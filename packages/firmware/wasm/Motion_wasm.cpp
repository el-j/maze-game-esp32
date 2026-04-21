// ================================================================
//  Motion_wasm.cpp  –  Tilt input driver for WASM
// ================================================================
//  Replaces Motion.cpp for the browser build.  Instead of reading a
//  real MPU6050 over I²C, tilt values are injected from JavaScript
//  by the useInput hook via wasmSetTilt().
//
//  The deadzone is still applied here (same logic as Motion.cpp)
//  so the C++ game physics are truly identical.
// ================================================================

#include "../src/Motion.h"
#include "../src/config.h"
#include "Arduino.h"
#include <math.h>

// Values injected by wasmSetTilt() each tick.
static float _ax = 0.0f;
static float _ay = 0.0f;

// ── Exported setter (called from JavaScript / main_wasm.cpp) ─
extern "C" void wasmSetTilt(float ax, float ay) {
  _ax = ax;
  _ay = ay;
}

// ── Public Motion API ────────────────────────────────────────
void motionInit()      {}   // no I²C to initialise
void motionCalibrate() {}   // no sensor offsets to measure

// In the WASM build tilt values are already cached by wasmSetTilt(); this
// is a no-op that satisfies the motionUpdate() call in Game.cpp.
void motionUpdate()    {}

float motionGetAx() {
  return (fabsf(_ax) < DEADZONE) ? 0.0f : _ax;
}

float motionGetAy() {
  return (fabsf(_ay) < DEADZONE) ? 0.0f : _ay;
}

void motionGetLastRaw(float &ax, float &ay, float &az) {
  ax = _ax;
  ay = _ay;
  az = 9.81f; // simulate gravity on a flat surface
}
