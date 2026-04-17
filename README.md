# Haptic Tilt-Maze Console 🎮

A handheld, battery-powered digital maze game built with an **ESP32**, **MPU6050** accelerometer, and a raw **8×8 LED matrix**. Tilt the board to navigate a pixel through procedural maze levels, with haptic rumble and sound effects on crashes.

## Hardware Stack

| Component | Part |
|-----------|------|
| Brain | ESP32 DevKit V1 |
| Motion | GY-521 (MPU6050) |
| Display | Raw 8×8 LED matrix (e.g. 1088AS) |
| Haptics | DC motor + NPN transistor |
| Audio | Piezo buzzer |
| Input | Tactile push button |
| Power | 18650 battery shield |

## Repository Layout

```
.
├── src/
│   └── main.cpp          # Full game engine + ISR multiplexing
├── docs/
│   └── WIRING_GUIDE.md   # Exact pinouts & assembly order
├── platformio.ini        # Board + library configuration
├── Makefile              # Build helpers
└── .github/
    └── workflows/
        └── ci.yml        # PlatformIO compile check
```

## Quick Start

```bash
# Build firmware
make build

# Flash to device
make upload

# Open serial monitor (115 200 baud)
make monitor
```

Requires [PlatformIO Core](https://docs.platformio.org/en/latest/core/installation/index.html):

```bash
pip install platformio
```

## Wiring

See **[docs/WIRING_GUIDE.md](docs/WIRING_GUIDE.md)** for the full step-by-step wiring reference including the transistor haptic circuit and safe ESP32 GPIO selection.

## Game Flow

```
TITLE ──(button)──► PLAYING ──(crash)──► CRASHED ──► PLAYING
                       │                               ▲
                       │           lives = 0           │
                       └──────────────────► GAMEOVER ──┘
                       │
                       └──(all levels done)──► VICTORY
```

## Tuning

| Constant | File | Purpose |
|----------|------|---------|
| `SENSITIVITY` | `src/main.cpp` | Tilt-to-acceleration multiplier |
| `FRICTION` | `src/main.cpp` | Velocity damping (0 – 1) |
| `DEADZONE` | `src/main.cpp` | Ignore micro-vibrations |

## CI

Every push and pull request to `main` triggers a PlatformIO firmware compile via GitHub Actions.
