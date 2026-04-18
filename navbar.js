/**
 * EVENTFY — SHARED NAVBAR LOGIC
 * shared/navbar.js
 *
 * Each page must define window.EVENTFY_USER and window.EVENTFY_LINKS
 * before this script loads:
 *
 *   window.EVENTFY_USER  = { name, initials, role }
 *   window.EVENTFY_LINKS = { profile, myEvents, savedEvents }
 */
(function () {
  'use strict';

  /* ── 1. SCROLL SHADOW ───────────────────────────── */
  const header = document.getElementById('siteHeader');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 2. MOBILE DRAWER ───────────────────────────── */
  const hamburger      = document.getElementById('hamburgerBtn');
  const drawer         = document.getElementById('navDrawer');
  const overlay        = document.getElementById('drawerOverlay');
  const closeDrawerBtn = document.getElementById('drawerCloseBtn');

  function openDrawer()  {
    drawer?.classList.add('open');
    overlay?.classList.add('open');
    hamburger?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer?.classList.remove('open');
    overlay?.classList.remove('open');
    hamburger?.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click',      () => drawer?.classList.contains('open') ? closeDrawer() : openDrawer());
  closeDrawerBtn?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click',        closeDrawer);

  /* ── 3. POPUP HELPERS ───────────────────────────── */
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

  document.addEventListener('click', e => {
    if (!e.target.closest('.user-popup,.notif-popup,.nav-user-avatar-btn,.nav-notif-btn'))
      closeAllPopups();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeDrawer(); closeAllPopups(); }
  });

  /* ── 4. USER DATA & LINKS ───────────────────────── */
  const user  = window.EVENTFY_USER  || { name: 'Alex Rivers', initials: 'AR', role: 'Organizer' };
  const links = window.EVENTFY_LINKS || { profile: '#', myEvents: '#', savedEvents: '#' };

  // Seed drawer text
  document.querySelectorAll('.drawer-user-name').forEach(el => el.textContent = user.name);
  document.querySelectorAll('.drawer-user-role').forEach(el => el.textContent = user.role);
  document.querySelectorAll('.drawer-avatar-text').forEach(el => el.textContent = user.initials);
  document.querySelectorAll('.user-initials-text').forEach(el => el.textContent = user.initials);

  /* ── 5. BUILD USER POPUP ────────────────────────── */
  // Determine which item is active based on current page
  const page = window.location.pathname;
  const isProfile   = page.includes('organizer-profile');
  const isMyEvents  = page.includes('organizer-dashboard');
  const isSaved     = page.includes('my-dashboard');

  const ic = {
    person:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
    heart:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
    logout:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  };

  function buildPopup() {
    return `
      <div class="popup-header">
        <div class="popup-user-row">
          <div class="popup-avatar" style="width:44px;height:44px;font-size:15px;">${user.initials}</div>
          <div>
            <div class="popup-user-name">${user.name}</div>
            <div class="popup-user-role">${user.role}</div>
          </div>
        </div>
      </div>
      <a href="${links.profile}"     class="popup-item ${isProfile  ? 'active' : ''}">${ic.person}   Profile Settings</a>
      <a href="${links.myEvents}"    class="popup-item ${isMyEvents ? 'active' : ''}">${ic.calendar} My Events</a>
      <a href="${links.savedEvents}" class="popup-item ${isSaved    ? 'active' : ''}">${ic.heart}    Saved Events</a>
      <a href="#"                    class="popup-item">${ic.settings} Settings</a>
      <div class="popup-sep"></div>
      <a href="#" class="popup-item danger btn-do-logout">${ic.logout} Log out</a>
    `;
  }

  ['userPopup', 'userPopupMob'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = buildPopup();
  });

  /* ── 6. LOGOUT ──────────────────────────────────── */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-do-logout');
    if (!btn) return;
    e.preventDefault();
    if (confirm('Are you sure you want to log out?')) alert('Logged out successfully!');
  });

})();
