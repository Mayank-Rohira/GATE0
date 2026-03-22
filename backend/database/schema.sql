CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  mobile        TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK(role IN ('resident', 'visitor', 'guard')),
  house_number  TEXT,
  society_name  TEXT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS passes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  pass_code      TEXT NOT NULL UNIQUE,
  resident_id    INTEGER NOT NULL REFERENCES users(id),
  visitor_mobile TEXT NOT NULL,
  visitor_name   TEXT NOT NULL,
  service_name   TEXT NOT NULL,
  house_number   TEXT NOT NULL,
  society_name   TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved')),
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guard_logs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  pass_id        INTEGER NOT NULL REFERENCES passes(id),
  guard_id       INTEGER NOT NULL REFERENCES users(id),
  visitor_name   TEXT NOT NULL,
  visitor_mobile TEXT NOT NULL,
  resident_name  TEXT NOT NULL,
  house_number   TEXT NOT NULL,
  society_name   TEXT NOT NULL,
  timestamp      DATETIME DEFAULT CURRENT_TIMESTAMP
);
