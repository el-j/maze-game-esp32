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
// EM_JS creates a C-linkage function; using the same name as the C++
// declaration in Arduino.h causes a "different language linkage" error.
// Use private JS-bridge names and wrap them in regular C++ functions.

EM_JS(void, tone_js_shim, (unsigned int freq), {
  if (typeof window !== 'undefined' && typeof window._wasmTone === 'function') {
    window._wasmTone(freq);
  }
})

void tone(uint8_t /*pin*/, unsigned int freq) {
  tone_js_shim(freq);
}

void tone(uint8_t pin, unsigned int freq, unsigned long /*dur*/) {
  tone(pin, freq);
}

EM_JS(void, noTone_js_shim, (), {
  if (typeof window !== 'undefined' && typeof window._wasmTone === 'function') {
    window._wasmTone(0);
  }
})

void noTone(uint8_t /*pin*/) {
  noTone_js_shim();
}

// ── Motor: ledcAttach() / ledcWrite() ────────────────────────
// ledcAttach() sets up the PWM channel on real hardware; no-op here.
void ledcAttach(uint8_t, uint32_t, uint8_t) {}
void ledcDetach(uint8_t) {}

EM_JS(void, ledcWrite_js_shim, (uint32_t duty), {
  if (typeof window !== 'undefined' && typeof window._wasmMotor === 'function') {
    window._wasmMotor(duty);
  }
})

void ledcWrite(uint8_t /*pin*/, uint32_t duty) {
  ledcWrite_js_shim(duty);
}
