"""Regression checks for stale/conflicting official character responses."""
import copy, importlib.util, io, json, tempfile
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from unittest.mock import patch

root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('updater',root/'tools/update_roster.py')
updater=importlib.util.module_from_spec(spec);spec.loader.exec_module(updater)
entry=next(x for x in updater.ROSTER if x[0]=='NaminiLee')
base={'profile':{'characterId':entry[1],'characterName':entry[0],'serverId':2322,
 'characterLevel':45,'className':'Gladiator','combatPower':52529,
 'regionName':'Dangerions'},'stat':{'statList':[{'type':'ItemLevel','value':1047},
 {'type':'STR','value':15,'statSecondList':['Attack increase +1.5%']}]}}

with tempfile.TemporaryDirectory() as directory:
 updater.ROOT=Path(directory)
 (updater.ROOT/'dist/assets').mkdir(parents=True)
 (updater.ROOT/'dist/assets/NaminiLee.png').touch()
 requests=[]
 def response(levels,duplicate=False,incomplete=False):
  def get(request,timeout):
   params=parse_qs(urlparse(request.full_url).query)
   requests.append((request,params))
   raw=copy.deepcopy(base)
   raw['stat']['statList'][0]['value']=levels[params['lang'][0]]
   if duplicate:raw['stat']['statList'].append({'type':'ItemLevel','value':999})
   if incomplete:raw['stat']['statList'][1]['statSecondList']=None
   return io.BytesIO(json.dumps(raw).encode())
  return get
 with patch.object(updater,'urlopen',side_effect=response({'en-US':1047,'de-DE':1047})):
  assert updater.fetch_one(entry)['itemLevel']==1047
 assert len(requests)==2 and all(set(q)=={'region','lang','characterId','serverId'} for _,q in requests)
 assert all(q['region']==['eu'] and q['serverId']==['2322'] for _,q in requests)
 assert all('no-cache' in r.get_header('Cache-control','') for r,_ in requests)
 assert all(r.get_header('Accept-language','').startswith(q['lang'][0]) for r,q in requests)
 with patch.object(updater,'urlopen',side_effect=response({'en-US':803,'de-DE':1047})):
  try:updater.fetch_one(entry)
  except ValueError as e:assert 'Conflicting' in str(e)
  else:raise AssertionError('The observed 803/1047 disagreement must not be published.')
 with patch.object(updater,'urlopen',side_effect=response({'en-US':803,'de-DE':803})):
  assert updater.fetch_one(entry)['itemLevel']==803,'A confirmed decrease must remain possible.'
 with patch.object(updater,'urlopen',side_effect=response({'en-US':979,'de-DE':979},incomplete=True)):
  try:updater.fetch_one(entry)
  except ValueError as e:assert 'Incomplete' in str(e)
  else:raise AssertionError('Two matching but incomplete responses must not be published.')
 with patch.object(updater,'urlopen',side_effect=response({'en-US':1047,'de-DE':1047},duplicate=True)):
  try:updater.fetch_one(entry)
  except ValueError:pass
  else:raise AssertionError('Ambiguous item-level fields must fail validation.')
print('PASS: fresh language-aware requests, conflicting/incomplete values rejected, verified decreases accepted, ambiguous fields rejected.')
