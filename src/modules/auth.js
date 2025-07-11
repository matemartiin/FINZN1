@@ .. @@
   isAuthenticated() {
     return !!this.getCurrentUser();
   }
+
+  isDeveloperMode() {
+    const currentUser = this.getCurrentUser();
+    const developerUsers = ['mateo']; // Users with developer privileges
+    return developerUsers.includes(currentUser?.toLowerCase());
+  }
 }