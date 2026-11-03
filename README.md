# Daily

Safari 15.4+ için bağımlılıksız görev listesi.

```sh
cd /workspace/Daily
python3 -m http.server 8080 --bind 0.0.0.0
```

Görevi üstteki alana yazıp Enter ile ekle. Yukarı/aşağı oklarıyla sırala; sağdaki tik görevi alttaki açık Yapılanlar bölümüne taşır. Oradan yeniden açabilir veya 7 saniye içinde geri alabilirsin. Önceki sürümde kaydedilmiş görevler korunur, tüm tarihler tek listede görünür.

Her görevdeki Alarm alanında tarih ve saat seç. Alarm sesini aç düğmesine dokunarak sesi etkinleştir. Alarmlar sayfa açıkken kontrol edilir, kaçırılmış alarmlar sayfaya geri dönünce gösterilir. Yapılan görevlerin alarmı çalmaz. Alarm saati cihazın yerel saat dilimindedir.

Safari kapalıyken veya cihaz kilitliyken alarm garantisi yoktur; arka plandaki zamanlayıcı ve ses tarayıcı tarafından durdurulabilir. Kapalı uygulamada bildirim için Web Push ve bir sunucu gerekir (iOS'ta ana ekrana eklenen uygulama ve bildirim izni de gerekir). Bu sürüm yalnızca sayfa içi alarm ve isteğe bağlı ses sağlar.

Safari'ye döndüğünde (sekme değişimi, geri/ileri önbelleği, ekran kilidinden dönüş) gecikmiş alarmlar kontrol edilir. Sayfa gizliyken alarm tüketilmez. Çalmış ama kapatılmamış uyarı yenilemeden sonra da görünür. Safari sesi durdurursa düğme yeniden “Alarm sesini aç” olur; devam etmek için dokun.

iPhone'da tarih/saat alanları Safari'nin yerleşik seçicisini kullanır. Girişler yakınlaştırmayı önlemek için en az 16px, dokunma hedefleri mobilde en az 44px; çentik ve ana ekran göstergesi için güvenli kenar boşlukları bulunur.

Safari'de sunucunun HTTP/HTTPS adresini aç; dosyayı Dosyalar uygulamasındaki önizleme ile açma. iPhone başka cihazdaki geliştirme sunucusuna erişecekse aynı ağda o cihazın IP adresini kullan. Yerel sunucu geliştirme içindir; dışarıya dağıtım için HTTPS statik barındırma kullan.

Kayıtlar localStorage'da bu tarayıcıya özeldir. Site verilerini silmek kayıtları siler. Gerçek Safari cihaz testi yapılmadı. Bu ortamda WebKit kurulu değil; ağ proxy bağlantısı çalışmadığından indirilemedi. Chromium sonuçları Safari doğrulaması değildir.

```sh
node tasks.test.js
# Playwright Python ve Chromium bulunan ortamda:
python3 browser.test.py
# Playwright WebKit ve sistem bağımlılıkları kuruluysa:
BROWSER=webkit python3 browser.test.py
```
