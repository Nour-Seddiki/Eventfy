/**
 * EVENTFY — MY DASHBOARD PAGE LOGIC
 * js/my-dashboard.js
 */
(function () {
  'use strict';

  // Demo events data
  const EVENTS = [
    {
      id: 1,
      title: 'Tech Innovators Summit 2024',
      date: 'Oct 24, 2024',
      location: 'San Francisco, CA',
      status: 'upcoming',
      // Using placeholder images from picsum
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=180&h=180&fit=crop'
    },
    {
      id: 2,
      title: 'Electric Beats Festival',
      date: 'Nov 12, 2024',
      location: 'Austin, TX',
      status: 'upcoming',
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=180&h=180&fit=crop'
    }
  ];

  // Calendar SVG icon
  const calSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
    <rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>`;

  // Pin SVG icon
  const pinSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
    <path d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 13 6 13s6-7.75 6-13c0-3.314-2.686-6-6-6z"/>
    <circle cx="12" cy="8" r="2"/>
  </svg>`;

  function renderEvents() {
    const list = document.getElementById('eventsList');
    const badge = document.getElementById('registeredBadge');
    if (!list) return;

    badge.textContent = `${EVENTS.length} Registered`;

    list.innerHTML = EVENTS.map(ev => `
      <article class="event-row-card" role="article">
        <img
          class="event-thumb"
          src="${ev.image}"
          alt="${ev.title}"
          onerror="this.style.background='#ede9fe';this.removeAttribute('src')"
        />
        <div class="event-info">
          <div class="event-status-row">
            <span class="badge-upcoming">Upcoming</span>
          </div>
          <h3 class="event-title">${ev.title}</h3>
          <div class="event-meta">
            <span class="event-meta-item">
              ${calSVG}
              ${ev.date}
            </span>
            <span class="event-meta-item">
              ${pinSVG}
              ${ev.location}
            </span>
          </div>
        </div>
        <button class="btn-view-event" data-id="${ev.id}">View Event</button>
      </article>
    `).join('');

    // Bind "View Event" buttons
    list.querySelectorAll('.btn-view-event').forEach(btn => {
      btn.addEventListener('click', () => {
        const ev = EVENTS.find(e => e.id == btn.dataset.id);
        alert(`Opening: ${ev?.title}`);
      });
    });
  }

  // "Discover More" button
  document.getElementById('discoverMoreBtn')?.addEventListener('click', () => {
    alert('Navigating to Browse Events…');
  });

  renderEvents();
})();
