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
      console.log('Attempting to register user:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: undefined // Disable email confirmation
        }
      });

      if (error) {
        console.error('Registration error:', error);
        
        // Handle specific error cases
        if (error.message.includes('User already registered')) {
          throw new Error('Este email ya está registrado. Intenta iniciar sesión.');
        }
        if (error.message.includes('Invalid email')) {
          throw new Error('Email inválido. Por favor verifica el formato.');
        }
        if (error.message.includes('Password')) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }
        
        return false;
      }

      console.log('Registration successful:', data);
      
      // Check if user was created successfully
      if (data.user) {
        console.log('User created successfully, ID:', data.user.id);
        return true;
      }

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
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