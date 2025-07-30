export class ClientsManager {
  constructor() {
    this.clients = [];
    this.currentView = 'grid';
  }

  async init() {
    this.setupEventListeners();
    await this.loadClients();
    this.updateUI();
  }

  setupEventListeners() {
    const addClientBtn = document.getElementById('add-client-btn');
    addClientBtn?.addEventListener('click', () => this.showAddClientModal());
    document.getElementById('add-client-form')?.addEventListener('submit', (e) => this.handleAddClient(e));
  }

  async loadClients() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const { data, error } = await window.app.data.supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        this.clients = [];
        return;
      }

      this.clients = data || [];
    } catch (error) {
      this.clients = [];
    }
  }

  async addClient(clientData) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      let ageRange = 'no_definido';
      if (clientData.birthDate) {
        ageRange = this.calculateAgeRange(clientData.birthDate);
      }
      
      const client = {
        user_id: userId,
        name: clientData.name,
        email: clientData.email || null,
        phone: clientData.phone || null,
        birth_date: clientData.birthDate || null,
        age_range: ageRange,
        client_type: clientData.clientType || 'individual',
        status: clientData.status || 'active'
      };

      const { data, error } = await window.app.data.supabase
        .from('clients')
        .insert([client])
        .select();

      if (error) {
        return false;
      }

      this.clients.unshift(data[0]);
      this.updateUI();
      return true;
    } catch (error) {
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
        return false;
      }

      this.clients = this.clients.filter(c => c.id !== clientId);
      this.updateUI();
      return true;
    } catch (error) {
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

  updateUI() {
    this.updateStats();
    this.updateClientsList();
  }

  updateStats() {
    const totalClients = this.clients.length;
    const activeClients = this.clients.filter(c => c.status === 'active').length;
    document.getElementById('total-clients').textContent = totalClients;
    document.getElementById('active-clients').textContent = activeClients;
  }

  updateClientsList() {
    const container = document.getElementById('clients-list');
    if (!container) return;

    container.innerHTML = '';

    if (this.clients.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>No se encontraron clientes</h3>
          <p>Comienza agregando tu primer cliente</p>
          <button class="btn btn-primary" onclick="window.app.clients.showAddClientModal()">
            <span>👤</span>
            Agregar Cliente
          </button>
        </div>
      `;
      return;
    }

    this.clients.forEach(client => {
      const clientElement = this.createClientElement(client);
      container.appendChild(clientElement);
    });
  }

  createClientElement(client) {
    const element = document.createElement('div');
    element.className = `client-item ${client.status}`;
    
    element.innerHTML = `
      <div class="client-card">
        <div class="client-avatar">${client.name.charAt(0).toUpperCase()}</div>
        <div class="client-info">
          <h4>${client.name}</h4>
          <p>${client.client_type === 'individual' ? '👤' : '🏢'} ${client.email || client.phone || ''}</p>
        </div>
        <button class="client-delete" onclick="window.app.clients.confirmDeleteClient('${client.id}', '${client.name}')">🗑️</button>
      </div>
    `;

    return element;
  }

  showAddClientModal() {
    window.app?.modals?.show('add-client-modal');
  }

  confirmDeleteClient(clientId, clientName) {
    if (confirm(`¿Estás seguro de que quieres eliminar al cliente "${clientName}"?`)) {
      this.deleteClient(clientId);
    }
  }

  async handleAddClient(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const clientData = Object.fromEntries(formData.entries());
    
    if (!clientData.name) return;

    const success = await this.addClient(clientData);
    if (success) {
      window.app?.modals?.hide('add-client-modal');
      window.app?.ui?.showAlert('Cliente agregado', 'success');
    }
  }

  getCurrentUserId() {
    return window.app?.auth?.getCurrentUserId() || null;
  }
}