import re

with open('d:/Eventfy-Pro/frontend/Home/index.html', 'r', encoding='utf-8') as f:
    home_html = f.read()

navbar_re = re.compile(r'<!-- ═══════════════════════════════════════\n\s*EVENTFY UNIFIED NAVBAR\n\s*═══════════════════════════════════════ -->.*?<!-- END NAVBAR -->', re.DOTALL)
m = navbar_re.search(home_html)
if m:
    navbar_content = m.group(0)
    with open('d:/Eventfy-Pro/frontend/map/browse.html', 'r', encoding='utf-8') as f:
        map_html = f.read()

    # We need to make Browse active, and Home inactive
    navbar_content = navbar_content.replace('nav-link active', 'nav-link')
    navbar_content = navbar_content.replace('drawer-link active', 'drawer-link')

    # Then use re.sub to add 'active' to the Browse links
    navbar_content = re.sub(r'(<a href="\.\./Events/index\.html" class="nav-link)(")', r'\1 active\2', navbar_content)
    navbar_content = re.sub(r'(<a href="\.\./Events/index\.html" class="drawer-link)(")', r'\1 active\2', navbar_content)

    map_re = re.compile(r'<!-- ═══════════════════════════════════════\n\s*EVENTFY UNIFIED NAVBAR\n\s*═══════════════════════════════════════ -->.*?<!-- END NAVBAR -->', re.DOTALL)
    new_map_html = map_re.sub(navbar_content, map_html)

    with open('d:/Eventfy-Pro/frontend/map/browse.html', 'w', encoding='utf-8') as f:
        f.write(new_map_html)
    print('Replaced map/browse.html navbar successfully.')
else:
    print('Navbar not found in Home/index.html')
