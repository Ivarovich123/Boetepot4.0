// Test API endpoint to verify Supabase connectivity
export default async function handler(req, res) {
  const supabaseUrl = 'https://vfsdttmqrzcdokqaoofd.supabase.co/rest/v1';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc2R0dG1xcnpjZG9rcWFvb2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzc1MDA5NTEsImV4cCI6MTk5MzA3Njk1MX0.BYVqeqh-qwox4Os_DCzPXjtEM32U2FvaSU3VetOjTwY';
  
  try {
    // Test connection to Supabase
    const response = await fetch(`${supabaseUrl}/players?select=*`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Supabase API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      message: 'Successfully connected to Supabase',
      data: {
        count: data.length,
        sample: data.slice(0, 3) // Return the first 3 items as a sample
      }
    });
  } catch (error) {
    console.error('Supabase Test Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to connect to Supabase',
      error: error.message
    });
  }
} 