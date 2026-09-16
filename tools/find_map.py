import re
s = open('game.decoded.js', encoding='utf-8').read()

print('=== map manifest references ===')
for m in re.finditer(r'map', s):
    a = max(0, m.start() - 200)
    snippet = s[a:m.start() + 240].replace('\n', ' ')
    if 'manifest' in snippet or 'map12' in snippet or 'navigation' in snippet or 'map/' in snippet:
        print(snippet)
        print('---')

print()
print('=== Ashe-0..3 references ===')
for m in re.finditer(r'Ashe-\$\{', s):
    print('  ', s[max(0, m.start() - 80):m.start() + 120].replace('\n', ' '))

print()
print('=== controls aoe.png references ===')
for m in re.finditer(r'aoe\.png', s):
    print('  ', s[max(0, m.start() - 120):m.start() + 80].replace('\n', ' '))