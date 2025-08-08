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
      
      // Ensure budgets table exists
      await this.ensureBudgetsTableExists();
      
      const { supabase } = await import('../config/supabase.js');
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'paused'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading budgets:', error);
        return [];
      }

      this.budgets = data || [];
      console.log('💰 Budgets loaded:', this.budgets.length, 'items');
      return this.budgets;
    } catch (error) {
      console.error('Error in loadBudgets:', error);
      return [];
    }
  }

  // Ensure budgets table exists
  async ensureBudgetsTableExists() {
    try {
      const { supabase } = await import('../config/supabase.js');
      
      // Try to query the table to see if it exists
      const { error } = await supabase
        .from('budgets')
        .select('id')
        .limit(1);
      
      if (error && error.message.includes('relation "public.budgets" does not exist')) {
        console.log('📝 Creating budgets table...');
        
        // Create the table using SQL
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS budgets (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            name text NOT NULL,
            category text NOT NULL,
            amount decimal(10,2) NOT NULL,
            start_date date NOT NULL,
            end_date date NOT NULL,
            status text DEFAULT 'active',
            ai_recommended boolean DEFAULT false,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
          );
          
          ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Users can manage their own budgets"
            ON budgets
            FOR ALL
            TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
          
          CREATE INDEX IF NOT EXISTS idx_budgets_user_status ON budgets(user_id, status);
        `;
        
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        
        if (createError) {
          console.warn('⚠️ Could not create budgets table automatically. Please create it manually in Supabase.');
        } else {
          console.log('✅ Budgets table created successfully');
        }
      }
    } catch (error) {
      console.log('ℹ️ Budgets table check completed');
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
        console.error('Error adding budget:', error);
        return false;
      }

      console.log('✅ Budget added successfully:', data[0]);
      this.budgets.unshift(data[0]);
      return true;
    } catch (error) {
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
        console.error('Error updating budget:', error);
        return false;
      }

      // Update local data
      const budgetIndex = this.budgets.findIndex(budget => budget.id === budgetId);
      if (budgetIndex !== -1) {
        this.budgets[budgetIndex] = { ...this.budgets[budgetIndex], ...data[0] };
      }

      console.log('✅ Budget updated successfully');
      return true;
    } catch (error) {
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
        console.error('Error deleting budget:', error);
        return false;
      }

      this.budgets = this.budgets.filter(budget => budget.id !== budgetId);
      console.log('✅ Budget deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in deleteBudget:', error);
      return false;
    }
  }

  // Calculate budget progress
  calculateBudgetProgress(budget, expenses) {
    if (!budget || !expenses) return { spent: 0, remaining: 0, percentage: 0, status: 'safe' };

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