export class BudgetManager {
  constructor() {
    this.budgets = [];
    this.insights = [];
    this.alerts = [];
    this.currentBudgetId = null;
  }

  init() {
    console.log('💰 Initializing Budget Manager...');
    this.setupEventListeners();
    this.loadBudgets();
    this.loadInsights();
    this.loadAlerts();
  }

  setupEventListeners() {
    // Add budget button
    const addBudgetBtn = document.getElementById('add-budget-btn');
    if (addBudgetBtn) {
      addBudgetBtn.addEventListener('click', () => this.showAddBudgetModal());
    }

    // Generate AI insights button
    const generateInsightsBtn = document.getElementById('generate-ai-insights-btn');
    if (generateInsightsBtn) {
      generateInsightsBtn.addEventListener('click', () => this.generateAIInsights());
    }

    // Budget forms
    const addBudgetForm = document.getElementById('add-budget-form');
    if (addBudgetForm) {
      addBudgetForm.addEventListener('submit', (e) => this.handleAddBudget(e));
    }

    const editBudgetForm = document.getElementById('edit-budget-form');
    if (editBudgetForm) {
      editBudgetForm.addEventListener('submit', (e) => this.handleEditBudget(e));
    }

    // Delete budget button in edit modal
    const deleteBudgetBtn = document.getElementById('delete-budget-btn');
    if (deleteBudgetBtn) {
      deleteBudgetBtn.addEventListener('click', () => this.handleDeleteBudget());
    }
  }

  async loadBudgets() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      console.log('💰 Loading budgets...');
      
      const { data, error } = await window.supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading budgets:', error);
        return;
      }

      this.budgets = data || [];
      console.log('💰 Budgets loaded:', this.budgets.length);
      this.updateBudgetsUI();
    } catch (error) {
      console.error('Error in loadBudgets:', error);
    }
  }

  async loadInsights() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const { data, error } = await window.supabase
        .from('budget_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading insights:', error);
        return;
      }

      this.insights = data || [];
      this.updateInsightsUI();
    } catch (error) {
      console.error('Error in loadInsights:', error);
    }
  }

  async loadAlerts() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const { data, error } = await window.supabase
        .from('budget_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading alerts:', error);
        return;
      }

      this.alerts = data || [];
      this.updateAlertsUI();
    } catch (error) {
      console.error('Error in loadAlerts:', error);
    }
  }

  showAddBudgetModal() {
    // Set default dates
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    
    const startDateInput = document.getElementById('budget-start-date');
    const endDateInput = document.getElementById('budget-end-date');
    
    if (startDateInput) startDateInput.value = today.toISOString().split('T')[0];
    if (endDateInput) endDateInput.value = nextMonth.toISOString().split('T')[0];

    if (window.app && window.app.modals) {
      window.app.modals.show('add-budget-modal');
    }
  }

  async handleAddBudget(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const budgetData = {
      name: formData.get('name'),
      category: formData.get('category'),
      amount: parseFloat(formData.get('amount')),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date')
    };

    if (!budgetData.name || !budgetData.category || !budgetData.amount || !budgetData.start_date || !budgetData.end_date) {
      this.showAlert('Por favor completa todos los campos', 'error');
      return;
    }

    try {
      await this.addBudget(budgetData);
      
      if (window.app && window.app.modals) {
        window.app.modals.hide('add-budget-modal');
      }
      
      this.showAlert('Presupuesto creado exitosamente', 'success');
      this.loadBudgets();
      
      // Generate AI insights for the new budget
      setTimeout(() => this.generateAIInsights(), 1000);
      
    } catch (error) {
      console.error('Error adding budget:', error);
      this.showAlert('Error al crear el presupuesto', 'error');
    }
  }

  async addBudget(budgetData) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const budget = {
      user_id: userId,
      ...budgetData
    };

    const { data, error } = await window.supabase
      .from('budgets')
      .insert([budget])
      .select();

    if (error) throw error;
    return data[0];
  }

  editBudget(budgetId) {
    const budget = this.budgets.find(b => b.id === budgetId);
    if (!budget) return;

    // Populate edit form
    document.getElementById('edit-budget-name').value = budget.name;
    document.getElementById('edit-budget-category').value = budget.category;
    document.getElementById('edit-budget-amount').value = budget.amount;
    document.getElementById('edit-budget-start-date').value = budget.start_date;
    document.getElementById('edit-budget-end-date').value = budget.end_date;

    // Store budget ID for editing
    const modal = document.getElementById('edit-budget-modal');
    if (modal) modal.dataset.budgetId = budgetId;

    if (window.app && window.app.modals) {
      window.app.modals.show('edit-budget-modal');
    }
  }

  async handleEditBudget(e) {
    e.preventDefault();
    
    const modal = document.getElementById('edit-budget-modal');
    const budgetId = modal?.dataset.budgetId;
    
    if (!budgetId) return;

    const formData = new FormData(e.target);
    const updates = {
      name: formData.get('name'),
      category: formData.get('category'),
      amount: parseFloat(formData.get('amount')),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date')
    };

    try {
      await this.updateBudget(budgetId, updates);
      
      if (window.app && window.app.modals) {
        window.app.modals.hide('edit-budget-modal');
      }
      
      this.showAlert('Presupuesto actualizado exitosamente', 'success');
      this.loadBudgets();
      
    } catch (error) {
      console.error('Error updating budget:', error);
      this.showAlert('Error al actualizar el presupuesto', 'error');
    }
  }

  async updateBudget(budgetId, updates) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const { data, error } = await window.supabase
      .from('budgets')
      .update(updates)
      .eq('id', budgetId)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return data[0];
  }

  async handleDeleteBudget() {
    const modal = document.getElementById('edit-budget-modal');
    const budgetId = modal?.dataset.budgetId;
    
    if (!budgetId) return;

    const budget = this.budgets.find(b => b.id === budgetId);
    if (!budget) return;

    if (confirm(`¿Estás seguro de que quieres eliminar el presupuesto "${budget.name}"?`)) {
      try {
        await this.deleteBudget(budgetId);
        
        if (window.app && window.app.modals) {
          window.app.modals.hide('edit-budget-modal');
        }
        
        this.showAlert('Presupuesto eliminado exitosamente', 'success');
        this.loadBudgets();
        
      } catch (error) {
        console.error('Error deleting budget:', error);
        this.showAlert('Error al eliminar el presupuesto', 'error');
      }
    }
  }

  async deleteBudget(budgetId) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const { error } = await window.supabase
      .from('budgets')
      .delete()
      .eq('id', budgetId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  updateBudgetsUI() {
    const container = document.getElementById('budgets-list');
    if (!container) return;

    container.innerHTML = '';

    if (this.budgets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💰</div>
          <h3>No tienes presupuestos configurados</h3>
          <p>Crea tu primer presupuesto para controlar mejor tus gastos</p>
          <button class="btn btn-primary" onclick="window.app.budget.showAddBudgetModal()">
            <span>➕</span>
            Crear Presupuesto
          </button>
        </div>
      `;
      return;
    }

    this.budgets.forEach(budget => {
      const budgetCard = this.createBudgetCard(budget);
      container.appendChild(budgetCard);
    });
  }

  createBudgetCard(budget) {
    const card = document.createElement('div');
    card.className = 'budget-card fade-in';

    // Calculate progress
    const spent = this.calculateSpentAmount(budget);
    const progress = (spent / budget.amount) * 100;
    const remaining = budget.amount - spent;
    
    // Determine status
    let statusClass = 'safe';
    let statusIcon = '🟢';
    let statusText = 'En control';
    
    if (progress >= 100) {
      statusClass = 'danger';
      statusIcon = '🔴';
      statusText = 'Presupuesto superado';
    } else if (progress >= 80) {
      statusClass = 'warning';
      statusIcon = '🟡';
      statusText = 'Cerca del límite';
    }

    // Get category info
    const categoryInfo = this.getCategoryInfo(budget.category);
    
    // Format dates
    const startDate = new Date(budget.start_date).toLocaleDateString('es-ES');
    const endDate = new Date(budget.end_date).toLocaleDateString('es-ES');
    
    card.innerHTML = `
      <div class="budget-card-header">
        <div class="budget-info">
          <div class="budget-category">
            <div class="category-icon">${categoryInfo.icon}</div>
            <div class="budget-details">
              <h3 class="budget-name">${budget.name}</h3>
              <div class="budget-category-name">${budget.category}</div>
            </div>
          </div>
          <div class="budget-status ${statusClass}">
            ${statusIcon} ${statusText}
          </div>
        </div>
        <div class="budget-actions">
          <button class="budget-action-btn" onclick="window.app.budget.editBudget('${budget.id}')" title="Editar">
            ✏️
          </button>
        </div>
      </div>
      
      <div class="budget-amounts">
        <div class="amount-row">
          <span class="amount-label">Presupuesto:</span>
          <span class="amount-value primary">${this.formatCurrency(budget.amount)}</span>
        </div>
        <div class="amount-row">
          <span class="amount-label">Gastado:</span>
          <span class="amount-value ${statusClass}">${this.formatCurrency(spent)}</span>
        </div>
        <div class="amount-row">
          <span class="amount-label">Disponible:</span>
          <span class="amount-value ${remaining >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(remaining)}</span>
        </div>
      </div>
      
      <div class="budget-progress">
        <div class="progress-bar-budget">
          <div class="progress-fill-budget ${statusClass}" style="width: ${Math.min(progress, 100)}%"></div>
        </div>
        <div class="progress-text-budget">${progress.toFixed(1)}% utilizado</div>
      </div>
      
      <div class="budget-period">
        <div class="period-info">
          <span class="period-label">Período:</span>
          <span class="period-dates">${startDate} - ${endDate}</span>
        </div>
        <div class="period-days">
          ${this.getDaysRemaining(budget.end_date)} días restantes
        </div>
      </div>
    `;

    return card;
  }

  calculateSpentAmount(budget) {
    // Get expenses for this budget's category and period
    const currentMonth = this.getCurrentMonth();
    const expenses = window.app?.data?.getExpenses(currentMonth) || [];
    
    return expenses
      .filter(expense => expense.category === budget.category)
      .filter(expense => {
        const expenseDate = new Date(expense.transaction_date);
        const startDate = new Date(budget.start_date);
        const endDate = new Date(budget.end_date);
        return expenseDate >= startDate && expenseDate <= endDate;
      })
      .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  }

  getDaysRemaining(endDate) {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  async generateAIInsights() {
    const generateBtn = document.getElementById('generate-ai-insights-btn');
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<div class="loading-spinner"></div> Generando...';
    }

    try {
      console.log('🤖 Generating AI insights for budgets...');
      
      // Prepare data for AI analysis
      const analysisData = await this.prepareAnalysisData();
      
      // Generate insights using Gemini API
      const insights = await this.generateInsightsWithAI(analysisData);
      
      // Save insights to database
      await this.saveInsights(insights);
      
      // Reload insights
      await this.loadInsights();
      
      this.showAlert('Insights de IA generados exitosamente', 'success');
      
    } catch (error) {
      console.error('Error generating AI insights:', error);
      this.showAlert('Error al generar insights de IA', 'error');
    } finally {
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<span>🤖</span> Generar Insights IA';
      }
    }
  }

  async prepareAnalysisData() {
    const currentMonth = this.getCurrentMonth();
    const expenses = window.app?.data?.getExpenses(currentMonth) || [];
    const categories = window.app?.data?.getCategories() || [];
    
    // Group expenses by category
    const expensesByCategory = {};
    expenses.forEach(expense => {
      if (!expensesByCategory[expense.category]) {
        expensesByCategory[expense.category] = [];
      }
      expensesByCategory[expense.category].push(expense);
    });

    // Analyze spending patterns
    const patterns = {};
    Object.keys(expensesByCategory).forEach(category => {
      const categoryExpenses = expensesByCategory[category];
      const total = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const average = total / categoryExpenses.length;
      
      // Analyze by day of week
      const dayPattern = {};
      categoryExpenses.forEach(expense => {
        const day = new Date(expense.transaction_date).getDay();
        const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][day];
        dayPattern[dayName] = (dayPattern[dayName] || 0) + parseFloat(expense.amount);
      });

      patterns[category] = {
        total,
        average,
        count: categoryExpenses.length,
        dayPattern,
        expenses: categoryExpenses
      };
    });

    return {
      budgets: this.budgets,
      patterns,
      categories,
      currentMonth,
      totalExpenses: expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
    };
  }

  async generateInsightsWithAI(data) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ No Gemini API key found, using fallback insights');
      return this.generateFallbackInsights(data);
    }

    try {
      const prompt = this.buildInsightsPrompt(data);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1500,
            }
          }),
        }
      );

      if (!response.ok) {
        console.error('❌ Gemini API error:', response.status);
        return this.generateFallbackInsights(data);
      }

      const result = await response.json();
      const aiContent = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!aiContent.trim()) {
        return this.generateFallbackInsights(data);
      }

      return this.parseAIInsights(aiContent, data);

    } catch (error) {
      console.error('❌ Error calling Gemini API:', error);
      return this.generateFallbackInsights(data);
    }
  }

  buildInsightsPrompt(data) {
    let prompt = `Eres un experto asesor financiero especializado en presupuestos. Analiza los siguientes datos y genera insights específicos y accionables.

DATOS FINANCIEROS:
- Presupuestos activos: ${data.budgets.length}
- Gastos totales del mes: $${data.totalExpenses.toLocaleString()}

PATRONES DE GASTO POR CATEGORÍA:`;

    Object.entries(data.patterns).forEach(([category, pattern]) => {
      const topDay = Object.entries(pattern.dayPattern)
        .sort(([,a], [,b]) => b - a)[0];
      
      prompt += `\n- ${category}: $${pattern.total.toLocaleString()} (${pattern.count} transacciones, promedio $${pattern.average.toFixed(0)})`;
      if (topDay) {
        prompt += ` - Mayor gasto: ${topDay[0]} ($${topDay[1].toFixed(0)})`;
      }
    });

    prompt += `\n\nPRESUPUESTO ACTUAL:`;
    data.budgets.forEach(budget => {
      const spent = this.calculateSpentAmount(budget);
      const progress = (spent / budget.amount) * 100;
      prompt += `\n- ${budget.category}: $${spent.toLocaleString()} / $${budget.amount.toLocaleString()} (${progress.toFixed(1)}%)`;
    });

    prompt += `\n\nGenera exactamente 4 insights en formato JSON con esta estructura:
{
  "insights": [
    {
      "type": "recommendation|pattern|prediction|alert",
      "title": "Título corto y claro",
      "description": "Descripción detallada y accionable",
      "category": "categoría específica o 'general'",
      "confidence": 0.85,
      "priority": "high|medium|low"
    }
  ]
}

TIPOS DE INSIGHTS A GENERAR:
1. RECOMMENDATION: Sugerencia específica de presupuesto para una categoría
2. PATTERN: Patrón de gasto identificado (días, horarios, frecuencia)
3. PREDICTION: Predicción de gasto futuro basada en tendencias
4. ALERT: Alerta sobre presupuestos en riesgo o comportamientos preocupantes

Sé específico, usa números reales de los datos, y da consejos accionables. Responde SOLO con el JSON válido.`;

    return prompt;
  }

  parseAIInsights(aiContent, data) {
    try {
      // Try to extract JSON from AI response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.insights || [];
      }
    } catch (error) {
      console.error('Error parsing AI insights:', error);
    }
    
    return this.generateFallbackInsights(data);
  }

  generateFallbackInsights(data) {
    const insights = [];
    
    // Generate recommendation insight
    const topCategory = Object.entries(data.patterns)
      .sort(([,a], [,b]) => b.total - a.total)[0];
    
    if (topCategory) {
      const [category, pattern] = topCategory;
      const suggestedBudget = Math.ceil(pattern.total * 1.1);
      
      insights.push({
        type: 'recommendation',
        title: `Presupuesto sugerido para ${category}`,
        description: `Basándome en tus gastos actuales de $${pattern.total.toLocaleString()}, te recomiendo un presupuesto de $${suggestedBudget.toLocaleString()} para ${category}.`,
        category: category,
        confidence: 0.85,
        priority: 'high'
      });
    }

    // Generate pattern insight
    const weekendCategories = Object.entries(data.patterns)
      .filter(([, pattern]) => {
        const weekendSpending = (pattern.dayPattern['Sábado'] || 0) + (pattern.dayPattern['Domingo'] || 0);
        const totalSpending = pattern.total;
        return weekendSpending / totalSpending > 0.4;
      });

    if (weekendCategories.length > 0) {
      const category = weekendCategories[0][0];
      insights.push({
        type: 'pattern',
        title: `Patrón de gasto en fines de semana`,
        description: `Tus gastos en ${category} aumentan significativamente los fines de semana. Considera planificar un presupuesto específico para estos días.`,
        category: category,
        confidence: 0.78,
        priority: 'medium'
      });
    }

    // Generate prediction insight
    if (data.totalExpenses > 0) {
      const projectedMonthly = data.totalExpenses * 1.05;
      insights.push({
        type: 'prediction',
        title: 'Proyección de gastos mensuales',
        description: `Basándome en tus patrones actuales, estimo que tus gastos mensuales serán de aproximadamente $${projectedMonthly.toLocaleString()}.`,
        category: 'general',
        confidence: 0.72,
        priority: 'medium'
      });
    }

    // Generate alert insight for budgets at risk
    const budgetsAtRisk = data.budgets.filter(budget => {
      const spent = this.calculateSpentAmount(budget);
      const progress = (spent / budget.amount) * 100;
      return progress >= 80;
    });

    if (budgetsAtRisk.length > 0) {
      const budget = budgetsAtRisk[0];
      const spent = this.calculateSpentAmount(budget);
      const progress = (spent / budget.amount) * 100;
      
      insights.push({
        type: 'alert',
        title: `Alerta: Presupuesto de ${budget.category} en riesgo`,
        description: `Has utilizado el ${progress.toFixed(1)}% de tu presupuesto en ${budget.category}. Considera reducir gastos en esta categoría.`,
        category: budget.category,
        confidence: 0.95,
        priority: 'high'
      });
    }

    return insights;
  }

  async saveInsights(insights) {
    const userId = this.getCurrentUserId();
    if (!userId || !insights.length) return;

    try {
      // Clear old insights
      await window.supabase
        .from('budget_insights')
        .delete()
        .eq('user_id', userId);

      // Save new insights
      const insightsData = insights.map(insight => ({
        user_id: userId,
        insight_type: insight.type,
        title: insight.title,
        description: insight.description,
        data: {
          category: insight.category,
          priority: insight.priority
        },
        confidence_score: insight.confidence
      }));

      const { error } = await window.supabase
        .from('budget_insights')
        .insert(insightsData);

      if (error) {
        console.error('Error saving insights:', error);
      }
    } catch (error) {
      console.error('Error in saveInsights:', error);
    }
  }

  updateInsightsUI() {
    const container = document.getElementById('ai-insights-list');
    if (!container) return;

    container.innerHTML = '';

    if (this.insights.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🤖</div>
          <h3>No hay insights disponibles</h3>
          <p>Genera insights con IA para obtener recomendaciones personalizadas</p>
          <button class="btn btn-primary" onclick="window.app.budget.generateAIInsights()">
            <span>🤖</span>
            Generar Insights
          </button>
        </div>
      `;
      return;
    }

    this.insights.forEach(insight => {
      const insightCard = this.createInsightCard(insight);
      container.appendChild(insightCard);
    });
  }

  createInsightCard(insight) {
    const card = document.createElement('div');
    card.className = `insight-card ${insight.insight_type} fade-in`;

    const typeIcons = {
      'recommendation': '💡',
      'pattern': '📊',
      'prediction': '🔮',
      'alert': '⚠️'
    };

    const typeNames = {
      'recommendation': 'Recomendación',
      'pattern': 'Patrón Detectado',
      'prediction': 'Predicción',
      'alert': 'Alerta'
    };

    const priorityColors = {
      'high': '#ef4444',
      'medium': '#f59e0b',
      'low': '#10b981'
    };

    const confidence = Math.round((insight.confidence_score || 0.5) * 100);
    const priority = insight.data?.priority || 'medium';

    card.innerHTML = `
      <div class="insight-header">
        <div class="insight-type">
          <span class="insight-icon">${typeIcons[insight.insight_type] || '💡'}</span>
          <span class="insight-type-name">${typeNames[insight.insight_type] || 'Insight'}</span>
        </div>
        <div class="insight-meta">
          <div class="insight-priority" style="color: ${priorityColors[priority]}">
            ${priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢'}
          </div>
          <div class="insight-confidence">${confidence}%</div>
        </div>
      </div>
      
      <div class="insight-content">
        <h4 class="insight-title">${insight.title}</h4>
        <p class="insight-description">${insight.description}</p>
      </div>
      
      <div class="insight-actions">
        <button class="btn btn-secondary btn-sm" onclick="window.app.budget.dismissInsight('${insight.id}')">
          Descartar
        </button>
        ${insight.insight_type === 'recommendation' ? `
          <button class="btn btn-primary btn-sm" onclick="window.app.budget.applyRecommendation('${insight.id}')">
            Aplicar
          </button>
        ` : ''}
      </div>
    `;

    return card;
  }

  async dismissInsight(insightId) {
    try {
      const { error } = await window.supabase
        .from('budget_insights')
        .update({ status: 'dismissed' })
        .eq('id', insightId);

      if (error) throw error;

      this.loadInsights();
      this.showAlert('Insight descartado', 'info');
    } catch (error) {
      console.error('Error dismissing insight:', error);
      this.showAlert('Error al descartar insight', 'error');
    }
  }

  async applyRecommendation(insightId) {
    const insight = this.insights.find(i => i.id === insightId);
    if (!insight || insight.insight_type !== 'recommendation') return;

    // Pre-fill add budget modal with recommendation data
    const category = insight.data?.category || '';
    const description = insight.description;
    
    // Extract amount from description (simple regex)
    const amountMatch = description.match(/\$([0-9,]+)/);
    const suggestedAmount = amountMatch ? amountMatch[1].replace(',', '') : '';

    // Set form values
    const nameInput = document.getElementById('budget-name');
    const categorySelect = document.getElementById('budget-category');
    const amountInput = document.getElementById('budget-amount');

    if (nameInput) nameInput.value = `Presupuesto ${category}`;
    if (categorySelect) categorySelect.value = category;
    if (amountInput) amountInput.value = suggestedAmount;

    // Mark insight as applied
    try {
      await window.supabase
        .from('budget_insights')
        .update({ status: 'applied' })
        .eq('id', insightId);
    } catch (error) {
      console.error('Error marking insight as applied:', error);
    }

    this.showAddBudgetModal();
    this.showAlert('Recomendación aplicada al formulario', 'success');
  }

  updateAlertsUI() {
    const container = document.getElementById('budget-alerts-list');
    if (!container) return;

    // Update alerts count badge
    const alertsBadge = document.getElementById('budget-alerts-count');
    if (alertsBadge) {
      alertsBadge.textContent = this.alerts.length;
      alertsBadge.style.display = this.alerts.length > 0 ? 'flex' : 'none';
    }

    container.innerHTML = '';

    if (this.alerts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <h3>No hay alertas activas</h3>
          <p>Tus presupuestos están bajo control</p>
        </div>
      `;
      return;
    }

    this.alerts.forEach(alert => {
      const alertCard = this.createAlertCard(alert);
      container.appendChild(alertCard);
    });
  }

  createAlertCard(alert) {
    const card = document.createElement('div');
    card.className = `alert-card ${alert.severity} fade-in`;

    const severityIcons = {
      'info': 'ℹ️',
      'warning': '⚠️',
      'critical': '🚨'
    };

    card.innerHTML = `
      <div class="alert-header">
        <div class="alert-severity">
          <span class="alert-icon">${severityIcons[alert.severity]}</span>
          <span class="alert-type">${alert.alert_type}</span>
        </div>
        <div class="alert-actions">
          <button class="alert-action-btn" onclick="window.app.budget.acknowledgeAlert('${alert.id}')" title="Marcar como leída">
            ✓
          </button>
        </div>
      </div>
      
      <div class="alert-content">
        <h4 class="alert-title">${alert.title}</h4>
        <p class="alert-message">${alert.message}</p>
        ${alert.current_amount ? `
          <div class="alert-amounts">
            <span>Gastado: ${this.formatCurrency(alert.current_amount)}</span>
            ${alert.threshold_percentage ? `<span>Umbral: ${alert.threshold_percentage}%</span>` : ''}
          </div>
        ` : ''}
      </div>
    `;

    return card;
  }

  async acknowledgeAlert(alertId) {
    try {
      const { error } = await window.supabase
        .from('budget_alerts')
        .update({ 
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      this.loadAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  }

  // Utility methods
  getCurrentUserId() {
    return window.app?.auth?.getCurrentUserId() || null;
  }

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  getCategoryInfo(categoryName) {
    if (window.app && window.app.data) {
      const categories = window.app.data.getCategories();
      const category = categories.find(cat => cat.name === categoryName);
      if (category) {
        return {
          name: category.name,
          icon: category.icon,
          color: category.color
        };
      }
    }
    
    return { 
      name: categoryName, 
      icon: '📦', 
      color: '#9ca3af' 
    };
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  showAlert(message, type = 'info') {
    if (window.app && window.app.ui) {
      window.app.ui.showAlert(message, type);
    }
  }
}