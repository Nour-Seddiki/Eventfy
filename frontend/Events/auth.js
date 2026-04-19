/* ============================================================
   auth.js  —  Shared auth state for Eventfy (Events page)
   Uses api.js functions for actual authentication
   ============================================================ */
'use strict';

/* ============================================================
   PUBLIC: call after DOM ready
   ============================================================ */
function authInit() {
  const loggedIn = typeof isLoggedIn === 'function' ? isLoggedIn() : false;

  /* wire login / register buttons */
  document.querySelectorAll('.btn-do-login, .btn-drawer-login-do, .btn-nav-login-do')
    .forEach(b => b.addEventListener('click', () => {
      window.location.href = '../login/index.html';
    }));
  document.querySelectorAll('.btn-do-register, .btn-drawer-register-do, .btn-nav-register-do')
    .forEach(b => b.addEventListener('click', () => {
      window.location.href = '../signup/index.html';
    }));

  /* wire logout buttons */
  document.querySelectorAll('.btn-do-logout')
    .forEach(b => b.addEventListener('click', () => {
      if (typeof clearToken === 'function') clearToken();
      window.location.href = '../login/index.html';
    }));

  /* wire user avatar popup toggle — desktop and mobile */
  const desktopAvatarBtn = document.getElementById('desktopAvatarBtn') ||
                           document.getElementById('navUserAvatarBtn');
  const mobAvatarBtn     = document.getElementById('mobAvatarBtn');

  desktopAvatarBtn?.addEventListener('click', e => {
    e.stopPropagation();
    closeAllNotifPopups();
    toggleUserPopup('desktop');
  });
  mobAvatarBtn?.addEventListener('click', e => {
    e.stopPropagation();
    closeAllNotifPopups();
    toggleUserPopup('mob');
  });

  /* wire notification buttons — desktop and mobile */
  const desktopNotifBtn = document.getElementById('desktopNotifBtn');
  const mobNotifBtn     = document.getElementById('mobNotifBtn');
  desktopNotifBtn?.addEventListener('click', e => {
    e.stopPropagation();
    closeAllUserPopups();
    toggleNotifPopup('desktop');
  });
  mobNotifBtn?.addEventListener('click', e => {
    e.stopPropagation();
    closeAllUserPopups();
    toggleNotifPopup('mob');
  });

  /* close all popups on outside click */
  document.addEventListener('click', e => {
    if (!e.target.closest('.user-popup')  && !e.target.closest('.nav-user-avatar-btn') &&
        !e.target.closest('.notif-popup') && !e.target.closest('.nav-notif-btn')) {
      closeAllUserPopups();
      closeAllNotifPopups();
    }
  });

  /* close all popups on ESC */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeAllUserPopups(); closeAllNotifPopups(); }
  });

  renderNav(loggedIn);
}

/* ============================================================
   NAV RENDER
   ============================================================ */
function renderNav(loggedIn) {
  document.querySelectorAll('.nav-logged-out').forEach(el =>
    el.style.display = loggedIn ? 'none' : '');
  document.querySelectorAll('.nav-logged-in').forEach(el =>
    el.style.display = loggedIn ? 'flex' : 'none');
  document.querySelectorAll('.drawer-logged-out').forEach(el =>
    el.style.display = loggedIn ? 'none' : 'flex');
  document.querySelectorAll('.drawer-logged-in').forEach(el =>
    el.style.display = loggedIn ? 'flex' : 'none');

  // Populate user data from cached profile
  if (loggedIn && typeof getCachedUser === 'function') {
    const user = getCachedUser();
    if (user) {
      const initials = user.username
        ? user.username.substring(0, 2).toUpperCase()
        : 'U';
      document.querySelectorAll('.user-initials-text').forEach(el => el.textContent = initials);
      document.querySelectorAll('.user-name-text').forEach(el => el.textContent = user.username || 'User');
      document.querySelectorAll('.user-role-text').forEach(el => el.textContent = user.role || 'attendee');
    }
  }
}

/* ============================================================
   USER POPUP — desktop + mobile
   ============================================================ */
function toggleUserPopup(which) {
  const desktopPopup = document.getElementById('userPopup');
  const mobPopup     = document.getElementById('userPopupMob');
  if (which === 'mob') {
    desktopPopup?.classList.remove('open');
    mobPopup?.classList.toggle('open');
  } else {
    mobPopup?.classList.remove('open');
    desktopPopup?.classList.toggle('open');
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
    desktopPopup?.classList.remove('open');
    mobPopup?.classList.toggle('open');
  } else {
    mobPopup?.classList.remove('open');
    desktopPopup?.classList.toggle('open');
  }
}
function closeAllNotifPopups() {
  document.getElementById('notifPopupDesktop') ?.classList.remove('open');
  document.getElementById('notifPopupMob')     ?.classList.remove('open');
}
