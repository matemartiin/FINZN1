import { AuthManager } from './modules/auth.js';
import { DataManager } from './modules/data.js';
import { UIManager } from './modules/ui.js';
import { NavigationManager } from './modules/navigation.js';
import { ModalManager } from './modules/modals.js';
import { ChartManager } from './modules/charts.js';
import { ThemeManager } from './modules/theme.js';
import { UserProfileManager } from './modules/user-profile.js';
import { BudgetManager } from './modules/budget.js';
import { AIBudgetManager } from './modules/ai-budget.js';
import { ReportManager } from './modules/reports.js';
import { CalendarManager } from './modules/calendar.js';
import { ChatManager } from './modules/chat.js';
import { ContextualBarManager } from './modules/contextual-bar.js';

class FinznApp {
  constructor() {
    this.auth = new AuthManager();
    this.data = new DataManager();
    this.ui = new UIManager();
    this.navigation = new NavigationManager();
    this.modals = new ModalManager();
    this.charts = new ChartManager();
    this.theme = new ThemeManager();
    this.userProfile = new UserProfileManager();
    this.budget = new BudgetManager();
    this.aiBudget = new AIBudgetManager();
    this.reports = new ReportManager();
    this.calendar = new CalendarManager();
    this.chat = new ChatManager();
    this.contextualBar = new ContextualBarManager();
  }

  async init() {
    try {
      console.log('🚀 Initializing FINZN App...');
      
      // Initialize theme first
      this.theme.init();
      
      // Initialize authentication
      await this.auth.initializeAuth();
      
      // Initialize user profile
      await this.userProfile.init();
      
      // Initialize navigation and modals
      this.navigation.init();
      this.modals.init();
      this.modals.setupBudgetModalEvents();
      
      // Initialize contextual bar
      this.contextualBar.init();
      
      // Initialize UI components
      await this.ui.init();
      
      // Initialize other managers
      this.calendar.init();
      this.chat.init();
      
      console.log('✅ FINZN App initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing FINZN App:', error);
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  window.app = new FinznApp();
  await window.app.init();
});