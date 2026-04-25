import os, re

count = 0
def add_aria_hidden(content):
    def replacer(match):
        attrs = match.group(1)
        if 'aria-hidden' not in attrs:
            return f'<svg aria-hidden="true"{attrs}>'
        return match.group(0)
    return re.sub(r'<svg([^>]*)>', replacer, content)

for r, d, files in os.walk('.'):
    if 'node_modules' in r or '.git' in r: continue
    for f in files:
        if f.endswith(('.html', '.js')):
            path = os.path.join(r, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
            new_content = add_aria_hidden(content)
            if content != new_content:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                count += 1
print(f'Modified {count} files.')
