const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
    createPass, getResidentPasses, getVisitorPasses,
    validatePass, approvePass, denyPass
} = require('../controllers/passController');

const router = express.Router();

router.post('/passes/create', authenticateToken, authorizeRole('resident'), createPass);
router.get('/passes/resident/:resident_id', authenticateToken, authorizeRole('resident'), getResidentPasses);
router.get('/passes/visitor/:mobile', authenticateToken, authorizeRole('visitor'), getVisitorPasses);
router.post('/passes/validate', authenticateToken, authorizeRole('guard'), validatePass);
router.post('/passes/approve', authenticateToken, authorizeRole('guard'), approvePass);
router.post('/passes/deny', authenticateToken, authorizeRole('guard'), denyPass);

module.exports = router;
