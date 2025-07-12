export class ReportManager {
  constructor() {
    this.aiAnalysisCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async generate(data) {
    const container = document.getElementById('report-content');
    if (!container) return;

    container.innerHTML = '';

    // Show loading state
    this.showLoadingState(container);

    try {
      // Generate AI analysis with timeout
      const aiAnalysis = await Promise.race([
        this.generateAIAnalysis(data),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI analysis timeout')), 15000)
        )
      ]);
      
      // Clear loading and show content
      container.innerHTML = '';
      this.renderFullReport(container, data, aiAnalysis);

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
        <p>Analizando tus datos financieros para crear un informe personalizado.</p>
        <div class="loading-progress">
          <div class="loading-bar"></div>
        </div>
      </div>
    `;
  }

  async generateAIAnalysis(data) {
    const cacheKey = this.generateCacheKey(data);
    
    // Check cache first
    const cached = this.aiAnalysisCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Prepare data for AI analysis
      const analysisPrompt = this.buildAnalysisPrompt(data);
      
      const baseUrl = window.location.origin.includes('localhost') 
        ? 'http://localhost:3001' 
        : window.location.origin;
      
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: analysisPrompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const aiResponse = await response.json();
      
      if (!aiResponse.reply) {
        throw new Error('Empty AI response');
      }

      const analysis = this.parseAIResponse(aiResponse.reply, data);
      
      // Cache the result
      this.aiAnalysisCache.set(cacheKey, {
        data: analysis,
        timestamp: Date.now()
      });
      
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

    return `Analiza estos datos financieros y proporciona un análisis estructurado:

DATOS FINANCIEROS DEL MES:
- Ingresos totales: ${this.formatCurrency(totalIncome)}
- Gastos totales: ${this.formatCurrency(totalExpenses)}
- Balance disponible: ${this.formatCurrency(data.balance.available)}
- Tasa de ahorro: ${savingsRate}%
- Cuotas activas: ${data.balance.installments}

PRINCIPALES CATEGORÍAS DE GASTO:
${topCategories.join('\n')}

INGRESOS EXTRA: ${data.extraIncomes?.length || 0} registros este mes

Por favor proporciona un análisis con:
1. Puntaje de salud financiera (0-100)
2. Tres fortalezas principales
3. Tres áreas de mejora específicas
4. Cinco recomendaciones prácticas
5. Tendencia proyectada (positiva/estable/negativa)
6. Nivel de riesgo (Bajo/Medio/Alto)

Responde de manera estructurada y práctica en español.`;
  }

  parseAIResponse(aiReply, data) {
    const analysis = {
      healthScore: this.extractHealthScore(aiReply) || this.calculateHealthScore(data),
      strengths: this.extractListItems(aiReply, ['fortaleza', 'punto fuerte', 'aspecto positivo']) || this.generateFallbackStrengths(data),
      improvements: this.extractListItems(aiReply, ['mejora', 'área de mejora', 'oportunidad']) || this.generateFallbackImprovements(data),
      recommendations: this.extractListItems(aiReply, ['recomendación', 'consejo', 'sugerencia']) || this.generateFallbackRecommendations(data),
      trend: this.extractTrend(aiReply) || 'estable',
      riskLevel: this.extractRiskLevel(aiReply) || this.calculateRiskLevel(data),
      summary: this.extractSummary(aiReply) || this.generateFallbackSummary(data),
      rawResponse: aiReply
    };

    return analysis;
  }

  extractHealthScore(text) {
    const patterns = [
      /(?:puntaje|score|puntuación|salud).*?(\d{1,3})/i,
      /(\d{1,3}).*?(?:puntos|%|puntaje)/i,
      /(\d{1,3})\/100/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const score = parseInt(match[1]);
        if (score >= 0 && score <= 100) {
          return score;
        }
      }
    }
    return null;
  }

  extractListItems(text, keywords) {
    for (const keyword of keywords) {
      const regex = new RegExp(`${keyword}[^:]*:([^\\n]*(?:\\n(?!\\d+\\.|[A-Z]|${keywords.join('|')}).*)*)`,'i');
      const match = text.match(regex);
      if (match) {
        const items = match[1]
          .split(/\d+\.|\n-|\n•|\n\*/)
          .map(item => item.trim())
          .filter(item => item.length > 10 && item.length < 200)
          .slice(0, 5);
        
        if (items.length > 0) {
          return items;
        }
      }
    }
    
    // Fallback: extract numbered lists
    const numberedItems = text.match(/\d+\.\s*([^\n]+)/g);
    if (numberedItems && numberedItems.length >= 3) {
      return numberedItems
        .map(item => item.replace(/^\d+\.\s*/, '').trim())
        .filter(item => item.length > 10)
        .slice(0, 5);
    }
    
    return null;
  }

  extractTrend(text) {
    if (/positiv|mejora|crec|favorable|buena|ascendente/i.test(text)) return 'positiva';
    if (/negativ|declin|baj|desfavorable|mala|descendente|preocupante/i.test(text)) return 'negativa';
    return 'estable';
  }

  extractRiskLevel(text) {
    if (/alto|elevado|crítico|peligroso|grave/i.test(text)) return 'Alto';
    if (/medio|moderado|intermedio/i.test(text)) return 'Medio';
    return 'Bajo';
  }

  extractSummary(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length >= 2) {
      return sentences.slice(0, 2).join('. ').trim() + '.';
    }
    return sentences[0]?.trim() + '.' || '';
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
    if (data.balance.installments <= 2) {
      strengths.push('Mantienes un número controlado de cuotas activas');
    }
    
    return strengths.length > 0 ? strengths : ['Estás registrando tus gastos de manera consistente'];
  }

  generateFallbackImprovements(data) {
    const improvements = [];
    const savingsRate = this.calculateSavingsRate(data);
    
    if (savingsRate < 10) {
      improvements.push('Incrementar la tasa de ahorro mensual al menos al 10%');
    }
    
    const topCategory = Object.entries(data.byCategory)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory && (topCategory[1] / data.balance.totalExpenses) > 0.4) {
      improvements.push(`Reducir gastos en ${topCategory[0]} que representa un alto porcentaje del total`);
    }
    
    if (data.balance.installments > 3) {
      improvements.push('Considerar reducir el número de cuotas activas para mayor flexibilidad');
    }
    
    if (Object.keys(data.byCategory).length < 3) {
      improvements.push('Diversificar las categorías de gasto para mejor control');
    }
    
    return improvements.length > 0 ? improvements : ['Establecer objetivos de ahorro específicos y medibles'];
  }

  generateFallbackRecommendations(data) {
    return [
      'Establece un presupuesto mensual específico para cada categoría de gasto',
      'Crea un fondo de emergencia equivalente a 3-6 meses de gastos básicos',
      'Revisa y optimiza tus gastos recurrentes cada mes',
      'Busca oportunidades para generar ingresos adicionales',
      'Automatiza tus ahorros para alcanzar objetivos más fácilmente'
    ];
  }

  generateFallbackSummary(data) {
    const savingsRate = this.calculateSavingsRate(data);
    const status = savingsRate > 0 ? 'positiva' : 'que requiere atención';
    return `Tu situación financiera muestra una tasa de ahorro del ${savingsRate}%, lo cual es ${status}. ${savingsRate > 0 ? 'Continúa con estos buenos hábitos' : 'Considera ajustar tus gastos'} para mejorar tu estabilidad financiera.`;
  }

  renderFullReport(container, data, aiAnalysis) {
    // Executive Summary
    const executiveSummary = this.createExecutiveSummary(data, aiAnalysis);
    container.appendChild(executiveSummary);

    // Health Score Section
    const healthScore = this.createHealthScoreSection(data, aiAnalysis);
    container.appendChild(healthScore);

    // Financial Summary
    const summarySection = this.createFinancialSummarySection(data);
    container.appendChild(summarySection);

    // Category Analysis
    const categorySection = this.createCategoryAnalysisSection(data);
    container.appendChild(categorySection);

    // AI Recommendations
    const recommendationsSection = this.createRecommendationsSection(aiAnalysis);
    container.appendChild(recommendationsSection);

    // Additional sections based on available data
    if (data.goals && data.goals.length > 0) {
      const goalsSection = this.createGoalsSection(data.goals);
      container.appendChild(goalsSection);
    }

    if (data.installments && data.installments.length > 0) {
      const installmentsSection = this.createInstallmentsSection(data.installments);
      container.appendChild(installmentsSection);
    }

    if (data.extraIncomes && data.extraIncomes.length > 0) {
      const extraIncomeSection = this.createExtraIncomeSection(data.extraIncomes);
      container.appendChild(extraIncomeSection);
    }
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

  createFinancialSummarySection(data) {
    const section = document.createElement('div');
    section.className = 'report-section financial-summary';
    
    section.innerHTML = `
      <h3>📊 Resumen Financiero</h3>
      
      <div class="financial-grid">
        <div class="financial-item">
          <div class="financial-label">Ingresos Totales</div>
          <div class="financial-value positive">${this.formatCurrency(data.balance.totalIncome)}</div>
        </div>
        
        <div class="financial-item">
          <div class="financial-label">Gastos Totales</div>
          <div class="financial-value negative">${this.formatCurrency(data.balance.totalExpenses)}</div>
        </div>
        
        <div class="financial-item">
          <div class="financial-label">Balance Disponible</div>
          <div class="financial-value ${data.balance.available >= 0 ? 'positive' : 'negative'}">
            ${this.formatCurrency(data.balance.available)}
          </div>
        </div>
        
        <div class="financial-item">
          <div class="financial-label">Tasa de Ahorro</div>
          <div class="financial-value">${this.calculateSavingsRate(data)}%</div>
        </div>
        
        <div class="financial-item">
          <div class="financial-label">Cuotas Activas</div>
          <div class="financial-value">${data.balance.installments}</div>
        </div>
        
        <div class="financial-item">
          <div class="financial-label">Categorías de Gasto</div>
          <div class="financial-value">${Object.keys(data.byCategory).length}</div>
        </div>
      </div>
    `;
    
    return section;
  }

  createCategoryAnalysisSection(data) {
    const section = document.createElement('div');
    section.className = 'report-section category-analysis';
    
    const total = Object.values(data.byCategory).reduce((sum, amount) => sum + amount, 0);
    const sortedCategories = Object.entries(data.byCategory)
      .sort(([,a], [,b]) => b - a);
    
    section.innerHTML = `
      <h3>💳 Análisis por Categorías</h3>
      
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

  createRecommendationsSection(aiAnalysis) {
    const section = document.createElement('div');
    section.className = 'report-section recommendations';
    
    section.innerHTML = `
      <h3>🤖 Recomendaciones Personalizadas</h3>
      
      <div class="recommendations-intro">
        <p>Basado en el análisis de tus patrones financieros:</p>
      </div>
      
      <div class="recommendations-list">
        ${aiAnalysis.recommendations.map((recommendation, index) => `
          <div class="recommendation-item">
            <div class="recommendation-number">${index + 1}</div>
            <div class="recommendation-content">
              <div class="recommendation-text">${recommendation}</div>
              <div class="recommendation-priority ${this.getRecommendationPriority(index)}">
                ${this.getRecommendationPriorityText(index)}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    return section;
  }

  createGoalsSection(goals) {
    const section = document.createElement('div');
    section.className = 'report-section goals-section';
    
    section.innerHTML = `
      <h3>🎯 Objetivos de Ahorro</h3>
      
      <div class="goals-grid">
        ${goals.map(goal => {
          const progress = Math.min((goal.current / goal.target) * 100, 100);
          return `
            <div class="goal-item-report">
              <div class="goal-name">${goal.name}</div>
              <div class="goal-progress-container">
                <div class="goal-progress-bar">
                  <div class="goal-progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="goal-progress-text">${Math.round(progress)}%</div>
              </div>
              <div class="goal-amounts">
                <span>${this.formatCurrency(goal.current)}</span>
                <span>de ${this.formatCurrency(goal.target)}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    return section;
  }

  createInstallmentsSection(installments) {
    const section = document.createElement('div');
    section.className = 'report-section installments-section';
    
    const totalRemaining = installments.reduce((sum, inst) => sum + inst.remainingAmount, 0);
    
    section.innerHTML = `
      <h3>💳 Cuotas Activas</h3>
      
      <div class="installments-summary">
        <div class="installments-stat">
          <div class="stat-label">Total de Cuotas</div>
          <div class="stat-value">${installments.length}</div>
        </div>
        <div class="installments-stat">
          <div class="stat-label">Monto Restante</div>
          <div class="stat-value">${this.formatCurrency(totalRemaining)}</div>
        </div>
      </div>
      
      <div class="installments-list">
        ${installments.map(installment => `
          <div class="installment-item-report">
            <div class="installment-description">${installment.description}</div>
            <div class="installment-progress">
              <div class="installment-progress-bar">
                <div class="installment-progress-fill" style="width: ${installment.progress}%"></div>
              </div>
              <div class="installment-progress-text">
                ${installment.currentInstallment}/${installment.totalInstallments} (${installment.progress}%)
              </div>
            </div>
            <div class="installment-amount">${this.formatCurrency(installment.monthlyAmount)}/mes</div>
          </div>
        `).join('')}
      </div>
    `;
    
    return section;
  }

  createExtraIncomeSection(extraIncomes) {
    const section = document.createElement('div');
    section.className = 'report-section extra-income-section';
    
    const totalExtra = extraIncomes.reduce((sum, income) => sum + income.amount, 0);
    
    section.innerHTML = `
      <h3>✨ Ingresos Extras</h3>
      
      <div class="extra-income-summary">
        <div class="extra-income-stat">
          <div class="stat-label">Total de Ingresos Extras</div>
          <div class="stat-value">${this.formatCurrency(totalExtra)}</div>
        </div>
        <div class="extra-income-stat">
          <div class="stat-label">Número de Ingresos</div>
          <div class="stat-value">${extraIncomes.length}</div>
        </div>
      </div>
      
      <div class="extra-income-list">
        ${extraIncomes.map(income => `
          <div class="extra-income-item-report">
            <div class="extra-income-description">${income.description}</div>
            <div class="extra-income-category">${income.category}</div>
            <div class="extra-income-amount">${this.formatCurrency(income.amount)}</div>
          </div>
        `).join('')}
      </div>
    `;
    
    return section;
  }

  generateFallbackReport(data, container) {
    container.innerHTML = `
      <div class="fallback-report">
        <div class="fallback-header">
          <h2>📊 Informe Financiero</h2>
          <p>Análisis básico de tus finanzas del mes</p>
        </div>
      </div>
    `;

    const summarySection = this.createFinancialSummarySection(data);
    container.appendChild(summarySection);

    const categorySection = this.createCategoryAnalysisSection(data);
    container.appendChild(categorySection);

    const basicRecommendations = this.createBasicRecommendationsSection(data);
    container.appendChild(basicRecommendations);
  }

  createBasicRecommendationsSection(data) {
    const section = document.createElement('div');
    section.className = 'report-section basic-recommendations';
    
    const recommendations = this.generateFallbackRecommendations(data);
    
    section.innerHTML = `
      <h3>💡 Recomendaciones Básicas</h3>
      
      <div class="basic-recommendations-list">
        ${recommendations.map((rec, index) => `
          <div class="basic-recommendation-item">
            <div class="basic-recommendation-number">${index + 1}</div>
            <div class="basic-recommendation-text">${rec}</div>
          </div>
        `).join('')}
      </div>
    `;
    
    return section;
  }

  // Utility methods
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

  getRecommendationPriority(index) {
    if (index < 2) return 'high';
    if (index < 4) return 'medium';
    return 'low';
  }

  getRecommendationPriorityText(index) {
    if (index < 2) return 'Prioridad Alta';
    if (index < 4) return 'Prioridad Media';
    return 'Prioridad Baja';
  }

  generateCacheKey(data) {
    return `${data.month}-${data.balance.totalIncome}-${data.balance.totalExpenses}-${Object.keys(data.byCategory).length}-${Date.now()}`;
  }

  setupDownload(data) {
    const downloadBtn = document.getElementById('download-report-btn');
    if (downloadBtn) {
      downloadBtn.onclick = () => this.downloadReport(data);
    }
  }

  downloadReport(data) {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) return;

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
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background: #f8fafc; 
          line-height: 1.6;
        }
        .report-container { 
          max-width: 1200px; 
          margin: 0 auto; 
          background: white; 
          padding: 40px; 
          border-radius: 12px; 
          box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
        }
        .report-header { 
          text-align: center; 
          margin-bottom: 40px; 
          border-bottom: 2px solid #e2e8f0; 
          padding-bottom: 20px; 
        }
        .report-title { 
          color: #1a202c; 
          font-size: 2.5rem; 
          margin: 0; 
        }
        .report-subtitle { 
          color: #718096; 
          font-size: 1.2rem; 
          margin: 10px 0 0 0; 
        }
        .report-section { 
          margin-bottom: 40px; 
          page-break-inside: avoid;
        }
        .report-section h3 { 
          color: #2d3748; 
          border-left: 4px solid #667eea; 
          padding-left: 16px; 
          margin-bottom: 20px;
        }
        .financial-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        .financial-item {
          background: #f7fafc;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .financial-value {
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 10px;
        }
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        .category-item-detailed {
          margin-bottom: 15px;
          padding: 15px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }
        .category-bar {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          margin: 10px 0;
        }
        .category-fill {
          height: 100%;
          background: #667eea;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        @media print { 
          body { background: white; } 
          .report-container { box-shadow: none; } 
          .report-section { page-break-inside: avoid; }
        }
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
            <p>Para más información visita: <strong>finzn.app</strong></p>
        </div>
    </div>
</body>
</html>`;
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