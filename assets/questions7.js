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
    if(!Number.isSafeInteger(answer)||answer<0) return C(prompt,fmt(answer),[fmt(-answer),fmt(answer+1),fmt(answer-1),fmt(answer+2)],explain,html,hint);
    return {kind:'num',prompt,answer,explain,hint,unit,scene:scene(html||card(prompt))};
  }
  const Q=(prompt,a,b,explain,html)=>C(prompt,frac(a,b),[frac(-a,b),frac(a+b,b),frac(a-b,b),frac(a+2*b,b)],explain,html,'İşareti belirle; gerekiyorsa ortak payda bul ve sonucu sadeleştir.');
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
      ()=>C(`${n} kişilik A şubesi ve ${3*n} kişilik B şubesinden toplam ${4*k} kişi, büyüklüklerle orantılı seçilecek. Uygun dağılım hangisi?`,`A: ${k}, B: ${3*k}`,[`A: ${2*k}, B: ${2*k}`,`A: ${3*k}, B: ${k}`,`A: 0, B: ${4*k}`],`Şubeler 1:3 oranında; örneklem de ${k}:${3*k} olmalı.`,card(`A: ${n} kişi · B: ${3*n} kişi`,`Örneklem ${4*k}`)),
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
  const topics=root.MatCurricula[7].topics;
  const cache=new Map(),recent=new Map();let serial=0;
  function make(id,level,slot,rng,bank=false) {
    const t=topics.find(t=>t.id===id);
    if(!t||!G.LEVELS.some(l=>l.id===level))throw Error('Geçersiz 7. sınıf konusu/seviyesi');
    const n=bank?5+(level-1)*21+slot:5+Math.floor(rng()*(15+level*25));
    const k=bank?2+slot%7:2+Math.floor(rng()*(3+level));
    const forms=builders[id.slice(3)](level,n,k);
    if(level>=4)forms.splice(0,2,...advanced[id.slice(3)](n,k));
    const q=forms[slot%forms.length]();
    // Sorunun kendisi görünüm modelindeki ayırt edici veriyi de taşısın.
    if(id==='m7-gorunumler'&&slot%5<2)q.prompt+=` (Model ${n})`;
    q.id=`${id}:${level}:${bank?String(slot+1).padStart(2,'0'):'gen'+serial++}`;
    q.level=level;q.points=G.LEVELS.find(l=>l.id===level).points;q.outcome=t.outcome;
    if(q.choices)q.choices=G.shuffle(rng,q.choices);
    if(!bank)q.generated=true;
    return q;
  }
  function get(id,level) {
    const key=id+':'+level;
    if(!cache.has(key)) {
      const seed=[...key].reduce((s,c)=>(s*31+c.charCodeAt(0))%2147483647,17),rng=G.makeRng(seed);
      cache.set(key,Array.from({length:15},(_,i)=>make(id,level,i,rng,true)));
    }
    return JSON.parse(JSON.stringify(cache.get(key)));
  }
  // Son sorular tarayıcıda saklanır; test kapatılıp açılınca da aynı sorular hemen tekrar gelmez.
  const STORE_KEY='mat7-gen-recent-v1';
  let saved={};
  try{saved=JSON.parse(root.localStorage.getItem(STORE_KEY)||'{}')||{};}catch(err){saved={};}
  function generate(id,level,rng=Math.random) {
    const key=id+':'+level;
    if(!recent.has(key))recent.set(key,Array.isArray(saved[key])?saved[key].filter(x=>typeof x==='string').slice(-80):[]);
    const history=recent.get(key);let q;
    for(let i=0;i<100;i++) { q=make(id,level,Math.floor(rng()*15),rng);if(!history.includes(q.prompt))break; }
    history.push(q.prompt);if(history.length>80)history.shift();
    saved[key]=history;
    try{root.localStorage.setItem(STORE_KEY,JSON.stringify(saved));}catch(err){/* depolama yoksa yalnız bellekte kalır */}
    return q;
  }
  root.Mat7Questions={get,generate,frac,topics:topics.map(t=>t.id)};
  const oldGet=root.MatQuestionBank.get;
  root.MatQuestionBank.get=(id,l)=>id.startsWith('m7-')?get(id,l):oldGet(id,l);
  root.MatQuestionBank.totalByGrade={5:1500,7:1650};
  const oldGenerate=root.MatLevelGen.generate;
  root.MatLevelGen.generate=(id,l,...args)=>id.startsWith('m7-')?generate(id,l,...args):oldGenerate(id,l,...args);
  root.MatLevelGen.topics.push(...topics.map(t=>t.id));
  const oldTemplates=root.MatLevelGen.templates;
  root.MatLevelGen.templates=id=>id.startsWith('m7-')?5:oldTemplates(id);
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
