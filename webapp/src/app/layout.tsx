import type { JSX } from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haptic Tilt-Maze Console – ESP32 DIY Game",
  description:
    "An ESP32-powered ball-maze game on an 8×8 LED matrix. Tilt to steer, feel the rumble, hear the buzzer. Play in browser via WebAssembly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}
