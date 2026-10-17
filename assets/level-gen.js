// Seviye oyunu için sınırsız, görselli soru üreticisi.
// generate(konu, seviye) her çağrıda rastgele sayılarla yeni bir soru ve ona ait çizimi üretir.
// Çizimler yalnız soruda verilenleri gösterir; aranan değer "?" ile işaretlenir.
(function (root) {
  "use strict";
  const G = root.MatArcadeGen;
  const { INK, CORAL, BLUE, TEAL, GOLD, GRAPE, P } = G;
  const text = G.text, line = G.line, dot = G.dot, sector = G.sector, ray = G.ray;
  const fmt = G.fmt;
  const r1 = (n) => Math.round(n * 10) / 10;
  const LIGHT = { coral: "#ffd8cf", blue: "#d9e6ff", teal: "#ccebe2", gold: "#ffe7a3", grape: "#e6ddff" };

  let rnd = Math.random;
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const shuffle = (arr) => G.shuffle(rnd, arr);
  const sum = (arr) => arr.reduce((a, b) => a + b, 0);
  const svg = (inner, vb = "0 0 360 240") => `<svg class="ar-svg" viewBox="${vb}" role="img" aria-hidden="true">${inner}</svg>`;
  const HINT = "Çizimdeki verilenleri kullan. Önce neyin sorulduğunu bul, sonra adım adım ilerle.";

  // ---- Soru kalıpları ----
  function N(prompt, answer, explain, fig, o = {}) {
    return { kind: "num", prompt, answer, explain, unit: o.unit || "", hint: o.hint || HINT, scene: fig ? { kind: "art", html: fig } : null, solution: o.sol || null };
  }
  function C(prompt, answer, wrongs, explain, fig, o = {}) {
    const right = String(answer);
    const others = shuffle([...new Set(wrongs.map(String))].filter((w) => w !== right)).slice(0, 3);
    return { kind: "mc", prompt, answer: right, choices: shuffle([right, ...others]), explain, hint: o.hint || HINT, scene: fig ? { kind: "art", html: fig } : null, solution: o.sol || null };
  }

  // ---- Ortak çizimler ----
  function boxes(items) {
    return `<div class="ar-boxes">${items.map((it, i) => `<div class="ar-box" style="--i:${i}"><b>${it.icon}</b><small>${it.label}</small></div>`).join("")}</div>`;
  }
  function cards(items) {
    return `<div class="ar-cards">${items.map((it, i) => `<div class="ar-card${it.q ? " q" : ""}" style="--i:${i}">${it.t}${it.s ? `<small>${it.s}</small>` : ""}</div>`).join("")}</div>`;
  }
  // Bir doğru üzerinde noktalar ve uzunluk parantezleri.
  function segFig(names, gaps, braces, o = {}) {
    const tot = sum(gaps), min = tot / (gaps.length * 2.6);
    const w = gaps.map((g) => Math.max(g, min)), wt = sum(w), xs = [40];
    w.forEach((g) => xs.push(xs[xs.length - 1] + 280 * g / wt));
    let s = line(20, 130, 340, 130, { w: 4, cls: "ar-draw" });
    braces.forEach((b) => {
      const c = b.color || BLUE, up = !b.below, y = up ? 100 - (b.row || 0) * 34 : 182 + (b.row || 0) * 30;
      const x1 = xs[b.i] + 3, x2 = xs[b.j] - 3;
      s += line(x1, y, x2, y, { color: c, w: 3 }) + line(x1, y - 7, x1, y + 7, { color: c, w: 3 }) + line(x2, y - 7, x2, y + 7, { color: c, w: 3 });
      s += text((x1 + x2) / 2, up ? y - 15 : y + 17, b.label, { size: 17, fill: c });
    });
    names.forEach((n, i) => { if (n !== null) s += dot(xs[i], 130, 7, (o.gold || []).includes(i) ? GOLD : i % 2 ? BLUE : CORAL) + text(xs[i], 154, n, { size: 17 }); });
    return svg(s);
  }
  function rulerFig(max, a, b, names, parts = 0) {
    const X = (v) => 30 + v * 300 / max;
    let s = `<rect class="ar-pop" x="16" y="122" width="328" height="62" rx="8" fill="#ffe9a8" stroke="#c99a2e" stroke-width="3"/>`;
    for (let v = 0; v <= max; v++) {
      const big = max <= 12 || v % 5 === 0;
      s += line(X(v), 122, X(v), 122 + (big ? 20 : 11), { color: "#7a5a12", w: big ? 2.2 : 1.2 });
      if (big) s += text(X(v), 160, v, { size: 12, fill: "#7a5a12", halo: false });
    }
    s += line(X(a), 98, X(b), 98, { color: CORAL, w: 6, cls: "ar-draw" }) + dot(X(a), 98, 7, BLUE) + dot(X(b), 98, 7, BLUE) + text(X(a), 74, names[0]) + text(X(b), 74, names[1]);
    for (let k = 1; k < parts; k++) s += dot(X(a + k * (b - a) / parts), 98, 5, GOLD);
    return svg(s, "0 0 360 200");
  }
  // Ortak köşeli ışınlar ve boyalı açı bölgeleri.
  function fan(cx, cy, rays, sectors, o = {}) {
    let s = "";
    sectors.forEach((q) => {
      s += sector(cx, cy, q.r || 52, q.a0, q.a1, q.fill || LIGHT.gold, "ar-grow");
      if (q.t !== undefined) { const p = P(cx, cy, (q.a0 + q.a1) / 2, q.tr || 78); s += text(p[0], p[1], q.t, { size: q.size || 18, fill: q.color || INK }); }
    });
    rays.forEach((r) => {
      s += ray(cx, cy, r.deg, r.len || o.len || 140, r.color || INK, r.w || 5, "ar-draw");
      if (r.label) { const p = P(cx, cy, r.deg, (r.len || o.len || 140) + 16); s += text(p[0], p[1], r.label, { size: 15 }); }
    });
    if (o.right !== undefined) s += G.rightMark(cx, cy, o.right, 18, "#777");
    if (o.center) s += text(cx - 14, cy + 18, o.center, { size: 15 });
    return s + dot(cx, cy, 6, INK);
  }
  function arcArrow(cx, cy, R, a0, a1, color, label) {
    const [x0, y0] = P(cx, cy, a0, R), [x1, y1] = P(cx, cy, a1, R);
    let s = `<path d="M${x0} ${y0} A${R} ${R} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 0 : 1} ${x1} ${y1}" fill="none" stroke="${color}" stroke-width="4" stroke-dasharray="7 5"/>`;
    s += G.arrowHead(x1, y1, a1 > a0 ? a1 + 90 : a1 - 90, color, 14);
    if (label) { const p = P(cx, cy, (a0 + a1) / 2, R + 22); s += text(p[0], p[1], label, { size: 17, fill: color }); }
    return s;
  }
  // Bar modeli: her satır parçalardan oluşur; üstte toplam parantezi olabilir.
  function bars(rows, o = {}) {
    const H = 38, gap = 26, top = o.total || o.note ? 60 : 30, nameW = rows.some((r) => r.name) ? 90 : 30;
    const unit = 300 / Math.max(...rows.map((r) => sum(r.parts.map((p) => p.w))));
    let s = "";
    rows.forEach((r, i) => {
      let x = nameW;
      const y = top + i * (H + gap);
      if (r.name) s += text(nameW - 8, y + H / 2, r.name, { size: 15, anchor: "end" });
      r.parts.forEach((p, k) => {
        const w = p.w * unit * (330 - nameW) / 300;
        s += `<rect class="ar-grow-x" style="animation-delay:${(i * 3 + k) * 90}ms" x="${r1(x)}" y="${y}" width="${r1(w)}" height="${H}" rx="8" fill="${p.fill || LIGHT.blue}" stroke="${p.stroke || BLUE}" stroke-width="2.5"/>`;
        if (p.label !== undefined) s += text(x + w / 2, y + H / 2, p.label, { size: 16, fill: p.color || INK });
        x += w;
      });
      if (i === 0) r.end = x;
    });
    if (o.total) {
      const x0 = nameW, x1 = rows[0].end;
      s += line(x0 + 2, 36, x1 - 2, 36, { color: CORAL, w: 3 }) + line(x0 + 2, 29, x0 + 2, 43, { color: CORAL, w: 3 }) + line(x1 - 2, 29, x1 - 2, 43, { color: CORAL, w: 3 }) + text((x0 + x1) / 2, 18, o.total, { size: 17, fill: CORAL });
    }
    if (o.note) s += text(180, 24, o.note, { size: 17, fill: CORAL });
    return svg(s, `0 0 360 ${Math.max(140, top + rows.length * (H + gap))}`);
  }
  function circleFig(o) {
    const cx = o.cx || 180, cy = o.cy || 120, R = o.R || 92;
    let s = `<circle class="ar-pop" cx="${cx}" cy="${cy}" r="${R}" fill="${o.fill || "#eef6ff"}" stroke="${BLUE}" stroke-width="4"/>` + dot(cx, cy, 5, INK);
    if (o.radius) s += line(cx, cy, cx + R, cy, { color: CORAL, w: 5, cls: "ar-draw" }) + text(cx + R / 2, cy - 16, o.radius, { fill: CORAL });
    if (o.diameter) s += line(cx - R, cy + (o.radius ? 0 : 0), cx + R, cy, { color: TEAL, w: 5, cls: "ar-draw" }) + text(cx, cy + 20, o.diameter, { fill: TEAL });
    return s;
  }
  function triFig(A, B, labels, o = {}) {
    const [p, q, r] = G.triangleFromAngles(A, B);
    const cx = (p[0] + q[0] + r[0]) / 3, cy = (p[1] + q[1] + r[1]) / 3;
    const at = (pt, t, color) => t ? text(pt[0] + (cx - pt[0]) * .3, pt[1] + (cy - pt[1]) * .3, t, { size: 18, fill: color || INK }) : "";
    let s = `<polygon class="ar-pop" points="${[p, q, r].map((v) => v.join(",")).join(" ")}" fill="${o.fill || "#fff1d6"}" stroke="${GOLD}" stroke-width="4" stroke-linejoin="round"/>`;
    if (o.ticks) [[p, r], [q, r]].forEach(([u, v]) => { const m = [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2], a = Math.atan2(v[1] - u[1], v[0] - u[0]) + Math.PI / 2; s += line(m[0] - 8 * Math.cos(a), m[1] - 8 * Math.sin(a), m[0] + 8 * Math.cos(a), m[1] + 8 * Math.sin(a), { color: CORAL, w: 3 }); });
    if (o.ext) s += line(q[0], q[1], q[0] + 70, q[1], { color: INK, w: 4, dash: "8 6" }) + text(q[0] + 40, q[1] - 22, o.ext, { size: 18, fill: TEAL });
    if (o.sides) { const mid = (u, v) => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2]; const m1 = mid(p, q), m2 = mid(q, r), m3 = mid(r, p); s += text(m1[0], m1[1] + 18, o.sides[0]) + text(m2[0] + 30, m2[1], o.sides[1]) + text(m3[0] - 30, m3[1], o.sides[2]); }
    return s + at(p, labels[0], labels[3]) + at(q, labels[1], labels[4]) + at(r, labels[2], labels[5]);
  }
  function polyFig(n, o = {}) {
    const pts = Array.from({ length: n }, (_, i) => P(o.cx || 180, o.cy || 122, 90 + i * 360 / n, o.R || 92));
    let s = `<polygon class="ar-pop" points="${pts.map((p) => p.join(",")).join(" ")}" fill="${o.fill || "#efe9ff"}" stroke="${GRAPE}" stroke-width="4" stroke-linejoin="round"/>`;
    if (o.diag) for (let k = 2; k < n - 1; k++) s += line(pts[0][0], pts[0][1], pts[k][0], pts[k][1], { color: CORAL, w: 2.5, dash: "6 5" });
    if (o.side) { const m = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2], dir = P(0, 0, 90 + 180 / n, 1); s += text(m[0] + dir[0] * 24, m[1] + dir[1] * 24, o.side, { size: 17, fill: GRAPE }); }
    pts.forEach((p) => { s += dot(p[0], p[1], 5, CORAL); });
    return s;
  }
  function clockFig(h) {
    const cx = 180, cy = 120, R = 100;
    let s = `<circle class="ar-pop" cx="${cx}" cy="${cy}" r="${R}" fill="#fffaf0" stroke="${INK}" stroke-width="5"/>`;
    for (let k = 1; k <= 12; k++) {
      const a = 90 - k * 30, [x1, y1] = P(cx, cy, a, R - 4), [x2, y2] = P(cx, cy, a, R - 14), [tx, ty] = P(cx, cy, a, R - 28);
      s += line(x1, y1, x2, y2, { w: 3 }) + text(tx, ty, k, { size: 15, halo: false });
    }
    s += sector(cx, cy, 40, Math.min(90, 90 - h * 30), Math.max(90, 90 - h * 30), "#e25b4544", "ar-grow");
    s += ray(cx, cy, 90 - h * 30, 52, CORAL, 8, "ar-draw") + ray(cx, cy, 90, 78, BLUE, 5, "ar-draw") + dot(cx, cy, 7, INK);
    return svg(s);
  }
  function blocksFig(th, hu, te, on) {
    let s = "", x = 14;
    const col = (count, w, draw) => { for (let i = 0; i < count; i++) s += draw(x + (i % 3) * (w + 4), 30 + Math.floor(i / 3) * (w + 4), i); x += Math.min(count, 3) * (w + 4) + 10; };
    col(th, 30, (x0, y0, i) => `<g class="ar-pop" style="animation-delay:${i * 60}ms"><rect x="${x0}" y="${y0}" width="30" height="30" fill="${GRAPE}" stroke="#3b2a8a" stroke-width="2"/><path d="M${x0} ${y0} l7 -7 h30 l-7 7 z M${x0 + 30} ${y0} l7 -7 v30 l-7 7 z" fill="#9b86ec" stroke="#3b2a8a" stroke-width="1.5"/></g>`);
    col(hu, 26, (x0, y0, i) => { let g = `<rect x="${x0}" y="${y0}" width="26" height="26" fill="${LIGHT.blue}" stroke="${BLUE}" stroke-width="2"/>`; for (let k = 1; k < 5; k++) g += line(x0 + k * 5.2, y0, x0 + k * 5.2, y0 + 26, { color: BLUE, w: .8 }) + line(x0, y0 + k * 5.2, x0 + 26, y0 + k * 5.2, { color: BLUE, w: .8 }); return `<g class="ar-pop" style="animation-delay:${i * 60}ms">${g}</g>`; });
    const tx = x; for (let i = 0; i < te; i++) s += `<rect class="ar-pop" style="animation-delay:${i * 50}ms" x="${tx + i * 11}" y="30" width="8" height="64" rx="2" fill="${TEAL}"/>`;
    x += te * 11 + 12;
    for (let i = 0; i < on; i++) s += `<rect class="ar-pop" style="animation-delay:${i * 50}ms" x="${x + (i % 3) * 12}" y="${30 + Math.floor(i / 3) * 12}" width="9" height="9" rx="2" fill="${CORAL}"/>`;
    const w = Math.max(360, x + 50);
    s += text(w / 2, 190, `${th} binlik · ${hu} yüzlük · ${te} onluk · ${on} birlik`, { size: 15 });
    return svg(s, `0 0 ${w} 210`);
  }
  function divisionFig(dividend, divisor, quotient, rem) {
    let s = text(110, 60, dividend, { size: 30, anchor: "end" }) + line(130, 36, 130, 140, { w: 4 }) + line(130, 84, 250, 84, { w: 4 }) + text(150, 60, divisor, { size: 30, anchor: "start", fill: BLUE }) + text(150, 112, quotient, { size: 30, anchor: "start", fill: TEAL });
    s += line(40, 150, 116, 150, { w: 3, color: "#999" }) + text(110, 176, rem, { size: 30, anchor: "end", fill: CORAL });
    s += text(300, 60, "bölen", { size: 13, fill: BLUE }) + text(300, 112, "bölüm", { size: 13, fill: TEAL }) + text(300, 176, "kalan", { size: 13, fill: CORAL });
    return svg(s, "0 0 360 200");
  }
  function lShape(W, H, w, h, labels) {
    // W×H dikdörtgenin sağ üst köşesinden w×h kesilmiş L şekli.
    const u = Math.min(250 / W, 160 / H), x = 180 - W * u / 2, y = 125 - H * u / 2;
    const pts = [[x, y + h * u], [x + (W - w) * u, y + h * u], [x + (W - w) * u, y], [x + W * u, y], [x + W * u, y + H * u], [x, y + H * u]];
    // Düzeltme: kesik parça sol üstte.
    const P2 = [[x, y + h * u], [x + w * u, y + h * u], [x + w * u, y], [x + W * u, y], [x + W * u, y + H * u], [x, y + H * u]];
    let s = `<polygon class="ar-pop" points="${P2.map((p) => p.map(r1).join(",")).join(" ")}" fill="#ffe7a3" stroke="${GOLD}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w * u)}" height="${r1(h * u)}" fill="none" stroke="#bbb" stroke-width="2" stroke-dasharray="6 5"/>`;
    s += text(x + w * u + (W - w) * u / 2, y - 14, labels.top) + text(x + W * u + 12, y + H * u / 2, labels.right, { anchor: "start" }) + text(x + W * u / 2, y + H * u + 18, labels.bottom) + text(x - 12, y + h * u + (H - h) * u / 2, labels.left, { anchor: "end" });
    void pts;
    return svg(s, "0 0 360 250");
  }

  // ---- Konu şablonları ----
  const TP = {};
  const add = (topic, lo, hi, make) => {
    const list = TP[topic] || (TP[topic] = []);
    list.push({ id: topic + ":" + list.length, lo, hi, make });
  };
  const LETTERS = [["A", "B", "C", "D", "E", "F"], ["K", "L", "M", "N", "P", "R"], ["P", "R", "S", "T", "U", "V"]];

  // 1. Nokta, doğru, doğru parçası, ışın
  add("nokta", 1, 3, (l) => {
    const n = l === 1 ? 3 : pick([3, 4]), nm = pick(LETTERS).slice(0, n);
    const gaps = Array.from({ length: n - 1 }, () => ri(2, 4 + l * 4)), tot = sum(gaps);
    const seg = (i, j) => nm[i] + nm[j];
    if (n === 3 && rnd() < .5) return N(`${nm.join(", ")} noktaları bir doğru üzerinde bu sırada. ${seg(0, 2)} = ${tot} cm, ${seg(0, 1)} = ${gaps[0]} cm. ${seg(1, 2)} kaç cm?`, gaps[1], `${seg(1, 2)} = ${seg(0, 2)} − ${seg(0, 1)} = ${tot} − ${gaps[0]} = ${gaps[1]}.`,
      segFig(nm, gaps, [{ i: 0, j: 2, label: tot + " cm", row: 1, color: TEAL }, { i: 0, j: 1, label: gaps[0] + " cm" }, { i: 1, j: 2, label: "?", color: CORAL }]), { unit: "cm" });
    return N(`${nm.join(", ")} noktaları bir doğru üzerinde bu sırada. Parçaların uzunlukları şekilde. ${seg(0, n - 1)} kaç cm?`, tot, `Ardışık parçalar toplanır: ${gaps.join(" + ")} = ${tot}.`,
      segFig(nm, gaps, [...gaps.map((g, i) => ({ i, j: i + 1, label: g + " cm" })), { i: 0, j: n - 1, label: "?", color: CORAL, below: true }]), { unit: "cm" });
  });
  add("nokta", 1, 3, (l) => {
    const max = l === 1 ? 10 : l === 2 ? 15 : 20, parts = l === 3 ? pick([2, 3]) : 0;
    let a = ri(0, max - 6), b = ri(a + 3, max);
    if (parts) { const len = parts * ri(1, Math.floor((max - a) / parts)); b = a + len; if (b - a < 2) b = a + parts * 2; if (b > max) { a = 0; b = parts * 3; } }
    const nm = pick([["A", "B"], ["K", "L"], ["M", "N"]]);
    if (parts) return N(`Cetvelde ${nm[0]} ucu ${a}, ${nm[1]} ucu ${b} çizgisinde. ${nm[0]}${nm[1]} parçası sarı noktalarla ${parts} eş parçaya ayrıldı. Bir parça kaç cm?`, (b - a) / parts, `${nm[0]}${nm[1]} = ${b} − ${a} = ${b - a}. ${b - a} ÷ ${parts} = ${(b - a) / parts}.`, rulerFig(max, a, b, nm, parts), { unit: "cm" });
    return N(`Cetvele bak. ${nm[0]}${nm[1]} doğru parçası kaç cm?`, b - a, `Son okuma − ilk okuma: ${b} − ${a} = ${b - a}.`, rulerFig(max, a, b, nm), { unit: "cm", hint: "Uzunluk, iki ucun cetveldeki okumalarının farkıdır." });
  });
  add("nokta", 1, 4, (l) => {
    const n = ri(3, Math.min(7, 3 + l)), nm = LETTERS[0].concat(["G", "H"]).slice(0, n);
    const gaps = Array.from({ length: n - 1 }, () => 1);
    if (l === 1 && rnd() < .5) return N(`Doğru üzerinde ${n} nokta var. Ardışık iki nokta arasında kalan kaç aralık vardır?`, n - 1, `${n} nokta arasında ${n - 1} aralık bulunur.`, segFig(nm, gaps, []));
    const terms = Array.from({ length: n - 1 }, (_, i) => n - 1 - i);
    return N(`Şekildeki noktaları uç kabul eden kaç farklı doğru parçası vardır?`, n * (n - 1) / 2, `İlk noktadan ${n - 1}, sonrakinden ${n - 2}… parça çıkar: ${terms.join(" + ")} = ${n * (n - 1) / 2}.`, segFig(nm, gaps, []), { hint: "Her noktadan sağındaki noktalara giden parçaları say." });
  });
  add("nokta", 2, 4, (l) => {
    if (l === 2) {
      const x = ri(3, 25);
      return N(`M, AB doğru parçasının orta noktası. AM = ${x} cm ise AB kaç cm?`, 2 * x, `Orta nokta parçayı iki eş parçaya ayırır: 2 × ${x} = ${2 * x}.`, segFig(["A", "M", "B"], [1, 1], [{ i: 0, j: 1, label: x + " cm" }, { i: 0, j: 2, label: "?", color: CORAL, below: true }], { gold: [1] }), { unit: "cm" });
    }
    const x = ri(4, 12 + l * 6), askAB = rnd() < .5;
    const fig = segFig(["A", "M", "N", "B"], [2, 1, 1], askAB ? [{ i: 0, j: 2, label: 3 * x + " cm" }, { i: 0, j: 3, label: "?", color: CORAL, below: true }] : [{ i: 0, j: 3, label: 4 * x + " cm" }, { i: 2, j: 3, label: "?", color: CORAL, below: true }], { gold: [1, 2] });
    return askAB ? N(`M, AB'nin orta noktası; N de MB'nin orta noktası. AN = ${3 * x} cm ise AB kaç cm?`, 4 * x, `AB'yi 4 eş parça düşün: AN bunların 3'ü. Bir parça ${3 * x} ÷ 3 = ${x}; AB = 4 × ${x} = ${4 * x}.`, fig, { unit: "cm" })
      : N(`M, AB'nin orta noktası; N de MB'nin orta noktası. AB = ${4 * x} cm ise NB kaç cm?`, x, `MB = ${4 * x} ÷ 2 = ${2 * x}; NB = ${2 * x} ÷ 2 = ${x}.`, fig, { unit: "cm" });
  });
  add("nokta", 3, 5, (l) => {
    const n = ri(4, 3 + l), nm = LETTERS[1].concat(["S", "T"]).slice(0, n);
    return N(`Bu ${n} noktanın her biri bir ışının başlangıcı olabilir; ışın diğer noktalardan birinin yönüne gider. Aynı başlangıçlı ve aynı yönlü ışınlar bir sayılırsa kaç farklı ışın vardır?`, 2 * n - 2, `Uçtaki iki noktadan yalnız 1 yön, ${n - 2} içteki noktadan 2 yön vardır: 2 + 2 × ${n - 2} = ${2 * n - 2}.`, segFig(nm, Array(n - 1).fill(1), []), { hint: "Uçtaki noktalardan ışın yalnız bir yöne gidebilir." });
  });
  add("nokta", 4, 5, (l) => {
    const k = pick([2, 3, 4]), x = (k % 2 ? 2 : 1) * ri(3, l === 4 ? 9 : 15);
    const fig = segFig(["A", "M", "B", "C"], [k * x / 2, k * x / 2, x], [{ i: 0, j: 3, label: (k + 1) * x + " cm" }, { i: 1, j: 3, label: "?", color: CORAL, below: true }], { gold: [1] });
    return N(`A, B, C bu sırada bir doğru üzerinde. AB, BC'nin ${k} katı ve AC = ${(k + 1) * x} cm. M, AB'nin orta noktası ise MC kaç cm?`, k * x / 2 + x, `AC = ${k + 1} parça → bir parça (BC) ${x}. AB = ${k * x}, MB = ${k * x / 2}. MC = ${k * x / 2} + ${x} = ${k * x / 2 + x}.`, fig, { unit: "cm" });
  });
  add("nokta", 4, 5, (l) => {
    const n = ri(4, l === 4 ? 6 : 8), u = ri(3, l === 4 ? 9 : 14), i = ri(1, n - 2), j = ri(i + 1, n - 1);
    const names = Array.from({ length: n + 1 }, (_, k) => k === 0 ? "A" : k === n ? "B" : k === i ? "P" : k === j ? "R" : null);
    return N(`AB = ${n * u} cm, ${n} eş parçaya ayrıldı. P ile R arası kaç cm?`, (j - i) * u, `Bir parça ${n * u} ÷ ${n} = ${u}. P ile R arasında ${j - i} parça var: ${j - i} × ${u} = ${(j - i) * u}.`,
      segFig(names.map((t) => t === null ? "" : t), Array(n).fill(1), [{ i: 0, j: n, label: n * u + " cm", row: 0 }, { i, j, label: "?", color: CORAL, below: true }], { gold: [i, j] }), { unit: "cm" });
  });

  // 2. Açı
  add("aci", 1, 2, (l) => {
    const type = pick(["Dar açı", "Dik açı", "Geniş açı", "Doğru açı"]);
    const deg = type === "Dar açı" ? ri(15, 75) : type === "Dik açı" ? 90 : type === "Geniş açı" ? ri(105, 165) : 180;
    return C(l === 1 ? `Ölçüsü ${deg}° olan açı hangi türdedir?` : "Şekildeki açı hangi türdedir?", type, ["Dar açı", "Dik açı", "Geniş açı", "Doğru açı"], "90°den küçük açı dar, 90° dik, 90° ile 180° arası geniş, 180° doğru açıdır.", svg(G.angleFigure(deg, { cx: 180, len: 140, label: l === 1 ? deg + "°" : "" })));
  });
  add("aci", 1, 3, (l) => {
    const a = ri(4, 14) * 5 + (l > 1 ? ri(0, 4) : 0), b = ri(1, Math.floor((a - 5) / 5)) * 5 + (l > 2 ? ri(0, 3) : 0);
    const cx = 90, cy = 200;
    let s = line(20, cy, 340, cy, { w: 6 }) + sector(cx, cy, 60, 0, a, LIGHT.gold, "ar-grow") + text(...P(cx, cy, a / 2, 84), a + "°");
    s += `<g class="ar-pop">${ray(cx, cy, a, 190, "#9a5b2e", 12)}</g>` + arcArrow(cx, cy, 150, a, a - b, CORAL, "−" + b + "°") + dot(cx, cy, 8, INK);
    return N(`Kapı ${a}° açıkken ${b}° kapatılıyor. Açıklık kaç derece kalır?`, a - b, `${a} − ${b} = ${a - b}.`, svg(s), { unit: "°" });
  });
  add("aci", 1, 3, (l) => {
    const full = l > 1 && rnd() < .5, tot = full ? 360 : 180;
    const k = pick(full ? [3, 4, 5, 6, 8, 9, 10] : [2, 3, 4, 5, 6, 9]);
    const cx = 180, cy = full ? 120 : 200, step = tot / k, R = full ? 95 : 150;
    const rays = Array.from({ length: full ? k : k + 1 }, (_, i) => ({ deg: i * step, len: R, color: i ? INK : CORAL }));
    const secs = Array.from({ length: k }, (_, i) => ({ a0: i * step, a1: (i + 1) * step, r: full ? 60 : 70, fill: i % 2 ? LIGHT.teal : LIGHT.gold, t: i === 0 ? "?" : undefined, color: CORAL, size: 24, tr: full ? 74 : 98 }));
    return N(`${full ? "Tam açı" : "Doğru açı"} ${k} eş parçaya ayrıldı. Bir parça kaç derecedir?`, tot / k, `${tot} ÷ ${k} = ${tot / k}.`, svg(fan(cx, cy, rays, secs), full ? "0 0 360 240" : "0 0 360 225"), { unit: "°" });
  });
  add("aci", 2, 4, (l) => {
    const a = ri(15, 75), b = ri(15, Math.min(85, 170 - a)), back = l === 4 && rnd() < .5;
    const wide = a + b > 95, fx = wide ? 180 : 80, fl = wide ? 140 : 170;
    const fig = svg(fan(fx, 205, [{ deg: 0, label: "A", len: fl }, { deg: a, label: "B", color: CORAL, len: fl }, { deg: a + b, label: "C", len: fl }],
      back ? [{ a0: 0, a1: a, fill: LIGHT.gold, t: "?", color: CORAL, size: 22 }, { a0: a, a1: a + b, fill: LIGHT.teal, t: b + "°", r: 70, tr: 100 }] : [{ a0: 0, a1: a, fill: LIGHT.gold, t: a + "°" }, { a0: a, a1: a + b, fill: LIGHT.teal, t: b + "°", r: 70, tr: 100 }], { center: "O" }), wide ? "0 0 360 240" : "-20 0 380 240");
    return back ? N(`∠AOC = ${a + b}° ve ∠BOC = ${b}°. ∠AOB kaç derece?`, a, `${a + b} − ${b} = ${a}.`, fig, { unit: "°" })
      : N(`∠AOB ile ∠BOC komşu açılar. ∠AOC kaç derece?`, a + b, `Komşu açılar toplanır: ${a} + ${b} = ${a + b}.`, fig, { unit: "°" });
  });
  add("aci", 3, 5, (l) => {
    const k = ri(2, 4 + l - 3), m = ri(2, 6), b = pick([4, 5, 6]);
    let a = ri(20, 50); while (k * a - m * b <= 0) a += 5;
    const net = k * a - m * b;
    const fig = boxes([{ icon: "🤖", label: "robot" }, { icon: "↺", label: `${k} kez ${l >= 4 ? "?" : a + "°"} sola` }, { icon: "↻", label: `${m} kez ${b}° sağa` }, ...(l >= 4 ? [{ icon: "🎯", label: `net ${net}° sola` }] : [])]);
    return l >= 4 ? N(`Robot ${k} kez eşit miktarda sola, sonra ${m} kez ${b}° sağa dönüyor. Net sola dönüşü ${net}°. Bir sola dönüş kaç derece?`, a, `Sağa dönüşler ${m} × ${b} = ${m * b}. Sola toplam ${net} + ${m * b} = ${k * a}. ${k * a} ÷ ${k} = ${a}.`, fig, { unit: "°" })
      : N(`Robot ${k} kez ${a}° sola, sonra ${m} kez ${b}° sağa dönüyor. Net sola dönüş kaç derece?`, net, `${k} × ${a} − ${m} × ${b} = ${k * a} − ${m * b} = ${net}.`, fig, { unit: "°" });
  });
  add("aci", 3, 5, (l) => {
    const k = ri(2, l + 1), x = ri(8, Math.floor(170 / (k + 1)));
    const askBig = l === 5 && rnd() < .5;
    const wide = (k + 1) * x > 95, fx = wide ? 180 : 80, fl = wide ? 140 : 170;
    const fig = svg(fan(fx, 205, [{ deg: 0, label: "A", len: fl }, { deg: x, label: "B", color: CORAL, len: fl }, { deg: (k + 1) * x, label: "C", len: fl }],
      [{ a0: 0, a1: x, fill: LIGHT.gold, t: askBig ? "" : "?", color: CORAL, r: 90, tr: 110 }, { a0: x, a1: (k + 1) * x, fill: LIGHT.teal, t: askBig ? "?" : "", color: CORAL, r: 60 }], { center: "O" }), wide ? "0 0 360 240" : "-20 0 380 240");
    return N(`∠AOC = ${(k + 1) * x}°. ∠BOC, ∠AOB'nin ${k} katı. ${askBig ? "∠BOC" : "∠AOB"} kaç derece?`, askBig ? k * x : x, `∠AOC = 1 + ${k} = ${k + 1} eş parça. Bir parça ${(k + 1) * x} ÷ ${k + 1} = ${x}.${askBig ? ` ∠BOC = ${k} × ${x} = ${k * x}.` : ""}`, fig, { unit: "°" });
  });

  // 3. Çember
  add("cember", 1, 2, (l) => {
    const r = ri(2, 6 + 6 * l), askD = rnd() < .5;
    return N(askD ? `Yarıçapı ${r} cm olan çemberin çapı kaç cm?` : `Çapı ${2 * r} cm olan çemberin yarıçapı kaç cm?`, askD ? 2 * r : r, askD ? `Çap = 2 × yarıçap = ${2 * r}.` : `Yarıçap = çap ÷ 2 = ${r}.`,
      svg(circleFig(askD ? { radius: r + " cm" } : { diameter: 2 * r + " cm" })), { unit: "cm" });
  });
  add("cember", 2, 3, (l) => {
    const r = ri(2, 6 + 3 * l), d = ri(2, 8), cx = 180, cy = 120;
    let s = `<circle class="ar-pop" cx="${cx}" cy="${cy}" r="105" fill="#eef6ff" stroke="${BLUE}" stroke-width="4"/><circle class="ar-pop" cx="${cx}" cy="${cy}" r="${r1(105 * r / (r + d))}" fill="#dff1ff" stroke="${TEAL}" stroke-width="4"/>`;
    s += line(cx, cy, cx + 105 * r / (r + d), cy, { color: TEAL, w: 5 }) + line(cx + 105 * r / (r + d), cy, cx + 105, cy, { color: CORAL, w: 7, cls: "ar-draw" }) + text(cx + 52 * r / (r + d), cy - 16, r + " cm", { fill: TEAL });
    s += line(cx, cy, cx - 74, cy - 74, { color: BLUE, w: 4 }) + text(cx - 52, cy - 28, r + d + " cm", { fill: BLUE }) + text(cx + 105 * (2 * r + d) / (2 * (r + d)), cy + 22, "?", { fill: CORAL, size: 24 }) + dot(cx, cy, 5, INK);
    return N(`Aynı merkezli iki çemberin yarıçapları ${r} cm ve ${r + d} cm. Kırmızı parça kaç cm?`, d, `${r + d} − ${r} = ${d}.`, svg(s), { unit: "cm" });
  });
  add("cember", 2, 4, (l) => {
    const k = ri(2, Math.min(5, 1 + l)), r = ri(2, 4 + 2 * l), back = l >= 3 && rnd() < .5;
    const R = Math.min(150 / k, 60), x0 = 180 - k * R;
    let s = `<rect class="ar-pop" x="${r1(x0 - 4)}" y="${r1(120 - R - 4)}" width="${r1(2 * k * R + 8)}" height="${r1(2 * R + 8)}" rx="8" fill="#fff4dc" stroke="${GOLD}" stroke-width="4"/>`;
    for (let i = 0; i < k; i++) s += `<circle class="ar-pop" style="animation-delay:${i * 90}ms" cx="${r1(x0 + R + 2 * R * i)}" cy="120" r="${r1(R)}" fill="#eef6ff" stroke="${BLUE}" stroke-width="3"/>` + dot(x0 + R + 2 * R * i, 120, 4, INK);
    s += line(x0 + R, 120, x0 + 2 * R, 120, { color: CORAL, w: 4 }) + text(x0 + 1.5 * R, 104, back ? "?" : r + " cm", { size: 15, fill: CORAL });
    s += line(x0 - 4, 120 + R + 22, x0 + 2 * k * R + 4, 120 + R + 22, { color: TEAL, w: 3 }) + text(180, 120 + R + 40, back ? 2 * k * r + " cm" : "?", { fill: TEAL });
    return back ? N(`${k} eş çember kutuya yan yana sığıyor. Kutunun uzunluğu ${2 * k * r} cm ise bir çemberin yarıçapı kaç cm?`, r, `Kutu uzunluğu ${k} çap: bir çap ${2 * k * r} ÷ ${k} = ${2 * r}; yarıçap ${r}.`, svg(s, "0 0 360 240"), { unit: "cm" })
      : N(`Yarıçapı ${r} cm olan ${k} eş çember kutuya yan yana sığıyor. Kutunun uzunluğu kaç cm?`, 2 * k * r, `Bir çap ${2 * r}; ${k} çap: ${k} × ${2 * r} = ${2 * k * r}.`, svg(s, "0 0 360 240"), { unit: "cm" });
  });
  add("cember", 3, 5, (l) => {
    const a = ri(3, 8 + 3 * l), b = ri(3, 8 + 3 * l), ra = 140 * a / (a + b), rb = 140 * b / (a + b);
    const xa = 180 - (ra + rb) / 2 + 0, xb = xa + ra + rb;
    let s = `<circle class="ar-pop" cx="${r1(xa)}" cy="120" r="${r1(ra)}" fill="#eef6ff" stroke="${BLUE}" stroke-width="4"/><circle class="ar-pop" cx="${r1(xb)}" cy="120" r="${r1(rb)}" fill="#fff1d6" stroke="${GOLD}" stroke-width="4"/>`;
    s += line(xa, 120, xb, 120, { color: CORAL, w: 4, dash: "8 5" }) + dot(xa, 120, 5, INK) + dot(xb, 120, 5, INK);
    s += line(xa, 120, xa, 120 - ra, { color: BLUE, w: 3 }) + text(xa + 18, 120 - ra / 2, a, { size: 15, fill: BLUE }) + line(xb, 120, xb, 120 + rb, { color: GOLD, w: 3 }) + text(xb + 18, 120 + rb / 2, b, { size: 15, fill: "#b07a00" }) + text(180, 102, "?", { size: 22, fill: CORAL });
    return N(`Yarıçapları ${a} cm ve ${b} cm olan iki çember tek noktada birbirine değiyor. Merkezleri arası kaç cm?`, a + b, `Merkezleri birleştiren parça iki yarıçaptan oluşur: ${a} + ${b} = ${a + b}.`, svg(s, "0 0 360 240"), { unit: "cm" });
  });
  add("cember", 4, 5, (l) => {
    const k = pick([2, 3, 4]), r = ri(3, l === 4 ? 9 : 15), R = k * r;
    const big = 110, sm = big / k;
    let s = `<circle class="ar-pop" cx="180" cy="120" r="${big}" fill="#eef6ff" stroke="${BLUE}" stroke-width="4"/>`;
    for (let i = 0; i < k; i++) s += `<circle class="ar-pop" style="animation-delay:${i * 90}ms" cx="${r1(70 + sm + 2 * sm * i)}" cy="120" r="${r1(sm)}" fill="#fff1d6" stroke="${GOLD}" stroke-width="3"/>`;
    s += line(180, 120, 180, 10, { color: BLUE, w: 4 }) + text(196, 60, R + " cm", { fill: BLUE, anchor: "start" }) + text(70 + sm, 120, "?", { size: 22, fill: CORAL });
    return N(`Büyük çemberin yarıçapı ${R} cm. Çapı boyunca ${k} eş küçük çember dizildi. Küçük çemberin yarıçapı kaç cm?`, r, `Büyük çap ${2 * R} = ${k} küçük çap. Küçük çap ${2 * R} ÷ ${k} = ${2 * r}; yarıçap ${r}.`, svg(s), { unit: "cm" });
  });
  add("cember", 4, 5, (l) => {
    const a = ri(8, l === 4 ? 25 : 45), d = ri(3, 10 + l * 2), b = a + d;
    const s = circleFig({ cx: 105, R: 70, radius: "?" }) + `<circle class="ar-pop" cx="265" cy="120" r="${r1(70 * b / a > 90 ? 90 : 70 * b / a)}" fill="#fff1d6" stroke="${GOLD}" stroke-width="4"/>` + text(265, 120, "?", { size: 22, fill: CORAL });
    return N(`İki çemberin çapları toplamı ${2 * (a + b)} cm, yarıçapları farkı ${d} cm. Büyük çemberin çapı kaç cm?`, 2 * b, `Yarıçaplar toplamı ${a + b}. Büyük yarıçap (${a + b} + ${d}) ÷ 2 = ${b}; çap ${2 * b}.`, svg(s, "0 0 380 240"), { unit: "cm" });
  });

  // 4. Dikme
  add("dikme", 1, 3, (l) => {
    const x = l === 1 ? ri(2, 16) * 5 : ri(11, 79);
    let s = line(20, 200, 340, 200) + line(180, 200, 180, 30) + ray(180, 200, 90 - x, 160, CORAL, 5, "ar-draw");
    s += sector(180, 200, 52, 90 - x, 90, LIGHT.gold, "ar-grow") + sector(180, 200, 40, 0, 90 - x, LIGHT.teal, "ar-grow") + G.rightMark(180, 200, 90, 22, "#999");
    s += text(...P(180, 200, 90 - x / 2, 78), x + "°") + text(...P(180, 200, (90 - x) / 2, 66), "?", { size: 24, fill: TEAL }) + dot(180, 200, 6, INK);
    return N("Dikey doğru yatay doğruya diktir. Soru işaretli açı kaç derecedir?", 90 - x, `Dik açı 90°: 90 − ${x} = ${90 - x}.`, svg(s), { unit: "°" });
  });
  add("dikme", 1, 2, (l) => {
    const a = ri(4, 10 + 5 * l), b = a + ri(2, 8);
    let s = line(20, 200, 340, 200, { w: 5 }) + text(330, 220, "d", { size: 16 }) + dot(140, 50, 8, CORAL) + text(140, 30, "P");
    s += line(140, 50, 140, 200, { color: TEAL, w: 5, cls: "ar-draw" }) + G.rightMark(140, 200, 0, 16) + text(122, 125, a + " cm", { fill: TEAL, anchor: "end" });
    s += line(140, 50, 290, 200, { color: BLUE, w: 4, dash: "9 6" }) + text(240, 112, b + " cm", { fill: BLUE });
    return N(`P'den d doğrusuna dik yol ${a} cm, eğik yol ${b} cm. Dik yol kaç cm daha kısa?`, b - a, `${b} − ${a} = ${b - a}. Dik uzaklık en kısa yoldur.`, svg(s), { unit: "cm" });
  });
  add("dikme", 1, 3, (l) => {
    const k = ri(2, 3 + l), h = ri(2, 4 + 3 * l);
    let s = line(20, 210, 340, 210, { w: 5, color: "#6b4b2a" });
    for (let i = 0; i < k; i++) { const x = 60 + i * 240 / Math.max(1, k - 1); s += `<rect class="ar-grow" x="${r1(x - 4)}" y="60" width="8" height="150" rx="3" fill="#8a8f99"/>` + G.rightMark(x, 210, 0, 13, TEAL) + dot(x, 58, 6, GOLD); }
    s += text(40, 135, h + " m", { anchor: "end", fill: BLUE });
    return N(`Zemine dik ${k} direğin her biri ${h} m. Toplam kaç m malzeme gerekir?`, k * h, `${k} × ${h} = ${k * h}.`, svg(s, "-10 0 380 240"), { unit: "m" });
  });
  add("dikme", 2, 4, (l) => {
    const k = ri(2, 2 + l);
    let s = line(20, 130, 340, 130, { w: 5 });
    for (let i = 0; i < k; i++) { const x = 60 + i * 240 / Math.max(1, k - 1); s += line(x, 30, x, 225, { color: CORAL, w: 4, cls: "ar-draw" }) + G.rightMark(x, 130, 0, 13, TEAL) + G.rightMark(x, 130, 180, 13, TEAL); }
    return N(`Bir doğruyu ${k} doğru farklı noktalarda dik kesiyor. Toplam kaç dik açı oluşur?`, 4 * k, `Her dik kesişimde 4 dik açı vardır: ${k} × 4 = ${4 * k}.`, svg(s), { hint: "Bir kesişim noktasının çevresindeki 4 açıyı say." });
  });
  add("dikme", 3, 5, (l) => {
    const d = ri(20, 40 + 10 * l), e = ri(3, 10), k = ri(2, 3 + l), c = pick([20, 30, 40, 50]);
    let s = `<rect x="0" y="70" width="360" height="100" fill="#cfe8ff"/>` + line(0, 70, 360, 70, { w: 5, color: "#5b7d2a" }) + line(0, 170, 360, 170, { w: 5, color: "#5b7d2a" });
    s += line(110, 70, 110, 170, { color: TEAL, w: 9, cls: "ar-draw" }) + G.rightMark(110, 170, 0, 14) + text(92, 120, d + " m", { anchor: "end", fill: TEAL });
    s += line(200, 70, 300, 170, { color: "#9a5b2e", w: 7, dash: "10 6" }) + text(280, 112, d + e + " m", { fill: "#9a5b2e" }) + text(180, 210, `${k} köprü · metresi ${c} TL`, { size: 15 });
    return N(`Kıyılar arası dik uzaklık ${d} m, eğik köprü ${d + e} m. ${k} köprü dik yapılırsa metresi ${c} TL olan malzemeden kaç TL tasarruf edilir?`, k * e * c, `Bir köprü ${e} m kısalır. ${k} × ${e} × ${c} = ${k * e * c}.`, svg(s), { unit: "TL" });
  });
  add("dikme", 4, 5, (l) => {
    const near = ri(10, 30 + l * 5), f = ri(4, 20), far = near + f, D = near + far;
    let s = line(20, 30, 340, 30, { w: 5 }) + line(20, 210, 340, 210, { w: 5 });
    const y = 30 + 180 * far / D;
    s += dot(180, y, 8, CORAL) + text(200, y, "P", { anchor: "start" }) + line(180, y, 180, 210, { color: TEAL, w: 4 }) + line(180, y, 180, 30, { color: BLUE, w: 4, dash: "8 5" });
    s += G.rightMark(180, 210, 0, 13) + G.rightMark(180, 30, 0, -13) + text(160, (y + 210) / 2, "?", { anchor: "end", fill: TEAL, size: 22 });
    s += line(300, 30, 300, 210, { color: GRAPE, w: 3 }) + text(312, 120, D + " cm", { anchor: "start", fill: GRAPE });
    return N(`P iki paralel doğrunun arasında. Doğrular arası dik uzaklık ${D} cm. P'nin iki doğruya uzaklıkları farkı ${f} cm. Yakın doğruya uzaklık kaç cm?`, near, `İki uzaklığın toplamı ${D}, farkı ${f}. Küçüğü (${D} − ${f}) ÷ 2 = ${near}.`, svg(s, "0 0 380 240"), { unit: "cm" });
  });

  // 5. Paralel doğrular
  add("paralel", 1, 2, (l) => {
    const n = ri(4, 4 + l * 2), k = ri(1, n - 2), base = pick([0, 25, -30, 60]);
    const slots = shuffle(Array.from({ length: n }, (_, i) => i));
    const draw = (deg, cx, cy, color, w = 4) => { const a = P(cx, cy, deg, 34), b = P(cx, cy, deg + 180, 34); return line(a[0], a[1], b[0], b[1], { color, w, cls: "ar-draw" }); };
    let s = draw(base, 55, 60, CORAL, 7) + text(55, 105, "kırmızı", { size: 13, fill: CORAL });
    slots.forEach((slot, i) => { s += draw(i < k ? base : base + pick([35, 55, 75, 90, -45, -65]), 150 + (slot % 3) * 80, 45 + Math.floor(slot / 3) * 75, INK); });
    return N("Kırmızı doğruya paralel olan kaç siyah doğru var?", k, `Aynı doğrultudaki (eğimi aynı) doğruları say: ${k} tane.`, svg(s, "0 0 400 260"), { hint: "Paralel doğrular aynı yöne uzanır, hiç kesişmez." });
  });
  add("paralel", 1, 4, (l) => {
    const n = ri(3, 3 + l), sp = ri(2, 4 + 2 * l), back = l >= 3 && rnd() < .5;
    let s = "";
    for (let i = 0; i < n; i++) { const y = 30 + i * 180 / (n - 1); s += line(40, y, 300, y, { color: [BLUE, TEAL, GRAPE][i % 3], w: 4, cls: "ar-draw" }); }
    s += line(320, 30, 320, 210, { color: CORAL, w: 3 }) + text(330, 120, back ? (n - 1) * sp + " cm" : "?", { anchor: "start", fill: CORAL });
    s += line(260, 30, 260, 30 + 180 / (n - 1), { color: GOLD, w: 4 }) + text(250, 30 + 90 / (n - 1), back ? "?" : sp + " cm", { anchor: "end", fill: "#a07a00", size: 15 });
    return back ? N(`${n} paralel doğru eşit aralıklı. İlk ile son arası ${(n - 1) * sp} cm. Bir aralık kaç cm?`, sp, `${n} doğru arasında ${n - 1} aralık: ${(n - 1) * sp} ÷ ${n - 1} = ${sp}.`, svg(s, "0 0 400 240"), { unit: "cm" })
      : N(`${n} paralel doğrunun ardışık ikisi arası ${sp} cm. İlk ile son doğru arası kaç cm?`, (n - 1) * sp, `${n} doğru arasında ${n - 1} aralık: ${n - 1} × ${sp} = ${(n - 1) * sp}.`, svg(s, "0 0 400 240"), { unit: "cm" });
  });
  add("paralel", 2, 5, (l) => {
    const cells = l >= 4 && rnd() < .5, h = ri(cells ? 3 : 2, 2 + l), v = ri(cells ? 3 : 2, 3 + l);
    let s = "";
    for (let i = 0; i < h; i++) { const y = 30 + i * 180 / (h - 1); s += line(20, y, 340, y, { color: BLUE, w: 4, cls: "ar-draw" }); }
    for (let j = 0; j < v; j++) { const x = 50 + j * 260 / (v - 1); s += line(x, 10, x, 230, { color: CORAL, w: 4, cls: "ar-draw" }); }
    return cells ? N(`${h} yatay ve ${v} düşey paralel doğrudan oluşan ızgarada kaç küçük dikdörtgen hücre vardır?`, (h - 1) * (v - 1), `Yatay aralık ${h - 1}, düşey aralık ${v - 1}: ${h - 1} × ${v - 1} = ${(h - 1) * (v - 1)}.`, svg(s))
      : N(`${h} yatay ve ${v} düşey doğru var. Kaç kesişim noktası oluşur?`, h * v, `Her yatay her düşeyi bir kez keser: ${h} × ${v} = ${h * v}.`, svg(s), { hint: "Bir yatay doğru üzerindeki kesişimleri say, sonra yatay sayısıyla çarp." });
  });
  add("paralel", 3, 5, (l) => {
    // Kesen sağa yatık: üst kesişimden yukarı giden kolu a° yapar, alttaki kesişim sola düşer.
    const a = ri(25, 75), dx = 100 / Math.tan(a * Math.PI / 180);
    const top = [200, 70], bot = [200 - dx, 170], ux = dx / 100;
    let s = line(10, 70, 350, 70, { color: BLUE, w: 5 }) + line(10, 170, 350, 170, { color: BLUE, w: 5 });
    s += line(top[0] + ux * 50, 20, bot[0] - ux * 50, 220, { color: CORAL, w: 5, cls: "ar-draw" });
    s += sector(top[0], 70, 34, 0, a, LIGHT.gold, "ar-grow") + text(...P(top[0], 70, a / 2, 54), a + "°", { size: 16 });
    s += sector(bot[0], 170, 34, a, 180, LIGHT.teal, "ar-grow") + text(...P(bot[0], 170, (a + 180) / 2, 56), "?", { size: 22, fill: TEAL });
    return N(`İki paralel doğruyu bir kesen kesiyor. Üstteki kesişimde dar açı ${a}°. Alttaki kesişimdeki soru işaretli geniş açı kaç derece?`, 180 - a, `Paralel doğrularda yöndeş açılar eşittir; alttaki dar açı da ${a}°. Yan yana açılar 180°: 180 − ${a} = ${180 - a}.`, svg(s), { unit: "°" });
  });
  add("paralel", 2, 4, (l) => {
    const n = ri(2, 2 + l);
    let s = "";
    for (let i = 0; i < n; i++) { const y = 30 + i * 180 / Math.max(1, n - 1); s += line(20, y, 340, y, { color: BLUE, w: 4 }); }
    s += line(110, 10, 250, 230, { color: CORAL, w: 5, cls: "ar-draw" });
    const angles = rnd() < .5;
    return angles ? N(`${n} paralel doğruyu bir kesen kesiyor. Kesişimlerde toplam kaç açı oluşur?`, 4 * n, `${n} kesişim noktası, her birinde 4 açı: ${n} × 4 = ${4 * n}.`, svg(s))
      : N(`${n} paralel doğruyu bir kesen kesiyor. Kaç kesişim noktası oluşur?`, n, `Kesen her paralel doğruyu bir kez keser: ${n}.`, svg(s));
  });

  // 6. Açı ölçme
  add("olcme", 1, 3, (l) => {
    const deg = l === 1 ? ri(1, 17) * 10 : l === 2 ? ri(1, 35) * 5 : ri(5, 175);
    return N("İletkiye göre kırmızı ışın kaç derecelik açı yapıyor?", deg, `Sağdaki 0'dan başlayan ölçek okunur: ${deg}°.`, G.protractor(deg), { unit: "°", hint: "Açının kolunun sıfırda olduğu ölçeği oku." });
  });
  add("olcme", 2, 4, (l) => {
    const deg = l === 2 ? ri(2, 16) * 10 : ri(3, 33) * 5;
    let html = G.protractor(deg).replace("</svg>", `${sector(180, 205, 48, deg, 180, "#1c8c7455", "ar-grow")}${text(...P(180, 205, (deg + 180) / 2, 66), "?", { size: 22, fill: TEAL })}</svg>`);
    return N("Açının bir kolu iletkinin sol sıfır çizgisinde. Yeşil açı kaç derece?", 180 - deg, `Sağdan okunan ${deg}°. Soldan ölçülünce 180 − ${deg} = ${180 - deg}.`, html, { unit: "°", hint: "Kol sol sıfırdaysa dış ölçeği oku ya da 180'den çıkar." });
  });
  add("olcme", 1, 4, (l) => {
    const h = ri(1, 11);
    return N(`Saat tam ${h}.00. Akrep ile yelkovan arasındaki küçük açı kaç derece?`, 30 * Math.min(h, 12 - h), `İki saat çizgisi arası 360 ÷ 12 = 30°. Aradaki ${Math.min(h, 12 - h)} aralık: ${30 * Math.min(h, 12 - h)}.`, clockFig(h), { unit: "°" });
  });
  add("olcme", 3, 5, (l) => {
    const k = ri(1, l - 1), a = ri(10, 350);
    return N(`Bir dönme dolap ${k} tam tur ve ${a}° daha dönüyor. Toplam kaç derece döner?`, 360 * k + a, `Bir tam tur 360°: ${k} × 360 + ${a} = ${360 * k + a}.`, boxes([{ icon: "🎡", label: `${k} tam tur` }, { icon: "➕", label: `${a}° daha` }, { icon: "❓", label: "toplam" }]), { unit: "°" });
  });
  add("olcme", 3, 5, (l) => {
    const real = ri(20, 80), e = ri(3, 15), shown = real + e;
    const html = G.protractor(shown).replace("</svg>", `<g class="ar-bounce"><rect x="250" y="10" width="100" height="36" rx="12" fill="${CORAL}"/>${text(300, 28, "+" + e + "° hata", { size: 15, fill: "#fff", halo: false })}</g></svg>`);
    const askComp = l >= 4 && rnd() < .5;
    return askComp ? N(`Bozuk iletki dar açıları ${e}° fazla gösteriyor ve ${shown}° okunuyor. Gerçek açının tümleri kaç derece?`, 90 - real, `Gerçek açı ${shown} − ${e} = ${real}. Tümleri 90 − ${real} = ${90 - real}.`, html, { unit: "°" })
      : N(`Bozuk iletki dar açıları ${e}° fazla gösteriyor. Ekranda ${shown}° varsa gerçek açı kaç derece?`, real, `${shown} − ${e} = ${real}.`, html, { unit: "°" });
  });
  add("olcme", 3, 5, (l) => {
    const a = ri(40, 110), b = ri(40, 100), c = ri(40, Math.max(41, 300 - a - b)), d = 360 - a - b - c;
    if (d < 25) return null;
    const cx = 180, cy = 120;
    const s = fan(cx, cy, [0, a, a + b, a + b + c].map((deg, i) => ({ deg, len: 105, color: [INK, CORAL, BLUE, TEAL][i] })),
      [{ a0: 0, a1: a, fill: LIGHT.gold, t: a + "°", r: 45, tr: 70 }, { a0: a, a1: a + b, fill: LIGHT.blue, t: b + "°", r: 45, tr: 70 }, { a0: a + b, a1: a + b + c, fill: LIGHT.teal, t: c + "°", r: 45, tr: 70 }, { a0: a + b + c, a1: 360, fill: LIGHT.coral, t: "?", color: CORAL, size: 24, r: 45, tr: 70 }]);
    return N(`Bir noktanın çevresindeki dört açıdan üçü ${a}°, ${b}° ve ${c}°. Dördüncü açı kaç derece?`, d, `Bir nokta çevresindeki açıların toplamı 360°: 360 − ${a} − ${b} − ${c} = ${d}.`, svg(s), { unit: "°" });
  });

  // 7. Doğruların durumu (kesişen doğrular)
  add("durum", 1, 3, (l) => {
    const a = ri(25, 75), kind = pick(l === 1 ? ["ters", "komşu"] : ["ters", "komşu", "geniş toplam"]);
    const cx = 180, cy = 120;
    let s = line(...P(cx, cy, a, 160), ...P(cx, cy, a + 180, 160), { color: BLUE, w: 5, cls: "ar-draw" }) + line(20, cy, 340, cy, { w: 5, cls: "ar-draw" });
    s += sector(cx, cy, 44, 0, a, LIGHT.gold, "ar-grow") + text(...P(cx, cy, a / 2, 66), a + "°");
    if (kind === "ters") s += sector(cx, cy, 44, 180, 180 + a, LIGHT.teal, "ar-grow") + text(...P(cx, cy, 180 + a / 2, 66), "?", { size: 24, fill: TEAL });
    else if (kind === "komşu") s += sector(cx, cy, 44, a, 180, LIGHT.teal, "ar-grow") + text(...P(cx, cy, (a + 180) / 2, 66), "?", { size: 24, fill: TEAL });
    else s += sector(cx, cy, 44, a, 180, LIGHT.teal, "ar-grow") + sector(cx, cy, 44, 180 + a, 360, LIGHT.teal, "ar-grow") + text(...P(cx, cy, (a + 180) / 2, 66), "?", { size: 22, fill: TEAL }) + text(...P(cx, cy, (a + 540) / 2, 66), "?", { size: 22, fill: TEAL });
    s += dot(cx, cy, 6, INK);
    if (kind === "ters") return N(`İki doğru kesişiyor. Bir açı ${a}°. Soru işaretli ters açı kaç derece?`, a, `Ters açılar eşittir: ${a}°.`, svg(s), { unit: "°" });
    if (kind === "komşu") return N(`İki doğru kesişiyor. Bir açı ${a}°. Soru işaretli komşu açı kaç derece?`, 180 - a, `Komşu açılar doğru açı oluşturur: 180 − ${a} = ${180 - a}.`, svg(s), { unit: "°" });
    return N(`İki doğru kesişiyor. Dar açı ${a}°. İki geniş açının toplamı kaç derece?`, 2 * (180 - a), `Geniş açı 180 − ${a} = ${180 - a}; iki tanesi ${2 * (180 - a)}.`, svg(s), { unit: "°" });
  });
  add("durum", 1, 3, (l) => {
    const q = G.generate("durum", rnd, Math.min(3, l), true);
    if (!q || !/kesişim/.test(q.prompt)) return null;
    return N(q.prompt, q.answer, `Kesişim noktalarını tek tek işaretleyerek say: ${q.answer}.`, q.svg, { hint: "Her iki doğrunun buluştuğu noktayı parmağınla işaretle." });
  });
  add("durum", 3, 5, (l) => {
    const a = ri(15, 75), f = 180 - 2 * a;
    let s = line(...P(180, 120, a, 160), ...P(180, 120, a + 180, 160), { color: BLUE, w: 5, cls: "ar-draw" }) + line(20, 120, 340, 120, { w: 5, cls: "ar-draw" });
    s += sector(180, 120, 44, 0, a, LIGHT.gold, "ar-grow") + sector(180, 120, 44, a, 180, LIGHT.teal, "ar-grow") + text(...P(180, 120, a / 2, 66), "?", { size: 20 }) + text(...P(180, 120, (a + 180) / 2, 66), "?", { size: 20, fill: TEAL }) + dot(180, 120, 6, INK);
    const minus = l === 5 && rnd() < .5;
    return minus ? N(`İki doğru kesişiyor. Komşu açıların farkı ${f}°. İki geniş açının toplamından bir dar açı çıkarılırsa kaç derece kalır?`, 2 * (180 - a) - a, `Dar açı (180 − ${f}) ÷ 2 = ${a}, geniş açı ${180 - a}. 2 × ${180 - a} − ${a} = ${2 * (180 - a) - a}.`, svg(s), { unit: "°" })
      : N(`İki doğru kesişiyor. Komşu açıların farkı ${f}°. Geniş açı kaç derece?`, 180 - a, `Komşuların toplamı 180°. Geniş açı (180 + ${f}) ÷ 2 = ${180 - a}.`, svg(s), { unit: "°" });
  });
  add("durum", 3, 5, (l) => {
    const a = ri(20, 70), b = ri(20, 150 - a), c = 180 - a - b;
    const s = fan(180, 125, [0, a, a + b, 180, 180 + a, 180 + a + b].map((deg, i) => ({ deg, len: 120, color: [INK, CORAL, BLUE][i % 3] })),
      [{ a0: 0, a1: a, t: a + "°", fill: LIGHT.gold, r: 46, tr: 74 }, { a0: a, a1: a + b, t: b + "°", fill: LIGHT.blue, r: 46, tr: 74 }, { a0: a + b, a1: 180, t: l >= 4 ? "" : "?", fill: LIGHT.teal, color: TEAL, size: 22, r: 46, tr: 74 }, ...(l >= 4 ? [{ a0: 180 + a + b, a1: 360, t: "?", fill: LIGHT.coral, color: CORAL, size: 22, r: 46, tr: 74 }] : [])]);
    return l >= 4 ? N(`Üç doğru tek noktada kesişiyor. Art arda üç açı ${a}°, ${b}° ve yeşil açı. Kırmızı açı (yeşilin ters açısı) kaç derece?`, c, `Üç açı doğru açı: yeşil = 180 − ${a} − ${b} = ${c}. Ters açılar eşit: ${c}.`, svg(s), { unit: "°" })
      : N(`Üç doğru tek noktada kesişiyor. Art arda üç açı bir doğru açı oluşturuyor; ikisi ${a}° ve ${b}°. Üçüncüsü kaç derece?`, c, `180 − ${a} − ${b} = ${c}.`, svg(s), { unit: "°" });
  });
  add("durum", 4, 5, (l) => {
    const n = ri(5, l === 4 ? 9 : 14);
    let s = "";
    const ang = [10, 75, 130, 160], pts = [[90, 150], [200, 70], [260, 170], [150, 110]];
    ang.forEach((a, i) => { const p = pts[i]; s += line(...P(p[0], p[1], a, 220), ...P(p[0], p[1], a + 180, 220), { color: [CORAL, BLUE, TEAL, GRAPE][i], w: 4, cls: "ar-draw" }); });
    s = `<clipPath id="lgclip"><rect x="0" y="0" width="360" height="200" rx="14"/></clipPath><g clip-path="url(#lgclip)">${s}</g>` + text(180, 222, "Örnek: 4 doğru → 6 kesişim", { size: 15 });
    return N(`${n} doğru çiziliyor. Hiçbir ikisi paralel değil, hiçbir üçü aynı noktadan geçmiyor. Kaç kesişim noktası olur?`, n * (n - 1) / 2, `Her doğru çifti bir kez kesişir: ${n} × ${n - 1} ÷ 2 = ${n * (n - 1) / 2}.`, svg(s), { hint: "Örnekteki gibi her doğru diğer doğruların hepsini bir kez keser." });
  });

  // 8. Tümler, bütünler ve ters açılar
  add("cift", 1, 3, (l) => {
    const comp = rnd() < .5, total = comp ? 90 : 180, x = ri(2, total / 5 - 2) * 5 + (l === 3 ? ri(1, 4) : 0);
    const back = l >= 2 && rnd() < .4;
    let s = sector(120, 200, 70, 0, x, LIGHT.gold, "ar-grow") + sector(120, 200, 70, x, total, LIGHT.teal, "ar-grow");
    s += ray(120, 200, 0, 190) + ray(120, 200, total, total === 90 ? 180 : 110) + ray(120, 200, x, 190, CORAL, 5, "ar-draw");
    if (total === 90) s += G.rightMark(120, 200, 0, 22, "#777");
    s += text(...P(120, 200, x / 2, 96), back ? "?" : x + "°", { size: 20, fill: back ? CORAL : INK }) + text(...P(120, 200, (x + total) / 2, 96), back ? total - x + "°" : "?", { size: back ? 20 : 28, fill: TEAL }) + dot(120, 200, 6, INK);
    const fig = svg(s, total === 90 ? "0 0 360 240" : "-80 0 400 240");
    const name = comp ? "tümleri" : "bütünleri";
    return back ? N(`Bir açının ${name} ${total - x}°. Açının kendisi kaç derece?`, x, `${total} − ${total - x} = ${x}.`, fig, { unit: "°" })
      : N(`Turuncu açı ${x}°. ${comp ? "Tümleri" : "Bütünleri"} kaç derecedir?`, total - x, `${comp ? "Tümler açılar 90°" : "Bütünler açılar 180°"} eder: ${total} − ${x} = ${total - x}.`, fig, { unit: "°" });
  });
  add("cift", 1, 3, (l) => {
    const total = l === 1 ? 90 : pick([90, 180]), a = ri(15, total === 90 ? 35 : 60), b = ri(15, total === 90 ? 35 : 70), c = total - a - b;
    const s = fan(90, 205, [{ deg: 0, len: 170 }, { deg: a, len: 170, color: CORAL }, { deg: a + b, len: 170, color: BLUE }, { deg: total, len: 170 }],
      [{ a0: 0, a1: a, t: a + "°", fill: LIGHT.gold, r: 60, tr: 100 }, { a0: a, a1: a + b, t: b + "°", fill: LIGHT.blue, r: 60, tr: 100 }, { a0: a + b, a1: total, t: "?", fill: LIGHT.teal, color: TEAL, size: 24, r: 60, tr: 100 }], { right: total === 90 ? 0 : undefined });
    return N(`${total === 90 ? "Dik açı" : "Doğru açı"} üç parçaya ayrıldı. İkisi ${a}° ve ${b}°. Üçüncüsü kaç derece?`, c, `${total} − ${a} − ${b} = ${c}.`, svg(s, total === 90 ? "-20 0 380 240" : "-110 0 420 240"), { unit: "°" });
  });
  add("cift", 3, 5, (l) => {
    const comp = rnd() < .5, total = comp ? 90 : 180, d = ri(3, comp ? 20 : 40) * 2, small = (total - d) / 2;
    const askBig = rnd() < .5;
    const s = fan(comp ? 100 : 180, 205, [{ deg: 0, len: 160 }, { deg: small, len: 160, color: CORAL }, { deg: total, len: 160 }],
      [{ a0: 0, a1: small, t: "?", fill: LIGHT.gold, color: CORAL, size: 22, r: 60, tr: 92 }, { a0: small, a1: total, t: "? + " + d + "°", fill: LIGHT.teal, size: 16, r: 60, tr: 100 }], { right: comp ? 0 : undefined });
    return N(`${comp ? "Tümler" : "Bütünler"} iki açıdan biri diğerinden ${d}° büyük. ${askBig ? "Büyük" : "Küçük"} açı kaç derece?`, askBig ? small + d : small, `Küçük açı (${total} − ${d}) ÷ 2 = ${small}.${askBig ? ` Büyük ${small} + ${d} = ${small + d}.` : ""}`, svg(s, comp ? "-20 0 380 240" : "0 0 360 240"), { unit: "°" });
  });
  add("cift", 3, 5, (l) => {
    const comp = rnd() < .5, total = comp ? 90 : 180, k = pick(comp ? [2, 4, 5, 8] : [2, 3, 4, 5, 8, 9]), small = total / (k + 1);
    const askBig = rnd() < .5;
    return N(`${comp ? "Tümler" : "Bütünler"} iki açıdan büyüğü küçüğün ${k} katı. ${askBig ? "Büyük" : "Küçük"} açı kaç derece?`, askBig ? k * small : small, `Toplam ${total} = ${k + 1} eş parça. Bir parça ${small}.${askBig ? ` Büyük ${k} × ${small} = ${k * small}.` : ""}`,
      bars([{ name: "küçük", parts: [{ w: 1, label: "?", fill: LIGHT.gold, stroke: GOLD }] }, { name: "büyük", parts: Array.from({ length: k }, () => ({ w: 1, label: "?", fill: LIGHT.teal, stroke: TEAL })) }], { note: "küçük + büyük = " + total + "°" }), { unit: "°" });
  });
  add("cift", 4, 5, (l) => {
    const x = ri(10, 80), S = (90 - x) + (180 - x);
    return N(`Bir açının bütünleri ile tümlerinin toplamı ${S}°. Açının kendisi kaç derece?`, x, `Bütünler − tümler her zaman 90°. Tümler (${S} − 90) ÷ 2 = ${90 - x}; açı 90 − ${90 - x} = ${x}.`,
      bars([{ name: "tümler", parts: [{ w: 90 - x, label: "?", fill: LIGHT.gold, stroke: GOLD }] }, { name: "bütünler", parts: [{ w: 90 - x, label: "?", fill: LIGHT.gold, stroke: GOLD }, { w: 90, label: "90°", fill: LIGHT.teal, stroke: TEAL }] }], { note: "tümler + bütünler = " + S + "°" }), { unit: "°" });
  });

  // 9. Çokgenler
  const POLY = { 3: "Üçgen", 4: "Dörtgen", 5: "Beşgen", 6: "Altıgen", 7: "Yedigen", 8: "Sekizgen", 9: "Dokuzgen", 10: "Ongen" };
  // Kenar sayısından çokgen adı: 6 → altıgen. 10'dan büyükte "on üçgen" gibi karışık okunmasın diye "13 kenarlı çokgen".
  // Bütün adlar "gen" ile biter; ekler hep "-in" olur.
  const upFirst = (w) => w.charAt(0).toLocaleUpperCase("tr") + w.slice(1);
  const gen = (n, cap) => {
    const w = POLY[n] ? POLY[n].toLocaleLowerCase("tr") : n + " kenarlı çokgen";
    return cap ? upFirst(w) : w;
  };
  // Düzgün çokgen adı: üçgen ve dörtgende özel adlar kullanılır.
  const regular = (n, cap) => {
    const w = n === 3 ? "eşkenar üçgen" : n === 4 ? "kare" : "düzgün " + gen(n);
    return cap ? upFirst(w) : w;
  };
  const regularIn = (n, cap) => regular(n, cap) + (n === 4 ? "nin" : "in");
  add("cokgen", 1, 2, (l) => {
    const n = ri(3, 5 + l * 1);
    if (rnd() < .5) return C("Bu çokgenin adı nedir?", POLY[n], Object.values(POLY).filter((v) => v !== POLY[n]), `${n} kenarlı çokgen ${POLY[n].toLocaleLowerCase("tr")}dir.`, svg(polyFig(n)));
    return N(pick(["Bu çokgenin kaç kenarı var?", "Bu çokgenin kaç köşesi var?", "Bu çokgenin kaç iç açısı var?"]), n, `Kenar, köşe ve iç açı sayıları eşittir: ${n}.`, svg(polyFig(n)));
  });
  add("cokgen", 1, 3, (l) => {
    const n = ri(3, 4 + l * 2), s = ri(2, 5 + 4 * l), back = l >= 2 && rnd() < .5;
    return back ? N(`${regularIn(n, true)} çevresi ${n * s} cm. Bir kenarı kaç cm?`, s, `Düzgün çokgenin kenarları eşit: ${n * s} ÷ ${n} = ${s}.`, svg(polyFig(n, { side: "?" })), { unit: "cm" })
      : N(`${regularIn(n, true)} bir kenarı ${s} cm. Çevresi kaç cm?`, n * s, `${n} × ${s} = ${n * s}.`, svg(polyFig(n, { side: s + " cm" })), { unit: "cm" });
  });
  add("cokgen", 2, 4, (l) => {
    const n = ri(4, 4 + l * 2), tri = rnd() < .5;
    return tri ? N(`${gen(n, true)}, bir köşesinden köşegenlerle üçgenlere ayrıldı. Kaç üçgen oluştu?`, n - 2, `Bir köşeden ${n - 3} köşegen çizilir ve ${n - 2} üçgen oluşur.`, svg(polyFig(n, { diag: l === 2 })))
      : N(`${gen(n, true)}in bir köşesinden kaç köşegen çizilir?`, n - 3, `Kendisine ve iki komşusuna köşegen çizilmez: ${n} − 3 = ${n - 3}.`, svg(polyFig(n, { diag: l === 2 })));
  });
  add("cokgen", 3, 5, (l) => {
    const n = ri(4, 4 + l * 2);
    return N(`${gen(n, true)}in toplam kaç köşegeni vardır?`, n * (n - 3) / 2, `Her köşeden ${n - 3} köşegen; her biri iki kez sayılır: ${n} × ${n - 3} ÷ 2 = ${n * (n - 3) / 2}.`, svg(polyFig(n)));
  });
  add("cokgen", 3, 5, (l) => {
    const n = pick([4, 5, 6]), s = ri(3, 4 + l * 3);
    const A = Array.from({ length: n }, (_, i) => P(115, 120, 180 / n + i * 360 / n, 78)), B = A.map(([x, y]) => [2 * A[0][0] - x + (A[0][0] - A[0][0]), y]);
    // İkinci çokgen, ortak kenara göre yansıtılmış hâli.
    const sx = A[0][0];
    const B2 = A.map(([x, y]) => [2 * sx - x, y]);
    void B;
    let svgS = `<polygon class="ar-pop" points="${A.map((p) => p.join(",")).join(" ")}" fill="#efe9ff" stroke="${GRAPE}" stroke-width="4"/><polygon class="ar-pop" points="${B2.map((p) => p.map(r1).join(",")).join(" ")}" fill="#fff1d6" stroke="${GOLD}" stroke-width="4"/>`;
    svgS += line(A[0][0], A[0][1], A[n - 1][0], A[n - 1][1], { color: CORAL, w: 5, dash: "6 4" });
    return N(`Kenarı ${s} cm olan iki ${regular(n)} bir kenarları ortak olacak şekilde birleştirildi. Dış çevre kaç cm?`, (2 * n - 2) * s, `Ortak kenar dış çevrede yok: ${n} + ${n} − 2 = ${2 * n - 2} kenar. ${2 * n - 2} × ${s} = ${(2 * n - 2) * s}.`, svg(svgS, "0 0 380 240"), { unit: "cm" });
  });
  add("cokgen", 4, 5, (l) => {
    const n = ri(5, l === 4 ? 10 : 14);
    return N(`${gen(n, true)}, bir köşesinden köşegenlerle üçgenlere ayrıldı. Bütün üçgenlerin iç açıları toplamı kaç derece?`, (n - 2) * 180, `${n - 2} üçgen oluşur: ${n - 2} × 180 = ${(n - 2) * 180}.`, svg(polyFig(Math.min(n, 10), { diag: true })), { unit: "°" });
  });

  // 10. Üçgenler
  add("ucgen", 1, 3, (l) => {
    let A = ri(6, 16) * 5, B = ri(6, 16) * 5;
    if (A + B > 160) B = 160 - A;
    if (l === 3) { A += ri(1, 4); B -= ri(1, 3); }
    const Cc = 180 - A - B;
    return N("Üçgenin iç açılarının toplamı 180°. Soru işaretli açı kaç derece?", Cc, `180 − ${A} − ${B} = ${Cc}.`, svg(triFig(A, B, [A + "°", B + "°", "?", INK, INK, TEAL])), { unit: "°" });
  });
  add("ucgen", 1, 2, () => {
    const type = pick(["Dar açılı", "Dik açılı", "Geniş açılı"]);
    let A, B;
    if (type === "Dik açılı") { A = 90; B = ri(25, 65); } else if (type === "Geniş açılı") { A = ri(100, 130); B = ri(20, 170 - A - 15); } else { A = ri(50, 80); B = ri(50, 80); if (180 - A - B >= 90) B = 60; }
    const sw = rnd() < .5; const [x, y] = sw ? [B, A] : [A, B];
    return C("Açılarına göre bu üçgen hangisidir?", type, ["Dar açılı", "Dik açılı", "Geniş açılı"], "En büyük açıya bak: 90°den küçükse dar, 90° ise dik, büyükse geniş açılı.", svg(triFig(x, y, [x + "°", y + "°", 180 - x - y + "°"])));
  });
  add("ucgen", 2, 4, (l) => {
    const base = ri(20, 75), apex = 180 - 2 * base, askBase = rnd() < .5;
    return askBase ? N(`İkizkenar üçgenin tepe açısı ${apex}°. Taban açılarından biri kaç derece?`, base, `İki taban açısı eşit: (180 − ${apex}) ÷ 2 = ${base}.`, svg(triFig(base, base, ["?", "?", apex + "°", CORAL, CORAL, INK], { ticks: true })), { unit: "°" })
      : N(`İkizkenar üçgenin taban açılarından biri ${base}°. Tepe açısı kaç derece?`, apex, `180 − 2 × ${base} = ${apex}.`, svg(triFig(base, base, [base + "°", "", "?", INK, INK, CORAL], { ticks: true })), { unit: "°" });
  });
  add("ucgen", 3, 5, (l) => {
    let A = ri(25, 70), B = ri(25, 70);
    if (l === 3) return N(`Üçgenin bir iç açısı ${B}°. Bu köşedeki dış açı kaç derece?`, 180 - B, `İç ve dış açı yan yana 180°: 180 − ${B} = ${180 - B}.`, svg(triFig(A, B, ["", B + "°", ""], { ext: "?" }), "0 0 420 240"), { unit: "°" });
    return N(`Üçgenin iki iç açısı ${A}° ve ${B}°. Üçüncü köşedeki dış açı kaç derece?`, A + B, `Üçüncü açı ${180 - A - B}°, dış açısı 180 − ${180 - A - B} = ${A + B}. (Dış açı, komşu olmayan iki iç açının toplamıdır.)`, svg(triFig(A, 180 - A - B, [A + "°", "", B + "°"], { ext: "?" }), "0 0 420 240"), { unit: "°" });
  });
  add("ucgen", 1, 3, (l) => {
    const s = ri(3, 8 + 6 * l), eq = l === 1 || rnd() < .5;
    if (eq) return N(`Eşkenar üçgenin bir kenarı ${s} cm. Çevresi kaç cm?`, 3 * s, `Üç kenar eşit: 3 × ${s} = ${3 * s}.`, svg(triFig(60, 60, ["", "", ""], { ticks: true, sides: [s + " cm", "", ""] })), { unit: "cm" });
    const b = ri(3, 2 * s - 1);
    return N(`İkizkenar üçgenin çevresi ${2 * s + b} cm, tabanı ${b} cm. Eş kenarlardan biri kaç cm?`, s, `(${2 * s + b} − ${b}) ÷ 2 = ${s}.`, svg(triFig(65, 65, ["", "", ""], { ticks: true, sides: [b + " cm", "?", "?"] })), { unit: "cm" });
  });
  add("ucgen", 4, 5, (l) => {
    const d = ri(5, 25) * (l === 5 ? 1 : 2), mid = 60, big = mid + d, small = mid - d;
    return N(`Üçgenin açıları küçükten büyüğe her adımda ${d}° artıyor. En büyük açının bütünleri kaç derece?`, 180 - big, `Ortadaki açı 180 ÷ 3 = 60. En büyük 60 + ${d} = ${big}; bütünleri ${180 - big}.`, svg(triFig(small, mid, ["?", "?", "?", TEAL, TEAL, CORAL])), { unit: "°" });
  });

  // 11. Üçgen inşası
  function constructFig(ra, rb, d, lab) {
    // Çemberlerin tamamı çerçeveye sığacak biçimde ölçeklenir.
    const u = Math.min(340 / (ra + d + rb), 112 / Math.max(ra, rb)), cy = 125;
    const A = [180 - (ra + d + rb) * u / 2 + ra * u, cy], B = [A[0] + d * u, cy];
    const a = (ra * ra - rb * rb + d * d) / (2 * d), h = Math.sqrt(Math.max(0, ra * ra - a * a));
    const Pp = [A[0] + a * u, cy - h * u];
    let s = `<circle class="ar-pop" cx="${r1(A[0])}" cy="${cy}" r="${r1(ra * u)}" fill="#2c6bed0d" stroke="${BLUE}" stroke-width="2.5" stroke-dasharray="6 5"/><circle class="ar-pop" cx="${r1(B[0])}" cy="${cy}" r="${r1(rb * u)}" fill="#e25b450d" stroke="${CORAL}" stroke-width="2.5" stroke-dasharray="6 5"/>`;
    s += `<polygon class="ar-pop" points="${A.map(r1).join(",")} ${Pp.map(r1).join(",")} ${B.map(r1).join(",")}" fill="#ffe7a3aa" stroke="${INK}" stroke-width="3.5"/>`;
    s += dot(A[0], cy, 6, BLUE) + dot(B[0], cy, 6, CORAL) + dot(Pp[0], Pp[1], 6, GOLD) + text(A[0] - 8, cy + 20, "A") + text(B[0] + 8, cy + 20, "B") + text(Pp[0], Pp[1] - 18, "P");
    s += text((A[0] + Pp[0]) / 2 - 24, (cy + Pp[1]) / 2, lab[0], { fill: BLUE, size: 16 }) + text((B[0] + Pp[0]) / 2 + 24, (cy + Pp[1]) / 2, lab[1], { fill: CORAL, size: 16 }) + text((A[0] + B[0]) / 2, cy + 20, lab[2], { size: 16 });
    return svg(s, "0 0 360 250");
  }
  add("insa", 1, 3, (l) => {
    let ra = ri(3, 4 + 2 * l), rb = rnd() < .4 ? ra : ri(3, 4 + 2 * l), d = ri(Math.abs(ra - rb) + 1, ra + rb - 1);
    return N(`A ve B merkezli çemberlerin yarıçapları ${ra} cm ve ${rb} cm, AB = ${d} cm. Kesişim noktası P ile APB üçgeninin çevresi kaç cm?`, ra + rb + d, `AP = ${ra}, BP = ${rb} (yarıçaplar), AB = ${d}: ${ra} + ${rb} + ${d} = ${ra + rb + d}.`, constructFig(ra, rb, d, [ra + " cm", rb + " cm", d + " cm"]), { unit: "cm" });
  });
  add("insa", 2, 3, () => {
    const kind = pick(["Eşkenar", "İkizkenar", "Çeşitkenar"]);
    let ra, rb, d;
    if (kind === "Eşkenar") { ra = rb = d = ri(3, 9); }
    else if (kind === "İkizkenar") { ra = rb = ri(4, 9); d = ri(2, 2 * ra - 1); if (d === ra) d += 1; }
    else { ra = ri(3, 6); rb = ra + ri(1, 3); d = ri(rb - ra + 1, ra + rb - 1); while (d === ra || d === rb) d += 1; if (d >= ra + rb) { ra = 4; rb = 5; d = 6; } }
    return C(`Yarıçaplar ${ra} cm ve ${rb} cm, merkezler arası ${d} cm. Oluşan APB üçgeni kenarlarına göre nedir?`, kind, ["Eşkenar", "İkizkenar", "Çeşitkenar"], `Kenarlar ${ra}, ${rb}, ${d}: ${kind === "Eşkenar" ? "üçü eşit" : kind === "İkizkenar" ? "ikisi eşit" : "hepsi farklı"}.`, constructFig(ra, rb, d, [ra + " cm", rb + " cm", d + " cm"]));
  });
  add("insa", 1, 3, (l) => {
    const ok = rnd() < .5, a = ri(3, 6 + l * 2), b = ri(3, 6 + l * 2);
    const c = ok ? ri(Math.abs(a - b) + 1, a + b - 1) : a + b + ri(0, 3);
    const bars3 = shuffle([a, b, c]), unit = 250 / Math.max(...bars3);
    let s = "";
    bars3.forEach((v, i) => { s += `<rect class="ar-grow-x" x="40" y="${40 + i * 60}" width="${r1(v * unit)}" height="22" rx="11" fill="${[CORAL, BLUE, TEAL][i]}"/>` + text(40 + v * unit + 32, 51 + i * 60, v + " cm", { size: 16 }); });
    return C("Bu üç çubukla bir üçgen yapılabilir mi?", ok ? "Evet, yapılabilir" : "Hayır, yapılamaz", ["Evet, yapılabilir", "Hayır, yapılamaz"], `En uzun çubuk, diğer ikisinin toplamından ${ok ? "kısa; üçgen olur" : "kısa değil; uçlar buluşmaz"}.`, svg(s, "0 0 380 220"));
  });
  add("insa", 3, 5, (l) => {
    const r = ri(4, 6 + 3 * l), k = ri(2, 6);
    return N(`Eşkenar üçgen pergelle çiziliyor. Pergel açıklığı ${k} cm artırılınca çevre ${3 * (r + k)} cm oluyor. İlk üçgenin çevresi kaç cm?`, 3 * r, `Yeni kenar ${3 * (r + k)} ÷ 3 = ${r + k}; ilk kenar ${r}; ilk çevre ${3 * r}.`, constructFig(r, r, r, ["?", "?", "?"]), { unit: "cm" });
  });
  add("insa", 4, 5, (l) => {
    const a = ri(4, l === 4 ? 15 : 30), b = a + ri(2, 15);
    return N(`Yarıçapları ${a} cm ve ${b} cm olan iki çember iki noktada kesişecek. Merkezler arası uzaklık kaç farklı tam sayı olabilir?`, 2 * a - 1, `${b} − ${a} < uzaklık < ${a} + ${b}, yani ${b - a + 1} ile ${a + b - 1} arası: ${2 * a - 1} sayı.`, constructFig(a, b, b - a + Math.max(1, Math.round(a)), [a + " cm", b + " cm", "?"]));
  });

  // 12. Doğal sayıları okuma ve yazma
  add("okuma", 1, 3, (l) => {
    const places = 3 + l;
    const n = Number(Array.from({ length: places }, (_, i) => i === 0 ? ri(1, 9) : (rnd() < .25 ? 0 : ri(1, 9))).join(""));
    return N("Abaküsteki sayı kaçtır?", n, `Her çubuktaki boncuklar o basamağın rakamıdır: ${fmt(n)}.`, G.abacus(n, places), { hint: "Soldan sağa her çubuktaki boncukları say." });
  });
  add("okuma", 2, 5, (l) => {
    const groups = l <= 3 ? ["milyonlar", "binler", "birler"] : ["milyarlar", "milyonlar", "binler", "birler"];
    const vals = groups.map((_, i) => i === 0 ? ri(1, l <= 2 ? 9 : 99) : (rnd() < .25 ? ri(0, 9) : ri(1, 999)));
    const n = vals.reduce((acc, v) => acc * 1000 + v, 0);
    return N("Bölükleri verilen sayıyı rakamlarla yaz.", n, `Bölükler üçer basamaklı yazılır: ${vals.map((v, i) => i ? String(v).padStart(3, "0") : v).join(" ")}.`, cards(vals.map((v, i) => ({ t: v, s: groups[i] + " bölüğü" }))), { hint: "Baştaki bölük dışındaki her bölüğü 3 basamakla yaz; eksikleri 0 ile doldur." });
  });
  add("okuma", 1, 3, (l) => {
    const len = 4 + l;
    const digits = Array.from({ length: len }, (_, i) => i === 0 ? ri(1, 9) : (rnd() < .4 ? 0 : ri(1, 9)));
    const n = Number(digits.join(""));
    const wrong = [];
    for (let i = 1; i < digits.length && wrong.length < 3; i++) { const alt = [...digits]; if (alt[i] === alt[i - 1]) continue; [alt[i], alt[i - 1]] = [alt[i - 1], alt[i]]; const v = Number(alt.join("")); if (String(v).length === len && !wrong.includes(fmt(v))) wrong.push(fmt(v)); }
    while (wrong.length < 3) wrong.push(fmt(n + Math.pow(10, wrong.length + 1)));
    return C("Okunuşu verilen sayı hangisidir?", fmt(n), wrong, `“${root.MatGames.sayNumber(n)}” = ${fmt(n)}.`, `<div class="ar-words">🗣️ “${root.MatGames.sayNumber(n)}”</div>`);
  });
  add("okuma", 1, 2, (l) => {
    const n = ri(Math.pow(10, 3 + l), Math.pow(10, 5 + l) - 1), ask = pick(["basamak", "bölük"]);
    const d = String(n).length;
    return ask === "basamak" ? N("Kartlardaki sayı kaç basamaklıdır?", d, `Rakamları say: ${d}.`, G.digitTiles(n, -1)) : N("Kartlardaki sayıda kaç bölük vardır?", Math.ceil(d / 3), `Sağdan üçer ayır: ${fmt(n)} → ${Math.ceil(d / 3)} bölük.`, G.digitTiles(n, -1), { hint: "Sağdan başlayıp üçerli gruplara ayır." });
  });
  add("okuma", 4, 5, (l) => {
    const m = ri(1, 99), t = ri(10, 900), o = ri(0, 999), k = ri(2, 99);
    const n = m * 1e6 + t * 1000 + o;
    return N(`Sayının binler bölüğüne ${k} ekleniyor. Diğer bölükler değişmiyor. Yeni sayı kaçtır?`, n + k * 1000, `${t} + ${k} = ${t + k} → ${m} ${String(t + k).padStart(3, "0")} ${String(o).padStart(3, "0")}.`, cards([{ t: m, s: "milyonlar" }, { t: `${t} <span style="color:${CORAL}">+${k}</span>`, s: "binler", q: true }, { t: o, s: "birler" }]));
  });

  // 13. Basamak değeri
  add("basamak", 1, 3, (l) => {
    const len = 3 + l + ri(0, 1), ds = Array.from({ length: len }, (_, i) => i === 0 ? ri(1, 9) : ri(0, 9));
    let hi = ri(0, len - 1); while (ds[hi] === 0) hi = ri(0, len - 1);
    const n = Number(ds.join("")), place = len - 1 - hi, v = ds[hi] * Math.pow(10, place);
    if (rnd() < .5) return C("Sarı rakam hangi basamakta?", root.MatGames.PLACES[place] + " basamağı", root.MatGames.PLACES.slice(0, Math.min(len + 1, 9)).map((p) => p + " basamağı"), `Sağdan ${place + 1}. basamak: ${root.MatGames.PLACES[place]}.`, G.digitTiles(n, hi));
    return N("Sarı rakamın basamak değeri kaçtır?", v, `${ds[hi]} rakamı ${root.MatGames.PLACES[place]} basamağında: ${ds[hi]} × ${fmt(Math.pow(10, place))} = ${fmt(v)}.`, G.digitTiles(n, hi));
  });
  add("basamak", 1, 2, (l) => {
    const th = ri(l === 1 ? 1 : 2, 9), hu = ri(0, 9), te = ri(0, 9), on = ri(0, 9);
    return N("Bloklar hangi sayıyı gösteriyor?", th * 1000 + hu * 100 + te * 10 + on, `${th} × 1000 + ${hu} × 100 + ${te} × 10 + ${on} = ${fmt(th * 1000 + hu * 100 + te * 10 + on)}.`, blocksFig(th, hu, te, on), { hint: "Her blok türünü ayrı say: binlik küp, yüzlük plaka, onluk çubuk, birlik kare." });
  });
  add("basamak", 2, 5, (l) => {
    const len = 4 + l, ds = Array.from({ length: len }, (_, i) => i === 0 ? ri(1, 8) : ri(0, 8));
    const hi = ri(0, len - 1), place = len - 1 - hi, from = ds[hi], to = ri(from + 1, 9);
    const n = Number(ds.join("")), diff = (to - from) * Math.pow(10, place);
    const tiles = G.digitTiles(n, hi).replace("</svg>", `<g class="ar-bounce">${text(180 - (len * Math.min(46, 330 / len)) / 2 + hi * Math.min(46, 330 / len) + Math.min(46, 330 / len) / 2, 50, from + " → " + to, { size: 20, fill: CORAL })}</g></svg>`);
    return N(`Sarı rakam ${from} yerine ${to} oluyor. Sayı kaç artar?`, diff, `${root.MatGames.PLACES[place]} basamağında ${to - from} artış: ${to - from} × ${fmt(Math.pow(10, place))} = ${fmt(diff)}.`, tiles);
  });
  add("basamak", 2, 3, (l) => {
    const len = 3 + l, ds = Array.from({ length: len }, (_, i) => i === 0 ? ri(1, 9) : ri(0, 9));
    let miss = ri(0, len - 1); while (ds[miss] === 0) miss = ri(0, len - 1);
    const n = Number(ds.join("")), parts = ds.map((d, i) => d * Math.pow(10, len - 1 - i)).map((v, i) => ({ v, i })).filter((p) => p.v > 0 || p.i === miss);
    return N(`${fmt(n)} sayısının çözümlemesinde eksik terim kaçtır?`, ds[miss] * Math.pow(10, len - 1 - miss), `Eksik basamak ${root.MatGames.PLACES[len - 1 - miss]}: ${ds[miss]} × ${fmt(Math.pow(10, len - 1 - miss))} = ${fmt(ds[miss] * Math.pow(10, len - 1 - miss))}.`,
      cards(parts.map((p, k) => ({ t: (k ? "+ " : "") + (p.i === miss ? "?" : fmt(p.v)), q: p.i === miss }))), { hint: "Her rakamı basamak değeriyle yaz." });
  });
  add("basamak", 4, 5, (l) => {
    const len = 4 + l, ds = Array.from({ length: len }, (_, i) => i === 0 ? ri(1, 9) : ri(0, 9));
    let i = ri(0, len - 2), j = ri(i + 1, len - 1); while (ds[i] <= ds[j]) { ds[i] = ri(ds[j] + 1 > 9 ? 9 : ds[j] + 1, 9); if (ds[i] <= ds[j]) ds[j] = ri(0, ds[i] - 1); }
    const n = Number(ds.join("")), alt = [...ds]; [alt[i], alt[j]] = [alt[j], alt[i]];
    const m = Number(alt.join(""));
    const w = Math.min(46, 330 / len), x = (k) => 180 - (len * w) / 2 + k * w + w / 2;
    const tiles = G.digitTiles(n, i).replace("</svg>", `<path d="M${x(i)} 160 Q${(x(i) + x(j)) / 2} 215 ${x(j)} 160" fill="none" stroke="${CORAL}" stroke-width="4" stroke-dasharray="7 5"/>${G.arrowHead(x(j), 160, 70, CORAL)}${G.arrowHead(x(i), 160, 110, CORAL)}<rect x="${r1(x(j) - w / 2 + 2)}" y="80" width="${r1(w - 4)}" height="70" rx="10" fill="none" stroke="${CORAL}" stroke-width="4"/></svg>`);
    return N(`Sarı ve kırmızı çerçeveli rakamlar yer değiştiriyor. Sayı kaç azalır?`, n - m, `Yeni sayı ${fmt(m)}. ${fmt(n)} − ${fmt(m)} = ${fmt(n - m)}.`, tiles, { hint: "Önce yeni sayıyı yaz, sonra farkı bul." });
  });

  // 14. Sıralama ve karşılaştırma
  add("sirala", 1, 5, (l) => {
    const step = pick(l === 1 ? [10, 100] : l === 2 ? [100, 1000, 50] : l === 3 ? [1000, 5000, 250] : [2500, 25000, 125, 750]);
    const start = ri(1, 40) * step * (l >= 3 ? 10 : 1), k = ri(1, 9);
    let s = line(20, 140, 340, 140, { w: 4 }) + G.arrowHead(346, 140, 0) + G.arrowHead(14, 140, 180);
    for (let i = 0; i <= 10; i++) { const x = 30 + i * 30; s += line(x, 128, x, 152, { w: i % 5 === 0 ? 4 : 2 }); if (i === 0 || i === 10) s += text(x, 172, fmt(start + i * step), { size: 12 }); }
    s += `<g class="ar-bounce">${G.arrowHead(30 + k * 30, 120, -90, CORAL, 18)}${line(30 + k * 30, 70, 30 + k * 30, 104, { color: CORAL, w: 5 })}</g>` + text(30 + k * 30, 58, "?", { size: 26, fill: CORAL });
    return N(`Sayı doğrusunda her çentik ${fmt(step)} artıyor. Ok hangi sayıyı gösteriyor?`, start + k * step, `${fmt(start)} + ${k} × ${fmt(step)} = ${fmt(start + k * step)}.`, svg(s));
  });
  add("sirala", 1, 4, (l) => {
    const len = 3 + l, base = ri(Math.pow(10, len - 1), Math.pow(10, len) - 1), nums = new Set([base]);
    while (nums.size < 4) { const d = String(base).split(""); const i = ri(1, len - 1), j = ri(1, len - 1); [d[i], d[j]] = [d[j], d[i]]; if (rnd() < .5) d[i] = String(ri(0, 9)); const v = Number(d.join("")); if (String(v).length === len) nums.add(v); }
    const list = [...nums], big = rnd() < .5, ans = big ? Math.max(...list) : Math.min(...list);
    return C(big ? "Kartlardaki en büyük sayı hangisi?" : "Kartlardaki en küçük sayı hangisi?", fmt(ans), list.filter((v) => v !== ans).map(fmt), `Basamak sayıları eşit; soldan ilk farklı rakama bak: ${fmt(ans)}.`, cards(list.map((v) => ({ t: fmt(v) }))));
  });
  add("sirala", 1, 2, (l) => {
    const a = ri(Math.pow(10, 3 + l), Math.pow(10, 4 + l) - 1);
    let b = a + pick([-1, 1]) * pick([1, 9, 10, 90, 100, 900]); if (b < 0) b = a + 10;
    const sign = a < b ? "<" : ">";
    return C("İki sayının arasına hangi işaret gelir?", sign, ["<", ">", "="], `Soldan ilk farklı basamakta büyük rakamı olan sayı büyüktür: ${fmt(a)} ${sign} ${fmt(b)}.`, cards([{ t: fmt(a) }, { t: "?", q: true }, { t: fmt(b) }]));
  });
  add("sirala", 2, 5, (l) => {
    const a = ri(10, 99) * Math.pow(10, l), gap = ri(3, 8 + 4 * l), b = a + gap;
    let s = line(20, 130, 340, 130, { w: 4 }) + G.arrowHead(346, 130, 0) + G.arrowHead(14, 130, 180);
    s += dot(50, 130, 9, BLUE) + text(50, 160, fmt(a), { size: 15, fill: BLUE }) + dot(310, 130, 9, CORAL) + text(310, 160, fmt(b), { size: 15, fill: CORAL });
    for (let i = 1; i < Math.min(gap, 12); i++) s += dot(50 + i * 260 / Math.min(gap, 12), 130, 4, "#999");
    s += text(180, 90, "arada kaç doğal sayı?", { size: 16, fill: TEAL });
    return N(`${fmt(a)} ile ${fmt(b)} arasında (uçlar hariç) kaç doğal sayı vardır?`, gap - 1, `${fmt(b)} − ${fmt(a)} − 1 = ${gap - 1}.`, svg(s), { hint: "Fark kadar adım vardır; uçlar sayılmayınca 1 eksik kalır." });
  });
  add("sirala", 1, 5, (l) => {
    const k = Math.min(4 + Math.floor(l / 2), 6);
    const ds = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, k);
    const big = rnd() < .5;
    const sorted = [...ds].sort((a, b) => b - a), largest = Number(sorted.join(""));
    const asc = [...ds].sort((a, b) => a - b); if (asc[0] === 0) { const f = asc.findIndex((d) => d > 0); [asc[0], asc[f]] = [asc[f], asc[0]]; }
    const smallest = Number(asc.join(""));
    return N(`Kartlardaki rakamların her birini bir kez kullanarak yazılabilecek en ${big ? "büyük" : "küçük"} ${k} basamaklı sayı kaçtır?`, big ? largest : smallest, big ? `Rakamları büyükten küçüğe diz: ${fmt(largest)}.` : `Küçükten büyüğe diz, ama 0 başa gelemez: ${fmt(smallest)}.`, cards(ds.map((d) => ({ t: d }))), { hint: big ? "En büyük rakamı en sola koy." : "Sıfır en başa yazılamaz." });
  });
  add("sirala", 4, 5, (l) => {
    const base = ri(2, 9) * Math.pow(10, l - 1);
    const list = new Set(); while (list.size < 4) list.add(base + ri(1, 99) * (l === 5 ? 7 : 3));
    const arr = [...list], sorted = [...arr].sort((a, b) => b - a);
    return N("Kartlardaki sayılardan ikinci en büyük ile en küçüğün farkı kaçtır?", sorted[1] - sorted[3], `Büyükten küçüğe: ${sorted.map(fmt).join(" > ")}. ${fmt(sorted[1])} − ${fmt(sorted[3])} = ${fmt(sorted[1] - sorted[3])}.`, cards(arr.map((v) => ({ t: fmt(v) }))));
  });

  // 15. Toplama ve çıkarma
  add("islem", 1, 5, (l) => {
    const mag = Math.pow(10, Math.min(5, 1 + l)), a = ri(mag, mag * 9), b = ri(mag / 10, a - 1), addOp = rnd() < .5;
    return N(addOp ? "Toplama işleminin sonucu kaçtır?" : "Çıkarma işleminin sonucu kaçtır?", addOp ? a + b : a - b, addOp ? `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}. Birlerden başla, eldeyi unutma.` : `${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}. Birlerden başla, gerekirse onluk boz.`, G.column(a, b, addOp ? "+" : "−"));
  });
  add("islem", 2, 4, (l) => {
    const tot = ri(Math.pow(10, l + 1), Math.pow(10, l + 2)), a = ri(Math.floor(tot / 5), Math.floor(tot * 4 / 5)), b = tot - a;
    return N(`Bir şeridin tamamı ${fmt(tot)}. Bir parçası ${fmt(a)}. Diğer parça kaçtır?`, b, `${fmt(tot)} − ${fmt(a)} = ${fmt(b)}.`, bars([{ parts: [{ w: a, label: fmt(a) }, { w: b, label: "?", fill: LIGHT.coral, stroke: CORAL, color: CORAL }] }], { total: fmt(tot) }));
  });
  add("islem", 3, 5, (l) => {
    const small = ri(20, 60 * l), d = ri(10, 40 * l), big = small + d, askBig = rnd() < .5;
    return N(`İki sayının toplamı ${fmt(big + small)}, farkı ${fmt(d)}. ${askBig ? "Büyük" : "Küçük"} sayı kaçtır?`, askBig ? big : small, `Farkı çıkar, ikiye böl: (${fmt(big + small)} − ${fmt(d)}) ÷ 2 = ${fmt(small)}.${askBig ? ` Büyük ${fmt(small)} + ${fmt(d)} = ${fmt(big)}.` : ""}`,
      bars([{ name: "büyük", parts: [{ w: small, label: "?" }, { w: d, label: fmt(d), fill: LIGHT.gold, stroke: GOLD }] }, { name: "küçük", parts: [{ w: small, label: "?" }] }], { note: "büyük + küçük = " + fmt(big + small) }));
  });
  add("islem", 1, 3, (l) => {
    const a = ri(100, 900) * l, b = ri(50, 400) * l, c = ri(10, 90) * l;
    return N(`Kütüphanede ${fmt(a)} kitap vardı. ${fmt(b)} kitap geldi, ${fmt(c)} kitap ödünç verildi. İçeride kaç kitap kaldı?`, a + b - c, `${fmt(a)} + ${fmt(b)} − ${fmt(c)} = ${fmt(a + b - c)}.`, boxes([{ icon: "📚", label: `${fmt(a)} vardı` }, { icon: "📦➕", label: `${fmt(b)} geldi` }, { icon: "🎒➖", label: `${fmt(c)} gitti` }, { icon: "❓", label: "kalan" }]));
  });
  add("islem", 4, 5, (l) => {
    const k = 4, first = ri(10, 50 * l), tot = k * first + 6;
    return N(`Dört ardışık doğal sayının toplamı ${tot}. En büyük sayı kaçtır?`, first + 3, `Sayılar x, x+1, x+2, x+3: 4x + 6 = ${tot}, x = ${first}. En büyük ${first + 3}.`, bars([{ parts: [{ w: 1, label: "x" }, { w: 1, label: "x+1" }, { w: 1, label: "x+2" }, { w: 1, label: "x+3", fill: LIGHT.coral, stroke: CORAL }] }], { total: String(tot) }));
  });

  // 16. Çarpma ve bölme
  add("carpan", 1, 3, (l) => {
    const rows = ri(2, 3 + l * 2), cols = ri(3, 4 + l * 2);
    return N(`${rows} sıra, her sırada ${cols} nokta var. Toplam kaç nokta?`, rows * cols, `${rows} × ${cols} = ${rows * cols}.`, G.dots(rows, cols));
  });
  add("carpan", 1, 3, (l) => {
    const k = ri(2, 3 + l), each = ri(2, 4 + l * 2), total = k * each;
    let s = "";
    for (let i = 0; i < k; i++) s += `<ellipse cx="${r1(180 - (k - 1) * 37 + i * 74)}" cy="200" rx="32" ry="12" fill="#e9e3f8" stroke="${GRAPE}" stroke-width="3"/>`;
    for (let i = 0; i < total; i++) s += dot(40 + (i % 15) * 20, 30 + Math.floor(i / 15) * 22, 7, i % 3 ? CORAL : GOLD);
    return N(`${total} şeker ${k} tabağa eşit paylaştırılıyor. Her tabağa kaç şeker düşer?`, each, `${total} ÷ ${k} = ${each}.`, svg(s, "0 0 360 230"));
  });
  add("carpan", 2, 4, (l) => {
    const b = ri(3, 4 + 2 * l), q = ri(5, 10 * l), r = ri(1, b - 1), what = pick(["bölünen", "kalan"]);
    const n = b * q + r;
    return what === "bölünen" ? N(`Bölen ${b}, bölüm ${q}, kalan ${r}. Bölünen kaçtır?`, n, `Bölünen = bölen × bölüm + kalan = ${b} × ${q} + ${r} = ${n}.`, divisionFig("?", b, q, r))
      : N(`${n} ÷ ${b} işleminde kalan kaçtır?`, r, `${b} × ${q} = ${b * q}; ${n} − ${b * q} = ${r}.`, divisionFig(n, b, "…", "?"));
  });
  add("carpan", 2, 4, (l) => {
    const c = ri(3, 4 + l), n = c * ri(3, 4 + 3 * l) + ri(1, c - 1);
    return N(`${n} öğrenci ${c} kişilik araçlarla taşınacak. En az kaç araç gerekir?`, Math.ceil(n / c), `${n} ÷ ${c} = ${Math.floor(n / c)}, kalan ${n % c}. Kalanlar için bir araç daha: ${Math.ceil(n / c)}.`, boxes([{ icon: "🧒".repeat(Math.min(6, c)), label: `${n} öğrenci` }, { icon: "🚐", label: `${c} kişilik araç` }, { icon: "❓🚐", label: "kaç araç?" }]), { hint: "Kalan öğrenciler de bir araca binmeli." });
  });
  add("carpan", 3, 5, (l) => {
    const a = ri(4, 6 + 4 * l), b = ri(3, 8), c = ri(2, 6 + l);
    return N(`${a} kutunun her birinde ${b} paket, her pakette ${c} kalem var. Toplam kaç kalem?`, a * b * c, `${a} × ${b} × ${c} = ${a * b * c}.`, boxes([{ icon: "📦", label: `${a} kutu` }, { icon: "🎁".repeat(Math.min(b, 5)), label: `kutuda ${b} paket` }, { icon: "✏️".repeat(Math.min(c, 6)), label: `pakette ${c} kalem` }]));
  });
  add("carpan", 4, 5, (l) => {
    const a = ri(6, 15), b = ri(3, 6), n = a * b * ri(3, 4 + l) + ri(1, a * b - 1);
    const boxesN = Math.ceil(n / a), crates = Math.ceil(boxesN / b);
    return N(`${n} ürün, her kutuya ${a} ürün konacak şekilde paketleniyor; kutular da ${b} kutuluk kasalara konuyor. Son kutu ve kasa eksik dolabilir. En az kaç kasa gerekir?`, crates, `Kutu: ${n} ÷ ${a} → ${boxesN} kutu (son kutu eksik). Kasa: ${boxesN} ÷ ${b} → ${crates} kasa.`, boxes([{ icon: "🍎", label: `${n} ürün` }, { icon: "📦", label: `kutuda ${a}` }, { icon: "🧰", label: `kasada ${b} kutu` }]), { hint: "Önce kutu sayısını, sonra kasa sayısını bul; eksik dolan da sayılır." });
  });

  // 17. Problemler
  const ITEMS = [["🍎", "elma", "sepet"], ["🍪", "kurabiye", "kutu"], ["⚽", "top", "file"], ["✏️", "kalem", "kalemlik"], ["🥚", "yumurta", "kasa"]];
  add("problem", 1, 3, (l) => {
    const it = pick(ITEMS), k = ri(2, 3 + l), n = ri(3, 4 + l * 2), gone = ri(1, Math.min(9 * l, k * n - 1));
    const html = `<div class="ar-boxes">${Array.from({ length: k }, (_, i) => `<div class="ar-box" style="--i:${i}"><b>${it[0].repeat(Math.min(n, 10))}</b><small>${n} ${it[1]}</small></div>`).join("")}</div><p class="ar-story">${gone} ${it[1]} gitti 😋</p>`;
    return N(`${k} ${it[2]} var; her birinde ${n} ${it[1]} bulunuyor. ${gone} ${it[1]} gitti. Kaç ${it[1]} kaldı?`, k * n - gone, `${k} × ${n} = ${k * n}; ${k * n} − ${gone} = ${k * n - gone}.`, html);
  });
  add("problem", 1, 3, (l) => {
    const n = ri(10, 20 + 10 * l), p = ri(2, 5 + l) * 5;
    return N(`Geziye ${n} öğrenci katılıyor. Bir bilet ${p} TL. Toplam bilet tutarı kaç TL?`, n * p, `${n} × ${p} = ${n * p}.`, boxes([{ icon: "🧒🧒🧒", label: `${n} öğrenci` }, { icon: "🎫", label: `tanesi ${p} TL` }, { icon: "💰❓", label: "toplam" }]), { unit: "TL" });
  });
  add("problem", 2, 4, (l) => {
    const p = ri(3, 10) * 5, k = ri(3, 6 + l), rest = ri(5, 60), B = p * k + rest;
    return N(`${B} TL ile tanesi ${p} TL olan kitaplardan ${k} tane alınıyor. Kaç TL kalır?`, rest, `${k} × ${p} = ${k * p}; ${B} − ${k * p} = ${rest}.`, boxes([{ icon: "👛", label: `${B} TL` }, { icon: "📕".repeat(Math.min(k, 5)), label: `${k} kitap × ${p} TL` }, { icon: "❓", label: "kalan para" }]), { unit: "TL" });
  });
  add("problem", 2, 4, (l) => {
    const w = ri(2, 2 + l), d = ri(3, 6), p = ri(2, 5 + l) * 5;
    return N(`Bir öğrenci ${w} hafta boyunca haftada ${d} gün, her gün ${p} sayfa okuyor. Toplam kaç sayfa okur?`, w * d * p, `${w} × ${d} × ${p} = ${w * d * p}.`, boxes([{ icon: "🗓️", label: `${w} hafta` }, { icon: "📆", label: `haftada ${d} gün` }, { icon: "📖", label: `günde ${p} sayfa` }]), { unit: "sayfa" });
  });
  add("problem", 4, 5, (l) => {
    const g = ri(8, 15), n = g * ri(4, 6 + l), cap = ri(5, 8), price = ri(4, 8) * 10;
    const adults = n / g, people = n + adults, cars = Math.ceil(people / cap);
    return N(`Geziye ${n} öğrenci gidiyor. Her ${g} öğrenciye bir öğretmen gerekiyor. Her araç ${cap} kişi alıyor ve ${price} TL. En az ulaşım maliyeti kaç TL?`, cars * price, `Öğretmen ${n} ÷ ${g} = ${adults}. Kişi ${people}. Araç ${cars} (${people} ÷ ${cap}, yukarı yuvarla). ${cars} × ${price} = ${cars * price}.`, boxes([{ icon: "🧒", label: `${n} öğrenci` }, { icon: "👩‍🏫", label: `her ${g} öğrenciye 1` }, { icon: "🚐", label: `${cap} kişilik · ${price} TL` }]), { unit: "TL" });
  });
  add("problem", 4, 5, (l) => {
    const fixed = ri(4, 10) * 10, a = ri(8, 15), b = a + ri(2, 6), n = ri(10, 30 + 10 * l);
    const A = fixed + a * n, B = b * n;
    return N(`A planı ${fixed} TL sabit ücret ve ürün başına ${a} TL; B planında sabit ücret yok, ürün başına ${b} TL. ${n} ürün için ucuz olan plan kaç TL tutar?`, Math.min(A, B), `A: ${fixed} + ${a} × ${n} = ${A}. B: ${b} × ${n} = ${B}. Ucuz olan ${Math.min(A, B)}.`, cards([{ t: `A 🅰️`, s: `${fixed} TL + ${a} TL/ürün` }, { t: `B 🅱️`, s: `${b} TL/ürün` }, { t: `🛒 ${n}`, s: "ürün" }]), { unit: "TL" });
  });

  // 18. Çevre
  add("cevre", 1, 3, (l) => {
    const w = ri(3, 6 + 4 * l), h = ri(2, Math.max(3, w - 1));
    if (l >= 2 && rnd() < .4) return N(`Dikdörtgenin çevresi ${2 * (w + h)} cm. Soru işaretli kenar kaç cm?`, h, `Yarım çevre ${w + h}; ${w + h} − ${w} = ${h}.`, svg(G.rectFigure(w, h, { side: "? cm" })), { unit: "cm" });
    return N("Dikdörtgenin çevresi kaç cm?", 2 * (w + h), `2 × (${w} + ${h}) = ${2 * (w + h)}.`, svg(G.rectFigure(w, h)), { unit: "cm" });
  });
  add("cevre", 1, 2, (l) => {
    const s = ri(2, 6 + 4 * l), back = rnd() < .5;
    return back ? N(`Karenin çevresi ${4 * s} cm. Bir kenarı kaç cm?`, s, `${4 * s} ÷ 4 = ${s}.`, svg(G.rectFigure(s, s, { top: "? cm", side: "" })), { unit: "cm" })
      : N("Karenin çevresi kaç cm?", 4 * s, `4 × ${s} = ${4 * s}.`, svg(G.rectFigure(s, s, { top: s + " cm", side: "" })), { unit: "cm" });
  });
  add("cevre", 2, 4, (l) => {
    const w = ri(6, 8 + 5 * l), h = ri(3, w - 2), gate = ri(1, 3);
    let s = G.rectFigure(w, h, { top: w + " m", side: h + " m", fill: "#e3f6d9" });
    const unit = Math.min(240 / w, 150 / h, 30), x = 180 - w * unit / 2, y = 120 + h * unit / 2;
    s += line(x + unit, y, x + unit + gate * unit, y, { color: "#e3f6d9", w: 8 }) + text(x + unit + gate * unit / 2, y + 18, `kapı ${gate} m`, { size: 13, fill: CORAL });
    return N(`Bahçe ${w} m'ye ${h} m. Çitte ${gate} m kapı boşluğu bırakılıyor. Kaç m çit gerekir?`, 2 * (w + h) - gate, `Çevre ${2 * (w + h)}; kapı çıkarılır: ${2 * (w + h)} − ${gate} = ${2 * (w + h) - gate}.`, svg(s), { unit: "m" });
  });
  add("cevre", 3, 5, (l) => {
    const k = ri(2, 2 + l), sd = ri(2, 4 + 3 * l), u = Math.min(300 / k, 70);
    let s = "";
    for (let i = 0; i < k; i++) s += `<rect class="ar-pop" style="animation-delay:${i * 80}ms" x="${r1(180 - k * u / 2 + i * u)}" y="${r1(120 - u / 2)}" width="${r1(u)}" height="${r1(u)}" fill="#dff1ff" stroke="${BLUE}" stroke-width="3"/>`;
    s += text(180 - k * u / 2 + u / 2, 120 - u / 2 - 14, sd + " cm", { fill: BLUE, size: 15 });
    return N(`Kenarı ${sd} cm olan ${k} kare yan yana birleştirildi. Dış çevre kaç cm?`, (2 * k + 2) * sd, `Dış sınırda ${2 * k + 2} kenar var: ${2 * k + 2} × ${sd} = ${(2 * k + 2) * sd}.`, svg(s), { unit: "cm", hint: "Ortak kenarlar dış çevrede yer almaz." });
  });
  add("cevre", 4, 5, (l) => {
    const W = ri(8, 10 + 3 * l), H = ri(6, 8 + 2 * l), w = ri(2, W - 3), h = ri(2, H - 3);
    return N("Kenarları dik açılı bu bahçenin çevresi kaç m?", 2 * (W + H), `Basamaklı kenarlar kaydırılınca ${W} × ${H} dikdörtgen olur: 2 × (${W} + ${H}) = ${2 * (W + H)}.`, lShape(W, H, w, h, { top: W - w + " m", right: H + " m", bottom: W + " m", left: H - h + " m" }), { unit: "m", hint: "Eksik kenarları büyük dikdörtgenin kenarlarından bul." });
  });

  // 19. Alan
  add("alan", 1, 2, (l) => {
    const w = ri(2, 4 + 2 * l), h = ri(2, 3 + l);
    return N("Her kare 1 cm². Boyalı bölgenin alanı kaç cm²?", w * h, `${h} sıra × ${w} kare = ${w * h}.`, svg(G.rectFigure(w, h, { grid: true, labels: false, fill: "#ffe7a3" })), { unit: "cm²" });
  });
  add("alan", 1, 3, (l) => {
    const w = ri(3, 5 + 3 * l), h = ri(2, 3 + 2 * l), back = l >= 2 && rnd() < .4;
    return back ? N(`Dikdörtgenin alanı ${w * h} cm². Soru işaretli kenar kaç cm?`, h, `${w * h} ÷ ${w} = ${h}.`, svg(G.rectFigure(w, h, { side: "? cm", fill: "#ffe7a3" })), { unit: "cm" })
      : N("Dikdörtgenin alanı kaç cm²?", w * h, `${w} × ${h} = ${w * h}.`, svg(G.rectFigure(w, h, { fill: "#ffe7a3" })), { unit: "cm²" });
  });
  add("alan", 2, 4, (l) => {
    const W = ri(6, 8 + 3 * l), H = ri(4, 5 + 2 * l), s = ri(1, Math.min(W, H) - 2);
    let fig = G.rectFigure(W, H, { top: W + " cm", side: H + " cm", fill: "#ffe7a3" });
    const unit = Math.min(240 / W, 150 / H, 30), x = 180 + W * unit / 2 - s * unit, y = 120 - H * unit / 2;
    fig += `<rect class="ar-pop" x="${r1(x)}" y="${r1(y)}" width="${r1(s * unit)}" height="${r1(s * unit)}" fill="#fff" stroke="${CORAL}" stroke-width="3" stroke-dasharray="6 4"/>` + text(x + s * unit / 2, y + s * unit / 2, s + " cm", { size: 14, fill: CORAL });
    return N(`Dikdörtgenden kenarı ${s} cm olan kare kesildi. Kalan sarı bölgenin alanı kaç cm²?`, W * H - s * s, `${W} × ${H} − ${s} × ${s} = ${W * H} − ${s * s} = ${W * H - s * s}.`, svg(fig), { unit: "cm²" });
  });
  add("alan", 3, 5, (l) => {
    const W = ri(8, 10 + 3 * l), H = ri(6, 8 + 2 * l), w = ri(2, W - 3), h = ri(2, H - 3);
    return N("Bu L biçimli bölgenin alanı kaç m²?", W * H - w * h, `Büyük dikdörtgen ${W} × ${H} = ${W * H}; kesik parça ${w} × ${h} = ${w * h}. ${W * H} − ${w * h} = ${W * H - w * h}.`, lShape(W, H, w, h, { top: W - w + " m", right: H + " m", bottom: W + " m", left: H - h + " m" }), { unit: "m²", hint: "Şekli bir büyük dikdörtgenden eksilen parça olarak düşün." });
  });
  add("alan", 3, 5, (l) => {
    const w = ri(4, 6 + 2 * l), h = ri(3, 4 + l), price = ri(2, 6) * 5;
    return N(`${w} m'ye ${h} m zeminin her m²'si ${price} TL'ye kaplanıyor. Toplam maliyet kaç TL?`, w * h * price, `Alan ${w} × ${h} = ${w * h} m². ${w * h} × ${price} = ${w * h * price}.`, svg(G.rectFigure(w, h, { grid: w <= 12 && h <= 8, top: w + " m", side: h + " m", fill: "#e8dcc6" })), { unit: "TL" });
  });
  add("alan", 4, 5, (l) => {
    const w = ri(5, 8 + 3 * l), h = ri(3, 5 + l), unit = Math.min(200 / (w + 2), 130 / (h + 2));
    const X = 180 - (w + 2) * unit / 2, Y = 120 - (h + 2) * unit / 2;
    let s = `<rect class="ar-pop" x="${r1(X)}" y="${r1(Y)}" width="${r1((w + 2) * unit)}" height="${r1((h + 2) * unit)}" fill="#d9c7a8" stroke="#8a6d1e" stroke-width="3"/><rect class="ar-pop" x="${r1(X + unit)}" y="${r1(Y + unit)}" width="${r1(w * unit)}" height="${r1(h * unit)}" fill="#cfeec6" stroke="${TEAL}" stroke-width="3"/>`;
    s += text(180, 120, `${w} m × ${h} m`, { size: 16, fill: TEAL }) + text(X + (w + 2) * unit + 8, Y + unit / 2, "1 m yol", { size: 13, anchor: "start", fill: "#8a6d1e" });
    return N(`${w} m'ye ${h} m bahçenin dışına her yönde 1 m genişliğinde yol yapılıyor. Yolun alanı kaç m²?`, (w + 2) * (h + 2) - w * h, `Dış dikdörtgen ${w + 2} × ${h + 2} = ${(w + 2) * (h + 2)}; bahçe ${w * h}. Fark ${(w + 2) * (h + 2) - w * h}.`, svg(s, "0 0 380 240"), { unit: "m²" });
  });

  // 20. Alan ve çevre ilişkisi
  add("iliski", 1, 2, (l) => {
    const askArea = rnd() < .5;
    const a = [ri(2, 8), ri(2, 6)], b = rnd() < .25 ? [a[1], a[0]] : [ri(2, 8), ri(2, 6)];
    const val = (r) => askArea ? r[0] * r[1] : 2 * (r[0] + r[1]);
    const box = (r, x, label, color) => { const u = 18; return `<rect class="ar-pop" x="${x}" y="${120 - r[1] * u / 2}" width="${r[0] * u}" height="${r[1] * u}" fill="${color}33" stroke="${color}" stroke-width="3"/>` + text(x + r[0] * u / 2, 120 + r[1] * u / 2 + 18, `${label}: ${r[0]} × ${r[1]}`, { size: 14 }); };
    const ans = val(a) > val(b) ? "A" : val(a) < val(b) ? "B" : "Eşit";
    return C(askArea ? "Hangi dikdörtgenin alanı daha büyük?" : "Hangi dikdörtgenin çevresi daha uzun?", ans, ["A", "B", "Eşit"], `A: ${val(a)}, B: ${val(b)}${askArea ? " cm²" : " cm"}.`, svg(box(a, 20, "A", BLUE) + box(b, 200, "B", CORAL)));
  });
  add("iliski", 1, 3, (l) => {
    const w = ri(3, 5 + 3 * l), h = ri(2, 9);
    return N(`Alanı ${w * h} cm² olan dikdörtgenin bir kenarı ${w} cm. Soru işaretli kenar kaç cm?`, h, `${w * h} ÷ ${w} = ${h}.`, svg(G.rectFigure(w, h, { side: "? cm" })), { unit: "cm" });
  });
  add("iliski", 3, 5, (l) => {
    const s = ri(5, 8 + 4 * l), d = ri(1, s - 2);
    const sq = (x, side, label, color) => `<rect class="ar-pop" x="${x}" y="${r1(120 - side / 2)}" width="${r1(side)}" height="${r1(side)}" fill="${color}33" stroke="${color}" stroke-width="3"/>` + text(x + side / 2, 120 + side / 2 + 18, label, { size: 14 });
    const u = 130 / (s + d);
    const rect = `<rect class="ar-pop" x="190" y="${r1(120 - (s - d) * u / 2)}" width="${r1((s + d) * u)}" height="${r1((s - d) * u)}" fill="${CORAL}33" stroke="${CORAL}" stroke-width="3"/>` + text(190 + (s + d) * u / 2, 120 + (s - d) * u / 2 + 18, `kısa kenar ${s - d} m`, { size: 14 });
    return N(`Çevresi ${4 * s} m olan kare ile aynı çevreli dikdörtgenin kısa kenarı ${s - d} m. Alanlarının farkı kaç m²?`, d * d, `Kare kenarı ${s}, alanı ${s * s}. Dikdörtgen ${s - d} × ${s + d} = ${(s - d) * (s + d)}. Fark ${d * d}.`, svg(sq(20, s * u, `kare · çevre ${4 * s} m`, BLUE) + rect), { unit: "m²" });
  });
  add("iliski", 3, 5, (l) => {
    const sh = ri(3, 6 + 3 * l), d = ri(1, 8), lo = sh + d;
    return N(`Çevresi ${2 * (sh + lo)} cm olan dikdörtgenin uzun kenarı kısa kenarından ${d} cm fazla. Alanı kaç cm²?`, sh * lo, `Yarım çevre ${sh + lo}. Kısa (${sh + lo} − ${d}) ÷ 2 = ${sh}, uzun ${lo}. Alan ${sh * lo}.`, svg(G.rectFigure(lo, sh, { top: `? + ${d} cm`, side: "? cm" })), { unit: "cm²" });
  });
  add("iliski", 3, 4, (l) => {
    const half = ri(6, 8 + 3 * l), count = Math.floor(half / 2);
    let s = "";
    const shown = Math.min(count, 4);
    for (let i = 1; i <= shown; i++) { const w = i, h = half - i, u = Math.min(16, 70 / h); s += `<rect class="ar-pop" style="animation-delay:${i * 100}ms" x="${r1(20 + (i - 1) * 85)}" y="20" width="${r1(w * u)}" height="${r1(h * u)}" fill="#ffe7a3" stroke="${GOLD}" stroke-width="2.5"/>` + text(20 + (i - 1) * 85 + w * u / 2 + 18, 200, `${w}×${h}`, { size: 13 }); }
    return N(`Çevresi ${2 * half} cm, kenarları tam sayı olan kaç farklı dikdörtgen çizilir? (Döndürülmüşler aynı sayılır.)`, count, `Kenarlar toplamı ${half}: 1+${half - 1}, 2+${half - 2}, … ${count} farklı çift.`, svg(s + (count > shown ? text(345, 110, "…", { size: 28 }) : ""), "0 0 360 220"), { hint: "İki kenarın toplamı yarım çevreye eşit; kısa kenarı 1'den başlat." });
  });

  // ---- Ek çeşitlilik kalıpları ----
  add("cember", 1, 2, () => {
    const opts = ["Merkez", "Yarıçap", "Çap", "Çember"], ans = pick(opts);
    const base = `<circle cx="180" cy="120" r="90" fill="#eef6ff" stroke="${ans === "Çember" ? CORAL : "#9fb7d8"}" stroke-width="${ans === "Çember" ? 7 : 3}"/>`;
    const a = ri(0, 359), [x, y] = P(180, 120, a, 90), [x2, y2] = P(180, 120, a + 180, 90);
    const mark = ans === "Merkez" ? dot(180, 120, 10) : ans === "Yarıçap" ? line(180, 120, x, y, { color: CORAL, w: 7, cls: "ar-draw" }) + dot(180, 120, 5, INK) : ans === "Çap" ? line(x2, y2, x, y, { color: CORAL, w: 7, cls: "ar-draw" }) + dot(180, 120, 5, INK) : dot(180, 120, 5, INK);
    return C("Kırmızı ile gösterilen nedir?", ans, opts, { Merkez: "Çemberin tam ortasındaki nokta merkezdir.", Yarıçap: "Merkezi çembere bağlayan parça yarıçaptır.", Çap: "Merkezden geçip iki ucu çemberde olan parça çaptır.", Çember: "Merkezden eşit uzaklıktaki noktaların oluşturduğu kapalı çizgi çemberdir." }[ans], svg(base + mark));
  });
  add("cember", 1, 3, (l) => {
    const r = ri(2, 6 + 4 * l), askD = rnd() < .5;
    let s = circleFig({ cx: 200, cy: 140, R: 80, fill: "#f5f9ff" });
    s += line(200, 140, 254, 30, { color: "#6b7280", w: 6 }) + line(254, 30, 280, 140, { color: "#6b7280", w: 6 }) + dot(254, 30, 8, GOLD) + line(200, 140, 280, 140, { color: CORAL, w: 4, dash: "6 4" }) + text(240, 160, r + " cm", { fill: CORAL, size: 16 });
    return N(askD ? `Pergel açıklığı ${r} cm. Çizilen çemberin çapı kaç cm?` : `Pergel açıklığı ${r} cm. Çizilen çemberin yarıçapı kaç cm?`, askD ? 2 * r : r, askD ? `Pergel açıklığı yarıçaptır; çap 2 × ${r} = ${2 * r}.` : `Pergel açıklığı yarıçaptır: ${r}.`, svg(s), { unit: "cm" });
  });
  add("olcme", 1, 2, (l) => {
    const k = pick([2, 3, 4, 5, 6, 8, 9, 10, 12]);
    const rays = Array.from({ length: k }, (_, i) => ({ deg: i * 360 / k, len: 100, color: i ? INK : CORAL }));
    const secs = Array.from({ length: k }, (_, i) => ({ a0: i * 360 / k, a1: (i + 1) * 360 / k, r: 62, fill: i % 2 ? LIGHT.teal : LIGHT.gold, t: i === 0 ? "?" : undefined, color: CORAL, size: 22, tr: 80 }));
    return N(`Bir tam dönüş ${k} eş parçaya ayrıldı. Bir parça kaç derece?`, 360 / k, `Tam dönüş 360°: 360 ÷ ${k} = ${360 / k}.`, svg(fan(180, 120, rays, secs)), { unit: "°" });
  });
  add("olcme", 2, 4, (l) => {
    const a = (l === 2 ? ri(1, 8) * 10 : ri(2, 16) * 5), b = a + (l === 2 ? ri(3, 9) * 10 : ri(6, 30) * 5);
    if (b >= 180) return null;
    const html = G.protractor(b).replace("</svg>", `${ray(180, 205, a, 155, BLUE, 5, "ar-draw")}${sector(180, 205, 60, a, b, "#6b4fd855", "ar-grow")}${text(...P(180, 205, (a + b) / 2, 80), "?", { size: 22, fill: GRAPE })}</svg>`);
    return N("İletkiye göre mavi ve kırmızı ışın arasındaki açı kaç derece?", b - a, `Mavi ${a}°, kırmızı ${b}° okunuyor: ${b} − ${a} = ${b - a}.`, html, { unit: "°", hint: "İki ışının okumasını bul, büyükten küçüğü çıkar." });
  });
  add("cokgen", 1, 3, (l) => {
    const n1 = ri(3, 6 + l), n2 = ri(3, 6 + l), k = ri(1, 3);
    let s = polyFig(n1, { cx: 95, cy: 115, R: 70 }) + polyFig(n2, { cx: 265, cy: 115, R: 70, fill: "#fff1d6" });
    s += text(95, 215, `${k} tane`, { size: 15, fill: GRAPE }) + text(265, 215, "1 tane", { size: 15, fill: "#a07a00" });
    return N(`Mor çokgenden ${k} tane, sarı çokgenden 1 tane var. Toplam kaç kenar vardır?`, k * n1 + n2, `Mor: ${n1} kenar × ${k} = ${k * n1}; sarı: ${n2}. Toplam ${k * n1 + n2}.`, svg(s, "0 0 360 230"));
  });
  add("cokgen", 3, 5, (l) => {
    const n = ri(4, 6 + l), m = n + ri(1, 4), s = ri(3, 4 + 3 * l);
    return N(`${regularIn(n, true)} çevresi ${n * s} cm. Kenar uzunluğu aynı olan ${regularIn(m)} çevresi kaç cm?`, m * s, `Bir kenar ${n * s} ÷ ${n} = ${s}. ${m} × ${s} = ${m * s}.`, svg(polyFig(n, { cx: 95, R: 72, side: "?" }) + polyFig(Math.min(m, 12), { cx: 265, R: 72, fill: "#fff1d6" }), "0 0 360 240"), { unit: "cm" });
  });
  add("carpan", 1, 2, (l) => {
    const k = ri(2, 4 + l), n = ri(2, 5 + l), it = pick([["🍎", "elma", "tabak"], ["⚽", "top", "file"], ["🖍️", "boya", "kutu"], ["🧁", "kek", "tepsi"]]);
    return N(`${k} ${it[2]} var, her birinde ${n} ${it[1]}. Toplam kaç ${it[1]}?`, k * n, `${k} × ${n} = ${k * n}.`, `<div class="ar-boxes">${Array.from({ length: k }, (_, i) => `<div class="ar-box" style="--i:${i}"><b>${it[0].repeat(n)}</b><small>${n} ${it[1]}</small></div>`).join("")}</div>`);
  });
  add("carpan", 1, 3, (l) => {
    const p = ri(2, 6 + l * 2), cnt = ri(3, 6 + 2 * l), extra = ri(0, p - 1), money = p * cnt + extra;
    return N(`${money} TL ile tanesi ${p} TL olan oyuncaklardan en çok kaç tane alınır?`, cnt, `${money} ÷ ${p} = ${cnt}${extra ? `, kalan ${extra} TL yetmez` : ""}.`, boxes([{ icon: "👛", label: `${money} TL` }, { icon: "🧸", label: `tanesi ${p} TL` }, { icon: "❓", label: "kaç tane?" }]));
  });
  add("cevre", 1, 3, (l) => {
    const n = ri(3, 5), sides = Array.from({ length: n }, () => ri(2, 6 + 4 * l));
    const pts = Array.from({ length: n }, (_, i) => P(180, 120, 90 + i * 360 / n + ri(-12, 12), 85 + ri(-12, 12)));
    let s = `<polygon class="ar-pop" points="${pts.map((p) => p.map(r1).join(",")).join(" ")}" fill="#e3f6ef" stroke="${TEAL}" stroke-width="4" stroke-linejoin="round"/>`;
    pts.forEach((p, i) => { const q = pts[(i + 1) % n], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], d = [m[0] - 180, m[1] - 120], k = Math.hypot(...d) || 1; s += text(m[0] + d[0] / k * 24, m[1] + d[1] / k * 24, sides[i] + " cm", { size: 15 }); });
    return N("Kenar uzunlukları verilen şeklin çevresi kaç cm?", sum(sides), `Bütün kenarlar toplanır: ${sides.join(" + ")} = ${sum(sides)}.`, svg(s, "0 0 360 240"), { unit: "cm" });
  });
  function polyomino(cols, rows, count) {
    const cells = new Set([`${ri(1, cols - 2)},${ri(1, rows - 2)}`]);
    while (cells.size < count) {
      const [x, y] = pick([...cells]).split(",").map(Number), [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
      if (x + dx >= 0 && y + dy >= 0 && x + dx < cols && y + dy < rows) cells.add(`${x + dx},${y + dy}`);
    }
    return [...cells].map((c) => c.split(",").map(Number));
  }
  function polyFigGrid(cols, rows, cells, fill) {
    const u = Math.min(300 / cols, 200 / rows), x0 = 180 - cols * u / 2, y0 = 115 - rows * u / 2;
    let s = "";
    cells.forEach(([x, y], i) => { s += `<rect class="ar-pop" style="animation-delay:${i * 25}ms" x="${r1(x0 + x * u)}" y="${r1(y0 + y * u)}" width="${r1(u)}" height="${r1(u)}" fill="${fill}"/>`; });
    for (let i = 0; i <= cols; i++) s += line(x0 + i * u, y0, x0 + i * u, y0 + rows * u, { color: "#c9c9c9", w: 1.2 });
    for (let j = 0; j <= rows; j++) s += line(x0, y0 + j * u, x0 + cols * u, y0 + j * u, { color: "#c9c9c9", w: 1.2 });
    return svg(s, "0 0 360 235");
  }
  add("alan", 1, 3, (l) => {
    const cells = polyomino(9, 6, ri(5, 6 + 4 * l));
    return N("Kareli zeminde her kare 1 birimkare. Boyalı şeklin alanı kaç birimkare?", cells.length, `Boyalı kareleri say: ${cells.length}.`, polyFigGrid(9, 6, cells, "#ffcf6e"), { hint: "Kareleri satır satır say, sayılanları aklında işaretle." });
  });
  add("iliski", 1, 2, (l) => {
    const cells = polyomino(9, 6, ri(4, 4 + 3 * l)), set = new Set(cells.map((c) => c.join(",")));
    let per = 0;
    cells.forEach(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { if (!set.has(`${x + dx},${y + dy}`)) per++; }));
    const askArea = rnd() < .4;
    return askArea ? N("Her kare 1 birimkare. Boyalı şeklin alanı kaç birimkare?", cells.length, `Boyalı kareler: ${cells.length}.`, polyFigGrid(9, 6, cells, "#a8d8f0"))
      : N("Her karenin kenarı 1 birim. Boyalı şeklin çevresi kaç birim?", per, `Şeklin dış sınırındaki birim kenarları say: ${per}.`, polyFigGrid(9, 6, cells, "#a8d8f0"), { hint: "Şeklin etrafında parmağınla dolaş, her kare kenarını say." });
  });

  // ---- Kareli zeminde doğrular (çalışma kâğıdı tarzı) ----
  const GRID = { cols: 10, rows: 7, u: 32, x0: 20, y0: 18 };
  const DIRS = [[[1, 0], [0, 1], [1, 1], [1, -1]], [[2, 1], [1, 2], [2, -1], [1, -2]], [[3, 1], [1, 3], [3, -1], [1, -3]]];
  const dirsFor = (l) => l <= 2 ? DIRS[0] : l === 3 ? DIRS[0].concat(DIRS[1]) : DIRS[0].concat(DIRS[1], DIRS[2]);
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0], dotv = (a, b) => a[0] * b[0] + a[1] * b[1];
  const isPar = (a, b) => cross(a, b) === 0, isPerp = (a, b) => dotv(a, b) === 0;
  const perpOf = (v) => [-v[1], v[0]];
  const LINE_NAMES = ["a", "b", "c", "e", "f", "g", "h", "k", "m", "n"];
  function segHit(p1, p2, q1, q2) {
    const o = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
    const on = (a, b, c) => Math.min(a[0], b[0]) <= c[0] && c[0] <= Math.max(a[0], b[0]) && Math.min(a[1], b[1]) <= c[1] && c[1] <= Math.max(a[1], b[1]);
    const d1 = o(q1, q2, p1), d2 = o(q1, q2, p2), d3 = o(p1, p2, q1), d4 = o(p1, p2, q2);
    if (d1 !== d2 && d3 !== d4) return true;
    return (!d1 && on(q1, q2, p1)) || (!d2 && on(q1, q2, p2)) || (!d3 && on(p1, p2, q1)) || (!d4 && on(p1, p2, q2));
  }
  function segDist(c, p, q) {
    const vx = q[0] - p[0], vy = q[1] - p[1], len = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((c[0] - p[0]) * vx + (c[1] - p[1]) * vy) / len));
    return Math.hypot(c[0] - p[0] - t * vx, c[1] - p[1] - t * vy);
  }
  // İstenen yönlerde, birbirine değmeyen doğru parçaları yerleştirir. center verilirse parça o noktadan geçer.
  function placeLines(specs, o = {}) {
    for (let tries = 0; tries < 300; tries++) {
      const out = [];
      let ok = true;
      for (const sp of specs) {
        let placed = null;
        for (let t = 0; t < 120 && !placed; t++) {
          const v = sp.v, k = Math.max(1, Math.round(ri(2, 4) / Math.hypot(v[0], v[1])));
          let p, q;
          if (sp.center) { const h = Math.max(1, Math.round(k / 2) || 1); p = [sp.center[0] - h * v[0], sp.center[1] - h * v[1]]; q = [sp.center[0] + h * v[0], sp.center[1] + h * v[1]]; }
          else { p = [ri(0, GRID.cols), ri(0, GRID.rows)]; q = [p[0] + k * v[0], p[1] + k * v[1]]; }
          if ([p, q].some((z) => z[0] < 0 || z[1] < 0 || z[0] > GRID.cols || z[1] > GRID.rows)) continue;
          const lab = [q[0] + (q[0] >= p[0] ? .45 : -.45), q[1] - .45];
          const clash = out.some((L) => {
            if (!(sp.center && L.center) && segHit(p, q, L.p, L.q)) return true;
            if (isPar(sp.v, L.v) && cross(sp.v, [L.p[0] - p[0], L.p[1] - p[1]]) === 0) return true;
            // Etiket başka doğruya yakın düşerse hangi doğruya ait olduğu karışır.
            return Math.hypot(lab[0] - L.lab[0], lab[1] - L.lab[1]) < 1.1 || segDist(lab, L.p, L.q) < .8 || segDist(L.lab, p, q) < .8;
          }) || (o.point && !sp.center && (segHit(p, q, o.point, o.point) || Math.hypot(lab[0] - o.point[0], lab[1] - o.point[1]) < 1));
          if (!clash) placed = { ...sp, p, q, lab };
        }
        if (!placed) { ok = false; break; }
        out.push(placed);
      }
      if (ok) return out;
    }
    return null;
  }
  function gridFig(lines, point) {
    const X = (x) => GRID.x0 + x * GRID.u, Y = (y) => GRID.y0 + y * GRID.u;
    let s = `<rect x="${X(0)}" y="${Y(0)}" width="${GRID.cols * GRID.u}" height="${GRID.rows * GRID.u}" fill="#fff" stroke="#b9b9b9" stroke-width="2"/>`;
    for (let i = 1; i < GRID.cols; i++) s += line(X(i), Y(0), X(i), Y(GRID.rows), { color: "#d6d6d6", w: 1.2 });
    for (let j = 1; j < GRID.rows; j++) s += line(X(0), Y(j), X(GRID.cols), Y(j), { color: "#d6d6d6", w: 1.2 });
    lines.forEach((L) => {
      const deg = Math.atan2(-(L.q[1] - L.p[1]), L.q[0] - L.p[0]) * 180 / Math.PI, c = L.color || CORAL;
      s += line(X(L.p[0]), Y(L.p[1]), X(L.q[0]), Y(L.q[1]), { color: c, w: 3.5, cls: "ar-draw" }) + G.arrowHead(X(L.q[0]), Y(L.q[1]), deg, c, 12) + G.arrowHead(X(L.p[0]), Y(L.p[1]), deg + 180, c, 12);
      s += text(X(L.lab[0]), Y(L.lab[1]), L.label, { size: 18, fill: c === TEAL ? "#0f6d5a" : INK });
    });
    if (point) s += dot(X(point[0]), Y(point[1]), 7, INK);
    return svg(s, `0 0 ${GRID.cols * GRID.u + 40} ${GRID.rows * GRID.u + 36}`);
  }
  const relWord = (rel) => rel === "par" ? "paralel" : "dik";
  const relOk = (rel, a, b) => rel === "par" ? isPar(a, b) : isPerp(a, b);
  const otherDirs = (l, rel, v) => dirsFor(l).filter((w) => !relOk(rel, v, w) && !(rel === "perp" && isPar(v, w) && rnd() < .5));
  function gridWhich(rel) {
    return (l) => {
      const dirs = dirsFor(l), v = pick(dirs), right = rel === "par" ? v : perpOf(v);
      const names = shuffle(LINE_NAMES).slice(0, l <= 2 ? 3 : 4);
      const wrongDirs = shuffle(otherDirs(l, rel, v));
      if (wrongDirs.length < names.length - 1) return null;
      const specs = [{ v, color: TEAL, label: "d" }, { v: right, label: names[0] }, ...names.slice(1).map((n, i) => ({ v: wrongDirs[i % wrongDirs.length], label: n }))];
      const lines = placeLines([specs[0], ...shuffle(specs.slice(1))]);
      if (!lines) return null;
      return C(`Kareli zemindeki doğrulardan hangisi d doğrusuna ${relWord(rel)}dir?`, names[0], names.slice(1), rel === "par" ? `Paralel doğrular kareli zeminde aynı yönde ilerler: d gibi ${names[0]} da her adımda aynı sayıda kare sağa ve yukarı/aşağı gider.` : `Dik doğrular 90° açı yapar. d'nin adımını (sağa ↔ yukarı) yer değiştirip yönünü çevirince ${names[0]} doğrusunun adımı elde edilir.`, gridFig(lines), { hint: rel === "par" ? "Her doğru için 'kaç kare sağa, kaç kare yukarı' gittiğini say." : "Karelerin köşelerini kullan: dik doğrular kare köşegenleri ya da kenarları gibi 90° yapar." });
    };
  }
  function gridCount(rel) {
    return (l) => {
      const v = pick(dirsFor(l)), n = ri(4, l <= 2 ? 4 : 5), k = ri(1, n - 1);
      const goods = Array.from({ length: k }, () => rel === "par" ? v : perpOf(v)), bads = otherDirs(l, rel, v);
      if (!bads.length) return null;
      const names = shuffle(LINE_NAMES).slice(0, n);
      const lines = placeLines([{ v, color: TEAL, label: "d" }, ...shuffle([...goods, ...Array.from({ length: n - k }, () => pick(bads))]).map((w, i) => ({ v: w, label: names[i] }))]);
      if (!lines) return null;
      const list = lines.slice(1).filter((L) => relOk(rel, v, L.v)).map((L) => L.label);
      return N(`Kareli zemindeki doğrulardan kaç tanesi d doğrusuna ${relWord(rel)}dir?`, list.length, `d'ye ${relWord(rel)} olanlar: ${list.join(", ")}. Toplam ${list.length}.`, gridFig(lines), { hint: "Her doğrunun kareler üzerindeki adımını d'ninkiyle karşılaştır." });
    };
  }
  function gridThrough(rel) {
    return (l) => {
      const v = pick(dirsFor(l)), right = rel === "par" ? v : perpOf(v);
      const P0 = [ri(3, GRID.cols - 3), ri(2, GRID.rows - 2)];
      const wrongs = shuffle(dirsFor(l).filter((w) => !relOk(rel, v, w) && !isPar(w, right))).slice(0, 2);
      if (wrongs.length < 2) return null;
      const opts = shuffle([right, ...wrongs]), labels = ["A", "B", "C"], colors = [CORAL, GRAPE, GOLD];
      const lines = placeLines([{ v, color: TEAL, label: "d" }, ...opts.map((w, i) => ({ v: w, label: labels[i], color: colors[i], center: P0 }))], { point: P0 });
      if (!lines || cross(v, [P0[0] - lines[0].p[0], P0[1] - lines[0].p[1]]) === 0) return null;
      const ans = labels[opts.indexOf(right)];
      return C(`Siyah noktadan d doğrusuna ${relWord(rel)} bir doğru çizilmek isteniyor. Hangi çizim doğrudur?`, ans, labels, `${ans} doğrusu siyah noktadan geçer ve d'ye ${relWord(rel)}dir; diğerleri ${rel === "par" ? "d ile aynı yönde değil" : "d ile 90° yapmıyor"}.`, gridFig(lines, P0), { hint: rel === "par" ? "d'nin kareler üzerindeki adımını siyah noktadan aynen tekrarla." : "d'nin adımını çevir: 'sağa 2, yukarı 1' ise dik adım 'sağa 1, aşağı 2' olur." });
    };
  }
  function gridStatements(l) {
    const base = pick(dirsFor(l)), dirs = shuffle([base, base, perpOf(base), perpOf(base), pick(dirsFor(l).filter((w) => !isPar(w, base) && !isPerp(w, base)))]);
    const names = shuffle(LINE_NAMES).slice(0, 5);
    const lines = placeLines(dirs.map((w, i) => ({ v: w, label: names[i], color: i % 2 ? TEAL : CORAL })));
    if (!lines) return null;
    const truths = [], lies = [];
    for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
      const A = lines[i], B = lines[j];
      (isPar(A.v, B.v) ? truths : lies).push(`${A.label} // ${B.label}`);
      (isPerp(A.v, B.v) ? truths : lies).push(`${A.label} ⊥ ${B.label}`);
    }
    if (!truths.length || lies.length < 3) return null;
    const ans = pick(truths);
    return C("Kareli zemindeki doğrulara göre hangi ifade doğrudur?", ans, shuffle(lies).slice(0, 3), `${ans} doğrudur. // paralel, ⊥ dik demektir; diğer ifadelerdeki doğrular bu ilişkide değildir.`, gridFig(lines), { hint: "Her iki doğrunun kareler üzerindeki adımlarını karşılaştır." });
  }
  function gridRelation(l) {
    const v = pick(dirsFor(l)), kind = pick(["Paralel", "Dik kesişen", "Dik olmadan kesişen"]);
    const w = kind === "Paralel" ? v : kind === "Dik kesişen" ? perpOf(v) : pick(dirsFor(l).filter((z) => !isPar(z, v) && !isPerp(z, v)));
    const lines = placeLines([{ v, label: "a", color: TEAL }, { v: w, label: "b" }]);
    if (!lines) return null;
    return C("a ve b doğruları uzatılırsa birbirine göre durumları nedir?", kind, ["Paralel", "Dik kesişen", "Dik olmadan kesişen"], kind === "Paralel" ? "Aynı yönde ilerliyorlar; uzatılsalar da kesişmezler." : kind === "Dik kesişen" ? "Uzatıldıklarında 90° açıyla kesişirler." : "Yönleri farklı ama aralarındaki açı 90° değil; uzatılınca dik olmadan kesişirler.", gridFig(lines), { hint: "Doğrular yazılı uzunlukta bitmez; iki yönde sonsuza uzanır." });
  }
  add("paralel", 1, 5, gridWhich("par"));
  add("paralel", 2, 5, gridCount("par"));
  add("paralel", 1, 5, gridThrough("par"));
  add("paralel", 3, 5, gridStatements);
  add("dikme", 1, 5, gridWhich("perp"));
  add("dikme", 2, 5, gridCount("perp"));
  add("dikme", 1, 5, gridThrough("perp"));
  add("dikme", 3, 5, gridStatements);
  add("durum", 1, 4, gridRelation);
  add("durum", 3, 5, gridStatements);

  // Keşif: tanıma, yorumlama, tersine düşünme ve hata bulma ayrı kalıplardır.
  // Her kalıp bağımsız kaydedilir; yalnız sayıları değiştirmek çeşitlilik sayılmaz.
  const discover = (topic, makers) => makers.forEach(make => add(topic, 1, 1, make));
  const noteCards = (...items) => cards(items.map(t => ({ t })));
  const ABC = () => shuffle(["A", "B", "C", "D", "K", "L", "M", "N"]).slice(0, 3);
  function basicObject(kind, a, b, reverse = false) {
    const x = reverse ? 290 : 70, end = reverse ? 70 : 290, deg = reverse ? 180 : 0;
    if (kind === "Nokta") return svg(dot(180, 120, 7, CORAL) + text(180, 152, a));
    let s = line(x, 120, end, 120, { color: BLUE });
    if (kind !== "Doğru") s += dot(x, 120, 6, CORAL);
    else s += G.arrowHead(x, 120, deg + 180, BLUE);
    if (kind === "Doğru parçası") s += dot(end, 120, 6, CORAL);
    else s += G.arrowHead(end, 120, deg, BLUE);
    const ax = kind === "Doğru" ? x + (end - x) * .2 : x;
    if (kind === "Doğru") s += dot(ax, 120, 5, INK);
    const bx = x + (end - x) * .62;
    if (kind !== "Doğru parçası") s += dot(bx, 120, 5, INK);
    return svg(s + text(ax, 152, a) + text(kind === "Doğru parçası" ? end : bx, 152, b));
  }
  discover("nokta", [
    () => { const [a,b] = ABC(), kind = pick(["Nokta", "Doğru", "Doğru parçası", "Işın"]); return C("Çizilen geometrik şeklin adı nedir?", kind, ["Nokta", "Doğru", "Doğru parçası", "Işın"], "İki ok doğruyu, bir başlangıç ve bir ok ışını, iki uç doğru parçasını gösterir.", basicObject(kind,a,b,rnd()<.5)); },
    () => { const [a,b] = ABC(); return C("Şekildeki ışının başlangıç noktası hangisidir?",a,[b,"İki nokta da başlangıçtır","Başlangıcı yoktur"],`Işın ${a} noktasından başlar; ok yönünde uzar.`,basicObject("Işın",a,b,rnd()<.5)); },
    () => { const kind=pick(["Doğru","Işın","Doğru parçası"]), n={Doğru:0,Işın:1,"Doğru parçası":2}[kind], [a,b]=ABC(); return N("Şeklin kaç uç noktası vardır?",n,`${kind} için uç noktası sayısı ${n}.`,basicObject(kind,a,b,rnd()<.5)); },
    () => { const [a,b]=ABC(); return C("Bu ışın hangi yönde uzamaya devam eder?",`${a}'dan ${b}'ye`,[`${b}'den ${a}'ya`,"İki yönde de","Hiçbir yönde"],`Başlangıç ${a}; ok ${b} yönünü gösterir.`,basicObject("Işın",a,b,rnd()<.5)); },
    () => { const [a,b]=ABC(); return C(`${a}${b} doğru parçasının diğer adı hangisidir?`,`${b}${a}`,[`${a}${a}`,`${b}${b}`,"Başka adı yoktur"],"Doğru parçasının uçlarını ters sırada yazmak parçayı değiştirmez.",basicObject("Doğru parçası",a,b)); },
    () => { const rows=shuffle([["İki yönde sınırsız uzar.","Doğru"],["Bir başlangıcı vardır, tek yönde uzar.","Işın"],["İki ucu vardır, uzunluğu ölçülebilir.","Doğru parçası"],["Yalnız bir konum belirtir.","Nokta"]]), [desc,ans]=rows[0];return C("Kartta anlatılan kavram hangisidir?",ans,["Doğru","Işın","Doğru parçası","Nokta"],desc,noteCards(desc)); },
    () => { const nm=ABC();return C(`${nm[0]} ile ${nm[2]} arasında hangi nokta vardır?`,nm[1],[nm[0],nm[2],"Hiçbiri"],`Soldan sağa sıra ${nm.join(", ")}.`,segFig(nm,[ri(2,8),ri(2,8)],[])); },
    () => { const [a,b,c]=ABC();return C("Hangi nokta d doğrusunun dışındadır?",c,[a,b,"Üçü de doğrunun üzerindedir"],`${a} ve ${b} doğru üzerinde, ${c} dışındadır.`,svg(line(30,140,330,140)+text(330,165,"d")+dot(90,140)+text(90,165,a)+dot(240,140)+text(240,165,b)+dot(170,65,6,CORAL)+text(170,42,c))); },
    () => { const n=ri(2,6), nm=Array.from({length:n+1},(_,i)=>String.fromCharCode(65+i));return N(`Bir doğru parçası ${n} aralığa ayrıldı. Uçlar dahil kaç nokta işaretlendi?`,n+1,`Aralık sayısından bir fazla nokta: ${n} + 1 = ${n+1}.`,segFig(nm,Array(n).fill(1),[])); },
    () => { const obj=pick([["Gergin ipin iki düğüm arasındaki bölümü","Doğru parçası"],["Bir başlangıçtan tek yönde uzayan lazer modeli","Işın"],["Haritada bir şehrin yerini gösteren işaret","Nokta"]]);return C("Bu model hangi kavrama örnektir?",obj[1],["Doğru","Nokta","Işın","Doğru parçası"],obj[0]+": "+obj[1]+" modeli.",noteCards(obj[0])); },
    () => { const [a,b]=ABC();return C("Şekille ilgili hangi ifade yanlıştır?","İki yönde sonsuza uzar.",[`${a} ve ${b} uç noktalarıdır.`,"Uzunluğu ölçülebilir.","Bir doğru parçasıdır."],"Doğru parçası iki uçla sınırlıdır.",basicObject("Doğru parçası",a,b,rnd()<.5)); }
  ]);
  discover("aci", [
    () => {const a=pick([25,40,65,90,110,145,180]);return C("Boyalı açı hangi türdedir?",a<90?"Dar açı":a===90?"Dik açı":a<180?"Geniş açı":"Doğru açı",["Dar açı","Dik açı","Geniş açı","Doğru açı"],"90° ile 180° sınırlarını kullan.",svg(fan(160,160,[{deg:0},{deg:a}],[{a0:0,a1:a,t:a+"°"}])));},
    () => {const [a,b,c]=ABC();return C(`${a}${b}${c} açısının köşesi hangisidir?`,b,[a,c,"Köşesi yoktur"],"Üç harfle adlandırmada ortadaki harf köşedir.",svg(fan(110,190,[{deg:0,label:a},{deg:65,label:c}],[],{center:b})));},
    () => {const a=ri(2,7)*10;return N(`${a}° açı ${10}° açılırsa kaç derece olur?`,a+10,`${a} + 10 = ${a+10}.`,noteCards(`Başlangıç ${a}°`,"10° daha açılıyor"),{unit:"°"});},
    () => {const a=ri(2,7)*10;return N(`${a}° açı dik açıya ulaşmak için kaç derece açılmalı?`,90-a,`90 − ${a} = ${90-a}.`,noteCards(`${a}° → 90°`),{unit:"°"});},
    () => {const a=ri(2,8)*10,b=a+ri(1,5)*10;return C("Hangi açının açıklığı daha büyüktür?","B",["A","İkisi eşit","Kolların uzunluğu gerekli"],`${b}° > ${a}°.`,svg(fan(65,170,[{deg:0,len:95},{deg:a,len:95}],[{a0:0,a1:a,t:a+"°",tr:48}],{center:"A"})+fan(240,170,[{deg:0,len:75},{deg:b,len:75}],[{a0:0,a1:b,t:b+"°",tr:45}],{center:"B"})));},
    () => C("Bir açının kolları uzatılırsa açı ölçüsü nasıl değişir?","Değişmez",["Artar","Azalır","İki katına çıkar"],"Açıyı kolların uzunluğu değil aralarındaki açıklık belirler.",svg(fan(100,190,[{deg:0,len:200},{deg:55,len:180}],[{a0:0,a1:55,t:"?"}])) )
  ]);
  discover("cember", [
    () => C("Çemberin merkezinden üzerindeki bir noktaya çizilen parça nedir?","Yarıçap",["Çap","Kiriş","Çevre"],"Merkez ile çember üzerindeki nokta arası yarıçaptır.",svg(circleFig({radius:"?"}))),
    () => C("Merkezden geçen, iki ucu çemberde olan parça nedir?","Çap",["Yarıçap","Merkez","Yay"],"Merkezden geçen kiriş çaptır.",svg(circleFig({diameter:"?"}))),
    () => {const r=ri(2,12);return N(`Yarıçap ${r} cm. Aynı çemberin diğer yarıçapı kaç cm?`,r,"Bir çemberin bütün yarıçapları eşittir.",svg(circleFig({radius:r+" cm"})),{unit:"cm"});},
    () => {const r=ri(3,10),d=r-1;return C(`Merkeze ${d} cm uzaklıktaki nokta nerededir?`,"Çemberin içinde",["Çemberin üzerinde","Çemberin dışında","Merkezde"],`${d} < ${r}; uzaklık yarıçaptan küçüktür.`,noteCards(`Yarıçap ${r} cm`,`Noktanın merkeze uzaklığı ${d} cm`));},
    () => {const r=ri(2,10),d=r+ri(1,4);return C(`Merkeze ${d} cm uzaklıktaki nokta nerededir?`,"Çemberin dışında",["Çemberin içinde","Çemberin üzerinde","Merkezde"],`${d} > ${r}; uzaklık yarıçaptan büyüktür.`,noteCards(`Yarıçap ${r} cm`,`Uzaklık ${d} cm`));},
    () => {const r=ri(2,10);return N(`Pergel ${r} cm açıkken çizilen çemberin çapı kaç cm?`,2*r,`Pergel açıklığı yarıçaptır: 2 × ${r} = ${2*r}.`,noteCards(`Pergel açıklığı ${r} cm`),{unit:"cm"});}
  ]);
  discover("dikme", [
    () => C("Birbirine dik iki doğru kaç derecelik açı oluşturur?","90°",["45°","180°","60°"],"Diklik dik açı, yani 90° demektir.",svg(line(60,130,300,130)+line(180,30,180,210)+G.rightMark(180,130,0))),
    () => C("Diklik kontrolü için hangi araç uygundur?","Gönye",["Pergel","Terazi","Saat"],"Gönyenin dik köşesi 90°yi kontrol eder.",noteCards("İki doğrunun dikliğini kontrol et")),
    () => {const n=ri(3,9);return N(`Noktadan doğruya dik uzaklık ${n} cm. En kısa yol kaç cm?`,n,"Bir noktadan doğruya en kısa yol dik doğru parçasıdır.",noteCards(`Dik yol ${n} cm`,`Eğik yol ${n+2} cm`),{unit:"cm"});},
    () => C("Dik kesişen iki doğru toplam kaç dik açı oluşturur?","4",["1","2","3"],"Kesişim çevresindeki dört açı da 90°dir.",svg(line(40,120,320,120)+line(180,20,180,220))),
    () => {const a=pick([35,60,85]);return N(`${a}° açı dik açıdan kaç derece küçüktür?`,90-a,`90 − ${a} = ${90-a}.`,noteCards(`Ölçülen ${a}°`,`Hedef: dik açı`),{unit:"°"});},
    () => C("Hangisi dik doğrular için doğru bir ifadedir?","Kesişmek zorundadırlar.",["Asla kesişmezler.","Her kesişme diktir.","Aralarındaki açı 60°dir."],"Dik doğrular 90° açıyla kesişir.",svg(line(60,180,300,60)+line(120,20,220,220)))
  ]);
  discover("paralel", [
    () => C("Aynı düzlemde hiç kesişmeyen iki doğruya ne denir?","Paralel",["Dik","Kesişen","Çakışık"],"Paralel doğrular aynı düzlemde kesişmez.",svg(line(45,80,315,80,{color:BLUE})+line(45,160,315,160,{color:TEAL}))),
    () => C("Paralel doğruların birbirine dik uzaklıkları nasıldır?","Her yerde aynıdır.",["Giderek artar.","Giderek azalır.","Sıfırdır."],"Paralel doğrular sabit uzaklıkta ilerler.",svg(line(40,70,320,70)+line(40,170,320,170)+line(100,70,100,170,{dash:"5 5"})+line(260,70,260,170,{dash:"5 5"}))),
    () => {const n=ri(2,8);return N(`Paralel iki yolun bir yerdeki dik uzaklığı ${n} m. Başka yerde kaç m olur?`,n,"Paraleller arasındaki dik uzaklık sabittir.",noteCards(`Bir noktada ${n} m`,`Başka noktada ? m`),{unit:"m"});},
    () => C("Paralel iki doğru uzatılırsa ne olur?","Kesişmezler.",["Bir noktada kesişirler.","Dik olurlar.","Tek doğru olurlar."],"Uzunluk paralellik ilişkisini değiştirmez.",noteCards("d // e","İki doğruyu da uzat")),
    () => C("Bir dikdörtgende birbirine paralel kenar çiftlerinin sayısı kaçtır?","2",["1","3","4"],"Karşılıklı iki kenar çifti paraleldir.",svg(G.rectFigure(6,3,{labels:false}))),
    () => C("Paralel iki doğrudan birine dik olan doğru, diğerine nasıldır?","Diktir.",["Paraleldir.","Çakışıktır.","Hiç kesişmez."],"Aynı düzlemde paralellere ortak dik çizilebilir.",svg(line(40,70,320,70)+line(40,170,320,170)+line(180,20,180,220)+G.rightMark(180,70,0)))
  ]);
  discover("olcme", [
    () => C("Açı ölçerken iletkinin merkezi nereye yerleştirilir?","Açının köşesine",["Kolun ucuna","İki kolun ortasına","Herhangi bir noktaya"],"Ölçümün başlangıç noktası açının köşesidir.",noteCards("İletkiyle ölçüme başla")),
    () => C("İletkinin hangi çizgisi açının bir koluyla çakıştırılır?","0° çizgisi",["45° çizgisi","90° çizgisi","Herhangi bir çizgi"],"İlk kol 0° çizgisine yerleştirilir.",noteCards("Merkez köşede","İlk kol nereye?")),
    () => {const a=pick([30,40,50,60,70]);return C(`İletkide ${a} ve ${180-a} okunuyor. Açı dar ise doğru ölçü nedir?`,a+"°",[180-a+"°","90°","180°"],"Dar açının ölçüsü 90°den küçüktür.",noteCards(`İki ölçek: ${a}° / ${180-a}°`));},
    () => {const a=ri(2,7)*10;return N(`İlk kol ${a}°, ikinci kol ${a+30}° çizgisinde. Aradaki açı kaç derece?`,30,`${a+30} − ${a} = 30.`,noteCards(`Başlangıç ${a}°`,`Bitiş ${a+30}°`),{unit:"°"});},
    () => {const a=pick([35,55,75]);return N(`${a}° ölçülen açı 5° küçültülürse kaç derece olur?`,a-5,`${a} − 5 = ${a-5}.`,noteCards(`Ölçüm ${a}°`,`5° küçült`),{unit:"°"});},
    () => C("Bir açının ölçüsü hangi birimle yazılır?","Derece",["Santimetre","Metrekare","Kilogram"],"Açı ölçü birimi derecedir; simgesi °.",noteCards("Açı ölçüsü: 60 ?"))
  ]);
  discover("durum", [
    () => C("İki farklı doğru yalnız bir ortak noktaya sahipse durumları nedir?","Kesişen",["Paralel","Çakışık","Aynı doğru"],"Tek ortak nokta kesişme noktasıdır.",svg(line(30,180,330,50)+line(30,60,330,190))),
    () => C("Bütün noktaları ortak olan iki doğru nasıldır?","Çakışık",["Paralel","Dik","Bir noktada kesişen"],"Çakışık doğrular aynı noktalar kümesidir.",noteCards("d ve e tam üst üste")),
    () => C("Paralel iki doğrunun kaç ortak noktası vardır?","0",["1","2","Sonsuz"],"Paralel doğrular kesişmez.",svg(line(40,75,320,75)+line(40,160,320,160))),
    () => C("İki farklı doğru en fazla kaç noktada kesişebilir?","1",["2","3","4"],"İki ortak nokta olursa doğrular çakışır.",noteCards("d ve e farklı doğrular")),
    () => C("90° ile kesişen iki doğru için hangi ad kullanılır?","Dik doğrular",["Paralel doğrular","Çakışık doğrular","Eğri çizgiler"],"90° dik açıdır.",svg(line(40,120,320,120)+line(180,25,180,215)+G.rightMark(180,120,0))),
    () => C("Üç farklı doğru aynı noktadan geçiyor. Kaç farklı kesişim noktası vardır?","1",["2","3","6"],"Bütün kesişmeler aynı noktadadır; bir kez sayılır.",svg(line(30,120,330,120)+line(60,30,300,210)+line(60,210,300,30)))
  ]);
  discover("cift", [
    () => {const a=ri(2,8)*10;return C(`${a}° ve ${90-a}° açıların ilişkisi nedir?`,"Tümler",["Bütünler","Ters","Eşit olmak zorunda"],"Toplamları 90°dir.",noteCards(`${a}°`,`${90-a}°`));},
    () => {const a=ri(2,7)*10;return C(`${a}° ve ${180-a}° açıların ilişkisi nedir?`,"Bütünler",["Tümler","Dik","Eşit olmak zorunda"],"Toplamları 180°dir.",noteCards(`${a}°`,`${180-a}°`));},
    () => {const a=ri(2,8)*10;return N(`Bir açı ${a}°. Ters açısı kaç derecedir?`,a,"Ters açılar eşittir.",noteCards(`Kesişen iki doğru`,`Açı ${a}° → ters açı ?`),{unit:"°"});},
    () => N("Birbirine eşit iki tümler açıdan biri kaç derecedir?",45,"90 ÷ 2 = 45.",noteCards("İki açı eşit","Toplam 90°"),{unit:"°"}),
    () => N("Birbirine eşit iki bütünler açıdan biri kaç derecedir?",90,"180 ÷ 2 = 90.",noteCards("İki açı eşit","Toplam 180°"),{unit:"°"}),
    () => C("Geniş açının tümleri olabilir mi?","Hayır",["Her zaman","Yalnız 100° ise","Yalnız 120° ise"],"Geniş açı zaten 90°den büyüktür; toplam 90° olamaz.",noteCards("Geniş açı > 90°","Tümler toplamı = 90°"))
  ]);
  discover("cokgen", [
    () => {const n=ri(3,8);return N("Şeklin kaç köşesi vardır?",n,"Her iki ardışık kenarın birleştiği nokta bir köşedir.",svg(polyFig(n)));},
    () => {const n=ri(3,8);return N(`${n} köşeli çokgenin kaç kenarı vardır?`,n,"Çokgende köşe ve kenar sayıları eşittir.",svg(polyFig(n)));},
    () => {const n=pick([3,4,5,6,8]),names={3:"Üçgen",4:"Dörtgen",5:"Beşgen",6:"Altıgen",8:"Sekizgen"};return C("Bu çokgenin adı nedir?",names[n],Object.values(names),"Çokgenler kenar sayılarına göre adlandırılır.",svg(polyFig(n)));},
    () => C("Bir şeklin çokgen olması için hangisi gereklidir?","Kapalı ve doğru parçalarından oluşması",["Bir eğri kenarı olması","Açık olması","Yalnız üç kenarı olması"],"Çokgen kapalı bir şekildir; kenarları doğru parçalarıdır.",noteCards("Çokgenin tanımını tamamla")),
    () => C("Çokgenin komşu olmayan iki köşesini birleştiren parçaya ne denir?","Köşegen",["Kenar","Işın","Yarıçap"],"Köşegen komşu olmayan köşeleri birleştirir.",svg(polyFig(5,{diag:true}))),
    () => C("Bir üçgende neden köşegen yoktur?","Her köşe diğer iki köşeye komşudur.",["Üçgen kapalı değildir.","Kenarları eğridir.","Köşesi yoktur."],"Köşegen için komşu olmayan iki köşe gerekir.",svg(polyFig(3)))
  ]);
  discover("ucgen", [
    () => {const a=ri(3,9);return C("Üç kenarı eşit olan üçgenin adı nedir?","Eşkenar",["İkizkenar (yalnız iki eş kenar)","Çeşitkenar","Dik üçgen olmak zorunda"],"Üç eşit kenar eşkenar üçgeni tanımlar.",svg(triFig(60,60,[],{sides:[a,a,a]})));},
    () => {const a=ri(4,9),b=a+1;return C("Yalnız iki kenarı eşit olan bu üçgenin türü nedir?","İkizkenar",["Eşkenar","Çeşitkenar","Üçgen değildir"],`İki kenar ${a}; üçüncü kenar ${b}.`,noteCards(`Kenarlar: ${a}, ${a}, ${b} cm`));},
    () => {const a=ri(3,8);return C("Üç kenar uzunluğu farklı olan üçgenin türü nedir?","Çeşitkenar",["Eşkenar","İkizkenar","Kare"],"Hiçbir kenar çifti eşit değildir.",noteCards(`${a}, ${a+1}, ${a+2} cm`));},
    () => C("Bir açısı 90° olan üçgenin adı nedir?","Dik üçgen",["Dar açılı üçgen","Geniş açılı üçgen","Eşkenar üçgen"],"Bir dik açı üçgeni dik üçgen yapar.",svg(triFig(90,35,["90°","35°","?"]))),
    () => C("Bir üçgende iki geniş açı bulunabilir mi?","Bulunamaz",["Her zaman","Yalnız eşkenarda","Yalnız ikizkenarda"],"İki geniş açının toplamı 180°yi aşar.",noteCards("İki açı da 90°den büyük")),
    () => N("Eşkenar üçgenin bir iç açısı kaç derecedir?",60,"180 ÷ 3 = 60.",svg(triFig(60,60,["?","?","?"])),{unit:"°"})
  ]);
  discover("insa", [
    () => C("Bir uzunluğu değiştirmeden başka yere taşımak için hangi araç kullanılır?","Pergel",["İletki","Terazi","Saat"],"Pergel açıklığı korunarak uzunluk taşınır.",noteCards("Aynı uzunluğu yeniden işaretle")),
    () => C("Merkezleri farklı, yarıçapları aynı iki çember çizmek için ne korunur?","Pergel açıklığı",["Merkez noktası","Çemberin konumu","Kalemin rengi"],"Pergel açıklığı yarıçaptır.",noteCards("Aynı yarıçap","Farklı merkez")),
    () => {const a=ri(3,10);return N(`İki çemberin yarıçapları ${a} cm. Kesişim P ise ilk merkeze uzaklığı kaç cm?`,a,"P çemberin üzerinde olduğundan merkeze uzaklığı yarıçaptır.",noteCards(`Yarıçap ${a} cm`,`Kesişim P`),{unit:"cm"});},
    () => {const a=ri(3,10);return N(`Uzunluğu ${2*a} cm olan parçanın orta noktası bir uca kaç cm uzaktır?`,a,`${2*a} ÷ 2 = ${a}.`,noteCards(`AB = ${2*a} cm`,`M orta nokta`),{unit:"cm"});},
    () => C("İki çemberin kesişiminden seçilen P hangi koşulu sağlar?","Her iki çemberin de üzerindedir.",["Yalnız ilk çemberdedir.","Her zaman merkezdir.","Çemberlerin dışındadır."],"Ortak nokta iki çembere birden aittir.",noteCards("P, iki çemberin ortak noktası")),
    () => C("Eşkenar üçgen kurarken iki uçtan çizilen çemberlerin yarıçapı ne olmalı?","Başlangıç kenarının uzunluğu",["Kenarın yarısı","Kenarın iki katı","Herhangi bir uzunluk"],"Üç kenarın eşit olması için aynı uzunluk taşınır.",svg(triFig(60,60,[],{sides:["a","a","a"]})))
  ]);
  discover("okuma", [
    () => {const a=ri(1,9),b=ri(1,9);return N(`${a} binlik ve ${b} birlikten oluşan sayı kaçtır?`,a*1000+b,`${a*1000} + ${b} = ${a*1000+b}.`,noteCards(`${a} binlik`,`${b} birlik`));},
    () => {const n=ri(1000,9999);return N(`${fmt(n)} sayısı kaç basamaklıdır?`,4,"Dört rakamdan oluşur.",noteCards(fmt(n)));},
    () => {const a=ri(1,9),b=ri(1,9),n=a*10000+b;return C(`${fmt(n)} sayısının doğru okunuşu hangisidir?`,MatGames.sayNumber(n),[MatGames.sayNumber(a*1000+b),MatGames.sayNumber(a*10000+b*10),MatGames.sayNumber(a*100000+b)],"Her bölüğü kendi değeriyle oku.",noteCards(fmt(n)));},
    () => {const n=ri(10,99)*1000;return N(`${MatGames.sayNumber(n)} sayısını rakamla yaz.`,n,`Rakamla yazılışı ${fmt(n)}.`,noteCards(MatGames.sayNumber(n)));},
    () => {const a=ri(1,9),b=ri(1,9);return N(`Binler bölüğü ${a}, birler bölüğü 0${b}0 olan sayı kaçtır?`,a*1000+b*10,`${a} | 0${b}0 → ${a*1000+b*10}.`,noteCards(`Binler: ${a}`,`Birler: 0${b}0`));},
    () => {const n=ri(1000,9998);return N(`${fmt(n)} sayısından hemen sonra gelen sayı kaçtır?`,n+1,`${n} + 1 = ${n+1}.`,noteCards(`${fmt(n)} → ?`));}
  ]);
  discover("basamak", [
    () => {const a=ri(1,9),b=ri(1,9),n=a*100+b*10;return N(`${n} sayısında onlar basamağındaki rakam kaçtır?`,b,`Sağdan ikinci rakam ${b}.`,noteCards(n));},
    () => {const a=ri(1,9),b=ri(1,9),n=a*1000+b;return N(`${n} sayısında binler basamağının değeri kaçtır?`,a*1000,`${a} × 1000 = ${a*1000}.`,noteCards(n));},
    () => {const a=ri(1,9),b=ri(1,9);return N(`${a*1000} + ? + ${b} = ${a*1000+400+b}. Eksik değer kaçtır?`,400,"Yüzler basamağında 4 yüzlük vardır.",noteCards(`${a*1000} + ? + ${b}`));},
    () => {const a=ri(1,8),n=a*100+ri(1,9);return N(`${n} sayısının yüzler rakamı 1 artırılırsa sayı kaç artar?`,100,"Yüzler rakamının bir artışı 100 ekler.",noteCards(n,"Yüzler rakamı +1"));},
    () => {const a=ri(1,9),n=a*10000+ri(1,9);return N(`${n} sayısında kaç tane sıfır rakamı vardır?`,3,"Binler, yüzler ve onlar basamakları sıfırdır.",noteCards(n));},
    () => {const a=ri(1,9),b=ri(1,9),c=ri(1,9);return N(`${a}${b}${c} sayısının rakamları toplamı kaçtır?`,a+b+c,`${a} + ${b} + ${c} = ${a+b+c}.`,noteCards(`${a}${b}${c}`));}
  ]);
  discover("sirala", [
    () => {const n=ri(100,900);return N(`${n} < ? < ${n+2}. Aradaki doğal sayı kaçtır?`,n+1,"Ardışık üç sayının ortasındaki sayı.",noteCards(`${n} < ? < ${n+2}`));},
    () => {const n=ri(100,900);return C(`${n} ile ${n+ri(1,9)} arasına hangi sembol gelir?`,"<",[">","=","+"],"Soldaki sayı daha küçüktür.",noteCards("Soldaki sayı → sağdaki sayı"));},
    () => {const n=ri(100,900),a=[n,n+1,n+2,n+3];return N("Kartlardaki ikinci en büyük sayı kaçtır?",n+2,`Büyükten küçüğe: ${[...a].reverse().join(", ")}.`,noteCards(...shuffle(a)));},
    () => {const n=ri(10,90)*10+ri(1,4);return N(`${n} en yakın onluğa yuvarlanırsa kaç olur?`,Math.floor(n/10)*10,"Birler 5'ten küçük; alt onluğa yuvarlanır.",noteCards(n));},
    () => {const n=ri(10,90)*10+ri(5,9);return N(`${n} en yakın onluğa yuvarlanırsa kaç olur?`,Math.ceil(n/10)*10,"Birler en az 5; üst onluğa yuvarlanır.",noteCards(n));},
    () => {const a=shuffle([2,4,6,8]).slice(0,3),ans=Number([...a].sort((x,y)=>x-y).join(""));return N("Kartları birer kez kullanarak en küçük üç basamaklı sayıyı yaz.",ans,"Rakamları küçükten büyüğe sırala.",noteCards(...a));}
  ]);
  discover("islem", [
    () => {const a=ri(12,40),b=ri(2,9);return N(`? + ${b} = ${a+b}. Eksik sayı kaçtır?`,a,`${a+b} − ${b} = ${a}.`,noteCards(`? + ${b} = ${a+b}`));},
    () => {const a=ri(20,60),b=ri(2,9);return N(`${a} − ? = ${a-b}. Eksik sayı kaçtır?`,b,`${a} − ${a-b} = ${b}.`,noteCards(`${a} − ? = ${a-b}`));},
    () => {const a=ri(10,80);return N(`${a} + 0 işleminin sonucu kaçtır?`,a,"Sıfır eklemek sayıyı değiştirmez.",noteCards(`${a} + 0`));},
    () => {const a=ri(10,70),b=ri(2,9);return C(`${a} + ${b} ile ${b} + ${a} sonuçları nasıl karşılaştırılır?`,"Eşittir",["İlki büyüktür","İkincisi büyüktür","Karşılaştırılamaz"],"Toplamada terimlerin yer değiştirmesi sonucu değiştirmez.",noteCards(`${a} + ${b}`,`${b} + ${a}`));},
    () => {const a=ri(20,60),b=ri(2,9);return N(`Bir öğrenci ${a} + ${b} = ${a+b+1} yazdı. Doğru sonuç kaçtır?`,a+b,`${a} + ${b} = ${a+b}; yazılan sonuç 1 fazla.`,noteCards(`Kontrol et: ${a} + ${b} = ${a+b+1}`));},
    () => {const a=ri(20,80),b=ri(2,8);return N(`${a} sayısından ${b} geri gidilirse kaç olur?`,a-b,`${a} − ${b} = ${a-b}.`,noteCards(`Başlangıç ${a}`,`${b} adım sola`));}
  ]);
  discover("carpan", [
    () => {const a=ri(3,8),b=ri(2,7);return N(`${a} × ? = ${a*b}. Eksik çarpan kaçtır?`,b,`${a*b} ÷ ${a} = ${b}.`,noteCards(`${a} × ? = ${a*b}`));},
    () => {const a=ri(3,8),b=ri(2,7);return N(`? ÷ ${a} = ${b}. Bölünen kaçtır?`,a*b,`${a} × ${b} = ${a*b}.`,noteCards(`? ÷ ${a} = ${b}`));},
    () => {const a=ri(11,70);return N(`${a} × 1 kaçtır?`,a,"Birle çarpılan sayı değişmez.",noteCards(`${a} × 1`));},
    () => {const a=ri(11,70);return N(`${a} × 0 kaçtır?`,0,"Sıfırla çarpım sıfırdır.",noteCards(`${a} × 0`));},
    () => {const a=ri(2,8),b=ri(3,7);return C(`${Array(b).fill(a).join(" + ")} hangi çarpımla gösterilir?`,`${b} × ${a}`,[`${b} + ${a}`,`${b} × ${a+1}`,`${b-1} × ${a}`],`${a} sayısı ${b} kez toplanmıştır.`,noteCards(...Array(b).fill(a)));},
    () => {const a=ri(2,8),b=ri(2,8);return N(`${a*b} nesne ${b} kişiye eşit paylaştırılıyor. Kişi başına kaç nesne düşer?`,a,`${a*b} ÷ ${b} = ${a}.`,noteCards(`${a*b} nesne`,`${b} kişi`));}
  ]);
  discover("problem", [
    () => {const a=ri(8,20),b=ri(2,7);return N(`${a} kişilik sırada ${b}. olan Ece'nin arkasında kaç kişi var?`,a-b,`${a} − ${b} = ${a-b}.`,noteCards(`Toplam ${a}`,`Ece ${b}. sırada`));},
    () => {const a=ri(12,30),b=ri(2,9);return N(`Bir otobüste ${a} kişi var. ${b} kişi iniyor. Kaç kişi kalır?`,a-b,`${a} − ${b} = ${a-b}.`,noteCards(`Yolcu ${a}`,`İnen ${b}`));},
    () => {const a=ri(2,8),b=ri(3,9);return N(`${a} masanın her birinde ${b} kalem var. Toplam kaç kalem?`,a*b,`${a} × ${b} = ${a*b}.`,noteCards(`${a} masa`,`${b} kalem / masa`));},
    () => {const a=ri(10,25),b=ri(2,8);return N(`Ali'nin ${a}, Ece'nin ${a+b} kitabı var. Ece'nin kaç kitabı fazla?`,b,`${a+b} − ${a} = ${b}.`,noteCards(`Ali ${a}`,`Ece ${a+b}`));},
    () => {const a=ri(2,8),b=ri(3,8);return N(`${a*b} çıkartma, her sayfaya ${b} tane yapıştırılıyor. Kaç sayfa gerekir?`,a,`${a*b} ÷ ${b} = ${a}.`,noteCards(`${a*b} çıkartma`,`${b} / sayfa`));},
    () => {const a=ri(15,40),b=ri(2,9);return N(`Bir kitabın ${a} sayfasından ${b} sayfası okundu. Kaç sayfa kaldı?`,a-b,`${a} − ${b} = ${a-b}.`,noteCards(`Kitap ${a} sayfa`,`Okunan ${b}`));}
  ]);
  discover("cevre", [
    () => {const a=ri(3,12);return N(`Çevresi ${4*a} cm olan karenin bir kenarı kaç cm?`,a,`${4*a} ÷ 4 = ${a}.`,svg(G.rectFigure(4,4,{top:"?",side:"?"})),{unit:"cm"});},
    () => {const a=ri(3,12);return N(`Eşkenar üçgenin bir kenarı ${a} cm. Çevresi kaç cm?`,3*a,`3 × ${a} = ${3*a}.`,svg(triFig(60,60,[],{sides:[a,a,a]})),{unit:"cm"});},
    () => {const a=ri(3,9),b=ri(2,8);return N(`Dikdörtgenin kenarları ${a} ve ${b} cm. Tüm çevreyi bir kez dolaşan kaç cm yürür?`,2*(a+b),`2 × (${a} + ${b}) = ${2*(a+b)}.`,svg(G.rectFigure(a,b)),{unit:"cm"});},
    () => {const a=ri(3,9);return N(`Karenin her kenarı 1 cm uzatılıyor. Çevre kaç cm artar?`,4,"Dört kenarın her birine 1 cm eklenir: 4 cm.",noteCards(`Eski kenar ${a} cm`,`Yeni kenar ${a+1} cm`),{unit:"cm"});},
    () => C("Çevreyi ölçerken hangisi hesaplanır?","Şeklin sınırının toplam uzunluğu",["İçindeki kare sayısı","Köşe sayısı","Yalnız en uzun kenar"],"Çevre bütün kenar uzunluklarının toplamıdır.",svg(polyFig(5))),
    () => {const a=ri(3,8),b=ri(3,8);return N(`Üçgenin kenarları ${a}, ${b}, ${a+b-1} cm. Çevresi kaç cm?`,2*(a+b)-1,`${a} + ${b} + ${a+b-1} = ${2*(a+b)-1}.`,noteCards(`${a} cm`,`${b} cm`,`${a+b-1} cm`),{unit:"cm"});}
  ]);
  discover("alan", [
    () => {const a=ri(2,8);return N(`Bir kenarı ${a} birim olan karenin alanı kaç birimkare?`,a*a,`${a} × ${a} = ${a*a}.`,svg(G.rectFigure(a,a,{grid:true})));},
    () => {const a=ri(2,6),b=ri(3,8);return N(`Alanı ${a*b} cm², bir kenarı ${a} cm. Diğer kenar kaç cm?`,b,`${a*b} ÷ ${a} = ${b}.`,noteCards(`Alan ${a*b} cm²`,`Kenar ${a} cm`),{unit:"cm"});},
    () => {const a=ri(2,5),b=ri(3,7);return N(`${a} sıra, her sırada ${b} birim kare var. Toplam alan kaç birimkare?`,a*b,`${a} × ${b} = ${a*b}.`,svg(G.rectFigure(b,a,{grid:true,labels:false})));},
    () => C("Alan için hangi birim uygundur?","cm²",["cm","kg","saniye"],"Alan birim karelerle ölçülür.",noteCards("Bir yüzeyin kapladığı yer")),
    () => {const a=ri(2,6),b=ri(2,5);return N(`Dikdörtgen ${a} × ${b} birim. Bir tam sıra (${a} kare) eklenirse alan kaç artar?`,a,"Eklenen sıradaki kare sayısı alan artışıdır.",noteCards(`Sıra uzunluğu ${a}`,"1 sıra ekle"));},
    () => {const a=ri(3,7),b=ri(3,6);return N(`${a*b} birimkarelik bölgenin 2 birimkaresi çıkarılıyor. Kalan alan kaç?`,a*b-2,`${a*b} − 2 = ${a*b-2}.`,noteCards(`Alan ${a*b}`,"Çıkarılan 2 birimkare"));}
  ]);
  discover("iliski", [
    () => {const a=ri(2,6);return N(`Bir dikdörtgen ${a} × ${a+2} cm. Çevresi kaç cm?`,4*a+4,`2 × (${a} + ${a+2}) = ${4*a+4}.`,svg(G.rectFigure(a,a+2)),{unit:"cm"});},
    () => {const a=ri(2,6);return N(`Bir dikdörtgen ${a} × ${a+2} cm. Alanı kaç cm²?`,a*(a+2),`${a} × ${a+2} = ${a*(a+2)}.`,svg(G.rectFigure(a,a+2)),{unit:"cm²"});},
    () => C("Alanları eşit iki dikdörtgenin çevreleri için hangisi doğrudur?","Farklı olabilir.",["Mutlaka eşittir.","Mutlaka sıfırdır.","Bilinenden büyük olamaz."],"2×6 ve 3×4 aynı alana sahiptir; çevreleri 16 ve 14'tür.",noteCards("A: 2 × 6","B: 3 × 4")),
    () => {const a=ri(2,6),b=ri(2,5);return N(`${a} × ${b} dikdörtgende yalnız ilk kenar 2 katına çıkıyor. Alan kaç katına çıkar?`,2,"Bir çarpan iki katına çıkarsa çarpım da iki katına çıkar.",noteCards(`${a} × ${b}`,`${2*a} × ${b}`));},
    () => C("Bahçeye çit almak için hangi ölçü gerekir?","Çevre",["Alan","Hacim","Köşe sayısı"],"Çit bahçenin sınırı boyunca yerleştirilir.",noteCards("Bahçenin etrafını çitle kapat")),
    () => C("Bahçeyi çimle kaplamak için hangi ölçü gerekir?","Alan",["Çevre","Kenar sayısı","Açı ölçüsü"],"Çim bahçenin iç yüzeyini kaplar.",noteCards("Bahçenin içini çimle kapla"))
  ]);

  // ---- Usta (6), Efsane (7), Prestij (8) ----
  // Yalnız sınırsız modda açılan üst seviyeler. Usta çok adımlı ve ters yönlü düşünmeyi,
  // Efsane sistemli saymayı ve koşul birleştirmeyi, Prestij ise olimpiyat tarzı sayma,
  // değişmez ve en iyi değer sorularını ister. Bütün cevaplar kodla hesaplanır.
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const comb = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
  const digitSum = (n) => String(n).split("").reduce((a, d) => a + Number(d), 0);
  const sub = (k) => String(k).replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[d]);
  const sup = (k) => String(k).replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);
  // Sayıdan sonra gelen ek, sayının okunuşundaki son kelimeye uyar: 5'ten, 6'ya, 40'ın, 100'ün.
  const NUMW = { 1: "bir", 2: "iki", 3: "üç", 4: "dört", 5: "beş", 6: "altı", 7: "yedi", 8: "sekiz", 9: "dokuz", 10: "on", 20: "yirmi", 30: "otuz", 40: "kırk", 50: "elli", 60: "altmış", 70: "yetmiş", 80: "seksen", 90: "doksan" };
  const lastWord = (n) => { n = Math.abs(n); return !n ? "sıfır" : n % 10 ? NUMW[n % 10] : n % 100 ? NUMW[n % 100] : n % 1000 ? "yüz" : n % 1e6 ? "bin" : n % 1e9 ? "milyon" : "milyar"; };
  function ek(n, kind) {
    const w = lastWord(n), vs = w.match(/[aeıioöuü]/g), v = vs[vs.length - 1], last = w.slice(-1);
    const back = "aıou".includes(v), round = "ouöü".includes(v), endV = "aeıioöuü".includes(last), hard = "çfhkpsşt".includes(last);
    const a2 = back ? "a" : "e", i4 = back ? (round ? "u" : "ı") : (round ? "ü" : "i");
    const s = { e: (endV ? "y" : "") + a2, de: (hard ? "t" : "d") + a2, den: (hard ? "t" : "d") + a2 + "n", in: (endV ? "n" : "") + i4 + "n" }[kind];
    return `${fmt(n)}'${s}`;
  }
  const perms = (arr) => arr.length <= 1 ? [arr] : arr.flatMap((x, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [x, ...p]));
  // Kartlardaki rakamlarla (her biri bir kez) yazılabilen, 0 ile başlamayan farklı sayılar, küçükten büyüğe.
  const cardNumbers = (ds) => [...new Set(perms(ds).filter((p) => p[0] !== 0).map((p) => Number(p.join(""))))].sort((a, b) => a - b);
  const frame = (s, h = 220) => `<clipPath id="lgx"><rect x="0" y="0" width="360" height="${h}" rx="14"/></clipPath><rect x="1" y="1" width="358" height="${h - 2}" rx="14" fill="#fbfaf6" stroke="#e3dccd" stroke-width="2"/><g clip-path="url(#lgx)">${s}</g>`;

  // Doğru üzerinde n nokta, doğru dışında m nokta.
  function pointsFig(n, m) {
    let s = line(20, 170, 340, 170, { w: 4, cls: "ar-draw" });
    for (let i = 0; i < n; i++) s += dot(40 + i * 280 / Math.max(1, n - 1), 170, 7, i % 2 ? BLUE : CORAL);
    const spots = [[70, 60], [150, 38], [235, 72], [305, 42], [110, 110], [275, 115], [190, 105]];
    for (let i = 0; i < m; i++) s += dot(spots[i][0], spots[i][1], 7, GOLD);
    return svg(s, "0 0 360 200");
  }
  // Akrep ile yelkovanı verilen saatte gösteren saat.
  function clockHM(h, m) {
    const cx = 180, cy = 120, R = 100;
    let s = `<circle class="ar-pop" cx="${cx}" cy="${cy}" r="${R}" fill="#fffaf0" stroke="${INK}" stroke-width="5"/>`;
    for (let k = 1; k <= 12; k++) {
      const a = 90 - k * 30, [x1, y1] = P(cx, cy, a, R - 4), [x2, y2] = P(cx, cy, a, R - 14), [tx, ty] = P(cx, cy, a, R - 28);
      s += line(x1, y1, x2, y2, { w: 3 }) + text(tx, ty, k, { size: 15, halo: false });
    }
    s += ray(cx, cy, 90 - (h % 12) * 30 - m / 2, 52, CORAL, 8, "ar-draw") + ray(cx, cy, 90 - m * 6, 80, BLUE, 5, "ar-draw") + dot(cx, cy, 7, INK);
    return svg(s);
  }
  // Kareli ızgara: yollar, kareler ve köşegen soruları için.
  function gridBoard(cols, rows, o = {}) {
    const u = Math.min(280 / cols, 170 / rows), x0 = 180 - cols * u / 2, y0 = 115 - rows * u / 2;
    let s = o.fill ? `<rect class="ar-pop" x="${r1(x0)}" y="${r1(y0)}" width="${r1(cols * u)}" height="${r1(rows * u)}" fill="${o.fill}"/>` : "";
    for (let i = 0; i <= cols; i++) s += line(x0 + i * u, y0, x0 + i * u, y0 + rows * u, { color: o.color || "#7f9cc4", w: 2.5 });
    for (let j = 0; j <= rows; j++) s += line(x0, y0 + j * u, x0 + cols * u, y0 + j * u, { color: o.color || "#7f9cc4", w: 2.5 });
    if (o.diag) s += line(x0, y0 + rows * u, x0 + cols * u, y0, { color: CORAL, w: 4, cls: "ar-draw" });
    if (o.ends) s += dot(x0, y0 + rows * u, 8, CORAL) + text(x0 - 16, y0 + rows * u + 14, "A") + dot(x0 + cols * u, y0, 8, TEAL) + text(x0 + cols * u + 16, y0 - 10, "B");
    if (o.block) {
      const X = x0 + o.block[0] * u, Y = y0 + (rows - o.block[1]) * u;
      s += `<circle cx="${r1(X)}" cy="${r1(Y)}" r="13" fill="#fff"/>` + line(X - 9, Y - 9, X + 9, Y + 9, { color: CORAL, w: 5 }) + line(X - 9, Y + 9, X + 9, Y - 9, { color: CORAL, w: 5 });
    }
    // Çözüm çizimleri: boyalı hücreler (alttan sayılır), vurgulanan kareler ve kavşaklara yazılan sayılar.
    if (o.cells) s = o.cells.map(([c, r]) => `<rect x="${r1(x0 + c * u)}" y="${r1(y0 + (rows - r - 1) * u)}" width="${r1(u)}" height="${r1(u)}" fill="#ffc9bd"/>`).join("") + s;
    if (o.sq) o.sq.forEach((q, i) => { s += `<rect class="ar-pop" style="animation-delay:${i * 120}ms" x="${r1(x0 + q.x * u + 2)}" y="${r1(y0 + (rows - q.y - q.k) * u + 2)}" width="${r1(q.k * u - 4)}" height="${r1(q.k * u - 4)}" fill="${q.color}26" stroke="${q.color}" stroke-width="4" rx="3"/>`; });
    if (o.nums) o.nums.forEach((col, i) => col.forEach((v, j) => {
      if (v === null || v === undefined) return;
      const X = x0 + i * u, Y = y0 + (rows - j) * u, big = String(v).length > 2;
      s += `<circle cx="${r1(X)}" cy="${r1(Y)}" r="${big ? 14 : 11}" fill="${v === 0 ? "#ffe1db" : "#fff"}" stroke="${v === 0 ? CORAL : TEAL}" stroke-width="2"/>` + text(X, Y, v, { size: big ? 10 : 13, fill: v === 0 ? CORAL : "#0f5f4e", halo: false });
    }));
    return svg(s, "0 0 360 240");
  }
  // Çözüm adımları için küçük çizimler.
  // Toplar: her grup bir renk; "take" kadarı dolu (çekilen), kalanı soluk.
  function ballsFig(groups, note) {
    let s = "";
    groups.forEach((g, gi) => {
      const y = 30 + gi * 44;
      s += text(30, y, g.label, { size: 13, anchor: "start", fill: g.color });
      for (let i = 0; i < g.count; i++) s += `<circle cx="${r1(110 + (i % 15) * 16)}" cy="${r1(y + Math.floor(i / 15) * 16)}" r="6.5" fill="${i < g.take ? g.color : "#fff"}" stroke="${g.color}" stroke-width="2" opacity="${i < g.take ? 1 : .45}"/>`;
    });
    if (note) s += text(180, 30 + groups.length * 44 + 4, note, { size: 15, fill: CORAL });
    return svg(s, `0 0 360 ${50 + groups.length * 44}`);
  }
  // Basit tablo (sayma tabloları, basamak tabloları). Son sütun vurgulanır.
  const solTable = (head, rows, foot) => `<table class="sol-table"><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}${foot ? `<tr class="sum">${foot.map((c) => `<td>${c}</td>`).join("")}</tr>` : ""}</table>`;
  // Haftanın günleri şeridi: başlangıç ve sonuç işaretli.
  function weekFig(start, r) {
    const D = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
    let s = "";
    for (let i = 0; i <= 7; i++) {
      const d = (start + i) % 7, x = 22 + i * 42, hit = i === r, first = i === 0;
      s += `<rect x="${x}" y="40" width="36" height="44" rx="8" fill="${first ? LIGHT.blue : hit ? LIGHT.teal : "#fff"}" stroke="${first ? BLUE : hit ? TEAL : "#c9c1b3"}" stroke-width="${first || hit ? 3 : 1.5}"/>` + text(x + 18, 62, D[d], { size: 12, halo: false }) + text(x + 18, 100, "+" + i, { size: 11, fill: "#888", halo: false });
    }
    s += text(180, 22, `7 gün sonra aynı gün gelir; yalnız kalan (${r}) kadar ilerle`, { size: 13, fill: TEAL });
    return svg(s, "0 0 360 115");
  }
  // Robot yolu: her adımda eşit ilerleyip a° sola döner; başlangıç yönüne dönene kadar çizilir.
  function turtleFig(a, steps) {
    let x = 0, y = 0, h = 90; const pts = [[0, 0]];
    for (let i = 0; i < steps; i++) { x += Math.cos(h * Math.PI / 180); y -= Math.sin(h * Math.PI / 180); pts.push([x, y]); h += a; }
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), w = Math.max(...xs) - Math.min(...xs) || 1, hh = Math.max(...ys) - Math.min(...ys) || 1, u = Math.min(300 / w, 180 / hh);
    const M = (p) => [30 + (p[0] - Math.min(...xs)) * u + (300 - w * u) / 2, 20 + (p[1] - Math.min(...ys)) * u + (180 - hh * u) / 2];
    const P2 = pts.map(M);
    return svg(`<polyline class="ar-draw" points="${P2.map((p) => p.map(r1).join(",")).join(" ")}" fill="none" stroke="${BLUE}" stroke-width="3" stroke-linejoin="round"/>` + dot(P2[0][0], P2[0][1], 7, CORAL) + text(P2[0][0], P2[0][1] + 18, "başlangıç", { size: 12, fill: CORAL }), "0 0 360 230");
  }
  // Üçgen ve B, C açıortayları: I noktasında kesişir.
  function bisectFig(labels) {
    const [p, q, r] = G.triangleFromAngles(55, 75), d = (u, v) => Math.hypot(u[0] - v[0], u[1] - v[1]);
    const a = d(q, r), b = d(p, r), c = d(p, q), I = [(a * p[0] + b * q[0] + c * r[0]) / (a + b + c), (a * p[1] + b * q[1] + c * r[1]) / (a + b + c)];
    let s = `<polygon points="${[p, q, r].map((v) => v.map(r1).join(",")).join(" ")}" fill="#fff1d6" stroke="${GOLD}" stroke-width="4"/>`;
    s += line(p[0], p[1], I[0], I[1], { color: BLUE, w: 3 }) + line(q[0], q[1], I[0], I[1], { color: BLUE, w: 3 }) + `<polygon points="${[p, q, I].map((v) => v.map(r1).join(",")).join(" ")}" fill="#2c6bed22"/>` + dot(I[0], I[1], 6, CORAL);
    s += text(I[0], I[1] - 16, "I", { fill: CORAL }) + text(p[0] - 14, p[1] + 12, "B") + text(q[0] + 14, q[1] + 12, "C") + text(r[0], r[1] - 16, "A") + (labels || []).map(([x, y, t, c]) => text(x, y, t, { size: 14, fill: c || INK })).join("");
    return svg(s);
  }
  // Çözüm nesnesi: ana fikir ve adımlar. Adım metin ya da { t, fig } olabilir.
  const SOL = (idea, ...steps) => ({ idea, steps: steps.filter(Boolean).map((x) => typeof x === "string" ? { t: x } : x) });
  // Doğru grupları: paralel aileler, tek noktadan geçenler ve genel konumdakiler.
  function linesFig(groups) {
    const colors = [CORAL, BLUE, TEAL, GRAPE, GOLD, INK];
    const L = (x, y, deg, c) => line(...P(x, y, deg, 420), ...P(x, y, deg + 180, 420), { color: c, w: 3.5, cls: "ar-draw" });
    let s = "", free = 0;
    // Serbest doğrular paralel ailelerden belirgin biçimde farklı doğrultuda çizilir; yoksa paralel sanılır.
    const taken = groups.filter((g) => g.kind === "par").map((g) => g.deg), far = (d) => taken.every((t) => { const x = Math.abs(((d - t) % 180 + 180) % 180); return Math.min(x, 180 - x) >= 22; });
    // Serbest doğrular kullanılabilir doğrultulara eşit aralıkla dağıtılır; birbirine de yakın düşmezler.
    const freeCount = sum(groups.filter((g) => g.kind === "free").map((g) => g.count)), allowed = Array.from({ length: 36 }, (_, i) => 3 + i * 5).filter(far);
    const freeDeg = (i) => allowed[Math.floor((i + .5) * allowed.length / Math.max(1, freeCount))] ?? 12 + i * 37;
    groups.forEach((g, gi) => {
      const c = colors[gi % colors.length];
      for (let k = 0; k < g.count; k++) {
        if (g.kind === "par") s += L(...P(180, 110, g.deg + 90, (k - (g.count - 1) / 2) * 34), g.deg, c);
        else if (g.kind === "con") s += L(g.at[0], g.at[1], g.deg0 + k * 150 / g.count, c);
        else { const d = freeDeg(free); s += L(...P(180, 110, free * 137, 18 + (free * 37) % 60), d, colors[(gi + free + 2) % colors.length]); free++; }
      }
    });
    return svg(frame(s), "0 0 360 220");
  }
  // Tepeden k doğru parçası ve tabana paralel m doğru çizilmiş üçgen.
  function cevianFig(k, m) {
    const A = [180, 22], B = [36, 208], Cc = [324, 208];
    let s = `<polygon class="ar-pop" points="${A.join(",")} ${B.join(",")} ${Cc.join(",")}" fill="#fff1d6" stroke="${GOLD}" stroke-width="4" stroke-linejoin="round"/>`;
    for (let i = 1; i <= k; i++) s += line(A[0], A[1], 36 + i * 288 / (k + 1), 208, { color: BLUE, w: 3, cls: "ar-draw" });
    for (let j = 1; j <= m; j++) { const t = j / (m + 1), y = 22 + 186 * t; s += line(180 - 144 * t, y, 180 + 144 * t, y, { color: CORAL, w: 3, cls: "ar-draw" }); }
    return svg(s, "0 0 360 230");
  }
  function cevianPick(k, m, i1, i2, level) {
    const t = level / (m + 1), X = (i) => 36 + i * 288 / (k + 1), at = (i) => [180 + (X(i) - 180) * t, 22 + 186 * t];
    return cevianFig(k, m).replace("</svg>", `<polygon class="ar-pop" points="180,22 ${at(i1).map(r1).join(",")} ${at(i2).map(r1).join(",")}" fill="#e25b4555" stroke="${CORAL}" stroke-width="4"/></svg>`);
  }
  // İki doğruyla dört dikdörtgene bölünmüş dikdörtgen; etiketler sol üst, sağ üst, sol alt, sağ alt.
  function split4(w1, w2, h1, h2, labels) {
    const u = Math.min(300 / (w1 + w2), 190 / (h1 + h2)), x0 = 180 - (w1 + w2) * u / 2, y0 = 120 - (h1 + h2) * u / 2;
    const cell = (x, y, w, h, t, i) => `<rect class="ar-pop" style="animation-delay:${i * 80}ms" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${t === "?" ? LIGHT.coral : [LIGHT.blue, LIGHT.teal, LIGHT.gold, LIGHT.grape][i]}" stroke="${INK}" stroke-width="3"/>` + text(x + w / 2, y + h / 2, t, { size: t === "?" ? 26 : 15, fill: t === "?" ? CORAL : INK });
    return svg(cell(x0, y0, w1 * u, h1 * u, labels[0], 0) + cell(x0 + w1 * u, y0, w2 * u, h1 * u, labels[1], 1) + cell(x0, y0 + h1 * u, w1 * u, h2 * u, labels[2], 2) + cell(x0 + w1 * u, y0 + h1 * u, w2 * u, h2 * u, labels[3], 3), "0 0 360 240");
  }
  const noteFig = (lines) => cards(lines.map((t, i) => ({ t, q: i === lines.length - 1 && /\?/.test(t) })));

  // 1. Nokta, doğru parçası, ışın, doğru
  add("nokta", 6, 7, (l) => {
    const n = l === 6 ? ri(5, 7) : ri(7, 10), seg = comb(n, 2), rays = 2 * n - 2, total = rnd() < .5;
    const nm = ["A", "B", "C", "D", "E", "F", "G", "H", "K", "L"].slice(0, n);
    return N(`Bir doğru üzerinde ${n} nokta var. Bu noktaları uç kabul eden doğru parçalarının sayısı ile başlangıcı bu noktalardan biri olup başka bir noktadan geçen farklı ışınların sayısının ${total ? "toplamı" : "farkı"} kaçtır?`, total ? seg + rays : seg - rays,
      `Doğru parçası: ${n} × ${n - 1} ÷ 2 = ${seg}. Işın: uçtaki 2 noktadan birer, içteki ${n - 2} noktadan ikişer yön → ${rays}. ${total ? `${seg} + ${rays} = ${seg + rays}` : `${seg} − ${rays} = ${seg - rays}`}.`,
      segFig(nm, Array(n - 1).fill(1), []), { hint: "Doğru parçalarını ve ışınları ayrı ayrı say.", sol: SOL("Önce doğru parçalarını, sonra ışınları ayrı ayrı say; en son iki sayıyı birleştir.",
        { t: `Doğru parçaları: ${nm[0]} noktasından sağdaki ${n - 1} noktanın her birine bir parça çizilir.`, fig: segFig(nm, Array(n - 1).fill(1), nm.slice(1).map((_, j) => ({ i: 0, j: j + 1, label: "", row: j % 3, color: [CORAL, BLUE, TEAL][j % 3] }))) },
        `${nm[1]}'den sağa ${n - 2} parça, ${nm[2]}'den sağa ${n - 3} parça… Her noktadan yalnız sağa doğru sayarsak hiçbir parçayı iki kez saymayız: ${Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(" + ")} = ${seg}.`,
        { t: `Işınlar: Uçtaki ${nm[0]} ve ${nm[n - 1]} noktalarından yalnız içeri doğru 1 ışın çıkar. İçteki ${n - 2} noktanın her birinden sağa ve sola 2 ışın çıkar.`, fig: segFig(nm, Array(n - 1).fill(1), [{ i: 0, j: n - 1, label: "1 + 2 + … + 2 + 1", color: GRAPE }]) },
        `Işın sayısı 1 + 1 + 2 × ${n - 2} = ${rays}.`,
        total ? `İstenen toplam: ${seg} + ${rays} = ${seg + rays}.` : `İstenen fark: ${seg} − ${rays} = ${seg - rays}.`) });
  });
  add("nokta", 6, 8, (l) => {
    if (l === 6) {
      const a = ri(3, 15), b = ri(3, 15), c = ri(3, 15);
      return N(`A, B, C, D bu sırayla bir doğru üzerinde. AC = ${a + b} cm, BD = ${b + c} cm, AD = ${a + b + c} cm. BC kaç cm?`, b, `AC ile BD toplanınca BC iki kez sayılır: ${a + b} + ${b + c} − ${a + b + c} = ${b}.`,
        segFig(["A", "B", "C", "D"], [a, b, c], [{ i: 0, j: 2, label: a + b + " cm", row: 1, color: TEAL }, { i: 1, j: 3, label: b + c + " cm" }, { i: 0, j: 3, label: a + b + c + " cm", below: true, color: GRAPE }, { i: 1, j: 2, label: "?", below: true, row: 1, color: CORAL }]), { unit: "cm", sol: SOL("AC ile BD üst üste biner; ortak kısım BC'dir. İkisini toplayınca BC iki kez sayılır.",
        { t: `AC = AB + BC ve BD = BC + CD. Topla: AC + BD = AB + BC + BC + CD.`, fig: segFig(["A", "B", "C", "D"], [a, b, c], [{ i: 0, j: 2, label: a + b + " cm", row: 1, color: TEAL }, { i: 1, j: 3, label: b + c + " cm" }, { i: 1, j: 2, label: "iki kez", below: true, color: CORAL }]) },
        `AB + BC + CD bütün AD'dir. O hâlde AC + BD = AD + BC.`,
        `BC = AC + BD − AD = ${a + b} + ${b + c} − ${a + b + c} = ${b} cm.`) });
    }
    const n = l === 7 ? 4 : 5, gaps = Array.from({ length: n - 1 }, () => ri(2, 12)), nm = ["A", "B", "C", "D", "E"].slice(0, n);
    const w = gaps.map((g, i) => (i + 1) * (n - 1 - i)), total = sum(gaps.map((g, i) => g * w[i]));
    return N(`${nm.join(", ")} bu sırayla bir doğru üzerinde; ardışık uzaklıklar şekilde. Uçları bu noktalardan olan ${comb(n, 2)} doğru parçasının uzunlukları toplamı kaç cm?`, total,
      `Her aralık, onu içeren parça sayısı kadar sayılır (solundaki nokta sayısı × sağındaki nokta sayısı): ${gaps.map((g, i) => `${g} × ${w[i]}`).join(" + ")} = ${total}.`,
      segFig(nm, gaps, gaps.map((g, i) => ({ i, j: i + 1, label: g + " cm" }))), { unit: "cm", hint: "Bir aralık, solundaki bir nokta ile sağındaki bir noktayı birleştiren her parçanın içindedir.", sol: SOL(`${comb(n, 2)} parçayı tek tek toplamak yerine, her küçük aralığın kaç parçanın içinde olduğunu sayalım.`,
        { t: `Örnek: ${nm[0]}${nm[1]} aralığı (${gaps[0]} cm), ${nm[0]}'dan başlayan bütün parçaların içindedir: ${n - 1} parça.`, fig: segFig(nm, gaps, nm.slice(1).map((_, j) => ({ i: 0, j: j + 1, label: "", row: j % 3, color: [CORAL, BLUE, TEAL, GRAPE][j % 4] }))) },
        `Genel kural: Bir aralığın solunda s, sağında r nokta varsa, o aralık s × r parçanın içindedir (soldan bir uç, sağdan bir uç seçilir).`,
        { t: `Aralıkların kaç kez sayıldığı: ${gaps.map((g, i) => `${nm[i]}${nm[i + 1]} → ${i + 1} × ${n - 1 - i} = ${w[i]}`).join(", ")}.`, fig: segFig(nm, gaps, gaps.map((g, i) => ({ i, j: i + 1, label: `${g} × ${w[i]}`, color: [CORAL, BLUE, TEAL, GRAPE][i] }))) },
        `Toplam = ${gaps.map((g, i) => `${g} × ${w[i]}`).join(" + ")} = ${gaps.map((g, i) => g * w[i]).join(" + ")} = ${total} cm.`) });
  });
  add("nokta", 7, 8, (l) => {
    const k = l === 7 ? 3 : ri(4, 5), u = ri(2, l === 7 ? 9 : 6), L = u * 2 ** k;
    const gaps = [...Array.from({ length: k }, (_, i) => L / 2 ** (i + 1)), u];
    return N(`AB = ${L} cm. Önce AB'nin orta noktası M${sub(1)} işaretleniyor. Sonra her adımda, son işaretlenen nokta ile B arasındaki parçanın orta noktası işaretleniyor. ${k}. adımda işaretlenen M${sub(k)} noktası A'dan kaç cm uzaktadır?`, L - u,
      `Her adımda B'ye uzaklık yarıya iner: ${L} → ${gaps.slice(0, k).map((g) => g).join(" → ")}. M${sub(k)}B = ${u}; AM${sub(k)} = ${L} − ${u} = ${L - u}.`,
      segFig(["A", ...Array.from({ length: k }, (_, i) => "M" + sub(i + 1)), "B"], Array(k + 1).fill(1), [{ i: 0, j: k + 1, label: L + " cm", color: TEAL }, { i: 0, j: k, label: "?", below: true, color: CORAL }]), { unit: "cm", hint: "M₁'den sonra her yeni nokta B'ye öncekinin yarısı kadar yakındır.", sol: SOL("A'ya uzaklığı doğrudan bulmak zor; noktaların B'ye uzaklığını takip etmek çok kolay: her adımda yarıya iner.",
        { t: `M₁, AB'nin ortası: M₁B = ${L} ÷ 2 = ${L / 2} cm.`, fig: segFig(["A", "M₁", "B"], [1, 1], [{ i: 1, j: 2, label: L / 2 + " cm", color: TEAL }]) },
        `Her yeni nokta, kalan parçanın ortası olduğu için B'ye uzaklık her seferinde yarıya iner: ${gaps.slice(0, k).join(" → ")} cm.`,
        { t: `${k}. adımda M${sub(k)}B = ${u} cm.`, fig: segFig(["A", ...Array.from({ length: k }, (_, i) => "M" + sub(i + 1)), "B"], Array(k + 1).fill(1), [{ i: k, j: k + 1, label: u + " cm", color: TEAL }, { i: 0, j: k, label: "?", below: true, color: CORAL }]) },
        `AM${sub(k)} = AB − M${sub(k)}B = ${L} − ${u} = ${L - u} cm.`) });
  });
  add("nokta", 8, 8, () => {
    const n = ri(3, 7), m = ri(2, 5), tri = rnd() < .5;
    const lines = 1 + n * m + comb(m, 2), tris = comb(n + m, 3) - comb(n, 3);
    const base = `Bir doğru üzerinde ${n} nokta, doğrunun dışında ${m} nokta var. Doğru üzerindekiler dışında hiçbir üç nokta aynı doğru üzerinde değil.`;
    return tri ? N(`${base} Köşeleri bu ${n + m} noktadan seçilen kaç farklı üçgen çizilebilir?`, tris, `Üç nokta seçmenin yolu ${comb(n + m, 3)}. Üçü de doğru üzerinde olan ${comb(n, 3)} seçim üçgen oluşturmaz: ${comb(n + m, 3)} − ${comb(n, 3)} = ${tris}.`, pointsFig(n, m), { hint: "Önce bütün üçlüleri say, sonra aynı doğru üzerinde kalanları çıkar.", sol: SOL("Üç nokta seçmek bir üçgen verir; yalnız üç nokta aynı doğru üzerindeyse üçgen olmaz. Hepsini sayıp bozukları çıkaralım.",
        `${n + m} noktadan 3 nokta seçmenin yolu: ${n + m} × ${n + m - 1} × ${n + m - 2} ÷ 6 = ${comb(n + m, 3)}. (Sıra önemli olmadığı için 3 × 2 × 1 = 6'ya böleriz.)`,
        { t: `Bozuk seçimler: üç noktanın üçü de alttaki doğrudaysa üçgen olmaz. Bunların sayısı ${n} × ${n - 1} × ${n - 2} ÷ 6 = ${comb(n, 3)}.`, fig: pointsFig(n, 0) },
        `Üçgen sayısı ${comb(n + m, 3)} − ${comb(n, 3)} = ${tris}.`) })
      : N(`${base} Bu noktaların en az ikisinden geçen kaç farklı doğru vardır?`, lines, `Verilen doğru 1 tane. Dıştaki bir nokta ile doğrudaki bir nokta: ${m} × ${n} = ${n * m}. Dıştaki iki nokta: ${comb(m, 2)}. Toplam 1 + ${n * m} + ${comb(m, 2)} = ${lines}.`, pointsFig(n, m), { hint: "Doğruları hangi nokta türlerinden geçtiğine göre gruplara ayır.", sol: SOL("Doğruları üç gruba ayıralım: verilen doğru, bir dış nokta ile bir doğru noktası, iki dış nokta.",
        { t: `1. grup: Alttaki ${n} noktanın hepsi aynı doğru üzerinde; bu noktalar yalnız 1 doğru belirler.`, fig: pointsFig(n, 0) },
        `2. grup: Her dış nokta, alttaki ${n} noktanın her biriyle ayrı bir doğru oluşturur: ${m} × ${n} = ${n * m}.`,
        `3. grup: İki dış nokta bir doğru belirler. ${m} dış noktadan 2'si ${m} × ${m - 1} ÷ 2 = ${comb(m, 2)} şekilde seçilir.`,
        `Başka üç nokta aynı doğruda olmadığı için hiçbir doğru iki kez sayılmadı: 1 + ${n * m} + ${comb(m, 2)} = ${lines}.`) });
  });

  // 2. Açı
  add("aci", 6, 7, (l) => {
    if (l === 6) {
      const a = 2 * ri(5, 40), b = 2 * ri(5, 45);
      if (a === b || a + b > 176) return null;
      const k = (a + b) / 2;
      return N(`∠AOB = ${a}° ve ∠BOC = ${b}° komşu açılar. OK ışını ∠AOC'nin açıortayı. ∠KOB kaç derecedir?`, Math.abs(a - b) / 2, `∠AOC = ${a + b}°, ∠AOK = ${k}°. OB, OA'dan ${a}° uzakta: |${a} − ${k}| = ${Math.abs(a - b) / 2}.`,
        svg(fan(80, 205, [{ deg: 0, label: "A", len: 170 }, { deg: a, label: "B", len: 170, color: BLUE }, { deg: a + b, label: "C", len: 170 }, { deg: k, label: "K", len: 150, color: CORAL }], [{ a0: 0, a1: a, t: a + "°", fill: LIGHT.gold, r: 60, tr: 96 }, { a0: a, a1: a + b, t: b + "°", fill: LIGHT.teal, r: 50, tr: 120 }], { center: "O" }), "-40 0 400 240"), { unit: "°", sol: SOL("Bütün ışınları OA'dan başlayarak ölçelim; aradaki açı iki ölçünün farkıdır.",
        `OA'dan ölçersek OB ${a}°'de, OC ${a} + ${b} = ${a + b}°'de durur.`,
        { t: `OK, ∠AOC'yi iki eş parçaya böler: OK, OA'dan ${a + b} ÷ 2 = ${k}° uzaktadır.`, fig: svg(fan(80, 205, [{ deg: 0, label: "A", len: 170 }, { deg: a, label: "B", len: 170, color: BLUE }, { deg: a + b, label: "C", len: 170 }, { deg: k, label: "K", len: 150, color: CORAL }], [{ a0: 0, a1: k, t: k + "°", fill: LIGHT.coral, r: 70, tr: 110 }, { a0: k, a1: a + b, t: k + "°", fill: LIGHT.coral, r: 40, tr: 60 }], { center: "O" }), "-40 0 400 240") },
        { t: `OB ${a}°'de, OK ${k}°'de. Aralarındaki açı farklarıdır: |${a} − ${k}| = ${Math.abs(a - b) / 2}°.`, fig: svg(fan(80, 205, [{ deg: 0, label: "A", len: 170 }, { deg: a, label: "B", len: 170, color: BLUE }, { deg: k, label: "K", len: 150, color: CORAL }], [{ a0: Math.min(a, k), a1: Math.max(a, k), t: "?", fill: LIGHT.gold, r: 90, tr: 120, color: CORAL }], { center: "O" }), "-40 0 400 240") }) });
    }
    const p = ri(1, 4), q = ri(1, 4), r = ri(1, 4), u = 2 * ri(3, Math.floor(90 / (p + q + r)));
    const tot = (p + q + r) * u, ans = (p * u) / 2 + q * u + (r * u) / 2;
    const rays = [0, p * u, (p + q) * u, tot].map((deg, i) => ({ deg, len: 150, label: "ABCD"[i], color: [INK, BLUE, TEAL, INK][i] }));
    return N(`∠AOB, ∠BOC, ∠COD art arda komşu açılar ve ölçüleri ${p} : ${q} : ${r} oranında. ∠AOD = ${tot}°. ∠AOB ile ∠COD'nin açıortayları arasındaki açı kaç derecedir?`, ans,
      `Bir pay ${tot} ÷ ${p + q + r} = ${u}°. Açılar ${p * u}°, ${q * u}°, ${r * u}°. İstenen açı ${p * u / 2} + ${q * u} + ${r * u / 2} = ${ans}.`,
      svg(fan(180, 205, rays, [{ a0: 0, a1: p * u, fill: LIGHT.gold, r: 54 }, { a0: p * u, a1: (p + q) * u, fill: LIGHT.blue, r: 54 }, { a0: (p + q) * u, a1: tot, fill: LIGHT.teal, r: 54 }], { center: "O" })), { unit: "°", hint: "Açıortay, açının tam yarısında durur. Önce her açıyı bul.", sol: SOL("Önce oranlardan üç açıyı bulalım, sonra açıortayların arasında kalan parçaları toplayalım.",
        `Oran ${p} : ${q} : ${r} demek, ∠AOD toplam ${p + q + r} eş paya bölünmüş demek. Bir pay ${tot} ÷ ${p + q + r} = ${u}°.`,
        { t: `Açılar: ∠AOB = ${p} × ${u} = ${p * u}°, ∠BOC = ${q * u}°, ∠COD = ${r * u}°.`, fig: svg(fan(180, 205, rays, [{ a0: 0, a1: p * u, fill: LIGHT.gold, r: 54, t: p * u + "°", tr: 80, size: 13 }, { a0: p * u, a1: (p + q) * u, fill: LIGHT.blue, r: 54, t: q * u + "°", tr: 80, size: 13 }, { a0: (p + q) * u, a1: tot, fill: LIGHT.teal, r: 54, t: r * u + "°", tr: 80, size: 13 }], { center: "O" })) },
        { t: `Açıortaylar arasında: ∠AOB'nin yarısı (${p * u / 2}°) + ∠BOC'nin tamamı (${q * u}°) + ∠COD'nin yarısı (${r * u / 2}°).`, fig: svg(fan(180, 205, [...rays, { deg: p * u / 2, len: 125, color: CORAL }, { deg: (p + q) * u + r * u / 2, len: 125, color: CORAL }], [{ a0: p * u / 2, a1: (p + q) * u + r * u / 2, fill: LIGHT.coral, r: 70 }], { center: "O" })) },
        `${p * u / 2} + ${q * u} + ${r * u / 2} = ${ans}°.`) });
  });
  add("aci", 6, 8, (l) => {
    if (l === 6) {
      const a = ri(15, 60), b = ri(15, 60), c = ri(15, 60);
      return N(`OA, OB, OC, OD ışınları bu sırayla. ∠AOC = ${a + b}°, ∠BOD = ${b + c}°, ∠AOD = ${a + b + c}°. ∠BOC kaç derecedir?`, b, `∠AOC + ∠BOD içinde ∠BOC iki kez var: ${a + b} + ${b + c} − ${a + b + c} = ${b}.`,
        svg(fan(180, 205, [0, a, a + b, a + b + c].map((deg, i) => ({ deg, len: 150, label: "ABCD"[i] })), [{ a0: a, a1: a + b, t: "?", fill: LIGHT.coral, color: CORAL, size: 22, r: 70, tr: 96 }], { center: "O" })), { unit: "°", sol: SOL("∠AOC ile ∠BOD üst üste biner; ortak parça ∠BOC'dir.",
        { t: `∠AOC = ∠AOB + ∠BOC ve ∠BOD = ∠BOC + ∠COD.`, fig: svg(fan(180, 205, [0, a, a + b, a + b + c].map((deg, i) => ({ deg, len: 150, label: "ABCD"[i] })), [{ a0: 0, a1: a + b, fill: LIGHT.gold, r: 60 }, { a0: a, a1: a + b + c, fill: "#2c6bed33", r: 95 }], { center: "O" })) },
        `Toplarsak: ∠AOC + ∠BOD = ∠AOB + ∠BOC + ∠COD + ∠BOC = ∠AOD + ∠BOC.`,
        `∠BOC = ${a + b} + ${b + c} − ${a + b + c} = ${b}°.`) });
    }
    const n = l === 7 ? 4 : 5, gaps = Array.from({ length: n - 1 }, () => ri(18, Math.floor(170 / (n - 1)) - 2)), w = gaps.map((g, i) => (i + 1) * (n - 1 - i)), total = sum(gaps.map((g, i) => g * w[i]));
    const degs = gaps.reduce((acc, g) => [...acc, acc[acc.length - 1] + g], [0]);
    return N(`O noktasından çıkan ${n} ışın arasındaki ardışık açılar şekilde. Bu ışınlardan ikişer seçilerek oluşan ${comb(n, 2)} açının ölçüleri toplamı kaç derecedir?`, total,
      `Her küçük açı, onu içeren açı sayısı kadar sayılır: ${gaps.map((g, i) => `${g} × ${w[i]}`).join(" + ")} = ${total}.`,
      svg(fan(180, 205, degs.map((deg) => ({ deg, len: 150 })), gaps.map((g, i) => ({ a0: degs[i], a1: degs[i + 1], t: g + "°", fill: [LIGHT.gold, LIGHT.blue, LIGHT.teal, LIGHT.grape][i], r: 62 + (i % 2) * 22, tr: 92 + (i % 2) * 24, size: 15 })), { center: "O" })), { unit: "°", hint: "Bir küçük açı, solundaki bir ışınla sağındaki bir ışının oluşturduğu her açının içindedir.", sol: SOL(`${comb(n, 2)} açıyı tek tek yazmak yerine, her küçük açının kaç büyük açının içinde olduğunu sayalım.`,
        `Bir küçük açının bir yanında s ışın, öbür yanında r ışın varsa: bir yandan bir ışın, öbür yandan bir ışın seçince o küçük açıyı içeren bir açı oluşur. Bu da s × r açı demek.`,
        { t: `Küçük açıların kaç kez sayıldığı: ${gaps.map((g, i) => `${g}° → ${i + 1} × ${n - 1 - i} = ${w[i]} kez`).join(", ")}.`, fig: svg(fan(180, 205, degs.map((deg) => ({ deg, len: 150 })), gaps.map((g, i) => ({ a0: degs[i], a1: degs[i + 1], t: "×" + w[i], fill: [LIGHT.gold, LIGHT.blue, LIGHT.teal, LIGHT.grape][i], r: 62 + (i % 2) * 22, tr: 92 + (i % 2) * 24, size: 15, color: CORAL })), { center: "O" })) },
        `Toplam = ${gaps.map((g, i) => `${g} × ${w[i]}`).join(" + ")} = ${gaps.map((g, i) => g * w[i]).join(" + ")} = ${total}°.`) });
  });
  add("aci", 7, 8, (l) => {
    const n = l === 7 ? ri(3, 5) : ri(6, 9), ans = comb(n + 2, 2) - 1;
    const rays = [{ deg: 0, len: 150, color: INK }, ...Array.from({ length: n }, (_, i) => ({ deg: (i + 1) * 180 / (n + 1) + ri(-6, 6), len: 140, color: [CORAL, BLUE, TEAL, GRAPE][i % 4] })), { deg: 180, len: 150, color: INK }];
    return N(`Bir doğru üzerindeki O noktasından, doğrunun aynı tarafına ${n} ışın çiziliyor. Şekilde ölçüsü 180°'den küçük kaç açı vardır?`, ans,
      `Doğru üzerindeki iki ışınla birlikte ${n + 2} ışın var; her iki ışın bir açı oluşturur: ${n + 2} × ${n + 1} ÷ 2 = ${comb(n + 2, 2)}. Doğru üzerindeki iki ışın 180° yapar, o çıkarılır: ${ans}.`,
      svg(fan(180, 205, rays, [], { center: "O" }), "0 0 360 230"), { hint: "Doğru üzerindeki iki ışını da say. Her ışın çifti bir açıdır.", sol: SOL("Her açı, iki ışın seçilerek oluşur. Işın çiftlerini sayıp 180°'lik olanı çıkaralım.",
        `Çizilen ${n} ışına doğrunun iki yanındaki 2 ışın da eklenince toplam ${n + 2} ışın olur.`,
        { t: `En sağdaki ışın diğer ${n + 1} ışınla birer açı yapar. Sonraki ışın kendinden soldaki ${n} ışınla… Toplam ${Array.from({ length: n + 1 }, (_, i) => n + 1 - i).join(" + ")} = ${comb(n + 2, 2)} ışın çifti.`, fig: svg(fan(180, 205, rays.map((r, i) => ({ ...r, color: i === 0 ? CORAL : "#c9c1b3" })), [], { center: "O" }), "0 0 360 230") },
        { t: `Doğru üzerindeki iki ışının yaptığı açı 180°'dir; 180°'den küçük değildir. Onu çıkarırız: ${comb(n + 2, 2)} − 1 = ${ans}.`, fig: svg(fan(180, 205, [{ deg: 0, len: 150, color: CORAL }, { deg: 180, len: 150, color: CORAL }], [{ a0: 0, a1: 180, fill: LIGHT.coral, r: 50 }], { center: "O" }), "0 0 360 230") }) });
  });
  add("aci", 8, 8, () => {
    const opts = [];
    for (let n = 4; n <= 9; n++) for (let d = 2; d <= 12; d++) { const rest = 360 - d * n * (n - 1) / 2; if (rest > 0 && rest % n === 0 && rest / n >= 8) opts.push([n, d, rest / n]); }
    const [n, d, a] = pick(opts), big = rnd() < .5, ans = big ? a + (n - 1) * d : a;
    const degs = Array.from({ length: n + 1 }, (_, i) => i * a + d * i * (i - 1) / 2);
    return N(`Bir noktanın çevresindeki tam açı, ${n} ışınla ${n} açıya bölünüyor. Açılar sırayla dolaşıldığında her açı bir öncekinden ${d}° büyük. En ${big ? "büyük" : "küçük"} açı kaç derecedir?`, ans,
      `En küçüğü x olsun: ${n}x + ${d} × (0 + 1 + … + ${n - 1}) = ${n}x + ${d * n * (n - 1) / 2} = 360. x = ${a}.${big ? ` En büyük ${a} + ${n - 1} × ${d} = ${ans}.` : ""}`,
      svg(fan(180, 120, degs.slice(0, n).map((deg) => ({ deg, len: 105 })), degs.slice(0, n).map((deg, i) => ({ a0: deg, a1: degs[i + 1], fill: i % 2 ? LIGHT.teal : LIGHT.gold, r: 46, tr: 74, t: i ? `x+${i * d}` : "x", size: 12 })))), { unit: "°", hint: "Açıların toplamı 360°. En küçüğünü x kabul edip diğerlerini x cinsinden yaz.", sol: SOL("Bilinmeyen tek bir şey var: en küçük açı. Ona x diyelim ve bütün açıları x ile yazalım.",
        `Açılar: x, x + ${d}, x + ${2 * d}, …, x + ${(n - 1) * d}. Bir noktanın çevresindeki açıların toplamı 360°.`,
        `${n} tane x var. Eklenen fazlalıklar: ${d} × (1 + 2 + … + ${n - 1}) = ${d} × ${n * (n - 1) / 2} = ${d * n * (n - 1) / 2}°.`,
        { t: `${n} · x + ${d * n * (n - 1) / 2} = 360 → ${n} · x = ${360 - d * n * (n - 1) / 2} → x = ${a}°.`, fig: bars([{ name: "360°", parts: Array.from({ length: n }, (_, i) => ({ w: a + i * d, label: i ? `+${i * d}` : "x", fill: i % 2 ? LIGHT.teal : LIGHT.gold, stroke: i % 2 ? TEAL : GOLD })) }]) },
        big ? `En büyük açı x + ${(n - 1) * d} = ${a} + ${(n - 1) * d} = ${ans}°.` : `En küçük açı x = ${a}°.`) });
  });

  // 3. Çember
  add("cember", 6, 7, (l) => {
    const rows = ri(1, 3), cols = ri(2, 5), r = ri(2, l === 6 ? 9 : 15), P4 = 4 * r * (rows + cols);
    const u = Math.min(150 / cols, 90 / rows), x0 = 180 - cols * u, y0 = 115 - rows * u;
    let s = `<rect class="ar-pop" x="${r1(x0 - 3)}" y="${r1(y0 - 3)}" width="${r1(2 * cols * u + 6)}" height="${r1(2 * rows * u + 6)}" rx="6" fill="#fff4dc" stroke="${GOLD}" stroke-width="4"/>`;
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) s += `<circle class="ar-pop" style="animation-delay:${(i * cols + j) * 50}ms" cx="${r1(x0 + u + 2 * u * j)}" cy="${r1(y0 + u + 2 * u * i)}" r="${r1(u)}" fill="#eef6ff" stroke="${BLUE}" stroke-width="3"/>`;
    const dimFig = svg(s + line(x0, y0 - 14, x0 + 2 * cols * u, y0 - 14, { color: CORAL, w: 3 }) + text(180, y0 - 26, `${cols} çap`, { size: 15, fill: CORAL }) + line(x0 + 2 * cols * u + 14, y0, x0 + 2 * cols * u + 14, y0 + 2 * rows * u, { color: TEAL, w: 3 }) + text(x0 + 2 * cols * u + 22, 115, `${rows} çap`, { size: 15, fill: TEAL, anchor: "start" }));
    const csol = (last) => SOL("Kutunun kenarları çemberlerin çaplarıyla ölçülür: uzun kenar boyunca yan yana çaplar, kısa kenar boyunca üst üste çaplar dizilir.",
      { t: `Uzun kenarda ${cols} çember yan yana: uzun kenar ${cols} çap. Kısa kenarda ${rows} çember üst üste: kısa kenar ${rows} çap.`, fig: dimFig },
      `Çevre = 2 × (uzun + kısa) = 2 × (${cols} + ${rows}) çap = ${2 * (cols + rows)} çap.`, last);
    return l === 6 ? N(`Yarıçapı ${r} cm olan eş çemberler ${rows} sıra ve her sırada ${cols} tane olacak şekilde, birbirine ve kutunun kenarlarına değerek yerleştirildi. Kutunun çevresi kaç cm?`, P4, `Uzun kenar ${cols} çap = ${2 * r * cols}, kısa kenar ${rows} çap = ${2 * r * rows}. Çevre 2 × (${2 * r * cols} + ${2 * r * rows}) = ${P4}.`, svg(s), { unit: "cm", sol: csol(`Bir çap 2 × ${r} = ${2 * r} cm. Çevre ${2 * (cols + rows)} × ${2 * r} = ${P4} cm.`) })
      : N(`Eş çemberler ${rows} sıra ve her sırada ${cols} tane olacak şekilde, birbirine ve kutunun kenarlarına değerek yerleştirildi. Kutunun çevresi ${P4} cm. Bir çemberin yarıçapı kaç cm?`, r, `Çevre = 2 × (${cols} + ${rows}) çap = ${2 * (cols + rows)} çap. Bir çap ${P4} ÷ ${2 * (cols + rows)} = ${2 * r}; yarıçap ${r}.`, svg(s), { unit: "cm", sol: csol(`${2 * (cols + rows)} çap = ${P4} cm → bir çap ${P4} ÷ ${2 * (cols + rows)} = ${2 * r} cm. Yarıçap çapın yarısı: ${r} cm.`) });
  });
  add("cember", 6, 7, (l) => {
    const a = ri(2, 12), b = ri(2, 12), c = ri(2, 12);
    const ab = a + b, ac = a + c, bc = b + c, x = (ac * ac - bc * bc + ab * ab) / (2 * ab), y = Math.sqrt(Math.max(0, ac * ac - x * x));
    const minX = Math.min(-a, x - c), maxX = Math.max(ab + b, x + c), minY = -Math.max(a, b), maxY = y + c, u = Math.min(320 / (maxX - minX), 200 / (maxY - minY));
    const M = (px, py) => [20 + (px - minX) * u, 220 - (py - minY) * u];
    const [A, B, Cc] = [M(0, 0), M(ab, 0), M(x, y)];
    let s = [[A, a, BLUE], [B, b, GOLD], [Cc, c, TEAL]].map(([p, rr, col]) => `<circle class="ar-pop" cx="${r1(p[0])}" cy="${r1(p[1])}" r="${r1(rr * u)}" fill="${col}22" stroke="${col}" stroke-width="3"/>`).join("");
    s += `<polygon points="${[A, B, Cc].map((p) => p.map(r1).join(",")).join(" ")}" fill="none" stroke="${CORAL}" stroke-width="3" stroke-dasharray="7 5"/>` + [A, B, Cc].map((p, i) => dot(p[0], p[1], 5, INK) + text(p[0], p[1] - 14, "ABC"[i], { size: 15 })).join("");
    if (l === 6) return N(`A, B, C merkezli çemberlerin yarıçapları ${a} cm, ${b} cm, ${c} cm. Her iki çember birbirine dıştan değiyor. ABC üçgeninin çevresi kaç cm?`, 2 * (a + b + c), `Değen iki çemberin merkezleri arası yarıçaplar toplamıdır. Her yarıçap iki kenarda sayılır: 2 × (${a} + ${b} + ${c}) = ${2 * (a + b + c)}.`, svg(s, "0 0 360 240"), { unit: "cm", sol: SOL("Dıştan değen iki çemberin merkezleri arasındaki uzaklık, iki yarıçapın toplamıdır.",
      { t: `AB = ${a} + ${b} = ${ab} cm, BC = ${b} + ${c} = ${bc} cm, AC = ${a} + ${c} = ${ac} cm.`, fig: svg(s, "0 0 360 240") },
      `Çevre = AB + BC + AC = ${ab} + ${bc} + ${ac} = ${2 * (a + b + c)} cm.`,
      `Kısa yol: Her yarıçap iki kenarda kullanıldı. Çevre = 2 × (${a} + ${b} + ${c}).`) });
    return N(`A, B, C merkezli üç çember ikişer ikişer dıştan değiyor. AB = ${ab} cm, AC = ${ac} cm, BC = ${bc} cm. A merkezli çemberin yarıçapı kaç cm?`, a, `rA + rB = ${ab}, rA + rC = ${ac}, rB + rC = ${bc}. İlk ikisini toplayıp üçüncüsünü çıkar: 2rA = ${ab} + ${ac} − ${bc} = ${2 * a}; rA = ${a}.`, svg(s, "0 0 360 240"), { unit: "cm", hint: "Her kenar iki yarıçapın toplamı. Üç eşitliği birlikte kullan.", sol: SOL("Değen çemberlerde merkezler arası uzaklık = iki yarıçapın toplamı. Üç kenardan üç eşitlik yazalım.",
      { t: `Eşitlikler: rA + rB = ${ab}, rA + rC = ${ac}, rB + rC = ${bc}.`, fig: noteFig([`rA + rB = ${ab}`, `rA + rC = ${ac}`, `rB + rC = ${bc}`]) },
      `İlk ikisini topla: 2 · rA + rB + rC = ${ab + ac}.`,
      `rB + rC = ${bc} olduğunu biliyoruz; çıkarınca 2 · rA = ${ab + ac} − ${bc} = ${2 * a}.`,
      `rA = ${2 * a} ÷ 2 = ${a} cm. (Kontrol: rB = ${b}, rC = ${c}.)`) });
  });
  add("cember", 7, 8, (l) => {
    const n = ri(3, l === 7 ? 6 : 9), r = ri(2, 12), u = Math.min(300 / (n + 1), 70);
    const x0 = 180 - (n + 1) * u / 2;
    let s = l === 7 ? `<rect class="ar-pop" x="${r1(x0)}" y="${r1(115 - u)}" width="${r1((n + 1) * u)}" height="${r1(2 * u)}" fill="#fff4dc" stroke="${GOLD}" stroke-width="3"/>` : "";
    for (let i = 0; i < n; i++) s += `<circle class="ar-pop" style="animation-delay:${i * 70}ms" cx="${r1(x0 + u + i * u)}" cy="115" r="${r1(u)}" fill="${i % 2 ? "#2c6bed14" : "#1c8c7414"}" stroke="${i % 2 ? BLUE : TEAL}" stroke-width="3"/>` + dot(x0 + u + i * u, 115, 4, INK);
    if (l === 7) return N(`Yarıçapı ${r} cm olan ${n} eş çember bir doğru boyunca diziliyor; her çember komşusunun merkezinden geçiyor. Bütün çemberleri tam içine alan ve kenarlarına değen dikdörtgenin çevresi kaç cm?`, 2 * r * (n + 3), `Merkezler arası ${r} cm. Uzun kenar: ${n - 1} × ${r} + 2 × ${r} = ${(n + 1) * r}. Kısa kenar çap ${2 * r}. Çevre 2 × (${(n + 1) * r} + ${2 * r}) = ${2 * r * (n + 3)}.`, svg(s), { unit: "cm", sol: SOL("Her çember komşusunun merkezinden geçiyorsa, komşu merkezler arası uzaklık bir yarıçaptır.",
      `İlk ve son merkez arasında ${n - 1} aralık var: ${n - 1} × ${r} = ${(n - 1) * r} cm.`,
      { t: `Uçlarda çemberler merkezden bir yarıçap daha taşar. Uzun kenar ${r} + ${(n - 1) * r} + ${r} = ${(n + 1) * r} cm. Kısa kenar bir çap: ${2 * r} cm.`, fig: svg(s) },
      `Çevre 2 × (${(n + 1) * r} + ${2 * r}) = ${2 * r * (n + 3)} cm.`) });
    return N(`${n} eş çember bir doğru boyunca diziliyor; her çember komşusunun merkezinden geçiyor. Bu çemberlerin en az ikisinin ortak noktası olan (kesiştiği ya da değdiği) kaç farklı nokta vardır?`, 3 * n - 4,
      `Komşu çemberler 2 noktada kesişir: ${n - 1} × 2 = ${2 * n - 2}. Bir atlayarak gelen çemberlerin merkezleri arası çap kadar; aradaki çemberin merkezinde birbirine değerler: ${n - 2} nokta. Başka ortak nokta yok: ${2 * n - 2} + ${n - 2} = ${3 * n - 4}.`, svg(s), { hint: "Komşu çemberleri ve bir atlayarak gelen çemberleri ayrı ayrı incele.", sol: SOL("Ortak noktaları, hangi iki çemberin buluştuğuna göre gruplayalım.",
      { t: `Komşu iki çember (merkezleri arası bir yarıçap) iki noktada kesişir: üstte bir, altta bir. ${n - 1} komşu çift → ${2 * n - 2} nokta.`, fig: svg(s) },
      `Bir atlayarak gelen iki çemberin merkezleri arası iki yarıçap, yani bir çap. Bu çemberler tek noktada dıştan değer; o nokta tam aradaki çemberin merkezidir. ${n - 2} böyle çift → ${n - 2} nokta.`,
      `Daha uzaktaki çemberler hiç buluşmaz. Bu noktaların hiçbiri çakışmaz.`,
      `Toplam ${2 * n - 2} + ${n - 2} = ${3 * n - 4}.`) });
  });
  add("cember", 8, 8, () => {
    const n = ri(2, 6), m = ri(1, 5), ans = n * (n - 1) + 2 * n * m + comb(m, 2);
    let s = "";
    for (let i = 0; i < n; i++) s += `<circle cx="${r1(120 + (i % 3) * 60)}" cy="${r1(95 + Math.floor(i / 3) * 50)}" r="58" fill="none" stroke="${[BLUE, TEAL, GRAPE][i % 3]}" stroke-width="3"/>`;
    for (let j = 0; j < m; j++) s += line(...P(180, 115, 20 + j * 33, 220), ...P(180, 115, 200 + j * 33, 220), { color: CORAL, w: 3 });
    return N(`Düzlemde ${n} çember ve ${m} doğru çiziliyor. En çok kaç kesişim noktası olabilir?`, ans,
      `İki çember en çok 2 noktada: ${comb(n, 2)} × 2 = ${n * (n - 1)}. Bir çember ile bir doğru en çok 2 noktada: ${n} × ${m} × 2 = ${2 * n * m}. İki doğru en çok 1 noktada: ${comb(m, 2)}. Toplam ${ans}.`,
      svg(frame(s)), { hint: "Çember–çember, çember–doğru ve doğru–doğru çiftlerini ayrı ayrı say.", sol: SOL("Kesişimler her zaman iki şekil arasında olur. Şekil çiftlerini üç türe ayırıp her türün en çok kaç nokta verdiğini bulalım.",
        { t: `İki çember en çok 2 noktada kesişir. ${n} çemberden ${comb(n, 2)} çift seçilir: ${comb(n, 2)} × 2 = ${n * (n - 1)} nokta.`, fig: svg(`<circle cx="150" cy="110" r="70" fill="none" stroke="${BLUE}" stroke-width="3"/><circle cx="220" cy="110" r="70" fill="none" stroke="${TEAL}" stroke-width="3"/>` + dot(185, 49, 7, CORAL) + dot(185, 171, 7, CORAL), "0 0 360 220") },
        { t: `Bir çember ile bir doğru en çok 2 noktada kesişir. ${n} çember × ${m} doğru × 2 = ${2 * n * m} nokta.`, fig: svg(`<circle cx="180" cy="110" r="75" fill="none" stroke="${BLUE}" stroke-width="3"/>` + line(40, 150, 320, 70, { color: CORAL, w: 3 }), "0 0 360 220") },
        `İki doğru en çok 1 noktada kesişir. ${m} doğrudan ${comb(m, 2)} çift: ${comb(m, 2)} nokta.`,
        `Şekiller öyle yerleştirilebilir ki bütün bu noktalar birbirinden farklı olur. En çok ${n * (n - 1)} + ${2 * n * m} + ${comb(m, 2)} = ${ans}.`) });
  });

  // 4. Dikme
  add("dikme", 6, 7, (l) => {
    const W = ri(10, 40), H = ri(8, 30), x = ri(2, W - 2), y = ri(2, H - 2);
    const u = Math.min(260 / W, 160 / H), X0 = 180 - W * u / 2, Y0 = 120 - H * u / 2, px = X0 + x * u, py = Y0 + y * u;
    let s = `<rect class="ar-pop" x="${r1(X0)}" y="${r1(Y0)}" width="${r1(W * u)}" height="${r1(H * u)}" fill="#eef6ff" stroke="${BLUE}" stroke-width="4"/>`;
    s += [[X0, py], [X0 + W * u, py], [px, Y0], [px, Y0 + H * u]].map(([a, b], i) => line(px, py, a, b, { color: [TEAL, CORAL, TEAL, CORAL][i], w: 3, dash: "7 5" })).join("") + dot(px, py, 7, INK) + text(px + 14, py - 12, "P");
    if (l === 6) return N(`Dikdörtgen ${W} cm'ye ${H} cm. İçindeki P noktasının sol kenara uzaklığı ${x} cm, üst kenara uzaklığı ${y} cm. P'nin sağ ve alt kenarlara dik uzaklıklarının toplamı kaç cm?`, W - x + H - y, `Sağa ${W} − ${x} = ${W - x}, alta ${H} − ${y} = ${H - y}. Toplam ${W - x + H - y}.`, svg(s + text(X0 + x * u / 2, py - 10, x, { size: 14, fill: TEAL }) + text(px + 12, Y0 + y * u / 2, y, { size: 14, fill: TEAL, anchor: "start" })), { unit: "cm", sol: SOL("Soldaki ve sağdaki dikmeler uç uca eklenince dikdörtgenin genişliği olur; üstteki ve alttaki dikmeler de yüksekliği.",
      { t: `Sol + sağ = genişlik ${W} cm. Sağa uzaklık ${W} − ${x} = ${W - x} cm.`, fig: svg(s + text(X0 + x * u / 2, py - 10, x, { size: 14, fill: TEAL }) + text(px + (W - x) * u / 2, py - 10, "?", { size: 16, fill: CORAL })) },
      `Üst + alt = yükseklik ${H} cm. Alta uzaklık ${H} − ${y} = ${H - y} cm.`,
      `Toplam ${W - x} + ${H - y} = ${W - x + H - y} cm.`) });
    return N(`Bir dikdörtgenin içindeki P noktasından dört kenara çizilen dikmelerin uzunlukları toplamı ${W + H} cm. Dikdörtgenin çevresi kaç cm?`, 2 * (W + H), `Soldaki ve sağdaki dikmeler toplamı bir yatay kenara, üstteki ve alttaki toplamı bir düşey kenara eşittir. Dört dikme = yarım çevre. Çevre 2 × ${W + H} = ${2 * (W + H)}.`, svg(s), { unit: "cm", hint: "Karşılıklı iki dikmeyi uç uca ekle; neye eşit oluyor?", sol: SOL("P nerede olursa olsun karşılıklı iki dikme bir kenar boyu eder. Bu yüzden P'nin yerini bilmeye gerek yok.",
      { t: `Yeşil (sol) ve kırmızı (sağ) yatay dikmeler uç uca: dikdörtgenin genişliği.`, fig: svg(s) },
      `Üst ve alt dikmeler uç uca: dikdörtgenin yüksekliği. Dört dikmenin toplamı = genişlik + yükseklik = yarım çevre = ${W + H} cm.`,
      `Çevre yarım çevrenin 2 katı: 2 × ${W + H} = ${2 * (W + H)} cm.`) });
  });
  add("dikme", 6, 7, (l) => {
    const n = ri(2, l === 6 ? 5 : 7), m = ri(2, l === 6 ? 5 : 7);
    let s = "";
    for (let i = 0; i < n; i++) s += line(20, 25 + i * 170 / Math.max(1, n - 1), 340, 25 + i * 170 / Math.max(1, n - 1), { color: BLUE, w: 3.5 });
    for (let j = 0; j < m; j++) s += line(40 + j * 280 / Math.max(1, m - 1), 10, 40 + j * 280 / Math.max(1, m - 1), 210, { color: CORAL, w: 3.5 });
    return l === 6 ? N(`${n} yatay doğru ile ${m} düşey doğru birbirine dik kesişiyor. Kesişim noktalarında toplam kaç dik açı oluşur?`, 4 * n * m, `Kesişim sayısı ${n} × ${m} = ${n * m}; her birinde 4 dik açı: ${4 * n * m}.`, svg(s, "0 0 360 220"), { sol: SOL("Önce kesişim noktalarını say; sonra her kesişim noktasında kaç dik açı olduğunu düşün.",
        `Her yatay doğru, ${m} düşey doğrunun hepsini keser. ${n} yatay doğru: ${n} × ${m} = ${n * m} kesişim.`,
        { t: `İki dik doğru kesişince çevrede 4 tane 90° açı oluşur.`, fig: svg(line(60, 110, 300, 110, { color: BLUE, w: 4 }) + line(180, 20, 180, 200, { color: CORAL, w: 4 }) + [0, 90, 180, 270].map((d) => G.rightMark(180, 110, d, 18, TEAL)).join(""), "0 0 360 220") },
        `${n * m} kesişim × 4 = ${4 * n * m} dik açı.`) })
      : N(`${n} yatay doğru ile ${m} düşey doğru birbirine dik kesişiyor. Kenarları bu doğrular üzerinde olan kaç farklı dikdörtgen vardır?`, comb(n, 2) * comb(m, 2), `Dikdörtgen için 2 yatay ve 2 düşey doğru seçilir: ${comb(n, 2)} × ${comb(m, 2)} = ${comb(n, 2) * comb(m, 2)}.`, svg(s, "0 0 360 220"), { hint: "Bir dikdörtgeni iki yatay ve iki düşey kenarı belirler.", sol: SOL("Her dikdörtgenin bir üst, bir alt (yatay) ve bir sol, bir sağ (düşey) kenarı vardır. Bu dört doğruyu seçmek dikdörtgeni belirler.",
        `${n} yatay doğrudan 2 tanesini seçmenin yolu: ${n} × ${n - 1} ÷ 2 = ${comb(n, 2)}.`,
        `${m} düşey doğrudan 2 tanesini seçmenin yolu: ${m} × ${m - 1} ÷ 2 = ${comb(m, 2)}.`,
        `Her yatay çift, her düşey çiftle ayrı bir dikdörtgen oluşturur: ${comb(n, 2)} × ${comb(m, 2)} = ${comb(n, 2) * comb(m, 2)}.`) });
  });
  add("dikme", 7, 8, (l) => {
    const a = ri(l === 7 ? 2 : 3, l === 7 ? 4 : 5), b = ri(l === 7 ? 2 : 3, l === 7 ? 4 : 5);
    const table = (block) => { const w = Array.from({ length: a + 1 }, () => Array(b + 1).fill(0)); for (let i = 0; i <= a; i++) for (let j = 0; j <= b; j++) { if (block && i === block[0] && j === block[1]) continue; w[i][j] = i === 0 && j === 0 ? 1 : (i ? w[i - 1][j] : 0) + (j ? w[i][j - 1] : 0); } return w; }, count = (block) => table(block)[a][b];
    const edges = (w) => w.map((col, i) => col.map((v, j) => (i === 0 || j === 0) ? v : null));
    const diag = (w, d) => w.map((col, i) => col.map((v, j) => (i + j <= d) ? v : null));
    if (l === 7) return N(`Sokaklar ${a} × ${b} kareli bir ağ oluşturuyor. A'dan B'ye yalnız sağa ve yukarı giderek kaç farklı en kısa yol vardır?`, count(), `Her kesişime gelen yol sayısı, solundaki ve altındaki kesişimlerin yol sayıları toplamıdır. B'ye ${count()} yol ulaşır.`, gridBoard(a, b, { ends: true }), { hint: "Kenardaki kesişimlere 1 yaz, sonra her kesişime solundaki ve altındakinin toplamını yaz.", sol: SOL("Bir kavşağa ya solundaki kavşaktan (sağa giderek) ya da altındaki kavşaktan (yukarı giderek) gelinir. Bu yüzden bir kavşağa gelen yol sayısı = soldakinin sayısı + alttakinin sayısı.",
        { t: `Alt kenardaki ve sol kenardaki kavşaklara tek bir yoldan gidilir (hep sağa ya da hep yukarı): hepsine 1 yaz.`, fig: gridBoard(a, b, { ends: true, nums: edges(table()) }) },
        { t: `İçerideki her kavşağa, solundaki ve altındaki sayıların toplamını yaz. A'dan uzaklaştıkça adım adım ilerle.`, fig: gridBoard(a, b, { ends: true, nums: diag(table(), Math.ceil((a + b) / 2) + 1) }) },
        { t: `Tablo tamamlanınca B'ye yazılan sayı yol sayısıdır: ${count()}.`, fig: gridBoard(a, b, { ends: true, nums: table() }) }) });
    const bx = ri(1, a - 1), by = ri(1, b - 1), ans = count([bx, by]);
    return N(`Sokaklar ${a} × ${b} kareli bir ağ oluşturuyor. Çarpı işaretli kavşak kapalı. A'dan B'ye yalnız sağa ve yukarı giderek kaç farklı en kısa yol vardır?`, ans, `Kapalı kavşağa 0 yazılır; diğer her kavşağa solundaki ve altındakinin toplamı yazılır. B'ye ${ans} yol ulaşır (kapalı olmasaydı ${count()}).`, gridBoard(a, b, { ends: true, block: [bx, by] }), { hint: "Kapalı kavşağa hiç yol gelmiyor say; toplamaya oradan devam et.", sol: SOL("Bir kavşağa gelen yol sayısı = solundaki kavşağın sayısı + altındaki kavşağın sayısı. Kapalı kavşaktan hiç yol geçemez; oraya 0 yazarız.",
        { t: `Kenarlara 1 yaz. Kapalı kavşağa 0 yaz: oradan geçen yol olamaz.`, fig: gridBoard(a, b, { ends: true, nums: edges(table([bx, by])).map((col, i) => col.map((v, j) => i === bx && j === by ? 0 : v)) }) },
        { t: `İçeriye doğru her kavşağa soldaki + alttaki sayıyı yaz. Kapalı kavşağın komşularına oradan 0 eklenir.`, fig: gridBoard(a, b, { ends: true, nums: diag(table([bx, by]), Math.ceil((a + b) / 2) + 1) }) },
        { t: `B'ye ulaşan yol sayısı ${ans}. (Kavşak açık olsaydı ${count()} yol olurdu; ${count() - ans} yol kapalı kavşaktan geçiyordu.)`, fig: gridBoard(a, b, { ends: true, nums: table([bx, by]) }) }) });
  });
  add("dikme", 8, 8, () => {
    const a = ri(3, 8), b = ri(3, 7);
    let ans = 0; const terms = [];
    for (let k = 1; k <= Math.min(a, b); k++) { ans += (a - k + 1) * (b - k + 1); terms.push(`${(a - k + 1) * (b - k + 1)}`); }
    return N(`${a} × ${b} birim karelik kareli bölgede, kenarları kare çizgileri üzerinde olan bütün boyutlardaki kareler sayılırsa toplam kaç kare vardır?`, ans, `1×1: ${a * b}, 2×2: ${(a - 1) * (b - 1)}, … k×k kare (${a} − k + 1) × (${b} − k + 1) tane. Toplam ${terms.join(" + ")} = ${ans}.`, gridBoard(a, b, { fill: "#fff4dc" }), { hint: "Kareleri boyutlarına göre ayrı ayrı say.", sol: SOL("Kareleri boyutlarına göre gruplayalım: önce 1×1, sonra 2×2, 3×3… Her boyut için karenin sol alt köşesinin kaç yere konabileceğini sayalım.",
      { t: `1×1 kareler: ${a} × ${b} = ${a * b} tane.`, fig: gridBoard(a, b, { fill: "#fff4dc", sq: [{ x: 0, y: 0, k: 1, color: CORAL }, { x: 1, y: 0, k: 1, color: CORAL }] }) },
      { t: `2×2 kare yatayda ${a - 1}, düşeyde ${b - 1} farklı yere kayabilir: ${a - 1} × ${b - 1} = ${(a - 1) * (b - 1)} tane.`, fig: gridBoard(a, b, { fill: "#fff4dc", sq: [{ x: 0, y: 0, k: 2, color: BLUE }, { x: 1, y: 1, k: 2, color: TEAL }] }) },
      `Genel kural: k×k kareden (${a} − k + 1) × (${b} − k + 1) tane vardır. En büyük kare ${Math.min(a, b)}×${Math.min(a, b)}.`,
      { t: `Tablo: ${terms.map((t, i) => `${i + 1}×${i + 1} → ${t}`).join(", ")}.`, fig: solTable(["Boyut", "Sayı"], terms.map((t, i) => [`${i + 1}×${i + 1}`, t]), ["Toplam", ans]) },
      `Toplam ${terms.join(" + ")} = ${ans}.`) });
  });

  // 5. Paralel doğrular
  add("paralel", 6, 7, (l) => {
    const n = ri(3, 12), m = l === 6 ? 2 : ri(3, 4), ans = n * m + comb(m, 2);
    if (rnd() < .4) return N(`Birkaç paralel doğruyu ${m} kesen kesiyor. Kesenlerin hiçbir ikisi paralel değil ve hiçbir üç doğru aynı noktadan geçmiyor. Toplam ${ans} kesişim noktası var. Kaç paralel doğru vardır?`, n, `Kesenler kendi aralarında ${comb(m, 2)} noktada kesişir. Kalan ${ans - comb(m, 2)} kesişim paralellerle olur; her paralel ${m} kesenle kesişir: ${ans - comb(m, 2)} ÷ ${m} = ${n}.`,
      linesFig([{ kind: "par", count: Math.min(n, 8), deg: 8 }, { kind: "free", count: m }]), { hint: "Önce kesenlerin kendi aralarındaki kesişimleri çıkar.", sol: SOL("Kesişimler iki türlü: kesen–kesen ve kesen–paralel. Bilinen türü çıkarınca kalan, paralel sayısını verir.",
        `Kesenler hiçbiri paralel olmadığı için ikişer ikişer kesişir: ${m} kesenden ${comb(m, 2)} çift → ${comb(m, 2)} nokta.`,
        `Geriye ${ans} − ${comb(m, 2)} = ${ans - comb(m, 2)} kesişim kalır; bunlar kesenlerin paralellerle kesişimleri.`,
        { t: `Her paralel doğru, ${m} kesenin her birini bir kez keser: paralel başına ${m} nokta. ${ans - comb(m, 2)} ÷ ${m} = ${n} paralel doğru.`, fig: linesFig([{ kind: "par", count: Math.min(n, 8), deg: 8 }, { kind: "free", count: m }]) }) });
    return N(`${n} paralel doğruyu ${m} kesen kesiyor. Kesenlerin hiçbir ikisi paralel değil ve hiçbir üç doğru aynı noktadan geçmiyor. Toplam kaç kesişim noktası vardır?`, ans, `Her kesen ${n} paraleli keser: ${m} × ${n} = ${n * m}. Kesenler kendi aralarında ${comb(m, 2)} noktada kesişir. Toplam ${ans}.`,
      linesFig([{ kind: "par", count: Math.min(n, 8), deg: 8 }, { kind: "free", count: m }]), { hint: "Paralel–kesen ve kesen–kesen kesişimlerini ayrı say.", sol: SOL("Kesişimleri iki gruba ayıralım: kesenlerin paralellerle kesişimleri ve kesenlerin kendi aralarındaki kesişimleri. Paraleller birbirini hiç kesmez.",
        { t: `Her kesen ${n} paralelin hepsini keser: ${m} × ${n} = ${n * m} nokta.`, fig: linesFig([{ kind: "par", count: Math.min(n, 8), deg: 8 }, { kind: "free", count: 1 }]) },
        `Kesenler kendi aralarında: ${m} kesenden ${comb(m, 2)} çift, her çift 1 nokta → ${comb(m, 2)}. (Üç doğru aynı noktadan geçmediği için noktalar çakışmaz.)`,
        `Toplam ${n * m} + ${comb(m, 2)} = ${ans}.`) });
  });
  add("paralel", 6, 8, (l) => {
    const n = ri(2, l === 6 ? 14 : 8), m = l - 5, ans = n + 1 + m * n + m * (m + 1) / 2;
    return N(`${n} paralel doğru ve bunları kesen ${m} doğru çiziliyor.${m > 1 ? " Kesenlerin hiçbir ikisi paralel değil ve hiçbir üç doğru aynı noktadan geçmiyor." : ""} Bu doğrular düzlemi kaç bölgeye ayırır?`, ans,
      `${n} paralel doğru ${n + 1} bölge oluşturur. Kesen doğru, geçtiği her aralıkta bir bölgeyi ikiye böler: k. kesen ${n} + k bölge ekler. ${n + 1}${Array.from({ length: m }, (_, i) => ` + ${n + i + 1}`).join("")} = ${ans}.`,
      linesFig([{ kind: "par", count: Math.min(n, 8), deg: 0 }, { kind: "free", count: m }]), { hint: "Yeni bir doğru, kesiştiği nokta sayısından 1 fazla bölge ekler.", sol: SOL("Doğruları tek tek çizelim. Yeni çizilen doğru, kestiği noktalarla parçalara ayrılır; her parça içinden geçtiği bölgeyi ikiye böler.",
        { t: `Önce yalnız paraleller: ${n} paralel doğru düzlemi ${n + 1} şeride ayırır.`, fig: linesFig([{ kind: "par", count: Math.min(n, 8), deg: 0 }]) },
        ...Array.from({ length: m }, (_, i) => ({ t: `${i + 1}. kesen ${n} paraleli${i ? ` ve önceki ${i} keseni` : ""} keser: ${n + i} kesişim noktası. Bu noktalar keseni ${n + i + 1} parçaya böler; her parça bir bölgeyi ikiye ayırır: +${n + i + 1} bölge.`, fig: i === m - 1 ? linesFig([{ kind: "par", count: Math.min(n, 8), deg: 0 }, { kind: "free", count: m }]) : undefined })),
        `Toplam ${n + 1}${Array.from({ length: m }, (_, i) => ` + ${n + i + 1}`).join("")} = ${ans} bölge.`) });
  });
  add("paralel", 7, 8, (l) => {
    const n = ri(4, 6), d = ri(1, 9), T = d * n * (n - 1) / 2;
    let s = "", y = 20;
    const unit = 190 / (n * (n - 1) / 2);
    for (let i = 0; i < n; i++) { s += line(30, y, 330, y, { color: [BLUE, TEAL, GRAPE][i % 3], w: 4 }); if (i < n - 1) { s += text(345, y + (i + 1) * unit / 2, (i + 1) + "d", { size: 13, anchor: "end", fill: CORAL }); y += (i + 1) * unit; } }
    if (l === 7) return N(`${n} paralel doğru çiziliyor. Ardışık doğrular arasındaki uzaklıklar sırasıyla d, 2d, 3d, … oluyor. İlk ile son doğru arası ${T} cm. d kaç cm?`, d, `Aralıklar d + 2d + … + ${n - 1}d = ${n * (n - 1) / 2}d = ${T}. d = ${d}.`, svg(s, "0 0 360 230"), { unit: "cm", sol: SOL("İlk doğrudan son doğruya giderken bütün aralıkları geçeriz. Aralıkları d cinsinden toplayalım.",
      { t: `${n} doğru arasında ${n - 1} aralık var: d, 2d, …, ${n - 1}d.`, fig: svg(s, "0 0 360 230") },
      `Toplam: (1 + 2 + … + ${n - 1}) × d = ${n * (n - 1) / 2} × d.`,
      `${n * (n - 1) / 2} × d = ${T} → d = ${T} ÷ ${n * (n - 1) / 2} = ${d} cm.`) });
    return N(`${n} paralel doğru çiziliyor. Ardışık doğrular arasındaki uzaklıklar sırasıyla d, 2d, 3d, … oluyor. İlk ile son doğru arası ${T} cm. İkinci doğru ile son doğru arası kaç cm?`, T - d, `${n * (n - 1) / 2}d = ${T} → d = ${d}. İkinci ile son arası ilk aralık hariç: ${T} − ${d} = ${T - d}.`, svg(s, "0 0 360 230"), { unit: "cm", sol: SOL("Önce d'yi bulalım; sonra ikinci doğrudan sona kadar olan aralıkları toplayalım.",
      `${n - 1} aralık: d + 2d + … + ${n - 1}d = ${n * (n - 1) / 2}d = ${T} → d = ${d} cm.`,
      { t: `İkinci doğrudan son doğruya kadar, ilk aralık (d) dışındaki bütün aralıklar var.`, fig: svg(s, "0 0 360 230") },
      `${T} − ${d} = ${T - d} cm.`) });
  });
  add("paralel", 8, 8, () => {
    const a = ri(2, 4), b = ri(2, 4), c = ri(2, 4), ans = comb(a, 2) * comb(b, 2) + comb(a, 2) * comb(c, 2) + comb(b, 2) * comb(c, 2);
    return N(`Üç farklı doğrultuda paralel doğru aileleri var: ${a}, ${b} ve ${c} doğru. Farklı ailelerden doğrular kesişir; hiçbir üç doğru aynı noktadan geçmiyor. Kenarları bu doğrular üzerinde olan kaç paralelkenar vardır?`, ans,
      `Paralelkenar için iki aileden ikişer doğru seçilir: ${comb(a, 2)} × ${comb(b, 2)} + ${comb(a, 2)} × ${comb(c, 2)} + ${comb(b, 2)} × ${comb(c, 2)} = ${ans}.`,
      linesFig([{ kind: "par", count: a, deg: 0 }, { kind: "par", count: b, deg: 60 }, { kind: "par", count: c, deg: 125 }]), { hint: "Bir paralelkenarın karşılıklı kenarları aynı aileden gelir.", sol: SOL("Paralelkenarın karşılıklı kenarları paraleldir. Yani paralelkenar, iki farklı aileden ikişer doğru seçerek oluşur.",
      `Bir aileden 2 doğru seçme yolları: ${a} doğrudan ${comb(a, 2)}, ${b} doğrudan ${comb(b, 2)}, ${c} doğrudan ${comb(c, 2)}.`,
      { t: `Kırmızı ve mavi ailelerden: ${comb(a, 2)} × ${comb(b, 2)} = ${comb(a, 2) * comb(b, 2)} paralelkenar.`, fig: linesFig([{ kind: "par", count: a, deg: 0 }, { kind: "par", count: b, deg: 60 }]) },
      `Kırmızı ve yeşil: ${comb(a, 2)} × ${comb(c, 2)} = ${comb(a, 2) * comb(c, 2)}. Mavi ve yeşil: ${comb(b, 2)} × ${comb(c, 2)} = ${comb(b, 2) * comb(c, 2)}.`,
      `Toplam ${comb(a, 2) * comb(b, 2)} + ${comb(a, 2) * comb(c, 2)} + ${comb(b, 2) * comb(c, 2)} = ${ans}.`) });
  });

  // 6. Açı ölçme
  add("olcme", 6, 7, (l) => {
    const p = ri(1, 16) * 5, q = p + 2 * ri(8, Math.floor((175 - p) / 2));
    const mid = (p + q) / 2, ans = l === 6 ? mid : 180 - mid;
    const html = G.protractor(q).replace("</svg>", `${ray(180, 205, p, 155, BLUE, 5, "ar-draw")}${ray(180, 205, mid, 130, TEAL, 3)}${text(...P(180, 205, mid, 112), "?", { size: 20, fill: TEAL })}</svg>`);
    return N(`İletkide OA ışını ${p}°, OB ışını ${q}° gösteriyor (ölçek sağdaki 0'dan başlıyor). ∠AOB'nin açıortayı ${l === 6 ? "bu ölçekte kaç dereceyi gösterir" : "soldaki 0'dan başlayan ölçekte kaç dereceyi gösterir"}?`, ans,
      `∠AOB = ${q} − ${p} = ${q - p}°, yarısı ${(q - p) / 2}°. Açıortay sağdan ${p} + ${(q - p) / 2} = ${mid}°.${l === 7 ? ` Soldan ölçülünce 180 − ${mid} = ${ans}.` : ""}`, html, { unit: "°", hint: "Açıortay iki ışının ölçeklerinin tam ortasındadır.", sol: SOL("Açıortay, iki ışının tam ortasındadır; ölçekte iki okumanın ortalamasını gösterir.",
      `∠AOB = ${q} − ${p} = ${q - p}°. Açıortay bu açıyı ${(q - p) / 2}° + ${(q - p) / 2}° diye ikiye böler.`,
      { t: `Açıortay OA'dan ${(q - p) / 2}° ileride: ${p} + ${(q - p) / 2} = ${mid}°. (Kısaca: (${p} + ${q}) ÷ 2 = ${mid}.)`, fig: html },
      l === 7 ? `Soldaki 0'dan ölçen ölçekte her okuma 180'den çıkarılarak bulunur: 180 − ${mid} = ${ans}°.` : null) });
  });
  add("olcme", 6, 8, (l) => {
    if (l === 8) {
      const n = ri(12, 40), m = ri(8, n - 1);
      if (gcd(n, m) === m || gcd(n, m) === 1 && n * m > 600) return null;
      const L = n * m / gcd(n, m), turns = L / n;
      return N(`${n} dişli ve ${m} dişli iki çark birbirini döndürüyor. Başlangıçta ikisinin de boyalı dişi temas noktasında. Boyalı dişler en erken tekrar karşılaştığında büyük çark kaç tam tur dönmüş olur?`, turns,
        `Temas eden diş sayısı iki çarkın diş sayısının ortak katı olmalı. En küçük ortak kat ${L}. Büyük çark ${L} ÷ ${n} = ${turns} tur döner.`, boxes([{ icon: "⚙️", label: `${n} diş` }, { icon: "⚙️", label: `${m} diş` }, { icon: "🎯", label: "boyalı dişler karşı karşıya" }]), { hint: "Her turda büyük çark kaç diş ilerletir? Küçük çarkın tur tamamlaması için kaç diş geçmeli?", sol: SOL("İki çark birbirini döndürürken temas noktasından ikisinde de aynı sayıda diş geçer. Boyalı dişler, iki çark da tam tur attığında yeniden buluşur.",
          `Büyük çark tam tur atınca temas noktasından ${n}, ${2 * n}, ${3 * n}, … diş geçer (${ek(n, "in")} katları).`,
          `Küçük çarkın boyalı dişi de geri gelmeli: geçen diş sayısı ${ek(m, "in")} katı olmalı.`,
          { t: `Hem ${ek(n, "in")} hem ${ek(m, "in")} katı olan en küçük sayı: ${L}. Katları yazıp karşılaştır: ${n}, ${2 * n}, ${3 * n}, … ve ${m}, ${2 * m}, ${3 * m}, …`, fig: solTable([`${n} diş (büyük)`, `${m} diş (küçük)`], Array.from({ length: Math.min(4, turns) }, (_, i) => [n * (i + 1), m * (i + 1)]), turns > 4 ? [`… ${L}`, `… ${L}`] : null) },
          `Büyük çark ${L} ÷ ${n} = ${turns} tur döner (küçük çark ${L / m} tur).`) });
    }
    const n = ri(2, 6) * 6, m = pick([4, 6, 8, 9, 12, 15, 18].filter((x) => x < n)), k = ri(1, 5);
    if (l === 6) {
      const deg = 360 * k * n / m;
      if (!Number.isInteger(deg)) return null;
      return N(`${n} dişli çark, ${m} dişli çarkı döndürüyor. Büyük çark ${k} tam tur dönünce küçük çark kaç derece döner?`, deg, `Büyük çark ${k} × ${n} = ${k * n} diş ilerletir. Küçük çark ${k * n} ÷ ${m} tur = ${k * n / m} tur → ${k * n / m} × 360 = ${deg}°.`, boxes([{ icon: "⚙️", label: `${n} diş · ${k} tur` }, { icon: "⚙️", label: `${m} diş · ?°` }]), { unit: "°", sol: SOL("Birbirini döndüren çarklarda iki çarktan da aynı sayıda diş geçer. Önce geçen dişleri sayalım.",
        `Büyük çark bir turda ${n} diş ilerletir; ${k} turda ${k} × ${n} = ${k * n} diş.`,
        `Küçük çark ${m} dişte bir tam tur atar: ${k * n} ÷ ${m} = ${k * n / m} tur.`,
        `Bir tur 360°: ${k * n / m} × 360 = ${deg}°.`) });
    }
    const mid = ri(10, 30), last = pick([4, 5, 6, 8, 9, 10, 12, 15, 16, 18]), turns = k * n / last;
    if (!Number.isInteger(turns) || mid === n || mid === last) return null;
    return N(`Üç çark sırayla birbirini döndürüyor: ${n} dişli, ${mid} dişli ve ${last} dişli. İlk çark ${k} tam tur dönünce son çark kaç tam tur döner?`, turns, `Aradaki çark yalnız dişleri aktarır: her çark aynı sayıda diş ilerler. İlk çark ${k} × ${n} = ${k * n} diş ilerletir; son çark ${k * n} ÷ ${last} = ${turns} tur döner.`, boxes([{ icon: "⚙️", label: `${n} diş · ${k} tur` }, { icon: "⚙️", label: `${mid} diş` }, { icon: "⚙️", label: `${last} diş · ? tur` }]), { unit: "tur", hint: "Ortadaki çarkın diş sayısı sonucu değiştirir mi?", sol: SOL("Çarklar sırayla dönerken her temas noktasından aynı sayıda diş geçer; ortadaki çark yalnız dişleri bir sonrakine aktarır.",
      `İlk çark ${k} turda ${k} × ${n} = ${k * n} diş ilerletir. Ortadaki çarktan da ${k * n} diş geçer (o kaç tur dönerse dönsün).`,
      `Son çarktan da ${k * n} diş geçer. ${last} dişte bir tur: ${k * n} ÷ ${last} = ${turns} tur.`,
      `Dikkat: ortadaki çarkın ${mid} dişi sonucu değiştirmedi.`) });
  });
  add("olcme", 7, 8, (l) => {
    if (l === 7) {
      const n = pick([5, 6, 8, 9, 10, 12, 15, 18, 20, 24]), a = 360 / n;
      return N(`Bir robot ${ri(2, 9)} m ilerleyip ${a}° sola dönüyor ve bunu tekrar ediyor. İlk kez başladığı noktaya ve yöne döndüğünde kaç kez dönmüş olur?`, n, `Toplam dönüş tam tur (360°) olmalı: 360 ÷ ${a} = ${n}. Robot düzgün ${n}-gen çizer.`, boxes([{ icon: "🤖", label: "ilerle" }, { icon: "↺", label: `${a}° sola` }, { icon: "🔁", label: "tekrar et" }]), { hint: "Kapalı bir çokgende dönüşlerin toplamı kaç derecedir?", sol: SOL("Robot başladığı yere ve yöne döndüğünde, yön olarak tam bir tur atmış olur: dönüşlerin toplamı 360°.",
        { t: `Her dönüş ${a}°. n dönüş: ${a} × n = 360.`, fig: turtleFig(a, n) },
        `n = 360 ÷ ${a} = ${n}. Robot ${n} kenarlı düzgün bir çokgen çizer.`) });
    }
    const a = pick([40, 72, 80, 100, 108, 135, 144, 150, 160, 165, 168, 175, 100, 132, 156]), ans = 360 / gcd(a, 360);
    return N(`Bir robot her adımda ${a}° sola dönüyor. Başlangıçta kuzeye bakıyor. En az kaç adım sonra yeniden kuzeye bakar?`, ans, `Toplam dönüş 360°'nin katı olmalı: ${a} × n. ${a} ile 360'ın en büyük ortak böleni ${gcd(a, 360)}; en küçük n = 360 ÷ ${gcd(a, 360)} = ${ans}.`, boxes([{ icon: "🧭", label: "kuzey" }, { icon: "↺", label: `her adım ${a}°` }, { icon: "❓", label: "kaç adım?" }]), { hint: `${ek(a, "in")} hangi katı 360'ın katıdır?`, sol: SOL("Robot yeniden kuzeye baktığında toplam dönüşü 360°, 720°, 1080°… yani tam turların katı olur.",
      `n adımda toplam dönüş ${a} × n derece. Bu sayı 360'ın katı olmalı.`,
      { t: `Katları dene: ${Array.from({ length: Math.min(ans, 6) }, (_, i) => `${a} × ${i + 1} = ${a * (i + 1)}`).join(", ")}${ans > 6 ? ", …" : ""}. İlk kez 360'ın katı olan: ${a} × ${ans} = ${a * ans} = ${a * ans / 360} tam tur.`, fig: turtleFig(a, ans) },
      `Kısa yol: ${a} ile 360'ın en büyük ortak böleni ${gcd(a, 360)}. n = 360 ÷ ${gcd(a, 360)} = ${ans}.`) });
  });
  add("olcme", 8, 8, () => {
    if (rnd() < .5) {
      const t = 2 * ri(15, 330), raw = (11 * t / 2) % 360, ans = Math.min(raw, 360 - raw), h = Math.floor(t / 60), m = t % 60;
      return N(`Saat 12.00'de akrep ile yelkovan üst üste. ${t} dakika sonra aralarındaki küçük açı kaç derecedir?`, ans,
        `Yelkovan dakikada 6°, akrep 0,5° döner; aradaki fark dakikada 5,5° açılır. ${t} × 5,5 = ${11 * t / 2}°. 360'ın katlarını at: ${raw}°. Küçük açı ${ans}°.`, clockHM(h, m), { unit: "°", hint: "Yelkovan akrebe göre dakikada kaç derece öne geçer?", sol: SOL("İki ibre aynı yöne döner; aradaki açı, yelkovanın akrebi ne kadar geçtiğine bağlıdır.",
        `Yelkovan 60 dakikada 360° döner: dakikada 6°. Akrep 12 saatte (720 dakika) 360° döner: dakikada 0,5°.`,
        `Yelkovan akrebi dakikada 6 − 0,5 = 5,5° geçer. ${t} dakikada ${t} × 5,5 = ${11 * t / 2}°.`,
        { t: `Tam turları (360°) atınca kalan fark ${raw}°. ${raw > 180 ? `Bu 180°'den büyük; küçük açı 360 − ${raw} = ${ans}°.` : `Küçük açı ${ans}°.`}`, fig: clockHM(h, m) }) });
    }
    const t = ri(5, 60), ans = Math.floor(11 * t / 12);
    return N(`Saat 12.00'de akrep ile yelkovan üst üste. Sonraki ${t} saat içinde (başlangıç hariç) akrep ile yelkovan kaç kez üst üste gelir?`, ans,
      `Yelkovan her turda akrebi bir kez geçer; 12 saatte 11 kez üst üste gelirler, yani her 12/11 saatte bir. ${t} ÷ (12/11) = ${(11 * t / 12).toFixed(2).replace(".", ",")} → ${ans} kez.`, clockHM(0, 0), { hint: "12 saatte yelkovan 12 tur, akrep 1 tur atar. Yelkovan akrebi kaç kez yakalar?", sol: SOL("Yelkovan bir koşu pistinde akrebi tur bindirerek geçen hızlı bir koşucu gibidir. Her geçişte ibreler üst üste gelir.",
      `12 saatte yelkovan 12 tur, akrep 1 tur atar. Yelkovan akrebe göre 12 − 1 = 11 tur fazla atar: 12 saatte 11 kez üst üste gelirler.`,
      `Buluşmalar eşit aralıklarla olur: her 12/11 saatte bir (yaklaşık 1 saat 5 dakika). İlk buluşma ≈ 1.05, sonra ≈ 2.11, ≈ 3.16…`,
      `${t} saatte kaç tane 12/11 saat sığar? ${t} × 11 ÷ 12 = ${(11 * t / 12).toFixed(2).replace(".", ",")}. Tam kısmı ${ans}.`) });
  });

  // 7. Doğruların durumu
  add("durum", 6, 7, (l) => {
    const n = l === 6 ? ri(3, 7) : ri(5, 9), pairs = rnd() < .5;
    return N(`${n} doğru tek bir noktada kesişiyor. Bu noktanın çevresinde ${pairs ? "kaç çift ters açı" : "ölçüsü 180°'den küçük kaç açı"} vardır?`, pairs ? n * (n - 1) : 2 * n * (n - 1),
      `Noktadan ${2 * n} ışın çıkar. İki ışın seçmenin yolu ${comb(2 * n, 2)}; bunların ${n} tanesi aynı doğrudadır (180°). Kalan ${2 * n * (n - 1)} açı 180°'den küçüktür.${pairs ? ` Bunlar ters açılarla eşleşir: ${2 * n * (n - 1)} ÷ 2 = ${n * (n - 1)} çift.` : ""}`,
      linesFig([{ kind: "con", count: n, at: [180, 110], deg0: 10 }]), { hint: "Her doğru iki ışın verir. Işın çiftlerini say, doğru açıları çıkar.", sol: SOL("Kesişme noktasından çıkan ışınları sayalım; her iki ışın bir açı oluşturur.",
      `${n} doğrunun her biri noktada iki ışına ayrılır: ${2 * n} ışın.`,
      `İki ışın seçmenin yolu ${2 * n} × ${2 * n - 1} ÷ 2 = ${comb(2 * n, 2)}.`,
      `Bunlardan ${n} tanesi aynı doğrunun iki ucu: bu ışınlar 180° yapar, sayılmaz. ${comb(2 * n, 2)} − ${n} = ${2 * n * (n - 1)} açı 180°'den küçük.`,
      pairs ? `Her açının tam karşısında ona eşit bir ters açı vardır; açılar ikişer ikişer eşleşir: ${2 * n * (n - 1)} ÷ 2 = ${n * (n - 1)} çift.` : null) });
  });
  add("durum", 6, 8, (l) => {
    const n = ri(l === 6 ? 5 : 6, l === 6 ? 14 : 10), k = ri(2, 4);
    if (l === 6) return N(`${n} doğrudan ${k} tanesi birbirine paralel; diğerleri hiçbir doğruya paralel değil ve hiçbir üç doğru aynı noktadan geçmiyor. Kaç kesişim noktası vardır?`, comb(n, 2) - comb(k, 2), `Paralel olmasalardı ${comb(n, 2)} nokta olurdu. Paralel ${k} doğru arasındaki ${comb(k, 2)} kesişim yok: ${comb(n, 2) - comb(k, 2)}.`, linesFig([{ kind: "par", count: k, deg: 15 }, { kind: "free", count: n - k }]), { hint: "Önce bütün doğru çiftlerini say, sonra kesişmeyen çiftleri çıkar.", sol: SOL("Her iki doğru en çok bir noktada kesişir. Önce paralellik yokmuş gibi sayalım, sonra kesişmeyen çiftleri çıkaralım.",
      `${n} doğrudan 2 doğru seçmenin yolu: ${n} × ${n - 1} ÷ 2 = ${comb(n, 2)}. Üç doğru aynı noktadan geçmediği için her çift ayrı bir nokta verirdi.`,
      { t: `Paralel ${k} doğru birbirini kesmez: ${comb(k, 2)} çift kesişmiyor.`, fig: linesFig([{ kind: "par", count: k, deg: 15 }]) },
      `${comb(n, 2)} − ${comb(k, 2)} = ${comb(n, 2) - comb(k, 2)} kesişim noktası.`) });
    if (l === 7) {
      const k2 = ri(2, 3); if (k + k2 > n) return null;
      const ans = comb(n, 2) - comb(k, 2) - comb(k2, 2);
      return N(`${n} doğrudan ${k} tanesi bir doğrultuda, ${k2} tanesi başka bir doğrultuda paralel. Diğer paralellik yok ve hiçbir üç doğru aynı noktadan geçmiyor. Kaç kesişim noktası vardır?`, ans, `Bütün çiftler ${comb(n, 2)}. Kesişmeyen çiftler ${comb(k, 2)} + ${comb(k2, 2)}. ${ans}.`, linesFig([{ kind: "par", count: k, deg: 15 }, { kind: "par", count: k2, deg: 100 }, { kind: "free", count: n - k - k2 }]), { sol: SOL("Bütün doğru çiftlerini sayıp kesişmeyen (paralel) çiftleri çıkaralım.",
        `${n} doğrudan ${comb(n, 2)} çift seçilir.`,
        `Birinci paralel ailede ${k} doğru: ${comb(k, 2)} çift kesişmez. İkinci ailede ${k2} doğru: ${comb(k2, 2)} çift kesişmez.`,
        `Farklı ailelerden doğrular kesişir. ${comb(n, 2)} − ${comb(k, 2)} − ${comb(k2, 2)} = ${ans}.`) });
    }
    const c = ri(3, 4); if (k + c > n) return null;
    const ans = comb(n, 2) - comb(k, 2) - comb(c, 2) + 1;
    return N(`${n} doğrudan ${k} tanesi birbirine paralel; başka ${c} tanesi aynı noktadan geçiyor. Bunların dışında paralellik yok ve başka hiçbir üç doğru aynı noktadan geçmiyor. Kaç kesişim noktası vardır?`, ans,
      `Genel durumda ${comb(n, 2)} nokta. Paraleller ${comb(k, 2)} noktayı yok eder. Aynı noktadan geçen ${c} doğrunun ${comb(c, 2)} kesişimi tek noktada birleşir: ${comb(c, 2)} − 1 nokta eksilir. ${comb(n, 2)} − ${comb(k, 2)} − ${comb(c, 2) - 1} = ${ans}.`,
      linesFig([{ kind: "par", count: k, deg: 20 }, { kind: "con", count: c, at: [250, 70], deg0: 50 }, { kind: "free", count: n - k - c }]), { hint: "Paralellerin ve ortak noktadan geçenlerin sayıyı nasıl azalttığını ayrı düşün.", sol: SOL("Önce her doğru çiftinin ayrı noktada kesiştiğini düşünelim; sonra iki özel durumun sayıyı ne kadar azalttığını bulalım.",
        `Genel durumda ${n} doğru ${comb(n, 2)} noktada kesişirdi.`,
        `Paralel ${k} doğru: ${comb(k, 2)} çift hiç kesişmez → ${comb(k, 2)} nokta eksilir.`,
        { t: `Aynı noktadan geçen ${c} doğru: ${comb(c, 2)} çiftin kesişimi tek bir noktada toplanır. ${comb(c, 2)} nokta yerine 1 nokta → ${comb(c, 2) - 1} eksilir.`, fig: linesFig([{ kind: "con", count: c, at: [180, 110], deg0: 20 }]) },
        `${comb(n, 2)} − ${comb(k, 2)} − ${comb(c, 2) - 1} = ${ans}.`) });
  });
  add("durum", 7, 8, (l) => {
    const n = l === 7 ? ri(4, 8) : ri(6, 12), k = l === 8 ? ri(2, 4) : 0, I = comb(n, 2) - comb(k, 2), ans = 1 + n + I;
    return N(`${n} doğru çiziliyor.${k ? ` Bunlardan ${k} tanesi birbirine paralel, başka paralellik yok.` : " Hiçbir ikisi paralel değil."} Hiçbir üç doğru aynı noktadan geçmiyor. Bu doğrular düzlemi kaç bölgeye ayırır?`, ans,
      `Her yeni doğru, kestiği nokta sayısından 1 fazla bölge ekler. Bölge sayısı = 1 + doğru sayısı + kesişim sayısı = 1 + ${n} + ${I} = ${ans}.`,
      linesFig(k ? [{ kind: "par", count: k, deg: 25 }, { kind: "free", count: n - k }] : [{ kind: "free", count: n }]), { hint: "Doğruları tek tek ekle; her biri kaç bölgeyi ikiye böler?", sol: SOL("Hiç doğru yokken düzlem 1 bölgedir. Yeni bir doğru, kestiği noktalarla parçalara ayrılır; her parça bir bölgeyi ikiye böler.",
        `Bir doğru k noktada kesilirse k + 1 parçaya ayrılır ve k + 1 yeni bölge ekler. Yani her doğru 1 bölge, her kesişim noktası da 1 bölge ekler.`,
        `Bölge sayısı = 1 + (doğru sayısı) + (kesişim sayısı).`,
        { t: `Kesişim sayısı: ${n} doğrudan ${comb(n, 2)} çift${k ? `, paralel ${comb(k, 2)} çift kesişmez: ${comb(n, 2)} − ${comb(k, 2)}` : ""} = ${I}.`, fig: linesFig(k ? [{ kind: "par", count: k, deg: 25 }, { kind: "free", count: n - k }] : [{ kind: "free", count: n }]) },
        `Bölge sayısı 1 + ${n} + ${I} = ${ans}.`) });
  });
  add("durum", 8, 8, () => {
    const n = ri(5, 10), k = ri(0, 3), ans = comb(n, 3) - comb(k, 2) * (n - k) - comb(k, 3);
    return N(`${n} doğru çiziliyor.${k >= 2 ? ` Bunlardan ${k} tanesi birbirine paralel, başka paralellik yok.` : " Hiçbir ikisi paralel değil."} Hiçbir üç doğru aynı noktadan geçmiyor. Bu doğrulardan üçü seçilerek kaç farklı üçgen oluşturulabilir?`, k >= 2 ? ans : comb(n, 3),
      k >= 2 ? `Üç doğru seçmenin yolu ${comb(n, 3)}. İçinde iki paralel bulunan seçimler üçgen olmaz: ${comb(k, 2)} × ${n - k}${k === 3 ? " + 1 (üçü de paralel)" : ""}. ${ans}.` : `Paralellik ve ortak nokta yok; her üç doğru bir üçgen oluşturur: ${n} × ${n - 1} × ${n - 2} ÷ 6 = ${comb(n, 3)}.`,
      linesFig(k >= 2 ? [{ kind: "par", count: k, deg: 25 }, { kind: "free", count: n - k }] : [{ kind: "free", count: n }]), { hint: "Üç doğru ikişer ikişer kesişip farklı noktalarda buluşursa üçgen oluşur.", sol: SOL("Seçilen üç doğru ikişer ikişer kesişirse ve üç kesişim farklıysa bir üçgen oluşur. Üç doğrunun aynı noktadan geçmediği verilmiş; yalnız paralelliğe dikkat etmeliyiz.",
      `${n} doğrudan 3 doğru seçmenin yolu: ${n} × ${n - 1} × ${n - 2} ÷ 6 = ${comb(n, 3)}.`,
      k >= 2 ? { t: `İçinde iki paralel doğru olan üçlüler üçgen olmaz. ${k} paralelden 2'si (${comb(k, 2)} yol) ve diğer ${n - k} doğrudan 1'i: ${comb(k, 2)} × ${n - k} = ${comb(k, 2) * (n - k)}.${k === 3 ? " Üçü de paralel olan 1 seçim de bozuk." : ""}`, fig: linesFig([{ kind: "par", count: k, deg: 25 }, { kind: "free", count: 1 }]) } : `Hiç paralel yok; her üçlü bir üçgen verir.`,
      k >= 2 ? `${comb(n, 3)} − ${comb(k, 2) * (n - k)}${k === 3 ? " − 1" : ""} = ${ans}.` : `Cevap ${comb(n, 3)}.`) });
  });

  // 8. Tümler, bütünler ve ters açılar
  add("cift", 6, 7, (l) => {
    if (l === 6) {
      if (rnd() < .5) {
        const k = pick([3, 4, 6, 7, 10, 11, 16, 19, 31]), x = 90 - 90 / (k - 1);
        return N(`Bir açının bütünleri, tümlerinin ${k} katıdır. Açı kaç derecedir?`, x, `Bütünler − tümler = 90°. Bütünler ${k} pay, tümler 1 pay ise aradaki ${k - 1} pay 90°: bir pay ${90 / (k - 1)}°. Tümler ${90 / (k - 1)}, açı ${x}.`,
          bars([{ name: "tümler", parts: [{ w: 1, label: "?" }] }, { name: "bütünler", parts: Array.from({ length: k }, () => ({ w: 1, fill: LIGHT.gold, stroke: GOLD })) }], { note: "fark 90°" }), { unit: "°", sol: SOL("Bir açının bütünleri her zaman tümlerinden 90° fazladır: (180 − x) − (90 − x) = 90.",
          { t: `Tümlere 1 pay dersek bütünler ${k} pay. Aradaki fark ${k} − 1 = ${k - 1} pay ve bu fark 90°.`, fig: bars([{ name: "tümler", parts: [{ w: 1, label: "1 pay" }] }, { name: "bütünler", parts: [{ w: 1, label: "1 pay" }, { w: k - 1, label: "90°", fill: LIGHT.gold, stroke: GOLD }] }]) },
          `Bir pay 90 ÷ ${k - 1} = ${90 / (k - 1)}°. Tümler ${90 / (k - 1)}°.`,
          `Açı = 90 − tümler = 90 − ${90 / (k - 1)} = ${x}°.`) });
      }
      const k = pick([3, 4, 7, 8, 13, 16, 25, 28, 43, 52]), x = 270 / (k + 2);
      return N(`Bir açının bütünleri ile tümlerinin toplamı, açının ${k} katıdır. Açı kaç derecedir?`, x, `Bütünler + tümler = (180 − x) + (90 − x) = 270 − 2x = ${k}x. 270 = ${k + 2}x, x = ${x}.`, noteFig(["(180 − x) + (90 − x)", `= ${k} · x`, "x = ?"]), { unit: "°", sol: SOL("Tümleri ve bütünleri x ile yazıp eşitlik kuralım.",
        `Tümler 90 − x, bütünler 180 − x. Toplamları 270 − 2x.`,
        `270 − 2x = ${k}x → iki tarafa 2x ekle: 270 = ${k + 2}x.`,
        `x = 270 ÷ ${k + 2} = ${x}°. (Kontrol: ${180 - x} + ${90 - x} = ${270 - 2 * x} = ${k} × ${x}.)`) });
    }
    const x = ri(10, 80), p = ri(1, 3), q = ri(p + 1, p + 4), d = p * (180 - x) - q * (90 - x);
    if (d <= 0) return null;
    return N(`Bir açının bütünlerinin ${p} katı, tümlerinin ${q} katından ${d}° fazladır. Açı kaç derecedir?`, x, `${p}(180 − x) − ${q}(90 − x) = ${d} → ${180 * p - 90 * q} + ${q - p}x = ${d} → x = ${x}.`, noteFig([`${p} · (180 − x)`, `= ${q} · (90 − x) + ${d}`, "x = ?"]), { unit: "°", hint: "Tümleri ve bütünleri x ile yaz, eşitliği kur.", sol: SOL("Bilinmeyen açıya x diyelim; tümleri ve bütünleri x ile yazıp verilen ilişkiyi eşitliğe çevirelim.",
      `Bütünler 180 − x, tümler 90 − x. Verilen: ${p}(180 − x) = ${q}(90 − x) + ${d}.`,
      `Parantezleri aç: ${180 * p} − ${p}x = ${90 * q} − ${q}x + ${d}.`,
      `x'li terimleri bir yana topla: ${q}x − ${p}x = ${90 * q + d} − ${180 * p} → ${q - p}x = ${(q - p) * x}.`,
      `x = ${(q - p) * x} ÷ ${q - p} = ${x}°.`) });
  });
  add("cift", 6, 7, (l) => {
    if (l === 6) {
      const B = ri(5, 85), S = 270 - 2 * B;
      return N(`A ile B tümler, B ile C bütünler açılardır. A + C = ${S}°. B kaç derecedir?`, B, `A = 90 − B, C = 180 − B. A + C = 270 − 2B = ${S} → B = ${B}.`, noteFig(["A + B = 90°", "B + C = 180°", `A + C = ${S}°`, "B = ?"]), { unit: "°", sol: SOL("A ve C'yi B cinsinden yazarsak tek bilinmeyen kalır.",
        `A + B = 90 → A = 90 − B. B + C = 180 → C = 180 − B.`,
        `A + C = (90 − B) + (180 − B) = 270 − 2B.`,
        `270 − 2B = ${S} → 2B = ${270 - S} → B = ${B}°.`) });
    }
    const opts = [];
    for (let p = 1; p <= 4; p++) for (let q = 2 * p + 1; q <= 2 * p + 8; q++) { const num = 90 * q - 180 * p; if (num % (q - p) === 0 && gcd(p, q) === 1) opts.push([p, q, num / (q - p)]); }
    const [p, q, B] = pick(opts), askA = rnd() < .5;
    return N(`A ile B tümler, B ile C bütünler açılardır. A : C = ${p} : ${q}. ${askA ? "A" : "B"} kaç derecedir?`, askA ? 90 - B : B, `A = 90 − B, C = 180 − B. ${q}(90 − B) = ${p}(180 − B) → B = ${B}°.${askA ? ` A = 90 − ${B} = ${90 - B}.` : ""}`, noteFig(["A + B = 90°", "B + C = 180°", `A : C = ${p} : ${q}`]), { unit: "°", hint: "A ve C'yi B cinsinden yaz.", sol: SOL("C her zaman A'dan 90° büyüktür: C − A = (180 − B) − (90 − B) = 90. Oranı paylarla düşünelim.",
      { t: `A ${p} pay, C ${q} pay. Aradaki fark ${q} − ${p} = ${q - p} pay ve bu fark 90°.`, fig: bars([{ name: "A", parts: Array.from({ length: p }, () => ({ w: 1 })) }, { name: "C", parts: [...Array.from({ length: p }, () => ({ w: 1 })), { w: q - p, label: "90°", fill: LIGHT.gold, stroke: GOLD }] }]) },
      `Bir pay 90 ÷ ${q - p} = ${90 / (q - p)}°. A = ${p} × ${90 / (q - p)} = ${90 - B}°.`,
      askA ? `A = ${90 - B}°.` : `B = 90 − A = 90 − ${90 - B} = ${B}°.`) });
  });
  add("cift", 7, 8, (l) => {
    const opts = [];
    for (let p = 1; p <= 8; p++) for (let q = 1; q <= 8; q++) if (p !== q && gcd(p, q) === 1 && (180 * p) % (p + q) === 0) opts.push([p, q]);
    const [p, q] = pick(opts), a = 180 * p / (p + q), ans = Math.abs(90 - a);
    if (l === 7) return N(`∠AOB ile ∠BOC bütünler komşu açılar ve ${p} : ${q} oranında. İki açının açıortayları arasındaki açı ile ∠AOB'nin farkı kaç derecedir?`, ans, `Açıortaylar arası açı her zaman 180 ÷ 2 = 90°. ∠AOB = 180 × ${p}/${p + q} = ${a}°. Fark |90 − ${a}| = ${ans}.`,
      svg(fan(180, 205, [{ deg: 0, label: "A", len: 150 }, { deg: a, label: "B", len: 150, color: BLUE }, { deg: 180, label: "C", len: 150 }, { deg: a / 2, len: 120, color: CORAL }, { deg: (a + 180) / 2, len: 120, color: CORAL }], [{ a0: a / 2, a1: (a + 180) / 2, fill: LIGHT.coral, r: 50 }], { center: "O" })), { unit: "°", sol: SOL("Bütünler iki komşu açının açıortayları arasındaki açı her zaman 90°'dir: iki yarım açının toplamı 180 ÷ 2.",
        `Oran ${p} : ${q}: doğru açı (180°) ${p + q} paya bölünür. Bir pay ${180 / (p + q)}°. ∠AOB = ${p} pay = ${a}°.`,
        { t: `Açıortaylar arasındaki açı = ∠AOB'nin yarısı + ∠BOC'nin yarısı = (∠AOB + ∠BOC) ÷ 2 = 180 ÷ 2 = 90°.`, fig: svg(fan(180, 205, [{ deg: 0, label: "A", len: 150 }, { deg: a, label: "B", len: 150, color: BLUE }, { deg: 180, label: "C", len: 150 }, { deg: a / 2, len: 120, color: CORAL }, { deg: (a + 180) / 2, len: 120, color: CORAL }], [{ a0: a / 2, a1: (a + 180) / 2, fill: LIGHT.coral, r: 50, t: "90°", tr: 80, size: 14 }], { center: "O" })) },
        `Fark |90 − ${a}| = ${ans}°.`) });
    const b = 2 * ri(10, 80); if (b === 90) return null;
    const f = (b + 90) / 2;
    return N(`∠AOB ile ∠BOC bütünler komşu açılar, ∠AOB = ${b}°. OD, ∠AOB'nin; OE, ∠BOC'nin açıortayı. OF de ∠DOE'nin açıortayı. ∠BOF kaç derecedir?`, Math.abs(b - f),
      `∠DOE = 90° (bütünler açıların açıortayları dik). OA'dan ölçersek OD ${b / 2}°, OE ${(b + 180) / 2}°, OF ${f}°. OB ${b}°'de: |${b} − ${f}| = ${Math.abs(b - f)}.`,
      svg(fan(180, 205, [{ deg: 0, label: "A", len: 150 }, { deg: b, label: "B", len: 150, color: BLUE }, { deg: 180, label: "C", len: 150 }, { deg: b / 2, label: "D", len: 125, color: TEAL }, { deg: (b + 180) / 2, label: "E", len: 125, color: TEAL }, { deg: f, label: "F", len: 105, color: CORAL }], [], { center: "O" })), { unit: "°", hint: "Bütün ışınların OA ile yaptığı açıyı yaz.", sol: SOL("Her ışının OA ile yaptığı açıyı yazarsak, iki ışın arasındaki açı bu sayıların farkı olur.",
      `OB ${b}°'de, OC 180°'de. OD, ∠AOB'nin ortası: ${b} ÷ 2 = ${b / 2}°. OE, ∠BOC'nin ortası: (${b} + 180) ÷ 2 = ${(b + 180) / 2}°.`,
      `OF, ∠DOE'nin ortası: (${b / 2} + ${(b + 180) / 2}) ÷ 2 = ${f}°. (∠DOE her zaman 90°, OF onun ortası.)`,
      { t: `OB ${b}°'de, OF ${f}°'de: ∠BOF = |${b} − ${f}| = ${Math.abs(b - f)}°.`, fig: svg(fan(180, 205, [{ deg: 0, label: "A", len: 150 }, { deg: b, label: "B", len: 150, color: BLUE }, { deg: f, label: "F", len: 105, color: CORAL }], [{ a0: Math.min(b, f), a1: Math.max(b, f), fill: LIGHT.coral, r: 70 }], { center: "O" })) }) });
  });

  add("cift", 7, 8, (l) => {
    const a = ri(10, 89), fig = (t) => svg(fan(180, 120, [0, a, 180, 180 + a].map((deg) => ({ deg, len: 110, color: deg % 180 ? BLUE : INK })), [{ a0: 0, a1: a, fill: LIGHT.gold, r: 44, tr: 70, t }, { a0: 180, a1: 180 + a, fill: LIGHT.gold, r: 44 }]));
    if (l === 7) {
      const miss = rnd() < .5 ? a : 180 - a, S = 360 - miss;
      return N(`İki doğru kesişiyor. Oluşan dört açıdan üçünün toplamı ${S}°. Dar açı kaç derecedir?`, a, `Dört açının toplamı 360°: dışarıda kalan açı 360 − ${S} = ${miss}°. ${miss === a ? "Bu dar açıdır" : `Bu geniş açıdır; dar açı 180 − ${miss}`}: ${a}.`, fig("?"), { unit: "°", hint: "Dördüncü açıyı bul; dar mı geniş mi?", sol: SOL("Kesişen iki doğrunun oluşturduğu dört açının toplamı 360°'dir; komşu açılar 180° eder.",
        `Üç açı ${S}° ise dördüncüsü 360 − ${S} = ${miss}°.`,
        miss === a ? `${miss}° 90°'den küçük: bu bir dar açıdır. Dar açı ${a}°.` : `${miss}° 90°'den büyük: bu bir geniş açıdır. Komşusu olan dar açı 180 − ${miss} = ${a}°.`,
        { t: `İki dar açı eşit (ters açılar), iki geniş açı eşit: ${a}°, ${180 - a}°, ${a}°, ${180 - a}°.`, fig: fig(a + "°") }) });
    }
    const k = ri(3, 7), T = 2 * (180 - a) + k * a;
    return N(`İki doğru kesişiyor. Dar açılardan birinin ölçüsü x. İki geniş açının toplamına dar açının ${k} katı eklenince ${T}° bulunuyor. x kaç derecedir?`, a, `Geniş açı 180 − x. 2(180 − x) + ${k}x = 360 + ${k - 2}x = ${T} → ${k - 2}x = ${T - 360} → x = ${a}.`, fig("x"), { unit: "°", hint: "Geniş açıyı x ile yaz.", sol: SOL("Dar açı x ise ona komşu geniş açı 180 − x olur. Her şeyi x ile yazalım.",
      `İki geniş açı: 2 × (180 − x) = 360 − 2x.`,
      `Bunlara ${k}x eklenince: 360 − 2x + ${k}x = 360 + ${k - 2}x = ${T}.`,
      `${k - 2}x = ${T} − 360 = ${T - 360} → x = ${a}°.`) });
  });

  // 9. Çokgenler
  add("cokgen", 6, 7, (l) => {
    if (l === 6) {
      const k = ri(1, 15), n = 2 * k + 3;
      return N(`Bir çokgenin köşegen sayısı, kenar sayısının ${k} katıdır. Çokgen kaç kenarlıdır?`, n, `Köşegen sayısı n(n − 3) ÷ 2 = ${k}n → n − 3 = ${2 * k} → n = ${n}.`, svg(polyFig(Math.min(n, 12), { diag: true })), { hint: "Köşegen sayısını n ile yaz ve n'ye böl.", sol: SOL("n kenarlı çokgende her köşeden n − 3 köşegen çıkar (kendisine ve iki komşusuna çizilmez).",
        { t: `n köşeden n − 3'er köşegen: n × (n − 3). Her köşegen iki ucundan iki kez sayıldı: köşegen sayısı n × (n − 3) ÷ 2.`, fig: svg(polyFig(8, { diag: true })) },
        `Köşegen sayısı kenar sayısının ${k} katı: n × (n − 3) ÷ 2 = ${k} × n.`,
        `İki tarafı n'ye böl: (n − 3) ÷ 2 = ${k} → n − 3 = ${2 * k} → n = ${n}.`) });
    }
    const n = ri(6, 20), S = n * (n - 1) / 2;
    return N(`Bir çokgenin kenar sayısı ile köşegen sayısının toplamı ${S}. Çokgen kaç kenarlıdır?`, n, `Kenarlar ve köşegenler, köşelerin bütün ikili birleşimleridir: n(n − 1) ÷ 2 = ${S} → n = ${n}.`, svg(polyFig(Math.min(n, 12), { diag: true })), { hint: "Her iki köşe ya bir kenarla ya da bir köşegenle birleşir.", sol: SOL("Çokgenin herhangi iki köşesi ya bir kenarla ya da bir köşegenle birleşir. Kenar + köşegen = köşe çiftlerinin sayısı.",
      `n köşeden 2 köşe seçmenin yolu n × (n − 1) ÷ 2.`,
      `n × (n − 1) ÷ 2 = ${S} → n × (n − 1) = ${2 * S}.`,
      `Ardışık iki sayının çarpımı ${2 * S}: ${n} × ${n - 1} = ${2 * S}. n = ${n}.`) });
  });
  add("cokgen", 6, 8, (l) => {
    if (l === 6) {
      const n = pick([5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60, 72, 90, 120, 180, 360]), x = 180 - 360 / n;
      return N(`Düzgün bir çokgenin bir iç açısı ${x}°. Bu çokgen kaç kenarlıdır?`, n, `Bir dış açı 180 − ${x} = ${360 / n}°. Dış açılar toplamı 360°: 360 ÷ ${360 / n} = ${n}.`, svg(polyFig(Math.min(n, 12))), { hint: "Önce dış açıyı bul.", sol: SOL("Bir köşedeki iç açı ile dış açı yan yana 180° eder. Bütün dış açıların toplamı her çokgende 360°'dir.",
        `Dış açı = 180 − ${x} = ${360 / n}°.`,
        `Düzgün çokgende bütün dış açılar eşit. Kaç tane ${360 / n}° yan yana 360° eder? 360 ÷ ${360 / n} = ${n}.`) });
    }
    if (l === 7) {
      const n = ri(5, 20), D = (n - 2) * 180 - 360;
      return N(`Bir çokgenin iç açıları toplamı, dış açıları toplamından ${D}° fazla. Çokgen kaç kenarlıdır?`, n, `İç açılar (n − 2) × 180, dış açılar 360. (n − 2) × 180 − 360 = ${D} → n − 2 = ${D + 360} ÷ 180 = ${n - 2} → n = ${n}.`, svg(polyFig(Math.min(n, 12))), { sol: SOL("n kenarlı çokgenin iç açıları toplamı (n − 2) × 180°, dış açıları toplamı her zaman 360°.",
        { t: `Bir köşeden çizilen köşegenler çokgeni n − 2 üçgene ayırır; her üçgen 180°.`, fig: svg(polyFig(7, { diag: true })) },
        `(n − 2) × 180 − 360 = ${D} → (n − 2) × 180 = ${D + 360}.`,
        `n − 2 = ${D + 360} ÷ 180 = ${n - 2} → n = ${n}.`) });
    }
    const n = ri(6, 15), e = ri(20, 170), S = (n - 2) * 180 - e;
    return N(`Bir dışbükey çokgenin bir iç açısı dışındaki bütün iç açılarının toplamı ${S}°. Dışarıda bırakılan açı kaç derecedir?`, e,
      `İç açılar toplamı 180'in katıdır ve ${ek(S, "den")} büyük, en fazla ${S} + 180 olmalı (açı 180°'den küçük). ${ek(S, "den")} büyük ilk kat ${(n - 2) * 180} = (${n} − 2) × 180. Açı ${(n - 2) * 180} − ${S} = ${e}.`, svg(polyFig(Math.min(n, 12), { side: "?" })), { unit: "°", hint: "Toplam, 180'in bir katı olmalı ve eksik açı 0 ile 180 arasında.", sol: SOL("Kenar sayısını bilmiyoruz ama iç açılar toplamı mutlaka 180'in bir katıdır. Dışbükey çokgende her iç açı 180°'den küçüktür.",
      `Gerçek toplam = ${S} + (eksik açı). Eksik açı 0 ile 180 arasında, yani gerçek toplam ${S} ile ${S + 180} arasında.`,
      { t: `180'in katlarına bak: ${(n - 3) * 180} < ${S} < ${(n - 2) * 180}. Bu aralıkta tek kat var: ${(n - 2) * 180}.`, fig: solTable(["Kenar", "İç açılar toplamı"], [[n - 1, (n - 3) * 180], [n, (n - 2) * 180], [n + 1, (n - 1) * 180]]) },
      `Çokgen ${n} kenarlı; eksik açı ${(n - 2) * 180} − ${S} = ${e}°.`) });
  });
  add("cokgen", 7, 8, (l) => {
    const n = ri(6, 12), ans = l === 7 ? comb(n, 3) : n * (n - 4) * (n - 5) / 6;
    return l === 7 ? N(`Köşeleri bir ${gen(n)}in köşeleri arasından seçilen kaç farklı üçgen vardır?`, ans, `${n} köşeden 3'ünü seçmenin yolu: ${n} × ${n - 1} × ${n - 2} ÷ 6 = ${ans}.`, svg(polyFig(n)), { hint: "Hangi üç köşe seçilirse seçilsin üçgen olur.", sol: SOL("Çokgenin üç köşesi asla aynı doğru üzerinde olmaz; her üç köşe bir üçgen verir. Üç köşe seçme yollarını sayalım.",
      `Birinci köşe ${n}, ikinci ${n - 1}, üçüncü ${n - 2} şekilde seçilir: ${n} × ${n - 1} × ${n - 2} = ${n * (n - 1) * (n - 2)}.`,
      `Ama aynı üç köşe 3 × 2 × 1 = 6 farklı sırayla seçilmiş oldu. 6'ya böl: ${n * (n - 1) * (n - 2)} ÷ 6 = ${ans}.`) })
      : N(`Köşeleri bir dışbükey ${gen(n)}in köşeleri arasından seçilen ve hiçbir kenarı ${gen(n)}in kenarı olmayan kaç üçgen vardır?`, ans,
        `Bütün üçgenler ${comb(n, 3)}. İki kenarı ortak olanlar (ardışık üç köşe): ${n}. Tam bir kenarı ortak olanlar: her kenar için ${n - 4} üçüncü köşe → ${n * (n - 4)}. ${comb(n, 3)} − ${n} − ${n * (n - 4)} = ${ans}.`, svg(polyFig(n)), { hint: "Çokgenle ortak kenar sayısına göre üçgenleri grupla.", sol: SOL("Bütün üçgenleri sayıp çokgenle ortak kenarı olanları çıkaralım. Ortak kenar sayısına göre iki grup var.",
        `Bütün üçgenler: ${n} × ${n - 1} × ${n - 2} ÷ 6 = ${comb(n, 3)}.`,
        `İki kenarı ortak olanlar: ardışık üç köşe (örneğin 1-2-3). Her köşe ortada olabilir: ${n} üçgen.`,
        `Tam bir kenarı ortak olanlar: bir kenar seç (${n} yol), üçüncü köşe bu kenarın uçlarına ve komşularına değmemeli: ${n} − 4 = ${n - 4} seçenek. ${n} × ${n - 4} = ${n * (n - 4)}.`,
        `${comb(n, 3)} − ${n} − ${n * (n - 4)} = ${ans}.`) });
  });
  add("cokgen", 8, 8, () => {
    const n = ri(5, 12);
    return N(`Dışbükey bir ${gen(n)}in bütün köşegenleri çiziliyor. Hiçbir üç köşegen aynı noktadan geçmiyor. Köşegenler çokgenin içinde kaç noktada kesişir?`, comb(n, 4),
      `İçeride kesişen iki köşegen, 4 köşeyi birleştirir; her 4 köşe tam bir kesişim noktası verir. ${n} köşeden 4'ünü seçmenin yolu ${comb(n, 4)}.`, svg(polyFig(n, { R: 95 }) + Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => j > i + 1 && !(i === 0 && j === n - 1) ? line(...P(180, 122, 90 + i * 360 / n, 95), ...P(180, 122, 90 + j * 360 / n, 95), { color: CORAL, w: 1.5 }) : "").join("")).join("")), { hint: "Bir iç kesişim noktası hangi dört köşeyle belirlenir?", sol: SOL("İçeride kesişen iki köşegenin dört ucu, çokgenin dört köşesidir. Tersine, her dört köşe tam bir kesişim noktası verir.",
      { t: `Dört köşe seç: bunlar bir dörtgen oluşturur. Bu dörtgenin iki köşegeni tam bir noktada kesişir.`, fig: svg(polyFig(n, { R: 95 }) + (() => { const Q = [0, 1, 3, Math.min(5, n - 1)].map((i) => P(180, 122, 90 + i * 360 / n, 95)); return line(...Q[0], ...Q[2], { color: BLUE, w: 4 }) + line(...Q[1], ...Q[3], { color: BLUE, w: 4 }) + Q.map((q) => dot(q[0], q[1], 8, BLUE)).join(""); })()) },
      `Farklı dört köşe farklı bir nokta verir (üç köşegen aynı noktadan geçmiyor).`,
      `${n} köşeden 4 köşe seçme yolu: ${n} × ${n - 1} × ${n - 2} × ${n - 3} ÷ 24 = ${comb(n, 4)}.`) });
  });

  // 10. Üçgenler
  add("ucgen", 6, 7, (l) => {
    if (l === 6) {
      const opts = []; for (let p = 1; p <= 9; p++) for (let q = p; q <= 9; q++) for (let r = q; r <= 9; r++) if (180 % (p + q + r) === 0 && !(p === q && q === r) && gcd(gcd(p, q), r) === 1) opts.push([p, q, r]);
      const [p, q, r] = pick(opts), u = 180 / (p + q + r), big = rnd() < .5;
      return N(`Bir üçgenin açıları ${p} : ${q} : ${r} oranında. En ${big ? "büyük" : "küçük"} açının ${big ? "bütünleri" : "tümleri"} kaç derecedir?`, big ? 180 - r * u : 90 - p * u, `Bir pay 180 ÷ ${p + q + r} = ${u}°. Açılar ${p * u}°, ${q * u}°, ${r * u}°. ${big ? `180 − ${r * u} = ${180 - r * u}` : `90 − ${p * u} = ${90 - p * u}`}.`, svg(triFig(p * u, q * u, ["?", "?", "?", TEAL, TEAL, TEAL])), { unit: "°", sol: SOL("Üçgenin iç açıları toplamı 180°. Oran, bu 180°'nin kaç eş paya bölündüğünü söyler.",
        { t: `${p} + ${q} + ${r} = ${p + q + r} pay. Bir pay 180 ÷ ${p + q + r} = ${u}°.`, fig: bars([{ name: "180°", parts: [{ w: p, label: p * u + "°" }, { w: q, label: q * u + "°", fill: LIGHT.teal, stroke: TEAL }, { w: r, label: r * u + "°", fill: LIGHT.gold, stroke: GOLD }] }]) },
        `Açılar: ${p * u}°, ${q * u}°, ${r * u}°.`,
        big ? `En büyük açı ${r * u}°; bütünleri 180 − ${r * u} = ${180 - r * u}°.` : `En küçük açı ${p * u}°; tümleri 90 − ${p * u} = ${90 - p * u}°.`) });
    }
    const opts = []; for (let p = 1; p <= 9; p++) for (let q = p; q <= 9; q++) for (let r = q; r <= 9; r++) { const s = p + q + r; if (360 % s === 0 && r * 360 / s < 180 && gcd(gcd(p, q), r) === 1) opts.push([p, q, r]); }
    const [p, q, r] = pick(opts), u = 360 / (p + q + r);
    return N(`Bir üçgenin dış açıları ${p} : ${q} : ${r} oranında. En büyük iç açısı kaç derecedir?`, 180 - p * u, `Dış açılar toplamı 360°: bir pay ${u}°. En küçük dış açı ${p * u}°, ona komşu iç açı en büyüktür: 180 − ${p * u} = ${180 - p * u}.`, svg(triFig(180 - p * u, 180 - q * u, ["", "", ""], { ext: "?" }), "0 0 420 240"), { unit: "°", hint: "En büyük iç açı, en küçük dış açının yanındadır.", sol: SOL("Bir köşede iç açı + dış açı = 180°. Üçgenin dış açıları toplamı her zaman 360°.",
      `Dış açılar ${p + q + r} pay ve toplam 360°: bir pay 360 ÷ ${p + q + r} = ${u}°. Dış açılar ${p * u}°, ${q * u}°, ${r * u}°.`,
      `İç açılar: 180 − ${p * u} = ${180 - p * u}, 180 − ${q * u} = ${180 - q * u}, 180 − ${r * u} = ${180 - r * u}. (Toplamları 180 ✔)`,
      `En büyük iç açı, en küçük dış açının yanındaki: ${180 - p * u}°.`) });
  });
  add("ucgen", 6, 8, (l) => {
    if (l === 6) {
      const a = ri(3, 20), b = ri(3, 20);
      return N(`Bir üçgenin iki kenarı ${a} cm ve ${b} cm. Üçüncü kenar santimetre cinsinden bir tam sayı ise kaç farklı değer alabilir?`, 2 * Math.min(a, b) - 1, `${Math.abs(a - b)} < x < ${a + b}. Tam sayılar ${Math.abs(a - b) + 1} ile ${a + b - 1} arası: ${2 * Math.min(a, b) - 1} değer.`, svg(triFig(70, 50, ["", "", ""], { sides: [a + " cm", b + " cm", "?"] })), { sol: SOL("Üçgen eşitsizliği: bir kenar, diğer ikisinin toplamından küçük ve farkından büyük olmalı.",
        { t: `Üst sınır: x < ${a} + ${b} = ${a + b}. Daha uzun olursa diğer iki kenar uç uca bile ona yetişemez.`, fig: svg(line(30, 120, 330, 120, { color: CORAL, w: 6 }) + line(30, 90, 30 + 300 * a / (a + b + 2), 90, { color: BLUE, w: 6 }) + line(30 + 300 * a / (a + b + 2), 90, 30 + 300 * (a + b) / (a + b + 2), 90, { color: TEAL, w: 6 }) + text(180, 150, "kısa kenarlar uç uca da yetişmezse üçgen kapanmaz", { size: 13 }), "0 0 360 170") },
        `Alt sınır: x > ${Math.max(a, b)} − ${Math.min(a, b)} = ${Math.abs(a - b)}.`,
        `${Math.abs(a - b)} < x < ${a + b}: x = ${Math.abs(a - b) + 1}, ${Math.abs(a - b) + 2}, …, ${a + b - 1}. Sayı adedi ${a + b - 1} − ${Math.abs(a - b)} = ${2 * Math.min(a, b) - 1}.`) });
    }
    const P0 = ri(l === 7 ? 10 : 9, l === 7 ? 40 : 30);
    if (l === 7) {
      let count = 0; const list = [];
      for (let L = 1; 2 * L < P0; L++) { const B = P0 - 2 * L; if (B > 0 && B < 2 * L) { count++; list.push(`${L}-${L}-${B}`); } }
      if (!count) return null;
      return N(`Çevresi ${P0} cm ve kenarları tam sayı olan kaç farklı ikizkenar üçgen vardır? (Eşkenar üçgen de ikizkenardır.)`, count, `Eş kenar L, taban ${P0} − 2L. Taban pozitif ve 2L'den kısa olmalı: ${list.join(", ")} → ${count} üçgen.`, svg(triFig(65, 65, ["", "", ""], { ticks: true, sides: ["?", "?", "?"] })), { hint: "Eş kenarı 1'den başlatıp üçgen eşitsizliğini kontrol et.", sol: SOL("İkizkenar üçgenin iki eş kenarı L, tabanı T olsun. 2L + T = çevre; ayrıca taban, iki eş kenarın toplamından kısa olmalı.",
        `T = ${P0} − 2L. T > 0 için L < ${P0 / 2}. Üçgen için T < 2L, yani ${P0} − 2L < 2L → L > ${P0 / 4}.`,
        { t: `L için ${P0 / 4} < L < ${P0 / 2} aralığındaki tam sayılar: ${list.length} tane.`, fig: solTable(["Eş kenar L", "Taban T", "Üçgen"], list.map((x) => { const [L1, , T1] = x.split("-"); return [L1, T1, "✔"]; })) },
        `${count} farklı ikizkenar üçgen.`) });
    }
    let count = 0;
    for (let a = 1; a <= P0; a++) for (let b = a; b <= P0; b++) { const c = P0 - a - b; if (c >= b && a + b > c) count++; }
    if (!count) return null;
    return N(`Çevresi ${P0} cm ve kenarları tam sayı olan kaç farklı üçgen vardır? (Kenarları aynı olan üçgenler bir sayılır.)`, count, `a ≤ b ≤ c ve a + b > c koşuluyla bütün üçlüler sistemli yazılır; en uzun kenar ${Math.ceil(P0 / 3)} ile ${Math.ceil(P0 / 2) - 1} arasında olmalı. Toplam ${count} üçgen.`, svg(triFig(55, 75, ["", "", ""], { sides: ["a", "b", "c"] })), { hint: "En uzun kenarı sabitle, diğer ikisini sırala.", sol: SOL("Kenarları a ≤ b ≤ c diye sıralarsak aynı üçgeni iki kez saymayız. Üçgen olması için a + b > c olmalı.",
      `a + b + c = ${P0} ve a + b > c → c < ${P0 / 2}. c en uzun olduğu için c ≥ ${P0 / 3}. Yani c, ${Math.ceil(P0 / 3)} ile ${Math.ceil(P0 / 2) - 1} arasında.`,
      { t: `Her c için a + b = ${P0} − c ve a ≤ b ≤ c olan çiftleri yaz:`, fig: (() => { const rows = []; for (let c = Math.ceil(P0 / 3); 2 * c < P0; c++) { const list = []; for (let a = 1; a <= c; a++) { const b = P0 - c - a; if (b >= a && b <= c) list.push(`${a}-${b}-${c}`); } if (list.length) rows.push([c, list.join(", "), list.length]); } return solTable(["En uzun c", "Üçgenler", "Sayı"], rows, ["", "Toplam", count]); })() },
      `Toplam ${count} üçgen.`) });
  });
  add("ucgen", 7, 8, (l) => {
    if (l === 7) {
      const A = 4 * ri(5, 40), B = (180 - A) / 2, ans = 180 - B / 2 - B;
      const [p, q, r] = G.triangleFromAngles(B, B);
      // Açıortay ayağı D, AC üzerinde; AD : DC = AB : BC.
      const side = (u, v) => Math.hypot(u[0] - v[0], u[1] - v[1]), t = side(q, r) / (side(q, r) + side(q, p)), Dp = [r[0] + (p[0] - r[0]) * t, r[1] + (p[1] - r[1]) * t];
      let s = `<polygon class="ar-pop" points="${[p, q, r].map((v) => v.join(",")).join(" ")}" fill="#fff1d6" stroke="${GOLD}" stroke-width="4"/>` + line(q[0], q[1], Dp[0], Dp[1], { color: BLUE, w: 3, cls: "ar-draw" });
      s += text(r[0], r[1] - 16, "A") + text(q[0] + 14, q[1] + 12, "B") + text(p[0] - 14, p[1] + 12, "C") + text(Dp[0] - 16, Dp[1] - 8, "D", { fill: BLUE });
      return N(`ABC üçgeninde AB = AC ve ∠A = ${A}°. BD, B açısının açıortayı ve D, AC üzerinde. ∠BDC kaç derecedir?`, ans, `∠B = ∠C = (180 − ${A}) ÷ 2 = ${B}°. ∠DBC = ${B / 2}°. BDC üçgeninde ∠BDC = 180 − ${B / 2} − ${B} = ${ans}.`, svg(s), { unit: "°", sol: SOL("İkizkenar üçgende taban açıları eşittir. Önce B ve C açılarını bulup sonra BDC üçgenine bakalım.",
        `AB = AC olduğu için ∠B = ∠C. 180 − ${A} = ${180 - A}; ikiye böl: ∠B = ∠C = ${B}°.`,
        `BD açıortay: ∠DBC = ${B} ÷ 2 = ${B / 2}°.`,
        { t: `BDC üçgeninin açıları: ∠DBC = ${B / 2}°, ∠C = ${B}°, ∠BDC = ?. Toplam 180°: ∠BDC = 180 − ${B / 2} − ${B} = ${ans}°.`, fig: svg(s) }) });
    }
    const A = 2 * ri(10, 75), I = 90 + A / 2, back = rnd() < .5;
    return back ? N(`ABC üçgeninde B ve C açılarının açıortayları I noktasında kesişiyor. ∠BIC = ${I}°. ∠A kaç derecedir?`, A, `∠IBC + ∠ICB = (∠B + ∠C) ÷ 2 = (180 − ∠A) ÷ 2. ∠BIC = 180 − (180 − ∠A) ÷ 2 = 90 + ∠A ÷ 2. ${I} = 90 + ∠A ÷ 2 → ∠A = ${A}.`, svg(triFig(70, 45, ["", "", "A"], {})), { unit: "°", hint: "BIC üçgeninde açıları B ve C cinsinden yaz.", sol: SOL("BIC üçgenine bak: B ve C köşelerindeki açılar, ∠B ve ∠C'nin yarılarıdır.",
      { t: `∠IBC = ∠B ÷ 2 ve ∠ICB = ∠C ÷ 2. BIC üçgeninde ∠BIC = 180 − (∠B + ∠C) ÷ 2.`, fig: bisectFig() },
      `∠B + ∠C = 180 − ∠A. Yerine koy: ∠BIC = 180 − (180 − ∠A) ÷ 2 = 90 + ∠A ÷ 2.`,
      `${I} = 90 + ∠A ÷ 2 → ∠A ÷ 2 = ${I - 90} → ∠A = ${A}°.`) })
      : N(`ABC üçgeninde ∠A = ${A}°. B ve C açılarının açıortayları I noktasında kesişiyor. ∠BIC kaç derecedir?`, I, `∠B + ∠C = ${180 - A}°, yarısı ${(180 - A) / 2}°. ∠BIC = 180 − ${(180 - A) / 2} = ${I}.`, svg(triFig(70, 45, ["", "", A + "°"], {})), { unit: "°", hint: "BIC üçgeninde açıları B ve C cinsinden yaz.", sol: SOL("BIC üçgenine bak: B ve C köşelerindeki açılar, ∠B ve ∠C'nin yarılarıdır.",
      `∠B + ∠C = 180 − ${A} = ${180 - A}°.`,
      { t: `∠IBC + ∠ICB = (∠B + ∠C) ÷ 2 = ${(180 - A) / 2}°.`, fig: bisectFig() },
      `BIC üçgeninde ∠BIC = 180 − ${(180 - A) / 2} = ${I}°.`) });
  });
  add("ucgen", 8, 8, () => {
    const k = ri(1, 5), m = ri(0, 3), ans = (m + 1) * comb(k + 2, 2);
    return N(`Üçgenin tepesinden tabana ${k} doğru parçası${m ? `, tabana paralel ${m} doğru parçası` : ""} çiziliyor. Şekilde kaç üçgen vardır?`, ans,
      `Tepeden çıkan ${k + 2} doğrudan (iki kenar dahil) ikisi seçilir: ${comb(k + 2, 2)}. Bu ikili, tabanla ${m ? `ya da ${m} paralelden biriyle (${m + 1} seçenek)` : ""} bir üçgen oluşturur: ${m ? `${m + 1} × ` : ""}${comb(k + 2, 2)} = ${ans}.`, cevianFig(k, m), { hint: "Her üçgenin bir köşesi tepededir. Tepeden çıkan iki çizgiyi ve bir yatay çizgiyi seç.", sol: SOL("Şekildeki her üçgenin bir köşesi tepededir. Bir üçgen; tepeden çıkan iki çizgi ve onları kesen bir yatay çizgiyle belirlenir.",
      { t: `Örnek: tepeden çıkan iki çizgi ve taban bir üçgen oluşturur.`, fig: cevianPick(k, m, 0, 1, m + 1) },
      `Tepeden çıkan çizgiler: iki kenar + ${k} parça = ${k + 2} çizgi. Bunlardan 2'si ${k + 2} × ${k + 1} ÷ 2 = ${comb(k + 2, 2)} şekilde seçilir.`,
      m ? { t: `Yatay çizgi olarak taban ya da ${m} paralelden biri seçilir: ${m + 1} seçenek.`, fig: cevianPick(k, m, 1, k + 1, 1) } : `Yatay çizgi olarak yalnız taban var: 1 seçenek.`,
      `Toplam ${comb(k + 2, 2)} × ${m + 1} = ${ans} üçgen.`) });
  });

  // 11. Üçgen inşası
  add("insa", 6, 7, (l) => {
    if (l === 6) {
      const a = ri(4, 20), b = ri(4, 20);
      return N(`Bir üçgenin iki kenarı ${a} cm ve ${b} cm. Üçüncü kenar x bir tam sayı ve üçgenin en uzun kenarı (diğerlerinden kısa değil). x kaç farklı değer alabilir?`, Math.min(a, b), `x en az ${Math.max(a, b)}, en çok ${a + b - 1} olabilir: ${a + b - 1} − ${Math.max(a, b)} + 1 = ${Math.min(a, b)} değer.`, constructFig(a, b, Math.max(a, b), [a + " cm", b + " cm", "x"]), { hint: "En uzun kenar olması için alt sınır, üçgen olması için üst sınır var.", sol: SOL("x için iki koşul var: en uzun kenar olması (alt sınır) ve üçgenin kapanması (üst sınır).",
        `En uzun kenar: x ≥ ${Math.max(a, b)} (diğer kenarlardan kısa olmamalı).`,
        `Üçgen eşitsizliği: x < ${a} + ${b} = ${a + b}, yani x en çok ${a + b - 1}.`,
        { t: `x = ${Math.max(a, b)}, ${Math.max(a, b) + 1}, …, ${a + b - 1}: ${a + b - 1} − ${Math.max(a, b)} + 1 = ${Math.min(a, b)} değer.`, fig: solTable(["x", "Koşul"], [[Math.max(a, b), "en kısa uygun değer"], ["…", ""], [a + b - 1, "en uzun uygun değer"]]) }) });
    }
    const a = ri(4, 15), b = ri(4, 15), c = ri(4, 15), d = ri(4, 15);
    const lo = Math.max(Math.abs(a - b), Math.abs(c - d)) + 1, hi = Math.min(a + b, c + d) - 1, ans = Math.max(0, hi - lo + 1);
    if (!ans) return null;
    return N(`ABD ve CBD üçgenleri BD kenarını ortak kullanıyor. AB = ${a}, AD = ${b}, CB = ${c}, CD = ${d} cm. BD santimetre cinsinden tam sayı ise kaç farklı değer alabilir?`, ans, `ABD için ${Math.abs(a - b)} < BD < ${a + b}; CBD için ${Math.abs(c - d)} < BD < ${c + d}. İkisi birlikte: ${lo} ≤ BD ≤ ${hi} → ${ans} değer.`, noteFig([`ABD: ${a}, ${b}, BD`, `CBD: ${c}, ${d}, BD`, "BD kaç değer?"]), { hint: "İki üçgenin eşitsizliklerini ayrı yaz, ortak kısmı al.", sol: SOL("BD iki üçgenin de kenarı. Her üçgen için üçgen eşitsizliğini yazıp iki aralığın ortak kısmını alalım.",
        `ABD üçgeni: ${Math.abs(a - b)} < BD < ${a + b}.`,
        `CBD üçgeni: ${Math.abs(c - d)} < BD < ${c + d}.`,
        { t: `İkisi birden: ${lo - 1} < BD < ${hi + 1}. Tam sayılar ${lo}, …, ${hi}: ${ans} değer.`, fig: solTable(["Üçgen", "Alt sınır", "Üst sınır"], [["ABD", `> ${Math.abs(a - b)}`, `< ${a + b}`], ["CBD", `> ${Math.abs(c - d)}`, `< ${c + d}`]], ["Ortak", `≥ ${lo}`, `≤ ${hi}`]) }) });
  });
  add("insa", 6, 7, (l) => {
    const a = ri(3, 12), P0 = a + ri(a + 1, l === 6 ? 20 : 34), s = P0 - a, list = [];
    for (let b = 1; 2 * b <= s; b++) { const c = s - b; if (c - b < a && b + c > a) list.push(`${b}-${c}`); }
    if (!list.length) return null;
    return N(`Çevresi ${P0} cm olan bir üçgenin bir kenarı ${a} cm, diğer kenarları tam sayı. Kaç farklı üçgen çizilebilir? (Kenarları aynı olanlar bir sayılır.)`, list.length, `Diğer kenarların toplamı ${s}. b ≤ c ve c − b < ${a} olmalı: ${list.join(", ")} → ${list.length} üçgen.`, constructFig(a, Math.max(1, Math.floor(s / 2)), Math.ceil(s / 2) > a + Math.floor(s / 2) - 1 ? a : Math.ceil(s / 2), ["?", "?", a + " cm"]), { hint: "b + c sabit; b'yi küçükten başlatıp c − b < a koşuluna bak.", sol: SOL("Diğer iki kenara b ≤ c diyelim. Toplamları sabit; üçgen olması için iki kenarın farkı üçüncüden küçük olmalı.",
      `b + c = ${P0} − ${a} = ${s}.`,
      `Üçgen eşitsizliği: c − b < ${a} (fark, ${a} cm'lik kenardan kısa) ve b + c > ${a} (bu zaten ${s} > ${a}).`,
      { t: `b'yi küçükten büyüğe dene:`, fig: solTable(["b", "c", "c − b", `< ${a} ?`], Array.from({ length: Math.floor(s / 2) }, (_, i) => { const b = i + 1, c = s - b; return [b, c, c - b, c - b < a ? "✔" : "✘"]; }).slice(-8)) },
      `Uygun çiftler: ${list.join(", ")} → ${list.length} üçgen.`) });
  });
  add("insa", 7, 8, (l) => {
    const n = l === 7 ? ri(5, 9) : ri(10, 22);
    let count = 0; for (let a = 1; a <= n; a++) for (let b = a + 1; b <= n; b++) for (let c = b + 1; c <= n; c++) if (a + b > c) count++;
    let s = ""; const shown = Math.min(n, 9);
    for (let i = 1; i <= shown; i++) s += `<rect class="ar-grow-x" style="animation-delay:${i * 60}ms" x="30" y="${12 + (i - 1) * 22}" width="${r1(i * 300 / shown)}" height="14" rx="7" fill="${[CORAL, BLUE, TEAL, GOLD, GRAPE][i % 5]}"/>` + text(22, 19 + (i - 1) * 22, i, { size: 12, anchor: "end" });
    return N(`Uzunlukları 1, 2, 3, …, ${n} cm olan ${n} çubuk var. Bunlardan üç farklı çubuk seçilerek kaç farklı üçgen yapılabilir?`, count, `En uzun çubuk c olsun; diğer ikisi a < b < c ve a + b > c olmalı. Her c için uygun çiftler sayılıp toplanır: ${count}.`, svg(s + (n > shown ? text(330, 210, `… ${n} cm`, { size: 14, anchor: "end" }) : ""), "0 0 360 220"), { hint: "En uzun çubuğu sırayla 3, 4, 5, … seç ve diğer iki çubuğu say.", sol: SOL("Üç çubuktan en uzununa c diyelim. Diğer iki çubuğun toplamı c'den büyük olmalı. Her c için uygun çiftleri sayıp toplayalım.",
      `Örnek: c = 5 ise (a, b) çiftleri a < b < 5 ve a + b > 5: (2, 4), (3, 4) → 2 üçgen.`,
      { t: `Her en uzun çubuk için uygun çift sayısı:`, fig: (() => { const rows = []; for (let c = 3; c <= n; c++) { let k = 0; for (let a = 1; a < c; a++) for (let b = a + 1; b < c; b++) if (a + b > c) k++; rows.push([c, k]); } return solTable(["En uzun c", "Üçgen sayısı"], rows.length > 10 ? [...rows.slice(0, 4), ["…", "…"], ...rows.slice(-4)] : rows, ["Toplam", count]); })() },
      `Toplam ${count} üçgen.`) });
  });
  add("insa", 8, 8, () => {
    const c = ri(4, 30);
    let count = 0; for (let a = 1; a <= c; a++) for (let b = a; b <= c; b++) if (a + b > c) count++;
    return N(`Kenarları tam sayı olan ve en uzun kenarı ${c} cm olan kaç farklı üçgen vardır? (Kenarları aynı olanlar bir sayılır.)`, count, `a ≤ b ≤ ${c} ve a + b > ${c}. b sabitken a, ${c} − b + 1 ile b arasında. Toplam ${count}.`, constructFig(Math.ceil(c * .7), Math.ceil(c * .6), c, ["a", "b", c + " cm"]), { hint: `b'yi ${ek(c, "den")} geriye doğru azalt; her b için a kaç değer alır?`, sol: SOL("Kenarları a ≤ b ≤ c diye sıralayalım; c sabit. Üçgen için a + b > c olmalı.",
      `b sabitken a, b'den büyük olamaz ve a > ${c} − b olmalı: a = ${c} − b + 1, …, b. Bu ${"2b − " + c} tane değer (pozitifse).`,
      { t: `b'yi ${ek(c, "den")} aşağı doğru dene:`, fig: (() => { const rows = []; for (let b = c; 2 * b > c; b--) rows.push([b, `${c - b + 1} … ${b}`, 2 * b - c]); return solTable(["b", "a değerleri", "Sayı"], rows.length > 9 ? [...rows.slice(0, 4), ["…", "…", "…"], ...rows.slice(-3)] : rows, ["", "Toplam", count]); })() },
      `Toplam ${count} üçgen.`) });
  });

  // 12. Doğal sayıları okuma ve yazma
  const digitsUpTo = (n) => { let t = 0; for (let len = 1, start = 1; start <= n; len++, start *= 10) t += (Math.min(n, start * 10 - 1) - start + 1) * len; return t; };
  // 1'den n'e kadar sayıları basamak sayısına göre gruplayan tablo satırları.
  const digitRows = (n) => { const rows = []; for (let len = 1, start = 1; start <= n; len++, start *= 10) { const end = Math.min(n, start * 10 - 1), cnt = end - start + 1; rows.push([`${fmt(start)}–${fmt(end)}`, fmt(cnt), len, fmt(cnt * len)]); } return rows; };
  // Kart sayıları: X'ten önce gelenleri basamak basamak sayar (rakamlar farklı).
  const fact = (k) => (k <= 1 ? 1 : k * fact(k - 1));
  function rankRows(ds, X) {
    const xs = String(X).split("").map(Number), left = [...ds], rows = [];
    xs.forEach((d, i) => {
      const smaller = left.filter((v) => v < d && !(i === 0 && v === 0)), each = fact(left.length - 1);
      rows.push([`${i + 1}. basamak ${d}`, smaller.length ? smaller.join(", ") : "—", `${smaller.length} × ${each} = ${smaller.length * each}`]);
      left.splice(left.indexOf(d), 1);
    });
    return rows;
  }
  add("okuma", 6, 7, (l) => {
    const n = l === 6 ? ri(100, 999) : ri(1000, 9999), t = digitsUpTo(n);
    return N(`1'den ${ek(n, "e")} kadar bütün doğal sayılar yan yana yazılıyor. Kaç rakam kullanılır?`, t, `1–9: 9 rakam, 10–99: 180 rakam, 100–999: 2700 rakam… ${ek(n, "e")} kadar toplam ${fmt(t)}.`, cards([{ t: "1 2 3 … 9", s: "tek basamaklı" }, { t: "10 … 99", s: "iki basamaklı" }, { t: `… ${fmt(n)}`, s: "son sayı", q: true }]), { hint: "Basamak sayısı aynı olan sayıları gruplara ayır.", sol: SOL("Sayıları basamak sayılarına göre gruplayalım. Bir grupta kaç sayı olduğunu bulup basamak sayısıyla çarpalım.",
      `Bir gruptaki sayı adedi = son − ilk + 1. Örneğin 10–99 arası 99 − 10 + 1 = 90 sayı, her biri 2 rakam: 180 rakam.`,
      { t: `Bütün gruplar:`, fig: solTable(["Sayılar", "Adet", "Basamak", "Rakam"], digitRows(n), ["", "", "Toplam", fmt(t)]) },
      `Toplam ${fmt(t)} rakam.`) });
  });
  add("okuma", 6, 8, (l) => {
    const n = l === 6 ? ri(100, 300) : l === 7 ? ri(300, 1500) : ri(1500, 9999), d = l === 8 ? ri(0, 9) : ri(1, 9);
    let c = 0; for (let i = 1; i <= n; i++) for (const ch of String(i)) if (ch === String(d)) c++;
    return N(`1'den ${ek(n, "e")} kadar bütün doğal sayılar yazılıyor. ${d} rakamı toplam kaç kez yazılır?`, c, `Birler, onlar, yüzler${n >= 1000 ? ", binler" : ""} basamağında ${ek(d, "in")} kaç kez geçtiği ayrı ayrı sayılıp toplanır: ${fmt(c)}.`, G.digitTiles(d, 0), { hint: "Her basamağı ayrı düşün: örneğin birler basamağında her 10 sayıda bir kez.", sol: SOL(`${d} rakamının birler, onlar, yüzler${n >= 1000 ? ", binler" : ""} basamağında kaç kez göründüğünü ayrı ayrı sayıp toplayalım.`,
      `Birler basamağında ${d}, her 10 ardışık sayıda bir kez görünür (${d || 10}, ${(d || 10) + 10}, ${(d || 10) + 20}, …). Onlar basamağında her 100 sayıda 10 kez (${d}0–${d}9 gibi) görünür.`,
      { t: `Basamaklara göre sayım:`, fig: (() => { const names = ["birler", "onlar", "yüzler", "binler"], cnt = [0, 0, 0, 0]; for (let i = 1; i <= n; i++) { const st = String(i); for (let p = 0; p < st.length; p++) if (st[st.length - 1 - p] === String(d)) cnt[p]++; } const rows = cnt.map((c2, p) => [names[p], fmt(c2)]).filter((r, p) => p < String(n).length); return solTable(["Basamak", `${d} kaç kez`], rows, ["Toplam", fmt(c)]); })() },
      d === 0 ? `Dikkat: 0 hiçbir sayının en başına yazılmaz; bu yüzden 0 diğer rakamlardan daha az görünür.` : null,
      `Toplam ${fmt(c)} kez.`) });
  });
  add("okuma", 7, 8, (l) => {
    const n = l === 7 ? ri(100, 999) : ri(1000, 3000), t = digitsUpTo(n);
    return N(`Bir kitabın sayfaları 1'den başlayarak numaralandırılıyor. Bunun için toplam ${fmt(t)} rakam kullanıldı. Kitap kaç sayfadır?`, n, `1–9: 9, 10–99: 180${n >= 1000 ? ", 100–999: 2700" : ""} rakam. Kalan rakamlar ${n >= 1000 ? 4 : 3} basamaklı sayfalara gider: ${n >= 1000 ? `(${fmt(t)} − 2889) ÷ 4 = ${n - 999}; sayfa sayısı 999 + ${n - 999} = ${fmt(n)}` : `(${fmt(t)} − 189) ÷ 3 = ${n - 99}; sayfa sayısı 99 + ${n - 99} = ${n}`}.`, cards([{ t: fmt(t), s: "kullanılan rakam" }, { t: "📖 ?", s: "sayfa", q: true }]), { hint: "Önce tek ve iki basamaklı sayfaların kullandığı rakamları çıkar.", sol: SOL("Rakamları sayfa gruplarına harcayalım: önce tek basamaklı sayfalar, sonra iki basamaklılar… Kalan rakamlar son gruptaki sayfalara gider.",
      { t: `Tam dolan gruplar:`, fig: solTable(["Sayfalar", "Adet", "Basamak", "Rakam"], digitRows(n >= 1000 ? 999 : 99), ["", "", "Toplam", fmt(digitsUpTo(n >= 1000 ? 999 : 99))]) },
      `Kalan rakamlar: ${fmt(t)} − ${fmt(digitsUpTo(n >= 1000 ? 999 : 99))} = ${fmt(t - digitsUpTo(n >= 1000 ? 999 : 99))}. Bunlar ${n >= 1000 ? 4 : 3} basamaklı sayfalara gider: ${fmt(t - digitsUpTo(n >= 1000 ? 999 : 99))} ÷ ${n >= 1000 ? 4 : 3} = ${n - (n >= 1000 ? 999 : 99)} sayfa.`,
      `${n >= 1000 ? 999 : 99}. sayfadan sonra ${n - (n >= 1000 ? 999 : 99)} sayfa daha: son sayfa ${fmt(n)}.`) });
  });
  add("okuma", 8, 8, () => {
    const lenA = ri(3, 5), a = ri(10 ** (lenA - 1), 10 ** lenA - 1), b = a + ri(200, lenA === 5 ? 20000 : 3000);
    let c = 0; for (let i = a; i <= b; i++) { const s = String(i); if (s === s.split("").reverse().join("")) c++; }
    return N(`Tersten okunuşu kendisiyle aynı olan sayılara palindrom denir (örneğin 4774). ${fmt(a)} ile ${fmt(b)} arasında (uçlar dahil) kaç palindrom sayı vardır?`, c, `Palindromun ilk yarısı sayıyı belirler. Aralıktaki uygun ilk yarılar sayılır: ${c}.`, cards([{ t: fmt(a), s: "başlangıç" }, { t: "🔁", s: "palindrom" }, { t: fmt(b), s: "bitiş" }]), { hint: "Basamak sayısına göre ayır; palindromu ilk yarısı belirler.", sol: SOL("Bir palindromun ilk yarısını seçince sayı belli olur: 4774'ü 47 belirler, 12321'i 123 belirler. Bu yüzden palindromları ilk yarılarıyla sayabiliriz.",
      `Örnek: 3 basamaklı palindromlar aba biçimindedir: a 1–9, b 0–9 → 90 tane (101, 111, …, 999).`,
      { t: `Aralıktaki palindromları basamak sayısına göre say:`, fig: (() => { const g = {}; for (let i = a; i <= b; i++) { const st = String(i); if (st === st.split("").reverse().join("")) { const L = st.length; g[L] = g[L] || []; g[L].push(i); } } return solTable(["Basamak", "İlk", "Son", "Adet"], Object.keys(g).map((L) => [L, fmt(g[L][0]), fmt(g[L][g[L].length - 1]), g[L].length]), ["", "", "Toplam", c]); })() },
      `Toplam ${c} palindrom.`) });
  });

  // 13. Basamak değeri
  add("basamak", 6, 7, (l) => {
    if (l === 6) {
      const a = ri(2, 9), b = ri(1, a - 1);
      return N(`İki basamaklı bir sayının rakamları yer değiştirince sayı ${9 * (a - b)} azalıyor. Rakamlarının toplamı ${a + b}. Sayı kaçtır?`, 10 * a + b, `(10a + b) − (10b + a) = 9(a − b) = ${9 * (a - b)} → a − b = ${a - b}. a + b = ${a + b}. a = ${a}, b = ${b} → ${10 * a + b}.`, cards([{ t: "a b", s: "sayı" }, { t: "b a", s: "ters" }, { t: "−" + 9 * (a - b), s: "fark" }]), { hint: "Rakamları değişince fark her zaman 9'un katıdır.", sol: SOL("İki basamaklı ab sayısının değeri 10a + b'dir. Rakamlar yer değiştirince 10b + a olur.",
        `Fark: (10a + b) − (10b + a) = 9a − 9b = 9 × (a − b).`,
        `9 × (a − b) = ${9 * (a - b)} → a − b = ${a - b}. Ayrıca a + b = ${a + b}.`,
        { t: `Toplamı ${a + b}, farkı ${a - b} olan iki rakam: büyük (${a + b} + ${a - b}) ÷ 2 = ${a}, küçük ${b}.`, fig: bars([{ name: "a", parts: [{ w: b, label: b }, { w: a - b, label: a - b, fill: LIGHT.gold, stroke: GOLD }] }, { name: "b", parts: [{ w: b, label: b }] }], { note: `a + b = ${a + b}` }) },
        `Sayı ${10 * a + b}. (Kontrol: ${10 * a + b} − ${10 * b + a} = ${9 * (a - b)}.)`) });
    }
    const k = ri(1, 8), D = 99 * k, ans = 10 * (9 - k);
    return N(`abc üç basamaklı bir sayı ve cba da üç basamaklı. abc − cba = ${D} olan kaç farklı abc sayısı vardır?`, ans, `abc − cba = 99(a − c) = ${D} → a − c = ${k}. c en az 1 olmalı: (c, a) için ${9 - k} seçenek; b 0–9 arası 10 seçenek. ${9 - k} × 10 = ${ans}.`, cards([{ t: "a b c" }, { t: "−" }, { t: "c b a" }, { t: "= " + D }]), { hint: "abc − cba farkında ortadaki rakam yok olur.", sol: SOL("Sayıları basamak değerleriyle yazalım: abc = 100a + 10b + c, cba = 100c + 10b + a.",
      `Fark: 100a + 10b + c − 100c − 10b − a = 99a − 99c = 99 × (a − c). Ortadaki b farkı etkilemez.`,
      `99 × (a − c) = ${D} → a − c = ${k}.`,
      { t: `cba da üç basamaklı olduğu için c en az 1. a = c + ${k} en çok 9 olmalı: c = 1, …, ${9 - k} → ${9 - k} seçenek.`, fig: solTable(["c", "a"], Array.from({ length: 9 - k }, (_, i) => [i + 1, i + 1 + k])) },
      `b her biri için 0–9 arası 10 seçenek: ${9 - k} × 10 = ${ans}.`) });
  });
  add("basamak", 6, 8, (l) => {
    if (l === 6) {
      const x = ri(12, 999);
      return N(`Bir doğal sayının sağına 0 yazılınca sayı ${fmt(9 * x)} artıyor. Sayı kaçtır?`, x, `Sağına 0 yazmak sayıyı 10 katına çıkarır; artış 9 kat: 9x = ${fmt(9 * x)} → x = ${x}.`, cards([{ t: "x", s: "sayı" }, { t: "x0", s: "yeni sayı" }, { t: "+" + fmt(9 * x), s: "artış" }]), { sol: SOL("Bir sayının sağına 0 yazmak onu 10 katına çıkarır (her rakam bir basamak sola kayar).",
        `Sayı x ise yeni sayı 10x. Artış 10x − x = 9x.`,
        `9x = ${fmt(9 * x)} → x = ${fmt(9 * x)} ÷ 9 = ${x}.`) });
    }
    if (l === 7) {
      const x = ri(12, 999), d = ri(1, 9), D = 9 * x + d;
      return N(`Bir doğal sayının sağına ${d} yazılınca sayı ${fmt(D)} artıyor. Sayı kaçtır?`, x, `Yeni sayı 10x + ${d}. Artış 9x + ${d} = ${fmt(D)} → 9x = ${fmt(D - d)} → x = ${x}.`, cards([{ t: "x", s: "sayı" }, { t: `x${d}`, s: "yeni sayı" }, { t: "+" + fmt(D), s: "artış" }]), { hint: "Sağına bir rakam yazmak: 10 katına çıkar, sonra rakamı ekle.", sol: SOL("Sağına bir rakam yazmak, sayıyı 10 katına çıkarıp o rakamı eklemektir. Örnek: 37'nin sağına 5 yazınca 375 = 37 × 10 + 5.",
        `Sayı x ise yeni sayı 10x + ${d}. Artış (10x + ${d}) − x = 9x + ${d}.`,
        `9x + ${d} = ${fmt(D)} → 9x = ${fmt(D - d)} → x = ${x}.`) });
    }
    const opts = [];
    for (let k = 2; k <= 4; k++) for (let d = 1; d <= 9; d++) for (let m = 2; m <= 60; m++) { const x = d * 10 ** k / (m - 1); if (Number.isInteger(x) && String(x).length === k) opts.push([k, d, m, x]); }
    const [k, d, m, x] = pick(opts);
    return N(`${k} basamaklı bir sayının soluna ${d} yazılınca sayı ${m} katına çıkıyor. Sayı kaçtır?`, x, `Soluna ${d} yazmak ${d} × ${fmt(10 ** k)} ekler: ${fmt(d * 10 ** k)} + x = ${m}x → ${m - 1}x = ${fmt(d * 10 ** k)} → x = ${fmt(x)}.`, cards([{ t: "x", s: `${k} basamaklı` }, { t: `${d}x`, s: `${m} katı` }]), { hint: "Sola yazılan rakamın basamak değerini düşün.", sol: SOL("Sayının soluna yazılan rakam, sayının basamaklarının üstüne yeni bir basamak ekler. Değeri rakam × 10, 100, 1000… olur.",
      `x ${k} basamaklı; soluna ${d} yazmak ${d} × ${fmt(10 ** k)} = ${fmt(d * 10 ** k)} ekler. Yeni sayı ${fmt(d * 10 ** k)} + x.`,
      `Yeni sayı x'in ${m} katı: ${fmt(d * 10 ** k)} + x = ${m}x → ${fmt(d * 10 ** k)} = ${m - 1}x.`,
      `x = ${fmt(d * 10 ** k)} ÷ ${m - 1} = ${fmt(x)}. (Kontrol: ${d}${String(x)} = ${m} × ${fmt(x)}.)`) });
  });
  add("basamak", 7, 8, (l) => {
    if (l === 7) {
      const k = ri(3, 6), S = ri(k + 3, 9 * k - 2), ds = Array(k).fill(0);
      let rest = S - 1; for (let i = k - 1; i >= 1; i--) { const v = Math.min(9, rest); ds[i] = v; rest -= v; } ds[0] = 1 + rest;
      if (ds[0] > 9) return null;
      const n = Number(ds.join("")), big = rnd() < .5;
      if (big) { const bd = Array(k).fill(0); let r = S; for (let i = 0; i < k; i++) { bd[i] = Math.min(9, r); r -= bd[i]; } const bn = Number(bd.join("")); return N(`Rakamları toplamı ${S} olan en büyük ${k} basamaklı sayı kaçtır?`, bn, `Büyük basamaklara olabildiğince büyük rakam: ${bd.join(", ")} → ${fmt(bn)}.`, cards(bd.map(() => ({ t: "?" }))), { sol: SOL("Sayının büyük olması için en soldaki (en değerli) basamaklar olabildiğince büyük olmalı.",
        `Soldan başla, her basamağa en büyük rakamı (9) koy; toplam yetmeyince kalanı yaz, gerisini 0 yap.`,
        { t: `Rakamlar: ${bd.join(" + ")} = ${S}.`, fig: cards(bd.map((v) => ({ t: v }))) },
        `En büyük sayı ${fmt(bn)}.`) });  }
      return N(`Rakamları toplamı ${S} olan en küçük ${k} basamaklı sayı kaçtır?`, n, `Küçük basamaklara 9'lar yerleştirilir, kalan en başa yazılır (ilk rakam en az 1): ${ds.join(", ")} → ${fmt(n)}.`, cards(ds.map(() => ({ t: "?" }))), { hint: "En sağdan başlayıp 9 yerleştir; ilk rakam 0 olamaz.", sol: SOL("Sayının küçük olması için en soldaki basamak olabildiğince küçük olmalı; toplam ise sağdaki basamaklarda toplanmalı.",
        `İlk rakam en az 1 (0 olamaz). Kalan toplamı (${S - 1}) sağdan başlayarak 9'larla doldur.`,
        { t: `Sağdan: ${ds.slice(1).reverse().join(", ")}; ilk rakam ${ds[0]}. Toplam ${ds.join(" + ")} = ${S}.`, fig: cards(ds.map((v) => ({ t: v }))) },
        `En küçük sayı ${fmt(n)}.`) });
    }
    const S = ri(10, 44);
    let best = -1;
    for (let mask = 1; mask < 1024; mask++) { const ds = []; for (let d = 9; d >= 0; d--) if (mask & (1 << d)) ds.push(d); if (sum(ds) !== S || (ds.length > 1 && ds[0] === 0)) continue; const v = Number(ds.join("")); if (v > best) best = v; }
    if (best < 0) return null;
    return N(`Rakamları birbirinden farklı ve rakamları toplamı ${S} olan en büyük doğal sayı kaçtır?`, best, `Önce basamak sayısı en çok olmalı: en küçük rakamlardan başlayıp toplamı ${S} yapacak en çok rakam seçilir. Sonra rakamlar büyükten küçüğe dizilir: ${fmt(best)}.`, cards([{ t: "0 1 2 … 9" }, { t: "farklı rakamlar" }, { t: "Σ = " + S, q: true }]), { hint: "Basamak sayısı fazla olan sayı daha büyüktür; en çok kaç farklı rakam kullanabilirsin?", sol: SOL("Basamağı çok olan sayı her zaman daha büyüktür (5 basamaklı > 4 basamaklı). Önce olabildiğince çok rakam kullanalım.",
      `En çok rakam için en küçük rakamları seç: 0 + 1 + 2 + 3 + … Toplamı ${S} sayısını geçmeyecek şekilde kaç rakam alabiliriz? ${String(best).length} rakam.`,
      { t: `Seçilen rakamlar toplamı ${S} yapmalı; fazlalık büyük rakamlara verilir ki sayı büyüsün: ${String(best).split("").join(" + ")} = ${S}.`, fig: cards(String(best).split("").map((v) => ({ t: v }))) },
      `Rakamları büyükten küçüğe diz: ${fmt(best)}.`) });
  });
  add("basamak", 8, 8, () => {
    const k = pick([3, 3, 4]), S = ri(3, 9 * k - 3);
    let count = 0; for (let n = 10 ** (k - 1); n < 10 ** k; n++) if (digitSum(n) === S) count++;
    return N(`Rakamları toplamı ${S} olan kaç tane ${k} basamaklı doğal sayı vardır?`, count, `İlk rakamı (1–9) sabitleyip kalan basamakları sistemli say ya da tablo kur: toplam ${count}.`, cards(Array.from({ length: k }, (_, i) => ({ t: i ? "?" : "1–9" })).concat([{ t: "Σ = " + S, q: true }])), { hint: "İlk rakamı seç, kalan basamakların toplamını dağıt.", sol: SOL("İlk rakamı (1–9) sabitleyelim. Geriye kalan basamaklar, kalan toplamı paylaşır.",
      `Örnek: iki rakamın toplamı t ise (0–9 arası) kaç seçenek var? t ≤ 9 ise t + 1, t ≥ 10 ise 19 − t.`,
      { t: `İlk rakama göre sayım:`, fig: (() => { const rows = []; for (let f0 = 1; f0 <= 9; f0++) { let c2 = 0; for (let r = 0; r < 10 ** (k - 1); r++) if (f0 + digitSum(r) === S) c2++; if (c2) rows.push([f0, S - f0, c2]); } return solTable(["İlk rakam", "Kalan toplam", "Sayı"], rows, ["", "Toplam", count]); })() },
      `Toplam ${count} sayı.`) });
  });

  // 14. Sıralama ve karşılaştırma
  add("sirala", 6, 7, (l) => {
    if (l === 6) {
      const a = ri(1000, 90000), b = a + ri(50, 5000), ans = Math.floor((b - 1) / 2) - Math.floor(a / 2);
      return N(`${fmt(a)} ile ${fmt(b)} arasında (uçlar hariç) kaç çift sayı vardır?`, ans, `${ek(b - 1, "e")} kadar ${fmt(Math.floor((b - 1) / 2))} pozitif çift, ${ek(a, "e")} kadar ${fmt(Math.floor(a / 2))} pozitif çift var. Fark ${fmt(ans)}.`, cards([{ t: fmt(a) }, { t: "… çift?", q: true }, { t: fmt(b) }]), { sol: SOL("1'den bir sayıya kadar olan çift sayılar, o sayının yarısı kadardır (küsurat atılır). Farkı alarak aradakileri buluruz.",
        `${ek(b - 1, "e")} kadar çift sayılar: ${fmt(b - 1)} ÷ 2 → ${fmt(Math.floor((b - 1) / 2))} tane.`,
        `${ek(a, "e")} kadar (${fmt(a)} dahil) çift sayılar: ${fmt(a)} ÷ 2 → ${fmt(Math.floor(a / 2))} tane.`,
        `Aradakiler: ${fmt(Math.floor((b - 1) / 2))} − ${fmt(Math.floor(a / 2))} = ${fmt(ans)}.`) });
    }
    const a = ri(1000, 9000), b = a + ri(100, 1500);
    let c = 0; for (let i = a + 1; i < b; i++) if (new Set(String(i)).size === String(i).length) c++;
    return N(`${fmt(a)} ile ${fmt(b)} arasında (uçlar hariç) rakamları birbirinden farklı kaç sayı vardır?`, c, `Binler ve yüzler basamağına göre gruplanıp her grupta rakamları farklı sayılar sayılır: ${c}.`, cards([{ t: fmt(a) }, { t: "rakamları farklı?", q: true }, { t: fmt(b) }]), { hint: "Binler ve yüzler basamağını sabitle; kalan iki basamak için seçenekleri say.", sol: SOL("Sayıları yüzlük gruplara ayıralım (ilk iki rakam aynı olanlar). İlk iki rakam farklıysa, kalan iki basamağa 8 ve 7 seçenek kalır: tam bir grupta 56 sayı.",
      `Örnek: 23__ grubunda onlar basamağı 2 ve 3 dışında 8 rakamdan biri, birler kalan 7 rakamdan biri: 8 × 7 = 56.`,
      { t: `Gruplara göre sayım (ilk iki rakam aynıysa o grupta hiç sayı yok):`, fig: (() => { const g = {}; for (let i = a + 1; i < b; i++) { const key = Math.floor(i / 100); g[key] = g[key] || 0; if (new Set(String(i)).size === 4) g[key]++; } const rows = Object.keys(g).map((k2) => [`${k2}__`, g[k2]]); return solTable(["Grup", "Rakamları farklı"], rows.length > 10 ? [...rows.slice(0, 4), ["…", "…"], ...rows.slice(-4)] : rows, ["Toplam", c]); })() },
      `Toplam ${c} sayı. (Uç gruplar yarım olabilir; yalnız aralıktakiler sayılır.)`) });
  });
  add("sirala", 6, 8, (l) => {
    const k = l === 6 ? 4 : 5, ds = l === 8 ? (() => { const d = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4); return [...d, d[ri(0, 3)]]; })() : shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, k);
    const nums = cardNumbers(ds), X = nums[ri(2, nums.length - 3)], ans = nums.filter((v) => v > X).length;
    return N(`Kartlardaki rakamların her biri bir kez kullanılarak ${k} basamaklı sayılar yazılıyor. Bu sayılardan kaç tanesi ${ek(X, "den")} büyüktür?`, ans, `Yazılabilen farklı sayı ${nums.length}${l === 8 ? " (aynı rakamlar yer değişince aynı sayı çıkar)" : ""}. ${ek(X, "den")} büyük olanlar soldan basamak basamak sayılır: ${ans}.`, cards(ds.map((d) => ({ t: d }))), { hint: "En soldaki rakamdan başla; X'in rakamlarıyla karşılaştırarak say.", sol: SOL(`Sayıları ilk rakamlarına göre gruplayalım. İlk rakamı ${ek(Number(String(X)[0]), "den")} büyük olanların hepsi büyüktür; eşit olanlarda bir sonraki rakama bakılır.`,
      `Yazılabilen farklı sayı adedi ${nums.length}. (İlk rakam 0 olamaz.)`,
      { t: `İlk rakama göre gruplar:`, fig: (() => { const g = {}; nums.forEach((v) => { const d0 = String(v)[0]; g[d0] = g[d0] || [0, 0]; g[d0][0]++; if (v > X) g[d0][1]++; }); return solTable(["İlk rakam", "Kaç sayı", `${ek(X, "den")} büyük`], Object.keys(g).sort().map((d0) => [d0, g[d0][0], g[d0][1]]), ["", "Toplam", ans]); })() },
      `${ek(X, "den")} büyük ${ans} sayı var.`) });
  });
  add("sirala", 7, 8, (l) => {
    const k = l === 7 ? 4 : ri(5, 6), ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, k), nums = cardNumbers(ds), X = pick(nums), rank = nums.indexOf(X) + 1;
    return N(`Kartlardaki ${k} rakamın her biri bir kez kullanılarak yazılabilen bütün ${k} basamaklı sayılar küçükten büyüğe sıralanıyor. ${fmt(X)} kaçıncı sıradadır?`, rank, `Her başlangıç rakamı için ${(k - 1) === 3 ? 6 : (k - 1) === 4 ? 24 : 120} sayı vardır. ${ek(X, "den")} önce gelenler soldan basamak basamak sayılır: ${rank - 1} sayı. Sırası ${rank}.`, cards(ds.map((d) => ({ t: d }))), { hint: "İlk rakamı X'inkinden küçük olan kaç sayı var? Sonra ikinci rakama geç.", sol: SOL(`${ek(X, "den")} önce gelen sayıları sayalım. Soldan her basamakta: o basamağa X'in rakamından küçük bir rakam koyarsak, kalan basamaklar nasıl dizilirse dizilsin sayı küçük olur.`,
      `Kalan r kart r × (r − 1) × … × 1 şekilde dizilir: 4 kart 24, 3 kart 6, 2 kart 2 şekilde.`,
      { t: `Basamak basamak:`, fig: solTable(["Basamak", "Daha küçük kullanılmamış rakamlar", "Önce gelen"], rankRows(ds, X), ["", "Toplam", rank - 1]) },
      `${ek(X, "den")} önce ${rank - 1} sayı var; ${fmt(X)} ${rank}. sırada.`) });
  });
  add("sirala", 8, 8, () => {
    const ds = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 5), nums = cardNumbers(ds).reverse(), k = ri(5, 40), ans = nums[k - 1];
    return N(`Kartlardaki beş rakamın her biri bir kez kullanılarak yazılabilen beş basamaklı sayılar büyükten küçüğe sıralanıyor. ${k}. sıradaki sayı kaçtır?`, ans, `Her başlangıç rakamı için 24 sayı vardır. Gruplar atlanarak sıra daraltılır: ${k}. sayı ${fmt(ans)}.`, cards(ds.map((d) => ({ t: d }))), { hint: "En büyük başlangıç rakamıyla 24 sayı yazılır; hangi grupta olduğunu bul.", sol: SOL("Büyükten küçüğe sıralanınca sayılar ilk rakamlarına göre gruplanır. Her ilk rakamla kalan 4 kart 4 × 3 × 2 × 1 = 24 şekilde dizilir.",
      { t: `İlk rakama göre 24'lük gruplar (büyükten küçüğe):`, fig: (() => { const firsts = [...ds].filter((d0) => d0 !== 0).sort((x, y) => y - x); let from = 1; return solTable(["İlk rakam", "Sıralar"], firsts.map((d0) => { const row = [d0, `${from}–${from + 23}`]; from += 24; return row; })); })() },
      `${k}. sayı, ${Math.ceil(k / 24)}. grupta (ilk rakam ${String(ans)[0]}); grubun içinde ${(k - 1) % 24 + 1}. sırada. Grup içinde ikinci rakama göre 6'lık alt gruplar var.`,
      `Böyle daraltarak ${k}. sayı: ${fmt(ans)}.`) });
  });

  // 15. Toplama ve çıkarma
  add("islem", 6, 7, (l) => {
    if (l === 6) {
      const a = ri(2, 9), b = ri(1, a - 1);
      return N(`İki basamaklı ab sayısı ile ba sayısının toplamı ${11 * (a + b)}, farkı ${9 * (a - b)}. ab kaçtır?`, 10 * a + b, `ab + ba = 11(a + b) = ${11 * (a + b)} → a + b = ${a + b}. ab − ba = 9(a − b) = ${9 * (a - b)} → a − b = ${a - b}. a = ${a}, b = ${b}.`, cards([{ t: "ab + ba", s: String(11 * (a + b)) }, { t: "ab − ba", s: String(9 * (a - b)) }, { t: "ab = ?", q: true }]), { sol: SOL("ab sayısının değeri 10a + b, ba sayısının değeri 10b + a. Toplam ve fark bize a + b ve a − b'yi verir.",
        `Toplam: (10a + b) + (10b + a) = 11a + 11b = 11 × (a + b). 11 × (a + b) = ${11 * (a + b)} → a + b = ${a + b}.`,
        `Fark: (10a + b) − (10b + a) = 9 × (a − b) = ${9 * (a - b)} → a − b = ${a - b}.`,
        `Toplamı ${a + b}, farkı ${a - b} olan iki rakam: a = (${a + b} + ${a - b}) ÷ 2 = ${a}, b = ${b}. Sayı ${10 * a + b}.`) });
    }
    const n = pick([5, 6, 7, 8, 9]), x = ri(20, 900), S = n * x + n * (n - 1) / 2, big = rnd() < .5;
    return N(`Ardışık ${n} doğal sayının toplamı ${fmt(S)}. En ${big ? "büyük" : "küçük"} sayı kaçtır?`, big ? x + n - 1 : x, `En küçüğü x: ${n}x + (0 + 1 + … + ${n - 1}) = ${n}x + ${n * (n - 1) / 2} = ${fmt(S)} → x = ${x}.${big ? ` En büyük ${x + n - 1}.` : ""}`, bars([{ parts: Array.from({ length: n }, (_, i) => ({ w: 1, label: i ? `x+${i}` : "x" })) }], { total: fmt(S) }), { sol: SOL("Ardışık sayıların hepsini en küçük sayı (x) cinsinden yazalım.",
        `Sayılar: x, x + 1, x + 2, …, x + ${n - 1}.`,
        { t: `${n} tane x ve fazlalıklar 1 + 2 + … + ${n - 1} = ${n * (n - 1) / 2}. Toplam: ${n}x + ${n * (n - 1) / 2} = ${fmt(S)}.`, fig: bars([{ parts: Array.from({ length: n }, (_, i) => ({ w: 1, label: i ? `x+${i}` : "x" })) }], { total: fmt(S) }) },
        `${n}x = ${fmt(S)} − ${n * (n - 1) / 2} = ${fmt(S - n * (n - 1) / 2)} → x = ${x}.`,
        big ? `En büyük sayı x + ${n - 1} = ${x + n - 1}.` : `En küçük sayı ${x}.`) });
  });
  add("islem", 6, 8, (l) => {
    if (l === 6) {
      const a = ri(3, 40), d = ri(2, 9), n = ri(10, 40), b = a + (n - 1) * d, S = n * (a + b) / 2;
      return N(`${a} + ${a + d} + ${a + 2 * d} + … + ${b} toplamı kaçtır? (Her terim bir öncekinden ${d} fazla.)`, S, `Terim sayısı (${b} − ${a}) ÷ ${d} + 1 = ${n}. Baştan ve sondan eşleşen çiftlerin toplamı ${a + b}: ${n} × ${a + b} ÷ 2 = ${fmt(S)}.`, cards([{ t: a }, { t: a + d }, { t: "…" }, { t: b }]), { hint: "İlk ve son terimi eşleştir; kaç çift var?", sol: SOL("Eşit artan bir toplamda ilk ile son, ikinci ile sondan ikinci… her çiftin toplamı aynıdır (Gauss yöntemi).",
        `Terim sayısı: (son − ilk) ÷ artış + 1 = (${b} − ${a}) ÷ ${d} + 1 = ${n}.`,
        { t: `Toplamı iki kez alt alta yaz: biri baştan, biri sondan. Her sütunun toplamı ${a} + ${b} = ${a + b}.`, fig: solTable(["", "1.", "2.", "…", `${n}.`], [["baştan", a, a + d, "…", b], ["sondan", b, b - d, "…", a]], ["toplam", a + b, a + b, "…", a + b]) },
        `İki toplam ${n} × ${a + b} = ${fmt(n * (a + b))}. Bir toplam bunun yarısı: ${fmt(S)}.`) });
    }
    if (l === 7) {
      const a = 2 * ri(5, 200), b = a + 2 * ri(20, 200), n = (b - a) / 2 - 1, S = n * (a + b) / 2;
      return N(`${a} ile ${b} arasındaki (uçlar hariç) çift sayıların toplamı kaçtır?`, S, `Çift sayılar ${a + 2}, ${a + 4}, …, ${b - 2}: ${n} terim. Toplam ${n} × (${a + 2} + ${b - 2}) ÷ 2 = ${fmt(S)}.`, cards([{ t: a + 2 }, { t: a + 4 }, { t: "…" }, { t: b - 2 }]), { sol: SOL("Aradaki çift sayılar eşit artan bir dizi: her biri bir öncekinden 2 fazla. İlk ve son terimi eşleştirerek toplarız.",
        `İlk çift sayı ${a + 2}, son çift sayı ${b - 2}. Terim sayısı (${b - 2} − ${a + 2}) ÷ 2 + 1 = ${n}.`,
        `Baştan ve sondan eşleşen her çiftin toplamı ${a + 2} + ${b - 2} = ${a + b}.`,
        `Toplam ${n} × ${a + b} ÷ 2 = ${fmt(S)}.`) });
    }
    if (rnd() < .5) {
      const N0 = 2 * ri(20, 500);
      return N(`${N0} − ${N0 - 1} + ${N0 - 2} − ${N0 - 3} + … + 2 − 1 işleminin sonucu kaçtır?`, N0 / 2, `Terimleri ikişer grupla: (${N0} − ${N0 - 1}) + (${N0 - 2} − ${N0 - 3}) + … + (2 − 1). Her grup 1, grup sayısı ${N0 / 2}. Sonuç ${N0 / 2}.`, cards([{ t: `(${N0} − ${N0 - 1})` }, { t: "+ …" }, { t: "(2 − 1)" }]), { hint: "Ardışık iki terimi birlikte düşün.", sol: SOL("Yüzlerce terimi tek tek toplamak yerine terimleri ikişer ikişer gruplayalım.",
        { t: `(${N0} − ${N0 - 1}) = 1, (${N0 - 2} − ${N0 - 3}) = 1, …, (2 − 1) = 1.`, fig: cards([{ t: `(${N0} − ${N0 - 1}) = 1` }, { t: `(${N0 - 2} − ${N0 - 3}) = 1` }, { t: "…" }, { t: "(2 − 1) = 1" }]) },
        `${N0} terim ikişer gruplanınca ${N0} ÷ 2 = ${N0 / 2} grup olur.`,
        `Her grup 1: sonuç ${N0 / 2}.`) });
    }
    const m = ri(10, 60), ans = 3 * m * (m - 1) / 2;
    return N(`1 + 2 − 3 + 4 + 5 − 6 + 7 + 8 − 9 + … + ${3 * m - 2} + ${3 * m - 1} − ${3 * m} işleminin sonucu kaçtır?`, ans, `Üçerli gruplar: (3k − 2) + (3k − 1) − 3k = 3k − 3. k = 1'den ${ek(m, "e")}: 0 + 3 + 6 + … + ${3 * m - 3} = 3 × (0 + 1 + … + ${m - 1}) = ${ans}.`, cards([{ t: "(1 + 2 − 3)" }, { t: "+ (4 + 5 − 6)" }, { t: "+ …" }]), { hint: "Terimleri üçerli grupla; her grubun sonucu nasıl değişiyor?", sol: SOL("İşaretler + + − diye üçlü tekrar ediyor. Terimleri üçerli gruplayalım.",
      { t: `İlk gruplar: (1 + 2 − 3) = 0, (4 + 5 − 6) = 3, (7 + 8 − 9) = 6, … Her grup öncekinden 3 fazla.`, fig: solTable(["Grup", "Hesap", "Sonuç"], [[1, "1 + 2 − 3", 0], [2, "4 + 5 − 6", 3], [3, "7 + 8 − 9", 6], ["…", "…", "…"], [m, `${3 * m - 2} + ${3 * m - 1} − ${3 * m}`, 3 * m - 3]]) },
      `${3 * m} terim → ${m} grup. Sonuçlar 0, 3, 6, …, ${3 * m - 3}: hepsi 3'ün katı.`,
      `0 + 3 + 6 + … + ${3 * m - 3} = 3 × (0 + 1 + 2 + … + ${m - 1}) = 3 × ${m * (m - 1) / 2} = ${ans}.`) });
  });
  add("islem", 7, 8, (l) => {
    if (l === 7) {
      const x = ri(20, 400), k = ri(2, 6), d = ri(3, 60), S = x + k * x + d, big = rnd() < .5;
      return N(`Toplamları ${fmt(S)} olan iki sayıdan büyüğü, küçüğün ${k} katından ${d} fazladır. ${big ? "Büyük" : "Küçük"} sayı kaçtır?`, big ? k * x + d : x, `Küçük x: x + ${k}x + ${d} = ${fmt(S)} → ${k + 1}x = ${fmt(S - d)} → x = ${x}.${big ? ` Büyük ${k} × ${x} + ${d} = ${k * x + d}.` : ""}`, bars([{ name: "küçük", parts: [{ w: 1, label: "x" }] }, { name: "büyük", parts: [...Array.from({ length: k }, () => ({ w: 1, label: "x" })), { w: .6, label: "+" + d, fill: LIGHT.gold, stroke: GOLD }] }], { note: "toplam " + fmt(S) }), { sol: SOL(`Şerit modeli çizelim: küçük sayı 1 kutu, büyük sayı ${k} kutu ve ${d} fazlası.`,
        { t: `Küçük = x, büyük = ${k}x + ${d}. İkisi birlikte ${k + 1} kutu ve ${d}.`, fig: bars([{ name: "küçük", parts: [{ w: 1, label: "x" }] }, { name: "büyük", parts: [...Array.from({ length: k }, () => ({ w: 1, label: "x" })), { w: .6, label: "+" + d, fill: LIGHT.gold, stroke: GOLD }] }], { note: "toplam " + fmt(S) }) },
        `${k + 1} kutu + ${d} = ${fmt(S)} → ${k + 1} kutu = ${fmt(S - d)} → bir kutu x = ${x}.`,
        big ? `Büyük sayı ${k} × ${x} + ${d} = ${k * x + d}.` : `Küçük sayı ${x}.`) });
    }
    const A = ri(10, 400), B = ri(10, 400), Cc = ri(10, 400), ask = pick(["A", "B", "C"]);
    return N(`A + B = ${A + B}, B + C = ${B + Cc}, A + C = ${A + Cc}. ${ask} kaçtır?`, { A, B, C: Cc }[ask], `Üç eşitliği topla: 2(A + B + C) = ${2 * (A + B + Cc)} → A + B + C = ${A + B + Cc}. ${ask === "A" ? `A = ${A + B + Cc} − ${B + Cc}` : ask === "B" ? `B = ${A + B + Cc} − ${A + Cc}` : `C = ${A + B + Cc} − ${A + B}`} = ${{ A, B, C: Cc }[ask]}.`, cards([{ t: "A + B", s: String(A + B) }, { t: "B + C", s: String(B + Cc) }, { t: "A + C", s: String(A + Cc) }, { t: ask + " = ?", q: true }]), { hint: "Üç eşitliği toplarsan ne elde edersin?", sol: SOL("Üç eşitliği alt alta toplayınca her harf iki kez görünür. Böylece A + B + C'yi buluruz.",
      `(A + B) + (B + C) + (A + C) = 2A + 2B + 2C = ${A + B} + ${B + Cc} + ${A + Cc} = ${2 * (A + B + Cc)}.`,
      `A + B + C = ${2 * (A + B + Cc)} ÷ 2 = ${A + B + Cc}.`,
      ask === "A" ? `A = (A + B + C) − (B + C) = ${A + B + Cc} − ${B + Cc} = ${A}.` : ask === "B" ? `B = (A + B + C) − (A + C) = ${A + B + Cc} − ${A + Cc} = ${B}.` : `C = (A + B + C) − (A + B) = ${A + B + Cc} − ${A + B} = ${Cc}.`) });
  });
  add("islem", 8, 8, () => {
    if (rnd() < .5) {
      const a = 2 * ri(5, 300) + 1, b = a + 2 * ri(20, 300), n = (b - a) / 2 + 1, S = n * (a + b) / 2;
      return N(`${ek(a, "den")} ${ek(b, "e")} kadar (uçlar dahil) bütün tek sayıların toplamı kaçtır?`, S, `Terim sayısı (${b} − ${a}) ÷ 2 + 1 = ${n}. Toplam ${n} × (${a} + ${b}) ÷ 2 = ${fmt(S)}.`, cards([{ t: a }, { t: a + 2 }, { t: "…" }, { t: b }]), { sol: SOL("Tek sayılar ikişer artar. İlk ile son, ikinci ile sondan ikinci… her çiftin toplamı aynıdır.",
        `Terim sayısı: (${b} − ${a}) ÷ 2 + 1 = ${n}.`,
        `Her eşleşen çiftin toplamı ${a} + ${b} = ${a + b}.`,
        `Toplam ${n} × ${a + b} ÷ 2 = ${fmt(S)}.`) });
    }
    const n = ri(30, 400), odd = Math.ceil(n / 2) ** 2, even = Math.floor(n / 2) * (Math.floor(n / 2) + 1), ans = Math.abs(even - odd);
    return N(`1'den ${ek(n, "e")} kadar olan çift sayıların toplamı ile tek sayıların toplamı arasındaki fark kaçtır?`, ans, n % 2 ? `Tekler bir fazla: (2 − 1) + (4 − 3) + … + (${n - 1} − ${n - 2}) = ${(n - 1) / 2}, sonra ${n} tek sayısı çıkar: |${(n - 1) / 2} − ${n}| = ${ans}.` : `(2 − 1) + (4 − 3) + … + (${n} − ${n - 1}): ${n / 2} grup, her biri 1 → ${ans}.`, cards([{ t: "2 + 4 + …", s: "çiftler" }, { t: "1 + 3 + …", s: "tekler" }, { t: "fark ?", q: true }]), { hint: "Her çift sayıyı kendinden önceki tek sayıyla eşleştir.", sol: SOL("İki büyük toplamı ayrı ayrı hesaplamak yerine her çift sayıyı kendinden önceki tek sayıyla eşleştirelim: 2 ile 1, 4 ile 3…",
      { t: `Her eşleşmede çift sayı 1 fazla: (2 − 1) = 1, (4 − 3) = 1, …`, fig: cards([{ t: "2 − 1 = 1" }, { t: "4 − 3 = 1" }, { t: "…" }, { t: n % 2 ? `${n - 1} − ${n - 2} = 1` : `${n} − ${n - 1} = 1` }]) },
      n % 2 ? `${(n - 1) / 2} eşleşme var: çiftler ${(n - 1) / 2} fazla. Ama ${n} tek sayısı eşsiz kaldı; o tekler toplamına eklenir.` : `${n / 2} eşleşme var; hiçbir sayı açıkta kalmaz.`,
      n % 2 ? `Tekler toplamı daha büyük: fark ${n} − ${(n - 1) / 2} = ${ans}.` : `Çiftler toplamı ${n / 2} fazla: fark ${ans}.`) });
  });

  // 16. Çarpma ve bölme
  add("carpan", 6, 7, (l) => {
    if (l === 6) {
      const a = ri(6, 30), q = ri(10, 200), r = ri(1, a - 1), n = a * q + r, b = pick([3, 4, 5, 6, 9, 10].filter((x) => x !== a));
      return N(`Bir sayı ${ek(a, "e")} bölününce bölüm ${q}, kalan ${r} oluyor. Aynı sayı ${ek(b, "e")} bölününce kalan kaçtır?`, n % b, `Sayı ${a} × ${q} + ${r} = ${n}. ${n} ÷ ${b} = ${Math.floor(n / b)}, kalan ${n % b}.`, divisionFig("?", a, q, r), { sol: SOL("Önce bölme bilgisinden sayının kendisini bulalım: bölünen = bölen × bölüm + kalan.",
        { t: `Sayı = ${a} × ${q} + ${r} = ${a * q} + ${r} = ${n}.`, fig: divisionFig(n, a, q, r) },
        `${n} ÷ ${b}: ${b} × ${Math.floor(n / b)} = ${b * Math.floor(n / b)}; ${n} − ${b * Math.floor(n / b)} = ${n % b}.`,
        `Kalan ${n % b}.`) });
    }
    const a = ri(4, 12), b = ri(4, 12); if (a === b) return null;
    const r1v = ri(0, a - 1), r2v = ri(0, b - 1), L = ri(20, 300);
    let n = L + 1; while (n < L + 1000 && !(n % a === r1v && n % b === r2v)) n++;
    if (n >= L + 1000) return null;
    return N(`${ek(L, "den")} büyük bir sayı ${ek(a, "e")} bölününce kalan ${r1v}, ${ek(b, "e")} bölününce kalan ${r2v}. Bu koşulu sağlayan en küçük sayı kaçtır?`, n, `${ek(a, "e")} bölününce ${r1v} kalanı veren sayılar ${a} artarak gider. ${ek(L, "den")} sonra bunlardan ${ek(b, "e")} bölününce ${r2v} kalanı veren ilk sayı ${n}.`, cards([{ t: `÷ ${a}`, s: `kalan ${r1v}` }, { t: `÷ ${b}`, s: `kalan ${r2v}` }, { t: `> ${L}`, s: "en küçük?", q: true }]), { hint: "Bir koşulu sağlayan sayıları sırayla yaz, diğer koşulu kontrol et.", sol: SOL("İki koşulu aynı anda aramak zor. Önce birinci koşulu sağlayan sayıları sırayla yazalım, sonra bunlarda ikinci koşulu kontrol edelim.",
      `${ek(a, "e")} bölününce ${r1v} kalanı veren sayılar ${a} arayla gelir.`,
      { t: `${ek(L, "den")} sonraki adaylar ve ${ek(b, "e")} bölümden kalanları:`, fig: (() => { let x = L + 1; while (x % a !== r1v) x++; const rows = []; for (let y = x; y <= n; y += a) rows.push([y, y % b, y % b === r2v ? "✔" : ""]); return solTable(["Aday", `÷ ${b} kalan`, ""], rows.length > 9 ? [...rows.slice(0, 3), ["…", "…", ""], ...rows.slice(-3)] : rows); })() },
      `İlk uygun sayı ${n}.`) });
  });
  const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  add("carpan", 6, 8, (l) => {
    const start = ri(0, 6);
    let label, how, r, extra = "";
    if (l === 6) { const n = ri(50, 999); label = String(n); r = n % 7; how = `${n} ÷ 7 işleminde kalan ${r}`; }
    else if (l === 7) { const a = ri(12, 90), b = ri(12, 90); label = `${a} × ${b}`; r = (a * b) % 7; how = `${a} ÷ 7 kalanı ${a % 7}, ${b} ÷ 7 kalanı ${b % 7}. Çarpımın kalanı, kalanların çarpımı ${(a % 7) * (b % 7)} sayısının 7'ye bölümünden kalandır: ${r}`; }
    else { const k = ri(10, 60); r = [1, 2, 4][k % 3]; label = "2" + sup(k); extra = ` (${label}: ${k} tane 2'nin çarpımı.)`; how = `2, 4, 8, 16, … sayılarının 7'ye bölümünden kalanlar 2, 4, 1, 2, 4, 1, … diye üçlü tekrar eder. ${k} ÷ 3 kalanı ${k % 3}, yani kalan ${r}`; }
    const ans = DAYS[(start + r) % 7];
    return C(`Bugün ${DAYS[start]}. ${label} gün sonra hangi gün olur?${extra}`, ans, DAYS.filter((d) => d !== ans), `Hafta 7 günde bir tekrar eder; yalnız 7'ye bölümden kalan önemlidir. ${how}. Bugünden ${r} gün sonra ${ans}.`, cards([{ t: "📅 " + DAYS[start], s: "bugün" }, { t: "+ " + label, s: "gün" }, { t: "?", q: true }]), { hint: "Gün sayısının 7'ye bölümünden kalanı bul.", sol: SOL("7 gün sonra yine aynı gün gelir. Bu yüzden tam haftaları atıp yalnız 7'ye bölümden kalan kadar ilerleriz.",
      l === 8 ? { t: `2'nin kuvvetlerinin 7'ye bölümünden kalanlar tekrar eder:`, fig: solTable(["Kuvvet", "Değer", "÷ 7 kalan"], [["2¹", 2, 2], ["2²", 4, 4], ["2³", 8, 1], ["2⁴", 16, 2], ["2⁵", 32, 4], ["2⁶", 64, 1]]) } : null,
      `${how}.`,
      { t: `${DAYS[start]} gününden ${r} gün ilerle: ${ans}.`, fig: weekFig(start, r) }) });
  });
  add("carpan", 7, 8, (l) => {
    const n = ri(100, 2000), list = l === 7 ? shuffle([2, 3, 4, 5, 6, 7, 9, 10]).slice(0, 2) : shuffle([2, 3, 5, 7, 4, 9, 11]).slice(0, 3);
    let c = 0; for (let i = 1; i <= n; i++) if (list.some((d) => i % d === 0)) c++;
    return N(`1'den ${ek(n, "e")} kadar (uçlar dahil) olan sayılardan kaç tanesi ${list.slice(0, -1).join(", ")} veya ${list[list.length - 1]} sayılarından en az birine tam bölünür?`, c,
      `Her birinin katlarını say, iki kez sayılanları (ortak katlar) çıkar${l === 8 ? ", üç kez sayılanları geri ekle" : ""}: ${c}.`, cards(list.map((d) => ({ t: `÷ ${d}` })).concat([{ t: `1 … ${fmt(n)}`, q: true }])), { hint: "Katlarını say; ortak katları iki kez saymamaya dikkat et.", sol: SOL("Her sayının katlarını ayrı ayrı sayıp toplayalım; iki listede birden olan sayıları bir kez sayacak şekilde düzeltelim.",
      { t: `1–${fmt(n)} arasında bir sayının kat adedi: ${fmt(n)} ÷ sayı (küsurat atılır).`, fig: (() => { const lcm = (x, y) => x * y / gcd(x, y), rows = list.map((d) => [`${ek(d, "in")} katları`, Math.floor(n / d)]); const pairs = []; for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) pairs.push([`${list[i]} ve ${list[j]} ortak (${ek(lcm(list[i], list[j]), "in")} katları)`, "−" + Math.floor(n / lcm(list[i], list[j]))]); if (list.length === 3) { const L3 = lcm(lcm(list[0], list[1]), list[2]); pairs.push([`üçü ortak (${ek(L3, "in")} katları)`, "+" + Math.floor(n / L3)]); } return solTable(["Grup", "Adet"], [...rows, ...pairs], ["Toplam", c]); })() },
      `İki listede birden olan sayılar ilk toplamada iki kez sayıldı; bir kez çıkarılır.${l === 8 ? " Üç listede birden olanlar üç kez eklenip üç kez çıkarıldı; bir kez geri eklenir." : ""}`,
      `Sonuç ${c}.`) });
  });
  add("carpan", 8, 8, () => {
    const n = ri(20, 200);
    let z = 0, p = 5; const parts = []; while (p <= n) { z += Math.floor(n / p); parts.push(`${Math.floor(n / p)}`); p *= 5; }
    return N(`1 × 2 × 3 × … × ${n} çarpımının sonunda kaç tane sıfır vardır?`, z, `Her sondaki sıfır bir 2 × 5 çiftinden gelir; 5 çarpanları daha azdır. 5'in katları ${Math.floor(n / 5)}${n >= 25 ? `, 25'in katları ${Math.floor(n / 25)} ek` : ""}${n >= 125 ? `, 125'in katları ${Math.floor(n / 125)} ek` : ""}: ${parts.join(" + ")} = ${z}.`, cards([{ t: "1 × 2 × … × " + n }, { t: "…000", s: "kaç sıfır?", q: true }]), { hint: "Çarpımda kaç tane 5 çarpanı var?", sol: SOL("Sondaki her sıfır bir 10 çarpanıdır ve 10 = 2 × 5. Çarpımda 2'ler bol, 5'ler azdır; sıfır sayısını 5 çarpanları belirler.",
      `5'in her katı en az bir 5 verir: 5, 10, 15, …, ${5 * Math.floor(n / 5)} → ${Math.floor(n / 5)} tane.`,
      n >= 25 ? `25 = 5 × 5 gibi sayılar ikinci bir 5 verir: 25'in katları ${Math.floor(n / 25)} tane ek 5.` : null,
      n >= 125 ? `125 = 5 × 5 × 5 üçüncü bir 5 verir: ${Math.floor(n / 125)} ek.` : null,
      { t: `Toplam 5 çarpanı: ${parts.join(" + ")} = ${z}. Sonda ${z} sıfır var.`, fig: solTable(["Sayılar", "Verdiği 5"], [["5'in katları", Math.floor(n / 5)], ...(n >= 25 ? [["25'in katları (ek)", Math.floor(n / 25)]] : []), ...(n >= 125 ? [["125'in katları (ek)", Math.floor(n / 125)]] : [])], ["Toplam", z]) }) });
  });

  // 17. Problemler
  add("problem", 6, 7, (l) => {
    if (l === 6) {
      const c = ri(4, 15), m = ri(2, 4), k = ri(m + 1, 7), t = c * (k - m) / (m - 1);
      if (!Number.isInteger(t) || t < 1 || t > 40) return null;
      return N(`Babanın yaşı çocuğunun yaşının ${k} katı. ${t} yıl sonra babanın yaşı çocuğunun yaşının ${m} katı olacak. Çocuk şimdi kaç yaşında?`, c, `Çocuk x: ${k}x + ${t} = ${m}(x + ${t}) → ${k - m}x = ${(m - 1) * t} → x = ${c}.`, boxes([{ icon: "👨", label: `${k} kat` }, { icon: "🧒", label: "x yaş" }, { icon: "⏳", label: `${t} yıl sonra ${m} kat` }]), { sol: SOL("Çocuğun şimdiki yaşına x diyelim. Yıllar geçince ikisi de aynı sayıda yaş alır.",
        `Şimdi: çocuk x, baba ${k}x.`,
        `${t} yıl sonra: çocuk x + ${t}, baba ${k}x + ${t}. O zaman baba çocuğun ${m} katı: ${k}x + ${t} = ${m} × (x + ${t}) = ${m}x + ${m * t}.`,
        `${k}x − ${m}x = ${m * t} − ${t} → ${k - m}x = ${(m - 1) * t} → x = ${c}.`,
        `Kontrol: şimdi ${c} ve ${k * c}; ${t} yıl sonra ${c + t} ve ${k * c + t} = ${m} × ${c + t}. ✔`) });
    }
    const d = ri(8, 25), t = ri(2, d - 2), k = ri(3, 6), m = k * (d - t) + t;
    return N(`Anne ile kızının yaşları toplamı ${m + d}. ${t} yıl önce annenin yaşı kızının yaşının ${k} katıydı. Kız şimdi kaç yaşında?`, d, `Kız x: anne ${m + d} − x. ${t} yıl önce: ${m + d} − x − ${t} = ${k}(x − ${t}) → ${m + d - t + k * t} = ${k + 1}x → x = ${d}.`, boxes([{ icon: "👩", label: "anne" }, { icon: "👧", label: "kız" }, { icon: "➕", label: `toplam ${m + d}` }, { icon: "⏪", label: `${t} yıl önce ${k} kat` }]), { hint: "İki kişi de aynı sayıda yıl yaşlanır.", sol: SOL("Kızın şimdiki yaşına x diyelim; annenin yaşı toplamdan bulunur.",
        `Şimdi: kız x, anne ${m + d} − x.`,
        `${t} yıl önce: kız x − ${t}, anne ${m + d} − x − ${t}. O zaman anne kızın ${k} katı: ${m + d - t} − x = ${k}(x − ${t}).`,
        `${m + d - t} − x = ${k}x − ${k * t} → ${m + d - t} + ${k * t} = ${k + 1}x → ${m + d - t + k * t} = ${k + 1}x → x = ${d}.`,
        `Kontrol: kız ${d}, anne ${m}; ${t} yıl önce ${d - t} ve ${m - t} = ${k} × ${d - t}. ✔`) });
  });
  add("problem", 6, 8, (l) => {
    if (l === 6) {
      const c = ri(5, 40), r = ri(5, 40);
      return N(`Bir çiftlikte tavuklar ve tavşanlar var. Toplam ${c + r} baş ve ${2 * c + 4 * r} ayak sayılıyor. Kaç tavşan vardır?`, r, `Hepsi tavuk olsaydı ${2 * (c + r)} ayak olurdu. Fazla ${2 * r * 2 - 2 * r} ayak, her tavşanın fazladan 2 ayağından gelir: ${2 * r} ÷ 2 = ${r}.`, boxes([{ icon: "🐔", label: "2 ayak" }, { icon: "🐇", label: "4 ayak" }, { icon: "🔢", label: `${c + r} baş · ${2 * c + 4 * r} ayak` }]), { hint: "Önce hepsinin tavuk olduğunu varsay.", sol: SOL("Varsayım yöntemi: önce bütün hayvanların tavuk olduğunu düşünelim, sonra eksik ayakları tavşanlarla tamamlayalım.",
        `${c + r} hayvanın hepsi tavuk olsaydı ${c + r} × 2 = ${2 * (c + r)} ayak olurdu.`,
        `Gerçekte ${2 * c + 4 * r} ayak var: ${2 * c + 4 * r} − ${2 * (c + r)} = ${2 * r} ayak eksik kaldı.`,
        `Bir tavuğu tavşana çevirmek 2 ayak ekler. ${2 * r} ÷ 2 = ${r} tavşan. (Tavuk ${c}.)`) });
    }
    if (l === 7) {
      const pairs = []; for (let a = 2; a <= 40; a++) for (let b = a + 1; b <= 60; b++) if ((a * b) % (a + b) === 0) pairs.push([a, b]);
      const [a, b] = pick(pairs), t = a * b / (a + b);
      return N(`Bir havuzu A musluğu tek başına ${a} saatte, B musluğu tek başına ${b} saatte dolduruyor. İkisi birlikte açılırsa havuz kaç saatte dolar?`, t, `Havuz ${a * b} birim olsun: A saatte ${b}, B saatte ${a} birim doldurur; birlikte ${a + b}. ${a * b} ÷ ${a + b} = ${t}.`, boxes([{ icon: "🚰", label: `A: ${a} saat` }, { icon: "🚰", label: `B: ${b} saat` }, { icon: "🏊", label: "birlikte?" }]), { unit: "saat", hint: "Havuzu, iki sürenin ortak katı kadar birim düşün.", sol: SOL("Kesirle uğraşmamak için havuzu küçük eş parçalara (birimlere) bölelim; parça sayısı iki sürenin de katı olsun.",
        `Havuz ${a * b} birim olsun (${a} ve ${b} saatin ortak katı).`,
        { t: `A ${a} saatte doldurur: saatte ${a * b} ÷ ${a} = ${b} birim. B saatte ${a * b} ÷ ${b} = ${a} birim.`, fig: solTable(["Musluk", "Tek başına", "Saatte"], [["A", `${a} saat`, `${b} birim`], ["B", `${b} saat`, `${a} birim`]], ["Birlikte", "", `${a + b} birim`]) },
        `Birlikte saatte ${a + b} birim: ${a * b} ÷ ${a + b} = ${t} saat.`) });
    }
    const a = ri(3, 5), b = ri(1, 2), n = ri(20, 40), k = ri(0, 8), c = ri(Math.ceil((n - k) / 3), n - k), P0 = a * c - b * (n - k - c);
    if (P0 < 0) return null;
    return N(`Bir sınavda doğru cevap ${a} puan kazandırıyor, yanlış cevap ${b} puan götürüyor, boş 0 puan. ${n} sorunun ${k} tanesini boş bırakan öğrenci ${P0} puan aldı. Kaç doğrusu var?`, c, `Cevaplanan ${n - k} soru. Doğru x ise yanlış ${n - k} − x: ${a}x − ${b}(${n - k} − x) = ${P0} → ${a + b}x = ${P0 + b * (n - k)} → x = ${c}.`, boxes([{ icon: "✅", label: `+${a}` }, { icon: "❌", label: `−${b}` }, { icon: "⬜", label: `${k} boş` }, { icon: "🏁", label: `${P0} puan` }]), { hint: "Bir yanlışı doğruya çevirmek puanı kaç artırır?", sol: SOL("Varsayım yöntemi: cevaplanan bütün soruların yanlış olduğunu düşünüp her doğrunun puanı ne kadar artırdığına bakalım.",
      `Cevaplanan soru: ${n} − ${k} = ${n - k}. Hepsi yanlış olsaydı puan ${n - k} × (−${b}) = −${b * (n - k)} olurdu.`,
      `Bir yanlışı doğruya çevirmek puanı ${b} + ${a} = ${a + b} artırır (−${b} gider, +${a} gelir).`,
      `Gerçek puan ${P0}: artış ${P0} − (−${b * (n - k)}) = ${P0 + b * (n - k)}. Doğru sayısı ${P0 + b * (n - k)} ÷ ${a + b} = ${c}.`,
      `Kontrol: ${c} × ${a} − ${n - k - c} × ${b} = ${a * c} − ${b * (n - k - c)} = ${P0}. ✔`) });
  });
  add("problem", 7, 8, (l) => {
    if (l === 7) {
      const v1 = ri(4, 12) * 5, v2 = ri(4, 12) * 5, t = ri(2, 6), meet = rnd() < .5;
      if (!meet && v1 === v2) return null;
      return meet ? N(`Aralarında ${(v1 + v2) * t} km olan iki araç aynı anda birbirine doğru yola çıkıyor. Hızları saatte ${v1} km ve ${v2} km. Kaç saat sonra karşılaşırlar?`, t, `Her saat aradaki uzaklık ${v1 + v2} km kapanır: ${(v1 + v2) * t} ÷ ${v1 + v2} = ${t}.`, boxes([{ icon: "🚗", label: `${v1} km/sa` }, { icon: "↔️", label: `${(v1 + v2) * t} km` }, { icon: "🚙", label: `${v2} km/sa` }]), { unit: "saat", sol: SOL("Araçlar birbirine doğru gidiyorsa aradaki uzaklık her saat iki hızın toplamı kadar azalır.",
        `Bir saatte biri ${v1} km, öbürü ${v2} km yaklaşır: toplam ${v1 + v2} km.`,
        { t: `${(v1 + v2) * t} km'lik ara saatte ${v1 + v2} km kapanır.`, fig: solTable(["Saat", "Kapanan", "Kalan ara"], Array.from({ length: t + 1 }, (_, i) => [i, (v1 + v2) * i, (v1 + v2) * (t - i)])) },
        `${(v1 + v2) * t} ÷ ${v1 + v2} = ${t} saat.`) })
        : N(`Hızı saatte ${Math.max(v1, v2)} km olan araç, ${Math.abs(v1 - v2) * t} km öndeki ve saatte ${Math.min(v1, v2)} km giden aracı aynı yönde kovalıyor. Kaç saat sonra yakalar?`, t, `Her saat ara ${Math.abs(v1 - v2)} km kapanır: ${Math.abs(v1 - v2) * t} ÷ ${Math.abs(v1 - v2)} = ${t}.`, boxes([{ icon: "🚓", label: `${Math.max(v1, v2)} km/sa` }, { icon: "➡️", label: `${Math.abs(v1 - v2) * t} km ara` }, { icon: "🚗", label: `${Math.min(v1, v2)} km/sa` }]), { unit: "saat", sol: SOL("Aynı yönde giderken arkadaki araç her saat iki hızın farkı kadar yaklaşır.",
        `Bir saatte arkadaki ${Math.max(v1, v2)} km, öndeki ${Math.min(v1, v2)} km gider: ara ${Math.abs(v1 - v2)} km kapanır.`,
        `${Math.abs(v1 - v2) * t} km'lik ara: ${Math.abs(v1 - v2) * t} ÷ ${Math.abs(v1 - v2)} = ${t} saat.`) });
    }
    const v = ri(8, 30), t1 = ri(4, 15), t2 = t1 + ri(5, 40), L = v * t1, B = v * (t2 - t1);
    return N(`Bir tren, yol kenarındaki bir direğin önünden ${t1} saniyede geçiyor. Aynı hızla ${B} m uzunluğundaki tünelden tamamen ${t2} saniyede geçiyor (girişten son vagonun çıkışına kadar). Tren kaç metredir?`, L, `Direkte tren kendi boyu kadar, tünelde boyu + ${B} m kadar yol alır. Fark ${B} m, ${t2 - t1} saniyede alınır: hız ${v} m/sn. Tren ${v} × ${t1} = ${L} m.`, boxes([{ icon: "🚆", label: `direk: ${t1} sn` }, { icon: "🚇", label: `${B} m tünel: ${t2} sn` }, { icon: "📏", label: "tren boyu?" }]), { unit: "m", hint: "İki durumda trenin aldığı yolların farkı nedir?", sol: SOL("Trenin bir yeri tamamen geçmesi için önce burnu girer, en son kuyruğu çıkar. Bu yüzden tren, geçtiği yerin uzunluğu artı kendi boyu kadar yol alır.",
      `Direk: uzunluğu yok; tren kendi boyu (L) kadar yol alır, ${t1} saniyede.`,
      `Tünel: tren ${B} + L metre yol alır, ${t2} saniyede.`,
      `İkisinin farkı: fazladan ${B} m, fazladan ${t2} − ${t1} = ${t2 - t1} saniyede alınır. Hız ${B} ÷ ${t2 - t1} = ${v} m/sn.`,
      `Tren boyu = hız × direk süresi = ${v} × ${t1} = ${L} m.`) });
  });
  add("problem", 8, 8, () => {
    const cols = [["🔴", "kırmızı"], ["🔵", "mavi"], ["🟢", "yeşil"], ["🟡", "sarı"]].slice(0, ri(3, 4)), counts = cols.map(() => ri(3, 15));
    if (rnd() < .5) {
      const k = ri(3, Math.max(...counts)), ans = sum(counts.map((c) => Math.min(c, k - 1))) + 1;
      return N(`Torbada ${cols.map((c, i) => `${counts[i]} ${c[1]}`).join(", ")} top var. Gözler kapalı çekilen toplardan en az ${k} tanesinin aynı renkte olmasını garantilemek için en az kaç top çekilmelidir?`, ans,
        `En kötü durumda her renkten en çok ${k - 1} top gelir (o renkte daha azı varsa hepsi): ${counts.map((c) => Math.min(c, k - 1)).join(" + ")} = ${ans - 1}. Bir top daha çekilince ${k} aynı renk garanti: ${ans}.`, boxes(cols.map((c, i) => ({ icon: c[0], label: `${counts[i]} ${c[1]}` }))), { hint: "En şanssız durumu düşün: aynı renkten olabildiğince az top gelsin.", sol: SOL(`Garanti sorusunda en şanssız durumu düşünürüz (güvercin yuvası ilkesi): toplar bizi olabildiğince geç ${k} aynı renge ulaştıracak şekilde gelsin.`,
        { t: `En şanssız durumda her renkten ${k - 1} top gelir; bir renkte ${k - 1}'den az top varsa hepsi gelir.`, fig: ballsFig(cols.map((c2, i) => ({ label: c2[1], color: [CORAL, BLUE, TEAL, GOLD][i], count: counts[i], take: Math.min(counts[i], k - 1) })), `${ans - 1} top çekildi, hâlâ ${k} aynı renk yok`) },
        `Şanssız durumda çekilen: ${counts.map((c2) => Math.min(c2, k - 1)).join(" + ")} = ${ans - 1} top.`,
        `Bir top daha çekilince, ${k - 1} topu olan renklerden biri ${k} olur. En az ${ans} top gerekir.`) });
    }
    const tot = sum(counts), ans = tot - Math.min(...counts) + 1;
    return N(`Torbada ${cols.map((c, i) => `${counts[i]} ${c[1]}`).join(", ")} top var. Gözler kapalı çekilen toplar arasında her renkten en az bir top olmasını garantilemek için en az kaç top çekilmelidir?`, ans,
      `En kötü durumda en az olan renk (${Math.min(...counts)} top) dışındaki bütün toplar önce gelir: ${tot} − ${Math.min(...counts)} = ${tot - Math.min(...counts)}. Bir top daha: ${ans}.`, boxes(cols.map((c, i) => ({ icon: c[0], label: `${counts[i]} ${c[1]}` }))), { hint: "En kötü durumda hangi renk en sona kalır?", sol: SOL("Garanti için en şanssız durumu düşünelim: bir renk olabildiğince geç gelsin.",
      `En geç gelebilecek renk, en az topu olan renktir (${Math.min(...counts)} top). Diğer renklerin bütün topları önce gelebilir.`,
      { t: `Şanssız durumda önce ${tot - Math.min(...counts)} top çekilir ve hepsi diğer renklerdendir.`, fig: ballsFig(cols.map((c2, i) => ({ label: c2[1], color: [CORAL, BLUE, TEAL, GOLD][i], count: counts[i], take: counts[i] === Math.min(...counts) && i === counts.indexOf(Math.min(...counts)) ? 0 : counts[i] })), "eksik renk hâlâ gelmedi") },
      `Bir top daha çekilince kalan renk de gelir: ${tot - Math.min(...counts)} + 1 = ${ans}.`) });
  });

  // 18. Çevre
  add("cevre", 6, 7, (l) => {
    if (l === 6) {
      const n = ri(3, 8), s = ri(2, 9), u = Math.min(220 / n, 26);
      let f = "";
      for (let c = 0; c < n; c++) for (let r = 0; r <= c; r++) f += `<rect class="ar-pop" style="animation-delay:${(c + r) * 40}ms" x="${r1(180 - n * u / 2 + c * u)}" y="${r1(200 - (r + 1) * u)}" width="${r1(u)}" height="${r1(u)}" fill="#dff1ff" stroke="${BLUE}" stroke-width="2.5"/>`;
      return N(`Kenarı ${s} cm olan karelerle ${n} basamaklı bir merdiven yapıldı (sütunlarda 1, 2, …, ${n} kare). Şeklin çevresi kaç cm?`, 4 * n * s, `Basamakların yatay kenarları kaydırılınca tabanla, düşey kenarları en yüksek sütunla birleşir: çevre, kenarı ${n * s} cm olan karenin çevresi kadar: 4 × ${n * s} = ${4 * n * s}.`, svg(f, "0 0 360 220"), { unit: "cm", hint: "Basamakları bir kareye tamamladığını düşün.", sol: SOL("Merdivenin basamaklı kenarlarını kaydırarak düz kenarlara dönüştürebiliriz; uzunluk değişmez.",
        { t: `Basamakların yatay parçalarını yukarı kaydır: hepsi birleşip üst kenarı oluşturur. Düşey parçaları sola kaydır: hepsi birleşip sol kenarı oluşturur.`, fig: svg(f + `<rect x="${r1(180 - n * u / 2)}" y="${r1(200 - n * u)}" width="${r1(n * u)}" height="${r1(n * u)}" fill="none" stroke="${CORAL}" stroke-width="3" stroke-dasharray="8 6"/>`, "0 0 360 220") },
        `Böylece çevre, kenarı ${n} × ${s} = ${n * s} cm olan karenin (kırmızı kesik) çevresine eşit olur.`,
        `Çevre 4 × ${n * s} = ${4 * n * s} cm.`) });
    }
    const n = ri(2, 6), t = ri(2, 9), s = n * t, p = 2 * (s + t);
    let f = ""; const u = 160 / s;
    for (let i = 0; i < n; i++) f += `<rect class="ar-pop" style="animation-delay:${i * 70}ms" x="${r1(100 + i * t * u)}" y="40" width="${r1(t * u)}" height="160" fill="${i % 2 ? "#dff1ff" : "#fff4dc"}" stroke="${BLUE}" stroke-width="3"/>`;
    return N(`Bir kare, ${n} eş dikdörtgen şeride bölündü. Bir şeridin çevresi ${p} cm. Karenin çevresi kaç cm?`, 4 * s, `Şeridin uzun kenarı karenin kenarı (s), kısa kenarı s ÷ ${n}. Çevre 2(s + s/${n}) = ${p} → s × ${2 * (n + 1)}/${n} = ${p} → s = ${s}. Karenin çevresi ${4 * s}.`, svg(f, "0 0 360 240"), { unit: "cm", hint: "Şeridin kenarlarını karenin kenarı cinsinden yaz.", sol: SOL(`Şeridin uzun kenarı karenin bir kenarıdır; kısa kenarı karenin kenarının ${ek(n, "de")} biridir. Karenin kenarını eş küçük parçalara bölelim.`,
      { t: `Karenin kenarı ${n} eş parça olsun. Şeridin kısa kenarı 1 parça, uzun kenarı ${n} parça.`, fig: svg(f, "0 0 360 240") },
      `Şeridin çevresi 2 × (${n} + 1) = ${2 * (n + 1)} parça = ${p} cm → bir parça ${p} ÷ ${2 * (n + 1)} = ${t} cm.`,
      `Karenin kenarı ${n} × ${t} = ${s} cm; çevresi 4 × ${s} = ${4 * s} cm.`) });
  });
  add("cevre", 6, 8, (l) => {
    if (l === 8) {
      const n = ri(5, 60), min = 2 * Math.ceil(2 * Math.sqrt(n)), big = rnd() < .3;
      return N(`Kenarı 1 cm olan ${n} eş kare, kenar kenara (tam kenarları çakışacak şekilde) birleştirilerek tek parça bir şekil yapılıyor. Şeklin çevresi en ${big ? "çok" : "az"} kaç cm olabilir?`, big ? 2 * n + 2 : min,
        big ? `Her yeni kare en az bir kenarla bağlanır ve en çok 2 cm ekler; zincir gibi dizilince çevre 4 + 2 × ${n - 1} = ${2 * n + 2}.` : `Çevre, şekli saran dikdörtgenin çevresinden küçük olamaz. ${n} kareyi sığdıran en küçük çevreli dikdörtgen kareye en yakın olandır; çevresi ${min}. Kareleri satır satır yerleştirerek bu değer elde edilir.`,
        gridBoard(Math.ceil(Math.sqrt(n)), Math.ceil(n / Math.ceil(Math.sqrt(n))), { fill: "#fff4dc" }), { unit: "cm", hint: big ? "Her kare en az bir kenarını paylaşmak zorunda." : "Şekli bir kareye olabildiğince yakın tut.", sol: big ? SOL("Çevre, kareler birbirine az değdikçe büyür. Her kare en az bir komşusuna değmek zorunda (tek parça).",
          `Tek kare 4 cm çevre. Yeni bir kare bir kenarla eklenince 4 kenar gelir, ortak kenar 2 kez kaybolur: çevre en çok 2 cm artar.`,
          { t: `En çok çevre için kareleri zincir gibi tek sıra diz: her kare tam 2 cm ekler.`, fig: gridBoard(Math.min(n, 12), 1, { fill: "#fff4dc" }) },
          `4 + 2 × ${n - 1} = ${2 * n + 2} cm.`)
        : SOL("Kareler birbirine çok değdikçe ortak kenarlar artar, çevre küçülür. En sıkı biçim kareye en yakın olandır.",
          `Şeklin çevresi, onu saran dikdörtgenin çevresinden küçük olamaz (basamaklı kenarlar kaydırılınca saran dikdörtgen çıkar).`,
          { t: `${n} kareyi sığdıran ve çevresi en küçük olan dikdörtgen: ${Math.ceil(Math.sqrt(n))} × ${Math.ceil(n / Math.ceil(Math.sqrt(n)))} gibi kareye yakın bir dikdörtgen. Kareler satır satır yerleştirilir.`, fig: gridBoard(Math.ceil(Math.sqrt(n)), Math.ceil(n / Math.ceil(Math.sqrt(n))), { fill: "#fff4dc", cells: Array.from({ length: n }, (_, i) => [i % Math.ceil(Math.sqrt(n)), Math.floor(i / Math.ceil(Math.sqrt(n)))]) }) },
          `Kenarlar toplamı yaklaşık 2 × √${n} olmalı; en yakın tam sayılarla çevre ${min} cm olur ve daha azı mümkün değildir.`) });
    }
    const s = ri(12, 30), a = ri(2, s - 4), b = ri(2, Math.floor(s / 2) - 1), b2 = ri(2, s - b - 2), two = l === 7;
    const u = 160 / s, X = 100, Y = 40;
    let pts = [[0, 0], [(s - a) / 2, 0], [(s - a) / 2, b], [(s + a) / 2, b], [(s + a) / 2, 0], [s, 0], [s, s]];
    if (two) pts = pts.concat([[(s + a) / 2, s], [(s + a) / 2, s - b2], [(s - a) / 2, s - b2], [(s - a) / 2, s]]);
    pts.push([0, s]);
    const f = `<polygon class="ar-pop" points="${pts.map(([x, y]) => `${r1(X + x * u)},${r1(Y + y * u)}`).join(" ")}" fill="#fff4dc" stroke="${GOLD}" stroke-width="4"/>` + text(180, Y - 12, s + " cm", { size: 15 }) + text(180, Y + b * u + 16, `${a}×${b}`, { size: 13, fill: CORAL }) + (two ? text(180, Y + (s - b2) * u - 8, `${a}×${b2}`, { size: 13, fill: CORAL }) : "");
    const ans = 4 * s + 2 * b + (two ? 2 * b2 : 0);
    return N(`Kenarı ${s} cm olan kareden ${two ? `üst kenarın ortasından ${a} cm eninde ${b} cm derinliğinde, alt kenarın ortasından ${a} cm eninde ${b2} cm derinliğinde iki dikdörtgen parça` : `bir kenarın ortasından ${a} cm eninde ${b} cm derinliğinde dikdörtgen bir parça`} kesildi. Kalan şeklin çevresi kaç cm?`, ans,
      `Kesilen yerin tabanı, çıkan kenar parçasının yerini tutar; fazladan iki derinlik kenarı eklenir. ${4 * s} + 2 × ${b}${two ? ` + 2 × ${b2}` : ""} = ${ans}.`, svg(f, "0 0 360 240"), { unit: "cm", hint: "Kesik içindeki kenarları tek tek takip et.", sol: SOL("Kesik açılınca karenin kenarından bir parça gider ama yerine kesiğin içindeki kenarlar gelir. Bunları karşılaştıralım.",
      `Karenin çevresi 4 × ${s} = ${4 * s} cm.`,
      { t: `Kesiğin tabanı (${a} cm), kenardan çıkarılan ${a} cm'nin yerini tam tutar. Fazladan iki yan kenar eklenir: 2 × ${b} = ${2 * b} cm.`, fig: svg(f, "0 0 360 240") },
      two ? `İkinci kesik de 2 × ${b2} = ${2 * b2} cm ekler.` : null,
      `Çevre ${4 * s} + ${2 * b}${two ? ` + ${2 * b2}` : ""} = ${ans} cm. (Kesik çevreyi küçültmez, büyütür!)`) });
  });
  add("cevre", 7, 8, (l) => {
    const W = ri(10, 40), H = ri(8, 30), m = ri(1, 5), n = ri(1, 4), total = 2 * (W + H) + m * H + n * W;
    const u = Math.min(260 / W, 170 / H), X = 180 - W * u / 2, Y = 115 - H * u / 2;
    let f = `<rect class="ar-pop" x="${r1(X)}" y="${r1(Y)}" width="${r1(W * u)}" height="${r1(H * u)}" fill="#e3f6d9" stroke="#5b7d2a" stroke-width="4"/>`;
    for (let i = 1; i <= m; i++) f += line(X + i * W * u / (m + 1), Y, X + i * W * u / (m + 1), Y + H * u, { color: "#8a6d1e", w: 3, dash: "8 5" });
    for (let j = 1; j <= n; j++) f += line(X, Y + j * H * u / (n + 1), X + W * u, Y + j * H * u / (n + 1), { color: "#8a6d1e", w: 3, dash: "8 5" });
    f += text(180, Y - 12, W + " m", { size: 15 }) + text(X + W * u + 10, 115, H + " m", { size: 15, anchor: "start" });
    if (l === 7) return N(`${W} m'ye ${H} m bahçenin çevresine çit çekiliyor. Ayrıca bahçe, kenarlara paralel ${m} düşey ve ${n} yatay çitle bölümlere ayrılıyor. Toplam kaç m çit gerekir?`, total, `Dış çit ${2 * (W + H)}. Düşey çitler ${m} × ${H} = ${m * H}, yatay çitler ${n} × ${W} = ${n * W}. Toplam ${total}.`, svg(f), { unit: "m", sol: SOL("Çitleri üç gruba ayıralım: dış çevre, düşey iç çitler, yatay iç çitler.",
      `Dış çevre: 2 × (${W} + ${H}) = ${2 * (W + H)} m.`,
      { t: `Her düşey iç çit bahçenin yüksekliği kadar (${H} m): ${m} × ${H} = ${m * H} m. Her yatay iç çit bahçenin genişliği kadar (${W} m): ${n} × ${W} = ${n * W} m.`, fig: svg(f) },
      `Toplam ${2 * (W + H)} + ${m * H} + ${n * W} = ${total} m.`) });
    return N(`${W} m'ye ${H} m bahçenin çevresine ve içine, kenarlara paralel ${n} yatay ve bir miktar düşey çit çekiliyor. Toplam ${total} m çit kullanıldı. Kaç düşey iç çit var?`, m, `Dış çit ${2 * (W + H)}, yatay çitler ${n * W}. Düşey çitlere ${total} − ${2 * (W + H)} − ${n * W} = ${m * H} m kalır; her biri ${H} m: ${m}.`, svg(f), { hint: "Önce bilinen çitleri toplamdan çıkar.", sol: SOL("Toplam çitten bildiğimiz parçaları çıkaralım; kalan, düşey çitlerin toplam uzunluğudur.",
      `Dış çevre: 2 × (${W} + ${H}) = ${2 * (W + H)} m. Yatay iç çitler: ${n} × ${W} = ${n * W} m.`,
      `Düşey çitlere kalan: ${total} − ${2 * (W + H)} − ${n * W} = ${m * H} m.`,
      `Her düşey çit ${H} m: ${m * H} ÷ ${H} = ${m} düşey çit.`) });
  });
  add("cevre", 8, 8, () => {
    const w1 = ri(2, 12), w2 = ri(2, 12), h1 = ri(2, 10), h2 = ri(2, 10), P = (w, h) => 2 * (w + h), miss = ri(0, 3);
    const vals = [P(w1, h1), P(w2, h1), P(w1, h2), P(w2, h2)], ans = vals[miss];
    const labels = vals.map((v, i) => i === miss ? "?" : `Ç = ${v}`);
    const rule = miss === 0 || miss === 3 ? `Sol üst + sağ alt = sağ üst + sol alt` : `Sağ üst + sol alt = sol üst + sağ alt`;
    return N(`Bir dikdörtgen, kenarlarına paralel iki doğruyla dört dikdörtgene bölündü. Üçünün çevresi şekilde (cm). Dördüncü dikdörtgenin çevresi kaç cm?`, ans,
      `Çapraz karşılıklı iki dikdörtgenin çevreleri toplamı, büyük dikdörtgenin çevresine eşittir; iki çapraz çiftin toplamı aynı. ${rule}: ${ans}.`, split4(w1, w2, h1, h2, labels), { unit: "cm", hint: "Çapraz karşılıklı iki dikdörtgen, büyük dikdörtgenin bütün kenar parçalarını birer kez içerir.", sol: SOL("Büyük dikdörtgenin genişliği iki parçadan (w₁, w₂), yüksekliği iki parçadan (h₁, h₂) oluşur. Her küçük dikdörtgen bir genişlik parçası ve bir yükseklik parçası kullanır.",
      `Sol üst: 2(w₁ + h₁), sağ üst: 2(w₂ + h₁), sol alt: 2(w₁ + h₂), sağ alt: 2(w₂ + h₂).`,
      { t: `Çapraz karşılıklı ikisini topla: sol üst + sağ alt = 2(w₁ + w₂ + h₁ + h₂). Öbür çapraz çift de aynı: sağ üst + sol alt = 2(w₁ + w₂ + h₁ + h₂).`, fig: split4(w1, w2, h1, h2, vals.map((v, i) => i === miss ? "?" : (i === 0 || i === 3 ? "◆ " : "● ") + v)) },
      `Yani ${rule}. Bilinen üç sayı yerine konur: eksik çevre ${ans} cm.`) });
  });

  // 19. Alan
  add("alan", 6, 7, (l) => {
    const k = l === 6 ? 1 : ri(2, 4), t = ri(1, l === 6 ? 15 : 6), s = 2 ** Math.ceil(k / 2) * t * (l === 6 ? 2 : 1), ans = s * s / 2 ** k;
    let f = "", pts = [[100, 40], [260, 40], [260, 200], [100, 200]];
    for (let i = 0; i <= k; i++) { f += `<polygon class="ar-pop" style="animation-delay:${i * 120}ms" points="${pts.map((p) => p.map(r1).join(",")).join(" ")}" fill="${i === k ? "#ffe7a3" : "none"}" stroke="${[BLUE, TEAL, GRAPE, CORAL, GOLD][i]}" stroke-width="3"/>`; pts = pts.map((p, j) => [(p[0] + pts[(j + 1) % 4][0]) / 2, (p[1] + pts[(j + 1) % 4][1]) / 2]); }
    return N(`Kenarı ${s} cm olan karenin kenarlarının orta noktaları birleştirilerek yeni bir kare çiziliyor.${k > 1 ? ` Bu işlem her yeni kare için tekrarlanarak toplam ${k} kez yapılıyor.` : ""} En içteki (sarı) karenin alanı kaç cm²?`, ans,
      `Orta noktaları birleştirince köşelerdeki 4 üçgen, içteki karenin içine katlanabilir; yeni kare eskisinin yarısıdır. ${s * s}${Array.from({ length: k }, () => " ÷ 2").join("")} = ${ans}.`, svg(f), { unit: "cm²", hint: "Köşelerdeki üçgenleri içe doğru katladığını düşün.", sol: SOL("Kenarların orta noktaları birleşince köşelerde 4 üçgen kalır. Bu üçgenler içe katlanınca içteki kareyi tam örter.",
      { t: `Dış kare, içteki kareyle onun üstüne katlanan 4 üçgenden oluşur: içteki kare dış karenin tam yarısıdır.`, fig: svg(`<rect x="100" y="40" width="160" height="160" fill="#eef6ff" stroke="${BLUE}" stroke-width="3"/><polygon points="180,40 260,120 180,200 100,120" fill="#ffe7a3" stroke="${GOLD}" stroke-width="3"/>` + line(100, 40, 260, 200, { color: "#9fb7d8", w: 1.5, dash: "5 4" }) + line(260, 40, 100, 200, { color: "#9fb7d8", w: 1.5, dash: "5 4" })) },
      `Dış karenin alanı ${s} × ${s} = ${s * s} cm².`,
      k > 1 ? `Her adımda alan yarıya iner: ${s * s}${Array.from({ length: k }, (_, i) => ` → ${s * s / 2 ** (i + 1)}`).join("")}.` : `İçteki kare: ${s * s} ÷ 2 = ${ans} cm².`,
      `En içteki karenin alanı ${ans} cm².`) });
  });
  add("alan", 6, 8, (l) => {
    if (l === 6) {
      const a = ri(4, 15), b = ri(3, 12), c = ri(4, 15), d = ri(3, 12), e = ri(1, Math.min(a, c) - 1), f = ri(1, Math.min(b, d) - 1), ans = a * b + c * d - e * f;
      const u = Math.min(200 / (a + c - e), 170 / (b + d - f)), X = 180 - (a + c - e) * u / 2, Y = 120 - (b + d - f) * u / 2;
      const s = `<rect class="ar-pop" x="${r1(X)}" y="${r1(Y)}" width="${r1(a * u)}" height="${r1(b * u)}" fill="#2c6bed33" stroke="${BLUE}" stroke-width="3"/><rect class="ar-pop" x="${r1(X + (a - e) * u)}" y="${r1(Y + (b - f) * u)}" width="${r1(c * u)}" height="${r1(d * u)}" fill="#e25b4533" stroke="${CORAL}" stroke-width="3"/>`;
      return N(`${a} × ${b} cm ve ${c} × ${d} cm iki dikdörtgen kâğıt üst üste kondu; ortak kısım ${e} × ${f} cm dikdörtgen. Kâğıtların kapladığı toplam alan kaç cm²?`, ans, `${a * b} + ${c * d} − ${e * f} (ortak kısım iki kez sayılmasın) = ${ans}.`, svg(s), { unit: "cm²", sol: SOL("İki kâğıdın alanlarını toplarsak üst üste binen kısmı iki kez saymış oluruz. Onu bir kez çıkaralım.",
        `Mavi kâğıt ${a} × ${b} = ${a * b} cm², kırmızı kâğıt ${c} × ${d} = ${c * d} cm².`,
        { t: `Ortak kısım (mor) ${e} × ${f} = ${e * f} cm² iki kez sayıldı.`, fig: svg(s) },
        `Kaplanan alan ${a * b} + ${c * d} − ${e * f} = ${ans} cm².`) });
    }
    if (l === 7) {
      const s = ri(12, 40), a = ri(1, 4), b = ri(1, 4), ans = (s - a) * (s - b);
      const u = 160 / s, X = 100, Y = 40;
      const f = `<rect class="ar-pop" x="${X}" y="${Y}" width="160" height="160" fill="#cfeec6" stroke="#5b7d2a" stroke-width="4"/><rect x="${r1(X + 160 * .45)}" y="${Y}" width="${r1(a * u)}" height="160" fill="#d9c7a8"/><rect x="${X}" y="${r1(Y + 160 * .55)}" width="160" height="${r1(b * u)}" fill="#d9c7a8"/>` + text(180, Y - 12, s + " m", { size: 15 });
      return N(`Kenarı ${s} m olan kare bahçeden, kenarlara paralel ve birbirine dik iki yol geçiyor; yolların genişlikleri ${a} m ve ${b} m. Yollar dışında kalan çimenli alan kaç m²?`, ans, `Yolları kenarlara kaydırırsak çimen tek bir dikdörtgen olur: (${s} − ${a}) × (${s} − ${b}) = ${s - a} × ${s - b} = ${ans}.`, svg(f), { unit: "m²", hint: "Yolları bahçenin kenarına itince kalan parçalar birleşir.", sol: SOL("Yollar dört çim parçası oluşturur. Yolları bahçenin kenarlarına kaydırırsak çim parçaları birleşip tek bir dikdörtgen olur; alan değişmez.",
      { t: `Düşey yolu sağ kenara, yatay yolu alt kenara it.`, fig: svg(`<rect x="100" y="40" width="160" height="160" fill="#cfeec6" stroke="#5b7d2a" stroke-width="4"/><rect x="${r1(260 - a * u)}" y="40" width="${r1(a * u)}" height="160" fill="#d9c7a8"/><rect x="100" y="${r1(200 - b * u)}" width="160" height="${r1(b * u)}" fill="#d9c7a8"/>` + text(180, 120, `${s - a} × ${s - b}`, { size: 16, fill: "#2f5d1d" })) },
      `Kalan çim dikdörtgeninin kenarları ${s} − ${a} = ${s - a} m ve ${s} − ${b} = ${s - b} m.`,
      `Alan ${s - a} × ${s - b} = ${ans} m².`) });
    }
    const Pm = 2 * ri(8, 120), h = Pm / 2, ans = Math.floor(h / 2) * Math.ceil(h / 2);
    return N(`Kenarları tam sayı ve çevresi ${Pm} cm olan dikdörtgenlerin alanı en çok kaç cm² olabilir?`, ans, `Kenarlar toplamı ${h}. Toplamı sabit iki sayının çarpımı, sayılar birbirine yakınken en büyüktür: ${Math.floor(h / 2)} × ${Math.ceil(h / 2)} = ${ans}.`, svg(G.rectFigure(Math.ceil(h / 2), Math.floor(h / 2), { top: "?", side: "?" })), { unit: "cm²", hint: "Kenarları birbirine olabildiğince yakın seç.", sol: SOL("Çevre sabitken, kenarlar birbirine yaklaştıkça alan büyür. En büyük alan kareye en yakın dikdörtgende olur.",
      `Çevre ${Pm} → iki kenarın toplamı (yarım çevre) ${h}.`,
      { t: `Birkaç örnek:`, fig: solTable(["Kenarlar", "Alan"], [[`1 × ${h - 1}`, h - 1], [`${Math.floor(h / 4)} × ${h - Math.floor(h / 4)}`, Math.floor(h / 4) * (h - Math.floor(h / 4))], [`${Math.floor(h / 2) - 1} × ${Math.ceil(h / 2) + 1}`, (Math.floor(h / 2) - 1) * (Math.ceil(h / 2) + 1)], [`${Math.floor(h / 2)} × ${Math.ceil(h / 2)}`, ans]]) },
      `En büyük alan ${Math.floor(h / 2)} × ${Math.ceil(h / 2)} = ${ans} cm².`) });
  });
  add("alan", 7, 8, (l) => {
    const w1 = ri(2, 12), w2 = ri(2, 12), h1 = ri(2, 12), h2 = ri(2, 12), A = [w1 * h1, w2 * h1, w1 * h2, w2 * h2], miss = ri(0, 3), total = l === 8 && rnd() < .5;
    const labels = A.map((v, i) => i === miss ? "?" : v + " cm²");
    if (total) return N(`Bir dikdörtgen, kenarlarına paralel iki doğruyla dört dikdörtgene bölündü. Üç parçanın alanı şekilde. Büyük dikdörtgenin alanı kaç cm²?`, sum(A), `Çapraz karşılıklı parçaların alan çarpımları eşittir: sol üst × sağ alt = sağ üst × sol alt. Eksik parça ${A[miss]} cm². Toplam ${A.join(" + ")} = ${sum(A)}.`, split4(w1, w2, h1, h2, labels), { unit: "cm²", hint: "Ortak kenarları olan parçaların alan oranları kenar oranlarına eşittir.", sol: SOL("Yan yana iki parça aynı yüksekliği paylaşır; alanlarının oranı genişliklerinin oranıdır. Bu yüzden çapraz karşılıklı parçaların alan çarpımları eşittir.",
      `Sol üst = w₁·h₁, sağ alt = w₂·h₂, sağ üst = w₂·h₁, sol alt = w₁·h₂. Sol üst × sağ alt = w₁·w₂·h₁·h₂ = sağ üst × sol alt.`,
      { t: `Eksik parça: ${A[miss]} cm². (Bilinen üç alanla çarpım eşitliğinden bulunur.)`, fig: split4(w1, w2, h1, h2, A.map((v) => v + " cm²")) },
      `Büyük dikdörtgen: ${A.join(" + ")} = ${sum(A)} cm².`) });
    return N(`Bir dikdörtgen, kenarlarına paralel iki doğruyla dört dikdörtgene bölündü. Üç parçanın alanı şekilde. Dördüncü parçanın alanı kaç cm²?`, A[miss], `Sol üst × sağ alt = (w₁h₁)(w₂h₂) = (w₂h₁)(w₁h₂) = sağ üst × sol alt. Buradan eksik parça ${A[miss]} cm².`, split4(w1, w2, h1, h2, labels), { unit: "cm²", hint: "Çapraz karşılıklı parçaların alanlarını çarp.", sol: SOL("Yan yana iki parça aynı yüksekliği paylaşır; alanlarının oranı genişliklerinin oranıdır. Bu yüzden çapraz karşılıklı parçaların alan çarpımları eşittir.",
      `Sol üst = w₁·h₁, sağ alt = w₂·h₂, sağ üst = w₂·h₁, sol alt = w₁·h₂.`,
      `Sol üst × sağ alt = w₁·w₂·h₁·h₂ = sağ üst × sol alt.`,
      { t: miss === 0 || miss === 3 ? `Eksik = (sağ üst × sol alt) ÷ (bilinen çapraz parça) = ${A[1]} × ${A[2]} ÷ ${A[3 - miss]} = ${A[miss]} cm².` : `Eksik = (sol üst × sağ alt) ÷ (bilinen çapraz parça) = ${A[0]} × ${A[3]} ÷ ${A[3 - miss]} = ${A[miss]} cm².`, fig: split4(w1, w2, h1, h2, A.map((v) => v + " cm²")) }) });
  });
  add("alan", 8, 8, () => {
    const a = ri(3, 16), b = ri(3, 12), ans = a + b - gcd(a, b);
    return N(`${a} × ${b} birim karelik kareli bir dikdörtgenin bir köşegeni çiziliyor. Köşegen kaç birim karenin içinden geçer? (Yalnız köşesine değdiği kareler sayılmaz.)`, ans,
      `Köşegen ${a - 1} düşey ve ${b - 1} yatay iç çizgiyi keser; her kesişte yeni bir kareye girer. Bir kare köşesinden geçtiğinde iki çizgiyi aynı anda keser; bu ${gcd(a, b) - 1} kez olur. 1 + ${a - 1} + ${b - 1} − ${gcd(a, b) - 1} = ${ans}.`, gridBoard(a, b, { diag: true }), { hint: "Köşegen her çizgi geçişinde yeni bir kareye girer; köşelerden geçtiği anlara dikkat et.", sol: SOL("Köşegeni sol alttan sağ üste doğru izleyelim. Her ızgara çizgisini geçtiğinde yeni bir kareye girer.",
      `İlk kare 1. İçeride ${a - 1} düşey ve ${b - 1} yatay çizgi var; her çizgi geçişi +1 kare: 1 + ${a - 1} + ${b - 1} = ${a + b - 1}.`,
      `Ama köşegen bir kafes noktasından (çizgilerin kesiştiği yerden) geçerse iki çizgiyi aynı anda geçer ve yalnız 1 yeni kareye girer. Bu, ${a} ile ${b} sayılarının en büyük ortak böleni ${gcd(a, b)} olduğu için ${gcd(a, b) - 1} kez olur.`,
      { t: `Boyalı kareler köşegenin geçtiği karelerdir: ${a + b - 1} − ${gcd(a, b) - 1} = ${ans}.`, fig: gridBoard(a, b, { diag: true, cells: (() => { const out = []; for (let c = 0; c < a; c++) for (let r = 0; r < b; r++) { const lo = Math.max(r, b * c / a), hi = Math.min(r + 1, b * (c + 1) / a); if (hi - lo > 1e-9) out.push([c, r]); } return out; })() }) }) });
  });

  // 20. Alan ve çevre ilişkisi
  add("iliski", 6, 8, (l) => {
    if (l === 6) {
      const A = ri(12, 200);
      return N(`Alanı ${A} cm² olan ve kenarları tam sayı olan dikdörtgenlerden çevresi en uzun olanın çevresi kaç cm?`, 2 * (A + 1), `Kenarlar birbirinden ne kadar uzaksa çevre o kadar uzun: 1 × ${A}. Çevre 2 × (1 + ${A}) = ${2 * (A + 1)}.`, svg(G.rectFigure(Math.min(A, 14), 1, { top: "?", side: "1" })), { unit: "cm", sol: SOL("Alanı sabit dikdörtgenlerde kenarlar birbirinden uzaklaştıkça (ince uzun) çevre büyür.",
        { t: `Kenarlar çarpımı ${A}. Birkaç örnek:`, fig: solTable(["Kenarlar", "Çevre"], (() => { const r = []; for (let a = 1; a * a <= A && r.length < 4; a++) if (A % a === 0) r.push([`${a} × ${A / a}`, 2 * (a + A / a)]); return r; })()) },
        `En ince uzun dikdörtgen 1 × ${A}: çevre 2 × (1 + ${A}) = ${2 * (A + 1)} cm.`) });
    }
    const A = l === 7 ? ri(20, 200) : ri(200, 999);
    let best = null; for (let a = 1; a * a <= A; a++) if (A % a === 0) best = [a, A / a];
    if (l === 8 && best[0] < 6) return null;
    return N(`Alanı ${A} cm² olan ve kenarları tam sayı olan dikdörtgenlerden çevresi en kısa olanın çevresi kaç cm?`, 2 * (best[0] + best[1]), `Çarpımı ${A} olan tam sayı çiftlerinden birbirine en yakını ${best[0]} × ${best[1]}. Çevre 2 × (${best[0]} + ${best[1]}) = ${2 * (best[0] + best[1])}.`, svg(G.rectFigure(Math.min(best[1], 16), Math.min(best[0], 10), { top: "?", side: "?" })), { unit: "cm", hint: "Kenarlar birbirine ne kadar yakınsa çevre o kadar kısa.", sol: SOL("Alan sabitken kenarlar birbirine yaklaştıkça çevre küçülür. Çarpımı alan olan, birbirine en yakın iki tam sayıyı bulalım.",
      { t: `${A} sayısını iki çarpana ayıralım (küçük çarpan √${A} ≈ ${Math.sqrt(A).toFixed(1).replace(".", ",")} sayısını geçmez):`, fig: solTable(["Kenarlar", "Çevre"], (() => { const r = []; for (let a = 1; a * a <= A; a++) if (A % a === 0) r.push([`${a} × ${A / a}`, 2 * (a + A / a)]); return r.length > 6 ? r.slice(-6) : r; })()) },
      `Birbirine en yakın çift ${best[0]} × ${best[1]}: çevre 2 × (${best[0]} + ${best[1]}) = ${2 * (best[0] + best[1])} cm.`) });
  });
  add("iliski", 6, 7, (l) => {
    const s = ri(6, 40), x = ri(1, s - 2);
    if (l === 6) return N(`Bir dikdörtgenin uzun kenarı ${x} cm kısaltılıp kısa kenarı ${x} cm uzatılınca çevresi ${4 * s} cm olan bir kare oluyor. Dikdörtgenin alanı kaç cm²?`, s * s - x * x, `Kare kenarı ${s}. Dikdörtgen ${s + x} × ${s - x} = ${(s + x) * (s - x)}.`, svg(G.rectFigure(s + x, s - x, { top: `${s}+${x}`, side: `${s}−${x}` })), { unit: "cm²", sol: SOL("Önce karenin kenarını bulalım; sonra dikdörtgenin kenarlarına geri dönelim.",
      `Karenin kenarı ${4 * s} ÷ 4 = ${s} cm.`,
      `Dikdörtgenin uzun kenarı ${x} cm kısaltılınca ${s} oldu: uzun kenar ${s} + ${x} = ${s + x}. Kısa kenar ${x} cm uzatılınca ${s} oldu: kısa kenar ${s} − ${x} = ${s - x}.`,
      `Alan ${s + x} × ${s - x} = ${s * s - x * x} cm².`) });
    return N(`Bir dikdörtgenin uzun kenarı bir miktar kısaltılıp kısa kenarı aynı miktar uzatılınca kare oluyor ve alan ${x * x} cm² artıyor. Dikdörtgenin çevresi ${4 * s} cm. Dikdörtgenin alanı kaç cm²?`, s * s - x * x, `Çevre değişmez; karenin kenarı ${4 * s} ÷ 4 = ${s}, alanı ${s * s}. Dikdörtgenin alanı ${s * s} − ${x * x} = ${s * s - x * x}.`, svg(G.rectFigure(s + x, s - x, { top: "?", side: "?" })), { unit: "cm²", hint: "Bu değişiklik çevreyi değiştirir mi?", sol: SOL("Bir kenar ne kadar kısalıp öbürü aynı miktar uzarsa çevre değişmez. Bu yüzden kare ile dikdörtgenin çevresi aynıdır.",
      `Karenin çevresi de ${4 * s} cm: kenarı ${s} cm, alanı ${s} × ${s} = ${s * s} cm².`,
      `Kare oluşurken alan ${x * x} cm² arttı. O hâlde dikdörtgenin alanı ${s * s} − ${x * x} = ${s * s - x * x} cm².`) });
  });
  add("iliski", 7, 8, (l) => {
    if (l === 7) {
      const Pm = 2 * ri(10, 40), h = Pm / 2, A = ri(Math.floor(h * h / 8), Math.floor(h * h / 4) - 1);
      let c = 0; for (let a = 1; 2 * a <= h; a++) if (a * (h - a) >= A) c++;
      if (!c) return null;
      return N(`Çevresi ${Pm} cm ve kenarları tam sayı olan dikdörtgenlerden (döndürülenler aynı sayılır) kaç tanesinin alanı en az ${A} cm²?`, c, `Kısa kenar a ise uzun kenar ${h} − a. a(${h} − a) ≥ ${A} koşulunu sağlayan a değerleri sayılır: ${c}.`, svg(G.rectFigure(Math.ceil(h / 2), Math.floor(h / 2), { top: "?", side: "?" })), { hint: "Kare biçimine yaklaştıkça alan büyür; kısa kenarı küçükten başlat.", sol: SOL("Kısa kenara a dersek uzun kenar (yarım çevre − a) olur. a'yı küçükten büyüğe deneyelim; kare biçimine yaklaştıkça alan büyür.",
        `Yarım çevre ${h}. Kısa kenar a = 1, 2, …, ${Math.floor(h / 2)}.`,
        { t: `Alanlar:`, fig: solTable(["a", "Uzun kenar", "Alan", `≥ ${A} ?`], Array.from({ length: Math.floor(h / 2) }, (_, i) => [i + 1, h - i - 1, (i + 1) * (h - i - 1), (i + 1) * (h - i - 1) >= A ? "✔" : "✘"]).slice(-Math.min(Math.floor(h / 2), c + 3))) },
        `${c} dikdörtgenin alanı en az ${A} cm².`) });
    }
    const k = ri(1, 6); const list = [];
    for (let a = 2 * k + 1; a <= 4 * k; a++) { const d = a - 2 * k; if ((4 * k * k) % d === 0) { const b = 2 * k + 4 * k * k / d; if (b >= a) list.push(`${a}×${b}`); } }
    return N(`Kenarları tam sayı olan bir dikdörtgenin alanının sayısal değeri, çevresinin sayısal değerinin ${k} katına eşit. Böyle kaç farklı dikdörtgen vardır? (Döndürülenler aynı sayılır.)`, list.length,
      `ab = ${2 * k}(a + b) → (a − ${2 * k})(b − ${2 * k}) = ${4 * k * k}. ${ek(4 * k * k, "in")} çarpanlarına ayrılışları: ${list.join(", ")} → ${list.length} dikdörtgen.`, svg(G.rectFigure(5, 3, { top: "a", side: "b" })), { hint: `Eşitliği (a − ${2 * k})(b − ${2 * k}) biçimine getir.`, sol: SOL(`Kenarlara a ≤ b diyelim. Alan ab, çevre 2(a + b). Koşul: ab = ${k} × 2(a + b).`,
      `ab = ${2 * k}a + ${2 * k}b. Her iki yana ${4 * k * k} ekleyip düzenleyince: (a − ${2 * k}) × (b − ${2 * k}) = ${4 * k * k}.`,
      `Kontrol: (a − ${2 * k})(b − ${2 * k}) = ab − ${2 * k}a − ${2 * k}b + ${4 * k * k}; ab = ${2 * k}a + ${2 * k}b olduğundan sonuç ${4 * k * k}. ✔`,
      { t: `${ek(4 * k * k, "in")} çarpan çiftleri (küçük ≤ büyük) birer dikdörtgen verir:`, fig: solTable([`a − ${2 * k}`, `b − ${2 * k}`, "Dikdörtgen"], list.map((x) => { const [a, b] = x.split("×").map(Number); return [a - 2 * k, b - 2 * k, `${a} × ${b}`]; })) },
      `${list.length} farklı dikdörtgen.`) });
  });


  // ---- Üretim ----
  // Tekrar geçmişi tarayıcıda saklanır; sayfa yenilense veya test kapatılıp açılsa da
  // son sorulan sorular hemen geri gelmez ve kalıplar sırayla dönmeye devam eder.
  // Yer kaplamasın diye sorular tam metin yerine kısa özet kodlarıyla saklanır.
  const STORE_KEY = "mat-levelgen-memory-v3";
  const memory = {};
  let serial = 0;
  let saved = {};
  try { root.localStorage.removeItem("mat-levelgen-memory-v1"); } catch (err) { /* eski kayıt silinemezse önemli değil */ }
  try { saved = JSON.parse(root.localStorage.getItem(STORE_KEY) || "{}") || {}; } catch (err) { saved = {}; }
  function load(key, list) {
    const st = { uses: new Map(), recent: [], lastTemplate: null };
    const raw = saved[key];
    if (raw && Array.isArray(raw.recent)) st.recent = raw.recent.filter((x) => typeof x === "string").slice(-80);
    if (raw && Array.isArray(raw.uses)) list.forEach((t, i) => { const n = Number(raw.uses[i]); if (n > 0) st.uses.set(t, n); });
    if (raw && typeof raw.lastTemplate === "string") st.lastTemplate = raw.lastTemplate;
    return st;
  }
  function save(key, list, st) {
    const min = Math.min(...list.map((t) => st.uses.get(t) || 0));
    saved[key] = { recent: st.recent, uses: list.map((t) => (st.uses.get(t) || 0) - min), lastTemplate: st.lastTemplate };
    try { root.localStorage.setItem(STORE_KEY, JSON.stringify(saved)); } catch (err) { /* depolama yoksa yalnız bellekte kalır */ }
  }
  function valid(q) {
    if (!q || !q.prompt || !q.explain) return false;
    if (q.kind === "num") return Number.isSafeInteger(q.answer) && q.answer >= 0;
    if (q.kind === "mc") return q.choices.length >= 2 && q.choices.length <= 4 && q.choices.filter((c) => c === q.answer).length === 1 && new Set(q.choices).size === q.choices.length;
    return false;
  }
  // Aynı metinli sorular çizimleriyle ayrışır; tekrar denetimi metin + cevap + çizimle yapılır.
  function signature(q) {
    const s = q.prompt + "|" + q.answer + "|" + (q.scene ? q.scene.html.replace(/animation-delay:[^;"]*;?/g, "") : "");
    return hashText(q.prompt + "#" + q.answer).toString(36) + "." + hashText(s).toString(36);
  }
  function hashText(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
  }
  // opts.template: aynı kalıptan soru üretir (turnuva elemesinde herkese eş zorlukta soru için).
  function generate(topicId, level, rng, opts = {}) {
    rnd = rng || Math.random;
    const lv = root.MatGames.LEVELS.find((x) => x.id === level);
    const list = (TP[topicId] || []).filter((t) => level >= t.lo && level <= t.hi);
    if (!lv || !list.length) throw new Error("Üretici yok: " + topicId + ":" + level);
    const key = topicId + ":" + level, st = memory[key] || (memory[key] = load(key, list));
    let q = null;
    const min = Math.min(...list.map((t) => st.uses.get(t) || 0));
    const leastUsed = list.filter(t => (st.uses.get(t) || 0) === min);
    const freshTemplates = leastUsed.filter(t => t.id !== st.lastTemplate);
    const t = list.find((x) => x.id === opts.template) || pick(freshTemplates.length ? freshTemplates : leastUsed);
    for (let attempt = 0; attempt < 60; attempt++) {
      let cand = null;
      try { cand = t.make(level); } catch (err) { cand = null; if (typeof process !== "undefined" && process.env && process.env.LEVELGEN_DEBUG) console.error(err); }
      if (!valid(cand)) continue;
      cand.sig = signature(cand);
      if (st.recent.includes(cand.sig) && attempt < 50) continue;
      st.uses.set(t, min + 1);
      st.lastTemplate = t.id;
      q = cand;
      break;
    }
    if (!q) throw new Error("Soru üretilemedi: " + key);
    st.recent.push(q.sig); if (st.recent.length > 80) st.recent.shift();
    save(key, list, st);
    delete q.sig;
    q.level = level;
    q.points = lv.points;
    q.generated = true;
    q.templateId = t.id;
    q.id = `gen:${key}:${Date.now().toString(36)}${(serial++).toString(36)}`;
    return q;
  }
  root.MatLevelGen = { generate, topics: Object.keys(TP), templates: (topicId, level) => (TP[topicId] || []).filter(t => level === undefined || level >= t.lo && level <= t.hi).length, hashText };
})(typeof window !== "undefined" ? window : globalThis);
