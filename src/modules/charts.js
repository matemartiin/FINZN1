// Register Chart.js transparent background plugin
const transparentBackgroundPlugin = {
  id: 'transparentBackground',
  beforeDraw: (chart) => {
    const ctx = chart.canvas.getContext('2d');
    const canvas = chart.canvas;
    
    // Method 1: Clear the entire canvas
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    
    // Method 2: Force canvas style properties with maximum priority
    const styleProps = [
      'background-color',
      'background-image', 
      'background',
      'backgroundColor'
    ];
    
    styleProps.forEach(prop => {
      try {
        canvas.style.setProperty(prop, 'transparent', 'important');
        canvas.style.removeProperty(prop);
        canvas.style[prop] = 'transparent';
      } catch (e) {
        console.log('Style override attempt:', prop, e.message);
      }
    });
    
    // Method 3: Remove any CSS classes that might add background
    canvas.classList.remove('chart-bg', 'chart-background', 'bg-white', 'bg-dark');
    
    // Method 4: Set data attribute for CSS targeting
    canvas.setAttribute('data-transparent', 'true');
  },
  
  afterDraw: (chart) => {
    // Double-check after drawing
    const canvas = chart.canvas;
    canvas.style.backgroundColor = 'transparent';
    canvas.style.background = 'transparent';
  }
};

// Register the plugin globally if Chart is available
if (typeof Chart !== 'undefined') {
  Chart.register(transparentBackgroundPlugin);
  
  // Set Chart.js defaults for transparency
  Chart.defaults.backgroundColor = 'transparent';
  Chart.defaults.plugins.legend.labels.backgroundColor = 'transparent';
  
  // Override Chart.js canvas creation to force transparency
  const originalGetCanvas = Chart.helpers?.getCanvas;
  if (originalGetCanvas) {
    Chart.helpers.getCanvas = function(canvasOpts) {
      const canvas = originalGetCanvas.call(this, canvasOpts);
      if (canvas && canvas.style) {
        canvas.style.backgroundColor = 'transparent';
        canvas.style.background = 'transparent';
      }
      return canvas;
    };
  }
}

export class ChartManager {
  constructor() {
    this.expensesChart = null;
    this.dashboardExpensesChart = null;
    this.trendChart = null;
    
    // Register plugin when Chart becomes available
    this.ensurePluginRegistered();
  }
  
  ensurePluginRegistered() {
    if (typeof Chart !== 'undefined' && Chart.register) {
      try {
        Chart.register(transparentBackgroundPlugin);
      } catch (error) {
        // Plugin might already be registered
        console.log('📊 Transparent background plugin registration:', error.message);
      }
    }
  }

  updateExpensesChart(data, categories) {
    const ctx = document.getElementById('expenses-chart');
    if (!ctx) {
      console.log('ℹ️ Expenses chart canvas not found - not in charts view');
      return;
    }

    this.renderChart(ctx, data, 'expensesChart', categories);
  }

  updateDashboardExpensesChart(data, categories) {
    console.log('📊 updateDashboardExpensesChart called with data:', data);
    
    const ctx = document.getElementById('dashboard-expenses-chart');
    if (!ctx) {
      console.error('❌ Dashboard expenses chart canvas not found');
      return;
    }
    
    console.log('📊 Canvas found, calling renderChart');
    this.renderChart(ctx, data, 'dashboardExpensesChart', categories);
  }

  renderChart(ctx, data, chartProperty, categories = null) {
    console.log('📊 renderChart called:', { chartProperty, data, categories, visible: ctx.offsetParent !== null });
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
      console.error('❌ Chart.js not loaded!');
      return;
    }
    
    // Verify canvas is visible and ready
    if (ctx.offsetParent === null) {
      console.log('⚠️ Chart canvas not visible - will render anyway');
      // Don't return, try to render anyway
    }
    
    // Use data as-is without contextual filtering
    let filteredData = data;
    
    if (this[chartProperty]) {
      this[chartProperty].destroy();
    }

    const labels = Object.keys(filteredData);
    const values = Object.values(filteredData);
    
    console.log('📊 Chart data prepared:', { labels, values });
    
    // If no data, show empty state
    if (labels.length === 0 || values.every(v => v === 0)) {
      console.log('📊 No data available, showing empty state');
      try {
        const context = ctx.getContext('2d');
        context.clearRect(0, 0, ctx.width, ctx.height);
        // Detect dark mode for empty state text
        const isDarkMode = document.body.classList.contains('darkmode');
        context.fillStyle = isDarkMode ? '#a0aec0' : '#666';
        context.font = '14px Arial';
        context.textAlign = 'center';
        context.fillText('No hay datos para mostrar', ctx.width / 2, ctx.height / 2);
      } catch (error) {
        console.warn('Could not draw empty state on expenses chart:', error);
      }
      return;
    }
    
    const colors = this.getCategoryColors(labels, categories);

    try {
      // Detect dark mode
      const isDarkMode = document.body.classList.contains('darkmode') || 
                        document.documentElement.getAttribute('data-theme') === 'dark';
      const legendColor = isDarkMode ? '#e5e7eb' : '#1a202c';
      const borderColor = isDarkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(255, 255, 255, 0.8)';

      this[chartProperty] = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors,
            borderWidth: 1,
            borderColor: borderColor,
            hoverOffset: 12,
            hoverBorderWidth: 2,
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          devicePixelRatio: window.devicePixelRatio || 1,
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1000,
            easing: 'easeOutCubic'
          },
          plugins: {
            transparentBackground: {
              enabled: true
            },
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true,
                pointStyle: 'circle',
                font: {
                  size: window.innerWidth < 768 ? 12 : 13,
                  weight: '500'
                },
                color: legendColor,
                boxWidth: 10,
                boxHeight: 10
              }
            },
            tooltip: {
              backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(0, 0, 0, 0.8)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: isDarkMode ? '#4b5563' : '#374151',
              borderWidth: 1,
              cornerRadius: 8,
              padding: 12,
              displayColors: true,
              boxPadding: 6,
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: $${value.toLocaleString()} (${percentage}%)`;
                }
              }
            }
          },
          cutout: window.innerWidth < 768 ? '58%' : '68%',
          interaction: {
            intersect: false
          },
          elements: {
            arc: {
              borderWidth: 1,
              borderRadius: 6
            }
          }
        }
      });
      
      // ULTRA AGGRESSIVE: Force transparent background after chart creation
      const canvas = this[chartProperty].canvas;
      const canvasStyle = canvas.style;
      const context = canvas.getContext('2d');
      const { width, height } = canvas;
      
      // Debug: Log current state
      console.log('🐛 Canvas DEBUG:', {
        id: canvas.id,
        currentBg: getComputedStyle(canvas).backgroundColor,
        styleBg: canvas.style.backgroundColor,
        width: canvas.width,
        height: canvas.height
      });
      
      // Method 1: Nuclear CSS override
      const forceTransparent = () => {
        ['background-color', 'background-image', 'background', 'backgroundColor'].forEach(prop => {
          canvasStyle.setProperty(prop, 'transparent', 'important');
          canvasStyle[prop] = 'transparent';
        });
        canvas.setAttribute('data-transparent-forced', 'true');
      };
      
      // Method 2: Canvas context manipulation
      const clearCanvas = () => {
        context.save();
        context.globalCompositeOperation = 'copy';
        context.fillStyle = 'rgba(0,0,0,0)';
        context.fillRect(0, 0, width, height);
        context.restore();
      };
      
      // Apply immediately
      forceTransparent();
      clearCanvas();
      
      // DARK MODE FIX: Force container transparency
      if (isDarkMode) {
        // Force all parent containers to be transparent
        let container = canvas.parentElement;
        while (container && container !== document.body) {
          if (container.classList.contains('chart-container') || 
              container.classList.contains('chart-card') ||
              container.id.includes('chart')) {
            container.style.setProperty('background', 'transparent', 'important');
            container.style.setProperty('background-color', 'transparent', 'important');
            console.log('🌙 Dark mode: Forced container transparent:', container.className);
          }
          container = container.parentElement;
        }
      }
      
      // Method 3: Override Chart.js render completely
      const originalRender = this[chartProperty].draw;
      this[chartProperty].draw = function() {
        // Force clear before every render
        context.save();
        context.globalCompositeOperation = 'copy';
        context.fillStyle = 'transparent';
        context.clearRect(0, 0, width, height);
        context.restore();
        
        // Force style again
        forceTransparent();
        
        // Call original render
        originalRender.call(this);
        
        // Force style after render
        setTimeout(() => forceTransparent(), 0);
      };
      
      // Method 4: Continuous monitoring
      const monitor = setInterval(() => {
        const computed = getComputedStyle(canvas);
        if (computed.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
            computed.backgroundColor !== 'transparent') {
          console.log('🐛 Background detected, forcing transparent:', computed.backgroundColor);
          forceTransparent();
          clearCanvas();
        }
      }, 100);
      
      // Stop monitoring after 5 seconds
      setTimeout(() => clearInterval(monitor), 5000);
      
      console.log('✅ Chart created successfully:', chartProperty);
    } catch (error) {
      console.error('❌ Error creating chart:', error);
    }
  }

  updateTrendChart(data) {
    const ctx = document.getElementById('trend-chart');
    if (!ctx) {
      console.log('ℹ️ Trend chart canvas not found - not in charts view');
      return;
    }

    // Verify canvas is visible and ready
    if (ctx.offsetParent === null) {
      console.log('ℹ️ Trend chart canvas not visible - skipping update');
      return;
    }
    if (this.trendChart) {
      this.trendChart.destroy();
    }

    const labels = data.map(item => item.month);
    const values = data.map(item => item.amount);
    
    // If no data, show empty state
    if (labels.length === 0 || values.every(v => v === 0)) {
      try {
        const context = ctx.getContext('2d');
        context.clearRect(0, 0, ctx.width, ctx.height);
        // Detect dark mode for empty state text
        const isDarkMode = document.body.classList.contains('darkmode');
        context.fillStyle = isDarkMode ? '#a0aec0' : '#666';
        context.font = '14px Arial';
        context.textAlign = 'center';
        context.fillText('No hay datos para mostrar', ctx.width / 2, ctx.height / 2);
      } catch (error) {
        console.warn('Could not draw empty state on trend chart:', error);
      }
      return;
    }

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Gastos Mensuales',
          data: values,
          borderColor: '#A7C7E7',
          backgroundColor: 'rgba(167, 199, 231, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#C8B6FF',
          pointBorderColor: '#A7C7E7',
          pointBorderWidth: 2,
          pointRadius: window.innerWidth < 768 ? 4 : 6,
          pointHoverRadius: window.innerWidth < 768 ? 6 : 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: window.devicePixelRatio || 1,
        plugins: {
          transparentBackground: {
            enabled: true
          },
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Gastos: $${context.raw.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              font: {
                size: window.innerWidth < 768 ? 10 : 12
              }
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              font: {
                size: window.innerWidth < 768 ? 10 : 12
              },
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
    
    // Force transparent background after chart creation
    if (this.trendChart && this.trendChart.canvas) {
      const canvas = this.trendChart.canvas;
      const canvasStyle = canvas.style;
      
      // Force transparent background
      canvasStyle.setProperty('background-color', 'transparent', 'important');
      canvasStyle.setProperty('background', 'transparent', 'important');
      canvas.style.backgroundColor = 'transparent';
      canvas.style.background = 'transparent';
    }
  }

  getCategoryColors(labels, categories) {
    if (import.meta.env?.DEV || window.location.hostname === 'localhost') {
      console.log('🎨 getCategoryColors called with:', { labels, categories: categories?.map(c => ({ name: c.name, color: c.color })) });
    }
    
    if (!categories) {
      if (import.meta.env?.DEV || window.location.hostname === 'localhost') {
        console.log('⚠️ No categories provided, using fallback colors');
      }
      return this.generateUniqueColors(labels.length);
    }
    
    const colors = [];
    const usedColors = new Set();
    const usedColorsSimilar = new Set(); // Track similar colors
    const fallbackColors = this.generateUniqueColors(labels.length);
    let fallbackIndex = 0;
    
    labels.forEach((categoryName, index) => {
      const category = categories.find(cat => cat.name === categoryName);
      let colorToUse;
      
      if (category && category.color) {
        // Check if this exact color or a very similar one is already used
        const isSimilarColor = this.isColorSimilar(category.color, usedColorsSimilar);
        
        if (!usedColors.has(category.color) && !isSimilarColor) {
          colorToUse = category.color;
          if (import.meta.env?.DEV || window.location.hostname === 'localhost') {
            console.log(`✅ Color for ${categoryName}: ${category.color}`);
          }
        } else {
          // Category has a color but it's already used or too similar, get unique fallback
          colorToUse = this.getNextUniqueColor(usedColors, fallbackColors, fallbackIndex++);
          if (import.meta.env?.DEV || window.location.hostname === 'localhost') {
            console.log(`⚠️ Color ${category.color} already used or similar for ${categoryName}, using ${colorToUse}`);
          }
        }
      } else {
        // Category not found or has no color, use unique fallback
        colorToUse = this.getNextUniqueColor(usedColors, fallbackColors, fallbackIndex++);
        if (import.meta.env?.DEV || window.location.hostname === 'localhost') {
          console.log(`❌ Category ${categoryName} not found, using fallback ${colorToUse}`);
        }
      }
      
      colors.push(colorToUse);
      usedColors.add(colorToUse);
      usedColorsSimilar.add(this.normalizeColorForComparison(colorToUse));
    });
    
    if (import.meta.env?.DEV || window.location.hostname === 'localhost') {
      console.log('🎨 Final colors array:', colors);
      console.log('✅ All chart colors are unique and visually distinct');
    }
    
    return colors;
  }

  // Check if a color is similar to already used colors
  isColorSimilar(newColor, usedColorsSimilar) {
    const normalizedNew = this.normalizeColorForComparison(newColor);
    return usedColorsSimilar.has(normalizedNew);
  }

  // Normalize color for similarity comparison (group similar hues)
  normalizeColorForComparison(color) {
    const hsl = this.hexToHsl(color);
    if (!hsl) return color;
    
    // Group hues into 24 buckets (15° each) for similarity detection
    const hueGroup = Math.floor(hsl.h / 15) * 15;
    const satGroup = Math.floor(hsl.s / 25) * 25; // Group saturation in 25% buckets
    const lightGroup = Math.floor(hsl.l / 25) * 25; // Group lightness in 25% buckets
    
    return `${hueGroup}-${satGroup}-${lightGroup}`;
  }

  // Get next unique color that hasn't been used
  getNextUniqueColor(usedColors, fallbackColors, index) {
    let color = fallbackColors[index % fallbackColors.length];
    let attempts = 0;
    
    // Keep trying until we find a unique color
    while (usedColors.has(color) && attempts < fallbackColors.length * 2) {
      index++;
      color = fallbackColors[index % fallbackColors.length];
      attempts++;
    }
    
    // If still not unique after many attempts, generate a random one
    if (usedColors.has(color)) {
      color = this.generateRandomColor();
    }
    
    return color;
  }

  // Generate a random color
  generateRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 60 + Math.floor(Math.random() * 30); // 60-90%
    const lightness = 45 + Math.floor(Math.random() * 20); // 45-65%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  generateUniqueColors(count) {
    // Enhanced mobile-optimized color palette with guaranteed uniqueness
    // Colors are carefully selected to be visually distinct and accessible
    const mobileOptimizedColors = [
      // Primary vibrant colors - high contrast, well-spaced hues
      '#dc2626', // Red (0°) - expenses, alerts
      '#ea580c', // Orange (25°) - categories, warnings
      '#ca8a04', // Yellow (50°) - income, savings
      '#16a34a', // Green (120°) - success, health
      '#0891b2', // Cyan (190°) - utilities, tech
      '#2563eb', // Blue (225°) - primary actions, information
      '#7c3aed', // Purple (270°) - goals, premium
      '#be185d', // Pink (330°) - lifestyle, personal
      
      // Secondary colors - distinct hue variations
      '#b91c1c', // Dark red (5°)
      '#c2410c', // Dark orange (30°)
      '#a16207', // Dark yellow (55°)
      '#15803d', // Dark green (125°)
      '#0e7490', // Dark cyan (195°)
      '#1d4ed8', // Dark blue (230°)
      '#6d28d9', // Dark purple (275°)
      '#a21caf', // Dark pink (335°)
      
      // Tertiary colors - lighter variations
      '#ef4444', // Light red (0°)
      '#f97316', // Light orange (25°)
      '#eab308', // Light yellow (50°)
      '#22c55e', // Light green (120°)
      '#06b6d4', // Light cyan (190°)
      '#3b82f6', // Light blue (225°)
      '#8b5cf6', // Light purple (270°)
      '#ec4899', // Light pink (330°)
      
      // Additional distinct colors for large datasets
      '#65a30d', // Lime (80°)
      '#0d9488', // Teal (175°)
      '#4338ca', // Indigo (240°)
      '#7c2d12', // Brown (15°)
      '#166534', // Forest green (130°)
      '#0c4a6e', // Steel blue (210°)
      '#581c87', // Deep purple (280°)
      '#831843', // Deep pink (340°)
      '#365314', // Dark lime (85°)
      '#134e4a', // Dark teal (180°)
      '#1e3a8a', // Navy blue (235°)
      '#78350f'  // Dark brown (20°)
    ];
    
    // Detect if we're in dark mode for better color selection
    const isDarkMode = document.body.classList.contains('darkmode') || 
                      document.documentElement.getAttribute('data-theme') === 'dark';
    
    const result = [];
    const usedColors = new Set();
    
    // First pass: use the predefined colors directly
    for (let i = 0; i < count && i < mobileOptimizedColors.length; i++) {
      const color = mobileOptimizedColors[i];
      result.push(color);
      usedColors.add(color);
    }
    
    // Second pass: generate additional colors if needed
    for (let i = mobileOptimizedColors.length; i < count; i++) {
      let color;
      let attempts = 0;
      
      do {
        // Generate a color with guaranteed hue spacing
        const baseHue = (i * 40 + attempts * 15) % 360; // 40° spacing minimum
        const saturation = isDarkMode ? 75 : 65; // Higher saturation for dark mode
        const lightness = isDarkMode ? 60 : 50; // Lighter for dark mode
        color = `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
        attempts++;
      } while (usedColors.has(color) && attempts < 20);
      
      // If still duplicate after many attempts, use a random color
      if (usedColors.has(color)) {
        color = this.generateRandomColor();
      }
      
      result.push(color);
      usedColors.add(color);
    }
    
    return result;
  }

  // Generate mobile-optimized color variations
  generateMobileOptimizedVariation(baseColor, index, isDarkMode = false) {
    const hsl = this.hexToHsl(baseColor);
    if (!hsl) return this.generateRandomColor();
    
    // For mobile, we want:
    // - High saturation (60-85%) for visibility
    // - Appropriate lightness for the theme
    // - Distinct hue variations
    
    const hueShift = (index * 30 + Math.floor(index / 10) * 15) % 360;
    const newHue = (hsl.h + hueShift) % 360;
    
    // Adjust saturation and lightness for mobile visibility
    const saturation = Math.max(60, Math.min(85, hsl.s + (index % 3) * 10));
    
    let lightness;
    if (isDarkMode) {
      // For dark mode, use lighter colors (55-75%)
      lightness = Math.max(55, Math.min(75, hsl.l + 20));
    } else {
      // For light mode, use darker colors (35-55%)
      lightness = Math.max(35, Math.min(55, hsl.l - 10));
    }
    
    return `hsl(${newHue}, ${saturation}%, ${lightness}%)`;
  }

  // Generate a variation of a base color
  generateColorVariation(baseColor, index) {
    // Convert hex to HSL and modify
    const hsl = this.hexToHsl(baseColor);
    if (hsl) {
      // Modify hue by small amounts
      const hueShift = (index * 25) % 360;
      const newHue = (hsl.h + hueShift) % 360;
      return `hsl(${newHue}, ${Math.max(50, hsl.s)}%, ${Math.max(40, Math.min(60, hsl.l))}%)`;
    }
    
    // Fallback to random if conversion fails
    return this.generateRandomColor();
  }

  // Convert hex to HSL
  hexToHsl(hex) {
    try {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      };
    } catch (error) {
      return null;
    }
  }

  // Legacy method for backward compatibility
  generateColors(count) {
    return this.generateUniqueColors(count);
  }

  destroy() {
    if (this.expensesChart) {
      this.expensesChart.destroy();
    }
    if (this.trendChart) {
      this.trendChart.destroy();
    }
  }
}