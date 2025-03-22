// Reasons API endpoint
export default async function handler(req, res) {
  const supabaseUrl = 'https://vfsdttmqrzcdokqaoofd.supabase.co/rest/v1';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc2R0dG1xcnpjZG9rcWFvb2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzc1MDA5NTEsImV4cCI6MTk5MzA3Njk1MX0.BYVqeqh-qwox4Os_DCzPXjtEM32U2FvaSU3VetOjTwY';
  
  try {
    // Handle different methods
    if (req.method === 'GET') {
      // Get all reasons
      const response = await fetch(`${supabaseUrl}/reasons?select=*&order=description.asc`, {
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
      return res.status(200).json(data);
    } 
    else if (req.method === 'POST') {
      // Create a new reason
      const { description } = req.body;
      
      if (!description) {
        return res.status(400).json({ error: 'Description is required' });
      }
      
      const response = await fetch(`${supabaseUrl}/reasons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ description })
      });
      
      if (!response.ok) {
        throw new Error(`Supabase API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return res.status(201).json(data[0]);
    }
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Reasons API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
} 