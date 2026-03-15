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
const questionsExist = db.prepare('SELECT id FROM questions LIMIT 1').get();
if (!questionsExist) {
  console.log('🌱 Seeding 40 starter questions...');
  const insert = db.prepare(
    `INSERT INTO questions (question, option_a, option_b, option_c, option_d, answer, category)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const seed = db.transaction(() => {

    // ── NUMBER SERIES ────────────────────────────────────────
    insert.run(
      '🔢 Find the next number:\n\n  3,  6,  11,  18,  27,  ?\n\n(Differences increase by 2 each step: +3, +5, +7, +9, +11)',
      '36', '37', '38', '39', 1, 'pattern'
    );
    insert.run(
      '🔢 Find the next number:\n\n  2,  3,  5,  9,  17,  33,  ?\n\n(Each term = previous × 2 − 1)',
      '60', '63', '65', '67', 2, 'pattern'
    );
    insert.run(
      '🔢 Find the missing number:\n\n  1,  4,  9,  16,  25,  ?,  49\n\n(Each number is a perfect square)',
      '35', '36', '37', '38', 1, 'pattern'
    );
    insert.run(
      '🔢 Find the next number:\n\n  100,  91,  83,  76,  70,  ?\n\n(Differences decrease by 1: −9, −8, −7, −6, −5)',
      '63', '64', '65', '66', 2, 'pattern'
    );
    insert.run(
      '🔢 Find the missing value:\n\n  1,  1,  2,  6,  24,  120,  ?\n\n(Each term = previous × its position index)',
      '620', '700', '720', '740', 2, 'pattern'
    );
    insert.run(
      '🔢 Find the next number:\n\n  2,  5,  11,  23,  47,  ?\n\n(Each term = previous × 2 + 1)',
      '93', '95', '96', '97', 1, 'pattern'
    );
    insert.run(
      '🔢 Find the next number:\n\n  0,  1,  3,  6,  10,  15,  ?\n\n(Triangular numbers: differences +1, +2, +3, +4...)',
      '19', '20', '21', '22', 2, 'pattern'
    );
    insert.run(
      '🔢 Find the next number:\n\n  3,  7,  15,  31,  63,  ?\n\n(Each term = previous × 2 + 1)',
      '125', '126', '127', '128', 2, 'pattern'
    );

    // ── MATRIX / GRID ────────────────────────────────────────
    insert.run(
      '🔷 Number Grid — Find the missing number:\n\n  2   4   8\n  3   6   12\n  4   8   ?\n\n(Each row: col1 × 2 = col2, col1 × 4 = col3)',
      '12', '14', '16', '18', 2, 'matrix'
    );
    insert.run(
      '🔷 Number Grid — Find the missing number:\n\n  16   4   2\n  25   5   2.5\n  36   6   ?\n\n(Col2 = √Col1, Col3 = Col2 ÷ 2)',
      '2', '3', '4', '5', 1, 'matrix'
    );
    insert.run(
      '🔷 Number Grid — Find the missing number:\n\n  1   2   3\n  4   8   12\n  7   14  ?\n\n(Col2 = Col1 × 2, Col3 = Col1 × 3)',
      '18', '20', '21', '24', 2, 'matrix'
    );
    insert.run(
      '🔷 Number Grid — Find the missing number:\n\n  5   3   8\n  7   2   9\n  6   4   ?\n\n(Each row: col1 + col2 = col3)',
      '8', '9', '10', '11', 2, 'matrix'
    );
    insert.run(
      '🔷 Number Grid — Find the missing number:\n\n  4   16   64\n  3   9    27\n  2   4    ?\n\n(Each row: col1², col1³)',
      '6', '7', '8', '9', 2, 'matrix'
    );

    // ── LOGICAL DEDUCTION ────────────────────────────────────
    insert.run(
      '🧠 Logical Deduction:\n\nAll doctors are educated.\nSome educated people are rich.\nNo rich person is unhappy.\n\nWhich MUST be true?',
      'All doctors are rich', 'Some educated people are not rich', 'All rich people are educated', 'No doctor is unhappy', 1, 'logic'
    );
    insert.run(
      '🧠 Logical Deduction:\n\nIf it rains, the match is cancelled.\nThe match was NOT cancelled.\n\nWhat can we conclude?',
      'It rained', 'It did not rain', 'The match was played inside', 'It might have rained', 1, 'logic'
    );
    insert.run(
      '🧠 Logical Deduction:\n\nAll squares are rectangles.\nAll rectangles are parallelograms.\nShape X is a square.\n\nWhich MUST be true?',
      'X is a parallelogram', 'X is not a rectangle', 'X has unequal sides', 'X is a rhombus', 0, 'logic'
    );
    insert.run(
      '🧠 Logical Deduction:\n\nNo cats are dogs.\nSome animals are cats.\nAll dogs are animals.\n\nWhich MUST be true?',
      'Some animals are not dogs', 'All cats are animals', 'No animals are dogs', 'Some cats are dogs', 1, 'logic'
    );
    insert.run(
      '🧠 Coded Language:\n\nIf C=3, O=15, L=12, D=4\nthen COLD = ?\n\n(Sum of letter positions in alphabet)',
      '34', '35', '36', '37', 0, 'logic'
    );
    insert.run(
      '🧠 Coded Language:\n\nIf ARMY = 46, then NAVY = ?\n\n(Sum of letter positions: A=1, B=2 ... Z=26)',
      '54', '55', '56', '57', 2, 'logic'
    );

    // ── SPATIAL REASONING ────────────────────────────────────
    insert.run(
      '🔷 Spatial Reasoning:\n\nA cube has all 6 faces painted red. It is cut into 27 equal smaller cubes.\nHow many small cubes have NO red face at all?',
      '0', '1', '2', '3', 1, 'spatial'
    );
    insert.run(
      '🔷 Spatial Reasoning:\n\nHow many faces does a solid have if it has 8 vertices and 12 edges?\n\n(Euler\'s formula: Faces + Vertices − Edges = 2)',
      '4', '5', '6', '8', 2, 'spatial'
    );
    insert.run(
      '🔷 Spatial Reasoning:\n\nA clock shows 3:15.\nWhat is the angle between the hour and minute hands?',
      '0°', '7.5°', '15°', '22.5°', 1, 'spatial'
    );
    insert.run(
      '🔷 Spatial Reasoning:\n\nA cube is painted on all sides and cut into 64 equal smaller cubes.\nHow many small cubes have paint on exactly 2 faces?',
      '16', '24', '32', '48', 1, 'spatial'
    );
    insert.run(
      '🔷 Spatial Reasoning:\n\nA rectangular box is 4cm × 3cm × 2cm.\nHow many unit cubes (1cm³) fit inside it?',
      '18', '20', '24', '28', 2, 'spatial'
    );

    // ── WORKING MEMORY ───────────────────────────────────────
    insert.run(
      '🧠 Working Memory:\n\nSequence: 7, 3, 9, 1, 5, 8, 2\n\nWhat is the sum of the 2nd, 4th, and 6th numbers?',
      '10', '11', '12', '13', 2, 'memory'
    );
    insert.run(
      '🧠 Working Memory:\n\nList: 15, 8, 23, 4, 16, 42, 7\n\nWhat is the difference between the largest and smallest numbers?',
      '35', '37', '38', '39', 2, 'memory'
    );
    insert.run(
      '🧠 Working Memory:\n\nRed = 3, Blue = 7, Green = 5, Yellow = 2\n\nWhat is (Red × Green) + Blue − Yellow?',
      '18', '19', '20', '21', 2, 'memory'
    );
    insert.run(
      '🧠 Working Memory:\n\nA train stops at 8 stations. It picks up 12 passengers at each of the first 3 stops, and drops off 8 passengers at each of the next 3 stops.\n\nHow many passengers are on the train after 6 stops? (Starts empty)',
      '10', '11', '12', '13', 2, 'memory'
    );

    // ── ANALOGIES ────────────────────────────────────────────
    insert.run(
      '🧩 Analogy:\n\nMoon : Earth  =  Earth : ?\n',
      'Mars', 'Galaxy', 'Sun', 'Universe', 2, 'logic'
    );
    insert.run(
      '🧩 Analogy:\n\n36 : 6  =  81 : ?\n\n(Relationship: perfect square to its square root)',
      '7', '8', '9', '10', 2, 'logic'
    );
    insert.run(
      '🧩 Analogy:\n\nOptimist : Pessimist  =  Diligent : ?\n',
      'Lazy', 'Slow', 'Tired', 'Careful', 0, 'logic'
    );
    insert.run(
      '🧩 Analogy:\n\nChapter : Book  =  Scene : ?\n',
      'Story', 'Film', 'Act', 'Script', 1, 'logic'
    );

    // ── ODD ONE OUT ──────────────────────────────────────────
    insert.run(
      '🧩 Odd One Out — Which does NOT belong?\n\n  17,  23,  31,  37,  42,  47\n\n(All others are prime numbers)',
      '31', '37', '42', '47', 2, 'logic'
    );
    insert.run(
      '🧩 Odd One Out — Which does NOT belong?\n\n  Cube, Sphere, Cylinder, Triangle, Cone\n\n(All others are 3D shapes)',
      'Cube', 'Sphere', 'Cylinder', 'Triangle', 3, 'logic'
    );
    insert.run(
      '🧩 Odd One Out — Which does NOT belong?\n\n  1,  4,  9,  15,  25,  36\n\n(All others are perfect squares)',
      '9', '15', '25', '36', 1, 'logic'
    );
    insert.run(
      '🧩 Odd One Out — Which does NOT belong?\n\n  Violin,  Guitar,  Flute,  Cello,  Harp\n\n(All others are string instruments)',
      'Violin', 'Guitar', 'Flute', 'Cello', 2, 'logic'
    );

    // ── ADVANCED REASONING ───────────────────────────────────
    insert.run(
      '🧠 Advanced:\n\nA snail climbs 3m up a wall during the day and slides 1m down at night.\nThe wall is 12m tall. How many days does it take to reach the top?',
      '5', '6', '7', '8', 1, 'logic'
    );
    insert.run(
      '🧠 Advanced:\n\nIn a race, you overtake the person in 2nd place.\nWhat position are you in now?',
      '1st', '2nd', '3rd', '4th', 1, 'logic'
    );
    insert.run(
      '🧠 Advanced:\n\nHow many times does the digit 9 appear when writing all integers from 1 to 100?',
      '10', '11', '20', '21', 2, 'logic'
    );
    insert.run(
      '🧠 Advanced:\n\nA bat and a ball cost ₹110 together.\nThe bat costs ₹100 more than the ball.\nHow much does the ball cost?',
      '₹5', '₹10', '₹15', '₹20', 0, 'logic'
    );

  });

  seed();
  console.log('✅ 40 questions seeded successfully!');
}

module.exports = db;
