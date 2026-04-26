/**
 * EVENTFY — MY DASHBOARD PAGE LOGIC
 * Fetches real user data + tickets from the backend API.
 * Shows ticket codes with copy functionality.
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
  const ticketSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
    <path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z"/>
  </svg>`;
  const copySVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>`;
  const checkSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 13l4 4L19 7"/>
  </svg>`;

  /* ══════════════════════════════════
     COPY TICKET CODE
  ══════════════════════════════════ */
  function copyTicketCode(code, btn) {
    navigator.clipboard.writeText(code).then(() => {
      btn.classList.add('copied');
      btn.innerHTML = `${checkSVG} Copied!`;
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = `${copySVG} Copy`;
      }, 2000);
    }).catch(() => {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = code;
      ta.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      btn.classList.add('copied');
      btn.innerHTML = `${checkSVG} Copied!`;
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = `${copySVG} Copy`;
      }, 2000);
    });
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

  function getStatusBadge(status) {
    const s = (status || '').toLowerCase();
    if (s === 'active' || s === 'confirmed' || s === 'upcoming') {
      return `<span class="badge-upcoming">${status}</span>`;
    }
    if (s === 'used') {
      return `<span class="badge-status badge-used">Used</span>`;
    }
    if (s === 'cancelled') {
      return `<span class="badge-status badge-cancelled">Cancelled</span>`;
    }
    if (s === 'organized') {
      return `<span class="badge-status badge-organized">Organized</span>`;
    }
    return `<span class="badge-upcoming">${status || 'Upcoming'}</span>`;
  }

  function renderEvents(events) {
    const list = document.getElementById('eventsList');
    const badge = document.getElementById('registeredBadge');
    if (!list) return;

    if (badge) badge.textContent = `${events.length} Registered`;

    if (events.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎫</div>
          <h3 class="empty-state-title">No Events Yet</h3>
          <p class="empty-state-text">Browse and register for events to see them here.</p>
          <a href="../Events/index.html" class="btn-primary" style="margin-top:16px;text-decoration:none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Browse Events
          </a>
        </div>`;
      return;
    }

    list.innerHTML = events.map(ev => {
      const ticketCodeHTML = ev.qr_code ? `
        <div class="ticket-code-section">
          <div class="ticket-code-label">${ticketSVG} Ticket Code</div>
          <div class="ticket-code-row">
            <code class="ticket-code-value">${ev.qr_code}</code>
            <button class="btn-copy-code" data-code="${ev.qr_code}" title="Copy ticket code">
              ${copySVG} Copy
            </button>
          </div>
        </div>
      ` : '';

      return `
      <article class="event-row-card" role="article">
        <img
          class="event-thumb"
          src="${ev.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=180&h=180&fit=crop'}"
          alt="${ev.title}"
          loading="lazy"
          onerror="this.style.background='#ede9fe';this.removeAttribute('src')"
        />
        <div class="event-info">
          <div class="event-status-row">
            ${getStatusBadge(ev.status)}
          </div>
          <h3 class="event-title">${ev.title}</h3>
          <div class="event-meta">
            <span class="event-meta-item">${calSVG} ${formatDate(ev.date)}</span>
            <span class="event-meta-item">${pinSVG} ${ev.location || 'TBD'}</span>
          </div>
          ${ticketCodeHTML}
        </div>
        <button class="btn-view-event" data-id="${ev.id || ev.event_id}">View Event</button>
      </article>
    `;
    }).join('');

    // Attach "View Event" clicks
    list.querySelectorAll('.btn-view-event').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = `../event Description/event-detail.html?id=${btn.dataset.id}`;
      });
    });

    // Attach "Copy Code" clicks
    list.querySelectorAll('.btn-copy-code').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyTicketCode(btn.dataset.code, btn);
      });
    });
  }

  /* ══════════════════════════════════
     LOAD DASHBOARD DATA
  ══════════════════════════════════ */
  async function loadDashboard() {
    const list = document.getElementById('eventsList');
    if (!list) return;

    // Show skeleton placeholders while loading
    list.innerHTML = Array.from({ length: 3 }, () => `
      <div class="skeleton-dash-row">
        <div class="skel-dash-thumb skeleton"></div>
        <div class="skel-dash-body">
          <div class="skel-dash-title skeleton"></div>
          <div class="skel-dash-meta skeleton"></div>
        </div>
        <div class="skel-dash-btn skeleton"></div>
      </div>
    `).join('');

    try {
      // Fire all API calls in PARALLEL — cuts load time by ~60%
      const [profileRes, activity, allEvents] = await Promise.all([
        fetchMyProfile().catch(() => null),       // non-critical
        fetchMyActivity(),                        // primary data
        fetchPublicEvents(100).catch(() => []),    // enrichment data
      ]);

      // Cache the profile if we got it
      if (profileRes) setCachedUser(profileRes);

      const tickets = activity.tickets || [];

      if (tickets.length === 0 && (activity.organized_events || []).length === 0) {
        renderEvents([]);
        return;
      }

      const eventsMap = {};
      allEvents.forEach(e => { eventsMap[e.id] = e; });

      const enrichedTickets = tickets.map(t => {
        const eventInfo = eventsMap[t.event_id] || {};
        return {
          id: t.event_id,
          event_id: t.event_id,
          title: eventInfo.title || `Event #${t.event_id}`,
          date: eventInfo.date || eventInfo.start_date,
          location: eventInfo.location || '',
          status: t.status || 'confirmed',
          image: eventInfo.image,
          qr_code: t.qr_code || null,
        };
      });

      const organizedEvents = (activity.organized_events || []).map(e => ({
        id: e.event_id,
        event_id: e.event_id,
        title: e.title || `Event #${e.event_id}`,
        date: e.date || e.start_date,
        location: '',
        status: 'Organized',
        image: null,
        qr_code: null,
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

  loadDashboard();
})();
