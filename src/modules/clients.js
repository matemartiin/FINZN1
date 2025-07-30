export class ClientsManager {
  constructor() {
    this.clients = [];
    this.filteredClients = [];
    this.currentView = 'grid'; // 'grid' or 'list'
    this.filters = {
      search: '',
      status: '',
      ageRange: '',
      clientType: ''
    };
  }

  async init() {
    console.log('👥 Initializing Clients Manager...');
    this.setupEventListeners();
    await this.loadClients();
    this.updateUI();
  }

  setupEventListeners() {
    // Add client button
    const addClientBtn = document.getElementById('add-client-btn');
    if (addClientBtn) {
      addClientBtn.addEventListener('click', () => this.showAddClientModal());
    }

    // View toggle buttons
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    
    if (gridViewBtn) {
      gridViewBtn.addEventListener('click', () => this.setView('grid'));
    }
    
    if (listViewBtn) {
      listViewBtn.addEventListener('click', () => this.setView('list'));
    }

    // Filter inputs
    const searchInput = document.getElementById('client-search');
    const statusFilter = document.getElementById('client-status-filter');
    const ageRangeFilter = document.getElementById('client-age-range-filter');
    const clientTypeFilter = document.getElementById('client-type-filter');
    const clearFiltersBtn = document.getElementById('clear-client-filters');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.updateFilter('search', e.target.value));
    }
    
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => this.updateFilter('status', e.target.value));
    }
    
    if (ageRangeFilter) {
      ageRangeFilter.addEventListener('change', (e) => this.updateFilter('ageRange', e.target.value));
    }
    
    if (clientTypeFilter) {
      clientTypeFilter.addEventListener('change', (e) => this.updateFilter('clientType', e.target.value));
    }
    
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => this.clearFilters());
    }

    // Form submissions
    const addClientForm = document.getElementById('add-client-form');
    const editClientForm = document.getElementById('edit-client-form');
    
    if (addClientForm) {
      addClientForm.addEventListener('submit', (e) => this.handleAddClient(e));
    }
    
    if (editClientForm) {
      editClientForm.addEventListener('submit', (e) => this.handleEditClient(e));
    }

    // Export/Import buttons
    const exportBtn = document.getElementById('export-clients-btn');
    const importBtn = document.getElementById('import-clients-btn');
    
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportClients());
    }
    
    if (importBtn) {
      importBtn.addEventListener('click', () => this.showImportClientsModal());
    }
  }

  async loadClients() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      console.log('👥 Loading clients for user:', userId);
      
      const { data, error } = await window.app.data.supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading clients:', error);
        this.clients = [];
        return;
      }

      this.clients = data || [];
      this.filteredClients = [...this.clients];
      
      console.log('👥 Clients loaded:', this.clients.length);
    } catch (error) {
      console.error('Error in loadClients:', error);
      this.clients = [];
      this.filteredClients = [];
    }
  }

  async addClient(clientData) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      console.log('👥 Adding client:', clientData);
      
      // Calculate age range if birth date is provided
      let ageRange = 'no_definido';
      if (clientData.birthDate) {
        ageRange = this.calculateAgeRange(clientData.birthDate);
      }
      
      const client = {
        user_id: userId,
        name: clientData.name,
        email: clientData.email || null,
        phone: clientData.phone || null,
        address: clientData.address || null,
        birth_date: clientData.birthDate || null,
        age_range: ageRange,
        client_type: clientData.clientType || 'individual',
        notes: clientData.notes || null,
        status: clientData.status || 'active'
      };

      const { data, error } = await window.app.data.supabase
        .from('clients')
        .insert([client])
        .select();

      if (error) {
        console.error('Error adding client:', error);
        return false;
      }

      this.clients.unshift(data[0]);
      this.applyFilters();
      this.updateUI();
      
      console.log('✅ Client added successfully');
      return true;
    } catch (error) {
      console.error('Error in addClient:', error);
      return false;
    }
  }

  async updateClient(clientId, clientData) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      console.log('👥 Updating client:', clientId, clientData);
      
      // Calculate age range if birth date is provided
      let ageRange = 'no_definido';
      if (clientData.birthDate) {
        ageRange = this.calculateAgeRange(clientData.birthDate);
      }
      
      const updates = {
        name: clientData.name,
        email: clientData.email || null,
        phone: clientData.phone || null,
        address: clientData.address || null,
        birth_date: clientData.birthDate || null,
        age_range: ageRange,
        client_type: clientData.clientType || 'individual',
        notes: clientData.notes || null,
        status: clientData.status || 'active'
      };

      const { data, error } = await window.app.data.supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('Error updating client:', error);
        return false;
      }

      // Update local data
      const index = this.clients.findIndex(c => c.id === clientId);
      if (index !== -1) {
        this.clients[index] = data[0];
      }
      
      this.applyFilters();
      this.updateUI();
      
      console.log('✅ Client updated successfully');
      return true;
    } catch (error) {
      console.error('Error in updateClient:', error);
      return false;
    }
  }

  async deleteClient(clientId) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      const { error } = await window.app.data.supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting client:', error);
        return false;
      }

      this.clients = this.clients.filter(c => c.id !== clientId);
      this.applyFilters();
      this.updateUI();
      
      console.log('✅ Client deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in deleteClient:', error);
      return false;
    }
  }

  calculateAgeRange(birthDate) {
    if (!birthDate) return 'no_definido';
    
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) 
      ? age - 1 
      : age;
    
    if (actualAge < 18) return 'menor_18';
    if (actualAge >= 18 && actualAge <= 25) return '18_25';
    if (actualAge >= 26 && actualAge <= 35) return '26_35';
    if (actualAge >= 36 && actualAge <= 50) return '36_50';
    return '51_mas';
  }

  getAgeRangeLabel(ageRange) {
    const labels = {
      'menor_18': 'Menor de 18',
      '18_25': '18-25 años',
      '26_35': '26-35 años',
      '36_50': '36-50 años',
      '51_mas': '51+ años',
      'no_definido': 'No definido'
    };
    return labels[ageRange] || 'No definido';
  }

  updateFilter(filterType, value) {
    this.filters[filterType] = value;
    this.applyFilters();
    this.updateClientsList();
  }

  applyFilters() {
    this.filteredClients = this.clients.filter(client => {
      // Search filter
      if (this.filters.search) {
        const searchTerm = this.filters.search.toLowerCase();
        const matchesSearch = 
          client.name.toLowerCase().includes(searchTerm) ||
          (client.email && client.email.toLowerCase().includes(searchTerm)) ||
          (client.phone && client.phone.includes(searchTerm));
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (this.filters.status && client.status !== this.filters.status) {
        return false;
      }

      // Age range filter
      if (this.filters.ageRange && client.age_range !== this.filters.ageRange) {
        return false;
      }

      // Client type filter
      if (this.filters.clientType && client.client_type !== this.filters.clientType) {
        return false;
      }

      return true;
    });
  }

  clearFilters() {
    this.filters = {
      search: '',
      status: '',
      ageRange: '',
      clientType: ''
    };

    // Clear form inputs
    const searchInput = document.getElementById('client-search');
    const statusFilter = document.getElementById('client-status-filter');
    const ageRangeFilter = document.getElementById('client-age-range-filter');
    const clientTypeFilter = document.getElementById('client-type-filter');

    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    if (ageRangeFilter) ageRangeFilter.value = '';
    if (clientTypeFilter) clientTypeFilter.value = '';

    this.applyFilters();
    this.updateClientsList();
  }

  setView(viewType) {
    this.currentView = viewType;
    
    const gridBtn = document.getElementById('grid-view-btn');
    const listBtn = document.getElementById('list-view-btn');
    const clientsList = document.getElementById('clients-list');

    if (gridBtn && listBtn && clientsList) {
      gridBtn.classList.toggle('active', viewType === 'grid');
      listBtn.classList.toggle('active', viewType === 'list');
      
      clientsList.className = `clients-list ${viewType}-view`;
    }

    this.updateClientsList();
  }

  updateUI() {
    this.updateStats();
    this.updateClientsList();
  }

  updateStats() {
    const totalClients = this.clients.length;
    const activeClients = this.clients.filter(c => c.status === 'active').length;
    
    // New clients this month
    const thisMonth = new Date().toISOString().slice(0, 7);
    const newClientsMonth = this.clients.filter(c => 
      c.created_at && c.created_at.startsWith(thisMonth)
    ).length;

    // Dominant age range
    const ageRangeCounts = {};
    this.clients.forEach(client => {
      const range = client.age_range || 'no_definido';
      ageRangeCounts[range] = (ageRangeCounts[range] || 0) + 1;
    });
    
    const dominantRange = Object.keys(ageRangeCounts).reduce((a, b) => 
      ageRangeCounts[a] > ageRangeCounts[b] ? a : b, 'no_definido'
    );

    // Update DOM
    const totalElement = document.getElementById('total-clients');
    const activeElement = document.getElementById('active-clients');
    const newElement = document.getElementById('new-clients-month');
    const dominantElement = document.getElementById('age-range-dominant');

    if (totalElement) totalElement.textContent = totalClients;
    if (activeElement) activeElement.textContent = activeClients;
    if (newElement) newElement.textContent = newClientsMonth;
    if (dominantElement) {
      dominantElement.textContent = totalClients > 0 ? this.getAgeRangeLabel(dominantRange) : '-';
    }
  }

  updateClientsList() {
    const container = document.getElementById('clients-list');
    if (!container) return;

    container.innerHTML = '';

    if (this.filteredClients.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>No se encontraron clientes</h3>
          <p>${this.clients.length === 0 ? 'Comienza agregando tu primer cliente' : 'Intenta ajustar los filtros'}</p>
          ${this.clients.length === 0 ? `
            <button class="btn btn-primary" onclick="window.app.clients.showAddClientModal()">
              <span>👤</span>
              Agregar Cliente
            </button>
          ` : ''}
        </div>
      `;
      return;
    }

    this.filteredClients.forEach(client => {
      const clientElement = this.createClientElement(client);
      container.appendChild(clientElement);
    });
  }

  createClientElement(client) {
    const element = document.createElement('div');
    element.className = `client-item ${client.status}`;
    
    const age = client.birth_date ? this.calculateAge(client.birth_date) : null;
    const ageText = age ? `${age} años` : 'Edad no definida';
    
    if (this.currentView === 'grid') {
      element.innerHTML = `
        <div class="client-card">
          <div class="client-header">
            <div class="client-avatar">
              ${client.name.charAt(0).toUpperCase()}
            </div>
            <div class="client-status-badge ${client.status}">
              ${client.status === 'active' ? '✅' : '⏸️'}
            </div>
          </div>
          <div class="client-info">
            <h4 class="client-name">${client.name}</h4>
            <p class="client-type">${client.client_type === 'individual' ? '👤 Individual' : '🏢 Empresa'}</p>
            <p class="client-age">${ageText}</p>
            ${client.email ? `<p class="client-email">📧 ${client.email}</p>` : ''}
            ${client.phone ? `<p class="client-phone">📱 ${client.phone}</p>` : ''}
          </div>
          <div class="client-actions">
            <button class="client-action-btn edit-btn" onclick="window.app.clients.showEditClientModal('${client.id}')" title="Editar">
              ✏️
            </button>
            <button class="client-action-btn delete-btn" onclick="window.app.clients.confirmDeleteClient('${client.id}', '${client.name}')" title="Eliminar">
              🗑️
            </button>
          </div>
        </div>
      `;
    } else {
      element.innerHTML = `
        <div class="client-row">
          <div class="client-avatar-small">
            ${client.name.charAt(0).toUpperCase()}
          </div>
          <div class="client-details">
            <div class="client-name">${client.name}</div>
            <div class="client-meta">
              ${client.client_type === 'individual' ? '👤' : '🏢'} ${ageText}
              ${client.email ? ` • 📧 ${client.email}` : ''}
              ${client.phone ? ` • 📱 ${client.phone}` : ''}
            </div>
          </div>
          <div class="client-status-badge ${client.status}">
            ${client.status === 'active' ? 'Activo' : 'Inactivo'}
          </div>
          <div class="client-actions">
            <button class="client-action-btn edit-btn" onclick="window.app.clients.showEditClientModal('${client.id}')" title="Editar">
              ✏️
            </button>
            <button class="client-action-btn delete-btn" onclick="window.app.clients.confirmDeleteClient('${client.id}', '${client.name}')" title="Eliminar">
              🗑️
            </button>
          </div>
        </div>
      `;
    }

    return element;
  }

  calculateAge(birthDate) {
    if (!birthDate) return null;
    
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    return monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) 
      ? age - 1 
      : age;
  }

  // Modal methods
  showAddClientModal() {
    if (window.app && window.app.modals) {
      window.app.modals.show('add-client-modal');
    }
  }

  showEditClientModal(clientId) {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) return;

    // Populate form
    document.getElementById('edit-client-id').value = client.id;
    document.getElementById('edit-client-name').value = client.name;
    document.getElementById('edit-client-email').value = client.email || '';
    document.getElementById('edit-client-phone').value = client.phone || '';
    document.getElementById('edit-client-address').value = client.address || '';
    document.getElementById('edit-client-birth-date').value = client.birth_date || '';
    document.getElementById('edit-client-type').value = client.client_type;
    document.getElementById('edit-client-status').value = client.status;
    document.getElementById('edit-client-notes').value = client.notes || '';

    if (window.app && window.app.modals) {
      window.app.modals.show('edit-client-modal');
    }
  }

  confirmDeleteClient(clientId, clientName) {
    if (confirm(`¿Estás seguro de que quieres eliminar al cliente "${clientName}"?`)) {
      this.deleteClient(clientId).then(success => {
        if (success && window.app && window.app.ui) {
          window.app.ui.showAlert('Cliente eliminado correctamente', 'success');
        } else if (window.app && window.app.ui) {
          window.app.ui.showAlert('Error al eliminar el cliente', 'error');
        }
      });
    }
  }

  // Form handlers
  async handleAddClient(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const clientData = Object.fromEntries(formData.entries());
    
    if (!clientData.name) {
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('El nombre es obligatorio', 'error');
      }
      return;
    }

    try {
      const success = await this.addClient(clientData);
      
      if (success) {
        if (window.app && window.app.modals) {
          window.app.modals.hide('add-client-modal');
        }
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Cliente agregado correctamente', 'success');
        }
      } else {
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Error al agregar el cliente', 'error');
        }
      }
    } catch (error) {
      console.error('Error in handleAddClient:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al agregar el cliente', 'error');
      }
    }
  }

  async handleEditClient(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const clientData = Object.fromEntries(formData.entries());
    const clientId = clientData.clientId;
    
    if (!clientData.name) {
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('El nombre es obligatorio', 'error');
      }
      return;
    }

    try {
      const success = await this.updateClient(clientId, clientData);
      
      if (success) {
        if (window.app && window.app.modals) {
          window.app.modals.hide('edit-client-modal');
        }
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Cliente actualizado correctamente', 'success');
        }
      } else {
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Error al actualizar el cliente', 'error');
        }
      }
    } catch (error) {
      console.error('Error in handleEditClient:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al actualizar el cliente', 'error');
      }
    }
  }

  // Export/Import methods
  exportClients() {
    try {
      const csvData = this.clients.map(client => ({
        nombre: client.name,
        email: client.email || '',
        telefono: client.phone || '',
        direccion: client.address || '',
        fecha_nacimiento: client.birth_date || '',
        rango_etario: this.getAgeRangeLabel(client.age_range),
        tipo_cliente: client.client_type === 'individual' ? 'Individual' : 'Empresa',
        estado: client.status === 'active' ? 'Activo' : 'Inactivo',
        notas: client.notes || '',
        fecha_creacion: new Date(client.created_at).toLocaleDateString('es-ES')
      }));

      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `clientes_finzn_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Clientes exportados correctamente', 'success');
      }
    } catch (error) {
      console.error('Error exporting clients:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al exportar clientes', 'error');
      }
    }
  }

  getCurrentUserId() {
    return window.app?.auth?.getCurrentUserId() || null;
  }

  getClients() {
    return this.clients;
  }

  getFilteredClients() {
    return this.filteredClients;
  }
}