#pragma once
// ================================================================
//  Game.h  –  State Machine & Physics Engine
// ================================================================
//  The game is driven by a finite state machine with six states:
//
//    STATE_TITLE    Smiley face displayed; press button to start.
//    STATE_PLAYING  Physics running; tilt to navigate the ball.
//    STATE_CRASHED  Crash screen (blinking life dots); auto-resume.
//    STATE_LEVELUP  Brief celebratory pause between levels.
//    STATE_GAMEOVER "X" displayed; press button to return to title.
//    STATE_VICTORY  Checkmark displayed; press button to replay.
//
//  Flow diagram:
//
//    TITLE ──(button)──► PLAYING ──(crash, lives>0)──► CRASHED
//                           │                              │
//                           │                              └──► PLAYING (respawn)
//                           │
//                           ├──(crash, lives=0)──────────► GAMEOVER ──(button)──► TITLE
//                           │
//                           ├──(reach goal, more levels)──► LEVELUP ──(timer)──► PLAYING (next level)
//                           │
//                           └──(reach goal, last level)───► VICTORY ──(button)──► TITLE
//
//  Button debounce
//  ───────────────
//  State transitions triggered by the button use a millis()-based debounce
//  window (DEBOUNCE_MS from config.h) so that a single long press does not
//  cascade through multiple states.  This replaces the previous blocking
//  delay() calls, which were no-ops in the WASM browser build.
//
//  Level-up pause
//  ──────────────
//  When the player reaches the goal, the engine transitions to STATE_LEVELUP
//  and waits LEVELUP_PAUSE_MS before spawning on the next level.  The display
//  retains its last frame (the completed level with the player on the goal)
//  during this pause.  This replaces the previous blocking delay() call which
//  was a no-op in the WASM browser build.
//
//  Public API
//  ──────────
//  gameInit()          Seed initial state; call once in setup().
//  gameUpdate(btn)     Advance state machine by one tick.
//                      btn = true while the start button is held.
//                      Call every loop() iteration.
// ================================================================

#include <Arduino.h>

void gameInit();
void gameUpdate(bool btn);

// ── Diagnostic getters ───────────────────────────────────────
// Used by the debug dashboard and the WASM browser demo.
int gameGetState();  // returns GameState enum value  0=TITLE … 5=LEVELUP
int gameGetLives();  // remaining lives (0 after game-over)
int gameGetLevel();  // current level index (0-based)
