CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  mobile        TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK(role IN ('resident', 'visitor', 'guard')),
  house_number  TEXT,
  society_name  TEXT,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS passes (
  id             SERIAL PRIMARY KEY,
  pass_code      TEXT NOT NULL UNIQUE,
  resident_mobile TEXT NOT NULL REFERENCES users(mobile),
  visitor_mobile TEXT NOT NULL,
  visitor_name   TEXT NOT NULL,
  service_name   TEXT NOT NULL,
  house_number   TEXT NOT NULL,
  society_name   TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved')),
  category       TEXT NOT NULL DEFAULT 'guest' CHECK(category IN ('food', 'cab', 'ecommerce', 'guest')),
  expected_time  INTEGER, -- minutes
  expiry_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guard_logs (
  id             SERIAL PRIMARY KEY,
  pass_id        INTEGER NOT NULL REFERENCES passes(id),
  guard_mobile   TEXT NOT NULL REFERENCES users(mobile),
  visitor_name   TEXT NOT NULL,
  visitor_mobile TEXT NOT NULL,
  resident_name  TEXT NOT NULL,
  service_name   TEXT,
  house_number   TEXT NOT NULL,
  society_name   TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'approved' CHECK(status IN ('approved', 'denied')),
  timestamp      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes for Zero-Latency Search
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_passes_resident_mobile ON passes(resident_mobile);
CREATE INDEX IF NOT EXISTS idx_passes_pass_code ON passes(pass_code);
CREATE INDEX IF NOT EXISTS idx_guard_logs_guard_mobile ON guard_logs(guard_mobile);
