import re
s = open('game.decoded.js', encoding='utf-8').read()

for kw in ['locallinemissile', 'globallinemissile', 'conicrange', 'circularrange',
           'aoe.png', 'line03', 'movement_indicator', 'color-moveto',
           'TurretShatter', 'geometry-', 'gltf.bin', '.bin.gz']:
    print('---', kw, '---')
    found = False
    for m in re.finditer(re.escape(kw), s):
        a = max(0, m.start() - 160); b = m.start() + 200
        print(s[a:b].replace('\n', ' '))
        print('-----')
        found = True
        break
    if not found:
        print('  (not found)')