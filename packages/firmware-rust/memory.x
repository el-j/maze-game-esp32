/* ESP32 memory map for esp-hal.
   Region names must match what esp-hal's alias.x expects:
   irom_seg, iram_seg, drom_seg, dram_seg, etc.
   See: https://github.com/esp-rs/esp-hal/blob/v0.23.1/esp-hal/ld/esp32/memory.x */

/* override entry point */
ENTRY(ESP32Reset)

INCLUDE "memory_extras.x"

MEMORY
{
  reserved_cache_seg     : ORIGIN = 0x40070000, len = 64k
  vectors_seg ( RX )     : ORIGIN = 0x40080000, len =  1k
  iram_seg ( RX )        : ORIGIN = 0x40080400, len = 128k - 0x400

  reserved_for_rom_seg   : ORIGIN = 0x3FFAE000, len = 8k
  dram_seg ( RW )        : ORIGIN = 0x3FFB0000 + RESERVE_DRAM, len = 176k - RESERVE_DRAM

  reserved_rom_data_pro  : ORIGIN = 0x3ffe0000, len = 1088
  reserved_rom_data_app  : ORIGIN = 0x3ffe3f20, len = 1072
  reserved_rom_stack_pro : ORIGIN = 0x3ffe1320, len = 11264
  reserved_rom_stack_app : ORIGIN = 0x3ffe5230, len = 11264

  dram2_seg              : ORIGIN = 0x3ffe7e30, len = 98767

  /* external flash */
  irom_seg ( RX )        : ORIGIN = 0x400D0020, len = 3M - 0x20
  drom_seg ( R )         : ORIGIN = 0x3F400020, len = 4M - 0x20

  /* RTC fast memory */
  rtc_fast_iram_seg(RWX) : ORIGIN = 0x400C0000, len = 8k
  rtc_fast_dram_seg(RW)  : ORIGIN = 0x3FF80000, len = 8k

  /* RTC slow memory */
  rtc_slow_seg(RW)       : ORIGIN = 0x50000000, len = 8k
}
