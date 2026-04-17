// ================================================================
//  Comparison.tsx  –  C vs Rust binary-size comparison section
// ================================================================
//  Reads /comparison.json (populated by CI; falls back to the static
//  placeholder in webapp/public/).  Renders a side-by-side table plus
//  a proportional bar chart so visitors can instantly see the size
//  and complexity trade-offs of both language implementations.
// ================================================================

"use client";
import { useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────

export interface FirmwareStats {
  framework: string;
  language: string;
  toolchain: string;
  opt_level: string;
  flash_bytes: number | null;
  ram_bytes: number | null;
  bss_bytes: number | null;
  data_bytes: number | null;
  build_time_s: number | null;
}

export interface ComparisonData {
  generated_at: string;
  generated_by: string;
  c_firmware: FirmwareStats;
  rust_firmware: FirmwareStats;
  notes: string[];
}

// ── Helpers ───────────────────────────────────────────────────

function fmt(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function pct(a: number | null, b: number | null): number {
  if (a === null || b === null || b === 0) return 0;
  return Math.round((a / b) * 100);
}

// ── Sub-components ────────────────────────────────────────────

function Bar({
  value,
  max,
  color,
  label,
}: {
  value: number | null;
  max: number | null;
  color: string;
  label: string;
}) {
  const width = max && value ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className="w-12 text-right text-zinc-400">{fmt(value)}</span>
      <div className="flex-1 h-3 bg-zinc-800 rounded overflow-hidden">
        <div
          className={`h-full ${color} rounded transition-all duration-700`}
          style={{ width: `${width}%` }}
          role="progressbar"
          aria-valuenow={value ?? 0}
          aria-valuemax={max ?? 100}
          aria-label={label}
        />
      </div>
    </div>
  );
}

function StatRow({
  label,
  c,
  rust,
}: {
  label: string;
  c: number | null;
  rust: number | null;
}) {
  const max = Math.max(c ?? 0, rust ?? 0) || null;
  const ratio =
    c && rust
      ? rust < c
        ? `Rust is ${pct(c - rust, c)}% smaller`
        : rust === c
          ? "identical"
          : `C is ${pct(rust - c, rust)}% smaller`
      : null;

  return (
    <tr className="border-t border-zinc-800">
      <td className="py-3 pr-4 text-sm text-zinc-400 font-mono whitespace-nowrap">
        {label}
      </td>
      <td className="py-3 pr-6 min-w-[180px]">
        <Bar value={c} max={max} color="bg-amber-500" label={`C ${label}`} />
      </td>
      <td className="py-3 pr-6 min-w-[180px]">
        <Bar
          value={rust}
          max={max}
          color="bg-cyan-500"
          label={`Rust ${label}`}
        />
      </td>
      <td className="py-3 text-xs text-zinc-500 font-mono">{ratio}</td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────

interface Props {
  id?: string;
  /** Inject comparison data directly (used by tests / SSG) */
  data?: ComparisonData;
}

export default function Comparison({ id, data: injected }: Props) {
  const [data, setData] = useState<ComparisonData | null>(injected ?? null);
  const [error, setError] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  useEffect(() => {
    if (injected) return; // already provided
    fetch(`${base}/comparison.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ComparisonData>;
      })
      .then(setData)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Unknown error")
      );
  }, [base, injected]);

  const isLive = data !== null && data.generated_by !== "static-fallback";

  return (
    <section id={id} className="bg-zinc-950 py-20 border-t border-zinc-800">
      <div className="container mx-auto px-6">
        {/* Heading */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-amber-400 text-2xl">⚖️</span>
            <h2 className="text-3xl font-bold">C++ vs Rust: Size Comparison</h2>
          </div>
          <p className="text-zinc-400 max-w-2xl leading-relaxed">
            The same game logic implemented twice — once with Arduino/C++, once
            with Rust using{" "}
            <code className="text-amber-400 text-sm">esp-hal</code> bare-metal.
            Both target the same xtensa-esp32 chip. Numbers below are extracted
            from the Release ELF by CI on every push.
          </p>
          {!isLive && (
            <div className="mt-4 inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-xs font-mono text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              No live CI data yet — showing placeholder layout. Real numbers
              appear after the first CI run.
            </div>
          )}
          {isLive && (
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Live data · measured{" "}
              {new Date(data!.generated_at).toLocaleDateString()}
            </div>
          )}
          {error && (
            <div className="mt-4 text-xs font-mono text-red-400">
              Could not load comparison data: {error}
            </div>
          )}
        </div>

        {data && (
          <>
            {/* Metadata cards */}
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {(
                [
                  {
                    title: "C++ Firmware",
                    stats: data.c_firmware,
                    accent: "border-amber-500/30",
                    badge: "bg-amber-500/10 text-amber-400",
                  },
                  {
                    title: "Rust Firmware",
                    stats: data.rust_firmware,
                    accent: "border-cyan-500/30",
                    badge: "bg-cyan-500/10 text-cyan-400",
                  },
                ] as const
              ).map(({ title, stats, accent, badge }) => (
                <div
                  key={title}
                  className={`bg-zinc-900 border ${accent} rounded-xl p-5`}
                >
                  <h3 className={`font-bold text-sm mb-3 ${badge} rounded px-2 py-0.5 inline-block`}>
                    {title}
                  </h3>
                  <dl className="text-sm space-y-1 font-mono">
                    {(
                      [
                        ["Framework", stats.framework],
                        ["Language", stats.language],
                        ["Toolchain", stats.toolchain],
                        ["Opt level", stats.opt_level],
                      ] as [string, string][]
                    ).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="text-zinc-500 shrink-0 w-24">{k}</dt>
                        <dd className="text-zinc-300">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>

            {/* Bar chart table */}
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex gap-6 mb-4 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-500" />
                  C++ / Arduino
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-cyan-500" />
                  Rust / esp-hal
                </span>
              </div>
              <table className="w-full" aria-label="Binary size comparison">
                <thead>
                  <tr className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                    <th className="text-left pb-2 pr-4">Metric</th>
                    <th className="text-left pb-2 pr-6">C++</th>
                    <th className="text-left pb-2 pr-6">Rust</th>
                    <th className="text-left pb-2">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  <StatRow
                    label="Flash (code)"
                    c={data.c_firmware.flash_bytes}
                    rust={data.rust_firmware.flash_bytes}
                  />
                  <StatRow
                    label="RAM (total)"
                    c={data.c_firmware.ram_bytes}
                    rust={data.rust_firmware.ram_bytes}
                  />
                  <StatRow
                    label=".bss (zero-init)"
                    c={data.c_firmware.bss_bytes}
                    rust={data.rust_firmware.bss_bytes}
                  />
                  <StatRow
                    label=".data (init)"
                    c={data.c_firmware.data_bytes}
                    rust={data.rust_firmware.data_bytes}
                  />
                </tbody>
              </table>
            </div>

            {/* Notes */}
            <details className="mt-6">
              <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors font-mono">
                Measurement methodology ▸
              </summary>
              <ul className="mt-3 space-y-1">
                {data.notes.map((note, i) => (
                  <li key={i} className="text-xs text-zinc-500 font-mono pl-4 before:content-['–'] before:mr-2">
                    {note}
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}
      </div>
    </section>
  );
}
