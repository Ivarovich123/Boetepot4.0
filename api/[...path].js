// Middleware to proxy requests to Supabase
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, apikey, Authorization');

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;
  const supabaseUrl = 'https://vfsdttmqrzcdokqaoofd.supabase.co/rest/v1';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc2R0dG1xcnpjZG9rcWFvb2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzc1MDA5NTEsImV4cCI6MTk5MzA3Njk1MX0.BYVqeqh-qwox4Os_DCzPXjtEM32U2FvaSU3VetOjTwY';
  
  // Construct the URL to the Supabase endpoint
  const endpoint = Array.isArray(path) ? path.join('/') : path;
  const url = `${supabaseUrl}/${endpoint}`;
  
  // Add query parameters if present
  const queryParams = new URLSearchParams();
  // Copy all query parameters except 'path'
  Object.keys(req.query).forEach(key => {
    if (key !== 'path') {
      queryParams.append(key, req.query[key]);
    }
  });
  
  const queryString = queryParams.toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;
  
  console.log(`Proxying ${req.method} request to ${fullUrl}`);
  
  try {
    // Prepare request body
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      body = JSON.stringify(req.body);
    }
    
    // Forward the request to Supabase
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: body
    });
    
    // Check if response is ok
    if (!response.ok) {
      console.error(`Supabase returned error: ${response.status} ${response.statusText}`);
      // Try to get error details from response body
      try {
        const errorData = await response.json();
        return res.status(response.status).json({
          error: `Supabase Error: ${response.status} ${response.statusText}`,
          details: errorData
        });
      } catch (jsonError) {
        // If can't parse JSON, just return status text
        return res.status(response.status).json({
          error: `Supabase Error: ${response.status} ${response.statusText}`
        });
      }
    }
    
    // Try to parse response as JSON
    try {
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (jsonError) {
      // If response is not JSON, return raw text
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (error) {
    console.error('API Proxy Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 