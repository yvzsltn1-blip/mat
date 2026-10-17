(function (root) {
  "use strict";
  const R = root.MatTournamentRules;
  let host, ctx, timer, drawTimer, started = 0, baseline = 0, treeRound = null, sheet = null;
  // Students the teacher removed on the setup screen (e.g. not in class today).
  const excluded = new Set();
  const entrants = () => ctx.students().filter(p => !excluded.has(p.id));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const seconds = ms => (ms / 1000).toFixed(2).replace(".", ",") + " sn";
  const shuffle = a => MatGames.shuffle(Math.random, a);
  const current = () => ctx.get();
  const save = () => ctx.save(current());
  const button = (act, text, extra = "") => `<button type="button" class="solid" data-t="${act}" ${extra}>${text}</button>`;
  const playerName = id => current().players.find(p => p.id === id)?.name || "Bekleniyor";
  const name = id => esc(playerName(id));
  const match = () => current().rounds[current().round]?.find(m => !m.winner);
  const phaseKey = () => current().mode === "qualify" ? "qualify" : String(current().rounds[current().round].length * 2);
  const settings = () => current().settings[phaseKey()];
  // Göz kararı keeps its time limit in overtime: the question waits for both estimates.
  const limit = () => current().mode === "duel" && match()?.overtime && !settings().eye ? Infinity : settings().seconds * 1000;
  const deg = v => String(Math.round(v * 100) / 100).replace(".", ",") + "°";
  // Setup values the teacher entered last time (topics and each phase), kept in this browser.
  const STORE = "mat.tournament.setup";
  function remembered() { try { return JSON.parse(root.localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } }
  function remember(patch) { try { root.localStorage.setItem(STORE, JSON.stringify({...remembered(), ...patch})); } catch (e) { /* private mode: nothing to keep */ } }
  function withRemembered(configs) {
    const kept = remembered().phases || {};
    for (const key of Object.keys(configs)) {
      const c = kept[key];
      if (!c) continue;
      if (Number.isInteger(c.level) && c.level >= 1 && c.level <= R.levels.length) configs[key].level = c.level;
      if (Number.isInteger(c.seconds) && c.seconds >= 5 && c.seconds <= 300) configs[key].seconds = c.seconds;
      if (["choice","number"].includes(c.format)) configs[key].format = c.format;
      configs[key].eye = !!c.eye;
    }
    return configs;
  }
  function rememberForm(form, configs) {
    const config = readSettings(form, configs);
    if (config) remember({phases:{...(remembered().phases || {}), ...config}});
    if (form.elements.topicFrom) remember({topicFrom:form.elements.topicFrom.value, topicTo:form.elements.topicTo.value});
  }
  // Step-by-step solution of the question just played, shown with the game's solution sheet.
  function solutionOf(q) {
    if (q.eye) {
      const rule = {complement:"Tümler açıların ölçüleri toplamı 90°'dir.", supplement:"Bütünler açıların ölçüleri toplamı 180°'dir."}[q.eye];
      const steps = [{t:`Kırmızı kol ile siyah kol arasındaki açı ${q.deg}°'dir.`}];
      if (rule) steps.push({t:rule}, {t:`${q.eye === "complement" ? 90 : 180}° − ${q.deg}° = ${q.answer}°`});
      return {idea:rule || "Açıyı dik açı (90°) ve doğru açı (180°) ile karşılaştırarak tahmin et.", steps};
    }
    return ctx.solution?.(q) || {idea:"", steps:[]};
  }
  const hasSolution = q => !!q && solutionOf(q).steps.length > 0;
  const solutionButton = t => hasSolution(t.q) ? `<button type="button" class="soft tr-sol-open" data-t="sol-open">📖 Adım adım çözüm</button>` : "";
  // Numbers stand out; digits inside HTML entities (&#39;) are left alone.
  const solText = s => esc(s).replace(/(?<![#\w&])(\d+(?:[.,]\d+)*)/g, '<b class="sn">$1</b>');
  function solutionSheet() {
    const q = current()?.q;
    if (!sheet || !q) return "";
    const steps = sheet.sol.steps, shown = Math.min(sheet.step, steps.length), done = shown >= steps.length;
    return `<div class="sol-backdrop" data-t="sol-close"></div>
      <section class="sol-sheet" role="dialog" aria-modal="true" aria-label="Adım adım çözüm">
        <header class="sol-head"><span class="sol-kicker">📖 ADIM ADIM ÇÖZÜM</span><button type="button" class="sol-x" data-t="sol-close" aria-label="Çözümü kapat">✕</button></header>
        <div class="sol-body">
          <div class="sol-question"><p>${MatVisuals.angleMarks(esc(q.prompt))}</p>${q.scene?.html ? `<div class="sol-scene"><div class="stage">${q.scene.html}</div></div>` : ""}</div>
          <div class="sol-steps">
            ${sheet.sol.idea ? `<div class="sol-idea"><b>💡 Ana fikir</b><p>${solText(sheet.sol.idea)}</p></div>` : ""}
            <ol>${steps.slice(0, shown).map((st, i) => `<li class="sol-step${i === shown - 1 ? " now" : ""}"><span class="sol-no">${i + 1}</span><div><p>${solText(st.t)}</p>${st.fig ? `<div class="sol-fig stage art-stage">${st.fig}</div>` : ""}</div></li>`).join("")}</ol>
            ${done ? `<div class="sol-answer">✔ Cevap: <b>${esc(q.eye ? deg(q.answer) : q.answer + (q.unit ? " " + q.unit : ""))}</b></div>` : ""}
          </div>
        </div>
        <footer class="sol-actions">
          <button type="button" class="soft" data-t="sol-prev" ${sheet.step ? "" : "disabled"}>◀ Geri</button>
          <span class="sol-count">${shown} / ${steps.length} adım</span>
          ${done ? `<button type="button" class="check-btn" data-t="sol-close">Anladım ✔</button>` : `<button type="button" class="soft" data-t="sol-all">Hepsini göster</button><button type="button" class="check-btn" data-t="sol-next">${shown ? "Sonraki adım ▶" : "Çözüme başla ▶"}</button>`}
        </footer>
      </section>`;
  }
  function moveSheet(act) {
    if (act === "sol-close") sheet = null;
    else sheet.step = act === "sol-all" ? sheet.sol.steps.length : Math.max(0, Math.min(sheet.sol.steps.length, sheet.step + (act === "sol-next" ? 1 : -1)));
    paint();
    if (sheet) root.requestAnimationFrame?.(() => host?.querySelector(".sol-answer, .sol-step.now")?.scrollIntoView?.({block:"nearest", behavior:"smooth"}));
  }
  const elapsed = () => Math.min(limit(), baseline + performance.now() - started);
  function stop() { clearInterval(timer); clearInterval(drawTimer); timer = drawTimer = null; }
  function captureDrafts() {
    const t = current();
    if (!t || t.stage !== "question") return;
    for (let side = 0; side < (t.mode === "qualify" ? 1 : 2); side++) {
      const input = host.querySelector(`[data-answer="${side}"]`);
      if (input) t.drafts[side] = input.value;
    }
  }
  function pause() {
    const t = current();
    if (t?.stage === "question") { captureDrafts(); t.elapsed = elapsed(); t.stage = "paused"; save(); }
    stop();
  }
  function clock() {
    baseline = current().elapsed || 0; started = performance.now();
    clearInterval(timer);
    timer = setInterval(() => {
      if (!host?.isConnected) { pause(); return; }
      const cap = limit(), remaining = Math.max(0, cap - elapsed());
      const el = host.querySelector("[data-clock]");
      if (el) el.textContent = cap === Infinity ? "∞ Süresiz" : seconds(remaining);
      if (!remaining) settle(null, true);
    }, 30);
  }
  function beginQuestion() {
    const t = current(), config = settings();
    if (config.eye) {
      // The whole elimination gets one kind, so every student solves the same task; duels draw one per question.
      if (t.mode === "qualify") t.eyeKind ||= R.EYE_KINDS[Math.floor(Math.random() * R.EYE_KINDS.length)];
      t.q = R.eyeQuestion(t.mode === "qualify" ? t.eyeKind : R.EYE_KINDS[Math.floor(Math.random() * R.EYE_KINDS.length)]);
    } else try {
      let lock;
      if (t.mode === "qualify") {
        // Same kind of question for every student in the elimination, so times are comparable.
        const key = config.level + "|" + config.format;
        if (t.lock?.key !== key) {
          t.lock = null;
          // With several topics the whole elimination still uses one topic and one kind of question.
          for (const topic of shuffle(t.topics)) {
            let shape = null;
            try { shape = R.pickShape(topic, config.level, config.format, t.players.length); } catch (e) { shape = null; }
            if (shape) { t.lock = {key, topic, template:shape.template, family:shape.family, asked:[], uses:{}}; break; }
          }
        }
        lock = t.lock;
      }
      // Duels draw each question from a random selected topic; both rivals see the same one.
      let q = null, error = null;
      for (const topic of lock ? [lock.topic] : shuffle(t.topics)) {
        try { q = {...R.question(topic, config.level, config.format, lock), topic}; break; } catch (e) { error = e; }
      }
      if (!q) throw error;
      t.q = q;
      if (lock) { lock.asked.push(t.q.seen); lock.uses[t.q.shape] = (lock.uses[t.q.shape] || 0) + 1; }
    }
    catch (e) { host.querySelector("[data-message]").textContent = e.message; return; }
    sheet = null;
    t.stage = "question"; t.elapsed = 0; t.startedAt = Date.now(); t.answers = {}; t.drafts = {}; t.message = "";
    save(); paint(); clock();
  }
  // Göz kararı results also carry err (distance to the true value): closer first, then faster.
  const ranks = t => [...t.results].sort((a,b) => Number(b.ok)-Number(a.ok) || (a.err ?? 0)-(b.err ?? 0) || a.ms-b.ms || a.tie-b.tie);
  function advance(m) {
    const t = current();
    t.message += ` ${playerName(m.winner)} ${phaseKey() === "2" ? "şampiyon oldu!" : "üst tura çıktı!"} (${m.scores.join("–")})`;
    if (!t.rounds[t.round].every(x => x.winner)) return;
    const winners = t.rounds[t.round].map(x => x.winner);
    if (winners.length === 1) {
      t.champion = winners[0]; t.stage = "champion";
      if (!t.awarded) { ctx.award(t.champion, t.practice); t.awarded = true; }
      MatAudio.fanfare(); return;
    }
    t.rounds.push(Array.from({length:winners.length / 2}, (_,i) => R.createMatch(winners.slice(i*2,i*2+2))));
    t.round++;
  }
  function settle(side, timeout) {
    const t = current();
    if (t.stage !== "question" || t.view === "bracket" || t.answers[side]) return;
    const cap = limit(), rawMs = elapsed(), ms = Math.round(rawMs / 10) * 10;
    if (rawMs >= cap) { timeout = true; side = null; }
    if (t.q.eye) { settleEye(side, timeout, ms, cap); return; }
    let ok = false;
    if (!timeout) {
      captureDrafts();
      const raw = String(t.drafts[side] || "").trim();
      if (!raw) { host.querySelector(`[data-answer="${side}"]`)?.focus(); return; }
      if (t.q.kind === "mc") ok = raw === String(t.q.answer);
      else {
        const actual = R.numericValue(raw), expected = R.numericValue(t.q.answer);
        if (actual === null) { host.querySelector("[data-message]").textContent = "Geçerli bir sayı yazın. Kesir için / kullanabilirsiniz."; return; }
        ok = Math.abs(actual - expected) <= 1e-9;
      }
      t.answers[side] = {ok, ms};
      if (!ok && t.mode === "duel" && Object.keys(t.answers).length < 2) {
        save(); MatAudio.wrong(); paint(); return;
      }
    }
    clearInterval(timer); timer = null;
    t.message = (timeout ? "Süre doldu." : ok ? "Doğru cevap!" : "Yanlış cevap.") + ` Cevap: ${t.q.answer}${t.q.unit ? " " + t.q.unit : ""}.`;
    t.stage = "result";
    if (t.mode === "qualify") {
      const p = t.players[t.results.length];
      t.results.push({id:p.id, ok, ms:ok ? ms : cap, tie:p.tie});
      if (t.results.length === t.players.length) t.stage = "ranking";
    } else {
      const m = match();
      R.recordQuestion(m, ok ? Number(side) : null);
      if (m.winner) advance(m);
      else if (m.overtime) t.message += " Beraberlik: süresiz uzatma. İlk doğru cevap kazandırır.";
      else t.message += ` ${m.questions}/3 soru tamamlandı. Skor ${m.scores.join("–")}.`;
    }
    (ok ? MatAudio.correct : MatAudio.wrong).call(MatAudio);
    save(); paint();
  }
  function settleEye(side, timeout, ms, cap) {
    const t = current(), m = t.mode === "duel" ? match() : null;
    if (!timeout) {
      captureDrafts();
      const raw = String(t.drafts[side] || "").trim();
      if (!raw) { host.querySelector(`[data-answer="${side}"]`)?.focus(); return; }
      const guess = R.numericValue(raw);
      if (guess === null) { host.querySelector("[data-message]").textContent = "Geçerli bir sayı yazın."; return; }
      t.answers[side] = {guess, err:Math.abs(guess - t.q.answer), ms};
      // A duel question closes only when both rivals have estimated (or time runs out).
      if (m && Object.keys(t.answers).length < 2) { save(); paint(); return; }
    }
    clearInterval(timer); timer = null;
    const ids = m ? m.ids : [t.players[t.results.length].id];
    t.message = `Gerçek değer ${deg(t.q.answer)}. ` + ids.map((id,i) => { const a = t.answers[i]; return `${playerName(id)}: ${a ? `${deg(a.guess)} · fark ${deg(a.err)}` : "tahmin yok"}`; }).join(" · ") + ".";
    t.stage = "result";
    if (!m) {
      const p = t.players[t.results.length], a = t.answers[0];
      t.results.push({id:p.id, ok:!!a, err:a ? a.err : null, ms:a ? a.ms : cap, tie:p.tie});
      if (t.results.length === t.players.length) t.stage = "ranking";
    } else {
      const win = R.eyeWinner(t.answers[0], t.answers[1]);
      R.recordQuestion(m, win);
      t.message += win === null ? " Bu soru berabere." : ` ${playerName(m.ids[win])} soruyu aldı${t.answers[0] && t.answers[1] && t.answers[0].err === t.answers[1].err ? " (fark eşit, daha hızlı cevap verdi)" : ""}.`;
      if (m.winner) advance(m);
      else if (m.overtime) t.message += " Beraberlik: uzatma sorusu. Soruyu alan kazanır.";
      else t.message += ` ${m.questions}/3 soru tamamlandı. Skor ${m.scores.join("–")}.`;
    }
    (Object.keys(t.answers).length ? MatAudio.correct : MatAudio.wrong).call(MatAudio);
    save(); paint();
  }
  // The tree shows one round per screen; tabs and the next/previous buttons move between rounds.
  function bracket(t) {
    const display = [...t.rounds];
    while (display.length && display[display.length - 1].length > 1) {
      const previous = display[display.length - 1];
      display.push(Array.from({length:previous.length / 2}, (_,i) => ({ids:[previous[i*2].winner || null,previous[i*2+1].winner || null],scores:["—","—"]})));
    }
    const at = Math.min(Math.max(treeRound ?? t.round ?? 0, 0), display.length - 1), round = display[at] || [];
    const live = at === t.round && t.mode === "duel" ? match() : null;
    const roundName = r => R.phaseName(String(r.length * 2));
    const player = (m, j) => {
      const id = m.ids[j], won = !!m.winner && m.winner === id, lost = !!m.winner && !won;
      return `<div class="tr-mp ${won ? "win" : lost ? "lose" : ""} ${id ? "" : "tbd"}"><span class="tr-mn">${won ? "👑 " : ""}${name(id)}</span><b>${m.scores[j]}</b></div>`;
    };
    const card = (m, j) => `<div class="tr-m ${m === live ? "live" : ""} ${m.winner ? "done" : ""}" style="--i:${j}">${m === live ? '<span class="tr-live">SIRADAKİ MAÇ</span>' : ""}${player(m, 0)}<i class="tr-vs" aria-hidden="true">VS</i>${player(m, 1)}</div>`;
    const step = (r, label, cls) => r >= 0 && r < display.length ? `<button type="button" class="tr-step ${cls}" data-t="tree-round" data-r="${r}">${label}</button>` : "";
    return `<section class="tr-board tr-tree"><header class="tr-board-head"><span class="tr-kicker">ŞAMPİYONLUK YOLU</span><h2>${roundName(round)}</h2><p>${t.stage === "paused" ? "Soru duraklatıldı. Ağacı kapatınca Devam et ile süre kaldığı yerden başlar." : `${round.length} maç · kazananlar ${at < display.length - 1 ? roundName(display[at + 1]).toLocaleLowerCase("tr") + " turuna çıkar" : "şampiyon olur"}`}</p></header>
      <nav class="tr-tabs" aria-label="Turlar">${display.map((r,i) => `<button type="button" class="${i === at ? "on" : ""} ${i < t.round || r.every(m => m.winner) ? "past" : ""}" data-t="tree-round" data-r="${i}" aria-current="${i === at}">${roundName(r)}</button>`).join("")}</nav>
      <div class="tr-round ${round.length === 1 ? "tr-round-final" : ""}" data-round="${at}">${round.map(card).join("")}</div>
      ${at === display.length - 1 && t.champion ? `<div class="tr-champ-plate"><span>🏆</span><small>ŞAMPİYON</small><b>${name(t.champion)}</b></div>` : ""}
      <div class="tr-steps-nav">${step(at - 1, "‹ Önceki tur", "back")}${step(at + 1, "Sonraki tur ›", "next")}</div></section>`;
  }
  // Elimination standings: game-style plates, the qualifying line drawn between the last
  // student going up and the first one out.
  function standings(t) {
    const list = ranks(t);
    const value = r => !r.ok ? ["", r.err === null ? "Tahmin yok" : "Yanlış / süre doldu"] : r.err != null ? ["FARK", deg(r.err)] : ["SÜRE", seconds(r.ms)];
    const row = (r, i) => { const [label, v] = value(r), up = i < t.cut; return `<li class="tr-row ${up ? "up" : "out"} ${i < 3 ? "top" + (i + 1) : ""}" style="--i:${Math.min(i, 18)}"><b class="tr-rk">${i + 1}</b><span class="tr-rn">${name(r.id)}</span><span class="tr-rv">${label ? `<small>${label}</small>` : ""}${v}${r.ok && r.err != null ? `<small>${seconds(r.ms)}</small>` : ""}</span><em>${up ? "ÜST TUR" : "ELENDİ"}</em></li>`; };
    return `<section class="tr-board tr-standings"><header class="tr-board-head"><span class="tr-kicker">İLK TUR · ELEME</span><h2>Puan durumu</h2><p>İlk ${t.cut} öğrenci üst tura çıkar · ${t.players.length - t.cut} öğrenci elenir</p></header>
      <ol class="tr-ranks">${list.map((r,i) => (i === t.cut ? '<li class="tr-cut" aria-hidden="true"><span>ÜST TUR SINIRI</span></li>' : "") + row(r,i)).join("")}</ol>
      <div class="tr-steps-nav">${solutionButton(t)}${button("draw","Eşleşme kurasını çek ✦")}</div></section>`;
  }
  function answerPanel(id, side, q) {
    const t = current(), disabled = t.answers[side] ? "disabled" : "", draft = t.drafts[side] || "";
    let entry;
    if (q.kind === "mc") {
      entry = `<input type="hidden" data-answer="${side}" value="${esc(draft)}"><div class="tr-choices" role="group" aria-label="Cevap seçenekleri">${q.choices.map((choice,i) => `<button type="button" class="tr-choice ${draft === String(choice) ? "selected" : ""}" data-choice="${i}" data-side="${side}" aria-pressed="${draft === String(choice)}" ${disabled}><b>${"ABCD"[i]}</b><span>${MatVisuals.angleMarks(esc(String(choice).replace(/(\d) (?=\d)/g, "$1\u00a0")))}</span></button>`).join("")}</div>`;
    } else {
      // Keep the keypad stable: its keys must not reveal the answer's sign/type.
      const extra = t.topics.some(id => id.startsWith("m7-")) ? ["−",",","/"] : [];
      entry = `<label class="tr-entry-label" for="trAnswer${side}">SONUCU YAZ${q.unit ? " · " + esc(q.unit) : ""}</label><input id="trAnswer${side}" class="tr-number-display" data-answer="${side}" value="${esc(draft)}" autocomplete="off" inputmode="decimal" maxlength="40" placeholder="…${q.unit ? " " + esc(q.unit) : ""}" ${disabled}><div class="tr-keypad">${[1,2,3,4,5,6,7,8,9,"Sil",0,"⌫"].map(k => `<button type="button" class="${typeof k === "string" ? "tr-erase" : ""}" data-key="${k}" data-side="${side}" aria-label="${k === "⌫" ? "Son rakamı sil" : k === "Sil" ? "Tümünü sil" : k}" ${disabled}>${k}</button>`).join("")}</div>${extra.length ? `<div class="tr-extra-keys">${extra.map(k => `<button type="button" data-key="${k}" data-side="${side}" ${disabled}>${k}</button>`).join("")}</div>` : ""}`;
    }
    return `<form data-side="${side}" class="tr-answer"><h3>${name(id)}</h3>${entry}<button class="tr-confirm" ${disabled}>✓ Cevabı kontrol et</button><span data-feedback role="status">${disabled ? (q.eye ? "Tahminin alındı. Rakibin bekleniyor." : "Yanlış cevap. Rakibin yanıtı bekleniyor.") : ""}</span></form>`;
  }
  function settingsFields(configs) {
    return `<div class="tr-phase-settings">${Object.entries(configs).sort(([a],[b]) => a === "qualify" ? -1 : b === "qualify" ? 1 : Number(b)-Number(a)).map(([key,c]) => `<fieldset data-phase="${key}" class="${c.eye ? "is-eye" : ""}"><legend>${R.phaseName(key)}</legend><label class="tr-eye"><input type="checkbox" name="eye_${key}" ${c.eye ? "checked" : ""}><span>🎯 Göz kararı</span><small>${key === "qualify" ? "Tümleyen, bütünleyen veya açı tahmini · herkese aynı tür" : "Tümleyen, bütünleyen, açı tahmini karışık"}</small></label><div class="tr-setting-row"><label>Soru seviyesi<select name="level_${key}">${R.levels.map((label,i) => `<option value="${i+1}" ${c.level === i+1 ? "selected" : ""}>${label}</option>`).join("")}</select></label><label>Süre (sn)<input name="seconds_${key}" type="number" value="${c.seconds}" min="5" max="300" required></label><label>Cevap biçimi<select name="format_${key}"><option value="number" ${c.format !== "choice" ? "selected" : ""}>Sayı gir · tuş takımı</option><option value="choice" ${c.format === "choice" ? "selected" : ""}>4 şıklı test</option></select></label></div></fieldset>`).join("")}</div>`;
  }
  function readSettings(form, configs) {
    const updated = {};
    for (const key of Object.keys(configs)) {
      const level = Number(form.elements[`level_${key}`].value), duration = Number(form.elements[`seconds_${key}`].value);
      if (!Number.isInteger(level) || level < 1 || level > R.levels.length || !Number.isInteger(duration) || duration < 5 || duration > 300) return null;
      updated[key] = {level, seconds:duration, format:form.elements["format_" + key]?.value === "choice" ? "choice" : "number", eye:!!form.elements["eye_" + key]?.checked};
    }
    return updated;
  }
  const topicLabel = x => (x.no ? x.no + " · " : "") + (x.title || x.name || x.id);
  const topicTitle = id => { const x = ctx.topics().find(x => x.id === id); return x ? x.title || x.name || id : id; };
  // Selected topics: everything from the first to the last chosen topic, in curriculum order.
  function chosenTopics(form) {
    const list = ctx.topics(), a = list.findIndex(x => x.id === form.elements.topicFrom.value), b = list.findIndex(x => x.id === form.elements.topicTo.value);
    if (a < 0 || b < 0) return [];
    return list.slice(Math.min(a,b), Math.max(a,b) + 1);
  }
  const topicSummary = topics => topics.length > 1 ? `${topics.length} konu karışık sorulur: ${topics[0].no || 1}–${topics[topics.length-1].no || topics.length}.` : "Tek konu.";
  function topicRange() {
    const list = ctx.topics(), kept = remembered();
    const at = id => Math.max(0, list.findIndex(x => x.id === id));
    const from = at(kept.topicFrom), to = Math.max(from, at(kept.topicTo));
    const options = sel => list.map((x,i) => `<option value="${esc(x.id)}" ${i === sel ? "selected" : ""}>${esc(topicLabel(x))}</option>`).join("");
    return `<fieldset class="tr-topic-range"><legend>Konular</legend><label>İlk konu<select name="topicFrom">${options(from)}</select></label><label>Son konu<select name="topicTo">${options(to)}</select></label><p class="fine" data-topic-summary>${topicSummary(list.slice(from, to + 1))}</p></fieldset>`;
  }
  function paintSetup() {
    const all = ctx.students(), players = all.filter(p => !excluded.has(p.id)), cut = R.bracketSize(players.length);
    host.innerHTML = `<section class="tr-hero tr-hero-compact"><div><span class="tr-kicker">SINIFIN BÜYÜK BULUŞMASI</span><h1>Şampiyonlar Turnuvası <span>✦</span></h1><p>Keşfet. Eşleş. Kapış. Yıldızını kazan.</p></div><div class="tr-steps"><span>01 · ${players.length === cut ? "Doğrudan kura" : "Hız elemeleri"}</span><span>02 · Üç soruluk maç</span><span>03 · Beraberlikte uzatma</span><span>★ × 3 = 🏆</span></div></section><div class="tr-setup"><section class="tr-card"><h2>Turnuvayı hazırla</h2><form data-setup>${topicRange()}<p class="tr-format-note">${players.length < 2 ? "En az iki öğrenci gerekir." : players.length === cut ? `${players.length} öğrenci · Eleme yok. Doğrudan ${R.phaseName(String(cut)).toLocaleLowerCase("tr")} kurası.` : `${players.length} öğrenci · İlk ${cut} ilerler, ${players.length-cut} öğrenci elenir.`}</p>${settingsFields(withRemembered(R.defaults(players.length)))}<p class="fine">Göz kararı işaretli turda öğrenciler açıyı tahmin edip derece yazar; gerçeğe en yakın olan önde olur, fark eşitse hızlı olan geçer.</p><p class="fine">Elemede önce doğruluk, sonra 0,01 saniye hassasiyetinde süre sıralanır. Yanlış/boş cevaplar sona kalır. Tam eşitlikte başlangıç kurası geçerlidir.</p><p class="fine">Maçta 2 puana ulaşan hemen kazanır. Yanlış/boş sorular dahil 3 soru sonunda önde olan ilerler. Beraberlikte süre sınırı kalkar; ilk doğru cevap kazanır. İki yanlış olursa yeni uzatma sorusu açılır.</p>${ctx.practice() ? '<p class="note">Antrenman açık: yıldız ve kupa verilmez.</p>' : ""}<button class="solid big" ${players.length < 2 ? "disabled" : ""}>Turnuvayı başlat →</button><p data-message role="alert"></p></form></section><section class="tr-card"><h2>Katılımcılar <small>${players.length}${players.length < all.length ? ` / ${all.length}` : ""}</small></h2><div class="tr-roster tr-pick">${all.map(p => `<label class="${excluded.has(p.id) ? "tr-out" : ""}"><input type="checkbox" data-roster="${esc(p.id)}" ${excluded.has(p.id) ? "" : "checked"}><span>${esc(p.name)}</span><b>★ ${p.tournamentStars || 0} · 🏆 ${Math.floor((p.tournamentStars || 0)/3)}</b></label>`).join("") || "Sınıf yönetiminden öğrenci ekleyin."}</div><p class="fine">Sınıfta olmayan öğrencinin işaretini kaldırarak onu turnuvadan çıkarın. Yoklamada bulunmayan öğrenciler zaten katılmaz. Her 3 şampiyonluk yıldızı bir kupa kazandırır.</p></section></div>`;
  }
  function paint() {
    const t = current();
    document.body?.classList.toggle("tournament-question", !!t && t.stage === "question" && !t.view);
    if (!t) { paintSetup(); return; }
    const config = settings(), m = t.mode === "duel" ? match() : null;
    let body = "";
    if (t.view === "bracket") body = bracket(t);
    else if (t.view === "settings") body = `<section class="tr-card"><h2>Aşama ayarları</h2><p class="fine">Değişiklikler sonraki sorudan itibaren uygulanır.</p><form data-settings>${settingsFields(t.settings)}<button class="solid">Ayarları kaydet</button>${button("settings-cancel","Geri dön")}<p data-settings-message role="alert"></p></form></section>`;
    else if (["ready","result"].includes(t.stage)) {
      body = `<section class="tr-card tr-center"><p role="status">${esc(t.message || "")}</p><h2>${t.mode === "qualify" ? `${name(t.players[t.results.length].id)}, sıra sende!` : m.ids.map(name).join(" <span>⚔</span> ")}</h2><p>${t.mode === "qualify" ? `${t.results.length+1} / ${t.players.length} öğrenci` : `Skor ${m.scores.join(" – ")} · ${m.overtime ? "Süresiz uzatma · İlk doğru cevap kazanır" : `Soru ${m.questions+1}/3`}`}</p><p class="fine">${config.eye ? "🎯 Göz kararı" : R.levels[config.level-1]} · ${m?.overtime && !config.eye ? "Süre sınırı yok" : config.seconds + " saniye"}</p><div class="tr-result-actions">${t.stage === "result" ? solutionButton(t) : ""}${button("question","Hazırım · Soruyu aç")}</div></section>`;
    } else if (["question","paused"].includes(t.stage)) {
      if (t.stage === "paused") body = `<section class="tr-card tr-center"><h2>Turnuva duraklatıldı</h2><p>Süreniz, yazdığınız cevap ve cevap haklarınız korunuyor.</p>${button("resume","Devam et")}</section>`;
      else {
        const cap = limit(), remaining = Math.max(0, cap - (timer ? elapsed() : t.elapsed || 0));
        body = `<section class="tr-card tr-question-card ${t.mode === "duel" ? "tr-duel-question" : "tr-single-question"}"><div class="tr-question-head"><span>${R.phaseName(phaseKey())} · ${t.mode === "qualify" ? `${t.results.length+1}/${t.players.length}` : m.overtime ? "UZATMA" : `Soru ${m.questions+1}/3`}<small>${t.q.eye ? "🎯 Göz kararı · " + R.EYE_NAMES[t.q.eye] : R.levels[config.level-1]}${t.topics.length > 1 && !t.q.eye ? " · " + esc(topicTitle(t.q.topic)) : ""}${m ? " · Skor " + m.scores.join(" : ") : ""}</small></span><b data-clock>${cap === Infinity ? "∞ Süresiz" : seconds(remaining)}</b>${button("pause","Duraklat")}</div><div class="tr-question-main"><h2 class="tr-prompt">${MatVisuals.angleMarks(esc(t.q.prompt))}</h2><div class="tr-figure">${t.q.scene?.html || ""}</div></div><div class="tr-answers">${(t.mode === "qualify" ? [t.players[t.results.length].id] : m.ids).map((id,i) => answerPanel(id,i,t.q)).join("")}</div></section>`;
      }
    } else if (t.stage === "ranking") {
      body = standings(t);
    } else if (t.stage === "drawing") body = `<section class="tr-card tr-center tr-drawing"><div class="tr-orb">✦</div><h2>Eşleşmeler hazırlanıyor…</h2><p data-draw>Şans, heyecan ve matematik!</p></section>`;
    else if (t.stage === "champion") {
      const p = ctx.students(true).find(x => x.id === t.champion);
      body = `<section class="tr-hero tr-center"><div class="tr-trophy">🏆</div><span class="tr-kicker">TURNUVA ŞAMPİYONU</span><h1>${name(t.champion)}</h1><p>${t.practice ? "Antrenman tamamlandı." : `+1 şampiyonluk yıldızı · Toplam ★ ${p?.tournamentStars || 0} · 🏆 ${Math.floor((p?.tournamentStars || 0)/3)} kupa`}</p><div class="tr-result-actions">${solutionButton(t)}${button("new","Yeni turnuva")}</div></section>`;
    }
    host.innerHTML = `<div class="tr-title"><div><span class="tr-kicker">ŞAMPİYONLAR TURNUVASI</span><h2>${esc(t.topicName)}</h2></div><div class="actions"><button type="button" class="soft tr-exit-fullscreen" data-act="fullscreen" aria-label="Tam ekrandan çık">⛶<span> Tam ekrandan çık</span></button>${t.rounds.length && t.stage !== "drawing" ? button("tree",t.view === "bracket" ? "✕ Ağacı kapat" : "🏆 Turnuva ağacı",`aria-expanded="${t.view === "bracket"}"`) : ""}${["ready","result","ranking"].includes(t.stage) && !t.view ? button("settings","⚙ Aşama ayarları") : ""}${t.stage !== "champion" ? button("reset","Turnuvayı bitir") : ""}</div></div>${body}<p data-message role="status"></p>${!t.view && !t.rounds.length ? `<details class="tr-card"><summary>Tüm katılımcılar (${t.players.length})</summary><div class="tr-roster">${t.players.map(p => `<div>${esc(p.name)}<span>${t.results.some(r=>r.id===p.id) ? "Tamamladı" : "Sırasını bekliyor"}</span></div>`).join("")}</div></details>` : ""}${solutionSheet()}`;
    fitFigures();
    fitChoices();
  }
  // A key or choice changes only its own side, so the other student's touch is never re-rendered away.
  function press(control) {
    const t = current(), side = control.dataset.side;
    if (!t || t.stage !== "question" || t.view || control.disabled || t.answers[side]) return;
    captureDrafts();
    if (control.dataset.choice !== undefined) {
      t.drafts[side] = String(t.q.choices[Number(control.dataset.choice)]);
      for (const b of host.querySelectorAll(`[data-choice][data-side="${side}"]`)) {
        const on = b === control || b.dataset.choice === control.dataset.choice;
        b.classList.toggle("selected", on); b.setAttribute("aria-pressed", String(on));
      }
    } else {
      const value = t.drafts[side] || "", k = control.dataset.key;
      t.drafts[side] = k === "Sil" ? "" : k === "⌫" ? value.slice(0, -1) : (value + k).slice(0, 40);
    }
    const input = host.querySelector(`[data-answer="${side}"]`);
    if (input) input.value = t.drafts[side];
  }
  // Choice values stay on one line: each panel's options shrink together to the size of
  // the widest one; text that still cannot fit at the floor size wraps between words.
  function fitChoices() {
    for (const group of host.querySelectorAll(".tr-choices")) {
      const spans = [...group.querySelectorAll(".tr-choice > span")];
      spans.forEach(s => { s.style.fontSize = ""; s.classList.remove("tr-wrap"); });
      if (!spans.length || !spans[0].clientWidth) continue;
      let size = parseFloat(getComputedStyle(spans[0]).fontSize);
      const overflows = () => spans.some(s => s.scrollWidth > s.clientWidth + 1);
      while (overflows() && size > 10) {
        size -= 1;
        spans.forEach(s => { s.style.fontSize = size + "px"; });
      }
      spans.forEach(s => s.classList.toggle("tr-wrap", s.scrollWidth > s.clientWidth + 1));
    }
  }
  // Figures are drawn on a fixed canvas with empty margins; crop each one to its drawing
  // so the picture sits right under the question and can grow into the free space.
  function fitFigures() {
    for (const svg of host.querySelectorAll(".tr-figure svg[viewBox]")) {
      if (typeof svg.getBBox !== "function") continue;
      svg.classList.add("tr-measure");
      try {
        // getBBox ignores clip paths, so the crop never grows past the figure's own canvas.
        const b = svg.getBBox(), pad = 14, [vx, vy, vw, vh] = svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
        const x0 = Math.max(vx, b.x - pad), y0 = Math.max(vy, b.y - pad), x1 = Math.min(vx + vw, b.x + b.width + pad), y1 = Math.min(vy + vh, b.y + b.height + pad);
        if (x1 - x0 > 0 && y1 - y0 > 0) svg.setAttribute("viewBox", [x0, y0, x1 - x0, y1 - y0].join(" "));
      } catch (e) { /* hidden or unrendered figure keeps its own canvas */ }
      svg.classList.remove("tr-measure");
    }
  }
  function draw() {
    const t = current(); t.stage = "drawing";
    const ids = shuffle((t.results.length ? ranks(t).slice(0,t.cut) : t.players).map(p => p.id));
    t.rounds = [Array.from({length:ids.length/2},(_,i)=>R.createMatch(ids.slice(i*2,i*2+2)))];
    t.round = 0; t.mode = "duel"; t.view = null; save(); paint();
    let ticks = 0;
    drawTimer = setInterval(() => {
      if (!host?.isConnected) { stop(); return; }
      host.querySelector("[data-draw]").textContent = shuffle(ids).slice(0,2).map(playerName).join(" ⚔ ");
      if (++ticks >= 14) { clearInterval(drawTimer); drawTimer = null; t.stage = "ready"; t.message = "Kura tamamlandı. İlk maç başlıyor!"; save(); paint(); MatAudio.fanfare(); }
    },200);
  }
  function migrate(t) {
    if (!t) return;
    if (!t.settings) {
      t.settings = R.defaults(t.players.length,t.seconds || 20);
      // Preserve the existing bracket; new size rules apply to new tournaments.
      t.settings.qualify = {level:1,seconds:t.seconds || 20,format:"choice"};
      for (let n=t.cut;n>=2;n/=2) t.settings[n] ||= {level:3,seconds:t.seconds || 20,format:"number"};
      t.rounds.forEach(round => round.forEach(m => {m.questions=m.scores[0]+m.scores[1];m.overtime=false;}));
      if (["question","paused"].includes(t.stage)) {t.stage="ready";t.message="Yeni cevap biçimleri için sıradaki soru hazırlanacak; skorlar korundu.";}
    }
    t.topics ||= [t.topic];
    if (t.lock && !t.lock.family) t.lock = null; // older lock format: pick the question family again
    t.drafts ||= {}; t.answers ||= {}; t.version = 2;
  }
  root.MatTournament = {
    unmount() { sheet = null; if (ctx && host) pause(); document.body?.classList.remove("tournament-question"); host = null; ctx = null; },
    mount(el, context) {
      host=el;ctx=context;stop();
      const t=current();migrate(t);
      if (t?.stage === "question") {t.elapsed=Math.min(limit(),(t.elapsed||0)+Math.max(0,Date.now()-(t.startedAt||Date.now())));t.stage="paused";}
      if (t?.stage === "drawing") t.stage="ready";
      if(t)save();paint();
      host.onchange = e => {
        const form=e.target.closest("[data-setup]");
        if(form && /^topic(From|To)$/.test(e.target.name)) {
          // Keep the range ordered: moving one end past the other drags it along.
          const list=ctx.topics().map(x=>x.id), from=form.elements.topicFrom, to=form.elements.topicTo;
          if(list.indexOf(from.value)>list.indexOf(to.value))(e.target===from?to:from).value=e.target.value;
          form.querySelector("[data-topic-summary]").textContent=topicSummary(chosenTopics(form));
          return;
        }
        if(/^eye_/.test(e.target.name||""))e.target.closest("fieldset")?.classList.toggle("is-eye",e.target.checked);
        const setupForm=e.target.closest("[data-setup]");if(setupForm && !current())rememberForm(setupForm,withRemembered(R.defaults(entrants().length)));
        const box=e.target.closest("[data-roster]");if(!box||current())return;
        if(box.checked)excluded.delete(box.dataset.roster);else excluded.add(box.dataset.roster);
        // Re-render for the new count, keeping the teacher's form choices.
        const kept=[...host.querySelectorAll("[data-setup] [name]")].map(el=>[el.name,el.value]), y=window.scrollY;
        paint();
        const setup=host.querySelector("[data-setup]");for(const [n,v] of kept)if(setup?.elements[n])setup.elements[n].value=v;
        if(setup)setup.querySelector("[data-topic-summary]").textContent=topicSummary(chosenTopics(setup));
        window.scrollTo(0,y);
      };
      host.oninput = e => {if(e.target.matches("[data-answer]") && current()?.stage === "question") current().drafts[e.target.dataset.answer]=e.target.value;};
      // Answer controls act on pointerdown, as in the arcade duel: when two students touch at
      // the same moment the browser drops one of the clicks. Click stays for keyboard (detail 0).
      host.onpointerdown = e => {
        if(e.button > 0)return;
        const control=e.target.closest("[data-key], [data-choice], .tr-confirm");
        if(!control || control.disabled || current()?.stage !== "question")return;
        e.preventDefault();
        if(control.matches(".tr-confirm")) {const side=control.closest("[data-side]").dataset.side;if(!current().answers[side])settle(side,false);}
        else press(control);
      };
      host.onclick = e => {
        const t=current(), key=e.target.closest("[data-key]"), choice=e.target.closest("[data-choice]");
        if(e.detail > 0 && e.target.closest(".tr-confirm"))e.preventDefault(); // already settled on pointerdown
        if ((key || choice) && t?.stage === "question" && !t.view) {
          if(!(e.detail > 0))press(key||choice);
          return;
        }
        const actEl=e.target.closest("[data-t]"), act=actEl?.dataset.t;if(!act)return;
        if(act==="sol-open" && hasSolution(t?.q)){sheet={sol:solutionOf(t.q),step:0};paint();return;}
        if(/^sol-/.test(act)){if(sheet)moveSheet(act);return;}
        if(act==="tree-round"){treeRound=Number(actEl.dataset.r);paint();return;}
        if(act==="question")beginQuestion();
        if(act==="pause"){pause();paint();}
        if(act==="resume"){t.stage="question";t.startedAt=Date.now();save();paint();clock();}
        if(act==="draw")draw();
        if(act==="tree"){if(t.stage==="question")pause();treeRound=null;t.view=t.view==="bracket"?null:"bracket";save();paint();}
        if(act==="settings" && ["ready","result","ranking"].includes(t.stage)){t.view="settings";paint();}
        if(act==="settings-cancel"){t.view=null;paint();}
        if(act==="new" || act==="reset" && confirm("Bu turnuva sonlandırılsın mı? Tamamlanmamış turnuva için yıldız verilmez.")){stop();ctx.save(null);paint();}
      };
      host.onsubmit = e => {
        e.preventDefault(); const form=e.target;
        if(form.matches("[data-setup]")) {
          if(!form.reportValidity())return;
          const players=entrants().map(p=>({id:p.id,name:p.name}));if(players.length<2)return;
          const config=readSettings(form,R.defaults(players.length));if(!config)return;
          rememberForm(form,config);
          const chosen=chosenTopics(form);if(!chosen.length)return;
          const topics=chosen.map(x=>x.id), first=chosen[0], last=chosen[chosen.length-1];
          const topicName=chosen.length===1?first.title||first.name||first.id:`Konular ${first.no||1}–${last.no||chosen.length} · ${chosen.length} konu`;
          const ties=shuffle(players.map(p=>p.id));players.forEach(p=>p.tie=ties.indexOf(p.id));
          const cut=R.bracketSize(players.length);
          ctx.save({version:2,id:Date.now().toString(36),topic:topics[0],topics,topicName,settings:config,players,cut,results:[],rounds:[],stage:"ready",mode:"qualify",practice:ctx.practice(),awarded:false,drafts:{},answers:{},view:null});
          if(players.length===cut)draw();else paint();
        } else if(form.matches("[data-settings]")) {
          if(!form.reportValidity())return;
          const config=readSettings(form,current().settings);if(!config)return;
          current().settings=config;current().view=null;remember({phases:{...(remembered().phases || {}), ...config}});save();paint();
        } else if(form.matches("[data-side]") && !current().answers[form.dataset.side]) settle(form.dataset.side,false);
      };
    }
  };
  // Fullscreen and rotation change the panel width, so the choices fit again.
  root.addEventListener?.("resize",()=>{if(host)fitChoices();});
  // The open solution follows the arrow keys like the game's: → / space next, ← back, Esc close.
  document.addEventListener("keydown",e=>{
    if(!sheet || !host?.isConnected)return;
    const act={Escape:"sol-close",ArrowRight:"sol-next"," ":"sol-next",ArrowLeft:"sol-prev"}[e.key];
    if(act){e.preventDefault();moveSheet(act);}
  });
  document.addEventListener("visibilitychange",()=>{if(document.hidden && host && current()?.stage==="question"){pause();paint();}});
})(window);
