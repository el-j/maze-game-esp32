#pragma once
// ================================================================
//  Feedback.h  –  Non-Blocking Haptics & Sound
// ================================================================
//  All feedback (motor rumble + buzzer melody) is non-blocking.
//  This means the game loop continues running while sounds play –
//  the player never experiences a freeze.
//
//  How the melody sequencer works
//  ───────────────────────────────
//  A melody is an array of Note structs, each holding a frequency
//  (Hz) and a duration (ms).  frequency=0 is a silent rest.
//  feedbackUpdate() checks millis() each game tick and advances
//  to the next note when the current note has expired.
//
//  To add a new sound: add a Note array in Feedback.cpp and call
//  the internal _startMelody() helper from a new public function.
//  All frequencies are human-readable musical notes – see the
//  NOTE_* constants at the top of Feedback.cpp.
//
//  Public API
//  ──────────
//  feedbackInit()        Attach motor pin to LEDC PWM channel.
//  feedbackUpdate()      Advance sequencer; stop motor if done.
//                        Must be called every game loop tick.
//  feedbackPlayBoot()    Short "ready" jingle played once at startup.
//  feedbackPlayCrash()   Descending thump + haptic rumble.
//  feedbackPlayLevelUp() Ascending arpeggio + sharp haptic buzz.
//  feedbackPlayVictory() Full victory fanfare + strong haptic shake.
// ================================================================

#include <Arduino.h>

void feedbackInit();
void feedbackUpdate();
void feedbackPlayBoot();
void feedbackPlayCrash();
void feedbackPlayLevelUp();
void feedbackPlayVictory();
