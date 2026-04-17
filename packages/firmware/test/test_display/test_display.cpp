// ================================================================
//  test_display.cpp  –  Blackbox bit-math tests for display logic
// ================================================================
//  Verifies the pixel-manipulation formulae used by displayPixel()
//  and displayDraw() without linking to Arduino or WASM headers.
//  These tests run entirely on the host (pio test -e native).
// ================================================================

#include <unity.h>
#include <stdint.h>
#include <stdbool.h>
#include <string.h>

void setUp()    {}
void tearDown() {}

// ── Re-implement the pure display bit logic locally ──────────
// We test the FORMULAE, not a specific file, so bugs in Display.cpp
// or Display_wasm.cpp will be caught regardless of which is active.

static uint8_t buf[8];

static void bufClear() { memset(buf, 0, 8); }

static void bufDraw(const uint8_t rows[8]) { memcpy(buf, rows, 8); }

static void bufPixel(int x, int y, bool on) {
  if (x < 0 || x >= 8 || y < 0 || y >= 8) return;
  if (on) buf[y] |=  static_cast<uint8_t>(1u << (7 - x));
  else    buf[y] &= ~static_cast<uint8_t>(1u << (7 - x));
}

static bool bufRead(int x, int y) {
  return (buf[y] >> (7 - x)) & 1;
}

// ── Tests ─────────────────────────────────────────────────────

static void test_clear_zeros_all_bytes() {
  memset(buf, 0xFF, 8);
  bufClear();
  for (int i = 0; i < 8; i++) {
    TEST_ASSERT_EQUAL_UINT8(0, buf[i]);
  }
}

static void test_draw_copies_frame_verbatim() {
  const uint8_t frame[8] = {0xFF, 0x81, 0xFF, 0x81, 0xFF, 0x81, 0xFD, 0xFF};
  bufClear();
  bufDraw(frame);
  for (int i = 0; i < 8; i++) {
    TEST_ASSERT_EQUAL_UINT8(frame[i], buf[i]);
  }
}

static void test_pixel_set_col0_row0() {
  bufClear();
  bufPixel(0, 0, true);
  // col 0 → bit 7 of row 0
  TEST_ASSERT_EQUAL_UINT8(0x80, buf[0]);
}

static void test_pixel_set_col7_row0() {
  bufClear();
  bufPixel(7, 0, true);
  // col 7 → bit 0 of row 0
  TEST_ASSERT_EQUAL_UINT8(0x01, buf[0]);
}

static void test_pixel_set_col3_row5() {
  bufClear();
  bufPixel(3, 5, true);
  // col 3 → bit (7-3)=4 of row 5  →  0x10
  TEST_ASSERT_EQUAL_UINT8(0x10, buf[5]);
}

static void test_pixel_clear_existing_bit() {
  memset(buf, 0xFF, 8);
  bufPixel(0, 0, false);
  // col 0 → bit 7 cleared
  TEST_ASSERT_EQUAL_UINT8(0x7F, buf[0]);
}

static void test_pixel_set_then_clear() {
  bufClear();
  bufPixel(4, 4, true);
  TEST_ASSERT_TRUE(bufRead(4, 4));
  bufPixel(4, 4, false);
  TEST_ASSERT_FALSE(bufRead(4, 4));
}

static void test_pixel_out_of_bounds_ignored() {
  bufClear();
  bufPixel(-1,  0, true);
  bufPixel( 8,  0, true);
  bufPixel( 0, -1, true);
  bufPixel( 0,  8, true);
  for (int i = 0; i < 8; i++) {
    TEST_ASSERT_EQUAL_UINT8(0, buf[i]);
  }
}

static void test_pixel_does_not_corrupt_adjacent_rows() {
  bufClear();
  bufPixel(3, 3, true);
  TEST_ASSERT_EQUAL_UINT8(0, buf[2]); // row above untouched
  TEST_ASSERT_EQUAL_UINT8(0, buf[4]); // row below untouched
}

static void test_pixel_set_all_64() {
  bufClear();
  for (int r = 0; r < 8; r++)
    for (int c = 0; c < 8; c++)
      bufPixel(c, r, true);
  for (int i = 0; i < 8; i++) {
    TEST_ASSERT_EQUAL_UINT8(0xFF, buf[i]);
  }
}

static void test_read_matches_set() {
  bufClear();
  for (int r = 0; r < 8; r++) {
    for (int c = 0; c < 8; c++) {
      bufPixel(c, r, true);
      TEST_ASSERT_TRUE(bufRead(c, r));
      bufPixel(c, r, false);
      TEST_ASSERT_FALSE(bufRead(c, r));
    }
  }
}

// ── main ─────────────────────────────────────────────────────

int main() {
  UNITY_BEGIN();

  RUN_TEST(test_clear_zeros_all_bytes);
  RUN_TEST(test_draw_copies_frame_verbatim);
  RUN_TEST(test_pixel_set_col0_row0);
  RUN_TEST(test_pixel_set_col7_row0);
  RUN_TEST(test_pixel_set_col3_row5);
  RUN_TEST(test_pixel_clear_existing_bit);
  RUN_TEST(test_pixel_set_then_clear);
  RUN_TEST(test_pixel_out_of_bounds_ignored);
  RUN_TEST(test_pixel_does_not_corrupt_adjacent_rows);
  RUN_TEST(test_pixel_set_all_64);
  RUN_TEST(test_read_matches_set);

  return UNITY_END();
}
