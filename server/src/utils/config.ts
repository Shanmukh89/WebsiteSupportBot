import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3001,
    supabase: {
        url: process.env.SUPABASE_URL || '',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
    },
    firecrawl: {
        apiKey: process.env.FIRECRAWL_API_KEY || '',
    }
};
