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

    try {
        console.log(`[DB_CHECK] Validating category: ${category}`);
        if (!['food', 'cab', 'ecommerce', 'guest'].includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        let passCode = generatePassCode();
        console.log(`[DB_ACTION] Generating new pass: ${passCode}`);
        
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

        if (insertResult.rowCount > 0) {
            console.log(`✅ [DB_SUCCESS] Pass ${passCode} successfully saved to database.`);
        } else {
            console.error(`❌ [DB_FAILURE] Insert query returned 0 rows for ${passCode}!`);
        }

        const pass = { ...insertResult.rows[0], resident_name: req.user.name };

        // Create a rich JSON schema for the QR Code to allow instant scanning
        const qrPayload = {
            id: passCode,
            visitor_name: pass.visitor_name,
            visitor_mobile: pass.visitor_mobile,
            service_name: pass.service_name,
            category: pass.category,
            expiry_at: pass.expiry_at,
            resident_name: pass.resident_name,
            resident_mobile: pass.resident_mobile,
            house_number: pass.house_number,
            society_name: pass.society_name,
            status: pass.status
        };

        res.json({
            ...pass,
            qrPayload
        });
    } catch (err) {
        console.error('Create Pass Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getResidentPasses(req, res) {
    const { mobile: rawMobile } = req.params;
    const mobile = normalizeMobile(rawMobile);

    if (!mobile) {
        return res.status(400).json({ error: 'Valid mobile number required' });
    }

    try {
        const result = await db.query(
            'SELECT * FROM passes WHERE resident_mobile = $1 ORDER BY created_at DESC',
            [mobile]
        );
        res.json({ passes: result.rows });
    } catch (err) {
        console.error('Get Resident Passes Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getVisitorPasses(req, res) {
    const { mobile: rawMobile } = req.params;
    const mobile = normalizeMobile(rawMobile);

    if (!mobile) {
        return res.status(400).json({ error: 'Valid mobile number required' });
    }

    try {
        const result = await db.query(
            `SELECT p.*, u.name AS resident_name
       FROM passes p
       LEFT JOIN users u ON u.mobile = p.resident_mobile
       WHERE p.visitor_mobile = $1
       ORDER BY p.created_at DESC`,
            [mobile]
        );

        res.json({ passes: result.rows });
    } catch (err) {
        console.error('Get Passes Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function validatePass(req, res) {
    const { pass_code } = req.body;

    if (!pass_code) {
        return res.status(400).json({ error: 'Missing pass_code' });
    }

    try {
        const normalizedCode = String(pass_code).trim().toUpperCase();
        console.log(`[VALIDATION] Attempting to validate pass: "${normalizedCode}"`);

        // Defensive Query: Use TRIM and UPPER on stored data, and LEFT JOIN to handle potential data inconsistency
        const result = await db.query(
            `SELECT p.*, u.name AS resident_name
       FROM passes p
       LEFT JOIN users u ON u.mobile = p.resident_mobile
       WHERE TRIM(UPPER(p.pass_code)) = $1`,
            [normalizedCode]
        );
        const pass = result.rows[0];

        if (!pass) {
            console.warn(`[VALIDATION_FAILURE] Pass not found in DB: "${normalizedCode}"`);
            // Check if it exists at all without the join (for diagnostics)
            const rawCheck = await db.query('SELECT id FROM passes WHERE TRIM(UPPER(pass_code)) = $1', [normalizedCode]);
            if (rawCheck.rows.length > 0) {
                console.error(`[VALIDATION_FAILURE] Pass "${normalizedCode}" exists but resident join failed!`);
            }
            return res.status(404).json({ valid: false, error: 'PASS NOT FOUND' });
        }

        if (pass.status === 'approved') {
            return res.status(400).json({ valid: false, error: 'PASS ALREADY USED' });
        }

        if (pass.expiry_at && new Date() > new Date(pass.expiry_at)) {
            return res.status(403).json({ valid: false, error: 'PASS EXPIRED' });
        }

        res.json({ valid: true, pass });
    } catch (err) {
        console.error('Validation Error:', err);
        res.status(500).json({ valid: false, error: 'Internal server error' });
    }
}

async function approvePass(req, res) {
    const { pass_code } = req.body;

    if (!pass_code) {
        return res.status(400).json({ error: 'Missing pass_code' });
    }

    try {
        const normalizedCode = String(pass_code).trim().toUpperCase();
        const result = await db.query(
            `SELECT p.*, u.name AS resident_name
       FROM passes p
       LEFT JOIN users u ON u.mobile = p.resident_mobile
       WHERE TRIM(UPPER(p.pass_code)) = $1`,
            [normalizedCode]
        );
        const pass = result.rows[0];

        if (!pass) {
            return res.status(404).json({ error: 'Pass not found' });
        }

        if (pass.status === 'approved') {
            return res.status(400).json({ error: 'Pass already approved' });
        }

        // Use transaction for atomic approval and logging
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            
            const updateResult = await client.query(
                'UPDATE passes SET status = $1 WHERE id = $2 RETURNING *',
                ['approved', pass.id]
            );

            const logResult = await client.query(
                `INSERT INTO guard_logs (pass_id, guard_mobile, visitor_name, visitor_mobile, resident_name, service_name, house_number, society_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                [
                    pass.id, req.user.mobile, pass.visitor_name, pass.visitor_mobile,
                    pass.resident_name, pass.service_name, pass.house_number, pass.society_name
                ]
            );

            await client.query('COMMIT');
            res.json({ success: true, pass: updateResult.rows[0], logId: logResult.rows[0].id });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Approval Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function denyPass(req, res) {
    const { pass_code } = req.body;

    if (!pass_code) {
        return res.status(400).json({ error: 'Missing pass_code' });
    }

    try {
        const normalizedCode = String(pass_code).trim().toUpperCase();
        const result = await db.query('SELECT id, status FROM passes WHERE TRIM(UPPER(pass_code)) = $1', [normalizedCode]);
        const pass = result.rows[0];

        if (!pass) {
            return res.status(404).json({ error: 'Pass not found' });
        }

        if (pass.status === 'approved') {
            return res.status(400).json({ error: 'Cannot deny an already approved pass' });
        }

        await db.query('DELETE FROM passes WHERE id = $1', [pass.id]);
        res.json({ success: true, message: 'Pass denied and removed' });
    } catch (err) {
        console.error('Denial Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    createPass,
    getResidentPasses,
    getVisitorPasses,
    validatePass,
    approvePass,
    denyPass
};
