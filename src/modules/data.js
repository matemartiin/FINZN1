import { supabase } from '../config/supabase.js';

export class DataManager {
  constructor() {
    this.currentUser = null;
  }

  async loadUserData() {
    const { data: { user } } = await supabase.auth.getUser();
    this.currentUser = user;
    
    // Ensure user has default categories
    if (user) {
      await this.ensureDefaultCategories();
    }
  }

  async ensureDefaultCategories() {
    if (!this.currentUser) return;

    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', this.currentUser.id);

    if (!categories || categories.length === 0) {
      const defaultCategories = [
        { name: 'Comida', icon: '🍔', color: '#ef4444' },
        { name: 'Transporte', icon: '🚗', color: '#3b82f6' },
        { name: 'Salud', icon: '💊', color: '#8b5cf6' },
        { name: 'Ocio', icon: '🎉', color: '#f59e0b' },
        { name: 'Supermercado', icon: '🛒', color: '#10b981' },
        { name: 'Servicios', icon: '📱', color: '#6b7280' },
        { name: 'Otros', icon: '📦', color: '#9ca3af' }
      ];

      const categoriesToInsert = defaultCategories.map(cat => ({
        ...cat,
        user_id: this.currentUser.id
      }));

      await supabase.from('categories').insert(categoriesToInsert);
    }
  }

  async addExpense(expense) {
    if (!this.currentUser) throw new Error('User not authenticated');

    const installmentAmount = expense.amount / expense.installments;
    const expenses = [];
    
    for (let i = 0; i < expense.installments; i++) {
      const installmentDate = this.addMonths(expense.date, i);
      
      expenses.push({
        user_id: this.currentUser.id,
        description: expense.description,
        amount: installmentAmount,
        category: expense.category,
        transaction_date: expense.transactionDate,
        month: installmentDate,
        installment: i + 1,
        total_installments: expense.installments,
        original_amount: expense.amount,
        recurring: expense.recurring && i === 0,
      });
    }

    const { error } = await supabase.from('expenses').insert(expenses);
    if (error) throw error;

    await this.checkAchievements();
  }

  async updateExpense(expenseId, expenseData, month) {
    if (!this.currentUser) throw new Error('User not authenticated');

    const { data: currentExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', expenseId)
      .eq('user_id', this.currentUser.id)
      .single();

    if (fetchError) throw fetchError;

    if (currentExpense.total_installments > 1) {
      // Update all installments
      const { error } = await supabase
        .from('expenses')
        .update({
          description: expenseData.description,
          amount: expenseData.amount / expenseData.installments,
          category: expenseData.category,
          transaction_date: expenseData.transactionDate,
          original_amount: expenseData.amount,
          total_installments: expenseData.installments,
          recurring: expenseData.recurring
        })
        .eq('original_id', currentExpense.original_id || currentExpense.id)
        .eq('user_id', this.currentUser.id);

      if (error) throw error;
    } else {
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
        .eq('user_id', this.currentUser.id);

      if (error) throw error;
    }
  }

  async deleteExpense(expenseId, month) {
    if (!this.currentUser) throw new Error('User not authenticated');

    const { data: expense, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', expenseId)
      .eq('user_id', this.currentUser.id)
      .single();

    if (fetchError) throw fetchError;

    if (expense.total_installments > 1) {
      // Delete all installments
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('original_id', expense.original_id || expense.id)
        .eq('user_id', this.currentUser.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', this.currentUser.id);

      if (error) throw error;
    }
  }

  async getExpenseById(expenseId, month) {
    if (!this.currentUser) return null;

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', expenseId)
      .eq('user_id', this.currentUser.id)
      .single();

    if (error) return null;
    return data;
  }

  async setFixedIncome(amount) {
    if (!this.currentUser) throw new Error('User not authenticated');

    const currentYear = new Date().getFullYear();
    const incomeRecords = [];

    for (let month = 1; month <= 12; month++) {
      const monthKey = `${currentYear}-${month.toString().padStart(2, '0')}`;
      incomeRecords.push({
        user_id: this.currentUser.id,
        month: monthKey,
        fixed_amount: amount,
        extra_amount: 0
      });
    }

    const { error } = await supabase
      .from('income')
      .upsert(incomeRecords, { onConflict: 'user_id,month' });

    if (error) throw error;
  }

  async addExtraIncome(extraIncome, month) {
    if (!this.currentUser) throw new Error('User not authenticated');

    // Add to extra_incomes table
    const { error: extraIncomeError } = await supabase
      .from('extra_incomes')
      .insert({
        user_id: this.currentUser.id,
        description: extraIncome.description,
        amount: extraIncome.amount,
        category: extraIncome.category,
        month: month
      });

    if (extraIncomeError) throw extraIncomeError;

    // Update income table
    const { data: currentIncome } = await supabase
      .from('income')
      .select('extra_amount')
      .eq('user_id', this.currentUser.id)
      .eq('month', month)
      .single();

    const newExtraAmount = (currentIncome?.extra_amount || 0) + extraIncome.amount;

    const { error: incomeError } = await supabase
      .from('income')
      .upsert({
        user_id: this.currentUser.id,
        month: month,
        fixed_amount: 0,
        extra_amount: newExtraAmount
      }, { onConflict: 'user_id,month' });

    if (incomeError) throw incomeError;

    await this.checkAchievements();
  }

  async addGoal(goal) {
    if (!this.currentUser) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('goals')
      .insert({
        user_id: this.currentUser.id,
        name: goal.name,
        target_amount: goal.target,
        current_amount: goal.current || 0
      });

    if (error) throw error;
    await this.checkAchievements();
  }

  async addCategory(category) {
    if (!this.currentUser) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('categories')
      .insert({
        user_id: this.currentUser.id,
        name: category.name,
        icon: category.icon,
        color: category.color
      });

    if (error) throw error;
  }

  async addSpendingLimit(limit) {
    if (!this.currentUser) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('spending_limits')
      .upsert({
        user_id: this.currentUser.id,
        category: limit.category,
        amount: limit.amount,
        warning_percentage: limit.warning
      }, { onConflict: 'user_id,category' });

    if (error) throw error;
  }

  async saveMonthlySavings(month, amount) {
    if (!this.currentUser) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('monthly_savings')
      .upsert({
        user_id: this.currentUser.id,
        month: month,
        amount: amount
      }, { onConflict: 'user_id,month' });

    if (error) throw error;
  }

  async getMonthlySavings(month) {
    if (!this.currentUser) return 0;

    const { data, error } = await supabase
      .from('monthly_savings')
      .select('amount')
      .eq('user_id', this.currentUser.id)
      .eq('month', month)
      .single();

    if (error) return 0;
    return data?.amount || 0;
  }

  async getAllMonthlySavings() {
    if (!this.currentUser) return {};

    const { data, error } = await supabase
      .from('monthly_savings')
      .select('month, amount')
      .eq('user_id', this.currentUser.id);

    if (error) return {};

    const savings = {};
    data.forEach(item => {
      savings[item.month] = item.amount;
    });
    return savings;
  }

  async getSpendingLimits() {
    if (!this.currentUser) return [];

    const { data, error } = await supabase
      .from('spending_limits')
      .select('*')
      .eq('user_id', this.currentUser.id);

    if (error) return [];
    return data || [];
  }

  async deleteSpendingLimit(id) {
    if (!this.currentUser) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('spending_limits')
      .delete()
      .eq('id', id)
      .eq('user_id', this.currentUser.id);

    if (error) throw error;
  }

  async getSpendingLimitForCategory(category) {
    if (!this.currentUser) return null;

    const { data, error } = await supabase
      .from('spending_limits')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .eq('category', category)
      .single();

    if (error) return null;
    return data;
  }

  async getExpenses(month) {
    if (!this.currentUser) return [];

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .eq('month', month)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
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
    
    const installments = expenses.filter(e => e.total_installments > 1).length;
    
    return {
      available: totalIncome - totalExpenses,
      totalIncome,
      totalExpenses,
      installments
    };
  }

  async getActiveInstallments(month) {
    const expenses = await this.getExpenses(month);
    const installments = expenses.filter(expense => expense.total_installments > 1);
    
    return installments.map(expense => {
      const progress = (expense.installment / expense.total_installments) * 100;
      const remainingInstallments = expense.total_installments - expense.installment;
      const remainingAmount = expense.amount * remainingInstallments;
      
      return {
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        originalAmount: expense.original_amount,
        category: expense.category,
        currentInstallment: expense.installment,
        totalInstallments: expense.total_installments,
        progress: Math.round(progress),
        remainingInstallments,
        remainingAmount,
        createdAt: expense.created_at,
        monthlyAmount: expense.amount
      };
    });
  }

  async getIncome(month) {
    if (!this.currentUser) return { fixed: 0, extra: 0 };

    const { data, error } = await supabase
      .from('income')
      .select('fixed_amount, extra_amount')
      .eq('user_id', this.currentUser.id)
      .eq('month', month)
      .single();

    if (error) return { fixed: 0, extra: 0 };
    return {
      fixed: data?.fixed_amount || 0,
      extra: data?.extra_amount || 0
    };
  }

  async getExtraIncomes(month) {
    if (!this.currentUser) return [];

    const { data, error } = await supabase
      .from('extra_incomes')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .eq('month', month)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  }

  async getAllExtraIncomes() {
    if (!this.currentUser) return [];

    const { data, error } = await supabase
      .from('extra_incomes')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  }

  async getGoals() {
    if (!this.currentUser) return [];

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data?.map(goal => ({
      id: goal.id,
      name: goal.name,
      target: goal.target_amount,
      current: goal.current_amount,
      createdAt: goal.created_at
    })) || [];
  }

  async getCategories() {
    if (!this.currentUser) return [];

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .order('name');

    if (error) return [];
    return data || [];
  }

  async getStats() {
    const monthlySavings = await this.getAllMonthlySavings();
    const totalSavings = Object.values(monthlySavings).reduce((sum, savings) => sum + savings, 0);

    // Get all expenses for average calculation
    if (!this.currentUser) return { totalSavings: 0, monthlyAverage: 0 };

    const { data: allExpenses, error } = await supabase
      .from('expenses')
      .select('amount, month')
      .eq('user_id', this.currentUser.id);

    if (error) return { totalSavings, monthlyAverage: 0 };

    const monthlyTotals = {};
    allExpenses.forEach(expense => {
      monthlyTotals[expense.month] = (monthlyTotals[expense.month] || 0) + expense.amount;
    });

    const monthlyAverage = Object.keys(monthlyTotals).length > 0 
      ? Object.values(monthlyTotals).reduce((sum, total) => sum + total, 0) / Object.keys(monthlyTotals).length
      : 0;

    return { totalSavings, monthlyAverage };
  }

  async getAchievements() {
    if (!this.currentUser) return [];

    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  }

  async getMonthlyTrend() {
    if (!this.currentUser) return [];

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
    const goals = await this.getGoals();
    
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
    if (!this.currentUser) return '';

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
    
    // Get all expenses
    const { data: allExpenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .order('created_at', { ascending: false });

    if (allExpenses) {
      allExpenses.forEach(expense => {
        const createdDate = new Date(expense.created_at).toLocaleDateString('es-ES');
        const transactionDate = new Date(expense.transaction_date).toLocaleDateString('es-ES');
        
        rows.push([
          expense.month,
          transactionDate,
          expense.description,
          expense.amount.toFixed(2),
          expense.category,
          expense.installment || 1,
          expense.total_installments || 1,
          (expense.original_amount || expense.amount).toFixed(2),
          createdDate,
          'Gasto'
        ]);
      });
    }

    // Get all extra incomes
    const { data: allExtraIncomes } = await supabase
      .from('extra_incomes')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .order('created_at', { ascending: false });

    if (allExtraIncomes) {
      allExtraIncomes.forEach(income => {
        const createdDate = new Date(income.created_at).toLocaleDateString('es-ES');
        
        rows.push([
          income.month,
          income.month + '-01',
          income.description,
          income.amount.toFixed(2),
          income.category,
          1,
          1,
          income.amount.toFixed(2),
          createdDate,
          'Ingreso Extra'
        ]);
      });
    }

    // Get all fixed incomes
    const { data: allIncomes } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .gt('fixed_amount', 0);

    if (allIncomes) {
      allIncomes.forEach(income => {
        rows.push([
          income.month,
          income.month + '-01',
          'Ingreso Fijo Mensual',
          income.fixed_amount.toFixed(2),
          'Ingreso',
          1,
          1,
          income.fixed_amount.toFixed(2),
          'Automático',
          'Ingreso Fijo'
        ]);
      });
    }
    
    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  async importFromCSV(csvText) {
    if (!this.currentUser) throw new Error('User not authenticated');

    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(cell => cell.replace(/"/g, ''));
    
    const expensesToInsert = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(cell => cell.replace(/"/g, ''));
      const [month, transactionDate, description, amount, category] = values;
      
      if (month && description && amount && category) {
        expensesToInsert.push({
          user_id: this.currentUser.id,
          description,
          amount: parseFloat(amount),
          category,
          transaction_date: transactionDate || month + '-01',
          month: month,
          installment: 1,
          total_installments: 1
        });
      }
    }
    
    if (expensesToInsert.length > 0) {
      const { error } = await supabase.from('expenses').insert(expensesToInsert);
      if (error) throw error;
    }
  }

  async checkAchievements() {
    if (!this.currentUser) return;

    const newAchievements = [];
    
    // Get current achievements
    const { data: currentAchievements } = await supabase
      .from('achievements')
      .select('achievement_id')
      .eq('user_id', this.currentUser.id);

    const achievementIds = currentAchievements?.map(a => a.achievement_id) || [];
    
    // First expense achievement
    const { data: expenses } = await supabase
      .from('expenses')
      .select('id')
      .eq('user_id', this.currentUser.id)
      .limit(1);

    if (expenses && expenses.length >= 1 && !achievementIds.includes('first-expense')) {
      newAchievements.push({
        user_id: this.currentUser.id,
        achievement_id: 'first-expense',
        title: '🎉 Primer Gasto Registrado',
        description: 'Has registrado tu primer gasto'
      });
    }
    
    // Goal completion achievement
    const { data: completedGoals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .gte('current_amount', supabase.raw('target_amount'));

    if (completedGoals && completedGoals.length >= 1 && !achievementIds.includes('first-goal')) {
      newAchievements.push({
        user_id: this.currentUser.id,
        achievement_id: 'first-goal',
        title: '🎯 Primer Objetivo Cumplido',
        description: 'Has completado tu primer objetivo de ahorro'
      });
    }
    
    // Extra income achievement
    const { data: extraIncomes } = await supabase
      .from('extra_incomes')
      .select('id')
      .eq('user_id', this.currentUser.id)
      .limit(1);

    if (extraIncomes && extraIncomes.length >= 1 && !achievementIds.includes('first-extra-income')) {
      newAchievements.push({
        user_id: this.currentUser.id,
        achievement_id: 'first-extra-income',
        title: '💰 Primer Ingreso Extra',
        description: 'Has registrado tu primer ingreso extra'
      });
    }

    // Installments achievement
    const { data: installmentExpenses } = await supabase
      .from('expenses')
      .select('id')
      .eq('user_id', this.currentUser.id)
      .gt('total_installments', 1)
      .limit(1);

    if (installmentExpenses && installmentExpenses.length >= 1 && !achievementIds.includes('first-installment')) {
      newAchievements.push({
        user_id: this.currentUser.id,
        achievement_id: 'first-installment',
        title: '💳 Primera Cuota',
        description: 'Has registrado tu primer gasto en cuotas'
      });
    }
    
    if (newAchievements.length > 0) {
      const { error } = await supabase.from('achievements').insert(newAchievements);
      if (error) console.error('Error saving achievements:', error);
    }
  }

  addMonths(dateString, months) {
    const [year, month] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1 + months, 1);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  async deleteGoal(id) {
    if (!this.currentUser) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', this.currentUser.id);

    if (error) throw error;
  }

  async deleteCategory(id) {
    if (!this.currentUser) throw new Error('User not authenticated');

    // Check if category is being used
    const { data: expenses } = await supabase
      .from('expenses')
      .select('id')
      .eq('user_id', this.currentUser.id)
      .eq('category', id)
      .limit(1);

    if (expenses && expenses.length > 0) {
      throw new Error('No se puede eliminar una categoría que está siendo utilizada');
    }
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', this.currentUser.id);

    if (error) throw error;
  }
}