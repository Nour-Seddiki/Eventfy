/**
 * saved-events.js
 * Fetches the user's saved events from the backend and renders them dynamically.
 * Handles unsave (remove from list) actions.
 * Navbar is handled by navbar.js.
 */
'use strict';

(function () {

  const FALLBACK_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=260&fit=crop';

  const CATEGORY_COLORS = {
    'Music': 'cat-music',
    'Science & Tech': 'cat-tech',
    'Art': 'cat-art',
    'Cultural': 'cat-cultural',
    'Sports': 'cat-sports',
    'Business': 'cat-business',
    'Gaming': 'cat-gaming',
    'Food & Drink': 'cat-food',
    'Festival': 'cat-festival',
  };

  function formatDate(iso) {
    if (!iso) return 'TBD';
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return iso; }
  }

  function formatPrice(price) {
    if (price === 0 || price === '0' || price === null || price === undefined) return 'Free';
    return `${Number(price).toLocaleString()} DZD`;
  }

  function renderCards(items) {
    const grid = document.querySelector('.events-grid');
    const badge = document.querySelector('.saved-count-badge');
    if (!grid) return;

    if (badge) badge.textContent = `${items.length} Saved`;

    if (items.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#94a3b8;">
          <div style="font-size:44px;margin-bottom:12px;">💾</div>
          <h3 style="color:#64748b;font-weight:600;margin:0 0 8px;">No saved events yet</h3>
          <p style="margin:0 0 20px;font-size:14px;">Browse events and save the ones you don't want to miss!</p>
          <a href="../Events/index.html" style="display:inline-block;background:#7f0df2;color:#fff;padding:10px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Browse Events</a>
        </div>`;
      return;
    }

    grid.innerHTML = items.map(item => {
      const ev = item.event || item;
      const catClass = CATEGORY_COLORS[ev.category] || 'cat-tech';
      const savingId = item.saving_id || item.id;
      return `
        <article class="event-card" data-saving-id="${savingId}" data-event-id="${ev.id}">
          <div class="card-img-wrap">
            <img src="${ev.image || FALLBACK_IMG}" alt="${ev.title || 'Event'}"
                 onerror="this.src='${FALLBACK_IMG}'"/>
            <button class="fav-btn fav-active" aria-label="Remove from saved" data-saving-id="${savingId}">
              <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            </button>
            <span class="card-cat-badge ${catClass}">${ev.category || 'Event'}</span>
          </div>
          <div class="card-body">
            <div class="card-date-row">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" stroke-width="2"/><line x1="16" y1="2" x2="16" y2="6" stroke-width="2"/><line x1="8" y1="2" x2="8" y2="6" stroke-width="2"/><line x1="3" y1="10" x2="21" y2="10" stroke-width="2"/></svg>
              <span class="card-date-text">${formatDate(ev.date)}</span>
            </div>
            <h3 class="card-title">${ev.title || 'Untitled Event'}</h3>
            <div class="card-location">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke-width="2"/></svg>
              <span>${ev.location || 'Location TBD'}</span>
            </div>
            <div class="card-footer-row">
              <span class="card-price">${formatPrice(ev.price)}</span>
              <button class="btn-view-details" data-event-id="${ev.id}">View Details</button>
            </div>
          </div>
        </article>`;
    }).join('');

    // Unsave buttons
    grid.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const savingId = btn.dataset.savingId;
        const card = btn.closest('.event-card');
        btn.disabled = true;
        btn.style.opacity = '0.5';
        try {
          await unsaveEvent(savingId);
          card.style.transition = 'opacity .3s, transform .3s';
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.remove();
            const remaining = grid.querySelectorAll('.event-card').length;
            const badge = document.querySelector('.saved-count-badge');
            if (badge) badge.textContent = `${remaining} Saved`;
            if (remaining === 0) renderCards([]);
          }, 300);
        } catch (err) {
          btn.disabled = false;
          btn.style.opacity = '1';
          showToast('Could not remove event. Please try again.');
        }
      });
    });

    // View details buttons
    grid.querySelectorAll('.btn-view-details').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = `../event Description/event-detail.html?id=${btn.dataset.eventId}`;
      });
    });
  }

  function showSpinner() {
    const grid = document.querySelector('.events-grid');
    if (grid) grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:48px;color:#94a3b8;">
        <div style="width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#7f0df2;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px;"></div>
        Loading your saved events...
        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
      </div>`;
  }

  function showToast(msg) {
    let t = document.getElementById('save-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'save-toast';
      t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1e293b;color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:500;z-index:9999;transition:opacity .3s;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.style.opacity = '0', 3000);
  }

  async function loadSavedEvents() {
    showSpinner();
    try {
      const data = await fetchSavedEvents();
      // Backend may return an array or a wrapped object
      let items = Array.isArray(data) ? data : (data.saved_events || data.events || data.items || []);
      
      // If items have only event_id (not full event object), enrich with public events
      if (items.length > 0 && !items[0].event && items[0].event_id) {
        const allEvents = await fetchPublicEvents(100); // max 100 per API limit
        const evMap = {};
        allEvents.forEach(e => { evMap[e.id] = e; });
        items = items.map(item => ({
          ...item,
          event: evMap[item.event_id] || { id: item.event_id, title: `Event #${item.event_id}` }
        }));
      }
      renderCards(items);
    } catch (err) {
      const grid = document.querySelector('.events-grid');
      if (grid) grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:48px;color:#f87171;">
          <p style="margin:0 0 12px;">Failed to load saved events.</p>
          <button onclick="location.reload()" style="background:transparent;border:1px solid #f87171;color:#f87171;padding:8px 20px;border-radius:8px;cursor:pointer;font-size:14px;">Retry</button>
        </div>`;
    }
  }

  loadSavedEvents();
})();
