/**
 * EVENTFY — MY DASHBOARD PAGE LOGIC
 * Fetches real user data + tickets from the backend API.
 * Also handles navbar interactions (drawer, popups, logout).
 */
(function () {
  'use strict';

  /* ── SVG icons ── */
  const calSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
    <rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>`;
  const pinSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
    <path d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 13 6 13s6-7.75 6-13c0-3.314-2.686-6-6-6z"/>
    <circle cx="12" cy="8" r="2"/>
  </svg>`;

  /* ══════════════════════════════════
     NAVBAR — drawer, popups, scroll
  ══════════════════════════════════ */
  function initNavbar() {
    const header       = document.getElementById('siteHeader');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navDrawer    = document.getElementById('navDrawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const drawerCloseBtn = document.getElementById('drawerCloseBtn');

    /* Scroll shadow */
    window.addEventListener('scroll', () => {
      if (header) header.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

    /* Drawer */
    function openDrawer() {
      navDrawer.classList.add('open');
      drawerOverlay.classList.add('open');
      hamburgerBtn.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
      navDrawer.classList.remove('open');
      drawerOverlay.classList.remove('open');
      hamburgerBtn.classList.remove('open');
      document.body.style.overflow = '';
    }

    hamburgerBtn?.addEventListener('click', () =>
      navDrawer.classList.contains('open') ? closeDrawer() : openDrawer());
    drawerCloseBtn?.addEventListener('click', closeDrawer);
    drawerOverlay?.addEventListener('click', closeDrawer);
    document.querySelectorAll('.drawer-link').forEach(l =>
      l.addEventListener('click', closeDrawer));

    /* User popup */
    document.getElementById('desktopAvatarBtn')?.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('userPopup')?.classList.toggle('open');
    });

    /* Notification popup */
    document.getElementById('desktopNotifBtn')?.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('notifPopupDesktop')?.classList.toggle('open');
    });
    document.getElementById('mobNotifBtn')?.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('notifPopupMob')?.classList.toggle('open');
    });

    /* Close popups on outside click */
    document.addEventListener('click', e => {
      if (!e.target.closest('.user-popup') && !e.target.closest('.nav-user-avatar-btn')) {
        document.getElementById('userPopup')?.classList.remove('open');
      }
      if (!e.target.closest('.notif-popup') && !e.target.closest('.nav-notif-btn')) {
        document.getElementById('notifPopupDesktop')?.classList.remove('open');
        document.getElementById('notifPopupMob')?.classList.remove('open');
      }
    });

    /* ESC closes everything */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeDrawer(); }
    });
  }

  /* ══════════════════════════════════
     USER DATA — populate navbar
  ══════════════════════════════════ */
  function populateUserUI() {
    const user = getCachedUser();
    if (!user) return;

    const initials = user.username
      ? user.username.substring(0, 2).toUpperCase()
      : 'U';

    // Set initials everywhere
    ['navInitials', 'navInitialsMob', 'drawerInitials'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = initials;
    });

    // Set name/role in drawer
    const nameEl = document.getElementById('drawerUserName');
    if (nameEl) nameEl.textContent = user.username || 'User';

    const roleEl = document.getElementById('drawerUserRole');
    if (roleEl) roleEl.textContent = user.role || 'attendee';

    // Set popup info
    const popupName = document.getElementById('popupName');
    if (popupName) popupName.textContent = user.username || 'User';

    const popupRole = document.getElementById('popupRole');
    if (popupRole) popupRole.textContent = user.role || 'attendee';
  }

  /* ══════════════════════════════════
     RENDER EVENTS
  ══════════════════════════════════ */
  function formatDate(isoString) {
    if (!isoString) return 'TBD';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    } catch { return isoString; }
  }

  function renderEvents(events) {
    const list = document.getElementById('eventsList');
    const badge = document.getElementById('registeredBadge');
    if (!list) return;

    if (badge) badge.textContent = `${events.length} Registered`;

    if (events.length === 0) {
      list.innerHTML = `
        <div style="text-align:center; padding:3rem 1rem; color:#94a3b8;">
          <div style="font-size:48px; margin-bottom:12px;">🎫</div>
          <h3 style="margin:0 0 6px; color:#e2e8f0; font-weight:600;">No Events Yet</h3>
          <p style="margin:0; font-size:14px;">Browse and register for events to see them here.</p>
        </div>`;
      return;
    }

    list.innerHTML = events.map(ev => `
      <article class="event-row-card" role="article">
        <img
          class="event-thumb"
          src="${ev.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=180&h=180&fit=crop'}"
          alt="${ev.title}"
          onerror="this.style.background='#ede9fe';this.removeAttribute('src')"
        />
        <div class="event-info">
          <div class="event-status-row">
            <span class="badge-upcoming">${ev.status || 'Upcoming'}</span>
          </div>
          <h3 class="event-title">${ev.title}</h3>
          <div class="event-meta">
            <span class="event-meta-item">${calSVG} ${formatDate(ev.date)}</span>
            <span class="event-meta-item">${pinSVG} ${ev.location || 'TBD'}</span>
          </div>
        </div>
        <button class="btn-view-event" data-id="${ev.id || ev.event_id}">View Event</button>
      </article>
    `).join('');

    list.querySelectorAll('.btn-view-event').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = `../event Description/index.html?eventId=${btn.dataset.id}`;
      });
    });
  }

  /* ══════════════════════════════════
     LOAD DASHBOARD DATA
  ══════════════════════════════════ */
  async function loadDashboard() {
    const list = document.getElementById('eventsList');
    if (!list) return;

    // Show spinner
    list.innerHTML = `
      <div style="text-align:center; padding:2rem; color:#94a3b8;">
        <div class="spinner" style="width:32px;height:32px;border:3px solid #334155;border-top-color:#7c3aed;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px;"></div>
        Loading your events...
      </div>`;

    if (!document.getElementById('dash-spinner-style')) {
      const st = document.createElement('style');
      st.id = 'dash-spinner-style';
      st.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(st);
    }

    try {
      // Also refresh the cached user profile
      try {
        const profile = await fetchMyProfile();
        setCachedUser(profile);
        populateUserUI();
      } catch { /* non-critical */ }

      const activity = await fetchMyActivity();
      const tickets = activity.tickets || [];

      if (tickets.length === 0 && (activity.organized_events || []).length === 0) {
        renderEvents([]);
        return;
      }

      // Fetch public events to enrich ticket data with titles/locations
      let allEvents = [];
      try {
        allEvents = await fetchPublicEvents(100);
      } catch { /* fallback */ }

      const eventsMap = {};
      allEvents.forEach(e => { eventsMap[e.id] = e; });

      const enrichedTickets = tickets.map(t => {
        const eventInfo = eventsMap[t.event_id] || {};
        return {
          id: t.event_id,
          event_id: t.event_id,
          title: eventInfo.title || `Event #${t.event_id}`,
          date: eventInfo.date,
          location: eventInfo.location || '',
          status: t.status || 'confirmed',
          image: eventInfo.image,
        };
      });

      const organizedEvents = (activity.organized_events || []).map(e => ({
        id: e.event_id,
        event_id: e.event_id,
        title: e.title || `Event #${e.event_id}`,
        date: e.date,
        location: '',
        status: 'Organized',
        image: null,
      }));

      renderEvents([...enrichedTickets, ...organizedEvents]);
    } catch (err) {
      console.error('Dashboard load error:', err);
      list.innerHTML = `
        <div style="text-align:center; padding:2rem; color:#f87171;">
          <p>Failed to load your events. Please try again.</p>
          <button onclick="location.reload()" style="margin-top:8px; padding:8px 20px; border:1px solid #f87171; border-radius:8px; background:transparent; color:#f87171; cursor:pointer; font-size:14px;">Retry</button>
        </div>`;
    }
  }

  /* ══════════════════════════════════
     INIT
  ══════════════════════════════════ */
  // "Discover More" button
  document.getElementById('discoverMoreBtn')?.addEventListener('click', () => {
    window.location.href = '../Events/index.html';
  });

  // Logout buttons
  document.querySelectorAll('.btn-do-logout').forEach(btn => {
    btn.addEventListener('click', () => {
      clearToken();
      window.location.href = '../login/index.html';
    });
  });

  initNavbar();
  populateUserUI();
  loadDashboard();
})();
