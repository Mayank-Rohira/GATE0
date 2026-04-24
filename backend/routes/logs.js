const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { getGuardLogs, getResidentLogs } = require('../controllers/logController');

const router = express.Router();

router.get('/logs/:guard_id', authenticateToken, authorizeRole('guard'), getGuardLogs);
router.get('/logs/resident/:resident_mobile', authenticateToken, authorizeRole('resident'), getResidentLogs);

module.exports = router;
