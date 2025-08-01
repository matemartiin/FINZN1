import { supabase } from '../config/supabase.js';

export class DataManager {
  constructor() {
    this.supabase = supabase; // Expose supabase for other modules
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
      
      // Load data in correct order - categories first, then everything else
      await this.loadCategories();
      await this.loadSpendingLimits();
      await this.loadGoals();
      await this.loadAchievements();
      
      // Load current month data
      await this.loadExpenses(this.currentMonth);
      await this.loadIncome(this.currentMonth);
      await this.loadExtraIncomes(this.currentMonth);
      
      console.log('✅ User data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    }
  }

  getCurrentUserId() {
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
      console.log('🏷️ Loading categories for user:', userId);
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error loading categories:', error.message || error);
        // If it's a connection error, create default categories locally
        if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('Supabase not configured'))) {
          console.log('🔄 Using default categories due to connection error');
          this.data.categories = this.getDefaultCategories();
          return;
        }
        return;
      }

      if (data && data.length > 0) {
        this.data.categories = data.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color
        }));
        console.log('✅ Categories loaded from database:', this.data.categories.length);
      } else {
        console.log('📝 No categories found, creating defaults');
        // Only try to create if we have a real connection
        if (error || !data) {
          console.log('🔄 Using default categories as fallback');
          this.data.categories = this.getDefaultCategories();
        } else {
          await this.createDefaultCategories();
        }
      }
    } catch (error) {
      console.error('❌ Error in loadCategories:', error);
      // Fallback to default categories
      console.log('🔄 Using default categories as fallback');
      this.data.categories = this.getDefaultCategories();
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
      console.log('💳 Loading expenses for month:', month);
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
      console.log('💳 Expenses loaded:', expenses.length, 'items');
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
      console.log('💳 Adding expense with data:', expenseData);
      
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

      console.log('💳 Expense data prepared:', expense);
      
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select();

      if (error) {
        console.error('Error adding expense:', error);
        return false;
      }

      console.log('✅ Expense added successfully:', data[0]);
      
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

  // Income - FIXED CALCULATION
  async loadIncome(month) {
    const userId = this.getCurrentUserId();
    if (!userId) return { fixed: 0, extra: 0 };

    try {
      console.log('💰 Loading income for month:', month);
      
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

      console.log('💰 Income loaded:', income);
      this.data.income[month] = income;
      
      return income;
    } catch (error) {
      console.error('Error in loadIncome:', error);
      return { fixed: 0, extra: 0 };
    }
  }

  async addFixedIncome(month, amount) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      console.log('💰 Adding fixed income:', amount, 'for month:', month);
      
      const { data, error } = await supabase
        .from('incomes')
        .upsert({
          user_id: userId,
          month: month,
          fixed_amount: parseFloat(amount),
          extra_amount: 0
        }, {
          onConflict: 'user_id,month'
        })
        .select();

      if (error) {
        console.error('Error adding fixed income:', error);
        return false;
      }

      // Update local data with the actual values from database
      if (data && data.length > 0) {
        this.data.income[month] = {
          fixed: parseFloat(data[0].fixed_amount) || 0,
          extra: parseFloat(data[0].extra_amount) || 0
        };
      }

      console.log('✅ Fixed income added successfully');
      return true;
    } catch (error) {
      console.error('Error in addFixedIncome:', error);
      return false;
    }
  }

  async addExtraIncome(month, incomeData) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      console.log('💵 Adding extra income:', incomeData);
      
      const extraIncome = {
        user_id: userId,
        description: incomeData.description,
        amount: parseFloat(incomeData.amount),
        category: incomeData.category,
        month: month
      };

      const { data, error } = await supabase
        .from('extra_incomes')
        .insert([extraIncome])
        .select();

      if (error) {
        console.error('Error adding extra income:', error);
        return false;
      }

      if (!this.data.extraIncomes[month]) {
        this.data.extraIncomes[month] = [];
      }
      this.data.extraIncomes[month].unshift(data[0]);

      console.log('✅ Extra income added successfully');
      return true;
    } catch (error) {
      console.error('Error in addExtraIncome:', error);
      return false;
    }
  }

  getIncome(month) {
    return this.data.income[month] || { fixed: 0, extra: 0 };
  }

  // Extra Incomes - FIXED LOADING
  async loadExtraIncomes(month) {
    const userId = this.getCurrentUserId();
    if (!userId) return [];

    try {
      console.log('💵 Loading extra incomes for month:', month);
      
      const { data, error } = await supabase
        .from('extra_incomes')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading extra incomes:', error);
        return [];
      }

      const extraIncomes = data || [];
      this.data.extraIncomes[month] = extraIncomes;
      console.log('💵 Extra incomes loaded:', extraIncomes.length, 'items');
      return extraIncomes;
    } catch (error) {
      console.error('Error in loadExtraIncomes:', error);
      return [];
    }
  }

  getExtraIncomes(month) {
    return this.data.extraIncomes[month] || [];
  }

  // Trend Data
  async getTrendData() {
    const userId = this.getCurrentUserId();
    if (!userId) return [];

    try {
      const months = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        months.push(monthKey);
      }

      const trendData = [];
      
      for (const month of months) {
        const { data, error } = await supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', userId)
          .eq('month', month);

        if (error) {
          console.error('Error loading trend data for month:', month, error);
          continue;
        }

        const total = (data || []).reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
        const monthName = new Date(month + '-01').toLocaleDateString('es-ES', { month: 'short' });
        
        trendData.push({
          month: monthName,
          amount: total
        });
      }

      return trendData;
    } catch (error) {
      console.error('Error in getTrendData:', error);
      return [];
    }
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
        console.error('Error loading goals:', error.message || error);
        // If it's a connection error, use empty array as fallback
        if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('Supabase not configured'))) {
          console.log('🔄 Using empty goals due to connection error');
          this.data.goals = [];
          return;
        }
        return;
      }

      this.data.goals = data || [];
    } catch (error) {
      console.error('Error in loadGoals:', error);
      // Fallback to empty array on any error
      console.log('🔄 Using empty goals as fallback');
      this.data.goals = [];
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

  // Spending Limits - FIXED
  async loadSpendingLimits() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      console.log('🚦 Loading spending limits for user:', userId);
      
      const { data, error } = await supabase
        .from('spending_limits')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading spending limits:', error.message || error);
        // If it's a connection error, use empty array as fallback
        if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('Supabase not configured'))) {
          console.log('🔄 Using empty spending limits due to connection error');
          this.data.spendingLimits = [];
          return;
        }
        return;
      }

      this.data.spendingLimits = data || [];
      console.log('🚦 Spending limits loaded:', this.data.spendingLimits.length, 'items');
    } catch (error) {
      console.error('Error in loadSpendingLimits:', error);
      // Fallback to empty array on any error
      console.log('🔄 Using empty spending limits as fallback');
      this.data.spendingLimits = [];
    }
  }

  getSpendingLimits() {
    return this.data.spendingLimits;
  }

  async addSpendingLimit(limitData) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      console.log('🚦 Adding spending limit:', limitData);
      
      const limit = {
        user_id: userId,
        category: limitData.category,
        amount: parseFloat(limitData.amount),
        warning_percentage: parseInt(limitData.warningPercentage) || 80
      };

      const { data, error } = await supabase
        .from('spending_limits')
        .insert([limit])
        .select();

      if (error) {
        console.error('Error adding spending limit:', error);
        return false;
      }

      this.data.spendingLimits.unshift(data[0]);
      console.log('✅ Spending limit added successfully');
      return true;
    } catch (error) {
      console.error('Error in addSpendingLimit:', error);
      return false;
    }
  }

  async deleteSpendingLimit(limitId) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('spending_limits')
        .delete()
        .eq('id', limitId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting spending limit:', error);
        return false;
      }

      this.data.spendingLimits = this.data.spendingLimits.filter(limit => limit.id !== limitId);
      return true;
    } catch (error) {
      console.error('Error in deleteSpendingLimit:', error);
      return false;
    }
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
        console.error('Error loading achievements:', error.message || error);
        // If it's a connection error, use empty array as fallback
        if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('Supabase not configured'))) {
          console.log('🔄 Using empty achievements due to connection error');
          this.data.achievements = [];
          return;
        }
        return;
      }

      this.data.achievements = data || [];
    } catch (error) {
      console.error('Error in loadAchievements:', error);
      // Fallback to empty array on any error
      console.log('🔄 Using empty achievements as fallback');
      this.data.achievements = [];
    }
  }

  getAchievements() {
    return this.data.achievements;
  }

  // Categories Management
  async addCategory(categoryData) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      console.log('🏷️ Adding category:', categoryData);
      
      const category = {
        user_id: userId,
        name: categoryData.name,
        icon: categoryData.icon,
        color: categoryData.color
      };

      const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select();

      if (error) {
        console.error('Error adding category:', error);
        return false;
      }

      this.data.categories.push(data[0]);
      console.log('✅ Category added successfully');
      return true;
    } catch (error) {
      console.error('Error in addCategory:', error);
      return false;
    }
  }

  async deleteCategory(categoryId) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting category:', error);
        return false;
      }

      this.data.categories = this.data.categories.filter(cat => cat.id !== categoryId);
      return true;
    } catch (error) {
      console.error('Error in deleteCategory:', error);
      return false;
    }
  }

  // Export/Import Data
  exportDataToCSV(type = 'complete') {
    try {
      let data = [];
      let filename = '';
      let headers = [];

      if (type === 'complete') {
        // Export complete financial data
        headers = [
          'tipo', 'descripcion', 'monto', 'categoria', 'fecha', 'mes', 
          'cuota_actual', 'total_cuotas', 'monto_original', 'es_recurrente'
        ];
        
        const allData = [];
        
        // Add all expenses
        Object.values(this.data.expenses).forEach(monthExpenses => {
          monthExpenses.forEach(expense => {
            allData.push([
              'gasto',
              expense.description,
              expense.amount,
              expense.category,
              expense.transaction_date,
              expense.month,
              expense.installment || 1,
              expense.total_installments || 1,
              expense.original_amount || expense.amount,
              expense.recurring ? 'si' : 'no'
            ]);
          });
        });
        
        // Add fixed incomes
        Object.entries(this.data.income).forEach(([month, income]) => {
          if (income.fixed > 0) {
            allData.push([
              'ingreso_fijo',
              'Sueldo mensual',
              income.fixed,
              'sueldo',
              `${month}-01`,
              month,
              1,
              1,
              income.fixed,
              'si'
            ]);
          }
        });
        
        // Add extra incomes
        Object.values(this.data.extraIncomes).forEach(monthIncomes => {
          monthIncomes.forEach(income => {
            allData.push([
              'ingreso_extra',
              income.description,
              income.amount,
              income.category,
              income.created_at ? income.created_at.split('T')[0] : `${income.month}-01`,
              income.month,
              1,
              1,
              income.amount,
              'no'
            ]);
          });
        });
        
        data = allData;
        filename = 'finzn_datos_completos.csv';
        
      } else if (type === 'expenses') {
        // Export all expenses
        const allExpenses = [];
        Object.values(this.data.expenses).forEach(monthExpenses => {
          allExpenses.push(...monthExpenses);
        });
        
        headers = ['descripcion', 'monto', 'categoria', 'fecha', 'mes', 'cuota_actual', 'total_cuotas', 'monto_original'];
        data = allExpenses.map(expense => [
          expense.description,
          expense.amount,
          expense.category,
          expense.transaction_date,
          expense.month,
          expense.installment || 1,
          expense.total_installments || 1,
          expense.original_amount || expense.amount
        ]);
        filename = 'finzn_gastos.csv';
        
      } else if (type === 'incomes') {
        // Export all incomes
        const allIncomes = [];
        
        // Fixed incomes
        Object.entries(this.data.income).forEach(([month, income]) => {
          if (income.fixed > 0) {
            allIncomes.push(['fijo', income.fixed, 'Sueldo mensual', month, `${month}-01`]);
          }
        });
        
        // Extra incomes
        Object.values(this.data.extraIncomes).forEach(monthIncomes => {
          monthIncomes.forEach(income => {
            allIncomes.push(['extra', income.amount, income.description, income.month, income.created_at ? income.created_at.split('T')[0] : `${income.month}-01`]);
          });
        });
        
        headers = ['tipo', 'monto', 'descripcion', 'mes', 'fecha'];
        data = allIncomes;
        filename = 'finzn_ingresos.csv';
      }

      // Create CSV content
      const csvContent = [headers, ...data]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return true;
    } catch (error) {
      console.error('Error exporting data:', error);
      return false;
    }
  }

  async importDataFromCSV(file, type = 'expenses') {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('El archivo CSV debe tener al menos una fila de datos');
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
      const dataRows = lines.slice(1);
      
      let imported = 0;
      let errors = 0;
      
      console.log('📥 CSV Headers detected:', headers);
      
      // Auto-detect CSV format based on headers
      const detectedFormat = this.detectCSVFormat(headers);
      console.log('📥 Detected format:', detectedFormat);

      for (const row of dataRows) {
        try {
          // Better CSV parsing that handles commas inside quotes
          const values = this.parseCSVRow(row);
          
          if (values.length < 2) continue; // Skip invalid rows
          
          // Process based on detected format
          if (detectedFormat === 'complete') {
            await this.processCompleteFormatRow(headers, values);
            imported++;
          } else if (detectedFormat === 'expenses' || type === 'expenses') {
            await this.processExpenseRow(headers, values);
            imported++;
          } else if (detectedFormat === 'incomes' || type === 'incomes') {
            await this.processIncomeRow(headers, values);
            imported++;
          } else if (detectedFormat === 'bank') {
            await this.processBankFormatRow(headers, values);
            imported++;
          } else {
            // Try to auto-detect row type
            const rowType = this.detectRowType(values);
            if (rowType === 'expense') {
              await this.processExpenseRow(headers, values);
              imported++;
            } else if (rowType === 'income') {
              await this.processIncomeRow(headers, values);
              imported++;
            }
          }
        } catch (rowError) {
          console.error('Error importing row:', row, rowError);
          errors++;
        }
      }

      return { imported, errors };
    } catch (error) {
      console.error('Error importing CSV:', error);
      throw error;
    }
  }
  
  parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result.map(v => v.replace(/"/g, ''));
  }
  
  detectCSVFormat(headers) {
    const headerStr = headers.join(',').toLowerCase();
    
    // Complete FINZN format
    if (headerStr.includes('tipo') && headerStr.includes('cuota_actual') && headerStr.includes('total_cuotas')) {
      return 'complete';
    }
    
    // Bank statement format
    if (headerStr.includes('fecha') && (headerStr.includes('debito') || headerStr.includes('credito') || headerStr.includes('movimiento'))) {
      return 'bank';
    }
    
    // Expense format
    if (headerStr.includes('gasto') || headerStr.includes('categoria') || headerStr.includes('descripcion')) {
      return 'expenses';
    }
    
    // Income format
    if (headerStr.includes('ingreso') || headerStr.includes('sueldo')) {
      return 'incomes';
    }
    
    return 'unknown';
  }
  
  detectRowType(values) {
    if (values.length < 2) return 'unknown';
    
    const firstValue = values[0].toLowerCase();
    const amountValue = parseFloat(values[1]);
    
    // Check if first column indicates type
    if (firstValue.includes('gasto') || firstValue.includes('expense')) {
      return 'expense';
    }
    
    if (firstValue.includes('ingreso') || firstValue.includes('income') || firstValue.includes('sueldo')) {
      return 'income';
    }
    
    // If amount is negative, likely an expense
    if (amountValue < 0) {
      return 'expense';
    }
    
    return 'expense'; // Default to expense
  }
  
  async processCompleteFormatRow(headers, values) {
    const data = {};
    headers.forEach((header, index) => {
      data[header] = values[index] || '';
    });
    
    const tipo = data.tipo || data.type || '';
    
    if (tipo.includes('gasto') || tipo.includes('expense')) {
      const expenseData = {
        description: data.descripcion || data.description || 'Gasto importado',
        amount: Math.abs(parseFloat(data.monto || data.amount || 0)),
        category: data.categoria || data.category || 'Otros',
        transactionDate: this.parseDate(data.fecha || data.date),
        month: data.mes || data.month || this.parseDate(data.fecha || data.date).substring(0, 7),
        installment: parseInt(data.cuota_actual || data.installment || 1),
        totalInstallments: parseInt(data.total_cuotas || data.total_installments || 1),
        originalAmount: parseFloat(data.monto_original || data.original_amount) || Math.abs(parseFloat(data.monto || data.amount || 0)),
        recurring: (data.es_recurrente || data.recurring || '').toLowerCase() === 'si' || (data.es_recurrente || data.recurring || '').toLowerCase() === 'true'
      };
      
      await this.addExpense(expenseData);
    } else if (tipo.includes('ingreso') || tipo.includes('income')) {
      const month = data.mes || data.month || this.parseDate(data.fecha || data.date).substring(0, 7);
      const amount = Math.abs(parseFloat(data.monto || data.amount || 0));
      
      if (tipo.includes('fijo') || tipo.includes('fixed')) {
        await this.addFixedIncome(month, amount);
      } else {
        const incomeData = {
          description: data.descripcion || data.description || 'Ingreso importado',
          amount: amount,
          category: data.categoria || data.category || 'other'
        };
        await this.addExtraIncome(month, incomeData);
      }
    }
  }
  
  async processExpenseRow(headers, values) {
    const data = {};
    headers.forEach((header, index) => {
      data[header] = values[index] || '';
    });
    
    const expenseData = {
      description: data.descripcion || data.description || data.concepto || values[0] || 'Gasto importado',
      amount: Math.abs(parseFloat(data.monto || data.amount || data.importe || values[1] || 0)),
      category: data.categoria || data.category || data.tipo || 'Otros',
      transactionDate: this.parseDate(data.fecha || data.date || data.transaction_date),
      month: data.mes || data.month || this.parseDate(data.fecha || data.date || data.transaction_date).substring(0, 7),
      installment: parseInt(data.cuota_actual || data.installment || 1),
      totalInstallments: parseInt(data.total_cuotas || data.total_installments || 1),
      originalAmount: parseFloat(data.monto_original || data.original_amount) || Math.abs(parseFloat(data.monto || data.amount || values[1] || 0)),
      recurring: false
    };
    
    await this.addExpense(expenseData);
  }
  
  async processIncomeRow(headers, values) {
    const data = {};
    headers.forEach((header, index) => {
      data[header] = values[index] || '';
    });
    
    const month = data.mes || data.month || this.parseDate(data.fecha || data.date).substring(0, 7);
    const amount = Math.abs(parseFloat(data.monto || data.amount || data.importe || values[1] || 0));
    const tipo = (data.tipo || data.type || values[0] || '').toLowerCase();
    
    if (tipo.includes('fijo') || tipo.includes('fixed') || tipo.includes('sueldo')) {
      await this.addFixedIncome(month, amount);
    } else {
      const incomeData = {
        description: data.descripcion || data.description || data.concepto || 'Ingreso importado',
        amount: amount,
        category: data.categoria || data.category || 'other'
      };
      await this.addExtraIncome(month, incomeData);
    }
  }
  
  async processBankFormatRow(headers, values) {
    const data = {};
    headers.forEach((header, index) => {
      data[header] = values[index] || '';
    });
    
    const amount = parseFloat(data.monto || data.amount || data.importe || values[1] || 0);
    const description = data.descripcion || data.description || data.concepto || data.detalle || values[0] || 'Movimiento bancario';
    const date = this.parseDate(data.fecha || data.date);
    const month = date.substring(0, 7);
    
    if (amount < 0) {
      // Negative amount = expense
      const expenseData = {
        description: description,
        amount: Math.abs(amount),
        category: this.categorizeTransaction(description),
        transactionDate: date,
        month: month,
        installment: 1,
        totalInstallments: 1,
        recurring: false
      };
      await this.addExpense(expenseData);
    } else if (amount > 0) {
      // Positive amount = income
      const incomeData = {
        description: description,
        amount: amount,
        category: 'other'
      };
      await this.addExtraIncome(month, incomeData);
    }
  }
  
  parseDate(dateStr) {
    if (!dateStr) {
      return new Date().toISOString().split('T')[0];
    }
    
    // Try different date formats
    const formats = [
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
      /(\d{4})\/(\d{2})\/(\d{2})/, // YYYY/MM/DD
    ];
    
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0] || format === formats[3]) {
          // YYYY-MM-DD or YYYY/MM/DD
          return `${match[1]}-${match[2]}-${match[3]}`;
        } else {
          // DD/MM/YYYY or DD-MM-YYYY
          return `${match[3]}-${match[2]}-${match[1]}`;
        }
      }
    }
    
    // If no format matches, try to parse as Date
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.warn('Could not parse date:', dateStr);
    }
    
    return new Date().toISOString().split('T')[0];
  }
  
  categorizeTransaction(description) {
    const desc = description.toLowerCase();
    
    if (desc.includes('supermercado') || desc.includes('market') || desc.includes('grocery')) {
      return 'Supermercado';
    }
    if (desc.includes('restaurant') || desc.includes('comida') || desc.includes('food')) {
      return 'Comida';
    }
    if (desc.includes('transporte') || desc.includes('uber') || desc.includes('taxi') || desc.includes('bus')) {
      return 'Transporte';
    }
    if (desc.includes('farmacia') || desc.includes('hospital') || desc.includes('medic')) {
      return 'Salud';
    }
    if (desc.includes('cine') || desc.includes('teatro') || desc.includes('entretenimiento')) {
      return 'Ocio';
    }
    if (desc.includes('telefono') || desc.includes('internet') || desc.includes('luz') || desc.includes('gas')) {
      return 'Servicios';
    }
    
    return 'Otros';
  }

  // Balance calculations - FIXED
  calculateBalance(month) {
    console.log('💰 Calculating balance for month:', month);
    
    const expenses = this.getExpenses(month);
    const income = this.getIncome(month);
    const extraIncomes = this.getExtraIncomes(month);
    
    console.log('💰 Balance calculation data:', {
      expenses: expenses.length,
      income,
      extraIncomes: extraIncomes.length
    });
    
    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => {
      const amount = parseFloat(expense.amount) || 0;
      return sum + amount;
    }, 0);
    
    // Calculate total income (fixed + extra from incomes table + extra_incomes table)
    const fixedIncome = parseFloat(income.fixed) || 0;
    const extraFromIncomes = parseFloat(income.extra) || 0;
    const extraFromTable = extraIncomes.reduce((sum, extraIncome) => {
      const amount = parseFloat(extraIncome.amount) || 0;
      return sum + amount;
    }, 0);
    
    const totalIncome = fixedIncome + extraFromIncomes + extraFromTable;
    const available = totalIncome - totalExpenses;
    
    // Count installments
    const installments = expenses.filter(exp => exp.total_installments > 1).length;
    
    const result = {
      totalIncome,
      totalExpenses,
      available,
      installments
    };
    
    console.log('💰 Balance calculated:', result);
    return result;
  }

  // Category analysis
  getExpensesByCategory(month) {
    const expenses = this.getExpenses(month);
    const categoryTotals = {};
    
    expenses.forEach(expense => {
      const category = expense.category;
      const amount = parseFloat(expense.amount) || 0;
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });
    
    return categoryTotals;
  }

  // Check spending limits
  checkSpendingLimits(month) {
    const expenses = this.getExpenses(month);
    const limits = this.getSpendingLimits();
    const alerts = [];

    limits.forEach(limit => {
      const categoryExpenses = expenses.filter(exp => exp.category === limit.category);
      const currentSpent = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const percentage = (currentSpent / limit.amount) * 100;

      if (percentage >= 100) {
        alerts.push({
          type: 'danger',
          category: limit.category,
          message: `Has superado el límite de ${limit.category}`,
          percentage: percentage.toFixed(1)
        });
      } else if (percentage >= limit.warning_percentage) {
        alerts.push({
          type: 'warning',
          category: limit.category,
          message: `Te acercas al límite de ${limit.category}`,
          percentage: percentage.toFixed(1)
        });
      }
    });
    return alerts;
  }
}