const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3000;
const API_BASE = `http://localhost:${PORT}`;

const log = [];

function parseJSON(res) {
    if (!res) return null;
    try {
        return JSON.parse(res);
    } catch {
        return res;
    }
}

async function fetchAPI(endpoint, method = 'GET', body = null, token = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        const status = response.status;
        let responseBody = await response.text();

        try { responseBody = JSON.parse(responseBody); } catch (e) { }

        return { status, body: responseBody };
    } catch (e) {
        return { status: 500, error: e.message };
    }
}

async function runTests() {
    log.push('# 🏢 GATE0 Backend End-to-End Test Report');
    log.push(`\n**Date:** ${new Date().toISOString()}\n`);
    log.push('## Phase 1: Authentication Endpoints\n');

    let residentToken, visitorToken, guardToken;

    // 1. Signup
    log.push('### 1. POST `/signup`');
    const signupRes = await fetchAPI('/signup', 'POST', {
        name: 'Test Resident', mobile: '1111111111', password: 'pass', role: 'resident', house_number: '101', society_name: 'Test Soc'
    });
    log.push(`\n- **Resident Signup:** [${signupRes.status}] ${signupRes.status === 201 ? 'Pass ✅' : 'Fail ❌'} (Expected 201)`);

    const signupVis = await fetchAPI('/signup', 'POST', {
        name: 'Test Visitor', mobile: '2222222222', password: 'pass', role: 'visitor'
    });
    log.push(`- **Visitor Signup:** [${signupVis.status}] ${signupVis.status === 201 ? 'Pass ✅' : 'Fail ❌'} (Expected 201)`);

    const signupGrd = await fetchAPI('/signup', 'POST', {
        name: 'Test Guard', mobile: '3333333333', password: 'pass', role: 'guard'
    });
    log.push(`- **Guard Signup:** [${signupGrd.status}] ${signupGrd.status === 201 ? 'Pass ✅' : 'Fail ❌'} (Expected 201)\n`);

    // 2. Login
    log.push('### 2. POST `/login`');
    const loginRes = await fetchAPI('/login', 'POST', { mobile: '1111111111', password: 'pass' });
    log.push(`\n- **Resident Login:** [${loginRes.status}] ${loginRes.status === 200 && loginRes.body.token ? 'Pass ✅' : 'Fail ❌'}`);
    residentToken = loginRes.body.token;

    const loginVis = await fetchAPI('/login', 'POST', { mobile: '2222222222', password: 'pass' });
    log.push(`- **Visitor Login:** [${loginVis.status}] ${loginVis.status === 200 && loginVis.body.token ? 'Pass ✅' : 'Fail ❌'}`);
    visitorToken = loginVis.body.token;

    const loginGrd = await fetchAPI('/login', 'POST', { mobile: '3333333333', password: 'pass' });
    log.push(`- **Guard Login:** [${loginGrd.status}] ${loginGrd.status === 200 && loginGrd.body.token ? 'Pass ✅' : 'Fail ❌'}\n`);
    guardToken = loginGrd.body.token;

    const residentUser = loginRes.body?.user;
    const visitorUser = loginVis.body?.user;
    const guardUser = loginGrd.body?.user;

    log.push('## Phase 2: Pass Management Endpoints\n');

    // 3. Create Pass
    log.push('### 3. POST `/passes/create`');
    let passCode = '';
    let passId = '';
    const createPass = await fetchAPI('/passes/create', 'POST', {
        service_name: 'Swiggy', visitor_name: 'Test Visitor', visitor_mobile: '2222222222'
    }, residentToken);

    if (createPass.status === 201) {
        passCode = createPass.body.pass_code;
        passId = createPass.body.pass.id;
        log.push(`\n- **Create Pass:** [201] Pass ✅ -> Generated Code: \`${passCode}\``);
    } else {
        log.push(`\n- **Create Pass:** [${createPass.status}] Fail ❌`);
    }

    // 4. Resident Fetch Passes
    log.push('\n### 4. GET `/passes/resident/:id`');
    if (residentUser) {
        const getResPass = await fetchAPI(`/passes/resident/${residentUser.id}`, 'GET', null, residentToken);
        const passFound = getResPass.body?.passes?.find(p => p.pass_code === passCode);
        log.push(`\n- **Fetch Resident Passes:** [${getResPass.status}] ${getResPass.status === 200 && passFound ? 'Pass ✅' : 'Fail ❌'}`);
    } else {
        log.push(`\n- **Fetch Resident Passes:** Skipped ❌ (No Resident User ID)`);
    }

    // 5. Visitor Fetch Passes
    log.push('\n### 5. GET `/passes/visitor/:mobile`');
    const getVisPass = await fetchAPI(`/passes/visitor/2222222222`, 'GET', null, visitorToken);
    const visPassFound = getVisPass.body?.passes?.find(p => p.pass_code === passCode);
    log.push(`\n- **Fetch Visitor Passes:** [${getVisPass.status}] ${getVisPass.status === 200 && visPassFound ? 'Pass ✅' : 'Fail ❌'} (Returns extra join info: ${visPassFound?.resident_name ? 'Yes ✅' : 'No ❌'})`);

    log.push('\n## Phase 3: Guard Verification and Logs\n');

    // 6. Validate Pass
    log.push('### 6. POST `/passes/validate`');
    const validatePass = await fetchAPI('/passes/validate', 'POST', { pass_code: passCode }, guardToken);
    log.push(`\n- **Validate Pass:** [${validatePass.status}] ${validatePass.status === 200 && validatePass.body.valid ? 'Pass ✅' : 'Fail ❌'}`);

    // 7. Approve Pass
    log.push('\n### 7. POST `/passes/approve`');
    const approvePass = await fetchAPI('/passes/approve', 'POST', { pass_id: passId }, guardToken);
    log.push(`\n- **Approve Pass:** [${approvePass.status}] ${approvePass.status === 200 ? 'Pass ✅' : 'Fail ❌'}`);

    // 8. Fetch Logs
    log.push('\n### 8. GET `/logs/:guard_id`');
    if (guardUser) {
        const getLogs = await fetchAPI(`/logs/${guardUser.id}`, 'GET', null, guardToken);
        const logFound = getLogs.body?.logs?.find(l => l.pass_id === passId);
        log.push(`\n- **Fetch Guard Logs:** [${getLogs.status}] ${getLogs.status === 200 && logFound ? 'Pass ✅' : 'Fail ❌'} (Includes formatted time: ${logFound?.time ? 'Yes ✅' : 'No ❌'})`);
    } else {
        log.push(`\n- **Fetch Guard Logs:** Skipped ❌ (No Guard User ID)`);
    }

    fs.writeFileSync('backend_test_results.md', log.join('\n'));
    console.log('✅ Backend test completed.');
}

// Ensure clean database
try {
    fs.unlinkSync('./server/gate0.db');
    fs.unlinkSync('./server/gate0.db-wal');
    fs.unlinkSync('./server/gate0.db-shm');
} catch (e) { }

// Start server
console.log('Starting server...');
const server = spawn('node', ['server.js'], { cwd: './server', detached: true });

server.stdout.on('data', (data) => {
    if (data.toString().includes('running')) {
        setTimeout(async () => {
            await runTests();
            process.kill(-server.pid);
            process.exit(0);
        }, 1500);
    }
});
