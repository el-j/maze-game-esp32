import { render, screen } from "@testing-library/react";
import Hero from "./Hero";

describe("Hero", () => {
  it("renders the h1 heading", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders a 'Play in Browser' CTA link pointing to #play", () => {
    render(<Hero />);
    const link = screen.getByRole("link", { name: /play in browser/i });
    expect(link).toHaveAttribute("href", "#play");
  });

  it("renders a canvas (the mini MatrixDisplay)", () => {
    render(<Hero />);
    expect(document.querySelector("canvas")).toBeInTheDocument();
  });
});
