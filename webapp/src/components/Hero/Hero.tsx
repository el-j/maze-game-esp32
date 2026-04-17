import type { JSX } from "react";
import MatrixDisplay from "@/components/MatrixDisplay/MatrixDisplay";

const FRAME_TITLE = new Uint8Array([
  0x00, 0x00, 0x24, 0x00, 0x00, 0x42, 0x3c, 0x00,
]);

export default function Hero(): JSX.Element {
  return (
    <section className="bg-zinc-950 py-24">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="flex flex-wrap gap-2">
              {["ESP32", "WebAssembly", "8×8 LED", "Tilt Control"].map(
                (badge) => (
                  <span
                    key={badge}
                    className="text-xs font-mono border border-amber-500/40 text-amber-400/80 rounded-full px-3 py-0.5"
                  >
                    {badge}
                  </span>
                )
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-100 leading-tight">
              Haptic Tilt-Maze<br />
              <span className="text-amber-400">Console</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-lg leading-relaxed">
              An ESP32-powered ball-maze game on an 8×8 LED matrix. Tilt to
              steer, feel the rumble, hear the buzzer. Now playable in your
              browser via WebAssembly — same C++ physics, zero changes.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#play"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-3 rounded-lg transition-colors"
              >
                ▶ Play in Browser
              </a>
              <a
                href="#build"
                className="inline-flex items-center gap-2 border border-zinc-600 hover:border-zinc-400 text-zinc-300 hover:text-zinc-100 px-6 py-3 rounded-lg transition-colors"
              >
                Build Your Own
              </a>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-[0_0_60px_rgba(255,136,0,0.15)]">
              <MatrixDisplay buffer={FRAME_TITLE} size={160} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
