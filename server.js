require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
    console.error('Connection string:', process.env.DATABASE_URL ? 'Present' : 'Missing');
    console.error('Environment:', process.env.NODE_ENV);
  } else {
    console.log('Database connected successfully');
  }
});

// Initialize database
async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');
    // Create players table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Players table created/verified');

    // Create reasons table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reasons (
        id SERIAL PRIMARY KEY,
        description VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Reasons table created/verified');

    // Create fines table with foreign keys
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fines (
        id SERIAL PRIMARY KEY,
        player_id INTEGER REFERENCES players(id),
        reason_id INTEGER REFERENCES reasons(id),
        amount DECIMAL(10,2) NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Fines table created/verified');

    // Create admin settings table for password
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id SERIAL PRIMARY KEY,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Admin settings table created/verified');

    // Insert default admin password if not exists
    const hashedPassword = await bcrypt.hash('Mandje123', 10);
    await pool.query(`
      INSERT INTO admin_settings (password_hash)
      SELECT $1
      WHERE NOT EXISTS (SELECT 1 FROM admin_settings);
    `, [hashedPassword]);
    console.log('Default admin password set');

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
}

initializeDatabase();

// Admin Authentication Middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    // Get stored password hash from database
    const result = await pool.query('SELECT password_hash FROM admin_settings LIMIT 1');
    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Admin password not set' });
    }

    const storedHash = result.rows[0].password_hash;
    const isValid = await bcrypt.compare(password, storedHash);
    
    if (isValid) {
      const token = jwt.sign(
        { role: 'admin' }, 
        process.env.JWT_SECRET || 'your-secret-key', 
        { expiresIn: '24h' }
      );
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Routes
app.get('/api/admin/players', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM players ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/players', authenticateAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query('INSERT INTO players (name) VALUES ($1) RETURNING *', [name]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/reasons', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reasons ORDER BY description');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/reasons', authenticateAdmin, async (req, res) => {
  try {
    const { description } = req.body;
    const result = await pool.query('INSERT INTO reasons (description) VALUES ($1) RETURNING *', [description]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/fines', authenticateAdmin, async (req, res) => {
  try {
    const { player_id, reason_id, amount } = req.body;
    const result = await pool.query(
      'INSERT INTO fines (player_id, reason_id, amount) VALUES ($1, $2, $3) RETURNING *',
      [player_id, reason_id, amount]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/fines', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, p.name as player_name, r.description as reason_description 
      FROM fines f 
      JOIN players p ON f.player_id = p.id 
      JOIN reasons r ON f.reason_id = r.id 
      ORDER BY f.date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/fines/:id', authenticateAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM fines WHERE id = $1', [req.params.id]);
    res.json({ message: 'Fine deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/reset', authenticateAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM fines');
    await pool.query('DELETE FROM reasons');
    await pool.query('DELETE FROM players WHERE name != \'Admin\'');
    res.json({ message: 'Database reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public Routes
app.get('/api/totaal-boetes', async (req, res) => {
  try {
    const result = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM fines');
    res.json({ total: parseFloat(result.rows[0].total) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/recent-boetes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, p.name as player_name, r.description as reason_description 
      FROM fines f 
      JOIN players p ON f.player_id = p.id 
      JOIN reasons r ON f.reason_id = r.id 
      ORDER BY f.date DESC 
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/player-totals', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.name, SUM(f.amount) as total 
      FROM players p 
      LEFT JOIN fines f ON p.id = f.player_id 
      GROUP BY p.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/player-history/:playerId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, r.description as reason_description 
      FROM fines f 
      JOIN reasons r ON f.reason_id = r.id 
      WHERE f.player_id = $1 
      ORDER BY f.date DESC
    `, [req.params.playerId]);
    res.json(result.rows);
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