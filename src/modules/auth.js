@@ .. @@
   isAuthenticated() {
     return !!this.getCurrentUser();
   }
+
+  isDeveloperMode() {
+    const currentUser = this.getCurrentUser();
+    return currentUser && currentUser.toLowerCase() === 'mateo';
+  }
 }