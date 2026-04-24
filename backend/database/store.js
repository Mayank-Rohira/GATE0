const fs = require('fs/promises');
const path = require('path');

const STORE_PATH = path.join(__dirname, 'local_data.json');

const EMPTY_STORE = {
  counters: {
    users: 1,
    passes: 1,
    guard_logs: 1
  },
  users: [],
  passes: [],
  guard_logs: []
};

let queue = Promise.resolve();

async function ensureStore() {
  try {
    await fs.access(STORE_PATH);
  } catch (error) {
    await fs.writeFile(STORE_PATH, JSON.stringify(EMPTY_STORE, null, 2), 'utf8');
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(STORE_PATH, 'utf8');
  return raw ? JSON.parse(raw) : { ...EMPTY_STORE };
}

async function writeStore(store) {
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function withLock(work) {
  queue = queue.then(work, work);
  return queue;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function findUserByMobile(mobile) {
  const store = await readStore();
  return clone(store.users.find((user) => user.mobile === mobile) || null);
}

async function createUser(user) {
  return withLock(async () => {
    const store = await readStore();
    const nextUser = {
      id: store.counters.users++,
      created_at: new Date().toISOString(),
      house_number: '',
      society_name: '',
      ...user
    };
    store.users.push(nextUser);
    await writeStore(store);
    return clone(nextUser);
  });
}

async function passCodeExists(passCode) {
  const store = await readStore();
  return store.passes.some((pass) => pass.pass_code === passCode);
}

async function createPass(pass) {
  return withLock(async () => {
    const store = await readStore();
    const nextPass = {
      id: store.counters.passes++,
      created_at: new Date().toISOString(),
      status: 'pending',
      ...pass
    };
    store.passes.push(nextPass);
    await writeStore(store);
    return clone(nextPass);
  });
}

async function getResidentPasses(mobile) {
  const store = await readStore();
  return clone(
    store.passes
      .filter((pass) => pass.resident_mobile === mobile)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  );
}

async function getVisitorPasses(mobile) {
  const store = await readStore();
  return clone(
    store.passes
      .filter((pass) => pass.visitor_mobile === mobile)
      .map((pass) => ({
        ...pass,
        resident_name: store.users.find((user) => user.mobile === pass.resident_mobile)?.name || 'Resident'
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  );
}

async function getPassByCode(passCode) {
  const store = await readStore();
  const pass = store.passes.find((entry) => entry.pass_code === passCode);
  if (!pass) return null;

  return clone({
    ...pass,
    resident_name: store.users.find((user) => user.mobile === pass.resident_mobile)?.name || 'Resident'
  });
}

async function approvePass(passCode, guardMobile) {
  return withLock(async () => {
    const store = await readStore();
    const pass = store.passes.find((entry) => entry.pass_code === passCode);
    if (!pass) return null;

    pass.status = 'approved';

    const residentName = store.users.find((user) => user.mobile === pass.resident_mobile)?.name || 'Resident';
    const log = {
      id: store.counters.guard_logs++,
      pass_id: pass.id,
      guard_mobile: guardMobile,
      visitor_name: pass.visitor_name,
      visitor_mobile: pass.visitor_mobile,
      resident_name: residentName,
      service_name: pass.service_name,
      house_number: pass.house_number,
      society_name: pass.society_name,
      timestamp: new Date().toISOString()
    };

    store.guard_logs.push(log);
    await writeStore(store);

    return {
      pass: clone({ ...pass, resident_name: residentName }),
      logId: log.id
    };
  });
}

async function denyPass(passCode) {
  return withLock(async () => {
    const store = await readStore();
    const index = store.passes.findIndex((entry) => entry.pass_code === passCode);
    if (index === -1) return null;
    const [removed] = store.passes.splice(index, 1);
    await writeStore(store);
    return clone(removed);
  });
}

async function getGuardLogs(guardMobile, date, limit) {
  const store = await readStore();
  const maxResults = limit || 100;

  const filtered = store.guard_logs
    .filter((log) => log.guard_mobile === guardMobile)
    .filter((log) => !date || String(log.timestamp).slice(0, 10) === date)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, maxResults);

  return clone(filtered);
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
