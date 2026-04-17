import { clampTilt, parseDpadAxes, parseKeyboardAxes, KEY_SCALE } from "./input";

describe("parseKeyboardAxes", () => {
  it("returns ax=KEY_SCALE for ArrowRight", () => {
    expect(parseKeyboardAxes(new Set(["ArrowRight"]))).toEqual({
      ax: KEY_SCALE,
      ay: 0,
    });
  });

  it("returns ax=-KEY_SCALE for 'a'", () => {
    expect(parseKeyboardAxes(new Set(["a"]))).toEqual({
      ax: -KEY_SCALE,
      ay: 0,
    });
  });

  it("returns ay=KEY_SCALE for ArrowDown", () => {
    expect(parseKeyboardAxes(new Set(["ArrowDown"]))).toEqual({
      ax: 0,
      ay: KEY_SCALE,
    });
  });

  it("returns ay=-KEY_SCALE for 'w'", () => {
    expect(parseKeyboardAxes(new Set(["w"]))).toEqual({
      ax: 0,
      ay: -KEY_SCALE,
    });
  });

  it("returns {ax:0,ay:0} for empty set", () => {
    expect(parseKeyboardAxes(new Set())).toEqual({ ax: 0, ay: 0 });
  });

  it("handles diagonal (ArrowRight + ArrowDown)", () => {
    const result = parseKeyboardAxes(new Set(["ArrowRight", "ArrowDown"]));
    expect(result.ax).toBe(KEY_SCALE);
    expect(result.ay).toBe(KEY_SCALE);
  });
});

describe("parseDpadAxes", () => {
  it("right → ax=KEY_SCALE", () => {
    expect(parseDpadAxes(false, false, false, true)).toEqual({
      ax: KEY_SCALE,
      ay: 0,
    });
  });

  it("left → ax=-KEY_SCALE", () => {
    expect(parseDpadAxes(false, false, true, false)).toEqual({
      ax: -KEY_SCALE,
      ay: 0,
    });
  });

  it("down → ay=KEY_SCALE", () => {
    expect(parseDpadAxes(false, true, false, false)).toEqual({
      ax: 0,
      ay: KEY_SCALE,
    });
  });

  it("up → ay=-KEY_SCALE", () => {
    expect(parseDpadAxes(true, false, false, false)).toEqual({
      ax: 0,
      ay: -KEY_SCALE,
    });
  });

  it("none → {0,0}", () => {
    expect(parseDpadAxes(false, false, false, false)).toEqual({ ax: 0, ay: 0 });
  });
});

describe("clampTilt", () => {
  it("clamps values to ±4.0 by default", () => {
    expect(clampTilt(10, -10)).toEqual({ ax: 4, ay: -4 });
  });

  it("clamps with custom max", () => {
    expect(clampTilt(5, -5, 2)).toEqual({ ax: 2, ay: -2 });
  });

  it("passes through values within range", () => {
    expect(clampTilt(1.5, -2.0)).toEqual({ ax: 1.5, ay: -2.0 });
  });
});
