'use strict';

/* ── NAV / DRAWER ── */
const hamburgerBtn = document.getElementById('hamburgerBtn');
const navDrawer = document.getElementById('navDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const drawerCloseBtn = document.getElementById('drawerCloseBtn');
const siteHeader = document.getElementById('siteHeader');

window.addEventListener('scroll', () =>
  siteHeader.classList.toggle('scrolled', window.scrollY > 10), { passive: true });

function openDrawer() {
  navDrawer.classList.add('open');
  drawerOverlay.classList.add('open');
  navDrawer.setAttribute('aria-hidden', 'false');
  hamburgerBtn.setAttribute('aria-expanded', 'true');
  hamburgerBtn.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  navDrawer.classList.remove('open');
  drawerOverlay.classList.remove('open');
  navDrawer.setAttribute('aria-hidden', 'true');
  hamburgerBtn.setAttribute('aria-expanded', 'false');
  hamburgerBtn.classList.remove('open');
  document.body.style.overflow = '';
}

hamburgerBtn.addEventListener('click', () =>
  navDrawer.classList.contains('open') ? closeDrawer() : openDrawer());
drawerCloseBtn.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
document.querySelectorAll('.drawer-link').forEach(l => l.addEventListener('click', closeDrawer));

/* auth/drawer/popup init handled by navbar.js */

let EVENTS = [];

let map, markers = {}, activeId = null;
const filters = { date: 'all', category: 'all', location: 'all', price: 'all' };
let activeCat = 'all';

const CITY_COORDS = {
  "Algiers": {lat: 36.7372, lng: 3.15},
  "Oran": {lat: 35.6976, lng: -0.6337},
  "Constantine": {lat: 36.365, lng: 6.6147},
  "Tlemcen": {lat: 34.8839, lng: -1.3151},
  "Batna": {lat: 35.5556, lng: 6.1744},
  "Bejaia": {lat: 36.7515, lng: 5.0564},
  "Annaba": {lat: 36.9, lng: 7.7667},
  "Tizi Ouzou": {lat: 36.7118, lng: 4.0459},
  "Tamanrasset": {lat: 22.785, lng: 5.5228}
};

document.addEventListener('DOMContentLoaded', async () => {
  map = L.map('map', { center: [28.0339, 1.6596], zoom: 5, zoomControl: false, attributionControl: false });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
  L.control.attribution({ prefix: false, position: 'bottomright' })
    .addAttribution('© <a href="https://carto.com">CartoDB</a>').addTo(map);

  try {
    const apiEvents = await fetchPublicEvents(100);
    EVENTS = apiEvents.map(ev => {
      const d = new Date(ev.date || new Date());
      const m = d.getMonth();
      const price = parseFloat(ev.price) || 0;

      let cat = (ev.category || 'all').toLowerCase();
      let badgeColor = 'purple';
      if (cat.includes('science') || cat.includes('tech')) badgeColor = 'indigo';
      else if (cat.includes('sport')) badgeColor = 'orange';
      else if (cat.includes('business')) badgeColor = 'green';
      else if (cat.includes('food')) badgeColor = 'rose';
      else if (cat.includes('art')) badgeColor = 'amber';
      else if (cat.includes('music')) badgeColor = 'blue';

      let city = "Algiers";
      if (ev.location) {
         let locLower = ev.location.toLowerCase();
         if (locLower.includes("oran")) city = "Oran";
         else if (locLower.includes("constantine")) city = "Constantine";
         else if (locLower.includes("tlemcen")) city = "Tlemcen";
         else if (locLower.includes("batna")) city = "Batna";
         else if (locLower.includes("bejaia")) city = "Bejaia";
         else if (locLower.includes("annaba")) city = "Annaba";
         else if (locLower.includes("tizi")) city = "Tizi Ouzou";
         else if (locLower.includes("tamanrasset")) city = "Tamanrasset";
         else city = ev.location.split(',')[0].trim();
      }

      let coords = CITY_COORDS[city] || CITY_COORDS["Algiers"];
      
      // Random offset so markers don't overlap perfectly
      let rLat = coords.lat + (Math.random() - 0.5) * 0.04;
      let rLng = coords.lng + (Math.random() - 0.5) * 0.04;

      return {
        id: ev.id,
        name: ev.title || "Untitled",
        catKey: cat,
        badge: badgeColor,
        month: m,
        city: city,
        dateStr: d.toLocaleString('en-US', {month: 'short', day: '2-digit'}).toUpperCase(),
        time: d.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}),
        venue: ev.location || "TBA",
        lat: rLat,
        lng: rLng,
        price: price,
        img: ev.image ? (ev.image.startsWith('http') ? ev.image : `${API_BASE}${ev.image}`) : "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80"
      };
    });
  } catch(e) {
    console.error("Failed to fetch events", e);
  }

  EVENTS.forEach(ev => addMarker(ev));
  renderList();
  document.getElementById('panelSubtitle').textContent =
    EVENTS.length + ' events across ' + [...new Set(EVENTS.map(e => e.city))].length + ' cities';
  fitAll();
  map.on('click', closeAllDD);
  document.addEventListener('click', e => {
    if (!e.target.closest('.dd-menu') && !e.target.closest('.filter-pill')) closeAllDD();
  });
});

const BADGE_COLORS = { indigo: '#4338ca', orange: '#f97316', blue: '#2563eb', green: '#16a34a', purple: '#7c3aed', rose: '#f43f5e', amber: '#d97706', teal: '#0d9488' };

function addMarker(ev) {
  const color = BADGE_COLORS[ev.badge] || '#7c3aed';
  const icon = L.divIcon({
    className: '',
    html: '<div style="width:34px;height:34px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:' + color +
      ';display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,.25);border:2.5px solid #fff;cursor:pointer;">' +
      '<span style="transform:rotate(45deg);font-size:14px;line-height:1">📍</span></div>',
    iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -36]
  });
  const priceLabel = ev.price === 0 ? 'Free' : ev.price.toLocaleString() + ' DZD';
  const priceClass = ev.price === 0 ? 'free' : 'paid';
  const marker = L.marker([ev.lat, ev.lng], { icon }).addTo(map);
  marker.bindPopup(
    '<div class="popup-img"><img src="' + ev.img + '" alt="' + ev.name + '" onerror="this.style.display=\'none\'"/></div>' +
    '<div class="popup-body"><div class="popup-name">' + ev.name + '</div>' +
    '<div class="popup-loc">📍 ' + ev.venue + ' · 📅 ' + ev.dateStr + ' • ' + ev.time + '</div>' +
    '<div class="popup-row"><span class="popup-price-lbl ' + priceClass + '">' + priceLabel + '</span>' +
    '<a href="../event Description/event-detail.html?id=' + ev.id + '" class="popup-view" style="text-decoration:none;color:inherit;cursor:pointer;">View →</a></div></div>',
    { maxWidth: 230, minWidth: 230 }
  );
  marker.on('click', () => activateCard(ev.id));
  markers[ev.id] = marker;
}

function addEventFromAPI(evObj) { EVENTS.push(evObj); addMarker(evObj); renderList(); fitAll(); }

function getFiltered() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  return EVENTS.filter(ev => {
    if (q && !`${ev.name} ${ev.city} ${ev.venue} ${ev.catKey}`.toLowerCase().includes(q)) return false;
    if (filters.price === 'free' && ev.price !== 0) return false;
    if (filters.price === 'paid' && ev.price === 0) return false;
    if (filters.location !== 'all' && ev.city !== filters.location) return false;
    if (filters.category !== 'all' && ev.catKey !== filters.category) return false;
    if (activeCat !== 'all' && filters.category === 'all' && ev.catKey !== activeCat) return false;
    const m = ev.month;
    if (filters.date === 'oct' && m !== 9) return false;
    if (filters.date === 'nov' && m !== 10) return false;
    if (filters.date === 'dec' && m !== 11) return false;
    if (filters.date === 'jan' && m !== 0) return false;
    if (filters.date === 'feb' && m !== 1) return false;
    if (filters.date === 'mar' && m !== 2) return false;
    return true;
  });
}

function renderList() {
  const list = document.getElementById('eventList');
  const noRes = document.getElementById('noResults');
  const meta = document.getElementById('resultsMeta');
  const filtered = getFiltered();
  EVENTS.forEach(ev => {
    const m = markers[ev.id]; if (!m) return;
    filtered.find(f => f.id === ev.id)
      ? (!map.hasLayer(m) && m.addTo(map))
      : (map.hasLayer(m) && m.removeFrom(map));
  });
  if (!filtered.length) { list.innerHTML = ''; noRes.style.display = 'block'; meta.innerHTML = ''; return; }
  noRes.style.display = 'none';
  meta.innerHTML = 'Showing <strong>' + filtered.length + '</strong> event' + (filtered.length !== 1 ? 's' : '') + ' in Algeria';
  const labels = { science: 'Science & Tech', sports: 'Sports', music: 'Music', business: 'Business', gaming: 'Gaming', food: 'Food & Drink', art: 'Art & Culture', wellness: 'Wellness' };
  list.innerHTML = filtered.map(ev => {
    const priceHtml = ev.price === 0
      ? '<span class="ev-price free">Free</span>'
      : '<span class="ev-price paid">' + ev.price.toLocaleString() + ' DZD</span>';
    return '<div class="ev-card' + (activeId === ev.id ? ' active' : '') + '" id="card-' + ev.id + '" onclick="activateCard(' + ev.id + ',true)">' +
      '<div class="ev-thumb"><img src="' + ev.img + '" alt="' + ev.name + '" onerror="this.style.display=\'none\'"/></div>' +
      '<div class="ev-body"><div class="ev-tags"><span class="ev-badge ' + ev.badge + '">' + (labels[ev.catKey] || ev.catKey) + '</span></div>' +
      '<div class="ev-name">' + ev.name + '</div>' +
      '<div class="ev-meta"><div class="ev-meta-row">📅 ' + ev.dateStr + ' · ' + ev.time + '</div>' +
      '<div class="ev-meta-row">📍 ' + ev.venue + '</div></div></div>' + priceHtml + '</div>';
  }).join('');
}

function activateCard(id, fromCard = false) {
  activeId = id;
  const ev = EVENTS.find(e => e.id === id); if (!ev) return;
  document.querySelectorAll('.ev-card').forEach(c => c.classList.remove('active'));
  const card = document.getElementById('card-' + id);
  if (card) { card.classList.add('active'); card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  if (!fromCard) return;
  map.flyTo([ev.lat, ev.lng], Math.max(map.getZoom(), 12), { duration: .9 });
  setTimeout(() => markers[id]?.openPopup(), 950);
}

function applyFilters() { renderList(); }

function openDD(type, btn) {
  closeAllDD();
  const dd = document.getElementById('dd-' + type); if (!dd) return;
  const r = btn.getBoundingClientRect();
  dd.style.top = (r.bottom + 6) + 'px';
  dd.style.left = r.left + 'px';
  dd.classList.add('open');
  btn.classList.add('active');
}
function closeAllDD() { document.querySelectorAll('.dd-menu').forEach(d => d.classList.remove('open')); }

function pickFilter(type, value, el) {
  if (type === 'category') { filters.category = value; activeCat = 'all'; syncCatPills('all'); }
  else { filters[type] = value; }
  document.querySelectorAll('#dd-' + type + ' .dd-item').forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');
  const pillId = { date: 'fp-date', category: 'fp-cat', location: 'fp-loc', price: 'fp-price' }[type];
  const pill = document.getElementById(pillId);
  if (pill) {
    const icons = { date: '📅', category: '🏷', location: '📍', price: '💰' };
    pill.textContent = icons[type] + ' ' + el.textContent.trim() + ' ▾';
    pill.classList.toggle('active', value !== 'all');
  }
  closeAllDD();
  renderList();
}

function setCat(cat) { activeCat = cat; filters.category = 'all'; syncCatPills(cat); renderList(); }
function syncCatPills(cat) { document.querySelectorAll('.cat-pill').forEach(p => p.classList.toggle('active', p.dataset.ckey === cat)); }
function mapIn() { map.zoomIn(); }
function mapOut() { map.zoomOut(); }
function fitAll() { const f = getFiltered(); if (!f.length) return; map.fitBounds(L.latLngBounds(f.map(e => [e.lat, e.lng])), { padding: [60, 60] }); }
function geoMe() { if (!navigator.geolocation) return; navigator.geolocation.getCurrentPosition(p => map.flyTo([p.coords.latitude, p.coords.longitude], 13), () => { }); }

/* ── MOBILE TAB SWITCHER ── */
let currentMobileTab = 'list';
function switchMobileTab(tab) {
  currentMobileTab = tab;
  const leftPanel = document.querySelector('.left-panel');
  const mapContainer = document.querySelector('.map-container');
  const tabListBtn = document.getElementById('tabList');
  const tabMapBtn = document.getElementById('tabMap');
  if (tab === 'list') {
    leftPanel.classList.remove('mob-hidden');
    mapContainer.classList.add('mob-hidden');
    tabListBtn.classList.add('active');
    tabMapBtn.classList.remove('active');
  } else {
    leftPanel.classList.add('mob-hidden');
    mapContainer.classList.remove('mob-hidden');
    tabListBtn.classList.remove('active');
    tabMapBtn.classList.add('active');
    /* wait for visibility transition then force Leaflet to recalculate size */
    setTimeout(() => { if (map) { map.invalidateSize(true); } }, 250);
  }
}

/* ── RESIZE FIX: reset layout when switching desktop ↔ mobile ── */
let lastMobile = window.innerWidth <= 900;
window.addEventListener('resize', () => {
  const isMobile = window.innerWidth <= 900;
  if (isMobile === lastMobile) return;
  lastMobile = isMobile;
  const leftPanel = document.querySelector('.left-panel');
  const mapContainer = document.querySelector('.map-container');
  if (!isMobile) {
    /* restored to desktop: show both panels, reset body style */
    leftPanel.classList.remove('mob-hidden');
    mapContainer.classList.remove('mob-hidden');
    document.body.style.overflow = '';
    setTimeout(() => { if (map) map.invalidateSize(); }, 100);
  } else {
    /* switched to mobile: show list tab by default */
    switchMobileTab('list');
  }
}, { passive: true });
