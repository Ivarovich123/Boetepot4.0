require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { supabase } = require('./lib/supabase');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin Routes
app.get('/api/admin/players', authenticateAdmin, async (req, res) => {
  try {
    const players = await getPlayers();
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/players', authenticateAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const { data, error } = await supabase
      .from('players')
      .insert([{ name }])
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/fines', authenticateAdmin, async (req, res) => {
  try {
    const { player_id, reason_id, amount } = req.body;
    const fine = await addFine({ player_id, reason_id, amount });
    res.json(fine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/fines', authenticateAdmin, async (req, res) => {
  try {
    const fines = await getFines();
    res.json(fines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/fines/:id', authenticateAdmin, async (req, res) => {
  try {
    await deleteFine(req.params.id);
    res.json({ message: 'Fine deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public Routes
app.get('/api/totaal-boetes', async (req, res) => {
  try {
    const total = await getTotalFines();
    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/recent-boetes', async (req, res) => {
  try {
    const fines = await getFines();
    res.json(fines.slice(0, 10));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/player-totals', async (req, res) => {
  try {
    const totals = await getPlayerTotals();
    res.json(totals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/player-history/:playerId', async (req, res) => {
  try {
    const history = await getPlayerHistory(req.params.playerId);
    res.json(history);
  } catch (error) {
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
    res.status(500).json({ error: error.message });
  }
});

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 