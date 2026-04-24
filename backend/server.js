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

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`GATE0 server running on port ${PORT}`);
});
