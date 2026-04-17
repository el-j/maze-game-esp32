import { render, screen } from "@testing-library/react";
import WiringReference from "./WiringReference";

describe("WiringReference", () => {
  it("renders 'Row Pins' heading", () => {
    render(<WiringReference />);
    expect(screen.getByText("Row Pins")).toBeInTheDocument();
  });

  it("renders 'Column Pins' heading", () => {
    render(<WiringReference />);
    expect(screen.getByText("Column Pins")).toBeInTheDocument();
  });

  it("all 8 row GPIO numbers are present", () => {
    render(<WiringReference />);
    for (const pin of [13, 16, 17, 5, 18, 19, 23, 25]) {
      const cells = screen.getAllByText(String(pin));
      expect(cells.length).toBeGreaterThan(0);
    }
  });

  it("all 8 column GPIO numbers are present", () => {
    render(<WiringReference />);
    for (const pin of [26, 32, 33, 27, 14, 12, 15, 0]) {
      const cells = screen.getAllByText(String(pin));
      expect(cells.length).toBeGreaterThan(0);
    }
  });
});
