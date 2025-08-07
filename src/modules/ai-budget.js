import { supabase } from '../config/supabase.js';

export class AIBudgetManager {
  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.predictionCache = new Map();
    this.patternCache = new Map();
    this.anomalyThreshold = 0.3; // 30% deviation threshold
  }

  // ===== PREDICCIÓN DE GASTOS FUTUROS =====
  async predictFutureExpenses(userId, category = null, months = 3) {
    try {
      console.log('🔮 Predicting future expenses for:', { userId, category, months });
      
      const cacheKey = `${userId}-${category}-${months}`;
      if (this.predictionCache.has(cacheKey)) {
        const cached = this.predictionCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
          return cached.data;
        }
      }

      // Get historical data (last 12 months)
      const historicalData = await this.getHistoricalExpenses(userId, category, 12);
      
      if (historicalData.length < 3) {
        return {
          predictions: [],
          confidence: 'low',
          message: 'Necesitas al menos 3 meses de datos para predicciones precisas'
        };
      }

      // Calculate trends and seasonality
      const analysis = this.analyzeSpendingPatterns(historicalData);
      const predictions = this.generatePredictions(analysis, months);
      
      // Use AI for enhanced predictions if available
      let aiEnhancedPredictions = predictions;
      if (this.apiKey) {
        aiEnhancedPredictions = await this.enhancePredictionsWithAI(
          historicalData, 
          predictions, 
          category
        );
      }

      const result = {
        predictions: aiEnhancedPredictions,
        confidence: this.calculateConfidence(historicalData),
        trends: analysis.trends,
        seasonality: analysis.seasonality,
        recommendations: await this.generateRecommendations(analysis, category)
      };

      // Cache result
      this.predictionCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Error predicting expenses:', error);
      throw error;
    }
  }

  async getHistoricalExpenses(userId, category, months) {
    const { data, error } = await supabase
      .from('expenses')
      .select('amount, category, month, transaction_date')
      .eq('user_id', userId)
      .gte('month', this.getMonthsAgo(months))
      .order('month', { ascending: true });

    if (error) throw error;

    // Filter by category if specified
    if (category) {
      return data.filter(expense => expense.category === category);
    }

    return data;
  }

  analyzeSpendingPatterns(data) {
    // Group by month
    const monthlyTotals = {};
    data.forEach(expense => {
      monthlyTotals[expense.month] = (monthlyTotals[expense.month] || 0) + parseFloat(expense.amount);
    });

    const values = Object.values(monthlyTotals);
    const months = Object.keys(monthlyTotals).sort();

    // Calculate trend (linear regression)
    const trend = this.calculateLinearTrend(values);
    
    // Detect seasonality
    const seasonality = this.detectSeasonality(monthlyTotals);
    
    // Calculate volatility
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const volatility = Math.sqrt(variance);

    return {
      monthlyTotals,
      trends: {
        slope: trend.slope,
        direction: trend.slope > 0 ? 'increasing' : trend.slope < 0 ? 'decreasing' : 'stable',
        strength: Math.abs(trend.correlation)
      },
      seasonality,
      statistics: {
        mean,
        median: this.calculateMedian(values),
        volatility,
        min: Math.min(...values),
        max: Math.max(...values)
      }
    };
  }

  calculateLinearTrend(values) {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate correlation coefficient
    const meanX = sumX / n;
    const meanY = sumY / n;
    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
    const denomX = Math.sqrt(x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0));
    const denomY = Math.sqrt(y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0));
    const correlation = numerator / (denomX * denomY);

    return { slope, intercept, correlation };
  }

  detectSeasonality(monthlyData) {
    const months = Object.keys(monthlyData).sort();
    const seasonalPatterns = {};

    months.forEach(month => {
      const monthNum = parseInt(month.split('-')[1]);
      const season = this.getSeasonFromMonth(monthNum);
      
      if (!seasonalPatterns[season]) {
        seasonalPatterns[season] = [];
      }
      seasonalPatterns[season].push(monthlyData[month]);
    });

    // Calculate seasonal averages
    const seasonalAverages = {};
    Object.keys(seasonalPatterns).forEach(season => {
      const values = seasonalPatterns[season];
      seasonalAverages[season] = values.reduce((a, b) => a + b, 0) / values.length;
    });

    return seasonalAverages;
  }

  generatePredictions(analysis, months) {
    const predictions = [];
    const lastMonth = Math.max(...Object.keys(analysis.monthlyTotals).map(m => parseInt(m.replace('-', ''))));
    
    for (let i = 1; i <= months; i++) {
      const futureMonth = this.addMonthsToDate(new Date(), i);
      const monthKey = `${futureMonth.getFullYear()}-${(futureMonth.getMonth() + 1).toString().padStart(2, '0')}`;
      
      // Base prediction using trend
      let basePrediction = analysis.statistics.mean + (analysis.trends.slope * i);
      
      // Apply seasonal adjustment
      const season = this.getSeasonFromMonth(futureMonth.getMonth() + 1);
      const seasonalMultiplier = analysis.seasonality[season] / analysis.statistics.mean;
      basePrediction *= seasonalMultiplier;
      
      // Add confidence intervals
      const volatilityFactor = analysis.statistics.volatility * Math.sqrt(i);
      
      predictions.push({
        month: monthKey,
        predicted: Math.max(0, basePrediction),
        confidence: {
          low: Math.max(0, basePrediction - volatilityFactor),
          high: basePrediction + volatilityFactor
        },
        factors: {
          trend: analysis.trends.slope * i,
          seasonal: seasonalMultiplier,
          volatility: volatilityFactor
        }
      });
    }

    return predictions;
  }

  async enhancePredictionsWithAI(historicalData, basePredictions, category) {
    try {
      const prompt = this.buildPredictionPrompt(historicalData, basePredictions, category);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        console.warn('AI enhancement failed, using base predictions');
        return basePredictions;
      }

      const result = await response.json();
      const aiResponse = result.candidates[0]?.content?.parts?.[0]?.text;
      
      if (aiResponse) {
        return this.parseAIEnhancedPredictions(aiResponse, basePredictions);
      }

      return basePredictions;
    } catch (error) {
      console.error('Error enhancing predictions with AI:', error);
      return basePredictions;
    }
  }

  // ===== DETECCIÓN DE ANOMALÍAS =====
  async detectSpendingAnomalies(userId, timeframe = 'month') {
    try {
      console.log('🚨 Detecting spending anomalies for:', userId);
      
      const expenses = await this.getRecentExpenses(userId, timeframe);
      const patterns = await this.getSpendingPatterns(userId);
      
      const anomalies = [];

      // 1. Amount-based anomalies
      const amountAnomalies = this.detectAmountAnomalies(expenses, patterns);
      anomalies.push(...amountAnomalies);

      // 2. Frequency-based anomalies
      const frequencyAnomalies = this.detectFrequencyAnomalies(expenses, patterns);
      anomalies.push(...frequencyAnomalies);

      // 3. Category-based anomalies
      const categoryAnomalies = this.detectCategoryAnomalies(expenses, patterns);
      anomalies.push(...categoryAnomalies);

      // 4. Time-based anomalies
      const timeAnomalies = this.detectTimeAnomalies(expenses, patterns);
      anomalies.push(...timeAnomalies);

      // Sort by severity
      anomalies.sort((a, b) => b.severity - a.severity);

      return {
        anomalies: anomalies.slice(0, 10), // Top 10 anomalies
        summary: this.generateAnomalySummary(anomalies),
        recommendations: await this.generateAnomalyRecommendations(anomalies)
      };
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      throw error;
    }
  }

  detectAmountAnomalies(expenses, patterns) {
    const anomalies = [];
    
    expenses.forEach(expense => {
      const categoryPattern = patterns.categories[expense.category];
      if (!categoryPattern) return;

      const zScore = Math.abs((expense.amount - categoryPattern.mean) / categoryPattern.stdDev);
      
      if (zScore > 2.5) { // 2.5 standard deviations
        anomalies.push({
          type: 'amount',
          expense,
          severity: Math.min(zScore / 2.5, 3), // Cap at 3
          message: `Gasto inusualmente ${expense.amount > categoryPattern.mean ? 'alto' : 'bajo'} en ${expense.category}`,
          details: {
            amount: expense.amount,
            expected: categoryPattern.mean,
            deviation: zScore
          }
        });
      }
    });

    return anomalies;
  }

  detectFrequencyAnomalies(expenses, patterns) {
    const anomalies = [];
    const currentFrequency = {};
    
    // Count current month's frequency by category
    expenses.forEach(expense => {
      currentFrequency[expense.category] = (currentFrequency[expense.category] || 0) + 1;
    });

    Object.keys(currentFrequency).forEach(category => {
      const expectedFreq = patterns.categories[category]?.frequency || 0;
      const actualFreq = currentFrequency[category];
      
      if (expectedFreq > 0) {
        const deviation = Math.abs(actualFreq - expectedFreq) / expectedFreq;
        
        if (deviation > this.anomalyThreshold) {
          anomalies.push({
            type: 'frequency',
            category,
            severity: Math.min(deviation, 3),
            message: `Frecuencia ${actualFreq > expectedFreq ? 'mayor' : 'menor'} de gastos en ${category}`,
            details: {
              actual: actualFreq,
              expected: expectedFreq,
              deviation
            }
          });
        }
      }
    });

    return anomalies;
  }

  // ===== CATEGORIZACIÓN AUTOMÁTICA =====
  async categorizeTransaction(description, amount, merchantInfo = null) {
    try {
      console.log('🏷️ Auto-categorizing transaction:', description);
      
      // First try rule-based categorization
      const ruleBasedCategory = this.ruleBasedCategorization(description, amount);
      
      if (ruleBasedCategory.confidence > 0.8) {
        return ruleBasedCategory;
      }

      // Enhance with AI if available
      if (this.apiKey) {
        const aiCategory = await this.aiBasedCategorization(description, amount, merchantInfo);
        
        // Combine rule-based and AI results
        return this.combineCategorizationResults(ruleBasedCategory, aiCategory);
      }

      return ruleBasedCategory;
    } catch (error) {
      console.error('Error categorizing transaction:', error);
      return { category: 'Otros', confidence: 0.5, method: 'fallback' };
    }
  }

  ruleBasedCategorization(description, amount) {
    const rules = [
      // Food & Restaurants
      {
        keywords: ['restaurant', 'comida', 'pizza', 'burger', 'cafe', 'bar', 'food', 'delivery'],
        category: 'Comida',
        confidence: 0.9
      },
      // Transportation
      {
        keywords: ['uber', 'taxi', 'bus', 'metro', 'gasolina', 'combustible', 'parking'],
        category: 'Transporte',
        confidence: 0.9
      },
      // Supermarket
      {
        keywords: ['supermercado', 'market', 'grocery', 'carrefour', 'walmart', 'coto'],
        category: 'Supermercado',
        confidence: 0.9
      },
      // Health
      {
        keywords: ['farmacia', 'hospital', 'medico', 'doctor', 'pharmacy', 'clinic'],
        category: 'Salud',
        confidence: 0.9
      },
      // Entertainment
      {
        keywords: ['cine', 'teatro', 'netflix', 'spotify', 'game', 'entertainment'],
        category: 'Ocio',
        confidence: 0.8
      },
      // Services
      {
        keywords: ['telefono', 'internet', 'luz', 'gas', 'agua', 'service', 'utility'],
        category: 'Servicios',
        confidence: 0.9
      }
    ];

    const desc = description.toLowerCase();
    
    for (const rule of rules) {
      for (const keyword of rule.keywords) {
        if (desc.includes(keyword)) {
          return {
            category: rule.category,
            confidence: rule.confidence,
            method: 'rule-based',
            matchedKeyword: keyword
          };
        }
      }
    }

    return {
      category: 'Otros',
      confidence: 0.3,
      method: 'rule-based'
    };
  }

  async aiBasedCategorization(description, amount, merchantInfo) {
    try {
      const prompt = `
        Categoriza esta transacción financiera en una de estas categorías:
        - Comida
        - Transporte
        - Supermercado
        - Salud
        - Ocio
        - Servicios
        - Otros

        Transacción:
        - Descripción: "${description}"
        - Monto: $${amount}
        ${merchantInfo ? `- Comercio: ${merchantInfo}` : ''}

        Responde SOLO con el nombre de la categoría y un número de confianza del 0 al 1, separados por coma.
        Ejemplo: "Comida,0.95"
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 50,
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error('AI categorization failed');
      }

      const result = await response.json();
      const aiResponse = result.candidates[0]?.content?.parts?.[0]?.text?.trim();
      
      if (aiResponse) {
        const [category, confidenceStr] = aiResponse.split(',');
        const confidence = parseFloat(confidenceStr) || 0.5;
        
        return {
          category: category.trim(),
          confidence,
          method: 'ai-based'
        };
      }

      throw new Error('Invalid AI response');
    } catch (error) {
      console.error('AI categorization error:', error);
      return {
        category: 'Otros',
        confidence: 0.3,
        method: 'ai-fallback'
      };
    }
  }

  // ===== RECOMENDACIONES INTELIGENTES =====
  async generateSmartRecommendations(userId, focusArea = 'general') {
    try {
      console.log('💡 Generating smart recommendations for:', userId);
      
      const userData = await this.getUserFinancialProfile(userId);
      const predictions = await this.predictFutureExpenses(userId);
      const anomalies = await this.detectSpendingAnomalies(userId);
      
      const recommendations = [];

      // Budget optimization recommendations
      const budgetRecs = await this.generateBudgetOptimizationRecs(userData);
      recommendations.push(...budgetRecs);

      // Spending pattern recommendations
      const patternRecs = await this.generatePatternBasedRecs(userData, anomalies);
      recommendations.push(...patternRecs);

      // Savings opportunities
      const savingsRecs = await this.generateSavingsOpportunities(userData, predictions);
      recommendations.push(...savingsRecs);

      // AI-enhanced recommendations
      if (this.apiKey) {
        const aiRecs = await this.generateAIRecommendations(userData, focusArea);
        recommendations.push(...aiRecs);
      }

      // Sort by priority and impact
      recommendations.sort((a, b) => (b.priority * b.impact) - (a.priority * a.impact));

      return {
        recommendations: recommendations.slice(0, 8), // Top 8 recommendations
        summary: this.generateRecommendationSummary(recommendations),
        actionPlan: this.generateActionPlan(recommendations.slice(0, 5))
      };
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====
  getMonthsAgo(months) {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  addMonthsToDate(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  getSeasonFromMonth(month) {
    if (month >= 12 || month <= 2) return 'summer'; // Southern hemisphere
    if (month >= 3 && month <= 5) return 'autumn';
    if (month >= 6 && month <= 8) return 'winter';
    return 'spring';
  }

  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  calculateConfidence(data) {
    if (data.length < 3) return 'low';
    if (data.length < 6) return 'medium';
    return 'high';
  }

  buildPredictionPrompt(historicalData, predictions, category) {
    return `
      Analiza estos datos históricos de gastos y mejora las predicciones:
      
      Datos históricos (últimos meses):
      ${JSON.stringify(historicalData.slice(-6), null, 2)}
      
      Predicciones base:
      ${JSON.stringify(predictions, null, 2)}
      
      ${category ? `Categoría específica: ${category}` : 'Todas las categorías'}
      
      Considera factores como:
      - Tendencias estacionales
      - Eventos económicos
      - Cambios en patrones de consumo
      - Inflación y factores externos
      
      Responde con un JSON que contenga predicciones ajustadas y factores considerados.
    `;
  }

  parseAIEnhancedPredictions(aiResponse, basePredictions) {
    try {
      // Try to extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiData = JSON.parse(jsonMatch[0]);
        // Merge AI insights with base predictions
        return basePredictions.map((pred, index) => ({
          ...pred,
          aiAdjustment: aiData.predictions?.[index]?.adjustment || 0,
          aiFactors: aiData.predictions?.[index]?.factors || []
        }));
      }
    } catch (error) {
      console.error('Error parsing AI predictions:', error);
    }
    
    return basePredictions;
  }
}