// Middleware to proxy requests to Supabase
export default async function handler(req, res) {
  const { path } = req.query;
  const supabaseUrl = 'https://vfsdttmqrzcdokqaoofd.supabase.co/rest/v1';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc2R0dG1xcnpjZG9rcWFvb2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzc1MDA5NTEsImV4cCI6MTk5MzA3Njk1MX0.BYVqeqh-qwox4Os_DCzPXjtEM32U2FvaSU3VetOjTwY';
  
  // Construct the URL to the Supabase endpoint
  const endpoint = Array.isArray(path) ? path.join('/') : path;
  const url = `${supabaseUrl}/${endpoint}`;
  
  // Add query parameters if present
  const queryParams = new URLSearchParams(req.query);
  queryParams.delete('path'); // Remove the path parameter
  const queryString = queryParams.toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;
  
  try {
    // Forward the request to Supabase
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    
    // Get response data
    const data = await response.json();
    
    // Return the response with the same status code
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('API Proxy Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
} 