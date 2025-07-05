@@ .. @@
  constructor() {
    this.data = {
      expenses: {},
      income: {},
      extraIncomes: {},
      goals: [],
      categories: this.getDefaultCategories(),
      achievements: [],
      recurringExpenses: [],
      limits: {}
    };
  }

@@ .. @@
        if (!this.data.categories) this.data.categories = this.getDefaultCategories();
        if (!this.data.achievements) this.data.achievements = [];
        if (!this.data.recurringExpenses) this.data.recurringExpenses = [];
        if (!this.data.limits) this.data.limits = {};
        
      } catch (error) {