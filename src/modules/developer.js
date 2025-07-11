export class DeveloperManager {
  constructor() {
    this.isEnabled = localStorage.getItem('finzn-dev-mode') === 'true';
    this.debugLevel = localStorage.getItem('finzn-debug-level') || 'info';
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };
    this.logs = [];
    this.maxLogs = 1000;
  }

  init() {
    this.setupKeyboardShortcuts();
    this.interceptConsole();
    
    if (this.isEnabled) {
      this.enable();
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl + Shift + D to toggle developer mode
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        this.toggle();
      }
      
      // Ctrl + Shift + C to open console in dev mode
      if (e.ctrlKey && e.shiftKey && e.key === 'C' && this.isEnabled) {
        e.preventDefault();
        this.showConsole();
      }
      
      // Ctrl + Shift + R to reset all data (dev mode only)
      if (e.ctrlKey && e.shiftKey && e.key === 'R' && this.isEnabled) {
        e.preventDefault();
        this.resetAllData();
      }
    });
  }

  interceptConsole() {
    const self = this;
    
    ['log', 'warn', 'error', 'info'].forEach(method => {
      console[method] = function(...args) {
        // Call original console method
        self.originalConsole[method].apply(console, args);
        
        // Store log if dev mode is enabled
        if (self.isEnabled) {
          self.addLog(method, args);
        }
      };
    });
  }

  addLog(level, args) {
    const log = {
      timestamp: new Date().toISOString(),
      level,
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
    };
    
    this.logs.unshift(log);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    // Update console if it's open
    this.updateConsoleDisplay();
  }

  toggle() {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  enable() {
    this.isEnabled = true;
    localStorage.setItem('finzn-dev-mode', 'true');
    this.createDeveloperPanel();
    this.showNotification('🔧 Modo Desarrollador Activado', 'success');
    console.info('🔧 Developer Mode Enabled');
  }

  disable() {
    this.isEnabled = false;
    localStorage.setItem('finzn-dev-mode', 'false');
    this.removeDeveloperPanel();
    this.showNotification('🔧 Modo Desarrollador Desactivado', 'info');
    console.info('🔧 Developer Mode Disabled');
  }

  createDeveloperPanel() {
    // Remove existing panel if it exists
    this.removeDeveloperPanel();
    
    const panel = document.createElement('div');
    panel.id = 'developer-panel';
    panel.className = 'developer-panel';
    panel.innerHTML = `
      <div class="dev-panel-header">
        <h3>🔧 Developer Mode</h3>
        <div class="dev-panel-controls">
          <button id="dev-minimize" class="dev-btn dev-btn-sm">−</button>
          <button id="dev-close" class="dev-btn dev-btn-sm">×</button>
        </div>
      </div>
      
      <div class="dev-panel-content">
        <div class="dev-tabs">
          <button class="dev-tab active" data-tab="debug">Debug</button>
          <button class="dev-tab" data-tab="data">Data</button>
          <button class="dev-tab" data-tab="performance">Performance</button>
          <button class="dev-tab" data-tab="tools">Tools</button>
        </div>
        
        <!-- Debug Tab -->
        <div class="dev-tab-content active" data-tab="debug">
          <div class="dev-section">
            <h4>Console Logs</h4>
            <div class="dev-controls">
              <select id="debug-level">
                <option value="all">All Levels</option>
                <option value="error">Errors Only</option>
                <option value="warn">Warnings & Errors</option>
                <option value="info">Info & Above</option>
              </select>
              <button id="clear-logs" class="dev-btn dev-btn-sm">Clear</button>
            </div>
            <div id="dev-console" class="dev-console"></div>
          </div>
        </div>
        
        <!-- Data Tab -->
        <div class="dev-tab-content" data-tab="data">
          <div class="dev-section">
            <h4>Data Management</h4>
            <div class="dev-data-stats">
              <div class="dev-stat">
                <span class="dev-stat-label">Current User:</span>
                <span class="dev-stat-value" id="dev-current-user">-</span>
              </div>
              <div class="dev-stat">
                <span class="dev-stat-label">Data Size:</span>
                <span class="dev-stat-value" id="dev-data-size">-</span>
              </div>
              <div class="dev-stat">
                <span class="dev-stat-label">Expenses:</span>
                <span class="dev-stat-value" id="dev-expenses-count">-</span>
              </div>
              <div class="dev-stat">
                <span class="dev-stat-label">Goals:</span>
                <span class="dev-stat-value" id="dev-goals-count">-</span>
              </div>
            </div>
            <div class="dev-actions">
              <button id="dev-export-data" class="dev-btn">Export All Data</button>
              <button id="dev-import-data" class="dev-btn">Import Data</button>
              <button id="dev-reset-data" class="dev-btn dev-btn-danger">Reset All Data</button>
              <button id="dev-generate-sample" class="dev-btn">Generate Sample Data</button>
            </div>
            <input type="file" id="dev-import-file" accept=".json" style="display: none;" />
          </div>
        </div>
        
        <!-- Performance Tab -->
        <div class="dev-tab-content" data-tab="performance">
          <div class="dev-section">
            <h4>Performance Metrics</h4>
            <div class="dev-performance-stats">
              <div class="dev-stat">
                <span class="dev-stat-label">Memory Usage:</span>
                <span class="dev-stat-value" id="dev-memory-usage">-</span>
              </div>
              <div class="dev-stat">
                <span class="dev-stat-label">Load Time:</span>
                <span class="dev-stat-value" id="dev-load-time">-</span>
              </div>
              <div class="dev-stat">
                <span class="dev-stat-label">DOM Nodes:</span>
                <span class="dev-stat-value" id="dev-dom-nodes">-</span>
              </div>
            </div>
            <button id="dev-run-performance" class="dev-btn">Run Performance Test</button>
          </div>
        </div>
        
        <!-- Tools Tab -->
        <div class="dev-tab-content" data-tab="tools">
          <div class="dev-section">
            <h4>Development Tools</h4>
            <div class="dev-tools-grid">
              <button id="dev-toggle-grid" class="dev-btn">Toggle Grid Overlay</button>
              <button id="dev-highlight-elements" class="dev-btn">Highlight Elements</button>
              <button id="dev-show-breakpoints" class="dev-btn">Show Breakpoints</button>
              <button id="dev-color-picker" class="dev-btn">Color Picker</button>
              <button id="dev-measure-tool" class="dev-btn">Measure Tool</button>
              <button id="dev-accessibility-check" class="dev-btn">Accessibility Check</button>
            </div>
          </div>
          
          <div class="dev-section">
            <h4>Quick Actions</h4>
            <div class="dev-quick-actions">
              <button id="dev-reload-css" class="dev-btn">Reload CSS</button>
              <button id="dev-toggle-animations" class="dev-btn">Toggle Animations</button>
              <button id="dev-simulate-offline" class="dev-btn">Simulate Offline</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    this.setupDeveloperPanelEvents();
    this.updateDataStats();
    this.updatePerformanceStats();
  }

  setupDeveloperPanelEvents() {
    // Panel controls
    document.getElementById('dev-close').addEventListener('click', () => this.disable());
    document.getElementById('dev-minimize').addEventListener('click', () => this.toggleMinimize());
    
    // Tab switching
    document.querySelectorAll('.dev-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
    
    // Debug controls
    document.getElementById('debug-level').addEventListener('change', (e) => {
      this.debugLevel = e.target.value;
      localStorage.setItem('finzn-debug-level', this.debugLevel);
      this.updateConsoleDisplay();
    });
    
    document.getElementById('clear-logs').addEventListener('click', () => {
      this.logs = [];
      this.updateConsoleDisplay();
    });
    
    // Data management
    document.getElementById('dev-export-data').addEventListener('click', () => this.exportAllData());
    document.getElementById('dev-import-data').addEventListener('click', () => this.importData());
    document.getElementById('dev-reset-data').addEventListener('click', () => this.resetAllData());
    document.getElementById('dev-generate-sample').addEventListener('click', () => this.generateSampleData());
    
    document.getElementById('dev-import-file').addEventListener('change', (e) => this.handleImportFile(e));
    
    // Performance
    document.getElementById('dev-run-performance').addEventListener('click', () => this.runPerformanceTest());
    
    // Tools
    document.getElementById('dev-toggle-grid').addEventListener('click', () => this.toggleGridOverlay());
    document.getElementById('dev-highlight-elements').addEventListener('click', () => this.highlightElements());
    document.getElementById('dev-show-breakpoints').addEventListener('click', () => this.showBreakpoints());
    document.getElementById('dev-reload-css').addEventListener('click', () => this.reloadCSS());
    document.getElementById('dev-toggle-animations').addEventListener('click', () => this.toggleAnimations());
    document.getElementById('dev-simulate-offline').addEventListener('click', () => this.simulateOffline());
  }

  removeDeveloperPanel() {
    const panel = document.getElementById('developer-panel');
    if (panel) {
      panel.remove();
    }
  }

  toggleMinimize() {
    const panel = document.getElementById('developer-panel');
    if (panel) {
      panel.classList.toggle('minimized');
    }
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.dev-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.dev-tab-content').forEach(content => {
      content.classList.toggle('active', content.dataset.tab === tabName);
    });
    
    // Update data when switching to relevant tabs
    if (tabName === 'data') {
      this.updateDataStats();
    } else if (tabName === 'performance') {
      this.updatePerformanceStats();
    }
  }

  updateConsoleDisplay() {
    const consoleElement = document.getElementById('dev-console');
    if (!consoleElement) return;
    
    const filteredLogs = this.filterLogs();
    
    consoleElement.innerHTML = filteredLogs.map(log => `
      <div class="dev-log dev-log-${log.level}">
        <span class="dev-log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
        <span class="dev-log-level">[${log.level.toUpperCase()}]</span>
        <span class="dev-log-message">${log.message}</span>
      </div>
    `).join('');
    
    // Auto-scroll to bottom
    consoleElement.scrollTop = consoleElement.scrollHeight;
  }

  filterLogs() {
    if (this.debugLevel === 'all') return this.logs;
    
    const levelPriority = { error: 3, warn: 2, info: 1, log: 0 };
    const minLevel = levelPriority[this.debugLevel] || 0;
    
    return this.logs.filter(log => (levelPriority[log.level] || 0) >= minLevel);
  }

  updateDataStats() {
    const currentUser = localStorage.getItem('currentUser') || 'None';
    const userData = localStorage.getItem(`finzn-data-${currentUser}`);
    
    let dataSize = 0;
    let expensesCount = 0;
    let goalsCount = 0;
    
    if (userData) {
      dataSize = new Blob([userData]).size;
      try {
        const data = JSON.parse(userData);
        expensesCount = Object.values(data.expenses || {}).flat().length;
        goalsCount = (data.goals || []).length;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    const elements = {
      'dev-current-user': currentUser,
      'dev-data-size': this.formatBytes(dataSize),
      'dev-expenses-count': expensesCount,
      'dev-goals-count': goalsCount
    };
    
    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
  }

  updatePerformanceStats() {
    const memoryInfo = performance.memory || {};
    const loadTime = performance.timing ? 
      performance.timing.loadEventEnd - performance.timing.navigationStart : 0;
    const domNodes = document.querySelectorAll('*').length;
    
    const elements = {
      'dev-memory-usage': this.formatBytes(memoryInfo.usedJSHeapSize || 0),
      'dev-load-time': `${loadTime}ms`,
      'dev-dom-nodes': domNodes
    };
    
    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
  }

  exportAllData() {
    const allData = {};
    
    // Export all localStorage data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('finzn-')) {
        allData[key] = localStorage.getItem(key);
      }
    }
    
    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `finzn-dev-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showNotification('📁 Data exported successfully', 'success');
  }

  importData() {
    document.getElementById('dev-import-file').click();
  }

  handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Import data to localStorage
        Object.entries(data).forEach(([key, value]) => {
          if (key.startsWith('finzn-')) {
            localStorage.setItem(key, value);
          }
        });
        
        this.showNotification('📁 Data imported successfully', 'success');
        this.updateDataStats();
        
        // Reload the app to reflect changes
        if (confirm('Data imported. Reload the app to see changes?')) {
          window.location.reload();
        }
      } catch (error) {
        console.error('Import error:', error);
        this.showNotification('❌ Error importing data', 'error');
      }
    };
    
    reader.readAsText(file);
  }

  resetAllData() {
    if (!confirm('⚠️ This will delete ALL data. Are you sure?')) return;
    if (!confirm('🚨 This action cannot be undone. Continue?')) return;
    
    // Clear all FINZN data from localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('finzn-') || key === 'currentUser') {
        localStorage.removeItem(key);
      }
    });
    
    this.showNotification('🗑️ All data reset', 'success');
    this.updateDataStats();
    
    // Reload the app
    setTimeout(() => window.location.reload(), 1000);
  }

  generateSampleData() {
    if (!confirm('Generate sample data? This will add test expenses and goals.')) return;
    
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      this.showNotification('❌ No user logged in', 'error');
      return;
    }
    
    const sampleData = this.createSampleData();
    localStorage.setItem(`finzn-data-${currentUser}`, JSON.stringify(sampleData));
    
    this.showNotification('📊 Sample data generated', 'success');
    this.updateDataStats();
    
    if (confirm('Sample data generated. Reload to see changes?')) {
      window.location.reload();
    }
  }

  createSampleData() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    return {
      expenses: {
        [currentMonth]: [
          {
            id: 'sample-1',
            description: 'Supermercado Coto',
            amount: 15000,
            category: 'Supermercado',
            transactionDate: new Date().toISOString().split('T')[0],
            date: currentMonth,
            createdAt: new Date().toISOString()
          },
          {
            id: 'sample-2',
            description: 'Uber',
            amount: 2500,
            category: 'Transporte',
            transactionDate: new Date().toISOString().split('T')[0],
            date: currentMonth,
            createdAt: new Date().toISOString()
          },
          {
            id: 'sample-3',
            description: 'Netflix',
            amount: 1200,
            category: 'Ocio',
            transactionDate: new Date().toISOString().split('T')[0],
            date: currentMonth,
            createdAt: new Date().toISOString()
          }
        ]
      },
      income: {
        [currentMonth]: {
          fixed: 80000,
          extra: 5000
        }
      },
      extraIncomes: {
        [currentMonth]: [
          {
            id: 'extra-1',
            description: 'Venta de producto',
            amount: 5000,
            category: 'Venta',
            date: currentMonth,
            createdAt: new Date().toISOString()
          }
        ]
      },
      goals: [
        {
          id: 'goal-1',
          name: 'Vacaciones',
          target: 100000,
          current: 25000,
          createdAt: new Date().toISOString()
        },
        {
          id: 'goal-2',
          name: 'Fondo de Emergencia',
          target: 200000,
          current: 50000,
          createdAt: new Date().toISOString()
        }
      ],
      categories: [
        { id: '1', name: 'Comida', icon: '🍔', color: '#ef4444' },
        { id: '2', name: 'Transporte', icon: '🚗', color: '#3b82f6' },
        { id: '3', name: 'Salud', icon: '💊', color: '#8b5cf6' },
        { id: '4', name: 'Ocio', icon: '🎉', color: '#f59e0b' },
        { id: '5', name: 'Supermercado', icon: '🛒', color: '#10b981' },
        { id: '6', name: 'Servicios', icon: '📱', color: '#6b7280' },
        { id: '7', name: 'Otros', icon: '📦', color: '#9ca3af' }
      ],
      achievements: [],
      recurringExpenses: [],
      spendingLimits: [
        {
          id: 'limit-1',
          category: 'Supermercado',
          amount: 20000,
          warning: 80,
          createdAt: new Date().toISOString()
        }
      ],
      monthlySavings: {}
    };
  }

  runPerformanceTest() {
    const startTime = performance.now();
    
    // Simulate some operations
    const testOperations = [
      () => document.querySelectorAll('*').length,
      () => JSON.stringify(localStorage),
      () => Array.from({length: 1000}, (_, i) => i * 2),
      () => document.createElement('div').innerHTML = 'test'
    ];
    
    testOperations.forEach(op => op());
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.showNotification(`⚡ Performance test completed in ${duration.toFixed(2)}ms`, 'info');
    this.updatePerformanceStats();
  }

  toggleGridOverlay() {
    let overlay = document.getElementById('dev-grid-overlay');
    
    if (overlay) {
      overlay.remove();
      return;
    }
    
    overlay = document.createElement('div');
    overlay.id = 'dev-grid-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
      background-image: 
        linear-gradient(rgba(255,0,0,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,0,0,0.1) 1px, transparent 1px);
      background-size: 20px 20px;
    `;
    
    document.body.appendChild(overlay);
    
    setTimeout(() => {
      if (overlay) overlay.remove();
    }, 5000);
  }

  highlightElements() {
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
      el.style.outline = '1px solid red';
    });
    
    setTimeout(() => {
      elements.forEach(el => {
        el.style.outline = '';
      });
    }, 3000);
  }

  showBreakpoints() {
    const breakpoints = ['480px', '768px', '1024px', '1200px'];
    let overlay = document.getElementById('dev-breakpoints-overlay');
    
    if (overlay) {
      overlay.remove();
      return;
    }
    
    overlay = document.createElement('div');
    overlay.id = 'dev-breakpoints-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9998;
    `;
    
    breakpoints.forEach(bp => {
      const line = document.createElement('div');
      line.style.cssText = `
        position: absolute;
        left: ${bp};
        top: 0;
        width: 2px;
        height: 100%;
        background: rgba(0,255,0,0.5);
      `;
      
      const label = document.createElement('div');
      label.textContent = bp;
      label.style.cssText = `
        position: absolute;
        left: ${bp};
        top: 10px;
        background: rgba(0,255,0,0.8);
        color: white;
        padding: 2px 4px;
        font-size: 12px;
        transform: translateX(-50%);
      `;
      
      overlay.appendChild(line);
      overlay.appendChild(label);
    });
    
    document.body.appendChild(overlay);
    
    setTimeout(() => {
      if (overlay) overlay.remove();
    }, 5000);
  }

  reloadCSS() {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
      const href = link.href;
      link.href = href + (href.includes('?') ? '&' : '?') + 'reload=' + Date.now();
    });
    
    this.showNotification('🎨 CSS reloaded', 'success');
  }

  toggleAnimations() {
    const style = document.getElementById('dev-no-animations');
    
    if (style) {
      style.remove();
      this.showNotification('✨ Animations enabled', 'success');
    } else {
      const noAnimStyle = document.createElement('style');
      noAnimStyle.id = 'dev-no-animations';
      noAnimStyle.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(noAnimStyle);
      this.showNotification('⏸️ Animations disabled', 'info');
    }
  }

  simulateOffline() {
    // This is a simulation - in a real app you'd use Service Workers
    const originalFetch = window.fetch;
    let isOffline = false;
    
    if (window.fetch === originalFetch) {
      window.fetch = function(...args) {
        return Promise.reject(new Error('Simulated offline mode'));
      };
      isOffline = true;
      this.showNotification('📡 Offline mode simulated', 'warning');
      
      setTimeout(() => {
        window.fetch = originalFetch;
        this.showNotification('📡 Online mode restored', 'success');
      }, 10000);
    }
  }

  showConsole() {
    if (!this.isEnabled) return;
    
    const panel = document.getElementById('developer-panel');
    if (panel) {
      this.switchTab('debug');
      panel.classList.remove('minimized');
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  showNotification(message, type = 'info') {
    // Use the existing UI manager if available
    if (window.app && window.app.ui) {
      window.app.ui.showAlert(message, type);
    } else {
      console.log(`[DEV] ${message}`);
    }
  }

  // Public API for external access
  getStats() {
    return {
      isEnabled: this.isEnabled,
      debugLevel: this.debugLevel,
      logsCount: this.logs.length,
      memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0
    };
  }

  executeCommand(command) {
    try {
      const result = eval(command);
      console.log('Command result:', result);
      return result;
    } catch (error) {
      console.error('Command error:', error);
      return error;
    }
  }
}