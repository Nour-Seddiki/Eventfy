'use strict';
/* ══════════════════════════════════════════
   EVENTFY SETTINGS — Main JS
   Handles: navbar, drawer, popups, tab switching
══════════════════════════════════════════ */

const USER = { name: 'Mohamed', initials: 'M', role: 'Member' };

document.addEventListener('DOMContentLoaded', () => {

  /* ── Fill user info ── */
  document.querySelectorAll('.user-initials-text').forEach(el => el.textContent = USER.initials);
  document.querySelectorAll('.user-name-text').forEach(el => el.textContent = USER.name);
  document.querySelectorAll('.user-role-text').forEach(el => el.textContent = USER.role);

  /* ══════════════════════════════════════════
     SCROLL SHADOW
  ══════════════════════════════════════════ */
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () =>
    header.classList.toggle('scrolled', window.scrollY > 10), { passive: true });

  /* ══════════════════════════════════════════
     MOBILE DRAWER
  ══════════════════════════════════════════ */
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

  /* ══════════════════════════════════════════
     SIDEBAR TOGGLE (mobile collapse)
  ══════════════════════════════════════════ */
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarNav    = document.getElementById('sidebarNav');

  if (sidebarToggle && sidebarNav) {
    sidebarToggle.addEventListener('click', () => {
      const isOpen = sidebarNav.classList.toggle('open');
      sidebarToggle.classList.toggle('open', isOpen);
      sidebarToggle.setAttribute('aria-expanded', isOpen);
    });
  }

  /* ══════════════════════════════════════════
     USER POPUP
  ══════════════════════════════════════════ */
  document.getElementById('desktopAvatarBtn')?.addEventListener('click', e => {
    e.stopPropagation(); closeAllNotifPopups(); togglePopup('userPopup');
  });
  document.getElementById('mobAvatarBtn')?.addEventListener('click', e => {
    e.stopPropagation(); closeAllNotifPopups(); togglePopup('userPopupMob');
  });

  /* ══════════════════════════════════════════
     NOTIFICATION POPUP
  ══════════════════════════════════════════ */
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

  /* ══════════════════════════════════════════
     TAB SWITCHING
  ══════════════════════════════════════════ */
  // Activate default tab (account)
  switchTab('account');
});

/* ══════════════════════════════════════════
   TAB SWITCHING
══════════════════════════════════════════ */
function switchTab(tabId) {
  // 1. Hide all sections
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

  // 2. Remove active from sidebar links
  document.querySelectorAll('.sidebar-link[data-tab]').forEach(b => b.classList.remove('active'));

  // 3. Show target section
  const section = document.getElementById('section-' + tabId);
  if (section) section.classList.add('active');

  // 4. Activate sidebar link
  const navBtn = document.querySelector(`.sidebar-link[data-tab="${tabId}"]`);
  if (navBtn) navBtn.classList.add('active');

  // 5. Close mobile sidebar after selection
  const sidebarNav = document.getElementById('sidebarNav');
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarNav && sidebarNav.classList.contains('open')) {
    sidebarNav.classList.remove('open');
    sidebarToggle?.classList.remove('open');
  }

  // 6. Scroll top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ══════════════════════════════════════════
   POPUP HELPERS
══════════════════════════════════════════ */
function togglePopup(id) { document.getElementById(id)?.classList.toggle('open'); }
function closeAllUserPopups() {
  document.getElementById('userPopup')   ?.classList.remove('open');
  document.getElementById('userPopupMob')?.classList.remove('open');
}
function closeAllNotifPopups() {
  document.getElementById('notifPopupDesktop')?.classList.remove('open');
  document.getElementById('notifPopupMob')    ?.classList.remove('open');
}

/* ══════════════════════════════════════════
   ACCOUNT — ORGANIZER PROFILE
══════════════════════════════════════════ */

/* ── Photo upload ── */
document.addEventListener('DOMContentLoaded', () => {
  const photoInput = document.getElementById('photoInput');
  if (photoInput) {
    photoInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = evt => {
        const img = document.getElementById('profileAvatarImg');
        const initials = document.getElementById('profileAvatarInitials');
        img.src = evt.target.result;
        img.style.display = 'block';
        if (initials) initials.style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
  }
});

/* ── Edit profile modal ── */
function openEditProfile() {
  document.getElementById('profileEditOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeEditProfile(e) {
  if (e && e.target !== document.getElementById('profileEditOverlay')) return;
  document.getElementById('profileEditOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function saveProfile() {
  // Read form values
  const name     = document.getElementById('editName').value.trim();
  const bio      = document.getElementById('editBio').value.trim();
  const email    = document.getElementById('editEmail').value.trim();
  const phone    = document.getElementById('editPhone').value.trim();
  const socials  = document.getElementById('editSocials').value.trim();
  const location = document.getElementById('editLocation').value.trim();

  // Update displayed values
  if (name)     document.getElementById('profileName').textContent     = name;
  if (bio)      document.getElementById('profileBio').textContent      = bio;
  if (email)    document.getElementById('profileEmail').textContent    = email;
  if (phone)    document.getElementById('profilePhone').textContent    = phone;
  if (socials)  document.getElementById('profileSocials').textContent  = socials;
  if (location) document.getElementById('profileLocation').textContent = location;

  // Update avatar initials if name changed
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  document.querySelectorAll('.user-initials-text').forEach(el => el.textContent = initials);
  const avatarInitials = document.getElementById('profileAvatarInitials');
  if (avatarInitials && document.getElementById('profileAvatarImg').style.display === 'none') {
    avatarInitials.textContent = initials;
  }

  // Close modal
  document.getElementById('profileEditOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* Close edit modal on ESC */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('profileEditOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }
});
