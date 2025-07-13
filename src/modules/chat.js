@@ .. @@
   async fetchWithRetry(url, options, retries = 3) {
-    const baseUrl = window.location.origin.includes('localhost') 
-      ? 'http://localhost:3001' 
-      : window.location.origin;
+    // Use Netlify Functions endpoint
+    const baseUrl = window.location.origin;
     
-    const fullUrl = `${baseUrl}${url}`;
+    // Convert /api/chat to /.netlify/functions/chat
+    const endpoint = url.replace('/api/chat', '/.netlify/functions/chat');
+    const fullUrl = `${baseUrl}${endpoint}`;
     
     for (let i = 0; i < retries; i++) {