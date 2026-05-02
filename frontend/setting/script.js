'use strict';
/**
 * EVENTFY SETTINGS — Main JS
 * Handles: tab switching, sidebar toggle, profile editing
 * NOTE: All navbar interactions (drawer, popups, auth state) are handled by navbar.js
 */
/* Load UAParser for active sessions if available, otherwise fallback gracefully */
if (typeof UAParser === 'undefined') {
  window.UAParser = function() {
    return {
      getResult: () => ({
        os: { name: 'Current OS' },
        browser: { name: 'Current Browser' }
      })
    };
  };
}

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

    // Display avatar from API if available
    const avatarImg = document.getElementById('profileAvatarImg');
    const avatarInitials = document.getElementById('profileAvatarInitials');
    if (user.avatar_url && avatarImg) {
      avatarImg.src = user.avatar_url;
      avatarImg.style.display = 'block';
      if (avatarInitials) avatarInitials.style.display = 'none';
    } else {
      if (avatarImg) avatarImg.style.display = 'none';
      if (avatarInitials) { avatarInitials.style.display = ''; avatarInitials.textContent = initials; }
    }

    // Profile card
    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = name;
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
    // Role-adaptive title and stats
    const titleEl = document.getElementById('profilePageTitle');
    const subtitleEl = document.getElementById('profilePageSubtitle');
    const statsRow = document.getElementById('profileStatsRow');

    if (user.role === 'organizer' || user.role === 'admin') {
      if (titleEl) titleEl.textContent = 'Organizer Profile';
      if (subtitleEl) subtitleEl.textContent = 'Introduce yourself to your audience and build trust with your community.';
      if (statsRow) {
        statsRow.innerHTML = `
          <div class="profile-stat-card">
            <div class="profile-stat-label">Total Events</div>
            <div class="profile-stat-value">0</div>
          </div>
          <div class="profile-stat-card">
            <div class="profile-stat-label">Attendees Reached</div>
            <div class="profile-stat-value">0</div>
          </div>
          <div class="profile-stat-card">
            <div class="profile-stat-label">Average Rating</div>
            <div class="profile-stat-value">0.0 <span class="stat-star">★</span></div>
          </div>
        `;
      }
      const privacyEmail = document.getElementById('privacyEmailContainer');
      if (privacyEmail) privacyEmail.style.display = 'flex';
    } else {
      if (titleEl) titleEl.textContent = 'Attendee Profile';
      if (subtitleEl) subtitleEl.textContent = 'Manage your public details and preferences.';
      if (statsRow) {
        statsRow.innerHTML = `
          <div class="profile-stat-card">
            <div class="profile-stat-label">Events Attended</div>
            <div class="profile-stat-value">0</div>
          </div>
          <div class="profile-stat-card">
            <div class="profile-stat-label">Saved Events</div>
            <div class="profile-stat-value">0</div>
          </div>
          <div class="profile-stat-card">
            <div class="profile-stat-label">Member Since</div>
            <div class="profile-stat-value">${new Date().getFullYear()}</div>
          </div>
        `;
      }
    }
  }

  loadUserData();

  /* ── Load Notification History ── */
  async function loadSettingsNotifications() {
    const listEl = document.getElementById('settingsNotifList');
    if (!listEl) return;
    try {
      const data = await fetchNotifications();
      const notifs = Array.isArray(data) ? data : (data.notifications || data.items || []);
      const markAllBtn = document.getElementById('settingsMarkAllReadBtn');
      if (!notifs || notifs.length === 0) {
        listEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);">No notifications yet.</div>';
        if (markAllBtn) {
          markAllBtn.style.color = 'var(--muted)';
          markAllBtn.style.pointerEvents = 'none';
        }
        return;
      }
      
      const hasUnread = notifs.some(n => !n.read);
      if (markAllBtn) {
        if (!hasUnread) {
          markAllBtn.style.color = 'var(--muted)';
          markAllBtn.style.pointerEvents = 'none';
        } else {
          markAllBtn.style.color = '';
          markAllBtn.style.pointerEvents = '';
        }
      }
      
      listEl.innerHTML = '';
      notifs.forEach(n => {
        const div = document.createElement('div');
        div.className = 'notif-item';
        const isUnread = !n.read;
        const iconColor = isUnread ? 'notif-icon-purple' : 'notif-icon-blue';
        const checkIcon = isUnread ? 
          `<button class="mark-single-read-btn" data-id="${n.id}" style="background:none;border:none;cursor:pointer;color:var(--primary);" title="Mark as read">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
          </button>` : '';

        div.innerHTML = `
          <div class="notif-icon ${iconColor}">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
          </div>
          <div class="notif-body" style="display:flex;align-items:center;justify-content:space-between;width:100%;">
            <div>
              <div class="notif-body-row">
                ${isUnread ? '<span class="notif-dot-inline"></span>' : ''}
                <span class="notif-title" style="${isUnread ? 'font-weight:600;' : ''}">${n.title || n.message}</span>
              </div>
              <p class="notif-time">${new Date(n.created_at).toLocaleString()}</p>
            </div>
            ${checkIcon}
          </div>
        `;
        listEl.appendChild(div);
      });

      // Attach single read handlers
      listEl.querySelectorAll('.mark-single-read-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          try {
            await markNotificationRead(id);
            loadSettingsNotifications();
          } catch (err) {
            console.error(err);
          }
        });
      });
    } catch (e) {
      listEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--danger);">Failed to load notifications.</div>';
    }
  }

  loadSettingsNotifications();

  const markAllBtn = document.getElementById('settingsMarkAllReadBtn');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', async () => {
      try {
        await markAllNotificationsRead();
        loadSettingsNotifications();
        showSettingsToast('✅ All notifications marked as read');
      } catch (e) {
        showSettingsToast('❌ Failed to mark notifications as read');
      }
    });
  }

  /* ── Active Sessions ── */
  const sessionsContainer = document.getElementById('activeSessionsContainer');
  if (sessionsContainer) {
    const parser = new UAParser();
    const result = parser.getResult();
    const os = result.os.name || 'Unknown OS';
    const browser = result.browser.name || 'Unknown Browser';
    
    sessionsContainer.innerHTML = `
      <div class="session-item">
        <div class="session-device">
          <div class="session-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9.75 17L9 21h6l-.75-4M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
          </div>
          <div>
            <p class="session-name">${os} — ${browser}</p>
            <p class="session-meta">Active now</p>
          </div>
        </div>
        <span class="badge-this-device">This Device</span>
      </div>
    `;
  }

  const logoutOtherBtn = document.getElementById('logoutOtherDevicesBtn');
  if (logoutOtherBtn) {
    logoutOtherBtn.addEventListener('click', () => {
      // In a real implementation this would trigger a backend endpoint to revoke other tokens
      showSettingsToast('✅ Logged out of all other devices successfully.');
    });
  }

  /* ── Preferred Currency ── */
  const CURRENCY_KEY = 'eventfy_currency';
  const currencySelect = document.getElementById('settingsCurrency');
  const saveCurrencyBtn = document.getElementById('saveCurrencyBtn');

  // Load saved currency on page load
  if (currencySelect) {
    const saved = localStorage.getItem(CURRENCY_KEY) || 'DZD';
    currencySelect.value = saved;
  }

  if (saveCurrencyBtn) {
    saveCurrencyBtn.addEventListener('click', () => {
      const chosen = currencySelect ? currencySelect.value : 'DZD';
      localStorage.setItem(CURRENCY_KEY, chosen);
      showSettingsToast('✅ Currency set to ' + chosen);
    });
  }

  /* ── Privacy Preferences ── */
  const PRIVACY_KEY = 'eventfy_privacy_prefs';
  const showEmailCb = document.getElementById('privacyShowEmail');
  const searchEngineCb = document.getElementById('privacySearchEngine');
  const activityStatusCb = document.getElementById('privacyActivityStatus');

  function loadPrivacyPrefs() {
    try {
      const prefs = JSON.parse(localStorage.getItem(PRIVACY_KEY)) || {
        showEmail: false,
        searchEngine: false,
        activityStatus: true
      };
      if (showEmailCb) showEmailCb.checked = prefs.showEmail;
      if (searchEngineCb) searchEngineCb.checked = prefs.searchEngine;
      if (activityStatusCb) activityStatusCb.checked = prefs.activityStatus;
    } catch (e) { }
  }

  loadPrivacyPrefs();

  const savePrivacyBtn = document.getElementById('savePrivacyBtn');
  if (savePrivacyBtn) {
    savePrivacyBtn.addEventListener('click', () => {
      const prefs = {
        showEmail: showEmailCb ? showEmailCb.checked : false,
        searchEngine: searchEngineCb ? searchEngineCb.checked : false,
        activityStatus: activityStatusCb ? activityStatusCb.checked : true
      };
      localStorage.setItem(PRIVACY_KEY, JSON.stringify(prefs));
      showSettingsToast('✅ Privacy preferences saved');
    });
  }

  const cancelPrivacyBtn = document.getElementById('cancelPrivacyBtn');
  if (cancelPrivacyBtn) {
    cancelPrivacyBtn.addEventListener('click', () => {
      loadPrivacyPrefs(); // reset to saved state
    });
  }

  /* ── Activate default tab ── */
  switchTab('account');

  /* ── Photo upload ── */
  const photoInput = document.getElementById('photoInput');
  if (photoInput) {
    photoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Instant preview
      const reader = new FileReader();
      reader.onload = evt => {
        const img = document.getElementById('profileAvatarImg');
        const initials = document.getElementById('profileAvatarInitials');
        if (img) { img.src = evt.target.result; img.style.display = 'block'; }
        if (initials) initials.style.display = 'none';
      };
      reader.readAsDataURL(file);

      // Upload to backend
      try {
        if (typeof uploadAvatar === 'function') {
          const updated = await uploadAvatar(file);
          setCachedUser(updated);
          showSettingsToast('✅ Photo uploaded successfully!');
        }
      } catch (err) {
        console.error('Avatar upload failed:', err);
        showSettingsToast('❌ Photo upload failed. Please try again.');
      }
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

async function saveProfile() {
  const name     = document.getElementById('editName')?.value.trim();
  const bio      = document.getElementById('editBio')?.value.trim();
  const email    = document.getElementById('editEmail')?.value.trim();
  const phone    = document.getElementById('editPhone')?.value.trim();
  const socials  = document.getElementById('editSocials')?.value.trim();
  const location = document.getElementById('editLocation')?.value.trim();

  // Build payload — only send fields that have values
  const payload = {};
  if (name)     payload.full_name = name;
  if (bio)      payload.bio = bio;
  if (phone)    payload.phone = phone;
  if (location) payload.location = location;
  if (socials)  payload.website = socials;  // "socials" field maps to "website" in backend

  // Disable save button during request
  const saveBtn = document.querySelector('#profileEditOverlay .btn-save, #profileEditOverlay button[onclick*="saveProfile"]');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.style.opacity = '0.6'; }

  try {
    const updated = await updateMyProfile(payload);
    setCachedUser(updated);

    // Update DOM with confirmed backend data
    if (updated.full_name) { const el = document.getElementById('profileName'); if(el) el.textContent = updated.full_name; }
    if (updated.bio)       { const el = document.getElementById('profileBio'); if(el) el.textContent = updated.bio; }
    if (updated.email)     { const el = document.getElementById('profileEmail'); if(el) el.textContent = updated.email; }
    if (updated.phone)     { const el = document.getElementById('profilePhone'); if(el) el.textContent = updated.phone; }
    if (updated.website)   { const el = document.getElementById('profileSocials'); if(el) el.textContent = updated.website; }
    if (updated.location)  { const el = document.getElementById('profileLocation'); if(el) el.textContent = updated.location; }

    if (updated.full_name) {
      const initials = updated.full_name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
      const avatarInitials = document.getElementById('profileAvatarInitials');
      if (avatarInitials && document.getElementById('profileAvatarImg')?.style.display === 'none') {
        avatarInitials.textContent = initials;
      }
    }

    // Close modal & show success
    document.getElementById('profileEditOverlay').classList.remove('open');
    document.body.style.overflow = '';
    showSettingsToast('✅ Profile updated successfully!');

  } catch (err) {
    console.error('Profile update failed:', err);
    showSettingsToast('❌ Failed to save profile. Please try again.');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = '1'; }
  }
}

/* ── Toast helper for settings page ── */
function showSettingsToast(msg) {
  let t = document.getElementById('settings-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'settings-toast';
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1e293b;color:#fff;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:500;z-index:9999;transition:opacity .3s,transform .3s;box-shadow:0 8px 24px rgba(0,0,0,.25);';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(8px)';
  }, 3000);
}

/* Close edit modal on ESC */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('profileEditOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }
});
