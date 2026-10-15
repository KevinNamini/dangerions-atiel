#!/usr/bin/env python3
"""Fetch only the seven requested public AION 2 profiles, retaining Berlin daily snapshots."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode, quote
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import json, concurrent.futures, sys
ROOT=Path(__file__).resolve().parents[1]
ROSTER=[
 ('JKLee','NGez0OkmLm4ARHzxujw-izU0jxC3X6ResHxCMbZDrKQ='),
 ('NaminiLee','NGez0OkmLm4ARHzxujw-iy9LePA9vMKe-iI6eLgZFo8='),
 ('LordSanchez2','NGez0OkmLm4ARHzxujw-i64pqpVXnLI49ibv1c0Xrs8='),
 ('FumosLee','NGez0OkmLm4ARHzxujw-i2R7pXXT81r5rwKk5BkKPZQ='),
 ('BrouceLee','NGez0OkmLm4ARHzxujw-i7vryLZ7xv8FAYSEirbKb1I='),
 ('SurfingLee','NGez0OkmLm4ARHzxujw-i37_xQHtIq3KPFnl6Cw6aRE='),
 ('Roctopus','NGez0OkmLm4ARHzxujw-i6MaMG41S36PbXYirigCshc=')]
CLASSES={'Ranger':'Waldläufer','Gladiator':'Gladiator','Templar':'Templer','Cleric':'Kleriker','Spiritmaster':'Beschwörer','SpiritMaster':'Beschwörer','Chanter':'Kantor'}
COLORS={'Ranger':'#a9d6b3','Gladiator':'#efae73','Templar':'#8db7e6','Cleric':'#e6d5ab','Spiritmaster':'#b5a0eb','SpiritMaster':'#b5a0eb','Chanter':'#8dcecf'}
TRACES={'JKLee': '#a9d6b3', 'NaminiLee': '#f0ce8c', 'LordSanchez2': '#8db7e6', 'FumosLee': '#e9adba', 'BrouceLee': '#ef986d', 'SurfingLee': '#b5a0eb', 'Roctopus': '#8dcecf'}
def fetch_one(entry):
 name,cid=entry
 url='https://aion2.plaync.com/api/character/info?'+urlencode({'lang':'en-US','region':'eu','characterId':cid,'serverId':2322})
 with urlopen(Request(url,headers={'Accept':'application/json'}),timeout=30) as r: d=json.load(r)
 p=d['profile'];il=next(x['value'] for x in d['stat']['statList'] if x['type']=='ItemLevel')
 assert p['characterName']==name and p['serverId']==2322
 assert isinstance(il,(int,float)) and 0 < il < 100000
 now=datetime.now(timezone.utc).isoformat()
 avatar=ROOT/'dist'/'assets'/f'{name}.png'
 if not avatar.exists():
  try:
   with urlopen(p['profileImage'],timeout=30) as r: avatar.write_bytes(r.read())
  except Exception as e:print('Avatar unavailable:',name,str(e),file=sys.stderr)
 return {'name':name,'classKey':p['className'].lower(),'className':CLASSES.get(p['className'],p['className']),'level':p['characterLevel'],'itemLevel':il,'combatPower':p['combatPower'],'guild':p.get('regionName',''),'server':'Atiel','color':TRACES.get(name,COLORS.get(p['className'],'#c5a7ef')),'avatar':f'assets/{name}.png' if avatar.exists() else 'assets/'+name+'.svg','avatarType':'portrait' if avatar.exists() else 'class','title':p.get('titleName',''),'url':'https://aion2.plaync.com/en-us/characters/2322/'+quote(cid,safe='')+'?region=eu','observedAt':now}
def run():
 history_path=ROOT/'data'/'history.json'
 old=json.loads(history_path.read_text()) if history_path.exists() else {'players':[], 'history':[], 'scheduleEnabled':False}
 players=[];failures=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
  jobs={pool.submit(fetch_one,p):p[0] for p in ROSTER}
  for f,name in jobs.items():
   try: players.append(f.result())
   except Exception as e: failures.append({'name':name,'error':str(e)});players.extend(p for p in old['players'] if p['name']==name)
 if len(failures)==len(ROSTER) or not players:raise RuntimeError('No fresh verified character data; previous dataset was not changed.')
 players.sort(key=lambda p:(-p['itemLevel'],p['name'].lower()))
 day=datetime.now(ZoneInfo('Europe/Berlin')).strftime('%Y-%m-%d')
 # One daily closing snapshot; failed fetches never create an observation.
 current={p['name']:{'itemLevel':p['itemLevel'],'level':p['level'],'observedAt':p['observedAt']} for p in players if p['name'] not in [f['name'] for f in failures]}
 history=old.get('history',[])
 existing=next((h for h in history if h['day']==day),None)
 if existing:existing['values'].update(current)
 else:history.append({'day':day,'values':current})
 data={'guild':'Dangerions','server':'Atiel','region':'Europa','faction':'Asmodier','updatedAt':datetime.now(timezone.utc).isoformat(),'scheduleEnabled':old.get('scheduleEnabled',False),'players':players,'history':sorted(history,key=lambda h:h['day'])[-366:],'failures':failures}
 text=json.dumps(data,ensure_ascii=False,indent=2)
 tmp=history_path.with_suffix('.tmp');tmp.write_text(text);tmp.replace(history_path)
 (ROOT/'dist'/'data.js').write_text('window.DANGERIONS_DATA = '+text+';\n')
 print(json.dumps({'players':[{k:p[k] for k in ('name','className','level','itemLevel','combatPower','guild')} for p in players],'days':len(history),'failures':failures},ensure_ascii=False))
 if failures:sys.exit(2)
if __name__=='__main__':run()
