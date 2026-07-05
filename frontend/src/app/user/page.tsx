"use client";

import { useState } from "react";
import Link from "next/link";
import { isAllowed, setAllowed, requestAccess } from "@stellar/freighter-api";
import { useTheme } from "@/components/ThemeProvider";

export default function UserDashboard() {
  const { theme, toggleTheme } = useTheme();
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [limit, setLimit] = useState("10");

  const connectWallet = async () => {
    try {
      let allowed = await isAllowed();
      if (!allowed) {
        await setAllowed();
        allowed = await isAllowed();
      }
      if (allowed) {
        const { address, error } = await requestAccess();
        if (address) setPublicKey(address);
        else if (error) console.error(error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect Freighter wallet");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      <nav className="w-full max-w-5xl mx-auto p-6 flex justify-between items-center border-b border-[var(--card-border)] mb-12">
        <Link href="/">
          <div className="text-xl font-bold tracking-tight text-[var(--primary)] flex items-center gap-2 cursor-pointer">
            <div className="w-6 h-6 rounded bg-[var(--primary)] text-white flex items-center justify-center text-xs">A</div>
            Aegis User
          </div>
        </Link>
        <div className="flex gap-3">
          <button onClick={toggleTheme} className="btn-secondary">
            {theme === "light" ? "Dark" : "Light"}
          </button>
          {!publicKey ? (
            <button onClick={connectWallet} className="btn-primary">Connect Wallet</button>
          ) : (
            <div className="btn-secondary font-mono text-xs flex items-center">
              {publicKey.substring(0, 5)}...{publicKey.substring(publicKey.length - 4)}
            </div>
          )}
        </div>
      </nav>

      <main className="w-full max-w-3xl px-6">
        <h1 className="text-2xl font-bold mb-6">User Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="clean-card p-6">
            <h2 className="text-lg font-semibold mb-1">Attention Vault</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Set a daily spending limit for your Agent.</p>
            
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)] uppercase tracking-wider">Daily Limit (USDC)</label>
                <input 
                  type="number" 
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="clean-input w-full"
                />
              </div>
              <button className="btn-primary w-full mt-1">Deploy Vault</button>
            </div>
          </div>

          <div className="clean-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-lg font-semibold">Agent Status</h2>
                <span className="badge-success flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--success-text)] animate-pulse"></span>
                  Active
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">Pulling news from IPFS and verifying publishers.</p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-[var(--card-border)]">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Today's Spend</span>
                <span className="text-sm font-bold text-[var(--primary)]">1.25 USDC</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--card-border)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--primary)]" style={{ width: "12.5%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
