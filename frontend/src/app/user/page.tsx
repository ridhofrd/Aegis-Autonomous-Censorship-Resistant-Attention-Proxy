"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { isAllowed, setAllowed, requestAccess } from "@stellar/freighter-api";
import { useTheme } from "@/components/ThemeProvider";

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
}

interface Citation {
  id: string;
  publisher: string;
  domain: string;
  url: string;
  title: string;
  isTrusted: boolean;
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
}

const MOCK_PUBLISHERS: PublisherProfile[] = [
  { id: "pub-1", name: "CipherBlog", domain: "cipherblog.net", topics: ["Tech", "Privacy"], isTrusted: true, description: "Independent analysis on surveillance and data rights." },
  { id: "pub-2", name: "OnChain Observer", domain: "onchainobserver.io", topics: ["Finance", "Crypto"], isTrusted: true, description: "Uncovering institutional flows in decentralized markets." },
  { id: "pub-3", name: "Decentralized Post", domain: "dpost.org", topics: ["Politics", "Tech"], isTrusted: true, description: "Grassroots impacts of technological policy changes." },
  { id: "pub-4", name: "Whistleblower X", domain: "anon-leak.net", topics: ["Politics", "Privacy"], isTrusted: false, description: "Anonymous drops of regulatory internal memos." },
  { id: "pub-5", name: "ZeroKnowledge News", domain: "zkn.dev", topics: ["Crypto", "Tech"], isTrusted: true, description: "The premier source for ZK rollups and cryptography." },
  { id: "pub-6", name: "Alt-Finance Daily", domain: "altfin.co", topics: ["Finance", "Politics"], isTrusted: true, description: "Deep dives into macroeconomic shifts and alternative assets." },
];

const TOPICS = ["All", "Tech", "Privacy", "Finance", "Crypto", "Politics"];

export default function UnifiedDashboard() {
  const { theme, toggleTheme } = useTheme();
  
  // Wallet State
  const [publicKey, setPublicKey] = useState<string | null>(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState<"feed" | "chat" | "directory">("feed");

  // Feed State
  const [provider, setProvider] = useState<string>("nytimes");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  // Chat State
  const [prompt, setPrompt] = useState("");
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

  // Chat scroll logic
  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, activeTab]);

  // Feed fetching logic
  useEffect(() => {
    if (!publicKey || activeTab !== "feed") return;

    async function fetchNews() {
      setLoadingFeed(true);
      try {
        const res = await fetch(`/api/news?provider=${provider}`);
        const data = await res.json();
        if (data.articles) setArticles(data.articles);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingFeed(false);
      }
    }
    fetchNews();
  }, [publicKey, provider, activeTab]);

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
        body: JSON.stringify({ prompt: userMessage })
      });
      const data = await res.json();
      
      if (data.reply) {
        setMessages((prev) => [
          ...prev, 
          { role: "ai", content: data.reply, citations: data.citations }
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

  const handlePayPublisher = (pub: string) => {
    alert(`Mock: Sending 0.1 USDC to ${pub} via your Attention Vault!`);
  };

  const toggleSubscription = (pubId: string) => {
    setSubscribedIds((prev) => 
      prev.includes(pubId) ? prev.filter(id => id !== pubId) : [...prev, pubId]
    );
  };

  const filteredPublishers = activeTopic === "All" 
    ? MOCK_PUBLISHERS 
    : MOCK_PUBLISHERS.filter(pub => pub.topics.includes(activeTopic));

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
            <div className="flex bg-[var(--card-border)] rounded-full p-1 shadow-sm overflow-x-auto">
              <button 
                onClick={() => setActiveTab("feed")}
                className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all whitespace-nowrap ${activeTab === "feed" ? "bg-[var(--primary)] text-white shadow-md" : "text-[var(--text-color)] hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"}`}
              >
                Curated Feed
              </button>
              <button 
                onClick={() => setActiveTab("directory")}
                className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all whitespace-nowrap ${activeTab === "directory" ? "bg-[var(--primary)] text-white shadow-md" : "text-[var(--text-color)] hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"}`}
              >
                Publishers Directory
              </button>
              <button 
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full transition-all whitespace-nowrap ${activeTab === "chat" ? "bg-[var(--primary)] text-white shadow-md" : "text-[var(--text-color)] hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"}`}
              >
                ✨ AI Investigator
              </button>
            </div>
          </div>

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
                        <button onClick={() => handlePayPublisher(article.publisher)} className="btn-primary w-full flex justify-center items-center gap-2">
                          Pay 0.1 USDC
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
                      className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                        activeTopic === topic 
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
                          onClick={() => toggleSubscription(pub.id)}
                          className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 ${
                            isSubscribed 
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
                            "Subscribe"
                          )}
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
              <div className="flex-1 overflow-y-auto p-2 md:p-6 flex flex-col gap-8 scroll-smooth pb-32">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-5 ${
                      msg.role === "user" 
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
                                <button 
                                  onClick={() => handlePayPublisher(cit.publisher)}
                                  className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white font-semibold py-1.5 px-3 rounded-md transition-colors shrink-0"
                                >
                                  Pay 0.1 USDC
                                </button>
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

        </main>
      )}
    </div>
  );
}
