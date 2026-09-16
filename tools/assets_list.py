import re, json, os, collections

s = open('game.decoded.js', encoding='utf-8').read()
urls = set()

# 1. literal asset paths in bundle
for m in re.findall(r'''["'`](assets/[A-Za-z0-9_\-./]+?\.[A-Za-z0-9]{2,5})["'`]''', s):
    urls.add(m)

# 2. from audio manifest
aud = json.load(open('m_manifest.json', encoding='utf-8'))
def collect(o):
    if isinstance(o, str):
        if o.startswith('assets/') or o.startswith('http'):
            urls.add(o)
    elif isinstance(o, dict):
        for v in o.values(): collect(v)
    elif isinstance(o, list):
        for v in o: collect(v)
collect(aud)

# 3. vfx manifest
vfx = json.load(open('m_manifest.json', encoding='utf-8'))  # audio
vfxm = json.load(open('m_manifest.json', encoding='utf-8'))
try:
    v = json.load(open('m_manifest.json', encoding='utf-8'))
except Exception as e:
    v = None

# 4. hero-derived
heroes = ['Ashe','Lux','Ahri','Ezreal','Garen','Jinx','Yasuo','Sett','Darius','Ryze',
          'DrMundo','Malphite','MissFortune','Leona','Morgana','Veigar',
          'ElderDragon','RiftHerald','BaronNashor']
for h in heroes:
    urls.add('assets/%s-loading.jpg' % h)
    urls.add('assets/%s.png' % h)
    urls.add('assets/models/%s.glb.gz' % h)
    urls.add('assets/models/%s.glb' % h)
    urls.add('assets/ui/minimap-%s.png' % h)

models = json.load(open('m_scales.json', encoding='utf-8'))
for h in models:
    urls.add('assets/models/%s.glb.gz' % h)
    urls.add('assets/%s-loading.jpg' % h)
    urls.add('assets/%s.png' % h)

urls = sorted(u for u in urls if u.startswith('assets/'))
print('TOTAL asset urls:', len(urls))
by_ext = collections.Counter(os.path.splitext(u)[1] for u in urls)
print(by_ext)
open('assets.txt', 'w', encoding='utf-8').write('\n'.join(urls))
for u in urls[:40]: print('  ', u)
print('  ...')
