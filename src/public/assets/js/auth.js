/**
 * AI Notes — Auth (Login & Register)
 */

const API_BASE_URL = (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL)
  ? API_CONFIG.BASE_URL.replace(/\/$/, '')
  : 'https://notesa-api.vercel.app';

const TOKEN_KEY = 'ai_notes_token';
const USER_KEY = 'ai_notes_user';

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
  div.textContent = text;
  return div.innerHTML;
}

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function redirectIfLoggedIn() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    window.location.href = 'dashboard.html';
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error('Respons server tidak valid');
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request gagal (${response.status})`);
  }

  return data;
}

function setFormLoading(form, loading) {
  const btn = form.querySelector('button[type="submit"]');
  if (btn) {
    btn.disabled = loading;
    btn.textContent = loading ? 'Memproses...' : btn.dataset.originalText || btn.textContent;
  }
}

function initAuthToggle() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const toggleBtn = document.getElementById('auth-toggle-btn');
  const toggleText = document.getElementById('toggle-text');

  let isLogin = true;

  const loginSubmit = document.getElementById('login-submit');
  const registerSubmit = document.getElementById('register-submit');
  if (loginSubmit) loginSubmit.dataset.originalText = 'Masuk';
  if (registerSubmit) registerSubmit.dataset.originalText = 'Daftar';

  toggleBtn.addEventListener('click', () => {
    isLogin = !isLogin;
    loginForm.classList.toggle('auth-form--active', isLogin);
    registerForm.classList.toggle('auth-form--active', !isLogin);
    toggleText.textContent = isLogin ? 'Belum punya akun?' : 'Sudah punya akun?';
    toggleBtn.textContent = isLogin ? 'Daftar sekarang' : 'Masuk di sini';
  });
}

async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showToast('Email dan password wajib diisi');
    return;
  }

  setFormLoading(form, true);

  try {
    const result = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const { token, user } = result.data;
    saveSession(token, user);
    showToast('Login berhasil! Mengalihkan...', 'success');

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 600);
  } catch (err) {
    showToast(err.message || 'Login gagal');
  } finally {
    setFormLoading(form, false);
    document.getElementById('login-submit').textContent = 'Masuk';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  if (!name || !email || !password) {
    showToast('Semua field wajib diisi');
    return;
  }

  if (password.length < 6) {
    showToast('Password minimal 6 karakter');
    return;
  }

  setFormLoading(form, true);

  try {
    await apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    showToast('Registrasi berhasil! Silakan masuk.', 'success');

    document.getElementById('auth-toggle-btn').click();
    document.getElementById('login-email').value = email;
  } catch (err) {
    showToast(err.message || 'Registrasi gagal');
  } finally {
    setFormLoading(form, false);
    document.getElementById('register-submit').textContent = 'Daftar';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  redirectIfLoggedIn();
  initAuthToggle();

  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
});
