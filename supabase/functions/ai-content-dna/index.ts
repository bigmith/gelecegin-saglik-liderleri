import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://gelecegin-saglik-liderleri.omerkarapinar.workers.dev',
  'http://localhost:5173',
  'http://localhost:3000',
]

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || ''
  const isAllowed = ALLOWED_ORIGINS.includes(origin)
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function jsonRes(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  })
}

// 20 Soruluk DNA Envanteri Soru Başlıkları ve Anlam Haritası
const QUESTION_LABELS: Record<string, string> = {
  soru_1: "İçerik üretme amacın nedir?",
  soru_2: "En çok hangi konularda içerik üretmek istiyorsun?",
  soru_3: "İçeriklerini en çok hangi formatta/tarzda üretmeyi düşünüyorsun?",
  soru_4: "İçeriklerinde seni en iyi anlatan iletişim dili hangisi?",
  soru_5: "Bir konuyu anlatırken kendini en rahat hissettiğin video süresi hangisi?",
  soru_6: "Kamera karşısındaki konuşma temponu nasıl tanımlarsın?",
  soru_7: "Videolarına başlamayı en çok hangi şekilde seversin (Giriş Kancası)?",
  soru_8: "Videonun sonunda (CTA) izleyiciden en çok hangi davranışı beklemek istersin?",
  soru_9: "Kamera karşısında kendini nasıl hissediyorsun (1: Çok Zorlanıyorum - 5: Çok Rahatım)?",
  soru_10: "Bir video hazırlarken en çok zorlandığın konu nedir (Birincil Darboğaz)?",
  soru_11: "Videolarında seni en çok hangi anlatım tarzı temsil eder?",
  soru_12: "Video hazırlarken seni en çok motive eden şey nedir?",
  soru_13: "Bir kriz anında (haksız eleştiri, linç vb.) ilk tepkin ne olur?",
  soru_14: "Kendi mesai yoğunluğunda haftada kaç içerik üretmeyi gerçekçi buluyorsun?",
  soru_15: "Kendini içerik üretimi konusunda bugün hangi seviyede görüyorsun?",
  soru_16: "En yakın hissettiğin ana tarz / arketip tercihi?",
  soru_17: "Sosyal medyada tarzını beğendiğin / örnek aldığın 1-3 sağlık içerik üreticisi (Benchmark)?",
  soru_18: "Kendi markanı yansıtacak en fazla 3 kelime (Mevcut Algı)?",
  soru_19: "İnsanların aklına gelmesini istediğin, hedeflediğin en fazla 3 kelime (Hedef Algı)?",
  soru_20: "Program sonunda insanların seni ve sayfanı tek cümleyle nasıl tanımlamasını istersin (Vizyon Cümlesi)?"
}

function formatAnswersForPrompt(cevaplar: Record<string, any>): string {
  if (!cevaplar || typeof cevaplar !== 'object') return 'Katılımcı yanıtı bulunamadı.'
  const lines: string[] = []

  for (let i = 1; i <= 20; i++) {
    const key = `soru_${i}`
    const label = QUESTION_LABELS[key] || `Soru ${i}`
    const val = cevaplar[key]
    let formattedVal = '— (Belirtilmedi)'

    if (val !== undefined && val !== null) {
      if (Array.isArray(val)) {
        formattedVal = val.length > 0 ? val.join(', ') : '— (Seçim yapılmadı)'
      } else if (typeof val === 'string') {
        formattedVal = val.trim() || '— (Boş bırakıldı)'
      } else {
        formattedVal = String(val)
      }
    }

    lines.push(`[Soru ${i}] ${label}\nYANIT: ${formattedVal}`)
  }

  return lines.join('\n\n')
}

function extractScorecardFromText(text: string) {
  const parsePercent = (regex: RegExp, defaultVal: number) => {
    const m = text.match(regex)
    if (m && m[1]) {
      const num = parseInt(m[1].replace(/[%]/g, ''), 10)
      if (!isNaN(num) && num >= 0 && num <= 100) return num
    }
    return defaultVal
  }

  return {
    arketip_eslesmesi: parsePercent(/Arketip Eşleşmesi[:\s]+%?(\d+)/i, 88),
    marka_tutarliligi: parsePercent(/Marka Tutarlılığı[:\s]+%?(\d+)/i, 84),
    kamera_prod_hazirligi: parsePercent(/Kamera ve Prodüksiyon Hazırlığı[:\s]+%?(\d+)/i, 78),
    icerik_kapasitesi: parsePercent(/İçerik Üretim Kapasitesi[:\s]+%?(\d+)/i, 82),
    kriz_dayanikliligi: parsePercent(/Kriz Yönetimi Dayanıklılığı[:\s]+%?(\d+)/i, 86)
  }
}

function generateStructuredFallbackReport(cevaplar: Record<string, any>): string {
  const c = cevaplar || {}
  const rawTopics = Array.isArray(c.soru_2) ? c.soru_2.join(', ') : String(c.soru_2 || 'Genel Sağlık ve Koruyucu Yaşam')
  const tone = String(c.soru_4 || 'Eğitici ve Samimi')
  const duration = String(c.soru_5 || '30-45 saniye')
  const tempo = String(c.soru_6 || 'Orta tempolu ve akıcı')
  const primaryGoal = String(c.soru_1 || 'İnsanları doğru bilgilendirmek ve mesleki uzmanlığı göstermek')
  const cameraScore = Number(c.soru_9) || 3
  const bottleneck = String(c.soru_10 || 'Konu bulmak ve senaryo kurgulamak')
  const weeklyCap = String(c.soru_14 || '2')
  const level = String(c.soru_15 || 'Orta')
  const archetypeChoice = String(c.soru_16 || 'Klinik ve Akademik Tarz')
  const benchmarks = String(c.soru_17 || 'Sağlık alanında kanıta dayalı bilimsel hesaplar')
  const brandWords = String(c.soru_18 || 'Güvenilir, Bilimsel, Samimi')
  const targetWords = String(c.soru_19 || 'Yol Gösteren, Pratik, Yetkin')
  const vision = String(c.soru_20 || 'Sağlıkta doğru bilginin güvenilir ve anlaşılır dijital adresi.')

  const arketipSkoru = 85 + (cameraScore >= 4 ? 5 : 0)
  const markaSkoru = 82
  const kameraSkoru = Math.min(95, Math.max(50, cameraScore * 18))
  const kapasiteSkoru = Math.min(90, 70 + (Number(weeklyCap) || 2) * 5)
  const krizSkoru = String(c.soru_13 || '').includes('Kanıt') ? 92 : 80

  return `## İÇERİK DNA VE OPERASYONEL SKOR KARTI

- Arketip Eşleşmesi: %${arketipSkoru}  
  Seçilen odak alanları (${rawTopics}) ile hedeflenen iletişim dili (${tone}) arasındaki pazar uyumu ve uzmanlık örtüşmesi.
- Marka Tutarlılığı: %${markaSkoru}  
  Mevcut marka algısı (${brandWords}) ile hedef kitlede uyandırılmak istenen intiba (${targetWords}) arasındaki rasyonel gap analizi.
- Kamera ve Prodüksiyon Hazırlığı: %${kameraSkoru}  
  Kamera karşısındaki özgüven seviyesi (${cameraScore}/5) ile planlanan format mimarisinin prodüksiyon sürdürülebilirliği.
- İçerik Üretim Kapasitesi: %${kapasiteSkoru}  
  Haftalık planlanan ${weeklyCap} içerik hedefi ile birincil operasyonel darboğazın (${bottleneck}) dengeli iş yükü yönetimi.
- Kriz Yönetimi Dayanıklılığı: %${krizSkoru}  
  Sosyal medyadaki olası haksız eleştirilere karşı belirlenen profesyonel tutum ve mevzuat/etik refleks olgunluğu.

## 1. STRATEJİK PAZAR KONUMLANDIRMASI VE ARKETİP ANALİZİ

- Ana Profil Tespiti:
  Katılımcı, analiz sonuçlarına göre ağırlıklı olarak "${archetypeChoice.split(':')[0]}" arketipine oturmaktadır. İletişim dilindeki ${tone} ton tercihi, sağlık tüketicisinin ihtiyaç duyduğu güven ile dijital dünyanın gerektirdiği anlaşılırlık arasında dengeli bir köprü kurmaktadır.
- Stratejik Hedef ve Motivasyon Analizi:
  İçerik üretme motivasyonunun "${primaryGoal}" ekseninde olması, kısa vadeli viral hevesler yerine uzun vadeli mesleki itibar inşasını mümkün kılmaktadır. Seçilen niş konular (${rawTopics}), hedef kitlede koruyucu sağlık ve akılcı ürün bilinci oluşturmak için güçlü bir pazar karşılığına sahiptir.
- Mevcut Algı vs. Hedef Algı:
  Bugün kendini "${brandWords}" sözcükleriyle tanımlayan profilin, hedeflediği "${targetWords}" algısına ulaşabilmesi için; karmaşık tıp/eczacılık jargonunu "günlük hayat analogilerine" çeviren kurgusal bir anlatım benimsemesi gerekmektedir.

## 2. İLETİŞİM DİLİ, TON VE FORMAT REÇETESİ

- Konuşma Temposu ve Hitabet Modeli:
  ${tempo} tempo tercih edilmeli; ilk 3 saniyede soru veya problem tespitiyle dikkat toplanıp, ana mesaj 15-25. saniyeler arasında net verilmelidir. Kamera odağında göz teması korunmalı, eller göğüs hizasında destekleyici beden diliyle kullanılmalıdır.
- İdeal Video Süresi ve Format Mimarisi:
  Seçilen ideal süre ${duration} aralığıdır. İlk 3 saniye kanca (hook), 4-25. saniye arası temel bilgi/argüman (etken madde veya pratik öneri), son 5 saniyede ise net aksiyon çağrısı (CTA) mimarisi uygulanmalıdır.
- Kanca ve CTA Mühendisliği:
  Katılımcının uzmanlık alanına özel somut reçeteler:
  - Kanca 1 (Mit Çürütme): "Her gün kullandığınız bu takviyenin aslında vücudunuzda emilmediğini biliyor muydunuz?"
  - Kanca 2 (Hata Bildirimi): "Reçetesiz aldığınız bu vitaminleri aynı anda içiyorsanız dikkat! İşte yapılan en büyük hata:"
  - Kanca 3 (Problem Çözümü): "Gece uykudan yorgun uyanıyorsanız tahlillerinizde ilk bakmanız gereken 3 değer:"
  - CTA 1 (Kaydetme): "Bu bilgiyi eczaneye veya doktora gittiğinizde hatırlamak için şimdiden kaydedin."
  - CTA 2 (Yorum): "Siz bu takviyeyi hangi saatte alıyorsunuz? Yorumlarda buluşalım, doğrusunu konuşalım."
  - CTA 3 (Farkındalık): "Benzer şikâyeti olan bir yakınınız varsa bu videoyu onunla paylaşarak farkındalık oluşturabilirsiniz."

## 3. KİŞİSELLEŞTİRİLMİŞ İÇERİK SERİLERİ VE ÜRETİM MATRİSİ

- Seri 1: Sağlıkta Doğru Bilinen Yanlışlar (Mit Avcısı)
  - Format: 30-45 Saniye Dikey Video (Reels / Shorts / TikTok)
  - Yayın Kanalı: Instagram & TikTok
  - Detaylı İçerik Mantığı: Toplumda yerleşmiş yanlış sağlık alışkanlıklarını bilimsel kanıt ve pratik dille çürüten dinamik seri.
  - Örnek bölüm başlıkları:
    * Bölüm 1: Aç karnına C vitamini içmek doğru mu?
    * Bölüm 2: Kolajen takviyelerinde yapılan 3 kritik hata
    * Bölüm 3: Antibiyotik biter bitmez probiyotik nasıl başlanmalı?
  - Üretim akışı: 1 gün araştırma ve senaryo, 1 gün 4 bölümlük toplu çekim, altyazılı hızlı kurgu.
  - Risk/uyum notu: İlaç ismi verilmemeli, sadece etken madde ve genel fizyolojik mekanizma anlatılmalıdır.

- Seri 2: Danışan Soruyor: 60 Saniyede Reçete Arkası
  - Format: Soru-Cevap & Carousel / Konuşan Kafa Video
  - Yayın Kanalı: Instagram & LinkedIn
  - Detaylı İçerik Mantığı: Eczane ve klinik pratiğinde hastaların en sık sorduğu gündelik sağlık problemlerine hap cevaplar.
  - Örnek bölüm başlıkları:
    * Bölüm 1: Magnezyumun hangi formu uykusuzluğa, hangisi krampa iyi gelir?
    * Bölüm 2: Güneş kremi sürdükten kaç dakika sonra dışarı çıkılmalı?
    * Bölüm 3: Demir ilacı içerken çay-kahve tüketimi nasıl ayarlanmalı?
  - Üretim akışı: Haftalık soru kutusu açma, en popüler 2 soruyu senaryolaştırma ve çekme.
  - Risk/uyum notu: Tıbbi teşhis/tedavi yönlendirmesi yapılmamalı, "hekiminize ve eczacınıza danışın" ibaresi yer almalıdır.

- Seri 3: Bir Sağlık Profesyonelinin Günlük Rutini
  - Format: Vlog / Lifestyle / Kamera Arkası Video
  - Yayın Kanalı: Instagram Reels & Hikâyeler
  - Detaylı İçerik Mantığı: Sağlık profesyonelinin kendi sağlıklı yaşam rutinlerini ve mesleki disiplinini gösteren güven artırıcı seri.
  - Örnek bölüm başlıkları:
    * Bölüm 1: Yoğun mesai gününde enerjimi nasıl koruyorum?
    * Bölüm 2: Eczane nöbetinde tükettiğim 3 sağlıklı ara öğün
    * Bölüm 3: Masa başı çalışanlar için 2 dakikalık omurga esnetme rutinim
  - Üretim akışı: Gün içi doğal anların 3-5 saniyelik B-roll çekimi ve üzerine seslendirme (voiceover).
  - Risk/uyum notu: Hasta mahremiyeti ve KVKK kurallarına uyulmalı; hasta yüzü, reçete bilgisi kadraja girmemelidir.

## 4. ROL MODEL VE BENCHMARK ANALİZİ

- Referans Alınan Tarzların Değerlendirilmesi:
  Belirtilen referans içerik üreticileri (${benchmarks}), sağlık alanında profesyonellik ile samimiyeti harmanlayan öncülerdir. Bu hesapların kamera açıları ve kanca yapıları incelenmeli ancak asla doğrudan taklit edilmemelidir.
- Görsel ve İşitsel Estetik Yönlendirmeler:
  Doğal ışık veya softbox ışık kaynağı yüz hizasında konumlandırılmalı; yaka mikrofonu ile net ve parazitsiz ses kaydı alınmalıdır. Arka planda aşırı karmaşa yerine sade bir çalışma masası veya mesleki kütüphane tercih edilmelidir.
- Kopyalamadan Modelleme:
  Benchmark hesapların içerik başlıkları değil; kurgu ritmi, altyazı tipografisi ve izleyiciyle kurdukları empati dili referans alınmalı, içerik özü tamamen katılımcının kendi mesleki deneyiminden beslenmelidir.

## 5. OPERASYONEL RİSKLER, MEVZUAT FARKINDALIĞI VE TÜKENMİŞLİK ANALİZİ

- Birincil Operasyonel Darboğaz:
  Katılımcının en çok zorlandığı "${bottleneck}" konusunu aşmak için; "İçerik Fikir Havuzu" oluşturulmalı, haftada 1 gün 1 saat sadece fikir ve senaryo yazımına ayrılmalıdır.
- TİTCK/KVKK ve Sağlık İletişimi Uyarıları:
  * TİTCK Mevzuatı: Ruhsatlı beşeri tıbbi ürünlerin (ilaçların) doğrudan veya dolaylı reklamı kesinlikle yasaktır. Marka ismi yerine jenerik etken madde kullanılmalıdır.
  * KVKK: Hasta fotoğrafları, tetkik sonuçları veya reçete detayları hiçbir koşulda açık paylaşılamaz.
  * Endikasyon Sınırı: Gıda takviyelerine hastalık tedavi edici veya önleyici tıbbi iddialar yüklenemez.
- Kriz Yönetimi Simülasyonu:
  Haksız eleştiri veya linç girişimi durumunda: 1. Duygusal yanıt vermeme, 2. Bilimsel kaynak ve literatür referansı içeren sakin bir açıklama sabitleme, 3. Hakaret ve küfür içeren yorumları hukuki delil olarak arşivleyip engelleme protokolü izlenmelidir.
- Tükenmişlik Önleme:
  Haftalık ${weeklyCap} içerik hedefi için "Batch Production" (Toplu Çekim) modeli uygulanmalı; ayda 2 yarım gün ayrılarak 8-10 video tek seansta çekilmelidir.

## 6. 7 ADIMLI KAPSAMLI UYGULAMA VE GELİŞİM YOL HARİTASI

- Adım 1: [İlk 48 Saat: Biyografi ve Profil Optimizasyonu] Instagram/TikTok biyografisine net uzmanlık alanı, hedef kitleye vaat ve "${brandWords}" vizyonunu yansıtan tek cümlelik bio yazımı.
- Adım 2: [1. Hafta: Teknik Kurulum ve Işık/Ses Standardizasyonu] Yaka mikrofonu, tripod ve sabit çekim açısının belirlenerek test kayıtlarının tamamlanması.
- Adım 3: [1. Hafta: İlk 3 Senaryonun Yazılması] Seri 1 (Mit Avcısı) için güçlü kancalara sahip 3 adet 30 saniyelik taslak senaryonun hazırlanması.
- Adım 4: [2. Hafta: Toplu Çekim Seansı] Hazırlanan 3 senaryonun tek oturumda çekilmesi ve otomatik altyazı aracıyla kurgulanması.
- Adım 5: [2. Hafta: TİTCK & KVKK Özdenetim Kontrolü] Hazırlanan videoların reklam, ürün yönlendirmesi veya hasta mahremiyeti riski taşımadığının teyit edilerek yayına alınması.
- Adım 6: [3. Hafta: Topluluk Yönetimi ve Soru-Cevap Kutusu] Gelen yorumların ilk 1 saat içinde uzmanlık diliyle yanıtlanması ve hikâyelerden yeni içerik sorularının toplanması.
- Adım 7: [4. Hafta: Aylık Metrik Değerlendirmesi ve Mentor Brifingi] En çok kaydedilen ve paylaşılan video formatının tespit edilerek 2. ay takviminin bu doğrultuda optimize edilmesi.

## 7. İLK 14 GÜN İÇİN MİNİ İÇERİK TAKVİMİ

- Gün 1: [Tanıtım / Konumlandırma] | Kanca: "Sağlıkta doğru bilinen yanlışları bilimsel kanıtlarla konuşmaya başlıyoruz." | Format: 45 sn Reels | Amaç: Yeni profil vizyonunu deklare etme | Uyum Notu: İlaçsız / Tıbbi iddiasız
- Gün 2: [Topluluk Etkileşimi] | Kanca: "—" | Format: Story Soru Kutusu | Amaç: "En çok merak ettiğiniz takviye hangisi?" sorusuyla içerik havuzu besleme | Uyum Notu: Reçete yönlendirmesi yapmama
- Gün 3: [Seri 1 - Bölüm 1 (Mit)] | Kanca: "Aç karnına C vitamini içmek doğru mu?" | Format: 30 sn Video | Amaç: Bilgi otoritesi kurma | Uyum Notu: Etken madde odaklı
- Gün 4: [Story Bilgi Hapı] | Kanca: "Günün sağlık notu:" | Format: 3 Slide Story | Amaç: Günlük temas sağlama | Uyum Notu: Genel koruyucu öneri
- Gün 5: [Seri 2 - Bölüm 1 (Soru-Cevap)] | Kanca: "Magnezyumun hangi formu uykusuzluğa iyi gelir?" | Format: 45 sn Video | Amaç: Fayda ve pratik çözüm | Uyum Notu: "Eczacınıza danışın" uyarısı
- Gün 6: [Kamera Arkası / Samimiyet] | Kanca: "Mesai biterken nöbetten küçük bir kare:" | Format: Story Fotoğraf/Kısa Video | Amaç: Samimiyet ve güven inşası | Uyum Notu: Hasta yüzü ve reçete kadraja girmemeli
- Gün 7: [Haftalık Analiz] | Kanca: "—" | Format: Metrik Kontrolü | Amaç: En çok izlenen videonun kancasını analiz etme | Uyum Notu: —
- Gün 8: [Seri 3 - Bölüm 1 (Rutin)] | Kanca: "Yoğun bir mesai gününde enerjimi korumamı sağlayan 3 alışkanlık:" | Format: 30 sn Vlog | Amaç: Lifestyle & Sağlık Liderliği | Uyum Notu: Ürün yerleştirme içermez
- Gün 9: [Story Eğitici Anket] | Kanca: "Bu iki vitamini birlikte alanlar burada mı?" | Format: Story İnteraktif Anket | Amaç: Algoritma etkileşimi artırma | Uyum Notu: Endikasyon belirtmeme
- Gün 10: [Seri 1 - Bölüm 2 (Mit)] | Kanca: "Kolajen takviyelerinde yapılan 3 kritik hata:" | Format: 35 sn Video | Amaç: Kaydedilme ve paylaşım alma | Uyum Notu: Markasız bilimsel açıklama
- Gün 11: [Yorum Yanıtlama] | Kanca: "Gelen en popüler soruyu birlikte yanıtlayalım:" | Format: Story Video | Amaç: Güven bağı pekiştirme | Uyum Notu: Hasta özelinde teşhis koymama
- Gün 12: [Seri 2 - Bölüm 2 (Soru-Cevap)] | Kanca: "Güneş kremi sürdükten kaç dakika sonra dışarı çıkılmalı?" | Format: 40 sn Video | Amaç: Mevsimsel farkındalık | Uyum Notu: Kozmetik mevzuatına uygunluk
- Gün 13: [Carousel Bilgi Kartı] | Kanca: "Tahlil yaptırmadan önce asla yapmamanız gereken 4 şey:" | Format: 5 Slide Carousel Görsel | Amaç: Yüksek kaydetme oranı | Uyum Notu: Laboratuvar genel bilgilendirme
- Gün 14: [Değerlendirme & Mentor Brifingi] | Kanca: "14 günlük içerik maratonunda neler öğrendik?" | Format: Story Kapanış & Mentor Notu | Amaç: 2. ay takvimine geçiş | Uyum Notu: —`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin') || ''
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new Response(JSON.stringify({ ok: false, error: 'CORS yetkisi reddedildi.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonRes(req, { ok: false, error: 'Yetkilendirme başlığı eksik.' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return jsonRes(req, { ok: false, error: 'Oturum doğrulanamadı.' }, 401)

    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) return jsonRes(req, { ok: false, error: 'Profil bulunamadı.' }, 403)
    if (profile.role !== 'katilimci' && profile.role !== 'admin') {
      return jsonRes(req, { ok: false, error: 'Bu işlem için katılımcı veya admin yetkisi gereklidir.' }, 403)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { cevaplar, katilimci_id: targetKatilimciId } = await req.json()

    let katilimciId = profile.core_katilimci_id
    if (profile.role === 'admin' && targetKatilimciId) {
      katilimciId = targetKatilimciId
    }

    // Katılımcı kaydı yoksa otomatik oluştur ve profile bağla
    if (!katilimciId) {
      const { data: newAday } = await adminClient
        .from('core_aday')
        .insert({
          ad: profile.ad_soyad || 'Katılımcı',
          soyad: 'Üyesi',
          eposta: profile.email || `${user.id}@example.com`,
          telefon: '5550000000',
          universite: 'Sağlık Bilimleri',
          sinif: '4',
          kaynak: 'Direct',
          takvim_onay: true,
          basvuru_durumu: 'ONAYLANDI',
          basvuru_tarihi: new Date().toISOString()
        })
        .select()
        .single()

      if (newAday) {
        const { data: newK } = await adminClient
          .from('core_katilimci')
          .insert({
            aday_id: newAday.id,
            kabul_durumu: true,
            kabul_tarihi: new Date().toISOString().split('T')[0],
            program_katilim_durumu: 'AKTIF',
            notlar: ''
          })
          .select()
          .single()

        if (newK) {
          katilimciId = newK.id
          await adminClient
            .from('profiles')
            .update({ core_katilimci_id: newK.id })
            .eq('id', user.id)

          await adminClient
            .from('core_katilimciperformans')
            .insert({
              katilimci_id: newK.id,
              bireysel_puan: 0,
              gorev_puani: 0,
              toplanti_katilim_puani: 0,
              etkilesim_bonus_puani: 0,
              manuel_puan: 0,
              admin_ici_not: '',
              katilimciya_gorunen_not: '',
              olusturulma_tarihi: new Date().toISOString(),
              guncellenme_tarihi: new Date().toISOString()
            })
        }
      }
    }

    if (!katilimciId) return jsonRes(req, { ok: false, error: 'Katılımcı kaydı eşleştirilemedi.' }, 400)

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    let raporMetni = ""
    let aiModel = geminiKey ? "Gemini 2.5 Flash" : "Standart Analiz Şablonu"
    const promptVersiyonu = "v2.0"

    const formattedAnswers = formatAnswersForPrompt(cevaplar)

    if (geminiKey) {
      try {
        const systemPrompt = `Sen, sağlık profesyonelleri (eczacı, hekim, diyetisyen, fizyoterapist, diş hekimi ve diğer sağlık uzmanları) için dijital içerik stratejileri, kişisel marka konumlandırma, sağlık iletişimi, regülasyon farkındalığı, KVKK hassasiyeti ve operasyonel risk yönetimi alanında uzmanlaşmış kıdemli bir "İçerik Stratejisi ve Dijital DNA Analiz Uzmanı"sın.

RAPORUN AMACI:
Katılımcının 20 soruluk "İçerik Üretici DNA Envanteri" cevaplarını birbiriyle çapraz analiz ederek kişiye özel, somut, uygulanabilir, gerçekçi ve profesyonel bir "Kişiselleştirilmiş İçerik ve Operasyonel DNA Raporu" üretmektir.

KESİN KURALLAR & SINIRLAR:
1. Aşırı soyut, edebi, gerçekçi olmayan veya hayal gücüne dayalı yorumlar YASAKTIR.
2. "Düzenli paylaşım yap", "iyi kamera kullan", "samimi ol" gibi genel ve ucuz tavsiyeler YASAKTIR.
3. Tavsiyeler somut, ölçülebilir ve uygulanabilir olmalıdır (Örn: "Haftada 2 kez, ilk 3 saniyesinde 'hata bildirimi' kancası içeren 30 saniyelik mit çürütme videosu üret.").
4. Tıbbi teşhis, tedavi, ilaç önerisi, reçete yönlendirmesi veya hasta özelinde tıbbi tavsiye KESİNLİKLE VERİLMEMELİDİR.
5. Rapor, TİTCK (Türkiye İlaç ve Tıbbi Cihaz Kurumu), Sağlık Bakanlığı Sağlık İletişimi Kılavuzları ve KVKK regülasyonları ile etik sağlık iletişimi ilkelerine tam uyum farkındalığı üretmelidir.
6. Rapor hukuki görüş değildir; uygun yerlerde "Hukuk / regülasyon danışmanı onayı önerilir" gibi profesyonel uyarılar yer alabilir.
7. Her bölüm gerekçeli, adım adım uygulanabilir ve kıdemli danışmanlık tonunda olmalıdır.
8. Kısa geçiştirilmiş rapor üretme; 4-5 sayfa derinliğinde, analitik, doyurucu ve yapılandırılmış olmalıdır.
9. Rapor tamamen katılımcının cevaplarına dayanmalıdır. Yanıtlarda olmayan unsurlar uydurulmamalı, eksik yanıt varsa belirtilip varsayım yapılmadan sınırlandırılmalıdır.

ÇAPRAZ ANALİZ PRENSİBİ:
Sorular birbirinden bağımsız tekil yanıtlar olarak değil, aralarındaki nedensellik bağlarıyla analiz edilmelidir:
- Amaç (S1) + Seçilen Konular (S2) + Arketip Tercihi (S16) + Kamera Rahatlığı (S9) ➔ Gerçekçi pazar konumlandırması ve uzmanlık nişi.
- Platform/Format (S3, S5) + Haftalık Üretim Kapasitesi (S14) + Zorlanılan Alanlar (S10) ➔ Sürdürülebilir operasyonel mimari ve darboğaz çözümü.
- Kriz Tepkisi (S13) + Sağlık İletişimi Dili (S4, S11) + Regülasyon Riski (TİTCK/KVKK) ➔ Kriz dayanıklılığı ve yasal uyum kalkanı.
- Benchmark/Rol Model (S17) + Hedef Marka Kelimeleri (S18, S19, S20) + Format (S3) ➔ Taklitten uzak, özgün marka kimliği modellemesi.
- Kamera Rahatlığı (S9) + Konuşma Temposu/Hitabet (S6, S11) + Video Süresi (S5) ➔ Diksiyon, kurgu ve sunum reçetesi.

ZORUNLU ÇIKTI FORMATI (Aşağıdaki Markdown başlık yapısını ve sırasını BİREBİR ve EKSİKSİZ kullan):

## İÇERİK DNA VE OPERASYONEL SKOR KARTI

- Arketip Eşleşmesi: %[0-100]  
  [Seçilen konular ile iletişim dili arasındaki uyum analizi ve gerekçesi]
- Marka Tutarlılığı: %[0-100]  
  [Mevcut konumlandırma ile hedeflenen marka kelimeleri arasındaki gap analizi]
- Kamera ve Prodüksiyon Hazırlığı: %[0-100]  
  [Kamera rahatlığı ve format tercihleri dengesi analizi]
- İçerik Üretim Kapasitesi: %[0-100]  
  [Planlanan haftalık sıklık ile zorlanılan alanların rasyonel analizi]
- Kriz Yönetimi Dayanıklılığı: %[0-100]  
  [Haksız eleştiriye verilen tepkinin mesleki olgunluk ve regülasyon skoru]

## 1. STRATEJİK PAZAR KONUMLANDIRMASI VE ARKETİP ANALİZİ

- Ana Profil Tespiti:
  [Katılımcının 20 soruluk verisine göre net arketip tespiti, alt dinamikleri ve gerekçesi]
- Stratejik Hedef ve Motivasyon Analizi:
  [Kişinin içerik üretme amacı ile seçtiği nişin rasyonel uyumu ve mesleki kaldıraç etkisi]
- Mevcut Algı vs. Hedef Algı:
  [Kişinin kendini konumlandırmak istediği marka algısı (S18-S20) ile pazar gerçekliği arasındaki köprü stratejisi]

## 2. İLETİŞİM DİLİ, TON VE FORMAT REÇETESİ

- Konuşma Temposu ve Hitabet Modeli:
  [Kamera temposu, hitabet tarzı ve dil tercihine göre somut diksiyon, beden dili ve sunum yönergeleri]
- İdeal Video Süresi ve Format Mimarisi:
  [Seçilen video süresi ve format üzerinden kurgu dinamizmi, B-roll kullanımı, sahne geçişleri ve dikkat tutma mimarisi]
- Kanca ve CTA Mühendisliği:
  Katılımcının nişine ve hedef kitlesine özel somut örnekler:
  - Kanca 1 (Merak/Soru Odaklı): "[Somut kanca metni]"
  - Kanca 2 (Mit/Hata Çürütme Odaklı): "[Somut kanca metni]"
  - Kanca 3 (Hikâye/Problem Odaklı): "[Somut kanca metni]"
  - CTA 1 (Yorum/Tartışma Odaklı): "[Somut CTA metni]"
  - CTA 2 (Kaydetme/Referans Odaklı): "[Somut CTA metni]"
  - CTA 3 (Farkındalık/Topluluk Odaklı): "[Somut CTA metni]"

## 3. KİŞİSELLEŞTİRİLMİŞ İÇERİK SERİLERİ VE ÜRETİM MATRİSİ

Sürdürülebilir, uzmanlığa uygun ve tekrar üretilebilir 3 spesifik içerik serisi:

- Seri 1: [Seri Adı]
  - Format: [Video / Carousel / Shorts vb.]
  - Yayın Kanalı: [Instagram / TikTok / YouTube / LinkedIn]
  - Detaylı İçerik Mantığı: [Serinin amacı, kime hitap ettiği ve değer önerisi]
  - Örnek bölüm başlıkları:
    * Bölüm 1: [Başlık]
    * Bölüm 2: [Başlık]
    * Bölüm 3: [Başlık]
  - Üretim akışı: [Araştırma, senaryo, çekim ve kurgu adımları]
  - Risk/uyum notu: [TİTCK / KVKK / Etik açıdan dikkat edilecek husus]

- Seri 2: [Seri Adı]
  - Format: [Video / Carousel / Shorts vb.]
  - Yayın Kanalı: [Instagram / TikTok / YouTube / LinkedIn]
  - Detaylı İçerik Mantığı: [Serinin amacı, kime hitap ettiği ve değer önerisi]
  - Örnek bölüm başlıkları:
    * Bölüm 1: [Başlık]
    * Bölüm 2: [Başlık]
    * Bölüm 3: [Başlık]
  - Üretim akışı: [Araştırma, senaryo, çekim ve kurgu adımları]
  - Risk/uyum notu: [TİTCK / KVKK / Etik açıdan dikkat edilecek husus]

- Seri 3: [Seri Adı]
  - Format: [Video / Carousel / Shorts vb.]
  - Yayın Kanalı: [Instagram / TikTok / YouTube / LinkedIn]
  - Detaylı İçerik Mantığı: [Serinin amacı, kime hitap ettiği ve değer önerisi]
  - Örnek bölüm başlıkları:
    * Bölüm 1: [Başlık]
    * Bölüm 2: [Başlık]
    * Bölüm 3: [Başlık]
  - Üretim akışı: [Araştırma, senaryo, çekim ve kurgu adımları]
  - Risk/uyum notu: [TİTCK / KVKK / Etik açıdan dikkat edilecek husus]

## 4. ROL MODEL VE BENCHMARK ANALİZİ

- Referans Alınan Tarzların Değerlendirilmesi:
  [Kişinin belirttiği benchmark hesaplar (S17) ile arketip tercihleri arasındaki tutarlılık ve stratejik çıkarımlar]
- Görsel ve İşitsel Estetik Yönlendirmeler:
  [Stüdyo düzeni, ışıklandırma, mikrofon/ses, kadraj kompozisyonu ve renk paleti standartları]
- Kopyalamadan Modelleme:
  [Benchmark içeriklerin taklit edilmeden, kendi mesleki özgünlüğüyle nasıl sentezleneceği]

## 5. OPERASYONEL RİSKLER, MEVZUAT FARKINDALIĞI VE TÜKENMİŞLİK ANALİZİ

- Birincil Operasyonel Darboğaz:
  [Katılımcının en çok zorlandığı alan (S10) için kök neden analizi ve adım adım çözüm protokolü]
- TİTCK/KVKK ve Sağlık İletişimi Uyarıları:
  [Seçilen konular bazında reklam yasağı, endikasyon belirtme, ürün yönlendirmesi, hasta mahremiyeti ve tıbbi iddia sınırları]
- Kriz Yönetimi Simülasyonu:
  [Olası dijital linç, trol saldırısı veya haksız eleştiride (S13) uygulanacak 4 adımlı sakin ve kanıta dayalı kriz protokolü]
- Tükenmişlik Önleme:
  [Katılımcının haftalık kapasitesine (S14) ve mesai yoğunluğuna göre batch-production (toplu çekim) ve sürdürülebilirlik taktiği]

## 6. 7 ADIMLI KAPSAMLI UYGULAMA VE GELİŞİM YOL HARİTASI

Katılımcının hemen bugün uygulamaya başlayacağı, zaman çizelgesine bağlanmış 7 stratejik aksiyon adımı:

- Adım 1: [İlk 48 Saat Aksiyonu]
- Adım 2: [1. Hafta Aksiyonu]
- Adım 3: [1. Hafta Aksiyonu]
- Adım 4: [2. Hafta Aksiyonu]
- Adım 5: [2. Hafta Aksiyonu]
- Adım 6: [3. Hafta Aksiyonu]
- Adım 7: [4. Hafta Aksiyonu]

## 7. İLK 14 GÜN İÇİN MİNİ İÇERİK TAKVİMİ

14 günlük uygulanabilir mini yayın planı:

- Gün 1: [İçerik Tipi] | Kanca: "[Kanca]" | Format: [Format] | Amaç: [Amaç] | Uyum Notu: [Uyum Notu]
- Gün 2: [İçerik Tipi] | Kanca: "—" | Format: [Format] | Amaç: [Amaç] | Uyum Notu: [Uyum Notu]
- Gün 3: [İçerik Tipi] | Kanca: "[Kanca]" | Format: [Format] | Amaç: [Amaç] | Uyum Notu: [Uyum Notu]
- Gün 4: [İçerik Tipi] | Kanca: "[Kanca]" | Format: [Format] | Amaç: [Amaç] | Uyum Notu: [Uyum Notu]
- Gün 5: [İçerik Tipi] | Kanca: "[Kanca]" | Format: [Format] | Amaç: [Amaç] | Uyum Notu: [Uyum Notu]
- Gün 6: [İçerik Tipi] | Kanca: "—" | Format: [Format] | Amaç: [Amaç] | Uyum Notu: [Uyum Notu]
- Gün 7: [İçerik Tipi] | Kanca: "—" | Format: [Format] | Amaç: [Amaç] | Uyum Notu: [Uyum Notu]
- Gün 8: [İçerik Tipi] | Kanca: "[Kanca]" | Format: [Format] | Amaç: [Amaç] | Uyum Notu: [Uyum Notu]
- Gün 9: [İçerik Tipi] | Kanca: "[Kanca]" | Format: [Format] | Amaç: [Amaç] | Uyum Notu: [Uyum Notu]
- Gün 10: [İçerik Tipi] | Kanca: "[Kanca]" | Format: [Format] | Amaç: [Amaç] | Uyum Notu: [Uyum Notu]
- Gün 11: [İçerik Tipi] | Kanca: "—" | Format: [Format] | Amaç: [Amaç] | Uyum Notu: [Uyum Notu]
- Gün 12: [İçerik Tipi] | Kanca: "[Kanca]" | Format: [Format] | Amaç: [Amaç] | Uyum Notu: [Uyum Notu]
- Gün 13: [İçerik Tipi] | Kanca: "[Kanca]" | Format: [Format] | Amaç: [Amaç] | Uyum Notu: [Uyum Notu]
- Gün 14: [İçerik Tipi] | Kanca: "—" | Format: [Format] | Amaç: [Amaç] | Uyum Notu: [Uyum Notu]

KATILIMCININ 20 SORULUK ENVENTAR CEVAPLARI:
${formattedAnswers}`

        // Try primary model (gemini-2.5-flash), fallback to gemini-1.5-flash if needed
        const models = ['gemini-2.5-flash', 'gemini-1.5-flash']
        for (const modelName of models) {
          try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: {
                  temperature: 0.5,
                  maxOutputTokens: 8192,
                  topP: 0.95
                }
              })
            })

            if (geminiRes.ok) {
              const gData = await geminiRes.json()
              const candidateText = gData.candidates?.[0]?.content?.parts?.[0]?.text
              if (candidateText && candidateText.trim().length > 200) {
                raporMetni = candidateText.trim()
                aiModel = `Gemini ${modelName.includes('2.5') ? '2.5 Flash' : '1.5 Flash'}`
                break
              }
            } else {
              console.warn(`Gemini API call to ${modelName} returned status ${geminiRes.status}`)
            }
          } catch (mErr) {
            console.warn(`Error calling ${modelName}:`, mErr)
          }
        }
      } catch (err) {
        console.error('Gemini API call exception:', err)
      }
    }

    if (!raporMetni) {
      raporMetni = generateStructuredFallbackReport(cevaplar)
      aiModel = "Stratejik Analiz Şablonu"
    }

    const scorecard = extractScorecardFromText(raporMetni)
    const raporJson = {
      cevaplar,
      rapor_metni: raporMetni,
      scorecard,
      archetype: String(cevaplar?.soru_16 || 'Sağlık İletişim Lideri'),
      summary: `20 soruluk DNA envanteri doğrultusunda hazırlanan stratejik içerik ve operasyonel DNA analiz raporu.`,
      prompt_version: promptVersiyonu
    }

    const now = new Date().toISOString()
    const { data: existing } = await adminClient
      .from('core_icerikdnatesti')
      .select('id')
      .eq('katilimci_id', katilimciId)
      .maybeSingle()

    let dbData = null
    let dbErr = null

    if (existing) {
      const res = await adminClient
        .from('core_icerikdnatesti')
        .update({
          cevaplar,
          rapor_json: raporJson,
          rapor_metni: raporMetni,
          durum: 'TAMAMLANDI',
          ai_model: aiModel,
          prompt_versiyonu: promptVersiyonu,
          gonderim_tarihi: now,
          guncellenme_tarihi: now,
          hata_mesaji: null
        })
        .eq('id', existing.id)
        .select()
        .single()
      dbData = res.data
      dbErr = res.error
    } else {
      const res = await adminClient
        .from('core_icerikdnatesti')
        .insert({
          katilimci_id: katilimciId,
          cevaplar,
          rapor_json: raporJson,
          rapor_metni: raporMetni,
          durum: 'TAMAMLANDI',
          ai_model: aiModel,
          prompt_versiyonu: promptVersiyonu,
          gonderim_tarihi: now,
          olusturulma_tarihi: now,
          guncellenme_tarihi: now,
        })
        .select()
        .single()
      dbData = res.data
      dbErr = res.error
    }

    if (dbErr) {
      console.error('DB Write Error:', dbErr)
      return jsonRes(req, { ok: false, error: 'DNA testi sonuçları veritabanına kaydedilemedi.' }, 500)
    }

    return jsonRes(req, { ok: true, data: dbData })
  } catch (err: any) {
    console.error('ai-content-dna error:', err)
    return jsonRes(req, { ok: false, error: 'Sunucu hatası oluştu.' }, 500)
  }
})
