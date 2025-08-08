export class ContextualBarManager {
  constructor() {
    this.currentMonth = this.getCurrentMonth();
    this.currentCategory = 'all';
    this.searchTerm = '';
    this.visibleSections = ['transactions', 'reports']; // Secciones donde aparece la barra
    this.isVisible = false;
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
        <div class="contextual-controls">
          <!-- Selector de Mes -->
          <div class="contextual-control">
            <div class="control-icon">📅</div>
            <select id="contextual-month-select" class="contextual-select">
              <!-- Se llena dinámicamente -->
            </select>
          </div>
          
          <!-- Selector de Categoría (Placeholder para futuro) -->
          <div class="contextual-control">
            <div class="control-icon">🏷️</div>
            <select id="contextual-category-select" class="contextual-select" disabled>
              <option value="all">Todas las categorías</option>
            </select>
          </div>
          
          <!-- Buscador (Placeholder para futuro) -->
          <div class="contextual-control search-control">
            <div class="control-icon">🔍</div>
            <input 
              type="text" 
              id="contextual-search" 
              class="contextual-search" 
              placeholder="Buscar transacciones..."
              disabled
            />
          </div>
        </div>
        
        <!-- Indicador de filtros activos -->
        <div class="active-filters" id="active-filters">
          <span class="filter-tag" id="month-filter-tag">
            <span class="filter-label">Mes:</span>
            <span class="filter-value" id="current-month-display"></span>
          </span>
        </div>
      </div>
    `;

    // Insertar la barra después del header
    const header = document.querySelector('.header');
    if (header) {
      header.insertAdjacentElement('afterend', contextualBar);
    } else {
      // Fallback: insertar al inicio del contenido principal
      const mainContent = document.querySelector('.main-content') || document.body;
      mainContent.insertBefore(contextualBar, mainContent.firstChild);
    }

    // Llenar el selector de meses
    this.populateMonthSelector();
    this.updateCurrentMonthDisplay();
  }

  populateMonthSelector() {
    const monthSelect = document.getElementById('contextual-month-select');
    if (!monthSelect) return;

    monthSelect.innerHTML = '';

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

    // Escuchar cambios de sección para mostrar/ocultar la barra
    document.addEventListener('sectionChanged', (e) => {
      this.handleSectionChange(e.detail.section);
    });

    // Selector de categoría (para futuro)
    const categorySelect = document.getElementById('contextual-category-select');
    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        this.handleCategoryChange(e.target.value);
      });
    }

    // Buscador (para futuro)
    const searchInput = document.getElementById('contextual-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearchChange(e.target.value);
      });
    }
  }

  handleMonthChange(newMonth) {
    console.log('📅 Month changed to:', newMonth);
    
    this.currentMonth = newMonth;
    this.updateCurrentMonthDisplay();
    
    // Actualizar la aplicación principal
    if (window.app) {
      window.app.currentMonth = newMonth;
      window.app.updateDashboard();
    }

    // Disparar evento personalizado para que otros módulos se enteren
    document.dispatchEvent(new CustomEvent('monthChanged', {
      detail: { month: newMonth }
    }));
  }

  handleCategoryChange(category) {
    console.log('🏷️ Category changed to:', category);
    this.currentCategory = category;
    
    // TODO: Implementar filtrado por categoría
    // document.dispatchEvent(new CustomEvent('categoryChanged', {
    //   detail: { category: category }
    // }));
  }

  handleSearchChange(searchTerm) {
    console.log('🔍 Search term changed to:', searchTerm);
    this.searchTerm = searchTerm;
    
    // TODO: Implementar búsqueda
    // document.dispatchEvent(new CustomEvent('searchChanged', {
    //   detail: { searchTerm: searchTerm }
    // }));
  }

  handleSectionChange(section) {
    console.log('📊 Section changed to:', section);
    this.updateVisibility(section);
  }

  updateVisibility(currentSection = null) {
    const contextualBar = document.getElementById('contextual-bar');
    if (!contextualBar) return;

    // Obtener la sección actual si no se proporciona
    if (!currentSection) {
      currentSection = this.getCurrentSection();
    }

    const shouldShow = this.visibleSections.includes(currentSection);
    
    if (shouldShow && !this.isVisible) {
      // Mostrar la barra
      contextualBar.classList.remove('hidden');
      contextualBar.classList.add('visible');
      this.isVisible = true;
      console.log('📊 Contextual bar shown for section:', currentSection);
    } else if (!shouldShow && this.isVisible) {
      // Ocultar la barra
      contextualBar.classList.remove('visible');
      contextualBar.classList.add('hidden');
      this.isVisible = false;
      console.log('📊 Contextual bar hidden for section:', currentSection);
    }
  }

  getCurrentSection() {
    // Detectar la sección actual basándose en qué sección está activa
    const activeSections = document.querySelectorAll('.dashboard-section.active');
    if (activeSections.length > 0) {
      const activeSection = activeSections[0];
      const sectionId = activeSection.id;
      return sectionId.replace('-section', '');
    }
    
    // Fallback: revisar navegación activa
    const activeNavItem = document.querySelector('.nav-item.active');
    if (activeNavItem) {
      return activeNavItem.getAttribute('data-section');
    }
    
    return 'dashboard'; // Default
  }

  updateCurrentMonthDisplay() {
    const monthDisplay = document.getElementById('current-month-display');
    if (!monthDisplay) return;

    const date = new Date(this.currentMonth + '-01');
    const monthName = date.toLocaleDateString('es-ES', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    monthDisplay.textContent = monthName;
  }

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  // Método público para sincronizar el mes desde otras partes de la app
  setCurrentMonth(month) {
    this.currentMonth = month;
    
    const monthSelect = document.getElementById('contextual-month-select');
    if (monthSelect) {
      monthSelect.value = month;
    }
    
    this.updateCurrentMonthDisplay();
  }

  // Método público para obtener el mes actual
  getCurrentSelectedMonth() {
    return this.currentMonth;
  }

  // Habilitar funcionalidades futuras
  enableCategoryFilter() {
    const categorySelect = document.getElementById('contextual-category-select');
    if (categorySelect) {
      categorySelect.disabled = false;
      
      // Llenar con categorías reales
      if (window.app && window.app.data) {
        const categories = window.app.data.getCategories();
        categorySelect.innerHTML = '<option value="all">Todas las categorías</option>';
        
        categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.name;
          option.textContent = `${category.icon} ${category.name}`;
          categorySelect.appendChild(option);
        });
      }
    }
  }

  enableSearch() {
    const searchInput = document.getElementById('contextual-search');
    if (searchInput) {
      searchInput.disabled = false;
    }
  }

  // Método para agregar nuevas secciones donde mostrar la barra
  addVisibleSection(section) {
    if (!this.visibleSections.includes(section)) {
      this.visibleSections.push(section);
    }
  }

  removeVisibleSection(section) {
    this.visibleSections = this.visibleSections.filter(s => s !== section);
  }
}