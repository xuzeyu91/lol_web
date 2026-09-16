import re, json, collections

s = open('game.js', encoding='utf-8', errors='replace').read()

# hero list: look for "id:" near -loading.jpg builder, or a big table
# find all Champion-like ids (Capitalized identifiers)
ids = re.findall(r'id:"([A-Z][A-Za-z]+)"', s)
c = collections.Counter(ids)
print('distinct id: capitalized ->', len(c))
print(sorted(c))

aud = json.load(open('m_manifest.json', encoding='utf-8'))
print('\naudio heroes:', len(aud.get('heroes', {})))
tot = 0
for h, v in aud.get('heroes', {}).items():
    n = sum(len(x) for x in v.values() if isinstance(x, list))
    tot += n
print('audio hero files:', tot)
for k in aud:
    if k != 'heroes':
        print('  audio section', k, type(aud[k]), (len(aud[k]) if hasattr(aud[k], '__len__') else ''))

sc = json.load(open('m_scales.json', encoding='utf-8'))
print('\nmodels in scales.json:', len(sc))
