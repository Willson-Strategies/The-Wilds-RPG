"""Bundle the game into one page for the Claude artifact.

Usage:  python3 tools/build.py

Reads index.html, then writes dist/index.html with:
  - the stylesheet and every script inlined, in the order index.html loads them
  - every picture under art/ embedded as a data URI (so the artifact needs no image files)
  - the audio/ folder copied beside it as dist/audio/, published alongside the page

The artifact host wraps the page in its own <html>/<head>/<body>, so the output starts at <title>.
The GitHub Pages version needs none of this: it serves index.html and the folders as they are.
"""
import base64, mimetypes, os, re, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
mimetypes.add_type('image/webp', '.webp')

def read(rel): return open(os.path.join(ROOT, rel), encoding='utf-8').read()

def embed_art(js):
    def uri(m):
        rel = m.group(1); path = os.path.join(ROOT, rel)
        mime = mimetypes.guess_type(path)[0]
        return '"data:%s;base64,%s"' % (mime, base64.b64encode(open(path, 'rb').read()).decode())
    return re.sub(r'"(art/[^"]+\.(?:png|jpg|jpeg|webp|gif))"', uri, js)

def main():
    page = read('index.html')
    head = re.search(r'<head>(.*?)</head>', page, re.S).group(1)
    head = re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*', '', head)   # the host adds these
    css_links = re.findall(r'<link rel="stylesheet" href="(css/[^"]+)">', head)
    head = re.sub(r'\s*<link rel="stylesheet" href="css/[^"]+">', '', head).strip()
    body = re.search(r'<body>(.*?)</body>', page, re.S).group(1)
    scripts = re.findall(r'<script src="([^"]+)"></script>', body)
    markup = re.sub(r'\s*<!--.*?-->|\s*<script src="[^"]+"></script>', '', body, flags=re.S).strip()

    css = '\n'.join(read(c) for c in css_links)
    js = '\n'.join(f'/* ===== {s} ===== */\n' + (embed_art(read(s)) if s.startswith('data/art') else read(s)) for s in scripts)
    out = f'{head}\n<style>\n{css}</style>\n\n{markup}\n\n<script>\n{js}</script>\n'

    os.makedirs(DIST, exist_ok=True)
    with open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8') as f: f.write(out)
    # A full page for testing the bundle locally (tests/check.py dist): the same skeleton the artifact host adds.
    with open(os.path.join(DIST, 'preview.html'), 'w', encoding='utf-8') as f:
        f.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
                '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}'
                '[hidden]{display:none!important}</style></head><body>\n' + out + '</body></html>\n')
    shutil.copytree(os.path.join(ROOT, 'audio'), os.path.join(DIST, 'audio'), dirs_exist_ok=True)
    build = re.search(r'const BUILD = (\d+)', read('js/version.js')).group(1)
    print(f'Built dist/index.html (Build {build}): {len(out) // 1024} KB, {len(scripts)} scripts, audio copied.')

if __name__ == '__main__':
    main()
