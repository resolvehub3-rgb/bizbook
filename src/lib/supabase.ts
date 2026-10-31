import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or localStorage override for dynamic configuration
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function getStoredSupabaseConfig() {
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('supabase_project_url') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('supabase_anon_key') : null;

  const url = (envUrl && envUrl !== 'https://your-project.supabase.co' ? envUrl : localUrl) || '';
  const anonKey = (envAnonKey && envAnonKey !== 'your-anon-key-here' ? envAnonKey : localKey) || '';

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey && url.startsWith('http')),
  };
}

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getStoredSupabaseConfig();
  if (!isConfigured) return null;

  if (!clientInstance) {
    clientInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return clientInstance;
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase_project_url', url.trim());
    localStorage.setItem('supabase_anon_key', anonKey.trim());
    clientInstance = null; // Re-create on next getSupabase()
  }
}

export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('supabase_project_url');
    localStorage.removeItem('supabase_anon_key');
    clientInstance = null;
  }
}
