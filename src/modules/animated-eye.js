export class AnimatedEye {
  constructor(svgElement) {
    this.svgElement = svgElement;
    this.states = ['open', 'half-open', 'almost-closed', 'closed'];
    this.currentStateIndex = 0;
    
    // Initialize with first state
    this.updateState();
  }
  
  // Cycle to next state
  nextState() {
    this.currentStateIndex = (this.currentStateIndex + 1) % this.states.length;
    this.updateState();
    return this.getCurrentState();
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
    const stateIndex = this.states.indexOf(stateName);
    if (stateIndex !== -1) {
      this.currentStateIndex = stateIndex;
      this.updateState();
    }
  }
  
  // Reset to first state
  reset() {
    this.currentStateIndex = 0;
    this.updateState();
  }
}