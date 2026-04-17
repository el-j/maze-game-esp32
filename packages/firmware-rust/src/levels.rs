//! Maze level data – port of packages/firmware/src/Levels.h.
//! Each level is 8 bytes (one per row); bit 7 = column 0.
//! 1 = wall, 0 = open path.
//!
//! **Level 1 deviation from C++ source**: The original C++ Level 1 data
//! (`[0xFF, 0x81, 0xFF, 0x81, 0xFF, 0x81, 0xFD, 0xFF]`) creates three
//! horizontally isolated corridors with no vertical connections between rows,
//! making the start cell (1,1) unreachable from the goal cell (6,6) via
//! step-by-step pathfinding.  The Rust version uses
//! `[0xFF, 0x81, 0xBF, 0x81, 0xBF, 0x81, 0xFD, 0xFF]` which adds left-side
//! vertical connectors (col 1 open in rows 2 and 4), creating a proper
//! connected C-shape that satisfies the BFS solvability invariant.

pub const NUM_LEVELS: usize = 3;

pub const LEVELS: [[u8; 8]; NUM_LEVELS] = [
    // Level 1: C-Shape corridor – three horizontal runs connected on the left.
    // Visual:
    //   ████████
    //   █······█
    //   █·██████
    //   █······█
    //   █·██████
    //   █······█
    //   ██████·█
    //   ████████
    [0xFF, 0x81, 0xBF, 0x81, 0xBF, 0x81, 0xFD, 0xFF],
    // Level 2: Zigzag
    [0xFF, 0x83, 0xBB, 0xA3, 0xAF, 0xA1, 0xFD, 0xFF],
    // Level 3: Tight Corridors
    [0xFF, 0xA1, 0xAD, 0x89, 0xEB, 0x89, 0xFD, 0xFF],
];

pub const START_X: [usize; NUM_LEVELS] = [1, 1, 1];
pub const START_Y: [usize; NUM_LEVELS] = [1, 1, 1];
pub const GOAL_X: [usize; NUM_LEVELS] = [6, 6, 6];
pub const GOAL_Y: [usize; NUM_LEVELS] = [6, 6, 6];

/// Returns true if the cell (col, row) is a wall in the given level.
/// Out-of-bounds coordinates are always walls.
#[inline(always)]
pub fn is_wall(level: usize, col: usize, row: usize) -> bool {
    if col >= 8 || row >= 8 {
        return true;
    }
    (LEVELS[level][row] >> (7 - col)) & 1 == 1
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::VecDeque;

    fn bfs_solvable(lv: usize, sx: usize, sy: usize, gx: usize, gy: usize) -> bool {
        let mut visited = [[false; 8]; 8];
        let mut queue = VecDeque::new();
        visited[sy][sx] = true;
        queue.push_back((sx, sy));
        let dirs: [(i32, i32); 4] = [(1, 0), (-1, 0), (0, 1), (0, -1)];
        while let Some((x, y)) = queue.pop_front() {
            if x == gx && y == gy {
                return true;
            }
            for (dx, dy) in &dirs {
                let nx = x as i32 + dx;
                let ny = y as i32 + dy;
                if nx >= 0 && ny >= 0 {
                    let (nx, ny) = (nx as usize, ny as usize);
                    if nx < 8 && ny < 8 && !is_wall(lv, nx, ny) && !visited[ny][nx] {
                        visited[ny][nx] = true;
                        queue.push_back((nx, ny));
                    }
                }
            }
        }
        false
    }

    #[test]
    fn all_levels_have_solid_borders() {
        for lv in 0..NUM_LEVELS {
            for c in 0..8usize {
                assert!(is_wall(lv, c, 0), "level {lv} top row col {c} must be wall");
                assert!(
                    is_wall(lv, c, 7),
                    "level {lv} bottom row col {c} must be wall"
                );
            }
            for r in 0..8usize {
                assert!(
                    is_wall(lv, 0, r),
                    "level {lv} left col row {r} must be wall"
                );
                assert!(
                    is_wall(lv, 7, r),
                    "level {lv} right col row {r} must be wall"
                );
            }
        }
    }

    #[test]
    fn start_and_goal_cells_are_open() {
        for lv in 0..NUM_LEVELS {
            assert!(
                !is_wall(lv, START_X[lv], START_Y[lv]),
                "level {lv} start must be open"
            );
            assert!(
                !is_wall(lv, GOAL_X[lv], GOAL_Y[lv]),
                "level {lv} goal must be open"
            );
        }
    }

    #[test]
    fn all_levels_are_bfs_solvable() {
        for lv in 0..NUM_LEVELS {
            assert!(
                bfs_solvable(lv, START_X[lv], START_Y[lv], GOAL_X[lv], GOAL_Y[lv]),
                "level {lv} has no path from start to goal"
            );
        }
    }

    #[test]
    fn start_differs_from_goal() {
        for lv in 0..NUM_LEVELS {
            assert!(
                !(START_X[lv] == GOAL_X[lv] && START_Y[lv] == GOAL_Y[lv]),
                "level {lv}: start == goal"
            );
        }
    }

    #[test]
    fn out_of_bounds_is_wall() {
        assert!(is_wall(0, 8, 0));
        assert!(is_wall(0, 0, 8));
    }
}
