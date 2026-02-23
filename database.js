<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Neuro Zap — Admin Panel</title>
  <link rel="stylesheet" href="style.css"/>
  <style>
    .admin-layout { display:flex; min-height:100vh; }

    /* Sidebar */
    .sidebar {
      width: 220px; flex-shrink:0;
      background: var(--surface);
      border-right: 1px solid var(--border);
      padding: 1.5rem 1rem;
      display: flex; flex-direction: column; gap: 0.4rem;
      position: sticky; top:0; height:100vh; overflow-y:auto;
    }
    .sidebar-logo { font-family:'Syne',sans-serif; font-size:1.3rem; font-weight:800; color:var(--accent); margin-bottom:1rem; padding-bottom:1rem; border-bottom:1px solid var(--border); }
    .sidebar-logo span { color:var(--text); }
    .nav-item { padding:0.65rem 0.9rem; border-radius:10px; cursor:pointer; font-size:0.9rem; color:var(--text2); transition:all 0.2s; border:none; background:transparent; width:100%; text-align:left; font-family:'DM Sans',sans-serif; }
    .nav-item:hover, .nav-item.active { background:var(--surface2); color:var(--accent); }
    .sidebar-footer { margin-top:auto; padding-top:1rem; border-top:1px solid var(--border); font-size:0.8rem; color:var(--text2); }

    /* Main */
    .admin-main { flex:1; padding:2rem; overflow-y:auto; }
    .admin-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; flex-wrap:wrap; gap:1rem; }
    .admin-title { font-family:'Syne',sans-serif; font-size:1.6rem; font-weight:700; }

    /* Stats grid */
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(140px,1fr)); gap:1rem; margin-bottom:2rem; }
    .stat-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:1.2rem; text-align:center; transition:border-color 0.2s; }
    .stat-card:hover { border-color:var(--accent); }
    .stat-card .num { font-family:'Syne',sans-serif; font-size:2rem; font-weight:800; color:var(--accent); }
    .stat-card .lbl { font-size:0.75rem; color:var(--text2); text-transform:uppercase; letter-spacing:1px; }

    /* Table */
    .table-wrap { background:var(--surface); border:1px solid var(--border); border-radius:16px; overflow:hidden; margin-bottom:2rem; }
    table { width:100%; border-collapse:collapse; font-size:0.88rem; }
    th { background:var(--surface2); padding:0.75rem 1rem; text-align:left; font-family:'Syne',sans-serif; font-size:0.78rem; text-transform:uppercase; letter-spacing:1px; color:var(--text2); }
    td { padding:0.75rem 1rem; border-top:1px solid var(--border); color:var(--text); vertical-align:middle; }
    tr:hover td { background:var(--surface2); }

    /* Form */
    .form-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:1.5rem; margin-bottom:2rem; }
    .form-title { font-family:'Syne',sans-serif; font-size:1rem; font-weight:700; margin-bottom:1rem; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
    .form-group { display:flex; flex-direction:column; gap:0.3rem; }
    .form-group.full { grid-column:1/-1; }
    label { font-size:0.78rem; color:var(--text2); text-transform:uppercase; letter-spacing:0.5px; }
    input, select, textarea {
      padding:0.65rem 0.9rem; background:var(--surface2); border:1.5px solid var(--border);
      border-radius:10px; font-family:'DM Sans',sans-serif; font-size:0.9rem; color:var(--text);
      outline:none; transition:border-color 0.2s; width:100%;
    }
    input:focus, select:focus, textarea:focus { border-color:var(--accent); }
    textarea { resize:vertical; min-height:80px; }

    /* Badges */
    .badge { display:inline-block; padding:0.2rem 0.65rem; border-radius:50px; font-size:0.75rem; font-weight:600; }
    .badge-admin { background:#fff3cd; color:#856404; }
    .badge-user  { background:#d1ecf1; color:#0c5460; }
    .badge-active   { background:#d4edda; color:#155724; }
    .badge-inactive { background:#f8d7da; color:#721c24; }
    body.dark .badge-admin    { background:#3d3010; color:#f5c842; }
    body.dark .badge-user     { background:#0d2d35; color:#7ecfdf; }
    body.dark .badge-active   { background:#0d2d1a; color:#6fcf97; }
    body.dark .badge-inactive { background:#2d0d0d; color:#eb5757; }

    .btn-danger { background:#e05c38; color:#fff; border-color:#e05c38; }
    .btn-danger:hover { background:#b84020; }
    .btn-xs { padding:0.3rem 0.7rem; font-size:0.78rem; }

    /* Login screen */
    .login-screen { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:1rem; }

    /* Tab panels */
    .tab-panel { display:none; }
    .tab-panel.active { display:block; }

    /* Toast */
    .toast { position:fixed; bottom:1.5rem; right:1.5rem; background:var(--accent); color:#fff; padding:0.75rem 1.25rem; border-radius:12px; font-size:0.9rem; z-index:999; animation:fadeIn 0.3s ease; box-shadow:0 4px 20px rgba(0,0,0,0.2); }

    @media(max-width:640px) {
      .sidebar { display:none; }
      .admin-main { padding:1rem; }
      .form-grid { grid-template-columns:1fr; }
    }
  </style>
</head>
<body>

  <!-- Sliding theme toggle -->
  <button class="theme-toggle" id="darkToggle" aria-label="Toggle dark mode">
    <span class="t-sun">☀️</span>
    <span class="t-moon">🌙</span>
    <span class="t-knob"></span>
  </button>

  <!-- LOGIN SCREEN -->
  <div class="login-screen" id="loginScreen">
    <div class="card" style="max-width:400px">
      <div style="text-align:center;margin-bottom:1.5rem">
        <div class="home-logo" style="font-size:2rem">Neuro<span style="color:var(--text)">Zap</span></div>
        <p style="color:var(--text2);font-size:0.9rem;margin-top:0.25rem">Admin Panel</p>
      </div>
      <div class="form-group" style="margin-bottom:0.75rem">
        <label>Username</label>
        <input type="text" id="loginUser" placeholder="admin"/>
      </div>
      <div class="form-group" style="margin-bottom:1rem">
        <label>Password</label>
        <input type="password" id="loginPass" placeholder="••••••••" onkeydown="if(event.key==='Enter')doLogin()"/>
      </div>
      <button class="btn btn-primary btn-full" onclick="doLogin()">🔐 Login</button>
      <p id="loginErr" style="color:var(--accent);font-size:0.83rem;text-align:center;margin-top:0.75rem;display:none"></p>
    </div>
  </div>

  <!-- ADMIN LAYOUT -->
  <div class="admin-layout hidden" id="adminLayout">

    <!-- Sidebar -->
    <div class="sidebar">
      <div class="sidebar-logo">Neuro<span>Zap</span></div>
      <button class="nav-item active" onclick="showTab('dashboard',this)">📊 Dashboard</button>
      <button class="nav-item" onclick="showTab('questions',this)">❓ Questions</button>
      <button class="nav-item" onclick="showTab('users',this)">👥 Users</button>
      <button class="nav-item" onclick="showTab('leaderboard',this)">🏆 Leaderboard</button>
      <button class="nav-item" onclick="showTab('settings',this)">⚙️ Settings</button>
      <div class="sidebar-footer">
        Logged in as <strong id="adminName">admin</strong><br/>
        <a href="index.html" style="color:var(--accent);font-size:0.8rem">← Back to site</a><br/>
        <button onclick="doLogout()" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:0.8rem;padding:0;margin-top:0.3rem">Logout</button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="admin-main">
      <div class="admin-header">
        <div class="admin-title" id="tabTitle">Dashboard</div>
      </div>

      <!-- DASHBOARD TAB -->
      <div class="tab-panel active" id="tab-dashboard">
        <div class="stats-grid" id="statsGrid">
          <div class="stat-card"><div class="num">—</div><div class="lbl">Total Users</div></div>
          <div class="stat-card"><div class="num">—</div><div class="lbl">Quizzes Taken</div></div>
          <div class="stat-card"><div class="num">—</div><div class="lbl">Active Questions</div></div>
          <div class="stat-card"><div class="num">—</div><div class="lbl">Average IQ</div></div>
        </div>
        <p style="color:var(--text2);font-size:0.9rem">Welcome back! Use the sidebar to manage questions, users, and view results.</p>
      </div>

      <!-- QUESTIONS TAB -->
      <div class="tab-panel" id="tab-questions">
        <!-- Add Question Form -->
        <div class="form-card">
          <div class="form-title">➕ Add New Question</div>
          <div class="form-grid">
            <div class="form-group full">
              <label>Question Text</label>
              <textarea id="qQuestion" placeholder="Type your question here..."></textarea>
            </div>
            <div class="form-group">
              <label>Option A</label>
              <input id="qA" type="text" placeholder="Option A"/>
            </div>
            <div class="form-group">
              <label>Option B</label>
              <input id="qB" type="text" placeholder="Option B"/>
            </div>
            <div class="form-group">
              <label>Option C</label>
              <input id="qC" type="text" placeholder="Option C"/>
            </div>
            <div class="form-group">
              <label>Option D</label>
              <input id="qD" type="text" placeholder="Option D"/>
            </div>
            <div class="form-group">
              <label>Correct Answer</label>
              <select id="qAnswer">
                <option value="0">A</option>
                <option value="1">B</option>
                <option value="2">C</option>
                <option value="3">D</option>
              </select>
            </div>
            <div class="form-group">
              <label>Category</label>
              <select id="qCategory">
                <option value="pattern">Pattern Recognition</option>
                <option value="spatial">Spatial Reasoning</option>
                <option value="logic">Abstract Logic</option>
                <option value="memory">Working Memory</option>
                <option value="matrix">Matrix Reasoning</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
          <button class="btn btn-primary" style="margin-top:1rem" onclick="addQuestion()">➕ Add Question</button>
        </div>

        <!-- Questions Table -->
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Question</th><th>Category</th><th>Answer</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody id="questionsTable">
              <tr><td colspan="6" style="text-align:center;color:var(--text2);padding:2rem">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- USERS TAB -->
      <div class="tab-panel" id="tab-users">
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Quizzes</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody id="usersTable">
              <tr><td colspan="7" style="text-align:center;color:var(--text2);padding:2rem">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- LEADERBOARD TAB -->
      <div class="tab-panel" id="tab-leaderboard">
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Rank</th><th>Name</th><th>Score</th><th>IQ</th><th>Date</th></tr>
            </thead>
            <tbody id="lbTable">
              <tr><td colspan="5" style="text-align:center;color:var(--text2);padding:2rem">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SETTINGS TAB -->
      <div class="tab-panel" id="tab-settings">

        <!-- Change Password -->
        <div class="form-card" style="max-width:480px">
          <div class="form-title">🔐 Change Admin Password</div>
          <div class="form-group" style="margin-bottom:0.75rem">
            <label>Current Password</label>
            <input type="password" id="currentPass" placeholder="Enter current password"/>
          </div>
          <div class="form-group" style="margin-bottom:0.75rem">
            <label>New Password</label>
            <input type="password" id="newPass" placeholder="At least 6 characters"/>
          </div>
          <div class="form-group" style="margin-bottom:1rem">
            <label>Confirm New Password</label>
            <input type="password" id="confirmPass" placeholder="Repeat new password"/>
          </div>
          <button class="btn btn-primary" onclick="changePassword()">🔐 Update Password</button>
          <p id="passMsg" style="margin-top:0.75rem;font-size:0.85rem;display:none"></p>
        </div>

        <!-- Danger Zone -->
        <div class="form-card" style="max-width:480px;border-color:#e05c38">
          <div class="form-title" style="color:#e05c38">⚠️ Danger Zone</div>
          <p style="font-size:0.85rem;color:var(--text2);margin-bottom:1rem">
            Deleting all results will permanently remove every quiz score from the leaderboard. This cannot be undone!
          </p>
          <button class="btn btn-danger" onclick="clearAllResults()">🗑️ Clear All Results</button>
        </div>

      </div>



  <script src="script.js"></script>
  <script>
    // ── Init ──────────────────────────────────────────────────
    initDarkMode();

    const API  = '';   // same origin — empty string = relative URLs
    let token  = localStorage.getItem('adminToken');
    let adminUsername = '';

    if (token) tryAutoLogin();

    // ── Login ─────────────────────────────────────────────────
    async function doLogin() {
      const username = document.getElementById('loginUser').value.trim();
      const password = document.getElementById('loginPass').value;
      const errEl    = document.getElementById('loginErr');
      errEl.style.display = 'none';

      try {
        const res  = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) { errEl.textContent = data.error; errEl.style.display='block'; return; }
        if (data.role !== 'admin') { errEl.textContent = 'Admin access only.'; errEl.style.display='block'; return; }

        token = data.token;
        adminUsername = data.username;
        localStorage.setItem('adminToken', token);
        showAdmin();
      } catch {
        errEl.textContent = 'Cannot connect to server.';
        errEl.style.display = 'block';
      }
    }

    async function tryAutoLogin() {
      try {
        const res  = await fetch('/api/me', { headers:{ Authorization:'Bearer '+token } });
        const data = await res.json();
        if (res.ok && data.role === 'admin') {
          adminUsername = data.username;
          showAdmin();
        } else {
          localStorage.removeItem('adminToken');
          token = null;
        }
      } catch { /* stay on login */ }
    }

    function showAdmin() {
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('adminLayout').classList.remove('hidden');
      document.getElementById('adminName').textContent = adminUsername;
      loadDashboard();
    }

    function doLogout() {
      localStorage.removeItem('adminToken');
      token = null;
      document.getElementById('loginScreen').classList.remove('hidden');
      document.getElementById('adminLayout').classList.add('hidden');
    }

    // ── Tab navigation ────────────────────────────────────────
    function showTab(name, el) {
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.getElementById('tab-' + name).classList.add('active');
      if (el) el.classList.add('active');
      const titles = { dashboard:'Dashboard', questions:'Questions', users:'Users', leaderboard:'Leaderboard', settings:'⚙️ Settings' };
      document.getElementById('tabTitle').textContent = titles[name] || name;

      if (name === 'dashboard')   loadDashboard();
      if (name === 'questions')   loadQuestions();
      if (name === 'users')       loadUsers();
      if (name === 'leaderboard') loadLeaderboard();
    }

    // ── Dashboard ─────────────────────────────────────────────
    async function loadDashboard() {
      try {
        const res  = await authFetch('/api/admin/stats');
        const data = await res.json();
        const grid = document.getElementById('statsGrid');
        const nums = [data.totalUsers, data.totalQuizzes, data.totalQuestions, data.avgIQ];
        const lbls = ['Total Users','Quizzes Taken','Active Questions','Average IQ'];
        grid.innerHTML = nums.map((n,i)=>`
          <div class="stat-card">
            <div class="num">${n}</div>
            <div class="lbl">${lbls[i]}</div>
          </div>`).join('');
      } catch {}
    }

    // ── Questions ─────────────────────────────────────────────
    async function loadQuestions() {
      const tbody = document.getElementById('questionsTable');
      try {
        const res  = await authFetch('/api/admin/questions');
        const rows = await res.json();
        const letters = ['A','B','C','D'];
        if (!rows.length) { tbody.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--text2);padding:2rem">No questions yet. Add one above!</td></tr>'; return; }
        tbody.innerHTML = rows.map(q => `
          <tr>
            <td>#${q.id}</td>
            <td style="max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${escHtml(q.question)}">${escHtml(q.question.substring(0,60))}…</td>
            <td><span class="badge badge-user">${q.category}</span></td>
            <td><strong>${letters[q.answer]}</strong></td>
            <td><span class="badge ${q.active?'badge-active':'badge-inactive'}">${q.active?'Active':'Off'}</span></td>
            <td style="white-space:nowrap">
              <button class="btn btn-ghost btn-xs" onclick="toggleQuestion(${q.id},${q.active})">${q.active?'Disable':'Enable'}</button>
              <button class="btn btn-danger btn-xs" onclick="deleteQuestion(${q.id})">Delete</button>
            </td>
          </tr>`).join('');
      } catch { tbody.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--accent)">Error loading questions</td></tr>'; }
    }

    async function addQuestion() {
      const body = {
        question : document.getElementById('qQuestion').value.trim(),
        option_a : document.getElementById('qA').value.trim(),
        option_b : document.getElementById('qB').value.trim(),
        option_c : document.getElementById('qC').value.trim(),
        option_d : document.getElementById('qD').value.trim(),
        answer   : parseInt(document.getElementById('qAnswer').value),
        category : document.getElementById('qCategory').value
      };
      if (!body.question || !body.option_a || !body.option_b || !body.option_c || !body.option_d)
        return showToast('⚠️ Fill in all fields!');

      const res = await authFetch('/api/admin/questions', 'POST', body);
      if (res.ok) {
        showToast('✅ Question added!');
        ['qQuestion','qA','qB','qC','qD'].forEach(id => document.getElementById(id).value='');
        loadQuestions();
      }
    }

    async function toggleQuestion(id, active) {
      await authFetch('/api/admin/questions/'+id, 'PUT', { active: active?0:1 });
      loadQuestions();
    }

    async function deleteQuestion(id) {
      if (!confirm('Delete this question?')) return;
      await authFetch('/api/admin/questions/'+id, 'DELETE');
      showToast('🗑️ Question deleted');
      loadQuestions();
    }

    // ── Users ─────────────────────────────────────────────────
    async function loadUsers() {
      const tbody = document.getElementById('usersTable');
      try {
        const res  = await authFetch('/api/admin/users');
        const rows = await res.json();
        tbody.innerHTML = rows.map(u => `
          <tr>
            <td>#${u.id}</td>
            <td><strong>${escHtml(u.username)}</strong></td>
            <td>${escHtml(u.email)}</td>
            <td><span class="badge ${u.role==='admin'?'badge-admin':'badge-user'}">${u.role}</span></td>
            <td>${u.quiz_count}</td>
            <td>${u.created_at.split('T')[0]}</td>
            <td>${u.role!=='admin'?`<button class="btn btn-danger btn-xs" onclick="deleteUser(${u.id})">Delete</button>`:'—'}</td>
          </tr>`).join('');
      } catch { tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--accent)">Error</td></tr>'; }
    }

    async function deleteUser(id) {
      if (!confirm('Delete this user and all their results?')) return;
      await authFetch('/api/admin/users/'+id, 'DELETE');
      showToast('🗑️ User deleted');
      loadUsers();
    }

    // ── Leaderboard ───────────────────────────────────────────
    async function loadLeaderboard() {
      const tbody = document.getElementById('lbTable');
      try {
        const res  = await fetch('/api/leaderboard');
        const rows = await res.json();
        tbody.innerHTML = rows.map((r,i) => `
          <tr>
            <td>${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</td>
            <td>${escHtml(r.name)}</td>
            <td><strong>${r.score}/${r.total}</strong></td>
            <td style="color:var(--accent2);font-weight:700">${r.iq}</td>
            <td>${r.taken_at.split('T')[0]}</td>
          </tr>`).join('');
      } catch {}
    }

    // ── Settings — Change Password ────────────────────────────
    async function changePassword() {
      const current  = document.getElementById('currentPass').value;
      const newPass  = document.getElementById('newPass').value;
      const confirm  = document.getElementById('confirmPass').value;
      const msg      = document.getElementById('passMsg');

      msg.style.display = 'none';

      if (!current || !newPass || !confirm) {
        msg.style.color = 'var(--accent)';
        msg.textContent = '⚠️ Please fill in all fields.';
        msg.style.display = 'block';
        return;
      }
      if (newPass.length < 6) {
        msg.style.color = 'var(--accent)';
        msg.textContent = '⚠️ New password must be at least 6 characters.';
        msg.style.display = 'block';
        return;
      }
      if (newPass !== confirm) {
        msg.style.color = 'var(--accent)';
        msg.textContent = '⚠️ New passwords do not match!';
        msg.style.display = 'block';
        return;
      }

      try {
        const res  = await authFetch('/api/admin/change-password', 'POST', {
          currentPassword: current,
          newPassword: newPass
        });
        const data = await res.json();
        if (!res.ok) {
          msg.style.color = 'var(--accent)';
          msg.textContent = '❌ ' + data.error;
        } else {
          msg.style.color = 'var(--correct, #2d7a4f)';
          msg.textContent = '✅ Password changed successfully!';
          document.getElementById('currentPass').value = '';
          document.getElementById('newPass').value     = '';
          document.getElementById('confirmPass').value = '';
        }
        msg.style.display = 'block';
      } catch {
        msg.style.color   = 'var(--accent)';
        msg.textContent   = '❌ Could not connect to server.';
        msg.style.display = 'block';
      }
    }

    // ── Settings — Clear All Results ──────────────────────────
    async function clearAllResults() {
      if (!confirm('Are you sure? This will DELETE all quiz results from the leaderboard forever!')) return;
      try {
        const res = await authFetch('/api/admin/clear-results', 'DELETE');
        if (res.ok) showToast('🗑️ All results cleared!');
        else        showToast('❌ Failed to clear results');
      } catch {
        showToast('❌ Could not connect to server');
      }
    }


    function authFetch(url, method='GET', body=null) {
      const opts = {
        method,
        headers: { 'Content-Type':'application/json', Authorization:'Bearer '+token }
      };
      if (body) opts.body = JSON.stringify(body);
      return fetch(url, opts);
    }

    function escHtml(str='') {
      return String(str).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    function showToast(msg) {
      const t = document.createElement('div');
      t.className = 'toast';
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3000);
    }
  </script>
</body>
</html>
