// Çalıştır: node tests/arcade-gen.cjs — görsel oyun üreticilerini binlerce kez dener.
const assert = require("node:assert/strict");
const path = require("node:path");
for (const f of ["games.js", "arcade-gen.js"]) require(path.join(__dirname, "..", "assets", f));
const G = globalThis.MatArcadeGen;
let n = 0;
for (const topic of G.topics) for (const d of [1, 2, 3]) for (const wantNum of [false, true]) {
  let seed = 7 + d * 13 + topic.length;
  const rnd = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
  for (let i = 0; i < 300; i++) {
    const q = G.generate(topic, rnd, d, wantNum);
    n++;
    const where = `${topic}/${d}/${wantNum}/${i}: ${q.prompt}`;
    assert(q.prompt && q.svg, "Eksik soru " + where);
    assert(!/NaN|undefined|Infinity/.test(q.svg + q.prompt), "Bozuk çizim " + where);
    assert.equal(q.choices.length, new Set(q.choices).size, "Tekrarlı seçenek " + where);
    assert(q.choices.length >= 2 && q.choices.length <= 4, "Seçenek sayısı " + where);
    assert.equal(q.choices.filter(c => c === String(q.answer)).length, 1, "Cevap seçeneklerde bir kez olmalı " + where + " → " + q.answer + " / " + q.choices);
    if (wantNum) assert(q.numeric, "Sayısal soru istendi " + where);
    if (q.numeric) assert(Number.isSafeInteger(q.answer) && q.answer >= 0, "Cevap tam sayı olmalı " + where + " → " + q.answer);
  }
}
console.log(`OK: ${n} görsel oyun sorusu üretildi ve doğrulandı (${G.topics.length} konu).`);
