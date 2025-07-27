export class CalendarManager {
  constructor() {
    this.events = [];
    this.currentDate = new Date();
    this.isGoogleConnected = false;
    this.isAppleConnected = false;
    this.googleCalendarId = 'primary';
    this.isAuthenticating = false;
    this.authPromise = null;
    this.googleAuth = null;
    this.gapi = null;
  }

  init() {
    console.log('📅 Initializing Calendar Manager...');
    this.setupEventListeners();
    this.renderCalendar();
    this.loadEvents();
    this.updateTodayEvents();
    this.updateUpcomingPayments();
    this.checkGoogleConnection();
  }

  setupEventListeners() {
    // Calendar navigation
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousMonth());
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextMonth());
    }

    // Integration buttons
    const googleBtn = document.querySelector('.integration-btn.google-calendar');
    const appleBtn = document.querySelector('.integration-btn.apple-calendar');
    
    if (googleBtn) {
      googleBtn.addEventListener('click', () => this.handleGoogleCalendarIntegration());
    }
    
    if (appleBtn) {
      appleBtn.addEventListener('click', () => this.handleAppleCalendarIntegration());
    }

    // Sync button
    const syncBtn = document.getElementById('sync-calendar-btn');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => this.syncCalendar());
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
      calendarGrid.appendChild(dayHeader);
    });

    // Get first day of month and number of days
    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Generate calendar days
    for (let i = 0; i < 42; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + i);
      
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      
      if (currentDay.getMonth() !== this.currentDate.getMonth()) {
        dayElement.classList.add('other-month');
      }
      
      if (this.isToday(currentDay)) {
        dayElement.classList.add('today');
      }
      
      // Check for events on this day
      const dayEvents = this.getEventsForDate(currentDay);
      if (dayEvents.length > 0) {
        dayElement.classList.add('has-events');
      }
      
      dayElement.innerHTML = `
        <div class="calendar-day-number">${currentDay.getDate()}</div>
        <div class="calendar-day-events">
          ${dayEvents.slice(0, 2).map(event => `
            <div class="calendar-event ${event.type}" title="${event.title}">
              ${event.title.substring(0, 10)}${event.title.length > 10 ? '...' : ''}
            </div>
          `).join('')}
          ${dayEvents.length > 2 ? `<div class="calendar-event-more">+${dayEvents.length - 2} más</div>` : ''}
        </div>
      `;
      
      dayElement.addEventListener('click', () => this.selectDate(currentDay));
      calendarGrid.appendChild(dayElement);
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

  isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  selectDate(date) {
    console.log('📅 Selected date:', date);
    // You can add functionality here for when a date is selected
  }

  getEventsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return this.events.filter(event => event.date === dateStr);
  }

  async addEvent(eventData) {
    try {
      console.log('📅 Adding calendar event:', eventData);
      
      const event = {
        id: this.generateEventId(),
        title: eventData.title,
        type: eventData.type,
        date: eventData.date,
        time: eventData.time || '09:00',
        duration: eventData.duration || 60,
        amount: eventData.amount || null,
        description: eventData.description || '',
        category: eventData.category || '',
        recurring: eventData.recurring || false,
        reminders: this.getDefaultReminders(),
        createdAt: new Date().toISOString()
      };

      // Add to local events
      this.events.push(event);
      
      // Save to localStorage
      this.saveEvents();
      
      // Sync with Google Calendar if connected
      if (this.isGoogleConnected) {
        await this.syncEventToGoogle(event);
      }
      
      // Update UI
      this.renderCalendar();
      this.updateTodayEvents();
      this.updateUpcomingPayments();
      
      console.log('✅ Event added successfully');
      return true;
    } catch (error) {
      console.error('❌ Error adding event:', error);
      return false;
    }
  }

  generateEventId() {
    return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getDefaultReminders() {
    return [
      { minutes: 60, enabled: true },
      { minutes: 15, enabled: true }
    ];
  }

  loadEvents() {
    try {
      const savedEvents = localStorage.getItem('finzn-calendar-events');
      if (savedEvents) {
        this.events = JSON.parse(savedEvents);
        console.log('📅 Loaded events:', this.events.length);
      }
    } catch (error) {
      console.error('❌ Error loading events:', error);
      this.events = [];
    }
  }

  saveEvents() {
    try {
      localStorage.setItem('finzn-calendar-events', JSON.stringify(this.events));
      console.log('💾 Events saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving events:', error);
    }
  }

  updateTodayEvents() {
    const container = document.getElementById('today-events');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];
    const todayEvents = this.events.filter(event => event.date === today);

    container.innerHTML = '';

    if (todayEvents.length === 0) {
      container.innerHTML = `
        <div class="empty-state-small">
          <p>No hay eventos para hoy</p>
        </div>
      `;
      return;
    }

    todayEvents.forEach(event => {
      const eventElement = document.createElement('div');
      eventElement.className = `today-event ${event.type}`;
      
      eventElement.innerHTML = `
        <div class="event-time">${event.time}</div>
        <div class="event-details">
          <div class="event-title">${event.title}</div>
          ${event.amount ? `<div class="event-amount">${this.formatCurrency(event.amount)}</div>` : ''}
        </div>
      `;
      
      container.appendChild(eventElement);
    });
  }

  updateUpcomingPayments() {
    const container = document.getElementById('upcoming-payments');
    if (!container) return;

    // Get upcoming payment events (next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const upcomingPayments = this.events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && 
             eventDate <= nextWeek && 
             (event.type === 'payment' || event.amount);
    });

    container.innerHTML = '';

    if (upcomingPayments.length === 0) {
      container.innerHTML = `
        <div class="empty-state-small">
          <p>No hay pagos próximos</p>
        </div>
      `;
      return;
    }

    upcomingPayments.forEach(payment => {
      const paymentElement = document.createElement('div');
      paymentElement.className = 'upcoming-payment';
      
      const eventDate = new Date(payment.date);
      const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
      
      paymentElement.innerHTML = `
        <div class="payment-info">
          <div class="payment-title">${payment.title}</div>
          <div class="payment-date">
            ${daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : `En ${daysUntil} días`}
          </div>
        </div>
        ${payment.amount ? `<div class="payment-amount">${this.formatCurrency(payment.amount)}</div>` : ''}
      `;
      
      container.appendChild(paymentElement);
    });
  }

  // Google Calendar Integration
  async handleGoogleCalendarIntegration() {
    try {
      console.log('🔗 Attempting Google Calendar integration...');
      
      if (this.isGoogleConnected) {
        await this.disconnectGoogleCalendar();
      } else {
        await this.connectGoogleCalendar();
      }
    } catch (error) {
      console.error('❌ Google Calendar integration failed:', error);
      this.showCalendarHelp('google-error', error.message);
    }
  }

  async connectGoogleCalendar() {
    try {
      console.log('🔗 Connecting to Google Calendar...');
      
      // Check if API keys are configured
      if (!this.checkGoogleConfiguration()) {
        this.showCalendarHelp('google-config');
        return;
      }

      // Load Google APIs
      await this.loadGoogleAPIs();
      
      // Authenticate
      await this.performGoogleAuthentication();
      
      // Update connection status
      this.isGoogleConnected = true;
      this.updateGoogleConnectionStatus();
      
      // Sync events
      await this.syncWithGoogleCalendar();
      
      console.log('✅ Google Calendar connected successfully');
      
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Google Calendar conectado exitosamente', 'success');
      }
      
    } catch (error) {
      console.error('❌ Error connecting to Google Calendar:', error);
      this.handleGoogleError(error);
    }
  }

  checkGoogleConfiguration() {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    console.log('🔧 Google Config Check:', {
      apiKey: apiKey ? 'Present' : 'Missing',
      clientId: clientId ? 'Present' : 'Missing'
    });
    
    return !!(apiKey && clientId);
  }

  async loadGoogleAPIs() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.gapi && window.google) {
        console.log('✅ Google APIs already loaded');
        this.gapi = window.gapi;
        resolve();
        return;
      }

      console.log('📦 Loading Google APIs...');
      
      // Load Google API script
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        // Load Google Identity Services
        const identityScript = document.createElement('script');
        identityScript.src = 'https://accounts.google.com/gsi/client';
        identityScript.onload = () => {
          console.log('✅ Google APIs loaded');
          this.gapi = window.gapi;
          
          // Small delay to ensure services are ready
          setTimeout(() => resolve(), 500);
        };
        identityScript.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(identityScript);
      };
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  async performGoogleAuthentication() {
    if (this.isAuthenticating) {
      console.log('⏳ Authentication already in progress, waiting...');
      return this.authPromise;
    }

    this.isAuthenticating = true;
    
    try {
      this.authPromise = this.performSingleGoogleAuth();
      const result = await this.authPromise;
      return result;
    } finally {
      this.isAuthenticating = false;
      this.authPromise = null;
    }
  }

  async performSingleGoogleAuth() {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      // Initialize GAPI
      await new Promise((resolve, reject) => {
        this.gapi.load('client:auth2', {
          callback: resolve,
          onerror: reject
        });
      });

      // Initialize the client
      await this.gapi.client.init({
        apiKey: apiKey,
        clientId: clientId,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: 'https://www.googleapis.com/auth/calendar'
      });

      // Get auth instance
      this.googleAuth = this.gapi.auth2.getAuthInstance();
      
      // Check if already signed in
      if (this.googleAuth.isSignedIn.get()) {
        console.log('✅ Already signed in to Google');
        return true;
      }

      // Sign in
      console.log('🔐 Signing in to Google...');
      await this.googleAuth.signIn();
      
      console.log('✅ Google authentication successful');
      return true;
      
    } catch (error) {
      console.error('❌ Google authentication error:', error);
      
      // Handle specific error types
      if (error.error === 'popup_blocked_by_browser') {
        throw new Error('El navegador bloqueó la ventana emergente. Permite ventanas emergentes para este sitio.');
      } else if (error.error === 'access_denied') {
        throw new Error('Acceso denegado. Necesitas autorizar el acceso a Google Calendar.');
      } else if (error.message && error.message.includes('Only one navigator.credentials.get')) {
        console.log('⏳ Multiple auth requests detected, waiting and retrying...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.performSingleGoogleAuth();
      }
      
      throw error;
    }
  }

  async checkGoogleAuthStatus() {
    try {
      if (!this.googleAuth) {
        return false;
      }
      
      const isSignedIn = this.googleAuth.isSignedIn.get();
      console.log('🔍 Google auth status:', isSignedIn);
      
      return isSignedIn;
    } catch (error) {
      console.error('❌ Error checking Google auth status:', error);
      return false;
    }
  }

  async syncWithGoogleCalendar() {
    try {
      console.log('🔄 Syncing with Google Calendar...');
      
      if (!this.googleAuth || !this.googleAuth.isSignedIn.get()) {
        throw new Error('Not authenticated with Google');
      }

      // Get events from Google Calendar
      const response = await this.gapi.client.calendar.events.list({
        calendarId: this.googleCalendarId,
        timeMin: new Date().toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime'
      });

      const googleEvents = response.result.items || [];
      console.log('📅 Retrieved Google Calendar events:', googleEvents.length);

      // Convert Google events to our format
      googleEvents.forEach(googleEvent => {
        const existingEvent = this.events.find(e => e.googleId === googleEvent.id);
        
        if (!existingEvent) {
          const event = {
            id: this.generateEventId(),
            googleId: googleEvent.id,
            title: googleEvent.summary || 'Sin título',
            type: 'imported',
            date: googleEvent.start.date || googleEvent.start.dateTime.split('T')[0],
            time: googleEvent.start.dateTime ? 
                  new Date(googleEvent.start.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 
                  '00:00',
            description: googleEvent.description || '',
            createdAt: new Date().toISOString()
          };
          
          this.events.push(event);
        }
      });

      this.saveEvents();
      this.renderCalendar();
      this.updateTodayEvents();
      
      console.log('✅ Google Calendar sync completed');
      
    } catch (error) {
      console.error('❌ Error syncing with Google Calendar:', error);
      throw error;
    }
  }

  async syncEventToGoogle(event) {
    try {
      if (!this.googleAuth || !this.googleAuth.isSignedIn.get()) {
        console.log('⚠️ Not connected to Google Calendar, skipping sync');
        return;
      }

      const googleEvent = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: `${event.date}T${event.time}:00`,
          timeZone: 'America/Argentina/Buenos_Aires'
        },
        end: {
          dateTime: this.calculateEndTime(event.date, event.time, event.duration),
          timeZone: 'America/Argentina/Buenos_Aires'
        },
        reminders: {
          useDefault: false,
          overrides: event.reminders.filter(r => r.enabled).map(r => ({
            method: 'popup',
            minutes: r.minutes
          }))
        }
      };

      const response = await this.gapi.client.calendar.events.insert({
        calendarId: this.googleCalendarId,
        resource: googleEvent
      });

      // Update local event with Google ID
      event.googleId = response.result.id;
      this.saveEvents();

      console.log('✅ Event synced to Google Calendar:', response.result.id);
      
    } catch (error) {
      console.error('❌ Error syncing event to Google:', error);
    }
  }

  calculateEndTime(date, time, duration) {
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + (duration * 60000));
    return endDateTime.toISOString().slice(0, 19);
  }

  async disconnectGoogleCalendar() {
    try {
      console.log('🔌 Disconnecting from Google Calendar...');
      
      if (this.googleAuth) {
        await this.googleAuth.signOut();
      }
      
      this.isGoogleConnected = false;
      this.googleAuth = null;
      this.updateGoogleConnectionStatus();
      
      console.log('✅ Google Calendar disconnected');
      
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Google Calendar desconectado', 'info');
      }
      
    } catch (error) {
      console.error('❌ Error disconnecting Google Calendar:', error);
    }
  }

  updateGoogleConnectionStatus() {
    const statusElement = document.getElementById('google-status');
    if (statusElement) {
      statusElement.textContent = this.isGoogleConnected ? 'Conectado' : 'No conectado';
      statusElement.className = this.isGoogleConnected ? 'connected' : 'disconnected';
    }

    const googleBtn = document.querySelector('.integration-btn.google-calendar');
    if (googleBtn) {
      googleBtn.classList.toggle('connected', this.isGoogleConnected);
    }
  }

  checkGoogleConnection() {
    // Check if we have stored Google connection info
    const hasGoogleConnection = localStorage.getItem('finzn-google-connected') === 'true';
    if (hasGoogleConnection) {
      this.isGoogleConnected = true;
      this.updateGoogleConnectionStatus();
    }
  }

  handleGoogleError(error) {
    console.error('❌ Google Calendar error:', error);
    
    let helpType = 'google-error';
    let message = error.message || 'Error desconocido';
    
    if (error.message && error.message.includes('popup_blocked')) {
      helpType = 'google-popup-blocked';
    } else if (error.message && error.message.includes('access_denied')) {
      helpType = 'google-access-denied';
    } else if (error.message && error.message.includes('server_error')) {
      helpType = 'google-oauth-blocked';
    } else if (error.error === 'tokenFailed' && error.idpId === 'google') {
      helpType = 'google-oauth-blocked';
    }
    
    this.showCalendarHelp(helpType, message);
    
    if (window.app && window.app.ui) {
      window.app.ui.showAlert('Error al conectar con Google Calendar. Revisa la configuración.', 'error');
    }
  }

  // Apple Calendar Integration (placeholder)
  async handleAppleCalendarIntegration() {
    console.log('🍎 Apple Calendar integration not yet implemented');
    
    this.showCalendarHelp('apple-not-implemented');
    
    if (window.app && window.app.ui) {
      window.app.ui.showAlert('Integración con Apple Calendar próximamente', 'info');
    }
  }

  // Calendar sync
  async syncCalendar() {
    try {
      console.log('🔄 Syncing calendar...');
      
      if (this.isGoogleConnected) {
        await this.syncWithGoogleCalendar();
        
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('Calendario sincronizado correctamente', 'success');
        }
      } else {
        if (window.app && window.app.ui) {
          window.app.ui.showAlert('No hay calendarios conectados para sincronizar', 'warning');
        }
      }
      
    } catch (error) {
      console.error('❌ Error syncing calendar:', error);
      
      if (window.app && window.app.ui) {
        window.app.ui.showAlert('Error al sincronizar el calendario', 'error');
      }
    }
  }

  // Help system
  showCalendarHelp(type, details = '') {
    const helpContainer = document.getElementById('calendar-help');
    if (!helpContainer) return;

    let helpContent = '';
    
    switch (type) {
      case 'google-config':
        helpContent = `
          <div class="help-section error">
            <h4>⚙️ Configuración de Google Calendar Requerida</h4>
            <p>Para usar Google Calendar necesitas configurar las credenciales:</p>
            <ol>
              <li>Ve a <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
              <li>Crea un proyecto y habilita Google Calendar API</li>
              <li>Crea credenciales (API Key y OAuth 2.0 Client ID)</li>
              <li>Configura las variables de entorno en tu aplicación</li>
            </ol>
          </div>
        `;
        break;
        
      case 'google-popup-blocked':
        helpContent = `
          <div class="help-section warning">
            <h4>🚫 Ventana Emergente Bloqueada</h4>
            <p>Tu navegador bloqueó la ventana de autenticación de Google.</p>
            <p><strong>Solución:</strong> Permite ventanas emergentes para este sitio y vuelve a intentar.</p>
          </div>
        `;
        break;
        
      case 'google-access-denied':
        helpContent = `
          <div class="help-section warning">
            <h4>❌ Acceso Denegado</h4>
            <p>Denegaste el acceso a Google Calendar.</p>
            <p><strong>Solución:</strong> Vuelve a intentar y autoriza el acceso cuando se te solicite.</p>
          </div>
        `;
        break;
        
      case 'google-oauth-blocked':
        helpContent = `
          <div class="help-section error">
            <h4>🔒 Dominio No Autorizado</h4>
            <p>Tu dominio no está autorizado en Google Cloud Console.</p>
            <p><strong>Dominio actual:</strong> ${window.location.origin}</p>
            <ol>
              <li>Ve a <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
              <li>Ve a APIs & Services → Credentials</li>
              <li>Edita tu OAuth 2.0 Client ID</li>
              <li>Agrega <code>${window.location.origin}</code> a "Authorized JavaScript origins"</li>
              <li>Guarda y espera 5-10 minutos para que se propague</li>
            </ol>
          </div>
        `;
        break;
        
      case 'apple-not-implemented':
        helpContent = `
          <div class="help-section info">
            <h4>🍎 Apple Calendar</h4>
            <p>La integración con Apple Calendar estará disponible próximamente.</p>
            <p>Por ahora puedes usar Google Calendar o agregar eventos manualmente.</p>
          </div>
        `;
        break;
        
      case 'google-error':
      default:
        helpContent = `
          <div class="help-section error">
            <h4>❌ Error de Google Calendar</h4>
            <p>Ocurrió un error al conectar con Google Calendar:</p>
            <p><code>${details}</code></p>
            <p>Verifica tu configuración e intenta nuevamente.</p>
          </div>
        `;
        break;
    }
    
    helpContainer.innerHTML = helpContent;
    helpContainer.style.display = 'block';
    
    // Auto-hide after 10 seconds for non-critical messages
    if (!type.includes('config') && !type.includes('oauth-blocked')) {
      setTimeout(() => {
        helpContainer.style.display = 'none';
      }, 10000);
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
}