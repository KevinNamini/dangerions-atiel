/* Timestamped observations, never reconstructed hourly history. */
'use strict';
window.dangerionsProgress = function(data,now=Date.now()){
  const HOUR=3600000,DAY=24*HOUR,TOLERANCE=65*60000;
  const at=Date.parse(data.updatedAt),target=at-DAY;
  const valid=v=>Number.isFinite(v)&&v>0;
  const reported=v=>v?.source==='user-reported'&&typeof v.reportedBy==='string'&&v.reportedBy.trim().length>0&&Number.isFinite(Date.parse(v.recordedAt));
  const validObservation=v=>v&&Number.isFinite(Date.parse(v.observedAt))&&(valid(v.itemLevel)||(reported(v)&&v.itemLevel===0&&v.level===1));
  const snapshots=[...(data.snapshots||[])].filter(s=>Number.isFinite(Date.parse(s.capturedAt))&&s.values&&Array.isArray(s.roster)).sort((a,b)=>Date.parse(a.capturedAt)-Date.parse(b.capturedAt));
  let baseline=snapshots.filter(s=>Date.parse(s.capturedAt)<at&&Math.abs(Date.parse(s.capturedAt)-target)<=TOLERANCE).sort((a,b)=>Math.abs(Date.parse(a.capturedAt)-target)-Math.abs(Date.parse(b.capturedAt)-target)||Date.parse(a.capturedAt)-Date.parse(b.capturedAt))[0]||null;
  let provisional=false;
  const calendar=ms=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date(ms));
  const started=Date.parse(data.hourlyStartedAt||snapshots[0]?.capturedAt||data.updatedAt);
  // Read the existing daily archive during startup; never turn it into hourly captures.
  if(!baseline&&Number.isFinite(started)&&at>=started&&at-started<DAY){
    const startDay=calendar(started),previous=new Date(startDay+'T12:00:00Z');
    previous.setUTCDate(previous.getUTCDate()-1);
    const history=data.history||[],daily=history.find(h=>h.day===previous.toISOString().slice(0,10));
    if(daily?.values){
      const values=Object.fromEntries(Object.entries(daily.values).filter(([,v])=>validObservation(v)&&calendar(Date.parse(v.observedAt))===daily.day&&Date.parse(v.observedAt)<started));
      if(Object.keys(values).length){
        // An established player missing from this day is incomplete, not a newcomer.
        const known=new Set(data.players.map(p=>p.name));
        const roster=[...new Set(history.filter(h=>h.day<=daily.day).flatMap(h=>Object.keys(h.values||{})))].filter(name=>known.has(name));
        const official=Object.values(values).filter(v=>!reported(v));
        baseline={source:'daily',day:daily.day,capturedAt:new Date(Math.max(...(official.length?official:Object.values(values)).map(v=>Date.parse(v.observedAt)))).toISOString(),roster,values};
        provisional=true;
      }
    }
  }
  // A failed retry does not invalidate the preceding verified observation.
  // Age each player's actual observation, not the latest successful feed update.
  const fresh=p=>{
    const observed=Date.parse(p.observedAt);
    return valid(p.itemLevel)&&Number.isFinite(observed)&&observed<=at&&at-observed<=2*HOUR&&now-observed<=2*HOUR;
  };
  const before=name=>{
    const v=baseline?.values[name];
    return validObservation(v)&&(provisional&&reported(v)||!reported(v)&&Math.abs(Date.parse(baseline.capturedAt)-Date.parse(v.observedAt))<=30*60000)?v:null;
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
  const startAt=baseline?Math.min(...Object.values(baseline.values).map(v=>Date.parse(v.observedAt)).filter(Number.isFinite)):target;
  return {at,target,snapshots,baseline,provisional,startAt,reported,validObservation,fresh,rank,delta,movement,complete,tolerance:TOLERANCE};
};
