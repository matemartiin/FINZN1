import { calendarService } from './calendar-service.js';
import { DOMHelpers } from '../utils/dom-helpers.js';

export class CalendarManager {
  constructor() {
    this.currentDate = new Date();
    this.currentView = 'month';
    this.events = [];
    this.selectedDate = null;
    this.googleCalendarIntegration = false;
    this.tokenClient = null;
    this.accessToken = null;
    this.tokenError = null;
    this.storageKey = 'finzn-google-calendar-sync';
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
    this.loadSyncState();
    this.updateSyncButtonState();
    console.log('📅 DEBUG: Sync button state updated');
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
      syncBtn.addEventListener('click', () => {
        if (this.googleCalendarIntegration) {
          // If already connected, show sync options directly
          this.showGoogleSyncOptions();
        } else {
          // If not connected, start sync process
          this.syncWithGoogleCalendar();
        }
      });
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

  updateSyncButtonState() {
    const syncBtn = document.getElementById('sync-google-calendar-btn');
    if (!syncBtn) return;

    if (this.googleCalendarIntegration) {
      // Update button to show connected state
      syncBtn.classList.add('connected');
      syncBtn.innerHTML = `
        <i class="ph ph-check-circle" aria-hidden="true"></i> Sincronizado con Google
      `;
      syncBtn.title = 'Conectado con Google Calendar - Haz clic para ver opciones';
    } else {
      // Reset to default state
      syncBtn.classList.remove('connected');
      syncBtn.innerHTML = `
        <i class="ph ph-arrows-clockwise" aria-hidden="true"></i> Sincronizar Google
      `;
      syncBtn.title = 'Sincronizar con Google Calendar';
    }
  }

  // Persistent sync state management
  saveSyncState() {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return;

      const syncState = {
        userId: userId,
        isConnected: this.googleCalendarIntegration,
        connectedAt: this.googleCalendarIntegration ? Date.now() : null,
        version: '1.0'
      };

      localStorage.setItem(this.storageKey, JSON.stringify(syncState));
      console.log('📅 DEBUG: Sync state saved to localStorage:', syncState);
    } catch (error) {
      console.error('📅 ERROR: Failed to save sync state:', error);
    }
  }

  loadSyncState() {
    try {
      const currentUserId = this.getCurrentUserId();
      if (!currentUserId) {
        console.log('📅 DEBUG: No user logged in, skipping sync state load');
        return;
      }

      const savedState = localStorage.getItem(this.storageKey);
      if (!savedState) {
        console.log('📅 DEBUG: No saved sync state found');
        return;
      }

      const syncState = JSON.parse(savedState);
      
      // Verify the saved state is for the current user
      if (syncState.userId !== currentUserId) {
        console.log('📅 DEBUG: Saved sync state is for different user, clearing');
        this.clearSyncState();
        return;
      }

      // Check if state is not too old (optional: expire after 30 days)
      if (syncState.connectedAt) {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        if (syncState.connectedAt < thirtyDaysAgo) {
          console.log('📅 DEBUG: Sync state expired, clearing');
          this.clearSyncState();
          return;
        }
      }

      // Restore sync state
      this.googleCalendarIntegration = syncState.isConnected || false;
      
      // If we're restoring a connected state, we need to determine if it was demo mode
      if (this.googleCalendarIntegration) {
        // Check if we have real credentials configured
        const envVars = import.meta.env;
        const clientKey = 'VITE_' + 'GOOGLE_' + 'CLIENT_' + 'ID';
        const apiKeyName = 'VITE_' + 'GOOGLE_' + 'API_' + 'KEY';
        const clientId = envVars[clientKey];
        const apiKey = envVars[apiKeyName];
        
        if (!clientId || !apiKey) {
          // No real credentials, assume this was demo mode
          console.log('📅 DEBUG: No credentials found, restoring demo mode');
          this.accessToken = 'demo_token_restored_' + Date.now();
        } else {
          console.log('📅 DEBUG: Credentials found, real Google integration will be initialized when needed');
          // Real credentials available, tokenClient will be initialized when needed
          this.accessToken = null;
        }
      }
      
      console.log('📅 DEBUG: Sync state loaded from localStorage:', {
        isConnected: this.googleCalendarIntegration,
        mode: this.accessToken && this.accessToken.startsWith('demo_token_') ? 'demo' : 'real',
        connectedAt: syncState.connectedAt ? new Date(syncState.connectedAt).toLocaleString() : 'never'
      });

    } catch (error) {
      console.error('📅 ERROR: Failed to load sync state:', error);
      this.clearSyncState();
    }
  }

  clearSyncState() {
    try {
      localStorage.removeItem(this.storageKey);
      this.googleCalendarIntegration = false;
      console.log('📅 DEBUG: Sync state cleared');
    } catch (error) {
      console.error('📅 ERROR: Failed to clear sync state:', error);
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

      // Create agenda event safely
      const eventDateElement = document.createElement('div');
      eventDateElement.className = 'agenda-event-date';
      eventDateElement.textContent = dateStr;

      const eventDetails = document.createElement('div');
      eventDetails.className = 'agenda-event-details';

      const eventTitle = document.createElement('div');
      eventTitle.className = 'agenda-event-title';
      eventTitle.innerHTML = this.getEventTypeIcon(event.type) + ' '; // Safe icon
      const titleText = document.createTextNode(event.title); // Safe user text
      eventTitle.appendChild(titleText);

      const eventDescription = document.createElement('div');
      eventDescription.className = 'agenda-event-description';
      eventDescription.textContent = event.description || ''; // Safe user text

      eventDetails.appendChild(eventTitle);
      eventDetails.appendChild(eventDescription);

      if (event.amount) {
        const eventAmount = document.createElement('div');
        eventAmount.className = 'agenda-event-amount';
        eventAmount.textContent = this.formatCurrency(event.amount);
        eventDetails.appendChild(eventAmount);
      }

      const eventActions = document.createElement('div');
      eventActions.className = 'agenda-event-actions';

      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn btn-sm btn-secondary';
      viewBtn.textContent = 'Ver';
      viewBtn.addEventListener('click', () => window.app.calendar.showEventDetails(event.id));

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-sm btn-primary';
      editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', () => window.app.calendar.editEvent(event.id));

      eventActions.appendChild(viewBtn);
      eventActions.appendChild(editBtn);

      eventElement.appendChild(eventDateElement);
      eventElement.appendChild(eventDetails);
      eventElement.appendChild(eventActions);

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
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      const error = new Error('ID de usuario inválido');
      console.error('📅 ERROR: Invalid UUID format for user ID:', userId);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('ID de usuario inválido', 'error');
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

      // Create event details safely
      content.innerHTML = '';

      // Type section
      const typeItem = document.createElement('div');
      typeItem.className = 'event-detail-item';
      typeItem.innerHTML = `<strong>Tipo:</strong> ${this.getEventTypeIcon(event.type)} ${this.getEventTypeName(event.type)}`;
      content.appendChild(typeItem);

      // Date section
      const dateItem = document.createElement('div');
      dateItem.className = 'event-detail-item';
      dateItem.innerHTML = `<strong>Fecha:</strong> ${dateStr}`;
      content.appendChild(dateItem);

      // Time section (user input - needs escaping)
      if (event.time) {
        const timeItem = document.createElement('div');
        timeItem.className = 'event-detail-item';
        const timeLabel = document.createElement('strong');
        timeLabel.textContent = 'Hora: ';
        const timeValue = document.createTextNode(event.time);
        timeItem.appendChild(timeLabel);
        timeItem.appendChild(timeValue);
        content.appendChild(timeItem);
      }

      // Amount section
      if (event.amount) {
        const amountItem = document.createElement('div');
        amountItem.className = 'event-detail-item';
        amountItem.innerHTML = `<strong>Monto:</strong> ${this.formatCurrency(event.amount)}`;
        content.appendChild(amountItem);
      }

      // Description section (user input - handled separately)
      if (event.description) {
        const descItem = document.createElement('div');
        descItem.className = 'event-detail-item';
        descItem.innerHTML = '<strong>Descripción:</strong> <span class="event-description-text"></span>';
        content.appendChild(descItem);
      }

      // Recurring section
      if (event.recurring) {
        const recurringItem = document.createElement('div');
        recurringItem.className = 'event-detail-item';
        recurringItem.innerHTML = `<strong>Recurrencia:</strong> ${this.getFrequencyName(event.frequency)}`;
        content.appendChild(recurringItem);
      }
      
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
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.warn('📅 Invalid UUID format for user ID:', userId);
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

  // Google Calendar Integration
  async syncWithGoogleCalendar() {
    // Dynamic configuration access (following Gemini pattern)
    const envVars = import.meta.env;
    const clientKey = 'VITE_' + 'GOOGLE_' + 'CLIENT_' + 'ID';
    const apiKeyName = 'VITE_' + 'GOOGLE_' + 'API_' + 'KEY';
    const clientId = envVars[clientKey];
    const apiKey = envVars[apiKeyName];
    
    console.log('🔍 Google Calendar Configuration Check:');
    console.log('📋 Environment variables available:', Object.keys(envVars).filter(k => k.includes('GOOGLE')));
    console.log('🔑 Client ID configured:', !!clientId);
    console.log('🗝️ API Key configured:', !!apiKey);
    
    // Check if Google Calendar is configured (same pattern as Gemini)
    if (!clientId || !apiKey) {
      console.log('⚠️ Google Calendar not configured');
      console.log('💡 To configure Google Calendar:');
      console.log('   1. Get credentials from Google Cloud Console');
      console.log('   2. Set VITE_GOOGLE_CLIENT_ID in .env file');
      console.log('   3. Set VITE_GOOGLE_API_KEY in .env file');
      
      // Check for development mode to show debug modal
      const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
      
      if (window.app && window.app.ui) {
        if (isDevelopment) {
          const debugMessage = `
            <div style="text-align: left;">
              <strong>🔧 Modo Desarrollo - Google Calendar</strong><br><br>
              <p>Para probar la integración:</p>
              <button onclick="window.app.calendar.testGoogleIntegration()" class="btn btn-primary" style="margin: 5px;">
                🧪 Modo Demo
              </button><br><br>
              <p>Para configuración real:</p>
              1. Credenciales de Google Cloud Console<br>
              2. Variables VITE_GOOGLE_CLIENT_ID y VITE_GOOGLE_API_KEY<br><br>
              <small>En modo demo se simula la funcionalidad</small>
            </div>
          `;
          window.app.ui.showAlert(debugMessage, 'info', 10000);
        } else {
          const configMessage = `
            <div style="text-align: left;">
              <strong>Google Calendar no está configurado</strong><br><br>
              Para habilitar la sincronización necesitas:<br>
              1. Credenciales de Google Cloud Console<br>
              2. Variables VITE_GOOGLE_CLIENT_ID y VITE_GOOGLE_API_KEY<br><br>
              <small>Consulta la documentación para más detalles</small>
            </div>
          `;
          window.app.ui.showAlert(configMessage, 'warning', 8000);
        }
      }
      return;
    }
    
    // Check if we're on the correct domain for Google OAuth
    const currentHost = window.location.host;
    const allowedHosts = ['localhost', '127.0.0.1', 'finzn.netlify.app'];
    const isAllowedHost = allowedHosts.some(host => currentHost.includes(host));
    
    if (!isAllowedHost) {
      console.log('⚠️ Current domain not authorized for Google Calendar');
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Google Calendar solo está disponible en el dominio autorizado.', 'warning');
      }
      return;
    }
    
    try {
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Conectando con Google Calendar...', 'info');
      }
      
      // Initialize Google API
      await this.initGoogleAPI(clientId, apiKey);
      
      // Show sync options
      this.showGoogleSyncOptions();
      
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      let errorMessage = 'Error al conectar con Google Calendar';
      
      if (error.error === 'popup_blocked_by_browser') {
        errorMessage = 'El navegador bloqueó la ventana emergente. Permite ventanas emergentes para este sitio.';
      } else if (error.error === 'access_denied') {
        errorMessage = 'Acceso denegado. Verifica que tengas permisos para Google Calendar.';
      } else if (error.error === 'idpiframe_initialization_failed') {
        errorMessage = 'Dominio no autorizado. Agrega este dominio en Google Cloud Console > Credenciales > OAuth 2.0';
      } else if (error.details && error.details.includes('API key')) {
        errorMessage = 'Error con la API key de Google. Verifica la configuración.';
      } else if (error.details && error.details.includes('Client ID')) {
        errorMessage = 'Error con el Client ID de Google. Verifica la configuración.';
      }
      
      if (window.app && window.app.ui) {
        window.app.ui.showAlert(errorMessage, 'error');
      }
    }
  }
  
  async initGoogleAPI(clientId, apiKey) {
    return new Promise((resolve, reject) => {
      console.log('🚀 Initializing Google Calendar API...');
      console.log('🔑 Using Client ID:', clientId ? `${clientId.substring(0, 20)}...` : 'undefined');
      console.log('🗝️ Using API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
      
      // Load Google Identity Services (GIS) and Google API Client scripts
      const loadPromises = [];
      
      // Load Google Identity Services script
      if (!window.google?.accounts) {
        console.log('📥 Loading Google Identity Services...');
        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.onload = () => {
          console.log('✅ Google Identity Services loaded successfully');
          console.log('🔍 GIS available methods:', Object.keys(window.google?.accounts?.oauth2 || {}));
        };
        gisScript.onerror = (error) => {
          console.error('❌ Failed to load Google Identity Services:', error);
          reject(new Error('Failed to load Google Identity Services'));
        };
        document.head.appendChild(gisScript);
        loadPromises.push(new Promise((res, rej) => {
          gisScript.onload = res;
          gisScript.onerror = rej;
        }));
      } else {
        console.log('✅ Google Identity Services already available');
      }
      
      // Load Google API Client script
      if (!window.gapi) {
        console.log('📥 Loading Google API Client...');
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.onload = () => {
          console.log('✅ Google API Client loaded successfully');
          console.log('🔍 GAPI available methods:', Object.keys(window.gapi || {}));
        };
        gapiScript.onerror = (error) => {
          console.error('❌ Failed to load Google API Client:', error);
          reject(new Error('Failed to load Google API Client'));
        };
        document.head.appendChild(gapiScript);
        loadPromises.push(new Promise((res, rej) => {
          gapiScript.onload = res;
          gapiScript.onerror = rej;
        }));
      } else {
        console.log('✅ Google API Client already available');
      }
      
      Promise.all(loadPromises).then(() => {
        console.log('📚 Loading Google API Client modules...');
        // Initialize Google API Client
        window.gapi.load('client', () => {
          console.log('🔧 Initializing Google API Client...');
          window.gapi.client.init({
            apiKey: apiKey,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
          }).then(() => {
            console.log('✅ Google API Client initialized');
            console.log('🔍 Available API methods:', Object.keys(window.gapi.client || {}));
            
            // Initialize Google Identity Services
            console.log('🔧 Setting up OAuth2 token client...');
            try {
              this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar',
                callback: (response) => {
                  console.log('📧 Token callback received:', response);
                  if (response.error !== undefined) {
                    console.error('❌ Token request error:', response);
                    this.tokenError = response;
                    return;
                  }
                  console.log('✅ Google Calendar API token received');
                  this.accessToken = response.access_token;
                  window.gapi.client.setToken({access_token: response.access_token});
                },
              });
              
              console.log('✅ Google Calendar API initialized with GIS successfully');
              resolve();
            } catch (tokenError) {
              console.error('❌ Error setting up token client:', tokenError);
              reject(tokenError);
            }
          }).catch((error) => {
            console.error('❌ Google API client initialization error:', error);
            if (error.details) {
              console.error('🔍 Error details:', error.details);
            }
            reject(error);
          });
        });
      }).catch((loadError) => {
        console.error('❌ Failed to load Google API scripts:', loadError);
        reject(loadError);
      });
    });
  }
  
  showGoogleSyncOptions() {
    // Setup event listeners for the modal buttons
    this.setupGoogleSyncModalListeners();
    
    // Show the modal
    if (window.app && window.app.modals) {
      window.app.modals.show('google-sync-modal');
    }
  }

  setupGoogleSyncModalListeners() {
    // Connect/Disconnect Google button
    const connectBtn = document.getElementById('connect-google-btn');
    if (connectBtn) {
      connectBtn.removeEventListener('click', this.handleConnectGoogle); // Remove existing listener
      
      if (this.googleCalendarIntegration) {
        // Show disconnect option if already connected
        connectBtn.innerHTML = `
          <i class="ph ph-x-circle"></i>
          <div class="btn-content">
            <span>Desconectar Google</span>
            <small>Desactivar sincronización con Google Calendar</small>
          </div>
        `;
        connectBtn.className = 'btn btn-danger sync-action-btn';
        this.handleConnectGoogle = () => this.disconnectGoogle();
      } else {
        // Show connect option if not connected
        connectBtn.innerHTML = `
          <i class="ph ph-key"></i>
          <div class="btn-content">
            <span>Conectar con Google</span>
            <small>Autorizar acceso a tu calendario</small>
          </div>
        `;
        connectBtn.className = 'btn btn-primary sync-action-btn';
        this.handleConnectGoogle = () => this.authenticateGoogle();
      }
      
      connectBtn.addEventListener('click', this.handleConnectGoogle);
    }
    
    // Import button
    const importBtn = document.getElementById('import-google-btn');
    if (importBtn) {
      importBtn.removeEventListener('click', this.handleImportGoogle); // Remove existing listener
      this.handleImportGoogle = () => this.importFromGoogle();
      importBtn.addEventListener('click', this.handleImportGoogle);
    }
    
    // Export button
    const exportBtn = document.getElementById('export-google-btn');
    if (exportBtn) {
      exportBtn.removeEventListener('click', this.handleExportGoogle); // Remove existing listener
      this.handleExportGoogle = () => this.exportToGoogle();
      exportBtn.addEventListener('click', this.handleExportGoogle);
    }
  }
  
  async authenticateGoogle() {
    try {
      // Check if we need to initialize Google API first
      if (!this.tokenClient) {
        console.log('🔧 Token client not found, checking configuration...');
        
        // Get credentials
        const envVars = import.meta.env;
        const clientKey = 'VITE_' + 'GOOGLE_' + 'CLIENT_' + 'ID';
        const apiKeyName = 'VITE_' + 'GOOGLE_' + 'API_' + 'KEY';
        const clientId = envVars[clientKey];
        const apiKey = envVars[apiKeyName];
        
        // If no credentials, offer demo mode
        if (!clientId || !apiKey) {
          console.log('⚠️ No Google credentials found, checking if user wants demo mode...');
          
          const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
          
          if (isDevelopment) {
            // In development, automatically switch to demo mode
            console.log('🧪 Development mode detected, switching to demo mode');
            this.accessToken = 'demo_token_' + Date.now();
            this.googleCalendarIntegration = true;
            this.saveSyncState();
            this.updateSyncButtonState();
            
            if (window.app && window.app.ui) {
              window.app.ui.showAlert('🧪 Modo demo activado automáticamente', 'info');
            }
            return;
          } else {
            throw new Error('Google credentials not configured');
          }
        }
        
        // Initialize Google API with real credentials
        console.log('🔧 Initializing Google API with real credentials...');
        await this.initGoogleAPI(clientId, apiKey);
        
        if (!this.tokenClient) {
          throw new Error('Failed to initialize token client');
        }
      }
      
      // Reset token states
      this.accessToken = null;
      this.tokenError = null;
      
      // Request access token
      this.tokenClient.requestAccessToken();
      
      // Wait for the callback to process
      return new Promise((resolve, reject) => {
        const checkToken = () => {
          if (this.accessToken) {
            console.log('✅ Google authentication successful');
            if (window.app && window.app.ui) {
              window.app.ui.showAlert('¡Conectado con Google Calendar exitosamente!', 'success');
            }
            this.googleCalendarIntegration = true;
            // Save sync state to persist across sessions
            this.saveSyncState();
            // Update sync button to show connected state
            this.updateSyncButtonState();
            // Close the Google sync modal
            if (window.app && window.app.modals) {
              window.app.modals.hide('google-sync-modal');
            }
            resolve();
          } else if (this.tokenError) {
            reject(this.tokenError);
          } else {
            setTimeout(checkToken, 100);
          }
        };
        checkToken();
        
        // Timeout after 30 seconds
        setTimeout(() => {
          if (!this.accessToken && !this.tokenError) {
            reject(new Error('Authentication timeout'));
          }
        }, 30000);
      });
    } catch (error) {
      console.error('Google authentication error:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al autenticar con Google', 'error');
      }
      throw error;
    }
  }

  async disconnectGoogle() {
    try {
      console.log('🔌 Disconnecting from Google Calendar...');
      
      // Clear Google tokens if available
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        try {
          // Revoke token if we have one
          if (this.accessToken) {
            window.google.accounts.oauth2.revoke(this.accessToken);
          }
        } catch (revokeError) {
          console.warn('Could not revoke token:', revokeError);
        }
      }
      
      // Clear local state
      this.googleCalendarIntegration = false;
      this.accessToken = null;
      this.tokenError = null;
      this.tokenClient = null;
      
      // Clear persistent state
      this.clearSyncState();
      
      // Update UI
      this.updateSyncButtonState();
      
      // Close modal
      if (window.app && window.app.modals) {
        window.app.modals.hide('google-sync-modal');
      }
      
      // Show success message
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Desconectado de Google Calendar exitosamente', 'success');
      }
      
      console.log('✅ Successfully disconnected from Google Calendar');
      
    } catch (error) {
      console.error('Error disconnecting from Google Calendar:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al desconectar de Google Calendar', 'error');
      }
    }
  }
  
  async importFromGoogle() {
    if (!this.googleCalendarIntegration) {
      await this.authenticateGoogle();
    }
    
    // Check if we're in demo mode
    if (this.accessToken && this.accessToken.startsWith('demo_token_')) {
      return this.demoImportFromGoogle();
    }
    
    try {
      // If we don't have access token (restored from persistence), we need to re-authenticate
      if (!this.accessToken) {
        console.log('📥 No access token found, re-authenticating...');
        await this.authenticateGoogle();
      }
      
      // Verify we have access token and gapi is loaded
      if (!this.accessToken || !window.gapi || !window.gapi.client) {
        throw new Error('Google API not properly initialized or no access token');
      }

      // Ensure the token is set in gapi client
      if (this.accessToken) {
        window.gapi.client.setToken({access_token: this.accessToken});
      }

      console.log('📥 Starting import from Google Calendar...');
      
      // Get current month date range for better filtering
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 3, 0); // Import 3 months ahead
      
      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfMonth.toISOString(),
        timeMax: endOfMonth.toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime'
      });
      
      console.log('📥 Google Calendar API response:', response);
      
      const events = response.result.items || [];
      console.log(`📥 Found ${events.length} events in Google Calendar`);
      
      let importedCount = 0;
      let skippedCount = 0;
      
      for (const googleEvent of events) {
        console.log('📥 Processing Google event:', googleEvent.summary);
        
        // Convert Google event to FINZN format
        const finznEvent = this.convertGoogleToFinznEvent(googleEvent);
        if (finznEvent) {
          try {
            // Check if event already exists to avoid duplicates
            const existingEvents = this.getEventsForDate(new Date(finznEvent.date));
            const duplicate = existingEvents.find(e => 
              e.title === finznEvent.title && 
              e.date === finznEvent.date &&
              e.description && e.description.includes('Importado de Google Calendar')
            );
            
            if (!duplicate) {
              await this.addEvent(finznEvent);
              importedCount++;
              console.log(`✅ Imported: ${finznEvent.title}`);
            } else {
              skippedCount++;
              console.log(`⏭️ Skipped duplicate: ${finznEvent.title}`);
            }
          } catch (error) {
            console.error('Error importing individual event:', error);
          }
        }
      }
      
      const message = skippedCount > 0 
        ? `${importedCount} eventos importados, ${skippedCount} omitidos (duplicados)`
        : `${importedCount} eventos importados de Google Calendar`;
      
      if (window.app && window.app.ui) {
        window.app.ui.showAlert(message, 'success');
      }
      
      // Close the Google sync modal
      if (window.app && window.app.modals) {
        window.app.modals.hide('google-sync-modal');
      }
      
      // Refresh calendar
      await this.loadEvents();
      this.renderCalendar();
      this.updateUpcomingEventsCount();
      
    } catch (error) {
      console.error('Error importing from Google Calendar:', error);
      let errorMessage = 'Error al importar eventos';
      
      if (error.message.includes('not properly initialized')) {
        errorMessage = 'Google Calendar no está configurado correctamente. Intenta reconectarte.';
      } else if (error.status === 401) {
        errorMessage = 'Sesión expirada. Intenta reconectarte con Google.';
        // Clear the sync state so user can reconnect
        this.googleCalendarIntegration = false;
        this.clearSyncState();
        this.updateSyncButtonState();
      } else if (error.status === 403) {
        errorMessage = 'Sin permisos para acceder a Google Calendar. Verifica los permisos.';
      }
      
      if (window.app && window.app.ui) {
        window.app.ui.showAlert(errorMessage, 'error');
      }
    }
  }
  
  async exportToGoogle() {
    if (!this.googleCalendarIntegration) {
      await this.authenticateGoogle();
    }
    
    // Check if we're in demo mode
    if (this.accessToken && this.accessToken.startsWith('demo_token_')) {
      return this.demoExportToGoogle();
    }
    
    try {
      // If we don't have access token (restored from persistence), we need to re-authenticate
      if (!this.accessToken) {
        console.log('📤 No access token found, re-authenticating...');
        await this.authenticateGoogle();
      }
      
      // Verify we have access token and gapi is loaded
      if (!this.accessToken || !window.gapi || !window.gapi.client) {
        throw new Error('Google API not properly initialized or no access token');
      }

      // Ensure the token is set in gapi client
      if (this.accessToken) {
        window.gapi.client.setToken({access_token: this.accessToken});
      }

      console.log('📤 Starting export to Google Calendar...');
      console.log(`📤 Found ${this.events.length} local events to potentially export`);
      
      let exportedCount = 0;
      let skippedCount = 0;
      
      for (const event of this.events) {
        try {
          // Skip events that were imported from Google Calendar to avoid duplicates
          if (event.description && event.description.includes('Importado de Google Calendar')) {
            skippedCount++;
            console.log(`⏭️ Skipped Google-imported event: ${event.title}`);
            continue;
          }
          
          console.log('📤 Processing local event:', event.title);
          
          const googleEvent = this.convertFinznToGoogleEvent(event);
          
          const response = await window.gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: googleEvent
          });
          
          console.log(`✅ Exported: ${event.title}`, response);
          exportedCount++;
        } catch (error) {
          console.error('Error exporting individual event:', error);
          // Continue with other events even if one fails
        }
      }
      
      const message = skippedCount > 0 
        ? `${exportedCount} eventos exportados, ${skippedCount} omitidos (importados de Google)`
        : `${exportedCount} eventos exportados a Google Calendar`;
      
      if (window.app && window.app.ui) {
        window.app.ui.showAlert(message, 'success');
      }
      
      // Close the Google sync modal
      if (window.app && window.app.modals) {
        window.app.modals.hide('google-sync-modal');
      }
      
    } catch (error) {
      console.error('Error exporting to Google Calendar:', error);
      let errorMessage = 'Error al exportar eventos';
      
      if (error.message.includes('not properly initialized')) {
        errorMessage = 'Google Calendar no está configurado correctamente. Intenta reconectarte.';
      } else if (error.status === 401) {
        errorMessage = 'Sesión expirada. Intenta reconectarte con Google.';
        // Clear the sync state so user can reconnect
        this.googleCalendarIntegration = false;
        this.clearSyncState();
        this.updateSyncButtonState();
      } else if (error.status === 403) {
        errorMessage = 'Sin permisos para escribir en Google Calendar. Verifica los permisos.';
      }
      
      if (window.app && window.app.ui) {
        window.app.ui.showAlert(errorMessage, 'error');
      }
    }
  }
  
  convertGoogleToFinznEvent(googleEvent) {
    if (!googleEvent.summary) {
      console.log('⚠️ Skipping Google event without summary:', googleEvent);
      return null;
    }
    
    const startDate = googleEvent.start?.dateTime || googleEvent.start?.date;
    if (!startDate) {
      console.log('⚠️ Skipping Google event without start date:', googleEvent);
      return null;
    }
    
    const date = new Date(startDate);
    
    // Clean the title and add proper description
    const cleanTitle = googleEvent.summary.replace(/💰\s?/, ''); // Remove FINZN emoji if it exists
    const originalDescription = googleEvent.description || '';
    const description = originalDescription.includes('Exportado desde FINZN') 
      ? originalDescription 
      : `${originalDescription}\n\nImportado de Google Calendar`.trim();
    
    console.log('📥 Converting Google event:', {
      original: googleEvent.summary,
      cleaned: cleanTitle,
      date: date.toISOString().split('T')[0],
      hasTime: !!googleEvent.start?.dateTime
    });
    
    return {
      title: cleanTitle,
      type: this.detectEventType(cleanTitle, description),
      date: date.toISOString().split('T')[0],
      time: googleEvent.start?.dateTime ? 
        date.toTimeString().split(' ')[0].slice(0, 5) : null,
      description: description,
      amount: null,
      recurring: false,
      frequency: null
    };
  }
  
  convertFinznToGoogleEvent(finznEvent) {
    const startDateTime = finznEvent.time ? 
      `${finznEvent.date}T${finznEvent.time}:00` : 
      finznEvent.date;
    
    const endDateTime = finznEvent.time ? 
      `${finznEvent.date}T${this.addHour(finznEvent.time)}:00` : 
      finznEvent.date;
    
    return {
      summary: `💰 ${finznEvent.title}`,
      description: `${finznEvent.description || ''}\n\nExportado desde FINZN`,
      start: finznEvent.time ? 
        { dateTime: startDateTime, timeZone: 'America/Argentina/Buenos_Aires' } :
        { date: finznEvent.date },
      end: finznEvent.time ?
        { dateTime: endDateTime, timeZone: 'America/Argentina/Buenos_Aires' } :
        { date: finznEvent.date }
    };
  }
  
  detectEventType(title = '', description = '') {
    const text = (title + ' ' + description).toLowerCase();
    
    // Financial payment related
    if (text.includes('pago') || text.includes('cuota') || text.includes('factura') || text.includes('bill')) return 'payment';
    
    // Income related
    if (text.includes('cobro') || text.includes('ingreso') || text.includes('sueldo') || text.includes('salary')) return 'income';
    
    // Credit card related
    if (text.includes('tarjeta') || text.includes('cierre') || text.includes('credit card') || text.includes('card')) return 'card-close';
    
    // Deadline related
    if (text.includes('vencimiento') || text.includes('deadline') || text.includes('due') || text.includes('plazo')) return 'deadline';
    
    // Default to reminder for other events
    return 'reminder';
  }
  
  addHour(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newHours = (hours + 1) % 24;
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Test/Demo mode for Google Calendar integration
  async testGoogleIntegration() {
    console.log('🧪 Starting Google Calendar demo mode...');
    
    try {
      // Simulate authentication
      this.googleCalendarIntegration = true;
      this.accessToken = 'demo_token_' + Date.now();
      this.saveSyncState();
      this.updateSyncButtonState();
      
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('🧪 Modo demo activado - Google Calendar simulado', 'success');
      }
      
      // Show sync options
      this.showGoogleSyncOptions();
      
    } catch (error) {
      console.error('Error in demo mode:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error en modo demo', 'error');
      }
    }
  }

  async demoImportFromGoogle() {
    console.log('🧪 Demo: Importing from Google Calendar...');
    
    try {
      // Create demo events
      const demoEvents = [
        {
          title: 'Pago de Tarjeta de Crédito',
          type: 'payment',
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
          description: 'Evento demo importado de Google Calendar',
          amount: null,
          recurring: false,
          frequency: null
        },
        {
          title: 'Reunión de Trabajo',
          type: 'reminder',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          time: '14:30',
          description: 'Evento demo importado de Google Calendar',
          amount: null,
          recurring: false,
          frequency: null
        },
        {
          title: 'Vencimiento Servicios',
          type: 'deadline',
          date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], // Day after tomorrow
          time: null,
          description: 'Evento demo importado de Google Calendar',
          amount: null,
          recurring: false,
          frequency: null
        }
      ];
      
      let importedCount = 0;
      
      for (const demoEvent of demoEvents) {
        try {
          // Check if event already exists to avoid duplicates
          const existingEvents = this.getEventsForDate(new Date(demoEvent.date));
          const duplicate = existingEvents.find(e => 
            e.title === demoEvent.title && 
            e.date === demoEvent.date
          );
          
          if (!duplicate) {
            await this.addEvent(demoEvent);
            importedCount++;
          }
        } catch (error) {
          console.error('Error adding demo event:', error);
        }
      }
      
      if (window.app && window.app.ui) {
        window.app.ui.showAlert(`🧪 Demo: ${importedCount} eventos importados simulados`, 'success');
      }
      
      // Close modal and refresh
      if (window.app && window.app.modals) {
        window.app.modals.hide('google-sync-modal');
      }
      
      await this.loadEvents();
      this.renderCalendar();
      this.updateUpcomingEventsCount();
      
    } catch (error) {
      console.error('Error in demo import:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error en importación demo', 'error');
      }
    }
  }

  async demoExportToGoogle() {
    console.log('🧪 Demo: Exporting to Google Calendar...');
    
    try {
      // Count events that would be exported (excluding demo imports)
      const exportableEvents = this.events.filter(event => 
        !event.description || !event.description.includes('Evento demo importado de Google Calendar')
      );
      
      if (window.app && window.app.ui) {
        window.app.ui.showAlert(`🧪 Demo: ${exportableEvents.length} eventos exportados simulados`, 'success');
      }
      
      // Close modal
      if (window.app && window.app.modals) {
        window.app.modals.hide('google-sync-modal');
      }
      
    } catch (error) {
      console.error('Error in demo export:', error);
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error en exportación demo', 'error');
      }
    }
  }

  // Utility methods
  getCurrentUserId() {
    console.log('📅 DEBUG: Getting current user ID...');
    console.log('📅 DEBUG: window.app exists:', !!window.app);
    console.log('📅 DEBUG: window.app.auth exists:', !!(window.app && window.app.auth));
    
    if (!window.app || !window.app.auth) {
      console.warn('📅 WARNING: window.app.auth not available, using fallback');
      // Fallback: try to get user ID from localStorage or return null
      const savedUserId = localStorage.getItem('finzn_user_id');
      return savedUserId || null;
    }
    
    try {
      const userId = window.app.auth.getCurrentUserId();
      console.log('📅 DEBUG: Retrieved user ID:', userId);
      return userId || null;
    } catch (error) {
      console.error('📅 ERROR: Failed to get user ID:', error);
      return null;
    }
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
            ${event.time ? `<span>🕐 ${this.escapeHtml(event.time)}</span>` : ''}
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