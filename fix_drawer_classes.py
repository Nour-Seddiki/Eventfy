import os, glob

front = r'd:\Eventfy-Pro\frontend'
files = glob.glob(os.path.join(front, '**', '*.html'), recursive=True)

old = '../org-dashboard/index.html" class="drawer-link drawer-logged-in"'
new = '../org-dashboard/index.html" class="drawer-link drawer-logged-in drawer-link-org-dashboard"'

updated = []
for fp in files:
    try:
        with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        if old in content:
            with open(fp, 'w', encoding='utf-8') as f:
                f.write(content.replace(old, new))
            updated.append(os.path.basename(fp))
    except Exception as e:
        print(f"Error {fp}: {e}")

if updated:
    print("Updated these files:")
    for u in updated:
        print(" ", u)
else:
    print("No files needed updating (pattern not found).")
