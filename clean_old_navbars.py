"""
clean_old_navbars.py
Removes old/orphaned navbar blocks that were stacking under the injected canonical navbar.
Strategy: Keep everything UP TO and INCLUDING '<!-- END NAVBAR -->'
          then skip to the next '<main>' or '<!-- PAGE CONTENT' or similar content marker.
"""
import os, re

PAGES = [
    'frontend/Events/index.html',
    'frontend/About/Index.html',
    'frontend/saved-events/saved-events.html',
    'frontend/setting/index.html',
    'frontend/org-profile/index.html',
    'frontend/org-dashboard/index.html',
    'frontend/map/browse.html',
    'frontend/event Description/event-detail.html',
    'frontend/new Event/index.html',
    'frontend/Home/index.html',
    'frontend/dashboard/index.html',
]

CONTENT_MARKERS = [
    '<main',
    '<!-- PAGE CONTENT',
    '<!-- CONTENT',
    '<!-- Main Content',
    '<!-- Hero',
    '<section',
    '<div class="container"',
    '<div class="page-',
    '<div class="hero',
    '<div id="main',
]

def clean_page(path):
    if not os.path.exists(path):
        print(f'  SKIP (missing): {path}')
        return

    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()

    # Find END NAVBAR comment
    end_navbar_idx = None
    for i, line in enumerate(lines):
        if '<!-- END NAVBAR -->' in line:
            end_navbar_idx = i
            break

    if end_navbar_idx is None:
        print(f'  SKIP (no END NAVBAR marker): {path}')
        return

    # Now look for the NEXT content block after END NAVBAR
    content_start = None
    for i in range(end_navbar_idx + 1, len(lines)):
        line_stripped = lines[i].strip()
        for marker in CONTENT_MARKERS:
            if line_stripped.startswith(marker) or marker in line_stripped[:60]:
                content_start = i
                break
        if content_start is not None:
            break

    if content_start is None:
        print(f'  SKIP (no content marker found after navbar): {path}')
        return

    orphaned = content_start - end_navbar_idx - 1
    if orphaned <= 2:
        print(f'  OK   (nothing to clean): {path}')
        return

    # Reconstruct: keep header section + gap + content from content_start onwards
    new_lines = lines[:end_navbar_idx + 1] + ['\n'] + lines[content_start:]

    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    print(f'  CLEANED {orphaned} orphaned lines: {path}')

print('=== Cleaning orphaned old navbars ===')
for p in PAGES:
    clean_page(p)
print('\nDone.')
