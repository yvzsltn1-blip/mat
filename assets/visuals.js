(function (root) {
  function ray(cx, cy, deg, len) {
    const a = (deg * Math.PI) / 180;
    return [cx + len * Math.cos(a), cy - len * Math.sin(a)];
  }

  function arc(cx, cy, r, deg) {
    if (deg <= 0) return "";
    const [x1, y1] = ray(cx, cy, 0, r);
    const [x2, y2] = ray(cx, cy, Math.min(deg, 359.9), r);
    const large = deg > 180 ? 1 : 0;
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 0 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }

  function wrap(inner, vb) {
    return `<div class="stage"><svg class="scene" viewBox="${vb || "0 0 360 220"}" role="img">${inner}</svg></div>`;
  }

  function angleSvg(deg, opts) {
    const o = opts || {};
    const cx = 78;
    const cy = 168;
    const len = 150;
    const d = Math.max(0, Math.min(180, deg));
    const [x, y] = ray(cx, cy, d, len);
    const square = d === 90
      ? `<path d="M108 168 L108 138 L78 138" fill="none" stroke="#1c8c74" stroke-width="3"/>`
      : "";
    const label = o.show ? `<text x="168" y="42" font-size="22" font-weight="700" fill="#1b2430">${d}°</text>` : "";
    return wrap(`
      <line class="draw" x1="${cx}" y1="${cy}" x2="${cx + len}" y2="${cy}" stroke="#1b2430" stroke-width="4" stroke-linecap="round"/>
      <line class="draw delay" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e25b45" stroke-width="4" stroke-linecap="round"/>
      <path class="draw delay" d="${arc(cx, cy, 32, d)}" fill="none" stroke="#6554a4" stroke-width="1.5"/>
      <circle class="pop" cx="${cx}" cy="${cy}" r="5" fill="#2c6bed"/>
      ${square}${label}
    `);
  }

  function dialSvg(deg) {
    const cx = 180;
    const cy = 176;
    const d = Math.max(0, Math.min(180, Math.round(deg || 0)));
    const [x, y] = ray(cx, cy, d, 112);
    let ticks = "";
    for (let t = 0; t <= 180; t += 10) {
      const inner = t % 30 === 0 ? 78 : 90;
      const [x1, y1] = ray(cx, cy, t, inner);
      const [x2, y2] = ray(cx, cy, t, 104);
      ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#1b2430" stroke-width="${t % 30 === 0 ? 2.4 : 1}"/>`;
      if (t % 30 === 0) {
        const [lx, ly] = ray(cx, cy, t, 122);
        ticks += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-size="11" fill="#3d4a5c">${t}</text>`;
      }
    }
    return `<div class="stage dial-stage"><svg id="dialSvg" class="scene dial-svg" viewBox="0 0 360 230">
      <path d="${arc(cx, cy, 104, 180)}" fill="none" stroke="#eadfce" stroke-width="28" stroke-linecap="butt"/>
      ${ticks}
      <path id="dialArc" d="${arc(cx, cy, 32, d)}" fill="none" stroke="#6554a4" stroke-width="1.5" stroke-linecap="round"/>
      <line id="dialRay" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e25b45" stroke-width="5" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="7" fill="#16342f"/>
      <circle id="dialHandle" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="#fff" stroke="#e25b45" stroke-width="3"/>
      <path id="dialSquare" d="M180 152 L204 152 L204 176" fill="none" stroke="#1c8c74" stroke-width="3" visibility="${d === 90 ? 'visible' : 'hidden'}"/>
    </svg></div>`;
  }

  function circleSvg(opts) {
    const o = opts || {};
    const r = o.r || 70;
    const showD = o.showDiameter !== false;
    return wrap(`
      <circle class="draw" cx="190" cy="112" r="${r}" fill="${o.fill || "rgba(44,107,237,.08)"}" stroke="#2c6bed" stroke-width="4"/>
      <circle class="pop" cx="190" cy="112" r="5" fill="#e25b45"/>
      <line class="draw delay" x1="190" y1="112" x2="${190 + r}" y2="112" stroke="#e25b45" stroke-width="4"/>
      ${showD ? `<line class="draw delay2" x1="${190 - r}" y1="112" x2="${190 + r}" y2="112" stroke="#e2a325" stroke-width="3" stroke-dasharray="6 4"/>` : ""}
      <text x="214" y="104" font-size="14" fill="#e25b45" font-weight="700">${o.radiusLabel || "r"}</text>
      ${showD ? `<text x="168" y="132" font-size="14" fill="#b07a2f" font-weight="700">${o.diameterLabel || "R"}</text>` : ""}
    `, r > 100 ? "0 -30 400 285" : undefined);
  }

  function polyPoints(n, cx, cy, radius) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = ((-90 + (i * 360) / n) * Math.PI) / 180;
      pts.push([cx + radius * Math.cos(a), cy + radius * Math.sin(a)]);
    }
    return pts;
  }

  function polygonSvg(n) {
    const pts = polyPoints(n, 180, 116, 78);
    const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") + " Z";
    const dots = pts.map((p, i) => `<circle class="pop" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="#e25b45"/><text x="${p[0].toFixed(1)}" y="${(p[1] - 10).toFixed(1)}" text-anchor="middle" font-size="12" fill="#1b2430">${String.fromCharCode(65 + i)}</text>`).join("");
    return wrap(`<path class="draw" d="${d}" fill="rgba(28,140,116,.12)" stroke="#1c8c74" stroke-width="4"/>${dots}`);
  }

  function gridHtml(scene) {
    const cols = scene.cols;
    const rows = scene.rows;
    const hole = scene.hole;
    const size = rows > 8 || cols > 10 ? 16 : rows > 6 ? 20 : 26;
    let cells = "";
    let n = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cut = hole && x >= hole.x && x < hole.x + hole.w && y >= hole.y && y < hole.y + hole.h;
        if (!cut) n += 1;
        cells += `<i class="${cut ? "hole" : "cell"}" style="animation-delay:${Math.min((y * cols + x) * 20, 650)}ms"></i>`;
      }
    }
    const cap = scene.cap ? `<p class="grid-cap">${scene.cap}</p>` : "";
    return `<div class="grid-wrap">${cap}<div class="grid" style="grid-template-columns:repeat(${cols}, ${size}px)">${cells}</div>${scene.count ? `<p class="grid-cap">${n} birim kare</p>` : ""}</div>`;
  }

  function placeHtml(digits) {
    const clean = String(digits || "").replace(/\D/g, "").slice(0, 12);
    if (!clean) return `<div class="pv empty">Rakam yazınca basamak tablosu burada belirecek.</div>`;
    const names = ["birler", "onlar", "yüzler", "binler", "on binler", "yüz binler", "milyonlar", "on milyonlar", "yüz milyonlar", "milyarlar", "on milyarlar", "yüz milyarlar"];
    const groups = ["Birler", "Binler", "Milyonlar", "Milyarlar"];
    const rev = clean.split("").reverse();
    const cells = rev.map((d, i) => ({
      d,
      name: names[i] || "",
      group: Math.floor(i / 3),
      value: String(Number(d) * Math.pow(10, i))
    })).reverse();
    const buckets = [];
    cells.forEach((c) => {
      if (!buckets[c.group]) buckets[c.group] = [];
      buckets[c.group].push(c);
    });
    const html = buckets.slice().reverse().map((list) => {
      const g = list[0].group;
      return `<div class="pv-g"><div class="pv-gh">${groups[g]} bölüğü</div><div class="pv-row">${list.map((c) => `<div><b>${c.d}</b><small>${c.name}</small><em>${group(c.value)}</em></div>`).join("")}</div></div>`;
    }).join("");
    return `<div class="pv">${html}</div>`;
  }

  function group(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function constructSvg(mode) {
    const setups = {
      equilateral: { x1: 100, x2: 190, r1: 90, r2: 90, label: "Eşkenar" },
      isosceles: { x1: 90, x2: 230, r1: 100, r2: 100, label: "İkizkenar" },
      scalene: { x1: 80, x2: 230, r1: 90, r2: 130, label: "Çeşitkenar" }
    };
    const s = setups[mode] || setups.equilateral;
    const y = 168;
    const d = s.x2 - s.x1;
    const a = (s.r1 * s.r1 - s.r2 * s.r2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, s.r1 * s.r1 - a * a));
    const px = s.x1 + a;
    const py = y - h;
    return wrap(`
      <circle class="draw" cx="${s.x1}" cy="${y}" r="${s.r1}" fill="rgba(44,107,237,.06)" stroke="#2c6bed" stroke-width="3"/>
      <circle class="draw delay" cx="${s.x2}" cy="${y}" r="${s.r2}" fill="rgba(226,91,69,.05)" stroke="#e25b45" stroke-width="3"/>
      <path class="draw delay2" d="M${s.x1} ${y} L${px.toFixed(1)} ${py.toFixed(1)} L${s.x2} ${y} Z" fill="rgba(226,163,37,.25)" stroke="#1b2430" stroke-width="3"/>
      <circle cx="${s.x1}" cy="${y}" r="4" fill="#1b2430"/><circle cx="${s.x2}" cy="${y}" r="4" fill="#1b2430"/>
      <text x="180" y="28" text-anchor="middle" font-size="16" font-weight="700" fill="#1b2430">${s.label}</text>
    `, "0 0 360 240");
  }

  function renderScene(scene) {
    if (!scene) return "";
    switch (scene.kind) {
      case "learning-cards":
        return `<div class="learning-cards">${scene.items.map((item,i) => `<div class="learning-tile ${i === scene.active ? "focus-tile" : ""}" style="--tile-i:${i}"><small>${i+1}. adım</small><strong>${item}</strong></div>`).join("")}</div>`;
      case "point":
        return wrap(`<circle class="pop" cx="180" cy="110" r="8" fill="#e25b45"/><text x="180" y="148" text-anchor="middle" font-size="18" fill="#1b2430">A noktası</text>`);
      case "segment":
        return wrap(`<line class="draw" x1="70" y1="120" x2="290" y2="120" stroke="#1b2430" stroke-width="4" stroke-linecap="round"/><circle class="pop" cx="70" cy="120" r="6" fill="#2c6bed"/><circle class="pop" cx="290" cy="120" r="6" fill="#e25b45"/><text x="70" y="148" text-anchor="middle">A</text><text x="290" y="148" text-anchor="middle">B</text><text x="180" y="78" text-anchor="middle" font-size="16" fill="#3d4a5c">[AB] doğru parçası</text>`);
      case "ray":
        return wrap(`<line class="draw" x1="60" y1="120" x2="300" y2="120" stroke="#1b2430" stroke-width="4"/><polygon class="pop" points="300,120 282,112 282,128" fill="#1b2430"/><circle cx="60" cy="120" r="6" fill="#e25b45"/><text x="60" y="150" text-anchor="middle">A</text><text x="180" y="78" text-anchor="middle" font-size="16">Başlangıcı var, diğer uç sonsuz</text>`);
      case "line":
        return wrap(`<line class="draw" x1="30" y1="120" x2="330" y2="120" stroke="#1b2430" stroke-width="4"/><polygon points="330,120 312,112 312,128" fill="#1b2430"/><polygon points="30,120 48,112 48,128" fill="#1b2430"/><text x="180" y="78" text-anchor="middle" font-size="16">d doğrusu · iki uç da sonsuz</text>`);
      case "trio":
        return `<div class="trio">
          <div><p>Doğru parçası</p>${renderScene({ kind: "segment" })}</div>
          <div><p>Işın</p>${renderScene({ kind: "ray" })}</div>
          <div><p>Doğru</p>${renderScene({ kind: "line" })}</div>
        </div>`;
      case "angle":
        return angleSvg(scene.deg, { show: !!scene.show });
      case "circle":
        return circleSvg(scene);
      case "disk":
        return wrap(`<circle cx="110" cy="110" r="70" fill="none" stroke="#2c6bed" stroke-width="8"/><text x="110" y="200" text-anchor="middle">Çember</text><circle cx="250" cy="110" r="70" fill="#2c6bed"/><text x="250" y="200" text-anchor="middle">Daire</text>`);
      case "perp":
        return wrap(`<line class="draw" x1="40" y1="150" x2="320" y2="150" stroke="#1b2430" stroke-width="4"/><line class="draw delay" x1="180" y1="40" x2="180" y2="150" stroke="#e25b45" stroke-width="4"/><path d="M180 122 L208 122 L208 150" fill="none" stroke="#1c8c74" stroke-width="3"/><circle cx="180" cy="40" r="6" fill="#2c6bed"/><text x="196" y="36">A</text><text x="300" y="142">d</text>`);
      case "parallel":
        return wrap(`<line class="draw" x1="40" y1="70" x2="320" y2="70" stroke="#2c6bed" stroke-width="4"/><line class="draw delay" x1="40" y1="150" x2="320" y2="150" stroke="#e25b45" stroke-width="4"/><line x1="70" y1="70" x2="70" y2="150" stroke="#1c8c74" stroke-width="2" stroke-dasharray="4 3"/><line x1="250" y1="70" x2="250" y2="150" stroke="#1c8c74" stroke-width="2" stroke-dasharray="4 3"/><text x="180" y="200" text-anchor="middle" font-size="15">Uzaklık hep aynı · AB // CD</text>`);
      case "intersect":
        return wrap(`<line class="draw" x1="40" y1="180" x2="300" y2="40" stroke="#2c6bed" stroke-width="4"/><line class="draw delay" x1="40" y1="40" x2="300" y2="180" stroke="#e25b45" stroke-width="4"/><text x="180" y="28" text-anchor="middle">Tek ortak nokta</text>`);
      case "coincident":
        return wrap(`<line x1="40" y1="108" x2="320" y2="108" stroke="#2c6bed" stroke-width="8" stroke-linecap="round"/><line class="draw" x1="40" y1="108" x2="320" y2="108" stroke="#f4efe6" stroke-width="2" stroke-dasharray="10 8"/><text x="180" y="160" text-anchor="middle">Çakışık doğrular · bütün noktalar ortak</text>`);
      case "transversal":
        return wrap(`<line x1="30" y1="60" x2="300" y2="60" stroke="#2c6bed" stroke-width="4"/><line x1="30" y1="160" x2="300" y2="160" stroke="#2c6bed" stroke-width="4"/><line class="draw" x1="70" y1="20" x2="250" y2="200" stroke="#e25b45" stroke-width="4"/><text x="180" y="24" text-anchor="middle" font-size="14">İki paralel ve bir kesen</text>`);
      case "polygon":
        return polygonSvg(scene.n || 5);
      case "triangles":
        return wrap(`
          <polygon points="40,160 90,60 140,160" fill="rgba(44,107,237,.15)" stroke="#2c6bed" stroke-width="3"/>
          <polygon points="170,160 230,70 290,160" fill="rgba(28,140,116,.15)" stroke="#1c8c74" stroke-width="3"/>
          <path d="M230 130 L250 130 L250 150" fill="none" stroke="#1c8c74" stroke-width="2"/>
          <polygon points="300,150 360,40 390,170" fill="rgba(226,91,69,.15)" stroke="#e25b45" stroke-width="3"/>
          <text x="90" y="190" text-anchor="middle" font-size="12">Dar</text>
          <text x="230" y="190" text-anchor="middle" font-size="12">Dik</text>
          <text x="345" y="200" text-anchor="middle" font-size="12">Geniş</text>
        `, "0 0 420 220");
      case "construct":
        return constructSvg(scene.mode);
      case "grid":
        return gridHtml(scene);
      case "pair":
        return `<div class="pair">${gridHtml(scene.left)}${gridHtml(scene.right)}</div>`;
      case "place":
        return placeHtml(scene.digits);
      case "life":
        return lifeSvg(scene.id);
      case "art":
        return `<div class="stage art-stage">${scene.html}</div>`;
      case "formula":
        return `<div class="formula">${(scene.lines || []).map((l) => `<p>${l}</p>`).join("")}</div>`;
      default:
        return "";
    }
  }

  function lifeSvg(id) {
    if (id === "door") {
      return wrap(`<rect x="120" y="30" width="120" height="160" fill="#fff" stroke="#1b2430" stroke-width="4"/><path d="M240 190 L240 150 L200 150" fill="none" stroke="#1c8c74" stroke-width="3"/><text x="180" y="214" text-anchor="middle" font-size="14">Kapı köşesi dik açıdır</text>`);
    }
    if (id === "rails") {
      return wrap(`<line x1="40" y1="80" x2="320" y2="80" stroke="#5c6b7a" stroke-width="6"/><line x1="40" y1="140" x2="320" y2="140" stroke="#5c6b7a" stroke-width="6"/><g stroke="#c47b4a" stroke-width="4">${[60, 110, 160, 210, 260, 310].map((x) => `<line x1="${x}" y1="70" x2="${x - 20}" y2="150"/>`).join("")}</g><text x="180" y="190" text-anchor="middle" font-size="14">Raylar paraleldir</text>`);
    }
    if (id === "rug") {
      return wrap(`<rect x="50" y="40" width="260" height="140" rx="8" fill="#f6e2c4" stroke="#1b2430" stroke-width="3"/><rect x="70" y="58" width="70" height="104" fill="#e25b45"/><rect x="150" y="58" width="140" height="48" fill="#2c6bed"/><rect x="150" y="114" width="140" height="48" fill="#1c8c74"/><text x="180" y="210" text-anchor="middle" font-size="14">Halı dikdörtgen parçalardan oluşur</text>`);
    }
    return wrap(`<text x="180" y="110" text-anchor="middle"> </text>`);
  }

  function pairParts(deg, total, hideMissing) {
    const cx = 180, cy = 176, r = 100;
    const sector = (start, end, color) => {
      if (start === end) return '';
      const a = ray(cx,cy,start,r), b = ray(cx,cy,end,r);
      return `<path d="M${cx} ${cy} L${a[0]} ${a[1]} A${r} ${r} 0 0 0 ${b[0]} ${b[1]} Z" fill="${color}"/>`;
    };
    const label = (start,end,text,color) => {
      if (end-start < 16) return '';
      const p = ray(cx,cy,(start+end)/2,67);
      return `<text x="${p[0]}" y="${p[1]}" text-anchor="middle" dominant-baseline="middle" font-size="15" font-weight="800" fill="${color}">${text}°</text>`;
    };
    const end = ray(cx,cy,total,112);
    return sector(0,deg,'#f6b09d') + sector(deg,total,'#9ad7cc') +
      `<path d="M292 176 H180 L${end[0]} ${end[1]}" fill="none" stroke="#244e41" stroke-width="3"/>` +
      label(0,deg,deg,'#7b291b') + (hideMissing ? '' : label(deg,total,total-deg,'#145344'));
  }

  function pairSvg(deg,total,hideMissing) {
    return dialSvg(deg).replace('<path d=', `<g id="pairSectors">${pairParts(deg,total,hideMissing)}</g><path d=`);
  }

  root.MatVisuals = {
    pairSvg, pairParts,
    renderScene,
    dialSvg,
    ray,
    arc,
    vertex: { x: 180, y: 176 }
  };
})(typeof window !== "undefined" ? window : globalThis);
