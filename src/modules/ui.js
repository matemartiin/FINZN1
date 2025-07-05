@@ .. @@
   updateCategoryOptions(categories) {
     const select = document.getElementById('expense-category');
     if (!select) return;
     
     select.innerHTML = '<option value="">Selecciona una categoría</option>';
     
     categories.forEach(category => {
       const option = document.createElement('option');
       option.value = category.name;
       option.textContent = `${category.icon} ${category.name}`;
       select.appendChild(option);
     });
   }

+  updateLimitCategoryOptions(categories) {
+    const select = document.getElementById('limit-category');
+    if (!select) return;
+    
+    select.innerHTML = '<option value="">Selecciona una categoría</option>';
+    
+    categories.forEach(category => {
+      const option = document.createElement('option');
+      option.value = category.name;
+      option.textContent = `${category.icon} ${category.name}`;
+      select.appendChild(option);
+    });
+  }
+
+  updateLimitsList(limits, month, limitsManager) {
+    const container = document.getElementById('limits-list');
+    if (!container) return;
+    
+    container.innerHTML = '';
+
+    if (Object.keys(limits).length === 0) {
+      container.innerHTML = '<p class="text-center text-muted">No hay límites establecidos</p>';
+      return;
+    }

+    Object.entries(limits).forEach(([categoryName, limit]) => {
+      const progress = limitsManager.getLimitProgress(categoryName, month);
+      if (!progress) return;
+
+      const item = document.createElement('div');
+      item.className = `limit-item limit-${progress.status} fade-in`;
+      
+      const statusIcon = this.getLimitStatusIcon(progress.status);
+      const statusText = this.getLimitStatusText(progress.status);
+      
+      item.innerHTML = `
+        <div class="limit-header">
+          <div class="limit-category">
+            <span class="limit-icon">${this.getCategoryInfo(categoryName).icon}</span>
+            <span class="limit-name">${categoryName}</span>
+          </div>
+          <div class="limit-status">
+            <span class="limit-status-icon">${statusIcon}</span>
+            <span class="limit-status-text">${statusText}</span>
+          </div>
+          <button class="limit-delete" onclick="window.app?.limits.deleteLimit('${categoryName}', '${month}'); window.app?.updateUI();" title="Eliminar límite">×</button>
+        </div>
+        
+        <div class="limit-amounts">
+          <div class="limit-spent">
+            <span class="limit-label">Gastado:</span>
+            <span class="limit-value">${this.formatCurrency(progress.currentSpent)}</span>
+          </div>
+          <div class="limit-total">
+            <span class="limit-label">Límite:</span>
+            <span class="limit-value">${this.formatCurrency(progress.limitAmount)}</span>
+          </div>
+          <div class="limit-remaining">
+            <span class="limit-label">Restante:</span>
+            <span class="limit-value ${progress.remaining <= 0 ? 'limit-exceeded' : ''}">${this.formatCurrency(progress.remaining)}</span>
+          </div>
+        </div>
+        
+        <div class="limit-progress-container">
+          <div class="limit-progress-bar">
+            <div class="limit-progress-fill limit-progress-${progress.status}" style="width: ${Math.min(progress.percentage, 100)}%"></div>
+          </div>
+          <div class="limit-percentage">${progress.percentage}%</div>
+        </div>
+      `;
+      
+      container.appendChild(item);
+    });
+  }
+
+  getLimitStatusIcon(status) {
+    const icons = {
+      'safe': '✅',
+      'caution': '⚠️',
+      'warning': '🔶',
+      'critical': '🔥',
+      'exceeded': '🚨'
+    };
+    return icons[status] || '📊';
+  }
+
+  getLimitStatusText(status) {
+    const texts = {
+      'safe': 'Seguro',
+      'caution': 'Precaución',
+      'warning': 'Advertencia',
+      'critical': 'Crítico',
+      'exceeded': 'Excedido'
+    };
+    return texts[status] || 'Normal';
+  }
+
   updateIncomeDisplay(income) {