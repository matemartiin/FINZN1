export class BudgetIntelligence {
  constructor() {
    this.analytics = null;
    this.insights = [];
    this.learningData = new Map();
  }

  async initialize() {
    console.log('🧠 Initializing Budget Intelligence System...');
    
    // Import analytics module
    const { BudgetAnalytics } = await import('./budget-analytics.js');
    this.analytics = new BudgetAnalytics();
    
    console.log('✅ Budget Intelligence System initialized');
  }

  async generateIntelligentInsights(userId, period = 'current') {
    if (!this.analytics) {
      await this.initialize();
    }

    console.log('🧠 Generating intelligent insights for:', userId);

    try {
      const analysis = await this.analytics.analyzeBudgetPerformance(userId, period);
      const insights = await this.processAnalysisForInsights(analysis, userId);
      
      // Store learning data for future improvements
      this.storeLearningData(userId, analysis, insights);
      
      return {
        insights,
        confidence: this.calculateInsightConfidence(insights),
        actionPlan: this.generateActionPlan(insights),
        nextReviewDate: this.calculateNextReviewDate(analysis)
      };
    } catch (error) {
      console.error('❌ Error generating insights:', error);
      throw error;
    }
  }

  async processAnalysisForInsights(analysis, userId) {
    const insights = [];

    // Financial Health Insights
    insights.push(...this.generateHealthInsights(analysis));
    
    // Behavioral Pattern Insights
    insights.push(...this.generateBehavioralInsights(analysis));
    
    // Optimization Opportunities
    insights.push(...this.generateOptimizationInsights(analysis));
    
    // Predictive Insights
    insights.push(...this.generatePredictiveInsights(analysis));
    
    // Goal Achievement Insights
    insights.push(...this.generateGoalInsights(analysis));

    return insights.sort((a, b) => b.impact - a.impact);
  }

  generateHealthInsights(analysis) {
    const insights = [];
    const overview = analysis.overview;

    // Savings Rate Health
    if (overview.averageSavingsRate < 10) {
      insights.push({
        type: 'health',
        category: 'savings',
        title: 'Tasa de Ahorro Crítica',
        description: `Tu tasa de ahorro del ${overview.averageSavingsRate.toFixed(1)}% está por debajo del mínimo recomendado del 10%.`,
        impact: 9,
        urgency: 'high',
        recommendation: 'Implementa la regla 50/30/20: 50% necesidades, 30% deseos, 20% ahorros.',
        actionItems: [
          'Identifica gastos no esenciales para reducir',
          'Automatiza transferencias a cuenta de ahorros',
          'Establece metas de ahorro específicas'
        ],
        potentialSavings: this.calculatePotentialSavings(overview, 0.20)
      });
    } else if (overview.averageSavingsRate > 30) {
      insights.push({
        type: 'health',
        category: 'savings',
        title: 'Excelente Disciplina de Ahorro',
        description: `Tu tasa de ahorro del ${overview.averageSavingsRate.toFixed(1)}% es excepcional.`,
        impact: 7,
        urgency: 'low',
        recommendation: 'Considera diversificar tus ahorros en inversiones para maximizar el crecimiento.',
        actionItems: [
          'Explora opciones de inversión de bajo riesgo',
          'Mantén un fondo de emergencia líquido',
          'Considera aumentar contribuciones a objetivos de largo plazo'
        ]
      });
    }

    // Cash Flow Health
    if (overview.totalBalance < 0) {
      insights.push({
        type: 'health',
        category: 'cashflow',
        title: 'Flujo de Caja Negativo Crítico',
        description: `Déficit de ${this.formatCurrency(Math.abs(overview.totalBalance))} detectado.`,
        impact: 10,
        urgency: 'critical',
        recommendation: 'Acción inmediata requerida para equilibrar ingresos y gastos.',
        actionItems: [
          'Suspende gastos no esenciales inmediatamente',
          'Busca fuentes de ingresos adicionales',
          'Negocia extensiones de pago si es necesario'
        ],
        riskLevel: 'high'
      });
    }

    return insights;
  }

  generateBehavioralInsights(analysis) {
    const insights = [];
    const trends = analysis.trends;

    // Spending Pattern Analysis
    Object.entries(trends.categories).forEach(([category, trend]) => {
      if (trend.trend === 'increasing' && trend.confidence > 70) {
        insights.push({
          type: 'behavioral',
          category: 'spending_pattern',
          title: `Incremento Sostenido en ${category}`,
          description: `Los gastos en ${category} han aumentado consistentemente con ${trend.confidence.toFixed(1)}% de confianza.`,
          impact: 6,
          urgency: 'medium',
          recommendation: `Revisa y optimiza tus hábitos de gasto en ${category}.`,
          actionItems: [
            `Analiza las compras recientes en ${category}`,
            'Busca alternativas más económicas',
            'Establece un límite mensual específico'
          ],
          trendData: trend
        });
      }
    });

    // Seasonal Patterns (if enough data)
    const seasonalPatterns = this.detectSeasonalPatterns(analysis);
    if (seasonalPatterns.length > 0) {
      insights.push({
        type: 'behavioral',
        category: 'seasonal',
        title: 'Patrones Estacionales Detectados',
        description: 'Se identificaron variaciones estacionales en tus gastos.',
        impact: 5,
        urgency: 'low',
        recommendation: 'Planifica presupuestos considerando estos patrones estacionales.',
        actionItems: [
          'Ajusta límites presupuestarios por temporada',
          'Ahorra extra en meses de menor gasto',
          'Prepárate para meses de mayor gasto'
        ],
        patterns: seasonalPatterns
      });
    }

    return insights;
  }

  generateOptimizationInsights(analysis) {
    const insights = [];
    const categoryAnalysis = analysis.categoryAnalysis;

    // Find optimization opportunities
    Object.entries(categoryAnalysis).forEach(([category, data]) => {
      if (data.riskLevel === 'high' && data.totalSpent > 0) {
        const optimizationPotential = data.totalSpent * 0.15; // Assume 15% optimization potential
        
        insights.push({
          type: 'optimization',
          category: 'cost_reduction',
          title: `Oportunidad de Optimización en ${category}`,
          description: `Potencial de ahorro de ${this.formatCurrency(optimizationPotential)} identificado.`,
          impact: 7,
          urgency: 'medium',
          recommendation: data.recommendations.join('. '),
          actionItems: [
            `Compara precios en ${category}`,
            'Negocia mejores tarifas con proveedores',
            'Considera alternativas más económicas'
          ],
          potentialSavings: optimizationPotential,
          currentSpending: data.totalSpent
        });
      }
    });

    // Budget efficiency optimization
    if (analysis.overview.budgetEfficiency < 70) {
      insights.push({
        type: 'optimization',
        category: 'budget_efficiency',
        title: 'Eficiencia Presupuestaria Mejorable',
        description: `Tu eficiencia presupuestaria del ${analysis.overview.budgetEfficiency.toFixed(1)}% puede mejorarse.`,
        impact: 6,
        urgency: 'medium',
        recommendation: 'Ajusta límites presupuestarios para reflejar patrones de gasto reales.',
        actionItems: [
          'Revisa límites presupuestarios actuales',
          'Ajusta límites basándose en datos históricos',
          'Implementa alertas tempranas de límites'
        ]
      });
    }

    return insights;
  }

  generatePredictiveInsights(analysis) {
    const insights = [];
    const predictions = analysis.predictions;

    if (predictions.insufficient_data) {
      return insights;
    }

    // Predict budget overruns
    Object.entries(predictions.nextMonth).forEach(([category, prediction]) => {
      const confidence = predictions.confidence[category];
      
      if (confidence > 60 && prediction > 0) {
        // Check if prediction exceeds any limits
        const categoryLimit = analysis.overview.monthlyData[0]?.expenses || 0; // Simplified
        
        insights.push({
          type: 'predictive',
          category: 'forecast',
          title: `Proyección para ${category}`,
          description: `Se proyecta un gasto de ${this.formatCurrency(prediction)} el próximo mes.`,
          impact: 5,
          urgency: 'low',
          recommendation: 'Planifica tu presupuesto considerando esta proyección.',
          actionItems: [
            'Ajusta límites presupuestarios si es necesario',
            'Prepara estrategias de control de gastos',
            'Considera ahorrar extra este mes'
          ],
          prediction: prediction,
          confidence: confidence
        });
      }
    });

    return insights;
  }

  generateGoalInsights(analysis) {
    const insights = [];
    const goalProgress = analysis.overview.goalProgress;

    if (goalProgress < 25) {
      insights.push({
        type: 'goals',
        category: 'achievement',
        title: 'Progreso Lento en Objetivos',
        description: `El progreso promedio hacia tus objetivos es del ${goalProgress.toFixed(1)}%.`,
        impact: 6,
        urgency: 'medium',
        recommendation: 'Acelera el progreso hacia tus objetivos de ahorro.',
        actionItems: [
          'Aumenta contribuciones mensuales a objetivos',
          'Redirige ahorros de optimizaciones a objetivos',
          'Revisa la viabilidad de tus objetivos actuales'
        ],
        currentProgress: goalProgress
      });
    } else if (goalProgress > 80) {
      insights.push({
        type: 'goals',
        category: 'achievement',
        title: 'Excelente Progreso en Objetivos',
        description: `Estás muy cerca de alcanzar tus objetivos con ${goalProgress.toFixed(1)}% de progreso.`,
        impact: 7,
        urgency: 'low',
        recommendation: 'Mantén el ritmo y considera establecer nuevos objetivos.',
        actionItems: [
          'Mantén las contribuciones actuales',
          'Planifica nuevos objetivos financieros',
          'Celebra tus logros financieros'
        ],
        currentProgress: goalProgress
      });
    }

    return insights;
  }

  calculateInsightConfidence(insights) {
    if (insights.length === 0) return 0;
    
    const totalConfidence = insights.reduce((sum, insight) => {
      // Base confidence on impact and data quality
      const dataQuality = insight.trendData?.confidence || insight.confidence || 70;
      const impactWeight = insight.impact / 10;
      return sum + (dataQuality * impactWeight);
    }, 0);

    return Math.min(100, totalConfidence / insights.length);
  }

  generateActionPlan(insights) {
    const actionPlan = {
      immediate: [], // Next 7 days
      shortTerm: [], // Next 30 days
      longTerm: []   // Next 90 days
    };

    insights.forEach(insight => {
      const actions = insight.actionItems.map(action => ({
        action,
        category: insight.category,
        impact: insight.impact,
        source: insight.title
      }));

      if (insight.urgency === 'critical' || insight.urgency === 'high') {
        actionPlan.immediate.push(...actions);
      } else if (insight.urgency === 'medium') {
        actionPlan.shortTerm.push(...actions);
      } else {
        actionPlan.longTerm.push(...actions);
      }
    });

    // Sort by impact
    Object.keys(actionPlan).forEach(timeframe => {
      actionPlan[timeframe].sort((a, b) => b.impact - a.impact);
    });

    return actionPlan;
  }

  calculateNextReviewDate(analysis) {
    const riskLevel = this.calculateOverallRiskLevel(analysis);
    const daysUntilReview = riskLevel === 'high' ? 7 : riskLevel === 'medium' ? 14 : 30;
    
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + daysUntilReview);
    
    return nextReview.toISOString();
  }

  calculateOverallRiskLevel(analysis) {
    const highRisks = analysis.riskAssessment.filter(r => r.level === 'high').length;
    const mediumRisks = analysis.riskAssessment.filter(r => r.level === 'medium').length;
    
    if (highRisks > 0) return 'high';
    if (mediumRisks > 1) return 'medium';
    return 'low';
  }

  storeLearningData(userId, analysis, insights) {
    const learningEntry = {
      timestamp: new Date().toISOString(),
      userId,
      analysis: {
        savingsRate: analysis.overview.averageSavingsRate,
        budgetEfficiency: analysis.overview.budgetEfficiency,
        riskLevel: this.calculateOverallRiskLevel(analysis),
        anomalyCount: analysis.anomalies.length
      },
      insights: insights.map(i => ({
        type: i.type,
        category: i.category,
        impact: i.impact,
        urgency: i.urgency
      }))
    };

    // Store in memory for now (Phase 2 will implement persistent storage)
    if (!this.learningData.has(userId)) {
      this.learningData.set(userId, []);
    }
    
    const userLearningData = this.learningData.get(userId);
    userLearningData.push(learningEntry);
    
    // Keep only last 50 entries per user
    if (userLearningData.length > 50) {
      userLearningData.splice(0, userLearningData.length - 50);
    }
  }

  // Utility methods
  detectSeasonalPatterns(analysis) {
    // Simplified seasonal detection - will be enhanced in Phase 2
    const patterns = [];
    const monthlyData = analysis.overview.monthlyData;
    
    if (monthlyData.length >= 6) {
      // Look for recurring patterns
      const avgExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0) / monthlyData.length;
      
      monthlyData.forEach((month, index) => {
        const deviation = (month.expenses - avgExpenses) / avgExpenses;
        if (Math.abs(deviation) > 0.2) { // 20% deviation
          patterns.push({
            month: month.month,
            type: deviation > 0 ? 'high_spending' : 'low_spending',
            deviation: deviation * 100
          });
        }
      });
    }
    
    return patterns;
  }

  calculatePotentialSavings(overview, targetSavingsRate) {
    const currentSavingsRate = overview.averageSavingsRate / 100;
    const targetRate = targetSavingsRate;
    const avgIncome = overview.totalIncome / overview.monthlyData.length;
    
    return avgIncome * (targetRate - currentSavingsRate);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Public API
  async getBudgetIntelligenceReport(userId, period = 'current') {
    const intelligence = await this.generateIntelligentInsights(userId, period);
    const dashboard = await this.analytics.getAnalyticsDashboard(userId, period);
    
    return {
      ...intelligence,
      analytics: dashboard,
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }
}