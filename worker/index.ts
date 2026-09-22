import { Worker } from "bullmq";
import Redis from "ioredis";
import http from "http";
import { runScrapeJob } from "./scraperService";

function formatRedisUrl(rawUrl: string | undefined): string {
  if (!rawUrl) return "redis://localhost:6379";
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith("redis://") || trimmed.startsWith("rediss://")) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `rediss:${trimmed}`;
  }
  return `rediss://${trimmed}`;
}

const redisUrl = formatRedisUrl(process.env.REDIS_URL);
const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

console.log("Starting Worker...");

// Lightweight HTTP server for platform health checks (Render, Koyeb, etc.)
const port = Number(process.env.PORT) || 8080;
http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Ragify Worker is running OK\n");
  })
  .listen(port, "0.0.0.0", () => {
    console.log(`Health check server listening on 0.0.0.0:${port}`);
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
  console.log(`[Job ${job?.id}] Failed: ${err?.message}`);
});

scrapeWorker.on("error", (err) => {
  console.error("Worker error:", err.message);
});

console.log("Scrape worker is listening for jobs on 'scrapeQueue'...");
