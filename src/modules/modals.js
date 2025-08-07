export class ModalManager {
  constructor() {
    this.modals = new Map();
  }

  init() {
    // Register all modals
    const modalElements = document.querySelectorAll('.modal');
    modalElements.forEach(modal => {
      this.modals.set(modal.id, modal);
      
      // Close modal when clicking outside
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hide(modal.id);
        }
      });
      
      // Close modal when clicking close button
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hide(modal.id));
      }
      
      // Close modal when clicking cancel button
      const cancelBtn = modal.querySelector('.modal-cancel');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => this.hide(modal.id));
      }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideAll();
      }
    });
    
    // Setup budget modal specific events
    this.setupBudgetModalEvents();
  }

  setupBudgetModalEvents() {
    // AI recommendations checkbox in add budget modal
    const aiRecommendationsCheckbox = document.getElementById('budget-ai-recommendations');
    const aiRecommendationsInfo = document.getElementById('ai-recommendations-info');
    
    if (aiRecommendationsCheckbox && aiRecommendationsInfo) {
      aiRecommendationsCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          aiRecommendationsInfo.classList.remove('hidden');
        } else {
          aiRecommendationsInfo.classList.add('hidden');
        }
      });
    }
    
    // Date validation for budget modals
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
  show(modalId) {
    console.log('ModalManager: Showing modal', modalId);
    const modal = this.modals.get(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Focus first input
      const firstInput = modal.querySelector('input, select, textarea');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }

  hide(modalId) {
    console.log('ModalManager: Hiding modal', modalId);
    const modal = this.modals.get(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      
      // Reset form if exists
      const form = modal.querySelector('form');
      if (form) {
        form.reset();
      }
    }
  }

  hideAll() {
    this.modals.forEach((modal, id) => {
      this.hide(id);
    });
  }
}