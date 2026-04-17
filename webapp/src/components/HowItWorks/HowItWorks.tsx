import type { JSX } from "react";
const cards = [
  {
    title: "Row Multiplexing",
    body: `The 8×8 matrix has 16 pins (8 rows, 8 columns). The ESP32 drives one row at a time at ~1 kHz via a hardware-timer ISR, giving the eye the illusion that all 64 LEDs are on simultaneously — a technique called persistence-of-vision multiplexing.`,
    diagram: `ROW  ─── R0 R1 R2 R3 R4 R5 R6 R7
SCAN     ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓
COL  ─── C0 C1 C2 C3 C4 C5 C6 C7`,
  },
  {
    title: "Ball Physics",
    body: `Each game tick the MPU-6050 accelerometer feeds raw g-values into a simple velocity model:
  velocity += acceleration × SENSITIVITY
  velocity *= FRICTION
  if |velocity| < DEADZONE: velocity = 0
This gives realistic momentum while DEADZONE prevents drift on a flat surface.`,
    diagram: `ax, ay (g)
  │
  ▼
vx += ax * SENSITIVITY
vy += ay * SENSITIVITY
  │
vx *= FRICTION ──► |vx| < DEADZONE? → 0
vy *= FRICTION ──► |vy| < DEADZONE? → 0`,
  },
  {
    title: "Split-Axis Collision",
    body: `When the ball hits a wall the engine tries X and Y movement independently. If only one axis causes a collision, the other slides freely — known as "wall-slide". This prevents the frustrating "sticky corner" bug common in tile-based games.`,
    diagram: `Ball ──► wall
  │
  ├─ tryMove(dx, 0)  OK?  → apply X
  └─ tryMove(0, dy)  OK?  → apply Y
  (both blocked = full stop)`,
  },
];

export default function HowItWorks({ id }: { id?: string }): JSX.Element {
  return (
    <section id={id} className="bg-zinc-900 py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-zinc-100 mb-2">
          How It Works
        </h2>
        <p className="text-zinc-400 mb-12 text-lg max-w-2xl">
          Three clever techniques make a smooth game from 64 LEDs and a
          micro-controller.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map(({ title, body, diagram }) => (
            <div
              key={title}
              className="bg-zinc-800 rounded-xl p-6 border border-zinc-700"
            >
              <h3 className="text-amber-400 font-bold text-lg mb-3">{title}</h3>
              <p className="text-zinc-300 text-sm leading-relaxed mb-4">{body}</p>
              <pre className="text-xs text-zinc-500 font-mono bg-zinc-950 rounded p-3 overflow-x-auto whitespace-pre">
                {diagram}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
