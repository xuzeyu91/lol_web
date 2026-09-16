import re
s = open('game.decoded.js', encoding='utf-8').read()

# Find where indicators are loaded
for m in re.finditer(r'aoe\.png|localline|selfindicator', s):
    a = max(0, m.start() - 300); b = m.start() + 400
    print(s[a:b].replace('\n', ' '))
    print('-----')
    if list(re.finditer(r'aoe\.png', s)).index(m) > 1: break