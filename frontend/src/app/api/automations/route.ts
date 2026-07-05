import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const automations = await prisma.automationJob.findMany({
      include: {
        persona: true,
        feeds: true,
        digests: {
          include: { articles: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ automations });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, cronSchedule, persona, feeds } = body;

    // 1. Upsert Persona
    const dbPersona = await prisma.persona.create({
      data: {
        name: persona.name,
        instruction: persona.instruction
      }
    });

    // 2. Upsert Feeds
    const dbFeeds = await Promise.all(
      feeds.map(async (feed: any) => {
        return prisma.rssFeed.create({
          data: {
            name: feed.name,
            url: feed.url
          }
        });
      })
    );

    // 3. Create Automation Job
    const job = await prisma.automationJob.create({
      data: {
        name,
        cronSchedule,
        personaId: dbPersona.id,
        feeds: {
          connect: dbFeeds.map(f => ({ id: f.id }))
        }
      },
      include: {
        persona: true,
        feeds: true
      }
    });

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
