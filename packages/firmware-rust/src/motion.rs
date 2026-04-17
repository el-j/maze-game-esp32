//! Motion sensor abstraction.

/// Calibrated two-axis tilt reading.
#[derive(Default, Clone, Copy, Debug, PartialEq)]
pub struct Tilt {
    /// Positive = board tilted right.
    pub ax: f32,
    /// Positive = board tilted down.
    pub ay: f32,
}

/// Motion sensor trait.  The game engine calls `read()` each tick.
pub trait Motion {
    fn read(&mut self) -> Tilt;
}

#[cfg(test)]
pub mod mock {
    use super::*;

    /// Injects a fixed tilt for testing.
    pub struct MockMotion {
        pub tilt: Tilt,
    }

    impl Motion for MockMotion {
        fn read(&mut self) -> Tilt { self.tilt }
    }
}
