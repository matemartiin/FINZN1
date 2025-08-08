import { createClient } from '@supabase/supabase-js'

console.log('🔧 Loading Supabase configuration...');

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
  console.error('❌ Missing Supabase environment variables:', {
    url: supabaseUrl,
    key: supabaseAnonKey ? 'Present' : 'Missing'
  });
  console.warn('⚠️ Creating mock Supabase client for development');
  
  supabase = {
    auth: {
      signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => ({ data: { user: null } }),
      onAuthStateChange: (callback) => {
        // Return a proper subscription object with unsubscribe method
        return {
          data: {
            subscription: {
              unsubscribe: () => console.log('Mock auth state change unsubscribed')
            }
          }
        };
      }
    },
    from: () => ({
      select: (columns = '*') => ({
        eq: (column, value) => ({
          single: () => Promise.resolve({ data: null, error: null }),
          order: (column, options) => Promise.resolve({ data: [], error: null }),
          limit: (count) => Promise.resolve({ data: [], error: null }),
          gte: (column, value) => Promise.resolve({ data: [], error: null }),
          lte: (column, value) => Promise.resolve({ data: [], error: null }),
          in: (column, values) => Promise.resolve({ data: [], error: null }),
          maybeSingle: () => Promise.resolve({ data: null, error: null })
        }),
        order: (column, options) => Promise.resolve({ data: [], error: null }),
        limit: (count) => Promise.resolve({ data: [], error: null })
      }),
      insert: () => Promise.resolve({ error: null }),
      update: (data) => ({
        eq: (column, value) => ({
          select: () => Promise.resolve({ data: [], error: null })
        })
      }),
      delete: () => ({
        eq: (column, value) => Promise.resolve({ error: null })
      }),
      upsert: (data, options) => ({
        select: () => Promise.resolve({ data: [], error: null })
      })
    }),
    rpc: (functionName, params) => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
  };
} else {
  console.log('✅ Creating real Supabase client');
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    
    // Test the connection
    const { error: testError } = await supabase.auth.getSession();
    if (testError) {
      console.warn('⚠️ Supabase connection test failed:', testError.message);
    } else {
      console.log('✅ Supabase connection test successful');
    }
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    console.warn('⚠️ Falling back to mock client');
    
    // Fallback to mock client if real client creation fails
    supabase = {
      auth: {
        signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase connection failed' } }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase connection failed' } }),
        signOut: () => Promise.resolve({ error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => ({ data: { user: null } }),
        onAuthStateChange: (callback) => ({
          data: {
            subscription: {
              unsubscribe: () => console.log('Mock auth state change unsubscribed')
            }
          }
        })
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        insert: () => Promise.resolve({ error: null }),
        update: () => Promise.resolve({ error: null }),
        delete: () => Promise.resolve({ error: null })
      })
    };
  }
}

export { supabase };