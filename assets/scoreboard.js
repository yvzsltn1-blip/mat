(function (root) {
  "use strict";
  const PERIODS = { day: "Günlük", week: "Haftalık", month: "Aylık", total: "Toplam" };
  const dateFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
  function keys(at = Date.now()) {
    const parts = Object.fromEntries(dateFormat.formatToParts(new Date(at)).filter(p => p.type !== "literal").map(p => [p.type, p.value]));
    const day = `${parts.year}-${parts.month}-${parts.day}`;
    const monday = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
    monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
    return { day, week: monday.toISOString().slice(0, 10), month: day.slice(0, 7) };
  }
  function score(entity, period = "total", at = Date.now()) {
    if (!entity) return 0;
    if (period === "total") return Number(entity.score) || 0;
    const bucket = entity.scorePeriods?.[period];
    return bucket?.key === keys(at)[period] ? Number(bucket.points) || 0 : 0;
  }
  function add(entity, delta, at = Date.now()) {
    if (!entity || !Number.isFinite(delta)) return;
    const current = keys(at);
    entity.score = Math.max(0, score(entity) + delta);
    if (!entity.scorePeriods || typeof entity.scorePeriods !== "object" || Array.isArray(entity.scorePeriods)) entity.scorePeriods = {};
    for (const period of ["day", "week", "month"]) {
      entity.scorePeriods[period] = { key: current[period], points: Math.max(0, score(entity, period, at) + delta) };
    }
  }
  function reset(entity, period, at = Date.now()) {
    if (!Object.keys(PERIODS).includes(period)) throw new Error("Geçersiz puan dönemi");
    if (period === "total") { entity.score = 0; entity.scorePeriods = {}; return; }
    if (!entity.scorePeriods || typeof entity.scorePeriods !== "object" || Array.isArray(entity.scorePeriods)) entity.scorePeriods = {};
    entity.scorePeriods[period] = { key: keys(at)[period], points: 0 };
  }
  root.MatScores = { PERIODS, keys, score, add, reset };
})(typeof window !== "undefined" ? window : globalThis);
