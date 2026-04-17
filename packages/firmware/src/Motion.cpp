// ================================================================
//  Motion.cpp  –  MPU6050 Accelerometer Init, Calibration & Read
// ================================================================

#include "Motion.h"
#include "config.h"
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

static Adafruit_MPU6050 mpu;

// Resting-position offsets computed during calibration.
// Subtracted from every live reading so "flat" = exactly 0 m/s².
static float offsetX = 0.0f;
static float offsetY = 0.0f;

// ── Helper: raw axes (before offset subtraction) ────────────
// The MPU6050 is mounted on the GY-521 break-out board with its
// X/Y axes rotated 90° relative to the maze grid.  We swap and
// negate here so that:
//   board tilt right  → positive ax
//   board tilt down   → positive ay
// If your image moves in the wrong direction, change the signs
// on the lines below (no re-wiring needed).
static void rawAxes(float &ax, float &ay) {
  sensors_event_t accel, gyro, temp;
  mpu.getEvent(&accel, &gyro, &temp);
  ax = -accel.acceleration.y; // swap & negate
  ay =  accel.acceleration.x; // swap
}

// ── Public API ──────────────────────────────────────────────

void motionInit() {
  Wire.begin(); // Default SDA=GPIO21, SCL=GPIO22 on ESP32
  if (!mpu.begin()) {
    // Sensor not found – print instructions and halt.
    // Common causes: wrong SDA/SCL pins, 5 V on VCC (must be 3.3 V),
    // or a loose jumper wire.
    Serial.println("ERROR: MPU6050 not found.");
    Serial.println("  Check: GY-521 VCC → ESP32 3V3 (NOT 5V!)");
    Serial.println("  Check: SDA → GPIO 21,  SCL → GPIO 22");
    Serial.println("Halting.");
    while (true) delay(10);
  }

  // ±2 g range gives the best resolution for subtle tilt angles.
  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);

  // 21 Hz low-pass filter smooths out vibration without adding
  // noticeable lag.  Raise to MPU6050_BAND_44_HZ if too sluggish.
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  Serial.println("MPU6050 found.");
}

void motionCalibrate() {
  Serial.print("Calibrating IMU – keep the board FLAT... ");
  float sumX = 0.0f, sumY = 0.0f;

  for (int i = 0; i < IMU_CAL_SAMPLES; i++) {
    float ax, ay;
    rawAxes(ax, ay);
    sumX += ax;
    sumY += ay;
    delay(5); // 5 ms × 100 samples = 0.5 s total calibration time
  }

  offsetX = sumX / IMU_CAL_SAMPLES;
  offsetY = sumY / IMU_CAL_SAMPLES;

  Serial.printf("done.  Offsets: X=%.3f  Y=%.3f m/s²\n",
                offsetX, offsetY);
}

float motionGetAx() {
  float ax, ay;
  rawAxes(ax, ay);
  float calibrated = ax - offsetX;
  // Apply deadzone: ignore tiny readings caused by hand tremor
  return (fabsf(calibrated) < DEADZONE) ? 0.0f : calibrated;
}

float motionGetAy() {
  float ax, ay;
  rawAxes(ax, ay);
  float calibrated = ay - offsetY;
  return (fabsf(calibrated) < DEADZONE) ? 0.0f : calibrated;
}
