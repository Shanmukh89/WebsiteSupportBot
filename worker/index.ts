import { Worker } from "bullmq";
import Redis from "ioredis";
import { runScrapeJob } from "./scraperService";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

console.log("Starting Railway Worker...");

const scrapeWorker = new Worker(
  "scrapeQueue",
  async (job) => {
    const { agentId, url } = job.data;
    console.log(`[Job ${job.id}] Processing scrape for ${url} (Agent: ${agentId})`);
    await runScrapeJob(agentId, url);
  },
  { connection }
);

scrapeWorker.on("completed", (job) => {
  console.log(`[Job ${job.id}] Completed successfully`);
});

scrapeWorker.on("failed", (job, err) => {
  console.log(`[Job ${job?.id}] Failed: ${err.message}`);
});

console.log("Scrape worker is listening for jobs on 'scrapeQueue'...");
