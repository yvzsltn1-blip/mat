/* Her konunun Anlat sekmesine öğretmen anlatımı, çözümlü örnek ve model ekler.
   Kitaptaki konu sırası kullanılır; cümleler kitaptan kopya değildir. */
(function (root) {
  "use strict";
  const ex = (ask, steps, result) => ({ ask, steps, result });
  const lessons = {
    nokta: {
      h: "Anlat: Noktadan doğruya",
      paras: [
        "Nokta bir yeri işaretler. Kalemin kâğıda bir kez değip kalktığı iz gibi düşünülür: eni, boyu ve kalınlığı yok sayılır. Noktalara A, B, C gibi büyük harfler verilir.",
        "İki noktayı boşluk bırakmadan düz bir çizgiyle birleştirirsen doğru parçası oluşur. İki ucu bellidir, bu yüzden uzunluğu cetvelle ölçülür. [AB] ile [BA] aynı parçadır. Uzunluğu |AB| diye yazılır.",
        "Işın bir noktadan başlar ve bir yöne sonsuza gider; bitişi olmadığı için uzunluğu ölçülemez. Doğrunun ise iki ucu da sonsuzdur. Ok işareti, çizginin orada bitmediğini söyler."
      ],
      example: ex("A ile B arası 5 cm ölçülüyor. Bu uzunluk noktaya mı, ışına mı, doğru parçasına mı aittir?", [
        "Noktanın uzunluğu yoktur; 5 cm bir noktaya yazılamaz.",
        "Işının ve doğrunun bir ucu sonsuzdur. Cetvel tek bir uzunluk okuyamaz.",
        "İki ucu da belli olduğu için bu bir doğru parçasıdır: |AB| = 5 cm."
      ], "Ölçülen uzunluk doğru parçasına aittir."),
      sandbox: "im-line"
    },
    aci: {
      h: "Anlat: Açı nedir?",
      paras: [
        "Açı, aynı noktadan çıkan iki ışının arasındaki açıklıktır. Ortak noktaya köşe, ışınlara kol denir. Kollar uzasa da açı değişmez; değişen, kolların ne kadar döndüğüdür.",
        "Kapının menteşesi köşe, kapının kendisi bir kol gibi düşünülebilir. Kapı az aralanırsa dar açı, tam köşe gibi 90° olursa dik açı, daha da açılırsa geniş açı görülür.",
        "Açı adlandırılırken köşe harfi ortaya yazılır: ∠ABC. Ölçüsü m(∠ABC) = 45° biçiminde okunur. Küçük kare işareti, açının dik olduğunu gösterir."
      ],
      example: ex("Köşesi B, kolları BA ve BC olan açı 45°. Bu açı hangi türdedir?", [
        "Köşe B olduğu için açıya ∠ABC ya da kısaca ∠B denir.",
        "45°, 0° ile 90° arasındadır.",
        "Dik açı tam 90° olduğu için 45° ondan küçüktür."
      ], "Dar açıdır. Ölçüsü m(∠ABC) = 45°."),
      sandbox: "dial",
      sandboxDeg: 45
    },
    cember: {
      h: "Anlat: Çember ve daire",
      paras: [
        "Bir noktayı merkez seç. Bu merkeze eşit uzaklıktaki bütün noktalar bir çember çizer. Pergelin sivri ucu merkez, açıklığı yarıçaptır. Yarıçap r ile gösterilir.",
        "Merkezden geçip çemberi iki noktada kesen doğru parçasına çap denir. Çap iki yarıçaptan oluşur: çap = 2 × r. Yarıçap 6 cm ise çap 12 cm’dir.",
        "Çember yalnız sınır çizgisidir; yüzük ve hulahop buna örnektir. Daire, çemberle birlikte iç bölgenin tamamıdır. Yuvarlak masanın tablası bir dairedir."
      ],
      example: ex("Yarıçap 6 cm ise çap kaç santimetredir?", [
        "Çap, merkezden geçen ve iki uçta çembere değen parçadır.",
        "Bu parça iki yarıçap uzunluğundadır.",
        "6 + 6 = 12."
      ], "Çap 12 cm’dir."),
      sandbox: "circle",
      sandboxR: 6
    },
    dikme: {
      h: "Anlat: En kısa yol",
      paras: [
        "Bir noktadan bir doğruya birçok yol inebilir. Bunların en kısası, doğruyu dik kesen yoldur. Çatıdan zemine inen borulardan en kısası da dik olandır.",
        "Dik kesişme 90° demektir. Küçük kare ile gösterilir ve [AB] ⊥ d biçiminde yazılır. Okunuşu: AB doğru parçası, d doğrusuna diktir.",
        "Bir noktadan bir doğruya yalnız bir dikme iner. Dikme çizmek için gönye kullanılır. Açı 90°den uzaklaştıkça aynı yüksekliğe inen yol uzar."
      ],
      example: ex("Kıyıya dik uzaklık 4 m. Kıyıya 30° ile inen yol mu, 90° ile inen yol mu daha kısadır?", [
        "90°lik yol, dik uzaklığa eşittir: 4 m.",
        "30°lik yol aynı yüksekliği daha yatık kat eder.",
        "4 ÷ sin 30° = 4 ÷ 0,5 = 8. Eğik yol 8 m’dir."
      ], "En kısa yol dikmedir: 4 m. 30°lik yol 8 m’dir."),
      sandbox: "im-dikme"
    },
    paralel: {
      h: "Anlat: Paralel doğrular",
      paras: [
        "Aynı düzlemde duran ve hiç kesişmeyen doğrulara paralel denir. Tren rayları ve yan yana giden elektrik telleri bunun modelleridir.",
        "Paraleller arasındaki dik uzaklık her yerde aynıdır. Biri diğerine yaklaşıp uzaklaşmaz.",
        "Paralellik // işaretiyle yazılır. AB // CD cümlesi, AB doğrusu CD doğrusuna paraleldir diye okunur. Onları kesen üçüncü bir doğru, paralellerin birbirini kestiği anlamına gelmez."
      ],
      example: ex("İki düz rayın arası bir yerde 140 cm, başka bir yerde de 140 cm. Raylar aynı düzlemde ve kesişmiyor. Ne söylenir?", [
        "Dik uzaklık değişmemiştir.",
        "Ortak noktaları yoktur.",
        "Bu, paralelliğin işaretidir."
      ], "Raylar paraleldir."),
      sandbox: "im-parallel"
    },
    olcme: {
      h: "Anlat: Derece ve açıölçer",
      paras: [
        "Bir tam dönüş 360 eş parçaya bölünür. Her parçaya 1 derece denir ve ° ile yazılır. Tam açı 360°, doğru açı 180°, dik açı 90°dir.",
        "Açıölçerde köşe merkeze konur, bir kol 0 çizgisine getirilir. Diğer kolun gösterdiği sayı açının ölçüsüdür. Kollar uzasa da bu sayı değişmez.",
        "0° ile 90° arası dar, tam 90° dik, 90° ile 180° arası geniştir. Ölçüleri eşit olan açılara eş açılar denir."
      ],
      example: ex("60°lik açı, dik açının kaçta kaçıdır? Dar açı mıdır?", [
        "Dik açı 90°dir.",
        "60 ÷ 90 = 2/3.",
        "60°, 90°den küçük olduğu için dar açıdır."
      ], "Dik açının 2/3’ü kadardır ve dar açıdır."),
      sandbox: "dial",
      sandboxDeg: 60
    },
    durum: {
      h: "Anlat: Doğruların durumu",
      paras: [
        "Düzlemdeki iki doğru üç durumda bulunabilir. Tek ortak noktaları varsa kesişirler. Kesişince dört dik açı ya da iki dar ve iki geniş açı oluşur. Yan yana duran iki açının toplamı 180°dir.",
        "Hiç ortak noktaları yoksa paraleldirler. Köşeleri buluşmadığı için açı oluşturmazlar.",
        "Bütün noktaları ortaksa çakışıktırlar. İki farklı doğru, iki ayrı noktada birden kesişemez: iki noktası ortaksa aynı doğrudurlar."
      ],
      example: ex("İki doğrunun yalnız bir ortak noktası var. Hangi durumdadırlar?", [
        "Ortak nokta olmasaydı paralel olurlardı.",
        "Bütün noktalar ortak olsaydı çakışık olurlardı.",
        "Tek ortak nokta, kesişme demektir."
      ], "Doğrular kesişir."),
      sandbox: "im-durum"
    },
    cift: {
      h: "Anlat: Tümler ve bütünler",
      paras: [
        "Kesişen doğrularda karşılıklı duran açılara ters açılar denir. Ters açıların ölçüleri eşittir. Köşeleri ve bir kolları ortak olan açılar ise komşu açılardır.",
        "Toplamı 90° olan açılara tümler, toplamı 180° olan açılara bütünler denir. 30°nin tümleri 60°, bütünleri 150°dir.",
        "Tümler ya da bütünler açıların yan yana durması şart değildir. Önemli olan toplamdır. Biri büyürse diğeri, toplam sabit kalacak biçimde küçülür."
      ],
      example: ex("35°lik açının tümleri ve bütünleri kaç derecedir?", [
        "Tümler için 90 − 35 hesaplanır.",
        "90 − 35 = 55.",
        "Bütünler için 180 − 35 = 145."
      ], "Tümleri 55°, bütünleri 145°dir."),
      sandbox: "pair",
      sandboxDeg: 35,
      playHint: "Turuncu açıyı gezdir. Önce 90° toplamında tümleri, sonra 180° toplamında bütünleri oku."
    },
    cokgen: {
      h: "Anlat: Çokgenler",
      paras: [
        "En az üç doğru parçası uç uca gelip kapanırsa çokgen oluşur. Üçgen, dörtgen, beşgen ve altıgen adlarını kenar sayılarından alır.",
        "Kenar sayısı, köşe sayısı ve iç açı sayısı birbirine eşittir. Ardışık olmayan iki köşeyi birleştiren parçaya köşegen denir. Üçgende böyle bir çift köşe yoktur; köşegeni de yoktur.",
        "Bütün kenarları ve bütün iç açıları eşitse çokgen düzgündür. n kenarlı bir çokgenin köşegen sayısı n × (n − 3) / 2 formülüyle bulunur."
      ],
      example: ex("Bir beşgenin kaç kenarı, kaç köşesi ve kaç köşegeni vardır?", [
        "Beşgenin 5 kenarı ve 5 köşesi vardır.",
        "Her köşeden, kendisi ve iki komşusu dışında 2 köşeye köşegen çizilir.",
        "5 × 2 = 10 eder; her köşegen iki kez sayıldığı için 10 ÷ 2 = 5."
      ], "5 kenar, 5 köşe ve 5 köşegen vardır."),
      sandbox: "im-polygon"
    },
    ucgen: {
      h: "Anlat: Üçgenin açıları",
      paras: [
        "Üçgenler açılarına göre adlandırılır. Bütün açıları dar ise dar açılı, bir açısı 90° ise dik, bir açısı geniş ise geniş açılıdır. Bir üçgende iki dik ya da iki geniş açı birden bulunamaz.",
        "Üç iç açı yan yana getirilirse bir doğru açı eder. Bu yüzden toplam her zaman 180°dir. İki açı biliniyorsa üçüncüsü 180’den çıkarılır.",
        "Üç kenarı eşitse eşkenar, yalnız iki kenarı eşitse ikizkenar, üçü de farklıysa çeşitkenardır. Eşkenar üçgenin her açısı 60°dir."
      ],
      example: ex("Bir üçgende iki açı 70° ve 60°. Üçüncü açı kaç derecedir?", [
        "İç açılar toplamı 180°dir.",
        "70 + 60 = 130.",
        "180 − 130 = 50. Üç açı da 90°den küçüktür."
      ], "Üçüncü açı 50°dir. Üçgen dar açılıdır."),
      sandbox: "im-triangle"
    },
    insa: {
      h: "Anlat: Pergelle inşa",
      paras: [
        "Yalnızca pergel ve ölçüsüz cetvelle bir şekli kurmaya inşa denir. Cetvelde sayı okunmaz; eşit uzunluklar pergelin aynı açıklığından anlaşılır.",
        "Eşkenar üçgen için önce taban çizilir. Pergel bu açıklıkta tutulur, iki uç merkez alınarak çemberler çizilir. Kesişim noktası her iki uca da taban kadar uzaktır.",
        "Öklid’in üç temel işi şunlardır: iki nokta arasına doğru parçası çizmek, doğru parçasını uzatmak, bir nokta merkez ve bir uzunluk yarıçap alınarak çember çizmek."
      ],
      example: ex("Taban 5 cm ve iki çemberin yarıçapı da 5 cm ise üçgen neden eşkenardır?", [
        "Merkezler arası uzaklık 5 cm’dir.",
        "Kesişim noktası da her merkeze 5 cm uzaklıktadır.",
        "Üç kenar eşit olduğu için her açı 180° ÷ 3 = 60°dir."
      ], "Üçgen eşkenardır ve her açısı 60°dir."),
      sandbox: "im-construct"
    },
    okuma: {
      h: "Anlat: Sayıyı okumak",
      paras: [
        "Çok basamaklı sayılar sağdan üçer üçer ayrılır. Bu gruplara bölük denir. Sağdan sola birler, binler, milyonlar ve milyarlar bölüğü gelir.",
        "Her bölük kendi içinde okunur, sonra bölüğün adı söylenir. Birler bölüğünün adı söylenmez. 149 597 890 sayısı yüz kırk dokuz milyon beş yüz doksan yedi bin sekiz yüz doksan diye okunur.",
        "Aradaki sıfırlar basamağı boş bırakır ama sayının büyüklüğünü korur. Tamamı sıfır olan bölüğün adı söylenmez. Sayının başındaki sıfır yazılmaz."
      ],
      example: ex("12 000 678 nasıl okunur?", [
        "Sağdan ayır: 12 | 000 | 678.",
        "Milyonlar bölüğü on iki milyondur.",
        "Binler bölüğü bütünüyle sıfır olduğu için bin denmez. Birler bölüğü altı yüz yetmiş sekizdir."
      ], "On iki milyon altı yüz yetmiş sekiz."),
      sandbox: "read",
      sandboxDigits: "12000678"
    },
    basamak: {
      h: "Anlat: Basamak değeri",
      paras: [
        "Bir rakamın kendisine rakam değeri, bulunduğu yere göre ettiği sayıya basamak değeri denir. 3 452 sayısındaki 4’ün rakam değeri 4, basamak değeri 4 × 100 = 400’dür.",
        "Sayıyı basamak değerlerinin toplamı olarak yazmaya çözümleme denir. 2 140 503 = 2 000 000 + 100 000 + 40 000 + 500 + 3.",
        "Bütün basamak değerleri toplanırsa sayının kendisi bulunur. Sıfırın basamak değeri sıfırdır; toplamı değiştirmez ama yanındaki rakamların yerini korur."
      ],
      example: ex("5 080 sayısında 5 ve 8’in basamak değerleri nedir?", [
        "5 binler basamağındadır: 5 × 1 000 = 5 000.",
        "8 onlar basamağındadır: 8 × 10 = 80.",
        "Yüzler basamağındaki 0, değeri 0 olan bir yer tutar. 5 000 + 80 = 5 080."
      ], "5’in basamak değeri 5 000, 8’in basamak değeri 80’dir."),
      sandbox: "read",
      sandboxDigits: "5080"
    },
    sirala: {
      h: "Anlat: Sayıları sıralamak",
      paras: [
        "İki doğal sayıyı karşılaştırırken önce basamak sayısına bakılır. Basamak sayısı fazla olan daha büyüktür. 1 000, üç basamaklı her sayıdan büyüktür.",
        "Basamak sayıları eşitse en soldaki rakamdan başlanır. İlk farklı rakamı büyük olan sayı daha büyüktür. Solda fark görüldükten sonra sağdaki rakamlara bakılmaz.",
        "Büyük olan tarafa açılan işaret > , küçük olan tarafa açılan işaret < dir. 13 > 9 cümlesi, 13, 9’dan büyüktür diye okunur."
      ],
      example: ex("4 205 ile 4 250 sayılarından hangisi büyüktür?", [
        "İkisi de dört basamaklıdır.",
        "Binler basamağı 4 ve yüzler basamağı 2 eşittir.",
        "Onlar basamağında 0 < 5. İlk fark buradadır."
      ], "4 205, 4 250’den küçüktür."),
      sandbox: "im-compare5"
    },
    islem: {
      h: "Anlat: Toplama ve çıkarma",
      paras: [
        "İşleme başlamadan sonuç yuvarlanarak tahmin edilir. Tahmin, işlem bitince hesabı kontrol etmenin yoludur. 175 + 88 yaklaşık 180 + 90 = 270’tir; gerçek sonuç 263’tür.",
        "Birler basamağı 9’u aşarsa 10 birlik, 1 onluk olur ve bu onluk bir sonraki basamağa elenir. Çıkarmada birler yetmezse bir onluk 10 birliğe bozulur.",
        "Eksik toplanan, toplamdan bilinen toplanan çıkarılarak bulunur. Eksilen ile farkın farkı çıkanı, eksilen ile çıkanın farkı da farkı verir."
      ],
      example: ex("28 + 17 işlemini basamak basamak yap.", [
        "Birler: 8 + 7 = 15. Bu, 1 onluk ve 5 birliktir.",
        "Onlar: 2 + 1 = 3, eldeki 1 onlukla birlikte 4 onluk eder.",
        "Tahmin 30 + 20 = 50’dir. 45, tahmine yakındır."
      ], "28 + 17 = 45."),
      sandbox: "im-add"
    },
    carpan: {
      h: "Anlat: Çarpma ve bölme",
      paras: [
        "Çarpma, eşit grupların toplamıdır. 4 kareden 3 sıra, 4 + 4 + 4 = 12 eder. Sıra ile sütunun yerini değiştirmek sonucu değiştirmez: 3 × 4 = 4 × 3.",
        "Sıfırla çarpmada önce sıfırsız çarpılır, sonra çarpanlardaki sıfırlar sona yazılır. 32 × 3 = 96 ise 32 × 300 = 9 600’dür.",
        "Bölme, çarpmanın tersidir. Ortak sıfırlar sadeleşebilir. Kişi sayısı kabine tam sığmıyorsa sefer sayısı bir artırılır; kalan kişiler için bir sefer daha gerekir."
      ],
      example: ex("3 sırada, her sırada 4 kare varsa kaç kare olur? 12 kare 3 eş gruba ayrılırsa her grupta kaç kare kalır?", [
        "3 × 4 = 12 kare.",
        "Aynı 12 kareyi 3 eş gruba ayırmak bölmedir.",
        "12 ÷ 3 = 4."
      ], "Çarpım 12’dir. Her grupta 4 kare vardır."),
      sandbox: "im-mul"
    },
    problem: {
      h: "Anlat: Problemi çözmek",
      paras: [
        "Bir problemde dört soru sorulur: Verilen ne? İstenen ne? Hangi işlem gerekir? Sonuç akla yatkın mı? TL, km, kg ve kişi gibi birimler baştan sona aynı tutulur.",
        "Toplam isteniyorsa toplanır, fark isteniyorsa çıkarılır, eşit grup varsa çarpılır ya da bölünür. Artış, sonraki değerden önceki değerin çıkarılmasıdır. Kalan, başlangıçtan harcananın çıkarılmasıdır.",
        "En fazla kaç tane alınır sorusunda para, bir tanenin fiyatına bölünür. Kalan kişi bir kabine sığmıyorsa sefer sayısı yukarı yuvarlanır."
      ],
      example: ex("Tanesi 20 TL olan 3 defter alınıyor. Elde 100 TL var. Ne kadar para kalır?", [
        "Verilen: 3 defter, tanesi 20 TL, elde 100 TL. İstenen: kalan para.",
        "Önce tutar bulunur: 3 × 20 = 60 TL.",
        "Sonra kalan bulunur: 100 − 60 = 40 TL."
      ], "40 TL kalır."),
      sandbox: "im-shop"
    },
    cevre: {
      h: "Anlat: Çevre",
      paras: [
        "Çevre, şeklin sınırının uzunluğudur. İçindeki kareler sayılmaz. Dikdörtgende karşılıklı kenarlar eşittir; çevre = 2 × (uzun kenar + kısa kenar).",
        "Aynı çevreye sahip birden çok dikdörtgen çizilebilir. Çevresi 16 cm olan kenarlar 1 ve 7, 2 ve 6, 3 ve 5 ya da 4 ve 4 olabilir. Kare de bir dikdörtgendir.",
        "Kenarlar santimetre cinsinden doğal sayıysa çevre hep çift sayıdır. Çünkü toplam 2 ile çarpılır. Çevresi 15 cm olan böyle bir dikdörtgen çizilemez."
      ],
      example: ex("Kenarları 6 cm ve 3 cm olan dikdörtgenin çevresi kaç santimetredir?", [
        "Karşılıklı kenarlar da 6 cm ve 3 cm’dir.",
        "6 + 3 + 6 + 3 = 18.",
        "Kısa yol: 2 × (6 + 3) = 18."
      ], "Çevre 18 cm’dir."),
      sandbox: "rect",
      sandboxW: 6,
      sandboxH: 3
    },
    alan: {
      h: "Anlat: Alan",
      paras: [
        "Alan, bir yüzeyi boşluk bırakmadan ve üst üste bindirmeden kaplayan birim kare sayısıdır. Bir sıradaki kare sayısı ile sıra sayısı çarpılır.",
        "Kareleri tek tek saymak yerine komşu iki kenar çarpılır: alan = a × b. Bir kenar ve alan biliniyorsa diğer kenar, alanın bilinen kenara bölünmesiyle bulunur.",
        "Birim kareler boşluksuz döşendiği için alanı saymak kolaydır. Daireler ve düzgün beşgenler tek başlarına boşluksuz döşeme yapamaz."
      ],
      example: ex("Kenarları 5 ve 3 birim olan dikdörtgenin alanı kaç birim karedir?", [
        "Bir sırada 5 birim kare vardır.",
        "3 sıra boşluk bırakmadan dizilir.",
        "5 × 3 = 15."
      ], "Alan 15 birim karedir."),
      sandbox: "rect",
      sandboxW: 5,
      sandboxH: 3
    },
    iliski: {
      h: "Anlat: Çevre ve alan",
      paras: [
        "Alanları eşit olan iki dikdörtgenin çevreleri eşit olmak zorunda değildir. 6 × 2 = 12 birim kare eder ve çevresi 16 birimdir. 4 × 3 de 12 birim kare eder ama çevresi 14 birimdir.",
        "Çevreleri eşit olan dikdörtgenlerin alanları da farklı olabilir. Kenarlar birbirine yaklaştıkça alan büyür. Çevresi 20 birim olan şekillerin en büyük alanı, kenarları 5 ve 5 olan karede 25 birim karedir.",
        "Hem alan hem çevre verilirse kenar çiftleri sıkışır. Alanı 24, çevresi 20 olan dikdörtgenin kenarları 4 ve 6’dır."
      ],
      example: ex("6 × 2 ile 4 × 3 dikdörtgenlerini karşılaştır.", [
        "Alanlar 12 ve 12 birim karedir.",
        "Çevreler 2 × (6 + 2) = 16 ve 2 × (4 + 3) = 14’tür.",
        "Kare sayısı aynı kalmış, sınır kısalmıştır."
      ], "Alanlar eşit, çevreler farklıdır."),
      sandbox: "rect",
      sandboxW: 6,
      sandboxH: 2,
      playHint: "Önce kenarları 6 ve 2 yap, sonra 4 ve 3 yap. Alan 12 kalırken çevrenin değiştiğini gör."
    },
    "m7-tamsayilar": {
      h: "Anlat: Tam sayılar",
      paras: [
        "Sıfır bir başlangıç çizgisidir. Deniz seviyesini 0 kabul edersek 8 m yukarı +8, 8 m aşağı −8 olur. Sıfır ne pozitif ne negatiftir.",
        "Sayı doğrusunda sağdaki sayı her zaman daha büyüktür. Negatif sayılarda sıfıra yakın olan daha büyüktür: −4, −9’un sağında olduğu için −4 > −9.",
        "Sıfıra uzaklıkları eşit, işaretleri farklı olan sayılar karşıttır. −12 ile +12’nin toplamı 0’dır. Sıfırın karşıtı yine sıfırdır."
      ],
      example: ex("Bir dalgıç −14 m’de, diğeri −6 m’de. Hangisi yüzeye daha yakındır? −3. kattan 5 kat çıkılırsa hangi kata gelinir?", [
        "Yüzeye uzaklık 14 m ve 6 m’dir. −6, sıfıra daha yakındır.",
        "−6 > −14. Daha büyük sayı daha derinde olmak zorunda değildir.",
        "Kat hesabı −3 + 5’tir. Beş birim sağa gidilir."
      ], "Yüzeye daha yakın olan −6 m’deki dalgıçtır. Asansör 2. kata gelir."),
      sandbox: "m7-number",
      playHint: "Başlangıcı −3, eklenen sayıyı 5 yap. Sonucun 2 olduğunu gör. Sonra eksi bir sayı ekleyip sola gidişi izle."
    },
    "m7-rasyonel": {
      h: "Anlat: Rasyonel sayılar",
      paras: [
        "a ve b tam sayı, b sıfırdan farklı olmak üzere a/b biçiminde yazılabilen sayılara rasyonel sayı denir. Pay alınan parçayı, payda bütünün kaç eş parçaya ayrıldığını söyler.",
        "Tek eksi işareti kesrin önünde, payda ya da paydada durabilir: −3/5 = 3/(−5). İki eksi birbirini götürür. Pay ve paydayı aynı sıfırdan farklı sayıyla çarpmak değeri değiştirmez.",
        "Her tam sayı, paydası 1 yapılarak rasyonel yazılır. Her rasyonel sayı tam sayı değildir. Pay 0 olabilir; payda 0 olamaz, sıfıra bölme tanımsızdır."
      ],
      example: ex("−15/20 kesrini sadeleştir. 0/8 ve 8/0 için ne söylenir?", [
        "Pay ve paydanın ortak böleni 5’tir.",
        "−15 ÷ 5 = −3 ve 20 ÷ 5 = 4.",
        "0/8 = 0’dır. 8/0 ise tanımsızdır."
      ], "−15/20 = −3/4. 0/8 = 0, 8/0 tanımsızdır."),
      sandbox: "im-frac"
    },
    "m7-mutlakdeger": {
      h: "Anlat: Mutlak değer",
      paras: [
        "Bir sayının sıfıra uzaklığına mutlak değer denir ve |x| ile yazılır. Uzaklığın yönü yoktur; mutlak değer negatif olamaz. |−7| = 7 ve |0| = 0’dır.",
        "|x| = 9 denkleminin iki çözümü vardır: 9 ve −9. İkisi de sıfırdan 9 birim uzaktadır.",
        "İki nokta arasındaki uzaklık, farkın mutlak değeridir. |8 − (−5)| = 13. Çıkarmanın sırası bu uzaklığı değiştirmez."
      ],
      example: ex("Hedef 250 g ± 3 g. 254 g’lık paket kabul edilir mi?", [
        "Sapma |254 − 250| = 4 g’dır.",
        "Kabul için sapma en fazla 3 g olmalıdır.",
        "4 > 3 olduğu için paket sınırın dışındadır."
      ], "Paket kabul edilmez. Hata 4 g’dır."),
      sandbox: "im-abs",
      playHint: "A’yı −5, B’yi 8 yap. Aralarındaki uzaklığın 13 olduğunu gör."
    },
    "m7-temsiller": {
      h: "Anlat: Kesir ve ondalık",
      paras: [
        "Rasyonel sayıyı ondalık göstermek için pay paydaya bölünür, işaret aynı kalır. −3/4 = −0,75 ve 7/5 = 1,4’tür.",
        "Kesir sadeleştirildikten sonra paydada yalnız 2 ve 5 asal çarpanları varsa ondalık gösterim sonludur. 1/4 = 0,25 sonludur. Paydada başka asal varsa gösterim devirlidir: 1/6 = 0,1666…",
        "0,666… sayısında tekrar eden basamak 6’dır. x = 0,666… için 10x − x = 6 olur. Böylece x = 6/9 = 2/3 bulunur."
      ],
      example: ex("0,666… hangi sade kesre eşittir?", [
        "x = 0,666… olsun. Bir basamak devrettiği için 10x = 6,666…",
        "10x − x = 6, yani 9x = 6.",
        "x = 6/9 = 2/3."
      ], "0,666… = 2/3."),
      sandbox: "im-decimal"
    },
    "m7-siralama": {
      attach: true,
      paras: [
        "Karşılaştırmaya işaretten başlanır. Negatif sayılar sıfırın solunda, pozitif sayılar sağındadır. Pozitif olan her zaman daha büyüktür. Sayı doğrusunda sağa gidildikçe sayılar büyür.",
        "Pozitif kesirlerde paydalar eşitse payı büyük olan büyüktür. Paylar eşitse paydası küçük olan büyüktür; aynı bütün daha az parçaya ayrılınca her parça büyür. Pay ve payda farklıysa eşitlenir ya da ondalığa çevrilir.",
        "Negatiflerde sıralama tersine döner. Mutlak değeri büyük olan daha küçüktür. −0,8 < −0,4. İki farklı rasyonel sayının arasında her zaman bir başkası, örneğin ortalamaları, vardır."
      ],
      example: ex("−0,6 ile −2/5 sayılarından hangisi büyüktür?", [
        "−2/5 = −0,4’tür.",
        "İkisi de negatiftir. Sıfıra uzaklıkları 0,6 ve 0,4’tür.",
        "Sıfıra yakın olan daha büyüktür."
      ], "−2/5 daha büyüktür.")
    },
    "m7-tamsayiislemler": {
      h: "Anlat: Tam sayılarla işlem",
      paras: [
        "Aynı işaretli sayılar toplanırken mutlak değerler toplanır ve ortak işaret korunur. −8 + (−5) = −13. Farklı işaretlerde büyük mutlak değerden küçüğü çıkarılır, büyük olanın işareti alınır: −8 + 5 = −3.",
        "Bir sayıyı çıkarmak, onun karşıtını toplamak demektir. 6 − (−4) = 6 + 4 = 10. Eksi işaretlerini paranteze almak, eksi ile çıkarmayı karıştırmayı önler.",
        "Çarpmada ve bölmede aynı işaret pozitif, farklı işaret negatif sonuç verir. (−6) × (−3) = 18 ve (−18) ÷ 3 = −6. Bölen 0 olamaz."
      ],
      example: ex("(−24) ÷ (−6) − 7 kaçtır?", [
        "Aynı işaretli bölme pozitiftir: (−24) ÷ (−6) = 4.",
        "Bölme, çıkarmadan önce yapılır.",
        "4 − 7 = −3."
      ], "Sonuç −3’tür."),
      sandbox: "m7-number",
      playHint: "Çıkarmayı toplama gibi görmek için eklenecek sayıya, çıkarılanın karşıtını yaz."
    },
    "m7-rasyonelislemler": {
      h: "Anlat: Kesirlerle işlem",
      paras: [
        "Kesirler toplanırken önce paydalar eşitlenir, sonra paylar toplanır. Paydalar birbirine eklenmez. −1/3 + 3/4 = −4/12 + 9/12 = 5/12.",
        "Çarpmada paylar kendi arasında, paydalar kendi arasında çarpılır. Bölmede ikinci kesir ters çevrilip çarpılır. Sıfırın çarpma tersi yoktur.",
        "Üs, tabanın kaç kez çarpılacağını söyler. (−2)² = 4, çünkü eksi parantezin içindedir. −2² = −4, çünkü üs yalnız 2’ye uygulanır."
      ],
      example: ex("(−1/2)³ kaçtır?", [
        "Taban üç kez çarpılır: (−1/2) × (−1/2) × (−1/2).",
        "İki eksi, pozitif 1/4 eder.",
        "Üçüncü eksi, sonucu negatife çevirir."
      ], "(−1/2)³ = −1/8."),
      sandbox: "im-fracadd"
    },
    "m7-cokadimli": {
      h: "Anlat: İşlem sırası",
      paras: [
        "Önce parantez, sonra üsler, sonra çarpma ve bölme, en sonda toplama ve çıkarma yapılır. 3 × (2 + 4) = 3 × 6 = 18. Parantezi atlayıp soldan başlamak sonucu değiştirir.",
        "Çarpma ile bölme aynı önceliktedir; toplama ile çıkarma da. Aynı öncelikte işlemler soldan sağa yapılır. 24 ÷ 3 × 2 = 8 × 2 = 16.",
        "Kesir çizgisinin üstü ve altı ayrı birer parantez gibi çözülür. 2 + 3 × 4 işleminde önce 3 × 4 = 12, sonra 2 + 12 = 14’tür."
      ],
      example: ex("(−3)² − 12 ÷ 4 kaçtır?", [
        "Önce üs: (−3)² = 9.",
        "Sonra bölme: 12 ÷ 4 = 3.",
        "En sonda çıkarma: 9 − 3 = 6."
      ], "Sonuç 6’dır."),
      sandbox: "im-order",
      playHint: "a + b × c ifadesinde çarpmayı önce yap. Soldan gitmenin hangi sayılarda şaşırdığını gör."
    },
    "m7-gorunumler": {
      h: "Anlat: Görünümler",
      paras: [
        "Bir küp yığınına önden, sağdan ve üstten bakmak farklı yüzleri gösterir. Arkada kalan kısa kuleler siluette görünmeyebilir; yine de hacme dahildir.",
        "Üstten görünüm, tabanda hangi hücrelerin dolu olduğunu söyler. Bir hücrenin yüksekliğini yalnız üstten görünümden bilemeyiz.",
        "Önden bakınca her sütundaki en yüksek kule silueti belirler. Yükseklikler toplanmaz. Sağdan bakınca da her sıradaki en yüksek kule görünür."
      ],
      example: ex("Ön sıra 1 ve 3, arka sıra 2 ve 1 birim. Önden görünüm nedir? Toplam küp 2 midir?", [
        "Sol sütun: 1 ile 2’nin büyüğü 2’dir.",
        "Sağ sütun: 3 ile 1’in büyüğü 3’tür.",
        "Toplam küp 1 + 3 + 2 + 1 = 7’dir. Taban dolu diye her hücrede tek küp yoktur."
      ], "Ön görünüm 2 ve 3 birimdir. Toplam 7 küptür."),
      sandbox: "im-views"
    },
    "m7-acinim": {
      h: "Anlat: Yüzey alanı",
      paras: [
        "Dikdörtgenler prizmasının 6 yüzü, 12 ayrıtı ve 8 köşesi vardır. Karşılıklı yüzler eştir. Açınım, bu yüzleri aynı düzleme yan yana sermektir.",
        "Ayrıtlar a, b ve c ise yüz çiftlerinin alanları ab, ac ve bc’dir. Her çiftten iki yüz olduğu için yüzey alanı 2 × (ab + ac + bc) olur.",
        "Üstü açık kutuda eksik yüzün alanı çıkarılır. Küpte altı yüz de eş karedir: alan 6a²’dir. Alan birimi, uzunluk biriminin karesidir."
      ],
      example: ex("Ayrıtları 6 cm, 4 cm ve 3 cm olan kutunun yüzey alanı kaç cm²?", [
        "Yüz çiftleri 6 × 4 = 24, 6 × 3 = 18 ve 4 × 3 = 12’dir.",
        "Bu üç alanın toplamı 54’tür.",
        "Her yüzden iki tane vardır: 2 × 54 = 108."
      ], "Yüzey alanı 108 cm²dir."),
      sandbox: "m7-prism"
    },
    "m7-hacimyorum": {
      h: "Anlat: Hacmi küplerle görmek",
      paras: [
        "Hacim, cismin uzayda kapladığı yerdir. Boşluk bırakmadan ve üst üste bindirmeden yerleşen birim küplerle ölçülür. Alan birim kareyle, hacim birim küple ölçülür.",
        "Bir sıradaki küp sayısı ile sıra sayısı çarpılırsa bir kattaki küp bulunur. Kat sayısıyla çarpılırsa bütün hacim bulunur.",
        "Birim büyüyünce gereken parça sayısı azalır. Ayrıtı 2 cm olan küp 8 cm³’tür. 64 cm³’lük bir hacim, böyle 8 küple dolar."
      ],
      example: ex("Bir sırada 6, bir katta 3 sıra ve 4 kat varsa kaç birim küp olur?", [
        "Bir katta 6 × 3 = 18 küp vardır.",
        "4 kat, bu katmanın dört kez üst üste gelmesidir.",
        "18 × 4 = 72."
      ], "72 birim küp."),
      sandbox: "im-layers"
    },
    "m7-hacim": {
      h: "Anlat: Hacim bağıntısı",
      paras: [
        "Dikdörtgenler prizmasının hacmi, üç ayrıtın çarpımıdır. Taban alanı bir katmandaki küp sayısı, yükseklik ise kat sayısı gibi düşünülebilir: H = a × b × c.",
        "Bir ayrıt iki katına çıkarsa hacim de iki katına çıkar. Üç ayrıt birden iki katına çıkarsa hacim 2 × 2 × 2 = 8 kat olur.",
        "Hacim ve taban alanı biliniyorsa yükseklik, hacmin taban alanına bölünmesiyle bulunur. Doluluk sorularında önce kabın hacmi, sonra dolu olan kesir hesaplanır."
      ],
      example: ex("Ayrıtları 8 dm, 5 dm ve 4 dm olan deponun hacmi kaç dm³? Ayrıtı 3 cm olan küpün hacmi kaç cm³?", [
        "8 × 5 × 4 = 160.",
        "Küpte üç ayrıt da 3 cm’dir: 3 × 3 × 3 = 27.",
        "3³ = 27 diye de yazılır."
      ], "Depo 160 dm³, küp 27 cm³’tür."),
      sandbox: "m7-prism",
      playHint: "Ayrıtları 8, 5 ve 4 yap. Hacmin 160 olduğunu gör. Sonra bir ayrıtı iki katına çıkarıp hacmin de iki katına çıktığını izle."
    },
    "m7-birimler": {
      h: "Anlat: Hacim birimleri",
      paras: [
        "Uzunlukta her adım 10 kat, küp birimde her adım 1 000 kattır. 1 dm = 10 cm olduğu için 1 dm³ = 10 × 10 × 10 = 1 000 cm³. Aynı biçimde 1 m³ = 1 000 dm³.",
        "Sıvı ile küp birimini şu eşitlikler bağlar: 1 L = 1 dm³, 1 mL = 1 cm³ ve 1 m³ = 1 000 L.",
        "L, dL, cL ve mL arasında her adım 10 kattır. Farklı birimler toplanmadan önce aynı birime çevrilir. 1,5 L + 250 mL = 1 500 mL + 250 mL = 1 750 mL."
      ],
      example: ex("0,6 m³ kaç litredir? 750 cm³ kaç litredir?", [
        "1 m³ = 1 000 L olduğu için 0,6 × 1 000 = 600 L.",
        "750 cm³ = 750 mL.",
        "750 mL = 0,75 L."
      ], "0,6 m³ = 600 L ve 750 cm³ = 0,75 L."),
      sandbox: "im-units"
    },
    "m7-problemler": {
      h: "Anlat: Hacim problemleri",
      paras: [
        "Boya, kaplama ve ambalaj yüzey alanıyla; depolanan sıvı ve sığan cisim hacimle bulunur. Sorudaki birime ve ölçünün iç ölçü mü dış ölçü mü olduğuna bakılır.",
        "40 × 30 × 20 cm iç ölçülü bir akvaryum 24 000 cm³ tutar. 1 000 cm³ = 1 L olduğu için bu 24 L eder. Kabın 3/4’ü doluysa 18 L su vardır, 6 L boştur.",
        "Kutuya küp dizerken her ayrıt küpün ayrıtına bölünür. Fire payı varsa kaplanacak alana bu pay eklenir."
      ],
      example: ex("30 L su, 3/4 L’lik şişelere doldurulursa kaç şişe gerekir?", [
        "Soru, 30’un içinde kaç tane 3/4 olduğunu sorar.",
        "Bir kesre bölmek, onun tersiyle çarpmaktır.",
        "30 × 4 / 3 = 40."
      ], "40 şişe gerekir."),
      sandbox: "im-tank",
      playHint: "Kapasiteyi 24 L, parçayı 4, dolu parçayı 3 yap. 18 L dolu ve 6 L boş kaldığını gör."
    },
    "m7-dagilimlar": {
      h: "Anlat: Veri türleri",
      paras: [
        "Veri, bir grup hakkında toplanan bilgidir. Renk ve ulaşım türü gibi adlarla ayrılan özellikler kategoriktir. Boy, süre ve kütle gibi ölçülen özellikler niceldir.",
        "Kitap sayısı sayılarak bulunur; 5 ile 6 arasında kitap olmaz. Bu, kesikli nicel veridir. Kütle ölçülür; iki ölçüm arasında başka değerler olabilir. Bu, sürekli nicel veridir.",
        "Forma numarası ve posta kodu sayı gibi görünse de miktar değildir; kategorik etikettir. Tek ölçüm bütün grubu temsil etmeyebilir. Dağılım, değerlerin nasıl yayıldığını gösterir."
      ],
      example: ex("100 m koşu süreleri hangi veri türündedir? Forma numarası 12 bir miktar mıdır?", [
        "Süre ölçülür ve iki değer arasında başka süreler olabilir.",
        "Bu, nicel sürekli veridir.",
        "Forma numarası oyuncuyu ayırt eder; miktar diye toplanmaz."
      ], "Koşu süresi nicel süreklidir. Forma numarası kategoriktir."),
      sandbox: "im-data"
    },
    "m7-surec": {
      h: "Anlat: Araştırma sorusu",
      paras: [
        "İstatistiksel soru, bir grupta değişebilen bir özelliği sorar. En sevdiğim sayı kaç sorusu bir grubun dağılımı değildir. Okulumuzdaki 7. sınıfların günlük okuma süreleri nasıl dağılır sorusu istatistikseldir.",
        "Evren, araştırılacak grubun tamamıdır. Örneklem, evrenden seçilen alt gruptur. Yalnız yakın arkadaşları seçmek yanlılık yaratır. Her şubeden rastgele seçim, farklı şubelerin temsiline yardım eder.",
        "Araştırma dört adımda ilerler: soru, veri toplama, analiz ve yorum. Bir okuldan çıkan sonuç, bütün ülkeye doğrudan genellenemez."
      ],
      example: ex("Sınıfımız dün kaç sayfa okudu sorusu istatistiksel midir?", [
        "Bir grup vardır: sınıf.",
        "Okunan sayfa kişiden kişiye değişebilir.",
        "Cevap tek bir sayı değil, bir dağılımdır."
      ], "Evet. İstatistiksel bir sorudur."),
      sandbox: "im-research"
    },
    "m7-toplama": {
      h: "Anlat: Veriyi nasıl toplarız?",
      paras: [
        "Görüş için anket, davranış için gözlem, kayıtlar için hazır veri, boy için ölçüm kullanılır. Yöntem, sorulan özelliğe uymalıdır.",
        "Harika kütüphanemizi seviyor musun sorusu yönlendirir. Kütüphaneden ne sıklıkla yararlanırsın sorusu daha tarafsızdır. Seçenekler anlaşılır ve herkesi kapsayacak biçimde kurulur.",
        "Araştırma için gerekmeyen bilgi toplanmaz. Okuma süresi sorulurken kimlik numarası ya da ev adresi istenmez. Katılım gönüllüdür. Boş cevap, 0 demek değildir."
      ],
      example: ex("20 öğrenciden 3’ü cevap vermedi. Kaç geçerli yanıt vardır?", [
        "Cevap veren 20 − 3 = 17 kişidir.",
        "Boş bırakmak, 0 dakika okudum anlamına gelmez.",
        "Eksik veriyi sıfır saymak ortalamayı olduğundan küçük gösterir."
      ], "17 geçerli yanıt vardır."),
      sandbox: "im-privacy"
    },
    "m7-analiz": {
      h: "Anlat: Grafiği okumak",
      paras: [
        "Sütun grafiği kategorilerin sıklığını karşılaştırmayı kolaylaştırır. Çizgi grafiği zamana bağlı değişimi gösterir; noktalar zaman sırasıyla birleştirilir. Nokta grafiğinde her gözlem bir noktadır.",
        "Grafikte eksenin adı, birimi ve ölçeği okunur. Bir aralık 5 kişiyse üç aralık 15 kişidir. Sütunun kâğıt üzerindeki uzunluğu, ölçek bilinmeden miktar değildir.",
        "Değerler 4, 8, 6 ve 10 ise toplam 28, en büyük ile en küçük arasındaki fark 6’dır."
      ],
      example: ex("Haftalık sıcaklık değişimini hangi grafikle göstermek uygundur?", [
        "Veri zamana bağlıdır; günler sırayla gelir.",
        "Artışı izlemek için noktalar zaman sırasıyla birleştirilir.",
        "Eksenlerde gün ve °C yazılmalıdır."
      ], "Zaman sıralı çizgi grafiği uygundur."),
      sandbox: "m7-stats",
      playHint: "Veriyi değiştir. Bir uç değer ekleyince ortalama ile ortancanın aynı hızda kımıldamadığını gör."
    },
    "m7-yorumlama": {
      h: "Anlat: Ortalama ve yayılım",
      paras: [
        "Ortalama, toplamın gözlem sayısına bölümüdür. Ortanca bulunmadan önce veriler sıralanır. Gözlem sayısı tekse ortadaki, çiftse ortadaki ikisinin ortalaması alınır.",
        "Tepe değer en sık görülen değerdir; birden fazla olabilir. Açıklık, en büyükten en küçüğün çıkarılmasıdır.",
        "Ortalama mutlak sapma, her verinin ortalamadan uzaklıklarının ortalamasıdır. Bu sayı küçükse değerler merkeze daha yakındır. Ortalama ± bu sapma bir referans bandıdır; her veri bantta olmak zorunda değildir."
      ],
      example: ex("5, 7 ve 9 verilerinin ortalama mutlak sapması kaçtır?", [
        "Ortalama (5 + 7 + 9) / 3 = 7’dir.",
        "Uzaklıklar 2, 0 ve 2’dir.",
        "(2 + 0 + 2) / 3 = 4/3."
      ], "Ortalama mutlak sapma 4/3’tür."),
      sandbox: "m7-stats",
      playHint: "Önce 8; 10; 12, sonra 4; 10; 16 yaz. Ortalama aynı kalırken yayılımın açıldığını gör."
    },
    "m7-inceleme": {
      h: "Anlat: İddiayı sorgulamak",
      paras: [
        "Bir iddia başlıkla değil; kaynağı, tarihi, yöntemi ve örneklemiyle incelenir. Yalnız spor kulübüne sorulan anket, bütün okulun alışkanlığını kanıtlamaz.",
        "Eksen sıfırdan başlamazsa küçük bir fark büyük görünebilir. Yüzde hesaplanırken artış, yeni değere değil başlangıç değere bölünür.",
        "İki olayın birlikte değişmesi, birinin diğerine neden olduğunu tek başına kanıtlamaz. Raporda örneklem, birim ve sınırlılık yazılır."
      ],
      example: ex("80’den 100’e artış yüzde kaçtır?", [
        "Artış 100 − 80 = 20’dir.",
        "Yüzde, başlangıca bölünür: 20 / 80 = 1/4.",
        "1/4 = %25. 20/100 yazmak, artışı yeni değere bölmek olur."
      ], "Artış %25’tir."),
      sandbox: "im-media"
    },
    "m7-yansima": {
      h: "Anlat: Yansıma",
      paras: [
        "Bir nokta ile görüntüsü, simetri doğrusuna eşit dik uzaklıktadır. Bu doğru, iki noktayı birleştiren parçanın orta dikmesidir.",
        "Çizerken noktadan ayna doğrusuna dik inilir, aynı uzaklık karşı tarafa taşınır. Her köşe için bu tekrarlanır ve eşleşen köşeler birleştirilir.",
        "Yansıma uzunlukları, açıları, alanı ve çevreyi korur. Yön duygusu tersine dönebilir. Doğrunun üzerindeki nokta yerinde kalır."
      ],
      example: ex("A noktası aynadan 5 cm uzaktaysa A ile A′ arası kaç santimetredir?", [
        "Görüntü de aynadan 5 cm uzaktadır.",
        "İki uzaklık aynı doğru üzerindedir.",
        "5 + 5 = 10."
      ], "AA′ = 10 cm."),
      sandbox: "m7-mirror",
      playHint: "Uzaklığı 5 yap. A ile A′ arasının 10 olduğunu gör. Sonra uzaklığı 0 yap; nokta yerinde kalır."
    },
    "m7-insa": {
      h: "Anlat: Orta dikme ve açıortay",
      paras: [
        "Orta dikme, bir doğru parçasını orta noktasında dik kesen doğrudur. Üzerindeki her nokta parçanın iki ucuna eşit uzaklıktadır.",
        "Pergelle kurmak için iki uç merkezli, eş yarıçaplı çemberler çizilir. Yarıçap, parçanın yarısından büyük olmalıdır; yoksa iki kesişim noktası oluşmaz. Bu noktaları birleştiren doğru orta dikmedir.",
        "Açıortay, açıyı iki eş açıya bölen ışındır. 74°lik açı 37° ve 37° olur. Bir ışın yalnız açının içinde diye açıortay sayılmaz; açıları eşit bölmelidir."
      ],
      example: ex("AB = 12 cm. Orta dikme inşasında 5 cm yarıçap uygun mudur?", [
        "İki kesişim için yarıçap, 12 / 2 = 6 cm’den büyük olmalıdır.",
        "5 cm, 6 cm’den küçüktür.",
        "Çemberler kesişmez."
      ], "Uygun değildir. Yarıçap 6 cm’den büyük seçilmelidir."),
      sandbox: "m7-mirror",
      playHint: "A ve A′ aynı uzaklıkta durur. Ortadaki doğru, onları birleştiren parçayı iki eş uzunluğa böler ve dik keser."
    }
  };

  // 5. sınıfa çocuk dostu vurgu: önemli terimler ve akılda kalıcı birer söz.
  const extras5 = {
    nokta: { terms: ["doğru parçası"], motto: "İki ucu belli olan ölçülür: doğru parçası!" },
    aci: { terms: ["köşe", "kol", "dik açı"], motto: "Açıyı kolların uzunluğu değil, aralarındaki açıklık belirler." },
    cember: { terms: ["merkez", "yarıçap", "çap"], motto: "Çap her zaman iki yarıçaptır: R = 2 × r." },
    dikme: { terms: ["dikme"], motto: "Bir noktadan bir doğruya en kısa yol dikmedir." },
    paralel: { terms: ["paralel"], motto: "Paraleller hiç buluşmaz; aralarındaki uzaklık hep aynı kalır." },
    olcme: { terms: ["derece", "eş açılar"], motto: "Tam tur 360°, yarım tur 180°, çeyrek tur 90°." },
    durum: { terms: ["kesişirler", "paraleldirler", "çakışıktırlar"], motto: "Tek ortak nokta varsa doğrular kesişir." },
    cift: { terms: ["ters açılar", "tümler", "bütünler"], motto: "Tümler 90°ye, bütünler 180°e tamamlar." },
    cokgen: { terms: ["çokgen", "köşegen"], motto: "Kaç kenar varsa o kadar köşe, o kadar iç açı vardır." },
    ucgen: { terms: ["eşkenar", "ikizkenar"], motto: "Üçgenin iç açılarının toplamı her zaman 180°dir." },
    insa: { terms: ["inşa", "pergel"], motto: "Pergelin açıklığı değişmedikçe uzunluklar eşit kalır." },
    okuma: { terms: ["bölük"], motto: "Sağdan üçer üçer ayır, her bölüğü kendi içinde oku." },
    basamak: { terms: ["basamak değeri", "çözümleme"], motto: "Rakam aynı kalır; yeri değişince değeri değişir." },
    sirala: { motto: "Önce basamak sayısına, sonra soldan ilk farka bak." },
    islem: { terms: ["tahmin"], motto: "Birler 9’u geçince 1 onluk elde olur." },
    carpan: { motto: "3 × 4 ile 4 × 3 aynıdır; sıra önemli değildir." },
    problem: { motto: "Önce verileni bul, sonra isteneni seç; en son kontrol et." },
    cevre: { terms: ["çevre"], motto: "Dikdörtgenin çevresi = 2 × (uzun kenar + kısa kenar)." },
    alan: { terms: ["alan", "birim kare"], motto: "Alan = bir sıradaki kare sayısı × sıra sayısı." },
    iliski: { terms: ["alan"], motto: "Alanları eşit iki şeklin çevreleri farklı olabilir." }
  };

  function spoken(spec) {
    const item = spec.example;
    return spec.paras.join(" ") + " Örnek: " + item.ask + " " + item.steps.join(" ") + " Sonuç: " + item.result;
  }

  function mount(topics) {
    for (const topic of topics) {
      const spec = lessons[topic.id];
      if (!spec) throw new Error("Anlatım yok: " + topic.id);
      if (topic.slides.some((slide) => slide.teach)) continue;
      if (spec.attach) {
        const slide = topic.slides.find((item) => item.bullets) || topic.slides[0];
        slide.teach = true;
        slide.narration = spec.paras;
        slide.example = spec.example;
        slide.p = spoken(spec);
        continue;
      }
      const slide = {
        h: spec.h,
        teach: true,
        narration: spec.paras,
        example: spec.example,
        p: spoken(spec),
        nextLabel: "Ayrıntılara geç →"
      };
      if (!spec.sandbox) throw new Error("Model yok: " + topic.id);
      slide.sandbox = spec.sandbox;
      slide.playHint = spec.playHint || "Modeli değiştir. Anlatılan kuralın yeni sayılarda da durduğunu gör.";
      if (Number.isInteger(spec.sandboxDeg)) slide.sandboxDeg = spec.sandboxDeg;
      if (spec.sandboxR) slide.sandboxR = spec.sandboxR;
      if (spec.sandboxW) slide.sandboxW = spec.sandboxW;
      if (spec.sandboxH) slide.sandboxH = spec.sandboxH;
      if (spec.sandboxDigits) slide.sandboxDigits = spec.sandboxDigits;
      const extra = extras5[topic.id];
      if (extra) {
        if (extra.terms && extra.terms.length) slide.terms = extra.terms;
        if (extra.motto) slide.motto = extra.motto;
      }
      topic.slides.unshift(slide);
    }
  }

  mount(root.MatCurriculum.topics);
  mount(root.MatCurricula[7].topics);
})(typeof window !== "undefined" ? window : globalThis);
