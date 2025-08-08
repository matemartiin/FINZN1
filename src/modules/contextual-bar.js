export class ContextualBarManager {
  constructor() {
    this.currentSection = 'dashboard';
    this.currentMonth = this.getCurrentMonth();
    this.sectionsWithBar = ['transactions', 'reports', 'budgets']; // Secciones que muestran la barra
  }

  init() {
    console.log('📊 Initializing Contextual Bar Manager...');
    this.createContextualBar();
    this.setupEventListeners();
    this.updateVisibility();
  }

  createContextualBar() {
    // Crear la barra contextual
    const contextualBar = document.createElement('div');
    contextualBar.id = 'contextual-bar';
    contextualBar.className = 'contextual-bar hidden';
    
    contextualBar.innerHTML = `
      <div class="contextual-bar-content">
        <div class="contextual-filters">
          <!-- Selector de Mes (Funcional) -->
          <div class="filter-group">
            <label class="filter-label">📅 Período</label>
            <select id="contextual-month-select" class="month-selector">
              <!-- Se llena dinámicamente -->
            </select>
          </div>
          
          <!-- Selector de Categoría (Placeholder) -->
          <div class="filter-group">
            <label class="filter-label">🏷️ Categoría</label>
            <select id="contextual-category-select" class="category-selector" disabled>
              <option value="all">Todas las categorías</option>
              <!-- Futuras versiones -->
            </select>
          </div>
          
          <!-- Buscador (Placeholder) -->
          <div class="filter-group search-group">
            <label class="filter-label">🔍 Buscar</label>
            <input 
              type="text" 
              id="contextual-search" 
              class="search-input" 
              placeholder="Buscar transacciones..." 
              disabled
            />
          </div>
        </div>
        
        <!-- Indicador de próximas funciones -->
        <div class="coming-soon-badge">
          <span class="badge-text">Filtros avanzados próximamente</span>
        </div>
      </div>
    `;

    // Insertar la barra después del header
    const header = document.querySelector('.header');
    if (header) {
      header.insertAdjacentElement('afterend', contextualBar);
    } else {
      // Fallback: insertar al inicio del body
      document.body.insertBefore(contextualBar, document.body.firstChild);
    }

    // Llenar el selector de meses
    this.populateMonthSelector();
  }

  setupEventListeners() {
    // Listener para cambio de mes
    const monthSelect = document.getElementById('contextual-month-select');
    if (monthSelect) {
      monthSelect.addEventListener('change', (e) => {
        this.handleMonthChange(e.target.value);
      });
    }

    // Listeners para navegación (detectar cambio de sección)
    document.addEventListener('sectionChanged', (e) => {
      this.currentSection = e.detail.section;
      this.updateVisibility();
    });

    // También escuchar clicks en navegación
    const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const section = item.getAttribute('data-section');
        if (section) {
          this.currentSection = section;
          this.updateVisibility();
        }
      });
    });
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

  handleMonthChange(newMonth) {
    console.log('📅 Contextual bar: Month changed to', newMonth);
    
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
    
    // Disparar evento personalizado para otros módulos
    document.dispatchEvent(new CustomEvent('monthChanged', {
      detail: { month: newMonth, source: 'contextual-bar' }
    }));
  }

  updateVisibility() {
    const contextualBar = document.getElementById('contextual-bar');
    if (!contextualBar) return;

    const shouldShow = this.sectionsWithBar.includes(this.currentSection);
    
    if (shouldShow) {
      contextualBar.classList.remove('hidden');
      contextualBar.classList.add('visible');
      console.log('📊 Showing contextual bar for section:', this.currentSection);
    } else {
      contextualBar.classList.add('hidden');
      contextualBar.classList.remove('visible');
      console.log('📊 Hiding contextual bar for section:', this.currentSection);
    }
  }

  // Método para sincronizar desde el selector principal
  syncMonth(month) {
    this.currentMonth = month;
    const monthSelect = document.getElementById('contextual-month-select');
    if (monthSelect && monthSelect.value !== month) {
      monthSelect.value = month;
    }
  }

  // Método para actualizar la sección actual
  setCurrentSection(section) {
    this.currentSection = section;
    this.updateVisibility();
  }

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  // Método para habilitar filtros futuros
  enableCategoryFilter() {
    const categorySelect = document.getElementById('contextual-category-select');
    if (categorySelect) {
      categorySelect.disabled = false;
      // Aquí se cargarían las categorías dinámicamente
    }
  }

  enableSearchFilter() {
    const searchInput = document.getElementById('contextual-search');
    if (searchInput) {
      searchInput.disabled = false;
      // Aquí se agregaría la lógica de búsqueda
    }
  }
}