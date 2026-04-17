import { render, screen } from "@testing-library/react";
import Nav from "./Nav";

describe("Nav", () => {
  it("renders link to #play", () => {
    render(<Nav />);
    expect(screen.getByText("Play").closest("a")).toHaveAttribute("href", "#play");
  });

  it("renders link to #how-it-works", () => {
    render(<Nav />);
    expect(screen.getByText("How It Works").closest("a")).toHaveAttribute(
      "href",
      "#how-it-works"
    );
  });

  it("renders link to #build", () => {
    render(<Nav />);
    expect(screen.getByText("Build").closest("a")).toHaveAttribute("href", "#build");
  });

  it("renders link to #wiring", () => {
    render(<Nav />);
    expect(screen.getByText("Wiring").closest("a")).toHaveAttribute("href", "#wiring");
  });

  it("GitHub link opens in _blank", () => {
    render(<Nav />);
    const githubLink = screen.getByLabelText("GitHub repository");
    expect(githubLink).toHaveAttribute("target", "_blank");
  });
});
