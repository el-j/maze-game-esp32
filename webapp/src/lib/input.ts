export interface TiltAxes {
  ax: number;
  ay: number;
}

export const KEY_SCALE = 2.0;

export function parseKeyboardAxes(held: ReadonlySet<string>): TiltAxes {
  let ax = 0;
  let ay = 0;
  if (held.has("ArrowRight") || held.has("d") || held.has("D")) ax = KEY_SCALE;
  else if (held.has("ArrowLeft") || held.has("a") || held.has("A"))
    ax = -KEY_SCALE;
  if (held.has("ArrowDown") || held.has("s") || held.has("S")) ay = KEY_SCALE;
  else if (held.has("ArrowUp") || held.has("w") || held.has("W"))
    ay = -KEY_SCALE;
  return { ax, ay };
}

export function parseDpadAxes(
  up: boolean,
  down: boolean,
  left: boolean,
  right: boolean
): TiltAxes {
  return {
    ax: right ? KEY_SCALE : left ? -KEY_SCALE : 0,
    ay: down ? KEY_SCALE : up ? -KEY_SCALE : 0,
  };
}

export function clampTilt(ax: number, ay: number, max = 4.0): TiltAxes {
  return {
    ax: Math.max(-max, Math.min(max, ax)),
    ay: Math.max(-max, Math.min(max, ay)),
  };
}
