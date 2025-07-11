@@ .. @@
   isAuthenticated() {
     return !!this.getCurrentUser();
   }
+
+  isDeveloperMode() {
+    return this.getCurrentUser()?.toLowerCase() === 'mateo';
+  }
 }