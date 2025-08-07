import { SmartBudgetManager } from './smart-budget.js';
import { BudgetUIManager } from './budget-ui.js';

export class BudgetIntegrationManager {
  constructor() {
    this.smartBudget = new SmartBudgetManager();
    this.budgetUI = new BudgetUIManager();
    this.isInitialized = false;
  }

  // ===== INTEGRACIÓN CON LA APLICACIÓN PRINCIPAL =====
  async initializeBudgetSystem() {
    try {
      console.log('🧠 Initializing Smart Budget System...');
      
      if (this.isInitialized) {
        console.log('Budget system already initialized');
        return;
      }

      // Initialize components
      await this.setupBudgetSection();
      await this.integrateWithExistingData();
      await this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('✅ Smart Budget System initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing budget system:', error);
      throw error;
    }
  }

  async setupBudgetSection() {
    // Find or create budget section in the existing navigation
    const budgetSection = document.getElementById('budget-section');
    if (!budgetSection) {
      console.error('Budget section not found in DOM');
      return;
    }

    // Clear existing content and render smart budget interface
    const sectionContent = budgetSection.querySelector('.section-content');
    if (sectionContent) {
      // Update section header
      const sectionHeader = sectionContent.querySelector('.section-header');
      if (sectionHeader) {
        sectionHeader.innerHTML = `
          <h1>🧠 Presupuesto Inteligente</h1>
          <div class="section-actions">
            <button id="create-smart-budget-btn" class="btn btn-primary">
              <span>✨</span>
              Crear Presupuesto IA
            </button>
            <button id="budget-insights-btn" class="btn btn-secondary">
              <span>📊</span>
              Insights IA
            </button>
          </div>
        `;
      }

      // Create container for smart budget content
      let budgetContainer = sectionContent.querySelector('.budget-container');
      if (!budgetContainer) {
        budgetContainer = document.createElement('div');
        budgetContainer.className = 'budget-container';
        sectionContent.appendChild(budgetContainer);
      }

      // Render the smart budget interface
      this.budgetUI.renderSmartBudgetInterface(budgetContainer);
    }
  }

  async integrateWithExistingData() {
    try {
      const userId = window.app?.auth?.getCurrentUserId();
      if (!userId) return;

      console.log('🔄 Integrating with existing financial data...');

      // Get existing spending limits and convert to smart budget suggestions
      const existingLimits = window.app?.data?.getSpendingLimits() || [];
      
      if (existingLimits.length > 0) {
        await this.convertSpendingLimitsToSmartBudget(userId, existingLimits);
      }

      // Analyze existing expenses for patterns
      const currentMonth = this.getCurrentMonth();
      const expenses = await window.app?.data?.loadExpenses(currentMonth) || [];
      
      if (expenses.length > 0) {
        await this.analyzeExistingExpenses(userId, expenses);
      }

      console.log('✅ Data integration completed');
    } catch (error) {
      console.error('❌ Error integrating existing data:', error);
    }
  }

  async convertSpendingLimitsToSmartBudget(userId, limits) {
    try {
      console.log('🔄 Converting spending limits to smart budget...');
      
      const categories = {};
      let totalAmount = 0;

      limits.forEach(limit => {
        categories[limit.category] = limit.amount;
        totalAmount += limit.amount;
      });

      // Check if smart budget already exists
      const existingBudgets = await this.getExistingSmartBudgets(userId);
      
      if (existingBudgets.length === 0) {
        // Create smart budget based on existing limits
        const budgetData = {
          name: 'Presupuesto Inteligente Automático',
          totalAmount,
          categories: Object.keys(categories),
          autoAdjust: true
        };

        await this.smartBudget.createSmartBudget(userId, budgetData);
        console.log('✅ Smart budget created from existing limits');
      }
    } catch (error) {
      console.error('❌ Error converting spending limits:', error);
    }
  }

  async analyzeExistingExpenses(userId, expenses) {
    try {
      console.log('📊 Analyzing existing expenses for patterns...');
      
      // Group expenses by category
      const categoryTotals = {};
      expenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + parseFloat(expense.amount);
      });

      // Store patterns for AI analysis
      await this.storeSpendingPatterns(userId, categoryTotals);
      
      console.log('✅ Expense analysis completed');
    } catch (error) {
      console.error('❌ Error analyzing expenses:', error);
    }
  }

  setupEventListeners() {
    // Create smart budget button
    const createBudgetBtn = document.getElementById('create-smart-budget-btn');
    if (createBudgetBtn) {
      createBudgetBtn.addEventListener('click', () => {
        this.showCreateSmartBudgetModal();
      });
    }

    // Budget insights button
    const insightsBtn = document.getElementById('budget-insights-btn');
    if (insightsBtn) {
      insightsBtn.addEventListener('click', () => {
        this.showBudgetInsightsModal();
      });
    }

    // Listen for navigation changes to update budget data
    document.addEventListener('section-changed', (e) => {
      if (e.detail.section === 'budget') {
        this.refreshBudgetData();
      }
    });

    // Listen for expense additions to update predictions
    document.addEventListener('expense-added', () => {
      this.updatePredictions();
    });

    // Listen for income changes to update budget recommendations
    document.addEventListener('income-updated', () => {
      this.updateRecommendations();
    });
  }

  // ===== MODALES Y INTERFACES =====
  showCreateSmartBudgetModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'create-smart-budget-modal';
    
    modal.innerHTML = `
      <div class="modal-content smart-budget-modal">
        <div class="modal-header">
          <h2>✨ Crear Presupuesto Inteligente</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="smart-budget-wizard">
            <!-- Step 1: Basic Information -->
            <div class="wizard-step active" data-step="1">
              <h3>📋 Información Básica</h3>
              <form id="budget-basic-form">
                <div class="form-group">
                  <label for="budget-name">Nombre del Presupuesto</label>
                  <input type="text" id="budget-name" name="name" 
                         placeholder="Mi Presupuesto Inteligente" required />
                </div>
                <div class="form-group">
                  <label for="budget-period">Período</label>
                  <select id="budget-period" name="period">
                    <option value="monthly">Mensual</option>
                    <option value="weekly">Semanal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="total-budget">Presupuesto Total</label>
                  <input type="number" id="total-budget" name="totalBudget" 
                         step="0.01" min="0" required />
                </div>
              </form>
            </div>

            <!-- Step 2: AI Analysis -->
            <div class="wizard-step" data-step="2">
              <h3>🤖 Análisis con IA</h3>
              <div class="ai-analysis-section">
                <div class="analysis-status">
                  <div class="status-icon">🔍</div>
                  <div class="status-text">
                    <h4>Analizando tus patrones de gasto...</h4>
                    <p>La IA está revisando tu historial financiero para generar recomendaciones personalizadas.</p>
                  </div>
                </div>
                <div id="ai-analysis-results" class="analysis-results hidden">
                  <!-- AI analysis results will be loaded here -->
                </div>
              </div>
            </div>

            <!-- Step 3: Category Allocation -->
            <div class="wizard-step" data-step="3">
              <h3>🏷️ Asignación por Categorías</h3>
              <div class="category-allocation">
                <div class="allocation-header">
                  <p>Basado en tu historial, te sugerimos estas asignaciones:</p>
                  <div class="ai-confidence">
                    <span class="confidence-badge high">Alta confianza</span>
                  </div>
                </div>
                <div id="category-allocations" class="category-allocations">
                  <!-- Category allocations will be loaded here -->
                </div>
                <div class="allocation-summary">
                  <div class="summary-item">
                    <span class="summary-label">Total Asignado:</span>
                    <span id="total-allocated" class="summary-value">$0</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Restante:</span>
                    <span id="remaining-budget" class="summary-value">$0</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 4: Smart Features -->
            <div class="wizard-step" data-step="4">
              <h3>⚡ Características Inteligentes</h3>
              <div class="smart-features">
                <div class="feature-option">
                  <label class="feature-label">
                    <input type="checkbox" id="auto-adjust" name="autoAdjust" checked />
                    <div class="feature-info">
                      <h4>🔄 Ajuste Automático</h4>
                      <p>Permite que la IA ajuste automáticamente tu presupuesto basado en patrones de gasto.</p>
                    </div>
                  </label>
                </div>
                <div class="feature-option">
                  <label class="feature-label">
                    <input type="checkbox" id="predictive-alerts" name="predictiveAlerts" checked />
                    <div class="feature-info">
                      <h4>🚨 Alertas Predictivas</h4>
                      <p>Recibe alertas antes de que superes tu presupuesto, basadas en predicciones de IA.</p>
                    </div>
                  </label>
                </div>
                <div class="feature-option">
                  <label class="feature-label">
                    <input type="checkbox" id="anomaly-detection" name="anomalyDetection" checked />
                    <div class="feature-info">
                      <h4>🔍 Detección de Anomalías</h4>
                      <p>Identifica automáticamente gastos inusuales y patrones anómalos.</p>
                    </div>
                  </label>
                </div>
                <div class="feature-option">
                  <label class="feature-label">
                    <input type="checkbox" id="smart-recommendations" name="smartRecommendations" checked />
                    <div class="feature-info">
                      <h4>💡 Recomendaciones Inteligentes</h4>
                      <p>Obtén sugerencias personalizadas para optimizar tu presupuesto.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions wizard-actions">
          <button id="wizard-prev" class="btn btn-secondary" disabled>Anterior</button>
          <button id="wizard-next" class="btn btn-primary">Siguiente</button>
          <button id="create-budget" class="btn btn-primary hidden">Crear Presupuesto</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.setupWizardEventListeners();
  }

  showBudgetInsightsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'budget-insights-modal';
    
    modal.innerHTML = `
      <div class="modal-content insights-modal">
        <div class="modal-header">
          <h2>📊 Insights de Presupuesto con IA</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="insights-tabs">
            <button class="tab-btn active" data-tab="overview">Resumen</button>
            <button class="tab-btn" data-tab="predictions">Predicciones</button>
            <button class="tab-btn" data-tab="anomalies">Anomalías</button>
            <button class="tab-btn" data-tab="recommendations">Recomendaciones</button>
          </div>
          
          <div class="insights-content">
            <div class="tab-content active" id="overview-tab">
              <div id="insights-overview" class="insights-overview">
                <!-- Overview content will be loaded here -->
              </div>
            </div>
            
            <div class="tab-content" id="predictions-tab">
              <div id="insights-predictions" class="insights-predictions">
                <!-- Predictions content will be loaded here -->
              </div>
            </div>
            
            <div class="tab-content" id="anomalies-tab">
              <div id="insights-anomalies" class="insights-anomalies">
                <!-- Anomalies content will be loaded here -->
              </div>
            </div>
            
            <div class="tab-content" id="recommendations-tab">
              <div id="insights-recommendations" class="insights-recommendations">
                <!-- Recommendations content will be loaded here -->
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary modal-cancel">Cerrar</button>
          <button id="export-insights" class="btn btn-primary">
            <span>📊</span>
            Exportar Insights
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.loadInsightsData();
    this.setupInsightsEventListeners();
  }

  // ===== UTILITY METHODS =====
  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  async getExistingSmartBudgets(userId) {
    try {
      const { data, error } = await supabase
        .from('smart_budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting existing budgets:', error);
      return [];
    }
  }

  async storeSpendingPatterns(userId, patterns) {
    try {
      const patternData = Object.entries(patterns).map(([category, amount]) => ({
        user_id: userId,
        category,
        pattern_type: 'monthly_average',
        period_analyzed: '1month',
        pattern_data: { average_amount: amount },
        confidence_score: 0.8
      }));

      const { error } = await supabase
        .from('spending_patterns')
        .upsert(patternData, {
          onConflict: 'user_id,category,pattern_type,period_analyzed'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing spending patterns:', error);
    }
  }

  async refreshBudgetData() {
    try {
      console.log('🔄 Refreshing budget data...');
      
      const userId = window.app?.auth?.getCurrentUserId();
      if (!userId) return;

      // Refresh budget status
      await this.budgetUI.loadInitialData();
      
      console.log('✅ Budget data refreshed');
    } catch (error) {
      console.error('❌ Error refreshing budget data:', error);
    }
  }

  async updatePredictions() {
    try {
      console.log('🔮 Updating predictions...');
      
      const userId = window.app?.auth?.getCurrentUserId();
      if (!userId) return;

      // Generate new predictions
      const predictions = await this.smartBudget.aiManager.predictFutureExpenses(userId);
      
      // Update UI
      this.budgetUI.renderPredictionsChart(predictions);
      
      console.log('✅ Predictions updated');
    } catch (error) {
      console.error('❌ Error updating predictions:', error);
    }
  }

  async updateRecommendations() {
    try {
      console.log('💡 Updating recommendations...');
      
      const userId = window.app?.auth?.getCurrentUserId();
      if (!userId) return;

      // Generate new recommendations
      const recommendations = await this.smartBudget.aiManager.generateSmartRecommendations(userId);
      
      // Update UI
      this.budgetUI.renderSmartRecommendations(recommendations.recommendations);
      
      console.log('✅ Recommendations updated');
    } catch (error) {
      console.error('❌ Error updating recommendations:', error);
    }
  }

  // Clean up resources
  destroy() {
    if (this.budgetUI) {
      this.budgetUI.destroy();
    }
    
    // Remove event listeners
    document.removeEventListener('section-changed', this.refreshBudgetData);
    document.removeEventListener('expense-added', this.updatePredictions);
    document.removeEventListener('income-updated', this.updateRecommendations);
    
    this.isInitialized = false;
  }
}