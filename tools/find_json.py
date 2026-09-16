import re
s = open('game.decoded.js', encoding='utf-8').read()
# Find promise.json/then context with parseAsync
for kw in ['scales.json', 'parseAsync', 'await fetch', '.then(.=>l=>l.json']:
    print('---', kw, '---')
    found = False
    for m in re.finditer(re.escape(kw), s):
        a = max(0, m.start() - 160); b = m.start() + 260
        print(s[a:b].replace('\n', ' '))
        print('-----')
        found = True
        break
    if not found:
        print('  (not found)')