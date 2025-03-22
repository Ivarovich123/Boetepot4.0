// Total Amount API endpoint
export default async function handler(req, res) {
  const supabaseUrl = 'https://vfsdttmqrzcdokqaoofd.supabase.co/rest/v1';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc2R0dG1xcnpjZG9rcWFvb2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzc1MDA5NTEsImV4cCI6MTk5MzA3Njk1MX0.BYVqeqh-qwox4Os_DCzPXjtEM32U2FvaSU3VetOjTwY';
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get all fines
    const response = await fetch(`${supabaseUrl}/fines?select=amount`, {
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
    
    // Calculate total
    const total = data.reduce((sum, fine) => {
      return sum + (parseFloat(fine.amount) || 0);
    }, 0);
    
    return res.status(200).json({ total });
  } catch (error) {
    console.error('Total Amount API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
} 