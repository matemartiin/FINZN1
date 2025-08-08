export class ModalManager {
  constructor() {
    this.modals = new Map();
    this.activeModal = null;
  }

  init() {
    // Register all modals
    const modalElements = document.querySelectorAll('.modal');
    
    if (modalElements.length === 0) {
      console.warn('⚠️ No modal elements found in DOM');
      return;
    }
    
    modalElements.forEach(modal => {
      if (!modal.id) {
        console.warn('⚠️ Modal element found without ID:', modal);
        return;
      }
      
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
        if (this.activeModal) {
          this.hide(this.activeModal);
        }
      }
    });
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
          if (!startDate.value) return;
          
          endDate.min = startDate.value;
          if (endDate.value && endDate.value < startDate.value) {
            endDate.value = startDate.value;
          }
        });
        
        endDate.addEventListener('change', () => {
          if (!startDate.value || !endDate.value) return;
          
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
    if (!modalId || typeof modalId !== 'string') {
      console.error('ModalManager: Invalid modalId provided to show():', modalId);
      return;
    }
    
    console.log('ModalManager: Showing modal', modalId);
    const modal = this.modals.get(modalId);
    if (modal) {
      // Hide any currently active modal first
      if (this.activeModal && this.activeModal !== modalId) {
        this.hide(this.activeModal);
      }
      
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.activeModal = modalId;
      
      // Focus first input
      const firstInput = modal.querySelector('input, select, textarea');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    } else {
      console.error('ModalManager: Modal not found:', modalId);
    }
  }

  hide(modalId) {
    if (!modalId || typeof modalId !== 'string') {
      console.error('ModalManager: Invalid modalId provided to hide():', modalId);
      return;
    }
    
    console.log('ModalManager: Hiding modal', modalId);
    const modal = this.modals.get(modalId);
    if (modal) {
      modal.classList.remove('active');
      
      // Only restore body overflow if no other modals are active
      const activeModals = Array.from(this.modals.values()).filter(m => m.classList.contains('active'));
      if (activeModals.length === 0) {
        document.body.style.overflow = '';
      }
      
      if (this.activeModal === modalId) {
        this.activeModal = null;
      }
      
      // Reset form if exists
      const form = modal.querySelector('form');
      if (form) {
        try {
          form.reset();
        } catch (error) {
          console.warn('Error resetting form in modal:', modalId, error);
        }
      }
    } else {
      console.error('ModalManager: Modal not found:', modalId);
    }
  }

  hideAll() {
    this.modals.forEach((modal, id) => {
      this.hide(id);
    });
    this.activeModal = null;
    document.body.style.overflow = '';
  }
  
  isModalActive(modalId) {
    return this.activeModal === modalId;
  }
  
  getActiveModal() {
    return this.activeModal;
  }
}