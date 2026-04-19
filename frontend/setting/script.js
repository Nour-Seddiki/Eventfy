'use strict';
/**
 * EVENTFY SETTINGS — Main JS
 * Handles: tab switching, sidebar toggle, profile editing
 * NOTE: All navbar interactions (drawer, popups, auth state) are handled by navbar.js
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Sidebar toggle (mobile collapse) ── */
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarNav    = document.getElementById('sidebarNav');

  if (sidebarToggle && sidebarNav) {
    sidebarToggle.addEventListener('click', () => {
      const isOpen = sidebarNav.classList.toggle('open');
      sidebarToggle.classList.toggle('open', isOpen);
      sidebarToggle.setAttribute('aria-expanded', isOpen);
    });
  }

  /* ── Load real user data from cache / API ── */
  async function loadUserData() {
    let user = getCachedUser();
    if (user) {
      fillProfileUI(user);
    }
    // Refresh from API
    try {
      const fresh = await fetchMyProfile();
      setCachedUser(fresh);
      fillProfileUI(fresh);
    } catch(e) { /* use cached */ }
  }

  function fillProfileUI(user) {
    if (!user) return;
    const name = user.full_name || user.username || 'User';
    const email = user.email || '—';
    const initials = name.substring(0,2).toUpperCase();

    // Profile card
    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = name;
    const initialsEl = document.getElementById('profileAvatarInitials');
    if (initialsEl) initialsEl.textContent = initials;
    const emailEl = document.getElementById('profileEmail');
    if (emailEl) emailEl.textContent = email;

    // Pre-fill edit form with real values
    const editNameEl = document.getElementById('editName');
    if (editNameEl) editNameEl.value = name;
    const editEmailEl = document.getElementById('editEmail');
    if (editEmailEl) editEmailEl.value = email;
    if (user.bio) {
      const editBioEl = document.getElementById('editBio');
      if (editBioEl) editBioEl.value = user.bio;
      const bioEl = document.getElementById('profileBio');
      if (bioEl) bioEl.textContent = user.bio;
    }
    if (user.phone) {
      const editPhoneEl = document.getElementById('editPhone');
      if (editPhoneEl) editPhoneEl.value = user.phone;
      const phoneEl = document.getElementById('profilePhone');
      if (phoneEl) phoneEl.textContent = user.phone;
    }
    if (user.location) {
      const editLocEl = document.getElementById('editLocation');
      if (editLocEl) editLocEl.value = user.location;
      const locEl = document.getElementById('profileLocation');
      if (locEl) locEl.textContent = user.location;
    }
  }

  loadUserData();

  /* ── Activate default tab ── */
  switchTab('account');

  /* ── Photo upload ── */
  const photoInput = document.getElementById('photoInput');
  if (photoInput) {
    photoInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = evt => {
        const img = document.getElementById('profileAvatarImg');
        const initials = document.getElementById('profileAvatarInitials');
        if (img) { img.src = evt.target.result; img.style.display = 'block'; }
        if (initials) initials.style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
  }
});

/* ═══════════════════════════════
   TAB SWITCHING
═══════════════════════════════ */
function switchTab(tabId) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-link[data-tab]').forEach(b => b.classList.remove('active'));

  const section = document.getElementById('section-' + tabId);
  if (section) section.classList.add('active');

  const navBtn = document.querySelector(`.sidebar-link[data-tab="${tabId}"]`);
  if (navBtn) navBtn.classList.add('active');

  const sidebarNav = document.getElementById('sidebarNav');
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarNav && sidebarNav.classList.contains('open')) {
    sidebarNav.classList.remove('open');
    sidebarToggle?.classList.remove('open');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ═══════════════════════════════
   EDIT PROFILE MODAL
═══════════════════════════════ */
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
  const name     = document.getElementById('editName')?.value.trim();
  const bio      = document.getElementById('editBio')?.value.trim();
  const email    = document.getElementById('editEmail')?.value.trim();
  const phone    = document.getElementById('editPhone')?.value.trim();
  const socials  = document.getElementById('editSocials')?.value.trim();
  const location = document.getElementById('editLocation')?.value.trim();

  if (name)     { const el = document.getElementById('profileName'); if(el) el.textContent = name; }
  if (bio)      { const el = document.getElementById('profileBio'); if(el) el.textContent = bio; }
  if (email)    { const el = document.getElementById('profileEmail'); if(el) el.textContent = email; }
  if (phone)    { const el = document.getElementById('profilePhone'); if(el) el.textContent = phone; }
  if (socials)  { const el = document.getElementById('profileSocials'); if(el) el.textContent = socials; }
  if (location) { const el = document.getElementById('profileLocation'); if(el) el.textContent = location; }

  if (name) {
    const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    const avatarInitials = document.getElementById('profileAvatarInitials');
    if (avatarInitials && document.getElementById('profileAvatarImg')?.style.display === 'none') {
      avatarInitials.textContent = initials;
    }
  }

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
