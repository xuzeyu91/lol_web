import re, json, collections

raw = open('game.js', encoding='utf-8', errors='replace').read()
# decode \uXXXX sequences (safe: only within string literals but fine globally)
s = re.sub(r'\\u([0-9a-fA-F]{4})', lambda m: chr(int(m.group(1), 16)), raw)
open('game.decoded.js', 'w', encoding='utf-8').write(s)
print('decoded ->', len(s))

print('\n--- id/name pairs ---')
pairs = re.findall(r'id:"([A-Z][A-Za-z]+)"\s*,\s*name:"([^"]{1,24})"', s)
for a, b in pairs:
    print('  ', a, '=>', b)
print('count', len(pairs))

print('\n--- id/title or role ---')
for m in re.finditer(r'id:"([A-Z][A-Za-z]+)"(.{0,300}?)role:"([^"]{1,20})"', s):
    print('  ', m.group(1), '=> role', m.group(3))
