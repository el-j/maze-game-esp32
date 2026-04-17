# Contributing – Haptic Tilt-Maze Console

Thank you for wanting to improve the game!  
This guide explains how to add levels, design sounds, and contribute code.

---

## Repository Structure

```
packages/firmware/src/
├── config.h       All tuneable constants   ← start here for simple tweaks
├── Levels.h       Maze level data          ← add new levels here
├── Feedback.cpp   Melody definitions       ← add new sounds here
├── Game.cpp       State machine + physics  ← extend gameplay logic here
├── Display.cpp    Matrix ISR               ← change display behaviour here
└── Motion.cpp     IMU driver               ← change sensor filtering here
```

---

## Adding a Maze Level

Open `packages/firmware/src/Levels.h`.

1. Increment `NUM_LEVELS`.
2. Draw your maze on grid paper.  Convert each row to a binary byte:  
   `1` = wall (LED on), `0` = open path.
3. Add the byte array to `levels[]`.
4. Add start and goal coordinates to `START_X`, `START_Y`, `GOAL_X`, `GOAL_Y`.

### Maze design rules

- The border (row 0, row 7, col 0, col 7) should be solid walls (`B11111111` on the top and bottom rows, `1` at bits 7 and 0 on middle rows).
- The start cell `(START_X, START_Y)` and goal cell `(GOAL_X, GOAL_Y)` must be open paths (bit = `0`).
- There must be a valid path from start to goal.  Trace it by hand before flashing.

### Visualisation helper

```
B11111111  →  ████████
B10000001  →  █······█
B10111101  →  █·████·█
```

Bit 7 = left edge, Bit 0 = right edge.

---

## Designing New Sounds

Open `packages/firmware/src/Feedback.cpp`.

All melodies use the `Note` struct:

```cpp
struct Note {
  uint16_t frequency; // Hz  (0 = silent rest)
  uint16_t duration;  // ms
};
```

Musical note frequencies are defined as named constants at the top of the file:

```cpp
static constexpr uint16_t C5  = 523;
static constexpr uint16_t E5  = 659;
static constexpr uint16_t G5  = 784;
// ... etc.
```

### Adding a new melody

1. Add a `static const Note MY_MELODY[]` array in `Feedback.cpp`.
2. Add a declaration in `Feedback.h`: `void feedbackPlayMyEvent();`
3. Implement the function in `Feedback.cpp`:
   ```cpp
   void feedbackPlayMyEvent() {
     startMelody(MY_MELODY, sizeof(MY_MELODY) / sizeof(Note));
     startMotor(MOTOR_DUTY_LEVELUP, MOTOR_MS_LEVELUP); // optional haptic
   }
   ```
4. Call `feedbackPlayMyEvent()` from the appropriate place in `Game.cpp`.

### Sound design tips

- Short **rests** (`{REST, 20}`) between notes add crispness and prevent notes blurring together.
- Descending pitches feel heavy/negative (crashes, warnings).
- Ascending pitches feel positive (rewards, level-ups).
- 80–100 ms per note sounds crisp; 200+ ms sounds held/lyrical.
- The piezo speaker has limited bass response – notes below ~200 Hz will be quiet.

---

## Code Style

- Keep each `.cpp` file focused on a single responsibility.
- Add a one-line comment to any `config.h` constant that is not self-evident.
- Prefer named constants over magic numbers.
- Use `static` for module-internal variables and helpers.

---

## Submitting a Pull Request

1. Fork the repository and create a branch: `git checkout -b feature/my-level`.
2. Make your changes.
3. Test by running `make build` – ensure it compiles without warnings.
4. If you have the hardware, flash and verify it works.
5. Open a pull request with a short description of what you changed and why.

---

## Ideas for Future Packages

The monorepo is designed to grow.  Possible additions under `packages/`:

| Package | Description |
|---|---|
| `packages/highscore-server` | Small Node.js / Python API to store and serve highscores over Wi-Fi |
| `packages/web-app` | Browser leaderboard UI that connects to the highscore server |
| `packages/level-editor` | Web-based 8×8 grid editor that exports maze byte arrays |
