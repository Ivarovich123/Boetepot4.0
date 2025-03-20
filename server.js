require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { 
  getPlayerTotals, 
  getTotalFines,
  getPublicFines
} = require('./lib/supabase');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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