import { render, screen, fireEvent } from "@testing-library/react";
import { GameState } from "@/lib/wasm";
import type { GameHookResult } from "@/hooks/useGame";
import type { InputState } from "@/hooks/useInput";

// ── Shared mock state ────────────────────────────────────────────────────────

const startGameMock = jest.fn();
const resetGameMock = jest.fn();

let mockGameResult: GameHookResult = {
  loadState: "ready",
  displayBuffer: null,
  gameState: GameState.TITLE,
  lives: 3,
  level: 0,
  noteHz: 0,
  motorDuty: 0,
  setConfig: jest.fn(),
  resetGame: resetGameMock,
  startGame: startGameMock,
};

jest.mock("@/hooks/useGame", () => ({
  GameState: { TITLE: 0, PLAYING: 1, CRASHED: 2, GAMEOVER: 3, VICTORY: 4, LEVELUP: 5 },
  useGame: (): GameHookResult => mockGameResult,
}));

jest.mock("@/hooks/useInput", () => ({
  useInput: (): InputState & { setDpad: jest.Mock; setBtn: jest.Mock } => ({
    ax: 0,
    ay: 0,
    btn: false,
    dpad: { up: false, down: false, left: false, right: false },
    setDpad: jest.fn(),
    setBtn: jest.fn(),
  }),
}));

jest.mock("@/hooks/useAudio", () => ({
  useAudio: () => ({ enabled: true, toggle: jest.fn() }),
}));

// Silence canvas "not implemented" errors from jsdom
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => null);
  // jsdom does not define DeviceOrientationEvent
  if (typeof (global as Record<string, unknown>).DeviceOrientationEvent === "undefined") {
    (global as Record<string, unknown>).DeviceOrientationEvent = class {};
  }
  // jsdom does not define screen.orientation
  if (!window.screen.orientation) {
    Object.defineProperty(window.screen, "orientation", {
      writable: true,
      value: { lock: jest.fn().mockResolvedValue(undefined), unlock: jest.fn() },
    });
  }
});

import GameSectionClient from "./GameSectionClient";

describe("GameSectionClient – PlayPrompt", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows SPACE/START hint when gameState is TITLE", () => {
    mockGameResult = { ...mockGameResult, gameState: GameState.TITLE, loadState: "ready" };
    render(<GameSectionClient />);
    // The hint paragraph contains both SPACE and START
    const hints = screen.getAllByText(/SPACE/i);
    expect(hints.length).toBeGreaterThan(0);
    const startHints = screen.getAllByText(/START/i);
    expect(startHints.length).toBeGreaterThan(0);
    // No "Play Again" button shown in TITLE state
    expect(screen.queryByRole("button", { name: /play again/i })).toBeNull();
  });

  it("shows 'Play Again' button when gameState is GAMEOVER", () => {
    mockGameResult = { ...mockGameResult, gameState: GameState.GAMEOVER, loadState: "ready" };
    render(<GameSectionClient />);
    const btns = screen.getAllByRole("button", { name: /play again/i });
    expect(btns.length).toBeGreaterThan(0);
  });

  it("clicking 'Play Again' on GAMEOVER calls startGame", () => {
    mockGameResult = { ...mockGameResult, gameState: GameState.GAMEOVER, loadState: "ready" };
    render(<GameSectionClient />);
    const btn = screen.getAllByRole("button", { name: /play again/i })[0];
    fireEvent.click(btn);
    expect(startGameMock).toHaveBeenCalled();
  });

  it("shows '🏆 Play Again' button when gameState is VICTORY", () => {
    mockGameResult = { ...mockGameResult, gameState: GameState.VICTORY, loadState: "ready" };
    render(<GameSectionClient />);
    expect(screen.getAllByText(/Play Again/i).length).toBeGreaterThan(0);
  });

  it("hides prompt when gameState is PLAYING", () => {
    mockGameResult = { ...mockGameResult, gameState: GameState.PLAYING, loadState: "ready" };
    render(<GameSectionClient />);
    expect(screen.queryByRole("button", { name: /play again/i })).toBeNull();
    expect(screen.queryByText(/press.*space.*start/i)).toBeNull();
  });

  it("hides prompt when loadState is loading", () => {
    mockGameResult = { ...mockGameResult, gameState: GameState.GAMEOVER, loadState: "loading" };
    render(<GameSectionClient />);
    expect(screen.queryByRole("button", { name: /play again/i })).toBeNull();
  });
});
