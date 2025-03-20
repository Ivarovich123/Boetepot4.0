require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials:', {
    url: supabaseUrl ? 'Present' : 'Missing',
    key: supabaseKey ? 'Present' : 'Missing'
  });
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

// Player Management
async function getPlayers() {
  try {
    console.log('[DB] Fetching players...');
    const { data, error } = await supabase
      .from('players')
      .select('id, name')
      .order('name');
      
    if (error) throw error;
    
    console.log('[DB] Players data:', data);
    return data;
  } catch (error) {
    handleError(error, 'getPlayers');
  }
}

async function addPlayer(name) {
  try {
    console.log('[DB] Adding player:', name);
    const { data, error } = await supabase
      .from('players')
      .insert([{ name }])
      .select()
      .single();
      
    if (error) throw error;
    
    console.log('[DB] Added player:', data);
    return data;
  } catch (error) {
    handleError(error, 'addPlayer');
  }
}

// Reason Management
async function getReasons() {
  try {
    console.log('[DB] Fetching reasons...');
    const { data, error } = await supabase
      .from('reasons')
      .select('id, description')
      .order('description');
      
    if (error) throw error;
    
    console.log('[DB] Reasons data:', data);
    return data;
  } catch (error) {
    handleError(error, 'getReasons');
  }
}

async function addReason(description) {
  try {
    console.log('[DB] Adding reason:', description);
    const { data, error } = await supabase
      .from('reasons')
      .insert([{ description }])
      .select()
      .single();
      
    if (error) throw error;
    
    console.log('[DB] Added reason:', data);
    return data;
  } catch (error) {
    handleError(error, 'addReason');
  }
}

// Fine Management
async function addFine(fine) {
  try {
    console.log('[DB] Adding fine:', fine);
    const { data, error } = await supabase
      .from('fines')
      .insert([{
        player_id: fine.player_id,
        reason_id: fine.reason_id,
        amount: fine.amount,
        date: new Date().toISOString()
      }])
      .select(`
        id,
        amount,
        date,
        players:player_id (name),
        reasons:reason_id (description)
      `)
      .single();
      
    if (error) throw error;
    
    console.log('[DB] Added fine:', data);
    return data;
  } catch (error) {
    handleError(error, 'addFine');
  }
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
    console.log('[DB] Fetching recent fines...');
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
      
    if (error) {
      console.error('[DB] Error fetching recent fines:', error);
      throw error;
    }
    
    console.log('[DB] Recent fines data:', data);
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
    console.log('[DB] Fetching player totals...');
    const { data, error } = await supabase
      .from('players')
      .select(`
        id,
        name,
        fines:fines (amount)
      `);
      
    if (error) {
      console.error('[DB] Error fetching player totals:', error);
      throw error;
    }
    
    console.log('[DB] Player totals data:', data);
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
  getPlayers,
  addPlayer,
  getReasons,
  addReason,
  addFine,
  getTotalFines,
  getPublicFines,
  getPlayerTotals
}; 