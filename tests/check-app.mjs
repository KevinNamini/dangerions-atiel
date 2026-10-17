import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../dist/progress.js',import.meta.url),'utf8')+';\n'+fs.readFileSync(new URL('../dist/chronicle.js',import.meta.url),'utf8')+';\n'+fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const original=JSON.parse(fs.readFileSync(new URL('../data/history.json',import.meta.url),'utf8'));
class Element {
  constructor(dataset={}){this.dataset=dataset;this.innerHTML='';this.textContent='';this.style={};this.listeners={};this.attrs={};this.hidden=false;this.classes=new Set();this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),toggle:(x,v)=>v?this.classes.add(x):this.classes.delete(x)};}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,f){this.listeners[k]=f;}
  appendChild(){}
  showModal(){this.open=true;}
  close(){this.open=false;this.onclose?.({});}
}
function mount(data,feed=null){
  const fixedNow=Date.parse('2026-10-16T12:00:00Z');
  class FixedDate extends Date{constructor(...args){super(...(args.length?args:[fixedNow]));}static now(){return fixedNow;}}
  const ids=new Map(),extras=new Map(),intervals=[];
  const el=id=>{if(!ids.has(id))ids.set(id,new Element());return ids.get(id)};
  const periods=['24h','7','30','all'].map(period=>new Element({period:String(period)}));
  const document={body:new Element(),getElementById:el,createElement:()=>new Element(),listeners:{},addEventListener(k,f){this.listeners[k]=f},querySelector(s){if(!extras.has(s))extras.set(s,new Element());return extras.get(s)},querySelectorAll(s){if(s==='[data-period]')return periods;if(s==='[data-chart]')return [];return []}};
  const ready=vm.runInNewContext(source,{window:{DANGERIONS_DATA:data},document,Intl,Date:FixedDate,AbortController,fetch:async()=>({ok:true,json:async()=>typeof feed==='function'?feed():feed}),location:{protocol:feed?'https:':'file:',href:'file:///Dangerions.html'},navigator:{},setTimeout:()=>1,clearTimeout:()=>{},setInterval:fn=>intervals.push(fn)},{timeout:2000});
  return {el,document,extras,periods,ready,intervals};
}
// Fixed observations make regressions independent of future live data updates.
const fixture=structuredClone(original);
const values={JKLee:[1258,1404],NaminiLee:[1047,1148],LordSanchez2:[774,843],FumosLee:[684,684],BrouceLee:[615,663],SurfingLee:[559,559],Stecher:[null,250],Roctopus:[191,203]};
fixture.updatedAt='2026-10-16T12:00:00Z';
fixture.failures=[];
fixture.players.forEach(p=>{p.itemLevel=values[p.name][1];p.observedAt=fixture.updatedAt});
fixture.players.find(p=>p.name==='Stecher').guild=''; // Fixed historical no-guild scenario, independent of today's profile.
fixture.history=['2026-10-15','2026-10-16'].map((day,i)=>({day,values:Object.fromEntries(fixture.players.filter(p=>values[p.name][i]!==null).map(p=>[p.name,{itemLevel:values[p.name][i],level:p.level,observedAt:day+'T12:00:00Z'}]))}));
fixture.snapshots=fixture.history.map(h=>({capturedAt:h.day+'T12:00:00Z',roster:Object.keys(h.values),values:structuredClone(h.values)}));
const start=mount(fixture);
const choose=(app,name)=>app.el('chart-select').onclick({target:{closest:()=>({dataset:{chart:name}})}});
const pathOrder=app=>[...app.el('chart-select').innerHTML.matchAll(/data-chart="([^"]+)"/g)].map(m=>m[1]);
const dailyOrder=['JKLee','NaminiLee','LordSanchez2','BrouceLee','Roctopus','FumosLee','SurfingLee','Stecher'];
assert.deepEqual(pathOrder(start),dailyOrder,'Atlas orders absolute daily gains, keeping equal gains stable and missing comparisons last.');
assert.equal((start.el('roster').innerHTML.match(/class="rank-row/g)||[]).length,8);
assert.equal((start.el('podium').innerHTML.match(/class="podium-card/g)||[]).length,3);
assert.match(start.el('roster').innerHTML,/Rang 1: JKLee/);
assert.match(start.el('roster').innerHTML,/Rang 8: Roctopus/);
assert.equal((start.el('chart-select').innerHTML.match(/data-chart=/g)||[]).length,8);
assert.match(start.el('chart').innerHTML,/JKLee/);
assert.match(start.el('chart').innerHTML,/1.404/);
assert.match(start.el('chart').innerHTML,/<strong>\+146<\/strong>/);
assert.doesNotMatch(start.el('chart').innerHTML,/% im Zeitraum/);
assert.equal((start.el('chart').innerHTML.match(/<strong>\+146<\/strong>/g)||[]).length,1,'The selected profile shows its gain once.');
assert.match(start.el('daily-champion').innerHTML,/JKLee/);
assert.match(start.el('timeline').innerHTML,/5 aufgestiegen · 2 unverändert/);
assert.match(start.el('atlas-pulse').innerHTML,/<b>5<\/b>aufgestiegen/);
assert.match(start.el('atlas-pulse').innerHTML,/1 ohne Wochenvergleich/);
assert.equal(start.periods[1].attrs['aria-pressed'],'true','The weekly view is selected by default.');
assert.equal(start.el('comparison-label').textContent,'7 Tage · seit Start');
assert.match(start.el('roster').innerHTML,/rank-move steady[^>]*>±0/);
start.el('view-cards').onclick();assert.equal(start.extras.get('.rank-columns').hidden,true);
start.el('view-list').onclick();assert.equal(start.extras.get('.rank-columns').hidden,false);
start.document.onclick({target:{closest:()=>({dataset:{player:'NaminiLee'}})}});
assert.equal(start.el('player-dialog').open,true);
assert.match(start.el('player-detail').innerHTML,/1.148/);
assert.match(start.el('player-detail').innerHTML,/OFFIZIELLES AION-PROFIL/);
start.el('close-dialog').onclick();assert.equal(start.document.body.style.overflow,'');

// A lower-IL player can lead the atlas without taking over the main ranking.
const rising=structuredClone(fixture);
for(const [name,value] of [['BrouceLee',1000],['Roctopus',491]]){
  rising.players.find(p=>p.name===name).itemLevel=value;
  rising.history[1].values[name].itemLevel=value;
  rising.snapshots[1].values[name].itemLevel=value;
}
const dailyLeader=mount(rising);
assert.deepEqual(pathOrder(dailyLeader).slice(0,3),['BrouceLee','Roctopus','JKLee'],'Use absolute gains, not percentage gains or current Item-Level.');
assert.match(dailyLeader.el('chart').innerHTML,/<h3>BrouceLee<\/h3>/);
assert.match(dailyLeader.el('roster').innerHTML,/Rang 1: JKLee/);
assert.deepEqual([...dailyLeader.el('roster').innerHTML.matchAll(/data-player="([^"]+)"/g)].map(m=>m[1]),['JKLee','NaminiLee','BrouceLee','LordSanchez2','FumosLee','SurfingLee','Roctopus','Stecher']);
assert.deepEqual([...dailyLeader.el('podium').innerHTML.matchAll(/data-player="([^"]+)"/g)].map(m=>m[1]),['NaminiLee','JKLee','BrouceLee']);

start.periods[1].onclick();
choose(start,'NaminiLee');
assert.match(start.el('chart').innerHTML,/NaminiLee/);
assert.match(start.el('chart').innerHTML,/<strong>\+101<\/strong>/);
assert.match(start.el('chart').innerHTML,/<span>seit Start<\/span>/);
start.el('chart').onclick({target:{closest:()=>({dataset:{observation:'2026-10-15'}})}});
assert.equal(start.el('atlas-inspection').textContent,'15.10.2026, 14:00 Uhr · 1.047 Item-Level');
assert.equal(start.el('atlas-readings').open,true,'Tapping the graph reveals the exact observation.');
start.el('atlas-day-select').onchange({target:{value:'2026-10-16'}});
assert.equal(start.el('atlas-inspection').textContent,'16.10.2026, 14:00 Uhr · 1.148 Item-Level · laufender Tag');
choose(start,'FumosLee');
assert.match(start.el('chart').innerHTML,/atlas-change neutral/);
assert.match(start.el('chart').innerHTML,/<strong>±0<\/strong>/);
choose(start,'Stecher');
assert.match(start.el('chart').innerHTML,/Erster Messpunkt/);
assert.match(start.el('chart').innerHTML,/Kein Vergleich/);
assert.equal((start.el('chart').innerHTML.match(/data-observation=/g)||[]).length,1);
assert.doesNotMatch(start.el('chart').innerHTML,/class="atlas-trail observed-line"/);
start.document.onclick({target:{closest:()=>({dataset:{player:'Stecher'}})}});
assert.equal((start.el('player-detail').innerHTML.match(/class="detail-history"/g)||[]).length,1);
assert.match(start.el('player-detail').innerHTML,/Legion: nicht angezeigt/);

const feed=structuredClone(fixture);
feed.players.find(p=>p.name==='Stecher').itemLevel=251;
const online=mount(fixture,feed);await online.ready;
assert.match(online.el('roster').innerHTML,/Stecher, Assassine, Level \d+, Item-Level 251/);
const duplicate=structuredClone(feed);duplicate.players[7]=structuredClone(duplicate.players[6]);
const rejected=mount(fixture,duplicate);await rejected.ready;
assert.match(rejected.el('freshness').textContent,/Letzter gespeicherter Stand/);

const first=structuredClone(fixture);first.history=first.history.slice(0,1);
first.players=first.players.filter(p=>first.history[0].values[p.name]);
first.snapshots=first.snapshots.slice(0,1);first.updatedAt='2026-10-15T12:00:00Z';
first.players.forEach(p=>{p.itemLevel=first.history[0].values[p.name].itemLevel;p.observedAt='2026-10-15T12:00:00Z'});
const firstDay=mount(first);
assert.doesNotMatch(firstDay.el('chart').innerHTML,/class="atlas-trail observed-line"/);
assert.match(firstDay.el('daily-champion').innerHTML,/Krone wartet/);

const declined=structuredClone(fixture);
declined.players.find(p=>p.name==='NaminiLee').itemLevel=1037;
declined.history[1].values.NaminiLee.itemLevel=1037;declined.snapshots[1].values.NaminiLee.itemLevel=1037;
const down=mount(declined);choose(down,'NaminiLee');
assert.match(down.el('chart').innerHTML,/<strong>−10<\/strong>/);
assert.match(down.el('chart').innerHTML,/atlas-change down/);
assert.match(down.el('roster').innerHTML,/−10/);
assert.deepEqual(pathOrder(down).slice(-4),['FumosLee','SurfingLee','NaminiLee','Stecher'],'Zero precedes negative changes; missing comparison follows both.');
const tied=structuredClone(fixture);tied.players.find(p=>p.name==='NaminiLee').itemLevel=1404;
const tie=mount(tied);assert.match(tie.el('roster').innerHTML,/Rang 1: NaminiLee/);assert.match(tie.el('roster').innerHTML,/Rang 3: LordSanchez2/);

const gap=structuredClone(fixture);gap.history[0].day='2026-10-14';gap.snapshots[0].capturedAt='2026-10-14T12:00:00Z';
const missing=mount(gap);
assert.doesNotMatch(missing.el('chart').innerHTML,/class="atlas-trail observed-line"/,'A single in-window reading must not become an invented trend.');
assert.doesNotMatch(missing.el('chart-select').innerHTML,/class="observed-line"/);
assert.match(missing.el('daily-champion').innerHTML,/Krone wartet/);
assert.deepEqual(pathOrder(missing),fixture.players.toSorted((a,b)=>b.itemLevel-a.itemLevel).map(p=>p.name),'Do not substitute an older observation for the direct previous day.');
const absent=structuredClone(fixture);absent.history.forEach(day=>{delete day.values.Roctopus});absent.snapshots.forEach(s=>{delete s.values.Roctopus});
const empty=mount(absent);choose(empty,'Roctopus');
assert.match(empty.el('chart').innerHTML,/Noch kein Verlauf/);
assert.doesNotMatch(empty.el('chart').innerHTML,/NaN|Infinity/);

// All means the complete retained archive, not a 365-day approximation.
const long=structuredClone(fixture);
long.history.unshift({day:'2025-10-16',values:structuredClone(fixture.history[0].values)});
long.history[0].values.JKLee.itemLevel=1400;
const archive=mount(long);archive.periods[1].onclick();
assert.equal(archive.el('days-tag').textContent,'2 Tagesstände');
archive.periods[3].onclick();
assert.equal(archive.el('days-tag').textContent,'3 Tagesstände');
assert.match(archive.el('chart').innerHTML,/2025-10-16/);
assert.deepEqual(pathOrder(archive),dailyOrder,'Changing the chart window must not sort by total period gains.');
archive.periods[2].onclick();assert.deepEqual(pathOrder(archive),dailyOrder);
archive.periods[1].onclick();assert.equal(archive.el('days-tag').textContent,'2 Tagesstände');
const live=mount(structuredClone(original));
assert.equal((live.el('chart-select').innerHTML.match(/data-chart=/g)||[]).length,original.players.length);
assert.doesNotMatch(live.el('chart').innerHTML,/NaN|Infinity|undefined/);
// Both directions have progressively stronger rank sigils; never alter IL ordering.
for(const [name,value,direction,tier] of [['BrouceLee',1000,'rise',2],['BrouceLee',1200,'rise',3],['BrouceLee',1500,'rise',4],['JKLee',900,'fall',1],['JKLee',700,'fall',2],['JKLee',670,'fall',3],['JKLee',650,'fall',4]]){
  const moved=structuredClone(fixture);moved.players.find(p=>p.name===name).itemLevel=value;
  const app=mount(moved),row=app.el('roster').innerHTML.split(`data-player="${name}"`)[1].split('<div role="button"')[0];
  assert.match(row,new RegExp(`rank-move ${direction} impact-${tier}`));
}
const dense=structuredClone(fixture);
dense.snapshots=Array.from({length:25},(_,i)=>{const capturedAt=new Date(Date.parse('2026-10-15T12:00:00Z')+i*3600000).toISOString();return {capturedAt,roster:dense.players.map(p=>p.name),values:Object.fromEntries(dense.players.map(p=>[p.name,{itemLevel:p.itemLevel,level:p.level,observedAt:capturedAt}]))}});
const hours=mount(dense);
hours.periods[0].onclick();
assert.equal(hours.el('days-tag').textContent,'25 Messpunkte');
assert.equal((hours.el('chart').innerHTML.match(/<option /g)||[]).length,25);
assert.ok((hours.el('chart').innerHTML.match(/data-observation=/g)||[]).length<=8,'Dense charts keep a few large touch targets and every observation in the selector.');
assert.match(hours.el('chart').innerHTML,/class="atlas-trail observed-line"/);
hours.el('atlas-day-select').onchange({target:{value:dense.snapshots[4].capturedAt}});
assert.match(hours.el('atlas-inspection').textContent,/15.10.2026, 18:00 Uhr/);
let response=structuredClone(fixture);
const polling=mount(fixture,()=>response);await polling.ready;
polling.periods[3].onclick();choose(polling,'NaminiLee');polling.el('view-cards').onclick();
response=structuredClone(fixture);response.updatedAt='2026-10-16T12:05:00Z';response.players.find(p=>p.name==='NaminiLee').itemLevel=1157;
await polling.intervals[0]();
assert.match(polling.el('chart').innerHTML,/<h3>NaminiLee<\/h3>/);
assert.match(polling.el('chart').innerHTML,/1.157/);
assert.equal(polling.periods[3].attrs['aria-pressed'],'true');
assert.equal(polling.extras.get('.rank-columns').hidden,true);
assert.match(polling.el('comparison-detail').textContent,/15.10., 14:00 → 16.10., 14:05/);
// Existing daily measurements populate the initial comparison and graph immediately.
const warm=structuredClone(fixture);
warm.hourlyStartedAt=warm.updatedAt;warm.snapshots=warm.snapshots.slice(1);
Object.values(warm.history[0].values).forEach(v=>v.observedAt='2026-10-15T17:37:00Z');
let warmFeed=warm;
const startup=mount(warm,()=>warmFeed);await startup.ready;
assert.deepEqual(pathOrder(startup),dailyOrder);
assert.equal(startup.el('comparison-label').textContent,'7 Tage · seit Start');
assert.match(startup.el('comparison-detail').textContent,/Seit Start · 18,4 Std.: 15.10., 19:37 → 16.10., 14:00 Uhr/);
assert.equal(startup.el('rank-delta-heading').textContent,'IL · 7 TAGE');
assert.match(startup.el('roster').innerHTML,/rank-move fall impact-1/);
assert.match(startup.el('roster').innerHTML,/NEU/);
assert.equal(startup.periods[0].textContent,'Seit Start');
assert.equal(startup.el('days-tag').textContent,'2 Tagesstände');
startup.periods[0].onclick();
assert.equal(startup.el('days-tag').textContent,'2 Messpunkte');
assert.equal((startup.el('chart').innerHTML.match(/data-observation=/g)||[]).length,2);
assert.match(startup.el('chart').innerHTML,/class="atlas-trail observed-line"/);
assert.match(startup.el('chart').innerHTML,/<strong>\+146<\/strong>/);
assert.match(startup.el('daily-champion').innerHTML,/AUFSTEIGER · SEIT START/);
assert.match(startup.el('atlas-pulse').innerHTML,/1 ohne Wochenvergleich/);
startup.el('atlas-day-select').onchange({target:{value:'2026-10-15T17:37:00Z'}});
assert.equal(startup.el('atlas-inspection').textContent,'15.10.2026, 19:37 Uhr · 1.258 Item-Level');
choose(startup,'Stecher');
assert.equal((startup.el('chart').innerHTML.match(/data-observation=/g)||[]).length,1);
assert.doesNotMatch(startup.el('chart').innerHTML,/atlas-start-link/);
startup.periods[1].onclick();assert.equal(startup.el('days-tag').textContent,'2 Tagesstände');
startup.periods[0].onclick();choose(startup,'NaminiLee');
warmFeed=structuredClone(fixture);warmFeed.updatedAt='2026-10-16T12:05:00Z';
await startup.intervals[0]();
assert.equal(startup.el('comparison-label').textContent,'7 Tage · seit Start');
assert.equal(startup.periods[0].textContent,'24 h');
assert.match(startup.el('chart').innerHTML,/<h3>NaminiLee<\/h3>/,'Automatic transition keeps the selected player.');
assert.doesNotMatch(startup.el('chart').innerHTML,/atlas-start-link/);
assert.match(startup.el('daily-champion').innerHTML,/AUFSTEIGER · SEIT START/);
// Kevin's attributed zero start participates everywhere without an infinite percentage.
const reported=structuredClone(warm);
reported.history[0].values.Stecher={itemLevel:0,level:1,observedAt:'2026-10-15T23:00:00+02:00',source:'user-reported',reportedBy:'Kevin',recordedAt:'2026-10-16T11:30:00Z'};
reported.players.find(p=>p.name==='Stecher').itemLevel=275;
reported.history[1].values.Stecher.itemLevel=275;reported.snapshots[0].values.Stecher.itemLevel=275;
const manual=mount(reported);
manual.periods[0].onclick();
assert.deepEqual(pathOrder(manual),['Stecher','JKLee','NaminiLee','LordSanchez2','BrouceLee','Roctopus','FumosLee','SurfingLee']);
const stecherRow=manual.el('roster').innerHTML.split('data-player="Stecher"')[1].split('<div role="button"')[0];
assert.match(stecherRow,/rank-move rise impact-1/);assert.match(stecherRow,/<b>\+1<\/b>/);assert.match(stecherRow,/\+275/);assert.doesNotMatch(stecherRow,/NEU/);
assert.match(manual.el('comparison-detail').textContent,/Stecher: Start 15.10., 23:00 Uhr mit Level 1 \/ 0 IL laut Kevin/);
assert.match(manual.el('chart').innerHTML,/<h3>Stecher<\/h3>/);assert.match(manual.el('chart').innerHTML,/<strong>\+275<\/strong>/);
assert.match(manual.el('chart').innerHTML,/Startwert laut Kevin/);
assert.match(manual.el('chart').innerHTML,/>15\.10\. · 23:00<\/time>/,'The personal time axis starts at the actual reported timestamp.');
assert.equal((manual.el('chart').innerHTML.match(/<strong>\+275<\/strong>/g)||[]).length,1);
assert.equal(manual.el('atlas-readings').open,undefined,'Exact observations start collapsed.');
assert.doesNotMatch(manual.el('chart').innerHTML,/NaN|Infinity|∞/);
assert.equal((manual.el('chart').innerHTML.match(/data-observation=/g)||[]).length,2);
manual.el('atlas-day-select').onchange({target:{value:'2026-10-15T23:00:00+02:00'}});
assert.equal(manual.el('atlas-inspection').textContent,'15.10.2026, 23:00 Uhr · 0 Item-Level · Level 1 · Startwert laut Kevin');
assert.match(manual.el('daily-champion').innerHTML,/Stecher/);assert.match(manual.el('daily-champion').innerHTML,/\+275/);
assert.match(manual.el('atlas-pulse').innerHTML,/<b>6<\/b>aufgestiegen/);assert.doesNotMatch(manual.el('atlas-pulse').innerHTML,/ohne Startvergleich/);
assert.match(manual.el('timeline').innerHTML,/Stecher \+275/);assert.match(manual.el('timeline').innerHTML,/23:00 Uhr laut Kevin/);
for(const tab of manual.periods){tab.onclick();assert.match(manual.el('chart').innerHTML,/<strong>\+275<\/strong>/);assert.doesNotMatch(manual.el('chart').innerHTML,/NaN|Infinity|∞/);assert.match(manual.el('chart-note').textContent,/23:00 Uhr laut Kevin/);}
manual.document.onclick({target:{closest:()=>({dataset:{player:'Stecher'}})}});
assert.match(manual.el('player-detail').innerHTML,/Spielstart: 15.10., 23:00 Uhr · Level 1 · 0 Item-Level · laut Kevin/);
assert.equal((manual.el('player-detail').innerHTML.match(/class="detail-history"/g)||[]).length,2);
assert.match(manual.el('player-detail').innerHTML,/\+275/);
// Partial retries must not erase earlier verified gains across any view.
const recovered=structuredClone(reported);
const recoveredIL={JKLee:1415,NaminiLee:1209,FumosLee:919,LordSanchez2:843,BrouceLee:663,SurfingLee:636,Stecher:275,Roctopus:203};
const failedNames=['FumosLee','BrouceLee','Stecher'];
recovered.failures=failedNames.map(name=>({name,error:'Incomplete official response'}));
recovered.players.forEach(p=>{p.itemLevel=recoveredIL[p.name];p.observedAt=failedNames.includes(p.name)?'2026-10-16T11:50:00Z':recovered.updatedAt;});
recovered.history[1].values=Object.fromEntries(recovered.players.map(p=>[p.name,{itemLevel:p.itemLevel,level:p.level,observedAt:p.observedAt}]));
recovered.snapshots=[{capturedAt:'2026-10-16T11:50:00Z',roster:recovered.players.map(p=>p.name),values:Object.fromEntries(recovered.players.filter(p=>failedNames.includes(p.name)).map(p=>[p.name,{itemLevel:p.itemLevel,level:p.level,observedAt:p.observedAt}]))},{capturedAt:recovered.updatedAt,roster:recovered.players.map(p=>p.name),values:Object.fromEntries(recovered.players.filter(p=>!failedNames.includes(p.name)).map(p=>[p.name,{itemLevel:p.itemLevel,level:p.level,observedAt:p.observedAt}]))}];
const recoveredBefore=JSON.stringify(recovered),recoveredApp=mount(recovered);
assert.deepEqual(pathOrder(recoveredApp),['Stecher','FumosLee','NaminiLee','JKLee','SurfingLee','LordSanchez2','BrouceLee','Roctopus']);
for(const [name,gain] of [['FumosLee',235],['BrouceLee',48],['Stecher',275]]){
  const row=recoveredApp.el('roster').innerHTML.split(`data-player="${name}"`)[1].split('<div role="button"')[0];
  assert.match(row,new RegExp(`>\\+${gain}<`),`${name}'s confirmed gain remains visible in the ranking.`);
  choose(recoveredApp,name);
  assert.match(recoveredApp.el('chart').innerHTML,new RegExp(`<strong>\\+${gain}<\\/strong>`));
  recoveredApp.document.onclick({target:{closest:()=>({dataset:{player:name}})}});
  assert.match(recoveredApp.el('player-detail').innerHTML,new RegExp(`>\\+${gain}<`));
}
const recoveredFumos=recoveredApp.el('roster').innerHTML.split('data-player="FumosLee"')[1].split('<div role="button"')[0];
assert.match(recoveredFumos,/rank-move rise impact-1/);
assert.match(recoveredApp.el('daily-champion').innerHTML,/Stecher/);
assert.match(recoveredApp.el('atlas-pulse').innerHTML,/<b>8<\/b>aufgestiegen/);
assert.equal(JSON.stringify(recovered),recoveredBefore,'Rendering does not insert fabricated observations into partial snapshots.');
// Small multiples must represent the amount gained, not stretch every gain to full height.
const miniPoints=(app,name)=>[...app.el('chart-select').innerHTML.split(`data-chart="${name}"`)[1].split('</button>')[0].matchAll(/<circle cx="([^"]+)" cy="([^"]+)"/g)].map(m=>({x:Number(m[1]),y:Number(m[2])}));
const miniRise=(app,name)=>{const points=miniPoints(app,name);return points[0].y-points.at(-1).y;};
for(const tab of manual.periods){
  tab.onclick();
  assert.ok(Math.abs(miniRise(manual,'Roctopus')/miniRise(manual,'Stecher')-12/275)<1e-10,'+12 must occupy exactly 12/275 of the vertical rise of +275 in every period.');
  assert.equal(miniPoints(manual,'Roctopus')[0].y,miniPoints(manual,'Stecher')[0].y,'Every player starts from the same gain baseline.');
  assert.equal(miniRise(manual,'FumosLee'),0,'No gain stays flat on the common baseline.');
}
manual.periods[0].onclick();
assert.ok(miniPoints(manual,'Stecher')[0].x>miniPoints(manual,'Roctopus')[0].x,'The shared time axis keeps Stecher’s later actual start.');
assert.ok(miniRise(down,'NaminiLee')<0,'A loss descends.');
assert.ok(Math.abs(miniRise(down,'NaminiLee')/miniRise(down,'JKLee')-(-10/146))<1e-10,'Losses and gains use the same units.');
assert.equal(miniRise(hours,'JKLee'),0,'An entirely flat group stays flat.');
assert.doesNotMatch(hours.el('chart-select').innerHTML,/NaN|Infinity/);

// Every trace and its fill remain continuous, without fabricating observations.
const svgPaths=(html,cls)=>[...html.matchAll(new RegExp(`<path class="${cls}" d="([^"]+)"`,'g'))].map(m=>m[1]);
const coords=path=>[...path.matchAll(/[ML]([^ ,]+),([^ ]+)/g)].map(m=>({x:Number(m[1]),y:Number(m[2])}));
const circles=html=>[...html.matchAll(/<circle cx="([^"]+)" cy="([^"]+)"/g)].map(m=>({x:Number(m[1]),y:Number(m[2])}));
function connectedTrace(app,name,count){
  choose(app,name);
  const focus=app.el('chart').innerHTML;
  const mini=app.el('chart-select').innerHTML.split(`data-chart="${name}"`)[1].split('</button>')[0];
  const trails=svgPaths(focus,'atlas-trail observed-line'),areas=svgPaths(focus,'atlas-area'),glow=svgPaths(focus,'atlas-trail-glow'),previews=svgPaths(mini,'observed-line');
  for(const paths of [trails,areas,glow,previews])assert.equal(paths.length,1,`${name}: one continuous trace, glow and fill, with no overlapping start segment.`);
  assert.equal((trails[0].match(/M/g)||[]).length,1,'No invisible move command may introduce a break.');
  assert.equal((trails[0].match(/L/g)||[]).length,count-1,'Join only the recorded points.');
  assert.deepEqual(coords(trails[0]),circles(focus),'The large line passes through every real point, in timestamp order.');
  assert.deepEqual(coords(previews[0]),circles(mini),'The mini line passes through the same real observations.');
  assert.ok(areas[0].startsWith(trails[0]+' L'),'The fill follows the entire line before closing at its baseline.');
  assert.equal((areas[0].match(/M/g)||[]).length,1);
  assert.ok(areas[0].endsWith(' Z'));
  assert.equal(glow[0],trails[0]);
  assert.equal((focus.match(/<option /g)||[]).length,count,'Only real readings appear in the inspector.');
  assert.equal(circles(focus).length,count);
  assert.equal(circles(mini).length,count);
  assert.doesNotMatch(focus+mini,/NaN|Infinity|atlas-start-link|atlas-start-area/);
  assert.match(app.el('chart-note').textContent,/Zwischenzeiten sind keine zusätzlichen Messungen/);
}
// Missing captures and player-specific failures across a 17-hour gap.
const sparse=structuredClone(dense);
sparse.snapshots=sparse.snapshots.filter((s,i)=>i<3||i>18);
delete sparse.snapshots[5].values.NaminiLee;
sparse.snapshots[6].values.Roctopus.itemLevel=null;
const sparseBefore=JSON.stringify(sparse),sparseApp=mount(sparse);
sparseApp.periods[0].onclick();
for(const p of sparse.players)connectedTrace(sparseApp,p.name,sparse.snapshots.filter(s=>Number.isFinite(s.values[p.name]?.itemLevel)&&s.values[p.name].itemLevel>0).length);
const sparsePoints=miniPoints(sparseApp,'JKLee');
assert.ok(sparsePoints[3].x-sparsePoints[2].x>10*(sparsePoints[1].x-sparsePoints[0].x),'Elapsed time stays proportional; gaps are not compressed.');
assert.equal(JSON.stringify(sparse),sparseBefore,'Connecting a gap never rewrites the source archive.');
// Whole missing calendar days, an empty day and a declining player.
const skippedDays=structuredClone(fixture);
skippedDays.history[0].day='2026-10-13';
Object.values(skippedDays.history[0].values).forEach(v=>v.observedAt='2026-10-13T12:00:00Z');
skippedDays.history[0].values.NaminiLee.itemLevel=1200;
skippedDays.history.splice(1,0,{day:'2026-10-14',values:{}});
const skippedBefore=JSON.stringify(skippedDays),dailyGaps=mount(skippedDays);
for(const period of dailyGaps.periods.slice(1)){
  period.onclick();
  connectedTrace(dailyGaps,'JKLee',2);
  connectedTrace(dailyGaps,'NaminiLee',2);
  assert.ok(miniRise(dailyGaps,'NaminiLee')<0,'A connected decline must not be flattened or made upward.');
}
assert.equal(JSON.stringify(skippedDays),skippedBefore);
// The attributed start uses the same line and fill, not a duplicate overlay.
manual.periods[0].onclick();connectedTrace(manual,'Stecher',2);
connectedTrace(startup,'NaminiLee',2);
// Exercise all eight production histories and every period without modifying them.
const liveBefore=JSON.stringify(original);
for(const period of live.periods){
  period.onclick();
  for(const p of original.players){
    choose(live,p.name);
    const count=(live.el('chart').innerHTML.match(/<option /g)||[]).length;
    if(count>1)connectedTrace(live,p.name,count);
  }
}
assert.equal(JSON.stringify(original),liveBefore);
console.log('PASS: continuous traces and fills across missing hours/days, real readings only, common mini scales, unchanged rankings and archive, profiles and live feed.');
