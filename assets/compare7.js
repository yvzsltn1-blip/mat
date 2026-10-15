/* Karşılaştırma kuralları: aynı ölçekli modeller, tam kesir karşılaştırması. */
(function(root){
  'use strict';
  const modes={
    sign:{title:'Önce işarete bak',rule:'Pozitif sayı sıfırın sağında, negatif sayı solundadır. Pozitif olan her zaman daha büyüktür.',controls:[['a','A: pozitif pay',3,1,12],['b','A: payda',4,1,12],['c','B: negatif payın büyüklüğü',2,1,12],['d','B: payda',3,1,12]]},
    whole:{title:'Tam kısım karar verebilir',rule:'Pozitif tam sayılı kesirlerde önce tam kısımları karşılaştır. Tam kısımlar eşitse kesir kısımlarına bak.',controls:[['w','A: tam kısım',2,0,3],['z','B: tam kısım',1,0,3]]},
    benchmark:{title:'Sıfır, yarım ve bir ile karşılaştır',rule:'Payı paydanın yarısından küçükse kesir yarımdan küçüktür. Pay ve payda eşitse değer birdir. Aynı referansın aynı tarafındaki iki kesir için ek karşılaştırma gerekir.',controls:[['a','A: boyalı parça sayısı',4,0,12],['c','B: boyalı parça sayısı',9,0,12]]},
    denominator:{title:'Paydalar eşit: paylara bak',rule:'Paydaları pozitif ve eşit olan kesirlerde parçalar aynı büyüklüktedir. Boyalı parçası, yani payı büyük olan kesir daha büyüktür.',controls:[['a','A: pay',3,0,12],['c','B: pay',5,0,12],['b','Ortak payda',8,1,12]]},
    numerator:{title:'Paylar eşit: parça büyüklüğüne bak',rule:'Pozitif kesirlerde paylar eşitse paydası küçük olan daha büyüktür. Aynı bütün daha az parçaya ayrıldığında her parça büyür.',controls:[['a','Ortak pozitif pay',3,1,6],['b','A: payda',4,1,12],['d','B: payda',8,1,12]]},
    common:{title:'Pay veya payda eşitle',rule:'Pay ve paydayı aynı pozitif sayı ile çarpmak kesrin değerini değiştirmez. Yöntemi değiştirerek iki karşılaştırmanın aynı sonucu verdiğini gör.',controls:[['a','A: pay',2,1,12],['b','A: payda',3,1,12],['c','B: pay',3,1,12],['d','B: payda',4,1,12]]},
    decimal:{title:'Ondalık gösterimleri karşılaştır',rule:'Kesri payı paydaya bölerek ondalık gösterime dönüştür. Önce tam kısma, sonra onda birler, yüzde birler ve sonraki basamaklara bak. Devirli sayıda üç nokta devam eden basamakları gösterir.',controls:[['a','A: pay',3,0,12],['b','A: payda',4,1,12],['c','B: pay',7,0,12],['d','B: payda',10,1,12]]},
    negative:{title:'Negatiflerde sıralama tersine döner',rule:'Önce sıfıra uzaklıkları karşılaştır. Negatif sayılarda sıfıra daha yakın olan daha büyüktür. Pozitif karşılıkların sıralaması tersine döner.',controls:[['a','A: negatif payın büyüklüğü',3,1,12],['b','A: payda',4,1,12],['c','B: negatif payın büyüklüğü',2,1,12],['d','B: payda',3,1,12]]}
  };
  const gcd=(a,b)=>b?gcd(b,a%b):a;
  const lcm=(a,b)=>a/gcd(a,b)*b;
  const fraction=(a,b)=>`<span class="cmp-fraction" aria-label="${a} bölü ${b}"><span>${a<0?'−'+(-a):a}</span><span>${b}</span></span>`;
  function decimal(a,b){
    const sign=a<0?'−':'';a=Math.abs(a);let rem=a%b,answer=sign+Math.floor(a/b);
    if(!rem)return answer;
    answer+=',';
    for(let i=0;rem&&i<8;i++){rem*=10;answer+=Math.floor(rem/b);rem%=b;}
    return answer+(rem?'…':'');
  }
  function model(mode,raw={}){
    const config=modes[mode];if(!config)throw Error('Bilinmeyen karşılaştırma modeli');
    const v={};for(const [key,,initial,min,max] of config.controls){const n=Number(raw[key]??initial);v[key]=Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):initial;}
    let {a=3,b=8,c=5,d=8}=v;
    if(mode==='sign')c=-c;
    if(mode==='whole'){a=v.w*8+3;c=v.z*8+5;}
    if(mode==='benchmark'){b=d=12;}
    if(mode==='denominator')d=b;
    if(mode==='numerator')c=a;
    if(mode==='negative'){a=-a;c=-c;}
    const diff=a*d-c*b;
    return {a,b,c,d,values:v,relation:diff>0?'>':diff<0?'<':'=',left:a/b,right:c/d};
  }
  function html(kind){
    const mode=kind.slice('m7-compare-'.length),config=modes[mode];if(!config)return '';
    return `<div class="cmp-lab" data-compare="${mode}"><p class="cmp-instruction">Kaydırıcıları değiştir; iki kesri aynı büyüklükteki bütünlerle karşılaştır.</p><div class="cmp-controls">${config.controls.map(([key,label,value,min,max])=>`<label>${label}: <output data-cmp-label="${key}">${value}</output><input type="range" data-cmp="${key}" aria-label="${label}" min="${min}" max="${max}" value="${value}"></label>`).join('')}</div>${mode==='common'?'<label class="cmp-method">Yöntem <select data-cmp-method><option value="denominator">Paydaları eşitle</option><option value="numerator">Payları eşitle</option></select></label>':''}<div data-cmp-output aria-live="polite"></div></div>`;
  }
  function strip(a,b,total,label,color){
    const value=Math.abs(a)/b,u=330/total;let s='';
    for(let w=0;w<total;w++){
      s+=`<rect x="${45+w*u}" y="24" width="${u}" height="28" fill="#f1f4f8" stroke="#7c8ba1"/>`;
      const fill=Math.max(0,Math.min(1,value-w));
      if(fill)s+=`<rect x="${45+w*u}" y="24" width="${fill*u}" height="28" fill="${color}" opacity=".8"/>`;
      for(let j=1;j<b;j++)s+=`<line x1="${45+(w+j/b)*u}" y1="24" x2="${45+(w+j/b)*u}" y2="52" stroke="#fff" stroke-width="1"/>`;
      s+=`<text x="${45+(w+.5)*u}" y="74" text-anchor="middle" font-size="11">${w+1}. bütün</text>`;
    }
    return `<svg viewBox="0 0 420 86" role="img" aria-label="${label}: ${Math.abs(a)} bölü ${b} büyüklük modeli"><text x="20" y="44" fill="${color}" font-size="20" font-weight="bold">${label}</text>${s}</svg>`;
  }
  function numberLine(m,benchmark){
    const min=Math.min(-0.15,m.left-.15,m.right-.15),max=Math.max(1.15,m.left+.15,m.right+.15),x=v=>35+350*(v-min)/(max-min);
    let s=`<line x1="20" y1="72" x2="400" y2="72" stroke="#526079" stroke-width="2"/><path d="M392 67 L400 72 L392 77" fill="none" stroke="#526079" stroke-width="2"/>`;
    const ticks=x(.5)-x(0)>=30?[[0,'0'],[.5,'1/2'],[1,'1']]:x(1)-x(0)>=24?[[0,'0'],[1,'1']]:[[0,'0']];
    for(const [v,label] of ticks)s+=`<line x1="${x(v)}" y1="66" x2="${x(v)}" y2="78" stroke="#526079"/><text x="${x(v)}" y="100" text-anchor="middle" font-size="14">${label}</text>`;
    if(benchmark)s+=`<line x1="${x(.5)}" y1="18" x2="${x(.5)}" y2="72" stroke="#d89a12" stroke-dasharray="4 3"/>`;
    s+=`<line x1="${x(m.left)}" y1="32" x2="${x(m.left)}" y2="72" stroke="#2c6bed"/><circle cx="${x(m.left)}" cy="72" r="7" fill="#2c6bed"/><text x="${x(m.left)}" y="22" text-anchor="middle" fill="#2c6bed" font-size="16">A</text><line x1="${x(m.right)}" y1="72" x2="${x(m.right)}" y2="120" stroke="#1c8c74"/><circle cx="${x(m.right)}" cy="72" r="4" fill="#1c8c74"/><text x="${x(m.right)}" y="140" text-anchor="middle" fill="#1c8c74" font-size="16">B</text>`;
    return `<svg viewBox="0 0 420 150" role="img" aria-label="Sayı doğrusu: A ${decimal(m.a,m.b)}, B ${decimal(m.c,m.d)}">${s}</svg><p class="cmp-caption">← Daha küçük <span>Sağa gittikçe büyür →</span></p>`;
  }
  function explanation(mode,m,method){
    const {a,b,c,d}=m;
    if(mode==='whole')return `A: ${m.values.w} tam ${fraction(3,8)} &nbsp; B: ${m.values.z} tam ${fraction(5,8)}. ${m.values.w===m.values.z?'Tamlar eşit; 3/8 < 5/8 olduğu için A küçüktür.':'Tam kısmı büyük olan daha büyüktür.'}`;
    if(mode==='common'){
      if(method==='numerator'){const p=lcm(a,c);return `Payları ${p} yap: ${fraction(a,b)} = ${fraction(p,b*p/a)} ve ${fraction(c,d)} = ${fraction(p,d*p/c)}. Pozitif paylar eşit; paydası küçük olan büyük.`;}
      const p=lcm(b,d);return `Paydaları ${p} yap: ${fraction(a,b)} = ${fraction(a*p/b,p)} ve ${fraction(c,d)} = ${fraction(c*p/d,p)}. Eş parçalarda payları karşılaştır.`;
    }
    if(mode==='decimal')return `A = ${decimal(a,b)} &nbsp; B = ${decimal(c,d)}. ${m.relation==='='?'Gösterimleri farklı olsa da değerler eşit.':'Basamakları soldan sağa karşılaştır.'} Üç nokta varsa basamaklar tekrar ederek sürer; sonuç tam kesir değerlerine göre bulunur.`;
    if(mode==='negative')return `Pozitif karşılıklar: ${fraction(-a,b)} ${m.relation==='>'?'&lt;':m.relation==='<'?'&gt;':'='} ${fraction(-c,d)}. ${m.relation==='='?'Uzaklıklar eşit; negatif değerler de eşit.':'Negatiflere dönünce sıralama tersine döner. Boyalı şeritler sıfıra uzaklığı gösterir.'}`;
    if(mode==='benchmark'){
      const place=(n)=>n===0?'sıfır':n<6?'sıfır ile yarım arasında':n===6?'tam yarım':n<12?'yarım ile bir arasında':'tam bir';
      return `A ${place(a)}, B ${place(c)}. ${a===c?'Değerler eşit.':(a<6&&c>6)||(c<6&&a>6)?'Yarımın sağındaki daha büyük.':'Bu örnekte paydalar da eşit; payları karşılaştırabilirsin.'}`;
    }
    return modes[mode].rule;
  }
  function render(mode,m,method='denominator'){
    const total=Math.max(1,Math.ceil(Math.max(Math.abs(m.left),Math.abs(m.right))));
    return `<div class="cmp-result"><span class="cmp-a">A ${fraction(m.a,m.b)}</span><strong>${m.relation==='<'?'&lt;':m.relation==='>'?'&gt;':'='}</strong><span class="cmp-b">${fraction(m.c,m.d)} B</span></div><div class="cmp-strips">${strip(m.a,m.b,total,'A','#2c6bed')}${strip(m.c,m.d,total,'B','#1c8c74')}</div>${(m.a<0||m.c<0)?'<p class="cmp-caption">Şeritler büyüklüğü (sıfıra uzaklığı) gösterir. İşaret ve sıralama için sayı doğrusuna bak.</p>':''}${numberLine(m,mode==='benchmark')}<div class="cmp-explanation">${explanation(mode,m,method)}</div>`;
  }
  function bind(container){
    const host=container.querySelector('.cmp-lab');if(!host)return;
    const paint=()=>{const raw={};host.querySelectorAll('[data-cmp]').forEach(input=>{raw[input.dataset.cmp]=input.value;host.querySelector(`[data-cmp-label="${input.dataset.cmp}"]`).textContent=input.value;});const m=model(host.dataset.compare,raw);host.querySelector('[data-cmp-output]').innerHTML=render(host.dataset.compare,m,host.querySelector('[data-cmp-method]')?.value);};
    host.addEventListener('input',paint);host.addEventListener('change',paint);paint();
  }
  const oldHtml=root.Mat7Labs.html,oldBind=root.Mat7Labs.bind;
  root.Mat7Labs.html=kind=>kind.startsWith('m7-compare-')?html(kind):oldHtml(kind);
  root.Mat7Labs.bind=container=>{oldBind(container);bind(container);};
  root.Mat7Compare={model,render,decimal,modes};
  const topic=root.MatCurricula[7].topics.find(t=>t.id==='m7-siralama');
  const checks={sign:['Pozitif bir kesir, negatif bir kesirden küçük olabilir mi?','Hayır. Pozitif sayılar sıfırın sağında, negatifler solundadır.'],whole:['2 tam 1/8 ile 1 tam 7/8 arasında hangisi büyük?','2 tam 1/8; tam kısmı daha büyük.'],benchmark:['5/12 ve 7/12 yarımın hangi tarafındadır?','5/12 yarımdan küçük, 7/12 yarımdan büyüktür; 5/12 < 7/12.'],denominator:['3/8 ile 5/8 arasında hangisi büyük?','5/8; aynı büyüklükteki parçalardan daha fazla var.'],numerator:['3/4 mü 3/8 mi büyük?','3/4. Aynı bütün dört parçaya ayrıldığında her parça daha büyüktür.'],common:['2/3 ile 3/4 nasıl karşılaştırılır?','Paydaları 12 yap: 8/12 < 9/12. Ya da payları 6 yap: 6/9 < 6/8.'],decimal:['3/4 ile 7/10 arasında hangisi büyük?','0,75 > 0,70; yani 3/4 > 7/10.'],negative:['−3/4 ile −2/3 arasında hangisi büyük?','−2/3 daha büyüktür. 3/4 > 2/3 iken −3/4 < −2/3 olur.']};
  topic.slides.splice(0,3,...Object.entries(modes).map(([key,m])=>({h:m.title,p:m.rule,sandbox:'m7-compare-'+key,check:{ask:checks[key][0],answer:checks[key][1]}})));
  const bullets=[
    'Pozitif rasyonel sayılar negatif rasyonel sayılardan büyüktür.',
    'Tam kısmı büyük olan pozitif rasyonel sayı daha büyüktür.',
    'Rasyonel sayılar karşılaştırılırken sıfıra (0), yarıma (1/2) ve bütüne (1) yakınlıklarından yararlanılabilir.',
    'Pay veya paydalar eşit değilse paylar ya da paydalar eşitlenerek sıralama yapılabilir.',
    'Pozitif rasyonel sayıların paydaları eşitse payı büyük olan daha büyüktür. Payları eşitse paydası küçük olan daha büyüktür.',
    'Rasyonel sayılar ondalık gösterimlerine göre de sıralanabilir.',
    'Negatif rasyonel sayılar sıralanırken önce pozitif karşılıkları sıralanır, sonra sıralamanın tersi alınır.'
  ];
  const intro='Rasyonel sayıları karşılaştırırken aşağıdaki kuralları kullanırız.';
  const tip='Sayı doğrusunda sağa doğru gidildikçe sayılar büyür, sola doğru gidildikçe sayılar küçülür.';
  topic.slides.unshift({h:'Rasyonel sayılarda sıralama ve karşılaştırma',p:[intro,...bullets,tip].join(' '),readingIntro:intro,bullets,readingTip:tip,nextLabel:'Etkileşimli örneklere geç →'});
})(typeof window!=='undefined'?window:globalThis);
