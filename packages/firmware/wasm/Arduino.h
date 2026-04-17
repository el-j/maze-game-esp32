#pragma once
// ================================================================
//  Arduino.h  –  Minimal Arduino shim for Emscripten / WASM build
// ================================================================
//  Provides just enough of the Arduino API for Game.cpp, Feedback.cpp,
//  Display_wasm.cpp, and Motion_wasm.cpp to compile with emcc.
//  Hardware-specific functions (tone, ledcWrite, …) are defined in
//  hal_wasm.cpp and call back into JavaScript via EM_JS macros.
// ================================================================

#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include <math.h>
#include <stdlib.h>
#include <emscripten.h>

#include "binary.h"

// ── Integer typedefs (match Arduino conventions) ────────────
typedef uint8_t  byte;
typedef uint16_t word;

// ── Pin constants ────────────────────────────────────────────
#define HIGH 1
#define LOW  0
#define INPUT  0
#define OUTPUT 1
#define INPUT_PULLUP 2

// ── Bit manipulation macros ──────────────────────────────────
#define bitRead(v, b)      (((v) >> (b)) & 0x01)
#define bitSet(v, b)       ((v) |= (1UL << (b)))
#define bitClear(v, b)     ((v) &= ~(1UL << (b)))
#define bitWrite(v, b, bv) ((bv) ? bitSet(v, b) : bitClear(v, b))

// ── Timing ───────────────────────────────────────────────────
// emscripten_get_now() returns milliseconds as a double.
inline unsigned long millis() {
  return static_cast<unsigned long>(emscripten_get_now());
}
inline unsigned long micros() {
  return static_cast<unsigned long>(emscripten_get_now() * 1000.0);
}
// delay() is a no-op in WASM: the game loop drives timing instead.
inline void delay(unsigned long) {}
inline void delayMicroseconds(unsigned int) {}

// ── GPIO stubs (implemented in hal_wasm.cpp) ─────────────────
void pinMode(uint8_t pin, uint8_t mode);
int  digitalRead(uint8_t pin);
void digitalWrite(uint8_t pin, uint8_t val);
int  analogRead(uint8_t pin);

// ── Audio stubs (implemented in hal_wasm.cpp) ────────────────
void tone(uint8_t pin, unsigned int frequency);
void tone(uint8_t pin, unsigned int frequency, unsigned long duration);
void noTone(uint8_t pin);

// ── LEDC (PWM) stubs (implemented in hal_wasm.cpp) ──────────
void     ledcAttach(uint8_t pin, uint32_t freq, uint8_t resolution_bits);
void     ledcWrite(uint8_t pin, uint32_t duty);
void     ledcDetach(uint8_t pin);

// ── Minimal Serial stub ──────────────────────────────────────
struct _Serial_t {
  void begin(unsigned long) {}
  template<typename T> void print(T)   {}
  template<typename T> void println(T) {}
  template<typename T, typename U> void print(T, U) {}
  void printf(const char* fmt, ...) {}
  int available() { return 0; }
  int read() { return -1; }
};
extern _Serial_t Serial;

// ── IRAM_ATTR / ISR attributes ────────────────────────────────
// No-op on WASM: there is no ISR mechanism in the browser.
#define IRAM_ATTR
#define DRAM_ATTR

// ── FreeRTOS critical-section macros (used by Display.cpp) ───
// Replaced by Display_wasm.cpp which omits the mutex entirely.
// These stubs silence "undeclared identifier" errors if any header
// includes portmacro.h style macros.
typedef int portMUX_TYPE;
#define portMUX_INITIALIZER_UNLOCKED 0
#define portENTER_CRITICAL(m)        (void)(m)
#define portEXIT_CRITICAL(m)         (void)(m)
#define portENTER_CRITICAL_ISR(m)    (void)(m)
#define portEXIT_CRITICAL_ISR(m)     (void)(m)

// ── Hardware timer types (not used in WASM) ──────────────────
typedef void hw_timer_t;
inline hw_timer_t* timerBegin(uint32_t) { return nullptr; }
inline void timerAttachInterrupt(hw_timer_t*, void(*)()) {}
inline void timerAlarm(hw_timer_t*, uint64_t, bool, uint64_t) {}
