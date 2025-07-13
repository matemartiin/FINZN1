import { supabase } from '../config/supabase.js';

export class AuthManager {
  constructor() {
    this.currentUser = null;
    this.initializeAuth();
  }

  async initializeAuth() {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    this.currentUser = session?.user || null;

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      this.currentUser = session?.user || null;
      
      if (event === 'SIGNED_OUT') {
        // Clear any cached data
        this.clearUserData();
        // Reload the page to reset application state
        window.location.reload();
      }
    });
  }

  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
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

  async register(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        console.error('Registration error:', error);
        return false;
      }

      // For email confirmation disabled, user should be immediately available
      if (data.user && !data.user.email_confirmed_at) {
        // Auto-confirm for development (this would normally require email confirmation)
        console.log('User registered successfully');
      }

      return true;
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
      
      this.clearUserData();
      this.currentUser = null;
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  getCurrentUser() {
    return this.currentUser?.email || null;
  }

  getCurrentUserId() {
    return this.currentUser?.id || null;
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  clearUserData() {
    // Clear any localStorage data if needed
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('finzn-') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
  }
}