#!/usr/bin/env python3
"""Compare the linked public Siel profiles with the candidate roster; never write observations."""
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from urllib.request import Request, urlopen
from urllib.parse import quote
import json, re, sys
from update_roster import ROOT, ROSTER

class ProfileMeta(HTMLParser):
    def __init__(self):
        super().__init__()
        self.description = None
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta' and attrs.get('name') == 'description':
            self.description = attrs.get('content', '')

def parse_profile(html, name):
    meta = ProfileMeta()
    meta.feed(html)
    pattern = re.escape(name) + r', level (\d+) .+? on Atiel \(Europe\).*?\bitem level ([\d,]+)'
    match = re.match(pattern, meta.description or '', re.I)
    if not match:
        raise ValueError('Siel profile not fully loaded or character/server identity does not match.')
    level, item_level = int(match[1]), int(match[2].replace(',', ''))
    if not 0 < level < 1000 or not 0 < item_level < 100000:
        raise ValueError('Siel profile has invalid level values.')
    return {'name': name, 'level': level, 'itemLevel': item_level,
            'url': 'https://siel.tools/eu/atiel/' + quote(name, safe='')}

def fetch_profile(name):
    url = 'https://siel.tools/eu/atiel/' + quote(name, safe='')
    req = Request(url, headers={'User-Agent': 'DangerionsProfileChecker/1.0',
                              'Accept-Language': 'en-US,en;q=0.9', 'Cache-Control': 'no-cache'})
    with urlopen(req, timeout=30) as response:
        return parse_profile(response.read().decode('utf-8'), name)

def run():
    data = json.loads((ROOT / 'data/history.json').read_text())
    candidates = {p['name']: p for p in data['players']}
    results, failures = [], []
    with ThreadPoolExecutor(max_workers=2) as pool:
        jobs = [(name, pool.submit(fetch_profile, name)) for name, _ in ROSTER]
        for name, job in jobs:
            try:
                p = job.result()
                candidate = candidates.get(name)
                if not candidate or any(p[k] != candidate[k] for k in ('level', 'itemLevel')):
                    raise ValueError('Siel differs from candidate observation: ' + json.dumps(p))
                results.append(p)
            except Exception as error:
                failures.append({'name': name, 'error': str(error)})
    print(json.dumps({'source': 'Siel', 'verified': results, 'failures': failures}, ensure_ascii=False))
    return 2 if failures else 0

if __name__ == '__main__':
    sys.exit(run())
