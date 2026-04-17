import { render, screen, waitFor } from "@testing-library/react";
import Comparison, { type ComparisonData } from "./Comparison";

// ── Test data ─────────────────────────────────────────────────

const STATIC_DATA: ComparisonData = {
  generated_at: "2026-04-17T00:00:00Z",
  generated_by: "static-fallback",
  c_firmware: {
    framework: "Arduino / PlatformIO",
    language: "C++17",
    toolchain: "xtensa-esp32-elf-gcc",
    opt_level: "-Os",
    flash_bytes: null,
    ram_bytes: null,
    bss_bytes: null,
    data_bytes: null,
    build_time_s: null,
  },
  rust_firmware: {
    framework: "esp-hal (bare-metal)",
    language: "Rust 2021 edition",
    toolchain: "esp (espressif fork)",
    opt_level: "s + LTO + strip",
    flash_bytes: null,
    ram_bytes: null,
    bss_bytes: null,
    data_bytes: null,
    build_time_s: null,
  },
  notes: ["flash_bytes = .text + .rodata sections"],
};

const LIVE_DATA: ComparisonData = {
  ...STATIC_DATA,
  generated_by: "ci",
  c_firmware: {
    ...STATIC_DATA.c_firmware,
    flash_bytes: 280_000,
    ram_bytes: 32_000,
    bss_bytes: 12_000,
    data_bytes: 4_000,
  },
  rust_firmware: {
    ...STATIC_DATA.rust_firmware,
    flash_bytes: 190_000,
    ram_bytes: 28_000,
    bss_bytes: 10_000,
    data_bytes: 2_000,
  },
};

// ── Tests ─────────────────────────────────────────────────────

describe("Comparison", () => {
  it("renders section heading", () => {
    render(<Comparison data={STATIC_DATA} />);
    expect(screen.getByText(/C\+\+ vs Rust/i)).toBeInTheDocument();
  });

  it("shows placeholder banner when generated_by is static-fallback", () => {
    render(<Comparison data={STATIC_DATA} />);
    expect(screen.getByText(/No live CI data yet/i)).toBeInTheDocument();
  });

  it("shows live badge when generated_by is not static-fallback", () => {
    render(<Comparison data={LIVE_DATA} />);
    expect(screen.getByText(/Live data/i)).toBeInTheDocument();
  });

  it("renders both firmware metadata cards", () => {
    render(<Comparison data={STATIC_DATA} />);
    expect(screen.getByText("C++ Firmware")).toBeInTheDocument();
    expect(screen.getByText("Rust Firmware")).toBeInTheDocument();
  });

  it("renders framework names in metadata cards", () => {
    render(<Comparison data={STATIC_DATA} />);
    expect(screen.getByText("Arduino / PlatformIO")).toBeInTheDocument();
    expect(screen.getByText("esp-hal (bare-metal)")).toBeInTheDocument();
  });

  it("renders all four metric rows", () => {
    render(<Comparison data={STATIC_DATA} />);
    expect(screen.getByText("Flash (code)")).toBeInTheDocument();
    expect(screen.getByText("RAM (total)")).toBeInTheDocument();
    expect(screen.getByText(".bss (zero-init)")).toBeInTheDocument();
    expect(screen.getByText(".data (init)")).toBeInTheDocument();
  });

  it("shows — for null metrics", () => {
    render(<Comparison data={STATIC_DATA} />);
    // All metrics are null in static data — each row has two "—"
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });

  it("formats bytes as KB when >= 1024", () => {
    render(<Comparison data={LIVE_DATA} />);
    // 280000 bytes ≈ 273.4 KB
    expect(screen.getByText("273.4 KB")).toBeInTheDocument();
  });

  it("renders progress bars for live data", () => {
    render(<Comparison data={LIVE_DATA} />);
    const bars = screen.getAllByRole("progressbar");
    // 4 metrics × 2 bars each = 8 progressbars
    expect(bars.length).toBe(8);
  });

  it("shows delta text for live data", () => {
    render(<Comparison data={LIVE_DATA} />);
    // Rust flash (190K) < C flash (280K) → Rust is smaller (multiple rows match)
    const deltas = screen.getAllByText(/Rust is .* smaller/i);
    expect(deltas.length).toBeGreaterThanOrEqual(1);
  });

  it("renders methodology notes in details element", () => {
    render(<Comparison data={LIVE_DATA} />);
    expect(
      screen.getByText("Measurement methodology ▸")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/\.text \+ \.rodata sections/i)
    ).toBeInTheDocument();
  });

  it("fetches comparison.json when no data prop is provided", async () => {
    const mockData = LIVE_DATA;
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as unknown as Response);

    render(<Comparison />);
    // Before fetch resolves, nothing renders
    await waitFor(() => {
      expect(screen.getByText("C++ Firmware")).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("comparison.json")
    );
  });

  it("shows error message when fetch fails", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));
    render(<Comparison />);
    await waitFor(() => {
      expect(screen.getByText(/Could not load/i)).toBeInTheDocument();
    });
  });

  it("shows error message when fetch returns non-ok status", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as unknown as Response);
    render(<Comparison />);
    await waitFor(() => {
      expect(screen.getByText(/HTTP 404/i)).toBeInTheDocument();
    });
  });
});
