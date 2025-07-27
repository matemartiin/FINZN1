export class CalendarManager {
  constructor() {
    this.currentDate = new Date();
    this.events = [];
    this.integrations = {
      google: false,
      apple: false
    };
    this.integrationMethods = {
      phase: 3, // Direct mobile integration
      supportedCalendars: ['google', 'apple']
    };
    
    // Google Calendar API configuration
    this.googleConfig = {
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
      scopes: 'https://www.googleapis.com/auth/calendar.events'
    };
    
    // Authentication states
    this.isGoogleAuthenticated = false;
    this.googleAccessToken = null;
    
    // Configuración de recordatorios personalizados
    this.reminderSettings = {
      defaultReminders: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 15 }
      ],
      customReminders: {},
      titleTemplates: {
        payment: '💰 {title}',
        income: '💵 {title}',
        'goal-deadline': '🎯 {title}',
        review: '📊 {title}',
        reminder: '⏰ {title}'
      },
      descriptionTemplate: `{description}

💰 Monto: {amount}
🏷️ Categoría: {category}
📱 Creado desde FINZN - Tu compañero financiero inteligente

¿Necesitas ayuda? Revisa tu dashboard de FINZN para más detalles.`
    };
    
    // Cargar configuración guardada
    this.loadReminderSettings();
  }

  async init() {
    console.log('📅 Initializing Calendar Manager with mobile integration...');
    this.loadIntegrationStatus();
    this.setupEventListeners();
    this.loadEvents();
    this.renderCalendar();
    
    // Initialize Google Calendar API if available
    await this.initializeGoogleCalendar();
  }

  async initializeGoogleCalendar() {
    try {
      if (!this.googleConfig.apiKey || !this.googleConfig.clientId) {
        console.log('⚠️ Google Calendar API not configured');
        return;
      }

      // Load Google API
      await this.loadGoogleAPI();
      console.log('✅ Google Calendar API initialized');
    } catch (error) {
      console.error('❌ Error initializing Google Calendar:', error.message || error);
      
      // Check for specific error types
      if (error.error === 'idpiframe_initialization_failed' || 
          (error.error && error.error.code === 403 && error.error.message && error.error.message.includes('blocked'))) {
        console.warn('⚠️ Google Calendar API origin not configured. Add current origin to Google Cloud Console.');
        this.showConfigurationHelp('google-referrer-blocked');
      } else if ((error.error && error.error.details && error.error.details.some(detail => detail.reason === 'API_KEY_HTTP_REFERRER_BLOCKED')) ||
                 (error.error && error.error.code === 403)) {
        console.warn('⚠️ Google Calendar API HTTP referrer blocked.');
        this.showConfigurationHelp('google-referrer-blocked');
      } else {
        this.showConfigurationHelp('google-general-error');
      }
      
      // Disable Google integration but continue with app
      this.integrations.google = false;
    }
  }

  loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', async () => {
          try {
            await window.gapi.client.init({
              apiKey: this.googleConfig.apiKey,
              clientId: this.googleConfig.clientId,
              discoveryDocs: [this.googleConfig.discoveryDoc],
              scope: this.googleConfig.scopes
            });
            resolve();
          } catch (error) {
            console.error('Google API client init error:', error);
            reject(error);
          }
        });
      };
      script.onerror = (error) => {
        console.error('Failed to load Google API script:', error);
        reject(new Error('Failed to load Google API script'));
      };
      document.head.appendChild(script);
    });
  }

  setupEventListeners() {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousMonth());
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextMonth());
    }
    
    // Integration buttons
    const googleBtn = document.querySelector('.google-calendar');
    const outlookBtn = document.querySelector('.outlook-calendar');
    const appleBtn = document.querySelector('.apple-calendar');
    
    if (googleBtn) {
      googleBtn.addEventListener('click', () => this.handleGoogleCalendarIntegration());
    }
    
    if (outlookBtn) {
      outlookBtn.addEventListener('click', () => this.handleOutlookIntegration());
    }
    
    if (appleBtn) {
      appleBtn.addEventListener('click', () => this.handleAppleCalendarIntegration());
    }
  }

  async loadEvents() {
    try {
      // Load events from localStorage for now
      const savedEvents = localStorage.getItem('finzn-calendar-events');
      if (savedEvents) {
        this.events = JSON.parse(savedEvents);
      }
      
      // Generate automatic events from financial data
      await this.generateAutomaticEvents();
      
      console.log('📅 Events loaded:', this.events.length);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    }
  }

  async generateAutomaticEvents() {
    if (!window.app || !window.app.data) return;
    
    try {
      // Get current month expenses with installments
      const currentMonth = this.getCurrentMonth();
      const expenses = await window.app.data.loadExpenses(currentMonth);
      
      // Generate events for installments
      expenses.forEach(expense => {
        if (expense.total_installments > 1) {
          // Create events for future installments
          for (let i = expense.installment; i < expense.total_installments; i++) {
            const futureDate = new Date(expense.transaction_date);
            futureDate.setMonth(futureDate.getMonth() + (i - expense.installment + 1));
            
            const eventId = `installment-${expense.id}-${i + 1}`;
            
            // Check if event already exists
            if (!this.events.find(e => e.id === eventId)) {
              this.events.push({
                id: eventId,
                title: `Cuota ${i + 1}/${expense.total_installments}: ${expense.description}`,
                type: 'payment',
                date: futureDate.toISOString().split('T')[0],
                amount: expense.amount,
                description: `Cuota de ${expense.description}`,
                automatic: true,
                category: expense.category
              });
            }
          }
        }
      });
      
      // Generate monthly income events
      const income = await window.app.data.loadIncome(currentMonth);
      if (income.fixed > 0) {
        // Create recurring income event for next months
        for (let i = 1; i <= 3; i++) {
          const futureDate = new Date();
          futureDate.setMonth(futureDate.getMonth() + i);
          futureDate.setDate(1); // First day of month
          
          const eventId = `income-${futureDate.getFullYear()}-${futureDate.getMonth() + 1}`;
          
          if (!this.events.find(e => e.id === eventId)) {
            this.events.push({
              id: eventId,
              title: 'Sueldo mensual',
              type: 'income',
              date: futureDate.toISOString().split('T')[0],
              amount: income.fixed,
              description: 'Ingreso fijo mensual',
              automatic: true,
              recurring: true
            });
          }
        }
      }
      
      // Save updated events
      this.saveEvents();
      
    } catch (error) {
      console.error('Error generating automatic events:', error);
    }
  }

  saveEvents() {
    try {
      localStorage.setItem('finzn-calendar-events', JSON.stringify(this.events));
    } catch (error) {
      console.error('Error saving calendar events:', error);
    }
  }

  async addEvent(eventData) {
    const event = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...eventData,
      automatic: false,
      created_at: new Date().toISOString(),
      synced_to_google: false,
      synced_to_apple: false
    };
    
    this.events.push(event);
    this.saveEvents();
    
    console.log('📅 Event added:', event);
    
    // Auto-sync to connected calendars
    await this.autoSyncNewEvent(event);
    
    // Refresh calendar display
    this.renderCalendar();
    this.updateSidebarWidgets();
    
    return event;
  }

  async autoSyncNewEvent(event) {
    try {
      // Sync to Google Calendar if connected
      if (this.integrations.google && this.isGoogleAuthenticated) {
        await this.createGoogleCalendarEvent(event);
        event.synced_to_google = true;
        window.app.ui.showAlert('Recordatorio agregado a Google Calendar 📱', 'success');
      }
      
      // For Apple, we'll generate ICS file on demand
      if (this.integrations.apple) {
        // Apple events are synced via ICS download
        console.log('🍎 Apple Calendar integration ready for sync');
      }
      
      this.saveEvents();
      
    } catch (error) {
      console.error('❌ Error auto-syncing event:', error);
      window.app.ui.showAlert('Evento creado, pero no se pudo sincronizar automáticamente', 'warning');
    }
  }

  renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearElement = document.getElementById('calendar-month-year');
    
    if (!calendarGrid || !monthYearElement) return;
    
    // Update month/year display
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    monthYearElement.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    
    // Clear calendar
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayHeaders.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-day-header';
      dayHeader.textContent = day;
      dayHeader.style.cssText = `
        background: var(--bg-secondary);
        padding: var(--spacing-sm);
        font-weight: 700;
        font-size: 0.8rem;
        color: var(--text-secondary);
        text-align: center;
        border-bottom: 1px solid var(--border-color);
      `;
      calendarGrid.appendChild(dayHeader);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day other-month';
      calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    const today = new Date();
    const currentMonth = `${this.currentDate.getFullYear()}-${(this.currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      
      const dayDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
      const dateString = dayDate.toISOString().split('T')[0];
      
      // Check if it's today
      if (dayDate.toDateString() === today.toDateString()) {
        dayElement.classList.add('today');
      }
      
      // Add day number
      const dayNumber = document.createElement('div');
      dayNumber.className = 'calendar-day-number';
      dayNumber.textContent = day;
      dayElement.appendChild(dayNumber);
      
      // Add events for this day
      const dayEvents = this.events.filter(event => event.date === dateString);
      dayEvents.slice(0, 3).forEach(event => { // Show max 3 events per day
        const eventElement = document.createElement('div');
        eventElement.className = `calendar-event ${event.type}`;
        eventElement.textContent = event.title.length > 15 ? 
          event.title.substring(0, 15) + '...' : event.title;
        eventElement.title = event.title;
        dayElement.appendChild(eventElement);
      });
      
      // Add more indicator if there are more than 3 events
      if (dayEvents.length > 3) {
        const moreElement = document.createElement('div');
        moreElement.className = 'calendar-more';
        moreElement.textContent = `+${dayEvents.length - 3} más`;
        moreElement.style.cssText = `
          font-size: 0.6rem;
          color: var(--text-muted);
          font-weight: 600;
          text-align: center;
          margin-top: 2px;
        `;
        dayElement.appendChild(moreElement);
      }
      
      // Add click handler
      dayElement.addEventListener('click', () => this.handleDayClick(dateString, dayEvents));
      
      calendarGrid.appendChild(dayElement);
    }
    
    // Update sidebar widgets
    this.updateSidebarWidgets();
  }

  handleDayClick(dateString, events) {
    console.log('📅 Day clicked:', dateString, events);
    
    if (events.length === 0) {
      // No events, maybe show add event option
      if (confirm('¿Quieres agregar un evento para este día?')) {
        // Pre-fill the add event modal with this date
        const dateInput = document.getElementById('event-date');
        if (dateInput) {
          dateInput.value = dateString;
        }
        window.app.showAddEventModal();
      }
    } else {
      // Show events for this day
      this.showDayEvents(dateString, events);
    }
  }

  showDayEvents(dateString, events) {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    let eventsHtml = `<h4>Eventos para ${dateStr}</h4><div class="day-events-list">`;
    
    events.forEach(event => {
      eventsHtml += `
        <div class="day-event-item ${event.type}">
          <div class="day-event-title">${event.title}</div>
          <div class="day-event-description">${event.description}</div>
          ${event.amount ? `<div class="day-event-amount">${this.formatCurrency(event.amount)}</div>` : ''}
        </div>
      `;
    });
    
    eventsHtml += '</div>';
    
    // Show in a simple alert for now (could be improved with a proper modal)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = eventsHtml;
    
    // Create a simple modal-like display
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: var(--bg-primary);
      border-radius: var(--border-radius-xl);
      padding: var(--spacing-xl);
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: var(--shadow-xl);
    `;
    
    modal.innerHTML = eventsHtml + `
      <div style="margin-top: var(--spacing-lg); text-align: center;">
        <button onclick="this.closest('[style*=fixed]').remove()" class="btn btn-secondary">Cerrar</button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  updateSidebarWidgets() {
    this.updateTodayEvents();
    this.updateUpcomingPayments();
  }

  updateTodayEvents() {
    const container = document.getElementById('today-events');
    if (!container) return;
    
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = this.events.filter(event => event.date === today);
    
    container.innerHTML = '';
    
    if (todayEvents.length === 0) {
      container.innerHTML = '<p class="widget-empty">No hay eventos hoy</p>';
      return;
    }
    
    todayEvents.forEach(event => {
      const eventElement = document.createElement('div');
      eventElement.className = `event-item ${event.type}`;
      eventElement.innerHTML = `
        <div class="event-title">${event.title}</div>
        <div class="event-time">${event.amount ? this.formatCurrency(event.amount) : ''}</div>
      `;
      container.appendChild(eventElement);
    });
  }

  updateUpcomingPayments() {
    const container = document.getElementById('upcoming-payments');
    if (!container) return;
    
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingPayments = this.events.filter(event => {
      const eventDate = new Date(event.date);
      return event.type === 'payment' && 
             eventDate >= today && 
             eventDate <= nextWeek;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    container.innerHTML = '';
    
    if (upcomingPayments.length === 0) {
      container.innerHTML = '<p class="widget-empty">No hay pagos próximos</p>';
      return;
    }
    
    upcomingPayments.forEach(payment => {
      const paymentElement = document.createElement('div');
      paymentElement.className = 'event-item payment';
      
      const paymentDate = new Date(payment.date);
      const daysUntil = Math.ceil((paymentDate - today) / (1000 * 60 * 60 * 24));
      
      paymentElement.innerHTML = `
        <div class="event-title">${payment.title}</div>
        <div class="event-time">
          ${daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : `En ${daysUntil} días`}
          ${payment.amount ? ` - ${this.formatCurrency(payment.amount)}` : ''}
        </div>
      `;
      container.appendChild(paymentElement);
    });
  }

  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.renderCalendar();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.renderCalendar();
  }

  getUpcomingEvents(days = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    return this.events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate <= futureDate;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  refresh() {
    this.loadEvents();
    this.renderCalendar();
  }

  // Integration methods
  handleGoogleCalendarIntegration() {
    console.log('📅 Google Calendar integration');
    this.authenticateAndIntegrateGoogle();
  }

  handleAppleCalendarIntegration() {
    console.log('📅 Apple Calendar integration');
    this.integrateWithAppleCalendar();
  }

  handleOutlookIntegration() {
    console.log('📅 Outlook Calendar integration');
    this.showCalendarIntegrationModal('outlook');
  }

  showConfigurationHelp(errorType) {
    const helpContainer = document.getElementById('calendar-help');
    if (!helpContainer) return;

    const currentOrigin = window.location.origin;
    let helpContent = '';

    switch (errorType) {
      case 'google-referrer-blocked':
        helpContent = `
          <div class="config-help error">
            <h4>🔧 Google Calendar API Configuration Required</h4>
            <p><strong>Error:</strong> HTTP referrer restriction blocking requests</p>
            <div class="config-steps">
              <h5>Steps to fix:</h5>
              <ol>
                <li>Go to <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
                <li>Navigate to <strong>APIs & Services → Credentials</strong></li>
                <li>Find your API key and click <strong>Edit</strong></li>
                <li>Under <strong>Application restrictions</strong>, add this origin:</li>
                <li><code>${currentOrigin}</code></li>
                <li>For development, also add: <code>*.webcontainer-api.io</code></li>
              </ol>
            </div>
          </div>
        `;
        break;
      case 'google-general-error':
        helpContent = `
          <div class="config-help warning">
            <h4>⚠️ Google Calendar Configuration Issue</h4>
            <p>Please check your Google Calendar API credentials in the .env file</p>
          </div>
        `;
        break;
    }

    helpContainer.innerHTML = helpContent;
    helpContainer.style.display = 'block';
  }

  async authenticateGoogle() {
    try {
      console.log('🔐 Authenticating with Google Calendar...');
      
      if (!window.gapi || !window.gapi.auth2) {
        throw new Error('Google API not loaded');
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      
      if (!authInstance.isSignedIn.get()) {
        // User needs to sign in
        const user = await authInstance.signIn();
        console.log('✅ User signed in to Google:', user.getBasicProfile().getEmail());
      }

      this.isGoogleAuthenticated = true;
      this.googleAccessToken = authInstance.currentUser.get().getAuthResponse().access_token;
      
      // Save integration status
      this.integrations.google = true;
      this.saveIntegrationStatus();
      
      // Show success message
      window.app.ui.showAlert('¡Google Calendar conectado! Los recordatorios aparecerán en tu celular.', 'success');
      
      // Sync existing events
      await this.syncEventsToGoogle();
      
    } catch (error) {
      console.error('❌ Error authenticating with Google:', error);
      window.app.ui.showAlert('Error al conectar con Google Calendar. Intenta de nuevo.', 'error');
    }
  }

  async authenticateAndIntegrateGoogle() {
    try {
      console.log('🔐 Authenticating with Google Calendar...');
      
      if (!window.gapi || !window.gapi.auth2) {
        throw new Error('Google API not loaded');
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      
      if (!authInstance.isSignedIn.get()) {
        // User needs to sign in
        const user = await authInstance.signIn();
        console.log('✅ User signed in to Google:', user.getBasicProfile().getEmail());
      }

      this.isGoogleAuthenticated = true;
      this.googleAccessToken = authInstance.currentUser.get().getAuthResponse().access_token;
      
      // Save integration status
      this.integrations.google = true;
      this.saveIntegrationStatus();
      
      // Show success message
      window.app.ui.showAlert('¡Google Calendar conectado! Los recordatorios aparecerán en tu celular.', 'success');
      
      // Sync existing events
      await this.syncEventsToGoogle();
      
    } catch (error) {
      console.error('❌ Error authenticating with Google:', error);
      window.app.ui.showAlert('Error al conectar con Google Calendar. Intenta de nuevo.', 'error');
    }
  }

  async syncEventsToGoogle() {
    if (!this.isGoogleAuthenticated) return;
    
    try {
      console.log('🔄 Syncing events to Google Calendar...');
      
      const eventsToSync = this.events.filter(event => 
        !event.synced_to_google && 
        new Date(event.date) >= new Date()
      );
      
      for (const event of eventsToSync) {
        await this.createGoogleCalendarEvent(event);
        event.synced_to_google = true;
      }
      
      this.saveEvents();
      console.log(`✅ Synced ${eventsToSync.length} events to Google Calendar`);
      
    } catch (error) {
      console.error('❌ Error syncing events to Google:', error);
    }
  }

  async createGoogleCalendarEvent(event) {
    if (!this.isGoogleAuthenticated) return;
    
    try {
      // Usar hora personalizada o por defecto
      const eventTime = event.time || '09:00';
      const duration = event.duration || 60; // minutos
      
      const startDateTime = new Date(event.date + 'T' + eventTime + ':00');
      const endDateTime = new Date(startDateTime.getTime() + (duration * 60000));
      
      // Generar título personalizado
      const customTitle = this.generateCustomTitle(event);
      
      // Generar descripción personalizada
      const customDescription = this.generateCustomDescription(event);
      
      // Obtener recordatorios personalizados
      const customReminders = this.getCustomReminders(event.type);
      
      const googleEvent = {
        summary: customTitle,
        description: customDescription,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        reminders: {
          useDefault: false,
          overrides: customReminders
        },
        colorId: this.getEventColor(event.type),
        extendedProperties: {
          private: {
            finznEventId: event.id,
            finznEventType: event.type,
            finznAmount: event.amount?.toString() || '',
            finznCategory: event.category || ''
          }
        }
      };
      
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: googleEvent
      });
      
      console.log('✅ Event created in Google Calendar:', response.result.id);
      return response.result;
      
    } catch (error) {
      console.error('❌ Error creating Google Calendar event:', error);
      throw error;
    }
  }

  integrateWithAppleCalendar() {
    // Apple Calendar integration using webcal:// protocol
    console.log('🍎 Integrating with Apple Calendar...');
    
    // Generate ICS file for Apple Calendar
    const upcomingEvents = this.events.filter(event => 
      new Date(event.date) >= new Date()
    );
    
    if (upcomingEvents.length === 0) {
      window.app.ui.showAlert('No hay eventos próximos para sincronizar', 'info');
      return;
    }
    
    const icsContent = this.generateICSForApple(upcomingEvents);
    this.downloadICSForApple(icsContent);
    
    // Mark as integrated
    this.integrations.apple = true;
    this.saveIntegrationStatus();
    
    window.app.ui.showAlert('Archivo de calendario generado. Ábrelo en tu iPhone para agregar los recordatorios.', 'success');
  }

  generateICSForApple(events) {
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//FINZN//Calendar//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:FINZN - Recordatorios Financieros
X-WR-CALDESC:Recordatorios automáticos de FINZN`;

    events.forEach(event => {
      const eventTime = event.time || '09:00';
      const duration = event.duration || 60;
      
      const startDate = new Date(event.date + 'T' + eventTime + ':00');
      const endDate = new Date(startDate.getTime() + (duration * 60000));
      
      const customTitle = this.generateCustomTitle(event);
      const customDescription = this.generateCustomDescription(event);
      const customReminders = this.getCustomReminders(event.type);
      
      icsContent += `
BEGIN:VEVENT
UID:${event.id}@finzn.app
DTSTART:${this.formatICSDate(startDate)}
DTEND:${this.formatICSDate(endDate)}
SUMMARY:${customTitle}
DESCRIPTION:${customDescription.replace(/\n/g, '\\n')}`;

      // Agregar recordatorios personalizados
      customReminders.forEach(reminder => {
        icsContent += `
BEGIN:VALARM
TRIGGER:-PT${reminder.minutes}M
ACTION:DISPLAY
DESCRIPTION:${customTitle}
END:VALARM`;
      });

      icsContent += `
CREATED:${this.formatICSDate(new Date())}
LAST-MODIFIED:${this.formatICSDate(new Date())}
END:VEVENT`;
    });

    icsContent += `
END:VCALENDAR`;

    return icsContent;
  }

  downloadICSForApple(content) {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'FINZN_Recordatorios.ics';
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  showCalendarIntegrationModal(calendarType) {
    const modal = this.createIntegrationModal(calendarType);
    document.body.appendChild(modal);
    modal.classList.add('active');
  }

  createIntegrationModal(calendarType) {
    const modal = document.createElement('div');
    modal.className = 'modal calendar-integration-modal';
    modal.id = `${calendarType}-integration-modal`;

    const calendarNames = {
      google: 'Google Calendar',
      outlook: 'Outlook Calendar',
      apple: 'Apple Calendar'
    };

    const calendarIcons = {
      google: '📅',
      outlook: '📅',
      apple: '📅'
    };

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${calendarIcons[calendarType]} Integrar con ${calendarNames[calendarType]}</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="integration-options">
            <h4>Selecciona los eventos a sincronizar:</h4>
            <div class="event-types-selection">
              <label class="checkbox-label">
                <input type="checkbox" id="${calendarType}-payments" checked>
                <span class="checkmark"></span>
                Pagos y Cuotas
              </label>
              <label class="checkbox-label">
                <input type="checkbox" id="${calendarType}-income" checked>
                <span class="checkmark"></span>
                Ingresos Esperados
              </label>
              <label class="checkbox-label">
                <input type="checkbox" id="${calendarType}-goals">
                <span class="checkmark"></span>
                Fechas Límite de Objetivos
              </label>
              <label class="checkbox-label">
                <input type="checkbox" id="${calendarType}-reviews">
                <span class="checkmark"></span>
                Revisiones Financieras
              </label>
            </div>
            
            <div class="integration-method-info">
              <h4>Método de Integración Actual: URLs de Calendario</h4>
              <p>Los eventos se abrirán en tu calendario para que los agregues manualmente. 
              En futuras actualizaciones tendremos sincronización automática.</p>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary modal-cancel">Cancelar</button>
          <button type="button" class="btn btn-primary" onclick="window.app.calendar.processCalendarIntegration('${calendarType}')">
            <span>🔗</span>
            Integrar Eventos
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.modal-cancel');
    
    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    return modal;
  }

  async processCalendarIntegration(calendarType) {
    console.log(`🔗 Processing ${calendarType} calendar integration...`);
    
    // Get selected event types
    const selectedTypes = [];
    const checkboxes = document.querySelectorAll(`#${calendarType}-integration-modal input[type="checkbox"]:checked`);
    checkboxes.forEach(checkbox => {
      selectedTypes.push(checkbox.id.replace(`${calendarType}-`, ''));
    });

    if (selectedTypes.length === 0) {
      window.app.ui.showAlert('Selecciona al menos un tipo de evento', 'warning');
      return;
    }

    // Get events to integrate based on selected types
    const eventsToIntegrate = this.getEventsForIntegration(selectedTypes);
    
    if (eventsToIntegrate.length === 0) {
      window.app.ui.showAlert('No hay eventos disponibles para integrar', 'info');
      return;
    }

    // Process integration based on current phase
    switch (this.integrationMethods.phase) {
      case 1:
        await this.integrateWithURLs(calendarType, eventsToIntegrate);
        break;
      case 2:
        await this.integrateWithICS(calendarType, eventsToIntegrate);
        break;
      case 3:
        await this.integrateWithAPI(calendarType, eventsToIntegrate);
        break;
    }

    // Close modal
    const modal = document.getElementById(`${calendarType}-integration-modal`);
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  }

  getEventsForIntegration(selectedTypes) {
    const eventsToIntegrate = [];
    
    // Filter events based on selected types
    this.events.forEach(event => {
      let shouldInclude = false;
      
      if (selectedTypes.includes('payments') && event.type === 'payment') {
        shouldInclude = true;
      }
      if (selectedTypes.includes('income') && event.type === 'income') {
        shouldInclude = true;
      }
      if (selectedTypes.includes('goals') && event.type === 'goal-deadline') {
        shouldInclude = true;
      }
      if (selectedTypes.includes('reviews') && event.type === 'review') {
        shouldInclude = true;
      }
      
      if (shouldInclude) {
        eventsToIntegrate.push(event);
      }
    });
    
    return eventsToIntegrate;
  }

  // PHASE 1: URL Integration
  async integrateWithURLs(calendarType, events) {
    console.log(`🔗 Phase 1: Integrating ${events.length} events with ${calendarType} using URLs`);
    
    let successCount = 0;
    
    for (const event of events) {
      try {
        const calendarURL = this.generateCalendarURL(calendarType, event);
        
        // Open calendar URL in new tab
        window.open(calendarURL, '_blank');
        successCount++;
        
        // Small delay between opens to avoid popup blocking
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error creating calendar URL for event ${event.id}:`, error);
      }
    }
    
    window.app.ui.showAlert(
      `Se abrieron ${successCount} eventos en ${this.getCalendarName(calendarType)}. Agrega los que necesites.`,
      'success'
    );
    
    // Mark integration as attempted
    this.integrations[calendarType] = true;
    this.saveIntegrationStatus();
  }

  generateCalendarURL(calendarType, event) {
    const startDate = new Date(event.date + 'T09:00:00');
    const endDate = new Date(event.date + 'T10:00:00');
    
    switch (calendarType) {
      case 'google':
        return this.createGoogleCalendarURL(event, startDate, endDate);
      case 'outlook':
        return this.createOutlookCalendarURL(event, startDate, endDate);
      case 'apple':
        return this.createAppleCalendarURL(event, startDate, endDate);
      default:
        throw new Error(`Unsupported calendar type: ${calendarType}`);
    }
  }

  createGoogleCalendarURL(event, startDate, endDate) {
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${this.formatGoogleDate(startDate)}/${this.formatGoogleDate(endDate)}`,
      details: this.formatEventDescription(event),
      location: ''
    });
    return `${baseUrl}?${params.toString()}`;
  }

  createOutlookCalendarURL(event, startDate, endDate) {
    const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';
    const params = new URLSearchParams({
      subject: event.title,
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      body: this.formatEventDescription(event)
    });
    return `${baseUrl}?${params.toString()}`;
  }

  createAppleCalendarURL(event, startDate, endDate) {
    // Apple Calendar doesn't have direct URL scheme, so we'll generate a webcal URL
    // This will be enhanced in Phase 2 with ICS files
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `[FINZN] ${event.title}`,
      dates: `${this.formatGoogleDate(startDate)}/${this.formatGoogleDate(endDate)}`,
      details: `${this.formatEventDescription(event)}\n\nCreado desde FINZN`,
      location: ''
    });
    return `${baseUrl}?${params.toString()}`;
  }

  formatGoogleDate(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  formatEventDescription(event) {
    let description = event.description || '';
    
    if (event.amount) {
      description += `\n\nMonto: ${this.formatCurrency(event.amount)}`;
    }
    
    if (event.category) {
      description += `\nCategoría: ${event.category}`;
    }
    
    description += '\n\n📱 Creado desde FINZN - Tu compañero financiero inteligente';
    
    return description;
  }

  // PHASE 2: ICS File Integration (Preparado para futuro)
  async integrateWithICS(calendarType, events) {
    console.log(`📁 Phase 2: Integrating ${events.length} events with ICS files`);
    
    // Generate ICS file with all events
    const icsContent = this.generateICSFile(events);
    this.downloadICSFile(icsContent, `FINZN_Events_${calendarType}.ics`);
    
    window.app.ui.showAlert(
      `Archivo de calendario descargado. Impórtalo en ${this.getCalendarName(calendarType)}.`,
      'success'
    );
  }

  generateICSFile(events) {
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//FINZN//Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH`;

    events.forEach(event => {
      const startDate = new Date(event.date + 'T09:00:00');
      const endDate = new Date(event.date + 'T10:00:00');
      
      icsContent += `
BEGIN:VEVENT
UID:${event.id}@finzn.app
DTSTART:${this.formatICSDate(startDate)}
DTEND:${this.formatICSDate(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${this.formatEventDescription(event).replace(/\n/g, '\\n')}
CREATED:${this.formatICSDate(new Date())}
LAST-MODIFIED:${this.formatICSDate(new Date())}
END:VEVENT`;
    });

    icsContent += `
END:VCALENDAR`;

    return icsContent;
  }

  formatICSDate(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  downloadICSFile(content, filename) {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // PHASE 3: Native API Integration (Preparado para futuro)
  async integrateWithAPI(calendarType, events) {
    console.log(`🔗 Phase 3: Integrating ${events.length} events with native ${calendarType} API`);
    
    switch (calendarType) {
      case 'google':
        await this.integrateWithGoogleAPI(events);
        break;
      case 'outlook':
        await this.integrateWithOutlookAPI(events);
        break;
      case 'apple':
        await this.integrateWithAppleAPI(events);
        break;
    }
  }

  async integrateWithGoogleAPI(events) {
    // TODO: Implement Google Calendar API integration
    window.app.ui.showAlert('Integración con Google Calendar API próximamente', 'info');
  }

  async integrateWithOutlookAPI(events) {
    // TODO: Implement Microsoft Graph API integration
    window.app.ui.showAlert('Integración con Outlook API próximamente', 'info');
  }

  async integrateWithAppleAPI(events) {
    // TODO: Implement CalDAV integration
    window.app.ui.showAlert('Integración con Apple Calendar API próximamente', 'info');
  }

  // Utility methods
  getCalendarName(calendarType) {
    const names = {
      google: 'Google Calendar',
      outlook: 'Outlook Calendar',
      apple: 'Apple Calendar'
    };
    return names[calendarType] || calendarType;
  }

  saveIntegrationStatus() {
    try {
      localStorage.setItem('finzn-calendar-integrations', JSON.stringify(this.integrations));
    } catch (error) {
      console.error('Error saving integration status:', error);
    }
  }

  loadIntegrationStatus() {
    try {
      const saved = localStorage.getItem('finzn-calendar-integrations');
      if (saved) {
        this.integrations = { ...this.integrations, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Error loading integration status:', error);
    }
  }

  // Method to upgrade integration phase
  upgradeToPhase(newPhase) {
    if (newPhase >= 1 && newPhase <= 3) {
      this.integrationMethods.phase = newPhase;
      console.log(`📈 Calendar integration upgraded to Phase ${newPhase}`);
      
      const phaseNames = {
        1: 'URLs de Calendario',
        2: 'Archivos ICS',
        3: 'APIs Nativas'
      };
      
      window.app.ui.showAlert(
        `Integración actualizada a: ${phaseNames[newPhase]}`,
        'success'
      );
    }
  }

  // Utility methods
  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // ===== MÉTODOS DE PERSONALIZACIÓN =====
  
  generateCustomTitle(event) {
    const template = this.reminderSettings.titleTemplates[event.type] || '⏰ {title}';
    return template.replace('{title}', event.title);
  }
  
  generateCustomDescription(event) {
    let description = this.reminderSettings.descriptionTemplate;
    
    // Reemplazar variables
    description = description.replace('{description}', event.description || event.title);
    description = description.replace('{amount}', event.amount ? this.formatCurrency(event.amount) : 'No especificado');
    description = description.replace('{category}', event.category || 'General');
    
    return description;
  }
  
  getCustomReminders(eventType) {
    // Recordatorios personalizados por tipo de evento
    if (this.reminderSettings.customReminders[eventType]) {
      return this.reminderSettings.customReminders[eventType];
    }
    
    // Recordatorios por defecto
    return this.reminderSettings.defaultReminders;
  }
  
  getEventColor(eventType) {
    const colors = {
      payment: '11',      // Rojo - Pagos
      income: '10',       // Verde - Ingresos
      'goal-deadline': '9', // Azul - Objetivos
      review: '6',        // Naranja - Revisiones
      reminder: '7'       // Turquesa - Recordatorios
    };
    
    return colors[eventType] || '7';
  }
  
  // Configurar recordatorios personalizados
  setCustomReminders(eventType, reminders) {
    this.reminderSettings.customReminders[eventType] = reminders;
    this.saveReminderSettings();
  }
  
  // Configurar plantillas de título
  setTitleTemplate(eventType, template) {
    this.reminderSettings.titleTemplates[eventType] = template;
    this.saveReminderSettings();
  }
  
  // Configurar plantilla de descripción
  setDescriptionTemplate(template) {
    this.reminderSettings.descriptionTemplate = template;
    this.saveReminderSettings();
  }
  
  // Guardar configuración
  saveReminderSettings() {
    try {
      localStorage.setItem('finzn-reminder-settings', JSON.stringify(this.reminderSettings));
    } catch (error) {
      console.error('Error saving reminder settings:', error);
    }
  }
  
  // Cargar configuración
  loadReminderSettings() {
    try {
      const saved = localStorage.getItem('finzn-reminder-settings');
      if (saved) {
        const savedSettings = JSON.parse(saved);
        this.reminderSettings = { ...this.reminderSettings, ...savedSettings };
      }
    } catch (error) {
      console.error('Error loading reminder settings:', error);
    }
  }
  
  // Obtener configuración actual
  getReminderSettings() {
    return this.reminderSettings;
  }
  
  // Restablecer configuración por defecto
  resetReminderSettings() {
    this.reminderSettings = {
      defaultReminders: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 15 }
      ],
      customReminders: {},
      titleTemplates: {
        payment: '💰 {title}',
        income: '💵 {title}',
        'goal-deadline': '🎯 {title}',
        review: '📊 {title}',
        reminder: '⏰ {title}'
      },
      descriptionTemplate: `{description}

💰 Monto: {amount}
🏷️ Categoría: {category}
📱 Creado desde FINZN - Tu compañero financiero inteligente

¿Necesitas ayuda? Revisa tu dashboard de FINZN para más detalles.`
    };
    this.saveReminderSettings();
  }
}