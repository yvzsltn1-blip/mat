// Çalıştır: node tests/level-gen.cjs
// Sınırsız seviye üreticisinin her konu ve seviyede geçerli, görselli ve çeşitli soru ürettiğini denetler.
const assert = require("node:assert/strict");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
for (const file of ["curriculum.js", "games.js", "arcade-gen.js", "level-gen.js"]) require(path.join(root, "assets", file));

const ROUNDS = Number(process.env.ROUNDS || 300);
let total = 0;
for (const topic of MatCurriculum.topics) {
  for (const level of MatGames.LEVELS) {
    const prompts = new Set();
    for (let i = 0; i < ROUNDS; i++) {
      const q = MatLevelGen.generate(topic.id, level.id);
      total++;
      const tag = `${topic.id}/${level.id}: ${q.prompt}`;
      assert(q.prompt && q.explain && q.hint, "Eksik metin: " + tag);
      assert(q.scene && q.scene.kind === "art" && /<(svg|div)/.test(q.scene.html), "Görsel yok: " + tag);
      assert(!/NaN|undefined|Infinity/.test(q.prompt + q.explain + q.scene.html), "Bozuk değer: " + tag);
      assert.equal(q.level, level.id);
      assert.equal(q.points, level.points);
      if (q.kind === "num") assert(Number.isSafeInteger(q.answer) && q.answer >= 0, "Tuş takımına uymayan cevap: " + tag + " → " + q.answer);
      else {
        assert.equal(q.kind, "mc");
        assert(q.choices.length >= 2 && q.choices.length <= 4, "Seçenek sayısı: " + tag);
        assert.equal(q.choices.filter((c) => c === q.answer).length, 1, "Cevap seçeneklerde tek değil: " + tag);
        assert.equal(new Set(q.choices).size, q.choices.length, "Tekrarlı seçenek: " + tag);
      }
      prompts.add(q.prompt + "#" + q.answer + "#" + q.scene.html.length);
    }
    assert(prompts.size >= Math.min(30, ROUNDS / 4), `Çeşitlilik düşük: ${topic.id}/${level.id} → ${prompts.size}`);
  }
}
console.log(`Tamam: ${total} üretilmiş soru denetlendi.`);
