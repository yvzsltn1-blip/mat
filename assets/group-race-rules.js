// Yarış saati yalnız oyun çalışırken ilerler; cezalar da bu saate bağlıdır.
(function (root) {
  "use strict";
  // Aynı soruda art arda yanlışlar 10, 15, 20 sn bekletir; üçüncü yanlıştan sonra soru geçilir.
  const PENALTY_MS = 10000, PENALTY_STEP_MS = 5000, MAX_TRIES = 3, MAX_QUESTIONS = 100, MAX_MINUTES = 120;
  const penaltyFor = tries => PENALTY_MS + (Math.min(tries, MAX_TRIES) - 1) * PENALTY_STEP_MS;
  const elapsed = (race, now) => race.elapsedMs + (race.status === "running" ? Math.max(0, now - race.startedAt) : 0);
  const remaining = (race, side, now) => Math.max(0, race.teams[side].penaltyUntil - elapsed(race, now));
  function create({topicId, level, count, teams, questionMode = "same", levelPool = [], minutes = 0}, rng = Math.random) {
    if (!topicId || !Number.isInteger(count) || count < 1 || count > MAX_QUESTIONS) throw Error("Soru sayısı 1–100 arasında tam sayı olmalı.");
    if (!Array.isArray(teams) || teams.length !== 2 || teams.some(t => !String(t.name || "").trim())) throw Error("İki grubun adını da yaz.");
    if (teams[0].id && teams[0].id === teams[1].id || teams[0].name.trim().toLocaleLowerCase("tr") === teams[1].name.trim().toLocaleLowerCase("tr")) throw Error("İki farklı grup seç veya gruplara farklı adlar ver.");
    if (!["same","different"].includes(questionMode)) throw Error("Soru biçimini seç.");
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > MAX_MINUTES) throw Error("Süre 0–120 dakika arasında tam sayı olmalı.");
    if (level === "mixed" && !levelPool.length) throw Error("Karışık yarış için en az bir seviye gerekli.");
    return { version:3, topicId, level, count, questionMode, timeLimitMs:minutes*60000, status:"ready", elapsedMs:0, startedAt:null, winner:null, endReason:null,
      // Soru gövdeleri yerine tohumlar saklanır; uzun yarışlar da bulut belgesine sığar.
      seeds:Array.from({length:count},()=>1+Math.floor(rng()*2147483645)),
      ...(level === "mixed" ? {levels:mixedLevels(levelPool,count,rng)} : {}),
      teams:teams.map(t=>({id:t.id||null,name:t.name.trim().slice(0,40),index:0,correct:0,wrong:0,tries:0,skipped:0,penaltyMs:0,lastCorrectAt:0,finishedAt:null,penaltyUntil:0,penaltyNote:"",draft:""})) };
  }
  // Eski kayıtlarda soru sırası doğru sayısıyla aynıydı.
  function upgrade(race) {
    if (!race) return race;
    race.timeLimitMs ??= 0;race.endReason ??= null;
    for (const t of race.teams) {
      t.correct ??= t.index;t.tries ??= 0;t.skipped ??= 0;t.penaltyMs ??= t.wrong*PENALTY_MS;t.lastCorrectAt ??= 0;t.penaltyNote ??= "";
      // Önceki sürümde geçilen sorular hedefin ötesine taşabiliyordu.
      t.finishedAt ??= t.index>=race.count?Math.max(race.elapsedMs||0,t.penaltyUntil||0):null;
      if(t.index>race.count)t.index=race.count;
    }
    return race;
  }
  // Eski yarışların ek soruları da aynı tohumla yeniden üretilebilir.
  function seedAt(race, index) {
    if (race.seeds[index]) return race.seeds[index];
    let h = (race.seeds[0] ^ Math.imul(index + 1, 0x9E3779B1)) >>> 0;
    h = Math.imul(h ^ h >>> 16, 0x85EBCA6B) >>> 0;h = Math.imul(h ^ h >>> 13, 0xC2B2AE35) >>> 0;h = (h ^ h >>> 16) >>> 0;
    return 1 + h % 2147483645;
  }
  // Karışık yarışta her seviye sırayla bir kez çıkar, sonra karıştırılmış yeni tur başlar.
  // Seviye soru sırasına bağlıdır; iki takım aynı soruda aynı seviyeyi görür.
  function mixedLevels(pool, count, rng) {
    const out=[];
    while(out.length<count){
      const round=[...pool];
      for(let i=round.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[round[i],round[j]]=[round[j],round[i]];}
      out.push(...round);
    }
    return out.slice(0,count);
  }
  const levelAt = (race, index) => race.levels?.length ? race.levels[index % race.levels.length] : race.level;
  const timeLeft = (race, now) => race.timeLimitMs ? Math.max(0, race.timeLimitMs - elapsed(race, now)) : Infinity;
  const completed = (race, side, now) => race.teams[side].index>=race.count && race.teams[side].finishedAt!==null && race.teams[side].finishedAt<=elapsed(race,now);
  function finish(race, reason, at) {
    race.elapsedMs=at;race.startedAt=null;race.status="finished";race.endReason=reason;
    const [a,b]=race.teams,finishTime=t=>t.finishedAt!==null&&t.finishedAt<=at?t.finishedAt:at;
    race.winner=a.correct!==b.correct?(a.correct>b.correct?0:1):finishTime(a)!==finishTime(b)?(finishTime(a)<finishTime(b)?0:1):null;
    return true;
  }
  // Süre dolduğunda eksik kalan sınavlar da mutlaka sonuçlanır.
  function expire(race, now) {
    if (!race || !["running","paused"].includes(race.status) || timeLeft(race, now) > 0) return false;
    return finish(race,"time",race.timeLimitMs);
  }
  function settle(race, now) {
    if (!race || !["running","paused"].includes(race.status)) return false;
    const at=Math.max(...race.teams.map(t=>t.finishedAt??Infinity));
    if(race.teams.every((_,side)=>completed(race,side,now))&&(!race.timeLimitMs||at<=race.timeLimitMs))return finish(race,"questions",at);
    return expire(race,now);
  }
  const numericPattern = /[−-]?\d+(?:[.,]\d+)*/g;
  const textShape = text => String(text || "").replace(numericPattern,"#").replace(/\s+/g," ").trim();
  function givens(q) {
    // SVG konumları, renk kodları ve seçenekler sayısal verilen sayılmaz.
    const text = (q.scene?.html || "").replace(/<[^>]*>/g," ").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
    return q.prompt + " " + text;
  }
  const values = q => (givens(q).match(numericPattern) || []).join("|");
  function structure(q) {
    return JSON.stringify([q.templateId,q.kind,q.unit||"",textShape(givens(q)),(q.choices||[]).map(textShape).sort()]);
  }
  function questionPair(race,index,{generate,templateCount,makeRng}) {
    const seed=seedAt(race,index);
    if (race.questionMode !== "different") {const q=generate(makeRng(seed));return [q,q];}
    const count=Math.max(1,templateCount), firstSlot=Math.floor(makeRng(seed)()*count);
    // Aynı rastgele akışta tek bir seçimi değiştir. Diğer seçimler (işlem yönü,
    // harfler, bağlam, soru türü) korunur; bütün hesapları mevcut üretici yapar.
    // Sayısal çeşidi olmayan kalıp çıkarsa sıradaki kalıpta bir çift hazırlanır.
    for(let offset=0;offset<count;offset++) {
      const first=offset===0?null:((firstSlot+offset)%count+.5)/count;
      let draws=0;
      const stream=(mutation=-1,shift=0,record=false)=>{
        const rng=makeRng(seed);let n=0;
        return ()=>{const value=rng(),at=n++;if(record)draws=n;return at===0&&first!==null?first:at===mutation?(value+shift)%1:value;};
      };
      const base=generate(stream(-1,0,true)), baseValues=values(base);
      if(!baseValues)continue;
      const shape=structure(base);
      for(let draw=1;draw<Math.min(draws,40);draw++)for(const shift of [.38196601125,.61803398875]) {
        let other;
        try {other=generate(stream(draw,shift));}catch(_){continue;}
        if(structure(other)===shape && values(other)!==baseValues)return [base,other];
      }
    }
    throw Error("Bu konu ve seviyede sayıları farklı bir soru çifti üretilemedi. Başka seviye veya Aynı sorular seç.");
  }
  function resume(race, now) {
    if (!race || settle(race,now) || !["ready","paused"].includes(race.status)) return false;
    race.status="running";race.startedAt=now;return true;
  }
  function pause(race, now) {
    if (race?.status !== "running") return false;
    if (settle(race,now)) return true;
    race.elapsedMs=elapsed(race,now);race.startedAt=null;race.status="paused";return true;
  }
  function answer(race, side, index, correct, now) {
    if (settle(race, now)) return race.endReason==="time"?"timeup":"finished";
    if (race.status !== "running" || ![0,1].includes(side) || race.winner !== null) return "ignored";
    const team=race.teams[side];
    if (index !== team.index || team.index>=race.count || remaining(race,side,now)>0) return "ignored";
    team.draft="";
    const at=elapsed(race,now);
    if (!correct) {
      team.wrong++;team.tries++;
      const wait=penaltyFor(team.tries);
      team.penaltyMs+=wait;team.penaltyUntil=at+wait;team.penaltyNote="retry";
      if (team.tries < MAX_TRIES) return "wrong";
      team.index++;team.tries=0;team.skipped++;team.penaltyNote="skip";
      if(team.index===race.count)team.finishedAt=at+wait;
      return "skipped";
    }
    team.index++;team.correct++;team.tries=0;team.lastCorrectAt=at;team.penaltyUntil=0;team.penaltyNote="";
    if(team.index===race.count)team.finishedAt=at;
    if(settle(race,now))return "finished";
    return team.index===race.count?"completed":"correct";
  }
  root.MatGroupRaceRules={PENALTY_MS,PENALTY_STEP_MS,MAX_TRIES,MAX_QUESTIONS,MAX_MINUTES,penaltyFor,create,upgrade,resume,pause,answer,expire,settle,completed,elapsed,remaining,timeLeft,questionPair,levelAt,seedAt};
})(typeof window !== "undefined" ? window : globalThis);
