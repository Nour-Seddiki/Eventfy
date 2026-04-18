/**
 * EVENTFY — ORGANIZER DASHBOARD PAGE LOGIC
 * js/organizer-dashboard.js
 */
(function () {
  'use strict';

  const EVENTS = [
    {
      id: 1,
      title: 'Tech Conference 2024',
      date: 'Jan 5, 2024 • 9:00 AM',
      location: 'San Francisco, CA',
      status: 'approved',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=280&h=160&fit=crop'
    },
    {
      id: 2,
      title: 'Product Design Workshop',
      date: 'Nov 22, 2024 • 2:00 PM',
      location: 'New York, NY',
      status: 'approved',
      image: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=280&h=160&fit=crop'
    }
  ];

  // Icon helpers
  const calSVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`;
  const pinSVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 13 6 13s6-7.75 6-13c0-3.314-2.686-6-6-6z"/><circle cx="12" cy="8" r="2"/></svg>`;
  const eyeSVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const editSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  const trashSVG= `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`;

  function renderEvents() {
    const list = document.getElementById('orgEventsList');
    if (!list) return;

    list.innerHTML = EVENTS.map(ev => {
      const badgeClass = ev.status === 'approved' ? 'badge-approved' : 'badge-pending';
      const badgeText  = ev.status === 'approved' ? 'Approved' : 'Pending';

      return `
        <article class="org-event-card" data-id="${ev.id}">
          <img
            class="org-event-thumb"
            src="${ev.image}"
            alt="${ev.title}"
            onerror="this.style.background='#ede9fe';this.removeAttribute('src')"
          />
          <div class="org-event-info">
            <div class="org-event-top">
              <h3 class="org-event-title">${ev.title}</h3>
              <span class="${badgeClass}">${badgeText}</span>
            </div>
            <div class="org-event-meta">
              <span class="org-event-meta-item">${calSVG} ${ev.date}</span>
              <span class="org-event-meta-item">${pinSVG} ${ev.location}</span>
            </div>
            <div class="org-event-divider"></div>
            <div class="org-event-actions">
              <button class="btn-action btn-action-view" data-action="view" data-id="${ev.id}">
                ${eyeSVG} View
              </button>
              <button class="btn-action btn-action-edit" data-action="edit" data-id="${ev.id}">
                ${editSVG} Edit
              </button>
              <button class="btn-action btn-action-delete" data-action="delete" data-id="${ev.id}">
                ${trashSVG} Delete
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Action handlers
    list.querySelectorAll('.btn-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const { action, id } = btn.dataset;
        const ev = EVENTS.find(e => e.id == id);
        if (!ev) return;

        if (action === 'view')   alert(`Viewing: ${ev.title}`);
        if (action === 'edit')   alert(`Editing: ${ev.title}`);
        if (action === 'delete') {
          if (confirm(`Delete "${ev.title}"?`)) {
            EVENTS.splice(EVENTS.indexOf(ev), 1);
            renderEvents();
          }
        }
      });
    });
  }

  // Create Event button
  document.getElementById('createEventBtn')?.addEventListener('click', () => {
    const title = prompt('New event title:', 'My New Event');
    if (!title) return;
    EVENTS.unshift({
      id: Date.now(),
      title,
      date: 'TBD',
      location: 'TBD',
      status: 'pending',
      image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=280&h=160&fit=crop'
    });
    renderEvents();
  });

  renderEvents();
})();
