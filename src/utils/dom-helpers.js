/**
 * FINZN DOM Utilities
 * Safe DOM manipulation helpers to prevent runtime errors
 */

export class DOMHelpers {
  /**
   * Safely get element value with fallback
   * @param {string} id - Element ID
   * @param {string} defaultValue - Default value if element not found
   * @returns {string}
   */
  static safeGetValue(id, defaultValue = '') {
    const element = document.getElementById(id);
    return element ? element.value : defaultValue;
  }

  /**
   * Safely set element value
   * @param {string} id - Element ID
   * @param {string} value - Value to set
   * @returns {boolean} - Success status
   */
  static safeSetValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.value = value;
      return true;
    }
    console.warn(`Element with ID '${id}' not found`);
    return false;
  }

  /**
   * Safely get element text content
   * @param {string} id - Element ID
   * @param {string} defaultText - Default text if element not found
   * @returns {string}
   */
  static safeGetText(id, defaultText = '') {
    const element = document.getElementById(id);
    return element ? element.textContent : defaultText;
  }

  /**
   * Safely set element text content
   * @param {string} id - Element ID
   * @param {string} text - Text to set
   * @returns {boolean} - Success status
   */
  static safeSetText(id, text) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text;
      return true;
    }
    console.warn(`Element with ID '${id}' not found`);
    return false;
  }

  /**
   * Safely add event listener
   * @param {string} id - Element ID
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @returns {boolean} - Success status
   */
  static safeAddEventListener(id, event, handler) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener(event, handler);
      return true;
    }
    console.warn(`Cannot add event listener: Element with ID '${id}' not found`);
    return false;
  }

  /**
   * Get element with null check and warning
   * @param {string} id - Element ID
   * @returns {HTMLElement|null}
   */
  static safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element with ID '${id}' not found`);
    }
    return element;
  }

  /**
   * Check if element exists
   * @param {string} id - Element ID
   * @returns {boolean}
   */
  static elementExists(id) {
    return !!document.getElementById(id);
  }

  /**
   * Safe form data extraction
   * @param {string} formId - Form ID
   * @returns {Object} - Form data object
   */
  static safeGetFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) {
      console.warn(`Form with ID '${formId}' not found`);
      return {};
    }

    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    return data;
  }

  /**
   * Cache frequently accessed elements
   * @param {Array<string>} ids - Array of element IDs to cache
   * @returns {Object} - Cached elements object
   */
  static cacheElements(ids) {
    const cached = {};
    ids.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        cached[id] = element;
      } else {
        console.warn(`Cannot cache: Element with ID '${id}' not found`);
      }
    });
    return cached;
  }

  /**
   * Ensure DOM is ready before executing callback
   * @param {Function} callback - Function to execute when DOM is ready
   */
  static onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }
}

// Legacy compatibility - export individual functions
export const {
  safeGetValue,
  safeSetValue,
  safeGetText,
  safeSetText,
  safeAddEventListener,
  safeGetElement,
  elementExists,
  safeGetFormData,
  cacheElements,
  onReady
} = DOMHelpers;