/**
 * ═══════════════════════════════════════════
 * api.js — Shared Eventfy API Helper
 * Single source of truth for backend communication,
 * JWT token management, and auth state.
 *
 * Includes:
 *  • Event Bus  — cross-component reactivity
 *  • Smart Cache — stale-while-revalidate pattern
 *  • Progress Bar — visual loading feedback
 * ═══════════════════════════════════════════
 */
'use strict';

const API_BASE = window.EVENTFY_API_BASE || 'http://127.0.0.1:3000';

/* ══════════════════════════════════════════
   EVENT BUS — lightweight pub/sub
   Usage:  eventfy.on('user:updated', fn)
           eventfy.emit('user:updated', data)
           eventfy.off('user:updated', fn)
══════════════════════════════════════════ */
const eventfy = (() => {
  const _listeners = {};
  return {
    on(event, fn)  { (_listeners[event] ||= []).push(fn); },
    off(event, fn) { _listeners[event] = (_listeners[event] || []).filter(f => f !== fn); },
    emit(event, data) { (_listeners[event] || []).forEach(fn => { try { fn(data); } catch(e) { console.error(`[eventfy] ${event}:`, e); } }); },
  };
})();

/* ══════════════════════════════════════════
   SMART CACHE — stale-while-revalidate
   Returns cached data instantly, refreshes
   in the background after TTL expires.
══════════════════════════════════════════ */
const _apiCache = new Map();

/**
 * Wrap an async fetcher with stale-while-revalidate caching.
 * @param {string} key       - Cache key
 * @param {Function} fetcher - Async function that returns data
 * @param {number} ttlMs     - Time-to-live in ms before background refresh
 * @returns {Promise<any>}
 */
async function cachedFetch(key, fetcher, ttlMs = 60000) {
  const entry = _apiCache.get(key);
  const now = Date.now();

  if (entry) {
    // If still fresh, return cached
    if (now - entry.ts < ttlMs) return entry.data;

    // Stale: return cached immediately, refresh in background
    fetcher().then(fresh => {
      _apiCache.set(key, { data: fresh, ts: Date.now() });
    }).catch(() => { /* keep stale data */ });
    return entry.data;
  }

  // No cache — fetch fresh
  const data = await fetcher();
  _apiCache.set(key, { data, ts: Date.now() });
  return data;
}

/** Invalidate a specific cache entry or all entries */
function invalidateCache(key) {
  if (key) { _apiCache.delete(key); } else { _apiCache.clear(); }
}

/* ══════════════════════════════════════════
   PROGRESS BAR — thin animated bar at top
   Auto-shows during API calls, hides when done
══════════════════════════════════════════ */
let _pendingRequests = 0;
let _progressBar = null;

function _ensureProgressBar() {
  if (_progressBar) return _progressBar;
  // Inject CSS once
  if (!document.getElementById('eventfy-progress-css')) {
    const style = document.createElement('style');
    style.id = 'eventfy-progress-css';
    style.textContent = `
      #eventfy-progress-bar {
        position: fixed; top: 0; left: 0; width: 0; height: 3px;
        background: linear-gradient(90deg, #7f0df2, #a855f7, #7f0df2);
        background-size: 200% 100%;
        z-index: 99999; pointer-events: none;
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s;
        animation: eventfy-progress-shimmer 1.5s ease-in-out infinite;
        box-shadow: 0 0 8px rgba(127, 13, 242, 0.4);
        border-radius: 0 2px 2px 0;
      }
      @keyframes eventfy-progress-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
  }
  _progressBar = document.createElement('div');
  _progressBar.id = 'eventfy-progress-bar';
  document.body.appendChild(_progressBar);
  return _progressBar;
}

function _progressStart() {
  _pendingRequests++;
  if (_pendingRequests === 1) {
    const bar = _ensureProgressBar();
    bar.style.opacity = '1';
    bar.style.width = '0';
    // Animate to 70% fast, then slow crawl
    requestAnimationFrame(() => {
      bar.style.width = '70%';
    });
  }
}

function _progressEnd() {
  _pendingRequests = Math.max(0, _pendingRequests - 1);
  if (_pendingRequests === 0 && _progressBar) {
    _progressBar.style.width = '100%';
    setTimeout(() => {
      if (_pendingRequests === 0 && _progressBar) {
        _progressBar.style.opacity = '0';
        setTimeout(() => { if (_progressBar) _progressBar.style.width = '0'; }, 300);
      }
    }, 200);
  }
}

/* ── Token Management ────────────────────── */

/** @returns {string|null} The stored JWT token */
function getToken() {
  return localStorage.getItem('eventfy_token');
}

/** @param {string} token */
function setToken(token) {
  localStorage.setItem('eventfy_token', token);
}

function clearToken() {
  localStorage.removeItem('eventfy_token');
  localStorage.removeItem('eventfy_user');
}

/** @returns {boolean} */
function isLoggedIn() {
  return !!getToken();
}

/** @returns {object|null} Cached user profile */
function getCachedUser() {
  try {
    return JSON.parse(localStorage.getItem('eventfy_user'));
  } catch {
    return null;
  }
}

/** @param {object} user — also emits 'user:updated' for cross-component reactivity */
function setCachedUser(user) {
  localStorage.setItem('eventfy_user', JSON.stringify(user));
  // Invalidate profile cache so next fetch gets fresh data
  invalidateCache('profile:me');
  // Notify all listening components (navbar, popups, settings…)
  eventfy.emit('user:updated', user);
}

/**
 * Get the relative path to the login page from the current page.
 * Works from any directory depth (dashboard/, org-profile/, etc.)
 */
function getLoginPath() {
  // Detect how deep we are relative to the frontend root
  const path = window.location.pathname;
  // Check if we're already on the login page
  if (path.includes('/login/')) return 'index.html';
  // Standard sub-directory: dashboard/, signup/, org-profile/, etc.
  return '../login/index.html';
}

/* ── API Fetch Helper ────────────────────── */

/**
 * Fetch wrapper that auto-attaches JWT Bearer token.
 * @param {string} path    - API path, e.g. '/users/my_profile'
 * @param {object} options - Fetch options (method, body, headers…)
 * @returns {Promise<Response>}
 */
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Auto-set JSON content type for POST/PUT unless FormData or URLSearchParams
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !(options.body instanceof URLSearchParams) &&
    !headers['Content-Type']
  ) {
    headers['Content-Type'] = 'application/json';
  }

  // Progress bar feedback
  _progressStart();

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } finally {
    _progressEnd();
  }

  // Auto-logout on 401
  if (response.status === 401) {
    clearToken();
    const loc = window.location.pathname;
    if (!loc.includes('/login') && !loc.includes('/signup')) {
      window.location.href = getLoginPath();
    }
  }

  return response;
}

/* ── Auth API Calls ──────────────────────── */

/**
 * Login with email + password.
 * FastAPI OAuth2 expects x-www-form-urlencoded with 'username' field.
 */
async function apiLogin(email, password) {
  const body = new URLSearchParams();
  body.append('username', email);   // OAuth2 form field name
  body.append('password', password);

  const res = await fetch(`${API_BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Login failed');
  }

  const data = await res.json();
  setToken(data.access_token);

  // Fetch & cache user profile right after login
  try {
    const profile = await fetchMyProfile();
    setCachedUser(profile);
  } catch { /* non-critical */ }

  return data;
}

/**
 * Register a new user.
 * @param {object} userData - { user_name, email, password, role }
 */
async function apiSignup(userData) {
  const res = await fetch(`${API_BASE}/auth/sign_up`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Registration failed');
  }

  return await res.json();
}

/**
 * Login / register via Google One Tap.
 * Sends the Google ID token to the backend, which verifies it,
 * creates the user if needed, and returns a JWT.
 * @param {string} idToken - Google credential JWT
 */
async function apiGoogleLogin(idToken) {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Google sign-in failed');
  }

  const data = await res.json();
  setToken(data.access_token);

  // Fetch & cache user profile right after login
  try {
    const profile = await fetchMyProfile();
    setCachedUser(profile);
  } catch { /* non-critical */ }

  return data;
}

/* ── User API Calls ──────────────────────── */

/** @returns {Promise<object>} User profile (cached, refreshes in background) */
async function fetchMyProfile() {
  return cachedFetch('profile:me', async () => {
    const res = await apiFetch('/users/my_profile');
    if (!res.ok) throw new Error('Failed to fetch profile');
    return await res.json();
  }, 60000); // 60s TTL
}

/** @returns {Promise<object>} User activity (tickets + events) */
async function fetchMyActivity() {
  const res = await apiFetch('/users/my_activity');
  if (!res.ok) throw new Error('Failed to fetch activity');
  return await res.json();
}

/** Update user profile (extended fields: full_name, bio, phone, location, website) */
async function updateMyProfile(data) {
  const res = await apiFetch('/users/update_profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update profile');
  }
  return await res.json();
}

/* ── Event API Calls ─────────────────────── */

/** Fetch public events (no login needed) */
async function fetchPublicEvents(limit = 20) {
  return cachedFetch(`events:public:${limit}`, async () => {
    _progressStart();
    try {
      const res = await fetch(`${API_BASE}/events/public?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch events');
      return await res.json();
    } finally {
      _progressEnd();
    }
  }, 120000); // 2min TTL
}

/** Fetch trending events (no login needed) */
async function fetchTrendingEvents(limit = 5) {
  return cachedFetch(`events:trending:${limit}`, async () => {
    _progressStart();
    try {
      const res = await fetch(`${API_BASE}/events/trending?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch trending events');
      return await res.json();
    } finally {
      _progressEnd();
    }
  }, 120000); // 2min TTL
}

/** Search events (no login needed) */
async function searchEvents(q = '', category = '', location = '') {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (category) params.append('category', category);
  if (location) params.append('location', location);

  const res = await fetch(`${API_BASE}/events/search?${params}`);
  if (!res.ok) throw new Error('Failed to search events');
  return await res.json();
}

/** Fetch a single event by ID (no login needed) */
async function fetchEventById(eventId) {
  const res = await fetch(`${API_BASE}/events/public/${eventId}`);
  if (!res.ok) throw new Error('Event not found');
  return await res.json();
}

/** Fetch organizer's events (requires auth) */
async function fetchMyEvents() {
  const res = await apiFetch('/Event/event_list');
  if (!res.ok) throw new Error('Failed to fetch my events');
  return await res.json();
}

/** Create a new event (requires auth, organizer role) */
async function createEvent(eventData) {
  const res = await apiFetch('/Event/create_event', {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create event');
  }
  return await res.json();
}

/** Upload event image */
async function uploadEventImage(eventId, file) {
  const formData = new FormData();
  formData.append('image', file);

  const token = localStorage.getItem('eventfy_token');
  const res = await fetch(`${API_BASE}/Event/event/${eventId}/image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to upload image');
  }
  return await res.json();
}

/** Upload user avatar — auto-updates cache + emits event for instant UI sync */
async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('image', file);

  const token = localStorage.getItem('eventfy_token');
  _progressStart();
  let res;
  try {
    res = await fetch(`${API_BASE}/users/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
  } finally {
    _progressEnd();
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to upload avatar');
  }
  const updated = await res.json();

  // Optimistic propagation — update cache + notify all components
  setCachedUser(updated); // This also emits 'user:updated'

  return updated;
}

/** Update an event (requires auth, organizer role) */
async function updateEvent(eventId, eventData) {
  const res = await apiFetch(`/Event/update_event/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update event');
  }
  return await res.json();
}

/** Delete an event (requires auth, organizer role) */
async function deleteEvent(eventId) {
  const res = await apiFetch(`/Event/delete_event/${eventId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete event');
  return await res.json();
}

/** Fetch a single event for editing (requires auth) */
async function fetchEventForEdit(eventId) {
  const res = await apiFetch(`/Event/get_event_by_id/${eventId}`);
  if (!res.ok) throw new Error('Failed to fetch event for editing');
  return await res.json();
}

/* ── Ticket API Calls ────────────────────── */

/** Fetch user's tickets */
async function fetchMyTickets() {
  const res = await apiFetch('/ticket/get_user_tickets');
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return await res.json();
}

/* ── Saved Events API Calls ──────────────── */

/** Fetch user's saved events */
async function fetchSavedEvents() {
  const res = await apiFetch('/saving-events/my-saved-events');
  if (!res.ok) throw new Error('Failed to fetch saved events');
  return await res.json();
}

/** Save an event */
async function saveEvent(eventId) {
  const res = await apiFetch('/saving-events/save', {
    method: 'POST',
    body: JSON.stringify({ event_id: eventId }),
  });
  if (!res.ok) throw new Error('Failed to save event');
  return await res.json();
}

/** Unsave an event */
async function unsaveEvent(savingId) {
  const res = await apiFetch(`/saving-events/remove/${savingId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to unsave event');
  return await res.json();
}

/* ── Notification API Calls ──────────────── */

/** Fetch user's notifications */
async function fetchNotifications() {
  const res = await apiFetch('/notifications');
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return await res.json();
}

/** Fetch unread notification count */
async function fetchUnreadCount() {
  const res = await apiFetch('/notifications/unread-count');
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count || data.unread_count || 0;
}

/** Mark a single notification as read */
async function markNotificationRead(notifId) {
  const res = await apiFetch(`/notifications/${notifId}/read`, { method: 'PUT' });
  if (!res.ok) throw new Error('Failed to mark notification as read');
  return await res.json();
}

/** Mark all notifications as read */
async function markAllNotificationsRead() {
  const res = await apiFetch('/notifications/mark-all-as-read', { method: 'PUT' });
  if (!res.ok) throw new Error('Failed to mark all notifications as read');
  return await res.json();
}

/* ── Payment Verification ────────────────── */

/**
 * Verify a Stripe checkout session and fulfill the order.
 * Called from the payment success page to create the ticket
 * + notification without relying on the Stripe webhook.
 * @param {string} sessionId - Stripe checkout session ID
 */
async function verifyPayment(sessionId) {
  const res = await apiFetch(`/payment/verify/${sessionId}`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Payment verification failed');
  }
  return await res.json();
}

/* ── Logout ──────────────────────────────── */

function apiLogout() {
  clearToken();
  window.location.href = getLoginPath();
}
