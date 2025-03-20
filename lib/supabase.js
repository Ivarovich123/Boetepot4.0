import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for database operations
export async function getPlayers() {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

export async function getReasons() {
  const { data, error } = await supabase
    .from('reasons')
    .select('*')
    .order('description')
  
  if (error) throw error
  return data
}

export async function getFines() {
  const { data, error } = await supabase
    .from('fines')
    .select(`
      *,
      players (name),
      reasons (description)
    `)
    .order('date', { ascending: false })
  
  if (error) throw error
  return data
}

export async function addFine(fine) {
  const { data, error } = await supabase
    .from('fines')
    .insert([fine])
    .select()
  
  if (error) throw error
  return data[0]
}

export async function deleteFine(id) {
  const { error } = await supabase
    .from('fines')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

export async function getPlayerHistory(playerId) {
  const { data, error } = await supabase
    .from('fines')
    .select(`
      *,
      reasons (description)
    `)
    .eq('player_id', playerId)
    .order('date', { ascending: false })
  
  if (error) throw error
  return data
}

export async function getPlayerTotals() {
  const { data, error } = await supabase
    .from('players')
    .select(`
      name,
      fines (amount)
    `)
  
  if (error) throw error
  return data.map(player => ({
    name: player.name,
    total: player.fines.reduce((sum, fine) => sum + fine.amount, 0)
  }))
}

export async function getTotalFines() {
  const { data, error } = await supabase
    .from('fines')
    .select('amount')
  
  if (error) throw error
  return data.reduce((sum, fine) => sum + fine.amount, 0)
} 