/* Timestamped observations, never reconstructed hourly history. */
'use strict';
window.dangerionsProgress = function(data,now=Date.now()){
  const HOUR=3600000,DAY=24*HOUR,TOLERANCE=65*60000;
  const at=Date.parse(data.updatedAt),target=at-DAY;
  const valid=v=>Number.isFinite(v)&&v>0;
  const snapshots=[...(data.snapshots||[])].filter(s=>Number.isFinite(Date.parse(s.capturedAt))&&s.values&&Array.isArray(s.roster)).sort((a,b)=>Date.parse(a.capturedAt)-Date.parse(b.capturedAt));
  const baseline=snapshots.filter(s=>Date.parse(s.capturedAt)<at&&Math.abs(Date.parse(s.capturedAt)-target)<=TOLERANCE).sort((a,b)=>Math.abs(Date.parse(a.capturedAt)-target)-Math.abs(Date.parse(b.capturedAt)-target)||Date.parse(a.capturedAt)-Date.parse(b.capturedAt))[0]||null;
  const failed=new Set((data.failures||[]).map(f=>f.name));
  const fresh=p=>valid(p.itemLevel)&&!failed.has(p.name)&&Number.isFinite(Date.parse(p.observedAt))&&Math.abs(at-Date.parse(p.observedAt))<=30*60000&&now-at<=2*HOUR;
  const before=name=>{
    const v=baseline?.values[name];
    return v&&valid(v.itemLevel)&&Math.abs(Date.parse(baseline.capturedAt)-Date.parse(v.observedAt))<=30*60000?v:null;
  };
  const complete=!!baseline&&baseline.roster.length>0&&baseline.roster.every(name=>before(name))&&data.players.every(fresh);
  const rank=p=>1+data.players.filter(q=>q.itemLevel>p.itemLevel).length;
  const delta=p=>fresh(p)&&before(p.name)?p.itemLevel-before(p.name).itemLevel:null;
  function movement(p){
    if(!baseline)return {value:null,reason:'collecting'};
    if(!baseline.roster.includes(p.name))return {value:null,reason:'new'};
    if(!complete)return {value:null,reason:'incomplete'};
    const oldRank=1+baseline.roster.filter(name=>before(name).itemLevel>before(p.name).itemLevel).length;
    return {value:oldRank-rank(p),from:oldRank,to:rank(p),reason:null};
  }
  return {at,target,snapshots,baseline,fresh,rank,delta,movement,complete,tolerance:TOLERANCE};
};
