(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))s(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function t(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerPolicy&&(n.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?n.credentials="include":a.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(a){if(a.ep)return;a.ep=!0;const n=t(a);fetch(a.href,n)}})();class v{constructor(){this.baseURL="http://localhost:3001/api"}async login(e,t){try{return(await(await fetch(`${this.baseURL}/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user:e,pass:t})})).json()).ok?(localStorage.setItem("currentUser",e),!0):!1}catch{return console.warn("Server unavailable, using offline mode"),localStorage.setItem("currentUser",e),!0}}async register(e,t){try{return(await(await fetch(`${this.baseURL}/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user:e,pass:t})})).json()).ok}catch{return console.warn("Server unavailable, using offline mode"),!0}}logout(){localStorage.removeItem("currentUser"),Object.keys(localStorage).forEach(t=>{(t.startsWith("finzn-data-")||t.startsWith("objetivosAhorro-"))&&localStorage.removeItem(t)}),window.location.reload()}getCurrentUser(){return localStorage.getItem("currentUser")}isAuthenticated(){return!!this.getCurrentUser()}}class f{constructor(){this.data={expenses:{},income:{},extraIncomes:{},goals:[],categories:this.getDefaultCategories(),achievements:[],recurringExpenses:[],spendingLimits:[],monthlySavings:{}}}getDefaultCategories(){return[{id:"1",name:"Comida",icon:"🍔",color:"#ef4444"},{id:"2",name:"Transporte",icon:"🚗",color:"#3b82f6"},{id:"3",name:"Salud",icon:"💊",color:"#8b5cf6"},{id:"4",name:"Ocio",icon:"🎉",color:"#f59e0b"},{id:"5",name:"Supermercado",icon:"🛒",color:"#10b981"},{id:"6",name:"Servicios",icon:"📱",color:"#6b7280"},{id:"7",name:"Otros",icon:"📦",color:"#9ca3af"}]}async loadUserData(){const e=this.getCurrentUser();if(!e)return;const t=localStorage.getItem(`finzn-data-${e}`);if(t)try{const s=JSON.parse(t);this.data={...this.data,...s},this.data.extraIncomes||(this.data.extraIncomes={}),this.data.income||(this.data.income={}),this.data.expenses||(this.data.expenses={}),this.data.goals||(this.data.goals=[]),this.data.categories||(this.data.categories=this.getDefaultCategories()),this.data.achievements||(this.data.achievements=[]),this.data.recurringExpenses||(this.data.recurringExpenses=[]),this.data.spendingLimits||(this.data.spendingLimits=[]),this.data.monthlySavings||(this.data.monthlySavings={})}catch(s){console.error("Error loading user data:",s)}}saveUserData(){const e=this.getCurrentUser();if(e)try{localStorage.setItem(`finzn-data-${e}`,JSON.stringify(this.data)),console.log("Data saved successfully")}catch(t){console.error("Error saving user data:",t)}}getCurrentUser(){return localStorage.getItem("currentUser")}async addExpense(e){const t=Date.now().toString(),s=e.date;this.data.expenses[s]||(this.data.expenses[s]=[]);const a=e.amount/e.installments;for(let n=0;n<e.installments;n++){const i=this.addMonths(e.date,n);this.data.expenses[i]||(this.data.expenses[i]=[]),this.data.expenses[i].push({id:`${t}-${n}`,description:e.description,amount:a,category:e.category,transactionDate:e.transactionDate,date:i,installment:n+1,totalInstallments:e.installments,recurring:e.recurring&&n===0,originalId:t,originalAmount:e.amount,createdAt:new Date().toISOString()})}e.recurring&&this.data.recurringExpenses.push({id:t,description:e.description,amount:e.amount,category:e.category,startDate:e.date}),this.saveUserData(),this.checkAchievements()}async updateExpense(e,t,s){const a=this.data.expenses[s]||[],n=a.findIndex(o=>o.id===e);if(n===-1)throw new Error("Gasto no encontrado");const i=a[n];if(i.totalInstallments>1){const o=i.originalId;Object.keys(this.data.expenses).forEach(r=>{this.data.expenses[r]=this.data.expenses[r].map(c=>{if(c.originalId===o){const l=t.amount/t.installments;return{...c,description:t.description,amount:l,category:t.category,transactionDate:t.transactionDate,originalAmount:t.amount,totalInstallments:t.installments,recurring:t.recurring}}return c})})}else a[n]={...i,description:t.description,amount:t.amount,category:t.category,transactionDate:t.transactionDate,recurring:t.recurring,originalAmount:t.amount};this.saveUserData()}async deleteExpense(e,t){const s=this.data.expenses[t]||[],a=s.find(n=>n.id===e);if(!a)throw new Error("Gasto no encontrado");if(a.totalInstallments>1){const n=a.originalId;Object.keys(this.data.expenses).forEach(i=>{this.data.expenses[i]=this.data.expenses[i].filter(o=>o.originalId!==n)})}else this.data.expenses[t]=s.filter(n=>n.id!==e);this.saveUserData()}getExpenseById(e,t){return(this.data.expenses[t]||[]).find(a=>a.id===e)}async setFixedIncome(e){const t=new Date().getFullYear();for(let s=1;s<=12;s++){const a=`${t}-${s.toString().padStart(2,"0")}`;this.data.income[a]||(this.data.income[a]={fixed:0,extra:0}),this.data.income[a].fixed=e}this.saveUserData()}async addExtraIncome(e,t){console.log("DataManager: Adding extra income",e,t);const s=Date.now().toString();this.data.extraIncomes[t]||(this.data.extraIncomes[t]=[]),this.data.extraIncomes[t].push({id:s,description:e.description,amount:e.amount,category:e.category,date:t,createdAt:new Date().toISOString()}),this.data.income[t]||(this.data.income[t]={fixed:0,extra:0});const a=this.data.income[t].extra||0;this.data.income[t].extra=a+e.amount,console.log("DataManager: Updated income data",this.data.income[t]),this.saveUserData(),this.checkAchievements()}async addGoal(e){const t=Date.now().toString();this.data.goals.push({id:t,...e,createdAt:new Date().toISOString()}),this.saveUserData(),this.checkAchievements()}async addCategory(e){const t=Date.now().toString();this.data.categories.push({id:t,...e}),this.saveUserData()}async addSpendingLimit(e){const t=this.data.spendingLimits.findIndex(s=>s.category===e.category);if(t!==-1)this.data.spendingLimits[t]={...this.data.spendingLimits[t],...e,updatedAt:new Date().toISOString()};else{const s=Date.now().toString();this.data.spendingLimits.push({id:s,...e,createdAt:new Date().toISOString()})}this.saveUserData()}saveMonthlySavings(e,t){this.data.monthlySavings[e]=t,this.saveUserData()}getMonthlySavings(e){return this.data.monthlySavings[e]||0}getAllMonthlySavings(){return this.data.monthlySavings}getSpendingLimits(){return this.data.spendingLimits||[]}deleteSpendingLimit(e){this.data.spendingLimits=this.data.spendingLimits.filter(t=>t.id!==e),this.saveUserData()}getSpendingLimitForCategory(e){return this.data.spendingLimits.find(t=>t.category===e)}getExpenses(e){return this.data.expenses[e]||[]}getExpensesByCategory(e){const t=this.getExpenses(e),s={};return t.forEach(a=>{const n=a.category||"Otros";s[n]=(s[n]||0)+a.amount}),s}getBalance(e){const t=this.getIncome(e),s=this.getExpenses(e),a=(t.fixed||0)+(t.extra||0),n=s.reduce((o,r)=>o+r.amount,0),i=s.filter(o=>o.totalInstallments>1).length;return{available:a-n,totalIncome:a,totalExpenses:n,installments:i}}getActiveInstallments(e){return this.getExpenses(e).filter(a=>a.totalInstallments>1).map(a=>{const n=a.installment/a.totalInstallments*100,i=a.totalInstallments-a.installment,o=a.amount*i;return{id:a.id,description:a.description,amount:a.amount,originalAmount:a.originalAmount,category:a.category,currentInstallment:a.installment,totalInstallments:a.totalInstallments,progress:Math.round(n),remainingInstallments:i,remainingAmount:o,createdAt:a.createdAt||new Date().toISOString(),monthlyAmount:a.amount}})}getIncome(e){const t=this.data.income[e]||{fixed:0,extra:0};return console.log("DataManager: Getting income for",e,t),t}getExtraIncomes(e){return this.data.extraIncomes[e]||[]}getAllExtraIncomes(){const e=[];return Object.entries(this.data.extraIncomes).forEach(([t,s])=>{s.forEach(a=>{e.push({...a,month:t})})}),e.sort((t,s)=>new Date(s.createdAt)-new Date(t.createdAt))}getGoals(){return this.data.goals}getCategories(){return this.data.categories}getStats(){const e=Object.values(this.data.monthlySavings).reduce((a,n)=>a+n,0),t=Object.values(this.data.expenses).flat(),s=t.length>0?t.reduce((a,n)=>a+n.amount,0)/Object.keys(this.data.expenses).length:0;return{totalSavings:e,monthlyAverage:s}}getAchievements(){return this.data.achievements}getMonthlyTrend(){const e=[],t=new Date;for(let s=5;s>=0;s--){const a=new Date(t.getFullYear(),t.getMonth()-s,1),n=`${a.getFullYear()}-${(a.getMonth()+1).toString().padStart(2,"0")}`,o=this.getExpenses(n).reduce((r,c)=>r+c.amount,0);e.push({month:n,total:o,label:a.toLocaleDateString("es-ES",{month:"short",year:"numeric"})})}return e}async generateReport(e){const t=this.getExpenses(e),s=this.getBalance(e),a=this.getExpensesByCategory(e),n=this.getExtraIncomes(e),i=this.getActiveInstallments(e),o=this.getGoals(),r=[],c=s.totalExpenses;if(Object.entries(a).forEach(([l,d])=>{const m=d/c*100;m>40?r.push(`⚠️ Estás gastando mucho en ${l} (${m.toFixed(1)}%)`):m<5&&r.push(`✅ Buen control en ${l}`)}),s.available<0&&r.push("🚨 Estás gastando más de lo que ingresas este mes"),n.length>0){const l=n.reduce((d,m)=>d+m.amount,0);r.push(`💰 Ingresos extra del mes: $${l.toLocaleString()}`)}return i.length>0&&r.push(`💳 Tienes ${i.length} cuotas activas este mes`),{month:e,balance:s,byCategory:a,recommendations:r,expenses:t,extraIncomes:n,installments:i,goals:o}}async exportToCSV(){const t=[["Fecha","Fecha de Transacción","Descripción","Monto","Categoría","Cuota","Total Cuotas","Monto Original","Fecha de Registro","Tipo"]];return Object.entries(this.data.expenses).forEach(([s,a])=>{a.forEach(n=>{const i=n.createdAt?new Date(n.createdAt).toLocaleDateString("es-ES"):"No disponible",o=n.transactionDate?new Date(n.transactionDate).toLocaleDateString("es-ES"):"No disponible";t.push([s,o,n.description,n.amount.toFixed(2),n.category,n.installment||1,n.totalInstallments||1,(n.originalAmount||n.amount).toFixed(2),i,"Gasto"])})}),Object.entries(this.data.extraIncomes).forEach(([s,a])=>{a.forEach(n=>{const i=n.createdAt?new Date(n.createdAt).toLocaleDateString("es-ES"):"No disponible";t.push([s,s+"-01",n.description,n.amount.toFixed(2),n.category,1,1,n.amount.toFixed(2),i,"Ingreso Extra"])})}),Object.entries(this.data.income).forEach(([s,a])=>{a.fixed>0&&t.push([s,s+"-01","Ingreso Fijo Mensual",a.fixed.toFixed(2),"Ingreso",1,1,a.fixed.toFixed(2),"Automático","Ingreso Fijo"])}),t.map(s=>s.map(a=>`"${a}"`).join(",")).join(`
`)}async importFromCSV(e){const t=e.split(`
`).filter(s=>s.trim());t[0].split(",").map(s=>s.replace(/"/g,""));for(let s=1;s<t.length;s++){const a=t[s].split(",").map(l=>l.replace(/"/g,"")),[n,i,o,r,c]=a;n&&o&&r&&c&&(this.data.expenses[n]||(this.data.expenses[n]=[]),this.data.expenses[n].push({id:Date.now().toString()+Math.random(),description:o,amount:parseFloat(r),category:c,transactionDate:i||n+"-01",date:n,installment:1,totalInstallments:1,createdAt:new Date().toISOString()}))}this.saveUserData()}checkAchievements(){const e=[];Object.values(this.data.expenses).flat().length>=1&&!this.data.achievements.find(o=>o.id==="first-expense")&&e.push({id:"first-expense",title:"🎉 Primer Gasto Registrado",description:"Has registrado tu primer gasto"}),this.data.goals.filter(o=>o.current>=o.target).length>=1&&!this.data.achievements.find(o=>o.id==="first-goal")&&e.push({id:"first-goal",title:"🎯 Primer Objetivo Cumplido",description:"Has completado tu primer objetivo de ahorro"}),Object.keys(this.data.expenses).length>=3&&!this.data.achievements.find(o=>o.id==="consistent-tracking")&&e.push({id:"consistent-tracking",title:"📊 Seguimiento Consistente",description:"Has registrado gastos por 3 meses consecutivos"}),Object.values(this.data.extraIncomes).flat().length>=1&&!this.data.achievements.find(o=>o.id==="first-extra-income")&&e.push({id:"first-extra-income",title:"💰 Primer Ingreso Extra",description:"Has registrado tu primer ingreso extra"}),Object.values(this.data.expenses).flat().filter(o=>o.totalInstallments>1).length>=1&&!this.data.achievements.find(o=>o.id==="first-installment")&&e.push({id:"first-installment",title:"💳 Primera Cuota",description:"Has registrado tu primer gasto en cuotas"}),this.data.achievements.push(...e),e.length>0&&this.saveUserData()}addMonths(e,t){const[s,a]=e.split("-").map(Number),n=new Date(s,a-1+t,1);return`${n.getFullYear()}-${(n.getMonth()+1).toString().padStart(2,"0")}`}getCategoryById(e){return this.data.categories.find(t=>t.id===e)}deleteGoal(e){this.data.goals=this.data.goals.filter(t=>t.id!==e),this.saveUserData()}deleteCategory(e){if(Object.values(this.data.expenses).flat().some(s=>s.category===e))throw new Error("No se puede eliminar una categoría que está siendo utilizada");this.data.categories=this.data.categories.filter(s=>s.id!==e),this.saveUserData()}}class y{constructor(){this.alertContainer=document.getElementById("alert-container"),this.mascotAlertTimeout=null}updateBalance(e){const t=document.getElementById("balance-amount"),s=document.getElementById("monthly-expenses"),a=document.getElementById("active-installments");t&&(t.textContent=this.formatCurrency(e.available)),s&&(s.textContent=this.formatCurrency(e.totalExpenses)),a&&(a.textContent=e.installments)}updateExpensesList(e,t){const s=document.getElementById("expenses-list");if(s){if(s.innerHTML="",e.length===0){s.innerHTML='<p class="text-center text-muted">No hay gastos registrados este mes</p>';return}e.forEach(a=>{const n=document.createElement("div");n.className="expense-item fade-in";const i=this.getCategoryInfo(a.category),o=a.transactionDate?new Date(a.transactionDate).toLocaleDateString("es-ES",{day:"numeric",month:"short"}):"Sin fecha";n.innerHTML=`
        <div class="expense-icon">${i.icon}</div>
        <div class="expense-details">
          <div class="expense-description">${a.description}</div>
          <div class="expense-category">${i.name} • ${o}</div>
          ${a.totalInstallments>1?`<div class="expense-installment">Cuota ${a.installment} de ${a.totalInstallments}</div>`:""}
        </div>
        <div class="expense-amount">${this.formatCurrency(a.amount)}</div>
        <div class="expense-actions">
          <button class="expense-action-btn edit-btn" onclick="window.app.showEditExpenseModal('${a.id}')" title="Editar">
            ✏️
          </button>
          <button class="expense-action-btn delete-btn" onclick="window.app.showDeleteConfirmation('${a.id}', '${a.description}')" title="Eliminar">
            🗑️
          </button>
        </div>
      `,n.style.borderLeftColor=i.color,s.appendChild(n)})}}updateGoalsList(e){const t=document.getElementById("goals-list");if(t){if(t.innerHTML="",e.length===0){t.innerHTML='<p class="text-center text-muted">No hay objetivos creados</p>';return}e.forEach(s=>{const a=Math.min(s.current/s.target*100,100),n=document.createElement("div");n.className="goal-item fade-in",n.innerHTML=`
        <div class="goal-header">
          <div class="goal-name">${s.name}</div>
          <button class="goal-delete" onclick="window.app?.data.deleteGoal('${s.id}'); window.app?.updateUI();">×</button>
        </div>
        <div class="goal-amount">${this.formatCurrency(s.current)} / ${this.formatCurrency(s.target)}</div>
        <div class="goal-progress">
          <div class="goal-progress-bar" style="width: ${a}%"></div>
        </div>
      `,t.appendChild(n)})}}updateGoalsListNew(e){const t=document.getElementById("goals-list-new");if(t){if(t.innerHTML="",e.length===0){t.innerHTML='<p class="text-center text-muted">No hay objetivos creados</p>';return}e.forEach(s=>{const a=Math.min(s.current/s.target*100,100),n=document.createElement("div");n.className="goal-item-new fade-in",n.innerHTML=`
        <div class="goal-info">
          <span class="goal-name">${s.name}</span>
          <span class="goal-percentage">${Math.round(a)}%</span>
        </div>
        <div class="goal-progress-new">
          <div class="goal-progress-bar-new" style="width: ${a}%"></div>
        </div>
      `,t.appendChild(n)})}}showInstallmentsModal(e){const t=document.getElementById("installments-list");if(t){if(t.innerHTML="",e.length===0){t.innerHTML=`
        <div class="installment-item">
          <div class="installment-header">
            <h3 class="installment-title">No hay cuotas activas</h3>
          </div>
          <p style="color: var(--text-secondary); margin: 0;">
            Cuando registres un gasto en cuotas, aparecerá aquí con todos los detalles.
          </p>
        </div>
      `;return}e.forEach(s=>{const a=document.createElement("div");a.className="installment-item fade-in";const n=new Date(s.createdAt).toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric"});a.innerHTML=`
        <div class="installment-header">
          <h3 class="installment-title">${s.description}</h3>
          <div class="installment-amount">${this.formatCurrency(s.monthlyAmount)}</div>
        </div>
        
        <div class="installment-details">
          <div class="installment-detail">
            <div class="installment-detail-label">Categoría</div>
            <div class="installment-detail-value">${s.category}</div>
          </div>
          
          <div class="installment-detail">
            <div class="installment-detail-label">Cuota Actual</div>
            <div class="installment-detail-value">${s.currentInstallment} de ${s.totalInstallments}</div>
          </div>
          
          <div class="installment-detail">
            <div class="installment-detail-label">Monto Original</div>
            <div class="installment-detail-value">${this.formatCurrency(s.originalAmount)}</div>
          </div>
          
          <div class="installment-detail">
            <div class="installment-detail-label">Fecha de Creación</div>
            <div class="installment-detail-value">${n}</div>
          </div>
          
          <div class="installment-detail">
            <div class="installment-detail-label">Cuotas Restantes</div>
            <div class="installment-detail-value">${s.remainingInstallments}</div>
          </div>
          
          <div class="installment-detail">
            <div class="installment-detail-label">Monto Restante</div>
            <div class="installment-detail-value">${this.formatCurrency(s.remainingAmount)}</div>
          </div>
        </div>
        
        <div class="installment-progress">
          <div class="installment-progress-label">Progreso: ${s.progress}%</div>
          <div class="installment-progress-bar">
            <div class="installment-progress-fill" style="width: ${s.progress}%"></div>
          </div>
        </div>
      `,t.appendChild(a)})}}showExtraIncomesModal(e){const t=document.getElementById("extra-incomes-list"),s=document.getElementById("total-extra-incomes"),a=document.getElementById("current-month-extra-incomes");if(!t)return;if(t.innerHTML="",e.length===0){t.innerHTML=`
        <div class="extra-incomes-empty">
          <div class="extra-incomes-empty-icon">✨</div>
          <div class="extra-incomes-empty-title">No hay ingresos extras registrados</div>
          <div class="extra-incomes-empty-description">
            Cuando registres ingresos adicionales como ventas, trabajos freelance o regalos, aparecerán aquí.
          </div>
        </div>
      `,s&&(s.textContent="$0"),a&&(a.textContent="$0");return}const n=this.getCurrentMonth(),i=e.reduce((c,l)=>c+l.amount,0),o=e.filter(c=>c.month===n).reduce((c,l)=>c+l.amount,0);s&&(s.textContent=this.formatCurrency(i)),a&&(a.textContent=this.formatCurrency(o));const r={};e.forEach(c=>{r[c.month]||(r[c.month]=[]),r[c.month].push(c)}),Object.entries(r).sort(([c],[l])=>l.localeCompare(c)).forEach(([c,l])=>{const d=document.createElement("div");d.className="extra-incomes-month-section";const m=l.reduce((h,p)=>h+p.amount,0),g=new Date(c+"-01").toLocaleDateString("es-ES",{year:"numeric",month:"long"});d.innerHTML=`
          <div class="extra-incomes-month-header">
            <h3 class="extra-incomes-month-title">${g}</h3>
            <div class="extra-incomes-month-total">${this.formatCurrency(m)}</div>
          </div>
          <div class="extra-incomes-month-list">
            ${l.map(h=>{const p=new Date(h.createdAt).toLocaleDateString("es-ES",{day:"numeric",month:"short"});return`
                <div class="extra-income-item fade-in">
                  <div class="extra-income-icon">${this.getCategoryIcon(h.category)}</div>
                  <div class="extra-income-details">
                    <div class="extra-income-description">${h.description}</div>
                    <div class="extra-income-category">${h.category}</div>
                    <div class="extra-income-date">${p}</div>
                  </div>
                  <div class="extra-income-amount">${this.formatCurrency(h.amount)}</div>
                </div>
              `}).join("")}
          </div>
        `,t.appendChild(d)})}getCategoryIcon(e){return{Venta:"💰",Regalo:"🎁",Trabajo:"💼",Freelance:"💻",Inversión:"📈",Bono:"🎯",Comisión:"💸",Reembolso:"🔄",Otro:"📦"}[e]||"📦"}getCurrentMonth(){const e=new Date;return`${e.getFullYear()}-${(e.getMonth()+1).toString().padStart(2,"0")}`}updateCategoriesList(e){const t=document.getElementById("categories-list");t&&(t.innerHTML="",e.forEach(s=>{const a=document.createElement("div");a.className="category-item fade-in",a.innerHTML=`
        <div class="category-icon">${s.icon}</div>
        <div class="category-name">${s.name}</div>
        <button class="category-delete" onclick="window.app?.data.deleteCategory('${s.id}'); window.app?.updateUI();">×</button>
      `,t.appendChild(a)}))}updateSpendingLimitsList(e,t){const s=document.getElementById("limits-list");if(s){if(s.innerHTML="",e.length===0){s.innerHTML='<p class="text-center text-muted">No hay límites establecidos</p>';return}e.forEach(a=>{const n=t[a.category]||0,i=a.amount>0?n/a.amount*100:0,o=Math.max(0,a.amount-n);let r="safe",c="✅",l="Dentro del límite";i>=100?(r="exceeded",c="🚨",l="Límite superado"):i>=a.warning&&(r="warning",c="⚠️",l="Cerca del límite");const d=document.createElement("div");d.className=`limit-item fade-in limit-${r}`,d.innerHTML=`
        <div class="limit-header">
          <div class="limit-category">
            <div class="limit-icon">${this.getCategoryInfo(a.category).icon}</div>
            <div class="limit-name">${a.category}</div>
          </div>
          <button class="limit-delete" onclick="window.app?.data.deleteSpendingLimit('${a.id}'); window.app?.updateUI();" title="Eliminar límite">×</button>
        </div>
        
        <div class="limit-amounts">
          <div class="limit-spent">
            <span class="limit-label">Gastado:</span>
            <span class="limit-value">${this.formatCurrency(n)}</span>
          </div>
          <div class="limit-total">
            <span class="limit-label">Límite:</span>
            <span class="limit-value">${this.formatCurrency(a.amount)}</span>
          </div>
          <div class="limit-remaining">
            <span class="limit-label">Disponible:</span>
            <span class="limit-value">${this.formatCurrency(o)}</span>
          </div>
        </div>
        
        <div class="limit-progress">
          <div class="limit-progress-bar">
            <div class="limit-progress-fill limit-progress-${r}" style="width: ${Math.min(i,100)}%"></div>
          </div>
          <div class="limit-percentage">${Math.round(i)}%</div>
        </div>
        
        <div class="limit-status">
          <span class="limit-status-icon">${c}</span>
          <span class="limit-status-text">${l}</span>
          <span class="limit-warning-threshold">Alerta: ${a.warning}%</span>
        </div>
      `,s.appendChild(d)})}}updateSpendingLimitsGrid(e,t){const s=document.getElementById("spending-limits-grid");if(s){if(s.innerHTML="",e.length===0){s.innerHTML=`
        <div class="spending-limits-empty">
          <div class="spending-limits-empty-icon">🎯</div>
          <div class="spending-limits-empty-title">No hay límites establecidos</div>
          <div class="spending-limits-empty-description">
            Establece límites de gasto para cada categoría y mantén el control de tus finanzas.
            <br>Haz clic en "Nuevo Límite" para comenzar.
          </div>
        </div>
      `;return}e.forEach(a=>{const n=t[a.category]||0,i=a.amount>0?n/a.amount*100:0;let o="green";i>=100?o="red":i>=a.warning&&(o="yellow");const r=`
        <div class="limit-traffic-light">
          <div class="lights-container"> 
            <div class="light ${o==="red"?"on red":"off"}"></div>
            <div class="light ${o==="yellow"?"on yellow":"off"}"></div>
            <div class="light ${o==="green"?"on green":"off"}"></div>
          </div>
          <div class="light-label">${Math.round(i)}%</div>
        </div>
      `;Math.max(0,a.amount-n);let c="safe",l="✅",d="Dentro del límite";i>=100?(c="danger",l="🚨",d="Límite superado"):i>=a.warning&&(c="warning",l="⚠️",d="Cerca del límite");const m=this.getCategoryInfo(a.category),g=document.createElement("div");g.className=`spending-limit-card limit-${c} fade-in`,g.innerHTML=`
        <div class="limit-card-header">
          <div class="limit-category-info">
            <div class="limit-category-icon">${m.icon}</div>
            <div class="limit-category-name">${a.category}</div>
          </div>
          <button class="limit-delete-btn" onclick="window.app?.data.deleteSpendingLimit('${a.id}'); window.app?.updateUI();" title="Eliminar límite">
            ×
          </button>
        </div>
        
        <div class="limit-amounts-grid">
          <div class="limit-amount-item">
            <div class="limit-amount-label">Gastado</div>
            <div class="limit-amount-value spent">${this.formatCurrency(n)}</div>
          </div>
          <div class="limit-amount-item">
            <div class="limit-amount-label">Límite</div>
            <div class="limit-amount-value">${this.formatCurrency(a.amount)}</div>
          </div>
        </div>
        
        <div class="limit-progress-container">
          <div class="limit-progress-header">
            <div class="limit-progress-label">Progreso</div>
            <div class="limit-progress-percentage">${Math.round(i)}%</div>
          </div>
          <div class="limit-progress-bar-container">
            <div class="limit-progress-bar-animated ${c}" style="width: 0%" data-width="${Math.min(i,100)}%"></div>
          </div>
        </div>
        
        <div class="limit-status-badge ${c}">
          <span>${l}</span>
          <span>${d}</span>
        </div>
        
        <div class="limit-warning-threshold">
          Alerta configurada al ${a.warning}%
        </div>
        ${r}
      `,s.appendChild(g)}),setTimeout(()=>{s.querySelectorAll(".limit-progress-bar-animated").forEach(n=>{const i=n.getAttribute("data-width");n.style.width=i})},100)}}updateLimitCategoryOptions(e){const t=document.getElementById("limit-category");t&&(t.innerHTML='<option value="">Selecciona una categoría</option>',e.forEach(s=>{const a=document.createElement("option");a.value=s.name,a.textContent=`${s.icon} ${s.name}`,t.appendChild(a)}))}updateCategoryOptions(e){const t=document.getElementById("expense-category");t&&(t.innerHTML='<option value="">Selecciona una categoría</option>',e.forEach(s=>{const a=document.createElement("option");a.value=s.name,a.textContent=`${s.icon} ${s.name}`,t.appendChild(a)}))}updateIncomeDisplay(e){const t=document.getElementById("fixed-income-amount"),s=document.getElementById("extra-income-amount");t&&(t.textContent=this.formatCurrency(e.fixed||0)),s&&(s.textContent=this.formatCurrency(e.extra||0))}updateStats(e){const t=document.getElementById("total-savings"),s=document.getElementById("monthly-average");t&&(t.textContent=this.formatCurrency(e.totalSavings)),s&&(s.textContent=this.formatCurrency(e.monthlyAverage)),e.totalSavings>0&&console.log(`💰 Total de ahorros acumulados: ${this.formatCurrency(e.totalSavings)}`)}updateAchievements(e){const t=document.getElementById("achievements-list");if(t){if(t.innerHTML="",e.length===0){t.innerHTML='<p class="text-center text-muted">No hay logros desbloqueados</p>';return}e.forEach(s=>{const a=document.createElement("div");a.className="achievement-item fade-in",a.innerHTML=`
        <div>${s.title}</div>
      `,t.appendChild(a)})}}filterExpenses(e){document.querySelectorAll(".expense-item").forEach(s=>{var i,o;const a=((i=s.querySelector(".expense-description"))==null?void 0:i.textContent.toLowerCase())||"",n=((o=s.querySelector(".expense-category"))==null?void 0:o.textContent.toLowerCase())||"";a.includes(e)||n.includes(e)?s.style.display="flex":s.style.display="none"})}showMascotAlert(e,t="warning"){const s=document.getElementById("mascot-alert"),a=document.getElementById("mascot-alert-text");if(!s||!a)return;this.mascotAlertTimeout&&clearTimeout(this.mascotAlertTimeout),a.textContent=e,s.className=`mascot-alert mascot-alert-${t}`;const n=document.querySelector(".finzn-mascot-dashboard img");n&&(n.classList.add("mascot-bounce"),setTimeout(()=>n.classList.remove("mascot-bounce"),1e3));const i=t==="danger"?12e3:8e3;this.mascotAlertTimeout=setTimeout(()=>{s.classList.add("hidden")},i)}showAlert(e,t="info"){const s=document.createElement("div");s.className=`alert alert-${t}`,s.textContent=e,this.alertContainer.appendChild(s),setTimeout(()=>s.classList.add("show"),100),setTimeout(()=>{s.classList.remove("show"),setTimeout(()=>{s.parentNode&&s.parentNode.removeChild(s)},300)},5e3)}formatCurrency(e){return new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",minimumFractionDigits:0,maximumFractionDigits:0}).format(e)}getCategoryInfo(e){const t={Comida:{icon:"🍔",color:"#ef4444"},Transporte:{icon:"🚗",color:"#3b82f6"},Salud:{icon:"💊",color:"#8b5cf6"},Ocio:{icon:"🎉",color:"#f59e0b"},Supermercado:{icon:"🛒",color:"#10b981"},Servicios:{icon:"📱",color:"#6b7280"},Otros:{icon:"📦",color:"#9ca3af"}};return t[e]||t.Otros}}class E{constructor(){this.expensesChart=null,this.trendChart=null}updateExpensesChart(e){const t=document.getElementById("expenses-chart");if(!t)return;this.expensesChart&&this.expensesChart.destroy();const s=Object.keys(e),a=Object.values(e),n=this.generateColors(s.length);this.expensesChart=new Chart(t,{type:"doughnut",data:{labels:s,datasets:[{data:a,backgroundColor:n,borderWidth:0,hoverOffset:4}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:"bottom",labels:{padding:20,usePointStyle:!0,font:{size:12}}},tooltip:{callbacks:{label:i=>{const o=i.label||"",r=i.raw||0,c=i.dataset.data.reduce((d,m)=>d+m,0),l=(r/c*100).toFixed(1);return`${o}: $${r.toLocaleString()} (${l}%)`}}}},cutout:"60%"}})}updateTrendChart(e){const t=document.getElementById("trend-chart");if(!t)return;this.trendChart&&this.trendChart.destroy();const s=e.map(n=>n.label),a=e.map(n=>n.total);this.trendChart=new Chart(t,{type:"line",data:{labels:s,datasets:[{label:"Gastos Mensuales",data:a,borderColor:"#6366f1",backgroundColor:"rgba(99, 102, 241, 0.1)",borderWidth:3,fill:!0,tension:.4,pointBackgroundColor:"#6366f1",pointBorderColor:"#ffffff",pointBorderWidth:2,pointRadius:6,pointHoverRadius:8}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1},tooltip:{mode:"index",intersect:!1,backgroundColor:"rgba(0, 0, 0, 0.8)",titleColor:"#ffffff",bodyColor:"#ffffff",borderColor:"#6366f1",borderWidth:1,callbacks:{label:n=>`Gastos: $${n.raw.toLocaleString()}`}}},scales:{x:{grid:{display:!1},ticks:{font:{size:12}}},y:{beginAtZero:!0,grid:{color:"rgba(0, 0, 0, 0.1)"},ticks:{font:{size:12},callback:function(n){return"$"+n.toLocaleString()}}}},interaction:{intersect:!1,mode:"index"}}})}generateColors(e){const t=["#ef4444","#3b82f6","#8b5cf6","#f59e0b","#10b981","#6b7280","#9ca3af","#f97316","#06b6d4","#84cc16"],s=[];for(let a=0;a<e;a++)s.push(t[a%t.length]);return s}destroy(){this.expensesChart&&this.expensesChart.destroy(),this.trendChart&&this.trendChart.destroy()}}class x{constructor(){this.modals=new Map}init(){document.querySelectorAll(".modal").forEach(t=>{this.modals.set(t.id,t),t.addEventListener("click",n=>{n.target===t&&this.hide(t.id)});const s=t.querySelector(".modal-close");s&&s.addEventListener("click",()=>this.hide(t.id));const a=t.querySelector(".modal-cancel");a&&a.addEventListener("click",()=>this.hide(t.id))}),document.addEventListener("keydown",t=>{t.key==="Escape"&&this.hideAll()})}show(e){console.log("ModalManager: Showing modal",e);const t=this.modals.get(e);if(t){t.classList.add("active"),document.body.style.overflow="hidden";const s=t.querySelector("input, select, textarea");s&&setTimeout(()=>s.focus(),100),console.log("ModalManager: Modal shown successfully")}else console.error("ModalManager: Modal not found",e)}hide(e){console.log("ModalManager: Hiding modal",e);const t=this.modals.get(e);if(t){t.classList.remove("active"),document.body.style.overflow="";const s=t.querySelector("form");s&&s.reset()}}hideAll(){this.modals.forEach((e,t)=>{this.hide(t)})}isOpen(e){const t=this.modals.get(e);return t?t.classList.contains("active"):!1}}class b{constructor(){this.isOpen=!1,this.messages=[],this.isTyping=!1,this.retryCount=0,this.maxRetries=3}init(){const e=document.getElementById("chat-toggle"),t=document.getElementById("chat-window"),s=document.getElementById("chat-close"),a=document.getElementById("chat-form"),n=document.getElementById("chat-input");if(!e||!t||!s||!a||!n){console.error("Chat elements not found");return}e.addEventListener("click",()=>this.toggle()),s.addEventListener("click",()=>this.close()),a.addEventListener("submit",i=>this.sendMessage(i)),n.addEventListener("keydown",i=>{i.key==="Escape"&&this.close()}),this.addMessage("¡Hola! 👋 Soy tu asistente financiero FINZN. Puedo ayudarte con:","assistant"),this.addMessage(`💰 Consejos de ahorro
📊 Presupuestos
💳 Manejo de deudas
📈 Inversiones básicas
🚨 Fondos de emergencia`,"assistant"),this.addMessage("¿En qué puedo ayudarte hoy?","assistant")}toggle(){var t;const e=document.getElementById("chat-window");e&&(this.isOpen=!this.isOpen,this.isOpen?(e.classList.remove("hidden"),(t=document.getElementById("chat-input"))==null||t.focus(),this.scrollToBottom()):e.classList.add("hidden"))}close(){this.isOpen=!1;const e=document.getElementById("chat-window");e&&e.classList.add("hidden")}async sendMessage(e){if(e.preventDefault(),this.isTyping)return;const t=document.getElementById("chat-input");if(!t)return;const s=t.value.trim();if(s){this.addMessage(s,"user"),t.value="",t.disabled=!0,this.addTypingIndicator(),this.isTyping=!0;try{const a=await this.fetchWithRetry("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:s})});if(!a.ok)throw new Error(`HTTP ${a.status}: ${a.statusText}`);const n=await a.json();this.removeTypingIndicator(),n.reply?(this.addMessage(n.reply,"assistant"),this.retryCount=0):this.addMessage("Lo siento, no pude procesar tu mensaje. ¿Podrías reformularlo?","assistant")}catch(a){console.error("Chat error:",a),this.removeTypingIndicator();let n="Lo siento, hay un problema de conexión.";a.message.includes("Failed to fetch")?n="🔌 Sin conexión al servidor. Verifica tu conexión a internet.":a.message.includes("429")?n="⏰ Demasiadas consultas. Espera un momento antes de intentar de nuevo.":a.message.includes("500")&&(n="🤖 El asistente está teniendo problemas. Intenta de nuevo en unos minutos."),this.addMessage(n,"assistant"),this.retryCount<this.maxRetries&&setTimeout(()=>{this.addMessage("¿Quieres que intente responder de nuevo? Escribe tu pregunta otra vez.","assistant")},2e3)}finally{this.isTyping=!1,t.disabled=!1,t.focus()}}}async fetchWithRetry(e,t,s=3){const n=`${window.location.origin.includes("localhost")?"http://localhost:3001":window.location.origin}${e}`;for(let i=0;i<s;i++)try{return await fetch(n,{...t,timeout:3e4})}catch(o){if(i===s-1)throw o;await new Promise(r=>setTimeout(r,Math.pow(2,i)*1e3))}}addMessage(e,t){const s=document.getElementById("chat-messages");if(!s)return;const a=document.createElement("div");a.className=`chat-message ${t}`,t==="assistant"?a.innerHTML=`
        <div class="chat-avatar">
          <img src="/robot-chat.png" alt="FINZN" class="chat-avatar-img" />
        </div>
        <div class="chat-text">${this.formatMessage(e)}</div>
      `:a.innerHTML=`
        <div class="chat-text user-text">${this.escapeHtml(e)}</div>
        <div class="chat-avatar user-avatar">
          <div class="user-avatar-icon">👤</div>
        </div>
      `,s.appendChild(a),this.scrollToBottom(),setTimeout(()=>{a.classList.add("fade-in")},50),this.messages.push({text:e,sender:t,timestamp:new Date})}formatMessage(e){let t=this.escapeHtml(e).replace(/\n/g,"<br>");return t=t.replace(/([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu,'<span class="emoji">$1</span>'),t=t.replace(/(\$[\d,]+)/g,'<strong class="currency">$1</strong>'),t=t.replace(/(\d+%)/g,'<strong class="percentage">$1</strong>'),t}escapeHtml(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}addTypingIndicator(){const e=document.getElementById("chat-messages");if(!e)return;const t=document.createElement("div");t.className="chat-message assistant typing-indicator",t.id="typing-indicator",t.innerHTML=`
      <div class="chat-avatar">
        <img src="/robot-chat.png" alt="FINZN" class="chat-avatar-img" />
      </div>
      <div class="chat-text">
        <div class="typing-animation">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
        <span class="typing-text">Pensando...</span>
      </div>
    `,e.appendChild(t),this.scrollToBottom()}removeTypingIndicator(){const e=document.getElementById("typing-indicator");e&&e.remove()}scrollToBottom(){const e=document.getElementById("chat-messages");e&&setTimeout(()=>{e.scrollTop=e.scrollHeight},100)}clearHistory(){const e=document.getElementById("chat-messages");e&&(e.innerHTML=""),this.messages=[],this.addMessage("¡Hola! Soy tu asistente financiero. ¿En qué puedo ayudarte?","assistant")}getHistory(){return this.messages}exportChat(){const e={messages:this.messages,exportDate:new Date().toISOString(),version:"1.0"},t=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),s=URL.createObjectURL(t),a=document.createElement("a");a.href=s,a.download=`finzn-chat-${new Date().toISOString().split("T")[0]}.json`,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(s)}}class I{constructor(){this.aiAnalysisCache=new Map,this.cacheTimeout=5*60*1e3}async generate(e){const t=document.getElementById("report-content");if(t){t.innerHTML="",this.showLoadingState(t);try{const s=await Promise.race([this.generateAIAnalysis(e),new Promise((a,n)=>setTimeout(()=>n(new Error("AI analysis timeout")),15e3))]);t.innerHTML="",this.renderFullReport(t,e,s)}catch(s){console.error("Error generating AI analysis:",s),t.innerHTML="",this.generateFallbackReport(e,t)}this.setupDownload(e)}}showLoadingState(e){e.innerHTML=`
      <div class="report-loading">
        <div class="loading-spinner"></div>
        <h3>🤖 Generando análisis inteligente...</h3>
        <p>Analizando tus datos financieros para crear un informe personalizado.</p>
        <div class="loading-progress">
          <div class="loading-bar"></div>
        </div>
      </div>
    `}async generateAIAnalysis(e){const t=this.generateCacheKey(e),s=this.aiAnalysisCache.get(t);if(s&&Date.now()-s.timestamp<this.cacheTimeout)return s.data;try{const a=this.buildAnalysisPrompt(e),n=window.location.origin.includes("localhost")?"http://localhost:3001":window.location.origin,i=await fetch(`${n}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:a})});if(!i.ok)throw new Error(`HTTP ${i.status}: ${i.statusText}`);const o=await i.json();if(!o.reply)throw new Error("Empty AI response");const r=this.parseAIResponse(o.reply,e);return this.aiAnalysisCache.set(t,{data:r,timestamp:Date.now()}),r}catch(a){return console.error("AI Analysis error:",a),this.generateFallbackAnalysis(e)}}buildAnalysisPrompt(e){var i;const t=e.balance.totalIncome,s=e.balance.totalExpenses,a=this.calculateSavingsRate(e),n=Object.entries(e.byCategory).sort(([,o],[,r])=>r-o).slice(0,3).map(([o,r])=>`${o}: ${this.formatCurrency(r)}`);return`Analiza estos datos financieros y proporciona un análisis estructurado:

DATOS FINANCIEROS DEL MES:
- Ingresos totales: ${this.formatCurrency(t)}
- Gastos totales: ${this.formatCurrency(s)}
- Balance disponible: ${this.formatCurrency(e.balance.available)}
- Tasa de ahorro: ${a}%
- Cuotas activas: ${e.balance.installments}

PRINCIPALES CATEGORÍAS DE GASTO:
${n.join(`
`)}

INGRESOS EXTRA: ${((i=e.extraIncomes)==null?void 0:i.length)||0} registros este mes

Por favor proporciona un análisis con:
1. Puntaje de salud financiera (0-100)
2. Tres fortalezas principales
3. Tres áreas de mejora específicas
4. Cinco recomendaciones prácticas
5. Tendencia proyectada (positiva/estable/negativa)
6. Nivel de riesgo (Bajo/Medio/Alto)

Responde de manera estructurada y práctica en español.`}parseAIResponse(e,t){return{healthScore:this.extractHealthScore(e)||this.calculateHealthScore(t),strengths:this.extractListItems(e,["fortaleza","punto fuerte","aspecto positivo"])||this.generateFallbackStrengths(t),improvements:this.extractListItems(e,["mejora","área de mejora","oportunidad"])||this.generateFallbackImprovements(t),recommendations:this.extractListItems(e,["recomendación","consejo","sugerencia"])||this.generateFallbackRecommendations(t),trend:this.extractTrend(e)||"estable",riskLevel:this.extractRiskLevel(e)||this.calculateRiskLevel(t),summary:this.extractSummary(e)||this.generateFallbackSummary(t),rawResponse:e}}extractHealthScore(e){const t=[/(?:puntaje|score|puntuación|salud).*?(\d{1,3})/i,/(\d{1,3}).*?(?:puntos|%|puntaje)/i,/(\d{1,3})\/100/i];for(const s of t){const a=e.match(s);if(a){const n=parseInt(a[1]);if(n>=0&&n<=100)return n}}return null}extractListItems(e,t){for(const a of t){const n=new RegExp(`${a}[^:]*:([^\\n]*(?:\\n(?!\\d+\\.|[A-Z]|${t.join("|")}).*)*)`,"i"),i=e.match(n);if(i){const o=i[1].split(/\d+\.|\n-|\n•|\n\*/).map(r=>r.trim()).filter(r=>r.length>10&&r.length<200).slice(0,5);if(o.length>0)return o}}const s=e.match(/\d+\.\s*([^\n]+)/g);return s&&s.length>=3?s.map(a=>a.replace(/^\d+\.\s*/,"").trim()).filter(a=>a.length>10).slice(0,5):null}extractTrend(e){return/positiv|mejora|crec|favorable|buena|ascendente/i.test(e)?"positiva":/negativ|declin|baj|desfavorable|mala|descendente|preocupante/i.test(e)?"negativa":"estable"}extractRiskLevel(e){return/alto|elevado|crítico|peligroso|grave/i.test(e)?"Alto":/medio|moderado|intermedio/i.test(e)?"Medio":"Bajo"}extractSummary(e){var s;const t=e.split(/[.!?]+/).filter(a=>a.trim().length>20);return t.length>=2?t.slice(0,2).join(". ").trim()+".":((s=t[0])==null?void 0:s.trim())+"."||""}calculateHealthScore(e){let t=50;const s=this.calculateSavingsRate(e);if(s>=20?t+=40:s>=10?t+=30:s>=5?t+=20:s>0?t+=10:t-=20,e.balance.available>0){const n=e.balance.available/e.balance.totalIncome;t+=Math.min(n*100,30)}else t-=30;const a=Object.keys(e.byCategory).length;return t+=Math.min(a*3,20),Math.min(Math.max(Math.round(t),0),100)}calculateSavingsRate(e){return e.balance.totalIncome===0?0:Math.round(e.balance.available/e.balance.totalIncome*100)}calculateRiskLevel(e){const t=this.calculateSavingsRate(e);return t<0?"Alto":t<10?"Medio":"Bajo"}generateFallbackAnalysis(e){return{healthScore:this.calculateHealthScore(e),strengths:this.generateFallbackStrengths(e),improvements:this.generateFallbackImprovements(e),recommendations:this.generateFallbackRecommendations(e),trend:"estable",riskLevel:this.calculateRiskLevel(e),summary:this.generateFallbackSummary(e)}}generateFallbackStrengths(e){var a;const t=[],s=this.calculateSavingsRate(e);return s>0&&t.push(`Mantienes un balance positivo con ${s}% de tasa de ahorro`),Object.keys(e.byCategory).length>=4&&t.push("Tienes gastos diversificados en múltiples categorías"),((a=e.extraIncomes)==null?void 0:a.length)>0&&t.push("Generas ingresos adicionales fuera de tu ingreso fijo"),e.balance.installments<=2&&t.push("Mantienes un número controlado de cuotas activas"),t.length>0?t:["Estás registrando tus gastos de manera consistente"]}generateFallbackImprovements(e){const t=[];this.calculateSavingsRate(e)<10&&t.push("Incrementar la tasa de ahorro mensual al menos al 10%");const a=Object.entries(e.byCategory).sort(([,n],[,i])=>i-n)[0];return a&&a[1]/e.balance.totalExpenses>.4&&t.push(`Reducir gastos en ${a[0]} que representa un alto porcentaje del total`),e.balance.installments>3&&t.push("Considerar reducir el número de cuotas activas para mayor flexibilidad"),Object.keys(e.byCategory).length<3&&t.push("Diversificar las categorías de gasto para mejor control"),t.length>0?t:["Establecer objetivos de ahorro específicos y medibles"]}generateFallbackRecommendations(e){return["Establece un presupuesto mensual específico para cada categoría de gasto","Crea un fondo de emergencia equivalente a 3-6 meses de gastos básicos","Revisa y optimiza tus gastos recurrentes cada mes","Busca oportunidades para generar ingresos adicionales","Automatiza tus ahorros para alcanzar objetivos más fácilmente"]}generateFallbackSummary(e){const t=this.calculateSavingsRate(e),s=t>0?"positiva":"que requiere atención";return`Tu situación financiera muestra una tasa de ahorro del ${t}%, lo cual es ${s}. ${t>0?"Continúa con estos buenos hábitos":"Considera ajustar tus gastos"} para mejorar tu estabilidad financiera.`}renderFullReport(e,t,s){const a=this.createExecutiveSummary(t,s);e.appendChild(a);const n=this.createHealthScoreSection(t,s);e.appendChild(n);const i=this.createFinancialSummarySection(t);e.appendChild(i);const o=this.createCategoryAnalysisSection(t);e.appendChild(o);const r=this.createRecommendationsSection(s);if(e.appendChild(r),t.goals&&t.goals.length>0){const c=this.createGoalsSection(t.goals);e.appendChild(c)}if(t.installments&&t.installments.length>0){const c=this.createInstallmentsSection(t.installments);e.appendChild(c)}if(t.extraIncomes&&t.extraIncomes.length>0){const c=this.createExtraIncomeSection(t.extraIncomes);e.appendChild(c)}}createExecutiveSummary(e,t){const s=document.createElement("div");return s.className="report-section executive-summary",s.innerHTML=`
      <div class="executive-header">
        <h2>🎯 Resumen Ejecutivo</h2>
        <div class="report-date">${new Date().toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric"})}</div>
      </div>
      
      <div class="executive-content">
        <div class="executive-summary-text">
          <p>${t.summary}</p>
        </div>
        
        <div class="key-metrics">
          <div class="metric-card">
            <div class="metric-icon">💰</div>
            <div class="metric-content">
              <div class="metric-label">Balance Disponible</div>
              <div class="metric-value ${e.balance.available>=0?"positive":"negative"}">
                ${this.formatCurrency(e.balance.available)}
              </div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">📈</div>
            <div class="metric-content">
              <div class="metric-label">Tasa de Ahorro</div>
              <div class="metric-value">${this.calculateSavingsRate(e)}%</div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">⚡</div>
            <div class="metric-content">
              <div class="metric-label">Tendencia</div>
              <div class="metric-value trend-${t.trend}">${t.trend}</div>
            </div>
          </div>
        </div>
      </div>
    `,s}createHealthScoreSection(e,t){const s=document.createElement("div");s.className="report-section health-score-section";const a=this.getScoreColor(t.healthScore),n=this.getScoreLevel(t.healthScore);return s.innerHTML=`
      <h3>🏥 Salud Financiera</h3>
      
      <div class="health-score-container">
        <div class="health-score-circle">
          <div class="score-circle" style="--score: ${t.healthScore}; --color: ${a}">
            <div class="score-number">${t.healthScore}</div>
            <div class="score-label">${n}</div>
          </div>
        </div>
        
        <div class="health-details">
          <div class="health-category">
            <h4>💪 Fortalezas</h4>
            <ul>
              ${t.strengths.map(i=>`<li>${i}</li>`).join("")}
            </ul>
          </div>
          
          <div class="health-category">
            <h4>🎯 Áreas de Mejora</h4>
            <ul>
              ${t.improvements.map(i=>`<li>${i}</li>`).join("")}
            </ul>
          </div>
          
          <div class="risk-indicator">
            <div class="risk-label">Nivel de Riesgo:</div>
            <div class="risk-badge risk-${t.riskLevel.toLowerCase()}">${t.riskLevel}</div>
          </div>
        </div>
      </div>
    `,s}createFinancialSummarySection(e){const t=document.createElement("div");return t.className="report-section financial-summary",t.innerHTML=`
      <h3>📊 Resumen Financiero</h3>
      
      <div class="financial-grid">
        <div class="financial-item">
          <div class="financial-label">Ingresos Totales</div>
          <div class="financial-value positive">${this.formatCurrency(e.balance.totalIncome)}</div>
        </div>
        
        <div class="financial-item">
          <div class="financial-label">Gastos Totales</div>
          <div class="financial-value negative">${this.formatCurrency(e.balance.totalExpenses)}</div>
        </div>
        
        <div class="financial-item">
          <div class="financial-label">Balance Disponible</div>
          <div class="financial-value ${e.balance.available>=0?"positive":"negative"}">
            ${this.formatCurrency(e.balance.available)}
          </div>
        </div>
        
        <div class="financial-item">
          <div class="financial-label">Tasa de Ahorro</div>
          <div class="financial-value">${this.calculateSavingsRate(e)}%</div>
        </div>
        
        <div class="financial-item">
          <div class="financial-label">Cuotas Activas</div>
          <div class="financial-value">${e.balance.installments}</div>
        </div>
        
        <div class="financial-item">
          <div class="financial-label">Categorías de Gasto</div>
          <div class="financial-value">${Object.keys(e.byCategory).length}</div>
        </div>
      </div>
    `,t}createCategoryAnalysisSection(e){const t=document.createElement("div");t.className="report-section category-analysis";const s=Object.values(e.byCategory).reduce((n,i)=>n+i,0),a=Object.entries(e.byCategory).sort(([,n],[,i])=>i-n);return t.innerHTML=`
      <h3>💳 Análisis por Categorías</h3>
      
      <div class="category-breakdown">
        ${a.map(([n,i])=>{const o=s>0?(i/s*100).toFixed(1):0,r=o>30,c=o>15;return`
            <div class="category-item-detailed ${r?"high-spending":c?"medium-spending":""}">
              <div class="category-header">
                <div class="category-name">${n}</div>
                <div class="category-amount">${this.formatCurrency(i)}</div>
              </div>
              <div class="category-bar">
                <div class="category-fill" style="width: ${o}%"></div>
              </div>
              <div class="category-details">
                <span class="category-percentage">${o}% del total</span>
                ${r?'<span class="category-warning">⚠️ Alto gasto</span>':""}
                ${c?'<span class="category-info">ℹ️ Gasto moderado</span>':""}
              </div>
            </div>
          `}).join("")}
      </div>
    `,t}createRecommendationsSection(e){const t=document.createElement("div");return t.className="report-section recommendations",t.innerHTML=`
      <h3>🤖 Recomendaciones Personalizadas</h3>
      
      <div class="recommendations-intro">
        <p>Basado en el análisis de tus patrones financieros:</p>
      </div>
      
      <div class="recommendations-list">
        ${e.recommendations.map((s,a)=>`
          <div class="recommendation-item">
            <div class="recommendation-number">${a+1}</div>
            <div class="recommendation-content">
              <div class="recommendation-text">${s}</div>
              <div class="recommendation-priority ${this.getRecommendationPriority(a)}">
                ${this.getRecommendationPriorityText(a)}
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    `,t}createGoalsSection(e){const t=document.createElement("div");return t.className="report-section goals-section",t.innerHTML=`
      <h3>🎯 Objetivos de Ahorro</h3>
      
      <div class="goals-grid">
        ${e.map(s=>{const a=Math.min(s.current/s.target*100,100);return`
            <div class="goal-item-report">
              <div class="goal-name">${s.name}</div>
              <div class="goal-progress-container">
                <div class="goal-progress-bar">
                  <div class="goal-progress-fill" style="width: ${a}%"></div>
                </div>
                <div class="goal-progress-text">${Math.round(a)}%</div>
              </div>
              <div class="goal-amounts">
                <span>${this.formatCurrency(s.current)}</span>
                <span>de ${this.formatCurrency(s.target)}</span>
              </div>
            </div>
          `}).join("")}
      </div>
    `,t}createInstallmentsSection(e){const t=document.createElement("div");t.className="report-section installments-section";const s=e.reduce((a,n)=>a+n.remainingAmount,0);return t.innerHTML=`
      <h3>💳 Cuotas Activas</h3>
      
      <div class="installments-summary">
        <div class="installments-stat">
          <div class="stat-label">Total de Cuotas</div>
          <div class="stat-value">${e.length}</div>
        </div>
        <div class="installments-stat">
          <div class="stat-label">Monto Restante</div>
          <div class="stat-value">${this.formatCurrency(s)}</div>
        </div>
      </div>
      
      <div class="installments-list">
        ${e.map(a=>`
          <div class="installment-item-report">
            <div class="installment-description">${a.description}</div>
            <div class="installment-progress">
              <div class="installment-progress-bar">
                <div class="installment-progress-fill" style="width: ${a.progress}%"></div>
              </div>
              <div class="installment-progress-text">
                ${a.currentInstallment}/${a.totalInstallments} (${a.progress}%)
              </div>
            </div>
            <div class="installment-amount">${this.formatCurrency(a.monthlyAmount)}/mes</div>
          </div>
        `).join("")}
      </div>
    `,t}createExtraIncomeSection(e){const t=document.createElement("div");t.className="report-section extra-income-section";const s=e.reduce((a,n)=>a+n.amount,0);return t.innerHTML=`
      <h3>✨ Ingresos Extras</h3>
      
      <div class="extra-income-summary">
        <div class="extra-income-stat">
          <div class="stat-label">Total de Ingresos Extras</div>
          <div class="stat-value">${this.formatCurrency(s)}</div>
        </div>
        <div class="extra-income-stat">
          <div class="stat-label">Número de Ingresos</div>
          <div class="stat-value">${e.length}</div>
        </div>
      </div>
      
      <div class="extra-income-list">
        ${e.map(a=>`
          <div class="extra-income-item-report">
            <div class="extra-income-description">${a.description}</div>
            <div class="extra-income-category">${a.category}</div>
            <div class="extra-income-amount">${this.formatCurrency(a.amount)}</div>
          </div>
        `).join("")}
      </div>
    `,t}generateFallbackReport(e,t){t.innerHTML=`
      <div class="fallback-report">
        <div class="fallback-header">
          <h2>📊 Informe Financiero</h2>
          <p>Análisis básico de tus finanzas del mes</p>
        </div>
      </div>
    `;const s=this.createFinancialSummarySection(e);t.appendChild(s);const a=this.createCategoryAnalysisSection(e);t.appendChild(a);const n=this.createBasicRecommendationsSection(e);t.appendChild(n)}createBasicRecommendationsSection(e){const t=document.createElement("div");t.className="report-section basic-recommendations";const s=this.generateFallbackRecommendations(e);return t.innerHTML=`
      <h3>💡 Recomendaciones Básicas</h3>
      
      <div class="basic-recommendations-list">
        ${s.map((a,n)=>`
          <div class="basic-recommendation-item">
            <div class="basic-recommendation-number">${n+1}</div>
            <div class="basic-recommendation-text">${a}</div>
          </div>
        `).join("")}
      </div>
    `,t}getScoreColor(e){return e>=80?"#10b981":e>=60?"#f59e0b":e>=40?"#ef4444":"#dc2626"}getScoreLevel(e){return e>=80?"Excelente":e>=60?"Buena":e>=40?"Regular":"Necesita Mejora"}getRecommendationPriority(e){return e<2?"high":e<4?"medium":"low"}getRecommendationPriorityText(e){return e<2?"Prioridad Alta":e<4?"Prioridad Media":"Prioridad Baja"}generateCacheKey(e){return`${e.month}-${e.balance.totalIncome}-${e.balance.totalExpenses}-${Object.keys(e.byCategory).length}-${Date.now()}`}setupDownload(e){const t=document.getElementById("download-report-btn");t&&(t.onclick=()=>this.downloadReport(e))}downloadReport(e){const t=document.getElementById("report-content");if(!t)return;const s=this.generateHTMLReport(e,t);this.downloadFile(s,`informe-financiero-${e.month}.html`,"text/html")}generateHTMLReport(e,t){return`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informe Financiero FINZN - ${e.month}</title>
    <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background: #f8fafc; 
          line-height: 1.6;
        }
        .report-container { 
          max-width: 1200px; 
          margin: 0 auto; 
          background: white; 
          padding: 40px; 
          border-radius: 12px; 
          box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
        }
        .report-header { 
          text-align: center; 
          margin-bottom: 40px; 
          border-bottom: 2px solid #e2e8f0; 
          padding-bottom: 20px; 
        }
        .report-title { 
          color: #1a202c; 
          font-size: 2.5rem; 
          margin: 0; 
        }
        .report-subtitle { 
          color: #718096; 
          font-size: 1.2rem; 
          margin: 10px 0 0 0; 
        }
        .report-section { 
          margin-bottom: 40px; 
          page-break-inside: avoid;
        }
        .report-section h3 { 
          color: #2d3748; 
          border-left: 4px solid #667eea; 
          padding-left: 16px; 
          margin-bottom: 20px;
        }
        .financial-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        .financial-item {
          background: #f7fafc;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .financial-value {
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 10px;
        }
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        .category-item-detailed {
          margin-bottom: 15px;
          padding: 15px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }
        .category-bar {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          margin: 10px 0;
        }
        .category-fill {
          height: 100%;
          background: #667eea;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        @media print { 
          body { background: white; } 
          .report-container { box-shadow: none; } 
          .report-section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="report-header">
            <h1 class="report-title">📊 Informe Financiero FINZN</h1>
            <p class="report-subtitle">Período: ${e.month} | Generado: ${new Date().toLocaleDateString("es-ES")}</p>
        </div>
        ${t.innerHTML}
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #718096; font-size: 0.9rem;">
            <p>Informe generado por FINZN - Tu Compañero Financiero Inteligente</p>
            <p>Para más información visita: <strong>finzn.app</strong></p>
        </div>
    </div>
</body>
</html>`}downloadFile(e,t,s){const a=new Blob([e],{type:s}),n=URL.createObjectURL(a),i=document.createElement("a");i.href=n,i.download=t,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(n)}formatCurrency(e){return new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",minimumFractionDigits:0,maximumFractionDigits:0}).format(e)}}class w{constructor(){this.currentTheme=localStorage.getItem("finzn-theme")||"light"}init(){this.applyTheme(this.currentTheme),this.updateToggleIcon()}toggle(){this.currentTheme=this.currentTheme==="light"?"dark":"light",this.applyTheme(this.currentTheme),this.updateToggleIcon(),localStorage.setItem("finzn-theme",this.currentTheme)}applyTheme(e){document.body.classList.remove("darkmode","lightmode"),e==="dark"?document.body.classList.add("darkmode"):document.body.classList.add("lightmode"),document.documentElement.setAttribute("data-theme",e);let t=document.querySelector('meta[name="theme-color"]');t||(t=document.createElement("meta"),t.name="theme-color",document.head.appendChild(t)),t.setAttribute("content",e==="dark"?"#0f172a":"#ffffff")}updateToggleIcon(){const e=document.querySelector(".theme-icon");e&&(e.textContent=this.currentTheme==="light"?"🌙":"☀️")}getCurrentTheme(){return this.currentTheme}}class C{constructor(){this.currentSection="dashboard"}init(){this.setupNavigationEvents(),this.showSection("dashboard")}setupNavigationEvents(){document.querySelectorAll(".nav-item").forEach(t=>{t.addEventListener("click",()=>{const s=t.getAttribute("data-section");this.showSection(s),this.setActiveNavItem(t)})})}showSection(e){document.querySelectorAll(".dashboard-section").forEach(a=>{a.classList.remove("active")});const s=document.getElementById(`${e}-section`);s&&(s.classList.add("active"),this.currentSection=e)}setActiveNavItem(e){document.querySelectorAll(".nav-item").forEach(s=>{s.classList.remove("active")}),e.classList.add("active")}getCurrentSection(){return this.currentSection}}class S{constructor(){this.auth=new v,this.data=new f,this.ui=new y,this.charts=new E,this.modals=new x,this.chat=new b,this.reports=new I,this.theme=new w,this.navigation=new C,this.currentMonth=this.getCurrentMonth(),this.currentExpenseId=null,this.init()}async init(){this.theme.init(),this.navigation.init(),this.auth.getCurrentUser()?(this.showApp(),await this.loadUserData()):this.showAuth(),this.setupEventListeners()}setupEventListeners(){document.getElementById("login-form").addEventListener("submit",s=>this.handleLogin(s)),document.getElementById("register-form").addEventListener("submit",s=>this.handleRegister(s)),document.getElementById("show-register").addEventListener("click",()=>this.showRegister()),document.getElementById("show-login").addEventListener("click",()=>this.showLogin()),document.getElementById("logout-btn").addEventListener("click",()=>this.handleLogout()),document.getElementById("month-select").addEventListener("change",s=>this.handleMonthChange(s)),document.getElementById("theme-toggle").addEventListener("click",()=>this.theme.toggle()),document.getElementById("installments-btn").addEventListener("click",()=>this.showInstallmentsPopup()),document.getElementById("add-expense-btn").addEventListener("click",()=>this.showAddExpenseModal()),document.getElementById("expense-form").addEventListener("submit",s=>this.handleExpenseSubmit(s)),document.getElementById("confirm-delete-btn").addEventListener("click",()=>this.confirmDelete()),document.getElementById("add-income-btn-dashboard").addEventListener("click",()=>this.showIncomeModal()),document.getElementById("fixed-income-form-modal").addEventListener("submit",s=>this.handleFixedIncomeModal(s)),document.getElementById("extra-income-form-modal").addEventListener("submit",s=>this.handleExtraIncomeModal(s)),document.getElementById("extra-income-form").addEventListener("submit",s=>this.handleExtraIncome(s)),document.getElementById("extra-incomes-indicator").addEventListener("click",()=>this.showExtraIncomesModal()),document.getElementById("add-extra-income-from-modal").addEventListener("click",()=>{this.modals.hide("extra-incomes-modal"),this.modals.show("extra-income-modal")});const e=document.getElementById("add-goal-btn-section");e&&e.addEventListener("click",()=>this.modals.show("goal-modal")),document.getElementById("goal-form").addEventListener("submit",s=>this.handleAddGoal(s)),document.getElementById("add-category-btn").addEventListener("click",()=>this.modals.show("category-modal")),document.getElementById("category-form").addEventListener("submit",s=>this.handleAddCategory(s)),document.getElementById("add-expense-btn-dashboard").addEventListener("click",()=>this.showAddExpenseModal()),document.getElementById("add-limit-btn-expenses").addEventListener("click",()=>this.showAddLimitModal()),document.getElementById("limit-form").addEventListener("submit",s=>this.handleAddLimit(s)),document.getElementById("generate-report-btn").addEventListener("click",()=>this.generateReport()),document.getElementById("export-csv-btn").addEventListener("click",()=>this.exportCSV()),document.getElementById("import-csv").addEventListener("change",s=>this.importCSV(s));const t=document.getElementById("expense-search");t&&t.addEventListener("input",s=>this.handleSearch(s)),this.chat.init(),this.modals.init(),this.setupIncomeModalTabs()}async handleLogin(e){e.preventDefault();const t=document.getElementById("login-user").value,s=document.getElementById("login-pass").value;if(!t||!s){this.ui.showAlert("Por favor completa todos los campos","error");return}try{await this.auth.login(t,s)?(this.showApp(),await this.loadUserData(),this.ui.showAlert("¡Bienvenido de vuelta!","success")):this.ui.showAlert("Credenciales incorrectas","error")}catch(a){console.error("Login error:",a),this.ui.showAlert("Error al iniciar sesión","error")}}async handleRegister(e){e.preventDefault();const t=document.getElementById("register-user").value,s=document.getElementById("register-pass").value;if(!t||!s){this.ui.showAlert("Por favor completa todos los campos","error");return}if(s.length<4){this.ui.showAlert("La contraseña debe tener al menos 4 caracteres","error");return}try{await this.auth.register(t,s)?(this.showLogin(),this.ui.showAlert("Cuenta creada exitosamente. Ahora puedes iniciar sesión.","success")):this.ui.showAlert("Error al crear la cuenta. El usuario ya existe.","error")}catch(a){console.error("Register error:",a),this.ui.showAlert("Error al registrar usuario","error")}}handleLogout(){confirm("¿Estás seguro de que quieres cerrar sesión?")&&(this.ui.showAlert("Cerrando sesión...","info"),setTimeout(()=>{this.auth.logout()},1e3))}showAuth(){document.getElementById("login-container").classList.remove("hidden"),document.getElementById("register-container").classList.add("hidden"),document.getElementById("app").classList.add("hidden")}showApp(){document.getElementById("login-container").classList.add("hidden"),document.getElementById("register-container").classList.add("hidden"),document.getElementById("app").classList.remove("hidden");const e=this.auth.getCurrentUser();document.getElementById("user-name").textContent=`👤 ${e}`,this.initMonthSelector(),this.updateMonthSelectorVisibility()}showLogin(){document.getElementById("register-container").classList.add("hidden"),document.getElementById("login-container").classList.remove("hidden"),document.getElementById("register-error").textContent="",document.getElementById("login-error").textContent=""}showRegister(){document.getElementById("login-container").classList.add("hidden"),document.getElementById("register-container").classList.remove("hidden"),document.getElementById("register-error").textContent="",document.getElementById("login-error").textContent=""}async loadUserData(){this.auth.getCurrentUser()!=="mateo"&&(this.currentMonth=this.getCurrentMonth()),await this.data.loadUserData(),this.updateUI()}initMonthSelector(){const e=document.getElementById("month-select");e.innerHTML="";const s=new Date().getFullYear();for(let a=s-1;a<=s+1;a++)for(let n=1;n<=12;n++){const i=`${a}-${n.toString().padStart(2,"0")}`,o=document.createElement("option");o.value=i,o.textContent=new Date(a,n-1).toLocaleDateString("es-ES",{year:"numeric",month:"long"}),e.appendChild(o)}e.value=this.currentMonth}updateMonthSelectorVisibility(){const e=this.auth.getCurrentUser(),t=document.querySelector(".month-selector");t&&(e==="mateo"?t.style.display="flex":(t.style.display="none",this.currentMonth=this.getCurrentMonth()))}handleMonthChange(e){if(this.auth.getCurrentUser()!=="mateo"){e.preventDefault(),e.target.value=this.getCurrentMonth(),this.ui.showAlert("No tienes permisos para cambiar el mes","error");return}const s=this.currentMonth;this.currentMonth=e.target.value,s&&s!==this.currentMonth&&this.savePreviousMonthBalance(s),this.updateUI()}savePreviousMonthBalance(e){const t=this.data.getBalance(e);t.available>0&&(this.data.saveMonthlySavings(e,t.available),console.log(`Saved ${this.ui.formatCurrency(t.available)} as savings for ${e}`))}showInstallmentsPopup(){const e=this.data.getActiveInstallments(this.currentMonth);this.ui.showInstallmentsModal(e),this.modals.show("installments-modal")}showAddExpenseModal(){this.currentExpenseId=null,this.resetExpenseForm(),document.getElementById("expense-transaction-date").value=new Date().toISOString().split("T")[0],document.getElementById("expense-modal-title").textContent="Nuevo Gasto",document.getElementById("expense-submit-btn").textContent="Agregar Gasto",document.getElementById("expense-edit-mode").value="false",this.modals.show("expense-modal")}showEditExpenseModal(e){const t=this.data.getExpenseById(e,this.currentMonth);if(!t){this.ui.showAlert("Gasto no encontrado","error");return}this.currentExpenseId=e,this.populateExpenseForm(t),document.getElementById("expense-modal-title").textContent="Editar Gasto",document.getElementById("expense-submit-btn").textContent="Guardar Cambios",document.getElementById("expense-edit-mode").value="true",this.modals.show("expense-modal")}resetExpenseForm(){document.getElementById("expense-form").reset(),document.getElementById("expense-id").value=""}populateExpenseForm(e){document.getElementById("expense-id").value=e.id,document.getElementById("expense-description").value=e.description,document.getElementById("expense-amount").value=e.originalAmount||e.amount,document.getElementById("expense-category").value=e.category,document.getElementById("expense-transaction-date").value=e.transactionDate||new Date().toISOString().split("T")[0],document.getElementById("expense-installments").value=e.totalInstallments||1,document.getElementById("expense-recurring").checked=e.recurring||!1}async handleExpenseSubmit(e){e.preventDefault(),document.getElementById("expense-edit-mode").value==="true"?await this.handleEditExpense(e):await this.handleAddExpense(e)}setupIncomeModalTabs(){const e=document.querySelectorAll(".income-type-tab"),t=document.querySelectorAll(".income-form-section");e.forEach(s=>{s.addEventListener("click",()=>{const a=s.getAttribute("data-type");e.forEach(n=>n.classList.remove("active")),s.classList.add("active"),t.forEach(n=>{n.classList.remove("active"),n.id.includes(a)&&n.classList.add("active")})})})}showIncomeModal(){const e=document.querySelectorAll(".income-type-tab"),t=document.querySelectorAll(".income-form-section");e.forEach(s=>s.classList.remove("active")),t.forEach(s=>s.classList.remove("active")),document.querySelector('[data-type="fixed"]').classList.add("active"),document.getElementById("fixed-income-form-modal").classList.add("active"),this.modals.show("income-modal")}async handleFixedIncomeModal(e){e.preventDefault();const t=parseFloat(document.getElementById("fixed-income-amount-modal").value);if(!t||t<=0){this.ui.showAlert("Por favor ingresa un monto válido","error");return}try{await this.data.setFixedIncome(t),this.modals.hide("income-modal"),e.target.reset(),this.updateUI(),this.ui.showAlert(`💼 Ingreso fijo de ${this.ui.formatCurrency(t)} configurado exitosamente`,"success")}catch(s){console.error("Error setting fixed income:",s),this.ui.showAlert("Error al configurar el ingreso fijo","error")}}async handleExtraIncomeModal(e){var r;e.preventDefault();const t=new FormData(e.target),s=((r=t.get("description"))==null?void 0:r.trim())||"",a=t.get("amount")||"",n=t.get("category")||"";if(!s){this.ui.showAlert("Por favor ingresa una descripción","error");return}if(!a||a.trim()===""){this.ui.showAlert("Por favor ingresa un monto","error");return}const i=parseFloat(a);if(isNaN(i)||i<=0){this.ui.showAlert("Por favor ingresa un monto válido mayor a 0","error");return}if(!n){this.ui.showAlert("Por favor selecciona una categoría","error");return}const o={description:s,amount:i,category:n,date:this.currentMonth};try{await this.data.addExtraIncome(o,this.currentMonth),this.modals.hide("income-modal"),e.target.reset(),this.updateUI(),this.ui.showAlert(`✨ Ingreso extra de ${this.ui.formatCurrency(i)} agregado exitosamente`,"success")}catch(c){console.error("Error adding extra income:",c),this.ui.showAlert("Error al agregar el ingreso extra","error")}}showAddLimitModal(){this.ui.updateLimitCategoryOptions(this.data.getCategories()),this.modals.show("limit-modal")}async handleAddLimit(e){e.preventDefault();const t={category:document.getElementById("limit-category").value,amount:parseFloat(document.getElementById("limit-amount").value),warning:parseInt(document.getElementById("limit-warning").value)||80};if(!t.category||!t.amount||t.amount<=0){this.ui.showAlert("Por favor completa todos los campos requeridos","error");return}if(t.warning<50||t.warning>100){this.ui.showAlert("El porcentaje de alerta debe estar entre 50% y 100%","error");return}try{await this.data.addSpendingLimit(t),this.modals.hide("limit-modal"),e.target.reset(),this.updateUI(),this.ui.showAlert("Límite de gasto establecido exitosamente","success")}catch(s){console.error("Error adding spending limit:",s),this.ui.showAlert("Error al establecer el límite","error")}}async handleAddExpense(e){e.preventDefault();const t={description:document.getElementById("expense-description").value,amount:parseFloat(document.getElementById("expense-amount").value),category:document.getElementById("expense-category").value,transactionDate:document.getElementById("expense-transaction-date").value,installments:parseInt(document.getElementById("expense-installments").value)||1,recurring:document.getElementById("expense-recurring").checked,date:this.currentMonth};if(!t.description||!t.amount||!t.category||!t.transactionDate){this.ui.showAlert("Por favor completa todos los campos requeridos","error");return}if(t.amount<=0){this.ui.showAlert("El monto debe ser mayor a 0","error");return}if(new Date(t.transactionDate)>new Date){this.ui.showAlert("La fecha del gasto no puede ser futura","error");return}try{await this.data.addExpense(t),this.modals.hide("expense-modal"),e.target.reset(),this.updateUI(),this.checkSpendingLimits(),this.ui.showAlert("Gasto agregado exitosamente","success")}catch(n){console.error("Error adding expense:",n),this.ui.showAlert("Error al agregar el gasto","error")}}async handleEditExpense(e){e.preventDefault();const t={id:this.currentExpenseId,description:document.getElementById("expense-description").value,amount:parseFloat(document.getElementById("expense-amount").value),category:document.getElementById("expense-category").value,transactionDate:document.getElementById("expense-transaction-date").value,installments:parseInt(document.getElementById("expense-installments").value)||1,recurring:document.getElementById("expense-recurring").checked};if(!t.description||!t.amount||!t.category||!t.transactionDate){this.ui.showAlert("Por favor completa todos los campos requeridos","error");return}if(t.amount<=0){this.ui.showAlert("El monto debe ser mayor a 0","error");return}if(new Date(t.transactionDate)>new Date){this.ui.showAlert("La fecha del gasto no puede ser futura","error");return}try{await this.data.updateExpense(this.currentExpenseId,t,this.currentMonth),this.modals.hide("expense-modal"),this.updateUI(),this.checkSpendingLimits(),this.ui.showAlert("Gasto actualizado exitosamente","success")}catch(n){console.error("Error updating expense:",n),this.ui.showAlert("Error al actualizar el gasto","error")}}showDeleteConfirmation(e,t){this.currentExpenseId=e,document.getElementById("delete-confirmation-message").textContent=`¿Estás seguro de que quieres eliminar el gasto "${t}"?`,this.modals.show("delete-confirmation-modal")}async confirmDelete(){if(this.currentExpenseId)try{await this.data.deleteExpense(this.currentExpenseId,this.currentMonth),this.modals.hide("delete-confirmation-modal"),this.updateUI(),this.checkSpendingLimits(),this.ui.showAlert("Gasto eliminado exitosamente","success")}catch(e){console.error("Error deleting expense:",e),this.ui.showAlert("Error al eliminar el gasto","error")}}checkSpendingLimits(){const e=this.data.getSpendingLimits(),t=this.data.getExpensesByCategory(this.currentMonth);e.forEach(s=>{const a=t[s.category]||0,n=a/s.amount*100;if(n>=s.warning){let i="",o="warning";n>=100?(i=`¡Has superado el límite de ${s.category}! Gastaste ${this.ui.formatCurrency(a)} de ${this.ui.formatCurrency(s.amount)}`,o="danger"):n>=s.warning&&(i=`¡Cuidado! Estás cerca del límite en ${s.category}. Has gastado ${Math.round(n)}% (${this.ui.formatCurrency(a)} de ${this.ui.formatCurrency(s.amount)})`),i&&this.ui.showMascotAlert(i,o)}})}async handleFixedIncome(e){e.preventDefault();const t=parseFloat(document.getElementById("fixed-income-input").value);if(!t||t<=0){this.ui.showAlert("Por favor ingresa un monto válido","error");return}try{await this.data.setFixedIncome(t),document.getElementById("fixed-income-input").value="",this.updateUI(),this.ui.showAlert("Ingreso fijo actualizado","success")}catch(s){console.error("Error setting fixed income:",s),this.ui.showAlert("Error al actualizar el ingreso","error")}}async handleExtraIncome(e){var r;e.preventDefault(),console.log("🔥 STARTING EXTRA INCOME PROCESS");const t=new FormData(e.target);console.log("📋 FormData entries:");for(let[c,l]of t.entries())console.log(`  ${c}: "${l}"`);const s=((r=t.get("description"))==null?void 0:r.trim())||"",a=t.get("amount")||"",n=t.get("category")||"";if(console.log("📝 Extracted values:",{description:`"${s}"`,amountString:`"${a}"`,category:`"${n}"`}),!s){console.log("❌ VALIDATION FAILED: Empty description"),this.ui.showAlert("Por favor ingresa una descripción","error");return}if(!a||a.trim()===""){console.log("❌ VALIDATION FAILED: Empty amount string"),this.ui.showAlert("Por favor ingresa un monto","error");return}const i=parseFloat(a);if(console.log("🔢 Parsed amount:",i),isNaN(i)){console.log("❌ VALIDATION FAILED: Amount is NaN"),this.ui.showAlert("Por favor ingresa un monto válido (solo números)","error");return}if(i<=0){console.log("❌ VALIDATION FAILED: Amount is not positive"),this.ui.showAlert("El monto debe ser mayor a 0","error");return}if(!n){console.log("❌ VALIDATION FAILED: No category selected"),this.ui.showAlert("Por favor selecciona una categoría","error");return}const o={description:s,amount:i,category:n,date:this.currentMonth};console.log("✅ FINAL EXTRA INCOME OBJECT:",o);try{console.log("💾 SAVING TO DATA MANAGER..."),await this.data.addExtraIncome(o,this.currentMonth),console.log("✅ SAVED SUCCESSFULLY!"),this.modals.hide("extra-income-modal"),e.target.reset(),this.updateUI(),this.ui.showAlert(`✅ Ingreso extra de $${i.toLocaleString()} agregado exitosamente`,"success")}catch(c){console.error("❌ ERROR SAVING:",c),this.ui.showAlert("Error al agregar el ingreso extra","error")}}async handleAddGoal(e){e.preventDefault();const t={name:document.getElementById("goal-name").value,target:parseFloat(document.getElementById("goal-target").value),current:parseFloat(document.getElementById("goal-current").value)||0};if(!t.name||!t.target||t.target<=0){this.ui.showAlert("Por favor completa todos los campos requeridos","error");return}try{await this.data.addGoal(t),this.modals.hide("goal-modal"),e.target.reset(),this.updateUI(),this.ui.showAlert("Objetivo creado exitosamente","success")}catch(s){console.error("Error adding goal:",s),this.ui.showAlert("Error al crear el objetivo","error")}}async handleAddCategory(e){e.preventDefault();const t={name:document.getElementById("category-name").value,icon:document.getElementById("category-icon").value||"🏷️",color:document.getElementById("category-color").value};if(!t.name){this.ui.showAlert("Por favor ingresa un nombre para la categoría","error");return}try{await this.data.addCategory(t),this.modals.hide("category-modal"),e.target.reset(),this.updateUI(),this.ui.showAlert("Categoría creada exitosamente","success")}catch(s){console.error("Error adding category:",s),this.ui.showAlert("Error al crear la categoría","error")}}handleSearch(e){const t=e.target.value.toLowerCase();this.ui.filterExpenses(t)}async generateReport(){try{const e=await this.data.generateReport(this.currentMonth);this.reports.generate(e),this.modals.show("report-modal")}catch(e){console.error("Error generating report:",e),this.ui.showAlert("Error al generar el informe","error")}}async exportCSV(){try{const e=await this.data.exportToCSV();this.downloadFile(e,"finzn-export.csv","text/csv"),this.ui.showAlert("Datos exportados exitosamente","success")}catch(e){console.error("Error exporting CSV:",e),this.ui.showAlert("Error al exportar los datos","error")}}async importCSV(e){const t=e.target.files[0];if(t)try{const s=await t.text();await this.data.importFromCSV(s),this.updateUI(),this.ui.showAlert("Datos importados exitosamente","success")}catch(s){console.error("Error importing CSV:",s),this.ui.showAlert("Error al importar los datos","error")}}updateUI(){const e=this.data.getBalance(this.currentMonth),t=this.data.getIncome(this.currentMonth),s=this.data.getExtraIncomes(this.currentMonth),a=document.getElementById("monthly-expenses-summary"),n=document.getElementById("income-summary"),i=document.getElementById("balance-amount-new"),o=document.getElementById("installments-count"),r=document.getElementById("extra-incomes-indicator"),c=document.querySelector("#extra-incomes-indicator .indicator-count");a&&(a.textContent=this.ui.formatCurrency(e.totalExpenses)),n&&(n.textContent=this.ui.formatCurrency(t.fixed+t.extra)),i&&(i.textContent=this.ui.formatCurrency(e.available)),o&&(o.textContent=e.installments),r&&c&&(s.length>0?(r.classList.remove("hidden"),c.textContent=s.length):r.classList.add("hidden")),this.ui.updateGoalsListNew(this.data.getGoals()),this.ui.updateBalance(e),this.ui.updateExpensesList(this.data.getExpenses(this.currentMonth),this),this.ui.updateGoalsList(this.data.getGoals()),this.ui.updateCategoriesList(this.data.getCategories()),this.ui.updateIncomeDisplay(t),this.ui.updateStats(this.data.getStats()),this.ui.updateAchievements(this.data.getAchievements()),this.ui.updateSpendingLimitsList(this.data.getSpendingLimits(),this.data.getExpensesByCategory(this.currentMonth)),this.ui.updateSpendingLimitsGrid(this.data.getSpendingLimits(),this.data.getExpensesByCategory(this.currentMonth)),this.charts.updateExpensesChart(this.data.getExpensesByCategory(this.currentMonth)),this.charts.updateTrendChart(this.data.getMonthlyTrend()),this.ui.updateCategoryOptions(this.data.getCategories())}getCurrentMonth(){const e=new Date;return`${e.getFullYear()}-${(e.getMonth()+1).toString().padStart(2,"0")}`}downloadFile(e,t,s){const a=new Blob([e],{type:s}),n=URL.createObjectURL(a),i=document.createElement("a");i.href=n,i.download=t,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(n)}showExtraIncomesModal(){const e=this.data.getAllExtraIncomes();this.ui.showExtraIncomesModal(e),this.modals.show("extra-incomes-modal")}}window.app=null;document.addEventListener("DOMContentLoaded",()=>{window.app=new S});
