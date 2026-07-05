"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { isAllowed, setAllowed, requestAccess, signTransaction } from "@stellar/freighter-api";
import { useTheme } from "@/components/ThemeProvider";
import { Keypair } from "@stellar/stellar-sdk";
import { Client as TrustRegistry, networks } from "trust_registry";

// Mock Oracle Credentials from Environment (DO NOT USE IN PRODUCTION)
const MOCK_ORACLE_SECRET = process.env.NEXT_PUBLIC_MOCK_ORACLE_SECRET || "";

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

  // Publisher Articles State
  const [publishedArticles, setPublishedArticles] = useState<any[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

  useEffect(() => {
    if (publicKey && isTrusted) {
      fetchPublishedArticles(publicKey);
    }
  }, [publicKey, isTrusted]);

  const fetchPublishedArticles = async (address: string) => {
    setLoadingArticles(true);
    try {
      const res = await fetch(`/api/publishers/articles?walletAddress=${address}`);
      const data = await res.json();
      if (data.articles) {
        setPublishedArticles(data.articles);
        // We could also dynamically update earnings.articlesIndexed based on data.articles.length
      }
    } catch (e) {
      console.error("Failed to fetch articles:", e);
    } finally {
      setLoadingArticles(false);
    }
  };

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
    const topicsInput = (document.getElementById('publisherTopics') as HTMLInputElement)?.value || 'General';

    try {
      await fetch('/api/publishers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey,
          name: articleTitle,
          rssUrl: articleUrl,
          topics: topicsInput
        })
      });
      alert("Successfully registered! Your publication feed is now active in the Aegis ecosystem.");
      setArticleUrl("");
      setArticleTitle("");
    } catch (e) {
      console.error(e);
      alert("Failed to register publication.");
    } finally {
      setIsPublishing(false);
    }
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
              <div className="clean-card p-6 border-t-4 border-t-green-500 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Total Earned</h3>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold">{earnings.totalUsdc}</span>
                    <span className="text-lg font-semibold text-[var(--text-secondary)] mb-1">USDC</span>
                  </div>
                  <p className="text-xs text-green-500 mt-2 font-medium">Funds stream directly to your contract</p>
                </div>
                <button 
                  onClick={() => alert("Withdrawal requested! Interacting with Soroban Attention Vault...")}
                  className="mt-4 py-1.5 px-3 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded-md text-sm font-bold border border-green-500/20 transition-colors w-full text-center"
                >
                  Withdraw USDC
                </button>
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
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Register Publication</h2>
                  <p className="text-sm text-[var(--text-secondary)]">Link your RSS feed. Aegis will automatically index your content into the ecosystem.</p>
                </div>
              </div>

              <form onSubmit={handlePublish} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold mb-2">Publication Name</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., The Decentralized Wire"
                      className="w-full p-3 bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-lg text-sm text-[var(--text-color)] outline-none focus:border-[var(--primary)] transition-colors"
                      value={articleTitle}
                      onChange={(e) => setArticleTitle(e.target.value)}
                      disabled={isPublishing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Topics (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="Crypto, Tech, Web3"
                      className="w-full p-3 bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-lg text-sm text-[var(--text-color)] outline-none focus:border-[var(--primary)] transition-colors"
                      id="publisherTopics"
                      disabled={isPublishing}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">RSS Feed URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://yourblog.com/rss.xml"
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
                    {isPublishing ? "Registering..." : "Register Publication Feed"}
                  </button>
                </div>
              </form>
            </div>

            {/* My Indexed Articles */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-6">My Indexed Articles</h2>
              {loadingArticles ? (
                <div className="flex justify-center p-10">
                  <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : publishedArticles.length === 0 ? (
                <div className="clean-card p-10 text-center">
                  <p className="text-[var(--text-secondary)]">No articles found. Have you registered an active RSS feed?</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {publishedArticles.map((article: any) => (
                    <div key={article.id} className="clean-card p-6 border-l-4 border-l-blue-500">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold leading-tight">{article.title}</h3>
                        <span className="text-[10px] font-bold px-2 py-1 bg-green-500/10 text-green-600 rounded whitespace-nowrap ml-4">
                          Trust Score: {article.trustScore}
                        </span>
                      </div>
                      <p className="text-sm font-mono text-[var(--text-secondary)] mb-4">
                        Indexed: {new Date(article.aegisIndexDate).toLocaleString()} • Ingested {article.timesIngested} times
                      </p>
                      
                      <div className="p-4 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2 text-[var(--primary)]">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                          <span className="text-xs font-bold uppercase tracking-wider">Aegis AI Summary</span>
                        </div>
                        <p className="text-sm italic text-[var(--text-color)]">{article.aiSummary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
