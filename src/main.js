@@ .. @@
 import { ReportManager } from './modules/reports.js';
 import { ThemeManager } from './modules/theme.js';
 import { NavigationManager } from './modules/navigation.js';
+import { LimitsManager } from './modules/limits.js';

 class FinznApp {
   constructor() {
     this.auth = new AuthManager();
     this.data = new DataManager();
     this.ui = new UIManager();
     this.charts = new ChartManager();
     this.modals = new ModalManager();
     this.chat = new ChatManager();
     this.reports = new ReportManager();
    this.ui.updateLimitsList(this.limits.getAllLimits(this.currentMonth), this.currentMonth, this.limits);
     this.theme = new ThemeManager();
     this.navigation = new NavigationManager();
+    this.limits = new LimitsManager(this.data, this.ui);
    
    // Limits management
    this.ui.updateCategoryOptions(this.data.getCategories());
    this.ui.updateLimitCategoryOptions(this.data.getCategories());
    document.getElementById('limit-form').addEventListener('submit', (e) => this.handleAddLimit(e));
     
     this.currentMonth = this.getCurrentMonth();
     this.currentExpenseId = null; // For editing expenses