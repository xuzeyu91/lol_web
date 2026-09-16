import re
s = open('game.decoded.js', encoding='utf-8').read()

# TurretShatter usage
print('=== TurretShatter usage ===')
for m in re.finditer(r'TurretShatter', s):
    a = max(0, m.start() - 100); b = m.start() + 350
    print(s[a:b].replace('\n', ' '))
    print('-----')
    if len([1]) > 5: break

# geometry- usage
print('\n=== geometry- ===')
for m in re.finditer(r'geometry-', s):
    a = max(0, m.start() - 160); b = m.start() + 220
    print(s[a:b].replace('\n', ' '))
    print('-----')
    break

# uri .gz
print('\n=== ".gz" fetches ===')
for m in re.finditer(r'fetch\(.*\.gz', s):
    a = max(0, m.start() - 80); b = m.start() + 200
    print(s[a:b].replace('\n', ' '))
    print('-----')
    break

# n.buffers
print('\n=== buffers handling ===')
for m in re.finditer(r'\.buffers\.map', s):
    a = max(0, m.start() - 220); b = m.start() + 320
    print(s[a:b].replace('\n', ' '))
    print('-----')
    break

# all controls/ literal strings
print('\n=== controls literal references ===')
for m in set(re.findall(r'''assets/controls/[A-Za-z0-9_\-.]+\.png''', s)):
    print('  ', m)