import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const publishers = await prisma.publisherFeed.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ publishers });
  } catch (error: any) {
    console.error("Failed to get publishers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { walletAddress, name, rssUrl, topics } = await req.json();
    
    if (!walletAddress || !name || !rssUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const publisher = await prisma.publisherFeed.create({
      data: {
        walletAddress,
        name,
        rssUrl,
        topics: topics || "General",
      }
    });

    return NextResponse.json({ success: true, publisher });
  } catch (error: any) {
    console.error("Failed to register publisher:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
