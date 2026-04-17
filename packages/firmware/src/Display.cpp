// ================================================================
//  Display.cpp  –  8×8 LED Matrix – ISR Multiplexer & Render
// ================================================================
//  How the hardware works
//  ──────────────────────
//  The matrix has 8 row pins (anodes) and 8 column pins (cathodes).
//  To light the LED at (col, row):
//    • Drive the row pin HIGH  (source current)
//    • Drive the col pin LOW   (sink current)
//  Only one row is active at a time to stay within ESP32 current
//  limits.  The ISR cycles through all 8 rows every 8 ms (125 Hz),
//  which appears perfectly steady to the human eye.
//
//  Thread safety
//  ─────────────
//  displayBuffer[] is shared between the ISR (read) and the game
//  loop (write).  All writes use portENTER_CRITICAL so the ISR
//  never reads a half-updated frame.
// ================================================================

#include "Display.h"

// ── Pin Mapping ─────────────────────────────────────────────
// Rows = anodes  (drive HIGH to activate a row)
static const int ROW_PINS[8] = {13, 16, 17,  5, 18, 19, 23, 25};

// Columns = cathodes (drive LOW to light an LED in the active row)
// NOTE: GPIO 0 is used for COL 7.  The DevKit's on-board 10 kΩ
// pull-up keeps it HIGH at boot (= normal run mode).  See the
// wiring guide if you experience boot-mode issues.
static const int COL_PINS[8] = {26, 32, 33, 27, 14, 12, 15,  0};

// ── Display Buffer ──────────────────────────────────────────
// 8 bytes – one per row.  Bit 7 = column 0 (leftmost).
// volatile because the ISR reads it from a different context.
volatile byte displayBuffer[8] = {0};
volatile int  currentRow       = 0;

// Hardware timer handle (allocated in displayStartMux).
static hw_timer_t *muxTimer = nullptr;

// Mutex used to safely share displayBuffer between ISR and loop().
static portMUX_TYPE muxLock = portMUX_INITIALIZER_UNLOCKED;

// ── ISR ─────────────────────────────────────────────────────
// Runs every 1 ms.  IRAM_ATTR ensures it is stored in fast IRAM
// so it executes even if the flash cache is being refilled.
void IRAM_ATTR onTimerISR() {
  portENTER_CRITICAL_ISR(&muxLock);

  // Step 1 – Blank all column pins to prevent ghosting.
  //          Ghosting happens when the next row turns on before
  //          columns are updated; this prevents visible artefacts.
  for (int i = 0; i < 8; i++) {
    digitalWrite(COL_PINS[i], HIGH); // HIGH = cathode off
  }

  // Step 2 – Deactivate the row that was just lit.
  digitalWrite(ROW_PINS[currentRow], LOW);

  // Step 3 – Advance to the next row (wraps 7 → 0).
  currentRow = (currentRow + 1) % 8;

  // Step 4 – Apply the column data for the new row.
  //          Bit 7 of the buffer byte corresponds to column 0.
  byte rowData = displayBuffer[currentRow];
  for (int col = 0; col < 8; col++) {
    if (bitRead(rowData, 7 - col)) {
      digitalWrite(COL_PINS[col], LOW); // LOW = cathode on → LED lights
    }
  }

  // Step 5 – Activate the new row (anode HIGH = current flows).
  digitalWrite(ROW_PINS[currentRow], HIGH);

  portEXIT_CRITICAL_ISR(&muxLock);
}

// ── Public API ──────────────────────────────────────────────

void displayInit() {
  for (int i = 0; i < 8; i++) {
    pinMode(ROW_PINS[i], OUTPUT);
    pinMode(COL_PINS[i], OUTPUT);
    digitalWrite(ROW_PINS[i], LOW);  // all rows off
    digitalWrite(COL_PINS[i], HIGH); // all columns off (cathode high)
  }
}

void displayStartMux() {
  // Create a 1 MHz timer (1 µs per tick).
  muxTimer = timerBegin(1000000);
  timerAttachInterrupt(muxTimer, &onTimerISR);
  // Fire every 1000 ticks = 1 ms, auto-reload, run forever.
  timerAlarm(muxTimer, 1000, true, 0);
}

void displayClear() {
  portENTER_CRITICAL(&muxLock);
  for (int i = 0; i < 8; i++) displayBuffer[i] = 0;
  portEXIT_CRITICAL(&muxLock);
}

void displayDraw(const byte rows[8]) {
  // Copy all 8 bytes in a single critical section so the ISR
  // never sees a partially-written frame.
  portENTER_CRITICAL(&muxLock);
  for (int i = 0; i < 8; i++) displayBuffer[i] = rows[i];
  portEXIT_CRITICAL(&muxLock);
}

void displayPixel(int x, int y, bool on) {
  if (x < 0 || x >= 8 || y < 0 || y >= 8) return;
  portENTER_CRITICAL(&muxLock);
  if (on) bitSet(displayBuffer[y],   7 - x);
  else    bitClear(displayBuffer[y], 7 - x);
  portEXIT_CRITICAL(&muxLock);
}

void displayGetBuffer(uint8_t out[8]) {
  // Snapshot the live display buffer under the ISR mutex.
  // The result is a copy; the caller owns it and no lock is held after return.
  portENTER_CRITICAL(&muxLock);
  for (int i = 0; i < 8; i++) out[i] = (uint8_t)displayBuffer[i];
  portEXIT_CRITICAL(&muxLock);
}
