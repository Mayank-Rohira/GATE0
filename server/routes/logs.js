const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { getGuardLogs } = require('../controllers/logController');

const router = express.Router();

router.get('/logs/:guard_id', authenticateToken, authorizeRole('guard'), getGuardLogs);

module.exports = router;
