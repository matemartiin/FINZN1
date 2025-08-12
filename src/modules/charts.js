export class ChartManager {
  constructor() {
    this.expensesChart = null;
    this.trendChart = null;
  }

  updateExpensesChart(data) {
    const ctx = document.getElementById('expenses-chart');
    if (!ctx) {
      console.log('ℹ️ Expenses chart canvas not found - not in charts view');
      return;
    }

    // Verify canvas is visible and ready
    if (ctx.offsetParent === null) {
      console.log('ℹ️ Expenses chart canvas not visible - skipping update');
      return;
    }
    
    // Apply category filter if available
    let filteredData = data;
    if (window.app?.contextualBar) {
      const categoryFilter = window.app.contextualBar.getCurrentCategory();
      if (categoryFilter !== 'all') {
        filteredData = {};
        if (data[categoryFilter]) {
          filteredData[categoryFilter] = data[categoryFilter];
        }
      }
    }
    
    if (this.expensesChart) {
      this.expensesChart.destroy();
    }

    const labels = Object.keys(filteredData);
    const values = Object.values(filteredData);
    
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
        console.warn('Could not draw empty state on expenses chart:', error);
      }
      return;
    }
    
    const colors = this.generateColors(labels.length);

    this.expensesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: window.devicePixelRatio || 1,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: window.innerWidth < 768 ? 11 : 12
              }
            }
          },
          tooltip: {
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
        cutout: window.innerWidth < 768 ? '50%' : '60%'
      }
    });
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

  generateColors(count) {
    const colors = [
      '#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981',
      '#6b7280', '#9ca3af', '#f97316', '#06b6d4', '#84cc16'
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