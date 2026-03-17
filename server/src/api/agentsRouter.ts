import { Router } from 'express';
import { scrapeQueue } from '../workers/jobs';

const router = Router();

// POST /api/agents/scrape
// Enqueue a scraping job for a new agent
router.post('/scrape', async (req, res) => {
    const { agentId, url } = req.body;

    if (!agentId || !url) {
        return res.status(400).json({ error: 'agentId and url are required' });
    }

    try {
        const job = await scrapeQueue.add('scrape-store', {
            agentId,
            url
        });

        res.status(202).json({
            message: 'Scrape job enqueued successfully',
            jobId: job.id
        });
    } catch (error: any) {
        console.error('Failed to enqueue job:', error);
        res.status(500).json({ error: 'Failed to enqueue scrape job' });
    }
});

export default router;
