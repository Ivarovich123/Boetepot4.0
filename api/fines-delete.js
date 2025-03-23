// API endpoint to delete a fine
export default async function handler(req, res) {
  const fineId = req.query.id;
  
  if (!fineId) {
    return res.status(400).json({ error: 'Fine ID is required' });
  }
  
  const supabaseUrl = 'https://vfsdttmqrzcdokqaoofd.supabase.co/rest/v1';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc2R0dG1xcnpjZG9rcWFvb2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzc1MDA5NTEsImV4cCI6MTk5MzA3Njk1MX0.BYVqeqh-qwox4Os_DCzPXjtEM32U2FvaSU3VetOjTwY';
  
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Delete the fine
    const response = await fetch(
      `${supabaseUrl}/fines?id=eq.${fineId}`, 
      {
        method: 'DELETE',
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
    
    return res.status(200).json({ message: 'Fine deleted successfully' });
  } catch (error) {
    console.error('Delete Fine API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
} 