# Ders planı ve kaynak okuyucu

Plan 5 hafta, 35 oturumdur. Her oturum 45 dakika; toplam süre 26 saat 15 dakikadır. Her modülde üç deneme bulunur. İlk 28 oturumun numaraları korunduğu için önceki tamamlama kayıtları geçerlidir. Tamamlama, aday tarafından işaretlenir; süre ölçümü değildir.

Ana kaynak SPL'nin Temmuz 2026 tarihli `Masak_Rehber.pdf` belgesidir. Sonraki mevzuat değişikliklerini kapsadığı varsayılmaz. Kaynak değiştirilmeden, ilk açılışta site içinden indirilerek PDF.js ile gösterilir. Tarayıcı görünümü ve doğrudan PDF bağlantısı alternatif olarak sunulur.

`npm run build:pages`, `scripts/prepare-guide.mjs` üzerinden ana kaynağı SPL'den indirir ve SHA-256 özetiyle doğrular. Bu nedenle PDF'nin bilgisayarda bulunması yayın için yeterli sayılmaz; CI derlemesi kendi kopyasını oluşturur. Belge değişmişse veya indirilemiyorsa eksik PDF ile yayın yapmak yerine derleme durur.

Yerel testlerden önce `node scripts/prepare-guide.mjs` çalıştırılmalıdır. PDF ilk yüklenmeden çevrimdışı okuma beklenmez. Tamamlama ve sayfa kayıtları yalnız o tarayıcıda saklanır.
