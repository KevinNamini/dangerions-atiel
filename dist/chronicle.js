/* Real observations only. Each Daeva gets a legible path, never a blended line. */
'use strict';
window.createDangerionsChronicle = function ({data,players,history,currentDay,rank,delta,image,n,esc,formatDay,shortDay}) {
  const $=id=>document.getElementById(id);
  const stamp=day=>Date.parse(day+'T12:00:00Z');
  const valid=v=>Number.isFinite(v)&&v>0;
  const signed=v=>(v>0?'+':v<0?'−':'±')+n(Math.abs(v));
  let period='7',selected=players[0].name,days=[],activePoints=[];

  function observations(p){
    return days.filter(h=>valid(h.values[p.name]?.itemLevel)).map(h=>({day:h.day,value:h.values[p.name].itemLevel}));
  }
  function paths(points,x,y){
    const runs=[];let run=[];
    points.forEach((point,i)=>{
      if(i&&stamp(point.day)-stamp(points[i-1].day)!==86400000){if(run.length)runs.push(run);run=[];}
      run.push({x:x(point.day),y:y(point.value),...point});
    });
    if(run.length)runs.push(run);
    return runs;
  }
  function trend(d,label='zum Vortag'){
    return d===null?'<span class="atlas-delta neutral">Kein Vergleich</span>':`<span class="atlas-delta ${d>0?'up':d<0?'down':'neutral'}">${d>0?'↗':d<0?'↘':'—'} ${d===0?'Unverändert':signed(d)} <small>${label}</small></span>`;
  }
  function miniChart(p){
    const points=observations(p);
    if(!points.length)return '<span class="path-empty">Noch kein Verlauf</span>';
    const lo=Math.min(...points.map(v=>v.value)),hi=Math.max(...points.map(v=>v.value));
    const start=stamp(days[0].day),span=stamp(days.at(-1).day)-start;
    const x=day=>span?8+(stamp(day)-start)/span*164:90;
    const y=value=>hi===lo?26:42-(value-lo)/(hi-lo)*32;
    const runs=paths(points,x,y);
    return `<svg class="path-mini" viewBox="0 0 180 56" preserveAspectRatio="none" aria-hidden="true"><line x1="8" y1="51" x2="172" y2="51" class="mini-base"/>${runs.map(run=>(run.length>1?`<path class="observed-line" d="${run.map((v,i)=>(i?'L':'M')+v.x+','+v.y).join(' ')}"/>`:'')+run.map(v=>`<circle cx="${v.x}" cy="${v.y}" r="2.5"/>`).join('')).join('')}</svg>`;
  }
  function renderPaths(){
    $('chart-select').innerHTML=players.map(p=>{
      const d=delta(p),pts=observations(p);
      return `<button class="atlas-path ${selected===p.name?'active':''}" data-chart="${esc(p.name)}" style="--path-color:${p.color}" aria-pressed="${selected===p.name}" aria-controls="chart" aria-label="Verlauf von ${esc(p.name)} anzeigen"><span class="path-identity">${image(p)}<span><strong>${esc(p.name)}</strong><small>RANG ${rank(p)} <i>·</i> LV. ${p.level}</small></span><span class="path-arrow" aria-hidden="true">↗</span></span><span class="path-stats"><span class="path-value">${n(p.itemLevel)}<small>ITEM-LEVEL</small></span>${trend(d,'zum Vortag')}</span>${miniChart(p)}<span class="path-caption">${pts.length>1?shortDay(pts[0].day)+' — '+shortDay(pts.at(-1).day):pts.length?'Erster Stand · '+shortDay(pts[0].day):'Keine Messung im Zeitraum'}<span aria-hidden="true">${selected===p.name?'IM FOKUS':'PFAD ANSEHEN'}</span></span></button>`;
    }).join('');
  }
  function selectObservation(day){
    const point=activePoints.find(v=>v.day===day);
    if(!point)return;
    $('atlas-inspection').textContent=formatDay(point.day)+' · '+n(point.value)+' Item-Level';
    $('atlas-day-select').value=day;
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
    const pct=gain===null?null:(gain/first.value*100);
    const growth=gain===null?'Der erste Meilenstein.':gain>0?'Der Aufstieg geht weiter.':gain<0?'Ein neuer Kurs.':'Die Stärke bleibt.';
    const profile=`<div class="atlas-daeva"><div class="atlas-orbit" aria-hidden="true"><span class="orbit-ring"></span><span class="orbit-cross">✦</span>${image(p)}</div><div class="atlas-daeva-name"><p class="eyebrow">IM FOKUS <span>· RANG ${rank(p)}</span></p><h3>${esc(p.name)}</h3><p>${esc(p.className)} <span>· Level ${p.level}</span></p></div><div class="atlas-current"><span>AKTUELLES ITEM-LEVEL</span><strong>${n(p.itemLevel)}</strong>${trend(delta(p))}</div><button class="atlas-profile-link" data-player="${esc(p.name)}">Charakterprofil <span aria-hidden="true">↗</span></button></div>`;
    if(!points.length){
      $('chart').innerHTML=`<div class="atlas-stage" style="--focus-color:${p.color}">${profile}<div class="atlas-empty"><span aria-hidden="true">✧</span><h4>Dieser Pfad wartet noch.</h4><p>Für ${esc(p.name)} fehlen Messwerte im gewählten Zeitraum.</p></div></div>`;
      return;
    }
    const low=Math.min(...points.map(v=>v.value)),high=Math.max(...points.map(v=>v.value));
    const padding=Math.max((high-low)*.32,40);
    const step=Math.pow(10,Math.floor(Math.log10(Math.max(high-low,100))))/2;
    const min=Math.max(0,Math.floor((low-padding)/step)*step),max=Math.ceil((high+padding)/step)*step;
    const w=600,h=240,left=54,right=24,top=25,bottom=23;
    const start=stamp(days[0].day),span=stamp(days.at(-1).day)-start;
    const x=day=>span?left+(stamp(day)-start)/span*(w-left-right):(w+left-right)/2;
    const y=value=>top+(max-value)/(max-min)*(h-top-bottom);
    const runs=paths(points,x,y);
    const grid=[0,.5,1].map(t=>({value:min+(max-min)*t,y:y(min+(max-min)*t)}));
    let svg=`<svg class="atlas-plot" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="atlas-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${p.color}" stop-opacity=".24"/><stop offset="1" stop-color="${p.color}" stop-opacity="0"/></linearGradient></defs>`;
    grid.forEach(g=>{svg+=`<line x1="${left}" y1="${g.y}" x2="${w-right}" y2="${g.y}" class="atlas-gridline"/>`;});
    runs.forEach(run=>{
      if(run.length<2)return;
      const path=run.map((v,i)=>(i?'L':'M')+v.x+','+v.y).join(' ');
      svg+=`<path d="${path} L${run.at(-1).x},${h} L${run[0].x},${h} Z" fill="url(#atlas-fill)"/><path class="atlas-trail-glow" d="${path}"/><path class="atlas-trail observed-line" d="${path}"/>`;
    });
    svg+='</svg>';
    const markers=points.map((v,i)=>`<button class="atlas-point ${i===points.length-1?'selected':''} ${points.length<=3?'labelled':''}" style="left:${x(v.day)/w*100}%;top:${y(v.value)/h*100}%" data-observation="${v.day}" aria-pressed="${i===points.length-1}" aria-label="${formatDay(v.day)}: ${n(v.value)} Item-Level"><span>${n(v.value)}</span></button>`).join('');
    const ticks=grid.map(g=>`<span class="atlas-y" style="top:${g.y/h*100}%">${n(Math.round(g.value))}</span>`).join('');
    const dates=[days[0],...(days.length>1?[days.at(-1)]:[])].map((v,i,all)=>`<time class="atlas-x ${i===all.length-1?'last':''}" style="left:${x(v.day)/w*100}%" datetime="${v.day}">${shortDay(v.day)}</time>`).join('');
    const rangeGain=gain===null?'<span class="atlas-range-gain neutral">STARTPUNKT</span>':`<span class="atlas-range-gain ${gain>0?'up':gain<0?'down':'neutral'}"><b>${signed(gain)} IL</b><span>${signed(Number(pct.toFixed(1)))} % im Zeitraum</span></span>`;
    $('chart').innerHTML=`<div class="atlas-stage" style="--focus-color:${p.color}">${profile}<div class="atlas-journey"><div class="atlas-journey-head"><div><p class="eyebrow">DER PERSÖNLICHE PFAD</p><h4>${growth}</h4></div>${rangeGain}</div><div class="atlas-graph" role="group" aria-label="Item-Level-Verlauf von ${esc(p.name)}. ${points.length} echte Tagesstände. Senkrechte Skala ${n(min)} bis ${n(max)}.">${svg}${ticks}${markers}${dates}${points.length===1?'<span class="atlas-first-note">Hier beginnt<br>deine Geschichte.</span>':''}</div><div class="atlas-time-machine"><div><span class="time-machine-star" aria-hidden="true">✧</span><span><small>MEILENSTEIN</small><output id="atlas-inspection">${formatDay(last.day)} · ${n(last.value)} Item-Level</output></span></div><label class="atlas-date-control"><span class="sr-only">Tagesstand auswählen</span><select id="atlas-day-select" aria-label="Tagesstand auswählen">${[...points].reverse().map(v=>`<option value="${v.day}">${v.day.slice(0,4)===currentDay.slice(0,4)?shortDay(v.day):formatDay(v.day)}</option>`).join('')}</select></label></div></div></div>`;
    $('atlas-day-select').onchange=e=>selectObservation(e.target.value);
    document.querySelectorAll('#chart img.portrait').forEach(img=>{img.onerror=()=>{img.style.visibility='hidden';};});
  }
  function render(){
    const cutoff=stamp(currentDay)-(Number(period)-1)*86400000;
    days=history.filter(h=>period==='all'||stamp(h.day)>=cutoff);
    $('days-tag').textContent=days.length+' '+(days.length===1?'Tagesstand':'Tagesstände');
    $('chart-note').textContent='Echte Tagesstände · Berliner Zeit. Fehlende Tage bleiben Lücken. Jeder Pfad hat seine eigene Skala.';
    renderPaths();renderFocus();
  }
  $('chart-select').addEventListener('click',e=>{
    const b=e.target.closest('[data-chart]');
    if(!b||!players.some(p=>p.name===b.dataset.chart))return;
    selected=b.dataset.chart;
    document.querySelectorAll('[data-chart]').forEach(c=>{
      const active=c.dataset.chart===selected;
      c.classList.toggle('active',active);c.setAttribute('aria-pressed',String(active));
      const caption=c.querySelector('.path-caption > span');if(caption)caption.textContent=active?'IM FOKUS':'PFAD ANSEHEN';
    });
    renderFocus();
    const focus=$('chart');
    if(focus.getBoundingClientRect&&focus.getBoundingClientRect().top<0){
      focus.scrollIntoView({block:'start',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    }
  });
  $('chart').addEventListener('click',e=>{
    const b=e.target.closest('[data-observation]');if(b)selectObservation(b.dataset.observation);
  });
  document.querySelectorAll('[data-period]').forEach(b=>b.onclick=()=>{
    period=b.dataset.period;
    document.querySelectorAll('[data-period]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});
    render();
  });
  const diffs=players.map(delta),count=test=>diffs.filter(test).length;
  $('atlas-pulse').innerHTML=`<p class="eyebrow">PULS DER LEGION</p><h3>So steht ihr zum Vortag.</h3><div class="pulse-counts"><span><b>${count(d=>d!==null&&d>0)}</b>aufgestiegen</span><span><b>${count(d=>d===0)}</b>unverändert</span><span><b>${count(d=>d!==null&&d<0)}</b>gesunken</span></div>${diffs.some(d=>d===null)?`<p class="pulse-note">${count(d=>d===null)} ohne Vortagsvergleich</p>`:''}`;
  render();
};
