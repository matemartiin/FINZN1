export class CalendarManager {
  constructor() {
    this.currentDate = new Date();
    this.currentView = 'month';
    this.events = [];
    this.selectedDate = null;
    this.googleCalendarIntegration = false;
  }

  init() {
    console.log('📅 Initializing Calendar Manager...');
    this.setupEventListeners();
    this.renderCalendar();
    this.loadEvents();
  }

  setupEventListeners() {
    // Navigation buttons
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    
    if (prevBtn) prevBtn.addEventListener('click', () => this.previousMonth());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextMonth());

    // View toggle buttons
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.getAttribute('data-view');
        this.switchView(view);
      });
    });

    // Add event button
    const addEventBtn = document.getElementById('add-event-btn');
    if (addEventBtn) {
      addEventBtn.addEventListener('click', () => this.showAddEventModal());
    }

    // Google Calendar sync button
    const syncBtn = document.getElementById('sync-google-calendar-btn');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => this.syncWithGoogleCalendar());
    }

    // Event forms
    const addEventForm = document.getElementById('add-event-form');
    if (addEventForm) {
      addEventForm.addEventListener('submit', (e) => this.handleAddEvent(e));
    }

    const editEventForm = document.getElementById('edit-event-form');
    if (editEventForm) {
      editEventForm.addEventListener('submit', (e) => this.handleEditEvent(e));
    }

    // Recurring checkbox
    const recurringCheckbox = document.getElementById('event-recurring');
    const recurringOptions = document.getElementById('recurring-options');
    
    if (recurringCheckbox && recurringOptions) {
      recurringCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          recurringOptions.classList.remove('hidden');
        } else {
          recurringOptions.classList.add('hidden');
        }
      });
    }

    // Delete event button
    const deleteEventBtn = document.getElementById('delete-event-btn');
    if (deleteEventBtn) {
      deleteEventBtn.addEventListener('click', () => this.handleDeleteEvent());
    }

    // Edit from details
    const editFromDetailsBtn = document.getElementById('edit-event-from-details');
    if (editFromDetailsBtn) {
      editFromDetailsBtn.addEventListener('click', () => this.editEventFromDetails());
    }
  }

  renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearElement = document.getElementById('current-month-year');
    
    if (!calendarGrid || !monthYearElement) return;

    // Update month/year display
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    monthYearElement.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

    if (this.currentView === 'month') {
      this.renderMonthView(calendarGrid);
    } else if (this.currentView === 'week') {
      this.renderWeekView(calendarGrid);
    } else if (this.currentView === 'agenda') {
      this.renderAgendaView();
    }
  }

  renderMonthView(container) {
    container.innerHTML = '';
    container.className = 'calendar-grid month-view';

    // Add day headers
    const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayHeaders.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-day-header';
      dayHeader.textContent = day;
      container.appendChild(dayHeader);
    });

    // Get first day of month and number of days
    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Render 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);
      
      const dayCell = this.createDayCell(cellDate);
      container.appendChild(dayCell);
    }
  }

  createDayCell(date) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    
    const isCurrentMonth = date.getMonth() === this.currentDate.getMonth();
    const isToday = this.isToday(date);
    const dayEvents = this.getEventsForDate(date);

    if (!isCurrentMonth) {
      cell.classList.add('other-month');
    }
    
    if (isToday) {
      cell.classList.add('today');
    }

    // Day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    cell.appendChild(dayNumber);

    // Events
    if (dayEvents.length > 0) {
      const eventsContainer = document.createElement('div');
      eventsContainer.className = 'day-events';
      
      dayEvents.slice(0, 3).forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = `day-event ${event.type}`;
        eventElement.textContent = event.title;
        eventElement.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showEventDetails(event);
        });
        eventsContainer.appendChild(eventElement);
      });

      if (dayEvents.length > 3) {
        const moreEvents = document.createElement('div');
        moreEvents.className = 'more-events';
        moreEvents.textContent = `+${dayEvents.length - 3} más`;
        eventsContainer.appendChild(moreEvents);
      }

      cell.appendChild(eventsContainer);
    }

    // Click handler for adding events
    cell.addEventListener('click', () => {
      this.selectedDate = date;
      this.showAddEventModal(date);
    });

    return cell;
  }

  renderAgendaView() {
    const calendarGrid = document.getElementById('calendar-grid');
    const agendaView = document.getElementById('calendar-agenda');
    
    if (calendarGrid) calendarGrid.classList.add('hidden');
    if (agendaView) {
      agendaView.classList.remove('hidden');
      this.updateAgendaEvents();
    }
  }

  updateAgendaEvents() {
    const agendaEvents = document.getElementById('agenda-events');
    if (!agendaEvents) return;

    agendaEvents.innerHTML = '';

    // Get events for current month
    const monthEvents = this.events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === this.currentDate.getMonth() &&
             eventDate.getFullYear() === this.currentDate.getFullYear();
    });

    // Sort by date
    monthEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (monthEvents.length === 0) {
      agendaEvents.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>No hay eventos este mes</h3>
          <p>Agrega eventos financieros para mantener un control de tus fechas importantes</p>
        </div>
      `;
      return;
    }

    monthEvents.forEach(event => {
      const eventElement = document.createElement('div');
      eventElement.className = `agenda-event ${event.type}`;
      
      const eventDate = new Date(event.date);
      const dateStr = eventDate.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      eventElement.innerHTML = `
        <div class="agenda-event-date">${dateStr}</div>
        <div class="agenda-event-details">
          <div class="agenda-event-title">${this.getEventTypeIcon(event.type)} ${event.title}</div>
          <div class="agenda-event-description">${event.description || ''}</div>
          ${event.amount ? `<div class="agenda-event-amount">${this.formatCurrency(event.amount)}</div>` : ''}
        </div>
        <div class="agenda-event-actions">
          <button class="btn btn-sm btn-secondary" onclick="window.app.calendar.showEventDetails('${event.id}')">Ver</button>
          <button class="btn btn-sm btn-primary" onclick="window.app.calendar.editEvent('${event.id}')">Editar</button>
        </div>
      `;

      agendaEvents.appendChild(eventElement);
    });
  }

  switchView(view) {
    this.currentView = view;
    
    // Update active button
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');

    // Show/hide appropriate views
    const calendarGrid = document.getElementById('calendar-grid');
    const agendaView = document.getElementById('calendar-agenda');

    if (view === 'agenda') {
      if (calendarGrid) calendarGrid.classList.add('hidden');
      if (agendaView) agendaView.classList.remove('hidden');
      this.updateAgendaEvents();
    } else {
      if (calendarGrid) calendarGrid.classList.remove('hidden');
      if (agendaView) agendaView.classList.add('hidden');
      this.renderCalendar();
    }
  }

  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.renderCalendar();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.renderCalendar();
  }

  showAddEventModal(date = null) {
    const modal = document.getElementById('add-event-modal');
    const dateInput = document.getElementById('event-date');
    
    if (date && dateInput) {
      dateInput.value = date.toISOString().split('T')[0];
    }
    
    if (window.app && window.app.modals) {
      window.app.modals.show('add-event-modal');
    }
  }

  async handleAddEvent(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const eventData = {
      title: formData.get('title'),
      type: formData.get('type'),
      date: formData.get('date'),
      time: formData.get('time'),
      amount: formData.get('amount') ? parseFloat(formData.get('amount')) : null,
      description: formData.get('description'),
      recurring: formData.get('recurring') === 'on',
      frequency: formData.get('frequency'),
      notification: formData.get('notification') === 'on'
    };

    try {
      await this.addEvent(eventData);
      
      if (window.app && window.app.modals) {
        window.app.modals.hide('add-event-modal');
      }
      
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Evento agregado exitosamente', 'success');
      }
      
      this.renderCalendar();
      this.updateUpcomingEventsCount();
      
    } catch (error) {
      console.error('Error adding event:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al agregar el evento', 'error');
      }
    }
  }

  async addEvent(eventData) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    // For now, store in memory (later will be database)
    const event = {
      id: this.generateId(),
      user_id: userId,
      ...eventData,
      created_at: new Date().toISOString()
    };

    this.events.push(event);
    
    // If recurring, create additional events
    if (event.recurring && event.frequency) {
      this.createRecurringEvents(event);
    }

    return event;
  }

  createRecurringEvents(baseEvent) {
    const startDate = new Date(baseEvent.date);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1); // Create events for 1 year

    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      if (baseEvent.frequency === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (baseEvent.frequency === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (baseEvent.frequency === 'yearly') {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      }

      if (currentDate <= endDate) {
        const recurringEvent = {
          ...baseEvent,
          id: this.generateId(),
          date: currentDate.toISOString().split('T')[0],
          parent_id: baseEvent.id
        };
        
        this.events.push(recurringEvent);
      }
    }
  }

  showEventDetails(eventId) {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return;

    const modal = document.getElementById('event-details-modal');
    const content = document.getElementById('event-details-content');
    const title = document.getElementById('event-details-title');
    
    if (title) title.textContent = event.title;
    
    if (content) {
      const eventDate = new Date(event.date);
      const dateStr = eventDate.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      content.innerHTML = `
        <div class="event-detail-item">
          <strong>Tipo:</strong> ${this.getEventTypeIcon(event.type)} ${this.getEventTypeName(event.type)}
        </div>
        <div class="event-detail-item">
          <strong>Fecha:</strong> ${dateStr}
        </div>
        ${event.time ? `<div class="event-detail-item"><strong>Hora:</strong> ${event.time}</div>` : ''}
        ${event.amount ? `<div class="event-detail-item"><strong>Monto:</strong> ${this.formatCurrency(event.amount)}</div>` : ''}
        ${event.description ? `<div class="event-detail-item"><strong>Descripción:</strong> ${event.description}</div>` : ''}
        ${event.recurring ? `<div class="event-detail-item"><strong>Recurrencia:</strong> ${this.getFrequencyName(event.frequency)}</div>` : ''}
      `;
    }

    // Store event ID for editing
    if (modal) modal.dataset.eventId = eventId;
    
    if (window.app && window.app.modals) {
      window.app.modals.show('event-details-modal');
    }
  }

  editEvent(eventId) {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return;

    // Populate edit form
    document.getElementById('edit-event-title').value = event.title;
    document.getElementById('edit-event-type').value = event.type;
    document.getElementById('edit-event-date').value = event.date;
    document.getElementById('edit-event-time').value = event.time || '';
    document.getElementById('edit-event-amount').value = event.amount || '';
    document.getElementById('edit-event-description').value = event.description || '';

    // Store event ID
    const modal = document.getElementById('edit-event-modal');
    if (modal) modal.dataset.eventId = eventId;

    if (window.app && window.app.modals) {
      window.app.modals.show('edit-event-modal');
    }
  }

  editEventFromDetails() {
    const modal = document.getElementById('event-details-modal');
    const eventId = modal?.dataset.eventId;
    
    if (eventId) {
      if (window.app && window.app.modals) {
        window.app.modals.hide('event-details-modal');
      }
      this.editEvent(eventId);
    }
  }

  async handleEditEvent(e) {
    e.preventDefault();
    
    const modal = document.getElementById('edit-event-modal');
    const eventId = modal?.dataset.eventId;
    
    if (!eventId) return;

    const formData = new FormData(e.target);
    const updates = {
      title: formData.get('title'),
      type: formData.get('type'),
      date: formData.get('date'),
      time: formData.get('time'),
      amount: formData.get('amount') ? parseFloat(formData.get('amount')) : null,
      description: formData.get('description')
    };

    try {
      await this.updateEvent(eventId, updates);
      
      if (window.app && window.app.modals) {
        window.app.modals.hide('edit-event-modal');
      }
      
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Evento actualizado exitosamente', 'success');
      }
      
      this.renderCalendar();
      
    } catch (error) {
      console.error('Error updating event:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al actualizar el evento', 'error');
      }
    }
  }

  async updateEvent(eventId, updates) {
    const eventIndex = this.events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) throw new Error('Evento no encontrado');

    this.events[eventIndex] = { ...this.events[eventIndex], ...updates };
    return this.events[eventIndex];
  }

  async handleDeleteEvent() {
    const modal = document.getElementById('edit-event-modal');
    const eventId = modal?.dataset.eventId;
    
    if (!eventId) return;

    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      try {
        await this.deleteEvent(eventId);
        
        if (window.app && window.app.modals) {
          window.app.modals.hide('edit-event-modal');
        }
        
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Evento eliminado exitosamente', 'success');
        }
        
        this.renderCalendar();
        this.updateUpcomingEventsCount();
        
      } catch (error) {
        console.error('Error deleting event:', error);
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Error al eliminar el evento', 'error');
        }
      }
    }
  }

  async deleteEvent(eventId) {
    this.events = this.events.filter(e => e.id !== eventId);
  }

  loadEvents() {
    // For now, load from memory
    // Later this will load from database
    console.log('📅 Loading calendar events...');
    this.updateUpcomingEventsCount();
  }

  updateUpcomingEventsCount() {
    const badge = document.getElementById('upcoming-events');
    if (!badge) return;

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const upcomingEvents = this.events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate <= nextWeek;
    });

    badge.textContent = upcomingEvents.length;
    badge.style.display = upcomingEvents.length > 0 ? 'flex' : 'none';
  }

  getEventsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return this.events.filter(event => event.date === dateStr);
  }

  isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  // Google Calendar Integration (Future)
  async syncWithGoogleCalendar() {
    if (window.app && window.app.ui) {
      window.app.ui.showAlert('Integración con Google Calendar próximamente', 'info');
    }
    
    // Future implementation:
    // 1. Authenticate with Google Calendar API
    // 2. Fetch events from Google Calendar
    // 3. Sync with local events
    // 4. Handle conflicts and duplicates
  }

  // Utility methods
  getCurrentUserId() {
    return window.app?.auth?.getCurrentUserId() || null;
  }

  generateId() {
    return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getEventTypeIcon(type) {
    const icons = {
      'payment': '💳',
      'income': '💰',
      'card-close': '🏦',
      'reminder': '⏰',
      'deadline': '📅'
    };
    return icons[type] || '📅';
  }

  getEventTypeName(type) {
    const names = {
      'payment': 'Pago de Cuota',
      'income': 'Cobro',
      'card-close': 'Cierre de Tarjeta',
      'reminder': 'Recordatorio',
      'deadline': 'Vencimiento'
    };
    return names[type] || 'Evento';
  }

  getFrequencyName(frequency) {
    const names = {
      'weekly': 'Semanal',
      'monthly': 'Mensual',
      'yearly': 'Anual'
    };
    return names[frequency] || 'Una vez';
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}