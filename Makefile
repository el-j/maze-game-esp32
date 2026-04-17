# ================================================================
#  Makefile  –  Haptic Tilt-Maze Monorepo
# ================================================================
#  Delegates all firmware commands to packages/firmware/.
#  Requires: PlatformIO Core  →  pip install platformio
#
#  Usage:
#    make build          – compile firmware (release)
#    make upload         – compile + flash to connected ESP32
#    make monitor        – open Serial Monitor (115200 baud)
#    make clean          – remove build artefacts
#    make debug-build    – compile firmware with WiFi debug dashboard
#    make debug-upload   – compile + flash debug build
#    make test           – run native unit tests on host (no hardware needed)
# ================================================================

FIRMWARE_DIR := packages/firmware

.PHONY: build upload monitor clean debug-build debug-upload test

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
