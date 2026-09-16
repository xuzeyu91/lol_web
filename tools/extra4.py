import os, urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE = "https://lol.hanyue.io/static/r20260915-miss-fortune-1/"
DEST = r"D:\AI\AIDotNet\weblol\static\r20260915-miss-fortune-1"

# Comprehensive list of control/skillshot images (verified 200 from CDN)
controls = [
    'aoe.png', 'aoe_indicator.png', 'line03.png', 'line_arrow.png',
    'target_indicator.png', 'selfindicators.png',
    'locallinemissilebase.png', 'locallinemissiletarget.png',
    'globallinemissilebase.png', 'globallinemissiletarget.png',
    'conicrangeindicator.png', 'circularrangeindicator.png',
    'circularrangeindicatorul.png', 'skillshot_circle.png',
    'skillshot_cone.png', 'skillshot_rectangle.png', 'skillshot_ring.png',
    'color-movetogreen.png', 'movement_indicator.png', 'movement_indicator4.mesh.json',
    'black.png',
    # enemy / ally / self variants (often used by renderer)
    'enemyaoe.png', 'enemyskillshot.png', 'enemyconicrangeindicator.png', 'enemycircularrangeindicator.png',
    'allyaoe.png', 'allyskillshot.png', 'allyconicrangeindicator.png', 'allycircularrangeindicator.png',
    'selfaoe.png', 'selfskillshot.png', 'selfconicrangeindicator.png', 'selfcircularrangeindicator.png',
    'aoe_jinx.png', 'sett_base_e_indicator.png', 'sett_base_w_indicator_blue.png',
    'skillshot_jinx_arrow_02.png', 'skillshot_jinx_base_02.png',
    'skillshot_rectangle_base_r01_v01.png', 'skillshot_rectangle_tip_r01_v01.png',
]

# Map geometry buffers (gzipped)
geometry = ['geometry-%d.bin.gz' % i for i in range(8)]
# Map materials
materials = ['grass-material.json']
# TurretShatter models
shatter = []
for side in ['Blue', 'Red']:
    for i in range(1, 4):
        shatter.append('TurretShatter%s%d.glb.gz' % (side, i))

# Models that vfx/models might reference
extra_models = ['Viking.glb.gz', 'Hermit.glb.gz', 'BridgeStatue.glb.gz',
                 'Chain.glb.gz', 'LargePoro.glb.gz', 'Poro.glb.gz', 'SmallPoro.glb.gz',
                 'Turret.glb.gz', 'RedTurret.glb.gz',
                 'Inhibitor.glb.gz', 'RedInhibitor.glb.gz',
                 'Nexus.glb.gz', 'RedNexus.glb.gz',
                 'BlueCaster.glb.gz', 'BlueMelee.glb.gz', 'BlueSiege.glb.gz',
                 'RedCaster.glb.gz', 'RedMelee.glb.gz', 'RedSiege.glb.gz',
                 'Relic.glb.gz']

urls = set()
for f in controls: urls.add('assets/controls/' + f)
for f in geometry: urls.add('assets/map/' + f)
for f in materials: urls.add('assets/map/' + f)
for f in shatter: urls.add('assets/models/' + f)
for f in extra_models: urls.add('assets/models/' + f)

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