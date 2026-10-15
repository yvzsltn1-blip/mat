(function (root) {
  // Her örnekte önce model kurulur, ardından değişim ve sonuç gösterilir.
  const S = (kind, extra = {}) => ({ kind, ...extra });
  const angle = deg => S('angle', {deg, show:true});
  const grid = (cols, rows) => S('grid', {cols, rows, count:true});
  const cards = (items, active=0) => S('learning-cards', {items, active});
  const stories = {
    nokta: ['Bir yol çizelim', [
      ['Başlangıcı işaretle', 'Kâğıtta A noktasını seç. Nokta bize bir yer söyler.', S('point')],
      ['Bir bitiş ekle', 'B noktasını da seçip iki noktayı düz bir çizgiyle birleştir. İki ucu belli bir doğru parçası yaptın.', S('segment')],
      ['Yolu uzat', 'Bir ucu sonsuza uzatırsan ışın, iki ucu sonsuza uzatırsan doğru elde edersin. Oklar devam ettiğini söyler.', S('trio')]], 'Hangisinin uzunluğunu ölçebiliriz?', 'Doğru parçasının. İki ucu da bellidir.'],
    aci: ['Kapı ne kadar açıldı?', [
      ['Az aç', 'Kollar arasındaki açıklık 30°. Bu bir dar açı.', angle(30)],
      ['Çeyrek dönüş yap', 'Açıklık 90° oldu. Küçük kare dik açıyı gösterir.', angle(90)],
      ['Biraz daha aç', '120°, 90° ile 180° arasındadır. Bu kez geniş açı oluştu.', angle(120)]], 'Kolun boyunu uzatırsak açı büyür mü?', 'Hayır. Açı, kolların boyuna değil aralarındaki açıklığa bağlıdır.'],
    cember: ['Pergelin izini takip et', [
      ['Merkezi bul', 'Pergelin sivri ucu aynı yerde durur. Çizginin her noktası merkeze eşit uzaklıktadır.', S('circle',{showDiameter:false})],
      ['İki yarıçapı birleştir', 'Merkezden geçen çap, iki yarıçap uzunluğundadır.', S('circle')],
      ['İçini boya', 'Yalnız sınır çemberdir. İç bölgeyi de aldığımızda daire olur.', S('disk')]], 'Yarıçap 4 cm ise çap kaç cm?', '4 + 4 = 8 cm.'],
    dikme: ['Nehirden en kısa geçiş', [
      ['Karşıya bak', 'A noktasından düz kıyıya ineceğiz. Kırmızı yol kıyıyla dik açı yapıyor.', S('perp')],
      ['Köşeyi kontrol et', 'Dik açı tam 90°dir. Diklik işareti küçük bir karedir.', angle(90)],
      ['Kısa yolu seç', 'Bir noktadan bir doğruya en kısa uzaklık dikme ile ölçülür.', S('perp')]], 'Dikmenin doğruyla yaptığı açı kaç derecedir?', '90°.'],
    paralel: ['Raylar neden buluşmuyor?', [
      ['Raylara bak', 'Düz raylar yan yana uzanır. Birbirlerine yaklaşmazlar.', S('life',{id:'rails'})],
      ['Aralığı karşılaştır', 'İki ayrı yerde ölçülen dik uzaklık aynıdır.', S('parallel')],
      ['Bir yol daha çiz', 'Kırmızı doğru iki paralel doğruyu kesebilir. Bu, paralellerin birbirini kestiği anlamına gelmez.', S('transversal')]], 'Paralel doğruların ortak noktası var mı?', 'Aynı düzlemde paralel doğruların ortak noktası yoktur.'],
    olcme: ['Dönüşü ölçelim', [
      ['Küçük dönüş', '30°lik bir dönüş yap. Bu, dik açının üçte biridir.', angle(30)],
      ['Üç katına çıkar', '30° + 30° + 30° = 90°. Çeyrek tur tamamlandı.', angle(90)],
      ['Yarım tura ulaş', 'İki dik açı 180° eder. Kollar artık zıt yönlere bakar.', angle(180)]], 'Tam turda kaç dik açı vardır?', '4 dik açı: 4 × 90° = 360°.'],
    durum: ['İki doğrunun buluşması', [
      ['Yan yana', 'Paralel doğruların ortak noktası yoktur.', S('parallel')],
      ['Bir noktada buluş', 'Kesişen doğruların tam bir ortak noktası vardır.', S('intersect')],
      ['Üst üste getir', 'Çakışık doğruların bütün noktaları ortaktır.', S('coincident')]], 'İki farklı doğru iki ayrı noktada kesişebilir mi?', 'Hayır. İki noktası ortaksa aynı doğru üzerinde çakışırlar.'],
    cift: ['Eksik açıyı tamamla', [
      ['Bir dik açı düşün', 'Hedefimiz 90°. Bir parçanın ölçüsü 30° olsun.', angle(30)],
      ['Kalanı bul', '90° − 30° = 60°. 30° ile 60° tümler açılardır.', angle(60)],
      ['Hedefi büyüt', 'Bu kez hedef 180° ise: 180° − 30° = 150°. 30° ile 150° bütünlerdir.', angle(150)]], '40°nin tümleri ve bütünleri kaçtır?', 'Tümleri 50°, bütünleri 140°dir.'],
    cokgen: ['Kenar ekle, şekli keşfet', [
      ['Üç kenarla başla', 'Kapalı şeklin 3 kenarı ve 3 köşesi var: üçgen.', S('polygon',{n:3})],
      ['Bir kenar daha', '4 kenar, 4 köşe: dörtgen. Köşe sayısı kenar sayısına eşittir.', S('polygon',{n:4})],
      ['Beşe ulaş', '5 kenar ve 5 köşe: beşgen. Komşu olmayan köşeleri birleştiren parça köşegendir.', S('polygon',{n:5})]], 'Altıgenin kaç köşesi vardır?', '6 köşesi vardır.'],
    ucgen: ['Üç açının takımı', [
      ['İlk açıyı seç', 'Bir üçgenin bir açısı 60° olsun.', angle(60)],
      ['İkinci açıyı ekle', 'İkinci açı da 60°. İki açının toplamı 120° oldu.', cards(['60°','+ 60°','= 120°'],1)],
      ['180°ye tamamla', 'Üçgenin iç açıları toplamı 180°dir. Üçüncü açı: 180° − 120° = 60°.', cards(['180°','− 120°','= 60°'],2)]], 'Bir üçgende iki dik açı olabilir mi?', 'Olamaz. İki dik açı zaten 180° eder; üçüncü açıya yer kalmaz.'],
    insa: ['Pergelle üçgen kur', [
      ['Tabanı çiz', 'Önce iki köşeyi belirleyip bir doğru parçası çiz.', S('segment')],
      ['Yayları çiz', 'Pergeli taban uzunluğu kadar aç. İki uç merkez olacak şekilde eş yarıçaplı çemberler çiz.', S('construct',{mode:'equilateral'})],
      ['Kesişimi birleştir', 'Çemberlerin kesişimini tabanın uçlarıyla birleştir. Üç kenarı da eşit bir üçgen oluşur.', S('polygon',{n:3})]], 'Bu eşkenar üçgenin her açısı kaç derecedir?', '180° ÷ 3 = 60°.'],
    okuma: ['Sayıyı üçlü paketle', [
      ['Sağdan grupla', '12 345 678 sayısını sağdan üçlü bölüklere ayır.', cards(['12','345','678'],0)],
      ['Bölüklere ad ver', 'Soldan sağa: milyonlar, binler, birler bölüğü.', S('place',{digits:'12345678'})],
      ['Birlikte oku', 'On iki milyon, üç yüz kırk beş bin, altı yüz yetmiş sekiz.', cards(['12 milyon','345 bin','678'],2)]], '12 000 678 okunurken sıfır olan bölük söylenir mi?', 'Hayır: on iki milyon altı yüz yetmiş sekiz.'],
    basamak: ['Aynı rakam, farklı değer', [
      ['Birler evinde', '3 rakamı birler basamağında 3 değerindedir.', S('place',{digits:'3'})],
      ['Bir ev sola', '30 sayısında 3, onlar basamağındadır: 3 × 10 = 30.', S('place',{digits:'30'})],
      ['Bir ev daha sola', '300 sayısında 3 yüzler basamağındadır: 3 × 100 = 300.', S('place',{digits:'300'})]], '3 rakamının rakam değeri değişti mi?', 'Hayır, rakam değeri hep 3. Basamak değeri bulunduğu yere göre değişti.'],
    sirala: ['İlk farkı yakala', [
      ['Basamakları say', '4 205 ve 4 250 dört basamaklıdır. En soldan karşılaştır.', cards(['4 205','4 250'],0)],
      ['Eşitleri geç', 'Binler 4, yüzler 2: eşit. Onlarda ilk fark var: 0 ve 5.', S('place',{digits:'4250'})],
      ['Karar ver', '0 < 5 olduğu için 4 205 < 4 250. Birler basamağına bakmamıza gerek kalmadı.', cards(['4 205','<','4 250'],1)]], '9 999 mu, 10 000 mi büyük?', '10 000. Daha çok basamağı olan pozitif doğal sayı daha büyüktür.'],
    islem: ['Bir onluğu değiş tokuş et', [
      ['Toplanacakları ayır', '28 + 17 için onlar ve birleri ayrı düşün.', cards(['20 + 8','10 + 7'],0)],
      ['Birleri birleştir', '8 + 7 = 15 birlik. 10 birliği 1 onluk yap; 5 birlik kalsın.', cards(['15 birlik','1 onluk','5 birlik'],1)],
      ['Onlukları topla', '2 onluk + 1 onluk + eldeki 1 onluk = 4 onluk. Sonuç 45.', S('place',{digits:'45'})]], '35 + 18 kaçtır?', '5 + 8 = 13; 3 + 1 + 1 = 5 onluk. Sonuç 53.'],
    carpan: ['Sıralardan çarpıma', [
      ['Bir sıra kur', 'Bir sıraya 4 kare yerleştir.', grid(4,1)],
      ['Üç sıra yap', 'Aynı sıradan 3 tane: 4 + 4 + 4 = 12.', grid(4,3)],
      ['Yer değiştir', '3 sıra 4 kare ile 4 sıra 3 kare aynı sayıda kare içerir. 3 × 4 = 4 × 3.', grid(3,4)]], '12 kareyi 3 eş gruba ayırırsak her grupta kaç kare olur?', '12 ÷ 3 = 4 kare.'],
    problem: ['Alışverişi resimle', [
      ['Verileni bul', '3 defter alıyorsun. Her biri 20 TL. Yanında 100 TL var.', cards(['20 TL','20 TL','20 TL'],0)],
      ['Önce tutarı hesapla', '3 × 20 = 60 TL ödersin. Bu, bütün defterlerin fiyatı.', cards(['3 defter','× 20 TL','= 60 TL'],2)],
      ['Sonra kalanı bul', 'Başlangıç paran − harcadığın para: 100 − 60 = 40 TL kalır.', cards(['100 TL','− 60 TL','= 40 TL'],2)]], '4 defter alsaydın ne kadar paran kalırdı?', '4 × 20 = 80 TL; 100 − 80 = 20 TL.'],
    cevre: ['Bahçenin etrafında yürü', [
      ['Bahçeyi tanı', 'Dikdörtgen bahçenin uzun kenarı 4, kısa kenarı 3 birim.', grid(4,3)],
      ['Dört kenarı dolaş', 'Bir turda 4 + 3 + 4 + 3 birim yol yürürsün.', cards(['4 + 3','+ 4 + 3','= 14'],1)],
      ['Kısa yoldan hesapla', 'Karşılıklı kenarlar eşittir. Çevre = 2 × (4 + 3) = 14 birim.', cards(['4 + 3','= 7','2 × 7 = 14'],2)]], 'Çevre ölçerken içerideki kareleri mi sayarız?', 'Hayır. Çevre sınırın uzunluğudur; alan iç bölgenin büyüklüğüdür.'],
    alan: ['Zemini karelerle kapla', [
      ['Bir sırayı doldur', 'Bir sırada 4 birim kare var.', grid(4,1)],
      ['Üç sırayı doldur', 'Boşluk bırakmadan 3 sıra yap. Toplam 12 birim kare.', grid(4,3)],
      ['Çarparak say', 'Alan = sıra sayısı × bir sıradaki kare sayısı = 3 × 4 = 12 birim kare.', grid(4,3)]], 'Bir sıra daha eklersek alan kaç olur?', '4 × 4 = 16 birim kare.'],
    iliski: ['Aynı alan, başka çevre', [
      ['Uzun bir şekil kur', '6 × 2 = 12 birim kare. Çevre: 2 × (6 + 2) = 16 birim.', grid(6,2)],
      ['Kareleri yeniden diz', '4 × 3 = 12 birim kare. Çevre: 2 × (4 + 3) = 14 birim.', grid(4,3)],
      ['İkisini karşılaştır', 'Kare sayısı değişmedi; sınır uzunluğu değişti. Eşit alan, eşit çevre demek değildir.', S('pair',{left:{cols:6,rows:2,count:true},right:{cols:4,rows:3,count:true}})]], 'Alanları aynı olan iki dikdörtgenin çevreleri farklı olabilir mi?', 'Evet. Örneğimizde alanlar 12; çevreler 16 ve 14 birim.']
  };
  for (const topic of root.MatCurriculum.topics) {
    const [title, frames, ask, answer] = stories[topic.id];
    topic.slides.unshift(...frames.map(([h,p,scene],i) => ({h,p,scene,story:title,storyStep:i,check:i===2?{ask,answer}:null})));
  }
})(typeof window !== 'undefined' ? window : globalThis);
