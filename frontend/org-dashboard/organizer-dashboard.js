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
  const settingSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`;

  function formatDate(iso) {
    if (!iso) return 'TBD';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    } catch { return iso; }
  }

  /* ── Currency formatter ── */
  const CURRENCY_SYMBOLS = { DZD: 'د.ج', USD: '$', EUR: '€', GBP: '£' };
  function getUserCurrency() {
    return localStorage.getItem('eventfy_currency') || 'DZD';
  }
  function fmtMoney(amount, currency) {
    const cur = currency || getUserCurrency();
    const sym = CURRENCY_SYMBOLS[cur] || cur;
    const val = (amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    // Symbol before for USD/EUR/GBP, after for DZD
    return cur === 'DZD' ? `${val} ${sym}` : `${sym}${val}`;
  }

  /* ── Deadline status ── */
  function getDeadlineStatus(deadline) {
    if (!deadline) return null;
    const now = new Date();
    const dl = new Date(deadline);
    if (dl < now) return { label: 'Registration Closed', cls: 'badge-closed' };
    const hoursLeft = (dl - now) / 3600000;
    if (hoursLeft < 24) return { label: `Closes in ${Math.ceil(hoursLeft)}h`, cls: 'badge-closing' };
    return { label: 'Registration Open', cls: 'badge-open' };
  }

  /* ── Render event list ── */
  function renderEvents(events) {
    const list = document.getElementById('orgEventsList');
    if (!list) return;

    // Update header stats if they exist
    const totalEl = document.getElementById('orgTotalEvents');
    if (totalEl) totalEl.textContent = events.length;

    // Calculate aggregate stats
    const totalRevenueDisplay = document.getElementById('totalRevenueDisplay');
    const totalRegistrationsDisplay = document.getElementById('totalRegistrationsDisplay');
    let totalRevenue = 0;
    let totalRegistrations = 0;
    
    events.forEach(ev => {
      totalRevenue += (ev.revenue || 0);
      totalRegistrations += (ev.tickets_sold || 0);
    });

    if (totalRevenueDisplay) totalRevenueDisplay.textContent = fmtMoney(totalRevenue);
    if (totalRegistrationsDisplay) totalRegistrationsDisplay.textContent = totalRegistrations.toString();

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

      // Date display — prefer start_date, fallback to date
      const displayDate = ev.start_date || ev.date;
      const endDateStr = ev.end_date ? ` — ${formatDate(ev.end_date)}` : '';

      // Deadline badge
      const dlStatus = getDeadlineStatus(ev.registration_deadline);
      const dlBadgeHTML = dlStatus
        ? `<span class="${dlStatus.cls}" style="font-size:11px;padding:2px 8px;border-radius:6px;font-weight:600;">${dlStatus.label}</span>`
        : '';

      // Currency-aware revenue
      const evCurrency = ev.currency || getUserCurrency();

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
              <span class="org-event-meta-item">${calSVG} ${formatDate(displayDate)}${endDateStr}</span>
              <span class="org-event-meta-item">${pinSVG} ${ev.location || 'Location TBD'}</span>
            </div>
            <div class="org-event-stats" style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; font-size:13px; color:#64748b; font-weight:500;">
              <span style="background:#f8fafc; padding:4px 8px; border-radius:6px; border:1px solid #e2e8f0;">Tickets Sold: <strong style="color:#1e293b;">${ev.tickets_sold || 0}</strong></span>
              <span style="background:#f8fafc; padding:4px 8px; border-radius:6px; border:1px solid #e2e8f0;">Revenue: <strong style="color:#1e293b;">${fmtMoney(ev.revenue || 0, evCurrency)}</strong></span>
              ${dlBadgeHTML}
            </div>
            <div class="org-event-divider"></div>
            <div class="org-event-actions">
              <a href="../event Description/event-detail.html?id=${ev.id}" class="btn-action btn-action-view">
                ${eyeSVG} View
              </a>
              <button class="btn-action btn-action-manage" data-id="${ev.id}" data-date="${displayDate || ''}" data-capacity="${ev.available_tickets || 0}">
                ${settingSVG} Manage
              </button>
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

    // Wire manage buttons
    list.querySelectorAll('.btn-action-manage').forEach(btn => {
      btn.addEventListener('click', () => {
        const eventId = btn.dataset.id;
        const eventDate = btn.dataset.date;
        const capacity = btn.dataset.capacity;
        openQuickManageModal(eventId, eventDate, capacity);
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

  /* ── Quick Manage Modal Logic ── */
  const qmModal = document.getElementById('quickManageModal');
  const qmForm = document.getElementById('quickManageForm');
  
  function openQuickManageModal(eventId, dateStr, capacity) {
    if (!qmModal) return;
    document.getElementById('quickManageEventId').value = eventId;
    
    // Convert UTC/ISO date to local datetime-local format (YYYY-MM-DDThh:mm)
    let formattedDate = '';
    if (dateStr && dateStr !== 'undefined') {
      try {
        const d = new Date(dateStr);
        // adjust for timezone offset
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        formattedDate = d.toISOString().slice(0, 16);
      } catch (e) {}
    }
    
    document.getElementById('qmDate').value = formattedDate;
    document.getElementById('qmCapacity').value = capacity || '';
    
    qmModal.style.display = 'flex';
  }

  function closeQuickManageModal() {
    if (qmModal) qmModal.style.display = 'none';
  }

  document.getElementById('closeQuickManageBtn')?.addEventListener('click', closeQuickManageModal);
  document.getElementById('cancelQuickManageBtn')?.addEventListener('click', closeQuickManageModal);

  // Close when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === qmModal) {
      closeQuickManageModal();
    }
  });

  qmForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveQuickManageBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    const eventId = document.getElementById('quickManageEventId').value;
    const dateInput = document.getElementById('qmDate').value;
    const capacityInput = document.getElementById('qmCapacity').value;
    
    try {
      // Need to format datetime-local string to ISO if necessary. 
      // Input value format: "2026-04-25T14:30"
      const isoDate = dateInput ? new Date(dateInput).toISOString() : null;
      
      const payload = {
        start_date: isoDate,
        available_tickets: parseInt(capacityInput, 10)
      };

      await updateEvent(eventId, payload);
      showToast('Event updated successfully!');
      closeQuickManageModal();
      
      // Reload events to show fresh stats and updated info
      loadOrgEvents();
    } catch (err) {
      showToast(err.message || 'Failed to update event', false);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
    }
  });

  loadOrgEvents();
})();
