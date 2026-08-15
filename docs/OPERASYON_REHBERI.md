# Geleceğin Dijital Sağlık Liderleri — Operasyon ve El Kitabı (Final)

Bu doküman, Geleceğin Dijital Sağlık Liderleri platformunun üretim mimarisini, güvenlik kurallarını, veri akışlarını, yeni eklenen modüllerini (katılımcı profili, haftalık program, program görevleri ve materyalleri, mentor aktif paneli ve gizli notlar, çok katılımcılı teslim matrisi, yapay zeka İçerik DNA motoru ve görsel renderer), operasyonel süreçlerini ve depolama mimarisini eksiksiz olarak tanımlar.

---

## 1. Proje Durumu Özeti

Geleceğin Dijital Sağlık Liderleri platformu, sunucusuz (serverless) mimariye tamamen aktarılmıştır. Eski Django REST API katmanına olan tüm canlı runtime bağımlılıkları kesilmiş, backend kodları `legacy_backend/` klasöründe pasif arşiv durumuna getirilmiştir. Proje canlı üretim ortamında kesintisiz ve yüksek performansla çalışmaktadır.

---

## 2. Aktif Mimari

Platform aşağıdaki sunucusuz ve bulut tabanlı teknolojiler üzerinde çalışır:

```
[İstemci / Tarayıcı]
       │
       ├──► Cloudflare Workers / Pages (React 19 + Vite SPA)
       │
       ├──► Supabase Auth (JWT Session & Rol Yönetimi)
       │
       ├──► Supabase Postgres Database (Row Level Security - RLS)
       │
       ├──► Supabase Edge Functions (Deno / TypeScript - Güvenli Admin/Mentor/AI İşlemleri)
       │      ├── admin-actions
       │      ├── mentor-actions
       │      ├── ai-content-dna
       │      └── google-drive-action
       │
       └──► Google Drive API (Service Account - Dosya, Materyal & Fotoğraf Depolama)
```

---

## 3. Canlı Ortam Bilgileri

* **Canlı Web Platformu URL**: `https://gelecegin-saglik-liderleri.omerkarapinar.workers.dev/login`
* **Supabase Proje Referansı**: `wczupupflxvfnjbjkfrj`
* **Supabase API URL**: `https://wczupupflxvfnjbjkfrj.supabase.co`

---

## 4. Roller ve Yetki Mantığı

Sistemde 3 temel kullanıcı rolü tanımlıdır:

| Rol | Kod | Tanım | Giriş Yönlendirmesi |
|---|---|---|---|
| **Admin** | `admin` | Tam yetkili sistem yöneticisi | `/admin` |
| **Mentor** | `mentor` | Takım rehberi / değerlendirici / özel not yöneticisi | `/mentor` |
| **Katılımcı** | `katilimci` | Programa kabul edilen sağlık lideri adayı | `/katilimci` |

Giriş yapıldığında kullanıcının rolü `profiles` tablosundan okunur ve yetkisiz sayfa erişimleri (örneğin Katılımcının `/admin` veya `/mentor` yoluna gitmesi) otomatik olarak kendi paneline yönlendirilir veya engellenir.

---

## 5. Supabase Auth ve Profiles

* Kullanıcı kimlik doğrulaması Supabase Auth (`auth.users`) üzerinden yürütülür.
* Her `auth.users` kaydı için `public.profiles` tablosunda birebir eşleşen bir profil nesnesi bulunur:
  * `id`: `auth.users.id` ile aynı (UUID)
  * `email`: Kullanıcı e-posta adresi
  * `role`: `admin` | `mentor` | `katilimci`
  * `ad_soyad`: Kullanıcı tam adı
  * `telefon`: İletişim numarası
  * `avatar_url`: Profil resmi bağlantısı
  * `core_katilimci_id`: Katılımcı ise `core_katilimci` tablosundaki ID ilişki değeri
  * `core_mentor_id`: Mentor ise `core_mentor` tablosundaki ID ilişki değeri

---

## 6. RLS Güvenlik Özeti

Supabase Postgres veritabanındaki tüm tablolarda **Row Level Security (RLS)** etkindir:

* **Katılımcılar**: Yalnızca kendi teslimlerini (`core_teslim`), kendi DNA testlerini (`core_icerikdnatesti`) ve kendi profil bilgilerini okuyabilir/güncelleyebilir. Diğer katılımcıların verilerini veya mentor özel notlarını göremez.
* **Mentorlar**: Yalnızca kendi takımlarına atanmış katılımcıların verilerini, görev teslimlerini ve katılımcı profillerini okuyabilir. Ekledikleri özel mentor notları sadece kendilerine ve sisteme aittir.
* **Adminler**: Tüm tablolarda tam okuma, yazma, güncelleme ve silme yetkisine sahiptir.
* **Anonim (Giriş Yapmamış)**: Tablolara doğrudan erişimi engellenmiştir; başvuru formu gibi alanlar güvenli fonksiyonlar üzerinden çalışır.

---

## 7. Edge Functions

Hassas ve yetki gerektiren tüm işlemler Supabase Edge Functions (Deno runtime) üzerinde `SUPABASE_SERVICE_ROLE_KEY` ile izole şekilde çalışır:

1. **`admin-actions`**: Aday kabul/red işlemleri, mentor kullanıcısı ve profil oluşturma/silme, CSV aday içe aktarma yetkilerini güvenle yürütür.
2. **`mentor-actions`**: Mentorların katılımcı detaylarını okuması, teslimler için revizyon istemesi, nihai değerlendirme/puanlama yapması ve katılımcıya özel gizli mentor notlarını yönetmesini (`get_participant_notes`, `create_participant_note`, `update_participant_note`, `delete_participant_note`) sağlar.
3. **`ai-content-dna`**: Katılımcının 20 soruluk DNA yanıtlarını alır, Google Gemini AI API (Gemini 2.5 Flash) çağrısı yaparak çapraz analizli ve yapılandırılmış 7 bölümlük strateji raporu üretir.
4. **`google-drive-action`**: Google Service Account kullanarak dosya yükleme, klasör oluşturma, program materyali yükleme ve dosya erişim bağlantılarını yönetir.

---

## 8. Google Drive Entegrasyonu

* **Service Account**: Tüm dosya, materyal ve fotoğraf yüklemeleri dedicated bir Google Service Account üzerinden gerçekleşir.
* **Root Klasör**: Ana proje klasöründe (`GOOGLE_DRIVE_ROOT_FOLDER_ID`) her katılımcı için izole klasör açılır.
* **Klasör Yapısı**: `[Katılımcı Adı]_[Katılımcı ID]` formatında düzenlenir. Program materyalleri ise `Eğitim Programı Materyalleri` genel klasöründe saklanır.
* **Dosya Linkleri**: Yüklenen dosyaların indirme ve görüntüleme linkleri `core_teslim.teslim_linki` / `core_teslim.teslim_dosyasi` alanlarına yazılır.
* **Secret Yönetimi**: `GOOGLE_SERVICE_ACCOUNT_JSON` ve `GOOGLE_DRIVE_ROOT_FOLDER_ID` yalnızca Edge Function secret alanında saklanır.

---

## 9. Katılımcı Profil Modülü

Katılımcıların program süresince mesleki ve kişisel bilgilerini güncel tutabilmeleri ve mentor/adminlerin katılımcıları yakından tanıyabilmeleri için kapsamlı profil sistemi geliştirilmiştir:

* **Tutulan Profil Alanları**:
  * `telefon`: İletişim numarası
  * `adres`: İkamet / şehir bilgisi
  * `okul_bilgisi`: Mezun olunan / devam edilen üniversite ve fakülte tam bilgisi
  * `egitim_durumu`: Öğrenci, Mezun, Yüksek Lisans, Doktora vb.
  * `is_durumu`: Çalışıyor, Çalışmıyor, Stajyer, Serbest vb.
  * `calistigi_kurum`: Eczane, Hastane, Şirket, Üniversite vb.
  * `pozisyon`: Eczacı, Hekim, Diyetisyen, Stajyer vb.
  * `is_aciklamasi`: Yürütülen mesleki sorumlulukların kısa özeti
  * `profil_fotografi_url` & `profil_fotografi_file_id`: Yüklenen fotoğrafın Google Drive bağlantısı ve ID'si
  * `profil_guncelleme_tarihi`: Son profil güncelleme zaman damgası
* **Düzenleme Yetkisi & Güvenlik**:
  * Yukarıdaki alanlar katılımcı tarafından Katılımcı Paneli > Profil sekmesinden düzenlenebilir (`updateKatilimciProfilim` allowlist korumalıdır).
  * Ad, soyad, üniversite ve sınıf bilgileri ilk başvuru kaydından (`core_aday`) otomatik beslenir ve veri tutarlılığı için read-only olarak gösterilir.
* **Profil Fotoğrafı ve Drive Thumbnail Optimizasyonu**:
  * Katılımcı 5 MB'a kadar JPEG, PNG veya WEBP formatında fotoğraf yükleyebilir.
  * Fotoğraflar Google Drive'a yüklenir ve doğrudan `webViewLink` yerine yüksek hızlı Google Drive Thumbnail API (`https://drive.google.com/thumbnail?id=...&sz=w400`) formatı ile render edilir (`getParticipantAvatarSrc` / `getDriveThumbnailUrl`).
* **Admin ve Mentor Profil Görünümü**:
  * Admin, Performans ve Aday listelerinden katılımcı detay modalını açarak tüm profil bilgilerini ve fotoğrafını görüntüleyebilir.
  * Mentor, Katılımcılarım sekmesinden takımındaki her üyenin profil detay kartını açarak inceleyebilir.

---

## 10. Haftalık Program Modülü

3 haftalık yoğun eğitim ve uygulama sürecinin tüm oturum akışını yöneten interaktif eğitim programı modülüdür:

* **Statik Program Konfigürasyonu**:
  * Program akışı `src/data/programSchedule.js` dosyasındaki `PROGRAM_WEEKS` ve `PROGRAM_SUMMARY` tanımlarından beslenir (3 hafta, 6 canlı gün, 18 oturum, 3 saha görevi).
* **Aktif Hafta Koruması**:
  * Katılımcı tüm haftaları baştan göremez; yalnızca admin tarafından ilgili haftanın saha görevi aktif edildiğinde o hafta otomatik olarak katılımcı paneline açılır.
* **Salı / Perşembe Oturum Ayrımı**:
  * Her hafta Salı (Strateji, popüler kültür, diksiyon, AI senaryo kurgusu) ve Perşembe (Yasal sınırlar, vaka analizleri, konuk sunumları, WHO sandviç metodu) olmak üzere belirgin iki blok halinde gösterilir.
  * Her oturumun sıra numarası, süresi, başlığı, konuk bilgisi ve detaylı kazanım açıklaması listelenir.
* **Bağlantı & İçerik Akışı**:
  * Sayfa canlı yayın link karmaşasından arındırılmış olup, oturum kazanımları ve eğitim materyalleri odaklı yapılandırılmıştır.
* **Materyal Entegrasyonu**:
  * Hafta kartının başlık alanında ilgili haftaya ait eğitim dokümanı / PDF materyali varsa tek tıkla açma butonu yer alır.

---

## 11. Program Görevleri Modülü

Eğitim oturumlarıyla doğrudan entegre çalışan hazır saha ve final görevleri mekanizmasıdır:

* **Hazır Görev Şablonları (`PROGRAM_TASKS`)**:
  * **1. Hafta (Saha Görevi)**: *Çift Versiyonlu Antibiyotik Senaryosu* (`week1-antibiyotik-cift-versiyon`) — Eğitimli kitle ve genel halk için iki farklı dilde senaryo metni/video teslimi.
  * **2. Hafta (Saha Görevi)**: *Etkileşim Odaklı Kanca ve Yapay Zeka Senaryosu* (`week2-hook-ai-senaryo`) — 5 kanca cümlesi, AI destekli taslak senaryo ve CTA kurgusu.
  * **3. Hafta (Final Görevi)**: *WHO Sandviç Metodu ile Sağlık Miti Videosu* (`week3-who-sandvic-final`) — 60 saniyelik dikey mit çürütme videosu.
* **Admin Tarafından Aktivasyon**:
  * Admin Görevler sekmesinden hazır şablonu seçer, maksimum puanı (örn: 100) belirler, isterse son teslim tarihini düzenler ve tek tıkla görevi aktif eder (`activateProgramGorev`).
* **`program_task_key` Duplicate Koruması**:
  * Sistem veritabanında `program_task_key` veya görev adı üzerinden çift kayıt kontrolü yapar; aynı haftalık görevin mükerrer oluşturulmasını kesin olarak engeller.
* **`core_gorev` Entegrasyonu**:
  * Oluşturulan görev `core_gorev` tablosunda `program_task_key`, `program_week`, `program_task_type`, `maksimum_puan` ve `material_*` alanlarıyla standart görevler gibi saklanır.
* **Katılımcı Teslim Akışı**:
  * Aktif edilen görev anında katılımcının "Görevlerim" sekmesine düşer; katılımcı dosya veya bağlantı yükleyerek teslim eder.
* **Mentor Bağlamsal Değerlendirmesi**:
  * Mentor teslim listesinde görevin hangi haftaya ait bir saha görevi veya final görevi olduğunu rozetlerle görür ve belirlenen maksimum puan bareminde değerlendirme yapar.

---

## 12. Program Materyalleri Modülü

Adminlerin eğitim haftalarına ve görevlere özel kaynak belge, sunum veya yönerge eklemesini sağlar:

* **Materyal Türleri**:
  * **Harici Bağlantı**: Google Drive, Notion, YouTube, Canva veya web bağlantısı (`material_url`).
  * **Doğrudan Dosya Yükleme**: PDF, Word, görsel veya sunum dosyası (20 MB sınırlı).
* **Google Drive Depolama**:
  * Yüklenen dosyalar `uploadProgramMaterialFile` fonksiyonu ve `google-drive-action` Edge Function aracılığıyla Google Drive'a yüklenir.
* **Veritabanı Alanları**:
  * `core_gorev.material_url`: Dosya veya harici bağlantı URL'i
  * `core_gorev.material_title`: Materyal başlığı (örn: "Antibiyotik Eğitimi Rehberi")
  * `core_gorev.material_type`: Materyal türü (PDF, SLIDE, LINK, DOC)
  * `core_gorev.material_file_id`: Google Drive dosya ID'si
* **Kullanıcı Erişimi**:
  * Katılımcı, Haftalık Program ve Görevlerim sekmelerinde ilgili materyali tek tıkla yeni sekmede açabilir.
  * Mentor, teslim değerlendirme ekranında göreve ait materyali inceleyerek katılımcının materyale uygunluğunu denetleyebilir.

---

## 13. Mentor Aktif Paneli

Mentorların takımlarını, katılımcılarını ve görev teslimlerini verimli yönetebilmesi için geliştirilen aktif çalışma merkezidir:

* **Takımlarım**: Mentora atanan takımların listesi, takım puanı ve genel takım durumu.
* **Katılımcılarım**: Takım üyelerinin kartları, iletişim bilgileri, profil görüntüleme ve özel not ekleme kısayolları.
* **Aktif Görevler**: Program görevleri ve takım üyelerinin teslim durumları (teslim edenler, bekleyenler, teslim etmeyenler).
* **Görev Teslimleri**: İncelenmeyi bekleyen (`BEKLIYOR`), revize edilen (`REVIZE_EDILDI`), revizyon istenen (`REVIZYON_ISTENDI`) ve tamamlanan (`TAMAMLANDI`) teslimlerin filtrelenmesi.
* **Mentor Özel Notları Modülü**:
  * Mentor, katılımcı kartındaki "Özel Notlar" butonuna tıklayarak katılımcıya özel gizli değerlendirme notları ekleyebilir (`createParticipantNote`).
  * Notlar kategori (`Genel`, `İletişim`, `Kamera / Hitabet`, `Ödev / Teslim`, `Gelişim Alanı`, `Risk`) ve önem derecesi (`Düşük`, `Normal`, `Yüksek`, `Kritik`) ile etiketlenir.
  * Notlar düzenlenebilir ve silinebilir.
* **Not Gizliliği ve İzolasyonu**:
  * Mentor özel notları `mentor-actions` Edge Function üzerinden izole yönetilir.
  * Bu notlar **ASLA** katılımcı paneline gönderilmez veya katılımcıya gösterilmez.
* **Katılımcı Profili İnceleme**:
  * Mentor, katılımcı fotoğrafı, telefonu, adresi, üniversite/sınıfı, okul bilgisi, eğitim/iş durumu, çalıştığı kurum ve iş açıklamasını açılır modalda eksiksiz görebilir.

---

## 14. Çok Katılımcılı Teslim Takip Sistemi

Görev bazında tüm katılımcıların teslim durumunu eşzamanlı izleyen gelişmiş matris sistemidir:

* **Teslim Durum Matrisi**:
  * Admin panelinde tüm katılımcılar, Mentor panelinde ise ilgili mentora ait takım katılımcıları görev kartı altında listelenir.
* **Teslim Etmeyenlerin Tespiti**:
  * Teslim yapanların yanında teslim yapmayan katılımcılar da `Henüz teslim yapmadı ⏳` durumuyla listelenir. Böylece admin ve mentor eksik teslimleri anında tespit eder.
* **İzole Timeline Mekanizması**:
  * Teslim hareket geçmişi (`core_teslimhareketi`) katılımcı ve görev bazında izole edilir (`kat_{katilimci_id}_{gorev_id}`).
  * Bir katılımcının revizyon geçmişi veya teslim dosyaları diğer katılımcıların geçmişine karışmaz.
* **Katılımcı Perspektifi**:
  * Katılımcı panelinde yalnızca katılımcının kendi teslim durumu ve kendi hareket timeline'ı gösterilir.

---

## 15. DNA Rapor Motoru

20 soruluk İçerik Üretici DNA Envanteri cevaplarını kıdemli danışmanlık perspektifiyle işleyen yapay zeka analiz motorudur:

* **Sistem Rolü**: `İçerik Stratejisi ve Dijital DNA Analiz Uzmanı`
* **AI Modeli**: Google Gemini 2.5 Flash (`ai-content-dna` Edge Function)
* **Çapraz Analiz İlkesi**: Sorular tekil olarak değil, birbirleriyle nedensellik bağlarıyla çapraz analiz edilir:
  * Amaç (S1) + Konular (S2) + Arketip (S16) + Kamera (S9) ➔ Gerçekçi pazar konumlandırması ve uzmanlık nişi.
  * Platform/Format (S3, S5) + Haftalık Kapasite (S14) + Darboğaz (S10) ➔ Sürdürülebilir operasyonel mimari.
  * Kriz Tepkisi (S13) + İletişim Dili (S4, S11) + Regülasyon Riski ➔ Yasal uyum ve kriz kalkanı.
  * Benchmark (S17) + Hedef Marka Kelimeleri (S18-S20) ➔ Taklitten uzak özgün modelleme.
* **5 Boyutlu Skor Kartı**:
  1. *Arketip Eşleşmesi* (%0-100)
  2. *Marka Tutarlılığı* (%0-100)
  3. *Kamera ve Prodüksiyon Hazırlığı* (%0-100)
  4. *İçerik Üretim Kapasitesi* (%0-100)
  5. *Kriz Yönetimi Dayanıklılığı* (%0-100)
* **7 Ana Rapor Bölümü**:
  1. *Stratejik Pazar Konumlandırması ve Arketip Analizi*
  2. *İletişim Dili, Ton ve Format Reçetesi (Kanca ve CTA Mühendisliği)*
  3. *Kişiselleştirilmiş İçerik Serileri ve Üretim Matrisi* (3 somut seri, format, yayın kanalı, bölüm başlıkları, üretim akışı, TİTCK/KVKK notu)
  4. *Rol Model ve Benchmark Analizi*
  5. *Operasyonel Riskler, Mevzuat Farkındalığı (TİTCK/KVKK) ve Tükenmişlik Analizi*
  6. *7 Adımlı Kapsamlı Uygulama ve Gelişim Yol Haritası*
  7. *İlk 14 Gün İçin Mini İçerik Takvimi* (Gün gün kanca, format, amaç ve uyum notu)
* **Mevzuat & Etik Çerçeve**:
  * Rapor tıbbi teşhis, tedavi, ilaç ismi veya reçete yönlendirmesi içermez.
  * TİTCK ilaç reklam yasakları, KVKK hasta mahremiyeti ve etik sağlık iletişimi ilkeleri çerçevesinde farkındalık sunar.

---

## 16. DNA Rapor Görsel Arayüzü (`DnaReportRenderer`)

AI tarafından üretilen raporun modern ve etkileşimli bir dashboard deneyimine dönüştürülmesini sağlar:

* **Hero Banner Alanı**: Katılımcı adı, takım rozeti, analiz tarihi, AI model etiketi ve 4 boyutlu özet çipleri (Mevcut Seviye, Haftalık Kapasite, Kamera Skoru, Ana Arketip).
* **Hızlı Rapor Navigasyonu**: Skor kartı ve 7 ana bölüme tek tıkla pürüzsüz kaydırma (smooth scroll) sağlayan navigasyon barı.
* **Görsel Skor Kartı Grid**: Renk kodlu ilerleme barları (yeşil, sarı, kırmızı) ve metrik açıklamaları.
* **İçerik Serisi Kartları**: Her seri için yayın kanalı, format rozetleri, örnek bölüm listeleri, üretim akış yönergeleri ve regülasyon uyarı kutuları.
* **Yol Haritası Timeline'ı**: 7 adımlı gelişim sürecini görselleştiren dikey timeline bileşeni.
* **14 Günlük Takvim Kartları**: Gün gün format, kanca, yayın amacı ve yasal uyum etiketlerini içeren 14 adet mikro kart.
* **Sekmeli Deneyim**: Katılımcı ve Admin panellerinde "🧬 Strateji Raporu" ile "📝 Verdiğim Yanıtlar" sekmeleri birbirinden ayrıdır; ham markdown kullanıcı arayüzünü kirletmez.

---

## 17. Panel Fonksiyonları Özeti

### Admin Paneli (`/admin`)
* **Adaylar**: Başvuruları listeleme, onay/red kararı verme, katılımcıya dönüştürme.
* **CSV Import**: Toplu aday yükleme.
* **Takımlar**: Takım oluşturma, mentor atama, takım puanlarını izleme.
* **Görevler & Program**: Hazır program şablonlarını aktif etme, maksimum puan belirleme, materyal linki/dosyası ekleme, çok katılımcılı teslim matrisini inceleme.
* **Performans**: Görev, toplantı, etkileşim bonusu ve manuel puanları izleme ve güncelleme; katılımcı detay profilini açma.
* **DNA Analizleri**: Katılımcıların DNA raporlarını `DnaReportRenderer` ile görsel olarak inceleme, cevapları görüntüleme.
* **Mentor Yönetimi**: Mentor oluşturma, düzenleme ve listeleme.

### Katılımcı Paneli (`/katilimci`)
* **Genel Bakış**: Takım puanı, bireysel puan kırılımları, değerlendirme notları ve hızlı erişim kartları.
* **Haftalık Program**: Yalnızca aktif edilen haftaların Salı/Perşembe oturum akışlarını ve eğitim materyallerini görüntüleme.
* **Görevlerim**: Görev brieflerini inceleme, dosya/link yükleme, teslim timeline'ını izleme, materyallere erişme.
* **İçerik DNA Testi**: 20 soruluk wizard formunu doldurma, AI raporunu görsel dashboard olarak inceleme, cevapları kontrol etme.
* **Profil / Takım**: Detaylı profil bilgilerini düzenleme, profil fotoğrafı yükleme, takım arkadaşlarını görme.

### Mentor Paneli (`/mentor`)
* **Genel Bakış**: Takım sayısı, katılımcı sayısı, bekleyen teslim sayıları ve hızlı özet.
* **Takımlarım**: Atanmış takımları listeleme ve takım puanlarını izleme.
* **Katılımcılarım**: Takım üyelerinin detaylı profillerini inceleme, özel gizli mentor notları ekleme/düzenleme/silme.
* **Aktif Görevler**: Program görevlerini ve takım üyelerinin teslim durum matrisini (kim teslim etti, kim etmedi) izleme.
* **Görev Teslimleri**: Teslim edilen dosya ve bağlantıları inceleme, revizyon isteme (`REVIZYON_ISTENDI`) veya nihai puanlama/yorum yapma (`TAMAMLANDI`).

---

## 18. Veri Akışları ve Puan Mantığı

### Veri Akışları
1. **Aday ➔ Katılımcı**: Aday başvurusu (`core_aday`) onaylanır ➔ `core_katilimci`, `auth.users` ve `profiles` kayıtları oluşur.
2. **Program Görevi Aktivasyonu**: Admin hazır şablondan görevi aktif eder (`core_gorev`) ➔ İlgili hafta ve görev katılımcıya açılır.
3. **Görev Teslimi & Drive**: Katılımcı dosya yükler ➔ Dosya Google Drive'a kaydedilir, `core_teslim` ve `core_teslimhareketi` oluşturulur.
4. **Mentor Değerlendirmesi & Revizyon**: Mentor teslimi inceler ➔ Revizyon isterse durum `REVIZYON_ISTENDI` olur ➔ Katılımcı tekrar yükler ➔ Mentor nihai puan girer ➔ Durum `TAMAMLANDI` olur ➔ `core_katilimciperformans` puanı güncellenir.
5. **İçerik DNA Akışı**: Katılımcı 20 soruyu submit eder ➔ `ai-content-dna` Edge Function Gemini 2.5 Flash'ı tetikler ➔ Rapor `core_icerikdnatesti` tablosuna yazılır ➔ `DnaReportRenderer` ile görselleştirilir.

### Puan Formülü
$$\text{Bireysel Puan} = \text{Görev Puanı} + \text{Toplantı Puanı} + \text{Etkileşim Bonusu} + \text{Manuel Puan}$$

* **Görev Puanı**: Mentorun onayladığı görev teslimlerinden otomatik toplanır.
* **Toplantı Puanı**: Adminin girdiği toplantı katılım kayıtlarından (`core_toplantikatilimi`) hesaplanır.
* **Etkileşim Bonusu**: Sosyal medya paylaşım performans kayıtlarından (`core_sosyalmedyaperformansi`) hesaplanır.
* **Manuel Puan**: Yalnızca Admin tarafından doğrudan girilebilir.

---

## 19. Legacy Backend Durumu

* **Konum**: `legacy_backend/`
* **Neden Tutuluyor?**: Eski Django ORM modelleri, SQL şemaları ve veri referansları için pasif arşiv amacıyla saklanmaktadır.
* **Kural**: Aktif runtime veya frontend akışlarında Django backend'e kesinlikle hiçbir istek atılmaz.

---

## 20. Deploy Süreci

1. Üretim derlemesini kontrol edin:
   ```bash
   npm run build
   ```
2. Değişiklikleri Git ana dalına gönderin:
   ```bash
   git add .
   git commit -m "docs: update operations guide for program and mentor systems"
   git push origin main
   ```
3. Cloudflare Pages / Workers otomatik deploy pipeline'ı devreye girerek canlı ortamı günceller.

---

## 21. Test Kullanıcıları

Test ve operasyonel doğrulama hesapları:

| Rol | E-posta Adresi | Şifre Yönetimi |
|---|---|---|
| **Admin** | `omer@markamutfagi.co` | Supabase Auth üzerinden yönetilir / sıfırlanır |
| **Mentor** | `mentor-test@gdsl.com` | Supabase Auth üzerinden yönetilir / sıfırlanır |
| **Katılımcı** | `katilimci-test@gdsl.com` | Supabase Auth üzerinden yönetilir / sıfırlanır |

*Güvenlik kuralı: Gerçek kullanıcı şifreleri dokümanlara, commit mesajlarına veya kod bloklarına kesinlikle yazılamaz.*

---

## 22. Güncel Final Manuel Test Checklist

Canlı yayın ve güncellemeler sonrasında uygulanacak kontrol adımları:

### Admin Tarafı Kontrolleri:
- [ ] Admin Login & Panel Erişimi (`/admin`)
- [ ] Aday Kabul / Red & CSV İçe Aktarma
- [ ] Program Görevi Aktif Etme (Şablon seçimi, maksimum puan girişi, duplicate kontrolü)
- [ ] Program Materyali Ekleme (Harici link ekleme & Drive PDF yükleme)
- [ ] Çok Katılımcılı Teslim Matrisi Kontrolü (Kim teslim etti / kim etmedi görünümü)
- [ ] Performans Paneli & Puan Güncelleme (Toplantı, sosyal medya, manuel puan)
- [ ] Katılımcı Profil Detay Modalını Açma ve İnceleme
- [ ] DNA Analizleri Sekmesinde `DnaReportRenderer` Görsel Raporunu İnceleme

### Katılımcı Tarafı Kontrolleri:
- [ ] Katılımcı Login & Panel Erişimi (`/katilimci`)
- [ ] Profil Bilgilerini Doldurma ve Kaydetme (Telefon, adres, eğitim, iş durumu)
- [ ] Profil Fotoğrafı Yükleme (Drive thumbnail önizleme kontrolü)
- [ ] Haftalık Program Sekmesinde Yalnızca Aktif Haftaları Görme (Salı/Perşembe blokları)
- [ ] Program Materyalini Açma (PDF / link bağlantısı)
- [ ] Görev Teslimi Yapma (Dosya yükleme & bağlantı girme)
- [ ] Teslim İşlem Geçmişini (Timeline) İnceleme
- [ ] 20 Soruluk DNA Formunu Doldurma & Submit Etme
- [ ] Görsel DNA Strateji Raporunu (`DnaReportRenderer`) ve Yanıtlar Sekmesini İnceleme

### Mentor Tarafı Kontrolleri:
- [ ] Mentor Login & Panel Erişimi (`/mentor`)
- [ ] Takımlarım ve Katılımcılarım Listesini İnceleme
- [ ] Katılımcı Profil Detay Modalını Açma
- [ ] Katılımcıya Özel Gizli Mentor Notu Ekleme, Düzenleme ve Silme
- [ ] Aktif Görevler Sekmesinde Takım Teslim Durum Matrisini İnceleme
- [ ] Görev Teslimini İnceleme (Materyal linki ve yüklenen dosyayı açma)
- [ ] Teslim İçin Revizyon İsteme (`REVIZYON_ISTENDI`)
- [ ] Teslim İçin Nihai Değerlendirme & Puanlama Yapma (`TAMAMLANDI`)

---

## 23. Bilinen Riskler ve Dikkat Edilecekler

1. **Cloudflare Cache**: Dağıtım sonrasında tarayıcılar eski bundle dosyalarını servis edebilir. Test aşamasında Hard Refresh (Ctrl+F5) yapılması veya Cloudflare cache purge uygulanması önerilir.
2. **DB Şema & Kolon Uyuşmazlığı**: Veritabanına yeni bir kolon eklenmeden frontend üzerinden sorgulanırsa `PGRST204` hatası oluşur. Profil ve görev güncellemelerinde allowlist mekanizması korunmalıdır.
3. **Google Drive Görsel Thumbnail Mantığı**: Drive `webViewLink` doğrudan `<img>` etiketinde çalışmaz. Görseller için her zaman `https://drive.google.com/thumbnail?id=...&sz=w400` formatı kullanılmalıdır.
4. **Program Görevleri Duplicate Koruması**: Program görevlerinin birden fazla kez oluşturulmaması için `program_task_key` alanı korunmalı ve kontrol edilmelidir.
5. **Mentor Notları Gizlilik Koruması**: Mentor özel notları yalnızca mentor ve admin yetkisine açık kalmalı, RLS ve UI seviyesinde katılımcıya kesinlikle sızdırılmamalıdır.
6. **TİTCK ve KVKK Regülasyon Sınırı**: AI promptu ve içerik yönergeleri hiçbir koşulda ilaç reklamı veya tıbbi tedavi iddiası içermemelidir.

---

## 24. GitHub Transfer ve Yeni Repo Aktarım Notları

1. **Secret Taraması**: Depoda `.env` veya credential JSON dosyası bulunmadığını doğrulayın.
2. **Cloudflare Pages / Workers Bağlantısı**: Yeni repoyu Cloudflare dashboard üzerinden bağlayın.
3. **Supabase Secrets Tanımlama**:
   ```bash
   npx supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON="..." --project-ref wczupupflxvfnjbjkfrj
   npx supabase secrets set GEMINI_API_KEY="..." --project-ref wczupupflxvfnjbjkfrj
   ```
4. **Dağıtım Doğrulaması**: İlk push sonrasında canlı login ve panel fonksiyonlarını test edin.

---

## 25. Yasaklı İşlemler

* ⛔ `auth.users.encrypted_password` alanına doğrudan SQL `UPDATE` yapmak kesinlikle yasaktır.
* ⛔ `SUPABASE_SERVICE_ROLE_KEY` veya Google Service Account Credentials bilgilerini istemci (frontend) koduna koymak yasaktır.
* ⛔ API anahtarı, secret veya şifreleri git deposuna commit etmek yasaktır.
* ⛔ `.env` veya `.env.local` dosyalarını git deposuna eklemek yasaktır.
* ⛔ Mentor özel notlarını katılımcı arayüzünde görünür kılmak yasaktır.

