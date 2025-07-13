import { supabase } from '../config/supabase.js';

export class DataManager {
  constructor() {
    this.data = {
      expenses: {},
      income: {},
      extraIncomes: {},
      goals: [],
      categories: this.getDefaultCategories(),
      achievements: [],
      recurringExpenses: [],
      spendingLimits: [],
      monthlySavings: {}
    };
  }

  getDefaultCategories() {
    return [
      { id: '1', name: 'Comida', icon: '🍔', color: '#ef4444' },
      { id: '2', name: 'Transporte', icon: '🚗', color: '#3b82f6' },
      { id: '3', name: 'Salud', icon: '💊', color: '#8b5cf6' },
      { id: '4', name: 'Ocio', icon: '🎉', color: '#f59e0b' },
      { id: '5', name: 'Supermercado', icon: '🛒', color: '#10b981' },
      { id: '6', name: 'Servicios', icon: '📱', color: '#6b7280' },
      { id: '7', name: 'Otros', icon: '📦', color: '#9ca3af' }
    ];
  }

  async loadUserData() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      // Load all user data in parallel
      await Promise.all([
        this.loadCategories(),
        this.loadGoals(),
        this.loadSpendingLimits(),
        this.loadAchievements()
      ]);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  getCurrentUserId() {
    const { data: { user } } = supabase.auth.getUser();
    return user?.id || null;
  }

  getCategories() {
    return this.data.categories;
  }

  async loadCategories() {
    // Basic implementation for now
    this.data.categories = this.getDefaultCategories();
  }

  async loadGoals() {
    // Basic implementation for now
    this.data.goals = [];
  }

  async loadSpendingLimits() {
    // Basic implementation for now
    this.data.spendingLimits = [];
  }

  async loadAchievements() {
    // Basic implementation for now
    this.data.achievements = [];
  }
}