"""Mirror all lol.hanyue.io static assets to a local folder.

Usage:
    python mirror.py
    # (re)generate the decoded bundle if you don't have game.decoded.js:
    curl -sL https://lol.hanyue.io/static/bootstrap/game-r20260915-close-guard-1.js -o game.js
    python decode.py   # creates game.decoded.js with \\uXXXX → Chinese
"""
import json, os, re, sys, threading, time
import urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

TOOLS = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(TOOLS, '..'))
BASE = "https://lol.hanyue.io/static/r20260915-miss-fortune-1/"
DEST = os.path.join(ROOT, 'static', 'r20260915-miss-fortune-1')


def _t(name):
    """Intermediate artifact — always kept inside tools/ (git-ignored)."""
    return os.path.join(TOOLS, name)

BUNDLE_URL = ('https://lol.hanyue.io/static/bootstrap/'
              'game-r20260915-close-guard-1.js')


def _download(url, dest, label):
    print('  downloading %s ...' % label, flush=True)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=180) as r:
        data = r.read()
    open(dest, 'wb').write(data)
    print('  %s -> %s (%d bytes)' % (label, dest, len(data)), flush=True)
    return data


# A fresh git clone has neither the bundle nor the decoded dump (both are
# generated artifacts), so pull them before scanning for asset paths.
BUNDLE = _t('game.js')
if not os.path.exists(BUNDLE):
    _download(BUNDLE_URL, BUNDLE, 'game bundle')

DECODED = _t('game.decoded.js')
if not os.path.exists(DECODED):
    raw = open(BUNDLE, encoding='utf-8', errors='replace').read()
    open(DECODED, 'w', encoding='utf-8').write(
        re.sub(r'\\u([0-9a-fA-F]{4})', lambda m: chr(int(m.group(1), 16)), raw))
    print('  regenerated game.decoded.js', flush=True)

# manifests are also generated artifacts
for name, label in (
    ('audio_manifest.json', 'assets/audio/manifest.json'),
    ('vfx_manifest.json',   'assets/vfx/manifest.json'),
    ('m_scales.json',       'assets/models/scales.json'),
):
    dest = _t(name)
    if not os.path.exists(dest):
        _download(BASE + label, dest, name)

s = open(DECODED, encoding='utf-8').read()
urls = set()       # known-good references — a 404 here is a real problem
optional = set()   # guessed paths (template strings) — 404 is tolerated


def probe(u):
    """Register a guessed path (renderer builds it at runtime)."""
    optional.add(u)


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

collect(json.load(open(_t('audio_manifest.json'), encoding='utf-8')))
collect(json.load(open(_t('vfx_manifest.json'), encoding='utf-8')))

# The map loader uses `new URL("assets/map/", document.baseURI).href + "..."`,
# so the paths never appear as string literals in the bundle. Fetch the map
# manifest and inflate every buffer/image it references.
map_manifest = 'assets/map/map12-fast.gltf'
if map_manifest not in urls:
    try:
        if not os.path.exists(_t('map12-fast.gltf.json')):
            _download(BASE + map_manifest, _t('map12-fast.gltf.json'), 'map manifest')
        manifest = json.load(open(_t('map12-fast.gltf.json'), encoding='utf-8'))
        for b in manifest.get('buffers', []):
            urls.add('assets/map/' + b['uri'])
        for i in manifest.get('images', []):
            urls.add('assets/map/' + i['uri'])
        urls.add(map_manifest)
        urls.add('assets/map/navigation.bin')
        urls.add('assets/map/grass-material.json')
        # grass material points at its own brush texture by file name
        gm = 'assets/map/grass-material.json'
        if not os.path.exists(_t('grass-material.json')):
            _download(BASE + gm, _t('grass-material.json'), 'grass material')
        gmd = json.load(open(_t('grass-material.json'), encoding='utf-8'))
        if gmd.get('texture'):
            urls.add('assets/map/' + gmd['texture'])
        # relic glow is loaded as  mapBase + "health-relic-glow.png"
        urls.add('assets/map/health-relic-glow.png')
    except Exception as e:
        print('  (skip map manifest)', e, flush=True)

heroes = ['Ashe','Lux','Ahri','Ezreal','Garen','Jinx','Yasuo','Sett','Darius','Ryze',
          'DrMundo','Malphite','MissFortune','Leona','Morgana','Veigar',
          'ElderDragon','RiftHerald','BaronNashor','BlueCaster','BlueMelee','BlueSiege',
          'RedCaster','RedMelee','RedSiege','Tower','Inhibitor','Nexus','BridgeStatue',
          'Chain','Hermit','LargePoro','Poro','Relic','SmallPoro']
# Model files are named literally in the bundle; portraits / loading screens /
# skill-preview frames are built from the champion name at runtime, so they are
# probes — a champion that ships without one simply 404s and that is fine.
for h in heroes:
    urls.add('assets/models/%s.glb.gz' % h)
    probe('assets/%s-loading.jpg' % h)
    probe('assets/%s.png' % h)
    probe('assets/ui/minimap-%s.png' % h)
    # Skill preview frames used by the renderer — 4 frames per hero
    for i in range(4):
        probe('assets/ui/%s-%d.png' % (h, i))

for h in json.load(open(_t('m_scales.json'), encoding='utf-8')):
    urls.add('assets/models/%s.glb.gz' % h)
    probe('assets/%s-loading.jpg' % h)
    probe('assets/%s.png' % h)

# --------------------------------------------------------------- stylesheets
# The bundle never references the stylesheets themselves, nor the images they
# pull in via url().  Download every .css that sits next to the assets and mine
# it (this is where assets/fonts/*.woff2, assets/ui/panel.png, ... come from).
CSS_FILES = ['style.css', 'native-shop.css', 'player-hud.css',
             'game-header.css', 'online-lobby.css',
             'augment-selection.css', 'match-social.css']
os.makedirs(DEST, exist_ok=True)
for css in CSS_FILES:
    dest = os.path.join(DEST, css)
    if not os.path.exists(dest) or os.path.getsize(dest) == 0:
        try:
            _download(BASE + css, dest, css)
        except Exception as e:
            print('  (skip %s) %s' % (css, e), flush=True)
    if os.path.exists(dest):
        text = open(dest, encoding='utf-8', errors='replace').read()
        for _q, u in re.findall(r'url\((["\']?)([^)"\']+)\1\)', text):
            u = u.strip()
            if u.startswith('data:') or u.startswith(('http:', 'https:', '//')):
                continue
            if u.startswith('assets/'):
                urls.add(u)

# index.html — inline <img src> such as assets/ui/victory.png
INDEX = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                      '..', 'index.html'))
if os.path.exists(INDEX):
    html = open(INDEX, encoding='utf-8', errors='replace').read()
    prefix = 'static/r20260915-miss-fortune-1/'
    for m in re.findall(r'''(?:src|href)=["']([^"']+)["']''', html):
        if prefix in m:
            m = m.split(prefix, 1)[1]
        if m.startswith('assets/'):
            urls.add(m)

# -------------------------------------------------------- speculative extras
# Paths the renderer builds at runtime (template strings, `new URL("assets/map/")`
# + name), so they never appear as literals in the bundle.  A 404 here is not a
# failure — they are reported separately at the end.

# health bar sprite families (frame/fill/stun …)
for fam in ('frame-self', 'frame-enemy', 'frame-ally', 'frame-neutral',
            'fill-self', 'fill-enemy', 'fill-ally', 'fill-neutral',
            'fill-mana', 'fill-shield', 'stun', 'root', 'silence'):
    optional.add('assets/healthbars/%s.png' % fam)

# minimap objective icons (lower-case runtime names + capitalised variants)
for icon in ('tower', 'nexus', 'inhibitor', 'healthpack',
             'Tower', 'Nexus', 'Inhibitor', 'Healthpack'):
    optional.add('assets/ui/minimap-%s.png' % icon)

# skill-shot / range indicator textures
for c in (
    'aoe.png', 'aoe_indicator.png', 'line03.png', 'line_arrow.png',
    'target_indicator.png', 'selfindicators.png',
    'locallinemissilebase.png', 'locallinemissiletarget.png',
    'globallinemissilebase.png', 'globallinemissiletarget.png',
    'conicrangeindicator.png', 'circularrangeindicator.png',
    'circularrangeindicatorul.png', 'skillshot_circle.png',
    'skillshot_cone.png', 'skillshot_rectangle.png', 'skillshot_ring.png',
    'color-movetogreen.png', 'movement_indicator.png',
    'movement_indicator4.mesh.json', 'black.png',
    # particle meshes resolved as "assets/controls/" + name + ".mesh.json"
    'cursor_moveto.mesh.json', 'shockwavetrail.mesh.json',
    # mouse cursor sprites: `assets/controls/${cursor}.png`
    'hand1.png', 'singletarget.png', 'hoverfriendly.png', 'hoverenemy.png',
    'singletargetenemycannoyattack.png',
    'enemyaoe.png', 'enemyskillshot.png', 'enemyconicrangeindicator.png',
    'enemycircularrangeindicator.png',
    'allyaoe.png', 'allyskillshot.png', 'allyconicrangeindicator.png',
    'allycircularrangeindicator.png',
    'selfaoe.png', 'selfskillshot.png', 'selfconicrangeindicator.png',
    'selfcircularrangeindicator.png',
    'aoe_jinx.png', 'sett_base_e_indicator.png',
    'sett_base_w_indicator_blue.png',
    'skillshot_jinx_arrow_02.png', 'skillshot_jinx_base_02.png',
    'skillshot_rectangle_base_r01_v01.png',
    'skillshot_rectangle_tip_r01_v01.png',
):
    optional.add('assets/controls/' + c)

# map geometry is fetched both raw and gzipped
for i in range(8):
    optional.add('assets/map/geometry-%d.bin' % i)
    optional.add('assets/map/geometry-%d.bin.gz' % i)

# turret destruction debris
for side in ('Blue', 'Red'):
    for i in range(1, 4):
        optional.add('assets/models/TurretShatter%s%d.glb.gz' % (side, i))

optional -= set(urls)

# drop game-internal texture paths that are not served over HTTP
urls = sorted(u for u in urls if not u.endswith(('.tex', '.dds')))
urls += sorted(optional)
print('files to fetch: %d (%d derived + %d speculative)'
      % (len(urls), len(urls) - len(optional), len(optional)), flush=True)

os.makedirs(DEST, exist_ok=True)
lock = threading.Lock()
done = [0]
missing = []
missing_optional = []
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
                    (missing_optional if u in optional else missing).append(u)
                return
            time.sleep(1 + attempt)
        except Exception:
            time.sleep(1 + attempt)
    with lock:
        done[0] += 1
        (missing_optional if u in optional else missing).append(u)

with ThreadPoolExecutor(max_workers=24) as ex:
    futs = [ex.submit(fetch, u) for u in urls]
    for i, f in enumerate(futs):
        f.result()
        if i % 200 == 0:
            print('  %d/%d  %.1fMB' % (done[0], len(urls), total_bytes[0]/1e6), flush=True)

print('DONE in %.0fs' % (time.time() - start))
print('downloaded: %.1f MB, %d files'
      % (total_bytes[0]/1e6, len(urls) - len(missing) - len(missing_optional)))
print('missing(404):', len(missing))
open(_t('missing.txt'), 'w', encoding='utf-8').write('\n'.join(missing))
for m in missing[:40]:
    print('  404', m)
if missing_optional:
    print('speculative probes not on CDN (harmless):', len(missing_optional))
    for m in missing_optional[:20]:
        print('  --', m)
