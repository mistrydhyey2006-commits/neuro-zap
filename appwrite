// ============================================================
//  appwrite.js  —  Neuro Zap Appwrite Backend Replacement
//  Drop this file in your project root and include it in all HTML files
//  BEFORE any page-specific scripts.
// ============================================================

const APPWRITE_ENDPOINT   = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '6a06b743003301b7c8fa';
const DATABASE_ID         = '6a06bb060001440a2a41';
const BUCKET_ID           = 'images'; // your storage bucket ID from Appwrite console

// Collection / Table IDs — these match the table names you created
const COL_USERS           = 'users';
const COL_QUESTIONS       = 'questions';
const COL_RESULTS         = 'results';
const COL_DAILY           = 'daily_questions';

// ── Low-level fetch wrapper ───────────────────────────────────
async function aw(path, method = 'GET', body = null, extraHeaders = {}) {
  const session = _getSession();
  const headers = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': APPWRITE_PROJECT_ID,
    ...extraHeaders
  };
  if (session) headers['X-Appwrite-Session'] = session;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(APPWRITE_ENDPOINT + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, message: data.message || 'Request failed', data };
  return data;
}

// Multipart fetch for file uploads
async function awUpload(bucketId, file) {
  const session = _getSession();
  const headers = { 'X-Appwrite-Project': APPWRITE_PROJECT_ID };
  if (session) headers['X-Appwrite-Session'] = session;

  const fd = new FormData();
  fd.append('fileId', 'unique()');
  fd.append('file', file);

  const res = await fetch(`${APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files`, {
    method: 'POST', headers, body: fd
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.message };
  return data;
}

// ── Session helpers ───────────────────────────────────────────
function _getSession() { return localStorage.getItem('aw_session'); }
function _setSession(s) { localStorage.setItem('aw_session', s); }
function _clearSession() {
  localStorage.removeItem('aw_session');
  localStorage.removeItem('nzToken');
  localStorage.removeItem('nzUsername');
  localStorage.removeItem('nzRole');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
}

// ── Document query helper ─────────────────────────────────────
function _query(filters = [], limit = 100, offset = 0) {
  const params = new URLSearchParams();
  filters.forEach(f => params.append('queries[]', f));
  params.append('queries[]', `limit(${limit})`);
  if (offset) params.append('queries[]', `offset(${offset})`);
  return params.toString();
}

// ── Generate unique ID ────────────────────────────────────────
function _uid() { return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9); }

// ── Get file preview URL ──────────────────────────────────────
function getFileUrl(fileId) {
  return `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
}

// ============================================================
//  AUTH
// ============================================================

const NZAuth = {

  async register(username, email, password) {
    // Validate
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const USER_RE  = /^[a-zA-Z0-9_]{3,20}$/;
    if (!EMAIL_RE.test(email))  throw new Error('Please enter a valid email address');
    if (!USER_RE.test(username)) throw new Error('Username must be 3–20 characters, letters and numbers only');
    if (password.length < 6)    throw new Error('Password must be at least 6 characters');

    // Create Appwrite account
    const account = await aw('/account', 'POST', {
      userId: 'unique()',
      email: email.toLowerCase().trim(),
      password,
      name: username.trim()
    });

    // Create session
    const session = await aw('/account/sessions/email', 'POST', {
      email: email.toLowerCase().trim(),
      password
    });
    _setSession(session.secret || session.$id);

    // Store user profile in users table
    await aw(`/databases/${DATABASE_ID}/collections/${COL_USERS}/documents`, 'POST', {
      documentId: 'unique()',
      data: {
        username: username.trim(),
        email: email.toLowerCase().trim(),
        role: 'user',
        appwrite_id: account.$id
      }
    });

    localStorage.setItem('nzUsername', username.trim());
    localStorage.setItem('nzRole', 'user');
    return { username: username.trim(), role: 'user' };
  },

  async login(usernameOrEmail, password) {
    // Find user in our users table to get email
    let email = usernameOrEmail.trim();

    if (!email.includes('@')) {
      // It's a username — look up the email
      const docs = await aw(
        `/databases/${DATABASE_ID}/collections/${COL_USERS}/documents?${_query([`equal("username","${email}")`])}`,
        'GET'
      );
      if (!docs.documents || !docs.documents.length)
        throw new Error('Invalid username or password');
      email = docs.documents[0].email;
    }

    const session = await aw('/account/sessions/email', 'POST', { email, password });
    _setSession(session.secret || session.$id);

    // Get user profile
    const profile = await NZAuth.getProfile();
    localStorage.setItem('nzUsername', profile.username);
    localStorage.setItem('nzRole', profile.role);
    return profile;
  },

  async logout() {
    try { await aw('/account/sessions/current', 'DELETE'); } catch {}
    _clearSession();
  },

  async getProfile() {
    const account = await aw('/account', 'GET');
    // Look up our users table for role
    const docs = await aw(
      `/databases/${DATABASE_ID}/collections/${COL_USERS}/documents?${_query([`equal("appwrite_id","${account.$id}")`])}`,
      'GET'
    );
    const profile = docs.documents && docs.documents[0];
    return {
      id: account.$id,
      username: profile ? profile.username : account.name,
      email: account.email,
      role: profile ? profile.role : 'user',
      created_at: account.$createdAt
    };
  },

  async isLoggedIn() {
    try {
      await aw('/account', 'GET');
      return true;
    } catch { return false; }
  },

  async isAdmin() {
    try {
      const profile = await NZAuth.getProfile();
      return profile.role === 'admin';
    } catch { return false; }
  }
};

// ============================================================
//  QUESTIONS
// ============================================================

const NZQuestions = {

  async getAll(adminMode = false) {
    const queries = adminMode
      ? []
      : [`equal("active", true)`];
    const docs = await aw(
      `/databases/${DATABASE_ID}/collections/${COL_QUESTIONS}/documents?${_query(queries, 200)}`,
      'GET'
    );
    return docs.documents || [];
  },

  async getRandom20() {
    const all = await NZQuestions.getAll(false);
    const shuffled = all.sort(() => Math.random() - 0.5).slice(0, 20);
    return shuffled.map(q => ({
      id: q.$id,
      q: q.question,
      options: [q.option_a, q.option_b, q.option_c, q.option_d],
      answer: q.answer,
      category: q.category,
      image_url: q.image_url || null
    }));
  },

  async create(data) {
    return await aw(`/databases/${DATABASE_ID}/collections/${COL_QUESTIONS}/documents`, 'POST', {
      documentId: 'unique()',
      data: {
        question:  data.question,
        option_a:  data.option_a,
        option_b:  data.option_b,
        option_c:  data.option_c,
        option_d:  data.option_d,
        answer:    parseInt(data.answer),
        category:  data.category || 'general',
        image_url: data.image_url || null,
        active:    true
      }
    });
  },

  async update(docId, data) {
    return await aw(`/databases/${DATABASE_ID}/collections/${COL_QUESTIONS}/documents/${docId}`, 'PATCH', {
      data
    });
  },

  async delete(docId) {
    return await aw(`/databases/${DATABASE_ID}/collections/${COL_QUESTIONS}/documents/${docId}`, 'DELETE');
  },

  async uploadImage(file) {
    const uploaded = await awUpload(BUCKET_ID, file);
    return getFileUrl(uploaded.$id);
  }
};

// ============================================================
//  RESULTS
// ============================================================

const NZResults = {

  async submit({ score, total, iq, is_daily, guest_name }) {
    let userId = null;
    let guestName = guest_name || null;

    try {
      const profile = await NZAuth.getProfile();
      userId = profile.id;
      guestName = null;
    } catch { /* guest */ }

    await aw(`/databases/${DATABASE_ID}/collections/${COL_RESULTS}/documents`, 'POST', {
      documentId: 'unique()',
      data: {
        user_id:    userId,
        guest_name: guestName,
        score:      parseInt(score),
        total:      parseInt(total) || 20,
        iq:         parseInt(iq),
        is_daily:   !!is_daily
      }
    });
  },

  async getLeaderboard(dailyOnly = false) {
    const queries = [];
    if (dailyOnly) {
      const today = new Date().toISOString().split('T')[0];
      queries.push(`equal("is_daily", true)`);
      queries.push(`greaterThanEqual("$createdAt", "${today}T00:00:00.000+00:00")`);
    }
    queries.push(`orderDesc("score")`);
    queries.push(`orderDesc("iq")`);

    const docs = await aw(
      `/databases/${DATABASE_ID}/collections/${COL_RESULTS}/documents?${_query(queries, 50)}`,
      'GET'
    );

    // Enrich with username — get user docs
    const userIds = [...new Set(docs.documents.filter(r => r.user_id).map(r => r.user_id))];
    let userMap = {};
    if (userIds.length) {
      const userDocs = await aw(
        `/databases/${DATABASE_ID}/collections/${COL_USERS}/documents?${_query([`equal("appwrite_id", [${userIds.map(id => `"${id}"`).join(',')}])`], 100)}`,
        'GET'
      ).catch(() => ({ documents: [] }));
      userDocs.documents.forEach(u => { userMap[u.appwrite_id] = u.username; });
    }

    return docs.documents.map(r => ({
      name: r.user_id ? (userMap[r.user_id] || 'User') : (r.guest_name || 'Anonymous'),
      score: r.score,
      total: r.total,
      iq: r.iq,
      taken_at: r.$createdAt,
      is_daily: r.is_daily
    }));
  },

  async clearAll() {
    const docs = await aw(
      `/databases/${DATABASE_ID}/collections/${COL_RESULTS}/documents?${_query([], 100)}`,
      'GET'
    );
    await Promise.all(
      docs.documents.map(d =>
        aw(`/databases/${DATABASE_ID}/collections/${COL_RESULTS}/documents/${d.$id}`, 'DELETE')
      )
    );
  }
};

// ============================================================
//  DAILY CHALLENGE
// ============================================================

const NZDaily = {

  async getToday() {
    const today = new Date().toISOString().split('T')[0];

    // Check for custom question today
    const custom = await aw(
      `/databases/${DATABASE_ID}/collections/${COL_DAILY}/documents?${_query([`equal("date","${today}")`], 1)}`,
      'GET'
    ).catch(() => ({ documents: [] }));

    if (custom.documents && custom.documents.length) {
      const q = custom.documents[0];
      return {
        question: q.question,
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
        answer: q.answer,
        date: today,
        is_custom: true
      };
    }

    // Fallback: pick from questions bank
    const all = await NZQuestions.getAll(false).catch(() => []);
    if (!all.length) return {
      question: 'What number comes next: 2, 4, 8, 16, ?',
      options: ['32','24','18','20'],
      answer: 0,
      date: today,
      is_custom: false
    };
    const q = all[new Date(today).getDate() % all.length];
    return {
      question: q.question,
      options: [q.option_a, q.option_b, q.option_c, q.option_d],
      answer: q.answer,
      date: today,
      is_custom: false
    };
  },

  async getAll() {
    const docs = await aw(
      `/databases/${DATABASE_ID}/collections/${COL_DAILY}/documents?${_query([], 100)}`,
      'GET'
    );
    return docs.documents || [];
  },

  async create(data) {
    const today = new Date().toISOString().split('T')[0];
    // Delete existing for this date first (upsert behaviour)
    const existing = await aw(
      `/databases/${DATABASE_ID}/collections/${COL_DAILY}/documents?${_query([`equal("date","${data.date || today}")`], 1)}`,
      'GET'
    ).catch(() => ({ documents: [] }));
    if (existing.documents && existing.documents.length) {
      await aw(`/databases/${DATABASE_ID}/collections/${COL_DAILY}/documents/${existing.documents[0].$id}`, 'DELETE');
    }

    return await aw(`/databases/${DATABASE_ID}/collections/${COL_DAILY}/documents`, 'POST', {
      documentId: 'unique()',
      data: {
        date:     data.date || today,
        question: data.question,
        option_a: data.option_a,
        option_b: data.option_b,
        option_c: data.option_c,
        option_d: data.option_d,
        answer:   parseInt(data.answer) || 0
      }
    });
  },

  async delete(docId) {
    return await aw(`/databases/${DATABASE_ID}/collections/${COL_DAILY}/documents/${docId}`, 'DELETE');
  }
};

// ============================================================
//  ADMIN — Users & Stats
// ============================================================

const NZAdmin = {

  async getUsers() {
    const docs = await aw(
      `/databases/${DATABASE_ID}/collections/${COL_USERS}/documents?${_query([], 100)}`,
      'GET'
    );
    // Get quiz counts per user
    const results = await aw(
      `/databases/${DATABASE_ID}/collections/${COL_RESULTS}/documents?${_query([], 200)}`,
      'GET'
    ).catch(() => ({ documents: [] }));

    return docs.documents.map(u => {
      const quizCount = results.documents.filter(r => r.user_id === u.appwrite_id).length;
      return {
        id: u.$id,
        appwrite_id: u.appwrite_id,
        username: u.username,
        email: u.email,
        role: u.role,
        quiz_count: quizCount,
        created_at: u.$createdAt
      };
    });
  },

  async deleteUser(docId) {
    return await aw(`/databases/${DATABASE_ID}/collections/${COL_USERS}/documents/${docId}`, 'DELETE');
  },

  async getStats() {
    const [userDocs, resultDocs, questionDocs] = await Promise.all([
      aw(`/databases/${DATABASE_ID}/collections/${COL_USERS}/documents?${_query([`equal("role","user")`], 1)}`, 'GET').catch(()=>({total:0})),
      aw(`/databases/${DATABASE_ID}/collections/${COL_RESULTS}/documents?${_query([], 200)}`, 'GET').catch(()=>({documents:[],total:0})),
      aw(`/databases/${DATABASE_ID}/collections/${COL_QUESTIONS}/documents?${_query([`equal("active",true)`], 1)}`, 'GET').catch(()=>({total:0}))
    ]);

    const results = resultDocs.documents || [];
    const avgIq = results.length
      ? Math.round(results.reduce((s, r) => s + (r.iq || 0), 0) / results.length)
      : 0;

    return {
      users:     userDocs.total     || 0,
      results:   resultDocs.total   || 0,
      questions: questionDocs.total || 0,
      avg_iq:    avgIq
    };
  },

  async changePassword(newPassword) {
    // Appwrite account password update
    return await aw('/account/password', 'PATCH', { password: newPassword });
  }
};

// ============================================================
//  SEED: Run once to add default admin and questions
//  Call NZSeed.run() from browser console on first deploy
// ============================================================

const NZSeed = {

  async createAdmin(email, password) {
    // Create account
    const account = await aw('/account', 'POST', {
      userId: 'unique()',
      email,
      password,
      name: 'admin'
    });

    // Create session to insert into DB
    const session = await aw('/account/sessions/email', 'POST', { email, password });
    _setSession(session.secret || session.$id);

    // Insert into users table with admin role
    await aw(`/databases/${DATABASE_ID}/collections/${COL_USERS}/documents`, 'POST', {
      documentId: 'unique()',
      data: {
        username: 'admin',
        email: email,
        role: 'admin',
        appwrite_id: account.$id
      }
    });

    console.log('✅ Admin created! Email:', email);
    return account;
  },

  async seedQuestions() {
    const existing = await aw(
      `/databases/${DATABASE_ID}/collections/${COL_QUESTIONS}/documents?${_query([], 1)}`,
      'GET'
    );
    if (existing.total > 0) { console.log('Questions already seeded.'); return; }

    const questions = [
      ['🔢 Find the next number:\n\n  3,  6,  11,  18,  27,  ?\n\n(Differences increase by 2 each step)', '36','37','38','39', 1, 'pattern'],
      ['🔢 Find the next number:\n\n  2,  3,  5,  9,  17,  33,  ?\n\n(Each term = previous × 2 − 1)', '60','63','65','67', 2, 'pattern'],
      ['🔢 Find the missing number:\n\n  1,  4,  9,  16,  25,  ?,  49\n\n(Perfect squares)', '35','36','37','38', 1, 'pattern'],
      ['🔢 Find the next number:\n\n  100,  91,  83,  76,  70,  ?\n\n(Differences decrease by 1)', '63','64','65','66', 2, 'pattern'],
      ['🔢 Find the missing value:\n\n  1,  1,  2,  6,  24,  120,  ?\n\n(Factorials)', '620','700','720','740', 2, 'pattern'],
      ['🔢 Find the next number:\n\n  2,  5,  11,  23,  47,  ?\n\n(Each term = previous × 2 + 1)', '93','95','96','97', 1, 'pattern'],
      ['🔢 Find the next number:\n\n  0,  1,  3,  6,  10,  15,  ?\n\n(Triangular numbers)', '19','20','21','22', 2, 'pattern'],
      ['🔢 Find the next number:\n\n  3,  7,  15,  31,  63,  ?\n\n(Each term = previous × 2 + 1)', '125','126','127','128', 2, 'pattern'],
      ['🔷 Number Grid:\n\n  2   4   8\n  3   6   12\n  4   8   ?\n\n(Col1 × 4 = Col3)', '12','14','16','18', 2, 'matrix'],
      ['🔷 Number Grid:\n\n  16   4   2\n  25   5   2.5\n  36   6   ?\n\n(Col2=√Col1, Col3=Col2÷2)', '2','3','4','5', 1, 'matrix'],
      ['🔷 Number Grid:\n\n  1   2   3\n  4   8   12\n  7   14  ?\n\n(Col3 = Col1 × 3)', '18','20','21','24', 2, 'matrix'],
      ['🔷 Number Grid:\n\n  5   3   8\n  7   2   9\n  6   4   ?\n\n(Col1 + Col2 = Col3)', '8','9','10','11', 2, 'matrix'],
      ['🔷 Number Grid:\n\n  4   16   64\n  3   9    27\n  2   4    ?\n\n(Col1², Col1³)', '6','7','8','9', 2, 'matrix'],
      ['🧠 All doctors are educated. Some educated people are rich. No rich person is unhappy.\n\nWhich MUST be true?', 'All doctors are rich','Some educated people are not rich','All rich people are educated','No doctor is unhappy', 1, 'logic'],
      ['🧠 If it rains, the match is cancelled. The match was NOT cancelled.\n\nWhat can we conclude?', 'It rained','It did not rain','Match played inside','It might have rained', 1, 'logic'],
      ['🧠 All squares are rectangles. All rectangles are parallelograms. Shape X is a square.\n\nWhich MUST be true?', 'X is a parallelogram','X is not a rectangle','X has unequal sides','X is a rhombus', 0, 'logic'],
      ['🧠 No cats are dogs. Some animals are cats. All dogs are animals.\n\nWhich MUST be true?', 'Some animals are not dogs','All cats are animals','No animals are dogs','Some cats are dogs', 1, 'logic'],
      ['🧠 If C=3, O=15, L=12, D=4 then COLD = ?\n\n(Sum of letter positions)', '34','35','36','37', 0, 'logic'],
      ['🧠 If ARMY = 46, then NAVY = ?\n\n(Sum of letter positions: A=1, B=2 ... Z=26)', '54','55','56','57', 2, 'logic'],
      ['🔷 A cube has all 6 faces painted red. Cut into 27 equal smaller cubes.\nHow many small cubes have NO red face?', '0','1','2','3', 1, 'spatial'],
      ['🔷 A solid has 8 vertices and 12 edges. How many faces?\n\n(Euler: F + V − E = 2)', '4','5','6','8', 2, 'spatial'],
      ['🔷 A clock shows 3:15. What is the angle between hour and minute hands?', '0°','7.5°','15°','22.5°', 1, 'spatial'],
      ['🔷 A cube painted on all sides, cut into 64 smaller cubes. How many have paint on exactly 2 faces?', '16','24','32','48', 1, 'spatial'],
      ['🔷 A rectangular box is 4cm × 3cm × 2cm. How many unit cubes fit inside?', '18','20','24','28', 2, 'spatial'],
      ['🧠 Sequence: 7, 3, 9, 1, 5, 8, 2\n\nSum of 2nd, 4th, and 6th numbers?', '10','11','12','13', 2, 'memory'],
      ['🧠 List: 15, 8, 23, 4, 16, 42, 7\n\nDifference between largest and smallest?', '35','37','38','39', 2, 'memory'],
      ['🧠 Red=3, Blue=7, Green=5, Yellow=2\n\n(Red × Green) + Blue − Yellow = ?', '18','19','20','21', 2, 'memory'],
      ['🧠 A train picks up 12 passengers at each of first 3 stops, drops 8 at each of next 3. Starts empty.\n\nPassengers after 6 stops?', '10','11','12','13', 2, 'memory'],
      ['🧩 Moon : Earth = Earth : ?', 'Mars','Galaxy','Sun','Universe', 2, 'logic'],
      ['🧩 36 : 6 = 81 : ?\n\n(perfect square to square root)', '7','8','9','10', 2, 'logic'],
      ['🧩 Optimist : Pessimist = Diligent : ?', 'Lazy','Slow','Tired','Careful', 0, 'logic'],
      ['🧩 Chapter : Book = Scene : ?', 'Story','Film','Act','Script', 1, 'logic'],
      ['🧩 Which does NOT belong?\n\n  17, 23, 31, 37, 42, 47\n\n(All others are prime)', '31','37','42','47', 2, 'logic'],
      ['🧩 Which does NOT belong?\n\n  Cube, Sphere, Cylinder, Triangle, Cone\n\n(All others are 3D)', 'Cube','Sphere','Cylinder','Triangle', 3, 'logic'],
      ['🧩 Which does NOT belong?\n\n  1, 4, 9, 15, 25, 36\n\n(All others are perfect squares)', '9','15','25','36', 1, 'logic'],
      ['🧩 Which does NOT belong?\n\n  Violin, Guitar, Flute, Cello, Harp\n\n(All others are string instruments)', 'Violin','Guitar','Flute','Cello', 2, 'logic'],
      ['🧠 A snail climbs 3m up during the day, slides 1m at night. Wall is 12m. How many days to reach top?', '5','6','7','8', 1, 'logic'],
      ['🧠 In a race, you overtake the person in 2nd place. What position are you?', '1st','2nd','3rd','4th', 1, 'logic'],
      ['🧠 How many times does digit 9 appear when writing integers from 1 to 100?', '10','11','20','21', 2, 'logic'],
      ['🧠 A bat and ball cost ₹110. Bat costs ₹100 more than ball. How much is the ball?', '₹5','₹10','₹15','₹20', 0, 'logic'],
    ];

    for (const [question, a, b, c, d, answer, category] of questions) {
      await NZQuestions.create({ question, option_a: a, option_b: b, option_c: c, option_d: d, answer, category });
    }
    console.log('✅ 40 questions seeded!');
  }
};

// ── Expose globally ───────────────────────────────────────────
window.NZAuth      = NZAuth;
window.NZQuestions = NZQuestions;
window.NZResults   = NZResults;
window.NZDaily     = NZDaily;
window.NZAdmin     = NZAdmin;
window.NZSeed      = NZSeed;
window.getFileUrl  = getFileUrl;
