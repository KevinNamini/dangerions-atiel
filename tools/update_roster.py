#!/usr/bin/env python3
"""Fetch the requested public AION 2 profiles, retaining Berlin daily snapshots."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode, quote
from datetime import datetime, timezone, timedelta
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
 ('Roctopus','NGez0OkmLm4ARHzxujw-i6MaMG41S36PbXYirigCshc='),
 ('Stecher','NGez0OkmLm4ARHzxujw-i1tBrUZ3xg05lihgmWa05Eo=')]
CLASSES={'Ranger':'Waldläufer','Gladiator':'Gladiator','Templar':'Templer','Cleric':'Kleriker','Spiritmaster':'Beschwörer','SpiritMaster':'Beschwörer','Chanter':'Kantor','Assassin':'Assassine'}
COLORS={'Ranger':'#a9d6b3','Gladiator':'#efae73','Templar':'#8db7e6','Cleric':'#e6d5ab','Spiritmaster':'#b5a0eb','SpiritMaster':'#b5a0eb','Chanter':'#8dcecf','Assassin':'#d6b0d8'}
TRACES={'JKLee': '#a9d6b3', 'NaminiLee': '#f0ce8c', 'LordSanchez2': '#8db7e6', 'FumosLee': '#e9adba', 'BrouceLee': '#ef986d', 'SurfingLee': '#b5a0eb', 'Roctopus': '#8dcecf', 'Stecher': '#d6b0d8'}
def fetch_profile(entry,lang):
 name,cid=entry
 # Match the public character page's canonical query and language context.
 # Variant queries returned incomplete stats and 803 while NaminiLee's live
 # official page showed 1047 on 2026-10-15. Reject such partial responses below.
 url='https://aion2.plaync.com/api/character/info?'+urlencode({'region':'eu','lang':lang,'characterId':cid,'serverId':2322})
 headers={'Accept':'application/json, text/plain, */*','Accept-Language':lang+','+lang.split('-')[0]+';q=0.9',
  'Referer':'https://aion2.plaync.com/'+lang.lower()+'/characters/2322/'+quote(cid,safe='')+'?region=eu',
  'User-Agent':'DangerionsProfileChecker/1.0','Cache-Control':'no-cache'}
 with urlopen(Request(url,headers=headers),timeout=30) as r: d=json.load(r)
 p=d['profile']
 if p.get('characterName')!=name or p.get('characterId')!=cid or p.get('serverId')!=2322:
  raise ValueError('Official profile identity does not match the requested character.')
 levels=[x['value'] for x in d['stat']['statList'] if x['type']=='ItemLevel']
 if len(levels)!=1 or type(levels[0]) is not int or not 0 < levels[0] < 100000:
  raise ValueError('Official profile has no unambiguous valid item level.')
 stats=[x for x in d['stat']['statList'] if x['type']!='ItemLevel' and x.get('value',0)>0]
 if stats and not any(x.get('statSecondList') for x in stats):
  raise ValueError('Incomplete official stat response: all descriptions for positive stats are missing; previous observation retained.')
 return d,levels[0]
def fetch_one(entry):
 name,cid=entry
 d,il=fetch_profile(entry,'en-US')
 check,check_il=fetch_profile(entry,'de-DE')
 p=d['profile']
 # Never guess which of two conflicting responses is right, or substitute a
 # historical maximum. Confirmed decreases remain valid observations.
 if il!=check_il or p['characterLevel']!=check['profile']['characterLevel']:
  raise ValueError(f'Conflicting official profile values (en-US item level {il}, de-DE {check_il}); previous observation retained.')
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
 if len(failures)==len(ROSTER) or not players:
  print(json.dumps({'failures':failures},ensure_ascii=False),file=sys.stderr)
  raise RuntimeError('No fresh verified character data; previous dataset was not changed.')
 players.sort(key=lambda p:(-p['itemLevel'],p['name'].lower()))
 day=datetime.now(ZoneInfo('Europe/Berlin')).strftime('%Y-%m-%d')
 # Daily archive plus timestamped captures. Failed fetches never become new points.
 current={p['name']:{'itemLevel':p['itemLevel'],'level':p['level'],'observedAt':p['observedAt']} for p in players if p['name'] not in [f['name'] for f in failures]}
 history=old.get('history',[])
 existing=next((h for h in history if h['day']==day),None)
 if existing:existing['values'].update(current)
 else:history.append({'day':day,'values':current})
 captured=datetime.now(timezone.utc)
 snapshots=[s for s in old.get('snapshots',[]) if datetime.fromisoformat(s['capturedAt'])>=captured-timedelta(days=31)]
 snapshots=[s for s in snapshots if s['capturedAt']!=captured.isoformat()]
 snapshots.append({'capturedAt':captured.isoformat(),'roster':[name for name,_ in ROSTER],'values':current})
 data={**old,'schemaVersion':2,'guild':'Dangerions','server':'Atiel','region':'Europa','faction':'Asmodier','updatedAt':captured.isoformat(),'hourlyStartedAt':old.get('hourlyStartedAt',captured.isoformat()),'scheduleEnabled':old.get('scheduleEnabled',False),'players':players,'history':sorted(history,key=lambda h:h['day'])[-366:],'snapshots':sorted(snapshots,key=lambda s:s['capturedAt']),'failures':failures}
 text=json.dumps(data,ensure_ascii=False,indent=2)
 tmp=history_path.with_suffix('.tmp');tmp.write_text(text);tmp.replace(history_path)
 (ROOT/'dist'/'data.js').write_text('window.DANGERIONS_DATA = '+text+';\n')
 print(json.dumps({'players':[{k:p[k] for k in ('name','className','level','itemLevel','combatPower','guild')} for p in players],'days':len(history),'snapshots':len(snapshots),'capturedAt':captured.isoformat(),'failures':failures},ensure_ascii=False))
 if failures:sys.exit(2)
if __name__=='__main__':run()
