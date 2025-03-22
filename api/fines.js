// Fines API endpoint
export default async function handler(req, res) {
  const supabaseUrl = 'https://vfsdttmqrzcdokqaoofd.supabase.co/rest/v1';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc2R0dG1xcnpjZG9rcWFvb2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzc1MDA5NTEsImV4cCI6MTk5MzA3Njk1MX0.BYVqeqh-qwox4Os_DCzPXjtEM32U2FvaSU3VetOjTwY';
  
  try {
    // Handle different methods
    if (req.method === 'GET') {
      // Get all fines with player and reason details
      const response = await fetch(`${supabaseUrl}/fines?select=*,players:player_id(name),reasons:reason_id(description)&order=created_at.desc`, {
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
      
      // Format the data to match the expected structure
      const formattedData = data.map(fine => ({
        ...fine,
        player_name: fine.players?.name || 'Unknown',
        reason_description: fine.reasons?.description || 'Unknown',
      }));
      
      return res.status(200).json(formattedData);
    } 
    else if (req.method === 'POST') {
      // Create a new fine
      const { player_id, reason_id, amount } = req.body;
      
      if (!player_id || !reason_id || !amount) {
        return res.status(400).json({ error: 'player_id, reason_id, and amount are required' });
      }
      
      // Get player and reason details
      const [playerResponse, reasonResponse] = await Promise.all([
        fetch(`${supabaseUrl}/players?id=eq.${player_id}&select=name`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }),
        fetch(`${supabaseUrl}/reasons?id=eq.${reason_id}&select=description`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        })
      ]);
      
      const playerData = await playerResponse.json();
      const reasonData = await reasonResponse.json();
      
      const playerName = playerData[0]?.name || 'Unknown';
      const reasonDescription = reasonData[0]?.description || 'Unknown';
      
      // Create the fine
      const response = await fetch(`${supabaseUrl}/fines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          player_id: parseInt(player_id), 
          reason_id: parseInt(reason_id),
          amount: parseFloat(amount),
          created_at: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Supabase API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Add additional fields to the response
      const result = {
        ...data[0],
        player_name: playerName,
        reason_description: reasonDescription
      };
      
      return res.status(201).json(result);
    }
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Fines API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
} 