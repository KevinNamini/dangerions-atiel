import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../dist/chronicle.js',import.meta.url),'utf8')+';\n'+fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const original=JSON.parse(fs.readFileSync(new URL('../data/history.json',import.meta.url),'utf8'));
class Element {
  constructor(dataset={}){this.dataset=dataset;this.innerHTML='';this.textContent='';this.style={};this.listeners={};this.attrs={};this.hidden=false;this.classes=new Set();this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),toggle:(x,v)=>v?this.classes.add(x):this.classes.delete(x)};}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,f){this.listeners[k]=f;}
  appendChild(){}
  showModal(){this.open=true;}
  close(){this.open=false;this.listeners.close?.({});}
}
function mount(data,feed=null){
  const ids=new Map(),extras=new Map();
  const el=id=>{if(!ids.has(id))ids.set(id,new Element());return ids.get(id)};
  const periods=['7','30','all'].map(period=>new Element({period:String(period)}));
  const document={body:new Element(),getElementById:el,createElement:()=>new Element(),listeners:{},addEventListener(k,f){this.listeners[k]=f},querySelector(s){if(!extras.has(s))extras.set(s,new Element());return extras.get(s)},querySelectorAll(s){if(s==='[data-period]')return periods;if(s==='[data-chart]')return [];return []}};
  const ready=vm.runInNewContext(source,{window:{DANGERIONS_DATA:data},document,Intl,Date,AbortController,fetch:async()=>({ok:true,json:async()=>feed}),location:{protocol:feed?'https:':'file:',href:'file:///Dangerions.html'},navigator:{},setTimeout:()=>1,clearTimeout:()=>{}},{timeout:2000});
  return {el,document,extras,periods,ready};
}
// Fixed observations make regressions independent of future live data updates.
const fixture=structuredClone(original);
const values={JKLee:[1258,1404],NaminiLee:[1047,1148],LordSanchez2:[774,843],FumosLee:[684,684],BrouceLee:[615,663],SurfingLee:[559,559],Stecher:[null,250],Roctopus:[191,203]};
fixture.updatedAt='2026-10-16T12:00:00Z';
fixture.players.forEach(p=>{p.itemLevel=values[p.name][1];p.observedAt=fixture.updatedAt});
fixture.history=['2026-10-15','2026-10-16'].map((day,i)=>({day,values:Object.fromEntries(fixture.players.filter(p=>values[p.name][i]!==null).map(p=>[p.name,{itemLevel:values[p.name][i],level:p.level,observedAt:day+'T12:00:00Z'}]))}));
const start=mount(fixture);
const choose=(app,name)=>app.el('chart-select').listeners.click({target:{closest:()=>({dataset:{chart:name}})}});
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
assert.match(start.el('chart').innerHTML,/\+146 IL/);
assert.match(start.el('chart').innerHTML,/11,6 % im Zeitraum/);
assert.match(start.el('daily-champion').innerHTML,/JKLee/);
assert.match(start.el('timeline').innerHTML,/5 aufgestiegen · 2 unverändert/);
assert.match(start.el('atlas-pulse').innerHTML,/<b>5<\/b>aufgestiegen/);
assert.match(start.el('atlas-pulse').innerHTML,/1 ohne Vortagsvergleich/);
start.el('view-cards').onclick();assert.equal(start.extras.get('.rank-columns').hidden,true);
start.el('view-list').onclick();assert.equal(start.extras.get('.rank-columns').hidden,false);
start.document.listeners.click({target:{closest:()=>({dataset:{player:'NaminiLee'}})}});
assert.equal(start.el('player-dialog').open,true);
assert.match(start.el('player-detail').innerHTML,/1.148/);
assert.match(start.el('player-detail').innerHTML,/OFFIZIELLES AION-PROFIL/);
start.el('close-dialog').onclick();assert.equal(start.document.body.style.overflow,'');
await start.el('share').onclick();assert.match(start.el('toast').textContent,/lokal/);

// A lower-IL player can lead the atlas without taking over the main ranking.
const rising=structuredClone(fixture);
for(const [name,value] of [['BrouceLee',1000],['Roctopus',491]]){
  rising.players.find(p=>p.name===name).itemLevel=value;
  rising.history[1].values[name].itemLevel=value;
}
const dailyLeader=mount(rising);
assert.deepEqual(pathOrder(dailyLeader).slice(0,3),['BrouceLee','Roctopus','JKLee'],'Use absolute gains, not percentage gains or current Item-Level.');
assert.match(dailyLeader.el('chart').innerHTML,/IM FOKUS <span>· IL-RANG 3<\/span><\/p><h3>BrouceLee/);
assert.match(dailyLeader.el('roster').innerHTML,/Rang 1: JKLee/);
assert.deepEqual([...dailyLeader.el('roster').innerHTML.matchAll(/data-player="([^"]+)"/g)].map(m=>m[1]),['JKLee','NaminiLee','BrouceLee','LordSanchez2','FumosLee','SurfingLee','Roctopus','Stecher']);
assert.deepEqual([...dailyLeader.el('podium').innerHTML.matchAll(/data-player="([^"]+)"/g)].map(m=>m[1]),['NaminiLee','JKLee','BrouceLee']);

choose(start,'NaminiLee');
assert.match(start.el('chart').innerHTML,/NaminiLee/);
assert.match(start.el('chart').innerHTML,/\+101 IL/);
assert.match(start.el('chart').innerHTML,/9,6 % im Zeitraum/);
start.el('chart').listeners.click({target:{closest:()=>({dataset:{observation:'2026-10-15'}})}});
assert.equal(start.el('atlas-inspection').textContent,'15.10.2026 · 1.047 Item-Level');
start.el('atlas-day-select').onchange({target:{value:'2026-10-16'}});
assert.equal(start.el('atlas-inspection').textContent,'16.10.2026 · 1.148 Item-Level');
choose(start,'FumosLee');
assert.match(start.el('chart').innerHTML,/Unverändert/);
assert.match(start.el('chart').innerHTML,/±0 IL/);
choose(start,'Stecher');
assert.match(start.el('chart').innerHTML,/Der erste Meilenstein/);
assert.match(start.el('chart').innerHTML,/STARTPUNKT/);
assert.equal((start.el('chart').innerHTML.match(/data-observation=/g)||[]).length,1);
assert.doesNotMatch(start.el('chart').innerHTML,/class="atlas-trail observed-line"/);
start.document.listeners.click({target:{closest:()=>({dataset:{player:'Stecher'}})}});
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
first.players.forEach(p=>{p.itemLevel=first.history[0].values[p.name].itemLevel;p.observedAt='2026-10-15T12:00:00Z'});
const firstDay=mount(first);
assert.doesNotMatch(firstDay.el('chart').innerHTML,/class="atlas-trail observed-line"/);
assert.match(firstDay.el('daily-champion').innerHTML,/Krone wartet/);

const declined=structuredClone(fixture);
declined.players.find(p=>p.name==='NaminiLee').itemLevel=1037;
declined.history[1].values.NaminiLee.itemLevel=1037;
const down=mount(declined);choose(down,'NaminiLee');
assert.match(down.el('chart').innerHTML,/−10 IL/);
assert.match(down.el('chart').innerHTML,/Ein neuer Kurs/);
assert.match(down.el('roster').innerHTML,/↓ -10/);
assert.deepEqual(pathOrder(down).slice(-4),['FumosLee','SurfingLee','NaminiLee','Stecher'],'Zero precedes negative changes; missing comparison follows both.');
const tied=structuredClone(fixture);tied.players.find(p=>p.name==='NaminiLee').itemLevel=1404;
const tie=mount(tied);assert.match(tie.el('roster').innerHTML,/Rang 1: NaminiLee/);assert.match(tie.el('roster').innerHTML,/Rang 3: LordSanchez2/);

const gap=structuredClone(fixture);gap.history[0].day='2026-10-14';
const missing=mount(gap);
assert.doesNotMatch(missing.el('chart').innerHTML,/class="atlas-trail observed-line"/,'Never connect observations across a missing calendar day.');
assert.doesNotMatch(missing.el('chart-select').innerHTML,/class="observed-line"/);
assert.match(missing.el('daily-champion').innerHTML,/Krone wartet/);
assert.deepEqual(pathOrder(missing),fixture.players.toSorted((a,b)=>b.itemLevel-a.itemLevel).map(p=>p.name),'Do not substitute an older observation for the direct previous day.');
const absent=structuredClone(fixture);absent.history.forEach(day=>{delete day.values.Roctopus});
const empty=mount(absent);choose(empty,'Roctopus');
assert.match(empty.el('chart').innerHTML,/fehlen Messwerte/);
assert.doesNotMatch(empty.el('chart').innerHTML,/NaN|Infinity/);

// All means the complete retained archive, not a 365-day approximation.
const long=structuredClone(fixture);
long.history.unshift({day:'2025-10-16',values:structuredClone(fixture.history[0].values)});
long.history[0].values.JKLee.itemLevel=1400;
const archive=mount(long);
assert.equal(archive.el('days-tag').textContent,'2 Tagesstände');
archive.periods[2].onclick();
assert.equal(archive.el('days-tag').textContent,'3 Tagesstände');
assert.match(archive.el('chart').innerHTML,/2025-10-16/);
assert.deepEqual(pathOrder(archive),dailyOrder,'Changing the chart window must not sort by total period gains.');
archive.periods[1].onclick();assert.deepEqual(pathOrder(archive),dailyOrder);
archive.periods[0].onclick();assert.equal(archive.el('days-tag').textContent,'2 Tagesstände');
const live=mount(structuredClone(original));
assert.equal((live.el('chart-select').innerHTML.match(/data-chart=/g)||[]).length,original.players.length);
assert.doesNotMatch(live.el('chart').innerHTML,/NaN|Infinity|undefined/);
console.log('PASS: daily-gain atlas order, unchanged IL ranking, individual paths, exact daily and period gains, selectable milestones, missing dates, new players, complete archive, profiles, feed validation and sharing.');
