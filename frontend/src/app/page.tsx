"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col items-center relative">
      <nav className="w-full max-w-5xl mx-auto p-6 flex justify-between items-center border-b border-[var(--card-border)] mb-16">
        <div className="text-xl font-bold tracking-tight text-[var(--primary)] flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[var(--primary)] text-white flex items-center justify-center text-xs">A</div>
          Aegis Protocol
        </div>
        <button
          onClick={toggleTheme}
          className="btn-secondary"
        >
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
      </nav>

      <main className="w-full max-w-5xl px-6 flex flex-col items-start text-left">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[var(--text-primary)] leading-tight max-w-2xl">
          The Autonomous, Censorship-Resistant Attention Proxy.
        </h1>
        <p className="text-base text-[var(--text-secondary)] mb-12 max-w-2xl leading-relaxed">
          Bypass algorithmic manipulation. Aegis is your personal AI agent that pulls directly from decentralized storage, streams zero-knowledge verified micropayments, and curates reality on your terms.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
          <Link href="/user" className="flex-1">
            <div className="clean-card p-6 flex flex-col h-full cursor-pointer">
              <div className="text-2xl mb-3">🛡️</div>
              <h3 className="text-lg font-bold mb-1">User Portal</h3>
              <p className="text-sm text-[var(--text-secondary)]">Fund your proxy and reclaim your attention.</p>
            </div>
          </Link>

          <Link href="/publisher" className="flex-1">
            <div className="clean-card p-6 flex flex-col h-full cursor-pointer">
              <div className="text-2xl mb-3">📰</div>
              <h3 className="text-lg font-bold mb-1">Publisher Portal</h3>
              <p className="text-sm text-[var(--text-secondary)]">Stake credibility and earn directly.</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
