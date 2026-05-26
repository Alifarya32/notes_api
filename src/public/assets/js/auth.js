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

function startGoogleLogin(clientId) {
  const nonce = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  sessionStorage.setItem('google_oauth_nonce', nonce);

  const redirectUri = `${window.location.origin}/google-callback.html`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce,
    prompt: 'select_account',
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function initGoogleSignIn() {
  const container = document.getElementById('google-signin-btn');
  if (!container) return;

  try {
    const googleClientId = await resolveGoogleClientId();

    if (!googleClientId) {
      container.innerHTML = `
        <p class="auth-google-hint">
          Login Google belum aktif.<br />
          Set <code>GOOGLE_CLIENT_ID</code> di Vercel lalu redeploy.
        </p>`;
      return;
    }

    container.innerHTML = `
      <button type="button" class="btn btn-google" id="btn-google-login" aria-label="Masuk dengan Google">
        <svg class="btn-google__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Masuk dengan Google
      </button>`;

    document.getElementById('btn-google-login').addEventListener('click', () => {
      startGoogleLogin(googleClientId);
    });
  } catch (err) {
    console.error('Google Sign-In init:', err);
    container.innerHTML =
      '<p class="auth-google-hint">Gagal memuat login Google.</p>';
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

function showUrlAuthError() {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');
  if (error) {
    showToast(decodeURIComponent(error).replace(/_/g, ' '), 'error');
    window.history.replaceState({}, '', 'index.html');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  redirectIfLoggedIn();
  initAuthToggle();
  initGoogleSignIn();
  showUrlAuthError();

  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
});
