import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { article } = await req.json();

    if (!article || !article.id) {
      return NextResponse.json({ error: "Missing article data" }, { status: 400 });
    }

    // 1. Simulate generating an IPFS CID (Content Identifier)
    // In production, we'd send the content to an IPFS node (e.g., via Pinata)
    // Here we generate a mock CID starting with 'Qm' (IPFS CIDv0 format)
    const mockCid = "Qm" + Buffer.from(article.title + Date.now()).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 44);

    // 2. We check if this article already exists in the local DB.
    // If not (e.g. it was dynamically fetched from RSS), we save it to DB with the ipfsHash.
    // Since we made jobDigestId optional, we can create an independent Article record.
    
    // First, check if it exists:
    const existing = await prisma.article.findFirst({
      where: { title: article.title, link: article.link }
    });

    if (existing) {
      await prisma.article.update({
        where: { id: existing.id },
        data: { ipfsHash: mockCid }
      });
    } else {
      await prisma.article.create({
        data: {
          title: article.title,
          link: article.link,
          pubDate: article.pubDate || new Date().toISOString(),
          contentSnippet: article.contentSnippet,
          publisher: article.publisher,
          domain: article.domain,
          aiSummary: article.aiSummary || "Indexed by Publisher manually.",
          ipfsHash: mockCid,
        }
      });
    }

    return NextResponse.json({ success: true, ipfsHash: mockCid });
  } catch (error: any) {
    console.error("IPFS Pin Error:", error);
    return NextResponse.json({ error: "Failed to pin to IPFS" }, { status: 500 });
  }
}
