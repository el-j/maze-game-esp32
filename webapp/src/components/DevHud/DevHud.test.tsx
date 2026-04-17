import { render, screen, fireEvent } from "@testing-library/react";
import DevHud from "./DevHud";
import { DEFAULT_CONFIG } from "@/lib/config";
import { GameState } from "@/lib/wasm";

const defaultProps = {
  config: { ...DEFAULT_CONFIG },
  onConfigChange: jest.fn(),
  gameState: GameState.TITLE,
  lives: 3,
  level: 0,
  noteHz: 0,
  motorDuty: 0,
  onReset: jest.fn(),
};

global.URL.createObjectURL = jest.fn(() => "blob:mock");
global.URL.revokeObjectURL = jest.fn();

describe("DevHud", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders sensitivity slider with correct min/max", () => {
    render(<DevHud {...defaultProps} />);
    const slider = screen.getByTestId("slider-sensitivity") as HTMLInputElement;
    expect(slider.min).toBe("0.01");
    expect(slider.max).toBe("0.15");
  });

  it("changing sensitivity slider calls onConfigChange with updated value", () => {
    render(<DevHud {...defaultProps} />);
    const slider = screen.getByTestId("slider-sensitivity");
    fireEvent.change(slider, { target: { value: "0.08" } });
    expect(defaultProps.onConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({ sensitivity: 0.08 })
    );
  });

  it("'Export config.h' button triggers a download", () => {
    const clickSpy = jest.fn();
    const origCreate = document.createElement.bind(document);
    jest
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        if (tag === "a") {
          const el = origCreate("a");
          el.click = clickSpy;
          return el;
        }
        return origCreate(tag);
      });

    render(<DevHud {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Export config.h"));
    expect(clickSpy).toHaveBeenCalled();

    jest.restoreAllMocks();
  });

  it("'Reset Game' button calls onReset", () => {
    render(<DevHud {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Reset Game"));
    expect(defaultProps.onReset).toHaveBeenCalled();
  });

  it("displays correct state, lives, and level", () => {
    render(
      <DevHud
        {...defaultProps}
        gameState={GameState.PLAYING}
        lives={2}
        level={1}
      />
    );
    expect(screen.getByText("PLAYING")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });
});
