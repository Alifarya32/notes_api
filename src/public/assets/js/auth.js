/**
 * AI Notes — Auth (Login, Register, Google)
 */

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

function getApiBase() {
  return typeof getApiBaseUrl === 'function'
    ? getApiBaseUrl()
    : (API_CONFIG?.BASE_URL || 'https://notesa-api.vercel.app').replace(/\/$/, '');
}

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${getApiBase()}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

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

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function redirectIfLoggedIn() {
  if (typeof isLoggedIn === 'function' && isLoggedIn()) {
    window.location.href = 'dashboard.html';
  }
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

async function handleGoogleCredential(response) {
  try {
    const result = await apiRequest('/api/v1/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential: response.credential }),
    });

    saveSession(result.data);
    showToast('Login Google berhasil!', 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 500);
  } catch (err) {
    showToast(err.message || 'Login Google gagal');
  }
}

async function resolveGoogleClientId() {
  let fromServer = null;

  try {
    const result = await apiRequest('/api/v1/auth/config');
    fromServer = result.data?.googleClientId || null;
  } catch (err) {
    console.warn('Auth config dari server:', err.message);
  }

  const fromConfig =
    typeof API_CONFIG !== 'undefined' && API_CONFIG.GOOGLE_CLIENT_ID
      ? String(API_CONFIG.GOOGLE_CLIENT_ID).trim()
      : '';

  return fromServer || fromConfig || null;
}

async function initGoogleSignIn() {
  const container = document.getElementById('google-signin-btn');
  if (!container) return;

  try {
    const googleClientId = await resolveGoogleClientId();

    if (!googleClientId) {
      container.innerHTML = `
        <p class="auth-google-hint">
          Tombol Google belum aktif.<br />
          1) Buat OAuth Client ID di Google Cloud<br />
          2) Isi <code>GOOGLE_CLIENT_ID</code> di Vercel → Settings → Environment Variables<br />
          3) Isi juga di <code>assets/js/config.js</code><br />
          4) Redeploy project Vercel
        </p>`;
      return;
    }

    await loadScript('https://accounts.google.com/gsi/client');

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
      auto_select: false,
    });

    window.google.accounts.id.renderButton(container, {
      theme: 'filled_black',
      size: 'large',
      width: Math.min(360, container.offsetWidth || 360),
      text: 'continue_with',
      locale: 'id',
      shape: 'rectangular',
    });
  } catch (err) {
    console.error('Google Sign-In init:', err);
    container.innerHTML =
      '<p class="auth-google-hint">Gagal memuat tombol Google. Cek Authorized origins di Google Console.</p>';
  }
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

    saveSession(result.data);
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

  if (password.length < 8) {
    showToast('Password minimal 8 karakter dengan huruf dan angka');
    return;
  }

  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    showToast('Password harus mengandung huruf dan angka');
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
  initGoogleSignIn();

  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
});
