@@ .. @@
   constructor() {
     this.data = {
       expenses: {},
       income: {},
       extraIncomes: {},
       goals: [],
       categories: this.getDefaultCategories(),
       achievements: [],
-      recurringExpenses: []
+      recurringExpenses: [],
+      categoryLimits: {}
     };
   }
  async setCategoryLimit(category, limit, month) {
    if (!this.data.categoryLimits[month]) {
      this.data.categoryLimits[month] = {};
    }
    this.data.categoryLimits[month][category] = limit;
    this.saveUserData();
  }

  getCategoryLimit(category, month) {
    return this.data.categoryLimits[month]?.[category] || 0;
  }

  getCategoryLimits(month) {
    return this.data.categoryLimits[month] || {};
  }

  checkCategoryLimitWarning(category, month) {
    const limit = this.getCategoryLimit(category, month);
    if (limit === 0) return null;

    const spent = this.getExpensesByCategory(month)[category] || 0;
    const percentage = (spent / limit) * 100;

    if (percentage >= 100) {
      return {
        type: 'exceeded',
        message: `¡Has superado el límite de ${category}! Gastaste ${this.formatCurrency(spent)} de ${this.formatCurrency(limit)}`,
        percentage: Math.round(percentage)
      };
    } else if (percentage >= 80) {
      return {
        type: 'warning',
        message: `¡Cuidado! Estás cerca del límite en ${category}. Gastaste ${this.formatCurrency(spent)} de ${this.formatCurrency(limit)} (${Math.round(percentage)}%)`,
        percentage: Math.round(percentage)
      };
    }
    
    return null;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
