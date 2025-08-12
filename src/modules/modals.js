// src/modules/modals.js
export class ModalManager {
  constructor() {
    this.modals = new Map();
  }

  init() {
    console.log('🔧 DEBUG: ModalManager init started');

    // Registrar todos los modales
    const modalElements = document.querySelectorAll('.modal');
    console.log('🔧 DEBUG: Found modal elements:', modalElements.length);

    modalElements.forEach(modal => {
      console.log('🔧 DEBUG: Registering modal:', modal.id, modal.className);
      this.modals.set(modal.id, modal);
      
      // Forzar que cualquier modal que no esté activo arranque oculto
      modal.classList.toggle('hidden', !modal.classList.contains('active'));

      // Cerrar al clickear fuera
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.hide(modal.id);
      });

      // Botón X
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) closeBtn.addEventListener('click', () => this.hide(modal.id));

      // Botón cancelar
      const cancelBtn = modal.querySelector('.modal-cancel');
      if (cancelBtn) cancelBtn.addEventListener('click', () => this.hide(modal.id));
    });

    // Escape global → cerrar todos
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hideAll();
    });

    console.log('🔧 DEBUG: ModalManager registered modals:', Array.from(this.modals.keys()));
  }

  hideAll() {
    this.modals.forEach((_, id) => this.hide(id));
  }

  setupBudgetModalEvents() {
    // Checkbox IA en presupuesto
    const aiRecommendationsCheckbox = document.getElementById('budget-ai-recommendations');
    const aiRecommendationsInfo = document.getElementById('ai-recommendations-info');

    if (aiRecommendationsCheckbox && aiRecommendationsInfo) {
      aiRecommendationsCheckbox.addEventListener('change', (e) => {
        aiRecommendationsInfo.classList.toggle('hidden', !e.target.checked);
      });
    }

    // Validación de fechas para add/edit presupuesto
    const setupDateValidation = (startDateId, endDateId) => {
      const startDate = document.getElementById(startDateId);
      const endDate = document.getElementById(endDateId);

      if (startDate && endDate) {
        startDate.addEventListener('change', () => {
          endDate.min = startDate.value;
          if (endDate.value && endDate.value < startDate.value) {
            endDate.value = startDate.value;
          }
        });

        endDate.addEventListener('change', () => {
          if (startDate.value && endDate.value < startDate.value) {
            endDate.value = startDate.value;
          }
        });
      }
    };

    setupDateValidation('budget-start-date', 'budget-end-date');
    setupDateValidation('edit-budget-start-date', 'edit-budget-end-date');
  }

  setupIncomeModalEvents() {
  const incomeType = document.getElementById('income-type');
  const extraGroup = document.getElementById('extra-income-group');
  if (!incomeType || !extraGroup) return;

  const toggleExtra = () => {
    const isExtra = incomeType.value === 'extra';
    extraGroup.classList.toggle('hidden', !isExtra);
  };

  // Estado inicial y cambios
  toggleExtra();
  incomeType.addEventListener('change', toggleExtra);
}


  show(modalId) {
  console.log('ModalManager: Showing modal', modalId);
  const modal = this.modals.get(modalId) || document.getElementById(modalId);
  if (!modal) return console.warn('ModalManager: modal not found ->', modalId);

  if (modal.parentNode !== document.body) {
    document.body.appendChild(modal);
  }

  // Estado base (sin cierre)
  modal.classList.remove('closing');

  // 1) quitar display:none (hidden)
  modal.classList.remove('hidden');

  // 2) forzar reflow para que se apliquen los estilos iniciales
  //    (opacity 0 / translateY) antes de activar la animación
  // eslint-disable-next-line no-unused-expressions
  modal.offsetHeight; // <- clave

  // 3) ahora sí, activar (dispara transición de .modal-content)
  modal.classList.add('active');

  // llevar al frente y bloquear scroll
  modal.style.zIndex = '2147483647';
  document.body.style.overflow = 'hidden';

  // focus inicial
  const firstInput = modal.querySelector('input, select, textarea, button');
  if (firstInput) setTimeout(() => firstInput.focus(), 50);

  // Escape por modal
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      this.hide(modalId);
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = document.querySelector('.modal.active');
  if (open) this.hide(open.id);
});

}


  hide(modalId) {
    console.log('ModalManager: Hiding modal', modalId);
    const modal = this.modals.get(modalId) || document.getElementById(modalId);
    if (!modal) return;

    // Animación de salida
    modal.classList.remove('active');
    modal.classList.add('closing');

    const content = modal.querySelector('.modal-content');

    const finalize = () => {
      modal.classList.remove('closing');
      modal.classList.add('hidden');
      document.body.style.overflow = ''; // restaurar scroll

      const form = modal.querySelector('form');
      if (form) form.reset();
    };

    if (content) {
      const onEnd = (ev) => {
        if (ev.target !== content) return;
        content.removeEventListener('transitionend', onEnd);
        finalize();
      };
      content.addEventListener('transitionend', onEnd, { once: true });

      // Fallback por si no dispara transitionend
      setTimeout(finalize, 400);
    } else {
      finalize();
    }
  }
}
