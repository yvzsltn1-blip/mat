/* 5. sınıf Anlat sekmesinin ileri adımları: dokunulan, izlenen ve kendi kendine oynayan modeller.
   Her konuda statik çizimler etkileşimli modele çevrilir ve yeni örnek adımları eklenir. */
(function (root) {
  "use strict";
  const M = root.MatImagine;
  const C = { blue: "#2c6bed", red: "#e25b45", green: "#1c8c74", ink: "#1b2430", gold: "#d89a12", sky: "#d9e6ff", mint: "#dff3ec", gray: "#c7cfd6", wood: "#a0662b" };
  const PALETTE = [C.blue, C.red, C.green, C.gold, "#7d55c7", "#e07a2f"];
  const LETTERS = "ABCDEFGHIJKL";

  const f1 = (n) => {
    const r = Math.round(n * 10) / 10;
    return (Number.isInteger(r) ? String(r) : String(r).replace(".", ","));
  };
  const group = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const svg = (body, label, h = 210) => `<svg class="scene pl-scene" viewBox="0 0 420 ${h}" role="img" aria-label="${label}">${body}</svg>`;
  const cap = (text) => `<p class="im-caption">${text}</p>`;
  const anim = (cls, d) => `class="${cls}" style="--d:${d || 0}s"`;
  const draw = (d) => `${anim("pl-draw", d)} pathLength="1"`;
  const line = (x1, y1, x2, y2, color, w, extra) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${color}" stroke-width="${w || 4}" stroke-linecap="round" ${extra || ""}/>`;
  const dot = (x, y, color, r, d) => `<circle ${anim("pl-pop", d)} cx="${f(x)}" cy="${f(y)}" r="${r || 6}" fill="${color}"/>`;
  const text = (x, y, t, opts) => {
    const o = opts || {};
    return `<text x="${f(x)}" y="${f(y)}" text-anchor="${o.anchor || "middle"}" font-size="${o.size || 16}" font-weight="${o.weight || 700}" fill="${o.color || C.ink}"${o.cls ? ` class="${o.cls}" style="--d:${o.d || 0}s"` : ""}>${t}</text>`;
  };
  function f(n) { return Math.round(n * 10) / 10; }
  // Matematik yönü: 0° sağ, açı saat yönünün tersine büyür; SVG'de y aşağı doğrudur.
  const pt = (cx, cy, deg, r) => [cx + r * Math.cos(deg * Math.PI / 180), cy - r * Math.sin(deg * Math.PI / 180)];
  function arcPath(cx, cy, r, from, to) {
    const sweep = to - from;
    if (sweep >= 359.9) return `M ${f(cx + r)} ${f(cy)} A ${r} ${r} 0 1 0 ${f(cx - r)} ${f(cy)} A ${r} ${r} 0 1 0 ${f(cx + r)} ${f(cy)}`;
    const [x1, y1] = pt(cx, cy, from, r);
    const [x2, y2] = pt(cx, cy, to, r);
    return `M ${f(x1)} ${f(y1)} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 0 ${f(x2)} ${f(y2)}`;
  }
  function sector(cx, cy, r, from, to) {
    const [x1, y1] = pt(cx, cy, from, r);
    const [x2, y2] = pt(cx, cy, to, r);
    return `M ${f(cx)} ${f(cy)} L ${f(x1)} ${f(y1)} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 0 ${f(x2)} ${f(y2)} Z`;
  }
  // Köşedeki iç açının dilimi: iki komşuya bakan yönler arasındaki küçük açı.
  function cornerSector(P, A, B, r) {
    let a = Math.atan2(P[1] - A[1], A[0] - P[0]) * 180 / Math.PI;
    let b = Math.atan2(P[1] - B[1], B[0] - P[0]) * 180 / Math.PI;
    let sweep = ((b - a) % 360 + 360) % 360;
    if (sweep > 180) { const t = a; a = b; b = t; sweep = 360 - sweep; }
    return { path: sector(P[0], P[1], r, a, a + sweep), mid: a + sweep / 2, size: sweep };
  }
  const square = (x, y, d1, d2, s, color) => {
    const [ax, ay] = pt(0, 0, d1, s);
    const [bx, by] = pt(0, 0, d2, s);
    return `<path ${anim("pl-pop", 0.6)} d="M ${f(x + ax)} ${f(y + ay)} L ${f(x + ax + bx)} ${f(y + ay + by)} L ${f(x + bx)} ${f(y + by)}" fill="none" stroke="${color || C.green}" stroke-width="3"/>`;
  };
  const range = (key, label, min, max, value, step) => ({ type: "range", key, label, min, max, value, step });
  const number = (key, label, min, max, value) => ({ type: "number", key, label, min, max, value });
  const choice = (key, label, value, options) => ({ type: "choice", key, label, value, options });
  const badges = (items) => `<div class="pl-badges">${items.map(([a, b]) => typeof a === "boolean" ? `<span class="${a ? "yes" : "no"}">${a ? "✓" : "✗"} ${b}</span>` : `<span class="yes" style="border-color:${b || C.blue};color:${b || C.ink}">${a}</span>`).join("")}</div>`;
  const chips = (items) => `<div class="pl-chips">${items.map(([on, t]) => `<span class="${on ? "on" : ""}">${t}</span>`).join("")}</div>`;
  const angleName = (d) => d === 0 ? "sıfır açı" : d < 90 ? "dar açı" : d === 90 ? "dik açı" : d < 180 ? "geniş açı" : d === 180 ? "doğru açı" : "tam açı";

  // Türkçe sayı okuma ve ayrılma eki (-dan/-den/-tan/-ten).
  const ONES = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
  const TENS = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];
  const GROUPS = ["", "bin", "milyon", "milyar"];
  function say3(n) {
    const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
    return [h ? (h === 1 ? "yüz" : ONES[h] + " yüz") : "", TENS[t], ONES[o]].filter(Boolean).join(" ");
  }
  function sayNumber(n) {
    n = Math.round(Math.abs(n));
    if (!n) return "sıfır";
    const parts = [];
    for (let g = 0; n > 0; g++, n = Math.floor(n / 1000)) {
      const chunk = n % 1000;
      if (!chunk) continue;
      parts.unshift(g === 1 && chunk === 1 ? "bin" : (say3(chunk) + (GROUPS[g] ? " " + GROUPS[g] : "")));
    }
    return parts.join(" ");
  }
  function ablative(n) {
    const word = sayNumber(n);
    const vowels = word.match(/[aıoueiöü]/g);
    const back = vowels && "aıou".includes(vowels[vowels.length - 1]);
    const hard = "çfhkpsşt".includes(word[word.length - 1]);
    return n + "’" + (hard ? "t" : "d") + (back ? "an" : "en");
  }

  const models = {};
  const add = (kind, spec) => { models[kind] = spec; };

  /* ---------- 01 Nokta, doğru parçası, ışın, doğru ---------- */
  add("im-points", {
    instruction: "Kâğıda nokta koy. Her noktaya büyük harfle bir ad ver.",
    controls: [range("n", "Nokta sayısı", 1, 6, 3)],
    demo: [{ n: 1 }, { n: 3 }, { n: 6 }],
    render(v) {
      const spots = [[80, 70], [200, 140], [320, 60], [130, 165], [360, 160], [250, 50]];
      let body = '<rect x="20" y="20" width="380" height="175" rx="12" fill="#fffdf6" stroke="#e3dccb"/>';
      for (let i = 0; i < v.n; i++) body += dot(spots[i][0], spots[i][1], PALETTE[i % 6], 7, i * 0.25) + text(spots[i][0] + 14, spots[i][1] - 10, LETTERS[i], { d: i * 0.25, cls: "pl-fade" });
      const names = LETTERS.slice(0, v.n).split("").join(", ");
      return svg(body, v.n + " nokta") + cap(`${v.n} nokta koydun: ${names}. Nokta yalnız bir yer gösterir; eni, boyu, kalınlığı yoktur. Bu yüzden büyük de olsa küçük de olsa nokta ölçülmez.`);
    }
  });

  add("im-ruler", {
    instruction: "B noktasını cetvel üzerinde kaydır. [AB] doğru parçasının uzunluğunu oku.",
    controls: [range("b", "B noktası (cm)", 1, 10, 5)],
    demo: [{ b: 3 }, { b: 7 }, { b: 10 }],
    render(v) {
      const x = (cm) => 40 + cm * 34;
      let ticks = "";
      for (let i = 0; i <= 10; i++) ticks += line(x(i), 130, x(i), 146, C.ink, 2) + text(x(i), 166, i, { size: 13 });
      for (let i = 0; i < 10; i++) ticks += line(x(i + 0.5), 130, x(i + 0.5), 139, C.ink, 1);
      const body = `<rect x="30" y="128" width="360" height="46" rx="6" fill="#fff4cf" stroke="${C.gold}"/>${ticks}
        <line ${draw(0)} x1="${x(0)}" y1="92" x2="${x(v.b)}" y2="92" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
        ${dot(x(0), 92, C.blue, 7)}${dot(x(v.b), 92, C.red, 7, 0.8)}
        ${text(x(0), 74, "A")}${text(x(v.b), 74, "B")}
        ${text(210, 40, `|AB| = ${v.b} cm`, { size: 22, color: C.green, cls: "pl-fade", d: 0.9 })}`;
      return svg(body, `AB doğru parçası ${v.b} cm`) + cap(`A, cetvelin 0 çizgisinde; B ise ${v.b} çizgisinde. İki ucu belli olduğu için uzunluğu ölçülür: |AB| = ${v.b} cm. [AB] ile [BA] aynı doğru parçasıdır.`);
    }
  });

  add("im-grow", {
    instruction: "Çizgiyi seç ve nasıl uzadığını izle. Cetvel hangisinde yetişebilir?",
    controls: [choice("mode", "Çizgi", "ray", [["segment", "Doğru parçası"], ["ray", "Işın"], ["line", "Doğru"]])],
    demo: [{ mode: "segment" }, { mode: "ray" }, { mode: "line" }],
    render(v) {
      const ruler = `<rect x="110" y="150" width="200" height="30" rx="5" fill="#fff4cf" stroke="${C.gold}"/>${[0, 1, 2, 3, 4, 5].map((i) => line(110 + i * 40, 150, 110 + i * 40, 162, C.ink, 2) + text(110 + i * 40, 176, i, { size: 12 })).join("")}`;
      let body = ruler, say = "";
      if (v.mode === "segment") {
        body += `<line ${draw(0)} x1="110" y1="110" x2="310" y2="110" stroke="${C.ink}" stroke-width="5"/>${dot(110, 110, C.blue)}${dot(310, 110, C.red, 6, 0.8)}${text(110, 92, "A")}${text(310, 92, "B")}${text(210, 50, "Cetvel yetti: 5 cm", { color: C.green, cls: "pl-fade", d: 1 })}`;
        say = "Doğru parçasının iki ucu var. Cetvel iki ucu da yakalar: [AB] = 5 cm.";
      } else if (v.mode === "ray") {
        body += `<line ${draw(0)} x1="110" y1="110" x2="400" y2="110" stroke="${C.ink}" stroke-width="5"/><polygon ${anim("pl-pop", 0.9)} points="408,110 390,101 390,119" fill="${C.ink}"/>${dot(110, 110, C.blue)}${text(110, 92, "A")}${text(345, 80, "∞ devam ediyor", { color: C.red, cls: "pl-pulse" })}${text(210, 50, "Cetvel bitti, ışın bitmedi!", { color: C.red, cls: "pl-fade", d: 1 })}`;
        say = "Işın A noktasından başlar ve ok yönünde hiç durmaz. Cetvel ne kadar uzun olsa da sonuna yetişemez: ışının uzunluğu ölçülemez.";
      } else {
        body += `<line ${draw(0)} x1="210" y1="110" x2="404" y2="110" stroke="${C.ink}" stroke-width="5"/><line ${draw(0)} x1="210" y1="110" x2="16" y2="110" stroke="${C.ink}" stroke-width="5"/><polygon ${anim("pl-pop", 0.9)} points="412,110 394,101 394,119" fill="${C.ink}"/><polygon ${anim("pl-pop", 0.9)} points="8,110 26,101 26,119" fill="${C.ink}"/>${text(70, 80, "← ∞", { color: C.red, cls: "pl-pulse" })}${text(350, 80, "∞ →", { color: C.red, cls: "pl-pulse" })}${text(210, 50, "İki yöne de sonsuz", { color: C.red, cls: "pl-fade", d: 1 })}`;
        say = "Doğrunun ne başı ne sonu vardır; iki yöne de sonsuza gider. Uzunluğu ölçülmez. Kâğıda yalnız bir parçasını çizip uçlarına ok koyarız.";
      }
      return svg(body, say) + cap(say);
    }
  });

  add("im-count-seg", {
    instruction: "Bir doğrunun üzerine nokta ekle. Her iki nokta bir doğru parçası yapar; kaç tane oldu?",
    controls: [range("n", "Nokta sayısı", 2, 6, 3)],
    demo: [{ n: 2 }, { n: 3 }, { n: 4 }, { n: 5 }],
    render(v) {
      const n = v.n, gap = 300 / (n - 1);
      const xs = Array.from({ length: n }, (_, i) => 60 + i * gap);
      let arcs = "", names = [], k = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const h = 22 + (j - i) * 24;
        arcs += `<path ${draw(k * 0.3)} d="M ${f(xs[i])} 160 Q ${f((xs[i] + xs[j]) / 2)} ${160 - h * 2} ${f(xs[j])} 160" fill="none" stroke="${PALETTE[k % 6]}" stroke-width="3"/>`;
        names.push(`[${LETTERS[i]}${LETTERS[j]}]`);
        k++;
      }
      const body = `<line x1="20" y1="160" x2="400" y2="160" stroke="${C.ink}" stroke-width="3"/><polygon points="408,160 392,152 392,168" fill="${C.ink}"/><polygon points="12,160 28,152 28,168" fill="${C.ink}"/>${arcs}${xs.map((x, i) => dot(x, 160, C.ink, 6) + text(x, 188, LETTERS[i])).join("")}`;
      return svg(body, `${n} noktadan ${k} doğru parçası`) + cap(`${n} nokta: ${names.join(", ")}. Toplam ${k} doğru parçası. Her noktayı diğerleriyle birer kez eşleştir; [AB] ile [BA] aynı parça olduğu için iki kez sayma.`);
    }
  });

  add("im-life", {
    instruction: "Çevremizdeki şeyleri geometri diliyle söyle. Bir örnek seç.",
    controls: [choice("mode", "Örnek", "star", [["star", "Yıldız"], ["laser", "El feneri"], ["pencil", "Kalem kenarı"], ["road", "Düz yol"]])],
    demo: [{ mode: "star" }, { mode: "laser" }, { mode: "pencil" }, { mode: "road" }],
    render(v) {
      const rows = {
        star: ['<rect x="20" y="20" width="380" height="175" rx="14" fill="#18223a"/>' + [[90, 60], [160, 120], [300, 70], [350, 150], [240, 40]].map(([x, y], i) => `<circle ${anim("pl-pop", i * 0.2)} cx="${x}" cy="${y}" r="${i === 1 ? 6 : 3}" fill="#fff4b0"/>`).join("") + text(160, 150, "A", { color: "#fff4b0" }), "Uzaktaki yıldız gökyüzünde küçücük bir iz gibi görünür. Bir yeri gösterir: nokta modeli."],
        laser: [`<text x="60" y="122" font-size="40">🔦</text><line ${draw(0.2)} x1="100" y1="108" x2="404" y2="108" stroke="#f3c623" stroke-width="7"/><polygon ${anim("pl-pop", 1)} points="412,108 394,98 394,118" fill="#f3c623"/>${text(250, 70, "Başlangıç var, bitiş yok", { color: C.red, cls: "pl-fade", d: 1 })}`, "Fenerin ışığı fenerden başlar ve ileri doğru gider. Bir başlangıcı var, sonu yok: ışın modeli."],
        pencil: [`<rect x="70" y="95" width="260" height="26" rx="4" fill="#ffd166" stroke="${C.wood}"/><polygon points="330,95 370,108 330,121" fill="#f1d5a8" stroke="${C.wood}"/><line ${draw(0.2)} x1="70" y1="95" x2="330" y2="95" stroke="${C.red}" stroke-width="5"/>${dot(70, 95, C.blue, 6, 0.9)}${dot(330, 95, C.blue, 6, 0.9)}${text(200, 70, "İki ucu belli", { color: C.red, cls: "pl-fade", d: 1 })}`, "Kalemin düz kenarının iki ucu bellidir. Cetvelle ölçebiliriz: doğru parçası modeli."],
        road: [`<polygon points="190,30 230,30 400,195 20,195" fill="#cfd6dc"/><line ${draw(0.2)} x1="210" y1="195" x2="210" y2="34" stroke="#fff" stroke-width="6" stroke-dasharray="14 12"/>${text(210, 24, "∞", { color: C.red, cls: "pl-pulse", size: 20 })}`, "Ufka kadar uzanan dümdüz bir yol, iki yöne de bitmeden uzandığını düşünürsek doğru modelidir. Gerçek yol bir yerde biter; doğru hiç bitmez."]
      };
      const [body, say] = rows[v.mode];
      return svg(body, say) + cap(say);
    }
  });

  /* ---------- 02 Açı ---------- */
  add("im-door", {
    instruction: "Kapıyı yavaş yavaş aç. Kapı ile duvar arasındaki açının adı nasıl değişiyor?",
    controls: [range("deg", "Kapının açıklığı", 0, 180, 40, 5)],
    demo: [{ deg: 30 }, { deg: 90 }, { deg: 140 }, { deg: 180 }],
    render(v) {
      const cx = 120, cy = 170;
      const [x, y] = pt(cx, cy, v.deg, 170);
      const right = v.deg === 90;
      const mark = right ? square(cx, cy, 0, 90, 22) : v.deg > 0 ? `<path ${draw(0.2)} d="${arcPath(cx, cy, 38, 0, v.deg)}" fill="none" stroke="#6554a4" stroke-width="3"/>` : "";
      const body = `<rect x="20" y="172" width="380" height="14" fill="#e6dccb"/>${line(cx, cy, 395, cy, C.ink, 6)}${line(cx, cy, x, y, C.wood, 10)}${dot(cx, cy, C.ink, 7)}${mark}
        ${text(300, 40, `${v.deg}°`, { size: 26, color: right ? C.green : C.ink })}${text(300, 66, angleName(v.deg), { size: 16, color: C.red })}`;
      const say = v.deg === 0 ? "Kapı kapalı. Kollar üst üste, açıklık yok." : `Kapı ${v.deg}° açık: bu bir ${angleName(v.deg)}. ${right ? "Küçük kare dik açıyı gösterir." : v.deg < 90 ? "Dik açıdan küçük olduğu için dar." : v.deg < 180 ? "Dik açıdan büyük, doğru açıdan küçük olduğu için geniş." : "Kapı duvarla bir çizgi oldu."}`;
      return svg(body, say) + cap(say);
    }
  });

  add("im-clock", {
    instruction: "Saati değiştir. Akrep ile yelkovan arasındaki küçük açıyı bul.",
    controls: [range("h", "Saat", 1, 11, 3)],
    demo: [{ h: 3 }, { h: 2 }, { h: 5 }, { h: 6 }],
    render(v) {
      const cx = 210, cy = 108, r = 88;
      const hourDeg = 90 - v.h * 30;
      const ang = Math.min(v.h * 30, 360 - v.h * 30);
      let face = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fffdf6" stroke="${C.ink}" stroke-width="4"/>`;
      for (let i = 1; i <= 12; i++) { const [x, y] = pt(cx, cy, 90 - i * 30, r - 16); face += text(x, y + 5, i, { size: 13 }); }
      const from = v.h <= 6 ? hourDeg : 90, to = v.h <= 6 ? 90 : hourDeg + 360;
      const marker = ang === 90 ? square(cx, cy, Math.min(90, hourDeg), Math.max(90, hourDeg), 18) : `<path ${anim("pl-fade", 0.4)} d="${sector(cx, cy, 44, from, to > from ? to : to + 360)}" fill="#6554a433"/>`;
      const [hx, hy] = pt(cx, cy, hourDeg, 52);
      const body = face + marker + line(cx, cy, cx, cy - 72, C.blue, 4) + `<line ${draw(0)} x1="${cx}" y1="${cy}" x2="${f(hx)}" y2="${f(hy)}" stroke="${C.red}" stroke-width="7" stroke-linecap="round"/>` + dot(cx, cy, C.ink, 5) + text(360, 40, `${ang}°`, { size: 24 }) + text(360, 64, angleName(ang), { size: 14, color: C.red });
      return svg(body, `Saat ${v.h}:00, ${ang} derece`) + cap(`Saat ${v.h}:00. Kadranda iki sayı arası 30°dir (360° ÷ 12). Akrep ile yelkovan arasında ${Math.min(v.h, 12 - v.h)} aralık var: ${Math.min(v.h, 12 - v.h)} × 30° = ${ang}°. Bu bir ${angleName(ang)}.`);
    }
  });

  /* ---------- 03 Çember ve daire ---------- */
  add("im-compass", {
    instruction: "Pergeli döndür. Sivri uç yerinde durur, kalem ucu çemberi çizer.",
    controls: [range("turn", "Pergelin dönüşü (°)", 30, 360, 360, 30)],
    demo: [{ turn: 90 }, { turn: 180 }, { turn: 270 }, { turn: 360 }],
    demoMs: 1800,
    render(v) {
      const cx = 210, cy = 112, r = 72;
      const [px, py] = pt(cx, cy, v.turn, r);
      const hx = (cx + px) / 2, hy = Math.min(cy, py) - 62;
      const body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.gray}" stroke-dasharray="4 6"/><path ${draw(0)} d="${arcPath(cx, cy, r, 0, v.turn)}" fill="none" stroke="${C.blue}" stroke-width="4"/>
        <line x1="${cx}" y1="${cy}" x2="${f(px)}" y2="${f(py)}" stroke="${C.green}" stroke-width="2" stroke-dasharray="5 4"/>
        ${line(cx, cy, hx, hy, "#6b7280", 5)}${line(hx, hy, px, py, "#6b7280", 5)}${dot(hx, hy, C.ink, 6)}${dot(px, py, C.red, 6)}${dot(cx, cy, C.ink, 5)}${text(cx - 14, cy + 22, "M")}
        ${text(360, 36, `${v.turn}°`, { size: 22 })}`;
      return svg(body, `Pergel ${v.turn} derece döndü`, 220) + cap(`Pergel ${v.turn}° döndü. ${v.turn < 360 ? "Çizgi henüz kapanmadı; dönmeye devam et." : "Tam tur! Çizgi kapandı ve bir çember oluştu."} Sivri uç hep M merkezinde, pergelin açıklığı hep aynı. Bu yüzden çizginin her noktası merkeze eşit uzaklıktadır: bu uzaklık yarıçaptır.`);
    }
  });

  add("im-friends", {
    instruction: "Öğretmen ortada. Öğrenciler ona hep aynı uzaklıkta dursun. Öğrenci ekledikçe ne şekil beliriyor?",
    controls: [range("n", "Öğrenci sayısı", 3, 24, 6)],
    demo: [{ n: 4 }, { n: 8 }, { n: 16 }, { n: 24 }],
    render(v) {
      const cx = 210, cy = 108, r = 82;
      let body = v.n >= 14 ? `<circle ${anim("pl-fade", 0.4)} cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.blue}" stroke-width="3"/>` : "";
      for (let i = 0; i < v.n; i++) {
        const [x, y] = pt(cx, cy, 90 + i * 360 / v.n, r);
        if (v.n <= 12) body += `<line x1="${cx}" y1="${cy}" x2="${f(x)}" y2="${f(y)}" stroke="${C.green}" stroke-width="1.5" stroke-dasharray="4 4"/>`;
        body += dot(x, y, PALETTE[i % 6], 7, i * 0.05);
      }
      body += `<text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="28">🧑‍🏫</text>`;
      return svg(body, `${v.n} öğrenci merkeze eşit uzaklıkta`, 220) + cap(`${v.n} öğrencinin her biri öğretmene aynı uzaklıkta. ${v.n >= 14 ? "Noktalar sıklaştı ve bir çember belirdi! Çember, merkeze eşit uzaklıktaki bütün noktalardır." : "Daha çok öğrenci ekle: noktalar sıklaştıkça bir şekil belirecek."} Öğretmen merkez, aradaki uzaklık yarıçaptır.`);
    }
  });

  add("im-ring", {
    instruction: "Çember ile daireyi ayır. Karınca nerede yürüyor, boya nereyi kaplıyor?",
    controls: [choice("mode", "Göster", "ring", [["ring", "Çember"], ["disk", "Daire"], ["both", "İkisi yan yana"]])],
    demo: [{ mode: "ring" }, { mode: "disk" }, { mode: "both" }],
    render(v) {
      const ring = (cx) => `<circle cx="${cx}" cy="105" r="70" fill="none" stroke="${C.blue}" stroke-width="6"/><text font-size="22">🐜<animateMotion dur="6s" repeatCount="indefinite" path="M ${cx + 70} 112 A 70 70 0 1 1 ${cx - 70} 112 A 70 70 0 1 1 ${cx + 70} 112"/></text>`;
      const disk = (cx) => `<circle ${anim("pl-pop", 0.2)} cx="${cx}" cy="105" r="70" fill="#f3c62399" stroke="${C.blue}" stroke-width="6"/><text x="${cx}" y="114" text-anchor="middle" font-size="26">🖌️</text>`;
      const rows = {
        ring: [ring(210), "Çember yalnız kenar çizgisidir. Karınca bu çizgide yürür; içi boştur. Yüzük, hulahop ve bisiklet tekerleğinin dış kenarı çember modelidir."],
        disk: [disk(210), "Daire, çember ile içindeki bölgenin tamamıdır. Boya bütün içi kaplar. Bozuk para, pizza ve yuvarlak masanın tablası daire modelidir."],
        both: [ring(110) + disk(310) + text(110, 200, "çember") + text(310, 200, "daire"), "Solda yalnız kenar var: çember. Sağda kenar ve iç bölge birlikte: daire. Her dairenin sınırı bir çemberdir."]
      };
      const [body, say] = rows[v.mode];
      return svg(body, say) + cap(say);
    }
  });

  add("im-chord", {
    instruction: "Çemberin iki noktasını birleştiren çizgiyi merkeze yaklaştır. En uzun ne zaman olur?",
    controls: [range("d", "Merkeze uzaklık", 0, 4, 3)],
    demo: [{ d: 4 }, { d: 2 }, { d: 0 }],
    render(v) {
      const cx = 210, cy = 105, u = 18, r = 5;
      const half = Math.sqrt(r * r - v.d * v.d);
      const y = cy - v.d * u;
      const len = 2 * half;
      const body = `<circle cx="${cx}" cy="${cy}" r="${r * u}" fill="none" stroke="${C.blue}" stroke-width="4"/>${dot(cx, cy, C.ink, 5)}${text(cx + 12, cy + 20, "M", { size: 13 })}
        ${v.d ? `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${f(y)}" stroke="${C.green}" stroke-width="2" stroke-dasharray="4 3"/>` : ""}
        <line ${draw(0)} x1="${f(cx - half * u)}" y1="${f(y)}" x2="${f(cx + half * u)}" y2="${f(y)}" stroke="${v.d ? C.red : C.green}" stroke-width="5"/>
        ${text(360, 40, `${f1(len)} birim`, { size: 20, color: v.d ? C.red : C.green })}`;
      return svg(body, `Çizgi uzunluğu ${f1(len)} birim`) + cap(v.d ? `Yarıçap 5 birim. Çizgi merkezden ${v.d} birim uzakta, uzunluğu yaklaşık ${f1(len)} birim. Merkeze yaklaştır: uzayacak.` : "Çizgi merkezden geçti: bu bir çap! Uzunluğu 10 birim, yani iki yarıçap. Çemberin iki noktasını birleştiren en uzun çizgi çaptır.");
    }
  });

  /* ---------- 04 Dikme ve düzlem ---------- */
  add("im-perp-ab", {
    instruction: "AB doğrusunun üstüne d doğrusunu koyduk. d’yi döndür ve dik kesiştiği anı yakala.",
    controls: [range("deg", "d doğrusunun açısı", 20, 160, 60, 5)],
    demo: [{ deg: 40 }, { deg: 130 }, { deg: 90 }],
    render(v) {
      const ox = 210, oy = 130, right = v.deg === 90;
      const [x1, y1] = pt(ox, oy, v.deg, 115), [x2, y2] = pt(ox, oy, v.deg + 180, 115);
      const color = right ? C.green : C.red;
      const marks = right
        ? square(ox, oy, 0, 90, 18) + square(ox, oy, 90, 180, 18) + square(ox, oy, 180, 270, 18) + square(ox, oy, 270, 360, 18)
        : `<path ${draw(0.3)} d="${arcPath(ox, oy, 30, 0, v.deg)}" fill="none" stroke="${C.blue}" stroke-width="3"/><path ${draw(0.5)} d="${arcPath(ox, oy, 40, v.deg, 180)}" fill="none" stroke="${C.gold}" stroke-width="3"/>` +
          text(...pt(ox, oy, v.deg / 2, 58), `${v.deg}°`, { color: C.blue, size: 15 }) + text(...pt(ox, oy, (v.deg + 180) / 2, 64), `${180 - v.deg}°`, { color: C.gold, size: 15 });
      const body = `${line(30, oy, 390, oy, C.ink, 4)}${dot(70, oy, C.ink, 5)}${dot(350, oy, C.ink, 5)}${text(70, oy + 26, "A")}${text(350, oy + 26, "B")}
        <line ${draw(0)} x1="${f(x2)}" y1="${f(y2)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${color}" stroke-width="5" stroke-linecap="round"/>${text(x1 + 12, y1 + 4, "d", { color, anchor: "start" })}
        ${dot(ox, oy, C.ink, 5)}${marks}${right ? text(330, 46, "d ⊥ AB", { size: 24, color: C.green, cls: "pl-pop", d: 0.6 }) : ""}`;
      return svg(body, right ? "d doğrusu AB doğrusuna dik" : `Açılar ${v.deg} ve ${180 - v.deg} derece`, 230) +
        cap(right ? "Yakaladın! d doğrusu AB’yi dik kesiyor. Kesişme noktasında dört açı oluştu ve dördü de 90°. Yazılışı: d ⊥ AB. Okunuşu: d doğrusu AB doğrusuna diktir." : `Yan yana iki açı oluştu: ${v.deg}° ve ${180 - v.deg}°. Toplamları 180° ama birbirine eşit değiller; bu yüzden d, AB’ye dik değil. İkisi de 90° olunca dik kesişirler.`);
    }
  });

  add("im-shortest", {
    instruction: "A noktasından kıyıya bir yol çiz. Yolun indiği yeri kaydır; en kısa yol hangisi?",
    controls: [range("x", "Yolun kıyıya değdiği yer", -6, 6, 4)],
    demo: [{ x: 6 }, { x: 3 }, { x: -2 }, { x: 0 }],
    render(v) {
      const ax = 210, ay = 50, gy = 150, u = 25;
      const len = Math.sqrt(16 + v.x * v.x);
      let ghosts = "";
      for (const g of [-6, -3, 3, 6]) ghosts += `<line x1="${ax}" y1="${ay}" x2="${ax + g * u}" y2="${gy}" stroke="${C.gray}" stroke-width="2" stroke-dasharray="4 4"/>`;
      const best = v.x === 0;
      const body = `<rect x="20" y="${gy}" width="380" height="45" fill="#bfe0f5"/>${line(20, gy, 400, gy, C.ink, 4)}${ghosts}
        <line ${draw(0)} x1="${ax}" y1="${ay}" x2="${ax + v.x * u}" y2="${gy}" stroke="${best ? C.green : C.red}" stroke-width="5" stroke-linecap="round"/>
        ${best ? square(ax, gy, 0, 90, 16) : ""}${dot(ax, ay, C.blue, 7)}${text(ax, ay - 14, "A")}${dot(ax + v.x * u, gy, best ? C.green : C.red, 6, 0.8)}
        ${text(345, 40, `${f1(len)} birim`, { size: 20, color: best ? C.green : C.red })}`;
      return svg(body, `Yol ${f1(len)} birim`) + cap(best ? "Yol kıyıya dik indi: 4 birim. Bundan daha kısa bir yol yok! Bir noktadan bir doğruya en kısa yol dikmedir." : `Bu yol yaklaşık ${f1(len)} birim. Dik yol yalnız 4 birim. Yolun indiği yeri dikmenin ayağına yaklaştır; yol kısalacak.`);
    }
  });

  add("im-gonye", {
    instruction: "Önce gözünle tahmin et: bu iki çizgi dik mi? Sonra gönyeyi köşeye koy.",
    controls: [choice("pick", "Çizim", "1", [["1", "1. çizim"], ["2", "2. çizim"], ["3", "3. çizim"], ["4", "4. çizim"]]),
      { type: "checks", key: "on", value: [], label: "Gönye", options: [["gonye", "Gönyeyi köşeye koy"]] }],
    demo: [{ pick: "2", on: [] }, { pick: "2", on: ["gonye"] }, { pick: "3", on: ["gonye"] }],
    render(v) {
      const cases = { 1: [0, 90], 2: [15, 78], 3: [-25, 90], 4: [10, 104] };
      const [base, ang] = cases[v.pick];
      const ox = 170, oy = 140;
      const [ax, ay] = pt(ox, oy, base, 200), [bx, by] = pt(ox, oy, base + ang, 120);
      const fits = ang === 90, on = v.on.includes("gonye");
      const [gx1, gy1] = pt(ox, oy, base, 90), [gx2, gy2] = pt(ox, oy, base + 90, 70);
      const tool = on ? `<polygon ${anim("pl-pop", 0)} points="${ox},${oy} ${f(gx1)},${f(gy1)} ${f(gx2)},${f(gy2)}" fill="${fits ? "#1c8c7433" : "#e25b4533"}" stroke="${fits ? C.green : C.red}" stroke-width="2"/>` +
        (fits ? square(ox, oy, base, base + 90, 16) : `<path ${draw(0.3)} d="${arcPath(ox, oy, 52, base + Math.min(90, ang), base + Math.max(90, ang))}" fill="none" stroke="${C.red}" stroke-width="5"/>`) : "";
      const body = `${line(ox, oy, ax, ay, C.ink, 4)}${line(ox, oy, bx, by, C.blue, 4)}${tool}${dot(ox, oy, C.ink, 5)}`;
      const say = !on ? "Tahminini söyle, sonra gönyeyi koyup kontrol et." : fits ? "Gönye tam oturdu! Açı 90°: bu iki çizgi diktir. Köşeye küçük kare çizeriz." : `Gönye oturmadı; arada kırmızı bir boşluk ya da taşma var. Açı ${ang}°, yani ${ang < 90 ? "dar" : "geniş"}. Bu çizgiler dik değildir.`;
      return svg(body, say) + cap(say);
    }
  });

  add("im-plane", {
    instruction: "Düzlemi büyüt. Kenarları nereye kadar gidiyor?",
    controls: [range("z", "Düzlemi genişlet", 1, 4, 1)],
    demo: [{ z: 1 }, { z: 2 }, { z: 3 }, { z: 4 }],
    demoMs: 1500,
    render(v) {
      const w = 90 + v.z * 45, h = 40 + v.z * 20, cx = 210, cy = 108, k = 40;
      const pts = `${cx - w + k},${cy - h} ${cx + w + k},${cy - h} ${cx + w - k},${cy + h} ${cx - w - k},${cy + h}`;
      const arrows = v.z === 4 ? ["←", "→", "↑", "↓"].map((a, i) => text([20, 400, 210, 210][i], [112, 112, 20, 208][i], a, { size: 22, color: C.red, cls: "pl-pulse" })).join("") : "";
      const body = `<polygon ${anim("pl-pop", 0)} points="${pts}" fill="#dff3ec" stroke="${C.green}" stroke-width="2" ${v.z === 4 ? 'stroke-dasharray="8 6"' : ""}/>${dot(cx - 40, cy - 8, C.red)}${text(cx - 40, cy - 18, "A", { size: 13 })}${line(cx - 10, cy + 18, cx + 80, cy - 6, C.blue, 3)}${arrows}`;
      return svg(body, "Düzlem modeli", 220) + cap(v.z < 4 ? "Masa, tahta ya da kâğıt düzlemin birer modelidir; üstüne nokta ve doğru çizebiliriz. Büyütmeye devam et." : "Gerçek düzlemin kenarı yoktur: her yöne sonsuza uzanır, kalınlığı da yoktur. Kâğıt yalnızca onun küçük bir parçasıdır.");
    }
  });

  /* ---------- 05 Paralel doğrular ---------- */
  add("im-rails", {
    instruction: "Alttaki rayı eğ ya da düzelt. İki yerdeki aralığı karşılaştır.",
    controls: [range("tilt", "Alttaki doğrunun eğimi", -8, 8, 5)],
    demo: [{ tilt: 6 }, { tilt: -4 }, { tilt: 0 }],
    render(v) {
      const slope = v.tilt * 0.02, yb = (x) => 150 + slope * (x - 210);
      const d1 = (yb(90) - 70) / 20, d2 = (yb(330) - 70) / 20;
      const par = v.tilt === 0;
      let hint = "";
      if (!par) {
        const side = slope > 0 ? 30 : 390;
        hint = text(side === 30 ? 70 : 350, 200, side === 30 ? "← bu yönde buluşurlar" : "bu yönde buluşurlar →", { size: 13, color: C.red, cls: "pl-pulse" });
      }
      const body = `${line(20, 70, 400, 70, C.blue, 5)}<line ${draw(0)} x1="20" y1="${f(yb(20))}" x2="400" y2="${f(yb(400))}" stroke="${par ? C.green : C.red}" stroke-width="5" stroke-linecap="round"/>
        ${[[90, d1], [330, d2]].map(([x, d], i) => `<line ${anim("pl-fade", 0.4 + i * 0.3)} x1="${x}" y1="70" x2="${x}" y2="${f(yb(x))}" stroke="${C.gold}" stroke-width="2.5" stroke-dasharray="5 4"/>` + text(x + 8, (70 + yb(x)) / 2 + 5, `${f1(d)} cm`, { anchor: "start", size: 14, cls: "pl-fade", d: 0.5 + i * 0.3 })).join("")}
        ${hint}${par ? text(210, 40, "d // k", { size: 22, color: C.green, cls: "pl-pop", d: 0.6 }) : ""}${text(405, 64, "d", { anchor: "end", color: C.blue })}${text(405, yb(400) - 8, "k", { anchor: "end" })}`;
      return svg(body, par ? "Paralel doğrular" : "Paralel olmayan doğrular") + cap(par ? "İki yerde de aralık 4 cm. Aralık hiç değişmiyor, doğrular hiç buluşmayacak: d ile k paraleldir. Yazılışı: d // k." : `Bir yerde ${f1(d1)} cm, öbür yerde ${f1(d2)} cm. Aralık değişiyorsa doğrular bir yanda birbirine yaklaşır ve uzatılınca kesişir. Bunlar paralel değil.`);
    }
  });

  add("im-transversal", {
    instruction: "İki paralel doğrunun üstünden üçüncü bir yol geçir. Kaç yerde keser?",
    controls: [range("deg", "Kesen doğrunun açısı", 30, 150, 60, 5)],
    demo: [{ deg: 45 }, { deg: 120 }, { deg: 90 }],
    render(v) {
      const cot = Math.cos(v.deg * Math.PI / 180) / Math.sin(v.deg * Math.PI / 180);
      const xAt = (y) => 210 + (110 - y) * cot;
      const p1 = [xAt(70), 70], p2 = [xAt(150), 150];
      const body = `${line(20, 70, 400, 70, C.blue, 5)}${line(20, 150, 400, 150, C.blue, 5)}
        <line ${draw(0)} x1="${f(xAt(20))}" y1="20" x2="${f(xAt(200))}" y2="200" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/>
        ${dot(p1[0], p1[1], C.ink, 6, 0.6)}${dot(p2[0], p2[1], C.ink, 6, 0.9)}
        <path ${anim("pl-fade", 1)} d="${sector(p1[0], p1[1], 26, 0, v.deg)}" fill="#d89a1255"/><path ${anim("pl-fade", 1.2)} d="${sector(p2[0], p2[1], 26, 0, v.deg)}" fill="#d89a1255"/>
        ${text(p1[0] + 36, p1[1] - 8, v.deg + "°", { anchor: "start", size: 13 })}${text(p2[0] + 36, p2[1] - 8, v.deg + "°", { anchor: "start", size: 13 })}`;
      return svg(body, "Paralelleri kesen doğru") + cap(`Kırmızı doğru iki paraleli de birer noktada kesti: toplam 2 kesişme noktası. Paralellerin kendisi hâlâ hiç buluşmuyor. İki kesişmede de aynı ${v.deg}°lik açı oluştu; çünkü paraleller aynı yönde uzanır.`);
    }
  });

  add("im-symbols", {
    instruction: "Bir durum seç. Çizimi gör, işaretiyle yaz ve sesli oku.",
    controls: [choice("mode", "Durum", "par", [["par", "Paralel //"], ["perp", "Dik ⊥"], ["cross", "Kesişen"]])],
    demo: [{ mode: "par" }, { mode: "perp" }, { mode: "cross" }],
    render(v) {
      const rows = {
        par: [`${line(40, 70, 380, 70, C.blue, 5)}${line(40, 140, 380, 140, C.red, 5)}${text(40, 58, "A")}${text(380, 58, "B")}${text(40, 165, "C")}${text(380, 165, "D")}`, "AB // CD", "AB doğrusu CD doğrusuna paraleldir. İki çizgi hiç buluşmaz."],
        perp: [`${line(40, 120, 380, 120, C.blue, 5)}<line ${draw(0)} x1="210" y1="20" x2="210" y2="195" stroke="${C.red}" stroke-width="5"/>${square(210, 120, 0, 90, 18)}${text(40, 108, "A")}${text(380, 108, "B")}${text(226, 34, "C", { anchor: "start" })}${text(226, 196, "D", { anchor: "start" })}`, "AB ⊥ CD", "AB doğrusu CD doğrusuna diktir. Kesiştikleri yerde dört dik açı vardır."],
        cross: [`${line(40, 50, 380, 170, C.blue, 5)}<line ${draw(0)} x1="40" y1="170" x2="380" y2="50" stroke="${C.red}" stroke-width="5"/>${dot(210, 110, C.ink, 6, 0.8)}${text(40, 40, "A")}${text(380, 188, "B")}${text(40, 192, "C")}${text(380, 40, "D")}`, "AB ∩ CD = {O}", "AB ile CD tek noktada kesişir ama dik değildir. Ne // ne de ⊥ yazılır."]
      };
      const [body, sym, say] = rows[v.mode];
      return svg(body + text(210, 30, sym, { size: 22, color: C.green, cls: "pl-pop", d: 0.5 }), say) + cap(`<b>${sym}</b> — ${say}`);
    }
  });

  add("im-through", {
    instruction: "Doğru çizmeyi dene. Bir noktadan kaç doğru geçer, iki noktadan kaç doğru geçer?",
    controls: [choice("mode", "Nokta", "one", [["one", "Bir nokta"], ["two", "İki nokta"]]), range("n", "Denediğin doğru", 1, 12, 5)],
    demo: [{ mode: "one", n: 3 }, { mode: "one", n: 12 }, { mode: "two", n: 6 }],
    render(v) {
      let body = "";
      if (v.mode === "one") {
        for (let i = 0; i < v.n; i++) {
          const a = i * 180 / v.n + 8;
          const [x1, y1] = pt(210, 108, a, 160), [x2, y2] = pt(210, 108, a + 180, 160);
          body += `<line ${draw(i * 0.12)} x1="${f(x2)}" y1="${f(y2)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${PALETTE[i % 6]}" stroke-width="3"/>`;
        }
        body += dot(210, 108, C.ink, 7) + text(226, 100, "A", { anchor: "start" });
        return svg(body, `${v.n} doğru A’dan geçiyor`) + cap(`${v.n} doğru çizdin ve hepsi A noktasından geçiyor. İstersen daha fazlasını da çizebilirsin; hiç bitmez. Bir noktadan sonsuz tane doğru geçer.`);
      }
      const A = [130, 140], B = [300, 70];
      const ok = Math.atan2(A[1] - B[1], B[0] - A[0]) * 180 / Math.PI;
      for (let i = 0; i < v.n; i++) {
        const right = i === v.n - 1;
        const a = right ? ok : ok + (i + 1) * 150 / v.n * (i % 2 ? 1 : -1) / 1.4;
        const [x1, y1] = pt(A[0], A[1], a, 300), [x2, y2] = pt(A[0], A[1], a + 180, 300);
        body += `<line ${draw(i * 0.25)} x1="${f(x2)}" y1="${f(y2)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${right ? C.green : C.red}" stroke-width="${right ? 5 : 2}" ${right ? "" : 'opacity=".55"'}/>`;
      }
      body += dot(A[0], A[1], C.ink, 7) + dot(B[0], B[1], C.ink, 7) + text(A[0] - 14, A[1] + 22, "A") + text(B[0] + 14, B[1] - 12, "B");
      return svg(body, "İki noktadan tek doğru") + cap(`A’dan ${v.n} doğru denedin. Bunlardan B’den de geçen yalnız 1 tane var (yeşil). İki noktadan yalnız bir doğru geçer. A ile B arasındaki en kısa yol da bu doğrunun [AB] parçasıdır.`);
    }
  });

  add("im-letters", {
    instruction: "Bir harf seç. Paralel çizgiler maviyle, dik köşeler yeşil kareyle gösterilir.",
    controls: [choice("ch", "Harf", "E", [["E", "E"], ["H", "H"], ["L", "L"], ["T", "T"], ["Z", "Z"], ["N", "N"]])],
    demo: [{ ch: "H" }, { ch: "E" }, { ch: "Z" }, { ch: "T" }],
    render(v) {
      const shapes = {
        E: [[0, 0, 0, 4], [0, 0, 3, 0], [0, 2, 2.4, 2], [0, 4, 3, 4]], H: [[0, 0, 0, 4], [3, 0, 3, 4], [0, 2, 3, 2]], L: [[0, 0, 0, 4], [0, 4, 3, 4]],
        T: [[0, 0, 4, 0], [2, 0, 2, 4]], Z: [[0, 0, 3, 0], [3, 0, 0, 4], [0, 4, 3, 4]], N: [[0, 4, 0, 0], [0, 0, 3, 4], [3, 4, 3, 0]]
      };
      const segs = shapes[v.ch];
      const u = 38, w = Math.max(...segs.flatMap((s) => [s[0], s[2]])), ox = 210 - w * u / 2, oy = 30;
      const P = ([x, y]) => [ox + x * u, oy + y * u];
      const dir = (s) => [s[2] - s[0], s[3] - s[1]];
      const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
      const onSeg = (p, s) => Math.abs(cross([p[0] - s[0], p[1] - s[1]], dir(s))) < 1e-9 && p[0] >= Math.min(s[0], s[2]) - 1e-9 && p[0] <= Math.max(s[0], s[2]) + 1e-9 && p[1] >= Math.min(s[1], s[3]) - 1e-9 && p[1] <= Math.max(s[1], s[3]) + 1e-9;
      const parallel = new Set();
      let pairs = 0, corners = "", right = 0;
      for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
        const a = dir(segs[i]), b = dir(segs[j]);
        if (Math.abs(cross(a, b)) < 1e-9) { pairs++; parallel.add(i); parallel.add(j); continue; }
        if (Math.abs(a[0] * b[0] + a[1] * b[1]) > 1e-9) continue;
        const t = cross([segs[j][0] - segs[i][0], segs[j][1] - segs[i][1]], b) / cross(a, b);
        const hit = [segs[i][0] + a[0] * t, segs[i][1] + a[1] * t];
        if (!onSeg(hit, segs[i]) || !onSeg(hit, segs[j])) continue;
        right++;
        const [hx, hy] = P(hit);
        // Kare, kesişme noktasından iki çizginin gittiği yönlere doğru çizilir.
        const away = (seg, d) => (hit[0] === seg[2] && hit[1] === seg[3]) ? [-d[0], -d[1]] : d;
        const ua = away(segs[i], a), ub = away(segs[j], b);
        const sa = Math.atan2(-ua[1], ua[0]) * 180 / Math.PI, sb = Math.atan2(-ub[1], ub[0]) * 180 / Math.PI;
        corners += square(hx, hy, sa, sb, 22);
      }
      const body = segs.map((s, i) => { const [x1, y1] = P([s[0], s[1]]), [x2, y2] = P([s[2], s[3]]); return `<line ${draw(i * 0.25)} x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${parallel.has(i) ? C.blue : C.gray}" stroke-width="12" stroke-linecap="round"/>`; }).join("") + corners;
      const parText = pairs ? `${pairs} çift paralel çizgi (mavi)` : "paralel çizgi yok";
      const rightText = right ? `${right} yerde dik kesişme (yeşil kare)` : "dik kesişme yok";
      return svg(body, `${v.ch} harfi`, 200) + cap(`${v.ch} harfinde ${parText} ve ${rightText} var.${v.ch === "Z" || v.ch === "N" ? " Eğik çizgi ne paralel ne de dik." : ""}`);
    }
  });

  /* ---------- 06 Açı ölçme ---------- */
  add("im-turns", {
    instruction: "Bir dönüş seç. Kırmızı kol dönerken kaç derece taradığını izle.",
    controls: [choice("t", "Dönüş", "90", [["90", "Çeyrek tur"], ["180", "Yarım tur"], ["270", "Üç çeyrek"], ["360", "Tam tur"]])],
    demo: [{ t: "90" }, { t: "180" }, { t: "270" }, { t: "360" }],
    demoMs: 1800,
    render(v) {
      const t = Number(v.t), cx = 210, cy = 110, r = 80;
      const names = { 90: "Çeyrek tur", 180: "Yarım tur", 270: "Üç çeyrek tur", 360: "Tam tur" };
      const [x, y] = pt(cx, cy, t, r + 10);
      let quarters = "";
      for (let q = 0; q < t / 90; q++) quarters += `<path ${anim("pl-fade", 0.3 + q * 0.3)} d="${sector(cx, cy, r, q * 90, q * 90 + 90)}" fill="${PALETTE[q]}33"/>` + text(...pt(cx, cy, q * 90 + 45, r * 0.62), "90°", { size: 13, cls: "pl-fade", d: 0.3 + q * 0.3 });
      const body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.gray}" stroke-dasharray="3 5"/>${quarters}${line(cx, cy, cx + r + 10, cy, C.ink, 4)}<path ${draw(0)} d="${arcPath(cx, cy, r, 0, t)}" fill="none" stroke="${C.red}" stroke-width="4"/>${line(cx, cy, x, y, C.red, 4)}${dot(cx, cy, C.ink, 5)}${text(360, 36, t + "°", { size: 24 })}`;
      return svg(body, names[t], 220) + cap(`${names[t]} = ${t}°. Bu ${t / 90} dik açı eder: ${Array(t / 90).fill("90°").join(" + ")} = ${t}°. Tam tur 360 eş parçaya bölünür; her parça 1 derecedir.`);
    }
  });

  add("im-arm", {
    instruction: "Sağdaki açının kollarını uzat. Açının ölçüsü değişiyor mu?",
    controls: [range("len", "Sağ açının kol uzunluğu", 1, 5, 4), range("deg", "İki açının ölçüsü", 10, 170, 40, 5)],
    demo: [{ len: 1, deg: 40 }, { len: 5, deg: 40 }, { len: 5, deg: 120 }],
    render(v) {
      const one = (cx, L, color) => { const [x, y] = pt(cx, 170, v.deg, L); return `${line(cx, 170, cx + L, 170, C.ink, 4)}<line ${draw(0)} x1="${cx}" y1="170" x2="${f(x)}" y2="${f(y)}" stroke="${color}" stroke-width="4" stroke-linecap="round"/><path d="${arcPath(cx, 170, 24, 0, v.deg)}" fill="none" stroke="#6554a4" stroke-width="3"/>${text(cx + 30, 158, v.deg + "°", { size: 13, anchor: "start" })}${dot(cx, 170, C.ink, 4)}`; };
      const L = 40 + v.len * 26;
      const body = one(v.deg > 90 ? 120 : 50, 60, C.blue) + one(v.deg > 90 ? 330 : 230, L, C.red) + text(v.deg > 90 ? 120 : 80, 200, "kısa kollar", { size: 12 }) + text(v.deg > 90 ? 330 : 300, 200, "uzun kollar", { size: 12 });
      return svg(body, "Kolları farklı iki eş açı", 210) + cap(`İki açı da ${v.deg}°: bunlar eş açılardır. Kolları uzatmak açıyı büyütmez; açıyı kolların ne kadar döndüğü belirler. Açıölçerde de kol uzasa okunan sayı aynı kalır.`);
    }
  });

  add("im-protractor", {
    instruction: "Açıölçerde iki sıra sayı var. Kol hangi 0’dan başlıyorsa o sırayı oku.",
    controls: [range("deg", "Açının ölçüsü", 0, 180, 50, 10), choice("side", "Sabit kol", "right", [["right", "Sağdaki 0’da"], ["left", "Soldaki 0’da"]])],
    demo: [{ deg: 50, side: "right" }, { deg: 50, side: "left" }, { deg: 130, side: "right" }],
    render(v) {
      const cx = 210, cy = 180, R = 160;
      let ticks = "";
      for (let t = 0; t <= 180; t += 10) {
        const [x1, y1] = pt(cx, cy, t, R - (t % 30 ? 10 : 18)), [x2, y2] = pt(cx, cy, t, R);
        ticks += line(x1, y1, x2, y2, C.ink, 1.5);
        if (t % 30 === 0) {
          ticks += text(...pt(cx, cy, t, R - 30).map((n, i) => n + (i ? 5 : 0)), t, { size: 12, color: v.side === "right" ? C.green : "#8a96a3" });
          ticks += text(...pt(cx, cy, t, R - 52).map((n, i) => n + (i ? 5 : 0)), 180 - t, { size: 11, color: v.side === "left" ? C.green : "#8a96a3" });
        }
      }
      const fixed = v.side === "right" ? 0 : 180, moving = v.side === "right" ? v.deg : 180 - v.deg;
      const [fx, fy] = pt(cx, cy, fixed, R + 6), [mx, my] = pt(cx, cy, moving, R + 6);
      const wrong = 180 - v.deg;
      const body = `<path d="${arcPath(cx, cy, R, 0, 180)} Z" fill="#fff8e1" stroke="${C.gold}" stroke-width="2"/>${ticks}${line(cx, cy, fx, fy, C.ink, 4)}<line ${draw(0)} x1="${cx}" y1="${cy}" x2="${f(mx)}" y2="${f(my)}" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/>${dot(cx, cy, C.blue, 5)}`;
      const row = v.side === "right" ? "dış" : "iç";
      return svg(body, `${v.deg} derece`, 200) + cap(`Sabit kol ${v.side === "right" ? "sağdaki" : "soldaki"} 0 çizgisinde, bu yüzden ${row} sıradaki sayılar okunur (yeşil): açı ${v.deg}°. ${v.deg === 90 ? "90°de iki sıra aynı sayıyı gösterir." : `Öbür sıradaki ${wrong} sayısını okumak sık yapılan bir hatadır. Açının dar mı geniş mi olduğuna bakarak kontrol et.`}`);
    }
  });

  /* ---------- 07 Doğruların durumları ---------- */
  add("im-lines2", {
    instruction: "Kırmızı doğruyu kaydır ya da eğ. Mavi doğruyla kaç ortak noktası var?",
    controls: [choice("dir", "Yön", "same", [["same", "Aynı yönde"], ["tilt", "Eğik"]]), range("gap", "Aradaki uzaklık", 0, 4, 2)],
    demo: [{ dir: "same", gap: 3 }, { dir: "same", gap: 0 }, { dir: "tilt", gap: 2 }],
    render(v) {
      const y0 = 70 + v.gap * 25;
      let red, say;
      if (v.dir === "tilt") {
        const slope = 0.4, x = 210 + (70 - y0) / slope;
        red = `<line ${draw(0)} x1="20" y1="${f(y0 + slope * (20 - 210))}" x2="400" y2="${f(y0 + slope * (400 - 210))}" stroke="${C.red}" stroke-width="5"/>${dot(x, 70, C.ink, 7, 0.8)}`;
        say = "Kırmızı doğru eğik: mavi doğruyu tam 1 noktada kesiyor. Bunlar kesişen doğrulardır.";
      } else if (v.gap === 0) {
        red = `<line ${draw(0)} x1="20" y1="70" x2="400" y2="70" stroke="${C.red}" stroke-width="4" stroke-dasharray="14 10"/>`;
        say = "Kırmızı doğru mavinin tam üstüne geldi. Bütün noktaları ortak: bunlar çakışık doğrulardır. Uzaktan tek bir doğru gibi görünür.";
      } else {
        red = `<line ${draw(0)} x1="20" y1="${y0}" x2="400" y2="${y0}" stroke="${C.red}" stroke-width="5"/>`;
        say = `Aynı yönde, aralarında ${v.gap} birim var. Hiç ortak noktaları yok: bunlar paralel doğrulardır. Aralığı 0 yaparsan çakışırlar.`;
      }
      const count = v.dir === "tilt" ? "1 ortak nokta" : v.gap === 0 ? "sonsuz ortak nokta" : "0 ortak nokta";
      return svg(line(20, 70, 400, 70, C.blue, 7) + red + text(330, 196, count, { size: 16, color: C.green }), say) + cap(say);
    }
  });

  add("im-three", {
    instruction: "Üç doğrunun duruşunu seç. Kaç kesişme noktası oluşuyor?",
    controls: [choice("mode", "Durum", "tri", [["par", "Üçü paralel"], ["one", "Tek noktada"], ["tri", "İkişer ikişer"], ["two", "İkisi paralel"]])],
    demo: [{ mode: "par" }, { mode: "two" }, { mode: "tri" }, { mode: "one" }],
    render(v) {
      const L = (x1, y1, x2, y2, c, d) => `<line ${draw(d)} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`;
      const rows = {
        par: [L(30, 50, 390, 50, C.blue, 0) + L(30, 105, 390, 105, C.red, 0.2) + L(30, 160, 390, 160, C.green, 0.4), [], "Üç doğru da paralel: hiç kesişme noktası yok (0)."],
        one: [L(40, 40, 380, 180, C.blue, 0) + L(40, 180, 380, 40, C.red, 0.2) + L(210, 15, 210, 200, C.green, 0.4), [[210, 110]], "Üçü de aynı noktadan geçiyor: 1 kesişme noktası."],
        tri: [L(30, 170, 390, 170, C.blue, 0) + L(60, 200, 260, 20, C.red, 0.2) + L(160, 20, 360, 200, C.green, 0.4), [[227, 50], [93, 170], [327, 170]], "İkişer ikişer kesişiyorlar: 3 kesişme noktası. Aralarında bir üçgen oluştu!"],
        two: [L(30, 70, 390, 70, C.blue, 0) + L(30, 150, 390, 150, C.red, 0.2) + L(120, 20, 300, 200, C.green, 0.4), [[170, 70], [250, 150]], "İkisi paralel, üçüncüsü onları kesiyor: 2 kesişme noktası. Üçüncü doğruya kesen denir."]
      };
      const [body, pts, say] = rows[v.mode];
      return svg(body + pts.map(([x, y], i) => dot(x, y, C.ink, 7, 0.8 + i * 0.25)).join(""), say) + cap(say);
    }
  });

  /* ---------- 08 Tümler ve bütünler ---------- */
  add("im-ladder", {
    instruction: "Merdiveni duvara daya ve eğimini değiştir. Hangi açılar birbirini tamamlıyor?",
    controls: [range("deg", "Merdivenin yerle açısı", 20, 80, 60, 5)],
    demo: [{ deg: 45 }, { deg: 70 }, { deg: 30 }],
    render(v) {
      const wx = 300, gy = 180, L = 165;
      const fx = wx - L * Math.cos(v.deg * Math.PI / 180), ty = gy - L * Math.sin(v.deg * Math.PI / 180);
      const body = `<rect x="${wx}" y="20" width="22" height="${gy - 20}" fill="#e6dccb"/>${line(20, gy, 400, gy, C.ink, 4)}${square(wx, gy, 90, 180, 14)}
        <line ${draw(0)} x1="${f(fx)}" y1="${gy}" x2="${wx}" y2="${f(ty)}" stroke="${C.wood}" stroke-width="8" stroke-linecap="round"/>
        <path d="${sector(fx, gy, 34, 0, v.deg)}" fill="#2c6bed44"/>${text(fx + 44, gy - 10, v.deg + "°", { size: 14, color: C.blue, anchor: "start" })}
        <path d="${sector(fx, gy, 26, v.deg, 180)}" fill="#d89a1244"/>${text(fx - 34, gy - 12, (180 - v.deg) + "°", { size: 14, color: C.gold, anchor: "end" })}
        <path d="${sector(wx, ty, 30, 180 + v.deg, 270)}" fill="#1c8c7444"/>${text(wx - 10, ty + 48, (90 - v.deg) + "°", { size: 14, color: C.green, anchor: "end" })}`;
      return svg(body, "Duvara dayalı merdiven") + cap(`Yerle açı ${v.deg}° (mavi). Duvar yere dik olduğu için merdivenin duvarla açısı ${90 - v.deg}° (yeşil): ${v.deg}° + ${90 - v.deg}° = 90°, bunlar tümler. Merdivenin ayağında öbür yandaki açı ${180 - v.deg}° (sarı): ${v.deg}° + ${180 - v.deg}° = 180°, bunlar bütünler.`);
    }
  });

  /* ---------- 09 Çokgenler ---------- */
  const polyPts = (n, cx, cy, r) => Array.from({ length: n }, (_, i) => pt(cx, cy, 90 + i * 360 / n + (n % 2 ? 0 : 180 / n), r));
  const POLY = { 3: "Üçgen", 4: "Dörtgen", 5: "Beşgen", 6: "Altıgen", 7: "Yedigen", 8: "Sekizgen" };
  add("im-build-poly", {
    instruction: "Kenar sayısını seç ve şeklin kenar kenar çizilmesini izle.",
    controls: [range("n", "Kenar sayısı", 3, 8, 4)],
    demo: [{ n: 3 }, { n: 4 }, { n: 5 }, { n: 6 }],
    render(v) {
      const P = polyPts(v.n, 210, 112, 85);
      let body = "";
      for (let i = 0; i < v.n; i++) {
        const a = P[i], b = P[(i + 1) % v.n];
        body += `<line ${draw(i * 0.3)} x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${PALETTE[i % 6]}" stroke-width="5" stroke-linecap="round"/>`;
      }
      P.forEach((p, i) => {
        const [lx, ly] = [210 + (p[0] - 210) * 1.2, 112 + (p[1] - 112) * 1.2];
        body += dot(p[0], p[1], C.ink, 6, i * 0.3 + 0.2) + text(lx, ly + 5, LETTERS[i], { size: 14, cls: "pl-fade", d: i * 0.3 + 0.2 });
      });
      return svg(body, POLY[v.n], 225) + cap(`${POLY[v.n]}: ${v.n} kenar, ${v.n} köşe (${LETTERS.slice(0, v.n).split("").join(", ")}) ve ${v.n} iç açı. Bir kenar eklersen üç sayı birlikte bir artar. Şeklin adı ${POLY[v.n].toLocaleLowerCase("tr")}.`);
    }
  });

  add("im-closed", {
    instruction: "Hangisi çokgendir? Bir şekil seç ve nedenini oku.",
    controls: [choice("mode", "Şekil", "open", [["open", "1"], ["curve", "2"], ["cross", "3"], ["poly", "4"]])],
    demo: [{ mode: "open" }, { mode: "curve" }, { mode: "cross" }, { mode: "poly" }],
    render(v) {
      const rows = {
        open: [`<path ${draw(0)} d="M 110 170 L 150 50 L 280 60 L 320 160" fill="none" stroke="${C.red}" stroke-width="5"/>${dot(110, 170, C.red, 7, 1)}${dot(320, 160, C.red, 7, 1)}`, false, "Uçlar birleşmiyor; şekil kapalı değil. Bu bir çokgen değildir."],
        curve: [`<path ${draw(0)} d="M 120 170 L 300 170 Q 330 60 210 40 L 120 170 Z" fill="#e25b4522" stroke="${C.red}" stroke-width="5"/>`, false, "Kapalı ama bir kenarı eğri. Çokgenin bütün kenarları doğru parçası olmalıdır. Çokgen değildir."],
        cross: [`<path ${draw(0)} d="M 110 60 L 310 170 L 310 60 L 110 170 Z" fill="none" stroke="${C.red}" stroke-width="5"/>`, false, "Kenarlar köşeler dışında birbirini kesiyor. Böyle kendini kesen şekiller çokgen sayılmaz."],
        poly: [`<path ${draw(0)} d="M 140 170 L 290 170 L 330 90 L 210 35 L 95 95 Z" fill="#1c8c7422" stroke="${C.green}" stroke-width="5"/>`, true, "Kapalı, bütün kenarları doğru parçası ve kenarlar yalnız köşelerde buluşuyor. Bu bir çokgendir: 5 kenarlı, yani beşgen."]
      };
      const [body, ok, say] = rows[v.mode];
      return svg(body + text(320, 40, ok ? "✓ çokgen" : "✗ çokgen değil", { size: 17, color: ok ? C.green : C.red, cls: "pl-pop", d: 1 }), say) + cap(say);
    }
  });

  add("im-regular", {
    instruction: "Bir şekil seç. Kenarlar eşit mi, açılar eşit mi? İkisi de eşitse düzgün çokgendir.",
    controls: [choice("mode", "Şekil", "rect", [["sq", "Kare"], ["rect", "Dikdörtgen"], ["rh", "Eşkenar dörtgen"], ["tri", "Eşkenar üçgen"], ["hex", "Düzgün altıgen"]])],
    demo: [{ mode: "rect" }, { mode: "rh" }, { mode: "sq" }, { mode: "hex" }],
    render(v) {
      const shapes = {
        sq: [[[140, 40], [280, 40], [280, 180], [140, 180]], true, true, "Kare"],
        rect: [[[90, 60], [330, 60], [330, 170], [90, 170]], false, true, "Dikdörtgen"],
        rh: [[[210, 25], [300, 108], [210, 191], [120, 108]], true, false, "Eşkenar dörtgen"],
        tri: [polyPts(3, 210, 120, 90), true, true, "Eşkenar üçgen"],
        hex: [polyPts(6, 210, 108, 85), true, true, "Düzgün altıgen"]
      };
      const [P, sides, angles, name] = shapes[v.mode];
      const n = P.length;
      let marks = "";
      for (let i = 0; i < n; i++) {
        const a = P[i], b = P[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / len * 7, ny = (b[0] - a[0]) / len * 7;
        const ticks = sides ? 1 : (v.mode === "rect" ? (i % 2 ? 2 : 1) : 1);
        for (let k = 0; k < ticks; k++) {
          const sh = (k - (ticks - 1) / 2) * 6, tx = (b[0] - a[0]) / len * sh, ty = (b[1] - a[1]) / len * sh;
          marks += line(mx + tx - nx, my + ty - ny, mx + tx + nx, my + ty + ny, C.ink, 2.5);
        }
        const c = cornerSector(P[i], P[(i + n - 1) % n], P[(i + 1) % n], 20);
        marks += `<path ${anim("pl-fade", 0.6 + i * 0.1)} d="${c.path}" fill="${angles ? "#1c8c7455" : (i % 2 ? "#d89a1277" : "#2c6bed55")}"/>`;
      }
      const body = `<polygon ${anim("pl-pop", 0)} points="${P.map((p) => p.map(f).join(",")).join(" ")}" fill="#eef3f8" stroke="${C.blue}" stroke-width="4"/>${marks}`;
      const ok = sides && angles;
      return svg(body, name, 215) + badges([[sides, "Kenarlar eşit"], [angles, "Açılar eşit"], [ok, "Düzgün çokgen"]]) + cap(`${name}: ${sides ? "bütün kenarlar eşit (aynı çentik)" : "kenarlar eşit değil (farklı çentik)"}, ${angles ? "bütün açılar eşit (aynı renk)" : "açılar eşit değil (farklı renk)"}. ${ok ? "İkisi de eşit olduğu için düzgün çokgendir." : "İki koşuldan biri eksik; düzgün çokgen değildir."}`);
    }
  });

  /* ---------- 10 Üçgenler ---------- */
  const triAngles = (A, B, Cc) => {
    const ang = (P, Q, R) => {
      const a = [Q[0] - P[0], Q[1] - P[1]], b = [R[0] - P[0], R[1] - P[1]];
      return Math.acos((a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b))) * 180 / Math.PI;
    };
    const a = Math.round(ang(A, B, Cc)), b = Math.round(ang(B, A, Cc));
    return [a, b, 180 - a - b];
  };
  const triKind = (angles) => { const m = Math.max(...angles); return m === 90 ? "dik üçgen" : m > 90 ? "geniş açılı üçgen" : "dar açılı üçgen"; };

  add("im-tri-shape", {
    instruction: "Üçgenin tepesini sağa sola ve yukarı aşağı kaydır. En büyük açıya bak.",
    controls: [range("k", "Tepenin yatay yeri", 0, 19, 9), range("h", "Tepenin yüksekliği", 1, 4, 4)],
    demo: [{ k: 9, h: 4 }, { k: 3, h: 3 }, { k: 7, h: 3 }, { k: 1, h: 2 }],
    render(v) {
      const A = [80, 180], B = [340, 180], T = [20 + v.k * 20, 180 - v.h * 40];
      const [a, b, c] = triAngles(A, B, T);
      const kind = triKind([a, b, c]), max = Math.max(a, b, c);
      let marks = "";
      [[A, B, T, a], [B, A, T, b], [T, A, B, c]].forEach(([P, Q, R, d], i) => {
        const s = cornerSector(P, Q, R, 26);
        const hot = d === max;
        marks += d === 90 ? `<path d="${s.path}" fill="#1c8c7455"/>` : `<path d="${s.path}" fill="${hot ? (d > 90 ? "#e25b4566" : "#2c6bed44") : "#c7cfd666"}"/>`;
        marks += text(...pt(P[0], P[1], s.mid, 44), d + "°", { size: 14, color: hot ? C.red : C.ink, cls: "pl-fade", d: 0.3 + i * 0.15 });
      });
      const body = `<polygon ${anim("pl-pop", 0)} points="${[A, B, T].map((p) => p.join(",")).join(" ")}" fill="#eef3f8" stroke="${C.blue}" stroke-width="4" stroke-linejoin="round"/>${marks}`;
      return svg(body, kind, 215) + cap(`Açılar ${a}°, ${b}° ve ${c}°; toplam yine 180°. En büyük açı ${max}°, ${max === 90 ? "tam dik" : max > 90 ? "geniş" : "dar"}. Bu yüzden bu bir ${kind}. ${max >= 90 ? "Bir üçgende ikinci bir dik ya da geniş açıya yer kalmaz." : "Üç açısı da dar."}`);
    }
  });

  add("im-tear", {
    instruction: "Üçgenin köşelerini kes ve bir doğru üzerinde yan yana diz. Ne oluşuyor?",
    controls: [choice("step", "Adım", "tri", [["tri", "1. Üçgen"], ["cut", "2. Köşeleri kes"], ["line", "3. Yan yana diz"]]), range("k", "Üçgenin şekli", 0, 3, 0)],
    demo: [{ step: "tri" }, { step: "cut" }, { step: "line" }, { step: "line", k: 2 }],
    render(v) {
      const shapes = [[[70, 180], [350, 180], [240, 50]], [[60, 180], [360, 180], [110, 70]], [[90, 180], [330, 180], [300, 110]], [[80, 180], [300, 180], [80, 60]]];
      const [A, B, T] = shapes[v.k];
      const [a, b, c] = triAngles(A, B, T);
      const cols = ["#e25b45aa", "#2c6bedaa", "#1c8c74aa"];
      let body = "";
      if (v.step !== "line") {
        body += `<polygon points="${[A, B, T].map((p) => p.join(",")).join(" ")}" fill="${v.step === "cut" ? "none" : "#eef3f8"}" stroke="${C.blue}" stroke-width="3" ${v.step === "cut" ? 'stroke-dasharray="6 5"' : ""}/>`;
        [[A, B, T], [B, A, T], [T, A, B]].forEach(([P, Q, R], i) => {
          const s = cornerSector(P, Q, R, 34);
          const [dx, dy] = v.step === "cut" ? pt(0, 0, s.mid + 180, 14) : [0, 0];
          body += `<g transform="translate(${f(dx)} ${f(dy)})"><path ${anim("pl-pop", i * 0.25)} d="${s.path}" fill="${cols[i]}"/></g>`;
        });
      } else {
        const cx = 210, cy = 170;
        body += line(40, cy, 380, cy, C.ink, 3);
        [[0, a], [a, a + b], [a + b, 180]].forEach(([s, e], i) => {
          body += `<path ${anim("pl-pop", i * 0.4)} d="${sector(cx, cy, 110, s, e)}" fill="${cols[i]}" stroke="#fff" stroke-width="2"/>` + text(...pt(cx, cy, (s + e) / 2, 75), [a, b, c][i] + "°", { size: 15, color: "#fff", cls: "pl-fade", d: i * 0.4 + 0.2 });
        });
        body += text(210, 30, `${a}° + ${b}° + ${c}° = 180°`, { size: 18, color: C.green, cls: "pl-pop", d: 1.3 });
      }
      const say = v.step === "tri" ? `Üçgenin üç köşesini üç renge boyadık: ${a}°, ${b}° ve ${c}°.` : v.step === "cut" ? "Üç köşeyi makasla kestik. Şimdi bu üç parçayı bir noktada yan yana getireceğiz." : `Üç parça yan yana gelince dümdüz bir doğru açı oluşturdu: ${a}° + ${b}° + ${c}° = 180°. Şekli değiştir; yine 180° çıkacak. Üçgenin iç açıları toplamı her zaman 180°dir.`;
      return svg(body, say, 215) + cap(say);
    }
  });

  add("im-sticks", {
    instruction: "Üç çubuğun uzunluğunu seç. Uçlar buluşup bir üçgen kurulabiliyor mu?",
    controls: [range("a", "Kırmızı çubuk (cm)", 1, 60, 6), range("b", "Mavi çubuk (cm)", 1, 60, 6), range("c", "Yeşil çubuk (cm)", 1, 60, 6)],
    demo: [{ a: 6, b: 6, c: 6 }, { a: 5, b: 5, c: 8 }, { a: 3, b: 4, c: 5 }, { a: 6, b: 6, c: 55 }, { a: 4, b: 5, c: 9 }],
    demoMs: 2600,
    render(v) {
      const sticks = [[v.a, C.red, "Kırmızı"], [v.b, C.blue, "Mavi"], [v.c, C.green, "Yeşil"]].sort((p, q) => q[0] - p[0]);
      const [L, s1, s2] = sticks;
      const rest = s1[0] + s2[0];
      const lab = (x, y, t, color) => text(x, y, t, { size: 13, color });
      if (rest > L[0]) {
        // Taban en uzun çubuk; tepe noktası iki çember kesişimi gibi bulunur.
        const base = L[0], p = s1[0], q = s2[0];
        const x = (p * p - q * q + base * base) / (2 * base), y = Math.sqrt(Math.max(0, p * p - x * x));
        const k = Math.min(320 / base, 150 / Math.max(y, 0.01));
        const ox = 210 - base * k / 2, oy = 185;
        const P0 = [ox, oy], P1 = [ox + base * k, oy], T = [ox + x * k, oy - y * k];
        const sides = [v.a, v.b, v.c];
        const eq = new Set(sides).size;
        const sideType = eq === 1 ? "eşkenar" : eq === 2 ? "ikizkenar" : "çeşitkenar";
        const sq = (n) => n * n;
        const angleType = sq(base) === sq(p) + sq(q) ? "dik" : sq(base) > sq(p) + sq(q) ? "geniş açılı" : "dar açılı";
        const body = `<line ${draw(0)} x1="${f(P0[0])}" y1="${oy}" x2="${f(P1[0])}" y2="${oy}" stroke="${L[1]}" stroke-width="8" stroke-linecap="round"/>
          <line ${draw(0.5)} x1="${f(P0[0])}" y1="${oy}" x2="${f(T[0])}" y2="${f(T[1])}" stroke="${s1[1]}" stroke-width="8" stroke-linecap="round"/>
          <line ${draw(1)} x1="${f(P1[0])}" y1="${oy}" x2="${f(T[0])}" y2="${f(T[1])}" stroke="${s2[1]}" stroke-width="8" stroke-linecap="round"/>
          ${dot(T[0], T[1], C.ink, 6, 1.6)}${lab((P0[0] + P1[0]) / 2, oy + 22, L[0] + " cm", L[1])}${lab((P0[0] + T[0]) / 2 - 22, (oy + T[1]) / 2, s1[0] + " cm", s1[1])}${lab((P1[0] + T[0]) / 2 + 22, (oy + T[1]) / 2, s2[0] + " cm", s2[1])}
          ${text(210, 26, "✓ Üçgen oluştu!", { size: 18, color: C.green, cls: "pl-pop", d: 1.7 })}`;
        return svg(body, "Üçgen oluştu", 215) + badges([[true, "Uçlar buluştu"], [true, sideType], [true, angleType]]) +
          cap(`En uzun çubuk ${L[0]} cm. Öbür ikisinin toplamı ${s1[0]} + ${s2[0]} = ${rest} cm ve ${rest} > ${L[0]}. Kısa çubuklar en uzun çubuktan daha uzun bir yol yaptığı için uçlar havada buluşur. Bu üçgen ${sideType} ve ${angleType}.`);
      }
      // Kısa çubuklar en uzun çubuğun iki ucundan düşer; birbirine yetişemez.
      const k = 340 / L[0], ox = 40, oy = 170;
      const lx = ox + s1[0] * k, rx = ox + L[0] * k - s2[0] * k;
      const flat = rest === L[0];
      const body = `${line(ox, oy + 12, ox + L[0] * k, oy + 12, L[1], 8)}
        <g class="pl-swing" style="--ox:${ox}px;--oy:${oy}px;--r:-55deg">${line(ox, oy, lx, oy, s1[1], 8)}</g>
        <g class="pl-swing" style="--ox:${f(ox + L[0] * k)}px;--oy:${oy}px;--r:55deg">${line(ox + L[0] * k, oy, rx, oy, s2[1], 8)}</g>
        ${flat ? dot(lx, oy, C.gold, 7, 1.3) : `<line ${anim("pl-fade", 1.3)} x1="${f(lx)}" y1="${oy - 26}" x2="${f(rx)}" y2="${oy - 26}" stroke="${C.red}" stroke-width="2.5" stroke-dasharray="5 4"/>${text((lx + rx) / 2, oy - 34, `${L[0] - rest} cm boşluk`, { size: 13, color: C.red, cls: "pl-fade", d: 1.3 })}`}
        ${lab(ox + L[0] * k / 2, oy + 38, L[0] + " cm", L[1])}${lab(ox + s1[0] * k / 2, oy - 12, s1[0], s1[1])}${lab(ox + L[0] * k - s2[0] * k / 2, oy - 12, s2[0], s2[1])}
        ${text(210, 30, "✗ Üçgen olmuyor", { size: 18, color: C.red, cls: "pl-pop", d: 1.4 })}`;
      return svg(body, "Üçgen oluşmuyor", 215) + badges([[false, "Uçlar buluştu"]]) +
        cap(flat ? `Kısa çubukların toplamı ${s1[0]} + ${s2[0]} = ${rest} cm, en uzun çubuk da ${L[0]} cm. Uçlar ancak dümdüz yatınca birbirine değiyor: üçgen değil, düz bir çizgi oluşur. Üçgen için toplam en uzun çubuktan büyük olmalı.`
          : `Kısa çubukların toplamı ${s1[0]} + ${s2[0]} = ${rest} cm. En uzun çubuk ${L[0]} cm. ${rest} < ${L[0]} olduğu için kısa çubuklar yere yatsa bile birbirine yetişemiyor; arada ${L[0] - rest} cm boşluk kalıyor. Bu çubuklarla üçgen kurulamaz.`);
    }
  });

  /* ---------- 11 Üçgen inşası ---------- */
  add("im-compass-tri", {
    instruction: "AB tabanını ve iki pergel açıklığını seç. Çemberler kesişirse üçgen kurulur.",
    controls: [range("base", "AB tabanı", 3, 8, 6), range("ra", "A merkezli çemberin yarıçapı", 2, 8, 6), range("rb", "B merkezli çemberin yarıçapı", 2, 8, 4)],
    demo: [{ base: 6, ra: 6, rb: 6 }, { base: 6, ra: 6, rb: 4 }, { base: 6, ra: 5, rb: 4 }, { base: 7, ra: 3, rb: 3 }],
    demoMs: 2600,
    render(v) {
      const u = 17, ax = 210 - v.base * u / 2, bx = 210 + v.base * u / 2, y = 190;
      const meet = v.ra + v.rb > v.base && Math.abs(v.ra - v.rb) < v.base;
      let body = `<circle ${draw(0)} cx="${f(ax)}" cy="${y}" r="${v.ra * u}" fill="none" stroke="${C.blue}" stroke-width="2"/><circle ${draw(0.3)} cx="${f(bx)}" cy="${y}" r="${v.rb * u}" fill="none" stroke="${C.red}" stroke-width="2"/>${line(ax, y, bx, y, C.ink, 4)}${dot(ax, y, C.blue, 5)}${dot(bx, y, C.red, 5)}${text(ax - 6, y + 22, "A")}${text(bx + 6, y + 22, "B")}`;
      let say;
      if (meet) {
        const x = (v.ra * v.ra - v.rb * v.rb + v.base * v.base) / (2 * v.base), h = Math.sqrt(v.ra * v.ra - x * x);
        const cx = ax + x * u, cy = y - h * u;
        const eq = new Set([v.base, v.ra, v.rb]).size;
        body = `<polygon ${anim("pl-fade", 0.9)} points="${f(ax)},${y} ${f(bx)},${y} ${f(cx)},${f(cy)}" fill="#1c8c7433" stroke="${C.green}" stroke-width="3"/>` + body + dot(cx, cy, C.green, 6, 0.9) + text(cx, cy - 12, "C");
        say = `Çemberler C noktasında kesişti. |AC| = ${v.ra}, |BC| = ${v.rb}, |AB| = ${v.base} birim. ${eq === 1 ? "Üç kenar eşit: eşkenar üçgen." : eq === 2 ? "Tam iki kenar eşit: ikizkenar üçgen." : "Üç kenar da farklı: çeşitkenar üçgen."}`;
      } else {
        say = v.ra + v.rb <= v.base ? `Yarıçapların toplamı ${v.ra} + ${v.rb} = ${v.ra + v.rb}, taban ise ${v.base}. Çemberler birbirine yetişemiyor; üçgen kurulamaz. Pergeli biraz daha aç.` : `Bir çember öbürünün içinde kalıyor; kesişme yok. Yarıçaplar arasındaki fark ${Math.abs(v.ra - v.rb)}, tabandan küçük olmalı.`;
      }
      return svg(body, say, 215) + cap(say);
    }
  });

  add("im-euclid", {
    instruction: "Öklid’in üç temel işini sırayla izle.",
    controls: [choice("rule", "Kural", "1", [["1", "1. Parça çiz"], ["2", "2. Parçayı uzat"], ["3", "3. Çember çiz"]])],
    demo: [{ rule: "1" }, { rule: "2" }, { rule: "3" }],
    render(v) {
      const A = dot(130, 120, C.blue, 7) + text(130, 146, "A"), B = dot(290, 120, C.red, 7, 0.2) + text(290, 146, "B");
      const rows = {
        1: [`${A}${B}<line ${draw(0.4)} x1="130" y1="120" x2="290" y2="120" stroke="${C.ink}" stroke-width="5"/>`, "İki nokta arasına bir doğru parçası çizilir. Ölçüsüz cetvel bunun için yeterlidir."],
        2: [`<line x1="130" y1="120" x2="290" y2="120" stroke="${C.ink}" stroke-width="5"/><line ${draw(0.3)} x1="290" y1="120" x2="405" y2="120" stroke="${C.green}" stroke-width="5"/><line ${draw(0.3)} x1="130" y1="120" x2="15" y2="120" stroke="${C.green}" stroke-width="5"/>${A}${B}`, "Bir doğru parçası iki yönde de istenildiği kadar uzatılabilir."],
        3: [`<line x1="130" y1="120" x2="290" y2="120" stroke="${C.gold}" stroke-width="3" stroke-dasharray="6 4"/><circle ${draw(0.4)} cx="130" cy="120" r="160" fill="none" stroke="${C.blue}" stroke-width="4"/>${A}${B}`, "A merkez, |AB| yarıçap alınarak bir çember çizilir. Pergelin işi budur."]
      };
      const [body, say] = rows[v.rule];
      return svg(body, say, 230) + cap(say);
    }
  });

/*NUMBERS*/
  /* ---------- 12–14 Sayıları okuma, basamak, sıralama ---------- */
  const PLACES = ["birler", "onlar", "yüzler", "binler", "on binler", "yüz binler", "milyonlar"];
  const BOLUK = [["birler", C.blue], ["binler", C.green], ["milyonlar", C.red], ["milyarlar", C.gold]];

  add("im-bolukle", {
    instruction: "Bir sayı yaz. Rakamlar sağdan üçer üçer paketlenir, her pakete bir ad verilir.",
    controls: [number("n", "Sayı", 0, 999999999999, 12000678)],
    demo: [{ n: 7005 }, { n: 12000678 }, { n: 149597890 }, { n: 2030405060 }],
    demoMs: 2600,
    render(v) {
      const s = String(v.n), parts = [];
      for (let end = s.length; end > 0; end -= 3) parts.unshift(s.slice(Math.max(0, end - 3), end));
      const html = parts.map((p, i) => {
        const g = parts.length - 1 - i, [name, color] = BOLUK[g];
        return `<span class="pl-group" style="--c:${color};--d:${g * 0.35}s"><b>${p.split("").map((d) => `<i>${d}</i>`).join("")}</b><small>${name}</small></span>`;
      }).join("");
      const zero = parts.slice(0, -1).some((p) => Number(p) === 0);
      return `<div class="pl-groups" aria-label="${group(v.n)}">${html}</div><p class="im-line">${group(v.n)}</p>` +
        cap(`Okunuşu: <b>${sayNumber(v.n)}</b>. Her bölük kendi içinde okunur, sonra adı söylenir; birler bölüğünün adı söylenmez.${zero ? " Tamamı sıfır olan bölüğün adı da söylenmez." : ""}`);
    }
  });

  add("im-shift", {
    instruction: "Rakamı bir basamak sola kaydır. Basamak değeri nasıl değişiyor?",
    controls: [range("d", "Rakam", 1, 9, 3), range("pos", "Basamak (0 = birler)", 0, 6, 0)],
    demo: [{ pos: 0 }, { pos: 1 }, { pos: 2 }, { pos: 3 }],
    demoMs: 1800,
    render(v) {
      const value = v.d * 10 ** v.pos;
      const cells = PLACES.slice().reverse().map((name, i) => {
        const p = 6 - i;
        const body = p === v.pos ? `<b class="pl-move">${v.d}</b>` : p < v.pos ? "<span>0</span>" : "<span></span>";
        return `<div class="${p === v.pos ? "on" : ""}"><small>${name}</small>${body}</div>`;
      }).join("");
      return `<div class="pl-place">${cells}</div><p class="im-line">${v.d} × ${group(10 ** v.pos)} = ${group(value)}</p>` +
        cap(`${v.d} rakamı ${PLACES[v.pos]} basamağında. Rakam değeri hep ${v.d}; basamak değeri ${group(value)}. Bir basamak sola kayınca değeri 10 katına çıkar, sağdaki boş basamakları sıfırlar tutar.`);
    }
  });

  add("im-expand", {
    instruction: "Bir sayı yaz. Her rakamın basamak değerini ayrı ayrı gör ve topla.",
    controls: [number("n", "Sayı", 1, 99999999, 2140503)],
    demo: [{ n: 3452 }, { n: 5080 }, { n: 2140503 }],
    demoMs: 2600,
    render(v) {
      const s = String(v.n);
      const terms = s.split("").map((d, i) => [Number(d), s.length - 1 - i]).filter(([d]) => d);
      const zeros = s.split("").filter((d) => d === "0").length;
      const html = terms.map(([d, p], i) => `<span class="pl-term" style="--c:${PALETTE[p % 6]};--d:${i * 0.3}s">${group(d * 10 ** p)}</span>`).join('<b class="pl-plus">+</b>');
      return `<p class="im-line">${group(v.n)} =</p><div class="pl-terms">${html}</div>` +
        cap(`${terms.map(([d, p]) => `${d} → ${PLACES[p] || "üst basamak"}: ${group(d * 10 ** p)}`).join("; ")}. Hepsini toplayınca yine ${group(v.n)} bulunur.${zeros ? ` Sayıda ${zeros} tane 0 var; sıfırın basamak değeri 0 olduğu için toplama yazmadık ama yerini korur.` : ""}`);
    }
  });

  add("im-croc", {
    instruction: "İki sayıyı değiştir. Aç gözlü timsah ağzını hep büyük sayıya açar.",
    controls: [range("a", "Soldaki sayı", 0, 99, 13), range("b", "Sağdaki sayı", 0, 99, 9)],
    demo: [{ a: 13, b: 9 }, { a: 45, b: 54 }, { a: 70, b: 70 }],
    render(v) {
      const sign = v.a > v.b ? ">" : v.a < v.b ? "<" : "=";
      let mouth;
      if (sign === "=") mouth = line(170, 90, 250, 90, C.green, 10) + line(170, 125, 250, 125, C.green, 10);
      else {
        const open = sign === ">" ? 170 : 250, tip = sign === ">" ? 250 : 170;
        const teeth = [0.3, 0.55, 0.8].map((t) => {
          const x = tip + (open - tip) * t, yu = 107 - 48 * t, yl = 107 + 48 * t;
          return `<polygon points="${f(x - 6)},${f(yu + 6)} ${f(x + 6)},${f(yu + 6)} ${f(x)},${f(yu + 20)}" fill="#fff" stroke="${C.ink}" stroke-width="1.5"/><polygon points="${f(x - 6)},${f(yl - 6)} ${f(x + 6)},${f(yl - 6)} ${f(x)},${f(yl - 20)}" fill="#fff" stroke="${C.ink}" stroke-width="1.5"/>`;
        }).join("");
        const jaw = (y) => `<polygon points="${tip},107 ${open},${y - 9} ${open},${y + 9}" fill="${C.green}" stroke="#14684f" stroke-width="2" stroke-linejoin="round"/>`;
        mouth = `<g ${anim("pl-pop", 0)}>${jaw(55)}${jaw(159)}${teeth}<circle cx="${tip + (open - tip) * 0.25}" cy="80" r="6" fill="#fff" stroke="${C.ink}" stroke-width="2"/><circle cx="${tip + (open - tip) * 0.25}" cy="80" r="2.5" fill="${C.ink}"/></g>`;
      }
      const big = (x, n, on) => text(x, 125, n, { size: 54, color: on ? C.green : C.ink });
      const body = big(90, v.a, v.a > v.b) + big(330, v.b, v.b > v.a) + mouth + text(210, 200, `${v.a} ${sign} ${v.b}`, { size: 22, color: C.red, cls: "pl-fade", d: 0.4 });
      const say = sign === "=" ? `${v.a} = ${v.b}. İki sayı eşit; timsah hangisini yiyeceğini seçemiyor.` : sign === ">" ? `${v.a} > ${v.b}. Okunuşu: ${v.a}, ${ablative(v.b)} büyüktür. Timsahın ağzı büyük sayıya, sivri ucu küçük sayıya bakar.` : `${v.a} < ${v.b}. Okunuşu: ${v.a}, ${ablative(v.b)} küçüktür. Timsahın ağzı büyük sayıya, sivri ucu küçük sayıya bakar.`;
      return svg(body, say) + cap(say);
    }
  });

  add("im-order3", {
    instruction: "Üç sayıyı sayı doğrusuna yerleştir. Sağa gidildikçe sayılar büyür.",
    controls: [range("a", "Kırmızı sayı", 0, 100, 64), range("b", "Mavi sayı", 0, 100, 28), range("c", "Yeşil sayı", 0, 100, 46)],
    demo: [{ a: 64, b: 28, c: 46 }, { a: 15, b: 90, c: 51 }, { a: 99, b: 9, c: 90 }],
    render(v) {
      const x = (n) => 30 + n * 3.6;
      let ticks = "";
      for (let n = 0; n <= 100; n += 10) ticks += line(x(n), 120, x(n), 132, C.ink, 2) + text(x(n), 150, n, { size: 11 });
      const items = [[v.a, C.red], [v.b, C.blue], [v.c, C.green]];
      const marks = items.map(([n, c], i) => `<g ${anim("pl-fade", i * 0.3)}>${line(x(n), 126, x(n), 70 - i * 18, c, 2)}${dot(x(n), 126, c, 7)}${text(x(n), 64 - i * 18, n, { color: c, size: 15 })}</g>`).join("");
      const sorted = items.slice().sort((p, q) => p[0] - q[0]).map(([n]) => n);
      const signs = sorted.map((n, i) => i ? (n === sorted[i - 1] ? " = " : " < ") + n : String(n)).join("");
      return svg(line(25, 126, 395, 126, C.ink, 3) + ticks + marks, "Sayı doğrusunda üç sayı", 170) + cap(`Küçükten büyüğe: <b>${signs}</b>. En solda duran en küçük, en sağda duran en büyüktür.`);
    }
  });

  /* ---------- 15 Toplama ve çıkarma ---------- */
  function blocks(tens, ones, x, y, color, opts) {
    const o = opts || {};
    let s = "";
    for (let i = 0; i < tens; i++) {
      const bx = x + i * 20, gold = o.goldLast && i === tens - 1;
      s += `<g ${anim(gold ? "pl-pop" : "pl-fade", gold ? 0.8 : 0)}><rect x="${bx}" y="${y}" width="14" height="100" rx="2" fill="${gold ? C.gold : color}" opacity="${o.fadeTens && i >= tens - o.fadeTens ? 0.25 : 1}"/>${Array.from({ length: 9 }, (_, k) => `<line x1="${bx}" y1="${y + (k + 1) * 10}" x2="${bx + 14}" y2="${y + (k + 1) * 10}" stroke="#fff" stroke-width="1"/>`).join("")}</g>`;
    }
    const ox = x + tens * 20 + 6;
    for (let i = 0; i < ones; i++) {
      const gold = o.goldOnes && i >= ones - o.goldOnes, faded = o.fadeOnes && i < o.fadeOnes;
      s += `<rect ${anim(gold ? "pl-pop" : "pl-fade", gold ? 0.5 + (i % 10) * 0.05 : 0)} x="${ox + (i % 5) * 13}" y="${y + Math.floor(i / 5) * 13}" width="10" height="10" rx="2" fill="${gold ? C.gold : color}" opacity="${faded ? 0.25 : 1}"/>`;
    }
    return s;
  }
  add("im-blocks", {
    instruction: "Onluk çubuklar ve birlik küplerle topla. Birlikler 10 olunca bir onluk çubuğa dönüşür.",
    controls: [range("a", "Birinci toplanan", 1, 49, 28), range("b", "İkinci toplanan", 1, 49, 17), choice("step", "Adım", "split", [["split", "1. Ayır"], ["ones", "2. Birlikleri birleştir"], ["done", "3. Onlukları say"]])],
    demo: [{ step: "split" }, { step: "ones" }, { step: "done" }],
    render(v) {
      const ta = Math.floor(v.a / 10), oa = v.a % 10, tb = Math.floor(v.b / 10), ob = v.b % 10;
      const ones = oa + ob, carry = ones >= 10 ? 1 : 0, left = ones - carry * 10, sum = v.a + v.b;
      let body, say;
      if (v.step === "split") {
        body = blocks(ta, oa, 20, 70, C.blue) + blocks(tb, ob, 230, 70, C.red) + text(100, 45, v.a, { size: 22, color: C.blue }) + text(310, 45, v.b, { size: 22, color: C.red }) + text(210, 130, "+", { size: 30 });
        say = `${v.a} = ${ta} onluk + ${oa} birlik. ${v.b} = ${tb} onluk + ${ob} birlik.`;
      } else if (v.step === "ones") {
        body = blocks(ta, 0, 20, 70, C.blue) + blocks(tb, 0, 20 + ta * 20, 70, C.red) + blocks(0, ones, 250, 70, C.blue, { goldOnes: carry ? 10 : 0 }) +
          (carry ? `<rect ${anim("pl-fade", 0.6)} x="252" y="68" width="68" height="30" rx="5" fill="none" stroke="${C.gold}" stroke-width="2.5" stroke-dasharray="5 3"/>${text(330, 60, "10 birlik = 1 onluk", { size: 13, color: C.gold, cls: "pl-fade", d: 0.7 })}` : "");
        say = `Birlikler: ${oa} + ${ob} = ${ones}. ${carry ? `10 birlik bir araya gelince 1 onluk olur; ${left} birlik kalır. Bu onluğa elde deriz.` : "10’a ulaşmadı; elde yok."}`;
      } else {
        const tens = ta + tb + carry;
        body = blocks(tens, left, 20, 70, C.green, { goldLast: !!carry }) + text(330, 45, `= ${sum}`, { size: 26, color: C.green, cls: "pl-pop", d: 1 });
        say = `Onluklar: ${ta} + ${tb}${carry ? " + 1 elde" : ""} = ${tens} onluk. ${left} birlik de var. Sonuç: ${tens} onluk ${left} birlik = ${sum}.`;
      }
      return svg(body, say, 220) + cap(say);
    }
  });

  add("im-borrow", {
    instruction: "Çıkarmada birlikler yetmezse bir onluk çubuğu 10 birliğe boz.",
    controls: [range("a", "Eksilen", 20, 99, 52), range("b", "Çıkan", 1, 99, 27), choice("step", "Adım", "start", [["start", "1. Eksileni diz"], ["break", "2. Gerekirse boz"], ["take", "3. Çıkanı al"]])],
    adjust(v) { if (v.b > v.a) v.b = v.a; },
    demo: [{ step: "start" }, { step: "break" }, { step: "take" }],
    render(v) {
      const ta = Math.floor(v.a / 10), oa = v.a % 10, tb = Math.floor(v.b / 10), ob = v.b % 10;
      const need = oa < ob;
      let body, say;
      if (v.step === "start") {
        body = blocks(ta, oa, 20, 70, C.blue);
        say = `${v.a} = ${ta} onluk + ${oa} birlik. Bundan ${v.b} çıkaracağız: ${tb} onluk + ${ob} birlik.`;
      } else {
        const T = need ? ta - 1 : ta, O = need ? oa + 10 : oa;
        const take = v.step === "take";
        body = blocks(T, O, 20, 70, C.blue, { goldOnes: need && !take ? 10 : 0, fadeTens: take ? tb : 0, fadeOnes: take ? ob : 0 });
        say = !take ? (need ? `${oa} birlikten ${ob} birlik çıkmaz. Bir onluğu bozduk: 10 yeni birlik geldi (sarı). Şimdi ${T} onluk ve ${O} birlik var.` : `${oa} birlik ${ob} birliğe yetiyor; bozmaya gerek yok.`)
          : `Birlikler: ${O} − ${ob} = ${O - ob}. Onluklar: ${T} − ${tb} = ${T - tb}. Soluk olanları çıkardık. Sonuç: ${v.a} − ${v.b} = ${v.a - v.b}.`;
        if (take) body += text(340, 45, `= ${v.a - v.b}`, { size: 26, color: C.green, cls: "pl-pop", d: 0.5 });
      }
      return svg(body, say, 220) + cap(say);
    }
  });

  add("im-estimate", {
    instruction: "Sayıları en yakın onluğa yuvarla, tahmin et, sonra gerçek sonuçla karşılaştır.",
    controls: [range("a", "Birinci sayı", 10, 990, 175), range("b", "İkinci sayı", 10, 990, 88)],
    demo: [{ a: 175, b: 88 }, { a: 412, b: 297 }, { a: 64, b: 39 }],
    render(v) {
      const r = (n) => Math.round(n / 10) * 10;
      const ra = r(v.a), rb = r(v.b), guess = ra + rb, real = v.a + v.b, gap = Math.abs(guess - real);
      const max = Math.max(guess, real), w = (n) => 260 * n / max;
      const body = `<rect ${anim("pl-pop", 0)} x="90" y="40" width="${f(w(guess))}" height="34" rx="6" fill="${C.gold}"/>${text(80, 63, "Tahmin", { anchor: "end", size: 14 })}${text(100 + w(guess), 63, guess, { anchor: "start", size: 16 })}
        <rect ${anim("pl-pop", 0.4)} x="90" y="100" width="${f(w(real))}" height="34" rx="6" fill="${C.green}"/>${text(80, 123, "Gerçek", { anchor: "end", size: 14 })}${text(100 + w(real), 123, real, { anchor: "start", size: 16 })}`;
      return `<p class="im-line">${v.a} ≈ ${ra} &nbsp; ${v.b} ≈ ${rb} &nbsp; → &nbsp; ${ra} + ${rb} = ${guess}</p>` + svg(body, "Tahmin ve gerçek sonuç", 160) +
        cap(`Gerçek sonuç ${v.a} + ${v.b} = ${real}. Tahminle arasında ${gap} fark var. ${gap <= 10 ? "Sonuç tahmine çok yakın; hesap akla yatkın." : "Fark biraz büyük ama yine aynı büyüklükte; hesap akla yatkın."}`);
    }
  });

  add("im-missing", {
    instruction: "Bütün ve bilinen parça verildi. Eksik parçayı bulmak için hangi işlemi yaparsın?",
    controls: [range("total", "Toplam", 20, 100, 60, 5), range("part", "Bilinen toplanan", 5, 95, 35, 5), { type: "checks", key: "on", value: [], label: "Cevap", options: [["show", "Eksik parçayı göster"]] }],
    adjust(v) { if (v.part >= v.total) v.part = v.total - 5; },
    demo: [{ on: [] }, { on: ["show"] }, { total: 85, part: 40, on: ["show"] }],
    render(v) {
      const rest = v.total - v.part, show = v.on.includes("show"), w = 360 * v.part / v.total;
      const body = `<rect x="30" y="30" width="360" height="40" rx="6" fill="#dfe7f3" stroke="${C.ink}"/>${text(210, 56, `Toplam: ${v.total}`, { size: 16 })}
        <rect ${anim("pl-pop", 0)} x="30" y="95" width="${f(w)}" height="40" rx="6" fill="${C.blue}"/>${text(30 + w / 2, 121, v.part, { color: "#fff" })}
        <rect ${anim("pl-pop", 0.3)} x="${f(30 + w)}" y="95" width="${f(360 - w)}" height="40" rx="6" fill="${C.gold}"/>${text(30 + w + (360 - w) / 2, 121, show ? rest : "?", { color: "#fff", size: 18 })}`;
      return svg(body, "Bar modeli", 160) + `<p class="im-line">${v.part} + ? = ${v.total}</p>` + cap(show ? `Eksik toplanan = toplam − bilinen toplanan: ${v.total} − ${v.part} = ${rest}. Kontrol: ${v.part} + ${rest} = ${v.total}.` : "Bütün çubuk toplamdır. Mavi parça bilinen toplanan. Sarı parçayı bulmak için bütünden maviyi çıkar.");
    }
  });

  add("im-shortcut", {
    instruction: "500 TL harçlıktan 4 harcama yapıldı. Uzun yolu ve kısa yolu karşılaştır.",
    controls: [choice("mode", "Yol", "long", [["long", "Tek tek çıkar"], ["short", "Önce topla"]])],
    demo: [{ mode: "long" }, { mode: "short" }],
    render(v) {
      const rows = v.mode === "long"
        ? ["500 − 120 = 380", "380 − 85 = 295", "295 − 60 = 235", "235 − 35 = 200"]
        : ["120 + 85 + 60 + 35 = 300", "500 − 300 = 200"];
      return `<div class="pl-steps">${rows.map((r, i) => `<p style="--d:${i * 0.45}s"><span>${i + 1}</span>${r}</p>`).join("")}</div>` +
        cap(v.mode === "long" ? "Dört ayrı çıkarma yaptık; her adımda hata yapma şansı var. Sonuç 200 TL." : "Önce harcamaları topladık, sonra bir kez çıkardık. Yalnız 2 işlemle yine 200 TL bulduk. Aynı sonuç, daha kısa yol!");
    }
  });

  /* ---------- 16 Çarpma ve bölme ---------- */
  add("im-zeros", {
    instruction: "Çarpanlara sıfır ekle. Önce sıfırsız çarp, sonra bütün sıfırları sona taşı.",
    controls: [range("a", "Birinci sayı (sıfırsız)", 2, 99, 32), range("z1", "Birinci sayının sıfırı", 0, 3, 0), range("b", "İkinci sayı (sıfırsız)", 2, 9, 3), range("z2", "İkinci sayının sıfırı", 0, 3, 2)],
    demo: [{ z1: 0, z2: 0 }, { z1: 0, z2: 2 }, { z1: 1, z2: 2 }],
    render(v) {
      const z = (n, d) => n ? `<span class="pl-zero" style="--d:${d}s">${"0".repeat(n)}</span>` : "";
      const core = v.a * v.b, total = v.z1 + v.z2;
      return `<p class="im-line pl-big">${v.a}${z(v.z1, 0)} × ${v.b}${z(v.z2, 0.2)} = ${core}${z(total, 0.8)}</p>` +
        cap(`Önce sıfırsız çarp: ${v.a} × ${v.b} = ${core}. Çarpanlarda toplam ${total} sıfır var${total ? "; bunları sonucun sonuna ekle" : ""}. Sonuç ${group(core * 10 ** total)}.`);
    }
  });

  add("im-share", {
    instruction: "Bilyeleri arkadaşlara eşit paylaştır. Artan bilye kalan olur.",
    controls: [range("n", "Bilye sayısı", 1, 40, 13), range("g", "Arkadaş sayısı", 1, 8, 4)],
    demo: [{ n: 12, g: 4 }, { n: 13, g: 4 }, { n: 30, g: 7 }],
    render(v) {
      const q = Math.floor(v.n / v.g), r = v.n % v.g, w = 380 / v.g;
      const per = Math.max(2, Math.floor((w - 10) / 13));
      let body = "";
      for (let i = 0; i < v.g; i++) {
        const x = 20 + i * w;
        body += `<rect x="${f(x + 3)}" y="20" width="${f(w - 6)}" height="140" rx="10" fill="#eef3f8" stroke="${C.gray}"/><text x="${f(x + w / 2)}" y="44" text-anchor="middle" font-size="18">🙂</text>`;
        for (let k = 0; k < q; k++) body += `<circle ${anim("pl-pop", (k * v.g + i) * 0.04)} cx="${f(x + 12 + (k % per) * 13)}" cy="${62 + Math.floor(k / per) * 13}" r="5" fill="${PALETTE[i % 6]}"/>`;
      }
      for (let k = 0; k < r; k++) body += `<circle ${anim("pl-pop", 1 + k * 0.1)} cx="${30 + k * 16}" cy="185" r="6" fill="${C.red}"/>`;
      if (r) body += text(40 + r * 16, 190, "kalan", { anchor: "start", size: 13, color: C.red });
      return svg(body, `${v.n} bilye ${v.g} kişiye`, 205) + cap(`${v.n} ÷ ${v.g} = ${q}, kalan ${r}. Her arkadaş ${q} bilye aldı${r ? `, ${r} bilye arttı` : ", hiç artmadı"}. Kontrol: ${v.g} × ${q} + ${r} = ${v.n}.`);
    }
  });

  add("im-bus", {
    instruction: "Yolcuları teleferik kabinlerine bindir. Son kabin dolmasa da bir sefer daha gerekir.",
    controls: [range("people", "Kişi sayısı", 1, 60, 25), range("cap", "Bir kabine binen", 3, 12, 11)],
    demo: [{ people: 22, cap: 11 }, { people: 25, cap: 11 }, { people: 40, cap: 6 }],
    render(v) {
      const trips = Math.ceil(v.people / v.cap), q = Math.floor(v.people / v.cap), r = v.people % v.cap;
      const cols = Math.ceil(v.cap / 2);
      let body = "";
      for (let t = 0; t < trips; t++) {
        const x = 15 + (t % 5) * 80, y = 15 + Math.floor(t / 5) * 52, last = t === trips - 1 && r;
        body += `<rect ${anim("pl-pop", t * 0.12)} x="${x}" y="${y}" width="72" height="42" rx="8" fill="${last ? "#fff4cf" : "#eef3f8"}" stroke="${last ? C.gold : C.blue}" stroke-width="2"/>`;
        for (let s = 0; s < v.cap; s++) {
          const filled = t * v.cap + s < v.people;
          body += `<circle cx="${f(x + 8 + (s % cols) * (58 / Math.max(1, cols - 1 || 1)))}" cy="${y + 13 + Math.floor(s / cols) * 16}" r="4.5" fill="${filled ? C.red : "#fff"}" stroke="${C.gray}"/>`;
        }
      }
      return svg(body, `${trips} sefer`, 30 + Math.ceil(trips / 5) * 52) + cap(`${v.people} ÷ ${v.cap} = ${q}, kalan ${r}. ${r ? `${q} sefer yetmez; kalan ${r} kişi için bir sefer daha gerekir: ${trips} sefer. Sarı kabin tam dolmadı ama yine de gitmesi gerekir.` : `Kalan yok; tam ${trips} sefer yeter.`}`);
    }
  });

  /* ---------- 17 Problemler ---------- */
  add("im-steps4", {
    instruction: "Problemi dört adımda çöz. Her adımda neye baktığını gör.",
    controls: [choice("step", "Adım", "1", [["1", "1. Verilen"], ["2", "2. İstenen"], ["3", "3. İşlem"], ["4", "4. Kontrol"]])],
    demo: [{ step: "1" }, { step: "2" }, { step: "3" }, { step: "4" }],
    render(v) {
      const s = v.step;
      const m = (on, t) => on ? `<mark>${t}</mark>` : t;
      const story = `Ece’nin ${m(s === "1", "100 TL")} harçlığı var. Tanesi ${m(s === "1", "15 TL")} olan ${m(s === "1", "4 kalem")} alıyor. ${m(s === "2", "Ece’nin kaç TL’si kalır?")}`;
      const say = {
        1: "Verilenleri işaretle: 100 TL harçlık, kalemin tanesi 15 TL, 4 kalem.",
        2: "İstenen: kalan para. Cevabın birimi TL olacak.",
        3: "Önce kalemlerin tutarı: 4 × 15 = 60 TL. Sonra kalan: 100 − 60 = 40 TL.",
        4: "Kontrol: 60 + 40 = 100. Kalan para harçlıktan az; sonuç akla yatkın. Cevap: 40 TL."
      }[s];
      return `<div class="pl-story">${story}</div><div class="pl-steps"><p style="--d:0s"><span>${s}</span>${say}</p></div>` + cap("Her problemde aynı dört soruyu sor: Verilen ne? İstenen ne? Hangi işlem? Sonuç akla yatkın mı?");
    }
  });

  add("im-table", {
    instruction: "Okuma çizelgesine bak. Bir soru seç; hangi sayılarla hangi işlemi yapacağını gör.",
    controls: [choice("q", "Soru", "total", [["total", "Toplam kaç sayfa?"], ["diff", "En çok ile en az farkı"], ["rise", "Pazartesiden salıya artış"]])],
    demo: [{ q: "total" }, { q: "diff" }, { q: "rise" }],
    render(v) {
      const data = [["Pzt", 12], ["Salı", 18], ["Çrş", 9], ["Prş", 15]];
      const on = { total: [0, 1, 2, 3], diff: [1, 2], rise: [0, 1] }[v.q];
      const body = data.map(([d, n], i) => {
        const h = n * 7, x = 60 + i * 85, hot = on.includes(i);
        return `<rect ${anim("pl-pop", i * 0.15)} x="${x}" y="${170 - h}" width="50" height="${h}" rx="4" fill="${hot ? C.gold : "#c9d6e3"}"/>${text(x + 25, 162 - h, n, { size: 15 })}${text(x + 25, 190, d, { size: 13 })}`;
      }).join("") + line(40, 170, 400, 170, C.ink, 2);
      const say = {
        total: "Toplam isteniyor: hepsini topla. 12 + 18 + 9 + 15 = 54 sayfa.",
        diff: "En çok 18 (salı), en az 9 (çarşamba). Fark isteniyor: çıkar. 18 − 9 = 9 sayfa.",
        rise: "Artış = sonraki − önceki. 18 − 12 = 6 sayfa artmış."
      }[v.q];
      return svg(body, "Haftalık okuma çizelgesi", 200) + cap(say);
    }
  });

  /* ---------- 18–20 Çevre ve alan ---------- */
  const gridRect = (w, h, u, x0, y0, opts) => {
    const o = opts || {};
    let s = "";
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
      const i = r * w + c;
      s += `<rect ${o.tiles ? anim("pl-pop", i * (o.speed || 0.05)) : ""} x="${x0 + c * u + 1}" y="${y0 + r * u + 1}" width="${u - 2}" height="${u - 2}" rx="3" fill="${o.tiles ? PALETTE[r % 6] + "88" : "#eef3f8"}" ${o.tiles ? "" : `stroke="${C.gray}"`}/>`;
    }
    return s;
  };

  add("im-walk", {
    instruction: "Bahçenin kenarlarını seç. Karınca bahçenin çevresinde bir tur atsın.",
    controls: [range("w", "Uzun kenar", 1, 10, 6), range("h", "Kısa kenar", 1, 5, 3)],
    demo: [{ w: 4, h: 3 }, { w: 6, h: 3 }, { w: 5, h: 5 }],
    demoMs: 3000,
    render(v) {
      const u = 30, x0 = 210 - v.w * u / 2, y0 = 30, W = v.w * u, H = v.h * u;
      const path = `M ${x0} ${y0} L ${x0 + W} ${y0} L ${x0 + W} ${y0 + H} L ${x0} ${y0 + H} Z`;
      const P = 2 * (v.w + v.h);
      const body = gridRect(v.w, v.h, u, x0, y0) + `<path d="${path}" fill="none" stroke="${C.red}" stroke-width="5"/>
        ${text(x0 + W / 2, y0 - 8, v.w, { color: C.red })}${text(x0 + W + 14, y0 + H / 2 + 5, v.h, { color: C.red })}${text(x0 + W / 2, y0 + H + 22, v.w, { color: C.red })}${text(x0 - 14, y0 + H / 2 + 5, v.h, { color: C.red })}
        <text font-size="22" text-anchor="middle" dy="8">🐜<animateMotion dur="${P * 0.5}s" repeatCount="indefinite" path="${path}"/></text>`;
      return svg(body, `Çevre ${P} birim`, y0 + H + 40) + cap(`Karınca bir turda ${v.w} + ${v.h} + ${v.w} + ${v.h} = ${P} birim yürür. Kısa yol: 2 × (${v.w} + ${v.h}) = ${P}. Çevre yalnız kırmızı sınırdır; içteki kareler sayılmaz.`);
    }
  });

  add("im-fence", {
    instruction: "Çit uzunluğu (çevre) sabit. Bir kenarı değiştir; bahçenin alanı ne oluyor?",
    controls: [choice("P", "Çit uzunluğu", "16", [["12", "12"], ["16", "16"], ["20", "20"], ["24", "24"]]), range("a", "Bir kenar", 1, 11, 1)],
    adjust(v) { const half = Number(v.P) / 2; if (v.a > half - 1) v.a = half - 1; },
    demo: [{ a: 1 }, { a: 3 }, { a: 5 }, { a: 7 }],
    render(v) {
      const half = Number(v.P) / 2, b = half - v.a, u = Math.min(30, 300 / Math.max(v.a, b), 150 / Math.min(v.a, b));
      const w = Math.max(v.a, b), h = Math.min(v.a, b), x0 = 210 - w * u / 2;
      const all = [];
      for (let k = 1; k <= half / 2; k++) all.push([k, half - k]);
      const best = Math.max(...all.map(([p, q]) => p * q));
      const body = gridRect(w, h, u, x0, 20, { tiles: true, speed: 0.02 }) + `<rect x="${x0}" y="20" width="${w * u}" height="${h * u}" fill="none" stroke="${C.wood}" stroke-width="4"/>`;
      return svg(body, `Kenarlar ${v.a} ve ${b}`, 40 + h * u) + chips(all.map(([p, q]) => [Math.min(v.a, b) === p, `${p} × ${q} → alan ${p * q}`])) +
        cap(`Çevre ${v.P}: kenarlar ${v.a} ve ${b} (${v.a} + ${b} = ${half}). Alan ${v.a} × ${b} = ${v.a * b} birim kare. ${v.a * b === best ? "Bu çit uzunluğuyla en büyük alan bu! Kenarlar birbirine en yakın." : "Kenarları birbirine yaklaştır; alan büyür."}`);
    }
  });

  add("im-odd", {
    instruction: "İstediğin çevreyi seç. Kenarları doğal sayı olan bir dikdörtgen çizilebilir mi?",
    controls: [range("P", "İstenen çevre (cm)", 6, 20, 15)],
    demo: [{ P: 14 }, { P: 15 }, { P: 18 }],
    render(v) {
      if (v.P % 2) {
        const body = `<rect x="110" y="40" width="200" height="110" fill="none" stroke="${C.red}" stroke-width="4" stroke-dasharray="10 8"/>${text(210, 105, "?", { size: 40, color: C.red })}${text(210, 185, `${v.P} ÷ 2 = ${f1(v.P / 2)}`, { size: 18, color: C.red, cls: "pl-pop", d: 0.3 })}`;
        return svg(body, "Çizilemez", 200) + cap(`Uzun kenar + kısa kenar = ${v.P} ÷ 2 = ${f1(v.P / 2)} olmalı. İki doğal sayının toplamı küsuratlı olamaz. Bu yüzden çevresi ${v.P} cm olan böyle bir dikdörtgen çizilemez. Çevre = 2 × (a + b) her zaman çift sayıdır.`);
      }
      const half = v.P / 2, all = [];
      for (let k = 1; k <= half / 2; k++) all.push([half - k, k]);
      const [w, h] = all[all.length - 1], u = 22, x0 = 210 - w * u / 2;
      return svg(gridRect(w, h, u, x0, 20, { tiles: true }), `${w} ve ${h}`, 40 + h * u) + chips(all.map(([p, q]) => [p === w, `${p} + ${q}`])) +
        cap(`${v.P} çift sayı: uzun kenar + kısa kenar = ${half}. ${all.map(([p, q]) => `${p} ve ${q}`).join(", ")} kenarlı dikdörtgenler çizilebilir.`);
    }
  });

  add("im-tile", {
    instruction: "Zemini birim karelerle döşe. Kareler sıra sıra yerleşirken say.",
    controls: [range("w", "Bir sıradaki kare", 1, 10, 5), range("h", "Sıra sayısı", 1, 6, 3)],
    demo: [{ w: 4, h: 1 }, { w: 4, h: 3 }, { w: 6, h: 4 }],
    demoMs: 2600,
    render(v) {
      const u = 30, x0 = 190 - v.w * u / 2, y0 = 20;
      let counts = "";
      for (let r = 0; r < v.h; r++) counts += text(x0 + v.w * u + 14, y0 + r * u + u / 2 + 5, `${(r + 1) * v.w}`, { anchor: "start", size: 14, color: C.green, cls: "pl-fade", d: (r + 1) * v.w * 0.08 });
      const body = gridRect(v.w, v.h, u, x0, y0, { tiles: true, speed: 0.08 }) + counts;
      return svg(body, `${v.w} × ${v.h}`, y0 + v.h * u + 20) + cap(`Her sırada ${v.w} kare, ${v.h} sıra var. Sağdaki sayılar sıra sıra toplamı gösteriyor. Alan = ${v.w} × ${v.h} = ${v.w * v.h} birim kare. Kareler boşluk bırakmadan ve üst üste binmeden yerleşti.`);
    }
  });

  add("im-missing-side", {
    instruction: "Alan ve bir kenar biliniyor. Gizli kenarı bölmeyle bul.",
    controls: [range("a", "Bilinen kenar", 2, 9, 7), range("b", "Gizli kenar", 2, 12, 12), { type: "checks", key: "on", value: [], label: "Cevap", options: [["show", "Gizli kenarı göster"]] }],
    demo: [{ on: [] }, { on: ["show"] }, { a: 6, b: 8, on: ["show"] }],
    render(v) {
      const area = v.a * v.b, show = v.on.includes("show"), u = Math.min(26, 340 / v.b, 150 / v.a);
      const x0 = 210 - v.b * u / 2;
      const body = gridRect(v.b, v.a, u, x0, 30) + `<rect x="${x0}" y="30" width="${v.b * u}" height="${v.a * u}" fill="none" stroke="${C.blue}" stroke-width="3"/>${text(x0 - 12, 30 + v.a * u / 2 + 5, v.a, { anchor: "end" })}${text(x0 + v.b * u / 2, 22, show ? v.b : "?", { color: show ? C.green : C.red, size: 18 })}${text(x0 + v.b * u / 2, 30 + v.a * u / 2 + 6, `Alan ${area}`, { size: 18, color: C.ink })}`;
      return svg(body, "Eksik kenar", 50 + v.a * u) + cap(show ? `Alan = kenar × kenar. ${v.a} × ? = ${area} ise ? = ${area} ÷ ${v.a} = ${v.b}.` : `Alan ${area} birim kare, bir kenar ${v.a}. Hangi sayıyla ${v.a} çarpılırsa ${area} olur? Tahmin et, sonra göster.`);
    }
  });

  add("im-tess", {
    instruction: "Bir fayans seç. Zemini boşluk bırakmadan kaplayabiliyor mu?",
    controls: [choice("mode", "Fayans", "circle", [["sq", "Kare"], ["rect", "Dikdörtgen"], ["circle", "Daire"], ["pent", "Düzgün beşgen"]])],
    demo: [{ mode: "sq" }, { mode: "circle" }, { mode: "pent" }, { mode: "rect" }],
    render(v) {
      let body = "", ok = true;
      if (v.mode === "sq") for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) body += `<rect ${anim("pl-pop", (r * 8 + c) * 0.03)} x="${50 + c * 40}" y="${20 + r * 40}" width="40" height="40" fill="${PALETTE[(r + c) % 4]}66" stroke="#fff" stroke-width="2"/>`;
      else if (v.mode === "rect") for (let r = 0; r < 5; r++) for (let c = -1; c < 5; c++) body += `<rect ${anim("pl-pop", (r * 6 + c + 1) * 0.03)} x="${50 + c * 70 + (r % 2) * 35}" y="${20 + r * 32}" width="70" height="32" fill="${PALETTE[(r + c + 6) % 4]}66" stroke="#fff" stroke-width="2"/>`;
      else if (v.mode === "circle") {
        ok = false;
        body = `<rect x="50" y="20" width="320" height="160" fill="${C.red}"/>`;
        for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) body += `<circle ${anim("pl-pop", (r * 8 + c) * 0.03)} cx="${70 + c * 40}" cy="${40 + r * 40}" r="20" fill="#cfe0f7" stroke="#fff"/>`;
        body = `<clipPath id="plClip"><rect x="50" y="20" width="320" height="160"/></clipPath><g clip-path="url(#plClip)">${body}</g>`;
      } else {
        ok = false;
        const cx = 210, cy = 125, s = 70;
        for (let i = 0; i < 3; i++) {
          const base = 90 + i * 108;
          const P = [[cx, cy]];
          let dir = base - 54, p = [cx, cy];
          for (let k = 0; k < 4; k++) { p = pt(p[0], p[1], dir, s); P.push(p); dir += 72; }
          body += `<polygon ${anim("pl-pop", i * 0.3)} points="${P.map((q) => q.map(f).join(",")).join(" ")}" fill="${PALETTE[i]}66" stroke="#fff" stroke-width="2"/>`;
        }
        body += `<path ${anim("pl-fade", 1)} d="${sector(cx, cy, 60, 90 + 3 * 108 - 54, 90 + 360 - 54)}" fill="${C.red}"/>${text(cx - 6, cy + 55, "36° boşluk", { size: 13, color: C.red, cls: "pl-fade", d: 1 })}`;
      }
      const say = { sq: "Kareler kenar kenara oturuyor; hiç boşluk kalmıyor. Alanı birim karelerle ölçmemizin sebebi bu.", rect: "Dikdörtgen fayanslar da tuğla gibi dizilince boşluksuz kaplar.", circle: "Daireler ne kadar sıkışık dizilse de aralarında kırmızı boşluklar kalıyor. Daireyle tek başına boşluksuz döşeme yapılamaz.", pent: "Düzgün beşgenin her açısı 108°. Üç tanesi bir köşede 324° eder; 360°ye 36° eksik kalır. Boşluk kapanmaz." }[v.mode];
      return svg(body, say, 200) + badges([[ok, "Boşluksuz kaplar"]]) + cap(say);
    }
  });

  add("im-same-area", {
    instruction: "Alanı seç, sonra aynı sayıda kareyi farklı dikdörtgenlere diz. Çevre değişiyor mu?",
    controls: [choice("A", "Alan", "12", [["12", "12"], ["16", "16"], ["24", "24"], ["36", "36"]]), range("i", "Diziliş", 0, 4, 0)],
    adjust(v) { const n = Number(v.A); let c = 0; for (let k = 1; k * k <= n; k++) if (n % k === 0) c++; if (v.i > c - 1) v.i = c - 1; },
    demo: [{ A: "12", i: 0 }, { A: "12", i: 1 }, { A: "12", i: 2 }],
    render(v) {
      const n = Number(v.A), pairs = [];
      for (let k = 1; k * k <= n; k++) if (n % k === 0) pairs.push([n / k, k]);
      const [w, h] = pairs[v.i], u = Math.min(28, 360 / w, 150 / h), x0 = 210 - w * u / 2;
      const body = gridRect(w, h, u, x0, 20, { tiles: true, speed: 0.025 }) + `<rect x="${x0}" y="20" width="${w * u}" height="${h * u}" fill="none" stroke="${C.red}" stroke-width="4"/>`;
      const minP = Math.min(...pairs.map(([p, q]) => 2 * (p + q)));
      return svg(body, `${w} × ${h}`, 40 + h * u) + chips(pairs.map(([p, q], k) => [k === v.i, `${p} × ${q} → çevre ${2 * (p + q)}`])) +
        cap(`${w} × ${h} = ${n} birim kare. Çevre 2 × (${w} + ${h}) = ${2 * (w + h)} birim. Kare sayısı hep ${n}, ama çevre dizilişe göre değişiyor.${2 * (w + h) === minP ? " Kenarlar birbirine en yakın olduğunda çevre en kısa olur." : ""}`);
    }
  });

  add("im-poly-tri", {
    instruction: "Kenar sayısını seç. A köşesinden çıkan köşegenler çokgeni kaç renkli üçgene ayırıyor?",
    controls: [range("n", "Kenar sayısı", 4, 8, 5), choice("show", "Gösterim", "tri", [["diag", "Yalnız köşegenler"], ["tri", "Üçgenlere ayır"]])],
    demo: [{ n: 4, show: "tri" }, { n: 5, show: "tri" }, { n: 6, show: "tri" }, { n: 7, show: "tri" }, { n: 8, show: "tri" }],
    render(v) {
      const n = v.n, pts = Array.from({ length: n }, (_, k) => pt(210, 108, 225 - k * 360 / n, 78));
      const tris = [];
      if (v.show === "tri") {
        for (let k = 1; k < n - 1; k++) {
          const a = pts[0], b = pts[k], c = pts[k + 1];
          const mx = (a[0] + b[0] + c[0]) / 3, my = (a[1] + b[1] + c[1]) / 3;
          tris.push(`<polygon points="${f(a[0])},${f(a[1])} ${f(b[0])},${f(b[1])} ${f(c[0])},${f(c[1])}" fill="${PALETTE[(k - 1) % PALETTE.length]}" fill-opacity="0.22" ${anim("pl-fade", (k - 1) * 0.14)}/>` +
            text(mx, my + 4, `${k}. üçgen (180°)`, { size: 11, color: C.ink }));
        }
      }
      const diags = [];
      for (let k = 2; k < n - 1; k++) {
        diags.push(line(pts[0][0], pts[0][1], pts[k][0], pts[k][1], C.red, 3, `stroke-dasharray="6 4" ${draw((k - 2) * 0.12)}`));
      }
      const poly = `<polygon points="${pts.map((p) => `${f(p[0])},${f(p[1])}`).join(" ")}" fill="none" stroke="${C.blue}" stroke-width="4" stroke-linejoin="round"/>`;
      const dots = pts.map((p, k) => {
        const lp = pt(210, 108, 225 - k * 360 / n, 95);
        return dot(p[0], p[1], k === 0 ? C.gold : C.red, k === 0 ? 8 : 6, k * 0.04) + text(lp[0], lp[1] + 4, LETTERS[k], { size: 13, color: k === 0 ? C.gold : C.ink });
      }).join("");
      return svg(tris.join("") + poly + diags.join("") + dots, "Köşegenlerle üçgenlere ayırma") +
        badges([[`${n} kenar`, C.blue], [`A'dan ${n - 3} köşegen`, C.red], [`${n - 2} üçgen`, C.green], [`Toplam ${(n - 2) * 180}°`, C.gold]]) +
        cap(`A köşesinden komşu olmayan köşelere <b>${n - 3}</b> köşegen çizilir ve çokgen <b>${n - 2}</b> üçgene ayrılır. Her üçgenin iç açıları toplamı 180° olduğu için ${n} kenarlı çokgenin iç açıları toplamı ${n - 2} × 180° = <b>${(n - 2) * 180}°</b> olur.`);
    }
  });

  add("im-abacus", {
    instruction: "Çubuklardaki boncuk sayılarını değiştir; basamak abaküsünde sayının nasıl kurulduğunu ve okunduğunu gör.",
    controls: [range("m", "Milyonlar", 0, 9, 2), range("yb", "Yüz binler", 0, 9, 0), range("ob", "On binler", 0, 9, 4), range("b", "Binler", 0, 9, 3), range("y", "Yüzler", 0, 9, 0), range("o", "Onlar", 0, 9, 5), range("bir", "Birler", 0, 9, 6)],
    demo: [
      { m: 2, yb: 0, ob: 4, b: 3, y: 0, o: 5, bir: 6 },
      { m: 5, yb: 0, ob: 0, b: 0, y: 3, o: 0, bir: 7 },
      { m: 0, yb: 8, ob: 2, b: 0, y: 4, o: 9, bir: 0 }
    ],
    render(v) {
      const cols = [
        ["Milyon", v.m, C.gold], ["Y.Bin", v.yb, C.red], ["O.Bin", v.ob, C.red],
        ["Bin", v.b, C.red], ["Yüz", v.y, C.blue], ["On", v.o, C.blue], ["Bir", v.bir, C.blue]
      ];
      const n = v.m * 1e6 + v.yb * 1e5 + v.ob * 1e4 + v.b * 1e3 + v.y * 100 + v.o * 10 + v.bir;
      const rods = cols.map(([lbl, count, col], i) => {
        const x = 45 + i * 55;
        let beads = "";
        for (let k = 0; k < count; k++) {
          const y = 148 - k * 11;
          beads += `<ellipse cx="${x}" cy="${y}" rx="15" ry="5.5" fill="${col}" stroke="#fff" stroke-width="1.2" ${anim("pl-pop", k * 0.03)}/>`;
        }
        return `<line x1="${x}" y1="42" x2="${x}" y2="156" stroke="${C.wood}" stroke-width="4" stroke-linecap="round"/>` +
          beads +
          `<rect x="${x - 21}" y="160" width="42" height="24" rx="6" fill="#fff" stroke="${col}" stroke-width="2"/>` +
          text(x, 177, count, { size: 14, color: col }) +
          text(x, 198, lbl, { size: 10, color: C.ink });
      }).join("");
      const base = `<rect x="20" y="154" width="380" height="8" rx="4" fill="${C.wood}"/>` +
        text(210, 26, `${group(n)} — "${sayNumber(n)}"`, { size: 14, color: C.ink });
      return svg(base + rods, "Basamak abaküsü", 210) +
        badges([[`Milyonlar: ${v.m}`, C.gold], [`Binler bölüğü: ${v.yb}${v.ob}${v.b}`, C.red], [`Birler bölüğü: ${v.y}${v.o}${v.bir}`, C.blue]]) +
        cap(`Boncuk olmayan çubuğa <b>0</b> yazılır; basamak tutucu sıfır unutulursa sayı kayar. Sayı: <b>${group(n)}</b> (${sayNumber(n)}).`);
    }
  });

  add("im-polyomino", {
    instruction: "4 eş kareyle kurulan şekillerden (tetromino) birini seç. Alanlar hep 4 birim kare; peki dış kenar sayısı (çevre) neden değişiyor?",
    controls: [choice("shape", "Şekil (4 kare)", "O", [["O", "Kare (2×2)"], ["I", "Çubuk (1×4)"], ["L", "L şekli"], ["T", "T şekli"], ["Z", "Z şekli"]])],
    demo: [{ shape: "O" }, { shape: "I" }, { shape: "L" }, { shape: "T" }, { shape: "Z" }],
    render(v) {
      const map = {
        O: [[1, 1], [2, 1], [1, 2], [2, 2]],
        I: [[0, 1], [1, 1], [2, 1], [3, 1]],
        L: [[1, 0], [1, 1], [1, 2], [2, 2]],
        T: [[1, 1], [2, 1], [3, 1], [2, 2]],
        Z: [[1, 1], [2, 1], [2, 2], [3, 2]]
      };
      const cells = map[v.shape] || map.O, set = new Set(cells.map(([x, y]) => `${x},${y}`));
      const u = 42, ox = 115, oy = 32;
      let tiles = "", edges = "", perim = 0, shared = 0;
      cells.forEach(([cx, cy], idx) => {
        const x = ox + cx * u, y = oy + cy * u;
        tiles += `<rect x="${x + 2}" y="${y + 2}" width="${u - 4}" height="${u - 4}" rx="5" fill="${C.sky}" stroke="${C.blue}" stroke-width="1.5" ${anim("pl-pop", idx * 0.06)}/>` +
          text(x + u / 2, y + u / 2 + 5, "1 br²", { size: 11, color: C.blue });
        const dirs = [[[0, -1], [x, y, x + u, y]], [[1, 0], [x + u, y, x + u, y + u]], [[0, 1], [x, y + u, x + u, y + u]], [[-1, 0], [x, y, x, y + u]]];
        dirs.forEach(([[dx, dy], [x1, y1, x2, y2]]) => {
          if (!set.has(`${cx + dx},${cy + dy}`)) {
            perim++;
            edges += line(x1, y1, x2, y2, C.red, 4);
          } else {
            shared++;
            edges += line(x1, y1, x2, y2, C.green, 2, 'stroke-dasharray="4 3"');
          }
        });
      });
      const internal = shared / 2;
      return svg(tiles + edges + text(210, 194, `Kırmızı dış kenar = ${perim} br · Yeşil iç temas = ${internal} kenar`, { size: 12, color: C.ink }), "Eş alanlı şekiller", 206) +
        badges([[`Alan = 4 birim kare`, C.blue], [`İç temas = ${internal}`, C.green], [`Çevre = ${perim} birim`, C.red]]) +
        cap(`Her karenin 4 kenarı vardır (4 × 4 = 16). Kareler birbirine değdikçe içeride kalan her ortak kenar dış çevreden 2 kenar eksiltir: 16 − 2 × ${internal} = <b>${perim} birim</b>.`);
    }
  });

  /* ---------- 7. Sınıf Görsel Modelleri ---------- */
  add("im-m7-sea", {
    instruction: "Nesneyi deniz seviyesine (0) göre hareket ettir. Karşıt noktayı da göstererek sıfıra uzaklığı karşılaştır.",
    controls: [range("h", "Konum (metre)", -15, 15, -8), choice("opp", "Karşıt sayı", "1", [["0", "Gizle"], ["1", "Karşıtını göster"]])],
    demo: [{ h: -10, opp: "1" }, { h: 0, opp: "0" }, { h: 12, opp: "1" }, { h: -6, opp: "1" }],
    render(v) {
      const h = v.h, y0 = 105, y = y0 - h * 4.8, yo = y0 + h * 4.8;
      const skySea = `<rect x="20" y="16" width="380" height="89" rx="8" fill="#eef6ff"/>` +
        `<rect x="20" y="105" width="380" height="92" rx="8" fill="#d8ecff"/>` +
        line(20, y0, 400, y0, C.blue, 3, 'stroke-dasharray="8 4"') +
        text(78, y0 - 6, "0 m (Deniz seviyesi)", { size: 11, color: C.blue });
      const ruler = [-15, -10, -5, 0, 5, 10, 15].map((m) => {
        const ym = y0 - m * 4.8;
        return line(192, ym, 204, ym, C.ink, 2) + text(176, ym + 4, (m > 0 ? "+" : "") + m, { size: 10, anchor: "end", color: m === 0 ? C.blue : C.ink });
      }).join("") + line(198, 28, 198, 182, C.ink, 2.5);
      const icon = h > 0 ? "🦅 Martı" : h < 0 ? "🤿 Dalgıç" : "⛵ Kayık";
      const main = line(255, y0, 255, y, h >= 0 ? C.green : C.red, 4) +
        dot(255, y, h >= 0 ? C.green : C.red, 9) +
        text(315, y + 5, `${icon}: ${h > 0 ? "+" + h : h} m`, { size: 13, color: h >= 0 ? C.green : C.red });
      const opp = v.opp === "1" && h !== 0
        ? line(255, y0, 255, yo, C.gold, 3, 'stroke-dasharray="5 4"') +
          dot(255, yo, C.gold, 7, 0.1) +
          text(318, yo + 4, `Karşıtı: ${-h > 0 ? "+" + -h : -h} m`, { size: 12, color: C.gold })
        : "";
      return svg(skySea + ruler + opp + main, "Deniz seviyesi ve tam sayılar") +
        badges([[`Konum: ${h > 0 ? "+" + h : h} m`, h >= 0 ? C.green : C.red], [`Sıfıra uzaklık: ${Math.abs(h)} m`, C.blue], [`Karşıtı: ${-h > 0 ? "+" + -h : -h}`, C.gold]]) +
        cap(`0 referans noktasıdır. Deniz üstü <b>+</b>, deniz altı <b>−</b> ile gösterilir. <b>${h}</b> ile <b>${-h}</b> karşıt sayılardır; ikisinin de 0'a uzaklığı <b>${Math.abs(h)}</b> metredir.`);
    }
  });

  add("im-m7-elevator", {
    instruction: "Başlangıç katını ve hareketi seç; asansörün hangi kata ulaştığını izle.",
    controls: [range("start", "Başlangıç katı", -4, 5, 2), range("move", "Hareket (kat)", -6, 6, -5)],
    demo: [{ start: 2, move: -5 }, { start: -3, move: 4 }, { start: 1, move: -4 }, { start: -2, move: 5 }],
    render(v) {
      const end = Math.max(-5, Math.min(6, v.start + v.move)), mv = end - v.start;
      const floors = [];
      for (let f = -5; f <= 6; f++) {
        const y = 115 - f * 14;
        floors.push(`<rect x="145" y="${y - 6}" width="76" height="13" rx="3" fill="${f === end ? "#fff3d1" : f === 0 ? "#e6f0fb" : "#fff"}" stroke="${f === 0 ? C.blue : "#d8cfc2"}"/>` +
          text(132, y + 4, f > 0 ? "+" + f : String(f), { size: 10, anchor: "end", color: f === 0 ? C.blue : f < 0 ? C.red : C.green }));
      }
      const y1 = 115 - v.start * 14, y2 = 115 - end * 14;
      const cab = `<rect x="160" y="${y2 - 5}" width="46" height="11" rx="3" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.5" ${anim("pl-pop")}/>`;
      const arrow = mv !== 0 ? line(248, y1, 248, y2, mv > 0 ? C.green : C.red, 4) + dot(248, y1, C.blue, 6) + dot(248, y2, mv > 0 ? C.green : C.red, 7, 0.12) +
        text(318, (y1 + y2) / 2 + 4, `${mv > 0 ? "↑ +" + mv : "↓ " + mv} kat`, { size: 13, color: mv > 0 ? C.green : C.red }) : "";
      return svg(floors.join("") + cab + arrow + text(64, 119, "Zemin (0)", { size: 11, color: C.blue }), "Asansör yolculuğu") +
        badges([[`Başlangıç: ${v.start}`, C.blue], [`Hareket: ${mv >= 0 ? "+" + mv : mv}`, mv >= 0 ? C.green : C.red], [`Varış: ${end}. kat`, C.gold]]) +
        cap(`(${v.start}) + (${mv >= 0 ? "+" + mv : mv}) = <b>${end}</b>. Zemin kat 0, otopark katları negatif, üst katlar pozitiftir.`);
    }
  });

  add("im-m7-sign", {
    instruction: "Eksiyi paya, paydaya veya kesrin önüne taşı; üç yazılımın da sayı doğrusunda aynı noktayı gösterdiğini gör.",
    controls: [range("p", "Pay (büyüklük)", 1, 5, 3), range("q", "Payda", 2, 6, 4), choice("pos", "İşaretin yeri", "front", [["front", "Önde: −(a/b)"], ["top", "Payda: (−a)/b"], ["bot", "Paydada: a/(−b)"], ["both", "İkisinde: (−a)/(−b)"]])],
    demo: [{ p: 3, q: 4, pos: "front" }, { p: 3, q: 4, pos: "top" }, { p: 3, q: 4, pos: "bot" }, { p: 3, q: 4, pos: "both" }],
    render(v) {
      const val = (v.pos === "both" ? 1 : -1) * (v.p / v.q);
      const cards = [
        ["front", `− ${v.p}/${v.q}`, -v.p / v.q],
        ["top", `(${-v.p})/${v.q}`, -v.p / v.q],
        ["bot", `${v.p}/(${-v.q})`, -v.p / v.q],
        ["both", `(${-v.p})/(${-v.q})`, v.p / v.q]
      ].map(([k, lbl, num], i) => {
        const x = 22 + i * 96, active = v.pos === k;
        return `<rect x="${x}" y="22" width="88" height="48" rx="10" fill="${active ? "#fff3d1" : "#fff"}" stroke="${active ? C.gold : C.blue}" stroke-width="${active ? 3 : 1.5}"/>` +
          text(x + 44, 44, lbl, { size: 14, color: active ? C.red : C.ink }) +
          text(x + 44, 62, `= ${f(num, 2)}`, { size: 11, color: num < 0 ? C.red : C.green });
      }).join("");
      const cx = 210, sc = 78, px = cx + val * sc;
      const axis = line(36, 145, 384, 145, C.ink, 3) +
        [-2, -1, 0, 1, 2].map((t) => line(cx + t * sc, 137, cx + t * sc, 153, C.ink, 2) + text(cx + t * sc, 170, t, { size: 12 })).join("") +
        line(cx, 145, px, 145, val < 0 ? C.red : C.green, 5) +
        dot(px, 145, val < 0 ? C.red : C.green, 8) +
        text(px, 122, f(val, 2), { size: 13, color: val < 0 ? C.red : C.green });
      return svg(cards + axis, "Rasyonel sayıda işaretin yeri") +
        badges([[`Değer = ${f(val, 3)}`, val < 0 ? C.red : C.green], [v.pos === "both" ? "İki eksi → Pozitif" : "Tek eksi → Negatif", C.gold]]) +
        cap(v.pos === "both"
          ? `Hem pay hem payda negatifse (− ÷ − = +) kesir <b>pozitif</b> olur: (${-v.p})/(${-v.q}) = +${v.p}/${v.q}.`
          : `Tek eksi işareti önde, payda veya paydada durabilir; üçü de sayı doğrusunda aynı noktayı (<b>−${v.p}/${v.q}</b>) gösterir.`);
    }
  });

  add("im-m7-pack", {
    instruction: "Paket ağırlığını ve izin verilen sapma (tolerans) sınırını değiştir; mutlak değerin kalite kontrolünü nasıl yaptığını gör.",
    controls: [range("w", "Paket ağırlığı (g)", 485, 515, 494), range("tol", "Tolerans ± (g)", 2, 10, 5)],
    demo: [{ w: 494, tol: 5 }, { w: 497, tol: 5 }, { w: 500, tol: 5 }, { w: 504, tol: 5 }, { w: 508, tol: 5 }],
    render(v) {
      const diff = v.w - 500, abs = Math.abs(diff), ok = abs <= v.tol;
      const cx = 210, sc = 11, xMin = cx - v.tol * sc, xMax = cx + v.tol * sc, xVal = cx + diff * sc;
      const band = `<rect x="${xMin}" y="78" width="${(xMax - xMin)}" height="42" rx="8" fill="${C.mint}" stroke="${C.green}" stroke-width="2" stroke-dasharray="5 3"/>` +
        text(cx, 68, `Kabul aralığı: [${500 - v.tol} g, ${500 + v.tol} g]`, { size: 12, color: C.green });
      const axis = line(35, 100, 385, 100, C.ink, 3) +
        [-15, -10, -5, 0, 5, 10, 15].map((d) => line(cx + d * sc, 93, cx + d * sc, 107, C.ink, 1.8) + text(cx + d * sc, 134, 500 + d, { size: 10 })).join("");
      const pkg = line(cx, 100, xVal, 100, ok ? C.green : C.red, 5) +
        dot(xVal, 100, ok ? C.green : C.red, 9) +
        text(xVal, 44, `📦 ${v.w} g (|${diff}| = ${abs} g)`, { size: 13, color: ok ? C.green : C.red });
      return svg(band + axis + pkg + text(cx, 168, ok ? "✓ Kalite kontrolden geçti" : "✗ Tolerans dışı — ayrıldı", { size: 14, color: ok ? C.green : C.red }), "Mutlak değer ve tolerans aralığı") +
        badges([[`Hedef: 500 g`, C.blue], [`Fark: ${diff >= 0 ? "+" + diff : diff} g`, C.ink], [`Sapma |${diff}| = ${abs} g`, ok ? C.green : C.red], [ok ? "Kabul" : "Red", ok ? C.green : C.red]]) +
        cap(`Mutlak değer, hedeften sapma miktarını verir: |${v.w} − 500| = <b>${abs} g</b>. Sapma ≤ ${v.tol} g ise paket kabul edilir.`);
    }
  });

  add("im-m7-rep", {
    instruction: "Pay ve paydayı seç; uzun bölme adımlarını izle. Kalan sıfırlanıyor mu yoksa tekrar etmeye mi başlıyor?",
    controls: [range("p", "Pay", 1, 11, 4), choice("q", "Payda", "9", [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["8", "8"], ["9", "9"], ["11", "11"]])],
    demo: [{ p: 3, q: "4" }, { p: 1, q: "3" }, { p: 4, q: "9" }, { p: 5, q: "6" }, { p: 3, q: "11" }],
    render(v) {
      const p = v.p, q = Number(v.q), intPart = Math.floor(p / q);
      let rem = p % q, seen = {}, digits = [], rems = [rem], repeatAt = -1;
      while (rem !== 0 && repeatAt < 0 && digits.length < 8) {
        if (seen[rem] !== undefined) { repeatAt = seen[rem]; break; }
        seen[rem] = digits.length;
        rem *= 10;
        digits.push(Math.floor(rem / q));
        rem = rem % q;
        rems.push(rem);
      }
      const finite = rem === 0 && repeatAt < 0;
      const decStr = digits.length === 0 ? `${intPart}` : finite
        ? `${intPart},${digits.join("")}`
        : `${intPart},${digits.slice(0, repeatAt).join("")}(${digits.slice(repeatAt).join("")})`;
      const boxes = digits.map((d, i) => {
        const x = 42 + i * 52, rep = repeatAt >= 0 && i >= repeatAt;
        return `<rect x="${x}" y="52" width="44" height="44" rx="8" fill="${rep ? "#fde6e2" : "#e6f0fb"}" stroke="${rep ? C.red : C.blue}" stroke-width="2" ${anim("pl-pop", i * 0.08)}/>` +
          (rep ? line(x + 6, 46, x + 38, 46, C.red, 3.5) : "") +
          text(x + 22, 80, d, { size: 18, color: rep ? C.red : C.blue }) +
          text(x + 22, 116, `kalan ${rems[i + 1]}`, { size: 10, color: C.ink });
      }).join("");
      return svg(text(210, 28, `${p} ÷ ${q} = ${decStr}`, { size: 18, color: C.ink }) + boxes +
        text(210, 156, finite ? "Kalan 0 oldu → Sonlu ondalık gösterim" : `Kalan (${rems[repeatAt]}) tekrar etti → Devirli ondalık gösterim`, { size: 13, color: finite ? C.green : C.red }), "Kesirden ondalığa: uzun bölme") +
        badges([[`${p}/${q} = ${decStr}`, C.blue], [finite ? "Sonlu ondalık" : "Devirli ondalık", finite ? C.green : C.red]]) +
        cap(finite
          ? `Bölmede kalan 0'a ulaştığı için basamaklar biter: <b>${decStr}</b>.`
          : `Bölmede aynı kalan yeniden çıktığı için rakamlar sonsuza dek tekrar eder ve devreden kısmın üstüne çizgi konur: <b>${decStr}</b>.`);
    }
  });

  add("im-m7-dense", {
    instruction: "Büyüteç kademesini artır; iki rasyonel sayının ortasını bularak aralarında sonsuz sayıda rasyonel sayı olduğunu gör.",
    controls: [choice("pair", "Başlangıç aralığı", "0", [["0", "1/4 ile 2/4"], ["1", "−2/3 ile −1/3"], ["2", "0,2 ile 0,3"]]), range("zoom", "Büyüteç kademesi", 1, 4, 1)],
    demo: [{ pair: "0", zoom: 1 }, { pair: "0", zoom: 2 }, { pair: "0", zoom: 3 }, { pair: "0", zoom: 4 }],
    render(v) {
      const base = v.pair === "1" ? [-2, 3, -1, 3] : v.pair === "2" ? [2, 10, 3, 10] : [1, 4, 2, 4];
      const mult = Math.pow(2, v.zoom), den = base[1] * mult, a = base[0] * mult, b = base[2] * mult;
      const mids = [];
      for (let k = a + 1; k < b; k++) mids.push(`${k}/${den}`);
      const pts = [];
      for (let k = a; k <= b; k++) {
        const t = (k - a) / (b - a), x = 55 + t * 310, isEnd = k === a || k === b;
        pts.push(line(x, 96, x, 118, isEnd ? C.blue : C.red, isEnd ? 3 : 2) +
          dot(x, 107, isEnd ? C.blue : C.red, isEnd ? 8 : 5, (k - a) * 0.04) +
          (b - a <= 8 || isEnd || k === (a + b) / 2 ? text(x, isEnd ? 78 : 140, `${k}/${den}`, { size: 11, color: isEnd ? C.blue : C.red }) : ""));
      }
      return svg(`<circle cx="210" cy="107" r="76" fill="${C.sky}" fill-opacity="0.35" stroke="${C.gold}" stroke-width="2" stroke-dasharray="6 4"/>` +
        line(45, 107, 375, 107, C.ink, 3) + pts.join("") +
        text(210, 28, `×${mult} genişletme: ${a}/${den} ile ${b}/${den} arasında ${b - a - 1} kesir görünür`, { size: 13, color: C.ink }), "Rasyonel sayıların yoğunluğu") +
        badges([[`Payda ×${mult} = ${den}`, C.blue], [`Görünür ara kesir: ${b - a - 1} tane`, C.red], [`Tam ortası: ${(a + b) / 2}/${den}`, C.green]]) +
        cap(`Paydayı her 2 katına çıkardığımızda aralıkta yeni kesirler belirir (${mids.slice(0, 5).join(", ")}${mids.length > 5 ? "…" : ""}). İki rasyonel sayı arasında <b>sonsuz</b> rasyonel sayı vardır.`);
    }
  });

  add("im-m7-chips", {
    instruction: "Sayıları ve işlemi seç; +1 (mavi) ve −1 (kırmızı) pulların sıfır çiftleri yaparak işlemi nasıl modellediğini izle.",
    controls: [range("a", "1. sayı", -6, 6, -3), choice("op", "İşlem", "+", [["+", "Toplama (+)"], ["-", "Çıkarma (−)"]]), range("b", "2. sayı", -6, 6, 5)],
    demo: [{ a: -3, op: "+", b: 5 }, { a: 4, op: "-", b: -2 }, { a: -2, op: "-", b: 3 }, { a: -4, op: "+", b: -3 }],
    render(v) {
      const bEff = v.op === "+" ? v.b : -v.b, res = v.a + bEff;
      const pos = (v.a > 0 ? v.a : 0) + (bEff > 0 ? bEff : 0);
      const neg = (v.a < 0 ? -v.a : 0) + (bEff < 0 ? -bEff : 0);
      const pairs = Math.min(pos, neg);
      let svgChips = "";
      for (let i = 0; i < pos; i++) {
        const x = 48 + i * 28, paired = i < pairs;
        svgChips += `<circle cx="${x}" cy="70" r="11" fill="${C.blue}" opacity="${paired ? 0.35 : 1}" ${anim("pl-pop", i * 0.04)}/>` +
          text(x, 74, "+", { size: 14, color: "#fff" });
      }
      for (let i = 0; i < neg; i++) {
        const x = 48 + i * 28, paired = i < pairs;
        svgChips += `<circle cx="${x}" cy="112" r="11" fill="${C.red}" opacity="${paired ? 0.35 : 1}" ${anim("pl-pop", i * 0.04)}/>` +
          text(x, 116, "−", { size: 14, color: "#fff" });
        if (paired) svgChips += `<rect x="${x - 13}" y="55" width="26" height="72" rx="12" fill="none" stroke="${C.gold}" stroke-width="2" stroke-dasharray="4 3"/>`;
      }
      const head = v.op === "-"
        ? `(${v.a}) − (${v.b}) = (${v.a}) + (${bEff >= 0 ? "+" + bEff : bEff}) = ${res}`
        : `(${v.a}) + (${v.b}) = ${res}`;
      return svg(text(210, 28, head, { size: 15, color: C.ink }) + svgChips +
        text(210, 162, `Sıfır çifti: ${pairs} adet (+1 ile −1 birbirini sıfırlar) → Kalan: ${res}`, { size: 12, color: C.ink }), "Sayma pulları ve sıfır çifti") +
        badges([[`+ pul: ${pos}`, C.blue], [`− pul: ${neg}`, C.red], [`Sıfır çifti: ${pairs}`, C.gold], [`Sonuç = ${res}`, res >= 0 ? C.green : C.red]]) +
        cap(v.op === "-"
          ? `Çıkarma işleminde çıkan sayının <b>toplama göre tersi</b> eklenir: (${v.a}) − (${v.b}) = (${v.a}) + (${bEff}) = <b>${res}</b>.`
          : `Bir +1 pul ile bir −1 pul <b>sıfır çifti</b> oluşturur. ${pairs} sıfır çifti elenince geriye <b>${res}</b> kalır.`);
    }
  });

  add("im-m7-ledger", {
    instruction: "Başlangıç bakiyesini, gelirleri ve giderleri değiştir; bütçe tablosunun adım adım nasıl güncellendiğini gör.",
    controls: [range("start", "Başlangıç (TL)", -100, 200, 50, 25), range("inc", "Gelir (+TL)", 0, 250, 125, 25), range("exp", "Gider (−TL)", 0, 250, 200, 25)],
    demo: [{ start: 50, inc: 125, exp: 200 }, { start: -50, inc: 200, exp: 75 }, { start: 100, inc: 50, exp: 150 }],
    render(v) {
      const afterInc = v.start + v.inc, end = afterInc - v.exp;
      const steps = [["Başlangıç", v.start], ["+ Gelir", afterInc], ["− Gider", end]];
      const bars = steps.map(([lbl, val], i) => {
        const x = 65 + i * 120, y0 = 115, h = Math.abs(val) * 0.25, y = val >= 0 ? y0 - h : y0;
        const col = val >= 0 ? C.green : C.red;
        return `<rect x="${x - 28}" y="${y}" width="56" height="${Math.max(4, h)}" rx="6" fill="${col}" fill-opacity="0.82" ${anim("pl-pop", i * 0.1)}/>` +
          text(x, val >= 0 ? y - 8 : y + h + 14, `${val >= 0 ? "+" : ""}${val} TL`, { size: 12, color: col }) +
          text(x, 184, lbl, { size: 12, color: C.ink });
      }).join("");
      return svg(line(30, 115, 390, 115, C.blue, 2, 'stroke-dasharray="5 3"') + text(35, 108, "0 TL", { size: 10, anchor: "start", color: C.blue }) + bars, "Gelir-gider bakiye planı") +
        badges([[`Başlangıç: ${v.start} TL`, C.blue], [`Gelir sonrası: ${afterInc} TL`, C.green], [`Son bakiye: ${end} TL`, end >= 0 ? C.green : C.red]]) +
        cap(`${v.start} + ${v.inc} − ${v.exp} = <b>${end} TL</b>. ${end >= 0 ? "Bakiye artıda (alacaklı/fazla)." : "Bakiye ekside (borçlu/açık)."}`);
    }
  });

  add("im-m7-pow", {
    instruction: "Rasyonel sayıyı, üssü ve parantez durumunu seç; işaretin ve değerin neden değiştiğini karşılaştır.",
    controls: [range("p", "Pay (−)", 1, 4, 2), range("q", "Payda", 2, 5, 3), choice("exp", "Üs", "2", [["2", "Karesi (²)"], ["3", "Küpü (³)"]]), choice("par", "Parantez", "in", [["in", "Parantezli: (−a/b)ⁿ"], ["out", "Parantezsiz: −(a/b)ⁿ"]])],
    demo: [{ p: 2, q: 3, exp: "2", par: "in" }, { p: 2, q: 3, exp: "2", par: "out" }, { p: 2, q: 3, exp: "3", par: "in" }, { p: 1, q: 2, exp: "2", par: "in" }],
    render(v) {
      const n = Number(v.exp), pn = Math.pow(v.p, n), qn = Math.pow(v.q, n);
      const sign = v.par === "in" ? (n % 2 === 0 ? 1 : -1) : -1;
      const expr = v.par === "in" ? `(−${v.p}/${v.q})${n === 2 ? "²" : "³"}` : `−(${v.p}/${v.q})${n === 2 ? "²" : "³"}`;
      const factors = Array.from({ length: n }, () => v.par === "in" ? `(−${v.p}/${v.q})` : `${v.p}/${v.q}`).join(" × ");
      const expanded = v.par === "in" ? factors : `−(${factors})`;
      return svg(
        `<rect x="35" y="24" width="350" height="52" rx="12" fill="#fff" stroke="${C.blue}" stroke-width="2"/>` +
        text(210, 56, `${expr} = ${expanded}`, { size: 15, color: C.ink }) +
        `<rect x="85" y="96" width="250" height="62" rx="14" fill="${sign > 0 ? C.mint : "#fde6e2"}" stroke="${sign > 0 ? C.green : C.red}" stroke-width="2.5" ${anim("pl-pop", 0.1)}/>` +
        text(210, 134, `Sonuç: ${sign > 0 ? "+" : "−"}${pn}/${qn}`, { size: 20, color: sign > 0 ? C.green : C.red }),
        "Rasyonel sayılarda üs ve parantez"
      ) +
        badges([[expr, C.blue], [sign > 0 ? "İşaret: Pozitif (+)" : "İşaret: Negatif (−)", sign > 0 ? C.green : C.red], [`Değer: ${sign > 0 ? "+" : "−"}${pn}/${qn}`, C.gold]]) +
        cap(v.par === "in"
          ? `Parantez içinde negatif tabanın ${n === 2 ? "çift (2) kuvveti <b>pozitif</b>" : "tek (3) kuvveti <b>negatif</b>"} olur: ${expr} = <b>${sign > 0 ? "+" : "−"}${pn}/${qn}</b>.`
          : `Parantez eksiyi kapsamazsa önce kuvvet alınır, eksi önde kalır: ${expr} = <b>−${pn}/${qn}</b>.`);
    }
  });

  add("im-m7-jugs", {
    instruction: "Büyük sürahideki meyve suyunu ve küçük bardak ölçüsünü seç; rasyonel bölmenin kaç bardak doldurduğunu gör.",
    controls: [choice("tot", "Sürahi (L)", "6/4", [["6/4", "3/2 L (1,5 L)"], ["9/4", "9/4 L (2,25 L)"], ["12/4", "3 L"]]), choice("cup", "Bardak (L)", "1/4", [["1/4", "1/4 L"], ["3/8", "3/8 L"], ["1/2", "1/2 L"]])],
    demo: [{ tot: "6/4", cup: "1/4" }, { tot: "9/4", cup: "3/8" }, { tot: "12/4", cup: "1/2" }],
    render(v) {
      const [tp, tq] = v.tot.split("/").map(Number), [cp, cq] = v.cup.split("/").map(Number);
      const total = tp / tq, cup = cp / cq, count = Math.round((total / cup) * 100) / 100;
      const fullCups = Math.floor(count);
      let cupsSvg = "";
      for (let i = 0; i < Math.min(12, fullCups); i++) {
        const x = 155 + (i % 6) * 42, y = i < 6 ? 55 : 118;
        cupsSvg += `<rect x="${x}" y="${y}" width="30" height="42" rx="4" fill="#fff" stroke="${C.blue}" stroke-width="2"/>` +
          `<rect x="${x + 2}" y="${y + 8}" width="26" height="32" rx="2" fill="${C.gold}" ${anim("pl-pop", i * 0.06)}/>` +
          text(x + 15, y + 54, `${i + 1}`, { size: 10, color: C.ink });
      }
      const jug = `<rect x="38" y="45" width="78" height="118" rx="10" fill="#fff" stroke="${C.blue}" stroke-width="3"/>` +
        `<rect x="42" y="${160 - total * 34}" width="70" height="${total * 34}" rx="6" fill="${C.gold}" fill-opacity="0.85"/>` +
        text(77, 34, `Sürahi: ${f(total, 2)} L`, { size: 12, color: C.blue });
      return svg(jug + cupsSvg + text(270, 32, `(${tp}/${tq}) ÷ (${cp}/${cq}) = (${tp}/${tq}) × (${cq}/${cp}) = ${count} bardak`, { size: 12, color: C.ink }), "Bölme: ters çevirip çarpma") +
        badges([[`Toplam: ${f(total, 2)} L`, C.blue], [`Bardak: ${v.cup} L`, C.gold], [`Sonuç: ${count} bardak`, C.green]]) +
        cap(`Bir rasyonel sayıyı başka bir rasyonel sayıya bölerken ikinci kesir <b>ters çevrilip çarpılır</b>: (${tp}/${tq}) × (${cq}/${cp}) = <b>${count}</b> tam bardak.`);
    }
  });

  add("im-m7-tankstep", {
    instruction: "Çok adımlı işlemin veya su deposu probleminin adımlarını sırayla ilerlet; işlem önceliğini canlı izle.",
    controls: [choice("mode", "Senaryo", "order", [["order", "İşlem önceliği ağacı"], ["bar", "Kesir çizgisi gruplar"], ["tank", "Su deposu problemi"]]), range("step", "Adım", 1, 3, 1)],
    demo: [{ mode: "order", step: 1 }, { mode: "order", step: 2 }, { mode: "order", step: 3 }, { mode: "bar", step: 2 }, { mode: "tank", step: 3 }],
    render(v) {
      if (v.mode === "tank") {
        const levels = [1, 3 / 5, 3 / 5 + 1 / 5, 4 / 5];
        const lv = levels[v.step];
        const msgs = [
          "",
          "1. adım: Deponun 2/5'i kullanıldı → Kalan: 1 − 2/5 = 3/5",
          "2. adım: Kalanın (3/5) 1/3'ü kadar su eklendi → (3/5) × (1/3) = 1/5 eklendi",
          "3. adım: Son doluluk: 3/5 + 1/5 = 4/5 (Deponun %80'i dolu)"
        ];
        const h = lv * 110;
        const tank = `<rect x="145" y="34" width="130" height="116" rx="10" fill="#fff" stroke="${C.blue}" stroke-width="3"/>` +
          `<rect x="149" y="${146 - h}" width="122" height="${h}" rx="6" fill="${C.sky}" stroke="${C.blue}" ${anim("pl-pop")}/>` +
          [1, 2, 3, 4].map((k) => line(145, 146 - k * 22, 275, 146 - k * 22, C.blue, 1, 'stroke-dasharray="4 3"')).join("") +
          text(210, 96, `${Math.round(lv * 5)}/5 dolu`, { size: 18, color: C.blue });
        return svg(tank + text(210, 178, msgs[v.step], { size: 12, color: C.ink }), "Çok adımlı depo problemi") +
          badges([[`Adım ${v.step}/3`, C.blue], [`Doluluk: ${Math.round(lv * 5)}/5`, C.green]]) +
          cap(msgs[v.step]);
      }
      const rows = v.mode === "bar"
        ? [
            "Başlangıç: (1/2 + 1/3) / (5/6 − 1/3)",
            "1. adım (Pay ve payda ayrı parantezdir): Pay = 5/6 , Payda = 3/6",
            "2. adım (Ana kesir çizgisi bölmedir): (5/6) ÷ (3/6)",
            "3. adım (Ters çevir çarp): (5/6) × (6/3) = 5/3"
          ]
        : [
            "Başlangıç: 3/4 + (1/2)² ÷ (3/8)",
            "1. adım (Üs ve parantez): (1/2)² = 1/4 → 3/4 + 1/4 ÷ 3/8",
            "2. adım (Bölme toplamadan önce): (1/4) × (8/3) = 2/3",
            "3. adım (Toplama): 3/4 + 2/3 = 9/12 + 8/12 = 17/12"
          ];
      const cards = [0, 1, 2, 3].map((k) => {
        const active = k <= v.step, cur = k === v.step;
        return `<rect x="28" y="${18 + k * 44}" width="364" height="36" rx="8" fill="${cur ? "#fff3d1" : active ? "#eef6ff" : "#f5f2ec"}" stroke="${cur ? C.gold : active ? C.blue : "#d8cfc2"}" stroke-width="${cur ? 2.5 : 1.5}"/>` +
          text(210, 41 + k * 44, rows[k], { size: 12, color: active ? C.ink : "#999" });
      }).join("");
      return svg(cards, "Çok adımlı işlem sırası") +
        badges([[`1. Üs / Parantez`, C.gold], [`2. Çarpma / Bölme`, C.red], [`3. Toplama / Çıkarma`, C.blue]]) +
        cap(rows[v.step]);
    }
  });

  add("im-m7-views3d", {
    instruction: "Yapıyı ve bakış yönünü seç; 3B birim küp yapısının yanında seçtiğin yöndeki 2B karesel görünümün nasıl oluştuğunu gör.",
    controls: [choice("b", "Yapı", "L", [["L", "L kulesi (5 küp)"], ["step", "Basamaklı yapı (6 küp)"], ["amb", "İki farklı yapı — aynı görünüm"]]), choice("dir", "Bakış yönü", "top", [["top", "Üstten"], ["front", "Önden"], ["right", "Sağdan"]])],
    demo: [{ b: "L", dir: "top" }, { b: "L", dir: "front" }, { b: "L", dir: "right" }, { b: "step", dir: "front" }, { b: "amb", dir: "top" }],
    render(v) {
      const grids = {
        L: [[2, 1, 0], [1, 0, 0], [1, 0, 0]],
        step: [[3, 2, 1], [0, 0, 0], [0, 0, 0]],
        amb: [[2, 1, 0], [1, 2, 0], [0, 0, 0]]
      };
      const g = grids[v.b] || grids.L;
      const iso = (x, y, z) => ({ x: 112 + (x - y) * 20, y: 120 + (x + y) * 10 - z * 18 });
      const drawCube = (x, y, z, d) => {
        const p = iso(x, y, z), dx = 20, dy = 10, dz = 18;
        const top = `${p.x},${p.y - dz} ${p.x + dx},${p.y - dz + dy} ${p.x},${p.y - dz + 2 * dy} ${p.x - dx},${p.y - dz + dy}`;
        const left = `${p.x - dx},${p.y - dz + dy} ${p.x},${p.y - dz + 2 * dy} ${p.x},${p.y + 2 * dy} ${p.x - dx},${p.y + dy}`;
        const right = `${p.x},${p.y - dz + 2 * dy} ${p.x + dx},${p.y - dz + dy} ${p.x + dx},${p.y + dy} ${p.x},${p.y + 2 * dy}`;
        return `<g ${anim("pl-pop", d)}>` +
          `<polygon points="${top}" fill="${v.dir === "top" ? "#ffe39a" : "#9ec5fe"}" stroke="${C.ink}" stroke-width="1.2"/>` +
          `<polygon points="${left}" fill="${v.dir === "front" ? "#ffe39a" : "#6ea8fe"}" stroke="${C.ink}" stroke-width="1.2"/>` +
          `<polygon points="${right}" fill="${v.dir === "right" ? "#ffe39a" : "#3d8bfd"}" stroke="${C.ink}" stroke-width="1.2"/>` +
          `</g>`;
      };
      let cubes = "", idx = 0, total = 0;
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          for (let z = 0; z < g[y][x]; z++) {
            cubes += drawCube(x, y, z, idx++ * 0.03);
            total++;
          }
        }
      }
      let cells = "", squareCount = 0;
      const u = 28, ox = 255, oy = 52;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          let filled = false, label = "";
          if (v.dir === "top") { filled = g[r][c] > 0; label = filled ? String(g[r][c]) : ""; }
          else if (v.dir === "front") {
            const maxH = Math.max(g[0][c], g[1][c], g[2][c]);
            filled = (2 - r) < maxH;
          } else {
            const maxH = Math.max(g[r][0], g[r][1], g[r][2]);
            filled = (2 - c) < maxH;
          }
          if (filled) squareCount++;
          cells += `<rect x="${ox + c * u}" y="${oy + r * u}" width="${u}" height="${u}" fill="${filled ? "#ffe39a" : "#f7f3eb"}" stroke="${C.ink}" stroke-width="1.5"/>` +
            (label ? text(ox + c * u + u / 2, oy + r * u + u / 2 + 4, label, { size: 12, color: C.ink }) : "");
        }
      }
      const dirName = { top: "Üstten görünüm (kat sayılarıyla)", front: "Önden görünüm", right: "Sağdan görünüm" }[v.dir];
      return svg(cubes + text(112, 26, `3B Yapı (${total} birim küp)`, { size: 12, color: C.ink }) +
        cells + text(297, 36, dirName, { size: 12, color: C.blue }), "3B yapı ve 2B görünüm") +
        badges([[`Toplam: ${total} küp`, C.blue], [`Görünümde: ${squareCount} kare`, C.gold], [dirName, C.green]]) +
        cap(v.b === "amb"
          ? `Üstten görünümde her sütundaki küp sayısı yazılmadığında, farklı küp sayısına sahip yapılar aynı önden/sağdan görünümü verebilir.`
          : `<b>${dirName}</b> seçildiğinde derinlik farkları düzleşir ve yalnız bu yönden görünen <b>${squareCount}</b> karesel yüz çizilir.`);
    }
  });

  add("im-m7-net", {
    instruction: "Kutu türünü ve açınım adımını seç; karşılıklı eş yüz çiftlerini ve yüzey alanı hesabını incele.",
    controls: [choice("type", "Kutu türü", "prism", [["prism", "Dikdörtgenler prizması (4×3×2)"], ["open", "Üstü açık kutu (5 yüz)"], ["cube", "Küp (3×3×3)"]]), range("fold", "Açınım / Çift vurgusu", 0, 3, 1)],
    demo: [{ type: "prism", fold: 1 }, { type: "prism", fold: 2 }, { type: "prism", fold: 3 }, { type: "open", fold: 1 }, { type: "cube", fold: 0 }],
    render(v) {
      const [a, b, c] = v.type === "cube" ? [3, 3, 3] : [4, 3, 2];
      const s = 14, cx = 190, cy = 82;
      const faces = [
        { name: "Taban", x: cx, y: cy, w: a * s, h: b * s, pair: 1, col: C.blue, area: a * b },
        { name: "Ön", x: cx, y: cy + b * s, w: a * s, h: c * s, pair: 2, col: C.red, area: a * c },
        { name: "Arka", x: cx, y: cy - c * s, w: a * s, h: c * s, pair: 2, col: C.red, area: a * c },
        { name: "Sol", x: cx - c * s, y: cy, w: c * s, h: b * s, pair: 3, col: C.green, area: b * c },
        { name: "Sağ", x: cx + a * s, y: cy, w: c * s, h: b * s, pair: 3, col: C.green, area: b * c }
      ];
      if (v.type !== "open") {
        faces.push({ name: "Üst", x: cx + a * s + c * s, y: cy, w: a * s, h: b * s, pair: 1, col: C.blue, area: a * b });
      }
      const totalArea = faces.reduce((acc, f0) => acc + f0.area, 0);
      const boxes = faces.map((f0, i) => {
        const hi = v.fold === 0 || v.fold === f0.pair;
        return `<rect x="${f0.x}" y="${f0.y}" width="${f0.w}" height="${f0.h}" fill="${f0.col}" fill-opacity="${hi ? 0.35 : 0.12}" stroke="${f0.col}" stroke-width="${hi ? 3 : 1.5}" ${anim("pl-pop", i * 0.05)}/>` +
          text(f0.x + f0.w / 2, f0.y + f0.h / 2 + 4, `${f0.name} (${f0.area})`, { size: 10, color: C.ink });
      }).join("");
      return svg(boxes + text(210, 24, `${a}×${b}×${c} br — Toplam yüzey alanı = ${totalArea} br²`, { size: 13, color: C.ink }), "Prizma açınımı ve eş yüz çiftleri") +
        badges([[`Taban/Üst: ${a * b} br²`, C.blue], [`Ön/Arka: ${a * c} br²`, C.red], [`Yanlar: ${b * c} br²`, C.green], [`Toplam: ${totalArea} br²`, C.gold]]) +
        cap(v.type === "open"
          ? `Üstü açık kutuda üst kapak yoktur; <b>5 yüz</b> toplanır: ${a * b} + 2×${a * c} + 2×${b * c} = <b>${totalArea} br²</b>.`
          : v.type === "cube"
          ? `Küpün 6 yüzü de eş karedir: 6 × (${a} × ${a}) = <b>${totalArea} br²</b>.`
          : `Kapalı prizmada 3 çift eş dikdörtgen vardır: 2×(${a * b} + ${a * c} + ${b * c}) = <b>${totalArea} br²</b>.`);
    }
  });

  add("im-m7-unitcube", {
    instruction: "Ölçüm birimini veya karşılaştırma modunu değiştir; birim küp büyüdükçe sayının neden azaldığını ve hacim-alan farkını gör.",
    controls: [choice("unit", "Ölçüm birimi", "1", [["1", "Küçük birim küp (1×1×1)"], ["2", "Büyük birim küp (2×2×2)"]]), choice("cmp", "Kavram", "vol", [["vol", "İçini doldur (Hacim)"], ["area", "Yüzeyi kapla (Alan)"]])],
    demo: [{ unit: "1", cmp: "vol" }, { unit: "2", cmp: "vol" }, { unit: "1", cmp: "area" }],
    render(v) {
      const big = v.unit === "2", count = big ? 8 : 64;
      const box = `<rect x="65" y="38" width="120" height="120" rx="8" fill="${v.cmp === "area" ? "#fde6e2" : C.sky}" stroke="${C.blue}" stroke-width="3"/>`;
      const step = big ? 60 : 30, grid = [];
      for (let i = 1; i < (big ? 2 : 4); i++) {
        grid.push(line(65 + i * step, 38, 65 + i * step, 158, C.blue, 1.5, 'stroke-dasharray="4 3"'));
        grid.push(line(65, 38 + i * step, 185, 38 + i * step, C.blue, 1.5, 'stroke-dasharray="4 3"'));
      }
      const info = v.cmp === "area"
        ? text(295, 78, "Yüzey Alanı (2B)", { size: 15, color: C.red }) +
          text(295, 104, "Dış yüzleri kaplayan kare sayısı:", { size: 11, color: C.ink }) +
          text(295, 128, "6 × (4×4) = 96 br²", { size: 16, color: C.red })
        : text(295, 78, "Hacim (3B Boşluk)", { size: 15, color: C.blue }) +
          text(295, 104, big ? "2×2×2'lik büyük küplerle:" : "1×1×1'lik birim küplerle:", { size: 11, color: C.ink }) +
          text(295, 128, `${count} adet küp sığar`, { size: 16, color: C.green });
      return svg(box + grid.join("") + info, "Birim küp ve hacim yorumu") +
        badges([[`Kutu: 4×4×4`, C.blue], [v.cmp === "area" ? "Yüzey: 96 br²" : `Sayı: ${count} küp`, v.cmp === "area" ? C.red : C.green]]) +
        cap(v.cmp === "area"
          ? `<b>Alan</b> kutunun dış kabuğunu kaplayan kare sayısıdır (br²); <b>hacim</b> ise içine sığan birim küp sayısıdır (br³).`
          : `Kutunun büyüklüğü aynı kalsa bile seçilen birim küpün ayrıtı 2 katına çıkınca (hacmi 8 kat), içine sığan küp sayısı 64'ten <b>8'e</b> düşer.`);
    }
  });

  add("im-m7-scale3d", {
    instruction: "Ayrıtları, bilinmeyen ayrıt modunu veya doluluk oranını seç; prizma hacminin nasıl değiştiğini incele.",
    controls: [range("a", "Uzunluk a", 2, 6, 4), range("b", "Genişlik b", 2, 5, 3), range("c", "Yükseklik c", 2, 5, 2), choice("fill", "Doluluk oranı", "4", [["2", "2/4 (Yarısı)"], ["3", "3/4 dolu"], ["4", "4/4 (Tam dolu)"]])],
    demo: [{ a: 4, b: 3, c: 2, fill: "4" }, { a: 4, b: 3, c: 4, fill: "4" }, { a: 4, b: 3, c: 4, fill: "3" }, { a: 6, b: 4, c: 3, fill: "2" }],
    render(v) {
      const base = v.a * v.b, vol = base * v.c, ratio = Number(v.fill) / 4, waterVol = vol * ratio;
      const w = v.a * 28, h = v.c * 22, dx = v.b * 10, dy = v.b * 6;
      const x0 = 145, y0 = 155, wh = h * ratio;
      const prism = `<polygon points="${x0},${y0 - wh} ${x0 + w},${y0 - wh} ${x0 + w + dx},${y0 - wh - dy} ${x0 + dx},${y0 - wh - dy}" fill="${C.sky}" stroke="${C.blue}" stroke-width="1.5"/>` +
        `<rect x="${x0}" y="${y0 - wh}" width="${w}" height="${wh}" fill="${C.blue}" fill-opacity="0.35"/>` +
        `<rect x="${x0}" y="${y0 - h}" width="${w}" height="${h}" fill="none" stroke="${C.ink}" stroke-width="2.5"/>` +
        `<polygon points="${x0},${y0 - h} ${x0 + dx},${y0 - h - dy} ${x0 + w + dx},${y0 - h - dy} ${x0 + w},${y0 - h}" fill="none" stroke="${C.ink}" stroke-width="2"/>` +
        `<polygon points="${x0 + w},${y0 - h} ${x0 + w + dx},${y0 - h - dy} ${x0 + w + dx},${y0 - dy} ${x0 + w},${y0}" fill="none" stroke="${C.ink}" stroke-width="2"/>`;
      return svg(prism +
        text(x0 + w / 2, y0 + 18, `a = ${v.a} br, b = ${v.b} br → Taban alanı = ${base} br²`, { size: 12, color: C.ink }) +
        text(x0 - 28, y0 - h / 2, `c = ${v.c}`, { size: 12, color: C.red }) +
        text(210, 24, `Tam hacim V = ${base} × ${v.c} = ${vol} br³ · Dolu: ${f(waterVol, 1)} br³`, { size: 13, color: C.blue }), "Taban alanı × yükseklik ve doluluk") +
        badges([[`Taban: ${v.a}×${v.b} = ${base} br²`, C.blue], [`Yükseklik: ${v.c} br`, C.red], [`Tam hacim: ${vol} br³`, C.green], [`Dolu (${v.fill}/4): ${f(waterVol, 1)} br³`, C.gold]]) +
        cap(`Hacim = Taban Alanı × Yükseklik = <b>${base} × ${v.c} = ${vol} br³</b>. Hacim ve taban alanı biliniyorsa eksik yükseklik <b>c = ${vol} ÷ ${base} = ${v.c}</b> bulunur.`);
    }
  });

  add("im-m7-stairs", {
    instruction: "Merdiven modunu, sayıyı ve basamak yönünü seç; küp birimlerde ×1000 / ÷1000, litrede ×10 / ÷10 geçişini izle.",
    controls: [choice("sys", "Birim ailesi", "cube", [["cube", "m³ ↔ dm³ ↔ cm³ (×1000)"], ["litre", "L ↔ dL ↔ cL ↔ mL (×10)"]]), range("val", "Başlangıç değeri", 1, 9, 3), range("step", "Basamak (aşağı + / yukarı −)", -1, 2, 1)],
    demo: [{ sys: "cube", val: 3, step: 1 }, { sys: "cube", val: 5, step: -1 }, { sys: "litre", val: 2, step: 2 }, { sys: "litre", val: 4, step: 1 }],
    render(v) {
      const units = v.sys === "cube" ? ["m³", "dm³ (L)", "cm³ (mL)"] : ["L (dm³)", "dL", "cL", "mL (cm³)"];
      const factor = v.sys === "cube" ? 1000 : 10;
      const startIdx = 1, endIdx = Math.max(0, Math.min(units.length - 1, startIdx + v.step));
      const diff = endIdx - startIdx;
      const res = diff >= 0 ? v.val * Math.pow(factor, diff) : v.val / Math.pow(factor, -diff);
      const stairs = units.map((u, i) => {
        const x = 48 + i * 90, y = 40 + i * 36;
        const active = i === startIdx || i === endIdx;
        return `<rect x="${x}" y="${y}" width="82" height="32" rx="6" fill="${i === endIdx ? "#fff3d1" : i === startIdx ? C.sky : "#fff"}" stroke="${active ? C.blue : "#ccc"}" stroke-width="${active ? 2.5 : 1.5}"/>` +
          text(x + 41, y + 21, u, { size: 12, color: C.ink });
      }).join("");
      const opText = diff === 0 ? "Aynı birim" : diff > 0 ? `${diff} basamak aşağı → ×${Math.pow(factor, diff)}` : `${-diff} basamak yukarı → ÷${Math.pow(factor, -diff)}`;
      return svg(stairs + text(210, 192, `${v.val} ${units[startIdx]} → ${opText} = ${f(res, 4)} ${units[endIdx]}`, { size: 13, color: C.blue }), "Hacim ve sıvı ölçme merdiveni") +
        badges([[`1 dm³ = 1 L`, C.gold], [`1 cm³ = 1 mL`, C.green], [opText, C.red], [`= ${f(res, 4)} ${units[endIdx]}`, C.blue]]) +
        cap(v.sys === "cube"
          ? `Hacim birimlerinde 3 boyut olduğu için her basamakta 10 × 10 × 10 = <b>1000</b> ile çarpılır veya bölünür. Köprü: <b>1 dm³ = 1 L</b>.`
          : `Litre basamakları (L–dL–cL–mL) onar onar büyür ve küçülür: her basamak <b>×10</b> veya <b>÷10</b> demektir.`);
    }
  });

  add("im-m7-packbox", {
    instruction: "Koli boyutlarını ve küçük kutu ayrıtını seç; her boyuta kaç kutu sığdığını ayrı ayrı bölerek hesapla.",
    controls: [range("W", "Koli boyu (cm)", 12, 24, 20, 2), range("D", "Koli eni (cm)", 10, 20, 15, 5), range("H", "Koli yüksekliği (cm)", 8, 16, 12, 2), choice("k", "Küçük küp ayrıtı", "4", [["3", "3 cm"], ["4", "4 cm"], ["5", "5 cm"]])],
    demo: [{ W: 20, D: 15, H: 12, k: "4" }, { W: 20, D: 15, H: 12, k: "5" }, { W: 18, D: 15, H: 12, k: "3" }],
    render(v) {
      const k = Number(v.k);
      const nx = Math.floor(v.W / k), ny = Math.floor(v.D / k), nz = Math.floor(v.H / k);
      const fitCount = nx * ny * nz;
      const boxVol = v.W * v.D * v.H, cubeVol = k * k * k, naive = Math.floor(boxVol / cubeVol);
      const u = 18, ox = 60, oy = 42;
      let grid = `<rect x="${ox}" y="${oy}" width="${v.W * 6}" height="${v.H * 6}" fill="#f7f3eb" stroke="${C.ink}" stroke-width="2.5"/>`;
      for (let r = 0; r < nz; r++) {
        for (let c = 0; c < nx; c++) {
          grid += `<rect x="${ox + c * k * 6}" y="${oy + (v.H - (r + 1) * k) * 6}" width="${k * 6}" height="${k * 6}" fill="${C.sky}" stroke="${C.blue}" stroke-width="1.5" ${anim("pl-pop", (r * nx + c) * 0.03)}/>`;
        }
      }
      return svg(grid +
        text(295, 58, `Boy: ⌊${v.W}÷${k}⌋ = ${nx} sıra`, { size: 12, color: C.blue }) +
        text(295, 82, `En: ⌊${v.D}÷${k}⌋ = ${ny} sıra`, { size: 12, color: C.blue }) +
        text(295, 106, `Yükseklik: ⌊${v.H}÷${k}⌋ = ${nz} kat`, { size: 12, color: C.blue }) +
        text(295, 138, `Sığan: ${nx}×${ny}×${nz} = ${fitCount} kutu`, { size: 14, color: C.green }) +
        (naive !== fitCount ? text(295, 164, `(Hacim bölünseydi ${naive} sanılırdı — boşluk kalır!)`, { size: 10, color: C.red }) : ""),
        "Kutuya yerleştirme problemi") +
        badges([[`Her sıraya: ${nx}×${ny}`, C.blue], [`Kat: ${nz}`, C.gold], [`Tam sığan: ${fitCount} kutu`, C.green]]) +
        cap(`Kutular parçalanamayacağı için yalnız toplam hacmi bölmek yetmez; her ayrıt ayrı ayrı bölünür: <b>${nx} × ${ny} × ${nz} = ${fitCount}</b> kutu.`);
    }
  });

  add("im-m7-plants", {
    instruction: "Veri türünü ve değişkenlik düzeyini seç; nokta bulutunun ve dağılımın nasıl değiştiğini gözlemle.",
    controls: [choice("type", "Veri türü", "cont", [["disc", "Kesikli (Kardeş sayısı — sayılır)"], ["cont", "Sürekli (Bitki boyu cm — ölçülür)"], ["code", "Kod (Forma numarası — nicel değil)"]]), choice("spread", "Değişebilirlik", "wide", [["low", "Düşük yayılım"], ["wide", "Yüksek yayılım"]])],
    demo: [{ type: "disc", spread: "low" }, { type: "cont", spread: "wide" }, { type: "code", spread: "wide" }],
    render(v) {
      if (v.type === "code") {
        const shirts = ["7", "10", "23", "99"].map((num, i) => {
          const x = 60 + i * 88;
          return `<rect x="${x}" y="52" width="64" height="74" rx="10" fill="${PALETTE[i]}" fill-opacity="0.22" stroke="${PALETTE[i]}" stroke-width="2.5" ${anim("pl-pop", i * 0.08)}/>` +
            text(x + 32, 95, `#${num}`, { size: 18, color: PALETTE[i] });
        }).join("");
        return svg(shirts + text(210, 165, "Forma veya otobüs numaraları rakamla yazılsa da etiket (kategorik) veridir; ortalaması alınmaz!", { size: 11, color: C.red }), "Sayı görünmesi nicel olduğu anlamına gelmez") +
          badges([[`Tür: Kategorik (Etiket)`, C.red], [`Toplanmaz / Ortalama alınmaz`, C.gold]]) +
          cap(`Her gördüğün sayı nicel veri değildir. Forma numarası, telefon kodu veya plaka <b>etiket</b> görevi görür.`);
      }
      const pts = v.type === "disc"
        ? (v.spread === "low" ? [1, 1, 2, 2, 2, 2, 3, 3] : [0, 1, 1, 2, 2, 3, 4, 5])
        : (v.spread === "low" ? [11.8, 12.1, 12.2, 12.4, 12.5, 12.7, 12.9, 13.1] : [8.4, 9.7, 11.2, 12.5, 13.8, 15.1, 16.4, 17.6]);
      const min = v.type === "disc" ? 0 : 8, max = v.type === "disc" ? 5 : 18;
      const counts = {};
      const dotsSvg = pts.map((val, i) => {
        counts[val] = (counts[val] || 0) + 1;
        const x = 55 + ((val - min) / (max - min)) * 310;
        const y = 135 - (counts[val] - 1) * 20;
        return dot(x, y, v.type === "disc" ? C.blue : C.green, 8, i * 0.05) +
          text(x, y - 13, String(val), { size: 10, color: C.ink });
      }).join("");
      return svg(line(45, 145, 375, 145, C.ink, 2.5) + dotsSvg +
        text(210, 32, v.type === "disc" ? "Kesikli veri: Yalnız tam değerler (0, 1, 2, 3…)" : "Sürekli veri: Ölçümle ara değerler de (12,4 cm gibi) alır", { size: 12, color: C.ink }), "Veri türü ve dağılım") +
        badges([[v.type === "disc" ? "Kesikli (Sayma)" : "Sürekli (Ölçme)", C.blue], [v.spread === "low" ? "Dar dağılım" : "Geniş dağılım", C.green]]) +
        cap(v.type === "disc"
          ? `<b>Kesikli nicel veri</b> sayılarak elde edilir; iki tam sayı arasında buçuklu değer almaz.`
          : `<b>Sürekli nicel veri</b> ölçülerek elde edilir; iki tam sayı arasındaki ondalık değerleri alabilir.`);
    }
  });

  add("im-m7-sample", {
    instruction: "Örneklem seçme yöntemini ve örneklem büyüklüğünü değiştir; evreni doğru temsil edip etmediğini incele.",
    controls: [choice("method", "Örneklem yöntemi", "fair", [["fair", "Her sınıftan dengeli (Yansız)"], ["biased", "Yalnız spor kulübünden (Yanlı)"]]), range("n", "Örneklem büyüklüğü", 10, 60, 30, 10)],
    demo: [{ method: "biased", n: 10 }, { method: "fair", n: 30 }, { method: "fair", n: 50 }],
    render(v) {
      const classes = ["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf"];
      const boxes = classes.map((c, i) => {
        const x = 30 + i * 92, picked = v.method === "fair" ? Math.round(v.n / 4) : (i === 2 ? v.n : 0);
        return `<rect x="${x}" y="38" width="82" height="72" rx="10" fill="#eef6ff" stroke="${C.blue}" stroke-width="2"/>` +
          text(x + 41, 58, c, { size: 12, color: C.blue }) +
          `<circle cx="${x + 41}" cy="86" r="16" fill="${picked > 0 ? C.green : "#ddd"}" ${anim("pl-pop", i * 0.07)}/>` +
          text(x + 41, 91, `${picked}`, { size: 12, color: "#fff" });
      }).join("");
      const msg = v.method === "fair"
        ? `✓ Evrenin her grubundan dengeli seçildi (${v.n} öğrenci) — Temsil gücü yüksek`
        : `✗ Yalnız tek gruptan seçildi — Yanlı örneklem, tüm okulu temsil etmez!`;
      return svg(boxes + text(210, 148, msg, { size: 12, color: v.method === "fair" ? C.green : C.red }), "Evren ve örneklem seçimi") +
        badges([[`Evren: Tüm okul`, C.blue], [`Örneklem: ${v.n} kişi`, C.gold], [v.method === "fair" ? "Yansız / Dengeli" : "Yanlı seçim", v.method === "fair" ? C.green : C.red]]) +
        cap(`İstatistiksel araştırma sürecinde (Soru → Veri Toplama → Analiz → Yorum) <b>örneklem</b> evreni tarafsız temsil etmeli ve sonuçlar yalnız bu kapsam için genellenmelidir.`);
    }
  });

  add("im-m7-survey", {
    instruction: "Anket tasarım ayarlarını değiştir; tarafsız soru, veri gizliliği ve eksik veri kurallarını kontrol et.",
    controls: [choice("q", "Soru biçimi", "neutral", [["biased", "Yönlendirici soru"], ["neutral", "Tarafsız soru"]]), choice("priv", "Kişisel veri", "safe", [["unsafe", "TC kimlik ve adres iste"], ["safe", "Yalnız araştırma sorusu"]]), choice("miss", "Boş cevaplar", "report", [["fake", "Kafadan doldur"], ["report", "Eksik veri olarak bildir"]])],
    demo: [
      { q: "biased", priv: "unsafe", miss: "fake" },
      { q: "neutral", priv: "safe", miss: "report" }
    ],
    render(v) {
      const items = [
        [v.q === "neutral", v.q === "neutral" ? "Soru: 'Okul kütüphanesini haftada kaç gün kullanırsınız?'" : "Soru: 'Harika kütüphanemizi siz de çok seviyorsunuz değil mi?'"],
        [v.priv === "safe", v.priv === "safe" ? "Gizlilik: İsim/TC istenmedi, gönüllü katılım sağlandı." : "Gizlilik ihlali: Gereksiz TC kimlik ve ev adresi soruldu!"],
        [v.miss === "report", v.miss === "report" ? "Eksik veri: Cevapsız 3 form raporda açıkça belirtildi." : "Hata: Boş bırakılan sorulara rastgele sayı yazıldı!"]
      ];
      const score = items.filter(([ok]) => ok).length;
      const cards = items.map(([ok, txt], i) => {
        const y = 22 + i * 46;
        return `<rect x="28" y="${y}" width="364" height="38" rx="8" fill="${ok ? C.mint : "#fde6e2"}" stroke="${ok ? C.green : C.red}" stroke-width="2" ${anim("pl-pop", i * 0.08)}/>` +
          text(210, y + 24, `${ok ? "✓" : "✗"} ${txt}`, { size: 11, color: ok ? C.green : C.red });
      }).join("");
      return svg(cards + text(210, 180, `Etik ve Güvenilirlik Puanı: ${score} / 3`, { size: 14, color: score === 3 ? C.green : C.red }), "Veri toplama etiği ve kalitesi") +
        badges([[`Soru: ${v.q === "neutral" ? "Tarafsız" : "Yanlı"}`, v.q === "neutral" ? C.green : C.red], [`Gizlilik: ${v.priv === "safe" ? "Korundu" : "İhlal"}`, v.priv === "safe" ? C.green : C.red], [`Eksik veri: ${v.miss === "report" ? "Şeffaf" : "Uydurma"}`, v.miss === "report" ? C.green : C.red]]) +
        cap(`Güvenilir veri toplamak için sorular <b>tarafsız</b> olmalı, <b>yalnız gereken</b> veriler gönüllülükle toplanmalı ve <b>eksik veriler</b> uydurulmadan raporlanmalıdır.`);
    }
  });

  add("im-m7-charts", {
    instruction: "Aynı veri setini Sütun, Çizgi veya Nokta grafiğine çevir; hangi grafiğin neyi öne çıkardığını karşılaştır.",
    controls: [choice("type", "Grafik türü", "bar", [["bar", "Sütun grafiği (Kategorileri karşılaştır)"], ["line", "Çizgi grafiği (Zamanla değişim)"], ["dot", "Nokta grafiği (Dağılım ve sıklık)"]]), range("hi", "Günü vurgula", 0, 4, 2)],
    demo: [{ type: "bar", hi: 2 }, { type: "line", hi: 3 }, { type: "dot", hi: 2 }],
    render(v) {
      const days = ["Pzt", "Sal", "Çar", "Per", "Cum"], vals = [4, 6, 5, 8, 7], tot = 30;
      const axes = line(55, 28, 55, 152, C.ink, 2) + line(55, 152, 375, 152, C.ink, 2);
      let body = "";
      if (v.type === "bar") {
        body = vals.map((val, i) => {
          const x = 75 + i * 58, h = val * 13, act = i === v.hi;
          return `<rect x="${x}" y="${152 - h}" width="36" height="${h}" rx="5" fill="${act ? C.gold : C.blue}" ${anim("pl-pop", i * 0.06)}/>` +
            text(x + 18, 144 - h, val, { size: 12, color: act ? C.gold : C.blue }) +
            text(x + 18, 170, days[i], { size: 11, color: C.ink });
        }).join("");
      } else if (v.type === "line") {
        const pts = vals.map((val, i) => [93 + i * 58, 152 - val * 13]);
        body = `<polyline points="${pts.map(([x, y]) => `${x},${y}`).join(" ")}" fill="none" stroke="${C.red}" stroke-width="3.5" ${draw()}/>` +
          pts.map(([x, y], i) => dot(x, y, i === v.hi ? C.gold : C.red, i === v.hi ? 8 : 6, i * 0.06) +
            text(x, y - 12, vals[i], { size: 12, color: C.ink }) +
            text(x, 170, days[i], { size: 11, color: C.ink })).join("");
      } else {
        body = vals.map((val, i) => {
          const x = 93 + i * 58;
          let dots = "";
          for (let k = 0; k < val; k++) dots += dot(x, 142 - k * 14, i === v.hi ? C.gold : C.green, 5.5, k * 0.03);
          return dots + text(x, 170, days[i], { size: 11, color: C.ink });
        }).join("");
      }
      return svg(axes + body, "Grafik türleri ve veri analizi") +
        badges([[`${days[v.hi]}: ${vals[v.hi]} br`, C.gold], [`Toplam: ${tot}`, C.blue], [`Ortalama: ${tot / 5}`, C.green]]) +
        cap(v.type === "bar"
          ? `<b>Sütun grafiği</b> gruplar arasındaki büyüklük farkını bir bakışta karşılaştırır.`
          : v.type === "line"
          ? `<b>Çizgi grafiği</b> verinin günlere göre artış ve azalış eğilimini (trendini) gösterir.`
          : `<b>Nokta grafiği</b> her bir birimi tek tek göstererek yığılmaları görünür kılar.`);
    }
  });

  add("im-m7-seesaw", {
    instruction: "5. veriyi (uç değeri) sağa-sola kaydır; Aritmetik Ortalama, Ortanca (Medyan) ve Ortalama Mutlak Sapmanın (OMS) nasıl tepki verdiğini izle.",
    controls: [range("x5", "5. veri değeri (diğerleri: 4, 5, 6, 6)", 4, 18, 9), choice("band", "Referans bandı", "1", [["0", "Gizle"], ["1", "Ortalama ± OMS bandını göster"]])],
    demo: [{ x5: 6, band: "1" }, { x5: 9, band: "1" }, { x5: 15, band: "1" }, { x5: 18, band: "1" }],
    render(v) {
      const arr = [4, 5, 6, 6, v.x5].sort((a, b) => a - b);
      const mean = arr.reduce((s, n) => s + n, 0) / arr.length;
      const med = arr[2];
      const mad = arr.reduce((s, n) => s + Math.abs(n - mean), 0) / arr.length;
      const rangeVal = arr[4] - arr[0];
      const xOf = (val) => 40 + ((val - 2) / 18) * 340;
      const mx = xOf(mean), medX = xOf(med);
      const bandSvg = v.band === "1"
        ? `<rect x="${xOf(mean - mad)}" y="78" width="${xOf(mean + mad) - xOf(mean - mad)}" height="42" rx="6" fill="${C.mint}" stroke="${C.green}" stroke-width="1.5" stroke-dasharray="4 3"/>` +
          text(mx, 68, `Ortalama ± OMS (${f(mean - mad, 1)} – ${f(mean + mad, 1)})`, { size: 11, color: C.green })
        : "";
      const ptsSvg = arr.map((val, i) => {
        const x = xOf(val);
        return line(x, 110, mx, 110, C.gold, 1.5, 'stroke-dasharray="3 2"') +
          dot(x, 102 - (i === 3 && arr[3] === arr[2] ? 14 : 0), i === 4 ? C.red : C.blue, 7.5, i * 0.05) +
          text(x, 46 + (i % 2) * 14, val, { size: 11, color: i === 4 ? C.red : C.blue });
      }).join("");
      const fulcrum = `<polygon points="${mx},120 ${mx - 14},148 ${mx + 14},148" fill="${C.red}"/>` +
        text(mx, 164, `Ortalama = ${f(mean, 1)}`, { size: 12, color: C.red }) +
        line(medX, 85, medX, 132, C.blue, 2.5, 'stroke-dasharray="4 3"') +
        text(medX, 182, `Ortanca = ${med} · Tepe değer = 6`, { size: 11, color: C.blue });
      return svg(bandSvg + line(35, 120, 385, 120, C.ink, 3) + ptsSvg + fulcrum, "Terazi dengesi: Ortalama, Ortanca ve OMS") +
        badges([[`Ortalama: ${f(mean, 1)}`, C.red], [`Ortanca: ${med}`, C.blue], [`OMS: ${f(mad, 2)}`, C.green], [`Açıklık: ${rangeVal}`, C.gold]]) +
        cap(`Uç değer (${v.x5}) büyüdükçe <b>ortalama (${f(mean, 1)})</b> ve <b>OMS (${f(mad, 2)})</b> sağa çekilir; fakat <b>ortanca (${med})</b> ve <b>tepe değer (6)</b> uç değerden etkilenmez.`);
    }
  });

  add("im-m7-axis", {
    instruction: "Dikey eksen başlangıcını değiştir; kesilmiş eksenin (0'dan başlamayan grafik) farkı nasıl abarttığını gör.",
    controls: [choice("mode", "Eksen gösterimi", "cut", [["cut", "Kesilmiş eksen (90'dan başlar — yanıltıcı)"], ["zero", "Gerçek eksen (0'dan başlar — doğru)"]])],
    demo: [{ mode: "cut" }, { mode: "zero" }],
    render(v) {
      const a = 92, b = 96, base = v.mode === "cut" ? 90 : 0, max = 100;
      const ha = ((a - base) / (max - base)) * 115, hb = ((b - base) / (max - base)) * 115;
      const ratioVis = Math.round((hb / ha) * 10) / 10;
      const chart = line(75, 25, 75, 155, C.ink, 2.5) + line(75, 155, 345, 155, C.ink, 2.5) +
        text(62, 155, base, { size: 12, anchor: "end", color: v.mode === "cut" ? C.red : C.green }) +
        text(62, 38, "100", { size: 12, anchor: "end" }) +
        `<rect x="125" y="${155 - ha}" width="58" height="${ha}" rx="6" fill="${C.blue}" ${anim("pl-pop")}/>` +
        text(154, 146 - ha, `A: ${a}`, { size: 13, color: C.blue }) +
        `<rect x="235" y="${155 - hb}" width="58" height="${hb}" rx="6" fill="${v.mode === "cut" ? C.red : C.green}" ${anim("pl-pop", 0.08)}/>` +
        text(264, 146 - hb, `B: ${b}`, { size: 13, color: v.mode === "cut" ? C.red : C.green }) +
        text(210, 182, v.mode === "cut" ? `Görsel yanıltma: B sütunu A'nın ${ratioVis} katı gibi duruyor!` : "Doğru ölçek: 92 ile 96 arasındaki gerçek oran (%4,3 fark) görünüyor.", { size: 11, color: v.mode === "cut" ? C.red : C.green });
      return svg(chart, "Medyada grafik inceleme: Kesilmiş eksen") +
        badges([[`Gerçek fark: 96 − 92 = 4`, C.blue], [`Sütun boyu oranı: ${ratioVis} kat`, v.mode === "cut" ? C.red : C.green]]) +
        cap(v.mode === "cut"
          ? `Dikey eksen 0 yerine 90'dan başlatılınca 4 puanlık küçük fark <b>3 kat</b> büyümüş gibi görünür. Grafikleri okurken önce eksen başlangıcına bak!`
          : `Eksen 0'dan başladığında sütun boyları gerçek büyüklüklerle doğru orantılı olur.`);
    }
  });

  add("im-m7-sym", {
    instruction: "Çokgeni veya yansıma modunu seç; ayna doğrusuna dik eşit uzaklığı ve düzgün çokgenlerin simetri doğrusu sayısını incele.",
    controls: [choice("mode", "İnceleme", "mirror", [["mirror", "Doğruya göre yansıma (Eşlik ve dik uzaklık)"], ["poly", "Düzgün çokgende simetri doğruları"]]), range("n", "Kenar / Konum", 3, 6, 4)],
    demo: [{ mode: "mirror", n: 4 }, { mode: "mirror", n: 6 }, { mode: "poly", n: 3 }, { mode: "poly", n: 4 }, { mode: "poly", n: 6 }],
    render(v) {
      if (v.mode === "poly") {
        const n = v.n, cx = 210, cy = 102, r = 68;
        const pts = Array.from({ length: n }, (_, k) => pt(cx, cy, 90 - k * 360 / n, r));
        let axes = "";
        for (let k = 0; k < n; k++) {
          const a = pt(cx, cy, 90 - k * 180 / n, r + 16);
          const b = pt(cx, cy, 90 - k * 180 / n + 180, r + 16);
          axes += line(a[0], a[1], b[0], b[1], C.red, 2, `stroke-dasharray="5 4" ${draw(k * 0.06)}`);
        }
        const poly = `<polygon points="${pts.map((p) => `${f(p[0])},${f(p[1])}`).join(" ")}" fill="${C.sky}" fill-opacity="0.35" stroke="${C.blue}" stroke-width="3.5"/>`;
        return svg(poly + axes + text(210, 192, `Düzgün ${n}gen → ${n} tane simetri doğrusu`, { size: 13, color: C.ink }), "Simetri doğrusu sayısı") +
          badges([[`Kenar sayısı: ${n}`, C.blue], [`Simetri doğrusu: ${n}`, C.red]]) +
          cap(`Düzgün çokgenlerin kenar sayısı kadar simetri doğrusu vardır: Düzgün <b>${n}gen</b> tam <b>${n}</b> simetri doğrusuna sahiptir.`);
      }
      const d = v.n * 14, mx = 210;
      const tri1 = [[mx - d, 48], [mx - d - 42, 128], [mx - 18, 146]];
      const tri2 = tri1.map(([x, y]) => [2 * mx - x, y]);
      const guides = tri1.map(([x1, y], i) => {
        const x2 = 2 * mx - x1;
        return line(x1, y, x2, y, C.gold, 1.8, 'stroke-dasharray="4 3"') +
          square(mx, y, -180, -90, 9, C.green) +
          dot(x1, y, C.blue, 5.5) + dot(x2, y, C.red, 5.5, 0.08) +
          text(x1 - 14, y + 4, LETTERS[i], { size: 12, color: C.blue }) +
          text(x2 + 16, y + 4, LETTERS[i] + "′", { size: 12, color: C.red });
      }).join("");
      const onAxis = dot(mx, 168, C.green, 6) + text(mx + 56, 172, "K = K′ (Ayna üstünde)", { size: 11, color: C.green });
      return svg(
        line(mx, 16, mx, 188, C.green, 3.5) +
        `<polygon points="${tri1.map((p) => p.join(",")).join(" ")}" fill="${C.blue}" fill-opacity="0.22" stroke="${C.blue}" stroke-width="3"/>` +
        `<polygon points="${tri2.map((p) => p.join(",")).join(" ")}" fill="${C.red}" fill-opacity="0.22" stroke="${C.red}" stroke-width="3" ${anim("pl-pop", 0.08)}/>` +
        guides + onAxis,
        "Doğruya göre yansıma"
      ) +
        badges([[`Uzaklıklar eşit (|AA′| ⊥ d)`, C.gold], [`Şekil ve görüntü EŞ`, C.blue], [`Yönelim ters döner`, C.red]]) +
        cap(`Yansımada her nokta ile görüntüsü simetri doğrusuna <b>dik</b> ve <b>eşit uzaklıktadır</b>. Kenar uzunlukları ve açı ölçüleri korunur; doğru üzerindeki nokta (K) yerinde kalır.`);
    }
  });

  add("im-m7-bisect", {
    instruction: "İnşa türünü ve adımı seç; pergel ve çizgiliksiz cetvelle orta dikme ve açıortayın nasıl kurulduğunu adım adım izle.",
    controls: [choice("kind", "Geometrik inşa", "perp", [["perp", "[AB] doğru parçasının orta dikmesi"], ["ang", "Açının açıortayı"]]), range("step", "İnşa adımı", 1, 3, 3)],
    demo: [{ kind: "perp", step: 1 }, { kind: "perp", step: 2 }, { kind: "perp", step: 3 }, { kind: "ang", step: 1 }, { kind: "ang", step: 2 }, { kind: "ang", step: 3 }],
    render(v) {
      if (v.kind === "perp") {
        const ax = 120, bx = 300, y = 105, r = 115, mx = 210, dy = Math.sqrt(r * r - 90 * 90);
        const s1 = line(ax, y, bx, y, C.blue, 4) + dot(ax, y, C.blue, 6) + dot(bx, y, C.blue, 6) +
          text(ax - 14, y + 5, "A", { size: 14, color: C.blue }) + text(bx + 14, y + 5, "B", { size: 14, color: C.blue });
        const s2 = v.step >= 2
          ? `<path d="${arcPath(ax, y, r, -55, 55)}" fill="none" stroke="${C.gold}" stroke-width="2.5" stroke-dasharray="6 4" ${draw()}/>` +
            `<path d="${arcPath(bx, y, r, 125, 235)}" fill="none" stroke="${C.gold}" stroke-width="2.5" stroke-dasharray="6 4" ${draw(0.08)}/>` +
            dot(mx, y - dy, C.red, 6, 0.12) + dot(mx, y + dy, C.red, 6, 0.12) +
            text(mx + 16, y - dy + 4, "P", { size: 12, color: C.red }) + text(mx + 16, y + dy + 4, "Q", { size: 12, color: C.red })
          : "";
        const s3 = v.step >= 3
          ? line(mx, 18, mx, 192, C.red, 3.5, draw(0.15)) + square(mx, y, 0, -90, 12, C.green) +
            dot(mx, y, C.green, 6) + text(mx - 14, y + 18, "M", { size: 12, color: C.green }) +
            line(ax, y - dy, mx, y - dy, C.green, 0) +
            line(ax, y, mx, y - dy, C.green, 1.8, 'stroke-dasharray="4 3"') +
            line(bx, y, mx, y - dy, C.green, 1.8, 'stroke-dasharray="4 3"') +
            text(160, 62, "|PA| = |PB|", { size: 11, color: C.green })
          : "";
        return svg(s1 + s2 + s3, "Orta dikme inşası") +
          badges([[`Adım ${v.step}/3`, C.blue], [`|AM| = |MB|`, C.green], [`PQ ⊥ [AB]`, C.red]]) +
          cap(`1) A ve B merkezli, yarısından büyük eşit yarıçaplı iki yay çizilir. 2) Yayların kesişim noktaları P ve Q bulunur. 3) PQ doğrusu hem [AB]'yi <b>iki eş parçaya böler</b> hem de <b>dik</b> keser.`);
      }
      const ox = 95, oy = 152, a1 = 10, a2 = 64, mid = (a1 + a2) / 2;
      const p1 = pt(ox, oy, a1, 210), p2 = pt(ox, oy, a2, 210);
      const k1 = pt(ox, oy, a1, 105), k2 = pt(ox, oy, a2, 105), pm = pt(ox, oy, mid, 165), pb = pt(ox, oy, mid, 215);
      const base = line(ox, oy, p1[0], p1[1], C.blue, 4) + line(ox, oy, p2[0], p2[1], C.blue, 4) + dot(ox, oy, C.blue, 6) + text(ox - 14, oy + 5, "O", { size: 14, color: C.blue });
      const st1 = v.step >= 1
        ? `<path d="${arcPath(ox, oy, 105, a1 - 6, a2 + 6)}" fill="none" stroke="${C.gold}" stroke-width="2.5" stroke-dasharray="6 4" ${draw()}/>` +
          dot(k1[0], k1[1], C.gold, 6) + dot(k2[0], k2[1], C.gold, 6) +
          text(k1[0] + 10, k1[1] + 14, "K", { size: 12, color: C.gold }) + text(k2[0] - 14, k2[1] - 6, "L", { size: 12, color: C.gold })
        : "";
      const st2 = v.step >= 2
        ? `<circle cx="${f(k1[0])}" cy="${f(k1[1])}" r="74" fill="none" stroke="${C.green}" stroke-width="1.8" stroke-dasharray="4 4"/>` +
          `<circle cx="${f(k2[0])}" cy="${f(k2[1])}" r="74" fill="none" stroke="${C.green}" stroke-width="1.8" stroke-dasharray="4 4"/>` +
          dot(pm[0], pm[1], C.red, 7, 0.1) + text(pm[0] + 14, pm[1] + 4, "P", { size: 13, color: C.red })
        : "";
      const st3 = v.step >= 3
        ? line(ox, oy, pb[0], pb[1], C.red, 3.5, draw(0.14)) +
          `<path d="${arcPath(ox, oy, 52, a1, mid)}" fill="none" stroke="${C.red}" stroke-width="2.5"/>` +
          `<path d="${arcPath(ox, oy, 58, mid, a2)}" fill="none" stroke="${C.red}" stroke-width="2.5"/>` +
          text(ox + 72, oy - 14, "27°", { size: 11, color: C.red }) + text(ox + 52, oy - 48, "27°", { size: 11, color: C.red })
        : "";
      return svg(base + st1 + st2 + st3, "Açıortay inşası") +
        badges([[`Adım ${v.step}/3`, C.blue], [`|OK| = |OL|`, C.gold], [`Açılar eş: 27° = 27°`, C.red]]) +
        cap(`1) O merkezli yay kolları K ve L'de keser. 2) K ve L merkezli eş yaylar P'de kesişir. 3) [OP ışını açıyı <b>iki eş açıya</b> bölen <b>açıortaydır</b> ve kollara eşit uzaklıktadır.`);
    }
  });

  for (const [kind, spec] of Object.entries(models)) M.register(kind, spec);

  /* ---------- Adımları konulara bağla ---------- */
  // up: mevcut adımı (başlığına göre) modele çevirir. extra: yeni örnek adımı belirtilen adımın ardına ekler.
  const up = (sandbox, preset, hint) => ({ sandbox, preset, hint });
  const extra = (after, h, p, sandbox, preset, check, hint) => ({ after, h, p, sandbox, preset, check, hint });
  const plan = {
    nokta: {
      up: { "Başlangıcı işaretle": up("im-points", { n: 1 }, "Nokta sayısını artır; her yeni nokta yeni bir harf alır."), "Bir bitiş ekle": up("im-ruler", { b: 5 }), "Yolu uzat": up("im-grow", { mode: "ray" }),
        "Nokta": up("im-life", { mode: "star" }), "Doğru parçası": up("im-ruler", { b: 7 }), "Işın": up("im-grow", { mode: "ray" }), "Doğru": up("im-grow", { mode: "line" }), "Üçünü yan yana koy": up("im-line", { mode: "segment" }) },
      extra: [extra("Üçünü yan yana koy", "Kaç doğru parçası var?", "Bir doğrunun üzerinde A, B ve C noktaları olsun. Her iki nokta bir doğru parçası yapar: [AB], [AC] ve [BC]. Nokta ekledikçe parça sayısı hızla artar.", "im-count-seg", { n: 3 }, ["4 nokta kaç doğru parçası yapar?", "6 tane: [AB], [AC], [AD], [BC], [BD], [CD]."])]
    },
    aci: {
      up: { "Dar, dik, geniş": up("im-door", { deg: 40 }) },
      extra: [extra("Adını koy", "Saatteki açılar", "Saatin akrebi ile yelkovanı bir açı yapar. Saat 3’te tam dik açı, saat 2’de dar açı, saat 5’te geniş açı görürsün. Saat 6’da kollar zıt yönlere bakar.", "im-clock", { h: 3 }, ["Saat 4’te akrep ile yelkovan arasındaki açı kaç derecedir?", "4 aralık × 30° = 120°. Geniş açıdır."])]
    },
    cember: {
      up: { "Merkezi bul": up("im-compass", { turn: 90 }), "İki yarıçapı birleştir": up("circle"), "İçini boya": up("im-ring", { mode: "disk" }),
        "Herkes eşit uzaklıkta": up("im-friends", { n: 6 }), "Yarıçap ve çap": up("circle"), "Çember mi, daire mi?": up("im-ring", { mode: "ring" }) },
      extra: [extra("Çember mi, daire mi?", "En uzun çizgi hangisi?", "Çemberin üstündeki iki noktayı birleştiren çizgiler çizelim. Merkeze yaklaştıkça çizgi uzar. Merkezden geçen çizgi çaptır ve en uzunudur.", "im-chord", { d: 3 }, ["Yarıçapı 7 cm olan çemberde en uzun çizgi kaç cm?", "Çap: 7 + 7 = 14 cm."])]
    },
    dikme: {
      up: { "Karşıya bak": up("im-shortest", { x: 0 }), "Kısa yolu seç": up("im-shortest", { x: 4 }), "En kısa yol": up("im-shortest", { x: -5 }), "Diklik işareti": up("im-perp-ab", { deg: 60 }), "Düzlem": up("im-plane", { z: 1 }) },
      extra: [
        extra("Kısa yolu seç", "AB doğrusuna dik bir doğru koy", "AB doğrusunun üstüne d doğrusunu yerleştirdik. d döndükçe kesişme noktasında iki açı oluşur. İkisi de 90° olduğu an d, AB’ye dik olur ve dört dik açı görünür.", "im-perp-ab", { deg: 50 }, ["Dik kesişen iki doğru kaç dik açı oluşturur?", "4 dik açı. Hepsi 90°dir."]),
        extra("Diklik işareti", "Gönyeyle kontrol et", "Göz bizi yanıltabilir. Dik olup olmadığını anlamak için gönyenin dik köşesini kesişme noktasına koyarız. Gönye tam oturursa çizgiler diktir.", "im-gonye", { pick: "1" }, ["Gönye oturmuyor ve arada boşluk kalıyorsa ne söylersin?", "Açı 90° değildir; çizgiler dik değildir."])
      ]
    },
    paralel: {
      up: { "Raylara bak": up("im-rails", { tilt: 5 }, "Eğimi 0 yap; iki aralık eşitlenince raylar paralel olur."), "Aralığı karşılaştır": up("im-rails", { tilt: 0 }), "Bir yol daha çiz": up("im-transversal", { deg: 60 }),
        "Hiç kesişmeyenler": up("im-rails", { tilt: -4 }), "Nasıl yazılır?": up("im-symbols", { mode: "par" }), "Noktadan kaç doğru geçer?": up("im-through", { mode: "one", n: 4 }) },
      extra: [extra("Nasıl yazılır?", "Harflerde paralel ve dik", "Etrafımızdaki harflerde de paralel ve dik çizgiler var. H harfinin iki dikey çizgisi paraleldir. L harfinin iki çizgisi dik kesişir.", "im-letters", { ch: "H" }, ["E harfinde kaç paralel çift var?", "Üç yatay çizginin her ikisi bir çift yapar: 3 çift."])]
    },
    olcme: {
      up: { "Derece": up("im-turns", { t: "90" }), "Eş açılar": up("im-arm", { len: 4, deg: 40 }) },
      extra: [extra("Açıölçer", "İki sıra sayıya dikkat", "Açıölçerin üstünde iki sıra sayı vardır. Sabit kol sağdaki 0’daysa dış sıra, soldaki 0’daysa iç sıra okunur. Yanlış sırayı okursan 50° yerine 130° bulursun.", "im-protractor", { deg: 50, side: "right" }, ["Dar bir açıyı ölçerken 140 okudun. Ne yapmalısın?", "Dar açı 90°den küçük olmalı. Öbür sıraya bak: 40°."])]
    },
    durum: {
      up: { "Yan yana": up("im-lines2", { dir: "same", gap: 3 }), "Üst üste getir": up("im-lines2", { dir: "same", gap: 1 }, "Aralığı 0 yap: iki doğru üst üste gelsin."), "Paralel ve çakışık": up("im-lines2", { dir: "same", gap: 2 }), "Üç doğru": up("im-three", { mode: "tri" }) },
      extra: [extra("Üç doğru", "Harflerde doğruların durumu", "N harfine bak: iki dikey çizgi paraleldir, eğik çizgi ikisini de keser. H harfinde ise yatay çizgi iki paraleli dik keser. Harfleri değiştir, doğruların durumunu söyle.", "im-letters", { ch: "N" }, ["Üç farklı doğru en fazla kaç noktada kesişebilir?", "3 noktada: ikişer ikişer kesişirlerse."])]
    },
    cift: {
      extra: [extra("Tümler ve bütünler", "Duvara dayalı merdiven", "Merdiveni duvara dayayınca üç açı oluşur. Duvar yere dik olduğu için merdivenin yerle ve duvarla yaptığı açılar tümlerdir. Merdivenin ayağında iki yandaki açılar ise bütünlerdir.", "im-ladder", { deg: 60 }, ["Merdiven yerle 70° yapıyorsa duvarla kaç derece yapar?", "90° − 70° = 20°."])]
    },
    cokgen: {
      up: { "Üç kenarla başla": up("im-build-poly", { n: 3 }), "Bir kenar daha": up("im-build-poly", { n: 4 }), "Beşe ulaş": up("im-build-poly", { n: 5 }),
        "Kapalı şekil": up("im-closed", { mode: "open" }), "Kenar, köşe, açı": up("im-build-poly", { n: 6 }), "Düzgün çokgen": up("im-regular", { mode: "rect" }), "Köşegen": up("im-polygon", { n: 5 }) },
      extra: [
        extra("Düzgün çokgen", "Eşkenar dörtgen düzgün mü?", "Eşkenar dörtgenin dört kenarı da eşittir. Peki açıları? Karşılıklı açılar eşit ama komşu açılar farklıdır. Bu yüzden düzgün çokgen değildir. Kare ile karşılaştır.", "im-regular", { mode: "rh" }, ["Dikdörtgen neden düzgün çokgen değildir?", "Açıları eşit ama kenarları her zaman eşit değil."]),
        extra("Köşegen", "Köşegenlerle üçgenlere ayır", "Bir köşeden komşu olmayan köşelere köşegenler çizince çokgen üçgenlere bölünür. Beşgende 2 köşegen 3 üçgen, altıgende 3 köşegen 4 üçgen oluşturur.", "im-poly-tri", { n: 5, show: "tri" }, ["Altıgende bir köşeden çizilen köşegenler kaç üçgen oluşturur?", "6 − 2 = 4 üçgen."])
      ]
    },
    ucgen: {
      up: { "180°ye tamamla": up("im-tear", { step: "line" }), "Açılarına göre": up("im-tri-shape", { k: 9, h: 4 }), "İç açılar toplamı": up("im-tear", { step: "tri" }), "Kenarlarına göre": up("im-sticks", { a: 5, b: 5, c: 8 }) },
      extra: [
        extra("Kenarlarına göre", "Çubuklarla üçgen kur", "Elimizde 6 cm, 6 cm ve 6 cm’lik üç çubuk var. Uçlarını birleştirince eşkenar bir üçgen kurulur. Çubukları değiştir; hangi üçlülerle üçgen kurulduğunu dene.", "im-sticks", { a: 6, b: 6, c: 6 }, ["3, 4 ve 5 cm’lik çubuklarla üçgen kurulur mu?", "Evet. 3 + 4 = 7 > 5. Bu üçgen çeşitkenar ve dik üçgendir."]),
        extra("Çubuklarla üçgen kur", "Bu çubuklar buluşur mu?", "Şimdi 6 cm, 6 cm ve 55 cm’lik çubuklar var. İki kısa çubuk uzun çubuğun iki ucundan birbirine uzanır ama toplamları 12 cm; 55 cm’lik çubuğu kapatamaz. Üçgen kurulamaz. Kural: iki kısa kenarın toplamı en uzun kenardan büyük olmalı.", "im-sticks", { a: 6, b: 6, c: 55 }, ["4, 5 ve 9 cm’lik çubuklarla üçgen kurulur mu?", "Hayır. 4 + 5 = 9; uçlar ancak düz yatınca değer, üçgen oluşmaz."])
      ]
    },
    insa: {
      up: { "Tabanı çiz": up("im-construct", { step: "0" }), "Yayları çiz": up("im-construct", { step: "1" }), "Kesişimi birleştir": up("im-construct", { step: "2" }),
        "İnşa etmek": up("im-compass", { turn: 180 }), "Eşkenar": up("im-compass-tri", { base: 6, ra: 6, rb: 6 }), "İkizkenar ve çeşitkenar": up("im-compass-tri", { base: 6, ra: 6, rb: 4 }), "Öklid'in üç kuralı": up("im-euclid", { rule: "1" }) },
      extra: [extra("İkizkenar ve çeşitkenar", "Pergel yetişmezse", "Taban 7 birim, iki çemberin yarıçapı 3’er birim olsun. 3 + 3 = 6, tabandan kısa. Çemberler birbirine değmez ve üçgen kurulamaz. Yarıçapları büyüt; çemberler kesişince üçgen belirir.", "im-compass-tri", { base: 7, ra: 3, rb: 3 }, ["Taban 8 cm, yarıçaplar 3 cm ve 4 cm ise üçgen kurulur mu?", "Hayır. 3 + 4 = 7, tabandan küçük; çemberler kesişmez."])]
    },
    okuma: {
      up: { "Bölüklere ad ver": up("read", { digits: "12345678" }), "Bölükler": up("im-bolukle", { n: 149597890 }), "Nasıl okunur?": up("read", { digits: "149597890" }), "Sıfırın yeri": up("read", { digits: "7005" }) },
      extra: [
        extra("Sıfırın yeri", "Sıfırlı sayılar", "Sıfırları çok olan sayılarda bölükleri renkli paketlere ayır. Tamamı sıfır olan bölüğün adını söyleme. 2 030 405 060 sayısını dene.", "im-bolukle", { n: 2030405060 }, ["5 000 007 nasıl okunur?", "Beş milyon yedi. Binler bölüğü 000 olduğu için bin denmez."]),
        extra("Sıfırlı sayılar", "Abaküste boncuklarla kur", "Her çubuk bir basamağı temsil eder. Boncuk olmayan çubuğa 0 yazılır. Çubuklardaki boncuk sayılarını değiştirip sayının okunuşunu kontrol et.", "im-abacus", { m: 2, yb: 0, ob: 4, b: 3, y: 0, o: 5, bir: 6 }, ["Milyonlar çubuğunda 4, birler çubuğunda 9 boncuk varsa ve diğer çubuklar boşsa sayı kaçtır?", "4 000 009 (Dört milyon dokuz)."])
      ]
    },
    basamak: {
      up: { "Birler evinde": up("im-shift", { d: 3, pos: 0 }), "Bir ev sola": up("im-shift", { d: 3, pos: 1 }), "Bir ev daha sola": up("im-shift", { d: 3, pos: 2 }),
        "Basamak değeri": up("im-shift", { d: 4, pos: 2 }), "Çözümleme": up("im-expand", { n: 2140503 }), "Toplam kendisidir": up("im-expand", { n: 5080 }) },
      extra: [extra("Toplam kendisidir", "Rakamı yolculuğa çıkar", "7 rakamını birler basamağından başlatıp sola doğru yürüt. Her adımda basamak değeri 10 katına çıkar: 7, 70, 700, 7 000… Yüz binler basamağına gelince değeri 700 000 olur.", "im-shift", { d: 7, pos: 5 }, ["9 rakamı on binler basamağındaysa basamak değeri kaçtır?", "9 × 10 000 = 90 000."])]
    },
    sirala: {
      up: { "Eşitleri geç": up("im-compare5", { a: 4205, b: 4250 }), "Önce basamak sayısı": up("im-compare5", { a: 99999, b: 100000 }), "Soldan ilk fark": up("im-compare5", { a: 446803, b: 420000 }), "İşaretler": up("im-croc", { a: 13, b: 9 }) },
      extra: [extra("İşaretler", "Sayı doğrusunda sırala", "Sayı doğrusunda sağa gittikçe sayılar büyür. Üç sayıyı doğruya yerleştir, sonra soldan sağa okuyarak küçükten büyüğe sırala.", "im-order3", { a: 64, b: 28, c: 46 }, ["45, 54 ve 40 sayılarını küçükten büyüğe sırala.", "40 < 45 < 54."])]
    },
    islem: {
      up: { "Birleri birleştir": up("im-blocks", { a: 28, b: 17, step: "ones" }), "Onlukları topla": up("im-blocks", { a: 28, b: 17, step: "done" }),
        "Önce tahmin": up("im-estimate", { a: 175, b: 88 }), "Eksik toplanan": up("im-missing", { total: 60, part: 35 }), "Kısa yol": up("im-shortcut", { mode: "long" }) },
      extra: [extra("Eksik toplanan", "Çıkarmada onluk bozma", "52 − 27 işleminde 2 birlikten 7 birlik çıkmaz. Bir onluğu bozarız: 10 birlik daha gelir ve 12 birlik olur. Sonra rahatça çıkarırız.", "im-borrow", { a: 52, b: 27, step: "start" }, ["63 − 28 işleminde bozma gerekir mi? Sonuç kaç?", "Evet, 3 birlikten 8 çıkmaz. 13 − 8 = 5, 5 − 2 = 3 onluk. Sonuç 35."])]
    },
    carpan: {
      up: { "Bir sıra kur": up("im-mul", { rows: 1, cols: 4 }), "Üç sıra yap": up("im-mul", { rows: 3, cols: 4 }), "Yer değiştir": up("im-mul", { rows: 4, cols: 3 }),
        "Sıfırları kaydır": up("im-zeros", { a: 32, z1: 0, b: 3, z2: 2 }), "Bölmede de": up("im-share", { n: 13, g: 4 }), "Eksik çarpan, yukarı yuvarla": up("im-bus", { people: 25, cap: 11 }) },
      extra: [extra("Bölmede de", "Kalanlı paylaşım", "30 bilyeyi 7 arkadaşa eşit paylaştıralım. Her biri 4 bilye alır, 2 bilye artar. Bölme, eşit gruplara ayırmaktır; artan kalan, bölenden her zaman küçüktür.", "im-share", { n: 30, g: 7 }, ["23 kalem 5 kutuya eşit dağıtılırsa her kutuda kaç kalem olur, kaç kalem artar?", "23 ÷ 5 = 4, kalan 3. Her kutuda 4 kalem, 3 kalem artar."])]
    },
    problem: {
      up: { "Önce tutarı hesapla": up("im-shop", { n: 3, price: 20, money: 100 }), "Sonra kalanı bul": up("im-shop", { n: 4, price: 20, money: 100 }),
        "Dört adım": up("im-steps4", { step: "1" }), "Tabloyu oku": up("im-table", { q: "total" }), "En fazla, en az": up("im-bus", { people: 50, cap: 11 }) },
      extra: [extra("En fazla, en az", "Param yeter mi?", "Tanesi 15 TL olan defterden 100 TL ile en fazla kaç tane alınır? Önce tutarı ve kalanı modelde dene.", "im-shop", { n: 8, price: 40, money: 200 }, ["Tanesi 15 TL olan defterden 100 TL ile en fazla kaç tane alınır?", "100 ÷ 15 = 6, kalan 10. En fazla 6 defter."])]
    },
    cevre: {
      up: { "Bahçeyi tanı": up("im-walk", { w: 4, h: 3 }), "Çerçeve": up("im-walk", { w: 6, h: 3 }), "Aynı çevre, farklı dikdörtgen": up("im-fence", { P: "16", a: 1 }), "Tek sayı olmaz": up("im-odd", { P: 15 }) },
      extra: [extra("Aynı çevre, farklı dikdörtgen", "Kare bahçenin çevresi", "Kare de bir dikdörtgendir; dört kenarı eşittir. Kenarı 5 birim olan kare bahçenin çevresinde karınca 5 + 5 + 5 + 5 = 20 birim yürür.", "im-walk", { w: 5, h: 5 }, ["Kenarı 7 cm olan karenin çevresi kaç cm?", "4 × 7 = 28 cm."])]
    },
    alan: {
      up: { "Bir sırayı doldur": up("im-tile", { w: 4, h: 1 }), "Üç sırayı doldur": up("im-tile", { w: 4, h: 3 }), "Birim kareler": up("im-tile", { w: 5, h: 3 }),
        "Çarparak say": up("rect", { w: 4, h: 3 }, "Kenarları değiştir: alan her zaman iki kenarın çarpımı."), "Kısa yol": up("im-missing-side", { a: 7, b: 12 }), "Neden kare kaplar?": up("im-tess", { mode: "circle" }) },
      extra: [extra("Kısa yol", "Sınıfın tabanını döşe", "Sınıfın tabanı 6 sıra fayansın 4 kez dizilmesi gibi olsun. Fayanslar sıra sıra yerleşirken say: 6, 12, 18, 24. Kısa yol: 6 × 4 = 24 fayans.", "im-tile", { w: 6, h: 4 }, ["8 × 5 fayanslık bir zemin için kaç fayans gerekir?", "8 × 5 = 40 fayans."])]
    },
    iliski: {
      up: { "Uzun bir şekil kur": up("im-same-area", { A: "12", i: 1 }), "Kareleri yeniden diz": up("im-same-area", { A: "12", i: 2 }),
        "Aynı alan, başka çevre": up("im-same-area", { A: "24", i: 0 }), "Aynı çevre, başka alan": up("im-fence", { P: "20", a: 2 }), "İkisi birden": up("rect", { w: 6, h: 4 }, "Alanı 24, çevresi 20 olan dikdörtgeni kaydırıcılarla bul.") },
      extra: [
        extra("İkisi birden", "36 kareyi diz", "36 birim kareyi farklı dikdörtgenler hâlinde diz: 36 × 1, 18 × 2, 12 × 3, 9 × 4 ve 6 × 6. Alan hep 36 kalır. Çevre en uzun 74, en kısa 24 birimdir; en kısa çevre karede.", "im-same-area", { A: "36", i: 0 }, ["Alanı 16 birim kare olan dikdörtgenlerden en kısa çevreli olanı hangisi?", "4 × 4 kare. Çevresi 16 birimdir."]),
        extra("36 kareyi diz", "4 eş kareyle şekiller (Tetromino)", "4 birim kareyi farklı biçimlerde birbirine değdirerek O, I, L, T şekilleri kuralım. Alan hep 4 birim kare kalır ama kareler birbirine daha çok değdikçe dış çevre kısalır.", "im-polyomino", { shape: "O" }, ["4 birim karelik 2×2 kare şeklinin çevresi kaç birimdir?", "8 birim (Çubuk şeklinde ise 10 birimdir)."])
      ]
    }
  };

  const plan7 = {
    "m7-tamsayilar": {
      up: {
        "Sıfır bir referanstır": up("im-m7-sea", { h: -8, opp: "0" }),
        "Sayı doğrusunda yön": up("m7-number"),
        "Karşıt sayılar": up("im-m7-sea", { h: -10, opp: "1" }),
        "Asansör yolculuğu": up("im-m7-elevator", { start: 2, move: -5 }),
        "Düşün ve açıkla": up("im-m7-sea", { h: 12, opp: "1" })
      }
    },
    "m7-rasyonel": {
      up: {
        "Bütünü eş parçalara ayır": up("im-frac", { n: -3, d: 4, k: 1 }),
        "İşareti taşı": up("im-m7-sign", { p: 3, q: 4, pos: "front" }),
        "Eş kesirler": up("im-frac", { n: 2, d: 4, k: 2 }),
        "Tam sayıya köprü": up("im-frac", { n: -6, d: 3, k: 1 }),
        "Sıfırın yeri": up("im-frac", { n: 0, d: 5, k: 1 })
      }
    },
    "m7-mutlakdeger": {
      up: {
        "Uzaklığın işareti yok": up("im-abs", { a: -7, b: 0 }),
        "İki farklı sayı, aynı uzaklık": up("im-abs", { a: -8, b: 8 }),
        "Paketleme kontrolü": up("im-m7-pack", { w: 494, tol: 5 }),
        "İki nokta arası": up("im-abs", { a: -6, b: 4 }),
        "Tolerans aralığı": up("im-m7-pack", { w: 503, tol: 5 })
      }
    },
    "m7-temsiller": {
      up: {
        "Kesirden ondalığa": up("im-decimal", { n: 3, d: 4 }),
        "Sonlu mu, devirli mi?": up("im-m7-rep", { p: 3, q: "4" }),
        "Devir tekrar eder": up("im-m7-rep", { p: 4, q: "9" }),
        "Devir sonradan başlarsa": up("im-m7-rep", { p: 5, q: "6" }),
        "Sonsuz devir, tam değer": up("im-m7-rep", { p: 1, q: "3" })
      }
    },
    "m7-siralama": {
      up: {
        "Arada yeni sayı": up("im-m7-dense", { pair: "0", zoom: 1 }),
        "Sonsuz sayıda ara değer": up("im-m7-dense", { pair: "0", zoom: 3 })
      }
    },
    "m7-tamsayiislemler": {
      up: {
        "Toplamada yön": up("im-m7-chips", { a: -3, op: "+", b: 5 }),
        "Çıkarmayı toplamaya çevir": up("im-m7-chips", { a: 4, op: "-", b: -2 }),
        "Çarpma ve bölme": up("m7-number"),
        "Bakiye planı": up("im-m7-ledger", { start: 50, inc: 125, exp: 200 }),
        "Sonucu kontrol et": up("im-m7-chips", { a: -4, op: "-", b: 3 })
      }
    },
    "m7-rasyonelislemler": {
      up: {
        "Toplamada ortak payda": up("im-fracadd", { a: -1, b: 2, c: 3, d: 4 }),
        "Çarpma ve bölme": up("im-m7-jugs", { tot: "6/4", cup: "1/4" }),
        "İşlem özellikleri": up("im-fracadd", { a: 2, b: 3, c: -1, d: 6 }),
        "Üs ve parantez": up("im-m7-pow", { p: 2, q: 3, exp: "2", par: "in" }),
        "Kesirli yaşam problemi": up("im-m7-jugs", { tot: "9/4", cup: "3/8" })
      }
    },
    "m7-cokadimli": {
      up: {
        "İşlem sırası": up("im-m7-tankstep", { mode: "order", step: 1 }),
        "Aynı öncelikte soldan sağa": up("im-order", { a: 2, b: 3, c: 4 }),
        "Kesir çizgisi gruplar": up("im-m7-tankstep", { mode: "bar", step: 2 }),
        "Depoyu planla": up("im-m7-tankstep", { mode: "tank", step: 2 }),
        "Hata avcısı": up("im-order", { a: 5, b: 2, c: 6 })
      }
    },
    "m7-gorunumler": {
      up: {
        "Bakış yönü": up("im-m7-views3d", { b: "L", dir: "top" }),
        "Üstten görünüm": up("im-m7-views3d", { b: "step", dir: "top" }),
        "Önden görünüm": up("im-m7-views3d", { b: "L", dir: "front" }),
        "Sağdan görünüm": up("im-m7-views3d", { b: "L", dir: "right" }),
        "Görünümler yetmeyebilir": up("im-m7-views3d", { b: "amb", dir: "front" })
      }
    },
    "m7-acinim": {
      up: {
        "Altı yüzü aç": up("im-m7-net", { type: "prism", fold: 0 }),
        "Üç çift dikdörtgen": up("im-m7-net", { type: "prism", fold: 1 }),
        "Kutuyu kapla": up("im-m7-net", { type: "prism", fold: 2 }),
        "Açık kutu": up("im-m7-net", { type: "open", fold: 1 }),
        "Küpün özel durumu": up("im-m7-net", { type: "cube", fold: 0 })
      }
    },
    "m7-hacimyorum": {
      up: {
        "İçeriyi doldur": up("im-layers", { a: 3, b: 2, c: 2 }),
        "Bir katmanı say": up("im-layers", { a: 4, b: 3, c: 1 }),
        "Katmanları birleştir": up("im-layers", { a: 4, b: 3, c: 3 }),
        "Birim büyürse sayı azalır": up("im-m7-unitcube", { unit: "2", cmp: "vol" }),
        "Alanla karıştırma": up("im-m7-unitcube", { unit: "1", cmp: "area" })
      }
    },
    "m7-hacim": {
      up: {
        "Taban alanından hacme": up("im-m7-scale3d", { a: 4, b: 3, c: 2, fill: "4" }),
        "Örnek depo": up("m7-prism"),
        "Eksik ayrıt": up("im-m7-scale3d", { a: 5, b: 3, c: 4, fill: "4" }),
        "Boyutlar değişirse": up("im-m7-scale3d", { a: 6, b: 4, c: 4, fill: "4" }),
        "Doluluk payı": up("im-m7-scale3d", { a: 4, b: 3, c: 4, fill: "3" })
      }
    },
    "m7-birimler": {
      up: {
        "Küp birimlerde bin kat": up("im-m7-stairs", { sys: "cube", val: 3, step: 1 }),
        "Litre köprüsü": up("im-units", { ml: 4000 }),
        "Litre basamakları": up("im-m7-stairs", { sys: "litre", val: 2, step: 2 }),
        "Dönüşümü uygula": up("im-units", { ml: 3000 }),
        "Önce birimleri eşitle": up("im-m7-stairs", { sys: "cube", val: 5, step: 1 })
      }
    },
    "m7-problemler": {
      up: {
        "Modeli seç": up("im-tank", { cap: 24, parts: 4, filled: 4 }),
        "Akvaryum": up("im-tank", { cap: 36, parts: 4, filled: 4 }),
        "Kısmi doluluk": up("im-tank", { cap: 36, parts: 4, filled: 3 }),
        "Kutuya yerleştirme": up("im-m7-packbox", { W: 20, D: 15, H: 12, k: "4" }),
        "Malzeme payı": up("im-m7-net", { type: "prism", fold: 0 })
      }
    },
    "m7-dagilimlar": {
      up: {
        "Veri neyi anlatır?": up("im-m7-plants", { type: "cont", spread: "wide" }),
        "Kesikli ve sürekli": up("im-m7-plants", { type: "disc", spread: "low" }),
        "Sayı görünmesi yetmez": up("im-m7-plants", { type: "code", spread: "wide" }),
        "Değişebilirlik": up("im-m7-plants", { type: "cont", spread: "low" }),
        "Dağılıma bak": up("im-data", { mode: "sure" })
      }
    },
    "m7-surec": {
      up: {
        "Soruyu kur": up("im-research", { mode: "sinif" }),
        "Evren ve örneklem": up("im-m7-sample", { method: "fair", n: 30 }),
        "Dört adımı izle": up("im-research", { mode: "boy" }),
        "Ölçmeyi planla": up("im-research", { mode: "sayfa" }),
        "Sınırını belirt": up("im-m7-sample", { method: "biased", n: 10 })
      }
    },
    "m7-toplama": {
      up: {
        "Yöntem seç": up("im-privacy", { on: ["sure", "sube", "donem"] }),
        "Tarafsız soru": up("im-m7-survey", { q: "neutral", priv: "safe", miss: "report" }),
        "Gereken kadar veri": up("im-privacy", { on: ["sure", "sube", "donem", "kimlik"] }),
        "Gönüllülük ve paylaşım": up("im-privacy", { on: ["sure", "sube", "donem", "adres"] }),
        "Eksik veri": up("im-m7-survey", { q: "neutral", priv: "safe", miss: "fake" })
      }
    },
    "m7-analiz": {
      up: {
        "Sütun grafiği": up("im-m7-charts", { type: "bar", hi: 2 }),
        "Çizgi grafiği": up("im-m7-charts", { type: "line", hi: 3 }),
        "Nokta grafiği": up("im-m7-charts", { type: "dot", hi: 2 }),
        "Ölçek kontrolü": up("im-m7-axis", { mode: "zero" }),
        "Grafikten hesaba": up("im-m7-charts", { type: "bar", hi: 4 })
      }
    },
    "m7-yorumlama": {
      up: {
        "Ortalama ve ortanca": up("im-m7-seesaw", { x5: 9, band: "0" }),
        "Tepe değer ve açıklık": up("m7-stats"),
        "Ortalama mutlak sapma": up("im-m7-seesaw", { x5: 9, band: "1" }),
        "İstikrarı karşılaştır": up("im-m7-seesaw", { x5: 6, band: "1" }),
        "Referans bandı": up("im-m7-seesaw", { x5: 15, band: "1" })
      }
    },
    "m7-inceleme": {
      up: {
        "İddiayı sorgula": up("im-media", { start: 80, end: 100 }),
        "Kesilmiş eksen": up("im-m7-axis", { mode: "cut" }),
        "İlişki ve neden": up("im-media", { start: 50, end: 75 }),
        "Temsil sorunu": up("im-m7-sample", { method: "biased", n: 20 }),
        "Raporu düzelt": up("im-m7-axis", { mode: "zero" })
      }
    },
    "m7-yansima": {
      up: {
        "Aynanın iki yanı": up("im-m7-sym", { mode: "mirror", n: 4 }),
        "Adım adım çiz": up("m7-mirror"),
        "Eşlik korunur": up("im-m7-sym", { mode: "mirror", n: 5 }),
        "Doğru üzerindeki noktalar": up("im-m7-sym", { mode: "mirror", n: 3 }),
        "Simetri doğrusu sayısı": up("im-m7-sym", { mode: "poly", n: 5 })
      }
    },
    "m7-insa": {
      up: {
        "Orta dikme": up("im-m7-bisect", { kind: "perp", step: 3 }),
        "Pergelle kur": up("im-m7-bisect", { kind: "perp", step: 2 }),
        "Açıortay": up("im-m7-bisect", { kind: "ang", step: 3 }),
        "Açıortayı inşa et": up("im-m7-bisect", { kind: "ang", step: 2 }),
        "İki özelliği birlikte kontrol et": up("im-m7-bisect", { kind: "perp", step: 3 })
      }
    }
  };

  function toSlide(slide, sandbox, preset, hint) {
    delete slide.scene;
    delete slide.figure;
    slide.sandbox = sandbox;
    if (sandbox === "read") slide.sandboxDigits = preset.digits;
    else if (sandbox === "circle") slide.sandboxR = slide.sandboxR || 4;
    else if (sandbox === "rect") { slide.sandboxW = preset.w; slide.sandboxH = preset.h; }
    else slide.imPreset = preset || {};
    const spec = sandbox.startsWith("im-") ? M.spec(sandbox) : null;
    slide.playHint = hint || (spec && spec.demo ? "Kendin değiştir ya da ▶ İzle düğmesine bas; model kendisi oynasın." : "Modeli değiştir ve ne olduğunu izle.");
  }

  function applyPlan(topics, planMap) {
    if (!topics) return;
    for (const topic of topics) {
      const spec = planMap[topic.id];
      if (!spec) continue;
      for (const [h, change] of Object.entries(spec.up || {})) {
        const slide = topic.slides.find((s) => s.h === h && !s.teach);
        if (!slide) throw new Error("Adım yok: " + topic.id + " / " + h);
        toSlide(slide, change.sandbox, change.preset, change.hint);
      }
      for (const item of spec.extra || []) {
        const at = topic.slides.findIndex((s) => s.h === item.after && !s.teach);
        if (at < 0) throw new Error("Adım yok: " + topic.id + " / " + item.after);
        const slide = { h: item.h, p: item.p, extraExample: true, check: item.check ? { ask: item.check[0], answer: item.check[1] } : null };
        toSlide(slide, item.sandbox, item.preset, item.hint);
        topic.slides.splice(at + 1, 0, slide);
      }
    }
  }

  applyPlan(root.MatCurriculum && root.MatCurriculum.topics, plan);
  applyPlan(root.MatCurricula && root.MatCurricula[7] && root.MatCurricula[7].topics, plan7);

  root.MatLessonPlay = { plan, plan7, sayNumber, ablative };
})(typeof window !== "undefined" ? window : globalThis);
