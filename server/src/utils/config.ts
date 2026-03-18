import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3001,
    supabase: {
        url: process.env.SUPABASE_URL || '',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
    },
    firecrawl: {
        apiKey: process.env.FIRECRAWL_API_KEY || '',
    }
};