import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://saglikliderleri.markamutfagi.co',
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

// 20 Soruluk DNA Envanteri Soru Başlıkları, Kategorileri ve Anlam Haritası
interface QuestionMeta {
  label: string
  category: string
}

const QUESTION_META: Record<string, QuestionMeta> = {
  soru_1: { label: "İçerik üretme amacın nedir?", category: "Hedef & Motivasyon" },
  soru_2: { label: "En çok hangi konularda içerik üretmek istiyorsun?", category: "Odak & Niş Alanları" },
  soru_3: { label: "İçeriklerini en çok hangi formatta/tarzda üretmeyi düşünüyorsun?", category: "Format Tercihi" },
  soru_4: { label: "İçeriklerinde seni en iyi anlatan iletişim dili hangisi?", category: "Ton & Üslup" },
  soru_5: { label: "Bir konuyu anlatırken kendini en rahat hissettiğin video süresi hangisi?", category: "İdeal Video Süresi" },
  soru_6: { label: "Kamera karşısındaki konuşma temponu nasıl tanımlarsın?", category: "Konuşma Temposu" },
  soru_7: { label: "Videolarına başlamayı en çok hangi şekilde seversin (Giriş Kancası)?", category: "Giriş Kancası" },
  soru_8: { label: "Videonun sonunda (CTA) izleyiciden en çok hangi davranışı beklemek istersin?", category: "Aksiyon Çağrısı" },
  soru_9: { label: "Kamera karşısında kendini nasıl hissediyorsun (1: Çok Zorlanıyorum - 5: Çok Rahatım)?", category: "Kamera Özgüveni" },
  soru_10: { label: "Bir video hazırlarken en çok zorlandığın konu nedir (Birincil Darboğaz)?", category: "Operasyonel Engel" },
  soru_11: { label: "Videolarında seni en çok hangi anlatım tarzı temsil eder?", category: "Anlatıcı Karakteri" },
  soru_12: { label: "Video hazırlarken seni en çok motive eden şey nedir?", category: "Temel İtici Güç" },
  soru_13: { label: "Bir kriz anında (haksız eleştiri, linç vb.) ilk tepkin ne olur?", category: "Kriz Refleksi" },
  soru_14: { label: "Kendi mesai yoğunluğunda haftada kaç içerik üretmeyi gerçekçi buluyorsun?", category: "Üretim Hacmi" },
  soru_15: { label: "Kendini içerik üretimi konusunda bugün hangi seviyede görüyorsun?", category: "Mevcut Yetkinlik" },
  soru_16: { label: "En yakın hissettiğin ana tarz / arketip tercihi?", category: "Hedef Arketip" },
  soru_17: { label: "Sosyal medyada tarzını beğendiğin / örnek aldığın 1-3 sağlık içerik üreticisi (Benchmark)?", category: "Rol Model Hesaplar" },
  soru_18: { label: "Kendi markanı yansıtacak en fazla 3 kelime (Mevcut Algı)?", category: "Mevcut Marka Algısı" },
  soru_19: { label: "İnsanların aklına gelmesini istediğin, hedeflediğin en fazla 3 kelime (Hedef Algı)?", category: "Hedef Marka Algısı" },
  soru_20: { label: "Program sonunda insanların seni ve sayfanı tek cümleyle nasıl tanımlamasını istersin (Vizyon Cümlesi)?", category: "Nihai Konumlandırma Vizyonu" }
}

function formatAnswersForPrompt(cevaplar: Record<string, any>, profileName?: string): string {
  if (!cevaplar || typeof cevaplar !== 'object') return 'Katılımcı yanıtı bulunamadı.'
  const lines: string[] = []

  if (profileName) {
    lines.push(`KATILIMCI ADI: ${profileName}`)
    lines.push('─────────────────────────────────────────────')
  }

  for (let i = 1; i <= 20; i++) {
    const key = `soru_${i}`
    const meta = QUESTION_META[key] || { label: `Soru ${i}`, category: 'Genel' }
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

    lines.push(`[Soru ${i} | ${meta.category}] ${meta.label}\nKATILIMCI CEVABI: ${formattedVal}`)
  }

  return lines.join('\n\n')
}

function computeDynamicScorecardFromAnswers(cevaplar: Record<string, any>) {
  const c = cevaplar || {}
  const cameraScore = Number(c.soru_9) || 3
  const level = String(c.soru_15 || '')
  const weeklyNum = Number(c.soru_14) || 2
  const bottleneck = String(c.soru_10 || '')
  const targetWords = String(c.soru_19 || '')
  const vision = String(c.soru_20 || '')
  const crisis = String(c.soru_13 || '')

  const arketipSkoru = Math.min(96, Math.max(68, 78 + (c.soru_16 ? 8 : 0) + (c.soru_4 ? 6 : 0)))
  const markaSkoru = Math.min(95, Math.max(65, 72 + (targetWords.trim().length > 4 ? 10 : 0) + (vision.trim().length > 10 ? 8 : 0)))
  const kameraSkoru = Math.min(96, Math.max(42, Math.round(32 + (cameraScore * 11) + (level.includes('İleri') ? 14 : level.includes('Orta') ? 8 : 0))))
  const kapasiteSkoru = Math.min(95, Math.max(48, Math.round(58 + (weeklyNum * 6) - (bottleneck.toLowerCase().includes('zaman') ? 6 : 0))))
  const krizSkoru = Math.min(96, Math.max(60, crisis.includes('Bilimsel') || crisis.includes('kaynak') ? 92 : crisis.includes('Sakin') ? 84 : 72))

  return {
    arketip_eslesmesi: arketipSkoru,
    marka_tutarliligi: markaSkoru,
    kamera_prod_hazirligi: kameraSkoru,
    icerik_kapasitesi: kapasiteSkoru,
    kriz_dayanikliligi: krizSkoru
  }
}

function extractScorecardFromText(text: string, cevaplar: Record<string, any>) {
  const dynamicDefaults = computeDynamicScorecardFromAnswers(cevaplar)

  const parsePercent = (regex: RegExp, defaultVal: number) => {
    const m = text.match(regex)
    if (m && m[1]) {
      const num = parseInt(m[1].replace(/[%]/g, ''), 10)
      if (!isNaN(num) && num >= 0 && num <= 100) return num
    }
    return defaultVal
  }

  return {
    arketip_eslesmesi: parsePercent(/Arketip Eşleşmesi[:\s]+%?(\d+)/i, dynamicDefaults.arketip_eslesmesi),
    marka_tutarliligi: parsePercent(/Marka Tutarlılığı[:\s]+%?(\d+)/i, dynamicDefaults.marka_tutarliligi),
    kamera_prod_hazirligi: parsePercent(/Kamera ve Prodüksiyon Hazırlığı[:\s]+%?(\d+)/i, dynamicDefaults.kamera_prod_hazirligi),
    icerik_kapasitesi: parsePercent(/İçerik Üretim Kapasitesi[:\s]+%?(\d+)/i, dynamicDefaults.icerik_kapasitesi),
    kriz_dayanikliligi: parsePercent(/Kriz Yönetimi Dayanıklılığı[:\s]+%?(\d+)/i, dynamicDefaults.kriz_dayanikliligi)
  }
}

function generateStructuredFallbackReport(cevaplar: Record<string, any>, profileName?: string): string {
  const c = cevaplar || {}
  const rawTopicsList = Array.isArray(c.soru_2) ? c.soru_2 : (c.soru_2 ? [String(c.soru_2)] : ['Genel Sağlık'])
  const rawTopics = rawTopicsList.join(', ')
  const mainTopic = rawTopicsList[0] || 'Sağlıklı Yaşam'
  const secondTopic = rawTopicsList[1] || rawTopicsList[0] || 'Koruyucu Sağlık'

  const tone = String(c.soru_4 || 'Eğitici ve Samimi')
  const duration = String(c.soru_5 || '30-45 saniye')
  const tempo = String(c.soru_6 || 'Dinamik ve akıcı')
  const primaryGoal = String(c.soru_1 || 'İnsanları doğru bilgilendirmek ve mesleki uzmanlığı göstermek')
  const cameraScore = Number(c.soru_9) || 3
  const bottleneck = String(c.soru_10 || 'Konu bulmak ve senaryo kurgulamak')
  const narration = String(c.soru_11 || 'Reçete ve Çözüm Odaklı')
  const weeklyCap = String(c.soru_14 || '2')
  const level = String(c.soru_15 || 'Orta')
  const archetypeChoice = String(c.soru_16 || 'Klinik ve Akademik Tarz')
  const benchmarks = String(c.soru_17 || 'Kanıta dayalı bilimsel sağlık hesapları')
  const brandWords = String(c.soru_18 || 'Güvenilir, Bilimsel, Samimi')
  const targetWords = String(c.soru_19 || 'Yol Gösteren, Pratik, Yetkin')
  const vision = String(c.soru_20 || 'Sağlıkta doğru bilginin güvenilir ve anlaşılır dijital adresi.')
  const scores = computeDynamicScorecardFromAnswers(cevaplar)

  const isLowCamera = cameraScore <= 2
  const cameraAdvice = isLowCamera
    ? `Kamera karşısında zorlanma seviyesi (${cameraScore}/5) göz önüne alınarak; ilk aşamada doğrudan uzun monologlar yerine 15-20 saniyelik B-roll üzerine seslendirme (voiceover), görsel destekli carousel içerikler ve prompter destekli kısa çekimler uygulanmalıdır.`
    : `Kamera karşısındaki özgüven seviyesi (${cameraScore}/5), doğrudan izleyiciyle göz teması kuran dinamik 'konuşan kafa' videoları ve interaktif soru-cevap formatları için elverişli bir zemin sunmaktadır.`

  return `## İÇERİK DNA VE OPERASYONEL SKOR KARTI

- Arketip Eşleşmesi: %${scores.arketip_eslesmesi}  
  Seçilen odak alanları (${rawTopics}) ile hedeflenen iletişim dili (${tone}) arasındaki pazar uyumu ve uzmanlık örtüşmesi.
- Marka Tutarlılığı: %${scores.marka_tutarliligi}  
  Mevcut marka algısı (${brandWords}) ile hedef kitlede uyandırılmak istenen intiba (${targetWords}) arasındaki rasyonel gap analizi.
- Kamera ve Prodüksiyon Hazırlığı: %${scores.kamera_prod_hazirligi}  
  Kamera karşısındaki özgüven seviyesi (${cameraScore}/5) ile planlanan format mimarisinin prodüksiyon sürdürülebilirliği.
- İçerik Üretim Kapasitesi: %${scores.icerik_kapasitesi}  
  Haftalık planlanan ${weeklyCap} içerik hedefi ile birincil operasyonel darboğazın (${bottleneck}) dengeli iş yükü yönetimi.
- Kriz Yönetimi Dayanıklılığı: %${scores.kriz_dayanikliligi}  
  Sosyal medyadaki olası haksız eleştirilere karşı belirlenen profesyonel tutum (${c.soru_13 || 'Sakin yaklaşım'}) ve mevzuat/etik refleks olgunluğu.

## 1. STRATEJİK PAZAR KONUMLANDIRMASI VE ARKETİP ANALİZİ

- Ana Profil Tespiti:
  [Dayanak: S16=${archetypeChoice.split(':')[0]} | S4=${tone}] Katılımcı, analiz sonuçlarına göre ağırlıklı olarak "${archetypeChoice.split(':')[0]}" arketipine oturmaktadır. İletişim dilindeki "${tone}" ton tercihi, sağlık tüketicisinin ihtiyaç duyduğu güven ile dijital dünyanın gerektirdiği anlaşılırlık arasında dengeli bir köprü kurmaktadır.
- Stratejik Hedef ve Motivasyon Analizi:
  [Dayanak: S1=${primaryGoal} | S2=${rawTopics}] İçerik üretme motivasyonunun "${primaryGoal}" ekseninde olması, kısa vadeli viral hevesler yerine uzun vadeli mesleki itibar inşasını mümkün kılmaktadır. Seçilen niş konular (${rawTopics}), hedef kitlede koruyucu sağlık ve akılcı ürün bilinci oluşturmak için güçlü bir pazar karşılığına sahiptir.
- Mevcut Algı vs. Hedef Algı:
  [Dayanak: S18=${brandWords} ➔ S19=${targetWords} | S20=${vision}] Bugün kendini "${brandWords}" sözcükleriyle tanımlayan profilin, hedeflediği "${targetWords}" intibasına ulaşabilmesi için; karmaşık sağlık jargonunu günlük hayat analogilerine çeviren "${narration}" üslubu benimsenmelidir.

## 2. İLETİŞİM DİLİ, TON VE FORMAT REÇETESİ

- Konuşma Temposu ve Hitabet Modeli:
  [Dayanak: S6=${tempo} | S9=${cameraScore}/5] ${cameraAdvice} Konuşmada ${tempo} bir ritim korunmalı; ilk 3 saniyede soru veya problem tespitiyle dikkat toplanıp ana mesaj 15-25. saniyeler arasında net verilmelidir.
- İdeal Video Süresi ve Format Mimarisi:
  [Dayanak: S5=${duration} | S3=${c.soru_3 || 'Video'}] Seçilen ideal süre ${duration} aralığıdır. İlk 3 saniye kanca (hook), orta bölümde hap bilgi veya pratik argüman, son 5 saniyede ise net aksiyon çağrısı (CTA) mimarisi uygulanmalıdır.
- Kanca ve CTA Mühendisliği:
  Katılımcının ${mainTopic} ve ${secondTopic} odak alanlarına özel somut reçeteler:
  - Kanca 1 (Mit Çürütme): "${mainTopic} konusunda her gün yapılan ve doğru bilinen en kritik 3 yanlışı açıklıyorum."
  - Kanca 2 (Problem & Çözüm): "${secondTopic} kullanırken beklediğiniz faydayı alamıyorsanız sebebi bu küçük hata olabilir:"
  - Kanca 3 (Farkındalık): "Doktora veya eczaneye danışmadan önce bu 2 kuralı mutlaka bilmelisiniz:"
  - CTA 1 (Kaydetme): "Bu bilgiyi ihtiyaç duyduğunuzda kolayca bulmak için şimdiden kaydedin."
  - CTA 2 (Yorum & Etkileşim): "${mainTopic} ile ilgili en çok merak ettiğiniz soruyu yoruma yazın, birlikte yanıtlayalım."
  - CTA 3 (Topluluk & Paylaşım): "Benzer şikâyeti olan bir yakınınız varsa bu videoyu onunla paylaşarak doğru bilgiye ulaşmasını sağlayın."

## 3. KİŞİSELLEŞTİRİLMİŞ İÇERİK SERİLERİ VE ÜRETİM MATRİSİ

- Seri 1: ${mainTopic} Rehberi (Mitler ve Gerçekler)
  - Format: ${duration} Dikey Video (Reels / Shorts / TikTok)
  - Yayın Kanalı: Instagram & TikTok
  - Detaylı İçerik Mantığı: ${mainTopic} alanındaki bilgi kirliliğini bilimsel kanıt ve sade dille çürüten dinamik seri.
  - Örnek bölüm başlıkları:
    * Bölüm 1: ${mainTopic} alanında en sık yapılan 3 hata
    * Bölüm 2: ${mainTopic} seçerken etiket okuma rehberi
    * Bölüm 3: Sağlık profesyonelinin ${mainTopic} konusundaki altın kuralı
  - Üretim akışı: Haftada 1 gün senaryolaştırma, toplu çekim ve altyazı entegrasyonu.
  - Risk/uyum notu: İlaç ismi verilmemeli, sadece etken madde ve genel mekanizma anlatılmalıdır.

- Seri 2: Danışan Soruyor: ${secondTopic} Hakkında Merak Edilenler
  - Format: Soru-Cevap & Carousel / Konuşan Kafa Video
  - Yayın Kanalı: Instagram & LinkedIn
  - Detaylı İçerik Mantığı: ${secondTopic} konusunda danışanların ve hastaların en sık sorduğu sorulara hap cevaplar.
  - Örnek bölüm başlıkları:
    * Bölüm 1: ${secondTopic} kullanırken nelere dikkat edilmeli?
    * Bölüm 2: Kimler ${secondTopic} konusunda ekstra hassas olmalı?
    * Bölüm 3: Günlük rutinde ${secondTopic} takibi nasıl yapılır?
  - Üretim akışı: Soru kutusundan gelen popüler soruları senaryolaştırıp çekme.
  - Risk/uyum notu: Tıbbi teşhis/tedavi yönlendirmesi yapılmamalı, "hekiminize ve eczacınıza danışın" ibaresi yer almalıdır.

- Seri 3: Bir Sağlık Profesyonelinin Gözünden Günlük Rutin
  - Format: Vlog / Lifestyle / Kamera Arkası Video
  - Yayın Kanalı: Instagram Reels & Hikâyeler
  - Detaylı İçerik Mantığı: Sağlık profesyonelinin kendi mesleki disiplinini ve sağlıklı yaşam alışkanlıklarını gösteren güven artırıcı seri.
  - Örnek bölüm başlıkları:
    * Bölüm 1: Yoğun mesai gününde enerjimi koruyan 3 alışkanlık
    * Bölüm 2: Sağlıklı bir gün için uyguladığım mesleki rutin
    * Bölüm 3: Sağlık profesyoneli olarak çantamda taşıdığım olmazsa olmazlar
  - Üretim akışı: Gün içi doğal anların 3-5 saniyelik B-roll çekimi ve seslendirme.
  - Risk/uyum notu: Hasta mahremiyeti ve KVKK kurallarına uyulmalı; hasta yüzü veya reçete kadraja girmemelidir.

## 4. ROL MODEL VE BENCHMARK ANALİZİ

- Referans Alınan Tarzların Değerlendirilmesi:
  [Dayanak: S17=${benchmarks}] Belirtilen referans içerik üreticileri (${benchmarks}), sağlık alanında profesyonellik ile samimiyeti harmanlayan örneklerdir. Bu hesapların kurgu ritmi ve kanca yapıları incelenmeli ancak asla doğrudan taklit edilmemelidir.
- Görsel ve İşitsel Estetik Yönlendirmeler:
  Doğal ışık veya softbox ışık kaynağı yüz hizasında konumlandırılmalı; yaka mikrofonu ile net ve parazitsiz ses kaydı alınmalıdır. Arka planda sade ve profesyonel bir ortam tercih edilmelidir.
- Kopyalamadan Modelleme:
  Benchmark hesapların içerik başlıkları değil; kurgu ritmi, altyazı tipografisi ve izleyiciyle kurdukları empati dili referans alınmalı, içerik özü tamamen katılımcının kendi mesleki deneyiminden beslenmelidir.

## 5. OPERASYONEL RİSKLER, MEVZUAT FARKINDALIĞI VE TÜKENMİŞLİK ANALİZİ

- Birincil Operasyonel Darboğaz:
  [Dayanak: S10=${bottleneck}] Katılımcının en çok zorlandığı "${bottleneck}" konusunu aşmak için; "İçerik Fikir Havuzu" oluşturulmalı, haftada 1 gün 1 saat sadece fikir ve senaryo yazımına ayrılmalıdır.
- TİTCK/KVKK ve Sağlık İletişimi Uyarıları:
  * TİTCK Mevzuatı: Ruhsatlı beşeri tıbbi ürünlerin (ilaçların) doğrudan veya dolaylı reklamı kesinlikle yasaktır. Marka ismi yerine jenerik etken madde kullanılmalıdır.
  * KVKK: Hasta fotoğrafları, tetkik sonuçları veya reçete detayları hiçbir koşulda açık paylaşılamaz.
  * Endikasyon Sınırı: Gıda takviyelerine hastalık tedavi edici veya önleyici tıbbi iddialar yüklenemez.
- Kriz Yönetimi Simülasyonu:
  [Dayanak: S13=${c.soru_13 || 'Sakin ve kanıta dayalı tutum'}] Haksız eleştiri veya linç girişimi durumunda: 1. Duygusal yanıt vermeme, 2. Bilimsel kaynak ve literatür referansı içeren sakin bir açıklama sabitleme, 3. Hakaret içeren yorumları delil olarak arşivleyip engelleme protokolü izlenmelidir.
- Tükenmişlik Önleme:
  [Dayanak: S14=Haftada ${weeklyCap} içerik] Haftalık ${weeklyCap} içerik hedefi için "Batch Production" (Toplu Çekim) modeli uygulanmalı; ayda 2 yarım gün ayrılarak 8-10 video tek seansta çekilmelidir.

## 6. 7 ADIMLI KAPSAMLI UYGULAMA VE GELİŞİM YOL HARİTASI

- Adım 1: [İlk 48 Saat: Biyografi ve Profil Optimizasyonu] Biyografiye net uzmanlık alanı, hedef kitleye vaat ve "${brandWords}" vizyonunu yansıtan tek cümlelik bio yazımı.
- Adım 2: [1. Hafta: Teknik Kurulum ve Işık/Ses Standardizasyonu] Yaka mikrofonu, tripod ve sabit çekim açısının belirlenerek test kayıtlarının tamamlanması.
- Adım 3: [1. Hafta: İlk 3 Senaryonun Yazılması] Seri 1 (${mainTopic}) için güçlü kancalara sahip 3 adet taslak senaryonun hazırlanması.
- Adım 4: [2. Hafta: Toplu Çekim Seansı] Hazırlanan 3 senaryonun tek oturumda çekilmesi ve otomatik altyazı aracıyla kurgulanması.
- Adım 5: [2. Hafta: TİTCK & KVKK Özdenetim Kontrolü] Hazırlanan videoların reklam, ürün yönlendirmesi veya hasta mahremiyeti riski taşımadığının teyit edilerek yayına alınması.
- Adım 6: [3. Hafta: Topluluk Yönetimi ve Soru-Cevap Kutusu] Gelen yorumların ilk 1 saat içinde uzmanlık diliyle yanıtlanması ve hikâyelerden yeni içerik sorularının toplanması.
- Adım 7: [4. Hafta: Aylık Metrik Değerlendirmesi ve Mentor Brifingi] En çok kaydedilen ve paylaşılan video formatının tespit edilerek 2. ay takviminin bu doğrultuda optimize edilmesi.

## 7. İLK 14 GÜN İÇİN MİNİ İÇERİK TAKVİMİ

- Gün 1: [Tanıtım / Konumlandırma] | Kanca: "${mainTopic} alanında doğru bilinen yanlışları bilimsel kanıtlarla konuşmaya başlıyoruz." | Format: 45 sn Reels | Amaç: Yeni profil vizyonunu deklare etme | Uyum Notu: İlaçsız / Tıbbi iddiasız
- Gün 2: [Topluluk Etkileşimi] | Kanca: "—" | Format: Story Soru Kutusu | Amaç: "${mainTopic} konusunda en çok merak ettiğiniz konu hangisi?" sorusuyla içerik havuzu besleme | Uyum Notu: Reçete yönlendirmesi yapmama
- Gün 3: [Seri 1 - Bölüm 1] | Kanca: "${mainTopic} kullanırken yapılan en yaygın hata nedir?" | Format: 30 sn Video | Amaç: Bilgi otoritesi kurma | Uyum Notu: Etken madde odaklı
- Gün 4: [Story Bilgi Hapı] | Kanca: "Günün sağlık notu:" | Format: 3 Slide Story | Amaç: Günlük temas sağlama | Uyum Notu: Genel koruyucu öneri
- Gün 5: [Seri 2 - Bölüm 1] | Kanca: "${secondTopic} hakkında danışanlarımın en sık sorduğu soru:" | Format: 45 sn Video | Amaç: Fayda ve pratik çözüm | Uyum Notu: "Eczacınıza ve hekiminize danışın" uyarısı
- Gün 6: [Kamera Arkası / Samimiyet] | Kanca: "Mesai biterken küçük bir kare:" | Format: Story Fotoğraf/Kısa Video | Amaç: Samimiyet ve güven inşası | Uyum Notu: Hasta yüzü ve reçete kadraja girmemeli
- Gün 7: [Haftalık Analiz] | Kanca: "—" | Format: Metrik Kontrolü | Amaç: En çok izlenen videonun kancasını analiz etme | Uyum Notu: —
- Gün 8: [Seri 3 - Bölüm 1] | Kanca: "Yoğun bir mesai gününde enerjimi korumamı sağlayan 3 alışkanlık:" | Format: 30 sn Vlog | Amaç: Lifestyle & Sağlık Liderliği | Uyum Notu: Ürün yerleştirme içermez
- Gün 9: [Story Eğitici Anket] | Kanca: "${mainTopic} konusunda bu iki bilgiden hangisi doğru?" | Format: Story İnteraktif Anket | Amaç: Algoritma etkileşimi artırma | Uyum Notu: Endikasyon belirtmeme
- Gün 10: [Seri 1 - Bölüm 2] | Kanca: "${mainTopic} takviyelerinde dikkat edilmesi gereken 3 kritik nokta:" | Format: 35 sn Video | Amaç: Kaydedilme ve paylaşım alma | Uyum Notu: Markasız bilimsel açıklama
- Gün 11: [Yorum Yanıtlama] | Kanca: "Gelen en popüler soruyu birlikte yanıtlayalım:" | Format: Story Video | Amaç: Güven bağı pekiştirme | Uyum Notu: Hasta özelinde teşhis koymama
- Gün 12: [Seri 2 - Bölüm 2] | Kanca: "${secondTopic} hakkında bilmeniz gereken mevsimsel ipuçları:" | Format: 40 sn Video | Amaç: Farkındalık | Uyum Notu: Mevzuata uygunluk
- Gün 13: [Carousel Bilgi Kartı] | Kanca: "${mainTopic} ve ${secondTopic} hakkında bilinmesi gereken 4 gerçek:" | Format: 5 Slide Carousel Görsel | Amaç: Yüksek kaydetme oranı | Uyum Notu: Genel bilgilendirme
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

    const body = await req.json().catch(() => ({}))
    const { cevaplar, katilimci_id: targetKatilimciId, test_mode: isTestMode } = body

    const isServiceRole = authHeader === `Bearer ${serviceRoleKey}` || req.headers.get('apikey') === serviceRoleKey

    let user: any = null
    let profile: any = null

    if (isServiceRole) {
      user = { id: '00000000-0000-0000-0000-000000000000', email: 'admin@system.local' }
      profile = { id: '00000000-0000-0000-0000-000000000000', role: 'admin' }
    } else {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      })

      const { data: userData, error: userError } = await userClient.auth.getUser()
      if (userError || !userData?.user) {
        if (!isTestMode) {
          return jsonRes(req, { ok: false, error: 'Oturum doğrulanamadı.' }, 401)
        }
      } else {
        user = userData.user
        const { data: profData } = await userClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        profile = profData
      }
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    let katilimciId = profile?.core_katilimci_id || null
    if ((profile?.role === 'admin' || isServiceRole) && targetKatilimciId) {
      katilimciId = targetKatilimciId
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Self-Healing Participant Resolver:
    // ─────────────────────────────────────────────────────────────────────────
    if (!katilimciId) {
      const userEmail = (user.email || profile?.email || '').trim().toLowerCase()
      if (userEmail) {
        const { data: aday } = await adminClient
          .from('core_aday')
          .select('id, basvuru_durumu')
          .ilike('eposta', userEmail)
          .eq('basvuru_durumu', 'ONAYLANDI')
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (aday?.id) {
          const { data: k } = await adminClient
            .from('core_katilimci')
            .select('id')
            .eq('aday_id', aday.id)
            .maybeSingle()

          if (k?.id) {
            katilimciId = k.id

            await adminClient
              .from('profiles')
              .upsert({
                id: user.id,
                email: userEmail,
                role: 'katilimci',
                core_katilimci_id: k.id,
                updated_at: new Date().toISOString()
              }, { onConflict: 'id' })
          }
        }
      }
    }

    if (katilimciId) {
      const { data: existingPerf } = await adminClient
        .from('core_katilimciperformans')
        .select('id')
        .eq('katilimci_id', katilimciId)
        .maybeSingle()

      if (!existingPerf) {
        await adminClient
          .from('core_katilimciperformans')
          .insert({
            katilimci_id: katilimciId,
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

    if (!katilimciId && !isTestMode) {
      return jsonRes(req, {
        ok: false,
        error: 'Katılımcı kaydınız eşleştirilemedi. Lütfen destek ekibiyle iletişime geçin.'
      }, 400)
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    let raporMetni = ""
    let aiModel = geminiKey ? "Gemini 2.5 Flash" : "Stratejik Kişiselleştirilmiş Analiz"
    const promptVersiyonu = "v2.5"

    const participantName = profile?.ad_soyad || user.user_metadata?.ad_soyad || 'Katılımcı'
    const formattedAnswers = formatAnswersForPrompt(cevaplar, participantName)

    if (geminiKey) {
      try {
        const systemPrompt = `Sen, sağlık profesyonelleri (eczacı, hekim, diyetisyen, fizyoterapist, diş hekimi ve diğer sağlık uzmanları) için dijital içerik stratejileri, kişisel marka konumlandırma, sağlık iletişimi, regülasyon farkındalığı, KVKK hassasiyeti ve operasyonel risk yönetimi alanında uzmanlaşmış kıdemli bir "İçerik Stratejisi ve Dijital DNA Analiz Uzmanı"sın.

RAPORUN AMACI:
Katılımcının 20 soruluk "İçerik Üretici DNA Envanteri" cevaplarını birbiriyle çapraz analiz ederek kişiye özel, somut, uygulanabilir, gerçekçi ve profesyonel bir "Kişiselleştirilmiş İçerik ve Operasyonel DNA Raporu" üretmektir.

ÖNEMLİ KİŞİSELLEŞTİRME VE KANIT DAYANAĞI KURALI:
1. Ürettiğin rapordaki tüm arketip tanımları, 3 içerik serisi, hook/CTA örnekleri, operasyonel çözümler, yol haritası ve takvim maddeleri doğrudan katılımcının 20 soruluk yanıtlarına (S1-S20) dayanmalıdır.
2. Katılımcının belirtmediği bir uzmanlığı veya alakasız bir konuyu ASLA uydurma.
3. Örneğin: Katılımcı "Dermakozmetik" ve "Vitaminler" seçmişse içerik serileri bu alanlara odaklanmalıdır. Katılımcı "Kamera karşısında çok zorlanıyorum (1/5)" ve "Metin/Görsel odaklı" demişse ona "Hemen kameraya geç konuş" deme; önce B-roll, seslendirme, carousel ve kademeli kamera alışma adımları öner.
4. Her ana bölümün girişinde veya alt başlıklarında katılımcının verdiği yanıtları referans göster (Örn: '[Cevap Referansı - S2: Dermakozmetik, S4: Bilimsel/Sade, S9: 2/5]').
5. Skor kartındaki yüzde değerlerini katılımcının yanıtlarına göre dinamik ve gerçekçi olarak puanla (Sabit/şablon puanlar üretme).

KESİN KURALLAR & SINIRLAR:
1. Aşırı soyut, edebi, gerçekçi olmayan veya hayal gücüne dayalı yorumlar YASAKTIR.
2. "Düzenli paylaşım yap", "iyi kamera kullan", "samimi ol" gibi genel ve ucuz tavsiyeler YASAKTIR.
3. Tavsiyeler somut, ölçülebilir ve uygulanabilir olmalıdır (Örn: "Haftada 2 kez, ilk 3 saniyesinde 'hata bildirimi' kancası içeren 30 saniyelik mit çürütme videosu üret.").
4. Tıbbi teşhis, tedavi, ilaç önerisi, reçete yönlendirmesi veya hasta özelinde tıbbi tavsiye KESİNLİKLE VERİLMEMELİDİR.
5. Rapor, TİTCK (Türkiye İlaç ve Tıbbi Cihaz Kurumu), Sağlık Bakanlığı Sağlık İletişimi Kılavuzları ve KVKK regülasyonları ile etik sağlık iletişimi ilkelerine tam uyum farkındalığı üretmelidir.
6. Her bölüm gerekçeli, adım adım uygulanabilir ve kıdemli danışmanlık tonunda olmalıdır.
7. 4-5 sayfa derinliğinde, analitik, doyurucu ve yapılandırılmış olmalıdır.

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
  [Katılımcının S16 ve S4 verisine göre net arketip tespiti, alt dinamikleri ve gerekçesi]
- Stratejik Hedef ve Motivasyon Analizi:
  [Kişinin S1 içerik üretme amacı ile S2 seçtiği nişin rasyonel uyumu ve mesleki kaldıraç etkisi]
- Mevcut Algı vs. Hedef Algı:
  [Kişinin S18 mevcut algısı ile S19 hedef algısı ve S20 vizyonu arasındaki köprü stratejisi]

## 2. İLETİŞİM DİLİ, TON VE FORMAT REÇETESİ

- Konuşma Temposu ve Hitabet Modeli:
  [S6 konuşma temposu ve S9 kamera rahatlığına göre somut diksiyon, beden dili ve sunum yönergeleri]
- İdeal Video Süresi ve Format Mimarisi:
  [S5 seçilen video süresi ve S3 format üzerinden kurgu dinamizmi, B-roll kullanımı ve dikkat tutma mimarisi]
- Kanca ve CTA Mühendisliği:
  Katılımcının S2 nişine ve hedef kitlesine özel somut örnekler:
  - Kanca 1 (Merak/Soru Odaklı): "[Somut kanca metni]"
  - Kanca 2 (Mit/Hata Çürütme Odaklı): "[Somut kanca metni]"
  - Kanca 3 (Hikâye/Problem Odaklı): "[Somut kanca metni]"
  - CTA 1 (Yorum/Tartışma Odaklı): "[Somut CTA metni]"
  - CTA 2 (Kaydetme/Referans Odaklı): "[Somut CTA metni]"
  - CTA 3 (Farkındalık/Topluluk Odaklı): "[Somut CTA metni]"

## 3. KİŞİSELLEŞTİRİLMİŞ İÇERİK SERİLERİ VE ÜRETİM MATRİSİ

Sürdürülebilir, katılımcının S2 nişine ve S3 formatına tam uygun 3 spesifik içerik serisi:

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
  [Kişinin belirttiği S17 benchmark hesaplar ile S16 arketip tercihleri arasındaki stratejik çıkarımlar]
- Görsel ve İşitsel Estetik Yönlendirmeler:
  [Stüdyo düzeni, ışıklandırma, mikrofon/ses, kadraj kompozisyonu ve renk paleti standartları]
- Kopyalamadan Modelleme:
  [Benchmark içeriklerin taklit edilmeden, kendi mesleki özgünlüğüyle nasıl sentezleneceği]

## 5. OPERASYONEL RİSKLER, MEVZUAT FARKINDALIĞI VE TÜKENMİŞLİK ANALİZİ

- Birincil Operasyonel Darboğaz:
  [Katılımcının S10 en çok zorlandığı alan için kök neden analizi ve adım adım çözüm protokolü]
- TİTCK/KVKK ve Sağlık İletişimi Uyarıları:
  [S2 seçilen konular bazında reklam yasağı, endikasyon belirtme, ürün yönlendirmesi ve hasta mahremiyeti sınırları]
- Kriz Yönetimi Simülasyonu:
  [S13 kriz tepkisine göre uygulanacak 4 adımlı sakin ve kanıta dayalı kriz protokolü]
- Tükenmişlik Önleme:
  [S14 haftalık kapasitesine göre batch-production ve sürdürülebilirlik taktiği]

## 6. 7 ADIMLI KAPSAMLI UYGULAMA VE GELİŞİM YOL HARİTASI

Katılımcının hemen bugün uygulamaya başlayacağı 7 stratejik aksiyon adımı:

- Adım 1: [İlk 48 Saat Aksiyonu]
- Adım 2: [1. Hafta Aksiyonu]
- Adım 3: [1. Hafta Aksiyonu]
- Adım 4: [2. Hafta Aksiyonu]
- Adım 5: [2. Hafta Aksiyonu]
- Adım 6: [3. Hafta Aksiyonu]
- Adım 7: [4. Hafta Aksiyonu]

## 7. İLK 14 GÜN İÇİN MİNİ İÇERİK TAKVİMİ

14 günlük uygulanabilir mini yayın planı (Katılımcının S2 konuları ve S3 formatına göre):

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

        const models = ['gemini-2.5-flash', 'gemini-1.5-flash']
        for (const modelName of models) {
          try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: {
                  temperature: 0.45,
                  maxOutputTokens: 8192,
                  topP: 0.95
                }
              })
            })

            if (geminiRes.ok) {
              const gData = await geminiRes.json()
              const candidateText = gData.candidates?.[0]?.content?.parts?.[0]?.text
              if (candidateText && candidateText.trim().length > 300) {
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
      raporMetni = generateStructuredFallbackReport(cevaplar, participantName)
      aiModel = "Stratejik Kişiselleştirilmiş Analiz"
    }

    const scorecard = extractScorecardFromText(raporMetni, cevaplar)
    const detectedArchetype = String(cevaplar?.soru_16 || 'Sağlık İletişim Lideri')
    const primaryTopic = Array.isArray(cevaplar?.soru_2) ? cevaplar.soru_2[0] : (cevaplar?.soru_2 || 'Sağlık')

    const raporJson = {
      cevaplar,
      rapor_metni: raporMetni,
      scorecard,
      archetype: detectedArchetype,
      summary: `${detectedArchetype} arketipi ve ${primaryTopic} odağında hazırlanan 20 soruluk stratejik DNA analiz raporu.`,
      prompt_version: promptVersiyonu
    }

    if (isTestMode) {
      return jsonRes(req, {
        ok: true,
        data: {
          test_mode: true,
          scorecard,
          archetype: detectedArchetype,
          rapor_metni: raporMetni,
          ai_model: aiModel,
          prompt_version: promptVersiyonu
        }
      })
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
