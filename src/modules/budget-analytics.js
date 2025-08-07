export class BudgetAnalytics {
  constructor() {
    this.analysisCache = new Map();
    this.anomalyThresholds = {
      deviation: 0.25, // 25% deviation threshold
      trend: 0.15,     // 15% trend change threshold
      seasonal: 0.30   // 30% seasonal variation threshold
    };
  }

  // Core Analytics Engine
  async analyzeBudgetPerformance(userId, period = 'current') {
    console.log('📊 Analyzing budget performance for:', userId, period);
    
    try {
      const cacheKey = `${userId}-${period}`;
      if (this.analysisCache.has(cacheKey)) {
        return this.analysisCache.get(cacheKey);
      }

      const data = await this.gatherBudgetData(userId, period);
      const analysis = await this.performComprehensiveAnalysis(data);
      
      // Cache results for 5 minutes
      this.analysisCache.set(cacheKey, analysis);
      setTimeout(() => this.analysisCache.delete(cacheKey), 300000);
      
      return analysis;
    } catch (error) {
      console.error('❌ Error in budget analysis:', error);
      throw error;
    }
  }

  async gatherBudgetData(userId, period) {
    const dataManager = window.app?.data;
    if (!dataManager) throw new Error('Data manager not available');

    const months = this.getPeriodMonths(period);
    const budgetData = {
      expenses: {},
      income: {},
      limits: dataManager.getSpendingLimits(),
      goals: dataManager.getGoals(),
      categories: dataManager.getCategories()
    };

    // Gather data for all months in period
    for (const month of months) {
      budgetData.expenses[month] = await dataManager.loadExpenses(month);
      budgetData.income[month] = await dataManager.loadIncome(month);
    }

    return budgetData;
  }

  async performComprehensiveAnalysis(data) {
    const analysis = {
      timestamp: new Date().toISOString(),
      overview: this.calculateOverviewMetrics(data),
      trends: this.analyzeTrends(data),
      anomalies: this.detectAnomalies(data),
      categoryAnalysis: this.analyzeCategoryPerformance(data),
      predictions: this.generateBasicPredictions(data),
      recommendations: this.generateRecommendations(data),
      riskAssessment: this.assessFinancialRisks(data)
    };

    return analysis;
  }

  calculateOverviewMetrics(data) {
    const months = Object.keys(data.expenses);
    let totalIncome = 0;
    let totalExpenses = 0;
    let monthlyData = [];

    months.forEach(month => {
      const monthExpenses = data.expenses[month]?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0;
      const monthIncome = (parseFloat(data.income[month]?.fixed) || 0) + (parseFloat(data.income[month]?.extra) || 0);
      
      totalIncome += monthIncome;
      totalExpenses += monthExpenses;
      
      monthlyData.push({
        month,
        income: monthIncome,
        expenses: monthExpenses,
        balance: monthIncome - monthExpenses,
        savingsRate: monthIncome > 0 ? ((monthIncome - monthExpenses) / monthIncome) * 100 : 0
      });
    });

    return {
      totalIncome,
      totalExpenses,
      totalBalance: totalIncome - totalExpenses,
      averageSavingsRate: monthlyData.reduce((sum, m) => sum + m.savingsRate, 0) / monthlyData.length,
      monthlyData,
      budgetEfficiency: this.calculateBudgetEfficiency(data),
      goalProgress: this.calculateGoalProgress(data.goals)
    };
  }

  analyzeTrends(data) {
    const months = Object.keys(data.expenses).sort();
    if (months.length < 2) return { insufficient_data: true };

    const trends = {
      expense: this.calculateTrend(months.map(m => 
        data.expenses[m]?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0
      )),
      income: this.calculateTrend(months.map(m => 
        (parseFloat(data.income[m]?.fixed) || 0) + (parseFloat(data.income[m]?.extra) || 0)
      )),
      categories: {}
    };

    // Category-specific trends
    data.categories.forEach(category => {
      const categoryData = months.map(month => {
        const monthExpenses = data.expenses[month] || [];
        return monthExpenses
          .filter(exp => exp.category === category.name)
          .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      });
      
      trends.categories[category.name] = this.calculateTrend(categoryData);
    });

    return trends;
  }

  calculateTrend(values) {
    if (values.length < 2) return { trend: 'insufficient_data' };

    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, i) => sum + (i + 1) * y, 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const trend = slope > this.anomalyThresholds.trend ? 'increasing' :
                  slope < -this.anomalyThresholds.trend ? 'decreasing' : 'stable';

    return {
      trend,
      slope,
      intercept,
      confidence: this.calculateTrendConfidence(values, slope, intercept),
      projection: this.projectNextPeriod(slope, intercept, n + 1)
    };
  }

  detectAnomalies(data) {
    const anomalies = [];
    const months = Object.keys(data.expenses);

    months.forEach(month => {
      const monthExpenses = data.expenses[month] || [];
      const monthTotal = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      
      // Check against spending limits
      data.limits.forEach(limit => {
        const categoryExpenses = monthExpenses
          .filter(exp => exp.category === limit.category)
          .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        
        const deviation = (categoryExpenses / limit.amount) - 1;
        
        if (Math.abs(deviation) > this.anomalyThresholds.deviation) {
          anomalies.push({
            type: 'spending_limit_deviation',
            month,
            category: limit.category,
            severity: Math.abs(deviation) > 0.5 ? 'high' : 'medium',
            deviation: deviation * 100,
            actual: categoryExpenses,
            expected: limit.amount,
            message: `${limit.category} spending ${deviation > 0 ? 'exceeded' : 'under'} limit by ${Math.abs(deviation * 100).toFixed(1)}%`
          });
        }
      });

      // Detect unusual expense patterns
      const unusualExpenses = this.detectUnusualExpenses(monthExpenses);
      anomalies.push(...unusualExpenses.map(exp => ({
        ...exp,
        month,
        type: 'unusual_expense'
      })));
    });

    return anomalies;
  }

  analyzeCategoryPerformance(data) {
    const categoryAnalysis = {};
    
    data.categories.forEach(category => {
      const categoryData = this.gatherCategoryData(data, category.name);
      
      categoryAnalysis[category.name] = {
        totalSpent: categoryData.total,
        averageMonthly: categoryData.average,
        trend: categoryData.trend,
        efficiency: this.calculateCategoryEfficiency(categoryData, data.limits),
        recommendations: this.generateCategoryRecommendations(categoryData, category.name),
        riskLevel: this.assessCategoryRisk(categoryData)
      };
    });

    return categoryAnalysis;
  }

  generateBasicPredictions(data) {
    const months = Object.keys(data.expenses).sort();
    if (months.length < 3) return { insufficient_data: true };

    const predictions = {
      nextMonth: {},
      nextQuarter: {},
      confidence: {}
    };

    // Predict expenses by category
    data.categories.forEach(category => {
      const categoryHistory = months.map(month => {
        const monthExpenses = data.expenses[month] || [];
        return monthExpenses
          .filter(exp => exp.category === category.name)
          .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      });

      const trend = this.calculateTrend(categoryHistory);
      predictions.nextMonth[category.name] = trend.projection;
      predictions.confidence[category.name] = trend.confidence;
    });

    return predictions;
  }

  generateRecommendations(data) {
    const recommendations = [];
    const analysis = this.calculateOverviewMetrics(data);

    // Savings rate recommendations
    if (analysis.averageSavingsRate < 10) {
      recommendations.push({
        type: 'savings_improvement',
        priority: 'high',
        title: 'Mejorar Tasa de Ahorro',
        description: 'Tu tasa de ahorro promedio es baja. Considera reducir gastos no esenciales.',
        impact: 'high',
        effort: 'medium',
        actions: [
          'Revisar gastos en categorías de mayor impacto',
          'Establecer límites más estrictos',
          'Automatizar transferencias a ahorro'
        ]
      });
    }

    // Category-specific recommendations
    const categoryAnalysis = this.analyzeCategoryPerformance(data);
    Object.entries(categoryAnalysis).forEach(([category, analysis]) => {
      if (analysis.riskLevel === 'high') {
        recommendations.push({
          type: 'category_optimization',
          priority: 'medium',
          title: `Optimizar Gastos en ${category}`,
          description: `Los gastos en ${category} muestran patrones de riesgo alto.`,
          impact: 'medium',
          effort: 'low',
          actions: analysis.recommendations
        });
      }
    });

    // Goal-based recommendations
    data.goals.forEach(goal => {
      const progress = (goal.current_amount / goal.target_amount) * 100;
      if (progress < 25) {
        recommendations.push({
          type: 'goal_acceleration',
          priority: 'medium',
          title: `Acelerar Progreso: ${goal.name}`,
          description: 'El progreso hacia este objetivo es lento.',
          impact: 'medium',
          effort: 'medium',
          actions: [
            'Aumentar contribuciones mensuales',
            'Reducir gastos en categorías no prioritarias',
            'Considerar ingresos adicionales'
          ]
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  assessFinancialRisks(data) {
    const risks = [];
    const analysis = this.calculateOverviewMetrics(data);

    // Cash flow risk
    if (analysis.totalBalance < 0) {
      risks.push({
        type: 'cash_flow',
        level: 'high',
        description: 'Flujo de caja negativo detectado',
        impact: 'Riesgo de problemas financieros inmediatos',
        mitigation: 'Reducir gastos urgentemente o aumentar ingresos'
      });
    }

    // Savings risk
    if (analysis.averageSavingsRate < 5) {
      risks.push({
        type: 'savings_inadequate',
        level: 'medium',
        description: 'Tasa de ahorro insuficiente',
        impact: 'Vulnerabilidad ante emergencias financieras',
        mitigation: 'Establecer plan de ahorro automático'
      });
    }

    // Spending pattern risks
    const anomalies = this.detectAnomalies(data);
    const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high');
    
    if (highSeverityAnomalies.length > 0) {
      risks.push({
        type: 'spending_volatility',
        level: 'medium',
        description: 'Patrones de gasto volátiles detectados',
        impact: 'Dificultad para mantener presupuesto consistente',
        mitigation: 'Implementar controles de gasto más estrictos'
      });
    }

    return risks;
  }

  // Utility methods
  getPeriodMonths(period) {
    const now = new Date();
    const months = [];

    switch (period) {
      case 'current':
        months.push(`${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`);
        break;
      case 'last3':
        for (let i = 0; i < 3; i++) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push(`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`);
        }
        break;
      case 'last6':
        for (let i = 0; i < 6; i++) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push(`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`);
        }
        break;
      default:
        months.push(`${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`);
    }

    return months;
  }

  calculateBudgetEfficiency(data) {
    const limits = data.limits;
    if (limits.length === 0) return 0;

    let totalEfficiency = 0;
    let validLimits = 0;

    limits.forEach(limit => {
      const categoryExpenses = Object.values(data.expenses).flat()
        .filter(exp => exp.category === limit.category)
        .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

      if (categoryExpenses > 0) {
        const utilization = Math.min(categoryExpenses / limit.amount, 1);
        totalEfficiency += utilization;
        validLimits++;
      }
    });

    return validLimits > 0 ? (totalEfficiency / validLimits) * 100 : 0;
  }

  calculateGoalProgress(goals) {
    if (goals.length === 0) return 0;

    const totalProgress = goals.reduce((sum, goal) => {
      return sum + Math.min((goal.current_amount / goal.target_amount) * 100, 100);
    }, 0);

    return totalProgress / goals.length;
  }

  calculateTrendConfidence(values, slope, intercept) {
    const predictions = values.map((_, i) => slope * (i + 1) + intercept);
    const errors = values.map((actual, i) => Math.abs(actual - predictions[i]));
    const meanError = errors.reduce((a, b) => a + b, 0) / errors.length;
    const meanValue = values.reduce((a, b) => a + b, 0) / values.length;
    
    return Math.max(0, Math.min(100, 100 - (meanError / meanValue) * 100));
  }

  projectNextPeriod(slope, intercept, nextPeriod) {
    return Math.max(0, slope * nextPeriod + intercept);
  }

  detectUnusualExpenses(expenses) {
    if (expenses.length === 0) return [];

    const amounts = expenses.map(exp => parseFloat(exp.amount));
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length);
    
    const threshold = mean + (2 * stdDev); // 2 standard deviations
    
    return expenses.filter(exp => parseFloat(exp.amount) > threshold).map(exp => ({
      expense: exp,
      severity: parseFloat(exp.amount) > mean + (3 * stdDev) ? 'high' : 'medium',
      deviation: ((parseFloat(exp.amount) - mean) / mean) * 100,
      message: `Unusual expense detected: ${exp.description} (${((parseFloat(exp.amount) - mean) / mean * 100).toFixed(1)}% above average)`
    }));
  }

  gatherCategoryData(data, categoryName) {
    const months = Object.keys(data.expenses);
    const monthlyAmounts = months.map(month => {
      const monthExpenses = data.expenses[month] || [];
      return monthExpenses
        .filter(exp => exp.category === categoryName)
        .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    });

    const total = monthlyAmounts.reduce((a, b) => a + b, 0);
    const average = monthlyAmounts.length > 0 ? total / monthlyAmounts.length : 0;
    const trend = this.calculateTrend(monthlyAmounts);

    return { total, average, trend, monthlyAmounts };
  }

  calculateCategoryEfficiency(categoryData, limits) {
    const limit = limits.find(l => l.category === categoryData.category);
    if (!limit) return null;

    const utilization = categoryData.average / limit.amount;
    return {
      utilization: Math.min(utilization * 100, 100),
      status: utilization > 1 ? 'over_budget' : utilization > 0.8 ? 'near_limit' : 'within_budget'
    };
  }

  generateCategoryRecommendations(categoryData, categoryName) {
    const recommendations = [];

    if (categoryData.trend.trend === 'increasing') {
      recommendations.push(`Controlar el crecimiento de gastos en ${categoryName}`);
      recommendations.push('Establecer límites más estrictos');
    }

    if (categoryData.average > 0) {
      recommendations.push('Buscar alternativas más económicas');
      recommendations.push('Planificar compras con anticipación');
    }

    return recommendations;
  }

  assessCategoryRisk(categoryData) {
    let riskScore = 0;

    // Trend risk
    if (categoryData.trend.trend === 'increasing') riskScore += 2;
    
    // Volatility risk
    const volatility = this.calculateVolatility(categoryData.monthlyAmounts);
    if (volatility > 0.3) riskScore += 2;
    
    // Amount risk
    if (categoryData.average > 1000) riskScore += 1;

    return riskScore >= 4 ? 'high' : riskScore >= 2 ? 'medium' : 'low';
  }

  calculateVolatility(values) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return mean > 0 ? stdDev / mean : 0;
  }

  // Public API methods
  async getAnalyticsDashboard(userId, period = 'current') {
    const analysis = await this.analyzeBudgetPerformance(userId, period);
    
    return {
      overview: analysis.overview,
      keyMetrics: this.extractKeyMetrics(analysis),
      alerts: this.extractAlerts(analysis),
      recommendations: analysis.recommendations.slice(0, 5), // Top 5 recommendations
      charts: this.prepareChartData(analysis)
    };
  }

  extractKeyMetrics(analysis) {
    return {
      budgetEfficiency: analysis.overview.budgetEfficiency,
      savingsRate: analysis.overview.averageSavingsRate,
      goalProgress: analysis.overview.goalProgress,
      riskLevel: this.calculateOverallRisk(analysis.riskAssessment),
      anomalyCount: analysis.anomalies.length,
      trendDirection: this.getOverallTrend(analysis.trends)
    };
  }

  extractAlerts(analysis) {
    const alerts = [];
    
    // High-priority anomalies
    analysis.anomalies
      .filter(a => a.severity === 'high')
      .forEach(anomaly => {
        alerts.push({
          type: 'anomaly',
          severity: 'high',
          message: anomaly.message,
          category: anomaly.category
        });
      });

    // High-risk assessments
    analysis.riskAssessment
      .filter(r => r.level === 'high')
      .forEach(risk => {
        alerts.push({
          type: 'risk',
          severity: 'high',
          message: risk.description,
          mitigation: risk.mitigation
        });
      });

    return alerts;
  }

  prepareChartData(analysis) {
    return {
      monthlyTrends: analysis.overview.monthlyData,
      categoryBreakdown: analysis.categoryAnalysis,
      savingsProgress: analysis.overview.goalProgress,
      budgetUtilization: this.calculateBudgetUtilization(analysis)
    };
  }

  calculateOverallRisk(risks) {
    const highRisks = risks.filter(r => r.level === 'high').length;
    const mediumRisks = risks.filter(r => r.level === 'medium').length;
    
    if (highRisks > 0) return 'high';
    if (mediumRisks > 1) return 'medium';
    return 'low';
  }

  getOverallTrend(trends) {
    const expenseTrend = trends.expense?.trend;
    const incomeTrend = trends.income?.trend;
    
    if (expenseTrend === 'increasing' && incomeTrend !== 'increasing') return 'concerning';
    if (expenseTrend === 'decreasing' && incomeTrend === 'increasing') return 'improving';
    return 'stable';
  }

  calculateBudgetUtilization(analysis) {
    const utilization = {};
    
    Object.entries(analysis.categoryAnalysis).forEach(([category, data]) => {
      if (data.efficiency) {
        utilization[category] = data.efficiency.utilization;
      }
    });
    
    return utilization;
  }
}