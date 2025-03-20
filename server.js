require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const { 
  getPlayers, 
  addPlayer,
  getReasons, 
  getFines, 
  addFine, 
  deleteFine, 
  getPlayerHistory, 
  getPlayerTotals, 
  getTotalFines 
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
    const players = await getPlayers();
    res.json(players);
  } catch (error) {
    console.error('Error getting players:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/players', authenticateAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const player = await addPlayer(name);
    res.json(player);
  } catch (error) {
    console.error('Error adding player:', error);
    res.status(500).json({ error: error.message });
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

// Public Routes
app.get('/api/totaal-boetes', async (req, res) => {
  try {
    const total = await getTotalFines();
    res.json({ total });
  } catch (error) {
    console.error('Error getting total fines:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/recent-boetes', async (req, res) => {
  try {
    const fines = await getFines();
    res.json(fines.slice(0, 10));
  } catch (error) {
    console.error('Error getting recent fines:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/player-totals', async (req, res) => {
  try {
    const totals = await getPlayerTotals();
    res.json(totals);
  } catch (error) {
    console.error('Error getting player totals:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/player-history/:playerId', async (req, res) => {
  try {
    const history = await getPlayerHistory(req.params.playerId);
    res.json(history);
  } catch (error) {
    console.error('Error getting player history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { password } = req.body;
    const { data: settings, error } = await supabase
      .from('admin_settings')
      .select('password_hash')
      .single();

    if (error) throw error;

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

// Catch-all route to serve index.html
app.get('*', (req, res) => {
  // If it's an API route, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', {
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: process.env.SUPABASE_URL ? 'Present' : 'Missing',
    supabaseKey: process.env.SUPABASE_ANON_KEY ? 'Present' : 'Missing',
    jwtSecret: process.env.JWT_SECRET ? 'Present' : 'Missing'
  });
}); 