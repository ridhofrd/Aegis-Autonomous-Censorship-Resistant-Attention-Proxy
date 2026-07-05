import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

const PROVIDERS: Record<string, { url: string; name: string; domain: string }> = {
  nytimes: {
    url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    name: "New York Times",
    domain: "nytimes.com",
  },
  bbc: {
    url: "http://feeds.bbci.co.uk/news/world/rss.xml",
    name: "BBC News",
    domain: "bbc.co.uk",
  },
  coindesk: {
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    name: "CoinDesk",
    domain: "coindesk.com",
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerKey = searchParams.get("provider") || "nytimes";
    
    const provider = PROVIDERS[providerKey];
    if (!provider) {
      return NextResponse.json({ error: "Invalid provider selected." }, { status: 400 });
    }

    const feed = await parser.parseURL(provider.url);
    
    // 1. RSS Scraping
    const articles = feed.items.slice(0, 8).map(item => ({
      id: item.guid || item.link || Math.random().toString(),
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      contentSnippet: item.contentSnippet || "No description available.",
      publisher: provider.name,
      domain: provider.domain
    }));
    
    // 2. Mock AI Filtering Layer
    const aiFilteredArticles = articles.map(article => ({
      ...article,
      aiSummary: `AI Summary: ${article.contentSnippet?.substring(0, 150)}... This article discusses recent events with high factual consistency.`,
      qualityScore: Math.floor(Math.random() * 15) + 85, // 85-99 Score
      isTrusted: true // 3. Mock Web3 Trust
    }));
    
    return NextResponse.json({ articles: aiFilteredArticles });
  } catch (error) {
    console.error("RSS Parsing Error:", error);
    return NextResponse.json({ error: "Failed to fetch news feed." }, { status: 500 });
  }
}
