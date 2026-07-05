"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { isAllowed, setAllowed, getUserInfo } from "@stellar/freighter-api";
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
        const info = await getUserInfo();
        setPublicKey(info.publicKey);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect Freighter wallet");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center">
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-10 max-w-6xl">
        <Link href="/">
          <div className="text-2xl font-bold tracking-tighter cursor-pointer" style={{ color: "var(--accent)" }}>
            Aegis<span style={{ color: "var(--text-color)" }}>.</span>
          </div>
        </Link>
        <div className="flex gap-4">
          <button onClick={toggleTheme} className="btn-secondary" style={{ padding: "8px 16px", borderRadius: "20px" }}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          {!publicKey ? (
            <button onClick={connectWallet} className="btn-primary" style={{ padding: "8px 16px", borderRadius: "20px" }}>
              Connect Freighter
            </button>
          ) : (
            <div className="btn-secondary" style={{ padding: "8px 16px", borderRadius: "20px" }}>
              {publicKey.substring(0, 5)}...{publicKey.substring(publicKey.length - 4)}
            </div>
          )}
        </div>
      </div>

      <main className="z-10 mt-32 w-full max-w-4xl px-4">
        <h1 className="text-4xl font-extrabold mb-8">User Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-4">Attention Vault</h2>
            <p className="opacity-70 mb-6">Set a daily spending limit for your Autonomous Agent.</p>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 opacity-80">Daily Limit (USDC)</label>
                <input 
                  type="number" 
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{ background: "rgba(0,0,0,0.1)", borderColor: "var(--card-border)", color: "var(--text-color)" }}
                />
              </div>
              <button className="btn-primary w-full mt-2">
                Deploy Attention Vault
              </button>
            </div>
          </div>

          <div className="glass-card p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-4">Agent Status</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-medium">Active & Curating</span>
              </div>
              <p className="opacity-70 text-sm">Your AI is currently pulling news from IPFS and verifying publishers against the Trust Registry.</p>
            </div>
            
            <div className="mt-8 p-4 rounded-lg" style={{ background: "rgba(0,0,0,0.1)", border: "1px solid var(--card-border)" }}>
              <div className="flex justify-between mb-2">
                <span className="opacity-70">Today's Spend</span>
                <span className="font-bold text-green-400">1.25 USDC</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-400" style={{ width: "12.5%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
