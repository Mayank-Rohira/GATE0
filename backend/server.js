const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dns').setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const verifyDatabase = require('./database/verify_db');

const app = express();
app.use(cors());
app.use(express.json());

// Run automated diagnostics on startup
verifyDatabase();

const authRoutes = require('./routes/auth');
app.use(authRoutes);

const passRoutes = require('./routes/passes');
app.use(passRoutes);

const logRoutes = require('./routes/logs');
app.use(logRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/debug/db', async (req, res) => {
    const db = require('./database/db');
    try {
        const start = Date.now();
        const result = await db.query('SELECT current_database(), now()');
        const latency = Date.now() - start;
        res.json({ 
            status: 'connected', 
            database: result.rows[0].current_database,
            server_time: result.rows[0].now,
            latency_ms: latency,
            env_db_url_set: !!process.env.DATABASE_URL
        });
    } catch (err) {
        res.status(500).json({ 
            status: 'error', 
            message: err.message,
            env_db_url_set: !!process.env.DATABASE_URL,
            tip: 'If this is empty on Render, ensure you have set the DATABASE_URL environment variable.'
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`GATE0 server running on port ${PORT}`);
});
