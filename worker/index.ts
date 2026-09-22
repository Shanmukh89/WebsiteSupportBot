import { Worker } from "bullmq";
import Redis from "ioredis";
import http from "http";
import { runScrapeJob } from "./scraperService";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

console.log("Starting Worker...");

// Lightweight HTTP server for platform health checks (Render, Koyeb, etc.)
const port = process.env.PORT || 8080;
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Ragify Worker is running OK\n");
}).listen(port, () => {
  console.log(`Health check server listening on port ${port}`);
});

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
