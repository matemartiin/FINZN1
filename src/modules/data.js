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
    this.currentMonth = this.getCurrentMonth();
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
      console.log('📊 Loading user data for:', userId);
      
      // Load all user data in parallel
      await Promise.all([
        this.loadCategories(),
        this.loadGoals(),
        this.loadSpendingLimits(),
        this.loadAchievements(),
        this.loadExpenses(this.currentMonth),
        this.loadIncome(this.currentMonth)
      ]);
      
      console.log('✅ User data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    }
  }

  getCurrentUserId() {
    // This will be set by the auth manager
    return window.app?.auth?.getCurrentUserId() || null;
  }

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  // Categories
  getCategories() {
    return this.data.categories;
  }

  async loadCategories() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      if (data && data.length > 0) {
        this.data.categories = data.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color
        }));
      } else {
        // Create default categories for new user
        await this.createDefaultCategories();
      }
    } catch (error) {
      console.error('Error in loadCategories:', error);
    }
  }

  async createDefaultCategories() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const defaultCategories = this.getDefaultCategories().map(cat => ({
        user_id: userId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color
      }));

      const { error } = await supabase
        .from('categories')
        .insert(defaultCategories);

      if (error) {
        console.error('Error creating default categories:', error);
      } else {
        console.log('✅ Default categories created');
      }
    } catch (error) {
      console.error('Error in createDefaultCategories:', error);
    }
  }

  // Expenses
  async loadExpenses(month) {
    const userId = this.getCurrentUserId();
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading expenses:', error);
        return [];
      }

      const expenses = data || [];
      this.data.expenses[month] = expenses;
      return expenses;
    } catch (error) {
      console.error('Error in loadExpenses:', error);
      return [];
    }
  }

  async addExpense(expenseData) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      const expense = {
        user_id: userId,
        description: expenseData.description,
        amount: parseFloat(expenseData.amount),
        category: expenseData.category,
        transaction_date: expenseData.transactionDate,
        month: expenseData.month,
        installment: expenseData.installment || 1,
        total_installments: expenseData.totalInstallments || 1,
        original_id: expenseData.originalId || null,
        original_amount: expenseData.originalAmount || null,
        recurring: expenseData.recurring || false
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select();

      if (error) {
        console.error('Error adding expense:', error);
        return false;
      }

      // Update local data
      if (!this.data.expenses[expense.month]) {
        this.data.expenses[expense.month] = [];
      }
      this.data.expenses[expense.month].unshift(data[0]);

      return true;
    } catch (error) {
      console.error('Error in addExpense:', error);
      return false;
    }
  }

  async updateExpense(expenseId, expenseData) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          description: expenseData.description,
          amount: parseFloat(expenseData.amount),
          category: expenseData.category,
          transaction_date: expenseData.transactionDate
        })
        .eq('id', expenseId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating expense:', error);
        return false;
      }

      // Update local data
      const month = expenseData.month;
      if (this.data.expenses[month]) {
        const index = this.data.expenses[month].findIndex(exp => exp.id === expenseId);
        if (index !== -1) {
          this.data.expenses[month][index] = { ...this.data.expenses[month][index], ...expenseData };
        }
      }

      return true;
    } catch (error) {
      console.error('Error in updateExpense:', error);
      return false;
    }
  }

  async deleteExpense(expenseId) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting expense:', error);
        return false;
      }

      // Update local data
      Object.keys(this.data.expenses).forEach(month => {
        this.data.expenses[month] = this.data.expenses[month].filter(exp => exp.id !== expenseId);
      });

      return true;
    } catch (error) {
      console.error('Error in deleteExpense:', error);
      return false;
    }
  }

  getExpenses(month) {
    return this.data.expenses[month] || [];
  }

  // Income
  async loadIncome(month) {
    const userId = this.getCurrentUserId();
    if (!userId) return { fixed: 0, extra: 0 };

    try {
      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading income:', error);
        return { fixed: 0, extra: 0 };
      }

      const income = data ? {
        fixed: parseFloat(data.fixed_amount) || 0,
        extra: parseFloat(data.extra_amount) || 0
      } : { fixed: 0, extra: 0 };

      this.data.income[month] = income;
      return income;
    } catch (error) {
      console.error('Error in loadIncome:', error);
      return { fixed: 0, extra: 0 };
    }
  }

  async updateIncome(month, incomeData) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('incomes')
        .upsert({
          user_id: userId,
          month: month,
          fixed_amount: parseFloat(incomeData.fixed) || 0,
          extra_amount: parseFloat(incomeData.extra) || 0
        });

      if (error) {
        console.error('Error updating income:', error);
        return false;
      }

      // Update local data
      this.data.income[month] = {
        fixed: parseFloat(incomeData.fixed) || 0,
        extra: parseFloat(incomeData.extra) || 0
      };

      return true;
    } catch (error) {
      console.error('Error in updateIncome:', error);
      return false;
    }
  }

  getIncome(month) {
    return this.data.income[month] || { fixed: 0, extra: 0 };
  }

  // Goals
  async loadGoals() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading goals:', error);
        return;
      }

      this.data.goals = data || [];
    } catch (error) {
      console.error('Error in loadGoals:', error);
    }
  }

  async addGoal(goalData) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      const goal = {
        user_id: userId,
        name: goalData.name,
        target_amount: parseFloat(goalData.targetAmount),
        current_amount: parseFloat(goalData.currentAmount) || 0
      };

      const { data, error } = await supabase
        .from('goals')
        .insert([goal])
        .select();

      if (error) {
        console.error('Error adding goal:', error);
        return false;
      }

      this.data.goals.unshift(data[0]);
      return true;
    } catch (error) {
      console.error('Error in addGoal:', error);
      return false;
    }
  }

  getGoals() {
    return this.data.goals;
  }

  // Spending Limits
  async loadSpendingLimits() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('spending_limits')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading spending limits:', error);
        return;
      }

      this.data.spendingLimits = data || [];
    } catch (error) {
      console.error('Error in loadSpendingLimits:', error);
    }
  }

  getSpendingLimits() {
    return this.data.spendingLimits;
  }

  // Achievements
  async loadAchievements() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading achievements:', error);
        return;
      }

      this.data.achievements = data || [];
    } catch (error) {
      console.error('Error in loadAchievements:', error);
    }
  }

  getAchievements() {
    return this.data.achievements;
  }

  // Balance calculations
  calculateBalance(month) {
    const expenses = this.getExpenses(month);
    const income = this.getIncome(month);
    
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const totalIncome = income.fixed + income.extra;
    const available = totalIncome - totalExpenses;
    
    const installments = expenses.filter(exp => exp.total_installments > 1).length;
    
    return {
      totalIncome,
      totalExpenses,
      available,
      installments
    };
  }

  // Category analysis
  getExpensesByCategory(month) {
    const expenses = this.getExpenses(month);
    const categoryTotals = {};
    
    expenses.forEach(expense => {
      const category = expense.category;
      categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(expense.amount);
    });
    
    return categoryTotals;
  }
}