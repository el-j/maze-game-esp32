import "@testing-library/jest-dom";

// ── Canvas mock ──────────────────────────────────────────────
// jsdom doesn't implement CanvasRenderingContext2D.  Provide a
// minimal stub so components that call getContext('2d') don't throw.
const mockCtx = {
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  drawImage: jest.fn(),
  strokeRect: jest.fn(),
  stroke: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  setTransform: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 0,
  font: "",
  textAlign: "left" as CanvasTextAlign,
  shadowBlur: 0,
  shadowColor: "",
  globalAlpha: 1,
};

HTMLCanvasElement.prototype.getContext = jest.fn(
  () => mockCtx as unknown as CanvasRenderingContext2D
);

// ── window.matchMedia mock ───────────────────────────────────
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ── ResizeObserver mock ──────────────────────────────────────
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// ── requestAnimationFrame / cancelAnimationFrame mock ────────
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(() => cb(performance.now()), 0);
  return 0;
});
global.cancelAnimationFrame = jest.fn();

// ── navigator.vibrate mock ───────────────────────────────────
Object.defineProperty(navigator, "vibrate", {
  writable: true,
  value: jest.fn(),
});
