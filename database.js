// ============================================================
//  database.js  —  SQLite setup using better-sqlite3
// ============================================================
const Database = require('better-sqlite3');
const path     = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'neurozap.db');
const db      = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// ---- Create tables ----
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT    UNIQUE NOT NULL,
    email      TEXT    UNIQUE NOT NULL,
    password   TEXT    NOT NULL,
    role       TEXT    NOT NULL DEFAULT 'user',   -- 'user' | 'admin'
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS results (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    guest_name TEXT,
    score      INTEGER NOT NULL,
    total      INTEGER NOT NULL DEFAULT 20,
    iq         INTEGER NOT NULL,
    is_daily   INTEGER NOT NULL DEFAULT 0,
    taken_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS questions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    question    TEXT    NOT NULL,
    option_a    TEXT    NOT NULL,
    option_b    TEXT    NOT NULL,
    option_c    TEXT    NOT NULL,
    option_d    TEXT    NOT NULL,
    answer      INTEGER NOT NULL,   -- 0=A, 1=B, 2=C, 3=D
    category    TEXT    NOT NULL DEFAULT 'general',
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// ---- Seed default admin if not exists ----
const bcrypt = require('bcryptjs');
const adminExists = db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").get();
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (username, email, password, role)
    VALUES ('admin', 'admin@neurozap.com', ?, 'admin')
  `).run(hash);
  console.log('✅ Default admin created  →  username: admin  |  password: admin123');
}

// ---- Safe migrations (add columns if they don't exist) ----
try {
  db.exec(`ALTER TABLE results ADD COLUMN is_daily INTEGER NOT NULL DEFAULT 0`);
} catch (e) {
  // Column already exists — that's fine, ignore
}

module.exports = db;
