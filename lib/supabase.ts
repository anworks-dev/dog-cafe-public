import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function readEnv(value: string | undefined): string {
  if (!value) return "";
  return value.trim().replace(/^['"]|['"]$/g, "");
}

const supabaseUrl = readEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = readEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

let client: SupabaseClient | null = null;

/**
 * Read-only anon client for the public site.
 * RLS restricts anon to published shops / approved reviews / visible photos.
 */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
