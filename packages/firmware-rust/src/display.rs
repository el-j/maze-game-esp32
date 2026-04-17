//! 8×8 LED matrix display buffer and hardware abstraction.

/// Pure 8-byte frame buffer.  Bit 7 of each byte = column 0 (left).
#[derive(Default, Clone, Copy)]
pub struct DisplayBuffer {
    pub rows: [u8; 8],
}

impl DisplayBuffer {
    /// Clear all LEDs.
    pub fn clear(&mut self) {
        self.rows = [0; 8];
    }

    /// Set or clear a single pixel (x = col, y = row).
    /// Out-of-range coordinates are silently ignored.
    pub fn set_pixel(&mut self, x: usize, y: usize, on: bool) {
        if x >= 8 || y >= 8 {
            return;
        }
        if on {
            self.rows[y] |= 1 << (7 - x);
        } else {
            self.rows[y] &= !(1 << (7 - x));
        }
    }

    /// Read a pixel.
    pub fn get_pixel(&self, x: usize, y: usize) -> bool {
        if x >= 8 || y >= 8 {
            return false;
        }
        (self.rows[y] >> (7 - x)) & 1 == 1
    }

    /// Overwrite the entire buffer from a level byte array.
    pub fn load(&mut self, rows: &[u8; 8]) {
        self.rows = *rows;
    }
}

/// Hardware display trait.  The game engine calls these methods to
/// render; the hardware implementation drives the GPIO pins.
pub trait Display {
    fn draw(&mut self, buf: &DisplayBuffer);
    fn clear(&mut self);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn clear_zeros_all_bytes() {
        let mut buf = DisplayBuffer { rows: [0xFF; 8] };
        buf.clear();
        assert_eq!(buf.rows, [0u8; 8]);
    }

    #[test]
    fn set_pixel_col0_row0() {
        let mut buf = DisplayBuffer::default();
        buf.set_pixel(0, 0, true);
        assert_eq!(buf.rows[0], 0x80);
    }

    #[test]
    fn set_pixel_col7_row0() {
        let mut buf = DisplayBuffer::default();
        buf.set_pixel(7, 0, true);
        assert_eq!(buf.rows[0], 0x01);
    }

    #[test]
    fn set_pixel_col3_row5() {
        let mut buf = DisplayBuffer::default();
        buf.set_pixel(3, 5, true);
        assert_eq!(buf.rows[5], 0x10);
    }

    #[test]
    fn clear_pixel_existing_bit() {
        let mut buf = DisplayBuffer { rows: [0xFF; 8] };
        buf.set_pixel(0, 0, false);
        assert_eq!(buf.rows[0], 0x7F);
    }

    #[test]
    fn set_then_clear() {
        let mut buf = DisplayBuffer::default();
        buf.set_pixel(4, 4, true);
        assert!(buf.get_pixel(4, 4));
        buf.set_pixel(4, 4, false);
        assert!(!buf.get_pixel(4, 4));
    }

    #[test]
    fn out_of_bounds_ignored() {
        let mut buf = DisplayBuffer::default();
        buf.set_pixel(8, 0, true);
        buf.set_pixel(0, 8, true);
        assert_eq!(buf.rows, [0u8; 8]);
    }

    #[test]
    fn set_all_64_pixels() {
        let mut buf = DisplayBuffer::default();
        for r in 0..8 {
            for c in 0..8 {
                buf.set_pixel(c, r, true);
            }
        }
        assert_eq!(buf.rows, [0xFF; 8]);
    }

    #[test]
    fn load_copies_verbatim() {
        let mut buf = DisplayBuffer::default();
        let frame = [0xFF, 0x81, 0xFF, 0x81, 0xFF, 0x81, 0xFD, 0xFF];
        buf.load(&frame);
        assert_eq!(buf.rows, frame);
    }
}
