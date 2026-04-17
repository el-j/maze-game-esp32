import { render } from "@testing-library/react";
import MatrixDisplay from "./MatrixDisplay";

describe("MatrixDisplay", () => {
  it("renders a <canvas> element", () => {
    const { container } = render(<MatrixDisplay buffer={null} />);
    expect(container.querySelector("canvas")).toBeInTheDocument();
  });

  it("with buffer=null, still renders a canvas (loading state)", () => {
    const { container } = render(<MatrixDisplay buffer={null} />);
    expect(container.querySelector("canvas")).toBeInTheDocument();
  });

  it("with buffer of 8 zeros, calls getContext('2d')", () => {
    const buf = new Uint8Array(8);
    render(<MatrixDisplay buffer={buf} />);
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith("2d");
  });

  it("accepts custom size prop and sets canvas width/height", () => {
    const { container } = render(<MatrixDisplay buffer={null} size={200} />);
    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(200);
  });
});
