@@ .. @@
 import { ReportManager } from './modules/reports.js';
 import { ThemeManager } from './modules/theme.js';
 import { NavigationManager } from './modules/navigation.js';
+import { DeveloperManager } from './modules/developer.js';

 class FinznApp {
   constructor() {
   }
 }
@@ .. @@
     this.theme = new ThemeManager();
     this.navigation = new NavigationManager();
+    this.developer = new DeveloperManager();
     
     this.currentMonth = this.getCurrentMonth();
@@ .. @@
   async init() {
     // Initialize theme first
     this.theme.init();
     
   }
+    // Initialize developer mode
+    this.developer.init();
+    
     // Initialize navigation
     this.navigation.init();
@@ .. @@