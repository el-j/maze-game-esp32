// ================================================================
//  Feedback.cpp  –  Non-Blocking Melody Sequencer + Haptic PWM
// ================================================================
//  SOUND DESIGN GUIDE
//  ──────────────────
//  Every frequency below is a standard musical note.  Change any
//  number to reshape a melody – no music theory required.
//
//  Quick reference (octave 4 and 5):
//    C4=262  D4=294  E4=330  F4=349  G4=392  A4=440  B4=494
//    C5=523  D5=587  E5=659  F5=698  G5=784  A5=880  B5=988
//    C6=1047 D6=1175 E6=1319 F6=1397 G6=1568
//
//  A Note with frequency=0 is a silent rest – useful for adding
//  crisp gaps between notes (otherwise they blur together).
//
//  Duration guide:
//    ≤ 80 ms  = staccato click
//    100 ms   = short note
//    200 ms   = medium note
//    400+ ms  = long, held note
// ================================================================

#include "Feedback.h"
#include "config.h"

// ── Note type ───────────────────────────────────────────────
struct Note {
  uint16_t frequency; // Hz  (0 = silent rest)
  uint16_t duration;  // ms
};

// ── Named note frequency constants ──────────────────────────
// Add more as needed when composing new melodies.
static constexpr uint16_t REST = 0;
static constexpr uint16_t E3  = 165;
static constexpr uint16_t A3  = 220;
static constexpr uint16_t C4  = 262;
static constexpr uint16_t E4  = 330;
static constexpr uint16_t G4  = 392;
static constexpr uint16_t C5  = 523;
static constexpr uint16_t E5  = 659;
static constexpr uint16_t G5  = 784;
static constexpr uint16_t B5  = 988;
static constexpr uint16_t C6  = 1047;
static constexpr uint16_t E6  = 1319;

// ── Melody Definitions ──────────────────────────────────────
// Each array is a sequence of {frequency, duration_ms} pairs.
// Change the values, re-flash, and listen to the result.
// The small REST notes between pitched notes add crispness.

// Plays once at boot after calibration – tells the player it's ready.
static const Note MELODY_BOOT[] = {
  {G4, 80}, {REST, 20},
  {C5, 80}, {REST, 20},
  {E5, 80}, {REST, 20},
  {G5, 160}
};

// Short descending "thud" on wall collision.
// Low pitches feel heavy and physical – like hitting a real wall.
static const Note MELODY_CRASH[] = {
  {A3, 80}, {REST, 20},
  {E3, 130}
};

// Bright ascending arpeggio on level completion.
// Rising pitch = positive reward signal.
static const Note MELODY_LEVELUP[] = {
  {C5,  90}, {REST, 25},
  {E5,  90}, {REST, 25},
  {G5,  90}, {REST, 25},
  {C6, 280}
};

// Full celebratory fanfare on completing all levels.
// Longer and more elaborate than the level-up to feel special.
static const Note MELODY_VICTORY[] = {
  {C5,  100}, {REST, 25},
  {E5,  100}, {REST, 25},
  {G5,  120}, {REST, 25},
  {E5,   90}, {REST, 20},
  {C6,  120}, {REST, 40},
  {G5,  120}, {REST, 25},
  {B5,  120}, {REST, 25},
  {E6,  500}
};

// ── Sequencer State ─────────────────────────────────────────
static const Note    *currentMelody = nullptr;
static uint8_t        melodyLen     = 0;
static uint8_t        melodyIdx     = 0;
static unsigned long  noteEnd       = 0;
static uint16_t       activeNoteHz  = 0;  // frequency currently playing (0 = silent)

// Motor state
static bool          motorActive = false;
static unsigned long motorEnd    = 0;
static uint8_t       motorDuty   = 0;  // duty currently applied (0 = off)

// ── Private helpers ─────────────────────────────────────────

static void startNote(const Note &n) {
  activeNoteHz = n.frequency;
  if (n.frequency == 0) {
    noTone(BUZZER_PIN); // rest = silence
  } else {
    tone(BUZZER_PIN, n.frequency);
  }
  noteEnd = millis() + n.duration;
}

static void startMelody(const Note *notes, uint8_t len) {
  currentMelody = notes;
  melodyLen     = len;
  melodyIdx     = 0;
  startNote(notes[0]);
}

static void startMotor(uint8_t duty, uint16_t durationMs) {
  ledcWrite(MOTOR_PIN, duty);
  motorEnd    = millis() + durationMs;
  motorActive = true;
}

// ── Public API ──────────────────────────────────────────────

void feedbackInit() {
  // Attach the motor pin to the LEDC PWM peripheral.
  // The transistor converts this PWM signal into variable motor speed.
  ledcAttach(MOTOR_PIN, MOTOR_PWM_FREQ, MOTOR_PWM_BITS);
  ledcWrite(MOTOR_PIN, 0); // motor off at start

  pinMode(BUZZER_PIN, OUTPUT);
  noTone(BUZZER_PIN);
}

void feedbackUpdate() {
  unsigned long now = millis();

  // ── Motor: stop when rumble time has elapsed ─────────────
  if (motorActive && now >= motorEnd) {
    ledcWrite(MOTOR_PIN, 0);
    motorActive = false;
  }

  // ── Melody sequencer: advance to next note ───────────────
  if (melodyLen > 0 && now >= noteEnd) {
    melodyIdx++;
    if (melodyIdx < melodyLen) {
      startNote(currentMelody[melodyIdx]);
    } else {
      // Melody finished
      noTone(BUZZER_PIN);
      melodyLen = 0;
    }
  }
}

void feedbackPlayBoot() {
  startMelody(MELODY_BOOT, sizeof(MELODY_BOOT) / sizeof(Note));
  // No haptic on boot – the motor is not attached yet in some
  // wiring setups; motor test should be done via Serial.
}

void feedbackPlayCrash() {
  startMelody(MELODY_CRASH, sizeof(MELODY_CRASH) / sizeof(Note));
  startMotor(MOTOR_DUTY_CRASH, MOTOR_MS_CRASH);
}

void feedbackPlayLevelUp() {
  startMelody(MELODY_LEVELUP, sizeof(MELODY_LEVELUP) / sizeof(Note));
  startMotor(MOTOR_DUTY_LEVELUP, MOTOR_MS_LEVELUP);
}

void feedbackPlayVictory() {
  startMelody(MELODY_VICTORY, sizeof(MELODY_VICTORY) / sizeof(Note));
  startMotor(MOTOR_DUTY_VICTORY, MOTOR_MS_VICTORY);
}
