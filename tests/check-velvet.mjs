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

for(const leader of original.players){
 const data=structuredClone(original);data.players.find(p=>p.name===leader.name).itemLevel=99999;
 const app=mount(data);await app.ready;
 const podium=app.el('podium').innerHTML;
 assert.equal((podium.match(/class="podium-card/g)||[]).length,3);
 assert.match(podium,new RegExp('class="podium-card first" data-player="'+leader.name+'"'));
 assert.match(podium,/medal-art/);
 assert.doesNotMatch(podium,/NaN|Infinity|undefined/);
 assert.equal((app.el('roster').innerHTML.match(/class="rank-row/g)||[]).length,original.players.length);
 assert.match(app.el('roster').innerHTML,new RegExp('Rang 1: '+leader.name));
 assert.equal(app.el('roster-count').textContent,String(original.players.length));
}
const css=fs.readFileSync(new URL('../dist/velvet.css',import.meta.url),'utf8');
assert.match(css,/prefers-reduced-motion:reduce/);
assert.match(css,/rank-row.on-podium\{display:none/);
assert.match(css,/velvet-stage.webp/);
console.log('PASS: every roster member can become gold leader, live values remain independent of artwork, all ten players remain available, reduced motion supported.');
