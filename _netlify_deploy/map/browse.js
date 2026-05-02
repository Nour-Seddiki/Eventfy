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

/* ── Skeleton for browse sidebar ── */
function showBrowseSkeletons(count = 5) {
  const list = document.getElementById('eventList');
  if (!list) return;
  list.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-ev-card">
      <div class="skel-thumb skeleton"></div>
      <div class="skel-ev-body">
        <div class="skel-ev-badge skeleton"></div>
        <div class="skel-ev-name skeleton"></div>
        <div class="skel-ev-meta skeleton"></div>
      </div>
    </div>
  `).join('');
}

let map, markers = {}, activeId = null;
const filters = { date: 'all', category: 'all', location: 'all', price: 'all' };
let activeCat = 'all';

const ALGERIA_CITIES = [
  { code: '01', name: 'Adrar', lat: 27.8742, lng: -0.2939 },
  { code: '02', name: 'Chlef', lat: 36.1647, lng: 1.3317 },
  { code: '03', name: 'Laghouat', lat: 33.8003, lng: 2.8653 },
  { code: '04', name: 'Oum El Bouaghi', lat: 35.8782, lng: 7.1133 },
  { code: '05', name: 'Batna', lat: 35.5547, lng: 6.1736 },
  { code: '06', name: 'Béjaïa', lat: 36.7519, lng: 5.0564 },
  { code: '07', name: 'Biskra', lat: 34.8500, lng: 5.7333 },
  { code: '08', name: 'Béchar', lat: 31.6111, lng: -2.2167 },
  { code: '09', name: 'Blida', lat: 36.4722, lng: 2.8294 },
  { code: '10', name: 'Bouira', lat: 36.3700, lng: 3.9000 },
  { code: '11', name: 'Tamanrasset', lat: 22.7853, lng: 5.5228 },
  { code: '12', name: 'Tébessa', lat: 35.4042, lng: 8.1189 },
  { code: '13', name: 'Tlemcen', lat: 34.8786, lng: -1.3158 },
  { code: '14', name: 'Tiaret', lat: 35.3706, lng: 1.3217 },
  { code: '15', name: 'Tizi Ouzou', lat: 36.7169, lng: 4.0497 },
  { code: '16', name: 'Alger', lat: 36.7372, lng: 3.0869 },
  { code: '17', name: 'Djelfa', lat: 34.6736, lng: 3.2631 },
  { code: '18', name: 'Jijel', lat: 36.8211, lng: 5.7667 },
  { code: '19', name: 'Sétif', lat: 36.1900, lng: 5.4100 },
  { code: '20', name: 'Saïda', lat: 34.8317, lng: 0.1517 },
  { code: '21', name: 'Skikda', lat: 36.8760, lng: 6.9078 },
  { code: '22', name: 'Sidi Bel Abbès', lat: 35.1897, lng: -0.6306 },
  { code: '23', name: 'Annaba', lat: 36.9000, lng: 7.7667 },
  { code: '24', name: 'Guelma', lat: 36.4611, lng: 7.4275 },
  { code: '25', name: 'Constantine', lat: 36.3650, lng: 6.6147 },
  { code: '26', name: 'Médéa', lat: 36.2636, lng: 2.7508 },
  { code: '27', name: 'Mostaganem', lat: 35.9333, lng: 0.0833 },
  { code: '28', name: 'M\'Sila', lat: 35.7058, lng: 4.5408 },
  { code: '29', name: 'Mascara', lat: 35.3956, lng: 0.1400 },
  { code: '30', name: 'Ouargla', lat: 31.9539, lng: 5.3242 },
  { code: '31', name: 'Oran', lat: 35.6911, lng: -0.6417 },
  { code: '32', name: 'El Bayadh', lat: 33.6833, lng: 1.0167 },
  { code: '33', name: 'Illizi', lat: 26.5000, lng: 8.4833 },
  { code: '34', name: 'Bordj Bou Arréridj', lat: 36.0731, lng: 4.7631 },
  { code: '35', name: 'Boumerdès', lat: 36.7667, lng: 3.4667 },
  { code: '36', name: 'El Tarf', lat: 36.7676, lng: 8.3131 },
  { code: '37', name: 'Tindouf', lat: 27.6740, lng: -8.1380 },
  { code: '38', name: 'Tissemsilt', lat: 35.6072, lng: 1.8119 },
  { code: '39', name: 'El Oued', lat: 33.3564, lng: 6.8631 },
  { code: '40', name: 'Khenchela', lat: 35.4333, lng: 7.1333 },
  { code: '41', name: 'Souk Ahras', lat: 36.2869, lng: 7.9514 },
  { code: '42', name: 'Tipaza', lat: 36.5878, lng: 2.4483 },
  { code: '43', name: 'Mila', lat: 36.4500, lng: 6.2667 },
  { code: '44', name: 'Aïn Defla', lat: 36.2642, lng: 1.9656 },
  { code: '45', name: 'Naâma', lat: 33.2667, lng: -0.3000 },
  { code: '46', name: 'Aïn Témouchent', lat: 35.2964, lng: -1.1400 },
  { code: '47', name: 'Ghardaïa', lat: 32.4903, lng: 3.6667 },
  { code: '48', name: 'Relizane', lat: 35.7333, lng: 0.5544 },
  { code: '49', name: 'Timimoun', lat: 29.2636, lng: 0.2306 },
  { code: '50', name: 'Bordj Badji Mokhtar', lat: 21.3258, lng: 0.9564 },
  { code: '51', name: 'Ouled Djellal', lat: 34.4183, lng: 5.0681 },
  { code: '52', name: 'Béni Abbès', lat: 30.1281, lng: -2.1644 },
  { code: '53', name: 'In Salah', lat: 27.1972, lng: 2.4758 },
  { code: '54', name: 'In Guezzam', lat: 19.5667, lng: 5.7667 },
  { code: '55', name: 'Touggourt', lat: 33.0994, lng: 6.0658 },
  { code: '56', name: 'Djanet', lat: 24.5558, lng: 9.4844 },
  { code: '57', name: 'El M\'Ghair', lat: 33.9500, lng: 5.9167 },
  { code: '58', name: 'El Meniaa', lat: 30.5833, lng: 2.8833 }
];

document.addEventListener('DOMContentLoaded', async () => {
  /* Show skeletons immediately while data loads */
  showBrowseSkeletons(5);

  map = L.map('map', { center: [28.0339, 1.6596], zoom: 5, zoomControl: false, attributionControl: false });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
  L.control.attribution({ prefix: false, position: 'bottomright' })
    .addAttribution('© <a href="https://carto.com">CartoDB</a>').addTo(map);

  try {
    const apiEvents = await fetchPublicEvents(100);
    EVENTS = apiEvents.map(ev => {
      const deadlineRaw = ev.registration_deadline || ev.start_date || ev.date || new Date();
      const d = new Date(deadlineRaw);
      const m = d.getMonth();
      const isExpired = d < new Date();
      const price = parseFloat(ev.price) || 0;

      let cat = (ev.category || 'all').toLowerCase();
      let badgeColor = 'purple';
      if (cat.includes('science') || cat.includes('tech')) badgeColor = 'indigo';
      else if (cat.includes('sport')) badgeColor = 'orange';
      else if (cat.includes('business')) badgeColor = 'green';
      else if (cat.includes('food')) badgeColor = 'rose';
      else if (cat.includes('art')) badgeColor = 'amber';
      else if (cat.includes('music')) badgeColor = 'blue';

      let city = "Alger"; // default
      let coords = { lat: 36.7372, lng: 3.0869 }; // default Alger
      
      if (ev.location) {
         let locLower = ev.location.toLowerCase();
         // Try to find matching wilaya
         const found = ALGERIA_CITIES.find(c => locLower.includes(c.name.toLowerCase()) || (c.name === 'Alger' && locLower.includes('algiers')));
         if (found) {
            city = found.name;
            coords = { lat: found.lat, lng: found.lng };
         } else {
            city = ev.location.split(',')[0].trim();
         }
      }
      
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
        isExpired: isExpired,
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
      
    const expiredStyle = ev.isExpired ? 'filter: grayscale(1); opacity: 0.6; pointer-events: none;' : '';
    
    return '<div class="ev-card' + (activeId === ev.id ? ' active' : '') + '" id="card-' + ev.id + '" style="' + expiredStyle + '" onclick="activateCard(' + ev.id + ',true)">' +
      '<div class="ev-thumb"><img src="' + ev.img + '" alt="' + ev.name + '" loading="lazy" onerror="this.style.display=\'none\'"/></div>' +
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
