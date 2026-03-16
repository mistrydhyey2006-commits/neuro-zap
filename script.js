// ============================================================
//  IQ QUIZ — script.js
// ============================================================

// ---- Dark Mode (shared) ----
function initDarkMode() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) document.body.classList.add('dark');
  const toggle = document.getElementById('darkToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const nowDark = document.body.classList.toggle('dark');
      localStorage.setItem('darkMode', nowDark);
    });
  }
}

// ---- Question Bank (fallback only — used if API is unavailable) ----
const ALL_QUESTIONS = [
  {
    q: "🔢 Number Matrix — What number replaces the question mark?\n\n  2   4   8\n  3   9  27\n  4  16   ?\n\n(Each row follows the same rule)",
    options: ["64", "48", "32", "256"],
    answer: 0,
    explanation: "Each row: n, n², n³ → 4³ = 64"
  },
  {
    q: "🔷 Pattern Series — Which shape comes next in the sequence?\n\n  △  △△  △△△  △△△△  ?\n\nEach step adds one triangle. The next figure also rotates 90° clockwise.",
    options: ["5 triangles rotated 90°", "4 triangles rotated 180°", "5 triangles, no rotation", "6 triangles rotated 90°"],
    answer: 0,
    explanation: "Pattern adds 1 triangle and rotates 90° each step."
  },
  {
    q: "🧠 Abstract Logic — Complete the matrix:\n\n  ■ □ ■       □ ■ □       ■ □ ■\n  □ ■ □   →   ■ □ ■   →   □ ■ □\n  ■ □ ■       □ ■ □       ?\n\nWhat is the bottom-right cell of the 3rd matrix?",
    options: ["■ (filled)", "□ (empty)", "Half filled", "Cannot determine"],
    answer: 0,
    explanation: "The pattern alternates: each matrix inverts the previous. 3rd matrix = same as 1st → bottom-right is ■."
  },
  {
    q: "🔢 Working Memory — Study this sequence for 5 seconds, then identify the missing number:\n\n  7  →  14  →  11  →  22  →  19  →  38  →  ?\n\n(Apply the rule: ×2 then −3, repeating)",
    options: ["35", "41", "76", "32"],
    answer: 0,
    explanation: "38 − 3 = 35. The pattern alternates: ×2, then −3."
  },
  {
    q: "🔷 Spatial Reasoning — A paper square is folded in half diagonally, then a hole is punched through the centre. When unfolded, how many holes appear?",
    options: ["1", "2", "4", "3"],
    answer: 1,
    explanation: "Folding diagonally once and punching gives 2 holes when unfolded."
  },
  {
    q: "🧩 Odd One Out — Which figure does NOT belong?\n\nA) A shape with all sides equal and all angles equal\nB) A shape with all sides equal but angles differ\nC) A shape with all angles equal but sides differ\nD) A shape with 4 lines of symmetry",
    options: ["A", "B", "C", "D"],
    answer: 2,
    explanation: "Option C — equal angles but unequal sides — is the odd one out because it can't be a regular polygon."
  },
  {
    q: "🔢 Number Series — Find the next number:\n\n  1,  1,  2,  3,  5,  8,  13,  21,  ?\n",
    options: ["32", "34", "33", "36"],
    answer: 1,
    explanation: "Fibonacci sequence: each number = sum of two before it. 13+21 = 34."
  },
  {
    q: "🧠 Logical Deduction:\n\nAll Zyrens are Blipps.\nSome Blipps are Quorns.\nNo Quorns are Zyrens.\n\nWhich conclusion MUST be true?",
    options: [
      "Some Zyrens are Quorns",
      "No Zyrens are Quorns",
      "All Quorns are Blipps",
      "Some Blipps are not Zyrens"
    ],
    answer: 3,
    explanation: "Since some Blipps are Quorns, and no Quorns are Zyrens, those Quorn-Blipps are not Zyrens → some Blipps are not Zyrens."
  },
  {
    q: "🔷 Rotation — A cube is shown with ● on top, ★ on front, and ▲ on right. It is rotated 90° to the right. What is now on top?",
    options: ["★", "▲", "●", "The bottom face"],
    answer: 0,
    explanation: "Rotating the cube 90° to the right brings the front face (★) to the top."
  },
  {
    q: "🔢 Missing Number in Grid:\n\n  6   11   8\n  9   15  12\n  7    ?  10\n\n(Find the pattern across each row)",
    options: ["11", "12", "13", "10"],
    answer: 1,
    explanation: "Each row middle = left + right − something. Pattern: middle = left + right − 5. 7+10−5 = 12."
  },
  {
    q: "🧩 Visual Pattern — A sequence of letters transforms:\n\n  A → D → G → J → ?\n\n(Each letter skips 2 letters in the alphabet)",
    options: ["L", "M", "K", "N"],
    answer: 1,
    explanation: "A(1) → D(4) → G(7) → J(10) → M(13). Each step +3 positions."
  },
  {
    q: "🧠 Spatial Folding — Which 3D shape is formed when this net is folded?\n\nNet: 1 square centre, 4 triangles on each side.",
    options: ["Cube", "Square Pyramid", "Tetrahedron", "Triangular Prism"],
    answer: 1,
    explanation: "A square with 4 triangles attached to each side folds into a Square Pyramid."
  },
  {
    q: "🔢 Working Memory — What is the sum of ONLY the odd numbers in this list?\n\n  12,  7,  3,  18,  5,  22,  9,  14",
    options: ["19", "24", "29", "21"],
    answer: 1,
    explanation: "Odd numbers: 7, 3, 5, 9 → 7+3+5+9 = 24."
  },
  {
    q: "🔷 Matrix Reasoning — 3×3 grid:\n\nRow 1: ○ ○○ ○○○\nRow 2: □ □□ □□□\nRow 3: △ △△  ?\n\nWhat fills the missing cell?",
    options: ["△△△", "○○○", "□□", "△△"],
    answer: 0,
    explanation: "Each row increases by one shape per column. Row 3 Col 3 = △△△."
  },
  {
    q: "🧠 Abstract Analogy:\n\nSolid Circle : Hollow Circle  =  Solid Square : ?\n\n(The relationship is: filled shape becomes outline only)",
    options: ["Hollow Square", "Solid Triangle", "Filled Diamond", "Smaller Square"],
    answer: 0,
    explanation: "Same transformation: solid → hollow (outline only) version of the same shape."
  },
  {
    q: "🔢 Number Pattern — What replaces the ?:\n\n  144  →  12  →  3\n  81   →   9  →  3\n  64   →   8  →  ?\n\n(Apply the same operation to each row)",
    options: ["2", "4", "2.83", "3"],
    answer: 2,
    explanation: "Each step: √ of previous number. √64=8, √8≈2.83."
  },
  {
    q: "🧩 Odd One Out — Which number does NOT belong?\n\n  121,  144,  169,  196,  210,  225",
    options: ["169", "196", "210", "225"],
    answer: 2,
    explanation: "All others are perfect squares (11²,12²,13²,14²,15²). 210 is not a perfect square."
  },
  {
    q: "🔷 Spatial Reasoning — How many cubes are needed to build this shape if viewed from the front it shows 3 columns of height 3, 2, 1 (left to right) and it is 2 units deep?",
    options: ["10", "12", "11", "14"],
    answer: 1,
    explanation: "Columns: 3×2 + 2×2 + 1×2 = 6+4+2 = 12 cubes."
  },
  {
    q: "🧠 Inductive Reasoning:\n\nIn a sequence of symbols:  ◆ ◇ ◆◆ ◇◇ ◆◆◆ ◇◇◇ …\n\nWhat is the 10th symbol group?",
    options: ["◆◆◆◆◆", "◇◇◇◇◇", "◆◆◆◆◆◆", "◇◇◇◇"],
    answer: 1,
    explanation: "Odd positions = ◆, even positions = ◇. 10th is even → ◇◇◇◇◇ (5 diamonds)."
  },
  {
    q: "🔢 Advanced Series — Find the missing value:\n\n  2,  6,  12,  20,  30,  42,  ?\n\n(Differences between terms: 4, 6, 8, 10, 12, …)",
    options: ["52", "54", "56", "58"],
    answer: 2,
    explanation: "Differences increase by 2 each time. Last diff=12, next=14. 42+14=56."
  }
];

// ---- Shuffle ----
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ================================================================
//  TEST PAGE STATE
// ================================================================
let questions      = [];
let answers        = [];      // null = unanswered/skipped
let current        = 0;
let timerInterval  = null;
let secondsLeft    = 20 * 60;
let quizFinished   = false;
// After user reaches last question, we enter "skip-review mode"
// In this mode Next/Skip only cycle through the remaining nulls
let skipReviewMode = false;

// ================================================================
//  INIT — loads from API, falls back to ALL_QUESTIONS if API fails
// ================================================================
async function initTest() {
  const apiQuestions = await loadQuestionsFromAPI();
  if (apiQuestions && apiQuestions.length >= 10) {
    questions = shuffle(apiQuestions.map(q => ({
      q          : q.q,
      options    : q.options,
      answer     : q.answer,
      image_url  : q.image_url || null,
      explanation: ''
    })));
  } else {
    // Fallback to hardcoded questions if API is down
    questions = shuffle(ALL_QUESTIONS);
  }
  answers = new Array(questions.length).fill(null);
  renderQuestion();
  startTimer();
}

// ================================================================
//  TIMER
// ================================================================
function startTimer() {
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    secondsLeft--;
    updateTimerDisplay();
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      finishQuiz();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById('timer');
  if (!el) return;
  const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const s = (secondsLeft % 60).toString().padStart(2, '0');
  el.textContent = m + ':' + s;
  el.classList.toggle('warning', secondsLeft < 120);
}

// ================================================================
//  RENDER
// ================================================================
function renderQuestion() {
  if (!questions.length) return;
  const q     = questions[current];
  const total = questions.length;

  // Progress = answered count / total
  const answeredCount = answers.filter(a => a !== null).length;
  const skippedCount  = answers.filter(a => a === null).length;
  document.getElementById('progressBar').style.width =
    ((answeredCount / total) * 100) + '%';

  // Counter
  const skipTag = skippedCount > 0
    ? ' &nbsp;·&nbsp; <span style="color:var(--accent2)">' + skippedCount + ' skipped</span>'
    : '';
  document.getElementById('qCounter').innerHTML =
    'Question ' + (current + 1) + ' / ' + total + skipTag;

  // Question text
  document.getElementById('qText').textContent = q.q;

  // Question image (if any)
  const imgWrap = document.getElementById('qImageWrap');
  const imgEl   = document.getElementById('qImage');
  if (imgWrap && imgEl) {
    if (q.image_url) {
      imgEl.src = q.image_url;
      imgWrap.style.display = 'block';
    } else {
      imgWrap.style.display = 'none';
      imgEl.src = '';
    }
  }

  // Options
  const grid    = document.getElementById('optionsGrid');
  const letters = ['A', 'B', 'C', 'D'];
  grid.innerHTML = '';
  q.options.forEach(function(opt, i) {
    const btn = document.createElement('button');
    btn.className = 'option-btn' + (answers[current] === i ? ' selected' : '');
    btn.innerHTML = '<span class="option-letter">' + letters[i] + '</span>' + opt;
    btn.addEventListener('click', function() { selectAnswer(i); });
    grid.appendChild(btn);
  });

  // Skip notice visibility
  const notice = document.getElementById('skipNotice');
  if (notice) {
    notice.classList.toggle('hidden', !skipReviewMode);
  }

  // Skip button: dim if this question is already answered (visual hint only)
  const skipBtn = document.getElementById('skipBtn');
  if (skipBtn) {
    skipBtn.style.opacity = (answers[current] !== null) ? '0.45' : '1';
  }

  // Next button label
  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) {
    // In skip-review mode, if this is the last remaining unanswered question
    // AND the user has answered it, show "Finish"
    const remainingSkips = answers.filter(a => a === null).length;
    if (skipReviewMode && remainingSkips === 0) {
      nextBtn.textContent = '✅ Finish';
    } else if (!skipReviewMode && current === total - 1) {
      // On the last regular question, show "Finish" only if no skips exist
      nextBtn.textContent = (skippedCount === 0) ? '✅ Finish' : 'Next →';
    } else {
      nextBtn.textContent = 'Next →';
    }
  }
}

// ================================================================
//  SELECT ANSWER
// ================================================================
function selectAnswer(index) {
  answers[current] = index;
  renderQuestion();
}

// ================================================================
//  NAVIGATION — NEXT
//  Normal mode  : move forward; when reaching the last question,
//                 check for skips → enter skip-review mode instead of finishing
//  Review mode  : jump to next unanswered; if none left → finish
// ================================================================
function goNext() {
  if (skipReviewMode) {
    // Must answer current before moving on
    if (answers[current] === null) {
      flashNotice('⚠️ Please answer this question before moving on!');
      return;
    }
    // Find next unanswered
    const nextSkip = findNextUnanswered();
    if (nextSkip !== -1) {
      current = nextSkip;
      renderQuestion();
    } else {
      // All answered — finish!
      finishQuiz();
    }
    return;
  }

  // Normal mode
  if (current < questions.length - 1) {
    current++;
    renderQuestion();
  } else {
    // Reached the end of the original sequence
    const firstSkip = answers.indexOf(null);
    if (firstSkip !== -1) {
      // There are skipped questions — enter review mode
      skipReviewMode = true;
      current = firstSkip;
      renderQuestion();
    } else {
      finishQuiz();
    }
  }
}

// ================================================================
//  NAVIGATION — PREV
//  Works freely in normal mode.
//  In review mode, go back to previous unanswered (or just current-1).
// ================================================================
function goPrev() {
  if (current > 0) {
    current--;
    renderQuestion();
  }
}

// ================================================================
//  NAVIGATION — SKIP
//  Normal mode  : leave answer null, advance to next question in sequence.
//                 If at end, enter review mode.
//  Review mode  : skip is DISABLED — user must answer all remaining.
// ================================================================
function goSkip() {
  if (skipReviewMode) {
    // In review mode: no skipping allowed — must answer all
    flashNotice('⚠️ You must answer all skipped questions to finish!');
    return;
  }

  // Normal mode: just advance (answer stays null)
  if (current < questions.length - 1) {
    current++;
    renderQuestion();
  } else {
    // At the very last question — check for any skips
    const firstSkip = answers.indexOf(null);
    if (firstSkip !== -1) {
      skipReviewMode = true;
      current = firstSkip;
      renderQuestion();
    } else {
      finishQuiz();
    }
  }
}

// ================================================================
//  HELPERS
// ================================================================
function findNextUnanswered() {
  // Search forward from current+1, then wrap from 0
  const total = questions.length;
  for (let i = current + 1; i < total; i++) {
    if (answers[i] === null) return i;
  }
  for (let i = 0; i < current; i++) {
    if (answers[i] === null) return i;
  }
  return -1; // none left
}

function flashNotice(msg) {
  const notice = document.getElementById('skipNotice');
  if (!notice) return;
  notice.textContent = msg;
  notice.classList.remove('hidden');
  // Briefly flash
  notice.style.borderColor = 'var(--accent)';
  notice.style.color       = 'var(--accent)';
  setTimeout(function() {
    notice.style.borderColor = '';
    notice.style.color       = '';
    // Restore normal skip-review message after 2s
    setTimeout(function() {
      notice.textContent = '⚠️ Please answer your remaining skipped questions below.';
    }, 2000);
  }, 300);
}

// ================================================================
//  FINISH
// ================================================================
function finishQuiz() {
  if (quizFinished) return;
  quizFinished = true;
  clearInterval(timerInterval);

  let score = 0;
  questions.forEach(function(q, i) {
    if (answers[i] === q.answer) score++;
  });

  const ratio = score / questions.length;
let iq;
if      (ratio <= 0.15) iq = Math.round(55  + (ratio / 0.15) * 15);        // 55–70
else if (ratio <= 0.30) iq = Math.round(70  + ((ratio - 0.15) / 0.15) * 15); // 70–85
else if (ratio <= 0.50) iq = Math.round(85  + ((ratio - 0.30) / 0.20) * 15); // 85–100
else if (ratio <= 0.65) iq = Math.round(100 + ((ratio - 0.50) / 0.15) * 12); // 100–112
else if (ratio <= 0.80) iq = Math.round(112 + ((ratio - 0.65) / 0.15) * 10); // 112–122
else if (ratio <= 0.90) iq = Math.round(122 + ((ratio - 0.80) / 0.10) * 8);  // 122–130
else                    iq = Math.round(130 + ((ratio - 0.90) / 0.10) * 15); // 130–145
iq = Math.min(145, Math.max(55, iq));
  const level = getIQLevel(iq);

  document.getElementById('quizSection').classList.add('hidden');
  var resultSection = document.getElementById('resultSection');
  resultSection.classList.remove('hidden');

  document.getElementById('resultScore').textContent = score + ' / ' + questions.length;
  document.getElementById('resultIQ').innerHTML = 'Estimated IQ: <strong>' + iq + '</strong>';

  var iconEl = document.getElementById('resultIcon');
  if (iconEl) iconEl.textContent = level.icon;

  var levelEl = document.getElementById('iqLevel');
  if (levelEl) levelEl.textContent = level.label;

  // Pre-fill name from login
  var savedName = localStorage.getItem('nzUsername');
  var nameInput = document.getElementById('nameInput');
  if (nameInput && savedName) nameInput.value = savedName;

  document.getElementById('saveBtn').addEventListener('click', function() {
    saveResult(score, iq);
  });
}

// ================================================================
//  SAVE RESULT
// ================================================================
async function saveResult(score, iq) {
  var nameInput = document.getElementById('nameInput');
  var name      = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    nameInput.style.borderColor = 'var(--accent)';
    return;
  }
  var saveBtn = document.getElementById('saveBtn');
  saveBtn.textContent = 'Saving…';
  saveBtn.disabled = true;
  await saveResultToAPI(name, score, iq, questions.length);
  window.location.href = 'leaderboard.html';
}

// ================================================================
//  LEADERBOARD
// ================================================================
async function initLeaderboard() {
  var list = document.getElementById('lbList');
  if (!list) return;
  list.innerHTML = '<div class="lb-empty">Loading…</div>';

  var results = await loadLeaderboardFromAPI();

  if (!results || results.length === 0) {
    list.innerHTML = '<div class="lb-empty">🎯 No results yet. Take the quiz first!</div>';
    return;
  }

  list.innerHTML = results.map(function(r, i) {
    return '<div class="lb-entry">' +
      '<span class="lb-rank">' + (i + 1) + '</span>' +
      '<span class="lb-name">'  + escapeHtml(r.name)  + '</span>' +
      '<span class="lb-score">' + r.score + '/' + (r.total || 20) + '</span>' +
      '<span class="lb-iq">IQ ' + r.iq + '</span>' +
      '</div>';
  }).join('');
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(c) {
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
  });
}


// ================================================================
//  API — replaces localStorage for leaderboard & results
//  These functions are called by test.html and leaderboard.html
// ================================================================

// Save result to backend (falls back to localStorage if offline)
async function saveResultToAPI(name, score, iq, total) {
  const token = localStorage.getItem('nzToken') || null;
  try {
    const res = await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, iq, total, guest_name: name, token })
    });
    return res.ok;
  } catch {
    // Offline fallback — save to localStorage
    const results = JSON.parse(localStorage.getItem('iqResults') || '[]');
    results.push({ name, score, iq, total, date: new Date().toLocaleDateString() });
    localStorage.setItem('iqResults', JSON.stringify(results));
    return false;
  }
}

// Load leaderboard from backend (falls back to localStorage)
async function loadLeaderboardFromAPI() {
  try {
    const res  = await fetch('/api/leaderboard');
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    // Offline fallback
    const results = JSON.parse(localStorage.getItem('iqResults') || '[]');
    return results.sort((a, b) => b.score - a.score);
  }
}

// Load questions from backend (falls back to hardcoded array)
async function loadQuestionsFromAPI() {
  try {
    const res = await fetch('/api/questions');
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.length >= 10 ? data : null;  // need at least 10 questions
  } catch {
    return null;  // will use ALL_QUESTIONS fallback
  }
}

// ================================================================
//  SHARE FUNCTIONS
// ================================================================
function getIQLevel(iq) {
  if (iq >= 130) return { label: '🌟 Genius', icon: '🌟' };
  if (iq >= 120) return { label: '🔥 Superior', icon: '🔥' };
  if (iq >= 110) return { label: '💡 Above Average', icon: '💡' };
  if (iq >= 90)  return { label: '✅ Average', icon: '🎯' };
  if (iq >= 80)  return { label: '📚 Below Average', icon: '📚' };
  return { label: '💪 Keep Practicing', icon: '💪' };
}

function buildShareText(score, iq, total) {
  const level = getIQLevel(iq);
  return `${level.icon} I scored ${score}/${total} on the Neuro Zap IQ Test!\nMy estimated IQ: ${iq} — ${level.label}\n\nTest your IQ now 👉 ${window.location.origin}`;
}

function shareWhatsApp() {
  const score = document.getElementById('resultScore').textContent;
  const iq    = document.getElementById('resultIQ').querySelector('strong').textContent;
  const text  = buildShareText(score.split('/')[0].trim(), iq, score.split('/')[1].trim());
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
}

function shareTwitter() {
  const score = document.getElementById('resultScore').textContent;
  const iq    = document.getElementById('resultIQ').querySelector('strong').textContent;
  const text  = buildShareText(score.split('/')[0].trim(), iq, score.split('/')[1].trim());
  window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text), '_blank');
}

function copyResult() {
  const score = document.getElementById('resultScore').textContent;
  const iq    = document.getElementById('resultIQ').querySelector('strong').textContent;
  const text  = buildShareText(score.split('/')[0].trim(), iq, score.split('/')[1].trim());
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.btn-copy');
    if (btn) { btn.textContent = '✅ Copied!'; setTimeout(() => btn.textContent = '📋 Copy', 2000); }
  });
}
