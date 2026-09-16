import re
s = open('game.decoded.js', encoding='utf-8').read()

# Search for manifest fetches
for kw in ['map12', 'Map manifest', 'loadMap', 'load(map', 'manifest', 'map/',
           'navigation.bin', 'map12-fast.gltf', 'grass-material']:
    print('=== %s ===' % kw)
    for m in re.finditer(re.escape(kw), s):
        a = max(0, m.start() - 200)
        print(s[a:m.start() + 250].replace('\n', ' '))
        print('-----')
        break