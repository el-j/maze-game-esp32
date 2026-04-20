import { render, screen } from "@testing-library/react";
import { GameState } from "@/lib/wasm";
import type { GameHookResult } from "@/hooks/useGame";
import type { InputState } from "@/hooks/useInput";

jest.mock("next/dynamic", () => () => {
  const React = require("react");
  return function MockDynamic(props: Record<string, unknown>) {
    return React.createElement("div", { "data-testid": "game-section-client", ...props }, "GameSectionClient");
  };
});

jest.mock("@/hooks/useGame", () => ({
  useGame: (): GameHookResult => ({
    loadState: "loading",
    displayBuffer: null,
    gameState: GameState.TITLE,
    lives: 3,
    level: 0,
    noteHz: 0,
    motorDuty: 0,
    setConfig: jest.fn(),
    resetGame: jest.fn(),
  }),
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

import GameSection from "./GameSection";

describe("GameSection", () => {
  it("renders without crashing", () => {
    render(<GameSection id="play" />);
    expect(screen.getByTestId("game-section-client")).toBeInTheDocument();
  });
});
