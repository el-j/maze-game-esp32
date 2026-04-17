# Wiring Guide – Haptic Tilt-Maze Console

> ⚠️ **Keep the 18650 battery shield switched OFF the entire time you are wiring.  
> Only power up at the very end of each verification step.**

---

## Bill of Materials

| # | Part | Notes |
|---|------|-------|
| 1 | ESP32 DevKit V1 (38-pin) | Any DevKit V1 clone works |
| 1 | GY-521 breakout (MPU6050) | The blue board with 8 pins |
| 1 | 8×8 LED matrix (e.g. 1088AS) | Raw matrix – no MAX7219 driver |
| 1 | DC vibration motor (3–5 V) | Coin cell or pager motor |
| 1 | NPN transistor (2N2222 or BC547) | To drive the motor safely |
| 1 | 1N4001 diode | Motor flyback protection |
| 1 | 1 kΩ resistor | Transistor base resistor |
| 1 | 10 kΩ resistor | Button pull-down to GND |
| 1 | Piezo buzzer (passive) | **Passive** = no built-in oscillator |
| 1 | Tactile push button | Any momentary normally-open type |
| 1 | 18650 battery shield | With 5 V USB output |
| 1 | Breadboard (full-size) | Half-size is tight for the matrix |
| — | Jumper wires | Mix of M-M and M-F |

---

## Wiring Sequence

Follow these steps **in order**.  Test each section before moving to the next.

---

### Step 1 · Power Rails

1. Connect the battery shield **5 V** output → breadboard **red rail**.
2. Connect the battery shield **GND** → breadboard **blue rail**.
3. Connect **ESP32 VIN** (or 5 V pin) → red rail.
4. Connect **ESP32 GND** → blue rail.

**Test:** Switch the battery shield ON.  The ESP32 power LED lights up.  
Switch it OFF again before continuing.

---

### Step 2 · MPU6050 Motion Sensor (GY-521)

| GY-521 Pin | ESP32 Pin | Why |
|---|---|---|
| VCC | **3V3** | ⚠️ 3.3 V ONLY – 5 V will damage the chip |
| GND | GND | |
| SCL | GPIO 22 | I²C clock |
| SDA | GPIO 21 | I²C data |

I²C address: **0x68** (AD0 is pulled LOW on the GY-521 by default).

**Test:** Flash an I²C scanner sketch.  Open the Serial Monitor at 115200 baud.  
You should see `Device found at 0x68`.

<details>
<summary>I²C scanner sketch (click to expand)</summary>

```cpp
#include <Wire.h>
void setup() {
  Serial.begin(115200);
  Wire.begin();
  for (uint8_t a = 1; a < 127; a++) {
    Wire.beginTransmission(a);
    if (Wire.endTransmission() == 0)
      Serial.printf("Device found at 0x%02X\n", a);
  }
}
void loop() {}
```
</details>

---

### Step 3 · Haptic Rumble Circuit

> ⚠️ **Never connect the DC motor directly to an ESP32 GPIO.**  
> Even a small motor draws 100–500 mA – far beyond the 12 mA pin limit.  
> The transistor acts as an electronic switch.

```
ESP32 GPIO 4  ──► 1 kΩ resistor ──► Transistor BASE (middle pin)
                                            │
Transistor EMITTER ────────────────────── GND
Transistor COLLECTOR ────────── Motor negative wire
Motor positive wire  ─────────────────── 5 V rail

Flyback diode across motor terminals:
  Diode ANODE   → Motor negative
  Diode CATHODE → Motor positive  (stripe facing 5 V)
```

**Transistor pin order** (holding flat side toward you, pins down):  
2N2222: **Emitter – Base – Collector**  
BC547:  **Collector – Base – Emitter**  (reversed!)  
Always check your part's datasheet.

**Test:** Upload a sketch that does `digitalWrite(4, HIGH); delay(500); digitalWrite(4, LOW); delay(2000);`.  
The motor pulses every 2 seconds.

---

### Step 4 · Piezo Buzzer

| Component | ESP32 Pin | Other leg |
|---|---|---|
| Piezo **+** | GPIO 2 | GND |

Use a **passive** piezo (no built-in oscillator).  Active buzzers only beep at one fixed pitch.

> Note: GPIO 2 is also connected to the ESP32 DevKit's blue on-board LED.  
> The LED will flicker slightly when the buzzer plays – this is harmless.

**Test:** `tone(2, 440); delay(500); noTone(2);` – should produce an A4 pitch.

---

### Step 5 · Start Button

| Component | ESP32 Pin | Other leg |
|---|---|---|
| Button pin A | GPIO 34 | 3.3 V |
| Button pin B | GND | via 10 kΩ pull-down resistor |

GPIO 34 is **input-only** (no internal pull-up or pull-down).  
The 10 kΩ resistor between GPIO 34 and GND keeps the pin LOW when the button is not pressed.  
When pressed, 3.3 V pulls the pin HIGH.

**Test:** `Serial.println(digitalRead(34));` – prints 0 at rest, 1 when pressed.

---

### Step 6 · 8×8 LED Matrix

This is the most wire-intensive step.  Take your time.  
The pin assignment below avoids ESP32 TX/RX pins (so Serial Monitor keeps working) and avoids strapping pins that cause boot loops.

#### Identifying your matrix pins

Most 1088AS-compatible matrices have the following layout (viewed from **top**, dot-side up):

```
         Col 5  Col 7  Col 2  Col 3  Col 8  Col 1  Col 4  Col 6
          ↓      ↓      ↓      ↓      ↓      ↓      ↓      ↓
Pin 13 ──────────────────────────────────────────────────────── Pin 1
Pin 12 ──────────────────────────────────────────────────────── Pin 2
Pin 11 ──────────────────────────────────────────────────────── Pin 3
Pin 10 ──────────────────────────────────────────────────────── Pin 4
Pin  9 ──────────────────────────────────────────────────────── Pin 5
         Row 1  Row 2  Row 3  Row 4  Row 5  Row 6  Row 7  Row 8
```

Use a coin-cell battery + 100 Ω resistor in series to identify each pin.

#### Row Pins (Anodes – drive HIGH to activate a row)

| Matrix Row | ESP32 GPIO |
|---|---|
| Row 0 | 13 |
| Row 1 | 16 |
| Row 2 | 17 |
| Row 3 | 5 |
| Row 4 | 18 |
| Row 5 | 19 |
| Row 6 | 23 |
| Row 7 | 25 |

#### Column Pins (Cathodes – drive LOW to light an LED)

| Matrix Col | ESP32 GPIO |
|---|---|
| Col 0 | 26 |
| Col 1 | 32 |
| Col 2 | 33 |
| Col 3 | 27 |
| Col 4 | 14 |
| Col 5 | 12 |
| Col 6 | 15 |
| Col 7 | 0 |

> **GPIO 0 note:** GPIO 0 is a boot-strapping pin, but the DevKit's on-board 10 kΩ pull-up keeps it HIGH at boot (= normal run mode). The matrix cathode wires are not strong enough to override this. If you experience "board won't flash" issues, temporarily disconnect the GPIO 0 jumper before pressing the flash button.

> **Image looks wrong?** If the display is mirrored or rotated, **do not re-wire**.  
> Edit the `ROW_PINS[]` or `COL_PINS[]` arrays in `packages/firmware/src/Display.cpp` instead.

**Test:** Flash the full firmware.  You should see the smiley-face title screen.

---

## Final Verification Checklist

- [ ] Power LED lights up when battery shield is switched on
- [ ] Serial Monitor shows `MPU6050 found.` and offset values
- [ ] Boot jingle plays from the piezo buzzer
- [ ] Smiley face appears on the LED matrix
- [ ] Pressing the button starts the game
- [ ] Tilting the board moves the bright pixel
- [ ] Crashing into a wall triggers motor rumble + low buzz
- [ ] Reaching the goal pixel triggers a rising arpeggio

