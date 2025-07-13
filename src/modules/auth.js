import { supabase } from '../config/supabase.js';

export class AuthManager {
  constructor() {
    this.currentUser = null;
    this.initializeAuth();
  }

  async initializeAuth() {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      this.currentUser = session.user;
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        this.currentUser = session.user;
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
      }
    });
  }

  async login(username, password) {
    try {
      // First, try to find the user by username
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (profileError || !profiles) {
        console.error('User not found:', profileError);
        return false;
      }

      // Get the user's email from auth.users
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(profiles.id);
      
      if (userError || !user) {
        console.error('Error getting user email:', userError);
        return false;
      }

      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      this.currentUser = data.user;
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async register(username, password) {
    try {
      // Check if username already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingProfile) {
        console.error('Username already exists');
        return false;
      }

      // Create a temporary email for the user (since we're using username-based auth)
      const email = `${username}@finzn.local`;

      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        console.error('Registration error:', error);
        return false;
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            username: username,
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          return false;
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  }

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      this.currentUser = null;
      
      // Reload the page to reset the application state
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  getCurrentUser() {
    return this.currentUser?.id || null;
  }

  async getCurrentUsername() {
    if (!this.currentUser) return null;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('id', this.currentUser.id)
        .single();

      if (error) {
        console.error('Error getting username:', error);
        return null;
      }

      return data?.username || null;
    } catch (error) {
      console.error('Error getting username:', error);
      return null;
    }
  }

  isAuthenticated() {
    return !!this.currentUser;
  }
}