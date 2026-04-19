#!/usr/bin/env python3
"""
update_navbars.py
Injects the canonical Eventfy navbar into all frontend HTML pages.
Run from the project root:  python update_navbars.py
"""

import os, re, pathlib

ROOT = pathlib.Path(__file__).parent / "frontend"

# ── Canonical navbar HTML (uses {HOME} {BROWSE} {ABOUT} {HOWITWORKS} placeholders
#    for active class, and {LOGO_HREF} {COMMON_CSS} {NAVBAR_JS} {API_JS} for paths)
NAVBAR_TEMPLATE = """  <!-- ═══════════════════════════════════════
       EVENTFY UNIFIED NAVBAR
  ═══════════════════════════════════════ -->
  <header class="site-header" id="siteHeader">
    <div class="header-inner">

      <!-- Logo -->
      <a href="{rel}Home/index.html" class="logo" aria-label="Eventfy home">
        <div class="logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="4" fill="#7f0df2" opacity="0.15"/>
            <path d="M8 2v4M16 2v4M3 10h18" stroke="#7f0df2" stroke-width="2" stroke-linecap="round"/>
            <circle cx="8" cy="15" r="1.5" fill="#7f0df2"/>
            <circle cx="12" cy="15" r="1.5" fill="#7f0df2"/>
            <circle cx="16" cy="15" r="1.5" fill="#7f0df2"/>
          </svg>
        </div>
        <span class="logo-text">Eventfy</span>
      </a>

      <!-- Desktop Nav -->
      <nav class="header-nav" aria-label="Main navigation">
        <a href="{rel}Home/index.html" class="nav-link{home_active}">
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
          Home
        </a>
        <a href="{rel}Events/index.html" class="nav-link{browse_active}">
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
          Browse
        </a>
        <a href="{rel}About/Index.html" class="nav-link{about_active}">
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M12 16v-4M12 8h.01" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
          About
        </a>
        <a href="{rel}Home/index.html#how-it-works" class="nav-link">
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
          How it Works
        </a>

        <!-- LOGGED-OUT: Login + Register -->
        <div class="nav-actions nav-logged-out" style="display:none">
          <button class="btn-login btn-do-login">Login</button>
          <button class="btn-register btn-do-register">Register</button>
        </div>

        <!-- LOGGED-IN: Notif + Avatar + Logout -->
        <div class="nav-loggedin nav-logged-in" style="display:none">
          <div class="notif-popup-wrap">
            <button class="nav-notif-btn" id="desktopNotifBtn" aria-label="Notifications">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-4.997M13.73 21a2 2 0 01-3.46 0M6 11a6 6 0 016-6" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
              <span class="notif-dot"></span>
            </button>
            <div class="notif-popup" id="notifPopupDesktop"></div>
          </div>
          <div class="user-popup-wrap">
            <button class="nav-user-avatar-btn" id="desktopAvatarBtn" aria-label="My profile">
              <span class="user-initials-text">U</span>
            </button>
            <div class="user-popup" id="userPopup"></div>
          </div>
          <button class="btn-nav-logout btn-do-logout">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
            Log out
          </button>
        </div>
      </nav>

      <!-- Mobile: Notif + Avatar (logged in) -->
      <div class="mob-header-loggedin nav-logged-in" style="display:none">
        <div class="notif-popup-wrap">
          <button class="nav-notif-btn" id="mobNotifBtn" aria-label="Notifications">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-4.997M13.73 21a2 2 0 01-3.46 0M6 11a6 6 0 016-6" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
            <span class="notif-dot"></span>
          </button>
          <div class="notif-popup" id="notifPopupMob"></div>
        </div>
        <div class="user-popup-wrap">
          <button class="nav-user-avatar-btn" id="mobAvatarBtn" aria-label="My profile">
            <span class="user-initials-text">U</span>
          </button>
          <div class="user-popup" id="userPopupMob"></div>
        </div>
      </div>

      <!-- Hamburger -->
      <button class="hamburger-btn" id="hamburgerBtn" aria-label="Open menu" aria-expanded="false">
        <span class="ham-line"></span>
        <span class="ham-line"></span>
        <span class="ham-line"></span>
      </button>
    </div>
  </header>

  <!-- Drawer Overlay -->
  <div class="drawer-overlay" id="drawerOverlay"></div>

  <!-- Mobile Drawer -->
  <div class="nav-drawer" id="navDrawer" aria-hidden="true">
    <div class="drawer-inner">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <a href="{rel}Home/index.html" class="logo">
          <div class="logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="4" fill="#7f0df2" opacity="0.15"/>
              <path d="M8 2v4M16 2v4M3 10h18" stroke="#7f0df2" stroke-width="2" stroke-linecap="round"/>
              <circle cx="8" cy="15" r="1.5" fill="#7f0df2"/><circle cx="12" cy="15" r="1.5" fill="#7f0df2"/><circle cx="16" cy="15" r="1.5" fill="#7f0df2"/>
            </svg>
          </div>
          <span class="logo-text">Eventfy</span>
        </a>
        <button class="drawer-close-btn" id="drawerCloseBtn" aria-label="Close menu">✕</button>
      </div>

      <!-- User card (logged in only) -->
      <div class="drawer-user-card drawer-logged-in" style="display:none">
        <div class="drawer-user-avatar"><span class="user-initials-text">U</span></div>
        <div>
          <div class="drawer-user-name user-name-text">User</div>
          <div class="drawer-user-role user-role-text">Member</div>
        </div>
      </div>

      <nav class="drawer-nav">
        <a href="{rel}Home/index.html" class="drawer-link{home_active}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
          Home
        </a>
        <a href="{rel}Events/index.html" class="drawer-link{browse_active}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
          Browse
        </a>
        <a href="{rel}About/Index.html" class="drawer-link{about_active}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M12 16v-4M12 8h.01" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
          About
        </a>
        <a href="{rel}Home/index.html#how-it-works" class="drawer-link">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
          How it Works
        </a>
        <!-- Logged-in links -->
        <a href="{rel}org-profile/index.html" class="drawer-link drawer-logged-in" style="display:none">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Profile Settings
        </a>
        <a href="{rel}dashboard/index.html" class="drawer-link drawer-logged-in" style="display:none">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          My Dashboard
        </a>
        <a href="{rel}saved-events/saved-events.html" class="drawer-link drawer-logged-in" style="display:none">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          Saved Events
        </a>
      </nav>

      <div class="drawer-bottom-menu">
        <!-- Logged-out buttons -->
        <div class="drawer-logged-out" style="display:none;flex-direction:column;gap:8px">
          <button class="btn-register btn-do-register" style="width:100%;height:44px;border-radius:12px;font-size:14px">Register</button>
          <button class="btn-login btn-do-login" style="width:100%;height:44px;border-radius:12px;font-size:14px;background:#f5f0ff;border:2px solid #7f0df2;color:#7f0df2">Login</button>
        </div>
        <!-- Logged-in logout -->
        <button class="btn-drawer-logout btn-do-logout drawer-logged-in" style="display:none">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Log out
        </button>
      </div>
    </div>
  </div>
  <!-- END NAVBAR -->"""

# CSS link block for <head>
HEAD_LINKS = """  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{common_css}">"""

# Scripts block
SCRIPTS_BLOCK = """  <script src="{api_js}"></script>
  <script src="{navbar_js}"></script>"""

# Pages and their config
PAGES = {
    # (folder, filename, active_page)
    # active_page: 'home', 'browse', 'about', or None
    "Home/index.html":            "home",
    "Events/index.html":          "browse",
    "About/Index.html":           "about",
    "dashboard/index.html":       None,
    "saved-events/saved-events.html": None,
    "setting/index.html":         None,
    "new Event/index.html":       None,
    "org-profile/index.html":     None,
    "org-dashboard/index.html":   None,
    "map/browse.html":            "browse",
    "event Description/event-detail.html": "browse",
}

def get_rel(filepath):
    """Get relative prefix from file to frontend/ root, e.g. '../' or '../../'"""
    parts = pathlib.Path(filepath).parts
    # Count directory levels below ROOT
    depth = len(parts) - 1   # -1 for the filename itself
    return "../" * depth if depth > 0 else "./"

def make_navbar(rel, active):
    home   = " active" if active == "home"   else ""
    browse = " active" if active == "browse" else ""
    about  = " active" if active == "about"  else ""
    return NAVBAR_TEMPLATE.format(
        rel=rel, home_active=home, browse_active=browse, about_active=about
    )

def process_file(rel_path, active):
    filepath = ROOT / rel_path
    if not filepath.exists():
        print(f"  SKIP (not found): {rel_path}")
        return

    content = filepath.read_text(encoding="utf-8", errors="replace")
    
    # Compute relative prefix
    depth = len(pathlib.Path(rel_path).parts) - 1
    rel = "../" * depth if depth > 0 else "./"

    # -- 1. Fix <head> CSS links
    common_css = f"{rel}common.css"
    api_js     = f"{rel}api.js"
    navbar_js  = f"{rel}navbar.js"

    # Remove old common.css / navbar.css link if present
    content = re.sub(r'<link[^>]+common\.css[^>]*>\s*', '', content)
    content = re.sub(r'<link[^>]+navbar\.css[^>]*>\s*', '', content)
    # Remove old Google Font links if present
    content = re.sub(r'<link[^>]+fonts\.googleapis[^>]*>\s*', '', content)
    content = re.sub(r'<link[^>]+fonts\.gstatic[^>]*>\s*', '', content)

    # Ensure head ends with our links (before </head>)
    head_block = HEAD_LINKS.format(common_css=common_css)
    if common_css not in content:
        content = content.replace("</head>", f"{head_block}\n</head>")

    # -- 2. Replace entire existing navbar block
    # Pattern: from <header class="site-header" to <!-- END NAVBAR -->
    # Also handle drawer overlay and drawer div as part of bloc
    nav_block = make_navbar(rel, active)

    # Try to replace between start marker and END NAVBAR
    replaced = False
    pattern = r'<!-- [═=]+\s+(?:UNIFIED|EVENTFY)\s+NAVBAR.*?-->.*?<!-- END NAVBAR -->'
    m = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
    if m:
        content = content[:m.start()] + nav_block + content[m.end():]
        replaced = True

    # Fallback: replace from <header class="site-header" to <!-- END NAVBAR -->
    if not replaced:
        pattern2 = r'<header class="site-header".*?<!-- END NAVBAR -->'
        m2 = re.search(pattern2, content, re.DOTALL)
        if m2:
            content = content[:m2.start()] + nav_block + content[m2.end():]
            replaced = True

    if not replaced:
        # Insert navbar right after <body>
        content = content.replace('<body>', f'<body>\n{nav_block}', 1)
        print(f"  INSERTED (no existing navbar): {rel_path}")

    # -- 3. Fix script paths
    # Remove old api.js/navbar.js script tags
    content = re.sub(r'<script[^>]+api\.js[^>]*>\s*</script>\s*', '', content)
    content = re.sub(r'<script[^>]+navbar\.js[^>]*>\s*</script>\s*', '', content)
    # Add before first inline script or </body>
    scripts = SCRIPTS_BLOCK.format(api_js=api_js, navbar_js=navbar_js)
    if '</body>' in content:
        content = content.replace('</body>', f'{scripts}\n</body>', 1)
    
    filepath.write_text(content, encoding="utf-8")
    print(f"  OK: {rel_path}")

print("Updating navbars...")
for rel_path, active in PAGES.items():
    process_file(rel_path, active)

# Also sync frontend/common.css and frontend/navbar.js from root
import shutil
root = pathlib.Path(__file__).parent
shutil.copy(root / "common.css",  root / "frontend" / "common.css")
shutil.copy(root / "navbar.js",   root / "frontend" / "navbar.js")
print("\nSynced common.css + navbar.js → frontend/")
print("Done!")
