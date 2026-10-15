(function (root) {
  const worlds = [
    { id: 1, name: "Geometri Diyarı", color: "#2c6bed", blurb: "Şekil, açı ve çizim" },
    { id: 2, name: "Sayı Kulesi", color: "#e07a2f", blurb: "Okuma, işlem, problem" },
    { id: 3, name: "Ölçü Şehri", color: "#1c8c74", blurb: "Çevre ve alan" }
  ];

  const topics = [
    {
      id: "nokta", no: "01", worldId: 1, title: "Nokta, doğru parçası, ışın, doğru",
      slides: [
        { h: "Nokta", p: "Kalemini kâğıda bir kez dokundurup kaldır. Kalan iz bir noktadır. Noktanın eni, boyu ve kalınlığı yoktur. Noktaları büyük harfle adlandırırız: A noktası.", scene: { kind: "point" } },
        { h: "Doğru parçası", p: "İki noktanın arasını hiç boşluk kalmadan doldurursan doğru parçası oluşur. İki ucu da bellidir. [AB] diye gösterilir. Uzunluğu ölçülebilir: |AB| = 5 cm.", scene: { kind: "segment" } },
        { h: "Işın", p: "Bir noktadan başlar, bir yöne doğru sonsuza gider. Başlangıcı vardır, bitişi yoktur. Bu yüzden ışının uzunluğu ölçülemez.", scene: { kind: "ray" } },
        { h: "Doğru", p: "İki ucu da sonsuza gider. Uzunluğu yoktur, ölçemeyiz. Üzerinde birim olmayan cetvele çizgeç denir. Günlük hayatta kalemin düz kenarını da çizgeç gibi kullanabilirsin.", scene: { kind: "line" } },
        { h: "Üçünü yan yana koy", p: "Doğru parçasının iki ucu bellidir, onu ölçeriz. Işının bir ucu, doğrunun ise iki ucu sonsuzdur. [AB] ile [BA] aynı doğru parçasıdır.", scene: { kind: "trio" } }
      ]
    },
    {
      id: "aci", no: "02", worldId: 1, title: "Açı",
      slides: [
        { h: "Açı nedir?", p: "Aynı noktadan çıkan iki ışın bir açı oluşturur. Bu ortak noktaya köşe, ışınlara da açının kolları denir. Açı, bir ışının ne kadar döndüğüdür.", scene: { kind: "angle", deg: 50 } },
        { h: "Dar, dik, geniş", p: "Kapı köşesi bize dik açıyı hatırlatır. Dik açıdan küçük olan dar, dik açıdan büyük olup doğru açıdan küçük olan geniştir.", scene: { kind: "life", id: "door" } },
        { h: "Adını koy", p: "Köşesi B olan açıya ∠ABC, ∠CBA ya da kısaca ∠B deriz. Ölçüsü m(∠ABC) = 45° biçiminde yazılır.", scene: { kind: "angle", deg: 45, show: true } },
        { h: "Kendin döndür", p: "Kırmızı ışını sürükle. Açı büyür ama köşe yerinde kalır. 90 derecede küçük kare işareti dik açıyı gösterir.", sandbox: "dial" }
      ]
    },
    {
      id: "cember", no: "03", worldId: 1, title: "Çember ve daire",
      slides: [
        { h: "Herkes eşit uzaklıkta", p: "Bir noktayı merkez seç. Ondan eşit uzaklıktaki noktalar bir çember çizer. Merkezdeki kişi öğretmen, çemberdeki kişiler öğrenciler gibi düşün.", scene: { kind: "circle", showDiameter: false, radiusLabel: "eşit uzaklık" } },
        { h: "Yarıçap ve çap", p: "Merkezden çembere giden doğru parçası yarıçaptır, r ile gösterilir. Merkezden geçip çemberi iki noktada kesen doğru parçası çaptır, R ile gösterilir. Çap, iki yarıçap eder: R = 2 × r.", scene: { kind: "circle" } },
        { h: "Çember mi, daire mi?", p: "Çember yalnızca kenar çizgisidir: yüzük, hulahop. Daire, çemberin içiyle birlikte tüm bölgedir: bozuk paranın yüzü, yuvarlak masanın tablası.", scene: { kind: "disk" } },
        { h: "Pergeli oyna", p: "Pergelin sivri ucu merkezdir. Açıklığı yarıçap kadardır. Kaydırıcıyı oynat, çember büyüsün, çapın da iki kat olduğunu gör.", sandbox: "circle" }
      ]
    },
    {
      id: "dikme", no: "04", worldId: 1, title: "Dikme ve düzlem",
      slides: [
        { h: "En kısa yol", p: "Bir noktadan bir doğruya inen en kısa yol dikmedir. Çatıdan yere inen borulardan en kısası, zemine dik olandır.", scene: { kind: "perp" } },
        { h: "Diklik işareti", p: "Diklik ⊥ işaretiyle yazılır. [AB] ⊥ d okunuşu: AB doğru parçası, d doğrusuna diktir. Dikme çizmek için gönye kullanılır.", scene: { kind: "formula", lines: ["[AB] ⊥ d", "Bir noktadan bir doğruya yalnız bir dikme iner."] } },
        { h: "Düzlem", p: "Noktayı, doğruyu ve açıyı üzerine çizdiğin masa, tahta, kâğıt birer düzlem modelidir. Düzlemin kenarı ve kalınlığı yoktur, her yöne sonsuz uzanır.", scene: { kind: "life", id: "rug" } }
      ]
    },
    {
      id: "paralel", no: "05", worldId: 1, title: "Paralel doğrular ve çizim kuralları",
      slides: [
        { h: "Hiç kesişmeyenler", p: "Aynı düzlemde kesişmeyen doğrular paraleldir. Aralarındaki uzaklık değişmez. Tren rayları ve elektrik telleri paralel doğrulara örnektir.", scene: { kind: "life", id: "rails" } },
        { h: "Nasıl yazılır?", p: "Paralellik // işaretiyle gösterilir. AB // CD şöyle okunur: AB doğrusu, CD doğrusuna paraleldir.", scene: { kind: "parallel" } },
        { h: "Noktadan kaç doğru geçer?", p: "Bir noktadan sonsuz tane doğru geçer. İki noktadan ise yalnız bir doğru geçer. İki nokta arasındaki en kısa yol, bu doğru parçasıdır.", scene: { kind: "formula", lines: ["1 nokta → sonsuz doğru", "2 nokta → tam 1 doğru", "Doğruya dışındaki bir noktadan 1 dikme"] } }
      ]
    },
    {
      id: "olcme", no: "06", worldId: 1, title: "Açı ölçme",
      slides: [
        { h: "Derece", p: "Bir tam dönüş 360 eş parçaya bölünür. Her parçaya 1 derece denir ve ° ile yazılır. Tam açı 360°, doğru açı 180°, dik açı 90° dir.", scene: { kind: "formula", lines: ["Tam açı = 360°", "Doğru açı = 180°", "Dik açı = 90°"] } },
        { h: "Açıölçer", p: "Açının köşesini açıölçerin merkezine koy. Bir kolu 0 çizgisine getir. Diğer kolun gösterdiği sayı, açının ölçüsüdür. Kollar uzasa da ölçü değişmez.", scene: { kind: "angle", deg: 60, show: true } },
        { h: "Eş açılar", p: "Ölçüleri eşit olan açılara eş açılar denir. 40° ile yine 40° olan başka bir açı eştir.", scene: { kind: "formula", lines: ["Dar açı: 0° ile 90° arası", "Dik açı: tam 90°", "Geniş açı: 90° ile 180° arası"] } },
        { h: "Açıölçeri kullan", p: "Işını sürükleyip tam 90 dereceye getirmeyi dene. Sonra 30, 120 ve 180 de dene.", sandbox: "dial" }
      ]
    },
    {
      id: "durum", no: "07", worldId: 1, title: "Doğruların durumları",
      slides: [
        { h: "Kesişen doğrular", p: "Düzlemde tek ortak noktası olan doğrular kesişir. Kesişince ya iki dar ve iki geniş açı oluşur ya da dört dik açı oluşur. Yan yana duran iki açının toplamı 180° dir.", scene: { kind: "intersect" } },
        { h: "Paralel ve çakışık", p: "Paralel doğruların ortak noktası yoktur, açı oluşturmazlar. Çakışık doğrular ise üst üste durur, bütün noktaları ortaktır.", scene: { kind: "coincident" } },
        { h: "Üç doğru", p: "Üç doğru birbirine paralel olabilir, tek noktada kesişebilir ya da ikişer ikişer kesişebilir. İki paralel doğruyu kesen üçüncü doğruya kesen denir.", scene: { kind: "transversal" } }
      ]
    },
    {
      id: "cift", no: "08", worldId: 1, title: "Ters, tümler ve bütünler açılar",
      slides: [
        { h: "Ters açılar", p: "Kesişen doğrularda birbirine zıt bakan açılara ters açılar denir. Ters açıların ölçüleri eşittir.", scene: { kind: "intersect" } },
        { h: "Komşu açılar", p: "Köşeleri ve bir kolları ortak olan, diğer kolları ise ortak kolun iki yanında duran açılar komşudur.", scene: { kind: "angle", deg: 130, show: true } },
        { h: "Tümler ve bütünler", p: "Toplamı 90° olan açılar tümlerdir. 30° nin tümleri 60° dir. Toplamı 180° olan açılar bütünlerdir. 30° nin bütünleri 150° dir.", scene: { kind: "formula", lines: ["Tümler: toplam 90°", "Bütünler: toplam 180°", "Ters açılar eşittir"] } }
      ]
    },
    {
      id: "cokgen", no: "09", worldId: 1, title: "Çokgenler",
      slides: [
        { h: "Kapalı şekil", p: "En az üç doğru, ilki sonuncusuyla kavuşacak biçimde kesişirse çokgen oluşur. Kenar sayısına göre adlandırırız: üçgen, dörtgen, beşgen, altıgen.", scene: { kind: "polygon", n: 5 } },
        { h: "Kenar, köşe, açı", p: "Köşeler, doğruların kesiştiği noktalardır. Kenar sayısı, köşe sayısı ve iç açı sayısı birbirine eşittir. Bir iç açının komşu bütünlerine dış açı denir.", scene: { kind: "polygon", n: 4 } },
        { h: "Düzgün çokgen", p: "Bütün kenarları ve bütün iç açıları eşitse çokgen düzgündür. Eşkenar üçgen ve kare düzgün çokgendir. Dikdörtgenin açıları eşit olsa da kenarları her zaman eşit değildir.", scene: { kind: "polygon", n: 6 } },
        { h: "Köşegen", p: "Ardışık olmayan iki köşeyi birleştiren doğru parçasına köşegen denir. Üçgende ardışık olmayan köşe yoktur, bu yüzden üçgenin köşegeni yoktur. Dörtgende 2, beşgende 5 köşegen vardır.", scene: { kind: "formula", lines: ["Üçgen: 0 köşegen", "Dörtgen: 2 köşegen", "Beşgen: 5 köşegen"] } }
      ]
    },
    {
      id: "ucgen", no: "10", worldId: 1, title: "Üçgenler",
      slides: [
        { h: "Açılarına göre", p: "Tüm açıları dar ise dar açılı üçgendir. Bir açısı 90° ise dik üçgendir. Bir açısı geniş ise geniş açılı üçgendir. Bir üçgende iki dik ya da iki geniş açı birden bulunamaz.", scene: { kind: "triangles" } },
        { h: "İç açılar toplamı", p: "Hangi üçgeni kesip köşelerini yan yana getirirsen getir, üç iç açı bir doğru açı eder. Üçgenin iç açıları toplamı her zaman 180° dir.", scene: { kind: "formula", lines: ["İç açılar toplamı = 180°", "Eksik açı = 180° − diğer ikisi"] } },
        { h: "Kenarlarına göre", p: "Üç kenarı da eşitse eşkenar, tam iki kenarı eşitse ikizkenar, üç kenarı da farklıysa çeşitkenardır. Eşkenar üçgenin her açısı 60° dir. İkizkenarda eşit kenarların gördüğü açılar da eşittir.", scene: { kind: "construct", mode: "equilateral" } }
      ]
    },
    {
      id: "insa", no: "11", worldId: 1, title: "Üçgen inşası",
      slides: [
        { h: "İnşa etmek", p: "Yalnızca pergel ve ölçüsüz cetvelle bir şekli kurmaya inşa etmek denir. Ölçü okumayız, eşitlikleri pergelin açıklığından anlarız.", scene: { kind: "circle", showDiameter: false } },
        { h: "Eşkenar", p: "Yarıçapları eşit iki çember, her biri diğerinin merkezinden geçecek biçimde kesişirse merkezler ve kesişim noktası eşkenar üçgen olur. Üç kenar da yarıçapa eşittir.", scene: { kind: "construct", mode: "equilateral" } },
        { h: "İkizkenar ve çeşitkenar", p: "İki noktada kesişen çemberlerin yarıçapları eşitse oluşan üçgenin iki kenarı eşittir. Merkezler arası uzaklık da yarıçapa eşitse eşkenar olur. Yarıçaplar farklı olsa bile merkezler arası uzaklık bir yarıçapa eşitse ikizkenar olabilir; üç uzunluk da farklıysa çeşitkenardır.", scene: { kind: "construct", mode: "scalene" } },
        { h: "Öklid'in üç kuralı", p: "İki nokta arasına doğru parçası çizilir. Doğru parçası istenildiği kadar uzatılır. Bir nokta merkez, bir uzunluk yarıçap alınarak çember çizilir.", scene: { kind: "formula", lines: ["1. İki nokta → doğru parçası", "2. Parçayı uzat", "3. Merkez ve yarıçap → çember"] } }
      ]
    },
    {
      id: "okuma", no: "12", worldId: 2, title: "Çok basamaklı sayıları okuma ve yazma",
      slides: [
        { h: "Bölükler", p: "Rakamları sağdan üçer üçer ayırırız. Sağdaki birler bölüğü, sonra binler, milyonlar ve milyarlar bölüğü gelir. Birler bölüğünün adını okurken söylemeyiz.", scene: { kind: "place", digits: "149597890" } },
        { h: "Nasıl okunur?", p: "149 597 890 sayısı yüz kırk dokuz milyon beş yüz doksan yedi bin sekiz yüz doksandır. Her bölüğü kendi içinde okur, sonra bölüğün adını söyleriz.", scene: { kind: "formula", lines: ["149 | 597 | 890", "milyonlar · binler · birler"] } },
        { h: "Sıfırın yeri", p: "7 005 sayısı yedi bin beş diye okunur. Aradaki sıfırlar basamağı boş bırakır ama sayının büyüklüğünü korur. Baştaki sıfır yazılmaz.", scene: { kind: "place", digits: "7005" } },
        { h: "Sen yaz, Anka okusun", p: "Rakamları tuşla. Hem okunuşunu hem basamak tablosunu göreceksin. Milyarlar bölüğüne kadar dene.", sandbox: "read" }
      ]
    },
    {
      id: "basamak", no: "13", worldId: 2, title: "Basamak değeri ve çözümleme",
      slides: [
        { h: "Basamak değeri", p: "Bir rakamın değeri, bulunduğu basamağa göre değişir. 3 452 sayısında 4, yüzler basamağındadır ve değeri 400 dür. Basamak değeri = rakam × basamağın değeri.", scene: { kind: "place", digits: "3452" } },
        { h: "Çözümleme", p: "Sayıyı basamak değerlerinin toplamı olarak yazmaya çözümleme denir. 2 140 503 = 2 000 000 + 100 000 + 40 000 + 500 + 3.", scene: { kind: "formula", lines: ["2 140 503", "= 2 000 000 + 100 000 + 40 000 + 500 + 3"] } },
        { h: "Toplam kendisidir", p: "Bir sayının bütün basamak değerlerini toplarsan yine o sayıyı bulursun. Sıfırın basamak değeri de sıfırdır, toplama etki etmez.", scene: { kind: "place", digits: "5080" } },
        { h: "Tabloda gör", p: "Bir sayı yaz. Her kutunun altındaki sayı, o rakamın basamak değeridir.", sandbox: "read" }
      ]
    },
    {
      id: "sirala", no: "14", worldId: 2, title: "Karşılaştırma ve sıralama",
      slides: [
        { h: "Önce basamak sayısı", p: "Basamak sayısı fazla olan doğal sayı daha büyüktür. 1 000 000, beş basamaklı her sayıdan büyüktür.", scene: { kind: "formula", lines: ["999 999 < 1 000 000", "Önce kaç basamak olduğuna bak"] } },
        { h: "Soldan ilk fark", p: "Basamak sayıları eşitse en soldaki rakamdan başlarız. İlk farklı rakamı büyük olan sayı daha büyüktür. 4 446 803 ile 4 200 000 sayısında milyonlar aynı, yüz binler basamağında 4 daha büyüktür.", scene: { kind: "formula", lines: ["4 446 803 > 4 200 000", "Çünkü 4 yüz bin > 2 yüz bin"] } },
        { h: "İşaretler", p: "Büyük olan tarafa açılan işaret > dir. 13 > 9 okunuşu: 13 büyüktür 9 dan. Küçük olan tarafa açılan işaret < dir.", scene: { kind: "formula", lines: ["78 005 456 > 77 500 654", "12 999 999 < 13 000 000"] } }
      ]
    },
    {
      id: "islem", no: "15", worldId: 2, title: "Toplama ve çıkarma",
      slides: [
        { h: "Önce tahmin", p: "İşleme başlamadan sonucu yuvarlayarak tahmin et. Sonra gerçek sonucu bul ve tahmininle karşılaştır. Tahmin, hesabı kontrol etmenin yoludur.", scene: { kind: "formula", lines: ["175 + 88 ≈ 180 + 90 = 270", "Gerçek: 263"] } },
        { h: "Eksik toplanan", p: "12 414 + ? = 21 213 ise soru işareti, toplamdan bilinen toplananı çıkarınca bulunur. 21 213 − 12 414 = 8 799.", scene: { kind: "formula", lines: ["toplam − toplanan = diğer toplanan", "eksilen − fark = çıkan", "eksilen − çıkan = fark"] } },
        { h: "Kısa yol", p: "Dört sayıyı tek tek bir tavandan çıkarmak yerine önce dördünü topla, sonra tavandan bir kez çıkar. Aynı sonucu daha kısa yoldan bulursun.", scene: { kind: "formula", lines: ["Önce verilenleri topla", "Sonra istenenden çıkar"] } }
      ]
    },
    {
      id: "carpan", no: "16", worldId: 2, title: "Çarpma ve bölme",
      slides: [
        { h: "Sıfırları kaydır", p: "32 × 20 = 640, 32 × 200 = 6 400, 32 × 2 000 = 64 000. Önce sıfırsız çarp, çarpanlardaki sıfırları sona ekle.", scene: { kind: "formula", lines: ["32 × 3 = 96", "32 × 300 = 9 600", "320 × 300 = 96 000"] } },
        { h: "Bölmede de", p: "6 000 ÷ 20 = 300, 6 000 ÷ 300 = 20. Bölünen ve bölendeki ortak sıfırlar birbirini götürür. Önce sadeleştir, sonra böl.", scene: { kind: "formula", lines: ["48 000 ÷ 20 = 2 400", "48 000 ÷ 300 = 160"] } },
        { h: "Eksik çarpan, yukarı yuvarla", p: "75 × ? = 7 500 ise 7 500 ÷ 75 yapılır. Kişi sayısı kabine tam sığmıyorsa bir sefer daha gerekir. 250 kişi, kabin 11 kişilikse 22 sefer yetmez, 23 sefer gerekir.", scene: { kind: "formula", lines: ["çarpım ÷ çarpan = diğer çarpan", "Kalan varsa bölümü bir artır"] } }
      ]
    },
    {
      id: "problem", no: "17", worldId: 2, title: "Gerçek yaşam problemleri",
      slides: [
        { h: "Dört adım", p: "Probleme şöyle yaklaş: Verilen ne? İstenen ne? Hangi işlem gerekir? Sonuç akla yatkın mı? Kitap bunu on küçük adıma ayırır, özü bu dörtlüdür.", scene: { kind: "formula", lines: ["1. Verilen", "2. İstenen", "3. İşlem", "4. Kontrol"] } },
        { h: "Tabloyu oku", p: "Satır satır bak. Toplam isteniyorsa topla. Fark isteniyorsa çıkar. Birimlere dikkat et: TL, km, kg, kişi.", scene: { kind: "formula", lines: ["Artış = sonraki − önceki", "Kalan = başlangıç − harcanan"] } },
        { h: "En fazla, en az", p: "En fazla ürün soruluyorsa kalan parayı en ucuz ürüne böl. Tam sığmayan kişide sefer sayısını yukarı yuvarla. Her zaman birimi yeniden oku.", scene: { kind: "formula", lines: ["Kalan para ÷ en ucuz fiyat", "Kişi ÷ kapasite, kalan varsa +1"] } }
      ]
    },
    {
      id: "cevre", no: "18", worldId: 3, title: "Dikdörtgenin çevresi",
      slides: [
        { h: "Çerçeve", p: "Çevre, şeklin kenarlarının toplamıdır. Dikdörtgende karşılıklı kenarlar eşittir. Çevre = 2 × (uzun kenar + kısa kenar).", scene: { kind: "grid", cols: 6, rows: 3, cap: "6 cm ve 3 cm → çevre 18 cm" } },
        { h: "Aynı çevre, farklı dikdörtgen", p: "Çevresi 16 cm olan birden fazla dikdörtgen çizilir: 1 ve 7, 2 ve 6, 3 ve 5, 4 ve 4. Kare de bir dikdörtgendir. Ama çevresi 16 cm olan ikinci bir kare çizilemez.", scene: { kind: "formula", lines: ["Çevre = 2 × (a + b)", "Kare: dört kenar da eşit"] } },
        { h: "Tek sayı olmaz", p: "Kenarlar santimetre cinsinden doğal sayıysa çevre hep çift sayıdır. Çünkü iki ile çarpıyoruz. Çevresi 15 cm olan böyle bir dikdörtgen çizilemez.", scene: { kind: "formula", lines: ["2 × (a + b) her zaman çifttir"] } },
        { h: "Kenarları oynat", p: "Kaydırıcılarla dikdörtgen kur. Çevre sayısının nasıl değiştiğini izle.", sandbox: "rect" }
      ]
    },
    {
      id: "alan", no: "19", worldId: 3, title: "Dikdörtgenin alanı",
      slides: [
        { h: "Birim kareler", p: "Alan, yüzeyi boşluk kalmadan ve üst üste binmeden kaplayan birim kare sayısıdır. Satırdaki kare sayısı ile sütundaki kare sayısı çarpılır.", scene: { kind: "grid", cols: 5, rows: 3, count: true, cap: "5 × 3 = 15 birim kare" } },
        { h: "Kısa yol", p: "Kareleri tek tek saymak yerine iki komşu kenarı çarp. Alan = a × b. Bir kenar 7 m, alan 84 m² ise diğer kenar 84 ÷ 7 = 12 m dir.", scene: { kind: "formula", lines: ["Alan = a × b", "Eksik kenar = alan ÷ bilinen kenar"] } },
        { h: "Neden kare kaplar?", p: "Birim kareler boşluk bırakmadan ve üst üste binmeden döşenir. Alanı bu kareleri sayarak ölçeriz. Dairelerle ve düzgün beşgenlerle tek başına boşluksuz döşeme yapılamaz. Kare ve dikdörtgen fayanslar bu yüzden kullanışlıdır.", scene: { kind: "life", id: "rug" } },
        { h: "Alanı izle", p: "Kenarları değiştir. Alanın çarpım olarak nasıl arttığını gör.", sandbox: "rect" }
      ]
    },
    {
      id: "iliski", no: "20", worldId: 3, title: "Çevre ve alan ilişkisi",
      slides: [
        { h: "Aynı alan, başka çevre", p: "Alanı 24 m² olan halı 4 m ve 6 m olabilir, çevresi 20 m dir. 2 m ve 12 m de 24 m² eder ama çevresi 28 m dir. Alan eşit diye çevre eşit olmak zorunda değildir.", scene: { kind: "pair", left: { cols: 6, rows: 4, cap: "4×6 · çevre 20" }, right: { cols: 12, rows: 2, cap: "2×12 · çevre 28" } } },
        { h: "Aynı çevre, başka alan", p: "Çevresi 20 m olan dikdörtgenlerin alanları farklı olabilir. Kenarlar birbirine yaklaştıkça alan büyür. 5 m ve 5 m olan karede alan 25 m² dir.", scene: { kind: "formula", lines: ["Çevre 20 → en büyük alan 25", "Kenarlar yaklaşırsa alan büyür"] } },
        { h: "İkisi birden", p: "Hem alanı hem çevresi verilirse kenarlar sıkışır. Alanı 24, çevresi 20 olan dikdörtgenin kenarları 4 ve 6 dır.", scene: { kind: "formula", lines: ["4 × 6 = 24", "2 × (4 + 6) = 20"] } },
        { h: "Hedefi tuttur", p: "Kaydırıcılarla oyna. Çevre ile alanın aynı anda nasıl değiştiğine bak.", sandbox: "rect" }
      ]
    }
  ];

  root.MatCurriculum = { worlds, topics };
})(typeof window !== "undefined" ? window : globalThis);
