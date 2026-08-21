# Geleceğin Dijital Sağlık Liderleri — Operasyon ve Yönetim El Kitabı

Bu doküman; Geleceğin Dijital Sağlık Liderleri platformunun üretim mimarisini, güvenlik kurallarını, veri akışlarını, admin/mentor/katılımcı panellerini, haftalık canlı eğitim programını, program görevlerini, Google Drive ve Brevo REST API entegrasyonlarını, yapay zeka destekli İçerik DNA motorunu, kullanıcı yaşam döngüsü yönetimini ve acil durum operasyonel kontrol listelerini eksiksiz olarak tanımlar.

---

## 1. Genel Sistem ve Canlı Ortam Bilgileri

* **Platform Adı**: Geleceğin Dijital Sağlık Liderleri Platformu
* **Canlı Web Platformu URL**: [https://saglikliderleri.markamutfagi.co](https://saglikliderleri.markamutfagi.co)
* **Giriş Sayfası**: [https://saglikliderleri.markamutfagi.co/login](https://saglikliderleri.markamutfagi.co/login)
* **Şifre Belirleme / Sıfırlama Sayfası**: [https://saglikliderleri.markamutfagi.co/reset-password](https://saglikliderleri.markamutfagi.co/reset-password)
* **Supabase Proje Referansı**: `wczupupflxvfnjbjkfrj`
* **Supabase API URL**: `https://wczupupflxvfnjbjkfrj.supabase.co`

---

## 2. Aktif Mimari Şeması

Platform tamamen sunucusuz (serverless) mimari üzerinde çalışmaktadır:

```
[İstemci / Tarayıcı (React 19 + Vite)]
       │
       ├──► Cloudflare Pages / Workers (Özel Domain: saglikliderleri.markamutfagi.co)
       │
       ├──► Supabase Auth (JWT Session & Rol Yönetimi)
       │
       ├──► Supabase Postgres Database (Row Level Security - RLS)
       │
       ├──► Supabase Edge Functions (Deno / TypeScript)
       │      ├── admin-actions      (Aday, davet, pasife alma, silme, normalizasyon)
       │      ├── mentor-actions     (Teslim değerlendirme, revizyon, gizli notlar)
       │      ├── ai-content-dna     (Gemini AI ile 7 bölümlük strateji raporu)
       │      └── google-drive-action(Service account ile izole depolama)
       │
       ├──► Brevo REST API (api.brevo.com/v3/smtp/email — 48 saatlik şifre mailleri)
       │
       └──► Google Drive API (Service Account — Dosya, Materyal & Fotoğraf Depolama)
```

---

## 3. Roller ve Yetkilendirme Hiyerarşisi

| Rol | Kod | Tanım | Giriş Yönlendirmesi |
|---|---|---|---|
| **Admin** | `admin` | Tam yetkili sistem yöneticisi | `/admin` |
| **Mentor** | `mentor` | Takım rehberi / değerlendirici / özel not yöneticisi | `/mentor` |
| **Katılımcı** | `katilimci` | Programa kabul edilen sağlık lideri adayı | `/katilimci` |

*Giriş yapıldığında kullanıcının rolü `profiles` tablosundan okunur; yetkisiz sayfa erişimleri otomatik olarak engellenir.*

---

## 4. Admin Panel Modülleri ve Fonksiyonları

Admin Paneli (`/admin`) 7 ana çalışma merkezinden oluşur:

### 1. Adaylar (`adaylar`)
* Başvuru listesini arama, filtreleme ve inceleme.
* Adayı onaylama (`ONAYLANDI` ➔ otomatik `core_katilimci` ve `auth.users` oluşturur) veya reddetme (`REDDEDILDI`).
* **Toplu CSV İçe Aktarma**: Yeni aday listelerinin CSV formatında sisteme yüklenmesi.
* **48 Saatlik Şifre Belirleme Daveti**:
  * **Toplu Gönderim**: "Tüm Katılımcılara 48 Saatlik Şifre Belirleme E-postası Gönder" butonu ile tüm aktif katılımcılara Brevo REST API üzerinden davet iletimi.
  * **Tekil Gönderim**: Aday kartındaki "Şifre Belirleme E-postası Gönder" butonu ile tek bir katılımcıya davet iletimi.
* **Katılımcı Detay Modalı**: Mesleki/kişisel profil, fotoğraf, üniversite/sınıf bilgileri ve detaylı giriş/oturum logları.
* **Katılımcı Durum Yönetimi**: "Katılımcıyı Pasife Al" veya "Aktif Yap" butonları.

### 2. Takımlar (`takimlar`)
* Yeni takım oluşturma ve silme.
* Takıma katılımcı atama veya takımdan çıkarma.
* Takıma mentor atama veya mentor değişikliği.
* Takım puanı ve üye dağılımını izleme.

### 3. Görevler & Teslimler (`gorevler`)
* Hazır program görevlerini (Antibiyotik, Hook & AI, WHO Sandviç) tek tıkla aktif etme.
* Göreve özel maksimum puan ve son teslim tarihi belirleme.
* Göreve program materyali ekleme (Google Drive'a PDF yükleme veya harici bağlantı ekleme).
* **Çok Katılımcılı Teslim Takip Matrisi**: Görev bazında kimlerin teslim ettiği, kimlerin beklemede olduğu ve kimlerin henüz teslim yapmadığını anlık görme.
* Katılımcı bazlı izole teslim hareket timeline'ını (`core_teslimhareketi`) inceleme.

### 4. Haftalık Canlı Eğitim Programı (`program`)
* 3 haftalık programın her bir haftasını katılımcılara açma/kapatma (Toggle).
* Salı ve Perşembe canlı oturumları için Zoom Meeting ID, Passcode ve Takvime Ekle bağlantılarını düzenleme ve kaydetme.

### 5. Mentorlar (`mentorlar`)
* Yeni mentor hesabı ve profili oluşturma.
* Mentor bilgilerini güncelleme veya mentor silme.
* Mentora bağlı takımları izleme.

### 6. Performans Yönetimi (`performans`)
* Katılımcıların Görev Puanı, Toplantı Katılım Puanı, Sosyal Medya Etkileşim Bonusu ve Manuel Puan kırılımlarını görme.
* Toplantı katılım kaydı (`core_toplantikatilimi`) ekleme/silme.
* Sosyal medya paylaşım kaydı (`core_sosyalmedyaperformansi`) ekleme/silme.
* Manuel puan ve admin içi değerlendirme notu girme.

### 7. İçerik DNA Analizleri (`dna`)
* Katılımcıların 20 soruluk İçerik DNA formuna verdikleri yanıtları ve üretilen strateji raporlarını `DnaReportRenderer` ile görsel olarak inceleme.
* 5 skor kartı, 3 kanca, 3 CTA, 3 seri, 7 adımlı yol haritası ve 14 günlük takvim yapılarını denetleme.

---

## 5. Katılımcı Onboarding ve Şifre Belirleme Akışı

Platformda güvenliği zedeleyen "ortak şifre" yaklaşımı kesinlikle kullanılmaz.

```
[Aday Başvurusu Onaylanır]
         │
         ▼
[Admin Actions Edge Function]
         │
         ├──► auth.users hesabı oluşturulur (Rastgele güçlü geçici hash)
         ├──► profiles & core_katilimci eşleştirilir
         │
         ▼
[Brevo REST API (api.brevo.com/v3/smtp/email)]
         │
         ├──► Supabase Admin generateLink(type: 'recovery') ile 48 saatlik token üretilir
         ├──► Redirect URL: https://saglikliderleri.markamutfagi.co/reset-password
         │
         ▼
[Katılımcı E-postayı Açar ve Linke Tıklar]
         │
         ▼
[/reset-password Ekranında Kendi Özel Şifresini Belirler]
         │
         ▼
[Katılımcı Paneline (/katilimci) Otomatik Yönlendirilir]
```

### Önemli E-posta İlkeleri:
* E-postalar Supabase dahili SMTP limitlerine takılmamak için **Brevo REST API v3** üzerinden gönderilir.
* Şifre belirleme bağlantıları ve tokenlar hiçbir loga veya yanıta yazdırılmaz.
* Katılımcı şifresini unuttuğunda Login sayfasındaki "Şifremi Unuttum" bağlantısını kullanarak aynı Brevo akışıyla anında yeni link alabilir.

---

## 6. Katılımcı E-posta Düzeltme Akışı

Katılımcının e-postasında harf hatası veya değişiklik olduğunda:

1. **Yeni Katılımcı Oluşturulmaz**: Katılımcının mevcut ID'si, takım bağı ve teslimleri korunmalıdır.
2. **Admin API ile E-posta Güncelleme**:
   * `auth.users` e-posta adresi güncellenir (`adminClient.auth.admin.updateUserById`).
   * `public.profiles` tablosundaki `email` güncellenir.
   * `core_aday` tablosundaki `eposta` güncellenir.
3. **Tekil Davet Gönderimi**:
   * Admin Paneli > Adaylar sekmesinden katılımcının yanındaki "Şifre Belirleme E-postası Gönder" butonuna tıklanarak güncel adrese tekil davet iletilir.

---

## 7. Katılımcı Pasife Alma vs. KVKK Tam Silme

Operasyonda bu iki işlem birbirinden kesin çizgilerle ayrılmıştır:

### A. Pasife Alma (`program_katilim_durumu = 'PASIF'`)
* **Kullanım Amacı**: Katılımcı eğitimi bıraktığında, devamsızlık yaptığında veya programa devam etmeyeceğinde kullanılır.
* **Sonuç**:
  * Katılımcının auth hesabı, teslimleri, geçmiş puanları ve DNA analizi veritabanında arşiv olarak saklanır.
  * Katılımcı serbest üye listelerinden çıkarılır, aktif takım listelerinde görünmez.
  * İstenildiğinde admin tarafından tek tıkla yeniden "Aktif" yapılabilir.

### B. KVKK / Tam Silme (Tüm Verilerin Kalıcı Temizliği)
* **Kullanım Amacı**: Katılımcı açıkça tüm kişisel verilerinin silinmesini talep ettiğinde (KVKK hakkı) kullanılır.
* **Güvenlik Kuralı**: Asla doğrudan ve plansız çalıştırılamaz; önce `dry_run_delete_participant` ile silinecek tüm bağımlı nesneler doğrulanır.
* **Silme Sıralaması (İzole Cascade)**:
  1. `core_teslimhareketi` (Yalnızca bu katılımcıya ait hareketler)
  2. `core_teslim` (Yalnızca bu katılımcının teslimleri)
  3. `core_icerikdnatesti` (DNA test kaydı)
  4. `core_mentor_ozel_notlar` (Bu katılımcıya yazılmış özel notlar)
  5. `core_katilimci_oturum_loglari` (Giriş logları)
  6. `core_toplantikatilimi` & `core_sosyalmedyaperformansi`
  7. `core_katilimciperformans`
  8. `public.profiles`
  9. `core_katilimci`
  10. `core_aday`
  11. `auth.users` (Kullanıcı kimlik kaydı)

---

## 8. Haftalık Canlı Eğitim Programı Yönetimi

Haftalık Program modülü, görev modülünden tamamen bağımsız bir canlı eğitim takvimidir.

* **Bağımsızlık İlkesi**:
  * Program görevini aktif etmek haftayı açmaz.
  * Haftayı açmak program görevini aktif etmez.
* **Hafta Açma / Kapatma**: Admin Paneli > Haftalık Program sekmesinden istenen hafta açılır veya kapatılır. Katılımcı paneli yalnızca aktif haftaları listeler.
* **Canlı Oturum Bilgileri**:
  * **Salı Oturumu**: Zoom URL, Meeting ID, Passcode ve Takvime Ekle linki.
  * **Perşembe Oturumu**: Zoom URL, Meeting ID, Passcode ve Takvime Ekle linki.
  * *Not: Canlı oturum kayıtları platformda depolanmaz; yalnızca oturum öncesi katılım ve takvim bağlantıları sunulur.*

---

## 9. Program Görevleri ve Teslim Yönetimi

Eğitim müfredatına bağlı hazır saha ve final görevleri `core_gorev` üzerinden çalışır.

### Görev Şablonları ve `taskKey` Değerleri:
1. **1. Hafta (Saha Görevi)**: *Çift Versiyonlu Antibiyotik İçeriği* (`week1-antibiyotik-cift-versiyon`)
   * **İçerik**: Antibiyotik direncini eğitimli kitle ve yaşlı/halk kitlesi için iki ayrı dilde yazma ve birini videoya çekme.
2. **2. Hafta (Saha Görevi)**: *Bilimsel Bilgiden Yayına Hazır İçeriğe* (`week2-hook-ai-senaryo`)
   * **İçerik**: Bilimsel kaynak analizi, 5 farklı hook yazımı, PAS kurgusu, yapay zeka denetimi/hata kontrolü, CTA ve görselleştirme.
3. **3. Hafta (Final Görevi)**: *Bilimsel İçeriği Kamera Önünde Sunma ve Kişiselleştirilmiş Kriz Yönetimi* (`week3-who-sandvic-final`)
   * **İçerik**: 30-60 saniyelik dikey video sunumu (Truth Sandwich), bilimsel kaynak, eğitmenin içeriğe özel ürettiği kriz yorumuna profesyonel yanıt ve öz değerlendirme.

### Teslim Değerlendirme Döngüsü:
```
[Katılımcı Teslim Yapar] ➔ Durum: BEKLIYOR
        │
        ├──► Mentor İncelemesi
        │         │
        │         ├──► Revizyon Gerekli ➔ Durum: REVIZYON_ISTENDI (Katılımcı timeline'da notu görür)
        │         │         │
        │         │         └──► Katılımcı Yeniden Yükler ➔ Durum: REVIZE_TESLIM
        │         │
        │         └──► Başarılı ➔ Mentor Puanı ve Yorumu Girer ➔ Durum: TAMAMLANDI
        │
        ▼
[Performans Puanı Otomatik Güncellenir]
```

---

## 10. Güncel Eğitim Müfredatı Özeti

### 1. Hafta: Hedef Kitleyi Tanıma ve Temel İnşası
* **Salı (Hedef Kitle ve Davranış Günü)**:
  * 1. Oturum: Hedef Kitleyi Okumak ve Kitleye Özel Mesaj Tasarımı
  * 2. Oturum: Hedef Kitle Personası Tasarımı ve Uygulama
  * 3. Oturum: Hedef Kitlenin Davranışlarını ve Beklentilerini Anlamak
* **Perşembe (Sosyal Medya & Sağlık Günü)**:
  * 1. Oturum: [Sosyal Medya] Sağlık Alanında İçerik Üreticisi Olmanın Temelleri
  * 2. Oturum: [Sağlık] Türkiye’de ve Dünyada Antibiyotik Direnci (Konuk: Resul Bey)
  * 3. Oturum: [Sosyal Medya] Sağlık İçeriği Üretirken Dijital Riskler: Mevzuat, Etik ve Yapay Zekâ

### 2. Hafta: Bilgiyi Derinleştirme ve Dijital Araçlar
* **Salı (Sağlık & Teknik Günü)**:
  * 1. Oturum: [Sağlık] Bilimsel Bilgiyi Okumak ve Süzmek
  * 2. Oturum: [Sağlık] Yanlış Sağlık Bilgisini Anlamak ve Gerçeği Güçlendirmek (Truth Sandwich)
  * 3. Oturum: [Teknik] Sağlık Bilgisini İçerik Taslağına Dönüştürme (YZ Denetimi)
* **Perşembe (Sosyal Medya & Teknik Günü)**:
  * 1. Oturum: [Sosyal Medya] İlk 3 Saniye, Hook ve PAS Yapısı
  * 2. Oturum: [Teknik] Hook ve Senaryo Üretimi (YZ Denetimi ve CTA Tasarımı)
  * 3. Oturum: [Teknik] Sağlık Bilgisini Görselleştirme (Canva, İnfografik, Tablo)

### 3. Hafta: Sahne, İtibar ve Kriz Yönetimi
* **Salı (Kriz, İtibar ve Sürdürülebilirlik)**:
  * 1. Oturum: [Sosyal Medya] Kriz Türlerini Tanımak ve Yanıt Vermek
  * 2. Oturum: [Dijital İtibar] Dijital Ayak İzi Yönetimi
  * 3. Oturum: [Psikoloji] İçerik Üretiminde Sürdürülebilirlik ve Psikolojik Yük
* **Perşembe (Sahne ve Canlı Uygulama)**:
  * 1. Oturum: [Sahne] Kamera Önü Varlığı ve Beden Dili
  * 2. Oturum: [Sahne] Diksiyon, Vurgu, Telaffuz ve Doğal Anlatım
  * 3. Oturum: [Uygulama] Canlı Hitabet Pratiği ve Kamp Kapanışı

---

## 11. Yapay Zeka İçerik DNA Operasyon Rehberi

20 soruluk İçerik Üretici DNA Envanteri, Google Gemini AI motoruyla işlenerek kişiye özel çok bölümlü bir strateji raporu üretir.

### Kalite ve Kabul Kriterleri:
1. **5 Boyutlu Skor Kartı**: Arketip Eşleşmesi, Marka Tutarlılığı, Kamera ve Prodüksiyon Hazırlığı, İçerik Üretim Kapasitesi, Kriz Yönetimi Dayanıklılığı (%0-100).
2. **Bölüm 2 Kanca & CTA**:
   * İlk 3 saniyede merak uyandıran, konuşma dilinde 3 özgün Kanca.
   * Videoda söylenebilir, kısa ve net eylem çağrısı içeren 3 özgün CTA (Kaydet, Paylaş, Yorum, Danış).
3. **Bölüm 3 İçerik Serileri**: Formatı, kanalı, 3 örnek bölüm başlığı ve TİTCK uyum notu olan tam 3 özgün seri.
4. **Bölüm 6 Yol Haritası**: Katılımcının nişine özel, köşeli parantezsiz ve placeholdersız tam 7 bağımsız adım.
5. **Bölüm 7 Mini Takvim**: 14 gün için gün gün format, kanca, amaç ve uyum notu içeren tam 14 günlük yayın planı.
6. **Dayanak ve Evidence Etiketleri**: Kullanıcı görünümünde `Dayanak:`, `S16=`, `based_on_answers` gibi teknik jargona yer verilmez.
7. **Veri Güvenliği**: Katılımcının 20 soruluk yanıtları (`cevaplar`) asla değiştirilmez veya silinmez; rapor yenileme gerektiğinde önce yerel scratch yedeği alınır.

---

## 12. Katılımcı Giriş ve Aktivite Takibi

Admin Paneli > Adaylar sekmesinden katılımcı detay modalı açıldığında aşağıdaki kullanım verileri incelenebilir:

* **İlk Giriş Tarihi**: Katılımcının sisteme ilk giriş yaptığı an.
* **Son Giriş Tarihi**: En son oturum açtığı zaman damgası.
* **Son Aktivite**: Profil düzenleme, görev teslimi veya DNA formu doldurma gibi son işlem zamanı.
* **Toplam Giriş Sayısı**: Başarılı oturum sayısı.
* **Oturum Hareket Logları**: `core_katilimci_oturum_loglari` tablosunda tutulan oturum geçmişi.
* *Gizlilik Notu: Kullanıcıların IP adresleri KVKK ve veri minimizasyonu ilkeleri gereği veritabanında tutulmaz.*

---

## 13. Bilinen Hatalar ve Çözüm Rehberi

### 1. `column core_aday.ad_soyad does not exist` (PGRST / 400 Bad Request)
* **Kök Neden**: `core_aday` tablosunda birleşik `ad_soyad` kolonu yoktur; `ad` ve `soyad` kolonları ayrı tutulur.
* **Çözüm**: Servis sorgularında `aday:core_aday (ad, soyad, eposta, universite)` seçilmeli, tam ad frontend tarafında birleştirilmelidir.

### 2. `adminClient.from(...).insert(...).catch is not a function`
* **Kök Neden**: Supabase JavaScript / TypeScript query builder nesneleri doğrudan Promise değildir; `.catch()` zinciri kabul etmez.
* **Çözüm**: `await` ve `{ data, error }` yapısı kullanılarak hata kontrolü `if (error)` ile yapılmalıdır.

### 3. "Doğrulama Oturumu Eksik" / Reset Password Hatası
* **Kök Neden**: Katılımcı şifre sıfırlama linkine tıkladığında tarayıcı oturum tokenını yakalayamamış veya linkin süresi (48 saat) dolmuş olabilir.
* **Çözüm**: Admin panelinden katılımcıya tekil "Şifre Belirleme E-postası Gönder" butonuyla yeni bir bağlantı iletilmelidir.

### 4. Haftalık Programın Katılımcı Ekranında Boş Görünmesi
* **Kök Neden**: Admin Panel > Haftalık Program sekmesinde ilgili haftanın "Aktif" toggle'ı açılmamış olabilir.
* **Çözüm**: Admin panelinden ilgili haftanın aktif durumu açılmalı ve "Programı Yenile" butonuna basılmalıdır.

---

## 14. Acil Durum Operasyon Kontrol Listeleri (Checklists)

### A. Yeni Katılımcı Daveti Gönderme
- [ ] Adayın `core_aday` üzerinde onaylandığından emin olun.
- [ ] Admin Paneli > Adaylar sekmesinden katılımcının yanındaki "Şifre Belirleme E-postası Gönder" butonuna tıklayın.
- [ ] Brevo REST API durumunu (Success) kontrol edin.
- [ ] Asla ortak veya geçici şifre oluşturup manuel iletmeyin.

### B. Katılımcı Pasife Alma
- [ ] Admin Paneli > Adaylar sekmesinden katılımcı detayına girin.
- [ ] "Katılımcıyı Pasife Al" butonuna tıklayın ve onaylayın.
- [ ] Katılımcının geçmiş kayıtlarının korunduğunu, serbest listeden çıkarıldığını teyit edin.

### C. KVKK Kapsamında Kalıcı Silme
- [ ] `dry_run_delete_participant` endpoint'i ile silinecek 11 kademeli nesne listesini inceleyin.
- [ ] Katılımcı ID'sinin doğruluğunu iki kez kontrol edin.
- [ ] `execute_delete_participant` çalıştırarak cascade silmeyi tamamlayın.
- [ ] Diğer katılımcıların verilerinin etkilenmediğini doğrulayın.

### D. Program Görevi Yayınlama
- [ ] Admin Paneli > Görevler sekmesine gidin.
- [ ] Hazır şablonlardan ilgili haftayı seçin (`taskKey` duplicate kontrolü otomatik yapılır).
- [ ] Maksimum puanı (örn: 100) ve son teslim tarihini belirleyin.
- [ ] Varsa PDF materyalini Google Drive üzerinden yükleyin veya linkini ekleyin.
- [ ] "Görevi Aktif Et" butonuna tıklayarak yayına alın.
