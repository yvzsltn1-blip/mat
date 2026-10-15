// Çalıştır: node tests/question-visuals.cjs — soru bankasındaki her soruya görsel üretilir.
// Çizim bozuk olmamalı ve cevap (ölçek rakamları dışında), soru metninde geçmiyorsa çizimde de geçmemelidir.
const assert = require("node:assert/strict");
const path = require("node:path");
for (const f of ["curriculum.js", "games.js", "question-bank.js", "question-visuals.js"]) require(path.join(__dirname, "..", "assets", f));
const V = globalThis.MatQuestionVisuals;
const plain = (s) => String(s).replace(/\s/g, "");
let n = 0, drawn = 0;
for (const topic of MatCurriculum.topics) for (const level of MatGames.LEVELS) for (const q of MatQuestionBank.get(topic.id, level.id)) {
  n++;
  const html = V.build(topic.id, q);
  if (q.scene || ["dial", "rect", "order", "classify", "slots"].includes(q.kind)) { assert.equal(html, "", "Mevcut görselin üzerine yazılmamalı " + q.id); continue; }
  assert(html && html.includes("<svg"), "Görsel üretilmedi " + q.id);
  assert(!/NaN|undefined|Infinity|null/.test(html), "Bozuk çizim " + q.id + ": " + q.prompt);
  drawn++;
  if (q.kind === "num") {
    const words = [...html.matchAll(/<text(?![^>]*data-scale)[^>]*>([^<>]+)<\/text>/g)].map((m) => m[1]);
    const ans = plain(q.answer);
    const inPrompt = (q.prompt.match(/\d{1,3}(?: \d{3})+(?!\d)|\d+/g) || []).map(plain).includes(ans);
    if (!inPrompt) assert(!words.some((w) => (w.match(/\d{1,3}(?: \d{3})+(?!\d)|\d+/g) || []).map(plain).includes(ans)), "Cevap çizimde görünüyor " + q.id + ": " + q.prompt);
  }
}
console.log(`OK: ${drawn}/${n} soruya otomatik görsel üretildi; cevap hiçbir çizimde açığa çıkmıyor.`);
