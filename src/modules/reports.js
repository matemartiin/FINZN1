export class ReportManager {
  constructor() {
    this.reports = [];
  }

  async generate(data) {
    console.log('📊 Generating report...', data);
    
    // Basic report generation for now
    const report = {
      month: data.month || 'Current',
      summary: 'Informe básico generado',
      recommendations: [
        'Continúa registrando tus gastos',
        'Establece objetivos de ahorro',
        'Revisa tus categorías de gasto'
      ]
    };

    return report;
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