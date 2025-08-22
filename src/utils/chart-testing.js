// Chart Testing Utilities - FINZN
// Specific testing for chart colors and mobile optimization

export class ChartTesting {
  constructor() {
    this.isDev = import.meta.env?.DEV || window.location.hostname === 'localhost';
  }

  // Test chart color uniqueness
  testColorUniqueness(colors, chartName = 'Chart') {
    const uniqueColors = new Set(colors);
    const hasDuplicates = uniqueColors.size !== colors.length;
    
    if (this.isDev) {
      if (hasDuplicates) {
        const duplicates = colors.filter((color, index) => colors.indexOf(color) !== index);
        console.error(`❌ ${chartName} has duplicate colors:`, duplicates);
        console.log('All colors:', colors);
        return false;
      } else {
        console.log(`✅ ${chartName} colors are unique:`, colors);
        return true;
      }
    }
    
    return !hasDuplicates;
  }

  // Test color contrast for mobile visibility
  testColorContrast(colors, background = '#ffffff') {
    const results = [];
    
    colors.forEach((color, index) => {
      const contrast = this.calculateContrast(color, background);
      const isAccessible = contrast >= 3.0; // WCAG AA standard for graphics
      
      results.push({
        color,
        contrast: contrast.toFixed(2),
        accessible: isAccessible,
        index
      });
      
      if (this.isDev) {
        const status = isAccessible ? '✅' : '⚠️';
        console.log(`${status} Color ${index} (${color}): contrast ${contrast.toFixed(2)}`);
      }
    });
    
    return results;
  }

  // Calculate color contrast ratio
  calculateContrast(color1, color2) {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  // Get relative luminance of a color
  getLuminance(color) {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;
    
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;
    
    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // Convert hex to RGB
  hexToRgb(hex) {
    // Handle HSL colors
    if (hex.startsWith('hsl')) {
      return this.hslToRgb(hex);
    }
    
    // Handle hex colors
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Convert HSL to RGB
  hslToRgb(hsl) {
    const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return null;
    
    const h = parseInt(match[1]) / 360;
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  // Test chart mobile responsiveness
  testChartMobileResponsiveness() {
    const results = [];
    const chartContainers = document.querySelectorAll('.chart-container, #expenses-chart-container, #income-chart-container');
    
    chartContainers.forEach((container, index) => {
      const rect = container.getBoundingClientRect();
      const styles = window.getComputedStyle(container);
      
      const test = {
        element: container.id || `chart-${index}`,
        width: rect.width,
        height: rect.height,
        responsive: rect.width <= window.innerWidth,
        hasMinHeight: parseFloat(styles.minHeight) > 0 || rect.height >= 200,
        visible: rect.width > 0 && rect.height > 0
      };
      
      results.push(test);
      
      if (this.isDev) {
        const status = test.responsive && test.hasMinHeight && test.visible ? '✅' : '⚠️';
        console.log(`${status} Chart ${test.element}: ${test.width}x${test.height}px`);
      }
    });
    
    return results;
  }

  // Generate test data and validate chart system
  async testChartSystem() {
    if (this.isDev) {
      console.log('🧪 Testing Chart System...');
    }
    
    const results = {
      colorTests: [],
      contrastTests: [],
      responsivenessTests: [],
      overallScore: 0
    };
    
    // Test if ChartManager is available
    if (!window.app?.charts) {
      if (this.isDev) {
        console.error('❌ ChartManager not available');
      }
      return results;
    }
    
    const chartManager = window.app.charts;
    
    // Test color generation
    const testColors1 = chartManager.generateUniqueColors(5);
    const testColors2 = chartManager.generateUniqueColors(10);
    const testColors3 = chartManager.generateUniqueColors(25);
    
    results.colorTests = [
      {
        count: 5,
        colors: testColors1,
        unique: this.testColorUniqueness(testColors1, 'Test 5 colors')
      },
      {
        count: 10,
        colors: testColors2,
        unique: this.testColorUniqueness(testColors2, 'Test 10 colors')
      },
      {
        count: 25,
        colors: testColors3,
        unique: this.testColorUniqueness(testColors3, 'Test 25 colors')
      }
    ];
    
    // Test contrast for light and dark modes
    const lightBg = '#ffffff';
    const darkBg = '#1a202c';
    
    results.contrastTests = [
      {
        mode: 'light',
        background: lightBg,
        results: this.testColorContrast(testColors2, lightBg)
      },
      {
        mode: 'dark',
        background: darkBg,
        results: this.testColorContrast(testColors2, darkBg)
      }
    ];
    
    // Test mobile responsiveness
    results.responsivenessTests = this.testChartMobileResponsiveness();
    
    // Calculate overall score
    const uniqueScore = results.colorTests.filter(t => t.unique).length / results.colorTests.length;
    const contrastScore = results.contrastTests.reduce((acc, test) => {
      const accessibleColors = test.results.filter(r => r.accessible).length;
      return acc + (accessibleColors / test.results.length);
    }, 0) / results.contrastTests.length;
    const responsiveScore = results.responsivenessTests.filter(t => t.responsive && t.visible).length / Math.max(1, results.responsivenessTests.length);
    
    results.overallScore = Math.round((uniqueScore + contrastScore + responsiveScore) / 3 * 100);
    
    if (this.isDev) {
      console.log(`📊 Chart System Score: ${results.overallScore}%`);
      console.log('Color Uniqueness:', `${Math.round(uniqueScore * 100)}%`);
      console.log('Color Contrast:', `${Math.round(contrastScore * 100)}%`);
      console.log('Mobile Responsive:', `${Math.round(responsiveScore * 100)}%`);
    }
    
    return results;
  }

  // Visual test of color palette
  createColorPalette(colors, containerId = 'color-test-palette') {
    if (!this.isDev) return;
    
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 16px;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      `;
      document.body.appendChild(container);
    }
    
    container.innerHTML = `
      <h4 style="margin: 0 0 12px 0; font-size: 14px;">Color Palette Test</h4>
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px;">
        ${colors.map((color, i) => `
          <div style="
            width: 30px; 
            height: 30px; 
            background: ${color}; 
            border-radius: 4px;
            border: 1px solid #ddd;
            position: relative;
          " title="${color}">
            <span style="
              position: absolute;
              bottom: -16px;
              left: 50%;
              transform: translateX(-50%);
              font-size: 8px;
              white-space: nowrap;
            ">${i}</span>
          </div>
        `).join('')}
      </div>
      <button onclick="this.parentElement.remove()" style="
        margin-top: 16px;
        padding: 4px 8px;
        border: 1px solid #ddd;
        background: #f5f5f5;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      ">Close</button>
    `;
  }
}

// Auto-run chart tests in development
if ((import.meta.env?.DEV || window.location.hostname === 'localhost') && 
    window.location.search.includes('test=charts')) {
  window.addEventListener('load', async () => {
    setTimeout(async () => {
      const testing = new ChartTesting();
      const results = await testing.testChartSystem();
      
      // Show visual color palette
      if (window.app?.charts) {
        const colors = window.app.charts.generateUniqueColors(20);
        testing.createColorPalette(colors);
      }
    }, 3000);
  });
}