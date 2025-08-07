import { supabase } from '../config/supabase.js';
import { AIBudgetManager } from './ai-budget.js';

export class SmartBudgetManager {
  constructor() {
    this.aiManager = new AIBudgetManager();
    this.budgets = new Map();
    this.alerts = [];
  }

  // ===== GESTIÓN DE PRESUPUESTOS INTELIGENTES =====
  async createSmartBudget(userId, budgetData) {
    try {
      console.log('🧠 Creating smart budget for:', userId);
      
      // Analyze historical data for smart suggestions
      const suggestions = await this.generateBudgetSuggestions(userId, budgetData.categories);
      
      // Create budget with AI-enhanced allocations
      const smartBudget = {
        user_id: userId,
        name: budgetData.name,
        period: budgetData.period || 'monthly',
        total_amount: budgetData.totalAmount,
        categories: await this.optimizeCategoryAllocations(budgetData.categories, suggestions),
        ai_suggestions: suggestions,
        auto_adjust: budgetData.autoAdjust || false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('smart_budgets')
        .insert([smartBudget])
        .select();

      if (error) throw error;

      // Set up monitoring and alerts
      await this.setupBudgetMonitoring(data[0].id);

      return {
        budget: data[0],
        suggestions,
        recommendations: await this.generateInitialRecommendations(data[0])
      };
    } catch (error) {
      console.error('Error creating smart budget:', error);
      throw error;
    }
  }

  async generateBudgetSuggestions(userId, requestedCategories) {
    try {
      // Get historical spending patterns
      const historicalData = await this.getHistoricalSpending(userId, 6); // Last 6 months
      
      if (historicalData.length === 0) {
        return this.getDefaultBudgetSuggestions(requestedCategories);
      }

      // Analyze spending patterns
      const patterns = this.analyzeSpendingPatterns(historicalData);
      
      // Generate AI-powered suggestions
      const suggestions = {};
      
      for (const category of requestedCategories) {
        const categoryData = patterns[category] || {};
        
        suggestions[category] = {
          recommended_amount: this.calculateRecommendedAmount(categoryData),
          confidence: this.calculateConfidence(categoryData),
          trend: this.calculateTrend(categoryData),
          seasonality: this.detectSeasonality(categoryData),
          risk_level: this.assessRiskLevel(categoryData),
          optimization_tips: await this.generateCategoryTips(category, categoryData)
        };
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating budget suggestions:', error);
      return this.getDefaultBudgetSuggestions(requestedCategories);
    }
  }

  async optimizeCategoryAllocations(requestedCategories, suggestions) {
    const optimizedCategories = {};
    
    for (const [category, amount] of Object.entries(requestedCategories)) {
      const suggestion = suggestions[category];
      
      if (suggestion && suggestion.confidence > 0.7) {
        // Use AI recommendation if confidence is high
        optimizedCategories[category] = {
          allocated: suggestion.recommended_amount,
          original_request: amount,
          optimization_applied: true,
          reason: 'AI recommendation based on historical data'
        };
      } else {
        // Use user's original amount
        optimizedCategories[category] = {
          allocated: amount,
          original_request: amount,
          optimization_applied: false,
          reason: 'Insufficient data for optimization'
        };
      }
    }

    return optimizedCategories;
  }

  // ===== MONITOREO INTELIGENTE =====
  async setupBudgetMonitoring(budgetId) {
    try {
      console.log('👁️ Setting up intelligent monitoring for budget:', budgetId);
      
      // Create monitoring configuration
      const monitoringConfig = {
        budget_id: budgetId,
        alert_thresholds: {
          warning: 0.8,    // 80% of budget
          critical: 0.95,  // 95% of budget
          overspend: 1.1   // 110% of budget
        },
        anomaly_detection: true,
        predictive_alerts: true,
        auto_adjustments: false, // Will be enabled based on user preference
        notification_preferences: {
          email: true,
          push: true,
          in_app: true
        }
      };

      const { error } = await supabase
        .from('budget_monitoring')
        .insert([monitoringConfig]);

      if (error) throw error;

      console.log('✅ Budget monitoring configured successfully');
    } catch (error) {
      console.error('Error setting up monitoring:', error);
      throw error;
    }
  }

  async checkBudgetStatus(userId, budgetId) {
    try {
      console.log('📊 Checking budget status for:', budgetId);
      
      // Get budget and current spending
      const budget = await this.getBudget(budgetId);
      const currentSpending = await this.getCurrentSpending(userId, budget.period);
      
      // Calculate status for each category
      const categoryStatus = {};
      const alerts = [];
      
      for (const [category, allocation] of Object.entries(budget.categories)) {
        const spent = currentSpending[category] || 0;
        const percentage = spent / allocation.allocated;
        
        categoryStatus[category] = {
          allocated: allocation.allocated,
          spent,
          remaining: allocation.allocated - spent,
          percentage: percentage * 100,
          status: this.getCategoryStatus(percentage),
          trend: await this.getCategoryTrend(userId, category),
          projection: await this.projectCategorySpending(userId, category)
        };

        // Generate alerts if needed
        if (percentage >= 0.8) {
          alerts.push(await this.generateBudgetAlert(category, categoryStatus[category]));
        }
      }

      // Detect anomalies
      const anomalies = await this.aiManager.detectSpendingAnomalies(userId);
      
      // Generate recommendations
      const recommendations = await this.generateBudgetRecommendations(
        budget, 
        categoryStatus, 
        anomalies
      );

      return {
        budget,
        categoryStatus,
        alerts,
        anomalies: anomalies.anomalies,
        recommendations,
        overall_health: this.calculateBudgetHealth(categoryStatus)
      };
    } catch (error) {
      console.error('Error checking budget status:', error);
      throw error;
    }
  }

  // ===== ALERTAS PROACTIVAS =====
  async generateProactiveAlerts(userId) {
    try {
      console.log('🚨 Generating proactive alerts for:', userId);
      
      const alerts = [];
      
      // 1. Budget threshold alerts
      const budgetAlerts = await this.checkBudgetThresholds(userId);
      alerts.push(...budgetAlerts);

      // 2. Spending pattern alerts
      const patternAlerts = await this.checkSpendingPatterns(userId);
      alerts.push(...patternAlerts);

      // 3. Predictive alerts
      const predictiveAlerts = await this.generatePredictiveAlerts(userId);
      alerts.push(...predictiveAlerts);

      // 4. Anomaly alerts
      const anomalyData = await this.aiManager.detectSpendingAnomalies(userId);
      const anomalyAlerts = this.convertAnomaliesToAlerts(anomalyData.anomalies);
      alerts.push(...anomalyAlerts);

      // Sort by priority and urgency
      alerts.sort((a, b) => (b.priority * b.urgency) - (a.priority * a.urgency));

      return {
        alerts: alerts.slice(0, 10), // Top 10 most important alerts
        summary: this.generateAlertSummary(alerts),
        actions: this.generateRecommendedActions(alerts)
      };
    } catch (error) {
      console.error('Error generating proactive alerts:', error);
      throw error;
    }
  }

  async generatePredictiveAlerts(userId) {
    try {
      const predictions = await this.aiManager.predictFutureExpenses(userId, null, 1);
      const alerts = [];

      if (predictions.predictions && predictions.predictions.length > 0) {
        const nextMonthPrediction = predictions.predictions[0];
        
        // Get current budget
        const activeBudgets = await this.getActiveBudgets(userId);
        
        for (const budget of activeBudgets) {
          const totalBudget = Object.values(budget.categories)
            .reduce((sum, cat) => sum + cat.allocated, 0);
          
          if (nextMonthPrediction.predicted > totalBudget * 1.1) {
            alerts.push({
              type: 'predictive',
              severity: 'warning',
              priority: 0.8,
              urgency: 0.7,
              title: 'Posible sobregasto el próximo mes',
              message: `Basado en tus patrones, podrías gastar ${this.formatCurrency(nextMonthPrediction.predicted)} el próximo mes, superando tu presupuesto de ${this.formatCurrency(totalBudget)}`,
              recommendation: 'Considera ajustar tus gastos planificados o revisar tu presupuesto',
              data: {
                predicted: nextMonthPrediction.predicted,
                budget: totalBudget,
                excess: nextMonthPrediction.predicted - totalBudget
              }
            });
          }
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error generating predictive alerts:', error);
      return [];
    }
  }

  // ===== VISUALIZACIÓN DE DATOS =====
  async generateBudgetVisualizationData(userId, budgetId) {
    try {
      console.log('📈 Generating visualization data for budget:', budgetId);
      
      const budgetStatus = await this.checkBudgetStatus(userId, budgetId);
      const predictions = await this.aiManager.predictFutureExpenses(userId, null, 3);
      
      return {
        // Current period data
        current: {
          categories: this.formatCategoryData(budgetStatus.categoryStatus),
          timeline: await this.getSpendingTimeline(userId, budgetStatus.budget.period),
          comparison: await this.getBudgetComparison(userId, budgetId)
        },
        
        // Predictions
        predictions: {
          nextPeriods: predictions.predictions,
          trends: predictions.trends,
          confidence: predictions.confidence
        },
        
        // Analytics
        analytics: {
          efficiency: this.calculateBudgetEfficiency(budgetStatus),
          patterns: await this.getSpendingPatterns(userId),
          recommendations: budgetStatus.recommendations
        },
        
        // Charts configuration
        charts: {
          budgetOverview: this.generateBudgetOverviewChart(budgetStatus),
          spendingTrends: this.generateSpendingTrendsChart(budgetStatus),
          categoryBreakdown: this.generateCategoryBreakdownChart(budgetStatus),
          predictions: this.generatePredictionsChart(predictions)
        }
      };
    } catch (error) {
      console.error('Error generating visualization data:', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getCategoryStatus(percentage) {
    if (percentage >= 1.1) return 'overspent';
    if (percentage >= 0.95) return 'critical';
    if (percentage >= 0.8) return 'warning';
    if (percentage >= 0.5) return 'on_track';
    return 'under_budget';
  }

  calculateBudgetHealth(categoryStatus) {
    const categories = Object.values(categoryStatus);
    const totalCategories = categories.length;
    
    const healthyCategories = categories.filter(cat => 
      cat.status === 'on_track' || cat.status === 'under_budget'
    ).length;
    
    const healthPercentage = (healthyCategories / totalCategories) * 100;
    
    if (healthPercentage >= 80) return 'excellent';
    if (healthPercentage >= 60) return 'good';
    if (healthPercentage >= 40) return 'fair';
    return 'poor';
  }

  async getDefaultBudgetSuggestions(categories) {
    const defaultAllocations = {
      'Comida': 0.25,
      'Transporte': 0.15,
      'Supermercado': 0.20,
      'Servicios': 0.15,
      'Ocio': 0.10,
      'Salud': 0.10,
      'Otros': 0.05
    };

    const suggestions = {};
    
    for (const category of categories) {
      suggestions[category] = {
        recommended_amount: 0, // Will be calculated based on total budget
        confidence: 0.5,
        trend: 'stable',
        seasonality: {},
        risk_level: 'medium',
        optimization_tips: [`Establece un límite razonable para ${category}`, 'Monitorea tus gastos regularmente']
      };
    }

    return suggestions;
  }
}