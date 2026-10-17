// Run: node tests/discovery-variety.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const storage = new Map();
const scripts = ["curriculum", "curriculum7", "games", "question-bank", "arcade-gen", "level-gen", "questions7"]
  .map(name => fs.readFileSync(path.join(__dirname, "../assets", name + ".js"), "utf8"));
function boot() {
  const context = vm.createContext({ console, localStorage: {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key)
  }});
  scripts.forEach(s => vm.runInContext(s, context));
  return context;
}
let app = boot();
const rng = app.MatGames.makeRng(71625);
let samples = 0, min5 = Infinity, newForms = 0;
assert.equal(app.MatLevelGen.templates("nokta", 1), 14);
for (const topic of app.MatLevelGen.topics) {
  const count = app.MatLevelGen.templates(topic, 1);
  if (!topic.startsWith("m7-")) {
    assert(count >= 8, topic + " should have at least eight discovery templates");
    min5 = Math.min(min5, count);
    newForms += topic === "nokta" ? 11 : 6;
  }
  let previous = null;
  for (let cycle = 0; cycle < 4; cycle++) {
    const ids = new Set();
    for (let i = 0; i < count; i++) {
      const q = app.MatLevelGen.generate(topic, 1, rng);
      assert(q.templateId, topic + " must expose a stable template identity");
      assert.notEqual(q.templateId, previous, "Adjacent repeated template: " + topic);
      assert(!ids.has(q.templateId), "Template repeated before cycle completed: " + topic);
      ids.add(q.templateId); previous = q.templateId; samples++;
    }
    assert.equal(ids.size, count);
  }
  // Stop at an arbitrary point and reload the whole generator, as a page reload would.
  const before = app.MatLevelGen.generate(topic, 1, rng);
  app = boot();
  const after = app.MatLevelGen.generate(topic, 1, rng);
  assert.notEqual(before.templateId, after.templateId, "Reload repeated the last template: " + topic);
}
// Two templates that used to collapse into length/count questions must now
// draw actual arrowheads and distinguish start points and endpoint counts.
const answers = new Map();
for (let i = 0; i < 140; i++) {
  const q = app.MatLevelGen.generate("nokta", 1, rng);
  if (q.prompt === "Şeklin kaç uç noktası vardır?") {
    assert([0, 1, 2].includes(q.answer));
    answers.set(q.answer, true);
  }
  if (q.prompt === "Şekildeki ışının başlangıç noktası hangisidir?") {
    assert(q.scene.html.includes("<polygon"), "Ray must include an arrowhead");
    assert(q.choices.includes(q.answer));
  }
}
assert.equal(answers.size, 3, "Line, ray and segment endpoint variants must all occur");
console.log(`Discovery: ${newForms} new grade-5 templates; minimum ${min5} per topic; ${samples} balanced samples across 42 topics; reload and geometry checks passed.`);
