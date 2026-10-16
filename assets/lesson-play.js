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
  const badges = (items) => `<div class="pl-badges">${items.map(([ok, t]) => `<span class="${ok ? "yes" : "no"}">${ok ? "✓" : "✗"} ${t}</span>`).join("")}</div>`;
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
      extra: [extra("Düzgün çokgen", "Eşkenar dörtgen düzgün mü?", "Eşkenar dörtgenin dört kenarı da eşittir. Peki açıları? Karşılıklı açılar eşit ama komşu açılar farklıdır. Bu yüzden düzgün çokgen değildir. Kare ile karşılaştır.", "im-regular", { mode: "rh" }, ["Dikdörtgen neden düzgün çokgen değildir?", "Açıları eşit ama kenarları her zaman eşit değil."])]
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
      extra: [extra("Sıfırın yeri", "Sıfırlı sayılar", "Sıfırları çok olan sayılarda bölükleri renkli paketlere ayır. Tamamı sıfır olan bölüğün adını söyleme. 2 030 405 060 sayısını dene.", "im-bolukle", { n: 2030405060 }, ["5 000 007 nasıl okunur?", "Beş milyon yedi. Binler bölüğü 000 olduğu için bin denmez."])]
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
      extra: [extra("En fazla, en az", "Param yeter mi?", "Tanesi 40 TL olan 8 kitap için 200 TL yeter mi? Önce tutarı bul: 8 × 40 = 320 TL. Para yetmiyorsa en fazla kaç kitap alınacağını bölerek bul: 200 ÷ 40 = 5.", "im-shop", { n: 8, price: 40, money: 200 }, ["Tanesi 15 TL olan defterden 100 TL ile en fazla kaç tane alınır?", "100 ÷ 15 = 6, kalan 10. En fazla 6 defter."])]
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
      extra: [extra("İkisi birden", "36 kareyi diz", "36 birim kareyi farklı dikdörtgenler hâlinde diz: 36 × 1, 18 × 2, 12 × 3, 9 × 4 ve 6 × 6. Alan hep 36 kalır. Çevre en uzun 74, en kısa 24 birimdir; en kısa çevre karede.", "im-same-area", { A: "36", i: 0 }, ["Alanı 16 birim kare olan dikdörtgenlerden en kısa çevreli olanı hangisi?", "4 × 4 kare. Çevresi 16 birimdir."])]
    }
  };

  function toSlide(slide, sandbox, preset, hint) {
    delete slide.scene;
    slide.sandbox = sandbox;
    if (sandbox === "read") slide.sandboxDigits = preset.digits;
    else if (sandbox === "circle") slide.sandboxR = slide.sandboxR || 4;
    else if (sandbox === "rect") { slide.sandboxW = preset.w; slide.sandboxH = preset.h; }
    else slide.imPreset = preset || {};
    const spec = sandbox.startsWith("im-") ? M.spec(sandbox) : null;
    slide.playHint = hint || (spec && spec.demo ? "Kendin değiştir ya da ▶ İzle düğmesine bas; model kendisi oynasın." : "Modeli değiştir ve ne olduğunu izle.");
  }

  for (const topic of root.MatCurriculum.topics) {
    const spec = plan[topic.id];
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
  root.MatLessonPlay = { plan, sayNumber, ablative };
})(typeof window !== "undefined" ? window : globalThis);
