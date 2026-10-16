/* Anlatım adımındaki oynatılabilir modeller. Metinler özgün ders anlatımıdır. */
(function (root) {
  "use strict";
  const gcd = (a, b) => {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = a % b; a = b; b = t; }
    return a || 1;
  };
  const lcm = (a, b) => Math.abs(a) / gcd(a, b) * Math.abs(b);
  const num = (n) => {
    if (!Number.isFinite(n)) return "—";
    const r = Math.round(n * 100) / 100;
    const text = Number.isInteger(Math.abs(r)) ? String(Math.abs(r)) : String(Math.abs(r)).replace(".", ",");
    return (r < 0 ? "−" : "") + text;
  };
  const group = (n) => (n < 0 ? "−" : "") + String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const svg = (body, label, h = 210) => `<svg class="scene" viewBox="0 0 420 ${h}" role="img" aria-label="${label}">${body}</svg>`;
  const frac = (n, d) => {
    if (d < 0) { n = -n; d = -d; }
    const spoken = (n < 0 ? "eksi " : "") + Math.abs(n) + " bölü " + d;
    const value = (n < 0 ? "-" : "") + Math.abs(n) + "/" + d;
    return `<span class="im-frac" data-value="${value}" aria-label="${spoken}">${n < 0 ? '<b class="im-sign">−</b>' : ""}<span class="im-stack"><span>${Math.abs(n)}</span><span>${d}</span></span></span>`;
  };
  const simplify = (n, d) => {
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
  };
  function decimalOf(n, d) {
    if (d < 0) { n = -n; d = -d; }
    const sign = n < 0 ? "−" : "";
    n = Math.abs(n);
    const whole = Math.floor(n / d);
    let rem = n % d;
    if (!rem) return sign + whole;
    let digits = "";
    const seen = new Map();
    let repeatAt = -1;
    while (rem && digits.length < 12) {
      if (seen.has(rem)) { repeatAt = seen.get(rem); break; }
      seen.set(rem, digits.length);
      rem *= 10;
      digits += Math.floor(rem / d);
      rem %= d;
    }
    if (repeatAt >= 0) return sign + whole + "," + digits.slice(0, repeatAt) + digits.slice(repeatAt).repeat(3) + "…";
    return sign + whole + "," + digits;
  }
  function finiteDen(d) {
    let x = Math.abs(d);
    while (x % 2 === 0) x /= 2;
    while (x % 5 === 0) x /= 5;
    return x === 1;
  }

  const specs = {
    "im-line": {
      instruction: "Dört modeli sırayla seç. Hangisinin uzunluğu cetvelle ölçülür?",
      controls: [{ type: "choice", key: "mode", value: "segment", label: "Model", options: [["point", "Nokta"], ["segment", "Doğru parçası"], ["ray", "Işın"], ["line", "Doğru"]] }],
      demo: [{ mode: "point" }, { mode: "segment" }, { mode: "ray" }, { mode: "line" }],
      render(v) {
        const draw = {
          point: svg('<rect x="20" y="20" width="380" height="170" rx="14" fill="#fffdf7" stroke="#e5dec9"/><circle class="pl-pop" cx="210" cy="95" r="9" fill="#e25b45"/><circle cx="210" cy="95" r="18" fill="none" stroke="#e25b45" stroke-width="2" stroke-dasharray="4 3"/><text x="210" y="138" text-anchor="middle" font-size="20" font-weight="800" fill="#1b2430">A</text><text x="210" y="52" text-anchor="middle" font-size="14" font-weight="700" fill="#65776c">Eni, boyu, kalınlığı yok · Yalnızca konum</text>', "A noktası"),
          segment: svg('<rect x="55" y="126" width="310" height="36" rx="6" fill="#fff4cf" stroke="#d89a12" stroke-width="2"/>' +
            [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<line x1="${70 + i * 40}" y1="126" x2="${70 + i * 40}" y2="140" stroke="#1b2430" stroke-width="2"/><text x="${70 + i * 40}" y="156" text-anchor="middle" font-size="12" font-weight="700">${i}</text>`).join("") +
            '<line class="pl-draw" pathLength="1" x1="70" y1="95" x2="350" y2="95" stroke="#1b2430" stroke-width="5" stroke-linecap="round"/><circle class="pl-pop" cx="70" cy="95" r="7" fill="#2c6bed"/><circle class="pl-pop" style="--d:.3s" cx="350" cy="95" r="7" fill="#e25b45"/><text x="70" y="75" text-anchor="middle" font-weight="800" fill="#2c6bed">A</text><text x="350" y="75" text-anchor="middle" font-weight="800" fill="#e25b45">B</text><text x="210" y="48" text-anchor="middle" font-size="18" font-weight="800" fill="#1c8c74">|AB| ölçülür (7 cm)</text>', "AB doğru parçası"),
          ray: svg('<line class="pl-draw" pathLength="1" x1="70" y1="105" x2="365" y2="105" stroke="#1b2430" stroke-width="5" stroke-linecap="round"/><polygon class="pl-pop" style="--d:.4s" points="375,105 353,94 353,116" fill="#e25b45"/><circle class="pl-pop" cx="70" cy="105" r="7" fill="#2c6bed"/><text x="70" y="138" text-anchor="middle" font-weight="800" fill="#2c6bed">A (Başlangıç)</text><text x="330" y="76" text-anchor="middle" font-weight="800" fill="#e25b45" class="pl-pulse">Sonsuza gider ∞ →</text><text x="210" y="46" text-anchor="middle" font-weight="800" fill="#1b2430">Başlangıç var, bitiş yok</text>', "A başlangıçlı ışın"),
          line: svg('<line class="pl-draw" pathLength="1" x1="45" y1="105" x2="375" y2="105" stroke="#1b2430" stroke-width="5" stroke-linecap="round"/><polygon class="pl-pop" style="--d:.4s" points="385,105 363,94 363,116" fill="#e25b45"/><polygon class="pl-pop" style="--d:.4s" points="35,105 57,94 57,116" fill="#e25b45"/><text x="85" y="76" text-anchor="middle" font-weight="800" fill="#e25b45" class="pl-pulse">← ∞</text><text x="335" y="76" text-anchor="middle" font-weight="800" fill="#e25b45" class="pl-pulse">∞ →</text><text x="210" y="46" text-anchor="middle" font-weight="800" fill="#1b2430">İki uç da sonsuz</text>', "İki yönü sonsuz doğru")
        };
        const say = {
          point: "Nokta bir yer gösterir. Uzunluğu, eni ve boyu yoktur; ölçülemez.",
          segment: "Doğru parçasının iki ucu bellidir. Uzunluğu ölçülür. [AB] ile [BA] aynı parçadır.",
          ray: "Işının bir başlangıcı vardır, diğer ucu sonsuzdur. Uzunluğu ölçülemez.",
          line: "Doğrunun iki ucu da sonsuzdur. Uzunluğu ölçülemez. Ok, çizginin orada bitmediğini söyler."
        };
        return draw[v.mode] + `<p class="im-caption">${say[v.mode]}</p>`;
      }
    },
    "im-dikme": {
      instruction: "Yolun kıyıya değme açısını değiştir. En kısa yol hangi açıda?",
      controls: [{ type: "range", key: "deg", label: "Yolun kıyıyla açısı", min: 20, max: 90, value: 30 }],
      demo: [{ deg: 30 }, { deg: 50 }, { deg: 90 }],
      render(v) {
        const rad = v.deg * Math.PI / 180;
        const len = 4 / Math.sin(rad);
        const dx = v.deg === 90 ? 0 : 80 / Math.tan(rad);
        const x2 = Math.round(130 + dx);
        const isPerp = v.deg === 90;
        return svg(`<rect x="20" y="160" width="380" height="40" rx="6" fill="#cfe8fa"/><line x1="20" y1="160" x2="400" y2="160" stroke="#1b2430" stroke-width="4"/>
          <rect x="130" y="146" width="14" height="14" fill="none" stroke="#1c8c74" stroke-width="2.5"/>
          <line x1="130" y1="60" x2="130" y2="160" stroke="#1c8c74" stroke-width="3" stroke-dasharray="5 4"/>
          <line class="pl-draw" pathLength="1" x1="130" y1="60" x2="${x2}" y2="160" stroke="${isPerp ? "#1c8c74" : "#e25b45"}" stroke-width="5" stroke-linecap="round"/>
          <circle cx="130" cy="60" r="7" fill="#2c6bed"/><circle cx="${x2}" cy="160" r="6" fill="${isPerp ? "#1c8c74" : "#e25b45"}"/>
          <text x="130" y="44" text-anchor="middle" font-weight="800" fill="#2c6bed">A</text>
          <text x="92" y="115" text-anchor="middle" font-size="14" font-weight="800" fill="#1c8c74">4 cm (dik)</text>
          <text x="${Math.min(355, Math.max(200, (130 + x2) / 2 + 45))}" y="102" text-anchor="middle" font-size="16" font-weight="800" fill="${isPerp ? "#1c8c74" : "#e25b45"}">${num(len)} cm (${v.deg}°)</text>
          <text x="210" y="186" text-anchor="middle" font-size="14" font-weight="700" fill="#1e5685">🌊 Nehir kıyısı (d doğrusu)</text>`, "Noktadan kıyıya inen yollar") +
          `<p class="im-caption">Dik uzaklık 4 cm. Şu anki yol: ${num(len)} cm. Dik yol: 4 cm. Açı 90° olunca eğik yol da dik yola eşittir; açı küçüldükçe yol uzar.</p>`;
      }
    },
    "im-parallel": {
      instruction: "İki doğruyu paralel ya da kesişen duruma getir.",
      controls: [{ type: "choice", key: "mode", value: "parallel", label: "Durum", options: [["parallel", "Paralel"], ["cross", "Kesişen"]] }],
      demo: [{ mode: "parallel" }, { mode: "cross" }],
      render(v) {
        const parallel = v.mode === "parallel";
        const body = parallel
          ? '<line class="pl-draw" pathLength="1" x1="40" y1="70" x2="380" y2="70" stroke="#2c6bed" stroke-width="5" stroke-linecap="round"/><line class="pl-draw" pathLength="1" x1="40" y1="150" x2="380" y2="150" stroke="#e25b45" stroke-width="5" stroke-linecap="round"/>' +
            '<line x1="110" y1="70" x2="110" y2="150" stroke="#1c8c74" stroke-width="3" stroke-dasharray="5 4"/><rect x="110" y="138" width="12" height="12" fill="none" stroke="#1c8c74" stroke-width="2"/><text x="142" y="115" font-size="14" font-weight="800" fill="#1c8c74">4 cm</text>' +
            '<line x1="290" y1="70" x2="290" y2="150" stroke="#1c8c74" stroke-width="3" stroke-dasharray="5 4"/><rect x="290" y="138" width="12" height="12" fill="none" stroke="#1c8c74" stroke-width="2"/><text x="322" y="115" font-size="14" font-weight="800" fill="#1c8c74">4 cm</text>' +
            '<text x="210" y="42" text-anchor="middle" font-size="18" font-weight="800" fill="#1c8c74">AB // CD · Dik uzaklık hep eşit</text>'
          : '<line class="pl-draw" pathLength="1" x1="40" y1="40" x2="380" y2="180" stroke="#2c6bed" stroke-width="5" stroke-linecap="round"/><line class="pl-draw" pathLength="1" x1="40" y1="180" x2="380" y2="40" stroke="#e25b45" stroke-width="5" stroke-linecap="round"/><circle class="pl-pop" style="--d:.4s" cx="210" cy="110" r="8" fill="#d89a12"/><text x="210" y="84" text-anchor="middle" font-size="16" font-weight="800" fill="#1b2430">Ortak nokta (K)</text>';
        const say = parallel
          ? "Paralel doğruların ortak noktası yoktur. Aralarındaki dik uzaklık her yerde aynıdır."
          : "Kesişen doğruların bir ortak noktası vardır. Bunlar paralel değildir.";
        return svg(body, say) + `<p class="im-caption">${say}</p>`;
      }
    },
    "im-durum": {
      instruction: "Üç durumu yan yana düşün: ortak nokta var mı, yok mu, hepsi mi ortak?",
      controls: [{ type: "choice", key: "mode", value: "intersect", label: "Durum", options: [["parallel", "Paralel"], ["intersect", "Kesişen"], ["same", "Çakışık"]] }],
      demo: [{ mode: "parallel" }, { mode: "intersect" }, { mode: "same" }],
      render(v) {
        const body = {
          parallel: '<line class="pl-draw" pathLength="1" x1="40" y1="75" x2="380" y2="75" stroke="#2c6bed" stroke-width="5" stroke-linecap="round"/><line class="pl-draw" pathLength="1" x1="40" y1="145" x2="380" y2="145" stroke="#e25b45" stroke-width="5" stroke-linecap="round"/><text x="210" y="42" text-anchor="middle" font-size="17" font-weight="800" fill="#2c6bed">0 ortak nokta (d // k)</text>',
          intersect: '<line class="pl-draw" pathLength="1" x1="40" y1="40" x2="380" y2="180" stroke="#2c6bed" stroke-width="5" stroke-linecap="round"/><line class="pl-draw" pathLength="1" x1="40" y1="180" x2="380" y2="40" stroke="#e25b45" stroke-width="5" stroke-linecap="round"/><circle class="pl-pop" style="--d:.4s" cx="210" cy="110" r="8" fill="#1c8c74"/><text x="210" y="38" text-anchor="middle" font-size="17" font-weight="800" fill="#1c8c74">Tam 1 ortak nokta</text>',
          same: '<line x1="40" y1="110" x2="380" y2="110" stroke="#2c6bed" stroke-width="9" stroke-linecap="round"/><line x1="40" y1="110" x2="380" y2="110" stroke="#e25b45" stroke-width="4" stroke-dasharray="12 10" stroke-linecap="round"/>' +
            [90, 170, 250, 330].map((x) => `<circle class="pl-pop" cx="${x}" cy="110" r="5" fill="#fff" stroke="#1b2430" stroke-width="2"/>`).join("") +
            '<text x="210" y="55" text-anchor="middle" font-size="17" font-weight="800" fill="#d89a12">Sonsuz ortak nokta (Üst üste)</text>'
        };
        const say = {
          parallel: "Paralel: ortak nokta yoktur, açı oluşmaz.",
          intersect: "Kesişen: tam bir ortak nokta vardır. İki farklı doğru ikinci bir noktada bir daha kesişemez.",
          same: "Çakışık: bütün noktalar ortaktır. Üst üste duran tek doğru gibi görünür."
        };
        return svg(body[v.mode], say[v.mode]) + `<p class="im-caption">${say[v.mode]}</p>`;
      }
    },
    "im-polygon": {
      instruction: "Kenar sayısını artır. Köşe sayısı ve köşegen sayısı nasıl değişiyor?",
      controls: [{ type: "range", key: "n", label: "Kenar sayısı", min: 3, max: 8, value: 5 }],
      demo: [{ n: 3 }, { n: 4 }, { n: 5 }, { n: 6 }, { n: 8 }],
      render(v) {
        const n = v.n;
        const names = { 3: "Üçgen", 4: "Dörtgen", 5: "Beşgen", 6: "Altıgen", 7: "Yedigen", 8: "Sekizgen" };
        const diag = n * (n - 3) / 2;
        const interior = (n - 2) * 180 / n;
        const xy = [];
        for (let i = 0; i < n; i++) {
          const a = -Math.PI / 2 + i * 2 * Math.PI / n;
          xy.push([210 + Math.cos(a) * 76, 112 + Math.sin(a) * 76]);
        }
        const pts = xy.map((p) => p.map((x) => x.toFixed(1)).join(",")).join(" ");
        let diagonals = "";
        for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
          if (i === 0 && j === n - 1) continue;
          diagonals += `<line class="pl-draw" pathLength="1" x1="${xy[i][0].toFixed(1)}" y1="${xy[i][1].toFixed(1)}" x2="${xy[j][0].toFixed(1)}" y2="${xy[j][1].toFixed(1)}" stroke="#d89a12" stroke-width="2"/>`;
        }
        const dots = xy.map(([x, y], i) => {
          const lx = 210 + (x - 210) * 1.24, ly = 112 + (y - 112) * 1.24;
          return `<circle class="pl-pop" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" fill="#e25b45"/><text x="${lx.toFixed(1)}" y="${(ly + 5).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="800" fill="#1b2430">${"ABCDEFGH"[i]}</text>`;
        }).join("");
        return svg(`<polygon points="${pts}" fill="#d9e6ff88" stroke="#2c6bed" stroke-width="3.5"/>${diagonals}${dots}<text x="355" y="38" text-anchor="middle" font-size="15" font-weight="800" fill="#d89a12">${diag} köşegen</text><text x="72" y="38" text-anchor="middle" font-size="15" font-weight="800" fill="#2c6bed">${num(interior)}°</text>`, names[n], 220) +
          `<p class="im-caption">${names[n]}: ${n} kenar, ${n} köşe, ${diag} köşegen. Köşegen sayısı = ${n} × (${n} − 3) / 2 = ${diag}. Düzgün ${names[n].toLocaleLowerCase("tr")}de her iç açı ${num(interior)}°dir.</p>`;
      }
    },
    "im-triangle": {
      instruction: "İki açıyı değiştir. Üçüncü açı 180°yi tamamlasın.",
      controls: [
        { type: "range", key: "a", label: "Birinci açı", min: 10, max: 160, value: 70 },
        { type: "range", key: "b", label: "İkinci açı", min: 10, max: 160, value: 60 }
      ],
      demo: [{ a: 70, b: 60 }, { a: 90, b: 45 }, { a: 110, b: 40 }, { a: 120, b: 70 }],
      render(v) {
        const c = 180 - v.a - v.b;
        if (c <= 0) {
          const r1 = v.a * Math.PI / 180, r2 = (180 - v.b) * Math.PI / 180;
          return svg(`<line x1="90" y1="165" x2="330" y2="165" stroke="#1b2430" stroke-width="4"/>
            <line x1="90" y1="165" x2="${(90 + 110 * Math.cos(r1)).toFixed(1)}" y2="${(165 - 110 * Math.sin(r1)).toFixed(1)}" stroke="#e25b45" stroke-width="4" stroke-dasharray="6 4"/>
            <line x1="330" y1="165" x2="${(330 + 110 * Math.cos(r2)).toFixed(1)}" y2="${(165 - 110 * Math.sin(r2)).toFixed(1)}" stroke="#e25b45" stroke-width="4" stroke-dasharray="6 4"/>
            <text x="210" y="45" text-anchor="middle" font-size="17" font-weight="800" fill="#e25b45">✗ Kollar buluşmuyor (${v.a}° + ${v.b}° = ${v.a + v.b}° ≥ 180°)</text>`, "Üçgen oluşmaz") +
            `<p class="im-caption">Bu açılar bir üçgen oluşturmaz. ${v.a}° + ${v.b}° = ${v.a + v.b}°. İki açının toplamı 180°den küçük olmalıdır; üçüncü açıya yer kalmaz.</p>`;
        }
        const kind = v.a === 90 || v.b === 90 || c === 90 ? "dik üçgendir" : (v.a > 90 || v.b > 90 || c > 90 ? "geniş açılıdır" : "dar açılıdır");
        const color = kind === "dik üçgendir" ? "#1c8c74" : kind === "geniş açılıdır" ? "#e25b45" : "#2c6bed";
        return svg(`<polygon class="pl-pop" points="70,170 210,38 350,170" fill="#d9e6ff" stroke="${color}" stroke-width="3.5" stroke-linejoin="round"/>
          <circle cx="70" cy="170" r="5" fill="#2c6bed"/><circle cx="350" cy="170" r="5" fill="#2c6bed"/><circle cx="210" cy="38" r="5" fill="#e25b45"/>
          <text x="118" y="158" font-size="16" font-weight="800" fill="#1b2430">${v.a}°</text>
          <text x="278" y="158" font-size="16" font-weight="800" fill="#1b2430">${v.b}°</text>
          <text x="210" y="82" text-anchor="middle" font-size="18" font-weight="800" fill="#e25b45">${c}°</text>
          <text x="345" y="36" text-anchor="end" font-size="14" font-weight="800" fill="${color}">${v.a}° + ${v.b}° + ${c}° = 180°</text>`, "Üçgende üç açı") +
          `<p class="im-caption">Üçüncü açı: ${c}°. ${v.a}° + ${v.b}° + ${c}° = 180°. Bu üçgen ${kind}.</p>`;
      }
    },
    "im-construct": {
      instruction: "İnşayı adım adım izle. Pergelin açıklığı hiç değişmiyor.",
      controls: [{ type: "choice", key: "step", value: "2", label: "Adım", options: [["0", "1. Taban"], ["1", "2. Çemberler"], ["2", "3. Üçgen"]] }],
      demo: [{ step: "0" }, { step: "1" }, { step: "2" }],
      render(v) {
        const base = '<line class="pl-draw" pathLength="1" x1="110" y1="150" x2="310" y2="150" stroke="#1b2430" stroke-width="4.5"/><circle cx="110" cy="150" r="6" fill="#2c6bed"/><circle cx="310" cy="150" r="6" fill="#e25b45"/><text x="110" y="176" text-anchor="middle" font-weight="800">A</text><text x="310" y="176" text-anchor="middle" font-weight="800">B</text>';
        const circles = '<circle class="pl-draw" pathLength="1" cx="110" cy="150" r="100" fill="none" stroke="#2c6bed" stroke-width="2.5" stroke-dasharray="6 4"/><circle class="pl-draw" pathLength="1" style="--d:.25s" cx="310" cy="150" r="100" fill="none" stroke="#e25b45" stroke-width="2.5" stroke-dasharray="6 4"/>';
        const top = '<circle class="pl-pop" style="--d:.45s" cx="210" cy="63" r="6.5" fill="#1c8c74"/><text x="210" y="45" text-anchor="middle" font-weight="800" fill="#1c8c74">C</text>';
        const tri = '<polygon class="pl-pop" points="110,150 310,150 210,63" fill="#1c8c7428" stroke="#1c8c74" stroke-width="3.5"/><text x="145" y="102" font-size="13" font-weight="800" fill="#1c8c74">r</text><text x="275" y="102" font-size="13" font-weight="800" fill="#1c8c74">r</text><text x="210" y="170" text-anchor="middle" font-size="13" font-weight="800" fill="#1b2430">r</text>';
        const say = [
          "Önce A ve B seçilir, taban çizilir. Bu uzunluk pergelin açıklığı olacaktır.",
          "A ve B merkezli eş çemberler çizilir. Yarıçap, taban uzunluğuna eşittir. Çemberler C’de kesişir.",
          "C, A ve B’ye aynı uzaklıktadır. Üç kenar da eşit olur: üçgen eşkenardır. Her açı 60°dir."
        ];
        const body = v.step === "0" ? base : v.step === "1" ? circles + base + top : tri + circles + base + top;
        return svg(body, say[Number(v.step)], 230) + `<p class="im-caption">${say[Number(v.step)]}</p>`;
      }
    },
    "im-compare5": {
      instruction: "İki doğal sayıyı yaz. İlk fark hangi basamakta?",
      controls: [
        { type: "number", key: "a", label: "A sayısı", min: 0, max: 999999, value: 4205 },
        { type: "number", key: "b", label: "B sayısı", min: 0, max: 999999, value: 4250 }
      ],
      demo: [{ a: 4205, b: 4250 }, { a: 999, b: 1000 }, { a: 446803, b: 420000 }],
      render(v) {
        const a = v.a, b = v.b;
        const sa = String(a), sb = String(b);
        let why = "Bütün basamaklar eşit.";
        let rel = "=";
        let diff = -1;
        let place = "";
        if (sa.length !== sb.length) {
          rel = sa.length > sb.length ? ">" : "<";
          why = "Basamak sayısı fazla olan daha büyüktür. Soldaki rakamlara geçmeden karar verilir.";
        } else {
          for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) { rel = sa[i] > sb[i] ? ">" : "<"; diff = i; break; }
          if (diff >= 0) {
            place = ["birler", "onlar", "yüzler", "binler", "on binler", "yüz binler"][sa.length - 1 - diff] || "soldaki basamak";
            why = `${place} basamağında ${sa[diff]} ve ${sb[diff]} farklı. İlk fark buradadır; sağına bakılmaz.`;
          }
        }
        const word = rel === ">" ? "büyüktür" : rel === "<" ? "küçüktür" : "eşittir";
        const boxes = (s, other) => s.split("").map((ch, i) => `<span class="${s.length === other.length && i === diff ? "diff" : ""}">${ch}</span>`).join("");
        const badge = svg(`<rect x="25" y="18" width="145" height="62" rx="12" fill="${rel === ">" ? "#dff3ec" : "#eef3f8"}" stroke="${rel === ">" ? "#1c8c74" : "#2c6bed"}" stroke-width="2.5"/>
          <text x="97" y="42" text-anchor="middle" font-size="13" font-weight="700" fill="#526079">A (${sa.length} basamak)</text>
          <text x="97" y="66" text-anchor="middle" font-size="20" font-weight="800" fill="#1b2430">${group(a)}</text>
          <circle class="pl-pop" cx="210" cy="49" r="24" fill="#fff4cf" stroke="#d89a12" stroke-width="3"/>
          <text x="210" y="58" text-anchor="middle" font-size="28" font-weight="800" fill="#d89a12">${rel}</text>
          <rect x="250" y="18" width="145" height="62" rx="12" fill="${rel === "<" ? "#dff3ec" : "#eef3f8"}" stroke="${rel === "<" ? "#1c8c74" : "#2c6bed"}" stroke-width="2.5"/>
          <text x="322" y="42" text-anchor="middle" font-size="13" font-weight="700" fill="#526079">B (${sb.length} basamak)</text>
          <text x="322" y="66" text-anchor="middle" font-size="20" font-weight="800" fill="#1b2430">${group(b)}</text>`, "Sayı karşılaştırma", 96);
        return badge + `<div class="im-digits" aria-label="A ${group(a)}"><b>A</b>${boxes(sa, sb)}</div><div class="im-digits" aria-label="B ${group(b)}"><b>B</b>${boxes(sb, sa)}</div><p class="im-caption">${group(a)} ${word} ${group(b)}. ${why}</p>`;
      }
    },
    "im-add": {
      instruction: "Toplananları değiştir. Birler 9’u geçerse elde oluşur.",
      controls: [
        { type: "range", key: "a", label: "Birinci toplanan", min: 0, max: 99, value: 28 },
        { type: "range", key: "b", label: "İkinci toplanan", min: 0, max: 99, value: 17 }
      ],
      demo: [{ a: 28, b: 17 }, { a: 34, b: 12 }, { a: 47, b: 36 }],
      render(v) {
        const oa = v.a % 10, ob = v.b % 10, ta = Math.floor(v.a / 10), tb = Math.floor(v.b / 10);
        const ones = oa + ob;
        const carry = ones >= 10 ? 1 : 0;
        const tens = ta + tb + carry;
        let rods = "";
        for (let i = 0; i < ta + tb; i++) {
          const x = 22 + i * 12;
          rods += `<rect class="pl-pop" x="${x}" y="48" width="9" height="72" rx="2" fill="${i < ta ? "#2c6bed" : "#e25b45"}"/>`;
        }
        if (carry) rods += `<rect class="pl-pop" style="--d:.35s" x="${22 + (ta + tb) * 12 + 4}" y="48" width="10" height="72" rx="2" fill="#d89a12" stroke="#8a5212" stroke-width="1.5"/>`;
        let cubes = "";
        for (let i = 0; i < ones; i++) {
          const x = 265 + (i % 5) * 18, y = 52 + Math.floor(i / 5) * 18;
          const inCarry = carry && i < 10;
          cubes += `<rect class="pl-pop" x="${x}" y="${y}" width="14" height="14" rx="3" fill="${inCarry ? "#d89a12" : (i < oa ? "#2c6bed" : "#e25b45")}"/>`;
        }
        if (carry) cubes += `<rect x="261" y="48" width="94" height="38" rx="6" fill="none" stroke="#d89a12" stroke-width="2.5" stroke-dasharray="5 3"/><text x="308" y="138" text-anchor="middle" font-size="12" font-weight="800" fill="#d89a12">10 birlik = +1 elde onluk</text>`;
        const scene = svg(`<rect x="12" y="16" width="235" height="132" rx="12" fill="#f7f9fc" stroke="#dce5db"/>
          <text x="130" y="36" text-anchor="middle" font-size="14" font-weight="800" fill="#1b2430">Onluklar: ${ta} + ${tb}${carry ? " + 1 elde" : ""} = ${tens}</text>
          ${rods}
          <rect x="255" y="16" width="153" height="132" rx="12" fill="#fffaf0" stroke="#e9d8a6"/>
          <text x="331" y="36" text-anchor="middle" font-size="14" font-weight="800" fill="#1b2430">Birlikler: ${oa} + ${ob} = ${ones}</text>
          ${cubes}
          <text x="210" y="176" text-anchor="middle" font-size="20" font-weight="800" fill="#1c8c74">${v.a} + ${v.b} = ${v.a + v.b}</text>`, `${v.a} artı ${v.b}`, 190);
        return scene + `<p class="im-caption">${v.a} + ${v.b}. Birler: ${oa} + ${ob} = ${ones}.${carry ? ` ${ones} birlik = 1 onluk + ${ones - 10} birlik.` : " Elde yok."} Onlar: ${ta} + ${tb}${carry ? " + 1 elde" : ""} = ${tens}. Sonuç: ${v.a + v.b}.</p>`;
      }
    },
    "im-mul": {
      instruction: "Sıra sayısını ve bir sıradaki kare sayısını değiştir.",
      controls: [
        { type: "range", key: "rows", label: "Sıra sayısı", min: 1, max: 8, value: 3 },
        { type: "range", key: "cols", label: "Bir sıradaki kare", min: 1, max: 8, value: 4 }
      ],
      demo: [{ rows: 3, cols: 4 }, { rows: 4, cols: 3 }, { rows: 5, cols: 6 }],
      render(v) {
        let cells = "";
        const x0 = 210 - (v.cols * 28) / 2;
        for (let r = 0; r < v.rows; r++) for (let c = 0; c < v.cols; c++) {
          cells += `<rect class="pl-pop" style="--d:${((r * v.cols + c) * 0.02).toFixed(2)}s" x="${x0 + c * 28}" y="${32 + r * 26}" width="23" height="23" rx="4" fill="${(r + c) % 2 ? "#1c8c74" : "#2c6bed"}"/>`;
        }
        const product = v.rows * v.cols;
        cells += `<text x="210" y="22" text-anchor="middle" font-size="15" font-weight="800" fill="#1b2430">${v.rows} sıra × ${v.cols} kare = ${product} birim kare</text>`;
        return svg(cells, `${v.rows} sıra, her sırada ${v.cols} kare`, 40 + v.rows * 26 + 16) +
          `<p class="im-caption">${v.rows} × ${v.cols} = ${product}. ${v.cols} × ${v.rows} = ${product}. Sıra ile sütunun yerini değiştirmek kare sayısını değiştirmez. ${product} kareyi ${v.rows} eş sıraya ayırırsak her sırada ${v.cols} kare kalır.</p>`;
      }
    },
    "im-shop": {
      instruction: "Defter sayısını, fiyatı ve cüzdanı değiştir. Kalan parayı izle.",
      controls: [
        { type: "range", key: "n", label: "Defter sayısı", min: 1, max: 8, value: 3 },
        { type: "range", key: "price", label: "Tanesi (TL)", min: 5, max: 40, step: 5, value: 20 },
        { type: "range", key: "money", label: "Cüzdan (TL)", min: 20, max: 200, step: 10, value: 100 }
      ],
      demo: [{ n: 3, price: 20, money: 100 }, { n: 5, price: 15, money: 100 }, { n: 8, price: 40, money: 200 }],
      render(v) {
        const cost = v.n * v.price;
        const left = v.money - cost;
        const maxVal = Math.max(v.money, cost, 1);
        const wMoney = Math.round(320 * v.money / maxVal);
        const wCost = Math.round(320 * Math.min(cost, v.money) / maxVal);
        const wRest = Math.round(320 * Math.abs(left) / maxVal);
        let books = "";
        for (let i = 0; i < v.n; i++) {
          const bx = 35 + i * 44;
          books += `<g class="pl-pop" style="--d:${(i * 0.06).toFixed(2)}s"><rect x="${bx}" y="18" width="36" height="44" rx="5" fill="#2c6bed" stroke="#1b2430" stroke-width="1.5"/><rect x="${bx + 5}" y="24" width="26" height="12" rx="2" fill="#fff"/><text x="${bx + 18}" y="53" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">${v.price}₺</text></g>`;
        }
        const bar = left >= 0
          ? `<rect x="45" y="122" width="${wCost}" height="26" rx="5" fill="#e25b45"/><rect x="${45 + wCost}" y="122" width="${wRest}" height="26" rx="5" fill="#1c8c74"/>
             <text x="210" y="168" text-anchor="middle" font-size="15" font-weight="800" fill="#1c8c74">Harcanan: ${group(cost)} TL · Kalan: ${group(left)} TL ✓</text>`
          : `<rect x="45" y="122" width="${wMoney}" height="26" rx="5" fill="#e25b45"/><rect x="${45 + wMoney}" y="122" width="${wRest}" height="26" rx="5" fill="#fdecea" stroke="#e25b45" stroke-width="2" stroke-dasharray="5 3"/>
             <text x="210" y="168" text-anchor="middle" font-size="15" font-weight="800" fill="#e25b45">Tutar: ${group(cost)} TL · ${group(-left)} TL eksik! (En fazla ${Math.floor(v.money / v.price)} adet)</text>`;
        const scene = svg(`${books}
          <rect x="45" y="84" width="${wMoney}" height="26" rx="5" fill="#d89a12"/>
          <text x="52" y="102" font-size="13" font-weight="800" fill="#fff">Cüzdan: ${group(v.money)} TL</text>
          ${bar}`, "Alışveriş bar modeli", 182);
        const say = left < 0
          ? `Ödeme ${group(cost)} TL olur. ${group(v.money)} TL yetmez. En fazla ${Math.floor(v.money / v.price)} defter alınır.`
          : `${v.n} × ${v.price} = ${group(cost)} TL ödenir. Kalan ${group(left)} TL.`;
        return scene + `<p class="im-caption">${say}</p>`;
      }
    },
    "im-frac": {
      instruction: "Payı, paydayı ve çarpanı değiştir. Değer ne zaman aynı kalır?",
      controls: [
        { type: "range", key: "n", label: "Pay", min: -24, max: 24, value: -15 },
        { type: "range", key: "d", label: "Payda", min: 1, max: 24, value: 20 },
        { type: "range", key: "k", label: "Çarpan", min: 1, max: 6, value: 1 }
      ],
      demo: [{ n: -15, d: 20, k: 1 }, { n: 3, d: 4, k: 3 }, { n: -2, d: 5, k: 2 }],
      render(v) {
        const s = simplify(v.n, v.d);
        const ratio = Math.min(1, Math.abs(v.n) / v.d);
        const fillW = Math.round(280 * ratio);
        const color = v.n < 0 ? "#e25b45" : "#2c6bed";
        let ticks1 = "", ticks2 = "";
        for (let i = 1; i < v.d; i++) ticks1 += `<line x1="${(95 + i * 280 / v.d).toFixed(1)}" y1="28" x2="${(95 + i * 280 / v.d).toFixed(1)}" y2="62" stroke="#fff" stroke-width="1.5"/>`;
        const dk = Math.min(48, v.d * v.k);
        for (let i = 1; i < dk; i++) ticks2 += `<line x1="${(95 + i * 280 / dk).toFixed(1)}" y1="86" x2="${(95 + i * 280 / dk).toFixed(1)}" y2="120" stroke="#fff" stroke-width="1"/>`;
        const scene = svg(`<text x="84" y="50" text-anchor="end" font-size="14" font-weight="800" fill="${color}">${num(v.n)}/${v.d}</text>
          <rect x="95" y="28" width="280" height="34" rx="6" fill="#eef3f8" stroke="#7c8ba1" stroke-width="2"/>
          <rect class="pl-pop" x="95" y="28" width="${fillW}" height="34" rx="6" fill="${color}" opacity=".85"/>${ticks1}
          <text x="84" y="108" text-anchor="end" font-size="14" font-weight="800" fill="#1c8c74">×${v.k} eş</text>
          <rect x="95" y="86" width="280" height="34" rx="6" fill="#eef3f8" stroke="#7c8ba1" stroke-width="2"/>
          <rect class="pl-pop" x="95" y="86" width="${fillW}" height="34" rx="6" fill="#1c8c74" opacity=".85"/>${ticks2}
          <text x="235" y="148" text-anchor="middle" font-size="14" font-weight="800" fill="#1b2430">${v.n < 0 ? "Negatif kesir (0’ın solunda)" : v.n === 0 ? "Sıfır kesir (0)" : "Pozitif kesir (0’ın sağında)"} · Boyalı oran değişmez!</text>`, "Eş kesir şeritleri", 162);
        return `<p class="im-line">${frac(v.n, v.d)} = ${frac(v.n * v.k, v.d * v.k)} = ${frac(s.n, s.d)}</p>` + scene +
          `<p class="im-caption">${v.k === 1 ? "Çarpan 1 iken kesir olduğu gibi durur. Çarpanı büyüt; eş kesri gör." : "Pay ve paydayı " + v.k + " ile çarpmak kesrin değerini değiştirmez."} Sade biçim ${s.n < 0 ? "−" : ""}${Math.abs(s.n)}/${s.d}. ${v.n === 0 ? "Pay 0 ise kesir 0’dır. " : ""}Payda 0 olamaz.</p>`;
      }
    },
    "im-abs": {
      instruction: "İki noktayı sayı doğrusunda gezdir. Uzaklığın işareti yoktur.",
      controls: [
        { type: "range", key: "a", label: "A noktası", min: -12, max: 12, value: -5 },
        { type: "range", key: "b", label: "B noktası", min: -12, max: 12, value: 8 }
      ],
      demo: [{ a: -5, b: 8 }, { a: -9, b: 9 }, { a: -8, b: -2 }],
      render(v) {
        const x = (n) => 210 + n * 14;
        const dist = Math.abs(v.b - v.a);
        const by = Math.abs(v.b - v.a) < 3 ? 38 : 54;
        return svg(`<line x1="30" y1="115" x2="390" y2="115" stroke="#1b2430" stroke-width="2.5"/>${[-12, -6, 0, 6, 12].map((n) => `<line x1="${x(n)}" y1="109" x2="${x(n)}" y2="121" stroke="#1b2430" stroke-width="2"/><text x="${x(n)}" y="145" text-anchor="middle" font-size="13" font-weight="700">${num(n)}</text>`).join("")}
          <line class="pl-draw" pathLength="1" x1="${x(v.a)}" y1="68" x2="${x(v.b)}" y2="68" stroke="#1c8c74" stroke-width="5" stroke-linecap="round"/>
          <line x1="${x(v.a)}" y1="68" x2="${x(v.a)}" y2="115" stroke="#e25b45" stroke-dasharray="4 3"/><line x1="${x(v.b)}" y1="68" x2="${x(v.b)}" y2="115" stroke="#2c6bed" stroke-dasharray="4 3"/>
          <circle class="pl-pop" cx="${x(v.a)}" cy="115" r="7" fill="#e25b45"/><circle class="pl-pop" cx="${x(v.b)}" cy="115" r="7" fill="#2c6bed"/>
          <text x="${x(v.a)}" y="54" text-anchor="middle" font-weight="800" fill="#e25b45">A (${num(v.a)})</text><text x="${x(v.b)}" y="${by}" text-anchor="middle" font-weight="800" fill="#2c6bed">B (${num(v.b)})</text>
          <text x="${(x(v.a) + x(v.b)) / 2}" y="22" text-anchor="middle" font-size="16" font-weight="800" fill="#1c8c74">|${num(v.b)} − (${num(v.a)})| = ${dist} birim</text>`, "Sayı doğrusunda iki nokta") +
          `<p class="im-caption">|A| = ${Math.abs(v.a)}. |B| = ${Math.abs(v.b)}. A ile B arasındaki uzaklık ${dist} birimdir. Çıkarmanın sırası uzaklığı değiştirmez.</p>`;
      }
    },
    "im-decimal": {
      instruction: "Kesri değiştir. Ondalık gösterim sonlanıyor mu, devrediyor mu?",
      controls: [
        { type: "range", key: "n", label: "Pay", min: -12, max: 12, value: 2 },
        { type: "range", key: "d", label: "Payda", min: 1, max: 12, value: 3 }
      ],
      demo: [{ n: 1, d: 4 }, { n: 2, d: 3 }, { n: -3, d: 4 }, { n: 5, d: 6 }],
      render(v) {
        const s = simplify(v.n, v.d);
        const finite = finiteDen(s.d);
        const shown = decimalOf(v.n, v.d);
        const pct = Math.min(100, Math.round(Math.abs(v.n) / v.d * 100));
        let cells = "";
        for (let i = 0; i < 100; i++) {
          const r = Math.floor(i / 10), c = i % 10;
          cells += `<rect x="${28 + c * 13}" y="${22 + r * 13}" width="11" height="11" rx="2" fill="${i < pct ? (finite ? "#1c8c74" : "#d89a12") : "#eef3f8"}"/>`;
        }
        const badgeColor = finite ? "#1c8c74" : "#d89a12";
        const scene = svg(`${cells}
          <rect x="175" y="24" width="225" height="124" rx="14" fill="#fffdf7" stroke="${badgeColor}" stroke-width="2.5"/>
          <text x="287" y="52" text-anchor="middle" font-size="14" font-weight="800" fill="#526079">Sade kesir: ${s.n < 0 ? "−" : ""}${Math.abs(s.n)}/${s.d}</text>
          <text x="287" y="86" text-anchor="middle" font-size="24" font-weight="800" fill="${badgeColor}">${shown}</text>
          <text x="287" y="116" text-anchor="middle" font-size="13" font-weight="800" fill="${badgeColor}">${finite ? "✓ Sonlu ondalık (Payda: 2 ve 5)" : "↻ Devirli ondalık (Basamaklar tekrarlar)"}</text>
          <text x="287" y="138" text-anchor="middle" font-size="12" fill="#526079">${Math.abs(v.n)} ÷ ${v.d} bölme işlemi</text>`, "Yüzlük kart ve ondalık dönüşüm", 168);
        return `<p class="im-line">${frac(v.n, v.d)} = ${shown}</p>` + scene + `<p class="im-caption">${finite ? "Sade payda yalnız 2 ve 5 asal çarpanlarından oluşur. Ondalık gösterim sonludur." : "Sade paydada 2 ve 5 dışında asal çarpan vardır. Gösterim devirlidir; üç nokta basamakların sürdüğünü söyler."} Sade kesir ${s.n < 0 ? "−" : ""}${Math.abs(s.n)}/${s.d}.</p>`;
      }
    },
    "im-fracadd": {
      instruction: "İki kesri topla. Paydalar eşitlenmeden paylar toplanmaz.",
      controls: [
        { type: "range", key: "a", label: "Birinci pay", min: -8, max: 8, value: -1 },
        { type: "range", key: "b", label: "Birinci payda", min: 1, max: 12, value: 3 },
        { type: "range", key: "c", label: "İkinci pay", min: -8, max: 8, value: 3 },
        { type: "range", key: "d", label: "İkinci payda", min: 1, max: 12, value: 4 }
      ],
      demo: [{ a: -1, b: 3, c: 3, d: 4 }, { a: 1, b: 2, c: 1, d: 3 }, { a: 2, b: 5, c: 3, d: 10 }],
      render(v) {
        const p = lcm(v.b, v.d);
        const left = v.a * (p / v.b);
        const right = v.c * (p / v.d);
        const sum = left + right;
        const s = simplify(sum, p);
        const bar = (numVal, denVal, y, col, label) => {
          const w = Math.min(260, Math.round(260 * Math.abs(numVal) / denVal));
          const stepCount = Math.min(24, denVal);
          let lines = "";
          for (let i = 1; i < stepCount; i++) lines += `<line x1="${(120 + i * 260 / stepCount).toFixed(1)}" y1="${y}" x2="${(120 + i * 260 / stepCount).toFixed(1)}" y2="${y + 26}" stroke="#fff" stroke-width="1"/>`;
          return `<text x="110" y="${y + 18}" text-anchor="end" font-size="13" font-weight="800" fill="${col}">${label}</text><rect x="120" y="${y}" width="260" height="26" rx="5" fill="#eef3f8" stroke="#7c8ba1"/><rect class="pl-pop" x="120" y="${y}" width="${w}" height="26" rx="5" fill="${col}" opacity=".85"/>${lines}`;
        };
        const scene = svg(
          bar(left, p, 18, "#2c6bed", `${num(left)}/${p}`) +
          bar(right, p, 58, "#d89a12", `${num(right)}/${p}`) +
          bar(sum, p, 98, "#1c8c74", `Toplam: ${num(sum)}/${p}`) +
          `<text x="250" y="148" text-anchor="middle" font-size="13" font-weight="800" fill="#1b2430">Ortak payda = EKOK(${v.b}, ${v.d}) = ${p}</text>`,
          "Ortak paydada kesir toplama", 168
        );
        return `<p class="im-line">${frac(v.a, v.b)} + ${frac(v.c, v.d)} = ${frac(left, p)} + ${frac(right, p)} = ${frac(s.n, s.d)}</p>` + scene +
          `<p class="im-caption">Ortak payda ${p}. Paylar ${num(left)} ve ${num(right)}. Paydalar toplanmaz. Sonuç ${s.n < 0 ? "−" : ""}${Math.abs(s.n)}/${s.d}.</p>`;
      }
    },
    "im-order": {
      instruction: "a, b ve c sayılarını değiştir. Çarpma, toplamadan önce gelir.",
      controls: [
        { type: "range", key: "a", label: "a", min: 0, max: 12, value: 2 },
        { type: "range", key: "b", label: "b", min: 0, max: 12, value: 3 },
        { type: "range", key: "c", label: "c", min: 0, max: 12, value: 4 }
      ],
      demo: [{ a: 2, b: 3, c: 4 }, { a: 5, b: 2, c: 6 }, { a: 10, b: 4, c: 3 }],
      render(v) {
        const prod = v.b * v.c;
        const wrong = (v.a + v.b) * v.c;
        const right = v.a + prod;
        const same = wrong === right;
        const scene = svg(`<rect x="18" y="16" width="185" height="148" rx="12" fill="#e3f5ee" stroke="#1c8c74" stroke-width="2.5"/>
          <text x="110" y="36" text-anchor="middle" font-size="14" font-weight="800" fill="#14684f">✓ Doğru: Önce Çarpma</text>
          <text x="50" y="68" text-anchor="middle" font-size="18" font-weight="800">${v.a}</text>
          <text x="78" y="68" text-anchor="middle" font-size="16" font-weight="800">+</text>
          <rect x="95" y="48" width="90" height="28" rx="6" fill="#fff" stroke="#1c8c74" stroke-width="2"/>
          <text x="140" y="68" text-anchor="middle" font-size="17" font-weight="800" fill="#1c8c74">${v.b} × ${v.c}</text>
          <line x1="140" y1="76" x2="140" y2="96" stroke="#1c8c74" stroke-width="2.5"/>
          <text x="110" y="114" text-anchor="middle" font-size="17" font-weight="800" fill="#1b2430">${v.a} + ${prod}</text>
          <text x="110" y="148" text-anchor="middle" font-size="22" font-weight="800" fill="#1c8c74">= ${right}</text>
          <rect x="217" y="16" width="185" height="148" rx="12" fill="#fdecea" stroke="#e25b45" stroke-width="2"/>
          <text x="310" y="36" text-anchor="middle" font-size="14" font-weight="800" fill="#a33a28">${same ? "= Aynı sonuç" : "✗ Hatalı: Soldan sağa"}</text>
          <text x="310" y="76" text-anchor="middle" font-size="16" font-weight="700" fill="#a33a28">(${v.a} + ${v.b}) × ${v.c}</text>
          <text x="310" y="112" text-anchor="middle" font-size="16" font-weight="700" fill="#a33a28">${v.a + v.b} × ${v.c}</text>
          <text x="310" y="148" text-anchor="middle" font-size="22" font-weight="800" fill="#e25b45">= ${wrong}</text>`, "İşlem önceliği ağacı", 178);
        return `<p class="im-line">Soldan: (${v.a} + ${v.b}) × ${v.c} = ${wrong}</p><p class="im-line">Doğru: ${v.a} + (${v.b} × ${v.c}) = ${right}</p>` + scene +
          `<p class="im-caption">${same ? "Bu sayılarda iki yol aynı sonucu verdi. b veya c sıfır değilken ve a sıfır değilken yeniden dene." : "Önce çarpma yapılır: " + v.b + " × " + v.c + " = " + prod + ". Sonra " + v.a + " eklenir. Doğru sonuç " + right + ". Soldan yapılırsa " + wrong + " bulunur."}</p>`;
      }
    },
    "im-views": {
      instruction: "Dört kulenin yüksekliğini değiştir. Önden bakınca arkadaki kısa kule gizlenebilir.",
      controls: [
        { type: "range", key: "fs", label: "Ön sol", min: 0, max: 4, value: 1 },
        { type: "range", key: "fd", label: "Ön sağ", min: 0, max: 4, value: 3 },
        { type: "range", key: "bs", label: "Arka sol", min: 0, max: 4, value: 2 },
        { type: "range", key: "bd", label: "Arka sağ", min: 0, max: 4, value: 1 }
      ],
      demo: [{ fs: 1, fd: 3, bs: 2, bd: 1 }, { fs: 3, fd: 1, bs: 4, bd: 2 }, { fs: 2, fd: 4, bs: 1, bd: 3 }],
      render(v) {
        const cells = [v.bs, v.bd, v.fs, v.fd];
        const frontL = Math.max(v.fs, v.bs), frontR = Math.max(v.fd, v.bd);
        const sideF = Math.max(v.fs, v.fd), sideB = Math.max(v.bs, v.bd);
        const total = v.fs + v.fd + v.bs + v.bd;
        const full = cells.filter((n) => n > 0).length;
        const grid = ["Arka sol " + v.bs, "Arka sağ " + v.bd, "Ön sol " + v.fs, "Ön sağ " + v.fd].map((t) => `<span>${t}</span>`).join("");
        const drawCube = (cx, cy, col) => `<polygon points="${cx},${cy - 12} ${cx + 20},${cy - 22} ${cx + 40},${cy - 12} ${cx + 20},${cy - 2}" fill="${col}" stroke="#1b2430" stroke-width="1.2"/><polygon points="${cx},${cy - 12} ${cx + 20},${cy - 2} ${cx + 20},${cy + 16} ${cx},${cy + 6}" fill="${col}" opacity=".85" stroke="#1b2430" stroke-width="1.2"/><polygon points="${cx + 20},${cy - 2} ${cx + 40},${cy - 12} ${cx + 40},${cy + 6} ${cx + 20},${cy + 16}" fill="${col}" opacity=".68" stroke="#1b2430" stroke-width="1.2"/>`;
        let towers = "";
        [[55, 130, v.bs, "#7d55c7"], [95, 142, v.bd, "#d89a12"], [35, 152, v.fs, "#2c6bed"], [75, 164, v.fd, "#1c8c74"]].forEach(([bx, by, h, col]) => {
          for (let k = 0; k < h; k++) towers += drawCube(bx, by - k * 18, col);
        });
        const sil = (ox, oy, h1, h2, title, col) => {
          let s = `<text x="${ox + 22}" y="${oy + 18}" text-anchor="middle" font-size="12" font-weight="800" fill="#1b2430">${title}</text>`;
          for (let k = 0; k < h1; k++) s += `<rect class="pl-pop" x="${ox}" y="${oy - 20 - k * 20}" width="20" height="19" rx="2" fill="${col}" stroke="#fff"/>`;
          for (let k = 0; k < h2; k++) s += `<rect class="pl-pop" x="${ox + 22}" y="${oy - 20 - k * 20}" width="20" height="19" rx="2" fill="${col}" stroke="#fff"/>`;
          s += `<line x1="${ox - 4}" y1="${oy + 1}" x2="${ox + 46}" y2="${oy + 1}" stroke="#1b2430" stroke-width="2"/>`;
          return s;
        };
        const topGrid = `<text x="366" y="168" text-anchor="middle" font-size="12" font-weight="800">Üst (${full} dolu)</text>` +
          [[0, 0, v.bs], [1, 0, v.bd], [0, 1, v.fs], [1, 1, v.fd]].map(([c, r, val]) => `<rect x="${344 + c * 22}" y="${102 + r * 22}" width="20" height="20" rx="3" fill="${val ? "#e25b45" : "#eef3f8"}" stroke="#1b2430"/><text x="${354 + c * 22}" y="${117 + r * 22}" text-anchor="middle" font-size="11" font-weight="800" fill="${val ? "#fff" : "#9aa5af"}">${val}</text>`).join("");
        const scene = svg(`${towers}<text x="75" y="192" text-anchor="middle" font-size="12" font-weight="800">3B Yığın (${total} küp)</text>` +
          sil(185, 150, frontL, frontR, `Ön (${frontL}, ${frontR})`, "#2c6bed") +
          sil(265, 150, sideF, sideB, `Sağ (${sideF}, ${sideB})`, "#1c8c74") + topGrid, "3B küp yığını ve görünümleri", 202);
        return scene + `<div class="im-grid" aria-label="Küp yığını">${grid}</div><p class="im-caption">Ön görünüm: ${frontL} ve ${frontR}. Sağdan, ön sıranın yüksekliği ${sideF}; arka sıranın yüksekliği ${sideB}. Üstten ${full} hücre dolu. Toplam küp: ${total}. Görünen yükseklikler toplanmaz; her sütunun en uzunu silueti belirler.</p>`;
      }
    },
    "im-layers": {
      instruction: "Sırayı, sıra sayısını ve katı değiştir. Hacim üçünün çarpımıdır.",
      controls: [
        { type: "range", key: "a", label: "Bir sıradaki küp", min: 1, max: 8, value: 6 },
        { type: "range", key: "b", label: "Sıra sayısı", min: 1, max: 6, value: 3 },
        { type: "range", key: "c", label: "Kat sayısı", min: 1, max: 6, value: 4 }
      ],
      demo: [{ a: 6, b: 3, c: 1 }, { a: 6, b: 3, c: 2 }, { a: 6, b: 3, c: 4 }],
      render(v) {
        const layer = v.a * v.b;
        const total = layer * v.c;
        const cols = ["#2c6bed", "#1c8c74", "#d89a12", "#e25b45", "#7d55c7", "#2088a8"];
        const u = Math.min(18, 160 / (v.a + v.b));
        let cubes = "";
        for (let z = 0; z < v.c; z++) {
          const col = cols[z % cols.length];
          for (let r = 0; r < v.b; r++) for (let c = 0; c < v.a; c++) {
            const cx = 140 + (c - r * 0.65) * u * 1.3;
            const cy = 152 + (c * 0.35 + r * 0.6) * u - z * u * 1.15;
            cubes += `<polygon class="pl-pop" style="--d:${(z * 0.15).toFixed(2)}s" points="${cx.toFixed(1)},${(cy - u).toFixed(1)} ${(cx + u).toFixed(1)},${(cy - u * 1.45).toFixed(1)} ${(cx + u * 2).toFixed(1)},${(cy - u).toFixed(1)} ${(cx + u).toFixed(1)},${(cy - u * 0.55).toFixed(1)}" fill="${col}" stroke="#1b2430" stroke-width="0.9"/>
              <polygon points="${cx.toFixed(1)},${(cy - u).toFixed(1)} ${(cx + u).toFixed(1)},${(cy - u * 0.55).toFixed(1)} ${(cx + u).toFixed(1)},${(cy + u * 0.45).toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)}" fill="${col}" opacity=".85" stroke="#1b2430" stroke-width="0.9"/>
              <polygon points="${(cx + u).toFixed(1)},${(cy - u * 0.55).toFixed(1)} ${(cx + u * 2).toFixed(1)},${(cy - u).toFixed(1)} ${(cx + u * 2).toFixed(1)},${cy.toFixed(1)} ${(cx + u).toFixed(1)},${(cy + u * 0.45).toFixed(1)}" fill="${col}" opacity=".68" stroke="#1b2430" stroke-width="0.9"/>`;
          }
        }
        const scene = svg(`${cubes}
          <rect x="275" y="28" width="132" height="128" rx="12" fill="#fffdf7" stroke="#dce5db" stroke-width="2"/>
          <text x="341" y="54" text-anchor="middle" font-size="13" font-weight="800" fill="#2c6bed">1 kat: ${v.a} × ${v.b} = ${layer}</text>
          <text x="341" y="84" text-anchor="middle" font-size="13" font-weight="800" fill="#1c8c74">Kat sayısı: × ${v.c}</text>
          <line x1="292" y1="98" x2="390" y2="98" stroke="#dce5db" stroke-width="2"/>
          <text x="341" y="132" text-anchor="middle" font-size="20" font-weight="800" fill="#e25b45">${total} küp</text>`, "Katmanlı birim küpler", 190);
        return scene + `<p class="im-caption">Bir katta ${v.a} × ${v.b} = ${layer} küp vardır. ${v.c} katta ${layer} × ${v.c} = ${total} birim küp. ${v.a} × ${v.b} × ${v.c} = ${total}.</p>`;
      }
    },
    "im-units": {
      instruction: "Mililitreyi gezdir. Litre ve küp birimler aynı miktarı başka adla söyler.",
      controls: [{ type: "range", key: "ml", label: "Mililitre", min: 0, max: 5000, step: 50, value: 2400 }],
      demo: [{ ml: 1000 }, { ml: 2400 }, { ml: 5000 }],
      render(v) {
        const liters = v.ml / 1000;
        const h = Math.round(130 * v.ml / 5000);
        let ticks = "";
        for (let i = 1; i <= 5; i++) {
          const y = 160 - i * 26;
          ticks += `<line x1="125" y1="${y}" x2="140" y2="${y}" stroke="#1b2430" stroke-width="2"/><text x="150" y="${y + 4}" font-size="11" font-weight="700">${i} L (${i * 1000} mL)</text>`;
        }
        const scene = svg(`<rect x="50" y="26" width="82" height="134" rx="6" fill="#eef3f8" stroke="#1b2430" stroke-width="3"/>
          <rect x="53" y="${160 - h}" width="76" height="${h}" rx="4" fill="#3b82f6" opacity=".82"/>
          ${ticks}
          <rect x="235" y="28" width="168" height="130" rx="14" fill="#fffdf7" stroke="#d89a12" stroke-width="2.5"/>
          <text x="319" y="56" text-anchor="middle" font-size="16" font-weight="800" fill="#2c6bed">${group(v.ml)} mL = ${group(v.ml)} cm³</text>
          <text x="319" y="94" text-anchor="middle" font-size="20" font-weight="800" fill="#1c8c74">${num(liters)} L = ${num(liters)} dm³</text>
          <text x="319" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="#526079">1 L = 1 dm³ = 1 000 cm³</text>`, "Dereceli silindir ve birim dönüşümü", 180);
        return scene + `<p class="im-caption">${group(v.ml)} mL = ${num(liters)} L = ${num(liters)} dm³ = ${group(v.ml)} cm³. 1 mL, 1 cm³ ile aynı miktardır. 1 L, 1 dm³ ile aynı miktardır.</p>`;
      }
    },
    "im-tank": {
      instruction: "Kabın hacmini ve dolu kesri değiştir. Boş kalan yeri de gör.",
      controls: [
        { type: "range", key: "cap", label: "Kapasite (L)", min: 12, max: 48, step: 12, value: 24 },
        { type: "range", key: "parts", label: "Eş parça sayısı", min: 2, max: 8, value: 4 },
        { type: "range", key: "filled", label: "Dolu parça", min: 0, max: 8, value: 3 }
      ],
      adjust(v) { if (v.filled > v.parts) v.filled = v.parts; },
      demo: [{ cap: 24, parts: 4, filled: 3 }, { cap: 36, parts: 6, filled: 4 }, { cap: 48, parts: 8, filled: 5 }],
      render(v) {
        const amount = v.cap * v.filled / v.parts;
        const empty = v.cap - amount;
        const h = 132, w = 180, x = 90, y = 30;
        const fh = v.parts ? h * v.filled / v.parts : 0;
        let marks = "";
        for (let i = 1; i < v.parts; i++) {
          const ly = y + h - i * h / v.parts;
          marks += `<line x1="${x}" y1="${ly.toFixed(1)}" x2="${x + w}" y2="${ly.toFixed(1)}" stroke="#1b243055" stroke-dasharray="5 4"/>`;
        }
        return svg(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#eef3f8" stroke="#1b2430" stroke-width="3"/>
          <rect x="${x}" y="${(y + h - fh).toFixed(1)}" width="${w}" height="${fh.toFixed(1)}" rx="4" fill="#5da9e9"/>${marks}
          <text x="345" y="72" text-anchor="middle" font-size="16" font-weight="800" fill="#2c6bed">💧 Dolu: ${num(amount)} L</text>
          <text x="345" y="106" text-anchor="middle" font-size="16" font-weight="800" fill="#e25b45">Boş: ${num(empty)} L</text>
          <text x="345" y="140" text-anchor="middle" font-size="13" font-weight="700" fill="#526079">Oran: ${v.filled}/${v.parts}</text>`, "Dikdörtgen su kabı") +
          `<p class="im-caption">${v.cap} L kabın ${v.filled}/${v.parts} kadarı dolu. Dolu: ${num(amount)} L. Boş: ${num(empty)} L.</p>`;
      }
    },
    "im-data": {
      instruction: "Bir örneği seç. Sayıyla yazılması, onun miktar olduğu anlamına gelmez.",
      controls: [{ type: "choice", key: "mode", value: "sure", label: "Örnek", options: [["sure", "Koşu süresi"], ["renk", "Göz rengi"], ["kitap", "Kitap sayısı"], ["forma", "Forma numarası"]] }],
      demo: [{ mode: "sure" }, { mode: "renk" }, { mode: "kitap" }, { mode: "forma" }],
      render(v) {
        const rows = {
          sure: ["Nicel sürekli", "100 m koşu süresi ölçülür. 12,4 saniye ile 12,5 saniye arasında başka süreler olabilir.", "#1c8c74", "⏱️ 12,40 sn ··· 12,45 sn ··· 12,50 sn", "Ölçülür · Arada sonsuz değer olabilir"],
          renk: ["Kategorik", "Göz rengi bir grup adımdır. Renkler toplanıp ortalaması alınmaz.", "#7d55c7", "👁️ Ela · Kahverengi · Mavi · Yeşil", "Grup adı belirtir · Toplanmaz"],
          kitap: ["Nicel kesikli", "Kitap sayısı sayılır. 3 ile 4 arasında kitap olmaz.", "#2c6bed", "📚 1 kitap · 2 kitap · 3 kitap · 4 kitap", "Sayılır · Tam adetlerle ilerler"],
          forma: ["Kategorik", "Forma numarası oyuncuyu ayırt eden etikettir. 12 numara, 11 numaradan 1 fazla diye toplanmaz.", "#e25b45", "👕 #10 · #11 · #12 (Etiket, miktar değil!)", "Sayı görünse de kimlik/etikettir"]
        };
        const [kind, desc, col, visualText, sub] = rows[v.mode];
        const scene = svg(`<rect x="24" y="18" width="372" height="128" rx="16" fill="#fffdf7" stroke="${col}" stroke-width="3"/>
          <rect class="pl-pop" x="120" y="30" width="180" height="30" rx="15" fill="${col}"/>
          <text x="210" y="50" text-anchor="middle" font-size="15" font-weight="800" fill="#fff">${kind}</text>
          <text x="210" y="92" text-anchor="middle" font-size="18" font-weight="800" fill="#1b2430">${visualText}</text>
          <text x="210" y="124" text-anchor="middle" font-size="13" font-weight="700" fill="${col}">${sub}</text>`, kind, 162);
        return scene + `<p class="im-caption">${kind}. ${desc}</p>`;
      }
    },
    "im-research": {
      instruction: "Hangi soru bir grubun değişen özelliğini soruyor?",
      controls: [{ type: "choice", key: "mode", value: "sinif", label: "Soru", options: [["sinif", "Sınıfın okuması"], ["sevdigim", "En sevdiğim sayı"], ["sayfa", "Kitabın sayfası"], ["boy", "7. sınıfların boyu"]] }],
      demo: [{ mode: "sinif" }, { mode: "sevdigim" }, { mode: "sayfa" }, { mode: "boy" }],
      render(v) {
        const rows = {
          sinif: [true, "Sınıfımız dün kaç sayfa okudu? Bu istatistiksel bir sorudur. Bir grup vardır ve okunan sayfa kişiden kişiye değişebilir.", [15, 25, 10, 30, 20]],
          sevdigim: [false, "En sevdiğim sayı kaç? Bu istatistiksel bir soru değildir. Tek kişi hakkındadır; bir dağılım sormaz.", [7]],
          sayfa: [false, "Bu kitabın kaç sayfası var? Cevap tek bir sayıdır. Değişen bir özellik yoktur.", [180]],
          boy: [true, "Okulumuzdaki 7. sınıfların boyları nasıl dağılır? Bu istatistiksel bir sorudur. Evren ve değişen özellik bellidir.", [148, 155, 162, 151, 158]]
        };
        const [ok, say, vals] = rows[v.mode];
        const bars = ok
          ? vals.map((n, i) => `<rect class="pl-pop" style="--d:${(i * 0.08).toFixed(2)}s" x="${80 + i * 54}" y="${132 - i * 10 - (i % 2) * 18}" width="36" height="${35 + i * 10 + (i % 2) * 18}" rx="5" fill="#1c8c74"/><text x="${98 + i * 54}" y="150" text-anchor="middle" font-size="12" font-weight="800">${n}</text>`).join("")
          : `<rect class="pl-pop" x="155" y="65" width="110" height="62" rx="12" fill="#fdecea" stroke="#e25b45" stroke-width="2.5"/><text x="210" y="102" text-anchor="middle" font-size="20" font-weight="800" fill="#e25b45">Tek cevap: ${vals[0]}</text>`;
        const scene = svg(`<text x="210" y="34" text-anchor="middle" font-size="16" font-weight="800" fill="${ok ? "#1c8c74" : "#e25b45"}">${ok ? "✓ İstatistiksel soru · Grupta değişir (Dağılım var)" : "✗ İstatistiksel değil · Değişkenlik yok"}</text>${bars}`, say, 168);
        return scene + `<p class="im-caption">${say}</p>`;
      }
    },
    "im-privacy": {
      instruction: "Günlük okuma süresi araştırılıyor. Gereksiz kutuları kapat.",
      controls: [{ type: "checks", key: "on", value: ["sure", "sube", "donem", "kimlik", "adres"], label: "Toplanacak bilgi", options: [["sure", "Günlük okuma süresi (dakika)"], ["sube", "Şube"], ["donem", "Hangi günler sorulduğu"], ["kimlik", "Kimlik numarası"], ["adres", "Ev adresi"]] }],
      demo: [{ on: ["sure", "sube", "donem", "kimlik", "adres"] }, { on: ["sure", "sube", "donem"] }],
      render(v) {
        const need = { sure: true, sube: true, donem: true, kimlik: false, adres: false };
        const names = { sure: "Okuma süresi", sube: "Şube", donem: "Gün aralığı", kimlik: "Kimlik numarası", adres: "Ev adresi" };
        const problems = Object.keys(need).filter((id) => need[id] !== v.on.includes(id)).map((id) => need[id] ? names[id] + " gerekli." : names[id] + " bu araştırma için gerekli değil.");
        const say = problems.length ? problems.join(" ") : "Gereksiz bilgi kalmadı. 20 kişiden 3’ü cevap vermezse 17 geçerli yanıt vardır. Boş cevap 0 dakika demek değildir.";
        const items = Object.keys(need).map((id, i) => {
          const checked = v.on.includes(id);
          const good = need[id] === checked;
          const col = good ? "#1c8c74" : "#e25b45";
          return `<rect x="${20 + (i % 3) * 128}" y="${22 + Math.floor(i / 3) * 58}" width="120" height="46" rx="10" fill="${good ? "#e3f5ee" : "#fdecea"}" stroke="${col}" stroke-width="2"/>
            <text x="${80 + (i % 3) * 128}" y="${43 + Math.floor(i / 3) * 58}" text-anchor="middle" font-size="12" font-weight="800" fill="#1b2430">${names[id]}</text>
            <text x="${80 + (i % 3) * 128}" y="${60 + Math.floor(i / 3) * 58}" text-anchor="middle" font-size="11" font-weight="800" fill="${col}">${checked ? (need[id] ? "✓ Gerekli" : "🔒 Gereksiz!") : (need[id] ? "⚠ Eksik!" : "✓ Kapalı")}</text>`;
        }).join("");
        const scene = svg(`${items}<text x="210" y="156" text-anchor="middle" font-size="14" font-weight="800" fill="${problems.length ? "#e25b45" : "#1c8c74"}">${problems.length ? "⚠ Kişisel verileri kapat, yalnızca araştırma verisini tut!" : "🛡️ Mahremiyet korundu! 17 geçerli yanıt · 3 boş (0 sayılmaz)"}</text>`, "Anket mahremiyet kontrolü", 172);
        return scene + `<p class="im-caption">${say}</p>`;
      }
    },
    "im-media": {
      instruction: "Başlangıç ve son değeri değiştir. Yüzde, artışı başlangıca böler.",
      controls: [
        { type: "range", key: "start", label: "Başlangıç", min: 10, max: 200, value: 80 },
        { type: "range", key: "end", label: "Son değer", min: 10, max: 200, value: 100 }
      ],
      demo: [{ start: 80, end: 100 }, { start: 50, end: 75 }, { start: 100, end: 80 }],
      render(v) {
        const delta = v.end - v.start;
        const pct = Math.abs(delta) / v.start * 100;
        const max = Math.max(v.start, v.end, 1);
        const bar = (value, y, color, label) => `<rect class="pl-pop" x="85" y="${y}" width="${(value / max * 240).toFixed(1)}" height="30" rx="5" fill="${color}"/><text x="76" y="${y + 20}" text-anchor="end" font-size="13" font-weight="800">${label}: ${value}</text>`;
        const word = delta >= 0 ? "artış" : "azalış";
        return svg(`${bar(v.start, 48, "#2c6bed", "Önce")}${bar(v.end, 96, "#1c8c74", "Sonra")}<text x="85" y="34" font-size="14" font-weight="800" fill="#526079">Eksen 0’dan başlıyor · Fark: ${delta >= 0 ? "+" : "−"}${num(Math.abs(delta))} (%${num(pct)} ${word})</text>`, "İki değerin çubukları", 155) +
          `<p class="im-caption">Fark ${num(Math.abs(delta))}. Yüzde değişim: %${num(pct)} ${word}. Artış yeni değere değil, başlangıca bölünür. Eksen 0’dan başlamazsa aynı fark olduğundan büyük görünebilir.</p>`;
      }
    }
  };

  function defaults(spec) {
    const v = {};
    for (const c of spec.controls) v[c.key] = c.type === "checks" ? c.value.slice() : c.value;
    return v;
  }
  function normalize(spec, raw) {
    const v = defaults(spec);
    for (const c of spec.controls) {
      if (raw[c.key] === undefined) continue;
      if (c.type === "range" || c.type === "number") {
        let n = Number(raw[c.key]);
        if (!Number.isFinite(n)) n = c.value;
        const step = c.step || 1;
        n = Math.round(n / step) * step;
        v[c.key] = Math.max(c.min, Math.min(c.max, n));
      } else if (c.type === "choice") {
        v[c.key] = c.options.some(([id]) => id === raw[c.key]) ? raw[c.key] : c.value;
      } else if (c.type === "checks") {
        const allowed = new Set(c.options.map(([id]) => id));
        const list = Array.isArray(raw[c.key]) ? raw[c.key] : String(raw[c.key] || "").split(",").filter(Boolean);
        v[c.key] = list.filter((id) => allowed.has(id));
      }
    }
    if (spec.adjust) spec.adjust(v);
    return v;
  }
  function controlHtml(spec, v) {
    return spec.controls.map((c) => {
      if (c.type === "range" || c.type === "number") {
        const type = c.type === "number" ? "number" : "range";
        return `<label>${c.label}: <b data-im-read="${c.key}">${v[c.key]}</b><input type="${type}" data-im="${c.key}" min="${c.min}" max="${c.max}" step="${c.step || 1}" value="${v[c.key]}" aria-label="${c.label}"></label>`;
      }
      if (c.type === "choice") {
        return `<div class="im-choices" role="group" aria-label="${c.label}">${c.options.map(([id, label]) => `<button type="button" class="soft${v[c.key] === id ? " on" : ""}" data-im-choice="${c.key}" data-value="${id}" aria-pressed="${v[c.key] === id}">${label}</button>`).join("")}</div>`;
      }
      return `<div class="im-checks">${c.options.map(([id, label]) => `<label><input type="checkbox" data-im-check="1" value="${id}" ${v[c.key].includes(id) ? "checked" : ""}> ${label}</label>`).join("")}</div>`;
    }).join("");
  }
  function read(host) {
    const raw = {};
    host.querySelectorAll("[data-im]").forEach((input) => { raw[input.dataset.im] = input.value; });
    host.querySelectorAll("[data-im-choice].on").forEach((btn) => { raw[btn.dataset.imChoice] = btn.dataset.value; });
    const boxes = [...host.querySelectorAll("[data-im-check]")];
    if (boxes.length) raw.on = boxes.filter((box) => box.checked).map((box) => box.value);
    return raw;
  }
  function html(kind, preset) {
    const spec = specs[kind];
    if (!spec) return "";
    const v = normalize(spec, preset || {});
    const demo = spec.demo ? `<div class="im-demo"><button type="button" class="soft" data-im-demo="1">▶ İzle: kendisi oynasın</button></div>` : "";
    return `<div class="im-lab" data-imagine="${kind}"><p class="im-instruction">${spec.instruction}</p><div class="im-controls">${controlHtml(spec, v)}</div>${demo}<div data-im-output></div></div>`;
  }
  // Gösteri sırasında kontrolleri yeni değerlere getirir; verilmeyen anahtarlar olduğu gibi kalır.
  function apply(host, raw) {
    host.querySelectorAll("[data-im]").forEach((input) => {
      if (raw[input.dataset.im] !== undefined) input.value = raw[input.dataset.im];
    });
    host.querySelectorAll("[data-im-choice]").forEach((btn) => {
      const want = raw[btn.dataset.imChoice];
      if (want === undefined) return;
      const on = btn.dataset.value === String(want);
      btn.classList.toggle("on", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    if (raw.on) host.querySelectorAll("[data-im-check]").forEach((box) => { box.checked = raw.on.includes(box.value); });
  }
  function view(kind, raw) {
    const spec = specs[kind];
    if (!spec) throw new Error("Bilinmeyen model: " + kind);
    return spec.render(normalize(spec, raw || {}));
  }
  function bind(container) {
    const host = container.querySelector(".im-lab");
    if (!host) return;
    const spec = specs[host.dataset.imagine];
    if (!spec) return;
    // Kaydırıcı sürüklenirken çizim anında güncellenir; seçimde ve gösteride animasyon yeniden oynar.
    const paint = (still) => {
      const v = normalize(spec, read(host));
      host.querySelectorAll("[data-im-read]").forEach((el) => { el.textContent = v[el.dataset.imRead]; });
      const out = host.querySelector("[data-im-output]");
      if (out.classList) out.classList.toggle("im-still", still === true);
      out.innerHTML = spec.render(v);
    };
    host.addEventListener("input", () => paint(true));
    host.addEventListener("change", () => paint(true));
    host.addEventListener("click", (e) => {
      const demoBtn = e.target && e.target.closest ? e.target.closest("[data-im-demo]") : null;
      if (demoBtn && spec.demo && !demoBtn.disabled) {
        demoBtn.disabled = true;
        spec.demo.forEach((raw, i) => setTimeout(() => {
          if (host.isConnected === false) return;
          apply(host, raw);
          paint(false);
          if (i === spec.demo.length - 1) demoBtn.disabled = false;
        }, i * (spec.demoMs || 2200)));
        return;
      }
      const btn = e.target && e.target.closest ? e.target.closest("[data-im-choice]") : null;
      if (!btn || !host.contains(btn)) return;
      const key = btn.dataset.imChoice;
      host.querySelectorAll(`[data-im-choice="${key}"]`).forEach((item) => {
        const on = item === btn;
        item.classList.toggle("on", on);
        item.setAttribute("aria-pressed", String(on));
      });
      paint();
    });
    paint();
  }
  function register(kind, spec) {
    if (specs[kind]) throw new Error("Model zaten var: " + kind);
    specs[kind] = spec;
  }
  root.MatImagine = { html, bind, view, register, spec: (kind) => specs[kind], get kinds() { return Object.keys(specs); } };
})(typeof window !== "undefined" ? window : globalThis);
