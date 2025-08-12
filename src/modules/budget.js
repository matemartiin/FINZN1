export class BudgetManager {
  constructor() {
    this.budgets = [];
    this.currentMonth = this.getCurrentMonth();
  }

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  getCurrentUserId() {
    return window.app?.auth?.getCurrentUserId() || null;
  }

  // Load budgets from Supabase
  async loadBudgets() {
    const userId = this.getCurrentUserId();
    if (!userId) return [];

    try {
      console.log('💰 Loading budgets for user:', userId);
      
      const { supabase } = await import('../config/supabase.js');
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'paused'])
        .order('created_at', { ascending: false });

      if (error) {
        // Check if table doesn't exist
        if (error.code === '42P01' || (error.message && error.message.includes('relation "public.budgets" does not exist'))) {
          console.error('❌ Budget Error: Tabla "budgets" no encontrada en Supabase. Verifica que las migraciones se hayan ejecutado correctamente.');
          console.warn('⚠️ Tabla "budgets" no encontrada en Supabase. Créala manualmente en tu dashboard.');
          return [];
        }
        console.error('❌ Budget Error: Error al cargar presupuestos desde Supabase:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          userId: userId
        });
        console.error('Error loading budgets:', error);
        return [];
      }

      this.budgets = data || [];
      console.log('💰 Budgets loaded:', this.budgets.length, 'items');
      
      if (this.budgets.length === 0) {
        console.log('ℹ️ Budget Info: No se encontraron presupuestos para el usuario. Esto es normal para usuarios nuevos.');
      }
      
      return this.budgets;
    } catch (error) {
      console.error('❌ Budget Error: Excepción al cargar presupuestos:', {
        error: error.message,
        stack: error.stack,
        userId: userId
      });
      console.error('Error in loadBudgets:', error);
      return [];
    }
  }

  // Add new budget to Supabase
  async addBudget(budgetData) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      console.log('💰 Adding budget:', budgetData);
      
      const { supabase } = await import('../config/supabase.js');
      const budget = {
        user_id: userId,
        name: budgetData.name,
        category: budgetData.category,
        amount: parseFloat(budgetData.amount),
        start_date: budgetData.start_date,
        end_date: budgetData.end_date,
        status: 'active',
        ai_recommended: budgetData.ai_recommended || false
      };

      const { data, error } = await supabase
        .from('budgets')
        .insert([budget])
        .select();

      if (error) {
        // Check if table doesn't exist
        if (error.code === '42P01' || (error.message && error.message.includes('relation "public.budgets" does not exist'))) {
          console.error('❌ Budget Error: No se puede agregar presupuesto - tabla "budgets" no existe. Ejecuta las migraciones de Supabase.');
          console.warn('⚠️ Tabla "budgets" no encontrada. No se puede agregar presupuesto.');
          return false;
        }
        console.error('❌ Budget Error: Fallo al insertar presupuesto en Supabase:', {
          code: error.code,
          message: error.message,
          details: error.details,
          budgetData: budget,
          userId: userId
        });
        console.error('Error adding budget:', error);
        return false;
      }

      if (!data || data.length === 0) {
        console.error('❌ Budget Error: Supabase no devolvió datos después de insertar el presupuesto');
        return false;
      }
      
      console.log('✅ Budget added successfully:', data[0]);
      this.budgets.unshift(data[0]);
      return true;
    } catch (error) {
      console.error('❌ Budget Error: Excepción al agregar presupuesto:', {
        error: error.message,
        stack: error.stack,
        budgetData: budgetData,
        userId: userId
      });
      console.error('Error in addBudget:', error);
      return false;
    }
  }

  // Update existing budget
  async updateBudget(budgetId, updates) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      console.log('💰 Updating budget:', budgetId, updates);
      
      const { supabase } = await import('../config/supabase.js');
      const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', budgetId)
        .eq('user_id', userId)
        .select();

      if (error) {
        // Check if table doesn't exist
        if (error.code === '42P01' || (error.message && error.message.includes('relation "public.budgets" does not exist'))) {
          console.error('❌ Budget Error: No se puede actualizar presupuesto - tabla "budgets" no existe.');
          console.warn('⚠️ Tabla "budgets" no encontrada. No se puede actualizar presupuesto.');
          return false;
        }
        console.error('❌ Budget Error: Fallo al actualizar presupuesto en Supabase:', {
          code: error.code,
          message: error.message,
          details: error.details,
          budgetId: budgetId,
          updates: updates,
          userId: userId
        });
        console.error('Error updating budget:', error);
        return false;
      }

      if (!data || data.length === 0) {
        console.error('❌ Budget Error: No se encontró el presupuesto para actualizar o no se devolvieron datos');
        return false;
      }
      
      // Update local data
      const budgetIndex = this.budgets.findIndex(budget => budget.id === budgetId);
      if (budgetIndex !== -1) {
        this.budgets[budgetIndex] = { ...this.budgets[budgetIndex], ...data[0] };
      } else {
        console.warn('⚠️ Budget Warning: Presupuesto actualizado en Supabase pero no encontrado en datos locales');
      }

      console.log('✅ Budget updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Budget Error: Excepción al actualizar presupuesto:', {
        error: error.message,
        stack: error.stack,
        budgetId: budgetId,
        updates: updates,
        userId: userId
      });
      console.error('Error in updateBudget:', error);
      return false;
    }
  }

  // Delete budget
  async deleteBudget(budgetId) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      const { supabase } = await import('../config/supabase.js');
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId)
        .eq('user_id', userId);

      if (error) {
        // Check if table doesn't exist
        if (error.code === '42P01' || (error.message && error.message.includes('relation "public.budgets" does not exist'))) {
          console.error('❌ Budget Error: No se puede eliminar presupuesto - tabla "budgets" no existe.');
          console.warn('⚠️ Tabla "budgets" no encontrada. No se puede eliminar presupuesto.');
          return false;
        }
        console.error('❌ Budget Error: Fallo al eliminar presupuesto de Supabase:', {
          code: error.code,
          message: error.message,
          details: error.details,
          budgetId: budgetId,
          userId: userId
        });
        console.error('Error deleting budget:', error);
        return false;
      }

      const initialLength = this.budgets.length;
      this.budgets = this.budgets.filter(budget => budget.id !== budgetId);
      
      if (this.budgets.length === initialLength) {
        console.warn('⚠️ Budget Warning: Presupuesto eliminado de Supabase pero no se encontró en datos locales');
      }
      
      console.log('✅ Budget deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Budget Error: Excepción al eliminar presupuesto:', {
        error: error.message,
        stack: error.stack,
        budgetId: budgetId,
        userId: userId
      });
      console.error('Error in deleteBudget:', error);
      return false;
    }
  }

  // Calculate budget progress
  calculateBudgetProgress(budget, expenses) {
    if (!budget || !expenses) {
      if (!budget) {
        console.warn('⚠️ Budget Warning: calculateBudgetProgress llamado sin presupuesto válido');
      }
      if (!expenses) {
        console.warn('⚠️ Budget Warning: calculateBudgetProgress llamado sin datos de gastos');
      }
      return { spent: 0, remaining: 0, percentage: 0, status: 'safe' };
    }

    // Filter expenses for this budget's category and date range
    const budgetExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.transaction_date);
      const startDate = new Date(budget.start_date);
      const endDate = new Date(budget.end_date);
      
      return expense.category === budget.category && 
             expenseDate >= startDate && 
             expenseDate <= endDate;
    });

    const spent = budgetExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const remaining = budget.amount - spent;
    const percentage = (spent / budget.amount) * 100;

    let status = 'safe';
    if (percentage >= 100) {
      status = 'exceeded';
    } else if (percentage >= 80) {
      status = 'warning';
    } else if (percentage >= 60) {
      status = 'caution';
    }

    return {
      spent,
      remaining,
      percentage: Math.min(percentage, 100),
      status,
      expenseCount: budgetExpenses.length
    };
  }

  // Get budgets with progress
  getBudgetsWithProgress(expenses = []) {
    return this.budgets.map(budget => ({
      ...budget,
      progress: this.calculateBudgetProgress(budget, expenses)
    }));
  }

  // Get active budgets
  getActiveBudgets() {
    const now = new Date();
    return this.budgets.filter(budget => {
      const endDate = new Date(budget.end_date);
      return budget.status === 'active' && endDate >= now;
    });
  }

  // Get budgets by category
  getBudgetsByCategory(category) {
    return this.budgets.filter(budget => budget.category === category);
  }

  // Check if category has active budget
  hasBudgetForCategory(category) {
    const activeBudgets = this.getActiveBudgets();
    return activeBudgets.some(budget => budget.category === category);
  }

  // Get budget alerts
  getBudgetAlerts(expenses = []) {
    const alerts = [];
    const budgetsWithProgress = this.getBudgetsWithProgress(expenses);

    budgetsWithProgress.forEach(budget => {
      const { progress } = budget;
      
      if (progress.status === 'exceeded') {
        alerts.push({
          type: 'danger',
          budgetId: budget.id,
          category: budget.category,
          message: `Has superado el presupuesto de ${budget.category}`,
          spent: progress.spent,
          limit: budget.amount,
          percentage: progress.percentage
        });
      } else if (progress.status === 'warning') {
        alerts.push({
          type: 'warning',
          budgetId: budget.id,
          category: budget.category,
          message: `Te acercas al límite del presupuesto de ${budget.category}`,
          spent: progress.spent,
          limit: budget.amount,
          percentage: progress.percentage
        });
      }
    });

    return alerts;
  }

  // Get budget summary
  getBudgetSummary(expenses = []) {
    const budgetsWithProgress = this.getBudgetsWithProgress(expenses);
    const totalBudgets = budgetsWithProgress.length;
    const totalBudgetAmount = budgetsWithProgress.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = budgetsWithProgress.reduce((sum, budget) => sum + budget.progress.spent, 0);
    const totalRemaining = totalBudgetAmount - totalSpent;

    const statusCounts = {
      safe: 0,
      caution: 0,
      warning: 0,
      exceeded: 0
    };

    budgetsWithProgress.forEach(budget => {
      statusCounts[budget.progress.status]++;
    });

    return {
      totalBudgets,
      totalBudgetAmount,
      totalSpent,
      totalRemaining,
      overallPercentage: totalBudgetAmount > 0 ? (totalSpent / totalBudgetAmount) * 100 : 0,
      statusCounts,
      activeBudgets: this.getActiveBudgets().length
    };
  }

  // Get budgets data for AI analysis
  getBudgetsForAI() {
    return this.budgets.map(budget => ({
      id: budget.id,
      name: budget.name,
      category: budget.category,
      amount: budget.amount,
      start_date: budget.start_date,
      end_date: budget.end_date,
      status: budget.status,
      ai_recommended: budget.ai_recommended
    }));
  }

  getBudgets() {
    return this.budgets;
  }
}