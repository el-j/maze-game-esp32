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
//  Usage per tick
//  ──────────────
//  Call motionUpdate() once at the start of each physics tick to read
//  both axes from the sensor in a single I2C transaction and cache them.
//  Then call motionGetAx() / motionGetAy() to retrieve the cached values.
//  This avoids the previous pattern of reading the sensor twice per tick
//  (once per axis), which produced X and Y values from different sensor
//  samples and wasted I2C bandwidth.
//
//  Public API
//  ──────────
//  motionInit()          Wire.begin() + sensor init + settings.
//                        In DEBUG_MODE: logs error + returns if not found.
//                        In release:   halts with Serial error message.
//  motionCalibrate()     Average IMU_CAL_SAMPLES readings to compute
//                        zero offsets.  Call after motionInit().
//  motionUpdate()        Read both axes from sensor; cache for getAx/getAy.
//                        Call once per game tick before reading axes.
//  motionGetAx()         Calibrated, deadzone-filtered X acceleration.
//  motionGetAy()         Calibrated, deadzone-filtered Y acceleration.
//  motionGetLastRaw()    Raw 3-axis reading from the last motionUpdate() call.
//                        az ≈ 9.81 m/s² on a flat surface (gravity check).
// ================================================================

#include <Arduino.h>

void  motionInit();
void  motionCalibrate();
void  motionUpdate();
float motionGetAx();
float motionGetAy();

// Returns the raw (pre-calibration, pre-deadzone) sensor values
// from the most recent motionUpdate() call.
// az is the vertical (gravity) axis – should read ~9.81 m/s² when flat.
// Useful for the debug dashboard and for verifying correct mounting.
void motionGetLastRaw(float &ax, float &ay, float &az);
