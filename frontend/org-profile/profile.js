/* ================================================================
   ORGANIZER PROFILE — Page Script
   organizer-profile.js
   ================================================================ */

window.EVENTFY_USER = { name: 'Alex Rivers', initials: 'AR', role: 'Organizer' };
window.EVENTFY_LINKS = {
  profile:     'index.html',
  myEvents:    '../organizer-dashboard/index.html',
  savedEvents: '../my-dashboard/index.html'
};

(function () {
  'use strict';

  /* ---------------------------------------------------------------
     1. STATE
     --------------------------------------------------------------- */
  const state = {
    name: 'Alex Rivers',
    bio: 'Professional event organizer specializing in tech conferences and networking summits. Dedicated to creating seamless experiences that foster innovation and meaningful connections within the tech ecosystem.',
    email: 'example@gmail.com',
    phone: '0555555555',
    socials: 'www.example.com',
    location: 'USTHB, Alger',
  };

  /* ---------------------------------------------------------------
     2. DOM REFS (resolved after DOMContentLoaded)
     --------------------------------------------------------------- */
  let refs = {};

  function resolveRefs() {
    refs = {
      avatar: document.querySelector('.profile-avatar'),
      profileName: document.querySelector('.profile-name'),
      profileBio: document.querySelector('.profile-bio'),
      photoInput: document.getElementById('photoInput'),
      editBtn: document.getElementById('editProfileBtn'),

      // contact value spans (we'll query them after building)
      contactValues: document.querySelectorAll('.contact-value'),

      // modal (built dynamically)
      modal: null,
      overlay: null,
    };
  }

  /* ---------------------------------------------------------------
     3. PHOTO UPLOAD PREVIEW
     --------------------------------------------------------------- */
  function initPhotoUpload() {
    refs.photoInput?.addEventListener('change', function () {
      const file = this.files?.[0];
      if (!file || !file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        if (!refs.avatar) return;
        refs.avatar.style.transition = 'opacity .25s ease';
        refs.avatar.style.opacity = '0';
        setTimeout(() => {
          refs.avatar.src = e.target.result;
          refs.avatar.style.opacity = '1';
        }, 200);
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------------------------------------------------------------
     4. EDIT PROFILE MODAL
     --------------------------------------------------------------- */

  /* -- 4a. Build modal DOM once -- */
  function buildModal() {
    const overlay = document.createElement('div');
    overlay.id = 'editModalOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'editModalTitle');
    overlay.innerHTML = `
      <div class="ep-modal" id="editModal">
        <div class="ep-modal-header">
          <h2 class="ep-modal-title" id="editModalTitle">Edit Profile</h2>
          <button class="ep-close-btn" id="epCloseBtn" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="ep-modal-body">
          <div class="ep-field">
            <label class="ep-label" for="ep-name">Display Name</label>
            <input class="ep-input" id="ep-name" type="text" maxlength="60" autocomplete="name"/>
          </div>
          <div class="ep-field">
            <label class="ep-label" for="ep-bio">Bio</label>
            <textarea class="ep-textarea" id="ep-bio" rows="4" maxlength="320"></textarea>
            <span class="ep-charcount" id="epBioCount">0 / 320</span>
          </div>
          <div class="ep-grid">
            <div class="ep-field">
              <label class="ep-label" for="ep-email">Email</label>
              <input class="ep-input" id="ep-email" type="email" autocomplete="email"/>
            </div>
            <div class="ep-field">
              <label class="ep-label" for="ep-phone">Phone</label>
              <input class="ep-input" id="ep-phone" type="tel" autocomplete="tel"/>
            </div>
            <div class="ep-field">
              <label class="ep-label" for="ep-socials">Website / Socials</label>
              <input class="ep-input" id="ep-socials" type="url" placeholder="https://"/>
            </div>
            <div class="ep-field">
              <label class="ep-label" for="ep-location">Location</label>
              <input class="ep-input" id="ep-location" type="text" autocomplete="address-level2"/>
            </div>
          </div>
        </div>

        <div class="ep-modal-footer">
          <button class="ep-btn ep-btn-cancel" id="epCancelBtn">Cancel</button>
          <button class="ep-btn ep-btn-save"   id="epSaveBtn">Save Changes</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    injectModalStyles();

    refs.modal = overlay;
    refs.overlay = overlay;

    /* events inside modal */
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.getElementById('epCloseBtn').addEventListener('click', closeModal);
    document.getElementById('epCancelBtn').addEventListener('click', closeModal);
    document.getElementById('epSaveBtn').addEventListener('click', saveProfile);

    /* bio char counter */
    const bioEl = document.getElementById('ep-bio');
    bioEl.addEventListener('input', updateBioCount);

    /* close on Escape */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && refs.modal?.classList.contains('ep-open')) closeModal();
    });
  }

  /* -- 4b. Open / close -- */
  function openModal() {
    populateForm();
    refs.modal.classList.add('ep-open');
    document.body.style.overflow = 'hidden';
    // focus first input
    setTimeout(() => document.getElementById('ep-name')?.focus(), 60);
  }

  function closeModal() {
    refs.modal.classList.remove('ep-open');
    document.body.style.overflow = '';
  }

  /* -- 4c. Populate form from state -- */
  function populateForm() {
    document.getElementById('ep-name').value = state.name;
    document.getElementById('ep-bio').value = state.bio;
    document.getElementById('ep-email').value = state.email;
    document.getElementById('ep-phone').value = state.phone;
    document.getElementById('ep-socials').value = state.socials;
    document.getElementById('ep-location').value = state.location;
    updateBioCount();
  }

  /* -- 4d. Validate & save -- */
  function saveProfile() {
    const nameVal = document.getElementById('ep-name').value.trim();
    const emailVal = document.getElementById('ep-email').value.trim();

    // Minimal validation
    if (!nameVal) {
      shakeField('ep-name');
      return;
    }
    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      shakeField('ep-email');
      return;
    }

    // Commit to state
    state.name = nameVal;
    state.bio = document.getElementById('ep-bio').value.trim();
    state.email = emailVal || state.email;
    state.phone = document.getElementById('ep-phone').value.trim() || state.phone;
    state.socials = document.getElementById('ep-socials').value.trim() || state.socials;
    state.location = document.getElementById('ep-location').value.trim() || state.location;

    // Update page
    applyStateToPage();
    showSaveToast();
    closeModal();
  }

  /* -- 4e. Reflect state on page -- */
  function applyStateToPage() {
    if (refs.profileName) refs.profileName.textContent = state.name;
    if (refs.profileBio) refs.profileBio.textContent = state.bio;

    const vals = document.querySelectorAll('.contact-value');
    if (vals[0]) vals[0].textContent = state.email;
    if (vals[1]) vals[1].textContent = state.phone;
    if (vals[2]) vals[2].textContent = state.socials;
    if (vals[3]) vals[3].textContent = state.location;

    // Sync navbar initials / name if the shared navbar exposes a setter
    if (typeof window.EVENTFY_USER !== 'undefined') {
      window.EVENTFY_USER.name = state.name;
      window.EVENTFY_USER.initials = getInitials(state.name);
    }
  }

  /* ---------------------------------------------------------------
     5. HELPERS
     --------------------------------------------------------------- */
  function getInitials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }

  function updateBioCount() {
    const el = document.getElementById('ep-bio');
    const counter = document.getElementById('epBioCount');
    if (!el || !counter) return;
    const len = el.value.length;
    counter.textContent = `${len} / 320`;
    counter.style.color = len > 290 ? 'var(--orange, #f97316)' : 'var(--faint, #9ca3af)';
  }

  function shakeField(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('ep-shake');
    el.style.borderColor = '#ef4444';
    // force reflow
    void el.offsetWidth;
    el.classList.add('ep-shake');
    el.addEventListener('animationend', () => {
      el.classList.remove('ep-shake');
      el.style.borderColor = '';
    }, { once: true });
    el.focus();
  }

  function showSaveToast() {
    let toast = document.getElementById('epSaveToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'epSaveToast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px;flex-shrink:0">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Profile saved!
      `;
      document.body.appendChild(toast);
    }
    toast.classList.remove('ep-toast-show');
    void toast.offsetWidth;
    toast.classList.add('ep-toast-show');
  }

  /* ---------------------------------------------------------------
     6. INJECTED STYLES (scoped to modal)
     --------------------------------------------------------------- */
  function injectModalStyles() {
    if (document.getElementById('ep-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'ep-modal-styles';
    style.textContent = `
      /* ---- Overlay ---- */
      #editModalOverlay {
        position: fixed; inset: 0; z-index: 1000;
        background: rgba(15,10,30,.55);
        backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        padding: 16px;
        opacity: 0; pointer-events: none;
        transition: opacity .22s ease;
      }
      #editModalOverlay.ep-open {
        opacity: 1; pointer-events: auto;
      }

      /* ---- Modal box ---- */
      .ep-modal {
        background: var(--card, #fff);
        border: 1px solid var(--border, #e5e7eb);
        border-radius: 20px;
        box-shadow: 0 24px 64px rgba(0,0,0,.18);
        width: 100%; max-width: 540px;
        max-height: 90vh; overflow-y: auto;
        transform: translateY(18px) scale(.97);
        transition: transform .25s cubic-bezier(.22,.68,0,1.2);
        display: flex; flex-direction: column;
      }
      #editModalOverlay.ep-open .ep-modal {
        transform: translateY(0) scale(1);
      }

      /* ---- Header ---- */
      .ep-modal-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 22px 26px 16px;
        border-bottom: 1px solid var(--border, #e5e7eb);
        position: sticky; top: 0;
        background: var(--card, #fff);
        border-radius: 20px 20px 0 0;
        z-index: 1;
      }
      .ep-modal-title {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 1.15rem; font-weight: 800;
        color: var(--text, #111827);
        margin: 0;
      }
      .ep-close-btn {
        width: 34px; height: 34px;
        border-radius: 50%;
        background: var(--surface, #f3f4f6);
        border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        color: var(--text-2, #374151);
        transition: background .15s, color .15s;
        flex-shrink: 0;
      }
      .ep-close-btn:hover { background: var(--purple-l, #ede9fe); color: var(--purple, #7c3aed); }
      .ep-close-btn svg { width: 16px; height: 16px; }

      /* ---- Body ---- */
      .ep-modal-body { padding: 22px 26px; display: flex; flex-direction: column; gap: 16px; }

      .ep-field { display: flex; flex-direction: column; gap: 5px; }
      .ep-label {
        font-size: 11px; font-weight: 700;
        text-transform: uppercase; letter-spacing: .6px;
        color: var(--faint, #9ca3af);
      }
      .ep-input, .ep-textarea {
        width: 100%; box-sizing: border-box;
        padding: 10px 13px;
        border: 1.5px solid var(--border, #e5e7eb);
        border-radius: 10px;
        background: var(--surface, #f9fafb);
        font-family: 'Manrope', 'Plus Jakarta Sans', sans-serif;
        font-size: 14px; font-weight: 500;
        color: var(--text, #111827);
        transition: border-color .15s, box-shadow .15s;
        outline: none;
        resize: none;
      }
      .ep-input:focus, .ep-textarea:focus {
        border-color: var(--purple, #7c3aed);
        box-shadow: 0 0 0 3px rgba(124,58,237,.12);
        background: #fff;
      }
      .ep-charcount {
        font-size: 11px; color: var(--faint, #9ca3af);
        text-align: right; transition: color .2s;
      }
      .ep-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
      }
      @media (max-width: 480px) { .ep-grid { grid-template-columns: 1fr; } }

      /* ---- Footer ---- */
      .ep-modal-footer {
        display: flex; justify-content: flex-end; gap: 10px;
        padding: 16px 26px 22px;
        border-top: 1px solid var(--border, #e5e7eb);
        position: sticky; bottom: 0;
        background: var(--card, #fff);
        border-radius: 0 0 20px 20px;
      }
      .ep-btn {
        padding: 10px 22px;
        border-radius: 99px;
        font-size: 14px; font-weight: 700;
        cursor: pointer; border: none;
        transition: opacity .15s, transform .15s;
      }
      .ep-btn:hover { opacity: .88; transform: translateY(-1px); }
      .ep-btn-cancel {
        background: var(--surface, #f3f4f6);
        border: 1.5px solid var(--border, #e5e7eb);
        color: var(--text-2, #374151);
      }
      .ep-btn-save {
        background: linear-gradient(135deg, var(--orange, #fb923c) 0%, #f97316 50%, var(--purple, #7c3aed) 120%);
        color: #fff;
        box-shadow: 0 3px 12px rgba(124,58,237,.22);
      }

      /* ---- Shake animation ---- */
      @keyframes ep-shake {
        0%,100% { transform: translateX(0); }
        20%      { transform: translateX(-6px); }
        40%      { transform: translateX(6px); }
        60%      { transform: translateX(-4px); }
        80%      { transform: translateX(4px); }
      }
      .ep-shake { animation: ep-shake .35s ease; }

      /* ---- Save Toast ---- */
      #epSaveToast {
        position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%) translateY(16px);
        background: #111827;
        color: #fff;
        padding: 10px 20px;
        border-radius: 99px;
        font-size: 13.5px; font-weight: 600;
        display: flex; align-items: center; gap: 8px;
        box-shadow: 0 6px 24px rgba(0,0,0,.22);
        opacity: 0; pointer-events: none;
        transition: opacity .2s ease, transform .2s ease;
        z-index: 1100;
        white-space: nowrap;
      }
      #epSaveToast.ep-toast-show {
        opacity: 1; transform: translateX(-50%) translateY(0);
        animation: ep-toast-out .2s ease 2.4s forwards;
      }
      @keyframes ep-toast-out {
        to { opacity: 0; transform: translateX(-50%) translateY(8px); }
      }
    `;
    document.head.appendChild(style);
  }

  /* ---------------------------------------------------------------
     7. INIT
     --------------------------------------------------------------- */
  function init() {
    resolveRefs();
    initPhotoUpload();
    buildModal();

    refs.editBtn?.addEventListener('click', openModal);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
