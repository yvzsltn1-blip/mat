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
    return { kind: "num", prompt, answer, explain, unit: o.unit || "", hint: o.hint || HINT, scene: fig ? { kind: "art", html: fig } : null };
  }
  function C(prompt, answer, wrongs, explain, fig, o = {}) {
    const right = String(answer);
    const others = shuffle([...new Set(wrongs.map(String))].filter((w) => w !== right)).slice(0, 3);
    return { kind: "mc", prompt, answer: right, choices: shuffle([right, ...others]), explain, hint: o.hint || HINT, scene: fig ? { kind: "art", html: fig } : null };
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
  const add = (topic, lo, hi, make) => (TP[topic] || (TP[topic] = [])).push({ lo, hi, make });
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

  // ---- Üretim ----
  // Tekrar geçmişi tarayıcıda saklanır; sayfa yenilense veya test kapatılıp açılsa da
  // son sorulan sorular hemen geri gelmez ve kalıplar sırayla dönmeye devam eder.
  const STORE_KEY = "mat-levelgen-memory-v1";
  const memory = {};
  let serial = 0;
  let saved = {};
  try { saved = JSON.parse(root.localStorage.getItem(STORE_KEY) || "{}") || {}; } catch (err) { saved = {}; }
  function load(key, list) {
    const st = { uses: new Map(), recent: [] };
    const raw = saved[key];
    if (raw && Array.isArray(raw.recent)) st.recent = raw.recent.filter((x) => typeof x === "string").slice(-80);
    if (raw && Array.isArray(raw.uses)) list.forEach((t, i) => { const n = Number(raw.uses[i]); if (n > 0) st.uses.set(t, n); });
    return st;
  }
  function save(key, list, st) {
    const min = Math.min(...list.map((t) => st.uses.get(t) || 0));
    saved[key] = { recent: st.recent, uses: list.map((t) => (st.uses.get(t) || 0) - min) };
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
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return q.prompt + "#" + q.answer + "#" + h;
  }
  function generate(topicId, level, rng) {
    rnd = rng || Math.random;
    const lv = root.MatGames.LEVELS.find((x) => x.id === level);
    const list = (TP[topicId] || []).filter((t) => level >= t.lo && level <= t.hi);
    if (!lv || !list.length) throw new Error("Üretici yok: " + topicId + ":" + level);
    const key = topicId + ":" + level, st = memory[key] || (memory[key] = load(key, list));
    let q = null;
    for (let attempt = 0; attempt < 60; attempt++) {
      const min = Math.min(...list.map((t) => st.uses.get(t) || 0));
      const pool = list.filter((t) => (st.uses.get(t) || 0) === min);
      const t = pick(pool);
      let cand = null;
      try { cand = t.make(level); } catch (err) { cand = null; if (typeof process !== "undefined" && process.env && process.env.LEVELGEN_DEBUG) console.error(err); }
      if (!valid(cand)) continue;
      cand.sig = signature(cand);
      if (st.recent.includes(cand.sig) && attempt < 50) continue;
      st.uses.set(t, min + 1);
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
    q.id = `gen:${key}:${Date.now().toString(36)}${(serial++).toString(36)}`;
    return q;
  }
  root.MatLevelGen = { generate, topics: Object.keys(TP), templates: (topicId) => (TP[topicId] || []).length };
})(typeof window !== "undefined" ? window : globalThis);
