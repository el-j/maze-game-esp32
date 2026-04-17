import type { JSX } from "react";
const ROW_PINS = [13, 16, 17, 5, 18, 19, 23, 25];
const COL_PINS = [26, 32, 33, 27, 14, 12, 15, 0];

const TRANSISTOR_DIAGRAM = `
3.3 V ──────────────────── Motor (+)
                              │
                           Motor (−)
                              │
                           Collector
                           NPN (2N2222)
                           Emitter
                              │
                             GND

GPIO 4 ──── 1kΩ ──── Base

          ┌─ 1N4001 ─┐
Motor(+) ─┤           ├─ Motor(−)
          └───────────┘  (cathode → +)
`.trim();

export default function WiringReference({ id }: { id?: string }): JSX.Element {
  return (
    <section id={id} className="bg-zinc-900 py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-zinc-100 mb-2">
          Wiring Reference
        </h2>
        <p className="text-zinc-400 mb-10 text-lg">
          GPIO assignments for the LED matrix and motor circuit.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Row Pins */}
          <div>
            <h3 className="text-amber-400 font-bold text-lg mb-4">Row Pins</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="py-2 pr-4 text-zinc-400 font-mono text-left">
                    Row
                  </th>
                  <th className="py-2 text-zinc-400 font-mono text-left">
                    GPIO
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROW_PINS.map((pin, i) => (
                  <tr
                    key={pin}
                    className="border-b border-zinc-800 hover:bg-zinc-800"
                  >
                    <td className="py-2 pr-4 text-zinc-300 font-mono">R{i}</td>
                    <td className="py-2 text-zinc-100 font-mono">{pin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Col Pins */}
          <div>
            <h3 className="text-amber-400 font-bold text-lg mb-4">
              Column Pins
            </h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="py-2 pr-4 text-zinc-400 font-mono text-left">
                    Col
                  </th>
                  <th className="py-2 text-zinc-400 font-mono text-left">
                    GPIO
                  </th>
                </tr>
              </thead>
              <tbody>
                {COL_PINS.map((pin, i) => (
                  <tr
                    key={`col-${pin}`}
                    className="border-b border-zinc-800 hover:bg-zinc-800"
                  >
                    <td className="py-2 pr-4 text-zinc-300 font-mono">C{i}</td>
                    <td className="py-2 text-zinc-100 font-mono">{pin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Motor wiring diagram */}
        <div>
          <h3 className="text-amber-400 font-bold text-lg mb-4">
            Motor Driver Circuit
          </h3>
          <pre className="text-xs text-zinc-400 font-mono bg-zinc-950 rounded-xl p-6 overflow-x-auto whitespace-pre border border-zinc-800">
            {TRANSISTOR_DIAGRAM}
          </pre>
        </div>
      </div>
    </section>
  );
}
