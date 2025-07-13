async showApp() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    
    // Update user info with username
    const username = await this.auth.getCurrentUsername();
    document.getElementById('user-name').textContent = `👤 ${username || 'Usuario'}`;
    
    // Initialize month selector
    this.initMonthSelector();

  handleMonthChange(e) {
    const currentUserId = this.auth.getCurrentUser();
    
    // For now, allow all users to change months
    // You can add specific user restrictions here if needed
    /*
    if (currentUserId !== 'specific-user-id') {
      e.preventDefault();
      // Reset to current month for restricted users
      e.target.value = this.getCurrentMonth();
      this.ui.showAlert('No tienes permisos para cambiar el mes', 'error');
      return;
    }
    */
    
    const previousMonth = this.currentMonth;
    this.currentMonth = e.target.value;