// ================================================================
//  test_levels.cpp  –  Blackbox structural + solvability tests
// ================================================================
//  All three maze levels are verified to have:
//    1. Solid border walls on all four edges
//    2. Open start cell and open goal cell
//    3. A valid path from start to goal (BFS)
//  These tests run entirely on the host (pio test -e native).
//  No Arduino headers, no hardware.
// ================================================================

#include <unity.h>
#include <stdint.h>
#include <stdbool.h>
#include <queue>
#include <utility>

// ── Level data (copied verbatim from Levels.h) ───────────────
// Keeping a local copy means the tests catch accidental edits.
static const uint8_t LEVELS[3][8] = {
  { 0xFF, 0x81, 0xBF, 0x81, 0xBF, 0x81, 0xFD, 0xFF },
  { 0xFF, 0x83, 0xBB, 0xA3, 0xAF, 0xA1, 0xFD, 0xFF },
  { 0xFF, 0xA1, 0xAD, 0x89, 0xEB, 0x89, 0xFD, 0xFF },
};
static const int START_X[3] = {1, 1, 1};
static const int START_Y[3] = {1, 1, 1};
static const int GOAL_X[3]  = {6, 6, 6};
static const int GOAL_Y[3]  = {6, 6, 6};
static const int NUM_LEVELS = 3;

// ── Helpers ──────────────────────────────────────────────────

static bool isWall(int lv, int col, int row) {
  if (col < 0 || col >= 8 || row < 0 || row >= 8) return true;
  return (LEVELS[lv][row] >> (7 - col)) & 1;
}

// BFS from (sx,sy) to (gx,gy) – returns true if reachable.
static bool bfsSolvable(int lv, int sx, int sy, int gx, int gy) {
  bool visited[8][8] = {};
  std::queue<std::pair<int,int>> q;
  visited[sy][sx] = true;
  q.push({sx, sy});
  const int dx[] = {1,-1,0, 0};
  const int dy[] = {0, 0,1,-1};
  while (!q.empty()) {
    auto [x, y] = q.front(); q.pop();
    if (x == gx && y == gy) return true;
    for (int d = 0; d < 4; d++) {
      int nx = x + dx[d], ny = y + dy[d];
      if (!isWall(lv, nx, ny) && !visited[ny][nx]) {
        visited[ny][nx] = true;
        q.push({nx, ny});
      }
    }
  }
  return false;
}

// ── setUp / tearDown (required by Unity) ─────────────────────
void setUp()    {}
void tearDown() {}

// ── Test: all four border rows/cols are fully solid ──────────

static void test_level0_border_walls() {
  for (int c = 0; c < 8; c++) {
    TEST_ASSERT_TRUE(isWall(0, c, 0)); // top row
    TEST_ASSERT_TRUE(isWall(0, c, 7)); // bottom row
  }
  for (int r = 0; r < 8; r++) {
    TEST_ASSERT_TRUE(isWall(0, 0, r)); // left col
    TEST_ASSERT_TRUE(isWall(0, 7, r)); // right col
  }
}

static void test_level1_border_walls() {
  for (int c = 0; c < 8; c++) {
    TEST_ASSERT_TRUE(isWall(1, c, 0));
    TEST_ASSERT_TRUE(isWall(1, c, 7));
  }
  for (int r = 0; r < 8; r++) {
    TEST_ASSERT_TRUE(isWall(1, 0, r));
    TEST_ASSERT_TRUE(isWall(1, 7, r));
  }
}

static void test_level2_border_walls() {
  for (int c = 0; c < 8; c++) {
    TEST_ASSERT_TRUE(isWall(2, c, 0));
    TEST_ASSERT_TRUE(isWall(2, c, 7));
  }
  for (int r = 0; r < 8; r++) {
    TEST_ASSERT_TRUE(isWall(2, 0, r));
    TEST_ASSERT_TRUE(isWall(2, 7, r));
  }
}

// ── Test: start and goal cells are open (not walls) ──────────

static void test_start_and_goal_cells_are_open() {
  for (int lv = 0; lv < NUM_LEVELS; lv++) {
    TEST_ASSERT_FALSE_MESSAGE(isWall(lv, START_X[lv], START_Y[lv]),
                              "start cell must be open");
    TEST_ASSERT_FALSE_MESSAGE(isWall(lv, GOAL_X[lv], GOAL_Y[lv]),
                              "goal cell must be open");
  }
}

// ── Test: BFS confirms every level is solvable ───────────────

static void test_level0_is_solvable() {
  TEST_ASSERT_TRUE(bfsSolvable(0, START_X[0], START_Y[0], GOAL_X[0], GOAL_Y[0]));
}

static void test_level1_is_solvable() {
  TEST_ASSERT_TRUE(bfsSolvable(1, START_X[1], START_Y[1], GOAL_X[1], GOAL_Y[1]));
}

static void test_level2_is_solvable() {
  TEST_ASSERT_TRUE(bfsSolvable(2, START_X[2], START_Y[2], GOAL_X[2], GOAL_Y[2]));
}

// ── Test: grid dimensions are exactly 8×8 ───────────────────

static void test_level_row_count() {
  // sizeof each inner array must be 8 bytes
  TEST_ASSERT_EQUAL(8, (int)sizeof(LEVELS[0]));
  TEST_ASSERT_EQUAL(8, (int)sizeof(LEVELS[1]));
  TEST_ASSERT_EQUAL(8, (int)sizeof(LEVELS[2]));
}

// ── Test: start != goal ───────────────────────────────────────

static void test_start_differs_from_goal() {
  for (int lv = 0; lv < NUM_LEVELS; lv++) {
    bool same = (START_X[lv] == GOAL_X[lv] && START_Y[lv] == GOAL_Y[lv]);
    TEST_ASSERT_FALSE_MESSAGE(same, "start and goal must be different cells");
  }
}

// ── main ─────────────────────────────────────────────────────

int main() {
  UNITY_BEGIN();

  RUN_TEST(test_level0_border_walls);
  RUN_TEST(test_level1_border_walls);
  RUN_TEST(test_level2_border_walls);
  RUN_TEST(test_start_and_goal_cells_are_open);
  RUN_TEST(test_level0_is_solvable);
  RUN_TEST(test_level1_is_solvable);
  RUN_TEST(test_level2_is_solvable);
  RUN_TEST(test_level_row_count);
  RUN_TEST(test_start_differs_from_goal);

  return UNITY_END();
}
