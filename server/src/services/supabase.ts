import { createClient } from '@supabase/supabase-js';
import { config } from '../utils/config';

// Initialize Supabase with the Service Role Key so the backend can bypass RLS 
// when managing chunks and background scraping tasks.
export const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
