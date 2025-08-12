export class ContextualBarManager {
  constructor() {
    this.currentMonth = this._nowMonth();
    this.currentCategory = 'all';
    this.searchTerm = '';
    this.exactDate = ''; // YYYY-MM-DD (vacío = sin filtro de fecha exacta)
    this.isVisible = false;
    this.sectionsWithBar = ['transactions', 'reports', 'charts'];
  }

  init() {
    console.log('📊 Initializing Contextual Bar Manager...');
    this.createContextualBar();
    this.setupEventListeners();
    this.updateVisibility();
  }

  // =========================
  // UI: creación de la barra
  // =========================
  createContextualBar() {
    if (document.getElementById('contextual-bar')) return;

    const contextualBar = document.createElement('div');
    contextualBar.id = 'contextual-bar';
    contextualBar.className = 'contextual-bar hidden';

    contextualBar.innerHTML = `
      <div class="contextual-bar-content">
        <div class="contextual-filters">

          <div class="filter-group">
            <label class="filter-label">📅 Mes:</label>
            <select id="month-selector" class="filter-select">
              ${this._generateMonthOptions()}
            </select>
          </div>

          <div class="filter-separator">·</div>

          <div class="filter-group">
            <label class="filter-label">📆 Fecha:</label>
            <input id="date-filter" type="date" class="filter-select" />
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

    const header = document.querySelector('.header');
    if (header) {
      header.insertAdjacentElement('afterend', contextualBar);
    } else {
      document.body.insertBefore(contextualBar, document.body.firstChild);
    }

    // Set valores iniciales UI
    const monthSelector = document.getElementById('month-selector');
    if (monthSelector) monthSelector.value = this.currentMonth;

    const dateFilter = document.getElementById('date-filter');
    if (dateFilter) dateFilter.value = this.exactDate;

    // Cargar categorías
    this._loadCategories();
  }

  // =========================
  // Listeners
  // =========================
  setupEventListeners() {
    const monthSelector = document.getElementById('month-selector');
    if (monthSelector) {
      monthSelector.addEventListener('change', (e) => {
        this.currentMonth = e.target.value;
        // Al cambiar de mes, limpiamos fecha exacta si queda fuera del mes
        if (this.exactDate && this.exactDate.slice(0, 7) !== this.currentMonth) {
          this.exactDate = '';
          const dateFilter = document.getElementById('date-filter');
          if (dateFilter) dateFilter.value = '';
        }
        this.onFiltersChange();
      });
    }

    const dateFilter = document.getElementById('date-filter');
    if (dateFilter) {
      dateFilter.addEventListener('change', (e) => {
        this.exactDate = (e.target.value || '').trim();
        // Si hay fecha, sincronizamos el mes del selector
        if (this.exactDate) {
          const monthFromDate = this.exactDate.slice(0, 7);
          if (monthFromDate !== this.currentMonth) {
            this.currentMonth = monthFromDate;
            const monthSel = document.getElementById('month-selector');
            if (monthSel) monthSel.value = monthFromDate;
          }
        }
        this.onFiltersChange();
      });
    }

    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        this.currentCategory = e.target.value;
        this.onFiltersChange();
      });
    }

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

    const clearFilters = document.getElementById('clear-filters');
    if (clearFilters) {
      clearFilters.addEventListener('click', () => this.clearAllFilters());
    }

    // Hook navegación para mostrar/ocultar barra
    if (window.app && window.app.navigation) {
      const originalShowSection = window.app.navigation.showSection;
      window.app.navigation.showSection = (sectionName) => {
        originalShowSection.call(window.app.navigation, sectionName);
        setTimeout(() => this.updateVisibility(sectionName), 100);
      };
    }
  }

  // =========================
  // Reacción a cambios
  // =========================
  onFiltersChange() {
    console.log('📊 Contextual filters changed:', {
      month: this.currentMonth,
      date: this.exactDate || '(sin fecha)',
      category: this.currentCategory,
      search: this.searchTerm
    });

    // Sincronizar month con DataManager para otras vistas que lo lean
    if (window.app?.data) window.app.data.currentMonth = this.currentMonth;

    const currentSection = this._getCurrentSection();
    if (currentSection === 'transactions') {
      this.updateTransactionsView();
    } else if (currentSection === 'reports') {
      this.updateReportsView();
    } else if (currentSection === 'charts') {
      this.updateChartsView();
    }

    this._updateClearButtonVisibility();
  }

  async updateTransactionsView() {
    try {
      if (!window.app?.data || !window.app?.ui) return;

      // 1) Cargar datos del mes seleccionado
      const expenses = await window.app.data.loadExpenses(this.currentMonth);
      const income = await window.app.data.loadIncome(this.currentMonth); // { fixed, extra }
      const extraIncomes = await window.app.data.loadExtraIncomes(this.currentMonth);

      // 2) Filtrar
      const filteredExpenses = this._filterExpenses(expenses);
      const filteredExtraIncomes = this._filterExtraIncomes(extraIncomes);
      const fixedShown = this._fixedIncomePassesFilters() ? (parseFloat(income.fixed) || 0) : 0;

      // 3) Totales de ingresos respetando filtros
      const extraSum = filteredExtraIncomes.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
      const incomeForUI = { fixed: fixedShown, extra: extraSum };

      // 4) Render
      window.app.ui.updateExpensesList?.(filteredExpenses, window.app);
      window.app.ui.updateIncomeDetails?.(incomeForUI, filteredExtraIncomes);
      // Si tenés lista separada de ingresos:
      window.app.ui.updateIncomeList?.(filteredExtraIncomes, incomeForUI);

      // 5) (Opcional) balance del header con filtros
      if (window.app.ui.updateBalance) {
        const totalExpenses = filteredExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
        const totalIncome = incomeForUI.fixed + incomeForUI.extra;
        const available = totalIncome - totalExpenses;
        const installments = filteredExpenses.filter(e => (e.total_installments || e.totalInstallments || 1) > 1).length;

        window.app.ui.updateBalance({
          totalIncome,
          totalExpenses,
          available,
          installments
        });
      }

      // 6) Badge (si lo usás para contar)
      const badge = document.getElementById('pending-transactions');
      if (badge) badge.textContent = filteredExpenses.length.toString();
    } catch (error) {
      console.error('Error updating transactions view:', error);
    }
  }

  async updateReportsView() {
    try {
      window.app?.ui?.updateReportsData?.();
    } catch (error) {
      console.error('Error updating reports view:', error);
    }
  }

  async updateChartsView() {
    try {
      if (!window.app?.charts || !window.app?.data) return;

      const categoryData = window.app.data.getExpensesByCategory(this.currentMonth);
      window.app.charts.updateExpensesChart?.(categoryData);

      const trendData = await window.app.data.getTrendData();
      window.app.charts.updateTrendChart?.(trendData);
    } catch (error) {
      console.error('Error updating charts view:', error);
    }
  }

  clearAllFilters() {
    this.currentMonth = this._nowMonth();
    this.currentCategory = 'all';
    this.searchTerm = '';
    this.exactDate = '';

    const monthSelector = document.getElementById('month-selector');
    const categoryFilter = document.getElementById('category-filter');
    const searchFilter = document.getElementById('search-filter');
    const dateFilter = document.getElementById('date-filter');

    if (monthSelector) monthSelector.value = this.currentMonth;
    if (categoryFilter) categoryFilter.value = 'all';
    if (searchFilter) searchFilter.value = '';
    if (dateFilter) dateFilter.value = '';

    this.onFiltersChange();
  }

  _updateClearButtonVisibility() {
    const clearButton = document.getElementById('clear-filters');
    if (!clearButton) return;

    const hasFilters =
      this.currentMonth !== this._nowMonth() ||
      this.currentCategory !== 'all' ||
      this.searchTerm !== '' ||
      !!this.exactDate;

    clearButton.classList.toggle('visible', hasFilters);
  }

  updateVisibility(sectionName = null) {
    const contextualBar = document.getElementById('contextual-bar');
    if (!contextualBar) return;

    const currentSection = sectionName || this._getCurrentSection();
    const shouldShow = this.sectionsWithBar.includes(currentSection);

    if (shouldShow && !this.isVisible) {
      contextualBar.classList.remove('hidden');
      contextualBar.classList.add('visible');
      this.isVisible = true;
      this._loadCategories(); // refrescar por si cambiaron
    } else if (!shouldShow && this.isVisible) {
      contextualBar.classList.add('hidden');
      contextualBar.classList.remove('visible');
      this.isVisible = false;
    }
  }

  // =========================
  // Helpers de datos/filtros
  // =========================
  _nowMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  _generateMonthOptions() {
    const options = [];
    const currentDate = new Date();

    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
      const isSelected = monthKey === this.currentMonth ? 'selected' : '';
      options.push(`<option value="${monthKey}" ${isSelected}>${monthName}</option>`);
    }
    return options.join('');
  }

  async _loadCategories() {
    try {
      const categories = window.app?.data?.getCategories?.() || [];
      const categoryFilter = document.getElementById('category-filter');
      if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="all">Todas</option>';
        categories.forEach((c) => {
          const option = document.createElement('option');
          option.value = c.name;
          option.textContent = `${c.icon} ${c.name}`;
          categoryFilter.appendChild(option);
        });
        // Mantener selección actual si existe
        if (this.currentCategory && categoryFilter.querySelector(`option[value="${this.currentCategory}"]`)) {
          categoryFilter.value = this.currentCategory;
        }
      }
    } catch (e) {
      console.error('Error loading categories for contextual bar:', e);
    }
  }

  _getCurrentSection() {
    const activeSection = document.querySelector('.dashboard-section.active');
    return activeSection ? activeSection.id.replace('-section', '') : null;
  }

  _norm(s = '') {
    return String(s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }

  // ---- Filtro Gastos
  _filterExpenses(items = []) {
    const nq = this._norm(this.searchTerm);
    const date = this.exactDate; // YYYY-MM-DD
    const cat = this.currentCategory;

    return items.filter((it) => {
      const desc = this._norm(it.description || '');
      const nameOK = nq ? desc.includes(nq) : true;
      const catOK = cat === 'all' ? true : it.category === cat;

      let dateOK = true;
      if (date) {
        const d =
          (it.transaction_date && String(it.transaction_date).slice(0, 10)) ||
          (it.created_at && String(it.created_at).slice(0, 10)) ||
          null;

        if (d) {
          dateOK = d === date;
        } else {
          // Si no tenemos fecha exacta, caemos al mes (coherencia con filtro)
          dateOK =
            (it.month || '').slice(0, 7) === this.currentMonth &&
            date.slice(0, 7) === this.currentMonth;
        }
      }

      // Aseguramos pertenencia al mes seleccionado
      const monthOK = (it.month || '').slice(0, 7) === this.currentMonth;

      return nameOK && catOK && dateOK && monthOK;
    });
  }

  // ---- Filtro Ingresos Extra
  _filterExtraIncomes(items = []) {
    const nq = this._norm(this.searchTerm);
    const date = this.exactDate;
    const cat = this.currentCategory;

    return items.filter((it) => {
      const desc = this._norm(it.description || '');
      const nameOK = nq ? desc.includes(nq) : true;
      const catOK = cat === 'all' ? true : it.category === cat;

      let dateOK = true;
      if (date) {
        const d =
          (it.created_at && String(it.created_at).slice(0, 10)) ||
          (it.transaction_date && String(it.transaction_date).slice(0, 10)) ||
          null;

        if (d) {
          dateOK = d === date;
        } else {
          dateOK =
            (it.month || '').slice(0, 7) === this.currentMonth &&
            date.slice(0, 7) === this.currentMonth;
        }
      }

      const monthOK = (it.month || '').slice(0, 7) === this.currentMonth;
      return nameOK && catOK && dateOK && monthOK;
    });
  }

  // ---- Ingreso fijo: reglas de visualización con filtros
  _fixedIncomePassesFilters() {
    // El ingreso fijo no tiene categoría ni descripción ni fecha puntual,
    // así que:
    // - si hay búsqueda -> NO se muestra
    // - si hay categoría distinta a 'all' -> NO se muestra
    // - si hay fecha exacta -> solo se muestra si pertenece al mes seleccionado (cualquier día del mes)
    if (this.searchTerm) return false;
    if (this.currentCategory !== 'all') return false;

    if (!this.exactDate) return true; // Sin fecha exacta, lo mostramos para el mes actual
    // Con fecha exacta, debe ser del mismo mes que el selector
    return this.exactDate.slice(0, 7) === this.currentMonth;
  }

  // =========================
  // Public setters (por si necesitás)
  // =========================
  setMonth(month) {
    this.currentMonth = month;
    const monthSelector = document.getElementById('month-selector');
    if (monthSelector) monthSelector.value = month;

    // Ajustar fecha si quedó fuera del nuevo mes
    if (this.exactDate && this.exactDate.slice(0, 7) !== month) {
      this.exactDate = '';
      const dateFilter = document.getElementById('date-filter');
      if (dateFilter) dateFilter.value = '';
    }

    this.onFiltersChange();
  }

  setCategory(category) {
    this.currentCategory = category;
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) categoryFilter.value = category;
    this.onFiltersChange();
  }

  setSearch(search) {
    this.searchTerm = search;
    const searchFilter = document.getElementById('search-filter');
    if (searchFilter) searchFilter.value = search;
    this.onFiltersChange();
  }

  setExactDate(dateStr) {
    this.exactDate = (dateStr || '').slice(0, 10);
    const dateFilter = document.getElementById('date-filter');
    if (dateFilter) dateFilter.value = this.exactDate;
    // Alinear mes si corresponde
    if (this.exactDate) {
      const m = this.exactDate.slice(0, 7);
      this.currentMonth = m;
      const monthSel = document.getElementById('month-selector');
      if (monthSel) monthSel.value = m;
    }
    this.onFiltersChange();
  }
}
