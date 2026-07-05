"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-30"
        style={{ background: "var(--primary)" }}
      ></div>
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-30"
        style={{ background: "var(--accent)" }}
      ></div>

      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
        <div className="text-2xl font-bold tracking-tighter" style={{ color: "var(--accent)" }}>
          Aegis<span style={{ color: "var(--text-color)" }}>.</span>
        </div>
        <button
          onClick={toggleTheme}
          className="btn-secondary"
          style={{ padding: "8px 16px", borderRadius: "20px" }}
        >
          {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
      </nav>

      <main className="z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6" style={{ lineHeight: 1.1 }}>
          The Autonomous, <br />
          <span style={{ color: "transparent", WebkitTextFillColor: "transparent", WebkitBackgroundClip: "text", backgroundImage: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
            Censorship-Resistant
          </span>{" "}
          <br />
          Attention Proxy.
        </h1>
        <p className="text-lg md:text-xl opacity-80 mb-12 max-w-2xl" style={{ lineHeight: 1.6 }}>
          Bypass algorithmic manipulation. Aegis is your personal AI agent that pulls directly from decentralized storage, streams zero-knowledge verified micropayments, and curates reality on your terms.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
          <Link href="/user">
            <div className="glass-card p-8 flex flex-col items-center justify-center cursor-pointer transition-transform hover:-translate-y-2 w-full sm:w-64 h-48">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold mb-2">I am a User</h3>
              <p className="text-sm opacity-70 text-center">Fund your proxy and reclaim your attention.</p>
            </div>
          </Link>

          <Link href="/publisher">
            <div className="glass-card p-8 flex flex-col items-center justify-center cursor-pointer transition-transform hover:-translate-y-2 w-full sm:w-64 h-48">
              <div className="text-4xl mb-4">📰</div>
              <h3 className="text-xl font-bold mb-2">I am a Publisher</h3>
              <p className="text-sm opacity-70 text-center">Stake credibility and earn directly.</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
