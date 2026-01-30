import { createClient } from '@supabase/supabase-js';

// Fallback to hardcoded URL if env var is missing or invalid in certain contexts,
// but prefer env var. Ensure it starts with https://
const getSupabaseUrl = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (envUrl && envUrl.startsWith('http')) return envUrl;
  return 'https://gxcwaufhbmygixnssifv.supabase.co';
};

const getSupabaseKey = () => {
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envKey) return envKey;
  // Hardcoded fallback for immediate fix if env loading fails
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4Y3dhdWZoYm15Z2l4bnNzaWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODc0NjYsImV4cCI6MjA4NTM2MzQ2Nn0.gl2Q-PZ83shdlsTht6khPiy4p_2GVl_-shkCU_XzEIk';
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseKey();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
