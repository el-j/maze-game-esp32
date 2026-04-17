#pragma once
// ================================================================
//  Motion.h  –  MPU6050 Accelerometer Interface
// ================================================================
//  Wraps the Adafruit MPU6050 library to provide a simple two-axis
//  tilt reading that the game physics engine can consume directly.
//
//  Coordinate mapping (matches common GY-521 board orientation):
//    getAx() → positive = board tilted to the RIGHT  (→)
//    getAy() → positive = board tilted DOWNWARD      (↓)
//  If your matrix image appears flipped, negate the appropriate
//  axis in Game.cpp's physics update instead of re-wiring.
//
//  Public API
//  ──────────
//  motionInit()       Wire.begin() + sensor init + settings.
//                     Halts with Serial error if sensor not found.
//  motionCalibrate()  Average IMU_CAL_SAMPLES readings to compute
//                     zero offsets.  Call after motionInit().
//  motionGetAx()      Calibrated, deadzone-filtered X acceleration.
//  motionGetAy()      Calibrated, deadzone-filtered Y acceleration.
// ================================================================

#include <Arduino.h>

void  motionInit();
void  motionCalibrate();
float motionGetAx();
float motionGetAy();
