const repository = require('../database/repository');
const { normalizeMobile } = require('../utils/utils');

function generatePassCode() {
    const num = Math.floor(100000 + Math.random() * 900000);
    return `PASS_${num}`;
}

function normalizePassCode(value) {
    const normalized = String(value || '').replace(/[^a-zA-Z0-9_]/g, '').trim().toUpperCase();
    if (!normalized) return '';
    return normalized.startsWith('PASS_') ? normalized : `PASS_${normalized}`;
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
            const exists = await repository.passCodeExists(passCode);
            if (exists) {
                passCode = generatePassCode();
            } else {
                codeExists = false;
            }
        }

        let expiryAt = null;
        if (expected_time) {
            const bufferMinutes = Math.floor(expected_time * 1.2);
            expiryAt = new Date(Date.now() + bufferMinutes * 60 * 1000);
        }

        const pass = await repository.createPass({
            pass_code: passCode,
            resident_mobile: req.user.mobile,
            visitor_mobile,
            visitor_name,
            service_name,
            house_number: req.user.house_number,
            society_name: req.user.society_name,
            category,
            expected_time,
            expiry_at: expiryAt
        });

        if (pass?.id) {
            console.log(`✅ [DB_SUCCESS] Pass ${passCode} successfully saved to database.`);
        } else {
            console.error(`❌ [DB_FAILURE] Create operation returned no pass for ${passCode}!`);
        }
        
        const enrichedPass = { ...pass, resident_name: req.user.name };

        // Create a rich JSON schema for the QR Code to allow instant scanning
        const qrPayload = {
            id: passCode,
            visitor_name: enrichedPass.visitor_name,
            visitor_mobile: enrichedPass.visitor_mobile,
            service_name: enrichedPass.service_name,
            category: enrichedPass.category,
            expiry_at: enrichedPass.expiry_at,
            resident_name: enrichedPass.resident_name,
            resident_mobile: enrichedPass.resident_mobile,
            house_number: enrichedPass.house_number,
            society_name: enrichedPass.society_name,
            status: enrichedPass.status
        };

        res.json({
            ...enrichedPass,
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

    if (mobile !== req.user.mobile) {
        return res.status(403).json({ error: 'Cannot view other resident passes' });
    }

    try {
        const passes = await repository.getResidentPasses(mobile);
        res.json({ passes });
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

    if (mobile !== req.user.mobile) {
        return res.status(403).json({ error: 'Cannot view other visitor passes' });
    }

    try {
        const passes = await repository.getVisitorPasses(mobile);
        res.json({ passes });
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
        const normalizedCode = normalizePassCode(pass_code);
        console.log(`[VALIDATION] Original: "${pass_code}" | Sanitized: "${normalizedCode}" | Length: ${normalizedCode.length}`);

        const pass = await repository.getPassByCode(normalizedCode);

        if (!pass) {
            console.warn(`[VALIDATION_FAILURE] Pass not found: "${normalizedCode}"`);
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
        const normalizedCode = normalizePassCode(pass_code);
        const pass = await repository.getPassByCode(normalizedCode);

        if (!pass) {
            return res.status(404).json({ error: 'Pass not found' });
        }

        if (pass.status === 'approved') {
            return res.status(400).json({ error: 'Pass already approved' });
        }

        const approval = await repository.approvePass(normalizedCode, req.user.mobile);
        if (!approval) {
            return res.status(404).json({ error: 'Pass not found' });
        }

        res.json({ success: true, pass: approval.pass, logId: approval.logId });
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
        const normalizedCode = normalizePassCode(pass_code);
        const pass = await repository.getPassByCode(normalizedCode);

        if (!pass) {
            return res.status(404).json({ error: 'Pass not found' });
        }

        if (pass.status === 'approved') {
            return res.status(400).json({ error: 'Cannot deny an already approved pass' });
        }

        await repository.denyPass(normalizedCode, req.user.mobile);
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
