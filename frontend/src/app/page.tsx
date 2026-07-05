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

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl mb-20">
          <Link href="/user" className="flex-1">
            <div className="clean-card p-6 flex flex-col h-full cursor-pointer hover:border-[var(--primary)] transition-colors">
              <div className="text-2xl mb-3">🛡️</div>
              <h3 className="text-lg font-bold mb-1">User Portal</h3>
              <p className="text-sm text-[var(--text-secondary)]">Fund your proxy and reclaim your attention.</p>
            </div>
          </Link>

          <Link href="/publisher" className="flex-1">
            <div className="clean-card p-6 flex flex-col h-full cursor-pointer hover:border-[var(--primary)] transition-colors">
              <div className="text-2xl mb-3">📰</div>
              <h3 className="text-lg font-bold mb-1">Publisher Portal</h3>
              <p className="text-sm text-[var(--text-secondary)]">Stake credibility and earn directly.</p>
            </div>
          </Link>
        </div>

        {/* Public Leaderboard */}
        <div className="w-full mt-8 animate-fadeIn pb-20">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold">Top Trusted Publishers</h2>
            <span className="text-xs font-bold px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full uppercase tracking-wider">Live Metrics</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="clean-card p-5 border-t-4 border-t-green-500">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">CipherBlog</h3>
                  <a href="#" className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] font-mono">cipherblog.net</a>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-full flex items-center gap-1">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  Verified
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-1">Trust Score</p>
                  <p className="text-2xl font-bold text-green-500">99</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-1">Total Earned</p>
                  <p className="text-xl font-bold">1,240 <span className="text-sm font-normal text-[var(--text-secondary)]">USDC</span></p>
                </div>
              </div>
            </div>

            <div className="clean-card p-5 border-t-4 border-t-blue-500">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">OnChain Observer</h3>
                  <a href="#" className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] font-mono">onchainobserver.io</a>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-full flex items-center gap-1">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  Verified
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-1">Trust Score</p>
                  <p className="text-2xl font-bold text-blue-500">95</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-1">Total Earned</p>
                  <p className="text-xl font-bold">850 <span className="text-sm font-normal text-[var(--text-secondary)]">USDC</span></p>
                </div>
              </div>
            </div>

            <div className="clean-card p-5 border-t-4 border-t-purple-500">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">ZeroKnowledge News</h3>
                  <a href="#" className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] font-mono">zkn.dev</a>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-full flex items-center gap-1">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  Verified
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-1">Trust Score</p>
                  <p className="text-2xl font-bold text-purple-500">92</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-1">Total Earned</p>
                  <p className="text-xl font-bold">620 <span className="text-sm font-normal text-[var(--text-secondary)]">USDC</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
