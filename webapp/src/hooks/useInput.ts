"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  clampTilt,
  parseDpadAxes,
  parseKeyboardAxes,
  type TiltAxes,
} from "@/lib/input";

export interface DpadState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface InputState extends TiltAxes {
  btn: boolean;
  dpad: DpadState;
}

export function useInput(): InputState & {
  setDpad: (dir: keyof DpadState, pressed: boolean) => void;
  setBtn: (pressed: boolean) => void;
} {
  const heldKeys = useRef(new Set<string>());
  const deviceTilt = useRef<TiltAxes>({ ax: 0, ay: 0 });
  const dpadRef = useRef<DpadState>({
    up: false,
    down: false,
    left: false,
    right: false,
  });
  const btnOverride = useRef(false);

  const [state, setState] = useState<InputState>({
    ax: 0,
    ay: 0,
    btn: false,
    dpad: { up: false, down: false, left: false, right: false },
  });

  const recompute = useCallback(() => {
    const keys = heldKeys.current;
    const dpad = dpadRef.current;
    const kAxes = parseKeyboardAxes(keys);
    const dAxes = parseDpadAxes(dpad.up, dpad.down, dpad.left, dpad.right);
    const raw =
      kAxes.ax !== 0 || kAxes.ay !== 0
        ? kAxes
        : dAxes.ax !== 0 || dAxes.ay !== 0
          ? dAxes
          : deviceTilt.current;
    const { ax, ay } = clampTilt(raw.ax, raw.ay);
    const btn =
      keys.has(" ") ||
      keys.has("Enter") ||
      keys.has("b") ||
      keys.has("B") ||
      btnOverride.current;
    setState((prev) => ({ ...prev, ax, ay, btn, dpad }));
  }, []);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      heldKeys.current.add(e.key);
      if (
        [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.key
        )
      )
        e.preventDefault();
      recompute();
    };
    const onUp = (e: KeyboardEvent) => {
      heldKeys.current.delete(e.key);
      recompute();
    };
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (a) {
        deviceTilt.current = { ax: -(a.x ?? 0), ay: a.y ?? 0 };
        recompute();
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("devicemotion", onMotion as EventListener);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("devicemotion", onMotion as EventListener);
    };
  }, [recompute]);

  const setDpad = useCallback(
    (dir: keyof DpadState, pressed: boolean) => {
      dpadRef.current = { ...dpadRef.current, [dir]: pressed };
      recompute();
    },
    [recompute],
  );

  const setBtn = useCallback(
    (pressed: boolean) => {
      btnOverride.current = pressed;
      recompute();
    },
    [recompute],
  );

  return { ...state, setDpad, setBtn };
}
