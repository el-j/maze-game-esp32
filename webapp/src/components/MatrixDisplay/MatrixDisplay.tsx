"use client";
import { useEffect, useRef } from "react";

interface Props {
  buffer: Uint8Array | null;
  size?: number;
  glowIntensity?: number;
  className?: string;
}

function drawMatrix(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  buffer: Uint8Array | null,
  glow: number
) {
  ctx.fillStyle = "#0a0604";
  ctx.fillRect(0, 0, w, h);

  const pad = w * 0.05;
  const cellW = (w - pad * 2) / 8;
  const cellH = (h - pad * 2) / 8;
  const r = Math.min(cellW, cellH) * 0.36;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const lit = buffer ? (buffer[row] >> (7 - col)) & 1 : 0;
      const cx = pad + (col + 0.5) * cellW;
      const cy = pad + (row + 0.5) * cellH;

      if (lit) {
        const glowR = r * 2.8 * glow;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
        g.addColorStop(0, "rgba(255,220,0,0.9)");
        g.addColorStop(0.35, "rgba(255,140,0,0.55)");
        g.addColorStop(0.7, "rgba(255,80,0,0.15)");
        g.addColorStop(1, "rgba(255,80,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffe560";
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.beginPath();
        ctx.arc(cx - r * 0.22, cy - r * 0.22, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const dg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        dg.addColorStop(0, "#291500");
        dg.addColorStop(1, "#100800");
        ctx.fillStyle = dg;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.68, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export default function MatrixDisplay({
  buffer,
  size = 320,
  glowIntensity = 1.0,
  className,
}: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawMatrix(ctx, size, size, buffer, glowIntensity);
  }, [buffer, size, glowIntensity]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      aria-label="LED matrix display"
      role="img"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
