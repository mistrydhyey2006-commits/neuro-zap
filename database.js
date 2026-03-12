// ============================================================
//  database.js  —  SQLite setup using better-sqlite3
// ============================================================
const Database = require('better-sqlite3');
const bcrypt   = require('bcryptjs');
const path     = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'neurozap.db');

// Ensure directory exists (required for Railway volume)
const fs = require('fs');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// ---- Create tables ----
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT    UNIQUE NOT NULL,
    email      TEXT    UNIQUE NOT NULL,
    password   TEXT    NOT NULL,
    role       TEXT    NOT NULL DEFAULT 'user',
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
    answer      INTEGER NOT NULL,
    category    TEXT    NOT NULL DEFAULT 'general',
    image_url   TEXT,
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS daily_questions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    date       TEXT    UNIQUE NOT NULL,
    question   TEXT    NOT NULL,
    option_a   TEXT    NOT NULL,
    option_b   TEXT    NOT NULL,
    option_c   TEXT    NOT NULL,
    option_d   TEXT    NOT NULL,
    answer     INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// ---- Safe migrations ----
try { db.exec(`ALTER TABLE results   ADD COLUMN is_daily  INTEGER NOT NULL DEFAULT 0`) } catch {}
try { db.exec(`ALTER TABLE questions ADD COLUMN image_url TEXT`) } catch {}

// ---- Seed default admin ----
const adminExists = db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").get();
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (username, email, password, role) VALUES ('admin', 'admin@neurozap.com', ?, 'admin')`).run(hash);
  console.log('✅ Default admin created  →  username: admin  |  password: admin123');
}

// ---- Seed questions — runs ONCE only if table is empty ----
// After first deploy, manage all questions via the admin dashboard.
const questionsExist = db.prepare('SELECT id FROM questions LIMIT 1').get();
if (!questionsExist) {
  console.log('🌱 Seeding 20 starter questions...');
  const insert = db.prepare(
    `INSERT INTO questions (question, option_a, option_b, option_c, option_d, answer, category)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const seed = db.transaction(() => {
    insert.run(
      '🔢 Number Matrix — What number replaces the question mark?\n\n  2   4   8\n  3   9  27\n  4  16   ?\n\n(Each row: n, n², n³)',
      '64', '48', '32', '256', 0, 'matrix'
    );
    insert.run(
      '🔷 Pattern Series — Which comes next?\n\n  △  △△  △△△  △△△△  ?\n\nEach step adds one triangle and rotates 90° clockwise.',
      '5 triangles rotated 90°', '4 triangles rotated 180°', '5 triangles, no rotation', '6 triangles rotated 90°', 0, 'pattern'
    );
    insert.run(
      '🧠 Abstract Logic — A 3×3 grid alternates between two inverse patterns. The 3rd matrix = same as the 1st. The bottom-right cell of matrix 1 is ■. What is the bottom-right cell of the 3rd matrix?',
      '■ (filled)', '□ (empty)', 'Half filled', 'Cannot determine', 0, 'logic'
    );
    insert.run(
      '🔢 Working Memory — Find the next number:\n\n  7 → 14 → 11 → 22 → 19 → 38 → ?\n\n(Rule alternates: ×2, then −3)',
      '35', '41', '76', '32', 0, 'memory'
    );
    insert.run(
      '🔷 Spatial Reasoning — A paper square is folded in half diagonally, then a hole is punched through the centre. When unfolded, how many holes appear?',
      '1', '2', '4', '3', 1, 'spatial'
    );
    insert.run(
      '🧩 Odd One Out — Which does NOT belong?\n\nA) All sides equal AND all angles equal\nB) All sides equal but angles differ\nC) All angles equal but sides differ\nD) Has 4 lines of symmetry',
      'A', 'B', 'C', 'D', 2, 'logic'
    );
    insert.run(
      '🔢 Number Series — Find the next number:\n\n  1, 1, 2, 3, 5, 8, 13, 21, ?',
      '32', '34', '33', '36', 1, 'pattern'
    );
    insert.run(
      '🧠 Logical Deduction:\n\nAll Zyrens are Blipps.\nSome Blipps are Quorns.\nNo Quorns are Zyrens.\n\nWhich conclusion MUST be true?',
      'Some Zyrens are Quorns', 'No Zyrens are Quorns', 'All Quorns are Blipps', 'Some Blipps are not Zyrens', 3, 'logic'
    );
    insert.run(
      '🔷 Rotation — A cube has ● on top, ★ on front, ▲ on right. It is rotated 90° to the right. What is now on top?',
      '★', '▲', '●', 'The bottom face', 0, 'spatial'
    );
    insert.run(
      '🔢 Missing Number in Grid:\n\n  6   11   8\n  9   15  12\n  7    ?  10\n\n(Pattern: middle = left + right − 5)',
      '11', '12', '13', '10', 1, 'matrix'
    );
    insert.run(
      '🧩 Visual Pattern — Letters transform:\n\n  A → D → G → J → ?\n\n(Each letter moves +3 positions in the alphabet)',
      'L', 'M', 'K', 'N', 1, 'pattern'
    );
    insert.run(
      '🧠 Spatial Folding — Which 3D shape is formed when this net is folded?\n\nNet: 1 square in the centre with 4 triangles attached to each side.',
      'Cube', 'Square Pyramid', 'Tetrahedron', 'Triangular Prism', 1, 'spatial'
    );
    insert.run(
      '🔢 Working Memory — What is the sum of ONLY the odd numbers in this list?\n\n  12,  7,  3,  18,  5,  22,  9,  14',
      '19', '24', '29', '21', 1, 'memory'
    );
    insert.run(
      '🔷 Matrix Reasoning — 3×3 grid:\n\nRow 1: ○  ○○  ○○○\nRow 2: □  □□  □□□\nRow 3: △  △△   ?\n\nWhat fills the missing cell?',
      '△△△', '○○○', '□□', '△△', 0, 'matrix'
    );
    insert.run(
      '🧠 Abstract Analogy:\n\nSolid Circle : Hollow Circle  =  Solid Square : ?\n\n(Filled shape becomes outline only)',
      'Hollow Square', 'Solid Triangle', 'Filled Diamond', 'Smaller Square', 0, 'logic'
    );
    insert.run(
      '🔢 Number Pattern — What replaces the ?:\n\n  144 → 12 → 3\n   81 →  9 → 3\n   64 →  8 → ?\n\n(Each step: √ of previous number)',
      '2', '4', '2.83', '3', 2, 'pattern'
    );
    insert.run(
      '🧩 Odd One Out — Which number does NOT belong?\n\n  121,  144,  169,  196,  210,  225',
      '169', '196', '210', '225', 2, 'logic'
    );
    insert.run(
      '🔷 Spatial Reasoning — A shape viewed from front shows 3 columns of height 3, 2, 1 (left to right) and is 2 units deep. How many cubes are needed to build it?',
      '10', '12', '11', '14', 1, 'spatial'
    );
    insert.run(
      '🧠 Inductive Reasoning — Sequence of symbols:\n\n  ◆ ◇ ◆◆ ◇◇ ◆◆◆ ◇◇◇ …\n\nWhat is the 10th symbol group?',
      '◆◆◆◆◆', '◇◇◇◇◇', '◆◆◆◆◆◆', '◇◇◇◇', 1, 'logic'
    );
    insert.run(
      '🔢 Advanced Series — Find the missing value:\n\n  2, 6, 12, 20, 30, 42, ?\n\n(Differences between terms: 4, 6, 8, 10, 12, …)',
      '52', '54', '56', '58', 2, 'pattern'
    );
  });

  seed();
  console.log('✅ 20 questions seeded successfully!');
}

module.exports = db;
