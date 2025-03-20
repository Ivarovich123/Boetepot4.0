require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection
supabase.from('fines').select('count').limit(1)
  .then(() => {
    console.log('Supabase connection test successful');
  })
  .catch(error => {
    console.error('Supabase connection test failed:', error);
  });

// Helper function to handle database errors
function handleError(error, operation) {
  console.error(`Error during ${operation}:`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code
  });
  throw error;
}

async function getTotalFines() {
  try {
    const { data, error } = await supabase
      .from('fines')
      .select('amount')
      .not('amount', 'is', null);
      
    if (error) throw error;
    
    const total = data.reduce((sum, fine) => sum + (fine.amount || 0), 0);
    return total;
  } catch (error) {
    handleError(error, 'getTotalFines');
  }
}

async function getPublicFines() {
  try {
    const { data, error } = await supabase
      .from('fines')
      .select(`
        id,
        amount,
        date,
        players:player_id (name),
        reasons:reason_id (description)
      `)
      .order('date', { ascending: false })
      .limit(10);
      
    if (error) throw error;
    
    return data.map(fine => ({
      id: fine.id,
      amount: fine.amount,
      date: fine.date,
      player_name: fine.players?.name,
      reason_description: fine.reasons?.description
    }));
  } catch (error) {
    handleError(error, 'getPublicFines');
  }
}

async function getPlayerTotals() {
  try {
    const { data, error } = await supabase
      .from('players')
      .select(`
        id,
        name,
        fines:fines (amount)
      `);
      
    if (error) throw error;
    
    return data.map(player => ({
      id: player.id,
      player_name: player.name,
      total_amount: player.fines?.reduce((sum, fine) => sum + (fine.amount || 0), 0) || 0
    }))
    .sort((a, b) => b.total_amount - a.total_amount);
  } catch (error) {
    handleError(error, 'getPlayerTotals');
  }
}

module.exports = {
  supabase,
  getTotalFines,
  getPublicFines,
  getPlayerTotals
}; 