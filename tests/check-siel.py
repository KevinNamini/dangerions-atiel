"""No network: Siel identity, loading states and formatted item-level parsing."""
import importlib.util
from pathlib import Path
import sys
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / 'tools'))
spec = importlib.util.spec_from_file_location('siel', root / 'tools/check_siel.py')
siel = importlib.util.module_from_spec(spec)
spec.loader.exec_module(siel)
def html(name='Mocro', place='Atiel (Europe)', il='885'):
    return f'<meta name="description" content="{name}, level 45 Chanter on {place}: 39,652 combat power, item level {il}, #9,041 on Atiel.">'
assert siel.parse_profile(html(), 'Mocro')['itemLevel'] == 885
assert siel.parse_profile(html(il='1,663'), 'Mocro')['itemLevel'] == 1663
for text in [html(name='Other'), html(place='Other (Europe)'), '<h2>Reading Mocro from NC</h2>', html(il='0')]:
    try:
        siel.parse_profile(text, 'Mocro')
    except ValueError:
        pass
    else:
        raise AssertionError('Loading, wrong identity and invalid item-level values must fail.')
print('PASS: Siel values parsed; loading, wrong character/server and invalid values rejected.')
