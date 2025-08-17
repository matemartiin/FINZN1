import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Missing Supabase environment variables - using mock mode:', {
    url: supabaseUrl ? 'Present' : 'Missing',
    key: supabaseAnonKey ? 'Present' : 'Missing'
  });
  
  // Create mock client for development
  supabase = {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: { message: 'Mock mode - no database' } }),
      update: () => ({ data: null, error: { message: 'Mock mode - no database' } }),
      delete: () => ({ data: null, error: { message: 'Mock mode - no database' } }),
      eq: function() { return this; },
      gte: function() { return this; },
      lte: function() { return this; },
      order: function() { return this; },
      single: function() { return this; }
    }),
    auth: {
      getUser: () => ({ data: { user: null }, error: null }),
      signIn: () => ({ data: null, error: { message: 'Mock mode' } }),
      signOut: () => ({ error: null })
    }
  };
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    console.log('✅ Supabase client initialized successfully');
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error);
    // Fallback to mock mode
    supabase = null;
  }
}

export { supabase };