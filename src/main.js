@@ .. @@
   async init() {
     // Initialize theme first
     this.theme.init();
     
+    // Set currentMonth based on developer mode
+    const isDeveloper = this.auth.isDeveloperMode();
+    this.currentMonth = this.getCurrentMonth(isDeveloper);
+    
     // Initialize navigation
     this.navigation.init();
     
@@ .. @@
     // Update user info
     const currentUser = this.auth.getCurrentUser();
-    document.getElementById('user-name').textContent = `👤 ${currentUser}`;
+    const isDeveloper = this.auth.isDeveloperMode();
+    const userDisplayName = isDeveloper ? `👤 ${currentUser} 🔧` : `👤 ${currentUser}`;
+    document.getElementById('user-name').textContent = userDisplayName;
     
     // Initialize month selector
     this.initMonthSelector();
@@ .. @@
   initMonthSelector() {
     const select = document.getElementById('month-select');
+    const isDeveloper = this.auth.isDeveloperMode();
+    
     select.innerHTML = '';
     
     const currentDate = new Date();
     const currentYear = currentDate.getFullYear();
+    const currentMonth = `${currentYear}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
     
-    // Generate options for current year and next year
-    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
-      for (let month = 1; month <= 12; month++) {
-        const value = `${year}-${month.toString().padStart(2, '0')}`;
-        const option = document.createElement('option');
-        option.value = value;
-        option.textContent = new Date(year, month - 1).toLocaleDateString('es-ES', { 
-          year: 'numeric', 
-          month: 'long' 
-        });
-        select.appendChild(option);
+    if (isDeveloper) {
+      // Generate options for current year -1 to current year +1 for developer
+      for (let year = currentYear - 1; year <= currentYear + 1; year++) {
+        for (let month = 1; month <= 12; month++) {
+          const value = `${year}-${month.toString().padStart(2, '0')}`;
+          const option = document.createElement('option');
+          option.value = value;
+          option.textContent = new Date(year, month - 1).toLocaleDateString('es-ES', { 
+            year: 'numeric', 
+            month: 'long' 
+          });
+          select.appendChild(option);
+        }
       }
+      select.disabled = false;
+    } else {
+      // Only show current month for non-developer
+      const option = document.createElement('option');
+      option.value = currentMonth;
+      option.textContent = new Date(currentDate.getFullYear(), currentDate.getMonth()).toLocaleDateString('es-ES', { 
+        year: 'numeric', 
+        month: 'long' 
+      });
+      select.appendChild(option);
+      select.disabled = true; // Disable selection
     }
     
     select.value = this.currentMonth;
@@ .. @@
   handleMonthChange(e) {
     const previousMonth = this.currentMonth;
     this.currentMonth = e.target.value;
     
+    // If not in developer mode, force current month
+    if (!this.auth.isDeveloperMode()) {
+      this.currentMonth = this.getCurrentMonth(true); // Force to actual current month
+      e.target.value = this.currentMonth; // Update selector display
+    }
+    
     // Save previous month's balance as savings if it's a valid previous month
     if (previousMonth && previousMonth !== this.currentMonth) {
       this.savePreviousMonthBalance(previousMonth);
@@ .. @@
     this.ui.updateCategoryOptions(this.data.getCategories());
   }

-  getCurrentMonth() {
+  getCurrentMonth(forceActual = true) {
     const now = new Date();
-    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
+    if (forceActual || !this.auth.isDeveloperMode()) {
+      return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
+    } else {
+      return this.currentMonth || `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
+    }
   }