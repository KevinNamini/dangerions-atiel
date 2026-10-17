/* Timestamped observations, never reconstructed hourly history. */
'use strict';
window.dangerionsDailyProgress = function(data,now=Date.now()){
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

// Compare the saved standings within seven Berlin calendar days. Retrieval
// failures do not erase an already recorded gain or turn old readings into new ones.
window.dangerionsProgress = function(data,now=Date.now()){
  const daily=window.dangerionsDailyProgress(data,now);
  const {at,reported,validObservation,snapshots,rank}=daily;
  const calendar=ms=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date(ms));
  const endDay=calendar(at),start=new Date(endDay+'T12:00:00Z');
  start.setUTCDate(start.getUTCDate()-6);
  const startDay=start.toISOString().slice(0,10);
  const names=new Set(data.players.map(p=>p.name));
  const history=[...(data.history||[])].sort((a,b)=>a.day.localeCompare(b.day));
  const recorded=v=>validObservation(v)&&Date.parse(v.observedAt)<=at&&v.source!=='user-authorized-fallback';
  const inWindow=v=>recorded(v)&&calendar(Date.parse(v.observedAt))>=startDay;
  const candidates=history.filter(h=>h.day>=startDay&&h.day<=endDay).map(h=>{
    const values=Object.fromEntries(Object.entries(h.values||{}).filter(([name,v])=>names.has(name)&&inWindow(v)&&calendar(Date.parse(v.observedAt))===h.day));
    const roster=[...new Set(history.filter(q=>q.day<=h.day).flatMap(q=>Object.keys(q.values||{})))].filter(name=>names.has(name));
    const official=Object.values(values).filter(v=>!reported(v));
    const times=(official.length?official:Object.values(values)).map(v=>Date.parse(v.observedAt));
    return {source:'daily',day:h.day,roster,values,capturedAt:times.length?new Date(Math.max(...times)).toISOString():null};
  }).concat(snapshots.filter(s=>Date.parse(s.capturedAt)<=at&&s.source!=='user-authorized-fallback').map(s=>({
    ...s,roster:s.roster.filter(name=>names.has(name)),
    values:Object.fromEntries(Object.entries(s.values).filter(([name,v])=>names.has(name)&&inWindow(v)&&Date.parse(v.observedAt)<=Date.parse(s.capturedAt)&&Date.parse(s.capturedAt)-Date.parse(v.observedAt)<=30*60000))
  }))).filter(s=>s.capturedAt&&Object.keys(s.values).length).sort((a,b)=>Date.parse(a.capturedAt)-Date.parse(b.capturedAt));
  // Prefer a complete historical group, so one missing reading cannot invent a rank move.
  const baseline=candidates.find(s=>s.roster.length&&s.roster.every(name=>s.values[name]))||candidates[0]||null;
  const before=name=>baseline?.values[name]||null;
  const current=p=>inWindow(p)&&!reported(p)&&p.itemLevel>0;
  const hasProgress=!!baseline&&data.players.some(p=>current(p)&&before(p.name)&&Date.parse(p.observedAt)>Date.parse(before(p.name).observedAt));
  const comparable=p=>hasProgress&&current(p)&&before(p.name)&&Date.parse(p.observedAt)>=Date.parse(before(p.name).observedAt);
  const delta=p=>comparable(p)?p.itemLevel-before(p.name).itemLevel:null;
  const complete=hasProgress&&baseline.roster.every(name=>before(name)&&data.players.some(p=>p.name===name&&comparable(p)))&&data.players.every(current);
  function movement(p){
    if(!baseline)return {value:null,reason:'collecting'};
    if(!baseline.roster.includes(p.name))return {value:null,reason:'new'};
    if(!complete)return {value:null,reason:'incomplete'};
    const oldRank=1+baseline.roster.filter(name=>before(name).itemLevel>before(p.name).itemLevel).length;
    return {value:oldRank-rank(p),from:oldRank,to:rank(p),reason:null};
  }
  const startAt=baseline?Math.min(...Object.values(baseline.values).map(v=>Date.parse(v.observedAt))):at;
  const recordedTimes=[...history.flatMap(h=>Object.values(h.values||{}).filter(v=>recorded(v)&&calendar(Date.parse(v.observedAt))===h.day)),...snapshots.flatMap(s=>Object.values(s.values).filter(recorded))].map(v=>Date.parse(v.observedAt));
  const provisional=!!baseline&&calendar(Math.min(...recordedTimes))>startDay;
  return {...daily,baseline,provisional,startAt,startDay,endDay,delta,movement,complete,period:'week'};
};
