export class CalendarManager {
  constructor() {
    this.currentDate = new Date();
    this.events = [];
    this.integrations = {
      google: false,
      outlook: false,
      apple: false
    };
  }

  init() {
    console.log('📅 Initializing Calendar Manager...');
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
    window.app.ui.showAlert('Integración con Google Calendar próximamente', 'info');
  }

  handleOutlookIntegration() {
    console.log('📅 Outlook integration');
    window.app.ui.showAlert('Integración con Outlook próximamente', 'info');
  }

  handleAppleCalendarIntegration() {
    console.log('📅 Apple Calendar integration');
    window.app.ui.showAlert('Integración con Apple Calendar próximamente', 'info');
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