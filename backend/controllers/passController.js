const db = require('../database/db');
const { normalizeMobile } = require('../utils/utils');

function generatePassCode() {
    const num = Math.floor(100000 + Math.random() * 900000);
    return `PASS_${num}`;
}

async function createPass(req, res) {
    const { service_name, visitor_name, visitor_mobile: rawMobile, category = 'guest', expected_time = null } = req.body;
    const visitor_mobile = normalizeMobile(rawMobile);

    if (!service_name || !visitor_name || !visitor_mobile) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['food', 'cab', 'ecommerce', 'guest'].includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
    }

    try {
        let passCode = generatePassCode();
        let codeExists = true;
        while (codeExists) {
            const result = await db.query('SELECT id FROM passes WHERE pass_code = $1', [passCode]);
            if (result.rows.length === 0) {
                codeExists = false;
            } else {
                passCode = generatePassCode();
            }
        }

        let expiryAt = null;
        if (expected_time) {
            const bufferMinutes = Math.floor(expected_time * 1.2);
            expiryAt = new Date(Date.now() + bufferMinutes * 60 * 1000);
        }

        const insertResult = await db.query(
            `INSERT INTO passes (pass_code, resident_mobile, visitor_mobile, visitor_name, service_name, house_number, society_name, category, expected_time, expiry_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                passCode, req.user.mobile, visitor_mobile, visitor_name,
                service_name, req.user.house_number, req.user.society_name,
                category, expected_time, expiryAt
            ]
        );

        const pass = insertResult.rows[0];

        // Create a rich JSON schema for the QR Code to allow instant scanning
        const qrPayload = {
            id: passCode,
            visitor_name: pass.visitor_name,
            visitor_mobile: pass.visitor_mobile,
            service_name: pass.service_name,
            category: pass.category,
            expiry_at: pass.expiry_at,
            resident_name: req.user.name,
            resident_mobile: req.user.mobile,
            house_number: pass.house_number,
            society_name: pass.society_name,
        };

        res.status(201).json({ pass_code: passCode, qr_content: JSON.stringify(qrPayload), pass });
    } catch (err) {
        console.error('Create pass error:', err);
        res.status(500).json({ error: 'Failed to create pass' });
    }
}

async function getResidentPasses(req, res) {
    const { mobile } = req.params;

    if (mobile !== req.user.mobile) {
        return res.status(403).json({ error: 'Cannot view other resident passes' });
    }

    try {
        const result = await db.query(
            'SELECT * FROM passes WHERE resident_mobile = $1 ORDER BY created_at DESC',
            [mobile]
        );
        res.json({ passes: result.rows });
    } catch (err) {
        console.error('Get resident passes error:', err);
        res.status(500).json({ error: 'Failed to fetch passes' });
    }
}

async function getVisitorPasses(req, res) {
    const { mobile: rawMobile } = req.params;
    const mobile = normalizeMobile(rawMobile);

    if (mobile !== normalizeMobile(req.user.mobile)) {
        return res.status(403).json({ error: 'Cannot view other visitor passes' });
    }

    try {
        const result = await db.query(
            `SELECT p.*, u.name AS resident_name
       FROM passes p
       JOIN users u ON u.mobile = p.resident_mobile
       WHERE p.visitor_mobile = $1
       ORDER BY p.created_at DESC`,
            [mobile]
        );
        res.json({ passes: result.rows });
    } catch (err) {
        console.error('Get visitor passes error:', err);
        res.status(500).json({ error: 'Failed to fetch passes' });
    }
}

async function validatePass(req, res) {
    const { pass_code } = req.body;

    if (!pass_code) {
        return res.status(400).json({ error: 'Missing pass_code' });
    }

    try {
        const result = await db.query(
            `SELECT p.*, u.name AS resident_name
       FROM passes p
       JOIN users u ON u.mobile = p.resident_mobile
       WHERE p.pass_code = $1`,
            [pass_code]
        );
        const pass = result.rows[0];

        if (!pass) {
            return res.status(404).json({ valid: false, error: 'Pass not found' });
        }

        if (pass.status === 'approved') {
            return res.status(410).json({ valid: false, error: 'Pass already used' });
        }

        if (pass.expiry_at && new Date() > new Date(pass.expiry_at)) {
            return res.status(403).json({ valid: false, error: 'Pass expired' });
        }

        res.json({ valid: true, pass });
    } catch (err) {
        console.error('Validate pass error:', err);
        res.status(500).json({ error: 'Failed to validate pass' });
    }
}

async function approvePass(req, res) {
    const { pass_code } = req.body;

    if (!pass_code) {
        return res.status(400).json({ error: 'Missing pass_code' });
    }

    try {
        const result = await db.query(
            `SELECT p.*, u.name AS resident_name
       FROM passes p
       JOIN users u ON u.mobile = p.resident_mobile
       WHERE p.pass_code = $1`,
            [pass_code]
        );
        const pass = result.rows[0];

        if (!pass) {
            return res.status(404).json({ error: 'Pass not found' });
        }

        if (pass.status === 'approved') {
            return res.status(409).json({ error: 'Pass already approved' });
        }

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            await client.query('UPDATE passes SET status = $1 WHERE id = $2', ['approved', pass.id]);

            const logResult = await client.query(
                `INSERT INTO guard_logs (pass_id, guard_mobile, visitor_name, visitor_mobile, resident_name, house_number, society_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [
                    pass.id, req.user.mobile, pass.visitor_name, pass.visitor_mobile,
                    pass.resident_name, pass.house_number, pass.society_name
                ]
            );

            await client.query('COMMIT');

            res.json({
                message: 'Entry approved',
                log_id: logResult.rows[0].id,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Approve pass error:', err);
        res.status(500).json({ error: 'Failed to approve pass and generate log' });
    }
}

async function denyPass(req, res) {
    const { pass_code } = req.body;

    if (!pass_code) {
        return res.status(400).json({ error: 'Missing pass_code' });
    }

    try {
        const result = await db.query('SELECT id, status FROM passes WHERE pass_code = $1', [pass_code]);
        const pass = result.rows[0];

        if (!pass) {
            return res.status(404).json({ error: 'Pass not found' });
        }

        if (pass.status === 'approved') {
            return res.status(409).json({ error: 'Cannot deny an already approved pass' });
        }

        await db.query('DELETE FROM passes WHERE id = $1', [pass.id]);

        res.json({ message: 'Pass denied and deleted successfully' });
    } catch (err) {
        console.error('Deny pass error:', err);
        res.status(500).json({ error: 'Failed to deny pass' });
    }
}

module.exports = { createPass, getResidentPasses, getVisitorPasses, validatePass, approvePass, denyPass };
