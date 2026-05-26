/**
 * URL API — otomatis menyesuaikan lingkungan:
 * - Vercel (satu domain): pakai origin yang sama → tidak perlu CORS
 * - Live Server lokal: arahkan ke API Vercel
 */
(function () {
  const VERCEL_API = 'https://notesa-api.vercel.app';

  function resolveApiBaseUrl() {
    if (typeof window === 'undefined') return VERCEL_API;

    const { hostname, port } = window.location;
    const isLocal =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.local');

    // Live Server / dev lokal → API tetap di Vercel
    if (isLocal) return VERCEL_API;

    // Production Vercel: frontend + API satu domain
    return window.location.origin.replace(/\/$/, '');
  }

  window.API_CONFIG = {
    BASE_URL: resolveApiBaseUrl(),
  };
})();
