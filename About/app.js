/* ══════════════════════════════════════════
   NAV — exactly like Home project
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  const nav       = document.getElementById('mainNav');
  const hamburger = document.getElementById('hamburgerBtn');
  const drawer    = document.getElementById('navDrawer');
  const overlay   = document.getElementById('overlay');
  const closeBtn  = document.getElementById('drawerCloseBtn');

  /* scroll shadow */
  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 8);
  }, { passive: true });

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
    drawer.classList.contains('open') ? closeDrawer() : openDrawer()
  );
  closeBtn?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  document.querySelectorAll('.drawer-links a').forEach(a => a.addEventListener('click', closeDrawer));
  window.addEventListener('resize', () => { if (window.innerWidth >= 851) closeDrawer(); }, { passive: true });

});

/* ══════════════════════════════════════════
   ORIGINAL app.js — unchanged below
══════════════════════════════════════════ */

// ===== SCROLL ANIMATIONS =====
const animateElements = document.querySelectorAll('.animate-in');
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
animateElements.forEach((el) => observer.observe(el));

// ===== STICKY HEADER SHADOW =====
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
  if (header) {
    header.style.boxShadow = window.scrollY > 10 ? '0 2px 20px rgba(0,0,0,0.08)' : 'none';
  }
});

// ===== CTA BUTTON CLICKS =====
document.querySelectorAll('[data-action]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    if (action === 'register')   alert('Registration coming soon!');
    else if (action === 'browse') alert('Browse events coming soon!');
    else if (action === 'login')  alert('Login coming soon!');
  });
});
