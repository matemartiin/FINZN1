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

  async loadCategories() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at');

      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      // If no custom categories, use defaults
      if (!data || data.length === 0) {
        this.data.categories = this.getDefaultCategories();
      } else {
        this.data.categories = data.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color
        }));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      this.data.categories = this.getDefaultCategories();
    }
  }

  async loadGoals() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at');

      if (error) {
        console.error('Error loading goals:', error);
        return;
      }

      this.data.goals = data.map(goal => ({
        id: goal.id,
        name: goal.name,
        target: parseFloat(goal.target_amount),
        current: parseFloat(goal.current_amount),
        createdAt: goal.created_at
      }));
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  }

  async loadSpendingLimits() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('spending_limits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at');

      if (error) {
        console.error('Error loading spending limits:', error);
        return;
      }

      this.data.spendingLimits = data.map(limit => ({
        id: limit.id,
        category: limit.category,
        amount: parseFloat(limit.amount),
        warning: limit.warning_percentage,
        createdAt: limit.created_at
      }));
    } catch (error) {
      console.error('Error loading spending limits:', error);
    }
  }

  async loadAchievements() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('created_at');

      if (error) {
        console.error('Error loading achievements:', error);
        return;
      }

      this.data.achievements = data.map(achievement => ({
        id: achievement.achievement_id,
        title: achievement.title,
        description: achievement.description
      }));
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  }

  getCurrentUserId() {
    const { data: { user } } = supabase.auth.getUser();
    return user?.id || null;
  }

  async addExpense(expense) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      const originalId = crypto.randomUUID();
      const installmentAmount = expense.amount / expense.installments;
      
      const expensesToInsert = [];
      
      for (let i = 0; i < expense.installments; i++) {
        const installmentDate = this.addMonths(expense.date, i);
        
        expensesToInsert.push({
          user_id: userId,
          description: expense.description,
          amount: installmentAmount,
          category: expense.category,
          transaction_date: expense.transactionDate,
          month: installmentDate,
          installment: i + 1,
          total_installments: expense.installments,
          original_id: originalId,
          original_amount: expense.amount,
          recurring: expense.recurring && i === 0
        });
      }

      const { error } = await supabase
        .from('expenses')
        .insert(expensesToInsert);

      if (error) {
        console.error('Error adding expense:', error);
        throw error;
      }

      await this.checkAchievements();
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  async updateExpense(expenseId, expenseData, month) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      // Get the current expense to check if it's part of installments
      const { data: currentExpense, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !currentExpense) {
        throw new Error('Expense not found');
      }

      if (currentExpense.total_installments > 1) {
        // Update all installments with the same original_id
        const newInstallmentAmount = expenseData.amount / expenseData.installments;
        
        const { error } = await supabase
          .from('expenses')
          .update({
            description: expenseData.description,
            amount: newInstallmentAmount,
            category: expenseData.category,
            transaction_date: expenseData.transactionDate,
            original_amount: expenseData.amount,
            total_installments: expenseData.installments,
            recurring: expenseData.recurring
          })
          .eq('original_id', currentExpense.original_id)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Single expense update
        const { error } = await supabase
          .from('expenses')
          .update({
            description: expenseData.description,
            amount: expenseData.amount,
            category: expenseData.category,
            transaction_date: expenseData.transactionDate,
            recurring: expenseData.recurring,
            original_amount: expenseData.amount
          })
          .eq('id', expenseId)
          .eq('user_id', userId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  async deleteExpense(expenseId, month) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      // Get the expense to check if it's part of installments
      const { data: expense, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !expense) {
        throw new Error('Expense not found');
      }

      if (expense.total_installments > 1) {
        // Delete all installments with the same original_id
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('original_id', expense.original_id)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Single expense deletion
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', expenseId)
          .eq('user_id', userId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  async getExpenseById(expenseId, month) {
    const userId = this.getCurrentUserId();
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching expense:', error);
        return null;
      }

      return {
        id: data.id,
        description: data.description,
        amount: parseFloat(data.amount),
        category: data.category,
        transactionDate: data.transaction_date,
        date: data.month,
        installment: data.installment,
        totalInstallments: data.total_installments,
        recurring: data.recurring,
        originalId: data.original_id,
        originalAmount: parseFloat(data.original_amount || data.amount),
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error fetching expense:', error);
      return null;
    }
  }

  async setFixedIncome(amount) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      // Apply to current year months
      const currentYear = new Date().getFullYear();
      const months = [];
      
      for (let month = 1; month <= 12; month++) {
        months.push(`${currentYear}-${month.toString().padStart(2, '0')}`);
      }

      for (const monthKey of months) {
        const { error } = await supabase
          .from('incomes')
          .upsert({
            user_id: userId,
            month: monthKey,
            fixed_amount: amount
          }, {
            onConflict: 'user_id,month'
          });

        if (error) {
          console.error('Error setting fixed income:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error setting fixed income:', error);
      throw error;
    }
  }

  async addExtraIncome(extraIncome, month) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      // Add extra income record
      const { error: extraIncomeError } = await supabase
        .from('extra_incomes')
        .insert({
          user_id: userId,
          description: extraIncome.description,
          amount: extraIncome.amount,
          category: extraIncome.category,
          month: month
        });

      if (extraIncomeError) throw extraIncomeError;

      // Update total extra income for the month
      const { data: currentIncome } = await supabase
        .from('incomes')
        .select('extra_amount')
        .eq('user_id', userId)
        .eq('month', month)
        .single();

      const currentExtra = currentIncome?.extra_amount || 0;
      const newExtraTotal = parseFloat(currentExtra) + extraIncome.amount;

      const { error: incomeError } = await supabase
        .from('incomes')
        .upsert({
          user_id: userId,
          month: month,
          extra_amount: newExtraTotal
        }, {
          onConflict: 'user_id,month'
        });

      if (incomeError) throw incomeError;

      await this.checkAchievements();
    } catch (error) {
      console.error('Error adding extra income:', error);
      throw error;
    }
  }

  async addGoal(goal) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          name: goal.name,
          target_amount: goal.target,
          current_amount: goal.current || 0
        });

      if (error) throw error;

      await this.loadGoals();
      await this.checkAchievements();
    } catch (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
  }

  async addCategory(category) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: category.name,
          icon: category.icon || '🏷️',
          color: category.color || '#B7A6FF'
        });

      if (error) throw error;

      await this.loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  async addSpendingLimit(limit) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('spending_limits')
        .upsert({
          user_id: userId,
          category: limit.category,
          amount: limit.amount,
          warning_percentage: limit.warning || 80
        }, {
          onConflict: 'user_id,category'
        });

      if (error) throw error;

      await this.loadSpendingLimits();
    } catch (error) {
      console.error('Error adding spending limit:', error);
      throw error;
    }
  }

  async saveMonthlySavings(month, amount) {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('monthly_savings')
        .upsert({
          user_id: userId,
          month: month,
          amount: amount
        }, {
          onConflict: 'user_id,month'
        });

      if (error) {
        console.error('Error saving monthly savings:', error);
      }
    } catch (error) {
      console.error('Error saving monthly savings:', error);
    }
  }

  async getMonthlySavings(month) {
    const userId = this.getCurrentUserId();
    if (!userId) return 0;

    try {
      const { data, error } = await supabase
        .from('monthly_savings')
        .select('amount')
        .eq('user_id', userId)
        .eq('month', month)
        .single();

      if (error || !data) return 0;
      return parseFloat(data.amount);
    } catch (error) {
      console.error('Error getting monthly savings:', error);
      return 0;
    }
  }

  async getAllMonthlySavings() {
    const userId = this.getCurrentUserId();
    if (!userId) return {};

    try {
      const { data, error } = await supabase
        .from('monthly_savings')
        .select('month, amount')
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting all monthly savings:', error);
        return {};
      }

      const savings = {};
      data.forEach(item => {
        savings[item.month] = parseFloat(item.amount);
      });
      return savings;
    } catch (error) {
      console.error('Error getting all monthly savings:', error);
      return {};
    }
  }

  getSpendingLimits() {
    return this.data.spendingLimits || [];
  }

  async deleteSpendingLimit(id) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('spending_limits')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      await this.loadSpendingLimits();
    } catch (error) {
      console.error('Error deleting spending limit:', error);
      throw error;
    }
  }

  getSpendingLimitForCategory(category) {
    return this.data.spendingLimits.find(limit => limit.category === category);
  }

  async getExpenses(month) {
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
        console.error('Error fetching expenses:', error);
        return [];
      }

      return data.map(expense => ({
        id: expense.id,
        description: expense.description,
        amount: parseFloat(expense.amount),
        category: expense.category,
        transactionDate: expense.transaction_date,
        date: expense.month,
        installment: expense.installment,
        totalInstallments: expense.total_installments,
        recurring: expense.recurring,
        originalId: expense.original_id,
        originalAmount: parseFloat(expense.original_amount || expense.amount),
        createdAt: expense.created_at
      }));
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  }

  async getExpensesByCategory(month) {
    const expenses = await this.getExpenses(month);
    const byCategory = {};
    
    expenses.forEach(expense => {
      const category = expense.category || 'Otros';
      byCategory[category] = (byCategory[category] || 0) + expense.amount;
    });
    
    return byCategory;
  }

  async getBalance(month) {
    const income = await this.getIncome(month);
    const expenses = await this.getExpenses(month);
    const totalIncome = (income.fixed || 0) + (income.extra || 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Count active installments for this month
    const installments = expenses.filter(e => e.totalInstallments > 1).length;
    
    return {
      available: totalIncome - totalExpenses,
      totalIncome,
      totalExpenses,
      installments
    };
  }

  async getActiveInstallments(month) {
    const expenses = await this.getExpenses(month);
    const installments = expenses.filter(expense => expense.totalInstallments > 1);
    
    return installments.map(expense => {
      const progress = (expense.installment / expense.totalInstallments) * 100;
      const remainingInstallments = expense.totalInstallments - expense.installment;
      const remainingAmount = expense.amount * remainingInstallments;
      
      return {
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        originalAmount: expense.originalAmount,
        category: expense.category,
        currentInstallment: expense.installment,
        totalInstallments: expense.totalInstallments,
        progress: Math.round(progress),
        remainingInstallments,
        remainingAmount,
        createdAt: expense.createdAt || new Date().toISOString(),
        monthlyAmount: expense.amount
      };
    });
  }

  async getIncome(month) {
    const userId = this.getCurrentUserId();
    if (!userId) return { fixed: 0, extra: 0 };

    try {
      const { data, error } = await supabase
        .from('incomes')
        .select('fixed_amount, extra_amount')
        .eq('user_id', userId)
        .eq('month', month)
        .single();

      if (error || !data) {
        return { fixed: 0, extra: 0 };
      }

      return {
        fixed: parseFloat(data.fixed_amount || 0),
        extra: parseFloat(data.extra_amount || 0)
      };
    } catch (error) {
      console.error('Error fetching income:', error);
      return { fixed: 0, extra: 0 };
    }
  }

  async getExtraIncomes(month) {
    const userId = this.getCurrentUserId();
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('extra_incomes')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching extra incomes:', error);
        return [];
      }

      return data.map(income => ({
        id: income.id,
        description: income.description,
        amount: parseFloat(income.amount),
        category: income.category,
        date: income.month,
        createdAt: income.created_at
      }));
    } catch (error) {
      console.error('Error fetching extra incomes:', error);
      return [];
    }
  }

  async getAllExtraIncomes() {
    const userId = this.getCurrentUserId();
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('extra_incomes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all extra incomes:', error);
        return [];
      }

      return data.map(income => ({
        id: income.id,
        description: income.description,
        amount: parseFloat(income.amount),
        category: income.category,
        month: income.month,
        createdAt: income.created_at
      }));
    } catch (error) {
      console.error('Error fetching all extra incomes:', error);
      return [];
    }
  }

  getGoals() {
    return this.data.goals;
  }

  getCategories() {
    return this.data.categories;
  }

  async getStats() {
    // Calculate total savings from saved monthly balances
    const allSavings = await this.getAllMonthlySavings();
    const totalSavings = Object.values(allSavings).reduce((sum, savings) => sum + savings, 0);

    // Calculate monthly average from recent months
    const currentDate = new Date();
    let totalExpenses = 0;
    let monthCount = 0;

    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const expenses = await this.getExpenses(monthKey);
      const monthTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      if (monthTotal > 0) {
        totalExpenses += monthTotal;
        monthCount++;
      }
    }

    const monthlyAverage = monthCount > 0 ? totalExpenses / monthCount : 0;

    return {
      totalSavings,
      monthlyAverage
    };
  }

  getAchievements() {
    return this.data.achievements;
  }

  async getMonthlyTrend() {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const expenses = await this.getExpenses(monthKey);
      const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      months.push({
        month: monthKey,
        total,
        label: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
      });
    }
    
    return months;
  }

  async generateReport(month) {
    const expenses = await this.getExpenses(month);
    const balance = await this.getBalance(month);
    const byCategory = await this.getExpensesByCategory(month);
    const extraIncomes = await this.getExtraIncomes(month);
    const installments = await this.getActiveInstallments(month);
    const goals = this.getGoals();
    
    const recommendations = [];
    const total = balance.totalExpenses;
    
    Object.entries(byCategory).forEach(([category, amount]) => {
      const percentage = (amount / total) * 100;
      if (percentage > 40) {
        recommendations.push(`⚠️ Estás gastando mucho en ${category} (${percentage.toFixed(1)}%)`);
      } else if (percentage < 5) {
        recommendations.push(`✅ Buen control en ${category}`);
      }
    });

    if (balance.available < 0) {
      recommendations.push('🚨 Estás gastando más de lo que ingresas este mes');
    }

    if (extraIncomes.length > 0) {
      const totalExtra = extraIncomes.reduce((sum, income) => sum + income.amount, 0);
      recommendations.push(`💰 Ingresos extra del mes: $${totalExtra.toLocaleString()}`);
    }

    if (installments.length > 0) {
      recommendations.push(`💳 Tienes ${installments.length} cuotas activas este mes`);
    }

    return {
      month,
      balance,
      byCategory,
      recommendations,
      expenses,
      extraIncomes,
      installments,
      goals
    };
  }

  async exportToCSV() {
    const headers = [
      'Fecha', 
      'Fecha de Transacción',
      'Descripción', 
      'Monto', 
      'Categoría', 
      'Cuota', 
      'Total Cuotas', 
      'Monto Original', 
      'Fecha de Registro',
      'Tipo'
    ];
    const rows = [headers];
    
    const userId = this.getCurrentUserId();
    if (!userId) return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    try {
      // Add expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (expenses) {
        expenses.forEach(expense => {
          const createdDate = expense.created_at 
            ? new Date(expense.created_at).toLocaleDateString('es-ES')
            : 'No disponible';
          
          const transactionDate = expense.transaction_date 
            ? new Date(expense.transaction_date).toLocaleDateString('es-ES')
            : 'No disponible';
          
          rows.push([
            expense.month,
            transactionDate,
            expense.description,
            parseFloat(expense.amount).toFixed(2),
            expense.category,
            expense.installment || 1,
            expense.total_installments || 1,
            parseFloat(expense.original_amount || expense.amount).toFixed(2),
            createdDate,
            'Gasto'
          ]);
        });
      }

      // Add extra incomes
      const { data: extraIncomes } = await supabase
        .from('extra_incomes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (extraIncomes) {
        extraIncomes.forEach(income => {
          const createdDate = income.created_at 
            ? new Date(income.created_at).toLocaleDateString('es-ES')
            : 'No disponible';
          
          rows.push([
            income.month,
            income.month + '-01',
            income.description,
            parseFloat(income.amount).toFixed(2),
            income.category,
            1,
            1,
            parseFloat(income.amount).toFixed(2),
            createdDate,
            'Ingreso Extra'
          ]);
        });
      }

      // Add fixed incomes
      const { data: incomes } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', userId)
        .gt('fixed_amount', 0);

      if (incomes) {
        incomes.forEach(income => {
          rows.push([
            income.month,
            income.month + '-01',
            'Ingreso Fijo Mensual',
            parseFloat(income.fixed_amount).toFixed(2),
            'Ingreso',
            1,
            1,
            parseFloat(income.fixed_amount).toFixed(2),
            'Automático',
            'Ingreso Fijo'
          ]);
        });
      }
    } catch (error) {
      console.error('Error exporting to CSV:', error);
    }
    
    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  async importFromCSV(csvText) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(cell => cell.replace(/"/g, ''));
    
    const expensesToInsert = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(cell => cell.replace(/"/g, ''));
      const [month, transactionDate, description, amount, category] = values;
      
      if (month && description && amount && category) {
        expensesToInsert.push({
          user_id: userId,
          description,
          amount: parseFloat(amount),
          category,
          transaction_date: transactionDate || month + '-01',
          month: month,
          installment: 1,
          total_installments: 1,
          original_id: crypto.randomUUID(),
          original_amount: parseFloat(amount)
        });
      }
    }
    
    if (expensesToInsert.length > 0) {
      const { error } = await supabase
        .from('expenses')
        .insert(expensesToInsert);

      if (error) {
        console.error('Error importing CSV:', error);
        throw error;
      }
    }
  }

  async checkAchievements() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    const newAchievements = [];
    
    try {
      // Check for first expense achievement
      const { data: expenses } = await supabase
        .from('expenses')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (expenses && expenses.length >= 1) {
        const { data: existing } = await supabase
          .from('achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_id', 'first-expense')
          .single();

        if (!existing) {
          newAchievements.push({
            user_id: userId,
            achievement_id: 'first-expense',
            title: '🎉 Primer Gasto Registrado',
            description: 'Has registrado tu primer gasto'
          });
        }
      }

      // Check for goal completion achievement
      const completedGoals = this.data.goals.filter(goal => goal.current >= goal.target);
      if (completedGoals.length >= 1) {
        const { data: existing } = await supabase
          .from('achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_id', 'first-goal')
          .single();

        if (!existing) {
          newAchievements.push({
            user_id: userId,
            achievement_id: 'first-goal',
            title: '🎯 Primer Objetivo Cumplido',
            description: 'Has completado tu primer objetivo de ahorro'
          });
        }
      }

      // Check for extra income achievement
      const { data: extraIncomes } = await supabase
        .from('extra_incomes')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (extraIncomes && extraIncomes.length >= 1) {
        const { data: existing } = await supabase
          .from('achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_id', 'first-extra-income')
          .single();

        if (!existing) {
          newAchievements.push({
            user_id: userId,
            achievement_id: 'first-extra-income',
            title: '💰 Primer Ingreso Extra',
            description: 'Has registrado tu primer ingreso extra'
          });
        }
      }

      // Insert new achievements
      if (newAchievements.length > 0) {
        const { error } = await supabase
          .from('achievements')
          .insert(newAchievements);

        if (error) {
          console.error('Error adding achievements:', error);
        } else {
          await this.loadAchievements();
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }

  addMonths(dateString, months) {
    const [year, month] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1 + months, 1);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  getCategoryById(id) {
    return this.data.categories.find(cat => cat.id === id);
  }

  async deleteGoal(id) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      await this.loadGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  }

  async deleteCategory(id) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      // Check if category is being used
      const { data: expenses } = await supabase
        .from('expenses')
        .select('id')
        .eq('user_id', userId)
        .eq('category', id)
        .limit(1);

      if (expenses && expenses.length > 0) {
        throw new Error('No se puede eliminar una categoría que está siendo utilizada');
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      await this.loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Legacy methods for compatibility
  saveUserData() {
    // No longer needed with Supabase, but kept for compatibility
    console.log('Data automatically saved to Supabase');
  }

  getCurrentUser() {
    // Compatibility method
    const { data: { user } } = supabase.auth.getUser();
    return user?.email || null;
  }
}