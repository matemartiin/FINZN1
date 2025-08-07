export class BudgetUI {
  constructor() {
    this.budgetManager = null;
    this.currentReport = null;
    this.charts = new Map();
  }

  async initialize() {
    console.log('🎨 Initializing Budget UI...');
    
    // Import budget manager
    const { BudgetManager } = await import('./budget-manager.js');
    this.budgetManager = new BudgetManager();
    await this.budgetManager.initialize();
    
    this.setupEventListeners();
    console.log('✅ Budget UI initialized successfully');
  }

  setupEventListeners() {
    // Generate AI analysis button
    const generateAnalysisBtn = document.getElementById('generate-budget-analysis');
    if (generateAnalysisBtn) {
      generateAnalysisBtn.addEventListener('click', () => this.generateBudgetAnalysis());
    }

    // Period selector
    const periodSelector = document.getElementById('budget-analysis-period');
    if (periodSelector) {
      periodSelector.addEventListener('change', (e) => this.handlePeriodChange(e.target.value));
    }

    // Export report button
    const exportBtn = document.getElementById('export-budget-report');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportBudgetReport());
    }
  }

  async generateBudgetAnalysis() {
    const userId = window.app?.auth?.getCurrentUserId();
    if (!userId) {
      this.showError('Usuario no autenticado');
      return;
    }

    const generateBtn = document.getElementById('generate-budget-analysis');
    const originalText = generateBtn?.innerHTML;
    
    try {
      // Show loading state
      if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<div class="loading-spinner"></div> Analizando...';
      }

      this.showLoadingState();

      // Get selected period
      const period = document.getElementById('budget-analysis-period')?.value || 'current';
      
      // Generate comprehensive report
      this.currentReport = await this.budgetManager.generateComprehensiveBudgetReport(userId, {
        period,
        includeIntelligence: true,
        includeRecommendations: true,
        includeForecasting: true
      });

      // Display results
      await this.displayBudgetAnalysis(this.currentReport);
      
      this.showSuccess('Análisis presupuestario generado exitosamente');

    } catch (error) {
      console.error('❌ Error generating budget analysis:', error);
      this.showError('Error al generar el análisis presupuestario');
    } finally {
      // Restore button state
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalText;
      }
      this.hideLoadingState();
    }
  }

  async displayBudgetAnalysis(report) {
    console.log('🎨 Displaying budget analysis:', report);

    // Display executive summary
    this.displayExecutiveSummary(report.executiveSummary);
    
    // Display key metrics
    this.displayKeyMetrics(report.analytics.keyMetrics);
    
    // Display intelligence insights
    if (report.intelligence) {
      this.displayIntelligenceInsights(report.intelligence.insights);
    }
    
    // Display recommendations
    if (report.recommendations) {
      this.displayRecommendations(report.recommendations.recommendations);
    }
    
    // Display forecasting
    if (report.forecasting) {
      this.displayForecasting(report.forecasting);
    }
    
    // Display charts
    this.displayAnalyticsCharts(report.analytics);
    
    // Show results container
    const resultsContainer = document.getElementById('budget-analysis-results');
    if (resultsContainer) {
      resultsContainer.classList.remove('hidden');
    }
  }

  displayExecutiveSummary(summary) {
    const container = document.getElementById('executive-summary');
    if (!container) return;

    const healthRating = summary.overallHealth.rating;
    const healthScore = summary.overallHealth.score;
    
    container.innerHTML = `
      <div class="executive-summary-card">
        <div class="summary-header">
          <h3>📊 Resumen Ejecutivo</h3>
          <div class="health-score ${healthRating}">
            <div class="health-score-value">${healthScore}</div>
            <div class="health-score-label">Puntuación de Salud Financiera</div>
          </div>
        </div>
        
        <div class="summary-content">
          <div class="health-components">
            <div class="component">
              <span class="component-label">Ahorros:</span>
              <span class="component-value">${summary.overallHealth.components.savings.toFixed(1)}%</span>
            </div>
            <div class="component">
              <span class="component-label">Eficiencia:</span>
              <span class="component-value">${summary.overallHealth.components.efficiency.toFixed(1)}%</span>
            </div>
            <div class="component">
              <span class="component-label">Objetivos:</span>
              <span class="component-value">${summary.overallHealth.components.goals.toFixed(1)}%</span>
            </div>
            <div class="component">
              <span class="component-label">Riesgo:</span>
              <span class="component-value risk-${summary.overallHealth.components.risk}">${summary.overallHealth.components.risk}</span>
            </div>
          </div>
          
          ${summary.keyFindings.length > 0 ? `
            <div class="key-findings">
              <h4>🔍 Hallazgos Clave</h4>
              <ul>
                ${summary.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div class="opportunity-risk-scores">
            <div class="score-item">
              <div class="score-circle opportunity">
                <span class="score-value">${summary.opportunityScore}</span>
              </div>
              <div class="score-label">Oportunidades</div>
            </div>
            <div class="score-item">
              <div class="score-circle risk">
                <span class="score-value">${summary.riskScore}</span>
              </div>
              <div class="score-label">Riesgos</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  displayKeyMetrics(metrics) {
    const container = document.getElementById('key-metrics');
    if (!container) return;

    container.innerHTML = `
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">💰</div>
          <div class="metric-content">
            <div class="metric-value">${metrics.savingsRate.toFixed(1)}%</div>
            <div class="metric-label">Tasa de Ahorro</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">📊</div>
          <div class="metric-content">
            <div class="metric-value">${metrics.budgetEfficiency.toFixed(1)}%</div>
            <div class="metric-label">Eficiencia Presupuestaria</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">🎯</div>
          <div class="metric-content">
            <div class="metric-value">${metrics.goalProgress.toFixed(1)}%</div>
            <div class="metric-label">Progreso de Objetivos</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">⚠️</div>
          <div class="metric-content">
            <div class="metric-value risk-${metrics.riskLevel}">${metrics.riskLevel}</div>
            <div class="metric-label">Nivel de Riesgo</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">🔍</div>
          <div class="metric-content">
            <div class="metric-value">${metrics.anomalyCount}</div>
            <div class="metric-label">Anomalías Detectadas</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">📈</div>
          <div class="metric-content">
            <div class="metric-value trend-${metrics.trendDirection}">${this.getTrendLabel(metrics.trendDirection)}</div>
            <div class="metric-label">Tendencia General</div>
          </div>
        </div>
      </div>
    `;
  }

  displayIntelligenceInsights(insights) {
    const container = document.getElementById('intelligence-insights');
    if (!container) return;

    const topInsights = insights.slice(0, 6); // Show top 6 insights

    container.innerHTML = `
      <div class="insights-header">
        <h3>🧠 Insights Inteligentes</h3>
        <div class="insights-count">${insights.length} insights generados</div>
      </div>
      
      <div class="insights-grid">
        ${topInsights.map(insight => `
          <div class="insight-card ${insight.urgency}">
            <div class="insight-header">
              <div class="insight-type">${this.getInsightTypeIcon(insight.type)}</div>
              <div class="insight-impact">Impacto: ${insight.impact}/10</div>
            </div>
            
            <h4 class="insight-title">${insight.title}</h4>
            <p class="insight-description">${insight.description}</p>
            
            <div class="insight-recommendation">
              <strong>Recomendación:</strong> ${insight.recommendation}
            </div>
            
            ${insight.actionItems && insight.actionItems.length > 0 ? `
              <div class="insight-actions">
                <strong>Acciones:</strong>
                <ul>
                  ${insight.actionItems.slice(0, 3).map(action => `<li>${action}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${insight.potentialSavings ? `
              <div class="insight-savings">
                💰 Ahorro potencial: ${this.formatCurrency(insight.potentialSavings)}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      
      ${insights.length > 6 ? `
        <div class="insights-footer">
          <button class="btn btn-secondary" onclick="this.showAllInsights()">
            Ver todos los insights (${insights.length})
          </button>
        </div>
      ` : ''}
    `;
  }

  displayRecommendations(recommendations) {
    const container = document.getElementById('recommendations');
    if (!container) return;

    const topRecommendations = recommendations.slice(0, 5);

    container.innerHTML = `
      <div class="recommendations-header">
        <h3>💡 Recomendaciones Personalizadas</h3>
        <div class="recommendations-count">${recommendations.length} recomendaciones</div>
      </div>
      
      <div class="recommendations-list">
        ${topRecommendations.map((rec, index) => `
          <div class="recommendation-card priority-${rec.priority >= 8 ? 'high' : rec.priority >= 5 ? 'medium' : 'low'}">
            <div class="recommendation-header">
              <div class="recommendation-number">${index + 1}</div>
              <div class="recommendation-meta">
                <div class="recommendation-priority">Prioridad: ${rec.priority}/10</div>
                <div class="recommendation-impact">Impacto: ${rec.impact}</div>
              </div>
            </div>
            
            <h4 class="recommendation-title">${rec.title}</h4>
            <p class="recommendation-description">${rec.description}</p>
            
            <div class="recommendation-details">
              <div class="recommendation-timeframe">
                <strong>Plazo:</strong> ${rec.timeframe}
              </div>
              <div class="recommendation-effort">
                <strong>Esfuerzo:</strong> ${rec.effort}
              </div>
            </div>
            
            <div class="recommendation-actions">
              <strong>Plan de acción:</strong>
              <ol>
                ${rec.actions.map(action => `<li>${action}</li>`).join('')}
              </ol>
            </div>
            
            ${rec.expectedOutcome ? `
              <div class="recommendation-outcome">
                <strong>Resultado esperado:</strong> ${rec.expectedOutcome}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  displayForecasting(forecasting) {
    const container = document.getElementById('forecasting');
    if (!container) return;

    const nextMonth = forecasting.nextMonth;
    const scenarios = forecasting.scenarios;

    container.innerHTML = `
      <div class="forecasting-header">
        <h3>🔮 Proyecciones Financieras</h3>
        <div class="forecasting-confidence">Confianza: ${forecasting.confidence}%</div>
      </div>
      
      <div class="forecasting-content">
        <div class="forecast-section">
          <h4>📅 Próximo Mes</h4>
          <div class="forecast-metrics">
            <div class="forecast-metric">
              <span class="forecast-label">Ingresos Proyectados:</span>
              <span class="forecast-value positive">${this.formatCurrency(nextMonth.expectedIncome)}</span>
            </div>
            <div class="forecast-metric">
              <span class="forecast-label">Gastos Proyectados:</span>
              <span class="forecast-value negative">${this.formatCurrency(nextMonth.expectedExpenses)}</span>
            </div>
            <div class="forecast-metric">
              <span class="forecast-label">Balance Proyectado:</span>
              <span class="forecast-value ${nextMonth.projectedBalance >= 0 ? 'positive' : 'negative'}">
                ${this.formatCurrency(nextMonth.projectedBalance)}
              </span>
            </div>
          </div>
        </div>
        
        <div class="scenarios-section">
          <h4>📊 Análisis de Escenarios</h4>
          <div class="scenarios-grid">
            <div class="scenario-card optimistic">
              <h5>🌟 Optimista</h5>
              <div class="scenario-balance">${this.formatCurrency(scenarios.optimistic.projectedBalance)}</div>
              <p>${scenarios.optimistic.description}</p>
            </div>
            
            <div class="scenario-card realistic">
              <h5>📊 Realista</h5>
              <div class="scenario-balance">${this.formatCurrency(scenarios.realistic.projectedBalance)}</div>
              <p>Basado en tendencias actuales</p>
            </div>
            
            <div class="scenario-card pessimistic">
              <h5>⚠️ Pesimista</h5>
              <div class="scenario-balance">${this.formatCurrency(scenarios.pessimistic.projectedBalance)}</div>
              <p>${scenarios.pessimistic.description}</p>
            </div>
          </div>
        </div>
        
        ${Object.keys(nextMonth.categoryForecasts).length > 0 ? `
          <div class="category-forecasts-section">
            <h4>🏷️ Proyecciones por Categoría</h4>
            <div class="category-forecasts">
              ${Object.entries(nextMonth.categoryForecasts).map(([category, forecast]) => `
                <div class="category-forecast">
                  <span class="category-name">${category}</span>
                  <span class="category-projection">${this.formatCurrency(forecast.projected)}</span>
                  <span class="category-trend trend-${forecast.trend}">${forecast.trend}</span>
                  <span class="category-confidence">${forecast.confidence.toFixed(0)}%</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  displayAnalyticsCharts(analytics) {
    // Monthly trends chart
    this.createMonthlyTrendsChart(analytics.charts.monthlyTrends);
    
    // Category breakdown chart
    this.createCategoryBreakdownChart(analytics.charts.categoryBreakdown);
    
    // Budget utilization chart
    this.createBudgetUtilizationChart(analytics.charts.budgetUtilization);
  }

  createMonthlyTrendsChart(data) {
    const canvas = document.getElementById('monthly-trends-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (this.charts.has('monthlyTrends')) {
      this.charts.get('monthlyTrends').destroy();
    }

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.month),
        datasets: [
          {
            label: 'Ingresos',
            data: data.map(d => d.income),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true
          },
          {
            label: 'Gastos',
            data: data.map(d => d.expenses),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true
          },
          {
            label: 'Balance',
            data: data.map(d => d.balance),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Tendencias Mensuales'
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                  minimumFractionDigits: 0
                }).format(value);
              }
            }
          }
        }
      }
    });

    this.charts.set('monthlyTrends', chart);
  }

  createCategoryBreakdownChart(data) {
    const canvas = document.getElementById('category-breakdown-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (this.charts.has('categoryBreakdown')) {
      this.charts.get('categoryBreakdown').destroy();
    }

    const categories = Object.keys(data);
    const values = Object.values(data).map(d => d.totalSpent);
    const colors = this.generateColors(categories.length);

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Distribución de Gastos por Categoría'
          },
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                  minimumFractionDigits: 0
                }).format(value)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    this.charts.set('categoryBreakdown', chart);
  }

  createBudgetUtilizationChart(data) {
    const canvas = document.getElementById('budget-utilization-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (this.charts.has('budgetUtilization')) {
      this.charts.get('budgetUtilization').destroy();
    }

    const categories = Object.keys(data);
    const utilization = Object.values(data);

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [{
          label: 'Utilización del Presupuesto (%)',
          data: utilization,
          backgroundColor: utilization.map(value => 
            value > 100 ? '#ef4444' : 
            value > 80 ? '#f59e0b' : '#10b981'
          ),
          borderColor: '#ffffff',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Utilización del Presupuesto por Categoría'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 120,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });

    this.charts.set('budgetUtilization', chart);
  }

  async exportBudgetReport() {
    if (!this.currentReport) {
      this.showError('No hay reporte para exportar');
      return;
    }

    try {
      const reportContent = this.generateReportHTML(this.currentReport);
      const blob = new Blob([reportContent], { type: 'text/html;charset=utf-8' });
      
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-ES').replace(/\//g, '-');
      const filename = `Reporte_Presupuesto_IA_${dateStr}.html`;
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      this.showSuccess('Reporte exportado exitosamente');
    } catch (error) {
      console.error('❌ Error exporting report:', error);
      this.showError('Error al exportar el reporte');
    }
  }

  generateReportHTML(report) {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Análisis Presupuestario con IA - FINZN</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #C8B6FF; padding-bottom: 20px; }
          .section { margin-bottom: 30px; }
          .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
          .metric-card { padding: 15px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
          .insight-card { padding: 15px; margin-bottom: 15px; border-left: 4px solid #C8B6FF; background: #f9f9f9; }
          .recommendation-card { padding: 15px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px; }
          .high { border-left-color: #ef4444; }
          .medium { border-left-color: #f59e0b; }
          .low { border-left-color: #10b981; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Reporte de Análisis Presupuestario con IA</h1>
          <p>Generado por FINZN el ${new Date().toLocaleDateString('es-ES')}</p>
        </div>
        
        <div class="section">
          <h2>📋 Resumen Ejecutivo</h2>
          <p><strong>Puntuación de Salud Financiera:</strong> ${report.executiveSummary.overallHealth.score}/100 (${report.executiveSummary.overallHealth.rating})</p>
          <p><strong>Puntuación de Oportunidades:</strong> ${report.executiveSummary.opportunityScore}/100</p>
          <p><strong>Puntuación de Riesgo:</strong> ${report.executiveSummary.riskScore}/100</p>
        </div>
        
        <div class="section">
          <h2>🧠 Insights Principales</h2>
          ${report.intelligence.insights.slice(0, 5).map(insight => `
            <div class="insight-card ${insight.urgency}">
              <h3>${insight.title}</h3>
              <p>${insight.description}</p>
              <p><strong>Recomendación:</strong> ${insight.recommendation}</p>
            </div>
          `).join('')}
        </div>
        
        <div class="section">
          <h2>💡 Recomendaciones</h2>
          ${report.recommendations.recommendations.slice(0, 5).map((rec, index) => `
            <div class="recommendation-card">
              <h3>${index + 1}. ${rec.title}</h3>
              <p>${rec.description}</p>
              <p><strong>Prioridad:</strong> ${rec.priority}/10 | <strong>Impacto:</strong> ${rec.impact}</p>
              <p><strong>Plazo:</strong> ${rec.timeframe}</p>
            </div>
          `).join('')}
        </div>
        
        <div class="footer">
          <p style="text-align: center; color: #666; margin-top: 40px;">
            Reporte generado por FINZN - Tu compañero financiero inteligente
          </p>
        </div>
      </body>
      </html>
    `;
  }

  // Utility methods
  showLoadingState() {
    const container = document.getElementById('budget-analysis-results');
    if (container) {
      container.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner-large"></div>
          <h3>Analizando tus datos financieros...</h3>
          <p>Nuestro sistema de IA está procesando tu información para generar insights personalizados.</p>
        </div>
      `;
      container.classList.remove('hidden');
    }
  }

  hideLoadingState() {
    // Loading state will be replaced by results
  }

  showSuccess(message) {
    if (window.app && window.app.ui) {
      window.app.ui.showAlert(message, 'success');
    }
  }

  showError(message) {
    if (window.app && window.app.ui) {
      window.app.ui.showAlert(message, 'error');
    }
  }

  getTrendLabel(trend) {
    const labels = {
      'improving': 'Mejorando',
      'stable': 'Estable',
      'concerning': 'Preocupante'
    };
    return labels[trend] || trend;
  }

  getInsightTypeIcon(type) {
    const icons = {
      'health': '🏥',
      'behavioral': '🧠',
      'optimization': '⚡',
      'predictive': '🔮',
      'goals': '🎯'
    };
    return icons[type] || '💡';
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  generateColors(count) {
    const colors = [
      '#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981',
      '#6b7280', '#9ca3af', '#f97316', '#06b6d4', '#84cc16'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    
    return result;
  }

  handlePeriodChange(period) {
    console.log('📅 Period changed to:', period);
    // Auto-regenerate analysis if report exists
    if (this.currentReport) {
      this.generateBudgetAnalysis();
    }
  }
}