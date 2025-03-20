require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { 
  getPlayers,
  addPlayer,
  getReasons,
  addReason,
  addFine,
  getPlayerTotals, 
  getTotalFines,
  getPublicFines
} = require('./lib/supabase');
const { supabase } = require('./lib/supabase');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Player Management
app.get('/api/players', async (req, res) => {
  try {
    console.log('[API] Getting players...');
    const players = await getPlayers();
    console.log(`[API] Successfully fetched ${players.length} players`);
    res.json(players);
  } catch (error) {
    console.error('[API] Error getting players:', error);
    res.status(500).json({ error: 'Failed to get players', details: error.message });
  }
});

app.post('/api/players', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    console.log('[API] Adding player:', name);
    const player = await addPlayer(name);
    console.log('[API] Successfully added player:', player);
    res.json(player);
  } catch (error) {
    console.error('[API] Error adding player:', error);
    res.status(500).json({ error: 'Failed to add player', details: error.message });
  }
});

// Reason Management
app.get('/api/reasons', async (req, res) => {
  try {
    console.log('[API] Getting reasons...');
    const reasons = await getReasons();
    console.log(`[API] Successfully fetched ${reasons.length} reasons`);
    res.json(reasons);
  } catch (error) {
    console.error('[API] Error getting reasons:', error);
    res.status(500).json({ error: 'Failed to get reasons', details: error.message });
  }
});

app.post('/api/reasons', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    
    console.log('[API] Adding reason:', description);
    const reason = await addReason(description);
    console.log('[API] Successfully added reason:', reason);
    res.json(reason);
  } catch (error) {
    console.error('[API] Error adding reason:', error);
    res.status(500).json({ error: 'Failed to add reason', details: error.message });
  }
});

// Fine Management
app.post('/api/fines', async (req, res) => {
  try {
    const { player_id, reason_id, amount } = req.body;
    if (!player_id || !reason_id || !amount) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    console.log('[API] Adding fine:', req.body);
    const fine = await addFine({ player_id, reason_id, amount });
    console.log('[API] Successfully added fine:', fine);
    res.json(fine);
  } catch (error) {
    console.error('[API] Error adding fine:', error);
    res.status(500).json({ error: 'Failed to add fine', details: error.message });
  }
});

// Public API Routes
app.get('/api/totaal-boetes', async (req, res) => {
  try {
    console.log('[API] Getting total fines...');
    const total = await getTotalFines();
    console.log('[API] Total fines:', total);
    res.json({ total });
  } catch (error) {
    console.error('[API] Error getting total fines:', error);
    res.status(500).json({ error: 'Failed to get total fines', details: error.message });
  }
});

app.get('/api/recent-fines', async (req, res) => {
  try {
    console.log('[API] Getting recent fines...');
    const fines = await getPublicFines();
    console.log(`[API] Successfully fetched ${fines.length} recent fines`);
    res.json(fines);
  } catch (error) {
    console.error('[API] Error getting recent fines:', error);
    res.status(500).json({ error: 'Failed to get recent fines', details: error.message });
  }
});

app.get('/api/player-totals', async (req, res) => {
  try {
    console.log('[API] Getting player totals...');
    const totals = await getPlayerTotals();
    console.log(`[API] Successfully fetched ${totals.length} player totals`);
    res.json(totals);
  } catch (error) {
    console.error('[API] Error getting player totals:', error);
    res.status(500).json({ error: 'Failed to get player totals', details: error.message });
  }
});

app.get('/api/player-history/:id', async (req, res) => {
  try {
    console.log('[API] Getting player history for ID:', req.params.id);
    const { data, error } = await supabase
      .from('fines')
      .select(`
        id,
        amount,
        date,
        reasons:reason_id (description)
      `)
      .eq('player_id', req.params.id)
      .order('date', { ascending: false });
      
    if (error) throw error;
    
    console.log(`[API] Successfully fetched player history: ${data.length} entries`);
    res.json(data.map(fine => ({
      id: fine.id,
      amount: fine.amount,
      date: fine.date,
      reason_description: fine.reasons?.description
    })));
  } catch (error) {
    console.error('[API] Error getting player history:', error);
    res.status(500).json({ error: 'Failed to get player history', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    details: err.message 
  });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Environment:', {
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: process.env.SUPABASE_URL ? 'Present' : 'Missing',
    supabaseKey: process.env.SUPABASE_ANON_KEY ? 'Present' : 'Missing',
    port
  });
}); 