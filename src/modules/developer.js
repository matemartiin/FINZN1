export class DeveloperManager {
  constructor() {
    this.isDeveloperMode = false;
    this.currentUser = null;
    this.devPanel = null;
    this.logs = [];
    this.maxLogs = 100;
  }

  init(currentUser) {
    this.currentUser = currentUser;
    
    // Only enable developer mode for user "mateo"
    if (currentUser === 'mateo') {
      this.isDeveloperMode = true;
      this.createDeveloperPanel();
      this.setupDeveloperFeatures();
      this.addDeveloperStyles();
      console.log('🔧 Developer mode activated for user:', currentUser);
    }
  }

  createDeveloperPanel() {
    // Create developer panel HTML
    const devPanelHTML = `
      <div id="developer-panel" class="developer-panel hidden">
        <div class="dev-panel-header">
          <h3>🔧 Developer Mode</h3>
          <div class="dev-panel-controls">
            <button id="dev-minimize" class="dev-btn dev-btn-sm">−</button>
            <button id="dev-close" class="dev-btn dev-btn-sm">×</button>
          </div>
        </div>
        
        <div class="dev-panel-content">
          <div class="dev-tabs">
            <button class="dev-tab active" data-tab="console">Console</button>
            <button class="dev-tab" data-tab="data">Data</button>
            <button class="dev-tab" data-tab="performance">Performance</button>
            <button class="dev-tab" data-tab="tools">Tools</button>
          </div>
          
          <!-- Console Tab -->
          <div id="dev-console" class="dev-tab-content active">
            <div class="dev-console-header">
              <button id="clear-console" class="dev-btn dev-btn-sm">Clear</button>
              <button id="export-logs" class="dev-btn dev-btn-sm">Export</button>
            </div>
            <div id="dev-console-output" class="dev-console-output"></div>
            <div class="dev-console-input">
              <input type="text" id="dev-console-command" placeholder="Enter JavaScript command..." />
              <button id="execute-command" class="dev-btn">Execute</button>
            </div>
          </div>
          
          <!-- Data Tab -->
          <div id="dev-data" class="dev-tab-content">
            <div class="dev-data-controls">
              <button id="export-all-data" class="dev-btn">Export All Data</button>
              <button id="clear-all-data" class="dev-btn dev-btn-danger">Clear All Data</button>
              <button id="generate-test-data" class="dev-btn">Generate Test Data</button>
            </div>
            <div class="dev-data-viewer">
              <h4>Current User Data:</h4>
              <pre id="dev-data-display"></pre>
            </div>
          </div>
          
          <!-- Performance Tab -->
          <div id="dev-performance" class="dev-tab-content">
            <div class="dev-performance-metrics">
              <div class="dev-metric">
                <div class="dev-metric-label">Memory Usage</div>
                <div id="memory-usage" class="dev-metric-value">-</div>
              </div>
              <div class="dev-metric">
                <div class="dev-metric-label">Load Time</div>
                <div id="load-time" class="dev-metric-value">-</div>
              </div>
              <div class="dev-metric">
                <div class="dev-metric-label">API Calls</div>
                <div id="api-calls" class="dev-metric-value">0</div>
              </div>
            </div>
            <button id="run-performance-test" class="dev-btn">Run Performance Test</button>
          </div>
          
          <!-- Tools Tab -->
          <div id="dev-tools" class="dev-tab-content">
            <div class="dev-tools-grid">
              <button id="simulate-error" class="dev-btn">Simulate Error</button>
              <button id="test-notifications" class="dev-btn">Test Notifications</button>
              <button id="toggle-debug-mode" class="dev-btn">Toggle Debug Mode</button>
              <button id="inspect-state" class="dev-btn">Inspect App State</button>
              <button id="force-save" class="dev-btn">Force Save Data</button>
              <button id="reload-app" class="dev-btn">Reload App</button>
            </div>
            
            <div class="dev-feature-toggles">
              <h4>Feature Toggles:</h4>
              <label class="dev-toggle">
                <input type="checkbox" id="debug-charts" />
                <span>Debug Charts</span>
              </label>
              <label class="dev-toggle">
                <input type="checkbox" id="verbose-logging" />
                <span>Verbose Logging</span>
              </label>
              <label class="dev-toggle">
                <input type="checkbox" id="mock-api" />
                <span>Mock API Responses</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Developer Toggle Button -->
      <button id="dev-toggle" class="dev-toggle-btn" title="Developer Panel">
        🔧
      </button>
    `;

    // Add to body
    document.body.insertAdjacentHTML('beforeend', devPanelHTML);
    
    this.devPanel = document.getElementById('developer-panel');
    this.setupDeveloperEvents();
  }

  addDeveloperStyles() {
    const styles = `
      <style id="developer-styles">
        .developer-panel {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 400px;
          height: 500px;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          z-index: 10000;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #fff;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          resize: both;
          overflow: hidden;
        }
        
        .developer-panel.minimized {
          height: 40px;
        }
        
        .developer-panel.minimized .dev-panel-content {
          display: none;
        }
        
        .dev-panel-header {
          background: #2d2d2d;
          padding: 8px 12px;
          border-bottom: 1px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: move;
        }
        
        .dev-panel-header h3 {
          margin: 0;
          font-size: 14px;
          color: #00ff88;
        }
        
        .dev-panel-controls {
          display: flex;
          gap: 4px;
        }
        
        .dev-btn {
          background: #333;
          border: 1px solid #555;
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
        }
        
        .dev-btn:hover {
          background: #444;
        }
        
        .dev-btn-sm {
          padding: 2px 6px;
          font-size: 10px;
        }
        
        .dev-btn-danger {
          background: #dc2626;
          border-color: #dc2626;
        }
        
        .dev-btn-danger:hover {
          background: #ef4444;
        }
        
        .dev-panel-content {
          height: calc(100% - 40px);
          display: flex;
          flex-direction: column;
        }
        
        .dev-tabs {
          display: flex;
          background: #2d2d2d;
          border-bottom: 1px solid #333;
        }
        
        .dev-tab {
          background: none;
          border: none;
          color: #ccc;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 11px;
          border-bottom: 2px solid transparent;
        }
        
        .dev-tab.active {
          color: #00ff88;
          border-bottom-color: #00ff88;
        }
        
        .dev-tab-content {
          flex: 1;
          padding: 12px;
          overflow-y: auto;
          display: none;
        }
        
        .dev-tab-content.active {
          display: block;
        }
        
        .dev-console-output {
          background: #000;
          border: 1px solid #333;
          height: 200px;
          overflow-y: auto;
          padding: 8px;
          margin-bottom: 8px;
          font-family: 'Courier New', monospace;
          font-size: 11px;
        }
        
        .dev-console-input {
          display: flex;
          gap: 4px;
        }
        
        .dev-console-input input {
          flex: 1;
          background: #333;
          border: 1px solid #555;
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 11px;
        }
        
        .dev-console-header {
          display: flex;
          gap: 4px;
          margin-bottom: 8px;
        }
        
        .dev-data-controls {
          display: flex;
          gap: 4px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        
        .dev-data-viewer pre {
          background: #000;
          border: 1px solid #333;
          padding: 8px;
          border-radius: 4px;
          overflow: auto;
          max-height: 300px;
          font-size: 10px;
        }
        
        .dev-performance-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .dev-metric {
          background: #2d2d2d;
          padding: 8px;
          border-radius: 4px;
          text-align: center;
        }
        
        .dev-metric-label {
          font-size: 10px;
          color: #ccc;
          margin-bottom: 4px;
        }
        
        .dev-metric-value {
          font-size: 14px;
          color: #00ff88;
          font-weight: bold;
        }
        
        .dev-tools-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .dev-feature-toggles {
          border-top: 1px solid #333;
          padding-top: 12px;
        }
        
        .dev-feature-toggles h4 {
          margin: 0 0 8px 0;
          font-size: 12px;
          color: #00ff88;
        }
        
        .dev-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
          cursor: pointer;
        }
        
        .dev-toggle input {
          margin: 0;
        }
        
        .dev-toggle-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #1a1a1a;
          border: 2px solid #00ff88;
          color: #00ff88;
          font-size: 20px;
          cursor: pointer;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0,255,136,0.3);
        }
        
        .dev-toggle-btn:hover {
          background: #2d2d2d;
          transform: scale(1.1);
        }
        
        .dev-log-entry {
          margin-bottom: 4px;
          padding: 2px 0;
          border-bottom: 1px solid #222;
        }
        
        .dev-log-timestamp {
          color: #666;
          font-size: 10px;
        }
        
        .dev-log-level {
          font-weight: bold;
          margin: 0 4px;
        }
        
        .dev-log-level.error { color: #ff4444; }
        .dev-log-level.warn { color: #ffaa00; }
        .dev-log-level.info { color: #4488ff; }
        .dev-log-level.debug { color: #888; }
        
        .dev-log-message {
          color: #fff;
        }
        
        /* Hide developer features for non-developer users */
        body:not(.developer-mode) .developer-panel,
        body:not(.developer-mode) .dev-toggle-btn {
          display: none !important;
        }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }

  setupDeveloperEvents() {
    // Toggle panel
    document.getElementById('dev-toggle').addEventListener('click', () => {
      this.devPanel.classList.toggle('hidden');
    });

    // Close panel
    document.getElementById('dev-close').addEventListener('click', () => {
      this.devPanel.classList.add('hidden');
    });

    // Minimize panel
    document.getElementById('dev-minimize').addEventListener('click', () => {
      this.devPanel.classList.toggle('minimized');
    });

    // Tab switching
    document.querySelectorAll('.dev-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });

    // Console commands
    document.getElementById('execute-command').addEventListener('click', () => {
      this.executeCommand();
    });

    document.getElementById('dev-console-command').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.executeCommand();
      }
    });

    document.getElementById('clear-console').addEventListener('click', () => {
      this.clearConsole();
    });

    document.getElementById('export-logs').addEventListener('click', () => {
      this.exportLogs();
    });

    // Data tools
    document.getElementById('export-all-data').addEventListener('click', () => {
      this.exportAllData();
    });

    document.getElementById('clear-all-data').addEventListener('click', () => {
      this.clearAllData();
    });

    document.getElementById('generate-test-data').addEventListener('click', () => {
      this.generateTestData();
    });

    // Performance tools
    document.getElementById('run-performance-test').addEventListener('click', () => {
      this.runPerformanceTest();
    });

    // Developer tools
    document.getElementById('simulate-error').addEventListener('click', () => {
      this.simulateError();
    });

    document.getElementById('test-notifications').addEventListener('click', () => {
      this.testNotifications();
    });

    document.getElementById('toggle-debug-mode').addEventListener('click', () => {
      this.toggleDebugMode();
    });

    document.getElementById('inspect-state').addEventListener('click', () => {
      this.inspectAppState();
    });

    document.getElementById('force-save').addEventListener('click', () => {
      this.forceSave();
    });

    document.getElementById('reload-app').addEventListener('click', () => {
      this.reloadApp();
    });

    // Make panel draggable
    this.makeDraggable();
  }

  setupDeveloperFeatures() {
    // Add developer class to body
    document.body.classList.add('developer-mode');
    
    // Override console methods to capture logs
    this.interceptConsole();
    
    // Add performance monitoring
    this.startPerformanceMonitoring();
    
    // Add keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Initial data display
    this.updateDataDisplay();
  }

  interceptConsole() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    console.log = (...args) => {
      this.addLog('info', args.join(' '));
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      this.addLog('error', args.join(' '));
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      this.addLog('warn', args.join(' '));
      originalWarn.apply(console, args);
    };

    console.info = (...args) => {
      this.addLog('info', args.join(' '));
      originalInfo.apply(console, args);
    };
  }

  addLog(level, message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp,
      level,
      message
    };

    this.logs.push(logEntry);
    
    // Keep only last 100 logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.updateConsoleDisplay();
  }

  updateConsoleDisplay() {
    const output = document.getElementById('dev-console-output');
    if (!output) return;

    output.innerHTML = this.logs.map(log => `
      <div class="dev-log-entry">
        <span class="dev-log-timestamp">${log.timestamp}</span>
        <span class="dev-log-level ${log.level}">[${log.level.toUpperCase()}]</span>
        <span class="dev-log-message">${log.message}</span>
      </div>
    `).join('');

    output.scrollTop = output.scrollHeight;
  }

  executeCommand() {
    const input = document.getElementById('dev-console-command');
    const command = input.value.trim();
    
    if (!command) return;

    try {
      // Add command to logs
      this.addLog('debug', `> ${command}`);
      
      // Execute command
      const result = eval(command);
      
      // Add result to logs
      this.addLog('info', `< ${JSON.stringify(result, null, 2)}`);
      
      input.value = '';
    } catch (error) {
      this.addLog('error', `Error: ${error.message}`);
    }
  }

  clearConsole() {
    this.logs = [];
    this.updateConsoleDisplay();
  }

  exportLogs() {
    const logsText = this.logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    this.downloadFile(logsText, 'finzn-dev-logs.txt', 'text/plain');
  }

  updateDataDisplay() {
    const display = document.getElementById('dev-data-display');
    if (!display) return;

    try {
      const userData = localStorage.getItem(`finzn-data-${this.currentUser}`);
      const parsedData = userData ? JSON.parse(userData) : {};
      display.textContent = JSON.stringify(parsedData, null, 2);
    } catch (error) {
      display.textContent = `Error loading data: ${error.message}`;
    }
  }

  exportAllData() {
    try {
      const userData = localStorage.getItem(`finzn-data-${this.currentUser}`);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.downloadFile(userData || '{}', `finzn-data-${this.currentUser}-${timestamp}.json`, 'application/json');
      this.addLog('info', 'Data exported successfully');
    } catch (error) {
      this.addLog('error', `Export failed: ${error.message}`);
    }
  }

  clearAllData() {
    if (confirm('⚠️ This will delete ALL data for the current user. Are you sure?')) {
      localStorage.removeItem(`finzn-data-${this.currentUser}`);
      this.updateDataDisplay();
      this.addLog('warn', 'All user data cleared');
      
      // Reload app to reflect changes
      setTimeout(() => window.location.reload(), 1000);
    }
  }

  generateTestData() {
    try {
      const testData = {
        expenses: {
          '2025-01': [
            {
              id: 'test-1',
              description: 'Test Expense 1',
              amount: 1500,
              category: 'Comida',
              date: '2025-01',
              createdAt: new Date().toISOString()
            },
            {
              id: 'test-2',
              description: 'Test Expense 2',
              amount: 800,
              category: 'Transporte',
              date: '2025-01',
              createdAt: new Date().toISOString()
            }
          ]
        },
        income: {
          '2025-01': {
            fixed: 50000,
            extra: 5000
          }
        },
        extraIncomes: {
          '2025-01': [
            {
              id: 'extra-test-1',
              description: 'Test Extra Income',
              amount: 5000,
              category: 'Freelance',
              date: '2025-01',
              createdAt: new Date().toISOString()
            }
          ]
        },
        goals: [
          {
            id: 'goal-test-1',
            name: 'Test Savings Goal',
            target: 100000,
            current: 25000,
            createdAt: new Date().toISOString()
          }
        ]
      };

      localStorage.setItem(`finzn-data-${this.currentUser}`, JSON.stringify(testData));
      this.updateDataDisplay();
      this.addLog('info', 'Test data generated successfully');
      
      // Reload app to reflect changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      this.addLog('error', `Failed to generate test data: ${error.message}`);
    }
  }

  startPerformanceMonitoring() {
    // Monitor memory usage
    setInterval(() => {
      if (performance.memory) {
        const memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        const memoryElement = document.getElementById('memory-usage');
        if (memoryElement) {
          memoryElement.textContent = `${memoryUsage} MB`;
        }
      }
    }, 2000);

    // Monitor load time
    window.addEventListener('load', () => {
      const loadTime = Math.round(performance.now());
      const loadTimeElement = document.getElementById('load-time');
      if (loadTimeElement) {
        loadTimeElement.textContent = `${loadTime} ms`;
      }
    });
  }

  runPerformanceTest() {
    this.addLog('info', 'Running performance test...');
    
    const start = performance.now();
    
    // Simulate some heavy operations
    for (let i = 0; i < 100000; i++) {
      Math.random() * Math.random();
    }
    
    const end = performance.now();
    const duration = Math.round(end - start);
    
    this.addLog('info', `Performance test completed in ${duration}ms`);
  }

  simulateError() {
    try {
      throw new Error('This is a simulated error for testing purposes');
    } catch (error) {
      this.addLog('error', `Simulated error: ${error.message}`);
      console.error('Simulated error:', error);
    }
  }

  testNotifications() {
    if (window.app && window.app.ui) {
      window.app.ui.showAlert('This is a test notification from developer mode', 'info');
      this.addLog('info', 'Test notification sent');
    } else {
      this.addLog('error', 'App UI not available for notification test');
    }
  }

  toggleDebugMode() {
    const isDebug = document.body.classList.toggle('debug-mode');
    this.addLog('info', `Debug mode ${isDebug ? 'enabled' : 'disabled'}`);
  }

  inspectAppState() {
    if (window.app) {
      const state = {
        currentUser: window.app.auth?.getCurrentUser(),
        currentMonth: window.app.currentMonth,
        isDeveloperMode: this.isDeveloperMode,
        theme: window.app.theme?.getCurrentTheme()
      };
      
      this.addLog('info', `App State: ${JSON.stringify(state, null, 2)}`);
    } else {
      this.addLog('error', 'App instance not available');
    }
  }

  forceSave() {
    if (window.app && window.app.data) {
      window.app.data.saveUserData();
      this.addLog('info', 'Data force saved');
      this.updateDataDisplay();
    } else {
      this.addLog('error', 'App data manager not available');
    }
  }

  reloadApp() {
    this.addLog('info', 'Reloading application...');
    setTimeout(() => window.location.reload(), 500);
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl + Shift + D to toggle developer panel
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        this.devPanel.classList.toggle('hidden');
      }
      
      // Ctrl + Shift + C to clear console
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        this.clearConsole();
      }
    });
  }

  switchTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.dev-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.dev-tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`dev-${tabName}`).classList.add('active');
    
    // Update data display when switching to data tab
    if (tabName === 'data') {
      this.updateDataDisplay();
    }
  }

  makeDraggable() {
    const header = document.querySelector('.dev-panel-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    header.addEventListener('mousedown', (e) => {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      
      if (e.target === header || header.contains(e.target)) {
        isDragging = true;
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        xOffset = currentX;
        yOffset = currentY;
        
        this.devPanel.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  destroy() {
    // Clean up developer mode
    document.body.classList.remove('developer-mode');
    const devPanel = document.getElementById('developer-panel');
    const devToggle = document.getElementById('dev-toggle');
    const devStyles = document.getElementById('developer-styles');
    
    if (devPanel) devPanel.remove();
    if (devToggle) devToggle.remove();
    if (devStyles) devStyles.remove();
  }
}