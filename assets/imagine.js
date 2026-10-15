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
    return `<span class="im-frac" data-value="${value}" aria-label="${spoken}">${n < 0 ? "−" : ""}<span>${Math.abs(n)}</span><span>${d}</span></span>`;
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
      render(v) {
        const draw = {
          point: svg('<circle cx="210" cy="100" r="8" fill="#e25b45"/><text x="210" y="140" text-anchor="middle" font-size="18">A</text>', "A noktası"),
          segment: svg('<line x1="70" y1="100" x2="350" y2="100" stroke="#1b2430" stroke-width="4"/><circle cx="70" cy="100" r="6" fill="#2c6bed"/><circle cx="350" cy="100" r="6" fill="#e25b45"/><text x="70" y="132" text-anchor="middle">A</text><text x="350" y="132" text-anchor="middle">B</text><text x="210" y="78" text-anchor="middle">|AB| ölçülür</text>', "AB doğru parçası"),
          ray: svg('<line x1="70" y1="100" x2="360" y2="100" stroke="#1b2430" stroke-width="4"/><polygon points="360,100 342,92 342,108" fill="#1b2430"/><circle cx="70" cy="100" r="6" fill="#e25b45"/><text x="70" y="132" text-anchor="middle">A</text><text x="210" y="78" text-anchor="middle">Başlangıç var, bitiş yok</text>', "A başlangıçlı ışın"),
          line: svg('<line x1="40" y1="100" x2="380" y2="100" stroke="#1b2430" stroke-width="4"/><polygon points="380,100 362,92 362,108" fill="#1b2430"/><polygon points="40,100 58,92 58,108" fill="#1b2430"/><text x="210" y="78" text-anchor="middle">İki uç da sonsuz</text>', "İki yönü sonsuz doğru")
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
      render(v) {
        const rad = v.deg * Math.PI / 180;
        const len = 4 / Math.sin(rad);
        const dx = v.deg === 90 ? 0 : 80 / Math.tan(rad);
        const x2 = Math.round(130 + dx);
        return svg(`<line x1="30" y1="160" x2="400" y2="160" stroke="#1b2430" stroke-width="4"/><circle cx="130" cy="80" r="6" fill="#2c6bed"/><text x="130" y="68" text-anchor="middle">A</text><line x1="130" y1="80" x2="${x2}" y2="160" stroke="#e25b45" stroke-width="4"/><line x1="130" y1="80" x2="130" y2="160" stroke="#1c8c74" stroke-width="2" stroke-dasharray="5 4"/><text x="250" y="40" text-anchor="middle" font-size="16">${v.deg}°</text>`, "Noktadan kıyıya inen yollar") +
          `<p class="im-caption">Dik uzaklık 4 cm. Şu anki yol: ${num(len)} cm. Dik yol: 4 cm. Açı 90° olunca eğik yol da dik yola eşittir; açı küçüldükçe yol uzar.</p>`;
      }
    },
    "im-parallel": {
      instruction: "İki doğruyu paralel ya da kesişen duruma getir.",
      controls: [{ type: "choice", key: "mode", value: "parallel", label: "Durum", options: [["parallel", "Paralel"], ["cross", "Kesişen"]] }],
      render(v) {
        const parallel = v.mode === "parallel";
        const body = parallel
          ? '<line x1="40" y1="70" x2="380" y2="70" stroke="#2c6bed" stroke-width="4"/><line x1="40" y1="150" x2="380" y2="150" stroke="#e25b45" stroke-width="4"/><line x1="90" y1="70" x2="90" y2="150" stroke="#1c8c74" stroke-dasharray="4 3"/><line x1="300" y1="70" x2="300" y2="150" stroke="#1c8c74" stroke-dasharray="4 3"/>'
          : '<line x1="40" y1="40" x2="380" y2="180" stroke="#2c6bed" stroke-width="4"/><line x1="40" y1="180" x2="380" y2="40" stroke="#e25b45" stroke-width="4"/><circle cx="210" cy="110" r="5" fill="#1b2430"/>';
        const say = parallel
          ? "Paralel doğruların ortak noktası yoktur. Aralarındaki dik uzaklık her yerde aynıdır."
          : "Kesişen doğruların bir ortak noktası vardır. Bunlar paralel değildir.";
        return svg(body, say) + `<p class="im-caption">${say}</p>`;
      }
    },
    "im-durum": {
      instruction: "Üç durumu yan yana düşün: ortak nokta var mı, yok mu, hepsi mi ortak?",
      controls: [{ type: "choice", key: "mode", value: "intersect", label: "Durum", options: [["parallel", "Paralel"], ["intersect", "Kesişen"], ["same", "Çakışık"]] }],
      render(v) {
        const body = {
          parallel: '<line x1="40" y1="70" x2="380" y2="70" stroke="#2c6bed" stroke-width="4"/><line x1="40" y1="140" x2="380" y2="140" stroke="#e25b45" stroke-width="4"/>',
          intersect: '<line x1="40" y1="30" x2="380" y2="180" stroke="#2c6bed" stroke-width="4"/><line x1="40" y1="180" x2="380" y2="30" stroke="#e25b45" stroke-width="4"/><circle cx="210" cy="105" r="5" fill="#1b2430"/>',
          same: '<line x1="40" y1="100" x2="380" y2="100" stroke="#2c6bed" stroke-width="8"/><line x1="40" y1="100" x2="380" y2="100" stroke="#f4efe6" stroke-width="2" stroke-dasharray="10 8"/>'
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
      render(v) {
        const n = v.n;
        const names = { 3: "Üçgen", 4: "Dörtgen", 5: "Beşgen", 6: "Altıgen", 7: "Yedigen", 8: "Sekizgen" };
        const diag = n * (n - 3) / 2;
        const interior = (n - 2) * 180 / n;
        let pts = "";
        const xy = [];
        for (let i = 0; i < n; i++) {
          const a = -Math.PI / 2 + i * 2 * Math.PI / n;
          xy.push([210 + Math.cos(a) * 78, 108 + Math.sin(a) * 78]);
        }
        pts = xy.map((p) => p.map((x) => x.toFixed(1)).join(",")).join(" ");
        let diagonals = "";
        if (n <= 6) {
          for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
            if (i === 0 && j === n - 1) continue;
            diagonals += `<line x1="${xy[i][0].toFixed(1)}" y1="${xy[i][1].toFixed(1)}" x2="${xy[j][0].toFixed(1)}" y2="${xy[j][1].toFixed(1)}" stroke="#d89a12" stroke-width="1.5"/>`;
          }
        }
        return svg(`${diagonals}<polygon points="${pts}" fill="#d9e6ff" stroke="#2c6bed" stroke-width="3"/>`, names[n]) +
          `<p class="im-caption">${names[n]}: ${n} kenar, ${n} köşe, ${diag} köşegen. Köşegen sayısı = ${n} × (${n} − 3) / 2 = ${diag}. Düzgün ${names[n].toLocaleLowerCase("tr")}de her iç açı ${num(interior)}°dir.</p>`;
      }
    },
    "im-triangle": {
      instruction: "İki açıyı değiştir. Üçüncü açı 180°yi tamamlasın.",
      controls: [
        { type: "range", key: "a", label: "Birinci açı", min: 10, max: 160, value: 70 },
        { type: "range", key: "b", label: "İkinci açı", min: 10, max: 160, value: 60 }
      ],
      render(v) {
        const c = 180 - v.a - v.b;
        if (c <= 0) return `<p class="im-caption">Bu açılar bir üçgen oluşturmaz. ${v.a}° + ${v.b}° = ${v.a + v.b}°. İki açının toplamı 180°den küçük olmalıdır; üçüncü açıya yer kalmaz.</p>`;
        const kind = v.a === 90 || v.b === 90 || c === 90 ? "dik üçgendir" : (v.a > 90 || v.b > 90 || c > 90 ? "geniş açılıdır" : "dar açılıdır");
        return svg(`<polygon points="70,170 210,40 350,170" fill="#d9e6ff" stroke="#2c6bed" stroke-width="3"/><text x="120" y="160" font-size="16">${v.a}°</text><text x="270" y="160" font-size="16">${v.b}°</text><text x="210" y="78" text-anchor="middle" font-size="16">${c}°</text>`, "Üçgende üç açı") +
          `<p class="im-caption">Üçüncü açı: ${c}°. ${v.a}° + ${v.b}° + ${c}° = 180°. Bu üçgen ${kind}.</p>`;
      }
    },
    "im-construct": {
      instruction: "İnşayı adım adım izle. Pergelin açıklığı hiç değişmiyor.",
      controls: [{ type: "choice", key: "step", value: "2", label: "Adım", options: [["0", "1. Taban"], ["1", "2. Çemberler"], ["2", "3. Üçgen"]] }],
      render(v) {
        const base = '<line x1="110" y1="150" x2="310" y2="150" stroke="#1b2430" stroke-width="4"/><circle cx="110" cy="150" r="5" fill="#2c6bed"/><circle cx="310" cy="150" r="5" fill="#e25b45"/><text x="110" y="176">A</text><text x="310" y="176">B</text>';
        const circles = '<circle cx="110" cy="150" r="100" fill="none" stroke="#2c6bed" stroke-width="2"/><circle cx="310" cy="150" r="100" fill="none" stroke="#e25b45" stroke-width="2"/>';
        const top = '<circle cx="210" cy="63" r="5" fill="#1c8c74"/><text x="210" y="48" text-anchor="middle">C</text>';
        const tri = '<polygon points="110,150 310,150 210,63" fill="#1c8c7422" stroke="#1c8c74" stroke-width="3"/>';
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
      render(v) {
        const a = v.a, b = v.b;
        const sa = String(a), sb = String(b);
        let why = "Bütün basamaklar eşit.";
        let rel = "=";
        let diff = -1;
        if (sa.length !== sb.length) {
          rel = sa.length > sb.length ? ">" : "<";
          why = "Basamak sayısı fazla olan daha büyüktür. Soldaki rakamlara geçmeden karar verilir.";
        } else {
          for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) { rel = sa[i] > sb[i] ? ">" : "<"; diff = i; break; }
          if (diff >= 0) {
            const place = ["birler", "onlar", "yüzler", "binler", "on binler", "yüz binler"][sa.length - 1 - diff] || "soldaki basamak";
            why = `${place} basamağında ${sa[diff]} ve ${sb[diff]} farklı. İlk fark buradadır; sağına bakılmaz.`;
          }
        }
        const word = rel === ">" ? "büyüktür" : rel === "<" ? "küçüktür" : "eşittir";
        const boxes = (s, other) => s.split("").map((ch, i) => `<span class="${s.length === other.length && i === diff ? "diff" : ""}">${ch}</span>`).join("");
        return `<div class="im-digits" aria-label="A ${group(a)}"><b>A</b>${boxes(sa, sb)}</div><div class="im-digits" aria-label="B ${group(b)}"><b>B</b>${boxes(sb, sa)}</div><p class="im-caption">${group(a)} ${word} ${group(b)}. ${why}</p>`;
      }
    },
    "im-add": {
      instruction: "Toplananları değiştir. Birler 9’u geçerse elde oluşur.",
      controls: [
        { type: "range", key: "a", label: "Birinci toplanan", min: 0, max: 99, value: 28 },
        { type: "range", key: "b", label: "İkinci toplanan", min: 0, max: 99, value: 17 }
      ],
      render(v) {
        const ones = v.a % 10 + v.b % 10;
        const carry = ones >= 10 ? 1 : 0;
        const tens = Math.floor(v.a / 10) + Math.floor(v.b / 10) + carry;
        return `<p class="im-caption">${v.a} + ${v.b}. Birler: ${v.a % 10} + ${v.b % 10} = ${ones}.${carry ? ` ${ones} birlik = 1 onluk + ${ones - 10} birlik.` : " Elde yok."} Onlar: ${Math.floor(v.a / 10)} + ${Math.floor(v.b / 10)}${carry ? " + 1 elde" : ""} = ${tens}. Sonuç: ${v.a + v.b}.</p>`;
      }
    },
    "im-mul": {
      instruction: "Sıra sayısını ve bir sıradaki kare sayısını değiştir.",
      controls: [
        { type: "range", key: "rows", label: "Sıra sayısı", min: 1, max: 8, value: 3 },
        { type: "range", key: "cols", label: "Bir sıradaki kare", min: 1, max: 8, value: 4 }
      ],
      render(v) {
        let cells = "";
        for (let r = 0; r < v.rows; r++) for (let c = 0; c < v.cols; c++) {
          cells += `<rect x="${40 + c * 28}" y="${30 + r * 28}" width="24" height="24" rx="4" fill="${(r + c) % 2 ? "#1c8c74" : "#2c6bed"}"/>`;
        }
        const product = v.rows * v.cols;
        return svg(cells, `${v.rows} sıra, her sırada ${v.cols} kare`, 30 + v.rows * 28 + 20) +
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
      render(v) {
        const cost = v.n * v.price;
        const left = v.money - cost;
        const say = left < 0
          ? `Ödeme ${group(cost)} TL olur. ${group(v.money)} TL yetmez. En fazla ${Math.floor(v.money / v.price)} defter alınır.`
          : `${v.n} × ${v.price} = ${group(cost)} TL ödenir. Kalan ${group(left)} TL.`;
        return `<p class="im-caption">${say}</p>`;
      }
    },
    "im-frac": {
      instruction: "Payı, paydayı ve çarpanı değiştir. Değer ne zaman aynı kalır?",
      controls: [
        { type: "range", key: "n", label: "Pay", min: -24, max: 24, value: -15 },
        { type: "range", key: "d", label: "Payda", min: 1, max: 24, value: 20 },
        { type: "range", key: "k", label: "Çarpan", min: 1, max: 6, value: 1 }
      ],
      render(v) {
        const s = simplify(v.n, v.d);
        return `<p class="im-line">${frac(v.n, v.d)} = ${frac(v.n * v.k, v.d * v.k)} = ${frac(s.n, s.d)}</p>` +
          `<p class="im-caption">${v.k === 1 ? "Çarpan 1 iken kesir olduğu gibi durur. Çarpanı büyüt; eş kesri gör." : "Pay ve paydayı " + v.k + " ile çarpmak kesrin değerini değiştirmez."} Sade biçim ${s.n < 0 ? "−" : ""}${Math.abs(s.n)}/${s.d}. ${v.n === 0 ? "Pay 0 ise kesir 0’dır. " : ""}Payda 0 olamaz.</p>`;
      }
    },
    "im-abs": {
      instruction: "İki noktayı sayı doğrusunda gezdir. Uzaklığın işareti yoktur.",
      controls: [
        { type: "range", key: "a", label: "A noktası", min: -12, max: 12, value: -5 },
        { type: "range", key: "b", label: "B noktası", min: -12, max: 12, value: 8 }
      ],
      render(v) {
        const x = (n) => 210 + n * 14;
        return svg(`<line x1="30" y1="110" x2="390" y2="110" stroke="#1b2430" stroke-width="2"/>${[-12, -6, 0, 6, 12].map((n) => `<text x="${x(n)}" y="145" text-anchor="middle">${n}</text>`).join("")}<line x1="${x(v.a)}" y1="70" x2="${x(v.b)}" y2="70" stroke="#1c8c74" stroke-width="4"/><circle cx="${x(v.a)}" cy="110" r="6" fill="#e25b45"/><circle cx="${x(v.b)}" cy="110" r="6" fill="#2c6bed"/><text x="${x(v.a)}" y="58" text-anchor="middle">A</text><text x="${x(v.b)}" y="58" text-anchor="middle">B</text>`, "Sayı doğrusunda iki nokta") +
          `<p class="im-caption">|A| = ${Math.abs(v.a)}. |B| = ${Math.abs(v.b)}. A ile B arasındaki uzaklık ${Math.abs(v.b - v.a)} birimdir. Çıkarmanın sırası uzaklığı değiştirmez.</p>`;
      }
    },
    "im-decimal": {
      instruction: "Kesri değiştir. Ondalık gösterim sonlanıyor mu, devrediyor mu?",
      controls: [
        { type: "range", key: "n", label: "Pay", min: -12, max: 12, value: 2 },
        { type: "range", key: "d", label: "Payda", min: 1, max: 12, value: 3 }
      ],
      render(v) {
        const s = simplify(v.n, v.d);
        const finite = finiteDen(s.d);
        const shown = decimalOf(v.n, v.d);
        return `<p class="im-line">${frac(v.n, v.d)} = ${shown}</p><p class="im-caption">${finite ? "Sade payda yalnız 2 ve 5 asal çarpanlarından oluşur. Ondalık gösterim sonludur." : "Sade paydada 2 ve 5 dışında asal çarpan vardır. Gösterim devirlidir; üç nokta basamakların sürdüğünü söyler."} Sade kesir ${s.n < 0 ? "−" : ""}${Math.abs(s.n)}/${s.d}.</p>`;
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
      render(v) {
        const p = lcm(v.b, v.d);
        const left = v.a * (p / v.b);
        const right = v.c * (p / v.d);
        const s = simplify(left + right, p);
        return `<p class="im-line">${frac(v.a, v.b)} + ${frac(v.c, v.d)} = ${frac(left, p)} + ${frac(right, p)} = ${frac(s.n, s.d)}</p>` +
          `<p class="im-caption">Ortak payda ${p}. Paylar ${left} ve ${right}. Paydalar toplanmaz. Sonuç ${s.n < 0 ? "−" : ""}${Math.abs(s.n)}/${s.d}.</p>`;
      }
    },
    "im-order": {
      instruction: "a, b ve c sayılarını değiştir. Çarpma, toplamadan önce gelir.",
      controls: [
        { type: "range", key: "a", label: "a", min: 0, max: 12, value: 2 },
        { type: "range", key: "b", label: "b", min: 0, max: 12, value: 3 },
        { type: "range", key: "c", label: "c", min: 0, max: 12, value: 4 }
      ],
      render(v) {
        const wrong = (v.a + v.b) * v.c;
        const right = v.a + v.b * v.c;
        const same = wrong === right;
        return `<p class="im-line">Soldan: (${v.a} + ${v.b}) × ${v.c} = ${wrong}</p><p class="im-line">Doğru: ${v.a} + (${v.b} × ${v.c}) = ${right}</p>` +
          `<p class="im-caption">${same ? "Bu sayılarda iki yol aynı sonucu verdi. b veya c sıfır değilken ve a sıfır değilken yeniden dene." : "Önce çarpma yapılır: " + v.b + " × " + v.c + " = " + (v.b * v.c) + ". Sonra " + v.a + " eklenir. Doğru sonuç " + right + ". Soldan yapılırsa " + wrong + " bulunur."}</p>`;
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
      render(v) {
        const cells = [v.bs, v.bd, v.fs, v.fd];
        const frontL = Math.max(v.fs, v.bs), frontR = Math.max(v.fd, v.bd);
        const sideF = Math.max(v.fs, v.fd), sideB = Math.max(v.bs, v.bd);
        const total = v.fs + v.fd + v.bs + v.bd;
        const full = cells.filter((n) => n > 0).length;
        const grid = ["Arka sol " + v.bs, "Arka sağ " + v.bd, "Ön sol " + v.fs, "Ön sağ " + v.fd].map((t) => `<span>${t}</span>`).join("");
        return `<div class="im-grid" aria-label="Küp yığını">${grid}</div><p class="im-caption">Ön görünüm: ${frontL} ve ${frontR}. Sağdan, ön sıranın yüksekliği ${sideF}; arka sıranın yüksekliği ${sideB}. Üstten ${full} hücre dolu. Toplam küp: ${total}. Görünen yükseklikler toplanmaz; her sütunun en uzunu silueti belirler.</p>`;
      }
    },
    "im-layers": {
      instruction: "Sırayı, sıra sayısını ve katı değiştir. Hacim üçünün çarpımıdır.",
      controls: [
        { type: "range", key: "a", label: "Bir sıradaki küp", min: 1, max: 8, value: 6 },
        { type: "range", key: "b", label: "Sıra sayısı", min: 1, max: 6, value: 3 },
        { type: "range", key: "c", label: "Kat sayısı", min: 1, max: 6, value: 4 }
      ],
      render(v) {
        const layer = v.a * v.b;
        const total = layer * v.c;
        return `<p class="im-caption">Bir katta ${v.a} × ${v.b} = ${layer} küp vardır. ${v.c} katta ${layer} × ${v.c} = ${total} birim küp. ${v.a} × ${v.b} × ${v.c} = ${total}.</p>`;
      }
    },
    "im-units": {
      instruction: "Mililitreyi gezdir. Litre ve küp birimler aynı miktarı başka adla söyler.",
      controls: [{ type: "range", key: "ml", label: "Mililitre", min: 0, max: 5000, step: 50, value: 2400 }],
      render(v) {
        const liters = v.ml / 1000;
        return `<p class="im-caption">${group(v.ml)} mL = ${num(liters)} L = ${num(liters)} dm³ = ${group(v.ml)} cm³. 1 mL, 1 cm³ ile aynı miktardır. 1 L, 1 dm³ ile aynı miktardır.</p>`;
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
      render(v) {
        const amount = v.cap * v.filled / v.parts;
        const empty = v.cap - amount;
        const h = 120, w = 180, x = 120, y = 40;
        const fh = v.parts ? h * v.filled / v.parts : 0;
        return svg(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#eef3f8" stroke="#1b2430" stroke-width="3"/><rect x="${x}" y="${y + h - fh}" width="${w}" height="${fh}" fill="#7eb6e8"/>`, "Dikdörtgen su kabı") +
          `<p class="im-caption">${v.cap} L kabın ${v.filled}/${v.parts} kadarı dolu. Dolu: ${num(amount)} L. Boş: ${num(empty)} L.</p>`;
      }
    },
    "im-data": {
      instruction: "Bir örneği seç. Sayıyla yazılması, onun miktar olduğu anlamına gelmez.",
      controls: [{ type: "choice", key: "mode", value: "sure", label: "Örnek", options: [["sure", "Koşu süresi"], ["renk", "Göz rengi"], ["kitap", "Kitap sayısı"], ["forma", "Forma numarası"]] }],
      render(v) {
        const rows = {
          sure: ["Nicel sürekli", "100 m koşu süresi ölçülür. 12,4 saniye ile 12,5 saniye arasında başka süreler olabilir."],
          renk: ["Kategorik", "Göz rengi bir grup adımdır. Renkler toplanıp ortalaması alınmaz."],
          kitap: ["Nicel kesikli", "Kitap sayısı sayılır. 3 ile 4 arasında kitap olmaz."],
          forma: ["Kategorik", "Forma numarası oyuncuyu ayırt eden etikettir. 12 numara, 11 numaradan 1 fazla diye toplanmaz."]
        };
        return `<p class="im-caption">${rows[v.mode][0]}. ${rows[v.mode][1]}</p>`;
      }
    },
    "im-research": {
      instruction: "Hangi soru bir grubun değişen özelliğini soruyor?",
      controls: [{ type: "choice", key: "mode", value: "sinif", label: "Soru", options: [["sinif", "Sınıfın okuması"], ["sevdigim", "En sevdiğim sayı"], ["sayfa", "Kitabın sayfası"], ["boy", "7. sınıfların boyu"]] }],
      render(v) {
        const rows = {
          sinif: [true, "Sınıfımız dün kaç sayfa okudu? Bu istatistiksel bir sorudur. Bir grup vardır ve okunan sayfa kişiden kişiye değişebilir."],
          sevdigim: [false, "En sevdiğim sayı kaç? Bu istatistiksel bir soru değildir. Tek kişi hakkındadır; bir dağılım sormaz."],
          sayfa: [false, "Bu kitabın kaç sayfası var? Cevap tek bir sayıdır. Değişen bir özellik yoktur."],
          boy: [true, "Okulumuzdaki 7. sınıfların boyları nasıl dağılır? Bu istatistiksel bir sorudur. Evren ve değişen özellik bellidir."]
        };
        return `<p class="im-caption">${rows[v.mode][1]}</p>`;
      }
    },
    "im-privacy": {
      instruction: "Günlük okuma süresi araştırılıyor. Gereksiz kutuları kapat.",
      controls: [{ type: "checks", key: "on", value: ["sure", "sube", "donem", "kimlik", "adres"], label: "Toplanacak bilgi", options: [["sure", "Günlük okuma süresi (dakika)"], ["sube", "Şube"], ["donem", "Hangi günler sorulduğu"], ["kimlik", "Kimlik numarası"], ["adres", "Ev adresi"]] }],
      render(v) {
        const need = { sure: true, sube: true, donem: true, kimlik: false, adres: false };
        const names = { sure: "Okuma süresi", sube: "Şube", donem: "Gün aralığı", kimlik: "Kimlik numarası", adres: "Ev adresi" };
        const problems = Object.keys(need).filter((id) => need[id] !== v.on.includes(id)).map((id) => need[id] ? names[id] + " gerekli." : names[id] + " bu araştırma için gerekli değil.");
        const say = problems.length ? problems.join(" ") : "Gereksiz bilgi kalmadı. 20 kişiden 3’ü cevap vermezse 17 geçerli yanıt vardır. Boş cevap 0 dakika demek değildir.";
        return `<p class="im-caption">${say}</p>`;
      }
    },
    "im-media": {
      instruction: "Başlangıç ve son değeri değiştir. Yüzde, artışı başlangıca böler.",
      controls: [
        { type: "range", key: "start", label: "Başlangıç", min: 10, max: 200, value: 80 },
        { type: "range", key: "end", label: "Son değer", min: 10, max: 200, value: 100 }
      ],
      render(v) {
        const delta = v.end - v.start;
        const pct = Math.abs(delta) / v.start * 100;
        const max = Math.max(v.start, v.end, 1);
        const bar = (value, y, color) => `<rect x="70" y="${y}" width="${value / max * 280}" height="28" fill="${color}"/><text x="60" y="${y + 20}" text-anchor="end" font-size="14">${value}</text>`;
        const word = delta >= 0 ? "artış" : "azalış";
        return svg(`${bar(v.start, 50, "#2c6bed")}${bar(v.end, 100, "#1c8c74")}<text x="70" y="36" font-size="14">Eksen 0’dan başlıyor</text>`, "İki değerin çubukları") +
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
  function html(kind) {
    const spec = specs[kind];
    if (!spec) return "";
    const v = defaults(spec);
    return `<div class="im-lab" data-imagine="${kind}"><p class="im-instruction">${spec.instruction}</p><div class="im-controls">${controlHtml(spec, v)}</div><div data-im-output></div></div>`;
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
    const paint = () => {
      const v = normalize(spec, read(host));
      host.querySelectorAll("[data-im-read]").forEach((el) => { el.textContent = v[el.dataset.imRead]; });
      host.querySelector("[data-im-output]").innerHTML = spec.render(v);
    };
    host.addEventListener("input", paint);
    host.addEventListener("change", paint);
    host.addEventListener("click", (e) => {
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
  root.MatImagine = { html, bind, view, kinds: Object.keys(specs) };
})(typeof window !== "undefined" ? window : globalThis);
