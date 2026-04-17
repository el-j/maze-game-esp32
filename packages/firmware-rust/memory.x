/* ESP32 memory map */
MEMORY {
    /* IRAM – instruction RAM, fast execution */
    IRAM : ORIGIN = 0x40080000, LENGTH = 128K
    /* DRAM – data RAM */
    DRAM : ORIGIN = 0x3FFB0000, LENGTH = 320K
}
