export class CalendarManager {
  constructor() {
    this.currentDate = new Date();
    this.events = [];
    this.integrations = {
      google: false,
      outlook: false,
      apple: false
    };
    this.integrationMethods = {
      phase: 1, // 1: URLs, 2: ICS Files, 3: Native APIs
      supportedCalendars: ['google', 'outlook', 'apple']
    };
  }

  init() {
    console.log('📅 Initializing Calendar Manager...');
    this.loadIntegrationStatus();
    this.setupEventListeners();
    this.loadEvents();
    this.renderCalendar();
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
      created_at: new Date().toISOString()
    };
    
    this.events.push(event);
    this.saveEvents();
    
    console.log('📅 Event added:', event);
    
    // Refresh calendar display
    this.renderCalendar();
    this.updateSidebarWidgets();
    
    return event;
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
    this.showCalendarIntegrationModal('google');
  }

  handleOutlookIntegration() {
    console.log('📅 Outlook integration');
    this.showCalendarIntegrationModal('outlook');
  }

  handleAppleCalendarIntegration() {
    console.log('📅 Apple Calendar integration');
    this.showCalendarIntegrationModal('apple');
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
}