export class ReportManager {
  constructor() {
    this.aiAnalysisCache = new Map();
  }

  async generate(data) {
    const container = document.getElementById('report-content');
    container.innerHTML = '';

    // Show loading state
    this.showLoadingState(container);

    try {
      // Generate AI analysis
      const aiAnalysis = await this.generateAIAnalysis(data);
      
      // Clear loading and show content
      container.innerHTML = '';
      
      // Executive Summary with AI insights
      const executiveSummary = this.createExecutiveSummary(data, aiAnalysis);
      container.appendChild(executiveSummary);

      // Financial Health Score
      const healthScore = this.createHealthScoreSection(data, aiAnalysis);
      container.appendChild(healthScore);

      // Detailed Analysis Sections
      const summarySection = this.createSection('📊 Resumen Financiero', [
        { label: 'Ingresos Totales', value: this.formatCurrency(data.balance.totalIncome), trend: this.calculateIncomeTrend(data) },
        { label: 'Gastos Totales', value: this.formatCurrency(data.balance.totalExpenses), trend: this.calculateExpenseTrend(data) },
        { label: 'Balance Disponible', value: this.formatCurrency(data.balance.available), trend: this.calculateBalanceTrend(data) },
        { label: 'Tasa de Ahorro', value: this.calculateSavingsRate(data) + '%', trend: 'neutral' },
        { label: 'Cuotas Activas', value: data.balance.installments, trend: 'neutral' }
      ]);
      container.appendChild(summarySection);

      // Category Analysis with AI insights
      const categorySection = this.createAdvancedCategorySection('💳 Análisis por Categorías', data.byCategory, data, aiAnalysis);
      container.appendChild(categorySection);

      // Spending Patterns Analysis
      const patternsSection = this.createSpendingPatternsSection(data, aiAnalysis);
      container.appendChild(patternsSection);

      // AI Recommendations
      const aiRecommendationsSection = this.createAIRecommendationsSection(aiAnalysis);
      container.appendChild(aiRecommendationsSection);

      // Goals Progress
      if (data.goals && data.goals.length > 0) {
        const goalsSection = this.createGoalsProgressSection(data.goals);
        container.appendChild(goalsSection);
      }

      // Installments Analysis
      if (data.installments && data.installments.length > 0) {
        const installmentsSection = this.createInstallmentsSection(data.installments);
        container.appendChild(installmentsSection);
      }

      // Extra Income Analysis
      if (data.extraIncomes && data.extraIncomes.length > 0) {
        const extraIncomeSection = this.createExtraIncomeSection(data.extraIncomes);
        container.appendChild(extraIncomeSection);
      }

      // Future Projections
      const projectionsSection = this.createProjectionsSection(data, aiAnalysis);
      container.appendChild(projectionsSection);

      // Action Items
      const actionItemsSection = this.createActionItemsSection(aiAnalysis);
      container.appendChild(actionItemsSection);

    } catch (error) {
      console.error('Error generating AI analysis:', error);
      container.innerHTML = '';
      this.generateFallbackReport(data, container);
    }

    // Setup download functionality
    this.setupDownload(data);
  }

  showLoadingState(container) {
    container.innerHTML = `
      <div class="report-loading">
        <div class="loading-spinner"></div>
        <h3>🤖 Generando análisis inteligente...</h3>
        <p>Nuestro asistente de IA está analizando tus datos financieros para crear un informe personalizado.</p>
      </div>
    `;
  }

  async generateAIAnalysis(data) {
    const cacheKey = this.generateCacheKey(data);
    
    // Check cache first
    if (this.aiAnalysisCache.has(cacheKey)) {
      return this.aiAnalysisCache.get(cacheKey);
    }

    try {
      // Prepare data for AI analysis
      const analysisPrompt = this.buildAnalysisPrompt(data);
      
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: analysisPrompt }),
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const aiResponse = await response.json();
      const analysis = this.parseAIResponse(aiResponse.reply, data);
      
      // Cache the result
      this.aiAnalysisCache.set(cacheKey, analysis);
      
      return analysis;
    } catch (error) {
      console.error('AI Analysis error:', error);
      return this.generateFallbackAnalysis(data);
    }
  }

  buildAnalysisPrompt(data) {
    const totalIncome = data.balance.totalIncome;
    const totalExpenses = data.balance.totalExpenses;
    const savingsRate = this.calculateSavingsRate(data);
    const topCategories = Object.entries(data.byCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([cat, amount]) => `${cat}: ${this.formatCurrency(amount)}`);

    return `Analiza estos datos financieros y proporciona insights específicos:

DATOS FINANCIEROS:
- Ingresos: ${this.formatCurrency(totalIncome)}
- Gastos: ${this.formatCurrency(totalExpenses)}
- Balance: ${this.formatCurrency(data.balance.available)}
- Tasa de ahorro: ${savingsRate}%
- Cuotas activas: ${data.balance.installments}

PRINCIPALES CATEGORÍAS DE GASTO:
${topCategories.join('\n')}

INGRESOS EXTRA: ${data.extraIncomes?.length || 0} registros

Por favor proporciona:
1. Una evaluación de la salud financiera (puntaje del 1-100)
2. 3 fortalezas principales
3. 3 áreas de mejora específicas
4. 5 recomendaciones accionables y personalizadas
5. Predicción de tendencia para el próximo mes
6. Nivel de riesgo financiero (Bajo/Medio/Alto)

Responde en formato estructurado y en español, siendo específico y práctico.`;
  }

  parseAIResponse(aiReply, data) {
    // Parse AI response and extract structured data
    const analysis = {
      healthScore: this.extractHealthScore(aiReply) || this.calculateHealthScore(data),
      strengths: this.extractListItems(aiReply, 'fortalezas') || this.generateFallbackStrengths(data),
      improvements: this.extractListItems(aiReply, 'mejora') || this.generateFallbackImprovements(data),
      recommendations: this.extractListItems(aiReply, 'recomendaciones') || this.generateFallbackRecommendations(data),
      trend: this.extractTrend(aiReply) || 'estable',
      riskLevel: this.extractRiskLevel(aiReply) || this.calculateRiskLevel(data),
      summary: this.extractSummary(aiReply) || this.generateFallbackSummary(data),
      rawResponse: aiReply
    };

    return analysis;
  }

  extractHealthScore(text) {
    const scoreMatch = text.match(/(?:puntaje|score|puntuación).*?(\d{1,3})/i);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1]);
      return Math.min(Math.max(score, 0), 100);
    }
    return null;
  }

  extractListItems(text, keyword) {
    const regex = new RegExp(`${keyword}[^:]*:([^\\n]*(?:\\n(?!\\d+\\.|[A-Z]).*)*)`,'i');
    const match = text.match(regex);
    if (match) {
      return match[1]
        .split(/\d+\.|\n-|\n•/)
        .map(item => item.trim())
        .filter(item => item.length > 10)
        .slice(0, 5);
    }
    return null;
  }

  extractTrend(text) {
    if (/positiv|mejora|crec/i.test(text)) return 'positiva';
    if (/negativ|declin|baj/i.test(text)) return 'negativa';
    return 'estable';
  }

  extractRiskLevel(text) {
    if (/alto|elevado|crítico/i.test(text)) return 'Alto';
    if (/medio|moderado/i.test(text)) return 'Medio';
    return 'Bajo';
  }

  extractSummary(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 2).join('. ') + '.';
  }

  calculateHealthScore(data) {
    let score = 50; // Base score
    
    const savingsRate = this.calculateSavingsRate(data);
    
    // Savings rate impact (40 points max)
    if (savingsRate >= 20) score += 40;
    else if (savingsRate >= 10) score += 30;
    else if (savingsRate >= 5) score += 20;
    else if (savingsRate > 0) score += 10;
    else score -= 20;
    
    // Income vs expenses balance (30 points max)
    if (data.balance.available > 0) {
      const ratio = data.balance.available / data.balance.totalIncome;
      score += Math.min(ratio * 100, 30);
    } else {
      score -= 30;
    }
    
    // Diversification bonus (20 points max)
    const categoryCount = Object.keys(data.byCategory).length;
    score += Math.min(categoryCount * 3, 20);
    
    return Math.min(Math.max(Math.round(score), 0), 100);
  }

  calculateSavingsRate(data) {
    if (data.balance.totalIncome === 0) return 0;
    return Math.round((data.balance.available / data.balance.totalIncome) * 100);
  }

  calculateRiskLevel(data) {
    const savingsRate = this.calculateSavingsRate(data);
    if (savingsRate < 0) return 'Alto';
    if (savingsRate < 10) return 'Medio';
    return 'Bajo';
  }

  generateFallbackAnalysis(data) {
    return {
      healthScore: this.calculateHealthScore(data),
      strengths: this.generateFallbackStrengths(data),
      improvements: this.generateFallbackImprovements(data),
      recommendations: this.generateFallbackRecommendations(data),
      trend: 'estable',
      riskLevel: this.calculateRiskLevel(data),
      summary: this.generateFallbackSummary(data)
    };
  }

  generateFallbackStrengths(data) {
    const strengths = [];
    const savingsRate = this.calculateSavingsRate(data);
    
    if (savingsRate > 0) {
      strengths.push(`Mantienes un balance positivo con ${savingsRate}% de tasa de ahorro`);
    }
    if (Object.keys(data.byCategory).length >= 4) {
      strengths.push('Tienes gastos diversificados en múltiples categorías');
    }
    if (data.extraIncomes?.length > 0) {
      strengths.push('Generas ingresos adicionales fuera de tu ingreso fijo');
    }
    
    return strengths.length > 0 ? strengths : ['Estás registrando tus gastos de manera consistente'];
  }

  generateFallbackImprovements(data) {
    const improvements = [];
    const savingsRate = this.calculateSavingsRate(data);
    
    if (savingsRate < 10) {
      improvements.push('Incrementar la tasa de ahorro mensual');
    }
    
    const topCategory = Object.entries(data.byCategory)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory && (topCategory[1] / data.balance.totalExpenses) > 0.4) {
      improvements.push(`Reducir gastos en ${topCategory[0]} que representa un alto porcentaje`);
    }
    
    if (data.balance.installments > 3) {
      improvements.push('Considerar reducir el número de cuotas activas');
    }
    
    return improvements.length > 0 ? improvements : ['Establecer objetivos de ahorro específicos'];
  }

  generateFallbackRecommendations(data) {
    return [
      'Establece un presupuesto mensual para cada categoría de gasto',
      'Considera crear un fondo de emergencia equivalente a 3-6 meses de gastos',
      'Revisa y optimiza tus gastos recurrentes mensualmente',
      'Busca oportunidades para generar ingresos adicionales',
      'Automatiza tus ahorros para alcanzar tus objetivos más rápido'
    ];
  }

  generateFallbackSummary(data) {
    const savingsRate = this.calculateSavingsRate(data);
    return `Tu situación financiera muestra una tasa de ahorro del ${savingsRate}%. ${savingsRate > 0 ? 'Mantén este buen hábito' : 'Considera ajustar tus gastos'} para mejorar tu estabilidad financiera.`;
  }

  createExecutiveSummary(data, aiAnalysis) {
    const section = document.createElement('div');
    section.className = 'report-section executive-summary';
    
    section.innerHTML = `
      <div class="executive-header">
        <h2>🎯 Resumen Ejecutivo</h2>
        <div class="report-date">${new Date().toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</div>
      </div>
      
      <div class="executive-content">
        <div class="executive-summary-text">
          <p>${aiAnalysis.summary}</p>
        </div>
        
        <div class="key-metrics">
          <div class="metric-card">
            <div class="metric-icon">💰</div>
            <div class="metric-content">
              <div class="metric-label">Balance Disponible</div>
              <div class="metric-value ${data.balance.available >= 0 ? 'positive' : 'negative'}">
                ${this.formatCurrency(data.balance.available)}
              </div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">📈</div>
            <div class="metric-content">
              <div class="metric-label">Tasa de Ahorro</div>
              <div class="metric-value">${this.calculateSavingsRate(data)}%</div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">⚡</div>
            <div class="metric-content">
              <div class="metric-label">Tendencia</div>
              <div class="metric-value trend-${aiAnalysis.trend}">${aiAnalysis.trend}</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    return section;
  }

  createHealthScoreSection(data, aiAnalysis) {
    const section = document.createElement('div');
    section.className = 'report-section health-score-section';
    
    const scoreColor = this.getScoreColor(aiAnalysis.healthScore);
    const scoreLevel = this.getScoreLevel(aiAnalysis.healthScore);
    
    section.innerHTML = `
      <h3>🏥 Salud Financiera</h3>
      
      <div class="health-score-container">
        <div class="health-score-circle">
          <div class="score-circle" style="--score: ${aiAnalysis.healthScore}; --color: ${scoreColor}">
            <div class="score-number">${aiAnalysis.healthScore}</div>
            <div class="score-label">${scoreLevel}</div>
          </div>
        </div>
        
        <div class="health-details">
          <div class="health-category">
            <h4>💪 Fortalezas</h4>
            <ul>
              ${aiAnalysis.strengths.map(strength => `<li>${strength}</li>`).join('')}
            </ul>
          </div>
          
          <div class="health-category">
            <h4>🎯 Áreas de Mejora</h4>
            <ul>
              ${aiAnalysis.improvements.map(improvement => `<li>${improvement}</li>`).join('')}
            </ul>
          </div>
          
          <div class="risk-indicator">
            <div class="risk-label">Nivel de Riesgo:</div>
            <div class="risk-badge risk-${aiAnalysis.riskLevel.toLowerCase()}">${aiAnalysis.riskLevel}</div>
          </div>
        </div>
      </div>
    `;
    
    return section;
  }

  createAdvancedCategorySection(title, categories, data, aiAnalysis) {
    const section = document.createElement('div');
    section.className = 'report-section category-analysis';
    
    const total = Object.values(categories).reduce((sum, amount) => sum + amount, 0);
    const sortedCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8); // Top 8 categories
    
    section.innerHTML = `
      <h3>${title}</h3>
      
      <div class="category-overview">
        <div class="category-stats">
          <div class="stat-item">
            <div class="stat-label">Categorías Activas</div>
            <div class="stat-value">${Object.keys(categories).length}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Gasto Promedio</div>
            <div class="stat-value">${this.formatCurrency(total / Object.keys(categories).length)}</div>
          </div>
        </div>
      </div>
      
      <div class="category-breakdown">
        ${sortedCategories.map(([category, amount]) => {
          const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
          const isHigh = percentage > 30;
          const isMedium = percentage > 15;
          
          return `
            <div class="category-item-detailed ${isHigh ? 'high-spending' : isMedium ? 'medium-spending' : ''}">
              <div class="category-header">
                <div class="category-name">${category}</div>
                <div class="category-amount">${this.formatCurrency(amount)}</div>
              </div>
              <div class="category-bar">
                <div class="category-fill" style="width: ${percentage}%"></div>
              </div>
              <div class="category-details">
                <span class="category-percentage">${percentage}% del total</span>
                ${isHigh ? '<span class="category-warning">⚠️ Alto gasto</span>' : ''}
                ${isMedium ? '<span class="category-info">ℹ️ Gasto moderado</span>' : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    return section;
  }

  createSpendingPatternsSection(data, aiAnalysis) {
    const section = document.createElement('div');
    section.className = 'report-section spending-patterns';
    
    const avgExpenseAmount = data.expenses.length > 0 
      ? data.balance.totalExpenses / data.expenses.length 
      : 0;
    
    const expenseFrequency = this.calculateExpenseFrequency(data.expenses);
    const topExpenses = data.expenses
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    section.innerHTML = `
      <h3>📊 Patrones de Gasto</h3>
      
      <div class="patterns-grid">
        <div class="pattern-card">
          <div class="pattern-icon">💳</div>
          <div class="pattern-content">
            <div class="pattern-label">Gasto Promedio</div>
            <div class="pattern-value">${this.formatCurrency(avgExpenseAmount)}</div>
          </div>
        </div>
        
        <div class="pattern-card">
          <div class="pattern-icon">📅</div>
          <div class="pattern-content">
            <div class="pattern-label">Frecuencia</div>
            <div class="pattern-value">${expenseFrequency} gastos/mes</div>
          </div>
        </div>
        
        <div class="pattern-card">
          <div class="pattern-icon">🎯</div>
          <div class="pattern-content">
            <div class="pattern-label">Gasto Más Alto</div>
            <div class="pattern-value">${topExpenses.length > 0 ? this.formatCurrency(topExpenses[0].amount) : '$0'}</div>
          </div>
        </div>
      </div>
      
      ${topExpenses.length > 0 ? `
        <div class="top-expenses">
          <h4>💰 Gastos Más Significativos</h4>
          <div class="expenses-list">
            ${topExpenses.map((expense, index) => `
              <div class="expense-item-report">
                <div class="expense-rank">#${index + 1}</div>
                <div class="expense-details">
                  <div class="expense-description">${expense.description}</div>
                  <div class="expense-category">${expense.category}</div>
                </div>
                <div class="expense-amount">${this.formatCurrency(expense.amount)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
    
    return section;
  }

  createAIRecommendationsSection(aiAnalysis) {
    const section = document.createElement('div');
    section.className = 'report-section ai-recommendations';
    
    section.innerHTML = `
      <h3>🤖 Recomendaciones Inteligentes</h3>
      
      <div class="recommendations-intro">
        <p>Basado en el análisis de tus patrones financieros, aquí tienes recomendaciones personalizadas:</p>
      </div>
      
      <div class="recommendations-list">
        ${aiAnalysis.recommendations.map((recommendation, index) => `
          <div class="recommendation-item">
            <div class="recommendation-number">${index + 1}</div>
            <div class="recommendation-content">
              <div class="recommendation-text">${recommendation}</div>
              <div class="recommendation-priority ${this.getRecommendationPriority(recommendation, index)}">
                ${this.getRecommendationPriorityText(recommendation, index)}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    return section;
  }

  createProjectionsSection(data, aiAnalysis) {
    const section = document.createElement('div');
    section.className = 'report-section projections';
    
    const currentSavings = data.balance.available;
    const monthlySavings = currentSavings > 0 ? currentSavings : 0;
    const projections = this.calculateProjections(data, monthlySavings);
    
    section.innerHTML = `
      <h3>🔮 Proyecciones Financieras</h3>
      
      <div class="projections-grid">
        <div class="projection-card">
          <div class="projection-period">3 Meses</div>
          <div class="projection-amount">${this.formatCurrency(projections.threeMonths)}</div>
          <div class="projection-label">Ahorro Proyectado</div>
        </div>
        
        <div class="projection-card">
          <div class="projection-period">6 Meses</div>
          <div class="projection-amount">${this.formatCurrency(projections.sixMonths)}</div>
          <div class="projection-label">Ahorro Proyectado</div>
        </div>
        
        <div class="projection-card">
          <div class="projection-period">1 Año</div>
          <div class="projection-amount">${this.formatCurrency(projections.oneYear)}</div>
          <div class="projection-label">Ahorro Proyectado</div>
        </div>
      </div>
      
      <div class="projection-insights">
        <div class="insight-item">
          <div class="insight-icon">📈</div>
          <div class="insight-text">
            Con tu tasa actual de ahorro, podrías acumular 
            <strong>${this.formatCurrency(projections.oneYear)}</strong> en un año
          </div>
        </div>
        
        <div class="insight-item">
          <div class="insight-icon">🎯</div>
          <div class="insight-text">
            Tendencia proyectada: <strong>${aiAnalysis.trend}</strong> 
            basada en tus patrones actuales
          </div>
        </div>
      </div>
    `;
    
    return section;
  }

  createActionItemsSection(aiAnalysis) {
    const section = document.createElement('div');
    section.className = 'report-section action-items';
    
    const actionItems = this.generateActionItems(aiAnalysis);
    
    section.innerHTML = `
      <h3>✅ Plan de Acción</h3>
      
      <div class="action-intro">
        <p>Pasos concretos que puedes tomar esta semana para mejorar tu situación financiera:</p>
      </div>
      
      <div class="action-items-list">
        ${actionItems.map((item, index) => `
          <div class="action-item">
            <div class="action-checkbox">
              <input type="checkbox" id="action-${index}" />
              <label for="action-${index}"></label>
            </div>
            <div class="action-content">
              <div class="action-title">${item.title}</div>
              <div class="action-description">${item.description}</div>
              <div class="action-timeline">${item.timeline}</div>
            </div>
            <div class="action-impact ${item.impact}">${item.impactText}</div>
          </div>
        `).join('')}
      </div>
    `;
    
    return section;
  }

  generateActionItems(aiAnalysis) {
    const baseActions = [
      {
        title: 'Revisar gastos de la categoría principal',
        description: 'Analiza los gastos de tu categoría con mayor gasto y busca oportunidades de optimización',
        timeline: 'Esta semana',
        impact: 'high',
        impactText: 'Alto impacto'
      },
      {
        title: 'Establecer límites por categoría',
        description: 'Define un presupuesto máximo para cada categoría de gasto',
        timeline: 'Próximos 3 días',
        impact: 'medium',
        impactText: 'Impacto medio'
      },
      {
        title: 'Automatizar ahorros',
        description: 'Configura una transferencia automática a tu cuenta de ahorros',
        timeline: 'Esta semana',
        impact: 'high',
        impactText: 'Alto impacto'
      },
      {
        title: 'Revisar suscripciones',
        description: 'Evalúa todas tus suscripciones y cancela las que no uses',
        timeline: 'Fin de semana',
        impact: 'medium',
        impactText: 'Impacto medio'
      }
    ];

    return baseActions;
  }

  // Utility methods
  calculateExpenseFrequency(expenses) {
    return expenses.length;
  }

  calculateProjections(data, monthlySavings) {
    return {
      threeMonths: monthlySavings * 3,
      sixMonths: monthlySavings * 6,
      oneYear: monthlySavings * 12
    };
  }

  getScoreColor(score) {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#ef4444';
    return '#dc2626';
  }

  getScoreLevel(score) {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Buena';
    if (score >= 40) return 'Regular';
    return 'Necesita Mejora';
  }

  getRecommendationPriority(recommendation, index) {
    if (index < 2) return 'high';
    if (index < 4) return 'medium';
    return 'low';
  }

  getRecommendationPriorityText(recommendation, index) {
    if (index < 2) return 'Prioridad Alta';
    if (index < 4) return 'Prioridad Media';
    return 'Prioridad Baja';
  }

  generateCacheKey(data) {
    return `${data.month}-${data.balance.totalIncome}-${data.balance.totalExpenses}-${Object.keys(data.byCategory).length}`;
  }

  // Enhanced download functionality
  setupDownload(data) {
    const downloadBtn = document.getElementById('download-report-btn');
    downloadBtn.onclick = () => this.downloadEnhancedReport(data);
  }

  downloadEnhancedReport(data) {
    const reportContent = document.getElementById('report-content');
    const htmlContent = this.generateHTMLReport(data, reportContent);
    
    this.downloadFile(htmlContent, `informe-financiero-${data.month}.html`, 'text/html');
  }

  generateHTMLReport(data, contentElement) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informe Financiero FINZN - ${data.month}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .report-container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .report-header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
        .report-title { color: #1a202c; font-size: 2.5rem; margin: 0; }
        .report-subtitle { color: #718096; font-size: 1.2rem; margin: 10px 0 0 0; }
        .report-section { margin-bottom: 40px; }
        .report-section h3 { color: #2d3748; border-left: 4px solid #667eea; padding-left: 16px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f7fafc; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 1.5rem; font-weight: bold; color: #2d3748; }
        .metric-label { color: #718096; font-size: 0.9rem; margin-top: 5px; }
        @media print { body { background: white; } .report-container { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="report-header">
            <h1 class="report-title">📊 Informe Financiero FINZN</h1>
            <p class="report-subtitle">Período: ${data.month} | Generado: ${new Date().toLocaleDateString('es-ES')}</p>
        </div>
        ${contentElement.innerHTML}
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #718096; font-size: 0.9rem;">
            <p>Informe generado por FINZN - Tu Compañero Financiero Inteligente</p>
        </div>
    </div>
</body>
</html>`;
  }

  generateFallbackReport(data, container) {
    // Fallback report without AI
    const summarySection = this.createSection('Resumen del Mes', [
      { label: 'Ingresos Totales', value: this.formatCurrency(data.balance.totalIncome) },
      { label: 'Gastos Totales', value: this.formatCurrency(data.balance.totalExpenses) },
      { label: 'Balance', value: this.formatCurrency(data.balance.available) },
      { label: 'Cuotas Activas', value: data.balance.installments }
    ]);
    container.appendChild(summarySection);

    const categorySection = this.createCategorySection('Gastos por Categoría', data.byCategory);
    container.appendChild(categorySection);

    if (data.recommendations && data.recommendations.length > 0) {
      const recommendationsSection = this.createRecommendationsSection(data.recommendations);
      container.appendChild(recommendationsSection);
    }
  }

  createSection(title, items) {
    const section = document.createElement('div');
    section.className = 'report-section';
    
    const heading = document.createElement('h3');
    heading.textContent = title;
    section.appendChild(heading);
    
    const grid = document.createElement('div');
    grid.className = 'report-grid';
    
    items.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'report-item';
      itemElement.innerHTML = `
        <div class="report-item-label">${item.label}</div>
        <div class="report-item-value">${item.value}</div>
        ${item.trend ? `<div class="report-item-trend trend-${item.trend}">📈</div>` : ''}
      `;
      grid.appendChild(itemElement);
    });
    
    section.appendChild(grid);
    return section;
  }

  createCategorySection(title, categories) {
    const section = document.createElement('div');
    section.className = 'report-section';
    
    const heading = document.createElement('h3');
    heading.textContent = title;
    section.appendChild(heading);
    
    const total = Object.values(categories).reduce((sum, amount) => sum + amount, 0);
    
    Object.entries(categories).forEach(([category, amount]) => {
      const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
      
      const item = document.createElement('div');
      item.className = 'report-item';
      item.innerHTML = `
        <div class="report-item-label">${category}</div>
        <div class="report-item-value">${this.formatCurrency(amount)} (${percentage}%)</div>
      `;
      section.appendChild(item);
    });
    
    return section;
  }

  createRecommendationsSection(recommendations) {
    const section = document.createElement('div');
    section.className = 'report-section';
    
    const heading = document.createElement('h3');
    heading.textContent = 'Recomendaciones';
    section.appendChild(heading);
    
    const list = document.createElement('ul');
    recommendations.forEach(rec => {
      const item = document.createElement('li');
      item.textContent = rec;
      list.appendChild(item);
    });
    
    section.appendChild(list);
    return section;
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}