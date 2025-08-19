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
    if (!categories) {
      // Fallback to old method if categories not provided
      return this.generateColors(labels.length);
    }
    
    const colors = [];
    labels.forEach(categoryName => {
      const category = categories.find(cat => cat.name === categoryName);
      if (category) {
        colors.push(category.color);
      } else {
        // Fallback color if category not found
        colors.push('#9ca3af');
      }
    });
    
    return colors;
  }

  generateColors(count) {
    const colors = [
      '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#14b8a6', 
      '#6366f1', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16',
      '#f97316', '#dc2626', '#9ca3af', '#f43f5e', '#7c3aed',
      '#0ea5e9', '#eab308', '#16a34a', '#db2777', '#059669'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    
    return result;
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