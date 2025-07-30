export class ContactsManager {
  constructor() {
    this.contacts = [];
    this.filteredContacts = [];
    this.filters = {
      search: '',
      type: '',
      status: ''
    };
  }

  async init() {
    console.log('📇 Initializing Contacts Manager...');
    this.setupEventListeners();
    await this.loadContacts();
    this.updateUI();
  }

  setupEventListeners() {
    // Add contact button
    const addContactBtn = document.getElementById('add-contact-btn');
    if (addContactBtn) {
      addContactBtn.addEventListener('click', () => this.showAddContactModal());
    }

    // Filter inputs
    const searchInput = document.getElementById('contact-search');
    const typeFilter = document.getElementById('contact-type-filter');
    const statusFilter = document.getElementById('contact-status-filter');
    const clearFiltersBtn = document.getElementById('clear-contact-filters');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.updateFilter('search', e.target.value));
    }
    
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => this.updateFilter('type', e.target.value));
    }
    
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => this.updateFilter('status', e.target.value));
    }
    
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => this.clearFilters());
    }

    // Form submissions
    const addContactForm = document.getElementById('add-contact-form');
    const editContactForm = document.getElementById('edit-contact-form');
    
    if (addContactForm) {
      addContactForm.addEventListener('submit', (e) => this.handleAddContact(e));
    }
    
    if (editContactForm) {
      editContactForm.addEventListener('submit', (e) => this.handleEditContact(e));
    }
  }

  async loadContacts() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      console.log('📇 Loading contacts for user:', userId);
      
      const { data, error } = await window.app.data.supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading contacts:', error);
        this.contacts = [];
        return;
      }

      this.contacts = data || [];
      this.filteredContacts = [...this.contacts];
      
      console.log('📇 Contacts loaded:', this.contacts.length);
    } catch (error) {
      console.error('Error in loadContacts:', error);
      this.contacts = [];
      this.filteredContacts = [];
    }
  }

  async addContact(contactData) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      console.log('📇 Adding contact:', contactData);
      
      const contact = {
        user_id: userId,
        name: contactData.name,
        type: contactData.type,
        amount: contactData.amount ? parseFloat(contactData.amount) : null,
        notes: contactData.notes || null,
        reminder_date: contactData.reminderDate || null,
        status: 'active'
      };

      const { data, error } = await window.app.data.supabase
        .from('contacts')
        .insert([contact])
        .select();

      if (error) {
        console.error('Error adding contact:', error);
        return false;
      }

      this.contacts.unshift(data[0]);
      this.applyFilters();
      this.updateUI();
      
      console.log('✅ Contact added successfully');
      return true;
    } catch (error) {
      console.error('Error in addContact:', error);
      return false;
    }
  }

  async updateContact(contactId, contactData) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      console.log('📇 Updating contact:', contactId, contactData);
      
      const updates = {
        name: contactData.name,
        type: contactData.type,
        amount: contactData.amount ? parseFloat(contactData.amount) : null,
        notes: contactData.notes || null,
        reminder_date: contactData.reminderDate || null,
        status: contactData.status || 'active'
      };

      const { data, error } = await window.app.data.supabase
        .from('contacts')
        .update(updates)
        .eq('id', contactId)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('Error updating contact:', error);
        return false;
      }

      // Update local data
      const index = this.contacts.findIndex(c => c.id === contactId);
      if (index !== -1) {
        this.contacts[index] = data[0];
      }
      
      this.applyFilters();
      this.updateUI();
      
      console.log('✅ Contact updated successfully');
      return true;
    } catch (error) {
      console.error('Error in updateContact:', error);
      return false;
    }
  }

  async deleteContact(contactId) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      const { error } = await window.app.data.supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting contact:', error);
        return false;
      }

      this.contacts = this.contacts.filter(c => c.id !== contactId);
      this.applyFilters();
      this.updateUI();
      
      console.log('✅ Contact deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in deleteContact:', error);
      return false;
    }
  }

  updateFilter(filterType, value) {
    this.filters[filterType] = value;
    this.applyFilters();
    this.updateContactsList();
  }

  applyFilters() {
    this.filteredContacts = this.contacts.filter(contact => {
      // Search filter
      if (this.filters.search) {
        const searchTerm = this.filters.search.toLowerCase();
        const matchesSearch = 
          contact.name.toLowerCase().includes(searchTerm) ||
          (contact.notes && contact.notes.toLowerCase().includes(searchTerm));
        
        if (!matchesSearch) return false;
      }

      // Type filter
      if (this.filters.type && contact.type !== this.filters.type) {
        return false;
      }

      // Status filter
      if (this.filters.status && contact.status !== this.filters.status) {
        return false;
      }

      return true;
    });
  }

  clearFilters() {
    this.filters = {
      search: '',
      type: '',
      status: ''
    };

    // Clear form inputs
    const searchInput = document.getElementById('contact-search');
    const typeFilter = document.getElementById('contact-type-filter');
    const statusFilter = document.getElementById('contact-status-filter');

    if (searchInput) searchInput.value = '';
    if (typeFilter) typeFilter.value = '';
    if (statusFilter) statusFilter.value = '';

    this.applyFilters();
    this.updateContactsList();
  }

  updateUI() {
    this.updateStats();
    this.updateContactsList();
    this.updateRecentContacts();
  }

  updateStats() {
    const totalContacts = this.contacts.length;
    const contactsWithAmount = this.contacts.filter(c => c.amount && c.amount > 0).length;
    const pendingReminders = this.contacts.filter(c => 
      c.reminder_date && new Date(c.reminder_date) >= new Date()
    ).length;
    
    // Dominant type
    const typeCounts = {};
    this.contacts.forEach(contact => {
      const type = contact.type || 'otro';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    const dominantType = Object.keys(typeCounts).reduce((a, b) => 
      typeCounts[a] > typeCounts[b] ? a : b, 'otro'
    );

    const typeLabels = {
      'persona': 'Persona',
      'empresa': 'Empresa', 
      'alquiler': 'Alquiler',
      'otro': 'Otro'
    };

    // Update DOM
    const totalElement = document.getElementById('total-contacts');
    const withAmountElement = document.getElementById('contacts-with-amount');
    const remindersElement = document.getElementById('pending-reminders');
    const typeElement = document.getElementById('contacts-by-type');

    if (totalElement) totalElement.textContent = totalContacts;
    if (withAmountElement) withAmountElement.textContent = contactsWithAmount;
    if (remindersElement) remindersElement.textContent = pendingReminders;
    if (typeElement) {
      typeElement.textContent = totalContacts > 0 ? typeLabels[dominantType] : '-';
    }
  }

  updateContactsList() {
    const container = document.getElementById('contacts-list');
    if (!container) return;

    container.innerHTML = '';

    if (this.filteredContacts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📇</div>
          <h3>No se encontraron contactos</h3>
          <p>${this.contacts.length === 0 ? 'Comienza agregando tu primer contacto' : 'Intenta ajustar los filtros'}</p>
          ${this.contacts.length === 0 ? `
            <button class="btn btn-primary" onclick="window.app.contacts.showAddContactModal()">
              <span>➕</span>
              Agregar Contacto
            </button>
          ` : ''}
        </div>
      `;
      return;
    }

    this.filteredContacts.forEach(contact => {
      const contactElement = this.createContactElement(contact);
      container.appendChild(contactElement);
    });
  }

  createContactElement(contact) {
    const element = document.createElement('div');
    element.className = `contact-card ${contact.status}`;
    
    const typeIcons = {
      'persona': '👤',
      'empresa': '🏢',
      'alquiler': '🏠',
      'otro': '📋'
    };
    
    const typeLabels = {
      'persona': 'Persona',
      'empresa': 'Empresa',
      'alquiler': 'Alquiler',
      'otro': 'Otro'
    };
    
    element.innerHTML = `
      <div class="contact-header">
        <div class="contact-type-icon">${typeIcons[contact.type] || '📋'}</div>
        <div class="contact-status-badge ${contact.status}">
          ${contact.status === 'active' ? '✅' : '⏸️'}
        </div>
      </div>
      <div class="contact-info">
        <h4 class="contact-name">${contact.name}</h4>
        <p class="contact-type">${typeLabels[contact.type] || 'Otro'}</p>
        ${contact.amount ? `<p class="contact-amount">💰 ${this.formatCurrency(contact.amount)}</p>` : ''}
        ${contact.reminder_date ? `<p class="contact-reminder">📅 ${new Date(contact.reminder_date).toLocaleDateString('es-ES')}</p>` : ''}
        ${contact.notes ? `<p class="contact-notes">📝 ${contact.notes.substring(0, 50)}${contact.notes.length > 50 ? '...' : ''}</p>` : ''}
      </div>
      <div class="contact-actions">
        <button class="contact-action-btn edit-btn" onclick="window.app.contacts.showEditContactModal('${contact.id}')" title="Editar">
          ✏️
        </button>
        <button class="contact-action-btn delete-btn" onclick="window.app.contacts.confirmDeleteContact('${contact.id}', '${contact.name}')" title="Eliminar">
          🗑️
        </button>
      </div>
    `;

    return element;
  }

  updateRecentContacts() {
    const container = document.getElementById('recent-contacts-list');
    if (!container) return;

    const recentContacts = this.contacts.slice(0, 3);

    container.innerHTML = '';

    if (recentContacts.length === 0) {
      container.innerHTML = `
        <div class="empty-state-small">
          <p>No hay contactos registrados</p>
        </div>
      `;
      return;
    }

    recentContacts.forEach(contact => {
      const typeIcons = {
        'persona': '👤',
        'empresa': '🏢',
        'alquiler': '🏠',
        'otro': '📋'
      };

      const item = document.createElement('div');
      item.className = 'recent-contact-item';
      
      item.innerHTML = `
        <div class="contact-icon">${typeIcons[contact.type] || '📋'}</div>
        <div class="contact-details">
          <div class="contact-name">${contact.name}</div>
          ${contact.amount ? `<div class="contact-amount">${this.formatCurrency(contact.amount)}</div>` : ''}
        </div>
      `;
      
      container.appendChild(item);
    });
  }

  // Modal methods
  showAddContactModal() {
    if (window.app && window.app.modals) {
      window.app.modals.show('add-contact-modal');
    }
  }

  showEditContactModal(contactId) {
    const contact = this.contacts.find(c => c.id === contactId);
    if (!contact) return;

    // Populate form
    document.getElementById('edit-contact-id').value = contact.id;
    document.getElementById('edit-contact-name').value = contact.name;
    document.getElementById('edit-contact-type').value = contact.type;
    document.getElementById('edit-contact-amount').value = contact.amount || '';
    document.getElementById('edit-contact-notes').value = contact.notes || '';
    document.getElementById('edit-contact-reminder').value = contact.reminder_date || '';
    document.getElementById('edit-contact-status').value = contact.status;

    if (window.app && window.app.modals) {
      window.app.modals.show('edit-contact-modal');
    }
  }

  confirmDeleteContact(contactId, contactName) {
    if (confirm(`¿Estás seguro de que quieres eliminar el contacto "${contactName}"?`)) {
      this.deleteContact(contactId).then(success => {
        if (success && window.app && window.app.ui) {
          window.app.ui.showAlert('Contacto eliminado correctamente', 'success');
        } else if (window.app && window.app.ui) {
          window.app.ui.showAlert('Error al eliminar el contacto', 'error');
        }
      });
    }
  }

  // Form handlers
  async handleAddContact(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const contactData = Object.fromEntries(formData.entries());
    
    if (!contactData.name || !contactData.type) {
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('El nombre y tipo son obligatorios', 'error');
      }
      return;
    }

    try {
      const success = await this.addContact(contactData);
      
      if (success) {
        if (window.app && window.app.modals) {
          window.app.modals.hide('add-contact-modal');
        }
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Contacto agregado correctamente', 'success');
        }
      } else {
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Error al agregar el contacto', 'error');
        }
      }
    } catch (error) {
      console.error('Error in handleAddContact:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al agregar el contacto', 'error');
      }
    }
  }

  async handleEditContact(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const contactData = Object.fromEntries(formData.entries());
    const contactId = contactData.contactId;
    
    if (!contactData.name || !contactData.type) {
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('El nombre y tipo son obligatorios', 'error');
      }
      return;
    }

    try {
      const success = await this.updateContact(contactId, contactData);
      
      if (success) {
        if (window.app && window.app.modals) {
          window.app.modals.hide('edit-contact-modal');
        }
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Contacto actualizado correctamente', 'success');
        }
      } else {
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Error al actualizar el contacto', 'error');
        }
      }
    } catch (error) {
      console.error('Error in handleEditContact:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al actualizar el contacto', 'error');
      }
    }
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getCurrentUserId() {
    return window.app?.auth?.getCurrentUserId() || null;
  }

  getContacts() {
    return this.contacts;
  }

  getFilteredContacts() {
    return this.filteredContacts;
  }
}