import os

pages = [
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
]

for p in pages:
    if not os.path.exists(p):
        print(f'MISSING: {p}')
        continue
    with open(p, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    count = content.count('site-header')
    headers = content.count('<header')
    if count > 2 or headers > 1:
        print(f'[DUPE] {p} — site-header x{count}, <header> x{headers}')
    else:
        print(f'[OK]   {p}')
