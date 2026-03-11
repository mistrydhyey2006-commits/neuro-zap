// ============================================================
//  server.js  —  Neuro Zap Backend  (Node.js + Express)
// ============================================================
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const path    = require('path');
const db      = require('./database');

const app       = express();
const PORT      = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'neurozap_secret_change_in_production';

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));   // serve HTML/CSS/JS files

// ── Auth helper ─────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Admin access required' });
    next();
  });
}

// ============================================================
//  AUTH ROUTES
// ============================================================

// POST /api/register
app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (username, email, password) VALUES (?, ?, ?)
    `).run(username.trim(), email.trim().toLowerCase(), hash);

    const token = jwt.sign(
      { id: result.lastInsertRowid, username, role: 'user' },
      JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({ token, username, role: 'user' });
  } catch (e) {
    if (e.message.includes('UNIQUE'))
      return res.status(409).json({ error: 'Username or email already taken' });
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  const user = db.prepare(`
    SELECT * FROM users WHERE username = ? OR email = ?
  `).get(username.trim(), username.trim().toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid username or password' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET, { expiresIn: '7d' }
  );
  res.json({ token, username: user.username, role: user.role });
});

// GET /api/me  — get current user info
app.get('/api/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?')
    .get(req.user.id);
  res.json(user);
});

// ============================================================
//  RESULTS ROUTES
// ============================================================

// POST /api/results  — save a quiz result
app.post('/api/results', (req, res) => {
  const { score, total, iq, guest_name, token, is_daily } = req.body;
  if (score === undefined || !iq)
    return res.status(400).json({ error: 'score and iq are required' });

  let userId   = null;
  let guestName = guest_name || null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
      guestName = null;
    } catch { /* treat as guest */ }
  }

  db.prepare(`
    INSERT INTO results (user_id, guest_name, score, total, iq, is_daily)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, guestName, score, total || 20, iq, is_daily ? 1 : 0);

  res.json({ success: true });
});

// GET /api/daily  — today's daily challenge question
app.get('/api/daily', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  // Pick a deterministic question based on today's date
  const all = db.prepare("SELECT * FROM questions WHERE active=1").all();
  if (!all.length) {
    // Fallback hardcoded daily if no DB questions
    return res.json({ question: "What number comes next: 2, 4, 8, 16, ?", date: today });
  }
  const idx = new Date(today).getDate() % all.length;
  const q   = all[idx];
  res.json({ question: q.question, date: today, id: q.id });
});

// GET /api/leaderboard  — top 50, optional ?filter=daily
app.get('/api/leaderboard', (req, res) => {
  const isDaily = req.query.filter === 'daily';
  const today   = new Date().toISOString().split('T')[0];

  let rows;
  if (isDaily) {
    rows = db.prepare(`
      SELECT COALESCE(u.username, r.guest_name, 'Anonymous') AS name,
             r.score, r.total, r.iq, r.taken_at, r.is_daily
      FROM results r LEFT JOIN users u ON u.id = r.user_id
      WHERE date(r.taken_at) = ? AND r.is_daily = 1
      ORDER BY r.score DESC, r.iq DESC LIMIT 50
    `).all(today);
  } else {
    rows = db.prepare(`
      SELECT COALESCE(u.username, r.guest_name, 'Anonymous') AS name,
             r.score, r.total, r.iq, r.taken_at, r.is_daily
      FROM results r LEFT JOIN users u ON u.id = r.user_id
      ORDER BY r.score DESC, r.iq DESC LIMIT 50
    `).all();
  }
  res.json(rows);
});



// ============================================================
//  QUESTIONS ROUTES
// ============================================================

// GET /api/questions  — get all active questions (for the quiz)
app.get('/api/questions', (req, res) => {
  const rows = db.prepare(`
    SELECT id, question, option_a, option_b, option_c, option_d, answer, category
    FROM questions WHERE active = 1
  `).all();

  // Shuffle and return max 20
  const shuffled = rows.sort(() => Math.random() - 0.5).slice(0, 20);

  // Format for frontend
  const formatted = shuffled.map(q => ({
    id      : q.id,
    q       : q.question,
    options : [q.option_a, q.option_b, q.option_c, q.option_d],
    answer  : q.answer,
    category: q.category
  }));

  res.json(formatted);
});

// ── ADMIN: Questions CRUD ────────────────────────────────────

// GET /api/admin/questions  — all questions including inactive
app.get('/api/admin/questions', adminMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM questions ORDER BY id DESC').all();
  res.json(rows);
});

// POST /api/admin/questions  — add new question
app.post('/api/admin/questions', adminMiddleware, (req, res) => {
  const { question, option_a, option_b, option_c, option_d, answer, category } = req.body;
  if (!question || !option_a || !option_b || !option_c || !option_d || answer === undefined)
    return res.status(400).json({ error: 'All fields required' });

  const result = db.prepare(`
    INSERT INTO questions (question, option_a, option_b, option_c, option_d, answer, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(question, option_a, option_b, option_c, option_d, answer, category || 'general');

  res.json({ success: true, id: result.lastInsertRowid });
});

// PUT /api/admin/questions/:id  — edit question
app.put('/api/admin/questions/:id', adminMiddleware, (req, res) => {
  const { question, option_a, option_b, option_c, option_d, answer, category, active } = req.body;
  db.prepare(`
    UPDATE questions
    SET question=?, option_a=?, option_b=?, option_c=?, option_d=?,
        answer=?, category=?, active=?
    WHERE id=?
  `).run(question, option_a, option_b, option_c, option_d, answer,
         category || 'general', active ?? 1, req.params.id);
  res.json({ success: true });
});

// DELETE /api/admin/questions/:id
app.delete('/api/admin/questions/:id', adminMiddleware, (req, res) => {
  db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── ADMIN: Users ─────────────────────────────────────────────

// GET /api/admin/users
app.get('/api/admin/users', adminMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT id, username, email, role, created_at,
      (SELECT COUNT(*) FROM results WHERE user_id = users.id) AS quiz_count
    FROM users ORDER BY created_at DESC
  `).all();
  res.json(rows);
});

// DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', adminMiddleware, (req, res) => {
  if (req.params.id == req.user.id)
    return res.status(400).json({ error: "Can't delete yourself" });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST /api/admin/change-password
app.post('/api/admin/change-password', adminMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Both fields are required' });
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 characters' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user || !bcrypt.compareSync(currentPassword, user.password))
    return res.status(401).json({ error: 'Current password is incorrect' });

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ success: true });
});

// DELETE /api/admin/clear-results
app.delete('/api/admin/clear-results', adminMiddleware, (req, res) => {
  db.prepare('DELETE FROM results').run();
  res.json({ success: true });
});

// ── ADMIN: Stats ─────────────────────────────────────────────
app.get('/api/admin/stats', adminMiddleware, (req, res) => {
  const totalUsers     = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role='user'").get().c;
  const totalQuizzes   = db.prepare("SELECT COUNT(*) AS c FROM results").get().c;
  const totalQuestions = db.prepare("SELECT COUNT(*) AS c FROM questions WHERE active=1").get().c;
  const avgIQ          = db.prepare("SELECT ROUND(AVG(iq),1) AS a FROM results").get().a || 0;
  res.json({ totalUsers, totalQuizzes, totalQuestions, avgIQ });
});

// ── Catch-all → serve index.html ONLY for unknown routes ────
app.get('*', (req, res) => {
  // If request looks like a file (has extension), let Express 404 it naturally
  if (req.path.includes('.')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Neuro Zap running at http://localhost:${PORT}`);
});
