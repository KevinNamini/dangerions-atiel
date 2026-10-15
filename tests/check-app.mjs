import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const original=JSON.parse(fs.readFileSync(new URL('../data/history.json',import.meta.url),'utf8'));
class Element {
  constructor(dataset={}){this.dataset=dataset;this.innerHTML='';this.textContent='';this.style={};this.listeners={};this.attrs={};this.hidden=false;this.classes=new Set();this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),toggle:(x,v)=>v?this.classes.add(x):this.classes.delete(x)};}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,f){this.listeners[k]=f;}
  appendChild(){}
  showModal(){this.open=true;}
  close(){this.open=false;this.listeners.close?.({});}
}
function mount(data){
  const ids=new Map(),extras=new Map();
  const el=id=>{if(!ids.has(id))ids.set(id,new Element());return ids.get(id)};
  const periods=[7,30,365].map(period=>new Element({period:String(period)}));
  const document={body:new Element(),getElementById:el,createElement:()=>new Element(),listeners:{},addEventListener(k,f){this.listeners[k]=f},querySelector(s){if(!extras.has(s))extras.set(s,new Element());return extras.get(s)},querySelectorAll(s){if(s==='[data-period]')return periods;if(s==='[data-chart]')return [];return []}};
  vm.runInNewContext(source,{window:{DANGERIONS_DATA:data},document,Intl,Date,location:{protocol:'file:',href:'file:///Dangerions.html'},navigator:{},setTimeout:()=>1,clearTimeout:()=>{}},{timeout:2000});
  return {el,document,extras,periods};
}
const start=mount(structuredClone(original));
assert.equal((start.el('roster').innerHTML.match(/class="rank-row/g)||[]).length,7);
assert.equal((start.el('podium').innerHTML.match(/class="podium-card/g)||[]).length,3);
assert.match(start.el('roster').innerHTML,/Rang 1: JKLee/);
assert.match(start.el('roster').innerHTML,/Rang 7: Roctopus/);
assert.match(start.el('chart-note').textContent,/erste Momentaufnahme/);
assert.doesNotMatch(start.el('chart').innerHTML,/<path /);
assert.match(start.el('daily-champion').innerHTML,/Krone wartet/);
start.el('view-cards').onclick();assert.equal(start.extras.get('.rank-columns').hidden,true);
start.el('view-list').onclick();assert.equal(start.extras.get('.rank-columns').hidden,false);
start.document.listeners.click({target:{closest:()=>({dataset:{player:'NaminiLee'}})}});
assert.equal(start.el('player-dialog').open,true);
assert.ok(start.el('player-detail').innerHTML.includes(new Intl.NumberFormat('de-DE').format(original.players.find(p=>p.name==='NaminiLee').itemLevel)));
assert.match(start.el('player-detail').innerHTML,/OFFIZIELLES AION-PROFIL/);
start.el('close-dialog').onclick();assert.equal(start.document.body.style.overflow,'');
await start.el('share').onclick();assert.match(start.el('toast').textContent,/lokal/);

// Compare real business rules against synthetic previous-day observations.
const withPrevious=structuredClone(original),today=withPrevious.history[0];
const yesterday={day:'2026-10-14',values:structuredClone(today.values)};
yesterday.values.JKLee.itemLevel-=25;
yesterday.values.NaminiLee.itemLevel+=10;
withPrevious.history.unshift(yesterday);
const changed=mount(withPrevious);
assert.match(changed.el('roster').innerHTML,/↑ \+25/);
assert.match(changed.el('roster').innerHTML,/↓ -10/);
assert.match(changed.el('roster').innerHTML,/Unverändert/);
assert.match(changed.el('daily-champion').innerHTML,/JKLee/);
assert.match(changed.el('timeline').innerHTML,/1 aufgestiegen · 5 unverändert · 1 gesunken/);

const tied=structuredClone(original);
tied.players.find(p=>p.name==='NaminiLee').itemLevel=tied.players[0].itemLevel;
const tie=mount(tied);
assert.match(tie.el('roster').innerHTML,/Rang 1: NaminiLee/);
assert.match(tie.el('roster').innerHTML,/Rang 3: LordSanchez2/);
assert.doesNotMatch(tie.el('roster').innerHTML,/Rang 2:/);

const gap=structuredClone(withPrevious);gap.history[0].day='2026-10-13';
const missing=mount(gap);
assert.doesNotMatch(missing.el('chart').innerHTML,/<path /,'Do not bridge an unobserved day.');
assert.match(missing.el('daily-champion').innerHTML,/Krone wartet/);

// An unavailable character in a period must produce an empty state, never NaN SVG.
const noPoints=structuredClone(original);delete noPoints.history[0].values.Roctopus;
const empty=mount(noPoints);
empty.el('chart-select').listeners.click({target:{closest:()=>({dataset:{chart:'Roctopus'}})}});
assert.match(empty.el('chart').innerHTML,/fehlen Messwerte/);
assert.doesNotMatch(empty.el('chart').innerHTML,/NaN|Infinity/);
console.log('PASS: seven verified players, item-level ranking, tied ranks, profiles, views, first-day honesty, daily gains/losses/zero, missing dates, empty charts and local sharing.');
