import os, re, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

BASE = "https://lol.hanyue.io/static/r20260915-miss-fortune-1/"
DEST = r"D:\AI\AIDotNet\weblol\static\r20260915-miss-fortune-1"
ORIG = r"D:\AI\AIDotNet\weblol\_orig"

urls = set()

# --- from index.html ---
html = open(r'D:\AI\AIDotNet\weblol\index.html', encoding='utf-8').read()
for m in re.findall(r'(?:src|href)="(assets/[^"]+)"', html):
    urls.add(m)

# --- from every CSS file (url(...) references) ---
for f in os.listdir(ORIG):
    if not f.endswith('.css'):
        continue
    css = open(os.path.join(ORIG, f), encoding='utf-8').read()
    for m in re.findall(r'url\((?:["\']?)([^)"\']+)(?:["\']?)\)', css):
        m = m.strip()
        if m.startswith('data:'):
            continue
        urls.add(m.lstrip('./') if not m.startswith('/') else m)

# --- from bundle: healthbars / ui / fonts families ---
s = open(os.path.join(ORIG, 'game.decoded.js'), encoding='utf-8').read()
for m in re.findall(r'''["'`](assets/(?:healthbars|fonts|ui|hud|signals|floating-text|vfx|controls)/[A-Za-z0-9_\-./]+?\.[A-Za-z0-9]{2,5})["'`]''', s):
    urls.add(m)

# templated healthbar families
for fam in ['frame-self', 'frame-enemy', 'frame-ally', 'frame-neutral',
            'fill-self', 'fill-enemy', 'fill-ally', 'fill-neutral',
            'fill-mana', 'fill-shield', 'stun', 'root', 'silence']:
    urls.add('assets/healthbars/%s.png' % fam)

urls = sorted(u for u in urls if u.startswith('assets/') and not u.endswith(('.tex', '.dds')))
print('checking', len(urls))

ok, bad = [], []
def fetch(u):
    dest = os.path.join(DEST, u.replace('/', os.sep))
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        ok.append(u); return
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    try:
        req = urllib.request.Request(BASE + u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=60) as r:
            open(dest, 'wb').write(r.read())
        ok.append(u)
    except Exception as e:
        bad.append((u, str(e)[:70]))

with ThreadPoolExecutor(max_workers=16) as ex:
    list(ex.map(fetch, urls))

print('ok', len(ok), 'bad', len(bad))
for u, e in bad:
    print('  MISS', u, e)
