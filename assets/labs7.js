(function(root){
  'use strict';
  const F=root.Mat7Figures;
  const fmt=n=>Number(n).toLocaleString('tr-TR',{maximumFractionDigits:4});
  const slider=(key,label,value,min,max)=>`<label>${label} <input type="range" data-lab-value="${key}" min="${min}" max="${max}" value="${value}"></label>`;
  function html(kind){
    let controls='';
    if(kind==='m7-number')controls=slider('a','Başlangıç sayısı',-4,-20,20)+slider('b','Eklenecek sayı',7,-20,20);
    if(kind==='m7-prism')controls=slider('a','Uzunluk (cm)',6,1,12)+slider('b','Genişlik (cm)',4,1,12)+slider('c','Yükseklik (cm)',3,1,12);
    if(kind==='m7-mirror')controls=slider('d','Aynaya dik uzaklık (birim)',3,0,8);
    if(kind==='m7-stats')controls='<label>Veriler (noktalı virgülle ayır; ondalık için virgül kullan)<input type="text" data-lab-value="data" value="2; 4; 4; 10" maxlength="400" autocomplete="off"></label>';
    return `<div class="m7-lab" data-lab="${kind}"><div class="sliders">${controls}</div><div data-lab-output aria-live="polite"></div></div>`;
  }
  function statistics(raw){
    const parts=String(raw).split(';').map(s=>s.trim());
    if(!parts.length||parts.length>40||parts.some(s=>!/^[-−]?\d+(?:,\d+)?$/.test(s)))return null;
    const values=parts.map(s=>Number(s.replace('−','-').replace(',','.')));
    if(values.some(n=>!Number.isFinite(n)||Math.abs(n)>1000000))return null;
    const sorted=[...values].sort((a,b)=>a-b),n=values.length,mean=values.reduce((a,b)=>a+b,0)/n;
    const median=n%2?sorted[(n-1)/2]:(sorted[n/2-1]+sorted[n/2])/2;
    const counts=new Map();values.forEach(v=>counts.set(v,(counts.get(v)||0)+1));
    const peak=Math.max(...counts.values());
    return {values,mean,median,range:sorted[n-1]-sorted[0],mad:values.reduce((s,v)=>s+Math.abs(v-mean),0)/n,modes:peak===1?[]:[...counts].filter(([,v])=>v===peak).map(([v])=>v)};
  }
  function paint(host){
    const get=key=>host.querySelector(`[data-lab-value="${key}"]`).value;
    const output=host.querySelector('[data-lab-output]');let content='';
    if(host.dataset.lab==='m7-number'){
      const a=+get('a'),b=+get('b'),end=a+b;
      const x=v=>210+v*4.5;
      content=`<svg viewBox="0 0 420 180" role="img" aria-label="Sayı doğrusunda toplama"><line x1="20" y1="100" x2="400" y2="100" stroke="#1f2547" stroke-width="2"/>${[-40,-20,0,20,40].map(n=>`<text x="${x(n)}" y="145" text-anchor="middle">${n}</text>`).join('')}<line x1="${x(a)}" y1="80" x2="${x(end)}" y2="80" stroke="#1c8c74" stroke-width="5"/><circle cx="${x(a)}" cy="100" r="6" fill="#2c6bed"/><circle cx="${x(end)}" cy="100" r="6" fill="#e25b45"/><text x="${x(a)}" y="35" text-anchor="middle">Başlangıç ${a}</text><text x="${x(end)}" y="60" text-anchor="middle">Son ${end}</text></svg>`+F.cards([`${a} + (${b}) = ${end}`,b>0?`${b} birim sağa`:b<0?`${-b} birim sola`:'Konum değişmez']);
    }
    if(host.dataset.lab==='m7-prism'){
      const a=+get('a'),b=+get('b'),c=+get('c');
      content=F.prism(a,b,c)+F.cards([`Yüzey alanı = 2 × (${a*b} + ${a*c} + ${b*c}) = ${2*(a*b+a*c+b*c)} cm²`,`Hacim = ${a} × ${b} × ${c} = ${a*b*c} cm³`]);
    }
    if(host.dataset.lab==='m7-mirror'){
      const d=+get('d'),left=210-d*20,right=210+d*20;
      content=`<svg viewBox="0 0 420 210" role="img" aria-label="Eşit uzaklıklı yansıma noktaları"><line x1="210" y1="15" x2="210" y2="190" stroke="#8a4fd8" stroke-width="3"/><line x1="${left}" y1="100" x2="${right}" y2="100" stroke="#2c6bed" stroke-width="2"/><circle cx="${left}" cy="100" r="7" fill="#e25b45"/><circle cx="${right}" cy="100" r="7" fill="#1c8c74"/><text x="${left}" y="70" text-anchor="middle">A</text><text x="${right}" y="130" text-anchor="middle">A′</text></svg>`+F.cards([`Aynaya uzaklık: ${d} birim`,`AA′ = ${2*d} birim`,d===0?'Ayna üzerindeki nokta sabit kalır.':'İki nokta aynaya eşit dik uzaklıkta.']);
    }
    if(host.dataset.lab==='m7-stats'){
      const s=statistics(get('data'));
      content=s?F.cards([`Gözlem sayısı: ${s.values.length}`,`Ortalama: ${fmt(s.mean)} · Ortanca: ${fmt(s.median)}`,`Tepe değer: ${s.modes.length?s.modes.map(fmt).join('; '):'Yok (her değer bir kez)'}`,`Açıklık: ${fmt(s.range)} · OMS: ${fmt(s.mad)}`,`Ortalama ± OMS: ${fmt(s.mean-s.mad)} ile ${fmt(s.mean+s.mad)}`])+'<p class="fine">Sonuçlar gerektiğinde dört ondalık basamağa yuvarlanır.</p>':'<p role="status">1–40 sayı yaz. Sayıları noktalı virgülle ayır: 2,5; 4; 7,5. Her sayının mutlak değeri en fazla 1.000.000 olabilir.</p>';
    }
    output.innerHTML=content;
  }
  function bind(container){const host=container.querySelector('.m7-lab');if(!host)return;host.addEventListener('input',()=>paint(host));paint(host);}
  root.Mat7Labs={html,bind,statistics};
  const extra={
    tamsayilar:['m7-number','Sayı doğrusunu yönet','Başlangıç sayısını ve eklenecek sayıyı değiştir. Negatif bir sayı eklediğinde sola, pozitif eklediğinde sağa ilerlediğini izle.'],
    tamsayiislemler:['m7-number','Toplamayı hareketle göster','Bir sayıyı çıkarmak için karşıtını ekle. Örneğin −4 − (−7) işlemini başlangıç −4, eklenecek +7 olarak kur.'],
    acinim:['m7-prism','Kutunun kenarlarını değiştir','Bir ayrıtı değiştirirken yüzey alanına bak. Hangi iki yüz çifti etkileniyor? Alanı ve hacmi ayrı birimlerle oku.'],
    hacim:['m7-prism','Hacim laboratuvarı','Uzunluğu iki katına çıkar. Diğer ayrıtlar sabitken hacmin nasıl değiştiğini izle. Sonra üç ayrıtı da iki katına çıkarmayı dene.'],
    analiz:['m7-stats','Verini incele','Kendi veri grubunu noktalı virgülle ayırarak yaz. Bir uç değer eklediğinde ortalama ve ortancanın nasıl değiştiğini karşılaştır.'],
    yorumlama:['m7-stats','İstatistik laboratuvarı','Önce 8; 10; 12, sonra 4; 10; 16 yaz. Ortalamalar aynı kalırken açıklığın ve ortalama mutlak sapmanın nasıl değiştiğini incele.'],
    yansima:['m7-mirror','Aynada hareket','Noktayı aynadan uzaklaştır. Görüntüsünün aynı uzaklığa gittiğini izle. Uzaklığı sıfıra indirince iki nokta üst üste gelir.'],
    insa:['m7-mirror','Orta dikmeyi keşfet','A ve A′ noktaları arasındaki parçaya bak. Ortadaki düşey doğru parçayı iki eş uzunluğa böler ve dik keser.']
  };
  for(const t of root.MatCurricula[7].topics){const row=extra[t.id.slice(3)];if(row)t.slides.splice(t.slides.length-1,0,{sandbox:row[0],h:row[1],p:row[2]});}
})(typeof window!=='undefined'?window:globalThis);
