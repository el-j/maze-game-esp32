# Getting Started – Haptic Tilt-Maze Console

This guide walks a complete beginner from an empty breadboard to a playable game.  
Estimated time: **2–3 hours** for first-time builders.

---

## Prerequisites

### Software (install before you start)

1. **Python 3.8+** – [python.org/downloads](https://www.python.org/downloads/)
2. **PlatformIO Core**
   ```bash
   pip install platformio
   ```
3. **Git** – [git-scm.com](https://git-scm.com/) (to clone this repo)
4. **USB drivers** – Install the CH340 or CP2102 driver for your OS so the ESP32 shows up as a serial port.
   - Windows: [CH340 driver](https://www.wch-ic.com/downloads/CH341SER_EXE.html)
   - macOS/Linux: usually plug-and-play

### Hardware (have these ready)

See the full Bill of Materials in [WIRING_GUIDE.md](WIRING_GUIDE.md).

---

## Step 1 – Clone the Repository

```bash
git clone https://github.com/el-j/maze-game-esp32.git
cd maze-game-esp32
```

---

## Step 2 – Wire the Hardware

Follow **[WIRING_GUIDE.md](WIRING_GUIDE.md)** step by step.  
Do NOT skip the verification tests at each step.

> 🛑 Keep the battery shield switched OFF until told to power on.

---

## Step 3 – Connect the ESP32 via USB

Plug the ESP32 DevKit into your computer with a **data-capable** USB cable  
(some cables are power-only and will not work for flashing).

Verify the port is visible:

```bash
# macOS / Linux
ls /dev/tty.*          # look for /dev/ttyUSB0 or /dev/tty.SLAB_USBtoUART

# Windows
# Open Device Manager → Ports (COM & LPT) → look for COMx
```

If no port appears, re-check your USB driver installation (Step 0).

---

## Step 4 – Build and Flash

```bash
# From the repo root:
make build    # compile – fixes code issues before touching hardware
make upload   # flash to the connected ESP32
```

The first build downloads the ESP32 toolchain and libraries automatically  
(~500 MB, can take 5–10 minutes on a fresh install).  Subsequent builds are fast.

If `make upload` fails with "Port not found", specify your port explicitly:

```bash
cd packages/firmware
pio run --target upload --upload-port /dev/ttyUSB0   # Linux/macOS
pio run --target upload --upload-port COM3           # Windows
```

---

## Step 5 – Open the Serial Monitor

```bash
make monitor
```

You should see something like:

```
=== Haptic Tilt-Maze ===
MPU6050 found.
Calibrating IMU – keep the board FLAT... done.  Offsets: X=0.023  Y=-0.014 m/s²
Boot complete.  Press the button to start!
```

If you see `ERROR: MPU6050 not found` – double-check your GY-521 wiring  
(most likely VCC is on 5 V instead of 3.3 V, or SDA/SCL are swapped).

Press **Ctrl-C** to close the monitor.

---

## Step 6 – Play!

1. Place the device on a flat, level surface and power it on.
2. Wait ~0.5 seconds for calibration to finish and the boot jingle to play.
3. The smiley face appears on the matrix.
4. Press the button → the game starts.
5. Tilt the board in any direction to roll the bright pixel.
6. Navigate through the maze corridors to the **blinking goal pixel**.
7. 3 lives.  Each wall collision costs one life and triggers a haptic rumble.
8. Clear all 3 levels to hear the victory fanfare!

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| No serial port detected | USB driver missing or power-only cable | Install CH340/CP2102 driver; try a different cable |
| `MPU6050 not found` | VCC on 5 V, or SDA/SCL crossed | GY-521 VCC must go to 3V3; check SDA=21, SCL=22 |
| Matrix shows garbled pattern | Row or column pins in wrong order | Edit `ROW_PINS[]`/`COL_PINS[]` in `Display.cpp` – do NOT re-wire |
| Ball drifts on flat desk | IMU not calibrated flat at boot | Restart with board lying completely flat |
| Ball too fast / hard to control | SENSITIVITY too high | Lower `SENSITIVITY` in `config.h` |
| Ball too slow / unresponsive | SENSITIVITY too low | Raise `SENSITIVITY` in `config.h` |
| No sound | Wrong buzzer type | Must be a **passive** piezo; active buzzers do not respond to `tone()` |
| Motor doesn't rumble | Transistor wired wrong | Check E/B/C order for your specific transistor part number |
| Board won't enter flash mode | GPIO 0 held LOW by matrix wire | Disconnect the GPIO 0 jumper, press flash, reconnect |

---

## Customising the Game

All tunable values live in **`packages/firmware/src/config.h`**.  
Open it, change a number, re-run `make upload`, and feel the difference.

Key parameters:

| What | Constant | Typical range |
|---|---|---|
| Ball responsiveness | `SENSITIVITY` | 0.03 – 0.10 |
| Friction / drag | `FRICTION` | 0.75 – 0.92 |
| Drift threshold | `DEADZONE` | 0.3 – 0.8 |
| Lives per game | `STARTING_LIVES` | 1 – 9 |
| Crash rumble strength | `MOTOR_DUTY_CRASH` | 80 – 255 |

To add levels or change melodies, see [CONTRIBUTING.md](CONTRIBUTING.md).
