// Seviye 0 ayrı bir havuzdur. 0, eski oyunlarda rastgele seviye anlamını korur.
(function (root) {
  "use strict";
  const LEVEL = { id: "foundation", name: "Seviye 0", points: 5, color: "#187c78", icon: "◎" };
  const TOPIC = "m7-siralama", KEY = "mat-foundation-v1";
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fraction = (n, d) => d === 1 ? String(n) : `${n}/${d}`;
  const decimal = n => String(n).replace(".", ",");
  const cards = (...values) => `<div class="f0-cards">${values.map(v => `<span>${esc(v)}</span>`).join("")}</div>`;
  const compare = (a, b) => a < b ? "<" : a > b ? ">" : "=";
  const cmpFraction = (a, b) => Math.sign(a[0] * b[1] - b[0] * a[1]);
  let serial = 0, history = {};
  try { history = JSON.parse(root.localStorage?.getItem(KEY) || "{}") || {}; } catch (_) { /* yerel kayıt isteğe bağlı */ }
  const templates = [];
  const add = (id, make) => templates.push({ id, make });
  function choice(rng, prompt, answer, wrongs, explain, html, data, hint) {
    answer = String(answer);
    const alternatives = [...new Set(wrongs.map(String))].filter(x => x !== answer).slice(0, 3);
    return { kind: "mc", prompt, answer, choices: root.MatGames.shuffle(rng, [answer, ...alternatives]), explain,
      hint: hint || "İşaretleri ve eşitsizliğin sıkı mı, eşitliğe izin veren türde mi olduğunu kontrol et.",
      scene: { kind: "art", html: html || cards(prompt) }, data };
  }
  function relation(rng, a, b, labels, rule) {
    const sign = cmpFraction(a, b), answer = sign < 0 ? "<" : sign > 0 ? ">" : "=";
    const expression = `${labels[0]} … ${labels[1]}`;
    return choice(rng, `Boşluğa <, > veya = işaretlerinden hangisi gelmeli? ${expression}`, answer, ["<", ">", "="],
      `${rule} Çapraz çarpımlar ${a[0] * b[1]} ve ${b[0] * a[1]}. Sonuç: ${labels[0]} ${answer} ${labels[1]}.`, cards(labels[0], "?", labels[1]), { a, b }, rule);
  }
  add("es-payda", ({ri,rng}) => {
    const d = ri(3, 24), a = ri(-35, 35), b = ri(-35, 35);
    return relation(rng,[a,d],[b,d],[fraction(a,d),fraction(b,d)],"Pozitif paydalar eşitse payları karşılaştır.");
  });
  add("es-pay", ({ri,rng}) => {
    const n = ri(1, 25) * (ri(0,1) ? -1 : 1), d = ri(2, 20), e = d + ri(1, 12);
    return relation(rng,[n,d],[n,e],[fraction(n,d),fraction(n,e)],n < 0 ? "Negatif sayılarda sıfıra yakın olan daha büyüktür." : "Pozitif ve eş paylı kesirlerde paydası küçük olan daha büyüktür.");
  });
  add("farkli-payda", ({ri,rng}) => {
    const a = [ri(-45,45),ri(2,18)], b = [ri(-45,45),ri(2,18)];
    return relation(rng,a,b,[fraction(...a),fraction(...b)],"Paydaları pozitif tutarak çapraz çarpım yapabilirsin.");
  });
  add("tam-sayi-kesir", ({ri,rng}) => {
    const a=ri(-12,12), d=ri(2,12), n=a*d+ri(-d,d);
    return relation(rng,[a,1],[n,d],[String(a),fraction(n,d)],"Tam sayıyı kesrin paydasıyla genişlet.");
  });
  add("esit-kesir", ({ri,rng}) => {
    const n=ri(-24,24), d=ri(2,16), k=ri(2,7);
    return relation(rng,[n,d],[n*k,d*k],[fraction(n,d),fraction(n*k,d*k)],"Pay ve paydayı aynı pozitif sayıyla çarpmak değeri değiştirmez.");
  });
  add("ondalik", ({ri,rng}) => {
    const n=ri(-150,150), d=ri(2,16), b=ri(-120,120);
    return relation(rng,[n,d],[b,10],[fraction(n,d),decimal(b/10)],"Ondalık sayıyı paydası 10 olan kesre çevir.");
  });
  add("mutlak-karsilastirma", ({ri,rng}) => {
    const a=[ri(-24,24),ri(2,15)], n=ri(1,24), d=ri(2,15);
    return relation(rng,a,[n,d],[fraction(...a),`|−${n}/${d}|`],"Mutlak değer sıfıra uzaklıktır ve negatif olmaz.");
  });
  add("tam-sayili-kesir", ({ri,rng}) => {
    const d=ri(2,12), e=ri(2,12), w=ri(1,12), v=ri(1,12), a=ri(1,d-1), b=ri(1,e-1), sign=ri(0,1)?-1:1;
    return relation(rng,[sign*(w*d+a),d],[sign*(v*e+b),e],[`${sign<0?"−":""}${w} tam ${a}/${d}`,`${sign<0?"−":""}${v} tam ${b}/${e}`],"Negatif tam sayılı kesirde eksi işareti sayının tamamına aittir.");
  });
  for (const above of [false,true]) add(above ? "ust-tam-sayi" : "alt-tam-sayi", ({ri,rng}) => {
    const n=ri(-150,150), d=ri(2,15), value=n/d, answer=above?Math.floor(value)+1:Math.ceil(value)-1;
    return choice(rng,`${fraction(n,d)} sayısından ${above?"büyük en küçük":"küçük en büyük"} tam sayı hangisidir?`,answer,[answer-1,answer+1,answer+2],
      `Önce ${fraction(n,d)} = ${decimal(Math.round(value*1000)/1000)}${n%d?"…":""} bulunur. Eşitlik kabul edilmez; aranan tam sayı ${answer}.`,cards(fraction(n,d),above?"< ?":" > ?"),{n,d,above});
  });
  add("cift-tek-sinir", ({ri,rng}) => {
    const edge=ri(-150,150), parity=ri(0,1), below=!!ri(0,1);
    let answer=edge+(below?-1:1);if(Math.abs(answer)%2!==parity)answer+=below?-1:1;
    return choice(rng,`${edge} sayısından ${below?"küçük en büyük":"büyük en küçük"} ${parity?"tek":"çift"} tam sayı hangisidir?`,answer,[answer-2,answer+2,edge],
      `Eşitlik alınmaz. ${edge} sınırının ${below?"solundaki":"sağındaki"} ilk ${parity?"tek":"çift"} tam sayı ${answer}.`,cards(`${edge}`,parity?"Tek sayı":"Çift sayı"),{edge,parity,below});
  });
  add("basamakli-tam-sayi", ({ri,rng}) => {
    const digits=ri(1,4), negative=!!ri(0,1), largest=!!ri(0,1), distinct=digits>1&&!!ri(0,1);
    const lo=digits===1?1:10**(digits-1), hi=10**digits-1;
    let candidates=Array.from({length:hi-lo+1},(_,i)=>lo+i).filter(n=>!distinct||new Set(String(n)).size===digits).map(n=>negative?-n:n);
    const answer=largest?Math.max(...candidates):Math.min(...candidates);
    return choice(rng,`${digits} basamaklı${distinct?", rakamları farklı":""} en ${largest?"büyük":"küçük"} ${negative?"negatif":"pozitif"} tam sayı hangisidir?`,answer,[answer-1,answer+1,-answer],
      `İşaret ve basamak koşulunu sağlayan sayılar karşılaştırılır. Negatiflerde mutlak değer arttıkça sayı küçülür. Cevap ${answer}.`,cards(`${digits} basamak`,negative?"Negatif":"Pozitif",largest?"En büyük":"En küçük"),{digits,negative,largest,distinct});
  });
  add("negatif-mutlak", ({ri,rng}) => {
    const n=ri(1,500);
    return choice(rng,`Mutlak değeri ${n} olan negatif tam sayı hangisidir?`,-n,[n,0,-n-1],`|−${n}| = ${n}. Negatif olan çözüm −${n}.`,cards(`| ? | = ${n}`,"Negatif"),{n});
  });
  add("eksik-pay", ({ri,rng}) => {
    const n=ri(-35,35), d=ri(2,15), e=ri(2,24), answer=Math.ceil(n*e/d)-1;
    return choice(rng,`${fraction(n,d)} > a/${e} eşitsizliğini sağlayan en büyük a tam sayısı kaçtır?`,answer,[answer-1,answer+1,answer+2],
      `Paydalar pozitif: a < (${n} × ${e})/${d}. Bu sınırdan küçük en büyük tam sayı ${answer}.`,cards(fraction(n,d),">",`a/${e}`),{n,d,e},"Her iki tarafı pozitif paydalarla çarp; eşitsizliğin yönü değişmez.");
  });
  add("eksik-tam-sayili-pay", ({ri,rng}) => {
    const d=ri(3,15), whole=ri(1,8), part=ri(2,d-1), n=whole*d+part, answer=part-1;
    return choice(rng,`${n}/${d} > ${whole} tam a/${d} eşitsizliğinde a, 0 ≤ a < ${d} koşulunu sağlayan tam sayıdır. En büyük a kaçtır?`,answer,[answer-1,answer+1,d],
      `${n}/${d} = ${whole} tam ${part}/${d}. Tam kısımlar ve paydalar aynı: a < ${part}. En büyük a = ${answer}.`,cards(`${n}/${d}`,">",`${whole} tam a/${d}`),{d,whole,part});
  });
  add("eksik-payda", ({ri,rng}) => {
    const n=ri(2,18), tenths=ri(2,15), answer=Math.ceil(10*n/tenths)-1;
    return choice(rng,`${n}/c > ${decimal(tenths/10)} eşitsizliğini sağlayan en büyük pozitif c tam sayısı kaçtır?`,answer,[answer-1,answer+1,answer+2],
      `c > 0 olduğundan ${10*n} > ${tenths}c, yani c < ${10*n}/${tenths}. En büyük pozitif tam sayı ${answer}.`,cards(`${n}/c`,">",decimal(tenths/10)),{n,tenths},"c pozitif olduğundan çarparken eşitsizliğin yönü korunur.");
  });
  add("cubuk-araligi", ({ri,rng}) => {
    const d=ri(8,30), low=ri(1,d-6), high=low+ri(3,6), first=low+1, last=high-1;
    const answer=Array.from({length:last-first+1},(_,i)=>first+i).join(", ");
    const list=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i).join(", ");
    const html=`<div class="f0-rods"><div style="--rod:92%;--rod-color:#e18b19"><i></i><b>${high}/${d} m · Turuncu</b></div><div style="--rod:${92*(low+high)/2/high}%;--rod-color:#98729e"><i></i><b>■/${d} m · Mor</b></div><div style="--rod:${92*low/high}%;--rod-color:#2094b2"><i></i><b>${low}/${d} m · Mavi</b></div></div>`;
    return choice(rng,`Üç çubuğun uzunlukları farklıdır. En uzun turuncu, en kısa mavidir. Mor çubuktaki ■ yerine gelebilecek tam sayıların tamamı hangisidir?`,answer,[list(low,high),list(first,high),list(low,last)],
      `${low}/${d} < ■/${d} < ${high}/${d}; dolayısıyla ${low} < ■ < ${high}. Değerler: ${answer}.`,html,{d,low,high},"Çubuklar farklı uzunlukta; iki sınır da alınmaz. Çizim temsilidir.");
  });
  add("donma-noktasi", ({ri,rng}) => {
    const tenths=-(ri(5,55)*10+ri(1,9)), edge=tenths/10, highest=Math.ceil(edge)-1;
    const answer=`${highest} ve ${highest-1}`;
    return choice(rng,`Bir karışım ${decimal(edge)} °C ve altında donar. Donmaya karşı korumanın yetersiz kaldığı sıcaklıklara örnek olan iki tam sayı hangisidir?`,answer,
      [`${highest+1} ve ${highest+2}`,`${highest} ve ${highest+1}`,`${-highest} ve ${1-highest}`],
      `Sıcaklık ${decimal(edge)} °C veya daha düşük olmalı. ${highest} ve ${highest-1} bu koşulu sağlar.`,cards(`Donma sınırı: ${decimal(edge)} °C`,"Daha soğuk →"),{tenths},"Negatiflerde mutlak değeri büyük sıcaklık daha düşüktür.");
  });
  add("isi-akisi", ({ri,rng}) => {
    const pairs=Array.from({length:4},()=>{const a=ri(-400,600),b=a+ri(1,250);return ri(0,1)?[a,b]:[b,a];}), wrong=ri(0,3);
    const arrows=pairs.map((p,i)=>(p[0]>p[1])!==(i===wrong)?"→":"←");
    const labels=pairs.map((p,i)=>`${decimal(p[0]/10)} °C ${arrows[i]} ${decimal(p[1]/10)} °C`);
    return choice(rng,"Farklı sıcaklıktaki iki cisim temas ediyor. Isı akışının yönü hangi seçenekte yanlış gösterilmiştir?",labels[wrong],labels,
      `Isı sıcaklığı yüksek olandan düşük olana akar. ${decimal(Math.max(...pairs[wrong])/10)} °C > ${decimal(Math.min(...pairs[wrong])/10)} °C; doğru yön ${pairs[wrong][0]>pairs[wrong][1]?"soldan sağa":"sağdan sola"} olmalıdır.`,
      `<div class="f0-heat">${labels.map(l=>`<span>${esc(l)}</span>`).join("")}</div>`,{pairs,wrong},"Eksi işaretine dikkat ederek sıcaklıkları karşılaştır.");
  });
  add("fanus-siralama", ({ri,rng}) => {
    // Bir ortak paydada tam sayı anahtarlar: kayan noktalı eşitlik kullanılmaz.
    const nums=root.MatGames.shuffle(rng,Array.from({length:14},(_,i)=>-i-1)).slice(0,3), d=ri(2,8), dens=[d,d+ri(1,4)];
    const values=nums.flatMap(n=>dens.map(e=>[n,e]));
    const unique=values.filter((v,i)=>values.findIndex(w=>cmpFraction(v,w)===0)===i).sort(cmpFraction);
    const format=arr=>arr.map(v=>fraction(...v)).join(" < "), answer=format(unique);
    const shuffled=[unique[1],unique[0],...unique.slice(2)];
    return choice(rng,"İlk fanustan pay, ikinci fanustan payda seçiliyor; toplar geri konuluyor. Oluşabilen farklı rasyonel sayıların küçükten büyüğe doğru tam sıralaması hangisidir?",answer,
      [format([...unique].reverse()),format(shuffled),format(unique.slice(1))],
      `Her payı her paydayla eşleştir (${values.length} seçim). Eşit değerleri bir kez al ve sırala: ${answer}.`,
      `<div class="f0-urns"><div><small>PAY FANUSU</small>${nums.map(n=>`<b>${n}</b>`).join("")}</div><div><small>PAYDA FANUSU</small>${dens.map(n=>`<b>${n}</b>`).join("")}</div></div>`,{nums,dens},"Negatif kesirlerde sıfıra en uzak olan en küçüktür. Eşit kesirleri tekrar yazma.");
  });
  function generate(id, rng = Math.random, opts = {}) {
    if (id !== TOPIC) throw Error("Bu konunun Seviye 0 soruları henüz hazırlanmadı.");
    const ri=(a,b)=>a+Math.floor(rng()*(b-a+1));
    const st=history[id] ||= {uses:{},recent:[],last:null};
    const min=Math.min(...templates.map(t=>Number(st.uses[t.id])||0));
    const pool=templates.filter(t=>(Number(st.uses[t.id])||0)===min && t.id!==st.last);
    const candidates=opts.repeatable?templates:pool.length?pool:templates.filter(t=>(Number(st.uses[t.id])||0)===min);
    const t=templates.find(t=>t.id===opts.template)||candidates[ri(0,candidates.length-1)];
    let q,signature;
    for(let i=0;i<80;i++) {
      q=t.make({ri,rng}); signature=root.MatLevelGen.hashText(q.prompt+"|"+q.answer+"|"+q.scene.html).toString(36);
      if(opts.repeatable||!st.recent.includes(signature))break;
    }
    if(!opts.repeatable) {
      st.uses[t.id]=(Number(st.uses[t.id])||0)+1;st.last=t.id;
      st.recent.push(signature);st.recent=st.recent.slice(-80);
      try { root.localStorage?.setItem(KEY,JSON.stringify(history)); } catch (_) { /* soru üretimi devam eder */ }
    }
    return {...q,id:`f0:${id}:${Date.now().toString(36)}:${serial++}`,level:LEVEL.id,points:LEVEL.points,generated:true,templateId:t.id,
      outcome:"Rasyonel sayıları karşılaştırır, sıralar ve tam sayı sınırlarını belirler."};
  }
  root.MatFoundation={LEVEL,has:id=>id===TOPIC,generate,templates:templates.map(t=>t.id)};
})(typeof window !== "undefined" ? window : globalThis);
