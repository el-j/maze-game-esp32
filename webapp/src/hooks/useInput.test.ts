import { renderHook, act } from "@testing-library/react";
import { useInput } from "./useInput";

describe("useInput", () => {
  it("initial state is zeros", () => {
    const { result } = renderHook(() => useInput());
    expect(result.current.ax).toBe(0);
    expect(result.current.ay).toBe(0);
    expect(result.current.btn).toBe(false);
  });

  it("keydown ArrowRight sets ax > 0", () => {
    const { result } = renderHook(() => useInput());
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });
    expect(result.current.ax).toBeGreaterThan(0);
  });

  it("keyup removes key and ax returns to 0", () => {
    const { result } = renderHook(() => useInput());
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowRight" }));
    });
    expect(result.current.ax).toBe(0);
  });

  it("setDpad('right', true) sets ax > 0", () => {
    const { result } = renderHook(() => useInput());
    act(() => {
      result.current.setDpad("right", true);
    });
    expect(result.current.ax).toBeGreaterThan(0);
  });

  it("setBtn(true) sets btn to true", () => {
    const { result } = renderHook(() => useInput());
    act(() => {
      result.current.setBtn(true);
    });
    expect(result.current.btn).toBe(true);
  });

  it("setBtn(false) clears btn override", () => {
    const { result } = renderHook(() => useInput());
    act(() => {
      result.current.setBtn(true);
    });
    act(() => {
      result.current.setBtn(false);
    });
    expect(result.current.btn).toBe(false);
  });

  it("devicemotion event updates axes", () => {
    const { result } = renderHook(() => useInput());
    act(() => {
      const event = new Event("devicemotion") as DeviceMotionEvent & {
        accelerationIncludingGravity: DeviceMotionEventAcceleration;
      };
      Object.defineProperty(event, "accelerationIncludingGravity", {
        value: { x: -2, y: 3, z: 0 },
      });
      window.dispatchEvent(event);
    });
    expect(result.current.ax).toBeCloseTo(2);
    expect(result.current.ay).toBeCloseTo(3);
  });
});
