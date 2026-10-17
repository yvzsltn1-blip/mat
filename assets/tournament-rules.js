(function (root) {
  "use strict";
  const levels = ["Keşif", "Alıştırma", "Problem", "Meydan okuma", "Özel zor", "Usta", "Efsane", "Prestij"];
  const bracketSize = n => n >= 2 ? 2 ** Math.floor(Math.log2(n)) : 0;
  const phaseName = key => key === "qualify" ? "İlk tur · Eleme" : ({2:"Final",4:"Yarı final",8:"Çeyrek final"}[key] || "Son " + key);
  function phases(n) {
    const cut = bracketSize(n), keys = n !== cut && cut ? ["qualify"] : [];
    for (let size = cut; size >= 2; size /= 2) keys.push(String(size));
    return keys;
  }
  function defaults(n, seconds = 30) {
    return Object.fromEntries(phases(n).map(key => [key, {
      seconds: key === "qualify" ? 20 : seconds,
      level: key === "qualify" ? 2 : Number(key) === 2 ? 5 : Number(key) <= 8 ? 4 : 3,
      format: key === "qualify" ? "choice" : "number"
    }]));
  }
  const createMatch = ids => ({ids, scores:[0,0], questions:0, overtime:false, winner:null});
  // Every completed question counts, including two wrong answers and timeouts.
  function recordQuestion(match, side) {
    if (match.winner) return match.winner;
    const correct = side === 0 || side === 1;
    match.questions++;
    if (correct) match.scores[side]++;
    if (match.overtime && correct || match.scores.some(score => score >= 2)) {
      match.winner = match.ids[match.scores[0] > match.scores[1] ? 0 : 1];
    } else if (match.questions >= 3) {
      if (match.scores[0] !== match.scores[1]) match.winner = match.ids[match.scores[0] > match.scores[1] ? 0 : 1];
      else match.overtime = true;
    }
    return match.winner;
  }
  function numericValue(value) {
    const s = String(value).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/,/g, ".");
    if (!/^[+-]?\d+(?:\.\d+)?(?:\/[+-]?\d+(?:\.\d+)?)?$/.test(s)) return null;
    const parts = s.split("/").map(Number), v = parts.length === 2 ? parts[0] / parts[1] : parts[0];
    return Number.isFinite(v) ? v : null;
  }
  function numericQuestion(q) {
    const answer = q.numericAnswer ?? (["num","slots"].includes(q.kind) ? q.answer : null);
    if (answer === null || numericValue(answer) === null) return null;
    return {...q, prompt:q.numericPrompt || q.prompt, kind:"num", answer, unit:q.unit || q.numericUnit || "", choices:undefined};
  }
  function fourChoices(q) {
    if (q.kind === "mc" && q.choices?.length === 4 && new Set(q.choices.map(String)).size === 4) {
      return {...q, answer:String(q.answer), choices:root.MatGames.shuffle(Math.random, q.choices.map(String))};
    }
    const numeric = numericQuestion(q);
    if (!numeric) return null;
    const answer = String(numeric.answer), value = numericValue(answer), choices = [answer];
    const offsets = root.MatGames.shuffle(Math.random, [1,-1,2,-2,3,-3,5,-5,10]);
    for (const delta of offsets) {
      const candidate = Number((value + delta).toFixed(6));
      if (value >= 0 && candidate < 0) continue;
      if (!choices.some(c => numericValue(c) === candidate)) choices.push(String(candidate).replace(".", ","));
      if (choices.length === 4) break;
    }
    return {...numeric, kind:"mc", answer, choices:root.MatGames.shuffle(Math.random, choices)};
  }
  // Two views of a question with its numbers and point names removed:
  // - family: template + wording, with polygon names also removed. Students in the elimination
  //   all get the same family, so they solve the same steps.
  // - shape: family + exact wording + figure. Shapes rotate inside a family, so the class sees
  //   different figures (pentagon, hexagon, octagon…) instead of the same one every time.
  const strip = x => String(x ?? "").replace(/\d+(?:[.,]\d+)?/g, "#").replace(/(^|[^\p{L}])\p{Lu}(?=$|[^\p{L}])/gu, "$1X");
  const POLYGON = /eşkenar üçgen|(?:düzgün )?# kenarlı çokgen|(?:düzgün )?(?:üç|dört|beş|altı|yedi|sekiz|dokuz|on)gen|kare/giu;
  const familyOf = q => [q.templateId, strip(q.prompt).replace(POLYGON, "N-gen")].join("|");
  const shapeOf = q => [q.templateId, q.prompt, q.scene?.html].map(strip).join("|");
  const seen = q => q.prompt + "|" + q.answer;
  function convert(q, format) {
    const converted = format === "choice" ? fourChoices(q) : numericQuestion(q);
    return converted && {...converted, family:familyOf(q), shape:shapeOf(q), seen:seen(q)};
  }
  // Elimination gives every student the same family of question. The family is chosen so
  // that it has enough different variants for the whole class without repeats.
  function pickShape(topic, level, format, need) {
    let best = null;
    for (let i = 0; i < 8; i++) {
      let base = null;
      for (let k = 0; k < 20 && !base; k++) base = convert(root.MatLevelGen.generate(topic, level), format);
      if (!base) break;
      const variants = new Set([base.seen]);
      for (let k = 0; k < 30 && variants.size < need; k++) {
        const q = root.MatLevelGen.generate(topic, level, undefined, {template:base.templateId});
        if (familyOf(q) === base.family) variants.add(seen(q));
      }
      if (!best || variants.size > best.variants) best = {template:base.templateId, family:base.family, variants:variants.size};
      if (variants.size >= need) break;
    }
    return best;
  }
  // lock: {template, family, asked:[seen…], uses:{shape: count}}
  function question(topic, level, format, lock) {
    const asked = new Set(lock?.asked || []), uses = lock?.uses || {};
    let best = null, fallback = null;
    for (let i = 0; i < 160; i++) {
      const q = convert(root.MatLevelGen.generate(topic, level, undefined, lock ? {template:lock.template} : undefined), format);
      if (!q) continue;
      if (!lock) return q;
      const fresh = !asked.has(q.seen);
      if (q.family === lock.family && fresh) {
        const used = uses[q.shape] || 0;
        if (!used) return q;
        if (!best || used < best.used) best = {q, used};
        if (i >= 60) break;
      }
      // Never fall back to a different kind of question; prefer new values over an exact repeat.
      else if (q.templateId === lock.template && (!fallback || fresh && !fallback.fresh)) fallback = {q, fresh};
    }
    if (best) return best.q;
    if (fallback) return fallback.q;
    throw new Error(`${levels[level-1]} seviyesinde ${format === "number" ? "sayı girişine" : "dört seçeneğe"} uygun soru bulunamadı. Turnuva ayarlarından seviyeyi değiştirin.`);
  }
  root.MatTournamentRules = {levels, bracketSize, phaseName, phases, defaults, createMatch, recordQuestion, numericValue, numericQuestion, fourChoices, question, pickShape, familyOf, shapeOf};
})(typeof window !== "undefined" ? window : globalThis);
