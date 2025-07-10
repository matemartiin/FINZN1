@@ .. @@
     // Income modal tab switching
     this.setupIncomeModalTabs();
+    
+    // Extra incomes indicator
+    this.setupExtraIncomesIndicator();
   }

@@ .. @@
     document.getElementById('add-extra-income-btn').addEventListener('click', () => {
       console.log('🔥 Extra income button clicked');
       this.modals.show('extra-income-modal');
     });
+    document.getElementById('extra-incomes-indicator').addEventListener('click', () => this.showExtraIncomesModal());
+    document.getElementById('add-extra-income-from-modal').addEventListener('click', () => {
+      this.modals.hide('extra-incomes-modal');
+      this.modals.show('extra-income-modal');
+    });
     document.getElementById('extra-income-form').addEventListener('submit', (e) => this.handleExtraIncome(e));