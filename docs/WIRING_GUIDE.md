# Wiring Guide – Haptic Tilt-Maze Console

> ⚠️ **Keep the 18650 battery shield switched OFF while wiring.**

---

## Power

| Source | Destination | Note |
|--------|-------------|------|
| Battery shield 5 V | Breadboard red rail | Main 5 V bus |
| Battery shield GND | Breadboard blue rail | Common GND |
| ESP32 VIN (or 5 V) | Red rail | Powers the ESP32 from the bus |
| ESP32 GND | Blue rail | |

---

## 1 · MPU6050 Motion Sensor (GY-521)

| GY-521 Pin | ESP32 Pin | Note |
|------------|-----------|------|
| VCC | 3V3 | **Do NOT connect to 5 V** |
| GND | GND | |
| SCL | GPIO 22 | I²C clock |
| SDA | GPIO 21 | I²C data |

I²C address: **0x68** (AD0 pulled low by default).

---

## 2 · Haptic Rumble (NPN transistor + DC motor)

```
ESP32 GPIO 4 ──► 1 kΩ ──► Base
                           │
                        Transistor (e.g. 2N2222 / BC547)
                           │
Emitter ──────────────── GND
Collector ──────────── Motor (–)
Motor (+) ─────────── 5 V rail

(Place a flyback diode across the motor: stripe → 5 V rail)
```

---

## 3 · Piezo Buzzer & Start Button

| Component | ESP32 Pin | Other leg |
|-----------|-----------|-----------|
| Piezo (+) | GPIO 2 | GND |
| Start button | GPIO 34 | 3.3 V |

GPIO 34 is **input-only** (no internal pull-up/down). The button is active-HIGH with a physical connection to 3.3 V; add a 10 kΩ pull-down resistor to GND.

---

## 4 · 8×8 LED Matrix

Pins selected to avoid TX/RX (GPIO 1/3) and boot-strapping pins.

### Rows – Anodes (current source, driven HIGH)

| Row | ESP32 GPIO |
|-----|-----------|
| 0 | 13 |
| 1 | 16 |
| 2 | 17 |
| 3 | 5 |
| 4 | 18 |
| 5 | 19 |
| 6 | 23 |
| 7 | 25 |

### Columns – Cathodes (current sink, driven LOW to light)

| Col | ESP32 GPIO |
|-----|-----------|
| 0 | 26 |
| 1 | 32 |
| 2 | 33 |
| 3 | 27 |
| 4 | 14 |
| 5 | 12 |
| 6 | 15 |
| 7 | 0 |

> If the image is mirrored or rotated, adjust the `ROW_PINS` / `COL_PINS` arrays in `src/main.cpp` – **do not re-wire**.

---

## Verification Sequence

1. **Power** – ESP32 power LED lights up when shield is on.
2. **I²C scan** – Flash a scanner sketch; device found at `0x68`.
3. **Motor** – GPIO 4 HIGH for 500 ms pulses the motor.
4. **Buzzer** – `tone(2, 440)` produces a 440 Hz beep.
5. **Matrix** – Upload main firmware; smiley-face title screen visible.
