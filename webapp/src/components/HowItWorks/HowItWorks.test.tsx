import { render, screen } from "@testing-library/react";
import HowItWorks from "./HowItWorks";

describe("HowItWorks", () => {
  it("renders 'Row Multiplexing' heading", () => {
    render(<HowItWorks />);
    expect(screen.getByText("Row Multiplexing")).toBeInTheDocument();
  });

  it("renders 'Ball Physics' heading", () => {
    render(<HowItWorks />);
    expect(screen.getByText("Ball Physics")).toBeInTheDocument();
  });

  it("renders 'Split-Axis Collision' heading", () => {
    render(<HowItWorks />);
    expect(screen.getByText("Split-Axis Collision")).toBeInTheDocument();
  });
});
