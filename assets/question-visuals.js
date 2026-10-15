// Soru bankasındaki çizimsiz sorular için soru metninden otomatik görsel üretir.
// Yalnız soruda verilen sayılar kullanılır; cevap hiçbir zaman çizime yazılmaz.
// Çizimler ölçekli değildir; durumu canlandırmak ve verilenleri öne çıkarmak içindir.
(function (root) {
  "use strict";
  const INK = "#1f2547", CORAL = "#e25b45", BLUE = "#2c6bed", TEAL = "#1c8c74", GOLD = "#f0a90d", GRAPE = "#6b4fd8", PINK = "#e0548f", BROWN = "#9a6a3a";
  const COLORS = [CORAL, BLUE, GRAPE, GOLD, PINK, TEAL];
  const FILLS = ["#ffdcb0", "#ccebe2", "#e3dcff", "#ffd6e0", "#d8e8ff"];
  const r1 = (n) => Math.round(n * 10) / 10;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const toN = (s) => Number(String(s).replace(/\s/g, ""));
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const P = (cx, cy, deg, r) => [r1(cx + r * Math.cos(deg * Math.PI / 180)), r1(cy - r * Math.sin(deg * Math.PI / 180))];
  const NUM_RE = /\d{1,3}(?: \d{3})+(?!\d)|\d+/g;
  const WORD_NUM = { iki: 2, "üç": 3, "dört": 4, "beş": 5, "altı": 6 };
  const nums = (p) => [...p.matchAll(NUM_RE)].map((m) => toN(m[0]));
  const degs = (p) => [...p.matchAll(/(\d+)°/g)].map((m) => +m[1]);

  // ---- Çizim yardımcıları ----
  function text(x, y, t, o = {}) {
    return `<text${o.scale ? ' data-scale="1"' : ""} x="${r1(x)}" y="${r1(y)}" text-anchor="${o.anchor || "middle"}" dominant-baseline="middle" font-size="${o.size || 18}" font-weight="${o.weight || 800}" fill="${o.fill || INK}" paint-order="stroke" stroke="${o.halo === false ? "none" : "#fff"}" stroke-width="5">${esc(t)}</text>`;
  }
  const emoji = (x, y, ch, size = 36, delay = 0) => `<text class="pop" style="animation-delay:${delay}ms" x="${r1(x)}" y="${r1(y)}" text-anchor="middle" dominant-baseline="middle" font-size="${size}">${ch}</text>`;
  function line(x1, y1, x2, y2, o = {}) {
    return `<line${o.cls ? ` class="${o.cls}"` : ""} x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${o.color || INK}" stroke-width="${o.w || 4}" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}/>`;
  }
  const dot = (x, y, r = 6, fill = CORAL, delay = 0) => `<circle class="pop" style="animation-delay:${delay}ms" cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${fill}"/>`;
  function sector(cx, cy, r, a0, a1, fill) {
    if (a1 - a0 >= 359.9) return `<circle class="pop" cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
    const [x0, y0] = P(cx, cy, a0, r), [x1, y1] = P(cx, cy, a1, r);
    return `<path class="pop" d="M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 0 ${x1} ${y1} Z" fill="${fill}"/>`;
  }
  const ray = (cx, cy, deg, len, color = INK, w = 5, cls = "draw") => { const [x, y] = P(cx, cy, deg, len); return line(cx, cy, x, y, { color, w, cls }); };
  function rightMark(cx, cy, a, s = 18, color = "#666") {
    const p1 = P(cx, cy, a, s), p3 = P(cx, cy, a + 90, s), p2 = P(p1[0], p1[1], a + 90, s);
    return `<polyline points="${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
  }
  function arrowHead(x, y, deg, color = INK, s = 13) {
    const a = P(x, y, deg + 155, s), b = P(x, y, deg - 155, s);
    return `<polygon points="${r1(x)},${r1(y)} ${a[0]},${a[1]} ${b[0]},${b[1]}" fill="${color}"/>`;
  }
  const isQ = (t) => String(t).trim().startsWith("?");
  const label = (x, y, t, o = {}) => text(x, y, t, { size: isQ(t) ? 26 : 18, fill: isQ(t) ? TEAL : INK, ...o });
  function wrap(inner, w = 400, h = 240) {
    return `<div class="stage qv-stage"><svg class="scene qv" viewBox="0 0 ${w} ${h}" role="img" aria-hidden="true">${inner}</svg></div>`;
  }

  // Verilenler şeridi: sayıları renkli kartlar olarak gösterir.
  function chipLayout(list, x0, x1, y0, fs = 16, gap = 8, rowH = 40) {
    let x = x0, y = y0, s = "";
    list.forEach((c, i) => {
      const t = typeof c === "string" ? c : c.t, color = c.color || [CORAL, BLUE, GRAPE, TEAL, PINK, GOLD][i % 6];
      const w = [...t].length * fs * 0.6 + 26;
      if (x + w > x1 && x > x0) { x = x0; y += rowH; }
      s += `<g class="pop" style="animation-delay:${150 + i * 90}ms"><rect x="${r1(x)}" y="${r1(y - 16)}" width="${r1(w)}" height="32" rx="16" fill="${c.bg || "#fff"}" stroke="${color}" stroke-width="2.5"/>${text(x + w / 2, y + 1, t, { size: fs, fill: color, halo: false })}</g>`;
      x += w + gap;
    });
    return s;
  }
  function chipRow(list, y, W = 400) {
    if (!list.length) return "";
    let fs = 16;
    const width = (l, f) => l.reduce((a, c) => a + [...(c.t || c)].length * f * 0.6 + 26, 0) + 8 * (l.length - 1);
    while (width(list, fs) > W - 16 && fs > 12) fs -= 1;
    while (list.length > 1 && width(list, fs) > W - 16) list = list.slice(0, -1);
    const x0 = (W - width(list, fs)) / 2;
    return chipLayout(list, x0, W, y, fs);
  }
  const unwrap = (html) => html.replace(/^<div class="stage qv-stage"><svg[^>]*>|<\/svg><\/div>$/g, "");
  const addTo = (html, extra) => html.replace(/<\/svg><\/div>$/, extra + "</svg></div>");
  function withChips(inner, chips, W = 400, H = 240) {
    if (!chips || !chips.length) return wrap(inner, W, H);
    return wrap(inner + chipRow(chips, H + 22, W), W, H + 46);
  }

  // Soru metnindeki sayıları birimleri veya ardından gelen sözcükle birlikte toplar.
  const STOP = new Set(["ve", "ile", "ise", "olan", "daha", "bu", "de", "da", "ya", "için", "olarak", "eş", "farklı", "aynı", "kez", "kat", "katı", "katına", "tane", "olur", "oluyor", "kalan", "eksik", "fazla"]);
  function givens(p, max = 6) {
    const out = [];
    for (const m of p.matchAll(NUM_RE)) {
      let rest = p.slice(m.index + m[0].length), lab = m[0];
      if (/^gen/.test(rest)) lab += "gen";
      else {
        const suf = rest.match(/^'[a-zçğıöşü]+/);
        if (suf) { lab += suf[0]; rest = rest.slice(suf[0].length); }
        const u = rest.match(/^\s?(°|cm²|m²|cm|km|kg|m|TL|birimkare)(?![a-zçğıöşü])/);
        if (u) lab += u[1] === "°" ? "°" : " " + u[1];
        else if (!suf) {
          const w = rest.match(/^\s+([a-zçğıöşü]{3,11})(?![a-zçğıöşü])/);
          if (w && !STOP.has(w[1])) lab += " " + w[1];
        }
      }
      if (!out.includes(lab)) out.push(lab);
      if (out.length >= max) break;
    }
    return out;
  }

  // ---- Geometri çizimleri ----
  // Bir doğru üzerindeki noktalar ve uzunluk köşeli parantezleri.
  function segmentFig(letters, given, asked, o = {}) {
    const n = letters.length, x0 = 45, x1 = 355, y = o.y || 140;
    const X = {};
    letters.forEach((L, i) => { X[L] = x0 + i * (x1 - x0) / Math.max(1, n - 1); });
    (o.mids || []).forEach((m) => { if (X[m.a] != null && X[m.b] != null && X[m.m] != null) X[m.m] = (X[m.a] + X[m.b]) / 2; });
    let s = line(20, y, 380, y, { w: 4, cls: "draw" });
    const levels = [];
    given.forEach((g, i) => {
      if (X[g.a] == null || X[g.b] == null) return;
      const lo = Math.min(X[g.a], X[g.b]), hi = Math.max(X[g.a], X[g.b]);
      let lv = 0;
      while ((levels[lv] || []).some(([a, b]) => lo < b - 1 && hi > a + 1)) lv++;
      (levels[lv] = levels[lv] || []).push([lo, hi]);
      s += bracket(lo, hi, y - 34 - lv * 36, COLORS[i % COLORS.length], g.label, -1);
    });
    if (asked && X[asked.a] != null && X[asked.b] != null) s += bracket(Math.min(X[asked.a], X[asked.b]), Math.max(X[asked.a], X[asked.b]), y + 50, TEAL, "?", 1);
    (o.parts || []).forEach((pt) => {
      const a = X[pt.a], b = X[pt.b];
      if (a == null || b == null) return;
      for (let k = 1; k < pt.k; k++) s += line(a + (b - a) * k / pt.k, y - 9, a + (b - a) * k / pt.k, y + 9, { color: GRAPE, w: 3 });
    });
    const inside = (a, b) => letters.some((L) => X[L] > Math.min(a, b) + 2 && X[L] < Math.max(a, b) - 2);
    (o.mids || []).forEach((m) => {
      if (X[m.a] == null || X[m.b] == null || X[m.m] == null || inside(X[m.a], X[m.m]) || inside(X[m.m], X[m.b])) return;
      [[X[m.a], X[m.m]], [X[m.m], X[m.b]]].forEach(([a, b]) => { const c = (a + b) / 2; s += line(c - 3, y - 8, c - 3, y + 8, { color: GRAPE, w: 2.5 }) + line(c + 3, y - 8, c + 3, y + 8, { color: GRAPE, w: 2.5 }); });
    });
    letters.forEach((L, i) => { s += dot(X[L], y, 7, i % 2 ? BLUE : CORAL, 200 + i * 80) + text(X[L], y + 24, L, { size: 18 }); });
    return wrap(s, 400, 240);
  }
  function bracket(lo, hi, y, color, lab, dir) {
    const t = dir < 0 ? 7 : -7;
    return `<g class="pop">${line(lo + 3, y, hi - 3, y, { color, w: 3 })}${line(lo + 3, y, lo + 3, y + t, { color, w: 3 })}${line(hi - 3, y, hi - 3, y + t, { color, w: 3 })}${text((lo + hi) / 2, y + (dir < 0 ? -13 : 15), lab, { size: isQ(lab) ? 22 : 16, fill: color })}</g>`;
  }
  function rulerFig(marks) {
    const max = Math.max(...marks.map((m) => m.v)) + 2, x0 = 30, x1 = 370, u = (x1 - x0) / max;
    let s = `<rect class="pop" x="20" y="120" width="360" height="62" rx="8" fill="#fff1c9" stroke="#d9b75a" stroke-width="3"/>`;
    const step = max <= 25 ? 1 : max <= 60 ? 5 : 10;
    for (let v = 0; v <= max; v += step) {
      const big = v % (step * 5) === 0 || step === 1 && v % 5 === 0;
      s += line(x0 + v * u, 120, x0 + v * u, 120 + (big ? 22 : 12), { color: "#8a6d1e", w: big ? 2.5 : 1.5 });
      if (big || step > 1) s += text(x0 + v * u, 162, v, { size: 11, fill: "#8a6d1e", halo: false, scale: true });
    }
    s += line(x0 + marks[0].v * u, 92, x0 + marks[marks.length - 1].v * u, 92, { color: INK, w: 5, cls: "draw" });
    marks.forEach((m, i) => { s += dot(x0 + m.v * u, 92, 8, i ? BLUE : CORAL, 300 + i * 100) + text(x0 + m.v * u, 64, m.l, { size: 20 }) + line(x0 + m.v * u, 100, x0 + m.v * u, 120, { color: i ? BLUE : CORAL, w: 2, dash: "4 3" }); });
    return wrap(s + emoji(352, 40, "📏", 30), 400, 200);
  }
  function dotsLineFig(n, o = {}) {
    const shown = n > 10 ? 9 : n, x0 = 45, x1 = 355, y = 120;
    let s = o.noLine ? "" : line(20, y, 380, y, { w: 4, cls: "draw" });
    for (let i = 0; i < shown; i++) {
      const x = x0 + i * (x1 - x0) / Math.max(1, shown - 1);
      if (n > 10 && i === 7) { s += text(x, y, "…", { size: 26 }); continue; }
      const L = n > 10 && i === 8 ? String.fromCharCode(64 + Math.min(n, 26)) : String.fromCharCode(65 + i);
      s += dot(x, y, 7, i % 2 ? BLUE : CORAL, 150 + i * 70) + text(x, y + 26, n <= 26 ? L : "", { size: 16 });
    }
    return withChips(s, n > 2 ? [{ t: `${n} nokta`, color: CORAL }] : [], 400, 200);
  }
  function dividedFig(k, total) {
    const x0 = 40, x1 = 360, y = 130;
    let s = line(x0, y, x1, y, { w: 5, cls: "draw", color: INK });
    for (let i = 0; i <= k; i++) {
      const x = x0 + i * (x1 - x0) / k;
      s += line(x, y - 12, x, y + 12, { color: i === 0 || i === k ? INK : GRAPE, w: 3 });
      if (i < k && k <= 16) s += `<rect class="pop" style="animation-delay:${i * 60}ms" x="${r1(x + 2)}" y="${y + 18}" width="${r1((x1 - x0) / k - 4)}" height="8" rx="4" fill="${FILLS[i % 2]}"/>`;
    }
    if (total) s += bracket(x0, x1, y - 40, CORAL, total, -1);
    return withChips(s, [{ t: `${k} eş parça`, color: GRAPE }], 400, 200);
  }

  // Bir bütün açıyı (90°, 180°, 360°) parçalara ayırır; bilinmeyenler "?" ile gösterilir.
  function splitAngle(total, parts) {
    const known = parts.reduce((a, x) => a + (x.v || 0), 0), unk = parts.filter((x) => !x.v).length;
    let sizes = parts.map((x) => x.v || (unk ? (total - known) / unk : 0));
    if (known > total || sizes.some((v) => !(v > 0))) sizes = parts.map(() => total / parts.length);
    const minPart = total === 360 ? 24 : total === 180 ? 18 : 12;
    sizes = sizes.map((v) => Math.max(v, minPart));
    const sum = sizes.reduce((a, b) => a + b, 0);
    sizes = sizes.map((v) => v * total / sum);
    const g = total === 90 ? { cx: 125, cy: 210, R: 180, f: 120, lr: 85, w: 400, h: 240 } : total === 180 ? { cx: 200, cy: 200, R: 172, f: 120, lr: 82, w: 400, h: 225 } : { cx: 200, cy: 118, R: 104, f: 104, lr: 66, w: 400, h: 236 };
    let s = "", a = 0;
    if (total === 360) s += `<circle cx="${g.cx}" cy="${g.cy}" r="${g.R}" fill="none" stroke="#c9c2e0" stroke-width="3"/>`;
    sizes.forEach((v, i) => { s += sector(g.cx, g.cy, g.f, a, a + v, FILLS[i % FILLS.length]); a += v; });
    if (total === 90) s += ray(g.cx, g.cy, 0, g.R, INK, 5) + ray(g.cx, g.cy, 90, g.R - 10, INK, 5) + rightMark(g.cx, g.cy, 0, 20);
    else if (total === 180) s += line(g.cx - g.R, g.cy, g.cx + g.R, g.cy, { w: 5, cls: "draw" });
    else s += ray(g.cx, g.cy, 0, g.R, INK, 5);
    a = 0;
    sizes.forEach((v, i) => {
      if (i > 0) s += ray(g.cx, g.cy, a, g.R - 8, COLORS[(i - 1) % COLORS.length], 5);
      const [lx, ly] = P(g.cx, g.cy, a + v / 2, g.lr * (v < 30 && total !== 360 ? 1.35 : 1));
      s += label(lx, ly, parts[i].t);
      a += v;
    });
    return wrap(s + dot(g.cx, g.cy, 7, INK), g.w, g.h);
  }
  // İki açıyı yan yana (ortak kollu) çizer; toplamı "?" olarak gösterilebilir.
  function adjacentFig(parts, totalLabel) {
    const cx = 200, cy = 205, total = parts.reduce((a, x) => a + x.v, 0), k = total > 170 ? 170 / total : 1;
    let s = "", a = 0;
    parts.forEach((x, i) => { s += sector(cx, cy, 110, a, a + x.v * k, FILLS[i]); a += x.v * k; });
    s += ray(cx, cy, 0, 175, INK, 5);
    a = 0;
    parts.forEach((x, i) => { a += x.v * k; s += ray(cx, cy, a, 170, COLORS[i], 5); const [lx, ly] = P(cx, cy, a - x.v * k / 2, 80); s += label(lx, ly, x.t); });
    if (totalLabel) { const [tx, ty] = P(cx, cy, a / 2, 145); s += `<path d="M${P(cx, cy, 0, 130).join(" ")} A130 130 0 0 0 ${P(cx, cy, a, 130).join(" ")}" fill="none" stroke="${TEAL}" stroke-width="3" stroke-dasharray="6 5"/>` + label(tx, ty, totalLabel); }
    return wrap(s + dot(cx, cy, 7, INK), 400, 225);
  }
  function angleFig(deg, lab, o = {}) {
    const cx = o.cx || 150, cy = 200, d = clamp(deg, 12, 175);
    let s = sector(cx, cy, 70, 0, d, "#ffdcb0") + ray(cx, cy, 0, 200, INK, 5) + ray(cx, cy, d, 180, CORAL, 5);
    if (deg === 90) s += rightMark(cx, cy, 0, 20);
    const [lx, ly] = P(cx, cy, d / 2, 100);
    s += label(lx, ly, lab);
    if (o.letters) { const [ax, ay] = P(cx, cy, d, 196), [bx, by] = P(cx, cy, 0, 215); s += text(ax, ay - 8, o.letters[0], { size: 20 }) + text(cx - 12, cy + 20, o.letters[1], { size: 20 }) + text(bx - 10, by + 22, o.letters[2], { size: 20 }); }
    return wrap(s + dot(cx, cy, 7, INK), 400, 230);
  }
  function crossFig(deg, labels) {
    const cx = 200, cy = 118, A = clamp(deg || 60, 38, 142), b = [0, A, 180, 180 + A, 360];
    let s = "";
    labels.forEach((t, i) => { if (t) s += sector(cx, cy, 58, b[i], b[i + 1], FILLS[i % FILLS.length]); });
    const a1 = P(cx, cy, 180, 185), a2 = P(cx, cy, 0, 185), c1 = P(cx, cy, A + 180, 150), c2 = P(cx, cy, A, 150);
    s += line(a1[0], a1[1], a2[0], a2[1], { color: BLUE, w: 5, cls: "draw" }) + line(c1[0], c1[1], c2[0], c2[1], { color: CORAL, w: 5, cls: "draw" });
    if (deg === 90) s += rightMark(cx, cy, 0, 18);
    labels.forEach((t, i) => { if (t) { const [lx, ly] = P(cx, cy, (b[i] + b[i + 1]) / 2, 84); s += label(lx, ly, t); } });
    return wrap(s + dot(cx, cy, 7, INK), 400, 236);
  }
  function concurrentFig(n, labels = []) {
    const cx = 200, cy = 125, k = clamp(n, 2, 6);
    let s = "";
    labels.forEach((t, i) => { if (t) s += sector(cx, cy, 64, i * 180 / k, (i + 1) * 180 / k, FILLS[i % FILLS.length]); });
    for (let i = 0; i < k; i++) { const a = P(cx, cy, i * 180 / k, 170), b = P(cx, cy, i * 180 / k + 180, 170); s += line(a[0], a[1], b[0], b[1], { color: COLORS[i % COLORS.length], w: 5, cls: "draw" }); }
    labels.forEach((t, i) => { if (t) { const [lx, ly] = P(cx, cy, (i + .5) * 180 / k, 92); s += label(lx, ly, t, { size: isQ(t) ? 24 : 16 }); } });
    return wrap(s + dot(cx, cy, 7, INK), 400, 250);
  }
  function transversalFig(perp, count = 2) {
    let s = "";
    const ys = count === 2 ? [80, 170] : [60, 125, 190];
    ys.forEach((y) => { s += line(25, y, 375, y, { color: BLUE, w: 5, cls: "draw" }) + arrowHead(150, y, 0, BLUE, 11) + arrowHead(162, y, 0, BLUE, 11); });
    if (perp) { s += line(260, 20, 260, 225, { color: CORAL, w: 5, cls: "draw" }); ys.forEach((y) => { s += rightMark(260, y, 0, 15) + dot(260, y, 6, INK); }); }
    else { s += line(190, 230, 330, 15, { color: CORAL, w: 5, cls: "draw" }); ys.forEach((y) => { s += dot(190 + (230 - y) * 140 / 215, y, 6, INK); }); }
    return wrap(s, 400, 240);
  }
  const GENERAL_LINES = [[20, 60, 380, 200], [20, 190, 380, 40], [60, 20, 300, 235], [150, 230, 360, 15], [20, 125, 380, 95], [30, 30, 220, 235]];
  function linesFig(n) {
    let s = "";
    GENERAL_LINES.slice(0, clamp(n, 2, 6)).forEach((l, i) => { s += line(l[0], l[1], l[2], l[3], { color: [INK, CORAL, BLUE, TEAL, GRAPE, GOLD][i], w: 4, cls: "draw" }); });
    return withChips(`<g clip-path="inset(0)">${s}</g>`, [{ t: `${n} doğru`, color: CORAL }, { t: "hiçbiri paralel değil", color: BLUE }], 400, 240);
  }
  function gridLinesFig(h, v, chips = []) {
    const hs = Math.min(h, 6), vs = Math.min(v, 8);
    let s = "";
    for (let i = 0; i < hs; i++) { const y = 30 + i * 180 / Math.max(1, hs - 1); s += line(20, y, 380, y, { color: BLUE, w: 4, cls: "draw" }); }
    for (let j = 0; j < vs; j++) { const x = 50 + j * 300 / Math.max(1, vs - 1); s += line(x, 15, x, 225, { color: CORAL, w: 4, cls: "draw" }); }
    return withChips(s, [{ t: `${h} yatay`, color: BLUE }, { t: `${v} düşey`, color: CORAL }, ...chips], 400, 240);
  }
  function parallelsFig(n, gaps = [], chips = []) {
    const k = n > 6 ? 6 : n, ys = Array.from({ length: k }, (_, i) => 30 + i * 180 / Math.max(1, k - 1));
    let s = "";
    ys.forEach((y, i) => {
      if (n > 6 && i === 4) { s += text(200, y, "⋮", { size: 30, fill: "#999" }); return; }
      s += line(25, y, 375, y, { color: i % 2 ? BLUE : INK, w: 5, cls: "draw" }) + arrowHead(70, y, 0, i % 2 ? BLUE : INK, 10);
    });
    gaps.slice(0, k - 1).forEach((g, i) => {
      const yA = ys[i] + 5, yB = ys[i + 1] - 5;
      s += line(320, yA, 320, yB, { color: CORAL, w: 3 }) + arrowHead(320, yA - 2, 90, CORAL, 9) + arrowHead(320, yB + 2, -90, CORAL, 9) + label(336, (yA + yB) / 2, g, { size: isQ(g) ? 24 : 15, fill: isQ(g) ? TEAL : CORAL, anchor: "start" });
    });
    chips = chips.filter((c) => !String(c.t || c).startsWith(n + " "));
    return withChips(s, n > 2 ? [{ t: `${n} paralel çizgi`, color: BLUE }, ...chips] : chips, 400, 240);
  }
  function perpFig(dist, slant, chips = []) {
    let s = line(20, 200, 380, 200, { w: 5, cls: "draw" }) + text(372, 182, "d", { size: 18 });
    s += line(150, 45, 150, 200, { color: CORAL, w: 5, cls: "draw", dash: "" }) + rightMark(150, 200, 0, 18);
    if (dist) s += text(136, 122, dist, { size: isQ(dist) ? 24 : 17, fill: isQ(dist) ? TEAL : CORAL, anchor: "end" });
    if (slant) s += line(150, 45, 320, 200, { color: BLUE, w: 4, dash: "9 7" }) + text(262, 108, slant, { size: isQ(slant) ? 24 : 17, fill: isQ(slant) ? TEAL : BLUE, anchor: "start" });
    s += dot(150, 45, 8, INK) + text(170, 38, "P", { size: 18 });
    return withChips(s, chips, 400, 230);
  }
  function bridgeFig(lab, chips = []) {
    let s = `<rect x="0" y="0" width="400" height="62" fill="#c9ecb4"/><rect x="0" y="62" width="400" height="106" fill="#bfe1fb"/><rect x="0" y="168" width="400" height="62" fill="#c9ecb4"/>`;
    s += `<path d="M30 110 q20 -10 40 0 t40 0 M250 130 q20 -10 40 0 t40 0" fill="none" stroke="#fff" stroke-width="3"/>`;
    s += `<rect class="pop" x="168" y="50" width="44" height="130" rx="4" fill="#c8915a" stroke="${BROWN}" stroke-width="3"/>`;
    for (let y = 62; y < 170; y += 14) s += line(170, y, 210, y, { color: BROWN, w: 2 });
    s += line(250, 52, 330, 178, { color: "#999", w: 6, dash: "10 8" }) + rightMark(212, 168, 0, 14, INK);
    if (lab) s += text(228, 115, lab, { size: isQ(lab) ? 24 : 17, fill: isQ(lab) ? TEAL : INK, anchor: "start" });
    return withChips(s + emoji(40, 30, "🌳", 30) + emoji(360, 200, "🌳", 30), chips, 400, 230);
  }
  function poleFig(h, count = 1, chips = []) {
    let s = line(20, 210, 380, 210, { color: BROWN, w: 6 });
    const k = clamp(count, 1, 5);
    for (let i = 0; i < k; i++) {
      const x = 200 + (i - (k - 1) / 2) * 70;
      s += `<rect class="pop" style="animation-delay:${i * 100}ms" x="${x - 6}" y="45" width="12" height="165" rx="3" fill="#9aa5b1"/>` + rightMark(x + 6, 210, 0, 14, CORAL);
    }
    if (h) s += text(200 + ((k - 1) / 2) * 70 + 22, 128, h, { size: 18, fill: CORAL, anchor: "start" });
    return withChips(s, chips, 400, 230);
  }

  function circleFig(o = {}) {
    const cx = 200, cy = 120, R = 92;
    let s = `<circle class="draw" cx="${cx}" cy="${cy}" r="${R}" fill="#eef6ff" stroke="${BLUE}" stroke-width="5"/>`;
    if (o.d != null) s += line(cx - R, cy, cx + R, cy, { color: GOLD, w: 5, cls: "draw" }) + text(cx, cy + 22, o.d, { size: isQ(o.d) ? 24 : 17, fill: isQ(o.d) ? TEAL : "#b07a00" });
    if (o.r != null) { const [x, y] = P(cx, cy, 55, R); s += line(cx, cy, x, y, { color: CORAL, w: 5, cls: "draw" }); const [lx, ly] = P(cx, cy, 55, R * .55); s += text(lx + 28, ly - 4, o.r, { size: isQ(o.r) ? 24 : 17, fill: isQ(o.r) ? TEAL : CORAL, anchor: "start" }); }
    if (o.letters) s += text(cx - R - 14, cy, "A", { size: 18 }) + text(cx + R + 14, cy, "B", { size: 18 }) + text(cx - 10, cy - 18, "O", { size: 18 }) + dot(cx - R, cy, 6, INK) + dot(cx + R, cy, 6, INK);
    s += dot(cx, cy, 7, INK);
    if (o.compass) s += emoji(345, 45, "✏️", 34) + emoji(55, 45, "📐", 30);
    return withChips(s, o.chips, 400, 240);
  }
  function circlesFig(list, chips = []) {
    const vals = list.map((x) => x.v || 1), mx = Math.max(...vals), k = list.length;
    const radii = vals.map((v) => clamp(30 + 52 * v / mx, 34, 82) * (k === 3 ? .8 : 1));
    const span = radii.reduce((a, r) => a + 2 * r, 0) + 24 * (k - 1);
    let x = 200 - span / 2, s = "";
    list.forEach((it, i) => {
      const r = radii[i], cx = x + r, cy = 128;
      s += `<circle class="draw" cx="${r1(cx)}" cy="${cy}" r="${r1(r)}" fill="${FILLS[i % FILLS.length]}55" stroke="${COLORS[(i + 1) % COLORS.length]}" stroke-width="4"/>`;
      if (it.d) s += line(cx - r, cy, cx + r, cy, { color: GOLD, w: 4, cls: "draw" });
      else s += line(cx, cy, cx + r, cy, { color: CORAL, w: 4, cls: "draw" });
      s += dot(cx, cy, 5, INK) + text(cx, cy - r - 16, it.t, { size: isQ(it.t) ? 22 : 15, fill: isQ(it.t) ? TEAL : INK });
      x += 2 * r + 24;
    });
    return withChips(s, chips, 400, 240);
  }
  function concentricFig(lab1, lab2, gapAsked, chips = []) {
    const cx = 200, cy = 125;
    let s = `<circle class="draw" cx="${cx}" cy="${cy}" r="100" fill="#eef6ff" stroke="${BLUE}" stroke-width="4"/><circle class="draw" cx="${cx}" cy="${cy}" r="55" fill="#fff4e0" stroke="${CORAL}" stroke-width="4"/>`;
    s += line(cx, cy, cx + 55, cy, { color: CORAL, w: 5 }) + line(cx, cy, cx - 70, cy - 70, { color: BLUE, w: 4 });
    if (lab1) s += text(cx + 28, cy + 18, lab1, { size: 15, fill: CORAL });
    if (lab2) s += text(cx - 60, cy - 30, lab2, { size: 15, fill: BLUE, anchor: "end" });
    if (gapAsked) s += bracket(cx + 55, cx + 100, cy - 22, TEAL, "?", -1);
    return withChips(s + dot(cx, cy, 7, INK), chips, 400, 240);
  }
  // İki çemberle üçgen inşası; yarıçaplar ve merkezler arası uzaklık gerçek oranlarla çizilir.
  function constructFig(ra, rb, d, labs = {}) {
    const A = 145, B = 255, D = B - A, cy = 160;
    let R1 = 95, R2 = 95;
    if (ra && rb && d && Math.abs(ra - rb) < d && d < ra + rb) { const sc = D / d; R1 = ra * sc; R2 = rb * sc; }
    else if (ra && rb && ra !== rb) { R1 = 85; R2 = 85 * rb / ra; if (R2 > 115) { R2 = 115; R1 = 115 * ra / rb; } }
    const a = (R1 * R1 - R2 * R2 + D * D) / (2 * D), h = Math.sqrt(Math.max(0, R1 * R1 - a * a));
    const px = A + a, py = cy - (h || 80);
    let s = `<circle class="draw" cx="${A}" cy="${cy}" r="${r1(R1)}" fill="rgba(44,107,237,.06)" stroke="${BLUE}" stroke-width="3"/><circle class="draw" cx="${B}" cy="${cy}" r="${r1(R2)}" fill="rgba(226,91,69,.05)" stroke="${CORAL}" stroke-width="3"/>`;
    s += `<path class="pop" d="M${A} ${cy} L${r1(px)} ${r1(py)} L${B} ${cy} Z" fill="rgba(240,169,13,.28)" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    s += dot(A, cy, 6, INK) + dot(B, cy, 6, INK) + dot(px, py, 7, GRAPE) + text(A - 6, cy + 22, "A", { size: 18 }) + text(B + 6, cy + 22, "B", { size: 18 }) + text(px, py - 20, "P", { size: 18, fill: GRAPE });
    if (labs.a) s += label((A + px) / 2 - 18, (cy + py) / 2, labs.a, { anchor: "end", size: isQ(labs.a) ? 24 : 16, fill: isQ(labs.a) ? TEAL : BLUE });
    if (labs.b) s += label((B + px) / 2 + 18, (cy + py) / 2, labs.b, { anchor: "start", size: isQ(labs.b) ? 24 : 16, fill: isQ(labs.b) ? TEAL : CORAL });
    if (labs.d) s += label((A + B) / 2, cy + 22, labs.d, { size: isQ(labs.d) ? 24 : 16 });
    return withChips(s, labs.chips, 400, 250);
  }

  function polyPts(n, cx, cy, r) {
    const start = -90 + 180 / n;
    return Array.from({ length: n }, (_, i) => P(cx, cy, start + i * 360 / n, r));
  }
  function polyFig(n, o = {}) {
    const pts = polyPts(n, 200, 112, 88);
    let s = `<polygon class="pop" points="${pts.map((p) => p.join(",")).join(" ")}" fill="#efe9ff" stroke="${GRAPE}" stroke-width="5" stroke-linejoin="round"/>`;
    pts.forEach((p, i) => { s += dot(p[0], p[1], 6, CORAL, 200 + i * 50); });
    if (o.side) { const [a, b] = [pts[n - 1], pts[0]]; s += text((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 22, o.side, { size: isQ(o.side) ? 24 : 17, fill: isQ(o.side) ? TEAL : GRAPE }); }
    if (o.angle) { const v = pts[Math.floor(n / 2)]; s += text(v[0] + (200 - v[0]) * .3, v[1] + (118 - v[1]) * .3, o.angle, { size: 16 }); }
    if (o.center) s += text(200, 118, o.center, { size: 18, fill: GRAPE });
    return withChips(s, o.chips, 400, 236);
  }
  function multiPolyFig(list, chips = []) {
    const k = list.length, R = k > 2 ? 52 : 70, gap = 400 / k;
    let s = "";
    list.forEach((it, i) => {
      const cx = gap * (i + .5), pts = polyPts(it.n, cx, 115, R);
      s += `<polygon class="pop" style="animation-delay:${i * 120}ms" points="${pts.map((p) => p.join(",")).join(" ")}" fill="${FILLS[i % FILLS.length]}" stroke="${COLORS[i % COLORS.length]}" stroke-width="4" stroke-linejoin="round"/>`;
      if (it.t) s += text(cx, 115 + R + 24, it.t, { size: 15, fill: COLORS[i % COLORS.length] });
    });
    return withChips(s, chips, 400, 236);
  }

  function triPts(A, B, W = 300) {
    const C = 180 - A - B;
    const b = Math.sin(B * Math.PI / 180) / Math.sin(C * Math.PI / 180);
    const raw = [[0, 0], [1, 0], [b * Math.cos(A * Math.PI / 180), b * Math.sin(A * Math.PI / 180)]];
    const xs = raw.map((p) => p[0]), minX = Math.min(...xs), maxX = Math.max(...xs), maxY = raw[2][1];
    const sc = Math.min(W / (maxX - minX), 165 / maxY);
    return raw.map((p) => [r1(50 + (p[0] - minX) * sc + (W - (maxX - minX) * sc) / 2), r1(205 - p[1] * sc)]);
  }
  // labels: köşe etiketleri [sol, sağ, tepe]; sides: [taban, sağ kenar, sol kenar].
  function triFig(A, B, labels = [], o = {}) {
    let dA = clamp(A, 22, 120), dB = clamp(B, 22, 120);
    if (dA + dB > 158) { const k = 158 / (dA + dB); dA *= k; dB *= k; }
    const pts = triPts(dA, dB, o.ext != null ? 230 : 300), [p, q, r] = pts, gx = (p[0] + q[0] + r[0]) / 3, gy = (p[1] + q[1] + r[1]) / 3;
    let s = "";
    if (o.ext) s += line(q[0], q[1], q[0] + 75, q[1], { w: 4, dash: "8 6", color: "#888" }) + sector(q[0], q[1], 34, 0, 180 - dB, "#ffd6e0") + label(q[0] + 52, q[1] - 22, o.ext, { size: isQ(o.ext) ? 22 : 15 });
    s += `<polygon class="pop" points="${pts.map((v) => v.join(",")).join(" ")}" fill="#fff1d6" stroke="${GOLD}" stroke-width="5" stroke-linejoin="round"/>`;
    if (o.right === 0) s += rightMark(p[0], p[1], 0, 18);
    pts.forEach((v, i) => { const t = labels[i]; if (t) s += label(v[0] + (gx - v[0]) * .32, v[1] + (gy - v[1]) * .32, t, { size: isQ(t) ? 24 : 16 }); });
    if (o.sides) {
      const mids = [[p, q], [q, r], [r, p]];
      o.sides.forEach((t, i) => {
        if (!t) return;
        const [u, v] = mids[i], mx = (u[0] + v[0]) / 2, my = (u[1] + v[1]) / 2, dx = mx - gx, dy = my - gy, L = Math.hypot(dx, dy) || 1;
        s += label(mx + dx / L * 22, my + dy / L * 22, t, { size: isQ(t) ? 22 : 15, fill: isQ(t) ? TEAL : "#b07a00" });
      });
    }
    if (o.ticks) [[p, r], [q, r]].forEach(([u, v]) => { const mx = (u[0] + v[0]) / 2, my = (u[1] + v[1]) / 2; s += `<circle cx="${r1(mx)}" cy="${r1(my)}" r="4" fill="${CORAL}"/>`; });
    return withChips(s, o.chips, 400, 236);
  }

  function rectFig(w, h, o = {}) {
    let W = w || 5, H = h || 3;
    if (W / H > 3.4) H = W / 3.4;
    if (H / W > 1.6) W = H / 1.6;
    const u = Math.min(250 / W, 150 / H), RW = W * u, RH = H * u, x = 205 - RW / 2, y = 122 - RH / 2;
    let s = "";
    if (o.outer) s += `<rect class="pop" x="${r1(x - 14)}" y="${r1(y - 14)}" width="${r1(RW + 28)}" height="${r1(RH + 28)}" rx="6" fill="#d9c7a8"/>`;
    s += `<rect class="pop" x="${r1(x)}" y="${r1(y)}" width="${r1(RW)}" height="${r1(RH)}" rx="4" fill="${o.fill || "#dff1ff"}" stroke="${o.stroke || BLUE}" stroke-width="5"/>`;
    if (o.inner) s += `<rect class="pop" style="animation-delay:200ms" x="${r1(x + 13)}" y="${r1(y + 13)}" width="${r1(RW - 26)}" height="${r1(RH - 26)}" rx="3" fill="none" stroke="${BROWN}" stroke-width="3" stroke-dasharray="7 5"/>`;
    if (o.wires) for (let i = 1; i < Math.min(o.wires, 4); i++) s += `<rect x="${r1(x - 7 * i)}" y="${r1(y - 7 * i)}" width="${r1(RW + 14 * i)}" height="${r1(RH + 14 * i)}" rx="6" fill="none" stroke="${GRAPE}" stroke-width="2.5" stroke-dasharray="3 4"/>`;
    if (o.rug) { const rw = RW * .38, rh = RH * .5; s += `<rect class="pop" style="animation-delay:250ms" x="${r1(x + RW - rw - 12)}" y="${r1(y + RH - rh - 12)}" width="${r1(rw)}" height="${r1(rh)}" rx="4" fill="#f4b5a5" stroke="${CORAL}" stroke-width="3"/>` + text(x + RW - rw / 2 - 12, y + RH - rh / 2 - 12, o.rug, { size: 14, fill: CORAL }); }
    if (o.cut) { const c = Math.min(RW, RH) * .36; s += `<rect class="pop" style="animation-delay:250ms" x="${r1(x + RW - c)}" y="${r1(y)}" width="${r1(c)}" height="${r1(c)}" fill="#fff" stroke="${CORAL}" stroke-width="3" stroke-dasharray="6 4"/>` + emoji(x + RW - c / 2, y + c / 2, "✂️", 20); if (o.cut !== true) s += text(x + RW - c / 2, y + c + 14, o.cut, { size: 13, fill: CORAL }); }
    if (o.gate) s += line(x + RW * .45, y + RH, x + RW * .62, y + RH, { color: "#fff", w: 8 }) + emoji(x + RW * .535, y + RH + 2, "🚪", 22);
    if (o.grid) {
      const [cols, rows] = o.grid;
      for (let i = 1; i < cols; i++) s += line(x + i * RW / cols, y, x + i * RW / cols, y + RH, { color: "#8db8f2", w: 1.5 });
      for (let j = 1; j < rows; j++) s += line(x, y + j * RH / rows, x + RW, y + j * RH / rows, { color: "#8db8f2", w: 1.5 });
    }
    if (o.split) s += line(x + RW / 2, y, x + RW / 2, y + RH, { color: CORAL, w: 3, dash: "8 6" });
    if (o.top) s += text(x + RW / 2, y - (o.outer || o.wires ? 30 : 18), o.top, { size: isQ(o.top) ? 24 : 17, fill: isQ(o.top) ? TEAL : BLUE });
    if (o.side) s += text(x - (o.outer || o.wires ? 24 : 12), y + RH / 2, o.side, { size: isQ(o.side) ? 24 : 17, fill: isQ(o.side) ? TEAL : BLUE, anchor: "end" });
    if (o.center) s += text(x + RW / 2, y + RH / 2, o.center, { size: 17, fill: o.centerColor || GRAPE });
    if (o.emoji) s += emoji(x + 20, y + 20, o.emoji, 22, 300);
    return withChips(s, o.chips, 400, 240);
  }
  function unitGridFig(cols, rows, chips = []) {
    const c = Math.min(cols, 14), r = Math.min(rows, 8), u = Math.min(300 / c, 170 / r, 34), x0 = 200 - c * u / 2, y0 = 118 - r * u / 2;
    let s = "";
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) s += `<rect class="pop" style="animation-delay:${Math.min((i * c + j) * 15, 700)}ms" x="${r1(x0 + j * u + 1)}" y="${r1(y0 + i * u + 1)}" width="${r1(u - 2)}" height="${r1(u - 2)}" rx="3" fill="${(i + j) % 2 ? "#ffe7a3" : "#ffd36b"}"/>`;
    return withChips(s, chips, 400, 236);
  }
  function squaresRowFig(n, side, chips = []) {
    const k = Math.min(n, 9), u = Math.min(340 / k, 60), x0 = 200 - k * u / 2;
    let s = "";
    for (let i = 0; i < k; i++) s += `<rect class="pop" style="animation-delay:${i * 70}ms" x="${r1(x0 + i * u)}" y="${r1(118 - u / 2)}" width="${r1(u)}" height="${r1(u)}" fill="${FILLS[i % 2]}" stroke="${BLUE}" stroke-width="3"/>` + (n > 9 && i === 7 ? text(x0 + i * u + u / 2, 118, "…", { size: 24 }) : "");
    s += `<rect x="${r1(x0)}" y="${r1(118 - u / 2)}" width="${r1(k * u)}" height="${r1(u)}" fill="none" stroke="${CORAL}" stroke-width="4" stroke-dasharray="8 5"/>`;
    if (side) s += text(x0 + u / 2, 118 - u / 2 - 16, side, { size: 15, fill: BLUE });
    return withChips(s, chips, 400, 230);
  }

  // ---- Sayı çizimleri ----
  function digitTilesFig(str, chips = []) {
    const groups = String(str).trim().split(" ");
    const digits = groups.join("").length, gapW = 14, w = Math.min(40, (370 - gapW * (groups.length - 1)) / digits);
    let x = 200 - (digits * w + gapW * (groups.length - 1)) / 2, s = "", k = 0;
    const tones = [["#d8e8ff", BLUE], ["#ccebe2", TEAL], ["#e3dcff", GRAPE], ["#ffd6e0", CORAL]];
    groups.forEach((g, gi) => {
      const [bg, fg] = tones[(groups.length - 1 - gi) % 4];
      g.split("").forEach((ch) => {
        s += `<rect class="pop" style="animation-delay:${k++ * 45}ms" x="${r1(x + 2)}" y="78" width="${r1(w - 4)}" height="74" rx="10" fill="${bg}" stroke="${fg}" stroke-width="3"/>` + text(x + w / 2, 116, ch, { size: Math.min(36, w * .95), fill: fg, halo: false, scale: true });
        x += w;
      });
      x += gapW;
    });
    return withChips(s + emoji(36, 36, "🧮", 30), chips, 400, 220);
  }
  function compareFig(a, b) {
    const card = (x, t, c) => `<g class="pop"><rect x="${x}" y="70" width="150" height="90" rx="16" fill="#fff" stroke="${c}" stroke-width="4"/>${text(x + 75, 116, t, { size: t.length > 7 ? 26 : 30, fill: c, halo: false })}</g>`;
    return wrap(card(20, a, BLUE) + card(230, b, CORAL) + `<circle class="pop" cx="200" cy="115" r="26" fill="${GOLD}"/>` + text(200, 116, "?", { size: 30, fill: "#fff", halo: false }), 400, 220);
  }
  function numberLineFig(lo, hi, chips = []) {
    let s = line(20, 130, 380, 130, { w: 4, cls: "draw" }) + arrowHead(386, 130, 0) + arrowHead(14, 130, 180);
    for (let i = 0; i <= 10; i++) s += line(50 + i * 30, 120, 50 + i * 30, 140, { w: i % 5 === 0 ? 4 : 2 });
    s += `<rect x="52" y="112" width="296" height="36" fill="${TEAL}22"/>`;
    s += dot(50, 130, 8, BLUE) + dot(350, 130, 8, CORAL) + text(50, 166, lo, { size: 15, fill: BLUE }) + text(350, 166, hi, { size: 15, fill: CORAL });
    s += `<g class="pop">${arrowHead(200, 110, -90, TEAL, 16)}${line(200, 64, 200, 96, { color: TEAL, w: 5 })}</g>` + text(200, 46, "N = ?", { size: 22, fill: TEAL });
    return withChips(s, chips, 400, 200);
  }
  function speechFig(words, chips = []) {
    const lines = [];
    let cur = "";
    for (const w of words.split(" ")) { if ((cur + " " + w).trim().length > 24) { lines.push(cur.trim()); cur = w; } else cur += " " + w; }
    lines.push(cur.trim());
    const L = lines.slice(0, 4), h = 40 + L.length * 26;
    let s = `<path class="pop" d="M110 ${120 - h / 2} h250 a16 16 0 0 1 16 16 v${h - 32} a16 16 0 0 1 -16 16 h-230 l-22 18 l4 -18 a16 16 0 0 1 -16 -16 v${-(h - 32)} a16 16 0 0 1 16 -16 z" fill="#fff" stroke="${GRAPE}" stroke-width="3"/>`;
    L.forEach((t, i) => { s += text(240, 120 - h / 2 + 32 + i * 26, "“" .repeat(i === 0 ? 1 : 0) + t + (i === L.length - 1 ? "”" : ""), { size: 16, fill: GRAPE, halo: false }); });
    return withChips(s + emoji(52, 160, "🦉", 56), chips, 400, 230);
  }
  function cardsFig(items, chips = []) {
    const k = items.length, w = Math.min(70, 340 / k - 10);
    let s = "";
    items.forEach((t, i) => {
      const x = 200 - (k * (w + 10) - 10) / 2 + i * (w + 10), c = COLORS[i % COLORS.length];
      s += `<g class="pop" style="animation-delay:${i * 80}ms"><rect x="${r1(x)}" y="70" width="${r1(w)}" height="90" rx="12" fill="#fff" stroke="${c}" stroke-width="4"/>${text(x + w / 2, 116, t, { size: Math.min(40, w * .8 / Math.max(1, String(t).length * .6)), fill: c, halo: false })}</g>`;
    });
    return withChips(s, chips, 400, 220);
  }
  function bolukFig(entries) {
    const k = entries.length, w = Math.min(92, 360 / k - 8);
    let s = "";
    entries.forEach((e, i) => {
      const x = 200 - (k * (w + 8) - 8) / 2 + i * (w + 8), c = [CORAL, GRAPE, TEAL, BLUE][4 - k + i] || BLUE;
      s += `<g class="pop" style="animation-delay:${i * 90}ms"><rect x="${r1(x)}" y="55" width="${r1(w)}" height="110" rx="14" fill="#fff" stroke="${c}" stroke-width="4"/><rect x="${r1(x)}" y="55" width="${r1(w)}" height="30" rx="14" fill="${c}"/>${text(x + w / 2, 71, e.name, { size: 12, fill: "#fff", halo: false })}${text(x + w / 2, 126, e.v, { size: isQ(e.v) ? 32 : 26, fill: isQ(e.v) ? TEAL : c, halo: false })}</g>`;
    });
    return wrap(s, 400, 210);
  }
  // İşlem kartları: 1 437 + ? = 2 400 gibi ifadeler.
  function exprFig(str) {
    const toks = str.match(/\d{1,3}(?: \d{3})+(?!\d)|\d+|\?|\b[A-Z]\b|[+−×÷=()<>]/g) || [];
    const ws = toks.map((t) => /[+−×÷=<>]/.test(t) ? 34 : t === "(" || t === ")" ? 16 : Math.max(46, [...t].length * 15 + 22));
    let fs = 26, total = ws.reduce((a, b) => a + b, 0) + 6 * (toks.length - 1);
    const k = total > 384 ? 384 / total : 1;
    let x = 200 - total * k / 2, s = "";
    toks.forEach((t, i) => {
      const w = ws[i] * k, cx = x + w / 2;
      if (/[+−×÷=<>]/.test(t)) s += `<circle class="pop" style="animation-delay:${i * 70}ms" cx="${r1(cx)}" cy="110" r="${r1(16 * k + 2)}" fill="${t === "=" ? INK : CORAL}"/>` + text(cx, 111, t, { size: fs * k, fill: "#fff", halo: false });
      else if (t === "(" || t === ")") s += text(cx, 108, t, { size: 40 * k, fill: "#999", halo: false });
      else { const c = t === "?" ? TEAL : /[A-Z]/.test(t) ? GRAPE : INK; s += `<g class="pop" style="animation-delay:${i * 70}ms"><rect x="${r1(x)}" y="${r1(110 - 32 * k)}" width="${r1(w)}" height="${r1(64 * k)}" rx="12" fill="${t === "?" ? "#e3f6ef" : /[A-Z]/.test(t) ? "#f0ecff" : "#fff"}" stroke="${c === INK ? BLUE : c}" stroke-width="3"/>${text(cx, 111, t, { size: fs * k, fill: c, halo: false })}</g>`; }
      x += w + 6 * k;
    });
    return wrap(s, 400, 220);
  }
  function columnFig(a, op, b) {
    const w = Math.max(a.replace(/ /g, "").length, b.replace(/ /g, "").length) + 1, cw = Math.min(34, 280 / w), right = 200 + w * cw / 2;
    const row = (t, y, color) => t.replace(/ /g, "").split("").reverse().map((ch, i) => text(right - (i + .5) * cw, y, ch, { size: cw * 1.05, fill: color, halo: false })).join("");
    let s = `<rect x="${r1(right - w * cw - 30)}" y="16" width="${r1(w * cw + 50)}" height="196" rx="14" fill="#fffef6" stroke="#e8dcb4" stroke-width="2"/>`;
    for (let i = 0; i < w; i++) s += line(right - i * cw, 30, right - i * cw, 200, { color: "#f0e6c8", w: 1 });
    s += row(a, 52, INK) + row(b, 102, BLUE) + text(right - w * cw - 6, 102, op, { size: 32, fill: CORAL, halo: false }) + line(right - w * cw - 18, 132, right + 8, 132, { w: 4, cls: "draw" }) + text(right - cw * 1.4, 170, "?", { size: 34, fill: TEAL, halo: false });
    return wrap(s, 400, 225);
  }
  // Türk usulü bölme şeması: bölünen | bölen, altında bölüm ve kalan.
  function divisionFig(dividend, divisor, quotient, remainder) {
    const v = (t) => t == null ? "" : String(t);
    let s = `<rect x="70" y="20" width="260" height="190" rx="16" fill="#fffef6" stroke="#e8dcb4" stroke-width="2"/>`;
    s += line(205, 40, 205, 150, { w: 4 }) + line(205, 90, 315, 90, { w: 4 });
    s += text(190, 66, v(dividend), { size: isQ(dividend) ? 32 : 28, fill: isQ(dividend) ? TEAL : INK, anchor: "end" }) + text(222, 66, v(divisor), { size: 28, fill: BLUE, anchor: "start" });
    if (quotient != null) s += text(222, 118, v(quotient), { size: isQ(quotient) ? 32 : 26, fill: isQ(quotient) ? TEAL : GRAPE, anchor: "start" });
    if (remainder != null) s += line(110, 150, 190, 150, { w: 2, color: "#999" }) + text(190, 178, v(remainder), { size: isQ(remainder) ? 32 : 24, fill: isQ(remainder) ? TEAL : CORAL, anchor: "end" });
    s += text(118, 196, remainder != null ? "kalan" : "", { size: 12, fill: "#999", halo: false });
    s += text(300, 38, "bölen", { size: 12, fill: "#999", halo: false }) + text(296, 140, quotient != null ? "bölüm" : "", { size: 12, fill: "#999", halo: false }) + text(105, 38, "bölünen", { size: 12, fill: "#999", halo: false });
    return wrap(s, 400, 225);
  }
  function arrayFig(rows, cols, chips = []) {
    const g = Math.min(300 / cols, 170 / rows, 34), r = g * .32, x0 = 200 - (cols - 1) * g / 2, y0 = 118 - (rows - 1) * g / 2;
    let s = "";
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) s += `<circle class="pop" style="animation-delay:${Math.min((i * cols + j) * 14, 800)}ms" cx="${r1(x0 + j * g)}" cy="${r1(y0 + i * g)}" r="${r1(r)}" fill="${i % 2 ? BLUE : CORAL}"/>`;
    return withChips(s, chips, 400, 236);
  }
  function groupsFig(groups, each, icon, chips = []) {
    const k = Math.min(groups, 6), more = groups > 6, slotW = 380 / (more ? k + 1 : k);
    let s = "";
    for (let i = 0; i < k; i++) {
      const cx = 10 + slotW * (i + .5), m = each ? Math.min(each, 9) : 0;
      if (!each) s += text(cx, 125, "?", { size: 30, fill: TEAL, halo: false });
      s += `<rect class="pop" style="animation-delay:${i * 90}ms" x="${r1(cx - slotW / 2 + 6)}" y="70" width="${r1(slotW - 12)}" height="110" rx="14" fill="${FILLS[i % FILLS.length]}" stroke="${COLORS[i % COLORS.length]}" stroke-width="3"/>`;
      for (let j = 0; j < m; j++) s += emoji(cx - slotW / 2 + 22 + (j % 3) * ((slotW - 32) / 3), 94 + Math.floor(j / 3) * 30, icon, Math.min(22, slotW / 4), i * 90 + j * 30);
    }
    if (more) s += text(10 + slotW * (k + .5), 125, "…", { size: 34 });
    return withChips(s, chips, 400, 230);
  }

  // ---- Genel pano: yalnız sözel sorular için ----
  const ICON = { nokta: "📍", aci: "📐", cember: "⭕", dikme: "📏", paralel: "🛤️", olcme: "🧭", durum: "✖️", cift: "🍕", cokgen: "🔷", ucgen: "🔺", insa: "✏️", okuma: "🔢", basamak: "🧮", sirala: "📊", islem: "➕", carpan: "✖️", problem: "🧩", cevre: "🧵", alan: "🟩", iliski: "📐" };
  const CTX = [[/öğrenci|kişi|çocuk/, "🧒"], [/kitap|kütüphane/, "📚"], [/sayfa/, "📖"], [/\bTL\b|para(?!lel)|bütçe|ücret|maliyet|fiyat|gelir|kazanç/i, "💰"], [/otobüs|araç/, "🚌"], [/kabin/, "🚡"], [/kasa|kutu|paket/, "📦"], [/meyve|elma/, "🍎"], [/çiftçi/, "👩‍🌾"], [/bahçe/, "🌳"], [/tel\b|tel /, "🧶"], [/çit/, "🪵"], [/halı/, "🟥"], [/oda|ev\b/, "🏠"], [/kapı/, "🚪"], [/robot/, "🤖"], [/köprü/, "🌉"], [/saat/, "🕒"], [/defter/, "📒"], [/kalem/, "✏️"], [/bilye/, "🔵"], [/puan|yarışma/, "⭐"], [/şişe|su\b/, "💧"], [/depo/, "🏭"], [/gün|hafta/, "📅"], [/mağaza|ürün|satı/, "🛍️"], [/km|yol/, "🛣️"], [/hesap/, "🏦"], [/kg|çuval/, "⚖️"], [/bilet|gezi/, "🎫"], [/şeker|kurabiye/, "🍪"], [/pist|koş/, "🏃"], [/açıölçer|ölçek/, "📐"], [/tahmin/, "🎯"], [/dönüş|dön/, "🔄"]];
  function board(topicId, p, q) {
    const lower = p.toLocaleLowerCase("tr");
    const icons = [];
    for (const [re, e] of CTX) if (re.test(re.flags.includes("i") ? p : lower) && !icons.includes(e)) icons.push(e);
    let s = `<circle class="pop" cx="82" cy="98" r="62" fill="#fff3d6" stroke="#f1d48b" stroke-width="3"/>` + emoji(82, 100, ICON[topicId] || "✨", 58);
    icons.slice(0, 3).forEach((e, i, arr) => { s += emoji(82 + (i - (arr.length - 1) / 2) * 42, 196, e, 32, 300 + i * 120); });
    const g = givens(p, 6);
    if (g.length) s += text(164, 26, "Verilenler", { size: 14, fill: "#a07a1f", anchor: "start", halo: false }) + chipLayout(g, 164, 392, 60, 16, 8, 40);
    const tf = q.scoringType === "true-false";
    const askY = g.length > 4 ? 204 : g.length ? 176 : 110;
    if (q.kind === "num") s += text(164, askY - 30, "İstenen", { size: 14, fill: TEAL, anchor: "start", halo: false }) + chipLayout([{ t: q.unit === "°" ? "?°" : ("? " + (q.unit || "")).trim(), color: TEAL, bg: "#e3f6ef" }], 164, 392, askY, 20);
    else if (tf) s += chipLayout([{ t: "✔ Doğru", color: TEAL, bg: "#e3f6ef" }, { t: "✘ Yanlış", color: CORAL, bg: "#ffece8" }], 170, 392, askY, 18);
    else s += chipLayout([{ t: "🤔 Hangisi?", color: GRAPE, bg: "#f0ecff" }], 170, 392, askY, 18);
    return wrap(s, 400, 236);
  }

  // ---- Konu bazlı çözümleyiciler: uygun desen yoksa null döner ----
  const F = {};
  const unitOf = (p) => /cm²/.test(p) ? " cm²" : /m²/.test(p) ? " m²" : / cm\b|cm\?/.test(p) ? " cm" : / km\b/.test(p) ? " km" : / m\b| m'| m\?/.test(p) ? " m" : "";

  F.nokta = (p) => {
    let m;
    if ((m = p.match(/Cetvelde (\w) ucu (\d+), (\w) ucu (\d+)/))) return rulerFig([{ l: m[1], v: +m[2] }, { l: m[3], v: +m[4] }]);
    const u = unitOf(p);
    const listM = p.match(/(?:^|\. )([A-Z](?:, [A-Z]){1,5})(?: bu sırada)? (?:aynı|bir|bu)/);
    let letters = listM ? listM[1].split(", ") : null;
    const given = [], mids = [], parts = [];
    for (const g of p.matchAll(/((?:[A-Z]{2} = )+)(\d+)/g)) g[1].match(/[A-Z]{2}/g).forEach((pr) => given.push({ a: pr[0], b: pr[1], label: g[2] + u }));
    for (const g of p.matchAll(/([A-Z]{2}), ([A-Z]{2})'n[iı]n (\d+) katı/g)) given.push({ a: g[1][0], b: g[1][1], label: `${g[3]} × ${g[2]}` });
    for (const g of p.matchAll(/([A-Z]{2})'n[iı]n orta noktası ([A-Z])/g)) mids.push({ a: g[1][0], b: g[1][1], m: g[2] });
    for (const g of p.matchAll(/([A-Z]), ([A-Z]{2})'n[iı]n orta noktası/g)) mids.push({ a: g[2][0], b: g[2][1], m: g[1] });
    if ((m = p.match(/([A-Z]) orta nokta/)) && letters) { const i = letters.indexOf(m[1]); if (i > 0 && i < letters.length - 1) mids.push({ a: letters[i - 1], b: letters[i + 1], m: m[1] }); }
    for (const g of p.matchAll(/([A-Z]{2}) (\S+) eş parçaya/g)) parts.push({ a: g[1][0], b: g[1][1], k: WORD_NUM[g[2]] || +g[2] || 3 });
    if (!letters && mids.length) letters = [mids[0].a, mids[0].m, mids[0].b];
    if (letters) {
      const last = p.split(/\. /).pop();
      const known = new Set(given.map((g) => g.a + g.b));
      const ask = (last.match(/[A-Z]{2}(?![a-z])/g) || []).find((t) => !known.has(t) && !known.has(t[1] + t[0]));
      return segmentFig(letters, given, ask ? { a: ask[0], b: ask[1] } : null, { mids, parts });
    }
    if ((m = p.match(/(\d+) eş parçaya/))) { const t = p.match(/Uzunluğu (\d+) (cm|m)/); return dividedFig(+m[1], t ? `${t[1]} ${t[2]}` : ""); }
    if ((m = p.match(/(\d+) farklı nokta|(\d+) nokta/))) return dotsLineFig(+(m[1] || m[2]));
    if (/İki farklı nokta/.test(p)) return dotsLineFig(2, { noLine: true });
    if (/\[AB\]|A'dan B/.test(p)) return segmentFig(["A", "B"], [], null);
    if (/Noktalar/.test(p)) return dotsLineFig(3, { noLine: true });
    return null;
  };

  function angleWords(p) {
    const d = degs(p);
    let m;
    if ((m = p.match(/∠([A-Z])([A-Z])([A-Z])/))) return angleFig(50, "", { letters: [m[1], m[2], m[3]] });
    if (/kapı/i.test(p) && !/ulaşmak/.test(p)) { const k = p.match(/kapı (\d+)° açık/); return withChips(unwrap(addTo(angleFig(k ? +k[1] : 50, k ? k[1] + "°" : "?", { cx: 130 }), emoji(330, 60, "🚪", 46))), k ? givens(p.replace(k[0], ""), 3) : givens(p, 4), 400, 230); }
    if ((m = p.match(/(?:iç ölçek|İç ölçek) (\d+)°, dış ölçek (\d+)°/))) return protractorFig(+m[1]);
    if (/[Aa]çıölçer|ölçek/.test(p) && d.length) return protractorFig(clamp(d[0], 10, 170), givens(p, 4));
    if ((m = p.match(/(?:doğru açı|Doğru açı) (\d+) eş/))) return splitAngle(180, Array.from({ length: +m[1] }, () => ({ t: "?" })));
    if ((m = p.match(/(?:tam açı|tam dönüş|Tam dönüş) (\d+) eş/))) return splitAngle(360, Array.from({ length: +m[1] }, () => ({ t: "?" })));
    if ((m = p.match(/(?:dik açı|Dik açı) (\d+) eş/))) return splitAngle(90, Array.from({ length: +m[1] }, () => ({ t: "?" })));
    if ((m = p.match(/[Dd]ik açıya komşu üç parça[^.]*?(\d+)° ve (\d+)°/))) return splitAngle(90, [{ v: +m[1], t: m[1] + "°" }, { v: +m[2], t: m[2] + "°" }, { t: "?" }]);
    if ((m = p.match(/doğru açı[^.]*?(?:parçaya ayrılıyor: |parça)(?:[^0-9]*)(\d+)°(?:'lik)?(?:,| ve) (\d+)°/i))) return splitAngle(180, [{ v: +m[1], t: m[1] + "°" }, { v: +m[2], t: m[2] + "°" }, { t: "?" }]);
    if ((m = p.match(/[Dd]oğru açı (\d+)° ve (\d+)°'lik/))) return splitAngle(180, [{ v: +m[1], t: m[1] + "°" }, { v: +m[2], t: m[2] + "°" }, { t: "?" }]);
    if ((m = p.match(/doğru açı oluşturan art arda üç küçük açı (\d+)°, (\d+)°/))) return splitAngle(180, [{ v: +m[1], t: m[1] + "°" }, { v: +m[2], t: m[2] + "°" }, { t: "?" }]);
    if ((m = p.match(/doğru açı, küçük açı ve ondan (\d+)° büyük/i))) return splitAngle(180, [{ v: 70, t: "x" }, { v: 110, t: `x + ${m[1]}°` }]);
    if ((m = p.match(/doğru açı üç parçaya ayrılıyor\. İkinci birinciden (\d+)°/i))) return splitAngle(180, [{ v: 40, t: "x" }, { v: 60, t: `x+${m[1]}` }, { v: 80, t: `x+${2 * m[1]}` }]);
    if ((m = p.match(/[Dd]ik açıya ulaşmak için (\d+)°/))) return splitAngle(90, [{ v: +m[1], t: m[1] + "°" }, { t: "?" }]);
    if ((m = p.match(/[Dd]oğru açıya ulaşmak için (\d+)°/))) return splitAngle(180, [{ t: "?" }, { v: +m[1], t: m[1] + "°" }]);
    if ((m = p.match(/(\d+)°(?:'[a-zı]+)? artırıldığında 90°/))) return splitAngle(90, [{ t: "?" }, { v: +m[1], t: m[1] + "°" }]);
    if ((m = p.match(/(\d+)°'(?:nin|nın|in|ın|un|ün) (tümleri|bütünleri)/))) return splitAngle(m[2] === "tümleri" ? 90 : 180, [{ v: +m[1], t: m[1] + "°" }, { t: "?" }]);
    if ((m = p.match(/^Bir açının (tümleri|bütünleri) (\d+)°\./))) return splitAngle(m[1] === "tümleri" ? 90 : 180, [{ t: "?" }, { v: +m[2], t: m[2] + "°" }]);
    if ((m = p.match(/(Tümler|Bütünler) (?:açılardan|iki açıdan) biri (\d+)°/))) return splitAngle(m[1] === "Tümler" ? 90 : 180, [{ v: +m[2], t: m[2] + "°" }, { t: "?" }]);
    if ((m = p.match(/Eş iki (tümler|bütünler)/))) return splitAngle(m[1] === "tümler" ? 90 : 180, [{ t: "?" }, { t: "?" }]);
    if ((m = p.match(/(Tümler|Bütünler) iki açı arasındaki fark (\d+)°/))) return splitAngle(m[1] === "Tümler" ? 90 : 180, [{ v: 30, t: "x" }, { v: m[1] === "Tümler" ? 60 : 150, t: `x + ${m[2]}°` }]);
    if ((m = p.match(/[Tt]ers (?:iki )?açı(?:dan|lardan) biri (\d+)°/))) return crossFig(+m[1], [m[1] + "°", "", "?", ""]);
    if ((m = p.match(/bir açısı (\d+)°\. (Ters|Komşu)/))) return crossFig(+m[1], m[2] === "Ters" ? [m[1] + "°", "", "?", ""] : [m[1] + "°", "?", "", ""]);
    if ((m = p.match(/dar açısı (\d+)°\. İki geniş/))) return crossFig(+m[1], [m[1] + "°", "?", "", "?"]);
    if ((m = p.match(/Ölçü (\d+)° iken (\d+)° daha/))) return adjacentFig([{ v: +m[1], t: m[1] + "°" }, { v: +m[2], t: m[2] + "°" }], "?");
    if ((m = p.match(/[Bb]ir açı (\d+)° iken (\d+)° açılıyor/))) return adjacentFig([{ v: +m[1], t: m[1] + "°" }, { v: +m[2], t: m[2] + "°" }], "?");
    if ((m = p.match(/(\d+) kez (\d+)° döndü/))) { const k = +m[1], a = +m[2]; return k * a < 360 ? splitAngle(360, [...Array.from({ length: Math.min(k, 8) }, () => ({ v: a, t: a + "°" })), { t: "?" }]) : null; }
    if (/saat kadranı/.test(p)) { m = p.match(/(\d+) saat aralığı/); return clockFig(m ? +m[1] : 1); }
    if (/[Yy]arım dönüş/.test(p)) return splitAngle(180, [{ t: "?" }]);
    if (/[Tt]am dönüş kaç|[Bb]ir tam dönüş kaç/.test(p)) return splitAngle(360, [{ t: "?" }]);
    if (/[Bb]ir dik açı kaç|dikmenin doğruyla oluşturduğu açı/.test(p)) return angleFig(90, "?");
    if ((m = p.match(/[Bb]ir açı diğerinin (\d+) katı\. Küçük açı (\d+)°/))) return twoAnglesFig([[+m[2], m[2] + "°"], [clamp(+m[2] * +m[1], 20, 170), "?"]]);
    return null;
  }
  function protractorFig(deg, chips = []) {
    const cx = 200, cy = 200, R = 165;
    let s = `<path d="M${cx - R} ${cy} A${R} ${R} 0 0 1 ${cx + R} ${cy} Z" fill="#fff8e6" stroke="#d9b75a" stroke-width="3"/>`;
    for (let g = 0; g <= 180; g += 10) {
      const big = g % 30 === 0, [x1, y1] = P(cx, cy, g, R), [x2, y2] = P(cx, cy, g, R - (big ? 18 : 10));
      s += line(x1, y1, x2, y2, { color: "#8a6d1e", w: big ? 2.5 : 1.2 });
      if (big && g % 180) { const [ix, iy] = P(cx, cy, g, R - 34), [ox, oy] = P(cx, cy, g, R - 56); s += text(ix, iy, g, { size: 12, fill: INK, halo: false, scale: true }) + text(ox, oy, 180 - g, { size: 11, fill: CORAL, halo: false, scale: true }); }
    }
    s += line(cx - R, cy, cx + R, cy, { w: 3 }) + ray(cx, cy, 0, R + 4, INK, 5) + ray(cx, cy, deg, R + 4, CORAL, 5) + sector(cx, cy, 30, 0, deg, "#e25b4544") + dot(cx, cy, 6, INK);
    return withChips(s, chips, 400, 215);
  }
  function clockFig(hours) {
    const cx = 200, cy = 118, R = 98;
    let s = `<circle class="pop" cx="${cx}" cy="${cy}" r="${R}" fill="#fff" stroke="${INK}" stroke-width="5"/>`;
    s += sector(cx, cy, 70, 90 - hours * 30, 90, "#ffdcb0");
    for (let h = 1; h <= 12; h++) { const [x1, y1] = P(cx, cy, 90 - h * 30, R - 4), [x2, y2] = P(cx, cy, 90 - h * 30, R - 16), [tx, ty] = P(cx, cy, 90 - h * 30, R - 30); s += line(x1, y1, x2, y2, { w: 3 }) + text(tx, ty, h, { size: 14, halo: false, scale: true }); }
    s += ray(cx, cy, 90, 72, INK, 6) + ray(cx, cy, 90 - hours * 30, 60, CORAL, 6) + dot(cx, cy, 7, INK);
    const [lx, ly] = P(cx, cy, 90 - hours * 15, 46);
    return wrap(s + label(lx, ly, "?", { size: 22 }), 400, 236);
  }
  function twoAnglesFig(list) {
    let s = "";
    list.forEach(([d, t], i) => {
      const cx = 40 + i * 190, cy = 190, a = clamp(d, 12, 170);
      s += sector(cx, cy, 50, 0, a, FILLS[i]) + ray(cx, cy, 0, 150, INK, 4) + ray(cx, cy, a, 130, COLORS[i], 4) + dot(cx, cy, 6, INK);
      const [lx, ly] = P(cx, cy, a / 2, 76); s += label(lx, ly, t);
    });
    return wrap(s, 400, 220);
  }
  F.aci = (p, q) => angleWords(p) || (q.kind === "mc" ? angleFig(55, "") : null);
  F.olcme = (p) => angleWords(p);
  F.cift = (p) => {
    const r = angleWords(p);
    if (r) return r;
    const d = degs(p), tum = /tümle/i.test(p), but = /bütünle/i.test(p);
    if (tum && !but) return withChipsFromAngle(90, p);
    if (but && !tum) return withChipsFromAngle(180, p);
    if (tum && but) return twoTotalsFig(p);
    if (/ters açı/.test(p)) return crossFig(d[0] || 50, [d[0] ? d[0] + "°" : "?", "", "?", ""]);
    return null;
  };
  function withChipsFromAngle(total, p) {
    return withChips(unwrap(splitAngle(total, [{ t: "?" }, { t: "?" }])), givens(p, 4), 400, total === 90 ? 240 : 225);
  }
  function twoTotalsFig(p) {
    let s = "";
    [[90, 110, 200], [180, 290, 200]].forEach(([T, cx, cy], i) => {
      const R = 85;
      s += sector(cx, cy, 60, 0, T * .4, FILLS[0]) + sector(cx, cy, 60, T * .4, T, FILLS[1 + i]);
      s += (T === 90 ? ray(cx, cy, 0, R + 10, INK, 4) + ray(cx, cy, 90, R + 10, INK, 4) + rightMark(cx, cy, 0, 14) : line(cx - R - 10, cy, cx + R + 10, cy, { w: 4 })) + ray(cx, cy, T * .4, R, CORAL, 4) + dot(cx, cy, 6, INK);
      const [ax, ay] = P(cx, cy, T * .2, 42), [bx, by] = P(cx, cy, T * .7, 42);
      s += text(ax, ay, "x", { size: 16 }) + text(bx, by, "?", { size: 20, fill: TEAL }) + text(cx, cy + 22, T === 90 ? "tümler" : "bütünler", { size: 13, fill: "#777", halo: false });
    });
    return withChips(s, givens(p, 4), 400, 230);
  }

  F.durum = (p) => {
    const r = angleWords(p);
    if (r) return r;
    let m;
    const d = degs(p);
    if ((m = p.match(/(\d+) yatay ve (\d+) düşey/))) return gridLinesFig(+m[1], +m[2]);
    if ((m = p.match(/(\d+) farklı doğru çiziliyor/))) return linesFig(+m[1]);
    if (/[Üü]ç farklı doğru tek noktada/.test(p)) return concurrentFig(3, d.length ? [d[0] + "°", d[1] ? d[1] + "°" : "?", "?"] : []);
    if (/paralel/.test(p) && /kesen/.test(p)) return withChips(unwrap(transversalFig(/dik/.test(p) && !/dik olmayan/.test(p))), d.length ? givens(p, 3) : [], 400, 240);
    if (/[İi]ki dik doğru/.test(p)) return crossFig(90, ["90°", "", "", ""]);
    if (/[Kk]esiş/.test(p)) return withChips(unwrap(crossFig(55, ["", "", "", ""])), givens(p, 3), 400, 236);
    return null;
  };

  F.dikme = (p) => {
    let m;
    const g = givens(p, 4);
    if ((m = p.match(/dik uzaklığı (\d+) (cm|m), eğik yol (\d+)/))) return perpFig(`${m[1]} ${m[2]}`, `${m[3]} ${m[2]}`);
    if (/köprü/.test(p)) return bridgeFig("", g);
    if ((m = p.match(/direğin zemine dik yüksekliği (\d+) m\. Aynı uzunlukta (\d+) direk/))) return poleFig(m[1] + " m", +m[2]);
    if (/direk/.test(p)) return poleFig("", 1, g);
    if (/P noktası iki paralel/.test(p)) return parallelsFig(2, ["?"], g);
    if ((m = p.match(/(\d+) paralel doğru/))) return parallelsFig(+m[1], [], g);
    if ((m = p.match(/(\d+) farklı noktada dik kesen/))) return perpManyFig(+m[1]);
    if (/aynı doğruya dik iki farklı doğru/.test(p)) return perpManyFig(2);
    if (/düzlem/.test(p)) return planeFig();
    if (/[Dd]iklik işareti|[Dd]ik çizim/.test(p)) return addTo(perpFig("", "", []), emoji(335, 45, "📐", 40));
    if (/dışındaki bir noktadan/.test(p)) return perpFig("?", "", []);
    if ((m = p.match(/dik uzaklık(?:ı)? (\d+) (cm|m)/i))) return perpFig(`${m[1]} ${m[2]}`, "", g.filter((t) => !t.startsWith(m[1] + " ")));
    if (/[Dd]ik/.test(p)) return perpFig("", "", g);
    return null;
  };
  function perpManyFig(n) {
    const k = clamp(n, 1, 6);
    let s = line(20, 120, 380, 120, { color: BLUE, w: 5, cls: "draw" });
    for (let i = 0; i < k; i++) { const x = 200 + (i - (k - 1) / 2) * (300 / Math.max(k, 2)); s += line(x, 20, x, 220, { color: CORAL, w: 4, cls: "draw" }) + rightMark(x, 120, 0, 14) + dot(x, 120, 6, INK); }
    return wrap(s, 400, 240);
  }
  function planeFig() {
    return wrap(`<polygon class="pop" points="80,170 140,60 340,60 280,170" fill="#d8e8ff" stroke="${BLUE}" stroke-width="4"/>` + text(300, 150, "düzlem", { size: 16, fill: BLUE }) + emoji(110, 40, "📄", 30) + emoji(330, 200, "🪟", 30), 400, 230);
  }

  F.paralel = (p) => {
    let m;
    const g = givens(p, 4);
    if ((m = p.match(/(\d+) yatay(?: ve|,) (\d+) düşey/))) return gridLinesFig(+m[1], +m[2]);
    if ((m = p.match(/ardışık uzaklıkları (\d+) ve (\d+) cm/))) return parallelsFig(3, [m[1] + " cm", m[2] + " cm"]);
    if ((m = p.match(/(\d+) paralel çizgi arasında ardışık çizgilerin dik uzaklığı (\d+) cm/))) return parallelsFig(+m[1], Array.from({ length: +m[1] - 1 }, () => m[2] + " cm"));
    if ((m = p.match(/(\d+) eş aralık/))) return parallelsFig(+m[1] + 1, Array.from({ length: +m[1] }, () => "?"), g);
    if (/kesen/.test(p)) return transversalFig(/dik/.test(p), (m = p.match(/(\d+|[Üü]ç) doğru/)) && (m[1] === "3" || /üç/i.test(m[1])) ? 3 : 2);
    if ((m = p.match(/(\d+) (?:farklı )?(?:paralel |)(?:doğru|çizgi)/)) && /paralel/.test(p) && +m[1] > 1) return parallelsFig(+m[1], [], g.filter((t) => !t.startsWith(m[1] + " ")));
    if (/[Tt]ren ray/.test(p)) return wrap(`<line x1="20" y1="80" x2="380" y2="80" stroke="#5c6b7a" stroke-width="8"/><line x1="20" y1="160" x2="380" y2="160" stroke="#5c6b7a" stroke-width="8"/>${[50, 110, 170, 230, 290, 350].map((x) => `<rect class="pop" x="${x - 9}" y="66" width="18" height="108" rx="3" fill="#c47b4a"/>`).join("")}<line x1="20" y1="80" x2="380" y2="80" stroke="#5c6b7a" stroke-width="8"/><line x1="20" y1="160" x2="380" y2="160" stroke="#5c6b7a" stroke-width="8"/>` + emoji(200, 214, "🚆", 34), 400, 236);
    if (/[Dd]ikdörtgen/.test(p)) return rectFig(5, 3, { stroke: GRAPE });
    if (/işaret/.test(p)) return parallelsFig(2, []);
    if (/[Bb]ir noktadan geçen|[Bb]ir doğruya dışındaki bir noktadan/.test(p)) return pencilFig(/dışındaki/.test(p));
    if (/[İi]ki farklı noktadan/.test(p)) return dotsLineFig(2, { noLine: true });
    if (/paralel/i.test(p)) return parallelsFig(2, [], g);
    return null;
  };
  function pencilFig(withLine) {
    let s = "";
    const cx = 200, cy = withLine ? 70 : 120;
    if (withLine) s += line(20, 190, 380, 190, { color: BLUE, w: 5 }) + line(20, cy, 380, cy, { color: TEAL, w: 4, dash: "10 7" }) + text(370, cy - 16, "?", { size: 22, fill: TEAL });
    else for (let i = 0; i < 8; i++) { const a = P(cx, cy, i * 22.5, 150), b = P(cx, cy, i * 22.5 + 180, 150); s += line(a[0], a[1], b[0], b[1], { color: COLORS[i % COLORS.length], w: 3, cls: "draw" }); }
    return wrap(s + dot(cx, cy, 8, INK) + text(cx + 18, cy - 18, "P", { size: 18 }), 400, 240);
  }

  F.cember = (p) => {
    let m;
    const u = unitOf(p).trim() || "cm";
    const g = givens(p, 4);
    if ((m = p.match(/Aynı merkezli (?:çemberlerin|iki çemberin) yarıçapları (\d+) ve (\d+)/))) return concentricFig(`r = ${m[1]}`, `r = ${m[2]}`, /arasındaki uzaklık/.test(p));
    if (/[Aa]ynı merkezli/.test(p)) return concentricFig("", "", false, g);
    if ((m = p.match(/Üç çemberin yarıçapları sırayla (\d+), (\d+), (\d+)/))) return circlesFig([1, 2, 3].map((i) => ({ v: +m[i], t: `r = ${m[i]}` })));
    if ((m = p.match(/[İi]ki çemberin yarıçapları (\d+) ve (\d+)/))) return circlesFig([{ v: +m[1], t: `r = ${m[1]} ${u}` }, { v: +m[2], t: `r = ${m[2]} ${u}` }]);
    if (/[İi]ki çember/.test(p)) return circlesFig([{ v: 3, t: "1. çember" }, { v: 4, t: "2. çember" }], g);
    if ((m = p.match(/^Yarıçapı (\d+) (cm|m) olan çemberin çapı/))) return circleFig({ r: `${m[1]} ${m[2]}`, d: "?" });
    if ((m = p.match(/^Çapı (\d+) (cm|m) olan çemberin yarıçapı/))) return circleFig({ d: `${m[1]} ${m[2]}`, r: "?" });
    if (/AB çapı/.test(p)) return circleFig({ d: (m = p.match(/AB çapı (\d+) cm/)) ? m[1] + " cm" : "", letters: true });
    if (/[Pp]ergel/.test(p)) return circleFig({ r: (m = p.match(/[Pp]ergel açıklığı (\d+) (cm|m)/)) ? `${m[1]} ${m[2]}` : "r", compass: true, chips: g.slice(1) });
    if (/[Dd]aire/.test(p)) return wrap(`<circle class="draw" cx="110" cy="105" r="70" fill="none" stroke="${BLUE}" stroke-width="8"/><circle class="pop" cx="290" cy="105" r="70" fill="${BLUE}"/>` + text(200, 105, "?", { size: 30, fill: TEAL }), 400, 210);
    if (/[Mm]erkez/.test(p) && !/[Yy]arıçap|[Çç]ap/.test(p)) return addTo(circleFig({}), text(222, 104, "O", { size: 18 }));
    if (/[Yy]arıçap/.test(p) && /[Çç]ap/.test(p)) return circleFig({ r: "r", d: "çap", chips: g });
    if (/[Yy]arıçap/.test(p)) return circleFig({ r: "r", chips: g });
    if (/[Çç]ap/.test(p)) return circleFig({ d: "çap", chips: g });
    return circleFig({ chips: g });
  };

  F.insa = (p) => {
    let m;
    const n = (re) => { const x = p.match(re); return x ? +x[1] : null; };
    let ra = null, rb = null, d = n(/[Mm]erkezler aras[ıi](?: uzaklık)? (\d+)/);
    if ((m = p.match(/[Yy]arıçap(?:lar[ıi]?)? (\d+)(?: cm)?(?:,| ve) (\d+) cm/))) { ra = +m[1]; rb = +m[2]; }
    else if ((m = p.match(/yarıçapları (\d+) cm|[Yy]arıçapları (\d+) cm|yarıçapı (\d+) cm/))) { ra = rb = +(m[1] || m[2] || m[3]); }
    if ((m = p.match(/AB = (\d+) cm/))) d = +m[1];
    if ((m = p.match(/tabanı (\d+) cm/))) d = +m[1];
    const eq = /eşkenar/i.test(p);
    if (ra || d) {
      const lab = (v) => v ? v + " cm" : "";
      return constructFig(ra, rb, d, { a: lab(ra), b: lab(rb), d: lab(d), chips: ra && d ? [] : givens(p, 3) });
    }
    if (eq) return constructFig(4, 4, 4, { chips: givens(p, 3) });
    if (/çember/i.test(p)) return constructFig(4, 5, 6, { chips: givens(p, 4) });
    if (/[Pp]ergel|araç/.test(p)) return wrap(emoji(130, 115, "✏️", 80) + emoji(270, 115, "📏", 80) + text(200, 118, "+", { size: 40, fill: CORAL }), 400, 230);
    return null;
  };

  const POLY_WORD = { "üçgen": 3, "dörtgen": 4, "beşgen": 5, "altıgen": 6, "yedigen": 7, "sekizgen": 8, "kare": 4 };
  F.cokgen = (p) => {
    let m;
    const g = givens(p, 4);
    const ns = [];
    for (const x of p.matchAll(/(\d+)gen|(\d+) köşeli|(üçgen|dörtgen|beşgen|altıgen|yedigen|sekizgen|kare)(?!ler)/gi)) ns.push(+(x[1] || x[2]) || POLY_WORD[x[3].toLocaleLowerCase("tr")]);
    const side = (m = p.match(/[Kk]enarları (\d+) cm|her kenarı (\d+) cm|[Kk]enarları (\d+) cm olan/)) ? (m[1] || m[2] || m[3]) + " cm" : "";
    if ((m = p.match(/(\d+) ayrı (beşgen|altıgen|dörtgen|üçgen)/))) return multiPolyFig(Array.from({ length: Math.min(+m[1], 4) }, () => ({ n: POLY_WORD[m[2]] })), [{ t: `${m[1]} ${m[2]}`, color: GRAPE }]);
    if ((m = p.match(/iç açısı (\d+)°/))) return polyFig(5, { angle: m[1] + "°" });
    const uniq = [...new Set(ns)];
    if (uniq.length >= 2) return multiPolyFig(uniq.slice(0, 3).map((n) => ({ n, t: n + " kenar" })), g.filter((t) => !/gen$/.test(t)));
    if (uniq.length === 1) return polyFig(uniq[0], { side, chips: g.filter((t) => !/gen$/.test(t) && !/köşeli/.test(t) && t !== side) });
    if (/çokgen/i.test(p)) return multiPolyFig([{ n: 3 }, { n: 5 }, { n: 6 }], g);
    return null;
  };

  F.ucgen = (p) => {
    let m;
    const d = degs(p);
    const ext = /dış açı/.test(p);
    if ((m = p.match(/[Aa]çıları (\d+)°, (\d+)° ve (\d+)°/))) return triFig(+m[1], +m[2], [m[1] + "°", m[2] + "°", m[3] + "°"]);
    if ((m = p.match(/[Dd]ik üçgende bir dar açı (\d+)°/))) return triFig(90, +m[1], ["", m[1] + "°", "?"], { right: 0 });
    if ((m = p.match(/(?:iki (?:iç )?açısı|iki açı) (\d+)° ve (\d+)°/))) return triFig(+m[1], +m[2], [m[1] + "°", m[2] + "°", ext ? "" : "?"], { ext: ext ? "?" : null });
    if ((m = p.match(/[Ii]kizkenar üçgenin tepe açısı (\d+)°/))) { const b = (180 - +m[1]) / 2; return triFig(b, b, ["?", "?", m[1] + "°"], { ticks: true }); }
    if ((m = p.match(/[Ii]kizkenar üçgenin taban açılarından biri (\d+)°/))) return triFig(+m[1], +m[1], [m[1] + "°", "", "?"], { ticks: true });
    if (/[Ii]kizkenar/.test(p) && /[Dd]ik açılı/.test(p)) return triFig(90, 45, ["", "?", ""], { right: 0, ticks: false });
    if (/[Ii]kizkenar/.test(p)) return triFig(55, 55, [], { ticks: true, ext: ext ? "?" : null, chips: givens(p, 4) });
    if ((m = p.match(/[Ee]şkenar üçgenin bir kenarı (\d+) (cm|m)/))) return triFig(60, 60, [], { sides: [`${m[1]} ${m[2]}`, `${m[1]} ${m[2]}`, `${m[1]} ${m[2]}`] });
    if ((m = p.match(/[Ee]şkenar üçgenin çevresi (\d+) (cm|m)/))) return triFig(60, 60, [], { sides: ["?", "?", "?"], chips: [{ t: `Çevre = ${m[1]} ${m[2]}`, color: GOLD }] });
    if (/[Ee]şkenar/.test(p)) return triFig(60, 60, ["?", "?", "?"]);
    if ((m = p.match(/[Kk]enarları (\d+), (\d+)(?:,| ve) (\d+) (cm|m)/))) return triFig(48, 62, [], { sides: [`${m[1]} ${m[4]}`, `${m[2]} ${m[4]}`, `${m[3]} ${m[4]}`] });
    if ((m = p.match(/bir iç açısı (\d+)°/))) return triFig(60, +m[1], ["", m[1] + "°", ""], { ext: ext ? "?" : null });
    if (/iç açıları toplamı|iç açılarının toplamı/.test(p)) return triFig(55, 65, ["?", "?", "?"]);
    if (/dik açı/.test(p)) return triFig(90, 60, ["90°", "?", ""], { right: 0 });
    if (d.length || /üçgen/i.test(p)) return triFig(50, 65, ["", "", ""], { chips: givens(p, 4), ext: ext ? "" : null });
    return null;
  };

  F.okuma = (p, q) => {
    let m;
    if (q.kind === "slots") return null;
    if ((m = p.match(/"([^"]+)"/))) return speechFig(m[1], givens(p.replace(m[0], ""), 3));
    const names = ["Milyarlar", "Milyonlar", "Binler", "Birler"];
    if (/bölüğü/.test(p)) {
      const val = (nm) => { const x = p.match(new RegExp(nm + " bölüğü (\\d+)", "i")); return x ? x[1] : null; };
      const vals = names.map((nm) => val(nm));
      if (vals.some((v) => v != null)) {
        const first = vals.findIndex((v) => v != null);
        return bolukFig(names.slice(first).map((nm, i) => ({ name: nm.toLocaleUpperCase("tr"), v: vals[first + i] != null ? vals[first + i] : "?" })));
      }
    }
    if ((m = p.match(/[Ee]n (?:küçük|büyük) (\d+) basamaklı/))) return cardsFig(Array.from({ length: +m[1] }, () => "?"));
    if ((m = p.match(/^(\d+) bin (\d+)(?: yüz)? sayısını/))) return speechFig(m[0].replace(/ sayısını$/, ""));
    const big = (p.match(/\d{1,3}(?: \d{3})+(?!\d)|\d{4,}/g) || [])[0];
    if (big) return digitTilesFig(fmt(toN(big)), givens(p.replace(big, ""), 3));
    return null;
  };
  F.basamak = (p, q) => {
    let m;
    if ((m = p.match(/^([\d ]+) = ([\d ]+ \+ )+\?/))) return exprFig(p.split(".")[0].replace(/ Eksiği bul/, ""));
    if (/× 1 000 \+|× 100 \+/.test(p)) return exprFig(p.replace(/ hangi sayıdır\?/, " = ?"));
    if ((m = p.match(/(\d) rakamının/))) return cardsFig([m[1]], givens(p.replace(m[0], ""), 2));
    if ((m = p.match(/^(\d)'in/))) return cardsFig([m[1]]);
    if ((m = p.match(/(\d+) milyon (\d+) yüz bin (\d+) bin (\d+) birim/))) return cardsFig([`${m[1]} milyon`, `${m[2]} yüz bin`, `${m[3]} bin`, `${m[4]}`]);
    return F.okuma(p, q);
  };
  F.sirala = (p, q) => {
    let m;
    if ((m = p.match(/^([\d ]+?) ile ([\d ]+?) arasına hangi işaret/))) return compareFig(m[1].trim(), m[2].trim());
    if ((m = p.match(/([\d ]+?) < N < ([\d ]+?)(?: |\.|$)/))) return numberLineFig(m[1].trim(), m[2].trim());
    if ((m = p.match(/([\d ]+?)'?(?:den|dan) büyük, ([\d ]+?)'?(?:den|dan) küçük/))) return numberLineFig(m[1].trim(), m[2].trim());
    if ((m = p.match(/^([\d ]+?) ile ([\d ]+?) arasında/))) return numberLineFig(m[1].trim(), m[2].trim());
    if ((m = p.match(/^([\d, ]+?) rakamlarının/))) return cardsFig(m[1].split(", "));
    if ((m = p.match(/^(\d+(?:, \d+){2,})/))) return cardsFig(m[1].split(", ").map((x) => x.trim()));
    if ((m = p.match(/([\d ]{4,}?)'?[ae] ([\d ]{4,}?) mı, ([\d ]{4,}?) mi/))) return numberLineFig(m[2].trim(), m[3].trim(), [{ t: `hedef ${m[1].trim()}`, color: GRAPE }]);
    if (/[<>]/.test(p)) return exprFig(p.split(/ eşitsizliğini|\. /)[0]);
    if (q.kind === "mc" && q.choices && q.choices.every((c) => /^[\d ]+$/.test(c))) return null;
    const ns = p.match(/\d{1,3}(?: \d{3})+(?!\d)|\d{4,}/g);
    if (ns && ns.length >= 2) return compareFig(fmt(toN(ns[0])), fmt(toN(ns[1])));
    if (ns) return digitTilesFig(fmt(toN(ns[0])));
    return null;
  };
  function equation(p) {
    const head = p.split(/\. | işleminin| işleminde/)[0].replace(/\?$/, (q, i, str) => /=\s?\?$/.test(str) ? "?" : "");
    let m;
    if ((m = head.match(/^([\d ]+) ([+−×]) ([\d ]+) = \?$/)) && !/\(/.test(head)) return m[2] === "×" && toN(m[1]) <= 12 && toN(m[3]) <= 14 ? arrayFig(toN(m[1]), toN(m[3]), [{ t: `${m[1]} sıra × ${m[3]}`, color: CORAL }]) : columnFig(m[1], m[2], m[3]);
    if ((m = head.match(/^([\d ]+) ÷ ([\d ]+) = \?$/))) return divisionFig(m[1].trim(), m[2].trim(), "?", null);
    if ((m = head.match(/^([\d ]+) ÷ ([\d ]+)$/)) && /kalan/.test(p)) return divisionFig(m[1].trim(), m[2].trim(), null, "?");
    if ((m = head.match(/^\? ÷ ([\d ]+) = ([\d ]+)$/))) return divisionFig("?", m[1].trim(), m[2].trim(), null);
    if (/=/.test(head) && /^[\d ?()+−×÷=]+$/.test(head)) return exprFig(head);
    return null;
  }
  F.islem = (p) => {
    let m;
    const e = equation(p);
    if (e) return e;
    if ((m = p.match(/^([\d ]+(?: [+−] [\d ]+)+) işleminin/))) return exprFig(m[1] + " = ?");
    if ((m = p.match(/^([\d ]+) ile ([\d ]+) toplamının ([\d ]+) eksiği/))) return exprFig(`( ${m[1]} + ${m[2]} ) − ${m[3]} = ?`);
    if ((m = p.match(/^Bir sayıya ([\d ]+) ekleyince ([\d ]+) oluyor/))) return exprFig(`? + ${m[1]} = ${m[2]}`);
    if ((m = p.match(/(\d+) yerine (\d+) yazılmış/))) return cardsFig([m[1], "→", m[2]], givens(p.slice(m.index + m[0].length), 2));
    return null;
  };
  F.carpan = (p) => {
    let m;
    const e = equation(p);
    if (e) return e;
    if ((m = p.match(/Bölen (\d+), bölüm (\d+), kalan (\d+)\. Bölünen/))) return divisionFig("?", m[1], m[2], m[3]);
    if ((m = p.match(/^Bölen (\d+), bölüm (\d+)\. Kalan en büyük/))) return divisionFig("?", m[1], m[2], "?");
    if ((m = p.match(/Bir sayı (\d+)'[a-zçğıöşü]+ bölününce bölüm (\d+), kalan (\d+)/))) return divisionFig("?", m[1], m[2], m[3]);
    if ((m = p.match(/^([\d ]+) ÷ (\d+) işleminde kalan/))) return divisionFig(m[1].trim(), m[2], null, "?");
    if ((m = p.match(/^(\d+) (\w+) (\d+) kişiye eşit paylaşılıyor/))) return groupsFig(+m[3], null, m[2] === "bilye" ? "🔵" : "🍬", [{ t: `${m[1]} ${m[2]}`, color: CORAL }, { t: `${m[3]} kişi`, color: BLUE }]);
    if ((m = p.match(/^(\d+) kutunun her birinde (\d+) (\w+)/))) return groupsFig(+m[1], +m[2], "✏️", [{ t: `${m[1]} kutu`, color: CORAL }, { t: `her birinde ${m[2]}`, color: BLUE }]);
    if ((m = p.match(/(\d+) öğrenci (\d+) kişilik/))) return groupsFig(7, +m[2], "🧒", [{ t: `${m[1]} öğrenci`, color: CORAL }, { t: `${m[2]} kişilik`, color: BLUE }]);
    return null;
  };
  F.problem = (p) => {
    let m;
    if ((m = p.match(/^(\d+) kitap (\d+) sınıfa/))) return groupsFig(+m[2], null, "📚", givens(p, 3));
    if ((m = p.match(/(\d+) öğrenci için (\d+) kişilik/))) return groupsFig(7, +m[2], "🧒", givens(p, 3));
    return null;
  };

  function rectWords(p) {
    let m;
    const u = unitOf(p).trim() || "cm";
    const g = givens(p, 5);
    const chipsExcept = (...ns) => g.filter((t) => !ns.some((n) => t.startsWith(String(n) + " ") || t === String(n)));
    if ((m = p.match(/(\d+) sütun ve (\d+) satır/))) return unitGridFig(+m[1], +m[2], [{ t: `${m[1]} sütun`, color: BLUE }, { t: `${m[2]} satır`, color: CORAL }]);
    if ((m = p.match(/(\d+) × (\d+) kare ile (\d+) × (\d+) dikdörtgen/))) return twoRectsFig([+m[1], +m[2]], [+m[3], +m[4]], chipsExcept(m[1], m[2], m[3], m[4]));
    if ((m = p.match(/Kenarları (\d+) cm olan (\d+) kare, tek sıra/))) return squaresRowFig(+m[2], m[1] + " cm", [{ t: `${m[2]} kare`, color: BLUE }, ...chipsExcept(m[1], m[2])]);
    let w = null, h = null;
    if ((m = p.match(/[Kk]enarları (\d+) (?:ve|cm ve) (\d+)/) || p.match(/(\d+) m'ye (\d+) m/) || p.match(/[Bb]ahçe (\d+) m ve (\d+) m/) || p.match(/(\d+) × (\d+)/))) { w = +m[1]; h = +m[2]; if (h > w) [w, h] = [h, w]; }
    const square = /kare/.test(p) && !/m² halı|kare halı|kare kesiliyor|kare ile|kare telin/.test(p) || /kare tel/.test(p);
    const side = p.match(/[Bb]ir kenarı (\d+) (cm|m)/);
    const per = p.match(/[Çç]evresi (\d+) (cm|m)/), area = p.match(/[Aa]lanı (\d+) (cm²|m²)/);
    const shortS = p.match(/kısa kenar(?:ı)? (\d+) (cm|m)/), longS = p.match(/[Uu]zun kenar(?:ı)? (\d+) (cm|m)/);
    const o = { chips: [] };
    if (/halı/.test(p)) o.rug = (m = p.match(/kenarı (\d+) m kare halı|kenarları (\d+) ve (\d+) m bir halı/)) ? (m[1] ? `${m[1]} m` : `${m[2]}×${m[3]}`) : "halı";
    if (/kare kesiliyor|bölge çıkarılıyor/.test(p)) o.cut = (m = p.match(/kenarı (\d+) cm olan kare|kenarları (\d+) ve (\d+) m bölge/)) ? (m[1] ? `${m[1]} cm` : `${m[2]}×${m[3]} m`) : true;
    if (/dışına/.test(p) && /yol/.test(p)) o.outer = true;
    if (/içine/.test(p) && /yol/.test(p)) o.inner = true;
    if (/kapı/.test(p)) o.gate = true;
    if ((m = p.match(/(\d+|iki) sıra tel/))) o.wires = WORD_NUM[m[1]] || +m[1];
    if (/iki eş alanlı parça/.test(p)) o.split = true;
    if (/tur/.test(p)) o.emoji = "🏃";
    if (/bahçe/i.test(p)) o.fill = "#d9f2c9", o.stroke = TEAL, o.emoji = o.emoji || "🌳";
    if (/oda|zemin/.test(p)) o.fill = "#f6e7cf", o.stroke = BROWN;
    if (square) {
      const s = side ? `${side[1]} ${side[2]}` : "?";
      return rectFig(4, 4, { ...o, top: s, side: s, center: per ? `Ç = ${per[1]} ${per[2]}` : area ? `A = ${area[1]} ${area[2]}` : "", chips: chipsExcept(side && side[1], per && per[1], area && area[1]) });
    }
    if (w && h) return rectFig(w, h, { ...o, top: `${w} ${u === "cm²" || u === "m²" ? u.replace("²", "") : u}`, side: `${h} ${u === "cm²" || u === "m²" ? u.replace("²", "") : u}`, chips: chipsExcept(w, h) });
    if (per || area || shortS || longS) {
      const L = longS ? `${longS[1]} ${longS[2]}` : "?", S = shortS ? `${shortS[1]} ${shortS[2]}` : (side ? `${side[1]} ${side[2]}` : "?");
      return rectFig(longS ? +longS[1] : 6, shortS ? +shortS[1] : 3.4, { ...o, top: L, side: S, center: per ? `Ç = ${per[1]} ${per[2]}` : area ? `A = ${area[1]} ${area[2]}` : "", chips: chipsExcept(per && per[1], area && area[1], shortS && shortS[1], longS && longS[1], side && side[1]) });
    }
    if (/dikdörtgen|bahçe|oda|zemin|kare/i.test(p)) return rectFig(6, 3.4, { ...o, top: "?", side: "?", chips: g });
    return null;
  }
  function twoRectsFig(a, b, chips) {
    const u = Math.min(22, 150 / Math.max(a[1], b[1]));
    const box = (r, x, color) => `<rect class="pop" x="${x}" y="${r1(118 - r[1] * u / 2)}" width="${r1(r[0] * u)}" height="${r1(r[1] * u)}" fill="${color}22" stroke="${color}" stroke-width="4"/>` + text(x + r[0] * u / 2, 118 + r[1] * u / 2 + 20, `${r[0]} × ${r[1]}`, { size: 16, fill: color });
    return withChips(box(a, 70, BLUE) + box(b, 220, CORAL), chips, 400, 240);
  }
  F.cevre = (p) => rectWords(p);
  F.alan = (p) => rectWords(p);
  F.iliski = (p) => rectWords(p);

  function build(topicId, q) {
    if (!q || q.scene || ["dial", "rect", "order", "classify"].includes(q.kind)) return "";
    const p = q.kind === "slots" ? "" : String(q.prompt || "");
    if (!p) return "";
    let out = null;
    try { out = F[topicId] ? F[topicId](p, q) : null; } catch (e) { out = null; }
    return out || board(topicId, p, q);
  }

  root.MatQuestionVisuals = { build, givens };
})(typeof window !== "undefined" ? window : globalThis);
