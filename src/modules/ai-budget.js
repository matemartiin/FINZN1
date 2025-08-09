// AI Budget Manager - Integración con Gemini y TensorFlow.js
import * as tf from '@tensorflow/tfjs';

export class AIBudgetManager {
  constructor() {
    this.model = null;
    this.isTraining = false;
    this.predictions = new Map();
    this.patterns = new Map();
    this.lastTrainingData = null;
    this.modelVersion = 1;
    
    console.log('🤖 AI Budget Manager initialized');
  }

  // Obtener datos históricos para entrenamiento
  async getTrainingData() {
    const userId = this.getCurrentUserId();
    if (!userId) return null;

    try {
      if (import.meta.env.DEV) {
        console.log('📊 Collecting training data from Supabase...');
      }
      
      const { supabase } = await import('../config/supabase.js');
      
      // Obtener gastos de los últimos 6 meses
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .gte('transaction_date', sixMonthsAgo.toISOString().split('T')[0])
        .order('transaction_date', { ascending: true });

      if (error) {
        console.error('Error fetching training data:', error);
        return null;
      }

      if (import.meta.env.DEV) {
        console.log(`📊 Collected ${expenses.length} expense records for training`);
      }
      return this.preprocessData(expenses);
    } catch (error) {
      console.error('Error in getTrainingData:', error);
      return null;
    }
  }

  // Preprocesar datos para el modelo
  preprocessData(expenses) {
    if (!expenses || expenses.length === 0) return null;

    const processedData = {
      features: [],
      labels: [],
      categories: new Set(),
      timePatterns: new Map(),
      categoryStats: new Map()
    };

    // Agrupar por categoría y fecha
    const categoryData = new Map();
    
    expenses.forEach(expense => {
      const date = new Date(expense.transaction_date);
      const category = expense.category;
      const amount = parseFloat(expense.amount);
      
      processedData.categories.add(category);
      
      if (!categoryData.has(category)) {
        categoryData.set(category, []);
      }
      
      categoryData.get(category).push({
        date,
        amount,
        dayOfWeek: date.getDay(),
        dayOfMonth: date.getDate(),
        month: date.getMonth(),
        hour: date.getHours() || 12 // Default si no hay hora
      });
    });

    // Crear features para cada categoría
    categoryData.forEach((data, category) => {
      const sortedData = data.sort((a, b) => a.date - b.date);
      
      // Calcular estadísticas por categoría
      const amounts = sortedData.map(d => d.amount);
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const maxAmount = Math.max(...amounts);
      const minAmount = Math.min(...amounts);
      
      processedData.categoryStats.set(category, {
        avg: avgAmount,
        max: maxAmount,
        min: minAmount,
        count: amounts.length
      });

      // Crear ventanas deslizantes para predicción
      for (let i = 7; i < sortedData.length; i++) {
        const features = [];
        const labels = [];
        
        // Features: últimos 7 días de gastos
        for (let j = i - 7; j < i; j++) {
          features.push(
            sortedData[j].amount / maxAmount, // Normalizado
            sortedData[j].dayOfWeek / 6, // Normalizado
            sortedData[j].month / 11 // Normalizado
          );
        }
        
        // Label: gasto del día siguiente
        labels.push(sortedData[i].amount / maxAmount);
        
        processedData.features.push(features);
        processedData.labels.push(labels);
      }
    });

    if (import.meta.env.DEV) {
      console.log(`📊 Preprocessed data: ${processedData.features.length} training samples`);
    }
    return processedData;
  }

  // Crear y entrenar modelo de TensorFlow.js
  async createAndTrainModel(trainingData) {
    if (!trainingData || trainingData.features.length === 0) {
      console.warn('⚠️ No training data available');
      return null;
    }

    try {
      console.log('🧠 Creating TensorFlow.js model...');
      
      // Crear modelo secuencial
      const model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [21], // 7 días * 3 features por día
            units: 64,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 32,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.1 }),
          tf.layers.dense({
            units: 16,
            activation: 'relu'
          }),
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid' // Para valores normalizados 0-1
          })
        ]
      });

      // Compilar modelo
      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['mae']
      });

      // Preparar datos para entrenamiento
      const xs = tf.tensor2d(trainingData.features);
      const ys = tf.tensor2d(trainingData.labels);

      console.log('🏋️ Training model...');
      this.isTraining = true;

      // Entrenar modelo
      const history = await model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, mae = ${logs.mae.toFixed(4)}`);
            }
          }
        }
      });

      // Limpiar tensores
      xs.dispose();
      ys.dispose();

      this.model = model;
      this.lastTrainingData = trainingData;
      this.isTraining = false;
      
      console.log('✅ Model training completed');
      return model;
    } catch (error) {
      console.error('❌ Error training model:', error);
      this.isTraining = false;
      return null;
    }
  }

  // Generar predicciones para categorías
  async generatePredictions(categories) {
    if (!this.model || !this.lastTrainingData) {
      console.warn('⚠️ Model not trained yet');
      return new Map();
    }

    const predictions = new Map();

    try {
      console.log('🔮 Generating predictions...');
      
      categories.forEach(category => {
        const categoryStats = this.lastTrainingData.categoryStats.get(category);
        if (!categoryStats) return;

        // Crear features para predicción (últimos 7 días simulados)
        const features = [];
        const now = new Date();
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          
          features.push(
            categoryStats.avg / categoryStats.max, // Gasto promedio normalizado
            date.getDay() / 6, // Día de la semana normalizado
            date.getMonth() / 11 // Mes normalizado
          );
        }

        // Hacer predicción
        const prediction = this.model.predict(tf.tensor2d([features]));
        const predictedValue = prediction.dataSync()[0] * categoryStats.max;
        
        predictions.set(category, {
          predicted: predictedValue,
          confidence: Math.min(0.95, categoryStats.count / 30), // Más datos = más confianza
          trend: this.calculateTrend(category),
          recommendation: this.generateCategoryRecommendation(category, predictedValue, categoryStats)
        });

        prediction.dispose();
      });

      this.predictions = predictions;
      console.log(`🔮 Generated predictions for ${predictions.size} categories`);
      return predictions;
    } catch (error) {
      console.error('❌ Error generating predictions:', error);
      return new Map();
    }
  }

  // Calcular tendencia de gasto
  calculateTrend(category) {
    const stats = this.lastTrainingData?.categoryStats.get(category);
    if (!stats) return 'stable';

    // Lógica simple de tendencia basada en variación
    const variation = (stats.max - stats.min) / stats.avg;
    
    if (variation > 0.5) return 'volatile';
    if (stats.avg > stats.min * 1.2) return 'increasing';
    if (stats.avg < stats.max * 0.8) return 'decreasing';
    return 'stable';
  }

  // Generar recomendación por categoría
  generateCategoryRecommendation(category, predicted, stats) {
    const avgSpending = stats.avg;
    const maxSpending = stats.max;
    
    if (predicted > avgSpending * 1.3) {
      return {
        type: 'warning',
        message: `Se predice un gasto alto en ${category}. Considera reducir un 20%.`,
        suggestedBudget: predicted * 0.8,
        priority: 'high'
      };
    } else if (predicted < avgSpending * 0.7) {
      return {
        type: 'opportunity',
        message: `Buen control en ${category}. Podrías reasignar parte del presupuesto.`,
        suggestedBudget: predicted * 1.1,
        priority: 'low'
      };
    } else {
      return {
        type: 'maintain',
        message: `Gasto estable en ${category}. Mantén el presupuesto actual.`,
        suggestedBudget: predicted,
        priority: 'medium'
      };
    }
  }

  // Generar recomendaciones con Gemini AI
  async generateGeminiRecommendations(userData) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ Gemini API key not found');
      return this.getFallbackRecommendations(userData);
    }

    try {
      if (import.meta.env.DEV) {
        console.log('🤖 Generating Gemini AI recommendations...');
      }
      
      const prompt = this.buildGeminiPrompt(userData);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1500,
            }
          }),
        }
      );

      if (!response.ok) {
        console.error('❌ Gemini API error:', response.status);
        return this.getFallbackRecommendations(userData);
      }

      const result = await response.json();
      const aiContent = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!aiContent.trim()) {
        return this.getFallbackRecommendations(userData);
      }

      return this.parseGeminiRecommendations(aiContent, userData);
    } catch (error) {
      console.error('❌ Error with Gemini API:', error);
      return this.getFallbackRecommendations(userData);
    }
  }

  // Construir prompt para Gemini
  buildGeminiPrompt(userData) {
    const { expenses, predictions, categoryStats } = userData;
    
    let prompt = `Eres un asesor financiero experto. Analiza los siguientes datos de gastos y genera recomendaciones específicas para optimizar el presupuesto.

DATOS DEL USUARIO:
- Total de gastos registrados: ${expenses.length}
- Categorías principales: ${Array.from(categoryStats.keys()).join(', ')}

ANÁLISIS POR CATEGORÍA:`;

    categoryStats.forEach((stats, category) => {
      const prediction = predictions.get(category);
      prompt += `
- ${category}: 
  * Promedio: $${stats.avg.toFixed(2)}
  * Máximo: $${stats.max.toFixed(2)}
  * Predicción ML: $${prediction?.predicted.toFixed(2) || 'N/A'}
  * Tendencia: ${prediction?.trend || 'estable'}`;
    });

    prompt += `

INSTRUCCIONES:
1. Genera exactamente 5 recomendaciones específicas y accionables
2. Cada recomendación debe incluir:
   - Categoría específica
   - Acción concreta (ej: "Reduce delivery los miércoles")
   - Monto sugerido para el presupuesto
   - Justificación basada en los datos
3. Prioriza las categorías con mayor impacto potencial
4. Usa un tono amigable pero profesional
5. Formato de respuesta:

RECOMENDACIÓN 1:
Categoría: [nombre]
Acción: [acción específica]
Presupuesto sugerido: $[monto]
Justificación: [razón basada en datos]

[Repite para las 5 recomendaciones]

Genera las recomendaciones ahora:`;

    return prompt;
  }

  // Parsear respuesta de Gemini
  parseGeminiRecommendations(aiContent, userData) {
    const recommendations = [];
    const sections = aiContent.split('RECOMENDACIÓN').filter(section => section.trim());
    
    sections.forEach((section, index) => {
      if (index === 0) return; // Skip header
      
      const lines = section.split('\n').filter(line => line.trim());
      let category = '';
      let action = '';
      let budget = 0;
      let justification = '';
      
      lines.forEach(line => {
        const cleanLine = line.trim();
        if (cleanLine.startsWith('Categoría:')) {
          category = cleanLine.replace('Categoría:', '').trim();
        } else if (cleanLine.startsWith('Acción:')) {
          action = cleanLine.replace('Acción:', '').trim();
        } else if (cleanLine.startsWith('Presupuesto sugerido:')) {
          const budgetMatch = cleanLine.match(/\$?(\d+(?:\.\d{2})?)/);
          budget = budgetMatch ? parseFloat(budgetMatch[1]) : 0;
        } else if (cleanLine.startsWith('Justificación:')) {
          justification = cleanLine.replace('Justificación:', '').trim();
        }
      });
      
      if (category && action && budget > 0) {
        recommendations.push({
          id: `ai_rec_${Date.now()}_${index}`,
          category,
          action,
          suggestedBudget: budget,
          justification,
          type: 'ai_recommendation',
          confidence: 0.85,
          source: 'gemini',
          applicable: true,
          priority: index <= 2 ? 'high' : 'medium'
        });
      }
    });
    
    if (import.meta.env.DEV) {
      console.log(`🤖 Parsed ${recommendations.length} Gemini recommendations`);
    }
    return recommendations;
  }

  // Recomendaciones de respaldo si falla Gemini
  getFallbackRecommendations(userData) {
    const { categoryStats, predictions } = userData;
    const recommendations = [];
    
    let index = 0;
    categoryStats.forEach((stats, category) => {
      const prediction = predictions.get(category);
      if (!prediction) return;
      
      const rec = prediction.recommendation;
      recommendations.push({
        id: `fallback_rec_${Date.now()}_${index}`,
        category,
        action: rec.message,
        suggestedBudget: rec.suggestedBudget,
        justification: `Basado en análisis de patrones de gasto en ${category}`,
        type: 'ml_recommendation',
        confidence: prediction.confidence,
        source: 'ml_model',
        applicable: true,
        priority: rec.priority
      });
      
      index++;
    });
    
    return recommendations.slice(0, 5); // Máximo 5 recomendaciones
  }

  // Detectar patrones de comportamiento
  async detectSpendingPatterns(expenses) {
    if (!expenses || expenses.length < 10) {
      return { patterns: [], insights: [] };
    }

    const patterns = {
      timePatterns: new Map(),
      dayPatterns: new Map(),
      categoryPatterns: new Map(),
      amountPatterns: new Map()
    };

    // Analizar patrones temporales
    expenses.forEach(expense => {
      const date = new Date(expense.transaction_date);
      const dayOfWeek = date.getDay();
      const hour = date.getHours() || 12;
      const category = expense.category;
      const amount = parseFloat(expense.amount);

      // Patrones por día de la semana
      if (!patterns.dayPatterns.has(dayOfWeek)) {
        patterns.dayPatterns.set(dayOfWeek, { count: 0, total: 0, categories: new Set() });
      }
      const dayData = patterns.dayPatterns.get(dayOfWeek);
      dayData.count++;
      dayData.total += amount;
      dayData.categories.add(category);

      // Patrones por categoría
      if (!patterns.categoryPatterns.has(category)) {
        patterns.categoryPatterns.set(category, { count: 0, total: 0, avgAmount: 0, days: new Set() });
      }
      const catData = patterns.categoryPatterns.get(category);
      catData.count++;
      catData.total += amount;
      catData.avgAmount = catData.total / catData.count;
      catData.days.add(dayOfWeek);
    });

    // Generar insights basados en patrones
    const insights = this.generatePatternInsights(patterns);
    
    return { patterns, insights };
  }

  // Generar insights de patrones
  generatePatternInsights(patterns) {
    const insights = [];
    
    // Insight de día más caro
    let maxDaySpending = 0;
    let maxDay = 0;
    patterns.dayPatterns.forEach((data, day) => {
      if (data.total > maxDaySpending) {
        maxDaySpending = data.total;
        maxDay = day;
      }
    });
    
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    insights.push({
      type: 'day_pattern',
      title: 'Día de mayor gasto',
      description: `Los ${dayNames[maxDay]}s son tu día de mayor gasto con $${maxDaySpending.toFixed(2)} en promedio`,
      actionable: true,
      suggestion: `Planifica mejor los gastos de los ${dayNames[maxDay]}s`
    });

    // Insight de categoría dominante
    let maxCategorySpending = 0;
    let maxCategory = '';
    patterns.categoryPatterns.forEach((data, category) => {
      if (data.total > maxCategorySpending) {
        maxCategorySpending = data.total;
        maxCategory = category;
      }
    });
    
    insights.push({
      type: 'category_pattern',
      title: 'Categoría principal',
      description: `${maxCategory} representa tu mayor gasto con $${maxCategorySpending.toFixed(2)}`,
      actionable: true,
      suggestion: `Considera establecer un límite más estricto para ${maxCategory}`
    });

    return insights;
  }

  // Aplicar recomendación al presupuesto
  async applyRecommendation(recommendation) {
    try {
      console.log('✅ Applying recommendation:', recommendation.id);
      
      const { supabase } = await import('../config/supabase.js');
      const userId = this.getCurrentUserId();
      
      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      // Crear o actualizar presupuesto basado en la recomendación
      const budgetData = {
        user_id: userId,
        name: `Presupuesto IA - ${recommendation.category}`,
        category: recommendation.category,
        amount: recommendation.suggestedBudget,
        start_date: new Date().toISOString().split('T')[0],
        end_date: this.getNextMonthEnd(),
        ai_recommended: true,
        status: 'active'
      };

      const { data, error } = await supabase
        .from('budgets')
        .upsert(budgetData, {
          onConflict: 'user_id,category',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('Error applying recommendation:', error);
        return false;
      }

      // Marcar recomendación como aplicada
      await this.markRecommendationAsApplied(recommendation.id);
      
      console.log('✅ Recommendation applied successfully');
      return true;
    } catch (error) {
      console.error('❌ Error applying recommendation:', error);
      return false;
    }
  }

  // Marcar recomendación como aplicada
  async markRecommendationAsApplied(recommendationId) {
    try {
      const { supabase } = await import('../config/supabase.js');
      const userId = this.getCurrentUserId();
      
      await supabase
        .from('budget_insights')
        .insert({
          user_id: userId,
          insight_type: 'applied_recommendation',
          title: 'Recomendación Aplicada',
          description: `Recomendación ${recommendationId} aplicada al presupuesto`,
          data: { recommendation_id: recommendationId, applied_at: new Date().toISOString() },
          status: 'applied'
        });
    } catch (error) {
      console.error('Error marking recommendation as applied:', error);
    }
  }

  // Obtener fecha de fin del próximo mes
  getNextMonthEnd() {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(0); // Último día del mes
    return date.toISOString().split('T')[0];
  }

  // Entrenar modelo periódicamente
  async scheduleModelRetraining() {
    // Reentrenar cada vez que se agreguen nuevos gastos
    setInterval(async () => {
      if (!this.isTraining) {
        console.log('🔄 Scheduled model retraining...');
        await this.trainModel();
      }
    }, 24 * 60 * 60 * 1000); // Una vez al día
  }

  // Método principal para entrenar el modelo
  async trainModel() {
    try {
      const trainingData = await this.getTrainingData();
      if (trainingData) {
        await this.createAndTrainModel(trainingData);
        console.log('✅ Model retrained successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error in model training:', error);
      return false;
    }
  }

  // Método principal para generar todas las recomendaciones
  async generateAllRecommendations() {
    try {
      console.log('🚀 Starting comprehensive AI analysis...');
      
      // 1. Obtener datos de entrenamiento
      const trainingData = await this.getTrainingData();
      
      // 2. Validar datos suficientes
      const validationResult = this.validateDataSufficiency(trainingData);
      if (!validationResult.isValid) {
        return {
          error: 'insufficient_data',
          message: validationResult.message,
          requirements: validationResult.requirements,
          current: validationResult.current
        };
      }

      // 3. Entrenar modelo si no existe
      if (!this.model) {
        await this.createAndTrainModel(trainingData);
      }

      // 4. Generar predicciones ML
      const categories = Array.from(trainingData.categories);
      const predictions = await this.generatePredictions(categories);

      // 5. Detectar patrones
      const expenses = await this.getRecentExpenses();
      const { patterns, insights } = await this.detectSpendingPatterns(expenses);

      // 6. Generar recomendaciones con Gemini
      const userData = {
        expenses,
        predictions,
        categoryStats: trainingData.categoryStats,
        patterns,
        insights
      };
      
      const geminiRecommendations = await this.generateGeminiRecommendations(userData);

      // 7. Combinar todas las recomendaciones
      const allRecommendations = {
        aiRecommendations: geminiRecommendations,
        mlPredictions: Array.from(predictions.entries()).map(([category, pred]) => ({
          category,
          ...pred
        })),
        patterns: insights,
        summary: {
          totalCategories: categories.length,
          totalExpenses: expenses.length,
          modelConfidence: this.calculateOverallConfidence(predictions),
          lastUpdated: new Date().toISOString()
        }
      };

      console.log('✅ AI analysis completed successfully');
      return allRecommendations;
    } catch (error) {
      console.error('❌ Error in AI analysis:', error);
      throw error;
    }
  }

  // Validar si hay datos suficientes para el análisis
  validateDataSufficiency(trainingData) {
    const requirements = {
      minExpenses: 15,
      minCategories: 3,
      minDays: 14,
      minAmount: 1000
    };

    if (!trainingData) {
      return {
        isValid: false,
        message: 'No se encontraron datos de gastos para analizar',
        requirements: requirements,
        current: {
          expenses: 0,
          categories: 0,
          days: 0,
          totalAmount: 0
        }
      };
    }

    const current = {
      expenses: trainingData.features.length,
      categories: trainingData.categories.size,
      days: this.calculateDaysWithExpenses(trainingData),
      totalAmount: this.calculateTotalAmount(trainingData)
    };

    const issues = [];
    
    if (current.expenses < requirements.minExpenses) {
      issues.push(`Necesitas al menos ${requirements.minExpenses} gastos registrados (tienes ${current.expenses})`);
    }
    
    if (current.categories < requirements.minCategories) {
      issues.push(`Necesitas gastos en al menos ${requirements.minCategories} categorías diferentes (tienes ${current.categories})`);
    }
    
    if (current.days < requirements.minDays) {
      issues.push(`Necesitas gastos distribuidos en al menos ${requirements.minDays} días diferentes (tienes ${current.days})`);
    }
    
    if (current.totalAmount < requirements.minAmount) {
      issues.push(`El monto total de gastos debe ser al menos $${requirements.minAmount} (tienes $${current.totalAmount.toFixed(2)})`);
    }

    if (issues.length > 0) {
      return {
        isValid: false,
        message: 'Datos insuficientes para generar análisis IA confiable',
        requirements: requirements,
        current: current,
        issues: issues
      };
    }

    return {
      isValid: true,
      message: 'Datos suficientes para análisis IA',
      requirements: requirements,
      current: current
    };
  }

  // Calcular días únicos con gastos
  calculateDaysWithExpenses(trainingData) {
    const uniqueDays = new Set();
    
    trainingData.categoryStats.forEach((stats, category) => {
      // Simular días únicos basado en la cantidad de gastos
      // En una implementación real, tendrías las fechas exactas
      const estimatedDays = Math.min(stats.count, 30); // Máximo 30 días
      for (let i = 0; i < estimatedDays; i++) {
        uniqueDays.add(`day_${i}`);
      }
    });
    
    return uniqueDays.size;
  }

  // Calcular monto total de gastos
  calculateTotalAmount(trainingData) {
    let total = 0;
    trainingData.categoryStats.forEach((stats) => {
      total += stats.avg * stats.count;
    });
    return total;
  }

  // Obtener gastos recientes
  async getRecentExpenses() {
    const userId = this.getCurrentUserId();
    if (!userId) return [];

    try {
      const { supabase } = await import('../config/supabase.js');
      
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .gte('transaction_date', threeMonthsAgo.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });

      return data || [];
    } catch (error) {
      console.error('Error fetching recent expenses:', error);
      return [];
    }
  }

  // Calcular confianza general del modelo
  calculateOverallConfidence(predictions) {
    if (predictions.size === 0) return 0;
    
    let totalConfidence = 0;
    predictions.forEach(pred => {
      totalConfidence += pred.confidence;
    });
    
    return totalConfidence / predictions.size;
  }

  // Obtener ID del usuario actual
  getCurrentUserId() {
    return window.app?.auth?.getCurrentUserId() || null;
  }

  // Limpiar recursos
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.predictions.clear();
    this.patterns.clear();
  }
}