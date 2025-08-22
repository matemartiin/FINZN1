export class ChartManager {
  constructor() {
    this.expensesChart = null;
    this.dashboardExpensesChart = null;
    this.trendChart = null;
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
        context.fillStyle = '#666';
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
      const isDarkMode = document.body.classList.contains('darkmode');
      const legendColor = isDarkMode ? '#e5e7eb' : '#374151';
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
        context.fillStyle = '#666';
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
    const fallbackColors = this.generateUniqueColors(labels.length);
    let fallbackIndex = 0;
    
    labels.forEach(categoryName => {
      const category = categories.find(cat => cat.name === categoryName);
      let colorToUse;
      
      if (category && category.color) {
        // Check if this color is already used
        if (!usedColors.has(category.color)) {
          colorToUse = category.color;
          if (import.meta.env?.DEV || window.location.hostname === 'localhost') {
            console.log(`✅ Color for ${categoryName}: ${category.color}`);
          }
        } else {
          // Category has a color but it's already used, get unique fallback
          colorToUse = this.getNextUniqueColor(usedColors, fallbackColors, fallbackIndex++);
          if (import.meta.env?.DEV || window.location.hostname === 'localhost') {
            console.log(`⚠️ Color ${category.color} already used for ${categoryName}, using ${colorToUse}`);
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
    });
    
    if (import.meta.env?.DEV || window.location.hostname === 'localhost') {
      console.log('🎨 Final colors array:', colors);
      console.log('✅ All chart colors are unique');
    }
    
    return colors;
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
    // Mobile-optimized color palette with high contrast and accessibility
    // These colors work well on both light and dark backgrounds
    const mobileOptimizedColors = [
      // Primary vibrant colors - high contrast
      '#dc2626', // Red - expenses, alerts
      '#2563eb', // Blue - income, primary actions  
      '#16a34a', // Green - savings, success
      '#ea580c', // Orange - categories, warnings
      '#7c3aed', // Purple - goals, premium
      '#0891b2', // Cyan - utilities, tech
      '#be185d', // Pink - lifestyle, personal
      '#65a30d', // Lime - health, food
      '#0d9488', // Teal - transport, travel
      '#7c2d12', // Brown - education, work
      
      // Secondary colors - good mobile visibility
      '#1d4ed8', // Dark blue
      '#be123c', // Dark red
      '#166534', // Dark green
      '#9333ea', // Bright purple
      '#c2410c', // Dark orange
      '#0c4a6e', // Steel blue
      '#831843', // Deep pink
      '#365314', // Dark lime
      '#134e4a', // Dark teal
      '#451a03', // Deep brown
      
      // Tertiary colors - extended palette
      '#991b1b', // Darker red
      '#1e3a8a', // Darker blue
      '#14532d', // Darker green
      '#92400e', // Darker orange
      '#581c87', // Darker purple
      '#164e63', // Darker cyan
      '#9d174d', // Darker pink
      '#4d7c0f', // Darker lime
      '#115e59', // Darker teal
      '#78350f'  // Medium brown
    ];
    
    // Detect if we're in dark mode for better color selection
    const isDarkMode = document.body.classList.contains('darkmode') || 
                      document.documentElement.getAttribute('data-theme') === 'dark';
    
    const result = [];
    const usedColors = new Set();
    
    for (let i = 0; i < count; i++) {
      let color;
      
      if (i < mobileOptimizedColors.length) {
        color = mobileOptimizedColors[i];
        
        // If we've already used this color, generate a variation
        if (usedColors.has(color)) {
          color = this.generateMobileOptimizedVariation(color, i, isDarkMode);
        }
      } else {
        // Generate additional colors if needed
        color = this.generateMobileOptimizedVariation(
          mobileOptimizedColors[i % mobileOptimizedColors.length], 
          i, 
          isDarkMode
        );
      }
      
      // Ensure uniqueness
      let attempts = 0;
      while (usedColors.has(color) && attempts < 10) {
        color = this.generateMobileOptimizedVariation(color, i + attempts, isDarkMode);
        attempts++;
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