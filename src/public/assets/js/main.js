/**
 * AI Notes — Dashboard (List, Search, Upload)
 * Bergantung pada session.js untuk autentikasi aman.
 */

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.doc'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

let searchDebounceTimer = null;

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

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFileExtension(fileName) {
  if (!fileName) return 'FILE';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return ext.toUpperCase();
}

function initUserDisplay() {
  const user = getUser();
  if (!user) return;

  const name = user.name || 'User';
  document.getElementById('user-name').textContent = name.split(' ')[0];
  document.getElementById('user-display-name').textContent = name;
  document.getElementById('user-email').textContent = user.email || '';
  document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();
}

function renderNotes(notes) {
  const grid = document.getElementById('notes-grid');
  const countEl = document.getElementById('notes-count');

  countEl.textContent = `${notes.length} catatan`;

  if (!notes.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>Belum ada catatan. Unggah file pertama Anda!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = notes
    .map(
      (note) => `
      <article class="note-card glass">
        <h3 class="note-card__title">${escapeHtml(note.title)}</h3>
        <div class="note-card__meta">
          <span class="file-badge">${escapeHtml(getFileExtension(note.fileName))}</span>
          <span class="note-card__date">${formatDate(note.createdAt)}</span>
        </div>
        <p class="note-card__excerpt">${escapeHtml(note.summary || 'Ringkasan AI sedang diproses...')}</p>
        <a href="detail-note.html?id=${encodeURIComponent(note.id)}" class="btn btn-ghost btn-sm">Buka Catatan</a>
      </article>
    `
    )
    .join('');
}

async function fetchNotes(query = '') {
  const grid = document.getElementById('notes-grid');
  grid.innerHTML = `
    <div class="empty-state" id="notes-loading">
      <span class="loading-spinner" aria-hidden="true"></span>
      <p>Memuat catatan...</p>
    </div>
  `;

  try {
    const params = new URLSearchParams({ page: '1', limit: '50' });
    if (query.trim()) params.set('q', query.trim());

    const result = await authFetch(`/api/v1/notes?${params.toString()}`);
    const notes = result.data?.data || result.data || [];
    renderNotes(Array.isArray(notes) ? notes : []);
  } catch (err) {
    if (err.message === 'Unauthorized') return;
    grid.innerHTML = `
      <div class="empty-state">
        <p>Gagal memuat catatan.</p>
      </div>
    `;
    showToast(err.message || 'Gagal memuat daftar catatan');
  }
}

function validateFile(file) {
  const name = file.name.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));

  if (!hasValidExt) {
    showToast('Format tidak didukung. Gunakan .pdf, .docx, atau .txt');
    return false;
  }

  if (file.size > MAX_FILE_SIZE) {
    showToast('Ukuran file melebihi 10MB');
    return false;
  }

  return true;
}

async function uploadFile(file) {
  if (!validateFile(file)) return;

  const progressWrap = document.getElementById('upload-progress');
  const progressFill = document.getElementById('upload-progress-fill');
  const fileNameEl = document.getElementById('selected-file-name');

  fileNameEl.textContent = file.name;
  progressWrap.classList.add('upload-progress--visible');
  progressFill.style.width = '30%';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

  try {
    progressFill.style.width = '60%';
    await authFetch('/api/v1/notes/upload', {
      method: 'POST',
      body: formData,
    });

    progressFill.style.width = '100%';
    showToast('File berhasil diunggah & diproses AI!', 'success');

    const searchInput = document.getElementById('search-input');
    await fetchNotes(searchInput?.value || '');

    setTimeout(() => {
      progressWrap.classList.remove('upload-progress--visible');
      progressFill.style.width = '0%';
      fileNameEl.textContent = '';
    }, 800);
  } catch (err) {
    progressWrap.classList.remove('upload-progress--visible');
    progressFill.style.width = '0%';
    showToast(err.message || 'Gagal mengunggah file');
  }
}

function initDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) uploadFile(fileInput.files[0]);
    fileInput.value = '';
  });

  ['dragenter', 'dragover'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('dropzone--dragover');
    });
  });

  ['dragleave', 'drop'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dropzone--dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  });
}

function initSearch() {
  const searchInput = document.getElementById('search-input');

  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      fetchNotes(searchInput.value);
    }, 400);
  });
}

function initSidebar() {
  document.getElementById('logout-btn').addEventListener('click', logout);

  document.getElementById('nav-upload').addEventListener('click', () => {
    document.getElementById('upload-section').scrollIntoView({ behavior: 'smooth' });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  initUserDisplay();
  initDropzone();
  initSearch();
  initSidebar();
  fetchNotes();
});
