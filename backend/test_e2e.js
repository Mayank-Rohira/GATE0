const http = require('http');

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) {
        options.headers['Authorization'] = 'Bearer ' + token;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body || '{}') });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function generateMobile() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

async function runTests() {
  console.log('--- GATE0 API E2E TEST ---');

  try {
    // 1. Signup/Login Resident
    console.log('\\n1. Authentication (Resident & Guard)...');
    const resMobile = generateMobile();
    const guardMobile = generateMobile();
    
    // We try login, if fails we signup. But let's just signup.
    let signupRes = await request('POST', '/signup', { 
        name: 'Resident A', 
        mobile: resMobile, 
        role: 'resident', 
        password: 'test',
        house_number: '101',
        society_name: 'Obsidian Heights'
    });
    console.log('   Resident Signup:', signupRes.status);
    
    let signupGuard = await request('POST', '/signup', { 
        name: 'Guard A', 
        mobile: guardMobile, 
        role: 'guard', 
        password: 'test' 
    });
    console.log('   Guard Signup:', signupGuard.status);
    
    let resLogin = await request('POST', '/login', { mobile: resMobile, password: 'test' });
    let residentToken = resLogin.data.token;
    
    let guardLogin = await request('POST', '/login', { mobile: guardMobile, password: 'test' });
    let guardToken = guardLogin.data.token;

    console.log('   Resident Token Acquired:', !!residentToken);
    console.log('   Guard Token Acquired:', !!guardToken);

    if (!residentToken || !guardToken) {
        console.error('Failed to get auth tokens', resLogin.data, guardLogin.data);
        return;
    }

    // 2. Create Pass (Resident)
    console.log('\\n2. Testing Pass Creation (Resident)...');
    let createRes = await request('POST', '/passes/create', {
        visitor_name: 'Alice Tester',
        visitor_mobile: generateMobile(),
        service_name: 'Guest'
    }, residentToken);
    
    console.log('   Result:', createRes.status, createRes.data);
    let passCode = createRes.data.pass_code;
    
    if (!passCode) {
        console.error('Failed to retrieve pass code!');
        return;
    }
    console.log('   => PASS GENERATED:', passCode);

    // 3. Validate Pass (Guard)
    console.log('\\n3. Testing Pass Validation (Guard)...');
    let validateRes = await request('POST', '/passes/validate', { pass_code: passCode }, guardToken);
    console.log('   Result:', validateRes.status, validateRes.data);

    // 4. Approve Pass (Guard)
    console.log('\\n4. Testing Pass Approval (Guard)...');
    let approveRes = await request('POST', '/passes/approve', { pass_code: passCode }, guardToken);
    console.log('   Result:', approveRes.status, approveRes.data);

    // 5. Fetch Logs (Guard)
    console.log('\\n5. Testing Security Logs retrieval...');
    let logsRes = await request('GET', '/logs/' + guardMobile, null, guardToken); // Or with specific param if needed based on routes
    console.log('   Result:', logsRes.status, logsRes.data.length ? `Got ${logsRes.data.length} logs` : logsRes.data);

    if (logsRes.status === 200 && logsRes.data.length > 0) {
        console.log('   Log Entry:', logsRes.data[0]);
    }

    console.log('\\n--- E2E TEST COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Test script encountered an error:', err);
  }
}

runTests();
