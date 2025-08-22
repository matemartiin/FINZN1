// Mobile Testing Suite - FINZN
// Comprehensive testing system for mobile optimization

export class MobileTesting {
  constructor() {
    this.testResults = [];
    this.isDev = import.meta.env?.DEV || window.location.hostname === 'localhost';
  }

  // Run all tests
  async runAllTests() {
    console.log('🧪 Starting Mobile Testing Suite...');
    
    await this.testUserProfileButton();
    await this.testModals();
    await this.testNavigation();
    await this.testForms();
    await this.testResponsive();
    await this.testPerformance();
    
    this.generateReport();
    return this.testResults;
  }

  // Test 1: User Profile Button
  async testUserProfileButton() {
    const test = { name: 'User Profile Button', status: 'pending', issues: [] };
    
    try {
      // Check if button exists
      const button = document.getElementById('user-profile-btn');
      if (!button) {
        test.issues.push('❌ Profile button not found in DOM');
        test.status = 'failed';
        this.testResults.push(test);
        return;
      }

      // Check button is visible
      const buttonStyle = window.getComputedStyle(button);
      if (buttonStyle.display === 'none' || buttonStyle.visibility === 'hidden') {
        test.issues.push('❌ Profile button is not visible');
      }

      // Check button container
      const container = button.closest('.user-profile-button-container');
      if (!container) {
        test.issues.push('❌ Profile button container not found');
      } else {
        const containerStyle = window.getComputedStyle(container);
        if (containerStyle.display === 'none') {
          test.issues.push('❌ Profile button container is hidden');
        }
      }

      // Check touch target size
      const rect = button.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        test.issues.push(`⚠️ Touch target too small: ${rect.width}x${rect.height}px (min 44x44)`);
      }

      // Check if initials are showing
      const initials = document.getElementById('user-initials');
      if (!initials || !initials.textContent.trim()) {
        test.issues.push('❌ User initials not displaying');
      }

      // Test click functionality
      let modalOpened = false;
      const originalOpenModal = window.app?.userProfileButton?.openModal;
      
      if (window.app?.userProfileButton) {
        window.app.userProfileButton.openModal = () => {
          modalOpened = true;
          if (originalOpenModal) originalOpenModal.call(window.app.userProfileButton);
        };

        button.click();
        
        setTimeout(() => {
          if (!modalOpened) {
            test.issues.push('❌ Button click did not trigger modal opening');
          }
          
          // Restore original function
          if (originalOpenModal) {
            window.app.userProfileButton.openModal = originalOpenModal;
          }
        }, 100);
      } else {
        test.issues.push('❌ UserProfileButton module not initialized');
      }

      test.status = test.issues.length === 0 ? 'passed' : 'warning';
      
    } catch (error) {
      test.status = 'failed';
      test.issues.push(`❌ Error: ${error.message}`);
    }

    this.testResults.push(test);
  }

  // Test 2: Modal System
  async testModals() {
    const test = { name: 'Modal System', status: 'pending', issues: [] };
    
    try {
      // Check if profile modal exists
      const profileModal = document.getElementById('user-profile-modal');
      if (!profileModal) {
        test.issues.push('❌ Profile modal not found in DOM');
        test.status = 'failed';
        this.testResults.push(test);
        return;
      }

      // Check modal structure
      const modalContent = profileModal.querySelector('.user-profile-modal-content');
      if (!modalContent) {
        test.issues.push('❌ Modal content structure missing');
      }

      const modalHeader = profileModal.querySelector('.user-profile-modal-header');
      if (!modalHeader) {
        test.issues.push('❌ Modal header missing');
      }

      const modalNavigation = profileModal.querySelector('.profile-navigation');
      if (!modalNavigation) {
        test.issues.push('❌ Modal navigation missing');
      }

      // Check navigation items
      const navItems = profileModal.querySelectorAll('.profile-nav-item');
      const expectedSections = ['profile', 'settings', 'theme'];
      
      expectedSections.forEach(section => {
        const found = Array.from(navItems).some(item => item.dataset.section === section);
        if (!found) {
          test.issues.push(`❌ Navigation item '${section}' missing`);
        }
      });

      // Check if modal manager is working
      if (!window.app?.modals) {
        test.issues.push('❌ Modal manager not available');
      }

      // Test modal content sections
      const profileSection = document.getElementById('profile-content-section');
      const settingsSection = document.getElementById('settings-content-section');
      const themeSection = document.getElementById('theme-content-section');

      if (!profileSection) test.issues.push('❌ Profile section missing');
      if (!settingsSection) test.issues.push('❌ Settings section missing');
      if (!themeSection) test.issues.push('❌ Theme section missing');

      test.status = test.issues.length === 0 ? 'passed' : 'warning';
      
    } catch (error) {
      test.status = 'failed';
      test.issues.push(`❌ Error: ${error.message}`);
    }

    this.testResults.push(test);
  }

  // Test 3: Navigation System
  async testNavigation() {
    const test = { name: 'Navigation System', status: 'pending', issues: [] };
    
    try {
      // Check desktop navigation
      const sidebarNav = document.querySelector('.sidebar-nav');
      if (!sidebarNav) {
        test.issues.push('❌ Sidebar navigation not found');
      }

      // Check mobile navigation
      const mobileNav = document.querySelector('.mobile-nav');
      if (!mobileNav) {
        test.issues.push('❌ Mobile navigation not found');
      }

      // Check navigation items
      const navItems = document.querySelectorAll('.nav-item[data-section]');
      const mobileNavItems = document.querySelectorAll('.mobile-nav-item[data-section]');
      
      if (navItems.length === 0) {
        test.issues.push('❌ No navigation items found');
      }

      if (mobileNavItems.length === 0) {
        test.issues.push('❌ No mobile navigation items found');
      }

      // Check if navigation manager is working
      if (!window.app?.navigation) {
        test.issues.push('❌ Navigation manager not available');
      }

      // Test touch targets for mobile nav
      mobileNavItems.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        if (rect.height > 0 && rect.height < 44) { // Only check if visible
          test.issues.push(`⚠️ Mobile nav item ${index} touch target too small: ${rect.height}px`);
        }
      });

      test.status = test.issues.length === 0 ? 'passed' : 'warning';
      
    } catch (error) {
      test.status = 'failed';
      test.issues.push(`❌ Error: ${error.message}`);
    }

    this.testResults.push(test);
  }

  // Test 4: Forms and Inputs
  async testForms() {
    const test = { name: 'Forms and Inputs', status: 'pending', issues: [] };
    
    try {
      // Check all inputs for mobile optimization
      const inputs = document.querySelectorAll('input, select, textarea');
      
      inputs.forEach((input, index) => {
        const style = window.getComputedStyle(input);
        const fontSize = parseFloat(style.fontSize);
        
        // Check font size to prevent zoom on iOS
        if (fontSize < 16) {
          test.issues.push(`⚠️ Input ${index} font-size too small (${fontSize}px), may cause zoom on iOS`);
        }

        // Check touch target size
        const rect = input.getBoundingClientRect();
        if (rect.height > 0 && rect.height < 44) {
          test.issues.push(`⚠️ Input ${index} touch target too small: ${rect.height}px`);
        }
      });

      // Check modal forms specifically
      const modalForms = document.querySelectorAll('.modal-form');
      if (modalForms.length === 0) {
        test.issues.push('⚠️ No modal forms found for testing');
      }

      test.status = test.issues.length === 0 ? 'passed' : 'warning';
      
    } catch (error) {
      test.status = 'failed';
      test.issues.push(`❌ Error: ${error.message}`);
    }

    this.testResults.push(test);
  }

  // Test 5: Responsive Design
  async testResponsive() {
    const test = { name: 'Responsive Design', status: 'pending', issues: [] };
    
    try {
      const breakpoints = [320, 375, 414, 768, 1024, 1200];
      const originalWidth = window.innerWidth;
      
      // Test different viewport sizes (simulation)
      breakpoints.forEach(width => {
        // Check if CSS variables are properly set
        const root = document.documentElement;
        const mobileSpacing = getComputedStyle(root).getPropertyValue('--mobile-spacing-md');
        
        if (width <= 768 && !mobileSpacing) {
          test.issues.push(`⚠️ Mobile CSS variables not loaded for ${width}px`);
        }
      });

      // Check if mobile-optimized.css is loaded
      const styleSheets = Array.from(document.styleSheets);
      const mobileCSS = styleSheets.find(sheet => 
        sheet.href && sheet.href.includes('mobile-optimized.css')
      );
      
      if (!mobileCSS) {
        test.issues.push('❌ mobile-optimized.css not loaded');
      }

      // Check critical responsive elements
      const userProfileBtn = document.querySelector('.user-profile-btn');
      if (userProfileBtn) {
        const media = window.matchMedia('(max-width: 768px)');
        if (media.matches) {
          const style = window.getComputedStyle(userProfileBtn);
          const width = parseFloat(style.width);
          const height = parseFloat(style.height);
          
          if (width < 44 || height < 44) {
            test.issues.push(`⚠️ Profile button not mobile optimized: ${width}x${height}px`);
          }
        }
      }

      test.status = test.issues.length === 0 ? 'passed' : 'warning';
      
    } catch (error) {
      test.status = 'failed';
      test.issues.push(`❌ Error: ${error.message}`);
    }

    this.testResults.push(test);
  }

  // Test 6: Performance
  async testPerformance() {
    const test = { name: 'Performance', status: 'pending', issues: [] };
    
    try {
      // Check if performance API is available
      if (!window.performance) {
        test.issues.push('⚠️ Performance API not available');
        test.status = 'warning';
        this.testResults.push(test);
        return;
      }

      // Check paint timing
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcp && fcp.startTime > 3000) {
        test.issues.push(`⚠️ First Contentful Paint slow: ${fcp.startTime.toFixed(0)}ms`);
      }

      // Check for large images
      const images = document.querySelectorAll('img');
      images.forEach((img, index) => {
        if (img.naturalWidth > 1920 || img.naturalHeight > 1080) {
          test.issues.push(`⚠️ Image ${index} potentially too large: ${img.naturalWidth}x${img.naturalHeight}`);
        }
      });

      // Check CSS file count
      const cssCount = Array.from(document.styleSheets).length;
      if (cssCount > 10) {
        test.issues.push(`⚠️ Many CSS files loaded: ${cssCount} (consider bundling)`);
      }

      test.status = test.issues.length === 0 ? 'passed' : 'warning';
      
    } catch (error) {
      test.status = 'failed';
      test.issues.push(`❌ Error: ${error.message}`);
    }

    this.testResults.push(test);
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n🧪 MOBILE TESTING REPORT');
    console.log('========================\n');
    
    const passed = this.testResults.filter(t => t.status === 'passed').length;
    const warnings = this.testResults.filter(t => t.status === 'warning').length;
    const failed = this.testResults.filter(t => t.status === 'failed').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Failed: ${failed}\n`);
    
    this.testResults.forEach(test => {
      const icon = test.status === 'passed' ? '✅' : test.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${test.name}`);
      
      if (test.issues.length > 0) {
        test.issues.forEach(issue => {
          console.log(`   ${issue}`);
        });
      }
      console.log('');
    });

    // Overall assessment
    const overallScore = ((passed + warnings * 0.5) / this.testResults.length * 100).toFixed(0);
    console.log(`📊 Overall Mobile Optimization Score: ${overallScore}%`);
    
    if (overallScore >= 90) {
      console.log('🎉 Excellent mobile optimization!');
    } else if (overallScore >= 75) {
      console.log('👍 Good mobile optimization with some improvements needed.');
    } else if (overallScore >= 60) {
      console.log('⚠️ Mobile optimization needs attention.');
    } else {
      console.log('🚨 Critical mobile optimization issues found.');
    }
  }
}

// Auto-run tests in development
if ((import.meta.env?.DEV || window.location.hostname === 'localhost') && window.location.search.includes('test=mobile')) {
  window.addEventListener('load', async () => {
    // Wait for app to initialize
    setTimeout(async () => {
      const testing = new MobileTesting();
      await testing.runAllTests();
    }, 2000);
  });
}