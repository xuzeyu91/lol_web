import re, json, collections

s = open('game.js', encoding='utf-8', errors='replace').read()

# Chinese hero names + nearby id
cn = re.findall(r'[\u4e00-\u9fff]{2,6}', s)
c = collections.Counter(cn)
print('--- top Chinese tokens (sample) ---')
for k, v in c.most_common(70):
    print('  ', k, v)

print('\n--- hero id patterns: id:"Xxx",name:"..." ---')
for m in re.finditer(r'id:"([A-Z][A-Za-z]+)"\s*,\s*name:"([^"]{1,20})"', s):
    print('  ', m.group(1), '=>', m.group(2))
