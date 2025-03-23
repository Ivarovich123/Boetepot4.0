// API endpoint to get fines for a specific player
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
    // Get fines for specific player with reason details
    const response = await fetch(
      `${supabaseUrl}/fines?player_id=eq.${playerId}&select=*,reasons:reason_id(description)&order=created_at.desc`, 
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
    
    // Format the data
    const formattedData = data.map(fine => ({
      ...fine,
      reason_description: fine.reasons?.description || 'Unknown',
      date: fine.created_at
    }));
    
    return res.status(200).json(formattedData);
  } catch (error) {
    console.error('Player Fines API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
} 