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
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user profile:', error);
        return null;
      }

      console.log('👤 Profile loaded:', data ? 'Found' : 'Not found');
      return data;
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
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
        .insert([profile])
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
        .select();

      if (error) {
        console.error('Error updating user profile:', error);
        return false;
      }

      console.log('✅ User profile updated successfully');
      this.currentProfile = data[0];
      return true;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      return false;
    }
  }

  getDisplayName() {
    if (!this.currentProfile) {
      return 'Usuario sin nombre';
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

    return '¡Bienvenido!';
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