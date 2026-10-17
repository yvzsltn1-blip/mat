(function (root) {
  "use strict";
  const LEVELS = [
    { id: 1, name: "Keşif", points: 10, blurb: "Kavramları tanı, ilk adımı at", color: "#23836d", icon: "✦" },
    { id: 2, name: "Alıştırma", points: 20, blurb: "Bilgini kullan, pratik kazan", color: "#2c6bed", icon: "◆" },
    { id: 3, name: "Problem", points: 35, blurb: "Bağlantı kur, adım adım çöz", color: "#a46318", icon: "✹" },
    { id: 4, name: "Meydan okuma", points: 50, blurb: "Birden çok koşulu birlikte düşün", color: "#b64b42", icon: "⚡" },
    { id: 5, name: "Özel zor", points: 80, blurb: "Stratejini kur, ustalığını göster", color: "#7950b5", icon: "♛" },
    // Üst seviyeler yalnız sınırsız soru üreticisinde vardır; soru bankası ilk beş seviyeyle sınırlıdır.
    { id: 6, name: "Usta", points: 120, blurb: "Çok adımlı düşün, tersinden kur", color: "#0f6e8c", icon: "✪", unlimitedOnly: true },
    { id: 7, name: "Efsane", points: 180, blurb: "Sistemli say, gizli kuralı bul", color: "#b8326b", icon: "☄", unlimitedOnly: true },
    { id: 8, name: "Prestij", points: 300, blurb: "Olimpiyat ruhu: zekâ ve sabır", color: "#a87a12", icon: "♔", unlimitedOnly: true }
  ];
  const BANK_LEVELS = LEVELS.filter((l) => !l.unlimitedOnly);
  const ONES = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
  const TENS = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];
  const PLACES = ["birler", "onlar", "yüzler", "binler", "on binler", "yüz binler", "milyonlar", "on milyonlar", "yüz milyonlar", "milyarlar", "on milyarlar", "yüz milyarlar"];
  function makeRng(seed) {
    let s = Math.abs(Number(seed) || 1) % 2147483646 || 1;
    return () => { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
  }
  function shuffle(rnd, arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function groupDigits(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  function threeDigits(n) {
    const y = Math.floor(n / 100), t = Math.floor(n % 100 / 10), o = n % 10;
    return [y === 1 ? "yüz" : y > 1 ? ONES[y] + " yüz" : "", TENS[t], ONES[o]].filter(Boolean).join(" ");
  }
  function sayNumber(n) {
    n = Math.floor(Number(n));
    if (!Number.isSafeInteger(n) || n < 0 || n >= 1e12) return "";
    if (!n) return "sıfır";
    const parts = [];
    for (const [value, name] of [[1e9, "milyar"], [1e6, "milyon"], [1e3, "bin"], [1, ""]]) {
      const c = Math.floor(n / value); n %= value;
      if (c) parts.push(value === 1000 && c === 1 ? "bin" : (threeDigits(c) + " " + name).trim());
    }
    return parts.join(" ");
  }
  function rectOk(q, w, h) {
    if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > 20 || h > 20) return false;
    return q.mode === "area" ? w * h === q.target : q.mode === "perim" ? 2 * (w + h) === q.target : q.mode === "both" && w * h === q.area && 2 * (w + h) === q.perim;
  }
  function buildQuiz(topicId, level, seed, usedIds = [], count = 15) {
    const rnd = makeRng(seed);
    const bank = root.MatQuestionBank.get(topicId, level);
    const used = new Set(usedIds);
    const fresh = shuffle(rnd, bank.filter(q => !used.has(q.id)));
    const recycled = shuffle(rnd, bank.filter(q => used.has(q.id)));
    return [...fresh, ...recycled].slice(0, Math.min(count, bank.length));
  }
  root.MatGames = { LEVELS, BANK_LEVELS, buildQuiz, sayNumber, groupDigits, rectOk, PLACES, makeRng, shuffle };
})(typeof window !== "undefined" ? window : globalThis);
