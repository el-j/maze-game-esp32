# firmware – ESP32 Maze Game Firmware

PlatformIO project for the Haptic Tilt-Maze ESP32 console.

## Source Layout

```
src/
├── main.cpp       Entry point – setup() + loop()
├── config.h       ★ All tuneable constants (pins, physics, sound)
├── Display.h/.cpp  8×8 LED matrix ISR multiplexer
├── Motion.h/.cpp   MPU6050 accelerometer init, calibration, read
├── Feedback.h/.cpp Non-blocking melody sequencer + haptic PWM
├── Levels.h        Maze level byte arrays + start/goal coords
├── Game.h/.cpp     State machine + physics + collision + render
```

**Start with `config.h`** – every value you might want to change lives there.

## Build & Flash

```bash
# From this directory:
pio run                     # compile
pio run --target upload     # compile + flash
pio device monitor          # open serial monitor

# Or from the repo root:
make build
make upload
make monitor
```

## Wiring

See [`../../docs/WIRING_GUIDE.md`](../../docs/WIRING_GUIDE.md).

## Tuning

| What you want | Constant | File |
|---|---|---|
| Faster / more sensitive | raise `SENSITIVITY` | config.h |
| Less slippery | lower `FRICTION` | config.h |
| Stop drift on flat desk | raise `DEADZONE` | config.h |
| Stronger crash rumble | raise `MOTOR_DUTY_CRASH` | config.h |
| Longer crash rumble | raise `MOTOR_MS_CRASH` | config.h |
| Change a melody | edit `MELODY_*` arrays | Feedback.cpp |
| Add a new level | add entry to `levels[]` | Levels.h |
