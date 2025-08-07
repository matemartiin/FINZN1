/**
 * Budget AI Module - Phase 1 Implementation
 * Foundational AI infrastructure for budget analysis and predictions
 */

export class BudgetAIManager {
  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.isEnabled = !!this.apiKey;
    this.cache = new Map();
    this.analysisQueue = [];
    this.isProcessing = false;
  }

  /**
   * PHASE 1: Basic Pattern Analysis
   * Analyzes spending patterns and provides basic insights
   */
  async analyzeSpendingPatterns(expenses, timeframe = 'monthly') {
    if (!this.isEnabled) {
      return this.getFallbackPatternAnalysis(expenses);
    }

    const cacheKey = `patterns_${timeframe}_${this.hashExpenses(expenses)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const analysis = await this.performPatternAnalysis(expenses, timeframe);
      this.cache.set(cacheKey, analysis);
      return analysis;
    } catch (error) {
      console.error('Error in AI pattern analysis:', error);
      return this.getFallbackPatternAnalysis(expenses);
    }
  }

  async performPatternAnalysis(expenses, timeframe) {
    const prompt = this.buildPatternAnalysisPrompt(expenses, timeframe);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const result = await response.json();
    const aiContent = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return this.parsePatternAnalysis(aiContent, expenses);
  }

  buildPatternAnalysisPrompt(expenses, timeframe) {
    const categoryTotals = this.calculateCategoryTotals(expenses);
    const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    
    return `Analiza los siguientes patrones de gasto y proporciona insights específicos:

DATOS DE GASTOS (${timeframe}):
- Total gastado: $${totalSpent.toLocaleString()}
- Número de transacciones: ${expenses.length}

GASTOS POR CATEGORÍA:
${Object.entries(categoryTotals)
  .sort(([,a], [,b]) => b - a)
  .map(([cat, amount]) => `- ${cat}: $${amount.toLocaleString()} (${((amount/totalSpent)*100).toFixed(1)}%)`)
  .join('\n')}

TRANSACCIONES RECIENTES:
${expenses.slice(0, 10).map(exp => 
  `- ${exp.description}: $${exp.amount} (${exp.category})`
).join('\n')}

Proporciona un análisis JSON con esta estructura exacta:
{
  "patterns": {
    "dominant_category": "categoría con mayor gasto",
    "spending_frequency": "alta/media/baja",
    "average_transaction": número,
    "volatility": "alta/media/baja"
  },
  "insights": [
    "insight específico 1",
    "insight específico 2",
    "insight específico 3"
  ],
  "recommendations": [
    "recomendación específica 1",
    "recomendación específica 2"
  ],
  "alerts": [
    "alerta si hay patrones preocupantes"
  ]
}

Responde SOLO con el JSON, sin texto adicional.`;
  }

  parsePatternAnalysis(aiContent, expenses) {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        
        // Add calculated metrics
        analysis.metrics = this.calculateAdvancedMetrics(expenses);
        analysis.timestamp = new Date().toISOString();
        
        return analysis;
      }
    } catch (error) {
      console.error('Error parsing AI analysis:', error);
    }
    
    return this.getFallbackPatternAnalysis(expenses);
  }

  calculateAdvancedMetrics(expenses) {
    const amounts = expenses.map(exp => parseFloat(exp.amount));
    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    
    return {
      total_spent: total,
      transaction_count: expenses.length,
      average_transaction: total / expenses.length,
      median_transaction: this.calculateMedian(amounts),
      std_deviation: this.calculateStandardDeviation(amounts),
      category_diversity: Object.keys(this.calculateCategoryTotals(expenses)).length
    };
  }

  /**
   * PHASE 1: Smart Alerts System
   * Generates intelligent alerts based on spending patterns
   */
  async generateSmartAlerts(expenses, limits, historicalData = []) {
    const alerts = [];
    
    // Pattern-based alerts
    const patterns = await this.analyzeSpendingPatterns(expenses);
    if (patterns.alerts && patterns.alerts.length > 0) {
      alerts.push(...patterns.alerts.map(alert => ({
        type: 'pattern',
        severity: 'medium',
        message: alert,
        category: 'spending_pattern'
      })));
    }
    
    // Limit-based intelligent alerts
    const limitAlerts = this.generateLimitAlerts(expenses, limits);
    alerts.push(...limitAlerts);
    
    // Trend-based alerts
    if (historicalData.length > 0) {
      const trendAlerts = this.generateTrendAlerts(expenses, historicalData);
      alerts.push(...trendAlerts);
    }
    
    return alerts.sort((a, b) => this.getAlertPriority(b) - this.getAlertPriority(a));
  }

  generateLimitAlerts(expenses, limits) {
    const alerts = [];
    const categoryTotals = this.calculateCategoryTotals(expenses);
    
    limits.forEach(limit => {
      const spent = categoryTotals[limit.category] || 0;
      const percentage = (spent / limit.amount) * 100;
      
      if (percentage >= 100) {
        alerts.push({
          type: 'limit_exceeded',
          severity: 'high',
          message: `Has superado el límite de ${limit.category} por $${(spent - limit.amount).toLocaleString()}`,
          category: limit.category,
          percentage: percentage.toFixed(1)
        });
      } else if (percentage >= limit.warning_percentage) {
        // Intelligent prediction: will user exceed limit this month?
        const daysInMonth = new Date().getDate();
        const daysRemaining = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - daysInMonth;
        const projectedSpending = spent * (30 / daysInMonth);
        
        if (projectedSpending > limit.amount) {
          alerts.push({
            type: 'limit_projection',
            severity: 'medium',
            message: `Proyección: superarás el límite de ${limit.category} en $${(projectedSpending - limit.amount).toLocaleString()}`,
            category: limit.category,
            percentage: percentage.toFixed(1),
            projected_overage: projectedSpending - limit.amount
          });
        } else {
          alerts.push({
            type: 'limit_warning',
            severity: 'low',
            message: `Te acercas al límite de ${limit.category} (${percentage.toFixed(1)}% utilizado)`,
            category: limit.category,
            percentage: percentage.toFixed(1)
          });
        }
      }
    });
    
    return alerts;
  }

  generateTrendAlerts(currentExpenses, historicalData) {
    const alerts = [];
    const currentTotal = currentExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const historicalAverage = historicalData.reduce((sum, month) => sum + month.total, 0) / historicalData.length;
    
    const variance = ((currentTotal - historicalAverage) / historicalAverage) * 100;
    
    if (variance > 20) {
      alerts.push({
        type: 'spending_spike',
        severity: 'medium',
        message: `Tus gastos están ${variance.toFixed(1)}% por encima del promedio histórico`,
        variance: variance.toFixed(1)
      });
    } else if (variance < -20) {
      alerts.push({
        type: 'spending_drop',
        severity: 'low',
        message: `Excelente! Tus gastos están ${Math.abs(variance).toFixed(1)}% por debajo del promedio`,
        variance: variance.toFixed(1)
      });
    }
    
    return alerts;
  }

  /**
   * PHASE 1: Enhanced Reporting
   * Generates intelligent reports with AI insights
   */
  async generateIntelligentReport(data, focus = 'general') {
    if (!this.isEnabled) {
      return this.getFallbackReport(data, focus);
    }

    try {
      const patterns = await this.analyzeSpendingPatterns(data.expenses);
      const alerts = await this.generateSmartAlerts(data.expenses, data.limits, data.historical);
      
      return {
        summary: this.generateReportSummary(data, patterns),
        patterns: patterns,
        alerts: alerts,
        recommendations: this.generateRecommendations(patterns, alerts, data),
        metrics: this.calculateReportMetrics(data),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating intelligent report:', error);
      return this.getFallbackReport(data, focus);
    }
  }

  generateReportSummary(data, patterns) {
    const totalSpent = data.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const totalIncome = data.income || 0;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome * 100) : 0;
    
    return {
      total_spent: totalSpent,
      total_income: totalIncome,
      savings_rate: savingsRate.toFixed(1),
      dominant_category: patterns.patterns?.dominant_category || 'N/A',
      transaction_count: data.expenses.length,
      average_transaction: patterns.metrics?.average_transaction || 0
    };
  }

  generateRecommendations(patterns, alerts, data) {
    const recommendations = [];
    
    // Based on patterns
    if (patterns.recommendations) {
      recommendations.push(...patterns.recommendations.map(rec => ({
        type: 'pattern_based',
        priority: 'medium',
        action: rec
      })));
    }
    
    // Based on alerts
    const highSeverityAlerts = alerts.filter(alert => alert.severity === 'high');
    if (highSeverityAlerts.length > 0) {
      recommendations.push({
        type: 'urgent_action',
        priority: 'high',
        action: 'Revisa inmediatamente las categorías que han superado sus límites'
      });
    }
    
    // Based on savings rate
    const totalSpent = data.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const savingsRate = data.income > 0 ? ((data.income - totalSpent) / data.income * 100) : 0;
    
    if (savingsRate < 10) {
      recommendations.push({
        type: 'savings_improvement',
        priority: 'high',
        action: 'Considera reducir gastos no esenciales para mejorar tu tasa de ahorro'
      });
    }
    
    return recommendations;
  }

  // Utility methods
  calculateCategoryTotals(expenses) {
    return expenses.reduce((totals, expense) => {
      const category = expense.category;
      totals[category] = (totals[category] || 0) + parseFloat(expense.amount);
      return totals;
    }, {});
  }

  calculateMedian(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  calculateStandardDeviation(numbers) {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
    return Math.sqrt(avgSquaredDiff);
  }

  hashExpenses(expenses) {
    const str = JSON.stringify(expenses.map(exp => ({ 
      amount: exp.amount, 
      category: exp.category, 
      date: exp.transaction_date 
    })));
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  getAlertPriority(alert) {
    const priorities = { high: 3, medium: 2, low: 1 };
    return priorities[alert.severity] || 0;
  }

  calculateReportMetrics(data) {
    const expenses = data.expenses || [];
    const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    
    return {
      total_transactions: expenses.length,
      total_amount: totalSpent,
      categories_used: Object.keys(this.calculateCategoryTotals(expenses)).length,
      average_per_transaction: expenses.length > 0 ? totalSpent / expenses.length : 0,
      limits_configured: (data.limits || []).length,
      goals_active: (data.goals || []).length
    };
  }

  // Fallback methods for when AI is not available
  getFallbackPatternAnalysis(expenses) {
    const categoryTotals = this.calculateCategoryTotals(expenses);
    const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const topCategory = Object.entries(categoryTotals).sort(([,a], [,b]) => b - a)[0];
    
    return {
      patterns: {
        dominant_category: topCategory ? topCategory[0] : 'N/A',
        spending_frequency: expenses.length > 20 ? 'alta' : expenses.length > 10 ? 'media' : 'baja',
        average_transaction: totalSpent / expenses.length,
        volatility: 'media'
      },
      insights: [
        `Tu categoría de mayor gasto es ${topCategory ? topCategory[0] : 'N/A'}`,
        `Realizaste ${expenses.length} transacciones este período`,
        `Tu gasto promedio por transacción es $${(totalSpent / expenses.length).toFixed(2)}`
      ],
      recommendations: [
        'Revisa tus gastos más frecuentes para identificar oportunidades de ahorro',
        'Considera establecer límites para las categorías de mayor gasto'
      ],
      alerts: [],
      metrics: this.calculateAdvancedMetrics(expenses)
    };
  }

  getFallbackReport(data, focus) {
    const patterns = this.getFallbackPatternAnalysis(data.expenses || []);
    
    return {
      summary: this.generateReportSummary(data, patterns),
      patterns: patterns,
      alerts: [],
      recommendations: patterns.recommendations.map(rec => ({
        type: 'general',
        priority: 'medium',
        action: rec
      })),
      metrics: this.calculateReportMetrics(data),
      timestamp: new Date().toISOString()
    };
  }
}