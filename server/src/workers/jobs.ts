import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../utils/config';
import { runScrapeJob } from './scraperService';

// Initialize Redis connection
const connection = new IORedis(config.redis.url, {
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null
});

// Configure Queue
export const scrapeQueue = new Queue('scrape-jobs', { connection: connection as any });

// Configure Worker
export const scrapeWorker = new Worker(
    'scrape-jobs',
    async (job) => {
        console.log(`[Worker] Started job ${job.id} for agent ${job.data.agentId}`);
        try {
            await runScrapeJob(job.data.agentId, job.data.url);
            console.log(`[Worker] Finished job ${job.id}`);
        } catch (error) {
            console.error(`[Worker] Job ${job.id} failed:`, error);
            throw error;
        }
    },
    { connection: connection as any }
);

scrapeWorker.on('completed', (job) => {
    console.log(`Job ${job.id} has completed!`);
});

scrapeWorker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} has failed with ${err.message}`);
});
