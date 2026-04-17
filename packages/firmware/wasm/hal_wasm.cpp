// ================================================================
//  hal_wasm.cpp  –  Arduino HAL shims for Emscripten / WASM build
// ================================================================
//  Implements the low-level Arduino functions that Feedback.cpp and
//  the rest of the firmware call.  Audio and motor output call back
//  into JavaScript via EM_JS so the browser can drive Web Audio and
//  the Vibration API.
//
//  JavaScript side must set up these window callbacks BEFORE the
//  first wasmTick() call:
//    window._wasmTone(freq: number)  – play square-wave at freq Hz
//                                      (freq=0 means silence)
//    window._wasmMotor(duty: number) – 0-255 motor duty; 0 = off
// ================================================================

#include "Arduino.h"
#include <emscripten.h>

// ── Serial singleton ─────────────────────────────────────────
_Serial_t Serial;

// ── GPIO stubs ───────────────────────────────────────────────
void pinMode(uint8_t, uint8_t) {}
int  digitalRead(uint8_t) { return 0; }
void digitalWrite(uint8_t, uint8_t) {}
int  analogRead(uint8_t) { return 0; }

// ── Audio: tone() / noTone() ─────────────────────────────────
// These are called by Feedback.cpp's melody sequencer.
// EM_JS defines a C++ function whose body executes as JavaScript.

EM_JS(void, tone, (uint8_t /*pin*/, unsigned int freq), {
  if (typeof window !== 'undefined' && typeof window._wasmTone === 'function') {
    window._wasmTone(freq);
  }
})

EM_JS(void, noTone, (uint8_t /*pin*/), {
  if (typeof window !== 'undefined' && typeof window._wasmTone === 'function') {
    window._wasmTone(0);
  }
})

// Overload with duration – Feedback.cpp doesn't use it but the
// Arduino.h header declares it; we need a definition to link.
void tone(uint8_t pin, unsigned int freq, unsigned long /*dur*/) {
  tone(pin, freq);
}

// ── Motor: ledcAttach() / ledcWrite() ────────────────────────
// ledcAttach() sets up the PWM channel on real hardware; no-op here.
void ledcAttach(uint8_t, uint32_t, uint8_t) {}
void ledcDetach(uint8_t) {}

EM_JS(void, ledcWrite, (uint8_t /*pin*/, uint32_t duty), {
  if (typeof window !== 'undefined' && typeof window._wasmMotor === 'function') {
    window._wasmMotor(duty);
  }
})
