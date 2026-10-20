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

const app=mount(structuredClone(original));
assert.equal((app.el('roster').innerHTML.match(/class="rank-row/g)||[]).length,9);
assert.match(app.el('roster').innerHTML,/Mocro<small class="alt-character" title="Stechers Zweitcharakter">Stecher · Zweitcharakter<\/small>/);
assert.equal((app.el('roster').innerHTML.match(/class="alt-character"/g)||[]).length,1);
assert.match(app.el('roster').innerHTML,/Kantor/);
assert.match(app.el('roster').innerHTML,/885/);
assert.equal(original.snapshots.slice(0,-1).some(s=>Object.hasOwn(s.values,'Mocro')),false);
assert.equal(original.snapshots.at(-1).values.Mocro.itemLevel,885);
console.log('PASS: nine ranked characters, one discreet Stecher label, verified Mocro start, no invented earlier observations.');
