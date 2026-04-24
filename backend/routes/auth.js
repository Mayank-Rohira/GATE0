const express = require('express');
const { signup, login, updateProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;
