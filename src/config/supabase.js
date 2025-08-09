import { createClient } from '@supabase/supabase-js'

console.log('🔧 Loading Supabase configuration...');

// SECURITY NOTE: These environment variables are client-side visible
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required for Supabase client
// CRITICAL: Ensure ALL database tables have Row Level Security (RLS) enabled
// and proper policies that restrict access to auth.uid() = user_id only
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Supabase Config Check:', {
  url: supabaseUrl ? 'Present' : 'Missing',
  key: supabaseAnonKey ? 'Present' : 'Missing',
  urlLength: supabaseUrl ? supabaseUrl.length : 0,
  keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0
})

let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables. Configure in Netlify Site Settings.');
  console.warn('⚠️ Creating mock Supabase client for development');
  
  supabase = {
    auth: {
      signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => ({ data: { user: null } }),
      onAuthStateChange: () => ({ data: { subscription: null } })
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      insert: () => Promise.resolve({ error: null }),
      update: () => Promise.resolve({ error: null }),
      delete: () => Promise.resolve({ error: null })
    })
  };
} else {
  console.log('✅ Creating real Supabase client');
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

export { supabase };