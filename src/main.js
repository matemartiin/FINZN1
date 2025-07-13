@@ .. @@
   async showApp() {
     document.getElementById('login-container').classList.add('hidden');
     document.getElementById('register-container').classList.add('hidden');
     document.getElementById('app').classList.remove('hidden');
     
   }
-    // Update user info
-    const currentUser = this.auth.getCurrentUser();
-    document.getElementById('user-name').textContent = `👤 ${currentUser}`;
+    // Update user info with username
+    const username = await this.auth.getCurrentUsername();
+    document.getElementById('user-name').textContent = `👤 ${username || 'Usuario'}`;
     
     // Initialize month selector
     this.initMonthSelector();