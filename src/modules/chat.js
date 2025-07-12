async fetchWithRetry(url, options, retries = 3) {
    // Determine the correct base URL for the API
    let baseUrl;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      baseUrl = 'http://localhost:3001';
    } else {
      baseUrl = window.location.origin;
    }
    
    const fullUrl = `${baseUrl}${url}`;
    
    console.log('Attempting to fetch:', fullUrl); // Debug log
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(fullUrl, {
          ...options,
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });
        return response;
      } catch (error) {
        console.error(`Fetch attempt ${i + 1} failed:`, error);
        if (i === retries - 1) throw error;
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
}