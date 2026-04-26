'use strict';

/* ══════════════════════════════════════════
   event-detail.js
   Loads a single event by ID and renders it.
   Navbar/drawer/popups are handled by navbar.js.
══════════════════════════════════════════ */

/* ── Load Event Details ── */
async function loadEventDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');
  const container = document.getElementById('eventDetailsContainer');

  if (!eventId) {
    if (container) container.innerHTML = '<p style="text-align:center; padding:4rem; color:red;">No Event ID provided.</p>';
    return;
  }

  try {
    const ev = await fetchEventById(eventId);
    if (!ev) throw new Error("Event not found");

    // Update page title dynamically
    document.title = `${ev.title || 'Event Details'} — Eventfy`;

    renderEventHTML(ev, container);

  } catch (err) {
    console.error("Error loading event:", err);
    if (container) container.innerHTML = '<p style="text-align:center; padding:4rem; color:red;">Failed to load event details.</p>';
  }
}

function renderEventHTML(ev, container) {
  const CURRENCY_SYMBOLS = { DZD: 'د.ج', USD: '$', EUR: '€', GBP: '£' };
  const evCurrency = ev.currency || localStorage.getItem('eventfy_currency') || 'DZD';
  const sym = CURRENCY_SYMBOLS[evCurrency] || evCurrency;

  // Date handling — prefer start_date, fallback to date
  const startDateObj = ev.start_date ? new Date(ev.start_date) : (ev.date ? new Date(ev.date) : new Date());
  const dateStr = startDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = startDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // End date (if available)
  let endDateStr = '';
  if (ev.end_date) {
    const endObj = new Date(ev.end_date);
    endDateStr = ' — ' + endObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      + ' ' + endObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  
  const imgUrl = ev.image 
      ? (ev.image.startsWith('http') ? ev.image : `${API_BASE}${ev.image}`)
      : 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80';

  const isFree = !ev.price || ev.price <= 0;
  const priceDisplay = isFree ? 'Free' : (evCurrency === 'DZD' ? ev.price + ' ' + sym : sym + ev.price);

  // Registration deadline check
  let deadlineExpired = false;
  let deadlineHTML = '';
  if (ev.registration_deadline) {
    const dlDate = new Date(ev.registration_deadline);
    const now = new Date();
    deadlineExpired = dlDate < now;
    const dlStr = dlDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' ' + dlDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (deadlineExpired) {
      deadlineHTML = `<p style="text-align:center;font-size:12px;color:#dc2626;font-weight:600;margin-top:8px;">⏰ Registration closed on ${dlStr}</p>`;
    } else {
      deadlineHTML = `<p style="text-align:center;font-size:12px;color:#15803d;font-weight:600;margin-top:8px;">📋 Register before ${dlStr}</p>`;
    }
  }

  const buyBtnDisabled = deadlineExpired || ev.available_tickets <= 0;
  const buyBtnText = deadlineExpired ? 'Registration Closed' : (isFree ? 'Get Free Ticket' : `Buy Ticket — ${priceDisplay}`);
  const buyBtnStyle = buyBtnDisabled ? 'opacity:0.5; cursor:not-allowed; pointer-events:none;' : '';

  container.innerHTML = `
    <!-- Hero -->
    <header class="hero-banner" style="background: url('${imgUrl}') center/cover no-repeat; position: relative;">
      <div class="hero-gradient" style="background: linear-gradient(to top, rgba(15,23,42,0.95), rgba(15,23,42,0.4));">
        <div class="hero-badge">
          <svg class="hero-badge-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/></svg>
          ${ev.category || 'Event'}
        </div>
        <h1 class="hero-title">${ev.title || 'Untitled Event'}</h1>
        <div class="hero-meta">
          <div class="hero-meta-item">
            <svg class="hero-meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
            ${dateStr} • ${timeStr}${endDateStr}
          </div>
          <div class="hero-meta-item">
            <svg class="hero-meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
            ${ev.location || 'TBA'}
          </div>
        </div>
      </div>
    </header>

    <div class="content-grid">
      <!-- ── MAIN CONTENT ── -->
      <div class="content-main">
        <!-- About -->
        <section id="about">
          <div class="section-heading">
            <div class="section-bar"></div>
            <h2>About the Event</h2>
          </div>
          <div class="about-body">
            <p>${ev.description ? ev.description.replace(/\\n/g, '<br>') : 'No description provided.'}</p>
          </div>
        </section>
      </div>

      <!-- ── SIDEBAR ── -->
      <aside class="sidebar">
        <div class="reg-card">
          <div class="reg-card-top">
            <div>
              <p class="price-label">Price</p>
              <h3 class="price-value">${priceDisplay}</h3>
            </div>
            <div class="seats-badge">
              <svg class="seats-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M12 6v6l4 2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
              ${ev.available_tickets > 0 ? ev.available_tickets + ' Seats Left' : 'Sold Out'}
            </div>
          </div>
          <div class="reg-details">
            <div class="reg-detail-item">
              <div class="reg-detail-icon reg-detail-icon--blue">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
              </div>
              <div>
                <p class="reg-detail-title">${dateStr}</p>
                <p class="reg-detail-sub">${timeStr}</p>
              </div>
            </div>
            <div class="reg-detail-item">
              <div class="reg-detail-icon reg-detail-icon--indigo">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
              </div>
              <div>
                <p class="reg-detail-title">${ev.location || 'TBA'}</p>
              </div>
            </div>
          </div>
          <button class="btn-register" id="buyTicketBtn" style="${buyBtnStyle}" ${buyBtnDisabled ? 'disabled' : ''}>
            ${buyBtnText}
            <svg class="btn-register-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
          </button>
          ${deadlineHTML}
          ${!isFree && !deadlineExpired ? '<p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:8px;">🔒 Secure payment via Stripe</p>' : ''}
          <button class="btn-save" id="saveEventBtn" style="width:100%;margin-top:12px;padding:14px;border-radius:12px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;background:#f8fafc;color:#64748b;border:1px solid #e2e8f0;cursor:pointer;transition:all 0.2s;">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke-width="2"/></svg>
            Save Event
          </button>
        </div>
      </aside>
    </div>
  `;

  // Buy Ticket — branches between free and paid events
  const buyBtn = container.querySelector('#buyTicketBtn');
  const isFreeEvent = !ev.price || ev.price <= 0;

  buyBtn?.addEventListener('click', async () => {
    if (!isLoggedIn()) {
      window.location.href = '../login/index.html';
      return;
    }

    // Prevent double-click
    buyBtn.disabled = true;
    buyBtn.style.opacity = '0.7';
    buyBtn.innerHTML = 'Processing…';

    try {
      if (isFreeEvent) {
        // ── FREE EVENT: direct ticket purchase ──
        const res = await apiFetch(`/ticket/purchase_ticket/${ev.id}`, { method: 'POST' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Purchase failed');
        }

        showEventToast('🎫 Ticket purchased successfully!');

        // Update seats count in sidebar
        const seatsBadge = container.querySelector('.seats-badge');
        if (seatsBadge && ev.available_tickets > 0) {
          ev.available_tickets--;
          const seatsText = ev.available_tickets > 0
            ? ev.available_tickets + ' Seats Left'
            : 'Sold Out';
          seatsBadge.innerHTML = `
            <svg class="seats-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M12 6v6l4 2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
            ${seatsText}
          `;
        }

        buyBtn.innerHTML = '✓ Purchased';
        buyBtn.style.opacity = '1';
        buyBtn.style.background = '#10b981';
        buyBtn.style.borderColor = '#10b981';
        buyBtn.style.color = '#fff';
        // Keep button disabled after successful purchase

      } else {
        // ── PAID EVENT: Stripe Checkout ──
        const res = await apiFetch(`/payment/checkout/${ev.id}`, { method: 'POST' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Failed to create checkout session');
        }

        const data = await res.json();
        if (data.checkout_url) {
          // Redirect to Stripe hosted checkout
          window.location.href = data.checkout_url;
          return;
        } else {
          throw new Error('No checkout URL returned');
        }
      }

    } catch (err) {
      console.error('Ticket purchase error:', err);
      showEventToast(`❌ ${err.message || 'Failed to purchase ticket.'}`);
      buyBtn.disabled = false;
      buyBtn.style.opacity = '1';
      buyBtn.innerHTML = `${isFreeEvent ? 'Get Free Ticket' : 'Buy Ticket'} <svg class="btn-register-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>`;
    }
  });

  // Attach Save Event logic
  const saveBtn = container.querySelector('#saveEventBtn');
  let isSaved = false;
  let savingId = null;

  // Check if already saved or purchased
  if (isLoggedIn()) {
    // Check for purchased ticket
    fetchMyActivity().then(activity => {
      const tickets = activity.tickets || [];
      if (tickets.some(t => t.event_id == ev.id)) {
        if (buyBtn) {
          buyBtn.innerHTML = '✓ Purchased';
          buyBtn.style.opacity = '1';
          buyBtn.style.background = '#10b981';
          buyBtn.style.borderColor = '#10b981';
          buyBtn.style.color = '#fff';
          buyBtn.disabled = true;
        }
      }
    }).catch(console.error);

    // Check for saved event
    fetchSavedEvents().then(res => {
      const savedList = res.items || res || [];
      const match = savedList.find(s => s.event_id == ev.id);
      if (match) {
        isSaved = true;
        savingId = match.id;
        updateSaveBtnUI();
      }
    }).catch(console.error);
  }

  function updateSaveBtnUI() {
    if (isSaved) {
      saveBtn.style.color = '#ef4444';
      saveBtn.style.borderColor = '#fee2e2';
      saveBtn.style.background = '#fef2f2';
      saveBtn.innerHTML = `
        <svg fill="currentColor" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke-width="2"/></svg>
        Saved
      `;
    } else {
      saveBtn.style.color = '#64748b';
      saveBtn.style.borderColor = '#e2e8f0';
      saveBtn.style.background = '#f8fafc';
      saveBtn.innerHTML = `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke-width="2"/></svg>
        Save Event
      `;
    }
  }

  saveBtn.addEventListener('click', async () => {
    if (!isLoggedIn()) {
      window.location.href = '../login/index.html';
      return;
    }
    
    saveBtn.disabled = true;
    saveBtn.style.opacity = '0.7';
    
    try {
      if (isSaved && savingId) {
        await unsaveEvent(savingId);
        isSaved = false;
        savingId = null;
      } else {
        const res = await saveEvent(ev.id);
        isSaved = true;
        savingId = res.id;
      }
      updateSaveBtnUI();
    } catch (err) {
      console.error(err);
      showEventToast('Failed to save event. Please try again.');
    } finally {
      saveBtn.disabled = false;
      saveBtn.style.opacity = '1';
    }
  });
}

/* ══ TOAST HELPER (replaces alert()) ══ */
function showEventToast(msg) {
  let t = document.getElementById('event-detail-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'event-detail-toast';
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

/* ── Init ── */
loadEventDetails();
