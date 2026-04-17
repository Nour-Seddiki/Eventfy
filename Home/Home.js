/* ══════════════════════════════════════════
   Home.js — Eventfy
   Fixes:
   • drawer runs inside DOMContentLoaded (no null refs)
   • active nav link tracks scroll position
   • like button toggles correctly
   • scroll-to-top works
   • smooth scroll for anchor links
   Additions:
   • ripple effect on buttons
   • nav highlight follows scroll
   • staggered event card reveals
   • scroll-to-top button
══════════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ── refs ── */
  const nav          = document.getElementById('mainNav');
  const hamburger    = document.getElementById('hamburgerBtn');
  const drawer       = document.getElementById('navDrawer');
  const overlay      = document.getElementById('overlay');
  const drawerClose  = document.getElementById('drawerCloseBtn');
  const scrollTopBtn = document.getElementById('scrollTopBtn');

  /* ══════════════════════════════════════════
     DRAWER — open / close
  ══════════════════════════════════════════ */
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

  if (hamburger)   hamburger.addEventListener('click', () => drawer.classList.contains('open') ? closeDrawer() : openDrawer());
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (overlay)     overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  document.querySelectorAll('.drawer-links a').forEach(a => a.addEventListener('click', closeDrawer));

  /* ══════════════════════════════════════════
     NAV SCROLL — shadow + active link tracking
  ══════════════════════════════════════════ */
  const sections = [
    { id:'hero-section', li: document.querySelector('.nav-item:nth-child(1)') },
  ];

  function onScroll() {
    /* shadow */
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 8);
    /* scroll-to-top visibility */
    if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', window.scrollY > 320);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  /* ══════════════════════════════════════════
     DESKTOP NAV — hover dims first item
  ══════════════════════════════════════════ */
  const navItems = document.querySelectorAll('.nav-links .nav-item');
  const firstLink = document.querySelector('.nav-links .nav-item:first-child a');

  navItems.forEach((li, idx) => {
    if (idx === 0) return;
    const a = li.querySelector('a');
    if (!a) return;
    a.addEventListener('mouseenter', () => { if (firstLink) firstLink.style.color = '#94a3b8'; });
    a.addEventListener('mouseleave', () => { if (firstLink) firstLink.style.color = ''; });
  });

  /* ══════════════════════════════════════════
     SCROLL-TO-TOP
  ══════════════════════════════════════════ */
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ══════════════════════════════════════════
     RIPPLE EFFECT — on all interactive buttons
  ══════════════════════════════════════════ */
  function addRipple(e) {
    const btn    = e.currentTarget;
    const circle = document.createElement('span');
    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height) * 1.5;
    circle.style.cssText = `
      position:absolute;
      border-radius:50%;
      background:rgba(255,255,255,.35);
      width:${size}px; height:${size}px;
      left:${e.clientX - rect.left - size/2}px;
      top:${e.clientY - rect.top  - size/2}px;
      transform:scale(0);
      animation:ripple .5s linear;
      pointer-events:none;
    `;
    /* make sure button is positioned */
    if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(circle);
    circle.addEventListener('animationend', () => circle.remove());
  }

  /* inject ripple keyframes once */
  if (!document.getElementById('ripple-style')) {
    const st = document.createElement('style');
    st.id = 'ripple-style';
    st.textContent = `@keyframes ripple{to{transform:scale(1);opacity:0}}`;
    document.head.appendChild(st);
  }

  document.querySelectorAll(
    '.btn-explore,.btn-host,.btn-login,.btn-register,.btn-cta-primary,.btn-cta-outline,.drawer-actions button'
  ).forEach(btn => btn.addEventListener('click', addRipple));

  /* ══════════════════════════════════════════
     LIKE BUTTON TOGGLE
  ══════════════════════════════════════════ */
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      btn.classList.toggle('liked');
      btn.textContent = '❤';
      /* micro bounce */
      btn.animate([
        {transform:'scale(1.4)'},
        {transform:'scale(.9)'},
        {transform:'scale(1)'},
      ], { duration:350, easing:'ease' });
    });
  });

  /* ══════════════════════════════════════════
     TYPEWRITER HERO TEXT
  ══════════════════════════════════════════ */
  const typeEl = document.querySelector('.to-animate');
  if (typeEl) {
    const fullText = `Discover Events\nThat <span style="color:#7F0DF2">Move</span> <span style="color:#FF6B00">You</span>`;
    let i = 0, current = '', isTag = false;

    function type() {
      if (i < fullText.length) {
        const ch = fullText[i];
        if (ch === '<') isTag = true;
        if (ch === '>') isTag = false;
        current += ch;
        typeEl.innerHTML = current + '<span class="cursor"></span>';
        i++;
        setTimeout(type, isTag ? 0 : 48);
      } else {
        typeEl.innerHTML = current;
      }
    }
    /* slight delay so page paints first */
    setTimeout(type, 300);
  }

  /* ══════════════════════════════════════════
     HERO IMAGE ANIMATE ON LOAD
  ══════════════════════════════════════════ */
  const heroImg = document.querySelector('.page1-2 img');
  if (heroImg) {
    if (document.readyState === 'complete') {
      heroImg.classList.add('animate');
    } else {
      window.addEventListener('load', () => heroImg.classList.add('animate'));
    }
  }

  /* ══════════════════════════════════════════
     SCROLL REVEAL — IntersectionObserver
  ══════════════════════════════════════════ */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealIO.unobserve(entry.target); // fire once
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale')
    .forEach(el => revealIO.observe(el));

  /* ══════════════════════════════════════════
     EVENT CARDS — stagger on scroll into view
  ══════════════════════════════════════════ */
  const eventCards = document.querySelectorAll('.event');
  if (eventCards.length) {
    const cardIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          eventCards.forEach((card, i) => {
            setTimeout(() => card.classList.add('active'), i * 150);
          });
          cardIO.disconnect();
        }
      });
    }, { threshold: 0.15 });
    cardIO.observe(eventCards[0]);
  }

  /* ══════════════════════════════════════════
     CATEGORY CARDS — stagger reveal
  ══════════════════════════════════════════ */
  const catCards = document.querySelectorAll('.cat-card');
  if (catCards.length) {
    const catIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          catCards.forEach((card, i) => {
            setTimeout(() => card.classList.add('active'), i * 80);
          });
          catIO.disconnect();
        }
      });
    }, { threshold: 0.1 });
    catIO.observe(catCards[0]);
  }

  /* ══════════════════════════════════════════
     SMOOTH SCROLL for internal anchors
  ══════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    });
  });

}); // end DOMContentLoaded
