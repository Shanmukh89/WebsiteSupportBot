import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { config } from './utils/config';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

import agentsRouter from './api/agentsRouter';
import chatRouter from './api/chatRouter';

app.use('/api/agents', agentsRouter);
app.use('/api/chat', chatRouter);

// Basic health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(config.port, () => {
    console.log(`[Backend API] Server is running on port ${config.port}`);
});
