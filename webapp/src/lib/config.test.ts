import { DEFAULT_CONFIG, exportConfigH } from "./config";

describe("DEFAULT_CONFIG", () => {
  it("has sensitivity 0.05", () => {
    expect(DEFAULT_CONFIG.sensitivity).toBe(0.05);
  });

  it("has friction 0.85", () => {
    expect(DEFAULT_CONFIG.friction).toBe(0.85);
  });

  it("has deadzone 0.5", () => {
    expect(DEFAULT_CONFIG.deadzone).toBe(0.5);
  });

  it("has startingLives 3", () => {
    expect(DEFAULT_CONFIG.startingLives).toBe(3);
  });
});

describe("exportConfigH", () => {
  const output = exportConfigH(DEFAULT_CONFIG);

  it("contains constexpr float SENSITIVITY", () => {
    expect(output).toContain("constexpr float SENSITIVITY");
  });

  it("formats sensitivity to 3 decimal places", () => {
    expect(output).toContain("0.050f");
  });

  it("contains FRICTION", () => {
    expect(output).toContain("constexpr float FRICTION");
  });

  it("contains DEADZONE", () => {
    expect(output).toContain("constexpr float DEADZONE");
  });

  it("contains STARTING_LIVES", () => {
    expect(output).toContain("constexpr int   STARTING_LIVES");
  });
});
