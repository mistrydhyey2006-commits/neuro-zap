// ============================================================
//  server.js  —  Neuro Zap Backend  (Node.js + Express)
// ============================================================
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const db      = require('./database');

const app        = express();
const PORT       = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'neurozap_secret_change_in_production';

// ── Uploads folder ───────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ── Multer config ────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => cb(null, 'q_' + Date.now() + path.extname(file.originalname).toLowerCase())
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg','.jpeg','.png','.gif','.webp'];
    allowed.includes(path.extname(file.originalname).toLowerCase())
      ? cb(null, true) : cb(new Error('Only image files allowed'));
  }
});

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname), { etag:false, lastModified:false, setHeaders:(res)=>{ res.setHeader("Cache-Control","no-store,no-cache,must-revalidate"); res.setHeader("Pragma","no-cache"); res.setHeader("Expires","0"); } }));
app.use('/uploads', express.static(UPLOADS_DIR));

// ── Helpers ──────────────────────────────────────────────────
const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// ── Auth middleware ──────────────────────────────────────────
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
    return res.status(400).json({ error: 'All fields are required' });

  if (!EMAIL_REGEX.test(String(email).trim()))
    return res.status(400).json({ error: 'Please enter a valid email address (e.g. name@gmail.com)' });

  if (!USERNAME_REGEX.test(String(username).trim()))
    return res.status(400).json({ error: 'Username must be 3–20 characters, letters and numbers only' });

  if (String(password).length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const hash   = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
    ).run(String(username).trim(), String(email).trim().toLowerCase(), hash);

    const token = jwt.sign(
      { id: result.lastInsertRowid, username: String(username).trim(), role: 'user' },
      JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({ token, username: String(username).trim(), role: 'user' });
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

  const input = String(username).trim();

  // If input looks like email, must be valid full email
  if (input.includes('@') && !EMAIL_REGEX.test(input))
    return res.status(401).json({ error: 'Invalid username or password' });

  const user = db.prepare(
    'SELECT * FROM users WHERE username = ? OR email = ?'
  ).get(input, input.toLowerCase());

  if (!user || !bcrypt.compareSync(String(password), user.password))
    return res.status(401).json({ error: 'Invalid username or password' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET, { expiresIn: '7d' }
  );
  res.json({ token, username: user.username, role: user.role });
});

// GET /api/me
app.get('/api/me', authMiddleware, (req, res) => {
  const user = db.prepare(
    'SELECT id, username, email, role, created_at FROM users WHERE id = ?'
  ).get(req.user.id);
  res.json(user);
});

// ============================================================
//  RESULTS ROUTES
// ============================================================

// POST /api/results
app.post('/api/results', (req, res) => {
  const { score, total, iq, guest_name, token, is_daily } = req.body;
  if (score === undefined || !iq)
    return res.status(400).json({ error: 'score and iq are required' });

  let userId    = null;
  let guestName = guest_name || null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId    = decoded.id;
      guestName = null;
    } catch { /* treat as guest */ }
  }

  db.prepare(
    'INSERT INTO results (user_id, guest_name, score, total, iq, is_daily) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(userId, guestName, score, total || 20, iq, is_daily ? 1 : 0);

  res.json({ success: true });
});

// GET /api/daily — today's daily challenge (checks custom table first)
app.get('/api/daily', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  // Check if admin set a custom daily question for today
  const custom = db.prepare('SELECT * FROM daily_questions WHERE date = ?').get(today);
  if (custom) {
    return res.json({
      question  : custom.question,
      options   : [custom.option_a, custom.option_b, custom.option_c, custom.option_d],
      answer    : custom.answer,
      date      : today,
      is_custom : true
    });
  }
  // Fallback: pick from questions bank
  const all = db.prepare('SELECT * FROM questions WHERE active=1').all();
  if (!all.length)
    return res.json({ question: 'What number comes next: 2, 4, 8, 16, ?', options: ['32','24','18','20'], answer: 0, date: today });
  const q = all[new Date(today).getDate() % all.length];
  res.json({
    question  : q.question,
    options   : [q.option_a, q.option_b, q.option_c, q.option_d],
    answer    : q.answer,
    date      : today,
    is_custom : false
  });
});

// ── ADMIN: Daily questions CRUD ──────────────────────────────
app.get('/api/admin/daily-questions', adminMiddleware, (req, res) => {
  res.json(db.prepare('SELECT * FROM daily_questions ORDER BY date DESC').all());
});

app.post('/api/admin/daily-questions', adminMiddleware, (req, res) => {
  const { question, option_a, option_b, option_c, option_d, answer, date } = req.body;
  if (!question || !option_a || !option_b || !option_c || !option_d)
    return res.status(400).json({ error: 'All fields required' });
  const today = new Date().toISOString().split('T')[0];
  try {
    db.prepare(`
      INSERT OR REPLACE INTO daily_questions (date, question, option_a, option_b, option_c, option_d, answer)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(date || today, question, option_a, option_b, option_c, option_d, answer || 0);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/admin/daily-questions/:id', adminMiddleware, (req, res) => {
  db.prepare('DELETE FROM daily_questions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /api/leaderboard
app.get('/api/leaderboard', (req, res) => {
  const isDaily = req.query.filter === 'daily';
  const today   = new Date().toISOString().split('T')[0];
  const rows = isDaily
    ? db.prepare(`SELECT COALESCE(u.username, r.guest_name, 'Anonymous') AS name,
        r.score, r.total, r.iq, r.taken_at, r.is_daily
        FROM results r LEFT JOIN users u ON u.id = r.user_id
        WHERE date(r.taken_at) = ? AND r.is_daily = 1
        ORDER BY r.score DESC, r.iq DESC LIMIT 50`).all(today)
    : db.prepare(`SELECT COALESCE(u.username, r.guest_name, 'Anonymous') AS name,
        r.score, r.total, r.iq, r.taken_at, r.is_daily
        FROM results r LEFT JOIN users u ON u.id = r.user_id
        ORDER BY r.score DESC, r.iq DESC LIMIT 50`).all();
  res.json(rows);
});

// ============================================================
//  QUESTIONS ROUTES
// ============================================================

// GET /api/questions
app.get('/api/questions', (req, res) => {
  const rows = db.prepare(
    'SELECT id, question, option_a, option_b, option_c, option_d, answer, category, image_url FROM questions WHERE active = 1'
  ).all();
  const shuffled = rows.sort(() => Math.random() - 0.5).slice(0, 20);
  res.json(shuffled.map(q => ({
    id       : q.id,
    q        : q.question,
    options  : [q.option_a, q.option_b, q.option_c, q.option_d],
    answer   : q.answer,
    category : q.category,
    image_url: q.image_url || null
  })));
});

// ── ADMIN: Image upload ──────────────────────────────────────
app.post('/api/admin/upload-image', adminMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  res.json({ success: true, url: '/uploads/' + req.file.filename });
});

// ── ADMIN: Questions CRUD ────────────────────────────────────
app.get('/api/admin/questions', adminMiddleware, (req, res) => {
  res.json(db.prepare('SELECT * FROM questions ORDER BY id DESC').all());
});

app.post('/api/admin/questions', adminMiddleware, (req, res) => {
  const { question, option_a, option_b, option_c, option_d, answer, category, image_url } = req.body;
  if (!question || !option_a || !option_b || !option_c || !option_d || answer === undefined)
    return res.status(400).json({ error: 'All fields required' });
  const result = db.prepare(
    'INSERT INTO questions (question, option_a, option_b, option_c, option_d, answer, category, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(question, option_a, option_b, option_c, option_d, answer, category || 'general', image_url || null);
  res.json({ success: true, id: result.lastInsertRowid });
});

app.put('/api/admin/questions/:id', adminMiddleware, (req, res) => {
  const { question, option_a, option_b, option_c, option_d, answer, category, active, image_url } = req.body;
  // If only 'active' is sent (toggle), do a partial update
  if (active !== undefined && !question) {
    db.prepare('UPDATE questions SET active=? WHERE id=?').run(active, req.params.id);
    return res.json({ success: true });
  }
  // Full edit
  const existing = db.prepare('SELECT * FROM questions WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare(
    'UPDATE questions SET question=?, option_a=?, option_b=?, option_c=?, option_d=?, answer=?, category=?, active=?, image_url=? WHERE id=?'
  ).run(
    question   || existing.question,
    option_a   || existing.option_a,
    option_b   || existing.option_b,
    option_c   || existing.option_c,
    option_d   || existing.option_d,
    answer     ?? existing.answer,
    category   || existing.category,
    active     ?? existing.active,
    image_url  !== undefined ? image_url : existing.image_url,
    req.params.id
  );
  res.json({ success: true });
});

app.delete('/api/admin/questions/:id', adminMiddleware, (req, res) => {
  db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── ADMIN: Users ─────────────────────────────────────────────
app.get('/api/admin/users', adminMiddleware, (req, res) => {
  res.json(db.prepare(`
    SELECT id, username, email, role, created_at,
      (SELECT COUNT(*) FROM results WHERE user_id = users.id) AS quiz_count
    FROM users ORDER BY created_at DESC
  `).all());
});

app.delete('/api/admin/users/:id', adminMiddleware, (req, res) => {
  if (req.params.id == req.user.id)
    return res.status(400).json({ error: "Can't delete yourself" });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── ADMIN: Change password ───────────────────────────────────
app.post('/api/admin/change-password', adminMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Both fields are required' });
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user || !bcrypt.compareSync(currentPassword, user.password))
    return res.status(401).json({ error: 'Current password is incorrect' });
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.user.id);
  res.json({ success: true });
});

// ── ADMIN: Clear results ─────────────────────────────────────
app.delete('/api/admin/clear-results', adminMiddleware, (req, res) => {
  db.prepare('DELETE FROM results').run();
  res.json({ success: true });
});

// ── ADMIN: Stats ─────────────────────────────────────────────
app.get('/api/admin/stats', adminMiddleware, (req, res) => {
  res.json({
    users    : db.prepare("SELECT COUNT(*) AS c FROM users WHERE role='user'").get().c,
    results  : db.prepare('SELECT COUNT(*) AS c FROM results').get().c,
    questions: db.prepare('SELECT COUNT(*) AS c FROM questions WHERE active=1').get().c,
    avg_iq   : db.prepare('SELECT ROUND(AVG(iq),1) AS a FROM results').get().a || 0
  });
});

// ── Explicit HTML routes (bypass cache) ─────────────────────
const htmlFiles = ["admin","daily","test","leaderboard","login","index"];
htmlFiles.forEach(name => {
  app.get("/"+name+".html", (req, res) => {
    res.setHeader("Cache-Control","no-store,no-cache,must-revalidate");
    res.setHeader("Pragma","no-cache");
    res.setHeader("Expires","0");
    res.sendFile(path.join(__dirname, name+".html"));
  });
});

// ── Catch-all ─────────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.includes('.')) return res.status(404).send('Not found');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🚀 Neuro Zap running at http://localhost:${PORT}`));
