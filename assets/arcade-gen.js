// Görsel oyunlar için konu bazlı soru üreticileri.
// Her çağrı yeni bir soru üretir: { prompt, svg, answer, choices, unit, numeric }.
// numeric=true ise cevap tuş takımıyla girilebilen tam sayıdır.
(function (root) {
  "use strict";
  const INK = "#1f2547", CORAL = "#e25b45", BLUE = "#2c6bed", TEAL = "#1c8c74", GOLD = "#f0a90d", GRAPE = "#6b4fd8";

  // ---- Küçük yardımcılar ----
  const ri = (rnd, a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];
  const shuffle = (rnd, arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const r1 = (n) => Math.round(n * 10) / 10;
  const P = (cx, cy, deg, r) => [r1(cx + r * Math.cos(deg * Math.PI / 180)), r1(cy - r * Math.sin(deg * Math.PI / 180))];
  const svg = (inner, vb = "0 0 360 240") => `<svg class="ar-svg" viewBox="${vb}" role="img" aria-hidden="true">${inner}</svg>`;
  const text = (x, y, t, o = {}) => `<text x="${r1(x)}" y="${r1(y)}" text-anchor="${o.anchor || "middle"}" dominant-baseline="middle" font-size="${o.size || 18}" font-weight="${o.weight || 800}" fill="${o.fill || INK}" paint-order="stroke" stroke="${o.halo === false ? "none" : "#fff"}" stroke-width="5">${t}</text>`;
  const line = (x1, y1, x2, y2, o = {}) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${o.color || INK}" stroke-width="${o.w || 4}" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}${o.cls ? ` class="${o.cls}"` : ""}/>`;
  const dot = (x, y, r = 6, fill = CORAL) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${fill}"/>`;
  const arrowHead = (x, y, deg, color = INK, s = 13) => {
    const a = P(x, y, deg + 155, s), b = P(x, y, deg - 155, s);
    return `<polygon points="${r1(x)},${r1(y)} ${a[0]},${a[1]} ${b[0]},${b[1]}" fill="${color}"/>`;
  };
  function sector(cx, cy, r, a0, a1, fill, cls = "") {
    const [x0, y0] = P(cx, cy, a0, r), [x1, y1] = P(cx, cy, a1, r);
    return `<path${cls ? ` class="${cls}"` : ""} d="M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 0 ${x1} ${y1} Z" fill="${fill}"/>`;
  }
  function ray(cx, cy, deg, len, color = INK, w = 5, cls = "") {
    const [x, y] = P(cx, cy, deg, len);
    return line(cx, cy, x, y, { color, w, cls });
  }
  function rightMark(cx, cy, a, s = 16, color = INK) {
    const p1 = P(cx, cy, a, s), p3 = P(cx, cy, a + 90, s), p2 = P(p1[0], p1[1], a + 90, s);
    return `<polyline points="${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
  }
  // Sayısal cevaplar için akla yatkın yanlış seçenekler.
  function numChoices(rnd, answer, extra = []) {
    const step = answer >= 10000 ? Math.pow(10, Math.floor(Math.log10(answer)) - 1) : answer >= 100 ? 10 : answer >= 20 ? 5 : 1;
    const pool = [...extra, answer + step, answer - step, answer + 2 * step, answer - 2 * step, answer + 1, answer - 1, answer * 2, Math.round(answer / 2)];
    const out = [answer];
    for (const v of shuffle(rnd, pool)) {
      if (out.length >= 4) break;
      if (Number.isInteger(v) && v >= 0 && !out.includes(v)) out.push(v);
    }
    let k = 3;
    while (out.length < 4) { if (!out.includes(answer + k)) out.push(answer + k); k += 1; }
    return shuffle(rnd, out);
  }
  const num = (rnd, prompt, figure, answer, o = {}) => ({ prompt, svg: figure, answer, unit: o.unit || "", numeric: true, choices: numChoices(rnd, answer, o.extra || []).map(String) });
  const mc = (rnd, prompt, figure, answer, wrongs) => ({ prompt, svg: figure, answer, numeric: false, choices: shuffle(rnd, [answer, ...shuffle(rnd, [...new Set(wrongs.map(String))].filter((w) => w !== String(answer))).slice(0, 3)]) });

  // ---- Ortak çizimler ----
  function angleFigure(deg, o = {}) {
    const cx = o.cx || 120, cy = o.cy || 190, len = o.len || 150;
    let s = sector(cx, cy, 46, 0, deg, o.fill || "#ffdcb0", "ar-grow");
    s += ray(cx, cy, 0, len) + ray(cx, cy, deg, len, CORAL, 5, "ar-draw");
    if (deg === 90) s += rightMark(cx, cy, 0, 18);
    if (o.label) { const p = P(cx, cy, deg / 2, 72); s += text(p[0], p[1], o.label, { size: 22 }); }
    return s + dot(cx, cy, 6, INK);
  }
  function polygonPts(n, cx, cy, r, rnd, jitter = 0) {
    const off = rnd() * 360;
    return Array.from({ length: n }, (_, i) => {
      const rr = r * (1 - jitter / 2 + (jitter ? rnd() * jitter : 0));
      return P(cx, cy, off + i * 360 / n, rr);
    });
  }
  function rectFigure(w, h, o = {}) {
    const unit = Math.min(240 / w, 150 / h, 30);
    const W = w * unit, H = h * unit, x = 180 - W / 2, y = 120 - H / 2;
    let s = `<rect class="ar-pop" x="${r1(x)}" y="${r1(y)}" width="${r1(W)}" height="${r1(H)}" rx="4" fill="${o.fill || "#dff1ff"}" stroke="${BLUE}" stroke-width="4"/>`;
    if (o.grid) {
      for (let i = 1; i < w; i++) s += line(x + i * unit, y, x + i * unit, y + H, { color: "#8db8f2", w: 1.5 });
      for (let j = 1; j < h; j++) s += line(x, y + j * unit, x + W, y + j * unit, { color: "#8db8f2", w: 1.5 });
    }
    if (o.labels !== false) {
      s += text(180, y - 16, o.top || w + " cm", { size: 18, fill: BLUE });
      s += text(x - 12, 120, o.side || h + " cm", { size: 18, fill: BLUE, anchor: "end" });
    }
    return s;
  }
  function triangleFromAngles(A, B) {
    // Taban 0..L, sol köşe açısı A, sağ köşe açısı B.
    const C = 180 - A - B, L = 1;
    const b = L * Math.sin(B * Math.PI / 180) / Math.sin(C * Math.PI / 180);
    const p = [0, 0], q = [L, 0], r = [b * Math.cos(A * Math.PI / 180), b * Math.sin(A * Math.PI / 180)];
    const xs = [p[0], q[0], r[0]], ys = [0, 0, r[1]];
    const minX = Math.min(...xs), maxX = Math.max(...xs), maxY = Math.max(...ys);
    const scale = Math.min(280 / (maxX - minX), 170 / maxY);
    const map = (pt) => [r1(40 + (pt[0] - minX) * scale + (280 - (maxX - minX) * scale) / 2), r1(215 - pt[1] * scale)];
    return [map(p), map(q), map(r)];
  }

  // ---- Konu üreticileri: g(rnd, zorluk 1-3, sayısalİste) ----
  const T = {};
  const LETTERS = "ABCDEFGH";

  T.nokta = (rnd, d, wantNum) => {
    if (wantNum || rnd() < .5) {
      const k = ri(rnd, 3, 3 + d);
      const xs = Array.from({ length: k }, (_, i) => 40 + i * 280 / (k - 1));
      let s = line(30, 130, 330, 130, { color: INK, w: 4, cls: "ar-draw" });
      xs.forEach((x, i) => { s += dot(x, 130, 7, i % 2 ? BLUE : CORAL) + text(x, 160, LETTERS[i]); });
      return num(rnd, `Bir doğru parçası üzerinde ${k} nokta var. Bu noktalarla kaç farklı doğru parçası oluşur?`, svg(s), k * (k - 1) / 2);
    }
    const kinds = { "Nokta": dot(180, 120, 9) + text(180, 156, "A"),
      "Doğru parçası": line(70, 120, 290, 120, { cls: "ar-draw" }) + dot(70, 120, 7, BLUE) + dot(290, 120, 7) + text(70, 152, "A") + text(290, 152, "B"),
      "Işın": line(70, 120, 310, 120, { cls: "ar-draw" }) + arrowHead(318, 120, 0) + dot(70, 120, 7) + text(70, 152, "A"),
      "Doğru": line(30, 120, 330, 120, { cls: "ar-draw" }) + arrowHead(338, 120, 0) + arrowHead(22, 120, 180) + text(180, 152, "d") };
    const ans = pick(rnd, Object.keys(kinds));
    return mc(rnd, "Bu model hangisidir?", svg(kinds[ans]), ans, Object.keys(kinds));
  };

  T.aci = (rnd, d, wantNum) => {
    if (wantNum || rnd() < .45) {
      const n = ri(rnd, 3, 3 + Math.min(d, 2));
      const degs = Array.from({ length: n }, (_, i) => Math.round(i * 160 / (n - 1)) + 10);
      let s = "";
      degs.forEach((g, i) => { s += ray(60, 200, g, 170, [INK, CORAL, BLUE, TEAL, GRAPE][i], 4, "ar-draw"); const p = P(60, 200, g, 190); s += text(p[0], p[1], LETTERS[i + 1], { size: 16 }); });
      s += dot(60, 200, 7, INK) + text(42, 218, "O", { size: 16 });
      return num(rnd, `O noktasından ${n} ışın çıkıyor. Şekilde toplam kaç açı vardır?`, svg(s), n * (n - 1) / 2);
    }
    const type = pick(rnd, ["Dar açı", "Dik açı", "Geniş açı", "Doğru açı"]);
    const deg = type === "Dar açı" ? ri(rnd, 20, 75) : type === "Dik açı" ? 90 : type === "Geniş açı" ? ri(rnd, 105, 165) : 180;
    return mc(rnd, "Bu açı hangi türdedir?", svg(angleFigure(deg, { cx: 180, len: 140 })), type, ["Dar açı", "Dik açı", "Geniş açı", "Doğru açı"]);
  };

  T.cember = (rnd, d, wantNum) => {
    if (wantNum || rnd() < .55) {
      const r = ri(rnd, 2, 5 + 6 * d);
      const askDiameter = rnd() < .5;
      let s = `<circle class="ar-pop" cx="180" cy="120" r="90" fill="#eef6ff" stroke="${BLUE}" stroke-width="4"/>` + dot(180, 120, 6, INK);
      if (askDiameter) s += line(180, 120, 270, 120, { color: CORAL, w: 5, cls: "ar-draw" }) + text(225, 104, `r = ${r} cm`, { fill: CORAL });
      else s += line(90, 120, 270, 120, { color: TEAL, w: 5, cls: "ar-draw" }) + text(180, 104, `${2 * r} cm`, { fill: TEAL });
      return num(rnd, askDiameter ? "Yarıçap verildi. Çemberin çapı kaç cm?" : "Çap verildi. Çemberin yarıçapı kaç cm?", svg(s), askDiameter ? 2 * r : r, { unit: "cm", extra: [askDiameter ? r : 4 * r] });
    }
    const opts = ["Merkez", "Yarıçap", "Çap", "Çember"];
    const ans = pick(rnd, opts);
    const base = `<circle cx="180" cy="120" r="90" fill="#eef6ff" stroke="${ans === "Çember" ? CORAL : "#9fb7d8"}" stroke-width="${ans === "Çember" ? 7 : 3}"/>`;
    const a = ri(rnd, 0, 359), [x, y] = P(180, 120, a, 90), [x2, y2] = P(180, 120, a + 180, 90);
    const mark = ans === "Merkez" ? dot(180, 120, 10) : ans === "Yarıçap" ? line(180, 120, x, y, { color: CORAL, w: 7, cls: "ar-draw" }) + dot(180, 120, 5, INK) : ans === "Çap" ? line(x2, y2, x, y, { color: CORAL, w: 7, cls: "ar-draw" }) + dot(180, 120, 5, INK) : dot(180, 120, 5, INK);
    return mc(rnd, "Kırmızı ile gösterilen nedir?", svg(base + mark), ans, opts);
  };

  T.dikme = (rnd, d, wantNum) => {
    if (wantNum || rnd() < .55) {
      const x = ri(rnd, 2, 17) * 5 - (d > 2 ? ri(rnd, 0, 4) : 0);
      let s = line(30, 200, 330, 200) + line(180, 200, 180, 30) + rightMark(180, 200, 0, 0) + ray(180, 200, 90 - x, 160, CORAL, 5, "ar-draw");
      s += sector(180, 200, 52, 90 - x, 90, "#ffdcb066") + sector(180, 200, 40, 0, 90 - x, "#ccebe2aa");
      const p1 = P(180, 200, 90 - x / 2, 78), p2 = P(180, 200, (90 - x) / 2, 66);
      s += text(p1[0], p1[1], x + "°", { size: 18 }) + text(p2[0], p2[1], "?", { size: 24, fill: TEAL }) + dot(180, 200, 6, INK) + rightMark(180, 200, 0, 22, "#999");
      return num(rnd, "Dikey doğru yere diktir. Soru işaretli açı kaç derecedir?", svg(s), 90 - x, { unit: "°", extra: [180 - x, x] });
    }
    const right = rnd() < .5, a = right ? 90 : pick(rnd, [70, 75, 80, 100, 105, 110]);
    const s = line(30, 170, 330, 170) + ray(180, 170, a, 150, CORAL, 5, "ar-draw") + ray(180, 170, a + 180, 40, CORAL, 5) + sector(180, 170, 40, 0, a, "#ffdcb0aa") + text(...P(180, 170, a / 2, 62), a + "°") + dot(180, 170, 6, INK);
    return mc(rnd, "Bu iki doğru birbirine dik midir?", svg(s), right ? "Evet, diktir" : "Hayır, dik değil", ["Evet, diktir", "Hayır, dik değil"]);
  };

  T.paralel = (rnd, d, wantNum) => {
    if (wantNum || rnd() < .45) {
      const base = pick(rnd, [0, 20, 35, -25]);
      const n = ri(rnd, 4, 5 + d), k = ri(rnd, 1, n - 2);
      const slots = shuffle(rnd, Array.from({ length: n }, (_, i) => i));
      let s = "";
      const draw = (deg, cx, cy, color, w = 4) => { const a = P(cx, cy, deg, 60), b = P(cx, cy, deg + 180, 60); return line(a[0], a[1], b[0], b[1], { color, w }); };
      s += draw(base, 70, 50, CORAL, 6) + text(70, 92, "kırmızı", { size: 13, fill: CORAL });
      slots.forEach((slot, i) => {
        const cx = 160 + (slot % 3) * 75, cy = 50 + Math.floor(slot / 3) * 70;
        const deg = i < k ? base : base + pick(rnd, [30, 50, 70, 90, -40, -60]);
        s += draw(deg, cx, cy, i < k ? INK : INK);
      });
      return num(rnd, "Kırmızı doğruya paralel olan kaç siyah doğru var?", svg(s, "0 0 400 250"), k);
    }
    const par = rnd() < .5, tilt = par ? 0 : pick(rnd, [[12, -12], [8, -8], [5, -5]][d - 1]);
    const y1 = 80, y2 = 160;
    const s = line(30, y1 - tilt, 330, y1 + tilt, { color: BLUE, w: 5, cls: "ar-draw" }) + line(30, y2 + tilt, 330, y2 - tilt, { color: CORAL, w: 5, cls: "ar-draw" }) + text(345, y1 + tilt, "d", { size: 16 }) + text(345, y2 - tilt, "k", { size: 16 });
    return mc(rnd, "d ve k doğruları uzatılırsa ne olur?", svg(s), par ? "Paraleldir, kesişmez" : "Bir noktada kesişir", ["Paraleldir, kesişmez", "Bir noktada kesişir"]);
  };

  function protractor(deg) {
    const cx = 180, cy = 205, R = 150;
    let s = `<path d="M${cx - R} ${cy} A${R} ${R} 0 0 1 ${cx + R} ${cy} Z" fill="#fff8e6" stroke="#d9b75a" stroke-width="3"/>`;
    for (let g = 0; g <= 180; g += 5) {
      const big = g % 10 === 0, [x1, y1] = P(cx, cy, g, R), [x2, y2] = P(cx, cy, g, R - (big ? 16 : 9));
      s += line(x1, y1, x2, y2, { color: "#8a6d1e", w: big ? 2 : 1 });
      if (g % 30 === 0) { const [tx, ty] = P(cx, cy, g, R - 30); s += text(tx, ty, g, { size: 12, fill: "#8a6d1e", halo: false }); }
    }
    s += line(cx - R, cy, cx + R, cy, { color: INK, w: 3 }) + ray(cx, cy, deg, R + 5, CORAL, 5, "ar-draw") + sector(cx, cy, 34, 0, deg, "#e25b4544") + dot(cx, cy, 6, INK);
    return svg(s, "0 0 360 225");
  }
  T.olcme = (rnd, d, wantNum) => {
    const deg = d === 1 ? ri(rnd, 1, 17) * 10 : ri(rnd, 1, 35) * 5;
    if (wantNum || rnd() < .6) return num(rnd, "İletkiye göre kırmızı ışın kaç derecelik açı yapıyor?", protractor(deg), deg, { unit: "°", extra: [180 - deg] });
    return mc(rnd, "İletkiye göre açının ölçüsü hangisidir?", protractor(deg), deg + "°", [180 - deg, deg + 10, Math.abs(deg - 10) || 15, deg + 5].map((v) => v + "°"));
  };

  T.durum = (rnd, d, wantNum) => {
    if (wantNum || rnd() < .5) {
      // Rastgele doğrular; kesişimler çerçevenin içinde ve birbirinden ayırt edilebilir uzaklıkta olmalı.
      for (let attempt = 0; attempt < 200; attempt++) {
        const n = ri(rnd, 3, 3 + d);
        const L = Array.from({ length: n }, () => ({ x: ri(rnd, 60, 300), y: ri(rnd, 50, 190), a: ri(rnd, 0, 179) }));
        const pts = []; let ok = true;
        for (let i = 0; i < n && ok; i++) for (let j = i + 1; j < n; j++) {
          const A = L[i], B = L[j];
          const diff = Math.abs(((A.a - B.a) % 180 + 180) % 180);
          if (Math.min(diff, 180 - diff) < 18) { ok = false; break; }
          const [dx1, dy1] = [Math.cos(A.a * Math.PI / 180), -Math.sin(A.a * Math.PI / 180)], [dx2, dy2] = [Math.cos(B.a * Math.PI / 180), -Math.sin(B.a * Math.PI / 180)];
          const den = dx1 * dy2 - dy1 * dx2, t = ((B.x - A.x) * dy2 - (B.y - A.y) * dx2) / den;
          const px = A.x + t * dx1, py = A.y + t * dy1;
          if (px > 25 && px < 335 && py > 20 && py < 220) pts.push([px, py]);
          else if (px > -20 && px < 380 && py > -20 && py < 260) { ok = false; break; }
        }
        if (!ok) continue;
        if (pts.some((p, i) => pts.some((q, j) => j > i && Math.hypot(p[0] - q[0], p[1] - q[1]) < 22))) continue;
        let s = "";
        L.forEach((l, i) => { const a = P(l.x, l.y, l.a, 400), b = P(l.x, l.y, l.a + 180, 400); s += line(a[0], a[1], b[0], b[1], { color: [INK, CORAL, BLUE, TEAL, GRAPE, GOLD][i], w: 4, cls: "ar-draw" }); });
        return num(rnd, `${n} doğru çizildi. Kaç tane kesişim noktası var?`, `<svg class="ar-svg" viewBox="0 0 360 240" role="img" aria-hidden="true"><clipPath id="arclip"><rect x="10" y="10" width="340" height="220" rx="14"/></clipPath><g clip-path="url(#arclip)">${s}</g></svg>`, pts.length);
      }
    }
    const opts = ["Kesişen", "Paralel", "Çakışık"];
    const ans = pick(rnd, opts);
    const s = ans === "Kesişen" ? line(40, 60, 320, 190, { color: BLUE, w: 5, cls: "ar-draw" }) + line(40, 190, 320, 60, { color: CORAL, w: 5, cls: "ar-draw" })
      : ans === "Paralel" ? line(40, 80, 320, 50, { color: BLUE, w: 5, cls: "ar-draw" }) + line(40, 180, 320, 150, { color: CORAL, w: 5, cls: "ar-draw" })
      : line(40, 160, 320, 80, { color: BLUE, w: 10, cls: "ar-draw" }) + line(40, 160, 320, 80, { color: CORAL, w: 4, dash: "14 10" });
    return mc(rnd, "Mavi ve kırmızı doğrular nasıl doğrulardır?", svg(s), ans, opts);
  };

  T.cift = (rnd, d, wantNum) => {
    const kind = pick(rnd, d === 1 ? ["tümler", "bütünler"] : ["tümler", "bütünler", "ters", "komşu"]);
    if (wantNum || rnd() < .7) {
      if (kind === "ters" || kind === "komşu") {
        const x = ri(rnd, 25, 75), cx = 180, cy = 120;
        let s = "";
        [x, 180 + x].forEach((g) => { s += ray(cx, cy, g, 140, BLUE, 5, "ar-draw"); });
        [0, 180].forEach((g) => { s += ray(cx, cy, g, 160, INK, 5); });
        s += sector(cx, cy, 44, 0, x, "#ffdcb0") + text(...P(cx, cy, x / 2, 66), x + "°");
        const ask = kind === "ters" ? [180, 180 + x] : [x, 180];
        s += sector(cx, cy, 44, ask[0], ask[1], "#ccebe2") + text(...P(cx, cy, (ask[0] + ask[1]) / 2, 66), "?", { size: 26, fill: TEAL }) + dot(cx, cy, 6, INK);
        return num(rnd, kind === "ters" ? "Ters açılar eşittir. Soru işaretli açı kaç derece?" : "Yan yana iki açı doğru açı oluşturuyor. Soru işaretli açı kaç derece?", svg(s), kind === "ters" ? x : 180 - x, { unit: "°", extra: [180 - x, 90 - x > 0 ? 90 - x : 5] });
      }
      const total = kind === "tümler" ? 90 : 180, x = ri(rnd, 2, total / 5 - 2) * 5 + (d === 3 ? ri(rnd, 1, 4) : 0);
      let s = sector(120, 200, 70, 0, x, "#ffdcb0", "ar-grow") + sector(120, 200, 70, x, total, "#ccebe2", "ar-grow");
      s += ray(120, 200, 0, 190) + ray(120, 200, total, total === 90 ? 180 : 110) + ray(120, 200, x, 190, CORAL, 5, "ar-draw");
      if (total === 90) s += rightMark(120, 200, 0, 22, "#777");
      s += text(...P(120, 200, x / 2, 96), x + "°", { size: 20 }) + text(...P(120, 200, (x + total) / 2, 96), "?", { size: 28, fill: TEAL }) + dot(120, 200, 6, INK);
      return num(rnd, `Turuncu açı ${x}°. ${kind === "tümler" ? "Tümleri" : "Bütünleri"} kaç derecedir?`, svg(s, total === 90 ? "0 0 360 240" : "-80 0 400 240"), total - x, { unit: "°", extra: [(total === 90 ? 180 : 90) - x > 0 ? (total === 90 ? 180 : 90) - x : x + 10] });
    }
    const a = ri(rnd, 3, 12) * 5, type = pick(rnd, ["Tümler", "Bütünler", "Hiçbiri"]);
    const b = type === "Tümler" ? 90 - a : type === "Bütünler" ? 180 - a : 90 - a + pick(rnd, [10, 20, 35]);
    const s = sector(140, 190, 60, 0, a, "#ffdcb0") + sector(140, 190, 60, a, a + b, "#ccebe2") + ray(140, 190, 0, 160) + ray(140, 190, a, 160, CORAL) + ray(140, 190, a + b, 160, BLUE) + text(...P(140, 190, a / 2, 86), a + "°") + text(...P(140, 190, a + b / 2, 86), b + "°") + dot(140, 190, 6, INK);
    return mc(rnd, "Bu iki açı nasıl açılardır?", svg(s, "-40 0 400 240"), type, ["Tümler", "Bütünler", "Hiçbiri"]);
  };

  const POLY = { 3: "Üçgen", 4: "Dörtgen", 5: "Beşgen", 6: "Altıgen", 7: "Yedigen", 8: "Sekizgen" };
  T.cokgen = (rnd, d, wantNum) => {
    const n = ri(rnd, 3, 5 + d);
    const pts = polygonPts(n, 180, 120, 95, rnd, d > 1 ? .35 : 0);
    let s = `<polygon class="ar-pop" points="${pts.map((p) => p.join(",")).join(" ")}" fill="#efe9ff" stroke="${GRAPE}" stroke-width="4" stroke-linejoin="round"/>`;
    pts.forEach((p) => { s += dot(p[0], p[1], 5, CORAL); });
    if (wantNum || rnd() < .5) {
      if (d === 3 && rnd() < .5) return num(rnd, "Bu çokgenin kaç köşegeni vardır?", svg(s), n * (n - 3) / 2);
      return num(rnd, pick(rnd, ["Bu çokgenin kaç kenarı var?", "Bu çokgenin kaç köşesi var?"]), svg(s), n);
    }
    return mc(rnd, "Bu çokgenin adı nedir?", svg(s), POLY[n], Object.values(POLY).filter((v) => v !== POLY[n]).sort(() => rnd() - .5).slice(0, 3));
  };

  T.ucgen = (rnd, d, wantNum) => {
    let A = ri(rnd, 6, 16) * 5, B = ri(rnd, 6, 16) * 5;
    if (A + B > 160) B = 160 - A;
    if (d === 3) { A += ri(rnd, 1, 4); B -= ri(rnd, 1, 3); }
    const C = 180 - A - B;
    const [p, q, r] = triangleFromAngles(A, B);
    const lab = (pt, o, val, color) => { const cxm = (p[0] + q[0] + r[0]) / 3, cym = (p[1] + q[1] + r[1]) / 3; const k = 0.3; return text(pt[0] + (cxm - pt[0]) * k, pt[1] + (cym - pt[1]) * k, val, { size: 19, fill: color }); };
    let s = `<polygon class="ar-pop" points="${[p, q, r].map((v) => v.join(",")).join(" ")}" fill="#fff1d6" stroke="${GOLD}" stroke-width="4" stroke-linejoin="round"/>`;
    if (wantNum || rnd() < .6) {
      s += lab(p, 0, A + "°", INK) + lab(q, 0, B + "°", INK) + lab(r, 0, "?", TEAL);
      return num(rnd, "Üçgenin iç açılarının toplamı 180°dir. Soru işaretli açı kaç derece?", svg(s), C, { unit: "°", extra: [180 - A, 180 - B, 90 - C > 0 ? 90 : 360 - A - B - 180] });
    }
    s += lab(p, 0, A + "°", INK) + lab(q, 0, B + "°", INK) + lab(r, 0, C + "°", INK);
    const max = Math.max(A, B, C), type = max === 90 ? "Dik açılı" : max > 90 ? "Geniş açılı" : "Dar açılı";
    return mc(rnd, "Açılarına göre bu üçgen hangisidir?", svg(s), type, ["Dar açılı", "Dik açılı", "Geniş açılı"]);
  };

  T.insa = (rnd, d, wantNum) => {
    if (wantNum || rnd() < .5) {
      const a = ri(rnd, 3, 6 + 4 * d), b = ri(rnd, 3, 6 + 4 * d), c = ri(rnd, Math.abs(a - b) + 1, a + b - 1);
      const A = Math.acos((b * b + c * c - a * a) / (2 * b * c)) * 180 / Math.PI;
      const B = Math.acos((a * a + c * c - b * b) / (2 * a * c)) * 180 / Math.PI;
      const [p, q, r] = triangleFromAngles(A, B);
      const mid = (u, v) => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2];
      let s = `<polygon class="ar-pop" points="${[p, q, r].map((v) => v.join(",")).join(" ")}" fill="#e3f6ef" stroke="${TEAL}" stroke-width="4" stroke-linejoin="round"/>`;
      const m1 = mid(p, q), m2 = mid(q, r), m3 = mid(r, p);
      s += text(m1[0], m1[1] + 18, c + " cm") + text(m2[0] + 26, m2[1], a + " cm") + text(m3[0] - 26, m3[1], b + " cm");
      return num(rnd, "Kenar uzunlukları verilen üçgenin çevresi kaç cm?", svg(s), a + b + c, { unit: "cm" });
    }
    const ok = rnd() < .5;
    let a = ri(rnd, 3, 9), b = ri(rnd, 3, 9);
    const c = ok ? ri(rnd, Math.abs(a - b) + 1, a + b - 1) : a + b + ri(rnd, 0, 3);
    const bars = shuffle(rnd, [a, b, c]);
    const unit = 250 / Math.max(...bars);
    let s = "";
    bars.forEach((v, i) => { s += `<rect class="ar-grow-x" x="40" y="${50 + i * 60}" width="${r1(v * unit)}" height="22" rx="11" fill="${[CORAL, BLUE, TEAL][i]}"/>` + text(40 + v * unit + 30, 61 + i * 60, v + " cm", { size: 16 }); });
    return mc(rnd, "Bu üç çubukla bir üçgen yapılabilir mi?", svg(s), ok ? "Evet, yapılabilir" : "Hayır, yapılamaz", ["Evet, yapılabilir", "Hayır, yapılamaz"]);
  };

  const PLACE = ["birler", "onlar", "yüzler", "binler", "on binler", "yüz binler", "milyonlar"];
  function abacus(n, places) {
    const digits = String(n).padStart(places, "0").split("").map(Number);
    const w = 320 / places;
    let s = line(20, 200, 340, 200, { color: "#8a5a2b", w: 10 });
    digits.forEach((dg, i) => {
      const x = 20 + w * (i + .5);
      s += line(x, 40, x, 200, { color: "#b98a52", w: 4 });
      for (let k = 0; k < dg; k++) s += `<ellipse class="ar-pop" style="animation-delay:${(i * 9 + k) * 30}ms" cx="${r1(x)}" cy="${190 - k * 16}" rx="${Math.min(18, w / 2 - 4)}" ry="7" fill="${[CORAL, BLUE, TEAL, GOLD, GRAPE, "#e0548f", INK][places - 1 - i]}"/>`;
      s += text(x, 222, PLACE[places - 1 - i].replace(" ", " "), { size: places > 5 ? 9 : 11, weight: 700, halo: false });
    });
    return svg(s, "0 0 360 235");
  }
  T.okuma = (rnd, d, wantNum) => {
    const places = 3 + d + (d === 3 ? 1 : 0);
    if (wantNum || rnd() < .5) {
      const n = Array.from({ length: places }, (_, i) => i === 0 ? ri(rnd, 1, 9) : (rnd() < .25 ? 0 : ri(rnd, 1, 9))).join("");
      return num(rnd, "Abaküsteki sayı kaçtır?", abacus(Number(n), places), Number(n));
    }
    const digits = Array.from({ length: places + 2 }, (_, i) => i === 0 ? ri(rnd, 1, 9) : (rnd() < .4 ? 0 : ri(rnd, 1, 9)));
    const n = Number(digits.join(""));
    const words = root.MatGames ? root.MatGames.sayNumber(n) : String(n);
    const wrong = [];
    for (let i = 1; i < digits.length && wrong.length < 3; i++) {
      const alt = [...digits]; if (alt[i] === 0) continue;
      [alt[i], alt[i - 1]] = [alt[i - 1], alt[i]];
      const v = Number(alt.join("")); if (v !== n && String(v).length === digits.length && !wrong.includes(fmt(v))) wrong.push(fmt(v));
    }
    while (wrong.length < 3) { const v = n + Math.pow(10, wrong.length + 1); if (!wrong.includes(fmt(v))) wrong.push(fmt(v)); }
    return mc(rnd, "Okunuşu verilen sayı hangisidir?", `<div class="ar-words">“${words}”</div>`, fmt(n), wrong);
  };

  function digitTiles(n, hi) {
    const s = String(n), w = Math.min(46, 330 / s.length);
    let out = "";
    s.split("").forEach((ch, i) => {
      const x = 180 - (s.length * w) / 2 + i * w + (i > 0 && (s.length - i) % 3 === 0 ? 0 : 0);
      const on = i === hi;
      out += `<rect class="ar-pop" style="animation-delay:${i * 40}ms" x="${r1(x + 2)}" y="80" width="${r1(w - 4)}" height="70" rx="10" fill="${on ? GOLD : "#fff"}" stroke="${on ? "#c98a00" : "#d8d2ea"}" stroke-width="3"/>` + text(x + w / 2, 117, ch, { size: 34, fill: on ? "#fff" : INK, halo: false });
    });
    return svg(out);
  }
  T.basamak = (rnd, d, wantNum) => {
    const len = 3 + d + ri(rnd, 0, 2);
    const ds = Array.from({ length: len }, (_, i) => i === 0 ? ri(rnd, 1, 9) : ri(rnd, 0, 9));
    let hi = ri(rnd, 0, len - 1); while (ds[hi] === 0) hi = ri(rnd, 0, len - 1);
    const n = Number(ds.join("")), place = len - 1 - hi;
    if (wantNum || rnd() < .55) {
      const v = ds[hi] * Math.pow(10, place);
      return num(rnd, "Sarı rakamın basamak değeri kaçtır?", digitTiles(n, hi), v, { extra: [ds[hi], ds[hi] * Math.pow(10, place + 1), place ? ds[hi] * Math.pow(10, place - 1) : ds[hi] * 100] });
    }
    return mc(rnd, "Sarı rakam hangi basamakta?", digitTiles(n, hi), PLACE[place] + " basamağı", PLACE.slice(0, Math.min(len + 1, 7)).map((p) => p + " basamağı"));
  };

  T.sirala = (rnd, d, wantNum) => {
    if (wantNum || rnd() < .5) {
      const step = pick(rnd, d === 1 ? [10, 100] : d === 2 ? [100, 1000, 50] : [1000, 5000, 250]);
      const start = ri(rnd, 1, 40) * step * (d === 3 ? 10 : 1);
      const k = ri(rnd, 1, 9);
      let s = line(20, 140, 340, 140, { w: 4 }) + arrowHead(346, 140, 0) + arrowHead(14, 140, 180);
      for (let i = 0; i <= 10; i++) {
        const x = 30 + i * 30;
        s += line(x, 128, x, 152, { w: i % 5 === 0 ? 4 : 2 });
        if (i === 0 || i === 10) s += text(x, 172, fmt(start + i * step), { size: 12 });
      }
      s += `<g class="ar-bounce">${arrowHead(30 + k * 30, 120, -90, CORAL, 18)}${line(30 + k * 30, 70, 30 + k * 30, 104, { color: CORAL, w: 5 })}</g>` + text(30 + k * 30, 58, "?", { size: 26, fill: CORAL });
      return num(rnd, `Sayı doğrusu ${fmt(step)}'er ${fmt(step)}'er ilerliyor. Ok hangi sayıyı gösteriyor?`, svg(s), start + k * step, { extra: [start + (k + 1) * step, start + (k - 1) * step] });
    }
    const len = 3 + d;
    const base = ri(rnd, Math.pow(10, len - 1), Math.pow(10, len) - 1);
    const nums = new Set([base]);
    while (nums.size < 4) {
      const s = String(base).split(""); const i = ri(rnd, 1, len - 1), j = ri(rnd, 1, len - 1);
      [s[i], s[j]] = [s[j], s[i]]; if (rnd() < .5) s[i] = String(ri(rnd, 0, 9));
      const v = Number(s.join("")); if (String(v).length === len) nums.add(v);
    }
    const list = [...nums], big = rnd() < .5;
    const ans = big ? Math.max(...list) : Math.min(...list);
    const cards = list.map((v, i) => `<div class="ar-card" style="--i:${i}">${fmt(v)}</div>`).join("");
    return mc(rnd, big ? "Kartlardaki en büyük sayı hangisi?" : "Kartlardaki en küçük sayı hangisi?", `<div class="ar-cards">${cards}</div>`, fmt(ans), list.filter((v) => v !== ans).map(fmt));
  };

  function column(a, b, op) {
    const w = Math.max(String(a).length, String(b).length) + 1;
    const pad = (n) => String(n).padStart(w, " ");
    const row = (t, y, color) => t.split("").map((ch, i) => ch === " " ? "" : text(110 + i * 34, y, ch, { size: 34, fill: color, halo: false })).join("");
    return svg(row(pad(a), 50, INK) + row(pad(b), 100, BLUE) + text(80, 100, op, { size: 34, fill: CORAL, halo: false }) + line(70, 128, 120 + w * 34, 128, { w: 4, cls: "ar-draw" }) + text(110 + (w - 1) * 34, 168, "?", { size: 34, fill: TEAL, halo: false }), "0 0 360 200");
  }
  T.islem = (rnd, d, wantNum) => {
    const mag = Math.pow(10, 1 + d);
    const a = ri(rnd, mag, mag * 9), b = ri(rnd, mag / 10, a - 1);
    const add = rnd() < .5;
    const ans = add ? a + b : a - b;
    const q = num(rnd, add ? "Toplama işleminin sonucu kaçtır?" : "Çıkarma işleminin sonucu kaçtır?", column(a, b, add ? "+" : "−"), ans, { extra: [add ? ans - 10 : ans + 10, add ? ans + 100 : ans - 100] });
    if (!wantNum && rnd() < .4) { q.numeric = false; q.choices = q.choices.map((c) => fmt(Number(c))); q.answer = fmt(ans); }
    return q;
  };

  function dots(rows, cols, color = CORAL) {
    const gap = Math.min(300 / cols, 180 / rows, 36), r = gap * .32;
    const x0 = 180 - (cols - 1) * gap / 2, y0 = 120 - (rows - 1) * gap / 2;
    let s = "";
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) s += `<circle class="ar-pop" style="animation-delay:${(i * cols + j) * 18}ms" cx="${r1(x0 + j * gap)}" cy="${r1(y0 + i * gap)}" r="${r1(r)}" fill="${i % 2 ? BLUE : color}"/>`;
    return svg(s);
  }
  T.carpan = (rnd, d, wantNum) => {
    if (d === 3 && rnd() < .5) {
      const k = ri(rnd, 2, 5), each = ri(rnd, 2, 7), total = k * each;
      let s = "";
      for (let i = 0; i < k; i++) s += `<ellipse cx="${r1(180 - (k - 1) * 37 + i * 74)}" cy="190" rx="32" ry="12" fill="#e9e3f8" stroke="${GRAPE}" stroke-width="3"/>`;
      for (let i = 0; i < total; i++) s += dot(70 + (i % 12) * 20, 40 + Math.floor(i / 12) * 22, 7, i % 3 ? CORAL : GOLD);
      return num(rnd, `${total} şeker ${k} tabağa eşit paylaştırılıyor. Her tabağa kaç şeker düşer?`, svg(s), each, { extra: [total - k, each + 1] });
    }
    const rows = ri(rnd, 2, 3 + d * 2), cols = ri(rnd, 3, 4 + d * 2);
    const q = num(rnd, `${rows} sıra, her sırada ${cols} nokta var. Toplam kaç nokta?`, dots(rows, cols), rows * cols, { extra: [rows + cols, rows * (cols + 1)] });
    if (!wantNum && rnd() < .5) q.numeric = false;
    return q;
  };

  T.problem = (rnd, d, wantNum) => {
    const items = pick(rnd, [["🍎", "elma", "sepet"], ["🍪", "kurabiye", "kutu"], ["⚽", "top", "file"], ["✏️", "kalem", "kalemlik"], ["🥚", "yumurta", "kasa"]]);
    const k = ri(rnd, 2, 3 + d), n = ri(rnd, 3, 4 + d * 2), gone = ri(rnd, 1, Math.min(9, k * n - 1));
    const box = (i) => `<div class="ar-box" style="--i:${i}"><b>${items[0].repeat(Math.min(n, 12))}</b><small>${n} ${items[1]}</small></div>`;
    const html = `<div class="ar-boxes">${Array.from({ length: k }, (_, i) => box(i)).join("")}</div><p class="ar-story">${gone} ${items[1]} ${d > 1 ? "kullanıldı" : "yendi"} 😋</p>`;
    return num(rnd, `${k} ${items[2]}ta ${n}'er ${items[1]} vardı. ${gone} tanesi gitti. Kaç ${items[1]} kaldı?`, html, k * n - gone, { extra: [k * n, k * n + gone, k + n - gone] });
  };

  T.cevre = (rnd, d, wantNum) => {
    const w = ri(rnd, 3, 6 + 4 * d), h = ri(rnd, 2, Math.max(3, w - 1));
    if (d === 3 && rnd() < .5) {
      const P2 = 2 * (w + h);
      return num(rnd, `Dikdörtgenin çevresi ${P2} cm. Soru işaretli kenar kaç cm?`, svg(rectFigure(w, h, { side: "? cm" })), h, { unit: "cm", extra: [P2 - w, P2 / 2] });
    }
    return num(rnd, "Dikdörtgenin çevresi kaç cm?", svg(rectFigure(w, h)), 2 * (w + h), { unit: "cm", extra: [w * h, w + h] });
  };

  T.alan = (rnd, d, wantNum) => {
    const w = ri(rnd, 2, 4 + 2 * d), h = ri(rnd, 2, 3 + d);
    if (d > 1 && rnd() < .4) return num(rnd, `Kenarları ${w} cm ve ${h} cm olan dikdörtgenin alanı kaç cm²?`, svg(rectFigure(w, h, { grid: false })), w * h, { unit: "cm²", extra: [2 * (w + h), w + h] });
    return num(rnd, "Her kare 1 cm². Boyalı bölgenin alanı kaç cm²?", svg(rectFigure(w, h, { grid: true, labels: false, fill: "#ffe7a3" })), w * h, { unit: "cm²", extra: [2 * (w + h), w * h + w] });
  };

  T.iliski = (rnd, d, wantNum) => {
    if (wantNum || rnd() < .45) {
      const w = ri(rnd, 3, 5 + 3 * d), h = ri(rnd, 2, 9);
      return num(rnd, `Alanı ${w * h} cm² olan dikdörtgenin bir kenarı ${w} cm. Soru işaretli kenar kaç cm?`, svg(rectFigure(w, h, { side: "? cm" })), h, { unit: "cm", extra: [w * h - w, h + 1] });
    }
    const askArea = rnd() < .5;
    let a = [ri(rnd, 2, 8), ri(rnd, 2, 6)], b = [ri(rnd, 2, 8), ri(rnd, 2, 6)];
    if (rnd() < .25) b = [a[1], a[0]];
    const val = (r) => askArea ? r[0] * r[1] : 2 * (r[0] + r[1]);
    const box = (r, x, label, color) => { const u = 18; return `<rect class="ar-pop" x="${x}" y="${120 - r[1] * u / 2}" width="${r[0] * u}" height="${r[1] * u}" fill="${color}33" stroke="${color}" stroke-width="3"/>` + text(x + r[0] * u / 2, 120 + r[1] * u / 2 + 18, `${label}: ${r[0]} × ${r[1]}`, { size: 14 }); };
    const s = box(a, 20, "A", BLUE) + box(b, 200, "B", CORAL);
    const ans = val(a) > val(b) ? "A" : val(a) < val(b) ? "B" : "Eşit";
    return mc(rnd, askArea ? "Hangi dikdörtgenin alanı daha büyük?" : "Hangi dikdörtgenin çevresi daha uzun?", svg(s), ans, ["A", "B", "Eşit"]);
  };

  function generate(topicId, rnd, d = 2, wantNum = false) {
    const g = T[topicId] || T.islem;
    for (let i = 0; i < 20; i++) {
      const q = g(rnd, d, wantNum);
      if (q && (!wantNum || q.numeric)) return q;
    }
    return T.islem(rnd, d, true);
  }

  // Göz kararı oyunları: açı tahmini veya sayı doğrusunda yer bulma.
  const LINE_RANGE = { okuma: 1000000, basamak: 100000, sirala: 10000, islem: 1000 };
  function estimateKind(topicId) {
    if (["aci", "olcme", "cift", "dikme", "ucgen"].includes(topicId)) return "angle";
    if (LINE_RANGE[topicId]) return "line";
    return null;
  }

  root.MatArcadeGen = { generate, topics: Object.keys(T), estimateKind, LINE_RANGE, fmt, ri, pick, shuffle, P, sector, ray, dot, line, text, svg, rightMark, CORAL, BLUE, TEAL, INK, GOLD, GRAPE };
})(typeof window !== "undefined" ? window : globalThis);
