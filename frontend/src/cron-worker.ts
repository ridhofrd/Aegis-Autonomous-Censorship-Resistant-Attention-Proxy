import cron from 'node-cron';
import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

console.log("🟢 Starting Local Cron Worker...");

// This master cron runs every minute to check for pending jobs
cron.schedule('* * * * *', async () => {
  console.log(`[${new Date().toISOString()}] Checking for scheduled automations...`);
  
  try {
    const jobs = await prisma.automationJob.findMany({
      include: {
        persona: true,
        feeds: true
      }
    });

    if (jobs.length === 0) {
      console.log("No automation jobs configured.");
      return;
    }

    // In a production environment, we would parse the cronSchedule
    // and check if it matches the current minute.
    // For this prototype, we'll just log the active jobs.
    
    for (const job of jobs) {
      console.log(`\n⚙️  Evaluating Job: [${job.name}]`);
      console.log(`   Schedule: ${job.cronSchedule}`);
      console.log(`   Persona: ${job.persona.name}`);
      console.log(`   Feeds: ${job.feeds.map(f => f.name).join(', ')}`);
      // Here we would trigger the RSS scrape + AI summarization logic
      // and write the JobDigest to the DB.
    }

  } catch (error) {
    console.error("Cron worker error:", error);
  }
});
