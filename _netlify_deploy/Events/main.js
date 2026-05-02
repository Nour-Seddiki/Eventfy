'use strict';

/* ══════════════════════════════════════════════
   EVENT DATA
   Each card must have data-attributes in HTML:
   data-cat, data-city, data-month, data-price
   ══════════════════════════════════════════════ */
const filters = { category: 'all', date: 'all', location: 'all', price: 'all' };

/* ── FILTER CORE ── */
let allEvents = [];

/* ── FILTER CORE ── */
function getFilteredCards() {
  const q = document.getElementById('searchInput')?.value.toLowerCase() || '';

  return allEvents.filter(ev => {
    const title = (ev.title || '').toLowerCase();
    const loc = (ev.location || '').toLowerCase();
    const cat = (ev.category || '').toLowerCase();
    const price = ev.price || 0;
    const month = ev.date ? new Date(ev.date).getMonth() : -1;

    if (q && !title.includes(q) && !loc.includes(q) && !cat.includes(q)) return false;
    if (filters.category !== 'all' && cat !== filters.category) return false;
    if (filters.location !== 'all' && !loc.includes(filters.location.toLowerCase())) return false;

    if (filters.price === 'free' && price !== 0) return false;
    if (filters.price === 'paid' && price === 0) return false;

    const dateMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    if (filters.date !== 'all' && month !== dateMap[filters.date]) return false;

    return true;
  });
}

/* ── Skeleton placeholder for Events grid ── */
function showEventSkeletons(count = 6) {
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;
  grid.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skel-img skeleton"></div>
      <div class="skel-body">
        <div class="skel-badge skeleton"></div>
        <div class="skel-title skeleton"></div>
        <div class="skel-text skeleton"></div>
        <div class="skel-btn skeleton"></div>
      </div>
    </div>
  `).join('');
}

function renderEvents(eventsList) {
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;

  if (!eventsList || eventsList.length === 0) {
    grid.innerHTML = '<p id="noResults" style="grid-column:1/-1;text-align:center;color:#94a3b8;padding:2rem;font-size:15px;font-weight:600">No events match your filters.</p>';
    return;
  }

  const badges = {
    science: 'badge-indigo',
    sports: 'badge-orange',
    music: 'badge-blue',
    business: 'badge-emerald',
    gaming: 'badge-purple',
    food: 'badge-rose',
    art: 'badge-amber',
    wellness: 'badge-teal'
  };

  grid.innerHTML = eventsList.map((ev, idx) => {
    const delay = (idx % 10) * 0.1;
    const deadlineRaw = ev.registration_deadline || ev.start_date || ev.date;
    const dateObj = deadlineRaw ? new Date(deadlineRaw) : null;
    const month = dateObj ? dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'TBD';
    const day = dateObj ? String(dateObj.getDate()).padStart(2, '0') : '--';
    const time = dateObj ? dateObj.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'TBD';

    const badgeClass = badges[(ev.category || '').toLowerCase()] || 'badge-sky';
    const catName = ev.category || 'General';

    const imgUrl = ev.image
      ? (ev.image.startsWith('http') ? ev.image : `${API_BASE}${ev.image}`)
      : 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80';

    const isFree = (!ev.price || ev.price === 0 || String(ev.price).toLowerCase() === 'free');
    const freeBadgeHtml = isFree ? `
      <span style="display:inline-flex; align-items:center; gap:4px; color:#10b981; font-size:11px; font-weight:800; letter-spacing:0.5px; text-transform:uppercase;">
        <svg style="width:14px; height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M6 6l12 12" stroke-linecap="round" stroke-width="2.5"/></svg>
        FREE
      </span>
      <span style="color:#cbd5e1; margin:0 6px;">•</span>
    ` : '';

    const sold = ev.tickets_sold || 0;
    const avail = ev.available_tickets || 0;
    const total = sold + avail;
    let availabilityHtml = '';

    // Build attendee avatars from real API data
    const attendees = ev.attendees || [];

    let attendeesHtml = '';
    if (sold > 0) {
      let avatars = '';
      attendees.slice(0, 3).forEach((att, i) => {
        const zIndex = 3 - i;
        const ml = i > 0 ? 'margin-left:-8px;' : '';
        if (att.avatar_url) {
          avatars += `<img src="${att.avatar_url}" alt="${att.username}" style="width:24px; height:24px; border-radius:50%; border:2px solid #fff; position:relative; z-index:${zIndex}; ${ml} object-fit:cover;">`;
        } else {
          const initial = (att.username || 'U').charAt(0).toUpperCase();
          avatars += `<div style="width:24px; height:24px; border-radius:50%; border:2px solid #fff; background:linear-gradient(135deg,#7f0df2,#a855f7); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; color:#fff; position:relative; z-index:${zIndex}; ${ml}">${initial}</div>`;
        }
      });

      const plusMore = sold > 3 ? `<div style="width:24px; height:24px; border-radius:50%; background:#f1f5f9; border:2px solid #fff; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:800; color:#64748b; position:relative; z-index:0; margin-left:-8px;">+${sold - 3}</div>` : '';

      attendeesHtml = `
        <div style="display:flex; align-items:center;">
          ${avatars}
          ${plusMore}
          <span style="font-size:11px; font-weight:600; color:#64748b; margin-left:8px;">attending</span>
        </div>
      `;
    } else {
      attendeesHtml = `<span style="font-size:11px; font-weight:600; color:#94a3b8;">Be the first to join</span>`;
    }

    if (total > 0) {
      availabilityHtml = `
        <div style="margin-top:auto; padding-top:16px; border-top:1px solid #f1f5f9;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            ${attendeesHtml}
            ${avail > 0 
              ? `<div style="display:flex; align-items:center; gap:4px; padding:4px 8px; background:#fef2f2; border-radius:6px; color:#ef4444; font-size:10px; font-weight:800; letter-spacing:0.5px;">
                   <span style="width:6px; height:6px; background:#ef4444; border-radius:50%;"></span>
                   ${avail} SPOTS LEFT
                 </div>`
              : `<div style="display:flex; align-items:center; gap:4px; padding:4px 8px; background:#f1f5f9; border-radius:6px; color:#64748b; font-size:10px; font-weight:800; letter-spacing:0.5px;">
                   SOLD OUT
                 </div>`
            }
          </div>
          <button class="view-btn" style="width:100%; height:40px; border-radius:8px; font-size:13px; font-weight:800; background:#0f172a; color:white; border:none; cursor:pointer; transition:all 0.2s;">
            ${avail === 0 ? 'Join Waitlist' : 'Get Tickets'}
          </button>
        </div>
      `;
    } else {
      availabilityHtml = `
        <div style="margin-top:auto; padding-top:16px; border-top:1px solid #f1f5f9;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            ${attendeesHtml}
            <div style="display:flex; align-items:center; gap:4px; padding:4px 8px; background:#ecfdf5; border-radius:6px; color:#10b981; font-size:10px; font-weight:800; letter-spacing:0.5px;">
              <span style="width:6px; height:6px; background:#10b981; border-radius:50%;"></span>
              OPEN
            </div>
          </div>
          <button class="view-btn" style="width:100%; height:40px; border-radius:8px; font-size:13px; font-weight:800; background:#0f172a; color:white; border:none; cursor:pointer; transition:all 0.2s;">
            View Details
          </button>
        </div>
      `;
    }

    return `
      <article class="event-card" data-cat="${(ev.category || '').toLowerCase()}" data-city="${ev.location || ''}" data-month="${dateObj.getMonth()}" data-price="${ev.price || 0}" style="animation-delay:${delay}s; cursor:pointer; display:flex; flex-direction:column;" onclick="window.location.href='../event Description/event-detail.html?id=${ev.id}'">
        <div class="card-img-wrap" style="flex-shrink:0;">
          <img alt="${ev.title || 'Event'}" src="${imgUrl}" loading="lazy"/>
          <span class="badge ${badgeClass}">${catName}</span>
          <button class="fav-btn" onclick="event.stopPropagation(); this.classList.toggle('liked');"><svg class="icon-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg></button>
        </div>
        <div class="card-body" style="flex:1; display:flex; flex-direction:column; padding-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
            <p class="card-date" style="margin:0; display:flex; align-items:center;">
              ${freeBadgeHtml}
              <span style="font-size:12px; font-weight:700; color:#ef4444;"><svg style="width:12px;height:12px;margin-right:3px;vertical-align:-1px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M12 6v6l4 2" stroke-linecap="round" stroke-width="2"/></svg>Deadline: ${month} ${day} • ${time}</span>
            </p>
          </div>
          <h3 class="card-title">${ev.title || 'Untitled Event'}</h3>
          <p class="card-location" style="margin-bottom:auto;"><svg class="icon-xs" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke-linecap="round" stroke-width="2"></path><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-width="2"></path></svg>${ev.location || 'TBA'}</p>
          
          ${availabilityHtml}
        </div>
      </article>
    `;
  }).join('');
}

function applyFilters() {
  const filtered = getFilteredCards();
  renderEvents(filtered);
}

async function loadInitialEvents() {
  showEventSkeletons(6);
  try {
    if (typeof fetchPublicEvents === 'function') {
      allEvents = await fetchPublicEvents(50);
      renderEvents(allEvents);
    }
  } catch (err) {
    console.error('Error fetching events:', err);
    document.getElementById('eventsGrid').innerHTML = '<p style="text-align:center;grid-column:1/-1">Failed to load events.</p>';
  }
}

/* ── DROPDOWN HELPERS ── */
let _activeDD = null;   // { type, btn, dd }

function positionDD(dd, btn) {
  const r = btn.getBoundingClientRect();
  dd.style.top = (r.bottom + 6) + 'px';
  dd.style.left = r.left + 'px';
}

function openDD(type, btn) {
  const dd = document.getElementById('dd-' + type);
  if (!dd) return;

  /* toggle: if same dropdown is already open → close it */
  if (_activeDD && _activeDD.type === type) {
    closeAllDD();
    return;
  }

  closeAllDD();

  positionDD(dd, btn);
  dd.classList.add('open');
  btn.classList.add('dd-open');
  btn.querySelector('.pill-chevron')?.classList.add('rotated');
  _activeDD = { type, btn, dd };

  /* auto-focus scrollable date list so arrow keys work immediately */
  if (type === 'date') {
    setTimeout(() => document.getElementById('dd-date-scroll')?.focus(), 50);
  }
}

function closeAllDD() {
  document.querySelectorAll('.dd-menu').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.filter-pill').forEach(p => {
    p.classList.remove('dd-open');
    p.querySelector('.pill-chevron')?.classList.remove('rotated');
  });
  _activeDD = null;
}

/* keep dropdown glued to its button while scrolling / resizing */
function _trackDD() {
  if (_activeDD) positionDD(_activeDD.dd, _activeDD.btn);
}
window.addEventListener('scroll', _trackDD, { passive: true });
window.addEventListener('resize', _trackDD, { passive: true });

function pickFilter(type, value, el) {
  filters[type] = value;

  /* highlight selected item */
  document.querySelectorAll('#dd-' + type + ' .dd-item').forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');

  /* update pill label */
  const pillId = { date: 'fp-date', category: 'fp-cat', location: 'fp-loc', price: 'fp-price' }[type];
  const pill = document.getElementById(pillId);
  if (pill) {
    const icons = { date: '📅', category: '🏷️', location: '📍', price: '💰' };
    const label = value === 'all'
      ? { date: 'Any Date', category: 'Category', location: 'Location', price: 'Any Price' }[type]
      : el.textContent.trim();
    pill.querySelector('.pill-label').textContent = label;
    pill.classList.toggle('active', value !== 'all');
  }

  closeAllDD();
  applyFilters();
}

/* ══════════════════════════════════════════════
   DOM READY
   ══════════════════════════════════════════════ */
// Track which events the user has saved: { event_id: saving_id }
let _savedMap = {};

document.addEventListener('DOMContentLoaded', () => {

  /* ── close dropdowns on outside click ── */
  document.addEventListener('click', e => {
    if (!e.target.closest('.dd-menu') && !e.target.closest('.filter-pill')) closeAllDD();
  });

  /* ── ESC closes dropdowns ── */
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAllDD(); } });

  /* ── search ── */
  document.getElementById('searchInput')?.addEventListener('input', applyFilters);

  /* ── load more ── */
  const loadMoreBtn = document.querySelector('.load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      loadMoreBtn.textContent = 'Loading…';
      loadMoreBtn.disabled = true;
      setTimeout(() => {
        loadMoreBtn.innerHTML = 'No more events right now <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>';
      }, 1200);
    });
  }

  /* ── init: load events + saved state IN PARALLEL ── */
  const eventsP = loadInitialEvents();
  if (typeof isLoggedIn === 'function' && isLoggedIn()) {
    eventsP.then(() => loadSavedState());
    // Also fire saved-state fetch early (while events render)
    loadSavedState();
  }
});

/* ── Load user's saved events to pre-fill hearts ── */
async function loadSavedState() {
  try {
    const data = await fetchSavedEvents();
    const items = Array.isArray(data) ? data : (data.saved_events || data.items || []);
    _savedMap = {};
    items.forEach(item => {
      _savedMap[item.event_id] = item.id || item.saving_id;
    });
    // Update heart buttons in the grid
    document.querySelectorAll('.event-card').forEach(card => {
      const eventId = card.getAttribute('onclick')?.match(/id=(\d+)/)?.[1];
      if (eventId && _savedMap[eventId]) {
        const btn = card.querySelector('.fav-btn');
        if (btn) btn.classList.add('liked');
      }
    });
  } catch (e) {
    console.warn('Could not load saved state:', e);
  }
}

/* ── Attach fav-btn handlers after render ── */
const _origRenderEvents = renderEvents;
renderEvents = function (eventsList) {
  _origRenderEvents(eventsList);
  // Re-attach real save/unsave handlers
  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true)); // Remove old listeners
  });
  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', async function (e) {
      e.stopPropagation();
      if (typeof isLoggedIn !== 'function' || !isLoggedIn()) {
        window.location.href = '../login/index.html';
        return;
      }
      const card = this.closest('.event-card');
      const eventId = card?.getAttribute('onclick')?.match(/id=(\d+)/)?.[1];
      if (!eventId) return;

      this.disabled = true;
      this.style.opacity = '0.5';

      try {
        if (_savedMap[eventId]) {
          await unsaveEvent(_savedMap[eventId]);
          delete _savedMap[eventId];
          this.classList.remove('liked');
        } else {
          const res = await saveEvent(parseInt(eventId));
          _savedMap[eventId] = res.id || res.saving_id;
          this.classList.add('liked');
        }
      } catch (err) {
        console.error('Save/unsave failed:', err);
      } finally {
        this.disabled = false;
        this.style.opacity = '1';
      }
    });
  });

  // Pre-fill hearts for already-saved events
  document.querySelectorAll('.event-card').forEach(card => {
    const eventId = card.getAttribute('onclick')?.match(/id=(\d+)/)?.[1];
    if (eventId && _savedMap[eventId]) {
      const btn = card.querySelector('.fav-btn');
      if (btn) btn.classList.add('liked');
    }
  });
};

