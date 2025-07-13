export class ChartManager {
  constructor() {
    this.expensesChart = null;
    this.trendChart = null;
  }

  updateExpensesChart(data) {
    const ctx = document.getElementById('expenses-chart');
    if (!ctx) return;

    if (this.expensesChart) {
      this.expensesChart.destroy();
    }

    const labels = Object.keys(data);
    const values = Object.values(data);
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
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12
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
        cutout: '60%'
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