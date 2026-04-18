'use strict';

/* ══════════════════════════════════════════
   saved-events.js
   Navbar: drawer, user popup, notif popup
   Always logged-in — no login/register
══════════════════════════════════════════ */

const USER = { name: 'Yacine Salhi', initials: 'YS', role: 'Member' };

document.addEventListener('DOMContentLoaded', () => {

  /* ── Scroll shadow ── */
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
  document.querySelectorAll('.drawer-link').forEach(l => l.addEventListener('click', closeDrawer));

  /* ── USER POPUP ── */
  document.getElementById('desktopAvatarBtn')?.addEventListener('click', e => {
    e.stopPropagation(); closeAllNotifPopups(); togglePopup('userPopup');
  });
  document.getElementById('mobAvatarBtn')?.addEventListener('click', e => {
    e.stopPropagation(); closeAllNotifPopups(); togglePopup('userPopupMob');
  });

  /* ── NOTIFICATION POPUP ── */
  document.getElementById('desktopNotifBtn')?.addEventListener('click', e => {
    e.stopPropagation(); closeAllUserPopups(); togglePopup('notifPopupDesktop');
  });
  document.getElementById('mobNotifBtn')?.addEventListener('click', e => {
    e.stopPropagation(); closeAllUserPopups(); togglePopup('notifPopupMob');
  });

  /* ── Close on outside click ── */
  document.addEventListener('click', e => {
    if (!e.target.closest('.user-popup')  && !e.target.closest('.nav-user-avatar-btn') &&
        !e.target.closest('.notif-popup') && !e.target.closest('.nav-notif-btn')) {
      closeAllUserPopups(); closeAllNotifPopups();
    }
  });

  /* ── ESC closes everything ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeDrawer(); closeAllUserPopups(); closeAllNotifPopups(); }
  });

  /* ── Logout ── */
  document.querySelectorAll('.btn-do-logout').forEach(b =>
    b.addEventListener('click', () => { closeAllUserPopups(); closeAllNotifPopups(); }));

  /* ── Fill user info ── */
  document.querySelectorAll('.user-initials-text').forEach(el => el.textContent = USER.initials);
  document.querySelectorAll('.user-name-text').forEach(el => el.textContent = USER.name);
  document.querySelectorAll('.user-role-text').forEach(el => el.textContent = USER.role);

  /* ── Fav button toggle ── */
  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      btn.classList.toggle('fav-active');
      const svg = btn.querySelector('svg');
      if (btn.classList.contains('fav-active')) {
        svg.style.fill = '#ef4444';
        svg.style.color = '#ef4444';
      } else {
        svg.style.fill = 'var(--purple)';
        svg.style.color = 'var(--purple)';
      }
    });
  });
});

/* ── Popup helpers ── */
function togglePopup(id) { document.getElementById(id)?.classList.toggle('open'); }
function closeAllUserPopups() {
  document.getElementById('userPopup')    ?.classList.remove('open');
  document.getElementById('userPopupMob') ?.classList.remove('open');
}
function closeAllNotifPopups() {
  document.getElementById('notifPopupDesktop') ?.classList.remove('open');
  document.getElementById('notifPopupMob')     ?.classList.remove('open');
}
