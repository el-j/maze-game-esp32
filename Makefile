# ================================================================
#  Makefile  –  Haptic Tilt-Maze Monorepo
# ================================================================
#  Delegates all firmware commands to packages/firmware/.
#  Requires: PlatformIO Core  →  pip install platformio
#
#  Usage:
#    make build    – compile firmware
#    make upload   – compile + flash to connected ESP32
#    make monitor  – open Serial Monitor (115200 baud)
#    make clean    – remove build artefacts
# ================================================================

FIRMWARE_DIR := packages/firmware

.PHONY: build upload monitor clean

build:
	cd $(FIRMWARE_DIR) && pio run

upload:
	cd $(FIRMWARE_DIR) && pio run --target upload

monitor:
	cd $(FIRMWARE_DIR) && pio device monitor

clean:
	cd $(FIRMWARE_DIR) && pio run --target clean
