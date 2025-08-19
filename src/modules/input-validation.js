/**
 * FINZN Input Validation & Sanitization Module
 * 
 * This module provides comprehensive input validation and HTML sanitization
 * to prevent XSS vulnerabilities and ensure data integrity for financial data.
 * 
 * Implements security measures from the security audit report.
 */

export class InputValidator {
  constructor() {
    // Validation rules and patterns
    this.patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      date: /^\d{4}-\d{2}-\d{2}$/,
      monthYear: /^\d{4}-\d{2}$/,
      currency: /^\d+(\.\d{1,2})?$/,
      percentage: /^\d+(\.\d{1,2})?$/,
      positiveInteger: /^\d+$/,
      alphanumeric: /^[a-zA-Z0-9\s\-_,.!?]+$/,
      description: /^[a-zA-Z0-9\s\-_,.!?áéíóúÁÉÍÓÚñÑüÜ]+$/
    };

    // Maximum values for financial data
    this.limits = {
      amount: 999999999,
      percentage: 100,
      installments: 60,
      descriptionLength: 200,
      nameLength: 100,
      categoryLength: 50
    };
  }

  /**
   * HTML Sanitization - Escapes HTML entities to prevent XSS
   * @param {string} text - Text to sanitize
   * @returns {string} - Sanitized text
   */
  escapeHtml(text) {
    if (typeof text !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Sanitizes text content for safe display
   * @param {string} text - Text to sanitize
   * @returns {string} - Sanitized text
   */
  sanitizeText(text) {
    if (typeof text !== 'string') return '';
    
    // Remove any HTML tags completely
    const cleanText = text.replace(/<[^>]*>/g, '');
    
    // Escape remaining special characters
    return this.escapeHtml(cleanText.trim());
  }

  /**
   * Validates financial amounts
   * @param {string|number} amount - Amount to validate
   * @returns {Object} - Validation result with isValid and value
   */
  validateAmount(amount) {
    if (amount === null || amount === undefined || amount === '') {
      return { isValid: false, error: 'El monto es requerido', value: null };
    }

    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount)) {
      return { isValid: false, error: 'El monto debe ser un número válido', value: null };
    }

    if (numAmount < 0) {
      return { isValid: false, error: 'El monto no puede ser negativo', value: null };
    }

    if (numAmount > this.limits.amount) {
      return { isValid: false, error: `El monto no puede exceder $${this.limits.amount.toLocaleString()}`, value: null };
    }

    // Round to 2 decimal places
    const roundedAmount = Math.round(numAmount * 100) / 100;
    
    return { isValid: true, error: null, value: roundedAmount };
  }

  /**
   * Validates percentage values
   * @param {string|number} percentage - Percentage to validate
   * @returns {Object} - Validation result
   */
  validatePercentage(percentage) {
    if (percentage === null || percentage === undefined || percentage === '') {
      return { isValid: true, error: null, value: 0 }; // Optional field
    }

    const numPercentage = parseFloat(percentage);
    
    if (isNaN(numPercentage)) {
      return { isValid: false, error: 'El porcentaje debe ser un número válido', value: null };
    }

    if (numPercentage < 0) {
      return { isValid: false, error: 'El porcentaje no puede ser negativo', value: null };
    }

    if (numPercentage > this.limits.percentage) {
      return { isValid: false, error: `El porcentaje no puede exceder ${this.limits.percentage}%`, value: null };
    }

    return { isValid: true, error: null, value: numPercentage };
  }

  /**
   * Validates date strings
   * @param {string} date - Date string to validate (YYYY-MM-DD format)
   * @returns {Object} - Validation result
   */
  validateDate(date) {
    if (!date || typeof date !== 'string') {
      return { isValid: false, error: 'La fecha es requerida', value: null };
    }

    if (!this.patterns.date.test(date)) {
      return { isValid: false, error: 'Formato de fecha inválido (use YYYY-MM-DD)', value: null };
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return { isValid: false, error: 'Fecha inválida', value: null };
    }

    // Check if date is not too far in the future (10 years)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 10);
    
    if (dateObj > maxDate) {
      return { isValid: false, error: 'La fecha no puede ser más de 10 años en el futuro', value: null };
    }

    // Check if date is not too far in the past (100 years)
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 100);
    
    if (dateObj < minDate) {
      return { isValid: false, error: 'La fecha no puede ser más de 100 años en el pasado', value: null };
    }

    return { isValid: true, error: null, value: date };
  }

  /**
   * Validates description text
   * @param {string} description - Description to validate
   * @returns {Object} - Validation result
   */
  validateDescription(description) {
    if (!description || typeof description !== 'string') {
      return { isValid: false, error: 'La descripción es requerida', value: null };
    }

    const trimmed = description.trim();
    
    if (trimmed.length === 0) {
      return { isValid: false, error: 'La descripción no puede estar vacía', value: null };
    }

    if (trimmed.length > this.limits.descriptionLength) {
      return { isValid: false, error: `La descripción no puede exceder ${this.limits.descriptionLength} caracteres`, value: null };
    }

    if (!this.patterns.description.test(trimmed)) {
      return { isValid: false, error: 'La descripción contiene caracteres no permitidos', value: null };
    }

    return { isValid: true, error: null, value: this.sanitizeText(trimmed) };
  }

  /**
   * Validates name fields (goals, budgets, categories)
   * @param {string} name - Name to validate
   * @returns {Object} - Validation result
   */
  validateName(name) {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: 'El nombre es requerido', value: null };
    }

    const trimmed = name.trim();
    
    if (trimmed.length === 0) {
      return { isValid: false, error: 'El nombre no puede estar vacío', value: null };
    }

    if (trimmed.length > this.limits.nameLength) {
      return { isValid: false, error: `El nombre no puede exceder ${this.limits.nameLength} caracteres`, value: null };
    }

    if (!this.patterns.description.test(trimmed)) {
      return { isValid: false, error: 'El nombre contiene caracteres no permitidos', value: null };
    }

    return { isValid: true, error: null, value: this.sanitizeText(trimmed) };
  }

  /**
   * Validates category fields
   * @param {string} category - Category to validate
   * @returns {Object} - Validation result
   */
  validateCategory(category) {
    if (!category || typeof category !== 'string') {
      return { isValid: false, error: 'La categoría es requerida', value: null };
    }

    const trimmed = category.trim();
    
    if (trimmed.length === 0) {
      return { isValid: false, error: 'La categoría no puede estar vacía', value: null };
    }

    if (trimmed.length > this.limits.categoryLength) {
      return { isValid: false, error: `La categoría no puede exceder ${this.limits.categoryLength} caracteres`, value: null };
    }

    return { isValid: true, error: null, value: this.sanitizeText(trimmed) };
  }

  /**
   * Validates installment count
   * @param {string|number} count - Installment count to validate
   * @returns {Object} - Validation result
   */
  validateInstallmentCount(count) {
    if (count === null || count === undefined || count === '') {
      return { isValid: true, error: null, value: 1 }; // Default to 1
    }

    const numCount = parseInt(count, 10);
    
    if (isNaN(numCount)) {
      return { isValid: false, error: 'El número de cuotas debe ser un número entero', value: null };
    }

    if (numCount < 1) {
      return { isValid: false, error: 'El número de cuotas debe ser al menos 1', value: null };
    }

    if (numCount > this.limits.installments) {
      return { isValid: false, error: `El número de cuotas no puede exceder ${this.limits.installments}`, value: null };
    }

    return { isValid: true, error: null, value: numCount };
  }

  /**
   * Validates email addresses
   * @param {string} email - Email to validate
   * @returns {Object} - Validation result
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'El email es requerido', value: null };
    }

    const trimmed = email.trim().toLowerCase();
    
    if (!this.patterns.email.test(trimmed)) {
      return { isValid: false, error: 'Formato de email inválido', value: null };
    }

    return { isValid: true, error: null, value: trimmed };
  }

  /**
   * Validates month-year format (YYYY-MM)
   * @param {string} monthYear - Month-year string to validate
   * @returns {Object} - Validation result
   */
  validateMonthYear(monthYear) {
    if (!monthYear || typeof monthYear !== 'string') {
      return { isValid: false, error: 'El mes/año es requerido', value: null };
    }

    if (!this.patterns.monthYear.test(monthYear)) {
      return { isValid: false, error: 'Formato de mes/año inválido (use YYYY-MM)', value: null };
    }

    const [year, month] = monthYear.split('-').map(Number);
    
    if (month < 1 || month > 12) {
      return { isValid: false, error: 'Mes inválido (debe ser 01-12)', value: null };
    }

    if (year < 1900 || year > 2100) {
      return { isValid: false, error: 'Año inválido', value: null };
    }

    return { isValid: true, error: null, value: monthYear };
  }

  /**
   * Validates expense form data
   * @param {Object} formData - Form data to validate
   * @returns {Object} - Validation result with errors and sanitized data
   */
  validateExpenseForm(formData) {
    const errors = [];
    const sanitizedData = {};

    // Validate description
    const descResult = this.validateDescription(formData.description);
    if (!descResult.isValid) {
      errors.push(descResult.error);
    } else {
      sanitizedData.description = descResult.value;
    }

    // Validate amount
    const amountResult = this.validateAmount(formData.amount);
    if (!amountResult.isValid) {
      errors.push(amountResult.error);
    } else {
      sanitizedData.amount = amountResult.value;
    }

    // Validate category
    const categoryResult = this.validateCategory(formData.category);
    if (!categoryResult.isValid) {
      errors.push(categoryResult.error);
    } else {
      sanitizedData.category = categoryResult.value;
    }

    // Validate transaction date
    const dateResult = this.validateDate(formData.transactionDate);
    if (!dateResult.isValid) {
      errors.push(dateResult.error);
    } else {
      sanitizedData.transactionDate = dateResult.value;
    }

    // Validate installments if present
    if (formData.hasInstallments) {
      const installmentResult = this.validateInstallmentCount(formData.installmentsCount);
      if (!installmentResult.isValid) {
        errors.push(installmentResult.error);
      } else {
        sanitizedData.installmentsCount = installmentResult.value;
      }

      // Validate interest percentage if present
      if (formData.installmentsInterest !== undefined && formData.installmentsInterest !== '') {
        const interestResult = this.validatePercentage(formData.installmentsInterest);
        if (!interestResult.isValid) {
          errors.push(interestResult.error);
        } else {
          sanitizedData.installmentsInterest = interestResult.value;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  }

  /**
   * Validates income form data
   * @param {Object} formData - Form data to validate
   * @returns {Object} - Validation result with errors and sanitized data
   */
  validateIncomeForm(formData) {
    const errors = [];
    const sanitizedData = {};

    // Validate type first
    if (!formData.type || !['fixed', 'extra'].includes(formData.type)) {
      errors.push('Tipo de ingreso inválido');
    } else {
      sanitizedData.type = formData.type;
    }

    // Validate description only for extra income
    if (formData.type === 'extra') {
      const descResult = this.validateDescription(formData.description);
      if (!descResult.isValid) {
        errors.push(descResult.error);
      } else {
        sanitizedData.description = descResult.value;
      }
    } else if (formData.type === 'fixed') {
      // For fixed income, description is optional/not needed
      sanitizedData.description = 'Ingreso Fijo';
    }

    // Validate amount
    const amountResult = this.validateAmount(formData.amount);
    if (!amountResult.isValid) {
      errors.push(amountResult.error);
    } else {
      sanitizedData.amount = amountResult.value;
    }

    // Validate date if present
    if (formData.date) {
      const dateResult = this.validateDate(formData.date);
      if (!dateResult.isValid) {
        errors.push(dateResult.error);
      } else {
        sanitizedData.date = dateResult.value;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  }

  /**
   * Validates budget form data
   * @param {Object} formData - Form data to validate
   * @returns {Object} - Validation result with errors and sanitized data
   */
  validateBudgetForm(formData) {
    const errors = [];
    const sanitizedData = {};

    // Validate name
    const nameResult = this.validateName(formData.name);
    if (!nameResult.isValid) {
      errors.push(nameResult.error);
    } else {
      sanitizedData.name = nameResult.value;
    }

    // Validate category
    const categoryResult = this.validateCategory(formData.category);
    if (!categoryResult.isValid) {
      errors.push(categoryResult.error);
    } else {
      sanitizedData.category = categoryResult.value;
    }

    // Validate amount
    const amountResult = this.validateAmount(formData.amount);
    if (!amountResult.isValid) {
      errors.push(amountResult.error);
    } else {
      sanitizedData.amount = amountResult.value;
    }

    // Validate start date
    const startDateResult = this.validateDate(formData.start_date);
    if (!startDateResult.isValid) {
      errors.push('Fecha de inicio: ' + startDateResult.error);
    } else {
      sanitizedData.start_date = startDateResult.value;
    }

    // Validate end date
    const endDateResult = this.validateDate(formData.end_date);
    if (!endDateResult.isValid) {
      errors.push('Fecha de fin: ' + endDateResult.error);
    } else {
      sanitizedData.end_date = endDateResult.value;
    }

    // Validate date range
    if (sanitizedData.start_date && sanitizedData.end_date) {
      const startDate = new Date(sanitizedData.start_date);
      const endDate = new Date(sanitizedData.end_date);
      
      if (endDate <= startDate) {
        errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  }

  /**
   * Validates goal form data
   * @param {Object} formData - Form data to validate
   * @returns {Object} - Validation result with errors and sanitized data
   */
  validateGoalForm(formData) {
    const errors = [];
    const sanitizedData = {};

    // Validate name
    const nameResult = this.validateName(formData.name);
    if (!nameResult.isValid) {
      errors.push(nameResult.error);
    } else {
      sanitizedData.name = nameResult.value;
    }

    // Validate target amount
    const targetResult = this.validateAmount(formData.targetAmount);
    if (!targetResult.isValid) {
      errors.push('Monto objetivo: ' + targetResult.error);
    } else {
      sanitizedData.targetAmount = targetResult.value;
    }

    // Validate current amount
    const currentResult = this.validateAmount(formData.currentAmount || 0);
    if (!currentResult.isValid) {
      errors.push('Monto actual: ' + currentResult.error);
    } else {
      sanitizedData.currentAmount = currentResult.value;
    }

    // Validate target date
    const dateResult = this.validateDate(formData.targetDate);
    if (!dateResult.isValid) {
      errors.push('Fecha objetivo: ' + dateResult.error);
    } else {
      sanitizedData.targetDate = dateResult.value;
      
      // Check if target date is in the future
      const targetDate = new Date(dateResult.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (targetDate <= today) {
        errors.push('La fecha objetivo debe ser en el futuro');
      }
    }

    // Validate that current amount is not greater than target
    if (sanitizedData.currentAmount && sanitizedData.targetAmount && 
        sanitizedData.currentAmount > sanitizedData.targetAmount) {
      errors.push('El monto actual no puede ser mayor al monto objetivo');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  }
}

// Create a singleton instance for global use
export const inputValidator = new InputValidator();