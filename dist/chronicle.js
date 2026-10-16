/* Real observations only. Each Daeva gets a legible path, never a blended line. */
'use strict';
window.createDangerionsChronicle = function ({data,players,history,currentDay,rank,delta,image,n,esc,formatDay,shortDay,progress,state={}}) {
  const $=id=>document.getElementById(id);
  const stamp=day=>Date.parse(day+'T12:00:00Z');
  const signed=v=>(v>0?'+':v<0?'−':'±')+n(Math.abs(v));
  // The atlas follows the labelled comparison; the main IL ranking stays intact.
  const progressPlayers=[...players].sort((a,b)=>{
    const left=delta(a),right=delta(b);
    return left===null?(right===null?0:1):right===null?-1:right-left;
  });
  let period=state.period||'24h',selected=state.selected||progressPlayers[0].name,days=[],activePoints=[];
  if(!players.some(p=>p.name===selected))selected=progressPlayers[0].name;
  const hourly=()=>period==='24h';
  const clock=iso=>new Date(iso).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'});
  const dateTime=iso=>new Date(iso).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'});
  const calendar=iso=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date(iso));
  const today=calendar(Date.now());
  const detail=v=>`${dateTime(v.observedAt)} Uhr · ${n(v.value)} Item-Level${v.reportedBy?' · Level '+v.level+' · Startwert laut '+v.reportedBy:!hourly()&&v.day===today?' · laufender Tag':''}`;
  const range=()=>hourly()?[progress.provisional?progress.startAt:Math.min(progress.at-86400000,progress.startAt),progress.at]:[stamp(days[0]?.day||currentDay),stamp(days.at(-1)?.day||currentDay)];

  function observations(p){
    const seen=new Set();
    return days.flatMap(h=>{
      const v=h.values[p.name];
      if(!progress.validObservation(v))return [];
      const at=hourly()?Date.parse(v.observedAt):stamp(h.day);
      if(hourly()&&((at<progress.at-86400000&&h!==progress.baseline)||at>progress.at||seen.has(v.observedAt)))return [];
      seen.add(v.observedAt);
      return [{day:h.day,id:hourly()?v.observedAt:h.day,at,value:v.itemLevel,level:v.level,observedAt:v.observedAt,source:h.source,reportedBy:progress.reported(v)?v.reportedBy:null}];
    }).sort((a,b)=>a.at-b.at);
  }
  function paths(points,x,y){
    const runs=[];let run=[];
    points.forEach((point,i)=>{
      if(i&&(hourly()?point.at-points[i-1].at>90*60000:point.at-points[i-1].at!==86400000)){if(run.length)runs.push(run);run=[];}
      run.push({x:x(point.at),y:y(point.value),...point});
    });
    if(run.length)runs.push(run);
    return runs;
  }
  function startLink(points,x,y,cls){
    if(!hourly()||!progress.provisional||points.length<2||points[0].source!=='daily'||points[1].at-points[0].at<=90*60000)return '';
    return `<path class="${cls} atlas-start-link" d="M${x(points[0].at)},${y(points[0].value)} L${x(points[1].at)},${y(points[1].value)}"/>`;
  }
  function miniChart(p){
    const points=observations(p);
    if(!points.length)return '<span class="path-empty">Noch kein Verlauf</span>';
    const lo=Math.min(...points.map(v=>v.value)),hi=Math.max(...points.map(v=>v.value));
    const [start,end]=range(),span=end-start;
    const x=at=>span?8+(at-start)/span*164:90;
    const y=value=>hi===lo?26:42-(value-lo)/(hi-lo)*32;
    const runs=paths(points,x,y);
    return `<svg class="path-mini" viewBox="0 0 180 56" preserveAspectRatio="none" aria-hidden="true"><line x1="8" y1="51" x2="172" y2="51" class="mini-base"/>${startLink(points,x,y,'observed-line')}${runs.map(run=>(run.length>1?`<path class="observed-line" d="${run.map((v,i)=>(i?'L':'M')+v.x+','+v.y).join(' ')}"/>`:'')+run.map(v=>`<circle cx="${v.x}" cy="${v.y}" r="2.5"/>`).join('')).join('')}</svg>`;
  }
  function renderPaths(){
    $('chart-select').innerHTML=progressPlayers.map(p=>{
      const d=delta(p);
      return `<button class="atlas-path ${selected===p.name?'active':''}" data-chart="${esc(p.name)}" style="--path-color:${p.color}" aria-pressed="${selected===p.name}" aria-controls="chart" aria-label="Verlauf von ${esc(p.name)} anzeigen. ${d===null?'Kein Vergleich':signed(d)+' Item-Level '+(progress.provisional?'seit Start':'in 24 Stunden')}"><span class="path-identity">${image(p)}<strong>${esc(p.name)}</strong><span class="path-selection" aria-hidden="true"></span></span><span class="path-preview">${miniChart(p)}<strong class="path-gain ${d===null||d===0?'neutral':d<0?'down':'up'}">${d===null?'—':signed(d)}</strong></span></button>`;
    }).join('');
  }
  function selectObservation(day,reveal=true){
    const point=activePoints.find(v=>v.id===day);
    if(!point)return;
    state.observation=day;$('atlas-inspection').textContent=detail(point);
    $('atlas-day-select').value=day;
    if(reveal){state.inspection=true;$('atlas-readings').open=true;}
    document.querySelectorAll('[data-observation]').forEach(button=>{
      const active=button.dataset.observation===day;
      button.classList.toggle('selected',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }
  function renderFocus(){
    const p=players.find(q=>q.name===selected),points=observations(p);
    activePoints=points;
    const first=points[0],last=points.at(-1),gain=points.length>1?last.value-first.value:null;
    const change=hourly()?delta(p):gain;
    const changeLabel=change===null?'Kein Vergleich':hourly()?(progress.provisional?'seit Start':'in 24 h'):'im Zeitraum';
    const profile=`<div class="atlas-daeva"><button class="atlas-profile-link" data-player="${esc(p.name)}" aria-label="Profil von ${esc(p.name)} öffnen" title="Spielerprofil"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M10 5H5v14h14v-5"/></svg></button><div class="atlas-orbit" aria-hidden="true"><span class="orbit-ring"></span><span class="orbit-cross">✦</span>${image(p)}</div><div class="atlas-daeva-name"><h3>${esc(p.name)}</h3><p>Level ${p.level}</p></div><div class="atlas-metrics"><div class="atlas-current"><strong>${n(p.itemLevel)}</strong><span>Item-Level</span></div><div class="atlas-change ${change===null||change===0?'neutral':change<0?'down':'up'}"><strong>${change===null?'—':signed(change)}</strong><span>${changeLabel}</span></div></div></div>`;
    if(!points.length){
      $('chart').innerHTML=`<div class="atlas-stage" style="--focus-color:${p.color}">${profile}<div class="atlas-empty"><span aria-hidden="true">✧</span><p>Noch kein Verlauf in diesem Zeitraum.</p></div></div>`;
      return;
    }
    const low=Math.min(...points.map(v=>v.value)),high=Math.max(...points.map(v=>v.value));
    const padding=Math.max((high-low)*.32,40);
    const step=Math.pow(10,Math.floor(Math.log10(Math.max(high-low,100))))/2;
    const min=Math.max(0,Math.floor((low-padding)/step)*step),max=Math.ceil((high+padding)/step)*step;
    const w=600,h=220,left=34,right=34,top=28,bottom=24;
    // The personal path uses its own real endpoints, including a reported start.
    const start=first.at,end=last.at,span=end-start;
    const x=at=>span?left+(at-start)/span*(w-left-right):(w+left-right)/2;
    const y=value=>top+(max-value)/(max-min)*(h-top-bottom);
    const runs=paths(points,x,y);
    const grid=[0,.5,1].map(t=>({value:min+(max-min)*t,y:y(min+(max-min)*t)}));
    let svg=`<svg class="atlas-plot" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="atlas-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${p.color}" stop-opacity=".24"/><stop offset="1" stop-color="${p.color}" stop-opacity="0"/></linearGradient></defs>`;
    grid.forEach(g=>{svg+=`<line x1="${left}" y1="${g.y}" x2="${w-right}" y2="${g.y}" class="atlas-gridline"/>`;});
    svg+=startLink(points,x,y,'atlas-trail');
    runs.forEach(run=>{
      svg+=run.map(v=>`<circle cx="${v.x}" cy="${v.y}" r="1.6" fill="${p.color}" opacity=".5"/>`).join('');
      if(run.length<2)return;
      const path=run.map((v,i)=>(i?'L':'M')+v.x+','+v.y).join(' ');
      svg+=`<path d="${path} L${run.at(-1).x},${h} L${run[0].x},${h} Z" fill="url(#atlas-fill)"/><path class="atlas-trail-glow" d="${path}"/><path class="atlas-trail observed-line" d="${path}"/>`;
    });
    svg+='</svg>';
    // Keep touch targets apart; every observation remains available in Messwerte.
    const selectedPoint=points.find(v=>v.id===state.observation)||last;
    const markerPoints=[selectedPoint];
    [first,last,...points].forEach(v=>{if(!markerPoints.some(q=>q.id===v.id||Math.abs(x(q.at)-x(v.at))<84))markerPoints.push(v);});
    const markers=markerPoints.map(v=>`<button class="atlas-point ${v.id===selectedPoint.id?'selected':''} ${v.id===first.id&&points.length>1?'first':''}" style="left:${x(v.at)/w*100}%;top:${y(v.value)/h*100}%" data-observation="${v.id}" aria-pressed="${v.id===selectedPoint.id}" aria-label="${esc(detail(v))}"><span>${n(v.value)}</span></button>`).join('');
    const edges=span?[first,last]:[first];
    const dates=edges.map((v,i)=>`<time class="atlas-x ${edges.length===1?'only':i===0?'first':'last'}" datetime="${esc(v.observedAt)}">${hourly()?shortDay(calendar(v.observedAt))+' · '+clock(v.observedAt):shortDay(v.day)}</time>`).join('');
    $('chart').innerHTML=`<div class="atlas-stage" style="--focus-color:${p.color}">${profile}<div class="atlas-journey"><div class="atlas-graph" role="group" aria-label="Item-Level-Verlauf von ${esc(p.name)}. ${points.length} ${hourly()?'Messpunkte':'Tagesstände'}${points.some(v=>v.reportedBy)?', einschließlich Startwert laut '+esc(points.find(v=>v.reportedBy).reportedBy):' aus Profilabrufen'}. Senkrechte Skala ${n(min)} bis ${n(max)}.">${svg}${markers}<div class="atlas-dates">${dates}</div>${points.length===1?'<span class="atlas-first-note">Erster Messpunkt</span>':''}</div><details class="atlas-readings" id="atlas-readings" ${state.inspection?'open':''}><summary>Messwerte</summary><div class="atlas-inspector"><label class="atlas-date-control"><span class="sr-only">Messpunkt auswählen</span><select id="atlas-day-select" aria-label="Messpunkt auswählen">${[...points].reverse().map(v=>`<option value="${v.id}">${hourly()?shortDay(calendar(v.observedAt))+' '+clock(v.observedAt):v.day.slice(0,4)===currentDay.slice(0,4)?shortDay(v.day):formatDay(v.day)}</option>`).join('')}</select></label><output id="atlas-inspection">${esc(detail(last))}</output></div></details></div></div>`;
    $('atlas-readings').ontoggle=e=>{state.inspection=e.target.open;};
    $('atlas-day-select').onchange=e=>{state.observation=e.target.value;state.inspection=true;renderFocus();};
    selectObservation(selectedPoint.id,false);
    document.querySelectorAll('#chart img.portrait').forEach(img=>{img.onerror=()=>{img.style.visibility='hidden';};});
  }
  function render(){
    state.period=period;state.selected=selected;
    const cutoff=stamp(currentDay)-(Number(period)-1)*86400000;
    days=hourly()?[...(progress.provisional?[progress.baseline]:[]),...progress.snapshots.filter(s=>s===progress.baseline||(Date.parse(s.capturedAt)>=(progress.provisional?progress.startAt:progress.at-86400000)&&Date.parse(s.capturedAt)<=progress.at))]:history.filter(h=>period==='all'||stamp(h.day)>=cutoff);
    $('days-tag').textContent=days.length+' '+(hourly()?(days.length===1?'Messpunkt':'Messpunkte'):days.length===1?'Tagesstand':'Tagesstände');
    $('chart-note').textContent=hourly()?(progress.provisional?'Vorläufiger Startvergleich · echte Messpunkte in Berliner Zeit. Die gestrichelte Linie verbindet den früheren Tagesstand mit dem Stundenarchiv. Wechselt automatisch auf 24 h. Jeder Pfad hat seine eigene Skala.':'Echte Abrufe · Berliner Zeit. Fehlende Abrufe bleiben Lücken. Jeder Pfad hat seine eigene Skala.'):'Tagesstände · Berliner Zeit. Heute zeigt den laufenden Tag, abgeschlossene Tage ihren letzten erfassten Stand. Fehlende Tage bleiben Lücken. Jeder Pfad hat seine eigene Skala.';
    const reportedNotes=days.flatMap(h=>Object.entries(h.values).filter(([,v])=>progress.reported(v)).map(([name,v])=>`${name}: Startwert am ${dateTime(v.observedAt)} Uhr laut ${v.reportedBy}.`));
    if(reportedNotes.length)$('chart-note').textContent+=' '+[...new Set(reportedNotes)].join(' ');
    $('atlas-order-label').textContent=progress.provisional?'Zuwachs · seit Start':'Zuwachs · 24 h';
    document.querySelectorAll('[data-period]').forEach(b=>{if(b.dataset.period==='24h'){b.textContent=progress.provisional?'Seit Start':'24 h';b.title=progress.provisional?'Vorläufig: vorhandener Tagesstand und neue Stundenwerte':'Letzte 24 Stunden';}b.classList.toggle('active',b.dataset.period===period);b.setAttribute('aria-pressed',String(b.dataset.period===period));});
    renderPaths();renderFocus();
  }
  $('chart-select').onclick=e=>{
    const b=e.target.closest('[data-chart]');
    if(!b||!players.some(p=>p.name===b.dataset.chart))return;
    selected=b.dataset.chart;state.selected=selected;state.observation=null;state.inspection=false;
    document.querySelectorAll('[data-chart]').forEach(c=>{
      const active=c.dataset.chart===selected;
      c.classList.toggle('active',active);c.setAttribute('aria-pressed',String(active));
    });
    renderFocus();
    const focus=$('chart');
    if(focus.getBoundingClientRect&&focus.getBoundingClientRect().top<0){
      focus.scrollIntoView({block:'start',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    }
  };
  $('chart').onclick=e=>{
    const b=e.target.closest('[data-observation]');if(b)selectObservation(b.dataset.observation);
  };
  document.querySelectorAll('[data-period]').forEach(b=>b.onclick=()=>{
    period=b.dataset.period;
    document.querySelectorAll('[data-period]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});
    render();
  });
  const diffs=players.map(delta),count=test=>diffs.filter(test).length;
  $('atlas-pulse').innerHTML=`<p class="eyebrow">PULS DER LEGION</p><h3>${progress.provisional?'Euer Aufstieg seit Start.':'Eure letzten 24 Stunden.'}</h3><div class="pulse-counts"><span><b>${count(d=>d!==null&&d>0)}</b>aufgestiegen</span><span><b>${count(d=>d===0)}</b>unverändert</span><span><b>${count(d=>d!==null&&d<0)}</b>gesunken</span></div>${diffs.some(d=>d===null)?`<p class="pulse-note">${count(d=>d===null)} ${progress.provisional?'ohne Startvergleich':'ohne 24-h-Vergleich'}</p>`:''}`;
  render();
};
