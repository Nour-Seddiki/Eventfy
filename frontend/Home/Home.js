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
  const scrollTopBtn = document.getElementById('scrollTopBtn');

  /* ══════════════════════════════════════════
     SCROLL — scroll-to-top button visibility
  ══════════════════════════════════════════ */
  function onScroll() {
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

  /* ══════════════════════════════════════════
     DYNAMIC EVENT FETCHING
  ══════════════════════════════════════════ */
  async function loadFeaturedEvents() {
    const grid = document.getElementById('featuredEventsGrid');
    if (!grid) return;

    try {
      // Use api.js function
      const events = await fetchTrendingEvents(3);
      
      if (!events || events.length === 0) {
        grid.innerHTML = '<p>No featured events at this time.</p>';
        return;
      }

      grid.innerHTML = events.map(ev => {
        const dateObj = ev.date ? new Date(ev.date) : new Date();
        const month = dateObj.toLocaleString('en-US', { month: 'short' });
        const day = dateObj.getDate();
        
        // Add random or default images if not provided
        const imgUrl = ev.image 
          ? (ev.image.startsWith('http') ? ev.image : `${API_BASE}${ev.image}`)
          : 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80';

        return `
          <div class="event reveal-scale" onclick="window.location.href='../event Description/event-detail.html?id=${ev.id}'" style="cursor:pointer">
            <div class="event-up" style="background-image:url(${imgUrl})">
              <div class="event-type">${ev.category || 'General'}</div>
              <button class="like-btn" aria-label="Like" onclick="event.stopPropagation();">❤</button>
            </div>
            <div class="event-down">
              <div class="event-down-1">
                <div class="event-date">
                  <div class="event-month">${month}</div>
                  <div class="event-day">${day}</div>
                </div>
                <div class="envent-desb">
                  <div class="event-name">${ev.title || 'Untitled Event'}</div>
                  <div class="event-map">${ev.location || 'TBA'}</div>
                </div>
              </div>
              <div class="event-down-2">
                <div class="event-member">
                  <svg width="72" height="28" viewBox="0 0 72 28" fill="none">
                    <circle cx="14" cy="14" r="13" fill="#c4b5fd" stroke="white" stroke-width="2"/>
                    <text x="14" y="18" text-anchor="middle" font-size="10" fill="#4c1d95" font-family="sans-serif" font-weight="700">A</text>
                    <circle cx="30" cy="14" r="13" fill="#a78bfa" stroke="white" stroke-width="2"/>
                    <text x="30" y="18" text-anchor="middle" font-size="10" fill="#4c1d95" font-family="sans-serif" font-weight="700">B</text>
                    <circle cx="46" cy="14" r="13" fill="#7c3aed" stroke="white" stroke-width="2"/>
                    <text x="46" y="18" text-anchor="middle" font-size="10" fill="white" font-family="sans-serif" font-weight="700">+${ev.tickets_sold || 0}</text>
                  </svg>
                </div>
                <div class="event-price">${ev.price > 0 ? '$' + ev.price : 'Free'}</div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Observe the new elements for the reveal animation
      const eventCards = document.querySelectorAll('.event.reveal-scale');
      if (eventCards.length && revealIO) {
        eventCards.forEach(el => revealIO.observe(el));
      }

    } catch (err) {
      console.error(err);
      grid.innerHTML = '<p>Failed to load events.</p>';
    }
  }

  loadFeaturedEvents();

}); // end DOMContentLoaded
