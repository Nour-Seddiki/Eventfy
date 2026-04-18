'use strict';

/* ══════════════════════════════════════════════
   EVENT DATA
   Each card must have data-attributes in HTML:
   data-cat, data-city, data-month, data-price
   ══════════════════════════════════════════════ */
const filters = { category: 'all', date: 'all', location: 'all', price: 'all' };

/* ── FILTER CORE ── */
function getFilteredCards() {
  const q = document.getElementById('searchInput')?.value.toLowerCase() || '';
  return Array.from(document.querySelectorAll('.event-card')).filter(card => {
    const title    = card.querySelector('.card-title')?.textContent.toLowerCase()    || '';
    const loc      = card.querySelector('.card-location')?.textContent.toLowerCase() || '';
    const badge    = card.querySelector('.badge')?.textContent.toLowerCase()         || '';
    const cat      = card.dataset.cat   || '';
    const city     = card.dataset.city  || '';
    const month    = parseInt(card.dataset.month ?? '-1', 10);
    const price    = parseInt(card.dataset.price ?? '0',  10);

    if (q && !title.includes(q) && !loc.includes(q) && !badge.includes(q)) return false;
    if (filters.category !== 'all' && cat !== filters.category)             return false;
    if (filters.location  !== 'all' && city !== filters.location)           return false;
    if (filters.price === 'free' && price !== 0)   return false;
    if (filters.price === 'paid' && price === 0)   return false;

    const dateMap = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
    if (filters.date !== 'all' && month !== dateMap[filters.date]) return false;

    return true;
  });
}

function applyFilters() {
  const all      = Array.from(document.querySelectorAll('.event-card'));
  const filtered = getFilteredCards();
  all.forEach(card => card.style.display = filtered.includes(card) ? '' : 'none');

  /* show / hide no-results message */
  let noRes = document.getElementById('noResults');
  if (!noRes) {
    noRes = document.createElement('p');
    noRes.id = 'noResults';
    noRes.style.cssText = 'grid-column:1/-1;text-align:center;color:#94a3b8;padding:2rem;font-size:15px;font-weight:600';
    noRes.textContent = 'No events match your filters.';
    document.querySelector('.event-grid')?.appendChild(noRes);
  }
  noRes.style.display = filtered.length ? 'none' : '';
}

/* ── DROPDOWN HELPERS ── */
let _activeDD = null;   // { type, btn, dd }

function positionDD(dd, btn) {
  const r = btn.getBoundingClientRect();
  dd.style.top  = (r.bottom + 6) + 'px';
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
  const pill   = document.getElementById(pillId);
  if (pill) {
    const icons = { date: '📅', category: '🏷️', location: '📍', price: '💰' };
    const label = value === 'all'
      ? { date:'Any Date', category:'Category', location:'Location', price:'Any Price' }[type]
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
document.addEventListener('DOMContentLoaded', () => {

  /* ── drawer open/close ── */
  const hamburger   = document.getElementById('hamburgerBtn');
  const drawer      = document.getElementById('navDrawer');
  const overlay     = document.getElementById('overlay');
  const drawerClose = document.getElementById('drawerCloseBtn');
  const mainNav     = document.getElementById('mainNav');

  window.addEventListener('scroll', () =>
    mainNav?.classList.toggle('scrolled', window.scrollY > 8), { passive: true });

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('active');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', () =>
    drawer.classList.contains('open') ? closeDrawer() : openDrawer());
  drawerClose?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDrawer(); closeAllDD(); } });
  document.querySelectorAll('.drawer-links a').forEach(a => a.addEventListener('click', closeDrawer));

  /* ── close dropdowns on outside click ── */
  document.addEventListener('click', e => {
    if (!e.target.closest('.dd-menu') && !e.target.closest('.filter-pill')) closeAllDD();
  });

  /* ── search ── */
  document.getElementById('searchInput')?.addEventListener('input', applyFilters);

  /* ── fav buttons ── */
  document.querySelectorAll('.fav-btn').forEach(btn =>
    btn.addEventListener('click', () => btn.classList.toggle('liked')));

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

  /* ── init auth ── */
  authInit();
});
