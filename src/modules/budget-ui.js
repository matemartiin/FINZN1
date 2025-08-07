export class BudgetUIManager {
  constructor() {
    this.currentBudget = null;
    this.charts = {};
    this.refreshInterval = null;
  }

  // ===== INTERFAZ PRINCIPAL =====
  renderSmartBudgetInterface(container) {
    container.innerHTML = `
      <div class="smart-budget-container">
        <!-- Header with AI Insights -->
        <div class="budget-header">
          <div class="budget-title-section">
            <h2>🧠 Presupuesto Inteligente</h2>
            <div class="ai-status">
              <span class="ai-indicator active">🤖 IA Activa</span>
            </div>
          </div>
          <div class="budget-actions">
            <button id="create-smart-budget" class="btn btn-primary">
              <span>✨</span>
              Crear Presupuesto IA
            </button>
            <button id="budget-insights" class="btn btn-secondary">
              <span>📊</span>
              Insights
            </button>
          </div>
        </div>

        <!-- AI Insights Panel -->
        <div id="ai-insights-panel" class="ai-insights-panel">
          <div class="insights-header">
            <h3>💡 Insights de IA</h3>
            <button id="refresh-insights" class="btn btn-icon">🔄</button>
          </div>
          <div id="insights-content" class="insights-content">
            <!-- AI insights will be loaded here -->
          </div>
        </div>

        <!-- Budget Overview Cards -->
        <div class="budget-overview-cards">
          <div class="budget-card health-card">
            <div class="card-header">
              <h3>🏥 Salud del Presupuesto</h3>
              <div id="budget-health-score" class="health-score">85%</div>
            </div>
            <div id="health-details" class="health-details">
              <!-- Health details will be loaded here -->
            </div>
          </div>

          <div class="budget-card predictions-card">
            <div class="card-header">
              <h3>🔮 Predicciones</h3>
              <div class="prediction-confidence">
                <span id="prediction-confidence">Alta confianza</span>
              </div>
            </div>
            <div id="predictions-content" class="predictions-content">
              <!-- Predictions will be loaded here -->
            </div>
          </div>

          <div class="budget-card alerts-card">
            <div class="card-header">
              <h3>🚨 Alertas Inteligentes</h3>
              <div id="alerts-count" class="alerts-count">3</div>
            </div>
            <div id="alerts-content" class="alerts-content">
              <!-- Alerts will be loaded here -->
            </div>
          </div>
        </div>

        <!-- Main Budget Dashboard -->
        <div class="budget-dashboard">
          <!-- Category Analysis -->
          <div class="budget-section category-analysis">
            <div class="section-header">
              <h3>📊 Análisis por Categorías</h3>
              <div class="section-controls">
                <select id="period-selector">
                  <option value="current">Mes Actual</option>
                  <option value="last3">Últimos 3 Meses</option>
                  <option value="last6">Últimos 6 Meses</option>
                </select>
              </div>
            </div>
            <div id="category-analysis-content" class="category-analysis-content">
              <!-- Category analysis will be loaded here -->
            </div>
          </div>

          <!-- Spending Trends -->
          <div class="budget-section trends-section">
            <div class="section-header">
              <h3>📈 Tendencias y Patrones</h3>
            </div>
            <div class="trends-container">
              <div class="chart-container">
                <canvas id="spending-trends-chart"></canvas>
              </div>
              <div class="trends-insights">
                <div id="trends-analysis" class="trends-analysis">
                  <!-- Trends analysis will be loaded here -->
                </div>
              </div>
            </div>
          </div>

          <!-- Predictive Analytics -->
          <div class="budget-section predictions-section">
            <div class="section-header">
              <h3>🔮 Análisis Predictivo</h3>
              <div class="prediction-controls">
                <button id="update-predictions" class="btn btn-secondary btn-sm">
                  Actualizar Predicciones
                </button>
              </div>
            </div>
            <div class="predictions-container">
              <div class="chart-container">
                <canvas id="predictions-chart"></canvas>
              </div>
              <div class="predictions-details">
                <div id="predictions-analysis" class="predictions-analysis">
                  <!-- Predictions analysis will be loaded here -->
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Smart Recommendations -->
        <div class="smart-recommendations">
          <div class="section-header">
            <h3>💡 Recomendaciones Inteligentes</h3>
            <button id="generate-recommendations" class="btn btn-primary btn-sm">
              <span>🤖</span>
              Generar Nuevas
            </button>
          </div>
          <div id="recommendations-content" class="recommendations-content">
            <!-- Recommendations will be loaded here -->
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.loadInitialData();
  }

  setupEventListeners() {
    // Create smart budget
    document.getElementById('create-smart-budget')?.addEventListener('click', () => {
      this.showCreateSmartBudgetModal();
    });

    // Budget insights
    document.getElementById('budget-insights')?.addEventListener('click', () => {
      this.toggleInsightsPanel();
    });

    // Refresh insights
    document.getElementById('refresh-insights')?.addEventListener('click', () => {
      this.refreshInsights();
    });

    // Period selector
    document.getElementById('period-selector')?.addEventListener('change', (e) => {
      this.updateAnalysisPeriod(e.target.value);
    });

    // Update predictions
    document.getElementById('update-predictions')?.addEventListener('click', () => {
      this.updatePredictions();
    });

    // Generate recommendations
    document.getElementById('generate-recommendations')?.addEventListener('click', () => {
      this.generateNewRecommendations();
    });
  }

  // ===== VISUALIZACIÓN DE DATOS =====
  renderCategoryAnalysis(data) {
    const container = document.getElementById('category-analysis-content');
    if (!container) return;

    container.innerHTML = '';

    data.forEach(category => {
      const categoryCard = document.createElement('div');
      categoryCard.className = `category-card ${category.status}`;
      
      categoryCard.innerHTML = `
        <div class="category-header">
          <div class="category-info">
            <div class="category-icon">${category.icon}</div>
            <div class="category-name">${category.name}</div>
          </div>
          <div class="category-status">
            <span class="status-indicator ${category.status}"></span>
            <span class="status-text">${this.getStatusText(category.status)}</span>
          </div>
        </div>
        
        <div class="category-metrics">
          <div class="metric">
            <span class="metric-label">Presupuestado</span>
            <span class="metric-value">${this.formatCurrency(category.allocated)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Gastado</span>
            <span class="metric-value">${this.formatCurrency(category.spent)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Restante</span>
            <span class="metric-value ${category.remaining < 0 ? 'negative' : 'positive'}">
              ${this.formatCurrency(category.remaining)}
            </span>
          </div>
        </div>
        
        <div class="category-progress">
          <div class="progress-bar">
            <div class="progress-fill ${category.status}" 
                 style="width: ${Math.min(category.percentage, 100)}%"></div>
          </div>
          <div class="progress-text">${category.percentage.toFixed(1)}%</div>
        </div>
        
        <div class="category-insights">
          <div class="insight-item">
            <span class="insight-icon">📈</span>
            <span class="insight-text">Tendencia: ${category.trend}</span>
          </div>
          <div class="insight-item">
            <span class="insight-icon">🎯</span>
            <span class="insight-text">Proyección: ${this.formatCurrency(category.projection)}</span>
          </div>
        </div>
        
        ${category.aiRecommendation ? `
          <div class="ai-recommendation">
            <div class="ai-rec-header">
              <span class="ai-icon">🤖</span>
              <span class="ai-rec-title">Recomendación IA</span>
            </div>
            <div class="ai-rec-content">${category.aiRecommendation}</div>
          </div>
        ` : ''}
      `;
      
      container.appendChild(categoryCard);
    });
  }

  renderSmartRecommendations(recommendations) {
    const container = document.getElementById('recommendations-content');
    if (!container) return;

    container.innerHTML = '';

    if (recommendations.length === 0) {
      container.innerHTML = `
        <div class="empty-recommendations">
          <div class="empty-icon">🤖</div>
          <h3>No hay recomendaciones nuevas</h3>
          <p>Tu presupuesto está funcionando bien. Sigue así!</p>
        </div>
      `;
      return;
    }

    recommendations.forEach(rec => {
      const recCard = document.createElement('div');
      recCard.className = `recommendation-card priority-${rec.priority}`;
      
      recCard.innerHTML = `
        <div class="rec-header">
          <div class="rec-icon">${this.getRecommendationIcon(rec.type)}</div>
          <div class="rec-title">${rec.title}</div>
          <div class="rec-priority">
            <span class="priority-badge priority-${rec.priority}">${rec.priority}</span>
          </div>
        </div>
        
        <div class="rec-content">
          <p class="rec-description">${rec.description}</p>
          
          ${rec.impact ? `
            <div class="rec-impact">
              <span class="impact-label">Impacto estimado:</span>
              <span class="impact-value">${rec.impact}</span>
            </div>
          ` : ''}
          
          ${rec.actions && rec.actions.length > 0 ? `
            <div class="rec-actions">
              <h4>Acciones recomendadas:</h4>
              <ul class="action-list">
                ${rec.actions.map(action => `<li>${action}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
        
        <div class="rec-footer">
          <button class="btn btn-primary btn-sm apply-recommendation" 
                  data-rec-id="${rec.id}">
            Aplicar
          </button>
          <button class="btn btn-secondary btn-sm dismiss-recommendation" 
                  data-rec-id="${rec.id}">
            Descartar
          </button>
        </div>
      `;
      
      container.appendChild(recCard);
    });

    // Add event listeners for recommendation actions
    container.querySelectorAll('.apply-recommendation').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.applyRecommendation(e.target.dataset.recId);
      });
    });

    container.querySelectorAll('.dismiss-recommendation').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.dismissRecommendation(e.target.dataset.recId);
      });
    });
  }

  renderAIInsights(insights) {
    const container = document.getElementById('insights-content');
    if (!container) return;

    container.innerHTML = `
      <div class="insights-grid">
        <div class="insight-card spending-pattern">
          <div class="insight-header">
            <span class="insight-icon">🔍</span>
            <h4>Patrones de Gasto</h4>
          </div>
          <div class="insight-content">
            <p>${insights.spendingPattern}</p>
            <div class="insight-metrics">
              <div class="metric">
                <span class="metric-label">Consistencia</span>
                <span class="metric-value">${insights.consistency}%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="insight-card anomaly-detection">
          <div class="insight-header">
            <span class="insight-icon">⚠️</span>
            <h4>Detección de Anomalías</h4>
          </div>
          <div class="insight-content">
            <p>${insights.anomalies.summary}</p>
            <div class="anomaly-list">
              ${insights.anomalies.items.map(anomaly => `
                <div class="anomaly-item severity-${anomaly.severity}">
                  <span class="anomaly-icon">${this.getAnomalyIcon(anomaly.type)}</span>
                  <span class="anomaly-text">${anomaly.message}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="insight-card optimization">
          <div class="insight-header">
            <span class="insight-icon">⚡</span>
            <h4>Oportunidades de Optimización</h4>
          </div>
          <div class="insight-content">
            <div class="optimization-list">
              ${insights.optimizations.map(opt => `
                <div class="optimization-item">
                  <div class="opt-title">${opt.title}</div>
                  <div class="opt-savings">Ahorro potencial: ${this.formatCurrency(opt.savings)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="insight-card predictions">
          <div class="insight-header">
            <span class="insight-icon">🔮</span>
            <h4>Predicciones</h4>
          </div>
          <div class="insight-content">
            <p>${insights.predictions.summary}</p>
            <div class="prediction-chart-mini">
              <canvas id="mini-prediction-chart"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    // Render mini prediction chart
    this.renderMiniPredictionChart(insights.predictions.data);
  }

  // ===== GRÁFICOS Y VISUALIZACIONES =====
  renderSpendingTrendsChart(data) {
    const ctx = document.getElementById('spending-trends-chart');
    if (!ctx) return;

    if (this.charts.trends) {
      this.charts.trends.destroy();
    }

    this.charts.trends = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Gasto Real',
            data: data.actual,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Presupuesto',
            data: data.budget,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false
          },
          {
            label: 'Predicción IA',
            data: data.prediction,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderWidth: 2,
            fill: false,
            pointStyle: 'triangle'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: ${this.formatCurrency(context.raw)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCurrency(value)
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
  }

  renderPredictionsChart(data) {
    const ctx = document.getElementById('predictions-chart');
    if (!ctx) return;

    if (this.charts.predictions) {
      this.charts.predictions.destroy();
    }

    this.charts.predictions = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Predicción',
            data: data.predictions,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Rango Superior',
            data: data.upperBound,
            borderColor: 'rgba(139, 92, 246, 0.5)',
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderDash: [3, 3],
            fill: false,
            pointRadius: 0
          },
          {
            label: 'Rango Inferior',
            data: data.lowerBound,
            borderColor: 'rgba(139, 92, 246, 0.5)',
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderDash: [3, 3],
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: ${this.formatCurrency(context.raw)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCurrency(value)
            }
          }
        }
      }
    });
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

  getStatusText(status) {
    const statusTexts = {
      'under_budget': 'Bajo presupuesto',
      'on_track': 'En camino',
      'warning': 'Atención',
      'critical': 'Crítico',
      'overspent': 'Sobregasto'
    };
    return statusTexts[status] || status;
  }

  getRecommendationIcon(type) {
    const icons = {
      'budget_adjustment': '⚖️',
      'spending_optimization': '⚡',
      'category_reallocation': '🔄',
      'savings_opportunity': '💰',
      'anomaly_alert': '⚠️',
      'trend_warning': '📈'
    };
    return icons[type] || '💡';
  }

  getAnomalyIcon(type) {
    const icons = {
      'amount': '💰',
      'frequency': '🔄',
      'category': '🏷️',
      'time': '⏰'
    };
    return icons[type] || '⚠️';
  }

  async loadInitialData() {
    try {
      // Load user's budget data
      const userId = window.app?.auth?.getCurrentUserId();
      if (!userId) return;

      // Show loading state
      this.showLoadingState();

      // Load data in parallel
      const [budgetData, insights, recommendations] = await Promise.all([
        this.loadBudgetData(userId),
        this.loadAIInsights(userId),
        this.loadRecommendations(userId)
      ]);

      // Render data
      this.renderCategoryAnalysis(budgetData.categories);
      this.renderAIInsights(insights);
      this.renderSmartRecommendations(recommendations);

      // Hide loading state
      this.hideLoadingState();

      // Start auto-refresh
      this.startAutoRefresh();
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showErrorState(error.message);
    }
  }

  showLoadingState() {
    const containers = [
      'category-analysis-content',
      'insights-content',
      'recommendations-content'
    ];

    containers.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.innerHTML = `
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Analizando datos con IA...</p>
          </div>
        `;
      }
    });
  }

  hideLoadingState() {
    // Loading states will be replaced by actual content
  }

  showErrorState(message) {
    const containers = [
      'category-analysis-content',
      'insights-content',
      'recommendations-content'
    ];

    containers.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.innerHTML = `
          <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Error al cargar datos</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="location.reload()">
              Reintentar
            </button>
          </div>
        `;
      }
    });
  }

  startAutoRefresh() {
    // Refresh data every 5 minutes
    this.refreshInterval = setInterval(() => {
      this.refreshInsights();
    }, 300000);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  destroy() {
    // Clean up charts
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });

    // Stop auto-refresh
    this.stopAutoRefresh();
  }
}