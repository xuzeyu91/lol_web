import re, os, json, shutil

ROOT = r'D:\AI\AIDotNet\weblol'
ORIG = os.path.join(ROOT, '_orig')
REL = 'r20260915-miss-fortune-1'
CDN = 'https://lol.hanyue.io/static/' + REL + '/'

html = open(os.path.join(ROOT, 'raw.html'), encoding='utf-8').read()

# 1. base href -> local absolute
html = html.replace(
    '<base id="aramAssetBase" href="%s">' % CDN,
    '<base id="aramAssetBase" href="/static/%s/">' % REL)

# 2. all CDN css/js -> local absolute
html = html.replace(CDN, '/static/%s/' % REL)

# 3. bootstrap loader -> local minimal loader
html = html.replace(
    'https://lol.hanyue.io/static/bootstrap/cdn-auto-r20260915-close-guard-1.js',
    '/static/bootstrap/local-bootstrap.js')

# 4. rewrite asset routes config
m = re.search(r'globalThis\.__ARAM_ASSET_ROUTES__=(\{.*?\});', html, re.S)
cfg = json.loads(m.group(1))
cfg['routes'] = [{'id': 'local', 'label': 'Local mirror', 'base': '/static/%s/' % REL}]
cfg['scriptBase'] = '/static/%s/' % REL
cfg['bundleUrl'] = '/static/bootstrap/game-r20260915-close-guard-1.js'
cfg['bundleFallbackUrls'] = []
cfg.pop('bundleIntegrity', None)
html = html[:m.start(1)] + json.dumps(cfg, ensure_ascii=False, separators=(',', ':')) + html[m.end(1):]

open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(html)
print('wrote index.html', len(html))

# copy css into place
dst = os.path.join(ROOT, 'static', REL)
os.makedirs(dst, exist_ok=True)
for f in ['style.css', 'native-shop.css', 'player-hud.css', 'game-header.css',
          'online-lobby.css', 'augment-selection.css', 'match-social.css']:
    shutil.copy(os.path.join(ORIG, f), os.path.join(dst, f))
print('css copied')

# copy game bundle + bootstrap
bd = os.path.join(ROOT, 'static', 'bootstrap')
os.makedirs(bd, exist_ok=True)
shutil.copy(os.path.join(ORIG, 'game.js'),
            os.path.join(bd, 'game-r20260915-close-guard-1.js'))
print('bundle copied', os.path.getsize(os.path.join(bd, 'game-r20260915-close-guard-1.js')))
