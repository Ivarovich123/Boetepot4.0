// Leaderboard API endpoint
export default async function handler(req, res) {
  const supabaseUrl = 'https://vfsdttmqrzcdokqaoofd.supabase.co/rest/v1';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc2R0dG1xcnpjZG9rcWFvb2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzc1MDA5NTEsImV4cCI6MTk5MzA3Njk1MX0.BYVqeqh-qwox4Os_DCzPXjtEM32U2FvaSU3VetOjTwY';
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get all players and fines
    const [playersResponse, finesResponse] = await Promise.all([
      fetch(`${supabaseUrl}/players?select=id,name`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }),
      fetch(`${supabaseUrl}/fines?select=player_id,amount`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      })
    ]);
    
    if (!playersResponse.ok || !finesResponse.ok) {
      throw new Error(`Supabase API error`);
    }
    
    const players = await playersResponse.json();
    const fines = await finesResponse.json();
    
    // Calculate totals for each player
    const playerTotals = players.map(player => {
      const playerFines = fines.filter(fine => fine.player_id === player.id);
      const totalFined = playerFines.reduce((sum, fine) => sum + (parseFloat(fine.amount) || 0), 0);
      
      return {
        id: player.id,
        name: player.name,
        totalFined,
        fineCount: playerFines.length
      };
    });
    
    // Sort by total amount, descending
    const sortedLeaderboard = playerTotals
      .sort((a, b) => b.totalFined - a.totalFined)
      .slice(0, 5); // Get top 5
    
    return res.status(200).json(sortedLeaderboard);
  } catch (error) {
    console.error('Leaderboard API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
} 