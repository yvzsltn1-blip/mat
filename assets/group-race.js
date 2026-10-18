(function (root) {
  "use strict";
  const R=root.MatGroupRaceRules;
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const time=ms=>`${Math.floor(ms/60000)}:${String(Math.floor(ms/1000)%60).padStart(2,"0")}`;
  const finishTime=ms=>`${time(ms)},${String(Math.floor(ms%1000)).padStart(3,"0")}`;
  let host=null,ctx=null,timer=null,error="",draftConfig=null;
  const cache=new Map();
  const activePointers=new Set();
  const answerControls='[data-gr="choice"], [data-gr="key"], [data-gr="submit"]';
  const current=()=>ctx?.get();
  const MINUTES=[0,3,5,7,10,15,20,30,45,60];
  // Süreli yarışta saat geri sayar.
  const clock=(race,now)=>race.timeLimitMs?time(R.timeLeft(race,now)+999):time(R.elapsed(race,now));
  const penaltyText=team=>team.penaltyNote==="skip"?(team.index>=current().count?"Ceza bitince sorular tamamlanacak.":"3. yanlış: süre bitince yeni soruya geçilir."):`Süre bitince aynı soruyla devam. Kalan hak: ${R.MAX_TRIES-team.tries}`;
  function sound(name){try{root.MatAudio?.[name]?.();}catch(_){/* Ses aygıtı hatası yarış akışını durdurmamalı. */}}
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
  function showResult(){stop();clearPointers();paint();save();sound("fanfare");}
  function checkEnd(){if(!R.settle(current(),Date.now()))return false;showResult();return true;}
  function question(index,side=0) {
    const race=current();
    if(!cache.has(index)) {
      const pair=level=>{
        const foundation=level==="foundation";
        const qs=R.questionPair(race,index,{
          generate:rng=>foundation?root.MatFoundation.generate(race.topicId,rng,{repeatable:true}):root.MatLevelGen.generate(race.topicId,level,rng,{repeatable:true}),
          templateCount:foundation?root.MatFoundation.templates.length:root.MatLevelGen.templates?.(race.topicId,level)||1,
          makeRng:root.MatGames.makeRng
        });
        return qs.map(q=>({...q,raceLevel:level}));
      };
      const planned=R.levelAt(race,index);
      if(!race.levels)cache.set(index,pair(planned));
      else {
        // Farklı sayılı çift kurulamayan seviye olursa sıradaki seviyeye geçilir; iki takım yine aynı seviyeyi alır.
        const pool=[...new Set(race.levels)],start=Math.max(0,pool.indexOf(planned));
        let lastError;
        for(let i=0;i<pool.length&&!cache.has(index);i++){try{cache.set(index,pair(pool[(start+i)%pool.length]));}catch(err){lastError=err;}}
        if(!cache.has(index))throw lastError;
      }
    }
    return cache.get(index)[side];
  }
  function availableLevels(topicId) {
    const items=ctx.levels();
    return root.MatFoundation?.has(topicId)?[...items,root.MatFoundation.LEVEL]:items;
  }
  function topicName(id){return ctx.topics().find(t=>t.id===id)?.title||id;}
  function levelName(id){return id==="mixed"?"Karışık":id==="foundation"?"Seviye 0":root.MatGames.LEVELS.find(l=>l.id===id)?.name||"";}
  function scene(html,side,index){
    // İki çizimdeki SVG clipPath/gradient kimlikleri birbirini etkilemesin.
    const prefix=`gr-${side}-${index}-`;
    return (html||"").replace(/\bid="([^"]+)"/g,(_,id)=>`id="${prefix}${id}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${prefix}${id})`).replace(/\bhref="#([^"]+)"/g,(_,id)=>`href="#${prefix}${id}"`);
  }
  function defaults(){return draftConfig||{topicId:ctx.topics().some(t=>t.id===ctx.initialTopic)?ctx.initialTopic:ctx.topics()[0].id,level:"mixed",mixLevels:null,count:"10",minutes:"10",questionMode:"same",group0:ctx.groups()[0]?.id||"",group1:ctx.groups()[1]?.id||"",name0:"Mavi Takım",name1:"Mercan Takım"};}
  function capture(form) {
    const config=Object.fromEntries(["topicId","level","count","minutes","questionMode","group0","group1","name0","name1"].map(key=>[key,form.elements[key]?.value||""]));
    // Seviye kutuları yalnız Karışık seçiliyken görünür; gizliyken önceki seçim korunur.
    const boxes=form.querySelectorAll?.('[name="mixLevel"]');
    config.mixLevels=boxes?.length?[...boxes].filter(b=>b.checked).map(b=>b.value):draftConfig?.mixLevels??null;
    return config;
  }
  // Karışık havuz: öğretmenin işaretlediği seviyeler; seçim yapılmadıysa hepsi.
  const mixPool=config=>ctx.levels().filter(l=>!config.mixLevels||config.mixLevels.includes(String(l.id))).map(l=>l.id);
  function setup() {
    const config=defaults(),groups=ctx.groups();
    const items=availableLevels(config.topicId);
    if(config.level!=="mixed"&&!items.some(l=>String(l.id)===String(config.level)))config.level="mixed";
    return `<section class="gr-intro"><div><p class="gr-eyebrow">AYNI SINAV · İKİ TAKIM</p><h1>Grup Yarışı <span aria-hidden="true">🏁</span></h1><p>Birlikte düşün. Doğruyu bul.</p></div><div class="gr-rules"><span><b>01</b> Aynı kalıp, eşit yarış</span><span><b>02</b> Yanlışta 10 · 15 · 20 sn</span><span><b>03</b> Çok doğru, eşitlikte hızlı bitiriş</span></div></section>
      <form class="gr-setup" data-gr-setup><section class="gr-settings"><p class="gr-eyebrow">ÖĞRETMEN MASASI</p><h2>Yarışı hazırla</h2>
        <label for="grTopic">Konu</label><select id="grTopic" name="topicId">${ctx.topics().map(t=>`<option value="${esc(t.id)}" ${t.id===config.topicId?"selected":""}>${esc(t.no)} · ${esc(t.title)}</option>`).join("")}</select>
        <div class="gr-setting-pair"><div><label for="grLevel">Seviye</label><select id="grLevel" name="level"><option value="mixed" ${config.level==="mixed"?"selected":""}>Karışık</option>${items.map(l=>`<option value="${l.id}" ${String(l.id)===String(config.level)?"selected":""}>${esc(l.name)}</option>`).join("")}</select></div><div><label for="grCount">Grup başına soru</label><input id="grCount" name="count" type="number" inputmode="numeric" min="1" max="100" step="1" required value="${esc(config.count)}"></div></div>
        ${config.level==="mixed"?`<fieldset class="gr-mix-levels"><legend>Karışık yarışta gelecek seviyeler</legend>${ctx.levels().map(l=>`<label><input type="checkbox" name="mixLevel" value="${l.id}" ${mixPool(config).includes(l.id)?"checked":""}><span>${esc(l.name)}</span></label>`).join("")}</fieldset>`:""}
        <div class="gr-setting-pair"><div><label for="grMinutes">Yarış süresi</label><select id="grMinutes" name="minutes">${MINUTES.map(m=>`<option value="${m}" ${String(m)===String(config.minutes)?"selected":""}>${m?m+" dakika":"Süresiz"}</option>`).join("")}</select></div><div><label for="grQuestionMode">Sorular</label><select id="grQuestionMode" name="questionMode" aria-describedby="grModeHelp"><option value="same" ${config.questionMode!=="different"?"selected":""}>Aynı sorular</option><option value="different" ${config.questionMode==="different"?"selected":""}>Farklı sorular</option></select></div></div>
        <p class="gr-note" id="grModeHelp">Her takım seçilen sayıda soru çözer; üç yanlışta soru geçilir. İki takım da bitirince veya süre dolunca çok doğru yapan kazanır. Doğrular eşitse sorularını daha hızlı bitiren kazanır; bitirme süreleri de eşitse sonuç beraberedir. Farklı sorularda kalıp aynıdır, yalnız sayılar değişir.</p>
      </section><section class="gr-teams-setup"><div class="gr-team-inputs">${[0,1].map(side=>`<fieldset class="gr-team-config gr-side-${side}"><legend>${side===0?"MAVİ":"MERCAN"} KÖŞE</legend><span class="gr-team-symbol" aria-hidden="true">${side===0?"◆":"✳"}</span><label for="grGroup${side}">Sınıf grubu</label><select name="group${side}" id="grGroup${side}"><option value="">Özel takım adı</option>${groups.map(g=>`<option value="${esc(g.id)}" ${config["group"+side]===g.id?"selected":""}>${esc(g.icon)} ${esc(g.name)}</option>`).join("")}</select><label for="grName${side}">Takım adı</label><input id="grName${side}" name="name${side}" type="text" maxlength="40" value="${esc(config["name"+side])}" ${config["group"+side]?"disabled":"required"}></fieldset>`).join("")}</div>
      ${error?`<p class="gr-error" role="alert">${esc(error)}</p>`:""}<button class="gr-start" type="submit">Takımları sahaya al <span aria-hidden="true">→</span></button><p class="gr-note">Sınıf gruplarını seç veya iki takıma ad ver. Yarış sonucu bu maça aittir.</p></section></form>`;
  }
  function teamPanel(side) {
    const race=current(),team=race.teams[side],done=team.index>=race.count,q=done?null:question(team.index,side),remaining=R.remaining(race,side,Date.now()),blocked=remaining>0||race.status!=="running";
    return `<section class="gr-lane gr-side-${side}" data-gr-lane="${side}" data-gr-finished="${done&&!remaining}" aria-label="${esc(team.name)} sorusu"><header class="gr-lane-head"><div><span class="gr-team-symbol" aria-hidden="true">${side===0?"◆":"✳"}</span><h2>${esc(team.name)}</h2></div><b>${team.correct}<small> / ${race.count} doğru</small></b></header>
      <div class="gr-progress" role="progressbar" aria-label="${esc(team.name)} soru ilerlemesi" aria-valuemin="0" aria-valuemax="${race.count}" aria-valuenow="${team.index}"><i style="width:${team.index/race.count*100}%"></i></div>
      ${done?`<div class="gr-task gr-team-done" role="status"><p class="gr-question-no">${race.count} / ${race.count} SORU</p><h3>${remaining?"Son sorunun cezası bekleniyor":"Sorular tamamlandı ✓"}</h3><p>${remaining?"Ceza süresi bitirme süresine dahildir.":`Bitirme süresi: <b>${finishTime(team.finishedAt)}</b><br>Diğer takımın bitirmesi veya yarış süresinin dolması bekleniyor.`}</p></div>`:`<div class="gr-task"><p class="gr-question-no">SORU ${team.index+1} / ${race.count}${race.levels?` · ${esc(levelName(q.raceLevel))}`:""} <span>${team.tries?`${R.MAX_TRIES-team.tries} hak kaldı · `:""}${team.wrong} yanlış</span></p><h3>${esc(q.prompt)}</h3><div class="gr-scene stage art-stage">${scene(q.scene?.html,side,team.index)}</div></div>
      <div class="gr-answer-area" data-gr-controls="${side}" ${blocked?"inert":""}>
      ${q.kind==="mc"?`<div class="gr-options">${q.choices.map((c,i)=>`<button type="button" data-gr="choice" data-side="${side}" data-index="${team.index}" data-choice="${i}"><b>${String.fromCharCode(65+i)}</b><span>${esc(c)}</span></button>`).join("")}</div>`:
      `<form data-gr-answer="${side}" data-index="${team.index}"><label class="gr-answer-label" for="grAnswer${side}">Cevabın${q.unit?" ("+esc(q.unit)+")":""}</label><input id="grAnswer${side}" data-gr-input="${side}" inputmode="none" type="text" autocomplete="off" maxlength="16" value="${esc(team.draft)}" aria-label="${esc(team.name)} cevabı"><div class="gr-keypad">${[1,2,3,4,5,6,7,8,9,"Sil",0,"⌫"].map(key=>`<button type="button" data-gr="key" data-side="${side}" data-index="${team.index}" data-key="${key}" aria-label="${key==="⌫"?"Son rakamı sil":key}">${key}</button>`).join("")}</div><button class="gr-confirm" type="submit" data-gr="submit" data-side="${side}" data-index="${team.index}">Cevabı gönder ✓</button></form>`}</div>`}
      <div class="gr-penalty" data-gr-penalty="${side}" ${remaining?"":"hidden"} role="status"><span>Yanlış cevap · bekleme süresi</span><b data-gr-seconds="${side}">${Math.ceil(remaining/1000)}</b><span>${penaltyText(team)}</span></div></section>`;
  }
  function board() {
    const race=current(),running=race.status==="running";
    return `<header class="gr-match-head"><div><p class="gr-eyebrow">GRUP YARIŞI · ${esc(levelName(race.level))}</p><h1>${esc(topicName(race.topicId))}</h1></div><div class="gr-match-tools"><span class="gr-time${race.timeLimitMs?" is-countdown":""}" role="timer" aria-label="${race.timeLimitMs?"Kalan yarış süresi":"Geçen yarış süresi"}" data-gr-time>${clock(race,Date.now())}</span><div class="gr-match-actions"><button class="soft" type="button" data-gr="${running?"pause":"resume"}">${running?"Ⅱ Duraklat":"▶ Devam et"}</button><button class="soft" type="button" data-act="fullscreen" aria-label="Tam ekran">⛶</button><button class="soft" type="button" data-gr="reset">Yeni yarış</button><button class="soft" type="button" data-act="goto-board">← Konular</button></div></div></header>
      <div class="gr-race-status"><span>🏁 Takım başına ${race.count} soru · ${race.timeLimitMs?race.timeLimitMs/60000+" dk":"Süresiz"} · ${race.questionMode==="different"?"Farklı sorular":"Aynı sorular"}</span><span>Çok doğru kazanır · Eşitlikte hızlı bitiren · Yanlış: 10 → 15 → 20 sn</span></div><div class="gr-arena">${teamPanel(0)}<div class="gr-vs" aria-hidden="true">VS</div>${teamPanel(1)}</div>
      ${!running?`<div class="gr-pause-panel" role="status"><b>${race.status==="ready"?"Takımlar hazır mı?":"Yarış duraklatıldı"}</b><p>${race.status==="ready"?"İki takım aynı anda başlayacak.":"İki takım kaldığı sorudan devam edecek."} Yarış saati ve ceza süreleri şu an bekliyor.</p><button class="gr-start" type="button" data-gr="resume">${race.status==="ready"?"Yarışı başlat":"Yarışa devam et"} →</button></div>`:""}`;
  }
  function result() {
    const race=current(),winner=race.teams[race.winner],byTime=race.endReason==="time",tie=race.teams[0].correct===race.teams[1].correct;
    const reason=race.endReason==="target"?`${race.count} doğruyu ilk tamamlayan takım!`:!winner?(byTime&&!race.teams.some((_,i)=>R.completed(race,i,Date.now()))?"İki takım da sorularını tamamlayamadı; doğru sayıları eşit olduğu için sonuç berabere.":"Doğru sayıları ve bitirme süreleri eşit; sonuç berabere."):tie?"Doğru sayıları eşit; sorularını daha hızlı bitiren takım kazandı.":"En çok doğru yapan takım kazandı.";
    const noCorrect=race.teams.every(t=>t.correct===0)?"İki takım da doğru cevap veremedi. ":"";
    return `<section class="gr-result ${winner?"gr-side-"+race.winner:"gr-draw"}" role="status"><p class="gr-eyebrow">${byTime?"SÜRE DOLDU":"SORULAR TAMAMLANDI"}</p><div class="gr-result-trophy" aria-hidden="true">${winner?"🏆":"🤝"}</div><p class="gr-eyebrow">${winner?"KAZANAN TAKIM":"SONUÇ"}</p><h1>${winner?esc(winner.name):"Berabere"}</h1><p>${noCorrect}${reason}<br>${esc(topicName(race.topicId))} · ${esc(levelName(race.level))} · ${time(race.elapsedMs)}</p><div class="gr-result-teams">${race.teams.map((t,i)=>`<div class="gr-side-${i}"><b>${esc(t.name)} ${race.winner===i?"🏁":""}</b><strong>${t.correct}<small> / ${race.count} doğru</small></strong><span>${t.wrong} yanlış · ${t.skipped} soru geçildi · ${Math.round(t.penaltyMs/1000)} sn ceza</span><span>${R.completed(race,i,Date.now())?`Bitirme süresi: ${finishTime(t.finishedAt)}`:`Sorular tamamlanmadı · ${t.index} / ${race.count} soru işlendi`}</span></div>`).join("")}</div><div class="actions"><button class="gr-start" type="button" data-gr="reset">Yeni yarış hazırla →</button><button class="soft" type="button" data-act="goto-board">Konulara dön</button></div></section>`;
  }
  function paint() {
    if(!host)return;
    const race=current();host.classList.add("group-race");
    document.body.classList.toggle("group-race-page",true);
    host.innerHTML=race?race.status==="finished"?result():board():setup();
    document.body.classList.toggle("group-race-active",!!race&&race.status!=="finished");
    fit();refit();
  }
  function tick() {
    if(!host?.isConnected){pause();return;}
    const race=current();if(race?.status!=="running")return;
    if(checkEnd())return;
    const timer=host.querySelector("[data-gr-time]");
    if(timer){timer.textContent=clock(race,Date.now());timer.classList?.toggle("is-low",R.timeLeft(race,Date.now())<=30000);}
    for(let side=0;side<2;side++) {
      const ms=R.remaining(race,side,Date.now()),overlay=host.querySelector(`[data-gr-penalty="${side}"]`),controls=host.querySelector(`[data-gr-controls="${side}"]`);
      if(overlay)overlay.hidden=!ms;
      if(controls)controls.inert=ms>0;
      const text=host.querySelector(`[data-gr-seconds="${side}"]`);if(text)text.textContent=Math.ceil(ms/1000);
      const lane=host.querySelector(`[data-gr-lane="${side}"]`);
      if(race.teams[side].index>=race.count&&!ms&&lane?.dataset?.grFinished==="false"){lane.outerHTML=teamPanel(side);fit();}
    }
  }
  // Tam ekran tahtada iki şeridi birlikte, taşmadan sığan en büyük ölçeğe getirir.
  function fit() {
    const arena=host?.querySelector?.(".gr-arena");if(!arena||!root.getComputedStyle)return;
    // Stil, yazı tipi veya pencere boyu geç oturursa ölçek yeniden hesaplanır.
    if(fitObserver&&observedArena!==arena){fitObserver.disconnect();fitObserver.observe(arena);observedArena=arena;}
    const css=root.getComputedStyle(arena),on=css.getPropertyValue("--gr-fit").trim()==="1";
    arena.classList.toggle("gr-fitted",on);
    const lanes=[...arena.querySelectorAll(".gr-lane")],size=px=>lanes.forEach(lane=>lane.style.fontSize=px?px+"px":"");
    if(!on){size(0);return;}
    const fits=()=>lanes.every(lane=>{const task=lane.querySelector(".gr-task");return lane.scrollHeight<=lane.clientHeight+1&&(!task||task.scrollHeight<=task.clientHeight+1);});
    // Ölçek 15 piksellik taban yazı boyuna göredir.
    let lo=8,hi=15*(Number(css.getPropertyValue("--gr-s-max"))||1.6);
    size(hi);
    if(!fits())for(let i=0;i<8;i++){const mid=(lo+hi)/2;size(mid);if(fits())lo=mid;else hi=mid;}
    else lo=hi;
    size(Math.floor(lo*10)/10);
  }
  let fitFrame=0,observedArena=null;
  const fitObserver=root.ResizeObserver?new root.ResizeObserver(()=>refit()):null;
  function refit(){if(!root.requestAnimationFrame)return;root.cancelAnimationFrame(fitFrame);fitFrame=root.requestAnimationFrame(fit);}
  function startClock(){stop();timer=setInterval(tick,100);}
  function send(side,index,value) {
    if(checkEnd())return;
    const race=current();if(!race||race.status!=="running"||race.teams[side]?.index!==index||index>=race.count||R.remaining(race,side,Date.now()))return;
    const q=question(index,side);
    if(value===null||String(value).trim()==="")return;
    const correct=q.kind==="mc"?value===q.answer:/^\d+$/.test(String(value).trim())&&Number(value)===q.answer;
    const outcome=R.answer(race,side,index,correct,Date.now());
    if(outcome==="ignored")return;
    if(race.status==="finished"){showResult();return;}
    save();
    // Only replace the answering lane: the other team's ongoing touch/typing is preserved.
    const lane=host.querySelector(`[data-gr-lane="${side}"]`);if(lane){lane.outerHTML=teamPanel(side);fit();}
    sound(outcome==="wrong"||outcome==="skipped"?"wrong":"correct");
    const activeIndices=race.teams.map(t=>t.index);for(const key of cache.keys())if(!activeIndices.includes(key))cache.delete(key);
  }
  function action(control) {
    const race=current(),act=control.dataset.gr;
    if(checkEnd())return;
    if(act==="pause"){pause();paint();return;}
    if(act==="resume"){if(R.resume(race,Date.now())){save();paint();startClock();}return;}
    if(act==="reset"){
      if(race&&race.status!=="finished"&&!root.confirm("Devam eden yarış sonlandırılıp yeni yarış hazırlansın mı?"))return;
      pause();ctx.save(null);cache.clear();error="";paint();return;
    }
    const side=Number(control.dataset.side),index=Number(control.dataset.index),team=race?.teams[side];
    if(race?.status!=="running"||!team||team.index!==index||team.index>=race.count||R.remaining(race,side,Date.now()))return;
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
      const race=R.upgrade(current());if(race?.status==="running"){race.status="paused";race.startedAt=null;save();}
      if(R.settle(race,Date.now()))save();
      paint();
      host.onchange=e=>{
        const form=e.target.closest("[data-gr-setup]");if(!form)return;
        draftConfig=capture(form);error="";
        if(/^group[01]$/.test(e.target.name)){
          const group=ctx.groups().find(g=>g.id===e.target.value);
          if(group)draftConfig['name'+e.target.name.slice(-1)]=group.name;
        }
        if(["topicId","level"].includes(e.target.name)||/^group[01]$/.test(e.target.name))paint();
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
        const level=["foundation","mixed"].includes(c.level)?c.level:Number(c.level);
        const levelPool=mixPool(c);
        if(level==="mixed"&&!levelPool.length){error="Karışık yarış için en az bir seviye işaretle.";paint();return;}
        try {
          if(!ctx.topics().some(t=>t.id===c.topicId)||level!=="mixed"&&!availableLevels(c.topicId).some(l=>l.id===level))throw Error("Geçerli bir konu ve seviye seç.");
          const teams=[0,1].map(side=>{const g=ctx.groups().find(g=>g.id===c["group"+side]);return g?{id:g.id,name:g.name}:{name:c["name"+side]};});
          const created=R.create({topicId:c.topicId,level,count:Number(c.count),questionMode:c.questionMode||"same",teams,levelPool,minutes:Number(c.minutes||0)});
          ctx.save(created);cache.clear();question(0);error="";paint();
        }catch(err){ctx.save(null);error=err.message;paint();}
      };
    }
  };
  root.addEventListener?.("resize",()=>{if(host)refit();});
  document.addEventListener("fullscreenchange",()=>{if(host)refit();});
  document.fonts?.ready.then(()=>{if(host)refit();});
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&host&&current()?.status==="running"){pause();paint();}});
  root.addEventListener?.("pagehide",()=>{if(host)pause();});
})(window);
