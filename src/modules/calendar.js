import { calendarService } from './calendar-service.js';

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
    console.log('📅 DEBUG: Calendar init started');
    this.setupEventListeners();
    console.log('📅 DEBUG: Event listeners setup completed');
    this.renderCalendar();
    console.log('📅 DEBUG: Calendar rendered');
    this.loadEvents();
    console.log('📅 DEBUG: Events loading initiated');
  }

  setupEventListeners() {
    console.log('📅 DEBUG: Setting up event listeners...');
    
    // Navigation buttons
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    console.log('📅 DEBUG: Navigation buttons found:', { prevBtn: !!prevBtn, nextBtn: !!nextBtn });
    
    if (prevBtn) prevBtn.addEventListener('click', () => this.previousMonth());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextMonth());

    // View toggle buttons
    const viewButtons = document.querySelectorAll('.view-btn');
    console.log('📅 DEBUG: View buttons found:', viewButtons.length);
    viewButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.getAttribute('data-view');
        this.switchView(view);
      });
    });

    // Add event button
    const addEventBtn = document.getElementById('add-event-btn');
    console.log('📅 DEBUG: Add event button found:', !!addEventBtn);
    if (addEventBtn) {
      console.log('📅 DEBUG: Add event button element:', addEventBtn);
      console.log('📅 DEBUG: Add event button parent:', addEventBtn.parentElement);
    }
    if (addEventBtn) {
      addEventBtn.addEventListener('click', () => this.showAddEventModal());
      console.log('📅 DEBUG: Add event button listener attached');
    }

    // Google Calendar sync button
    const syncBtn = document.getElementById('sync-google-calendar-btn');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => this.syncWithGoogleCalendar());
    }

    // Event forms
    const addEventForm = document.getElementById('add-event-form');
    console.log('📅 DEBUG: Add event form found:', !!addEventForm);
    if (addEventForm) {
      addEventForm.addEventListener('submit', (e) => this.handleAddEvent(e));
      console.log('📅 DEBUG: Add event form listener attached');
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
    
    console.log('📅 DEBUG: Event listeners setup completed');
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
      console.log('📅 DEBUG: Calendar cell clicked, date:', date);
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
    this.loadEvents(); // Reload events for new month
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.renderCalendar();
    this.loadEvents(); // Reload events for new month
  }

  showAddEventModal(date = null) {
    console.log('📅 DEBUG: showAddEventModal called with date:', date);
    
    const modal = document.getElementById('add-event-modal');
    console.log('📅 DEBUG: Modal element found:', !!modal);
    if (modal) {
      console.log('📅 DEBUG: Modal element:', modal);
      console.log('📅 DEBUG: Modal classes:', modal.className);
    }
    
    const dateInput = document.querySelector('#add-event-modal [name="date"]');
    console.log('📅 DEBUG: Date input found:', !!dateInput);
    
    if (date && dateInput) {
      dateInput.value = date.toISOString().split('T')[0];
      console.log('📅 DEBUG: Date set to:', dateInput.value);
    }
    
    console.log('📅 DEBUG: window.app exists:', !!window.app);
    console.log('📅 DEBUG: window.app.modals exists:', !!(window.app && window.app.modals));
    
    if (window.app && window.app.modals) {
      console.log('📅 DEBUG: Calling window.app.modals.show');
      window.app.modals.show('add-event-modal');
      console.log('📅 DEBUG: Modal show called');
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
    if (!userId) {
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Usuario no autenticado', 'error');
      }
      throw new Error('Usuario no autenticado');
    }

    try {
      const event = {
        user_id: userId,
        title: eventData.title,
        type: eventData.type,
        date: eventData.date,
        time: eventData.time,
        amount: eventData.amount,
        description: eventData.description,
        recurring: eventData.recurring,
        frequency: eventData.frequency
      };

      const { data, error } = await calendarService.createEvent(event);
      
      if (error) {
        console.error('Error creating calendar event:', error);
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Error al crear el evento', 'error');
        }
        throw error;
      }

      // Add to local events array
      this.events.unshift(data);
      
      // If recurring, create additional events
      if (data.recurring && data.frequency) {
        await this.createRecurringEventsInDB(data);
      }

      return data;
    } catch (error) {
      console.error('Error in addEvent:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al agregar el evento', 'error');
      }
      throw error;
    }
  }

  async createRecurringEventsInDB(baseEvent) {
    try {
      const { data, error } = await calendarService.createRecurringEvents(baseEvent);
      
      if (error) {
        console.error('Error creating recurring events:', error);
        return;
      }
      
      // Add recurring events to local array
      if (data && data.length > 0) {
        this.events.push(...data);
      }
    } catch (error) {
      console.error('Error in createRecurringEventsInDB:', error);
    }
  }

  createRecurringEvents(baseEvent) {
    // This method is now handled by the service
    // Keep for backward compatibility but don't use
    console.log('📅 Using database-based recurring events');
  }

  async updateEvent(eventId, updates) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Usuario no autenticado', 'error');
      }
      throw new Error('Usuario no autenticado');
    }

    try {
      const { data, error } = await calendarService.updateEvent(eventId, updates);
      
      if (error) {
        console.error('Error updating calendar event:', error);
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Error al actualizar el evento', 'error');
        }
        throw error;
      }

      // Update local events array
      const eventIndex = this.events.findIndex(e => e.id === eventId);
      if (eventIndex !== -1) {
        this.events[eventIndex] = data;
      }

      return data;
    } catch (error) {
      console.error('Error in updateEvent:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al actualizar el evento', 'error');
      }
      throw error;
    }
  }

  async deleteEvent(eventId) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Usuario no autenticado', 'error');
      }
      throw new Error('Usuario no autenticado');
    }

    try {
      const { data, error } = await calendarService.deleteEvent(eventId);
      
      if (error) {
        console.error('Error deleting calendar event:', error);
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Error al eliminar el evento', 'error');
        }
        throw error;
      }

      // Remove from local events array
      this.events = this.events.filter(e => e.id !== eventId);
      
      return true;
    } catch (error) {
      console.error('Error in deleteEvent:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al eliminar el evento', 'error');
      }
      throw error;
    }
  }

  // Legacy method - now handled by service
  async addEventLegacy(eventData) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    // Create event object with generated ID for backward compatibility
    const event = {
      id: this.generateId(),
      user_id: userId,
      title: eventData.title,
      type: eventData.type,
      date: eventData.date,
      time: eventData.time,
      amount: eventData.amount,
      description: eventData.description,
      recurring: eventData.recurring,
      frequency: eventData.frequency,
      created_at: new Date().toISOString()
    };

    this.events.push(event);
    
    // If recurring, create additional events
    if (event.recurring && event.frequency) {
      this.createRecurringEvents(event);
    }

    return event;
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
        ${event.description ? `<div class="event-detail-item"><strong>Descripción:</strong> <span class="event-description-text"></span></div>` : ''}
        ${event.recurring ? `<div class="event-detail-item"><strong>Recurrencia:</strong> ${this.getFrequencyName(event.frequency)}</div>` : ''}
      `;
      
      // Safely set user-provided description
      if (event.description) {
        const descriptionElement = content.querySelector('.event-description-text');
        if (descriptionElement) {
          descriptionElement.textContent = event.description;
        }
      }
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

  async loadEvents() {
    const userId = this.getCurrentUserId();
    if (!userId) {
      console.log('📅 No user authenticated, skipping event loading');
      this.events = [];
      this.updateUpcomingEventsCount();
      return;
    }

    try {
      console.log('📅 Loading calendar events from Supabase...');
      
      // Get date range for current month view
      const startOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
      const endOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
      
      // Extend range to include previous and next month for better UX
      const rangeStart = new Date(startOfMonth);
      rangeStart.setMonth(rangeStart.getMonth() - 1);
      const rangeEnd = new Date(endOfMonth);
      rangeEnd.setMonth(rangeEnd.getMonth() + 1);
      
      const monthStartISO = rangeStart.toISOString().split('T')[0];
      const monthEndISO = rangeEnd.toISOString().split('T')[0];
      
      const { data, error } = await calendarService.listEvents(userId, monthStartISO, monthEndISO);
      
      if (error) {
        console.error('Error loading calendar events:', error);
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Error al cargar eventos del calendario', 'error');
        }
        return;
      }
      
      this.events = data || [];
      console.log('📅 Calendar events loaded:', this.events.length, 'items');
      
      // Update UI
      this.renderCalendar();
      this.updateUpcomingEventsCount();
      
    } catch (error) {
      console.error('Error in loadEvents:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al cargar eventos del calendario', 'error');
      }
    }
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