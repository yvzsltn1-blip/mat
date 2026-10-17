/* Aynı üretim kuralları: sabit tohumlu soru bankası ve rastgele alıştırmalar.
   Negatif/kesirli cevaplar seçeneklidir; mevcut doğal sayı tuş takımı korunur. */
(function(root) {
  'use strict';
  const F=root.Mat7Figures, G=root.MatGames;
  const fmt=n=>Number(n).toLocaleString('tr-TR',{maximumFractionDigits:6});
  const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
  const frac=(a,b)=>{if(!b)throw Error('Sıfır payda');if(b<0){a=-a;b=-b;}const d=gcd(a,b);a/=d;b/=d;return b===1?String(a):`${a}/${b}`;};
  const scene=html=>({kind:'art',html});
  const card=(...lines)=>F.cards(lines);
  const C=(prompt,answer,wrongs,explain,html,hint='Tanımı ve verilen koşulları birlikte değerlendir.')=>({kind:'mc',prompt,answer:String(answer),choices:[...new Set([answer,...wrongs].map(String))].slice(0,4),explain,hint,scene:scene(html||card(prompt))});
  function N(prompt,answer,explain,html,unit='',hint='Verilenleri sıraya koy; işlemden sonra birimi kontrol et.') {
    if(!Number.isSafeInteger(answer)||answer<0) return {...C(prompt,fmt(answer),[fmt(-answer),fmt(answer+1),fmt(answer-1),fmt(answer+2)],explain,html,hint),numericAnswer:answer,numericUnit:unit};
    return {kind:'num',prompt,answer,explain,hint,unit,scene:scene(html||card(prompt))};
  }
  const Q=(prompt,a,b,explain,html)=>({...C(prompt,frac(a,b),[frac(-a,b),frac(a+b,b),frac(a-b,b),frac(a+2*b,b)],explain,html,'İşareti belirle; gerekiyorsa ortak payda bul ve sonucu sadeleştir.'),numericAnswer:frac(a,b)});
  const builders={};
  // n her sabit bankada konu/seviye boyunca farklıdır; k aynı seviyede çeşitlenir.
  builders.tamsayilar=(l,n,k)=>[
    ()=>N(`Deniz seviyesinin ${n} m altındaki aracın tam sayı ile konumu nedir?`,-n,`Deniz seviyesi 0; aşağı yön negatif: −${n} m.`,F.number([-n,0,n])),
    ()=>N(`−${n}. kattan ${n+k} kat yükselen asansör hangi kata gelir?`,k,`−${n} + ${n+k} = ${k}.`,card(`Başlangıç: −${n}`,`Yukarı: ${n+k} kat`)),
    ()=>N(`${n} sayısının karşıtının ${l>=3?'karşıtı':'kendisi'} nedir?`,l>=3?n:-n,l>=3?`İki kez karşıt alınca başlangıca dönülür: ${n}.`:`Karşıt sayı −${n} olur.`,card(`Sayı: ${n}`)),
    ()=>N(`−${n} ile ${n+k} arasında, uçlar hariç kaç tam sayı vardır?`,2*n+k-1,`Farktan 1 çıkar: ${n+k} − (−${n}) − 1 = ${2*n+k-1}.`,F.number([-n,0,n+k])),
    ()=>N(`Bir yerin sıcaklığı −${n} °C. ${l<3?k:n+k} °C düşerse yeni sıcaklık kaç °C olur?`,-n-(l<3?k:n+k),`Düşüş çıkarılır: −${n} − ${l<3?k:n+k} = ${-n-(l<3?k:n+k)}.`,card(`Başlangıç: −${n} °C`,`Düşüş: ${l<3?k:n+k} °C`))
  ];
  builders.rasyonel=(l,n,k)=>[
    ()=>Q(`−${n*k}/${(n+1)*k} kesrini sadeleştir.`, -n,n+1,`Pay ve paydayı ${k} ile böl: ${frac(-n,n+1)}.`,card(`−${n*k} / ${(n+1)*k}`)),
    ()=>Q(`${n}/(−${n+k}) sayısına eşit gösterim hangisidir?`,-n,n+k,'Paydadaki tek eksi işareti kesrin önüne taşınabilir.',card(`${n} / (−${n+k})`)),
    ()=>N(`(${n*k})/${k} rasyonel sayısı hangi tam sayıya eşittir?`,n,`${n*k} ÷ ${k} = ${n}.`,card(`${n*k} / ${k}`)),
    ()=>C(`a = ${n} için hangi kesir tanımsızdır?`,`${n}/0`,[`0/${n}`,`${n}/1`,`1/${n}`],'Paydası sıfır olan kesir tanımsızdır.',card(`a = ${n}`)),
    ()=>Q(`Sayı doğrusu 0 ile 1 arasında ${n+k} eş parçaya ayrılıyor. Sıfırdan sola ${n} adım giden nokta hangi sayıdır?`,-n,n+k,`Her adım 1/${n+k}; sola ${n} adım: ${frac(-n,n+k)}.`,card(`Birim aralık: ${n+k} eş parça`,`Yön: sol · Adım: ${n}`))
  ];
  builders.mutlakdeger=(l,n,k)=>[
    ()=>N(`|−${n}| kaçtır?`,n,`−${n}'nin sıfıra uzaklığı ${n}.`,F.number([-n,0,n])),
    ()=>N(`|${k} − ${n+k}| kaçtır?`,n,`İçerisi −${n}; mutlak değeri ${n}.`,card(`|${k} − ${n+k}|`)),
    ()=>N(`Hedef ${n*10} g, ölçülen ${n*10-k} g. Hata miktarı kaç gramdır?`,k,`|${n*10-k} − ${n*10}| = ${k} g.`,card(`Hedef ${n*10} g`,`Ölçüm ${n*10-k} g`),'g'),
    ()=>N(`−${n} ile ${k} arasındaki uzaklık kaç birimdir?`,n+k,`|${k} − (−${n})| = ${n+k}.`,F.number([-n,0,k])),
    ()=>N(`|x − ${n}| ≤ ${k} koşulunu sağlayan en büyük tam sayı x kaçtır?`,n+k,`Aralık ${n-k} ile ${n+k}; en büyük ${n+k}.`,card(`Merkez: ${n}`,`Tolerans: ±${k}`))
  ];
  builders.temsiller=(l,n,k)=>[
    ()=>C(`${n}/4 kesrinin ondalık gösterimi hangisidir?`,fmt(n/4),[fmt(n/2),fmt(n/40),fmt(-n/4)],`${n} ÷ 4 = ${fmt(n/4)}.`,card(`${n} / 4`)),
    ()=>Q(`${fmt(n/10)} sayısının sade kesir gösterimi hangisidir?`,n,10,`Bir ondalık basamak: ${n}/10 = ${frac(n,10)}.`,card(fmt(n/10))),
    ()=>C(`${n} + 1/${l<3?8:12} sayısının ondalık gösterimi nasıldır?`,l<3?'Sonlu':'Devirli',['Sonlu','Devirli','Tanımsız','Rasyonel değil'],l<3?'8 = 2³; paydada yalnız 2 vardır.':'12 = 2² × 3; bu toplamda 3 çarpanı sadeleşmez.',card(`${n} + 1/${l<3?8:12}`)),
    ()=>Q(`${n},333… (3 devirli) sayısı hangi kesre eşittir?`,3*n+1,3,`${n} + 1/3 = ${frac(3*n+1,3)}.`,card(`${n},333…`)),
    ()=>Q(`${n},1666… (yalnız 6 devirli) hangi kesirdir?`,6*n+1,6,`0,1666… = 1/6. ${n} + 1/6 = ${frac(6*n+1,6)}.`,card(`${n},1666…`))
  ];
  builders.siralama=(l,n,k)=>[
    ()=>C(`−${n}/4 ile −${n+1}/4 arasında hangisi büyüktür?`,frac(-n,4),[frac(-n-1,4),'Eşit','Karşılaştırılamaz'],'Paydalar eşit; negatiflerde sıfıra yakın olan büyüktür.',card(frac(-n,4),frac(-n-1,4))),
    ()=>Q(`${n}/5 ile ${n+2*k}/5 sayılarının tam ortasındaki sayı nedir?`,n+k,5,`Ortalama (${n}/5 + ${n+2*k}/5)/2 = ${frac(n+k,5)}.`,card(`${n}/5 < ? < ${n+2*k}/5`)),
    ()=>C(`−${n}/2, 0, ${k}/3, −${n+1}/2 sayılarının en küçüğü hangisidir?`,frac(-n-1,2),[frac(-n,2),'0',frac(k,3)],'Negatifler pozitife ve sıfıra göre küçüktür; en uzaktaki negatif en küçüktür.',card(frac(-n,2),'0',frac(k,3),frac(-n-1,2))),
    ()=>N(`−${n}/2 sayısına ${k}/2 eklenirse değer kaç birim artar?`,k/2,`Artış eklenen miktardır: ${fmt(k/2)}.`,card(`${frac(-n,2)} + ${frac(k,2)}`)),
    ()=>Q(`${n}/3 ile ${(n+1)*2}/6 sayıları arasına hangisi yerleştirilebilir?`,2*n+1,6,`Alt sınır ${2*n}/6, üst sınır ${2*n+2}/6; arası ${frac(2*n+1,6)}.`,card(`${n}/3 < ? < ${2*n+2}/6`))
  ];
  builders.tamsayiislemler=(l,n,k)=>[
    ()=>N(`(−${n}) + (${k}) işleminin sonucu nedir?`,k-n,`Farklı işaretli: ${k} − ${n} = ${k-n}.`,card(`−${n} + ${k}`)),
    ()=>N(`${n} − (−${k}) işleminin sonucu nedir?`,n+k,`Negatifi çıkarma karşıtını ekler: ${n} + ${k} = ${n+k}.`,card(`${n} − (−${k})`)),
    ()=>N(`(−${n}) × (−${k}) ${l>=3?`− ${n}`:''} kaçtır?`,n*k-(l>=3?n:0),`Aynı işaretlerin çarpımı ${n*k}.${l>=3?` Sonra ${n} çıkar: ${n*k-n}.`:''}`,card(`(−${n}) × (−${k})`,l>=3?`Ardından ${n} çıkar.`:'İşareti belirle.')),
    ()=>N(`(−${n*k}) ÷ ${k} ${l>=3?`+ ${n+2}`:''} kaçtır?`,l>=3?2:-n,`Bölüm −${n}.${l>=3?` −${n} + ${n+2} = 2.`:''}`,card(`(−${n*k}) ÷ ${k}`,l>=3?`Sonra ${n+2} ekle.`:'Bölen pozitiftir.')),
    ()=>N(`Bakiye −${n*k} TL. ${n} gün boyunca günde ${k+2} TL yatırılıyor. Son bakiye kaç TL?`,2*n,`−${n*k} + ${n} × ${k+2} = ${2*n}.`,card(`Başlangıç −${n*k} TL`,`${n} gün · ${k+2} TL/gün`),'TL')
  ];
  builders.rasyonelislemler=(l,n,k)=>[
    ()=>Q(`${n}/3 − ${n+1}/6 kaçtır?`,n-1,6,`Ortak payda 6: (${2*n} − ${n+1})/6 = ${frac(n-1,6)}.`,card(`${n}/3 − ${n+1}/6`)),
    ()=>Q(`(−${n}/4) × (${k}/3) kaçtır?`,-n*k,12,`İşaret negatif: ${frac(-n*k,12)}.`,card(`(−${n}/4) × (${k}/3)`)),
    ()=>Q(`(${n}/5) ÷ (${k}/10) kaçtır?`,2*n,k,`Tersiyle çarp: (${n}/5) × (10/${k}) = ${frac(2*n,k)}.`,card(`(${n}/5) ÷ (${k}/10)`)),
    ()=>N(`(−${k})² ${l>=3?`− ${n}`:`+ ${n}`} kaçtır?`,k*k+(l>=3?-n:n),`Parantezli negatifin karesi ${k*k}; sonuç ${k*k+(l>=3?-n:n)}.`,card(`(−${k})²`,l>=3?`${n} çıkar.`:`${n} ekle.`)),
    ()=>N(`${n*3} L içecek, 3/4 L şişelere dolduruluyor. Kaç tam şişe dolar?`,n*4,`${n*3} ÷ (3/4) = ${n*3} × (4/3) = ${n*4}.`,card(`${n*3} L`,`Şişe: 3/4 L`),'şişe')
  ];
  builders.cokadimli=(l,n,k)=>[
    ()=>N(`${n} + ${k} × 3 kaçtır?`,n+3*k,`Önce ${k} × 3 = ${3*k}; sonra ${n} ekle: ${n+3*k}.`,card(`${n} + ${k} × 3`)),
    ()=>N(`(${n} − ${k}) × 2 + ${k} kaçtır?`,2*n-k,`Parantez ${n-k}, çarpım ${2*(n-k)}, toplam ${2*n-k}.`,card(`(${n} − ${k}) × 2 + ${k}`)),
    ()=>N(`${n*k} ÷ ${k} × 2 kaçtır?`,2*n,`Soldan sağa: ${n*k} ÷ ${k} = ${n}; sonra × 2 = ${2*n}.`,card(`${n*k} ÷ ${k} × 2`)),
    ()=>Q(`(${n} + ${k}) / (${k} − 1) kaçtır?`,n+k,k-1,`Pay ${n+k}, payda ${k-1}; sonuç ${frac(n+k,k-1)}.`,card(`Pay: ${n} + ${k}`,`Payda: ${k} − 1`)),
    ()=>N(`${12*n} L deponun önce 1/4'ü, sonra kalan suyun 1/3'ü kullanılıyor. Kaç litre kalır?`,6*n,`İlk kullanım ${3*n}; kalan ${9*n}. İkinci kullanım ${3*n}; son kalan ${6*n}.`,card(`Başlangıç ${12*n} L`,`Önce 1/4 · sonra kalanın 1/3’ü`),'L')
  ];
  builders.gorunumler=(l,n,k)=>[
    ()=>N(`Ön sıranın kule yükseklikleri ${k}, ${k+1}; arka sıranın ${k+2}, ${k}. Önden görülen birim kare sayısı kaçtır?`,2*k+3,`Sütunların en yükseği ${k+2} ve ${k+1}; toplam ${2*k+3}.`,card(`ÖN: ${k} | ${k+1}`,`ARKA: ${k+2} | ${k}`,`Model ${n}: her hücrede dolu bir küp kulesi`)),
    ()=>N(`Ön sıra ${k}, ${k+1}; arka sıra ${k+2}, ${k}. Sağdan görülen birim kare sayısı kaçtır?`,2*k+3,`Her sıranın maksimumu ${k+1} ve ${k+2}; toplam ${2*k+3}.`,card(`ÖN: ${k} | ${k+1}`,`ARKA: ${k+2} | ${k}`,`Model ${n}`)),
    ()=>N(`Ön sırada ${n} ve ${k}, arka sırada ${k+1} ve 0 küp yüksekliği var. Üstten kaç dolu hücre görünür?`,3,'Sıfır olmayan üç taban hücresi vardır; yüksekliği toplamayız.',card(`ÖN: ${n} | ${k}`,`ARKA: ${k+1} | 0`)),
    ()=>N(`Ön sırada ${n}, ${k}; arka sırada ${k+1}, ${l} küp olan dolu kulelerde toplam kaç küp vardır?`,n+2*k+1+l,`Bütün yükseklikleri topla: ${n} + ${k} + ${k+1} + ${l} = ${n+2*k+1+l}.`,card(`ÖN: ${n} | ${k}`,`ARKA: ${k+1} | ${l}`)),
    ()=>N(`Tek sıra hâlindeki kulelerin önden yükseklikleri ${n}, ${k}, ${n+1}. Küpler boşluksuzsa toplam kaç küp vardır?`,2*n+k+1,`Tek sıra olduğu için gizli arka kule yoktur: ${n} + ${k} + ${n+1}.`,card(`Tek sıra: ${n} | ${k} | ${n+1}`))
  ];
  builders.acinim=(l,n,k)=>[
    ()=>N(`Ayrıtları ${n}, ${k}, 2 cm olan kapalı prizmanın yüzey alanı kaç cm²?`,2*(n*k+2*n+2*k),`2 × (${n*k} + ${2*n} + ${2*k}) = ${2*(n*k+2*n+2*k)}.`,F.prism(n,k,2),'cm²'),
    ()=>N(`Ayrıtı ${n} cm olan küpün yüzey alanı kaç cm²?`,6*n*n,`6 × ${n}² = ${6*n*n}.`,F.prism(n,n,n),'cm²'),
    ()=>N(`Tabanı ${n} × ${k} cm, yüksekliği 3 cm olan üstü açık kutunun yüzey alanı kaç cm²?`,n*k+6*n+6*k,`Taban + dört yan yüz = ${n*k} + ${6*n} + ${6*k} = ${n*k+6*n+6*k}.`,F.prism(n,k,3),'cm²'),
    ()=>N(`Ayrıtı ${n} cm küpün yalnız ${k%4+2} yüzü boyanıyor. Boyanan alan kaç cm²?`,n*n*(k%4+2),`Bir yüz ${n*n} cm²; ${k%4+2} yüz = ${n*n*(k%4+2)} cm².`,F.prism(n,n,n),'cm²'),
    ()=>N(`Ayrıtı ${n} cm küpün tüm ayrıtları iki katına çıkıyor. Yeni yüzey alanı kaç cm²?`,24*n*n,`Yeni ayrıt ${2*n}; 6 × ${2*n}² = ${24*n*n}.`,F.prism(n,n,n),'cm²')
  ];
  builders.hacimyorum=(l,n,k)=>[
    ()=>N(`Her katta ${n} sıra, her sırada ${k} birim küp var. ${l+1} katta kaç birim küp vardır?`,n*k*(l+1),`${n} × ${k} × ${l+1} = ${n*k*(l+1)}.`,card(`${n} sıra · ${k} küp/sıra`,`${l+1} kat`)),
    ()=>N(`${n*k} birim küp, her kat ${k} küp olacak şekilde diziliyor. Kaç kat oluşur?`,n,`${n*k} ÷ ${k} = ${n}.`,card(`Toplam ${n*k}`,`Bir kat ${k}`)),
    ()=>N(`Ayrıtı 2 cm olan ${n} küpün toplam hacmi kaç cm³?`,8*n,`Bir küp 2³ = 8; toplam ${n} × 8 = ${8*n}.`,F.prism(2,2,2),'cm³'),
    ()=>N(`${8*n} cm³ hacim, ayrıtı 2 cm olan eş küplerle boşluksuz dolduruluyor. Kaç küp kullanılır?`,n,`Birim küp 8 cm³. ${8*n} ÷ 8 = ${n}.`,card(`Toplam ${8*n} cm³`,`Küp ayrıtı 2 cm`)),
    ()=>N(`${n} × ${k} × 3 birim küplük dolu prizmanın üst katından ${k} küp çıkarılıyor. Kaç küp kalır?`,3*n*k-k,`Başlangıç ${3*n*k}; kalan ${3*n*k} − ${k} = ${3*n*k-k}.`,F.prism(n,k,3))
  ];
  builders.hacim=(l,n,k)=>[
    ()=>N(`${n}, ${k}, ${l+1} cm ayrıtlı prizmanın hacmi kaç cm³?`,n*k*(l+1),`${n} × ${k} × ${l+1} = ${n*k*(l+1)}.`,F.prism(n,k,l+1),'cm³'),
    ()=>N(`Taban alanı ${n*k} cm², hacmi ${n*k*(l+2)} cm³ olan prizmanın yüksekliği kaç cm?`,l+2,`${n*k*(l+2)} ÷ ${n*k} = ${l+2}.`,card(`Taban ${n*k} cm²`,`Hacim ${n*k*(l+2)} cm³`),'cm'),
    ()=>N(`Ayrıtı ${k} cm küp biçimindeki ${n} kutunun toplam hacmi kaç cm³?`,n*k*k*k,`${n} × ${k}³ = ${n*k*k*k}.`,F.prism(k,k,k),'cm³'),
    ()=>N(`${n*8} L deponun 3/4'ü dolu. Boş kısım kaç litre?`,2*n,`Boş pay 1/4; ${n*8} ÷ 4 = ${2*n}.`,card(`Kapasite ${8*n} L`,`Doluluk 3/4`),'L'),
    ()=>N(`Hacmi ${n*k} cm³ olan prizmanın iki ayrıtı 2 katına, üçüncüsü 3 katına çıkıyor. Yeni hacim kaç cm³?`,12*n*k,`Hacim 2 × 2 × 3 = 12 katına çıkar: ${12*n*k}.`,card(`Eski hacim ${n*k} cm³`,`Ölçekler: 2, 2, 3`),'cm³')
  ];
  builders.birimler=(l,n,k)=>[
    ()=>N(`${n} dm³ kaç cm³ eder?`,1000*n,`${n} × 1.000 = ${1000*n}.`,card('1 dm³ = 1.000 cm³'),'cm³'),
    ()=>N(`${n} L ve ${k*100} mL toplam kaç mL?`,1000*n+100*k,`${1000*n} + ${100*k} = ${1000*n+100*k}.`,card(`${n} L`,`${100*k} mL`),'mL'),
    ()=>N(`${n*250} cm³ sıvı kaç litredir?`,n/4,`1.000'e böl: ${n*250} ÷ 1.000 = ${fmt(n/4)} L.`,card(`${n*250} cm³`),'L'),
    ()=>N(`${n} m³ su, ${k} L'lik kaplara paylaştırılıyor. Tam dolan kap sayısı kaçtır?`,Math.floor(n*1000/k),`${1000*n} L; ${k}'ye bölüp tam kısmını al: ${Math.floor(n*1000/k)}.`,card(`${n} m³`,`Kap: ${k} L`)),
    ()=>N(`${n} dL + ${k} cL kaç mL?`,100*n+10*k,`1 dL = 100 mL; 1 cL = 10 mL. Toplam ${100*n+10*k}.`,card(`${n} dL + ${k} cL`),'mL')
  ];
  builders.problemler=(l,n,k)=>[
    ()=>N(`İç ölçüleri ${n*10} × ${k*10} × 10 cm olan tank kaç litre alır?`,n*k,`Hacim ${n*k*1000} cm³; 1.000'e böl: ${n*k} L.`,F.prism(n*10,k*10,10),'L'),
    ()=>N(`${n*4} L depoda ${n} L su var. Dakikada ${k} L eklenirse doldurmak için gereken süre kaç dakika?`,3*n/k,`Eksik ${3*n} L; süre ${3*n} ÷ ${k} = ${fmt(3*n/k)} dakika.`,card(`Kapasite ${4*n} L`,`İçeride ${n} L`,`Akış ${k} L/dakika`),'dakika'),
    ()=>N(`Ayrıtları ${2*n}, ${2*k}, 6 cm olan kutuya ayrıtı 2 cm küpler paralel yerleştiriliyor. Kaç küp sığar?`,3*n*k,`Her yönde ${n}, ${k}, 3 küp; çarpım ${3*n*k}.`,F.prism(2*n,2*k,6)),
    ()=>N(`Ayrıtı ${n} dm kapalı küpü kaplamanın dm² fiyatı ${k} TL. Toplam bedel kaç TL?`,6*n*n*k,`Alan ${6*n*n} dm²; maliyet ${6*n*n} × ${k} = ${6*n*n*k}.`,F.prism(n,n,n),'TL'),
    ()=>N(`${n*10} L suyu ${k} L'lik kaplarla taşımak için en az kaç sefer gerekir?`,Math.ceil(10*n/k),`Bölüm ${fmt(10*n/k)}; kalan su varsa ek sefer gerekir. Sonuç ${Math.ceil(10*n/k)}.`,card(`Toplam ${10*n} L`,`Bir seferde ${k} L`))
  ];
  builders.dagilimlar=(l,n,k)=>[
    ()=>C(`${n} öğrencinin forma numaraları kaydediliyor. Veri türü nedir?`,'Kategorik',['Nicel sürekli','Nicel kesikli','Veri değildir'],'Forma numarası miktar değil, etikettir.',card(`${n} öğrencinin forma numaraları`)),
    ()=>C(`${n} bitkinin boyu santimetreyle ölçülüyor. Veri türü nedir?`,'Nicel sürekli',['Kategorik','Nicel kesikli','Veri değildir'],'Boy ölçülür; iki değer arasında başka değerler olabilir.',card(`${n} bitki · boy ölçümü`)),
    ()=>C(`${n} ailenin çocuk sayısı araştırılıyor. Veri türü nedir?`,'Nicel kesikli',['Nicel sürekli','Kategorik','Veri değildir'],'Çocuk sayısı sayılır ve tam sayı değerleri alır.',card(`${n} aile · çocuk sayısı`)),
    ()=>N(`Boylar ${n}, ${n+2}, ${n+2}, ${n+k+3} cm. Kaç farklı ölçüm değeri vardır?`,3,`${n}, ${n+2}, ${n+k+3} olmak üzere 3 farklı değer.`,F.bars([n,n+2,n+2,n+k+3])),
    ()=>C(`Ankette ${n} kişi otobüs, ${n+k} kişi yaya ulaşımı seçti. Kaydedilen ulaşım türü hangi veridir?`,'Kategorik',['Nicel sürekli','Nicel kesikli','Ölçüm hatası'],'Kişi sayıları sıklıktır; araştırılan özellik olan ulaşım türü kategoriktir.',card(`Otobüs: ${n}`,`Yaya: ${n+k}`))
  ];
  builders.surec=(l,n,k)=>[
    ()=>C(`${n} öğrencili okulda ${k} şubeden rastgele öğrenci seçiliyor. Evren hangisidir?`,'Okuldaki bütün öğrenciler',['Yalnız seçilen öğrenciler','Yalnız ilk şube','Anket soruları'],'Araştırmanın hedef grubu evrendir; seçilen alt grup örneklemdir.',card(`Okul: ${n} öğrenci`,`${k} şubeden seçim`)),
    ()=>N(`${k} şubenin her birinden ${n} öğrenci seçiliyor. Örneklem kaç kişidir?`,n*k,`${k} × ${n} = ${n*k}.`,card(`${k} şube`,`${n} öğrenci/şube`)),
    ()=>C(`${n} yanıtı toplayıp temizleyen ekip sırada hangi aşamaya geçmelidir?`,'Veri analizi',['Sonuçları verisiz tahmin','Soruyu silme','Katılımcıları ifşa etme'],'Temizlenen veriler grafik ve özet ölçülerle analiz edilir.',card(`${n} geçerli yanıt`,`Toplama tamamlandı`)),
    ()=>C(`${n*k} öğrencili okulun tamamını temsil etmek için hangi seçim daha uygundur?`,'Her şubeden rastgele seçim',['Yalnız gönüllü sporcular','Yalnız en yakın arkadaşlar','Yalnız en yüksek notlular'],'Farklı şubelerden rastgele seçim temsil gücünü artırır.',card(`Evren ${n*k} öğrenci`)),
    ()=>C(`${n} kişilik örneklemle okulun günlük okuma süresi inceleniyor. Hangi soru daha uygundur?`,'Son 7 günde günde kaç dakika okudun?',['Okumayı seviyorsun, değil mi?','Telefon şifren ne?','Dün ve geçen yıl kaç kitap vardı?'],'Zaman aralığı, özellik ve birim açıkça tanımlanmalıdır.',card(`Örneklem: ${n} kişi`,`Amaç: günlük okuma süresi`))
  ];
  builders.toplama=(l,n,k)=>[
    ()=>N(`${n+k+2} anketten ${k} tanesi boş, 2 tanesi aynı kişinin ikinci kaydı. Geçerli yanıt sayısı kaç?`,n,`Boş ve tekrar kayıtları çıkar: ${n+k+2} − ${k} − 2 = ${n}.`,card(`Toplanan ${n+k+2}`,`Boş ${k} · tekrar 2`)),
    ()=>C(`${n} kişinin okuma süresi anketinde hangi bilgi gereksiz kişisel veridir?`,'Ev adresi',['Günlük okuma dakikası','Ölçümün zaman aralığı','Anonim yanıt kodu'],'Okuma süresini araştırmak için ev adresi gerekli değildir.',card(`${n} kişi · okuma süresi`)),
    ()=>C(`${n} ağacın boyunu belirlemek için hangi yöntem uygundur?`,'Uygun araçla ölçüm',['Sevilen rengi sormak','Boyu oylamak','Rastgele sayı yazmak'],'Uzunluk uygun ölçme yöntemiyle elde edilir.',card(`${n} ağaç · boy uzunluğu`)),
    ()=>C(`${n} öğrencinin kişisel cevapları yayımlanacak. Hangi paylaşım daha uygundur?`,'Kişiyi tanıtmayan toplu sonuçlar',['Ad ve cevap eşleştirmesi','Adresli ham veri','Özel mesaj ekran görüntüleri'],'Toplu ve kişiyi tanıtmayan sonuçlar mahremiyeti korur.',card(`${n} yanıt · rapor hazırlığı`)),
    ()=>N(`${n+k} ölçümün ${k} tanesinde birim yazılmamış. Geri kalan kaç ölçümün birimi bellidir?`,n,`${n+k} − ${k} = ${n}. Eksik birimler doğrulanmalıdır.`,card(`Toplam ${n+k}`,`Eksik birim ${k}`))
  ];
  builders.analiz=(l,n,k)=>{
    const v=[n,n+k,n+2*k,n+k], chart=F.bars(v);
    return [
      ()=>N(`Grafikteki A, B, C, D gruplarının toplamı kaçtır? (A = ${n})`,4*n+4*k,`${v.join(' + ')} = ${4*n+4*k}.`,chart),
      ()=>N(`Grafikte C grubunun değeri A'dan kaç fazladır? (A = ${n})`,2*k,`${n+2*k} − ${n} = ${2*k}.`,chart),
      ()=>N(`Bir ölçek aralığı ${k} kişidir. Sütun sıfırdan ${n} aralık yükseliyorsa kaç kişiyi gösterir?`,n*k,`${n} × ${k} = ${n*k}.`,card(`Ölçek ${k} kişi/aralık`,`${n} aralık`)),
      ()=>C(`${n} gün boyunca bir deponun su yüksekliği izleniyor. Değişimi göstermek için en uygun grafik?`,'Çizgi grafiği',['İsimsiz resim','Birim içermeyen çizim','Sırasız kategori listesi'],'Zaman boyunca değişim çizgi grafiğinde izlenebilir.',card(`${n} gün · su yüksekliği`)),
      ()=>N(`Nokta grafiği ${n}, ${n}, ${n+k}, ${n+k}, ${n+k}, ${n+2*k} verilerini gösteriyor. ${n+k} üzerinde kaç nokta olur?`,3,`${n+k} değeri üç kez görülür; 3 nokta çizilir.`,card(`${n}, ${n}, ${n+k}, ${n+k}, ${n+k}, ${n+2*k}`))
    ];
  };
  builders.yorumlama=(l,n,k)=>[
    ()=>N(`${n}, ${n+k}, ${n+2*k} verilerinin aritmetik ortalaması kaçtır?`,n+k,`Toplam ${3*n+3*k}; 3'e böl: ${n+k}.`,F.bars([n,n+k,n+2*k],['A','B','C'])),
    ()=>N(`${n+3*k}, ${n}, ${n+k}, ${n+2*k} verilerinin ortancası kaçtır?`,n+1.5*k,`Sıralama: ${n}, ${n+k}, ${n+2*k}, ${n+3*k}; ortadakilerin ortalaması ${fmt(n+1.5*k)}.`,card(`${n+3*k}, ${n}, ${n+k}, ${n+2*k}`)),
    ()=>N(`${n}, ${n}, ${n+k}, ${n+2*k}, ${n+2*k}, ${n+2*k} verilerinin tepe değeri kaçtır?`,n+2*k,`${n+2*k} üç kez, diğerleri daha az görülür.`,card(`${n}, ${n}, ${n+k}, ${n+2*k}, ${n+2*k}, ${n+2*k}`)),
    ()=>N(`${n}, ${n+k}, ${n+3*k}, ${n+2*k} verilerinin açıklığı kaçtır?`,3*k,`En büyük − en küçük = ${n+3*k} − ${n} = ${3*k}.`,F.bars([n,n+k,n+3*k,n+2*k])),
    ()=>Q(`${n}, ${n+k}, ${n+2*k} verilerinin ortalama mutlak sapması kaçtır?`,2*k,3,`Ortalama ${n+k}; uzaklıklar ${k}, 0, ${k}. OMS = ${2*k}/3 = ${frac(2*k,3)}.`,card(`${n}, ${n+k}, ${n+2*k}`))
  ];
  builders.inceleme=(l,n,k)=>[
    ()=>N(`Bir miktar ${n*10}'dan ${n*12}'ye çıktı. Yüzde artış kaçtır?`,20,`Artış ${2*n}; (${2*n}/${10*n}) × 100 = %20.`,card(`Önce ${10*n}`,`Sonra ${12*n}`),'%'),
    ()=>C(`${n} öğrencinin yalnız spor kulübünden seçildiği ankette tüm okul için kesin sonuç çıkarılıyor. Temel sorun nedir?`,'Örneklemin temsil sorunu',['Sayının tam sayı olması','Grafiğin renkli olması','Araştırmanın soru içermesi'],'Spor kulübü üyeleri bütün okulun özelliklerini temsil etmeyebilir.',card(`Örneklem: ${n} spor kulübü üyesi`)),
    ()=>C(`Grafik ${n*10} ve ${n*10+k} değerlerini karşılaştırıyor; dikey eksen ${n*10-1}'den başlıyor. Neye dikkat edilmeli?`,'Kesilmiş eksen farkı abartabilir',['Büyük değer mutlaka iki katıdır','Veri artık kategoriktir','Birim artık önemsizdir'],'Görsel yükseklik oranı ile gerçek sayı oranı farklı olabilir.',card(`Değerler ${n*10} ve ${n*10+k}`,`Eksen başlangıcı ${n*10-1}`)),
    ()=>C(`${n} gözlemde iki özellik birlikte artıyor. Hangisi söylenebilir?`,'Birlikte değişim tek başına neden kanıtlamaz',['Birincisi kesinlikle diğerine neden olur','Veri toplamaya gerek yok','Başka etken olamaz'],'Başka etkenler olabilir; yalnız ilişki nedensellik göstermez.',card(`${n} gözlem · birlikte artış`)),
    ()=>N(`Haber ${n*5} kişiden ${n*3}'ünün bir seçeneği işaretlediğini söylüyor. Bu kaç yüzde eder?`,60,`(${3*n}/${5*n}) × 100 = %60.`,card(`Toplam ${5*n}`,`Seçen ${3*n}`),'%')
  ];
  builders.yansima=(l,n,k)=>[
    ()=>N(`Nokta aynaya ${n} cm dik uzaklıkta. Nokta ile görüntüsü arası kaç cm?`,2*n,`İki eş uzaklık: ${n} + ${n} = ${2*n}.`,F.mirror(n),'cm'),
    ()=>N(`A ile yansıması A′ arası ${2*n} cm. A'nın aynaya uzaklığı kaç cm?`,n,`Ayna parçayı ortalar: ${2*n} ÷ 2 = ${n}.`,card(`AA′ = ${2*n} cm`,`Ayna ortadan dik geçer.`),'cm'),
    ()=>N(`Kenar uzunluğu ${n} cm olan karenin yansımasının çevresi kaç cm?`,4*n,`Yansıma uzunlukları korur; çevre 4 × ${n} = ${4*n}.`,card(`Kare kenarı ${n} cm`),'cm'),
    ()=>N(`Kareli zeminde ayna düşey 0 çizgisinde. ${n} birim solundaki noktanın görüntüsü hangi yatay konumdadır?`,n,`Görüntü ${n} birim sağda, yani +${n} konumundadır.`,F.mirror(n)),
    ()=>N(`Aralarında ${k} cm olan paralel iki aynada sırayla yansıtılan nokta, başlangıcından kaç cm ötelenir? (Başlangıç ilk aynanın ${n} cm solunda.)`,2*k,`İlk görüntü ${n} cm sağda; ikinci görüntünün yatay konumu 2 × ${k} − ${n}. Başlangıç −${n}; fark ${2*k} cm.`,card(`Aynalar arası ${k} cm`,`İki ardışık yansıma`),'cm')
  ];
  builders.insa=(l,n,k)=>[
    ()=>N(`AB = ${2*n} cm. Orta dikme AB'yi M'de kesiyor. AM kaç cm?`,n,`M orta nokta: ${2*n} ÷ 2 = ${n}.`,card(`A — M — B`,`AB = ${2*n} cm`),'cm'),
    ()=>N(`Açıortay ${2*(n%60+10)}° açıyı ikiye ayırıyor. Bir parça kaç derece?`,n%60+10,`${2*(n%60+10)} ÷ 2 = ${n%60+10}.`,card(`Açı: ${2*(n%60+10)}°`),'°'),
    ()=>N(`AB'nin orta dikmesi üzerindeki P için PA = ${n} cm. PB kaç cm?`,n,'Orta dikme üzerindeki noktalar uçlara eşit uzaklıktadır.',card(`PA = ${n} cm`,`P orta dikme üzerinde`),'cm'),
    ()=>N(`AB = ${2*n} cm. İki kesişimli eş çemberlerle orta dikme çizmek için tam sayı yarıçap en az kaç cm olmalıdır?`,n+1,`Yarıçap ${n} cm'den büyük olmalı; en küçük tam sayı ${n+1}.`,card(`AB = ${2*n} cm`,`r > AB/2`),'cm'),
    ()=>N(`Bir açının açıortayla ayrılan iki parçası eşit. Bir parça ${n%50+k}° ise bütün açı kaç derece?`,2*(n%50+k),`İki eş parça: 2 × ${n%50+k} = ${2*(n%50+k)}°.`,card(`Yarım açı ${n%50+k}°`),'°')
  ];
  // Üst seviyelerde yalnız sayıları büyütmek yerine ters işlem, koşul ve
  // birden fazla kazanımı birleştiren sorular kullanılır.
  const advanced={
    tamsayilar:(n,k)=>[
      ()=>N(`Asansör −${n}. kattan kalkıyor. Önce ${k} kat inip sonra aynı sayıda ${k+1} katlık yükselişleri ${k} kez yapıyor. Son kat kaçtır?`,k*k-n,`Başlangıçtan ${k} in: −${n+k}. Ardından ${k} × ${k+1} yüksel: ${k*k-n}.`,card(`İlk konum −${n}`,`İniş ${k}`,`Çıkış ${k} × ${k+1}`)),
      ()=>N(`−${n} ile ${n} arasında uçlar dâhil kaç çift tam sayı vardır?`,2*Math.floor(n/2)+1,`Pozitif tarafta ${Math.floor(n/2)}, negatifte aynı sayıda çift ve 0 var: ${2*Math.floor(n/2)+1}.`,F.number([-n,0,n]))
    ],
    rasyonel:(n,k)=>[
      ()=>N(`(${n*k})/x = ${n}/${k+1} eşitliğinde x kaçtır?`,k*(k+1),`Pay ${k} katına çıkmış; payda da ${k} katına çıkmalı: ${k} × ${k+1} = ${k*(k+1)}.`,card(`${n*k}/x = ${n}/${k+1}`)),
      ()=>Q(`−${n}/${n+1} kesrinin payına ve paydasına ${k} ekleniyor. Yeni değer nedir?`,k-n,n+k+1,`Yeni pay −${n} + ${k} = ${k-n}; payda ${n+k+1}. Sonuç ${frac(k-n,n+k+1)}.`,card(`Pay: −${n}`,`Payda: ${n+1}`,`Her ikisine +${k}`))
    ],
    mutlakdeger:(n,k)=>[
      ()=>N(`|x − ${n}| = ${k} eşitliğinin iki çözümünün toplamı kaçtır?`,2*n,`Çözümler ${n-k} ve ${n+k}; toplam ${2*n}.`,card(`Merkez ${n}`,`Uzaklık ${k}`)),
      ()=>N(`Bir paket ${n*10} ± ${k} g aralığında kabul ediliyor. Gram cinsinden tam sayı kaç farklı kütle kabul edilir?`,2*k+1,`Uçlar ${n*10-k}, ${n*10+k}; tam sayı sayısı fark + 1 = ${2*k+1}.`,card(`Hedef ${10*n} g`,`Tolerans ±${k} g`))
    ],
    temsiller:(n,k)=>[
      ()=>Q(`${n},272727… (27 devirli) sayısının kesir karşılığı nedir?`,11*n+3,11,`Devirli kısım 27/99 = 3/11; toplam ${frac(11*n+3,11)}.`,card(`${n},272727…`)),
      ()=>Q(`${n},4555… (yalnız 5 devirli) sayısı hangi kesirdir?`,90*n+41,90,`Ondalık kısım (45 − 4)/90 = 41/90. Tam kısmı ekle: ${frac(90*n+41,90)}.`,card(`${n},4555…`))
    ],
    siralama:(n,k)=>[
      ()=>Q(`a = ${n}/3, b = ${n+2*k}/3. Önce a ile b'nin, sonra a ile bulduğun sayının ortalamasını al. Son sayı nedir?`,2*n+k,6,`İlk orta ${frac(n+k,3)}. İkinci orta (${n}/3 + ${(n+k)}/3)/2 = ${frac(2*n+k,6)}.`,card(`a = ${n}/3`,`b = ${n+2*k}/3`)),
      ()=>N(`−${n}/2 ile ${n}/2 arasında, uçlar hariç kaç tam sayı vardır?`,2*Math.ceil(n/2)-1,`Pozitif tam sayı sayısı ${Math.ceil(n/2)-1}; negatifler ve 0 ile toplam ${2*Math.ceil(n/2)-1}.`,card(`−${n}/2 < x < ${n}/2`,`x tam sayı`))
    ],
    tamsayiislemler:(n,k)=>[
      ()=>N(`Bir oyunda doğru +${k}, yanlış −2 puan. ${n} sorunun ${n-3}'ü doğru, 3'ü yanlış. Toplam puan kaç?`,(n-3)*k-6,`Doğrular ${(n-3)*k}, yanlışlar −6; toplam ${(n-3)*k-6}.`,card(`${n-3} doğru × ${k}`,`3 yanlış × (−2)`)),
      ()=>N(`Başlangıç bakiyesi bilinmiyor. ${k} gün her gün ${n} TL harcanınca bakiye −${n+1} TL oluyor. Başlangıç bakiyesi kaç TL?`,k*n-n-1,`Başlangıç = son + harcanan = −${n+1} + ${k*n} = ${k*n-n-1}.`,card(`Son bakiye −${n+1} TL`,`Harcama ${k} × ${n} TL`),'TL')
    ],
    rasyonelislemler:(n,k)=>[
      ()=>Q(`(${n}/3 − ${n+1}/4) ÷ (1/6) kaçtır?`,n-3,2,`Ortak payda 12: (${4*n} − ${3*n+3})/12 = ${n-3}/12. 6 ile çarp: ${frac(n-3,2)}.`,card(`(${n}/3 − ${n+1}/4) ÷ (1/6)`)),
      ()=>N(`${n*12} TL'nin 1/3'ü, ardından kalanın 1/4'ü harcanıyor. Kaç TL kalır?`,6*n,`İlk harcama ${4*n}, kalan ${8*n}; ikinci harcama ${2*n}; kalan ${6*n}.`,card(`Para ${12*n} TL`,`1/3 → kalanın 1/4’ü`),'TL')
    ],
    cokadimli:(n,k)=>[
      ()=>N(`(−${k})² − [${n} − (${n+2*k})] × 3 kaçtır?`,k*k+6*k,`Köşeli parantez −${2*k}. Çarpımı −${6*k}; ${k*k} − (−${6*k}) = ${k*k+6*k}.`,card(`(−${k})² − [${n} − (${n+2*k})] × 3`)),
      ()=>N(`(x + ${n}) ÷ ${k} − 2 = ${n} eşitliğinde x kaçtır?`,k*(n+2)-n,`Ters sırayla: ${n}+2, sonra ×${k}, sonra −${n}; x = ${k*(n+2)-n}.`,card(`(x + ${n}) ÷ ${k} − 2 = ${n}`))
    ],
    gorunumler:(n,k)=>[
      ()=>N(`Ön ve arka olmak üzere iki sıralı modelin önden sütun yükseklikleri ${n} ve ${k}. Üstten dört hücre de dolu. En az kaç küp gerekir?`,n+k+2,`Her sütunda yüksek kule yanında en az 1 küp: ${n}+1+${k}+1 = ${n+k+2}.`,card(`Önden: ${n} | ${k}`,`Üstten: 2 × 2 dolu hücre`)),
      ()=>N(`İki derinlik sıralı modelin önden yükseklikleri ${n} ve ${k}. Üstten dört hücre dolu. En fazla kaç küp olabilir?`,2*(n+k),`Her sütunun iki kulesi de görünüm yüksekliğinde olabilir: 2 × (${n}+${k}) = ${2*(n+k)}.`,card(`Önden: ${n} | ${k}`,`Üstten: 2 × 2 dolu hücre`))
    ],
    acinim:(n,k)=>[
      ()=>N(`Tabanı ${n} × ${k} cm prizmanın yüzey alanı ${2*n*k+6*(n+k)} cm². Yüksekliği kaç cm?`,3,`İki taban ${2*n*k}. Yan alan ${6*(n+k)} = 2 × (${n}+${k}) × h; h = 3.`,card(`Taban ${n} × ${k}`,`A = ${2*n*k+6*(n+k)} cm²`),'cm'),
      ()=>N(`Ayrıtı ${n} cm olan iki küp birer yüzlerinden yapıştırılıyor. Yeni cismin yüzey alanı kaç cm²?`,10*n*n,`12 yüzden yapışan iki yüz görünmez: 10 × ${n}² = ${10*n*n}.`,card(`İki küp · ayrıt ${n} cm`,`Birer yüz tamamen birleşiyor.`),'cm²')
    ],
    hacimyorum:(n,k)=>[
      ()=>N(`${2*n} × ${2*k} × 4 cm kutu ayrıtı 2 cm küplerle dolu. Bir üst katman tamamen çıkarılırsa kaç küp kalır?`,n*k,`Başlangıç ${n} × ${k} × 2 küp. Bir katman ${n*k}; kalan ${n*k}.`,F.prism(2*n,2*k,4)),
      ()=>N(`${n} büyük küpün her biri ayrıtı 2 birim. Tamamı ayrıtı 1 birim küçük küplere ayrılınca küp sayısı kaç artar?`,7*n,`Her büyükten 8 küçük çıkar. Artış ${8*n} − ${n} = ${7*n}.`,card(`${n} büyük küp`,`Ayrıt 2 → ayrıt 1`))
    ],
    hacim:(n,k)=>[
      ()=>N(`İç tabanı ${n} × ${k} cm olan tankta su seviyesi 3 cm artıyor. Eklenen su hacmi kaç cm³?`,3*n*k,`Taban alanı × yükseklik artışı = ${n*k} × 3 = ${3*n*k}.`,F.prism(n,k,3),'cm³'),
      ()=>N(`Hacmi ${6*n*k} cm³ olan prizmanın taban ayrıtları ${n} ve ${k} cm. Yüksekliğinin yarısı kaç cm?`,3,`Yükseklik ${6*n*k} ÷ ${n*k} = 6 cm; yarısı 3 cm.`,card(`H = ${6*n*k} cm³`,`Taban ${n} × ${k}`),'cm')
    ],
    birimler:(n,k)=>[
      ()=>N(`${n} m³ suyun ${k} L'si kullanıldı. Kaç dm³ su kalır?`,1000*n-k,`1 m³ = 1.000 dm³ ve 1 L = 1 dm³. ${1000*n} − ${k} = ${1000*n-k}.`,card(`${n} m³ − ${k} L`),'dm³'),
      ()=>N(`${n} L ve ${k} dL içecek 100 mL kaplara konuyor. Kaç kap dolar?`,10*n+k,`Toplam ${1000*n+100*k} mL; 100'e böl: ${10*n+k}.`,card(`${n} L + ${k} dL`,`Kap 100 mL`))
    ],
    problemler:(n,k)=>[
      ()=>N(`İç ölçüleri ${n*10} × 20 × 30 cm olan tank 2/3 dolu. Kaç litre daha alır?`,2*n,`Kapasite ${6*n} L; boş kısmı 1/3 olduğundan ${2*n} L.`,F.prism(n*10,20,30),'L'),
      ()=>Q(`İç tabanı ${n} × ${k} dm tankta su seviyesi 2 dm. Dakikada ${k} L eklenirse suyun 5 dm'ye ulaşması kaç dakika sürer?`,3*n*k,k,`Gereken hacim ${n*k} × (5−2) = ${3*n*k} dm³ = L; süre ${3*n*k}/${k} = ${3*n}.`,card(`Taban ${n} × ${k} dm`,`Seviye 2 → 5 dm`,`Akış ${k} L/dakika`))
    ],
    dagilimlar:(n,k)=>[
      ()=>C(`${n} öğrencinin boyu ölçülüp en yakın santimetreye yuvarlanmış. Boy değişkeni için hangisi doğru?`,'Ölçülen özellik sürekli, kayıtlar yuvarlanmış',['Yuvarlama boyu kategorik yapar','Boy artık bir sayımdır','Bütün öğrencilerin boyu aynıdır'],'Kaydın tam sayı olması ölçülen uzunluğun sürekli olmasını değiştirmez.',card(`${n} ölçüm`,`Kayıt hassasiyeti: 1 cm`)),
      ()=>C(`${n} koşucunun yarış numarası ve bitirme süresi kaydediliyor. Doğru eşleştirme hangisi?`,'Numara kategorik, süre nicel sürekli',['İkisi de nicel kesikli','Numara sürekli, süre kategorik','İkisi de kategorik'],'Yarış numarası etikettir; süre ölçülen nicel sürekli özelliktir.',card(`${n} koşucu`,`Numara + süre`))
    ],
    surec:(n,k)=>[
      ()=>({...C(`${n} kişilik A şubesi ve ${3*n} kişilik B şubesinden toplam ${4*k} kişi, büyüklüklerle orantılı seçilecek. Uygun dağılım hangisi?`,`A: ${k}, B: ${3*k}`,[`A: ${2*k}, B: ${2*k}`,`A: ${3*k}, B: ${k}`,`A: 0, B: ${4*k}`],`Şubeler 1:3 oranında; örneklem de ${k}:${3*k} olmalı.`,card(`A: ${n} kişi · B: ${3*n} kişi`,`Örneklem ${4*k}`)),numericAnswer:3*k,numericPrompt:`${n} kişilik A ve ${3*n} kişilik B şubesinden toplam ${4*k} kişi, şube büyüklükleriyle orantılı seçilecek. B şubesinden kaç kişi seçilmelidir?`}),
      ()=>C(`${n} öğrencinin yalnız sınav haftasındaki uyku süresi ölçülüp tüm yıl için yorum yapılıyor. Temel sınırlılık nedir?`,'Ölçüm dönemi tüm yılı temsil etmeyebilir',['Saat birimi kullanılması','Öğrenci sayısının tam sayı olması','Verilerin sıralanması'],'Sınav haftası alışılmış uyku düzeninden farklı olabilir; dönemi belirtmek gerekir.',card(`${n} öğrenci`,`Dönem: yalnız sınav haftası`))
    ],
    toplama:(n,k)=>[
      ()=>C(`${n} kişilik ankette boş cevaplar 0 dakika yazılmış. Ortalama için risk nedir?`,'Geçerli ortalama yapay olarak düşebilir',['Her zaman doğru sonuç çıkar','Eksik veri mutlaka sıfırdır','Örneklem otomatik büyür'],'Boş yanıt ölçülmüş sıfır değildir; gerçek sıfırlarla karıştırılmamalıdır.',card(`${n} anket`,`Boş cevap → 0 dönüşümü`)),
      ()=>C(`${n} öğrencinin isimleri kaldırılmış ama tek bir öğrencinin tanınabildiği şube ve özel cevap paylaşılmış. Ne yapılmalı?`,'Tanımlanabilir ayrıntılar çıkarılmalı veya gruplanmalı',['İsmi silmek her zaman yeterlidir','Adres eklenmeli','Katılım zorlanmalı'],'Birden fazla ayrıntı birleşince kişiyi belirleyebilir; yalnız adı silmek yetmeyebilir.',card(`${n} kayıt`,`İsim yok; ayırt edici ayrıntılar var`))
    ],
    analiz:(n,k)=>[
      ()=>N(`Dört günün değerleri ${n}, ${n+k}, ${n+3*k}, ${n+2*k}. En büyük günlük artış kaçtır?`,2*k,`Ardışık değişimler +${k}, +${2*k}, −${k}. En büyük artış ${2*k}.`,F.bars([n,n+k,n+3*k,n+2*k],['1. gün','2. gün','3. gün','4. gün'])),
      ()=>N(`Üç grubun toplamı ${3*n+3*k}. A = ${n}, B = ${n+k}. Grafikte eksik C kaçtır?`,n+2*k,`Toplamdan A ve B çıkar: ${3*n+3*k} − ${n} − ${n+k} = ${n+2*k}.`,card(`Toplam ${3*n+3*k}`,`A: ${n} · B: ${n+k} · C: ?`))
    ],
    yorumlama:(n,k)=>[
      ()=>N(`Dört sayının ortalaması ${n}. Üçü ${n-k}, ${n}, ${n+k+2}. Dördüncü sayı kaçtır?`,n-2,`Toplam ${4*n}. Bilinenler ${3*n+2}; eksik ${n-2}.`,card(`Ortalama ${n}`,`Bilinen: ${n-k}, ${n}, ${n+k+2}`)),
      ()=>C(`A: ${n-k}, ${n}, ${n+k}; B: ${n-2*k}, ${n}, ${n+2*k}. Hangi yorum doğrudur?`,'Ortalamalar eşit, A’nın OMS’si daha küçük',['A’nın ortalaması daha büyük','B’nin OMS’si daha küçük','Açıklıkları eşit'],`İki ortalama ${n}; A’nın OMS’si ${frac(2*k,3)}, B’ninki ${frac(4*k,3)}.`,card(`A: ${n-k}, ${n}, ${n+k}`,`B: ${n-2*k}, ${n}, ${n+2*k}`))
    ],
    inceleme:(n,k)=>[
      ()=>C(`A grubunda ${n}/${2*n}, B grubunda ${3*n}/${5*n} başarı var. Hangi grup daha yüksek başarı oranına sahiptir?`,'B',['A','Oranlar eşit','Sayılardan oran bulunamaz'],'A %50, B %60. Başarılı kişi sayısı yerine oranları karşılaştır.',card(`A: ${n}/${2*n}`,`B: ${3*n}/${5*n}`)),
      ()=>N(`${n*100} TL fiyat önce %20 artıp sonra yeni fiyat üzerinden %20 düşüyor. İlk fiyata göre kaç TL azalmıştır?`,4*n,`Önce ${120*n}, sonra ${96*n} TL. Fark ${100*n} − ${96*n} = ${4*n} TL.`,card(`Başlangıç ${100*n} TL`,`+%20 → −%20`),'TL')
    ],
    yansima:(n,k)=>[
      ()=>N(`Kareli düzlemde düşey ayna x = ${k} çizgisinde. Yatay konumu x = −${n} olan noktanın yansımasının x konumu nedir?`,n+2*k,`Aynaya uzaklık ${n+k}; diğer yanda x = ${k} + ${n+k} = ${n+2*k}.`,card(`Ayna x = ${k}`,`Nokta x = −${n}`)),
      ()=>N(`Bir nokta yatay konumu ${n}'den ${n+2*k}'ye yansıyor. Düşey aynanın yatay konumu nedir?`,n+k,`Ayna orta noktada: (${n} + ${n+2*k})/2 = ${n+k}.`,card(`A: ${n}`,`A′: ${n+2*k}`))
    ],
    insa:(n,k)=>[
      ()=>N(`AB'nin orta dikmesi üzerindeki P için PA = x + ${n}, PB = 2x + ${k} cm. x kaçtır?`,n-k,`PA = PB: x + ${n} = 2x + ${k}; x = ${n-k}.`,card(`PA = x + ${n}`,`PB = 2x + ${k}`)),
      ()=>N(`Bir açıortayın ayırdığı açılar x + ${n%20+5} ve 2x − ${k} derece. Bütün açının ölçüsü kaç derece?`,4*(n%20+5)+2*k,`Eşitlikten x = ${n%20+5+k}. Yarım açı ${2*(n%20+5)+k}; bütün ${4*(n%20+5)+2*k}.`,card(`Açı 1: x + ${n%20+5}`,`Açı 2: 2x − ${k}`),'°')
    ]
  };
  // Usta (6), Efsane (7), Prestij (8): yalnız sınırsız üreticide. Her konuda beş kalıp;
  // seviye yükseldikçe sayılar büyür, adım sayısı artar; Prestij'de olimpiyat tarzı
  // sayma, değişmez ve en iyi değer soruları gelir. Cevaplar kodla hesaplanır.
  const signed=n=>n<0?`−${-n}`:String(n);
  const par=n=>n<0?`(−${-n})`:String(n);
  const minus=n=>n<0?`+ ${-n}`:`− ${n}`;
  const sum=a=>a.reduce((s,x)=>s+x,0);
  const count=(lo,hi,f)=>{let c=0;for(let x=lo;x<=hi;x++)if(f(x))c++;return c;};
  const sup=k=>String(k).replace(/\d/g,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[c]);
  // Sayıdan sonra gelen ek, sayının okunuşundaki son kelimeye uyar: 3'ün, 6'nın, 20'si.
  const NUMW={1:'bir',2:'iki',3:'üç',4:'dört',5:'beş',6:'altı',7:'yedi',8:'sekiz',9:'dokuz',10:'on',20:'yirmi',30:'otuz',40:'kırk',50:'elli',60:'altmış',70:'yetmiş',80:'seksen',90:'doksan'};
  const lastWord=n=>{n=Math.abs(n);return !n?'sıfır':n%10?NUMW[n%10]:n%100?NUMW[n%100]:n%1000?'yüz':n%1e6?'bin':'milyon';};
  function ek(n,kind){
    const w=lastWord(n),vs=w.match(/[aeıioöuü]/g),v=vs[vs.length-1],last=w.slice(-1);
    const back='aıou'.includes(v),round='ouöü'.includes(v),endV='aeıioöuü'.includes(last),hard='çfhkpsşt'.includes(last);
    const a2=back?'a':'e',i4=back?(round?'u':'ı'):(round?'ü':'i');
    return {e:(endV?'y':'')+a2,de:(hard?'t':'d')+a2,den:(hard?'t':'d')+a2+'n',in:(endV?'n':'')+i4+'n',si:(endV?'s':'')+i4}[kind];
  }
  const E=(n,kind)=>`${signed(n)}'${ek(n,kind)}`;
  // Kule yükseklikleri tablosunun (satır = derinlik) yüzey alanı: her açık birim yüz sayılır.
  function surface(h){
    let s=0;const R=h.length,Cn=h[0].length,at=(i,j)=>i<0||j<0||i>=R||j>=Cn?0:h[i][j];
    for(let i=0;i<R;i++)for(let j=0;j<Cn;j++){const v=h[i][j];if(!v)continue;s+=2;for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]])s+=Math.max(0,v-at(i+di,j+dj));}
    return s;
  }
  // p/q kesrinin virgülden sonraki ilk n basamağı (uzun bölme).
  const decimals=(p,q,n)=>{const d=[];let r=p%q;for(let i=0;i<n;i++){r*=10;d.push(Math.floor(r/q));r%=q;}return d;};
  const dec=x=>x.toFixed(2).replace('.',',');
  const fx=(a,b)=>frac(a,b).replace('-','−');
  // Adım adım çözüm: ana fikir ve adımlar (adım metin ya da {t, fig}). withSol soruya çözümü ekler.
  const SOL=(idea,...steps)=>({idea,steps:steps.filter(Boolean).map(x=>typeof x==='string'?{t:x}:x)});
  const withSol=(q,sol)=>{q.solution=sol;return q;};
  const tbl=(head,rows,foot)=>`<table class="sol-table"><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}${foot?`<tr class="sum">${foot.map(c=>`<td>${c}</td>`).join('')}</tr>`:''}</table>`;
  const expert={
    tamsayilar:(l,ri,pick,rnd)=>[
      ()=>{const a=ri(10,15*l),b=ri(10,15*l),d=pick([3,4,6,7,9]),c=count(-a+1,b-1,x=>x%d===0);
        return withSol(N(`−${a} ile ${b} arasında (uçlar hariç) ${E(d,'in')} katı olan kaç tam sayı vardır?`,c,`Pozitif katlar ${Math.floor((b-1)/d)}, negatif katlar ${Math.floor((a-1)/d)} tane; 0 da katlardandır. Toplam ${c}.`,F.number([-a,0,b]),'',`Sıfır da ${E(d,'in')} katıdır.`),
        SOL(`Aralığı sıfırın iki yanına ayıralım: pozitif katlar, negatif katlar ve 0.`,
          `Pozitif taraf: 1 ile ${b-1} arasında ${E(d,'in')} katları ${d}, ${2*d}, … → ${b-1} ÷ ${d} işleminin bölümü ${Math.floor((b-1)/d)}.`,
          `Negatif taraf: −1 ile −${a-1} arasında −${d}, −${2*d}, … → ${a-1} ÷ ${d} işleminin bölümü ${Math.floor((a-1)/d)}.`,
          {t:`0 da ${E(d,'in')} katıdır (0 = ${d} × 0). Toplam ${Math.floor((b-1)/d)} + ${Math.floor((a-1)/d)} + 1 = ${c}.`,fig:F.number([-a,0,b])}));},
      ()=>{const s=ri(3,9+l),seq=[...Array.from({length:l-1},()=>(rnd()<.5?-1:1)*ri(2,8+l)),-ri(2,9)],end=-s+sum(seq);
        return withSol(N(`Sıcaklık −${s} °C idi. Sonra sırasıyla ${seq.map(v=>v<0?`${-v} °C düştü`:`${v} °C yükseldi`).join(', ')}. Son sıcaklık kaç °C?`,end,`−${s} ${seq.map(v=>v<0?`− ${-v}`:`+ ${v}`).join(' ')} = ${signed(end)}.`,card(`Başlangıç −${s} °C`,...seq.map(v=>v<0?`↓ ${-v}`:`↑ ${v}`)),'°C'),
        SOL(`Yükselmeler pozitif, düşmeler negatif tam sayıdır. Başlangıçtan itibaren hepsini sırayla ekleyelim.`,
          {t:`Adım adım:`,fig:tbl(['Değişim','Sıcaklık'],seq.map((v,i)=>[v<0?`− ${-v}`:`+ ${v}`,signed(-s+sum(seq.slice(0,i+1)))]),null)},
          `Kısa yol: yükselmeler toplamı ${sum(seq.filter(v=>v>0))}, düşmeler toplamı ${-sum(seq.filter(v=>v<0))}. −${s} + ${sum(seq.filter(v=>v>0))} − ${-sum(seq.filter(v=>v<0))} = ${signed(end)} °C.`));},
      ()=>{const n=pick(l===6?[3,5]:l===7?[5,7]:[7,9]),mid=-ri(3,40),S=n*mid,big=rnd()<.5,ans=big?mid+(n-1)/2:mid-(n-1)/2;
        return withSol(N(`Ardışık ${n} tam sayının toplamı ${signed(S)}. En ${big?'büyüğü':'küçüğü'} kaçtır?`,ans,`Ortadaki sayı ${signed(S)} ÷ ${n} = ${signed(mid)}. En ${big?'büyük':'küçük'} sayı ortadakinden ${(n-1)/2} ${big?'fazla':'eksik'}: ${signed(ans)}.`,card(`${n} ardışık tam sayı`,`Toplam ${signed(S)}`),'','Ortadaki sayı ortalamaya eşittir.'),
        SOL(`Tek sayıda ardışık tam sayının ortadaki terimi, ortalamalarına eşittir: ortadan eşit uzaklıktaki sayılar birbirini dengeler.`,
          `Ortalama = toplam ÷ adet = ${signed(S)} ÷ ${n} = ${signed(mid)}. Ortadaki sayı ${signed(mid)}.`,
          {t:`Sayılar: ${Array.from({length:n},(_,i)=>signed(mid-(n-1)/2+i)).join(', ')}.`,fig:F.number([mid-(n-1)/2,mid,mid+(n-1)/2])},
          `En ${big?'büyüğü':'küçüğü'} ${signed(ans)}.`));},
      ()=>{const fl=[ri(-8,12)];while(fl.length<l+1){const v=ri(-8,12);if(v!==fl[fl.length-1])fl.push(v);}const steps=fl.slice(1).map((v,i)=>Math.abs(v-fl[i])),t=sum(steps);
        return withSol(N(`Bir asansör sırasıyla ${fl.map(signed).join(', ')}. katlara gidiyor. Toplam kaç kat yol alır?`,t,`Ardışık katlar arasındaki uzaklıklar ${steps.join(' + ')} = ${t}.`,F.number([Math.min(...fl),0,Math.max(...fl)]),'kat','Her hareketin uzunluğu iki kat numarasının farkının mutlak değeridir.'),
        SOL(`Bir hareketin uzunluğu iki katın sayı doğrusundaki uzaklığıdır: |gidilen − bulunulan|. Yön önemli değil, hepsini toplarız.`,
          {t:`Her hareket:`,fig:tbl(['Nereden','Nereye','Yol'],fl.slice(1).map((v,i)=>[signed(fl[i]),signed(v),Math.abs(v-fl[i])]),['','Toplam',t])},
          `Toplam ${steps.join(' + ')} = ${t} kat.`));},
      ()=>{const n=ri(10,20*l),m=ri(5,20*l),s=(m-n)*(m+n+1)/2;
        return withSol(N(`${E(-n,'den')} ${E(m,'e')} kadar (uçlar dahil) bütün tam sayıların toplamı kaçtır?`,s,`−${Math.min(n,m)} ile ${Math.min(n,m)} arasındakiler karşıtlarıyla birbirini götürür. ${m>n?`Kalan ${n+1} + … + ${m}`:n>m?`Kalan (−${m+1}) + … + (−${n})`:'Hiçbir şey kalmaz'}: ${signed(s)}.`,F.number([-n,0,m]),'','Bir sayı ile karşıtını eşleştir.'),
        SOL(`Bir sayı ile karşıtının toplamı 0'dır (−5 + 5 = 0). Bu yüzden eşleşen çiftler toplamdan düşer.`,
          {t:`−${Math.min(n,m)} ile +${Math.min(n,m)} arasındaki her sayının karşıtı da listede: hepsi birbirini götürür, 0 da bir şey eklemez.`,fig:F.number([-n,0,m])},
          m>n?`Geriye ${n+1}, ${n+2}, …, ${m} kalır. Toplamları (${n+1} + ${m}) × ${m-n} ÷ 2 = ${s}.`:n>m?`Geriye −${m+1}, …, −${n} kalır. Toplamları −(${m+1} + ${n}) × ${n-m} ÷ 2 = ${signed(s)}.`:`Hiçbir sayı kalmaz: toplam 0.`));}
    ],
    rasyonel:(l,ri,pick,rnd)=>[
      ()=>{const b=ri(2,9),a=ri(1,b-1),d=ri(2,9),c=ri(1,d-1);if(gcd(a,b)!==1||gcd(c,d)!==1)return null;const e=ri(8,12+4*l),lo=Math.min(a/b,c/d),hi=Math.max(a/b,c/d),cnt=count(1,e-1,p=>p/e>lo+1e-12&&p/e<hi-1e-12);
        if(lo===hi||!cnt)return null;
        return withSol(N(`${a}/${b} ile ${c}/${d} arasında (uçlar hariç) paydası ${e} olan kaç kesir vardır? (Pay doğal sayı)`,cnt,`Kesirleri ${e} paydasına göre düşün: ${a}/${b} = ${dec(a/b*e)}/${e}, ${c}/${d} = ${dec(c/d*e)}/${e}. Pay bu iki sayı arasında olmalı: ${cnt} kesir.`,card(`${frac(a,b)} ? p/${e} ? ${frac(c,d)}`),'',`İki kesri de paydası ${e} olacak biçimde düşün.`),
        SOL(`Paydası ${e} olan kesirleri karşılaştırmak kolay: yalnız paylara bakarız. Verilen iki kesri de ${e} paydasıyla yazalım.`,
          `${a}/${b} = (${a} × ${e} ÷ ${b})/${e} ≈ ${dec(a/b*e)}/${e}; ${c}/${d} ≈ ${dec(c/d*e)}/${e}.`,
          `Pay, ${dec(lo*e)} ile ${dec(hi*e)} arasında bir tam sayı olmalı (uçlar hariç).`,
          `Bu aralıktaki tam sayılar ${Math.floor(lo*e+1e-9)+1}, …, ${Math.ceil(hi*e-1e-9)-1}: ${cnt} kesir.`));},
      ()=>{const b=ri(2,12),a=ri(1,b-1);if(gcd(a,b)!==1)return null;const t=ri(2,6+l*2),S=(a+b)*t;
        return withSol(N(`${a}/${b} kesrine denk olan ve payı ile paydasının toplamı ${S} olan kesrin payı kaçtır?`,a*t,`Pay ${a}k, payda ${b}k: ${a+b}k = ${S} → k = ${t}. Pay ${a*t}.`,card(`${a}/${b} = ?/?`,`pay + payda = ${S}`)),
        SOL(`Denk kesirler, pay ve paydayı aynı sayıyla çarparak elde edilir: ${a}/${b} = ${a}k/${b}k.`,
          `Pay ${a}k, payda ${b}k. Toplamları ${a}k + ${b}k = ${a+b}k.`,
          `${a+b}k = ${S} → k = ${S} ÷ ${a+b} = ${t}.`,
          `Pay ${a} × ${t} = ${a*t} (kesir ${a*t}/${b*t}).`));},
      ()=>{const y=ri(3,15),x=ri(1,y-1),t=ri(1,10+l*3),g=gcd(x+t,y+t),u=(x+t)/g,v=(y+t)/g;
        return withSol(N(`${x}/${y} kesrinin payına ve paydasına aynı doğal sayı eklenince kesir ${u}/${v} oluyor. Eklenen sayı kaçtır?`,t,`(${x} + t)/(${y} + t) = ${u}/${v} → ${v}(${x} + t) = ${u}(${y} + t) → ${v-u}t = ${u*y-v*x} → t = ${t}.`,card(`(${x} + t)/(${y} + t) = ${u}/${v}`),'','İçler dışlar çarpımı yaz.'),
        SOL(`Eklenen sayıya t diyelim ve iki kesri eşitleyelim. Kesirler eşitse çapraz çarpımlar eşittir.`,
          `(${x} + t)/(${y} + t) = ${u}/${v} → ${v} × (${x} + t) = ${u} × (${y} + t).`,
          `${v*x} + ${v}t = ${u*y} + ${u}t → ${v}t − ${u}t = ${u*y} − ${v*x} → ${v-u}t = ${u*y-v*x}.`,
          `t = ${u*y-v*x} ÷ ${v-u} = ${t}. Kontrol: ${x+t}/${y+t} = ${u}/${v}.`));},
      ()=>{const a=ri(5,40*l),b=ri(2,9),c=ri(5,40*l),d=ri(2,9),lo=-a/b,hi=c/d,cnt=count(Math.ceil(lo),Math.floor(hi),x=>x>lo&&x<hi),first=Math.floor(lo)+1,lastI=Math.ceil(hi)-1;
        return withSol(N(`−${a}/${b} ile ${c}/${d} arasında (uçlar hariç) kaç tam sayı vardır?`,cnt,`−${a}/${b} ≈ −${dec(a/b)}, ${c}/${d} ≈ ${dec(hi)}. Aradaki tam sayılar ${signed(first)} ile ${signed(lastI)} arası: ${cnt}.`,card(`−${a}/${b} < x < ${c}/${d}`,'x tam sayı'),'','Kesirleri tam sayılar arasına yerleştir.'),
        SOL(`Kesirleri bölerek hangi tam sayıların arasında olduklarını bulalım.`,
          `−${a}/${b} = −(${a} ÷ ${b}) ≈ −${dec(a/b)}: bu sayı ${signed(Math.floor(lo))} ile ${signed(Math.floor(lo)+1)} arasında.`,
          `${c}/${d} = ${c} ÷ ${d} ≈ ${dec(hi)}: bu sayı ${Math.ceil(hi)-1} ile ${Math.ceil(hi)} arasında.`,
          {t:`Aradaki tam sayılar ${E(first,'den')} ${E(lastI,'e')} kadar: ${signed(lastI)} − (${signed(first)}) + 1 = ${cnt}.`,fig:F.number([first,0,lastI])}));},
      ()=>{const n=ri(4,l===8?40:20);
        return withSol(l===8?Q(`1/(1·3) + 1/(3·5) + 1/(5·7) + … + 1/(${2*n-1}·${2*n+1}) toplamı kaçtır?`,n,2*n+1,`Her terim 1/((2k − 1)(2k + 1)) = ½ · (1/(2k − 1) − 1/(2k + 1)). Terimler birbirini götürür: ½ · (1 − 1/${2*n+1}) = ${n}/${2*n+1}.`,card('1/(1·3) + 1/(3·5) + …',`son terim 1/(${2*n-1}·${2*n+1})`))
          :Q(`1/(1·2) + 1/(2·3) + 1/(3·4) + … + 1/(${n}·${n+1}) toplamı kaçtır?`,n,n+1,`1/(k(k + 1)) = 1/k − 1/(k + 1). Terimler birbirini götürür: 1 − 1/${n+1} = ${n}/${n+1}.`,card('1/(1·2) + 1/(2·3) + …',`son terim 1/(${n}·${n+1})`)),
        l===8?SOL(`Her terimi iki kesrin farkı olarak yazarsak terimler zincirleme birbirini götürür (teleskop toplam).`,
          `1/(1·3) = ½ · (1 − 1/3), 1/(3·5) = ½ · (1/3 − 1/5), 1/(5·7) = ½ · (1/5 − 1/7), …`,
          {t:`Toplarken −1/3 ile +1/3, −1/5 ile +1/5 … birbirini götürür.`,fig:card('½ · (1 − 1/3 + 1/3 − 1/5 + … − 1/'+(2*n+1)+')')},
          `Geriye ½ · (1 − 1/${2*n+1}) = ½ · ${2*n}/${2*n+1} = ${n}/${2*n+1} kalır.`)
          :SOL(`Her terimi iki kesrin farkı olarak yazarsak terimler zincirleme birbirini götürür (teleskop toplam).`,
          `1/(1·2) = 1 − 1/2, 1/(2·3) = 1/2 − 1/3, 1/(3·4) = 1/3 − 1/4, … Genel: 1/(k(k + 1)) = 1/k − 1/(k + 1).`,
          {t:`Toplarken −1/2 ile +1/2, −1/3 ile +1/3 … birbirini götürür.`,fig:card(`(1 − 1/2) + (1/2 − 1/3) + … + (1/${n} − 1/${n+1})`)},
          `Geriye 1 − 1/${n+1} = ${n}/${n+1} kalır.`));}
    ],
    mutlakdeger:(l,ri,pick,rnd)=>[
      ()=>{if(l===8){const xs=[ri(-20,-1),ri(0,10),ri(11,30)],m=xs[2]-xs[0];return withSol(N(`|x ${minus(xs[0])}| + |x ${minus(xs[1])}| + |x ${minus(xs[2])}| ifadesinin alabileceği en küçük değer kaçtır?`,m,`İfade, x'in ${xs.map(signed).join(', ')} noktalarına uzaklıkları toplamı. En küçük değer x ortadaki noktadayken (x = ${xs[1]}) olur: uçlar arası ${xs[2]} − (${signed(xs[0])}) = ${m}.`,F.number(xs),'','Uzaklıklar toplamı ortadaki noktada en küçüktür.'),
        SOL(`|x − a| ifadesi, sayı doğrusunda x ile a arasındaki uzaklıktır. İfade, x'in üç noktaya uzaklıklarının toplamı.`,
          {t:`Noktalar ${xs.map(signed).join(', ')}. x uçların dışına çıkarsa uzaklıklar artar.`,fig:F.number(xs)},
          `x en dıştaki iki nokta arasındayken bu iki noktaya uzaklıkların toplamı her zaman ${xs[2]} − (${signed(xs[0])}) = ${m}.`,
          `Ortadaki noktaya uzaklık da x = ${xs[1]} iken 0 olur. En küçük değer ${m} + 0 = ${m}.`));}
        const a=ri(-15*l,-1),b=ri(1,15*l);return withSol(N(`|x ${minus(a)}| + |x ${minus(b)}| ifadesinin alabileceği en küçük değer kaçtır?`,b-a,`İfade, x'in ${signed(a)} ve ${b} noktalarına uzaklıkları toplamıdır. x bu iki nokta arasındayken toplam ${b} − (${signed(a)}) = ${b-a} olur ve daha küçük olamaz.`,F.number([a,0,b]),'','Mutlak değeri uzaklık olarak düşün.'),
        SOL(`|x − a| ifadesi, sayı doğrusunda x ile a arasındaki uzaklıktır. İfade, x'in iki noktaya uzaklıklarının toplamı.`,
          {t:`Noktalar ${signed(a)} ve ${b}. x bu iki noktanın arasındaysa iki uzaklık uç uca eklenince tam aradaki mesafeyi verir.`,fig:F.number([a,0,b])},
          `Aradaki mesafe ${b} − (${signed(a)}) = ${b-a}. x dışarı çıkarsa toplam bundan büyük olur.`,
          `En küçük değer ${b-a}.`));},
      ()=>{const a=ri(-10,10),k=ri(3,6+l),b=a+ri(-k-4,k+4),m=ri(2,5+l),c=count(-200,200,x=>Math.abs(x-a)<k&&Math.abs(x-b)<m);
        return withSol(N(`|x ${minus(a)}| < ${k} ve |x ${minus(b)}| < ${m} koşullarının ikisini birden sağlayan kaç tam sayı vardır?`,c,`Birinci koşul: ${signed(a-k)} < x < ${signed(a+k)}. İkinci: ${signed(b-m)} < x < ${signed(b+m)}. Ortak kısımdaki tam sayılar: ${c}.`,F.number([a-k,a,a+k]),'','Her koşulu bir aralık olarak yaz, ortak kısmı al.'),
        SOL(`|x − a| < k demek: x, a'ya k birimden yakın. Yani a − k < x < a + k.`,
          `Birinci koşul: ${signed(a-k)} < x < ${signed(a+k)}.`,
          `İkinci koşul: ${signed(b-m)} < x < ${signed(b+m)}.`,
          {t:`İkisi birden: ${signed(Math.max(a-k,b-m))} < x < ${signed(Math.min(a+k,b+m))}. Aradaki tam sayılar: ${c}.`,fig:F.number([Math.max(a-k,b-m),Math.min(a+k,b+m)])}));},
      ()=>{const n=ri(2,5*l);return withSol(l===8?N(`|x| + |y| ≤ ${n} koşulunu sağlayan kaç (x, y) tam sayı ikilisi vardır?`,2*n*n+2*n+1,`|x| + |y| = 0 için 1 ikili, k ≥ 1 için 4k ikili var. 1 + 4 × (1 + 2 + … + ${n}) = 1 + 2 × ${n} × ${n+1} = ${2*n*n+2*n+1}.`,card(`|x| + |y| ≤ ${n}`,'(x, y) tam sayı'),'','Önce |x| + |y| = k eşitliğinin kaç çözümü olduğunu bul.')
        :N(`|x| + |y| = ${n} eşitliğini sağlayan kaç (x, y) tam sayı ikilisi vardır?`,4*n,`x = 0 iken y = ±${n}, y = 0 iken x = ±${n}: 4 ikili. |x| = 1, …, ${n-1} için her birinde 4 ikili: 4 + 4 × ${n-1} = ${4*n}.`,card(`|x| + |y| = ${n}`,'(x, y) tam sayı'),'',`|x| değerini 0'dan ${E(n,'e')} kadar dene.`),
        l===8?SOL(`Önce |x| + |y| = k eşitliğinin kaç çözümü olduğunu bulalım, sonra k = 0, 1, …, ${n} için toplayalım.`,
          `k = 0: yalnız (0, 0) → 1 çözüm. k ≥ 1: 4k çözüm (sağdaki adımlara bak).`,
          {t:`k = 1 için: (1, 0), (−1, 0), (0, 1), (0, −1) → 4 çözüm. Genel olarak 4k.`,fig:tbl(['k','Çözüm'],[[0,1],[1,4],[2,8],['…','…'],[n,4*n]],['Toplam',2*n*n+2*n+1])},
          `1 + 4 × (1 + 2 + … + ${n}) = 1 + 4 × ${n*(n+1)/2} = ${2*n*n+2*n+1}.`)
          :SOL(`|x| değerini 0'dan ${E(n,'e')} kadar dene; her durumda |y| belli olur.`,
          `|x| = 0 → x = 0, |y| = ${n} → y = ±${n}: 2 çözüm. |x| = ${n} → y = 0, x = ±${n}: 2 çözüm.`,
          {t:`|x| = 1, …, ${n-1}: x için 2, y için 2 seçenek → her biri 4 çözüm.`,fig:tbl(['|x|','|y|','Çözüm'],[[0,n,2],[1,n-1,4],['…','…','4'],[n-1,1,4],[n,0,2]],['','Toplam',4*n])},
          `2 + 4 × ${n-1} + 2 = ${4*n}.`));},
      ()=>{let a=ri(-20,20);if(!a)a=7;const b=ri(1,10*l);return withSol(N(`|2x ${minus(a)}| = ${b} eşitliğini sağlayan x değerlerinin toplamı kaçtır?`,a,`2x ${minus(a)} = ${b} ya da 2x ${minus(a)} = −${b}. Çözümler (${signed(a)} + ${b})/2 ve (${signed(a)} − ${b})/2; toplamları ${signed(a)}.`,card(`|2x ${minus(a)}| = ${b}`),'','İki çözüm, '+signed(a)+'/2 noktasına eşit uzaklıkta.'),
        SOL(`Mutlak değeri ${b} olan sayı ya ${b} ya da −${b}'dir. İki ayrı denklem kurarız.`,
          `2x ${minus(a)} = ${b} → x = (${signed(a)} + ${b}) ÷ 2.`,
          `2x ${minus(a)} = −${b} → x = (${signed(a)} − ${b}) ÷ 2.`,
          `Toplam: (${signed(a)} + ${b} + ${signed(a)} − ${b}) ÷ 2 = ${signed(2*a)} ÷ 2 = ${signed(a)}. (${b} sayıları birbirini götürür.)`));},
      ()=>{const n=ri(6,6+5*l),v=n%2?(n*n-1)/4:n*n/4;return withSol(N(`|x − 1| + |x − 2| + |x − 3| + … + |x − ${n}| ifadesinin en küçük değeri kaçtır?`,v,`Uzaklıklar toplamı ortadaki noktada en küçüktür (x = ${Math.ceil(n/2)}). Uçlardan içe doğru eşleştir: (${n} − 1) + (${n-1} − 2) + … = ${v}.`,F.number([1,Math.ceil(n/2),n]),'',`Sayı doğrusunda 1, 2, …, ${n} noktalarına uzaklıkları topladığını düşün.`),
        SOL(`|x − k| ifadesi x'in k'ye uzaklığı. Uç noktaları ikişer eşleştirelim: 1 ile ${n}, 2 ile ${n-1}, …`,
          `x, 1 ile ${n} arasındaysa bu iki noktaya uzaklıkların toplamı her zaman ${n} − 1 = ${n-1}. Benzer şekilde 2 ile ${n-1} çifti için ${n-3}…`,
          {t:`x ortadayken (x = ${Math.ceil(n/2)}) bütün çiftlerin arasında kalır ve her çift en küçük değerini alır:`,fig:tbl(['Çift','Uzaklık'],Array.from({length:Math.floor(n/2)},(_,i)=>[`${i+1} ve ${n-i}`,n-1-2*i]),['Toplam',v])},
          `En küçük değer ${Array.from({length:Math.floor(n/2)},(_,i)=>n-1-2*i).join(' + ')} = ${v}.`));}
    ],
    temsiller:(l,ri,pick,rnd)=>[
      ()=>{const q=pick(l===6?[7]:[7,13]),p=ri(1,q-1),n=ri(20,60*l),dg=decimals(p,q,n)[n-1],per=decimals(p,q,6).join('');
        return withSol(N(`${p}/${q} kesrinin ondalık gösteriminde virgülden sonraki ${n}. basamaktaki rakam kaçtır?`,dg,`${p}/${q} = 0,${per}${per}…; devir 6 basamaklı. ${n} ÷ 6 kalanı ${n%6}${n%6?'':' (tam bölünür, devrin son rakamı)'}: rakam ${dg}.`,card(`${p}/${q} = 0,${per}${per}…`),'','Devreden kısım kaç basamaklı?'),
        SOL(`${p}/${q} kesrinin ondalık açılımı 6 basamaklık bir grup olarak tekrar eder. Basamağı bulmak için yalnız grubun içindeki yerine bakarız.`,
          {t:`Uzun bölme: ${p}/${q} = 0,${per} ${per} ${per}…`,fig:tbl(['Sıra',...per.split('').map((_,i)=>i+1)],[['Rakam',...per.split('')]])},
          `${n}. basamak: ${n} ÷ 6 = ${Math.floor(n/6)}, kalan ${n%6}. ${n%6?`Grubun ${n%6}. rakamı`:'Kalan 0 → grubun 6. (son) rakamı'}.`,
          `Rakam ${dg}.`));},
      ()=>{const ab=ri(10,98);if(ab%11===0)return null;const g=gcd(ab,99),p=ab/g,q=99/g;
        return withSol(N(`0,${ab}${ab}${ab}… (${ab} devirli) sayısı en sade kesir olarak yazılınca pay ile paydanın toplamı kaçtır?`,p+q,`0,(${ab}) = ${ab}/99 = ${p}/${q}. ${p} + ${q} = ${p+q}.`,card(`0,(${ab}) = ?/?`),'','İki basamak devreden sayı 99 paydalı yazılır.'),
        SOL(`İki basamaklı bir grup devrediyorsa sayıyı 100 ile çarpıp kendisinden çıkarırız; devreden kısım yok olur.`,
          `x = 0,${ab}${ab}… → 100x = ${ab},${ab}${ab}…`,
          `100x − x = ${ab} → 99x = ${ab} → x = ${ab}/99.`,
          `Sadeleştir (${ab} ve 99'un ortak böleni ${g}): ${p}/${q}. Pay + payda = ${p} + ${q} = ${p+q}.`));},
      ()=>{const q=pick([3,6,7,9,11,12,13]),p=ri(1,q-1),n=ri(6,10+8*l),s=sum(decimals(p,q,n));
        return withSol(N(`${p}/${q} kesrinin ondalık gösteriminde virgülden sonraki ilk ${n} basamağın toplamı kaçtır?`,s,`${p}/${q} = 0,${decimals(p,q,12).join('')}… Devir tekrar ettirilip ilk ${n} rakam toplanır: ${s}.`,card(`${p}/${q} = 0,…`),'','Devri bul; kaç tam devir ve kaç fazla rakam var?'),
        SOL(`Ondalık açılım bir noktadan sonra aynı grubu tekrarlar. Grubu bulup kaç kez tekrarlandığını sayarız.`,
          `${p}/${q} = 0,${decimals(p,q,12).join('')}…`,
          `İlk ${n} rakam yazılıp toplanır (tekrar eden grubun toplamını grup sayısıyla çarpmak işi kısaltır).`,
          `Toplam ${s}.`));},
      ()=>{const i=ri(0,3+l),j=ri(0,3+l);if(!i&&!j)return null;const a=pick([1,3,7,9,11,13,17,21]),d=Math.max(i,j),den=[i?'2'+(i>1?sup(i):''):'',j?'5'+(j>1?sup(j):''):''].filter(Boolean).join(' · ');
        return withSol(N(`${a}/(${den}) kesrinin ondalık gösteriminde virgülden sonra kaç basamak vardır?`,d,`Paydayı 10'un kuvveti yapmak için ${i<j?`${j-i} kez 2 ile`:i>j?`${i-j} kez 5 ile`:'hiç'} genişletmek yeter; payda 10${d>1?sup(d):''} olur. Pay 10 ile sadeleşmediğinden virgülden sonra ${d} basamak.`,card(`payda: ${den}`),'','Paydayı 10, 100, 1000… olacak biçimde genişlet.'),
        SOL(`Paydası yalnız 2 ve 5 çarpanlarından oluşan kesir sonlu ondalık olur. Paydayı 10'un bir kuvvetine tamamlarız.`,
          `10 = 2 × 5. Payda ${den}. 2 ve 5 sayıları eşitlenince payda 10'un kuvveti olur.`,
          `${i<j?`Eksik ${j-i} tane 2 var: pay ve paydayı 2${j-i>1?sup(j-i):''} ile çarp.`:i>j?`Eksik ${i-j} tane 5 var: pay ve paydayı 5${i-j>1?sup(i-j):''} ile çarp.`:'2 ve 5 sayıları zaten eşit.'} Payda 10${d>1?sup(d):''} olur.`,
          `10${d>1?sup(d):''} paydalı kesir virgülden sonra ${d} basamaklıdır (pay 10'a bölünmediği için sondaki rakam 0 olmaz).`));},
      ()=>{const a=ri(1,9),b=ri(1,9),num=10*a+b;return withSol(Q(`0,${a}${a}${a}… (${a} devirli) ile 0,0${b}${b}${b}… (${b} devirli) sayılarının toplamı hangi kesirdir?`,num,90,`0,(${a}) = ${a}/9 = ${10*a}/90; 0,0(${b}) = ${b}/90. Toplam ${num}/90 = ${frac(num,90)}.`,card(`0,(${a}) + 0,0(${b})`)),
        SOL(`Devirli ondalıkları kesre çevirip ortak paydada toplayalım.`,
          `0,${a}${a}${a}… = ${a}/9 (tek basamak devrediyor).`,
          `0,0${b}${b}… = 0,${b}${b}… sayısının onda biri = ${b}/9 ÷ 10 = ${b}/90.`,
          `${a}/9 = ${10*a}/90. Toplam (${10*a} + ${b})/90 = ${num}/90 = ${frac(num,90)}.`));}
    ],
    siralama:(l,ri,pick,rnd)=>[
      ()=>{const fr=Array.from({length:3},()=>{const b=ri(2,9+l);return [ri(-b*2,b*2),b];}),v=fr.map(([a,b])=>a/b),mx=v.indexOf(Math.max(...v)),mn=v.indexOf(Math.min(...v));if(mx===mn||new Set(v).size<3)return null;
        const [a1,b1]=fr[mx],[a2,b2]=fr[mn];return withSol(Q(`${fr.map(([a,b])=>fx(a,b)).join(', ')} sayılarından en büyüğü ile en küçüğünün farkı kaçtır?`,a1*b2-a2*b1,b1*b2,`En büyük ${fx(a1,b1)}, en küçük ${fx(a2,b2)}. Fark ${fx(a1*b2-a2*b1,b1*b2)}.`,card(...fr.map(([a,b])=>fx(a,b)))),
        SOL(`Kesirleri karşılaştırmak için ortak paydaya getiririz ya da ondalık değerlerine bakarız.`,
          {t:`Değerler:`,fig:tbl(['Kesir','Yaklaşık değer'],fr.map(([a,b])=>[fx(a,b),dec(a/b).replace('-','−')]))},
          `En büyük ${fx(a1,b1)}, en küçük ${fx(a2,b2)}.`,
          `Fark: ${fx(a1,b1)} − (${fx(a2,b2)}) = (${a1*b2} − (${signed(a2*b1)}))/${b1*b2} = ${fx(a1*b2-a2*b1,b1*b2)}.`));},
      ()=>{const b=ri(2,9),a=ri(1,b*2),d=ri(2,9),c=a*d+ri(2,10)*b,n=ri(6,10+5*l),lo=a/b,hi=c/(b*d),cnt=count(-500,500,x=>x/n>lo+1e-12&&x/n<hi-1e-12);
        return withSol(N(`${frac(a,b)} < x/${n} < ${frac(c,b*d)} koşulunu sağlayan kaç x tam sayısı vardır?`,cnt,`Eşitsizliği ${n} ile çarp: ${dec(lo*n)} < x < ${dec(hi*n)}. Aradaki tam sayılar: ${cnt}.`,card(`${frac(a,b)} < x/${n} < ${frac(c,b*d)}`),'',`Bütün tarafları ${n} ile çarp.`),
        SOL(`x/${n} ifadesinden kurtulmak için eşitsizliğin bütün taraflarını ${n} ile çarparız (pozitif sayıyla çarpınca yön değişmez).`,
          `${frac(a,b)} × ${n} = ${dec(lo*n)} ve ${frac(c,b*d)} × ${n} = ${dec(hi*n)}.`,
          `${dec(lo*n)} < x < ${dec(hi*n)}: x, ${Math.floor(lo*n+1e-9)+1} ile ${Math.ceil(hi*n-1e-9)-1} arasındaki tam sayılardır.`,
          `Sayısı ${cnt}.`));},
      ()=>{const n=ri(3,20*l),opts=[[n-1,n],[n,n+1],[n+1,n+2],[n+2,n+3]],ans=frac(n+2,n+3);
        return withSol(C(`${opts.map(([a,b])=>`${a}/${b}`).join(', ')} kesirlerinden en büyüğü hangisidir?`,ans,opts.slice(0,3).map(([a,b])=>frac(a,b)),`Her kesir 1'den 1/payda kadar küçüktür. Paydası en büyük olan 1'e en yakındır: ${n+2}/${n+3}.`,card(...opts.map(([a,b])=>`${a}/${b}`)),"Her kesrin 1'e uzaklığına bak."),
        SOL(`Bu kesirlerin hepsi 1'den biraz küçük. Hangisi 1'e daha yakınsa o daha büyüktür.`,
          `n/(n + 1) kesri 1'den 1/(n + 1) kadar eksiktir. Örneğin ${n}/${n+1} = 1 − 1/${n+1}.`,
          {t:`Eksik kısımlar: ${opts.map(([a,b])=>`1/${b}`).join(', ')}. Payda büyüdükçe eksik kısım küçülür.`,fig:tbl(['Kesir','1’den eksik'],opts.map(([a,b])=>[`${a}/${b}`,`1/${b}`]))},
          `En az eksik olan ${n+2}/${n+3}: en büyük kesir.`));},
      ()=>{const a=ri(5,30*l),b=ri(2,7),c=ri(5,30*l),d=ri(2,7),lo=-a/b,hi=c/d,xs=[];for(let x=Math.ceil(lo);x<=Math.floor(hi);x++)if(x>lo&&x<hi)xs.push(x);
        return withSol(N(`−${a}/${b} ile ${c}/${d} arasındaki (uçlar hariç) tam sayıların toplamı kaçtır?`,sum(xs),`Aradaki tam sayılar ${signed(xs[0])} ile ${signed(xs[xs.length-1])} arası. Karşıt sayılar birbirini götürür; kalanların toplamı ${signed(sum(xs))}.`,card(`−${a}/${b} < x < ${c}/${d}`,'x tam sayı'),'','Bir sayı ile karşıtını eşleştir.'),
        SOL(`Önce aradaki tam sayıları bulalım; sonra karşıt sayıların birbirini götürdüğünü kullanalım.`,
          `−${a}/${b} ≈ −${dec(a/b)} ve ${c}/${d} ≈ ${dec(hi)}. Aradaki tam sayılar ${signed(xs[0])}, …, ${signed(xs[xs.length-1])}.`,
          {t:`−${Math.min(-xs[0],xs[xs.length-1])} ile ${Math.min(-xs[0],xs[xs.length-1])} arasındakiler karşıtlarıyla birbirini götürür.`,fig:F.number([xs[0],0,xs[xs.length-1]])},
          `Geriye kalanların toplamı ${signed(sum(xs))}.`));},
      ()=>{const b=ri(5,13),a=ri(1,b-1);if(gcd(a,b)!==1)return null;const D=ri(4,6+2*l);let best=null;
        for(let q=1;q<=D;q++)for(let p=1;p<=q;p++){if(p*b<=a*q)continue;if(!best||p*best[1]<best[0]*q)best=[p,q];}
        if(!best||best[1]===b)return null;
        return withSol(Q(`Paydası en çok ${D} olan pozitif kesirlerden ${a}/${b} kesrinden büyük olan en küçüğü hangisidir?`,best[0],best[1],`Her payda q için ${a}/${b} kesrinden büyük en küçük pay bulunur; adaylar karşılaştırılır. En küçüğü ${frac(...best)}.`,card(`${a}/${b} < p/q`,`q ≤ ${D}`)),
        SOL(`Her payda için ${a}/${b} kesrinden büyük olan en küçük payı bulalım; sonra bu adayları karşılaştıralım.`,
          `Payda q iken pay p, p/q > ${a}/${b} olmalı: p > ${a}q/${b}. En küçük uygun p seçilir.`,
          {t:`Adaylar:`,fig:tbl(['Payda q','En küçük pay','Kesir','Değer'],Array.from({length:D},(_,i)=>{const q=i+1,p=Math.floor(a*q/b)+1;return [q,p,`${p}/${q}`,dec(p/q)];}).filter(r=>r[1]<=r[0]))},
          `${a}/${b} ≈ ${dec(a/b)}. Ondan büyük en küçük değer: ${frac(...best)} ≈ ${dec(best[0]/best[1])}.`));}
    ],
    tamsayiislemler:(l,ri,pick,rnd)=>[
      ()=>{const n=ri(20,200*l),v=n%2?-1:0;return withSol(N(`(−1)¹ + (−1)² + (−1)³ + … + (−1)${sup(n)} toplamı kaçtır?`,v,`Ardışık iki terim (−1) + 1 = 0. ${n} terimde ${Math.floor(n/2)} çift sıfır verir${n%2?'; son terim −1 kalır':''}: ${signed(v)}.`,card('(−1) + 1 + (−1) + 1 + …',`${n} terim`)),
        SOL(`(−1)'in kuvvetleri sırayla −1, 1, −1, 1, … olur: tek üste −1, çift üste 1.`,
          {t:`Terimleri ikişer grupla: (−1 + 1) = 0.`,fig:card('(−1 + 1) + (−1 + 1) + …')},
          `${n} terimde ${Math.floor(n/2)} çift var; her biri 0.`,
          n%2?`Terim sayısı tek: son terim (−1)${sup(n)} = −1 açıkta kalır. Toplam −1.`:`Terim sayısı çift: açıkta terim kalmaz. Toplam 0.`));},
      ()=>{const base=Array.from({length:l===8?4:3},()=>ri(-15,15)),top=l===8?base[0]+3*base[1]+3*base[2]+base[3]:base[0]+2*base[1]+base[2];
        return withSol(N(`Sayı piramidinde her kutu, altındaki iki kutunun toplamıdır. En alt sıra soldan sağa ${base.map(signed).join(', ')}. En üstteki sayı kaçtır?`,top,`${l===8?`Tepe = a + 3b + 3c + d = ${par(base[0])} + 3 × ${par(base[1])} + 3 × ${par(base[2])} + ${par(base[3])}`:`Tepe = a + 2b + c = ${par(base[0])} + 2 × ${par(base[1])} + ${par(base[2])}`} = ${signed(top)}.`,card('▲',`alt sıra: ${base.map(signed).join(' | ')}`),'','Ortadaki kutular tepeye kaç farklı yoldan katkı verir?'),
        l===8?SOL(`Piramidi harflerle kuralım: alt sıra a, b, c, d. Her kutu altındaki iki kutunun toplamı.`,
          `2. sıra: a + b, b + c, c + d. 3. sıra: a + 2b + c, b + 2c + d. Tepe: a + 3b + 3c + d.`,
          {t:`Sayılar yerine konur:`,fig:tbl(['Sıra','Kutular'],[['Alt',base.map(signed).join(' | ')],['2.',[base[0]+base[1],base[1]+base[2],base[2]+base[3]].map(signed).join(' | ')],['3.',[base[0]+2*base[1]+base[2],base[1]+2*base[2]+base[3]].map(signed).join(' | ')]],['Tepe',signed(top)])},
          `Tepe ${signed(top)}.`)
          :SOL(`Piramidi harflerle kuralım: alt sıra a, b, c. Her kutu altındaki iki kutunun toplamı.`,
          `Orta sıra: a + b ve b + c. Tepe: (a + b) + (b + c) = a + 2b + c. Ortadaki sayı iki kez sayılır.`,
          {t:`Sayılar yerine konur:`,fig:tbl(['Sıra','Kutular'],[['Alt',base.map(signed).join(' | ')],['Orta',[base[0]+base[1],base[1]+base[2]].map(signed).join(' | ')]],['Tepe',signed(top)])},
          `Tepe ${signed(top)}.`));},
      ()=>{const n=ri(15,150*l);return withSol(rnd()<.5?N(`1 − 2 + 3 − 4 + … − ${2*n} + ${2*n+1} işleminin sonucu kaçtır?`,n+1,`(1 − 2) + (3 − 4) + … + (${2*n-1} − ${2*n}) = −${n}; son terim ${2*n+1} eklenir: ${n+1}.`,card(`1 − 2 + 3 − … + ${2*n+1}`)):N(`1 − 2 + 3 − 4 + … + ${2*n-1} − ${2*n} işleminin sonucu kaçtır?`,-n,`Her çift (2k − 1) − 2k = −1. ${n} çift: −${n}.`,card(`1 − 2 + 3 − … − ${2*n}`)),
        SOL(`Terimleri ikişer gruplayalım: (1 − 2), (3 − 4), … Her grup −1 eder.`,
          {t:`Gruplar:`,fig:card('(1 − 2) + (3 − 4) + (5 − 6) + …')},
          `${2*n} terimde ${n} grup var. ${n} × (−1) = −${n}.`,
          `Eğer son terim + ${2*n+1} olsaydı (tek sayıda terim), −${n} + ${2*n+1} = ${n+1} çıkardı.`));},
      ()=>{const x=-ri(2,Math.floor(15*l/2)),y=ri(2,Math.floor(15*l/2));if(x+y===0)return null;return withSol(N(`Çarpımları ${signed(x*y)}, toplamları ${signed(x+y)} olan iki tam sayıdan küçüğü kaçtır?`,x,`Çarpım negatif: biri negatif, biri pozitif. ${E(-x*y,'in')} çarpan çiftlerinden toplamı ${signed(x+y)} veren ${y} ve ${signed(x)}.`,card(`a · b = ${signed(x*y)}`,`a + b = ${signed(x+y)}`),'','Çarpımın işaretinden sayıların işaretlerini çıkar.'),
        SOL(`Çarpım negatifse sayılardan biri negatif, biri pozitiftir. Toplamın işareti hangisinin daha büyük olduğunu söyler.`,
          `Çarpım ${signed(x*y)} → sayıların mutlak değerleri ${-x*y} sayısının çarpanları.`,
          {t:`Çarpanlar ve toplamları:`,fig:tbl(['Pozitif','Negatif','Toplam'],(()=>{const r=[];for(let p=1;p<=-x*y;p++)if((-x*y)%p===0)r.push([p,signed(-(-x*y)/p),signed(p-(-x*y)/p)]);return r.slice(0,8);})())},
          `Toplamı ${signed(x+y)} olan çift: ${y} ve ${signed(x)}. Küçüğü ${signed(x)}.`));},
      ()=>{const p=ri(2,5+l),q=ri(2,5+l),v=(-2)**p+(-2)**q;return withSol(N(`(−2)${sup(p)} + (−2)${sup(q)} işleminin sonucu kaçtır?`,v,`(−2)${sup(p)} = ${signed((-2)**p)} (üs ${p%2?'tek':'çift'}), (−2)${sup(q)} = ${signed((-2)**q)}. Toplam ${signed(v)}.`,card(`(−2)${sup(p)} + (−2)${sup(q)}`),'','Negatif tabanın tek kuvveti negatif, çift kuvveti pozitiftir.'),
        SOL(`(−2)'nin kuvvetinde işaret, üssün tek ya da çift olmasına bağlıdır: her iki eksi bir artı eder.`,
          {t:`İlk kuvvetler:`,fig:tbl(['Üs','Değer'],Array.from({length:Math.max(p,q)},(_,i)=>[i+1,signed((-2)**(i+1))]).slice(-6))},
          `(−2)${sup(p)} = ${signed((-2)**p)}, (−2)${sup(q)} = ${signed((-2)**q)}.`,
          `Toplam ${signed((-2)**p)} + (${signed((-2)**q)}) = ${signed(v)}.`));}
    ],
    rasyonelislemler:(l,ri,pick,rnd)=>{
      const part={2:'yarısını',3:'üçte birini',4:'dörtte birini',5:'beşte birini',6:'altıda birini'};
      return [
        ()=>{const n=ri(5,30*l);return withSol(Q(`(1 − 1/2) · (1 − 1/3) · (1 − 1/4) · … · (1 − 1/${n}) çarpımı kaçtır?`,1,n,`Her çarpan (k − 1)/k: 1/2 · 2/3 · 3/4 · … · ${n-1}/${n}. Pay ve paydalar sadeleşir: 1/${n}.`,card(`(1 − 1/2)(1 − 1/3)…(1 − 1/${n})`)),
        SOL(`Her parantezi tek kesir olarak yazalım; ardışık kesirlerin payı ile paydası birbirini götürecek.`,
          `1 − 1/2 = 1/2, 1 − 1/3 = 2/3, 1 − 1/4 = 3/4, …, 1 − 1/${n} = ${n-1}/${n}.`,
          {t:`Çarpım: 1/2 · 2/3 · 3/4 · … · ${n-1}/${n}. Her payda, sonraki kesrin payıyla sadeleşir.`,fig:card('1/2 · 2/3 · 3/4 · … · '+(n-1)+'/'+n)},
          `Geriye ilk pay (1) ve son payda (${n}) kalır: 1/${n}.`));},
        ()=>{const n=ri(5,30*l);return withSol(Q(`(1 + 1/2) · (1 + 1/3) · (1 + 1/4) · … · (1 + 1/${n}) çarpımı kaçtır?`,n+1,2,`Her çarpan (k + 1)/k: 3/2 · 4/3 · … · ${n+1}/${n}. Sadeleşince ${n+1}/2 kalır.`,card(`(1 + 1/2)(1 + 1/3)…(1 + 1/${n})`)),
        SOL(`Her parantezi tek kesir olarak yazalım; ardışık kesirlerin payı ile paydası birbirini götürecek.`,
          `1 + 1/2 = 3/2, 1 + 1/3 = 4/3, 1 + 1/4 = 5/4, …, 1 + 1/${n} = ${n+1}/${n}.`,
          {t:`Çarpım: 3/2 · 4/3 · 5/4 · … · ${n+1}/${n}. Her pay, sonraki kesrin paydasıyla sadeleşir.`,fig:card('3/2 · 4/3 · 5/4 · … · '+(n+1)+'/'+n)},
          `Geriye son pay (${n+1}) ve ilk payda (2) kalır: ${n+1}/2.`));},
        ()=>{const b=ri(2,7),a=ri(1,b-1),d=ri(2,7),c=ri(1,d-1);if(gcd(a,b)!==1||gcd(c,d)!==1)return null;const x=b*d*ri(2,4*l),V=x*a*c/(b*d);return withSol(N(`Bir sayının ${a}/${b} katının ${c}/${d} katı ${V}. Sayı kaçtır?`,x,`x · ${a}/${b} · ${c}/${d} = ${V} → x = ${V} · ${b*d}/${a*c} = ${x}.`,card(`x · ${a}/${b} · ${c}/${d} = ${V}`),'','Kesirlerin tersleriyle çarp.'),
        SOL(`"Bir sayının a/b katı" o sayıyı a/b ile çarpmak demektir. Sayıya x diyelim ve işlemleri tersine çevirelim.`,
          `x · ${a}/${b} · ${c}/${d} = ${V} → x · ${a*c}/${b*d} = ${V}.`,
          `Bir sayıyı ${a*c}/${b*d} ile çarpmanın tersi, ${b*d}/${a*c} ile çarpmaktır.`,
          `x = ${V} · ${b*d}/${a*c} = ${V*b*d}/${a*c} = ${x}.`));},
        ()=>{const a=ri(2,6),b=ri(2,6),c=ri(2,6),unit=ri(1,3+l),start=a*b*c*unit,left=(a-1)*(b-1)*(c-1)*unit;
          return withSol(N(`Bir kişi parasının önce ${part[a]} harcıyor, sonra kalanın ${part[b]}, sonra yine kalanın ${part[c]} harcıyor. Geriye ${left} TL kalıyor. Başlangıçta kaç TL'si vardı?`,start,`Her adımda kalan oran: ${a-1}/${a}, ${b-1}/${b}, ${c-1}/${c}. Başlangıç × ${(a-1)*(b-1)*(c-1)}/${a*b*c} = ${left} → başlangıç ${start}.`,card(`1/${a} → kalanın 1/${b} → kalanın 1/${c}`,`Kalan ${left} TL`),'TL','Sondan başa doğru çalış.'),
        SOL(`Her harcamadan sonra kalanı kesirle yazalım ve sondan başa doğru geri gidelim.`,
          `${part[a]} harcayınca ${a-1}/${a}, sonra kalanın ${part[b]} harcayınca kalanın ${b-1}/${b} kadarı, en son kalanın ${c-1}/${c} kadarı kalır.`,
          {t:`Geri gidelim:`,fig:tbl(['Adım','Kalan para'],[['Sonda',`${left} TL`],[`Son harcamadan önce (× ${c}/${c-1})`,`${left*c/(c-1)} TL`],[`İkinci harcamadan önce (× ${b}/${b-1})`,`${left*c/(c-1)*b/(b-1)} TL`],[`Başta (× ${a}/${a-1})`,`${start} TL`]])},
          `Başlangıçta ${start} TL vardı. (Kontrol: ${start} × ${(a-1)*(b-1)*(c-1)}/${a*b*c} = ${left}.)`));},
        ()=>{const n=ri(3,10*l);return withSol(Q(`1/2 + 1/6 + 1/12 + 1/20 + … + 1/${n*(n+1)} toplamı kaçtır?`,n,n+1,`Paydalar k(k + 1) biçiminde ve 1/(k(k + 1)) = 1/k − 1/(k + 1). Toplam 1 − 1/${n+1} = ${n}/${n+1}.`,card('1/2 + 1/6 + 1/12 + …',`son terim 1/${n*(n+1)}`)),
        SOL(`Paydalar 2 = 1·2, 6 = 2·3, 12 = 3·4, 20 = 4·5… yani ardışık iki sayının çarpımı. Böyle kesirler iki kesrin farkı olarak yazılır.`,
          `1/(k(k + 1)) = 1/k − 1/(k + 1). Örnek: 1/6 = 1/2 − 1/3.`,
          {t:`Toplam: (1 − 1/2) + (1/2 − 1/3) + … + (1/${n} − 1/${n+1}). Ortadaki terimler birbirini götürür.`,fig:card(`1 − 1/${n+1}`)},
          `Sonuç 1 − 1/${n+1} = ${n}/${n+1}.`));}
      ];
    },
    cokadimli:(l,ri,pick,rnd)=>[
      ()=>{const x=ri(-20,30),a=ri(2,6),b=ri(2,20),c=ri(2,5),d=ri(-10,20),y=(x*a-b)*c+d;return withSol(N(`Bir sayı makinesi girilen sayıyı önce ${a} ile çarpıyor, ${b} çıkarıyor, sonucu ${c} ile çarpıyor ve ${par(d)} ekliyor. Çıkış ${signed(y)}. Giriş kaçtır?`,x,`Tersine: ${signed(y)} − ${par(d)} = ${signed((x*a-b)*c)}; ÷ ${c} = ${signed(x*a-b)}; + ${b} = ${signed(x*a)}; ÷ ${a} = ${signed(x)}.`,card(`× ${a} → − ${b} → × ${c} → + ${par(d)}`,`Çıkış ${signed(y)}`),'','Son işlemden başlayıp ters işlemleri uygula.'),
        SOL(`Makineyi tersine çalıştıralım: son işlemden başlayıp her işlemin tersini yapalım (toplamanın tersi çıkarma, çarpmanın tersi bölme).`,
          {t:`Tersine adımlar:`,fig:tbl(['Ters işlem','Sonuç'],[['Başla',signed(y)],[`− ${par(d)}`,signed((x*a-b)*c)],[`÷ ${c}`,signed(x*a-b)],[`+ ${b}`,signed(x*a)],[`÷ ${a}`,signed(x)]])},
          `Giriş ${signed(x)}. Kontrol: ${signed(x)} × ${a} − ${b} = ${signed(x*a-b)}; × ${c} = ${signed((x*a-b)*c)}; + ${par(d)} = ${signed(y)}.`));},
      ()=>{const m=ri(-6,8),n=ri(-6,8),k=ri(-5,6),op=(a,b)=>a*b-a-b,v=op(op(m,n),k);return withSol(N(`a ⊕ b = a · b − a − b işlemi tanımlanıyor. (${par(m)} ⊕ ${par(n)}) ⊕ ${par(k)} kaçtır?`,v,`${par(m)} ⊕ ${par(n)} = ${par(m)}·${par(n)} − ${par(m)} − ${par(n)} = ${signed(op(m,n))}. ${signed(op(m,n))} ⊕ ${par(k)} = ${signed(v)}.`,card('a ⊕ b = a·b − a − b'),'','Önce parantezi hesapla.'),
        SOL(`Tanımlanan işlemde a ve b yerine verilen sayıları koyarız. Önce paranteze bakarız.`,
          `${par(m)} ⊕ ${par(n)} = ${par(m)} · ${par(n)} − ${par(m)} − ${par(n)} = ${signed(m*n)} − ${par(m)} − ${par(n)} = ${signed(op(m,n))}.`,
          `Şimdi ${signed(op(m,n))} ⊕ ${par(k)} = ${par(op(m,n))} · ${par(k)} − ${par(op(m,n))} − ${par(k)} = ${signed(op(m,n)*k)} − ${par(op(m,n))} − ${par(k)} = ${signed(v)}.`,
          `Sonuç ${signed(v)}. (Negatif sayıları parantezle yazmak işaret hatalarını önler.)`));},
      ()=>{const x=2*ri(-20,30),S=4*x+12,big=rnd()<.5;return withSol(N(`Ardışık dört çift tam sayının toplamı ${signed(S)}. En ${big?'büyüğü':'küçüğü'} kaçtır?`,big?x+6:x,`x + (x + 2) + (x + 4) + (x + 6) = 4x + 12 = ${signed(S)} → x = ${signed(x)}.${big?` En büyük ${signed(x+6)}.`:''}`,card('x, x + 2, x + 4, x + 6',`Toplam ${signed(S)}`)),
        SOL(`Ardışık çift sayılar ikişer artar. En küçüğüne x deyip hepsini x ile yazalım.`,
          `Sayılar x, x + 2, x + 4, x + 6. Toplam 4x + 12.`,
          `4x + 12 = ${signed(S)} → 4x = ${signed(S-12)} → x = ${signed(x)}.`,
          `Sayılar ${[x,x+2,x+4,x+6].map(signed).join(', ')}. En ${big?'büyüğü':'küçüğü'} ${signed(big?x+6:x)}.`));},
      ()=>{const a=ri(2,9),b=ri(2,9),c=ri(2,9),d=ri(2,6),v=-a*(b-c*d)+b*b-c;return withSol(N(`−${a} · (${b} − ${c} · ${d}) + (−${b})² − ${c} işleminin sonucu kaçtır?`,v,`Parantez: ${b} − ${c*d} = ${signed(b-c*d)}. −${a} · ${par(b-c*d)} = ${signed(-a*(b-c*d))}. (−${b})² = ${b*b}. Toplam ${signed(-a*(b-c*d))} + ${b*b} − ${c} = ${signed(v)}.`,card(`−${a}·(${b} − ${c}·${d}) + (−${b})² − ${c}`),'','İşlem önceliği: parantez, üs, çarpma, toplama.'),
        SOL(`İşlem sırası: önce parantez içi, sonra üs, sonra çarpma-bölme, en son toplama-çıkarma.`,
          `Parantez içinde de önce çarpma: ${c} · ${d} = ${c*d}; ${b} − ${c*d} = ${signed(b-c*d)}.`,
          `Çarpma: −${a} · ${par(b-c*d)} = ${signed(-a*(b-c*d))} (iki negatifin çarpımı pozitif${b-c*d<0?'':' değil; burada biri pozitif'}).`,
          `Üs: (−${b})² = ${b*b} (çift kuvvet pozitif).`,
          `Toplama: ${signed(-a*(b-c*d))} + ${b*b} − ${c} = ${signed(v)}.`));},
      ()=>{const p=ri(1,6),x=ri(-8,15),R=x+p+x*p;return withSol(N(`a ⊗ b = a + b + a·b işlemi tanımlanıyor. x ⊗ ${p} = ${signed(R)} ise x kaçtır?`,x,`x + ${p} + ${p}x = ${p+1}x + ${p} = ${signed(R)} → x = ${signed(x)}.`,card('a ⊗ b = a + b + a·b',`x ⊗ ${p} = ${signed(R)}`),'',`x ⊗ ${p} ifadesini x cinsinden aç.`),
        SOL(`Tanımda a yerine x, b yerine ${p} yazıp bir denklem kuralım.`,
          `x ⊗ ${p} = x + ${p} + x · ${p} = ${p+1}x + ${p}.`,
          `${p+1}x + ${p} = ${signed(R)} → ${p+1}x = ${signed(R-p)} → x = ${signed(x)}.`));}
    ],
    gorunumler:(l,ri,pick,rnd)=>{
      // 2 × 3 tabanda kule yükseklikleri; önden: sütunların en yükseği, sağdan: sıraların en yükseği.
      const H=l===6?3:4,grid=()=>[0,1].map(()=>[0,1,2].map(()=>ri(0,H))),
        views=g=>[[0,1,2].map(j=>Math.max(g[0][j],g[1][j])),g.map(r=>Math.max(...r))],
        range=(front,side)=>{let mn=Infinity,mx=0;const t=Array(6).fill(0);const rec=i=>{if(i===6){const [f,s]=views([t.slice(0,3),t.slice(3)]);if(f.join()===front.join()&&s.join()===side.join()){const v=sum(t);mn=Math.min(mn,v);mx=Math.max(mx,v);}return;}for(let h=0;h<=H;h++){t[i]=h;rec(i+1);}};rec(0);return [mn,mx];},
        ask=(f,s)=>`2 sıra ve 3 sütundan oluşan tabanda birim küplerle kuleler yapılıyor. Önden görünümde sütun yükseklikleri soldan sağa ${f.join(', ')}; sağdan görünümde sıra yükseklikleri ${s.join(', ')}.`;
      return [
        ()=>{const [f,s]=views(grid()),[,mx]=range(f,s);return withSol(N(`${ask(f,s)} Yapıda en çok kaç birim küp olabilir?`,mx,`Bir hücredeki kule, kendi sütununun ve sırasının görünüm yüksekliklerinin küçüğünü aşamaz. Hepsini bu sınıra çıkarmak görünümleri bozmaz: ${mx}.`,card(`Önden: ${f.join(' | ')}`,`Sağdan: ${s.join(' | ')}`),'','Her hücre en çok min(sütun, sıra) kadar yüksek olabilir.'),
        SOL(`Önden görünüm her sütundaki en yüksek kuleyi, sağdan görünüm her sıradaki en yüksek kuleyi gösterir. Bir kule ikisini de aşamaz.`,
          `Bir hücredeki kule en çok (sütun yüksekliği ile sıra yüksekliğinin küçüğü) kadar olabilir.`,
          {t:`Her hücreye bu en büyük değeri yazalım:`,fig:tbl(['','1. sütun','2. sütun','3. sütun'],[0,1].map(i=>[`${i+1}. sıra (${s[i]})`,...[0,1,2].map(j=>Math.min(f[j],s[i]))]),['Önden',...f])},
          `Bu yapı iki görünümü de bozmaz. Toplam ${mx} küp.`));},
        ()=>{const [f,s]=views(grid()),[mn]=range(f,s);return withSol(N(`${ask(f,s)} Yapıda en az kaç birim küp olabilir?`,mn,`Her görünüm yüksekliği en az bir kulede sağlanmalı. Aynı yükseklikteki bir sütun ile bir sıra tek kuleyle birlikte karşılanabilir. En az ${mn} küp.`,card(`Önden: ${f.join(' | ')}`,`Sağdan: ${s.join(' | ')}`),'','Eşit yükseklikteki sütun ve sıraları aynı kuleyle karşıla.'),
        SOL(`Her sütunun ve her sıranın görünen yüksekliğini en az bir kule sağlamalı. Küpten tasarruf için bir kuleyi hem bir sütun hem bir sıra için kullanırız.`,
          `Bir kule, sütun ve sıra yükseklikleri eşitse ikisini birden karşılayabilir. Diğer hücreler boş (0) bırakılır.`,
          {t:`Görünümleri sağlayan en az küplü yerleşimlerden biri:`,fig:(()=>{let best=null;const t=Array(6).fill(0);const rec=i=>{if(i===6){const g=[t.slice(0,3),t.slice(3)],[f2,s2]=views(g);if(f2.join()===f.join()&&s2.join()===s.join()&&(!best||sum(t)<sum(best)))best=[...t];return;}for(let h=0;h<=H;h++){t[i]=h;rec(i+1);}};rec(0);return tbl(['','1. sütun','2. sütun','3. sütun'],[0,1].map(i=>[`${i+1}. sıra (${s[i]})`,...best.slice(i*3,i*3+3)]),['Önden',...f]);})()},
          `Daha azıyla bir görünüm eksik kalır. En az ${mn} küp.`));},
        ()=>{const n=ri(3,4+2*l),kind=pick(['3','2','1','0']),v={3:8,2:12*(n-2),1:6*(n-2)**2,0:(n-2)**3}[kind];return withSol(N(`${n} × ${n} × ${n} birim küpten oluşan büyük küpün bütün dış yüzeyi boyanıyor. ${kind==='0'?'Hiçbir yüzü':`Tam olarak ${kind} yüzü`} boyalı kaç birim küp vardır?`,v,{3:'Yalnız köşedeki 8 küpün 3 yüzü boyalıdır.',2:`Her ayrıtta köşeler hariç ${n-2} küp, 12 ayrıt: ${12*(n-2)}.`,1:`Her yüzün iç kısmında ${n-2} × ${n-2} küp, 6 yüz: ${v}.`,0:`İçteki ${n-2} × ${n-2} × ${n-2} küp hiç boyanmaz: ${v}.`}[kind],F.prism(n,n,n),'','Köşe, ayrıt, yüz ve iç küplerini ayrı düşün.'),
        SOL(`Büyük küpteki birim küpler yerlerine göre dört türlü: köşe (3 yüzü boyalı), ayrıt üstü (2), yüz ortası (1), iç (0).`,
          {t:`Sayıları:`,fig:tbl(['Yer','Boyalı yüz','Sayı'],[['Köşe',3,8],['Ayrıt (köşesiz)',2,`12 × ${n-2} = ${12*(n-2)}`],['Yüz içi',1,`6 × ${n-2}² = ${6*(n-2)**2}`],['İç',0,`${n-2}³ = ${(n-2)**3}`]],['Toplam','',`${n}³ = ${n**3}`])},
          `Her ayrıtta ${n} küp var, iki ucu köşe: ${n-2} ayrıt küpü. Her yüzün kenar şeridi çıkınca ${n-2} × ${n-2} iç kalır.`,
          `Sorulan: ${kind==='0'?'hiçbir yüzü':`tam ${kind} yüzü`} boyalı → ${v}.`));},
        ()=>{const a=ri(3,5+l),b=ri(3,5+l),c=ri(3,4+l),one=2*((a-2)*(b-2)+(b-2)*(c-2)+(a-2)*(c-2)),zero=(a-2)*(b-2)*(c-2),askOne=rnd()<.5;return withSol(N(`${a} × ${b} × ${c} birim küpten oluşan prizmanın bütün dış yüzeyi boyanıyor. ${askOne?'Yalnız bir yüzü':'Hiçbir yüzü'} boyalı kaç birim küp vardır?`,askOne?one:zero,askOne?`Her yüzün iç kısmı (kenar şeridi hariç): 2 × (${a-2}·${b-2} + ${b-2}·${c-2} + ${a-2}·${c-2}) = ${one}.`:`İçteki prizma ${a-2} × ${b-2} × ${c-2} = ${zero}.`,F.prism(a,b,c),'','Kenar şeridini çıkarınca her yüzün içi kalır.'),
        SOL(`Dış yüzeye değen küpler boyanır. Bir yüzünün ortasındaki küplerin yalnız 1 yüzü, içtekilerin hiçbir yüzü boyanmaz.`,
          askOne?`Her yüzün kenar şeridi (ayrıtlara değen küpler) çıkınca iç kısım kalır: ${a}×${b} yüzün içi ${a-2}×${b-2}, ${b}×${c} yüzün içi ${b-2}×${c-2}, ${a}×${c} yüzün içi ${a-2}×${c-2}.`:`Dış kabuğu soyalım: her yönde 2 sıra (iki yandan birer) eksilir.`,
          askOne?{t:`Her yüzden iki tane var (karşılıklı):`,fig:tbl(['Yüz','İç kısım','Adet'],[[`${a}×${b}`,`${a-2}×${b-2}`,`2 × ${(a-2)*(b-2)}`],[`${b}×${c}`,`${b-2}×${c-2}`,`2 × ${(b-2)*(c-2)}`],[`${a}×${c}`,`${a-2}×${c-2}`,`2 × ${(a-2)*(c-2)}`]],['','Toplam',one])}:`İçteki prizma ${a-2} × ${b-2} × ${c-2}.`,
          askOne?`Yalnız bir yüzü boyalı ${one} küp.`:`Hiçbir yüzü boyalı olmayan ${zero} küp.`));},
        ()=>{const g=[[ri(1,4),ri(0,4)],[ri(1,4),ri(1,4)]],front=[Math.max(g[0][0],g[1][0]),Math.max(g[0][1],g[1][1])],side=[Math.max(...g[0]),Math.max(...g[1])],top=g.flat().filter(v=>v>0).length,t=sum(front)+sum(side)+top;
          return withSol(N(`2 × 2 tabanda kule yükseklikleri: ön sıra ${g[0].join(' ve ')}, arka sıra ${g[1].join(' ve ')}. Önden, sağdan ve üstten görülen birim karelerin sayıları toplamı kaçtır?`,t,`Önden ${front.join(' + ')} = ${sum(front)}, sağdan ${side.join(' + ')} = ${sum(side)}, üstten ${top} dolu hücre. Toplam ${t}.`,card(`ÖN: ${g[0].join(' | ')}`,`ARKA: ${g[1].join(' | ')}`),'','Her görünümde bir sütunun ya da sıranın en yüksek kulesi görünür.'),
        SOL(`Her yönden bakınca bir sıradaki kulelerin yalnız en yükseği görünür. Üstten bakınca her dolu hücre 1 kare görünür.`,
          `Önden: her sütunun en yükseği ${front.join(' ve ')} → ${sum(front)} kare.`,
          `Sağdan: her sıranın en yükseği ${side.join(' ve ')} → ${sum(side)} kare.`,
          `Üstten: dolu hücre sayısı ${top}. Toplam ${sum(front)} + ${sum(side)} + ${top} = ${t}.`));}
      ];
    },
    acinim:(l,ri,pick,rnd)=>[
      ()=>{const a=ri(3,6+l),b=ri(3,6+l),c=ri(3,5+l),S=2*(a*b+b*c+a*c),kind=pick(['köşe','ayrıt','yüz']),add={köşe:0,ayrıt:2,yüz:4}[kind],out={köşe:3,ayrıt:2,yüz:1}[kind];
        return withSol(N(`${a} × ${b} × ${c} birim küpten oluşan prizmanın ${kind==='köşe'?'bir köşesindeki':kind==='ayrıt'?'bir ayrıtı üzerindeki (köşe olmayan)':'bir yüzünün ortasındaki (ayrıta değmeyen)'} birim küp çıkarılıyor. Yeni cismin yüzey alanı kaç birim kare?`,S+add,`İlk yüzey 2 × (${a*b} + ${b*c} + ${a*c}) = ${S}. Çıkan küpün ${out} yüzü dışarıdaydı; bunlar kaybolur, içerideki ${6-out} yüzü açığa çıkar: ${add?'+'+add:'değişmez'}. Sonuç ${S+add}.`,F.prism(a,b,c),'','Çıkan küpün kaç yüzü dışarıdaydı, kaç yeni yüz açıldı?'),
        SOL(`Bir birim küp çıkarılınca dışarıdaki yüzleri kaybolur, ama içeride komşularına değen yüzlerin yerinde yeni yüzler açılır.`,
          `İlk yüzey 2 × (${a}·${b} + ${b}·${c} + ${a}·${c}) = ${S}.`,
          {t:`Çıkan küp ${kind==='köşe'?'köşede':kind==='ayrıt'?'ayrıtta':'yüzün ortasında'}: ${out} yüzü dışarıda (kaybolur), ${6-out} yüzü komşulara değiyordu (açığa çıkar).`,fig:tbl(['Yer','Kaybolan','Açılan','Değişim'],[['Köşe',3,3,'0'],['Ayrıt',2,4,'+2'],['Yüz ortası',1,5,'+4']])},
          `Yeni yüzey ${S} ${add?'+ '+add:'+ 0'} = ${S+add}.`));},
      ()=>{const n=ri(3,6+3*l),s=ri(1,3+l);return withSol(N(`Ayrıtı ${s} cm olan ${n} küp üst üste konarak bir kule yapılıyor. Kulenin yüzey alanı kaç cm²?`,(4*n+2)*s*s,`Yan yüzler 4 × ${n} = ${4*n}, alt ve üst 2: ${4*n+2} kare yüz. Her biri ${s*s} cm²: ${(4*n+2)*s*s}.`,F.prism(s,s,n*s),'cm²','Birbirine yapışan yüzler görünmez.'),
        SOL(`Kulenin her yanından görünen kareleri sayalım; küplerin birbirine yapışan yüzleri görünmez.`,
          `Dört yan yüzün her birinde ${n} kare: 4 × ${n} = ${4*n} kare.`,
          `Üstte 1, altta 1 kare: toplam ${4*n+2} kare yüz.`,
          `Her kare ${s} × ${s} = ${s*s} cm². Yüzey ${4*n+2} × ${s*s} = ${(4*n+2)*s*s} cm².`));},
      ()=>{const k=ri(3,4+l),S=surface([Array.from({length:k},(_,i)=>i+1)]);return withSol(N(`Birim küplerle tek sıra hâlinde ${k} basamaklı bir merdiven yapılıyor (sütunlar 1, 2, …, ${k} küp). Merdivenin yüzey alanı (alt yüz dahil) kaç birim kare?`,S,`Ön ve arka: 2 × ${k*(k+1)/2} = ${k*(k+1)}. Alt ${k}, üstten görünen yatay yüzler ${k}. Sağdan ve soldan görünen yüzler 2 × ${k} = ${2*k}. Toplam ${S}.`,card('▁▂▃▅▇',`${k} basamak`),'','Her yönden görünen yüzleri ayrı say.'),
        SOL(`Merdivenin yüzeyini altı yönden bakarak sayalım: ön, arka, üst, alt, sol, sağ.`,
          {t:`Yönlere göre:`,fig:tbl(['Yön','Görünen kare'],[['Ön',`1 + 2 + … + ${k} = ${k*(k+1)/2}`],['Arka',k*(k+1)/2],['Alt',k],['Üst (basamak yüzleri)',k],['Sol (en alçak sütun + basamak dikleri)',k],['Sağ (en yüksek sütun)',k]],['Toplam',S])},
          `Basamakların dik yüzleri soldan bakınca kademe kademe görünür; toplamları en yüksek sütun kadar: ${k}.`,
          `Yüzey alanı ${S} birim kare.`));},
      ()=>{const a=ri(4,8+l),b=ri(3,6+l),c=ri(2,5+l),k=ri(2,4+l),S=2*(a*b+b*c+a*c)+2*(k-1)*b*c;return withSol(N(`${a} × ${b} × ${c} cm prizma, ${b} × ${c} yüzüne paralel düzlemlerle ${k} parçaya kesiliyor. Parçaların yüzey alanları toplamı kaç cm²?`,S,`İlk yüzey ${2*(a*b+b*c+a*c)}. Her kesim iki yeni ${b} × ${c} yüz açar: ${k-1} kesim × 2 × ${b*c} = ${2*(k-1)*b*c}. Toplam ${S}.`,F.prism(a,b,c),'cm²','Kesim sayısı parça sayısından 1 eksiktir.'),
        SOL(`Kesmek yeni yüzler açar ama eski yüzleri yok etmez. Her kesim iki yeni yüz ekler.`,
          `İlk yüzey 2 × (${a}·${b} + ${b}·${c} + ${a}·${c}) = ${2*(a*b+b*c+a*c)} cm².`,
          `${k} parça için ${k-1} kesim gerekir. Her kesim iki yeni ${b} × ${c} yüz açar: 2 × ${b*c} = ${2*b*c} cm².`,
          `Toplam ${2*(a*b+b*c+a*c)} + ${k-1} × ${2*b*c} = ${S} cm².`));},
      ()=>{const g=[[ri(1,3+l),ri(1,3+l),ri(0,3+l)],[ri(1,3+l),ri(0,3+l),ri(1,3+l)]],S=surface(g);return withSol(N(`2 × 3 tabanda ön sıra ${g[0].join(', ')} ve arka sıra ${g[1].join(', ')} birim küp yüksekliğinde kuleler bitişik duruyor. Cismin yüzey alanı (alt yüz dahil) kaç birim kare?`,S,`Her dolu hücrenin üst ve alt yüzü sayılır; yanlarda komşusundan yüksek kalan kısım dışarıda görünür. Toplam ${S}.`,card(`ÖN: ${g[0].join(' | ')}`,`ARKA: ${g[1].join(' | ')}`),'','Komşu iki kuleden alçak olanın yüksekliği kadarlık yüzler gizlenir.'),
        SOL(`Her kulenin üstü ve altı birer yüz verir. Yanlarda, komşu kuleye yapışan kısım görünmez; yalnız komşudan yüksek kalan kısım görünür.`,
          `Üst + alt: dolu hücre başına 2 → ${2*g.flat().filter(v=>v>0).length}.`,
          {t:`Yan yüzler: her kule için dört yönde (komşu yükseklik − kendi yüksekliği farkı kadar) görünür. Kenardaki tarafların tamamı görünür.`,fig:tbl(['','1. sütun','2. sütun','3. sütun'],[['Ön sıra',...g[0]],['Arka sıra',...g[1]]])},
          `Hepsi toplanınca yüzey ${S} birim kare.`));}
    ],
    hacimyorum:(l,ri,pick,rnd)=>[
      ()=>{const n=ri(3,6+3*l);return withSol(N(`${n} × ${n} × ${n} birim küpten oluşan küpün her köşesinden birer birim küp çıkarılıyor. Kaç birim küp kalır?`,n**3-8,`${n}³ = ${n**3}; 8 köşe: ${n**3} − 8 = ${n**3-8}.`,F.prism(n,n,n)),
        SOL(`Önce büyük küpteki birim küpleri sayalım, sonra köşelerden çıkanları çıkaralım.`,
          `${n} × ${n} × ${n} = ${n**3} birim küp.`,
          `Bir küpün 8 köşesi vardır; her köşeden 1 küp çıkar.`,
          `${n**3} − 8 = ${n**3-8}.`));},
      ()=>{const a=ri(3,6+2*l),b=ri(3,6+2*l),c=ri(3,5+2*l),v=a*b*c-(a-2)*(b-2)*(c-2);return withSol(N(`Birim küplerle ${a} × ${b} × ${c} ölçülerinde, içi boş (yalnız dış kabuğu olan) bir kutu yapılıyor. Kaç birim küp kullanılır?`,v,`Dolu prizma ${a*b*c}, içteki boşluk ${a-2} × ${b-2} × ${c-2} = ${(a-2)*(b-2)*(c-2)}. ${a*b*c} − ${(a-2)*(b-2)*(c-2)} = ${v}.`,F.prism(a,b,c),'','Dolu prizmadan içteki prizmayı çıkar.'),
        SOL(`İçi boş kutu = dolu prizma − içteki boşluk. İçteki boşluk her yönde 2 birim (iki yandan birer duvar) kısadır.`,
          `Dolu prizma ${a} × ${b} × ${c} = ${a*b*c}.`,
          `İçteki boşluk ${a-2} × ${b-2} × ${c-2} = ${(a-2)*(b-2)*(c-2)}.`,
          `Kullanılan küp ${a*b*c} − ${(a-2)*(b-2)*(c-2)} = ${v}.`));},
      ()=>{const k=ri(2,4),a=ri(5,12+3*l),b=ri(5,12+3*l),c=ri(4,10+2*l),v=Math.floor(a/k)*Math.floor(b/k)*Math.floor(c/k);return withSol(N(`İç ölçüleri ${a} × ${b} × ${c} cm olan kutuya, ayrıtı ${k} cm olan küpler kutunun kenarlarına paralel yerleştiriliyor. En çok kaç küp sığar?`,v,`Her yönde tam sığan küp sayısı ${Math.floor(a/k)}, ${Math.floor(b/k)}, ${Math.floor(c/k)}. Çarpım ${v}.`,F.prism(a,b,c),'','Her yönde kaç küp tam sığar?'),
        SOL(`Küpler kenarlara paralel dizilirse her yönde ayrı ayrı kaç küp sığdığına bakarız; küsurat atılır (yarım küp olmaz).`,
          {t:`Yönlere göre:`,fig:tbl(['Kenar','÷ '+k,'Sığan'],[[a,dec(a/k),Math.floor(a/k)],[b,dec(b/k),Math.floor(b/k)],[c,dec(c/k),Math.floor(c/k)]])},
          `En çok ${Math.floor(a/k)} × ${Math.floor(b/k)} × ${Math.floor(c/k)} = ${v} küp.`));},
      ()=>{const x=ri(2,6+2*l),V=x*(x+1)*(x+2);return withSol(N(`Ayrıtları ardışık üç doğal sayı olan dikdörtgenler prizmasının hacmi ${V} cm³. En kısa ayrıt kaç cm?`,x,`x(x + 1)(x + 2) = ${V}. Ortadaki ayrıt hacmin küp köküne yakın: ${x+1}. En kısa ${x}; ${x} × ${x+1} × ${x+2} = ${V}.`,F.prism(x+2,x+1,x),'cm','Ortadaki ayrıt küp köke yakındır.'),
        SOL(`Üç ardışık sayının çarpımı, ortadaki sayının küpüne çok yakındır. Ortadaki sayıyı tahmin edip deneyelim.`,
          `Hangi sayının küpü ${V}'e yakın? ${x}³ = ${x**3}, ${x+1}³ = ${(x+1)**3}, ${x+2}³ = ${(x+2)**3}.`,
          `Ortadaki ayrıt ${x+1} olsun: ${x} × ${x+1} × ${x+2} = ${V}. ✔`,
          `En kısa ayrıt ${x} cm.`));},
      ()=>{const n=ri(3,5+2*l),v=n*(n+1)*(2*n+1)/6;return withSol(N(`Birim küplerle ${n} katlı bir piramit yapılıyor: en üst kat 1 × 1, altındaki 2 × 2, …, en alt kat ${n} × ${n}. Kaç birim küp kullanılır?`,v,`1² + 2² + … + ${n}² = ${n} × ${n+1} × ${2*n+1} ÷ 6 = ${v}.`,card('1 × 1','2 × 2','…',`${n} × ${n}`),'','Her kattaki küpleri say ve topla.'),
        SOL(`Her kat bir kare: k. katta k × k küp var. Bütün katları toplayalım.`,
          {t:`Katlar:`,fig:tbl(['Kat','Küp'],[...Array.from({length:Math.min(n,4)},(_,i)=>[`${i+1} × ${i+1}`,(i+1)**2]),...(n>4?[['…','…'],[`${n} × ${n}`,n*n]]:[])],['Toplam',v])},
          `Kısa formül: 1² + 2² + … + n² = n(n + 1)(2n + 1) ÷ 6 = ${n} × ${n+1} × ${2*n+1} ÷ 6 = ${v}.`));}
    ],
    hacim:(l,ri,pick,rnd)=>[
      ()=>{const a=ri(10,30),b=ri(10,30),h=ri(1,4),k=pick([2,3,4,5,6]),V=a*b*h;if(V%k)return null;return withSol(N(`Tabanı ${a} × ${b} cm olan akvaryuma ${k} eş taş bırakılınca su seviyesi ${h} cm yükseliyor (taşlar tamamen batıyor, su taşmıyor). Bir taşın hacmi kaç cm³?`,V/k,`Yükselen su hacmi ${a} × ${b} × ${h} = ${V} cm³ = ${k} taş. Bir taş ${V/k}.`,F.prism(a,b,h),'cm³'),
        SOL(`Suya batan cisim, kendi hacmi kadar suyu yukarı iter. Yükselen su bir prizma oluşturur.`,
          `Yükselen su: taban ${a} × ${b}, yükseklik ${h} → ${a*b*h} cm³.`,
          `Bu hacim ${k} taşın toplam hacmi: bir taş ${V} ÷ ${k} = ${V/k} cm³.`));},
      ()=>{const e=ri(2,4),a=e*ri(2,5+l),b=e*ri(2,5+l),c=e*ri(1,4+l);return withSol(N(`${a} × ${b} × ${c} cm metal prizma eritilip ayrıtı ${e} cm olan küpler dökülüyor. Kaç küp elde edilir?`,a*b*c/e**3,`Hacim ${a*b*c} cm³, bir küp ${e**3} cm³: ${a*b*c} ÷ ${e**3} = ${a*b*c/e**3}.`,F.prism(a,b,c)),
        SOL(`Eritilen metal kaybolmaz: toplam hacim aynı kalır. Kaç küp yapılacağını hacimlerin oranı belirler.`,
          `Prizmanın hacmi ${a} × ${b} × ${c} = ${a*b*c} cm³.`,
          `Bir küpün hacmi ${e} × ${e} × ${e} = ${e**3} cm³.`,
          `${a*b*c} ÷ ${e**3} = ${a*b*c/e**3} küp. (Kısa yol: her yönde ${a/e}, ${b/e}, ${c/e} küp → ${a/e} × ${b/e} × ${c/e}.)`));},
      ()=>{const W=ri(12,30),H=ri(12,30);if(l===8){let best=0,bx=0;for(let x=1;2*x<Math.min(W,H);x++){const v=(W-2*x)*(H-2*x)*x;if(v>best){best=v;bx=x;}}return withSol(N(`${W} × ${H} cm kartonun dört köşesinden kenarı x cm (x tam sayı) olan eş kareler kesilip kenarlar katlanarak üstü açık kutu yapılıyor. Kutunun hacmi en çok kaç cm³ olabilir?`,best,`Hacim (${W} − 2x)(${H} − 2x) · x. x = 1, 2, 3, … denenir; en büyük değer x = ${bx} iken ${best}.`,F.prism(W-2*bx,H-2*bx,bx),'cm³','x değerlerini sırayla dene; hacim önce artar sonra azalır.'),
        SOL(`Köşelerden x kenarlı kare kesilince kutunun tabanı (${W} − 2x) × (${H} − 2x), yüksekliği x olur. x'i sırayla deneyelim.`,
          {t:`Hacimler:`,fig:tbl(['x','Taban','Hacim'],Array.from({length:Math.floor((Math.min(W,H)-1)/2)},(_,i)=>{const x=i+1;return [x,`${W-2*x} × ${H-2*x}`,(W-2*x)*(H-2*x)*x];}))},
          `x büyüdükçe yükseklik artar ama taban küçülür; hacim önce artar sonra azalır.`,
          `En büyük hacim x = ${bx} iken ${best} cm³.`));}
        const x=ri(1,Math.floor(Math.min(W,H)/2)-1),v=(W-2*x)*(H-2*x)*x;return withSol(N(`${W} × ${H} cm kartonun dört köşesinden kenarı ${x} cm olan eş kareler kesilip kenarlar katlanarak üstü açık kutu yapılıyor. Kutunun hacmi kaç cm³?`,v,`Taban ${W-2*x} × ${H-2*x}, yükseklik ${x}: ${v}.`,F.prism(W-2*x,H-2*x,x),'cm³'),
        SOL(`Köşelerden kare kesilip kenarlar katlanınca kesilen karenin kenarı kutunun yüksekliği olur.`,
          `Her kenardan iki köşe karesi çıkar: taban ${W} − 2 × ${x} = ${W-2*x} ve ${H} − 2 × ${x} = ${H-2*x}.`,
          `Yükseklik ${x} cm.`,
          `Hacim ${W-2*x} × ${H-2*x} × ${x} = ${v} cm³.`));},
      ()=>{const a=ri(8,20),b=ri(2,a-2),t=ri(5,30+10*l),V=(a-b)*t;return withSol(N(`${V} L'lik boş depoya dakikada ${a} L su akıyor, aynı anda dipteki delikten dakikada ${b} L su boşalıyor. Depo kaç dakikada dolar?`,t,`Net dolma dakikada ${a} − ${b} = ${a-b} L. ${V} ÷ ${a-b} = ${t}.`,card(`Depo ${V} L`,`Giriş ${a} L/dk · Çıkış ${b} L/dk`),'dakika'),
        SOL(`Aynı anda su girip çıkıyorsa depoda biriken, giren ile çıkanın farkıdır.`,
          `Her dakika ${a} L girer, ${b} L çıkar: net ${a-b} L birikir.`,
          `${V} ÷ ${a-b} = ${t} dakika.`));},
      ()=>{const p=ri(2,4),q=ri(2,4),r=ri(1,3),a=ri(2,8),b=ri(2,8),c=ri(2,8);return withSol(N(`${a} × ${b} × ${c} cm prizmanın ayrıtları sırasıyla ${p}, ${q} ve ${r} katına çıkarılıyor. Yeni prizmanın hacmi eskisinden kaç cm³ fazladır?`,a*b*c*(p*q*r-1),`Hacim ${p} × ${q} × ${r} = ${p*q*r} katına çıkar. Eski ${a*b*c}, yeni ${a*b*c*p*q*r}; fark ${a*b*c*(p*q*r-1)}.`,F.prism(a,b,c),'cm³'),
        SOL(`Hacim üç ayrıtın çarpımıdır. Her ayrıt kaç katına çıkarsa hacim de o katların çarpımı kadar büyür.`,
          `Eski hacim ${a} × ${b} × ${c} = ${a*b*c} cm³.`,
          `Yeni ayrıtlar ${a*p}, ${b*q}, ${c*r}: yeni hacim ${a*p*b*q*c*r} = ${a*b*c} × ${p*q*r}.`,
          `Fark ${a*b*c*p*q*r} − ${a*b*c} = ${a*b*c*(p*q*r-1)} cm³.`));}
    ],
    birimler:(l,ri,pick,rnd)=>[
      ()=>{const a=ri(1,9),b=ri(1,999),c=ri(1,9),v=a*1e6+b*1000+c*100;return withSol(N(`${a} m³ + ${b} dm³ + ${c} dL toplam kaç mL eder?`,v,`1 m³ = 1.000.000 mL, 1 dm³ = 1 L = 1.000 mL, 1 dL = 100 mL. ${fmt(a*1e6)} + ${fmt(b*1000)} + ${c*100} = ${fmt(v)}.`,card('1 m³ = 1.000 dm³','1 dm³ = 1 L = 1.000 mL','1 dL = 100 mL'),'mL'),
        SOL(`Hepsini en küçük birime (mL) çevirip toplayalım.`,
          {t:`Çevirmeler:`,fig:tbl(['Miktar','mL'],[[`${a} m³`,fmt(a*1e6)],[`${b} dm³`,fmt(b*1000)],[`${c} dL`,fmt(c*100)]],['Toplam',fmt(v)])},
          `1 m³ = 1.000 dm³ ve 1 dm³ = 1 L = 1.000 mL olduğundan 1 m³ = 1.000.000 mL.`,
          `Toplam ${fmt(v)} mL.`));},
      ()=>{const d=5*ri(1,6),days=ri(1,7*l),v=Math.round(86.4*d*days*10)/10;return withSol(N(`Bir musluk saniyede ${d} mL su damlatıyor. ${days} günde kaç litre su boşa akar?`,v,`Bir gün 86.400 saniye: ${d} × 86.400 = ${fmt(86400*d)} mL = ${fmt(86.4*d)} L. ${days} gün: ${fmt(v)} L.`,card(`${d} mL/saniye`,`${days} gün`),'L','Önce bir günü saniyeye çevir.'),
        SOL(`Önce bir günde kaç saniye olduğunu bulup bir günlük kaybı hesaplayalım.`,
          `1 gün = 24 saat × 60 dakika × 60 saniye = 86.400 saniye.`,
          `Bir günde ${d} × 86.400 = ${fmt(86400*d)} mL = ${fmt(86.4*d)} L (1.000 mL = 1 L).`,
          `${days} günde ${fmt(86.4*d)} × ${days} = ${fmt(v)} L.`));},
      ()=>{const A=ri(20,300),mm=ri(2,40);return withSol(N(`${A} m² düz çatıya ${mm} mm yağmur yağıyor. Çatıdan toplanabilecek su en çok kaç litredir?`,A*mm,`1 m² üzerinde 1 mm su: 1 m² × 0,001 m = 0,001 m³ = 1 L. ${A} × ${mm} = ${A*mm} L.`,card(`Alan ${A} m²`,`Yağış ${mm} mm`),'L','1 m² alana 1 mm yağışın hacmini bul.'),
        SOL(`Yağış miktarı, düz bir yüzeyde biriken suyun yüksekliğidir. Biriken su ince bir prizma oluşturur.`,
          `1 m² × 1 mm: 1 m = 1.000 mm, 1 m² alan 10 dm × 10 dm; 1 mm = 0,01 dm. Hacim 100 dm² × 0,01 dm = 1 dm³ = 1 L.`,
          `Yani her m² üzerine her mm yağış 1 L su bırakır.`,
          `${A} m² × ${mm} mm = ${A*mm} L.`));},
      ()=>{const a=10*ri(3,12),b=10*ri(3,10),c=10*ri(3,8),p=pick([[1,2],[3,4],[2,5],[3,5],[1,4]]),V=a*b*c/1000*p[0]/p[1];if(!Number.isInteger(V))return null;return withSol(N(`İç ölçüleri ${a} × ${b} × ${c} cm olan tankın ${p[0]}/${p[1]}'${ek(p[1],'si')} dolu. Tankta kaç litre su var?`,V,`Kapasite ${a*b*c} cm³ = ${a*b*c/1000} L. ${p[0]}/${p[1]} × ${a*b*c/1000} = ${V}.`,F.prism(a,b,c),'L'),
        SOL(`Önce tankın tamamının kaç litre aldığını bulalım, sonra dolu kısmını kesirle hesaplayalım.`,
          `Hacim ${a} × ${b} × ${c} = ${fmt(a*b*c)} cm³. 1 L = 1.000 cm³: ${fmt(a*b*c)} ÷ 1.000 = ${a*b*c/1000} L.`,
          `${p[0]}/${p[1]} kadarı dolu: ${a*b*c/1000} ÷ ${p[1]} × ${p[0]} = ${V} L.`));},
      ()=>{const a=ri(1,9),c=ri(1,99),v=a*100+c*10;return withSol(N(`${a} dL + ${c} cL kaç mL eder?`,v,`1 dL = 100 mL, 1 cL = 10 mL: ${a*100} + ${c*10} = ${v}.`,card(`${a} dL + ${c} cL`),'mL'),
        SOL(`Litrenin parçaları: 1 L = 10 dL = 100 cL = 1.000 mL. Hepsini mL'ye çevirelim.`,
          `1 dL = 100 mL → ${a} dL = ${a*100} mL.`,
          `1 cL = 10 mL → ${c} cL = ${c*10} mL.`,
          `Toplam ${a*100} + ${c*10} = ${v} mL.`));}
    ],
    problemler:(l,ri,pick,rnd)=>[
      ()=>{const a=ri(2,8)*100,b=ri(2,8)*100,h2=ri(10,40),h1=ri(5,60),total=a*h1+b*h2;if(total%(a+b))return null;const h=total/(a+b);
        return withSol(N(`Taban alanları ${a} cm² ve ${b} cm² olan iki prizma biçimli kapta su seviyeleri ${h1} cm ve ${h2} cm. Kaplar alttan bir boruyla bağlanınca seviyeler eşitleniyor. Ortak seviye kaç cm olur?`,h,`Toplam su ${a} × ${h1} + ${b} × ${h2} = ${total} cm³. Toplam taban ${a+b} cm². Seviye ${total} ÷ ${a+b} = ${h}.`,card(`A: ${a} cm² · ${h1} cm`,`B: ${b} cm² · ${h2} cm`),'cm','Toplam su hacmi değişmez.'),
        SOL(`Kaplar bağlanınca su el değiştirir ama toplam hacim aynı kalır. Su, iki kabın toplam tabanına eşit yükseklikte yayılır.`,
          `A'daki su ${a} × ${h1} = ${a*h1} cm³, B'deki su ${b} × ${h2} = ${b*h2} cm³. Toplam ${total} cm³.`,
          `Ortak taban ${a} + ${b} = ${a+b} cm².`,
          `Ortak seviye ${total} ÷ ${a+b} = ${h} cm.`));},
      ()=>{const A=ri(2,6),B=ri(2,6),t=ri(5,20+10*l),cap=(A+B)*t;return withSol(N(`${cap} L'lik havuzu iki musluk birlikte dolduruyor; biri dakikada ${A} L, diğeri ${B} L akıtıyor. Havuz kaç dakikada dolar?`,t,`Birlikte dakikada ${A+B} L. ${cap} ÷ ${A+B} = ${t}.`,card(`Havuz ${cap} L`,`${A} L/dk + ${B} L/dk`),'dakika'),
        SOL(`İki musluk birlikte akıtınca her dakika ikisinin akıttığı toplam kadar su dolar.`,
          `Dakikada ${A} + ${B} = ${A+B} L.`,
          `${cap} ÷ ${A+B} = ${t} dakika.`));},
      ()=>{const k=ri(2,4+l),s=ri(1,3),t=ri(1,3),r=ri(1,3),a=k*s,b=k*t,m=s*t*r,rise=r*k;return withSol(N(`Tabanı ${a} × ${b} cm olan akvaryumdaki suya ayrıtı ${k} cm olan ${m} küp bırakılıyor; küpler tamamen batıyor ve su taşmıyor. Su seviyesi kaç cm yükselir?`,rise,`Küplerin hacmi ${m} × ${k**3} = ${m*k**3} cm³. Yükselme ${m*k**3} ÷ ${a*b} = ${rise}.`,F.prism(a,b,k),'cm','Yükselen suyun hacmi batan cisimlerin hacmine eşittir.'),
        SOL(`Batan küpler kendi hacimleri kadar suyu yukarı iter. Yükselen su, tabanı akvaryum tabanı olan ince bir prizmadır.`,
          `Küplerin hacmi ${m} × ${k}³ = ${m} × ${k**3} = ${m*k**3} cm³.`,
          `Taban alanı ${a} × ${b} = ${a*b} cm².`,
          `Yükselme = hacim ÷ taban = ${m*k**3} ÷ ${a*b} = ${rise} cm.`));},
      ()=>{const fill=ri(3,10),drain=ri(1,fill-1),cap=2*(fill-drain)*ri(5,15*l),half=rnd()<.5,t=cap/(fill-drain);return withSol(N(`${cap} L'lik depo boşken giriş musluğu (dakikada ${fill} L) ve çıkış musluğu (dakikada ${drain} L) aynı anda açılıyor. Depo ${half?'yarıya kadar':'tamamen'} kaç dakikada dolar?`,half?t/2:t,`Net dolma ${fill-drain} L/dk. ${half?`Yarısı ${cap/2} L`:`${cap} L`} ÷ ${fill-drain} = ${half?t/2:t}.`,card(`Depo ${cap} L`,`Giriş ${fill} · Çıkış ${drain} L/dk`),'dakika'),
        SOL(`Giriş ve çıkış aynı anda açıkken depoda biriken, ikisinin farkıdır.`,
          `Her dakika ${fill} − ${drain} = ${fill-drain} L birikir.`,
          half?`Yarısı ${cap} ÷ 2 = ${cap/2} L. ${cap/2} ÷ ${fill-drain} = ${t/2} dakika.`:`${cap} ÷ ${fill-drain} = ${t} dakika.`));},
      ()=>{const e=ri(2,4),a=e*ri(2,5)+ri(0,e-1),b=e*ri(2,5)+ri(0,e-1),c=e*ri(2,4)+ri(0,e-1),n=Math.floor(a/e)*Math.floor(b/e)*Math.floor(c/e),gap=a*b*c-n*e**3;return withSol(N(`İç ölçüleri ${a} × ${b} × ${c} cm olan kutuya ayrıtı ${e} cm küpler kenarlara paralel olarak olabildiğince çok yerleştiriliyor. Kutuda kaç cm³ boşluk kalır?`,gap,`Sığan küp ${Math.floor(a/e)} × ${Math.floor(b/e)} × ${Math.floor(c/e)} = ${n}, hacimleri ${n*e**3}. Boşluk ${a*b*c} − ${n*e**3} = ${gap}.`,F.prism(a,b,c),'cm³','Önce her yönde kaç küp sığdığını bul.'),
        SOL(`Önce kutuya kaç küp sığdığını bulalım; boşluk = kutunun hacmi − küplerin hacmi.`,
          {t:`Her yönde sığan küp (küsurat atılır):`,fig:tbl(['Kenar',`÷ ${e}`,'Sığan'],[[a,dec(a/e),Math.floor(a/e)],[b,dec(b/e),Math.floor(b/e)],[c,dec(c/e),Math.floor(c/e)]])},
          `${Math.floor(a/e)} × ${Math.floor(b/e)} × ${Math.floor(c/e)} = ${n} küp; hacimleri ${n} × ${e**3} = ${n*e**3} cm³.`,
          `Kutu ${a} × ${b} × ${c} = ${a*b*c} cm³. Boşluk ${a*b*c} − ${n*e**3} = ${gap} cm³.`));}
    ],
    dagilimlar:(l,ri,pick,rnd)=>[
      ()=>{const k=Math.min(4,l-3),vals=Array.from({length:k},(_,i)=>ri(1,5)+5*i),fr=vals.map(()=>ri(1,9+l));return withSol(N(`Sıklık tablosunda değerler ${vals.join(', ')} ve sıklıkları sırasıyla ${fr.join(', ')}. Verilerin toplamı kaçtır?`,sum(vals.map((v,i)=>v*fr[i])),`Her değer sıklığı kadar sayılır: ${vals.map((v,i)=>`${v}·${fr[i]}`).join(' + ')} = ${sum(vals.map((v,i)=>v*fr[i]))}.`,F.bars(fr,vals.map(String))),
        SOL(`Sıklık, bir değerin kaç kez görüldüğüdür. Toplam için her değer, sıklığı kadar eklenir: değer × sıklık.`,
          {t:`Her satırı ayrı hesaplayalım:`,fig:tbl(['Değer','Sıklık','Değer × sıklık'],vals.map((v,i)=>[v,fr[i],v*fr[i]]),['','Toplam',sum(vals.map((v,i)=>v*fr[i]))])},
          `Verilerin toplamı ${sum(vals.map((v,i)=>v*fr[i]))}.`));},
      ()=>{const vals=[ri(1,5),ri(6,10),ri(11,15)],fr=[ri(1,9),ri(1,9),0];for(let f3=1;f3<=30&&!fr[2];f3++)if((vals[0]*fr[0]+vals[1]*fr[1]+vals[2]*f3)%(fr[0]+fr[1]+f3)===0)fr[2]=f3;if(!fr[2])return null;const t=sum(vals.map((v,i)=>v*fr[i])),n=sum(fr);return withSol(N(`Sıklık tablosunda ${vals[0]} değeri ${fr[0]} kez, ${vals[1]} değeri ${fr[1]} kez, ${vals[2]} değeri ${fr[2]} kez görülüyor. Aritmetik ortalama kaçtır?`,t/n,`Toplam ${vals.map((v,i)=>`${v}·${fr[i]}`).join(' + ')} = ${t}; veri sayısı ${n}. Ortalama ${t/n}.`,F.bars(fr,vals.map(String))),
        SOL(`Ortalama = bütün verilerin toplamı ÷ veri sayısı. Sıklık tablosunda her değer sıklığı kadar sayılır.`,
          {t:`Toplam ve veri sayısı:`,fig:tbl(['Değer','Sıklık','Değer × sıklık'],vals.map((v,i)=>[v,fr[i],v*fr[i]]),['Toplam',n,t])},
          `Ortalama ${t} ÷ ${n} = ${t/n}.`));},
      ()=>{const vals=[ri(1,5),ri(6,10),ri(11,15),ri(16,20)],fr=vals.map(()=>ri(1,8)),n=sum(fr);if(n%2===0)return null;let c=0,med=0;for(let i=0;i<4;i++){c+=fr[i];if(c>=(n+1)/2){med=vals[i];break;}}
        return withSol(N(`Sıklık tablosu: ${vals.map((v,i)=>`${v} → ${fr[i]} kez`).join(', ')}. Ortanca kaçtır?`,med,`${n} veri var; sıralı dizide ${(n+1)/2}. veri ortancadır. Sıklıkları sırayla biriktirince bu sıra ${med} değerine düşer.`,F.bars(fr,vals.map(String)),'','Sıklıkları sırayla topla; ortadaki sıraya ne zaman ulaşıyorsun?'),
        SOL(`Ortanca, veriler küçükten büyüğe dizilince tam ortadaki veridir. Sıklıkları biriktirerek ortadaki sıranın hangi değere düştüğünü buluruz.`,
          `Veri sayısı ${fr.join(' + ')} = ${n} (tek). Ortadaki sıra (${n} + 1) ÷ 2 = ${(n+1)/2}.`,
          {t:`Birikimli sıklık:`,fig:tbl(['Değer','Sıklık','Sıralar'],vals.map((v,i)=>{const from=sum(fr.slice(0,i))+1,to=sum(fr.slice(0,i+1));return [v,fr[i],`${from}–${to}${from<=(n+1)/2&&(n+1)/2<=to?' ◀':''}`];}))},
          `${(n+1)/2}. veri ${med} değerinin aralığında: ortanca ${med}.`));},
      ()=>{const n=ri(5,10+5*l),m=ri(10,60),m2=m+ri(-5,5);if(m2===m)return null;const x=n*m-(n-1)*m2;if(x<0)return null;return withSol(N(`${n} verinin ortalaması ${m}. Bir veri çıkarılınca kalanların ortalaması ${m2} oluyor. Çıkarılan veri kaçtır?`,x,`Önceki toplam ${n} × ${m} = ${n*m}, sonraki ${n-1} × ${m2} = ${(n-1)*m2}. Fark ${x}.`,card(`${n} veri · ortalama ${m}`,`${n-1} veri · ortalama ${m2}`),'','Ortalama × veri sayısı = toplam.'),
        SOL(`Ortalamayı toplama çevirelim: toplam = ortalama × veri sayısı. Çıkarılan veri, iki toplamın farkıdır.`,
          `Önce: ${n} veri, ortalama ${m} → toplam ${n} × ${m} = ${n*m}.`,
          `Sonra: ${n-1} veri, ortalama ${m2} → toplam ${n-1} × ${m2} = ${(n-1)*m2}.`,
          `Çıkarılan veri ${n*m} − ${(n-1)*m2} = ${x}.`));},
      ()=>{const n=ri(5,10+5*l),m=ri(10,60),m2=m+ri(1,6),x=(n+1)*m2-n*m;return withSol(N(`${n} verinin ortalaması ${m}. Hangi sayı eklenirse ortalama ${m2} olur?`,x,`Yeni toplam ${n+1} × ${m2} = ${(n+1)*m2}, eski ${n*m}. Eklenen ${x}.`,card(`${n} veri · ortalama ${m}`,`hedef ortalama ${m2}`)),
        SOL(`Ortalamayı toplama çevirelim: toplam = ortalama × veri sayısı. Eklenecek sayı, yeni toplam ile eski toplamın farkıdır.`,
          `Şimdiki toplam ${n} × ${m} = ${n*m}.`,
          `Yeni sayı eklenince ${n+1} veri olur; ortalama ${m2} için toplam ${n+1} × ${m2} = ${(n+1)*m2} olmalı.`,
          `Eklenecek sayı ${(n+1)*m2} − ${n*m} = ${x}.`));}
    ],
    surec:(l,ri,pick,rnd)=>[
      ()=>{const u=ri(2,6),r=[ri(1,6),ri(1,6),ri(1,6)],g=r.map(x=>x*u*10),k=ri(2,5),S=sum(r)*k,ask=ri(0,2);return withSol(N(`Üç şubede ${g.join(', ')} öğrenci var. Şube büyüklükleriyle orantılı ${S} kişilik örneklem seçilecek. ${ask+1}. şubeden kaç kişi seçilmeli?`,r[ask]*k,`Oran ${r.join(' : ')}; ${S} kişi ${sum(r)} paya bölünür, bir pay ${k}. ${ask+1}. şube ${r[ask]} × ${k} = ${r[ask]*k}.`,card(...g.map((x,i)=>`${i+1}. şube ${x}`),`örneklem ${S}`)),
        SOL(`Orantılı seçimde her şubeden, şubenin büyüklüğüyle aynı oranda öğrenci seçilir.`,
          `Şube sayılarını sadeleştirelim: ${g.join(' : ')} = ${r.join(' : ')} (hepsi ${u*10}'a bölündü).`,
          {t:`Örneklem ${sum(r)} paya bölünür: bir pay ${S} ÷ ${sum(r)} = ${k} kişi.`,fig:tbl(['Şube','Pay','Seçilecek'],r.map((x,i)=>[`${i+1}. şube`,x,x*k]),['Toplam',sum(r),S])},
          `${ask+1}. şube: ${r[ask]} × ${k} = ${r[ask]*k} kişi.`));},
      ()=>{const N0=ri(4,40)*50,p=pick([2,4,5,8,10,12,15,20]),v=N0*p/100;if(!Number.isInteger(v))return null;return withSol(N(`${N0} kişilik evrenin %${p}'${ek(p,'si')} örneklem olarak seçiliyor. Örneklem kaç kişidir?`,v,`${N0} × ${p}/100 = ${v}.`,card(`Evren ${N0}`,`%${p}`)),
        SOL(`%${p} demek "her 100 kişiden ${p} kişi" demek.`,
          `${N0} kişide ${N0} ÷ 100 = ${N0/100} tane yüzlük grup var.`,
          `Her gruptan ${p} kişi: ${N0/100} × ${p} = ${v} kişi.`));},
      ()=>{const N0=ri(100,600),k=ri(5,25),s=ri(1,k),c=Math.floor((N0-s)/k)+1;return withSol(N(`${N0} kişilik numaralı listeden ${s} numaralı kişiden başlayarak her ${k}. kişi seçiliyor (${s}, ${s+k}, ${s+2*k}, …). Kaç kişi seçilir?`,c,`Seçilen numaralar ${s} + ${k}t ≤ ${N0}: t = 0, 1, …, ${Math.floor((N0-s)/k)}. Toplam ${c}.`,card(`Liste 1–${N0}`,`Başlangıç ${s} · adım ${k}`),'','Son seçilen numarayı bul.'),
        SOL(`Seçilen numaralar ${E(s,'den')} başlar ve her seferinde ${k} artar. Listeyi aşmayan son numarayı bulursak kaç kişi seçildiğini sayarız.`,
          {t:`Seçilenler: ${s}, ${s+k}, ${s+2*k}, …`,fig:tbl(['Sıra','Numara'],[[1,s],[2,s+k],[3,s+2*k],['…','…'],[c,s+(c-1)*k]])},
          `Son seçilen ${s+(c-1)*k} (bir sonraki ${s+c*k}, ${E(N0,'den')} büyük).`,
          `Kaç adım attık? (${s+(c-1)*k} − ${s}) ÷ ${k} = ${c-1}. İlk kişiyle birlikte ${c} kişi.`));},
      ()=>{const sent=ri(4,30)*20,p=pick([25,40,45,55,60,65,75,80,85,90,95]),back=sent*p/100;if(!Number.isInteger(back))return null;return withSol(N(`${sent} anket gönderildi, ${back} tanesi geri döndü. Yanıt oranı yüzde kaçtır?`,p,`${back} ÷ ${sent} × 100 = %${p}.`,card(`Gönderilen ${sent}`,`Dönen ${back}`),'%'),
        SOL(`Yanıt oranı = dönen ÷ gönderilen. Yüzdeye çevirmek için 100 ile çarparız.`,
          `${back}/${sent} kesrini sadeleştir: ${frac(back,sent)}.`,
          `${frac(back,sent)} × 100 = %${p}.`));},
      ()=>{const r=[ri(1,5),ri(1,5),ri(1,5)],k=ri(2,8+l),known=ri(0,2);return withSol(N(`A, B, C gruplarının büyüklükleri ${r.join(' : ')} oranında. Orantılı örneklemede ${'ABC'[known]} grubundan ${r[known]*k} kişi seçildi. Örneklem toplam kaç kişidir?`,sum(r)*k,`${'ABC'[known]} grubu ${r[known]} pay = ${r[known]*k} kişi → bir pay ${k}. Toplam ${sum(r)} pay = ${sum(r)*k}.`,card(`Oran ${r.join(' : ')}`,`${'ABC'[known]}: ${r[known]*k} kişi`)),
        SOL(`Orantılı örneklemde gruplardan seçilenler de ${r.join(' : ')} oranındadır. Bir payın kaç kişi olduğunu bulalım.`,
          `${'ABC'[known]} grubu ${r[known]} pay ve ${r[known]*k} kişi: bir pay ${r[known]*k} ÷ ${r[known]} = ${k} kişi.`,
          {t:`Bütün gruplar:`,fig:tbl(['Grup','Pay','Kişi'],r.map((x,i)=>['ABC'[i],x,x*k]),['Toplam',sum(r),sum(r)*k])},
          `Örneklem ${sum(r)*k} kişi.`));}
    ],
    toplama:(l,ri,pick,rnd)=>[
      ()=>{const both=ri(3,20),a=both+ri(2,30),b=both+ri(2,30),none=ri(1,15);return withSol(N(`Ankette A seçeneğini ${a}, B seçeneğini ${b} kişi işaretledi; ${both} kişi ikisini de işaretledi, ${none} kişi hiçbirini işaretlemedi. Ankete kaç kişi katıldı?`,a+b-both+none,`En az birini işaretleyen ${a} + ${b} − ${both} = ${a+b-both}. Hiçbirini işaretlemeyenler eklenir: ${a+b-both+none}.`,card(`A: ${a}`,`B: ${b}`,`İkisi: ${both}`,`Hiçbiri: ${none}`),'','İkisini birden işaretleyenler iki kez sayılmasın.'),
        SOL(`A'yı ve B'yi işaretleyenleri toplarsak ikisini birden işaretleyenleri iki kez sayarız. Kesişim bir kez çıkarılır.`,
          {t:`Venn şeması gibi düşünelim:`,fig:tbl(['Grup','Kişi'],[['Yalnız A',a-both],['İkisi',both],['Yalnız B',b-both],['Hiçbiri',none]],['Toplam',a+b-both+none])},
          `En az birini işaretleyen ${a} + ${b} − ${both} = ${a+b-both}.`,
          `Hiçbirini işaretlemeyenler eklenir: ${a+b-both} + ${none} = ${a+b-both+none}.`));},
      ()=>{const both=ri(3,20),a=both+ri(2,30),b=both+ri(2,30),none=ri(1,15),T=a+b-both+none;return withSol(N(`${T} kişilik ankette A'yı ${a}, B'yi ${b} kişi seçti; ${none} kişi hiçbirini seçmedi. İkisini birden seçen kaç kişi var?`,both,`En az birini seçen ${T} − ${none} = ${T-none}. ${a} + ${b} − ${T-none} = ${both}.`,card(`Toplam ${T}`,`A: ${a} · B: ${b}`,`Hiçbiri: ${none}`)),
        SOL(`A ve B'yi seçenleri toplayınca ikisini birden seçenler iki kez sayılır. Bu fazlalık, kesişimi verir.`,
          `En az birini seçen: ${T} − ${none} = ${T-none}.`,
          `A + B = ${a} + ${b} = ${a+b}; bu sayı en az birini seçenlerden ${a+b-(T-none)} fazla.`,
          `Fazlalık ikisini birden seçenlerin iki kez sayılmasından: ${both} kişi.`));},
      ()=>{const abc=ri(1,6),ab=abc+ri(1,8),ac=abc+ri(1,8),bc=abc+ri(1,8),a=ab+ac-abc+ri(1,15),b=ab+bc-abc+ri(1,15),c=ac+bc-abc+ri(1,15),T=a+b+c-ab-ac-bc+abc;
        return withSol(N(`Kulüp anketinde satrancı ${a}, müziği ${b}, sporu ${c} kişi seçti. Satranç ve müzik ${ab}, satranç ve spor ${ac}, müzik ve spor ${bc} kişi; üçünü birden ${abc} kişi seçti. En az bir kulübü seçen kaç kişi var?`,T,`${a} + ${b} + ${c} − ${ab} − ${ac} − ${bc} + ${abc} = ${T}.`,card(`S ${a} · M ${b} · Sp ${c}`,`S∩M ${ab} · S∩Sp ${ac} · M∩Sp ${bc}`,`Üçü ${abc}`),'','Tek tek topla, ikili kesişimleri çıkar, üçlüyü geri ekle.'),
        SOL(`Üç küme için içerme–dışlama: tek tek topla, ikili kesişimleri çıkar, üçlü kesişimi geri ekle.`,
          `Tek tek: ${a} + ${b} + ${c} = ${a+b+c}. Burada iki kulüp seçenler 2 kez, üçünü seçenler 3 kez sayıldı.`,
          `İkili kesişimleri çıkar: ${a+b+c} − ${ab} − ${ac} − ${bc} = ${a+b+c-ab-ac-bc}. Şimdi üçünü seçenler 3 kez eklenip 3 kez çıkarıldı: hiç sayılmadılar.`,
          `Üçlüyü geri ekle: ${a+b+c-ab-ac-bc} + ${abc} = ${T}.`));},
      ()=>{const both=ri(3,20),oa=ri(2,30),ob=ri(2,30),none=ri(1,10),T=oa+ob+both+none;return withSol(N(`${T} kişilik sınıfta kitap okuyanlar ${oa+both}, film izleyenler ${ob+both} kişi; ${none} kişi ikisini de yapmıyor. Yalnız kitap okuyan kaç kişi var?`,oa,`En az birini yapan ${T} − ${none} = ${T-none}. İkisini yapan ${oa+both} + ${ob+both} − ${T-none} = ${both}. Yalnız kitap ${oa+both} − ${both} = ${oa}.`,card(`Toplam ${T}`,`Kitap ${oa+both} · Film ${ob+both}`,`Hiçbiri ${none}`)),
        SOL(`Önce ikisini birden yapanları bulalım; yalnız kitap okuyanlar, kitap okuyanlardan onlar çıkınca kalır.`,
          `En az birini yapan ${T} − ${none} = ${T-none}.`,
          `İkisini yapan: ${oa+both} + ${ob+both} − ${T-none} = ${both}.`,
          {t:`Yalnız kitap ${oa+both} − ${both} = ${oa}.`,fig:tbl(['Grup','Kişi'],[['Yalnız kitap',oa],['İkisi',both],['Yalnız film',ob],['Hiçbiri',none]],['Toplam',T])}));},
      ()=>{const abc=ri(1,5),ab=abc+ri(0,6),ac=abc+ri(0,6),bc=abc+ri(0,6),oa=ri(2,20),a=oa+ab+ac-abc,b=ab+bc-abc+ri(1,15),c=ac+bc-abc+ri(1,15);
        return withSol(N(`Satrancı ${a}, müziği ${b}, sporu ${c} kişi seçti. Satranç ve müzik ${ab}, satranç ve spor ${ac}, müzik ve spor ${bc} kişi; üçünü ${abc} kişi seçti. Yalnız satrancı seçen kaç kişi var?`,oa,`Satrancı seçenlerden başka kulübü de seçenleri çıkar: ${a} − ${ab} − ${ac} + ${abc} = ${oa}.`,card(`S ${a}`,`S∩M ${ab} · S∩Sp ${ac}`,`Üçü ${abc}`),'','Üçünü seçenler iki kez çıkarılmasın.'),
        SOL(`Satrancı seçenlerden, başka bir kulübü de seçenleri çıkarmalıyız. Üçünü birden seçenlere dikkat: iki çıkarmada da yer alırlar.`,
          `Satranç ve müzik ${ab}, satranç ve spor ${ac}. İkisini birden çıkarırsak üçünü seçen ${abc} kişi 2 kez çıkmış olur.`,
          `${a} − ${ab} − ${ac} + ${abc} = ${oa}.`,
          `Yalnız satranç seçen ${oa} kişi.`));}
    ],
    analiz:(l,ri,pick,rnd)=>[
      ()=>{const v=[ri(5,40),ri(5,40),ri(5,40)],m=ri(15,35),x=4*m-sum(v);if(x<1)return null;return withSol(N(`Dört grubun ortalaması ${m}. Grafikte A = ${v[0]}, B = ${v[1]}, C = ${v[2]}. D grubunun değeri kaçtır?`,x,`Toplam 4 × ${m} = ${4*m}. D = ${4*m} − ${sum(v)} = ${x}.`,F.bars([...v,x],['A','B','C','D?'])),
        SOL(`Ortalama bilindiğinde toplam bulunur: toplam = ortalama × grup sayısı.`,
          `Dört grubun toplamı 4 × ${m} = ${4*m}.`,
          `Bilinen üçü: ${v.join(' + ')} = ${sum(v)}.`,
          `D = ${4*m} − ${sum(v)} = ${x}.`));},
      ()=>{const a=ri(2,20)*10,p=pick([10,20,25,30,40,50,60,75]),b=a*(100+p)/100;if(!Number.isInteger(b))return null;return withSol(N(`Grafikte bir ürünün satışı Ocak'ta ${a}, Şubat'ta ${b}. Artış yüzde kaçtır?`,p,`Artış ${b-a}; ${b-a} ÷ ${a} × 100 = %${p}.`,F.bars([a,b],['Ocak','Şubat']),'%'),
        SOL(`Yüzde artış = artış miktarı ÷ ilk değer × 100. İlk değere göre karşılaştırırız.`,
          `Artış ${b} − ${a} = ${b-a}.`,
          `${b-a} ÷ ${a} = ${frac(b-a,a)}; × 100 = %${p}.`));},
      ()=>{const T=ri(4,20)*36,ang=pick([40,60,80,90,100,120,150]),v=T*ang/360;if(!Number.isInteger(v))return null;return withSol(N(`${T} kişilik anketin daire grafiğinde “Spor” dilimi ${ang}°. Kaç kişi sporu seçti?`,v,`Tam daire 360° = ${T} kişi. ${ang}/360 × ${T} = ${v}.`,card(`Toplam ${T}`,`Spor dilimi ${ang}°`)),
        SOL(`Daire grafiğinde tam daire (360°) bütün katılımcılardır. Dilimin açısı, o grubun bütüne oranını gösterir.`,
          `${ang}° tam dairenin ${ang}/360 = ${frac(ang,360)} kadarı.`,
          `${T} kişinin ${frac(ang,360)} kadarı: ${T} × ${ang} ÷ 360 = ${v} kişi.`));},
      ()=>{const ang=pick([20,30,40,45,60,72,90,120]),c=ri(2,40),T=360*c/ang;if(!Number.isInteger(T))return null;return withSol(N(`Daire grafiğinde ${c} kişiyi gösteren dilim ${ang}°. Ankete kaç kişi katıldı?`,T,`Dilim tam dairenin ${ang}/360 = ${frac(ang,360)} kadarı. Toplam ${c} ÷ ${frac(ang,360)} = ${T}.`,card(`${c} kişi → ${ang}°`)),
        SOL(`Tam daire 360°. Bir dilim bütünün ne kadarıysa, kişi sayısı da toplamın o kadarıdır.`,
          `${ang}° tam dairenin ${frac(ang,360)} kadarı. Tam daire bu dilimin ${360/ang} katı.`,
          `Toplam ${c} × ${360/ang} = ${T} kişi.`));},
      ()=>{const v=[ri(10,90),ri(10,90),ri(10,90),ri(10,90)],k=pick([2,3,4]),d=Math.max(...v)-Math.min(...v);return withSol(N(`Grafikteki dört değerin en büyüğü ile en küçüğünün farkının ${k} katı kaçtır?`,k*d,`En büyük ${Math.max(...v)}, en küçük ${Math.min(...v)}; fark ${d}, ${k} katı ${k*d}.`,F.bars(v)),
        SOL(`Grafikte en uzun ve en kısa sütunu bulalım; farkı alıp ${k} ile çarpalım.`,
          `Değerler ${v.join(', ')}. En büyük ${Math.max(...v)}, en küçük ${Math.min(...v)}.`,
          `Fark (açıklık) ${Math.max(...v)} − ${Math.min(...v)} = ${d}.`,
          `${k} katı ${k} × ${d} = ${k*d}.`));}
    ],
    yorumlama:(l,ri,pick,rnd)=>[
      ()=>{const n=ri(4,8+4*l),m=ri(10,50),d=ri(1,5),x=m+(n+1)*d;return withSol(N(`${n} sayının ortalaması ${m}. Yeni bir sayı eklenince ortalama ${d} artıyor. Eklenen sayı kaçtır?`,x,`Yeni toplam ${n+1} × ${m+d} = ${(n+1)*(m+d)}, eski ${n*m}. Fark ${x}.`,card(`${n} sayı · ortalama ${m}`,`ortalama +${d}`)),
        SOL(`Ortalamayı toplama çevirelim. Yeni sayı, toplamı ortalamanın yükseleceği kadar artırmalı.`,
          `Eski toplam ${n} × ${m} = ${n*m}.`,
          `Yeni ortalama ${m+d}, sayı adedi ${n+1}: yeni toplam ${n+1} × ${m+d} = ${(n+1)*(m+d)}.`,
          `Eklenen sayı ${(n+1)*(m+d)} − ${n*m} = ${x}. (Kısa yol: ${m} + ${n+1} × ${d}.)`));},
      ()=>{const d=ri(4,30),m=ri(d+2,d+30),mx=5*m-2*d-2;if(mx<=d+1)return null;return withSol(N(`Birbirinden farklı beş doğal sayının ortalaması ${m}, ortancası ${d}. En büyük sayı en çok kaç olabilir?`,mx,`Toplam ${5*m}. En büyüğü büyütmek için diğerleri olabildiğince küçük olmalı: 0, 1, ${d}, ${d+1}. En büyük ${5*m} − ${2*d+2} = ${mx}.`,card('5 farklı doğal sayı',`ortalama ${m} · ortanca ${d}`),'','Doğal sayılar 0 ile başlar. Ortancanın yanındaki üç sayı olabildiğince küçük olsun.'),
        SOL(`Toplam sabit: 5 × ${m} = ${5*m}. En büyük sayıyı büyütmek için diğer dört sayıyı olabildiğince küçük seçeriz.`,
          `Sıralı sayılar a < b < ${d} < c < e. Ortanca ${d}.`,
          {t:`En küçük seçimler: a = 0, b = 1 (farklı doğal sayılar), c = ${d+1} (ortancadan büyük en küçük sayı).`,fig:tbl(['a','b','ortanca','c','e'],[[0,1,d,d+1,'?']])},
          `e = ${5*m} − (0 + 1 + ${d} + ${d+1}) = ${5*m} − ${2*d+2} = ${mx}.`));},
      ()=>{const A=Array.from({length:2*ri(1,3)+1},()=>ri(1,30)),B=Array.from({length:2*ri(1,3)},()=>ri(1,30)),all=[...A,...B].sort((a,b)=>a-b),med=all[(all.length-1)/2];
        return withSol(N(`${A.join(', ')} verileri ile ${B.join(', ')} verileri birleştiriliyor. Birleşik verinin ortancası kaçtır?`,med,`Sıralı: ${all.join(', ')}. ${all.length} verinin ortadaki (${(all.length+1)/2}.) değeri ${med}.`,card(`A: ${A.join(', ')}`,`B: ${B.join(', ')}`)),
        SOL(`Ortanca için önce bütün verileri birleştirip küçükten büyüğe sıralarız. İki grubun ortancalarının ortalaması doğru sonucu vermez!`,
          `Toplam ${all.length} veri (tek sayı): ortadaki ${(all.length+1)/2}. veridir.`,
          {t:`Sıralı veriler:`,fig:tbl(all.map((_,i)=>i+1),[all.map((v,i)=>i===(all.length-1)/2?`<b>${v}</b>`:v)])},
          `Ortanca ${med}.`));},
      ()=>{const a=ri(1,30),d=2*ri(1,5),n=ri(5,15+5*l),last=a+(n-1)*d;return withSol(N(`${a}, ${a+d}, ${a+2*d}, …, ${last} verilerinin (her biri öncekinden ${d} fazla) ortalaması ile açıklığının toplamı kaçtır?`,(a+last)/2+(last-a),`Ortalama (${a} + ${last}) ÷ 2 = ${(a+last)/2}; açıklık ${last} − ${a} = ${last-a}. Toplam ${(a+last)/2+(last-a)}.`,card(`${a}, ${a+d}, …, ${last}`,`${n} veri`),'','Eşit artan dizide ortalama, ilk ve son terimin ortalamasıdır.'),
        SOL(`Eşit artan dizide sayılar ortadaki değerin iki yanında dengelenir; ortalama, ilk ve son terimin ortalamasıdır.`,
          `Ortalama (${a} + ${last}) ÷ 2 = ${(a+last)/2}.`,
          `Açıklık = en büyük − en küçük = ${last} − ${a} = ${last-a}.`,
          `Toplam ${(a+last)/2} + ${last-a} = ${(a+last)/2+(last-a)}.`));},
      ()=>{const v=Array.from({length:ri(4,6)},()=>ri(1,20)),s=sum(v),n=v.length,dev=sum(v.map(x=>Math.abs(n*x-s)));return withSol(Q(`${v.join(', ')} verilerinin ortalama mutlak sapması kaçtır?`,dev,n*n,`Ortalama ${frac(s,n)}. Ortalamaya uzaklıklar toplamı ${frac(dev,n)}; veri sayısına bölünce ${frac(dev,n*n)}.`,card(v.join(', '))),
        SOL(`Ortalama mutlak sapma: her verinin ortalamaya uzaklığını bul, bu uzaklıkların ortalamasını al.`,
          `Ortalama ${v.join(' + ')} = ${s}; ${s} ÷ ${n} = ${frac(s,n)}.`,
          {t:`Uzaklıklar (|veri − ortalama|):`,fig:tbl(['Veri','Uzaklık'],v.map(x=>[x,frac(Math.abs(n*x-s),n)]),['Toplam',frac(dev,n)])},
          `Ortalama mutlak sapma ${frac(dev,n)} ÷ ${n} = ${frac(dev,n*n)}.`));}
    ],
    inceleme:(l,ri,pick,rnd)=>[
      ()=>{const p=pick([10,20,25,50]),q=pick([10,20,25,50]),net=(100+p)*(100-q)/100-100;return withSol(N(`Bir fiyat önce %${p} artıyor, sonra yeni fiyat üzerinden %${q} indiriliyor. İlk fiyata göre net değişim yüzde kaçtır? (Artış pozitif, azalış negatif)`,net,`100 TL düşün: önce ${100+p} TL, sonra %${q} indirimle ${fmt((100+p)*(100-q)/100)} TL. Net değişim %${fmt(net)}.`,card(`+%${p}`,`−%${q}`),'%','100 TL ile dene.'),
        SOL(`Yüzdeler farklı tutarlar üzerinden hesaplandığı için %${p} artış ile %${q} indirim birbirini götürmez. 100 TL ile deneyelim.`,
          `100 TL %${p} artınca ${100+p} TL olur.`,
          `Yeni fiyat ${100+p} TL'nin %${q} kadarı ${fmt((100+p)*q/100)} TL; indirimle ${fmt((100+p)*(100-q)/100)} TL olur.`,
          `100 TL'den ${fmt((100+p)*(100-q)/100)} TL'ye: net değişim %${fmt(net)}${net<0?' (azalış)':net>0?' (artış)':''}.`));},
      ()=>{const p=pick([10,20,25,30,40,50]),orig=ri(2,30)*20,fin=orig*(100-p)/100;if(!Number.isInteger(fin))return null;return withSol(N(`%${p} indirimden sonra fiyat ${fin} TL oldu. İndirimden önceki fiyat kaç TL?`,orig,`Son fiyat ilk fiyatın %${100-p} kadarı: ${fin} ÷ ${100-p} × 100 = ${orig}.`,card(`İndirim %${p}`,`Son fiyat ${fin} TL`),'TL','Son fiyat ilk fiyatın yüzde kaçı?'),
        SOL(`%${p} indirimden sonra ilk fiyatın %${100-p} kadarı ödenir. Son fiyat bu kısma karşılık gelir.`,
          `İlk fiyatın %${100-p} kadarı = ${fin} TL.`,
          `%1'i ${fin} ÷ ${100-p} = ${fmt(fin/(100-p))} TL.`,
          `%100'ü ${fmt(fin/(100-p))} × 100 = ${orig} TL.`));},
      ()=>{const a=ri(10,40),A=a+ri(5,40),b=ri(10,40),B=b+ri(5,40);if(a*B===b*A)return null;const ans=a/A>b/B?'A':'B';return withSol(C(`A grubunda ${A} kişiden ${a} kişi, B grubunda ${B} kişiden ${b} kişi başarılı. Başarı oranı daha yüksek grup hangisidir?`,ans,['A','B','Eşit','Karşılaştırılamaz'],`A: ${a}/${A} ≈ %${(100*a/A).toFixed(1).replace('.',',')}, B: ${b}/${B} ≈ %${(100*b/B).toFixed(1).replace('.',',')}.`,card(`A: ${a}/${A}`,`B: ${b}/${B}`),'Sayıları değil oranları karşılaştır.'),
        SOL(`Başarılı kişi sayısı tek başına yanıltır; grupların büyüklüğü farklı. Her grubun başarı oranını hesaplayalım.`,
          `A: ${a}/${A} ≈ %${(100*a/A).toFixed(1).replace('.',',')}.`,
          `B: ${b}/${B} ≈ %${(100*b/B).toFixed(1).replace('.',',')}.`,
          `Oranı yüksek olan ${ans}.`));},
      ()=>{const p=pick([10,20,25,40,50,60,75,80]),q=pick([10,20,25,40,50,60,75,80]),x=ri(2,20)*100,v=x*p*q/10000;if(!Number.isInteger(v))return null;return withSol(N(`${x} öğrencinin %${p}'${ek(p,'si')} spor yapıyor; spor yapanların %${q}'${ek(q,'si')} yüzüyor. Kaç öğrenci yüzüyor?`,v,`Spor yapan ${x} × ${p}/100 = ${x*p/100}; yüzen ${x*p/100} × ${q}/100 = ${v}.`,card(`${x} öğrenci`,`%${p} → %${q}`)),
        SOL(`Yüzdenin yüzdesi: önce birinci yüzdeyi alıp yeni grubu bulalım, sonra o grubun yüzdesini alalım.`,
          `Spor yapan: ${x} × ${p}/100 = ${x*p/100}.`,
          `Bunların %${q} kadarı: ${x*p/100} × ${q}/100 = ${v} öğrenci.`));},
      ()=>{const a=pick([10,20,25,30,40,50]),b=pick([10,20,25,40,50,60,75]),y=ri(2,20)*20,x=b*y/a;if(!Number.isInteger(x)||a===b)return null;return withSol(N(`x sayısının %${a}'${ek(a,'si')}, ${y} sayısının %${b}'${ek(b,'si')} kadardır. x kaçtır?`,x,`x × ${a}/100 = ${y} × ${b}/100 → x = ${y} × ${b} ÷ ${a} = ${x}.`,card(`%${a} · x = %${b} · ${y}`)),
        SOL(`İki yüzde eşitse bir eşitlik kurarız: x × ${a}/100 = ${y} × ${b}/100.`,
          `Sağ taraf: ${y} sayısının %${b} kadarı ${y*b/100}.`,
          `x'in %${a} kadarı ${y*b/100}: x × ${a} = ${y*b} → x = ${y*b} ÷ ${a} = ${x}.`));}
    ],
    yansima:(l,ri,pick,rnd)=>[
      ()=>{const a=ri(-10,10),x=ri(-15,15);if(x===a)return null;const xp=2*a-x;return withSol(N(`Düşey ayna x = ${signed(a)} doğrusu. x = ${signed(x)} konumundaki noktanın görüntüsünün x konumu kaçtır?`,xp,`Aynaya uzaklık ${Math.abs(x-a)}. Görüntü diğer yanda aynı uzaklıkta: ${signed(xp)}.`,F.mirror(Math.abs(x-a)),'','Görüntü = 2 × ayna konumu − nokta konumu.'),
        SOL(`Görüntü, aynanın öbür yanında, aynaya noktayla aynı uzaklıktadır.`,
          `Noktanın aynaya uzaklığı |${signed(x)} − (${signed(a)})| = ${Math.abs(x-a)}.`,
          {t:`Görüntü aynanın ${x<a?'sağında':'solunda'} ${Math.abs(x-a)} birim: ${signed(a)} ${x<a?'+':'−'} ${Math.abs(x-a)} = ${signed(xp)}.`,fig:F.number([Math.min(x,xp),a,Math.max(x,xp)])},
          `Kısa kural: görüntü = 2 × ayna − nokta = 2 × ${par(a)} − ${par(x)} = ${signed(xp)}.`));},
      ()=>{const a=ri(-5,5),b=a+ri(1,8),x=ri(-15,a-1),xf=x+2*(b-a);return withSol(N(`Nokta x = ${signed(x)} konumunda. Önce x = ${signed(a)} aynasına, sonra görüntüsü x = ${signed(b)} aynasına göre yansıtılıyor. Son görüntünün x konumu kaçtır?`,xf,`İlk görüntü ${signed(2*a-x)}, ikinci ${signed(2*b-(2*a-x))}. Paralel iki aynada art arda yansıma, aynalar arası uzaklığın iki katı kadar öteleme yapar: ${signed(x)} + 2 × ${b-a} = ${signed(xf)}.`,card(`Nokta x = ${signed(x)}`,`Ayna 1: x = ${signed(a)}`,`Ayna 2: x = ${signed(b)}`),'','Her yansımada görüntü = 2 × ayna − nokta.'),
        SOL(`Her yansımada görüntü = 2 × ayna − nokta. İki yansımayı sırayla uygulayalım.`,
          `1. ayna (x = ${signed(a)}): 2 × ${par(a)} − ${par(x)} = ${signed(2*a-x)}.`,
          `2. ayna (x = ${signed(b)}): 2 × ${par(b)} − ${par(2*a-x)} = ${signed(xf)}.`,
          {t:`Sonuç: nokta ${E(x,'den')} ${E(xf,'e')} kaydı. Kayma 2 × (${signed(b)} − ${par(a)}) = ${2*(b-a)}: paralel iki ayna bir öteleme yapar.`,fig:F.number([x,a,b,xf].sort((p,q)=>p-q))}));},
      ()=>{const a=ri(-6,6),b=ri(-6,6),x=ri(-10,10),y=ri(-10,10),X=2*a-x,Y=2*b-y;return withSol(N(`(${signed(x)}, ${signed(y)}) noktası önce x = ${signed(a)} doğrusuna, sonra y = ${signed(b)} doğrusuna göre yansıtılıyor. Son görüntünün koordinatları toplamı kaçtır?`,X+Y,`x = ${signed(a)} yansıması: (${signed(X)}, ${signed(y)}). y = ${signed(b)} yansıması: (${signed(X)}, ${signed(Y)}). Toplam ${signed(X+Y)}.`,card(`P(${signed(x)}, ${signed(y)})`,`x = ${signed(a)} → y = ${signed(b)}`),'',"Düşey ayna yalnız x'i, yatay ayna yalnız y'yi değiştirir."),
        SOL(`Düşey doğru (x = sabit) üzerinden yansıma yalnız x'i, yatay doğru (y = sabit) üzerinden yansıma yalnız y'yi değiştirir.`,
          `x = ${signed(a)} yansıması: x' = 2 × ${par(a)} − ${par(x)} = ${signed(X)}; y değişmez: (${signed(X)}, ${signed(y)}).`,
          `y = ${signed(b)} yansıması: y' = 2 × ${par(b)} − ${par(y)} = ${signed(Y)}; x değişmez: (${signed(X)}, ${signed(Y)}).`,
          `Koordinatlar toplamı ${signed(X)} + ${par(Y)} = ${signed(X+Y)}.`));},
      ()=>{const d=ri(2,10+5*l),k=ri(1,d-1);return withSol(N(`A noktası ile aynadaki görüntüsü A′ arası ${2*d} cm. A, aynaya doğru ${k} cm yaklaşırsa A ile yeni görüntüsü arası kaç cm olur?`,2*(d-k),`A'nın aynaya uzaklığı ${d} cm idi, şimdi ${d-k} cm. Görüntüyle arası 2 × ${d-k} = ${2*(d-k)}.`,F.mirror(d),'cm'),
        SOL(`Nokta ile görüntüsü aynaya eşit uzaklıktadır; aralarındaki uzaklık, aynaya uzaklığın 2 katıdır.`,
          {t:`Başta A ile A′ arası ${2*d} cm → A aynadan ${d} cm uzakta.`,fig:F.mirror(d)},
          `A ${k} cm yaklaşınca aynaya uzaklık ${d} − ${k} = ${d-k} cm; görüntü de ${d-k} cm arkada olur.`,
          `Yeni uzaklık 2 × ${d-k} = ${2*(d-k)} cm.`));},
      ()=>{const D=ri(2,8+2*l),x=ri(1,D-1);return withSol(N(`Aralarında ${D} cm olan iki paralel ayna var. Aynaların arasındaki A noktası birinci aynadan ${x} cm uzakta. A önce birinci aynaya, sonra bu görüntü ikinci aynaya göre yansıtılıyor. A ile son görüntü arası kaç cm?`,2*D,`İlk görüntü birinci aynanın ${x} cm arkasında, yani ikinci aynadan ${D+x} cm uzakta. Son görüntü ikinci aynanın ${D+x} cm ötesinde. A ikinci aynadan ${D-x} cm uzakta: ${D+x} + ${D-x} = ${2*D}.`,card(`Aynalar arası ${D} cm`,`A, 1. aynadan ${x} cm`),'cm','Konumları sayı doğrusunda yaz.'),
        SOL(`Konumları bir sayı doğrusunda yazalım: birinci ayna 0'da, ikinci ayna ${E(D,'de')}, A noktası ${E(x,'de')}.`,
          `Birinci yansıma: görüntü 2 × 0 − ${x} = −${x}.`,
          `İkinci yansıma (ayna ${D}): 2 × ${D} − (−${x}) = ${2*D+x}.`,
          {t:`A (${x}) ile son görüntü (${2*D+x}) arası ${2*D+x} − ${x} = ${2*D} cm. A'nın yeri sonucu değiştirmez.`,fig:F.number([-x,0,x,D,2*D+x])}));}
    ],
    insa:(l,ri,pick,rnd)=>[
      ()=>{const a=ri(8,30),b=ri(5,25);return withSol(N(`ABC üçgeninde AB'nin orta dikmesi BC kenarını D noktasında kesiyor. BC = ${a} cm ve AC = ${b} cm ise ADC üçgeninin çevresi kaç cm?`,a+b,`D orta dikme üzerinde: DA = DB. Çevre AD + DC + AC = BD + DC + AC = BC + AC = ${a} + ${b} = ${a+b}.`,card(`BC = ${a} cm`,`AC = ${b} cm`,'D: AB’nin orta dikmesi ile BC’nin kesişimi'),'cm','Orta dikme üzerindeki nokta A ve B’ye eşit uzaklıktadır.'),
        SOL(`Bir doğru parçasının orta dikmesi üzerindeki her nokta, parçanın iki ucuna eşit uzaklıktadır.`,
          `D, AB'nin orta dikmesi üzerinde: DA = DB.`,
          `ADC'nin çevresi = AD + DC + AC. AD yerine DB yazalım: DB + DC + AC.`,
          `DB + DC = BC (D, BC üzerinde). Çevre BC + AC = ${a} + ${b} = ${a+b} cm.`));},
      ()=>{const A=2*ri(10,75),I=90+A/2;return withSol(rnd()<.5?N(`ABC üçgeninde B ve C açılarının açıortayları I noktasında kesişiyor. ∠BIC = ${I}°. ∠A kaç derecedir?`,A,`∠BIC = 180 − (∠B + ∠C)/2 = 180 − (180 − ∠A)/2 = 90 + ∠A/2. ${I} = 90 + ∠A/2 → ∠A = ${A}.`,card(`∠BIC = ${I}°`),'°'):N(`ABC üçgeninde ∠A = ${A}°. B ve C açılarının açıortayları I noktasında kesişiyor. ∠BIC kaç derecedir?`,I,`∠B + ∠C = ${180-A}°, yarısı ${(180-A)/2}°. ∠BIC = 180 − ${(180-A)/2} = ${I}.`,card(`∠A = ${A}°`),'°'),
        SOL(`BIC üçgenine bakalım: B ve C köşelerindeki açılar, ∠B ve ∠C'nin yarılarıdır.`,
          `∠IBC + ∠ICB = (∠B + ∠C) ÷ 2. Üçgende ∠B + ∠C = 180 − ∠A.`,
          `∠BIC = 180 − (180 − ∠A) ÷ 2 = 90 + ∠A ÷ 2.`,
          `${I} = 90 + ∠A ÷ 2 ya da tersine: ∠A = ${A}° ise ∠BIC = 90 + ${A/2} = ${I}°.`));},
      ()=>{const a=ri(5,40),b=ri(1,30),x=a+b,half=x+a;return withSol(N(`OC, ∠AOB'nin açıortayı. ∠AOC = x + ${a}° ve ∠COB = 2x − ${b}°. ∠AOB kaç derecedir?`,2*half,`Açıortay eşit iki açı yapar: x + ${a} = 2x − ${b} → x = ${x}. ∠AOC = ${half}°, ∠AOB = ${2*half}°.`,card(`∠AOC = x + ${a}°`,`∠COB = 2x − ${b}°`),'°'),
        SOL(`Açıortay açıyı iki eş parçaya böler: ∠AOC = ∠COB.`,
          `x + ${a} = 2x − ${b} → ${a} + ${b} = 2x − x → x = ${x}.`,
          `∠AOC = ${x} + ${a} = ${half}°. (Kontrol: ∠COB = 2 × ${x} − ${b} = ${half}°.)`,
          `∠AOB = 2 × ${half} = ${2*half}°.`));},
      ()=>{const PA=ri(5,30),AB=ri(2,2*PA-1);return withSol(N(`P, AB doğru parçasının orta dikmesi üzerinde bir nokta. PA = ${PA} cm ve AB = ${AB} cm. PAB üçgeninin çevresi kaç cm?`,2*PA+AB,`PB = PA = ${PA}. Çevre ${PA} + ${PA} + ${AB} = ${2*PA+AB}.`,card(`PA = ${PA} cm`,`AB = ${AB} cm`),'cm'),
        SOL(`Orta dikme üzerindeki her nokta, parçanın iki ucuna eşit uzaklıktadır.`,
          `P orta dikmede: PB = PA = ${PA} cm.`,
          `PAB üçgeninin çevresi PA + PB + AB = ${PA} + ${PA} + ${AB} = ${2*PA+AB} cm.`));},
      ()=>{const a=2*ri(10,80);if(a===90)return null;const ans=Math.abs(90-a);return withSol(N(`∠AOB ile ∠BOC komşu bütünler açılar ve ∠AOB = ${a}°. ∠AOB'nin açıortayı ile OC arasındaki açı, ∠BOC'nin açıortayı ile OA arasındaki açıdan kaç derece farklıdır?`,ans,`OA'dan ölçersek: ∠AOB'nin açıortayı ${a/2}°'de, OC 180°'de; aradaki açı ${180-a/2}°. ∠BOC'nin açıortayı ${(a+180)/2}°'de; OA ile arası ${(a+180)/2}°. Fark |${180-a/2} − ${(a+180)/2}| = ${ans}.`,card(`∠AOB = ${a}°`,`∠BOC = ${180-a}°`),'°','Bütün ışınları OA’dan ölçülen açılarla yaz.'),
        SOL(`Bütün ışınları OA'dan ölçülen açılarla yazarsak iki ışın arasındaki açı, iki sayının farkıdır.`,
          `OB ${a}°'de, OC 180°'de. ∠AOB'nin açıortayı ${a}/2 = ${a/2}°'de, ∠BOC'nin açıortayı (${a} + 180)/2 = ${(a+180)/2}°'de.`,
          `1. açı: açıortay (${a/2}°) ile OC (180°) arası 180 − ${a/2} = ${180-a/2}°. 2. açı: açıortay (${(a+180)/2}°) ile OA (0°) arası ${(a+180)/2}°.`,
          `Fark |${180-a/2} − ${(a+180)/2}| = ${ans}°.`));}
    ]
  };
  const topics=root.MatCurricula[7].topics;
  const cache=new Map(),recent=new Map();let serial=0;
  function make(id,level,slot,rng,bank=false) {
    const t=topics.find(t=>t.id===id);
    if(!t||!G.LEVELS.some(l=>l.id===level))throw Error('Geçersiz 7. sınıf konusu/seviyesi');
    const n=bank?5+(level-1)*21+slot:5+Math.floor(rng()*(15+level*25));
    const k=bank?2+slot%7:2+Math.floor(rng()*(3+level));
    const ri=(a,b)=>a+Math.floor(rng()*(b-a+1)),pick=arr=>arr[Math.floor(rng()*arr.length)];
    const forms=level>=6?expert[id.slice(3)](level,ri,pick,rng):builders[id.slice(3)](level,n,k);
    if(level>=4&&level<6)forms.splice(0,2,...advanced[id.slice(3)](n,k));
    // Üst seviye kalıpları uygun olmayan sayılar çıkarsa null döner; yeni sayılarla yeniden denenir.
    let q=null;for(let i=0;i<300&&!q;i++)q=forms[slot%forms.length]();
    if(!q)throw Error('Soru üretilemedi: '+id+':'+level);
    // Sorunun kendisi görünüm modelindeki ayırt edici veriyi de taşısın.
    if(id==='m7-gorunumler'&&slot%5<2&&level<6)q.prompt+=` (Model ${n})`;
    q.id=`${id}:${level}:${bank?String(slot+1).padStart(2,'0'):'gen'+serial++}`;
    q.level=level;q.points=G.LEVELS.find(l=>l.id===level).points;q.outcome=t.outcome;
    q.templateId=id+":"+(slot%forms.length);
    if(q.choices)q.choices=G.shuffle(rng,q.choices);
    if(!bank)q.generated=true;
    return q;
  }
  function get(id,level) {
    if(!G.BANK_LEVELS.some(l=>l.id===level))throw Error('Soru bankası yalnız ilk beş seviyededir');
    const key=id+':'+level;
    if(!cache.has(key)) {
      const seed=[...key].reduce((s,c)=>(s*31+c.charCodeAt(0))%2147483647,17),rng=G.makeRng(seed);
      cache.set(key,Array.from({length:15},(_,i)=>make(id,level,i,rng,true)));
    }
    return JSON.parse(JSON.stringify(cache.get(key)));
  }
  // Son sorular tarayıcıda saklanır; test kapatılıp açılınca da aynı sorular hemen tekrar gelmez.
  // Yer kaplamasın diye soru metinleri yerine kısa özet kodları saklanır.
  const STORE_KEY='mat7-gen-recent-v3';
  const templateState=new Map();
  let saved={};
  try{root.localStorage.removeItem('mat7-gen-recent-v1');}catch(err){/* eski kayıt silinemezse önemli değil */}
  try{saved=JSON.parse(root.localStorage.getItem(STORE_KEY)||'{}')||{};}catch(err){saved={};}
  function generate(id,level,rng=Math.random,opts={}) {
    const key=id+':'+level;
    if(!recent.has(key))recent.set(key,Array.isArray(saved[key]?.recent)?saved[key].recent.filter(x=>typeof x==='string').slice(-80):[]);
    if(!templateState.has(key)) {
      const raw=saved[key]||{};
      templateState.set(key,{uses:Array.from({length:5},(_,i)=>Math.max(0,Number(raw.uses?.[i])||0)),last:raw.last??-1});
    }
    const st=templateState.get(key),min=Math.min(...st.uses);
    const least=st.uses.map((n,i)=>n===min?i:-1).filter(i=>i>=0);
    const fresh=least.filter(i=>i!==st.last),pool=fresh.length?fresh:least;
    const forced=String(opts.template||'').startsWith(key+'#')?Number(opts.template.slice(key.length+1)):-1;
    const candidates=opts.repeatable?[0,1,2,3,4]:pool;
    const slot=forced>=0&&forced<5?forced:candidates[Math.floor(rng()*candidates.length)];
    const history=recent.get(key);let q,mark;
    for(let i=0;i<100;i++) { q=make(id,level,slot,rng);mark=root.MatLevelGen.hashText(q.prompt).toString(36);if(opts.repeatable||!history.includes(mark))break; }
    if(!opts.repeatable) {
      history.push(mark);if(history.length>80)history.shift();
      st.uses[slot]++;st.last=slot;
      const floor=Math.min(...st.uses);
      saved[key]={recent:history,uses:st.uses.map(n=>n-floor),last:slot};
      try{root.localStorage.setItem(STORE_KEY,JSON.stringify(saved));}catch(err){/* depolama yoksa yalnız bellekte kalır */}
    }
    return {...q,templateId:key+'#'+slot};
  }
  root.Mat7Questions={get,generate,frac,topics:topics.map(t=>t.id)};
  const oldGet=root.MatQuestionBank.get;
  root.MatQuestionBank.get=(id,l)=>id.startsWith('m7-')?get(id,l):oldGet(id,l);
  root.MatQuestionBank.totalByGrade={5:1500,7:1650};
  const oldGenerate=root.MatLevelGen.generate;
  root.MatLevelGen.generate=(id,l,...args)=>id.startsWith('m7-')?generate(id,l,args[0],args[1]):oldGenerate(id,l,...args);
  root.MatLevelGen.topics.push(...topics.map(t=>t.id));
  const oldTemplates=root.MatLevelGen.templates;
  root.MatLevelGen.templates=(id,level)=>id.startsWith('m7-')?5:oldTemplates(id,level);
  const oldArcade=root.MatArcadeGen.generate;
  root.MatArcadeGen.generate=(id,rng,d=2,wantNum=false)=>{
    if(!id.startsWith('m7-'))return oldArcade(id,rng,d,wantNum);
    const q=generate(id,[1,3,5][d-1]||3,rng);
    const answer=q.answer;
    const choices=q.choices||G.shuffle(rng,[answer,answer+1,answer+2,answer+3].map(String));
    return {prompt:q.prompt,svg:q.scene.html,answer,choices,unit:q.unit||'',numeric:q.kind==='num',explain:q.explain};
  };
  root.MatArcadeGen.topics.push(...topics.map(t=>t.id));
})(typeof window !== 'undefined' ? window : globalThis);
