// node tests/anlat.cjs — ders anlatımı, çözümlü örnek ve oynatılabilir modeller.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");

for (const file of ["curriculum.js", "lesson-stories.js", "curriculum7.js", "labs7.js", "compare7.js", "imagine.js", "lesson-teach.js", "visuals.js"]) {
  require(path.join(root, "assets", file));
}

const grade5 = MatCurriculum.topics;
const grade7 = MatCurricula[7].topics;
assert.equal(grade5.length, 20);
assert.equal(grade7.length, 22);

for (const topic of [...grade5, ...grade7]) {
  assert.equal(topic.slides.filter((slide) => slide.teach).length, 1, topic.id);
  const slide = topic.slides[0];
  assert.equal(slide.teach, true, topic.id);
  assert.equal(slide.narration.length, 3, topic.id);
  assert.equal(slide.example.steps.length, 3, topic.id);
  assert(slide.p.includes(slide.example.result), topic.id);
  assert(slide.sandbox || slide.bullets, topic.id);
  if (String(slide.sandbox || "").startsWith("im-")) {
    const html = MatImagine.view(slide.sandbox);
    assert(!/NaN|undefined|Infinity/.test(html), slide.sandbox);
  }
}
for (const topic of grade5) {
  assert(topic.slides[0].motto, topic.id);
  assert(!topic.slides[0].terms || topic.slides[0].terms.length <= 3, topic.id);
}
assert(grade5.find((topic) => topic.id === "nokta").slides[0].terms.includes("doğru parçası"));
assert(grade5.find((topic) => topic.id === "alan").slides[0].terms.includes("birim kare"));
assert(!grade7.find((topic) => topic.id === "m7-rasyonel").slides[0].motto);
assert.equal(grade5.find((topic) => topic.id === "nokta").slides[1].story, "Bir yol çizelim");
assert.equal(grade7.find((topic) => topic.id === "m7-siralama").slides.length, 11);
assert.equal(grade7.find((topic) => topic.id === "m7-siralama").slides[1].sandbox, "m7-compare-sign");

const see = (kind, raw) => MatImagine.view(kind, raw);
for (const kind of MatImagine.kinds) {
  assert(!/NaN|undefined|Infinity/.test(see(kind)), kind);
  assert(MatImagine.html(kind).includes(`data-imagine="${kind}"`), kind);
}
assert(see("im-line", { mode: "segment" }).includes("Uzunluğu ölçülür"));
assert(see("im-line", { mode: "ray" }).includes("Uzunluğu ölçülemez"));
assert(see("im-dikme", { deg: 30 }).includes("Şu anki yol: 8 cm"));
assert(see("im-dikme", { deg: 90 }).includes("Şu anki yol: 4 cm"));
assert(see("im-parallel", { mode: "parallel" }).includes("ortak noktası yoktur"));
assert(see("im-durum", { mode: "same" }).includes("bütün noktalar ortaktır"));
assert(see("im-polygon", { n: 5 }).includes("5 köşegen"));
assert(see("im-polygon", { n: 5 }).includes("108°"));
assert(see("im-triangle", { a: 70, b: 60 }).includes("Üçüncü açı: 50°"));
assert(see("im-triangle", { a: 70, b: 60 }).includes("dar açılıdır"));
assert(see("im-triangle", { a: 120, b: 70 }).includes("oluşturmaz"));
assert(see("im-construct", { step: "2" }).includes("eşkenardır"));
assert(see("im-compare5", { a: 4205, b: 4250 }).includes("küçüktür"));
assert(see("im-compare5", { a: 4205, b: 4250 }).includes("onlar"));
assert(see("im-compare5", { a: 999, b: 1000 }).includes("Basamak sayısı"));
assert(see("im-add", { a: 28, b: 17 }).includes("Sonuç: 45"));
assert(see("im-mul", { rows: 3, cols: 4 }).includes("3 × 4 = 12"));
assert(see("im-shop", { n: 3, price: 20, money: 100 }).includes("Kalan 40 TL"));
assert(see("im-shop", { n: 8, price: 40, money: 20 }).includes("yetmez"));
assert(see("im-frac", { n: -15, d: 20, k: 1 }).includes('data-value="-3/4"'));
assert(see("im-abs", { a: -5, b: 8 }).includes("uzaklık 13"));
assert(see("im-decimal", { n: 2, d: 3 }).includes("0,666…"));
assert(see("im-decimal", { n: 2, d: 3 }).includes("devirlidir"));
assert(see("im-decimal", { n: 1, d: 4 }).includes("0,25"));
assert(see("im-decimal", { n: 1, d: 4 }).includes("sonludur"));
assert(see("im-decimal", { n: -3, d: 4 }).includes("−0,75"));
assert(see("im-fracadd", { a: -1, b: 3, c: 3, d: 4 }).includes('data-value="5/12"'));
assert(see("im-order", { a: 2, b: 3, c: 4 }).includes("Doğru sonuç 14"));
assert(see("im-order", { a: 2, b: 3, c: 4 }).includes("Soldan yapılırsa 20"));
assert(see("im-views", { fs: 1, fd: 3, bs: 2, bd: 1 }).includes("Ön görünüm: 2 ve 3"));
assert(see("im-views", { fs: 1, fd: 3, bs: 2, bd: 1 }).includes("Toplam küp: 7"));
assert(see("im-layers", { a: 6, b: 3, c: 4 }).includes("6 × 3 × 4 = 72"));
assert(see("im-units", { ml: 2400 }).includes("2,4 L"));
assert(see("im-tank", { cap: 24, parts: 4, filled: 3 }).includes("Dolu: 18 L"));
assert(see("im-tank", { cap: 24, parts: 4, filled: 3 }).includes("Boş: 6 L"));
assert(see("im-tank", { cap: 24, parts: 4, filled: 9 }).includes("Dolu: 24 L"));
assert(see("im-data", { mode: "forma" }).includes("Kategorik"));
assert(see("im-research", { mode: "sinif" }).includes("istatistiksel bir sorudur"));
assert(see("im-research", { mode: "sevdigim" }).includes("değildir"));
assert(see("im-privacy").includes("Kimlik numarası bu araştırma için gerekli değil"));
assert(see("im-privacy", { on: ["sure", "sube", "donem"] }).includes("Gereksiz bilgi kalmadı"));
assert(see("im-media", { start: 80, end: 100 }).includes("%25 artış"));
assert.throws(() => MatImagine.view("im-yok"));

const dial90 = MatVisuals.dialSvg(90);
assert(dial90.includes('id="dialArc"') && dial90.includes('visibility="hidden"'), "90 derecede yay gizli olmali");
assert(dial90.includes('id="dialSquare"') && dial90.includes('visibility="visible"'), "90 derecede dik isareti gorunmeli");
assert(dial90.includes('class="dial-num is-ninety"'));
assert(dial90.includes(">dar</text>") && dial90.includes(">geniş</text>"));
const dial60 = MatVisuals.dialSvg(60);
assert(dial60.includes('id="dialArc"') && dial60.includes('visibility="visible"'));
assert(dial60.includes('id="dialSquare"') && dial60.includes('visibility="hidden"'));
const pair40 = MatVisuals.pairSvg(40, 90);
assert(pair40.includes('id="pairSectors"') && !pair40.includes(">dar</text>"));
const static90 = MatVisuals.renderScene({ kind: "angle", deg: 90, show: true });
assert(static90.includes("1c8c74") && !static90.includes("6554a4"), "Sabit 90 derecede yay cizilmemeli");
const static50 = MatVisuals.renderScene({ kind: "angle", deg: 50 });
assert(static50.includes("6554a4") && !static50.includes("1c8c74"));

const output = { innerHTML: "" };
const deg = { dataset: { im: "deg" }, value: "30" };
const read = { textContent: "", dataset: { imRead: "deg" } };
const host = {
  dataset: { imagine: "im-dikme" },
  listeners: {},
  addEventListener(type, fn) { this.listeners[type] = fn; },
  querySelector(sel) { return sel === "[data-im-output]" ? output : null; },
  querySelectorAll(sel) {
    if (sel === "[data-im]") return [deg];
    if (sel === "[data-im-read]") return [read];
    return [];
  },
  contains() { return true; }
};
MatImagine.bind({ querySelector: () => host });
assert(output.innerHTML.includes("Şu anki yol: 8 cm"));
assert.equal(read.textContent, 30);
deg.value = "90";
host.listeners.input();
assert(output.innerHTML.includes("Şu anki yol: 4 cm"));

function boot() {
  const app = { innerHTML: "", querySelector() { return null; }, querySelectorAll() { return []; } };
  const document = {
    getElementById: (id) => id === "app" ? app : null,
    querySelector: () => null,
    querySelectorAll: () => [],
    body: { classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } } },
    addEventListener() {},
    fullscreenElement: null,
    activeElement: { tagName: "BODY", id: "" }
  };
  const ctx = vm.createContext({
    console, document, Date, location: { hash: "" },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    matchMedia: () => ({ matches: false }),
    MatAudio: { cancelSpeak() {}, speak() {}, correct() {}, wrong() {}, fanfare() {}, tick() {}, ensure() {} }
  });
  ctx.window = ctx;
  for (const file of ["visuals.js", "games.js", "curriculum.js", "lesson-stories.js", "curriculum7.js", "labs7.js", "compare7.js", "imagine.js", "lesson-teach.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, "assets", file), "utf8"), ctx);
  }
  const source = fs.readFileSync(path.join(root, "assets/app.js"), "utf8").replace(/\}\)\(\);\s*$/, "globalThis.testApi = { state, startLocal, openTopic, render };\n})();");
  vm.runInContext(source, ctx);
  ctx.testApi.startLocal();
  return { api: ctx.testApi, app };
}

const ui = boot();
const show = (id, grade, slide = 0) => {
  ui.api.state.grade = grade;
  ui.api.openTopic(id, "lesson");
  ui.api.state.slide = slide;
  ui.api.state.sandboxKey = "";
  ui.api.render();
  return ui.app.innerHTML;
};
let html = show("nokta", 5);
assert(html.includes("Ders anlatımı"));
assert(html.includes("Anka anlatıyor"));
assert(html.includes("Birlikte çözelim"));
assert(html.includes("Akılda kalsın"));
assert(html.includes('<mark class="term">'));
assert(html.includes('class="step-num"'));
assert(html.includes("doğru parçasına aittir"));
html = show("aci", 5);
assert(html.includes('id="dialSvg"'));
assert(html.includes(">45°</b>") || html.includes(">45°</p>") || html.includes("45°"));
html = show("cevre", 5);
assert(html.includes(">18</b>"));
html = show("cift", 5);
assert(html.includes("Tümler"));
assert(html.includes(">35°</b>"));
assert(html.includes(">55°</b>"));
html = show("cift", 5, 3);
assert(html.includes("<b>180°</b>"));
assert(html.includes(">150°</b>"));
html = show("m7-rasyonel", 7);
assert(html.includes('data-imagine="im-frac"'));
assert(html.includes("−3/4"));
html = show("m7-siralama", 7);
assert(html.includes("lesson-rule-sheet"));
assert(html.includes("Anka anlatıyor"));
assert(html.includes("Etkileşimli örneklere geç"));
html = show("m7-tamsayilar", 7);
assert(html.includes('data-lab="m7-number"'));
assert(html.includes("2. kata gelir"));
console.log("OK: 42 konuda anlatım, örnek ve model; Anka balonları, terim vurguları, sayı çipleri ve ders ekranı doğrulandı.");
