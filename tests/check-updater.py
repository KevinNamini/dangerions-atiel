"""Offline checks for preserving the real daily archive during refresh failures."""
import contextlib,io,importlib.util,json,tempfile
from pathlib import Path
from datetime import datetime,timezone,timedelta
from zoneinfo import ZoneInfo
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('updater',root/'tools/update_roster.py')
updater=importlib.util.module_from_spec(spec);spec.loader.exec_module(updater)
seed=json.loads((root/'data/history.json').read_text())
with tempfile.TemporaryDirectory() as directory:
    updater.ROOT=Path(directory)
    (updater.ROOT/'data').mkdir();(updater.ROOT/'dist').mkdir()
    hp=updater.ROOT/'data/history.json'
    previous=(datetime.now(ZoneInfo('Europe/Berlin'))-timedelta(days=1)).strftime('%Y-%m-%d')
    seed.pop('snapshots',None)
    seed.pop('hourlyStartedAt',None)
    seed['history']=seed['history'][:1]
    seed['history'][0]['day']=previous
    hp.write_text(json.dumps(seed))
    originals={p['name']:p for p in seed['players']}
    def fetch(entry):
        p=dict(originals[entry[0]])
        p['observedAt']=datetime.now(timezone.utc).isoformat()
        if p['name']=='NaminiLee':p['itemLevel']+=10
        return p
    updater.fetch_one=fetch
    with contextlib.redirect_stdout(io.StringIO()):updater.run()
    first=json.loads(hp.read_text())
    assert len(first['snapshots'])==1 and len(first['snapshots'][0]['roster'])==len(updater.ROSTER)
    assert first['hourlyStartedAt']==first['snapshots'][0]['capturedAt']
    assert len(first['history'])==2 and first['history'][0]==seed['history'][0]
    assert first['history'][-1]['values']['NaminiLee']['itemLevel']==originals['NaminiLee']['itemLevel']+10
    assert first['history'][0]['values']['Stecher']==seed['history'][0]['values']['Stecher']
    assert first['history'][0]['values']['Stecher']['source']=='user-reported'
    assert first['history'][0]['values']['Stecher']['itemLevel']==0
    assert first['history'][-1]['values']['Stecher']['itemLevel']==originals['Stecher']['itemLevel']
    with contextlib.redirect_stdout(io.StringIO()):updater.run()
    second=json.loads(hp.read_text())
    assert len(second['snapshots'])==2 and second['snapshots'][0]==first['snapshots'][0]
    assert second['hourlyStartedAt']==first['hourlyStartedAt']
    assert len(second['history'])==2,'Never duplicate the same Berlin calendar day.'
    assert second['history'][0]['values']['Stecher']==seed['history'][0]['values']['Stecher'],'Keep the attributed start and its exact time through hourly refreshes.'
    def partial(entry):
        if entry[0]=='Roctopus':raise ValueError('Temporary source failure')
        return fetch(entry)
    updater.fetch_one=partial
    try:
        with contextlib.redirect_stdout(io.StringIO()):updater.run()
    except SystemExit as e:assert e.code==2
    result=json.loads(hp.read_text())
    assert result['failures'][0]['name']=='Roctopus'
    assert 'Roctopus' not in result['snapshots'][-1]['values']
    assert len(result['snapshots'])==3
    assert len(result['players'])==len(updater.ROSTER)==10
    assert next(p for p in result['players'] if p['name']=='Roctopus')['observedAt']==next(p for p in second['players'] if p['name']=='Roctopus')['observedAt']
    def fail(_):raise ValueError('Source offline')
    updater.fetch_one=fail
    before=hp.read_bytes()
    try:updater.run()
    except RuntimeError:pass
    else:raise AssertionError('An entirely failed refresh must fail without saving a false new observation.')
    assert hp.read_bytes()==before
print('PASS: previous days retained, same-day updates merged, partial failures labelled, complete failures preserve the entire archive.')
