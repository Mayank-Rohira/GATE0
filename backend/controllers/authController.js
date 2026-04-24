const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const repository = require('../database/repository');
const { normalizeMobile } = require('../utils/utils');

const SALT_ROUNDS = 10;

async function signup(req, res) {
    const { name, mobile: rawMobile, password, role, house_number, society_name } = req.body;
    const mobile = normalizeMobile(rawMobile);

    if (!name || !mobile || !password || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['resident', 'visitor', 'guard'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    if (role === 'resident' && (!house_number || !society_name)) {
        return res.status(400).json({ error: 'House number and society name required for residents' });
    }

    try {
        const existingUser = await repository.findUserByMobile(mobile);
        if (existingUser) {
            return res.status(409).json({ error: 'Mobile number already registered' });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await repository.createUser({
            name,
            mobile,
            password_hash: passwordHash,
            role,
            house_number: house_number || '',
            society_name: society_name || ''
        });

        res.status(201).json({
            message: 'Account created successfully',
            user: { id: user.id, name, mobile, role }
        });
    } catch (err) {
        console.error('--- CRITICAL SIGNUP FAILURE ---');
        console.error('Error details:', err);
        console.error('Table info:', err.table || 'N/A');
        console.error('Constraint:', err.constraint || 'N/A');
        console.error('--------------------------------');
        res.status(500).json({ 
            error: 'Failed to create account. This is likely a database connection or schema issue.',
            details: err.message
        });
    }
}

async function login(req, res) {
    const { mobile: rawMobile, password } = req.body;
    const mobile = normalizeMobile(rawMobile);

    if (!mobile || !password) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    try {
        const user = await repository.findUserByMobile(mobile);

        if (!user) {
            return res.status(401).json({ error: 'Invalid mobile or password' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid mobile or password' });
        }

        const payload = {
            name: user.name,
            mobile: user.mobile,
            role: user.role,
            house_number: user.house_number,
            society_name: user.society_name
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            user: {
                name: user.name,
                mobile: user.mobile,
                role: user.role,
                house_number: user.house_number,
                society_name: user.society_name
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
}

module.exports = { signup, login };
