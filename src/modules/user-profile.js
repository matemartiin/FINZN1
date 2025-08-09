export class UserProfileManager {
  constructor() {
    this.currentProfile = null;
  }

  async init() {
    console.log('👤 Initializing User Profile Manager...');
    await this.loadUserProfile();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Edit profile button
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', () => this.showEditProfileModal());
    }

    // Complete profile form (for new users)
    const completeProfileForm = document.getElementById('complete-profile-form');
    if (completeProfileForm) {
      completeProfileForm.addEventListener('submit', (e) => this.handleCompleteProfile(e));
    }

    // Edit profile form
    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
      editProfileForm.addEventListener('submit', (e) => this.handleEditProfile(e));
    }
  }

  async loadUserProfile() {
    const userId = this.getCurrentUserId();
    if (import.meta.env.DEV) {
      console.log('👤 loadUserProfile - userId:', userId);
    }
    if (!userId) return null;

    try {
      if (import.meta.env.DEV) {
        console.log('👤 Loading user profile for:', userId);
      }
      
      const { supabase } = await import('../config/supabase.js');
      
      // Ensure table exists before trying to query
      await this.ensureUserProfilesTableExists();
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (import.meta.env.DEV) {
          console.log('👤 Profile load error:', error);
        }
        
        // If no profile found, that's expected for new users
        if (error.code === 'PGRST116') {
          console.log('👤 No profile found for user, will need to create one');
          this.currentProfile = null;
          return null;
        }
        
        console.error('Error loading user profile:', error);
        
        // If table doesn't exist, show helpful message
        if (error.message && error.message.includes('relation "public.user_profiles" does not exist')) {
          console.error('❌ La tabla user_profiles no existe en Supabase. Por favor, ejecuta las migraciones o créala manualmente.');
          if (window.app && window.app.ui) {
            window.app.ui.showAlert('Error: Tabla de perfiles no encontrada. Contacta al administrador.', 'error');
          }
        }
        return null;
      }

      this.currentProfile = data;
      if (import.meta.env.DEV) {
        console.log('👤 Profile loaded:', this.currentProfile);
      }
      
      // Update header display
      this.updateHeaderDisplay();
      
      return this.currentProfile;
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      return null;
    }
  }

  async createUserProfile(profileData) {
    const userId = this.getCurrentUserId();
    if (import.meta.env.DEV) {
      console.log('👤 createUserProfile - userId:', userId, 'profileData:', profileData);
    }
    
    if (!userId) return false;

    try {
      if (import.meta.env.DEV) {
        console.log('👤 Creating user profile:', profileData);
      }
      
      const { supabase } = await import('../config/supabase.js');
      
      // First, ensure the table exists
      await this.ensureUserProfilesTableExists();
      
      const profile = {
        user_id: userId,
        display_name: `${profileData.first_name} ${profileData.last_name}`.trim(),
        first_name: profileData.first_name,
        last_name: profileData.last_name
      };

      if (import.meta.env.DEV) {
        console.log('👤 Profile data to insert:', profile);
      }
      
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profile])
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        if (import.meta.env.DEV) {
          console.error('Full error details:', JSON.stringify(error, null, 2));
        }
        
        // If profile already exists, try updating instead
        if (error.code === '23505') {
          console.log('👤 Profile exists, trying to update instead');
          return await this.updateUserProfile(profileData);
        }
        
        return false;
      }

      this.currentProfile = data;
      if (import.meta.env.DEV) {
        console.log('✅ Profile created successfully:', data);
      }
      
      // Update header display
      this.updateHeaderDisplay();
      
      return true;
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      return false;
    }
  }

  async updateUserProfile(profileData) {
    const userId = this.getCurrentUserId();
    if (import.meta.env.DEV) {
      console.log('👤 updateUserProfile - userId:', userId, 'profileData:', profileData);
    }
    if (!userId) return false;

    try {
      if (import.meta.env.DEV) {
        console.log('👤 Updating user profile:', profileData);
      }
      
      const { supabase } = await import('../config/supabase.js');
      
      // First, ensure the table exists
      await this.ensureUserProfilesTableExists();
      
      const updates = {
        display_name: `${profileData.first_name} ${profileData.last_name}`.trim(),
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        updated_at: new Date().toISOString()
      };

      if (import.meta.env.DEV) {
        console.log('👤 Update data:', updates);
      }
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        
        // If no profile exists to update, create one instead
        if (error.code === 'PGRST116') {
          console.log('👤 No profile to update, creating new one');
          return await this.createUserProfile(profileData);
        }
        
        return false;
      }

      this.currentProfile = data;
      if (import.meta.env.DEV) {
        console.log('✅ Profile updated successfully:', data);
      }
      
      // Update header display
      this.updateHeaderDisplay();
      
      return true;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      return false;
    }
  }

  async ensureUserProfilesTableExists() {
    try {
      const { supabase } = await import('../config/supabase.js');
      
      // Try to query the table to see if it exists
      const { error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      if (error && error.message && error.message.includes('relation "public.user_profiles" does not exist')) {
        console.log('📝 Creating user_profiles table via SQL...');
        
        // Create the table using SQL
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS user_profiles (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
            display_name text NOT NULL DEFAULT '',
            first_name text DEFAULT '',
            last_name text DEFAULT '',
            phone text,
            avatar_url text,
            bio text,
            preferences jsonb DEFAULT '{}',
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
          );
          
          ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
          CREATE POLICY "Users can view their own profile"
            ON user_profiles
            FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);
          
          DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
          CREATE POLICY "Users can insert their own profile"
            ON user_profiles
            FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = user_id);
          
          DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
          CREATE POLICY "Users can update their own profile"
            ON user_profiles
            FOR UPDATE
            TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
          
          DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;
          CREATE POLICY "Users can delete their own profile"
            ON user_profiles
            FOR DELETE
            TO authenticated
            USING (auth.uid() = user_id);
          
          CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
        `;
        
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        
        if (createError) {
          console.warn('⚠️ Could not create user_profiles table automatically. Please create it manually in Supabase.');
        } else {
          console.log('✅ User profiles table created successfully');
        }
      }
    } catch (error) {
      console.log('ℹ️ Table check completed, proceeding...');
    }
  }

  showCompleteProfileModal() {
    console.log('👤 Showing complete profile modal');
    
    // Clear form
    const form = document.getElementById('complete-profile-form');
    if (form) {
      form.reset();
    }
    
    if (window.app && window.app.modals) {
      window.app.modals.show('complete-profile-modal');
    }
  }

  showEditProfileModal() {
    console.log('👤 Showing edit profile modal');
    
    // Pre-fill form with current data
    if (this.currentProfile) {
      const firstNameInput = document.getElementById('edit-first-name');
      const lastNameInput = document.getElementById('edit-last-name');
      
      if (firstNameInput) firstNameInput.value = this.currentProfile.first_name || '';
      if (lastNameInput) lastNameInput.value = this.currentProfile.last_name || '';
    }
    
    if (window.app && window.app.modals) {
      window.app.modals.show('edit-profile-modal');
    }
  }

  async handleCompleteProfile(e) {
    e.preventDefault();
    console.log('👤 Handling complete profile...');
    
    const formData = new FormData(e.target);
    const profileData = {
      first_name: formData.get('first_name')?.trim() || '',
      last_name: formData.get('last_name')?.trim() || ''
    };

    if (!profileData.first_name || !profileData.last_name) {
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Por favor completa tu nombre y apellido', 'error');
      }
      return;
    }

    try {
      const success = await this.createUserProfile(profileData);
      
      if (success) {
        if (window.app && window.app.modals) {
          window.app.modals.hide('complete-profile-modal');
        }
        
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('¡Perfil completado exitosamente!', 'success');
        }
      } else {
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Error al completar el perfil', 'error');
        }
      }
    } catch (error) {
      console.error('Error completing profile:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al completar el perfil', 'error');
      }
    }
  }

  async handleEditProfile(e) {
    e.preventDefault();
    console.log('👤 Handling edit profile...');
    
    const formData = new FormData(e.target);
    const profileData = {
      first_name: formData.get('first_name')?.trim() || '',
      last_name: formData.get('last_name')?.trim() || ''
    };

    if (!profileData.first_name || !profileData.last_name) {
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Por favor completa tu nombre y apellido', 'error');
      }
      return;
    }

    try {
      const success = await this.updateUserProfile(profileData);
      
      if (success) {
        if (window.app && window.app.modals) {
          window.app.modals.hide('edit-profile-modal');
        }
        
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Perfil actualizado exitosamente', 'success');
        }
      } else {
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Error al actualizar el perfil', 'error');
        }
      }
    } catch (error) {
      console.error('Error editing profile:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al actualizar el perfil', 'error');
      }
    }
  }

  updateHeaderDisplay() {
    const userNameElement = document.getElementById('user-name');
    if (import.meta.env.DEV) {
      console.log('👤 updateHeaderDisplay - element found:', !!userNameElement, 'currentProfile:', this.currentProfile);
    }
    if (!userNameElement) return;

    let displayText = '¡Bienvenido!';
    
    if (this.currentProfile && this.currentProfile.first_name && this.currentProfile.last_name) {
      displayText = `👤 ${this.currentProfile.first_name} ${this.currentProfile.last_name}`;
    } else if (this.currentProfile && this.currentProfile.display_name) {
      displayText = `👤 ${this.currentProfile.display_name}`;
    } else {
      displayText = '👤 Usuario sin nombre';
    }
    
    if (import.meta.env.DEV) {
      console.log('👤 Setting header text to:', displayText);
    }
    userNameElement.textContent = displayText;
  }

  getDisplayName() {
    if (this.currentProfile && this.currentProfile.first_name && this.currentProfile.last_name) {
      return `${this.currentProfile.first_name} ${this.currentProfile.last_name}`;
    } else if (this.currentProfile && this.currentProfile.display_name) {
      return this.currentProfile.display_name;
    }
    return 'Usuario sin nombre';
  }

  getCurrentUserId() {
    const userId = window.app?.auth?.getCurrentUserId() || null;
    if (import.meta.env.DEV) {
      console.log('👤 UserProfile getting user ID:', userId);
    }
    return userId;
  }

  hasCompleteProfile() {
    const hasComplete = this.currentProfile && 
           this.currentProfile.first_name && 
           this.currentProfile.last_name;
            
    if (import.meta.env.DEV) {
      console.log('👤 Profile completeness check:', {
        currentProfile: !!this.currentProfile,
        firstName: this.currentProfile?.first_name,
        lastName: this.currentProfile?.last_name,
        hasComplete
      });
    }
    
    return hasComplete;
  }

  getCurrentProfile() {
    return this.currentProfile;
  }
}