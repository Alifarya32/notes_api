/**
 * AI Notes — Detail (Summary, Quiz, Flashcards)
 * Bergantung pada session.js untuk autentikasi aman.
 */

let noteId = null;
let currentNote = null;
let quizQuestions = [];
let flashcardData = [];

function showToast(message, type = 'error') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <svg class="toast__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      ${type === 'success'
        ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
        : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
    </svg>
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(1rem)';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text ?? '');
  return div.innerHTML;
}

function getNoteIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function quizCacheKey(id) {
  return `ai_notes_quiz_${id}`;
}

function flashcardCacheKey(id) {
  return `ai_notes_flashcards_${id}`;
}

function loadCachedQuiz() {
  try {
    const raw = sessionStorage.getItem(quizCacheKey(noteId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCachedQuiz(questions) {
  sessionStorage.setItem(quizCacheKey(noteId), JSON.stringify(questions));
}

function loadCachedFlashcards() {
  try {
    const raw = sessionStorage.getItem(flashcardCacheKey(noteId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCachedFlashcards(cards) {
  sessionStorage.setItem(flashcardCacheKey(noteId), JSON.stringify(cards));
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getFileExtension(fileName) {
  if (!fileName) return 'FILE';
  return (fileName.split('.').pop() || 'file').toUpperCase();
}

function formatSummaryHtml(summary) {
  if (!summary) {
    return '<div class="summary-placeholder"><p>Ringkasan AI belum tersedia. Pastikan file berisi teks yang cukup panjang setelah diunggah.</p></div>';
  }

  const lines = summary.split('\n').filter((l) => l.trim());
  let html = '';

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (/^#{1,3}\s/.test(trimmed) || /^[A-Z][^.!?]*:$/.test(trimmed) && trimmed.length < 80) {
      const text = trimmed.replace(/^#+\s*/, '');
      html += `<h3>${escapeHtml(text)}</h3>`;
    } else if (/^[-*•]\s/.test(trimmed)) {
      html += `<p>• ${escapeHtml(trimmed.replace(/^[-*•]\s*/, ''))}</p>`;
    } else if (/^\d+\.\s/.test(trimmed)) {
      html += `<p>${escapeHtml(trimmed)}</p>`;
    } else {
      html += `<p>${escapeHtml(trimmed)}</p>`;
    }
  });

  return html || `<p>${escapeHtml(summary)}</p>`;
}

function renderNoteHeader(note) {
  document.getElementById('note-title').textContent = note.title;
  document.getElementById('note-file-type').textContent = getFileExtension(note.fileName);
  document.getElementById('note-date').textContent = formatDate(note.createdAt);
  document.title = `AI Notes — ${note.title}`;
}

function renderSummary(note) {
  const el = document.getElementById('summary-content');
  el.innerHTML = formatSummaryHtml(note.summary);
}

function initTabs() {
  const tabs = document.querySelectorAll('.pill-tab');
  const panels = {
    summary: document.getElementById('panel-summary'),
    quiz: document.getElementById('panel-quiz'),
    flashcards: document.getElementById('panel-flashcards'),
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach((t) => {
        t.classList.toggle('pill-tab--active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });

      Object.entries(panels).forEach(([key, panel]) => {
        const active = key === target;
        panel.classList.toggle('tab-panel--active', active);
        panel.hidden = !active;
      });
    });
  });
}

function renderQuiz(questions) {
  quizQuestions = questions;
  const generatePanel = document.getElementById('quiz-generate-panel');
  const quizContent = document.getElementById('quiz-content');

  generatePanel.style.display = 'none';
  quizContent.style.display = 'block';

  const letters = ['A', 'B', 'C', 'D'];

  quizContent.innerHTML = `
    <div class="quiz-toolbar">
      <span style="color: var(--text-muted); font-size: 0.9rem;">${questions.length} soal pilihan ganda</span>
      <button type="button" class="btn btn-ghost btn-sm" id="btn-regenerate-quiz">Buat Ulang Kuis</button>
    </div>
    ${questions
      .map(
        (q, qi) => `
        <div class="quiz-question glass" data-question-index="${qi}">
          <div class="quiz-question__number">Soal ${qi + 1}</div>
          <p class="quiz-question__text">${escapeHtml(q.question)}</p>
          <div class="quiz-options">
            ${(q.options || [])
              .slice(0, 4)
              .map(
                (opt, oi) => `
              <label class="quiz-option" data-question="${qi}" data-option="${escapeHtml(opt)}">
                <input type="radio" name="q${qi}" value="${escapeHtml(opt)}" />
                <span class="quiz-option__letter">${letters[oi] || oi + 1}</span>
                <span>${escapeHtml(opt)}</span>
              </label>
            `
              )
              .join('')}
          </div>
        </div>
      `
      )
      .join('')}
    <button type="button" class="btn btn-primary" id="btn-submit-quiz">Kirim Jawaban</button>
    <div id="quiz-result"></div>
  `;

  quizContent.querySelectorAll('.quiz-option').forEach((label) => {
    label.addEventListener('click', () => {
      const qi = label.dataset.question;
      quizContent.querySelectorAll(`.quiz-option[data-question="${qi}"]`).forEach((el) => {
        el.classList.remove('quiz-option--selected');
      });
      label.classList.add('quiz-option--selected');
      label.querySelector('input').checked = true;
    });
  });

  document.getElementById('btn-submit-quiz').addEventListener('click', submitQuiz);
  document.getElementById('btn-regenerate-quiz').addEventListener('click', () => generateQuiz(true));
}

function submitQuiz() {
  const quizContent = document.getElementById('quiz-content');
  const resultEl = document.getElementById('quiz-result');
  let correct = 0;

  quizQuestions.forEach((q, qi) => {
    const selected = quizContent.querySelector(`input[name="q${qi}"]:checked`);
    if (selected && selected.value === q.correctAnswer) {
      correct++;
    }
  });

  const total = quizQuestions.length;
  const pct = Math.round((correct / total) * 100);
  const passed = pct >= 60;

  resultEl.className = `quiz-result ${passed ? 'quiz-result--pass' : 'quiz-result--fail'}`;
  resultEl.innerHTML = passed
    ? `Skor Anda: <strong>${correct}/${total}</strong> (${pct}%) — Luar biasa!`
    : `Skor Anda: <strong>${correct}/${total}</strong> (${pct}%) — Pelajari kembali materinya.`;

  resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function generateQuiz(regenerate = false) {
  const btn = document.getElementById('btn-generate-quiz');
  const originalText = btn.textContent;

  btn.disabled = true;
  btn.textContent = 'Membuat kuis AI...';

  try {
    const result = await authFetch(`/api/v1/notes/${noteId}/generate-quiz`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const questions = result.data?.questions || result.data;
    if (!Array.isArray(questions) || !questions.length) {
      throw new Error('Format kuis tidak valid');
    }

    saveCachedQuiz(questions);
    renderQuiz(questions);
    showToast(regenerate ? 'Kuis baru berhasil dibuat!' : 'Kuis berhasil dibuat!', 'success');
  } catch (err) {
    if (err.message !== 'Unauthorized') {
      showToast(err.message || 'Gagal membuat kuis');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function renderFlashcards(cards) {
  flashcardData = cards;
  const generatePanel = document.getElementById('flashcards-generate-panel');
  const contentWrap = document.getElementById('flashcards-content');
  const grid = document.getElementById('flashcards-grid');

  generatePanel.style.display = 'none';
  contentWrap.style.display = 'block';

  grid.innerHTML = cards
    .map(
      (card, i) => `
      <div class="flashcard-scene" data-index="${i}" role="button" tabindex="0" aria-label="Kartu ${i + 1}, klik untuk membalik">
        <div class="flashcard-inner">
          <div class="flashcard-face flashcard-face--front glass">
            <span>${escapeHtml(card.front)}</span>
          </div>
          <div class="flashcard-face flashcard-face--back glass">
            <span>${escapeHtml(card.back)}</span>
          </div>
        </div>
      </div>
    `
    )
    .join('');

  grid.querySelectorAll('.flashcard-scene').forEach((scene) => {
    const flip = () => scene.classList.toggle('flashcard-scene--flipped');
    scene.addEventListener('click', flip);
    scene.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flip();
      }
    });
  });
}

async function generateFlashcards(regenerate = false) {
  const btn = document.getElementById('btn-generate-flashcards');
  const originalText = btn.textContent;

  btn.disabled = true;
  btn.textContent = 'Membuat flashcards AI...';

  try {
    const result = await authFetch(`/api/v1/notes/${noteId}/generate-flashcards`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const cards = result.data?.cards || result.data;
    if (!Array.isArray(cards) || !cards.length) {
      throw new Error('Format flashcard tidak valid');
    }

    saveCachedFlashcards(cards);
    renderFlashcards(cards);
    showToast(regenerate ? 'Flashcards baru berhasil dibuat!' : 'Flashcards berhasil dibuat!', 'success');
  } catch (err) {
    if (err.message !== 'Unauthorized') {
      showToast(err.message || 'Gagal membuat flashcards');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function loadNoteDetail() {
  if (!noteId) {
    showToast('ID catatan tidak valid');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
    return;
  }

  try {
    const result = await authFetch(`/api/v1/notes/${noteId}`);
    currentNote = result.data;
    renderNoteHeader(currentNote);
    renderSummary(currentNote);

    const cachedQuiz = loadCachedQuiz();
    if (cachedQuiz?.length) {
      renderQuiz(cachedQuiz);
    }

    const cachedCards = loadCachedFlashcards();
    if (cachedCards?.length) {
      renderFlashcards(cachedCards);
    }
  } catch (err) {
    if (err.message === 'Unauthorized') return;
    showToast(err.message || 'Gagal memuat detail catatan');
    document.getElementById('summary-content').innerHTML =
      '<div class="summary-placeholder"><p>Gagal memuat data.</p></div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  noteId = getNoteIdFromUrl();
  initTabs();

  document.getElementById('btn-generate-quiz').addEventListener('click', () => generateQuiz(false));
  document.getElementById('btn-generate-flashcards').addEventListener('click', () => generateFlashcards(false));

  loadNoteDetail();
});
