'use strict';

/* ── NAV / DRAWER ── */
const hamburgerBtn   = document.getElementById('hamburgerBtn');
const navDrawer      = document.getElementById('navDrawer');
const drawerOverlay  = document.getElementById('drawerOverlay');
const drawerCloseBtn = document.getElementById('drawerCloseBtn');
const siteHeader     = document.getElementById('siteHeader');

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

document.addEventListener('DOMContentLoaded', () => { authInit(); });

/* ── EVENT DATA ── */
const EVENTS = [
  {id:1,  name:"Tech Innovators Summit 2026",   catKey:"science",  badge:"indigo", month:10, city:"Algiers",     dateStr:"NOV 14", time:"10:00 AM", venue:"Bab Ezzouar, Algiers",              lat:36.7372, lng:3.15,     price:1200, img:"https://lh3.googleusercontent.com/aida-public/AB6AXuDId7VpFfX0ROxT52voezzX99Bcxa63u1UvsN0BqOGQpJEhFQgHPuqk5WbDNqTyeIqmVW_VlQ_OHNTcReVpEVgZmFo8Z9WN-EjUuMN348qEbsPFMCXYRNN1txB1XZ6ckDmujjzqLpMBYcqXwNC-N5aFMTOsVa6UCYP3Akea9tDCC8z5xyQJtpE6_2_FI1hL3gdQF3hSVGLAsNknIXSs7_ea8QezAuUUW2xrDvSpy7SJ6xmYZyTlH1YkLaL8wTByEnyVtbX0Wj9EzXJF"},
  {id:2,  name:"Annual City Marathon",           catKey:"sports",   badge:"orange", month:11, city:"Algiers",     dateStr:"DEC 02", time:"07:00 AM", venue:"Alger Center, Algiers",             lat:36.7538, lng:3.0588,  price:0,    img:"https://lh3.googleusercontent.com/aida-public/AB6AXuAtlXD3Q4HnGv46VZY3uhwE7m1FfJDsxslCMjzhP7uPnNsDi-yTM6HnaiePFzFFNZNlmAxwuCgSp8FcajfqcA3qU57XQB_x7LXNxWURzK5H1EOuKlynF-vhvxYpGHRwGq_aXwt2igpNNs2UV-qDdjMj3s_9H_oa7aAoAU2xx71cN5rfidYn_r1YW4e-F_couLomtB-a-xnfzQR9Wm8lkw41MZLHsh8JCxsfCsd_TzLBd7aPujJQ3v_tQFegZTMx5mmztCAQCP22D4vj"},
  {id:3,  name:"NexTrace CTF",                   catKey:"science",  badge:"blue",   month:9,  city:"Bejaia",      dateStr:"OCT 28", time:"08:00 PM", venue:"Estin, Bejaia",                     lat:36.7515, lng:5.0564,  price:0,    img:"https://lh3.googleusercontent.com/aida-public/AB6AXuCK0TO831JBi1eDeUDyShTKyB1_nIX6XhlPxwVNPvWr-33nmVuHRmKxZ4yexavieSJtPX9FKVn_AKSj28lSM7ElgKQ4jrAsYWcqNw_s68ESjD5HyGNPzSto3iIqr_jiDCkOijKTBOQ3DKawENQMolN2PzGXpNllwg8et6pAp1UhmqmPa6vFo0IpS3ni68JtpLme2ZAKSDPkT5b29nivR3beiZSy90bbnUYdGTSsPtber_V_ijQdqjX1T5AQ6QMaQPz0ydZ5odYklkve"},
  {id:4,  name:"Startup Founder Meetup",         catKey:"business", badge:"green",  month:10, city:"Batna",       dateStr:"NOV 18", time:"02:00 PM", venue:"Batna University, Batna",           lat:35.5556, lng:6.1744,  price:500,  img:"https://lh3.googleusercontent.com/aida-public/AB6AXuANkTIexrer3vGWa7u5uGphJoOFIcAuMmHMFqO3PIwiz1sRU4anD_lJ8Grp7P1qjz0Z9fQuSO0eN7qVN-Nwr4usHpoTrjEMCM6ygUHOfDJLUUTHyUMNsRVo5ta_QxIwDzUcLR88FaTI5NkuQzj01JAfdsxxO5fCwoE7Aw92jgmXveTEt3Owgd8KQI6fMETm4wF8ef7OJYbEsTS7hnsqsAvxnPOS3E70zvj0mNyu12XycUYLmVeO9xHzAAKiqG585J4kbZbFr63uiaWs"},
  {id:5,  name:"Valorant Tournament",            catKey:"gaming",   badge:"purple", month:11, city:"Algiers",     dateStr:"DEC 10", time:"06:00 PM", venue:"eSports Hub, Algiers",              lat:36.72,   lng:3.08,    price:800,  img:"https://lh3.googleusercontent.com/aida-public/AB6AXuD4Db2Wc6wmWsEDkWGM4F2xBoUfc6_DiW0-rii9vWGdLryBJObKzmXfCW4gJp6NBO3r_MDPOE8n9nBrFFPnA8iiRoMl6LUVbp7NceMjufpR5U4BmxVYleRxA7229D-9KA_Lb5MwxBa5S6kZ9c7FydfyK3hXqfq_eS-nzZnTb6x-v5Lnmj9CLXLVrlQwGp7esNZhXN4smQicWDa8lItpl5R4HMa3UJqS1233BfkARcgQ8Fbzu80ZbpWpNmoayCtSYf1s2cXIjx_Hiy_r"},
  {id:6,  name:"Festival Algérien du Couscous",  catKey:"food",     badge:"rose",   month:0,  city:"Algiers",     dateStr:"JAN 05", time:"01:00 PM", venue:"Riad El Feth, Algiers",             lat:36.744,  lng:3.062,   price:300,  img:"https://lh3.googleusercontent.com/aida-public/AB6AXuCG3Sd72Dc0x-2Ghzy1lJ7nfmmZOjnLr1ODO9TUnEBAHDI8SVo8bJw4cXF-TgaJbSk0LKE2XrhIWeUTWeG-slgsPjfHF1fRi8M7PGbFfclS3sxNwvwEKHGOzZH9-rxLUwhtXcdss8_e6iYTYo5Di3qNBYZ79ogOh_xNmyFOMlvkgu7RTFo1KZKVlu5lk2ZKQAbGl8PsdWTwAAgjnM0ntMVzFWqEN4g8-csa5HlHBZkIKivd_rknmeaun7RXwWh6JOlEn_Yja_Vc"},
  {id:7,  name:"Jazz Night Under the Stars",     catKey:"music",    badge:"indigo", month:1,  city:"Algiers",     dateStr:"FEB 12", time:"08:00 PM", venue:"Jardin d'Essai, Algiers",           lat:36.76,   lng:3.075,   price:1000, img:"https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&auto=format&fit=crop"},
  {id:8,  name:"Modern Art Exhibition",          catKey:"art",      badge:"amber",  month:2,  city:"Algiers",     dateStr:"MAR 05", time:"10:00 AM", venue:"MAMA Museum, Algiers",              lat:36.735,  lng:3.058,   price:200,  img:"https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=600&auto=format&fit=crop"},
  {id:9,  name:"Sunset Yoga Session",            catKey:"sports",   badge:"teal",   month:2,  city:"Algiers",     dateStr:"MAR 15", time:"05:30 PM", venue:"Sablettes, Algiers",                lat:36.77,   lng:3.045,   price:0,    img:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop"},
  {id:10, name:"Oran Summer Vibes Festival",     catKey:"music",    badge:"purple", month:10, city:"Oran",        dateStr:"NOV 05", time:"06:00 PM", venue:"Le Méridien, Oran",                 lat:35.6976, lng:-0.6337, price:1500, img:"https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&auto=format&fit=crop"},
  {id:11, name:"Constantine Book Fair",          catKey:"science",  badge:"blue",   month:11, city:"Constantine", dateStr:"DEC 14", time:"09:00 AM", venue:"Palais de la Culture, Constantine", lat:36.365,  lng:6.6147,  price:0,    img:"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&auto=format&fit=crop"},
  {id:12, name:"Tlemcen Arts & Crafts Fair",     catKey:"art",      badge:"amber",  month:10, city:"Tlemcen",     dateStr:"NOV 08", time:"10:00 AM", venue:"Grande Mosquée, Tlemcen",           lat:34.8839, lng:-1.3151, price:300,  img:"https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&auto=format&fit=crop"}
];

let map, markers = {}, activeId = null;
const filters = { date: 'all', category: 'all', location: 'all', price: 'all' };
let activeCat = 'all';

document.addEventListener('DOMContentLoaded', () => {
  map = L.map('map', { center: [28.0339, 1.6596], zoom: 5, zoomControl: false, attributionControl: false });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
  L.control.attribution({ prefix: false, position: 'bottomright' })
    .addAttribution('© <a href="https://carto.com">CartoDB</a>').addTo(map);
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
    '<span class="popup-view" onclick="activateCard(' + ev.id + ')">View →</span></div></div>',
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
    if (filters.date === 'oct' && m !== 9)  return false;
    if (filters.date === 'nov' && m !== 10) return false;
    if (filters.date === 'dec' && m !== 11) return false;
    if (filters.date === 'jan' && m !== 0)  return false;
    if (filters.date === 'feb' && m !== 1)  return false;
    if (filters.date === 'mar' && m !== 2)  return false;
    return true;
  });
}

function renderList() {
  const list     = document.getElementById('eventList');
  const noRes    = document.getElementById('noResults');
  const meta     = document.getElementById('resultsMeta');
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
  dd.style.top  = (r.bottom + 6) + 'px';
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

function setCat(cat)      { activeCat = cat; filters.category = 'all'; syncCatPills(cat); renderList(); }
function syncCatPills(cat){ document.querySelectorAll('.cat-pill').forEach(p => p.classList.toggle('active', p.dataset.ckey === cat)); }
function mapIn()  { map.zoomIn(); }
function mapOut() { map.zoomOut(); }
function fitAll() { const f = getFiltered(); if (!f.length) return; map.fitBounds(L.latLngBounds(f.map(e => [e.lat, e.lng])), { padding: [60, 60] }); }
function geoMe()  { if (!navigator.geolocation) return; navigator.geolocation.getCurrentPosition(p => map.flyTo([p.coords.latitude, p.coords.longitude], 13), () => {}); }

/* ── MOBILE TAB SWITCHER ── */
let currentMobileTab = 'list';
function switchMobileTab(tab) {
  currentMobileTab = tab;
  const leftPanel    = document.querySelector('.left-panel');
  const mapContainer = document.querySelector('.map-container');
  const tabListBtn   = document.getElementById('tabList');
  const tabMapBtn    = document.getElementById('tabMap');
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
  const leftPanel    = document.querySelector('.left-panel');
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
