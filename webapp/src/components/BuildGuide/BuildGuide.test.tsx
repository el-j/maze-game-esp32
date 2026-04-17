import { render, screen } from "@testing-library/react";
import BuildGuide from "./BuildGuide";

describe("BuildGuide", () => {
  it("renders all 12 BOM items", () => {
    render(<BuildGuide />);
    expect(screen.getByText("ESP32 DevKit V1 (38-pin)")).toBeInTheDocument();
    expect(screen.getByText("GY-521 / MPU6050 breakout")).toBeInTheDocument();
    expect(screen.getByText("8×8 LED matrix (e.g. 1088AS)")).toBeInTheDocument();
    expect(screen.getByText("DC vibration motor (3–5 V)")).toBeInTheDocument();
    expect(screen.getByText("NPN transistor (2N2222 or BC547)")).toBeInTheDocument();
    expect(screen.getByText("1N4001 flyback diode")).toBeInTheDocument();
    expect(screen.getByText("1 kΩ resistor")).toBeInTheDocument();
    expect(screen.getByText("10 kΩ resistor")).toBeInTheDocument();
    expect(screen.getByText("Passive piezo buzzer")).toBeInTheDocument();
    expect(screen.getByText("Tactile push button")).toBeInTheDocument();
    expect(screen.getByText("18650 battery shield")).toBeInTheDocument();
    expect(screen.getByText("Full-size breadboard")).toBeInTheDocument();
  });

  it("renders assembly step headings", () => {
    render(<BuildGuide />);
    expect(screen.getByText("Power rail")).toBeInTheDocument();
    expect(screen.getByText("MPU-6050")).toBeInTheDocument();
    expect(screen.getByText("LED Matrix")).toBeInTheDocument();
    expect(screen.getByText("Motor circuit")).toBeInTheDocument();
    expect(screen.getByText("Buzzer")).toBeInTheDocument();
    expect(screen.getByText("Button")).toBeInTheDocument();
  });
});
