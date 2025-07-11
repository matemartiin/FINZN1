```diff
--- a/FINZN/src/modules/auth.js
+++ b/FINZN/src/modules/auth.js
@@ -50,4 +50,8 @@
   isAuthenticated() {
     return !!this.getCurrentUser();
   }
+
+  isDeveloperMode() {
+    return this.getCurrentUser()?.toLowerCase() === 'mateo';
+  }
 }
```