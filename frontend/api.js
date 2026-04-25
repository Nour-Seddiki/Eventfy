/**
 * ═══════════════════════════════════════════
 * api.js — Shared Eventfy API Helper
 * Single source of truth for backend communication,
 * JWT token management, and auth state.
 * ═══════════════════════════════════════════
 */
'use strict';

const API_BASE = 'http://127.0.0.1:5000';

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

/** @param {object} user */
function setCachedUser(user) {
  localStorage.setItem('eventfy_user', JSON.stringify(user));
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

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

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

/* ── User API Calls ──────────────────────── */

/** @returns {Promise<object>} User profile */
async function fetchMyProfile() {
  const res = await apiFetch('/users/my_profile');
  if (!res.ok) throw new Error('Failed to fetch profile');
  return await res.json();
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
  const res = await fetch(`${API_BASE}/events/public?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return await res.json();
}

/** Fetch trending events (no login needed) */
async function fetchTrendingEvents(limit = 5) {
  const res = await fetch(`${API_BASE}/events/trending?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch trending events');
  return await res.json();
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

/** Delete an event (requires auth, organizer role) */
async function deleteEvent(eventId) {
  const res = await apiFetch(`/Event/delete_event/${eventId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete event');
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

/* ── Logout ──────────────────────────────── */

function apiLogout() {
  clearToken();
  window.location.href = getLoginPath();
}
