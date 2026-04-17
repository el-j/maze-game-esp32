# Haptic Tilt-Maze – Monorepo Makefile
# Requires: PlatformIO Core (pio)
# Install: pip install platformio

.PHONY: build upload monitor clean

build:
	pio run

upload:
	pio run --target upload

monitor:
	pio device monitor

clean:
	pio run --target clean
