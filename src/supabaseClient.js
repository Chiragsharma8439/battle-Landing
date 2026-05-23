import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verify that the environment variables are set before initializing
const isConfigured = supabaseUrl && 
                     supabaseAnonKey && 
                     !supabaseUrl.includes('your-project-id') && 
                     !supabaseAnonKey.includes('your-public-anon-key');

if (!isConfigured) {
  console.warn(
    'Supabase: Cloud database credentials are not configured in the .env file. ' +
    'Signups will fallback to local simulated mode. ' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file to enable secure live database synchronization.'
  );
}

export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isConfigured ? supabaseAnonKey : 'placeholder-anon-key'
);

export const isSupabaseConfigured = isConfigured;
