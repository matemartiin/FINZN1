export class AnimatedEye {
  constructor(svgElement) {
    this.svgElement = svgElement;
    this.states = ['open', 'half-open', 'almost-closed', 'closed'];
    this.currentStateIndex = 0;
    this.isAnimating = false;
    
    // Initialize with first state
    this.updateState();
  }
  
  // Animate closing sequence (open -> closed)
  animateClosing() {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    
    // Start from open state
    this.currentStateIndex = 0;
    this.updateState();
    
    // Animate through each state with delays
    const delays = [300, 300, 300]; // Delays between states in ms
    
    delays.forEach((delay, index) => {
      setTimeout(() => {
        this.currentStateIndex = index + 1;
        this.updateState();
        
        // If we've reached the last state, allow new animations
        if (index === delays.length - 1) {
          this.isAnimating = false;
        }
      }, delay * (index + 1));
    });
  }
  
  // Animate opening sequence (closed -> open)
  animateOpening() {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    
    // Start from closed state
    this.currentStateIndex = 3; // closed
    this.updateState();
    
    // Animate backwards through states (closed -> open)
    const delays = [300, 300, 300]; // Delays between states in ms
    
    delays.forEach((delay, index) => {
      setTimeout(() => {
        this.currentStateIndex = 3 - (index + 1); // Go backwards
        this.updateState();
        
        // If we've reached the first state, allow new animations
        if (index === delays.length - 1) {
          this.isAnimating = false;
        }
      }, delay * (index + 1));
    });
  }
  
  // Get current state name
  getCurrentState() {
    return this.states[this.currentStateIndex];
  }
  
  // Update the SVG data-state attribute
  updateState() {
    const currentState = this.getCurrentState();
    this.svgElement.setAttribute('data-state', currentState);
  }
  
  // Set specific state by name
  setState(stateName) {
    if (this.isAnimating) return; // Don't allow manual state changes during animation
    
    const stateIndex = this.states.indexOf(stateName);
    if (stateIndex !== -1) {
      this.currentStateIndex = stateIndex;
      this.updateState();
    }
  }
  
  // Reset to first state
  reset() {
    if (this.isAnimating) return;
    
    this.currentStateIndex = 0;
    this.updateState();
  }
  
  // Check if currently animating
  getIsAnimating() {
    return this.isAnimating;
  }
}