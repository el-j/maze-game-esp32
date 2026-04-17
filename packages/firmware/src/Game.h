#pragma once
// ================================================================
//  Game.h  –  State Machine & Physics Engine
// ================================================================
//  The game is driven by a finite state machine with five states:
//
//    STATE_TITLE    Smiley face displayed; press button to start.
//    STATE_PLAYING  Physics running; tilt to navigate the ball.
//    STATE_CRASHED  Crash screen (blinking life dots); auto-resume.
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
//                           └──(reach goal, more levels)──► PLAYING (next level)
//                           │
//                           └──(reach goal, last level)───► VICTORY ──(button)──► TITLE
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
int gameGetState();  // returns GameState enum value  0=TITLE … 4=VICTORY
int gameGetLives();  // remaining lives (0 after game-over)
int gameGetLevel();  // current level index (0-based)
