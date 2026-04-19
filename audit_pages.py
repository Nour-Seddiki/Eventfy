import os

pages = {
    'notifications': 'frontend/notifications/index.html',
    'org-profile': 'frontend/org-profile/index.html',
    'saved-events (main)': 'frontend/saved-events/saved-events.html',
    'saved-events (index)': 'frontend/saved-events/index.html',
    'setting': 'frontend/setting/index.html',
    'org-dashboard': 'frontend/org-dashboard/index.html',
    'event-detail': 'frontend/event Description/event-detail.html',
    'event-detail (index)': 'frontend/event Description/index.html',
    'map': 'frontend/map/browse.html',
    'new-event': 'frontend/new Event/index.html',
}

print(f"{'PAGE':<28} {'EXISTS':<8} {'api.js':<9} {'navbar':<9} {'AUTH':<8} {'ORDER'}")
print('-'*75)
for name, path in pages.items():
    exists = os.path.exists(path)
    if exists:
        with open(path,'r',encoding='utf-8',errors='ignore') as f:
            c = f.read()
        has_api = '../api.js' in c
        has_nav = '../navbar.js' in c
        has_auth = 'isLoggedIn' in c
        api_pos = c.find('../api.js')
        nav_pos = c.find('../navbar.js')
        page_js_pos = min([c.find(x) for x in ['<script src="script', '<script src="my-', '<script src="saved', '<script src="browse'] if c.find(x) > 0], default=api_pos)
        order_ok = (api_pos < page_js_pos or page_js_pos == api_pos) if has_api else True
        print(f'{name:<28} {"YES":<8} {str(has_api):<9} {str(has_nav):<9} {str(has_auth):<8} {str(order_ok)}')
    else:
        print(f'{name:<28} {"MISSING":<8}')
