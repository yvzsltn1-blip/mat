/* Kaynak kapsamı: matematik5-1-web-promtu.txt ve matematik5-1.pdf.
   Sorular özgündür; kitaptaki soruların kopyası değildir.
   Her konu ve seviyede sabit kimlikli 15 soru bulunur. */
(function (root) {
  "use strict";
  const G = root.MatGames;
  const f = G.groupDigits;
  const N = (prompt, answer, explain, unit = "", scene = null) => ({ kind: "num", prompt, answer, explain, unit, scene, hint: "Verilenleri ayır. Önce ilk adımı, sonra isteneni bul." });
  const C = (prompt, answer, wrongs, explain, scene = null) => ({ kind: "mc", prompt, answer, choices: [...new Set([answer, ...wrongs])], explain, scene, hint: "Tanımı ve bütün koşulları birlikte düşün." });
  const T = (prompt, yes, explain) => ({ ...C(prompt, yes ? "Doğru" : "Yanlış", [yes ? "Yanlış" : "Doğru"], explain), scoringType: "true-false" });
  const F = (...lines) => ({ kind: "formula", lines });
  const dial = (prompt, target, explain) => ({ kind: "dial", prompt, target, tolerance: 2, explain, hint: "Işını sürükle veya ok tuşlarıyla ölçüyü ayarla." });
  const order = (prompt, values) => ({ kind: "order", prompt, items: values.map((n, i) => ({ id: "v" + i, n })), answer: values.map((n, i) => ({ n, id: "v" + i })).sort((a, b) => a.n - b.n).map(it => it.id), explain: "Basamak sayısına, ardından soldan ilk farklı rakama bak. Sıra: " + [...values].sort((a, b) => a - b).map(f).join(" < "), hint: "En küçük sayıyla başla." });
  const rect = (prompt, w, h) => ({ kind: "rect", mode: "both", area: w * h, perim: 2 * (w + h), prompt, explain: `Kenarlar ${w} ve ${h} olabilir: alan ${w * h}, çevre ${2 * (w + h)}.`, hint: "Çarpımları alanı, toplamlarının iki katı çevreyi vermeli." });
  const builders = {};

  builders.nokta = l => {
    const a = l + 2, b = 2 * l + 3, c = l + 4, n = l + 3;
    return [
      C(l < 3 ? "Bir kalem ucunun kâğıtta bıraktığı tek iz hangi kavramın modelidir?" : "Haritada şehri gösteren A işareti boyutsuz bir konumu temsil ediyor. Bu hangi geometrik kavramdır?", "Nokta", ["Doğru", "Işın", "Düzlem"], "Nokta yalnızca yer belirtir; eni, boyu ve kalınlığı yoktur.", { kind: "point" }),
      C(l < 3 ? "İki ucu belli olan çizgi hangisidir?" : "A ve B durakları arasındaki düz yolun iki sınırı da bellidir. Hangi model uygundur?", "Doğru parçası", ["Doğru", "Işın", "Daire"], "İki uç noktası belli olan model doğru parçasıdır.", { kind: "segment" }),
      C(l < 3 ? "Bir başlangıcı olup tek yönde sonsuza uzanan şekil nedir?" : "A'dan B yönüne sonsuza uzanan çizim, B'de sona ermiyor. Hangi şekildir?", "Işın", ["Doğru", "Doğru parçası", "Nokta"], "Işın başlangıç noktasından bir yönde sonsuza uzanır.", { kind: "ray" }),
      C(l < 3 ? "Her iki yönde sonsuza uzanan şekil nedir?" : "d çizimi iki yönde de sınırsız uzuyor. Cetvelle tamamının uzunluğu ölçülebilir mi?", l < 3 ? "Doğru" : "Hayır, bir doğrudur", l < 3 ? ["Işın", "Doğru parçası", "Çap"] : ["Evet, bir parçadır", "Evet, bir ışındır", "Yalnız yarısı ölçülür"], "Doğru iki yönde sonsuza uzanır; sonlu bir uzunluk ölçüsü verilemez.", { kind: "line" }),
      N(`A, B, C aynı doğru üzerinde bu sırada. AB = ${a}, BC = ${b} cm. AC kaç cm?`, a + b, `${a} + ${b} = ${a + b}. B, A ile C arasındadır.`, "cm"),
      N(`K, L, M aynı doğru üzerinde bu sırada. KM = ${a + b}, KL = ${a} cm. LM kaç cm?`, b, `${a + b} − ${a} = ${b}.`, "cm"),
      N(`A, B, C, D aynı doğru üzerinde bu sırada. AB = ${a}, BC = ${b}, CD = ${c} cm. AD kaç cm?`, a + b + c, `Ardışık parçalar toplanır: ${a} + ${b} + ${c} = ${a + b + c}.`, "cm"),
      N(l < 3 ? `AB'nin orta noktası M. AM = ${b} cm ise AB kaç cm?` : `A, M, B aynı doğru üzerinde bu sırada, M orta nokta. AB = ${4 * b} cm. AM'nin yarısı kaç cm?`, l < 3 ? 2 * b : b, l < 3 ? `İki eş parça: 2 × ${b} = ${2 * b}.` : `AM = ${2 * b}; yarısı ${b}.`, "cm"),
      N(l < 3 ? `Cetvelde A ucu ${a}, B ucu ${a + b} cm çizgisinde. AB kaç cm?` : `Cetvelde K ucu ${a}, L ucu ${a + 3 * b} cm çizgisinde. Parça üç eş parçaya ayrılıyor. Bir parça kaç cm?`, l < 3 ? b : b, l < 3 ? `Son okuma − ilk okuma = ${b}.` : `KL = ${3 * b}; ${3 * b} ÷ 3 = ${b}.`, "cm"),
      T(l < 3 ? "[AB] ve [BA] aynı doğru parçasını gösterir." : "A, B, C bu sırada aynı doğru üzerindeyse A'dan B'ye ve A'dan C'ye giden ışınlar aynıdır.", true, "Doğru parçasında uçların sırası değişebilir. Işında ise başlangıç ve yön belirleyicidir."),
      T(l < 3 ? "Noktalar büyük harfle adlandırılır." : "A ve B farklı noktalar. A'dan B yönüne ışın ile B'den A yönüne ışının başlangıçları aynıdır.", l < 3, l < 3 ? "A, B, K gibi büyük harfler kullanılır." : "Başlangıçlar A ve B'dir; farklı oldukları için ışınlar aynı değildir."),
      N(l < 3 ? "İki farklı noktadan geçen kaç farklı doğru vardır?" : `Aynı doğru üzerindeki ${n} farklı noktanın her ikisi bir doğru belirliyor. Kaç farklı doğru elde edilir?`, 1, "Noktaların hepsi aynı doğru üzerindeyse seçilen her ikili aynı doğruyu verir."),
      N(`Bir doğru üzerindeki ${n} farklı nokta, en soldan en sağa kaç ardışık aralık oluşturur?`, n - 1, `${n} nokta arasında ${n - 1} aralık bulunur.`),
      N(l < 3 ? `Bir parça ${n} eş parçaya ayrılıyor. Uçlar dışında kaç ayırma noktası gerekir?` : `Bir doğru üzerindeki ${n} farklı noktadan uçları bu noktalar olan kaç farklı doğru parçası seçilir?`, l < 3 ? n - 1 : n * (n - 1) / 2, l < 3 ? `${n} parça için ${n - 1} iç nokta gerekir.` : `İlk noktadan ${n - 1}, ikinciden ${n - 2}, ... sonuncudan 0 yeni parça: toplam ${n * (n - 1) / 2}.`),
      N(l < 3 ? `A, B, C bu sırada. AB = ${a}, AC = ${a + b} cm. BC, AB'den kaç cm uzun?` : `Aynı doğru üzerindeki ${n} farklı nokta başlangıç olarak seçiliyor. Bu noktaların ikisinden geçen, aynı başlangıç ve aynı yöndekiler tek sayılan kaç farklı ışın vardır?`, l < 3 ? b - a : 2 * n - 2, l < 3 ? `BC = ${b}. Fark ${b} − ${a} = ${b - a}.` : `İki uç noktanın her birinden 1, ${n - 2} iç noktanın her birinden 2 ışın: 2 + 2 × ${n - 2} = ${2 * n - 2}.`)
    ];
  };

  builders.aci = l => {
    const a = 20 + l * 5, b = 8 + l * 3, k = l + 1;
    return [
      C(`∠${["ABC", "KLM", "PRS", "DEF", "XYZ"][l - 1]} açısının köşesi hangi harftir?`, ["B", "L", "R", "E", "Y"][l - 1], ["A", "K", "Z"], "Üç harfle gösterimde köşe her zaman ortadaki harftir."),
      C(`${a}° ölçülü açı hangi türdedir?`, "Dar açı", ["Dik açı", "Geniş açı", "Doğru açı"], "0° ile 90° arasındaki açılar dardır.", { kind: "angle", deg: a, show: true }),
      l < 3 ? { kind: "classify", prompt: `${a}°, 90° ve ${100 + 7 * l}° açılarını türlerine göre eşleştir.`, buckets: ["Dar açı", "Dik açı", "Geniş açı"], items: [{ id: "a", text: a + "°", bucket: 0 }, { id: "b", text: "90°", bucket: 1 }, { id: "c", text: 100 + 7 * l + "°", bucket: 2 }], explain: "90°den küçük açı dar, 90° dik, 90° ile 180° arası geniştir.", hint: "Önce tam 90° olanı bul." } : C(`${100 + 7 * l}° ölçülü açı hangi türdedir?`, "Geniş açı", ["Dar açı", "Dik açı", "Tam açı"], "90° ile 180° arasındaki açılar geniştir.", { kind: "angle", deg: 100 + 7 * l, show: true }),
      T(l < 3 ? "Açının kolları uzatılırsa açının ölçüsü büyür." : "Aynı köşeli iki açının kolları farklı uzunlukta çizilmiş olsa da ölçüleri eşit olabilir.", l >= 3, "Açı ölçüsü kolun çizimdeki uzunluğuna değil, ışınlar arasındaki dönmeye bağlıdır."),
      N(l < 3 ? "Bir dik açı kaç derecedir?" : `Bir açı ${a}° iken ${b}° açılıyor. Son ölçü kaç derece?`, l < 3 ? 90 : a + b, l < 3 ? "Dik açı 90°dir." : `${a} + ${b} = ${a + b}.`, "°"),
      N(`Bir kapı ${a + b}° açıkken ${b}° kapatılıyor. Açıklık kaç derece kalır?`, a, `${a + b} − ${b} = ${a}.`, "°"),
      N(l < 3 ? `Dik açıya ulaşmak için ${a}°'lik açıyı kaç derece artırmalısın?` : `Kapı ${a}° açık. Önce ${2 * b}° açılıyor, sonra ${b}° kapanıyor. Son açıklık kaç derece?`, l < 3 ? 90 - a : a + b, l < 3 ? `90 − ${a} = ${90 - a}.` : `${a} + ${2 * b} − ${b} = ${a + b}.`, "°"),
      N(`Bir doğru açı ${k} eş açıya ayrılıyor. Birinin ölçüsü kaç derece?`, 180 / k, `180 ÷ ${k} = ${180 / k}.`, "°"),
      N(`Bir tam açı ${k} eş açıya ayrılıyor. Birinin ölçüsü kaç derece?`, 360 / k, `360 ÷ ${k} = ${360 / k}.`, "°"),
      dial(l < 3 ? `Işını ${a}°'ye getir.` : `Işını, ${a}°'den ${b}° büyük olan ölçüye getir.`, l < 3 ? a : a + b, l < 3 ? `Hedef ${a}°.` : `${a} + ${b} = ${a + b}°.`),
      C(l < 3 ? "Açının kolları hangi geometrik şekillerdir?" : "Bir açının yalnızca bir kolunu köşe sabitken döndürdük. Ölçü için ne söylenebilir?", l < 3 ? "Işın" : "Kollar arasındaki açıklığa göre değişir", l < 3 ? ["Nokta", "Çember", "Daire"] : ["Her zaman sabittir", "Her zaman sıfır olur", "Kol uzunluğuna eşittir"], "Açı ortak başlangıçlı iki ışından oluşur. Birinin yönü değişirse aralarındaki açıklık değişebilir."),
      N(`Açıölçerde iç ölçek ${a}°, dış ölçek ${180 - a}° gösteriyor. Başlangıç kolu iç ölçeğin 0 çizgisinde. Ölçü kaç derece?`, a, "Başlangıç kolunun sıfırı hangi ölçekteyse o ölçek okunur.", "°"),
      N(l < 3 ? `Doğru açıya ulaşmak için ${a}° daha açılan kapı başlangıçta kaç derece açıktır?` : `Bir robot ${k} kez ${a}° dönüyor, sonra ${b}° ters yöne dönüyor. Başlangıca göre toplam dönmesi kaç derece?`, l < 3 ? 180 - a : k * a - b, l < 3 ? `180 − ${a} = ${180 - a}.` : `${k} × ${a} − ${b} = ${k * a - b}.`, "°"),
      N(`Bir açı diğerinin ${k} katı. Küçük açı ${b}° ise büyük açı kaç derece?`, k * b, `${k} × ${b} = ${k * b}.`, "°"),
      N(l < 3 ? "Dar açıların derece cinsinden en büyük tam sayı ölçüsü kaçtır?" : `Bir açının ${k} katına ${b}° eklenince ${k * a + b}° oluyor. İlk açı kaç derece?`, l < 3 ? 89 : a, l < 3 ? "Dar açı 90°den küçüktür; en büyük tam sayı 89'dur." : `Önce ${b} çıkar: ${k * a}. Sonra ${k}'e böl: ${a}.`, "°")
    ];
  };

  builders.cember = l => {
    const r = 3 + l * 2, d = l + 2, k = l + 1;
    return [
      C(l < 3 ? "Çember üzerindeki noktalar merkeze nasıl uzaklıktadır?" : `O merkezinden ${r} cm uzaktaki bütün noktalar hangi şekli oluşturur?`, l < 3 ? "Eşit uzaklıkta" : "Çember", l < 3 ? ["Her biri farklı", "Hep sıfır uzaklıkta", "Sadece iki uzaklıkta"] : ["Daire", "Doğru", "Işın"], "Çember, bir merkezden eşit uzaklıktaki noktaların oluşturduğu şekildir."),
      C("Merkezden çemberin üzerindeki bir noktaya çizilen parça nedir?", "Yarıçap", ["Çap", "Köşegen", "Doğru"], "Yarıçap merkezi çembere bağlar.", { kind: "circle", showDiameter: false }),
      C("Merkezden geçen ve uçları çemberde olan parça nedir?", "Çap", ["Yarıçap", "Işın", "Açı"], "Çap iki yarıçap uzunluğundadır.", { kind: "circle" }),
      N(`Yarıçapı ${r} cm olan çemberin çapı kaç cm?`, 2 * r, `2 × ${r} = ${2 * r}.`, "cm"),
      N(`Çapı ${2 * (r + d)} cm olan çemberin yarıçapı kaç cm?`, r + d, `${2 * (r + d)} ÷ 2 = ${r + d}.`, "cm"),
      N(l < 3 ? `Pergel açıklığı ${r} cm ise çizilen çemberin yarıçapı kaç cm?` : `Pergel açıklığı ${r} cm'den ${r + d} cm'ye çıkıyor. Çap kaç cm artar?`, l < 3 ? r : 2 * d, l < 3 ? "Pergel açıklığı yarıçaptır." : `Yarıçap ${d} artınca çap ${2 * d} artar.`, "cm"),
      C("Çemberin iç bölgesiyle birlikte oluşturduğu şekil nedir?", "Daire", ["Çap", "Işın", "Doğru"], "Daire, çember ile içindeki bölgenin birleşimidir.", { kind: "disk" }),
      N(l < 3 ? `Bir çemberin iki yarıçapının uzunlukları toplamı ${2 * r} cm. Bir yarıçap kaç cm?` : `Bir çemberin çapı ile yarıçapının uzunlukları toplamı ${3 * r} cm. Çap kaç cm?`, l < 3 ? r : 2 * r, l < 3 ? `${2 * r} ÷ 2 = ${r}.` : `Çap 2 yarıçap; toplam 3 yarıçap. r = ${r}, çap = ${2 * r}.`, "cm"),
      N(`Bir çemberin çapı, yarıçapından ${r} cm daha uzun. Çap kaç cm?`, 2 * r, `Çap − yarıçap = bir yarıçap = ${r}. Çap ${2 * r}.`, "cm"),
      N(`Aynı merkezli çemberlerin yarıçapları ${r} ve ${r + d} cm. Aynı yöndeki yarıçaplar üzerinde iki çember arasındaki uzaklık kaç cm?`, d, `${r + d} − ${r} = ${d}.`, "cm"),
      N(`İki çemberin yarıçapları ${r} ve ${r + d} cm. Çaplarının toplamı kaç cm?`, 4 * r + 2 * d, `Çaplar ${2 * r} ve ${2 * (r + d)}. Toplam ${4 * r + 2 * d}.`, "cm"),
      N(l < 3 ? `Çapı ${2 * r} cm olan çemberin çapı ${2 * d} cm artırılıyor. Yeni yarıçap kaç cm?` : `İlk çemberin çapı ${2 * r} cm. İkinci çemberin yarıçapı ilkinin ${k} katı. İkinci çap kaç cm?`, l < 3 ? r + d : 2 * r * k, l < 3 ? `Yeni çap ${2 * (r + d)}, yarısı ${r + d}.` : `İlk r = ${r}, ikinci r = ${k * r}, çap = ${2 * k * r}.`, "cm"),
      T(l < 3 ? "Merkez, yarıçapı sıfırdan büyük bir çemberin üzerinde bulunur." : "Yarıçapları farklı iki çemberin çapları eşit olabilir.", false, "Merkez çemberin içinde bulunur. Çap yarıçapın iki katıdır; farklı yarıçaplar farklı çaplar verir."),
      N(`Çemberin merkezinden geçen AB çapı ${2 * r} cm. Merkez O olduğuna göre AO + OB + AB kaç cm?`, 4 * r, `${r} + ${r} + ${2 * r} = ${4 * r}.`, "cm"),
      N(l < 3 ? `Bir yarıçap ${r} cm. Aynı çemberin ${k} yarıçapının uzunlukları toplamı kaç cm?` : `İki çemberin çapları toplamı ${4 * r + 2 * d} cm, yarıçapları farkı ${d} cm. Küçük çemberin yarıçapı kaç cm?`, l < 3 ? k * r : r, l < 3 ? `${k} × ${r} = ${k * r}.` : `Yarıçapların toplamı ${2 * r + d}; farkı ${d}. Küçük yarıçap = (${2 * r + d} − ${d}) ÷ 2 = ${r}.`, "cm")
    ];
  };

  builders.dikme = l => {
    const a = 4 + l * 3, b = l + 2, n = l + 2;
    return [
      C("Bir noktadan bir doğruya olan en kısa uzaklık hangi parçayla ölçülür?", "Dikme", ["Herhangi bir eğik parça", "Paralel doğru", "Çember"], "Noktadan doğruya çizilen dik parça en kısa yolu verir.", { kind: "perp" }),
      C(l < 3 ? "Diklik işareti hangisidir?" : "AB ⊥ d yazımındaki sembolün anlamı nedir?", l < 3 ? "⊥" : "AB, d'ye diktir", l < 3 ? ["//", "∠", "="] : ["AB, d'ye paraleldir", "AB bir çemberdir", "AB ve d çakışıktır"], "⊥ diklik anlamına gelir."),
      N(l < 3 ? "Bir dikmenin doğruyla oluşturduğu açı kaç derecedir?" : `${n} farklı noktadan bir doğruya dikmeler çiziliyor. Her noktadan yalnız bir tane çizilirse toplam kaç dikme olur?`, l < 3 ? 90 : n, l < 3 ? "Diklik 90°dir." : "Her noktadan doğruya yalnız bir dik doğru çizilebilir.", l < 3 ? "°" : ""),
      T("Bir doğrunun üzerindeki bir noktadan da o doğruya dik bir doğru çizilebilir.", true, "Dik doğru hem doğrunun üzerindeki hem dışındaki bir noktadan çizilebilir."),
      C("Dik çizim yapmak için hangi araç özellikle uygundur?", "Gönye", ["Yalnız pergel", "Hesap makinesi", "Terazi"], "Gönyenin dik köşesi 90°lik çizim sağlar."),
      C(l < 3 ? "Hangisi bir düzlem modelidir?" : "Bir masa yüzeyinin kenarları var. Modellediği matematiksel düzlemin de kenarı var mı?", l < 3 ? "Tahtanın düz yüzeyi" : "Hayır, düzlem her yönde sonsuza uzanır", l < 3 ? ["Tek nokta", "Bir ışın", "Çemberin yalnız sınırı"] : ["Evet, dört kenarı var", "Evet, bir kenarı var", "Yalnız kalınlığı var"], "Sonlu düz yüzeyler sonsuz düzlemin modelidir."),
      N(`Bir noktanın d doğrusuna dik uzaklığı ${a} cm, eğik yol ${a + b} cm. Dik yol kaç cm daha kısa?`, b, `${a + b} − ${a} = ${b}.`, "cm"),
      N(`Bir direğin zemine dik yüksekliği ${a} m. Aynı uzunlukta ${n} direk için toplam kaç m malzeme gerekir?`, a * n, `${n} × ${a} = ${a * n}.`, "m"),
      N(l < 3 ? `İki dik doğrunun kesişimindeki dört açının toplamı kaç derecedir?` : `İki paralel doğruya dik inen köprünün uzunluğu ${a} m. ${n} eş köprü yapılırsa toplam uzunluk kaç m?`, l < 3 ? 360 : a * n, l < 3 ? "4 × 90 = 360°." : `${n} × ${a} = ${n * a}.`, l < 3 ? "°" : "m"),
      N(`Bir noktadan yola dik uzaklık ${a} m. Öğrenci dik yoldan gidip dönüyor. Toplam kaç m yürür?`, 2 * a, `Gidiş ve dönüş: 2 × ${a} = ${2 * a}.`, "m"),
      N(l < 3 ? `Dik uzaklık ${a} m. Nokta doğruya dik yönde ${b} m daha uzaklaşırsa yeni uzaklık kaç m?` : `Dik uzaklık ${a} m. Nokta doğruya dik yönde ${b} m yaklaşıyor. Yeni uzaklığın ${n} katı kaç m?`, l < 3 ? a + b : (a - b) * n, l < 3 ? `${a} + ${b} = ${a + b}.` : `Yeni uzaklık ${a - b}. ${n} × ${a - b} = ${(a - b) * n}.`, "m"),
      C("Aynı düzlemde aynı doğruya dik iki farklı doğru birbirine göre nasıldır?", "Paralel", ["Mutlaka kesişen", "Çakışık olmak zorunda", "Çember"], "Aynı düzlemde aynı doğruya dik iki farklı doğru paraleldir."),
      N(`Dik bir köprü ${a} m, metre başına maliyet ${b * 100} TL. Köprü maliyeti kaç TL?`, a * b * 100, `${a} × ${b * 100} = ${a * b * 100}.`, "TL"),
      N(l < 3 ? `Bir doğruyu ${n} farklı noktada dik kesen doğrular toplam kaç dik açı oluşturur?` : `Dik köprü ${a} m, eğik alternatif ${a + b} m. Metresi 200 TL olan malzemeyle dik köprü kaç TL tasarruf sağlar?`, l < 3 ? 4 * n : b * 200, l < 3 ? `Her kesişimde 4 açı: 4 × ${n} = ${4 * n}.` : `Uzunluk farkı ${b} m. ${b} × 200 = ${b * 200}.`, l < 3 ? "" : "TL"),
      N(l < 3 ? "Bir doğruya dışındaki bir noktadan kaç farklı dik doğru çizilebilir?" : `Paralel iki kıyı arasındaki dik uzaklık ${a} m. ${n} köprünün her iki ucuna ${b} m bağlantı yolu ekleniyor. Toplam köprü ve bağlantı uzunluğu kaç m?`, l < 3 ? 1 : n * (a + 2 * b), l < 3 ? "Yalnız bir dik doğru vardır." : `Her köprü ve bağlantıları ${a} + 2 × ${b} = ${a + 2 * b} m. ${n} katı ${n * (a + 2 * b)}.`, l < 3 ? "" : "m")
    ];
  };

  builders.paralel = l => {
    const n = l + 2, gap = l + 3, a = 20 + l * 5;
    return [
      C("Aynı düzlemde ortak noktası olmayan iki doğruya ne denir?", "Paralel doğrular", ["Kesişen doğrular", "Dik doğrular", "Çakışık doğrular"], "Paralel doğrular aynı düzlemde kesişmez.", { kind: "parallel" }),
      C(l < 3 ? "Paralellik hangi işaretle gösterilir?" : "AB // CD yazımından hangisi çıkar?", l < 3 ? "//" : "AB ve CD aynı düzlemde kesişmez", l < 3 ? ["⊥", "∠", "+"] : ["Bir noktada kesişirler", "90° ile kesişirler", "Çapları eşittir"], "// paralellik işaretidir."),
      N("Birbirine paralel iki farklı doğrunun kaç ortak noktası vardır?", 0, "Paralel doğruların ortak noktası yoktur."),
      N(l < 3 ? "İki farklı noktadan kaç farklı doğru geçer?" : `${n} farklı paralel doğruyu bir kesen kesiyor. Kaç kesişim noktası oluşur?`, l < 3 ? 1 : n, l < 3 ? "İki farklı nokta bir tek doğru belirler." : "Kesen her paralel doğruyu bir noktada keser."),
      T(l < 3 ? "Paralel doğruların aralarındaki dik uzaklık sabittir." : "Aynı düzlemde a // b ve b // c ise a ile c farklı doğrular olduklarında paraleldir.", true, "Aynı doğrultudaki farklı doğrular paraleldir; dik uzaklıkları sabittir."),
      C("Tren raylarının düz ve eş aralıklı bölümü hangi ilişkiye modeldir?", "Paralellik", ["Diklik", "Çakışıklık", "Çember"], "Düz raylar aynı doğrultuda, sabit aralıkla ilerler."),
      N(`${n} paralel çizgi arasında ardışık çizgilerin dik uzaklığı ${gap} cm. İlk ve son çizgi arası kaç cm?`, (n - 1) * gap, `${n - 1} aralık × ${gap} = ${(n - 1) * gap}.`, "cm"),
      N(`${n} yatay ve ${l + 1} düşey doğru var. Yataylar kendi aralarında, düşeyler kendi aralarında paralel. Toplam kaç kesişim noktası oluşur?`, n * (l + 1), `Her yatay, ${l + 1} düşeyi keser: ${n} × ${l + 1}.`),
      N(`Birbirine paralel ${n} doğru arasında kaç ardışık şerit bölge vardır?`, n - 1, `${n} çizgi arasında ${n - 1} şerit bulunur; dıştaki iki bölge sorulmadı.`),
      C("Bir doğruya dışındaki bir noktadan aynı düzlemde kaç paralel doğru çizilebilir?", "Yalnız bir", ["Hiç", "İki", "Sonsuz"], "Düzlemde verilen noktadan doğruya tek bir paralel çizilir."),
      N(l < 3 ? `Üç paralel çizginin ardışık uzaklıkları ${gap} ve ${gap + 2} cm. İlk ve son arası kaç cm?` : `${n} paralel çizgi, bir kesenle kesiliyor. Her kesişimde oluşan dört küçük açı sayılırsa toplam kaç açı vardır?`, l < 3 ? 2 * gap + 2 : 4 * n, l < 3 ? `İki aralık toplanır: ${gap} + ${gap + 2}.` : `Her kesişimde 4 açı: 4 × ${n} = ${4 * n}.`),
      N(l < 3 ? "Bir noktadan geçen kaç farklı doğru çizilebilir? Sonsuz için 0 yaz." : `Paralel iki doğruyu kesen doğru, ilk kesişimde ${a}°'lik dar açı oluşturuyor. İkinci kesişimdeki geniş açı kaç derece?`, l < 3 ? 0 : 180 - a, l < 3 ? "Bir noktadan sonsuz doğru geçer. Bu soruda sonsuz için 0 istendi." : `Kesenin oluşturduğu dar açılar eşittir. Geniş açı 180 − ${a} = ${180 - a}.`, l < 3 ? "" : "°"),
      N(`Dikdörtgenin karşılıklı kenarları kaç paralel doğru çifti oluşturur?`, 2, "Üst-alt bir çift, sağ-sol ikinci çifttir."),
      N(l < 3 ? `İlk ve son paralel çizgi arası ${gap * (n - 1)} cm, arada ${n - 1} eş aralık var. Bir aralık kaç cm?` : `${n} yatay ve ${l + 2} düşey çizgiyle kurulan ızgarada en küçük dikdörtgen hücrelerin sayısı kaçtır?`, l < 3 ? gap : (n - 1) * (l + 1), l < 3 ? `${gap * (n - 1)} ÷ ${n - 1} = ${gap}.` : `Yatay aralık ${n - 1}, düşey aralık ${l + 1}. Çarpımları ${(n - 1) * (l + 1)}.`),
      N(l < 3 ? `Birbirine paralel ${n} doğruya bir dik kesen çiziliyor. Kaç dik açı oluşur?` : `Birbirine paralel ${n} doğruyu, birbirine paralel 3 kesen dik kesiyor. Toplam kaç dik açı oluşur?`, l < 3 ? n * 4 : n * 12, l < 3 ? `${n} kesişimde 4'er açı: ${4 * n}.` : `${n} × 3 kesişim, her birinde 4 dik açı: ${12 * n}.`)
    ];
  };

  builders.olcme = l => {
    const a = [30, 36, 48, 50, 60][l - 1], b = 7 + l, k = l + 1, err = 5 * l;
    return [
      N(l < 3 ? "Bir tam dönüş kaç derecedir?" : `Robot ${k} tam tur ve ${a}° daha dönüyor. Toplam kaç derece döner?`, l < 3 ? 360 : k * 360 + a, l < 3 ? "Tam açı 360°dir." : `${k} × 360 + ${a} = ${k * 360 + a}.`, "°"),
      N(l < 3 ? "Yarım dönüş kaç derecedir?" : `${a}°'lik açı, aynı yönde ${b}° ve sonra ${err}° büyütülüyor. Son ölçü kaç derece?`, l < 3 ? 180 : a + b + err, l < 3 ? "360 ÷ 2 = 180°." : `${a} + ${b} + ${err} = ${a + b + err}.`, "°"),
      N(`Bir tam dönüş ${k * 2} eş parçaya ayrılıyor. Her parça kaç derece?`, 360 / (k * 2), `360 ÷ ${k * 2} = ${360 / (k * 2)}.`, "°"),
      dial(l < 3 ? `Açıölçerde ${a}° oluştur.` : `Ölçüsü ${180 - a}° olan açının bütünlerini açıölçerde oluştur.`, a, l < 3 ? `Hedef ${a}°.` : `180 − ${180 - a} = ${a}°. `),
      N(`İç ölçek ${a}°, dış ölçek ${180 - a}°. Kol dış ölçeğin sıfırında başlıyor. Ölçü kaç derece?`, 180 - a, "Başlangıç kolunun sıfırı dış ölçekteyse dış ölçeği okuruz.", "°"),
      N(`Yanlış ölçek ${180 - a}° okundu; doğru ölçü ${a}°. Yanlış ve doğru okuma farkı kaç derece?`, 180 - 2 * a, `${180 - a} − ${a} = ${180 - 2 * a}.`, "°"),
      N(`Açıölçer her dar açıyı ${err}° fazla gösteriyor. Ekranda ${a + err}° varsa gerçek dar açı kaç derece?`, a, `Fazla gösterileni çıkar: ${a + err} − ${err} = ${a}.`, "°"),
      N(`Açıölçer her geniş açıyı ${err}° eksik gösteriyor. Gerçek açı ${110 + l}°. Ekranda kaç derece görünür?`, 110 + l - err, `${110 + l} − ${err} = ${110 + l - err}.`, "°"),
      N(l < 3 ? `Anka ${a}° tahmin etti; gerçek açı ${a + b}°. Tahmin hatası kaç derece?` : `Bozuk açıölçer dar açıyı ${err}° fazla gösteriyor. Ekran ${a + err}°. Gerçek açının tümleri kaç derece?`, l < 3 ? b : 90 - a, l < 3 ? `Gerçek ile tahmin farkı ${b}°.` : `Gerçek ${a}°. Tümleri 90 − ${a} = ${90 - a}°.`, "°"),
      N(`Bir saat kadranında ardışık iki saat çizgisi arasındaki küçük açı kaç derece?`, 30, "Tam tur 360°, 12 eş aralık: 360 ÷ 12 = 30°.", "°"),
      N(`Bir saat kadranında ${k} saat aralığı boyunca aynı yönde dönülüyor. Toplam dönüş kaç derece?`, k * 30, `Her aralık 30°. ${k} × 30 = ${k * 30}.`, "°"),
      N(`Bir doğru açı ${a}° ve ${b}°'lik iki parçayla üçüncü parçaya ayrılıyor. Üçüncü parça kaç derece?`, 180 - a - b, `180 − ${a} − ${b} = ${180 - a - b}.`, "°"),
      N(l < 3 ? `Bir dik açı ${k} eş parçaya ayrılıyor. Bir parça kaç derece?` : `İki eş dar açının toplamı ${2 * a}°. Her birinin bütünleri kaç derece?`, l < 3 ? 90 / k : 180 - a, l < 3 ? `90 ÷ ${k} = ${90 / k}.` : `Eş açılar ${a}°; bütünleri ${180 - a}°.`, "°"),
      N(`Derece yerine "adım" kullanan bir araçta tam tur ${360 / k} adım. ${a / k} adım kaç derecedir?`, a, `Bir adım ${k}°. ${a / k} × ${k} = ${a}°.`, "°"),
      N(l < 3 ? `Ölçü ${a}° iken ${b}° daha döndürülen ışın kaç dereceyi gösterir?` : `Bozuk araç dar açıları ${err}° fazla, geniş açıları ${err}° eksik gösteriyor. Gerçekleri ${a}° ve ${120 + l}° olan iki açının ekrandaki ölçüleri toplamı kaç derece?`, l < 3 ? a + b : a + 120 + l, l < 3 ? `${a} + ${b} = ${a + b}.` : `Ekran ${a + err}° ve ${120 + l - err}°. Eşit büyüklükteki zıt hatalar toplamda yok olur: ${a + 120 + l}°.`, "°")
    ];
  };

  builders.durum = l => {
    const a = 25 + 5 * l, n = l + 2;
    return [
      C("Yalnız bir ortak noktası olan iki farklı doğru nasıldır?", "Kesişen", ["Paralel", "Çakışık", "Daire"], "Kesişen doğruların tek ortak noktası vardır.", { kind: "intersect" }),
      C("Bütün noktaları ortak olan iki doğruya ne denir?", "Çakışık", ["Paralel", "Dik", "Bir noktada kesişen"], "Çakışık doğrular üst üste gelir.", { kind: "coincident" }),
      N("İki farklı kesişen doğru, kesişim çevresinde kaç küçük açı oluşturur?", 4, "Kesişimde dört açı oluşur."),
      N(`Kesişen iki doğrunun bir açısı ${a}°. Ters açısı kaç derece?`, a, "Ters açıların ölçüleri eşittir.", "°"),
      N(`Kesişen iki doğrunun bir açısı ${a}°. Komşu açısı kaç derece?`, 180 - a, `Komşu bütünler açılar: 180 − ${a} = ${180 - a}.`, "°"),
      N("İki dik doğru kesiştiğinde kaç dik açı oluşur?", 4, "Dört açının her biri 90°dir."),
      N(`İki paralel doğruyu bir kesen farklı noktalarda kesiyor. Toplam kaç küçük açı oluşur?`, 8, "İki kesişim × 4 açı = 8 açı.", ""),
      N(l < 3 ? "İki paralel doğruyu dik kesen bir doğru toplam kaç dik açı oluşturur?" : `${n} paralel doğruyu dik kesen bir doğru toplam kaç dik açı oluşturur?`, l < 3 ? 8 : 4 * n, l < 3 ? "2 × 4 = 8." : `${n} × 4 = ${4 * n}.`),
      N(`İki doğru dik olmadan kesişiyor. Oluşan geniş açıların sayısı kaçtır?`, 2, "Birbirine ters iki geniş, iki dar açı oluşur."),
      N(`Kesişen iki doğrunun dar açısı ${a}°. İki geniş açının toplamı kaç derece?`, 2 * (180 - a), `Her geniş açı ${180 - a}°. İkisi ${2 * (180 - a)}°.`, "°"),
      N(l < 3 ? "Üç farklı doğru tek noktada kesişince kaç küçük açı oluşur?" : `Üç farklı doğru, hiçbir ikisi paralel ve üçü aynı noktada olmayacak biçimde çiziliyor. Kesişim noktalarının sayısı kaçtır?`, l < 3 ? 6 : 3, l < 3 ? "Ortak noktadan çıkan 6 ışın, 6 küçük açı oluşturur." : "Her doğru çifti farklı bir noktada kesişir: 3 çift, 3 nokta."),
      N(`Üç farklı doğru tek noktada eş küçük açılarla kesişiyor. Bir küçük açı kaç derece?`, 60, "360 ÷ 6 = 60°.", "°"),
      N(l < 3 ? `Bir kesişimde bir dar açı ${a}°. Diğer dar açıyla toplamları kaç derece?` : `İki kesişimde dar açıların ölçüleri ${a}° ve ${a + 10}°. Her kesişimdeki iki geniş açı birlikte toplam kaç derece?`, l < 3 ? 2 * a : 2 * (180 - a) + 2 * (170 - a), l < 3 ? `Ters dar açılar eşit: 2 × ${a}.` : `Geniş açılar ${180 - a}° ve ${170 - a}°. İkişer tane: ${700 - 4 * a}°.`, "°"),
      N(l < 3 ? "Paralel iki doğruya bir kesen çizilirse kaç kesişim noktası olur?" : `Üç farklı doğru tek noktada kesişiyor. Art arda gelen üç küçük açının ikisi ${a}° ve ${a + 10}°. Bu üç açı bir doğru açı oluşturduğuna göre üçüncüsü kaç derece?`, l < 3 ? 2 : 170 - 2 * a, l < 3 ? "Kesen her doğruyu ayrı bir noktada keser." : `180 − ${a} − ${a + 10} = ${170 - 2 * a}.`, l < 3 ? "" : "°"),
      N(l < 3 ? `Kesişen iki doğrunun dört açısının toplamı kaç derece?` : `Birbirine paralel ${n} doğruyu iki paralel kesen dik olmadan kesiyor. Bütün kesişimlerde toplam kaç geniş açı vardır?`, l < 3 ? 360 : 4 * n, l < 3 ? "Bir tam açı: 360°." : `${2 * n} kesişimde 2'şer geniş açı: ${4 * n}.`)
    ];
  };

  builders.cift = l => {
    const a = 15 + 5 * l, d = 6 * l, k = l < 3 ? l + 1 : [2, 5, 9][l - 3];
    return [
      N(`${a}°'nin tümleri kaç derece?`, 90 - a, `90 − ${a} = ${90 - a}.`, "°"),
      N(`${a}°'nin bütünleri kaç derece?`, 180 - a, `180 − ${a} = ${180 - a}.`, "°"),
      N(`Bir açının tümleri ${90 - a}°. Açının kendisi kaç derece?`, a, `90 − ${90 - a} = ${a}.`, "°"),
      N(`Bir açının bütünleri ${180 - a}°. Açının kendisi kaç derece?`, a, `180 − ${180 - a} = ${a}.`, "°"),
      N(`Ters iki açıdan biri ${a + d}°. Diğeri kaç derece?`, a + d, "Ters açılar birbirine eşittir.", "°"),
      N(l < 3 ? "Eş iki tümler açının biri kaç derecedir?" : `Tümler iki açıdan biri diğerinden ${d}° büyük. Küçük açı kaç derece?`, l < 3 ? 45 : (90 - d) / 2, l < 3 ? "90 ÷ 2 = 45°." : `Fark çıkarılıp ikiye bölünür: (90 − ${d}) ÷ 2 = ${(90 - d) / 2}.`, "°"),
      N(l < 3 ? "Eş iki bütünler açının biri kaç derecedir?" : `Bütünler iki açıdan biri diğerinden ${d}° büyük. Büyük açı kaç derece?`, l < 3 ? 90 : (180 + d) / 2, l < 3 ? "180 ÷ 2 = 90°." : `(180 + ${d}) ÷ 2 = ${(180 + d) / 2}.`, "°"),
      N(`Bir açının bütünleri ile tümleri arasındaki fark kaç derecedir?`, 90, "(180 − açı) − (90 − açı) = 90°.", "°"),
      N(`Bir açının tümleri ${a}°. Bu açının bütünleri kaç derece?`, 90 + a, `Açı ${90 - a}°. Bütünleri 180 − ${90 - a} = ${90 + a}.`, "°"),
      N(`Bir açının bütünleri ${180 - a}°. Bu açının tümleri kaç derece?`, 90 - a, `Açı ${a}°. Tümleri ${90 - a}°.`, "°"),
      N(`Bir dik açıya komşu üç parça çiziliyor. İlk ikisi ${a}° ve ${d}°. Üçüncüsü kaç derece?`, 90 - a - d, `90 − ${a} − ${d} = ${90 - a - d}.`, "°"),
      N(`Bir doğru açı üç parçaya ayrılıyor: ${a}°, ${a + d}° ve bilinmeyen. Bilinmeyen kaç derece?`, 180 - 2 * a - d, `180 − ${a} − ${a + d} = ${180 - 2 * a - d}.`, "°"),
      N(l < 3 ? `Tümler açılardan biri ${a}°. Diğeri ilkinden kaç derece büyüktür?` : `Tümler iki açıdan büyük olan küçüğün ${k} katı. Küçük açı kaç derece?`, l < 3 ? 90 - 2 * a : 90 / (k + 1), l < 3 ? `Diğeri ${90 - a}°. Fark ${90 - 2 * a}°.` : `Toplam ${k + 1} eş pay: 90 ÷ ${k + 1} = ${90 / (k + 1)}.`, "°"),
      N(l < 3 ? `Bütünler iki açıdan biri ${a}°. İki açı arasındaki fark kaç derece?` : `Bütünler iki açıdan büyük olan küçüğün ${k} katı. Büyük açı kaç derece?`, l < 3 ? 180 - 2 * a : 180 * k / (k + 1), l < 3 ? `Diğeri ${180 - a}°. Fark ${180 - 2 * a}°.` : `Küçük açı 180 ÷ ${k + 1}. Büyük açı bunun ${k} katı: ${180 * k / (k + 1)}.`, "°"),
      N(l < 3 ? `Bir açı ${a}° artırıldığında 90° oluyor. Başlangıç kaç derece?` : `Bir açının bütünleri, tümlerinin ${k + 1} katı. Açının kendisi kaç derece?`, l < 3 ? 90 - a : 90 - 90 / k, l < 3 ? `90 − ${a} = ${90 - a}.` : `Bütünler, tümlerden 90° fazladır. ${k} tümler payı 90°; tümler ${90 / k}°, açı ${90 - 90 / k}°.`, "°")
    ];
  };

  builders.cokgen = l => {
    const n = l + 3, s = l + 2, m = l + 2;
    return [
      N(`${n} kenarlı bir çokgenin kaç köşesi vardır?`, n, "Kenar sayısı ile köşe sayısı eşittir.", "", { kind: "polygon", n }),
      N(`${n + 1} köşeli çokgenin kaç iç açısı vardır?`, n + 1, "Her köşede bir iç açı vardır."),
      N("Bir çokgenin en az kaç kenarı olmalıdır?", 3, "En az üç doğru parçasıyla kapalı bir şekil oluşur."),
      C(l < 3 ? "Hangisi her zaman düzgün çokgendir?" : "Bir çokgenin bütün kenarları eşit, iç açıları farklı. Düzgün müdür?", l < 3 ? "Kare" : "Hayır, açıları da eşit olmalıdır", l < 3 ? ["Her dikdörtgen", "Her üçgen", "Çember"] : ["Evet, yalnız kenar yeter", "Evet, yalnız kapalı olması yeter", "Yalnız köşe sayısı çiftse"], "Düzgün çokgende hem kenarlar hem iç açılar eşittir."),
      N(`Kenarları ${s} cm olan düzgün ${n}genin çevresi kaç cm?`, n * s, `${n} kenar × ${s} cm = ${n * s}.`, "cm"),
      N(`Düzgün ${n}genin çevresi ${n * s} cm. Bir kenarı kaç cm?`, s, `${n * s} ÷ ${n} = ${s}.`, "cm"),
      N(`Bir ${n}genin kenar ve köşe sayılarının toplamı kaçtır?`, 2 * n, `${n} + ${n} = ${2 * n}.`),
      N(`Bir ${n}genin kenar, köşe ve iç açı sayılarının toplamı kaçtır?`, 3 * n, `Üçü de ${n}: 3 × ${n} = ${3 * n}.`),
      N(l < 3 ? "Üçgenin kaç köşegeni vardır?" : `Bir ${n}genin bir köşesinden kaç köşegen çizilir?`, l < 3 ? 0 : n - 3, l < 3 ? "Her iki köşe zaten komşudur; köşegen yoktur." : `Kendisine ve iki komşusuna köşegen çizilemez: ${n} − 3 = ${n - 3}.`),
      N(l < 3 ? "Dörtgenin kaç köşegeni vardır?" : `Bir ${n}genin bütün köşegenlerini say. Kaç farklı köşegen vardır?`, l < 3 ? 2 : n * (n - 3) / 2, l < 3 ? "İki karşılıklı köşe çifti vardır: AC ve BD." : `Her köşeden ${n - 3}; her köşegen iki kez sayılır. ${n} × ${n - 3} ÷ 2 = ${n * (n - 3) / 2}.`),
      N(`Bir çokgenin iç açısı ${100 + l * 5}°. Bu açıya komşu dış açısı kaç derece?`, 80 - l * 5, `İç açı ile komşu dış açı bütünlerdir: 180 − ${100 + l * 5}.`, "°"),
      N(l < 3 ? `${m} ayrı beşgenin toplam kaç kenarı vardır?` : `Bir ${n}genin bir köşesinden bütün köşegenler çizilerek içi üçgenlere ayrılıyor. Kaç üçgen oluşur?`, l < 3 ? 5 * m : n - 2, l < 3 ? `${m} × 5 = ${5 * m}.` : `Bir köşeden yelpaze şeklinde çizerek say: ${n} − 2 = ${n - 2} üçgen.`),
      N(l < 3 ? `Bir düzgün ${n}genin her kenarı ${s} cm. Her kenara bir boncuk konulsa kaç boncuk olur?` : `Kenar uzunlukları ${s} cm olan iki düzgün ${n}gen bir kenarları ortak olacak biçimde birleştiriliyor. Dış sınır kaç cm?`, l < 3 ? n : (2 * n - 2) * s, l < 3 ? `Her kenara bir tane: ${n}.` : `Ortak kenar iki kez içte kalır: (2 × ${n} − 2) × ${s} = ${(2 * n - 2) * s}.`, l < 3 ? "" : "cm"),
      N(l < 3 ? `Kenarları ${s} cm olan bir kare ile eşkenar üçgenin çevreleri farkı kaç cm?` : `Bir ${n}genin her kenarı ${s} cm artırılıyor. Çevre kaç cm artar?`, l < 3 ? s : n * s, l < 3 ? `4 × ${s} − 3 × ${s} = ${s}.` : `${n} kenarın her biri ${s} artar: ${n * s}.`, "cm"),
      N(l < 3 ? `Bir üçgen ve bir ${n}genin toplam köşe sayısı kaçtır?` : `Bir çokgenin kenar ve köşe sayıları toplamı ${2 * n}. Bir köşesinden çizilen köşegen sayısı kaç?`, l < 3 ? n + 3 : n - 3, l < 3 ? `3 + ${n} = ${n + 3}.` : `Kenar sayısı ${2 * n} ÷ 2 = ${n}. Köşegen sayısı ${n} − 3 = ${n - 3}.`)
    ];
  };

  builders.ucgen = l => {
    const a = 20 + 6 * l, b = 35 + 5 * l, s = 10 + 6 * l, d = 6 * l;
    return [
      N(l < 3 ? "Bir üçgenin iç açıları toplamı kaç derece?" : `Üçgenin iki açısı ${a}° ve ${b}°. Üçüncü açı kaç derece?`, l < 3 ? 180 : 180 - a - b, l < 3 ? "Üçgenin iç açıları toplamı 180°dir." : `180 − ${a} − ${b} = ${180 - a - b}.`, "°"),
      N(`Üçgende iki açı ${a}° ve ${a + 10}°. Eksik açı kaç derece?`, 170 - 2 * a, `180 − ${a} − ${a + 10} = ${170 - 2 * a}.`, "°"),
      N(`Dik üçgende bir dar açı ${a}°. Diğeri kaç derece?`, 90 - a, `90 − ${a} = ${90 - a}.`, "°"),
      C(`Açıları ${a}°, ${b}° ve ${180 - a - b}° olan üçgen açılarına göre nasıldır?`, 180 - a - b === 90 ? "Dik açılı" : 180 - a - b > 90 ? "Geniş açılı" : "Dar açılı", ["Dik açılı", "Geniş açılı", "Dar açılı"], "Önce eksik açıyı bul; sonra en büyük açıyı 90° ile karşılaştır."),
      N(`Eşkenar üçgenin bir iç açısı kaç derecedir?`, 60, "180 ÷ 3 = 60°.", "°"),
      N(`İkizkenar üçgenin tepe açısı ${2 * a}°. Eş taban açılarının her biri kaç derece?`, 90 - a, `(180 − ${2 * a}) ÷ 2 = ${90 - a}.`, "°"),
      N(`İkizkenar üçgenin taban açılarından biri ${a}°. Tepe açısı kaç derece?`, 180 - 2 * a, `180 − 2 × ${a} = ${180 - 2 * a}.`, "°"),
      N(`Eşkenar üçgenin bir kenarı ${s} cm. Çevresi kaç cm?`, 3 * s, `3 × ${s} = ${3 * s}.`, "cm"),
      N(l < 3 ? `Eşkenar üçgenin çevresi ${3 * s} cm. Bir kenarı kaç cm?` : `İkizkenar üçgenin çevresi ${3 * s + d} cm; tabanı ${s + d} cm. Eş kenarların biri kaç cm?`, s, l < 3 ? `${3 * s} ÷ 3 = ${s}.` : `Tabanı çıkar: ${2 * s}. İkiye böl: ${s}.`, "cm"),
      T(l < 3 ? "Bir üçgende iki dik açı olabilir." : "Bir üçgenin bir açısı dar ise üçgen mutlaka dar açılıdır.", false, "Üçgenin bütün açıları toplamı 180°dir. Dik ve geniş açılı üçgenlerde de dar açılar vardır."),
      C(`Kenarları ${s}, ${s + 1}, ${s + 2} cm olan üçgen kenarlarına göre nasıldır?`, "Çeşitkenar", ["Eşkenar", "İkizkenar", "Üçgen değildir"], "Üç uzunluk farklı ve üçgen oluşturabilir."),
      N(l < 3 ? "Dik açılı ikizkenar üçgenin dar açılarından biri kaç derece?" : `Bir üçgenin açıları bir sayının 1, 2 ve 3 katı. En büyük açı kaç derece?`, l < 3 ? 45 : 90, l < 3 ? "(180 − 90) ÷ 2 = 45°." : "Toplam 6 pay 180°. Bir pay 30°, en büyük 3 pay = 90°.", "°"),
      N(l < 3 ? `Bir üçgenin iki açısı 60° ve ${a}°. Üçüncüsü kaç derece?` : `Üçgenin açıları ${a}°, bir bilinmeyen ve bilinmeyenden ${d}° büyük bir açı. Küçük bilinmeyen kaç derece?`, l < 3 ? 120 - a : (180 - a - d) / 2, l < 3 ? `180 − 60 − ${a} = ${120 - a}.` : `(${180 - a} − ${d}) ÷ 2 = ${(180 - a - d) / 2}.`, "°"),
      N(`Bir üçgenin bir iç açısı ${a}°. Bu köşedeki komşu dış açı kaç derece?`, 180 - a, `180 − ${a} = ${180 - a}.`, "°"),
      N(l < 3 ? `Kenarları ${s}, ${s}, ${s + d} cm olan üçgenin çevresi kaç cm?` : `İkizkenar üçgenin eş taban açıları, tepe açısından ${d}° küçük. Tepe açısı kaç derece?`, l < 3 ? 3 * s + d : (180 + 2 * d) / 3, l < 3 ? `${s} + ${s} + ${s + d} = ${3 * s + d}.` : `Üç açı tepeye eşitlense toplam ${180 + 2 * d} olurdu. Üçe böl: ${(180 + 2 * d) / 3}.`, l < 3 ? "cm" : "°")
    ];
  };

  builders.insa = l => {
    const r = l + 3, d = l + 1;
    return [
      C("Geometrik inşada hangi araç çifti kullanılır?", "Pergel ve ölçüsüz cetvel", ["Yalnız açıölçer", "Terazi ve pergel", "Yalnız hesap makinesi"], "Klasik geometrik inşada pergel ve ölçüsüz cetvel kullanılır."),
      N(`AB = ${r} cm. AB üzerine eşkenar üçgen kurmak için A merkezli pergel açıklığı kaç cm olmalı?`, r, "Pergel açıklığı AB uzunluğuna eşit olmalıdır.", "cm"),
      N(`A ve B merkezli iki çemberin yarıçapları ${r} cm, AB = ${r} cm. Kesişim P ile APB üçgeninin çevresi kaç cm?`, 3 * r, `AP = BP = AB = ${r}. Çevre ${3 * r}.`, "cm"),
      C(`Yarıçaplar ${r} ve ${r} cm, merkezler arası ${r + d} cm. Çemberler iki noktada kesişiyor. Merkezler ve bir kesişim noktasıyla oluşan üçgen nedir?`, "İkizkenar", ["Eşkenar", "Çeşitkenar", "Üçgen oluşmaz"], "İki kenar yarıçaplardır ve eşittir; merkezler arası uzunluk farklıdır."),
      C(`Çember yarıçapları ${r}, ${r + 1} cm; merkezler arası ${r + 2} cm. Oluşan üçgen kenarlarına göre nedir?`, "Çeşitkenar", ["Eşkenar", "İkizkenar", "Üçgen oluşmaz"], "Üç kenar farklıdır; bu uzunluklar bir üçgen oluşturur."),
      N(`Yarıçapları ${r} cm, merkezler arası ${r + d} cm olan iki kesişen çemberle kurulan üçgenin çevresi kaç cm?`, 3 * r + d, `İki yarıçap ve merkezler arası: ${r} + ${r} + ${r + d} = ${3 * r + d}.`, "cm"),
      N(`Yarıçaplar ${r} ve ${r + 1} cm. Merkezler arası ${r + 2} cm. Oluşan üçgenin çevresi kaç cm?`, 3 * r + 3, `${r} + ${r + 1} + ${r + 2} = ${3 * r + 3}.`, "cm"),
      N(l < 3 ? "Eşkenar üçgen inşasında iki farklı kesişim noktası, AB'nin iki tarafında kaç eşkenar üçgen verir?" : `Eşkenar APB üçgeninin çevresi ${3 * r} cm. İnşadaki iki çemberin çapları toplamı kaç cm?`, l < 3 ? 2 : 4 * r, l < 3 ? "AB'nin bir üstünde, bir altında: iki eşkenar üçgen." : `Kenar ve yarıçap ${r}. Her çap ${2 * r}; toplam ${4 * r}.`, l < 3 ? "" : "cm"),
      T("Yarıçapları farklı iki kesişen çember her zaman çeşitkenar üçgen verir.", false, "Merkezler arası uzaklık yarıçaplardan birine eşitse iki kenar eşit olur, ikizkenar üçgen çıkar."),
      C(`Yarıçaplar ${r} ve ${r + 1} cm; merkezler arası ${r} cm. Merkezler ve kesişim noktasının üçgeni nedir?`, "İkizkenar", ["Çeşitkenar", "Eşkenar", "Üçgen oluşmaz"], `Kenarlar ${r}, ${r + 1}, ${r}: iki kenar eşit.`),
      N(l < 3 ? `İnşadaki eşkenar üçgenin bir açısı kaç derece?` : `İkizkenar inşada tepe açısı ${2 * (20 + l * 5)}°. Taban açılarından biri kaç derece?`, l < 3 ? 60 : 70 - l * 5, l < 3 ? "Eşkenar üçgenin her açısı 60°dir." : `(180 − ${40 + l * 10}) ÷ 2 = ${70 - l * 5}.`, "°"),
      N(`Eşkenar inşada yarıçap ${r} cm'den ${r + d} cm'ye artırılıyor. Üçgenin çevresi kaç cm artar?`, 3 * d, `Üç kenarın her biri ${d} artar: 3 × ${d} = ${3 * d}.`, "cm"),
      N(l < 3 ? `İki yarıçapı ${r} cm olan inşa üçgeninin tabanı ${r + d} cm. Eş kenarlar toplamı kaç cm?` : `İkizkenar inşa üçgeninin çevresi ${3 * r + d} cm ve tabanı ${r + d} cm. Çemberlerin ortak yarıçapı kaç cm?`, l < 3 ? 2 * r : r, l < 3 ? `İki yarıçap: 2 × ${r} = ${2 * r}.` : `Tabanı çıkar, ikiye böl: (${3 * r + d} − ${r + d}) ÷ 2 = ${r}.`, "cm"),
      N(l < 3 ? `Bir eşkenar üçgenin ${3 * r} cm çevresi var. Kenarı kaç cm?` : `İki çemberin yarıçapları ${r} ve ${r + 1} cm. Merkezler uzaklığı tam sayı ve çemberler iki noktada kesişecek. En büyük merkezler uzaklığı kaç cm?`, l < 3 ? r : 2 * r, l < 3 ? `${3 * r} ÷ 3 = ${r}.` : `İki noktada kesişme için uzaklık yarıçapların toplamından küçük olmalı. Toplam ${2 * r + 1}; en büyük tam sayı ${2 * r}.`, "cm"),
      N(l < 3 ? "Çember çizilirken pergelin kaç ucu merkezde sabit kalır?" : `Yarıçapları ${r} ve ${r + d} cm olan çemberler iki noktada kesişecek. Merkezler uzaklığı tam sayıysa en küçük kaç cm olabilir?`, l < 3 ? 1 : d + 1, l < 3 ? "Sivri uç merkezde sabit kalır." : `Merkezler uzaklığı yarıçap farkı ${d}'den büyük olmalı. En küçük tam sayı ${d + 1}.`, l < 3 ? "" : "cm")
    ];
  };

  builders.okuma = l => {
    const n = [24015, 305708, 82046013, 907035082, 416205008073][l - 1];
    const unit = 10 ** (l + 2), a = l + 2, b = l + 4;
    const slots = (prompt, answer) => ({ kind: "slots", prompt, answer: String(answer), reading: G.sayNumber(answer), explain: `${G.sayNumber(answer)} = ${f(answer)}. Boş basamakların sıfırlarını koru.`, hint: "Bölükleri sağdan üçer rakamla yerleştir." });
    return [
      slots("Okunuşu verilen sayıyı rakamlarla yaz.", n),
      slots("Anka'nın sayı kartını rakamlarla tamamla.", n + 1010 * l),
      C(`${f(n)} sayısının doğru okunuşu hangisi?`, G.sayNumber(n), [G.sayNumber(n + unit), G.sayNumber(n + 100), G.sayNumber(n + 10)], "Bölükleri milyonlar, binler ve birler sırasıyla oku.", { kind: "place", digits: String(n) }),
      N(`${f(n)} sayısı kaç basamaklıdır?`, String(n).length, "Baştaki sıfırlar sayılmaz; yazılı rakam sayısı basamak sayısıdır."),
      N(`${f(n)} sayısında kaç bölük vardır?`, Math.ceil(String(n).length / 3), "Sağdan üçer ayır; soldaki bölük bir veya iki rakamlı da olabilir."),
      N(l < 3 ? `${a} bin ${b} sayısını rakamlarla yaz.` : `${a} milyon ${b} bin ${l} sayısının rakamla yazılışı nedir?`, l < 3 ? a * 1000 + b : a * 1e6 + b * 1000 + l, "Her bölük kendi değerine yerleştirilir; eksik yerler sıfırla doldurulur."),
      N(`${f(n)} sayısının birler bölüğünün değeri kaçtır?`, n % 1000, "En sağdaki üç rakam birler bölüğüdür."),
      N(`${f(n)} sayısının binler bölüğünde yazan sayı kaçtır?`, Math.floor(n / 1000) % 1000, "Sağdan ikinci üçlü binler bölüğüdür. Bölükte yazan sayı isteniyor."),
      N(l < 3 ? `${f(n)} sayısındaki sıfır rakamlarının sayısı kaçtır?` : `${f(n)} sayısının milyonlar bölüğünde yazan sayı kaçtır?`, l < 3 ? [...String(n)].filter(c => c === "0").length : Math.floor(n / 1e6) % 1000, l < 3 ? "Sıfırları tek tek say; sayı içindeki yerlerini atlama." : "Sağdan üçüncü üçlü milyonlar bölüğüdür."),
      N(`${f(n)} sayısının hemen sonrasındaki doğal sayı kaçtır?`, n + 1, `${f(n)} + 1 = ${f(n + 1)}.`),
      N(`${f(n)} sayısının hemen öncesindeki doğal sayı kaçtır?`, n - 1, `${f(n)} − 1 = ${f(n - 1)}.`),
      N(l < 3 ? `${a} bin ile ${b} yüzün toplamı hangi sayıdır?` : `${a} milyar, ${b} milyon ve ${l * 11} birimden oluşan sayıyı yaz.`, l < 3 ? a * 1000 + b * 100 : a * 1e9 + b * 1e6 + l * 11, "Bölükleri değerlerine göre topla; binler bölüğü boşsa 000 yaz."),
      N(l < 3 ? `${f(n)} sayısına 1000 eklenirse hangi sayı olur?` : `${f(n)} sayısının binler bölüğündeki sayı ${l} artırılıyor. Diğer bölükler değişmiyor. Yeni sayı kaçtır?`, n + (l < 3 ? 1000 : l * 1000), `Artış ${l < 3 ? "1" : l} bin, yani ${f(l < 3 ? 1000 : l * 1000)}.`),
      N(l < 3 ? `"${G.sayNumber(a * 10000 + b)}" sayısında onlar basamağına yanlışlıkla ${l} yazılıyor. Yeni sayı nedir?` : `"${G.sayNumber(a * 1e9 + b * 1000 + l)}" sayısının milyonlar bölüğüne 205 ekleniyor. Yeni sayı kaçtır?`, l < 3 ? a * 10000 + l * 10 + b : a * 1e9 + 205 * 1e6 + b * 1000 + l, "Değişen basamağı veya bölüğü bul, diğer rakamları yerinde koru."),
      N(l < 3 ? `En küçük ${l + 3} basamaklı doğal sayı nedir?` : `Milyonlar bölüğü ${a}, binler bölüğü bunun ${l} katı, birler bölüğü ise ${b}. Bu sayı kaçtır?`, l < 3 ? 10 ** (l + 2) : a * 1e6 + a * l * 1000 + b, l < 3 ? "1'in sağına basamak sayısından bir eksik sıfır yaz." : `Bölükler: ${a} | ${String(a * l).padStart(3, "0")} | ${String(b).padStart(3, "0")}.`)
    ];
  };

  builders.basamak = l => {
    const p = l + 2, u = 10 ** p, a = l + 2, b = 9 - l;
    const n = a * u + b * 100 + 41, value = a * u;
    return [
      N(`${f(n)} sayısında ${G.PLACES[p]} basamağındaki rakam kaçtır?`, a, "Basamağı sağdan başlayarak say; rakam ile basamak değerini ayır.", "", { kind: "place", digits: String(n) }),
      N(`${f(n)} sayısındaki ${G.PLACES[p]} basamağının değeri kaçtır?`, value, `${a} × ${f(u)} = ${f(value)}.`),
      N(`${f(n)} sayısında yüzler basamağındaki rakamın değeri kaçtır?`, b * 100, `${b} × 100 = ${b * 100}.`),
      N(`${f(n)} sayısındaki ${G.PLACES[p]} rakamı 1 artırılırsa sayı kaç artar?`, u, `Bu basamakta bir artış ${f(u)} eder.`),
      N(`${f(n)} sayısında birler basamağındaki rakam kaçtır?`, 1, "En sağdaki rakam birler basamağıdır."),
      N(`${f(n)} = ${f(value)} + ${b * 100} + 40 + ? Eksiği bul.`, 1, `Basamak değerlerini tamamla: ${f(n)} − ${f(value)} − ${b * 100} − 40 = 1.`),
      N(`${a} × ${f(u)} + ${b} × 100 + 4 × 10 + 1 hangi sayıdır?`, n, `Basamak değerlerini topla: ${f(n)}.`),
      N(`${f(n)} sayısının rakamları toplamı kaçtır?`, a + b + 5, `Sıfır olmayan rakamlar ${a}, ${b}, 4, 1. Toplam ${a + b + 5}.`),
      N(`${f(n)} sayısındaki en büyük basamak değeri kaçtır?`, value, `En soldaki sıfır olmayan basamak ${G.PLACES[p]}: ${f(value)}.`),
      N(`${f(n)} sayısında ${G.PLACES[p]} rakamı silinip yerine 0 yazılıyor. Kalan sayının değeri kaçtır?`, b * 100 + 41, `En büyük basamak değeri çıkarılır: ${f(n)} − ${f(value)}.`),
      N(l < 3 ? `${f(n)} sayısında onlar rakamı 4'ten 7'ye çıkıyor. Sayı kaç artar?` : `${f(n)} sayısında en soldaki rakam ile birler rakamı yer değiştiriyor. Yeni sayı kaçtır?`, l < 3 ? 30 : u + b * 100 + 40 + a, l < 3 ? "Onlarda 3 artış = 30." : `Yeni ${G.PLACES[p]} rakamı 1, yeni birler rakamı ${a}. Diğerleri korunur.`),
      N(l < 3 ? `${f(n)} sayısına ${f(u)} eklenirse hangi sayı olur?` : `Bir rakamın ${G.PLACES[p]} ve ${G.PLACES[p - 1]} basamaklarındaki değerleri farkı ${f(a * (u - u / 10))}. Rakam kaçtır?`, l < 3 ? n + u : a, l < 3 ? `Yalnız ilgili basamak 1 artar: ${f(n + u)}.` : `Bir rakamın değer farkı ${f(u - u / 10)}. ${f(a * (u - u / 10))} ÷ ${f(u - u / 10)} = ${a}.`),
      N(`${f(n)} sayısının bütün basamak değerleri toplamı kaçtır?`, n, "Çözümlemedeki bütün basamak değerlerinin toplamı sayının kendisidir."),
      N(l < 3 ? `5'in yüzler basamağındaki değeri ile onlar basamağındaki değeri toplamı kaçtır?` : `En soldaki rakamı ${a} olan ${p + 1} basamaklı bir sayının diğer bütün rakamları 0. Bu sayıdan ${b} yüz çıkarılırsa sonuç kaçtır?`, l < 3 ? 550 : value - b * 100, l < 3 ? "500 + 50 = 550." : `${f(value)} − ${b * 100} = ${f(value - b * 100)}.`),
      N(l < 3 ? `${a} rakamının ${G.PLACES[p]} basamağındaki değeri, birler basamağındaki değerinin kaç katıdır?` : `Bir sayının ${G.PLACES[p]} rakamı ${a}'dan ${a - 1}'e düşüyor, yüzler rakamı ${b}'den ${b + 1}'e çıkıyor. Sayı toplam kaç azalır?`, l < 3 ? u : u - 100, l < 3 ? `${f(a * u)} ÷ ${a} = ${f(u)}.` : `Büyük basamaktan ${f(u)} azalır, yüzlerden 100 artar; net azalış ${f(u - 100)}.`)
    ];
  };

  builders.sirala = l => {
    const base = 10 ** (l + 3) + l * 1000, a = base + 216, b = base + 261, c = base + 612, d = base + 621;
    const digits = [l + 1, 0, 8, 9];
    return [
      C(`${f(a)} ile ${f(b)} arasına hangi işaret gelir?`, "<", [">", "="], "Soldan ilk farklı rakamda 1 < 6, dolayısıyla ilk sayı küçüktür."),
      C(`${f(d)} ile ${f(c)} arasına hangi işaret gelir?`, ">", ["<", "="], "Soldan karşılaştır: onlar basamağındaki 2, 1'den büyüktür."),
      C("Aşağıdaki sayılardan en büyüğü hangisidir?", f(d), [f(a), f(b), f(c)], "Basamakları soldan karşılaştır."),
      C("Aşağıdaki sayılardan en küçüğü hangisidir?", f(a), [f(b), f(c), f(d)], "İlk farkta küçük rakamı içeren sayı küçüktür."),
      order("Sayı kartlarını küçükten büyüğe sırala.", [c, a, d, b]),
      order("Sıfırlara dikkat ederek küçükten büyüğe sırala.", [base + 1001, base + 101, base + 11, base + 110]),
      order("Birbirine çok yakın bu sayıları küçükten büyüğe sırala.", [base * 10 + 9, base * 10 - 1, base * 10 + 1, base * 10]),
      N(`${f(a)} ve ${f(d)} arasındaki büyüklük farkı kaçtır?`, d - a, `${f(d)} − ${f(a)} = ${d - a}.`),
      N(`${f(a)} sayısından büyük en küçük doğal sayı nedir?`, a + 1, "Bir ekle."),
      N(`${f(b)} sayısından küçük en büyük doğal sayı nedir?`, b - 1, "Bir çıkar."),
      N(l < 3 ? `${f(a)} ile ${f(a + l + 3)} arasında, uçlar hariç kaç doğal sayı vardır?` : `${f(a)} < N < ${f(a + 10 * l)} koşulunda N doğal sayı. Kaç değer vardır?`, l < 3 ? l + 2 : 10 * l - 1, "İki tam sayı arasındaki, uçlar hariç doğal sayı sayısı: büyük − küçük − 1."),
      N(`${digits.join(", ")} rakamlarının her birini bir kez kullanarak yazılan en büyük dört basamaklı sayı kaçtır?`, Number([...digits].sort((x, y) => y - x).join("")), "Rakamları büyükten küçüğe diz."),
      N(`${digits.join(", ")} rakamlarının her birini bir kez kullanarak yazılan en küçük dört basamaklı sayı kaçtır?`, Number([l + 1, 0, 8, 9].join("")), "En küçük sıfır olmayan rakam başa, ardından sıfır ve kalanlar küçükten büyüğe."),
      N(l < 3 ? `${f(base + 400)}'e ${f(a)} mı, ${f(c)} mi daha yakın? Yakın olan sayıyı yaz.` : `${f(base + 416)} sayısına uzaklığı ${l * 10} olan iki doğal sayının toplamı kaçtır?`, l < 3 ? a : 2 * (base + 416), l < 3 ? `Uzaklıklar ${base + 400 - a} ve ${c - base - 400}; daha yakını ${f(a)}.` : "Aynı miktarda eksi ve artı uzaklıklar toplamda yok olur; merkez sayının iki katı kalır."),
      N(l < 3 ? `${f(a)} < ${f(base + 200)} + ? eşitsizliğini sağlayan en küçük doğal sayı kaçtır?` : `${f(a)} < N < ${f(c)} ve N'nin onlar ve birler basamakları 0. Bu koşulu sağlayan kaç doğal sayı vardır?`, l < 3 ? 17 : 4, l < 3 ? "216 < 200 + ? için ? en az 17 olmalıdır." : `${f(base + 300)}, ${f(base + 400)}, ${f(base + 500)}, ${f(base + 600)}: 4 sayı.`)
    ];
  };

  builders.islem = l => {
    const a = 1200 * 10 ** (l - 1) + 237 * l, b = 800 * 10 ** (l - 1) + 163 * l, c = 71 * l, k = l + 2;
    return [
      N(`${f(a)} + ${f(b)} = ?`, a + b, `${f(a)} + ${f(b)} = ${f(a + b)}.`),
      N(`${f(a)} − ${f(b)} = ?`, a - b, `${f(a)} − ${f(b)} = ${f(a - b)}.`),
      N(`${f(a)} + ? = ${f(a + b)}. Eksik toplanan kaç?`, b, `Toplamdan bilinen çıkarılır: ${f(a + b)} − ${f(a)}.`),
      N(`? − ${f(b)} = ${f(a)}. Eksilen kaç?`, a + b, "Eksilen = fark + çıkan."),
      N(`${f(a)} − ? = ${f(b)}. Çıkan kaç?`, a - b, "Çıkan = eksilen − fark."),
      N(`Kütüphanede ${f(a)} kitap vardı. ${f(b)} kitap geldi, ${c} kitap ödünç verildi. İçeride kaç kitap kaldı?`, a + b - c, `${f(a)} + ${f(b)} − ${c} = ${f(a + b - c)}.`),
      N(`Hedef ${f(a + b + c)} puan. Şimdi ${f(a)} puan var. Hedefe kaç puan kaldı?`, b + c, `Hedef − mevcut = ${f(b + c)}.`),
      N(l < 3 ? `Bir toplamda ilk toplanan ${c} artarsa, diğer değişmezken toplam kaç artar?` : `Bir toplamda ilk toplanan ${c} artıyor, ikinci ${2 * c} azalıyor. Toplam kaç azalır?`, c, l < 3 ? "Diğer toplanan sabitse toplam aynı miktarda artar." : `Artış ${c}, azalış ${2 * c}; net azalış ${c}.`),
      N(l < 3 ? `Bir çıkarma işleminde eksilen ${c} artıyor. Çıkan değişmezse fark kaç artar?` : `Bir çıkarmada eksilen ${3 * c} ve çıkan ${c} artıyor. Fark kaç artar?`, l < 3 ? c : 2 * c, l < 3 ? "Eksilen ne kadar artarsa fark da o kadar artar." : `${3 * c} − ${c} = ${2 * c}.`),
      N(`${f(a)} + ${c} − ${c} + ${f(b)} işleminin sonucu kaçtır?`, a + b, "Eklenen ve çıkarılan eşit miktarlar birbirini götürür."),
      N(`Üç günün kitap okuma sayıları ${c}, ${c + 10}, ${c + 20}. Toplam kaç sayfa?`, 3 * c + 30, `${c} + ${c + 10} + ${c + 20} = ${3 * c + 30}.`, "sayfa"),
      N(l < 3 ? `${f(a)} TL'den ${c} ve ${2 * c} TL harcanıyor. Kaç TL kalır?` : `Bir hesaba ${f(a)} TL yatırılıyor. Sonra ${k} kez ${c} TL çekiliyor, ${f(b)} TL ekleniyor. Bakiye kaç TL?`, l < 3 ? a - 3 * c : a - k * c + b, l < 3 ? `${f(a)} − (${c} + ${2 * c}) = ${f(a - 3 * c)}.` : `${f(a)} − ${k} × ${c} + ${f(b)} = ${f(a - k * c + b)}.`, "TL"),
      N(l < 3 ? `${f(a)} ile ${f(b)} toplamının ${c} eksiği kaç?` : `İki sayının toplamı ${f(a + b)}, farkı ${f(a - b)}. Büyük sayı kaç?`, l < 3 ? a + b - c : a, l < 3 ? `Önce topla, sonra ${c} çıkar.` : `Toplam ile farkı toplayıp ikiye böl: (${f(a + b)} + ${f(a - b)}) ÷ 2 = ${f(a)}.`),
      N(l < 3 ? `Bir sayıya ${c} ekleyince ${f(a)} oluyor. Sayı kaç?` : `İki sayının toplamı ${f(a + b)}, farkı ${f(a - b)}. Küçük sayı kaç?`, l < 3 ? a - c : b, l < 3 ? `${f(a)} − ${c} = ${f(a - c)}.` : `(Toplam − fark) ÷ 2 = ${f(b)}.`),
      N(l < 3 ? `${f(a)} − (${c} + ${c}) = ?` : `Dört ardışık doğal sayının toplamı ${4 * c + 6}. En büyük sayı kaç?`, l < 3 ? a - 2 * c : c + 3, l < 3 ? `Önce parantez: ${2 * c}; sonuç ${f(a - 2 * c)}.` : `Sayıları eşitlemek için 0 + 1 + 2 + 3 = 6 çıkar. En küçük ${c}, en büyük ${c + 3}.`)
    ];
  };

  builders.carpan = l => {
    const a = 12 + 7 * l, b = l + 3, k = 10 ** (l - 1), n = a * b, rem = b - 1;
    return [
      N(`${a} × ${b} = ?`, n, `${a} × ${b} = ${n}.`),
      N(`${f(n * k)} ÷ ${b} = ?`, a * k, `Bölmeyi çarpmayla kontrol et: ${f(a * k)} × ${b} = ${f(n * k)}.`),
      N(`${a} × ${f(b * k * 10)} = ?`, n * k * 10, `Önce ${a} × ${b}, sonra ${f(k * 10)} ile çarp.`),
      N(`${a} × ? = ${n}. Eksik çarpan kaç?`, b, `${n} ÷ ${a} = ${b}.`),
      N(`? ÷ ${b} = ${f(a * k)}. Bölünen kaç?`, n * k, "Bölünen = bölen × bölüm; kalan sıfır."),
      N(`${n + rem} ÷ ${b} işleminde kalan kaçtır?`, rem, `${n + rem} = ${b} × ${a} + ${rem}. Kalan bölenden küçüktür.`),
      N(`Bölen ${b}, bölüm ${a}, kalan ${rem}. Bölünen kaçtır?`, n + rem, `${b} × ${a} + ${rem} = ${n + rem}.`),
      N(`${n + rem} öğrenci ${b} kişilik kabinlerle taşınacak. En az kaç sefer gerekir?`, a + 1, `${a} sefer ${n} kişiyi taşır; kalan ${rem} kişi için bir sefer daha.`, "sefer"),
      N(`${f(n * k)} TL ile tanesi ${f(b * k)} TL olan üründen en çok kaç tane alınır?`, a, `Bütçeyi fiyata böl: ${f(n * k)} ÷ ${f(b * k)} = ${a}.`),
      N(l < 3 ? `${a} kutunun her birinde ${b} kalem var. Toplam kaç kalem?` : `${a} kutunun her birinde ${b} paket, her pakette ${l + 2} kalem var. Toplam kaç kalem?`, l < 3 ? n : n * (l + 2), l < 3 ? `${a} × ${b} = ${n}.` : `${a} × ${b} × ${l + 2} = ${n * (l + 2)}.`),
      N(l < 3 ? `${n * 10} ÷ ${b * 10} = ?` : `${f(n * k)} ÷ ${f(b * k)} + ${a} × ${b} işlemi kaçtır?`, l < 3 ? a : a + n, l < 3 ? "Bölüneni ve böleni aynı sayıya bölmek bölümü değiştirmez." : `Bölme ${a}, çarpma ${n}; toplam ${a + n}.`),
      N(`Bir çarpımda çarpanlardan biri ${l + 2} katına çıkıyor, diğer sabit. Çarpım kaç katına çıkar?`, l + 2, "Diğer çarpan sabitken çarpım aynı katla büyür."),
      N(l < 3 ? `${n} bilye ${b} kişiye eşit paylaşılıyor. Kişi başı kaç?` : `${n + rem} bilyeden ${rem} tanesi ayrılıyor. Kalanlar ${b} kişiye eşit paylaşılıyor. Kişi başı kaç?`, a, l < 3 ? `${n} ÷ ${b} = ${a}.` : `Önce çıkar: ${n}. Sonra böl: ${a}.`),
      N(l < 3 ? `${a} × (${b} + 1) = ?` : `Bölen ${b}, bölüm ${a}. Kalanın alabileceği en büyük değer kullanıldığında bölünen kaçtır?`, l < 3 ? a * (b + 1) : n + rem, l < 3 ? `${a} × ${b + 1} = ${a * (b + 1)}.` : `En büyük kalan ${b - 1}. Bölünen ${b} × ${a} + ${b - 1} = ${n + rem}.`),
      N(l < 3 ? `${n} ÷ ${a} = ?` : `Bir üründen ${a} tane alınıyor; tanesi ${b * 10} TL. Kasada ${l * 10} TL indirim uygulanıyor. ${n * 10 + 100} TL veren kişi kaç TL para üstü alır?`, l < 3 ? b : 100 + l * 10, l < 3 ? "Çarpmayı tersinden düşün." : `Tutar ${n * 10}, indirimli tutar ${n * 10 - l * 10}. Para üstü ${100 + l * 10}.`, l < 3 ? "" : "TL")
    ];
  };

  builders.problem = l => {
    const n = 16 + l * 8, p = 15 + l * 5, k = l + 2, extra = l * 7, budget = n * p + extra;
    return [
      N(`Geziye ${n} öğrenci katılıyor. Bilet ${p} TL. Toplam bilet tutarı kaç TL?`, n * p, `${n} × ${p} = ${n * p}.`, "TL"),
      N(`${n * k} kitap ${k} sınıfa eşit dağıtılıyor. Her sınıfa kaç kitap?`, n, `${n * k} ÷ ${k} = ${n}.`),
      N(`${budget} TL'nin ${n * p} TL'si harcanıyor. Kaç TL kalır?`, extra, `${budget} − ${n * p} = ${extra}.`, "TL"),
      N(`${n} öğrenci için ${k} kişilik araçlar tutulacak. En az kaç araç gerekir?`, Math.ceil(n / k), `Böl: ${n} ÷ ${k}. Kalan varsa son grup için bir araç daha gerekir.`),
      N(`Kütüphane ${n} gün boyunca günde ${p} kitap alıyor. Sonra ${extra} kitap bağışlıyor. Kaç yeni kitap kalır?`, n * p - extra, `${n} × ${p} − ${extra} = ${n * p - extra}.`),
      N(`Bir depoda ${n * k} kg ürün var. ${extra} kg ayrılıyor. Kalanın tamamı ${k} kg'lık çuvallara dolduruluyor. Tam dolan çuval sayısı kaçtır?`, Math.floor((n * k - extra) / k), `Önce ${extra} kg çıkar; sonra ${k}'ye böl. Yalnız tam dolu çuvallar isteniyor.`),
      N(`Bir öğrenci ${k} hafta, haftada 5 gün, günde ${p} sayfa okuyor. Toplam kaç sayfa?`, k * 5 * p, `${k} × 5 × ${p} = ${k * 5 * p}.`, "sayfa"),
      N(`Bir mağazada ${n} ürünün ${k} tanesi satılmıyor. Kalanlar ${p} TL'den satılıyor. Gelir kaç TL?`, (n - k) * p, `Önce satılanı bul: ${n - k}. Sonra ${p} ile çarp.`, "TL"),
      N(l < 3 ? `Bir otobüs ${n} km gidip aynı yoldan dönüyor. Toplam kaç km?` : `Servis her gün ${n} km gidiş ve aynı yoldan dönüş yapıyor. ${k} günde toplam kaç km?`, l < 3 ? 2 * n : 2 * n * k, l < 3 ? `2 × ${n} = ${2 * n}.` : `${n} × 2 × ${k} = ${2 * n * k}.`, "km"),
      N(`Sınıf ${budget} TL topluyor. ${k} öğrenciye ${p} TL'lik kitap alınıyor. Kalan para kaç TL?`, budget - k * p, `${budget} − ${k} × ${p} = ${budget - k * p}.`, "TL"),
      N(l < 3 ? `Bir çiftçi ${n} kasaya ${k} kg meyve koyuyor. Toplam kaç kg?` : `Bir çiftçi ${n} kasaya ${k} kg meyve koyuyor. Toplam ${extra} kg meyve bozuluyor. Sağlam meyveler kilosu ${p} TL'den satılırsa gelir kaç TL?`, l < 3 ? n * k : (n * k - extra) * p, l < 3 ? `${n} × ${k}.` : `Sağlam miktar ${n * k - extra} kg. ${p} ile çarp: ${(n * k - extra) * p}.`, l < 3 ? "kg" : "TL"),
      N(l < 3 ? `Fiyatı ${p} TL olan ${k} defter ve ${extra} TL'lik kalem alınıyor. Toplam kaç TL?` : `${budget} TL bütçeden önce ${extra} TL ayrılıyor. Her biri ${p} TL olan kitaplardan en çok kaç tane alınır?`, l < 3 ? p * k + extra : n, l < 3 ? `${p} × ${k} + ${extra}.` : `Kalan ${n * p} TL. ${n * p} ÷ ${p} = ${n}.`, l < 3 ? "TL" : ""),
      N(l < 3 ? `Bir yarışmada ${n} puana ${extra} puan ekleniyor. Toplam kaç puan?` : `Bir yarışmada doğru cevap ${p} puan, yanlış 0 puan. ${n} sorunun ${k} tanesi yanlış. Toplam kaç puan?`, l < 3 ? n + extra : (n - k) * p, l < 3 ? `${n} + ${extra}.` : `Doğru sayısı ${n - k}; puan ${(n - k) * p}.`),
      N(l < 3 ? `Bir depoda ${n * p} şişe suyun ${extra} tanesi kullanılıyor. Kalan kaç?` : `A paketinde ${k} ürün ${k * p} TL; B paketinde ${k + 1} ürün ${(k + 1) * (p - 2)} TL. Birim fiyatı ucuz paketten ${n} ürün alınırsa kaç TL ödenir?`, l < 3 ? n * p - extra : n * (p - 2), l < 3 ? `${n * p} − ${extra}.` : `Birim fiyatlar ${p} ve ${p - 2} TL. Ucuz birim fiyatla ${n} × ${p - 2} = ${n * (p - 2)}.`, l < 3 ? "" : "TL"),
      N(l < 3 ? `Bir sınıfta ${n} öğrenci var. ${k} kişi yoksa kaç kişi gelmiştir?` : `${n} öğrenci geziye gidiyor. Her ${k} öğrenci için bir yetişkin gerekiyor; eksik grup için de bir yetişkin ayrılıyor. Öğrenci ve yetişkinlerin biletleri ${p} TL ise toplam kaç TL?`, l < 3 ? n - k : (n + Math.ceil(n / k)) * p, l < 3 ? `${n} − ${k}.` : `Yetişkin ${Math.ceil(n / k)} kişi. Toplam ${n + Math.ceil(n / k)} bilet × ${p} = ${(n + Math.ceil(n / k)) * p}.`, l < 3 ? "" : "TL")
    ];
  };

  builders.cevre = l => {
    const a = 9 + 3 * l, b = 3 + l, s = l + 4, p = 2 * (a + b), fee = 5 * l + 10;
    return [
      N(`Kenarları ${a} ve ${b} cm olan dikdörtgenin çevresi kaç cm?`, p, `2 × (${a} + ${b}) = ${p}.`, "cm", { kind: "grid", cols: a, rows: b, cap: "Kareli çizim: kenar uzunluklarını sorudan oku." }),
      N(`Bir kenarı ${s} cm olan karenin çevresi kaç cm?`, 4 * s, `4 × ${s} = ${4 * s}.`, "cm"),
      N(`Çevresi ${4 * s} cm olan karenin bir kenarı kaç cm?`, s, `${4 * s} ÷ 4 = ${s}.`, "cm"),
      N(`Çevresi ${p} cm olan dikdörtgenin kısa kenarı ${b} cm. Uzun kenarı kaç cm?`, a, `${p} ÷ 2 − ${b} = ${a}.`, "cm"),
      N(`Uzun kenar ${a} cm, çevre ${p} cm. Kısa kenar kaç cm?`, b, `${p} ÷ 2 − ${a} = ${b}.`, "cm"),
      N(`Bahçe ${a} m ve ${b} m. Çit için ${l + 1} m kapı boşluğu bırakılıyor. Kaç m çit gerekir?`, p - l - 1, `Çevre ${p}; kapıyı çıkar: ${p - l - 1}.`, "m"),
      N(`Kenarları ${a} ve ${b} m olan bahçenin çitinin metresi ${fee} TL. Tam çevrenin maliyeti kaç TL?`, p * fee, `${p} × ${fee} = ${p * fee}.`, "TL"),
      N(l < 3 ? `Dikdörtgenin her iki uzun kenarı ${l} cm uzatılırsa çevre kaç cm artar?` : `Bir dikdörtgende uzun kenar ${2 * l} cm artıyor, kısa kenar ${l} cm azalıyor. Çevre kaç cm artar?`, 2 * l, l < 3 ? `İki kenar uzar: 2 × ${l}.` : `Kenarlar toplamı ${l} artar; çevre 2 × ${l} = ${2 * l} artar.`, "cm"),
      N(`Kenarları ${a} ve ${b} m olan pistin çevresinde ${s} tur koşuluyor. Toplam kaç m?`, p * s, `${p} × ${s} = ${p * s}.`, "m"),
      N(l < 3 ? `Kenarları toplamı ${a + b} cm olan dikdörtgenin çevresi kaç cm?` : `Dikdörtgenin uzun kenarı kısa kenarının 3 katı. Çevre ${8 * b} cm. Uzun kenar kaç cm?`, l < 3 ? p : 3 * b, l < 3 ? `2 × ${a + b} = ${p}.` : `Çevre kısa kenarın 8 katı. Kısa ${b}, uzun ${3 * b}.`, "cm"),
      N(l < 3 ? `Kenar uzunlukları doğal sayı olan bir dikdörtgenin çevresi tek sayı olabilir mi? Olabilirse 1, olamazsa 0 yaz.` : `Bir dikdörtgenin çevresi ${p} cm, uzun kenarı kısa kenarından ${a - b} cm fazla. Kısa kenar kaç cm?`, l < 3 ? 0 : b, l < 3 ? "Çevre 2 × (a + b) olduğundan daima çifttir." : `Kenar toplamı ${a + b}; farkı ${a - b}. Kısa = (${a + b} − ${a - b}) ÷ 2 = ${b}.`, l < 3 ? "" : "cm"),
      N(`Bir dikdörtgenin kenarları ${a} ve ${b} cm. Aynı çevreli karenin bir kenarı kaç cm?`, p / 4, `${p} ÷ 4 = ${p / 4}.`, "cm"),
      N(l < 3 ? `Bir kenarı ${s} cm olan kare telin toplam uzunluğu kaç cm?` : `Bir kenarı ${s} cm olan 3 kare yan yana, tam kenarları ortak olacak biçimde birleştiriliyor. Dış çevre kaç cm?`, l < 3 ? 4 * s : 8 * s, l < 3 ? `4 × ${s}.` : `Oluşan dikdörtgen ${3 * s} × ${s}. Çevre 2 × ${4 * s} = ${8 * s}.`, "cm"),
      N(l < 3 ? `Kenarları ${a} ve ${b} m olan bahçeye iki sıra tel çekiliyor. Kaç m tel?` : `Kenarları ${a} ve ${b} m olan bahçede ${l} m kapı bırakılıyor. Geri kalan çevreye 3 sıra tel çekiliyor. Kaç m tel?`, l < 3 ? 2 * p : 3 * (p - l), l < 3 ? `2 × ${p}.` : `Kapı hariç ${p - l} m. 3 × ${p - l} = ${3 * (p - l)}.`, "m"),
      N(l < 3 ? `Bir dikdörtgenin çevresi ${p} cm. Uzun ve kısa kenar toplamı kaç cm?` : `Kenarları ${a} ve ${b} m olan bahçede ${l} m kapı var. Metresi ${fee} TL olan çit ve ${l * 100} TL montaj ile toplam maliyet kaç TL?`, l < 3 ? a + b : (p - l) * fee + l * 100, l < 3 ? `${p} ÷ 2 = ${a + b}.` : `Çit ${p - l} m. Maliyet ${p - l} × ${fee} + ${l * 100} = ${(p - l) * fee + l * 100}.`, l < 3 ? "cm" : "TL")
    ];
  };

  builders.alan = l => {
    const a = 8 + 2 * l, b = l + 3, s = l + 2, hole = l + 1, price = 10 + 5 * l;
    return [
      N(`Dikdörtgenin kenarları ${a} ve ${b} cm. Alan kaç cm²?`, a * b, `${a} × ${b} = ${a * b}.`, "cm²", { kind: "grid", cols: a, rows: b }),
      N(`Bir kenarı ${s} cm olan karenin alanı kaç cm²?`, s * s, `${s} × ${s} = ${s * s}.`, "cm²"),
      N(`Alanı ${a * b} cm², bir kenarı ${b} cm olan dikdörtgenin diğer kenarı kaç cm?`, a, `${a * b} ÷ ${b} = ${a}.`, "cm"),
      N(`Dikdörtgen yüzeyde ${a} sütun ve ${b} satır birim kare var. Alan kaç birimkare?`, a * b, "Satır sayısı × sütun sayısı.", "birimkare"),
      C("Bir zeminin kapladığı yüzeyi hangi birimle ifade edebiliriz?", "Metrekare (m²)", ["Metre (m)", "Kilogram (kg)", "Derece (°)"], "Alan kare birimlerle ölçülür."),
      N(`Kenarları ${a} ve ${b} m olan odanın zemininin ${hole} m²'si kaplanmayacak. Kaplanacak alan kaç m²?`, a * b - hole, `${a * b} − ${hole} = ${a * b - hole}.`, "m²"),
      N(`${a} m'ye ${b} m zeminin her m²'si ${price} TL'ye kaplanıyor. Maliyet kaç TL?`, a * b * price, `Alan ${a * b} m²; maliyet ${a * b} × ${price}.`, "TL"),
      N(`Kenarları ${a} ve ${b} cm dikdörtgenden kenarı ${hole} cm olan kare kesiliyor. Kalan alan kaç cm²?`, a * b - hole * hole, `${a} × ${b} − ${hole} × ${hole} = ${a * b - hole * hole}.`, "cm²"),
      N(l < 3 ? `Dikdörtgenin uzun kenarı ${l} cm artıyor, kısa kenarı ${b} cm kalıyor. Alan kaç cm² artar?` : `Kenarları ${a} ve ${b} cm olan dikdörtgenin her kenar uzunluğu 2 katına çıkıyor. Yeni alan kaç cm²?`, l < 3 ? l * b : 4 * a * b, l < 3 ? `Ek şerit alanı ${l} × ${b} = ${l * b}.` : `Alan 2 × 2 = 4 kat: ${4 * a * b}.`, "cm²"),
      N(`Kenarları ${a} ve ${b} m olan dikdörtgen oda, her biri ${b} m² olan halılarla boşluksuz ve üst üste binmeden kaplanıyor. Alan hesabıyla kaç halı gerekir?`, a, `Toplam alanı bir halının alanına böl: ${a * b} ÷ ${b} = ${a}.`),
      N(l < 3 ? `Alanı ${s * s} cm² olan karenin bir kenarı kaç cm?` : `Dikdörtgenin kenarları ${a} ve ${b} cm. Dışına her yönde 1 cm genişliğinde çerçeve ekleniyor. Yalnız çerçeve alanı kaç cm²?`, l < 3 ? s : (a + 2) * (b + 2) - a * b, l < 3 ? `${s} × ${s} = ${s * s}.` : `Dış alan ${(a + 2) * (b + 2)}, iç alan ${a * b}; fark ${(a + 2) * (b + 2) - a * b}.`, l < 3 ? "cm" : "cm²"),
      N(l < 3 ? `Alanı ${a * b} m² olan ${s} eş odanın toplam alanı kaç m²?` : `${a} m'ye ${b} m bahçenin iç kenarları boyunca 1 m genişliğinde yol var. Ortada kalan alan kaç m²?`, l < 3 ? a * b * s : (a - 2) * (b - 2), l < 3 ? `${s} × ${a * b}.` : `İki yönden 1'er m çıkar: (${a} − 2) × (${b} − 2) = ${(a - 2) * (b - 2)}.`, "m²"),
      N(l < 3 ? `Kenarları ${a} ve ${b} cm olan dikdörtgen iki eş alanlı parçaya ayrılıyor. Her parçanın alanı kaç cm²?` : `${a} m'ye ${b} m zeminin ${hole} m²'si boş bırakılıyor. Her kutu 2 m² kaplıyorsa en az kaç kutu alınmalı?`, l < 3 ? a * b / 2 : Math.ceil((a * b - hole) / 2), l < 3 ? `${a * b} ÷ 2 = ${a * b / 2}.` : `Kaplanacak ${a * b - hole} m². 2'ye böl; kalan varsa bir kutu daha gerekir.`, l < 3 ? "cm²" : ""),
      N(l < 3 ? `Alanı ${a * b} cm² dikdörtgenin ${hole * b} cm²'si boyanıyor. Boyasız alan kaç cm²?` : `Bir dikdörtgenin kenarları ${a} ve ${b} cm. Uzun kenar ${hole} cm artırılırken kısa kenar 1 cm azaltılıyor. Yeni alan kaç cm²?`, l < 3 ? (a - hole) * b : (a + hole) * (b - 1), l < 3 ? `${a * b} − ${hole * b}.` : `Yeni kenarlar ${a + hole} ve ${b - 1}. Çarp: ${(a + hole) * (b - 1)}.`, "cm²"),
      N(l < 3 ? `Kenarları ${a} ve ${b} m odanın alanından ${s * s} m² halı çıkarılırsa açık alan kaç m²?` : `Kenarları ${a} ve ${b} m odada kenarı ${s} m kare halı var. Açık bölgenin m²'si ${price} TL'ye kaplanacak. Toplam kaç TL?`, l < 3 ? a * b - s * s : (a * b - s * s) * price, l < 3 ? `${a * b} − ${s * s}.` : `Açık alan ${a * b - s * s} m². ${price} ile çarp: ${(a * b - s * s) * price}.`, l < 3 ? "m²" : "TL")
    ];
  };

  builders.iliski = l => {
    const s = l + 4, d = l, a = s - d, b = s + d, p = 4 * s, area = a * b, price = 10 + l * 5;
    const pairs = n => { const out = []; for (let x = 1; x * x <= n; x++) if (n % x === 0) out.push([x, n / x]); return out; };
    const minP = Math.min(...pairs(area).map(([x, y]) => 2 * (x + y)));
    return [
      N(`Kenarları ${a} ve ${b} cm dikdörtgenin çevresi kaç cm?`, p, `2 × (${a} + ${b}) = ${p}.`, "cm"),
      N(`Kenarları ${a} ve ${b} cm dikdörtgenin alanı kaç cm²?`, area, `${a} × ${b} = ${area}.`, "cm²"),
      N(`Çevresi ${p} cm olan karenin alanı kaç cm²?`, s * s, `Kenar ${p} ÷ 4 = ${s}; alan ${s} × ${s} = ${s * s}.`, "cm²"),
      N(`Çevreleri ${p} cm olan ${s} × ${s} kare ile ${a} × ${b} dikdörtgenin alanları farkı kaç cm²?`, d * d, `${s * s} − ${area} = ${d * d}.`, "cm²"),
      T("Alanları eşit dikdörtgenlerin çevreleri de mutlaka eşittir.", false, "Örneğin 3 × 8 ve 4 × 6 alanları 24, çevreleri 22 ve 20'dir."),
      T("Çevreleri eşit dikdörtgenlerin alanları farklı olabilir.", true, `Örneğin ${s} × ${s} ile ${a} × ${b} aynı çevreli, farklı alanlıdır.`),
      N(`Çevresi ${p} cm, kenarları pozitif tam sayı olan dikdörtgenler arasında en büyük alan kaç cm²?`, s * s, `Kenarlar birbirine en yakın, burada eşit olunca alan en büyüktür: ${s} × ${s}.`, "cm²"),
      N(`Alanı ${area} cm² ve kenarları pozitif tam sayı olan dikdörtgenin en küçük çevresi kaç cm?`, minP, `Çarpan çiftleri: ${pairs(area).map(([x, y]) => `${x} × ${y}`).join(", ")}. Çevreleri karşılaştırınca en küçük ${minP}.`, "cm"),
      N(`Alanı ${area} cm², kenarları pozitif tam sayı olan dikdörtgenin en büyük çevresi kaç cm?`, 2 * (area + 1), `En uzak çarpan çifti 1 ile ${area}. Çevre ${2 * (area + 1)}.`, "cm"),
      rect(`Alanı ${area} birimkare, çevresi ${p} birim olan dikdörtgeni kur.`, a, b),
      N(`Çevresi ${p} cm olan, kenarları pozitif tam sayı dikdörtgenler kaç farklı kenar çiftiyle çizilir? Döndürülmüş hâller aynı sayılır.`, s, `Kenar toplamı ${2 * s}. Çiftler 1–${2 * s - 1}, 2–${2 * s - 2}, ... ${s}–${s}: ${s} çift.`),
      N(l < 3 ? `Bir karenin kenarı ${s} cm'den ${s + 1} cm'ye çıkıyor. Alan kaç cm² artar?` : `Çevresi ${p} cm olan bir dikdörtgenin uzun kenarı kısadan ${2 * d} cm fazla. Alanı kaç cm²?`, l < 3 ? 2 * s + 1 : area, l < 3 ? `${(s + 1) ** 2} − ${s * s} = ${2 * s + 1}.` : `Kenar toplamı ${2 * s}, fark ${2 * d}. Kenarlar ${a} ve ${b}; alan ${area}.`, "cm²"),
      N(l < 3 ? `Çevresi ${p} m olan kare bahçenin her kenarı ${l} m artırılıyor. Yeni çevre kaç m?` : `Alanı ${area} m² olan bir bahçenin kenarları pozitif tam sayı. Çitin metresi ${price} TL. En az maliyet kaç TL?`, l < 3 ? 4 * (s + l) : minP * price, l < 3 ? `Eski kenar ${s}; yeni kenar ${s + l}. Çevre ${4 * (s + l)}.` : `En küçük çevre ${minP} m. Maliyet ${minP} × ${price} = ${minP * price}.`, l < 3 ? "m" : "TL"),
      N(l < 3 ? `Kenarları ${a} ve ${b} cm dikdörtgende uzun kenar 1 cm artınca alan kaç cm² artar?` : `Kenarları ${a} ve ${b} cm dikdörtgende kısa kenar ${d} cm artıyor, uzun kenar ${d} cm azalıyor. Alan kaç cm² artar?`, l < 3 ? a : d * d, l < 3 ? `Ek şerit ${a} × 1 = ${a}.` : `Yeni şekil ${s} × ${s} kare; artış ${s * s} − ${area} = ${d * d}.`, "cm²"),
      N(l < 3 ? `Kenarları ${a} ve ${b} cm dikdörtgenin alanı ${area} cm². Aynı alanlı 1 cm genişlikli dikdörtgenin uzunluğu kaç cm?` : `Bir arsanın çevresi ${p} m; kenarları pozitif tam sayı. İçine ${s * s - 1} m² yapı sığması için arsa alanı en az bu kadar olmalı. Kaç farklı kenar çifti bu koşulu sağlar? Döndürülmüşler aynı.`, l < 3 ? area : 2, l < 3 ? `${area} ÷ 1 = ${area}.` : `Kare ${s} × ${s}, alan ${s * s}. Bir sonraki çift ${s - 1} × ${s + 1}, alan ${s * s - 1}. Sonraki çiftin alanı ${s * s - 4}; yalnız iki çift uygundur.`)
    ];
  };

  // Üst iki seviye yalnız sayıları büyütmez: ters işlem, birden çok koşul,
  // sayma stratejisi ve en iyi çözümü bulma gerektirir. Beş görev ailesinin
  // her birinde üç ayrı örnek vardır.
  function advanced(topic, l) {
    const out = [];
    for (let v = 0; v < 3; v++) {
      const a = 10 * l + 2 * v, b = 3 * l + v, k = l + 1, n = 3 * l + v;
      const x = 18 + 2 * l + 6 * v, r = 4 * l + v, delta = 2 * (3 * l + v);
      const digit = l === 4 ? 2 + v : 6 + v;
      const P = 2 * (a + b), fee = 10 * (l + v);
      const pairList = area => { const pairs = []; for (let z = 1; z * z <= area; z++) if (area % z === 0) pairs.push([z, area / z]); return pairs; };
      const tasks = {
        nokta: () => [
          N(`A, B, C bu sırada aynı doğru üzerinde. AB, BC'nin 3 katı; AC = ${4 * a} cm. AB'nin orta noktası M ise MC kaç cm?`, 5 * a / 2, `BC = ${a}, AB = ${3 * a}. MB = ${3 * a / 2}; MC = MB + BC = ${5 * a / 2}.`, "cm"),
          N(`Uzunluğu ${n * a} cm olan bir parça ${n} eş parçaya ayrılıyor. Uçlar dahil bütün ayırma noktalarından yalnız en soldaki siliniyor. Kalan ilk ve son nokta arası kaç cm?`, (n - 1) * a, `Bir aralık ${a} cm. İlk aralık çıkarılınca ${n - 1} aralık, ${(n - 1) * a} cm kalır.`, "cm"),
          N(`Bir doğru üzerindeki ${n} farklı nokta uç seçilerek bütün doğru parçaları çiziliyor. Yalnız ardışık noktalar arasındaki parçalar çıkarılırsa kaç parça kalır?`, (n - 1) * (n - 2) / 2, `Bütün parçalar ${n * (n - 1) / 2}; ardışıklar ${n - 1}. Fark ${(n - 1) * (n - 2) / 2}.`),
          N(`A, B, C, D bir doğru üzerinde bu sırada. AB = CD = ${a} cm, AD = ${2 * a + 3 * b} cm. BC üç eş parçaya ayrılıyor. Bir parça kaç cm?`, b, `Önce iki uç parçayı çıkar: BC = ${3 * b}. Sonra 3'e böl: ${b}.`, "cm"),
          N(`A, M, N, B aynı doğru üzerinde. M, AB'nin orta noktası; N, MB'nin orta noktası. AN = ${3 * a} cm ise AB kaç cm?`, 4 * a, `AN, AB'nin üç eş çeyreğidir. Bir çeyrek ${a}; bütün AB ${4 * a}.`, "cm")
        ],
        aci: () => [
          N(`Robot ${k} kez eşit miktarda sola, ardından ${b} kez 4° sağa dönüyor. Net sola dönüşü ${k * x - b * 4}°. Bir sola dönüş kaç derece?`, x, `Sağa dönüşleri geri ekle: ${k * x}. ${k}'e böl: ${x}.`, "°"),
          N(`Bir doğru açı, küçük açı ve ondan ${delta}° büyük bir açı olarak ayrılıyor. Küçük açının ${b}° eksiği kaç derece?`, (180 - delta) / 2 - b, `Küçük açı (180 − ${delta}) ÷ 2 = ${(180 - delta) / 2}. ${b} çıkar: ${(180 - delta) / 2 - b}.`, "°"),
          N(`Bir kapı önce açıklığının 2 katı kadar daha açılıyor, ardından ${b}° kapanıyor. Son açıklık ${3 * x - b}°. İlk açıklık kaç derece?`, x, `Kapanmadan önce ${3 * x}°. Bu, ilk açıklığın 3 katıdır. İlk açıklık ${x}°.`, "°"),
          N(`Dar açıya ${b}° fazla gösteren bir araçta ${x + b}° okunuyor. Gerçek açıyı dik açıya tamamladıktan sonra ${delta}° azaltırsan kaç derece kalır?`, 90 - x - delta, `Gerçek ${x}°, dik açıya kalan ${90 - x}°. ${delta} çıkar: ${90 - x - delta}.`, "°"),
          dial(`Bir ışın tam tur atacak. Önce ${k} kez ${x}° dönmüş. Kalan dönüşün yarısından ${b}° çıkar; bu ölçüyü açıölçerde göster.`, (360 - k * x) / 2 - b, `Kalan 360 − ${k} × ${x} = ${360 - k * x}°. Yarısı ${(360 - k * x) / 2}°. ${b} eksiği ${(360 - k * x) / 2 - b}°.`)
        ],
        cember: () => [
          N(`İki çemberin çapları toplamı ${4 * r + 2 * b} cm; yarıçapları farkı ${b} cm. Büyük çemberin çapı kaç cm?`, 2 * (r + b), `Yarıçap toplamı ${2 * r + b}. Küçük yarıçap ${r}, büyük ${r + b}; büyük çap ${2 * (r + b)}.`, "cm"),
          N(`Bir çemberin çapı ile yarıçapı toplamı ${3 * r} cm. Pergel ${b} cm daha açılırsa yeni çap kaç cm olur?`, 2 * (r + b), `İlk yarıçap ${r}; yeni yarıçap ${r + b}. Çap ${2 * (r + b)}.`, "cm"),
          N(`Üç çemberin yarıçapları sırayla ${r}, ${r + b}, ${r + 2 * b} cm. En büyük çap ile en küçük yarıçapın toplamı kaç cm?`, 3 * r + 4 * b, `En büyük çap ${2 * (r + 2 * b)}. ${r} ekle: ${3 * r + 4 * b}.`, "cm"),
          N(`Aynı merkezli iki çemberin çapları farkı ${2 * b} cm; küçük yarıçap ${r} cm. Büyük çember üzerinde ${k} yarıçapın uzunlukları toplamı kaç cm?`, k * (r + b), `Yarıçap farkı ${b}, büyük yarıçap ${r + b}. ${k} katı ${k * (r + b)}.`, "cm"),
          N(`İki çemberin yarıçapları toplamı ${2 * r + b} cm. Büyük çap küçük çaptan ${2 * b} cm uzun. Küçük çemberin çapı ile büyük yarıçapın toplamı kaç cm?`, 3 * r + b, `Yarıçaplar ${r} ve ${r + b}. İstenen 2 × ${r} + ${r + b} = ${3 * r + b}.`, "cm")
        ],
        dikme: () => [
          N(`Bir dik köprüye iki ucunda ${b}'şer m bağlantı ekleniyor. Metresi ${fee} TL olan toplam malzeme ${fee * (a + 2 * b)} TL tutuyor. Kıyılar arası dik uzaklık kaç m?`, a, `Malzeme uzunluğu ${a + 2 * b} m. İki bağlantı toplamı ${2 * b} m çıkar: ${a}.`, "m"),
          N(`${n} paralel doğru arasında ardışık dik uzaklıklar ${b} m. İlk doğrudan sonuncuya dik yönde gidip dönmek kaç m?`, 2 * (n - 1) * b, `${n - 1} aralık vardır. Gidiş ${(n - 1) * b}; gidiş-dönüş ${2 * (n - 1) * b}.`, "m"),
          N(`${k} köprünün her biri, eğik yerine dik yapılınca ${b} m kısalıyor. Malzemenin metresi ${fee} TL; toplam ${a} TL ek montaj gerekiyor. Net tasarruf kaç TL?`, k * b * fee - a, `Malzeme tasarrufu ${k * b * fee} TL. Ek montajı çıkar: ${k * b * fee - a}.`, "TL"),
          N(`P noktası iki paralel doğrunun arasında. Doğruların dik uzaklığı ${2 * a + b} cm. P'nin doğrulara dik uzaklıkları farkı ${b} cm. Yakın doğruya uzaklık kaç cm?`, a, `İki uzaklığın toplamı ${2 * a + b}, farkı ${b}. Küçük = (${2 * a + b} − ${b}) ÷ 2 = ${a}.`, "cm"),
          N(`Her biri ${a} m dik açıklığı geçen ${k} köprü yapılacak. Her köprüye toplam ${b} m bağlantı ekleniyor. ${k * (a + b) + delta} m malzemeden kaç m artar?`, delta, `Gerekli ${k} × (${a} + ${b}) = ${k * (a + b)} m. Artan ${delta} m.`, "m")
        ],
        paralel: () => [
          N(`${n} yatay ve ${b} düşey doğrunun her ailesi kendi içinde paralel. İki yatay ve bir düşey eklenince kesişim sayısı kaç artar?`, (n + 2) * (b + 1) - n * b, `Eski ${n * b}, yeni ${(n + 2) * (b + 1)}. Fark ${(n + 2) * (b + 1) - n * b}.`),
          N(`${n} yatay, ${b} düşey paralel çizgi var. Yatay sayısı 1 artırılıp düşey sayısı 1 azaltılıyor. Yeni en küçük dikdörtgen hücre sayısı kaç?`, n * (b - 2), `Yeni çizgiler ${n + 1} ve ${b - 1}; aralıklar ${n} ve ${b - 2}. Çarpımları ${n * (b - 2)}.`),
          N(`Birbirine paralel ${n} farklı doğrudan her seferinde iki tanesi seçiliyor. Sıra önemsizse kaç farklı paralel doğru çifti seçilir?`, n * (n - 1) / 2, `İlk doğruyla ${n - 1}, ikinciden ${n - 2}, ... yeni çiftler. Toplam ${n * (n - 1) / 2}.`),
          N(`Paralel doğruları iki paralel kesen dik kesiyor ve toplam ${8 * n} dik açı oluşuyor. Paralel doğruların arasındaki ardışık şerit sayısı kaçtır?`, n - 1, `Her paralel doğru 2 kesişimde 8 dik açı verir. Doğru sayısı ${n}; aralık ${n - 1}.`),
          N(`${n} paralel çizginin ilk ve sonuncusu arası ${b * (n - 1)} cm; ardışık uzaklıklar eşit. Araya her eski aralığı ikiye bölen bir çizgi ekleniyor. Yeni çizgiler toplam kaç tane?`, 2 * n - 1, `Eski çizgi ${n}, eklenecek çizgi ${n - 1}. Toplam ${2 * n - 1}.`)
        ],
        olcme: () => [
          N(`Bir araç dar açıya ${b}° ekliyor, geniş açıdan ${b}° çıkarıyor. Ekranda dar açı ${x + b}°, geniş açı ${120 + v - b}°. Gerçek açılar arasındaki fark kaç derece?`, 120 + v - x, `Gerçekler ${x}° ve ${120 + v}°. Fark ${120 + v - x}°.`, "°"),
          N(`Bir ölçü sisteminde tam dönüş ${360 / k} birim. ${x} birim dönen robot daha sonra ${b}° geri dönüyor. Net dönüş kaç derece?`, k * x - b, `Bir birim ${k}°. Net ${x} × ${k} − ${b} = ${k * x - b}°.`, "°"),
          N(`Açıölçerde yanlış ölçek ${180 - x}° okunuyor. Doğru ölçek diğer yöndeki 0'dan başlıyor. Doğru açının tümlerine ${delta}° eklenince kaç derece olur?`, 90 - x + delta, `Doğru açı ${x}°. Tümleri ${90 - x}°. Eklenince ${90 - x + delta}°.`, "°"),
          N(`Işın ${k} kez ${x}° döndü. Tam dönüşe ulaşmak için kalan yol iki eş adıma ayrılıyor. Bir adım kaç derece?`, (360 - k * x) / 2, `Kalan 360 − ${k * x} = ${360 - k * x}. Yarısı ${(360 - k * x) / 2}°.`, "°"),
          N(`Bir açının ${k} katına ${delta}° eklendiğinde ${k * x + delta}° ölçülüyor. Aynı açının bütünleri kaç derece?`, 180 - x, `Önce ${delta} çıkar, ${k}'e böl: ${x}°. Bütünleri ${180 - x}°.`, "°")
        ],
        durum: () => [
          N(`Kesişen doğrularda komşu açılar farkı ${180 - 2 * x}°. İki geniş açının toplamından bir dar açı çıkarılırsa kaç derece kalır?`, 360 - 3 * x, `Dar açı ${x}°, geniş ${180 - x}°. 2 × ${180 - x} − ${x} = ${360 - 3 * x}.`, "°"),
          N(`İki paralel doğruyu dik olmayan bir kesen kesiyor. Bir dar açı ${x}°. Bütün kesişimlerdeki geniş açıların toplamı kaç derece?`, 4 * (180 - x), `İki kesişimde toplam 4 geniş açı var; her biri ${180 - x}°. Toplam ${4 * (180 - x)}°.`, "°"),
          N(`Üç farklı doğru tek noktada kesişiyor. Bir doğru açı oluşturan art arda üç küçük açı ${x}°, ${x + delta}° ve bilinmeyen. Bilinmeyenin ters açısı kaç derece?`, 180 - 2 * x - delta, `Üçünün toplamı 180°. Bilinmeyen ${180 - 2 * x - delta}°. Ters açı ona eşit.`, "°"),
          N(`${n} yatay ve ${b} düşey paralel doğru dik kesişiyor. Bir yatay doğru kaldırılırsa geriye toplam kaç dik açı kalır?`, 4 * (n - 1) * b, `Kesişim sayısı (${n} − 1) × ${b} = ${(n - 1) * b}; her birinde 4 dik açı.`),
          N(`${n} farklı doğru çiziliyor. Hiçbir ikisi paralel değil, hiçbir üçü aynı noktadan geçmiyor. Kesişim noktalarının toplam sayısı kaç?`, n * (n - 1) / 2, `Her doğru çifti farklı bir kesişim verir. Çiftleri say: ${n * (n - 1) / 2}.`)
        ],
        cift: () => [
          N(`Bir açının bütünleri ile tümlerinin toplamı ${270 - 2 * x}°. Açının kendisi kaç derece?`, x, `Toplam 270°den iki açı kadar eksiktir. (270 − ${270 - 2 * x}) ÷ 2 = ${x}.`, "°"),
          N(`Tümler iki açı arasındaki fark ${90 - 2 * x}°. Büyük açının bütünleri kaç derece?`, 90 + x, `Küçük ${x}°, büyük ${90 - x}°. Büyük açının bütünleri ${90 + x}°.`, "°"),
          N(`Bütünler iki açı arasındaki fark ${180 - 2 * x}°. Küçük açının ${delta}° artırılmış hâlinin tümleri kaç derece?`, 90 - x - delta, `Küçük açı ${x}°. Artırılınca ${x + delta}°, tümleri ${90 - x - delta}°.`, "°"),
          N(`Bir doğru açı üç parçaya ayrılıyor. İkinci birinciden ${delta}°, üçüncü ikinciden ${delta}° fazla. En büyük açı kaç derece?`, 60 + delta, `Üç açı ${60 - delta}, 60, ${60 + delta} olur. Ortadaki 180 ÷ 3 = 60°.`, "°"),
          N(`Bir açının tümleri ${x}°. Bu açının bütünleriyle, ilk açının ters açısının toplamı kaç derece?`, 180, `İlk açı ${90 - x}°, tersi aynı. Bütünleriyle toplamı 180°dir.`, "°")
        ],
        cokgen: () => [
          N(`Bir düzgün çokgenin kenar ve köşe sayıları toplamı ${2 * n}. Bir köşesinden çizilen köşegen sayısı ile kenar sayısının toplamı kaç?`, 2 * n - 3, `Kenar ${n}; bir köşeden köşegen ${n - 3}. Toplam ${2 * n - 3}.`),
          N(`Kenarları ${b} cm olan iki düzgün ${n}gen, bir kenarları ortak olacak şekilde birleştiriliyor. Dış çevreyi ${fee} TL/cm ile süsleme maliyeti kaç TL?`, (2 * n - 2) * b * fee, `Dışarıda ${2 * n - 2} kenar; uzunluk ${(2 * n - 2) * b} cm. Maliyet ${(2 * n - 2) * b * fee} TL.`, "TL"),
          N(`Bir ${n}gen bir köşesinden köşegenlerle üçgenlere ayrılıyor. Her üçgende açı toplamı 180°. Bütün üçgenlerin iç açı toplamı kaç derece?`, (n - 2) * 180, `${n - 2} üçgen oluşur. Toplam ${n - 2} × 180 = ${(n - 2) * 180}°.`, "°"),
          N(`Düzgün ${n}genin çevresi ${n * b} cm. Aynı uzunlukta kenarlara sahip ${n + 2}genin çevresi kaç cm daha fazladır?`, 2 * b, `Kenar ${b} cm; iki ek kenar toplam ${2 * b} cm.`, "cm"),
          N(`Bir ${n}genin bütün köşegenleri her köşeden sayılmış ve ${n * (n - 3)} tane bulunmuş. Her köşegen iki kez sayıldığına göre gerçek sayı kaçtır?`, n * (n - 3) / 2, `${n * (n - 3)} ÷ 2 = ${n * (n - 3) / 2}.`)
        ],
        ucgen: () => [
          N(`İkizkenar üçgenin tepe açısının komşu dış açısı ${2 * x}°. Bir taban açısının tümleri kaç derece?`, 90 - x, `Taban açıları ${x}°; tümleri ${90 - x}°.`, "°"),
          N(`Üçgenin bir açısı diğerinin 2 katı. Üçüncü açı küçük açıdan ${180 - 4 * (36 + l + v)}° fazla. En büyük açı kaç derece?`, 2 * (36 + l + v), `Küçük açı ${36 + l + v}°. Açılar ${36 + l + v}, ${2 * (36 + l + v)}, ${180 - 3 * (36 + l + v)}. En büyük ${2 * (36 + l + v)}°.`, "°"),
          N(`İkizkenar üçgenin çevresi ${3 * a + b} cm. Tabanı eş kenardan ${b} cm uzun. Eş kenarın yarısı kaç cm?`, a / 2, `Çevreden fazlalık ${b} çıkar: ${3 * a}. Bir eş kenar ${a}; yarısı ${a / 2}.`, "cm"),
          N(`Bir üçgende açılar küçükten büyüğe her adımda ${delta}° artıyor. En büyük açının bütünleri kaç derece?`, 120 - delta, `Ortanca açı 60°, en büyük ${60 + delta}°. Bütünleri ${120 - delta}°.`, "°"),
          N(`Üçgenin iki iç açısı ${x}° ve ${x + delta}°. Üçüncü iç açının komşu dış açısı kaç derece?`, 2 * x + delta, `Üçüncü açı ${180 - 2 * x - delta}°. Dış açı 180'den çıkarılınca ${2 * x + delta}°.`, "°")
        ],
        insa: () => [
          N(`İki kesişen çemberin merkezleri ve kesişim noktasıyla kurulan üçgenin çevresi ${3 * r + 2 * b} cm, tabanı ${r + b} cm. Yarıçaplar farkı ${b} cm. Büyük yarıçap kaç cm?`, r + b, `Yarıçap toplamı ${2 * r + b}; farkı ${b}. Büyük yarıçap ${r + b}.`, "cm"),
          N(`Yarıçapları ${r} ve ${r + b} cm olan iki çember iki noktada kesişecek. Merkezler arası uzaklık santimetre cinsinden kaç farklı tam sayı olabilir?`, 2 * r - 1, `Uzaklık ${b}'den büyük, ${2 * r + b}'den küçük. ${b + 1}'den ${2 * r + b - 1}'e kadar ${2 * r - 1} tam sayı.`),
          N(`Bir eşkenar üçgen pergel ile çiziliyor. Pergel açıklığı ${b} cm artırıldığında çevre ${3 * (r + b)} cm oluyor. İlk üçgenin çevresi kaç cm?`, 3 * r, `Yeni çevreden 3 × ${b} = ${3 * b} çıkar: ${3 * r} cm.`, "cm"),
          N(`Eş yarıçaplı iki çemberin yarıçapları ${r} cm. İki kesişim noktasının her biri merkezlerle bir üçgen oluşturuyor. Bu iki üçgen merkezleri birleştiren ortak kenardan birleşince dış çevre kaç cm?`, 4 * r, `Ortak taban içte kalır. Dış sınır 4 yarıçap: 4 × ${r} = ${4 * r}.`, "cm"),
          N(`İnşa üçgeninin iki kenarı çember yarıçapları ${r} ve ${r + b} cm. Çevresi ${3 * r + b} cm. Merkezler arası uzaklık kaç cm ve üçgen ikizkenar mı? Uzaklığı yaz.`, r, `Taban ${3 * r + b} − ${r} − ${r + b} = ${r}. İki kenar ${r} olduğu için üçgen ikizkenardır.`, "cm")
        ],
        okuma: () => [
          N(`Milyonlar bölüğü ${a}, binler bölüğü bunun ${b} katı; birler bölüğü bu iki bölüğün toplamı. Sayıyı rakamlarla yaz.`, a * 1e6 + a * b * 1000 + a * (b + 1), `Bölükler ${a} | ${a * b} | ${a * (b + 1)}. Üçer rakama tamamlayarak yaz.`),
          N(`Milyonlar bölüğü ${a + b}, binler bölüğü ${a}, birler bölüğü 0 olan sayıda milyonlar ve binler bölükleri yer değiştiriyor. Sayı kaç azalır?`, b * 999000, `İlk sayı ${(a + b) * 1e6 + a * 1000}, yeni sayı ${a * 1e6 + (a + b) * 1000}. Fark ${b * 999000}.`),
          N(`"${G.sayNumber(a * 1e9 + 999 * 1000 + 999)}" sayısına 1 ekleniyor. Sonucun binler ve birler bölüklerinde toplam kaç sıfır bulunur?`, 6, "999 999 + 1 = 1 000 000. Son iki bölük 000 ve 000: toplam 6 sıfır."),
          N(`Bir sayının milyarlar bölüğü ${b}, milyonlar bölüğü ${a}, binler bölüğü 0, birler bölüğü ${k}. Sayıdan ${a} milyon çıkarıp ${b} bin ekleyince yeni sayı kaçtır?`, b * 1e9 + b * 1000 + k, `Milyonlar bölüğü sıfırlanır, binler ${b} olur: ${f(b * 1e9 + b * 1000 + k)}.`),
          N(`Milyonlar bölüğü ${a}, binler bölüğü ${b}. Bu sayının birler bölüğü, binler bölüğünün ${k} katından 1 eksikse tam sayı kaçtır?`, a * 1e6 + b * 1000 + b * k - 1, `Birler bölüğü ${b * k - 1}. Sayı ${f(a * 1e6 + b * 1000 + b * k - 1)}.`)
        ],
        basamak: () => [
          N(`Bir sayının on binler basamağındaki rakam ${digit}, birler basamağındaki rakam 1. Bu iki rakam yer değiştirirse sayı kaç azalır?`, (digit - 1) * 9999, `On binlerden ${(digit - 1) * 10000} azalır, birlerden ${digit - 1} artar. Net ${(digit - 1) * 9999}.`),
          N(`Bir sayının milyonlar rakamı 2 azalıyor, yüz binler rakamı 3 artıyor, yüzler rakamı ${digit} artıyor. Rakamların bu değişimlere uygun olduğu biliniyor. Sayı kaç azalır?`, 1700000 - digit * 100, `2 000 000 − 300 000 − ${digit * 100} = ${1700000 - digit * 100}.`),
          N(`${a} milyon ${digit} yüz bin ${k} bin ${v + 1} birimden oluşan sayının en soldaki iki basamağının değerleri toplamı kaçtır?`, a * 1e6, `En soldaki iki basamak on milyonlar ve milyonlardır. Sıfırın basamak değeri 0'dır. İki değer toplamı ${a * 1e6}.`),
          N(`Rakamı ${digit} olan iki basamaktan büyüğü milyonlar, küçüğü yüzler basamağı. Bu iki basamak değerinin farkından ${a} bin çıkarılınca kaç kalır?`, digit * 999900 - a * 1000, `${digit * 1e6} − ${digit * 100} − ${a * 1000} = ${digit * 999900 - a * 1000}.`),
          N(`Bir sayının binler ve birler rakamları yer değiştirince sayı ${999 * (digit - 1)} azalıyor. Birler rakamı 1 ise ilk binler rakamı kaç?`, digit, `Her bir rakam farkı 1000 − 1 = 999 değişim yapar. Fark ${digit - 1}; ilk binler ${digit}.`)
        ],
        sirala: () => [
          N(`${a * 1000} < N < ${a * 1000 + digit * 100} ve N'nin son iki rakamı 00. Kaç doğal sayı uygundur?`, digit - 1, `100'er artarak say: ${a * 1000 + 100}, ..., ${a * 1000 + (digit - 1) * 100}. Uçlar hariç ${digit - 1} sayı.`),
          N(`${a * 100 + digit}, ${a * 100 + digit * 10}, ${a * 100 + digit * 10 + 1}, ${a * 100 + 99} sayılarından ikinci en büyüğü ile en küçüğünün farkı kaç?`, digit * 9 + 1, `İkinci en büyük ${a * 100 + digit * 10 + 1}, en küçük ${a * 100 + digit}. Fark ${digit * 9 + 1}.`),
          N(`${a * 1000 + 320} < ${a * 1000} + 10 × K < ${a * 1000 + 380}. K doğal sayı. Kaç farklı K vardır?`, 5, "320 < 10 × K < 380. K = 33, 34, 35, 36, 37: beş değer."),
          N(`Bir sayı ${a * 1000}'den büyük, ${a * 1000 + 100}'den küçük. Onlar basamağı ${digit}, birler rakamı onlar rakamından küçük. Kaç sayı yazılabilir?`, digit, `Birler rakamı 0'dan ${digit - 1}'e kadar: ${digit} seçenek.`),
          N(`${a * 1000 + b * 10} sayısına uzaklığı ${k} olan iki sayı var. Büyük sayıdan küçük sayının 1 fazlası çıkarılıyor. Sonuç kaç?`, 2 * k - 1, `İki sayı arasındaki fark 2 × ${k} = ${2 * k}. Küçüğün 1 fazlasını çıkarmak sonucu 1 azaltır: ${2 * k - 1}.`)
        ],
        islem: () => [
          N(`Üç sayıdan ikincisi ilkinden ${b} fazla, üçüncüsü ikinciden ${b} fazla. Toplamları ${3 * a + 3 * b}. En büyük sayı kaç?`, a + 2 * b, `Ortanca sayı ${a + b}; en büyük ${a + 2 * b}.`),
          N(`Bir hesaptan ${a * b} TL çekiliyor, kalan para ${k} katına çıkıyor. Sonra ${b} TL eklenince ${a * k + b} TL oluyor. Başta kaç TL vardı?`, a * (b + 1), `Ters sırayla: ${b} çıkar, ${k}'e böl, ${a * b} ekle. Sonuç ${a * (b + 1)}.`, "TL"),
          N(`Bir toplamada ${a * 100 + b} yerine ${b * 100 + a} yazılmış. Bulunan toplam ${10000 + b * 100 + a}. Doğru toplam kaç?`, 10000 + a * 100 + b, `Yanlış toplananı çıkar, doğruyu ekle. Sonuç ${10000 + a * 100 + b}.`),
          N(`İki sayının toplamı ${4 * a + b}, farkı ${2 * a + b}. Büyük sayıdan ${b} çıkarılıp küçüğüne ekleniyor. Yeni büyük sayının değeri kaç?`, 3 * a, `İlk sayılar ${3 * a + b} ve ${a}. Değişimden sonra ${3 * a} ve ${a + b}; büyük ${3 * a}.`),
          N(`Dört ardışık doğal sayının toplamı ${4 * a + 6}. En büyük iki sayının toplamından en küçük sayı çıkarılırsa kaç kalır?`, a + 5, `Sayılar ${a}, ${a + 1}, ${a + 2}, ${a + 3}. ${a + 2} + ${a + 3} − ${a} = ${a + 5}.`)
        ],
        carpan: () => [
          N(`Bölen ${b}, bölüm ${a}. Kalan en büyük olası değer. Bölüneni ${k} katına çıkarıp ilk kalanı çıkarırsan sonuç kaç?`, (a * b + b - 1) * k - b + 1, `İlk kalan ${b - 1}, bölünen ${a * b + b - 1}. İstenen sonuç ${(a * b + b - 1) * k - b + 1}.`),
          N(`${a * b + 1} ürün ${b}'şer ürünlük kutulara, bu kutular da ${k}'şerli kasalara konuluyor. Son kutu eksik dolabilir. En az kaç kasa gerekir?`, Math.ceil((a + 1) / k), `Kutu sayısı ${a + 1}; kasa sayısı ${Math.ceil((a + 1) / k)}. Her iki aşamada da kalan için bir taşıyıcı daha gerekir.`),
          N(`Bir üründen ${a} paket alınıyor. Her pakette ${b} ürün var. ${k} ürün ayrılıyor. Kalan her ürün ${b} TL'ye satılırsa gelir kaç TL?`, (a * b - k) * b, `Ürün sayısı ${a * b}; kalan ${a * b - k}. Gelir ${(a * b - k) * b}.`, "TL"),
          N(`Bir sayı ${b}'ye bölününce bölüm ${a}, kalan 1. Sayıya ${b * k - 1} eklenirse yeni bölüm kaç?`, a + k, `Sayı ${a * b + 1}; artış sonrası ${(a + k) * b}. Yeni bölüm ${a + k}.`),
          N(`Bir ürünün ${k}'li paketi ${k * b} TL. ${a} paket alana toplam ${b} TL indirim var. ${a * k * b + delta} TL veren kişi kaç TL para üstü alır?`, delta + b, `Normal tutar ${a * k * b}; indirim ${b}. Para üstü ${delta} + ${b} = ${delta + b}.`, "TL")
        ],
        problem: () => [
          N(`Geziye ${a * b} öğrenci gidiyor. Her ${b} öğrenciye bir yetişkin gerekiyor. Her araç ${k} kişi alıyor ve ${fee} TL. En az ulaşım maliyeti kaç TL?`, Math.ceil(a * (b + 1) / k) * fee, `Yetişkin ${a}, toplam ${a * (b + 1)} kişi. Araç ${Math.ceil(a * (b + 1) / k)}; maliyet ${Math.ceil(a * (b + 1) / k) * fee}.`, "TL"),
          N(`${a * fee + b * k} TL bütçeyle önce ${b} adet, tanesi ${k} TL defter alınıyor. Kalanla tanesi ${fee} TL kitaplardan en çok kaç alınır?`, a, `Defterler ${b * k} TL; kalan ${a * fee}. Kitap sayısı ${a}.`),
          N(`${a * b + k} sayfalık kitabın ${k} sayfası okundu. Her gün ${b} sayfa okunuyor; yalnız haftada 5 gün okunabiliyor. Kalanı bitirmek için en az kaç takvim haftasına ihtiyaç var?`, Math.ceil(a / 5), `Kalan ${a * b} sayfa, ${a} okuma günü gerekir. 5'e böl, kalan varsa bir hafta daha: ${Math.ceil(a / 5)}.`),
          N(`Çiftçi ${a} kasada ${b}'şer kg ürün satıyor. Kilosu ${k} TL; toplam üretim masrafı ${fee} TL, nakliye ${b} TL. Net kazanç kaç TL?`, a * b * k - fee - b, `Gelir ${a * b * k}; iki masrafı çıkar: ${a * b * k - fee - b}.`, "TL"),
          N(`A planı ${fee} TL sabit ücret ve ürün başına ${b} TL; B planı sabit ücretsiz ürün başına ${b + k} TL. ${a} ürün için ucuz olan plan kaç TL tutar?`, Math.min(fee + a * b, a * (b + k)), `A: ${fee + a * b} TL. B: ${a * (b + k)} TL. Küçük maliyet ${Math.min(fee + a * b, a * (b + k))}.`, "TL")
        ],
        cevre: () => [
          N(`Dikdörtgenin çevresi ${P} m, kenarları farkı ${a - b} m. ${v + 1} m kapı hariç çevreye 3 sıra tel çekiliyor. Gerekli tel kaç m?`, 3 * (P - v - 1), `Çevreden kapı çıkar: ${P - v - 1}. Üç sıra tel ${3 * (P - v - 1)} m.`, "m"),
          N(`Kenarları ${a} ve ${b} m bahçenin içine kenarlar boyunca 1 m genişliğinde yol yapılıyor. Ortada kalan dikdörtgenin çevresi kaç m?`, 2 * (a + b - 4), `İç kenarlar ${a - 2} ve ${b - 2}. Çevre ${2 * (a + b - 4)}.`, "m"),
          N(`Kenarları ${b} cm olan ${n} kare, tek sıra hâlinde tam kenarlarından birleştiriliyor. Yalnız dış sınırı ${fee} TL/cm ile süslemek kaç TL?`, 2 * (n + 1) * b * fee, `Dış şekil ${n * b} × ${b}. Çevre ${2 * (n + 1) * b} cm; maliyet ${2 * (n + 1) * b * fee}.`, "TL"),
          N(`Çevresi ${8 * b} cm olan bir kare tel, tel kesilmeden dikdörtgene dönüştürülüyor. Uzun kenar kısa kenarın 3 katı. Uzun kenar kaç cm?`, 3 * b, `Dikdörtgen çevresi kısa kenarın 8 katı. Kısa ${b}; uzun ${3 * b}.`, "cm"),
          N(`Kenarları ${a} ve ${b} m bahçenin çevresi tel ile sarılacak. ${P * k + a} m tel var. Bahçe en çok kaç tam sıra sarılır ve kaç m tel artar? Artan teli yaz.`, a, `Çevre ${P} m. ${k} tam sıra ${P * k} m tutar; artan ${a} m.`, "m")
        ],
        alan: () => [
          N(`Kenarları ${a} ve ${b} m dikdörtgenin dışına her yönde 1 m genişliğinde yol ekleniyor. Yolun m²'si ${fee} TL ise maliyeti kaç TL?`, ((a + 2) * (b + 2) - a * b) * fee, `Dış alan ${(a + 2) * (b + 2)}, iç alan ${a * b}; yol alanı ${2 * a + 2 * b + 4}. Maliyet ${(2 * a + 2 * b + 4) * fee}.`, "TL"),
          N(`Kenarları ${a} ve ${b} m zeminden kenarları ${k} ve 2 m bölge çıkarılıyor. Her kutu 3 m² kaplıyor, kutu ${fee} TL. En az kaç TL ödenir?`, Math.ceil((a * b - 2 * k) / 3) * fee, `Kaplanacak ${a * b - 2 * k} m². Kutu ${Math.ceil((a * b - 2 * k) / 3)}; maliyet ${Math.ceil((a * b - 2 * k) / 3) * fee}.`, "TL"),
          N(`Kenarları ${a} ve ${b} cm dikdörtgende uzun kenar 2 cm azaltılıyor, kısa kenar 2 cm artırılıyor. Alan kaç cm² artar?`, 2 * (a - b) - 4, `Yeni alan ${(a - 2) * (b + 2)}, eski ${a * b}. Fark ${2 * (a - b) - 4}.`, "cm²"),
          N(`Dikdörtgenin çevresi ${P} m; uzun kenarı kısa kenarından ${a - b} m fazla. Alanın ${k} m²'si boş bırakılıyor. Kaplanacak alan kaç m²?`, a * b - k, `Kenarlar toplamı ${a + b}, farkı ${a - b}; kenarlar ${a} ve ${b}. Alan ${a * b}; boşluk sonrası ${a * b - k}.`, "m²"),
          N(`Kenarları ${a} ve ${b} m odanın zeminine, kenarı ${k} m kare halı konuluyor. Açık alanın m²'si ${fee} TL ve montaj ${a} TL. Toplam kaç TL?`, (a * b - k * k) * fee + a, `Oda ${a * b}, halı ${k * k}, açık ${a * b - k * k} m². Maliyet ${(a * b - k * k) * fee + a}.`, "TL")
        ],
        iliski: () => [
          N(`Alanı ${a * b} m² olan dikdörtgenin kenarları pozitif tam sayı. Metresi ${fee} TL olan çitte ${v + 1} m kapı bırakılacak. En ucuz çit kaç TL?`, (Math.min(...pairList(a * b).map(([z, w]) => 2 * (z + w))) - v - 1) * fee, `Çarpan çiftlerini dene: ${pairList(a * b).map(p => p.join(" × ")).join(", ")}. En küçük çevre ${Math.min(...pairList(a * b).map(([z, w]) => 2 * (z + w)))} m; kapıyı çıkarıp ${fee} ile çarp.`, "TL"),
          N(`Bir bahçenin çiti için ${4 * a * fee + b} TL var; montaja ${b} TL ayrılıyor. Çitin metresi ${fee} TL. Tam sayı kenarlı dikdörtgen bahçenin en büyük alanı kaç m²?`, a * a, `Çite kalan ${4 * a * fee} TL, uzunluk ${4 * a} m. En büyük alan ${a} × ${a} karede ${a * a}.`, "m²"),
          N(`Bir karenin çevresi ${4 * a} cm. Aynı çevreli dikdörtgenin kısa kenarı kare kenarından ${b} cm kısa. İki alanın farkı kaç cm²?`, b * b, `Dikdörtgen kenarları ${a - b} ve ${a + b}. Kare alanı ${a * a}; dikdörtgen ${(a - b) * (a + b)}; fark ${b * b}.`, "cm²"),
          N(`Çevresi ${4 * a} m, kenarları pozitif tam sayı olan dikdörtgenlerden alanı en az ${a * a - b * b} m² olan kaç farklı kenar çifti vardır? Döndürülmüşler aynı sayılır.`, b + 1, `Kenarlar ${a} − t ve ${a} + t alınır. Alan ${a * a} − t × t. t = 0, 1, ..., ${b} uygundur: ${b + 1} çift.`),
          N(`Alanı ${a * b} m² olan dikdörtgen bir yapının kenarları pozitif tam sayı. ${a} m'ye ${b} m arsaya kenarlar paralel olacak biçimde sığması için kaç farklı kenar çifti uygundur? Döndürme serbest, döndürülmüşler aynı sayılır.`, 1, `Arsa ile yapının alanları eşit. Her iki yönde sığmak için arsanın tamamını kaplamalı: yalnız ${a} ve ${b} kenar çifti.`)
        ]
      };
      out.push(...tasks[topic]());
    }
    return out;
  }

  // Aynı kavram sorusunu üst seviyede tekrar kullanmak yerine konusuna uygun
  // yeni bir uygulama verilir. Üst üç seviyede doğru/yanlış bulunmaz.
  function application(topic, l, slot, attempt = 0) {
    const n = l * 20 + slot + 3 + attempt * 200;
    const a = 15 + (l * 11 + slot + attempt) % 50, b = l + 3, k = l + 1;
    const forms = {
      nokta: () => N(`AB = ${4 * n} cm. M, AB'nin; N ise AM'nin orta noktası. NB uzunluğu kaç cm?`, 3 * n, `AM = ${2 * n}, AN = ${n}. NB = AB − AN = ${3 * n}.`, "cm"),
      aci: () => N(`Bir robot ${k} kez ${a}° sola, sonra ${b} kez 5° sağa dönüyor. Net sola dönüş kaç derece?`, k * a - b * 5, `${k} × ${a} − ${b} × 5 = ${k * a - b * 5}.`, "°"),
      cember: () => N(`İki çemberin yarıçapları toplamı ${2 * n + b} cm, farkı ${b} cm. Büyük çemberin çapı kaç cm?`, 2 * (n + b), `Küçük yarıçap ${n}, büyük ${n + b}. Büyük çap ${2 * (n + b)}.`, "cm"),
      dikme: () => N(`Paralel kıyılar arasındaki dik uzaklık ${n} m, eğik köprü ${n + b} m. ${k} köprü dik yapılırsa metresi 40 TL malzemeden toplam kaç TL tasarruf edilir?`, k * b * 40, `Bir köprü ${b} m kısa olur. ${k} × ${b} × 40 = ${k * b * 40}.`, "TL"),
      paralel: () => N(`${n} yatay ve ${b} düşey doğruyla ızgara kuruluyor. Her aile kendi içinde paralel. Bir yatay ve iki düşey daha eklenince kesişim sayısı kaç artar?`, (n + 1) * (b + 2) - n * b, `Eski sayı ${n * b}, yeni sayı ${(n + 1) * (b + 2)}. Fark ${(n + 1) * (b + 2) - n * b}.`),
      olcme: () => N(`Bir araç dar açılarda ${b}° fazla gösteriyor. Ekrandaki ölçü ${a + b}°. Gerçek açıyı ${k} kez yan yana eklersen toplam kaç derece olur?`, a * k, `Gerçek açı ${a}°. Toplam ${k} × ${a} = ${a * k}°.`, "°"),
      durum: () => N(`Kesişen iki doğrunun komşu açılarının farkı ${180 - 2 * a}°. Bu kesişimdeki iki geniş açının toplamı kaç derece?`, 2 * (180 - a), `Komşuların toplamı 180°. Dar açı (180 − ${180 - 2 * a}) ÷ 2 = ${a}°. Geniş açı ${180 - a}°; ikisi ${2 * (180 - a)}°.`, "°"),
      cift: () => N(`Bir açının tümleri ${a}°. Bu açının bütünlerinin ${k} katından ${b}° çıkarılıyor. Sonuç kaç derece?`, (90 + a) * k - b, `Açı ${90 - a}°, bütünleri ${90 + a}°. ${90 + a} × ${k} − ${b} = ${(90 + a) * k - b}.`, "°"),
      cokgen: () => N(`Bir çokgenin kenar ve köşe sayılarının toplamı ${2 * (l + 4)}. Her kenarı ${n} cm olan bu düzgün çokgenin çevresi kaç cm?`, (l + 4) * n, `Kenar sayısı ${l + 4}. Çevre ${l + 4} × ${n} = ${(l + 4) * n}.`, "cm"),
      ucgen: () => N(`İkizkenar üçgenin tepe açısına komşu dış açı ${2 * a}°. Eş taban açılarından biri kaç derece?`, a, `Tepe açısı ${180 - 2 * a}°. İki eş taban açısının toplamı ${2 * a}°; biri ${a}°.`, "°"),
      insa: () => N(`İki eş yarıçaplı kesişen çemberle kurulan ikizkenar üçgenin çevresi ${3 * n + b} cm. Merkezler uzaklığı ortak yarıçaptan ${b} cm fazla. Merkezler arası uzaklık kaç cm?`, n + b, `Çevre 3 yarıçap + ${b}. Yarıçap ${n}; merkezler uzaklığı ${n + b}.`, "cm"),
      okuma: () => N(`Binler bölüğü ${n}, milyonlar bölüğü ${b}, birler bölüğü ${k} olan sayıyı rakamlarla yaz.`, b * 1e6 + n * 1000 + k, `Bölükler ${b} | ${String(n).padStart(3, "0")} | ${String(k).padStart(3, "0")}.`),
      basamak: () => N(`${n * 10000 + 201} sayısının binler basamağı ${b} artırılıp yüzler basamağı 1 azaltılıyor. Sayı kaç artar?`, b * 1000 - 100, `Binlerden ${b * 1000} artış, yüzlerden 100 azalış: net ${b * 1000 - 100}.`),
      sirala: () => N(`${n * 100} < N < ${n * 100 + 100} aralığında, onlar basamağı ${b} olan kaç doğal sayı vardır?`, 10, `Sayılar ${n * 100 + b * 10} ile ${n * 100 + b * 10 + 9} arasındadır: 10 sayı.`),
      islem: () => N(`İki sayının toplamı ${3 * n}, farkı ${n}. Büyük sayının ${b} eksiği kaç?`, 2 * n - b, `Büyük sayı (${3 * n} + ${n}) ÷ 2 = ${2 * n}. Sonuç ${2 * n - b}.`),
      carpan: () => N(`Bölen ${b}, bölüm ${n}, kalan ${b - 1}. Bu bölünenin ${k} katı kaçtır?`, (b * n + b - 1) * k, `Bölünen ${b * n + b - 1}; ${k} katı ${(b * n + b - 1) * k}.`),
      problem: () => N(`${n} kişiye ${b} kişilik araç tutuluyor. Araç başına ücret ${k * 100} TL. En az taşıma maliyeti kaç TL?`, Math.ceil(n / b) * k * 100, `Araç sayısı ${Math.ceil(n / b)}; maliyet ${Math.ceil(n / b) * k * 100}.`, "TL"),
      cevre: () => N(`Dikdörtgenin kısa kenarı ${n} cm, uzun kenarı ${b} cm daha fazla. Çevrenin ${k} katı uzunlukta tel kaç cm?`, 2 * (2 * n + b) * k, `Uzun kenar ${n + b}. Çevre ${2 * (2 * n + b)}, ${k} katı ${2 * (2 * n + b) * k}.`, "cm"),
      alan: () => N(`Kenarları ${n} ve ${b} m olan zemine, kenarları ${k} ve 2 m bir halı seriliyor. Açık alanın m²'si 10 TL'ye kaplanırsa maliyet kaç TL?`, (n * b - 2 * k) * 10, `Açık alan ${n * b} − ${2 * k} = ${n * b - 2 * k} m². Maliyet ${(n * b - 2 * k) * 10}.`, "TL"),
      iliski: () => N(`Çevresi ${4 * n} m olan kareyle aynı çevreli bir dikdörtgenin kısa kenarı ${n - b} m. Kare ile dikdörtgenin alan farkı kaç m²?`, b * b, `Diğer kenar ${n + b}. Alanlar ${n * n} ve ${(n - b) * (n + b)}; fark ${b * b}.`, "m²")
    };
    return forms[topic]();
  }

  const cache = new Map();
  function get(topicId, level) {
    if (!builders[topicId] || !G.BANK_LEVELS.some(l => l.id === level)) throw new Error("Geçersiz konu veya seviye");
    const key = topicId + ":" + level;
    if (!cache.has(key)) {
      const prompts = new Set();
      for (const lv of G.BANK_LEVELS) {
        const bankKey = topicId + ":" + lv.id;
        const rng = G.makeRng([...bankKey].reduce((sum, c) => sum * 31 + c.charCodeAt(0), 7) % 2147483646);
        const rows = lv.id >= 4 ? advanced(topicId, lv.id) : builders[topicId](lv.id);
        if (rows.length !== 15) throw new Error(bankKey + ": Her seviyede tam 15 soru olmalı");
        rows.forEach((original, i) => {
          let q = original, attempt = 0;
          while (prompts.has(q.prompt) || lv.id >= 3 && q.scoringType === "true-false") q = application(topicId, lv.id, i, attempt++);
          prompts.add(q.prompt);
          q.id = bankKey + ":" + String(i + 1).padStart(2, "0");
          q.level = lv.id;
          q.points = q.scoringType === "true-false" ? 5 : lv.points;
          if (q.choices) q.choices = G.shuffle(rng, q.choices);
          if (lv.id === 1 && q.kind === "num") q.hint = q.explain;
          rows[i] = q;
        });
        cache.set(bankKey, rows);
      }
    }
    return cache.get(key).map(q => JSON.parse(JSON.stringify(q)));
  }
  root.MatQuestionBank = { get, perLevel: 15, perTopic: 75, total: Object.keys(builders).length * 75, version: 2 };
})(typeof window !== "undefined" ? window : globalThis);
