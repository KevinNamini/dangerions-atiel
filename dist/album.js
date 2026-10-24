/* A real, paginated collection. Artwork is decorative; readings come from the chronicle. */
'use strict';
window.createDangerionsAlbum=function({root,players,state,selected,n,esc,image,points,chart,change,periodLabel,onSelect,onInspect}){
  const size=4,count=Math.max(1,Math.ceil(players.length/size));
  let page=Math.max(0,Math.min(count-1,Number(state.albumPage)||0));
  let flipped=players.some(p=>p.name===state.albumFlipped)?state.albumFlipped:null;
  let start=null,suppressClick=false;
  const sign=v=>(v>0?'+':v<0?'−':'±')+n(Math.abs(v));
  const arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
  const turn='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 8a8 8 0 1 0 1 8M19 3v5h-5"/></svg>';
  const seal='<svg viewBox="0 0 80 88" aria-hidden="true"><circle cx="40" cy="43" r="28"/><path d="M40 3v15m-6-7 6-8 6 8M35 25h10l-2 43-3 10-3-10ZM25 24h30M37 18h6v7M11 31C2 49 14 70 32 75M69 31c9 18-3 39-21 44M11 45l-7-6M13 54l-8-3M17 63l-8-1M24 70l-8 2M69 45l7-6M67 54l8-3M63 63l8-1M56 70l8 2"/></svg>';
  function card(p,i){
    const name=esc(p.name),open=flipped===p.name,d=change(p),series=points.get(p.name)||[];
    const art=['Stecher','LordSanchez2'].includes(p.name)?`<span class="album-art album-duo" role="img" aria-label="${name} – Charakterillustration" style="--album-x:${p.name==='Stecher'?0:100}%"></span>`:image(p,'album-art');
    const date=iso=>new Date(iso).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',timeZone:'Europe/Berlin'});
    return `<article class="album-pocket ${open?'is-flipped':''}" data-album-name="${name}" style="--card-index:${i}" aria-label="Sammelkarte ${name}">
      <span class="album-pocket-seam" aria-hidden="true"></span><div class="album-lift"><div class="album-turn">
      <button class="album-face album-front" data-album-flip="${name}" aria-label="${name}: Karte wenden und Statistiken anzeigen" aria-expanded="${open}" aria-controls="album-back-${page*size+i}" ${open?'inert aria-hidden="true"':''}>
        ${art}<span class="album-art-shade"></span><span class="album-front-name">${name}</span><span class="album-foil" aria-hidden="true"></span><span class="album-frame" aria-hidden="true"></span>
      </button>
      <div class="album-face album-back" id="album-back-${page*size+i}" ${!open?'inert aria-hidden="true"':''}>
        <span class="album-frame" aria-hidden="true"></span><div class="album-back-content"><span class="album-seal">${seal}</span>
        <h4>${name}</h4><span class="album-class">${esc(p.className)} · ${p.level}</span>
        <strong class="album-value">${n(p.itemLevel)}</strong><span class="album-value-label">Item-Level</span>
        <button class="album-history" data-album-inspect="${name}" aria-label="Ausführlichen Verlauf von ${name} anzeigen"><span class="album-history-label"><span>${esc(periodLabel)}</span><strong>${d===null?'—':sign(d)}</strong></span>${chart(series)}<span class="album-dates">${series.length?`<span>${date(series[0].observedAt)}</span><span>${date(series.at(-1).observedAt)}</span>`:'<span>Kein Verlauf</span>'}</span></button>
        <div class="album-back-footer"><a class="album-profile" href="https://siel.tools/eu/atiel/${encodeURIComponent(p.name)}" target="_blank" rel="noopener noreferrer" aria-label="Profil von ${name} auf Siel öffnen">Profil öffnen ${arrow}</a>
        <button class="album-return" data-album-flip="${name}" aria-label="${name}: Porträt zeigen">${turn}</button></div>
        </div>
      </div></div></div><span class="album-sleeve" aria-hidden="true"></span>
    </article>`;
  }
  function draw(direction=0){
    state.albumPage=page;
    const visible=players.slice(page*size,(page+1)*size);
    if(!visible.some(p=>p.name===flipped)){flipped=null;state.albumFlipped=null;}
    root.className='legion-album';
    root.innerHTML=`<div class="album-book ${direction?'album-enter':''}" style="--page-direction:${direction||1}"><div class="album-spine" aria-hidden="true"></div><div class="album-grid">${visible.map(card).join('')}${Array.from({length:size-visible.length},()=>'<div class="album-pocket album-empty" aria-hidden="true"><span>♢</span><span class="album-sleeve"></span></div>').join('')}</div></div><div class="album-navigation"><button data-album-page="-1" aria-label="Vorherige Albumseite" ${page===0?'disabled':''}>${arrow}</button><span class="album-page-count" aria-live="polite" aria-atomic="true"><span class="sr-only">Albumseite </span>${page+1} <i>/</i> ${count}</span><button data-album-page="1" aria-label="Nächste Albumseite" ${page===count-1?'disabled':''}>${arrow}</button></div><p class="album-hint">Antippen zum Wenden</p>`;
    root.querySelectorAll('img.album-art').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;img.parentElement.classList.add('album-art-missing');},{once:true}));
  }
  function sync(name,focus=true){
    flipped=flipped===name?null:name;state.albumFlipped=flipped;
    if(flipped){selected=flipped;onSelect(flipped);}
    root.querySelectorAll('[data-album-name]').forEach(pocket=>{
      const open=pocket.dataset.albumName===flipped;
      pocket.classList.toggle('is-flipped',open);
      const front=pocket.querySelector('.album-front'),back=pocket.querySelector('.album-back');
      front.inert=open;back.inert=!open;
      front.setAttribute('aria-hidden',String(open));back.setAttribute('aria-hidden',String(!open));
      front.setAttribute('aria-expanded',String(open));
      if(focus&&pocket.dataset.albumName===name)(open?back.querySelector('[data-album-flip]'):front).focus({preventScroll:true});
    });
  }
  function changePage(direction,focus){
    const next=Math.max(0,Math.min(count-1,page+direction));
    if(page===next)return;
    page=next;flipped=null;state.albumFlipped=null;draw(direction);
    if(focus)root.querySelector('.album-front')?.focus({preventScroll:true});
  }
  root.onclick=e=>{
    if(suppressClick){suppressClick=false;e.preventDefault();return;}
    const flip=e.target.closest('[data-album-flip]'),nav=e.target.closest('[data-album-page]'),inspect=e.target.closest('[data-album-inspect]');
    if(flip)sync(flip.dataset.albumFlip);
    else if(nav)changePage(Number(nav.dataset.albumPage),true);
    else if(inspect){selected=inspect.dataset.albumInspect;onSelect(selected);onInspect();}
    else if(!e.target.closest('a,button')&&e.target.closest('.album-back'))sync(e.target.closest('[data-album-name]').dataset.albumName);
  };
  root.onkeydown=e=>{
    if(e.key==='Escape'&&flipped){e.preventDefault();sync(flipped);}
    if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();changePage(e.key==='ArrowRight'?1:-1,true);}
  };
  root.onpointerdown=e=>{suppressClick=false;if(e.pointerType==='touch')start={x:e.clientX,y:e.clientY};};
  root.onpointercancel=()=>{start=null;};
  root.onpointerup=e=>{
    if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;
    if(Math.abs(dx)>65&&Math.abs(dy)<40){suppressClick=true;changePage(dx<0?1:-1,false);}
  };
  draw();
};
