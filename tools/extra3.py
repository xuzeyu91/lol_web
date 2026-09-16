import os, re, json, urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE = "https://lol.hanyue.io/static/r20260915-miss-fortune-1/"
DEST = r"D:\AI\AIDotNet\weblol\static\r20260915-miss-fortune-1"
ORIG = r"D:\AI\AIDotNet\weblol\_orig"

s = open(os.path.join(ORIG, 'game.decoded.js'), encoding='utf-8').read()

urls = set()

m = json.load(open(os.path.join(ORIG, 'map12-fast.gltf.json')))
for b in m.get('buffers', []):
    urls.add('assets/map/' + b['uri'])
for i in m.get('images', []):
    urls.add('assets/map/' + i['uri'])
urls.add('assets/map/map12-fast.gltf')
urls.add('assets/map/navigation.bin')
urls.add('assets/map/grass-material.json')

controls = set()
for m in re.findall(r'''["'`](assets/controls/[^"'`\n]+)["'`]''', s):
    controls.add(m)
ov = json.load(open(os.path.join(ORIG, 'm_overrides.json'), encoding='utf-8'))
for k, v in ov.items():
    controls.add(v)
for c in sorted(controls):
    urls.add(c)

for m in re.findall(r'''["'`](assets/models/[^"'`\n]+\.glb\.gz)["'`]''', s):
    urls.add(m)
for m in re.findall(r'''["'`](assets/models/[^"'`\n]+\.glb)["'`]''', s):
    urls.add(m)

for n in range(8):
    urls.add('assets/ui/Ashe-%d.png' % n)

urls = sorted(urls)
print('checking', len(urls))
ok, bad = [], []
def fetch(u):
    dest = os.path.join(DEST, u.replace('/', os.sep))
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        ok.append(u); return
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    try:
        req = urllib.request.Request(BASE + u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=120) as r:
            open(dest, 'wb').write(r.read())
        ok.append(u)
    except Exception as e:
        bad.append((u, str(e)[:60]))

with ThreadPoolExecutor(max_workers=16) as ex:
    list(ex.map(fetch, urls))

print('ok', len(ok), 'bad', len(bad))
for u, e in bad:
    print('  MISS', u, e)