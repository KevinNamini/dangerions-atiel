(async () => {
'use strict';
function validFeed(fresh,previous){
 if(fresh?.guild!=='Dangerions'||!Array.isArray(fresh.players)||fresh.players.length!==previous.players.length||new Set(fresh.players.map(p=>p.name)).size!==fresh.players.length||!Array.isArray(fresh.history)||!fresh.history.length||!Number.isFinite(Date.parse(fresh.updatedAt)))return false;
 const names=new Set(previous.players.map(p=>p.name));
 if(fresh.players.some(p=>!names.has(p.name)||!Number.isFinite(p.itemLevel)||p.itemLevel<=0||!Number.isFinite(p.level)||!Number.isFinite(Date.parse(p.observedAt))||!/^assets\/[A-Za-z0-9]+\.(png|svg)$/.test(p.avatar)||!/^#[a-f0-9]{6}$/i.test(p.color)))return false;
 if(fresh.snapshots!==undefined&&(!Array.isArray(fresh.snapshots)||fresh.snapshots.some(s=>!Number.isFinite(Date.parse(s.capturedAt))||!Array.isArray(s.roster)||new Set(s.roster).size!==s.roster.length||s.roster.some(name=>typeof name!=='string')||!s.values||typeof s.values!=='object'||Object.entries(s.values).some(([name,v])=>!names.has(name)||!Number.isFinite(v?.itemLevel)||v.itemLevel<=0||!Number.isFinite(Date.parse(v.observedAt))))))return false;
 return true;
}
let data=window.DANGERIONS_DATA;
if(location.protocol==='https:'||location.protocol==='http:'){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),6500);
  try {
    const response=await fetch('https://raw.githubusercontent.com/KevinNamini/dangerions-atiel/main/data/history.json?t='+Date.now(),{signal:controller.signal,cache:'no-store'});
    if(!response.ok)throw new Error('Observation feed unavailable');
    const fresh=await response.json();
    if(!validFeed(fresh,data))throw new Error('Invalid observations');
    if(Date.parse(fresh.updatedAt)>=Date.parse(data.updatedAt))data=fresh;
  }catch(error){data={...data,feedUnavailable:true};}
  finally{clearTimeout(timeout);}
}
if(!data?.players?.length){document.getElementById('update-label').textContent='Charakterdaten derzeit nicht verfügbar';return;}
const $=id=>document.getElementById(id),n=v=>new Intl.NumberFormat('de-DE').format(v),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayOf=d=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(d));
const formatDay=d=>new Date(d+'T12:00:00Z').toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Europe/Berlin'});
const shortDay=d=>new Date(d+'T12:00:00Z').toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',timeZone:'Europe/Berlin'});
function previousDay(day){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10)}
const chronicleState={period:'7',selected:null};
let cardView=false,lastRenderStale=false;
function renderDashboard(){
const players=[...data.players].sort((a,b)=>b.itemLevel-a.itemLevel||a.name.localeCompare(b.name,'de'));
const history=[...data.history].sort((a,b)=>a.day.localeCompare(b.day));
const currentDay=history.at(-1)?.day||dayOf(data.updatedAt);
const progress=window.dangerionsProgress(data);
const rank=progress.rank,delta=progress.delta;
const timeLabel=iso=>new Date(iso).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'});
const elapsed=progress.provisional?new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format((progress.at-progress.startAt)/3600000):null;
const comparison=progress.baseline?`${progress.provisional?'Seit Start · '+elapsed+' Std.':'7-Tage-Vergleich'}: ${timeLabel(progress.baseline.capturedAt)} → ${timeLabel(data.updatedAt)} Uhr · letzter gespeicherter Stand`:'Noch kein Vergleichswert innerhalb der letzten sieben Tage.';
const comparisonPeriod=progress.provisional?'seit dem Startwert':'innerhalb der letzten 7 Tage';
$('comparison-label').textContent=progress.provisional?'7 Tage · seit Start':'7 Tage · letzter Stand';
$('rank-delta-heading').textContent='IL · 7 TAGE';
$('comparison-label').title=comparison;
const reportedStarts=Object.entries(progress.baseline?.values||{}).filter(([,v])=>progress.reported(v)).map(([name,v])=>`${name}: Start ${timeLabel(v.observedAt)} Uhr mit Level ${v.level} / ${n(v.itemLevel)} IL laut ${v.reportedBy}.`).join(' ');
$('comparison-detail').textContent=comparison+(reportedStarts?' '+reportedStarts:'');
function movementHTML(p){
  const m=progress.movement(p);
  const explanation=m.reason==='new'?'Neu in der Rangliste – noch kein Vergleich':m.reason==='incomplete'?'Rangvergleich fehlt: nicht alle Spieler haben Vergleichswerte':'Noch kein Vergleichsstand innerhalb der letzten 7 Tage';
  if(m.value===null)return `<span class="rank-move unavailable" title="${esc(explanation)}" aria-label="${esc(explanation)}">${m.reason==='new'?'NEU':'—'}</span>`;
  if(m.value===0)return `<span class="rank-move steady" title="Platz unverändert ${comparisonPeriod}" aria-label="Platz unverändert ${comparisonPeriod}">±0</span>`;
  const magnitude=Math.abs(m.value),tier=Math.min(magnitude,4),up=m.value>0;
  return `<span class="rank-move ${up?'rise':'fall'} impact-${tier}" title="Platz ${m.from} → ${m.to} · ${esc(comparison)}${progress.reported(progress.baseline?.values[p.name])?' · Start '+timeLabel(progress.baseline.values[p.name].observedAt)+' Uhr laut '+esc(progress.baseline.values[p.name].reportedBy):''}" aria-label="${magnitude} ${magnitude===1?'Platz':'Plätze'} ${up?'aufgestiegen':'abgestiegen'} ${comparisonPeriod}"><span aria-hidden="true">${up?'↑':'↓'}</span><b>${up?'+':'−'}${magnitude}</b></span>`;
}
function deltaHTML(p){const d=delta(p);if(d===null)return '<span class="delta neutral">—<small>Kein Vergleich</small></span>';if(d===0)return '<span class="delta neutral">±0 IL</span>';return `<span class="delta ${d<0?'down':''}" title="${esc(comparison)}">${d>0?'+':'−'}${n(Math.abs(d))}<small>${progress.provisional?'IL · seit Start':'IL · 7 Tage'}</small></span>`;}
const glyphs={assassin:'<path d="m3 2 6 3 9 12-3 2L6 7 3 2ZM21 2l-6 3-4 5M9 14l-3 5-3-2 4-6M13 16l6 5M5 21l6-5M14 20l6-5M4 15l6 5"/>',ranger:'<path d="M5 3c10 1 13 7 14 16M5 3l14 16M5 3c-2 8 3 16 14 16M3 21 21 3M14 3h7v7"/>',gladiator:'<path d="m5 19 2-4L17 3l4-1-1 4L9 17l-4 2ZM4 14l6 6M3 21l3-3M15 14l5 6M17 17l4 4"/>',templar:'<path d="m12 2 8 3v7c0 5-8 10-8 10S4 17 4 12V5l8-3ZM12 5v13M8 9h8"/>',cleric:'<path d="M12 2v20M2 12h20M6 6l12 12M6 18 18 6M9 9h6v6H9Z"/>',spiritmaster:'<path d="M12 2c-5 5 2 8-2 11-2-2-3-3-3-6-6 5-3 14 5 15 8-1 12-11 3-16 1 4-2 6-2 6 1-4-2-6-1-10Z"/>',chanter:'<path d="M12 8v14M7 5l5-3 5 3-5 5-5-5ZM5 12h14M8 17h8"/>'};
glyphs.sorcerer='<path d="m5 21 11-14M15 3l1 4 4 1-4 1-1 4-1-4-4-1 4-1 1-4ZM5 4v4M3 6h4M19 16v4M17 18h4"/>';
function icon(p){return `<svg class="class-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="${esc(p.color)}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${glyphs[p.classKey]||glyphs.gladiator}</svg>`;}
function image(p,cls='portrait'){return `<img class="${cls}" src="${esc(window.DANGERIONS_PORTRAITS?.[p.name]||p.avatar)}" data-fallback="${esc(p.avatar)}" alt="${esc(p.name)} – ${p.avatarType==='class'&&!window.DANGERIONS_PORTRAITS?.[p.name]?'Klassensymbol (kein Porträt verfügbar)':'Aion-Charakterporträt'}" loading="lazy">`;}
const top=[players[1],players[0],players[2]].filter(Boolean);
$('podium').innerHTML=top.map(p=>{const r=rank(p),style=r===1?'first':r===2?'second':'third';return `<button class="podium-card ${style}" data-player="${esc(p.name)}" aria-label="${esc(p.name)}, Rang ${r}, ${esc(p.className)}, Level ${p.level}, Item-Level ${p.itemLevel}. Profil öffnen"><div class="portrait-ring">${image(p)}</div><div class="top-rank" aria-hidden="true"><img src="assets/medal-${Math.min(r,3)}.svg" alt=""></div><h2 class="podium-name">${esc(p.name)}</h2><p class="podium-level">Level ${p.level}</p><div class="podium-value">${n(p.itemLevel)}</div><div class="value-label">Item-Level</div><span class="pedestal-jewel" aria-hidden="true">◇</span></button>`}).join('');
$('roster').innerHTML=players.map((p,i)=>`<div role="button" tabindex="0" class="rank-row ${i===0?'leader':''} ${p.name==='NaminiLee'?'mine':''}" style="--row-index:${i};--power:${p.itemLevel/players[0].itemLevel*100}%;--class-color:${p.color}" data-player="${esc(p.name)}" aria-label="Rang ${rank(p)}: ${esc(p.name)}, ${esc(p.className)}, Level ${p.level}, Item-Level ${p.itemLevel}. ${progress.movement(p).value===null?'Kein Rangvergleich.':progress.movement(p).value===0?'Rang unverändert.':Math.abs(progress.movement(p).value)+(Math.abs(progress.movement(p).value)===1?' Platz ':' Plätze ')+(progress.movement(p).value>0?'aufgestiegen.':'abgestiegen.')} Profil öffnen"><span class="rank-position"><span class="rank-num">${String(rank(p)).padStart(2,'0')}</span>${movementHTML(p)}</span><div class="rank-person"><div class="rank-avatar">${image(p)}</div><div><div class="rank-name">${esc(p.name)}${p.name==='Mocro'?'<small class="alt-character" title="Stechers Zweitcharakter">Stecher · Zweitcharakter</small>':''}</div><div class="rank-meta">${icon(p)}<span>${esc(p.className)}</span><span class="level">LV. ${p.level}</span></div></div></div><div class="rank-il">${n(p.itemLevel)}<small>${i===0?'Spitze der Legion':n(players[i-1].itemLevel-p.itemLevel)+' bis zum Vordermann'}</small></div>${deltaHTML(p)}<span class="profile-open" aria-hidden="true">↗</span></div>`).join('');
const updated=new Date(data.updatedAt);
const age=(Date.now()-updated.getTime())/36e5;lastRenderStale=age>2;
const updateText=`Geprüft ${updated.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',timeZone:'Europe/Berlin'})} · ${updated.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'})} Uhr${age>2?' · Abruf überfällig':''}`;
$('update-label').textContent=updateText;$('freshness').textContent='Quelle: Öffentliche Aion-Charakterprofile';$('roster-count').textContent=String(players.length);
if(data.feedUnavailable)$('freshness').textContent='Letzter gespeicherter Stand · neuer Abruf derzeit nicht möglich';
if(data.failures?.length){$('freshness').textContent='Teilweise ältere Werte: '+data.failures.map(f=>f.name).join(', ');}
function setView(cards){cardView=cards;$('roster').classList.toggle('cards',cards);document.querySelector('.rank-columns').hidden=cards;[$('view-list'),$('view-cards')].forEach((b,i)=>{b.classList.toggle('active',!!i===cards);b.setAttribute('aria-pressed',String(!!i===cards))})}
$('view-list').onclick=()=>setView(false);$('view-cards').onclick=()=>setView(true);setView(cardView);
window.createDangerionsChronicle({data,players,history,currentDay,rank,delta,image,n,esc,formatDay,shortDay,progress,state:chronicleState});
const gainers=players.map(p=>({p,d:delta(p)})).filter(o=>o.d!==null&&o.d>0).sort((a,b)=>b.d-a.d);const winner=gainers[0];
const championTitle=progress.provisional?'AUFSTEIGER · SEIT START':'AUFSTEIGER · 7 TAGE';
$('daily-champion').innerHTML=winner?`<p class="eyebrow">✦ ${championTitle} ✦</p>${image(winner.p)}<h3>${esc(winner.p.name)}</h3><strong class="gain">+${n(winner.d)}</strong><p>Item-Level ${comparisonPeriod}${gainers.filter(x=>x.d===winner.d).length>1?' · geteilter Spitzenwert':''}</p>`:players.some(p=>delta(p)!==null)?`<p class="eyebrow">✦ ${championTitle} ✦</p><div class="champion-sigil">◇</div><h3>Die Ruhe vor dem Aufstieg.</h3><p>Unter den vergleichbaren Werten gab es ${comparisonPeriod} keinen Zuwachs.</p>`:`<p class="eyebrow">✦ ${championTitle} ✦</p><div class="champion-sigil">♜</div><h3>Die Krone wartet.</h3><p>Sobald zwei vergleichbare Stände innerhalb einer Woche vorliegen, erscheint hier der größte Aufstieg.</p>`;
$('archive-status-text').textContent=data.scheduleEnabled?'Neue Werte werden stündlich geprüft. Jeder Abruf hinterlässt eine Spur; die Tageschronik bleibt erhalten.':'Startwerte vom '+formatDay(history[0].day)+'. Weitere Tagesstände werden nach der Einrichtung der automatischen Erfassung ergänzt.';
$('timeline').innerHTML=history.slice(-4).reverse().map(h=>{const before=history.find(q=>q.day===previousDay(h.day));let text,title;if(!before){title=h===history[0]?'Das erste Kapitel ist geschrieben.':'Ein neuer Tagesstand.';text=`${Object.keys(h.values).length} Daevas erfasst. ${h===history[0]?'Ab hier zählt jeder Aufstieg.':'Für diesen Tag liegt kein direkter Vortagsvergleich vor.'}`}else{const changes=players.filter(p=>h.values[p.name]&&before.values[p.name]).map(p=>({name:p.name,d:h.values[p.name].itemLevel-before.values[p.name].itemLevel}));const up=changes.filter(c=>c.d>0),same=changes.filter(c=>c.d===0),down=changes.filter(c=>c.d<0);title=`${up.length} aufgestiegen · ${same.length} unverändert${down.length?' · '+down.length+' gesunken':''}`;text=changes.filter(c=>c.d!==0).map(c=>`${c.name} ${c.d>0?'+':''}${n(c.d)}`).join(' · ')||'Alle vergleichbaren Item-Level sind unverändert.';if(!changes.length){title='Ein neuer Tagesstand.';text=`${Object.keys(h.values).length} Daevas erfasst. Noch keine Werte zum direkten Vortagsvergleich.`;}}const reported=Object.entries(h.values).filter(([,v])=>progress.reported(v));if(reported.length)text+=' '+reported.map(([name,v])=>`${name}: Start mit Level ${v.level} und ${n(v.itemLevel)} IL um ${new Date(v.observedAt).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'})} Uhr laut ${v.reportedBy}.`).join(' ');return `<article class="timeline-item"><time datetime="${h.day}">${formatDay(h.day)}</time><h4>${esc(title)}</h4><p>${esc(text)}</p></article>`}).join('');
function openPlayer(name){const p=players.find(x=>x.name===name);if(!p)return;const url='https://siel.tools/eu/atiel/'+encodeURIComponent(p.name);window.open(url,'_blank','noopener,noreferrer');}
document.onclick=e=>{const b=e.target.closest('[data-player]');if(b)openPlayer(b.dataset.player)};document.querySelectorAll('.rank-row').forEach(b=>b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPlayer(b.dataset.player)}});
$('close-dialog').onclick=()=>$('player-dialog').close();$('player-dialog').onclose=()=>{document.body.style.overflow=''};$('player-dialog').onclick=e=>{if(e.target===$('player-dialog')){const r=$('player-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('player-dialog').close()}};
function wireFallbacks(){document.querySelectorAll('img.portrait').forEach(img=>{img.onerror=()=>{if(img.dataset.fallback){const fallback=img.dataset.fallback;delete img.dataset.fallback;if(!img.src.endsWith(fallback)){img.src=fallback;return;}}const d=document.createElement('span');d.className='card-fallback';d.textContent=img.alt.split(' ')[0].slice(0,2).toUpperCase();d.setAttribute('aria-label',img.alt);img.replaceWith(d)}})}wireFallbacks();
}
renderDashboard();
// Refresh the public feed while the page is open, preserving the chosen view.
let refreshing=false;
async function refreshFeed(){
 if(refreshing||document.hidden||$('player-dialog').open||!/^https?:$/.test(location.protocol))return;
 refreshing=true;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6500);
 try{
  const response=await fetch('https://raw.githubusercontent.com/KevinNamini/dangerions-atiel/main/data/history.json?t='+Date.now(),{signal:controller.signal,cache:'no-store'});
  if(!response.ok)throw new Error('Feed unavailable');
  const fresh=await response.json();
  if(!validFeed(fresh,data))throw new Error('Invalid feed');
  if(Date.parse(fresh.updatedAt)>=Date.parse(data.updatedAt)&&(Date.parse(fresh.updatedAt)>Date.parse(data.updatedAt)||data.feedUnavailable||lastRenderStale!==(Date.now()-Date.parse(fresh.updatedAt)>7200000))){data=fresh;renderDashboard();}
 }catch(error){data={...data,feedUnavailable:true};renderDashboard();}
 finally{clearTimeout(timer);refreshing=false;}
}
if(typeof setInterval==='function')setInterval(refreshFeed,300000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshFeed();});
})();
