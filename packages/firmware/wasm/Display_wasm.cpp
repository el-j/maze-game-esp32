// ================================================================
//  Display_wasm.cpp  –  8×8 display buffer driver for WASM
// ================================================================
//  Replaces Display.cpp for the browser build.  There is no ISR,
//  no timer, and no GPIO.  The display is a plain 8-byte array that
//  main_wasm.cpp copies out to JavaScript every animation frame.
// ================================================================

#include "../src/Display.h"
#include <string.h>
#include <stdint.h>

// Plain (non-volatile) buffer – no ISR contention in WASM.
static uint8_t buf[8] = {0};

void displayInit()     {}   // no GPIO to set up
void displayStartMux() {}   // no hardware timer needed

void displayClear() {
  memset(buf, 0, sizeof(buf));
}

void displayDraw(const byte rows[8]) {
  memcpy(buf, rows, 8);
}

void displayPixel(int x, int y, bool on) {
  if (x < 0 || x >= 8 || y < 0 || y >= 8) return;
  if (on) buf[y] |=  static_cast<uint8_t>(1u << (7 - x));
  else    buf[y] &= ~static_cast<uint8_t>(1u << (7 - x));
}

void displayGetBuffer(uint8_t out[8]) {
  memcpy(out, buf, 8);
}
