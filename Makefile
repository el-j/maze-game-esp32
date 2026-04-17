# ================================================================
#  Makefile  –  Haptic Tilt-Maze Monorepo
# ================================================================
#  Delegates firmware commands to packages/firmware/ and
#  packages/firmware-rust/.  Also manages the Next.js webapp.
#
#  Prerequisites
#  ─────────────
#  Firmware C++:  pip install platformio
#  Firmware Rust: cargo install espup && espup install
#                 (activates the esp toolchain in your shell)
#  WASM build:    install Emscripten SDK (emcc must be on PATH)
#  Webapp:        node + npm  (cd webapp && npm install)
#
#  Usage
#  ─────
#  make build          – compile C++ firmware (release)
#  make upload         – compile + flash C++ firmware
#  make monitor        – open Serial Monitor (115200 baud)
#  make clean          – remove C++ build artefacts
#  make debug-build    – compile C++ debug build (WiFi dashboard)
#  make debug-upload   – compile + flash C++ debug build
#  make test           – run C++ native unit tests on host
#
#  make rust-build     – cross-compile Rust firmware for ESP32
#  make rust-test      – run Rust lib tests on host (no hardware)
#  make rust-flash     – flash Rust firmware to connected ESP32
#  make rust-size      – print Rust release binary size
#
#  make wasm           – compile game.wasm + game.js (requires emcc)
#  make webapp         – install deps + run webapp tests + static build
#  make webapp-dev     – start Next.js dev server
#
#  make size-comparison – build both firmwares, print size table
# ================================================================

FIRMWARE_DIR      := packages/firmware
FIRMWARE_RUST_DIR := packages/firmware-rust
WEBAPP_DIR        := webapp

.PHONY: build upload monitor clean debug-build debug-upload test \
        rust-build rust-test rust-flash rust-size \
        wasm webapp webapp-dev size-comparison

# ── C++ Firmware ─────────────────────────────────────────────────────────────

build:
	cd $(FIRMWARE_DIR) && pio run -e esp32dev

upload:
	cd $(FIRMWARE_DIR) && pio run -e esp32dev --target upload

monitor:
	cd $(FIRMWARE_DIR) && pio device monitor

clean:
	cd $(FIRMWARE_DIR) && pio run --target clean

debug-build:
	cd $(FIRMWARE_DIR) && pio run -e esp32dev-debug

debug-upload:
	cd $(FIRMWARE_DIR) && pio run -e esp32dev-debug --target upload

test:
	cd $(FIRMWARE_DIR) && pio test -e native

# ── Rust Firmware ─────────────────────────────────────────────────────────────

rust-build:
	cd $(FIRMWARE_RUST_DIR) && \
	  cargo build --release --features esp32-target \
	              --target xtensa-esp32-none-elf

rust-test:
	cd $(FIRMWARE_RUST_DIR) && cargo test --lib

rust-flash:
	cd $(FIRMWARE_RUST_DIR) && \
	  cargo run --release --features esp32-target \
	            --target xtensa-esp32-none-elf

rust-size:
	@echo "=== Rust firmware binary size ==="
	@SIZE_BIN=$$(find ~/.rustup/toolchains/esp -name "xtensa-esp32-elf-size" 2>/dev/null | head -1); \
	  ELF=$(FIRMWARE_RUST_DIR)/target/xtensa-esp32-none-elf/release/maze-game-esp32-rust; \
	  if [ -n "$$SIZE_BIN" ] && [ -f "$$ELF" ]; then \
	    "$$SIZE_BIN" "$$ELF"; \
	  else \
	    echo "Run 'make rust-build' first, and ensure the esp toolchain is active."; \
	  fi

# ── WebAssembly ──────────────────────────────────────────────────────────────

wasm:
	@command -v emcc >/dev/null 2>&1 || { echo "emcc not found. Install Emscripten SDK."; exit 1; }
	mkdir -p $(WEBAPP_DIR)/public
	emcc \
	  $(FIRMWARE_DIR)/src/Game.cpp \
	  $(FIRMWARE_DIR)/src/Feedback.cpp \
	  $(FIRMWARE_DIR)/wasm/hal_wasm.cpp \
	  $(FIRMWARE_DIR)/wasm/Display_wasm.cpp \
	  $(FIRMWARE_DIR)/wasm/Motion_wasm.cpp \
	  $(FIRMWARE_DIR)/wasm/config_wasm.cpp \
	  $(FIRMWARE_DIR)/wasm/main_wasm.cpp \
	  -I $(FIRMWARE_DIR)/wasm/ \
	  -I $(FIRMWARE_DIR)/src/ \
	  -DWASM_BUILD \
	  -DARDUINO=200 \
	  -s EXPORTED_FUNCTIONS='["_wasmInit","_wasmTick","_wasmSetTiltExport","_wasmSetButton","_wasmGetDisplay","_wasmNoteHz","_wasmMotorDuty","_wasmGetState","_wasmGetLives","_wasmGetLevel","_wasmSetSensitivity","_wasmSetFriction","_wasmSetDeadzone","_wasmSetStartingLives","_wasmResetGame","_malloc","_free"]' \
	  -s EXPORTED_RUNTIME_METHODS='["HEAPU8","HEAPU16"]' \
	  -s MODULARIZE=1 \
	  -s EXPORT_NAME='MazeGame' \
	  -s ENVIRONMENT=web \
	  -s ALLOW_MEMORY_GROWTH=1 \
	  -s INITIAL_MEMORY=2097152 \
	  -O2 \
	  -std=c++17 \
	  -o $(WEBAPP_DIR)/public/game.js
	@echo "WASM build complete: $(WEBAPP_DIR)/public/game.{js,wasm}"

# ── Webapp ───────────────────────────────────────────────────────────────────

webapp:
	cd $(WEBAPP_DIR) && npm install && npm test && npm run build

webapp-dev:
	cd $(WEBAPP_DIR) && npm install && npm run dev

# ── Size comparison (both firmwares must be built first) ─────────────────────

size-comparison: build rust-build
	@echo ""
	@echo "╔══════════════════════════════════════════════════════════╗"
	@echo "║         C++ vs Rust  –  Binary Size Comparison          ║"
	@echo "╠══════════════════════════════════════════════════════════╣"
	@CPP_ELF=$$(find $(FIRMWARE_DIR)/.pio/build/esp32dev -name "firmware.elf" 2>/dev/null | head -1); \
	  if [ -n "$$CPP_ELF" ]; then \
	    echo "║  C++  (Arduino / PlatformIO)                             ║"; \
	    size "$$CPP_ELF" 2>/dev/null || xtensa-esp32-elf-size "$$CPP_ELF" 2>/dev/null || echo "║    (size tool not found)                                 ║"; \
	  fi
	@SIZE_BIN=$$(find ~/.rustup/toolchains/esp -name "xtensa-esp32-elf-size" 2>/dev/null | head -1); \
	  RUST_ELF=$(FIRMWARE_RUST_DIR)/target/xtensa-esp32-none-elf/release/maze-game-esp32-rust; \
	  if [ -n "$$SIZE_BIN" ] && [ -f "$$RUST_ELF" ]; then \
	    echo "║  Rust (esp-hal bare-metal)                               ║"; \
	    "$$SIZE_BIN" "$$RUST_ELF"; \
	  fi
	@echo "╚══════════════════════════════════════════════════════════╝"
