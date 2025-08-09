// Security utilities
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(match) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[match];
  });
}

function sanitizeHTML(html) {
  // Allow only safe formatting tags
  const allowedTags = ['strong', 'em', 'p', 'br', 'ul', 'ol', 'li', 'h3', 'h4', 'h5', 'div'];
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // Remove all script tags and dangerous elements
  const dangerousElements = div.querySelectorAll('script, iframe, object, embed, style');
  dangerousElements.forEach(el => el.remove());
  
  const allElements = div.querySelectorAll('*');
  allElements.forEach(el => {
    // Remove all event handlers
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on') || attr.name === 'href' || attr.name === 'src') {
        el.removeAttribute(attr.name);
      }
    });
    
    // Remove non-allowed tags but keep content
    if (!allowedTags.includes(el.tagName.toLowerCase())) {
      el.replaceWith(...el.childNodes);
    }
  });
  
  return div.innerHTML;
}

export class ReportManager {
  constructor() {
    this.reports = [];
  }

  async generateAIReport(data, focus, questions) {
    console.log('🤖 Generating AI report with data:', data);
    
    try {
      // Prepare comprehensive prompt for AI
      const prompt = this.buildAIPrompt(data, focus, questions);
      
      console.log('🤖 Sending request to Gemini via serverless...');
      
      const response = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          config: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
          }
        })
      });

      if (!response.ok) {
        console.error('❌ Gemini function error:', response.status, response.statusText);
        return this.generateEnhancedFallbackReport(data, focus, questions);
      }

      const data_response = await response.json();
      console.log('✅ Gemini response received via serverless');

      if (data_response.error) {
        console.warn('⚠️ Gemini function error:', data_response.error);
        return this.generateEnhancedFallbackReport(data, focus, questions);
      }

      const aiContent = data_response.text || '';
      
      if (!aiContent.trim()) {
        console.warn('⚠️ Empty AI response, using fallback');
        return this.generateEnhancedFallbackReport(data, focus, questions);
      }

      // Format AI response with additional data
      return this.formatAIReport(aiContent, data, focus, questions);

    } catch (error) {
      console.error('❌ Error generating AI report:', error);
      return this.generateEnhancedFallbackReport(data, focus, questions);
    }
  }

  buildAIPrompt(data, focus, questions) {
    const balance = data.totalIncome - data.totalExpenses;
    const savingsRate = data.totalIncome > 0 ? ((balance / data.totalIncome) * 100).toFixed(1) : 0;
    
    // Get top categories
    const topCategories = Object.entries(data.categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    let prompt = `Eres un experto asesor financiero personal. Analiza los siguientes datos financieros y genera un informe completo y personalizado en español.

DATOS FINANCIEROS:
- Período: ${this.getPeriodText(data.period)} (${data.months} meses)
- Ingresos Totales: $${data.totalIncome.toLocaleString()}
- Gastos Totales: $${data.totalExpenses.toLocaleString()}
- Balance: $${balance.toLocaleString()}
- Tasa de Ahorro: ${savingsRate}%

GASTOS POR CATEGORÍA:`;

    topCategories.forEach(([category, amount]) => {
      const percentage = ((amount / data.totalExpenses) * 100).toFixed(1);
      prompt += `\n- ${category}: $${amount.toLocaleString()} (${percentage}%)`;
    });

    prompt += `\n\nOBJETIVOS DE AHORRO: ${data.goals.length} objetivos activos`;
    prompt += `\nLÍMITES DE GASTO: ${data.spendingLimits.length} límites configurados`;

    prompt += `\n\nENFOQUE DEL ANÁLISIS: ${focus}`;

    if (questions && questions.trim()) {
      prompt += `\n\nPREGUNTAS ESPECÍFICAS DEL USUARIO: "${questions}"`;
    }

    prompt += `\n\nGenera un informe financiero completo que incluya:

1. **RESUMEN EJECUTIVO**: Análisis general de la situación financiera
2. **ANÁLISIS DETALLADO**: 
   - Evaluación de ingresos y gastos
   - Análisis de patrones de gasto por categoría
   - Evaluación de la tasa de ahorro
3. **FORTALEZAS IDENTIFICADAS**: Aspectos positivos del manejo financiero
4. **ÁREAS DE MEJORA**: Problemas o oportunidades detectadas
5. **RECOMENDACIONES ESPECÍFICAS**: 
   - Acciones concretas para mejorar las finanzas
   - Estrategias de ahorro personalizadas
   - Optimización de gastos por categoría
6. **PLAN DE ACCIÓN**: Pasos específicos a seguir en los próximos 30, 60 y 90 días
7. **RESPUESTA A PREGUNTAS**: Si hay preguntas específicas, respóndelas detalladamente

Usa un tono profesional pero accesible. Incluye números específicos y porcentajes. Sé constructivo y motivador. Máximo 1500 palabras.`;

    return prompt;
  }

  formatAIReport(aiContent, data, focus, questions) {
    const balance = data.totalIncome - data.totalExpenses;
    const savingsRate = data.totalIncome > 0 ? ((balance / data.totalIncome) * 100).toFixed(1) : 0;
    
    // Add header with key metrics
    let formattedReport = `
      <div class="report-header">
        <h3>📊 Informe Financiero Personalizado</h3>
        <div class="report-metrics">
          <div class="metric">
            <span class="metric-label">Período:</span>
            <span class="metric-value">${this.getPeriodText(data.period)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Balance:</span>
            <span class="metric-value ${balance >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(balance)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Tasa de Ahorro:</span>
            <span class="metric-value">${savingsRate}%</span>
          </div>
        </div>
      </div>
      
      <div class="ai-content">
        ${this.formatAIText(aiContent)}
      </div>
    `;

    return formattedReport;
  }

  formatAIText(text) {
    // First escape HTML, then convert markdown-like formatting to safe HTML
    const escaped = escapeHTML(text);
    const formatted = escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^(\d+\.\s.*$)/gm, '<div class="numbered-item">$1</div>')
      .replace(/^-\s(.*)$/gm, '<div class="bullet-item">• $1</div>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
    
    // Sanitize the result to ensure only safe tags remain
    return sanitizeHTML(formatted);
  }

  generateEnhancedFallbackReport(data, focus, questions) {
    console.log('🔄 Generating enhanced fallback report');
    
    const balance = data.totalIncome - data.totalExpenses;
    const savingsRate = data.totalIncome > 0 ? ((balance / data.totalIncome) * 100).toFixed(1) : 0;
    
    // Get top categories
    const topCategories = Object.entries(data.categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    let report = `
      <div class="report-header">
        <h3>📊 Informe Financiero Personalizado</h3>
        <div class="report-metrics">
          <div class="metric">
            <span class="metric-label">Período:</span>
            <span class="metric-value">${this.getPeriodText(data.period)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Balance:</span>
            <span class="metric-value ${balance >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(balance)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Tasa de Ahorro:</span>
            <span class="metric-value">${savingsRate}%</span>
          </div>
        </div>
      </div>

      <h4>💰 Resumen Ejecutivo</h4>
      <p>Durante ${this.getPeriodText(data.period).toLowerCase()}, has manejado un total de <strong>${this.formatCurrency(data.totalIncome)}</strong> en ingresos y <strong>${this.formatCurrency(data.totalExpenses)}</strong> en gastos, resultando en un balance de <strong>${this.formatCurrency(balance)}</strong>.</p>
      
      <p>Tu tasa de ahorro actual es del <strong>${savingsRate}%</strong>. ${this.getSavingsAnalysis(parseFloat(savingsRate))}</p>

      <h4>📈 Análisis de Gastos por Categoría</h4>
      <div class="category-analysis">
    `;

    topCategories.forEach(([category, amount], index) => {
      const percentage = ((amount / data.totalExpenses) * 100).toFixed(1);
      const analysis = this.getCategoryAnalysis(category, percentage);
      
      report += `
        <div class="category-item">
          <div class="category-header">
            <span class="category-rank">#${index + 1}</span>
            <span class="category-name">${category}</span>
            <span class="category-amount">${this.formatCurrency(amount)} (${percentage}%)</span>
          </div>
          <div class="category-insight">${analysis}</div>
        </div>
      `;
    });

    report += `</div>`;

    // Focus-specific analysis
    if (focus === 'savings') {
      report += this.getSavingsRecommendations(data, savingsRate);
    } else if (focus === 'expenses') {
      report += this.getExpenseRecommendations(data, topCategories);
    } else if (focus === 'goals') {
      report += this.getGoalsRecommendations(data);
    } else {
      report += this.getGeneralRecommendations(data, savingsRate, topCategories);
    }

    // Answer specific questions
    if (questions && questions.trim()) {
      report += `
        <h4>❓ Respuesta a tus Preguntas</h4>
        <div class="question-section">
          <p><em>"${questions}"</em></p>
          <p>${this.generateQuestionResponse(questions, data)}</p>
        </div>
      `;
    }

    // Action plan
    report += this.getActionPlan(data, focus, savingsRate);

    return report;
  }

  getSavingsAnalysis(savingsRate) {
    if (savingsRate >= 20) {
      return '¡Excelente! Estás ahorrando muy bien. Mantén este ritmo y considera invertir tus ahorros.';
    } else if (savingsRate >= 10) {
      return 'Buen trabajo ahorrando. Intenta aumentar gradualmente tu tasa de ahorro al 20%.';
    } else if (savingsRate >= 0) {
      return 'Estás ahorrando algo, pero hay margen de mejora. Revisa tus gastos para encontrar oportunidades.';
    } else {
      return '⚠️ Estás gastando más de lo que ingresas. Es prioritario revisar y reducir gastos.';
    }
  }

  getCategoryAnalysis(category, percentage) {
    const insights = {
      'Comida': percentage > 30 ? 'Considera cocinar más en casa y planificar comidas.' : 'Gasto razonable en alimentación.',
      'Transporte': percentage > 20 ? 'Evalúa opciones de transporte más económicas.' : 'Gasto controlado en transporte.',
      'Ocio': percentage > 15 ? 'Busca alternativas de entretenimiento más económicas.' : 'Buen balance en entretenimiento.',
      'Supermercado': percentage > 25 ? 'Planifica compras y usa listas para evitar gastos innecesarios.' : 'Compras controladas.',
      'Servicios': percentage > 25 ? 'Revisa suscripciones y servicios que no uses frecuentemente.' : 'Servicios bajo control.',
      'Salud': 'Inversión importante en tu bienestar.',
      'Otros': 'Categoriza mejor estos gastos para mayor control.'
    };
    
    return insights[category] || 'Revisa si estos gastos son necesarios y busca formas de optimizarlos.';
  }

  getSavingsRecommendations(data, savingsRate) {
    return `
      <h4>💡 Recomendaciones para Ahorrar</h4>
      <div class="recommendations">
        <div class="recommendation">
          <strong>Regla 50/30/20:</strong> Destina 50% a necesidades, 30% a deseos y 20% a ahorros.
        </div>
        <div class="recommendation">
          <strong>Automatiza tus ahorros:</strong> Configura transferencias automáticas el día que cobras.
        </div>
        <div class="recommendation">
          <strong>Fondo de emergencia:</strong> Acumula 3-6 meses de gastos básicos.
        </div>
        ${savingsRate < 10 ? '<div class="recommendation urgent"><strong>Prioridad:</strong> Identifica gastos no esenciales que puedas eliminar.</div>' : ''}
      </div>
    `;
  }

  getExpenseRecommendations(data, topCategories) {
    const topCategory = topCategories[0];
    return `
      <h4>💳 Optimización de Gastos</h4>
      <div class="recommendations">
        <div class="recommendation">
          <strong>Categoría principal:</strong> ${topCategory[0]} representa tu mayor gasto (${this.formatCurrency(topCategory[1])}).
        </div>
        <div class="recommendation">
          <strong>Método 24 horas:</strong> Espera 24 horas antes de compras no planificadas.
        </div>
        <div class="recommendation">
          <strong>Revisa suscripciones:</strong> Cancela servicios que no uses regularmente.
        </div>
        <div class="recommendation">
          <strong>Compara precios:</strong> Usa apps para comparar precios antes de comprar.
        </div>
      </div>
    `;
  }

  getBudgetRecommendations(data, balance) {
    return `
      <h4>📊 Optimización de Presupuesto</h4>
      <div class="recommendations">
        <div class="recommendation">
          <strong>Presupuesto base cero:</strong> Asigna cada peso a una categoría específica.
        </div>
        <div class="recommendation">
          <strong>Revisa mensualmente:</strong> Ajusta tu presupuesto según patrones reales.
        </div>
        ${balance < 0 ? '<div class="recommendation urgent"><strong>Acción inmediata:</strong> Reduce gastos no esenciales para equilibrar el presupuesto.</div>' : ''}
        <div class="recommendation">
          <strong>Usa la regla 80/20:</strong> 80% gastos planificados, 20% imprevistos.
        </div>
      </div>
    `;
  }

  getGoalsRecommendations(data) {
    return `
      <h4>🎯 Estrategia para Objetivos</h4>
      <div class="recommendations">
        <div class="recommendation">
          <strong>Objetivos SMART:</strong> Específicos, Medibles, Alcanzables, Relevantes, con Tiempo definido.
        </div>
        <div class="recommendation">
          <strong>Divide en metas pequeñas:</strong> Celebra logros parciales para mantener motivación.
        </div>
        ${data.goals.length === 0 ? '<div class="recommendation"><strong>Comienza hoy:</strong> Define al menos un objetivo de ahorro específico.</div>' : ''}
        <div class="recommendation">
          <strong>Automatiza el progreso:</strong> Configura transferencias automáticas hacia tus objetivos.
        </div>
      </div>
    `;
  }

  getGeneralRecommendations(data, savingsRate, topCategories) {
    return `
      <h4>💡 Recomendaciones Generales</h4>
      <div class="recommendations">
        <div class="recommendation">
          <strong>Registra todo:</strong> Mantén el hábito de registrar todos tus gastos.
        </div>
        <div class="recommendation">
          <strong>Revisa semanalmente:</strong> Dedica 15 minutos cada semana a revisar tus finanzas.
        </div>
        <div class="recommendation">
          <strong>Edúcate financieramente:</strong> Lee libros o toma cursos sobre finanzas personales.
        </div>
        ${savingsRate < 15 ? '<div class="recommendation"><strong>Aumenta ingresos:</strong> Considera fuentes adicionales de ingresos.</div>' : ''}
      </div>
    `;
  }

  generateQuestionResponse(question, data) {
    const q = question.toLowerCase();
    
    if (q.includes('ahorr')) {
      const savingsRate = data.totalIncome > 0 ? ((data.totalIncome - data.totalExpenses) / data.totalIncome * 100).toFixed(1) : 0;
      return `Basándome en tus datos, tu tasa de ahorro actual es del ${savingsRate}%. Para mejorar, te recomiendo aplicar la regla 50/30/20 y automatizar tus ahorros.`;
    }
    
    if (q.includes('gast') || q.includes('reduc')) {
      const topCategory = Object.entries(data.categories).sort(([,a], [,b]) => b - a)[0];
      return `Tu mayor gasto es en ${topCategory[0]} con ${this.formatCurrency(topCategory[1])}. Te sugiero revisar esta categoría y buscar alternativas más económicas.`;
    }
    
    if (q.includes('ingreso') || q.includes('ganar')) {
      return `Con ingresos de ${this.formatCurrency(data.totalIncome)}, podrías considerar fuentes adicionales como freelancing, venta de productos o inversiones que generen ingresos pasivos.`;
    }
    
    if (q.includes('inver')) {
      const balance = data.totalIncome - data.totalExpenses;
      return balance > 0 ? 
        `Con un balance positivo de ${this.formatCurrency(balance)}, podrías considerar inversiones de bajo riesgo como fondos indexados o plazo fijo.` :
        `Primero enfócate en equilibrar tus finanzas y crear un fondo de emergencia antes de invertir.`;
    }
    
    return `Basándome en tu situación financiera actual, te recomiendo enfocarte en mantener un registro detallado de gastos, establecer objetivos claros de ahorro y revisar regularmente tu progreso.`;
  }

  getActionPlan(data, focus, savingsRate) {
    return `
      <h4>📋 Plan de Acción</h4>
      <div class="action-plan">
        <div class="action-period">
          <h5>📅 Próximos 30 días</h5>
          <ul>
            <li>Revisa y categoriza todos tus gastos del mes pasado</li>
            <li>Establece un presupuesto específico para cada categoría</li>
            <li>Configura alertas de límites de gasto en FINZN</li>
            ${savingsRate < 10 ? '<li class="urgent">Identifica 3 gastos no esenciales que puedas eliminar</li>' : ''}
          </ul>
        </div>
        
        <div class="action-period">
          <h5>📅 Próximos 60 días</h5>
          <ul>
            <li>Implementa el método de ahorro automático</li>
            <li>Negocia mejores tarifas en servicios recurrentes</li>
            <li>Establece al menos un objetivo de ahorro específico</li>
            <li>Evalúa el progreso y ajusta el presupuesto si es necesario</li>
          </ul>
        </div>
        
        <div class="action-period">
          <h5>📅 Próximos 90 días</h5>
          <ul>
            <li>Revisa y optimiza tu estrategia de ahorro</li>
            <li>Considera oportunidades de ingresos adicionales</li>
            <li>Evalúa opciones de inversión para tus ahorros</li>
            <li>Celebra tus logros y establece nuevas metas</li>
          </ul>
        </div>
      </div>
    `;
  }

  async generatePDF(reportContent, reportData) {
    try {
      console.log('📄 Generating PDF report...');
      
      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error('No se pudo abrir la ventana para generar el PDF. Verifica que no esté bloqueada por el navegador.');
      }

      // Get current date for filename
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-ES').replace(/\//g, '-');
      const filename = `Informe_Financiero_FINZN_${dateStr}.pdf`;

      // Create HTML content for PDF
      const htmlContent = this.createPDFHTML(reportContent, reportData);
      
      // Write content to new window
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Security: Prevent reverse tabnabbing
      printWindow.opener = null;
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          
          // Close window after printing
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      };

      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Fallback: download as HTML
      this.downloadAsHTML(reportContent, reportData);
      return false;
    }
  }

  createPDFHTML(reportContent, reportData) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Informe Financiero FINZN</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
          }
          
          .pdf-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #C8B6FF;
            padding-bottom: 20px;
          }
          
          .pdf-header h1 {
            color: #C8B6FF;
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: bold;
          }
          
          .pdf-header .subtitle {
            color: #666;
            font-size: 1.2em;
            margin-bottom: 5px;
          }
          
          .pdf-header .date {
            color: #999;
            font-size: 1em;
          }
          
          .report-metrics {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
          }
          
          .metric {
            text-align: center;
          }
          
          .metric-label {
            display: block;
            font-size: 0.9em;
            color: #666;
            margin-bottom: 5px;
          }
          
          .metric-value {
            display: block;
            font-size: 1.3em;
            font-weight: bold;
            color: #333;
          }
          
          .metric-value.positive {
            color: #28a745;
          }
          
          .metric-value.negative {
            color: #dc3545;
          }
          
          h3, h4, h5 {
            color: #C8B6FF;
            margin: 25px 0 15px 0;
            font-weight: bold;
          }
          
          h3 {
            font-size: 1.5em;
            border-bottom: 2px solid #C8B6FF;
            padding-bottom: 5px;
          }
          
          h4 {
            font-size: 1.3em;
          }
          
          h5 {
            font-size: 1.1em;
          }
          
          p {
            margin-bottom: 15px;
            text-align: justify;
          }
          
          .category-analysis {
            margin: 20px 0;
          }
          
          .category-item {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #e9ecef;
            border-radius: 5px;
            background: #f8f9fa;
          }
          
          .category-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
            font-weight: bold;
          }
          
          .category-rank {
            background: #C8B6FF;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
          }
          
          .category-insight {
            font-size: 0.9em;
            color: #666;
            font-style: italic;
          }
          
          .recommendations {
            margin: 15px 0;
          }
          
          .recommendation {
            margin-bottom: 10px;
            padding: 10px;
            background: #e8f4fd;
            border-left: 4px solid #007bff;
            border-radius: 0 5px 5px 0;
          }
          
          .recommendation.urgent {
            background: #fff3cd;
            border-left-color: #ffc107;
          }
          
          .action-plan {
            margin: 20px 0;
          }
          
          .action-period {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #e9ecef;
            border-radius: 5px;
          }
          
          .action-period h5 {
            margin-top: 0;
            margin-bottom: 10px;
          }
          
          .action-period ul {
            margin-left: 20px;
          }
          
          .action-period li {
            margin-bottom: 5px;
          }
          
          .action-period li.urgent {
            color: #dc3545;
            font-weight: bold;
          }
          
          .question-section {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #C8B6FF;
            margin: 15px 0;
          }
          
          .question-section em {
            color: #666;
            font-style: italic;
          }
          
          .numbered-item, .bullet-item {
            margin-bottom: 8px;
            padding-left: 10px;
          }
          
          strong {
            color: #333;
            font-weight: bold;
          }
          
          .ai-content {
            margin: 20px 0;
          }
          
          .pdf-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            color: #666;
            font-size: 0.9em;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 15px;
            }
            
            .pdf-header h1 {
              font-size: 2em;
            }
            
            .report-metrics {
              flex-direction: column;
              gap: 10px;
            }
            
            .metric {
              display: flex;
              justify-content: space-between;
              text-align: left;
            }
            
            .category-header {
              flex-direction: column;
              align-items: flex-start;
            }
            
            .action-period {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="pdf-header">
          <h1>FINZN</h1>
          <div class="subtitle">Informe Financiero Personalizado</div>
          <div class="date">Generado el ${dateStr}</div>
        </div>
        
        ${reportContent}
        
        <div class="pdf-footer">
          <p>Informe generado por FINZN - Tu compañero financiero inteligente</p>
          <p>Para más información y herramientas financieras, visita tu dashboard de FINZN</p>
        </div>
      </body>
      </html>
    `;
  }

  downloadAsHTML(reportContent, reportData) {
    try {
      const htmlContent = this.createPDFHTML(reportContent, reportData);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-ES').replace(/\//g, '-');
      const filename = `Informe_Financiero_FINZN_${dateStr}.html`;
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error downloading HTML:', error);
      return false;
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

  getPeriodText(period) {
    const periods = {
      'current': 'Mes Actual',
      'last3': 'Últimos 3 Meses',
      'last6': 'Últimos 6 Meses',
      'year': 'Año Completo'
    };
    return periods[period] || 'Período Seleccionado';
  }
}