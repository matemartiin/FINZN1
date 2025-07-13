import { supabase } from '../config/supabase.js';

export class AuthManager {
  constructor() {
    this.currentUser = null;
    this.initializeAuth();
  }

  async initializeAuth() {
    console.log('🔐 Initializing authentication...');
    
    // Get initial session
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      }
      this.currentUser = session?.user || null;
      console.log('Initial session:', session ? 'Found' : 'None');
    } catch (error) {
      console.error('Error in initializeAuth:', error);
      this.currentUser = null;
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
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
      console.log('🔐 Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error('Login error:', error);
        
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email o contraseña incorrectos');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Por favor confirma tu email antes de iniciar sesión');
        }
        
        throw new Error(error.message);
      }

      console.log('✅ Login successful:', data.user?.email);
      this.currentUser = data.user;
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(email, password) {
    try {
      console.log('📝 Attempting to register user:', email);
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Por favor ingresa un email válido');
      }
      
      // Validate password
      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation for now
          data: {
            email_confirm: true
          }
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
        if (error.message.includes('signup is disabled')) {
          throw new Error('El registro está temporalmente deshabilitado.');
        }
        
        throw new Error(error.message);
      }

      console.log('✅ Registration successful:', data);
      
      // Check if user was created successfully
      if (data.user) {
        console.log('User created successfully, ID:', data.user.id);
        
        // If email confirmation is disabled, user should be able to login immediately
        if (data.user.email_confirmed_at || data.session) {
          this.currentUser = data.user;
          return { success: true, needsConfirmation: false };
        } else {
          return { success: true, needsConfirmation: true };
        }
      }

      return { success: true, needsConfirmation: false };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      console.log('👋 Logging out...');
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

  // Helper method to generate a random email for testing
  generateTestEmail() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `test${timestamp}${random}@finzn.app`;
  }
}