/**
 * ═══════════════════════════════════════════════════════════════════
 * EVENTFY — UNIFIED NAVBAR CONTROLLER  v3.0
 * navbar.js  (root-level, served from /navbar.js)
 *
 * Handles:
 *  1. Scroll shadow on <header class="site-header">
 *  2. Mobile drawer open / close
 *  3. User avatar popup + Notification popup (desktop & mobile)
 *  4. Auth-aware rendering:
 *      – Logged-out: shows .nav-logged-out / .drawer-logged-out
 *      – Logged-in : shows .nav-logged-in   / .drawer-logged-in
 *      – Populates user name, initials, role from getCachedUser() / api.js
 *  5. Active nav-link highlighting based on current path
 *  6. Logout wired to apiLogout()
 *  7. "View all notifications" link in notification popup
 *
 * Each auth-protected page must include api.js BEFORE this script.
 * Public pages (Home, About, Events) also benefit from api.js for
 * auth-state detection.
 * ═══════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────────
     HELPERS — path utilities
  ───────────────────────────────────────────────────────────────── */

  /**
   * Compute a relative path FROM current page TO target.
   * We count directory depth from the frontend root.
   * nav.js lives at /navbar.js (one level above /frontend),
   * so this function builds paths relative to the CURRENT FILE.
   */
  function relPath(target) {
    // target is relative to /frontend/  (e.g. 'Home/index.html')
    const loc = window.location.pathname.toLowerCase();

    // Detect depth: how many levels inside /frontend/?
    // /frontend/Home/    → depth 1  → prefix = '../'
    // /frontend/Events/  → depth 1
    // /frontend/org-dashboard/ → depth 1
    // /frontend/          → depth 0  → prefix = './'  (shouldn't happen)
    const frontendIdx = loc.indexOf('/frontend/');
    if (frontendIdx === -1) {
      // We're at root or elsewhere – just prepend /frontend/
      return '/frontend/' + target;
    }
    const afterFrontend = loc.slice(frontendIdx + '/frontend/'.length);
    const depth = (afterFrontend.match(/\//g) || []).length;
    const prefix = depth > 0 ? '../'.repeat(depth) : './';
    return prefix + target;
  }

  /* Page paths – always relative from any subdir under /frontend/ */
  const PATHS = {
    home       : relPath('Home/index.html'),
    events     : relPath('Events/index.html'),
    about      : relPath('About/index.html'),
    login      : relPath('login/index.html'),
    signup     : relPath('signup/index.html'),
    dashboard  : relPath('dashboard/index.html'),
    orgDash    : relPath('org-dashboard/index.html'),
    savedEvents: relPath('saved-events/index.html'),
    profile    : relPath('org-profile/index.html'),
    settings   : relPath('setting/index.html'),
    newEvent   : relPath('new-event/index.html'),
    notifications: relPath('notifications/index.html'),
  };

  /* ─────────────────────────────────────────────────────────────────
     1. SCROLL SHADOW
  ───────────────────────────────────────────────────────────────── */
  const header = document.getElementById('siteHeader');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ─────────────────────────────────────────────────────────────────
     2. ACTIVE LINK HIGHLIGHTING
  ───────────────────────────────────────────────────────────────── */
  const currentPath = window.location.pathname.toLowerCase();

  function markActive(linkEl) {
    if (!linkEl) return;
    const href = (linkEl.getAttribute('href') || '').toLowerCase();
    if (!href || href === '#') return;
    // Skip pure hash anchors (e.g. #how-it-works) — they share the page
    // pathname with the home page and would falsely become active
    if (href.startsWith('#')) return;
    // Check if the href resolves to the current path
    try {
      const url = new URL(href, window.location.href);
      const abs = url.pathname.toLowerCase();
      // Only mark active when there is NO hash fragment (or the base path
      // is different from the current page so the hash doesn't cause a false match)
      if (url.hash && abs === currentPath) return; // same page + hash = skip
      if (abs === currentPath || (abs.endsWith('index.html') && currentPath.endsWith(abs.replace('index.html','')))) {
        linkEl.classList.add('active');
      }
    } catch (_) { /* ignore */ }
  }

  document.querySelectorAll('.nav-link, .drawer-link').forEach(markActive);

  /* ─────────────────────────────────────────────────────────────────
     3. AUTH STATE — show/hide logged-in vs logged-out sections
  ───────────────────────────────────────────────────────────────── */
  const loggedIn = typeof isLoggedIn === 'function' ? isLoggedIn() : !!localStorage.getItem('eventfy_token');

  // Toggle visibility helpers
  function showEl(el)  { if (el) el.style.display = ''; }
  function hideEl(el)  { if (el) el.style.display = 'none'; }

  document.querySelectorAll('.nav-logged-in,.drawer-logged-in').forEach(el => {
    loggedIn ? showEl(el) : hideEl(el);
  });
  document.querySelectorAll('.nav-logged-out,.drawer-logged-out').forEach(el => {
    loggedIn ? hideEl(el) : showEl(el);
  });

  /* ─────────────────────────────────────────────────────────────────
     4. USER DATA — populate from cache or api
  ───────────────────────────────────────────────────────────────── */
  let user = { name: '', initials: '', role: 'Member' };

  if (loggedIn) {
    const cached = (typeof getCachedUser === 'function') ? getCachedUser() : null;
    if (cached) {
      const fullName = cached.user_name || cached.username || cached.name || 'User';
      const role     = cached.role ? (cached.role.charAt(0).toUpperCase() + cached.role.slice(1)) : 'Member';
      const parts    = fullName.trim().split(/\s+/);
      const initials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : fullName.slice(0, 2).toUpperCase();
      user = { name: fullName, initials, role };
    }

    // Seed all initials/name/role placeholders
    document.querySelectorAll('.user-initials-text').forEach(el => el.textContent = user.initials || 'U');
    document.querySelectorAll('.user-name-text,.drawer-user-name').forEach(el => el.textContent = user.name || 'User');
    document.querySelectorAll('.user-role-text,.drawer-user-role').forEach(el => el.textContent = user.role || 'Member');
    document.querySelectorAll('.drawer-avatar-text').forEach(el => el.textContent = user.initials || 'U');
  }

  /* ─────────────────────────────────────────────────────────────────
     5. BUILD USER POPUP (dynamic HTML with correct links)
  ───────────────────────────────────────────────────────────────── */
  const ic = {
    person  : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
    heart   : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
    logout  : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    dash    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  };

  function buildUserPopupHTML() {
    const isOrgPage = currentPath.includes('org-dashboard') || currentPath.includes('org-profile');
    const isDash    = currentPath.includes('/dashboard/');
    const isSaved   = currentPath.includes('saved-events');

    return `
      <div class="popup-header">
        <div class="popup-user-row">
          <div class="popup-avatar">${user.initials || 'U'}</div>
          <div>
            <div class="popup-user-name">${user.name || 'User'}</div>
            <div class="popup-user-role">${user.role || 'Member'}</div>
          </div>
        </div>
      </div>
      <a href="${PATHS.profile}"      class="popup-item ${currentPath.includes('org-profile')    ? 'active' : ''}">${ic.person}   Profile Settings</a>
      <a href="${PATHS.dashboard}"    class="popup-item ${isDash                                  ? 'active' : ''}">${ic.dash}     My Dashboard</a>
      <a href="${PATHS.orgDash}"      class="popup-item ${currentPath.includes('org-dashboard')  ? 'active' : ''}">${ic.calendar} My Events</a>
      <a href="${PATHS.savedEvents}"  class="popup-item ${isSaved                                 ? 'active' : ''}">${ic.heart}    Saved Events</a>
      <a href="${PATHS.settings}"     class="popup-item">${ic.settings} Settings</a>
      <div class="popup-sep"></div>
      <button class="popup-item danger btn-do-logout">${ic.logout} Log out</button>
    `;
  }

  if (loggedIn) {
    ['userPopup', 'userPopupMob'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = buildUserPopupHTML();
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     6. BUILD NOTIFICATION POPUP (with "View All" link)
  ───────────────────────────────────────────────────────────────── */
  function buildNotifPopupHTML() {
    return `
      <div class="notif-popup-header">
        <span class="notif-popup-title">Notifications</span>
        <a href="${PATHS.notifications}" class="notif-view-all">View all</a>
      </div>
      <div class="notif-empty">
        <div class="notif-empty-icon">🔔</div>
        <div class="notif-empty-msg">No notifications yet</div>
        <div class="notif-empty-sub">We'll let you know when something arrives</div>
      </div>
    `;
  }

  ['notifPopupDesktop', 'notifPopupMob'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = buildNotifPopupHTML();
  });

  /* ─────────────────────────────────────────────────────────────────
     7. FIX NAV LINK HREFS (logged-out: login/signup buttons)
  ───────────────────────────────────────────────────────────────── */
  document.querySelectorAll('.btn-do-login').forEach(btn => {
    btn.addEventListener('click', () => { window.location.href = PATHS.login; });
  });
  document.querySelectorAll('.btn-do-register').forEach(btn => {
    btn.addEventListener('click', () => { window.location.href = PATHS.signup; });
  });

  /* ─────────────────────────────────────────────────────────────────
     8. MOBILE DRAWER
  ───────────────────────────────────────────────────────────────── */
  const hamburger      = document.getElementById('hamburgerBtn');
  const drawer         = document.getElementById('navDrawer');
  const overlay        = document.getElementById('drawerOverlay');
  const closeDrawerBtn = document.getElementById('drawerCloseBtn');

  function openDrawer() {
    drawer?.classList.add('open');
    overlay?.classList.add('open');
    hamburger?.classList.add('open');
    hamburger?.setAttribute('aria-expanded', 'true');
    drawer?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer?.classList.remove('open');
    overlay?.classList.remove('open');
    hamburger?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    drawer?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', () =>
    drawer?.classList.contains('open') ? closeDrawer() : openDrawer());
  closeDrawerBtn?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
  document.querySelectorAll('.drawer-link').forEach(l => l.addEventListener('click', closeDrawer));

  /* ─────────────────────────────────────────────────────────────────
     9. POPUP LOGIC (user + notification)
  ───────────────────────────────────────────────────────────────── */
  const POPUP_IDS = ['userPopup', 'userPopupMob', 'notifPopupDesktop', 'notifPopupMob'];

  function closeAllPopups() {
    POPUP_IDS.forEach(id => document.getElementById(id)?.classList.remove('open'));
  }
  function togglePopup(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const wasOpen = el.classList.contains('open');
    closeAllPopups();
    if (!wasOpen) el.classList.add('open');
  }

  document.getElementById('desktopAvatarBtn')?.addEventListener('click', e => { e.stopPropagation(); togglePopup('userPopup'); });
  document.getElementById('mobAvatarBtn')?.addEventListener('click',     e => { e.stopPropagation(); togglePopup('userPopupMob'); });
  document.getElementById('desktopNotifBtn')?.addEventListener('click',  e => { e.stopPropagation(); togglePopup('notifPopupDesktop'); });
  document.getElementById('mobNotifBtn')?.addEventListener('click',      e => { e.stopPropagation(); togglePopup('notifPopupMob'); });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.user-popup,.notif-popup,.nav-user-avatar-btn,.nav-notif-btn'))
      closeAllPopups();
  });

  // Close on ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeDrawer(); closeAllPopups(); }
  });

  /* ─────────────────────────────────────────────────────────────────
     10. LOGOUT
  ───────────────────────────────────────────────────────────────── */
  document.addEventListener('click', e => {
    if (!e.target.closest('.btn-do-logout')) return;
    e.preventDefault();
    closeAllPopups();
    if (typeof apiLogout === 'function') {
      apiLogout();
    } else {
      localStorage.removeItem('eventfy_token');
      localStorage.removeItem('eventfy_user');
      window.location.href = PATHS.login;
    }
  });

  /* ─────────────────────────────────────────────────────────────────
     11. LOGIN / REGISTER BUTTONS (logged-out state)
  ───────────────────────────────────────────────────────────────── */
  document.addEventListener('click', e => {
    if (e.target.closest('.btn-do-login')) {
      e.preventDefault();
      window.location.href = PATHS.login;
    }
    if (e.target.closest('.btn-do-register')) {
      e.preventDefault();
      window.location.href = PATHS.signup;
    }
  });

})();
