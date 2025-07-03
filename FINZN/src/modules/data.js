export class DataManager {
  constructor() {
    this.data = {
      expenses: {},
      income: {},
      extraIncomes: {},
      goals: [],
      categories: this.getDefaultCategories(),
      achievements: [],
      recurringExpenses: []
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
    const user = this.getCurrentUser();
    if (!user) return;

    const savedData = localStorage.getItem(`finzn-data-${user}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        this.data = { ...this.data, ...parsed };
        
        // Ensure all required properties exist
        if (!this.data.extraIncomes) this.data.extraIncomes = {};
        if (!this.data.income) this.data.income = {};
        if (!this.data.expenses) this.data.expenses = {};
        if (!this.data.goals) this.data.goals = [];
        if (!this.data.categories) this.data.categories = this.getDefaultCategories();
        if (!this.data.achievements) this.data.achievements = [];
        if (!this.data.recurringExpenses) this.data.recurringExpenses = [];
        
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
  }

  saveUserData() {
    const user = this.getCurrentUser();
    if (!user) return;

    try {
      localStorage.setItem(`finzn-data-${user}`, JSON.stringify(this.data));
      console.log('Data saved successfully'); // Debug log
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  getCurrentUser() {
    return localStorage.getItem('currentUser');
  }

  async addExpense(expense) {
    const id = Date.now().toString();
    const monthKey = expense.date;
    
    if (!this.data.expenses[monthKey]) {
      this.data.expenses[monthKey] = [];
    }

    // Handle installments
    const installmentAmount = expense.amount / expense.installments;
    
    for (let i = 0; i < expense.installments; i++) {
      const installmentDate = this.addMonths(expense.date, i);
      
      if (!this.data.expenses[installmentDate]) {
        this.data.expenses[installmentDate] = [];
      }

      this.data.expenses[installmentDate].push({
        id: `${id}-${i}`,
        description: expense.description,
        amount: installmentAmount,
        category: expense.category,
        date: installmentDate,
        installment: i + 1,
        totalInstallments: expense.installments,
        recurring: expense.recurring && i === 0,
        originalId: id,
        originalAmount: expense.amount,
        createdAt: new Date().toISOString()
      });
    }

    // Handle recurring expenses
    if (expense.recurring) {
      this.data.recurringExpenses.push({
        id,
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        startDate: expense.date
      });
    }

    this.saveUserData();
    this.checkAchievements();
  }

  async updateExpense(expenseId, expenseData, month) {
    const expenses = this.data.expenses[month] || [];
    const expenseIndex = expenses.findIndex(exp => exp.id === expenseId);
    
    if (expenseIndex === -1) {
      throw new Error('Gasto no encontrado');
    }

    const currentExpense = expenses[expenseIndex];
    
    // If it's part of installments, we need to update all related installments
    if (currentExpense.totalInstallments > 1) {
      const originalId = currentExpense.originalId;
      
      // Find all installments with the same originalId
      Object.keys(this.data.expenses).forEach(monthKey => {
        this.data.expenses[monthKey] = this.data.expenses[monthKey].map(exp => {
          if (exp.originalId === originalId) {
            const newInstallmentAmount = expenseData.amount / expenseData.installments;
            return {
              ...exp,
              description: expenseData.description,
              amount: newInstallmentAmount,
              category: expenseData.category,
              originalAmount: expenseData.amount,
              totalInstallments: expenseData.installments,
              recurring: expenseData.recurring
            };
          }
          return exp;
        });
      });
    } else {
      // Single expense update
      expenses[expenseIndex] = {
        ...currentExpense,
        description: expenseData.description,
        amount: expenseData.amount,
        category: expenseData.category,
        recurring: expenseData.recurring,
        originalAmount: expenseData.amount
      };
    }

    this.saveUserData();
  }

  async deleteExpense(expenseId, month) {
    const expenses = this.data.expenses[month] || [];
    const expense = expenses.find(exp => exp.id === expenseId);
    
    if (!expense) {
      throw new Error('Gasto no encontrado');
    }

    // If it's part of installments, delete all related installments
    if (expense.totalInstallments > 1) {
      const originalId = expense.originalId;
      
      // Remove all installments with the same originalId
      Object.keys(this.data.expenses).forEach(monthKey => {
        this.data.expenses[monthKey] = this.data.expenses[monthKey].filter(exp => 
          exp.originalId !== originalId
        );
      });
    } else {
      // Single expense deletion
      this.data.expenses[month] = expenses.filter(exp => exp.id !== expenseId);
    }

    this.saveUserData();
  }

  getExpenseById(expenseId, month) {
    const expenses = this.data.expenses[month] || [];
    return expenses.find(exp => exp.id === expenseId);
  }

  async setFixedIncome(amount) {
    // Apply to all months
    const currentYear = new Date().getFullYear();
    for (let month = 1; month <= 12; month++) {
      const monthKey = `${currentYear}-${month.toString().padStart(2, '0')}`;
      if (!this.data.income[monthKey]) {
        this.data.income[monthKey] = { fixed: 0, extra: 0 };
      }
      this.data.income[monthKey].fixed = amount;
    }
    
    this.saveUserData();
  }

  async addExtraIncome(extraIncome, month) {
    console.log('DataManager: Adding extra income', extraIncome, month); // Debug log
    
    const id = Date.now().toString();
    
    // Initialize extraIncomes for the month if it doesn't exist
    if (!this.data.extraIncomes[month]) {
      this.data.extraIncomes[month] = [];
    }
    
    // Add the extra income record
    this.data.extraIncomes[month].push({
      id,
      description: extraIncome.description,
      amount: extraIncome.amount,
      category: extraIncome.category,
      date: month,
      createdAt: new Date().toISOString()
    });
    
    // Initialize income for the month if it doesn't exist
    if (!this.data.income[month]) {
      this.data.income[month] = { fixed: 0, extra: 0 };
    }
    
    // Update total extra income for the month
    const currentExtra = this.data.income[month].extra || 0;
    this.data.income[month].extra = currentExtra + extraIncome.amount;
    
    console.log('DataManager: Updated income data', this.data.income[month]); // Debug log
    
    this.saveUserData();
    this.checkAchievements();
  }

  async addGoal(goal) {
    const id = Date.now().toString();
    this.data.goals.push({
      id,
      ...goal,
      createdAt: new Date().toISOString()
    });
    
    this.saveUserData();
    this.checkAchievements();
  }

  async addCategory(category) {
    const id = Date.now().toString();
    this.data.categories.push({
      id,
      ...category
    });
    
    this.saveUserData();
  }

  getExpenses(month) {
    return this.data.expenses[month] || [];
  }

  getExpensesByCategory(month) {
    const expenses = this.getExpenses(month);
    const byCategory = {};
    
    expenses.forEach(expense => {
      const category = expense.category || 'Otros';
      byCategory[category] = (byCategory[category] || 0) + expense.amount;
    });
    
    return byCategory;
  }

  getBalance(month) {
    const income = this.getIncome(month);
    const expenses = this.getExpenses(month);
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

  getActiveInstallments(month) {
    const expenses = this.getExpenses(month);
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

  getIncome(month) {
    const income = this.data.income[month] || { fixed: 0, extra: 0 };
    console.log('DataManager: Getting income for', month, income); // Debug log
    return income;
  }

  getExtraIncomes(month) {
    return this.data.extraIncomes[month] || [];
  }

  getGoals() {
    return this.data.goals;
  }

  getCategories() {
    return this.data.categories;
  }

  getStats() {
    const allExpenses = Object.values(this.data.expenses).flat();
    const totalSavings = Object.values(this.data.income).reduce((sum, income) => {
      const monthExpenses = Object.values(this.data.expenses).flat()
        .filter(expense => expense.date === Object.keys(this.data.income).find(key => this.data.income[key] === income))
        .reduce((expSum, expense) => expSum + expense.amount, 0);
      const monthIncome = (income.fixed || 0) + (income.extra || 0);
      return sum + Math.max(0, monthIncome - monthExpenses);
    }, 0);

    const monthlyAverage = allExpenses.length > 0 
      ? allExpenses.reduce((sum, expense) => sum + expense.amount, 0) / Object.keys(this.data.expenses).length
      : 0;

    return {
      totalSavings,
      monthlyAverage
    };
  }

  getAchievements() {
    return this.data.achievements;
  }

  getMonthlyTrend() {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const expenses = this.getExpenses(monthKey);
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
    const expenses = this.getExpenses(month);
    const balance = this.getBalance(month);
    const byCategory = this.getExpensesByCategory(month);
    const extraIncomes = this.getExtraIncomes(month);
    const installments = this.getActiveInstallments(month);
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
    
    // Add expenses
    Object.entries(this.data.expenses).forEach(([month, expenses]) => {
      expenses.forEach(expense => {
        const createdDate = expense.createdAt 
          ? new Date(expense.createdAt).toLocaleDateString('es-ES')
          : 'No disponible';
        
        rows.push([
          month,
          expense.description,
          expense.amount.toFixed(2),
          expense.category,
          expense.installment || 1,
          expense.totalInstallments || 1,
          (expense.originalAmount || expense.amount).toFixed(2),
          createdDate,
          'Gasto'
        ]);
      });
    });

    // Add extra incomes
    Object.entries(this.data.extraIncomes).forEach(([month, incomes]) => {
      incomes.forEach(income => {
        const createdDate = income.createdAt 
          ? new Date(income.createdAt).toLocaleDateString('es-ES')
          : 'No disponible';
        
        rows.push([
          month,
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
    });

    // Add fixed incomes
    Object.entries(this.data.income).forEach(([month, income]) => {
      if (income.fixed > 0) {
        rows.push([
          month,
          'Ingreso Fijo Mensual',
          income.fixed.toFixed(2),
          'Ingreso',
          1,
          1,
          income.fixed.toFixed(2),
          'Automático',
          'Ingreso Fijo'
        ]);
      }
    });
    
    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  async importFromCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(cell => cell.replace(/"/g, ''));
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(cell => cell.replace(/"/g, ''));
      const [month, description, amount, category] = values;
      
      if (month && description && amount && category) {
        if (!this.data.expenses[month]) {
          this.data.expenses[month] = [];
        }
        
        this.data.expenses[month].push({
          id: Date.now().toString() + Math.random(),
          description,
          amount: parseFloat(amount),
          category,
          date: month,
          installment: 1,
          totalInstallments: 1,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    this.saveUserData();
  }

  checkAchievements() {
    const newAchievements = [];
    
    // First expense achievement
    const totalExpenses = Object.values(this.data.expenses).flat().length;
    if (totalExpenses >= 1 && !this.data.achievements.find(a => a.id === 'first-expense')) {
      newAchievements.push({
        id: 'first-expense',
        title: '🎉 Primer Gasto Registrado',
        description: 'Has registrado tu primer gasto'
      });
    }
    
    // Goal completion achievement
    const completedGoals = this.data.goals.filter(goal => goal.current >= goal.target);
    if (completedGoals.length >= 1 && !this.data.achievements.find(a => a.id === 'first-goal')) {
      newAchievements.push({
        id: 'first-goal',
        title: '🎯 Primer Objetivo Cumplido',
        description: 'Has completado tu primer objetivo de ahorro'
      });
    }
    
    // Consistent tracking achievement
    const monthsWithExpenses = Object.keys(this.data.expenses).length;
    if (monthsWithExpenses >= 3 && !this.data.achievements.find(a => a.id === 'consistent-tracking')) {
      newAchievements.push({
        id: 'consistent-tracking',
        title: '📊 Seguimiento Consistente',
        description: 'Has registrado gastos por 3 meses consecutivos'
      });
    }
    
    // Extra income achievement
    const totalExtraIncomes = Object.values(this.data.extraIncomes).flat().length;
    if (totalExtraIncomes >= 1 && !this.data.achievements.find(a => a.id === 'first-extra-income')) {
      newAchievements.push({
        id: 'first-extra-income',
        title: '💰 Primer Ingreso Extra',
        description: 'Has registrado tu primer ingreso extra'
      });
    }

    // Installments achievement
    const totalInstallments = Object.values(this.data.expenses).flat().filter(e => e.totalInstallments > 1).length;
    if (totalInstallments >= 1 && !this.data.achievements.find(a => a.id === 'first-installment')) {
      newAchievements.push({
        id: 'first-installment',
        title: '💳 Primera Cuota',
        description: 'Has registrado tu primer gasto en cuotas'
      });
    }
    
    this.data.achievements.push(...newAchievements);
    if (newAchievements.length > 0) {
      this.saveUserData();
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

  deleteGoal(id) {
    this.data.goals = this.data.goals.filter(goal => goal.id !== id);
    this.saveUserData();
  }

  deleteCategory(id) {
    // Don't delete if it's being used
    const isUsed = Object.values(this.data.expenses).flat().some(expense => expense.category === id);
    if (isUsed) {
      throw new Error('No se puede eliminar una categoría que está siendo utilizada');
    }
    
    this.data.categories = this.data.categories.filter(cat => cat.id !== id);
    this.saveUserData();
  }
}