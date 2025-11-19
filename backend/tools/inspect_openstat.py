import json
from urllib.request import urlopen, Request

BASE = "https://openstat.psa.gov.ph:443/PXWeb/api/v1/en/DB/2M/NFG/0032M4AFN01.px/"
req = Request(BASE, headers={"User-Agent": "inspect-openstat/1.0"})
with urlopen(req, timeout=30) as r:
    data = r.read().decode('utf-8')
js = json.loads(data)
vars = js.get('variables', [])
geo = None
comm = None
for v in vars:
    if v.get('code') == 'Geolocation':
        geo = v
    if v.get('code') == 'Commodity':
        comm = v

print('Found Geolocation entries:', len(geo.get('values', [])) if geo else 0)
# print mapping (value->text) for geolocation
mapping = dict(zip(geo['valueTexts'], geo['values']))
for name in ['Nueva Ecija','Tarlac','PHILIPPINES']:
    if name in mapping:
        print(name, '->', mapping[name])

# also print any geolocation entries containing the substring (handles prefixed dots)
for key, val in mapping.items():
    if 'Nueva Ecija' in key or 'Tarlac' in key:
        print(key, '->', val)

# try to find palay entries in commodities
palay_codes = {text:code for text,code in zip(comm['valueTexts'], comm['values'])}
for k in palay_codes:
    if 'Palay' in k or 'palay' in k or 'Rice' in k or 'Paddy' in k:
        print('Commodity match:', k, '->', palay_codes[k])

# print top 10 commodity entries
print('\nSample commodity list (first 10):')
for i,(text,code) in enumerate(palay_codes.items()):
    print(i, text, '->', code)
    if i>=9:
        break
