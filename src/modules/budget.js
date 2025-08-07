export class BudgetManager {
  constructor() {
    this.budgets = [];
    this.currentMonth = this.getCurrentMonth();
    this.mlModel = new BudgetMLModel();
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
        .eq('status', 'active')
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

  // Machine Learning Methods
  async generateMLPredictions(expenses = []) {
    return await this.mlModel.generatePredictions(expenses, this.budgets);
  }

  async analyzeSpendingPatterns(expenses = []) {
    return await this.mlModel.analyzePatterns(expenses);
  }

  async calculateBudgetRisk(budgetId, expenses = []) {
    const budget = this.budgets.find(b => b.id === budgetId);
    if (!budget) return { risk: 'unknown', confidence: 0 };
    
    return await this.mlModel.calculateRisk(budget, expenses);
  }
}

// Machine Learning Model for Budget Analysis
class BudgetMLModel {
  constructor() {
    this.patterns = new Map();
    this.predictions = new Map();
    this.accuracy = {
      overall: 0.85,
      category: new Map(),
      trend: 0.78
    };
  }

  async generatePredictions(expenses, budgets) {
    console.log('🤖 Generating ML predictions for budgets...');
    
    const predictions = [];
    
    for (const budget of budgets) {
      const categoryExpenses = expenses.filter(exp => exp.category === budget.category);
      const prediction = await this.predictCategorySpending(budget.category, categoryExpenses);
      
      predictions.push({
        budgetId: budget.id,
        category: budget.category,
        currentSpent: categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0),
        predictedTotal: prediction.predictedAmount,
        confidence: prediction.confidence,
        riskLevel: prediction.riskLevel,
        recommendedAction: prediction.action,
        factors: prediction.factors
      });
    }
    
    return predictions;
  }

  async predictCategorySpending(category, expenses) {
    // Análisis de tendencias históricas
    const monthlyTrend = this.calculateMonthlyTrend(expenses);
    const seasonalFactor = this.getSeasonalFactor(category);
    const weeklyPattern = this.analyzeWeeklyPattern(expenses);
    
    // Predicción base usando regresión lineal simple
    const currentSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const daysInMonth = new Date().getDate();
    const totalDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    
    // Predicción lineal ajustada por patrones
    let predictedAmount = (currentSpent / daysInMonth) * totalDaysInMonth;
    
    // Ajustes por factores ML
    predictedAmount *= seasonalFactor;
    predictedAmount *= (1 + monthlyTrend);
    predictedAmount *= weeklyPattern.multiplier;
    
    // Calcular confianza basada en consistencia de datos
    const confidence = this.calculatePredictionConfidence(expenses, category);
    
    // Determinar nivel de riesgo
    const riskLevel = this.assessRiskLevel(predictedAmount, currentSpent);
    
    return {
      predictedAmount: Math.round(predictedAmount),
      confidence: confidence,
      riskLevel: riskLevel,
      action: this.getRecommendedAction(riskLevel, predictedAmount, currentSpent),
      factors: {
        monthlyTrend: monthlyTrend,
        seasonalFactor: seasonalFactor,
        weeklyPattern: weeklyPattern.pattern,
        dataQuality: confidence
      }
    };
  }

  calculateMonthlyTrend(expenses) {
    if (expenses.length < 2) return 0;
    
    // Ordenar por fecha
    const sortedExpenses = expenses.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
    
    // Calcular tendencia usando diferencias
    const firstHalf = sortedExpenses.slice(0, Math.floor(sortedExpenses.length / 2));
    const secondHalf = sortedExpenses.slice(Math.floor(sortedExpenses.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) / secondHalf.length;
    
    return (secondHalfAvg - firstHalfAvg) / firstHalfAvg;
  }

  getSeasonalFactor(category) {
    const month = new Date().getMonth();
    const seasonalFactors = {
      'Comida': [1.0, 0.95, 1.0, 1.05, 1.0, 1.1, 1.15, 1.1, 1.0, 1.0, 1.2, 1.3],
      'Transporte': [0.9, 0.9, 1.0, 1.0, 1.1, 1.2, 1.3, 1.2, 1.0, 1.0, 0.95, 0.9],
      'Ocio': [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.3, 1.1, 1.0, 1.1, 1.5],
      'Supermercado': [1.0, 0.95, 1.0, 1.0, 1.05, 1.1, 1.1, 1.05, 1.0, 1.0, 1.15, 1.25],
      'Servicios': [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
      'Salud': [1.1, 1.0, 1.0, 1.0, 1.0, 0.9, 0.9, 0.9, 1.0, 1.0, 1.0, 1.1],
      'Otros': [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
    };
    
    return seasonalFactors[category] ? seasonalFactors[category][month] : 1.0;
  }

  analyzeWeeklyPattern(expenses) {
    const weeklySpending = [0, 0, 0, 0, 0, 0, 0]; // Dom-Sáb
    const weeklyCounts = [0, 0, 0, 0, 0, 0, 0];
    
    expenses.forEach(expense => {
      const date = new Date(expense.transaction_date);
      const dayOfWeek = date.getDay();
      weeklySpending[dayOfWeek] += parseFloat(expense.amount);
      weeklyCounts[dayOfWeek]++;
    });
    
    // Calcular promedio por día
    const weeklyAverage = weeklySpending.map((total, index) => 
      weeklyCounts[index] > 0 ? total / weeklyCounts[index] : 0
    );
    
    // Identificar patrón dominante
    const maxDay = weeklyAverage.indexOf(Math.max(...weeklyAverage));
    const minDay = weeklyAverage.indexOf(Math.min(...weeklyAverage));
    
    const patterns = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    return {
      pattern: `Mayor gasto: ${patterns[maxDay]}, Menor gasto: ${patterns[minDay]}`,
      multiplier: 1.0 + (Math.max(...weeklyAverage) - Math.min(...weeklyAverage)) / Math.max(...weeklyAverage) * 0.1,
      weeklyData: weeklyAverage
    };
  }

  calculatePredictionConfidence(expenses, category) {
    let confidence = 0.5; // Base confidence
    
    // Más datos = mayor confianza
    if (expenses.length >= 10) confidence += 0.2;
    else if (expenses.length >= 5) confidence += 0.1;
    
    // Consistencia en montos
    if (expenses.length > 1) {
      const amounts = expenses.map(exp => parseFloat(exp.amount));
      const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length;
      const coefficient = Math.sqrt(variance) / mean;
      
      if (coefficient < 0.5) confidence += 0.2;
      else if (coefficient < 1.0) confidence += 0.1;
    }
    
    // Distribución temporal
    const dateRange = this.getDateRange(expenses);
    if (dateRange >= 20) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  getDateRange(expenses) {
    if (expenses.length < 2) return 0;
    
    const dates = expenses.map(exp => new Date(exp.transaction_date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    return Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
  }

  assessRiskLevel(predicted, current) {
    const ratio = predicted / (current || 1);
    
    if (ratio > 2.0) return 'high';
    if (ratio > 1.5) return 'medium';
    if (ratio > 1.2) return 'low';
    return 'minimal';
  }

  getRecommendedAction(riskLevel, predicted, current) {
    const actions = {
      'high': `⚠️ Alto riesgo: Se predice un gasto de $${predicted.toLocaleString()}. Considera reducir gastos inmediatamente.`,
      'medium': `🔶 Riesgo moderado: Gasto proyectado de $${predicted.toLocaleString()}. Monitorea de cerca esta categoría.`,
      'low': `🟡 Riesgo bajo: Proyección de $${predicted.toLocaleString()}. Mantén el control actual.`,
      'minimal': `✅ Riesgo mínimo: Gasto controlado, proyección de $${predicted.toLocaleString()}.`
    };
    
    return actions[riskLevel] || 'Continúa monitoreando tus gastos.';
  }

  async analyzePatterns(expenses) {
    console.log('🔍 Analyzing spending patterns with ML...');
    
    const patterns = [];
    
    // Patrón de frecuencia de compras
    const frequencyPattern = this.analyzeFrequencyPattern(expenses);
    if (frequencyPattern.confidence > 0.6) {
      patterns.push(frequencyPattern);
    }
    
    // Patrón de montos
    const amountPattern = this.analyzeAmountPattern(expenses);
    if (amountPattern.confidence > 0.6) {
      patterns.push(amountPattern);
    }
    
    // Patrón temporal
    const temporalPattern = this.analyzeTemporalPattern(expenses);
    if (temporalPattern.confidence > 0.6) {
      patterns.push(temporalPattern);
    }
    
    // Patrón de categorías
    const categoryPattern = this.analyzeCategoryPattern(expenses);
    if (categoryPattern.confidence > 0.6) {
      patterns.push(categoryPattern);
    }
    
    return patterns;
  }

  analyzeFrequencyPattern(expenses) {
    const dailyExpenses = new Map();
    
    expenses.forEach(expense => {
      const date = expense.transaction_date;
      if (!dailyExpenses.has(date)) {
        dailyExpenses.set(date, 0);
      }
      dailyExpenses.set(date, dailyExpenses.get(date) + 1);
    });
    
    const frequencies = Array.from(dailyExpenses.values());
    const avgFrequency = frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length;
    
    let pattern = 'irregular';
    let confidence = 0.5;
    
    if (avgFrequency >= 3) {
      pattern = 'alta_frecuencia';
      confidence = 0.8;
    } else if (avgFrequency >= 1.5) {
      pattern = 'frecuencia_moderada';
      confidence = 0.7;
    } else if (avgFrequency < 0.5) {
      pattern = 'baja_frecuencia';
      confidence = 0.6;
    }
    
    return {
      type: 'frequency',
      pattern: pattern,
      confidence: confidence,
      description: this.getFrequencyDescription(pattern, avgFrequency),
      data: { avgFrequency: avgFrequency.toFixed(2) }
    };
  }

  analyzeAmountPattern(expenses) {
    const amounts = expenses.map(exp => parseFloat(exp.amount));
    const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const coefficient = stdDev / mean;
    
    let pattern = 'variable';
    let confidence = 0.5;
    
    if (coefficient < 0.3) {
      pattern = 'consistente';
      confidence = 0.9;
    } else if (coefficient < 0.6) {
      pattern = 'moderadamente_variable';
      confidence = 0.7;
    } else if (coefficient > 1.5) {
      pattern = 'muy_variable';
      confidence = 0.8;
    }
    
    return {
      type: 'amount',
      pattern: pattern,
      confidence: confidence,
      description: this.getAmountDescription(pattern, mean, coefficient),
      data: { 
        mean: mean.toFixed(2), 
        stdDev: stdDev.toFixed(2), 
        coefficient: coefficient.toFixed(2) 
      }
    };
  }

  analyzeTemporalPattern(expenses) {
    const hourlySpending = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);
    
    expenses.forEach(expense => {
      // Simular hora basada en categoría (en un caso real vendría de los datos)
      const hour = this.estimateHourFromCategory(expense.category);
      hourlySpending[hour] += parseFloat(expense.amount);
      hourlyCounts[hour]++;
    });
    
    const peakHour = hourlySpending.indexOf(Math.max(...hourlySpending));
    const totalSpending = hourlySpending.reduce((sum, amt) => sum + amt, 0);
    const peakPercentage = (hourlySpending[peakHour] / totalSpending) * 100;
    
    let pattern = 'distribuido';
    let confidence = 0.6;
    
    if (peakPercentage > 40) {
      pattern = 'concentrado';
      confidence = 0.8;
    } else if (peakPercentage > 25) {
      pattern = 'semi_concentrado';
      confidence = 0.7;
    }
    
    return {
      type: 'temporal',
      pattern: pattern,
      confidence: confidence,
      description: this.getTemporalDescription(pattern, peakHour, peakPercentage),
      data: { peakHour: peakHour, peakPercentage: peakPercentage.toFixed(1) }
    };
  }

  analyzeCategoryPattern(expenses) {
    const categoryTotals = new Map();
    
    expenses.forEach(expense => {
      const category = expense.category;
      if (!categoryTotals.has(category)) {
        categoryTotals.set(category, 0);
      }
      categoryTotals.set(category, categoryTotals.get(category) + parseFloat(expense.amount));
    });
    
    const sortedCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1]);
    
    const totalSpending = Array.from(categoryTotals.values()).reduce((sum, amt) => sum + amt, 0);
    const topCategoryPercentage = (sortedCategories[0][1] / totalSpending) * 100;
    
    let pattern = 'diversificado';
    let confidence = 0.7;
    
    if (topCategoryPercentage > 60) {
      pattern = 'concentrado';
      confidence = 0.9;
    } else if (topCategoryPercentage > 40) {
      pattern = 'semi_concentrado';
      confidence = 0.8;
    }
    
    return {
      type: 'category',
      pattern: pattern,
      confidence: confidence,
      description: this.getCategoryDescription(pattern, sortedCategories[0][0], topCategoryPercentage),
      data: { 
        topCategory: sortedCategories[0][0], 
        percentage: topCategoryPercentage.toFixed(1),
        categories: sortedCategories.length
      }
    };
  }

  estimateHourFromCategory(category) {
    const categoryHours = {
      'Comida': 13, // 1 PM
      'Supermercado': 18, // 6 PM
      'Transporte': 8, // 8 AM
      'Ocio': 20, // 8 PM
      'Servicios': 10, // 10 AM
      'Salud': 15, // 3 PM
      'Otros': 14 // 2 PM
    };
    
    return categoryHours[category] || 12;
  }

  getFrequencyDescription(pattern, avgFrequency) {
    const descriptions = {
      'alta_frecuencia': `Realizas compras muy frecuentemente (${avgFrequency.toFixed(1)} por día). Considera consolidar compras.`,
      'frecuencia_moderada': `Tienes un patrón de compras moderado (${avgFrequency.toFixed(1)} por día). Buen balance.`,
      'baja_frecuencia': `Realizas compras poco frecuentes (${avgFrequency.toFixed(1)} por día). Podrías estar acumulando gastos.`,
      'irregular': `Patrón de compras irregular. Considera establecer una rutina más consistente.`
    };
    
    return descriptions[pattern] || 'Patrón de frecuencia no identificado.';
  }

  getAmountDescription(pattern, mean, coefficient) {
    const descriptions = {
      'consistente': `Tus gastos son muy consistentes (promedio: $${mean.toFixed(0)}). Excelente control presupuestario.`,
      'moderadamente_variable': `Gastos moderadamente variables (promedio: $${mean.toFixed(0)}). Control aceptable.`,
      'muy_variable': `Gastos muy variables (promedio: $${mean.toFixed(0)}). Considera establecer límites más estrictos.`,
      'variable': `Gastos variables (promedio: $${mean.toFixed(0)}). Hay margen para mejorar la consistencia.`
    };
    
    return descriptions[pattern] || 'Patrón de montos no identificado.';
  }

  getTemporalDescription(pattern, peakHour, peakPercentage) {
    const timeDescription = peakHour < 12 ? 'mañana' : peakHour < 18 ? 'tarde' : 'noche';
    
    const descriptions = {
      'concentrado': `Gastas principalmente en la ${timeDescription} (${peakPercentage.toFixed(1)}% a las ${peakHour}:00). Patrón muy definido.`,
      'semi_concentrado': `Tienes preferencia por gastar en la ${timeDescription} (${peakPercentage.toFixed(1)}% a las ${peakHour}:00).`,
      'distribuido': `Tus gastos están bien distribuidos durante el día. Buen balance temporal.`
    };
    
    return descriptions[pattern] || 'Patrón temporal no identificado.';
  }

  getCategoryDescription(pattern, topCategory, percentage) {
    const descriptions = {
      'concentrado': `Gastas principalmente en ${topCategory} (${percentage.toFixed(1)}%). Considera diversificar.`,
      'semi_concentrado': `${topCategory} es tu categoría principal (${percentage.toFixed(1)}%). Balance aceptable.`,
      'diversificado': `Tienes gastos bien diversificados entre categorías. Excelente distribución.`
    };
    
    return descriptions[pattern] || 'Patrón de categorías no identificado.';
  }

  async calculateRisk(budget, expenses) {
    const categoryExpenses = expenses.filter(exp => exp.category === budget.category);
    const currentSpent = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const budgetUsage = (currentSpent / budget.amount) * 100;
    
    // Factores de riesgo
    const timeProgress = this.calculateTimeProgress(budget);
    const spendingVelocity = this.calculateSpendingVelocity(categoryExpenses);
    const historicalPattern = await this.getHistoricalRisk(budget.category);
    
    // Cálculo de riesgo compuesto
    let riskScore = 0;
    
    // Riesgo por uso del presupuesto
    if (budgetUsage > 90) riskScore += 0.4;
    else if (budgetUsage > 75) riskScore += 0.3;
    else if (budgetUsage > 50) riskScore += 0.2;
    
    // Riesgo por velocidad de gasto vs tiempo
    const expectedUsage = timeProgress * 100;
    if (budgetUsage > expectedUsage * 1.5) riskScore += 0.3;
    else if (budgetUsage > expectedUsage * 1.2) riskScore += 0.2;
    
    // Riesgo por patrón histórico
    riskScore += historicalPattern * 0.3;
    
    // Determinar nivel de riesgo
    let riskLevel = 'low';
    if (riskScore > 0.7) riskLevel = 'high';
    else if (riskScore > 0.4) riskLevel = 'medium';
    
    return {
      risk: riskLevel,
      confidence: Math.min(0.95, 0.6 + (categoryExpenses.length * 0.05)),
      score: riskScore,
      factors: {
        budgetUsage: budgetUsage.toFixed(1),
        timeProgress: (timeProgress * 100).toFixed(1),
        spendingVelocity: spendingVelocity.toFixed(2),
        historicalRisk: historicalPattern.toFixed(2)
      }
    };
  }

  calculateTimeProgress(budget) {
    const startDate = new Date(budget.start_date);
    const endDate = new Date(budget.end_date);
    const currentDate = new Date();
    
    const totalDuration = endDate - startDate;
    const elapsed = currentDate - startDate;
    
    return Math.max(0, Math.min(1, elapsed / totalDuration));
  }

  calculateSpendingVelocity(expenses) {
    if (expenses.length < 2) return 0;
    
    const sortedExpenses = expenses.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
    const firstDate = new Date(sortedExpenses[0].transaction_date);
    const lastDate = new Date(sortedExpenses[sortedExpenses.length - 1].transaction_date);
    const daysDiff = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24));
    
    const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    
    return totalAmount / daysDiff;
  }

  async getHistoricalRisk(category) {
    // Simulación de riesgo histórico basado en categoría
    const historicalRisks = {
      'Comida': 0.3,
      'Transporte': 0.4,
      'Ocio': 0.6,
      'Supermercado': 0.2,
      'Servicios': 0.1,
      'Salud': 0.5,
      'Otros': 0.4
    };
    
    return historicalRisks[category] || 0.3;
  }
}