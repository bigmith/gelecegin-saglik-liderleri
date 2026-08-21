# Geleceğin Dijital Sağlık Liderleri Platformu

Geleceğin Dijital Sağlık Liderleri programı için geliştirilmiş; aday başvuruları ve kabulü, takım/mentor yönetimi, haftalık canlı eğitim programı, program görevleri ve materyalleri, çok katılımcılı teslim takip matrisi, gizli mentor notları, katılımcı profil yönetimi, yapay zeka destekli İçerik DNA strateji motoru, Brevo REST API tabanlı güvenli şifre belirleme davetleri ve Google Drive entegrasyonlu depolama mimarisini içeren modern, sunucusuz (serverless) web platformudur.

---

## 🔗 Canlı Ortam Bağlantısı

* **Canlı Web Platformu URL**: [https://saglikliderleri.markamutfagi.co](https://saglikliderleri.markamutfagi.co)
* **Giriş Sayfası**: [https://saglikliderleri.markamutfagi.co/login](https://saglikliderleri.markamutfagi.co/login)
* **Şifre Belirleme / Sıfırlama Sayfası**: [https://saglikliderleri.markamutfagi.co/reset-password](https://saglikliderleri.markamutfagi.co/reset-password)

---

## 🏗️ Ana Teknoloji Yapısı

Platform aşağıdaki sunucusuz ve bulut tabanlı teknolojiler üzerinde çalışmaktadır:

* **Frontend**: React 19, Vite, Tailwind CSS, React Router (Cloudflare Pages / Workers üzerinde barındırılır)
* **Kimlik Doğrulama & Oturum**: Supabase Auth (JWT tabanlı oturum, rol hiyerarşisi ve güvenli şifre belirleme akışı)
* **Veritabanı & Güvenlik**: Supabase Postgres + Row Level Security (RLS) politikaları
* **Sunucusuz Fonksiyonlar (API)**: Supabase Edge Functions (Deno / TypeScript)
  * `admin-actions`: Aday onay/red, mentor yönetimi, CSV aktarımı, Brevo e-posta davetleri, katılımcı pasife alma/silme ve DNA normalizasyon işlemleri
  * `mentor-actions`: Takım teslim inceleme, revizyon isteme, puanlama ve gizli mentor notları yönetimi
  * `ai-content-dna`: 20 soruluk envanter üzerinden Google Gemini AI ile çapraz analizli, 7 bölümlü İçerik DNA rapor üretimi
  * `google-drive-action`: Google Service Account ile görev teslimleri, materyaller ve profil fotoğrafları için izole klasör yönetimi
* **E-posta Altyapısı**: Brevo REST API (`api.brevo.com/v3/smtp/email` üzerinden 48 saat geçerli şifre belirleme davetleri)
* **Dosya Depolama**: Google Drive API (Service Account entegrasyonu ve yüksek hızlı thumbnail desteği)
* **Yapay Zeka**: Google Gemini AI (İçerik DNA Motoru)

---

## 👥 Kullanıcı Rolleri

Platform 3 temel rol üzerinden çalışmaktadır:

1. **Admin (`admin`)**: Sistem yöneticisi. Aday başvurularını inceler ve onaylar, CSV ile aday aktarır, takım ve mentor atamalarını yapar, haftalık programı ve program görevlerini yönetir, katılımcı performans puanlarını konsolide eder, çok katılımcılı teslim matrisini ve İçerik DNA analiz raporlarını takip eder, katılımcı giriş/aktivite loglarını inceler.
2. **Mentor (`mentor`)**: Takım mentoru. Atandığı takımları ve katılımcı profillerini inceler, katılımcıya özel gizli mentor notları ekler, aktif program görevlerini ve teslim durumlarını izler, görev teslimlerini değerlendirir, revizyon ister veya nihai puanlama yapar.
3. **Katılımcı (`katilimci`)**: Programa kabul edilen sağlık lideri adayı. Haftalık canlı eğitim programını (yalnızca admin tarafından aktif edilen haftalar) görüntüler, eğitim materyallerine erişir, görev teslimlerini (Google Drive/link) gerçekleştirir, teslim timeline'ını izler, profilini ve fotoğrafını düzenler, 20 soruluk İçerik DNA formunu doldurarak zengin strateji raporunu inceler.

---

## ✨ Temel Sistem Modülleri

* **Aday ve Başvuru Yönetimi**: Aday başvurularının listelenmesi, onaylanması veya reddedilmesi; onaylanan adayın otomatik `core_katilimci` kaydına dönüştürülmesi.
* **Toplu CSV İçe Aktarma**: Aday listelerinin CSV formatından veritabanına kontrollü toplu aktarımı.
* **Brevo REST API Şifre Belirleme Davetleri**: Onaylanan katılımcılara ortak şifre vermek yerine Brevo API üzerinden 48 saat geçerli güvenli "Şifreni Belirle" e-postalarının (toplu veya tekil) gönderilmesi.
* **Takım ve Mentor Yönetimi**: Takımların kurulması, katılımcıların takımlara dağıtılması ve takım mentoru atamaları.
* **Haftalık Canlı Eğitim Programı**: Görev sisteminden bağımsız çalışan 3 haftalık interaktif eğitim modülü; Salı ve Perşembe günlerine özel oturum akışları, süreler, hedefler, Zoom Meeting ID, Passcode ve Takvime Ekle bağlantıları (katılımcı yalnızca admin tarafından aktif edilen haftaları görür).
* **Program Görevleri & Şablonlar**: 3 haftalık hazır görev şablonları (*week1-antibiyotik-cift-versiyon*, *week2-hook-ai-senaryo*, *week3-who-sandvic-final*), admin tarafından maksimum puan ve süre belirlenerek tek tıkla aktivasyon (`program_task_key` duplicate korumalı).
* **Program Materyalleri**: Admin tarafından PDF/dosya yükleme (Google Drive entegrasyonu) veya harici bağlantı ekleme; haftalık program ve görev detayında doğrudan erişim.
* **Google Drive Entegrasyonlu Görev Teslimi**: Katılımcı teslimlerinin izole Google Drive klasörlerinde depolanması ve önizleme bağlantıları.
* **Revizyon ve Nihai Değerlendirme**: Mentorlar için çok aşamalı revizyon isteme ve nihai puanlama döngüsü.
* **Çok Katılımcılı Teslim Takip Sistemi**: Görev bazında kimlerin teslim ettiği, kimlerin beklemede olduğu ve kimlerin henüz teslim yapmadığını gösteren katılımcı matrisi; katılımcı bazlı izole teslim hareket timeline'ı (`kat_{id}_{gorev_id}`).
* **Katılımcı Profil & Fotoğraf Yönetimi**: Mesleki/kişisel profil alanları, Google Drive thumbnail optimizasyonlu profil fotoğrafı desteği; admin ve mentor inceleme modalı.
* **Gizli Mentor Notları**: Mentorların takımındaki katılımcılara özel kategori ve önem derecesiyle not ekleyebilmesi (özel notlar katılımcıya kesinlikle gösterilmez).
* **Yapay Zeka Destekli İçerik DNA Motoru**: 20 soruluk envanter, Google Gemini AI ile çapraz analiz, 5 boyutlu skor kartı, 7 ana analiz bölümü, 3 özelleştirilmiş içerik serisi, TİTCK/KVKK regülasyon uyumu, 7 adımlı yol haritası ve 14 günlük mini içerik takvimi.
* **Gelişmiş DNA Rapor Arayüzü (`DnaReportRenderer`)**: Skor kartı görselleştirme, içerik serisi kartları, interaktif yol haritası stepper'ı, 14 günlük takvim kartları, sekmeli yanıt görünümü ve ham markdown'dan arındırılmış kullanıcı deneyimi.
* **Giriş ve Aktivite Takibi**: Katılımcıların ilk giriş, son giriş, son aktivite zaman damgaları, toplam giriş sayıları ve detaylı oturum hareket logları.
* **Performans Yönetimi**: Görev puanları, toplantı katılımları, sosyal medya etkileşim bonusları ve admin manuel puanlarının otomatik konsolidasyonu.

---

## 🔑 Ortam Değişkenleri ve Secret Tanımları

> [!CAUTION]
> **Güvenlik Kuralı:** Secret değerleri, API anahtarları, DB bağlantı adresleri, tokenlar veya şifreler **ASLA** git reposuna, dokümanlara veya commit mesajlarına yazılmaz. Aşağıda yalnızca kullanılan değişken isimleri listelenmiştir.

### Frontend İstemci Değişkenleri (`.env`)
* `VITE_SUPABASE_URL`: Supabase proje REST API adresi
* `VITE_SUPABASE_ANON_KEY`: Supabase anonim istemci genel anahtarı

### Supabase Edge Functions Secret Değişkenleri
* `SUPABASE_URL`: Proje dahili URL adresi
* `SUPABASE_ANON_KEY`: Proje anonim anahtarı
* `SUPABASE_SERVICE_ROLE_KEY`: Sunucu tarafı yetkili yönetim anahtarı (frontend koduna dahil edilmez)
* `SUPABASE_DB_URL`: Postgres doğrudan bağlantı URI (yalnızca Edge Function'da)
* `BREVO_API_KEY`: Brevo REST API v3 anahtarı (şifre belirleme davetleri için)
* `GOOGLE_SERVICE_ACCOUNT_JSON`: Google Drive Service Account kimlik JSON içeriği
* `GOOGLE_DRIVE_ROOT_FOLDER_ID`: Google Drive ana depolama klasör ID'si
* `GEMINI_API_KEY`: Google Gemini AI API anahtarı

---

## 🛠️ Geliştirme ve Dağıtım Süreci

### 1. Frontend Geliştirme ve Canlıya Dağıtım
```bash
# Bağımlılıkları yükleyin
npm install

# Yerel geliştirme sunucusunu başlatın
npm run dev

# Üretim derlemesini test edin
npm run build

# Değişiklikleri Git ana dalına gönderin (Cloudflare otomatik dağıtımı tetiklenir)
git add .
git commit -m "feat/fix: değişiklik açıklaması"
git push origin main
```

### 2. Edge Function Dağıtımı (Yalnızca Fonksiyon Değiştiğinde)
Edge Functions klasöründeki kodlar güncellendiğinde ilgili fonksiyon Supabase CLI ile deploy edilir:
```bash
# Admin işlemleri fonksiyonu
npx supabase functions deploy admin-actions --project-ref wczupupflxvfnjbjkfrj

# Yapay Zeka İçerik DNA fonksiyonu
npx supabase functions deploy ai-content-dna --project-ref wczupupflxvfnjbjkfrj

# Google Drive depolama fonksiyonu
npx supabase functions deploy google-drive-action --project-ref wczupupflxvfnjbjkfrj

# Mentor işlemleri fonksiyonu
npx supabase functions deploy mentor-actions --project-ref wczupupflxvfnjbjkfrj
```

---

## 📌 Kritik Operasyon Kuralları

1. **Haftalık Program ile Görevler Bağımsızdır**: Admin Panel'den haftalık canlı eğitim programını açmak/kapatmak ile program görevini aktif etmek birbirinden bağımsızdır. Haftanın Zoom ve ders akışı "Haftalık Program" sekmesinden, ödev/saha görevi ise "Görevler" sekmesinden yönetilir.
2. **Katılımcı Pasife Alma vs. KVKK Tam Silme Ayrımı**:
   * Programı bırakan veya devamsız katılımcılar için **Pasife Al** işlemi uygulanır (`program_katilim_durumu = 'PASIF'`). Veriler ve teslim geçmişi korunur.
   * Tüm kişisel verilerinin silinmesini talep eden katılımcılar için **KVKK Tam Silme** akışı (dry-run doğrulamalı 7 adımlı cascade silme) çalıştırılır.
3. **Şifre Yönetimi ve Davetler**: Kullanıcılara asla ortak şifre verilmez. Brevo REST API üzerinden katılımcıya özel 48 saat geçerli şifre belirleme bağlantısı gönderilir. Token veya şifreler hiçbir logda yazdırılmaz.
4. **Veritabanı Güvenliği**: `auth.users.encrypted_password` alanına doğrudan SQL `UPDATE` yapılması kesinlikle yasaktır; tüm hesap ve şifre yönetimi Supabase Auth API üzerinden yürütülür.
5. **Görev Anahtarları (`taskKey`)**: Program görev şablon anahtarları (`week1-antibiyotik-cift-versiyon`, `week2-hook-ai-senaryo`, `week3-who-sandvic-final`) sistem bütünlüğü için değiştirilmemelidir.
6. **DNA Rapor Kalitesi**: DNA raporlarında kullanıcıya yönelik yapay zeka jargonları ve `Dayanak/evidence` teknik etiketleri gizlenir; her raporda 5 skor kartı, 3 kanca, 3 CTA, 3 içerik serisi, 7 yol haritası adımı ve 14 takvim günü eksiksiz yer alır.
7. **Legacy Backend**: `legacy_backend/` klasörü yalnızca geçmiş veri ve şema referansı amacıyla saklanmaktadır; aktif runtime ortamında kesinlikle çalıştırılmaz.
