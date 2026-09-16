"""补齐漏抓的图片：每位英雄的 ui/{Hero}-{i}.png 技能预览图 + vfx 清单里的全部帧图。"""
import os, json, urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE = "https://lol.hanyue.io/static/r20260915-miss-fortune-1/"
DEST = r"D:\AI\AIDotNet\weblol\static\r20260915-miss-fortune-1"
HERE = os.path.dirname(os.path.abspath(__file__))

HEROES = ['Ashe', 'Lux', 'Ahri', 'Ezreal', 'Garen', 'Jinx', 'Yasuo', 'Sett',
          'Darius', 'Ryze', 'DrMundo', 'Malphite', 'MissFortune',
          'ElderDragon', 'RiftHerald', 'BaronNashor',
          'Leona', 'Morgana', 'Veigar']

urls = set()

# 1. 每位英雄的技能预览图（0..7，实际只存在 0..3）
for h in HEROES:
    for i in range(8):
        urls.add('assets/ui/%s-%d.png' % (h, i))

# 2. vfx 清单里引用的所有图片
vfx_path = os.path.join(HERE, 'vfx_manifest.json')
if os.path.exists(vfx_path):
    vfx = json.load(open(vfx_path, encoding='utf-8'))
    found = set()
    def walk(o):
        if isinstance(o, str):
            if o.startswith('assets/') and o.endswith(('.png', '.jpg', '.webp')):
                found.add(o)
        elif isinstance(o, dict):
            for v in o.values(): walk(v)
        elif isinstance(o, list):
            for v in o: walk(v)
    walk(vfx)
    print('vfx 清单引用图片:', len(found))
    urls |= found

# 3. audio 清单里引用的所有图片（图标等）
aud_path = os.path.join(HERE, 'audio_manifest.json')
if os.path.exists(aud_path):
    aud = json.load(open(aud_path, encoding='utf-8'))
    found = set()
    def walk2(o):
        if isinstance(o, str):
            if o.startswith('assets/') and o.endswith(('.png', '.jpg', '.webp')):
                found.add(o)
        elif isinstance(o, dict):
            for v in o.values(): walk2(v)
        elif isinstance(o, list):
            for v in o: walk2(v)
    walk2(aud)
    print('audio 清单引用图片:', len(found))
    urls |= found

urls = sorted(urls)
print('待抓取:', len(urls))

ok, bad = [], []
def fetch(u):
    dest = os.path.join(DEST, u.replace('/', os.sep))
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    try:
        req = urllib.request.Request(BASE + u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=120) as r:
            open(dest, 'wb').write(r.read())
        ok.append(u)
    except Exception as e:
        bad.append((u, str(e)[:50]))

with ThreadPoolExecutor(max_workers=16) as ex:
    list(ex.map(fetch, urls))

print('新下载: %d, 不存在: %d' % (len(ok), len(bad)))
for u, e in bad[:30]:
    print('  MISS', u, e)
