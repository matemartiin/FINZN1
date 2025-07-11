@@ .. @@
   getCurrentUser() {
     return localStorage.getItem('currentUser');
   }
 
+  isDeveloperMode() {
+    const currentUser = this.getCurrentUser();
+    const developerUsers = ['mateo']; // Users with developer mode access
+    return developerUsers.includes(currentUser?.toLowerCase());
+  }
+
   isAuthenticated() {
     return !!this.getCurrentUser();
   }
 }