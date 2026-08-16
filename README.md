# Geleceğin Dijital Sağlık Liderleri Platformu

Geleceğin Dijital Sağlık Liderleri programı için geliştirilmiş; aday kabulü, takım/mentor yönetimi, haftalık eğitim ve saha görevleri programı, program materyalleri, çok katılımcılı görev teslimi ve değerlendirme matrisi, gizli mentor notları, katılımcı profil yönetimi, yapay zeka destekli İçerik DNA strateji motoru ve Google Drive entegrasyonlu depolama mimarisini içeren modern, sunucusuz (serverless) web platformudur.

---

## 🔗 Canlı Ortam Bağlantısı

* **Canlı Web Platformu URL**: [https://saglikliderleri.markamutfagi.co/login](https://saglikliderleri.markamutfagi.co/login)

---

## 🏗️ Aktif Mimari

Platform aşağıdaki sunucusuz ve bulut tabanlı teknolojiler üzerinde çalışmaktadır:

* **Frontend**: React 19, Vite, Tailwind CSS, React Router (Cloudflare Workers / Pages üzerinde barındırılır)
* **Kimlik Doğrulama**: Supabase Auth (JWT Tabanlı Oturum ve Rol Yönetimi)
* **Veritabanı & Güvenlik**: Supabase Postgres + Row Level Security (RLS) Politikaları
* **Sunucusuz Fonksiyonlar (API)**: Supabase Edge Functions (Deno / TypeScript — `admin-actions`, `mentor-actions`, `ai-content-dna`, `google-drive-action`)
* **Dosya Depolama**: Google Drive API (Service Account Entegrasyonu ile görev teslimleri, program materyalleri ve profil fotoğrafları)

---

## 👥 Kullanıcı Rolleri

Platform 3 temel rol hiyerarşisi üzerinden çalışmaktadır:

1. **Admin (`admin`)**: Sistem yöneticisi. Aday başvurularını inceler ve onaylar, CSV ile toplu aday içe aktarır, takım ve mentor atamalarını yapar, program görevlerini ve materyallerini aktif eder, katılımcı performans puanlarını günceller, çok katılımcılı teslim matrisini ve İçerik DNA analiz raporlarını takip eder.
2. **Mentor (`mentor`)**: Takım mentoru. Atandığı takımları ve takımındaki katılımcıların detaylı profillerini inceler, katılımcıya özel gizli mentor notları ekler, aktif program görevlerini ve teslim durumlarını izler, görev teslimlerini değerlendirir, revizyon ister veya nihai puanlama yapar.
3. **Katılımcı (`katilimci`)**: Programa kabul edilen aday. Haftalık eğitim programını ve aktif haftaları görüntüler, eğitim materyallerine erişir, görev teslimlerini (Google Drive/link) gerçekleştirir, teslim işlem geçmişini (timeline) izler, detaylı profilini düzenler/fotoğraf yükler, 20 soruluk İçerik DNA formunu doldurarak yapay zeka strateji raporunu inceler.

---

## ✨ Ana Özellikler

* **Aday ve Başvuru Yönetimi**: Aday başvurularının listelenmesi, değerlendirilmesi ve tek tıkla katılımcı hesabı oluşturularak programa kabul edilmesi.
* **Toplu CSV İçe Aktarma**: Aday listelerinin CSV formatından veritabanına toplu aktarımı.
* **Takım ve Mentor Yönetimi**: Takımların kurulması, katılımcıların takımlara dağıtılması ve takım mentoru atamaları.
* **Program Görevleri & Şablonlar**: 3 haftalık hazır görev şablonları (Antibiyotik Senaryosu, Hook & AI, WHO Sandviç Final), admin tarafından maksimum puan ve süre belirlenerek tek tıkla aktivasyon (`program_task_key` duplicate korumalı).
* **Haftalık Eğitim Programı**: 3 haftalık interaktif eğitim modülü; Salı ve Perşembe günlerine özel oturum akışları, süreler ve hedefler (katılımcı yalnızca admin tarafından aktif edilen haftaları görür).
* **Program Materyalleri**: Admin tarafından PDF/dosya yükleme (Google Drive entegrasyonu) veya harici link ekleme; katılımcı ve mentor panellerinde doğrudan erişim.
* **Google Drive Entegrasyonlu Görev Teslimi**: Katılımcı teslimlerinin Google Drive klasör yapısında güvenle depolanması ve doğrudan önizleme bağlantıları.
* **Revizyon ve Nihai Değerlendirme**: Mentorlar için çok aşamalı revizyon isteme ve nihai puanlama döngüsü.
* **Çok Katılımcılı Teslim Takip Sistemi**: Görev bazında kimlerin teslim ettiği, kimlerin beklemede olduğu ve kimlerin henüz teslim yapmadığını gösteren katılımcı matrisi; katılımcı bazlı izole teslim hareket timeline'ı (`kat_{id}_{gorev_id}`).
* **Katılımcı Profil & Fotoğraf Yönetimi**: Telefon, adres, okul tam bilgisi, eğitim durumu, iş durumu, kurum, pozisyon ve iş açıklaması alanları; Google Drive thumbnail optimizasyonlu profil fotoğrafı desteği; admin ve mentor profil inceleme modalı.
* **Gizli Mentor Notları**: Mentorların takımındaki katılımcılara özel kategori ve önem derecesiyle not ekleyebilmesi (özel notlar katılımcıya kesinlikle gösterilmez).
* **Yapay Zeka Destekli İçerik DNA Motoru**: 20 soruluk envanter, Google Gemini 2.5 Flash ile kıdemli "İçerik Stratejisi ve Dijital DNA Analiz Uzmanı" sistem promptu, 5 boyutlu skor kartı, 7 ana analiz bölümü, 3 özelleştirilmiş içerik serisi, TİTCK/KVKK regülasyon farkındalığı, 7 adımlı yol haritası ve 14 günlük mini içerik takvimi.
* **Gelişmiş DNA Rapor Arayüzü (`DnaReportRenderer`)**: Skor kartı görselleştirme, içerik serisi kartları, interaktif yol haritası timeline'ı, 14 günlük takvim kartları, sekmeli yanıt görünümü ve ham markdown'dan arındırılmış kullanıcı deneyimi.
* **Admin Performans Yönetimi**: Görev puanları, toplantı katılımları, sosyal medya etkileşim bonusları ve admin manuel puanlarının otomatik konsolidasyonu.

---

## 📦 Legacy Backend Notu

* Eski Django REST API backend kodları aktif canlı üretim ortamında **kesinlikle kullanılmamaktadır**.
* Geçmiş referans ve veri dönüşüm ihtiyaçları için `legacy_backend/` klasörü altında pasif arşiv olarak tutulmaktadır.

---

## 🛠️ Geliştirme ve Dağıtım Süreci

Projeye yeni bir özellik eklendiğinde veya dokümantasyon güncellendiğinde izlenecek adımlar:

1. Bağımlılıkları ve kod bütünlüğünü kontrol edin.
2. İsteğe bağlı olarak üretim derlemesini doğrulayın:
   ```bash
   npm run build
   ```
3. Değişiklik durumunu kontrol edin:
   ```bash
   git status
   ```
4. Yapılan değişiklikleri anlamlı bir commit mesajı ile kaydedin:
   ```bash
   git commit -m "docs: update operations guide for program and mentor systems"
   ```
5. Ana dala gönderin (Cloudflare Otomatik Deploy tetiklenir):
   ```bash
   git push origin main
   ```
6. Canlı deploy bağlantısından değişiklikleri doğrulayın.

---

## 🔐 Güvenlik İlkeleri

* **Gizli Bilgiler & Secret Yönetimi**: `.env`, service role key, Google Service Account private key veya Gemini API key gibi gizli anahtarlar **ASLA** git deposuna commit edilmez.
* **Service Role Restriksiyonu**: `SUPABASE_SERVICE_ROLE_KEY` yalnızca sunucu tarafında (Supabase Edge Functions) kullanılır; istemci (frontend) koduna kesinlikle dahil edilmez.
* **Google Credentials**: Google Service Account JSON kimlik bilgileri yalnızca Edge Function secret alanında barındırılır.
* **Veritabanı Güvenliği**: `auth.users.encrypted_password` alanına doğrudan SQL `UPDATE` yapılması kesinlikle yasaktır; şifre işlemleri yalnızca Supabase Auth API üzerinden yönetilir.
* **Gizli Dosyalar**: `.env`, `.env.local` ve credential JSON dosyaları `.gitignore` ile koruma altındadır.

