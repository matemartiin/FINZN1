import { BudgetAnalytics } from './budget-analytics.js';
import { BudgetIntelligence } from './budget-intelligence.js';

export class BudgetManager {
  constructor() {
    this.analytics = new BudgetAnalytics();
    this.intelligence = new BudgetIntelligence();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('📊 Initializing Budget Manager...');
    
    try {
      await this.intelligence.initialize();
      this.isInitialized = true;
      console.log('✅ Budget Manager initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Budget Manager:', error);
      throw error;
    }
  }

  async generateComprehensiveBudgetReport(userId, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      period = 'current',
      includeIntelligence = true,
      includeRecommendations = true,
      includeForecasting = true
    } = options;

    console.log('📊 Generating comprehensive budget report for:', userId);

    try {
      const report = {
        metadata: {
          userId,
          period,
          generatedAt: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      // Core analytics
      report.analytics = await this.analytics.getAnalyticsDashboard(userId, period);
      
      // Intelligence insights (if requested)
      if (includeIntelligence) {
        report.intelligence = await this.intelligence.generateIntelligentInsights(userId, period);
      }

      // Enhanced recommendations
      if (includeRecommendations) {
        report.recommendations = await this.generateEnhancedRecommendations(userId, period);
      }

      // Forecasting (if requested)
      if (includeForecasting) {
        report.forecasting = await this.generateBudgetForecasts(userId, period);
      }

      // Executive summary
      report.executiveSummary = this.generateExecutiveSummary(report);

      console.log('✅ Comprehensive budget report generated successfully');
      return report;

    } catch (error) {
      console.error('❌ Error generating comprehensive budget report:', error);
      throw error;
    }
  }

  async generateEnhancedRecommendations(userId, period) {
    const analysis = await this.analytics.analyzeBudgetPerformance(userId, period);
    const recommendations = [];

    // Priority-based recommendations
    const priorityMatrix = this.createPriorityMatrix(analysis);
    
    priorityMatrix.forEach(item => {
      recommendations.push({
        id: this.generateRecommendationId(),
        title: item.title,
        description: item.description,
        priority: item.priority,
        impact: item.impact,
        effort: item.effort,
        category: item.category,
        actions: item.actions,
        expectedOutcome: item.expectedOutcome,
        timeframe: item.timeframe,
        metrics: item.metrics
      });
    });

    return {
      recommendations: recommendations.sort((a, b) => b.priority - a.priority),
      summary: this.generateRecommendationsSummary(recommendations)
    };
  }

  async generateBudgetForecasts(userId, period) {
    const analysis = await this.analytics.analyzeBudgetPerformance(userId, period);
    
    return {
      nextMonth: this.forecastNextMonth(analysis),
      nextQuarter: this.forecastNextQuarter(analysis),
      yearEnd: this.forecastYearEnd(analysis),
      scenarios: this.generateScenarios(analysis),
      confidence: this.calculateForecastConfidence(analysis)
    };
  }

  generateExecutiveSummary(report) {
    const analytics = report.analytics;
    const intelligence = report.intelligence;
    
    const summary = {
      overallHealth: this.assessOverallFinancialHealth(analytics),
      keyFindings: this.extractKeyFindings(analytics, intelligence),
      criticalActions: this.identifyCriticalActions(intelligence),
      opportunityScore: this.calculateOpportunityScore(analytics),
      riskScore: this.calculateRiskScore(analytics),
      nextSteps: this.generateNextSteps(intelligence)
    };

    return summary;
  }

  // Helper methods for enhanced functionality
  createPriorityMatrix(analysis) {
    const matrix = [];
    const overview = analysis.overview;

    // High-impact, low-effort recommendations
    if (overview.averageSavingsRate < 15) {
      matrix.push({
        title: 'Optimizar Tasa de Ahorro',
        description: 'Implementar estrategias para alcanzar el 15-20% de tasa de ahorro',
        priority: 9,
        impact: 'high',
        effort: 'medium',
        category: 'savings',
        actions: [
          'Automatizar transferencias a ahorro',
          'Aplicar regla 50/30/20',
          'Reducir gastos no esenciales'
        ],
        expectedOutcome: `Incremento potencial de ${this.formatCurrency(overview.totalIncome * 0.05)} mensuales`,
        timeframe: '30 días',
        metrics: ['savings_rate', 'monthly_savings_amount']
      });
    }

    // Category optimization opportunities
    Object.entries(analysis.categoryAnalysis).forEach(([category, data]) => {
      if (data.riskLevel === 'high' && data.totalSpent > 1000) {
        matrix.push({
          title: `Optimizar Gastos en ${category}`,
          description: `Reducir gastos en ${category} mediante mejores prácticas`,
          priority: 7,
          impact: 'medium',
          effort: 'low',
          category: 'optimization',
          actions: data.recommendations,
          expectedOutcome: `Ahorro potencial de ${this.formatCurrency(data.totalSpent * 0.1)}`,
          timeframe: '14 días',
          metrics: ['category_spending', 'budget_efficiency']
        });
      }
    });

    return matrix;
  }

  forecastNextMonth(analysis) {
    const trends = analysis.trends;
    const overview = analysis.overview;
    
    const forecast = {
      expectedIncome: this.projectIncome(trends.income, overview),
      expectedExpenses: this.projectExpenses(trends.expense, overview),
      categoryForecasts: {},
      confidence: 0
    };

    // Category-specific forecasts
    Object.entries(trends.categories).forEach(([category, trend]) => {
      forecast.categoryForecasts[category] = {
        projected: trend.projection,
        confidence: trend.confidence,
        trend: trend.trend
      };
    });

    forecast.projectedBalance = forecast.expectedIncome - forecast.expectedExpenses;
    forecast.confidence = this.calculateForecastConfidence(analysis);

    return forecast;
  }

  forecastNextQuarter(analysis) {
    const monthlyForecast = this.forecastNextMonth(analysis);
    
    return {
      totalIncome: monthlyForecast.expectedIncome * 3,
      totalExpenses: monthlyForecast.expectedExpenses * 3,
      projectedBalance: monthlyForecast.projectedBalance * 3,
      confidence: Math.max(0, monthlyForecast.confidence - 15), // Lower confidence for longer period
      assumptions: [
        'Patrones de gasto actuales se mantienen',
        'No cambios significativos en ingresos',
        'Condiciones económicas estables'
      ]
    };
  }

  generateScenarios(analysis) {
    const baseCase = this.forecastNextMonth(analysis);
    
    return {
      optimistic: {
        ...baseCase,
        expectedIncome: baseCase.expectedIncome * 1.1,
        expectedExpenses: baseCase.expectedExpenses * 0.9,
        description: 'Escenario con incremento de ingresos y reducción de gastos'
      },
      pessimistic: {
        ...baseCase,
        expectedIncome: baseCase.expectedIncome * 0.9,
        expectedExpenses: baseCase.expectedExpenses * 1.1,
        description: 'Escenario con reducción de ingresos y aumento de gastos'
      },
      realistic: baseCase
    };
  }

  assessOverallFinancialHealth(analytics) {
    const metrics = analytics.keyMetrics;
    let healthScore = 0;

    // Savings rate (30% weight)
    if (metrics.savingsRate >= 20) healthScore += 30;
    else if (metrics.savingsRate >= 10) healthScore += 20;
    else if (metrics.savingsRate >= 0) healthScore += 10;

    // Budget efficiency (25% weight)
    if (metrics.budgetEfficiency >= 80) healthScore += 25;
    else if (metrics.budgetEfficiency >= 60) healthScore += 20;
    else if (metrics.budgetEfficiency >= 40) healthScore += 15;

    // Goal progress (20% weight)
    if (metrics.goalProgress >= 75) healthScore += 20;
    else if (metrics.goalProgress >= 50) healthScore += 15;
    else if (metrics.goalProgress >= 25) healthScore += 10;

    // Risk level (25% weight)
    if (metrics.riskLevel === 'low') healthScore += 25;
    else if (metrics.riskLevel === 'medium') healthScore += 15;
    else healthScore += 5;

    return {
      score: healthScore,
      rating: healthScore >= 80 ? 'excellent' : 
              healthScore >= 60 ? 'good' : 
              healthScore >= 40 ? 'fair' : 'poor',
      components: {
        savings: metrics.savingsRate,
        efficiency: metrics.budgetEfficiency,
        goals: metrics.goalProgress,
        risk: metrics.riskLevel
      }
    };
  }

  extractKeyFindings(analytics, intelligence) {
    const findings = [];

    // From analytics
    if (analytics.keyMetrics.anomalyCount > 0) {
      findings.push(`${analytics.keyMetrics.anomalyCount} anomalías detectadas en patrones de gasto`);
    }

    if (analytics.keyMetrics.trendDirection === 'concerning') {
      findings.push('Tendencia preocupante: gastos aumentando más rápido que ingresos');
    }

    // From intelligence
    if (intelligence && intelligence.insights) {
      const highImpactInsights = intelligence.insights.filter(i => i.impact >= 8);
      highImpactInsights.forEach(insight => {
        findings.push(insight.title);
      });
    }

    return findings;
  }

  identifyCriticalActions(intelligence) {
    if (!intelligence || !intelligence.actionPlan) return [];

    return intelligence.actionPlan.immediate.slice(0, 3).map(action => ({
      action: action.action,
      category: action.category,
      impact: action.impact,
      timeframe: 'Inmediato (próximos 7 días)'
    }));
  }

  calculateOpportunityScore(analytics) {
    let score = 0;
    const metrics = analytics.keyMetrics;

    // Savings opportunity
    if (metrics.savingsRate < 20) score += 30;
    
    // Efficiency opportunity
    if (metrics.budgetEfficiency < 80) score += 25;
    
    // Goal acceleration opportunity
    if (metrics.goalProgress < 75) score += 20;
    
    // Optimization opportunity
    if (metrics.anomalyCount > 0) score += 25;

    return Math.min(100, score);
  }

  calculateRiskScore(analytics) {
    let score = 0;
    const metrics = analytics.keyMetrics;

    if (metrics.riskLevel === 'high') score += 40;
    else if (metrics.riskLevel === 'medium') score += 20;

    if (metrics.savingsRate < 5) score += 30;
    if (metrics.budgetEfficiency < 40) score += 20;
    if (metrics.anomalyCount > 3) score += 10;

    return Math.min(100, score);
  }

  generateNextSteps(intelligence) {
    if (!intelligence || !intelligence.actionPlan) return [];

    const nextSteps = [];
    
    // Immediate actions
    if (intelligence.actionPlan.immediate.length > 0) {
      nextSteps.push({
        timeframe: 'Esta semana',
        actions: intelligence.actionPlan.immediate.slice(0, 2).map(a => a.action)
      });
    }

    // Short-term actions
    if (intelligence.actionPlan.shortTerm.length > 0) {
      nextSteps.push({
        timeframe: 'Próximos 30 días',
        actions: intelligence.actionPlan.shortTerm.slice(0, 3).map(a => a.action)
      });
    }

    return nextSteps;
  }

  // Utility methods
  projectIncome(incomeTrend, overview) {
    if (!incomeTrend || incomeTrend.trend === 'insufficient_data') {
      return overview.totalIncome / overview.monthlyData.length;
    }
    return incomeTrend.projection;
  }

  projectExpenses(expenseTrend, overview) {
    if (!expenseTrend || expenseTrend.trend === 'insufficient_data') {
      return overview.totalExpenses / overview.monthlyData.length;
    }
    return expenseTrend.projection;
  }

  calculateForecastConfidence(analysis) {
    const dataPoints = analysis.overview.monthlyData.length;
    const baseConfidence = Math.min(90, dataPoints * 15); // More data = higher confidence
    
    // Reduce confidence based on volatility
    const volatilityPenalty = analysis.anomalies.length * 5;
    
    return Math.max(30, baseConfidence - volatilityPenalty);
  }

  generateRecommendationsSummary(recommendations) {
    const highPriority = recommendations.filter(r => r.priority >= 8).length;
    const mediumPriority = recommendations.filter(r => r.priority >= 5 && r.priority < 8).length;
    const lowPriority = recommendations.filter(r => r.priority < 5).length;

    return {
      total: recommendations.length,
      byPriority: {
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority
      },
      categories: this.groupRecommendationsByCategory(recommendations)
    };
  }

  groupRecommendationsByCategory(recommendations) {
    const categories = {};
    recommendations.forEach(rec => {
      if (!categories[rec.category]) {
        categories[rec.category] = 0;
      }
      categories[rec.category]++;
    });
    return categories;
  }

  generateRecommendationId() {
    return 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Public API methods
  async getBudgetAnalytics(userId, period = 'current') {
    if (!this.isInitialized) await this.initialize();
    return await this.analytics.getAnalyticsDashboard(userId, period);
  }

  async getBudgetIntelligence(userId, period = 'current') {
    if (!this.isInitialized) await this.initialize();
    return await this.intelligence.getBudgetIntelligenceReport(userId, period);
  }

  async getQuickInsights(userId) {
    if (!this.isInitialized) await this.initialize();
    
    const analytics = await this.analytics.getAnalyticsDashboard(userId, 'current');
    const intelligence = await this.intelligence.generateIntelligentInsights(userId, 'current');
    
    return {
      healthScore: this.assessOverallFinancialHealth(analytics),
      topInsights: intelligence.insights.slice(0, 3),
      urgentActions: intelligence.actionPlan.immediate.slice(0, 2),
      keyMetrics: analytics.keyMetrics
    };
  }
}