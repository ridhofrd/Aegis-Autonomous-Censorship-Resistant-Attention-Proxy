import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt, persona } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    // MOCK LLM LOGIC: 
    // In production, this would use a real LLM + RAG to crawl independent web sources.

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Determine context based on keywords to make the mock feel dynamic
    const lowercasePrompt = prompt.toLowerCase();

    let responseText = "";
    let citations = [];

    // Base persona framing
    let personaPrefix = "";
    if (persona === "Privacy Advocate") {
      personaPrefix = "[Privacy Advocate Mode]: Analyzing sources through the lens of data sovereignty and surveillance resistance... ";
    } else if (persona === "On-Chain Verifier") {
      personaPrefix = "[On-Chain Verifier Mode]: Prioritizing hard blockchain data and cryptographically signed journalism over narrative... ";
    } else {
      personaPrefix = "[Standard Investigator]: Gathering diverse independent viewpoints... ";
    }

    if (lowercasePrompt.includes("privacy") || lowercasePrompt.includes("regulation") || lowercasePrompt.includes("tech")) {
      responseText = personaPrefix + "Independent journalists and whistleblowers are reporting significant concerns regarding the new tech privacy regulations. While mainstream outlets have framed it as a security enhancement, several decentralized tech advocates and independent researchers argue it introduces surveillance backdoors. According to leaked documents analyzed by independent researchers, the enforcement mechanisms bypass traditional judicial oversight.";
      citations = [
        {
          id: "cit-1",
          publisher: "CipherBlog (Independent)",
          domain: "cipherblog.net",
          url: "https://example.com/cipherblog-privacy",
          title: "The Surveillance Backdoor in New Tech Regs",
          isTrusted: true // Checked on-chain via ZK Proof
        },
        {
          id: "cit-2",
          publisher: "DataRights Watch",
          domain: "datarights.org",
          url: "https://example.com/datarights",
          title: "Analysis of Leaked Draft Framework",
          isTrusted: true
        }
      ];
    } else if (lowercasePrompt.includes("finance") || lowercasePrompt.includes("crypto") || lowercasePrompt.includes("market")) {
      responseText = personaPrefix + "On-chain analysts are observing a divergence between mainstream financial reporting and actual blockchain activity. Independent researchers have noted that institutional accumulation of digital assets is happening quietly off-exchange, contradicting the bearish sentiment pushed by major financial networks. Furthermore, a recent whistleblower report from a mid-sized exchange indicates regulatory pressure is being applied unevenly.";
      citations = [
        {
          id: "cit-3",
          publisher: "OnChain Observer",
          domain: "onchainobserver.io",
          url: "https://example.com/onchain",
          title: "Institutional OTC Accumulation Data",
          isTrusted: true
        },
        {
          id: "cit-4",
          publisher: "Whistleblower X",
          domain: "anon-leak.net",
          url: "https://example.com/anon-leak",
          title: "Internal Memos on Regulatory Pressure",
          isTrusted: false // Unverified on the Trust Registry
        }
      ];
    } else {
      responseText = personaPrefix + "I've scoured independent blogs, decentralized networks, and alternative news sources regarding your query. The general consensus from independent researchers highlights details that major networks are omitting. The focus remains on grassroots impacts rather than top-down institutional narratives.";
      citations = [
        {
          id: "cit-5",
          publisher: "Decentralized Post",
          domain: "dpost.org",
          url: "https://example.com/dpost",
          title: "Grassroots Impacts on Alternative Networks",
          isTrusted: true
        }
      ];
    }

    return NextResponse.json({
      reply: responseText,
      citations: citations
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to process chat." }, { status: 500 });
  }
}
