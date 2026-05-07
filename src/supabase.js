import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig, isSupabaseConfigured } from "./authHelpers.js";

const supabaseConfig = getSupabaseConfig(import.meta.env);
const supabaseReady = isSupabaseConfigured(supabaseConfig);

export const supabase = supabaseReady
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const isAuthConfigured = supabaseReady;
