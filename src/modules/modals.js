export class ModalManager {
  constructor() {
    this.modals = new Map();
  }

  init() {
    console.log('🔧 DEBUG: ModalManager init started');
    // Register all modals
    const modalElements = document.querySelectorAll('.modal');
    console.log('🔧 DEBUG: Found modal elements:', modalElements.length);
    modalElements.forEach(modal => {
      console.log('🔧 DEBUG: Registering modal:', modal.id, modal.className);
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
    
    console.log('🔧 DEBUG: ModalManager registered modals:', Array.from(this.modals.keys()));
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
    console.log('🔧 DEBUG: Available modals:', Array.from(this.modals.keys()));
    const modal = this.modals.get(modalId);
    console.log('🔧 DEBUG: Modal found:', !!modal);
    if (modal) {
      console.log('🔧 DEBUG: Modal element before show:', modal.className);
      modal.classList.add('active');
      console.log('🔧 DEBUG: Modal element after show:', modal.className);
      document.body.style.overflow = 'hidden';
      
      // Focus first input
      const firstInput = modal.querySelector('input, select, textarea');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    } else {
      console.error('🔧 ERROR: Modal not found:', modalId);
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