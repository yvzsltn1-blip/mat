# Matematik Atölyesi

Başlatmak için `index.html` dosyasını tarayıcıda açın. Önceden açık sayfada güncellemeleri görmek için Ctrl+F5 kullanın.

- 20 konu, konu başına 75 farklı soru; 5 seviyenin her birinde 15 soru, toplam 1.500 soru.
- Keşif 10, Alıştırma 20, Problem 35, Meydan okuma 50, Özel zor 80 puan. Doğru/yanlış soruları yalnız ilk iki seviyede bulunabilir ve her zaman 5 puandır. Ekranda sorunun gerçek puanı gösterilir.
- Üst iki seviyede ters işlem, birden fazla koşul, sayma, maliyet ve en iyi çözümü bulma soruları vardır. Her sorunun çözümü ve ipucu bulunur.
- Öğrenci seviyeyi seçebilir veya şansına bırakabilir. Rastgele modda her soru öncesinde önce seviye belirlenir, ardından o seviyenin sorusu açılır.
- Öğretmen soru başına süre veya süresiz oyun seçebilir. Özel süre 5–3600 saniyedir. Sayaç yalnız soru açılınca başlar; öğrenci çekilişinde durur ve öğretmen tarafından duraklatılabilir.
- Turlar 1, 5, 10 veya 15 sorudur. 1 soruluk tur sınıftaki öğrencilerin sırayla oynaması için kullanılabilir. Tur sırasında da öğrenci değiştirilebilir.
- Aynı konu ve seviyedeki 15 soru gösterilmeden soru tekrarlanmaz. Havuz bitince yeniden karıştırılır. Kullanılan sorular tarayıcı kapansa da hatırlanır.
- Yanlış cevap ve sürenin dolması puan silmez. Puan yalnız cevabı veren öğrenciye, dolayısıyla grubuna yazılır.
- Üstteki “Başlangıç” düğmesi öğrenci eklenmemişken ve tahta modunda da konu haritasına döner.

Sorular `matematik5-1-web-promtu.txt` ile `matematik5-1.pdf` kapsamı temel alınarak özgün hazırlanmıştır. Özel zor seviye, temel kazanımları birleştiren ek muhakeme ve sayma görevleri içerir.

Kontrol komutu: `node tests/verify.cjs`. Harici bağımlılık olmadan 1.500 sorunun kimliklerini, tekrarlarını, cevap biçimlerini, 5 puanlık doğru/yanlış kuralını, 100 tam turu, puanlamayı, süreyi, duraklatmayı ve kalıcılığı doğrular.

## Sınıf sistemi (Firebase)

- Tek kullanıcı vardır: elif@gmail.com (Firebase Authentication). Yeni hesap oluşturulamaz; Firestore kuralları da yalnız bu hesaba izin verir. Şifre, giriş yaptıktan sonra üst çubuktaki 🔑 düğmesinden değiştirilir.
- Veriler Firestore'da saklanır:  (ayarlar) ve  (öğrenciler, gruplar, puanlar, istatistikler, son 60 tur). Kurallar  dosyasındadır; her öğretmen yalnız kendi verisini görür. Yayınlamak için: [1m[37m===[39m Deploying to 'elifsul'...[22m

[36m[1mi [22m[39m deploying [1mfirestore[22m
[36m[1mi  firestore:[22m[39m ensuring required API [1mfirestore.googleapis.com[22m is enabled...
[36m[1mi  firestore:[22m[39m ensuring required API [1mfirestore.googleapis.com[22m is enabled...
[36m[1mi  cloud.firestore:[22m[39m checking [1mfirestore.rules[22m for compilation errors...
[32m[1m+  cloud.firestore:[22m[39m rules file [1mfirestore.rules[22m compiled successfully
[36m[1mi  firestore:[22m[39m latest version of [1mfirestore.rules[22m already up to date, skipping upload...
[36m[1mi [22m[39m [1m[36mfirestore: [39m[22mdeploying indexes...
[32m[1m+  firestore:[22m[39m released rules [1mfirestore.rules[22m to [1mcloud.firestore[22m

[32m[1m+ [22m[39m [1m[4mDeploy complete![24m[22m

[1mProject Console:[22m https://console.firebase.google.com/project/elifsul/overview.
- Sınıflarım: 5–8. sınıf, şube ve eğitim yılına göre sınıflar. Eski yıllar silinmeden arşivlenebilir.
- Öğrenci listesi e-Okul/Excel'den yapıştırılabilir; okul numarası ayrılır, BÜYÜK HARFLİ isimler düzeltilir. İsim ve numara tabloda düzenlenir, yoklama tutulur (gelmeyenler çekilmez).
- Gruplar: 2–8 grup, rastgele veya puana göre dengeli dağıtım; ad, simge, renk değiştirme, sürükle-bırak ile taşıma, silme, grup puanı.
- “Her sorudan sonra yeni öğrenci” ve “Herkese sıra gelsin” ayarları öğretmen panelinden açılıp kapatılır.
- Sıralama (kürsü), rapor (soru/doğru/yanlış/başarı, konu ve seviye kırılımı), CSV dışa aktarma, elle ödül puanı.
- İnternet yoksa Firebase yüklenemezse “Bu cihazda devam et” ile çevrimdışı çalışır. Bu tarayıcıda eski sürümden kalan sınıf, ilk girişte buluta aktarılır.

## Sınırsız görsel sorular

Konunun “Oyna” ekranında **♾️ Sınırsız görsel** (varsayılan) ve **📚 Soru bankası (75)** arasında seçim yapılır; seçim kalıcıdır.

- Sınırsız modda her soru `assets/level-gen.js` tarafından o anda üretilir: yeni sayılar, yeni çizim, çözüm ve ipucu. Sorular bitmez; son 80 soru tekrar etmez.
- 20 konunun her birinde 5 seviyeye göre zorlaşan 5–10 farklı soru kalıbı vardır (toplam 133 kalıp). Çizimler yalnız verilenleri gösterir, aranan değer “?” ile işaretlenir.
- Soru türleri: cetvel, sayı doğrusu, iletki, saat kadranı, abaküs, onluk bloklar, basamak kartları, bar modeli, kareli zemin, pergelle inşa, kesişen/paralel doğrular, çokgenler, hikâye kutuları…
- Çalışma kâğıdı tarzı **kareli zemin** soruları: d doğrusuna paralel/dik olanı bulma, kaç doğrunun paralel/dik olduğunu sayma, “a ⊥ e”, “d // f” ifadelerinden doğru olanı seçme, siyah noktadan geçen paralel/dik doğruyu seçme, iki doğrunun durumunu belirleme.
- Her soru seviyenin puanını kazandırır (10/20/35/50/80). Üretici kontrolü: `node tests/level-gen.cjs`.

## Anlat sekmesinin ileri adımları

5. sınıfın 20 konusunda ilk “Ders anlatımı” adımından sonraki statik çizimler `assets/lesson-play.js` ile dokunulan ve kendi kendine oynayan modellere çevrildi; her konuya yeni örnek adımları eklendi (toplam 22).

- Örnekler: AB doğrusuna d doğrusunu koyup döndürme ve 90°de “d ⊥ AB” görme, gönyeyle diklik kontrolü, 6‑6‑6 çubuklarla üçgen kurma ve 6‑6‑55 çubuklarla uçların buluşamaması, üçgenin köşelerini kesip 180° yapma, kapı/saat açıları, raylarda aralık ölçme, harflerde paralel ve dik çizgiler, onluk bloklarla eldeli toplama ve onluk bozma, timsahla <, > işaretleri, karıncanın çevrede yürümesi, fayans döşeme…
- Her modelde “▶ İzle” düğmesi örnekleri sırayla kendisi oynatır. Kaydırıcı sürüklenirken çizim anında güncellenir.
- Kontrol: `node tests/lesson-play.cjs`.

## Görsel oyunlar

Her konunun “Oyna” panelinde, seviye kartlarının altında “🎮 Görsel oyunlar” bulunur. Sorular `assets/arcade-gen.js` tarafından her seferinde çizimlerle yeniden üretilir (iletki, abaküs, sayı doğrusu, nokta dizileri, kareli alan, çokgenler, üçgenler…); 20 konu × 3 zorlukta sınırsız soru çıkar.

- **📐 Açı Düellosu** (Ters, tümler ve bütünler açılar): Bir öğrenci kırmızı kolu sürükleyip açıyı çizer; bıraktığı anda geri sayım başlar ve diğer öğrenci tümlerini/bütünlerini yazar. Roller her turda değişir. Puan: 10 + kalan saniye.
- **🎈 Balon Patlat** (tüm konular): Doğru cevabın yazdığı balon uçup gitmeden patlatılır. Hızlı cevap daha çok puan getirir; her soruda tek hak.
- **⚔️ Kapışma** (tüm konular): İki öğrenci ekranın iki yanında kendi tuş takımıyla aynı soruya yarışır. Yanlış cevap 2 saniye ceza.
- **🎯 Göz Kararı** (açı ve sayı konuları): Açının ölçüsünü tahmin etme ya da sayıyı sayı doğrusunda bulma; yakınlığa göre puan.

Oyun puanları öğrencinin puanına, grubuna, istatistiklerine ve rapordaki “Son turlar” listesine yazılır. Üretici kontrolü: `node tests/arcade-gen.cjs`.


## 7. s?n?f ? 1. kitap

S?n?flar?m ekran?nda **7. s?n?f** olu?turun veya mevcut 7. s?n?f?n?z? a??n. Konu haritas? s?n?f?n seviyesine g?re de?i?ir. 5. s?n?f?n 20 konusu kendi haritas?nda kal?r; 6 ve 8. s?n?flar i?in mevcut tekrar kapsam? kullan?l?r.

- Kaynak: `matematik7-1-web-promtu.txt`. D?rt tema ve 22 etab?n tamam?: Say?lar Uzay? (8), Prizma Diyar? (6), Veri K??ifleri (6), Simetri At?lyesi (2).
- 124 anlat?m ad?m?: kavramlar, ??z?ml? ?rnekler, s?k hatalar, 22 konu sonu kontrol sorusu ve 16 etkile?imli ara? yerle?imi.
- 1.650 sabit kimlikli ?zg?n soru: her konuda 5 seviye ? 15 soru. Her soruda ??z?m, ipucu, kazan?m etiketi ve g?rsel/model bulunur. ?st seviyelerde ters i?lem, birden fazla ko?ul ve ara?t?rma ele?tirisi sorular? eklenir.
- Ayn? kazan?mlarla rastgele soru ?retimi, Balon Patlat ve Kap??ma. Negatif, ondal?k, kesir ve kavram cevaplar? se?eneklerle verilir; Kap??ma da bu se?enekleri iki oyuncuya sunar. Uzun balon se?enekleri A?D a??klama listesinde okunur.
- Say? do?rusu, prizma alan/hacim, istatistik ve yans?ma ara?lar?. ?statistik arac?na ?rne?in `2; 4; 4; 10` yaz?labilir; ondal?k virg?l desteklenir.
- ??renci puanlar?, konu y?ld?zlar?, tekrar ?nleme, s?n?f raporlar? ve mevcut yerel/bulut kay?t ak??? ortak motoru kullan?r. 7. s?n?f konu kimlikleri `m7-` ile ba?lar.

??erikler: `assets/curriculum7.js`; sorular: `assets/questions7.js`; etkile?imli ara?lar: `assets/labs7.js`.
Kontrol: `node tests/grade7.cjs` (1.650 banka sorusu, 6.600 ?retilen soru, 220 tur, s?n?fa g?re harita, ba?lant?lar, kesirli Kap??ma ve istatistik hesaplar?).

Bu ekleme mevcut ??retmen/s?n?f uygulamas?n?n ak???n? kullan?r. Kaynak belgedeki ayr? macera haritas?, d?nya kaleleri, rozetler ve poster d?zenleyicisi bu kapsamda uygulanmam??t?r. De?i?iklikler yereldir; Firebase yay?n? ayr?ca yap?l?r.

### Rasyonel say?larda g?rsel kar??la?t?rma

1.5 konusu ?nce yedi kural? ve p?f noktas?n? i?eren d?z konu anlat?m?yla a??l?r. ?Etkile?imli ?rneklere ge?? d??mesinden sonra sekiz etkile?imli ad?m gelir: i?aret, tam k?s?m, 0?1/2?1 referanslar?, e? payda, e? pay, pay/payda e?itleme, ondal?k kar??la?t?rma ve negatiflerde s?ralama. Ayn? ?l?ekli kesir ?eritleri ve say? do?rusu kayd?r?c?larla g?ncellenir. Her ad?mda bir kontrol sorusu vard?r. Kaynak g?rselin kurallar? ?zg?n ?rneklerle i?lenmi?tir. Mod?l: `assets/compare7.js`; kontrol: `node tests/compare7.cjs`.
