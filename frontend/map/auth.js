/* ============================================================
   auth.js  —  Shared auth state for Eventfy (index + browse)
   ============================================================ */
'use strict';

/* ── user data (replace with real API later) ── */
const USER = { name: 'Yacine Salhi', initials: 'YS', role: 'Member' };

/* ── state ── */
let isLoggedIn = false;

/* ============================================================
   PUBLIC: call after DOM ready
   ============================================================ */
function authInit() {
  /* wire login / register buttons */
  document.querySelectorAll('.btn-do-login, .btn-drawer-login-do, .btn-nav-login-do')
    .forEach(b => b.addEventListener('click', login));
  document.querySelectorAll('.btn-do-register, .btn-drawer-register-do, .btn-nav-register-do')
    .forEach(b => b.addEventListener('click', login));       /* demo: register also logs in */

  /* wire logout buttons */
  document.querySelectorAll('.btn-do-logout')
    .forEach(b => b.addEventListener('click', logout));

  /* wire user avatar popup toggle — desktop and mobile */
  document.querySelectorAll('.nav-user-avatar-btn')
    .forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      closeAllNotifPopups();
      const isMob = b.id === 'mobAvatarBtn';
      toggleUserPopup(isMob ? 'mob' : 'desktop');
    }));

  /* wire notification buttons — desktop and mobile */
  const desktopNotifBtn = document.getElementById('desktopNotifBtn');
  const mobNotifBtn     = document.getElementById('mobNotifBtn');
  if (desktopNotifBtn) desktopNotifBtn.addEventListener('click', e => {
    e.stopPropagation(); closeAllUserPopups(); toggleNotifPopup('desktop');
  });
  if (mobNotifBtn) mobNotifBtn.addEventListener('click', e => {
    e.stopPropagation(); closeAllUserPopups(); toggleNotifPopup('mob');
  });

  /* close all popups on outside click */
  document.addEventListener('click', e => {
    if (!e.target.closest('.user-popup') && !e.target.closest('.nav-user-avatar-btn') &&
        !e.target.closest('.notif-popup') && !e.target.closest('.nav-notif-btn')) {
      closeAllUserPopups();
      closeAllNotifPopups();
    }
  });

  /* close all popups on ESC */
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAllUserPopups(); closeAllNotifPopups(); } });

  renderNav();
}

/* ============================================================
   AUTH ACTIONS
   ============================================================ */
function login()  { isLoggedIn = true;  renderNav(); }
function logout() { isLoggedIn = false; closeUserPopup(); renderNav(); }

/* ============================================================
   NAV RENDER
   ============================================================ */
function renderNav() {
  /* ── desktop: logged-out elements ── */
  document.querySelectorAll('.nav-logged-out').forEach(el =>
    el.style.display = isLoggedIn ? 'none' : '');

  /* ── desktop: logged-in elements ── */
  document.querySelectorAll('.nav-logged-in').forEach(el =>
    el.style.display = isLoggedIn ? 'flex' : 'none');

  /* ── drawer: logged-out section ── */
  document.querySelectorAll('.drawer-logged-out').forEach(el =>
    el.style.display = isLoggedIn ? 'none' : 'flex');

  /* ── drawer: logged-in section ── */
  document.querySelectorAll('.drawer-logged-in').forEach(el =>
    el.style.display = isLoggedIn ? 'flex' : 'none');

  /* ── fill in user name / initials wherever used ── */
  document.querySelectorAll('.user-initials-text').forEach(el =>
    el.textContent = USER.initials);
  document.querySelectorAll('.user-name-text').forEach(el =>
    el.textContent = USER.name);
  document.querySelectorAll('.user-role-text').forEach(el =>
    el.textContent = USER.role);
}

/* ============================================================
   USER POPUP (profile dropdown) — desktop + mobile
   ============================================================ */
function toggleUserPopup(which) {
  const desktopPopup = document.getElementById('userPopup');
  const mobPopup     = document.getElementById('userPopupMob');
  if (which === 'mob') {
    if (desktopPopup) desktopPopup.classList.remove('open');
    if (mobPopup)     mobPopup.classList.toggle('open');
  } else {
    if (mobPopup)     mobPopup.classList.remove('open');
    if (desktopPopup) desktopPopup.classList.toggle('open');
  }
}
function closeAllUserPopups() {
  document.getElementById('userPopup')    ?.classList.remove('open');
  document.getElementById('userPopupMob') ?.classList.remove('open');
}
function closeUserPopup() { closeAllUserPopups(); }

/* ============================================================
   NOTIFICATION POPUP — desktop + mobile
   ============================================================ */
function toggleNotifPopup(which) {
  const desktopPopup = document.getElementById('notifPopupDesktop');
  const mobPopup     = document.getElementById('notifPopupMob');
  if (which === 'mob') {
    if (desktopPopup) desktopPopup.classList.remove('open');
    if (mobPopup)     mobPopup.classList.toggle('open');
  } else {
    if (mobPopup)     mobPopup.classList.remove('open');
    if (desktopPopup) desktopPopup.classList.toggle('open');
  }
}
function closeAllNotifPopups() {
  document.getElementById('notifPopupDesktop') ?.classList.remove('open');
  document.getElementById('notifPopupMob')     ?.classList.remove('open');
}
