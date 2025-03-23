// API endpoint to get a specific player by ID
export default async function handler(req, res) {
  const playerId = req.query.id;
  
  if (!playerId) {
    return res.status(400).json({ error: 'Player ID is required' });
  }
  
  const supabaseUrl = 'https://vfsdttmqrzcdokqaoofd.supabase.co/rest/v1';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc2R0dG1xcnpjZG9rcWFvb2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzc1MDA5NTEsImV4cCI6MTk5MzA3Njk1MX0.BYVqeqh-qwox4Os_DCzPXjtEM32U2FvaSU3VetOjTwY';
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get player details
    const response = await fetch(
      `${supabaseUrl}/players?id=eq.${playerId}&select=*`, 
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Supabase returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    return res.status(200).json(data[0]);
  } catch (error) {
    console.error('Player API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
} 