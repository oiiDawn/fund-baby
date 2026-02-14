import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const createNoopChannel = () => {
    const channel: Record<string, unknown> = {
        on: () => channel,
        subscribe: () => channel
    };
    return channel;
};

const createNoopTable = () => {
    return {
        select: () => ({
            eq: () => ({
                maybeSingle: async () => ({ data: null, error: { message: 'Supabase not configured' } })
            })
        }),
        insert: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        upsert: () => ({
            select: async () => ({ data: null, error: { message: 'Supabase not configured' } })
        })
    };
};

const createNoopSupabase = () => ({
    auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({
            data: { subscription: { unsubscribe: () => { } } }
        }),
        signInWithOtp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        verifyOtp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null })
    },
    from: () => createNoopTable(),
    channel: () => createNoopChannel(),
    removeChannel: () => { }
});

export const supabase: SupabaseClient = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
}) : createNoopSupabase() as unknown as SupabaseClient;
