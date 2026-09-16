import re, collections, json, sys

s = open('game.js', encoding='utf-8', errors='replace').read()
print('total chars:', len(s))

# 1. asset references
pat = re.compile(r'''["'`]((?:assets|static)/[A-Za-z0-9_\-./]+?\.(?:jpg|png|webp|svg|mp3|ogg|wav|json|glb|gltf|woff2?))["'`]''')
c = collections.Counter(pat.findall(s))
print('\nunique asset refs:', len(c))
for k, v in c.most_common(80):
    print('  ', k, v)

# 2. bare asset filenames (no dir)
pat2 = re.compile(r'''["'`]([A-Za-z0-9_\-]+?\.(?:jpg|png|webp|mp3|ogg))["'`]''')
c2 = collections.Counter(pat2.findall(s))
print('\nbare filename refs:', len(c2))
for k, v in c2.most_common(40):
    print('  ', k, v)

# 3. fetch / XHR urls
print('\n--- fetch/url literals ---')
for m in sorted(set(re.findall(r'''(?:fetch|XMLHttpRequest|\.src\s*=|\.href\s*=)\s*[\(]?\s*["'`]([^"'`\n]{4,120})["'`]''', s)))[:60]:
    print('  ', m)

# 4. template-literal / concat asset builders e.g. `assets/${x}-loading.jpg`
print('\n--- templated asset builders ---')
for m in sorted(set(re.findall(r'''assets/\$\{[^}]+\}[A-Za-z0-9_\-./]*''', s)))[:60]:
    print('  ', m)
