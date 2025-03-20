require('dotenv').config();

// Verify environment variables are loaded
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const { 
  supabase,
  supabaseAdmin,
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
  getTotalFines,
  getPublicPlayers,
  getPublicFines
} = require('./lib/supabase');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Temporarily disable admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  // Bypass authentication temporarily
  next();
};

// Admin Routes
app.get('/api/admin/players', authenticateAdmin, async (req, res) => {
  try {
    console.log('Fetching players...');
    const players = await getPlayers();
    console.log(`Successfully fetched ${players.length} players`);
    res.json(players);
  } catch (error) {
    console.error('Error getting players:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: error.message,
      details: error.details || 'No additional details available'
    });
  }
});

app.post('/api/admin/players', authenticateAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    console.log('Adding player:', { name });
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const player = await addPlayer(name);
    console.log('Successfully added player:', player);
    res.json(player);
  } catch (error) {
    console.error('Error adding player:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ 
      error: error.message,
      details: error.details || 'No additional details available'
    });
  }
});

app.post('/api/admin/fines', authenticateAdmin, async (req, res) => {
  try {
    const { player_id, reason_id, amount } = req.body;
    if (!player_id || !reason_id || !amount) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const fine = await addFine({ player_id, reason_id, amount });
    res.json(fine);
  } catch (error) {
    console.error('Error adding fine:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/fines', authenticateAdmin, async (req, res) => {
  try {
    const fines = await getFines();
    res.json(fines);
  } catch (error) {
    console.error('Error getting fines:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/fines/:id', authenticateAdmin, async (req, res) => {
  try {
    await deleteFine(req.params.id);
    res.json({ message: 'Fine deleted successfully' });
  } catch (error) {
    console.error('Error deleting fine:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/reasons', authenticateAdmin, async (req, res) => {
  try {
    const reasons = await getReasons();
    res.json(reasons);
  } catch (error) {
    console.error('Error getting reasons:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/reasons', authenticateAdmin, async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    const reason = await addReason(description);
    res.json(reason);
  } catch (error) {
    console.error('Error adding reason:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/players/:id', authenticateAdmin, async (req, res) => {
  try {
    await deletePlayer(req.params.id);
    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/reasons/:id', authenticateAdmin, async (req, res) => {
  try {
    await deleteReason(req.params.id);
    res.json({ message: 'Reason deleted successfully' });
  } catch (error) {
    console.error('Error deleting reason:', error);
    res.status(500).json({ error: error.message });
  }
});

// Public Routes
app.get('/api/totaal-boetes', async (req, res) => {
  try {
    console.log('Fetching total fines...');
    const total = await getTotalFines();
    console.log('Total fines:', total);
    res.json({ 
      total,
      formatted: `€${total.toFixed(2)}`
    });
  } catch (error) {
    console.error('Error getting total fines:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to get total fines',
      details: error.message 
    });
  }
});

app.get('/api/recent-boetes', async (req, res) => {
  try {
    console.log('Fetching recent fines...');
    const fines = await getPublicFines();
    console.log(`Found ${fines.length} recent fines`);
    res.json(fines.slice(0, 10));
  } catch (error) {
    console.error('Error getting recent fines:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to get recent fines',
      details: error.message 
    });
  }
});

app.get('/api/player-totals', async (req, res) => {
  try {
    console.log('Fetching player totals...');
    const totals = await getPlayerTotals();
    console.log(`Found totals for ${totals.length} players`);
    res.json(totals.map(player => ({
      ...player,
      formatted: `€${player.total.toFixed(2)}`
    })));
  } catch (error) {
    console.error('Error getting player totals:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to get player totals',
      details: error.message 
    });
  }
});

app.get('/api/player-history/:playerId', async (req, res) => {
  try {
    const history = await getPlayerHistory(req.params.playerId);
    res.json(history.map(fine => ({
      ...fine,
      formatted: `€${fine.amount.toFixed(2)}`
    })));
  } catch (error) {
    console.error('Error getting player history:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/players', async (req, res) => {
  try {
    const players = await getPublicPlayers();
    res.json(players);
  } catch (error) {
    console.error('Error getting players:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { password } = req.body;
    const { data: settings, error } = await supabaseAdmin
      .from('admin_settings')
      .select('password_hash')
      .single();

    if (error) {
      console.error('Error fetching admin settings:', error);
      throw error;
    }

    if (!settings) {
      console.error('No admin settings found');
      return res.status(500).json({ error: 'Admin settings not configured' });
    }

    const validPassword = await bcrypt.compare(password, settings.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message,
    path: req.path
  });
});

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.method === 'POST' ? req.body : undefined
  });
  next();
});

// Catch-all route to serve index.html
app.get('*', (req, res) => {
  console.log('Request received:', {
    path: req.path,
    method: req.method,
    headers: req.headers
  });
  
  // If it's an API route, return 404
  if (req.path.startsWith('/api/')) {
    console.log('API route not found:', req.path);
    return res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.path
    });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', {
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 10)}...` : 'Missing',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? 'Present' : 'Missing',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing',
    jwtSecret: process.env.JWT_SECRET ? 'Present' : 'Missing',
    port: PORT
  });
}); 