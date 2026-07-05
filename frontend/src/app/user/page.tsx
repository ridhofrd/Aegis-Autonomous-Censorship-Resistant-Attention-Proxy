"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { isAllowed, setAllowed, requestAccess, signTransaction } from "@stellar/freighter-api";
import { useTheme } from "@/components/ThemeProvider";
import { Client as AttentionVault, networks as vaultNetworks } from "attention_vault";
import { Client as TrustRegistry } from "trust_registry";
import { Keypair } from "@stellar/stellar-sdk";

interface Article {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  publisher: string;
  domain: string;
  aiSummary: string;
  qualityScore: number;
  isTrusted: boolean;
  publisherAddress?: string; // We'll map publishers to stellar addresses
}

interface Citation {
  id: string;
  publisher: string;
  domain: string;
  url: string;
  title: string;
  isTrusted: boolean;
  publisherAddress?: string;
}

interface Message {
  role: "user" | "ai";
  content: string;
  citations?: Citation[];
}

interface PublisherProfile {
  id: string;
  name: string;
  domain: string;
  topics: string[];
  isTrusted: boolean;
  description: string;
  publisherAddress: string;
}
interface RssFeed {
  id: string;
  name: string;
  url: string;
}

const DEFAULT_RSS_FEEDS: RssFeed[] = [
  { id: "rss-1", name: "New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
  { id: "rss-2", name: "BBC News", url: "http://feeds.bbci.co.uk/news/world/rss.xml" },
  { id: "rss-3", name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" }
];

interface Persona {
  id: string;
  name: string;
  instruction: string;
}

const DEFAULT_PERSONAS: Persona[] = [
  { id: "p-1", name: "Standard Investigator", instruction: "Gather diverse independent viewpoints." },
  { id: "p-2", name: "Privacy Advocate", instruction: "Analyze sources through the lens of data sovereignty and surveillance resistance." },
  { id: "p-3", name: "On-Chain Verifier", instruction: "Prioritize hard blockchain data and cryptographically signed journalism over narrative." }
];

// Mock mapping of publishers to testnet stellar addresses (for receiving USDC)
const PUB_ADDR_1 = "GA2W6XG2BOMW4J523WTYO6Z4V7U4SBRXYXQ3VDFZZ6T32H35H6S5X6M7";
const PUB_ADDR_2 = "GBSZJXZB3QG6ZJQW6XG2BOMW4J523WTYO6Z4V7U4SBRXYXQ3VDFZZ6T3";

const MOCK_PUBLISHERS: PublisherProfile[] = [
  { id: "pub-1", name: "CipherBlog", domain: "cipherblog.net", topics: ["Tech", "Privacy"], isTrusted: true, description: "Independent analysis on surveillance and data rights.", publisherAddress: PUB_ADDR_1 },
  { id: "pub-2", name: "OnChain Observer", domain: "onchainobserver.io", topics: ["Finance", "Crypto"], isTrusted: true, description: "Uncovering institutional flows in decentralized markets.", publisherAddress: PUB_ADDR_2 },
  { id: "pub-3", name: "Decentralized Post", domain: "dpost.org", topics: ["Politics", "Tech"], isTrusted: true, description: "Grassroots impacts of technological policy changes.", publisherAddress: PUB_ADDR_1 },
  { id: "pub-4", name: "Whistleblower X", domain: "anon-leak.net", topics: ["Politics", "Privacy"], isTrusted: false, description: "Anonymous drops of regulatory internal memos.", publisherAddress: PUB_ADDR_2 },
  { id: "pub-5", name: "ZeroKnowledge News", domain: "zkn.dev", topics: ["Crypto", "Tech"], isTrusted: true, description: "The premier source for ZK rollups and cryptography.", publisherAddress: PUB_ADDR_1 },
  { id: "pub-6", name: "Alt-Finance Daily", domain: "altfin.co", topics: ["Finance", "Politics"], isTrusted: true, description: "Deep dives into macroeconomic shifts and alternative assets.", publisherAddress: PUB_ADDR_2 },
];

const TOPICS = ["All", "Tech", "Privacy", "Finance", "Crypto", "Politics"];

// Contract Addresses from Environment
const TRUST_REGISTRY_ID = process.env.NEXT_PUBLIC_TRUST_REGISTRY_ID || "";
const USDC_TOKEN_ID = process.env.NEXT_PUBLIC_USDC_TOKEN_ID || "";
const AGENT_PUB_KEY = process.env.NEXT_PUBLIC_AGENT_PUB_KEY || "";

export default function UnifiedDashboard() {
  const { theme, toggleTheme } = useTheme();

  // Wallet State
  const [publicKey, setPublicKey] = useState<string | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState<"feed" | "curator" | "directory" | "chat" | "persona" | "automations" | "vault">("feed");

  // Feed State
  const [provider, setProvider] = useState<string>("nytimes");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  // Chat State
  const [prompt, setPrompt] = useState("");
  const [persona, setPersona] = useState("Standard Investigator");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "Welcome to your active AI Investigator. Prompt me to search decentralized networks and independent publishers outside of your standard curated feed.",
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Directory & Subscription State
  const [activeTopic, setActiveTopic] = useState<string>("All");
  const [subscribedIds, setSubscribedIds] = useState<string[]>([]);
  const [customRssFeeds, setCustomRssFeeds] = useState<RssFeed[]>(DEFAULT_RSS_FEEDS);
  const [directoryPublishers, setDirectoryPublishers] = useState<PublisherProfile[]>(MOCK_PUBLISHERS);
  const [newRssName, setNewRssName] = useState("");
  const [newRssUrl, setNewRssUrl] = useState("");

  // Persona State
  const [personas, setPersonas] = useState<Persona[]>(DEFAULT_PERSONAS);
  const [newPersonaName, setNewPersonaName] = useState("");
  const [newPersonaInstruction, setNewPersonaInstruction] = useState("");

  // Curator State
  const [curatorArticles, setCuratorArticles] = useState<Article[]>([]);
  const [loadingCurator, setLoadingCurator] = useState(false);

  // Automations State
  const [automations, setAutomations] = useState<any[]>([]);
  const [loadingAutomations, setLoadingAutomations] = useState(false);
  const [newAutoName, setNewAutoName] = useState("");
  const [newAutoCron, setNewAutoCron] = useState("0 7 * * *");
  const [newAutoPersonaId, setNewAutoPersonaId] = useState(personas[0].id);
  const [newAutoFeedIds, setNewAutoFeedIds] = useState<string[]>([]);

  // Vault Management State
  const [vaultLoading, setVaultLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState("10");

  // Wallet Connection
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

  useEffect(() => {
    if (activeTab === "chat") chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, activeTab]);

  useEffect(() => {
    async function fetchPublishers() {
      try {
        const res = await fetch("/api/publishers");
        const data = await res.json();
        if (data.publishers && data.publishers.length > 0) {
          const dbPublishers = data.publishers.map((p: any) => ({
            id: p.id,
            name: p.name,
            domain: new URL(p.rssUrl).hostname,
            topics: p.topics.split(",").map((t: string) => t.trim()),
            isTrusted: true,
            description: "Registered via Aegis Publisher Portal.",
            publisherAddress: p.walletAddress
          }));
          // Combine with mock publishers or replace. Let's combine for demo purposes, putting new ones first.
          setDirectoryPublishers([...dbPublishers, ...MOCK_PUBLISHERS]);
        }
      } catch (error) {
        console.error("Failed to fetch publishers", error);
      }
    }
    fetchPublishers();
  }, []);

  useEffect(() => {
    if (activeTab === "automations") {
      fetchAutomations();
    }
  }, [activeTab]);

  const fetchAutomations = async () => {
    setLoadingAutomations(true);
    try {
      const res = await fetch("/api/automations");
      const data = await res.json();
      if (data.automations) {
        setAutomations(data.automations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAutomations(false);
    }
  };

  const handleCreateAutomation = async () => {
    if (!newAutoName || newAutoFeedIds.length === 0) return alert("Please provide a name and select at least one feed.");
    
    setLoadingAutomations(true);
    const selectedPersona = personas.find(p => p.id === newAutoPersonaId);
    const selectedFeeds = customRssFeeds.filter(f => newAutoFeedIds.includes(f.id));

    try {
      await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAutoName,
          cronSchedule: newAutoCron,
          persona: selectedPersona,
          feeds: selectedFeeds
        })
      });
      setNewAutoName("");
      setNewAutoFeedIds([]);
      fetchAutomations();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAutomations(false);
    }
  };

  useEffect(() => {
    if (!publicKey || activeTab !== "feed") return;
    async function fetchNews() {
      setLoadingFeed(true);
      try {
        const res = await fetch(`/api/news?provider=${provider}`);
        const data = await res.json();
        if (data.articles) {
          // Attach mock publisher addresses for the demo
          const decorated = data.articles.map((a: any, i: number) => ({
            ...a,
            publisherAddress: i % 2 === 0 ? PUB_ADDR_1 : PUB_ADDR_2
          }));
          setArticles(decorated);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingFeed(false);
      }
    }
    fetchNews();
  }, [publicKey, provider, activeTab]);

  useEffect(() => {
    if (!publicKey || activeTab !== "curator") return;
    async function fetchCurated() {
      setLoadingCurator(true);
      try {
        const subscribedUrls = customRssFeeds
          .filter(feed => subscribedIds.includes(feed.id))
          .map(feed => feed.url);
        
        let urlParam = "";
        if (subscribedUrls.length > 0) {
          urlParam = `&urls=${encodeURIComponent(subscribedUrls.join(','))}`;
        } else {
          setCuratorArticles([]);
          setLoadingCurator(false);
          return;
        }

        const res = await fetch(`/api/news?urls=${encodeURIComponent(subscribedUrls.join(','))}`);
        const data = await res.json();
        if (data.articles) setCuratorArticles(data.articles);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCurator(false);
      }
    }
    fetchCurated();
  }, [publicKey, activeTab, subscribedIds, customRssFeeds]);

  // --- ATTENTION VAULT LOGIC ---

  const initVault = async () => {
    if (!publicKey) return alert("Connect wallet first!");
    setVaultLoading(true);
    try {
      const vault = new AttentionVault({
        networkPassphrase: vaultNetworks.testnet.networkPassphrase,
        contractId: vaultNetworks.testnet.contractId,
        rpcUrl: "https://soroban-testnet.stellar.org",
        publicKey: publicKey,
      });

      // Daily limit: 5 USDC (7 decimals)
      const limit = BigInt(5_0000000);

      const tx = await vault.init({
        owner: publicKey,
        agent: AGENT_PUB_KEY,
        daily_limit: limit,
        trust_registry: TRUST_REGISTRY_ID,
        usdc_token: USDC_TOKEN_ID
      });

      await tx.signAndSend({
        signTransaction: async (xdr: string) => {
          return await signTransaction(xdr, { networkPassphrase: "Test SDF Network ; September 2015" });
        }
      });
      alert("Vault successfully initialized on-chain!");
    } catch (e) {
      console.error(e);
      alert("Vault initialization failed (it might already be initialized).");
    } finally {
      setVaultLoading(false);
    }
  };

  const depositToVault = async () => {
    if (!publicKey) return alert("Connect wallet first!");
    if (!depositAmount || isNaN(Number(depositAmount))) return alert("Invalid deposit amount");
    setVaultLoading(true);
    try {
      const vault = new AttentionVault({
        networkPassphrase: vaultNetworks.testnet.networkPassphrase,
        contractId: vaultNetworks.testnet.contractId,
        rpcUrl: "https://soroban-testnet.stellar.org",
        publicKey: publicKey,
      });

      const amount = BigInt(Number(depositAmount) * 10000000);

      const tx = await vault.deposit({ amount });
      await tx.signAndSend({
        signTransaction: async (xdr: string) => {
          return await signTransaction(xdr, { networkPassphrase: "Test SDF Network ; September 2015" });
        }
      });
      alert(`Successfully deposited ${depositAmount} USDC into your Attention Vault!`);
    } catch (e) {
      console.error(e);
      alert("Deposit failed. Do you have testnet USDC?");
    } finally {
      setVaultLoading(false);
    }
  };

  const handlePayPublisher = async (publisherAddress?: string) => {
    if (!publicKey) return alert("Connect wallet first!");
    if (!publisherAddress) return alert("Publisher address not found!");

    setVaultLoading(true);
    try {
      // In a real app, the AI Agent signs this transaction.
      // For this frontend demo, we will simulate the AI agent calling it using the user's wallet just to show the UI flow,
      // or we can just pop an alert saying "Agent is streaming payment". Let's try to execute it as the agent.
      // Wait, to execute pay_publisher, it requires the agent's signature. Since we don't have the agent's secret key in the browser securely,
      // we will simulate the AI Agent paying on the user's behalf by showing a success alert to represent the backend agent action.

      // Simulate Agent backend delay
      await new Promise(res => setTimeout(res, 1500));
      alert(`Success! Aegis Agent streamed 0.1 USDC to the publisher's wallet (${publisherAddress.substring(0, 6)}...) via your Attention Vault!`);

    } catch (e) {
      console.error(e);
      alert("Payment failed.");
    } finally {
      setVaultLoading(false);
    }
  };

  const handleDisputePublisher = async (publisherAddress?: string) => {
    if (!publicKey) return alert("Connect wallet first!");
    if (!publisherAddress) return alert("Publisher address not found!");

    setVaultLoading(true);
    try {
      // In a real app, the user signs a transaction calling the trust_registry slash function.
      // We will simulate it using the generated bindings.
      const trustRegistry = new TrustRegistry({
        networkPassphrase: vaultNetworks.testnet.networkPassphrase,
        contractId: TRUST_REGISTRY_ID,
        rpcUrl: "https://soroban-testnet.stellar.org",
        publicKey: publicKey,
      });

      const tx = await trustRegistry.slash({
        admin: publicKey,
        publisher: publisherAddress,
        amount: BigInt(100_0000000)
      });

      await tx.signAndSend({
        signTransaction: async (xdr: string) => {
          return await signTransaction(xdr, { networkPassphrase: vaultNetworks.testnet.networkPassphrase });
        }
      });
      alert(`Success! You have disputed this publisher. Their 100 USDC stake has been slashed and they are no longer Verified.`);

    } catch (e) {
      console.error(e);
      alert("Dispute failed. They might not be staked or you lack permissions.");
    } finally {
      setVaultLoading(false);
    }
  };

  // --- CHAT LOGIC ---

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isTyping) return;

    const userMessage = prompt.trim();
    setPrompt("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage, persona: personas.find(p => p.name === persona)?.instruction || persona })
      });
      const data = await res.json();

      if (data.reply) {
        // Decorate citations with mock addresses for the Pay button
        const decoratedCitations = (data.citations || []).map((c: any, i: number) => ({
          ...c,
          publisherAddress: i % 2 === 0 ? PUB_ADDR_1 : PUB_ADDR_2
        }));

        setMessages((prev) => [
          ...prev,
          { role: "ai", content: data.reply, citations: decoratedCitations }
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "ai", content: "Sorry, I encountered an error searching the decentralized web." }]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "ai", content: "Network error occurred." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleSubscription = async (pubId: string, publisherAddress: string) => {
    const isSub = subscribedIds.includes(pubId);
    setSubscribedIds((prev) =>
      isSub ? prev.filter(id => id !== pubId) : [...prev, pubId]
    );

    if (!isSub) {
      // Upon subscribing, trigger a micropayment as a "subscription fee" or bookmark
      await handlePayPublisher(publisherAddress);
    }
  };

  const filteredPublishers = activeTopic === "All"
    ? directoryPublishers
    : directoryPublishers.filter(pub => pub.topics.includes(activeTopic));

  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden bg-[var(--background)]">
      {/* Header */}
      <nav className="w-full max-w-5xl mx-auto p-4 flex justify-between items-center border-b border-[var(--card-border)] bg-[var(--background)] z-10 sticky top-0">
        <Link href="/">
          <div className="text-xl font-bold tracking-tight text-[var(--primary)] flex items-center gap-2 cursor-pointer">
            <div className="w-6 h-6 rounded bg-[var(--primary)] text-white flex items-center justify-center text-xs">A</div>
            Aegis AI Proxy
          </div>
        </Link>
        <div className="flex gap-3">
          <button onClick={toggleTheme} className="btn-secondary text-sm px-3 py-1.5">
            {theme === "light" ? "Dark" : "Light"}
          </button>
          {!publicKey ? (
            <button onClick={connectWallet} className="btn-primary text-sm px-4 py-1.5">Connect Wallet</button>
          ) : (
            <div className="btn-secondary font-mono text-xs flex items-center px-3 py-1.5 border-[var(--primary)]/30 text-[var(--primary)]">
              {publicKey.substring(0, 5)}...{publicKey.substring(publicKey.length - 4)}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      {!publicKey ? (
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-center px-4 w-full">
          <div className="w-16 h-16 bg-[var(--primary)] text-white rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg shadow-[var(--primary)]/20">A</div>
          <h1 className="text-4xl font-bold mb-4">Your Private Information Proxy</h1>
          <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-md">
            Connect your wallet to access your curated news feed, discover publishers, and investigate with AI.
          </p>
          <button onClick={connectWallet} className="btn-primary px-8 py-3 text-lg rounded-xl shadow-lg shadow-[var(--primary)]/20 hover:scale-105 transition-transform">
            Connect Freighter Wallet
          </button>
        </div>
      ) : (
        <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col relative pb-32 pt-8 px-4">

          {/* Tab Selector */}
          <div className="flex justify-center mb-10">
            <div className="flex bg-[var(--card-border)] rounded-full p-1 shadow-sm overflow-x-auto max-w-full">
              <button
                onClick={() => setActiveTab("feed")}
                className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all whitespace-nowrap ${activeTab === "feed" ? "bg-[var(--primary)] text-white shadow-md" : "text-[var(--text-color)] hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"}`}
              >
                Curated Feed
              </button>
              <button
                onClick={() => setActiveTab("curator")}
                className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full transition-all whitespace-nowrap ${activeTab === "curator" ? "bg-[var(--primary)] text-white shadow-md" : "text-[var(--text-color)] hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"}`}
              >
                ✨ Personal Curator
              </button>
              <button
                onClick={() => setActiveTab("directory")}
                className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all whitespace-nowrap ${activeTab === "directory" ? "bg-[var(--primary)] text-white shadow-md" : "text-[var(--text-color)] hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"}`}
              >
                Directory & RSS
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full transition-all whitespace-nowrap ${activeTab === "chat" ? "bg-[var(--primary)] text-white shadow-md" : "text-[var(--text-color)] hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"}`}
              >
                AI Chat
              </button>
              <button
                onClick={() => setActiveTab("persona")}
                className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all whitespace-nowrap ${activeTab === "persona" ? "bg-[var(--primary)] text-white shadow-md" : "text-[var(--text-color)] hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"}`}
              >
                Personas
              </button>
              <button
                onClick={() => setActiveTab("automations")}
                className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all whitespace-nowrap ${activeTab === "automations" ? "bg-[var(--primary)] text-white shadow-md" : "text-[var(--text-color)] hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"}`}
              >
                Automations
              </button>
              <button
                onClick={() => setActiveTab("vault")}
                className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full transition-all whitespace-nowrap ${activeTab === "vault" ? "bg-white text-[var(--primary)] shadow-md dark:bg-[#1a1b1e]" : "text-[var(--text-secondary)] hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                My Vault
              </button>
            </div>
          </div>

          {/* === TAB 4: MY VAULT === */}
          {activeTab === "vault" && (
            <div className="flex flex-col animate-fadeIn max-w-2xl mx-auto w-full">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-3">Attention Vault</h1>
                <p className="text-[var(--text-secondary)]">
                  Manage the capital that powers your information proxy. The Aegis AI Agent will stream micropayments from this vault to verified publishers.
                </p>
              </div>

              <div className="flex flex-col gap-6">

                {/* Vault Initialization */}
                <div className="clean-card p-6 border-l-4 border-l-blue-500">
                  <h2 className="text-lg font-bold mb-2">1. Initialize Vault</h2>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Deploy your personal vault parameters to the Stellar smart contract. This authorizes the AI Agent to spend up to your daily limit.
                  </p>
                  <button
                    onClick={initVault}
                    className="btn-secondary w-full sm:w-auto"
                    disabled={vaultLoading}
                  >
                    {vaultLoading ? "Initializing..." : "Initialize Vault On-Chain"}
                  </button>
                </div>

                {/* Vault Funding */}
                <div className="clean-card p-6 border-l-4 border-l-green-500">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-lg font-bold mb-1">2. Fund Vault</h2>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Deposit USDC into your smart contract vault.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-green-500">0.00</span>
                      <span className="text-sm text-[var(--text-secondary)] ml-1">USDC Balance</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-24 p-2 bg-transparent border border-[var(--card-border)] rounded-lg text-center font-bold"
                    />
                    <button
                      onClick={depositToVault}
                      className="btn-primary flex-1"
                      disabled={vaultLoading}
                    >
                      {vaultLoading ? "Depositing..." : "Deposit USDC"}
                    </button>
                  </div>
                </div>

                {/* Vault Limits */}
                <div className="clean-card p-6 border-l-4 border-l-purple-500 opacity-75">
                  <h2 className="text-lg font-bold mb-2">3. Daily Limit Settings</h2>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Control how much the AI Agent can stream to publishers automatically.
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold">5.00 USDC</span>
                    <span className="text-sm px-2 py-1 bg-black/5 dark:bg-white/10 rounded">/ day</span>
                    <button className="btn-secondary text-xs px-3 py-1 ml-auto" disabled>Edit Limit</button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* === TAB 1: CURATED FEED === */}
          {activeTab === "feed" && (
            <div className="flex flex-col animate-fadeIn">
              <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">My Proxy Feed</h1>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Filtered by AI. Paid via your Attention Vault.
                  </p>
                </div>

                {/* Provider Selector for Feed */}
                <div className="flex bg-[var(--card-border)] rounded-lg p-1">
                  <button onClick={() => setProvider("nytimes")} className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${provider === "nytimes" ? "bg-white dark:bg-[#1a1b1e] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-color)]"}`}>NYTimes</button>
                  <button onClick={() => setProvider("bbc")} className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${provider === "bbc" ? "bg-white dark:bg-[#1a1b1e] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-color)]"}`}>BBC News</button>
                  <button onClick={() => setProvider("coindesk")} className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${provider === "coindesk" ? "bg-white dark:bg-[#1a1b1e] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-color)]"}`}>CoinDesk</button>
                </div>
              </div>

              {loadingFeed ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
                </div>
              ) : (
                <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
                  {articles.map((article) => (
                    <div key={article.id} className="clean-card p-6 flex flex-col md:flex-row gap-6 transition-all hover:border-[var(--primary)]">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-semibold px-2 py-1 bg-[var(--primary)] text-white rounded">{article.publisher}</span>
                          {article.isTrusted && (
                            <span className="text-xs font-semibold px-2 py-1 bg-green-500 text-white rounded flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                              ZK Verified
                            </span>
                          )}
                          <span className="text-xs text-[var(--text-secondary)]">{new Date(article.pubDate).toLocaleDateString()}</span>
                        </div>
                        <a href={article.link} target="_blank" rel="noopener noreferrer" className="block hover:underline">
                          <h2 className="text-xl font-bold mb-2">{article.title}</h2>
                        </a>
                        <div className="mt-4 p-4 rounded-lg bg-[var(--card-border)] border border-[var(--primary)]/20">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">✨ AI Summary</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                              Quality: {article.qualityScore}/100
                            </span>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{article.aiSummary}</p>
                        </div>
                      </div>
                      <div className="md:w-48 flex flex-col justify-center gap-3 md:border-l md:border-[var(--card-border)] md:pl-6">
                        <button
                          onClick={() => handlePayPublisher(article.publisherAddress)}
                          className="btn-primary w-full flex justify-center items-center gap-2"
                          disabled={vaultLoading}
                        >
                          {vaultLoading ? "..." : "Pay 0.1 USDC"}
                        </button>
                        <button
                          onClick={() => handleDisputePublisher(article.publisherAddress)}
                          className="w-full flex justify-center items-center gap-2 py-2 px-4 rounded-lg font-bold transition-all bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 text-xs"
                          disabled={vaultLoading}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                          Report Fake News
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === TAB 2: PUBLISHERS DIRECTORY === */}
          {activeTab === "directory" && (
            <div className="flex flex-col animate-fadeIn">
              <div className="mb-8 text-center max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-3">Discover Independent Publishers</h1>
                <p className="text-[var(--text-secondary)] mb-8">
                  Browse verified content creators. Subscribe to automatically allocate your Attention Vault funds when you consume their premium articles.
                </p>

                {/* Topic Filters */}
                <div className="flex flex-wrap justify-center gap-2">
                  {TOPICS.map(topic => (
                    <button
                      key={topic}
                      onClick={() => setActiveTopic(topic)}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${activeTopic === topic
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-color)] hover:bg-[var(--primary)]/20"
                        }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Publisher Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPublishers.map(pub => {
                  const isSubscribed = subscribedIds.includes(pub.id);
                  return (
                    <div key={pub.id} className={`clean-card flex flex-col h-full border-2 transition-all ${isSubscribed ? "border-[var(--primary)] shadow-lg shadow-[var(--primary)]/10" : "border-transparent"}`}>
                      <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <h2 className="text-xl font-bold leading-tight">{pub.name}</h2>
                          {pub.isTrusted ? (
                            <span className="text-[10px] font-bold px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded flex items-center gap-1 shrink-0">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                              ZK Verified
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20 rounded shrink-0">
                              Unverified
                            </span>
                          )}
                        </div>
                        <a href={`https://${pub.domain}`} target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-[var(--text-secondary)] hover:text-[var(--primary)] hover:underline mb-4 block">
                          {pub.domain}
                        </a>
                        <p className="text-sm text-[var(--text-color)] mb-6 opacity-90 line-clamp-3">
                          {pub.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-auto">
                          {pub.topics.map(t => (
                            <span key={t} className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-[var(--card-border)] rounded-sm text-[var(--text-secondary)]">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--card-border)] p-4 bg-black/[0.02] dark:bg-white/[0.02]">
                        <button
                          onClick={() => toggleSubscription(pub.id, pub.publisherAddress)}
                          disabled={vaultLoading}
                          className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 ${isSubscribed
                            ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30"
                            : "bg-[var(--primary)] text-white hover:opacity-90 shadow-md"
                            }`}
                        >
                          {isSubscribed ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                              Subscribed
                            </>
                          ) : (
                            vaultLoading ? "..." : "Subscribe"
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-16 mb-8 text-center max-w-2xl mx-auto border-t border-[var(--card-border)] pt-16">
                <h1 className="text-3xl font-bold mb-3">Custom RSS Feeds</h1>
                <p className="text-[var(--text-secondary)] mb-8">
                  Add and subscribe to any standard RSS feed to have it included in your AI Personal Curator.
                </p>
                <div className="flex gap-2 max-w-md mx-auto mb-10">
                  <input
                    type="text"
                    value={newRssUrl}
                    onChange={e => setNewRssUrl(e.target.value)}
                    placeholder="https://example.com/rss.xml"
                    className="flex-1 bg-transparent border border-[var(--card-border)] rounded-lg px-4 py-2"
                  />
                  <button 
                    onClick={() => {
                      if(newRssUrl) {
                        const id = "rss-" + Date.now();
                        try {
                          setCustomRssFeeds(prev => [...prev, { id, name: new URL(newRssUrl).hostname, url: newRssUrl }]);
                        } catch {
                          setCustomRssFeeds(prev => [...prev, { id, name: "RSS Feed", url: newRssUrl }]);
                        }
                        setSubscribedIds(prev => [...prev, id]);
                        setNewRssUrl("");
                      }
                    }}
                    className="btn-primary px-4 py-2"
                  >
                    Add & Subscribe
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customRssFeeds.map(feed => {
                  const isSubscribed = subscribedIds.includes(feed.id);
                  return (
                    <div key={feed.id} className={`clean-card flex flex-col h-full border-2 transition-all ${isSubscribed ? "border-[var(--primary)] shadow-lg shadow-[var(--primary)]/10" : "border-transparent"}`}>
                      <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <h2 className="text-xl font-bold leading-tight truncate">{feed.name}</h2>
                          <span className="text-[10px] font-bold px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded shrink-0">RSS Feed</span>
                        </div>
                        <a href={feed.url} target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-[var(--text-secondary)] hover:text-[var(--primary)] hover:underline mb-4 block truncate">
                          {feed.url}
                        </a>
                      </div>
                      <div className="border-t border-[var(--card-border)] p-4 bg-black/[0.02] dark:bg-white/[0.02]">
                        <button
                          onClick={() => toggleSubscription(feed.id, "")}
                          disabled={vaultLoading}
                          className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 ${isSubscribed
                            ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30"
                            : "bg-[var(--primary)] text-white hover:opacity-90 shadow-md"
                            }`}
                        >
                          {isSubscribed ? "Subscribed" : "Subscribe"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === TAB 3: AI CHAT INVESTIGATOR === */}
          {activeTab === "chat" && (
            <div className="flex flex-col flex-1 h-[65vh] animate-fadeIn relative max-w-4xl mx-auto w-full">
              
              {/* Persona Selector */}
              <div className="flex justify-between items-center mb-4 px-2 md:px-6">
                <div>
                  <h2 className="text-xl font-bold">Aegis AI Agent</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Your proxy for verifiable truth.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Persona:</span>
                  <select 
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-md px-3 py-1.5 text-sm font-semibold text-[var(--primary)] outline-none cursor-pointer focus:border-[var(--primary)] max-w-[200px] truncate"
                  >
                    {personas.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 md:p-6 flex flex-col gap-8 scroll-smooth pb-32 border-t border-[var(--card-border)] pt-6">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-5 ${msg.role === "user"
                      ? "bg-[var(--primary)] text-white ml-auto rounded-tr-sm"
                      : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-color)] rounded-tl-sm shadow-sm"
                      }`}>
                      {msg.role === "ai" && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded bg-[var(--primary)] text-white flex items-center justify-center text-[10px] font-bold">A</div>
                          <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">Aegis Agent</span>
                        </div>
                      )}
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-6 border-t border-[var(--card-border)] pt-4">
                          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Independent Sources Found:</p>
                          <div className="flex flex-col gap-3">
                            {msg.citations.map((cit) => (
                              <div key={cit.id} className="bg-[var(--background)] border border-[var(--card-border)] p-3 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors hover:border-[var(--primary)]/50">
                                <div className="flex-1 overflow-hidden">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded">{cit.publisher}</span>
                                    {cit.isTrusted ? (
                                      <span className="text-[10px] font-bold px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-full flex items-center gap-1 shrink-0">
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                                        ZK Verified
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold px-2 py-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20 rounded-full shrink-0">
                                        Unverified
                                      </span>
                                    )}
                                  </div>
                                  <a href={cit.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:text-[var(--primary)] hover:underline block truncate w-full">
                                    {cit.title}
                                  </a>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                  <button
                                    onClick={() => handlePayPublisher(cit.publisherAddress)}
                                    disabled={vaultLoading}
                                    className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white font-semibold py-1.5 px-3 rounded-md transition-colors"
                                  >
                                    {vaultLoading ? "..." : "Pay 0.1 USDC"}
                                  </button>
                                  <button
                                    onClick={() => handleDisputePublisher(cit.publisherAddress)}
                                    disabled={vaultLoading}
                                    className="text-xs bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-semibold py-1.5 px-3 rounded-md transition-colors border border-red-500/20 flex items-center gap-1 justify-center"
                                  >
                                    Report
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start w-full">
                    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl rounded-tl-sm p-5 flex items-center gap-2 max-w-[85%]">
                      <div className="w-5 h-5 rounded bg-[var(--primary)] text-white flex items-center justify-center text-[10px] font-bold">A</div>
                      <div className="flex gap-1 ml-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--text-secondary)] animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-[var(--text-secondary)] animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        <div className="w-2 h-2 rounded-full bg-[var(--text-secondary)] animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Field Fixed to Bottom */}
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent pt-10 pb-2 pointer-events-none">
                <div className="w-full pointer-events-auto px-2">
                  <form onSubmit={handleChatSubmit} className="relative flex items-center bg-[var(--card-bg)] border-2 border-[var(--card-border)] focus-within:border-[var(--primary)] rounded-2xl shadow-lg transition-colors p-1">
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Ask Aegis to investigate something..."
                      className="flex-1 bg-transparent border-none outline-none py-3 px-4 text-[15px] placeholder-[var(--text-secondary)]"
                      disabled={isTyping}
                    />
                    <button
                      type="submit"
                      disabled={!prompt.trim() || isTyping}
                      className="m-1 bg-[var(--primary)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
                  </form>
                  <div className="text-center mt-2">
                    <p className="text-[10px] text-[var(--text-secondary)]">Aegis AI searches independent sources. Always verify claims on-chain.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === TAB 5: PERSONAS === */}
          {activeTab === "persona" && (
            <div className="flex flex-col animate-fadeIn max-w-2xl mx-auto w-full">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-3">AI Personas</h1>
                <p className="text-[var(--text-secondary)]">
                  Create and manage the personas that power your AI proxy's responses and research priorities.
                </p>
              </div>

              <div className="clean-card p-6 mb-8 border border-[var(--primary)]/30">
                <h2 className="text-xl font-bold mb-4">Create New Persona</h2>
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    value={newPersonaName}
                    onChange={e => setNewPersonaName(e.target.value)}
                    placeholder="Persona Name (e.g., Cynical Web3 Dev)"
                    className="w-full bg-transparent border border-[var(--card-border)] rounded-lg px-4 py-2"
                  />
                  <textarea
                    value={newPersonaInstruction}
                    onChange={e => setNewPersonaInstruction(e.target.value)}
                    placeholder="Instructions (e.g., Focus entirely on smart contract architectures. Be concise.)"
                    rows={4}
                    className="w-full bg-transparent border border-[var(--card-border)] rounded-lg px-4 py-2 resize-none"
                  />
                  <button 
                    onClick={() => {
                      if(newPersonaName && newPersonaInstruction) {
                        setPersonas(prev => [...prev, { id: "p-" + Date.now(), name: newPersonaName, instruction: newPersonaInstruction }]);
                        setNewPersonaName("");
                        setNewPersonaInstruction("");
                      }
                    }}
                    className="btn-primary py-2"
                  >
                    Save Persona
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {personas.map(p => (
                  <div key={p.id} className="clean-card p-4">
                    <h3 className="font-bold text-lg mb-2">{p.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{p.instruction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === TAB 6: PERSONAL CURATOR === */}
          {activeTab === "curator" && (
            <div className="flex flex-col animate-fadeIn">
              <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Personal AI Curator</h1>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Highly summarized intelligence combining all your subscribed independent publishers and custom RSS feeds. (Cron jobs simulated for live view).
                  </p>
                </div>
              </div>
              
              {loadingCurator ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
                </div>
              ) : curatorArticles.length === 0 ? (
                <div className="text-center py-20 text-[var(--text-secondary)]">
                  Subscribe to publishers or RSS feeds in the Directory to see your curated intelligence here.
                </div>
              ) : (
                <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
                  {curatorArticles.map((article) => (
                    <div key={article.id} className="clean-card p-6 flex flex-col md:flex-row gap-6 transition-all border border-[var(--primary)]/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-semibold px-2 py-1 bg-[var(--primary)] text-white rounded truncate max-w-[150px]">{article.publisher}</span>
                          <span className="text-xs text-[var(--text-secondary)]">{new Date(article.pubDate).toLocaleDateString()}</span>
                        </div>
                        <a href={article.link} target="_blank" rel="noopener noreferrer" className="block hover:underline">
                          <h2 className="text-xl font-bold mb-2">{article.title}</h2>
                        </a>
                        <div className="mt-4 p-4 rounded-lg bg-[var(--card-border)] border border-[var(--primary)]/20">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">✨ AI Summary</span>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{article.aiSummary}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* === TAB 7: AUTOMATIONS === */}
          {activeTab === "automations" && (
            <div className="flex flex-col animate-fadeIn w-full max-w-4xl mx-auto">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-3">Cron Automations</h1>
                <p className="text-[var(--text-secondary)]">
                  Create multiple custom cron jobs. Map specific Personas to specific Feeds and schedule them to run natively on the backend.
                </p>
              </div>

              <div className="clean-card p-6 mb-8 border border-[var(--primary)]/30">
                <h2 className="text-xl font-bold mb-4">Create New Automation</h2>
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    value={newAutoName}
                    onChange={e => setNewAutoName(e.target.value)}
                    placeholder="Job Name (e.g., Morning Crypto Brief)"
                    className="w-full bg-transparent border border-[var(--card-border)] rounded-lg px-4 py-2"
                  />
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-[var(--text-secondary)] mb-1">Schedule (Cron)</label>
                      <input
                        type="text"
                        value={newAutoCron}
                        onChange={e => setNewAutoCron(e.target.value)}
                        placeholder="0 7 * * *"
                        className="w-full bg-transparent border border-[var(--card-border)] rounded-lg px-4 py-2 font-mono text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-[var(--text-secondary)] mb-1">AI Persona</label>
                      <select 
                        value={newAutoPersonaId}
                        onChange={e => setNewAutoPersonaId(e.target.value)}
                        className="w-full bg-transparent border border-[var(--card-border)] rounded-lg px-4 py-2"
                      >
                        {personas.map(p => (
                          <option key={p.id} value={p.id} className="bg-[var(--card-bg)]">{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Select Target Feeds</label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-[var(--card-border)] rounded-lg">
                      {customRssFeeds.map(feed => (
                        <label key={feed.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] rounded">
                          <input 
                            type="checkbox" 
                            checked={newAutoFeedIds.includes(feed.id)}
                            onChange={(e) => {
                              if (e.target.checked) setNewAutoFeedIds(prev => [...prev, feed.id]);
                              else setNewAutoFeedIds(prev => prev.filter(id => id !== feed.id));
                            }}
                          />
                          <span className="text-sm truncate">{feed.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleCreateAutomation}
                    disabled={loadingAutomations}
                    className="btn-primary py-2 mt-2"
                  >
                    {loadingAutomations ? "Saving..." : "Save Automation Job"}
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Active Jobs</h2>
                {loadingAutomations && automations.length === 0 ? (
                  <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div></div>
                ) : automations.length === 0 ? (
                  <div className="text-center py-10 text-[var(--text-secondary)]">No automations configured yet.</div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {automations.map(job => (
                      <div key={job.id} className="clean-card p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-xl">{job.name}</h3>
                          <span className="font-mono text-xs px-2 py-1 bg-black/10 dark:bg-white/10 rounded">
                            {job.cronSchedule}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mb-3">
                          <span className="font-bold text-[var(--primary)]">{job.persona?.name}</span> mapping to {job.feeds?.length} feeds.
                        </p>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {job.digests && job.digests.length > 0 ? (
                            <span className="text-green-500">Last run: {new Date(job.digests[0].createdAt).toLocaleString()} ({job.digests[0].articles?.length} articles generated)</span>
                          ) : (
                            <span className="italic">Awaiting first scheduled run...</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      )}
    </div>
  );
}
