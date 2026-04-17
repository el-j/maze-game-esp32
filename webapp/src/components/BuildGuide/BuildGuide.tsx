const BOM = [
  {
    qty: 1,
    part: "ESP32 DevKit V1 (38-pin)",
    notes: "Any DevKit V1 clone",
  },
  {
    qty: 1,
    part: "GY-521 / MPU6050 breakout",
    notes: "3.3 V only – 5 V destroys it",
  },
  {
    qty: 1,
    part: "8×8 LED matrix (e.g. 1088AS)",
    notes: "Raw matrix – no MAX7219",
  },
  {
    qty: 1,
    part: "DC vibration motor (3–5 V)",
    notes: "Coin cell or pager motor",
  },
  {
    qty: 1,
    part: "NPN transistor (2N2222 or BC547)",
    notes: "Motor driver",
  },
  {
    qty: 1,
    part: "1N4001 flyback diode",
    notes: "Motor back-EMF protection",
  },
  { qty: 1, part: "1 kΩ resistor", notes: "Transistor base" },
  { qty: 1, part: "10 kΩ resistor", notes: "Button pull-down" },
  {
    qty: 1,
    part: "Passive piezo buzzer",
    notes: "Passive = no built-in oscillator",
  },
  {
    qty: 1,
    part: "Tactile push button",
    notes: "Momentary normally-open",
  },
  { qty: 1, part: "18650 battery shield", notes: "5 V USB output" },
  { qty: 1, part: "Full-size breadboard", notes: "Half-size is tight" },
];

const STEPS = [
  {
    n: 1,
    title: "Power rail",
    body: "Place the ESP32 across the centre divide. Connect the 3.3 V and GND rails from the ESP32 to the breadboard power rails.",
  },
  {
    n: 2,
    title: "MPU-6050",
    body: "Wire VCC → 3.3 V, GND → GND, SDA → GPIO 21, SCL → GPIO 22. Keep leads short to reduce I²C noise.",
  },
  {
    n: 3,
    title: "LED Matrix",
    body: "Connect row pins (anodes) to GPIOs 13,16,17,5,18,19,23,25 and column pins (cathodes) to GPIOs 26,32,33,27,14,12,15,0. No current-limiting resistors needed — the ESP32 GPIO source current is low enough.",
  },
  {
    n: 4,
    title: "Motor circuit",
    body: "Base of NPN → 1 kΩ → GPIO 4. Collector → motor(−). Motor(+) → 5 V. Emitter → GND. Place 1N4001 across motor terminals (cathode to +).",
  },
  {
    n: 5,
    title: "Buzzer",
    body: "Connect passive piezo buzzer between GPIO 2 and GND. Passive buzzers require a PWM signal — do not use an active (oscillating) buzzer.",
  },
  {
    n: 6,
    title: "Button",
    body: "One terminal → GPIO 34. Other terminal → 3.3 V. Add 10 kΩ pull-down from GPIO 34 to GND.",
  },
];

export default function BuildGuide({ id }: { id?: string }): JSX.Element {
  return (
    <section id={id} className="bg-zinc-950 py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-zinc-100 mb-2">Build Guide</h2>
        <p className="text-zinc-400 mb-12 text-lg max-w-2xl">
          Everything you need to build your own hardware console.
        </p>

        {/* BOM */}
        <h3 className="text-amber-400 font-bold text-xl mb-4">
          Bill of Materials
        </h3>
        <div className="overflow-x-auto mb-12">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="py-2 pr-4 text-zinc-400 font-mono w-12">QTY</th>
                <th className="py-2 pr-4 text-zinc-400 font-mono">Part</th>
                <th className="py-2 text-zinc-400 font-mono">Notes</th>
              </tr>
            </thead>
            <tbody>
              {BOM.map(({ qty, part, notes }) => (
                <tr
                  key={part}
                  className="border-b border-zinc-800 hover:bg-zinc-900 transition-colors"
                >
                  <td className="py-2 pr-4 text-zinc-300 font-mono">{qty}</td>
                  <td className="py-2 pr-4 text-zinc-100">{part}</td>
                  <td className="py-2 text-zinc-400 text-xs">{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Steps */}
        <h3 className="text-amber-400 font-bold text-xl mb-6">
          Assembly Steps
        </h3>
        <ol className="space-y-6">
          {STEPS.map(({ n, title, body }) => (
            <li key={n} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 text-zinc-950 font-bold text-sm flex items-center justify-center">
                {n}
              </div>
              <div>
                <h4 className="text-zinc-100 font-semibold mb-1">{title}</h4>
                <p className="text-zinc-400 text-sm leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
