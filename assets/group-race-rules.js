// Yarış saati yalnız oyun çalışırken ilerler; cezalar da bu saate bağlıdır.
(function (root) {
  "use strict";
  const PENALTY_MS = 10000, MAX_QUESTIONS = 100;
  const elapsed = (race, now) => race.elapsedMs + (race.status === "running" ? Math.max(0, now - race.startedAt) : 0);
  const remaining = (race, side, now) => Math.max(0, race.teams[side].penaltyUntil - elapsed(race, now));
  function create({topicId, level, count, teams, questionMode = "same"}, rng = Math.random) {
    if (!topicId || !Number.isInteger(count) || count < 1 || count > MAX_QUESTIONS) throw Error("Soru sayısı 1–100 arasında tam sayı olmalı.");
    if (!Array.isArray(teams) || teams.length !== 2 || teams.some(t => !String(t.name || "").trim())) throw Error("İki grubun adını da yaz.");
    if (teams[0].id && teams[0].id === teams[1].id || teams[0].name.trim().toLocaleLowerCase("tr") === teams[1].name.trim().toLocaleLowerCase("tr")) throw Error("İki farklı grup seç veya gruplara farklı adlar ver.");
    if (!["same","different"].includes(questionMode)) throw Error("Soru biçimini seç.");
    return { version:1, topicId, level, count, questionMode, status:"ready", elapsedMs:0, startedAt:null, winner:null,
      // Soru gövdeleri yerine tohumlar saklanır; uzun yarışlar da bulut belgesine sığar.
      seeds:Array.from({length:count},()=>1+Math.floor(rng()*2147483645)),
      teams:teams.map(t=>({id:t.id||null,name:t.name.trim().slice(0,40),index:0,wrong:0,penaltyUntil:0,draft:""})) };
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
    const seed=race.seeds[index];
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
    if (!["ready","paused"].includes(race.status)) return false;
    race.status="running";race.startedAt=now;return true;
  }
  function pause(race, now) {
    if (race?.status !== "running") return false;
    race.elapsedMs=elapsed(race,now);race.startedAt=null;race.status="paused";return true;
  }
  function answer(race, side, index, correct, now) {
    if (race.status !== "running" || ![0,1].includes(side) || race.winner !== null) return "ignored";
    const team=race.teams[side];
    if (index !== team.index || remaining(race,side,now)>0) return "ignored";
    team.draft="";
    if (!correct) {team.wrong++;team.penaltyUntil=elapsed(race,now)+PENALTY_MS;return "wrong";}
    team.index++;team.penaltyUntil=0;
    if (team.index === race.count) {
      race.elapsedMs=elapsed(race,now);race.startedAt=null;race.status="finished";race.winner=side;return "won";
    }
    return "correct";
  }
  root.MatGroupRaceRules={PENALTY_MS,MAX_QUESTIONS,create,resume,pause,answer,elapsed,remaining,questionPair};
})(typeof window !== "undefined" ? window : globalThis);
