// Çalıştır: node tests/verify.cjs (harici bağımlılık gerektirmez)
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
for (const file of ["curriculum.js", "lesson-stories.js", "games.js", "question-bank.js"]) require(path.join(root, "assets", file));

let questionCount = 0, tfCount = 0;
const kinds = new Set();
for (const topic of MatCurriculum.topics) {
  const prompts = new Set(), ids = new Set();
  for (const level of MatGames.LEVELS) {
    const bank = MatQuestionBank.get(topic.id, level.id);
    assert.equal(bank.length, 15);
    for (const q of bank) {
      questionCount++;
      assert(!prompts.has(q.prompt), "Tekrar eden soru: " + q.id);
      assert(!ids.has(q.id), "Tekrar eden kimlik: " + q.id);
      prompts.add(q.prompt); ids.add(q.id); kinds.add(q.kind);
      assert(q.explain && q.hint, "Eksik çözüm/ipucu: " + q.id);
      assert.equal(q.level, level.id);
      if (q.scoringType === "true-false") {
        tfCount++;
        assert.equal(q.points, 5, "D/Y sorusu yalnız 5 puan olabilir");
        assert(level.id <= 2, "Üst seviyede D/Y bulunamaz");
      } else assert.equal(q.points, level.points);
      if (q.kind === "num") assert(Number.isSafeInteger(q.answer) && q.answer >= 0, "Tuş takımıyla girilemeyen cevap: " + q.id);
      if (q.kind === "mc") {
        assert(q.choices.length >= 2 && q.choices.length <= 4);
        assert.equal(q.choices.filter(c => c === q.answer).length, 1);
      }
      if (q.kind === "slots") {
        assert(/^\d{1,12}$/.test(q.answer));
        assert.equal(q.reading, MatGames.sayNumber(q.answer));
      }
      if (q.kind === "order") {
        const map = Object.fromEntries(q.items.map(it => [it.id, it.n]));
        const nums = q.answer.map(id => map[id]);
        assert.equal(new Set(nums).size, q.items.length);
        assert.deepEqual(nums, [...nums].sort((a, b) => a - b));
      }
      if (q.kind === "dial") assert(q.target >= 0 && q.target <= 180);
      if (q.kind === "classify") assert(q.items.every(it => Number.isInteger(it.bucket) && q.buckets[it.bucket]));
      if (q.kind === "rect") {
        let found = false;
        for (let w = 1; w <= 20; w++) for (let h = 1; h <= 20; h++) if (MatGames.rectOk(q, w, h)) found = true;
        assert(found, "Çizilemeyen dikdörtgen: " + q.id);
      }
    }
    const used = bank.slice(0, 14).map(q => q.id);
    assert.equal(MatGames.buildQuiz(topic.id, level.id, 12345, used, 1)[0].id, bank[14].id, "Görülmüş soru erken seçildi");
    assert.equal(new Set(MatGames.buildQuiz(topic.id, level.id, 12345).map(q => q.id)).size, 15);
    const copy = MatQuestionBank.get(topic.id, level.id); copy[0].prompt = "değişti";
    assert.notEqual(MatQuestionBank.get(topic.id, level.id)[0].prompt, "değişti");
  }
  assert.equal(prompts.size, 75);
}
assert.equal(questionCount, 1500);
assert(tfCount > 0);
assert.equal(MatGames.sayNumber(1001001001), "bir milyar bir milyon bin bir");
assert.equal(MatGames.sayNumber(416205008073), "dört yüz on altı milyar iki yüz beş milyon sekiz bin yetmiş üç");

// Özellikle hata üretmeye yatkın, birbirinden bağımsız örnek sonuçlar.
const fixture = (topic, lv, index, expected) => assert.equal(MatQuestionBank.get(topic, lv)[index - 1].answer, expected, `${topic}/${lv}/${index}`);
fixture("basamak", 1, 1, 3); fixture("basamak", 5, 3, 50000000);
fixture("nokta", 5, 14, 17); fixture("nokta", 5, 15, 216);
fixture("cift", 5, 15, 180); fixture("ucgen", 5, 15, 114);
fixture("cevre", 5, 12, 134); fixture("alan", 5, 10, 47812);
fixture("insa", 5, 14, 88); fixture("insa", 5, 15, 22);
fixture("iliski", 5, 7, 2704); fixture("iliski", 5, 15, 1);

function harness(storage = new Map(), opts = {}) {
  let now = 1000000, serial = 0;
  const jobs = new Map();
  const element = () => ({ innerHTML: "", textContent: "", style: { setProperty() {} }, classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } }, appendChild() {}, remove() {}, focus() {}, querySelector: () => element(), setAttribute() {}, addEventListener() {} });
  const app = element();
  const document = { getElementById: id => id === "app" ? app : null, querySelector: () => null, querySelectorAll: () => [], body: element(), createElement: element, addEventListener() {}, activeElement: { tagName: "BODY", id: "" } };
  class TestDate extends Date { static now() { return now; } }
  const ctx = vm.createContext({ console, document, Date: TestDate, location: { hash: "" }, localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) }, matchMedia: () => ({ matches: true }),
    setTimeout: (fn, delay) => { const id = ++serial; jobs.set(id, { fn, at: now + delay, interval: 0 }); return id; },
    clearTimeout: id => jobs.delete(id),
    setInterval: (fn, delay) => { const id = ++serial; jobs.set(id, { fn, at: now + delay, interval: delay }); return id; },
    clearInterval: id => jobs.delete(id),
    MatAudio: { cancelSpeak() {}, correct() {}, wrong() {}, fanfare() {}, tick() {}, ensure() {}, speak() {} }, MatVisuals: { renderScene: () => "", dialSvg: () => "", pairSvg: () => "" } });
  ctx.window = ctx;
  for (const file of ["curriculum.js", "lesson-stories.js", "games.js", "question-bank.js", ...(opts.gen ? ["arcade-gen.js", "level-gen.js"] : [])]) vm.runInContext(fs.readFileSync(path.join(root, "assets", file), "utf8"), ctx);
  const source = fs.readFileSync(path.join(root, "assets/app.js"), "utf8").replace(/\}\)\(\);\s*$/, "globalThis.testApi = { state, startLocal, persist, addMany, parseList, makeGroups, eligible, spinPick, members, groupScore, beginLevel, submit, goNext, currentQ, cancelRound, pauseClock, resumeClock, openTopic, onChange, onClick, isCorrect, ready, animateLessonAngle, applyLessonAngle, render };\n})();");
  vm.runInContext(source, ctx);
  ctx.testApi.startLocal();
  ctx.testApi.state.autoRotate = false;
  const advance = ms => {
    const end = now + ms;
    let steps = 0;
    while (true) {
      const next = [...jobs].filter(([, j]) => j.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      assert(++steps < 20000, "Sonsuz zamanlayıcı");
      const [id, job] = next; now = job.at;
      if (job.interval) job.at += job.interval; else jobs.delete(id);
      job.fn();
    }
    now = end;
  };
  return { ...ctx.testApi, ctx, advance, storage, app, jobs };
}
function addStudent(h, id = "a") { if (!h.state.classId) h.state.classId = "c1"; h.state.students.push({ id, name: id === "a" ? "Deneme A" : "Deneme B", score: 0, stars: {}, groupId: null }); h.state.selectedId = id; }
function answer(h) {
  const q = h.currentQ();
  if (q.kind === "rect") { outer: for (let w = 1; w <= 20; w++) for (let z = 1; z <= 20; z++) if (h.ctx.MatGames.rectOk(q, w, z)) { h.state.draft = { w, h: z }; break outer; } }
  else if (q.kind === "dial") h.state.draft = q.target;
  else if (q.kind === "classify") h.state.draft = Object.fromEntries(q.items.map(it => [it.id, it.bucket]));
  else h.state.draft = Array.isArray(q.answer) ? [...q.answer] : String(q.answer);
  assert(h.ready(q) && h.isCorrect(q), "Doğru cevap reddedildi: " + q.id);
  h.submit();
}

// Tüm konularda turların tamamlanması, puanlar ve tekrar etmeyen seçim.
for (const topic of MatCurriculum.topics) for (const level of MatGames.LEVELS) {
  const h = harness(); addStudent(h);
  h.openTopic(topic.id, "play"); h.beginLevel(level.id);
  let expected = 0; const seen = new Set();
  for (let i = 0; i < 15; i++) {
    h.advance(500);
    assert.equal(h.state.phase, "quiz");
    const q = h.currentQ(); assert(!seen.has(q.id)); seen.add(q.id); expected += q.points;
    answer(h); h.submit(); // Çift tıklama puanı ikinci kez yazmamalı.
    h.goNext();
  }
  assert.equal(h.state.phase, "finish");
  assert.equal(h.state.finishStars, 3);
  assert.equal(h.state.students[0].score, expected);
  assert.equal(h.state.scoreEarned, expected);
  h.beginLevel(level.id); h.advance(500);
  assert(h.state.cycleRenewed);
  assert.equal(h.state.usedQuestions[topic.id + ":" + level.id].length, 1);
}

// Süre ancak açılış bittiğinde başlar, duraklamada donmalı, bitişte kilitlenmeli.
{
  const h = harness(); addStudent(h); h.openTopic("problem", "play");
  h.state.questionSeconds = 5; h.state.roundLength = 1; h.beginLevel(5);
  h.advance(100); assert.equal(h.state.phase, "reveal"); assert.equal(h.state.deadline, 0);
  h.advance(1000); assert.equal(h.state.phase, "quiz");
  h.pauseClock(); const remaining = h.state.remainingMs;
  h.advance(20000); assert.equal(h.state.remainingMs, remaining); assert(!h.state.locked);
  h.submit(); assert.equal(h.state.review.length, 0);
  h.resumeClock(); h.advance(5000);
  assert(h.state.feedback.timedOut); assert(h.state.locked);
  assert.equal(h.state.students[0].score, 0);
  h.goNext(); assert.equal(h.state.phase, "finish"); assert.equal(h.state.finishStars, 0);
}
// Süresiz mod, rastgele moddaki sıra, iptal ve birden fazla öğrencinin puanı.
{
  const h = harness(); addStudent(h); addStudent(h, "b"); h.openTopic("cift", "play");
  h.state.roundLength = 5; h.beginLevel(0);
  assert.equal(h.state.reveal.step, "landed"); assert.equal(h.currentQ(), null);
  h.advance(200); assert.equal(h.state.reveal.step, "question"); assert(h.currentQ());
  h.advance(200); assert.equal(h.state.phase, "quiz");
  h.advance(3600000); assert(!h.state.locked); assert.equal(h.state.roundSeconds, 0);
  answer(h); const pts = h.state.students[1].score;
  h.state.selectedId = "a"; assert.equal(h.state.feedback.name, "Deneme B");
  h.goNext(); h.advance(500); answer(h);
  assert(h.state.students[0].score > 0 && pts > 0);
  h.goNext(); h.cancelRound(); h.advance(5000); assert.equal(h.state.phase, "pick");
  const restored = harness(h.storage);
  assert.equal(restored.state.students[1].score, pts);
  assert(Object.keys(restored.state.usedQuestions).length > 0);
}
// Sınırsız mod: her konu ve seviyede üretilen sorularla tam tur; havuz kaydı tutulmaz, ayar kalıcıdır.
for (const topic of MatCurriculum.topics) for (const level of MatGames.LEVELS) {
  const h = harness(new Map(), { gen: true }); addStudent(h);
  assert.equal(h.state.questionSource, "gen");
  h.openTopic(topic.id, "play"); h.beginLevel(level.id);
  let expected = 0;
  for (let i = 0; i < 15; i++) {
    h.advance(500);
    assert.equal(h.state.phase, "quiz");
    const q = h.currentQ();
    assert(q.generated && q.scene && q.scene.kind === "art", "Üretilmiş görselli soru bekleniyordu: " + topic.id);
    assert.equal(q.points, level.points);
    expected += q.points;
    answer(h);
    h.goNext();
  }
  assert.equal(h.state.phase, "finish");
  assert.equal(h.state.students[0].score, expected);
  assert.equal(Object.keys(h.state.usedQuestions).length, 0);
}
{
  const h = harness(new Map(), { gen: true }); addStudent(h);
  h.state.questionSource = "bank"; h.persist();
  const restored = harness(h.storage, { gen: true });
  assert.equal(restored.state.questionSource, "bank");
  restored.openTopic("aci", "play"); restored.beginLevel(2); restored.advance(500);
  assert(!restored.currentQ().generated, "Banka modunda sabit soru gelmeli");
}
console.log("OK: sınırsız mod 100 tam turda ve kaynak ayarının kalıcılığında doğrulandı.");
console.log(`OK: ${questionCount} benzersiz soru, ${tfCount} düşük puanlı D/Y, ${kinds.size} soru tipi; 100 tam tur, puanlama, süre, duraklatma, rastgele sıra ve kalıcılık kontrolleri geçti.`);

// Girilen dereceye aniden atlamak yerine ara derecelerden geçmeli.
{
  const h = harness();
  h.openTopic('aci', 'lesson');
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/visuals.js'), 'utf8'), h.ctx);
  const nodes = Object.fromEntries(['lessonAngle','angleMotion','dialRay','dialHandle','dialRead','dialArc','dialSvg','angleKind','dialSquare'].map(id => [id, {value:'60',textContent:'',attrs:{},reportValidity(){return this.value!=='' && Number(this.value)>=0 && Number(this.value)<=180 && Number.isInteger(Number(this.value));},setAttribute(k,v){this.attrs[k]=String(v);}}]));
  h.ctx.document.getElementById = id => nodes[id] || (id==='app'?h.app:null);
  h.state.sandbox.deg = 60;
  h.animateLessonAngle(90); h.advance(300);
  assert(h.state.sandbox.deg>60 && h.state.sandbox.deg<90);
  h.advance(500); assert.equal(h.state.sandbox.deg,90); assert.equal(nodes.dialSquare.attrs.visibility,'visible');
  nodes.lessonAngle.value='130'; h.applyLessonAngle(); h.advance(1000);
  assert.equal(h.state.sandbox.deg,130); assert.equal(nodes.dialSvg.attrs['aria-valuenow'],'130');
  assert.equal(nodes.dialSquare.attrs.visibility,'hidden');
  nodes.lessonAngle.value='181';h.applyLessonAngle();h.advance(1000);assert.equal(h.state.sandbox.deg,130);
  h.animateLessonAngle(0);h.advance(200);h.animateLessonAngle(180);h.advance(2500);assert.equal(h.state.sandbox.deg,180);
  h.animateLessonAngle(0);h.advance(200);h.cancelRound();h.state.screen='board';h.ctx.document.getElementById=id=>id==='app'?h.app:null;h.render();const stopped=h.state.sandbox.deg;h.advance(3000);assert.equal(h.state.sandbox.deg,stopped);
  console.log('OK: 60 -> 90 -> 130 derece, ara kareler, hedef degistirme, sinirlar ve sayfadan ayrilinca iptal.');
}

// Tumler ve butunler: iki renkli bolgeler, toplam ve derece siniri.
{
  const h=harness();h.openTopic('cift','lesson');
  vm.runInContext(fs.readFileSync(path.join(root,'assets/visuals.js'),'utf8'),h.ctx);
  const nodes=Object.fromEntries(['lessonAngle','angleMotion','pairSectors','pairFirst','pairOther','pairRule','dialRay','dialHandle','dialArc','dialSvg','dialSquare'].map(id=>[id,{value:'40',textContent:'',innerHTML:'',attrs:{},setAttribute(k,v){this.attrs[k]=String(v);}}]));
  h.ctx.document.getElementById=id=>nodes[id]||null;
  h.animateLessonAngle(40);h.advance(2000);
  assert.equal(h.state.sandbox.deg,40);assert.equal(nodes.pairOther.textContent,'50°');assert(nodes.pairSectors.innerHTML.includes('#9ad7cc'));
  h.animateLessonAngle(130);h.advance(2000);assert.equal(h.state.sandbox.deg,40);
  h.state.sandbox.pairTotal=180;h.animateLessonAngle(40);h.advance(2000);assert.equal(nodes.pairOther.textContent,'140°');
  h.animateLessonAngle(130);h.advance(2000);assert.equal(nodes.pairOther.textContent,'50°');
  h.animateLessonAngle(180);h.advance(2000);assert.equal(nodes.pairOther.textContent,'0°');assert(!nodes.pairSectors.innerHTML.includes('NaN'));
  console.log('OK: tumler 40+50, butunler 40+140 ve 130+50, sinir degerler.');
}


// Sınıf sistemi: liste ayrıştırma, istatistik, grup puanı, adil sıra ve otomatik öğrenci değişimi.
{
  const h = harness();
  h.state.classId = "c1";
  const parsed = h.parseList("1\t1234\tALİ\tYILMAZ\n  56 Zeynep Kaya \nMert\n\n");
  assert.deepEqual(JSON.parse(JSON.stringify(parsed)), [{ no: "1234", name: "Ali Yılmaz" }, { no: "56", name: "Zeynep Kaya" }, { no: "", name: "Mert" }]);
  assert.equal(h.addMany("Ali Yılmaz\nAyşe\nCan\nDuru"), 4);
  assert.equal(h.addMany("ALİ YILMAZ"), 0, "Tekrarlayan isim eklenmemeli");
  assert.equal(h.state.students.length, 4);
  h.state.students.forEach((s, i) => { s.score = [80, 60, 40, 20][i]; });
  h.makeGroups(2, "balanced");
  const totals = h.state.groups.map(g => h.members(g.id).reduce((n, s) => n + s.score, 0));
  assert.deepEqual([...totals], [100, 100], "Dengeli gruplar yılan sırasıyla dağıtılmalı");
  h.state.students.forEach(s => { s.score = 0; });

  // Herkese sıra: oynayan öğrenci, herkes oynayana kadar tekrar çekilmez.
  h.state.fairTurns = true;
  h.state.autoRotate = true;
  h.state.roundLength = 5;
  h.state.selectedId = h.state.students[0].id;
  h.openTopic("cift", "play");
  h.beginLevel(1);
  const players = [];
  for (let i = 0; i < 4; i++) {
    h.advance(1000);
    assert.equal(h.state.phase, "quiz");
    players.push(h.state.selectedId);
    answer(h);
    h.goNext();
    h.advance(10000); // çekiliş animasyonu
  }
  assert.equal(new Set(players).size, 4, "Dört soruyu dört farklı öğrenci çözmeli: " + players);
  assert.equal(h.state.turnRound, 2, "Herkes oynayınca yeni sıra turu başlamalı");
  const solver = h.state.students.find(s => s.id === players[0]);
  assert.equal(solver.stats.asked, 1); assert.equal(solver.stats.correct, 1);
  assert(solver.stats.topics.cift.c === 1 && solver.score > 0);
  const g = h.state.groups.find(x => x.id === solver.groupId);
  assert(g.score >= solver.score && g.correct >= 1, "Grup puanı ve doğru sayısı artmalı");
  // Yoklamada olmayan öğrenci çekilmez.
  h.state.students.forEach((s, i) => { s.absent = i !== 2; });
  h.state.selectedId = null;
  assert.deepEqual([...h.eligible(h.state.students).map(s => s.id)], [h.state.students[2].id]);
  h.state.students.forEach(s => { s.absent = false; });
  h.cancelRound();
  h.persist();
  const again = harness(h.storage);
  assert.equal(again.state.classId, "c1");
  assert.equal(again.state.students.find(s => s.id === solver.id).stats.correct, 1, "İstatistikler kalıcı olmalı");
  assert.equal(again.state.groups.length, 2);
  console.log("OK: liste ayrıştırma, dengeli gruplar, herkese sıra, otomatik öğrenci değişimi, yoklama ve istatistik kalıcılığı.");
}
// Antrenman puan yazmaz; çekiliş sesi kayıtlı değilse kapalıdır.
{
  const h = harness(); addStudent(h); h.openTopic("cift", "play");
  assert.equal(h.state.practice, false);
  assert.equal(h.state.callout, false);
  h.state.practice = true;
  h.state.roundLength = 1;
  h.beginLevel(1);
  h.advance(1000);
  const before = h.state.students[0].score;
  answer(h);
  assert(h.state.feedback.ok);
  assert.equal(h.state.feedback.awarded, false);
  assert.equal(h.state.students[0].score, before, "Antrenmanda puan yazılmamalı");
  assert.equal((h.state.students[0].stats || { asked: 0 }).asked, 0, "Antrenmanda istatistik yazılmamalı");
  h.goNext();
  assert.equal(h.state.phase, "finish");
  assert.equal(h.state.history.length, 0, "Antrenman turu geçmişe yazılmamalı");
  h.persist();
  const restored = harness(h.storage);
  assert.equal(restored.state.practice, true);
  assert.equal(restored.state.callout, false);
  console.log("OK: antrenman modu puan yazmıyor; çekiliş sesi varsayılan kapalı.");
}
