require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fines (
        id SERIAL PRIMARY KEY,
        speler VARCHAR(255) NOT NULL,
        datum TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        bedrag DECIMAL(10,2) NOT NULL,
        reden TEXT NOT NULL
      );
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

initializeDatabase();

// Routes
app.get('/api/totaal-boetes', async (req, res) => {
  try {
    const result = await pool.query('SELECT COALESCE(SUM(bedrag), 0) as total FROM fines');
    res.json({ total: parseFloat(result.rows[0].total) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/recent-boetes', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT speler, datum, bedrag, reden FROM fines ORDER BY datum DESC LIMIT 10'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/player-totals', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT speler, SUM(bedrag) as totaal FROM fines GROUP BY speler'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/player-history/:speler', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT datum, bedrag, reden FROM fines WHERE speler = $1 ORDER BY datum DESC',
      [req.params.speler]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/all-fines', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, speler, datum, bedrag, reden FROM fines ORDER BY datum DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/add-fine', async (req, res) => {
  try {
    const { speler, reden, bedrag } = req.body;
    await pool.query(
      'INSERT INTO fines (speler, reden, bedrag) VALUES ($1, $2, $3)',
      [speler, reden, parseFloat(bedrag)]
    );
    res.json({ message: 'Boete succesvol toegevoegd!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/delete-fine/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM fines WHERE id = $1', [req.params.id]);
    res.json({ message: 'Boete succesvol verwijderd!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dropdown-options', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT speler FROM fines ORDER BY speler');
    res.json({ spelers: result.rows.map(row => row.speler) });
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