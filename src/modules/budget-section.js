import { BudgetManager } from './budget-manager.js';
import { BudgetUI } from './budget-ui.js';

export class BudgetSection {
  constructor() {
    this.budgetManager = null;
    this.budgetUI = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    console.log('🏗️ Initializing Budget Section (Phase 1)...');

    try {
      // Initialize budget manager
      this.budgetManager = new BudgetManager();
      await this.budgetManager.initialize();

      // Initialize budget UI
      this.budgetUI = new BudgetUI();
      await this.budgetUI.initialize();

      this.isInitialized = true;
      console.log('✅ Budget Section Phase 1 initialized successfully');

      // Show initialization success
      this.showInitializationSuccess();

    } catch (error) {
      console.error('❌ Error initializing Budget Section:', error);
      this.showInitializationError(error);
      throw error;
    }
  }

  showInitializationSuccess() {
    if (window.app && window.app.ui) {
      window.app.ui.showAlert('🚀 Sistema de Análisis Presupuestario con IA activado', 'success');
    }
  }

  showInitializationError(error) {
    if (window.app && window.app.ui) {
      window.app.ui.showAlert('❌ Error al inicializar el sistema de análisis presupuestario', 'error');
    }
  }

  // Public API methods
  async generateQuickAnalysis(userId) {
    if (!this.isInitialized) await this.initialize();
    return await this.budgetManager.getQuickInsights(userId);
  }

  async generateFullReport(userId, options = {}) {
    if (!this.isInitialized) await this.initialize();
    return await this.budgetManager.generateComprehensiveBudgetReport(userId, options);
  }

  async getBudgetAnalytics(userId, period = 'current') {
    if (!this.isInitialized) await this.initialize();
    return await this.budgetManager.getBudgetAnalytics(userId, period);
  }

  async getBudgetIntelligence(userId, period = 'current') {
    if (!this.isInitialized) await this.initialize();
    return await this.budgetManager.getBudgetIntelligence(userId, period);
  }

  // Integration methods for main app
  async integrateWithMainApp() {
    console.log('🔗 Integrating Budget Section with main app...');

    // Add to window for global access
    window.budgetSection = this;

    // Initialize when user is authenticated
    if (window.app && window.app.auth && window.app.auth.isAuthenticated()) {
      await this.initialize();
    }

    console.log('✅ Budget Section integrated with main app');
  }
}

// Auto-initialize when module is loaded
document.addEventListener('DOMContentLoaded', async () => {
  if (window.app) {
    const budgetSection = new BudgetSection();
    await budgetSection.integrateWithMainApp();
  }
});