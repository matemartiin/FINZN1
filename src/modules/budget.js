export class BudgetManager {
  constructor() {
    this.budgets = [];
    this.aiInsights = {};
    this.predictions = {};
    this.patterns = {};
    this.scenarios = [];
    this.currentBudget = null;
  }

  init() {
    console.log('💰 Initializing Budget Manager with AI...');
    this.setupEventListeners();
    this.loadBudgets();
    this.initializeAI();
  }

  setupEventListeners() {
    // Create budget button
    const createBudgetBtn = document.getElementById('create-budget-btn');
    if (createBudgetBtn) {
      createBudgetBtn.addEventListener('click', () => this.showCreateBudgetModal());
    }

    // Create budget form
    const createBudgetForm = document.getElementById('create-budget-form');
    if (createBudgetForm) {
      createBudgetForm.addEventListener('submit', (e) => this.handleCreateBudget(e));
    }

    // AI suggestion buttons
    const generateAIBudgetBtn = document.getElementById('generate-ai-budget-btn');
    if (generateAIBudgetBtn) {
      generateAIBudgetBtn.addEventListener('click', () => this.generateAIBudget());
    }

    // Scenario simulation
    const simulateScenarioBtn = document.getElementById('simulate-scenario-btn');
    if (simulateScenarioBtn) {
      simulateScenarioBtn.addEventListener('click', () => this.showScenarioModal());
    }

    // Budget optimization
    const optimizeBudgetBtn = document.getElementById('optimize-budget-btn');
    if (optimizeBudgetBtn) {
      optimizeBudgetBtn.addEventListener('click', () => this.optimizeBudget());
    }
  }

  async initializeAI() {
    console.log('🤖 Initializing AI Budget Analysis...');
    
    try {
      // Load user's financial data for AI analysis
      const userData = await this.getUserFinancialData();
      
      // Analyze spending patterns
      await this.analyzeSpendingPatterns(userData);
      
      // Generate predictions
      await this.generatePredictions(userData);
      
      // Update AI insights display
      this.updateAIInsights();
      
      console.log('✅ AI Budget Analysis initialized');
    } catch (error) {
      console.error('❌ Error initializing AI:', error);
    }
  }

  async getUserFinancialData() {
    const userId = this.getCurrentUserId();
    if (!userId) return null;

    try {
      // Get last 6 months of data for better AI analysis
      const months = this.getLastMonths(6);
      const data = {
        expenses: {},
        income: {},
        categories: {},
        totalExpenses: 0,
        totalIncome: 0,
        months: months.length
      };

      for (const month of months) {
        const expenses = await window.app.data.loadExpenses(month);
        const income = await window.app.data.loadIncome(month);
        
        data.expenses[month] = expenses;
        data.income[month] = income;
        
        // Aggregate by category
        expenses.forEach(expense => {
          const category = expense.category;
          if (!data.categories[category]) {
            data.categories[category] = { total: 0, months: [], average: 0 };
          }
          data.categories[category].total += parseFloat(expense.amount);
          if (!data.categories[category].months.includes(month)) {
            data.categories[category].months.push(month);
          }
        });
        
        data.totalExpenses += expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        data.totalIncome += parseFloat(income.fixed) + parseFloat(income.extra);
      }

      // Calculate averages
      Object.keys(data.categories).forEach(category => {
        const categoryData = data.categories[category];
        categoryData.average = categoryData.total / Math.max(categoryData.months.length, 1);
      });

      return data;
    } catch (error) {
      console.error('Error getting user financial data:', error);
      return null;
    }
  }

  async analyzeSpendingPatterns(userData) {
    if (!userData) return;

    console.log('📊 Analyzing spending patterns...');
    
    const patterns = {};
    
    Object.keys(userData.categories).forEach(category => {
      const categoryData = userData.categories[category];
      const monthlyAmounts = [];
      
      // Get monthly amounts for trend analysis
      Object.keys(userData.expenses).forEach(month => {
        const monthExpenses = userData.expenses[month];
        const monthlyAmount = monthExpenses
          .filter(exp => exp.category === category)
          .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        monthlyAmounts.push(monthlyAmount);
      });
      
      // Calculate trend
      const trend = this.calculateTrend(monthlyAmounts);
      const volatility = this.calculateVolatility(monthlyAmounts);
      const seasonality = this.detectSeasonality(monthlyAmounts);
      
      patterns[category] = {
        average: categoryData.average,
        trend: trend, // 'increasing', 'decreasing', 'stable'
        volatility: volatility, // 'low', 'medium', 'high'
        seasonality: seasonality,
        confidence: this.calculateConfidence(monthlyAmounts),
        recommendation: this.generateCategoryRecommendation(category, trend, volatility, categoryData.average)
      };
    });
    
    this.patterns = patterns;
    console.log('✅ Spending patterns analyzed:', patterns);
  }

  calculateTrend(amounts) {
    if (amounts.length < 2) return 'stable';
    
    const firstHalf = amounts.slice(0, Math.floor(amounts.length / 2));
    const secondHalf = amounts.slice(Math.floor(amounts.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  calculateVolatility(amounts) {
    if (amounts.length < 2) return 'low';
    
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - avg, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const coefficient = stdDev / avg;
    
    if (coefficient > 0.3) return 'high';
    if (coefficient > 0.15) return 'medium';
    return 'low';
  }

  detectSeasonality(amounts) {
    // Simple seasonality detection - could be enhanced
    if (amounts.length < 4) return 'none';
    
    const maxAmount = Math.max(...amounts);
    const minAmount = Math.min(...amounts);
    const range = maxAmount - minAmount;
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    
    if (range / avg > 0.5) return 'seasonal';
    return 'none';
  }

  calculateConfidence(amounts) {
    if (amounts.length < 3) return 'low';
    if (amounts.length < 6) return 'medium';
    return 'high';
  }

  generateCategoryRecommendation(category, trend, volatility, average) {
    const recommendations = {
      'increasing_high': `Tu gasto en ${category} está aumentando y es muy variable. Considera establecer un límite más estricto.`,
      'increasing_medium': `El gasto en ${category} está creciendo. Monitorea de cerca esta categoría.`,
      'increasing_low': `Ligero aumento en ${category}. Mantén el control actual.`,
      'decreasing_high': `¡Bien! Estás reduciendo gastos en ${category}, pero la variabilidad es alta.`,
      'decreasing_medium': `Excelente progreso reduciendo gastos en ${category}.`,
      'decreasing_low': `Buen control en ${category}. Mantén esta tendencia.`,
      'stable_high': `${category} es muy variable. Considera estrategias para estabilizar estos gastos.`,
      'stable_medium': `Gastos estables en ${category} con variabilidad moderada.`,
      'stable_low': `¡Perfecto! Tienes un control excelente en ${category}.`
    };
    
    const key = `${trend}_${volatility}`;
    return recommendations[key] || `Mantén el seguimiento de tus gastos en ${category}.`;
  }

  async generatePredictions(userData) {
    if (!userData) return;

    console.log('🔮 Generating AI predictions...');
    
    const predictions = {};
    const nextMonth = this.getNextMonth();
    
    Object.keys(userData.categories).forEach(category => {
      const pattern = this.patterns[category];
      if (!pattern) return;
      
      let predictedAmount = pattern.average;
      
      // Adjust based on trend
      if (pattern.trend === 'increasing') {
        predictedAmount *= 1.1; // 10% increase
      } else if (pattern.trend === 'decreasing') {
        predictedAmount *= 0.9; // 10% decrease
      }
      
      // Adjust for volatility
      const volatilityFactor = {
        'low': 0.05,
        'medium': 0.15,
        'high': 0.25
      };
      
      const uncertainty = predictedAmount * volatilityFactor[pattern.volatility];
      
      predictions[category] = {
        predicted: Math.round(predictedAmount),
        min: Math.round(predictedAmount - uncertainty),
        max: Math.round(predictedAmount + uncertainty),
        confidence: pattern.confidence,
        factors: this.getPredictionFactors(category, pattern)
      };
    });
    
    this.predictions = predictions;
    console.log('✅ Predictions generated:', predictions);
  }

  getPredictionFactors(category, pattern) {
    const factors = [];
    
    if (pattern.trend === 'increasing') {
      factors.push('Tendencia creciente en los últimos meses');
    } else if (pattern.trend === 'decreasing') {
      factors.push('Tendencia decreciente reciente');
    }
    
    if (pattern.volatility === 'high') {
      factors.push('Alta variabilidad histórica');
    }
    
    if (pattern.seasonality === 'seasonal') {
      factors.push('Patrones estacionales detectados');
    }
    
    // Category-specific factors
    const categoryFactors = {
      'Comida': ['Inflación en alimentos', 'Cambios en hábitos alimentarios'],
      'Transporte': ['Precio del combustible', 'Frecuencia de viajes'],
      'Ocio': ['Eventos especiales', 'Temporada alta/baja'],
      'Servicios': ['Ajustes tarifarios', 'Nuevas suscripciones']
    };
    
    if (categoryFactors[category]) {
      factors.push(...categoryFactors[category]);
    }
    
    return factors;
  }

  async generateAIBudget() {
    console.log('🤖 Generating AI-powered budget...');
    
    try {
      const userData = await this.getUserFinancialData();
      if (!userData) {
        this.showAlert('No hay suficientes datos históricos para generar un presupuesto con IA', 'warning');
        return;
      }

      // Calculate suggested budget based on patterns and predictions
      const suggestedBudget = this.calculateAISuggestedBudget(userData);
      
      // Show AI budget modal with suggestions
      this.showAIBudgetModal(suggestedBudget);
      
    } catch (error) {
      console.error('Error generating AI budget:', error);
      this.showAlert('Error al generar presupuesto con IA', 'error');
    }
  }

  calculateAISuggestedBudget(userData) {
    const totalIncome = userData.totalIncome / userData.months;
    const suggestions = {};
    let totalSuggested = 0;
    
    // Apply 50/30/20 rule as base, then adjust with AI insights
    const necessities = totalIncome * 0.5;
    const wants = totalIncome * 0.3;
    const savings = totalIncome * 0.2;
    
    // Categorize expenses
    const necessityCategories = ['Supermercado', 'Servicios', 'Salud', 'Transporte'];
    const wantCategories = ['Comida', 'Ocio', 'Otros'];
    
    // Distribute necessities budget
    let necessitiesAllocated = 0;
    necessityCategories.forEach(category => {
      if (this.patterns[category]) {
        const pattern = this.patterns[category];
        let suggested = pattern.average;
        
        // Adjust based on trend and volatility
        if (pattern.trend === 'increasing' && pattern.volatility === 'high') {
          suggested *= 1.15; // Add buffer for volatile increasing expenses
        } else if (pattern.trend === 'decreasing') {
          suggested *= 0.95; // Slightly reduce for decreasing trends
        }
        
        suggestions[category] = {
          amount: Math.round(suggested),
          reasoning: this.getAIReasoning(category, pattern, suggested),
          confidence: pattern.confidence,
          type: 'necessity'
        };
        
        necessitiesAllocated += suggested;
      }
    });
    
    // Distribute wants budget
    let wantsAllocated = 0;
    wantCategories.forEach(category => {
      if (this.patterns[category]) {
        const pattern = this.patterns[category];
        let suggested = Math.min(pattern.average, wants / wantCategories.length);
        
        suggestions[category] = {
          amount: Math.round(suggested),
          reasoning: this.getAIReasoning(category, pattern, suggested),
          confidence: pattern.confidence,
          type: 'want'
        };
        
        wantsAllocated += suggested;
      }
    });
    
    totalSuggested = necessitiesAllocated + wantsAllocated;
    
    return {
      categories: suggestions,
      totalSuggested: Math.round(totalSuggested),
      totalIncome: Math.round(totalIncome),
      suggestedSavings: Math.round(totalIncome - totalSuggested),
      insights: this.generateBudgetInsights(suggestions, totalIncome),
      optimizations: this.generateOptimizations(suggestions, userData)
    };
  }

  getAIReasoning(category, pattern, suggestedAmount) {
    const reasons = [];
    
    if (pattern.trend === 'increasing') {
      reasons.push(`Tendencia creciente (+${((suggestedAmount / pattern.average - 1) * 100).toFixed(1)}% de buffer)`);
    } else if (pattern.trend === 'decreasing') {
      reasons.push('Aprovechando tendencia decreciente');
    }
    
    if (pattern.volatility === 'high') {
      reasons.push('Buffer adicional por alta variabilidad');
    } else if (pattern.volatility === 'low') {
      reasons.push('Gasto estable y predecible');
    }
    
    if (pattern.confidence === 'high') {
      reasons.push('Alta confianza en predicción');
    }
    
    return reasons.join(' • ');
  }

  generateBudgetInsights(suggestions, totalIncome) {
    const insights = [];
    
    const totalBudget = Object.values(suggestions).reduce((sum, cat) => sum + cat.amount, 0);
    const savingsRate = ((totalIncome - totalBudget) / totalIncome) * 100;
    
    if (savingsRate >= 20) {
      insights.push({
        type: 'success',
        title: '¡Excelente capacidad de ahorro!',
        message: `Tu presupuesto permite ahorrar ${savingsRate.toFixed(1)}% de tus ingresos.`
      });
    } else if (savingsRate >= 10) {
      insights.push({
        type: 'info',
        title: 'Buen potencial de ahorro',
        message: `Podrías ahorrar ${savingsRate.toFixed(1)}% con este presupuesto.`
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Oportunidad de optimización',
        message: 'Considera reducir gastos no esenciales para aumentar tus ahorros.'
      });
    }
    
    // Find highest expense category
    const highestCategory = Object.entries(suggestions)
      .sort(([,a], [,b]) => b.amount - a.amount)[0];
    
    if (highestCategory) {
      const [category, data] = highestCategory;
      const percentage = (data.amount / totalBudget) * 100;
      
      if (percentage > 30) {
        insights.push({
          type: 'warning',
          title: `${category} representa ${percentage.toFixed(1)}% del presupuesto`,
          message: 'Considera si hay oportunidades de optimización en esta categoría.'
        });
      }
    }
    
    return insights;
  }

  generateOptimizations(suggestions, userData) {
    const optimizations = [];
    
    Object.entries(suggestions).forEach(([category, data]) => {
      const pattern = this.patterns[category];
      if (!pattern) return;
      
      // High volatility optimization
      if (pattern.volatility === 'high') {
        optimizations.push({
          category,
          type: 'stability',
          title: `Estabilizar gastos en ${category}`,
          description: 'Esta categoría tiene alta variabilidad. Considera estrategias para gastos más consistentes.',
          potentialSaving: Math.round(data.amount * 0.1),
          difficulty: 'medium'
        });
      }
      
      // Increasing trend optimization
      if (pattern.trend === 'increasing') {
        optimizations.push({
          category,
          type: 'reduction',
          title: `Controlar crecimiento en ${category}`,
          description: 'Los gastos están aumentando. Identifica las causas y establece límites.',
          potentialSaving: Math.round(data.amount * 0.15),
          difficulty: 'medium'
        });
      }
      
      // Category-specific optimizations
      if (category === 'Comida' && data.amount > 15000) {
        optimizations.push({
          category,
          type: 'substitution',
          title: 'Optimizar gastos en comida',
          description: 'Considera cocinar más en casa y planificar comidas semanalmente.',
          potentialSaving: Math.round(data.amount * 0.2),
          difficulty: 'easy'
        });
      }
      
      if (category === 'Servicios' && pattern.volatility === 'low') {
        optimizations.push({
          category,
          type: 'negotiation',
          title: 'Renegociar servicios',
          description: 'Gastos estables en servicios. Buen momento para renegociar tarifas.',
          potentialSaving: Math.round(data.amount * 0.1),
          difficulty: 'easy'
        });
      }
    });
    
    return optimizations.sort((a, b) => b.potentialSaving - a.potentialSaving);
  }

  showCreateBudgetModal() {
    console.log('💰 Showing create budget modal...');
    
    // Update categories in the form
    this.updateBudgetCategoriesForm();
    
    // Show predictions if available
    this.updatePredictionsInForm();
    
    if (window.app && window.app.modals) {
      window.app.modals.show('create-budget-modal');
    }
  }

  showAIBudgetModal(suggestedBudget) {
    console.log('🤖 Showing AI budget suggestions...');
    
    const modal = document.getElementById('ai-budget-modal');
    if (!modal) {
      this.createAIBudgetModal();
    }
    
    this.populateAIBudgetModal(suggestedBudget);
    
    if (window.app && window.app.modals) {
      window.app.modals.show('ai-budget-modal');
    }
  }

  updateBudgetCategoriesForm() {
    const container = document.getElementById('budget-categories-container');
    if (!container) return;
    
    const categories = window.app?.data?.getCategories() || [];
    container.innerHTML = '';
    
    categories.forEach(category => {
      const prediction = this.predictions[category.name];
      const pattern = this.patterns[category.name];
      
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'budget-category-item';
      
      categoryDiv.innerHTML = `
        <div class="budget-category-header">
          <div class="category-info">
            <span class="category-icon">${category.icon}</span>
            <span class="category-name">${category.name}</span>
          </div>
          <div class="category-prediction">
            ${prediction ? `
              <div class="prediction-badge">
                <span class="prediction-amount">${this.formatCurrency(prediction.predicted)}</span>
                <span class="prediction-label">Predicción IA</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="budget-category-input">
          <input 
            type="number" 
            name="budget-${category.name}" 
            placeholder="Límite mensual"
            ${prediction ? `data-prediction="${prediction.predicted}"` : ''}
            class="budget-amount-input"
          />
          <button type="button" class="use-prediction-btn" ${!prediction ? 'disabled' : ''}>
            Usar IA
          </button>
        </div>
        
        ${pattern ? `
          <div class="category-insights">
            <div class="insight-item">
              <span class="insight-label">Tendencia:</span>
              <span class="insight-value ${pattern.trend}">${this.getTrendText(pattern.trend)}</span>
            </div>
            <div class="insight-item">
              <span class="insight-label">Promedio:</span>
              <span class="insight-value">${this.formatCurrency(pattern.average)}</span>
            </div>
          </div>
        ` : ''}
      `;
      
      // Add event listener for "Usar IA" button
      const usePredictionBtn = categoryDiv.querySelector('.use-prediction-btn');
      const input = categoryDiv.querySelector('.budget-amount-input');
      
      if (usePredictionBtn && input && prediction) {
        usePredictionBtn.addEventListener('click', () => {
          input.value = prediction.predicted;
          input.classList.add('ai-suggested');
          usePredictionBtn.textContent = '✓ IA';
          usePredictionBtn.classList.add('used');
        });
      }
      
      container.appendChild(categoryDiv);
    });
  }

  getTrendText(trend) {
    const texts = {
      'increasing': '📈 Creciente',
      'decreasing': '📉 Decreciente',
      'stable': '➡️ Estable'
    };
    return texts[trend] || trend;
  }

  async handleCreateBudget(e) {
    e.preventDefault();
    console.log('💰 Creating new budget...');
    
    const formData = new FormData(e.target);
    const budgetName = formData.get('budget-name');
    const budgetPeriod = formData.get('budget-period') || 'monthly';
    
    if (!budgetName) {
      this.showAlert('Por favor ingresa un nombre para el presupuesto', 'error');
      return;
    }
    
    // Collect category budgets
    const categories = {};
    let totalBudget = 0;
    
    const categories_list = window.app?.data?.getCategories() || [];
    categories_list.forEach(category => {
      const amount = parseFloat(formData.get(`budget-${category.name}`)) || 0;
      if (amount > 0) {
        categories[category.name] = amount;
        totalBudget += amount;
      }
    });
    
    if (Object.keys(categories).length === 0) {
      this.showAlert('Por favor establece al menos un límite de categoría', 'error');
      return;
    }
    
    try {
      const budget = {
        id: this.generateId(),
        name: budgetName,
        period: budgetPeriod,
        categories: categories,
        totalAmount: totalBudget,
        createdAt: new Date().toISOString(),
        status: 'active',
        aiGenerated: false
      };
      
      await this.saveBudget(budget);
      
      if (window.app && window.app.modals) {
        window.app.modals.hide('create-budget-modal');
      }
      
      this.showAlert('Presupuesto creado exitosamente', 'success');
      this.updateBudgetDisplay();
      
      // Generate AI insights for the new budget
      setTimeout(() => {
        this.analyzeNewBudget(budget);
      }, 1000);
      
    } catch (error) {
      console.error('Error creating budget:', error);
      this.showAlert('Error al crear el presupuesto', 'error');
    }
  }

  async analyzeNewBudget(budget) {
    console.log('🤖 Analyzing new budget with AI...');
    
    try {
      const analysis = await this.getAIBudgetAnalysis(budget);
      this.showBudgetAnalysisAlert(analysis);
    } catch (error) {
      console.error('Error analyzing budget:', error);
    }
  }

  async getAIBudgetAnalysis(budget) {
    const userData = await this.getUserFinancialData();
    if (!userData) return null;
    
    const analysis = {
      score: 0,
      insights: [],
      warnings: [],
      recommendations: []
    };
    
    let totalScore = 0;
    let categoryCount = 0;
    
    Object.entries(budget.categories).forEach(([category, budgetAmount]) => {
      const pattern = this.patterns[category];
      if (!pattern) return;
      
      categoryCount++;
      const averageSpending = pattern.average;
      const ratio = budgetAmount / averageSpending;
      
      // Score based on how realistic the budget is
      if (ratio >= 0.8 && ratio <= 1.2) {
        totalScore += 100; // Perfect range
        analysis.insights.push(`${category}: Presupuesto realista basado en tu historial`);
      } else if (ratio >= 0.6 && ratio <= 1.5) {
        totalScore += 80; // Good range
        analysis.insights.push(`${category}: Presupuesto ajustado apropiadamente`);
      } else if (ratio < 0.6) {
        totalScore += 40; // Too restrictive
        analysis.warnings.push(`${category}: Presupuesto muy restrictivo (${(ratio * 100).toFixed(0)}% del promedio)`);
        analysis.recommendations.push(`Considera aumentar el presupuesto de ${category} a ${this.formatCurrency(averageSpending * 0.9)}`);
      } else {
        totalScore += 60; // Too generous
        analysis.warnings.push(`${category}: Presupuesto muy generoso (${(ratio * 100).toFixed(0)}% del promedio)`);
        analysis.recommendations.push(`Podrías reducir el presupuesto de ${category} a ${this.formatCurrency(averageSpending * 1.1)}`);
      }
    });
    
    analysis.score = categoryCount > 0 ? Math.round(totalScore / categoryCount) : 0;
    
    // Overall budget analysis
    const totalIncome = userData.totalIncome / userData.months;
    const budgetRatio = budget.totalAmount / totalIncome;
    
    if (budgetRatio > 0.9) {
      analysis.warnings.push('El presupuesto usa más del 90% de tus ingresos');
      analysis.recommendations.push('Considera reducir algunos gastos para aumentar tus ahorros');
    } else if (budgetRatio < 0.6) {
      analysis.insights.push('¡Excelente! Tu presupuesto permite ahorrar significativamente');
    }
    
    return analysis;
  }

  showBudgetAnalysisAlert(analysis) {
    if (!analysis) return;
    
    const alertContainer = document.getElementById('budget-analysis-alert');
    if (alertContainer) {
      alertContainer.remove();
    }
    
    const alert = document.createElement('div');
    alert.id = 'budget-analysis-alert';
    alert.className = 'ai-analysis-alert';
    
    const scoreColor = analysis.score >= 80 ? 'success' : analysis.score >= 60 ? 'warning' : 'error';
    
    alert.innerHTML = `
      <div class="analysis-header">
        <h4>🤖 Análisis IA de tu Presupuesto</h4>
        <div class="analysis-score ${scoreColor}">
          ${analysis.score}/100
        </div>
      </div>
      
      ${analysis.insights.length > 0 ? `
        <div class="analysis-section insights">
          <h5>✅ Fortalezas</h5>
          <ul>
            ${analysis.insights.map(insight => `<li>${insight}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${analysis.warnings.length > 0 ? `
        <div class="analysis-section warnings">
          <h5>⚠️ Advertencias</h5>
          <ul>
            ${analysis.warnings.map(warning => `<li>${warning}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${analysis.recommendations.length > 0 ? `
        <div class="analysis-section recommendations">
          <h5>💡 Recomendaciones</h5>
          <ul>
            ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      <button class="close-analysis-btn" onclick="this.parentElement.remove()">
        Entendido
      </button>
    `;
    
    // Insert after budget section header
    const budgetSection = document.getElementById('budget-section');
    if (budgetSection) {
      const header = budgetSection.querySelector('.section-header');
      if (header) {
        header.insertAdjacentElement('afterend', alert);
      }
    }
  }

  async optimizeBudget() {
    console.log('🔧 Optimizing budget with AI...');
    
    if (!this.currentBudget) {
      this.showAlert('Primero crea un presupuesto para optimizar', 'info');
      return;
    }
    
    try {
      const optimizations = await this.generateBudgetOptimizations(this.currentBudget);
      this.showOptimizationsModal(optimizations);
    } catch (error) {
      console.error('Error optimizing budget:', error);
      this.showAlert('Error al optimizar presupuesto', 'error');
    }
  }

  async generateBudgetOptimizations(budget) {
    const userData = await this.getUserFinancialData();
    const optimizations = [];
    
    Object.entries(budget.categories).forEach(([category, budgetAmount]) => {
      const pattern = this.patterns[category];
      if (!pattern) return;
      
      // Find optimization opportunities
      if (pattern.volatility === 'high') {
        optimizations.push({
          category,
          type: 'volatility',
          title: `Reducir variabilidad en ${category}`,
          description: 'Esta categoría tiene gastos muy variables. Establecer rutinas puede ayudar.',
          impact: 'medium',
          effort: 'medium',
          potentialSaving: Math.round(budgetAmount * 0.15)
        });
      }
      
      if (pattern.trend === 'increasing' && budgetAmount > pattern.average * 1.2) {
        optimizations.push({
          category,
          type: 'overspending',
          title: `Controlar gastos crecientes en ${category}`,
          description: 'Los gastos están aumentando y el presupuesto es generoso.',
          impact: 'high',
          effort: 'medium',
          potentialSaving: Math.round(budgetAmount * 0.2)
        });
      }
      
      // Category-specific optimizations
      if (category === 'Comida' && budgetAmount > 20000) {
        optimizations.push({
          category,
          type: 'meal_planning',
          title: 'Planificación de comidas',
          description: 'Planificar comidas semanalmente puede reducir gastos significativamente.',
          impact: 'high',
          effort: 'low',
          potentialSaving: Math.round(budgetAmount * 0.25)
        });
      }
      
      if (category === 'Servicios' && pattern.trend === 'stable') {
        optimizations.push({
          category,
          type: 'negotiation',
          title: 'Renegociar servicios',
          description: 'Gastos estables indican buen momento para renegociar tarifas.',
          impact: 'medium',
          effort: 'low',
          potentialSaving: Math.round(budgetAmount * 0.1)
        });
      }
    });
    
    return optimizations.sort((a, b) => b.potentialSaving - a.potentialSaving);
  }

  updateAIInsights() {
    const container = document.getElementById('ai-insights-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Create insights based on patterns and predictions
    const insights = this.generateAIInsights();
    
    insights.forEach(insight => {
      const insightDiv = document.createElement('div');
      insightDiv.className = `ai-insight ${insight.type}`;
      
      insightDiv.innerHTML = `
        <div class="insight-icon">${insight.icon}</div>
        <div class="insight-content">
          <h4>${insight.title}</h4>
          <p>${insight.message}</p>
          ${insight.action ? `<button class="insight-action-btn" onclick="${insight.action}">${insight.actionText}</button>` : ''}
        </div>
      `;
      
      container.appendChild(insightDiv);
    });
  }

  generateAIInsights() {
    const insights = [];
    
    // Pattern-based insights
    Object.entries(this.patterns).forEach(([category, pattern]) => {
      if (pattern.trend === 'increasing' && pattern.volatility === 'high') {
        insights.push({
          type: 'warning',
          icon: '⚠️',
          title: `Gastos variables en ${category}`,
          message: `Tus gastos en ${category} están aumentando y son muy variables. ${pattern.recommendation}`,
          action: `window.app.budget.showCategoryAnalysis('${category}')`,
          actionText: 'Ver análisis'
        });
      }
      
      if (pattern.trend === 'decreasing' && pattern.confidence === 'high') {
        insights.push({
          type: 'success',
          icon: '✅',
          title: `¡Progreso en ${category}!`,
          message: `Has reducido consistentemente tus gastos en ${category}. ¡Mantén el buen trabajo!`,
        });
      }
    });
    
    // Prediction-based insights
    Object.entries(this.predictions).forEach(([category, prediction]) => {
      if (prediction.confidence === 'high' && prediction.predicted > prediction.min * 1.3) {
        insights.push({
          type: 'info',
          icon: '🔮',
          title: `Predicción para ${category}`,
          message: `Se espera un gasto de ${this.formatCurrency(prediction.predicted)} en ${category} el próximo mes.`,
          action: `window.app.budget.createCategoryBudget('${category}', ${prediction.predicted})`,
          actionText: 'Crear presupuesto'
        });
      }
    });
    
    // General insights
    const totalPredicted = Object.values(this.predictions).reduce((sum, pred) => sum + pred.predicted, 0);
    if (totalPredicted > 0) {
      insights.push({
        type: 'info',
        icon: '📊',
        title: 'Resumen de predicciones',
        message: `Se estima un gasto total de ${this.formatCurrency(totalPredicted)} para el próximo mes basado en tus patrones.`,
        action: 'window.app.budget.generateAIBudget()',
        actionText: 'Generar presupuesto IA'
      });
    }
    
    return insights.slice(0, 4); // Limit to 4 insights
  }

  // Utility methods
  getCurrentUserId() {
    return window.app?.auth?.getCurrentUserId() || null;
  }

  getLastMonths(count) {
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      months.push(monthKey);
    }
    
    return months;
  }

  getNextMonth() {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return `${next.getFullYear()}-${(next.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  generateId() {
    return 'budget_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  showAlert(message, type) {
    if (window.app && window.app.ui) {
      window.app.ui.showAlert(message, type);
    }
  }

  async saveBudget(budget) {
    // For now, save in memory - can be extended to Supabase
    this.budgets.push(budget);
    this.currentBudget = budget;
    console.log('💾 Budget saved:', budget);
  }

  async loadBudgets() {
    // Load budgets from storage
    console.log('📊 Loading budgets...');
  }

  updateBudgetDisplay() {
    // Update the budget display in the UI
    console.log('🔄 Updating budget display...');
  }
}