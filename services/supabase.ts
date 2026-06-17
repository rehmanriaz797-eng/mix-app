
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hveabsygyvlpfvmoudyx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ZWFic3lneXZscGZ2bW91ZHl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNzQ4OTAsImV4cCI6MjA4MDY1MDg5MH0.xEOkdW4_nWDGVYMEEVHTZVeYELE7IMuMuSNWe-XJAGs';

// Fix: Exporting isSupabaseConfigured helper which is used to detect if the platform has valid API credentials
export const isSupabaseConfigured = () => {
    return !!SUPABASE_URL && !!SUPABASE_ANON_KEY && !SUPABASE_URL.includes('REPLACE_WITH');
};

// Defensive initialization
let supabaseInstance: any;
try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        realtime: { params: { eventsPerSecond: 10 } },
        auth: { persistSession: true, autoRefreshToken: true }
    });
} catch (e) {
    console.warn("Supabase initialization failed. Running in Decentralized Local Mode.");
    // Mock client for failover
    supabaseInstance = {
        auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) },
        from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }), order: () => Promise.resolve({ data: [] }) }) }),
        storage: { from: () => ({ upload: async () => ({ error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
        channel: () => ({ on: () => ({ subscribe: () => {} }), subscribe: () => {} })
    };
}

export const supabase = supabaseInstance;
export const BUCKETS = {
    VIDEO: 'video-bucket',
    SHORTS: 'shorts-bucket',
    THUMB: 'thumbnail-bucket',
    TEMP: 'temp-processing-bucket'
};
