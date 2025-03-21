require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials:', {
    url: supabaseUrl ? 'Present' : 'Missing',
    key: supabaseKey ? 'Present' : 'Missing'
  });
  throw new Error('Missing Supabase credentials');
}

console.log('Initializing Supabase client with:', {
  url: supabaseUrl.substring(0, 15) + '...',
  keyLength: supabaseKey ? supabaseKey.length : 0
});

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Test the connection
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('players').select('count').limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test threw exception:', error);
    return false;
  }
}

// Call test connection immediately
testConnection();

// Helper function to handle database errors
function handleError(error, operation) {
  console.error(`Error during ${operation}:`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
    stack: error.stack
  });
  
  // Make error more user-friendly
  const friendlyMessage = getFriendlyErrorMessage(error, operation);
  const enhancedError = new Error(friendlyMessage);
  enhancedError.originalError = error;
  throw enhancedError;
}

function getFriendlyErrorMessage(error, operation) {
  // Handle specific error codes
  if (error.code === '23505') {
    return 'Deze naam bestaat al in de database';
  }
  
  if (error.code === '23503') {
    return 'De opgegeven speler of reden bestaat niet';
  }
  
  if (error.code === '42P01') {
    return 'Database tabel niet gevonden. Controleer of de database correct is opgezet.';
  }
  
  if (error.message && error.message.includes('JWT')) {
    return 'Authenticatie probleem. Probeer de server te herstarten.';
  }
  
  // Default messages based on operation
  switch (operation) {
    case 'getPlayers':
      return 'Kon de spelers niet ophalen';
    case 'addPlayer':
      return 'Kon de speler niet toevoegen';
    case 'getReasons':
      return 'Kon de redenen niet ophalen';
    case 'addReason':
      return 'Kon de reden niet toevoegen';
    case 'addFine':
      return 'Kon de boete niet toevoegen';
    case 'getTotalFines':
      return 'Kon het totaalbedrag niet berekenen';
    case 'getPublicFines':
      return 'Kon de recente boetes niet ophalen';
    case 'getPlayerTotals':
      return 'Kon de spelertotalen niet ophalen';
    default:
      return `Database fout: ${error.message || 'Onbekende fout'}`;
  }
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
    return data || [];
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
    return data || [];
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
    
    // Validate input
    const player_id = parseInt(fine.player_id);
    const reason_id = parseInt(fine.reason_id);
    const amount = parseFloat(fine.amount);
    
    if (isNaN(player_id) || isNaN(reason_id) || isNaN(amount)) {
      throw new Error('Invalid input values');
    }
    
    // First check if player and reason exist
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id')
      .eq('id', player_id)
      .single();
      
    if (playerError || !player) {
      throw new Error('Player not found');
    }
    
    const { data: reason, error: reasonError } = await supabase
      .from('reasons')
      .select('id')
      .eq('id', reason_id)
      .single();
      
    if (reasonError || !reason) {
      throw new Error('Reason not found');
    }
    
    // Insert the fine
    const { data, error } = await supabase
      .from('fines')
      .insert([{
        player_id,
        reason_id,
        amount,
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
      
    if (error) {
      console.error('[DB] Error adding fine:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Failed to add fine');
    }
    
    console.log('[DB] Added fine:', data);
    return {
      id: data.id,
      amount: data.amount,
      date: data.date,
      player_name: data.players?.name,
      reason_description: data.reasons?.description
    };
  } catch (error) {
    console.error('[DB] Error in addFine:', error);
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

async function getPlayerHistory(playerId) {
  try {
    console.log('[DB] Fetching player history for ID:', playerId);
    const { data, error } = await supabase
      .from('fines')
      .select(`
        id,
        amount,
        date,
        reasons:reason_id (description)
      `)
      .eq('player_id', playerId)
      .order('date', { ascending: false });
      
    if (error) throw error;
    
    console.log('[DB] Player history data:', data);
    return data.map(fine => ({
      id: fine.id,
      amount: fine.amount,
      date: fine.date,
      reason_description: fine.reasons?.description
    }));
  } catch (error) {
    handleError(error, 'getPlayerHistory');
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
  getPlayerTotals,
  getPlayerHistory
}; 