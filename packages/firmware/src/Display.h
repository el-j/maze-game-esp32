#pragma once
// ================================================================
//  Display.h  –  8×8 LED Matrix Controller
// ================================================================
//  The matrix has no driver IC.  The ESP32 drives 8 row pins
//  (anodes) and 8 column pins (cathodes) directly.
//
//  A hardware timer fires every 1 ms and activates one row at a
//  time (row-multiplexing).  The display runs entirely in the
//  background via an ISR, so the game loop never has to worry
//  about it.
//
//  Public API
//  ──────────
//  displayInit()                Configure GPIO pins for matrix.
//  displayStartMux()            Start the background ISR timer.
//  displayClear()               Turn off every LED.
//  displayDraw(rows)            Replace the entire frame atomically.
//  displayPixel(x, y, on)      Set or clear a single pixel.
//  displayGetBuffer(out)        Copy the current frame into out[8].
// ================================================================

#include <Arduino.h>

// Initialise all matrix GPIO pins as outputs and blank the display.
void displayInit();

// Start the 1 kHz hardware-timer interrupt that drives the matrix.
// Call once, after displayInit(), inside setup().
void displayStartMux();

// Turn off every LED.  Thread-safe (uses portENTER_CRITICAL).
void displayClear();

// Load a complete 8-row frame into the display buffer atomically.
// Each byte in rows[] represents one row: bit 7 = column 0 (left),
// bit 0 = column 7 (right).  A 1 bit lights the LED.
void displayDraw(const byte rows[8]);

// Set (on = true) or clear (on = false) a single pixel.
// x: column 0–7 (left to right)
// y: row    0–7 (top to bottom)
// Out-of-range coordinates are silently ignored.
void displayPixel(int x, int y, bool on = true);

// Copy the current frame into out[8].  Thread-safe snapshot.
// Used by the debug dashboard to mirror the LED matrix on-screen.
void displayGetBuffer(uint8_t out[8]);
