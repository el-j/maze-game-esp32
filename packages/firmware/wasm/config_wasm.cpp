// ================================================================
//  config_wasm.cpp  –  Runtime-adjustable physics config for WASM
// ================================================================
//  In the firmware build, SENSITIVITY/FRICTION/DEADZONE/STARTING_LIVES
//  are compile-time constexpr constants (zero overhead).
//  In the WASM build (-DWASM_BUILD), config.h declares them as
//  extern variables so the Dev HUD can adjust them at runtime
//  without recompiling.  This file provides the definitions and
//  their default values (identical to the firmware defaults).
// ================================================================

float SENSITIVITY    = 0.05f;
float FRICTION       = 0.85f;
float DEADZONE       = 0.50f;
int   STARTING_LIVES = 3;
