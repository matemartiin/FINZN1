export class ContextualBarManager {
  constructor() {
    this.currentMonth = this.getCurrentMonth();
    this.currentCategory = 'all';
    this.searchTerm = '';
    this.isVisible = false;
    this.sectionsWithBar = ['transactions', 'reports', 'charts'];
  }

  init() {
    console.log('📊 Initializing Contextual Bar Manager...');
    this.createContextualBar();
    this.setupEventListeners();
    this.updateVisibility();
  }

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  createContextualBar() {
    // Check if bar already exists
    if (document.getElementById('contextual-bar')) {
      return;
    }

    const contextualBar = document.createElement('div');
    contextualBar.id = 'contextual-bar';
    contextualBar.className = 'contextual-bar hidden';
    
    contextualBar.innerHTML = `
      <div class="contextual-bar-content">
        <div class="contextual-filters">
          <div class="filter-group">
            <label class="filter-label">📅 Mes:</label>
            <select id="month-selector" class="filter-select">
              ${this.generateMonthOptions()}
            </select>
          </div>
          
          <div class="filter-separator">·</div>
          
          <div class="filter-group">
            <label class="filter-label">🏷️ Categoría:</label>
            <select id="category-filter" class="filter-select">
              <option value="all">Todas</option>
            </select>
          </div>
          
          <div class="filter-separator mobile-hidden">·</div>
          
          <div class="filter-group search-group mobile-full">
            <label class="filter-label mobile-hidden">🔍</label>
            <input 
              type="text" 
              id="search-filter" 
              class="filter-search" 
              placeholder="Buscar transacciones..."
              value=""
            >
          </div>
        </div>
        
        <div class="contextual-actions">
          <button id="clear-filters" class="clear-filters-btn" title="Limpiar filtros">
            <span class="clear-icon">✕</span>
          </button>
        </div>
      </div>
    `;

    // Insert after header
    const header = document.querySelector('.header');
    if (header) {
      header.insertAdjacentElement('afterend', contextualBar);
    } else {
      document.body.insertBefore(contextualBar, document.body.firstChild);
    }

    // Set current month
    const monthSelector = document.getElementById('month-selector');
    if (monthSelector) {
      monthSelector.value = this.currentMonth;
    }

    // Load categories
    this.loadCategories();
  }

  generateMonthOptions() {
    const options = [];
    const currentDate = new Date();
    
    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      const isSelected = monthKey === this.currentMonth ? 'selected' : '';
      options.push(`<option value="${monthKey}" ${isSelected}>${monthName}</option>`);
    }
    
    return options.join('');
  }

  async loadCategories() {
    try {
      if (window.app && window.app.data) {
        const categories = window.app.data.getCategories();
        const categoryFilter = document.getElementById('category-filter');
        
        if (categoryFilter && categories) {
          // Clear existing options except "Todas"
          categoryFilter.innerHTML = '<option value="all">Todas</option>';
          
          // Add category options
          categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = `${category.icon} ${category.name}`;
            categoryFilter.appendChild(option);
          });
        }
      }
    } catch (error) {
      console.error('Error loading categories for contextual bar:', error);
    }
  }

  setupEventListeners() {
    // Month selector
    const monthSelector = document.getElementById('month-selector');
    if (monthSelector) {
      monthSelector.addEventListener('change', (e) => {
        this.currentMonth = e.target.value;
        this.onFiltersChange();
      });
    }

    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        this.currentCategory = e.target.value;
        this.onFiltersChange();
      });
    }

    // Search filter
    const searchFilter = document.getElementById('search-filter');
    if (searchFilter) {
      let searchTimeout;
      searchFilter.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.searchTerm = e.target.value.trim();
          this.onFiltersChange();
        }, 300);
      });
    }

    // Clear filters
    const clearFilters = document.getElementById('clear-filters');
    if (clearFilters) {
      clearFilters.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }

    // Listen for navigation changes
    if (window.app && window.app.navigation) {
      // Hook into navigation events
      const originalShowSection = window.app.navigation.showSection;
      window.app.navigation.showSection = (sectionName) => {
        originalShowSection.call(window.app.navigation, sectionName);
        setTimeout(() => {
          this.updateVisibility(sectionName);
        }, 100);
      };
    }
  }

  onFiltersChange() {
    console.log('📊 Contextual filters changed:', {
      month: this.currentMonth,
      category: this.currentCategory,
      search: this.searchTerm
    });

    // Update data manager if available
    if (window.app && window.app.data) {
      window.app.data.currentMonth = this.currentMonth;
    }

    // Trigger updates based on current section
    const currentSection = this.getCurrentSection();
    
    if (currentSection === 'transactions') {
      this.updateTransactionsView();
    } else if (currentSection === 'reports') {
      this.updateReportsView();
    } else if (currentSection === 'charts') {
      this.updateChartsView();
    }

    // Update clear button visibility
    this.updateClearButtonVisibility();
  }

  async updateTransactionsView() {
    try {
      if (window.app && window.app.data && window.app.ui) {
        // Load expenses for selected month
        await window.app.data.loadExpenses(this.currentMonth);
        
        // Update UI
        if (window.app.ui.updateExpensesList) {
          window.app.ui.updateExpensesList();
        }
        
        // Update balance
        if (window.app.ui.updateBalance) {
          window.app.ui.updateBalance();
        }
      }
    } catch (error) {
      console.error('Error updating transactions view:', error);
    }
  }

  async updateReportsView() {
    try {
      // Trigger reports update if in reports section
      if (window.app && window.app.ui && window.app.ui.updateReportsData) {
        window.app.ui.updateReportsData();
      }
    } catch (error) {
      console.error('Error updating reports view:', error);
    }
  }

  async updateChartsView() {
    try {
      if (window.app && window.app.charts && window.app.data) {
        // Update charts with new month data
        const expenses = window.app.data.getExpenses(this.currentMonth);
        const categoryData = window.app.data.getExpensesByCategory(this.currentMonth);
        
        if (window.app.charts.updateExpensesChart) {
          window.app.charts.updateExpensesChart(categoryData);
        }
        
        // Update trend chart
        const trendData = await window.app.data.getTrendData();
        if (window.app.charts.updateTrendChart) {
          window.app.charts.updateTrendChart(trendData);
        }
      }
    } catch (error) {
      console.error('Error updating charts view:', error);
    }
  }

  clearAllFilters() {
    // Reset to current month
    this.currentMonth = this.getCurrentMonth();
    this.currentCategory = 'all';
    this.searchTerm = '';

    // Update UI elements
    const monthSelector = document.getElementById('month-selector');
    const categoryFilter = document.getElementById('category-filter');
    const searchFilter = document.getElementById('search-filter');

    if (monthSelector) monthSelector.value = this.currentMonth;
    if (categoryFilter) categoryFilter.value = 'all';
    if (searchFilter) searchFilter.value = '';

    // Trigger update
    this.onFiltersChange();
  }

  updateClearButtonVisibility() {
    const clearButton = document.getElementById('clear-filters');
    if (!clearButton) return;

    const hasFilters = 
      this.currentMonth !== this.getCurrentMonth() ||
      this.currentCategory !== 'all' ||
      this.searchTerm !== '';

    if (hasFilters) {
      clearButton.classList.add('visible');
    } else {
      clearButton.classList.remove('visible');
    }
  }

  getCurrentSection() {
    const activeSection = document.querySelector('.dashboard-section.active');
    if (activeSection) {
      return activeSection.id.replace('-section', '');
    }
    return null;
  }

  updateVisibility(sectionName = null) {
    const contextualBar = document.getElementById('contextual-bar');
    if (!contextualBar) return;

    const currentSection = sectionName || this.getCurrentSection();
    const shouldShow = this.sectionsWithBar.includes(currentSection);

    if (shouldShow && !this.isVisible) {
      contextualBar.classList.remove('hidden');
      contextualBar.classList.add('visible');
      this.isVisible = true;
      
      // Reload categories when showing
      this.loadCategories();
    } else if (!shouldShow && this.isVisible) {
      contextualBar.classList.add('hidden');
      contextualBar.classList.remove('visible');
      this.isVisible = false;
    }
  }

  // Public methods for external access
  getCurrentMonth() {
    return this.currentMonth;
  }

  getCurrentCategory() {
    return this.currentCategory;
  }

  getCurrentSearch() {
    return this.searchTerm;
  }

  setMonth(month) {
    this.currentMonth = month;
    const monthSelector = document.getElementById('month-selector');
    if (monthSelector) {
      monthSelector.value = month;
    }
    this.onFiltersChange();
  }

  setCategory(category) {
    this.currentCategory = category;
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
      categoryFilter.value = category;
    }
    this.onFiltersChange();
  }

  setSearch(search) {
    this.searchTerm = search;
    const searchFilter = document.getElementById('search-filter');
    if (searchFilter) {
      searchFilter.value = search;
    }
    this.onFiltersChange();
  }
}