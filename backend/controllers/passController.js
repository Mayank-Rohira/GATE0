const db = require('../database/db');
const { normalizeMobile } = require('../utils/utils');

function generatePassCode() {
    const num = Math.floor(100000 + Math.random() * 900000);
    return `PASS_${num}`;
}

function createPass(req, res) {
    const { service_name, visitor_name, visitor_mobile: rawMobile } = req.body;
    const visitor_mobile = normalizeMobile(rawMobile);

    if (!service_name || !visitor_name || !visitor_mobile) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    let passCode = generatePassCode();
    while (db.prepare('SELECT id FROM passes WHERE pass_code = ?').get(passCode)) {
        passCode = generatePassCode();
    }

    const result = db.prepare(
        `INSERT INTO passes (pass_code, resident_mobile, visitor_mobile, visitor_name, service_name, house_number, society_name)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
        passCode, req.user.mobile, visitor_mobile, visitor_name,
        service_name, req.user.house_number, req.user.society_name
    );

    const pass = db.prepare('SELECT * FROM passes WHERE id = ?').get(result.lastInsertRowid);

    // Create a rich JSON schema for the QR Code to allow instant scanning
    const qrPayload = {
        id: passCode,
        visitor_name: pass.visitor_name,
        visitor_mobile: pass.visitor_mobile,
        service_name: pass.service_name,
        resident_name: req.user.name,
        resident_mobile: req.user.mobile,
        house_number: pass.house_number,
        society_name: pass.society_name,
    };

    res.status(201).json({ pass_code: passCode, qr_content: JSON.stringify(qrPayload), pass });
}

function getResidentPasses(req, res) {
    const { mobile } = req.params;

    if (mobile !== req.user.mobile) {
        return res.status(403).json({ error: 'Cannot view other resident passes' });
    }

    const passes = db.prepare(
        'SELECT * FROM passes WHERE resident_mobile = ? ORDER BY created_at DESC'
    ).all(mobile);

    res.json({ passes });
}

function getVisitorPasses(req, res) {
    const { mobile: rawMobile } = req.params;
    const mobile = normalizeMobile(rawMobile);

    if (mobile !== normalizeMobile(req.user.mobile)) {
        return res.status(403).json({ error: 'Cannot view other visitor passes' });
    }

    // PURE MOBILE LINKING: If it's your number, it's your pass.
    const passes = db.prepare(
        `SELECT p.*, u.name AS resident_name
     FROM passes p
     JOIN users u ON u.mobile = p.resident_mobile
     WHERE p.visitor_mobile = ?
     ORDER BY p.created_at DESC`
    ).all(mobile);

    res.json({ passes });
}

function validatePass(req, res) {
    const { pass_code } = req.body;

    if (!pass_code) {
        return res.status(400).json({ error: 'Missing pass_code' });
    }

    const pass = db.prepare(
        `SELECT p.*, u.name AS resident_name
     FROM passes p
     JOIN users u ON u.mobile = p.resident_mobile
     WHERE p.pass_code = ?`
    ).get(pass_code);

    if (!pass) {
        return res.status(404).json({ valid: false, error: 'Pass not found' });
    }

    if (pass.status === 'approved') {
        return res.status(410).json({ valid: false, error: 'Pass already used' });
    }

    res.json({ valid: true, pass });
}

function approvePass(req, res) {
    const { pass_code } = req.body;

    if (!pass_code) {
        return res.status(400).json({ error: 'Missing pass_code' });
    }

    const pass = db.prepare(
        `SELECT p.*, u.name AS resident_name
     FROM passes p
     JOIN users u ON u.mobile = p.resident_mobile
     WHERE p.pass_code = ?`
    ).get(pass_code);

    if (!pass) {
        return res.status(404).json({ error: 'Pass not found' });
    }

    if (pass.status === 'approved') {
        return res.status(409).json({ error: 'Pass already approved' });
    }

    const approveAndLog = db.transaction((passData, guardMobile) => {
        db.prepare('UPDATE passes SET status = ? WHERE id = ?').run('approved', passData.id);

        return db.prepare(
            `INSERT INTO guard_logs (pass_id, guard_mobile, visitor_name, visitor_mobile, resident_name, house_number, society_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
            passData.id, guardMobile, passData.visitor_name, passData.visitor_mobile,
            passData.resident_name, passData.house_number, passData.society_name
        );
    });

    try {
        const logResult = approveAndLog(pass, req.user.mobile);

        res.json({
            message: 'Entry approved',
            log_id: logResult.lastInsertRowid,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Transaction failed:', err);
        res.status(500).json({ error: 'Failed to approve pass and generate log' });
    }
}

function denyPass(req, res) {
    const { pass_code } = req.body;

    if (!pass_code) {
        return res.status(400).json({ error: 'Missing pass_code' });
    }

    // Because it's a hard delete, we check if it exists or was already approved
    const pass = db.prepare('SELECT id, status FROM passes WHERE pass_code = ?').get(pass_code);

    if (!pass) {
        return res.status(404).json({ error: 'Pass not found' });
    }

    if (pass.status === 'approved') {
        return res.status(409).json({ error: 'Cannot deny an already approved pass' });
    }

    db.prepare('DELETE FROM passes WHERE id = ?').run(pass.id);

    res.json({ message: 'Pass denied and deleted successfully' });
}

module.exports = { createPass, getResidentPasses, getVisitorPasses, validatePass, approvePass, denyPass };
