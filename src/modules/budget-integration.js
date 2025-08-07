// Budget Integration Module - Phase 1
// Integrates the new budget analytics system with the existing FINZN app

export class BudgetIntegration {
  constructor() {
    this.isIntegrated = false;
    this.budgetSection = null;
  }

  async integrate() {
    if (this.isIntegrated) return;

    console.log('🔗 Starting Budget Analytics integration...');

    try {
      // Import and initialize budget section
      const { BudgetSection } = await import('./budget-section.js');
      this.budgetSection = new BudgetSection();
      
      // Integrate with main app
      await this.budgetSection.integrateWithMainApp();
      
      // Add budget analytics to existing budget section
      this.enhanceBudgetSection();
      
      // Add navigation integration
      this.integrateNavigation();
      
      // Add event listeners
      this.setupEventListeners();
      
      this.isIntegrated = true;
      console.log('✅ Budget Analytics integration completed');
      
      // Show success message
      this.showIntegrationSuccess();
      
    } catch (error) {
      console.error('❌ Error integrating Budget Analytics:', error);
      this.showIntegrationError(error);
    }
  }

  enhanceBudgetSection() {
    console.log('🔧 Enhancing existing budget section...');
    
    // Find the budget section in the DOM
    const budgetSection = document.getElementById('budget-section');
    if (!budgetSection) {
      console.warn('⚠️ Budget section not found in DOM');
      return;
    }

    // Add the new analytics UI to the budget section
    const analyticsHTML = this.createAnalyticsHTML();
    
    // Insert analytics after existing content
    const existingContent = budgetSection.querySelector('.section-content');
    if (existingContent) {
      existingContent.insertAdjacentHTML('beforeend', analyticsHTML);
    }

    console.log('✅ Budget section enhanced with analytics');
  }

  createAnalyticsHTML() {
    return `
      <div class="budget-analytics-section" id="budget-analytics-section">
        <div class="budget-analytics-header">
          <h2 class="budget-analytics-title">
            🤖 Análisis Inteligente con IA
          </h2>
          <div class="budget-analytics-controls">
            <div class="period-selector">
              <label for="budget-analysis-period">Período:</label>
              <select id="budget-analysis-period">
                <option value="current">Mes Actual</option>
                <option value="last3">Últimos 3 Meses</option>
                <option value="last6">Últimos 6 Meses</option>
                <option value="year">Año Completo</option>
              </select>
            </div>
            <button id="generate-budget-analysis" class="btn btn-primary">
              <span>🧠</span>
              Generar Análisis IA
            </button>
            <button id="export-budget-report" class="btn btn-secondary" style="display: none;">
              <span>📄</span>
              Exportar Reporte
            </button>
          </div>
        </div>

        <div id="budget-analysis-results" class="budget-analysis-results hidden">
          <!-- Executive Summary -->
          <div id="executive-summary" class="analysis-section">
            <!-- Executive summary will be populated here -->
          </div>

          <!-- Key Metrics -->
          <div id="key-metrics" class="analysis-section">
            <!-- Key metrics will be populated here -->
          </div>

          <!-- Intelligence Insights -->
          <div id="intelligence-insights" class="analysis-section">
            <!-- Intelligence insights will be populated here -->
          </div>

          <!-- Recommendations -->
          <div id="recommendations" class="analysis-section">
            <!-- Recommendations will be populated here -->
          </div>

          <!-- Forecasting -->
          <div id="forecasting" class="analysis-section">
            <!-- Forecasting will be populated here -->
          </div>

          <!-- Charts Section -->
          <div class="charts-section">
            <h3>📊 Análisis Visual</h3>
            <div class="charts-grid">
              <div class="chart-container">
                <h4>Tendencias Mensuales</h4>
                <canvas id="monthly-trends-chart"></canvas>
              </div>
              <div class="chart-container">
                <h4>Distribución por Categoría</h4>
                <canvas id="category-breakdown-chart"></canvas>
              </div>
              <div class="chart-container">
                <h4>Utilización del Presupuesto</h4>
                <canvas id="budget-utilization-chart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  integrateNavigation() {
    console.log('🧭 Integrating navigation...');
    
    // Add analytics indicator to budget nav item
    const budgetNavItem = document.querySelector('.nav-item[data-section="budget"]');
    if (budgetNavItem) {
      const existingLabel = budgetNavItem.querySelector('.nav-label');
      if (existingLabel && !existingLabel.querySelector('.ai-indicator')) {
        existingLabel.innerHTML += ' <span class="ai-indicator">AI</span>';
      }
    }
  }

  setupEventListeners() {
    console.log('🎧 Setting up event listeners...');
    
    // Listen for section changes to initialize analytics when budget section is shown
    document.addEventListener('sectionChanged', (event) => {
      if (event.detail.section === 'budget') {
        this.onBudgetSectionShown();
      }
    });

    // Listen for data updates to refresh analytics
    document.addEventListener('dataUpdated', (event) => {
      if (event.detail.type === 'expense' || event.detail.type === 'income') {
        this.onDataUpdated();
      }
    });
  }

  async onBudgetSectionShown() {
    console.log('👁️ Budget section shown, initializing analytics...');
    
    if (!this.budgetSection) return;

    try {
      // Initialize budget section if not already done
      await this.budgetSection.initialize();
      
      // Show export button if we have a report
      const exportBtn = document.getElementById('export-budget-report');
      if (exportBtn && this.budgetSection.budgetUI && this.budgetSection.budgetUI.currentReport) {
        exportBtn.style.display = 'inline-flex';
      }
      
    } catch (error) {
      console.error('❌ Error initializing budget analytics:', error);
    }
  }

  async onDataUpdated() {
    console.log('🔄 Data updated, checking if analytics need refresh...');
    
    // If analytics are currently displayed, offer to refresh
    const resultsContainer = document.getElementById('budget-analysis-results');
    if (resultsContainer && !resultsContainer.classList.contains('hidden')) {
      this.showRefreshOption();
    }
  }

  showRefreshOption() {
    // Show a subtle notification that data has changed
    if (window.app && window.app.ui) {
      window.app.ui.showAlert('💡 Datos actualizados. Regenera el análisis para ver cambios.', 'info');
    }
  }

  showIntegrationSuccess() {
    if (window.app && window.app.ui) {
      window.app.ui.showAlert('🚀 Sistema de Análisis Presupuestario con IA integrado exitosamente', 'success');
    }
  }

  showIntegrationError(error) {
    if (window.app && window.app.ui) {
      window.app.ui.showAlert('❌ Error al integrar el sistema de análisis presupuestario', 'error');
    }
  }

  // Public API
  async generateQuickAnalysis() {
    if (!this.budgetSection) return null;
    
    const userId = window.app?.auth?.getCurrentUserId();
    if (!userId) return null;
    
    return await this.budgetSection.generateQuickAnalysis(userId);
  }

  async generateFullReport(options = {}) {
    if (!this.budgetSection) return null;
    
    const userId = window.app?.auth?.getCurrentUserId();
    if (!userId) return null;
    
    return await this.budgetSection.generateFullReport(userId, options);
  }

  // Integration status
  isReady() {
    return this.isIntegrated && this.budgetSection && this.budgetSection.isInitialized;
  }
}

// Auto-integrate when main app is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for main app to be ready
  const waitForApp = () => {
    return new Promise((resolve) => {
      if (window.app && window.app.auth) {
        resolve();
      } else {
        setTimeout(() => waitForApp().then(resolve), 100);
      }
    });
  };

  await waitForApp();
  
  // Create and integrate budget analytics
  const budgetIntegration = new BudgetIntegration();
  await budgetIntegration.integrate();
  
  // Make available globally
  window.budgetIntegration = budgetIntegration;
});