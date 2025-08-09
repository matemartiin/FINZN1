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
    console.log('👤 loadUserProfile - userId:', userId);
    if (!userId) return null;

    try {
      console.log('👤 Loading user profile for:', userId);
      
      const { supabase } = await import('../config/supabase.js');
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.log('👤 Profile load error:', error);
        
        // If no profile found, that's expected for new users
        if (error.code === 'PGRST116') {
          console.log('👤 No profile found for user, will need to create one');
          this.currentProfile = null;
          return null;
        }
        
        // If table doesn't exist, show helpful message
        if (error.code === '42P01' || (error.message && error.message.includes('relation "public.user_profiles" does not exist'))) {
          console.error('❌ La tabla user_profiles no existe. Ejecuta las migraciones de Supabase.');
          if (window.app && window.app.ui) {
            window.app.ui.showAlert('Tabla de perfiles no encontrada. Ejecuta las migraciones de la base de datos.', 'warning');
          }
          return null;
        }
        
        console.error('Error loading user profile:', error);
        return null;
      }

      this.currentProfile = data;
      console.log('👤 Profile loaded:', this.currentProfile);
      
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
    console.log('👤 createUserProfile - userId:', userId, 'profileData:', profileData);
    
    if (!userId) return false;

    try {
      console.log('👤 Creating user profile:', profileData);
      
      const { supabase } = await import('../config/supabase.js');
      
      const profile = {
        user_id: userId,
        display_name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || ''
      };

      console.log('👤 Profile data to insert:', profile);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profile])
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        
        // If profile already exists, try updating instead
        if (error.code === '23505') {
          console.log('👤 Profile exists, trying to update instead');
          return await this.updateUserProfile(profileData);
        }
        
        return false;
      }

      this.currentProfile = data;
      console.log('✅ Profile created successfully:', data);
      
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
    console.log('👤 updateUserProfile - userId:', userId, 'profileData:', profileData);
    if (!userId) return false;

    try {
      console.log('👤 Updating user profile:', profileData);
      
      const { supabase } = await import('../config/supabase.js');
      
      const updates = {
        display_name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        updated_at: new Date().toISOString()
      };

      console.log('👤 Update data:', updates);
      
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
      console.log('✅ Profile updated successfully:', data);
      
      // Update header display
      this.updateHeaderDisplay();
      
      return true;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      return false;
    }
  }

  // SECURITY: Table creation removed from client-side code
  // Tables must be created via Supabase migrations or SQL editor
  // Required RLS policies:
  // - Users can only access their own profile (auth.uid() = user_id)
  // - All CRUD operations restricted to authenticated users

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
    console.log('👤 updateHeaderDisplay - element found:', !!userNameElement, 'currentProfile:', this.currentProfile);
    if (!userNameElement) return;

    let displayText = '¡Bienvenido!';
    
    if (this.currentProfile && this.currentProfile.first_name && this.currentProfile.last_name) {
      displayText = `👤 ${this.currentProfile.first_name} ${this.currentProfile.last_name}`;
    } else if (this.currentProfile && this.currentProfile.display_name) {
      displayText = `👤 ${this.currentProfile.display_name}`;
    } else {
      displayText = '👤 Usuario sin nombre';
    }
    
    console.log('👤 Setting header text to:', displayText);
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
    console.log('👤 UserProfile getting user ID:', userId);
    return userId;
  }

  hasCompleteProfile() {
    const hasComplete = this.currentProfile && 
           this.currentProfile.first_name && 
           this.currentProfile.last_name;
            
    console.log('👤 Profile completeness check:', {
      currentProfile: !!this.currentProfile,
      firstName: this.currentProfile?.first_name,
      lastName: this.currentProfile?.last_name,
      hasComplete
    });
    
    return hasComplete;
  }

  getCurrentProfile() {
    return this.currentProfile;
  }
}