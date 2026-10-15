/* 7. sınıf, 1. kitap: dört tema ve 22 etap. Metin ve örnekler özgündür. */
(function (root) {
  "use strict";
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const svg = s => `<svg viewBox="0 0 420 250" role="img" aria-label="Matematik modeli" style="width:100%;max-height:320px">${s}</svg>`;
  const text = (x,y,t) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="17" fill="#1f2547">${esc(t)}</text>`;
  const line = (x,y,a,b,c='#2c6bed') => `<line x1="${x}" y1="${y}" x2="${a}" y2="${b}" stroke="${c}" stroke-width="3"/>`;
  const figures = {
    number(values = [-6,-3,0,3,6]) {
      const numbers=values.map(n=>Number(String(n).replace('−','-').replace(',','.')));
      const min=Math.min(...numbers),span=Math.max(...numbers)-min||1;
      return svg(line(35,120,385,120) + values.map((n,i) => {
        const x=45+(numbers[i]-min)*330/span;
        return line(x,113,x,127)+text(x,i%2?177:153,n);
      }).join('') + text(210,55,'Sola doğru küçülür · Sağa doğru büyür'));
    },
    prism(a=6,b=4,c=3) {
      return svg(`<path d="M90 90 L270 90 L330 45 L150 45 Z" fill="#d9e6ff" stroke="#2c6bed" stroke-width="3"/><path d="M270 90 L330 45 L330 165 L270 210 Z" fill="#ccebe2" stroke="#1c8c74" stroke-width="3"/><rect x="90" y="90" width="180" height="120" fill="#fff1d0" stroke="#d89a12" stroke-width="3"/>`+text(180,235,`${a} cm`)+text(355,130,`${c} cm`)+text(310,225,`${b} cm`));
    },
    bars(values=[4,8,6,10], labels=['A','B','C','D']) {
      const max=Math.max(...values,1);
      return svg(line(40,205,390,205)+line(40,30,40,205)+values.map((v,i)=>`<rect x="${65+i*80}" y="${205-v/max*145}" width="45" height="${v/max*145}" fill="${i%2?'#1c8c74':'#2c6bed'}" rx="4"/>`+text(87+i*80,195-v/max*145,v)+text(87+i*80,235,labels[i])).join('')+text(25,210,'0'));
    },
    mirror(d=3) {
      return svg(line(210,25,210,220,'#8a4fd8')+line(80,120,340,120)+`<circle cx="80" cy="120" r="7" fill="#e25b45"/><circle cx="340" cy="120" r="7" fill="#1c8c74"/>`+text(80,100,'A')+text(340,100,"A′")+text(140,150,`${d} birim`)+text(280,150,`${d} birim`)+text(210,242,'Yansıma doğrusu'));
    },
    cards(lines) { return `<div class="formula">${lines.map(s=>`<p>${esc(s)}</p>`).join('')}</div>`; }
  };
  root.Mat7Figures = figures;
  const worlds = [
    {id:71,name:'Sayılar Uzayı',color:'#2c6bed',blurb:'Tam sayılar, rasyonel sayılar ve işlemler'},
    {id:72,name:'Prizma Diyarı',color:'#1c8c74',blurb:'Görünümler, yüzey alanı ve hacim'},
    {id:73,name:'Veri Kâşifleri',color:'#d89a12',blurb:'Araştır, veriyi analiz et, yorumla'},
    {id:74,name:'Simetri Atölyesi',color:'#8a4fd8',blurb:'Yansıma, orta dikme ve açıortay'}
  ];
  const topics=[];
  function add(code,slug,title,rows,model,check) {
    const id=`m7-${slug}`;
    topics.push({id,no:code,worldId:70+Number(code[0]),title,grade:7,outcome:`M7-${code}-${slug}`,
      slides:rows.map(([h,p,...lines],i)=>({h,p,scene:{kind:'art',html:i===0&&model?model:figures.cards(lines.length?lines:[h])},...(i===rows.length-1?{check:{ask:check[0],answer:check[1]}}:{})}))});
  }
  add('1.1','tamsayilar','Tam sayılar',[
    ['Sıfır bir referanstır','Deniz seviyesini 0 kabul edersek 8 m yukarısı +8, 8 m aşağısı −8 olur. Sıfır ne pozitif ne negatiftir.'],
    ['Sayı doğrusunda yön','Sağdaki sayı büyüktür. Negatif sayılarda sıfıra daha yakın olan daha büyüktür.','−9 < −4 < 0 < 6'],
    ['Karşıt sayılar','Sıfıra uzaklıkları aynı, yönleri farklı olan sayılar karşıttır. Sıfırın karşıtı yine sıfırdır.','−12 ve +12','(−12) + 12 = 0'],
    ['Asansör yolculuğu','Asansör −3. kattan 5 kat yukarı giderse 2. kata ulaşır. Kat numarası ile gidilen kat sayısını ayır.','−3 + 5 = 2'],
    ['Düşün ve açıkla','Bir dalgıç −14 m, diğeri −6 m konumunda. Büyük sayı ile daha derinde olmayı karıştırma.','−14 < −6']
  ],figures.number(),['Hangi dalgıç yüzeye daha yakındır?','−6 m konumundaki; yüzeye uzaklığı 6 m’dir.']);
  add('1.2','rasyonel','Rasyonel sayılar',[
    ['Bütünü eş parçalara ayır','a ve b tam sayı, b sıfırdan farklı olmak üzere a/b biçiminde yazılabilen sayılar rasyoneldir.','a/b · b ≠ 0'],
    ['İşareti taşı','Tek bir eksi işareti payda, pay veya kesrin önünde olabilir. İki eksi birbirini götürür.','−3/5 = 3/(−5) = −(3/5)','(−3)/(−5) = 3/5'],
    ['Eş kesirler','Payı ve paydayı aynı sıfırdan farklı sayıyla çarpmak veya bölmek değeri değiştirmez.','−12/18 = −2/3'],
    ['Tam sayıya köprü','Her tam sayı paydası 1 olacak şekilde yazılabilir. Ancak her rasyonel sayı tam sayı değildir.','−7 = −7/1','3/2 = 1,5'],
    ['Sıfırın yeri','Pay sıfır olabilir; payda sıfır olamaz. Sıfıra bölme tanımsızdır.','0/8 = 0','8/0 tanımsız']
  ],null,['−15/20 kesrinin en sade biçimi nedir?','Pay ve paydayı 5’e böl: −3/4.']);
  add('1.3','mutlakdeger','Mutlak değer',[
    ['Uzaklığın işareti yok','Bir sayının sıfıra uzaklığı mutlak değeridir. Mutlak değer negatif olamaz.','|−7| = 7','|0| = 0'],
    ['İki farklı sayı, aynı uzaklık','+9 ve −9 sıfıra eşit uzaklıktadır. |x| = 9 için iki sayı vardır.','x = 9 veya x = −9'],
    ['Paketleme kontrolü','Hedef 250 g, ölçülen 246 g ise sapma −4 g; hata miktarı 4 g olur.','246 − 250 = −4','|−4| = 4'],
    ['İki nokta arası','−5 ile 8 arasındaki uzaklık, farkın mutlak değeridir. Çıkarma sırası uzaklığı değiştirmez.','|8 − (−5)| = 13'],
    ['Tolerans aralığı','250 g ± 3 g koşulu 247 g ile 253 g arasını, uçlar dâhil, kabul eder.','|ölçüm − 250| ≤ 3']
  ],figures.number(),['254 g’lık paket kabul edilir mi?','Hayır. |254 − 250| = 4 g, 3 g sınırını aşar.']);
  add('1.4','temsiller','Rasyonel sayıların farklı temsilleri',[
    ['Kesirden ondalığa','Payı paydaya böl. İşaret aynı kalır.','−3/4 = −0,75','7/5 = 1,4'],
    ['Sonlu mu, devirli mi?','Önce kesri sadeleştir. Paydada yalnız 2 ve 5 asal çarpanları varsa ondalık gösterim sonludur. Payda 1 de sonlu gösterim verir.','3/12 = 1/4 = 0,25','1/6 = 0,1666…'],
    ['Devir tekrar eder','0,272727… sayısında tekrar eden grup 27’dir. Virgülden hemen sonra başlayan iki basamaklı devir için payda 99 olur.','0,272727… = 27/99 = 3/11'],
    ['Devir sonradan başlarsa','x = 0,4555… olsun. 100x − 10x = 45,555… − 4,555… = 41 bulunur.','90x = 41','x = 41/90'],
    ['Sonsuz devir, tam değer','x = 0,999… için 10x − x = 9’dur. Bu nedenle x = 1. Sonlu 0,999 ise 1’den küçüktür.','0,999… = 1']
  ],null,['0,666… hangi sade kesirdir?','6/9 = 2/3.']);
  add('1.5','siralama','Rasyonel sayıları karşılaştırma ve sıralama',[
    ['İşaretten başla','Negatif sayılar sıfırdan, sıfır pozitif sayılardan küçüktür.','−5/2 < 0 < 1/8'],
    ['Ortak payda','Paydaları pozitif ve eşit yap. Payı büyük olan kesir daha büyüktür.','−2/3 = −8/12','−3/4 = −9/12','−3/4 < −2/3'],
    ['Ondalığa çevir','Aynı tür gösterim karşılaştırmayı kolaylaştırır. Negatiflerde mutlak değeri büyük olan daha küçüktür.','−0,8 < −0,25'],
    ['Arada yeni sayı','İki farklı rasyonel sayının ortalaması bu iki sayının arasındadır. İşlemi tekrar ederek yeni sayılar bulabilirsin.','1/4 ile 3/4 arasında 1/2 vardır.'],
    ['Sonsuz sayıda ara değer','İki farklı rasyonel sayı arasında sonsuz rasyonel sayı vardır. Sayı doğrusunda yan yana iki rasyonel sayı seçilemez.','1/4 < 3/8 < 1/2']
  ],figures.number(['−1','−0,5','0','0,5','1']),['−0,6 mı −2/5 mi daha büyük?','−2/5 = −0,4 daha büyüktür.']);
  add('1.6','tamsayiislemler','Tam sayılarla işlemler ve problemler',[
    ['Toplamada yön','Aynı işaretlileri toplarken mutlak değerleri topla, ortak işareti koru. Farklı işaretlilerde büyük mutlak değerden küçüğü çıkar.','−8 + (−5) = −13','−8 + 5 = −3'],
    ['Çıkarmayı toplamaya çevir','Bir sayıyı çıkarmak, onun karşıtını toplamak demektir.','6 − (−4) = 6 + 4 = 10'],
    ['Çarpma ve bölme','Aynı işaretli iki sayının çarpımı ve bölümü pozitif, farklı işaretlilerin negatiftir. Bölen sıfır olamaz.','(−6) × (−3) = 18','(−18) ÷ 3 = −6'],
    ['Bakiye planı','Bakiyen −40 TL iken hesabına 75 TL eklenip 20 TL harcanırsa 15 TL kalır.','−40 + 75 − 20 = 15'],
    ['Sonucu kontrol et','Sıcaklık −3 °C’den 8 °C’ye yükselirse artış 11 °C olur. İşlemde eksi işaretlerini açık parantezle yaz.','8 − (−3) = 11']
  ],figures.number(),['(−24) ÷ (−6) − 7 kaçtır?','4 − 7 = −3.']);
  add('1.7','rasyonelislemler','Rasyonel sayılarla işlemler ve üsler',[
    ['Toplamada ortak payda','Paydaları eşitle, payları topla veya çıkar. Paydaları toplama.','−1/3 + 3/4 = −4/12 + 9/12 = 5/12'],
    ['Çarpma ve bölme','Çarpmada paylar ve paydalar çarpılır. Bölmede ikinci kesrin çarpma tersini kullan. Sıfırın çarpma tersi yoktur.','(−2/3) × (3/5) = −2/5','(3/4) ÷ (1/2) = 3/2'],
    ['İşlem özellikleri','Toplama ve çarpmada değişme ve birleşme vardır. Çarpma toplama üzerine dağılır. Çıkarmada değişme yoktur.','(1/2) × (4 + 6) = 2 + 3 = 5'],
    ['Üs ve parantez','Üs, tabanın kaç kez çarpılacağını söyler. Eksi parantezin dışındaysa üs yalnız tabana uygulanır.','(−2)² = 4','−2² = −4','(−1)⁵ = −1'],
    ['Kesirli yaşam problemi','6 L meyve suyunu 3/4 L’lik şişelere doldurursan 8 şişe gerekir.','6 ÷ (3/4) = 6 × (4/3) = 8']
  ],null,['(−1/2)³ kaçtır?','(−1/2) × (−1/2) × (−1/2) = −1/8.']);
  add('1.8','cokadimli','Çok adımlı işlemler',[
    ['İşlem sırası','Önce parantez içini kendi işlem önceliğiyle çöz; sonra üsler, çarpma-bölme, toplama-çıkarma gelir.','3 × (2 + 4) = 18'],
    ['Aynı öncelikte soldan sağa','Çarpma ve bölme aynı önceliktedir. Toplama ve çıkarma da aynı önceliktedir.','24 ÷ 3 × 2 = 8 × 2 = 16'],
    ['Kesir çizgisi gruplar','Kesir çizgisinin üstü ve altı ayrı birer parantez gibi düşünülür.','(6 + 2)/(5 − 1) = 8/4 = 2'],
    ['Depoyu planla','48 L’nin önce 1/4’ü kullanılıyor, sonra kalan suyun 1/3’ü kullanılıyor. İkinci kesrin hangi bütüne ait olduğuna dikkat et.','48 − 12 = 36','36 − 12 = 24 L'],
    ['Hata avcısı','2 + 3 × 4 için soldan başlayıp 20 bulmak hatalıdır; önce çarpma yapılır.','2 + 12 = 14']
  ],null,['(−3)² − 12 ÷ 4 kaçtır?','9 − 3 = 6.']);
  add('2.1','gorunumler','Cisimlerin farklı yönlerden görünümleri',[
    ['Bakış yönü','Önden, sağdan ve üstten görünüm cismin farklı yüzlerini gösterir. Görünmeyen küpler de hacme dâhildir.'],
    ['Üstten görünüm','Küp yığınında üstten bakınca dolu taban hücrelerini görürüz. Bir hücredeki yüksekliği yalnız üstten görünümden bilemeyiz.','Aynı taban, farklı yükseklik olabilir.'],
    ['Önden görünüm','Her sütunda önden arkaya duran kulelerin en yükseği silueti belirler; yükseklikleri toplamayız.','Ön sıra: 1, 3','Arka sıra: 2, 1','Ön görünüm yükseklikleri: 2, 3'],
    ['Sağdan görünüm','Sağdan bakınca her derinlik sırasındaki en yüksek kule görünür. Yönü değiştirmek cismi değiştirmez.','Ön sıra en yüksek: 3','Arka sıra en yüksek: 2'],
    ['Görünümler yetmeyebilir','Bir siluetin arkasında daha kısa kuleler gizlenebilir. Tek bir görünüm küp sayısını her zaman belirlemez.','Görünür alan ≠ toplam küp sayısı']
  ],figures.prism(),['Tabanda iki hücre doluysa toplam küp sayısı kesinlikle 2 midir?','Hayır; hücrelerde birden fazla küp üst üste olabilir.']);
  add('2.2','acinim','Prizma açınımı ve yüzey alanı',[
    ['Altı yüzü aç','Dikdörtgenler prizmasında altı yüz, on iki ayrıt ve sekiz köşe vardır. Karşılıklı yüzler eştir.'],
    ['Üç çift dikdörtgen','Ayrıtlar a, b, c ise yüz alanları ab, ac, bc olur. Her birinden iki tane bulunur.','A = 2 × (ab + ac + bc)'],
    ['Kutuyu kapla','6 cm, 4 cm, 3 cm ayrıtlı kutuda yüz çiftlerinin alanlarını topla.','A = 2 × (24 + 18 + 12) = 108 cm²'],
    ['Açık kutu','Üstü açık kutuda üst yüzün alanını çıkar. Hangi yüzün eksik olduğunu belirlemeden formülü değiştirme.','108 − 6 × 4 = 84 cm²'],
    ['Küpün özel durumu','Küpün altı yüzü eş karelerdir. Alan birimi uzunluk biriminin karesidir.','A = 6a²','a = 5 cm → A = 150 cm²']
  ],figures.prism(),['Ayrıtı 4 cm olan küpün yüzey alanı kaç cm²?','6 × 4² = 96 cm².']);
  add('2.3','hacimyorum','Hacmi eş nesnelerle yorumlama',[
    ['İçeriyi doldur','Hacim, cismin uzayda kapladığı yerdir. Boşluksuz ve üst üste binmeden yerleştirilen eş birim küplerle ölçülür.'],
    ['Bir katmanı say','Bir sırada 4, bir katmanda 3 sıra varsa katmanda 12 küp vardır.','4 × 3 = 12 birim küp'],
    ['Katmanları birleştir','Aynı katmandan 5 tane varsa toplam 60 birim küp vardır.','12 × 5 = 60 birim küp'],
    ['Birim büyürse sayı azalır','Ayrıtı 2 cm olan bir küpün hacmi 8 cm³’tür. 64 cm³ hacmi doldurmak için 8 böyle küp gerekir.','2 × 2 × 2 = 8','64 ÷ 8 = 8'],
    ['Alanla karıştırma','Yüzeyi birim kareyle, iç hacmi birim küple ölçeriz. Dıştaki küpleri saymak toplam hacmi vermeyebilir.','Alan: cm² · Hacim: cm³']
  ],figures.prism(4,3,5),['Bir katta 18 küp, 4 katta kaç küp olur?','18 × 4 = 72 birim küp.']);
  add('2.4','hacim','Prizmanın hacim bağıntısı',[
    ['Taban alanından hacme','Taban alanı bir katmanı, yükseklik katman sayısını temsil eder. Aynı birimlerle çalış.','H = taban alanı × yükseklik = a × b × c'],
    ['Örnek depo','8 dm, 5 dm ve 4 dm ayrıtlı depo 160 dm³ hacimlidir.','8 × 5 × 4 = 160 dm³'],
    ['Eksik ayrıt','Hacmi taban alanına bölerek yüksekliği bul.','H = 180 cm³, taban = 30 cm²','Yükseklik = 180 ÷ 30 = 6 cm'],
    ['Boyutlar değişirse','Bir ayrıt iki katına çıkarsa hacim iki katına çıkar. Üç ayrıt da iki katına çıkarsa hacim sekiz kat olur.','2 × 2 × 2 = 8'],
    ['Doluluk payı','160 L’lik deponun 3/4’ü doluysa içinde 120 L su vardır; boş kısmı 40 L’dir.','160 × 3/4 = 120 L']
  ],figures.prism(8,5,4),['Ayrıtı 3 cm olan küpün hacmi kaç cm³?','3³ = 27 cm³.']);
  add('2.5','birimler','Hacim ve sıvı ölçme birimleri',[
    ['Küp birimlerde bin kat','1 dm = 10 cm olduğu için 1 dm³ = 10 × 10 × 10 = 1.000 cm³ olur.','1 m³ = 1.000 dm³','1 cm³ = 1.000 mm³'],
    ['Litre köprüsü','Litre ile küp birimlerini bu eşitlikler bağlar.','1 L = 1 dm³','1 mL = 1 cm³','1 m³ = 1.000 L'],
    ['Litre basamakları','L, dL, cL, mL arasında her adımda 10 kat vardır. Küp birimlerin her adımında ise 1.000 kat vardır.','1 L = 10 dL = 100 cL = 1.000 mL'],
    ['Dönüşümü uygula','2,4 L suyu mililitreye çevirirken 1.000 ile çarp.','2,4 L = 2.400 mL','750 cm³ = 750 mL = 0,75 L'],
    ['Önce birimleri eşitle','1,5 L ile 250 mL doğrudan 1,5 + 250 diye toplanamaz.','1.500 + 250 = 1.750 mL']
  ],null,['0,6 m³ kaç litredir?','0,6 × 1.000 = 600 L.']);
  add('2.6','problemler','Hacim ve yüzey alanı problemleri',[
    ['Modeli seç','Boya ve kaplama miktarı için yüzey alanını, depolanacak sıvı için hacmi kullan.','Kaplama → cm²','Kapasite → cm³ veya L'],
    ['Akvaryum','40 × 30 × 20 cm akvaryumun iç hacmi 24.000 cm³ = 24 L’dir. İç ölçüler verilmiş olmalıdır.','40 × 30 × 20 = 24.000'],
    ['Kısmi doluluk','24 L akvaryumun 3/4’ü doluysa 18 L su vardır. Kalan kapasite 6 L’dir.','24 × 3/4 = 18'],
    ['Kutuya yerleştirme','12 × 8 × 6 cm kutuya ayrıtı 2 cm küpler, yüzleri kutu yüzlerine paralel olacak biçimde yerleştiriliyor.','(12 ÷ 2) × (8 ÷ 2) × (6 ÷ 2) = 72 küp'],
    ['Malzeme payı','Kaplanacak alan 200 dm², fire payı %10 ise 220 dm² malzeme gerekir. Gerçek yaşamda birimi ve ek koşulu da kontrol et.','200 + 20 = 220 dm²']
  ],figures.prism(40,30,20),['30 L suyu 3/4 L şişelere doldurmak için kaç şişe gerekir?','30 ÷ (3/4) = 40 şişe.']);
  add('3.1','dagilimlar','Kategorik ve nicel veri dağılımları',[
    ['Veri neyi anlatır?','Renk, ulaşım türü gibi özellikler kategoriktir. Boy, süre ve kütle gibi ölçümler niceldir.','Kategorik: ulaşım türü','Nicel: yolculuk süresi'],
    ['Kesikli ve sürekli','Kitap sayısı sayılarak bulunur, kesiklidir. Kitap kütlesi ölçülür, süreklidir; iki ölçüm arasında başka değerler olabilir.','5 kitap · 1,25 kg'],
    ['Sayı görünmesi yetmez','Forma numarası ve posta kodu miktar belirtmez. Sayılarla yazılsa da kategorik etiketlerdir.','12 numaralı forma bir miktar değildir.'],
    ['Değişebilirlik','Aynı tür bitkiler farklı boylara ulaşabilir. Tek ölçüm bütün grubu temsil etmeyebilir.','Boylar: 12,4 · 13,1 · 11,8 cm'],
    ['Dağılıma bak','Bir veri grubunun hangi değerlere yayıldığına bak. Yalnız en büyük değer bütün hikâyeyi anlatmaz.','Sıklık: bir değerin görülme sayısı']
  ],figures.bars(),['Öğrencilerin 100 m koşu süreleri hangi veri türündedir?','Nicel sürekli veridir; süre ölçülür.']);
  add('3.2','surec','İstatistiksel araştırma süreci',[
    ['Soruyu kur','İstatistiksel soru bir grupta değişebilen bir özellik sorar. Evreni, zamanı ve ölçülen özelliği açıkça belirt.','Okulumuzdaki 7. sınıfların günlük okuma süreleri nasıl dağılır?'],
    ['Evren ve örneklem','Evren araştırılacak grubun tamamı, örneklem ondan seçilen alt gruptur. Yalnız yakın arkadaşları seçmek yanlılık yaratabilir.','Evren: bütün 7. sınıflar','Örneklem: her şubeden rastgele seçilenler'],
    ['Dört adımı izle','Önce soru, sonra veri toplama ve hazırlama, ardından analiz, son olarak yorum ve karar gelir.','Soru → Toplama → Analiz → Yorum'],
    ['Ölçmeyi planla','Aynı süreyi aynı birimle ve aynı zaman aralığı için sor. Dün ile geçen ayı karıştırma.','Birim: dakika/gün','Dönem: son 7 gün'],
    ['Sınırını belirt','Bir okuldan elde edilen sonucu bütün ülkeye doğrudan genelleme. Örneklem büyüklüğü kadar seçilme biçimi de önemlidir.','Sonuç hangi grubu temsil ediyor?']
  ],null,['Her şubeden rastgele öğrenci seçmek niçin yararlıdır?','Farklı şubelerin temsil edilmesine yardımcı olur, seçim yanlılığını azaltır.']);
  add('3.3','toplama','Veri toplama ve mahremiyet',[
    ['Yöntem seç','Görüş için anket, davranış için gözlem, geçmiş kayıtlar için hazır veri kullanılabilir. Boy uzunluğu uygun araçla ölçülür.','Anket · Gözlem · Ölçüm · Hazır veri'],
    ['Tarafsız soru','“Harika kütüphanemizi seviyor musun?” yönlendirir. “Kütüphaneden ne sıklıkla yararlanırsın?” daha tarafsızdır.','Seçenekler anlaşılır ve kapsayıcı olsun.'],
    ['Gereken kadar veri','Okuma süresi araştırmasında ev adresi veya kimlik numarası toplamak gerekli değildir. Kişiyi belirleyen bilgileri koru.','Araştırma için gerekli alanları seç.'],
    ['Gönüllülük ve paylaşım','Katılımı zorunlu tutma. Bireyleri tanınır kılan cevapları sınıf grubunda paylaşma; toplu sonuçları kullan.','İsim listesi yerine anonim özet'],
    ['Eksik veri','Boş bırakılmış cevap, sıfır demek değildir. Tekrar kayıtları ve birim hatalarını kontrol et.','Eksik cevap ≠ 0 dakika']
  ],null,['20 öğrenciden 3’ü cevap vermediyse kaç geçerli yanıt vardır?','Diğer cevaplar geçerliyse 17 yanıt vardır; boş cevapları sıfır saymayız.']);
  add('3.4','analiz','Veri analizi ve grafikler',[
    ['Sütun grafiği','Kategorilerin sıklıklarını karşılaştırmayı kolaylaştırır. Eksen adı, birim ve ölçek okunmalıdır.'],
    ['Çizgi grafiği','Zamana bağlı değişimi izlemek için uygundur. Noktaları zaman sırasına göre birleştir.','Pazartesi → Salı → Çarşamba'],
    ['Nokta grafiği','Her gözlem bir nokta ile gösterilir. Aynı değerdeki noktalar üst üste dizilir. Tekrarları görmeyi kolaylaştırır.','4, 4, 5, 7 → 4 üzerinde iki nokta'],
    ['Ölçek kontrolü','Bir çizgi aralığı 5 kişiyse üç aralık 15 kişidir. Sütun yüksekliğini yalnız çizimdeki santimetreyle yorumlama.','3 aralık × 5 kişi = 15 kişi'],
    ['Grafikten hesaba','A:4, B:8, C:6, D:10 ise toplam 28, en büyük ile en küçük farkı 6’dır.','4 + 8 + 6 + 10 = 28']
  ],figures.bars(),['Haftalık sıcaklık değişimini hangi grafikle göstermek uygundur?','Zaman sıralı çizgi grafiği uygundur.']);
  add('3.5','yorumlama','Merkez, yayılım ve karar verme',[
    ['Ortalama ve ortanca','Ortalama toplamın gözlem sayısına bölümüdür. Ortancayı bulmadan önce sırala; çift sayıda gözlemde ortadaki ikisinin ortalamasını al.','2, 4, 4, 10 → ortalama 5, ortanca 4'],
    ['Tepe değer ve açıklık','Tepe değer en sık görülen değerdir; birden fazla olabilir. Açıklık en büyükten en küçüğü çıkararak bulunur.','2, 4, 4, 10 → tepe değer 4','Açıklık = 10 − 2 = 8'],
    ['Ortalama mutlak sapma','Her verinin ortalamadan uzaklığını bul, topla ve gözlem sayısına böl. OMS yayılım ölçüsüdür.','2, 4, 4, 10 → ortalama 5','OMS = (3 + 1 + 1 + 5)/4 = 2,5'],
    ['İstikrarı karşılaştır','A: 8,10,12 ve B: 4,10,16 ortalamaları 10’dur. A’nın OMS’si daha küçüktür; değerler merkeze daha yakındır.','A: OMS = 4/3','B: OMS = 4'],
    ['Referans bandı','Ortalama 20, OMS 3 ise ortalama ± OMS bandı 17–23’tür. Her veri bu bantta olmak zorunda değildir. P50 ortancayı temsil eder.','17 ≤ değer ≤ 23']
  ],figures.bars([2,4,4,10]),['5, 7, 9 verilerinin OMS’si kaçtır?','Ortalama 7; OMS = (2 + 0 + 2)/3 = 4/3.']);
  add('3.6','inceleme','Araştırmaları ve medya yorumlarını inceleme',[
    ['İddiayı sorgula','Bir haberin kaynağına, tarihine, araştırma yöntemine ve örneklemine bak. Başlık tek başına kanıt değildir.','Kim? Ne zaman? Kimlerden? Nasıl?'],
    ['Kesilmiş eksen','100 ve 110 değerlerini 99’dan başlayan eksenle göstermek farkı büyük hissettirebilir. Gerçek artış %10’dur.','Artış: 10','Oran: 10/100 = %10'],
    ['İlişki ve neden','İki olayın birlikte değişmesi, birinin diğerine neden olduğunu tek başına kanıtlamaz. Başka etkenler olabilir.','Birlikte değişim ≠ nedenin kanıtı'],
    ['Temsil sorunu','Yalnız spor kulübüne sorulan bir anketle tüm okulun spor alışkanlığı hakkında kesin sonuç verilemez.','Örneklem seçimi sonucu etkiler.'],
    ['Raporu düzelt','Veri kaynağı, örneklem büyüklüğü, birim ve sınırlılıkları rapora ekle. Özel bilgileri toplu sonuçlarla değiştir.','İddia → Kanıt → Sınırlılık']
  ],null,['80’den 100’e artış yüzde kaçtır?','20/80 × 100 = %25; yeni değere değil başlangıca böleriz.']);
  add('4.1','yansima','Yansıma dönüşümü',[
    ['Aynanın iki yanı','Bir nokta ve yansıması, simetri doğrusuna eşit dik uzaklıktadır. Bu doğru iki noktayı birleştiren parçanın orta dikmesidir.'],
    ['Adım adım çiz','Noktadan ayna doğrusuna dik çiz. Karşı tarafa aynı uzaklığı taşı. Şeklin her köşesi için tekrarla, eşleşen köşeleri birleştir.','Diklik + eşit uzaklık'],
    ['Eşlik korunur','Yansıma uzunlukları ve açıları korur; şeklin alanı ve çevresi değişmez. Yön görünümü tersine dönebilir.','Şekil ≅ görüntüsü'],
    ['Doğru üzerindeki noktalar','Simetri doğrusunun üzerindeki nokta yerinde kalır. Dışındaki noktanın görüntüsü doğrunun öte yanındadır.','Doğruya uzaklık 0 → değişmez'],
    ['Simetri doğrusu sayısı','Karenin 4, kare olmayan dikdörtgenin 2, eşkenar üçgenin 3 simetri doğrusu vardır. Genel bir paralelkenarda simetri doğrusu yoktur.','Her eş şekil çifti yansıma çifti değildir.']
  ],figures.mirror(),['A noktası aynadan 5 cm uzaktaysa A ile A′ arası kaç cm?','5 + 5 = 10 cm.']);
  add('4.2','insa','Orta dikme ve açıortay inşası',[
    ['Orta dikme','Bir doğru parçasını orta noktasında dik kesen doğrudur. Üzerindeki her nokta parçanın uçlarına eşit uzaklıktadır.','PA = PB'],
    ['Pergelle kur','A ve B merkezli, eş yarıçaplı iki çember çiz. Yarıçap AB’nin yarısından büyük olmalı ki iki kesişim noktası oluşsun. Bu noktaları birleştir.','r > |AB|/2'],
    ['Açıortay','Açıyı iki eş açıya ayıran ışındır. Köşeden başlar. 74°’lik açıyı 37° ve 37° olarak ayırır.','74 ÷ 2 = 37°'],
    ['Açıortayı inşa et','Köşe merkezli bir yayla kollarda K ve L noktalarını belirle. K ve L merkezli eş yayların açı içindeki kesişimini köşeye bağla.','Köşeye eşit uzaklık → eş yaylar → açıortay'],
    ['İki özelliği birlikte kontrol et','Bir doğru parçayı ortalıyor ama dik kesmiyorsa orta dikme değildir. Bir ışın yalnız açının içinde diye açıortay olmaz.','Orta dikme: eş parçalar ve 90°','Açıortay: eş açı ölçüleri']
  ],figures.mirror(4),['AB = 12 cm ise orta dikme inşasında 5 cm yarıçap uygun mu?','Hayır. İki çemberin iki noktada kesişmesi için yarıçap 6 cm’den büyük olmalı.']);
  root.MatCurricula = {5:root.MatCurriculum,7:{worlds,topics}};
  root.MatCurriculum.forGrade = grade => root.MatCurricula[grade] || root.MatCurricula[5];
})(typeof window !== 'undefined' ? window : globalThis);
