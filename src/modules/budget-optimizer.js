/**
 * Budget Optimizer Module - Phase 2 & 3 Preparation
 * Advanced budget optimization and recommendation engine
 */

export class BudgetOptimizer {
  constructor() {
    this.optimizationRules = new Map();
    this.userPreferences = new Map();
    this.historicalPerformance = new Map();
    this.initializeOptimizationRules();
  }

  initializeOptimizationRules() {
    // Phase 2: Basic optimization rules
    this.optimizationRules.set('overspending_reduction', {
      priority: 'high',
      condition: (category, spent, limit) => spent > limit,
      action: (category, overage) => ({
        type: 'reduce_limit',
        category,
        suggestion: `Reduce gastos en ${category} por $${overage.toFixed(2)}`,
        impact: 'immediate'
      })
    });

    this.optimizationRules.set('underutilized_budget', {
      priority: 'medium',
      condition: (category, spent, limit) => spent < limit * 0.7,
      action: (category, unused) => ({
        type: 'reallocate_budget',
        category,
        suggestion: `Considera reasignar $${unused.toFixed(2)} de ${category} a otras categorías`,
        impact: 'optimization'
      })
    });

    this.optimizationRules.set('seasonal_adjustment', {
      priority: 'low',
      condition: (category, currentMonth, historicalData) => this.hasSeasonalPattern(category, historicalData),
      action: (category, adjustment) => ({
        type: 'seasonal_adjust',
        category,
        suggestion: `Ajustar presupuesto de ${category} según patrón estacional`,
        impact: 'predictive'
      })
    });
  }

  /**
   * PHASE 2: Predictive Budget Optimization
   * Analyzes current spending and predicts optimal budget allocation
   */
  async optimizeBudgetAllocation(currentExpenses, currentLimits, historicalData = []) {
    console.log('🔮 Starting budget optimization analysis...');
    
    const analysis = {
      current_performance: this.analyzeCurrentPerformance(currentExpenses, currentLimits),
      optimization_opportunities: [],
      recommended_adjustments: [],
      predicted_savings: 0,
      confidence_score: 0
    };

    // Analyze each category for optimization opportunities
    const categoryTotals = this.calculateCategoryTotals(currentExpenses);
    
    for (const limit of currentLimits) {
      const spent = categoryTotals[limit.category] || 0;
      const utilization = spent / limit.amount;
      
      // Apply optimization rules
      const opportunities = this.applyOptimizationRules(limit.category, spent, limit.amount, historicalData);
      analysis.optimization_opportunities.push(...opportunities);
      
      // Generate specific recommendations
      const recommendations = this.generateCategoryRecommendations(limit.category, spent, limit.amount, utilization, historicalData);
      analysis.recommended_adjustments.push(...recommendations);
    }

    // Calculate predicted savings and confidence
    analysis.predicted_savings = this.calculatePredictedSavings(analysis.recommended_adjustments);
    analysis.confidence_score = this.calculateConfidenceScore(analysis, historicalData);

    console.log('✅ Budget optimization completed:', analysis);
    return analysis;
  }

  analyzeCurrentPerformance(expenses, limits) {
    const categoryTotals = this.calculateCategoryTotals(expenses);
    const performance = {
      total_spent: expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0),
      categories_over_budget: 0,
      categories_under_budget: 0,
      average_utilization: 0,
      efficiency_score: 0
    };

    let totalUtilization = 0;
    let categoriesAnalyzed = 0;

    limits.forEach(limit => {
      const spent = categoryTotals[limit.category] || 0;
      const utilization = spent / limit.amount;
      
      if (utilization > 1) {
        performance.categories_over_budget++;
      } else if (utilization < 0.8) {
        performance.categories_under_budget++;
      }
      
      totalUtilization += utilization;
      categoriesAnalyzed++;
    });

    performance.average_utilization = categoriesAnalyzed > 0 ? totalUtilization / categoriesAnalyzed : 0;
    performance.efficiency_score = this.calculateEfficiencyScore(performance);

    return performance;
  }

  applyOptimizationRules(category, spent, limit, historicalData) {
    const opportunities = [];
    
    this.optimizationRules.forEach((rule, ruleName) => {
      if (rule.condition(category, spent, limit)) {
        const opportunity = rule.action(category, Math.abs(spent - limit));
        opportunity.rule = ruleName;
        opportunity.priority = rule.priority;
        opportunities.push(opportunity);
      }
    });

    return opportunities;
  }

  generateCategoryRecommendations(category, spent, limit, utilization, historicalData) {
    const recommendations = [];
    
    if (utilization > 1.1) {
      // Significantly over budget
      recommendations.push({
        category,
        type: 'reduce_spending',
        priority: 'high',
        current_amount: limit,
        suggested_amount: spent * 1.1, // 10% buffer above current spending
        reasoning: `Gastos actuales superan el límite por $${(spent - limit).toFixed(2)}`,
        expected_impact: 'immediate_relief'
      });
    } else if (utilization > 0.9) {
      // Close to limit
      recommendations.push({
        category,
        type: 'monitor_closely',
        priority: 'medium',
        current_amount: limit,
        suggested_amount: limit,
        reasoning: 'Categoría cerca del límite, monitorear de cerca',
        expected_impact: 'prevention'
      });
    } else if (utilization < 0.6) {
      // Significantly under budget
      const unusedAmount = limit - spent;
      recommendations.push({
        category,
        type: 'reallocate_budget',
        priority: 'low',
        current_amount: limit,
        suggested_amount: spent * 1.2, // 20% buffer above current spending
        reasoning: `$${unusedAmount.toFixed(2)} sin utilizar, considerar reasignación`,
        expected_impact: 'optimization',
        reallocation_amount: unusedAmount * 0.7 // Keep 30% as buffer
      });
    }

    // Historical trend analysis
    if (historicalData.length >= 3) {
      const trendRecommendation = this.analyzeTrendRecommendation(category, spent, historicalData);
      if (trendRecommendation) {
        recommendations.push(trendRecommendation);
      }
    }

    return recommendations;
  }

  analyzeTrendRecommendation(category, currentSpent, historicalData) {
    const categoryHistory = historicalData
      .map(month => month.categories?.[category] || 0)
      .filter(amount => amount > 0);

    if (categoryHistory.length < 2) return null;

    const average = categoryHistory.reduce((sum, amount) => sum + amount, 0) / categoryHistory.length;
    const trend = this.calculateTrend(categoryHistory);
    
    if (trend > 0.1) {
      // Increasing trend
      return {
        category,
        type: 'trend_adjustment',
        priority: 'medium',
        current_amount: currentSpent,
        suggested_amount: average * 1.15, // 15% increase based on trend
        reasoning: `Tendencia creciente detectada (+${(trend * 100).toFixed(1)}% mensual)`,
        expected_impact: 'trend_accommodation'
      };
    } else if (trend < -0.1) {
      // Decreasing trend
      return {
        category,
        type: 'trend_adjustment',
        priority: 'low',
        current_amount: currentSpent,
        suggested_amount: average * 0.9, // 10% decrease based on trend
        reasoning: `Tendencia decreciente detectada (${(trend * 100).toFixed(1)}% mensual)`,
        expected_impact: 'trend_optimization'
      };
    }

    return null;
  }

  /**
   * PHASE 2: Smart Rebalancing Algorithm
   * Automatically suggests budget rebalancing based on spending patterns
   */
  async suggestBudgetRebalancing(currentLimits, expenses, goals = []) {
    console.log('⚖️ Calculating optimal budget rebalancing...');
    
    const categoryTotals = this.calculateCategoryTotals(expenses);
    const totalBudget = currentLimits.reduce((sum, limit) => sum + limit.amount, 0);
    const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    
    const rebalancing = {
      current_allocation: {},
      suggested_allocation: {},
      rebalancing_moves: [],
      expected_improvement: 0,
      risk_assessment: 'low'
    };

    // Current allocation analysis
    currentLimits.forEach(limit => {
      const spent = categoryTotals[limit.category] || 0;
      rebalancing.current_allocation[limit.category] = {
        budgeted: limit.amount,
        spent: spent,
        utilization: spent / limit.amount,
        efficiency: this.calculateCategoryEfficiency(spent, limit.amount)
      };
    });

    // Calculate optimal allocation using weighted scoring
    const optimalAllocation = this.calculateOptimalAllocation(
      currentLimits, 
      categoryTotals, 
      totalBudget,
      goals
    );

    rebalancing.suggested_allocation = optimalAllocation;

    // Generate rebalancing moves
    rebalancing.rebalancing_moves = this.generateRebalancingMoves(
      rebalancing.current_allocation,
      rebalancing.suggested_allocation
    );

    // Calculate expected improvement
    rebalancing.expected_improvement = this.calculateRebalancingImprovement(
      rebalancing.current_allocation,
      rebalancing.suggested_allocation
    );

    // Assess risk
    rebalancing.risk_assessment = this.assessRebalancingRisk(rebalancing.rebalancing_moves);

    console.log('✅ Budget rebalancing suggestions generated:', rebalancing);
    return rebalancing;
  }

  calculateOptimalAllocation(currentLimits, categoryTotals, totalBudget, goals) {
    const allocation = {};
    const categories = currentLimits.map(limit => limit.category);
    
    // Base allocation on historical spending with adjustments
    categories.forEach(category => {
      const currentSpent = categoryTotals[category] || 0;
      const currentLimit = currentLimits.find(l => l.category === category)?.amount || 0;
      
      // Calculate base allocation (weighted average of spending and current limit)
      const baseAllocation = (currentSpent * 0.7) + (currentLimit * 0.3);
      
      // Apply category-specific adjustments
      const adjustmentFactor = this.getCategoryAdjustmentFactor(category, goals);
      const suggestedAmount = baseAllocation * adjustmentFactor;
      
      allocation[category] = {
        budgeted: Math.max(suggestedAmount, currentSpent * 1.1), // At least 10% above current spending
        reasoning: this.getReallocationReasoning(category, currentSpent, currentLimit, adjustmentFactor),
        confidence: this.calculateAllocationConfidence(category, currentSpent, currentLimit)
      };
    });

    // Normalize to total budget
    const totalSuggested = Object.values(allocation).reduce((sum, cat) => sum + cat.budgeted, 0);
    if (totalSuggested !== totalBudget) {
      const scaleFactor = totalBudget / totalSuggested;
      Object.keys(allocation).forEach(category => {
        allocation[category].budgeted *= scaleFactor;
      });
    }

    return allocation;
  }

  generateRebalancingMoves(currentAllocation, suggestedAllocation) {
    const moves = [];
    
    Object.keys(currentAllocation).forEach(category => {
      const current = currentAllocation[category].budgeted;
      const suggested = suggestedAllocation[category].budgeted;
      const difference = suggested - current;
      
      if (Math.abs(difference) > current * 0.05) { // Only suggest moves > 5% of current budget
        moves.push({
          category,
          current_budget: current,
          suggested_budget: suggested,
          change_amount: difference,
          change_percentage: (difference / current) * 100,
          reasoning: suggestedAllocation[category].reasoning,
          priority: Math.abs(difference) > current * 0.2 ? 'high' : 'medium'
        });
      }
    });

    return moves.sort((a, b) => Math.abs(b.change_amount) - Math.abs(a.change_amount));
  }

  /**
   * PHASE 3: Scenario Simulation
   * Simulates different budget scenarios and their outcomes
   */
  async simulateBudgetScenarios(baseData, scenarios = []) {
    console.log('🎭 Running budget scenario simulations...');
    
    const results = {
      base_scenario: this.analyzeScenario('current', baseData),
      scenario_results: [],
      best_scenario: null,
      risk_analysis: {}
    };

    // Default scenarios if none provided
    if (scenarios.length === 0) {
      scenarios = this.generateDefaultScenarios(baseData);
    }

    // Simulate each scenario
    for (const scenario of scenarios) {
      const result = await this.simulateScenario(scenario, baseData);
      results.scenario_results.push(result);
    }

    // Find best scenario
    results.best_scenario = this.findBestScenario(results.scenario_results);
    
    // Risk analysis
    results.risk_analysis = this.performRiskAnalysis(results.scenario_results);

    console.log('✅ Scenario simulations completed:', results);
    return results;
  }

  generateDefaultScenarios(baseData) {
    const totalBudget = baseData.limits.reduce((sum, limit) => sum + limit.amount, 0);
    
    return [
      {
        name: 'Conservative',
        description: 'Reduce all limits by 10%',
        adjustments: baseData.limits.map(limit => ({
          category: limit.category,
          new_amount: limit.amount * 0.9,
          change_type: 'reduce'
        }))
      },
      {
        name: 'Aggressive Savings',
        description: 'Reduce non-essential spending by 20%',
        adjustments: baseData.limits.map(limit => ({
          category: limit.category,
          new_amount: this.isEssentialCategory(limit.category) ? limit.amount : limit.amount * 0.8,
          change_type: this.isEssentialCategory(limit.category) ? 'maintain' : 'reduce'
        }))
      },
      {
        name: 'Balanced Growth',
        description: 'Increase essential categories, reduce discretionary',
        adjustments: baseData.limits.map(limit => ({
          category: limit.category,
          new_amount: this.isEssentialCategory(limit.category) ? limit.amount * 1.1 : limit.amount * 0.95,
          change_type: this.isEssentialCategory(limit.category) ? 'increase' : 'reduce'
        }))
      }
    ];
  }

  async simulateScenario(scenario, baseData) {
    const simulation = {
      name: scenario.name,
      description: scenario.description,
      projected_outcomes: {},
      success_probability: 0,
      potential_savings: 0,
      risk_factors: [],
      implementation_difficulty: 'medium'
    };

    // Apply scenario adjustments
    const adjustedLimits = this.applyScenarioAdjustments(baseData.limits, scenario.adjustments);
    
    // Project outcomes based on historical patterns
    simulation.projected_outcomes = this.projectScenarioOutcomes(adjustedLimits, baseData.expenses, baseData.historical);
    
    // Calculate success probability
    simulation.success_probability = this.calculateScenarioSuccessProbability(adjustedLimits, baseData);
    
    // Calculate potential savings
    simulation.potential_savings = this.calculateScenarioSavings(baseData.limits, adjustedLimits);
    
    // Identify risk factors
    simulation.risk_factors = this.identifyScenarioRisks(scenario, baseData);
    
    // Assess implementation difficulty
    simulation.implementation_difficulty = this.assessImplementationDifficulty(scenario.adjustments);

    return simulation;
  }

  // Utility methods
  calculateCategoryTotals(expenses) {
    return expenses.reduce((totals, expense) => {
      const category = expense.category;
      totals[category] = (totals[category] || 0) + parseFloat(expense.amount);
      return totals;
    }, {});
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const average = sumY / n;
    
    return slope / average; // Normalized trend
  }

  calculateEfficiencyScore(performance) {
    // Efficiency based on budget utilization and balance
    const utilizationScore = Math.max(0, 100 - Math.abs(performance.average_utilization - 0.85) * 100);
    const balanceScore = Math.max(0, 100 - (performance.categories_over_budget * 20));
    
    return (utilizationScore + balanceScore) / 2;
  }

  calculateCategoryEfficiency(spent, budgeted) {
    const utilization = spent / budgeted;
    if (utilization > 1) return Math.max(0, 100 - ((utilization - 1) * 100));
    if (utilization < 0.5) return utilization * 100;
    return 100 - Math.abs(utilization - 0.85) * 100;
  }

  getCategoryAdjustmentFactor(category, goals) {
    // Adjust based on category importance and user goals
    const essentialCategories = ['Salud', 'Supermercado', 'Servicios'];
    const discretionaryCategories = ['Ocio', 'Otros'];
    
    if (essentialCategories.includes(category)) return 1.05; // 5% increase
    if (discretionaryCategories.includes(category)) return 0.95; // 5% decrease
    
    return 1.0; // No adjustment
  }

  getReallocationReasoning(category, spent, limit, adjustmentFactor) {
    if (adjustmentFactor > 1) {
      return `Categoría esencial, incremento recomendado para mayor seguridad`;
    } else if (adjustmentFactor < 1) {
      return `Categoría discrecional, reducción para optimizar presupuesto`;
    } else if (spent > limit) {
      return `Ajuste basado en gasto real superior al límite actual`;
    } else if (spent < limit * 0.7) {
      return `Reducción por subutilización del presupuesto asignado`;
    }
    return `Mantener asignación actual con ajustes menores`;
  }

  calculateAllocationConfidence(category, spent, limit) {
    const utilization = spent / limit;
    if (utilization >= 0.7 && utilization <= 1.1) return 'high';
    if (utilization >= 0.5 && utilization <= 1.3) return 'medium';
    return 'low';
  }

  calculatePredictedSavings(recommendations) {
    return recommendations
      .filter(rec => rec.type === 'reallocate_budget')
      .reduce((sum, rec) => sum + (rec.reallocation_amount || 0), 0);
  }

  calculateConfidenceScore(analysis, historicalData) {
    let score = 0.5; // Base confidence
    
    // Increase confidence with more historical data
    if (historicalData.length >= 6) score += 0.2;
    else if (historicalData.length >= 3) score += 0.1;
    
    // Increase confidence with consistent patterns
    if (analysis.current_performance.efficiency_score > 70) score += 0.2;
    
    // Decrease confidence with high volatility
    if (analysis.current_performance.categories_over_budget > 2) score -= 0.2;
    
    return Math.max(0, Math.min(1, score));
  }

  hasSeasonalPattern(category, historicalData) {
    // Simplified seasonal pattern detection
    if (historicalData.length < 6) return false;
    
    const categoryData = historicalData.map(month => month.categories?.[category] || 0);
    const variance = this.calculateVariance(categoryData);
    const mean = categoryData.reduce((sum, val) => sum + val, 0) / categoryData.length;
    
    return variance > mean * 0.3; // High variance indicates potential seasonality
  }

  calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  isEssentialCategory(category) {
    const essentialCategories = ['Salud', 'Supermercado', 'Servicios', 'Transporte'];
    return essentialCategories.includes(category);
  }

  // Additional utility methods for Phase 3 scenarios
  applyScenarioAdjustments(baseLimits, adjustments) {
    return baseLimits.map(limit => {
      const adjustment = adjustments.find(adj => adj.category === limit.category);
      return adjustment ? { ...limit, amount: adjustment.new_amount } : limit;
    });
  }

  projectScenarioOutcomes(adjustedLimits, currentExpenses, historicalData) {
    // Simplified projection based on current patterns
    const categoryTotals = this.calculateCategoryTotals(currentExpenses);
    
    return {
      projected_adherence: adjustedLimits.map(limit => ({
        category: limit.category,
        limit: limit.amount,
        projected_spending: categoryTotals[limit.category] || 0,
        adherence_probability: this.calculateAdherenceProbability(limit.category, limit.amount, categoryTotals[limit.category] || 0)
      })),
      overall_success_rate: 0.75 // Placeholder
    };
  }

  calculateScenarioSuccessProbability(adjustedLimits, baseData) {
    // Simplified success probability calculation
    const categoryTotals = this.calculateCategoryTotals(baseData.expenses);
    let totalProbability = 0;
    
    adjustedLimits.forEach(limit => {
      const currentSpending = categoryTotals[limit.category] || 0;
      const probability = this.calculateAdherenceProbability(limit.category, limit.amount, currentSpending);
      totalProbability += probability;
    });
    
    return totalProbability / adjustedLimits.length;
  }

  calculateAdherenceProbability(category, newLimit, currentSpending) {
    if (currentSpending === 0) return 0.8; // High probability for unused categories
    
    const ratio = newLimit / currentSpending;
    if (ratio >= 1.2) return 0.9; // Easy to adhere
    if (ratio >= 1.0) return 0.8; // Manageable
    if (ratio >= 0.8) return 0.6; // Challenging
    return 0.3; // Very difficult
  }

  calculateScenarioSavings(baseLimits, adjustedLimits) {
    const baseBudget = baseLimits.reduce((sum, limit) => sum + limit.amount, 0);
    const adjustedBudget = adjustedLimits.reduce((sum, limit) => sum + limit.amount, 0);
    return baseBudget - adjustedBudget;
  }

  identifyScenarioRisks(scenario, baseData) {
    const risks = [];
    
    scenario.adjustments.forEach(adjustment => {
      if (adjustment.change_type === 'reduce' && adjustment.new_amount < adjustment.current_amount * 0.8) {
        risks.push({
          category: adjustment.category,
          risk: 'aggressive_reduction',
          description: `Reducción del ${((1 - adjustment.new_amount / adjustment.current_amount) * 100).toFixed(1)}% puede ser difícil de mantener`
        });
      }
    });
    
    return risks;
  }

  assessImplementationDifficulty(adjustments) {
    const significantChanges = adjustments.filter(adj => 
      Math.abs(adj.new_amount - adj.current_amount) > adj.current_amount * 0.15
    ).length;
    
    if (significantChanges > adjustments.length * 0.5) return 'hard';
    if (significantChanges > adjustments.length * 0.25) return 'medium';
    return 'easy';
  }

  findBestScenario(scenarios) {
    return scenarios.reduce((best, current) => {
      const bestScore = (best.success_probability * 0.4) + (best.potential_savings / 1000 * 0.3) + (best.risk_factors.length === 0 ? 0.3 : 0);
      const currentScore = (current.success_probability * 0.4) + (current.potential_savings / 1000 * 0.3) + (current.risk_factors.length === 0 ? 0.3 : 0);
      
      return currentScore > bestScore ? current : best;
    });
  }

  performRiskAnalysis(scenarios) {
    const allRisks = scenarios.flatMap(scenario => scenario.risk_factors);
    const riskCategories = {};
    
    allRisks.forEach(risk => {
      if (!riskCategories[risk.risk]) {
        riskCategories[risk.risk] = 0;
      }
      riskCategories[risk.risk]++;
    });
    
    return {
      total_risks: allRisks.length,
      risk_categories: riskCategories,
      overall_risk_level: allRisks.length > 5 ? 'high' : allRisks.length > 2 ? 'medium' : 'low'
    };
  }

  calculateRebalancingImprovement(currentAllocation, suggestedAllocation) {
    let improvement = 0;
    
    Object.keys(currentAllocation).forEach(category => {
      const currentEfficiency = currentAllocation[category].efficiency;
      const suggestedUtilization = suggestedAllocation[category].budgeted > 0 
        ? currentAllocation[category].spent / suggestedAllocation[category].budgeted 
        : 0;
      const suggestedEfficiency = this.calculateCategoryEfficiency(currentAllocation[category].spent, suggestedAllocation[category].budgeted);
      
      improvement += suggestedEfficiency - currentEfficiency;
    });
    
    return improvement / Object.keys(currentAllocation).length;
  }

  assessRebalancingRisk(moves) {
    const highRiskMoves = moves.filter(move => Math.abs(move.change_percentage) > 25).length;
    const totalMoves = moves.length;
    
    if (highRiskMoves > totalMoves * 0.5) return 'high';
    if (highRiskMoves > 0) return 'medium';
    return 'low';
  }
}