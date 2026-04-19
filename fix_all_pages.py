"""
fix_all_pages.py
- Adds auth guard (isLoggedIn check) to all protected pages
- Fixes script load order (api.js must be FIRST)
- Creates missing saved-events/index.html redirect
"""
import os, re

AUTH_GUARD = '''<script src="../api.js"></script>
  <script>
    // Auth guard — redirect if not logged in
    if (!isLoggedIn()) {
      window.location.href = '../login/index.html';
    }
  </script>'''

def fix_scripts(path, page_script, needs_auth=True):
    """Replace old script block with correct order + auth guard."""
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Already has auth guard?
    if 'Auth guard' in content:
        print(f'  SKIP (already fixed): {path}')
        return

    # Build the script block to find and replace
    # Pattern: page_script tag, then api.js tag, then navbar.js tag
    if page_script:
        old_pattern = rf'(<script src="{re.escape(page_script)}"></script>\s*<script src="../api\.js"></script>\s*<script src="../navbar\.js"></script>)'
        replacement = f'<script src="../api.js"></script>\n  <script>\n    // Auth guard — redirect if not logged in\n    if (!isLoggedIn()) {{\n      window.location.href = \'../login/index.html\';\n    }}\n  </script>\n  <script src="{page_script}"></script>\n  <script src="../navbar.js"></script>'
    else:
        # Just add auth guard before navbar.js
        old_pattern = r'(<script src="../api\.js"></script>\s*<script src="../navbar\.js"></script>)'
        replacement = f'<script src="../api.js"></script>\n  <script>\n    // Auth guard — redirect if not logged in\n    if (!isLoggedIn()) {{\n      window.location.href = \'../login/index.html\';\n    }}\n  </script>\n  <script src="../navbar.js"></script>'

    new_content, count = re.subn(old_pattern, replacement, content, flags=re.DOTALL)
    if count:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'  FIXED: {path}')
    else:
        print(f'  WARN (pattern not matched): {path}')
        # Try simple insertion before navbar.js
        if '<script src="../navbar.js"></script>' in content:
            new_content = content.replace(
                '<script src="../navbar.js"></script>',
                f'<script>\n    // Auth guard — redirect if not logged in\n    if (!isLoggedIn()) {{\n      window.location.href = \'../login/index.html\';\n    }}\n  </script>\n  <script src="../navbar.js"></script>'
            )
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'  FIXED (fallback): {path}')

print('=== Fixing auth guards and script orders ===')

# Pages where page-script loads BEFORE api.js (order issue + need auth guard)
fix_scripts('frontend/org-profile/index.html', 'organizer-profile.js')
fix_scripts('frontend/org-dashboard/index.html', 'organizer-dashboard.js')
fix_scripts('frontend/event Description/event-detail.html', 'event-detail.js', needs_auth=False)  # public page
fix_scripts('frontend/new Event/index.html', 'app.js')

# Map has leaflet + auth.js + browse.js before api.js — complex, use fallback
fix_scripts('frontend/map/browse.html', None, needs_auth=False)

print('\n=== Creating saved-events/index.html redirect ===')

SAVED_REDIRECT = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta http-equiv="refresh" content="0; url=saved-events.html"/>
  <title>Saved Events | Eventfy</title>
</head>
<body>
  <script>window.location.replace('saved-events.html');</script>
</body>
</html>'''

with open('frontend/saved-events/index.html', 'w', encoding='utf-8') as f:
    f.write(SAVED_REDIRECT)
print('  CREATED: frontend/saved-events/index.html')

print('\nDone.')
