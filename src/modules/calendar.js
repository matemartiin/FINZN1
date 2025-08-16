import { calendarService } from './calendar-service.js';
import { DOMHelpers } from '../utils/dom-helpers.js';

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

    // Add event for specific day button (from day events modal)
    const addEventForDayBtn = document.getElementById('add-event-for-day');
    if (addEventForDayBtn) {
      addEventForDayBtn.addEventListener('click', () => this.showAddEventModalForSelectedDate());
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
          this.showEventDetails(event.id);
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

    // Click handler for viewing/adding events
    cell.addEventListener('click', () => {
      console.log('📅 DEBUG: Calendar cell clicked, date:', date);
      this.selectedDate = date;
      
      if (dayEvents.length > 0) {
        // If there are events for this day, show the day events modal
        this.showDayEventsModal(date, dayEvents);
      } else {
        // If no events, directly show add event modal
        this.showAddEventModal(date);
      }
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
    
    const dateInput = document.getElementById('add-event-date');
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
    console.log('📅 DEBUG: handleAddEvent called');
    
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

    console.log('📅 DEBUG: Event data to create:', eventData);

    // Validation
    if (!eventData.title || !eventData.type || !eventData.date) {
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Por favor completa todos los campos requeridos', 'error');
      }
      return;
    }

    try {
      await this.addEvent(eventData);
      
      // Clear the form
      e.target.reset();
      
      if (window.app && window.app.modals) {
        window.app.modals.hide('add-event-modal');
      }
      
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Evento agregado exitosamente', 'success');
      }
      
      // Reload events to ensure persistence
      await this.loadEvents();
      this.updateUpcomingEventsCount();
      
    } catch (error) {
      console.error('Error adding event:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al agregar el evento: ' + (error.message || 'Error desconocido'), 'error');
      }
    }
  }

  async addEvent(eventData) {
    console.log('📅 DEBUG: addEvent called with:', eventData);
    
    const userId = this.getCurrentUserId();
    console.log('📅 DEBUG: Current user ID:', userId);
    
    if (!userId) {
      const error = new Error('Usuario no autenticado');
      console.error('📅 ERROR: No authenticated user');
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Usuario no autenticado', 'error');
      }
      throw error;
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
        recurring: eventData.recurring || false,
        frequency: eventData.frequency
      };

      console.log('📅 DEBUG: Calling calendarService.createEvent with:', event);
      
      const { data, error } = await calendarService.createEvent(event);
      
      console.log('📅 DEBUG: calendarService.createEvent response:', { data, error });
      
      if (error) {
        console.error('📅 ERROR: Creating calendar event:', error);
        const errorMessage = error.message || 'Error desconocido al crear el evento';
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Error al crear el evento: ' + errorMessage, 'error');
        }
        throw new Error(errorMessage);
      }

      if (!data) {
        console.error('📅 ERROR: No data returned from createEvent');
        throw new Error('No se pudo crear el evento - sin datos de respuesta');
      }

      // Add to local events array
      this.events.unshift(data);
      console.log('📅 DEBUG: Event added to local array. Total events:', this.events.length);
      console.log('📅 DEBUG: Local events array:', this.events.map(e => ({id: e.id, title: e.title, date: e.date})));
      
      // If recurring, create additional events
      if (data.recurring && data.frequency) {
        console.log('📅 DEBUG: Creating recurring events...');
        await this.createRecurringEventsInDB(data);
      }

      // Force a reload from database to ensure persistence
      console.log('📅 DEBUG: Reloading events after creation to verify persistence...');
      await this.loadEvents();
      
      // Refresh calendar display
      console.log('📅 DEBUG: Refreshing calendar display...');
      this.renderCalendar();

      return data;
    } catch (error) {
      console.error('📅 ERROR: Exception in addEvent:', error);
      const errorMessage = error.message || 'Error desconocido';
      throw new Error(errorMessage);
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
    console.log('📅 DEBUG: showEventDetails called with ID:', eventId);
    
    const event = this.events.find(e => e.id === eventId);
    if (!event) {
      console.error('📅 ERROR: Event not found with ID:', eventId);
      console.log('📅 DEBUG: Available events:', this.events.map(e => ({ id: e.id, title: e.title })));
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Evento no encontrado', 'error');
      }
      return;
    }

    console.log('📅 DEBUG: Found event:', event);

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
    
    // Hide day events modal first if it's open
    const dayEventsModal = document.getElementById('day-events-modal');
    if (dayEventsModal && !dayEventsModal.classList.contains('hidden')) {
      if (window.app && window.app.modals) {
        window.app.modals.hide('day-events-modal');
      }
    }
    
    // Show event details modal
    if (window.app && window.app.modals) {
      setTimeout(() => {
        window.app.modals.show('event-details-modal');
      }, 100);
    }
  }

  editEvent(eventId) {
    console.log('📅 DEBUG: editEvent called with ID:', eventId);
    
    const event = this.events.find(e => e.id === eventId);
    if (!event) {
      console.error('📅 ERROR: Event not found for editing:', eventId);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Evento no encontrado', 'error');
      }
      return;
    }

    console.log('📅 DEBUG: Found event for editing:', event);

    // Populate edit form safely
    DOMHelpers.safeSetValue('edit-event-title', event.title);
    DOMHelpers.safeSetValue('edit-event-type', event.type);
    DOMHelpers.safeSetValue('edit-event-date', event.date);
    DOMHelpers.safeSetValue('edit-event-time', event.time || '');
    DOMHelpers.safeSetValue('edit-event-amount', event.amount || '');
    DOMHelpers.safeSetValue('edit-event-description', event.description || '');

    // Store event ID safely
    const modal = DOMHelpers.safeGetElement('edit-event-modal');
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
      console.log('📅 DEBUG: User ID:', userId);
      
      // Get date range for current month view (extended range)
      const startOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
      const endOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
      
      // Extend range to include previous and next month for better UX
      const rangeStart = new Date(startOfMonth);
      rangeStart.setMonth(rangeStart.getMonth() - 1);
      const rangeEnd = new Date(endOfMonth);
      rangeEnd.setMonth(rangeEnd.getMonth() + 1);
      
      const monthStartISO = rangeStart.toISOString().split('T')[0];
      const monthEndISO = rangeEnd.toISOString().split('T')[0];
      
      console.log('📅 DEBUG: Loading events from', monthStartISO, 'to', monthEndISO);
      
      const { data, error } = await calendarService.listEvents(userId, monthStartISO, monthEndISO);
      
      if (error) {
        console.error('📅 ERROR: Loading calendar events:', error);
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Error al cargar eventos del calendario: ' + (error.message || 'Error desconocido'), 'error');
        }
        return;
      }
      
      this.events = data || [];
      console.log('📅 SUCCESS: Calendar events loaded:', this.events.length, 'items');
      console.log('📅 DEBUG: Events data:', this.events);
      
      if (this.events.length > 0) {
        console.log('📅 DEBUG: First few events loaded:', this.events.slice(0, 3).map(e => ({
          id: e.id, 
          title: e.title, 
          date: e.date, 
          user_id: e.user_id
        })));
      } else {
        console.log('📅 DEBUG: No events found for user in database');
      }
      
      // Update UI
      this.renderCalendar();
      this.updateUpcomingEventsCount();
      
    } catch (error) {
      console.error('📅 ERROR: Exception in loadEvents:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al cargar eventos del calendario: ' + (error.message || 'Error desconocido'), 'error');
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

    // Animate the count change
    const oldCount = parseInt(badge.textContent) || 0;
    const newCount = upcomingEvents.length;
    
    if (oldCount !== newCount) {
      badge.classList.add('updated');
      setTimeout(() => {
        badge.classList.remove('updated');
      }, 500);
    }

    badge.textContent = newCount;
    badge.style.display = newCount > 0 ? 'flex' : 'none';
  }

  getEventsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    const eventsForDate = this.events.filter(event => event.date === dateStr);
    
    if (eventsForDate.length > 0) {
      console.log(`📅 DEBUG: Found ${eventsForDate.length} events for date ${dateStr}:`, 
                  eventsForDate.map(e => e.title));
    }
    
    return eventsForDate;
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
    console.log('📅 DEBUG: Getting current user ID...');
    console.log('📅 DEBUG: window.app exists:', !!window.app);
    console.log('📅 DEBUG: window.app.auth exists:', !!(window.app && window.app.auth));
    
    if (!window.app || !window.app.auth) {
      console.error('📅 ERROR: window.app.auth not available');
      return null;
    }
    
    const userId = window.app.auth.getCurrentUserId();
    console.log('📅 DEBUG: Retrieved user ID:', userId);
    return userId;
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

  // Day Events Modal Methods
  showDayEventsModal(date, events) {
    console.log('📅 DEBUG: showDayEventsModal called', { date, events });
    
    const modal = document.getElementById('day-events-modal');
    const dateElement = document.getElementById('day-events-date');
    const listElement = document.getElementById('day-events-list');
    
    if (!modal || !dateElement || !listElement) {
      console.error('📅 ERROR: Day events modal elements not found');
      return;
    }

    // Format and display the date
    const dateStr = date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    dateElement.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    // Populate events list
    this.populateDayEventsList(listElement, events);

    // Show the modal
    if (window.app && window.app.modals) {
      window.app.modals.show('day-events-modal');
    }
  }

  populateDayEventsList(container, events) {
    container.innerHTML = '';

    if (events.length === 0) {
      container.innerHTML = `
        <div class="day-events-empty">
          <div class="empty-icon">📅</div>
          <h3>No hay eventos para este día</h3>
          <p>Haz clic en "Agregar Evento" para crear uno nuevo</p>
        </div>
      `;
      return;
    }

    events.forEach(event => {
      const eventElement = document.createElement('div');
      eventElement.className = `day-event-item ${event.type}`;
      
      eventElement.innerHTML = `
        <div class="day-event-details">
          <div class="day-event-title">${this.escapeHtml(event.title)}</div>
          <div class="day-event-meta">
            <span class="day-event-type">
              ${this.getEventTypeIcon(event.type)} ${this.getEventTypeName(event.type)}
            </span>
            ${event.time ? `<span>🕐 ${event.time}</span>` : ''}
            ${event.amount ? `<span class="day-event-amount">${this.formatCurrency(event.amount)}</span>` : ''}
          </div>
          ${event.description ? `<div class="day-event-description">${this.escapeHtml(event.description)}</div>` : ''}
        </div>
        <div class="day-event-actions">
          <button class="btn btn-sm btn-secondary view-event-btn" data-event-id="${event.id}">
            <i class="ph ph-eye"></i> Ver
          </button>
          <button class="btn btn-sm btn-primary edit-event-btn" data-event-id="${event.id}">
            <i class="ph ph-pencil"></i> Editar
          </button>
          <button class="btn btn-sm btn-danger delete-event-btn" data-event-id="${event.id}">
            <i class="ph ph-trash"></i>
          </button>
        </div>
      `;

      container.appendChild(eventElement);
      
      // Add event listeners to the buttons
      const viewBtn = eventElement.querySelector('.view-event-btn');
      const editBtn = eventElement.querySelector('.edit-event-btn');
      const deleteBtn = eventElement.querySelector('.delete-event-btn');
      
      if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log('📅 DEBUG: View button clicked for event:', event.id);
          this.showEventDetails(event.id);
        });
      }
      
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log('📅 DEBUG: Edit button clicked for event:', event.id);
          // Hide day events modal first
          if (window.app && window.app.modals) {
            window.app.modals.hide('day-events-modal');
          }
          setTimeout(() => {
            this.editEvent(event.id);
          }, 100);
        });
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log('📅 DEBUG: Delete button clicked for event:', event.id);
          this.confirmDeleteEvent(event.id);
        });
      }
    });
  }

  showAddEventModalForSelectedDate() {
    console.log('📅 DEBUG: showAddEventModalForSelectedDate called');
    
    // Hide the day events modal first
    if (window.app && window.app.modals) {
      window.app.modals.hide('day-events-modal');
    }
    
    // Show add event modal with selected date
    setTimeout(() => {
      this.showAddEventModal(this.selectedDate);
    }, 100);
  }

  confirmDeleteEvent(eventId) {
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      this.deleteEventFromDay(eventId);
    }
  }

  async deleteEventFromDay(eventId) {
    try {
      await this.deleteEvent(eventId);
      
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Evento eliminado exitosamente', 'success');
      }
      
      // Refresh the calendar and day events modal
      this.renderCalendar();
      this.updateUpcomingEventsCount();
      
      // Refresh the day events modal if it's open
      const modal = document.getElementById('day-events-modal');
      if (modal && !modal.classList.contains('hidden')) {
        const updatedEvents = this.getEventsForDate(this.selectedDate);
        const listElement = document.getElementById('day-events-list');
        this.populateDayEventsList(listElement, updatedEvents);
        
        // If no more events, close the modal
        if (updatedEvents.length === 0) {
          window.app.modals.hide('day-events-modal');
        }
      }
      
    } catch (error) {
      console.error('Error deleting event:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al eliminar el evento', 'error');
      }
    }
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Animation helper methods
  animateButtonClick(button) {
    button.style.transform = 'scale(0.95)';
    button.style.transition = 'transform 0.1s ease';
    setTimeout(() => {
      button.style.transform = '';
    }, 100);
  }

  animateElementEntrance(element, animationType = 'fadeInUp', delay = 0) {
    element.style.opacity = '0';
    element.style.animation = `${animationType} 0.5s ease-out forwards`;
    element.style.animationDelay = `${delay}s`;
  }

  animateCalendarRefresh() {
    const calendarGrid = document.getElementById('calendar-grid');
    if (calendarGrid) {
      calendarGrid.style.opacity = '0';
      calendarGrid.style.transform = 'translateY(10px)';
      calendarGrid.style.transition = 'all 0.3s ease';
      
      setTimeout(() => {
        calendarGrid.style.opacity = '1';
        calendarGrid.style.transform = 'translateY(0)';
      }, 50);
    }
  }

  // Enhanced render method with loading animation
  renderCalendarWithAnimation() {
    const calendarGrid = document.getElementById('calendar-grid');
    if (calendarGrid) {
      calendarGrid.classList.add('calendar-loading');
    }
    
    this.renderCalendar();
    
    setTimeout(() => {
      if (calendarGrid) {
        calendarGrid.classList.remove('calendar-loading');
      }
    }, 300);
  }
}