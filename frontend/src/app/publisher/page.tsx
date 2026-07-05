"use client";

import { useState } from "react";
import Link from "next/link";
import { isAllowed, setAllowed, requestAccess, signTransaction } from "@stellar/freighter-api";
import { useTheme } from "@/components/ThemeProvider";
import { Keypair } from "@stellar/stellar-sdk";
import { Client as TrustRegistry, networks } from "trust_registry";

// Hardcoded Mock Oracle Credentials (DO NOT USE IN PRODUCTION)
const MOCK_ORACLE_SECRET = "SCH7RAX3ATSJAMQKI4J3IWJG5PWVL2YGUREKIYVX3L36NDLLBBPPKDJ6";

export default function PublisherDashboard() {
  const { theme, toggleTheme } = useTheme();
  
  // Wallet & Trust State
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isTrusted, setIsTrusted] = useState(false);
  
  // Onboarding State
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [staking, setStaking] = useState(false);

  // Publishing State
  const [articleUrl, setArticleUrl] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Mock Earnings Data
  const [earnings] = useState({ totalUsdc: "150.50", articlesIndexed: 12, trustScore: 98 });

  const fetchTrustStatus = async (address: string) => {
    try {
      const trustRegistry = new TrustRegistry({
        networkPassphrase: networks.testnet.networkPassphrase,
        contractId: networks.testnet.contractId,
        rpcUrl: "https://soroban-testnet.stellar.org",
        publicKey: address,
      });
      const tx = await trustRegistry.is_trusted({ publisher: address });
      setIsTrusted(tx.result === true);
    } catch (e) {
      console.log("Not trusted yet or error reading state", e);
    }
  };

  const connectWallet = async () => {
    try {
      let allowed = await isAllowed();
      if (!allowed) {
        await setAllowed();
        allowed = await isAllowed();
      }
      if (allowed) {
        const { address, error } = await requestAccess();
        if (address) {
          setPublicKey(address);
          await fetchTrustStatus(address);
        }
        else if (error) console.error(error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect Freighter wallet");
    }
  };

  const handleStake = async () => {
    if (!publicKey) return alert("Please connect your wallet first!");
    setStaking(true);
    try {
      const trustRegistry = new TrustRegistry({
        networkPassphrase: networks.testnet.networkPassphrase,
        contractId: networks.testnet.contractId,
        rpcUrl: "https://soroban-testnet.stellar.org",
        publicKey: publicKey,
      });
      const stakeAmount = BigInt(100_0000000); 
      const tx = await trustRegistry.stake({ publisher: publicKey, amount: stakeAmount });
      const result = await tx.signAndSend({
        signTransaction: async (xdr: string) => {
          return await signTransaction(xdr, { networkPassphrase: "Test SDF Network ; September 2015" });
        }
      });
      setIsTrusted(true);
      alert("Successfully staked 100 USDC and gained trusted status!");
    } catch (e) {
      console.error(e);
      alert("Failed to stake USDC. Make sure you have enough testnet balance.");
    } finally {
      setStaking(false);
    }
  };

  const verifyEmailAndSubmitProof = async () => {
    if (!publicKey) return alert("Please connect your wallet first!");
    if (!email) return alert("Please enter an institutional email.");
    
    const validDomains = ["@nytimes.com", "@reuters.com", "@bloomberg.com", "@wsj.com", "@independent.io"];
    const isCredible = validDomains.some(domain => email.endsWith(domain));
    if (!isCredible) return alert("Unrecognized institutional domain. Please use a valid credible email.");

    setLoading(true);
    try {
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(email));
      const payload = Buffer.from(hashBuffer);

      const oracleKeypair = Keypair.fromSecret(MOCK_ORACLE_SECRET);
      const signature = oracleKeypair.sign(payload);

      const trustRegistry = new TrustRegistry({
        networkPassphrase: networks.testnet.networkPassphrase,
        contractId: networks.testnet.contractId,
        rpcUrl: "https://soroban-testnet.stellar.org",
        publicKey: publicKey,
      });

      const tx = await trustRegistry.submit_zk_proof({
        publisher: publicKey,
        payload: payload,
        signature: signature,
      });

      await tx.signAndSend({
        signTransaction: async (xdr: string) => {
          return await signTransaction(xdr, { networkPassphrase: "Test SDF Network ; September 2015" });
        }
      });

      setIsTrusted(true);
      alert("Successfully verified institutional credentials on-chain!");
    } catch (error) {
      console.error(error);
      alert("Failed to verify credentials or submit transaction.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleUrl || !articleTitle) return;
    
    setIsPublishing(true);
    // Simulate API delay for Aegis AI indexing the article
    await new Promise(res => setTimeout(res, 2000));
    setIsPublishing(false);
    setArticleUrl("");
    setArticleTitle("");
    alert("Article successfully ingested! The Aegis AI Agent has indexed your content for the Information Proxy.");
  };

  return (
    <div className="min-h-screen flex flex-col items-center pb-20">
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

      <main className="w-full max-w-4xl px-6 animate-fadeIn">
        
        {/* Status Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Publisher Portal</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {isTrusted 
                ? "Your Verified Publisher Dashboard. Publish and track earnings." 
                : "Prove your credibility to join the registry and receive USDC micropayments."}
            </p>
          </div>
          <div>
            {isTrusted ? (
              <span className="px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-full font-bold flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                Verified Publisher
              </span>
            ) : (
              <span className="px-4 py-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20 rounded-full font-bold">
                Unverified
              </span>
            )}
          </div>
        </div>

        {!isTrusted ? (
          /* ONBOARDING STATE */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="clean-card p-6 border-[var(--primary)] shadow-sm hover:border-[var(--primary)] transition-all">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-base font-semibold text-[var(--primary)]">Economic Staking</h2>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Lock 100 USDC in the smart contract to gain instant trust via slashable stake. (Alternative to ZK Proof).</p>
              <button 
                onClick={handleStake} 
                className="btn-secondary w-full border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
                disabled={staking}
              >
                {staking ? "Staking on-chain..." : "Stake 100 USDC"}
              </button>
            </div>

            <div className="clean-card p-6 border-[var(--primary)] shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-[var(--primary)]">ZK-Proof Oracle (Mock)</h2>
                <span className="badge-success !bg-[var(--primary)] !text-white text-[10px] px-2 py-0.5">Recommended</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Enter your institutional email. We will hash it and sign it locally to simulate an Oracle ZK verification.
              </p>
              <input
                type="email"
                placeholder="journalist@independent.io"
                className="w-full p-2 mb-4 bg-transparent border border-[var(--card-border)] rounded text-sm text-[var(--text-color)] outline-none focus:border-[var(--primary)]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button onClick={verifyEmailAndSubmitProof} className="btn-primary w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify Institutional Email"}
              </button>
            </div>
          </div>
        ) : (
          /* VERIFIED DASHBOARD STATE */
          <div className="flex flex-col gap-8 animate-fadeIn">
            
            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="clean-card p-6 border-t-4 border-t-green-500">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Total Earned</h3>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold">{earnings.totalUsdc}</span>
                  <span className="text-lg font-semibold text-[var(--text-secondary)] mb-1">USDC</span>
                </div>
                <p className="text-xs text-green-500 mt-2 font-medium">Funds stream directly to your wallet</p>
              </div>
              <div className="clean-card p-6 border-t-4 border-t-[var(--primary)]">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Articles Indexed</h3>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold">{earnings.articlesIndexed}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium">Available in Aegis Proxy</p>
              </div>
              <div className="clean-card p-6 border-t-4 border-t-blue-500">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Trust Score</h3>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold">{earnings.trustScore}</span>
                  <span className="text-lg font-semibold text-[var(--text-secondary)] mb-1">/ 100</span>
                </div>
                <p className="text-xs text-blue-500 mt-2 font-medium">Excellent standing</p>
              </div>
            </div>

            {/* Publish Article Form */}
            <div className="clean-card p-8 border border-[var(--primary)]/20 shadow-lg shadow-[var(--primary)]/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Publish to Aegis AI</h2>
                  <p className="text-sm text-[var(--text-secondary)]">Submit your article URL for the AI Agent to ingest, verify, and index.</p>
                </div>
              </div>

              <form onSubmit={handlePublish} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-bold mb-2">Article Title</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., The Truth About Global Supply Chains"
                    className="w-full p-3 bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-lg text-sm text-[var(--text-color)] outline-none focus:border-[var(--primary)] transition-colors"
                    value={articleTitle}
                    onChange={(e) => setArticleTitle(e.target.value)}
                    disabled={isPublishing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Article URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://yourblog.com/article"
                    className="w-full p-3 bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-lg text-sm text-[var(--text-color)] outline-none focus:border-[var(--primary)] transition-colors font-mono"
                    value={articleUrl}
                    onChange={(e) => setArticleUrl(e.target.value)}
                    disabled={isPublishing}
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    className="btn-primary px-8 py-3 w-full sm:w-auto font-bold tracking-wide"
                    disabled={isPublishing}
                  >
                    {isPublishing ? "Indexing into Aegis AI..." : "Submit to Knowledge Base"}
                  </button>
                </div>
              </form>
            </div>
            
          </div>
        )}

      </main>
    </div>
  );
}
