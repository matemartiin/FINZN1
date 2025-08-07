/**
 * Budget Assistant Module - Phase 3 & 4 Implementation
 * AI-powered virtual assistant for budget management and financial coaching
 */

export class BudgetAssistant {
  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.isEnabled = !!this.apiKey;
    this.conversationHistory = [];
    this.userContext = {};
    this.coachingStrategies = new Map();
    this.initializeCoachingStrategies();
  }

  initializeCoachingStrategies() {
    this.coachingStrategies.set('overspender', {
      approach: 'supportive_reduction',
      techniques: ['gradual_limits', 'alternative_suggestions', 'progress_celebration'],
      messages: [
        'Entiendo que reducir gastos puede ser desafiante. Vamos paso a paso.',
        '¿Qué te parece si empezamos con pequeños cambios?',
        'Cada peso ahorrado es un logro. ¡Celebremos tus avances!'
      ]
    });

    this.coachingStrategies.set('conservative_saver', {
      approach: 'encouraging_optimization',
      techniques: ['goal_setting', 'investment_education', 'balanced_enjoyment'],
      messages: [
        'Tienes excelentes hábitos de ahorro. ¿Has considerado invertir?',
        'Es importante equilibrar ahorro con disfrute de la vida.',
        'Tus ahorros podrían trabajar más para ti.'
      ]
    });

    this.coachingStrategies.set('inconsistent_budgeter', {
      approach: 'habit_building',
      techniques: ['routine_establishment', 'automation', 'accountability'],
      messages: [
        'La consistencia es clave. Vamos a crear rutinas simples.',
        'Automatizar puede ayudarte a mantener el rumbo.',
        'Estoy aquí para recordarte tus objetivos cuando lo necesites.'
      ]
    });
  }

  /**
   * PHASE 3: Intelligent Budget Consultation
   * Provides contextual advice and recommendations
   */
  async provideBudgetConsultation(query, userFinancialData, conversationContext = {}) {
    console.log('🤖 Processing budget consultation:', query);

    // Update user context
    this.updateUserContext(userFinancialData);

    // Determine consultation type
    const consultationType = this.classifyConsultation(query);
    
    // Generate contextual response
    const response = await this.generateConsultationResponse(
      query, 
      consultationType, 
      userFinancialData, 
      conversationContext
    );

    // Update conversation history
    this.conversationHistory.push({
      timestamp: new Date().toISOString(),
      query: query,
      response: response,
      type: consultationType,
      context: { ...this.userContext }
    });

    console.log('✅ Budget consultation completed');
    return response;
  }

  classifyConsultation(query) {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('ahorr') || queryLower.includes('save')) {
      return 'savings_advice';
    } else if (queryLower.includes('gast') || queryLower.includes('spend') || queryLower.includes('limit')) {
      return 'spending_management';
    } else if (queryLower.includes('presupuesto') || queryLower.includes('budget')) {
      return 'budget_planning';
    } else if (queryLower.includes('meta') || queryLower.includes('objetivo') || queryLower.includes('goal')) {
      return 'goal_setting';
    } else if (queryLower.includes('inversion') || queryLower.includes('invest')) {
      return 'investment_guidance';
    } else if (queryLower.includes('deuda') || queryLower.includes('debt')) {
      return 'debt_management';
    } else if (queryLower.includes('emergencia') || queryLower.includes('emergency')) {
      return 'emergency_planning';
    }
    
    return 'general_advice';
  }

  async generateConsultationResponse(query, type, financialData, context) {
    if (!this.isEnabled) {
      return this.getFallbackConsultationResponse(query, type, financialData);
    }

    try {
      const prompt = this.buildConsultationPrompt(query, type, financialData, context);
      
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
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 512,
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const result = await response.json();
      const aiContent = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return this.formatConsultationResponse(aiContent, type, financialData);
    } catch (error) {
      console.error('Error in AI consultation:', error);
      return this.getFallbackConsultationResponse(query, type, financialData);
    }
  }

  buildConsultationPrompt(query, type, financialData, context) {
    const userProfile = this.generateUserProfile(financialData);
    const contextualInfo = this.getContextualInformation(type, financialData);
    
    return `Eres un asesor financiero personal experto y empático. Responde a la consulta del usuario de manera personalizada y práctica.

PERFIL DEL USUARIO:
${userProfile}

CONTEXTO FINANCIERO ACTUAL:
${contextualInfo}

CONSULTA DEL USUARIO: "${query}"

TIPO DE CONSULTA: ${type}

INSTRUCCIONES:
1. Responde de manera empática y personalizada
2. Proporciona consejos específicos y accionables
3. Usa los datos financieros del usuario para personalizar la respuesta
4. Mantén un tono alentador pero realista
5. Incluye pasos concretos que el usuario puede seguir
6. Máximo 200 palabras

Responde directamente al usuario en español, sin formato especial.`;
  }

  generateUserProfile(financialData) {
    const totalIncome = financialData.totalIncome || 0;
    const totalExpenses = financialData.totalExpenses || 0;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;
    const budgetingBehavior = this.analyzeBudgetingBehavior(financialData);
    
    return `- Ingresos mensuales: $${totalIncome.toLocaleString()}
- Gastos mensuales: $${totalExpenses.toLocaleString()}
- Tasa de ahorro: ${savingsRate.toFixed(1)}%
- Perfil de comportamiento: ${budgetingBehavior}
- Categorías de gasto activas: ${financialData.categories?.length || 0}
- Objetivos de ahorro: ${financialData.goals?.length || 0}`;
  }

  getContextualInformation(type, financialData) {
    switch (type) {
      case 'savings_advice':
        return this.getSavingsContext(financialData);
      case 'spending_management':
        return this.getSpendingContext(financialData);
      case 'budget_planning':
        return this.getBudgetContext(financialData);
      case 'goal_setting':
        return this.getGoalsContext(financialData);
      default:
        return this.getGeneralContext(financialData);
    }
  }

  getSavingsContext(financialData) {
    const savingsRate = financialData.totalIncome > 0 
      ? ((financialData.totalIncome - financialData.totalExpenses) / financialData.totalIncome * 100) 
      : 0;
    
    return `- Tasa de ahorro actual: ${savingsRate.toFixed(1)}%
- Objetivos de ahorro activos: ${financialData.goals?.length || 0}
- Balance disponible: $${(financialData.totalIncome - financialData.totalExpenses).toLocaleString()}`;
  }

  getSpendingContext(financialData) {
    const topCategory = this.getTopSpendingCategory(financialData.expenses || []);
    const limitsExceeded = this.countLimitsExceeded(financialData.expenses || [], financialData.limits || []);
    
    return `- Categoría de mayor gasto: ${topCategory.category} ($${topCategory.amount.toLocaleString()})
- Límites superados: ${limitsExceeded}
- Total de transacciones: ${financialData.expenses?.length || 0}`;
  }

  getBudgetContext(financialData) {
    const totalBudgeted = (financialData.limits || []).reduce((sum, limit) => sum + limit.amount, 0);
    const budgetUtilization = financialData.totalExpenses / totalBudgeted * 100;
    
    return `- Presupuesto total: $${totalBudgeted.toLocaleString()}
- Utilización del presupuesto: ${budgetUtilization.toFixed(1)}%
- Límites configurados: ${financialData.limits?.length || 0}`;
  }

  getGoalsContext(financialData) {
    const goals = financialData.goals || [];
    const totalGoalAmount = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
    const totalSaved = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
    
    return `- Objetivos activos: ${goals.length}
- Meta total de ahorro: $${totalGoalAmount.toLocaleString()}
- Progreso total: $${totalSaved.toLocaleString()} (${totalGoalAmount > 0 ? (totalSaved/totalGoalAmount*100).toFixed(1) : 0}%)`;
  }

  getGeneralContext(financialData) {
    return `- Balance mensual: $${(financialData.totalIncome - financialData.totalExpenses).toLocaleString()}
- Salud financiera: ${this.assessFinancialHealth(financialData)}
- Áreas de oportunidad: ${this.identifyOpportunities(financialData).join(', ')}`;
  }

  /**
   * PHASE 4: Personalized Financial Coaching
   * Provides ongoing coaching based on user behavior and goals
   */
  async providePersonalizedCoaching(userFinancialData, coachingGoals = []) {
    console.log('🎯 Generating personalized financial coaching...');

    const userBehaviorProfile = this.analyzeBudgetingBehavior(userFinancialData);
    const coachingStrategy = this.coachingStrategies.get(userBehaviorProfile) || this.coachingStrategies.get('inconsistent_budgeter');
    
    const coaching = {
      user_profile: userBehaviorProfile,
      coaching_approach: coachingStrategy.approach,
      current_focus_areas: this.identifyFocusAreas(userFinancialData),
      personalized_recommendations: await this.generatePersonalizedRecommendations(userFinancialData, coachingStrategy),
      progress_tracking: this.setupProgressTracking(userFinancialData, coachingGoals),
      next_steps: this.defineNextSteps(userFinancialData, coachingStrategy),
      motivational_message: this.generateMotivationalMessage(userFinancialData, coachingStrategy)
    };

    console.log('✅ Personalized coaching generated:', coaching);
    return coaching;
  }

  analyzeBudgetingBehavior(financialData) {
    const savingsRate = financialData.totalIncome > 0 
      ? ((financialData.totalIncome - financialData.totalExpenses) / financialData.totalIncome * 100) 
      : 0;
    
    const limitsExceeded = this.countLimitsExceeded(financialData.expenses || [], financialData.limits || []);
    const budgetUtilization = this.calculateBudgetUtilization(financialData);
    
    if (savingsRate > 20 && limitsExceeded === 0) {
      return 'conservative_saver';
    } else if (limitsExceeded > 2 || savingsRate < 0) {
      return 'overspender';
    } else if (budgetUtilization < 0.5 || budgetUtilization > 1.2) {
      return 'inconsistent_budgeter';
    }
    
    return 'balanced_budgeter';
  }

  identifyFocusAreas(financialData) {
    const focusAreas = [];
    const savingsRate = financialData.totalIncome > 0 
      ? ((financialData.totalIncome - financialData.totalExpenses) / financialData.totalIncome * 100) 
      : 0;
    
    if (savingsRate < 10) {
      focusAreas.push({
        area: 'savings_improvement',
        priority: 'high',
        description: 'Mejorar tasa de ahorro mensual'
      });
    }
    
    const limitsExceeded = this.countLimitsExceeded(financialData.expenses || [], financialData.limits || []);
    if (limitsExceeded > 0) {
      focusAreas.push({
        area: 'spending_control',
        priority: 'high',
        description: 'Controlar gastos que superan límites'
      });
    }
    
    if ((financialData.goals || []).length === 0) {
      focusAreas.push({
        area: 'goal_setting',
        priority: 'medium',
        description: 'Establecer objetivos financieros claros'
      });
    }
    
    return focusAreas;
  }

  async generatePersonalizedRecommendations(financialData, coachingStrategy) {
    const recommendations = [];
    
    // Strategy-based recommendations
    coachingStrategy.techniques.forEach(technique => {
      const recommendation = this.generateTechniqueRecommendation(technique, financialData);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    });
    
    // Data-driven recommendations
    const dataRecommendations = this.generateDataDrivenRecommendations(financialData);
    recommendations.push(...dataRecommendations);
    
    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  generateTechniqueRecommendation(technique, financialData) {
    switch (technique) {
      case 'gradual_limits':
        return {
          technique: 'gradual_limits',
          title: 'Reducción Gradual de Límites',
          description: 'Reduce tus límites de gasto en 5% cada mes para crear un hábito sostenible',
          action_steps: [
            'Identifica tu categoría de mayor gasto',
            'Reduce el límite en $50-100 este mes',
            'Monitorea tu progreso semanalmente'
          ],
          expected_outcome: 'Reducción gradual y sostenible del gasto'
        };
        
      case 'automation':
        return {
          technique: 'automation',
          title: 'Automatización de Ahorros',
          description: 'Configura transferencias automáticas para ahorrar sin esfuerzo',
          action_steps: [
            'Calcula el 10% de tus ingresos',
            'Configura transferencia automática el día de cobro',
            'Revisa y ajusta mensualmente'
          ],
          expected_outcome: 'Ahorro consistente sin esfuerzo consciente'
        };
        
      case 'goal_setting':
        return {
          technique: 'goal_setting',
          title: 'Establecimiento de Metas SMART',
          description: 'Define objetivos específicos, medibles y alcanzables',
          action_steps: [
            'Define una meta específica (ej: $10,000 para emergencias)',
            'Establece un plazo realista (ej: 12 meses)',
            'Calcula el ahorro mensual necesario'
          ],
          expected_outcome: 'Mayor motivación y dirección en tus finanzas'
        };
        
      default:
        return null;
    }
  }

  generateDataDrivenRecommendations(financialData) {
    const recommendations = [];
    const topCategory = this.getTopSpendingCategory(financialData.expenses || []);
    
    if (topCategory.amount > 0) {
      recommendations.push({
        type: 'category_optimization',
        title: `Optimizar gastos en ${topCategory.category}`,
        description: `Esta es tu categoría de mayor gasto con $${topCategory.amount.toLocaleString()}`,
        action_steps: [
          `Revisa todos los gastos en ${topCategory.category}`,
          'Identifica gastos innecesarios o duplicados',
          'Busca alternativas más económicas'
        ],
        potential_savings: topCategory.amount * 0.15 // 15% potential savings
      });
    }
    
    return recommendations;
  }

  setupProgressTracking(financialData, coachingGoals) {
    return {
      metrics_to_track: [
        {
          metric: 'savings_rate',
          current_value: this.calculateSavingsRate(financialData),
          target_value: 20,
          frequency: 'monthly'
        },
        {
          metric: 'budget_adherence',
          current_value: this.calculateBudgetAdherence(financialData),
          target_value: 90,
          frequency: 'weekly'
        },
        {
          metric: 'goal_progress',
          current_value: this.calculateGoalProgress(financialData),
          target_value: 100,
          frequency: 'monthly'
        }
      ],
      check_in_schedule: 'weekly',
      milestone_celebrations: this.defineMilestones(financialData)
    };
  }

  defineNextSteps(financialData, coachingStrategy) {
    const nextSteps = [];
    
    // Immediate actions (next 7 days)
    nextSteps.push({
      timeframe: 'immediate',
      actions: [
        'Revisar gastos de la semana pasada',
        'Identificar una categoría para optimizar',
        'Configurar una alerta de límite de gasto'
      ]
    });
    
    // Short-term actions (next 30 days)
    nextSteps.push({
      timeframe: 'short_term',
      actions: [
        'Implementar una recomendación de coaching',
        'Establecer un nuevo objetivo de ahorro',
        'Revisar y ajustar límites presupuestarios'
      ]
    });
    
    // Long-term actions (next 90 days)
    nextSteps.push({
      timeframe: 'long_term',
      actions: [
        'Evaluar progreso hacia objetivos financieros',
        'Considerar nuevas estrategias de inversión',
        'Planificar para gastos estacionales'
      ]
    });
    
    return nextSteps;
  }

  generateMotivationalMessage(financialData, coachingStrategy) {
    const messages = coachingStrategy.messages;
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    const savingsRate = this.calculateSavingsRate(financialData);
    const personalizedElement = savingsRate > 10 
      ? ' ¡Tu disciplina financiera está dando frutos!' 
      : ' Cada pequeño paso cuenta en tu viaje financiero.';
    
    return randomMessage + personalizedElement;
  }

  // Utility methods
  updateUserContext(financialData) {
    this.userContext = {
      last_updated: new Date().toISOString(),
      total_income: financialData.totalIncome || 0,
      total_expenses: financialData.totalExpenses || 0,
      savings_rate: this.calculateSavingsRate(financialData),
      behavior_profile: this.analyzeBudgetingBehavior(financialData),
      active_goals: (financialData.goals || []).length,
      budget_limits: (financialData.limits || []).length
    };
  }

  formatConsultationResponse(aiContent, type, financialData) {
    return {
      response: aiContent.trim(),
      type: type,
      personalization_level: 'high',
      confidence: 0.85,
      follow_up_suggestions: this.generateFollowUpSuggestions(type),
      related_actions: this.getRelatedActions(type),
      timestamp: new Date().toISOString()
    };
  }

  generateFollowUpSuggestions(type) {
    const suggestions = {
      'savings_advice': [
        '¿Te gustaría que analice tu potencial de ahorro por categoría?',
        '¿Quieres que te ayude a establecer un objetivo de ahorro específico?'
      ],
      'spending_management': [
        '¿Necesitas ayuda para establecer límites más realistas?',
        '¿Te interesa conocer estrategias para reducir gastos específicos?'
      ],
      'budget_planning': [
        '¿Quieres que revise tu distribución presupuestaria actual?',
        '¿Te ayudo a planificar el presupuesto del próximo mes?'
      ]
    };
    
    return suggestions[type] || [
      '¿Hay algún aspecto específico de tus finanzas que te preocupe?',
      '¿Te gustaría profundizar en algún tema financiero particular?'
    ];
  }

  getRelatedActions(type) {
    const actions = {
      'savings_advice': ['create_savings_goal', 'analyze_spending_patterns', 'setup_automatic_savings'],
      'spending_management': ['set_spending_limits', 'review_categories', 'create_spending_alert'],
      'budget_planning': ['optimize_budget', 'simulate_scenarios', 'create_monthly_plan']
    };
    
    return actions[type] || ['general_financial_review', 'set_financial_goals'];
  }

  getFallbackConsultationResponse(query, type, financialData) {
    const fallbackResponses = {
      'savings_advice': `Basándome en tus datos, tienes una tasa de ahorro del ${this.calculateSavingsRate(financialData).toFixed(1)}%. Te recomiendo aplicar la regla 50/30/20: 50% gastos necesarios, 30% gastos personales, 20% ahorros. Comienza automatizando aunque sea el 10% de tus ingresos.`,
      
      'spending_management': `Veo que tu categoría de mayor gasto es ${this.getTopSpendingCategory(financialData.expenses || []).category}. Te sugiero revisar estos gastos y buscar oportunidades de optimización. Considera establecer límites semanales además de los mensuales.`,
      
      'budget_planning': `Tu presupuesto actual tiene una utilización del ${this.calculateBudgetUtilization(financialData).toFixed(1)}%. Un buen presupuesto debe tener flexibilidad pero también disciplina. Te recomiendo revisar mensualmente y ajustar según tus patrones reales de gasto.`,
      
      'general_advice': `Basándome en tu situación financiera actual, te recomiendo enfocarte en mantener un registro detallado de gastos, establecer objetivos claros de ahorro, y revisar regularmente tu progreso. La consistencia es clave en las finanzas personales.`
    };
    
    return {
      response: fallbackResponses[type] || fallbackResponses['general_advice'],
      type: type,
      personalization_level: 'medium',
      confidence: 0.7,
      follow_up_suggestions: this.generateFollowUpSuggestions(type),
      related_actions: this.getRelatedActions(type),
      timestamp: new Date().toISOString()
    };
  }

  // Calculation utilities
  calculateSavingsRate(financialData) {
    if (financialData.totalIncome <= 0) return 0;
    return ((financialData.totalIncome - financialData.totalExpenses) / financialData.totalIncome) * 100;
  }

  calculateBudgetUtilization(financialData) {
    const totalBudgeted = (financialData.limits || []).reduce((sum, limit) => sum + limit.amount, 0);
    if (totalBudgeted <= 0) return 0;
    return financialData.totalExpenses / totalBudgeted;
  }

  calculateBudgetAdherence(financialData) {
    const limits = financialData.limits || [];
    if (limits.length === 0) return 100;
    
    const categoryTotals = this.calculateCategoryTotals(financialData.expenses || []);
    let adherentCategories = 0;
    
    limits.forEach(limit => {
      const spent = categoryTotals[limit.category] || 0;
      if (spent <= limit.amount) {
        adherentCategories++;
      }
    });
    
    return (adherentCategories / limits.length) * 100;
  }

  calculateGoalProgress(financialData) {
    const goals = financialData.goals || [];
    if (goals.length === 0) return 0;
    
    const totalProgress = goals.reduce((sum, goal) => {
      return sum + (goal.current_amount / goal.target_amount * 100);
    }, 0);
    
    return totalProgress / goals.length;
  }

  getTopSpendingCategory(expenses) {
    const categoryTotals = this.calculateCategoryTotals(expenses);
    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];
    
    return topCategory ? { category: topCategory[0], amount: topCategory[1] } : { category: 'N/A', amount: 0 };
  }

  calculateCategoryTotals(expenses) {
    return expenses.reduce((totals, expense) => {
      const category = expense.category;
      totals[category] = (totals[category] || 0) + parseFloat(expense.amount);
      return totals;
    }, {});
  }

  countLimitsExceeded(expenses, limits) {
    const categoryTotals = this.calculateCategoryTotals(expenses);
    return limits.filter(limit => (categoryTotals[limit.category] || 0) > limit.amount).length;
  }

  assessFinancialHealth(financialData) {
    const savingsRate = this.calculateSavingsRate(financialData);
    const budgetAdherence = this.calculateBudgetAdherence(financialData);
    
    if (savingsRate > 15 && budgetAdherence > 80) return 'Excelente';
    if (savingsRate > 10 && budgetAdherence > 70) return 'Buena';
    if (savingsRate > 5 && budgetAdherence > 60) return 'Regular';
    return 'Necesita mejoras';
  }

  identifyOpportunities(financialData) {
    const opportunities = [];
    
    if (this.calculateSavingsRate(financialData) < 10) {
      opportunities.push('Aumentar ahorro');
    }
    
    if (this.countLimitsExceeded(financialData.expenses || [], financialData.limits || []) > 0) {
      opportunities.push('Control de gastos');
    }
    
    if ((financialData.goals || []).length === 0) {
      opportunities.push('Establecer objetivos');
    }
    
    return opportunities.length > 0 ? opportunities : ['Mantener disciplina actual'];
  }

  defineMilestones(financialData) {
    return [
      {
        milestone: 'Primera semana sin superar límites',
        reward: 'Celebra con una actividad gratuita que disfrutes'
      },
      {
        milestone: 'Primer mes con tasa de ahorro >10%',
        reward: 'Comparte tu logro y date un pequeño gusto'
      },
      {
        milestone: 'Primer objetivo de ahorro completado',
        reward: 'Celebra este gran logro y establece el siguiente objetivo'
      }
    ];
  }
}