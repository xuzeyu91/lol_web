"""Mirror all lol.hanyue.io static assets to a local folder."""
import json, os, re, sys, threading, time
import urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

BASE = "https://lol.hanyue.io/static/r20260915-miss-fortune-1/"
DEST = r"D:\AI\AIDotNet\weblol\static\r20260915-miss-fortune-1"

s = open('game.decoded.js', encoding='utf-8').read()
urls = set()

# literal asset paths from bundle
for m in re.findall(r'''["'`](assets/[A-Za-z0-9_\-./]+?\.[A-Za-z0-9]{2,5})["'`]''', s):
    urls.add(m)

def collect(o):
    if isinstance(o, str):
        if o.startswith('assets/'):
            urls.add(o)
    elif isinstance(o, dict):
        for v in o.values(): collect(v)
    elif isinstance(o, list):
        for v in o: collect(v)

collect(json.load(open('audio_manifest.json', encoding='utf-8')))
collect(json.load(open('vfx_manifest.json', encoding='utf-8')))

heroes = ['Ashe','Lux','Ahri','Ezreal','Garen','Jinx','Yasuo','Sett','Darius','Ryze',
          'DrMundo','Malphite','MissFortune','Leona','Morgana','Veigar',
          'ElderDragon','RiftHerald','BaronNashor','BlueCaster','BlueMelee','BlueSiege',
          'RedCaster','RedMelee','RedSiege','Tower','Inhibitor','Nexus','BridgeStatue',
          'Chain','Hermit','LargePoro','Poro','Relic','SmallPoro']
for h in heroes:
    urls.add('assets/%s-loading.jpg' % h)
    urls.add('assets/%s.png' % h)
    urls.add('assets/models/%s.glb.gz' % h)
    urls.add('assets/ui/minimap-%s.png' % h)

for h in json.load(open('m_scales.json', encoding='utf-8')):
    urls.add('assets/models/%s.glb.gz' % h)
    urls.add('assets/%s-loading.jpg' % h)
    urls.add('assets/%s.png' % h)

# drop game-internal texture paths that are not served over HTTP
urls = sorted(u for u in urls if not u.endswith(('.tex', '.dds')))
print('files to fetch:', len(urls), flush=True)

os.makedirs(DEST, exist_ok=True)
lock = threading.Lock()
done = [0]
missing = []
total_bytes = [0]
start = time.time()

def fetch(u):
    dest = os.path.join(DEST, u.replace('/', os.sep))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        with lock:
            done[0] += 1
        return
    url = BASE + u
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            with open(dest, 'wb') as f:
                f.write(data)
            with lock:
                done[0] += 1
                total_bytes[0] += len(data)
            return
        except urllib.error.HTTPError as e:
            if e.code == 404:
                with lock:
                    done[0] += 1
                    missing.append(u)
                return
            time.sleep(1 + attempt)
        except Exception:
            time.sleep(1 + attempt)
    with lock:
        done[0] += 1
        missing.append(u)

with ThreadPoolExecutor(max_workers=24) as ex:
    futs = [ex.submit(fetch, u) for u in urls]
    for i, f in enumerate(futs):
        f.result()
        if i % 200 == 0:
            print('  %d/%d  %.1fMB' % (done[0], len(urls), total_bytes[0]/1e6), flush=True)

print('DONE in %.0fs' % (time.time() - start))
print('downloaded: %.1f MB, %d files' % (total_bytes[0]/1e6, len(urls) - len(missing)))
print('missing(404):', len(missing))
open('missing.txt', 'w', encoding='utf-8').write('\n'.join(missing))
for m in missing[:40]:
    print('  404', m)
