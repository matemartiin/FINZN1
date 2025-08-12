// FINZN Dashboard V3 — layout + totales + modales (sin romper lo existente)
import { DataManager } from './data.js';
import { UIManager } from './ui.js';

const $ = (q,root=document)=>root.querySelector(q);
const fmt = (n)=> new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(+n||0);

function ensureLayout() {
  const dash = document.getElementById('dashboard-section') || document.querySelector('.main-dashboard') || document.getElementById('layout-root');
  if (!dash) return null;
  if (document.getElementById('finzn-dashboard-v3')) return $('#finzn-dashboard-v3');

  const root = document.createElement('div');
  root.id = 'finzn-dashboard-v3';
  root.className = 'finzn-layout-v3';
  root.innerHTML = `
    <!-- FILA 1 -->
    <section class="card finzn-hub">
      <div class="finzn-hub-left">
        <div class="finzn-hub-title">Balance</div>
        <div class="finzn-balance" id="finzn-balance-amount">—</div>
      </div>
      <div class="finzn-hub-right">
        <button class="finzn-mini-stat finzn-gastos" id="finzn-open-expenses">
          <span class="finzn-mini-title">Gastos</span>
          <span class="finzn-mini-amount" id="finzn-total-expenses">—</span>
        </button>
        <button class="finzn-mini-stat finzn-ingresos" id="finzn-open-incomes">
          <span class="finzn-mini-title">Ingresos</span>
          <span class="finzn-mini-amount" id="finzn-total-incomes">—</span>
        </button>
      </div>
    </section>

    <!-- FILA 2 -->
    <section class="finzn-row finzn-row-2">
      <div class="card finzn-chart-card">
        <div class="finzn-card-head"><h3>Resumen</h3></div>
        <div class="finzn-chart-wrap" id="finzn-chart-slot"></div>
      </div>
      <div class="card finzn-limits-budgets">
        <div class="finzn-card-head"><h3>Límites y Presupuestos</h3></div>
        <div id="finzn-limits-slot"></div>
        <div id="finzn-budgets-slot" style="margin-top:12px"></div>
      </div>
    </section>

    <!-- FILA 3 -->
    <section class="finzn-row finzn-row-3 finzn-widgets">
      <div class="card finzn-widget" id="finzn-goals-widget">
        <div class="finzn-card-head"><h3>Objetivos</h3></div>
        <div id="finzn-goals-list">—</div>
      </div>
      <div class="card finzn-widget" id="finzn-monthly-trend-widget">
        <div class="finzn-card-head"><h3>Tendencia mensual de gastos</h3></div>
        <div id="finzn-trend-slot"></div>
      </div>
    </section>

    <!-- MODALES -->
    <div class="finzn-modal" id="finzn-expenses-modal" aria-hidden="true">
      <div class="finzn-modal-backdrop" data-close="expenses"></div>
      <div class="finzn-modal-dialog" role="dialog" aria-modal="true">
        <div class="finzn-modal-head">
          <h3>Gastos</h3><button class="btn ghost" data-close="expenses">Cerrar</button>
        </div>
        <div class="finzn-filters">
          <input type="date" id="finzn-expenses-from">
          <input type="date" id="finzn-expenses-to">
          <select id="finzn-expenses-category"><option value="">Todas las categorías</option></select>
          <input type="search" id="finzn-expenses-q" placeholder="Buscar por descripción…">
        </div>
        <div class="finzn-modal-body">
          <table class="finzn-table" id="finzn-expenses-table">
            <thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th style="text-align:right">Monto</th><th></th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="finzn-modal" id="finzn-incomes-modal" aria-hidden="true">
      <div class="finzn-modal-backdrop" data-close="incomes"></div>
      <div class="finzn-modal-dialog" role="dialog" aria-modal="true">
        <div class="finzn-modal-head">
          <h3>Ingresos</h3><button class="btn ghost" data-close="incomes">Cerrar</button>
        </div>
        <div class="finzn-filters">
          <input type="date" id="finzn-incomes-from">
          <input type="date" id="finzn-incomes-to">
          <select id="finzn-incomes-category"><option value="">Todas las categorías</option></select>
          <input type="search" id="finzn-incomes-q" placeholder="Buscar por descripción…">
        </div>
        <div class="finzn-modal-body">
          <table class="finzn-table" id="finzn-incomes-table">
            <thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th style="text-align:right">Monto</th><th></th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  dash.prepend(root);
  return root;
}

function moveExistingBlocks() {
  // Tu card del gráfico
  const chart = document.querySelector('.chart-card-new');
  const chartSlot = $('#finzn-chart-slot');
  if (chart && chartSlot && !chartSlot.contains(chart)) chartSlot.appendChild(chart);

  // Límites
  const limits = document.getElementById('category-limits-display') || document.querySelector('.spending-limits-main-card');
  const limitsSlot = $('#finzn-limits-slot');
  if (limits && limitsSlot && !limitsSlot.contains(limits)) limitsSlot.appendChild(limits);

  // Presupuestos
  const budgets = document.querySelector('.budgets-container') || document.getElementById('budgets-list');
  const budgetsSlot = $('#finzn-budgets-slot');
  if (budgets && budgetsSlot && !budgetsSlot.contains(budgets)) budgetsSlot.appendChild(budgets);

  // Ocultar summary-cards viejas si molestan
  const oldSummary = document.querySelector('.summary-cards');
  if (oldSummary) oldSummary.style.display = 'none';
}

function escapeHtml(text=''){ const div=document.createElement('div'); div.textContent=String(text); return div.innerHTML; }
function fillCategories(selectSel, items){
  const sel = document.querySelector(selectSel); if(!sel) return;
  const cats = Array.from(new Set(items.map(it=> it.category).filter(Boolean))).sort();
  sel.innerHTML = '<option value=\"\">Todas las categorías</option>' + cats.map(c=>`<option>${escapeHtml(c)}</option>`).join('');
}
function applyFilters(items, {from,to,cat,q}){
  function toDate(s){ return s ? new Date(s) : null; }
  const f = toDate(from), t = toDate(to);
  return items.filter(it=>{
    const d = toDate(it.date);
    if (f && d && d < f) return false;
    if (t && d && d > t) return false;
    if (cat && cat!=='' && String(it.category)!==cat) return false;
    if (q && q.trim()){
      const k = `${it.description||''} ${it.category||''}`.toLowerCase();
      if (!k.includes(q.trim().toLowerCase())) return false;
    }
    return true;
  });
}
function renderTable(tbodySel, items, kind){
  const tbody = document.querySelector(tbodySel); if(!tbody) return;
  tbody.innerHTML = items.map(it=>`
    <tr data-id="${escapeHtml(it.id)}">
      <td>${escapeHtml(it.date||'')}</td>
      <td>${escapeHtml(it.category||'')}</td>
      <td>${escapeHtml(it.description||'')}</td>
      <td style="text-align:right">${fmt(it.amount)}</td>
      <td class="finzn-row-actions">
        <button class="btn ghost" data-act="edit" data-kind="${kind}">Editar</button>
        <button class="btn" data-act="delete" data-kind="${kind}">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

async function refreshHub(app){
  const dm = app?.data instanceof DataManager ? app.data : null;
  let expenses = [], incomes = [], balance = 0;

  if (dm) {
    const cm = dm.currentMonth || dm.getCurrentMonth?.();
    await dm.loadExpenses?.(cm);
    await dm.loadIncomes?.(cm);
    expenses = dm.getExpensesForMonth?.(cm) || Object.values(dm.data.expenses?.[cm]||{});
    incomes  = dm.getIncomesForMonth?.(cm)  || Object.values(dm.data.income?.[cm]||{});
    balance  = dm.calculateBalance?.(cm) ?? 0;
  }

  const totalExp = expenses.reduce((a,b)=>a + (+b.amount||0), 0);
  const totalInc = incomes.reduce((a,b)=>a + (+b.amount||0), 0);
  $('#finzn-balance-amount').textContent = fmt(balance || (totalInc - totalExp));
  $('#finzn-total-expenses').textContent = fmt(totalExp);
  $('#finzn-total-incomes').textContent  = fmt(totalInc);

  fillCategories('#finzn-expenses-category', expenses);
  fillCategories('#finzn-incomes-category', incomes);
  renderTable('#finzn-expenses-table tbody', expenses, 'expense');
  renderTable('#finzn-incomes-table  tbody', incomes,  'income');
}

function bindActions(app){
  $('#finzn-open-expenses')?.addEventListener('click', ()=> $('#finzn-expenses-modal')?.setAttribute('aria-hidden','false'));
  $('#finzn-open-incomes')?.addEventListener('click', ()=> $('#finzn-incomes-modal')?.setAttribute('aria-hidden','false'));
  document.addEventListener('click', async (e)=>{
    const close = e.target.closest('[data-close]');
    if (close) { $('#finzn-'+close.getAttribute('data-close')+'-modal')?.setAttribute('aria-hidden','true'); }
    const btn = e.target.closest('button[data-act]'); if(!btn) return;
    const tr = e.target.closest('tr'); const id = tr?.dataset?.id; if(!id) return;
    const dm = app?.data; const kind = btn.dataset.kind;
    if (btn.dataset.act === 'edit'){
      if (kind==='expense'){ app?.ui?.showEditExpenseModal?.(id) || alert('Conectar edición de gasto'); }
      else { app?.ui?.showEditIncomeModal?.(id) || alert('Conectar edición de ingreso'); }
    } else if (btn.dataset.act === 'delete'){
      try{
        if (kind==='expense'){ await dm?.deleteExpense?.(id); }
        else{ await dm?.deleteExtraIncome?.(id) || await dm?.deleteFixedIncome?.(id); }
        await refreshHub(app);
      }catch(e){ console.error(e); alert('No se pudo eliminar.'); }
    }
  });

  async function reFilter(which){
    const dm = app?.data; const cm = dm?.currentMonth || dm?.getCurrentMonth?.();
    let items = which==='expenses'
      ? (dm?.getExpensesForMonth?.(cm) || Object.values(dm?.data?.expenses?.[cm]||{}))
      : (dm?.getIncomesForMonth?.(cm)  || Object.values(dm?.data?.income?.[cm]||{}));
    const filters = {
      from: document.getElementById(`finzn-${which}-from`)?.value || '',
      to:   document.getElementById(`finzn-${which}-to`)?.value   || '',
      cat:  document.getElementById(`finzn-${which}-category`)?.value || '',
      q:    document.getElementById(`finzn-${which}-q`)?.value || ''
    };
    const list = applyFilters(items, filters);
    renderTable(`#finzn-${which}-table tbody`, list, which.slice(0,-1));
  }
  ['expenses','incomes'].forEach(which=>{
    ['from','to','category','q'].forEach(id=>{
      document.getElementById(`finzn-${which}-${id}`)?.addEventListener('input', ()=> reFilter(which));
    });
  });
}

function boot(){
  const root = ensureLayout(); if (!root) return;
  moveExistingBlocks();
  bindActions(window.app);
  refreshHub(window.app);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
