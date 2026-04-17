// ================================================================
//  main.cpp  –  Entry Point
// ================================================================
//  This file is intentionally thin.  All logic lives in the
//  dedicated modules:
//    config.h    – tunable constants (pins, physics, sounds)
//    Display     – LED matrix ISR multiplexer
//    Motion      – MPU6050 accelerometer
//    Feedback    – non-blocking melody sequencer + haptic PWM
//    Levels      – maze level data
//    Game        – state machine + physics engine
// ================================================================

#include <Arduino.h>
#include "config.h"
#include "Display.h"
#include "Motion.h"
#include "Feedback.h"
#include "Game.h"

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== Haptic Tilt-Maze ===");

  // 1. Initialise hardware subsystems
  displayInit();   // configure matrix GPIO pins
  feedbackInit();  // attach motor LEDC channel

  // 2. Start I2C sensor; calibrate resting zero-point
  motionInit();
  motionCalibrate();

  // 3. Play the "ready" jingle so the player knows boot is done
  feedbackPlayBoot();

  // 4. Start the background matrix multiplexing timer
  //    (must come after feedbackInit to avoid LEDC channel conflicts)
  displayStartMux();

  // 5. Seed the game state machine
  gameInit();

  // 6. Configure start button (GPIO 34 – input-only, no pull-up)
  pinMode(BUTTON_PIN, INPUT);

  Serial.println("Boot complete.  Press the button to start!\n");
}

void loop() {
  // Advance non-blocking feedback timers (motor + melody sequencer)
  feedbackUpdate();

  // Read the start button (active-HIGH: HIGH = pressed)
  bool btn = digitalRead(BUTTON_PIN);

  // Advance the game state machine by one tick
  gameUpdate(btn);

  // ~50 Hz game loop (20 ms per frame)
  // The matrix refresh continues independently via the ISR at 1 kHz.
  delay(20);
}
