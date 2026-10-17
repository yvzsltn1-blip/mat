(function () {
  const TEACHER_EMAIL = "elif@gmail.com";
  const LEGACY_KEY = "mat5-atolye-v1";
  const LOCAL_KEY = "mat-atolye-yerel-v2";
  const COLORS = ["#e25b45", "#2c6bed", "#1c8c74", "#d89a12", "#8a4fd8", "#e0548f", "#0f9bb5", "#6c8a1e"];
  const GROUP_ICONS = ["🦁", "🦊", "🐬", "🦉", "🐝", "🐢", "🦄", "🐼", "🐙", "🦖", "🚀", "⚡"];
  const GROUP_NAMES = ["Aslanlar", "Tilkiler", "Yunuslar", "Baykuşlar", "Arılar", "Kaplumbağalar", "Tek Boynuzlar", "Pandalar", "Ahtapotlar", "Dinozorlar", "Roketler", "Şimşekler"];
  const GRADES = [5, 6, 7, 8];
  const GRADE_COLORS = { 5: "#e25b45", 6: "#2c6bed", 7: "#1c8c74", 8: "#8a4fd8" };
  const MAX_STUDENTS = 120;
  const HISTORY_LIMIT = 60;
  const cloud = typeof MatCloud !== "undefined" && MatCloud.available ? MatCloud : null;
  const app = document.getElementById("app");
  let authenticated = false;
  let authReady = false;
  let localMode = false;
  let loginEmailDraft = TEACHER_EMAIL;
  let loginError = "";
  let loginBusy = false;
  let passwordOpen = false;
  let passwordMsg = null;
  let passwordBusy = false;
  let autoTimer = 0;
  let flashToken = 0;
  let clockTimer = 0;
  let revealTimer = 0;
  let revealToken = 0;

  const state = {
    classes: {},
    classId: null,
    className: "",
    grade: 5,
    section: "",
    year: schoolYear(),
    archived: false,
    createdAt: 0,
    tournament: null,
    history: [],
    turnDone: [],
    turnRound: 1,
    students: [],
    groups: [],
    nextGroup: 0,
    selectedId: null,
    voice: true,
    muted: false,
    tipHidden: false,
    fairTurns: true,
    autoRotate: true,
    rotateMode: "group",
    questionSource: "gen",
    practice: false,
    callout: false,
    screen: "classes",
    manageTab: "students",
    classFilter: 0,
    showArchived: false,
    rankView: "students",
    reportSort: "score",
    reportOpen: null,
    groupCount: 4,
    groupMode: "random",
    moveId: null,
    topicId: null,
    topicTab: "lesson",
    slide: 0,
    autoplay: false,
    sandboxKey: "",
    sandbox: { deg: 40, w: 4, h: 3, r: 4, digits: "" },
    level: 1,
    questions: [],
    qIndex: 0,
    phase: "pick",
    draft: null,
    locked: false,
    feedback: null,
    correctCount: 0,
    scoreEarned: 0,
    finishStars: 0,
    review: [],
    hintOpen: false,
    solution: null,
    gate: null,
    tahta: false,
    flash: "",
    spinning: false,
    lastPick: "",
    questionSeconds: 0,
    roundLength: 15,
    roundSeconds: 0,
    randomLevel: false,
    usedQuestions: {},
    deadline: 0,
    remainingMs: 0,
    paused: false,
    reveal: null,
    cycleRenewed: false
  };

  function schoolYear(d = new Date()) {
    const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
    return y + "-" + (y + 1);
  }

  function uid(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function selected() {
    return state.students.find((s) => s.id === state.selectedId) || null;
  }

  function curriculum() {
    return MatCurriculum.forGrade ? MatCurriculum.forGrade(state.grade) : MatCurriculum;
  }

  function topic() {
    return curriculum().topics.find((t) => t.id === state.topicId) || null;
  }

  function worldOf(id) {
    return curriculum().worlds.find((w) => w.id === id);
  }

  function groupById(id) {
    return state.groups.find((g) => g.id === id) || null;
  }

  function members(gid) {
    return state.students.filter((s) => s.groupId === gid);
  }

  function groupScore(gid) {
    const g = groupById(gid);
    return g ? g.score || 0 : 0;
  }

  function present(list) {
    return list.filter((s) => !s.absent);
  }

  function blankStats() {
    return { asked: 0, correct: 0, wrong: 0, timeout: 0, points: 0, levels: {}, topics: {} };
  }

  function statsOf(s) {
    if (!s.stats) s.stats = blankStats();
    return s.stats;
  }

  function rate(c, a) {
    return a ? Math.round(100 * c / a) : 0;
  }

  function initials(name) {
    return String(name || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toLocaleUpperCase("tr")).join("");
  }

  function classLabel(c) {
    if (!c) return "";
    return c.section ? c.grade + "/" + c.section : c.grade + ". sınıf";
  }

  function levelPointsText(level) {
    if (unlimited()) return String(level.points);
    const points = MatQuestionBank.get(state.topicId, level.id).map(q => q.points);
    const min = Math.min(...points), max = Math.max(...points);
    return min === max ? String(max) : min + "–" + max;
  }

  // ---- Kalıcılık: buluttaysa Firestore, değilse bu tarayıcı ----
  function classSnapshot() {
    return {
      id: state.classId,
      grade: state.grade,
      section: state.section,
      year: state.year,
      archived: state.archived,
      createdAt: state.createdAt || Date.now(),
      updatedAt: Date.now(),
      students: state.students,
      groups: state.groups,
      nextGroup: state.nextGroup,
      selectedId: state.selectedId,
      turnDone: state.turnDone,
      turnRound: state.turnRound,
      usedQuestions: state.usedQuestions,
      tournament: state.tournament,
      history: state.history,
      bankVersion: MatQuestionBank.version
    };
  }

  function settingsSnapshot() {
    return {
      voice: state.voice,
      muted: state.muted,
      tipHidden: state.tipHidden,
      questionSeconds: state.questionSeconds,
      roundLength: state.roundLength,
      fairTurns: state.fairTurns,
      autoRotate: state.autoRotate,
      rotateMode: state.rotateMode,
      questionSource: state.questionSource,
      practice: state.practice,
      callout: state.callout,
      activeClassId: state.classId
    };
  }

  function persist() {
    if (state.classId) {
      state.className = classLabel(state);
      state.classes[state.classId] = classSnapshot();
    }
    const settings = settingsSnapshot();
    if (cloud && !localMode) {
      cloud.saveProfile({ settings });
      if (state.classId) cloud.saveClass(state.classes[state.classId]);
      return;
    }
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ settings, classes: state.classes }));
    } catch (err) {
      console.warn("Yerel kayıt yapılamadı", err);
    }
  }

  function applySettings(data) {
    if (!data) return;
    state.voice = data.voice !== false;
    state.muted = !!data.muted;
    state.tipHidden = !!data.tipHidden;
    const secs = Number(data.questionSeconds);
    state.questionSeconds = Number.isInteger(secs) && (secs === 0 || secs >= 5 && secs <= 3600) ? secs : 0;
    state.roundLength = [1, 5, 10, 15].includes(data.roundLength) ? data.roundLength : 15;
    state.fairTurns = data.fairTurns !== false;
    state.autoRotate = data.autoRotate !== false;
    state.rotateMode = data.rotateMode === "class" ? "class" : "group";
    state.questionSource = data.questionSource === "bank" ? "bank" : "gen";
    state.practice = data.practice === true;
    state.callout = data.callout === true;
  }

  // Sınırsız modda sorular her seferinde MatLevelGen ile yeniden üretilir.
  function unlimited() {
    return state.questionSource !== "bank" && !!window.MatLevelGen;
  }

  // Usta, Efsane ve Prestij yalnız sınırsız üreticide vardır; soru bankası ilk beş seviyededir.
  function levels() {
    return unlimited() ? MatGames.LEVELS : MatGames.BANK_LEVELS;
  }
  const pointsRange = () => { const p = levels().map((l) => l.points); return Math.min(...p) + "–" + Math.max(...p); };

  function normalizeClass(c) {
    c.grade = GRADES.includes(Number(c.grade)) ? Number(c.grade) : 5;
    c.section = String(c.section || "").slice(0, 12);
    c.year = c.year || schoolYear();
    c.students = Array.isArray(c.students) ? c.students : [];
    c.groups = Array.isArray(c.groups) ? c.groups : [];
    c.history = Array.isArray(c.history) ? c.history : [];
    c.turnDone = Array.isArray(c.turnDone) ? c.turnDone : [];
    c.usedQuestions = c.bankVersion === MatQuestionBank.version && c.usedQuestions && typeof c.usedQuestions === "object" && !Array.isArray(c.usedQuestions) ? c.usedQuestions : {};
    c.groups.forEach((g, i) => {
      if (!g.icon) g.icon = GROUP_ICONS[i % GROUP_ICONS.length];
      if (!g.color) g.color = COLORS[i % COLORS.length];
      if (typeof g.score !== "number") g.score = c.students.filter((s) => s.groupId === g.id).reduce((sum, s) => sum + (s.score || 0), 0);
    });
    c.students.forEach((s) => {
      if (!s.stars) s.stars = {};
      if (typeof s.score !== "number") s.score = 0;
      if (!c.groups.some((g) => g.id === s.groupId)) s.groupId = null;
      statsOf(s);
    });
    return c;
  }

  function activateClass(id) {
    const c = state.classes[id];
    if (!c) {
      state.classId = null;
      state.students = [];
      state.groups = [];
      state.history = [];
      state.tournament = null;
      state.usedQuestions = {};
      state.turnDone = [];
      state.className = "";
      return;
    }
    normalizeClass(c);
    state.classId = id;
    state.grade = c.grade;
    state.section = c.section;
    state.year = c.year;
    state.archived = !!c.archived;
    state.createdAt = c.createdAt || Date.now();
    state.students = c.students;
    state.groups = c.groups;
    state.history = c.history;
    state.tournament = c.tournament || null;
    state.nextGroup = c.nextGroup || 0;
    state.selectedId = c.students.some((s) => s.id === c.selectedId) ? c.selectedId : null;
    state.turnDone = c.turnDone;
    state.turnRound = c.turnRound || 1;
    state.usedQuestions = c.usedQuestions;
    state.className = classLabel(c);
    state.lastPick = "";
  }

  function legacyClass() {
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!Array.isArray(data.students) || !data.students.length) return null;
      const m = String(data.className || "").match(/^\s*([5-8])\s*[\/\-.]?\s*(.*)$/);
      return normalizeClass({
        id: uid("c"),
        grade: m ? Number(m[1]) : 5,
        section: m ? m[2].trim() : String(data.className || "").trim(),
        year: schoolYear(),
        archived: false,
        createdAt: Date.now(),
        students: data.students,
        groups: data.groups || [],
        nextGroup: data.nextGroup || 0,
        usedQuestions: data.usedQuestions || {},
        bankVersion: data.bankVersion
      });
    } catch (err) {
      return null;
    }
  }

  function afterLoad(settings) {
    applySettings(settings);
    MatAudio.muted = state.muted;
    MatAudio.voice = state.voice;
    const ids = Object.keys(state.classes);
    const wanted = settings && state.classes[settings.activeClassId] ? settings.activeClassId : null;
    activateClass(wanted);
    state.screen = state.classId && state.students.length ? "board" : ids.length ? "classes" : "classes";
  }

  function load() {
    state.classes = {};
    let settings = null;
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        settings = data.settings || null;
        Object.values(data.classes || {}).forEach((c) => { if (c && c.id) state.classes[c.id] = normalizeClass(c); });
      }
    } catch (err) {
      localStorage.removeItem(LOCAL_KEY);
    }
    if (!Object.keys(state.classes).length) {
      const old = legacyClass();
      if (old) state.classes[old.id] = old;
    }
    afterLoad(settings);
  }

  async function loadCloud() {
    const { profile, classes } = await cloud.loadAll();
    state.classes = {};
    Object.values(classes).forEach((c) => { state.classes[c.id] = normalizeClass(c); });
    let imported = null;
    if (!Object.keys(state.classes).length) {
      imported = legacyClass();
      if (imported) state.classes[imported.id] = imported;
    }
    afterLoad(profile && profile.settings);
    if (imported) {
      cloud.saveClass(imported);
      state.flash = "Bu tarayıcıdaki " + classLabel(imported) + " sınıfı buluta aktarıldı.";
    }
  }

  function flash(msg) {
    state.flash = msg;
    const token = ++flashToken;
    render();
    setTimeout(() => {
      if (token !== flashToken) return;
      state.flash = "";
      const el = document.querySelector(".flash");
      if (el) el.remove();
    }, 2600);
  }

  function starHtml(n) {
    return `<span class="stars">${[1, 2, 3].map((i) => `<i class="${i <= n ? "on" : "off"}">★</i>`).join("")}</span>`;
  }

  // ---- Öğrenci listesi ----
  function tidyName(raw) {
    let clean = String(raw).replace(/\s+/g, " ").trim();
    if (clean && clean === clean.toLocaleUpperCase("tr") && /[A-ZÇĞİÖŞÜ]/.test(clean)) {
      clean = clean.toLocaleLowerCase("tr").split(" ").map((p) => p ? p[0].toLocaleUpperCase("tr") + p.slice(1) : p).join(" ");
    }
    return clean;
  }

  // "12 Ali Yılmaz", "1<TAB>1234<TAB>ALİ<TAB>YILMAZ" ya da yalnız "Ali" biçimlerini okur.
  function parseLine(line) {
    const tokens = String(line).split(/[\t ]+/).map((t) => t.trim()).filter(Boolean);
    let no = "";
    const words = [];
    tokens.forEach((t) => {
      if (/^\d{1,6}[.)]?$/.test(t)) no = t.replace(/\D/g, "");
      else if (!/^[-–.]$/.test(t)) words.push(t);
    });
    return { no, name: tidyName(words.join(" ")) };
  }

  function parseList(text) {
    const src = String(text || "");
    const lines = /\n/.test(src) ? src.split(/\r?\n/) : src.split(/[,;]+/);
    return lines.map(parseLine).filter((p) => p.name);
  }

  function addName(name, no = "") {
    const clean = tidyName(name);
    if (!clean) return false;
    if (clean.length > 40) {
      flash("İsim 40 karakteri geçmesin.");
      return false;
    }
    if (state.students.length >= MAX_STUDENTS) {
      flash("En fazla " + MAX_STUDENTS + " öğrenci eklenebilir.");
      return false;
    }
    const exists = state.students.some((s) => s.name.toLocaleLowerCase("tr") === clean.toLocaleLowerCase("tr"));
    if (exists) {
      flash(clean + " zaten listede.");
      return false;
    }
    const student = {
      id: uid("s"),
      no: String(no || ""),
      name: clean,
      score: 0,
      groupId: null,
      absent: false,
      stars: {},
      stats: blankStats()
    };
    if (state.groups.length) {
      const ranked = [...state.groups].sort((a, b) => members(a.id).length - members(b.id).length);
      student.groupId = ranked[0].id;
    }
    state.students.push(student);
    return true;
  }

  function addMany(text) {
    let n = 0;
    parseList(text).forEach((p) => { if (addName(p.name, p.no)) n += 1; });
    return n;
  }

  function newClass(grade) {
    const c = normalizeClass({ id: uid("c"), grade: grade || 5, section: "", year: schoolYear(), archived: false, createdAt: Date.now(), students: [], groups: [] });
    state.classes[c.id] = c;
    activateClass(c.id);
    state.screen = "manage";
    state.manageTab = "students";
    persist();
  }

  // ---- Gruplar ----
  function groupTemplate(i) {
    return { id: uid("g"), name: GROUP_NAMES[i % GROUP_NAMES.length], icon: GROUP_ICONS[i % GROUP_ICONS.length], color: COLORS[i % COLORS.length], score: 0 };
  }

  function makeGroups(n, mode = "random") {
    const pool = MatGames.shuffle(Math.random, state.students);
    state.groups = Array.from({ length: n }, (_, i) => groupTemplate(i));
    if (mode === "balanced") {
      // Puana göre yılan sırası: 1-2-3-4-4-3-2-1 ... gruplar güç olarak dengelenir.
      pool.sort((a, b) => (b.score || 0) - (a.score || 0));
      pool.forEach((s, i) => {
        const lap = Math.floor(i / n), pos = i % n;
        s.groupId = state.groups[lap % 2 ? n - 1 - pos : pos].id;
      });
    } else pool.forEach((s, i) => { s.groupId = state.groups[i % n].id; });
    state.nextGroup = 0;
    persist();
  }

  // ---- Sıra adaleti: oynayan öğrenci, herkes oynayana kadar tekrar çekilmez ----
  function eligible(list) {
    const here = present(list);
    const notLast = here.length > 1 ? here.filter((s) => s.id !== state.selectedId) : here;
    if (!state.fairTurns) return notLast;
    const fresh = notLast.filter((s) => !state.turnDone.includes(s.id));
    return fresh.length ? fresh : notLast;
  }

  function noteTurn(id) {
    if (!state.turnDone.includes(id)) state.turnDone.push(id);
    const here = present(state.students);
    if (state.fairTurns && here.length > 1 && here.every((s) => state.turnDone.includes(s.id))) {
      state.turnDone = [];
      state.turnRound = (state.turnRound || 1) + 1;
      return true;
    }
    return false;
  }

  function spinPick(list, label, onDone) {
    const pool = eligible(list);
    if (!pool.length || state.spinning) {
      if (!pool.length) flash("Çekilecek öğrenci yok. Yoklamayı kontrol et.");
      return false;
    }
    const resumeAfter = state.phase === "quiz" && !state.paused && !state.locked;
    if (resumeAfter) pauseClock();
    state.spinning = true;
    const final = pool[Math.floor(Math.random() * pool.length)];
    const g = groupById(final.groupId);
    const overlay = document.createElement("div");
    overlay.className = "student-draw";
    overlay.innerHTML = `<div><p>${esc(label || state.className || "Sınıf")}</p><h2></h2><span>çekiliş</span></div>`;
    document.body.appendChild(overlay);
    const nameEl = overlay.querySelector("h2");
    const steps = 22;
    let step = 0;
    let delay = 40;
    const reel = pool.length > 1 ? pool : present(list);
    const tick = () => {
      const show = step >= steps - 1 ? final : reel[step % reel.length];
      nameEl.textContent = show.name;
      MatAudio.tick();
      if (step >= steps - 1) {
        overlay.classList.add("landed");
        overlay.querySelector("span").textContent = g ? g.icon + " " + g.name + " · sıra sende!" : "Sıra sende!";
        state.selectedId = final.id;
        state.lastPick = (label ? label + ": " : "") + final.name;
        state.spinning = false;
        persist();
        MatAudio.fanfare();
        if (state.callout) MatAudio.speak(final.name + ", sıra sende!");
        setTimeout(() => {
          overlay.remove();
          if (resumeAfter && state.phase === "quiz" && !state.locked) resumeClock();
          if (onDone) onDone(final);
          else render();
        }, 1100);
        return;
      }
      step += 1;
      delay += 13;
      setTimeout(tick, delay);
    };
    tick();
    return true;
  }

  function nextGroupPick(onDone) {
    if (!state.groups.length) {
      flash("Önce grupları oluştur.");
      return false;
    }
    const n = state.groups.length;
    const fresh = (g) => present(members(g.id)).some((s) => !state.turnDone.includes(s.id));
    // Herkese sıra açıkken, bu turda herkesi oynamış gruplar atlanır.
    const passes = state.fairTurns ? [fresh, (g) => present(members(g.id)).length] : [(g) => present(members(g.id)).length];
    for (const ok of passes) {
      for (let k = 0; k < n; k++) {
        const idx = (state.nextGroup + k) % n;
        const g = state.groups[idx];
        if (!ok(g)) continue;
        state.nextGroup = (idx + 1) % n;
        return spinPick(members(g.id), g.icon + " " + g.name, onDone);
      }
    }
    flash("Gruplarda burada olan öğrenci yok.");
    return false;
  }

  function autoPick(onDone) {
    if (state.groups.length && state.rotateMode === "group") return nextGroupPick(onDone);
    return spinPick(state.students, state.className || "Sınıf", onDone);
  }

  function currentQ() {
    return state.questions[state.qIndex] || null;
  }

  function blankDraft(q) {
    if (!q) return null;
    if (q.kind === "order") return [];
    if (q.kind === "classify") return {};
    if (q.kind === "dial") return 0;
    if (q.kind === "rect") return { w: 4, h: 3 };
    return "";
  }

  function parseNum(s) {
    const t = String(s ?? "").replace(/\s/g, "").replace(/\./g, "").replace(/,/g, "");
    if (!/^\d+$/.test(t)) return null;
    return Number(t);
  }

  function sampleRect(q) {
    for (let w = 1; w <= 20; w++) {
      for (let h = w; h <= 20; h++) if (MatGames.rectOk(q, w, h)) return w + " ve " + h;
    }
    return "uygun kenarlar";
  }

  // Adım adım çözüm. Üretici "solution" yazdıysa onu kullanır; yazmadıysa açıklamayı cümlelere böler,
  // böylece bütün sorularda (soru bankası dahil) Çözüm düğmesi çalışır.
  function solutionOf(q) {
    if (q.solution && Array.isArray(q.solution.steps) && q.solution.steps.length) return q.solution;
    const parts = String(q.explain || "").split(/(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ0-9(∠|−“])/).map((t) => t.trim()).filter(Boolean);
    const generic = /^(Çizimdeki verilenleri|Verilenleri sıraya|Tanımı ve verilen)/.test(q.hint || "");
    return { idea: q.hint && !generic ? q.hint : "", steps: parts.map((t) => ({ t })) };
  }
  function openSolution(q, review) {
    state.solution = { sol: review ? review.solution : solutionOf(q), prompt: review ? review.prompt : q.prompt, answer: review ? review.answer : showAnswer(q), scene: review ? review.scene : q.scene, step: 0 };
  }
  // Sayıları öne çıkar; HTML varlıklarındaki rakamlara (&#39;) dokunma.
  const solText = (t) => esc(t).replace(/(?<![#\w&])(\d+(?:[.,]\d+)*)/g, '<b class="sn">$1</b>');
  // Yeni açılan adım (ya da cevap kutusu) görünür alana kaydırılır.
  function revealSolutionStep() {
    (window.requestAnimationFrame || setTimeout)(() => document.querySelector(".sol-answer, .sol-step.now")?.scrollIntoView?.({ block: "nearest", behavior: "smooth" }));
  }
  function renderSolution() {
    const so = state.solution;
    if (!so) return "";
    const steps = so.sol.steps, shown = Math.min(so.step, steps.length), done = shown >= steps.length;
    const sceneHtml = so.scene && so.scene.html ? MatVisuals.renderScene(so.scene) : "";
    return `<div class="sol-backdrop" data-act="sol-close"></div>
      <section class="sol-sheet" role="dialog" aria-modal="true" aria-label="Adım adım çözüm">
        <header class="sol-head"><span class="sol-kicker">📖 ADIM ADIM ÇÖZÜM</span><button type="button" class="sol-x" data-act="sol-close" aria-label="Çözümü kapat">✕</button></header>
        <div class="sol-body">
          <div class="sol-question"><p>${esc(so.prompt)}</p>${sceneHtml ? `<div class="sol-scene">${sceneHtml}</div>` : ""}</div>
          <div class="sol-steps">
            ${so.sol.idea ? `<div class="sol-idea"><b>💡 Ana fikir</b><p>${solText(so.sol.idea)}</p></div>` : ""}
            <ol>${steps.slice(0, shown).map((st, i) => `<li class="sol-step${i === shown - 1 ? " now" : ""}"><span class="sol-no">${i + 1}</span><div><p>${solText(st.t)}</p>${st.fig ? `<div class="sol-fig stage art-stage">${st.fig}</div>` : ""}</div></li>`).join("")}</ol>
            ${done ? `<div class="sol-answer">✔ Cevap: <b>${esc(so.answer)}</b></div>` : ""}
          </div>
        </div>
        <footer class="sol-actions">
          <button type="button" class="soft" data-act="sol-prev" ${so.step ? "" : "disabled"}>◀ Geri</button>
          <span class="sol-count">${shown} / ${steps.length} adım</span>
          ${done ? `<button type="button" class="check-btn" data-act="sol-close">Anladım ✔</button>` : `<button type="button" class="soft" data-act="sol-all">Hepsini göster</button><button type="button" class="check-btn" data-act="sol-next">${shown ? "Sonraki adım ▶" : "Çözüme başla ▶"}</button>`}
        </footer>
      </section>`;
  }

  function showAnswer(q) {
    if (q.kind === "mc") return q.answer;
    if (q.kind === "num") return MatGames.groupDigits(q.answer) + (q.unit ? " " + q.unit : "");
    if (q.kind === "slots") return MatGames.groupDigits(q.answer);
    if (q.kind === "dial") return q.target + "°";
    if (q.kind === "rect") return sampleRect(q);
    if (q.kind === "order") {
      const map = Object.fromEntries(q.items.map((it) => [it.id, it.n]));
      return q.answer.map((id) => MatGames.groupDigits(map[id])).join(" → ");
    }
    if (q.kind === "classify") {
      return q.items.map((it) => it.text + ": " + q.buckets[it.bucket]).join(" · ");
    }
    return "";
  }

  function isCorrect(q) {
    if (q.kind === "mc") return state.draft === q.answer;
    if (q.kind === "num") return parseNum(state.draft) === Number(q.answer);
    if (q.kind === "slots") return String(state.draft).replace(/\D/g, "") === String(q.answer);
    if (q.kind === "dial") return Math.abs(Number(state.draft) - q.target) <= (q.tolerance || 4);
    if (q.kind === "rect") return MatGames.rectOk(q, state.draft.w, state.draft.h);
    if (q.kind === "order") return state.draft.join(",") === q.answer.join(",");
    if (q.kind === "classify") return q.items.every((it) => Number(state.draft[it.id]) === it.bucket);
    return false;
  }

  function ready(q) {
    if (q.kind === "mc") return !!state.draft;
    if (q.kind === "num" || q.kind === "slots") return String(state.draft || "").length > 0;
    if (q.kind === "order") return state.draft.length === q.items.length;
    if (q.kind === "classify") return q.items.every((it) => state.draft[it.id] !== undefined);
    return true;
  }

  function burst() {
    const box = document.createElement("div");
    box.className = "confetti";
    const colors = ["#e25b45", "#e2a325", "#2c6bed", "#1c8c74", "#fff4d8"];
    for (let i = 0; i < 26; i++) {
      const bit = document.createElement("i");
      bit.style.left = Math.random() * 100 + "%";
      bit.style.background = colors[i % colors.length];
      bit.style.animationDelay = (Math.random() * 0.15) + "s";
      box.appendChild(bit);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 1300);
  }

  function stopClock() {
    clearInterval(clockTimer);
    clockTimer = 0;
  }

  function cancelRound() {
    if (typeof MatArcade !== "undefined") MatArcade.stop();
    stopClock();
    clearTimeout(revealTimer);
    revealToken += 1;
    state.reveal = null;
    state.paused = false;
    state.phase = "pick";
  }

  function clockText(ms) {
    const secs = Math.max(0, Math.ceil(ms / 1000));
    return String(Math.floor(secs / 60)).padStart(2, "0") + ":" + String(secs % 60).padStart(2, "0");
  }

  function tickClock() {
    if (state.paused || state.locked || state.phase !== "quiz") return;
    state.remainingMs = Math.max(0, state.deadline - Date.now());
    const text = document.getElementById("clockValue");
    const box = document.getElementById("questionClock");
    if (text) text.textContent = clockText(state.remainingMs);
    if (box) {
      box.classList.toggle("urgent", state.remainingMs <= 10000);
      box.style.setProperty("--time-left", state.remainingMs / (state.roundSeconds * 1000));
    }
    if (!state.remainingMs) submit(true);
  }

  function startClock() {
    stopClock();
    state.paused = false;
    state.remainingMs = state.roundSeconds * 1000;
    if (!state.roundSeconds) return;
    state.deadline = Date.now() + state.remainingMs;
    clockTimer = setInterval(tickClock, 100);
    tickClock();
  }

  function pauseClock() {
    if (state.roundSeconds && !state.paused && !state.locked) tickClock();
    state.paused = true;
    stopClock();
  }

  function resumeClock() {
    if (state.locked || state.phase !== "quiz") return;
    state.paused = false;
    if (!state.roundSeconds) return;
    state.deadline = Date.now() + state.remainingMs;
    clockTimer = setInterval(tickClock, 100);
    tickClock();
  }

  function prepareQuestion() {
    stopClock();
    state.locked = false;
    state.feedback = null;
    state.hintOpen = false;
    state.solution = null;
    state.paused = false;
    state.phase = "reveal";
    const token = ++revealToken;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pool = levels();
    // Kaynak soru bankasına çevrildiyse bankada olmayan üst seviye son banka seviyesine iner.
    const level = state.randomLevel ? pool[Math.floor(Math.random() * pool.length)].id : Math.min(state.level, pool[pool.length - 1].id);
    state.reveal = { step: state.randomLevel ? "level" : "question", level: state.randomLevel ? null : level };
    render();
    let frame = 0;
    const showQuestion = () => {
      if (token !== revealToken) return;
      state.level = level;
      const key = state.topicId + ":" + level;
      const gen = unlimited();
      let used = Array.isArray(state.usedQuestions[key]) ? state.usedQuestions[key] : [];
      state.cycleRenewed = !gen && used.length >= MatQuestionBank.perLevel;
      if (state.cycleRenewed) used = [];
      const q = gen ? MatLevelGen.generate(state.topicId, level) : MatGames.buildQuiz(state.topicId, level, Date.now() + Math.random() * 1e6, used, 1)[0];
      state.questions[state.qIndex] = q;
      state.reveal = { step: "question", level };
      render();
      revealTimer = setTimeout(() => {
        if (token !== revealToken) return;
        if (!gen) {
          state.usedQuestions[key] = [...used, q.id];
          persist();
        }
        state.draft = blankDraft(q);
        state.reveal = null;
        state.phase = "quiz";
        startClock();
        render();
        const prompt = document.querySelector(".prompt");
        if (prompt) prompt.focus({ preventScroll: true });
      }, reduced ? 180 : 850);
    };
    if (!state.randomLevel) { showQuestion(); return; }
    const spin = () => {
      if (token !== revealToken) return;
      const cards = document.querySelectorAll(".reveal-level");
      cards.forEach((card, i) => card.classList.toggle("lit", i === frame % levels().length));
      if (frame < (reduced ? 0 : 15)) {
        frame += 1;
        if (frame % 3 === 0) MatAudio.tick();
        revealTimer = setTimeout(spin, 45 + frame * 7);
      } else {
        state.level = level;
        state.reveal = { step: "landed", level };
        render();
        MatAudio.correct();
        revealTimer = setTimeout(showQuestion, reduced ? 200 : 800);
      }
    };
    spin();
  }

  function beginLevel(level) {
    cancelRound();
    state.randomLevel = level === 0;
    state.level = level || 1;
    state.questions = Array(state.roundLength).fill(null);
    state.roundSeconds = state.questionSeconds;
    state.qIndex = 0;
    state.topicTab = "play";
    state.correctCount = 0;
    state.scoreEarned = 0;
    state.review = [];
    state.locked = false;
    state.feedback = null;
    state.hintOpen = false;
    state.solution = null;
    state.gate = null;
    stopAuto();
    prepareQuestion();
  }

  function submit(timedOut = false) {
    const q = currentQ();
    if (!q || state.locked || state.paused || state.spinning || state.phase !== "quiz") return;
    if (!timedOut && state.roundSeconds && Date.now() >= state.deadline) { submit(true); return; }
    if (!timedOut && !ready(q)) {
      flash("Önce cevabı tamamla.");
      return;
    }
    stopClock();
    const ok = !timedOut && isCorrect(q);
    const who = selected();
    const pts = ok ? q.points : 0;
    state.locked = true;
    const counts = !!who && !state.practice;
    state.feedback = { ok, timedOut, explain: q.explain, correctText: showAnswer(q), points: pts, name: who ? who.name : "", awarded: counts };
    state.review.push({ prompt: q.prompt, ok, timedOut, explain: q.explain, studentId: who ? who.id : null, points: who ? pts : 0, level: q.level, solution: solutionOf(q), answer: showAnswer(q), scene: q.scene && q.scene.html ? q.scene : null });
    let newCycle = false;
    if (counts) {
      const st = statsOf(who);
      const g = groupById(who.groupId);
      st.asked += 1;
      if (ok) st.correct += 1;
      else if (timedOut) st.timeout += 1;
      else st.wrong += 1;
      st.points += pts;
      const lv = st.levels[q.level] || (st.levels[q.level] = { a: 0, c: 0 });
      const tp = st.topics[state.topicId] || (st.topics[state.topicId] = { a: 0, c: 0 });
      lv.a += 1; tp.a += 1;
      if (ok) { lv.c += 1; tp.c += 1; }
      who.lastAt = Date.now();
      if (g) {
        g.asked = (g.asked || 0) + 1;
        if (ok) g.correct = (g.correct || 0) + 1;
      }
      if (ok) {
        who.score += pts;
        if (g) g.score = (g.score || 0) + pts;
        state.scoreEarned += pts;
      }
      newCycle = noteTurn(who.id);
      persist();
    }
    if (ok) {
      state.correctCount += 1;
      MatAudio.correct();
      burst();
    } else {
      MatAudio.wrong();
    }
    render();
    if (newCycle) flash("Herkes bir kez oynadı! " + state.turnRound + ". sıra turu başladı.");
  }

  function goNext() {
    if (state.phase !== "quiz" || !state.locked || state.spinning) return;
    const last = state.qIndex + 1 >= state.questions.length;
    // "Her sorudan sonra yeni öğrenci" açıksa sıradaki öğrenci çekilir, soru ondan sonra açılır.
    if (!last && state.autoRotate && present(state.students).length > 1 && autoPick(() => { state.qIndex += 1; prepareQuestion(); })) return;
    state.qIndex += 1;
    if (last) {
      stopClock();
      const ratio = state.correctCount / state.questions.length;
      const stars = ratio === 1 ? 3 : ratio >= .8 ? 2 : ratio >= .4 ? 1 : 0;
      if (!state.practice) state.students.forEach(who => {
        const attempts = state.review.filter(r => r.studentId === who.id);
        if (!attempts.length) return;
        const share = attempts.filter(r => r.ok).length / attempts.length;
        const personalStars = share === 1 ? 3 : share >= .8 ? 2 : share >= .4 ? 1 : 0;
        who.stars = who.stars || {};
        who.stars[state.topicId] = Math.max(who.stars[state.topicId] || 0, personalStars);
      });
      logRound();
      persist();
      state.finishStars = stars;
      state.phase = "finish";
      MatAudio.fanfare();
      render();
      return;
    }
    prepareQuestion();
  }

  // Tur bitince sınıf geçmişine kısa bir özet yazılır (son turlar saklanır).
  function logRound() {
    if (!state.classId || !state.review.length || state.practice) return;
    const players = {};
    state.review.forEach((r) => {
      if (!r.studentId) return;
      const p = players[r.studentId] || (players[r.studentId] = { a: 0, c: 0, p: 0 });
      p.a += 1;
      if (r.ok) p.c += 1;
      p.p += r.points;
    });
    state.history.unshift({ at: Date.now(), topicId: state.topicId, level: state.randomLevel ? 0 : state.level, n: state.review.length, correct: state.review.filter((r) => r.ok).length, points: state.scoreEarned, players });
    if (state.history.length > HISTORY_LIMIT) state.history.length = HISTORY_LIMIT;
  }

  function stopAuto() {
    clearTimeout(autoTimer);
    state.autoplay = false;
    MatAudio.cancelSpeak();
  }

  function currentSlide() {
    const t = topic();
    return t ? t.slides[state.slide] : null;
  }

  function scheduleAuto() {
    clearTimeout(autoTimer);
    if (!state.autoplay || state.topicTab !== "lesson") return;
    const slide = currentSlide();
    if (!slide || slide.sandbox) {
      state.autoplay = false;
      return;
    }
    if (!state.voice) {
      autoTimer = setTimeout(() => nextSlide(), Math.max(6500, slide.p.split(/\s+/).length * 350));
      return;
    }
    MatAudio.speak(slide.p, () => {
      if (state.autoplay) nextSlide();
    });
  }

  function nextSlide() {
    const t = topic();
    if (!t) return;
    clearTimeout(autoTimer);
    MatAudio.cancelSpeak();
    if (state.slide >= t.slides.length - 1) {
      state.autoplay = false;
      render();
      return;
    }
    state.slide += 1;
    if (t.slides[state.slide].sandbox) state.autoplay = false;
    render();
    scheduleAuto();
  }

  function prevSlide() {
    clearTimeout(autoTimer);
    MatAudio.cancelSpeak();
    state.autoplay = false;
    state.slide = Math.max(0, state.slide - 1);
    render();
  }

  function openTopic(id, tab) {
    stopAuto();
    cancelRound();
    state.topicId = id;
    state.screen = "topic";
    state.topicTab = tab || "lesson";
    state.slide = 0;
    state.phase = "pick";
    state.gate = null;
    state.questions = [];
    render();
  }

  function keypadHtml() {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "sil", "0", "geri"];
    return `<div class="keypad">${keys.map((k) => `<button type="button" class="key" data-act="key" data-key="${k}">${k === "sil" ? "Sil" : k === "geri" ? "⌫" : k}</button>`).join("")}</div>`;
  }

  function sandboxHtml(kind) {
    if (kind.startsWith("m7-") && window.Mat7Labs) return Mat7Labs.html(kind);
    if (kind.startsWith("im-") && window.MatImagine) return MatImagine.html(kind, (currentSlide() || {}).imPreset);
    if (kind === "dial") {
      if (isPairLesson()) {
        const total = state.sandbox.pairTotal || 90;
        const deg = Math.min(state.sandbox.deg,total);
        return `<div class="pair-modes" aria-label="Açı ilişkisi">${[90,180].map(n=>`<button type="button" class="${total===n?'solid':'soft'}" aria-pressed="${total===n}" data-act="pair-mode" data-total="${n}">${n===90?'Tümler':'Bütünler'} · ${n}°</button>`).join('')}</div>
          ${MatVisuals.pairSvg(deg,total,!!state.sandbox.hideMissing)}
          <div class="pair-equation" aria-live="off"><span class="pair-first"><small>Verilen açı</small><b id="pairFirst">${deg}°</b></span><strong>+</strong><span class="pair-other"><small>${total===90?'Tümleri':'Bütünleri'}</small><b id="pairOther">${state.sandbox.hideMissing?'?':(total-deg)+'°'}</b></span><strong>=</strong><span><small>Toplam</small><b>${total}°</b></span></div>
          <p class="pair-rule" id="pairRule">${total}° − ${deg}° = ${state.sandbox.hideMissing?'?':(total-deg)+'°'}</p>
          <div class="pair-answer-tools"><button type="button" class="${state.sandbox.hideMissing?'solid':'soft'}" data-act="pair-hide">${state.sandbox.hideMissing?'Cevabı göster':'Öğrenciye sor · ölçüyü gizle'}</button>${state.sandbox.hideMissing?'<span>Öğrenci cevabını söyledikten sonra göster düğmesine bas.</span>':''}</div>
          <div class="angle-presets">${[30,40,60,90,130,150].filter(n=>n<=total).map(n=>`<button type="button" class="soft" data-act="angle-to" data-deg="${n}">${n}°</button>`).join('')}</div>
          <div class="angle-entry"><label for="lessonAngle">Turuncu açıyı belirle (0–${total}°)</label><div class="row"><input id="lessonAngle" type="number" min="0" max="${total}" step="1" required value="${deg}"><button type="button" class="solid" data-act="angle-apply">Açıyı göster →</button></div></div>
          <p id="angleMotion" class="fine" role="status">Kırmızı kolu hareket ettir: turuncu açı büyürken yeşil açı küçülür. Toplam hep ${total}° kalır.</p>
          <p class="fine">Birlikte görmek için açıları yan yana çizdik; tümler veya bütünler açıların komşu olması gerekmez. 0° ve ${total}° sınır durumlarını da deneyebilirsin.</p>`;
      }
      return `${MatVisuals.dialSvg(state.sandbox.deg)}<p class="dial-read" id="dialRead">${state.sandbox.deg}°</p><p id="angleKind" class="angle-kind">${angleKind(state.sandbox.deg)}</p>
        <div class="angle-presets">${[0,30,60,90,120,130,180].map(deg=>`<button type="button" class="soft" data-act="angle-to" data-deg="${deg}">${deg}°</button>`).join('')}</div>
        <div class="angle-entry"><label for="lessonAngle">Açıyı sen belirle (0–180°)</label><div class="row"><input id="lessonAngle" type="number" min="0" max="180" step="1" required value="${state.sandbox.deg}"><button type="button" class="solid" data-act="angle-apply">Açıyı göster →</button></div></div>
        <p class="fine" id="angleMotion" role="status">Bir derece seç veya sayı yazıp Enter'a bas. Kırmızı kolun dönüşünü izle. Işını sürükleyerek de değiştirebilirsin.</p>`;
    }
    if (kind === "circle") {
      const r = state.sandbox.r;
      return `<div id="circlePreview">${MatVisuals.renderScene({ kind: "circle", r: 28 + r * 8, radiusLabel: "r = " + r, diameterLabel: "R = " + (2 * r) })}</div>
        <label>Yarıçap: <b id="rLabel">${r}</b> cm</label>
        <input id="cr" type="range" min="1" max="12" value="${r}">
        <p class="say">Çap her zaman yarıçapın iki katıdır: <b>${2 * r} cm</b></p>`;
    }
    if (kind === "rect") {
      const w = state.sandbox.w;
      const h = state.sandbox.h;
      return `<div id="rectPreview">${MatVisuals.renderScene({ kind: "grid", cols: w, rows: h, count: true })}</div>
        <div class="sliders">
          <label>Kenar 1: <b id="wLabel">${w}</b><input id="rw" type="range" min="1" max="12" value="${w}"></label>
          <label>Kenar 2: <b id="hLabel">${h}</b><input id="rh" type="range" min="1" max="12" value="${h}"></label>
        </div>
        <p class="statline" id="rectStats">Çevre = <b>${2 * (w + h)}</b> · Alan = <b>${w * h}</b></p>`;
    }
    const digits = state.sandbox.digits;
    const shown = digits ? MatGames.groupDigits(digits) : "…";
    const said = digits ? MatGames.sayNumber(digits) : "Rakamları tuşla.";
    return `<p class="readout" id="slotView">${esc(shown)}</p><p class="reading" id="sayView">${esc(said)}</p>
      <div id="readTable">${MatVisuals.renderScene({ kind: "place", digits })}</div>${keypadHtml()}`;
  }

  function toolHtml(q) {
    if (q.kind === "dial") {
      return `${MatVisuals.dialSvg(Number(state.draft) || 0)}<p class="dial-read" id="dialRead">${Number(state.draft) || 0}°</p>`;
    }
    if (q.kind === "rect") {
      const w = state.draft.w;
      const h = state.draft.h;
      const P = 2 * (w + h);
      const A = w * h;
      const goal = q.mode === "area" ? "Hedef alan " + q.target : q.mode === "perim" ? "Hedef çevre " + q.target : "Hedef alan " + q.area + ", çevre " + q.perim;
      return `<p class="kicker">${goal}</p><div id="rectPreview">${MatVisuals.renderScene({ kind: "grid", cols: w, rows: h })}</div>
        <div class="sliders">
          <label>Kenar 1: <b id="wLabel">${w}</b><input id="rw" type="range" min="1" max="20" value="${w}"></label>
          <label>Kenar 2: <b id="hLabel">${h}</b><input id="rh" type="range" min="1" max="20" value="${h}"></label>
        </div>
        <p class="statline" id="rectStats">Çevre = <b class="${q.mode !== "area" && P === (q.mode === "perim" ? q.target : q.perim) ? "hit" : ""}">${P}</b>
          · Alan = <b class="${q.mode !== "perim" && A === (q.mode === "area" ? q.target : q.area) ? "hit" : ""}">${A}</b></p>`;
    }
    if (q.kind === "slots") {
      const shown = state.draft ? MatGames.groupDigits(state.draft) : "…";
      return `${q.reading ? `<p class="reading">${esc(q.reading)}</p>` : ""}<p class="readout" id="slotView">${esc(shown)}</p>${keypadHtml()}`;
    }
    if (q.kind === "num") {
      const shown = state.draft ? MatGames.groupDigits(state.draft) : "…";
      return `<p class="readout" id="slotView">${esc(shown)}${q.unit ? " " + esc(q.unit) : ""}</p>${keypadHtml()}`;
    }
    if (q.kind === "order") {
      const chosen = state.draft.map((id) => q.items.find((it) => it.id === id)).filter(Boolean);
      const left = q.items.filter((it) => !state.draft.includes(it.id));
      return `<div class="order-tray"><span class="fine">Sıra:</span>${chosen.map((it) => `<span class="chip">${esc(MatGames.groupDigits(it.n))}</span>`).join("") || "<span class='fine'>boş</span>"}</div>
        <div class="order-tray">${left.map((it) => `<button type="button" class="order-btn" data-act="order-add" data-id="${esc(it.id)}">${esc(MatGames.groupDigits(it.n))}</button>`).join("")}</div>
        <button type="button" class="soft" data-act="order-undo">Geri al</button>`;
    }
    if (q.kind === "classify") {
      return q.items.map((it) => `<div class="classify-row"><b>${esc(it.text)}</b>${q.buckets.map((b, i) => `<button type="button" class="bucket ${Number(state.draft[it.id]) === i ? "on" : ""}" data-act="bucket" data-id="${esc(it.id)}" data-bucket="${i}">${esc(b)}</button>`).join("")}</div>`).join("");
    }
    return "";
  }

  function choiceHtml(q) {
    return `<div class="choices">${q.choices.map((c, i) => {
      let cls = "choice";
      if (state.locked && c === q.answer) cls += " right";
      else if (state.locked && c === state.draft && c !== q.answer) cls += " wrong";
      else if (!state.locked && c === state.draft) cls += " on";
      return `<button type="button" class="${cls}" data-act="choice" data-i="${i}" ${state.locked ? "disabled" : ""}><span class="choice-letter" aria-hidden="true">${String.fromCharCode(65+i)}</span><span>${esc(c)}</span>${state.locked && c === q.answer ? '<span aria-label="Doğru cevap">✓</span>' : ''}</button>`;
    }).join("")}</div>`;
  }

  function syncText(s) {
    if (!cloud || localMode) return "💾 Bu cihazda";
    return ({ saving: "⟳ Kaydediliyor…", saved: "☁ Kaydedildi", offline: "☁ Çevrimdışı · sonra eşitlenecek", error: "⚠ Kaydedilemedi", denied: "⚠ Bulut izni yok" })[s] || "☁ Bulut";
  }

  function flashHtml() {
    return state.flash ? `<div class="flash" role="status">${esc(state.flash)}</div>` : "";
  }

  function isGameMode() {
    return state.screen === "topic" && state.topicTab === "play" && ["reveal", "quiz", "finish", "arcade"].includes(state.phase);
  }

  function header() {
    const status = cloud && !localMode ? cloud.status : "local";
    const nav = state.classId ? [
      `<button class="solid tournament-nav" type="button" data-act="goto-tournament">🏆 Turnuva</button>`,
      state.screen !== "board" ? `<button class="ghost" type="button" data-act="goto-board">📚 Konular</button>` : "",
      state.screen !== "manage" ? `<button class="ghost" type="button" data-act="goto-manage">👥 Sınıf yönetimi</button>` : ""
    ].join("") : "";
    return `<header class="topbar">
      <div class="brand">
        <svg class="anka" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="36" cy="40" r="16" fill="#e25b45"/>
          <circle cx="24" cy="24" r="12" fill="#f0b36a"/>
          <circle cx="20" cy="22" r="2.2" fill="#1b2430"/>
          <path d="M8 22 L22 26 L10 32 Z" fill="#e2a325"/>
          <path d="M30 52 l-4 8 M40 52 l6 8" stroke="#f6f1e4" stroke-width="2" fill="none"/>
        </svg>
        <div><h1>Matematik Atölyesi</h1><small>${state.classId ? state.grade + ". sınıf · " + esc(state.year) : "Öğretmen paneli"}</small></div>
      </div>
      ${state.classId ? `<button class="class-pill" type="button" data-act="goto-classes" title="Sınıf değiştir">${esc(state.className)} · ${present(state.students).length}/${state.students.length} öğrenci <span aria-hidden="true">▾</span></button>` : `<button class="class-pill" type="button" data-act="goto-classes">Sınıflarım</button>`}
      <span class="sync-state" id="syncState" data-s="${status}">${syncText(status)}</span>
      <div class="top-actions">
        ${nav}
        <button class="ghost" type="button" data-act="toggle-music" aria-pressed="${MatAudio.musicEnabled}">♫ Müzik ${MatAudio.musicEnabled ? "açık" : "kapalı"}</button>
        ${state.tahta && state.screen === "topic" ? `<button class="ghost" type="button" data-act="tahta" aria-pressed="true">Tahta modunu kapat</button>` : ""}
        <button class="ghost practice-btn ${state.practice ? "on" : ""}" type="button" data-act="toggle-practice" title="Antrenman modunda puan ve istatistik yazılmaz" aria-pressed="${state.practice}">🏋️ ${state.practice ? "Antrenman açık" : "Antrenman"}</button>
        <button class="ghost icon" type="button" data-act="toggle-voice" title="${state.voice ? "Sesli anlatım açık" : "Sesli anlatım kapalı"}" aria-label="${state.voice ? "Sesli anlatımı kapat" : "Sesli anlatımı aç"}">${state.voice ? "🗣️" : "🤐"}</button>
        <button class="ghost icon" type="button" data-act="toggle-mute" title="${state.muted ? "Efektler kapalı" : "Efektler açık"}" aria-label="${state.muted ? "Sesi aç" : "Sesi kapat"}">${state.muted ? "🔇" : "🔊"}</button>
        <button class="ghost icon" type="button" data-act="fullscreen" title="Tam ekran" aria-label="Tam ekran">⛶</button>
        ${cloud && !localMode ? `<button class="ghost icon" type="button" data-act="open-password" title="Şifreyi değiştir" aria-label="Şifreyi değiştir">🔑</button>` : ""}
        <button class="ghost logout-button" type="button" data-act="logout">Çıkış</button>
      </div>
    </header>`;
  }

  function classBadge(c, big) {
    return `<div class="class-badge ${big ? "big" : ""}" style="--gc:${GRADE_COLORS[c.grade]}"><b>${c.grade}</b><small>${esc(c.section || "–")}</small></div>`;
  }

  function fDate(ms, withTime) {
    if (!ms) return "—";
    const d = new Date(ms);
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) + (withTime ? " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "");
  }

  function renderClasses() {
    const all = Object.values(state.classes);
    const list = all.filter((c) => (state.showArchived || !c.archived) && (!state.classFilter || c.grade === state.classFilter));
    const years = [...new Set(list.map((c) => c.year))].sort().reverse();
    const archivedCount = all.filter((c) => c.archived).length;
    const card = (c) => {
      const top = [...c.students].sort((a, b) => b.score - a.score)[0];
      const last = c.history && c.history[0] ? c.history[0].at : c.updatedAt;
      return `<article class="class-card ${c.archived ? "is-archived" : ""} ${c.id === state.classId ? "is-current" : ""}" style="--gc:${GRADE_COLORS[c.grade]}">
        ${classBadge(c)}
        <div class="class-info"><h4>${esc(classLabel(c))}</h4>
          <p>${c.students.length} öğrenci · ${c.groups.length ? c.groups.length + " grup" : "grupsuz"}</p>
          <p class="fine">${top && top.score ? "🏆 " + esc(top.name) + " · " + top.score + " puan" : "Henüz puan yok"}</p>
          <p class="fine">Son işlem: ${fDate(last)}${c.archived ? " · arşivde" : ""}</p></div>
        <div class="class-actions">
          <button class="solid" type="button" data-act="open-class" data-id="${c.id}">Derse başla</button>
          <button class="soft" type="button" data-act="manage-class" data-id="${c.id}">Yönet</button>
        </div>
      </article>`;
    };
    const byGradeSection = (a, b) => a.grade - b.grade || String(a.section).localeCompare(String(b.section), "tr");
    return `${header()}<main class="shell">${flashHtml()}
      <section class="classes-hero">
        <div><p class="kicker">Öğretmen paneli</p><h2>Sınıflarım</h2>
          <p class="lede">Her yıl yeni sınıflarını ekle. Geçmiş yılların listeleri, puanları ve raporları ${cloud && !localMode ? "Firebase'de güvenle" : "bu cihazda"} saklanır.</p></div>
        <div class="new-class"><span>＋ Yeni sınıf oluştur</span><div>${GRADES.map((g) => `<button class="grade-btn" type="button" style="--gc:${GRADE_COLORS[g]}" data-act="new-class" data-grade="${g}"><b>${g}</b>. sınıf</button>`).join("")}</div></div>
      </section>
      <div class="class-filters" role="group" aria-label="Sınıf seviyesine göre süz">
        ${[0, ...GRADES].map((g) => `<button type="button" class="filter-chip ${state.classFilter === g ? "on" : ""}" data-act="class-filter" data-grade="${g}">${g ? g + ". sınıflar" : "Tümü"}</button>`).join("")}
        ${archivedCount ? `<button type="button" class="filter-chip ${state.showArchived ? "on" : ""}" data-act="toggle-archived">🗄 Arşiv (${archivedCount})</button>` : ""}
      </div>
      ${years.map((y) => `<section class="year-block"><h3>${esc(y)} eğitim yılı ${y === schoolYear() ? `<span class="now-tag">Bu yıl</span>` : ""}</h3>
        <div class="class-grid">${list.filter((c) => c.year === y).sort(byGradeSection).map(card).join("")}</div></section>`).join("")}
      ${!list.length ? `<div class="empty-state"><div class="empty-art" aria-hidden="true">🏫</div><h3>${all.length ? "Bu süzgeçte sınıf yok" : "Henüz sınıf eklemedin"}</h3>
        <p>Yukarıdan sınıf seviyesini seç, şubeyi yaz ve öğrenci listeni yapıştır.</p>
        ${all.length ? "" : `<button class="soft" type="button" data-act="load-demo">Örnek 5/A sınıfıyla dene</button>`}</div>` : ""}
    </main>`;
  }

  function manageTabsHtml() {
    const tabs = [["students", "👧 Öğrenciler"], ["groups", "👥 Gruplar"], ["ranking", "🏆 Sıralama"], ["report", "📊 Rapor"]];
    return `<nav class="manage-tabs" role="tablist">${tabs.map(([id, label]) => `<button type="button" role="tab" aria-selected="${state.manageTab === id}" class="${state.manageTab === id ? "on" : ""}" data-act="manage-tab" data-tab="${id}">${label}</button>`).join("")}</nav>`;
  }

  function yearOptions() {
    const now = Number(schoolYear().slice(0, 4));
    const years = new Set([state.year]);
    for (let y = now - 3; y <= now + 1; y++) years.add(y + "-" + (y + 1));
    return [...years].sort().map((y) => `<option value="${y}" ${y === state.year ? "selected" : ""}>${y}</option>`).join("");
  }

  function groupSelect(s) {
    return `<select class="cell-select" data-field="group" data-id="${esc(s.id)}" aria-label="${esc(s.name)} grubu"><option value="">Grupsuz</option>${state.groups.map((g) => `<option value="${g.id}" ${s.groupId === g.id ? "selected" : ""}>${g.icon} ${esc(g.name)}</option>`).join("")}</select>`;
  }

  function renderStudentsTab() {
    return `<div class="mgrid">
      <section class="card info-card">
        <h3>Sınıf bilgisi</h3>
        <label>Sınıf seviyesi</label>
        <div class="grade-row">${GRADES.map((g) => `<button type="button" class="grade-pill ${state.grade === g ? "on" : ""}" style="--gc:${GRADE_COLORS[g]}" data-act="set-grade" data-grade="${g}">${g}. sınıf</button>`).join("")}</div>
        <div class="two">
          <div><label for="classSection">Şube</label><input id="classSection" type="text" maxlength="12" placeholder="A" value="${esc(state.section)}"></div>
          <div><label for="classYear">Eğitim yılı</label><select id="classYear">${yearOptions()}</select></div>
        </div>
        ${![5, 7].includes(state.grade) ? `<p class="note">Anlatım ve soru bankası şu an 5. sınıf 1. kitap konularını kapsar. ${state.grade}. sınıflarla da bu konularla tekrar ve yarışma yapabilirsin.</p>` : ""}
      </section>
      <section class="card paste-card">
        <h3>Öğrenci ekle</h3>
        <label for="nameDump">Listeyi yapıştır <span class="fine">· e-Okul, Excel veya düz liste</span></label>
        <textarea id="nameDump" placeholder="123 Ali Yılmaz&#10;124 ZEYNEP KAYA&#10;Mert Demir"></textarea>
        <p class="fine" id="dumpPreview">Her satıra bir öğrenci. Okul numarası varsa ayrılır, BÜYÜK HARFLİ isimler düzeltilir.</p>
        <div class="actions"><button class="solid" type="button" data-act="add-list">Listeye ekle</button></div>
        <label for="oneName">Tek öğrenci</label>
        <div class="row"><input id="oneNo" class="no-input" type="text" inputmode="numeric" maxlength="6" placeholder="No"><input id="oneName" type="text" maxlength="40" placeholder="Ad Soyad"><button class="solid" type="button" data-act="add-one">Ekle</button></div>
      </section>
    </div>
    <section class="card roster">
      <div class="roster-head"><h3>Öğrenci listesi <span class="count">${state.students.length}</span></h3>
        <div class="actions">
          <button class="soft" type="button" data-act="sort-roster" data-by="no">No sırası</button>
          <button class="soft" type="button" data-act="sort-roster" data-by="name">A → Z</button>
          <button class="soft" type="button" data-act="all-present">✓ Herkes burada</button>
        </div></div>
      ${state.students.length ? `<div class="table-wrap"><table class="roster-table"><thead><tr><th>#</th><th>No</th><th>Ad Soyad</th><th>Grup</th><th>Bugün</th><th>Puan</th><th><span class="sr-only">Sil</span></th></tr></thead><tbody>
        ${state.students.map((s, i) => `<tr class="${s.absent ? "is-absent" : ""}">
          <td class="num">${i + 1}</td>
          <td><input class="cell-input no" type="text" inputmode="numeric" maxlength="6" data-field="no" data-id="${esc(s.id)}" value="${esc(s.no || "")}" aria-label="${esc(s.name)} okul numarası"></td>
          <td><input class="cell-input" type="text" maxlength="40" data-field="name" data-id="${esc(s.id)}" value="${esc(s.name)}" aria-label="Öğrenci adı"></td>
          <td>${groupSelect(s)}</td>
          <td><button type="button" class="presence ${s.absent ? "off" : "on"}" data-act="toggle-absent" data-id="${esc(s.id)}">${s.absent ? "✕ Yok" : "✓ Burada"}</button></td>
          <td class="num">${s.score}</td>
          <td><button type="button" class="icon-btn" data-act="remove-student" data-id="${esc(s.id)}" aria-label="${esc(s.name)} öğrencisini sil">✕</button></td>
        </tr>`).join("")}
      </tbody></table></div>` : `<div class="empty-state small"><div class="empty-art" aria-hidden="true">🧒</div><p>Liste boş. Yukarıya isimleri yapıştır.</p></div>`}
    </section>
    <section class="card danger-zone"><h3>Sınıf işlemleri</h3>
      <div class="actions">
        <button class="danger" type="button" data-act="reset-scores">Puanları sıfırla</button>
        <button class="danger" type="button" data-act="reset-stats">Puan + istatistikleri sıfırla</button>
        <button class="soft" type="button" data-act="archive-class" data-id="${state.classId}">${state.archived ? "Arşivden çıkar" : "🗄 Arşivle"}</button>
        <button class="danger" type="button" data-act="delete-class" data-id="${state.classId}">Sınıfı sil</button>
      </div>
      <p class="fine">Puanları sıfırlamak çözülen soru sayılarını korur. Arşivlenen sınıf silinmez; Sınıflarım ekranında “Arşiv” süzgeciyle görünür.</p>
    </section>`;
  }

  function memberChip(s) {
    return `<button type="button" class="mchip ${s.absent ? "is-absent" : ""} ${state.moveId === s.id ? "moving" : ""}" draggable="true" data-drag="${esc(s.id)}" data-act="pick-move" data-id="${esc(s.id)}">${esc(s.name)}${s.absent ? " · yok" : ""}</button>`;
  }

  function renderGroupsTab() {
    const loose = state.students.filter((s) => !s.groupId);
    const mover = state.students.find((s) => s.id === state.moveId);
    return `<section class="card group-builder">
        <div class="builder-row"><span>Grup sayısı</span><div class="num-pills">${[2, 3, 4, 5, 6, 7, 8].map((n) => `<button type="button" class="${state.groupCount === n ? "on" : ""}" data-act="set-group-count" data-n="${n}">${n}</button>`).join("")}</div></div>
        <div class="builder-row"><span>Dağıtım</span><div class="seg">
          <button type="button" class="${state.groupMode === "random" ? "on" : ""}" data-act="set-group-mode" data-mode="random">🎲 Rastgele</button>
          <button type="button" class="${state.groupMode === "balanced" ? "on" : ""}" data-act="set-group-mode" data-mode="balanced">⚖️ Dengeli · puana göre</button></div></div>
        <div class="actions">
          <button class="solid" type="button" data-act="make-groups">${state.groups.length ? "Grupları yeniden kur" : "Grupları oluştur"}</button>
          <button class="soft" type="button" data-act="add-group">＋ Boş grup ekle</button>
          ${state.groups.length ? `<button class="soft" type="button" data-act="reset-group-scores">Grup puanlarını sıfırla</button><button class="danger" type="button" data-act="clear-groups">Grupları kaldır</button>` : ""}
        </div>
        <p class="fine">Dengeli dağıtım öğrencileri puanlarına göre yılan sırasıyla dağıtır; böylece her grupta hem güçlü hem gelişen öğrenciler olur. Grup puanı, öğrenci o gruptayken kazandığı puanlardan oluşur.</p>
      </section>
      ${mover ? `<div class="move-banner">✋ <b>${esc(mover.name)}</b> taşınıyor. Hedef gruba dokun. <button type="button" class="mini" data-act="cancel-move">Vazgeç</button></div>` : state.groups.length ? `<p class="fine hint-line">İpucu: Öğrenciyi başka gruba taşımak için adını sürükle ya da adına dokunup hedef gruba dokun.</p>` : ""}
      <div class="group-board">
        ${state.groups.map((g) => {
          const list = members(g.id);
          const avg = list.length ? Math.round(groupScore(g.id) / list.length) : 0;
          return `<article class="gcard ${mover ? "drop-ready" : ""}" data-drop="${g.id}" style="--gc:${g.color}">
            <header>
              <button type="button" class="g-icon" data-act="cycle-icon" data-gid="${g.id}" title="Simgeyi değiştir" aria-label="Simgeyi değiştir">${g.icon}</button>
              <input class="g-name" type="text" maxlength="24" data-gid="${g.id}" value="${esc(g.name)}" aria-label="Grup adı">
              <button type="button" class="icon-btn" data-act="delete-group" data-gid="${g.id}" aria-label="${esc(g.name)} grubunu sil">🗑</button>
            </header>
            <div class="g-colors">${COLORS.map((c) => `<button type="button" class="dot ${c === g.color ? "on" : ""}" style="background:${c}" data-act="group-color" data-gid="${g.id}" data-color="${c}" aria-label="Renk ${c}"></button>`).join("")}</div>
            <div class="g-score"><b>${groupScore(g.id)}</b><span>puan · ${list.length} kişi · kişi başı ${avg}</span>
              <span class="adj"><button type="button" class="mini" data-act="group-points" data-gid="${g.id}" data-d="-5">−5</button><button type="button" class="mini" data-act="group-points" data-gid="${g.id}" data-d="5">+5</button></span></div>
            <div class="g-members">${list.map(memberChip).join("") || `<span class="fine">Boş grup</span>`}</div>
            ${mover && mover.groupId !== g.id ? `<button type="button" class="drop-btn" data-act="drop-move" data-gid="${g.id}">⬇ Buraya taşı</button>` : ""}
          </article>`;
        }).join("")}
        ${state.groups.length && (loose.length || mover) ? `<article class="gcard loose ${mover ? "drop-ready" : ""}" data-drop="">
          <header><span class="g-icon" aria-hidden="true">🧺</span><h4>Grupsuz</h4></header>
          <div class="g-members">${loose.map(memberChip).join("") || `<span class="fine">Herkes bir grupta</span>`}</div>
          ${mover && mover.groupId ? `<button type="button" class="drop-btn" data-act="drop-move" data-gid="">⬇ Gruptan çıkar</button>` : ""}
        </article>` : ""}
      </div>
      ${!state.groups.length ? `<div class="empty-state small"><div class="empty-art" aria-hidden="true">👥</div><p>Henüz grup yok. Grup sayısını ve dağıtımı seçip “Grupları oluştur”a bas.</p></div>` : ""}`;
  }

  function podiumHtml(items) {
    const order = [items[1], items[0], items[2]];
    const medal = ["🥈", "🥇", "🥉"];
    const place = [2, 1, 3];
    return `<div class="podium">${order.map((it, i) => it ? `<div class="pod pod-${place[i]}" style="--gc:${it.color || "#e2a325"}">
      <div class="pod-avatar">${it.icon || esc(initials(it.name))}</div><b>${esc(it.name)}</b><span>${it.score} puan</span>
      <div class="pod-step"><span>${medal[i]}</span>${place[i]}</div></div>` : `<div class="pod pod-${place[i]} empty"></div>`).join("")}</div>`;
  }

  function renderRankingTab() {
    const groupsView = state.rankView === "groups" && state.groups.length;
    const items = groupsView
      ? [...state.groups].map((g) => ({ name: g.name, icon: g.icon, color: g.color, score: groupScore(g.id), sub: members(g.id).length + " kişi · " + rate(g.correct || 0, g.asked || 0) + "% doğru" })).sort((a, b) => b.score - a.score)
      : [...state.students].map((s) => {
          const st = statsOf(s);
          const g = groupById(s.groupId);
          return { name: s.name, color: g ? g.color : "", score: s.score, sub: "★ " + (s.tournamentStars || 0) + " turnuva / 🏆 " + Math.floor((s.tournamentStars || 0) / 3) + " kupa · " + st.asked + " soru · " + rate(st.correct, st.asked) + "% doğru" + (g ? " · " + g.icon + " " + g.name : "") };
        }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "tr"));
    const max = Math.max(1, ...items.map((i) => i.score));
    return `<div class="rank-toolbar"><div class="seg">
        <button type="button" class="${!groupsView ? "on" : ""}" data-act="rank-view" data-view="students">👧 Öğrenciler</button>
        <button type="button" class="${groupsView ? "on" : ""}" data-act="rank-view" data-view="groups" ${state.groups.length ? "" : "disabled"}>👥 Gruplar</button></div>
        <button type="button" class="soft" data-act="fullscreen">⛶ Tahtada göster</button></div>
      <section class="card rank-card">
        ${items.length ? podiumHtml(items) : `<div class="empty-state small"><p>Sıralama için öğrenci ekle.</p></div>`}
        <ol class="rank-list">${items.map((it, i) => `<li style="--gc:${it.color || "#2c6bed"};--w:${Math.round(100 * it.score / max)}%">
          <span class="rank-no">${i + 1}</span><span class="rank-name"><b>${it.icon ? it.icon + " " : ""}${esc(it.name)}</b><small>${esc(it.sub)}</small></span>
          <span class="rank-bar"><i></i></span><b class="rank-score">${it.score}</b></li>`).join("")}</ol>
      </section>`;
  }

  function reportRows() {
    const rows = state.students.map((s) => {
      const st = statsOf(s);
      const g = groupById(s.groupId);
      return { s, g, st, acc: rate(st.correct, st.asked) };
    });
    const by = state.reportSort;
    const key = { no: (r) => Number(r.s.no) || 1e9, name: (r) => r.s.name, asked: (r) => -r.st.asked, correct: (r) => -r.st.correct, acc: (r) => -r.acc, score: (r) => -r.s.score, last: (r) => -(r.s.lastAt || 0) }[by] || ((r) => -r.s.score);
    return rows.sort((a, b) => {
      const x = key(a), y = key(b);
      return typeof x === "string" ? x.localeCompare(y, "tr") : x - y || a.s.name.localeCompare(b.s.name, "tr");
    });
  }

  function renderReportTab() {
    const rows = reportRows();
    const asked = rows.reduce((n, r) => n + r.st.asked, 0);
    const correct = rows.reduce((n, r) => n + r.st.correct, 0);
    const idle = rows.filter((r) => !r.st.asked && !r.s.absent);
    const busiest = [...rows].sort((a, b) => b.st.asked - a.st.asked)[0];
    const th = (id, label) => `<th><button type="button" class="sort-btn ${state.reportSort === id ? "on" : ""}" data-act="report-sort" data-by="${id}">${label}${state.reportSort === id ? " ▾" : ""}</button></th>`;
    const titleOf = (id) => ((window.MatCurricula ? Object.values(MatCurricula).flatMap(c => c.topics) : curriculum().topics).find((t) => t.id === id) || { title: id }).title;
    const levelName = (id) => typeof id === "string" ? id : id === 0 ? "Rastgele" : (MatGames.LEVELS.find((l) => l.id === id) || { name: "" }).name;
    return `<div class="stat-cards">
        <div class="stat"><small>Çözülen soru</small><b>${fNumber(asked)}</b></div>
        <div class="stat"><small>Doğru oranı</small><b>${rate(correct, asked)}%</b></div>
        <div class="stat"><small>Oynanan tur</small><b>${state.history.length}</b></div>
        <div class="stat"><small>En çok çözen</small><b class="small">${busiest && busiest.st.asked ? esc(busiest.s.name) + " · " + busiest.st.asked : "—"}</b></div>
      </div>
      ${idle.length ? `<section class="card idle-card"><h3>🙋 Henüz soru çözmeyenler <span class="count">${idle.length}</span></h3><p class="fine">“Herkese sıra gelsin” açıkken çekilişler önce bu öğrencilere gider.</p><div class="chips">${idle.map((r) => `<span class="chip">${esc(r.s.name)}</span>`).join("")}</div></section>` : ""}
      <section class="card">
        <div class="roster-head"><h3>Öğrenci raporu</h3><div class="actions"><button class="soft" type="button" data-act="export-csv">⬇ Excel (CSV) indir</button></div></div>
        <div class="table-wrap"><table class="report-table"><thead><tr>${th("no", "No")}${th("name", "Ad Soyad")}<th>Grup</th>${th("asked", "Soru")}${th("correct", "Doğru")}<th>Yanlış</th><th>Süre</th>${th("acc", "Başarı")}${th("score", "Puan")}${th("last", "Son oyun")}</tr></thead><tbody>
        ${rows.map((r) => `<tr class="clickable ${state.reportOpen === r.s.id ? "open" : ""}" data-act="report-open" data-id="${esc(r.s.id)}">
          <td class="num">${esc(r.s.no || "")}</td><td><b>${esc(r.s.name)}</b>${r.s.absent ? ` <span class="tag">bugün yok</span>` : ""}</td><td>${r.g ? r.g.icon + " " + esc(r.g.name) : "—"}</td>
          <td class="num">${r.st.asked}</td><td class="num ok">${r.st.correct}</td><td class="num bad">${r.st.wrong}</td><td class="num">${r.st.timeout}</td>
          <td><span class="acc" style="--w:${r.acc}%"><i></i>${r.st.asked ? r.acc + "%" : "—"}</span></td><td class="num"><b>${r.s.score}</b></td><td>${fDate(r.s.lastAt)}</td></tr>
          ${state.reportOpen === r.s.id ? `<tr class="detail"><td colspan="10"><div class="detail-grid">
            <div><h4>Seviyelere göre</h4>${MatGames.LEVELS.map((l) => { const v = r.st.levels[l.id] || { a: 0, c: 0 }; return `<p><span class="level-badge" style="--level-color:${l.color}">${l.icon} ${esc(l.name)}</span> ${v.c}/${v.a} doğru</p>`; }).join("")}</div>
            <div><h4>Konulara göre</h4>${Object.keys(r.st.topics).length ? Object.entries(r.st.topics).sort((a, b) => b[1].a - a[1].a).map(([id, v]) => `<p>${esc(titleOf(id))}: <b>${v.c}/${v.a}</b> <span class="fine">(${rate(v.c, v.a)}%)</span></p>`).join("") : `<p class="fine">Henüz soru çözmedi.</p>`}</div>
            <div><h4>Öğretmen puanı</h4><p class="fine">Davranış, katılım veya tahtadaki çözüm için elle puan ver.</p><div class="actions">${[-10, -5, 5, 10].map((d) => `<button type="button" class="mini" data-act="student-points" data-id="${esc(r.s.id)}" data-d="${d}">${d > 0 ? "+" + d : "−" + Math.abs(d)}</button>`).join("")}</div></div>
          </div></td></tr>` : ""}`).join("")}
        </tbody></table></div>
      </section>
      <section class="card"><h3>Son turlar</h3>
        ${state.history.length ? `<ul class="history">${state.history.slice(0, 25).map((h) => `<li><span class="h-date">${fDate(h.at, true)}</span><b>${esc(titleOf(h.topicId))}</b><span>${esc(levelName(h.level))}</span><span>${h.correct}/${h.n} doğru</span><span>+${h.points} puan</span><span class="fine">${Object.keys(h.players || {}).map((id) => (state.students.find((s) => s.id === id) || { name: "?" }).name).join(", ") || "puansız"}</span></li>`).join("")}</ul>` : `<p class="fine">Tamamlanan turlar burada listelenir.</p>`}
      </section>`;
  }

  function renderManage() {
    if (!state.classId) {
      state.screen = "classes";
      return renderClasses();
    }
    const body = state.manageTab === "groups" ? renderGroupsTab() : state.manageTab === "ranking" ? renderRankingTab() : state.manageTab === "report" ? renderReportTab() : renderStudentsTab();
    return `${header()}<main class="shell">${flashHtml()}<div class="manage">
      <div class="manage-head">${classBadge(state, true)}
        <div><p class="kicker">${esc(state.year)} eğitim yılı${state.archived ? " · arşivde" : ""}</p><h2>${esc(state.className)} sınıfı</h2>
        <p class="fine">${state.students.length} öğrenci · bugün ${present(state.students).length} kişi burada${state.groups.length ? " · " + state.groups.length + " grup" : ""}</p></div>
        <div class="actions"><button class="soft" type="button" data-act="goto-classes">← Sınıflarım</button><button class="solid big" type="button" data-act="goto-board" ${state.students.length ? "" : "disabled"}>Derse başla →</button></div>
      </div>
      ${manageTabsHtml()}
      <section class="manage-body">${body}</section>
    </div></main>`;
  }

  function turnHtml() {
    const here = present(state.students);
    const done = here.filter((s) => state.turnDone.includes(s.id)).length;
    return `<div class="turn-meter" title="Bu sıra turunda soru çözen öğrenciler">
      <div><b>${state.turnRound}. sıra turu</b><span>${done}/${here.length} öğrenci oynadı</span></div>
      <div class="meter"><i style="width:${here.length ? Math.round(100 * done / here.length) : 0}%"></i></div>
      <button type="button" class="mini" data-act="reset-turns">Turu sıfırla</button></div>`;
  }

  function renderBoard() {
    if (!state.classId) {
      state.screen = "classes";
      return renderClasses();
    }
    const who = selected();
    const g = who ? groupById(who.groupId) : null;
    const ranked = [...state.students].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "tr"));
    const next = state.groups[state.nextGroup] || null;
    const absent = state.students.filter((s) => s.absent).length;
    return `${header()}<main class="shell">${flashHtml()}<div class="board">
      <div>
        <button class="tr-banner" type="button" data-act="goto-tournament"><span>🏆</span><span><small>SINIFIN BÜYÜK BULUŞMASI</small><b>Şampiyonlar Turnuvası</b><em>Hız elemeleri · Kapışmalar · Yıldızlar ve kupalar</em></span><strong>Katıl →</strong></button>
        <div class="bank-banner"><span class="bank-icon" aria-hidden="true">✦</span><div>${unlimited() ? `<b>♾️ Sınırsız görsel soru · 20 konu</b><span>Her konuda ${levels().length} seviye; her soru yeni sayılar ve yeni bir çizimle üretilir. Sıra şimdi sende!</span>` : `<b>${fNumber(curriculum().topics.length * MatQuestionBank.perTopic)} soru · 20 konu</b><span>Her konuda 5 seviye, her seviyede 15 soru. Sıra şimdi sende!</span>`}</div></div>
        ${![5, 7].includes(state.grade) ? `<p class="note">${state.grade}. sınıf için bu sürümde 5. sınıf 1. kitap konuları kullanılır.</p>` : ""}
        ${state.tipHidden ? "" : `<div class="tip"><b>Nasıl kullanılır?</b> Konuya gir, önce anlat, sonra oyna. “Her sorudan sonra yeni öğrenci” açıkken her soruyu farklı bir öğrenci çözer. Yanlış cevap puan silmez. <button type="button" class="mini" data-act="hide-tip">Tamam</button></div>`}
        ${curriculum().worlds.map((w) => `<section class="world">
          <div class="world-head"><h2 style="color:${w.color}">${esc(w.name)}</h2><span class="fine">${esc(w.blurb)}</span></div>
          <div class="topic-grid">${curriculum().topics.filter((t) => t.worldId === w.id).map((t) => {
            const stars = who && who.stars ? (who.stars[t.id] || 0) : 0;
            return `<article class="topic-card" style="--accent:${w.color}"><div class="no">${t.no} <span class="topic-count">${unlimited() ? "♾️ sınırsız soru" : "75 soru"} · ${levels().length} seviye</span></div><h3>${esc(t.title)}</h3>${starHtml(stars)}
              <div class="actions"><button class="soft" type="button" data-act="open" data-id="${t.id}" data-tab="lesson">Anlat</button><button class="solid" type="button" data-act="open" data-id="${t.id}" data-tab="play">Oyna</button></div></article>`;
          }).join("")}</div>
        </section>`).join("")}
      </div>
      <aside class="side">
        <div class="player-spot" style="--gc:${g ? g.color : "#e2a325"}">
          <span>ŞİMDİ TAHTADA</span>
          <strong>${who ? esc(who.name) : "Kimse seçilmedi"}</strong>
          <span>${who ? (g ? g.icon + " " + esc(g.name) + " · " : "") + who.score + " puan" : "Rastgele çek veya bir isme dokun"}</span>
          ${who ? `<div class="spot-adjust">${[-5, 5, 10].map((d) => `<button type="button" class="mini" data-act="student-points" data-id="${esc(who.id)}" data-d="${d}">${d > 0 ? "+" + d : "−" + Math.abs(d)}</button>`).join("")}</div>` : ""}
        </div>
        <div class="spot-actions">
          <button class="solid" type="button" data-act="random-any">🎲 Rastgele seç</button>
          <button class="soft" type="button" data-act="next-group" ${state.groups.length ? "" : "disabled"}>👥 Sıradaki grup</button>
        </div>
        <p class="fine">${state.lastPick ? "Son çekiliş: " + esc(state.lastPick) : next ? "Sıradaki grup: <b>" + next.icon + " " + esc(next.name) + "</b>" : "Çekilişte isimler döner, biri durur."}</p>
        ${state.fairTurns ? turnHtml() : ""}
        ${settingsHtml()}
        <details class="attendance"><summary>📋 Yoklama <small>${absent ? absent + " kişi yok" : "herkes burada"}</small></summary>
          <p class="fine">Bugün gelmeyenlere dokun; çekilişlere katılmazlar.</p>
          <div class="chips">${state.students.map((s) => `<button type="button" class="chip presence-chip ${s.absent ? "off" : ""}" data-act="toggle-absent" data-id="${esc(s.id)}">${s.absent ? "✕ " : ""}${esc(s.name)}</button>`).join("")}</div>
        </details>
        ${state.groups.length ? `<h3>Grup yarışı</h3>
          ${[...state.groups].sort((a, b) => groupScore(b.id) - groupScore(a.id)).map((gr, i) => `<article class="group-card ${state.groups.indexOf(gr) === state.nextGroup ? "next" : ""}" style="--gc:${gr.color}">
            <header><span><span class="g-emoji">${gr.icon}</span> ${esc(gr.name)}</span><b class="score">${i === 0 && groupScore(gr.id) ? "👑 " : ""}${groupScore(gr.id)}</b></header>
            <div class="members">${members(gr.id).map((s) => `<button type="button" class="mini ${s.id === state.selectedId ? "active" : ""} ${s.absent ? "is-absent" : ""} ${state.turnDone.includes(s.id) && state.fairTurns ? "played" : ""}" data-act="select" data-id="${esc(s.id)}">${esc(s.name)}</button>`).join("") || "<span class='fine'>boş</span>"}</div>
            <div class="actions"><button class="soft" type="button" data-act="random-group" data-gid="${esc(gr.id)}">Bu gruptan çek</button></div>
          </article>`).join("")}` : `<p class="fine">Grup yarışı için <button type="button" class="linkish" data-act="goto-groups">grupları kur →</button></p>`}
        <h3>Puan sırası</h3>
        ${ranked.slice(0, 8).map((s, i) => `<button type="button" class="student-row ${s.id === state.selectedId ? "active" : ""} ${s.absent ? "is-absent" : ""}" data-act="select" data-id="${esc(s.id)}"><span>${["🥇", "🥈", "🥉"][i] || i + 1 + "."} ${esc(s.name)}</span><span>${s.score}</span></button>`).join("") || "<p class='fine'>Henüz öğrenci yok.</p>"}
        <div class="actions"><button class="soft" type="button" data-act="goto-ranking">🏆 Tüm sıralama</button><button class="soft" type="button" data-act="goto-manage">👥 Sınıfı yönet</button></div>
      </aside>
    </div><p class="footer-note">Doğru/yanlış 5 puan. Diğer sorular: ${MatGames.BANK_LEVELS.map((l) => l.name + " " + l.points).join(" · ")} puan. Sınırsız modda ayrıca ${MatGames.LEVELS.filter((l) => l.unlimitedOnly).map((l) => l.name + " " + l.points).join(" · ")} puan. Yanlışta ve süre dolduğunda puan silinmez.</p></main>`;
  }

  function highlightTerms(text, terms) {
    let html = esc(text);
    if (terms) for (const term of terms) {
      const safe = esc(term);
      const at = html.indexOf(safe);
      if (at >= 0) html = html.slice(0, at) + '<mark class="term">' + safe + "</mark>" + html.slice(at + safe.length);
    }
    return html;
  }
  function numChips(text) {
    return esc(text).replace(/((?:^|[\s(|])[−-]\d+(?:[.,]\d+)*|\d+(?:[.,]\d+)*)/g, (m) => {
      const lead = /^[\s(|]/.test(m) ? m[0] : "";
      return lead + '<b class="step-num">' + m.slice(lead.length) + "</b>";
    });
  }

  function lessonNotes(slide) {
    const check = slide.check ? `<details class="lesson-check"><summary>💭 ${esc(slide.check.ask)}</summary><p>${esc(slide.check.answer)}</p></details>` : "";
    if (slide.narration) {
      const item = slide.example;
      return `<div class="lesson-notes is-teach"><h3>Anka anlatıyor</h3>
        <div class="teach-chat">
          <div class="anka-side" aria-hidden="true"><span class="anka-face">🦉</span><span class="anka-name">Anka</span></div>
          <div class="teach-bubbles">${slide.narration.map((para, i) => `<p class="teach-para" style="--note-i:${i}">${highlightTerms(para, slide.terms)}</p>`).join("")}</div>
        </div>
        ${item ? `<section class="worked" style="--steps:${item.steps.length}"><p class="worked-kicker">✨ Birlikte çözelim</p><p class="worked-ask">${numChips(item.ask)}</p><ol class="worked-steps">${item.steps.map((step, i) => `<li style="--step-i:${i}">${numChips(step)}</li>`).join("")}</ol><p class="worked-result">🎉 <b>Sonuç:</b> ${esc(item.result)}</p></section>` : ""}
        ${slide.motto ? `<p class="teach-motto">🧠 <b>Akılda kalsın:</b> ${esc(slide.motto)}</p>` : ""}
        ${check}</div>`;
    }
    const sentences = slide.p.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [slide.p];
    return `<div class="lesson-notes"><h3>${slide.sandbox ? "Nasıl yaparım?" : "Neyi fark ettin?"}</h3>${sentences.map((line, i) => `<p class="observation" style="--note-i:${i}"><span>${i + 1}</span>${esc(line.trim())}</p>`).join("")}
      ${check}</div>`;
  }

  function renderLesson(t) {
    const slide = t.slides[state.slide];
    const key = t.id + ":" + state.slide;
    if (state.sandboxKey !== key) {
      state.sandboxKey = key;
      state.sandbox = {
        deg: Number.isInteger(slide.sandboxDeg) ? slide.sandboxDeg : (slide.scene && slide.scene.kind === "angle" ? slide.scene.deg : 60),
        pairTotal: slide.storyStep === 2 ? 180 : 90,
        w: slide.sandboxW || 4,
        h: slide.sandboxH || 3,
        r: slide.sandboxR || 4,
        digits: slide.sandboxDigits || ""
      };
    }
    const interactiveAngle = isPairLesson() || slide.sandbox === "dial" || (slide.scene && slide.scene.kind === "angle");
    const visual = slide.h === "Komşu açılar" ? MatAdjacent.html() : slide.scene && slide.scene.kind === "intersect" ? MatIntersection.html() : interactiveAngle ? sandboxHtml("dial") : slide.sandbox ? sandboxHtml(slide.sandbox) : (slide.scene ? MatVisuals.renderScene(slide.scene) : "");
    const ruleSheet = slide.bullets ? `<article class="lesson-rule-sheet"><p><b>Bilgi:</b> ${esc(slide.readingIntro)}</p><ul>${slide.bullets.map(rule => `<li>${esc(rule)}</li>`).join("")}</ul><p class="lesson-rule-tip"><b>Püf noktası:</b> ${esc(slide.readingTip)}</p></article>` : "";
    return `<div class="lesson-header"><p class="kicker">${slide.teach ? "Ders anlatımı" : "Gör · Düşün · Keşfet"}</p>${visual && !slide.bullets ? figZoomHtml() : ""}<span>${state.slide + 1} / ${t.slides.length}</span></div>
      <div class="lesson-progress" aria-label="Anlatım ilerlemesi">${t.slides.map((s,i)=>`<button type="button" data-act="goto-slide" data-i="${i}" class="${i===state.slide?'active':i<state.slide?'done':''}" aria-label="${i+1}. adım: ${esc(s.h)}" ${i===state.slide?'aria-current="step"':''}></button>`).join('')}</div>
      ${slide.story ? `<p class="story-title">${esc(slide.story)} <span>${['① Modeli kur','② Değişimi izle','③ Sonucu keşfet'][slide.storyStep]}</span></p>` : ''}
      <h2>${esc(slide.h)}</h2>
      <div class="lesson-workspace${slide.bullets ? " lesson-reading" : ""}${slide.teach ? " has-teach" : ""}${!slide.bullets && figScale !== 1 ? " fig-scaled" : ""}" style="${slide.bullets ? "" : figScaleStyle()}">
        <div class="lesson-layout">
        ${slide.bullets ? `${ruleSheet}${lessonNotes(slide)}` : `${slide.teach ? lessonNotes(slide) : ""}<div class="lesson-canvas"><span class="canvas-label">${slide.sandbox ? "✋ Kafanda canlandır" : "✦ Dikkatle izle"}</span>${visual}${slide.playHint ? `<p class="play-hint">${esc(slide.playHint)}</p>` : ""}<button type="button" class="mini" data-act="replay-lesson">↻ Yeniden göster</button></div>${slide.teach ? "" : lessonNotes(slide)}`}
        </div>
      </div>
      <div class="slide-actions">
        <button class="soft" type="button" data-act="slide-prev" ${state.slide === 0 ? "disabled" : ""}>← Önceki</button>
        <button class="soft" type="button" data-act="speak-slide">Anka okusun</button>
        <button class="soft" type="button" data-act="toggle-auto">${state.autoplay ? "Anlatımı durdur" : "▶ Otomatik anlat"}</button>
        ${state.slide < t.slides.length - 1 ? `<button class="solid" type="button" data-act="slide-next">${esc(slide.nextLabel || 'Sonraki adım →')}</button>` : `<button class="solid" type="button" data-act="to-play">Oyuna geç →</button>`}
      </div>`;
  }

  // Teacher-controlled figure size for lesson models. In the normal page the
  // figure fills its column's width, so the column grows with the figure. In
  // fullscreen figures are limited by height, so the column only widens at
  // large sizes and the slide fit shrinks the text to make room.
  const FIG_SCALE_MIN = 0.6, FIG_SCALE_MAX = 2.5, FIG_SCALE_STEP = 0.2;
  let figScale = 1;
  function figScaleStyle(scale = figScale) {
    const share = Math.min(0.82, Math.max(0.3, (1.25 / 2.25) * scale));
    const col = Math.max(1, scale * 0.6);
    return `--fig:${scale};--fig-col:${(share / (1 - share)).toFixed(2)}fr;--fig-col-fs:${col.toFixed(2)}fr`;
  }
  function figZoomHtml() {
    return `<div class="fig-zoom" role="group" aria-label="Şekil boyutu"><span class="fig-zoom-title">Şekil</span>
      <button type="button" data-act="fig-zoom" data-d="-1" title="Şekli küçült" aria-label="Şekli küçült" ${figScale <= FIG_SCALE_MIN ? "disabled" : ""}>−</button>
      <span class="fig-zoom-val" aria-live="polite">%${Math.round(figScale * 100)}</span>
      <button type="button" data-act="fig-zoom" data-d="1" title="Şekli büyüt" aria-label="Şekli büyüt" ${figScale >= FIG_SCALE_MAX ? "disabled" : ""}>+</button>
      <button type="button" data-act="fig-zoom" data-d="0" title="Orijinal boyuta dön" ${figScale === 1 ? "disabled" : ""}>Sıfırla</button>
    </div>`;
  }
  function applyFigScale(d) {
    figScale = d === 0 ? 1 : Math.round(Math.min(FIG_SCALE_MAX, Math.max(FIG_SCALE_MIN, figScale + d * FIG_SCALE_STEP)) * 10) / 10;
    // Update in place: re-rendering would reset the model the class is using.
    const workspace = app.querySelector(".lesson-workspace");
    if (workspace) setFigScaleAttrs(workspace, figScale);
    const zoom = app.querySelector(".fig-zoom");
    if (zoom) {
      zoom.outerHTML = figZoomHtml();
      app.querySelector(`.fig-zoom [data-d="${d}"]:not(:disabled)`)?.focus();
    }
    scheduleLessonFit();
  }

  function setFigScaleAttrs(workspace, scale) {
    workspace.setAttribute("style", figScaleStyle(scale));
    workspace.classList.toggle("fig-scaled", scale !== 1);
  }

  function fNumber(n) { return Number(n).toLocaleString("tr-TR"); }

  function switchHtml(key, title, help) {
    const on = !!state[key];
    return `<button type="button" class="switch-row" role="switch" aria-checked="${on}" data-act="toggle-setting" data-key="${key}">
      <span class="switch ${on ? "on" : ""}" aria-hidden="true"><i></i></span><span><b>${title}</b><small>${help}</small></span></button>`;
  }

  function settingsHtml(open = false) {
    const presets = [0, 15, 30, 60, 90, 120, 180, 300];
    const custom = !presets.includes(state.questionSeconds);
    return `<details class="teacher-settings" ${open ? "open" : ""}>
      <summary><span aria-hidden="true">⚙</span> Öğretmen oyun ayarları <small>${state.questionSeconds ? state.questionSeconds + " sn / soru" : "Süresiz"}${state.autoRotate ? " · her soruda yeni öğrenci" : ""}</small></summary>
      <div class="switches">
        ${switchHtml("practice", "🏋️ Antrenman modu", "Deneme ve alıştırma için: oyunlar oynanır ama puan, istatistik ve sıralama değişmez.")}
        ${switchHtml("callout", "Çekilişte ismi söyle", "Kapalıyken “Elif, sıra sende” sesi okunmaz. Açıkken çekilen öğrencinin adı söylenir.")}
        ${switchHtml("autoRotate", "Her sorudan sonra yeni öğrenci", "Bir öğrenci cevaplayınca sıradaki soru için otomatik olarak başka bir öğrenci çekilir.")}
        ${switchHtml("fairTurns", "Herkese sıra gelsin", "Soru çözen öğrenci, sınıftaki herkes bir kez oynayana kadar tekrar çekilmez.")}
        ${state.groups.length ? `<div class="seg small" role="group" aria-label="Otomatik çekiliş sırası">
          <button type="button" class="${state.rotateMode === "group" ? "on" : ""}" data-act="rotate-mode" data-mode="group">👥 Gruplar sırayla</button>
          <button type="button" class="${state.rotateMode === "class" ? "on" : ""}" data-act="rotate-mode" data-mode="class">🎲 Tüm sınıftan</button></div>` : ""}
      </div>
      <div class="settings-grid">
        <div><label for="timeMode">Her soru için süre</label><select id="timeMode">${presets.map(s => `<option value="${s}" ${state.questionSeconds === s ? "selected" : ""}>${s === 0 ? "∞ Süresiz" : s + " saniye"}</option>`).join("")}<option value="custom" ${custom ? "selected" : ""}>Özel süre belirle</option></select></div>
        ${custom ? `<div><label for="customSeconds">Süre (saniye)</label><input id="customSeconds" type="number" min="5" max="3600" step="1" required value="${state.questionSeconds}" aria-describedby="timeHelp"></div>` : ""}
        <div><label for="roundLength">Bir turdaki soru sayısı</label><select id="roundLength">${[1, 5, 10, 15].map(n => `<option value="${n}" ${state.roundLength === n ? "selected" : ""}>${n === 1 ? "1 soru · sırayla oynayın" : n + " soru"}</option>`).join("")}</select></div>
      </div><p class="fine" id="timeHelp">Süre soru göründüğünde başlar. Çekiliş ve açılış animasyonları süreyi tüketmez. Öğretmen sayacı duraklatabilir.${custom ? " Özel süre: 5–3600 saniye." : ""}</p>
    </details>`;
  }

  function arcadeCardsHtml(t) {
    if (typeof MatArcade === "undefined") return "";
    return `<h3 class="arcade-head">🎮 Görsel oyunlar <span class="fine">· her oyunda sorular çizimlerle yeniden üretilir, bitmez</span></h3>
      <div class="arcade-cards">${MatArcade.gamesFor(t.id).map((g) => `<button type="button" class="arcade-card" style="--gc:${g.color}" data-act="start-arcade" data-game="${g.id}">
        <span class="arcade-icon" aria-hidden="true">${g.icon}</span><small>${g.players === 2 ? "2 OYUNCU · YARIŞ" : "TEK OYUNCU · SIRAYLA"}</small><b>${esc(g.title)}</b><span class="fine">${esc(g.blurb)}</span></button>`).join("")}</div>`;
  }

  // Görsel oyunların uygulamayla konuştuğu küçük arayüz.
  function arcadeCtx() {
    return {
      gameId: state.arcadeGame,
      topicId: state.topicId,
      students: () => present(state.students),
      name: (id) => (state.students.find((s) => s.id === id) || { name: "?" }).name,
      color: (id) => { const s = state.students.find((x) => x.id === id); const g = s && groupById(s.groupId); return g ? g.color : ""; },
      selectedId: () => (selected() && !selected().absent ? state.selectedId : null),
      pickOne: (done) => {
        if (!present(state.students).length) { flash("Önce öğrenci ekle."); return; }
        if (!autoPick((s) => done(s))) done(null);
      },
      award: arcadeAward,
      log: (title, players) => {
        if (!state.classId || state.practice) return;
        const vals = Object.values(players);
        state.history.unshift({ at: Date.now(), topicId: state.topicId, level: "🎮 " + title, n: vals.reduce((a, p) => a + p.a, 0), correct: vals.reduce((a, p) => a + p.c, 0), points: vals.reduce((a, p) => a + p.p, 0), players });
        if (state.history.length > HISTORY_LIMIT) state.history.length = HISTORY_LIMIT;
        persist();
      },
      exit: () => { state.phase = "pick"; render(); },
      sound: MatAudio,
      burst
    };
  }

  function arcadeAward(id, pts, ok) {
    if (state.practice) return;
    const s = state.students.find((x) => x.id === id);
    if (!s) return;
    const st = statsOf(s), g = groupById(s.groupId);
    st.asked += 1;
    if (ok) st.correct += 1; else st.wrong += 1;
    st.points += pts;
    const tp = st.topics[state.topicId] || (st.topics[state.topicId] = { a: 0, c: 0 });
    tp.a += 1;
    if (ok) tp.c += 1;
    s.score += pts;
    s.lastAt = Date.now();
    if (g) {
      g.asked = (g.asked || 0) + 1;
      if (ok) g.correct = (g.correct || 0) + 1;
      g.score = (g.score || 0) + pts;
    }
    noteTurn(s.id);
    persist();
  }

  function renderReveal(t) {
    const r = state.reveal;
    const lv = MatGames.LEVELS.find(l => l.id === r.level);
    const landed = r.step === "landed";
    const questionPoints = r.step === "question" && currentQ() ? currentQ().points : null;
    const who = selected();
    return `<div class="reveal-stage ${landed ? "is-landed" : ""}" style="--reveal-color:${lv ? lv.color : "#e2a325"}">
      <div class="reveal-orbit orbit-one" aria-hidden="true"></div><div class="reveal-orbit orbit-two" aria-hidden="true"></div>
      <div class="reveal-content"><p class="reveal-eyebrow">${esc(t.title)} · ${state.qIndex + 1}. soru${who ? " · " + esc(who.name) : ""}</p>
      <div class="reveal-symbol" aria-hidden="true">${lv ? lv.icon : "✦"}</div>
      <h2 aria-live="polite">${r.step === "level" ? "Hangi seviye gelecek?" : landed ? esc(lv.name) + " seçildi!" : "Sıradaki soru açılıyor"}</h2>
      <p>${r.step === "level" ? "Önce şansın seviyeni belirlesin…" : questionPoints !== null ? questionPoints + " puanlık bir soru seni bekliyor." : "Seviye belli! Şimdi bu seviyenin sorusu geliyor."}</p>
      <div class="reveal-levels" aria-hidden="true">${levels().map(l => `<div class="reveal-level ${r.level === l.id ? "lit" : ""}" style="--card-color:${l.color}"><span>${l.icon}</span><b>${esc(l.name)}</b><small>${levelPointsText(l)} puan</small></div>`).join("")}</div>
      <div class="reveal-steps"><span class="${r.step !== "question" ? "active" : "done"}">01 · Seviye</span><i></i><span class="${r.step === "question" ? "active" : ""}">02 · Soru</span><i></i><span>03 · Sıra sende</span></div>
      <p class="reveal-time">${state.roundSeconds ? "◷ " + state.roundSeconds + " saniyen soru gelince başlayacak" : "∞ Süresiz · düşünmek için zamanın var"}</p>
      <button type="button" class="ghost" data-act="to-levels">Seviye seçimine dön</button></div>
    </div>`;
  }

  function renderPick(t) {
    const who = selected();
    const seen = MatGames.LEVELS.reduce((sum, l) => sum + (Array.isArray(state.usedQuestions[t.id + ":" + l.id]) ? state.usedQuestions[t.id + ":" + l.id].length : 0), 0);
    const gen = unlimited();
    return `<p class="kicker">${gen ? `♾️ Sınırsız görsel soru · ${levels().length} seviye` : `75 soru · 5 seviye · ${seen} soru bu havuz turunda açıldı`}</p><h2>${esc(t.title)}</h2>
      <p class="say">${who ? esc(who.name) + " oynayacak. Puan ona" + (who.groupId ? " ve grubuna" : "") + " yazılacak." : "İstersen önce bir öğrenci çek. Çekmeden de puansız oynanır."}</p>
      ${settingsHtml(true)}
      <div class="source-pick"><span>Sorular</span><div class="seg" role="group" aria-label="Soru kaynağı">
        <button type="button" class="${gen ? "on" : ""}" data-act="question-source" data-source="gen" aria-pressed="${gen}">♾️ Sınırsız görsel</button>
        <button type="button" class="${gen ? "" : "on"}" data-act="question-source" data-source="bank" aria-pressed="${!gen}">📚 Soru bankası (75)</button></div>
        <small>${gen ? "Her soru yeni sayılar ve yeni bir çizimle anında üretilir; sorular hiç bitmez." : "Her seviyede 15 sabit soru; havuz bitince yeniden karıştırılır."}</small></div>
      <h3>Seviyeni sen seç</h3>
      <div class="levels">${levels().map((lv) => `<button type="button" class="level-card${lv.unlimitedOnly ? " elite" : ""}" style="--level-color:${lv.color}" data-act="start-level" data-level="${lv.id}"><span class="level-icon" aria-hidden="true">${lv.icon}</span><small>SEVİYE ${lv.id}</small><b>${esc(lv.name)}</b><em>${levelPointsText(lv)} puan / soru</em><span class="fine">${esc(lv.blurb)}</span><span class="level-count">${gen ? "♾️ Sınırsız soru" : "15 farklı soru"}</span></button>`).join("")}
      <button type="button" class="level-card random-card" data-act="start-level" data-level="0"><span class="level-icon" aria-hidden="true">⚄</span><small>SÜRPRİZE HAZIR MISIN?</small><b>Şansına bırak</b><em>${gen ? pointsRange() : "5–80"} puan / soru</em><span class="fine">Her sorudan önce seviye çekilir, sonra o seviyeden bir soru gelir.</span><span class="level-count">${levels().length} seviyenin tamamı</span></button></div>
      ${arcadeCardsHtml(t)}
      <p class="fine">${gen ? "Sınırsız modda her soru çizimli üretilir ve seviyenin puanını kazandırır. Kareli zeminde paralel/dik doğru, iletki, saat, abaküs, bloklar, bar modeli gibi farklı soru türleri karışık gelir." : "Doğru/yanlış soruları her zaman <b>5 puan</b>dır; yalnız ilk iki seviyede bulunur. Diğer sorular seviyenin puanını kazandırır. Bir seviyenin 15 sorusu bitene kadar aynı soru tekrar gelmez."}</p>
      ${state.gate !== null ? `<div class="result gate"><h3>İlk soruyu kim çözsün?</h3>
        <div class="actions"><button class="solid" type="button" data-act="gate-random">🎲 Rastgele çek ve başla</button>${state.groups.length ? `<button class="soft" type="button" data-act="gate-group">👥 Sıradaki gruptan çek</button>` : ""}<button class="soft" type="button" data-act="gate-free">Puansız başla</button></div>
        <div class="chips">${present(state.students).map((s) => `<button type="button" class="chip ${state.turnDone.includes(s.id) && state.fairTurns ? "played" : ""}" data-act="gate-pick" data-id="${esc(s.id)}">${esc(s.name)}</button>`).join("")}</div></div>` : ""}`;
  }

  function gameBar(q, lv) {
    const who = selected();
    const g = who ? groupById(who.groupId) : null;
    const dots = state.questions.map((_, i) => `<i class="${i < state.qIndex ? state.review[i] && state.review[i].ok ? "on" : "miss" : ""} ${i === state.qIndex ? "now" : ""}"></i>`).join("");
    return `<div class="game-bar">
      <button type="button" class="g-btn" data-act="to-levels" aria-label="Seviye seçimine dön">←</button>
      <div class="g-player ${who ? "" : "nobody"}" style="--gc:${g ? g.color : "#8a94a6"}">
        <span class="g-avatar" aria-hidden="true">${who ? esc(initials(who.name)) : "?"}</span>
        <div><small>${who ? "SIRA SENDE" : "PUANSIZ TUR"}</small><b>${who ? esc(who.name) : "Öğrenci seç"}</b>${g ? `<em>${g.icon} ${esc(g.name)} · ${groupScore(g.id)} puan</em>` : who ? `<em>${who.score} puan</em>` : ""}</div>
      </div>
      <div class="g-draw">
        <select data-act="select-student" aria-label="Soruyu yanıtlayacak öğrenci"><option value="">👤 Öğrenci seç</option>${present(state.students).map((s) => `<option value="${esc(s.id)}" ${s.id === state.selectedId ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select>
        <button class="g-btn" type="button" data-act="random-any" title="Rastgele öğrenci">🎲</button>
        ${state.groups.length ? `<button class="g-btn" type="button" data-act="next-group" title="Sıradaki gruptan çek">👥</button>` : ""}
        <button class="g-btn ${state.autoRotate ? "on" : ""}" type="button" data-act="toggle-setting" data-key="autoRotate" title="Her sorudan sonra yeni öğrenci: ${state.autoRotate ? "açık" : "kapalı"}" aria-pressed="${state.autoRotate}">🔄</button>
      </div>
      <div class="g-progress" style="--lv:${lv.color}">
        <div class="g-progress-head"><span class="g-level"><i aria-hidden="true">${lv.icon}</i>${esc(lv.name)}</span><span class="g-count" aria-label="Soru ${state.qIndex + 1} / ${state.questions.length}"><small>SORU</small><b>${state.qIndex + 1}</b><em>/${state.questions.length}</em></span></div>
        <div class="g-track" aria-hidden="true">${dots}</div>
      </div>
      <div class="g-points" aria-label="${q.points} puan"><span>⭐</span><b>+${q.points}</b></div>
      <div class="question-clock ${state.paused ? "is-paused" : ""}" id="questionClock" style="--time-left:${state.roundSeconds ? state.remainingMs / (state.roundSeconds * 1000) : 1}"><b id="clockValue" role="timer" aria-live="off">${state.roundSeconds ? clockText(state.remainingMs) : "∞"}</b>${!state.locked ? `<button class="mini" type="button" data-act="pause-clock" aria-label="${state.paused ? "Devam et" : "Duraklat"}"><svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="currentColor">${state.paused ? '<path d="M4.5 2.6v10.8c0 .8.9 1.3 1.6.8l8-5.4c.6-.4.6-1.2 0-1.6l-8-5.4c-.7-.5-1.6 0-1.6.8z"/>' : '<rect x="3" y="2.5" width="3.6" height="11" rx="1.2"/><rect x="9.4" y="2.5" width="3.6" height="11" rx="1.2"/>'}</svg></button>` : ""}</div>
      <button class="g-btn" type="button" data-act="fullscreen" title="Tam ekran" aria-label="Tam ekran">⛶</button>
    </div>`;
  }

  function renderQuiz(t) {
    const q = currentQ();
    const lv = MatGames.LEVELS.find(l => l.id === q.level);
    const praise = ["Süper!", "Tam isabet!", "İşte bu!", "Harikasın!", "Çok iyi!"][state.correctCount % 5];
    const fb = state.feedback;
    const scene = q.scene && q.kind !== "dial" && q.kind !== "rect" ? MatVisuals.renderScene(q.scene) : "";
    const longChoices = q.kind === "mc" && q.choices.some((c) => String(c).length > 28);
    return `<div class="game" style="--lv:${lv.color}">
      ${gameBar(q, lv)}
      ${state.cycleRenewed ? `<p class="pool-notice">Bu seviyedeki 15 soru tamamlandı. Havuz yeniden karıştırıldı.</p>` : ""}
      <div class="game-stage ${scene ? "has-scene" : "no-scene"} kind-${q.kind}">
        <section class="g-question">
          <span class="question-label">${q.scoringType === "true-false" ? "DOĞRU MU, YANLIŞ MI?" : "SORU " + (state.qIndex + 1)}</span>
          <h2 class="prompt" tabindex="-1">${esc(q.prompt)}</h2>
          ${scene ? `<div class="g-scene">${scene}</div>` : `<div class="g-mascot" aria-hidden="true">${["🦉", "🦊", "🐢", "🐝", "🦁"][q.level - 1] || "✦"}<span>${["Düşün!", "Hadi!", "Adım adım!", "Dikkat!", "Ustalık zamanı!"][q.level - 1] || ""}</span></div>`}
          <div class="help-row">${q.hint ? `<button class="hint-btn ${state.hintOpen ? "open" : ""}" type="button" data-act="hint">💡 ${state.hintOpen ? esc(q.hint) : "İpucu"}</button>` : ""}<button class="hint-btn sol-btn" type="button" data-act="solution" ${state.locked ? "" : "disabled title=\"Cevap verildikten sonra açılır\""}>📖 Çözüm${state.locked ? "" : " 🔒"}</button></div>
        </section>
        <section class="g-answer">
          <fieldset class="answer-area" ${state.paused || state.locked ? "disabled" : ""}><legend class="sr-only">Cevabın</legend>
            <p class="response-label">${({ mc: "Bir cevap seç", num: "Sonucu yaz", slots: "Sayıyı oluştur", order: "Sayıları istenen sırayla seç", classify: "Her satırı eşleştir", dial: "Işını hareket ettir", rect: "Kenarları değiştir" })[q.kind] || "Cevabını oluştur"}</p>
            <div class="g-tool ${longChoices ? "long" : ""}">${q.kind === "mc" ? choiceHtml(q) : toolHtml(q)}</div>
            ${q.kind !== "mc" && !state.locked ? `<button class="check-btn" type="button" data-act="submit">✔ Cevabı kontrol et</button>` : ""}
          </fieldset>
          ${fb ? `<div class="g-feedback ${fb.ok ? "ok" : "bad"}" aria-live="polite">
            <div class="fb-emoji" aria-hidden="true">${fb.ok ? "🎉" : fb.timedOut ? "⏰" : "🤔"}</div>
            <h3>${fb.ok ? praise + (fb.name ? " " + esc(fb.name) : "") : fb.timedOut ? "Süre doldu!" : "Birlikte çözelim"}</h3>
            ${fb.ok ? `<p class="fb-points">+${fb.points} puan${fb.awarded ? "" : state.practice ? " · antrenman, yazılmadı" : " · öğrenci seçili değildi"}</p>` : `<p class="fb-answer">Doğru cevap: <b>${esc(fb.correctText)}</b></p>`}
            <p class="fb-explain">${esc(fb.explain)}</p>
            <button class="soft sol-open" type="button" data-act="solution">📖 Adım adım çözümü göster</button>
            <button class="check-btn" type="button" data-act="next-q">${state.qIndex === state.questions.length - 1 ? "🏁 Sonucu gör" : state.autoRotate && present(state.students).length > 1 ? "🎲 Sıradaki öğrenci →" : "Sonraki soru →"}</button>
          </div>` : ""}
          ${renderSolution()}
          ${state.paused ? `<div class="g-feedback paused" role="status"><div class="fb-emoji" aria-hidden="true">⏸</div><h3>Oyun duraklatıldı</h3><button class="check-btn" type="button" data-act="pause-clock">▶ Devam et</button></div>` : ""}
        </section>
      </div>
    </div>`;
  }

  function renderFinish(t) {
    const missed = state.review.filter((r) => !r.ok);
    const scorers = state.students.map(s => {
      const mine = state.review.filter(r => r.studentId === s.id);
      return { name: s.name, points: mine.reduce((sum, r) => sum + r.points, 0), asked: mine.length, ok: mine.filter(r => r.ok).length };
    }).filter(s => s.asked).sort((a, b) => b.points - a.points);
    const title = state.finishStars === 3 ? "Muhteşem! Üç yıldız" : state.finishStars === 2 ? "Harika! İki yıldız" : state.finishStars === 1 ? "Güzel! Bir yıldız" : "Tur tamam";
    return `<div class="game finish-game">
      <div class="finish-card">
        <div class="finish-top"><div class="trophy" aria-hidden="true">${state.finishStars >= 2 ? "🏆" : state.finishStars === 1 ? "🎖️" : "🌱"}</div>
          <div><p class="kicker">${esc(t.title)} · tur bitti</p><h2>${title}</h2>${starHtml(state.finishStars)}
          <p class="say">${state.correctCount} / ${state.questions.length} doğru · bu turda <b>${state.scoreEarned} puan</b> kazanıldı.${state.practice ? " Antrenman · puan yazılmadı." : ""}</p></div></div>
        <div class="finish-body">
          <div><h3>Bu turun oyuncuları</h3>${scorers.length ? `<ul class="finish-players">${scorers.map((s, i) => `<li><span>${["🥇", "🥈", "🥉"][i] || "⭐"} ${esc(s.name)}</span><span>${s.ok}/${s.asked} doğru</span><b>+${s.points}</b></li>`).join("")}</ul>` : `<p class="fine">Bu tur puansız oynandı.</p>`}
            ${state.groups.length ? `<h3>Grup yarışı</h3><div class="finish-groups">${[...state.groups].sort((a, b) => groupScore(b.id) - groupScore(a.id)).map((g) => `<span style="--gc:${g.color}">${g.icon} ${esc(g.name)} <b>${groupScore(g.id)}</b></span>`).join("")}</div>` : ""}</div>
          <div>${missed.length ? `<h3>Birlikte tekrar edelim</h3><ul class="review">${missed.map((r) => `<li>${r.timedOut ? "⏰ " : ""}<b>${esc(r.prompt)}</b><br>${esc(r.explain)}${r.solution ? `<br><button class="soft sol-open" type="button" data-act="review-solution" data-i="${state.review.indexOf(r)}">📖 Adım adım çözüm</button>` : ""}</li>`).join("")}</ul>` : `<h3>Hepsi doğru!</h3><p>Bütün sorular doğru. Yeni bir meydan okumaya hazırsın!</p>`}</div>
        </div>
        <div class="actions finish-actions">
          <button class="check-btn" type="button" data-act="start-level" data-level="${state.randomLevel ? 0 : state.level}">${state.randomLevel ? "🎲 Yeni rastgele tur" : "▶ Bu seviyede yeni tur"}</button>
          <button class="soft" type="button" data-act="to-levels">Seviye seç</button>
          <button class="soft" type="button" data-act="to-lesson">Anlatıma dön</button>
          <button class="soft" type="button" data-act="goto-ranking">🏆 Sıralama</button>
        </div>
      </div>
      ${renderSolution()}
    </div>`;
  }

  function renderTopic() {
    const t = topic();
    if (!t) {
      state.screen = "board";
      return renderBoard();
    }
    const w = worldOf(t.worldId);
    let body = "";
    if (state.topicTab === "lesson") body = renderLesson(t);
    else if (state.phase === "arcade") body = `<div id="arcadeRoot" class="game arcade"></div>`;
    else if (state.phase === "reveal") body = renderReveal(t);
    else if (state.phase === "quiz") body = renderQuiz(t);
    else if (state.phase === "finish") body = renderFinish(t);
    else body = renderPick(t);
    const atSetup = state.topicTab === "lesson" || state.phase === "pick";
    const back = atSetup ? `<button class="soft step-back" type="button" data-act="go-back">← Geri</button>` : "";
    return `${header()}<main class="shell">${flashHtml()}<div class="topic-page">
      <aside class="topic-nav">
        <button class="soft" type="button" data-act="goto-board">← Konular</button>
        <h3>${esc(t.title)}</h3>
        <p class="fine">${esc(w.name)}</p>
        <div class="tabs">
          <button class="nav-btn ${state.topicTab === "lesson" ? "on" : ""}" type="button" data-act="to-lesson">Anlat</button>
          <button class="nav-btn ${state.topicTab === "play" ? "on" : ""}" type="button" data-act="to-play">Oyna</button>
        </div>
        ${state.topicTab === "lesson" ? t.slides.map((s, i) => `<button type="button" class="nav-btn ${i === state.slide ? "on" : ""}" data-act="goto-slide" data-i="${i}">${i + 1}. ${esc(s.h)}</button>`).join("") : levels().map((lv) => `<button type="button" class="nav-btn ${state.level === lv.id && state.phase !== "pick" && (!state.reveal || state.reveal.level === lv.id) ? "on" : ""}" data-act="start-level" data-level="${lv.id}">${esc(lv.name)} · ${levelPointsText(lv)}</button>`).join("")}
        <button class="ghost" type="button" data-act="tahta" style="color:var(--ink);border-color:var(--line);margin-top:8px">${state.tahta ? "Tahta modunu kapat" : "Tahta modu"}</button>
      </aside>
      <section class="topic-main">${back}${body}</section>
    </div></main>`;
  }

  let lessonFitObserver;
  let lessonSizeObserver;
  let lessonFitTimer;
  function scheduleLessonFit() {
    clearTimeout(lessonFitTimer);
    lessonFitTimer = setTimeout(fitLesson, 100);
  }

  // Scale the slide so it fills the fullscreen panel: shrink when it is too
  // tall, grow when space is left. A zoom change is measured only after the
  // browser has laid it out (a synchronous re-measure can return the previous
  // size), and each pass corrects the zoom by the measured ratio.
  // With a resized figure, the figure keeps the on-screen size it had at 100%
  // times the chosen scale (--fig-counter undoes the slide zoom for it), so
  // only the text around it shrinks to make room.
  const LESSON_ZOOM_MIN = 0.5, LESSON_ZOOM_MAX = 1.5;
  let lessonFitRun = 0;
  const lessonRefZoom = new Map();
  let lastRefZoom = 1;
  function setFigCounter(layout, zoom, scale) {
    if (scale === 1) { layout.style.removeProperty?.("--fig-counter"); return; }
    const ref = lessonRefZoom.get(state.topicId + ":" + state.slide) ?? lastRefZoom;
    layout.style.setProperty?.("--fig-counter", (ref / zoom).toFixed(3));
  }
  function fitLesson() {
    const workspace = app.querySelector(".lesson-workspace");
    const layout = workspace?.querySelector(".lesson-layout");
    if (!layout) return;
    const hasFigure = !!layout.querySelector(".lesson-canvas");
    if (!document.body.classList.contains("classroom-fullscreen") || window.innerWidth <= 760) {
      layout.style.zoom = "";
      layout.style.removeProperty?.("--fig-counter");
      // Undo an interrupted 100% measurement.
      if (hasFigure) setFigScaleAttrs(workspace, figScale);
      return;
    }
    const key = state.topicId + ":" + state.slide;
    let scale = figScale;
    if (hasFigure && scale !== 1 && !lessonRefZoom.has(key)) {
      // First measure this slide at 100%, then apply the chosen figure size.
      scale = 1;
      setFigScaleAttrs(workspace, 1);
    }
    setFigCounter(layout, parseFloat(layout.style.zoom) || 1, scale);
    const run = ++lessonFitRun;
    let pass = 0;
    const step = () => {
      if (run !== lessonFitRun || !layout.isConnected) return;
      const zoom = parseFloat(layout.style.zoom) || 1;
      const height = layout.getBoundingClientRect().height;
      const room = workspace.clientHeight - 2;
      if (!height || room <= 0) return;
      // Text rewraps as the zoom changes, so height is not exactly linear.
      let next = zoom * room / height;
      if (pass < 2) next = zoom + (next - zoom) * 0.9;
      next = Math.min(LESSON_ZOOM_MAX, Math.max(LESSON_ZOOM_MIN, Math.floor(next * 100) / 100));
      const fits = height <= room + 1;
      const settle = (z) => {
        if (scale !== 1) return;
        lastRefZoom = z;
        lessonRefZoom.set(key, z);
        if (figScale === 1) return;
        scale = figScale;
        setFigScaleAttrs(workspace, scale);
        setFigCounter(layout, z, scale);
        pass = 0;
        setTimeout(() => requestAnimationFrame(step), 30);
      };
      if (fits && Math.abs(next - zoom) < 0.02) { settle(zoom); return; }
      if (pass >= 7) {
        // Settle on a size that fits rather than keep adjusting.
        if (!fits) {
          const z = Math.max(LESSON_ZOOM_MIN, Math.floor(zoom * room / height * 98) / 100);
          layout.style.zoom = z;
          setFigCounter(layout, z, scale);
        }
        settle(parseFloat(layout.style.zoom) || 1);
        return;
      }
      layout.style.zoom = next;
      setFigCounter(layout, next, scale);
      pass++;
      setTimeout(() => requestAnimationFrame(step), 30);
    };
    step();
  }

  function watchLessonLayout() {
    lessonFitObserver?.disconnect();
    lessonSizeObserver?.disconnect();
    const layout = app.querySelector(".lesson-layout");
    if (layout && typeof ResizeObserver !== "undefined") {
      let lastWidth = -1, lastHeight = -1;
      lessonSizeObserver = new ResizeObserver((entries) => {
        const box = entries[0].borderBoxSize[0];
        const width = Math.round(box.inlineSize), height = Math.round(box.blockSize);
        if (width === lastWidth && height === lastHeight) return;
        lastWidth = width;
        lastHeight = height;
        scheduleLessonFit();
      });
      // Observe the fixed outer panel, never the workspace being scaled:
      // its scrollbars can otherwise feed back into the fit calculation.
      lessonSizeObserver.observe(layout.closest(".topic-main"), { box: "border-box" });
    }
    if (layout && typeof MutationObserver !== "undefined") {
      lessonFitObserver = new MutationObserver(scheduleLessonFit);
      // Interactive examples replace their output without a page render.
      lessonFitObserver.observe(layout, { childList: true, subtree: true, characterData: true });
    }
    scheduleLessonFit();
  }

  function render() {
    if (window.MatTournament) MatTournament.unmount();
    MatAudio.setMusicScene(authenticated && (state.screen === "tournament" || isGameMode()));
    if (!authenticated) {
      renderLogin();
      return;
    }
    document.body.classList.remove("login-mode");
    clearTimeout(angleTimer);
    const game = isGameMode();
    document.body.classList.toggle("game-mode", game);
    document.body.classList.toggle("is-fs", !!document.fullscreenElement);
    document.body.classList.toggle("tahta", !!(state.tahta && state.screen === "topic" && !game));
    document.body.classList.toggle("classroom-fullscreen", !!document.fullscreenElement && state.screen === "topic" && state.topicTab === "lesson");
    const html = state.screen === "tournament" ? `${header()}<main class="shell"><div id="tournamentRoot"></div></main>` : state.screen === "classes" ? renderClasses() : state.screen === "manage" ? renderManage() : state.screen === "topic" ? renderTopic() : renderBoard();
    app.innerHTML = (state.practice ? `<div class="practice-ribbon" role="status">🏋️ ANTRENMAN MODU · puan, istatistik ve sıralama değişmez <button type="button" data-act="toggle-practice">Kapat</button></div>` : "") + html + (passwordOpen ? passwordDialog() : "");
    document.body.classList.toggle("practice-mode", state.practice);
    bindDynamic();
    watchLessonLayout();
  }

  function renderLoading(text) {
    document.body.classList.add("login-mode");
    app.innerHTML = `<main class="loading-screen"><div class="loader" aria-hidden="true"><span>+</span><span>−</span><span>×</span><span>÷</span></div><p>${esc(text)}</p></main>`;
  }

  function renderLogin(focusPassword) {
    MatAudio.setMusicScene(false);
    if (window.MatTournament) MatTournament.unmount();
    document.body.classList.add("login-mode");
    document.body.classList.remove("tahta", "classroom-fullscreen", "game-mode", "practice-mode");
    if (cloud && !authReady) {
      renderLoading("Bağlanılıyor…");
      return;
    }
    app.innerHTML = `<main class="login-screen">
      <section class="login-art" aria-label="Matematik Atölyesi">
        <div class="login-brand"><span class="login-brand-mark" aria-hidden="true">∑</span><span>MATEMATİK ATÖLYESİ<small>5–8. sınıf · öğretmen paneli</small></span></div>
        <div class="login-orbit login-orbit-one" aria-hidden="true">÷</div>
        <div class="login-orbit login-orbit-two" aria-hidden="true">×</div>
        <div class="login-art-copy">
          <p class="login-eyebrow">ÖĞRETMEN PANELİ</p>
          <h1>Her soru,<br>yeni bir keşif.</h1>
          <p>Sınıflarını yıllara göre sakla, grupları kur, kimin kaç soru çözdüğünü takip et ve herkese sıra gelsin.</p>
        </div>
        <div class="login-art-footer"><span class="login-spark" aria-hidden="true">✳</span><span>Merakla başla. Birlikte çöz.</span><span class="login-art-number" aria-hidden="true">05</span></div>
      </section>
      <section class="login-main">
        <div class="login-card">
          <div class="login-mobile-brand"><span class="login-brand-mark" aria-hidden="true">∑</span><span>MATEMATİK ATÖLYESİ</span></div>
          <div class="login-admin-tag"><span aria-hidden="true">●</span> ÖĞRETMEN GİRİŞİ</div>
          <h2>Hoş geldin.</h2>
          <p class="login-lede">${cloud ? "Sınıfların Firebase hesabında saklanır; hangi bilgisayardan girersen gir seni bekler." : "Bulut bağlantısı kurulamadı. İnternet bağlantını kontrol et ya da bu cihazda çevrimdışı devam et."}</p>
          ${cloud ? `<form id="loginForm" class="login-form" novalidate>
            <label for="loginEmail">E-posta adresi</label>
            <div class="login-input-wrap"><span class="login-input-icon" aria-hidden="true">@</span><input id="loginEmail" name="email" type="email" autocomplete="username" inputmode="email" placeholder="ornek@eposta.com" value="${esc(loginEmailDraft)}" required></div>
            <label for="loginPassword">Şifre</label>
            <div class="login-input-wrap"><span class="login-input-icon login-lock" aria-hidden="true">●</span><input id="loginPassword" name="password" type="password" autocomplete="current-password" placeholder="Şifreni gir" minlength="6" required></div>
            ${loginError ? `<p class="login-error" role="alert">${esc(loginError)}</p>` : ""}
            <button class="login-submit" type="submit" ${loginBusy ? "disabled" : ""}>${loginBusy ? "Giriş yapılıyor…" : "Giriş yap"} <span aria-hidden="true">→</span></button>
            <button class="login-link" type="button" data-act="reset-password">Şifremi unuttum</button>
          </form>` : `<button class="login-submit" type="button" data-act="local-mode">Bu cihazda devam et <span aria-hidden="true">→</span></button>`}
          <p class="login-private"><span aria-hidden="true">◈</span> ${cloud ? "Bu panel yalnız öğretmen hesabına açıktır." : "Çevrimdışı modda veriler yalnız bu tarayıcıda kalır."}</p>
        </div>
        <p class="login-copyright">MATEMATİK ATÖLYESİ <span>·</span> ÖĞRENMEK BİRLİKTE GÜZEL</p>
      </section>
    </main>`;
    if (focusPassword) document.getElementById("loginPassword")?.focus();
  }

  function openFromHash() {
    const hash = decodeURIComponent(location.hash.replace("#", ""));
    if (!state.classId) { render(); return; }
    if (hash.startsWith("konu-")) {
      const play = hash.endsWith("-oyna");
      const id = play ? hash.slice(5, -5) : hash.slice(5);
      if (curriculum().topics.some((t) => t.id === id)) openTopic(id, play ? "play" : "lesson");
      else render();
    } else if (hash.startsWith("oyun-")) {
      const parts = hash.slice(5).split("-");
      const requestedLevel = Number(parts.pop());
      const id = parts.join("-");
      const level = [0, ...levels().map(l => l.id)].includes(requestedLevel) ? requestedLevel : 1;
      if (curriculum().topics.some((t) => t.id === id)) {
        state.screen = "topic";
        state.topicId = id;
        state.topicTab = "play";
        beginLevel(level);
      } else render();
    } else render();
  }

  function startLocal() {
    localMode = true;
    authenticated = true;
    load();
    openFromHash();
  }

  async function startCloud() {
    authenticated = true;
    renderLoading("Sınıfların yükleniyor…");
    try {
      await loadCloud();
    } catch (err) {
      console.error(err);
      authenticated = false;
      loginError = err && err.code === "permission-denied"
        ? "Firestore izinleri bu hesaba kapalı. firestore.rules dosyasını yayınlayın."
        : "Veriler yüklenemedi: " + (err && err.message ? err.message : "bilinmeyen hata");
      cloud.signOut().catch(() => {});
      renderLogin();
      return;
    }
    openFromHash();
  }

  function authMessage(err) {
    const code = err && err.code || "";
    if (code === "auth/invalid-email") return "Geçerli bir e-posta adresi yaz.";
    if (code === "auth/missing-password" || code === "auth/weak-password") return "Şifre en az 6 karakter olmalı.";
    if (code === "auth/too-many-requests") return "Çok fazla deneme yapıldı. Biraz sonra tekrar dene.";
    if (code === "auth/network-request-failed") return "İnternet bağlantısı yok gibi görünüyor.";
    if (code === "auth/operation-not-allowed" || code === "auth/configuration-not-found") return "Firebase konsolunda Authentication → Sign-in method → E-posta/Şifre girişini etkinleştirin.";
    if (code === "auth/email-already-in-use") return "Bu e-posta ile zaten bir hesap var. Şifreni kontrol et.";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found" || code === "auth/invalid-login-credentials") return "E-posta veya şifre hatalı. Tekrar deneyin.";
    return "Giriş yapılamadı: " + (err && err.message ? err.message : code);
  }

  async function onLoginSubmit(e) {
    if (e.target.id !== "loginForm") return;
    e.preventDefault();
    if (!cloud || loginBusy) return;
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    loginEmailDraft = email;
    loginBusy = true;
    loginError = "";
    renderLogin();
    try {
      await cloud.signIn(email, password);
    } catch (err) {
      loginError = authMessage(err);
      loginBusy = false;
      renderLogin(true);
      const pw = document.getElementById("loginPassword");
      if (pw) pw.value = password;
    }
  }

  // ---- Şifre değiştirme (giriş yaptıktan sonra) ----
  function passwordDialog() {
    return `<div class="modal-backdrop" data-act="close-password">
      <form id="passwordForm" class="modal-card" novalidate role="dialog" aria-modal="true" aria-labelledby="pwTitle">
        <div class="modal-icon" aria-hidden="true">🔑</div>
        <h2 id="pwTitle">Şifreyi değiştir</h2>
        <p class="fine">${esc(TEACHER_EMAIL)} hesabı için yeni şifre belirle.</p>
        <label for="pwCurrent">Şu anki şifre</label>
        <input id="pwCurrent" type="password" autocomplete="current-password" required>
        <label for="pwNew">Yeni şifre <span class="fine">· en az 6 karakter</span></label>
        <input id="pwNew" type="password" autocomplete="new-password" minlength="6" required>
        <label for="pwRepeat">Yeni şifre (tekrar)</label>
        <input id="pwRepeat" type="password" autocomplete="new-password" minlength="6" required>
        ${passwordMsg ? `<p class="${passwordMsg.ok ? "pw-ok" : "login-error"}" role="alert">${esc(passwordMsg.text)}</p>` : ""}
        <div class="actions">
          <button class="solid" type="submit" ${passwordBusy ? "disabled" : ""}>${passwordBusy ? "Kaydediliyor…" : "Şifreyi kaydet"}</button>
          <button class="soft" type="button" data-act="close-password">${passwordMsg && passwordMsg.ok ? "Kapat" : "Vazgeç"}</button>
        </div>
      </form>
    </div>`;
  }

  async function onPasswordSubmit(e) {
    if (e.target.id !== "passwordForm") return;
    e.preventDefault();
    if (!cloud || passwordBusy) return;
    const current = document.getElementById("pwCurrent").value;
    const next = document.getElementById("pwNew").value;
    const repeat = document.getElementById("pwRepeat").value;
    if (!current) passwordMsg = { ok: false, text: "Şu anki şifreni yaz." };
    else if (next.length < 6) passwordMsg = { ok: false, text: "Yeni şifre en az 6 karakter olmalı." };
    else if (next !== repeat) passwordMsg = { ok: false, text: "Yeni şifreler birbirini tutmuyor." };
    else if (next === current) passwordMsg = { ok: false, text: "Yeni şifre eskisiyle aynı olamaz." };
    else {
      passwordBusy = true;
      passwordMsg = null;
      render();
      try {
        await cloud.changePassword(current, next);
        passwordMsg = { ok: true, text: "Şifren değiştirildi. Bir sonraki girişte yeni şifreni kullan." };
      } catch (err) {
        const code = err && err.code || "";
        passwordMsg = { ok: false, text: ["auth/wrong-password", "auth/invalid-credential", "auth/invalid-login-credentials"].includes(code) ? "Şu anki şifre hatalı." : authMessage(err) };
      }
      passwordBusy = false;
    }
    render();
    document.getElementById(passwordMsg && passwordMsg.ok ? "passwordForm" : "pwCurrent")?.focus();
  }

  function typeDigit(key) {
    const lessonRead = state.screen === "topic" && state.topicTab === "lesson" && currentSlide() && currentSlide().sandbox === "read";
    const q = state.phase === "quiz" ? currentQ() : null;
    const gameType = q && (q.kind === "num" || q.kind === "slots");
    if (!lessonRead && !gameType) return;
    if (!lessonRead && (state.locked || state.paused || state.spinning)) return;
    if (lessonRead) {
      if (key === "sil") state.sandbox.digits = "";
      else if (key === "geri") state.sandbox.digits = state.sandbox.digits.slice(0, -1);
      else if (state.sandbox.digits.length < 12) state.sandbox.digits += key;
      const view = document.getElementById("slotView");
      const say = document.getElementById("sayView");
      const table = document.getElementById("readTable");
      if (view) view.textContent = state.sandbox.digits ? MatGames.groupDigits(state.sandbox.digits) : "…";
      if (say) say.textContent = state.sandbox.digits ? MatGames.sayNumber(state.sandbox.digits) : "Rakamları tuşla.";
      if (table) table.innerHTML = MatVisuals.renderScene({ kind: "place", digits: state.sandbox.digits });
      return;
    }
    if (key === "sil") state.draft = "";
    else if (key === "geri") state.draft = String(state.draft || "").slice(0, -1);
    else if (String(state.draft || "").length < 15) state.draft = String(state.draft || "") + key;
    const view = document.getElementById("slotView");
    if (view) view.textContent = (state.draft ? MatGames.groupDigits(state.draft) : "…") + (q.unit ? " " + q.unit : "");
  }

  let angleTimer = null;
  function isPairLesson() {
    if (state.screen !== "topic" || state.topicTab !== "lesson") return false;
    const slide = currentSlide();
    if (!slide) return false;
    if (slide.sandbox === "pair") return true;
    const t = topic();
    return !!(t && t.id === "cift" && (slide.story || slide.h === "Tümler ve bütünler"));
  }
  function angleKind(deg) {
    return deg === 0 ? "Sıfır açı · kollar üst üste" : deg < 90 ? "Dar açı · 90°den küçük" : deg === 90 ? "Dik açı · tam 90°" : deg < 180 ? "Geniş açı · 90° ile 180° arasında" : "Doğru açı · tam 180°";
  }

  function animateLessonAngle(target) {
    if (state.screen !== "topic" || state.topicTab !== "lesson" || !document.getElementById("lessonAngle")) return;
    if (!Number.isInteger(target) || target < 0 || target > (isPairLesson() ? state.sandbox.pairTotal : 180)) return;
    stopAuto();
    MatAudio.cancelSpeak();
    clearTimeout(angleTimer);
    const from = state.sandbox.deg;
    const started = Date.now();
    const duration = Math.max(650, Math.abs(target - from) * 12);
    const input = document.getElementById("lessonAngle");
    input.value = target;
    const status = document.getElementById("angleMotion");
    status.textContent = `${from}° → ${target}° · Kırmızı kol dönerken köşe sabit kalır.`;
    function frame() {
      const progress = Math.min(1, (Date.now() - started) / duration);
      const ease = progress * progress * (3 - 2 * progress);
      const deg = Math.round(from + (target - from) * ease);
      state.sandbox.deg = deg;
      paintDial(deg);
      if (progress < 1) angleTimer = setTimeout(frame, 16);
      else { angleTimer = null; status.textContent = isPairLesson() ? `${target}° + ${state.sandbox.pairTotal-target}° = ${state.sandbox.pairTotal}°. Toplam değişmedi!` : `${target}°ye ulaştık. ${angleKind(target)}.`; }
    }
    frame();
  }

  function applyLessonAngle() {
    const input = document.getElementById("lessonAngle");
    if (input && input.reportValidity()) animateLessonAngle(Number(input.value));
  }

  function paintDial(deg) {
    const sectors = document.getElementById("pairSectors");
    if (sectors) {
      const total = state.sandbox.pairTotal;
      sectors.innerHTML = MatVisuals.pairParts(deg,total,!!state.sandbox.hideMissing);
      document.getElementById("pairFirst").textContent = deg + '°';
      document.getElementById("pairOther").textContent = state.sandbox.hideMissing ? '?' : (total-deg) + '°';
      document.getElementById("pairRule").textContent = `${total}° − ${deg}° = ${state.sandbox.hideMissing?'?':(total-deg)+'°'}`;
    }
    const [x, y] = MatVisuals.ray(180, 176, deg, 112);
    const ray = document.getElementById("dialRay");
    const handle = document.getElementById("dialHandle");
    const label = document.getElementById("dialRead");
    const arc = document.getElementById("dialArc");
    if (ray) {
      ray.setAttribute("x2", x);
      ray.setAttribute("y2", y);
    }
    if (handle) {
      handle.setAttribute("cx", x);
      handle.setAttribute("cy", y);
    }
    if (label) label.textContent = deg + "°";
    if (arc) {
      arc.setAttribute("d", MatVisuals.arc(180, 176, 32, deg));
      arc.setAttribute("visibility", deg === 90 ? "hidden" : "visible");
    }
    const svg = document.getElementById("dialSvg");
    if (svg) svg.setAttribute("aria-valuenow", String(deg));
    const kind = document.getElementById("angleKind");
    if (kind) kind.textContent = angleKind(deg);
    const square = document.getElementById("dialSquare");
    if (square) square.setAttribute("visibility", deg === 90 ? "visible" : "hidden");
  }

  function degFromEvent(ev, svg) {
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return 0;
    const p = pt.matrixTransform(ctm.inverse());
    let deg = Math.atan2(-(p.y - 176), p.x - 180) * 180 / Math.PI;
    if (deg < 0) deg += 360;
    if (deg > 180) deg = deg > 270 ? 0 : 180;
    return Math.max(0, Math.min(180, Math.round(deg)));
  }

  function bindDynamic() {
    const tournamentRoot = document.getElementById("tournamentRoot");
    if (tournamentRoot) {
      const classId = state.classId, students = state.students;
      let tournament = state.tournament;
      MatTournament.mount(tournamentRoot, {
        get: () => tournament,
        save: value => {
          tournament = value;
          if (state.classId === classId) { state.tournament = value; persist(); }
          else if (state.classes[classId]) {
            state.classes[classId].tournament = value;
            if (cloud && !localMode) cloud.saveClass(state.classes[classId]);
          }
        },
        students: all => all ? students : present(students),
        topics: () => curriculum().topics.filter(t => MatLevelGen.topics.includes(t.id)),
        practice: () => state.practice,
        award: (id, practice) => {
          const student = students.find(s => s.id === id);
          if (student && !practice) {
            student.tournamentStars = (student.tournamentStars || 0) + 1;
            student.tournamentCups = Math.floor(student.tournamentStars / 3);
          }
        }
      });
    }
    if (window.Mat7Labs) Mat7Labs.bind(app);
    if (window.MatImagine) MatImagine.bind(app);
    const arcadeRoot = document.getElementById("arcadeRoot");
    if (arcadeRoot && typeof MatArcade !== "undefined") MatArcade.mount(arcadeRoot, arcadeCtx());
    if (typeof MatAdjacent !== "undefined") MatAdjacent.bind();
    if (typeof MatIntersection !== "undefined") MatIntersection.bind();
    const svg = document.getElementById("dialSvg");
    if (svg) {
      const move = (ev) => {
        if (ev.type === "pointermove" && ev.buttons === 0) return;
        if (state.topicTab !== "lesson" && (state.locked || state.paused || state.spinning)) return;
        const deg = Math.min(degFromEvent(ev, svg), isPairLesson() ? state.sandbox.pairTotal : 180);
        clearTimeout(angleTimer);
        const input = document.getElementById("lessonAngle");
        if (input) input.value = deg;
        if (state.topicTab === "lesson") state.sandbox.deg = deg;
        else state.draft = deg;
        paintDial(deg);
      };
      svg.addEventListener("pointerdown", (ev) => {
        svg.setPointerCapture(ev.pointerId);
        move(ev);
      });
      svg.addEventListener("pointermove", move);
      svg.setAttribute("tabindex", "0");
      svg.setAttribute("role", "slider");
      svg.setAttribute("aria-label", "Açı ölçüsü");
      svg.setAttribute("aria-valuemin", "0");
      svg.setAttribute("aria-valuemax", String(isPairLesson() ? state.sandbox.pairTotal : 180));
      svg.setAttribute("aria-valuenow", String(state.topicTab === "lesson" ? state.sandbox.deg : state.draft));
      svg.addEventListener("keydown", ev => {
        if (!["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp", "Home", "End"].includes(ev.key)) return;
        ev.preventDefault();
        clearTimeout(angleTimer);
        if (state.topicTab !== "lesson" && (state.locked || state.paused)) return;
        const now = state.topicTab === "lesson" ? state.sandbox.deg : Number(state.draft);
        const max = isPairLesson() ? state.sandbox.pairTotal : 180;
        const deg = ev.key === "Home" ? 0 : ev.key === "End" ? max : Math.max(0, Math.min(max, now + (["ArrowLeft", "ArrowDown"].includes(ev.key) ? -1 : 1)));
        if (state.topicTab === "lesson") state.sandbox.deg = deg;
        else state.draft = deg;
        paintDial(deg);
        svg.setAttribute("aria-valuenow", String(deg));
        const input = document.getElementById("lessonAngle");
        if (input) input.value = deg;
      });
    }
  }

  function updateRanges() {
    if (state.topicTab !== "lesson" && (state.locked || state.paused)) return;
    const rw = document.getElementById("rw");
    const rh = document.getElementById("rh");
    if (!rw || !rh) return;
    const w = Number(rw.value);
    const h = Number(rh.value);
    const lesson = state.topicTab === "lesson";
    if (lesson) {
      state.sandbox.w = w;
      state.sandbox.h = h;
    } else if (state.draft && typeof state.draft === "object") {
      state.draft.w = w;
      state.draft.h = h;
    }
    const wLabel = document.getElementById("wLabel");
    const hLabel = document.getElementById("hLabel");
    const preview = document.getElementById("rectPreview");
    const stats = document.getElementById("rectStats");
    if (wLabel) wLabel.textContent = String(w);
    if (hLabel) hLabel.textContent = String(h);
    if (preview) preview.innerHTML = MatVisuals.renderScene({ kind: "grid", cols: w, rows: h, count: lesson });
    if (stats) {
      const P = 2 * (w + h);
      const A = w * h;
      const q = currentQ();
      if (!lesson && q && q.kind === "rect") {
        const pHit = q.mode !== "area" && P === (q.mode === "perim" ? q.target : q.perim);
        const aHit = q.mode !== "perim" && A === (q.mode === "area" ? q.target : q.area);
        stats.innerHTML = `Çevre = <b class="${pHit ? "hit" : ""}">${P}</b> · Alan = <b class="${aHit ? "hit" : ""}">${A}</b>`;
      } else stats.innerHTML = `Çevre = <b>${P}</b> · Alan = <b>${A}</b>`;
    }
  }

  function onClick(e) {
    if (!authenticated) return;
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    if (btn.disabled || state.spinning) return;
    const act = btn.dataset.act;
    if (act === "pair-mode" && isPairLesson()) {
      stopAuto(); MatAudio.cancelSpeak();
      state.sandbox.pairTotal = Number(btn.dataset.total);
      state.sandbox.deg = Math.min(state.sandbox.deg,state.sandbox.pairTotal);
      render(); return;
    }
    if (act === "pair-hide" && isPairLesson()) {
      state.sandbox.hideMissing = !state.sandbox.hideMissing;
      render(); return;
    }
    if (act === "angle-to") { animateLessonAngle(Number(btn.dataset.deg)); return; }
    if (act === "angle-apply") { applyLessonAngle(); return; }
    if (act === "open-password") {
      passwordOpen = true;
      passwordMsg = null;
      render();
      document.getElementById("pwCurrent")?.focus();
      return;
    }
    if (act === "close-password") {
      // Arka plana ya da düğmeye tıklanınca kapanır; formun içine tıklamak kapatmaz.
      if (btn.tagName !== "BUTTON" && e.target !== btn) return;
      passwordOpen = false;
      passwordMsg = null;
      render();
      return;
    }
    if (act === "logout") {
      passwordOpen = false;
      stopAuto();
      cancelRound();
      MatAudio.cancelSpeak();
      authenticated = false;
      loginEmailDraft = "";
      loginError = "";
      loginBusy = false;
      state.classId = null;
      if (cloud && !localMode) cloud.signOut().catch(() => {});
      localMode = false;
      renderLogin();
      return;
    }
    MatAudio.ensure();
    if (act === "toggle-music") { MatAudio.toggleMusic(); render(); return; }
    if (act === "goto-tournament") {
      if (!state.classId) return;
      stopClock(); stopAuto(); MatAudio.cancelSpeak();
      if (window.MatArcade) MatArcade.stop();
      state.screen = "tournament"; render(); return;
    }
    if (act === "add-one") {
      const input = document.getElementById("oneName");
      const noInput = document.getElementById("oneNo");
      if (input && addName(input.value, noInput ? noInput.value.replace(/\D/g, "") : "")) {
        persist();
        render();
        const again = document.getElementById("oneName");
        if (again) again.focus();
      }
      return;
    }
    if (act === "add-list") {
      const dump = document.getElementById("nameDump");
      const n = dump ? addMany(dump.value) : 0;
      if (n) {
        persist();
        flash(n + " öğrenci eklendi.");
      } else if (dump && !dump.value.trim()) flash("Önce listeyi yapıştır.");
      return;
    }
    if (act === "load-demo") {
      newClass(5);
      state.section = "A";
      ["Ege", "Nehir", "Defne", "Ali", "Maya", "Kerem", "Elif", "Poyraz", "Aylin", "Yusuf", "Deniz", "Ada"].forEach((n, i) => addName(n, String(101 + i)));
      persist();
      render();
      return;
    }
    if (act === "goto-classes") {
      stopAuto();
      cancelRound();
      persist();
      state.screen = "classes";
      render();
      return;
    }
    if (act === "new-class") {
      newClass(Number(btn.dataset.grade));
      render();
      const sec = document.getElementById("classSection");
      if (sec) sec.focus();
      return;
    }
    if (act === "open-class" || act === "manage-class") {
      activateClass(btn.dataset.id);
      if (act === "manage-class" || !state.students.length) {
        state.screen = "manage";
        state.manageTab = "students";
      } else state.screen = "board";
      persist();
      render();
      return;
    }
    if (act === "class-filter") {
      state.classFilter = Number(btn.dataset.grade);
      render();
      return;
    }
    if (act === "toggle-archived") {
      state.showArchived = !state.showArchived;
      render();
      return;
    }
    if (act === "archive-class") {
      state.archived = !state.archived;
      persist();
      flash(state.archived ? "Sınıf arşive kaldırıldı. Veriler silinmedi." : "Sınıf arşivden çıkarıldı.");
      return;
    }
    if (act === "delete-class") {
      const id = btn.dataset.id;
      const c = state.classes[id];
      if (!c) return;
      const typed = prompt(`${classLabel(c)} sınıfı ve tüm puanları kalıcı olarak silinecek. Onaylamak için sınıf adını yaz: ${classLabel(c)}`);
      if (typed === null) return;
      if (typed.trim().toLocaleLowerCase("tr") !== classLabel(c).toLocaleLowerCase("tr")) {
        flash("Sınıf adı eşleşmedi, silinmedi.");
        return;
      }
      delete state.classes[id];
      if (cloud && !localMode) cloud.deleteClass(id).catch(() => flash("Bulutta silinemedi."));
      activateClass(null);
      state.screen = "classes";
      persist();
      flash(classLabel(c) + " silindi.");
      return;
    }
    if (act === "manage-tab") {
      state.manageTab = btn.dataset.tab;
      state.moveId = null;
      render();
      return;
    }
    if (act === "goto-manage" || act === "goto-ranking" || act === "goto-groups") {
      stopAuto();
      cancelRound();
      state.screen = "manage";
      state.manageTab = act === "goto-ranking" ? "ranking" : act === "goto-groups" ? "groups" : state.manageTab || "students";
      render();
      return;
    }
    if (act === "set-grade") {
      cancelRound();
      stopAuto();
      state.topicId = null;
      state.slide = 0;
      state.grade = Number(btn.dataset.grade);
      persist();
      render();
      return;
    }
    if (act === "sort-roster") {
      const by = btn.dataset.by;
      state.students.sort((a, b) => by === "no" ? (Number(a.no) || 1e9) - (Number(b.no) || 1e9) || a.name.localeCompare(b.name, "tr") : a.name.localeCompare(b.name, "tr"));
      persist();
      render();
      return;
    }
    if (act === "all-present") {
      state.students.forEach((s) => { s.absent = false; });
      persist();
      render();
      return;
    }
    if (act === "toggle-absent") {
      const s = state.students.find((x) => x.id === btn.dataset.id);
      if (!s) return;
      s.absent = !s.absent;
      if (s.absent && state.selectedId === s.id) state.selectedId = null;
      persist();
      render();
      return;
    }
    if (act === "student-points") {
      const s = state.students.find((x) => x.id === btn.dataset.id);
      if (!s) return;
      const d = Number(btn.dataset.d);
      const g = groupById(s.groupId);
      s.score = Math.max(0, s.score + d);
      if (g) g.score = Math.max(0, (g.score || 0) + d);
      persist();
      if (d > 0) MatAudio.correct();
      flash(s.name + (d > 0 ? " +" + d : " " + d) + " puan");
      return;
    }
    if (act === "group-points") {
      const g = groupById(btn.dataset.gid);
      if (!g) return;
      g.score = Math.max(0, (g.score || 0) + Number(btn.dataset.d));
      persist();
      render();
      return;
    }
    if (act === "set-group-count") { state.groupCount = Number(btn.dataset.n); render(); return; }
    if (act === "set-group-mode") { state.groupMode = btn.dataset.mode; render(); return; }
    if (act === "add-group") {
      if (state.groups.length >= 12) { flash("En fazla 12 grup kurulabilir."); return; }
      state.groups.push(groupTemplate(state.groups.length));
      persist();
      render();
      return;
    }
    if (act === "delete-group") {
      const g = groupById(btn.dataset.gid);
      if (!g || !confirm(g.name + " grubu silinsin mi? Öğrenciler grupsuz kalır, kişisel puanları korunur.")) return;
      state.groups = state.groups.filter((x) => x.id !== g.id);
      state.students.forEach((s) => { if (s.groupId === g.id) s.groupId = null; });
      state.nextGroup = 0;
      persist();
      render();
      return;
    }
    if (act === "cycle-icon") {
      const g = groupById(btn.dataset.gid);
      if (!g) return;
      g.icon = GROUP_ICONS[(GROUP_ICONS.indexOf(g.icon) + 1) % GROUP_ICONS.length];
      persist();
      render();
      return;
    }
    if (act === "group-color") {
      const g = groupById(btn.dataset.gid);
      if (!g) return;
      g.color = btn.dataset.color;
      persist();
      render();
      return;
    }
    if (act === "reset-group-scores") {
      if (!confirm("Grup puanları sıfırlansın mı? Öğrencilerin kişisel puanları korunur.")) return;
      state.groups.forEach((g) => { g.score = 0; g.asked = 0; g.correct = 0; });
      persist();
      render();
      return;
    }
    if (act === "pick-move") {
      state.moveId = state.moveId === btn.dataset.id ? null : btn.dataset.id;
      render();
      return;
    }
    if (act === "cancel-move") { state.moveId = null; render(); return; }
    if (act === "drop-move") {
      moveStudent(state.moveId, btn.dataset.gid || null);
      return;
    }
    if (act === "rank-view") { state.rankView = btn.dataset.view; render(); return; }
    if (act === "report-sort") { state.reportSort = btn.dataset.by; render(); return; }
    if (act === "report-open") {
      state.reportOpen = state.reportOpen === btn.dataset.id ? null : btn.dataset.id;
      render();
      return;
    }
    if (act === "export-csv") { exportCsv(); return; }
    if (act === "toggle-setting") {
      const key = btn.dataset.key;
      if (!["autoRotate", "fairTurns", "practice", "callout"].includes(key)) return;
      state[key] = !state[key];
      persist();
      render();
      return;
    }
    if (act === "toggle-practice") {
      state.practice = !state.practice;
      persist();
      flash(state.practice ? "🏋️ Antrenman modu açık: puan ve istatistik yazılmaz." : "Antrenman modu kapandı. Puanlar yeniden yazılıyor.");
      return;
    }
    if (act === "question-source") {
      state.questionSource = btn.dataset.source === "bank" ? "bank" : "gen";
      persist();
      render();
      return;
    }
    if (act === "rotate-mode") {
      state.rotateMode = btn.dataset.mode === "class" ? "class" : "group";
      persist();
      render();
      return;
    }
    if (act === "reset-turns") {
      state.turnDone = [];
      state.turnRound = (state.turnRound || 1) + 1;
      persist();
      flash("Sıra turu sıfırlandı. Herkes yeniden çekilebilir.");
      return;
    }
    if (act === "go-back") {
      stopAuto();
      cancelRound();
      if (state.screen === "topic" && state.topicTab === "lesson" && state.slide > 0) {
        prevSlide();
        return;
      }
      if (state.screen === "topic" && state.topicTab === "play" && state.phase !== "pick") {
        state.phase = "pick";
        state.gate = null;
        render();
        return;
      }
      if (!state.classId) { state.screen = "classes"; render(); return; }
      state.screen = "board";
      persist();
      render();
      return;
    }
    if (act === "goto-board") {
      stopAuto();
      cancelRound();
      if (!state.classId) { state.screen = "classes"; render(); return; }
      if (!state.students.length) { state.screen = "manage"; state.manageTab = "students"; flash("Önce öğrenci listesini ekle."); return; }
      state.screen = "board";
      persist();
      render();
      return;
    }
    if (act === "hide-tip") {
      state.tipHidden = true;
      persist();
      render();
      return;
    }
    if (act === "toggle-voice") {
      state.voice = !state.voice;
      MatAudio.voice = state.voice;
      if (!state.voice) stopAuto();
      persist();
      render();
      return;
    }
    if (act === "toggle-mute") {
      state.muted = !state.muted;
      MatAudio.muted = state.muted;
      persist();
      render();
      return;
    }
    if (act === "fullscreen") {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
      return;
    }
    if (act === "open") {
      openTopic(btn.dataset.id, btn.dataset.tab);
      return;
    }
    if (act === "random-any") {
      if (!present(state.students).length) {
        flash("Önce öğrenci ekle ya da yoklamayı kontrol et.");
        return;
      }
      spinPick(state.students, state.className || "Sınıf");
      return;
    }
    if (act === "random-group") {
      const g = groupById(btn.dataset.gid);
      if (!g) return;
      spinPick(members(g.id), g.icon + " " + g.name);
      return;
    }
    if (act === "next-group") {
      nextGroupPick();
      return;
    }
    if (act === "make-groups") {
      if (state.students.length < 2) {
        flash("Grup için en az 2 öğrenci gerekir.");
        return;
      }
      if (state.groups.length && !confirm("Gruplar yeniden kurulsun mu? Grup puanları sıfırlanır, öğrencilerin kişisel puanları korunur.")) return;
      makeGroups(Math.min(state.groupCount, state.students.length), state.groupMode);
      render();
      return;
    }
    if (act === "clear-groups") {
      if (!confirm("Tüm gruplar kaldırılsın mı? Kişisel puanlar korunur.")) return;
      state.groups = [];
      state.students.forEach((s) => { s.groupId = null; });
      persist();
      render();
      return;
    }
    if (act === "select") {
      state.selectedId = btn.dataset.id;
      persist();
      render();
      return;
    }
    if (act === "remove-student") {
      const s = state.students.find((x) => x.id === btn.dataset.id);
      if (!s) return;
      if ((s.score || statsOf(s).asked) && !confirm(s.name + " silinsin mi? " + s.score + " puanı ve istatistikleri de silinir.")) return;
      state.students = state.students.filter((x) => x.id !== s.id);
      state.turnDone = state.turnDone.filter((id) => id !== s.id);
      if (state.selectedId === s.id) state.selectedId = null;
      persist();
      render();
      return;
    }
    if (act === "reset-scores" || act === "reset-stats") {
      const all = act === "reset-stats";
      if (!confirm(all ? "Tüm puanlar, yıldızlar, soru istatistikleri ve tur geçmişi silinsin mi?" : "Öğrenci ve grup puanları sıfırlansın mı? Soru istatistikleri korunur.")) return;
      state.students.forEach((s) => {
        s.score = 0;
        if (all) { s.stars = {}; s.stats = blankStats(); s.lastAt = 0; }
      });
      state.groups.forEach((g) => { g.score = 0; if (all) { g.asked = 0; g.correct = 0; } });
      if (all) { state.history = []; state.turnDone = []; }
      persist();
      render();
      return;
    }
    if (act === "to-lesson") {
      stopAuto();
      cancelRound();
      state.topicTab = "lesson";
      render();
      return;
    }
    if (act === "to-play" || act === "to-levels") {
      stopAuto();
      cancelRound();
      state.topicTab = "play";
      state.phase = "pick";
      state.gate = null;
      render();
      return;
    }
    if (act === "goto-slide") {
      stopAuto();
      cancelRound();
      state.topicTab = "lesson";
      state.slide = Number(btn.dataset.i);
      render();
      return;
    }
    if (act === "slide-next") { nextSlide(); return; }
    if (act === "slide-prev") { prevSlide(); return; }
    if (act === "fig-zoom") { applyFigScale(Number(btn.dataset.d)); return; }
    if (act === "replay-lesson") { stopAuto(); MatAudio.cancelSpeak(); render(); return; }
    if (act === "speak-slide") {
      const slide = currentSlide();
      if (slide) MatAudio.speak(slide.p);
      return;
    }
    if (act === "toggle-auto") {
      state.autoplay = !state.autoplay;
      if (!state.autoplay) {
        clearTimeout(autoTimer);
        MatAudio.cancelSpeak();
        render();
      } else {
        render();
        scheduleAuto();
      }
      return;
    }
    if (act === "tahta") {
      state.tahta = !state.tahta;
      render();
      return;
    }
    if (act === "start-arcade") {
      cancelRound();
      state.topicTab = "play";
      state.phase = "arcade";
      state.arcadeGame = btn.dataset.game;
      render();
      return;
    }
    if (act === "start-level") {
      const level = Number(btn.dataset.level);
      const customInput = document.getElementById("customSeconds");
      if (customInput && !customInput.reportValidity()) return;
      if (level !== 0 && !levels().some(l => l.id === level)) return;
      const wasFinish = state.phase === "finish";
      if (wasFinish && state.autoRotate && present(state.students).length > 1) {
        autoPick(() => beginLevel(level));
        return;
      }
      if (!selected() && present(state.students).length && state.gate !== level) {
        cancelRound();
        state.gate = level;
        state.topicTab = "play";
        state.phase = "pick";
        render();
        return;
      }
      beginLevel(level);
      return;
    }
    if (act === "gate-pick") {
      state.selectedId = btn.dataset.id;
      persist();
      beginLevel(state.gate ?? 1);
      return;
    }
    if (act === "gate-random") {
      const level = state.gate ?? 1;
      spinPick(state.students, state.className || "Sınıf", () => beginLevel(level));
      return;
    }
    if (act === "gate-group") {
      const level = state.gate ?? 1;
      nextGroupPick(() => beginLevel(level));
      return;
    }
    if (act === "gate-free") {
      state.selectedId = null;
      beginLevel(state.gate ?? 1);
      return;
    }
    if (act === "choice") {
      const q = currentQ();
      if (!q || state.locked || state.paused) return;
      state.draft = q.choices[Number(btn.dataset.i)];
      submit();
      return;
    }
    if (act === "submit") { submit(); return; }
    if (act === "pause-clock") {
      if (state.locked || state.phase !== "quiz") return;
      if (state.paused) resumeClock();
      else pauseClock();
      render();
      return;
    }
    if (act === "next-q") { goNext(); return; }
    if (act === "solution") {
      const q = currentQ();
      if (!q || !state.locked) return;
      openSolution(q);
      render();
      return;
    }
    if (act === "review-solution") {
      const r = state.review[Number(btn.dataset.i)];
      if (r && r.solution) { openSolution(null, r); render(); }
      return;
    }
    if (act === "sol-next" || act === "sol-prev" || act === "sol-all" || act === "sol-close") {
      const so = state.solution;
      if (!so) return;
      if (act === "sol-close") state.solution = null;
      else so.step = act === "sol-all" ? so.sol.steps.length : Math.max(0, Math.min(so.sol.steps.length, so.step + (act === "sol-next" ? 1 : -1)));
      render();
      if (state.solution) revealSolutionStep();
      return;
    }
    if (act === "hint") {
      state.hintOpen = !state.hintOpen;
      render();
      return;
    }
    if (act === "key") { typeDigit(btn.dataset.key); return; }
    if (act === "order-add") {
      if (state.locked || state.paused || !Array.isArray(state.draft)) return;
      if (!state.draft.includes(btn.dataset.id)) state.draft.push(btn.dataset.id);
      render();
      return;
    }
    if (act === "order-undo") {
      if (state.locked || state.paused || !Array.isArray(state.draft)) return;
      state.draft.pop();
      render();
      return;
    }
    if (act === "bucket") {
      if (state.locked || state.paused) return;
      state.draft[btn.dataset.id] = Number(btn.dataset.bucket);
      render();
      return;
    }
  }

  function onInput(e) {
    if (!authenticated) return;
    if (e.target.id === "rw" || e.target.id === "rh") updateRanges();
    if (e.target.id === "cr") {
      state.sandbox.r = Number(e.target.value);
      const preview = document.getElementById("circlePreview");
      const label = document.getElementById("rLabel");
      if (label) label.textContent = String(state.sandbox.r);
      if (preview) {
        preview.innerHTML = MatVisuals.renderScene({
          kind: "circle",
          r: 28 + state.sandbox.r * 8,
          radiusLabel: "r = " + state.sandbox.r,
          diameterLabel: "R = " + (2 * state.sandbox.r)
        });
      }
      const say = preview && preview.parentElement.querySelector(".say");
      if (say) say.innerHTML = `Çap her zaman yarıçapın iki katıdır: <b>${2 * state.sandbox.r} cm</b>`;
    }
  }

  function moveStudent(id, gid) {
    const s = state.students.find((x) => x.id === id);
    state.moveId = null;
    if (!s) { render(); return; }
    s.groupId = gid && groupById(gid) ? gid : null;
    persist();
    render();
  }

  function exportCsv() {
    const cell = (v) => {
      const t = String(v ?? "");
      return /[";\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
    };
    const head = ["No", "Ad Soyad", "Grup", "Çözülen soru", "Doğru", "Yanlış", "Süre doldu", "Başarı %", "Puan", "Son oyun"];
    const rows = reportRows().map((r) => [r.s.no || "", r.s.name, r.g ? r.g.name : "", r.st.asked, r.st.correct, r.st.wrong, r.st.timeout, r.acc, r.s.score, r.s.lastAt ? new Date(r.s.lastAt).toLocaleString("tr-TR") : ""]);
    // Excel Türkçe ayarları için noktalı virgül ve UTF-8 BOM.
    const text = "﻿" + [head, ...rows].map((row) => row.map(cell).join(";")).join("\r\n");
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (state.className || "sinif").replace(/[\/\\]/g, "-") + "-rapor-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function onChange(e) {
    if (!authenticated) return;
    const el = e.target;
    if (el.id === "timeMode") {
      state.questionSeconds = el.value === "custom" ? 45 : Number(el.value);
      persist();
      render();
      return;
    }
    if (el.id === "customSeconds") {
      if (!el.reportValidity()) return;
      state.questionSeconds = Number(el.value);
      persist();
      return;
    }
    if (el.id === "roundLength") {
      state.roundLength = Number(el.value);
      persist();
      return;
    }
    if (el.id === "classSection") {
      state.section = el.value.replace(/\s+/g, " ").trim().slice(0, 12).toLocaleUpperCase("tr");
      persist();
      render();
      return;
    }
    if (el.id === "classYear") {
      state.year = el.value;
      persist();
      render();
      return;
    }
    if (el.classList.contains("g-name")) {
      const g = groupById(el.dataset.gid);
      const name = el.value.replace(/\s+/g, " ").trim();
      if (g && name) { g.name = name.slice(0, 24); persist(); }
      render();
      return;
    }
    if (el.dataset.field) {
      const s = state.students.find((x) => x.id === el.dataset.id);
      if (!s) return;
      if (el.dataset.field === "name") {
        const name = tidyName(el.value).slice(0, 40);
        const clash = state.students.some((x) => x !== s && x.name.toLocaleLowerCase("tr") === name.toLocaleLowerCase("tr"));
        if (!name || clash) {
          el.value = s.name;
          flash(clash ? name + " zaten listede." : "İsim boş olamaz.");
          return;
        }
        s.name = name;
      } else if (el.dataset.field === "no") s.no = el.value.replace(/\D/g, "").slice(0, 6);
      else if (el.dataset.field === "group") s.groupId = el.value || null;
      persist();
      if (el.dataset.field === "group") render();
      return;
    }
    if (el.dataset.act === "select-student") {
      state.selectedId = el.value || null;
      persist();
      render();
    }
  }

  function onPasteInput(e) {
    if (e.target.id !== "nameDump") return;
    const preview = document.getElementById("dumpPreview");
    if (!preview) return;
    const list = parseList(e.target.value);
    preview.innerHTML = list.length
      ? `<b>${list.length} öğrenci algılandı:</b> ${list.slice(0, 6).map((p) => esc((p.no ? p.no + " · " : "") + p.name)).join(", ")}${list.length > 6 ? " …" : ""}`
      : "Her satıra bir öğrenci. Okul numarası varsa ayrılır, BÜYÜK HARFLİ isimler düzeltilir.";
  }

  function onKey(e) {
    if (!authenticated) return;
    if (e.key === "Escape" && passwordOpen) { passwordOpen = false; render(); return; }
    if (passwordOpen) return;
    if (state.solution) {
      const so = state.solution, map = { Escape: "close", ArrowRight: 1, ArrowLeft: -1, " ": 1 };
      if (!(e.key in map)) return;
      e.preventDefault();
      if (map[e.key] === "close") state.solution = null;
      else so.step = Math.max(0, Math.min(so.sol.steps.length, so.step + map[e.key]));
      render();
      if (state.solution) revealSolutionStep();
      return;
    }
    if (e.key === "Enter" && e.target.id === "lessonAngle") { e.preventDefault(); applyLessonAngle(); return; }
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
      if (e.key === "Enter" && tag === "INPUT") {
        const id = document.activeElement.id;
        if (id === "oneName" || id === "oneNo") document.querySelector("[data-act='add-one']")?.click();
        else if (document.activeElement.classList.contains("cell-input") || document.activeElement.classList.contains("g-name") || id === "classSection") document.activeElement.blur();
      }
      return;
    }
    if (e.defaultPrevented || state.spinning) return;
    if (e.key === "Escape" && state.moveId) { state.moveId = null; render(); return; }
    if (state.screen === "topic" && state.topicTab === "lesson" && document.activeElement.id !== "dialSvg") {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    }
    if (state.screen === "topic" && state.phase === "quiz" && !state.paused) {
      if (/^\d$/.test(e.key)) typeDigit(e.key);
      if (e.key === "Backspace") { e.preventDefault(); typeDigit("geri"); }
      if (e.key === "Enter") {
        if (state.feedback) goNext();
        else submit();
      }
    }
  }

  // Grup ekranında öğrenciyi sürükleyip başka gruba bırakma.
  function onDragStart(e) {
    const chip = e.target.closest && e.target.closest("[data-drag]");
    if (!chip) return;
    e.dataTransfer.setData("text/plain", chip.dataset.drag);
    e.dataTransfer.effectAllowed = "move";
    chip.classList.add("dragging");
  }

  function onDragOver(e) {
    const box = e.target.closest && e.target.closest("[data-drop]");
    if (!box) return;
    e.preventDefault();
    document.querySelectorAll(".drag-over").forEach((el) => { if (el !== box) el.classList.remove("drag-over"); });
    box.classList.add("drag-over");
  }

  function onDrop(e) {
    const box = e.target.closest && e.target.closest("[data-drop]");
    if (!box) return;
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) moveStudent(id, box.dataset.drop || null);
  }

  // Giriş ekranındaki, oturum açmadan çalışan düğmeler.
  function onAuthClick(e) {
    const btn = e.target.closest && e.target.closest("[data-act]");
    if (!btn || authenticated) return false;
    const act = btn.dataset.act;
    if (act === "local-mode") { startLocal(); return true; }
    if (!cloud) return false;
    const email = (document.getElementById("loginEmail") || {}).value?.trim() || loginEmailDraft;
    const password = (document.getElementById("loginPassword") || {}).value || "";
    loginEmailDraft = email;
    if (act === "reset-password") {
      if (!email) { loginError = "Önce e-posta adresini yaz."; renderLogin(); return true; }
      cloud.resetPassword(email).then(() => {
        loginError = "Şifre yenileme bağlantısı " + email + " adresine gönderildi.";
        renderLogin();
      }).catch((err) => { loginError = authMessage(err); renderLogin(); });
      return true;
    }
    return false;
  }

  document.addEventListener("click", (e) => { if (!onAuthClick(e)) onClick(e); });
  document.addEventListener("input", (e) => { onInput(e); onPasteInput(e); });
  document.addEventListener("change", onChange);
  document.addEventListener("submit", onLoginSubmit);
  document.addEventListener("submit", onPasswordSubmit);
  document.addEventListener("keydown", onKey);
  document.addEventListener("dragstart", onDragStart);
  document.addEventListener("dragover", onDragOver);
  document.addEventListener("drop", onDrop);
  document.addEventListener("dragend", () => document.querySelectorAll(".dragging,.drag-over").forEach((el) => el.classList.remove("dragging", "drag-over")));
  document.addEventListener("fullscreenchange", () => {
    if (!authenticated) return;
    document.body.classList.toggle("is-fs", !!document.fullscreenElement);
    document.body.classList.toggle("classroom-fullscreen", !!document.fullscreenElement && state.screen === "topic" && state.topicTab === "lesson");
    scheduleLessonFit();
  });
  window.addEventListener?.("resize", scheduleLessonFit);
  document.addEventListener("toggle", scheduleLessonFit, true);
  document.fonts?.ready.then(scheduleLessonFit);

  if (cloud) {
    cloud.onStatus((s) => {
      const el = document.getElementById("syncState");
      if (el && !localMode) { el.dataset.s = s; el.textContent = syncText(s); }
    });
    cloud.onAuth((user) => {
      authReady = true;
      loginBusy = false;
      if (user && !authenticated) startCloud();
      else if (!user && authenticated && !localMode) { authenticated = false; renderLogin(); }
      else if (!user) renderLogin();
    });
    renderLogin();
  } else renderLogin();
})();
