import os, re, json, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

BASE = "https://lol.hanyue.io/static/r20260915-miss-fortune-1/"
DEST = r"D:\AI\AIDotNet\weblol\static\r20260915-miss-fortune-1"

s = open('game.decoded.js', encoding='utf-8').read()

urls = set()
# minimap icons used by the renderer
for a in ['tower', 'nexus', 'inhibitor', 'healthpack']:
    urls.add('assets/ui/minimap-%s.png' % a)
# hero portrait icons (minimap / scoreboard)
roster = re.findall(r'id:"([A-Z][A-Za-z]+)"', s)
for h in ['Ashe','Lux','Ahri','Ezreal','Garen','Jinx','Yasuo','Sett','Darius','Ryze',
          'DrMundo','Malphite','MissFortune','Leona','Morgana','Veigar',
          'ElderDragon','RiftHerald','BaronNashor']:
    urls.add('assets/%s.png' % h)
# misc referenced literals we may have missed
for m in re.findall(r'''["'`](assets/(?:ui|hud|signals|vfx|controls|audio|models)/[A-Za-z0-9_\-./]+?\.[A-Za-z0-9]{2,5})["'`]''', s):
    urls.add(m)

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
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        open(dest, 'wb').write(data)
        ok.append(u)
    except Exception as e:
        bad.append((u, str(e)[:60]))

with ThreadPoolExecutor(max_workers=16) as ex:
    list(ex.map(fetch, urls))

print('ok', len(ok), 'bad', len(bad))
for u, e in bad[:40]:
    print('  MISS', u, e)
