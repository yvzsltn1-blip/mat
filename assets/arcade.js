// Görsel oyunlar: Balon Patlat, Kapışma, Açı Düellosu ve Göz Kararı.
// Uygulama mount(el, ctx) ile bağlar; oyun durumu yeniden çizimlerde korunur.
(function (root) {
  "use strict";
  const G = root.MatArcadeGen;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const now = () => Date.now();
  const rnd = Math.random;

  const META = {
    duel: { title: "Açı Düellosu", icon: "📐", color: "#1c8c74", players: 2, blurb: "Biri açıyı çizer. Çizgiyi bıraktığı anda süre başlar; diğeri tümlerini ya da bütünlerini yazar. Sonra roller değişir. Hızlı olan daha çok puan alır!", steps: ["Çizen öğrenci kırmızı kolu sürükler", "Bırakınca geri sayım başlar", "Diğer öğrenci cevabı yazar, roller değişir"] },
    balloons: { title: "Balon Patlat", icon: "🎈", color: "#e0548f", players: 1, blurb: "Çizime bak, doğru cevabın yazdığı balonu uçup gitmeden patlat. Ne kadar hızlıysan o kadar çok puan!", steps: ["Soruyu ve çizimi incele", "Doğru balona dokun", "Her soruda tek hakkın var"] },
    race: { title: "Kapışma", icon: "⚔️", color: "#2c6bed", players: 2, blurb: "İki öğrenci tahtanın iki yanında aynı soruya yarışır. İlk doğru cevabı veren turu kazanır. Yanlış cevap 2 saniye ceza!", steps: ["Herkes kendi tuş takımını kullanır", "✔ ile cevabı gönder", "En çok turu alan kazanır"] },
    estimate: { title: "Göz Kararı", icon: "🎯", color: "#f0a90d", players: 1, blurb: "", steps: [] }
  };

  function meta(id, topicId) {
    const m = { ...META[id] };
    if (id === "estimate") {
      const angle = G.estimateKind(topicId) === "angle";
      m.blurb = angle ? "Açıya bak, ölçüsünü göz kararıyla tahmin et. Gerçek ölçüye ne kadar yakınsan o kadar çok puan!" : "Verilen sayıyı sayı doğrusunda bul ve işaretle. Ne kadar yakınsan o kadar çok puan!";
      m.steps = angle ? ["Açıyı incele", "Kaydırıcıyla tahminini ayarla", "İletki gerçeği gösterir"] : ["Sayıyı oku", "Sayı doğrusuna dokun", "Gerçek yer ortaya çıkar"];
    }
    return m;
  }

  function gamesFor(topicId) {
    const list = ["balloons", "race"];
    if (topicId === "cift") list.unshift("duel");
    if (G.estimateKind(topicId)) list.push("estimate");
    return list.map((id) => ({ id, ...meta(id, topicId) }));
  }

  let S = null, el = null, ctx = null, loop = 0, later = 0;

  function stop() {
    clearInterval(loop); clearTimeout(later);
    loop = 0;
    S = null;
  }
  function after(ms, fn) { clearTimeout(later); later = setTimeout(fn, ms); }
  function startLoop() { clearInterval(loop); loop = setInterval(tick, 100); }

  function fresh(game, topicId) {
    const m = meta(game, topicId);
    const sel = ctx.selectedId();
    return {
      game, topicId, m, phase: "setup", diff: 2,
      players: m.players === 2 ? [sel, null] : [sel],
      scores: [0, 0], wins: [0, 0],
      perTurn: 5, rounds: game === "race" ? 7 : 6, seconds: 15, mode: "karışık",
      log: {}
    };
  }

  function mount(node, context) {
    el = node; ctx = context;
    if (!S || S.game !== ctx.gameId || S.topicId !== ctx.topicId) { stop(); S = fresh(ctx.gameId, ctx.topicId); }
    node.addEventListener("click", onClick);
    node.addEventListener("input", onInput);
    node.addEventListener("change", onChange);
    draw();
  }

  // ---- Oyuncular ----
  const nameOf = (id, i) => id ? ctx.name(id) : (i === undefined ? "Misafir" : (i + 1) + ". oyuncu");
  const colorOf = (id, i) => (id && ctx.color(id)) || ["#e25b45", "#2c6bed"][i || 0];
  const initials = (n) => String(n).split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toLocaleUpperCase("tr")).join("");

  function award(i, pts, ok) {
    const id = S.players[i];
    S.scores[i] += pts;
    if (!id) return;
    ctx.award(id, pts, ok);
    const l = S.log[id] || (S.log[id] = { a: 0, c: 0, p: 0 });
    l.a += 1; if (ok) l.c += 1; l.p += pts;
  }
  function flushLog() {
    if (Object.keys(S.log).length) ctx.log(S.m.title, S.log);
    S.log = {};
  }

  // ---- Ortak parçalar ----
  function bar(extra = "") {
    const chips = S.players.map((id, i) => `<div class="ar-player ${S.players.length === 2 && S.turnOf === i ? "active" : ""}" style="--gc:${colorOf(id, i)}">
      <span class="ar-ava">${(id ? esc(initials(nameOf(id, i))) : (i || 0) + 1)}</span><span><b>${esc(nameOf(id, i))}</b><small>${S.phase === "setup" ? "oyuncu" : S.scores[i] + " puan"}</small></span></div>`).join(S.players.length === 2 ? `<span class="ar-vs">VS</span>` : "");
    return `<div class="game-bar ar-bar">
      <button type="button" class="g-btn" data-g="${S.phase === "setup" ? "exit" : "to-setup"}" aria-label="Geri">←</button>
      <span class="ar-title" style="--gc:${S.m.color}">${S.m.icon} ${esc(S.m.title)}</span>
      <div class="ar-players">${chips}</div>
      ${extra}
      <button class="g-btn" type="button" data-act="fullscreen" aria-label="Tam ekran">⛶</button>
    </div>`;
  }
  function keypad(target, submitLabel = "✔") {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "back", "0", "ok"];
    return `<div class="ar-keypad">${keys.map((k) => `<button type="button" class="ar-key ${k === "ok" ? "ok" : k === "back" ? "back" : ""}" data-g="key" data-t="${target}" data-k="${k}">${k === "back" ? "⌫" : k === "ok" ? submitLabel : k}</button>`).join("")}</div>`;
  }
  function seg(name, options, current) {
    return `<div class="seg">${options.map(([v, label]) => `<button type="button" class="${String(current) === String(v) ? "on" : ""}" data-g="opt" data-k="${name}" data-v="${v}">${label}</button>`).join("")}</div>`;
  }

  // ---- Kurulum ekranı ----
  function setupView() {
    const students = ctx.students();
    const playerRow = (id, i) => `<div class="ar-pick" style="--gc:${colorOf(id, i)}">
      <span class="ar-ava big">${(id ? esc(initials(nameOf(id, i))) : (i || 0) + 1)}</span>
      <select data-g="player" data-i="${i}" aria-label="${i + 1}. oyuncu"><option value="">${S.players.length === 2 ? (i + 1) + ". oyuncu (misafir)" : "Misafir (puansız)"}</option>${students.map((s) => `<option value="${esc(s.id)}" ${s.id === id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select>
      <button type="button" class="g-btn" data-g="draw" data-i="${i}" title="Rastgele çek">🎲</button></div>`;
    const opts = [`<div class="ar-opt"><span>Zorluk</span>${seg("diff", [[1, "🌱 Kolay"], [2, "🌿 Orta"], [3, "🌳 Zor"]], S.diff)}</div>`];
    if (S.game === "duel") {
      opts.push(`<div class="ar-opt"><span>Açı türü</span>${seg("mode", [["tümler", "Tümler · 90°"], ["bütünler", "Bütünler · 180°"], ["karışık", "Karışık"]], S.mode)}</div>`);
      opts.push(`<div class="ar-opt"><span>Cevap süresi</span>${seg("seconds", [[10, "10 sn"], [15, "15 sn"], [20, "20 sn"], [30, "30 sn"]], S.seconds)}</div>`);
      opts.push(`<div class="ar-opt"><span>Tur</span>${seg("rounds", [[4, "4"], [6, "6"], [8, "8"]], S.rounds)}</div>`);
    }
    if (S.game === "race") opts.push(`<div class="ar-opt"><span>Tur</span>${seg("rounds", [[5, "5"], [7, "7"], [9, "9"]], S.rounds)}</div>`);
    if (S.game === "balloons" || S.game === "estimate") opts.push(`<div class="ar-opt"><span>Kişi başı soru</span>${seg("perTurn", [[3, "3"], [5, "5"], [8, "8"]], S.perTurn)}</div>`);
    return `${bar()}<div class="ar-setup">
      <section class="ar-hero" style="--gc:${S.m.color}"><div class="ar-hero-icon">${S.m.icon}</div><h2>${esc(S.m.title)}</h2><p>${esc(S.m.blurb)}</p>
        <ol class="ar-steps">${S.m.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></section>
      <section class="ar-config">
        <h3>${S.players.length === 2 ? "Oyuncular" : "Oyuncu"}</h3>
        <div class="ar-picks">${S.players.map(playerRow).join(S.players.length === 2 ? `<span class="ar-vs big">VS</span>` : "")}</div>
        ${S.players.length === 2 ? `<button type="button" class="soft" data-g="draw-both">🎲 İkisini de çek</button>` : ""}
        ${opts.join("")}
        <button type="button" class="check-btn ar-start" data-g="start">▶ Oyunu başlat</button>
      </section></div>`;
  }

  // ---- Balon Patlat ----
  const BALLOON_COLORS = ["#ff6b6b", "#4dabf7", "#51cf66", "#fcc419"];
  function balloonTime() { return [14, 11, 8.5][S.diff - 1]; }
  function nextBalloon() {
    S.item = G.generate(S.topicId, rnd, S.diff, false);
    S.start = now(); S.picked = null; S.result = null;
    draw();
    requestAnimationFrame(fly);
  }
  function balloonsView() {
    const q = S.item, T = balloonTime(), el0 = (now() - S.start) / 1000;
    const labeled = q.choices.some(c => String(c).length > 16);
    const balloons = q.choices.map((c, i) => {
      const lane = (i + .5) * (100 / q.choices.length);
      const state = S.picked === i ? (String(c) === String(q.answer) ? "popped" : "bad") : S.result && String(c) === String(q.answer) ? "reveal" : "";
      const len = String(c).length + (q.unit && q.numeric ? 2 : 0);
      return `<button type="button" class="ar-balloon ${state}" data-g="pop" data-i="${i}" aria-label="${esc(c)}" style="--x:${lane}%;--c:${BALLOON_COLORS[i % 4]};--fs:${labeled ? 1 : len > 9 ? .62 : len > 6 ? .75 : len > 4 ? .9 : 1};bottom:${balloonBottom(i, el0, T)}%;animation-delay:${(-i * .7).toFixed(2)}s" ${S.result ? "disabled" : ""}>
        <span>${labeled ? 'ABCD'[i] : esc(c)}${q.unit && q.numeric && !labeled ? `<small>${esc(q.unit)}</small>` : ""}</span><i aria-hidden="true"></i></button>`;
    }).join("");
    const turn = `<span class="ar-count">${S.idx + 1}/${S.perTurn}</span><div class="ar-timer"><i id="arBar" style="width:${Math.max(0, 100 - el0 / (T + 1.5) * 100)}%"></i></div>`;
    return `${bar(turn)}<div class="game-stage ar-stage">
      <section class="g-question"><span class="question-label" style="--lv:${S.m.color}">${S.m.icon} SORU ${S.idx + 1}</span><h2 class="prompt">${esc(q.prompt)}</h2><div class="g-scene ar-scene">${q.svg}</div>${labeled ? `<div class="ar-option-legend">${q.choices.map((c,i)=>`<p><b>${'ABCD'[i]}</b> ${esc(c)}</p>`).join('')}</div>` : ''}</section>
      <section class="ar-sky">${balloons}<div class="ar-cloud c1"></div><div class="ar-cloud c2"></div>
        ${S.result ? resultBubble(S.result) : ""}</section></div>`;
  }
  // Balonlar her karede geçen süreye göre yerleştirilir; yeniden çizimde kaldığı yerden devam eder.
  function balloonBottom(i, t, T) {
    const p = Math.max(0, Math.min(1, (t - i * .45) / T));
    return (-20 + p * 125).toFixed(2);
  }
  function fly() {
    if (!S || S.game !== "balloons" || S.phase !== "play" || !el || !document.body.contains(el)) return;
    if (!S.result) {
      const t = (now() - S.start) / 1000, T = balloonTime();
      el.querySelectorAll(".ar-balloon").forEach((b, i) => { b.style.bottom = balloonBottom(i, t, T) + "%"; });
    }
    requestAnimationFrame(fly);
  }
  function resultBubble(r) {
    return `<div class="ar-result ${r.ok ? "ok" : "bad"}"><b>${r.ok ? "🎉 +" + r.pts : r.timeout ? "⏰ Kaçtı!" : "💥 Olmadı"}</b>${r.ok ? "" : `<span>Doğru cevap: ${esc(r.answer)}</span>`}</div>`;
  }
  function popBalloon(i) {
    if (S.result) return;
    const q = S.item, ok = String(q.choices[i]) === String(q.answer);
    const t = (now() - S.start) / 1000;
    const pts = ok ? 10 + Math.max(0, Math.round(10 * (1 - t / balloonTime()))) : 0;
    S.picked = i;
    S.result = { ok, pts, answer: q.answer + (q.unit ? " " + q.unit : "") };
    award(0, pts, ok);
    S.turnRight += ok ? 1 : 0;
    if (ok) { ctx.sound.correct(); ctx.burst(); } else ctx.sound.wrong();
    draw();
    after(1500, advanceSolo);
  }
  function advanceSolo() {
    S.idx += 1;
    if (S.idx >= S.perTurn) { S.phase = "turnEnd"; ctx.sound.fanfare(); flushLog(); draw(); return; }
    if (S.game === "balloons") nextBalloon(); else nextEstimate();
  }

  // ---- Göz Kararı ----
  function nextEstimate() {
    const kind = G.estimateKind(S.topicId);
    S.start = now(); S.result = null;
    if (kind === "angle") {
      // Orta ve zor seviyede açı aynalanabilir; zorda iç bölge boyanmaz.
      S.item = { kind, deg: G.ri(rnd, 8, 172), flip: S.diff > 1 && rnd() < .5, bare: S.diff === 3 };
      S.guess = 90;
    } else {
      const R = G.LINE_RANGE[S.topicId] || 1000, step = S.diff === 1 ? R / 20 : S.diff === 2 ? R / 100 : R / 1000;
      S.item = { kind, R, target: G.ri(rnd, 1, R / step - 1) * step };
      S.guess = null;
    }
    draw();
  }
  function angleEstimateSvg(it, reveal) {
    const cx = 210, cy = 200;
    let s = `<g${it.flip ? ` transform="translate(${2 * cx} 0) scale(-1 1)"` : ""}>`;
    s += (it.bare ? "" : G.sector(cx, cy, 60, 0, it.deg, "#ffdcb0")) +G.ray(cx, cy, 0, 175) + G.ray(cx, cy, it.deg, 175, G.CORAL, 6, "ar-draw") + G.dot(cx, cy, 7, G.INK);
    if (reveal) {
      s += G.sector(cx, cy, 120, 0, S.guess, "rgba(107,79,216,.18)", "ar-grow") + G.ray(cx, cy, S.guess, 160, G.GRAPE, 4);
      for (let g = 0; g <= 180; g += 10) { const [x1, y1] = G.P(cx, cy, g, 175), [x2, y2] = G.P(cx, cy, g, g % 30 ? 166 : 158); s += G.line(x1, y1, x2, y2, { color: "#8a6d1e", w: 2 }); }
    }
    s += `</g>`;
    return `<svg class="ar-svg" viewBox="0 0 420 240" role="img" aria-label="Tahmin edilecek açı">${s}</svg>`;
  }
  function lineSvg(it, reveal) {
    const x = (v) => 30 + v / it.R * 360;
    let s = G.line(30, 120, 390, 120, { w: 5 });
    const ticks = S.diff === 1 ? 4 : 10;
    for (let i = 0; i <= ticks; i++) {
      const v = it.R * i / ticks;
      s += G.line(x(v), 106, x(v), 134, { w: i % ticks === 0 ? 4 : 2 });
      if (i === 0 || i === ticks || (S.diff === 1)) s += G.text(x(v), 158, G.fmt(v), { size: 12 });
    }
    s += `<rect data-g="line-tap" x="20" y="60" width="380" height="110" fill="transparent" style="cursor:crosshair"/>`;
    if (S.guess !== null) s += `<g class="ar-pin">${G.line(x(S.guess), 60, x(S.guess), 118, { color: G.GRAPE, w: 4 })}<circle cx="${x(S.guess)}" cy="56" r="11" fill="${G.GRAPE}"/></g>` + G.text(x(S.guess), 34, G.fmt(S.guess), { size: 14, fill: G.GRAPE });
    if (reveal) s += `<g class="ar-pop">${G.line(x(it.target), 120, x(it.target), 196, { color: G.TEAL, w: 4 })}<circle cx="${x(it.target)}" cy="200" r="10" fill="${G.TEAL}"/></g>` + G.text(x(it.target), 224, G.fmt(it.target), { size: 14, fill: G.TEAL });
    return `<svg id="arLine" class="ar-svg" viewBox="0 0 420 240" role="img" aria-label="Sayı doğrusu">${s}</svg>`;
  }
  function estimateView() {
    const it = S.item, r = S.result;
    const turn = `<span class="ar-count">${S.idx + 1}/${S.perTurn}</span>`;
    const left = it.kind === "angle"
      ? `<span class="question-label" style="--lv:${S.m.color}">🎯 GÖZ KARARI</span><h2 class="prompt">Kırmızı ile siyah kol arasındaki açı kaç derece?</h2><div class="g-scene ar-scene">${angleEstimateSvg(it, !!r)}</div>`
      : `<span class="question-label" style="--lv:${S.m.color}">🎯 GÖZ KARARI</span><h2 class="prompt">📍 <b class="ar-target">${G.fmt(it.target)}</b> sayısı nerede? Sayı doğrusuna dokun.</h2><div class="g-scene ar-scene">${lineSvg(it, !!r)}</div>`;
    const right = it.kind === "angle"
      ? `<p class="response-label">Tahminini ayarla</p><div class="ar-guess"><b id="arGuess">${S.guess}°</b></div>
         <input class="ar-range" type="range" min="0" max="180" value="${S.guess}" data-g="guess" aria-label="Tahmin" ${r ? "disabled" : ""}>
         <div class="ar-nudge">${[-10, -1, 1, 10].map((d) => `<button type="button" class="ar-key" data-g="nudge" data-d="${d}" ${r ? "disabled" : ""}>${d > 0 ? "+" + d : "−" + Math.abs(d)}</button>`).join("")}</div>`
      : `<p class="response-label">Tahminin</p><div class="ar-guess"><b>${S.guess === null ? "?" : G.fmt(S.guess)}</b></div><p class="fine">Sayı doğrusunda istediğin yere dokun; işaret oraya gider.</p>`;
    return `${bar(turn)}<div class="game-stage ar-stage">
      <section class="g-question">${left}</section>
      <section class="g-answer ar-est">${right}
        ${r ? `<div class="g-feedback ${r.ok ? "ok" : "bad"}"><div class="fb-emoji">${r.pts >= 15 ? "🎯" : r.pts ? "👍" : "🙈"}</div><h3>${r.pts >= 20 ? "Tam isabet!" : r.pts >= 15 ? "Çok yakın!" : r.pts ? "Fena değil!" : "Biraz uzak"}</h3><p class="fb-points">+${r.pts} puan</p><p class="fb-answer">${r.text}</p></div>`
          : `<button type="button" class="check-btn" data-g="guess-ok" ${S.guess === null ? "disabled" : ""}>✔ Tahminimi gönder</button>`}
      </section></div>`;
  }
  function submitEstimate() {
    if (S.result || S.guess === null) return;
    const it = S.item;
    let pts, text;
    if (it.kind === "angle") {
      const err = Math.abs(S.guess - it.deg);
      pts = err <= 3 ? 20 : err <= 7 ? 15 : err <= 12 ? 10 : err <= 20 ? 5 : 0;
      text = `Gerçek ölçü <b>${it.deg}°</b> · senin tahminin ${S.guess}° · fark ${err}°`;
    } else {
      const errPct = Math.abs(S.guess - it.target) / it.R * 100;
      pts = errPct <= 1 ? 20 : errPct <= 3 ? 15 : errPct <= 6 ? 10 : errPct <= 10 ? 5 : 0;
      text = `Doğru yer <b>${G.fmt(it.target)}</b> · senin işaretin ${G.fmt(S.guess)}`;
    }
    S.result = { ok: pts >= 10, pts, text };
    award(0, pts, pts >= 10);
    S.turnRight += pts >= 10 ? 1 : 0;
    if (pts >= 10) { ctx.sound.correct(); if (pts >= 15) ctx.burst(); } else ctx.sound.wrong();
    draw();
    after(2600, advanceSolo);
  }

  // ---- Tek oyunculu tur sonu ----
  function turnEndView() {
    const id = S.players[0];
    const students = ctx.students().length;
    return `${bar()}<div class="ar-over"><div class="finish-card">
      <div class="finish-top"><div class="trophy">${S.turnRight === S.perTurn ? "🏆" : S.turnRight ? "⭐" : "🌱"}</div>
        <div><p class="kicker">${esc(S.m.title)} · tur bitti</p><h2>${esc(nameOf(id))}: ${S.turnRight}/${S.perTurn}</h2><p class="say">Bu turda <b>${S.scores[0]} puan</b> toplandı.</p></div></div>
      <div class="actions finish-actions">
        ${students > 1 ? `<button type="button" class="check-btn" data-g="next-player">🎲 Sıradaki öğrenci</button>` : ""}
        <button type="button" class="soft" data-g="again">▶ ${esc(nameOf(id))} devam etsin</button>
        <button type="button" class="soft" data-g="to-setup">⚙ Ayarlar</button>
        <button type="button" class="soft" data-g="exit">Oyunlardan çık</button>
      </div></div></div>`;
  }

  // ---- Kapışma ----
  function nextRace() {
    S.item = G.generate(S.topicId, rnd, S.diff, true);
    S.drafts = ["", ""]; S.penalty = [0, 0]; S.tried = [false, false];
    S.start = now(); S.result = null; S.round += 1;
    draw();
  }
  const RACE_TIME = 45;
  function racePanel(i) {
    const id = S.players[i], pen = S.penalty[i] > now(), won = S.result && S.result.winner === i;
    return `<section class="ar-side ${pen ? "penalty" : ""} ${won ? "won" : ""}" style="--gc:${colorOf(id, i)}">
      <header><span class="ar-ava">${(id ? esc(initials(nameOf(id, i))) : (i || 0) + 1)}</span><b>${esc(nameOf(id, i))}</b><span class="ar-wins">${"★".repeat(S.wins[i])}<em>${S.wins[i]}</em></span></header>
      <div class="ar-read" id="arRead${i}">${S.drafts[i] ? G.fmt(S.drafts[i]) : "…"}${S.item.unit ? `<small>${esc(S.item.unit)}</small>` : ""}</div>
      ${pen ? `<div class="ar-pen" id="arPen${i}">⏳ Ceza</div>` : ""}
      ${S.item.numeric ? keypad(i) : `<div class="ar-choice-grid">${S.item.choices.map((c, j) => `<button type="button" class="soft" data-g="race-choice" data-player="${i}" data-choice="${j}" ${S.result || pen ? "disabled" : ""}>${esc(c)}</button>`).join("")}</div>`}
    </section>`;
  }
  function raceView() {
    const r = S.result, el0 = (now() - S.start) / 1000;
    const extra = `<span class="ar-count">Tur ${S.round}/${S.rounds}</span><div class="ar-timer"><i id="arBar" style="width:${Math.max(0, 100 - el0 / RACE_TIME * 100)}%"></i></div>`;
    return `${bar(extra)}<div class="ar-race">
      ${racePanel(0)}
      <section class="g-question ar-center"><span class="question-label" style="--lv:${S.m.color}">⚔️ TUR ${S.round}</span><h2 class="prompt">${esc(S.item.prompt)}</h2><div class="g-scene ar-scene">${S.item.svg}</div>
        ${r ? `<div class="ar-result ${r.winner !== null ? "ok" : "bad"}"><b>${r.winner !== null ? "⚡ " + esc(nameOf(S.players[r.winner], r.winner)) + " aldı!" : "⏰ Kimse bulamadı"}</b><span>Cevap: ${G.fmt(S.item.answer)}${S.item.unit ? " " + esc(S.item.unit) : ""}</span></div>` : ""}</section>
      ${racePanel(1)}
    </div>`;
  }
  function raceKey(i, k) {
    if (S.result || S.penalty[i] > now()) return;
    if (k === "back") S.drafts[i] = S.drafts[i].slice(0, -1);
    else if (k === "ok") {
      if (!S.drafts[i]) return;
      if (S.item.numeric ? Number(S.drafts[i]) === S.item.answer : S.drafts[i] === String(S.item.answer)) {
        S.result = { winner: i };
        S.wins[i] += 1;
        award(i, 15, true);
        if (S.tried[1 - i]) award(1 - i, 0, false);
        ctx.sound.correct(); ctx.burst();
        draw();
        after(2200, raceAdvance);
        return;
      }
      S.tried[i] = true;
      S.drafts[i] = "";
      S.penalty[i] = now() + 2000;
      ctx.sound.wrong();
      draw();
      return;
    } else if (S.drafts[i].length < 9) S.drafts[i] += k;
    const box = el.querySelector("#arRead" + i);
    if (box) box.innerHTML = (S.drafts[i] ? G.fmt(S.drafts[i]) : "…") + (S.item.unit ? `<small>${esc(S.item.unit)}</small>` : "");
  }
  function raceAdvance() {
    if (S.round >= S.rounds) { finishMatch(); return; }
    nextRace();
  }

  // ---- Açı Düellosu ----
  function nextDuel() {
    S.round += 1;
    S.turnOf = S.round % 2;                  // cevap veren (ilk turda 1. oyuncu çizer)
    S.setter = 1 - S.turnOf;                  // çizen
    S.kind = S.mode === "karışık" ? (rnd() < .5 ? "tümler" : "bütünler") : S.mode;
    S.total = S.kind === "tümler" ? 90 : 180;
    S.deg = S.total === 90 ? 45 : 90;
    S.step = "set"; S.draft = ""; S.result = null; S.touched = false;
    draw();
  }
  function duelGeom() { return S.total === 90 ? { cx: 110, cy: 215, len: 190 } : { cx: 210, cy: 205, len: 185 }; }
  function duelSvgInner() {
    const { cx, cy, len } = duelGeom(), x = S.deg, T = S.total;
    let s = "";
    if (S.result) s += G.sector(cx, cy, 95, x, T, "#bfe9d6", "ar-grow");
    s += `<path id="duelSector" d="${sectorPath(cx, cy, 70, 0, x)}" fill="#ffd29c"/>`;
    s += G.line(T === 90 ? cx : 20, cy, cx + len, cy, { w: 6 });
    if (T === 90) s += G.line(cx, cy, cx, cy - len + 15, { w: 6 }) + G.rightMark(cx, cy, 0, 26, "#777");
    const [hx, hy] = G.P(cx, cy, x, len - 10);
    s += `<line id="duelRay" x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}" stroke="${G.CORAL}" stroke-width="8" stroke-linecap="round"/>`;
    if (S.step === "set") s += `<circle id="duelHandle" class="ar-handle" cx="${hx}" cy="${hy}" r="20" fill="#fff" stroke="${G.CORAL}" stroke-width="6"/>`;
    const [lx, ly] = G.P(cx, cy, x / 2, 108);
    s += `<text id="duelLabel" x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-size="30" font-weight="800" fill="#1f2547" paint-order="stroke" stroke="#fff" stroke-width="6">${x}°</text>`;
    if (S.result) { const [qx, qy] = G.P(cx, cy, (x + T) / 2, 132); s += G.text(qx, qy, (T - x) + "°", { size: 30, fill: G.TEAL }); }
    s += G.dot(cx, cy, 9, G.INK);
    return s;
  }
  function sectorPath(cx, cy, r, a0, a1) {
    const [x0, y0] = G.P(cx, cy, a0, r), [x1, y1] = G.P(cx, cy, a1, r);
    return `M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 0 ${x1} ${y1} Z`;
  }
  function duelView() {
    const setter = S.players[S.setter], answerer = S.players[S.turnOf];
    const left = (S.step === "answer" ? S.deadline - now() : S.seconds * 1000) / 1000;
    const extra = `<span class="ar-count">Tur ${S.round}/${S.rounds} · ${S.kind === "tümler" ? "Tümler" : "Bütünler"}</span>`;
    const r = S.result;
    const status = S.step === "set"
      ? `<div class="ar-callout" style="--gc:${colorOf(setter, S.setter)}">✏️ <b>${esc(nameOf(setter, S.setter))}</b> açıyı çiziyor. Kırmızı kolu sürükle, bırakınca süre başlar!</div>`
      : `<div class="ar-callout" style="--gc:${colorOf(answerer, S.turnOf)}">⚡ <b>${esc(nameOf(answerer, S.turnOf))}</b>, bu açının <b>${S.kind === "tümler" ? "tümleri" : "bütünleri"}</b> kaç derece?</div>`;
    return `${bar(extra)}<div class="game-stage ar-stage ar-duel">
      <section class="g-question">${status}
        <div class="g-scene ar-scene"><svg id="duelSvg" class="ar-svg ${S.step === "set" ? "draggable" : ""}" viewBox="${S.total === 90 ? "0 0 330 240" : "0 0 420 240"}" role="slider" aria-label="Açı" aria-valuenow="${S.deg}">${duelSvgInner()}</svg></div>
        ${S.step === "set" ? `<div class="ar-nudge">${[-5, -1, 1, 5].map((d) => `<button type="button" class="ar-key" data-g="dnudge" data-d="${d}">${d > 0 ? "+" + d : "−" + Math.abs(d)}°</button>`).join("")}<button type="button" class="check-btn" data-g="lock">🔒 Açıyı kilitle</button></div>` : ""}
      </section>
      <section class="g-answer ar-duel-answer">
        <div class="ar-ring ${S.step === "answer" && left <= 5 ? "urgent" : ""}" id="arRing" style="--p:${Math.max(0, left / S.seconds)}"><b id="arLeft">${Math.ceil(Math.max(0, left))}</b><small>saniye</small></div>
        <div class="ar-read big" id="arRead">${S.draft || "…"}<small>°</small></div>
        ${S.step === "answer" ? keypad("duel") : `<p class="fine ar-wait">Çizgi bırakılınca tuş takımı açılır.</p>`}
        ${r ? `<div class="g-feedback ${r.ok ? "ok" : "bad"}"><div class="fb-emoji">${r.ok ? (r.pts >= 20 ? "⚡" : "🎉") : r.timeout ? "⏰" : "🤔"}</div><h3>${r.ok ? "Doğru! +" + r.pts : r.timeout ? "Süre doldu!" : "Olmadı!"}</h3>
          <p class="fb-answer">${S.deg}° + <b>${S.total - S.deg}°</b> = ${S.total}°</p>
          <button type="button" class="check-btn" data-g="duel-next">${S.round >= S.rounds ? "🏁 Sonucu gör" : "🔄 Roller değişiyor →"}</button></div>` : ""}
      </section></div>`;
  }
  function paintDuel() {
    const { cx, cy, len } = duelGeom();
    const [hx, hy] = G.P(cx, cy, S.deg, len - 10), [lx, ly] = G.P(cx, cy, S.deg / 2, 108);
    const q = (id) => el.querySelector("#" + id);
    if (!q("duelRay")) return;
    q("duelRay").setAttribute("x2", hx); q("duelRay").setAttribute("y2", hy);
    if (q("duelHandle")) { q("duelHandle").setAttribute("cx", hx); q("duelHandle").setAttribute("cy", hy); }
    q("duelSector").setAttribute("d", sectorPath(cx, cy, 70, 0, S.deg));
    q("duelLabel").setAttribute("x", lx); q("duelLabel").setAttribute("y", ly); q("duelLabel").textContent = S.deg + "°";
  }
  function lockDuel() {
    if (S.step !== "set") return;
    S.step = "answer";
    S.deadline = now() + S.seconds * 1000;
    ctx.sound.tick();
    draw();
  }
  function duelSubmit(timeout) {
    if (S.step !== "answer" || S.result) return;
    const ok = !timeout && Number(S.draft) === S.total - S.deg;
    const leftSec = Math.max(0, (S.deadline - now()) / 1000);
    const pts = ok ? 10 + Math.ceil(leftSec) : 0;
    S.result = { ok, pts, timeout };
    S.step = "reveal";
    award(S.turnOf, pts, ok);
    if (ok) { ctx.sound.correct(); ctx.burst(); } else ctx.sound.wrong();
    draw();
  }
  function bindDuel() {
    const svg = el.querySelector("#duelSvg");
    if (!svg || S.step !== "set") return;
    const move = (ev) => {
      if (ev.type === "pointermove" && !ev.buttons) return;
      const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
      const m = svg.getScreenCTM(); if (!m) return;
      const p = pt.matrixTransform(m.inverse());
      const { cx, cy } = duelGeom();
      let deg = Math.atan2(-(p.y - cy), p.x - cx) * 180 / Math.PI;
      if (deg < -90) deg = S.total; else if (deg < 0) deg = 0;
      S.deg = Math.max(1, Math.min(S.total - 1, Math.round(deg)));
      S.touched = true;
      paintDuel();
    };
    svg.addEventListener("pointerdown", (ev) => { svg.setPointerCapture(ev.pointerId); move(ev); });
    svg.addEventListener("pointermove", move);
    // Çizgi bırakıldığı anda geri sayım başlar.
    svg.addEventListener("pointerup", () => { if (S && S.touched) lockDuel(); });
  }

  // ---- Maç sonu (iki oyunculu) ----
  function finishMatch() {
    S.phase = "over";
    ctx.sound.fanfare();
    flushLog();
    draw();
  }
  function overView() {
    const a = S.game === "race" ? S.wins : S.scores;
    const w = a[0] === a[1] ? null : a[0] > a[1] ? 0 : 1;
    return `${bar()}<div class="ar-over"><div class="finish-card">
      <div class="finish-top"><div class="trophy">${w === null ? "🤝" : "🏆"}</div>
        <div><p class="kicker">${esc(S.m.title)} · maç bitti</p><h2>${w === null ? "Berabere!" : esc(nameOf(S.players[w], w)) + " kazandı!"}</h2>
        <p class="say">${S.players.map((id, i) => `${esc(nameOf(id, i))}: <b>${S.game === "race" ? S.wins[i] + " tur · " : ""}${S.scores[i]} puan</b>`).join(" &nbsp;·&nbsp; ")}</p></div></div>
      <div class="actions finish-actions">
        <button type="button" class="check-btn" data-g="new-pair">🎲 Yeni eşleşme</button>
        <button type="button" class="soft" data-g="again">🔁 Rövanş</button>
        <button type="button" class="soft" data-g="to-setup">⚙ Ayarlar</button>
        <button type="button" class="soft" data-g="exit">Oyunlardan çık</button>
      </div></div></div>`;
  }

  // ---- Akış ----
  function begin() {
    S.scores = [0, 0]; S.wins = [0, 0]; S.idx = 0; S.round = 0; S.turnRight = 0; S.log = {};
    S.phase = "play";
    startLoop();
    if (S.game === "balloons") nextBalloon();
    else if (S.game === "estimate") nextEstimate();
    else if (S.game === "race") nextRace();
    else nextDuel();
  }

  function tick() {
    if (!S || S.phase !== "play" || !el || !document.body.contains(el)) return;
    if (S.game === "balloons" && !S.result) {
      const t = (now() - S.start) / 1000, T = balloonTime() + 1.5;
      const b = el.querySelector("#arBar"); if (b) b.style.width = Math.max(0, 100 - t / T * 100) + "%";
      if (t >= T) {
        S.result = { ok: false, pts: 0, timeout: true, answer: S.item.answer + (S.item.unit ? " " + S.item.unit : "") };
        award(0, 0, false);
        ctx.sound.wrong();
        draw();
        after(1600, advanceSolo);
      }
    }
    if (S.game === "race") {
      if (!S.result) {
        const t = (now() - S.start) / 1000;
        const b = el.querySelector("#arBar"); if (b) b.style.width = Math.max(0, 100 - t / RACE_TIME * 100) + "%";
        if (t >= RACE_TIME) {
          S.result = { winner: null };
          [0, 1].forEach((i) => { if (S.tried[i]) award(i, 0, false); });
          ctx.sound.wrong(); draw(); after(2200, raceAdvance);
          return;
        }
      }
      [0, 1].forEach((i) => { if (S.penalty[i] && S.penalty[i] <= now()) { S.penalty[i] = 0; draw(); } });
    }
    if (S.game === "duel" && S.step === "answer") {
      const left = (S.deadline - now()) / 1000;
      const ring = el.querySelector("#arRing"), num = el.querySelector("#arLeft");
      if (ring) { ring.style.setProperty("--p", Math.max(0, left / S.seconds)); ring.classList.toggle("urgent", left <= 5); }
      if (num && num.textContent !== String(Math.ceil(Math.max(0, left)))) { num.textContent = Math.ceil(Math.max(0, left)); if (left <= 5) ctx.sound.tick(); }
      if (left <= 0) duelSubmit(true);
    }
  }

  function draw() {
    if (!el || !S) return;
    let html;
    if (S.phase === "setup") html = setupView();
    else if (S.phase === "turnEnd") html = turnEndView();
    else if (S.phase === "over") html = overView();
    else if (S.game === "balloons") html = balloonsView();
    else if (S.game === "estimate") html = estimateView();
    else if (S.game === "race") html = raceView();
    else html = duelView();
    el.innerHTML = html;
    if (S.game === "duel" && S.phase === "play") bindDuel();
    if (S.game === "estimate" && S.phase === "play" && S.item && S.item.kind === "line" && !S.result) bindLine();
  }

  function bindLine() {
    const svg = el.querySelector("#arLine");
    if (!svg) return;
    svg.addEventListener("pointerdown", (ev) => {
      const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
      const m = svg.getScreenCTM(); if (!m) return;
      const p = pt.matrixTransform(m.inverse());
      const it = S.item, step = it.R / 100;
      S.guess = Math.max(0, Math.min(it.R, Math.round((p.x - 30) / 360 * it.R / step) * step));
      ctx.sound.tick();
      draw();
    });
  }

  function pickPlayers(slots, done) {
    const run = (k) => {
      if (k >= slots.length) { done(); return; }
      const i = slots[k];
      ctx.pickOne((s) => {
        S.players[i] = s ? s.id : S.players[i];
        if (S.players.length === 2 && S.players[0] && S.players[0] === S.players[1]) S.players[1 - i] = null;
        run(k + 1);
      });
    };
    run(0);
  }

  function onClick(e) {
    const b = e.target.closest("[data-g]");
    if (!b || !S || b.disabled) return;
    const g = b.dataset.g;
    if (g === "exit") { flushLog(); stop(); ctx.exit(); return; }
    if (g === "to-setup") { flushLog(); clearInterval(loop); clearTimeout(later); S.phase = "setup"; draw(); return; }
    if (g === "opt") { S[b.dataset.k] = b.dataset.k === "mode" ? b.dataset.v : Number(b.dataset.v); draw(); return; }
    if (g === "draw") { pickPlayers([Number(b.dataset.i)], draw); return; }
    if (g === "draw-both") { pickPlayers([0, 1], draw); return; }
    if (g === "start") { begin(); return; }
    if (g === "again") { begin(); return; }
    if (g === "next-player") { pickPlayers([0], begin); return; }
    if (g === "new-pair") { pickPlayers([0, 1], begin); return; }
    if (g === "pop") { popBalloon(Number(b.dataset.i)); return; }
    if (g === "nudge") { S.guess = Math.max(0, Math.min(180, S.guess + Number(b.dataset.d))); draw(); return; }
    if (g === "guess-ok") { submitEstimate(); return; }
    if (g === "dnudge") { S.deg = Math.max(1, Math.min(S.total - 1, S.deg + Number(b.dataset.d))); paintDuel(); return; }
    if (g === "lock") { lockDuel(); return; }
    if (g === "duel-next") { if (S.round >= S.rounds) finishMatch(); else nextDuel(); return; }
    if (g === "race-choice") {
      const i = Number(b.dataset.player);
      if (S.game !== "race" || S.item.numeric || S.result || S.penalty[i] > now()) return;
      S.drafts[i] = String(S.item.choices[Number(b.dataset.choice)]);
      raceKey(i, "ok");
      return;
    }
    if (g === "key") {
      const t = b.dataset.t, k = b.dataset.k;
      ctx.sound.click && ctx.sound.click();
      if (t === "duel") duelKey(k); else raceKey(Number(t), k);
    }
  }
  function duelKey(k) {
    if (S.step !== "answer") return;
    if (k === "ok") { if (S.draft) duelSubmit(false); return; }
    if (k === "back") S.draft = S.draft.slice(0, -1);
    else if (S.draft.length < 3) S.draft += k;
    const r = el.querySelector("#arRead"); if (r) r.innerHTML = (S.draft || "…") + "<small>°</small>";
  }
  function onChange(e) {
    if (e.target.dataset.g !== "player" || !S) return;
    const i = Number(e.target.dataset.i), v = e.target.value || null;
    S.players[i] = v;
    if (v && S.players[1 - i] === v) S.players[1 - i] = null;
    draw();
  }
  function onInput(e) {
    if (e.target.dataset.g === "guess" && S && !S.result) {
      S.guess = Number(e.target.value);
      const g = el.querySelector("#arGuess"); if (g) g.textContent = S.guess + "°";
    }
  }
  if (typeof document !== "undefined") {
    document.addEventListener("keydown", (e) => {
      if (!S || S.phase !== "play" || !el || !document.body.contains(el)) return;
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === "SELECT" || tag === "TEXTAREA" || (tag === "INPUT" && document.activeElement.type !== "range")) return;
      if (S.game === "duel" && S.step === "answer") {
        if (/^\d$/.test(e.key)) duelKey(e.key);
        else if (e.key === "Backspace") { e.preventDefault(); duelKey("back"); }
        else if (e.key === "Enter") duelKey("ok");
      } else if (S.game === "duel" && S.step === "set") {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") { S.deg = Math.min(S.total - 1, S.deg + 1); paintDuel(); }
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") { S.deg = Math.max(1, S.deg - 1); paintDuel(); }
        if (e.key === "Enter") lockDuel();
      } else if (S.game === "estimate" && e.key === "Enter") submitEstimate();
      else if (S.game === "balloons" && /^[1-4]$/.test(e.key) && S.item && Number(e.key) <= S.item.choices.length) popBalloon(Number(e.key) - 1);
    });
  }

  root.MatArcade = { gamesFor, mount, stop, isActive: () => !!S };
})(typeof window !== "undefined" ? window : globalThis);
