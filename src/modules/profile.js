import { supabase } from '../config/supabase.js';

export class ProfileManager {
  constructor() {
    this.currentProfile = null;
  }

  getCurrentUserId() {
    return window.app?.auth?.getCurrentUserId() || null;
  }

  // Load user profile
  async loadProfile() {
    const userId = this.getCurrentUserId();
    if (!userId) return null;

    try {
      console.log('👤 Loading user profile for:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        
        // If profile doesn't exist, create a default one
        if (error.code === 'PGRST116') {
          return await this.createDefaultProfile();
        }
        return null;
      }

      this.currentProfile = data;
      console.log('✅ Profile loaded:', data);
      return data;
    } catch (error) {
      console.error('Error in loadProfile:', error);
      return null;
    }
  }

  // Create default profile for existing users
  async createDefaultProfile() {
    const userId = this.getCurrentUserId();
    if (!userId) return null;

    try {
      console.log('👤 Creating default profile for user:', userId);
      
      // Get user email from auth
      const currentUser = window.app?.auth?.currentUser;
      const email = currentUser?.email || 'Usuario';
      const displayName = email.split('@')[0] || 'Usuario';

      const profileData = {
        user_id: userId,
        display_name: displayName,
        first_name: '',
        last_name: '',
        phone: '',
        bio: ''
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('Error creating default profile:', error);
        return null;
      }

      this.currentProfile = data;
      console.log('✅ Default profile created:', data);
      return data;
    } catch (error) {
      console.error('Error in createDefaultProfile:', error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(updates) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      console.log('👤 Updating profile:', updates);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return false;
      }

      this.currentProfile = data;
      console.log('✅ Profile updated successfully:', data);
      
      // Update header display immediately
      this.updateHeaderDisplay();
      
      return true;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return false;
    }
  }

  // Get current profile
  getProfile() {
    return this.currentProfile;
  }

  // Get display name
  getDisplayName() {
    return this.currentProfile?.display_name || 'Usuario';
  }

  // Update header display
  updateHeaderDisplay() {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && this.currentProfile) {
      userNameElement.textContent = `👤 ${this.currentProfile.display_name}`;
    }
  }

  // Validate profile data
  validateProfileData(data) {
    const errors = [];

    if (!data.display_name || data.display_name.trim().length === 0) {
      errors.push('El nombre es obligatorio');
    }

    if (data.display_name && data.display_name.trim().length > 50) {
      errors.push('El nombre no puede tener más de 50 caracteres');
    }

    if (data.phone && data.phone.length > 0) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(data.phone)) {
        errors.push('El teléfono no tiene un formato válido');
      }
    }

    if (data.bio && data.bio.length > 500) {
      errors.push('La biografía no puede tener más de 500 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Create profile during registration
  async createProfileOnRegistration(userData) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      console.log('👤 Creating profile during registration:', userData);
      
      const profileData = {
        user_id: userId,
        display_name: userData.display_name,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone: userData.phone || '',
        bio: userData.bio || ''
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile on registration:', error);
        return false;
      }

      this.currentProfile = data;
      console.log('✅ Profile created on registration:', data);
      return true;
    } catch (error) {
      console.error('Error in createProfileOnRegistration:', error);
      return false;
    }
  }

  // Clear profile data on logout
  clearProfile() {
    this.currentProfile = null;
  }
}