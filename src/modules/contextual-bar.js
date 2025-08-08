export class ContextualBarManager {
  constructor() {
    this.currentSection = 'dashboard';
    this.currentMonth = this.getCurrentMonth();
    this.sectionsWithBar = ['transactions', 'reports', 'budgets']; // Secciones donde debe aparecer
    this.isVisible = false;
  }

  init() {
    console.log('📊 Initializing Contextual Bar Manager...');
    this.createContextualBar();
    this.setupEventListeners();
    this.updateVisibility();
  }

  createContextualBar() {
    // Verificar si ya existe
    if (document.getElementById('contextual-bar')) {
      return;
    }

    const contextualBar = document.createElement('div');
    contextualBar.id = 'contextual-bar';
    contextualBar.className = 'contextual-bar hidden';
    
    contextualBar.innerHTML = `
      <div class="contextual-bar-content">
        <div class="contextual-filters">
          <!-- Selector de Mes -->
          <div class="filter-group">
            <label class="filter-label">📅</label>
            <select id="contextual-month-select" class="filter-select month-select">
              <!-- Options will be populated dynamically -->
            </select>
          </div>
          
          <!-- Selector de Categoría (Placeholder) -->
          <div class="filter-group">
            <label class="filter-label">🏷️</label>
            <select id="contextual-category-select" class="filter-select category-select" disabled>
              <option value="all">Todas las categorías</option>
              <!-- Future implementation -->
            </select>
          </div>
          
          <!-- Buscador (Placeholder) -->
          <div class="filter-group search-group">
            <label class="filter-label">🔍</label>
            <input 
              type="text" 
              id="contextual-search-input" 
              class="filter-input search-input" 
              placeholder="Buscar transacción..."
              disabled
            >
          </div>
        </div>
      </div>
    `;

    // Insertar después del header
    const header = document.querySelector('.header');
    if (header) {
      header.insertAdjacentElement('afterend', contextualBar);
    } else {
      // Fallback: insertar al inicio del body
      document.body.insertBefore(contextualBar, document.body.firstChild);
    }

    // Poblar selector de meses
    this.populateMonthSelector();
  }

  populateMonthSelector() {
    const monthSelect = document.getElementById('contextual-month-select');
    if (!monthSelect) return;

    // Generar últimos 12 meses
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('es-ES', { 
        month: 'long', 
        year: 'numeric' 
      });
      months.push({ key: monthKey, name: monthName });
    }
    
    monthSelect.innerHTML = '';
    months.forEach(month => {
      const option = document.createElement('option');
      option.value = month.key;
      option.textContent = month.name;
      if (month.key === this.currentMonth) {
        option.selected = true;
      }
      monthSelect.appendChild(option);
    });
  }

  setupEventListeners() {
    // Selector de mes
    const monthSelect = document.getElementById('contextual-month-select');
    if (monthSelect) {
      monthSelect.addEventListener('change', (e) => {
        this.handleMonthChange(e.target.value);
      });
    }

    // Escuchar cambios de sección desde NavigationManager
    document.addEventListener('sectionChanged', (e) => {
      this.currentSection = e.detail.section;
      this.updateVisibility();
    });

    // Future: Category filter
    const categorySelect = document.getElementById('contextual-category-select');
    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        // TODO: Implement category filtering
        console.log('Category filter changed:', e.target.value);
      });
    }

    // Future: Search input
    const searchInput = document.getElementById('contextual-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        // TODO: Implement search functionality
        console.log('Search input changed:', e.target.value);
      });
    }
  }

  handleMonthChange(newMonth) {
    console.log('📅 Contextual bar month changed to:', newMonth);
    
    this.currentMonth = newMonth;
    
    // Sincronizar con el selector principal si existe
    const mainMonthSelect = document.getElementById('month-select');
    if (mainMonthSelect && mainMonthSelect.value !== newMonth) {
      mainMonthSelect.value = newMonth;
    }
    
    // Actualizar la aplicación principal
    if (window.app) {
      window.app.currentMonth = newMonth;
      window.app.updateDashboard();
    }
    
    // Emitir evento para otros componentes
    document.dispatchEvent(new CustomEvent('monthChanged', {
      detail: { month: newMonth, source: 'contextual-bar' }
    }));
  }

  updateVisibility() {
    const contextualBar = document.getElementById('contextual-bar');
    if (!contextualBar) return;

    const shouldShow = this.sectionsWithBar.includes(this.currentSection);
    
    if (shouldShow && !this.isVisible) {
      this.showBar();
    } else if (!shouldShow && this.isVisible) {
      this.hideBar();
    }
  }

  showBar() {
    const contextualBar = document.getElementById('contextual-bar');
    if (contextualBar) {
      contextualBar.classList.remove('hidden');
      contextualBar.classList.add('visible');
      this.isVisible = true;
      
      // Ajustar padding del contenido principal
      this.adjustMainContentPadding(true);
    }
  }

  hideBar() {
    const contextualBar = document.getElementById('contextual-bar');
    if (contextualBar) {
      contextualBar.classList.remove('visible');
      contextualBar.classList.add('hidden');
      this.isVisible = false;
      
      // Restaurar padding del contenido principal
      this.adjustMainContentPadding(false);
    }
  }

  adjustMainContentPadding(hasBar) {
    const mainContent = document.querySelector('.main-content') || 
                       document.querySelector('#app') || 
                       document.querySelector('.dashboard-container');
    
    if (mainContent) {
      if (hasBar) {
        mainContent.style.paddingTop = '80px'; // Espacio para la barra contextual
      } else {
        mainContent.style.paddingTop = ''; // Restaurar padding original
      }
    }
  }

  // Método para sincronizar desde el selector principal
  syncMonth(month) {
    if (this.currentMonth !== month) {
      this.currentMonth = month;
      const monthSelect = document.getElementById('contextual-month-select');
      if (monthSelect) {
        monthSelect.value = month;
      }
    }
  }

  // Método para actualizar sección actual
  setCurrentSection(section) {
    this.currentSection = section;
    this.updateVisibility();
  }

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  // Métodos para habilitar filtros futuros
  enableCategoryFilter() {
    const categorySelect = document.getElementById('contextual-category-select');
    if (categorySelect) {
      categorySelect.disabled = false;
      // TODO: Populate with actual categories
    }
  }

  enableSearchFilter() {
    const searchInput = document.getElementById('contextual-search-input');
    if (searchInput) {
      searchInput.disabled = false;
    }
  }

  // Método para actualizar categorías (para uso futuro)
  updateCategories(categories) {
    const categorySelect = document.getElementById('contextual-category-select');
    if (!categorySelect) return;

    // Limpiar opciones existentes excepto "Todas"
    categorySelect.innerHTML = '<option value="all">Todas las categorías</option>';
    
    // Agregar categorías
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.name;
      option.textContent = `${category.icon} ${category.name}`;
      categorySelect.appendChild(option);
    });
  }
}