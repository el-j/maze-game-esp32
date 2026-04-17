// ================================================================
//  Game.cpp  –  State Machine, Physics, Collision & Rendering
// ================================================================

#include "Game.h"
#include "config.h"
#include "Display.h"
#include "Motion.h"
#include "Feedback.h"
#include "Levels.h"

// ── Game State ──────────────────────────────────────────────
enum GameState {
  STATE_TITLE,
  STATE_PLAYING,
  STATE_CRASHED,
  STATE_GAMEOVER,
  STATE_VICTORY
};

static GameState state       = STATE_TITLE;
static int       lives       = STARTING_LIVES;
static int       level       = 0;

// ── Physics State ───────────────────────────────────────────
// Player position in floating-point grid coordinates.
// The integer part determines which cell the player occupies.
static float playerX = 1.0f;
static float playerY = 1.0f;
static float velX    = 0.0f;
static float velY    = 0.0f;

// ── Timing State ────────────────────────────────────────────
// Used for the timer-based crash screen (no blocking delay).
static unsigned long crashedAt = 0;

// ── Pre-defined display frames ──────────────────────────────
// Each array is a complete 8-row frame for a screen state.
// Bit 7 = column 0 (left edge).  1 = LED on.
// To redesign a screen: edit the bytes and re-flash.

// TITLE – a simple smiley face
static const byte FRAME_TITLE[8] = {
  B00000000,
  B00000000,
  B00100100, // ·· O ·· O ·· (eyes)
  B00000000,
  B00000000,
  B01000010, // · |····| ·   (mouth corners)
  B00111100, //  ·· ──── ··  (mouth arc)
  B00000000
};

// GAME OVER – bold X symbol
static const byte FRAME_GAMEOVER[8] = {
  B00000000,
  B01000010,
  B00100100,
  B00011000,
  B00011000,
  B00100100,
  B01000010,
  B00000000
};

// VICTORY – checkmark (✓) shape
static const byte FRAME_VICTORY[8] = {
  B00000000,
  B00000001,
  B00000010,
  B10000100,
  B01001000,
  B00110000,
  B00000000,
  B00000000
};

// ── Private helpers ─────────────────────────────────────────

// Transition into STATE_PLAYING: reset player to current level start.
static void respawn() {
  playerX = START_X[level];
  playerY = START_Y[level];
  velX    = 0.0f;
  velY    = 0.0f;
}

// ── State handlers ──────────────────────────────────────────

static void handleTitle(bool btn) {
  displayDraw(FRAME_TITLE);

  if (btn) {
    // Reset everything and start the first level
    lives = STARTING_LIVES;
    level = 0;
    respawn();
    state = STATE_PLAYING;
    delay(300); // simple debounce: ignore button for 300 ms
  }
}

static void handlePlaying() {
  // ── 1. Read tilt ────────────────────────────────────────
  float ax = motionGetAx(); // positive = tilt right
  float ay = motionGetAy(); // positive = tilt down

  // ── 2. Physics update ───────────────────────────────────
  // Velocity accumulates from acceleration and decays via friction.
  // This creates a natural momentum feel – the ball "rolls".
  velX = (velX + ax * SENSITIVITY) * FRICTION;
  velY = (velY + ay * SENSITIVITY) * FRICTION;

  float nextX = playerX + velX;
  float nextY = playerY + velY;

  // ── 3. Collision detection (split-axis) ─────────────────
  // Check X and Y independently so the ball can slide along walls
  // instead of stopping dead on diagonal approaches.
  bool crashed = false;

  // X-axis: try to move to nextX while staying at current row
  if (nextX < 0.0f || nextX >= 8.0f ||
      bitRead(levels[level][(int)playerY], 7 - (int)nextX)) {
    // Wall hit – reverse velocity so the bounce feels physical
    velX  = -velX * 0.5f;
    nextX = playerX; // reject the movement
    crashed = true;
  }

  // Y-axis: try to move to nextY while staying at current column
  if (nextY < 0.0f || nextY >= 8.0f ||
      bitRead(levels[level][(int)nextY], 7 - (int)playerX)) {
    velY  = -velY * 0.5f;
    nextY = playerY;
    crashed = true;
  }

  // ── 4. Apply movement or handle crash ───────────────────
  if (crashed) {
    feedbackPlayCrash();
    lives--;
    if (lives <= 0) {
      state = STATE_GAMEOVER;
    } else {
      crashedAt = millis();
      state     = STATE_CRASHED;
    }
    return; // skip win check this frame
  }

  playerX = nextX;
  playerY = nextY;

  // ── 5. Win condition ────────────────────────────────────
  if ((int)playerX == GOAL_X[level] && (int)playerY == GOAL_Y[level]) {
    level++;
    if (level >= NUM_LEVELS) {
      // All levels complete!
      feedbackPlayVictory();
      state = STATE_VICTORY;
    } else {
      // Advance to the next level
      feedbackPlayLevelUp();
      respawn();
      delay(LEVELUP_PAUSE_MS); // Brief celebratory pause
    }
    return;
  }

  // ── 6. Render ───────────────────────────────────────────
  // Start with the full wall map for the current level.
  displayDraw(levels[level]);

  // Draw the player pixel on top of the wall map.
  displayPixel((int)playerX, (int)playerY, true);

  // Blink the goal pixel so the player always knows where to go.
  // The goal cell is a path (bit = 0 in the level data), so it
  // is off by default.  We turn it ON and blink it at 2.5 Hz.
  bool goalVisible = (millis() / 200) % 2 == 0;
  displayPixel(GOAL_X[level], GOAL_Y[level], goalVisible);
}

static void handleCrashed() {
  unsigned long elapsed = millis() - crashedAt;

  // Blink the remaining life dots at ~3 Hz so the player clearly
  // sees how many lives are left before they respawn.
  bool dotsVisible = (elapsed / 160) % 2 == 0;
  displayClear();
  if (dotsVisible) {
    // Show one dot per remaining life, centred on row 3
    for (int i = 0; i < lives; i++) {
      displayPixel(i + 2, 3, true);
    }
  }

  // Auto-resume after the crash display period
  if (elapsed >= (unsigned long)CRASH_DISPLAY_MS) {
    respawn();
    state = STATE_PLAYING;
  }
}

static void handleGameover(bool btn) {
  displayDraw(FRAME_GAMEOVER);
  if (btn) {
    state = STATE_TITLE;
    delay(300);
  }
}

static void handleVictory(bool btn) {
  displayDraw(FRAME_VICTORY);
  if (btn) {
    state = STATE_TITLE;
    delay(300);
  }
}

// ── Public API ──────────────────────────────────────────────

void gameInit() {
  state = STATE_TITLE;
  lives = STARTING_LIVES;
  level = 0;
  respawn();
}

void gameUpdate(bool btn) {
  switch (state) {
    case STATE_TITLE:    handleTitle(btn);    break;
    case STATE_PLAYING:  handlePlaying();     break;
    case STATE_CRASHED:  handleCrashed();     break;
    case STATE_GAMEOVER: handleGameover(btn); break;
    case STATE_VICTORY:  handleVictory(btn);  break;
  }
}
