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
fixture.players.forEach(p=>{p.itemLevel=values[p.name][1];p.observedAt=fixture.updatedAt});
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
assert.match(start.el('atlas-pulse').innerHTML,/1 ohne 24-h-Vergleich/);
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
assert.match(start.el('chart').innerHTML,/<span>im Zeitraum<\/span>/);
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
assert.doesNotMatch(missing.el('chart').innerHTML,/class="atlas-trail observed-line"/,'Never connect observations across a missing calendar day.');
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
assert.equal(startup.el('comparison-label').textContent,'Veränderung · vorläufig');
assert.match(startup.el('comparison-detail').textContent,/Vorläufig · 18,4 Std.: 15.10., 19:37 → 16.10., 14:00 Uhr/);
assert.equal(startup.el('rank-delta-heading').textContent,'IL · SEIT START');
assert.match(startup.el('roster').innerHTML,/rank-move fall impact-1/);
assert.match(startup.el('roster').innerHTML,/NEU/);
assert.equal(startup.periods[0].textContent,'Seit Start');
assert.equal(startup.el('days-tag').textContent,'2 Messpunkte');
assert.equal((startup.el('chart').innerHTML.match(/data-observation=/g)||[]).length,2);
assert.match(startup.el('chart').innerHTML,/class="atlas-trail atlas-start-link"/);
assert.match(startup.el('chart').innerHTML,/<strong>\+146<\/strong>/);
assert.match(startup.el('daily-champion').innerHTML,/AUFSTEIGER · SEIT START/);
assert.match(startup.el('atlas-pulse').innerHTML,/1 ohne Startvergleich/);
startup.el('atlas-day-select').onchange({target:{value:'2026-10-15T17:37:00Z'}});
assert.equal(startup.el('atlas-inspection').textContent,'15.10.2026, 19:37 Uhr · 1.258 Item-Level');
choose(startup,'Stecher');
assert.equal((startup.el('chart').innerHTML.match(/data-observation=/g)||[]).length,1);
assert.doesNotMatch(startup.el('chart').innerHTML,/atlas-start-link/);
startup.periods[1].onclick();assert.equal(startup.el('days-tag').textContent,'2 Tagesstände');
startup.periods[0].onclick();choose(startup,'NaminiLee');
warmFeed=structuredClone(fixture);warmFeed.updatedAt='2026-10-16T12:05:00Z';
await startup.intervals[0]();
assert.equal(startup.el('comparison-label').textContent,'Veränderung · letzte 24 h');
assert.equal(startup.periods[0].textContent,'24 h');
assert.match(startup.el('chart').innerHTML,/<h3>NaminiLee<\/h3>/,'Automatic transition keeps the selected player.');
assert.doesNotMatch(startup.el('chart').innerHTML,/atlas-start-link/);
assert.match(startup.el('daily-champion').innerHTML,/AUFSTEIGER · 24 STUNDEN/);
// Kevin's attributed zero start participates everywhere without an infinite percentage.
const reported=structuredClone(warm);
reported.history[0].values.Stecher={itemLevel:0,level:1,observedAt:'2026-10-15T23:00:00+02:00',source:'user-reported',reportedBy:'Kevin',recordedAt:'2026-10-16T11:30:00Z'};
reported.players.find(p=>p.name==='Stecher').itemLevel=275;
reported.history[1].values.Stecher.itemLevel=275;reported.snapshots[0].values.Stecher.itemLevel=275;
const manual=mount(reported);
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
console.log('PASS: 24-hour atlas, timestamp selection, daily archive, eight rank-effect tiers, unchanged IL ranking, feed refresh preserving view, profiles.');
