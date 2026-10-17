(function (root) {
  "use strict";
  const R=root.MatGroupRaceRules;
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const time=ms=>`${Math.floor(ms/60000)}:${String(Math.floor(ms/1000)%60).padStart(2,"0")}`;
  let host=null,ctx=null,timer=null,error="",draftConfig=null;
  const cache=new Map();
  const activePointers=new Set();
  const answerControls='[data-gr="choice"], [data-gr="key"], [data-gr="submit"]';
  const current=()=>ctx?.get();
  function save(){
    const race=current();
    if(race?.status==="running") {const now=Date.now();race.elapsedMs=R.elapsed(race,now);race.startedAt=now;}
    ctx.save(race);
  }
  function stop(){clearInterval(timer);timer=null;}
  function releasePointer(e){
    activePointers.delete(e.pointerId);
    try{if(host?.hasPointerCapture?.(e.pointerId))host.releasePointerCapture(e.pointerId);}catch(_){/* temas zaten sonlanmış olabilir */}
  }
  function clearPointers(){
    for(const pointerId of [...activePointers])releasePointer({pointerId});
  }
  function pause(){if(R.pause(current(),Date.now()))save();stop();}
  function question(index,side=0) {
    const race=current();
    if(!cache.has(index)) {
      const foundation=race.level==="foundation";
      cache.set(index,R.questionPair(race,index,{
        generate:rng=>foundation?root.MatFoundation.generate(race.topicId,rng,{repeatable:true}):root.MatLevelGen.generate(race.topicId,race.level,rng,{repeatable:true}),
        templateCount:foundation?root.MatFoundation.templates.length:root.MatLevelGen.templates?.(race.topicId,race.level)||1,
        makeRng:root.MatGames.makeRng
      }));
    }
    return cache.get(index)[side];
  }
  function availableLevels(topicId) {
    const items=ctx.levels();
    return root.MatFoundation?.has(topicId)?[...items,root.MatFoundation.LEVEL]:items;
  }
  function topicName(id){return ctx.topics().find(t=>t.id===id)?.title||id;}
  function levelName(id){return id==="foundation"?"Seviye 0":root.MatGames.LEVELS.find(l=>l.id===id)?.name||"";}
  function scene(html,side,index){
    // İki çizimdeki SVG clipPath/gradient kimlikleri birbirini etkilemesin.
    const prefix=`gr-${side}-${index}-`;
    return (html||"").replace(/\bid="([^"]+)"/g,(_,id)=>`id="${prefix}${id}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${prefix}${id})`).replace(/\bhref="#([^"]+)"/g,(_,id)=>`href="#${prefix}${id}"`);
  }
  function defaults(){return draftConfig||{topicId:ctx.topics().some(t=>t.id===ctx.initialTopic)?ctx.initialTopic:ctx.topics()[0].id,level:"1",count:"10",questionMode:"same",group0:ctx.groups()[0]?.id||"",group1:ctx.groups()[1]?.id||"",name0:"Mavi Takım",name1:"Mercan Takım"};}
  function capture(form) {return Object.fromEntries(["topicId","level","count","questionMode","group0","group1","name0","name1"].map(key=>[key,form.elements[key]?.value||""]));}
  function setup() {
    const config=defaults(),groups=ctx.groups();
    const items=availableLevels(config.topicId);
    if(!items.some(l=>String(l.id)===String(config.level)))config.level="1";
    return `<section class="gr-intro"><div><p class="gr-eyebrow">AYNI HEDEF · İKİ TAKIM</p><h1>Grup Yarışı <span aria-hidden="true">🏁</span></h1><p>Birlikte düşün. Önce bitir.</p></div><div class="gr-rules"><span><b>01</b> Aynı kalıp, eşit yarış</span><span><b>02</b> Yanlışta 10 sn ceza</span><span><b>03</b> İlk bitiren kazanır</span></div></section>
      <form class="gr-setup" data-gr-setup><section class="gr-settings"><p class="gr-eyebrow">ÖĞRETMEN MASASI</p><h2>Yarışı hazırla</h2>
        <label for="grTopic">Konu</label><select id="grTopic" name="topicId">${ctx.topics().map(t=>`<option value="${esc(t.id)}" ${t.id===config.topicId?"selected":""}>${esc(t.no)} · ${esc(t.title)}</option>`).join("")}</select>
        <div class="gr-setting-pair"><div><label for="grLevel">Seviye</label><select id="grLevel" name="level">${items.map(l=>`<option value="${l.id}" ${String(l.id)===String(config.level)?"selected":""}>${esc(l.name)}</option>`).join("")}</select></div><div><label for="grCount">Grup başına soru</label><input id="grCount" name="count" type="number" inputmode="numeric" min="1" max="100" step="1" required value="${esc(config.count)}"></div></div>
        <div class="gr-mode-row"><label for="grQuestionMode">Sorular</label><select id="grQuestionMode" name="questionMode" aria-describedby="grModeHelp"><option value="same" ${config.questionMode!=="different"?"selected":""}>Aynı sorular</option><option value="different" ${config.questionMode==="different"?"selected":""}>Farklı sorular</option></select></div>
        <p class="gr-note" id="grModeHelp">Farklı sorularda kalıp aynıdır, yalnız sayılar değişir.</p>
      </section><section class="gr-teams-setup"><div class="gr-team-inputs">${[0,1].map(side=>`<fieldset class="gr-team-config gr-side-${side}"><legend>${side===0?"MAVİ":"MERCAN"} KÖŞE</legend><span class="gr-team-symbol" aria-hidden="true">${side===0?"◆":"✳"}</span><label for="grGroup${side}">Sınıf grubu</label><select name="group${side}" id="grGroup${side}"><option value="">Özel takım adı</option>${groups.map(g=>`<option value="${esc(g.id)}" ${config["group"+side]===g.id?"selected":""}>${esc(g.icon)} ${esc(g.name)}</option>`).join("")}</select><label for="grName${side}">Takım adı</label><input id="grName${side}" name="name${side}" type="text" maxlength="40" value="${esc(config["name"+side])}" ${config["group"+side]?"disabled":"required"}></fieldset>`).join("")}</div>
      ${error?`<p class="gr-error" role="alert">${esc(error)}</p>`:""}<button class="gr-start" type="submit">Takımları sahaya al <span aria-hidden="true">→</span></button><p class="gr-note">Sınıf gruplarını seç veya iki takıma ad ver. Yarış sonucu bu maça aittir.</p></section></form>`;
  }
  function teamPanel(side) {
    const race=current(),team=race.teams[side],q=question(team.index,side),remaining=R.remaining(race,side,Date.now()),blocked=remaining>0||race.status!=="running";
    return `<section class="gr-lane gr-side-${side}" data-gr-lane="${side}" aria-label="${esc(team.name)} sorusu"><header class="gr-lane-head"><div><span class="gr-team-symbol" aria-hidden="true">${side===0?"◆":"✳"}</span><h2>${esc(team.name)}</h2></div><b>${team.index}<small> / ${race.count}</small></b></header>
      <div class="gr-progress" role="progressbar" aria-label="${esc(team.name)} ilerlemesi" aria-valuemin="0" aria-valuemax="${race.count}" aria-valuenow="${team.index}"><i style="width:${team.index/race.count*100}%"></i></div>
      <div class="gr-task"><p class="gr-question-no">SORU ${team.index+1} <span>${team.wrong} yanlış</span></p><h3>${esc(q.prompt)}</h3><div class="gr-scene stage art-stage">${scene(q.scene?.html,side,team.index)}</div></div>
      <div class="gr-answer-area" data-gr-controls="${side}" ${blocked?"inert":""}>
      ${q.kind==="mc"?`<div class="gr-options">${q.choices.map((c,i)=>`<button type="button" data-gr="choice" data-side="${side}" data-index="${team.index}" data-choice="${i}"><b>${String.fromCharCode(65+i)}</b><span>${esc(c)}</span></button>`).join("")}</div>`:
      `<form data-gr-answer="${side}" data-index="${team.index}"><label class="gr-answer-label" for="grAnswer${side}">Cevabın${q.unit?" ("+esc(q.unit)+")":""}</label><input id="grAnswer${side}" data-gr-input="${side}" inputmode="none" type="text" autocomplete="off" maxlength="16" value="${esc(team.draft)}" aria-label="${esc(team.name)} cevabı"><div class="gr-keypad">${[1,2,3,4,5,6,7,8,9,"Sil",0,"⌫"].map(key=>`<button type="button" data-gr="key" data-side="${side}" data-index="${team.index}" data-key="${key}" aria-label="${key==="⌫"?"Son rakamı sil":key}">${key}</button>`).join("")}</div><button class="gr-confirm" type="submit" data-gr="submit" data-side="${side}" data-index="${team.index}">Cevabı gönder ✓</button></form>`}</div>
      <div class="gr-penalty" data-gr-penalty="${side}" ${remaining?"":"hidden"} role="status"><span>Yanlış cevap · bekleme süresi</span><b data-gr-seconds="${side}">${Math.ceil(remaining/1000)}</b><span>Süre bitince aynı soruyla devam.</span></div></section>`;
  }
  function board() {
    const race=current(),running=race.status==="running";
    return `<header class="gr-match-head"><div><p class="gr-eyebrow">GRUP YARIŞI · ${esc(levelName(race.level))}</p><h1>${esc(topicName(race.topicId))}</h1></div><div class="gr-match-tools"><span class="gr-time" role="timer" aria-label="Geçen yarış süresi" data-gr-time>${time(R.elapsed(race,Date.now()))}</span><button class="soft" type="button" data-gr="${running?"pause":"resume"}">${running?"Ⅱ Duraklat":"▶ Devam et"}</button><button class="soft" type="button" data-act="fullscreen" aria-label="Tam ekran">⛶</button><button class="soft" type="button" data-gr="reset">Yeni yarış</button><button class="soft" type="button" data-act="goto-board">← Konular</button></div></header>
      <div class="gr-race-status"><span>🏁 Hedef: ${race.count} doğru cevap · ${race.questionMode==="different"?"Farklı sorular":"Aynı sorular"}</span><span>Yanlış cevap = 10 saniye ceza</span></div><div class="gr-arena">${teamPanel(0)}<div class="gr-vs" aria-hidden="true">VS</div>${teamPanel(1)}</div>
      ${!running?`<div class="gr-pause-panel" role="status"><b>${race.status==="ready"?"Takımlar hazır mı?":"Yarış duraklatıldı"}</b><p>${race.status==="ready"?"İki takım aynı anda başlayacak.":"İki takım kaldığı sorudan devam edecek."} Yarış saati ve ceza süreleri şu an bekliyor.</p><button class="gr-start" type="button" data-gr="resume">${race.status==="ready"?"Yarışı başlat":"Yarışa devam et"} →</button></div>`:""}`;
  }
  function result() {
    const race=current(),winner=race.teams[race.winner];
    return `<section class="gr-result gr-side-${race.winner}"><p class="gr-eyebrow">BİTİŞ ÇİZGİSİ GEÇİLDİ</p><div class="gr-result-trophy" aria-hidden="true">🏆</div><p class="gr-eyebrow">KAZANAN TAKIM</p><h1>${esc(winner.name)}</h1><p>${race.count} sorunun tamamını ilk bitiren takım!<br>${esc(topicName(race.topicId))} · ${esc(levelName(race.level))} · ${time(race.elapsedMs)}</p><div class="gr-result-teams">${race.teams.map((t,i)=>`<div class="gr-side-${i}"><b>${esc(t.name)} ${race.winner===i?"🏁":""}</b><strong>${t.index}<small> / ${race.count} doğru</small></strong><span>${t.wrong} yanlış · ${t.wrong*10} sn toplam ceza</span></div>`).join("")}</div><div class="actions"><button class="gr-start" type="button" data-gr="reset">Yeni yarış hazırla →</button><button class="soft" type="button" data-act="goto-board">Konulara dön</button></div></section>`;
  }
  function paint() {
    if(!host)return;
    const race=current();host.classList.add("group-race");
    document.body.classList.toggle("group-race-page",true);
    host.innerHTML=race?race.status==="finished"?result():board():setup();
    document.body.classList.toggle("group-race-active",!!race&&race.status!=="finished");
  }
  function tick() {
    if(!host?.isConnected){pause();return;}
    const race=current();if(race?.status!=="running")return;
    const clock=host.querySelector("[data-gr-time]");if(clock)clock.textContent=time(R.elapsed(race,Date.now()));
    for(let side=0;side<2;side++) {
      const ms=R.remaining(race,side,Date.now()),overlay=host.querySelector(`[data-gr-penalty="${side}"]`),controls=host.querySelector(`[data-gr-controls="${side}"]`);
      if(overlay)overlay.hidden=!ms;
      if(controls)controls.inert=ms>0;
      const text=host.querySelector(`[data-gr-seconds="${side}"]`);if(text)text.textContent=Math.ceil(ms/1000);
    }
  }
  function startClock(){stop();timer=setInterval(tick,100);}
  function send(side,index,value) {
    const race=current();if(!race||race.status!=="running"||race.teams[side]?.index!==index||R.remaining(race,side,Date.now()))return;
    const q=question(index,side);
    if(value===null||String(value).trim()==="")return;
    const correct=q.kind==="mc"?value===q.answer:/^\d+$/.test(String(value).trim())&&Number(value)===q.answer;
    const outcome=R.answer(race,side,index,correct,Date.now());
    if(outcome==="ignored")return;
    if(outcome==="wrong")root.MatAudio.wrong();else if(outcome==="won"){stop();root.MatAudio.fanfare();}else root.MatAudio.correct();
    save();
    // Only replace the answering lane: the other team's ongoing touch/typing is preserved.
    if(outcome==="won"){paint();return;}
    const lane=host.querySelector(`[data-gr-lane="${side}"]`);if(lane)lane.outerHTML=teamPanel(side);
    const activeIndices=race.teams.map(t=>t.index);for(const key of cache.keys())if(!activeIndices.includes(key))cache.delete(key);
  }
  function action(control) {
    const race=current(),act=control.dataset.gr;
    if(act==="pause"){pause();paint();return;}
    if(act==="resume"){if(R.resume(race,Date.now())){save();paint();startClock();}return;}
    if(act==="reset"){
      if(race&&race.status!=="finished"&&!root.confirm("Devam eden yarış sonlandırılıp yeni yarış hazırlansın mı?"))return;
      pause();ctx.save(null);cache.clear();error="";paint();return;
    }
    const side=Number(control.dataset.side),index=Number(control.dataset.index),team=race?.teams[side];
    if(race?.status!=="running"||!team||team.index!==index||R.remaining(race,side,Date.now()))return;
    if(act==="choice"){send(side,index,question(index,side).choices[Number(control.dataset.choice)]);return;}
    if(act==="submit"){send(side,index,team.draft);return;}
    if(act==="key") {
      const key=control.dataset.key;
      team.draft=key==="Sil"?"":key==="⌫"?team.draft.slice(0,-1):(team.draft+key).slice(0,16);
      const input=host.querySelector(`[data-gr-input="${side}"]`);if(input)input.value=team.draft;
    }
  }
  root.MatGroupRace={
    unmount(){pause();clearPointers();host=null;ctx=null;cache.clear();document.body.classList.remove("group-race-active","group-race-page");},
    mount(el,context){clearPointers();host=el;ctx=context;stop();cache.clear();error="";draftConfig=null;
      const race=current();if(race?.status==="running"){race.status="paused";race.startedAt=null;save();}
      paint();
      host.onchange=e=>{
        const form=e.target.closest("[data-gr-setup]");if(!form)return;
        draftConfig=capture(form);error="";
        if(/^group[01]$/.test(e.target.name)){
          const group=ctx.groups().find(g=>g.id===e.target.value);
          if(group)draftConfig['name'+e.target.name.slice(-1)]=group.name;
        }
        if(e.target.name==="topicId"||/^group[01]$/.test(e.target.name))paint();
      };
      host.oninput=e=>{
        if(!e.target.matches("[data-gr-input]"))return;
        const r=current(),side=Number(e.target.dataset.grInput);
        if(r?.status==="running"&&!R.remaining(r,side,Date.now()))r.teams[side].draft=e.target.value.replace(/\D/g,"").slice(0,16);
        e.target.value=r?.teams[side]?.draft||"";
      };
      host.onpointerdown=e=>{
        if(e.button>0||current()?.status!=="running")return;
        const control=e.target.closest(answerControls);
        if(!control||control.disabled)return;
        e.preventDefault();
        // isPrimary kontrolü yapılmaz: ikinci kişinin teması da bağımsız bir girdidir.
        if(Number.isFinite(e.pointerId)){
          if(activePointers.has(e.pointerId))return;
          activePointers.add(e.pointerId);
          // Kendi paneli yenilense bile parmak kalkışı sabit köke ulaşır.
          try{host.setPointerCapture?.(e.pointerId);}catch(_){/* fiziksel temas yoksa yakalama gerekmez */}
        }
        action(control);
      };
      host.onpointerup=releasePointer;
      host.onpointercancel=releasePointer;
      host.onlostpointercapture=e=>activePointers.delete(e.pointerId);
      host.oncontextmenu=e=>{if(e.target.closest(answerControls+', [data-gr-input]'))e.preventDefault();};
      host.onclick=e=>{
        const control=e.target.closest("[data-gr]");if(!control)return;
        // Oyun tuşları pointerdown'da işlendi. Burada yalnız klavye/erişilebilirlik
        // etkinleştirmeleri kalır; detail=0 üreten dokunmatik click de tekrar sayılmaz.
        if(["choice","key","submit"].includes(control.dataset.gr)&&(e.detail>0||e.pointerType||e.sourceCapabilities?.firesTouchEvents)){e.preventDefault();return;}
        e.preventDefault();action(control);
      };
      host.onsubmit=e=>{
        e.preventDefault();const form=e.target;
        if(form.matches("[data-gr-answer]")){send(Number(form.dataset.grAnswer),Number(form.dataset.index),current().teams[Number(form.dataset.grAnswer)].draft);return;}
        if(!form.matches("[data-gr-setup]")||!form.reportValidity())return;
        draftConfig=capture(form);const c=draftConfig;
        const level=c.level==="foundation"?c.level:Number(c.level);
        try {
          if(!ctx.topics().some(t=>t.id===c.topicId)||!availableLevels(c.topicId).some(l=>l.id===level))throw Error("Geçerli bir konu ve seviye seç.");
          const teams=[0,1].map(side=>{const g=ctx.groups().find(g=>g.id===c["group"+side]);return g?{id:g.id,name:g.name}:{name:c["name"+side]};});
          const created=R.create({topicId:c.topicId,level,count:Number(c.count),questionMode:c.questionMode||"same",teams});
          ctx.save(created);cache.clear();question(0);error="";paint();
        }catch(err){ctx.save(null);error=err.message;paint();}
      };
    }
  };
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&host&&current()?.status==="running"){pause();paint();}});
  root.addEventListener?.("pagehide",()=>{if(host)pause();});
})(window);
