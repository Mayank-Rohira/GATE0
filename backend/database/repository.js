const db = require('./db');
const store = require('./store');

const DB_TIMEOUT_MS = 2500;

function withTimeout(promise, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${DB_TIMEOUT_MS}ms`)), DB_TIMEOUT_MS);
    })
  ]);
}

function logFallback(label, error) {
  console.warn(`[DB_FALLBACK] ${label}: ${error.message}`);
}

async function findUserByMobile(mobile) {
  try {
    const result = await withTimeout(
      db.query('SELECT * FROM users WHERE mobile = $1 LIMIT 1', [mobile]),
      'findUserByMobile'
    );
    return result.rows[0] || null;
  } catch (error) {
    logFallback('findUserByMobile', error);
    return store.findUserByMobile(mobile);
  }
}

async function createUser(user) {
  try {
    const result = await withTimeout(
      db.query(
        `INSERT INTO users (name, mobile, password_hash, role, house_number, society_name)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [user.name, user.mobile, user.password_hash, user.role, user.house_number || '', user.society_name || '']
      ),
      'createUser'
    );
    return result.rows[0];
  } catch (error) {
    logFallback('createUser', error);
    return store.createUser(user);
  }
}

async function passCodeExists(passCode) {
  try {
    const result = await withTimeout(
      db.query('SELECT id FROM passes WHERE pass_code = $1 LIMIT 1', [passCode]),
      'passCodeExists'
    );
    return result.rows.length > 0;
  } catch (error) {
    logFallback('passCodeExists', error);
    return store.passCodeExists(passCode);
  }
}

async function createPass(pass) {
  try {
    const result = await withTimeout(
      db.query(
        `INSERT INTO passes (pass_code, resident_mobile, visitor_mobile, visitor_name, service_name, house_number, society_name, category, expected_time, expiry_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          pass.pass_code,
          pass.resident_mobile,
          pass.visitor_mobile,
          pass.visitor_name,
          pass.service_name,
          pass.house_number,
          pass.society_name,
          pass.category,
          pass.expected_time,
          pass.expiry_at
        ]
      ),
      'createPass'
    );
    return result.rows[0];
  } catch (error) {
    logFallback('createPass', error);
    return store.createPass(pass);
  }
}

async function getResidentPasses(mobile) {
  try {
    const result = await withTimeout(
      db.query('SELECT * FROM passes WHERE resident_mobile = $1 ORDER BY created_at DESC', [mobile]),
      'getResidentPasses'
    );
    return result.rows;
  } catch (error) {
    logFallback('getResidentPasses', error);
    return store.getResidentPasses(mobile);
  }
}

async function getVisitorPasses(mobile) {
  try {
    const result = await withTimeout(
      db.query(
        `SELECT p.*, u.name AS resident_name
         FROM passes p
         LEFT JOIN users u ON u.mobile = p.resident_mobile
         WHERE p.visitor_mobile = $1
         ORDER BY p.created_at DESC`,
        [mobile]
      ),
      'getVisitorPasses'
    );
    return result.rows;
  } catch (error) {
    logFallback('getVisitorPasses', error);
    return store.getVisitorPasses(mobile);
  }
}

async function getPassByCode(passCode) {
  try {
    const passResult = await withTimeout(
      db.query(
        "SELECT * FROM passes WHERE REGEXP_REPLACE(UPPER(pass_code), '[^A-Z0-9]', '', 'g') = REGEXP_REPLACE(UPPER($1), '[^A-Z0-9]', '', 'g') LIMIT 1",
        [passCode]
      ),
      'getPassByCode.pass'
    );
    const pass = passResult.rows[0];
    if (!pass) {
      console.warn(`[DB_QUERY_EMPTY] No pass found for sanitized code: ${passCode}`);
      return null;
    }

    const residentResult = await withTimeout(
      db.query('SELECT name FROM users WHERE mobile = $1 LIMIT 1', [pass.resident_mobile]),
      'getPassByCode.resident'
    );

    return {
      ...pass,
      resident_name: residentResult.rows[0]?.name || 'Resident'
    };
  } catch (error) {
    logFallback('getPassByCode', error);
    return store.getPassByCode(passCode);
  }
}

async function approvePass(passCode, guardMobile) {
  try {
    const client = await withTimeout(db.getClient(), 'approvePass.client');
    try {
      await withTimeout(client.query('BEGIN'), 'approvePass.begin');
      const passResult = await withTimeout(
        client.query(
          "SELECT * FROM passes WHERE REGEXP_REPLACE(UPPER(pass_code), '[^A-Z0-9]', '', 'g') = REGEXP_REPLACE(UPPER($1), '[^A-Z0-9]', '', 'g') LIMIT 1",
          [passCode]
        ),
        'approvePass.pass'
      );
      const pass = passResult.rows[0];
      if (!pass) {
        await withTimeout(client.query('ROLLBACK'), 'approvePass.rollbackMissing');
        return null;
      }

      const residentResult = await withTimeout(
        client.query('SELECT name FROM users WHERE mobile = $1 LIMIT 1', [pass.resident_mobile]),
        'approvePass.resident'
      );
      const residentName = residentResult.rows[0]?.name || 'Resident';

      const updateResult = await withTimeout(
        client.query('UPDATE passes SET status = $1 WHERE id = $2 RETURNING *', ['approved', pass.id]),
        'approvePass.update'
      );
      const logResult = await withTimeout(
        client.query(
          `INSERT INTO guard_logs (pass_id, guard_mobile, visitor_name, visitor_mobile, resident_name, service_name, house_number, society_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [pass.id, guardMobile, pass.visitor_name, pass.visitor_mobile, residentName, pass.service_name, pass.house_number, pass.society_name]
        ),
        'approvePass.log'
      );

      await withTimeout(client.query('COMMIT'), 'approvePass.commit');
      return {
        pass: { ...updateResult.rows[0], resident_name: residentName },
        logId: logResult.rows[0].id
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (_) {
        // Ignore rollback errors during fallback.
      }
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logFallback('approvePass', error);
    return store.approvePass(passCode, guardMobile);
  }
}

async function denyPass(passCode) {
  try {
    const result = await withTimeout(
      db.query('DELETE FROM passes WHERE TRIM(UPPER(pass_code)) = $1 RETURNING *', [passCode]),
      'denyPass'
    );
    return result.rows[0] || null;
  } catch (error) {
    logFallback('denyPass', error);
    return store.denyPass(passCode);
  }
}

async function getGuardLogs(guardMobile, date, limit) {
  try {
    let queryStr = 'SELECT * FROM guard_logs WHERE guard_mobile = $1';
    const params = [guardMobile];

    if (date) {
      queryStr += ' AND timestamp::date = $2';
      params.push(date);
    }

    queryStr += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
    params.push(limit || 100);

    const result = await withTimeout(
      db.query(queryStr, params),
      'getGuardLogs'
    );
    return result.rows;
  } catch (error) {
    logFallback('getGuardLogs', error);
    return store.getGuardLogs(guardMobile, date, limit);
  }
}

module.exports = {
  findUserByMobile,
  createUser,
  passCodeExists,
  createPass,
  getResidentPasses,
  getVisitorPasses,
  getPassByCode,
  approvePass,
  denyPass,
  getGuardLogs
};
