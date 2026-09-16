import re
s = open('game.decoded.js', encoding='utf-8').read()

for hero in ['Veigar', 'Leona', 'Morgana', 'Ashe']:
    print('=' * 20, hero)
    for m in re.finditer(r'id:"%s"' % hero, s):
        a = max(0, m.start() - 80)
        print('   ...', s[a:m.start() + 620].replace('\n', ' '))
        print()

print('=' * 20, 'loading.jpg builder')
for m in re.finditer(r'-loading\.jpg', s):
    a = max(0, m.start() - 420)
    print(s[a:m.start() + 60].replace('\n', ' '))
    print('---')
