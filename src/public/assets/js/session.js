/**
 * Manajemen sesi aman — access token + refresh token
 */
const ACCESS_KEY = 'ai_notes_token';
const REFRESH_KEY = 'ai_notes_refresh';
const USER_KEY = 'ai_notes_user';

function getApiBaseUrl() {
  if (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL) {
    return API_CONFIG.BASE_URL.replace(/\/$/, '');
  }
  return 'https://notesa-api.vercel.app';
}

function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveSession(payload) {
  const access = payload.accessToken || payload.token;
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (payload.refreshToken) localStorage.setItem(REFRESH_KEY, payload.refreshToken);
  if (payload.user) localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
}

function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

function isLoggedIn() {
  return Boolean(getAccessToken() && getRefreshToken());
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('NO_REFRESH');

  const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) throw new Error('REFRESH_FAILED');

  saveSession(data.data);
  return data.data.accessToken;
}

async function authFetch(endpoint, options = {}) {
  const url = `${getApiBaseUrl()}${endpoint}`;
  const headers = { ...options.headers };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response = await fetch(url, { ...options, headers });
  let json;

  try {
    json = await response.json();
  } catch {
    throw new Error('Respons server tidak valid');
  }

  if (response.status === 401 && getRefreshToken()) {
    try {
      const newToken = await refreshAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, { ...options, headers });
      json = await response.json();
    } catch {
      clearSession();
      window.location.href = 'index.html';
      throw new Error('Sesi berakhir');
    }
  }

  if (response.status === 401) {
    clearSession();
    window.location.href = 'index.html';
    throw new Error('Unauthorized');
  }

  if (!response.ok || json.success === false) {
    throw new Error(json.message || `Request gagal (${response.status})`);
  }

  return json;
}

async function logout() {
  try {
    await authFetch('/api/v1/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: getRefreshToken() }),
    });
  } catch {
    /* abaikan error logout */
  }
  clearSession();
  window.location.href = 'index.html';
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}
