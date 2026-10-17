// node tests/lesson-play.cjs — Anlat sekmesinin ileri adımlarındaki etkileşimli modeller.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const files = ["scoreboard.js", "visuals.js", "angle-intersection.js", "angle-adjacent.js", "games.js", "curriculum.js", "lesson-stories.js", "curriculum7.js", "labs7.js", "compare7.js", "imagine.js", "lesson-teach.js", "lesson-play.js"];

const app = { innerHTML: "", querySelector() { return null; }, querySelectorAll() { return []; } };
const ctx = vm.createContext({
  console, Date,
  document: {
    getElementById: (id) => id === "app" ? app : null, querySelector: () => null, querySelectorAll: () => [],
    body: { classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } } },
    addEventListener() {}, fullscreenElement: null, activeElement: { tagName: "BODY", id: "" }
  },
  location: { hash: "" }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, matchMedia: () => ({ matches: false }),
  MatAudio: { setMusicScene() {}, toggleMusic() {}, musicEnabled: true, cancelSpeak() {}, speak() {}, correct() {}, wrong() {}, fanfare() {}, tick() {}, ensure() {} }
});
ctx.window = ctx;
for (const file of files) vm.runInContext(fs.readFileSync(path.join(root, "assets", file), "utf8"), ctx);
const source = fs.readFileSync(path.join(root, "assets/app.js"), "utf8").replace(/\}\)\(\);\s*$/, "globalThis.testApi = { state, startLocal, openTopic, render };\n})();");
vm.runInContext(source, ctx);
const { MatImagine, MatLessonPlay, MatCurriculum } = ctx;
const bad = /NaN|undefined|Infinity|\[object/;

// Her model: varsayılan çizim ve gösterinin her adımı.
let views = 0;
for (const kind of MatImagine.kinds) {
  const spec = MatImagine.spec(kind);
  assert(!bad.test(MatImagine.view(kind)), kind);
  assert(MatImagine.html(kind).includes(`data-imagine="${kind}"`), kind);
  let raw = {};
  for (const step of spec.demo || []) {
    raw = { ...raw, ...step };
    const html = MatImagine.view(kind, raw);
    assert(!bad.test(html), kind + " " + JSON.stringify(raw));
    views++;
  }
  for (const c of spec.controls) {
    if (c.type !== "range") continue;
    for (const value of [c.min, c.max]) assert(!bad.test(MatImagine.view(kind, { [c.key]: value })), `${kind} ${c.key}=${value}`);
  }
}
assert(MatImagine.html("im-sticks").includes("▶ İzle"));
assert(MatImagine.html("im-sticks", { a: 6, b: 6, c: 55 }).includes('value="55"'));

// Çubuklarla üçgen: 6-6-6 olur, 6-6-55 olmaz.
const see = (kind, raw) => MatImagine.view(kind, raw);
assert(see("im-sticks", { a: 6, b: 6, c: 6 }).includes("Üçgen oluştu"));
assert(see("im-sticks", { a: 6, b: 6, c: 6 }).includes("eşkenar ve dar açılı"));
assert(see("im-sticks", { a: 6, b: 6, c: 55 }).includes("kurulamaz"));
assert(see("im-sticks", { a: 6, b: 6, c: 55 }).includes("43 cm boşluk"));
assert(see("im-sticks", { a: 4, b: 5, c: 9 }).includes("düz bir çizgi"));
assert(see("im-sticks", { a: 3, b: 4, c: 5 }).includes("çeşitkenar ve dik"));
assert(see("im-sticks", { a: 5, b: 5, c: 8 }).includes("ikizkenar ve geniş açılı"));
// AB doğrusuna dik doğru.
assert(see("im-perp-ab", { deg: 90 }).includes("d ⊥ AB"));
assert(!see("im-perp-ab", { deg: 60 }).includes("d ⊥ AB"));
assert(see("im-perp-ab", { deg: 60 }).includes("60° ve 120°"));
assert(see("im-shortest", { x: 0 }).includes("en kısa yol dikmedir"));
assert(see("im-shortest", { x: 3 }).includes("yaklaşık 5 birim"));
assert(see("im-rails", { tilt: 0 }).includes("d // k"));
assert(see("im-letters", { ch: "E" }).includes("3 çift paralel"));
assert(see("im-letters", { ch: "E" }).includes("3 yerde dik"));
assert(see("im-letters", { ch: "Z" }).includes("1 çift paralel"));
assert(see("im-letters", { ch: "L" }).includes("paralel çizgi yok"));
assert(see("im-three", { mode: "tri" }).includes("3 kesişme"));
assert(see("im-lines2", { dir: "same", gap: 0 }).includes("çakışık"));
assert(see("im-clock", { h: 4 }).includes("120°"));
assert(see("im-clock", { h: 9 }).includes("90°"));
assert(see("im-tri-shape").includes("dar açılı üçgen"));
assert(see("im-tri-shape", { k: 3, h: 3 }).includes("dik üçgen"));
assert(see("im-tri-shape", { k: 7, h: 3 }).includes("dik üçgen"));
assert(see("im-tri-shape", { k: 1, h: 2 }).includes("geniş açılı"));
assert(see("im-tear", { step: "line" }).includes("= 180°"));
assert(see("im-compass-tri", { base: 6, ra: 6, rb: 6 }).includes("eşkenar"));
assert(see("im-compass-tri", { base: 7, ra: 3, rb: 3 }).includes("kurulamaz"));
assert(see("im-ladder", { deg: 70 }).includes("20°"));
assert(see("im-regular", { mode: "rect" }).includes("düzgün çokgen değildir"));
assert(see("im-count-seg", { n: 4 }).includes("Toplam 6 doğru parçası"));
// Sayılar.
assert.equal(MatLessonPlay.sayNumber(12000678), "on iki milyon altı yüz yetmiş sekiz");
assert.equal(MatLessonPlay.sayNumber(2030405060), "iki milyar otuz milyon dört yüz beş bin altmış");
assert.equal(MatLessonPlay.sayNumber(1005), "bin beş");
assert.equal(MatLessonPlay.ablative(9), "9’dan");
assert.equal(MatLessonPlay.ablative(3), "3’ten");
assert.equal(MatLessonPlay.ablative(40), "40’tan");
assert.equal(MatLessonPlay.ablative(100), "100’den");
assert(see("im-croc", { a: 13, b: 9 }).includes("13, 9’dan büyüktür"));
assert(see("im-shift", { d: 3, pos: 2 }).includes("3 × 100 = 300"));
assert(see("im-blocks", { a: 28, b: 17, step: "done" }).includes("= 45"));
assert(see("im-borrow", { a: 52, b: 27, step: "take" }).includes("52 − 27 = 25"));
assert(see("im-borrow", { a: 20, b: 90 }).includes("20 = 2 onluk"));
assert(see("im-bus", { people: 25, cap: 11 }).includes("3 sefer"));
assert(see("im-share", { n: 13, g: 4 }).includes("13 ÷ 4 = 3, kalan 1"));
assert(see("im-zeros", { a: 32, b: 3, z1: 1, z2: 2 }).includes("96 000"));
assert(see("im-odd", { P: 15 }).includes("çizilemez"));
assert(see("im-fence", { P: "20", a: 5 }).includes("en büyük alan"));
assert(see("im-fence", { P: "12", a: 11 }).includes("kenarlar 5 ve 1"));
assert(see("im-same-area", { A: "12", i: 4 }).includes("4 × 3 = 12"));

// 5. sınıf: ilk adımdan sonraki statik çizimlerin hepsi modele çevrildi, yeni örnekler eklendi.
const api = ctx.testApi;
api.startLocal();
let interactive = 0, extras = 0, stillStatic = [];
for (const topic of MatCurriculum.topics) {
  assert.equal(topic.slides.filter((s) => s.teach).length, 1, topic.id);
  topic.slides.forEach((slide, i) => {
    if (slide.extraExample) extras++;
    const pair = topic.id === "cift" && (slide.story || slide.h === "Tümler ve bütünler");
    if (i && (slide.sandbox || pair || (slide.scene && ["angle", "intersect"].includes(slide.scene.kind)) || slide.h === "Komşu açılar")) interactive++;
    else if (i && !["learning-cards", "pair"].includes(slide.scene.kind)) stillStatic.push(topic.id + ": " + slide.h);
    api.state.grade = 5;
    api.openTopic(topic.id, "lesson");
    api.state.slide = i;
    api.state.sandboxKey = "";
    api.render();
    assert(!bad.test(app.innerHTML.replace(/aria-label="[^"]*"/g, "")), topic.id + " " + i);
    if (slide.imPreset) assert(app.innerHTML.includes(`data-imagine="${slide.sandbox}"`), topic.id + " " + slide.h);
  });
}
assert(extras >= 14, "yeni örnek adımları: " + extras);
assert.equal(stillStatic.length, 0, "Statik kalan adımlar: " + stillStatic.join(", "));
const ucgen = MatCurriculum.topics.find((t) => t.id === "ucgen").slides;
assert(ucgen.some((s) => s.sandbox === "im-sticks" && s.imPreset.c === 55));
assert(MatCurriculum.topics.find((t) => t.id === "dikme").slides.some((s) => s.h === "AB doğrusuna dik bir doğru koy"));

// Yeni eklenen 5. ve 7. sınıf görsel modelleri.
assert(see("im-poly-tri", { n: 6, show: "tri" }).includes("4 üçgen"));
assert(see("im-abacus", { m: 4, yb: 0, ob: 0, b: 0, y: 0, o: 0, bir: 9 }).includes("dört milyon dokuz"));
assert(see("im-polyomino", { shape: "O" }).includes("Çevre = 8 birim"));
assert(see("im-polyomino", { shape: "I" }).includes("Çevre = 10 birim"));
assert(see("im-m7-sea", { h: -10, opp: "1" }).includes("Deniz seviyesi"));
assert(see("im-m7-elevator", { start: 2, move: -5 }).includes("-3. kat"));
assert(see("im-m7-sign", { p: 3, q: 4, pos: "both" }).includes("Pozitif"));
assert(see("im-m7-pack", { w: 494, tol: 5 }).includes("Tolerans dışı"));
assert(see("im-m7-rep", { p: 4, q: "9" }).includes("0,(4)"));
assert(see("im-m7-dense", { pair: "0", zoom: 3 }).includes("sonsuz"));
assert(see("im-m7-chips", { a: -3, op: "+", b: 5 }).includes("Sıfır çifti: 3"));
assert(see("im-m7-pow", { p: 2, q: 3, exp: "2", par: "in" }).includes("+4/9"));
assert(see("im-m7-pow", { p: 2, q: 3, exp: "2", par: "out" }).includes("−4/9"));
assert(see("im-m7-jugs", { tot: "6/4", cup: "1/4" }).includes("6 bardak"));
assert(see("im-m7-views3d", { b: "L", dir: "top" }).includes("5 birim küp"));
assert(see("im-m7-net", { type: "open", fold: 1 }).includes("5 yüz"));
assert(see("im-m7-packbox", { W: 20, D: 15, H: 12, k: "4" }).includes("45 kutu"));
assert(see("im-m7-seesaw", { x5: 15, band: "1" }).includes("Ortanca = 6"));
assert(see("im-m7-axis", { mode: "cut" }).includes("Kesilmiş eksen"));
assert(see("im-m7-sym", { mode: "poly", n: 5 }).includes("5 tane simetri doğrusu"));
assert(see("im-m7-bisect", { kind: "perp", step: 3 }).includes("Orta dikme"));

// 7. sınıf: ilk adımdan sonraki tüm iç adımlar etkileşimli modele çevrildi ve boş tuval yok.
assert(see("im-frac", { n: -3, d: 4, k: 1 }).includes('<b class="im-sign">−</b><span class="im-stack"><span>3</span><span>4</span></span>'));
let interactive7 = 0, stillStatic7 = [];
for (const topic of ctx.MatCurricula[7].topics) {
  assert.equal(topic.slides.filter((s) => s.teach).length, 1, topic.id);
  topic.slides.forEach((slide, i) => {
    if (i && slide.sandbox) interactive7++;
    else if (i) stillStatic7.push(topic.id + ": " + slide.h);
    api.state.grade = 7;
    api.openTopic(topic.id, "lesson");
    api.state.slide = i;
    api.state.sandboxKey = "";
    api.render();
    assert(!bad.test(app.innerHTML.replace(/aria-label="[^"]*"/g, "")), topic.id + " " + i);
    if (!slide.bullets) {
      assert(
        app.innerHTML.includes('data-imagine="') ||
        app.innerHTML.includes('data-lab="') ||
        app.innerHTML.includes('data-compare="'),
        `Boş model: ${topic.id} / ${slide.h} (${slide.sandbox})`
      );
    }
  });
}
assert.equal(stillStatic7.length, 0, "7. sınıfta statik kalan adımlar: " + stillStatic7.join(", "));

console.log(`OK: ${MatImagine.kinds.length} model, ${views} gösteri adımı; 5. sınıfta ${interactive} etkileşimli adım (${extras} yeni örnek), 7. sınıfta ${interactive7} etkileşimli adım. Statik kalan: ${stillStatic.length + stillStatic7.length}.`);
