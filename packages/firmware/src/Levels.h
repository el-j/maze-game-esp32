#pragma once
// ================================================================
//  Levels.h  –  Maze Level Data
// ================================================================
//  How to read a maze
//  ──────────────────
//  Each level is an array of 8 bytes.  One byte = one row.
//  Bit 7 (leftmost) = column 0.  Bit 0 (rightmost) = column 7.
//
//    1 = wall  (LED on)
//    0 = open path  (LED off)
//
//  Example row:  B11111111  = full solid wall
//                B10000001  = walls on left and right, open in middle
//
//  Visual layout (1=█, 0=·):
//    B10110101  →  █·██·█·█
//
//  How to add a new level
//  ──────────────────────
//  1.  Draw your maze on graph paper (8×8 grid).
//  2.  Convert each row to binary: 1 for wall, 0 for open.
//  3.  Add a new entry to the levels[] array.
//  4.  Increment NUM_LEVELS.
//  5.  Add matching entries to START_X, START_Y, GOAL_X, GOAL_Y.
//  6.  Make sure the start and goal cells are open paths (bit = 0).
//
//  Start cell is always (1, 1)  – top-left corner pocket.
//  Goal  cell is always (6, 6)  – bottom-right corner pocket.
//  Both are kept consistent across levels so the player always
//  knows where they begin and where they must reach.
// ================================================================

#include <Arduino.h>

static constexpr uint8_t NUM_LEVELS = 3;

// ── Level data ──────────────────────────────────────────────
// Visualised below each array for quick orientation.
static const byte levels[NUM_LEVELS][8] = {

  { // ── Level 1: Simple C-Shape ────────────────────────────
    // Beginner-friendly single corridor that loops around the edge.
    // Visual:
    //   ████████
    //   █······█
    //   ████████
    //   █······█
    //   ████████
    //   █······█
    //   ██████·█
    //   ████████
    B11111111,
    B10000001,
    B11111111,
    B10000001,
    B11111111,
    B10000001,
    B11111101,
    B11111111
  },

  { // ── Level 2: Winding Path ───────────────────────────────
    // Longer single-solution path that zigzags across the grid.
    // Visual:
    //   ████████
    //   █····███
    //   ████·███
    //   █·█····█  (note: intentional cut-through at col 4)
    //   █·█████
    //   █·····█
    //   ██████·█
    //   ████████
    B11111111,
    B10000011,
    B10111011,
    B10100011,
    B10101111,
    B10100001,
    B11111101,
    B11111111
  },

  { // ── Level 3: Tight Corridors ────────────────────────────
    // Multiple dead-ends require the player to navigate carefully.
    // Visual:
    //   ████████
    //   █·█····█
    //   █·█·██·█
    //   █···█··█
    //   ███·█·██
    //   █···█··█
    //   ██████·█
    //   ████████
    B11111111,
    B10100001,
    B10101101,
    B10001001,
    B11101011,
    B10001001,
    B11111101,
    B11111111
  }

};

// ── Start & Goal coordinates ────────────────────────────────
// (x = column, y = row, both 0-based)
static const int8_t START_X[NUM_LEVELS] = {1, 1, 1};
static const int8_t START_Y[NUM_LEVELS] = {1, 1, 1};
static const int8_t GOAL_X[NUM_LEVELS]  = {6, 6, 6};
static const int8_t GOAL_Y[NUM_LEVELS]  = {6, 6, 6};
