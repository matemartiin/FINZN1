export class UserProfileManager {
  constructor() {
    this.currentProfile = null;
  }

  async initializeProfile() {
    console.log('👤 Initializing user profile...');
    
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return null;

      const profile = await this.loadUserProfile(userId);
      this.currentProfile = profile;
      return profile;
    } catch (error) {
      console.error('Error initializing profile:', error);
      return null;
    }
  }

  async loadUserProfile(userId) {
    try {
      console.log('👤 Loading user profile for:', userId);
      
      const { supabase } = await import('../config/supabase.js');
      
      // First, ensure the profile exists
      await this.ensureProfileExists(userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user profile:', error);
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('👤 Profile not found, creating default profile...');
          return await this.createDefaultProfile(userId);
        }
        throw error;
      }

      console.log('👤 Profile loaded:', data ? 'Found' : 'Not found');
      return data;
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      // Try to create a default profile as fallback
      return await this.createDefaultProfile(userId);
    }
  }

  async ensureProfileExists(userId) {
    try {
      const { supabase } = await import('../config/supabase.js');
      
      // Check if profile exists
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('👤 Creating missing profile for user:', userId);
        await this.createDefaultProfile(userId);
      }
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
    }
  }

  async createDefaultProfile(userId) {
    try {
      const { supabase } = await import('../config/supabase.js');
      
      // Get user email for default display name
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || '';
      const defaultDisplayName = email ? email.split('@')[0] : 'Usuario';
      
      const defaultProfile = {
        user_id: userId,
        display_name: defaultDisplayName,
        first_name: '',
        last_name: '',
        preferences: {}
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([defaultProfile])
        .select()
        .single();

      if (error) {
        console.error('Error creating default profile:', error);
        return null;
      }

      console.log('✅ Default profile created:', data);
      return data;
    } catch (error) {
      console.error('Error in createDefaultProfile:', error);
      return null;
    }
  }

  async createUserProfile(profileData) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      console.log('👤 Creating user profile:', profileData);
      
      const { supabase } = await import('../config/supabase.js');
      const profile = {
        user_id: userId,
        display_name: `${profileData.firstName} ${profileData.lastName}`.trim(),
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        preferences: {}
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert([profile], {
          onConflict: 'user_id'
        })
        .select();

      if (error) {
        console.error('Error creating user profile:', error);
        return false;
      }

      console.log('✅ User profile created successfully:', data[0]);
      this.currentProfile = data[0];
      return true;
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      return false;
    }
  }

  async updateUserProfile(updates) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      console.log('👤 Updating user profile:', updates);
      
      const { supabase } = await import('../config/supabase.js');
      
      // Update display_name if first_name or last_name changed
      if (updates.first_name || updates.last_name) {
        const firstName = updates.first_name || this.currentProfile?.first_name || '';
        const lastName = updates.last_name || this.currentProfile?.last_name || '';
        updates.display_name = `${firstName} ${lastName}`.trim();
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }

      console.log('✅ User profile updated successfully');
      this.currentProfile = data;
      
      // Update the header display immediately
      this.updateHeaderDisplay();
      
      return true;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      return false;
    }
  }

  updateHeaderDisplay() {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      userNameElement.textContent = this.getDisplayName();
    }
  }

  getDisplayName() {
    if (!this.currentProfile) {
      return '¡Bienvenido!';
    }

    const displayName = this.currentProfile.display_name?.trim();
    if (displayName && displayName !== '') {
      return displayName;
    }

    const firstName = this.currentProfile.first_name?.trim() || '';
    const lastName = this.currentProfile.last_name?.trim() || '';
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }

    return 'Usuario sin nombre';
  }

  getFirstName() {
    return this.currentProfile?.first_name || '';
  }

  getLastName() {
    return this.currentProfile?.last_name || '';
  }

  hasCompleteProfile() {
    return this.currentProfile && 
           this.currentProfile.first_name && 
           this.currentProfile.first_name.trim() !== '';
  }

  getCurrentUserId() {
    return window.app?.auth?.getCurrentUserId() || null;
  }

  // Validation methods
  validateProfileData(data) {
    const errors = [];

    if (!data.firstName || data.firstName.trim() === '') {
      errors.push('El nombre es requerido');
    } else if (data.firstName.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    } else if (data.firstName.trim().length > 50) {
      errors.push('El nombre no puede tener más de 50 caracteres');
    }

    if (!data.lastName || data.lastName.trim() === '') {
      errors.push('El apellido es requerido');
    } else if (data.lastName.trim().length < 2) {
      errors.push('El apellido debe tener al menos 2 caracteres');
    } else if (data.lastName.trim().length > 50) {
      errors.push('El apellido no puede tener más de 50 caracteres');
    }

    // Basic name validation (only letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$/;
    
    if (data.firstName && !nameRegex.test(data.firstName.trim())) {
      errors.push('El nombre solo puede contener letras, espacios, guiones y apostrofes');
    }

    if (data.lastName && !nameRegex.test(data.lastName.trim())) {
      errors.push('El apellido solo puede contener letras, espacios, guiones y apostrofes');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Format names properly (capitalize first letter of each word)
  formatName(name) {
    if (!name) return '';
    
    return name.trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}