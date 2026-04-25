/**
 * EVENTFY — ORGANIZER DASHBOARD PAGE LOGIC
 * Fetches real events from the backend for the logged-in organizer.
 * Includes secondary role guard (API-backed) after the DOM-level guard.
 */
(function () {
  'use strict';

  const FALLBACK_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=280&h=160&fit=crop';

  // SVG icon helpers
  const calSVG   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`;
  const pinSVG   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 13 6 13s6-7.75 6-13c0-3.314-2.686-6-6-6z"/><circle cx="12" cy="8" r="2"/></svg>`;
  const eyeSVG   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const editSVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  const trashSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`;
  const plusSVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

  function formatDate(iso) {
    if (!iso) return 'TBD';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    } catch { return iso; }
  }

  /* ── Render event list ── */
  function renderEvents(events) {
    const list = document.getElementById('orgEventsList');
    if (!list) return;

    // Update header stats if they exist
    const totalEl = document.getElementById('orgTotalEvents');
    if (totalEl) totalEl.textContent = events.length;

    if (events.length === 0) {
      list.innerHTML = `
        <div style="text-align:center;padding:60px 20px;color:#94a3b8;">
          <div style="font-size:40px;margin-bottom:12px;">📅</div>
          <h3 style="color:#64748b;font-weight:600;margin:0 0 8px;font-size:16px;">No events yet</h3>
          <p style="margin:0 0 16px;font-size:13px;max-width:280px;margin-left:auto;margin-right:auto;line-height:1.5;">Click <strong style="color:#7f0df2;">+ Create Event</strong> above to get started and build your community!</p>
        </div>`;
      return;
    }

    list.innerHTML = events.map(ev => {
      const status = (ev.status || 'pending').toLowerCase();
      const badgeClass = status === 'approved' ? 'badge-approved' : 'badge-pending';
      const badgeText  = status === 'approved' ? 'Approved' : 'Pending';

      return `
        <article class="org-event-card" data-id="${ev.id}">
          <img class="org-event-thumb"
               src="${ev.image || FALLBACK_IMG}"
               alt="${ev.title || 'Event'}"
               onerror="this.src='${FALLBACK_IMG}'"/>
          <div class="org-event-info">
            <div class="org-event-top">
              <h3 class="org-event-title">${ev.title || 'Untitled Event'}</h3>
              <span class="${badgeClass}">${badgeText}</span>
            </div>
            <div class="org-event-meta">
              <span class="org-event-meta-item">${calSVG} ${formatDate(ev.date)}</span>
              <span class="org-event-meta-item">${pinSVG} ${ev.location || 'Location TBD'}</span>
            </div>
            <div class="org-event-divider"></div>
            <div class="org-event-actions">
              <a href="../event Description/event-detail.html?id=${ev.id}" class="btn-action btn-action-view">
                ${eyeSVG} View
              </a>
              <a href="../new Event/index.html?editId=${ev.id}" class="btn-action btn-action-edit">
                ${editSVG} Edit
              </a>
              <button class="btn-action btn-action-delete" data-id="${ev.id}">
                ${trashSVG} Delete
              </button>
            </div>
          </div>
        </article>`;
    }).join('');

    // Wire delete buttons
    list.querySelectorAll('.btn-action-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const eventId = btn.dataset.id;
        if (!confirm('Delete this event? This cannot be undone.')) return;
        btn.disabled = true;
        try {
          await deleteEvent(eventId);
          const card = list.querySelector(`[data-id="${eventId}"]`);
          if (card) {
            card.style.transition = 'opacity .3s, transform .3s';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => { card.remove(); }, 300);
          }
          showToast('Event deleted ✓');
        } catch (e) {
          showToast('Could not delete event. Please try again.', false);
          btn.disabled = false;
        }
      });
    });
  }

  /* ── Show spinner ── */
  function showSpinner() {
    const list = document.getElementById('orgEventsList');
    if (list) list.innerHTML = `
      <div style="text-align:center;padding:48px;color:#94a3b8;">
        <div style="width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#7f0df2;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px;"></div>
        Loading your events…
        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
      </div>`;
  }

  /* ── Toast ── */
  function showToast(msg, ok = true) {
    let t = document.getElementById('org-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'org-toast';
      t.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:500;z-index:9999;transition:opacity .3s;opacity:0;color:#fff;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.background = ok ? '#1e293b' : '#dc2626';
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.style.opacity = '0', 3000);
  }

  /* ── Load events from API ── */
  async function loadOrgEvents() {
    showSpinner();
    try {
      // Secondary role check via API (catches stale cache)
      const profile = await fetchMyProfile();
      setCachedUser(profile);
      const role = (profile.role || '').toLowerCase();
      if (role && role !== 'organizer' && role !== 'admin') {
        // Not an organizer — redirect
        window.location.href = '../org-profile/index.html';
        return;
      }

      // Populate organizer name in the dashboard header
      const nameEl = document.getElementById('orgName');
      if (nameEl) {
        nameEl.textContent = profile.full_name || profile.username || 'Organizer';
      }

      const events = await fetchMyEvents();
      const evArray = Array.isArray(events) ? events : (events.events || events.items || []);
      renderEvents(evArray);
    } catch (err) {
      const list = document.getElementById('orgEventsList');
      if (list) list.innerHTML = `
        <div style="text-align:center;padding:48px;color:#f87171;">
          <p style="margin:0 0 12px;">Failed to load your events.</p>
          <button onclick="location.reload()" style="background:transparent;border:1px solid #f87171;color:#f87171;padding:8px 20px;border-radius:8px;cursor:pointer;font-size:14px;">Retry</button>
        </div>`;
    }
  }

  /* ── Create Event button ── */
  document.getElementById('createEventBtn')?.addEventListener('click', () => {
    window.location.href = '../new Event/index.html';
  });

  loadOrgEvents();
})();
