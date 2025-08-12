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
      // Check if supabase is properly configured
      if (!supabase || typeof supabase.auth?.getSession !== 'function') {
        console.warn('⚠️ Supabase not properly configured, using mock auth');
        this.currentUser = null;
        return;
      }
      
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        // Try to recover from auth errors
        await this.handleAuthError(error);
      }
      this.currentUser = session?.user || null;
      if (import.meta.env.DEV) {
        console.log('🔐 Initial session:', session ? `Found for ${session.user.email}, ID: ${session.user.id}` : 'None');
        console.log('🔐 Current user object:', this.currentUser);
      }
    } catch (error) {
      console.error('Error in initializeAuth:', error);
      this.currentUser = null;
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (import.meta.env.DEV) {
        console.log('🔐 Auth state changed:', event, session?.user?.email, 'ID:', session?.user?.id);
      }
      this.currentUser = session?.user || null;
      if (import.meta.env.DEV) {
        console.log('🔐 Updated currentUser:', this.currentUser);
      }
      
      if (event === 'SIGNED_OUT') {
        // Clear any cached data
        this.clearUserData();
        // Reload the page to reset application state
        window.location.reload();
      } else if (event === 'SIGNED_IN') {
        if (import.meta.env.DEV) {
          console.log('✅ User successfully signed in:', session.user.email);
          console.log('✅ User ID:', session.user.id);
        }
        
        // Load user profile after successful sign in
        setTimeout(async () => {
          if (window.app && window.app.userProfile) {
            console.log('🔐 Loading user profile after sign in...');
            await window.app.userProfile.loadUserProfile();
          }
        }, 500);
      }
    });
  }

  async handleAuthError(error) {
    console.log('🔧 Handling auth error:', error.message);
    
    // Clear potentially corrupted session data
    try {
      await supabase.auth.signOut();
      this.clearUserData();
    } catch (signOutError) {
      console.error('Error during auth recovery:', signOutError);
    }
  }
  async login(email, password) {
    try {
      if (import.meta.env.DEV) {
        console.log('🔐 Attempting login for:', email);
      }
      
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

      if (import.meta.env.DEV) {
        console.log('✅ Login successful:', data.user?.email);
      }
      this.currentUser = data.user;
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(email, password) {
    try {
      if (import.meta.env.DEV) {
        console.log('📝 Attempting to register user:', email);
      }
      
      // Check if we have a valid Supabase client
      if (!supabase || typeof supabase.auth?.signUp !== 'function') {
        throw new Error('Supabase no está configurado correctamente. Verifica las variables de entorno.');
      }
      
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
      });

      if (error) {
        console.error('Registration error:', error);
        
        // Log the full error for debugging
        if (import.meta.env.DEV) {
          console.error('Full error object:', JSON.stringify(error, null, 2));
        }
        
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
          throw new Error('El registro está deshabilitado en Supabase. Verifica la configuración en Authentication > Settings.');
        }
        if (error.message.includes('signups not allowed')) {
          throw new Error('Los registros no están permitidos. Contacta al administrador.');
        }
        if (error.message.includes('Email signups are disabled')) {
          throw new Error('Los registros por email están deshabilitados en Supabase. Ve a Authentication > Settings > Auth Providers > Email y actívalo.');
        }
        
        throw new Error(error.message);
      }

      if (import.meta.env.DEV) {
        console.log('✅ Registration successful:', data);
      }
      
      // Check if user was created successfully
      if (data.user) {
        if (import.meta.env.DEV) {
          console.log('User created successfully, ID:', data.user.id);
        }
        
        // If email confirmation is disabled, user should be able to login immediately
        if (data.user.email_confirmed_at || data.session) {
          this.currentUser = data.user;
          return { success: true, needsConfirmation: false, user: data.user };
        } else {
          return { success: true, needsConfirmation: true, user: data.user };
        }
      }

      return { success: true, needsConfirmation: false, user: data.user };
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
    if (import.meta.env.DEV) {
      console.log('🔐 Getting current user ID, currentUser:', this.currentUser);
    }
    const userId = this.currentUser?.id || null;
    if (import.meta.env.DEV) {
      console.log('🔐 Returning user ID:', userId);
    }
    return userId;
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