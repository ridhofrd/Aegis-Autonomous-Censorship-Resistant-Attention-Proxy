"use client";

import { useState } from "react";
import Link from "next/link";
import { isAllowed, setAllowed, getUserInfo } from "@stellar/freighter-api";
import { useTheme } from "@/components/ThemeProvider";

export default function PublisherDashboard() {
  const { theme, toggleTheme } = useTheme();
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isTrusted, setIsTrusted] = useState(false);

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

  const submitZKProof = () => {
    alert("Simulating ZK Proof Submission to Trust Registry...");
    setTimeout(() => setIsTrusted(true), 1500);
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
        <h1 className="text-4xl font-extrabold mb-8">Publisher Portal</h1>
        
        <div className="glass-card p-8 mb-8 flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold mb-2">Trust Status</h2>
          {isTrusted ? (
            <div className="mt-4 p-4 px-8 rounded-full border border-green-500 bg-green-500/10 text-green-400 font-bold flex items-center gap-2">
              <span>✅</span> Verified Publisher
            </div>
          ) : (
            <div className="mt-4 p-4 px-8 rounded-full border border-yellow-500 bg-yellow-500/10 text-yellow-500 font-bold flex items-center gap-2">
              <span>⚠️</span> Unverified
            </div>
          )}
          <p className="opacity-70 mt-4 max-w-lg">
            Unverified publishers cannot receive USDC micropayments from Aegis Agents. Prove your credibility to join the registry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card p-8 opacity-50 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-gray-800 text-xs px-2 py-1 rounded">Legacy</div>
            <h2 className="text-xl font-bold mb-4">Economic Staking</h2>
            <p className="opacity-70 mb-6 text-sm">Lock 100 USDC in the Trust Registry smart contract to gain instant trust via slashable stake.</p>
            <button className="btn-secondary w-full cursor-not-allowed" disabled>
              Stake 100 USDC
            </button>
          </div>

          <div className="glass-card p-8 border-2 border-[var(--accent)] relative shadow-[0_0_20px_var(--accent)] shadow-opacity-20">
            <div className="absolute top-4 right-4 bg-[var(--accent)] text-black text-xs px-2 py-1 rounded font-bold">Recommended</div>
            <h2 className="text-xl font-bold mb-4">Zero-Knowledge Proof</h2>
            <p className="opacity-70 mb-6 text-sm">Generate a cryptographic ZK-proof using Reclaim Protocol to verify your NYT/WSJ credential without revealing your identity.</p>
            <button onClick={submitZKProof} className="btn-primary w-full shadow-[0_0_15px_var(--accent)]">
              Submit ZK Credential
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
