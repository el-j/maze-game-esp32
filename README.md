# Haptic Tilt-Maze Console 🎮

A handheld, battery-powered maze game built on an **ESP32**.  
Tilt the board to roll a pixel through maze corridors.  
Crash into walls and feel the rumble. Complete all levels and hear the fanfare.

## Hardware Stack

| Component | Part |
|---|---|
| Brain | ESP32 DevKit V1 |
| Motion sensor | GY-521 (MPU6050) |
| Display | Raw 8×8 LED matrix (e.g. 1088AS) |
| Haptics | Small DC motor + NPN transistor |
| Audio | Piezo buzzer |
| Input | Tactile push button |
| Power | 18650 battery shield |

## Monorepo Layout

```
maze-game-esp32/
├── packages/
│   └── firmware/          ESP32 PlatformIO project
│       ├── src/
│       │   ├── config.h   ★ All tuneable constants
│       │   ├── Display    8×8 matrix ISR multiplexer
│       │   ├── Motion     MPU6050 accelerometer
│       │   ├── Feedback   Non-blocking sound + haptics
│       │   ├── Levels     Maze level data
│       │   └── Game       State machine + physics
│       ├── platformio.ini
│       └── README.md
├── docs/
│   ├── GETTING_STARTED.md  Step-by-step beginner guide
│   ├── WIRING_GUIDE.md     Full wiring reference & GPIO tables
│   └── CONTRIBUTING.md     How to add levels, sounds, & features
├── Makefile               Root build commands
└── .github/workflows/
    └── ci.yml             Firmware compile check on every push
```

## Quick Start

```bash
# Install PlatformIO (once)
pip install platformio

# Build firmware
make build

# Flash to connected ESP32
make upload

# Watch the Serial Monitor (115200 baud)
make monitor
```

## Documentation

| Document | What it covers |
|---|---|
| [GETTING_STARTED.md](docs/GETTING_STARTED.md) | Full beginner assembly walkthrough |
| [WIRING_GUIDE.md](docs/WIRING_GUIDE.md) | GPIO tables, transistor circuit, pin safety |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Adding levels, melodies, features |
| [packages/firmware/README.md](packages/firmware/README.md) | Firmware tuning reference |

## Game Flow

```
TITLE ──(button)──► PLAYING ──(crash, lives>0)──► CRASHED ──► PLAYING
                       │                                          ▲
                       │                                          │
                       ├──(crash, lives=0)──────────► GAMEOVER ──┘ (button → TITLE)
                       │
                       ├──(goal, more levels)──────► next level
                       │
                       └──(goal, last level)───────► VICTORY (button → TITLE)
```

## Sound Design

Four non-blocking melodies play automatically via the piezo buzzer:

| Event | Sound |
|---|---|
| Boot | G–C–E–G ascending jingle |
| Wall crash | A–E descending thump |
| Level clear | C–E–G–C arpeggio |
| All levels done | Full 8-note victory fanfare |

All note frequencies and durations are named constants in `packages/firmware/src/Feedback.cpp`.

## CI

Every push and pull request to `main` triggers a full PlatformIO firmware compile.
