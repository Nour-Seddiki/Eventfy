'use strict';
const USER = { name: 'Mohamed', initials: 'M', role: 'Member' };

/* ── On DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {

  /* scroll shadow on header */
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () =>
    header.classList.toggle('scrolled', window.scrollY > 10), { passive: true });

  /* ── DRAWER ── */
  const hamburgerBtn   = document.getElementById('hamburgerBtn');
  const navDrawer      = document.getElementById('navDrawer');
  const drawerOverlay  = document.getElementById('drawerOverlay');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');

  function openDrawer() {
    navDrawer.classList.add('open');
    drawerOverlay.classList.add('open');
    navDrawer.setAttribute('aria-hidden', 'false');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    hamburgerBtn.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    navDrawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
    navDrawer.setAttribute('aria-hidden', 'true');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburgerBtn.addEventListener('click', () =>
    navDrawer.classList.contains('open') ? closeDrawer() : openDrawer());
  drawerCloseBtn.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDrawer(); closeAllPopups(); } });
  document.querySelectorAll('.drawer-link').forEach(l => l.addEventListener('click', closeDrawer));

  /* ── USER POPUP (desktop + mobile) ── */
  const desktopAvatarBtn = document.getElementById('desktopAvatarBtn');
  const mobAvatarBtn     = document.getElementById('mobAvatarBtn');

  desktopAvatarBtn?.addEventListener('click', e => {
    e.stopPropagation();
    closeAllNotifPopups();
    togglePopup('userPopup');
  });
  mobAvatarBtn?.addEventListener('click', e => {
    e.stopPropagation();
    closeAllNotifPopups();
    togglePopup('userPopupMob');
  });

  /* ── NOTIFICATION POPUP (desktop + mobile) ── */
  const desktopNotifBtn = document.getElementById('desktopNotifBtn');
  const mobNotifBtn     = document.getElementById('mobNotifBtn');

  desktopNotifBtn?.addEventListener('click', e => {
    e.stopPropagation();
    closeAllUserPopups();
    togglePopup('notifPopupDesktop');
  });
  mobNotifBtn?.addEventListener('click', e => {
    e.stopPropagation();
    closeAllUserPopups();
    togglePopup('notifPopupMob');
  });

  /* close all popups on outside click */
  document.addEventListener('click', e => {
    if (!e.target.closest('.user-popup')  && !e.target.closest('.nav-user-avatar-btn') &&
        !e.target.closest('.notif-popup') && !e.target.closest('.nav-notif-btn')) {
      closeAllPopups();
    }
  });

  /* ── LOGOUT ── */
  document.querySelectorAll('.btn-do-logout').forEach(b => b.addEventListener('click', logout));

  /* ── RESIZE: reset layout when switching desktop ↔ mobile ── */
  let lastMobile = window.innerWidth <= 900;
  window.addEventListener('resize', () => {
    const isMobile = window.innerWidth <= 900;
    if (isMobile === lastMobile) return;
    lastMobile = isMobile;
    if (!isMobile) document.body.style.overflow = '';
  }, { passive: true });

  /* ── fill user info everywhere ── */
  renderUserInfo();
});

/* ══ USER INFO FILL ══ */
function renderUserInfo() {
  document.querySelectorAll('.user-initials-text').forEach(el => el.textContent = USER.initials);
  document.querySelectorAll('.user-name-text').forEach(el => el.textContent = USER.name);
  document.querySelectorAll('.user-role-text').forEach(el => el.textContent = USER.role);
}

/* ══ POPUP HELPERS ══ */
function togglePopup(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
}
function closeAllUserPopups() {
  document.getElementById('userPopup')    ?.classList.remove('open');
  document.getElementById('userPopupMob') ?.classList.remove('open');
}
function closeAllNotifPopups() {
  document.getElementById('notifPopupDesktop') ?.classList.remove('open');
  document.getElementById('notifPopupMob')     ?.classList.remove('open');
}
function closeAllPopups() {
  closeAllUserPopups();
  closeAllNotifPopups();
}

/* ══ LOGOUT (demo) ══ */
function logout() {
  closeAllPopups();
  alert('Logged out (demo)');
}
