// ================================================================
//  Motion.cpp  –  MPU6050 Accelerometer Init, Calibration & Read
// ================================================================

#include "Motion.h"
#include "config.h"
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

static Adafruit_MPU6050 mpu;

// Guards all sensor reads.  Set to true only after mpu.begin() succeeds.
// Without this guard, calling mpu.getEvent() on an absent sensor causes
// undefined behaviour (I2C bus hangs, garbage data, or a crash).
static bool mpuReady = false;

// Resting-position offsets computed during calibration.
// Subtracted from every live reading so "flat" = exactly 0 m/s².
static float offsetX = 0.0f;
static float offsetY = 0.0f;

// Cached raw readings from the last sensor poll.
// Exposed via motionGetLastRaw() for diagnostics and the debug dashboard.
// az should read ~9.81 m/s² when the board is lying flat (Earth's gravity).
static float lastRawAx = 0.0f;
static float lastRawAy = 0.0f;
static float lastRawAz = 0.0f;

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

  // Cache all three axes so the debug dashboard can show them.
  // az is the vertical axis; ~9.81 m/s² on a flat surface confirms the
  // sensor is alive and oriented correctly.
  lastRawAx = ax;
  lastRawAy = ay;
  lastRawAz = accel.acceleration.z;
}

// ── Public API ──────────────────────────────────────────────

void motionInit() {
  Wire.begin(); // Default SDA=GPIO21, SCL=GPIO22 on ESP32
  if (!mpu.begin()) {
    // Sensor not found.  Common causes:
    //   • GY-521 VCC wired to 5 V instead of 3.3 V (destroys the sensor)
    //   • SDA and SCL swapped  (GPIO 21 ↔ GPIO 22)
    //   • Loose or missing jumper wire
    //   • Incorrect I2C address (AD0 pulled HIGH gives 0x69 instead of 0x68)
    Serial.println("ERROR: MPU6050 not found.");
    Serial.println("  Fix 1: GY-521 VCC must go to ESP32 3V3  (NOT 5V)");
    Serial.println("  Fix 2: SDA → GPIO 21   SCL → GPIO 22");
    Serial.println("  Fix 3: Re-seat all I2C jumper wires");
#ifdef DEBUG_MODE
    // In debug mode keep running so the dashboard can show the error banner.
    // The game will not move (motionGetAx/Ay return 0 when mpuReady=false).
    Serial.println("  [DEBUG] Continuing without IMU – check dashboard for status.");
    return;
#else
    Serial.println("Halting.");
    while (true) delay(10);
#endif
  }

  // ±2 g range gives the best resolution for subtle tilt angles.
  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);

  // 21 Hz low-pass filter smooths out vibration without adding
  // noticeable lag.  Raise to MPU6050_BAND_44_HZ if too sluggish.
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  mpuReady = true;
  Serial.println("MPU6050 found.");
}

void motionCalibrate() {
  if (!mpuReady) return; // skip if sensor is absent

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
  if (!mpuReady) return 0.0f;
  float ax, ay;
  rawAxes(ax, ay);
  float calibrated = ax - offsetX;
  // Apply deadzone: ignore tiny readings caused by hand tremor
  return (fabsf(calibrated) < DEADZONE) ? 0.0f : calibrated;
}

float motionGetAy() {
  if (!mpuReady) return 0.0f;
  float ax, ay;
  rawAxes(ax, ay);
  float calibrated = ay - offsetY;
  return (fabsf(calibrated) < DEADZONE) ? 0.0f : calibrated;
}

void motionGetLastRaw(float &ax, float &ay, float &az) {
  ax = lastRawAx;
  ay = lastRawAy;
  az = lastRawAz;
}
