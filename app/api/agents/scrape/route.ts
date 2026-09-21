import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Queue } from "bullmq";
import Redis from "ioredis";

// Initialize Redis and BullMQ
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
const scrapeQueue = new Queue("scrapeQueue", { connection });

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { agentId, url } = await req.json();

    if (!agentId || !url) {
      return NextResponse.json({ error: "Agent ID and URL are required" }, { status: 400 });
    }

    // Enqueue the scraping job
    await scrapeQueue.add("scrape", { agentId, url });

    return NextResponse.json({ message: "Scraping job enqueued successfully" });
  } catch (error) {
    console.error("POST /api/agents/scrape error:", error);
    return NextResponse.json({ error: "Failed to enqueue scrape job" }, { status: 500 });
  }
}
