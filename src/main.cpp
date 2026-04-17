#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

// ============================================================
// PIN DEFINITIONS
// ============================================================
#define MOTOR_PIN   4
#define BUZZER_PIN  2
#define BUTTON_PIN  34  // Input-only pin; no internal pull-up/down

const int ROW_PINS[8] = {13, 16, 17,  5, 18, 19, 23, 25};
const int COL_PINS[8] = {26, 32, 33, 27, 14, 12, 15,  0};

// ============================================================
// DISPLAY BUFFER & MULTIPLEXING
// ============================================================
volatile byte displayBuffer[8] = {0};
volatile int  currentRow       = 0;
hw_timer_t   *muxTimer         = NULL;
portMUX_TYPE  muxLock          = portMUX_INITIALIZER_UNLOCKED;

void IRAM_ATTR onTimer() {
  portENTER_CRITICAL_ISR(&muxLock);
  // 1. Blank all columns to prevent ghosting
  for (int i = 0; i < 8; i++) digitalWrite(COL_PINS[i], HIGH);
  // 2. Deactivate current row
  digitalWrite(ROW_PINS[currentRow], LOW);
  // 3. Advance row
  currentRow = (currentRow + 1) % 8;
  // 4. Set column bits for new row
  for (int i = 0; i < 8; i++) {
    if (bitRead(displayBuffer[currentRow], 7 - i)) digitalWrite(COL_PINS[i], LOW);
  }
  // 5. Activate row
  digitalWrite(ROW_PINS[currentRow], HIGH);
  portEXIT_CRITICAL_ISR(&muxLock);
}

// ============================================================
// RENDER HELPERS
// ============================================================
void clearScreen() {
  portENTER_CRITICAL(&muxLock);
  for (int i = 0; i < 8; i++) displayBuffer[i] = 0;
  portEXIT_CRITICAL(&muxLock);
}

void drawPixel(int x, int y, bool state = true) {
  if (x < 0 || x >= 8 || y < 0 || y >= 8) return;
  portENTER_CRITICAL(&muxLock);
  if (state) bitSet(displayBuffer[y], 7 - x);
  else       bitClear(displayBuffer[y], 7 - x);
  portEXIT_CRITICAL(&muxLock);
}

void loadLevel(const byte map[8]) {
  portENTER_CRITICAL(&muxLock);
  for (int i = 0; i < 8; i++) displayBuffer[i] = map[i];
  portEXIT_CRITICAL(&muxLock);
}

// ============================================================
// GAME DATA
// ============================================================
enum GameState { STATE_TITLE, STATE_PLAYING, STATE_CRASHED, STATE_GAMEOVER, STATE_VICTORY };
GameState currentState = STATE_TITLE;

static const byte NUM_LEVELS = 3;

const byte levels[NUM_LEVELS][8] = {
  { // Level 1 – Simple C-Shape
    B11111111,
    B10000001,
    B10111111,
    B10000001,
    B10111111,
    B10000001,
    B11111101,
    B11111111
  },
  { // Level 2 – Winding Path
    B11111111,
    B10000011,
    B10111011,
    B10100011,
    B10101111,
    B10100001,
    B11111101,
    B11111111
  },
  { // Level 3 – Tight Corridors
    B11111111,
    B10100001,
    B10101101,
    B10001001,
    B11101011,
    B10001001,
    B11111101,
    B11111111
  }
};

const int START_X[NUM_LEVELS] = {1, 1, 1};
const int START_Y[NUM_LEVELS] = {1, 1, 1};
const int GOAL_X[NUM_LEVELS]  = {6, 6, 6};
const int GOAL_Y[NUM_LEVELS]  = {6, 6, 6};

// ============================================================
// PHYSICS
// ============================================================
float playerX = 1.0f, playerY = 1.0f;
float velX    = 0.0f, velY    = 0.0f;

static const float FRICTION     = 0.85f;
static const float SENSITIVITY  = 0.05f;
static const float DEADZONE     = 0.5f;

int  lives        = 3;
int  currentLevel = 0;

// IMU calibration offsets (populated at boot on flat surface)
float accelOffsetX = 0.0f;
float accelOffsetY = 0.0f;

// ============================================================
// HAPTIC & AUDIO (non-blocking)
// ============================================================
unsigned long rumbleEnd = 0;
unsigned long toneEnd   = 0;

// LEDC channel for motor PWM
static const int MOTOR_LEDC_CH   = 0;
static const int MOTOR_LEDC_FREQ = 5000;
static const int MOTOR_LEDC_BITS = 8;

void feedbackUpdate() {
  if (millis() > rumbleEnd) ledcWrite(MOTOR_LEDC_CH, 0);
  if (millis() > toneEnd)   noTone(BUZZER_PIN);
}

void triggerCrash() {
  ledcWrite(MOTOR_LEDC_CH, 160);       // ~63% duty – soft rumble
  rumbleEnd = millis() + 250;
  tone(BUZZER_PIN, 150);
  toneEnd = millis() + 200;
}

void triggerLevelUp() {
  tone(BUZZER_PIN, 800);
  toneEnd = millis() + 500;
}

void triggerVictory() {
  tone(BUZZER_PIN, 1200);
  toneEnd = millis() + 800;
}

// ============================================================
// MPU6050
// ============================================================
Adafruit_MPU6050 mpu;

void calibrateIMU() {
  const int SAMPLES = 100;
  float sumX = 0, sumY = 0;
  for (int i = 0; i < SAMPLES; i++) {
    sensors_event_t a, g, t;
    mpu.getEvent(&a, &g, &t);
    sumX += -a.acceleration.y;
    sumY +=  a.acceleration.x;
    delay(5);
  }
  accelOffsetX = sumX / SAMPLES;
  accelOffsetY = sumY / SAMPLES;
  Serial.printf("IMU offsets: X=%.3f  Y=%.3f\n", accelOffsetX, accelOffsetY);
}

// ============================================================
// SETUP
// ============================================================
void setup() {
  Serial.begin(115200);

  // GPIO init
  pinMode(BUTTON_PIN, INPUT);
  ledcSetup(MOTOR_LEDC_CH, MOTOR_LEDC_FREQ, MOTOR_LEDC_BITS);
  ledcAttachPin(MOTOR_PIN, MOTOR_LEDC_CH);
  ledcWrite(MOTOR_LEDC_CH, 0);
  pinMode(BUZZER_PIN, OUTPUT);

  for (int i = 0; i < 8; i++) {
    pinMode(ROW_PINS[i], OUTPUT);
    pinMode(COL_PINS[i], OUTPUT);
    digitalWrite(ROW_PINS[i], LOW);
    digitalWrite(COL_PINS[i], HIGH);
  }

  // MPU6050
  Wire.begin();
  if (!mpu.begin()) {
    Serial.println("MPU6050 not found – halting");
    while (true) delay(10);
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  calibrateIMU();

  // Matrix multiplexing timer (1 kHz → 125 Hz per row)
  muxTimer = timerBegin(0, 80, true);       // 80 MHz / 80 = 1 MHz tick
  timerAttachInterrupt(muxTimer, &onTimer, true);
  timerAlarmWrite(muxTimer, 1000, true);    // 1000 ticks = 1 ms
  timerAlarmEnable(muxTimer);

  Serial.println("Boot OK");
}

// ============================================================
// MAIN LOOP
// ============================================================
void loop() {
  feedbackUpdate();

  bool btn = digitalRead(BUTTON_PIN);  // active-HIGH (wired to 3.3V)

  switch (currentState) {

    // ── TITLE ──────────────────────────────────────────────
    case STATE_TITLE:
      clearScreen();
      displayBuffer[2] = B00100100;  // eyes
      displayBuffer[3] = B00100100;
      displayBuffer[5] = B01000010;  // mouth corners
      displayBuffer[6] = B00111100;  // mouth arc
      if (btn) {
        lives        = 3;
        currentLevel = 0;
        playerX      = START_X[0];
        playerY      = START_Y[0];
        velX = velY  = 0.0f;
        currentState = STATE_PLAYING;
        delay(300);
      }
      break;

    // ── PLAYING ────────────────────────────────────────────
    case STATE_PLAYING: {
      sensors_event_t a, g, tmp;
      mpu.getEvent(&a, &g, &tmp);

      float ax = (-a.acceleration.y) - accelOffsetX;
      float ay =  (a.acceleration.x) - accelOffsetY;

      if (fabsf(ax) < DEADZONE) ax = 0.0f;
      if (fabsf(ay) < DEADZONE) ay = 0.0f;

      velX = (velX + ax * SENSITIVITY) * FRICTION;
      velY = (velY + ay * SENSITIVITY) * FRICTION;

      float nx = playerX + velX;
      float ny = playerY + velY;

      bool crashed = false;

      if (nx < 0 || nx >= 8 ||
          bitRead(levels[currentLevel][(int)playerY], 7 - (int)nx)) {
        velX  = -velX * 0.5f;
        nx    = playerX;
        crashed = true;
      }
      if (ny < 0 || ny >= 8 ||
          bitRead(levels[currentLevel][(int)ny], 7 - (int)playerX)) {
        velY  = -velY * 0.5f;
        ny    = playerY;
        crashed = true;
      }

      if (crashed) {
        triggerCrash();
        lives--;
        currentState = (lives <= 0) ? STATE_GAMEOVER : STATE_CRASHED;
      } else {
        playerX = nx;
        playerY = ny;
      }

      // Win check
      if ((int)playerX == GOAL_X[currentLevel] &&
          (int)playerY == GOAL_Y[currentLevel]) {
        currentLevel++;
        if (currentLevel >= NUM_LEVELS) {
          triggerVictory();
          currentState = STATE_VICTORY;
        } else {
          triggerLevelUp();
          playerX = START_X[currentLevel];
          playerY = START_Y[currentLevel];
          velX = velY = 0.0f;
          delay(1000);
        }
        break;
      }

      // Render
      loadLevel(levels[currentLevel]);
      drawPixel((int)playerX, (int)playerY);
      if ((millis() / 200) % 2 == 0)
        drawPixel(GOAL_X[currentLevel], GOAL_Y[currentLevel], false);
      break;
    }

    // ── CRASHED ────────────────────────────────────────────
    case STATE_CRASHED:
      clearScreen();
      for (int i = 0; i < lives; i++) drawPixel(i + 2, 4);
      delay(1500);
      playerX = START_X[currentLevel];
      playerY = START_Y[currentLevel];
      velX = velY = 0.0f;
      currentState = STATE_PLAYING;
      break;

    // ── GAME OVER ──────────────────────────────────────────
    case STATE_GAMEOVER:
      clearScreen();
      displayBuffer[1] = B01000010;
      displayBuffer[2] = B00100100;
      displayBuffer[3] = B00011000;
      displayBuffer[4] = B00011000;
      displayBuffer[5] = B00100100;
      displayBuffer[6] = B01000010;
      if (btn) { currentState = STATE_TITLE; delay(300); }
      break;

    // ── VICTORY ────────────────────────────────────────────
    case STATE_VICTORY:
      clearScreen();
      displayBuffer[4] = B00000001;
      displayBuffer[5] = B00000010;
      displayBuffer[6] = B01000100;
      displayBuffer[7] = B00111000;
      if (btn) { currentState = STATE_TITLE; delay(300); }
      break;
  }

  delay(20);  // ~50 Hz logic loop
}
