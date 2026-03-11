# 🧠 Neuro Zap — Deployment Guide

## Project Structure
```
neuro-zap/
├── index.html          ← Home page
├── test.html           ← Quiz page
├── leaderboard.html    ← Leaderboard
├── admin.html          ← Admin panel  (/admin.html)
├── style.css           ← All styles
├── script.js           ← Frontend logic + API calls
├── server.js           ← Node.js backend
├── database.js         ← SQLite setup
├── package.json        ← Dependencies
├── .env.example        ← Environment variables template
└── README.md           ← This file
```

---

## 🚀 Deploy on Railway (Free — Recommended)

### Step 1 — Create a GitHub repo
1. Go to https://github.com and create a new repository called `neuro-zap`
2. Upload all the project files to it

### Step 2 — Deploy to Railway
1. Go to https://railway.app and sign up (free)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `neuro-zap` repository
4. Railway auto-detects Node.js and deploys it

### Step 3 — Set Environment Variables on Railway
In your Railway project → **Variables** tab, add:
```
JWT_SECRET=pick_any_long_random_string_here_make_it_hard
PORT=3000
```

### Step 4 — Done! 🎉
Railway gives you a public URL like:
`https://neuro-zap-production.up.railway.app`

Share that URL with anyone — they can access Neuro Zap from any browser!

---

## 🖥️ Run Locally (for testing)

### Requirements
- Node.js 18+ → download at https://nodejs.org

### Steps
```bash
# 1. Open terminal in the project folder
cd neuro-zap

# 2. Copy environment file
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Start the server
npm start

# 5. Open in browser
# → http://localhost:3000
```

---

## 🔐 Admin Panel
- URL: `http://your-domain.com/admin.html`
- Default login: **username:** `admin` | **password:** `admin123`
- ⚠️ CHANGE THE PASSWORD after first login!

### What you can do in the Admin Panel:
| Feature | Description |
|---------|-------------|
| 📊 Dashboard | See total users, quizzes taken, avg IQ |
| ❓ Questions | Add, enable/disable, delete questions |
| 👥 Users | View all registered users, delete accounts |
| 🏆 Leaderboard | View all quiz results sorted by score |

---

## 👤 User Accounts
Users can register/login at the quiz — their scores are linked to their account.
Guests (no login) can still take the quiz and appear on leaderboard with their entered name.

---

## 📦 Tech Stack
- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js + Express
- **Database:** SQLite (via better-sqlite3)
- **Auth:** JWT tokens + bcrypt password hashing
- **Hosting:** Railway

---

## ❓ Troubleshooting

**"Cannot connect to server"**
→ Make sure `npm start` is running and you're on `http://localhost:3000`

**Questions not loading**
→ The backend serves questions from the DB. Add questions via Admin Panel first,
  OR the frontend automatically falls back to the built-in 20 questions.

**Leaderboard empty**
→ Complete a quiz and save your name — results are stored in the DB.
