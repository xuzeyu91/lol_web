"""Fetch a list of asset paths (one per line) from the CDN into the local mirror."""
import os, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE = "https://lol.hanyue.io/static/r20260915-miss-fortune-1/"
DEST = r"D:\AI\AIDotNet\weblol\static\r20260915-miss-fortune-1"
PREFIX = "/static/r20260915-miss-fortune-1/"

paths = []
args = sys.argv[1:]
if args and os.path.exists(args[0]):
    paths = [l.strip() for l in open(args[0], encoding='utf-8') if l.strip()]
else:
    paths = args

# strip the http prefix so both raw paths and full URLs work
clean = []
for p in paths:
    if p.startswith('http://127.0.0.1:5173' + PREFIX):
        p = p[len('http://127.0.0.1:5173' + PREFIX):]
    elif p.startswith(PREFIX):
        p = p[len(PREFIX):]
    if p:
        clean.append(p)

print('fetching', len(clean))
ok, bad = [], []


def fetch(u):
    dest = os.path.join(DEST, u.replace('/', os.sep))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    try:
        req = urllib.request.Request(BASE + u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=120) as r:
            data = r.read()
        open(dest, 'wb').write(data)
        ok.append((u, len(data)))
    except Exception as e:
        bad.append((u, str(e)[:60]))


with ThreadPoolExecutor(max_workers=12) as ex:
    list(ex.map(fetch, clean))

for u, n in ok:
    print('  OK   %-58s %8d' % (u, n))
for u, e in bad:
    print('  MISS %-58s %s' % (u, e))
print('ok=%d bad=%d' % (len(ok), len(bad)))
