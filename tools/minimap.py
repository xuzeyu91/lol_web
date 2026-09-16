import re
s = open('game.decoded.js', encoding='utf-8').read()
for m in re.finditer(r'minimap-', s):
    a = max(0, m.start() - 500)
    print(s[a:m.start() + 120].replace('\n', ' '))
    print('-----')
