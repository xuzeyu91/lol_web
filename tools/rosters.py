import re
s = open('game.decoded.js', encoding='utf-8').read()

def roster(var):
    i = s.find('var %s=[' % var)
    if i < 0:
        return None
    j = s.find('];', i)
    return re.findall(r'id:"([A-Za-z]+)"', s[i:j])

for v in ['Da', 'Qp']:
    print(v, '->', roster(v))

# every capitalized id object with name+role (selectable heroes with full kit)
print()
print('all id+title+role:', re.findall(r'id:"([A-Z][A-Za-z]+)",name:"[^"]+",title:', s))
