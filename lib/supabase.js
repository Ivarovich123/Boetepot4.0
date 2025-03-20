require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials:', {
    url: supabaseUrl ? 'Present' : 'Missing',
    key: supabaseAnonKey ? 'Present' : 'Missing'
  });
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for database operations
async function getPlayers() {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
}

async function getReasons() {
  const { data, error } = await supabase
    .from('reasons')
    .select('*')
    .order('description');
  
  if (error) throw error;
  return data;
}

async function getFines() {
  const { data, error } = await supabase
    .from('fines')
    .select(`
      *,
      players (name),
      reasons (description)
    `)
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data;
}

async function addFine(fine) {
  const { data, error } = await supabase
    .from('fines')
    .insert([fine])
    .select();
  
  if (error) throw error;
  return data[0];
}

async function deleteFine(id) {
  const { error } = await supabase
    .from('fines')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

async function getPlayerHistory(playerId) {
  const { data, error } = await supabase
    .from('fines')
    .select(`
      *,
      reasons (description)
    `)
    .eq('player_id', playerId)
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data;
}

async function getPlayerTotals() {
  const { data, error } = await supabase
    .from('players')
    .select(`
      name,
      fines (amount)
    `);
  
  if (error) throw error;
  return data.map(player => ({
    name: player.name,
    total: player.fines.reduce((sum, fine) => sum + fine.amount, 0)
  }));
}

async function getTotalFines() {
  const { data, error } = await supabase
    .from('fines')
    .select('amount');
  
  if (error) throw error;
  return data.reduce((sum, fine) => sum + fine.amount, 0);
}

module.exports = {
  supabase,
  getPlayers,
  getReasons,
  getFines,
  addFine,
  deleteFine,
  getPlayerHistory,
  getPlayerTotals,
  getTotalFines
}; 