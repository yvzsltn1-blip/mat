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

- Seviye oyunlarındaki sorular düz metin olarak kalmaz: `assets/question-visuals.js` soru metnini okuyup konuya uygun bir çizim üretir (noktalar ve uzunluklar, açı parçaları, kesişen doğrular, çemberler, inşa çemberleri, çokgenler, üçgenler, dikdörtgen bahçe/oda/halı, basamak kartları, bölük kutuları, sayı doğrusu, işlem kartları, alt alta işlem, bölme şeması, gruplar). Uygun desen yoksa “Verilenler / İstenen” kartlarıyla görsel bir özet gösterilir. Çizimde yalnız soruda verilen sayılar kullanılır; cevap gösterilmez. Kontrol: `node tests/question-visuals.cjs`.

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

## Görsel oyunlar

Her konunun “Oyna” panelinde, seviye kartlarının altında “🎮 Görsel oyunlar” bulunur. Sorular `assets/arcade-gen.js` tarafından her seferinde çizimlerle yeniden üretilir (iletki, abaküs, sayı doğrusu, nokta dizileri, kareli alan, çokgenler, üçgenler…); 20 konu × 3 zorlukta sınırsız soru çıkar.

- **📐 Açı Düellosu** (Ters, tümler ve bütünler açılar): Bir öğrenci kırmızı kolu sürükleyip açıyı çizer; bıraktığı anda geri sayım başlar ve diğer öğrenci tümlerini/bütünlerini yazar. Roller her turda değişir. Puan: 10 + kalan saniye.
- **🎈 Balon Patlat** (tüm konular): Doğru cevabın yazdığı balon uçup gitmeden patlatılır. Hızlı cevap daha çok puan getirir; her soruda tek hak.
- **⚔️ Kapışma** (tüm konular): İki öğrenci ekranın iki yanında kendi tuş takımıyla aynı soruya yarışır. Yanlış cevap 2 saniye ceza.
- **🎯 Göz Kararı** (açı ve sayı konuları): Açının ölçüsünü tahmin etme ya da sayıyı sayı doğrusunda bulma; yakınlığa göre puan.

Oyun puanları öğrencinin puanına, grubuna, istatistiklerine ve rapordaki “Son turlar” listesine yazılır. Üretici kontrolü: `node tests/arcade-gen.cjs`.
