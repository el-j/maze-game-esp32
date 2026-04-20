"use client";
import type { JSX } from "react";
import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { href: "#play", label: "Play" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#build", label: "Build" },
  { href: "#wiring", label: "Wiring" },
  { href: "#comparison", label: "C vs Rust" },
];

export default function Nav(): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
      <div className="container mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono font-bold text-amber-400 text-sm tracking-tight"
        >
          maze-game-esp32
        </Link>
        <div className="flex items-center gap-4">
          {/*
           * Single nav list – always in the DOM so tests find the links.
           * Desktop (sm+): inline flex row, always visible.
           * Mobile: absolute dropdown below the bar, visible only when menuOpen.
           */}
          <ul
            id="nav-links"
            className={[
              // Desktop: inline, always visible
              "sm:static sm:flex sm:flex-row sm:items-center sm:gap-6",
              "sm:bg-transparent sm:border-0 sm:py-0 sm:px-0 sm:w-auto sm:shadow-none",
              // Mobile: absolute dropdown below the 56 px bar
              "absolute sm:relative top-14 sm:top-auto left-0 sm:left-auto right-0 sm:right-auto",
              "flex flex-col gap-1 bg-zinc-950 border-b border-zinc-800 px-6 py-3 w-full",
              menuOpen ? "flex" : "hidden sm:flex",
            ].join(" ")}
          >
            {LINKS.map(({ href, label }) => (
              <li key={href}>
                <a
                  href={href}
                  className="block py-1.5 sm:py-0 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          {/* GitHub link */}
          <a
            href="https://github.com/el-j/maze-game-esp32"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>

          {/* Hamburger – mobile only */}
          <button
            className="sm:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="nav-links"
          >
            <span
              className={`block w-5 h-0.5 bg-zinc-400 transition-transform duration-200 ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
            />
            <span
              className={`block w-5 h-0.5 bg-zinc-400 transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block w-5 h-0.5 bg-zinc-400 transition-transform duration-200 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>
    </nav>
  );
}
