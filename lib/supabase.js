require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('Supabase Configuration:', {
  url: supabaseUrl ? 'Present' : 'Missing',
  key: supabaseAnonKey ? 'Present' : 'Missing',
  urlLength: supabaseUrl ? supabaseUrl.length : 0,
  keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials:', {
    url: supabaseUrl ? 'Present' : 'Missing',
    key: supabaseAnonKey ? 'Present' : 'Missing'
  });
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test the connection
supabase.from('players').select('count').limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('Supabase connection test failed:', error);
    } else {
      console.log('Supabase connection test successful');
    }
  })
  .catch(error => {
    console.error('Supabase connection test error:', error);
  });

// Helper function to handle database errors
function handleError(error, operation) {
  console.error(`Error during ${operation}:`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code
  });
  throw new Error(`Database error during ${operation}: ${error.message}`);
}

// Helper functions for database operations
async function getPlayers() {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name');
    
    if (error) handleError(error, 'getPlayers');
    return data;
  } catch (error) {
    handleError(error, 'getPlayers');
  }
}

async function addPlayer(name) {
  try {
    const { data, error } = await supabase
      .from('players')
      .insert([{ name }])
      .select();
    
    if (error) handleError(error, 'addPlayer');
    return data[0];
  } catch (error) {
    handleError(error, 'addPlayer');
  }
}

async function getReasons() {
  try {
    const { data, error } = await supabase
      .from('reasons')
      .select('*')
      .order('description');
    
    if (error) handleError(error, 'getReasons');
    return data;
  } catch (error) {
    handleError(error, 'getReasons');
  }
}

async function addReason(description) {
  try {
    const { data, error } = await supabase
      .from('reasons')
      .insert([{ description }])
      .select();
    
    if (error) handleError(error, 'addReason');
    return data[0];
  } catch (error) {
    handleError(error, 'addReason');
  }
}

async function getFines() {
  try {
    const { data, error } = await supabase
      .from('fines')
      .select(`
        *,
        players (name),
        reasons (description)
      `)
      .order('date', { ascending: false });
    
    if (error) handleError(error, 'getFines');
    return data;
  } catch (error) {
    handleError(error, 'getFines');
  }
}

async function addFine(fine) {
  try {
    const { data, error } = await supabase
      .from('fines')
      .insert([{ ...fine, date: new Date().toISOString() }])
      .select();
    
    if (error) handleError(error, 'addFine');
    return data[0];
  } catch (error) {
    handleError(error, 'addFine');
  }
}

async function deleteFine(id) {
  try {
    const { error } = await supabase
      .from('fines')
      .delete()
      .eq('id', id);
    
    if (error) handleError(error, 'deleteFine');
  } catch (error) {
    handleError(error, 'deleteFine');
  }
}

async function getPlayerHistory(playerId) {
  try {
    const { data, error } = await supabase
      .from('fines')
      .select(`
        *,
        reasons (description)
      `)
      .eq('player_id', playerId)
      .order('date', { ascending: false });
    
    if (error) handleError(error, 'getPlayerHistory');
    return data;
  } catch (error) {
    handleError(error, 'getPlayerHistory');
  }
}

async function getPlayerTotals() {
  try {
    const { data, error } = await supabase
      .from('players')
      .select(`
        name,
        fines (amount)
      `);
    
    if (error) handleError(error, 'getPlayerTotals');
    return data.map(player => ({
      name: player.name,
      total: player.fines.reduce((sum, fine) => sum + fine.amount, 0)
    }));
  } catch (error) {
    handleError(error, 'getPlayerTotals');
  }
}

async function getTotalFines() {
  try {
    const { data, error } = await supabase
      .from('fines')
      .select('amount');
    
    if (error) handleError(error, 'getTotalFines');
    return data.reduce((sum, fine) => sum + fine.amount, 0);
  } catch (error) {
    handleError(error, 'getTotalFines');
  }
}

async function deletePlayer(id) {
  try {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id);
    
    if (error) handleError(error, 'deletePlayer');
  } catch (error) {
    handleError(error, 'deletePlayer');
  }
}

async function deleteReason(id) {
  try {
    const { error } = await supabase
      .from('reasons')
      .delete()
      .eq('id', id);
    
    if (error) handleError(error, 'deleteReason');
  } catch (error) {
    handleError(error, 'deleteReason');
  }
}

module.exports = {
  supabase,
  getPlayers,
  addPlayer,
  deletePlayer,
  getReasons,
  addReason,
  deleteReason,
  getFines,
  addFine,
  deleteFine,
  getPlayerHistory,
  getPlayerTotals,
  getTotalFines
}; 