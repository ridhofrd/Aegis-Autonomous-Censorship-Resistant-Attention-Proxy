"use client";

import { useState } from "react";
import Link from "next/link";
import { isAllowed, setAllowed, requestAccess } from "@stellar/freighter-api";
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
        const { address, error } = await requestAccess();
        if (address) setPublicKey(address);
        else if (error) console.error(error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect Freighter wallet");
    }
  };

  const submitZKProof = () => {
    setIsTrusted(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      <nav className="w-full max-w-5xl mx-auto p-6 flex justify-between items-center border-b border-[var(--card-border)] mb-12">
        <Link href="/">
          <div className="text-xl font-bold tracking-tight text-[var(--primary)] flex items-center gap-2 cursor-pointer">
            <div className="w-6 h-6 rounded bg-[var(--primary)] text-white flex items-center justify-center text-xs">A</div>
            Aegis Publisher
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
        <h1 className="text-2xl font-bold mb-6">Publisher Portal</h1>
        
        <div className="clean-card p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Trust Registry Status</h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-md">
              Unverified publishers cannot receive USDC micropayments. Prove your credibility to join the registry.
            </p>
          </div>
          <div>
            {isTrusted ? (
              <span className="badge-success">Verified Publisher</span>
            ) : (
              <span className="badge-warning">Unverified</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="clean-card p-6 opacity-60">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-base font-semibold">Economic Staking</h2>
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Legacy</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Lock 100 USDC in the smart contract to gain instant trust via slashable stake.</p>
            <button className="btn-secondary w-full" disabled>Stake 100 USDC</button>
          </div>

          <div className="clean-card p-6 border-[var(--primary)] shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-base font-semibold text-[var(--primary)]">Zero-Knowledge Proof</h2>
              <span className="badge-success !bg-[var(--primary)] !text-white text-[10px] px-2 py-0.5">Recommended</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Generate a cryptographic ZK-proof using Reclaim to verify credentials without revealing identity.</p>
            <button onClick={submitZKProof} className="btn-primary w-full">Submit ZK Credential</button>
          </div>
        </div>
      </main>
    </div>
  );
}
