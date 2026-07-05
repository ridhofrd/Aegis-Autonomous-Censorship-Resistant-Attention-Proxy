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
    const urlsParam = searchParams.get("urls");
    const providerKey = searchParams.get("provider") || "nytimes";

    let feedsToParse: { url: string, name: string, domain: string }[] = [];

    if (urlsParam) {
      // Parse custom URLs
      const urls = urlsParam.split(",");
      feedsToParse = urls.map(url => {
        try {
          const domain = new URL(url).hostname;
          return { url, name: domain, domain };
        } catch {
          return { url, name: "RSS Feed", domain: "rss" };
        }
      });
    } else {
      const provider = PROVIDERS[providerKey];
      if (!provider) {
        return NextResponse.json({ error: "Invalid provider selected." }, { status: 400 });
      }
      feedsToParse = [provider];
    }

    let allArticles: any[] = [];

    await Promise.all(feedsToParse.map(async (provider) => {
      try {
        const feed = await parser.parseURL(provider.url);
        const articles = feed.items.slice(0, 8).map(item => ({
          id: item.guid || item.link || Math.random().toString(),
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          contentSnippet: item.contentSnippet || "No description available.",
          publisher: provider.name,
          domain: provider.domain
        }));
        allArticles.push(...articles);
      } catch (e) {
        console.error(`Failed to parse feed ${provider.url}`, e);
      }
    }));

    // Sort combined articles by date
    allArticles.sort((a, b) => {
      const dateA = new Date(a.pubDate || 0).getTime();
      const dateB = new Date(b.pubDate || 0).getTime();
      return dateB - dateA;
    });

    // 2. Fetch IPFS hashes from local DB
    const { prisma } = await import("@/lib/prisma");
    const dbArticles = await prisma.article.findMany({
      where: {
        link: { in: allArticles.map(a => a.link) },
        ipfsHash: { not: null }
      },
      select: { link: true, ipfsHash: true }
    });

    const ipfsMap = new Map(dbArticles.map(a => [a.link, a.ipfsHash]));

    // 3. Mock AI Filtering Layer
    const aiFilteredArticles = allArticles.map(article => ({
      ...article,
      aiSummary: `AI Summary: ${article.contentSnippet?.substring(0, 150)}... This article discusses recent events with high factual consistency.`,
      qualityScore: Math.floor(Math.random() * 15) + 85, // 85-99 Score
      isTrusted: true, // 3. Mock Web3 Trust
      ipfsHash: ipfsMap.get(article.link) || null
    }));

    return NextResponse.json({ articles: aiFilteredArticles });
  } catch (error) {
    console.error("RSS Parsing Error:", error);
    return NextResponse.json({ error: "Failed to fetch news feed." }, { status: 500 });
  }
}
