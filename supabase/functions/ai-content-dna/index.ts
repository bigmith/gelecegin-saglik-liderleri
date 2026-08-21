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
  const krizSkoru = Math.min(96, Math.max(60, crisis.includes('Bilimsel') || crisis.includes('kaynak') ? 92 : crisis.includes('Sakin') || crisis.includes('esprili') ? 84 : 72))

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

export function validateReportStructure(reportText: string) {
  if (!reportText || typeof reportText !== 'string' || reportText.trim().length < 100) {
    return {
      isValid: false,
      isRoadmapValid: false,
      isCalendarValid: false,
      stepCount: 0,
      dayCount: 0,
      stepsFound: [] as number[],
      daysFound: [] as number[],
      errors: ['Rapor metni boş veya çok kısa']
    }
  }

  const cleanText = reportText.replace(/\r\n/g, '\n').trim()
  const sections = cleanText.split(/^##?\s+/m).filter(Boolean)

  let sec6Body = ''
  let sec7Body = ''

  for (const sec of sections) {
    const firstNewline = sec.indexOf('\n')
    const title = (firstNewline === -1 ? sec : sec.substring(0, firstNewline)).trim().toUpperCase()
    const body = (firstNewline === -1 ? '' : sec.substring(firstNewline + 1)).trim()

    if (title.includes('6.') || title.includes('YOL HARİTASI') || title.includes('YOL HARITASI') || title.includes('ADIM')) {
      sec6Body = body
    }
    if (title.includes('7.') || title.includes('14 GÜN') || title.includes('14 GUN') || title.includes('TAKVİM') || title.includes('TAKVIM')) {
      sec7Body = body
    }
  }

  const errors: string[] = []

  // 1. Roadmap Analysis (Section 6)
  const roadmapLines = (sec6Body || '').split('\n').map(l => l.trim()).filter(Boolean)
  const stepsFound: number[] = []
  for (const l of roadmapLines) {
    const match = l.match(/(?:^|[\-\*•\d\.\)]\s*)Ad[ıi]m\s*(\d+)/i)
    if (match && match[1]) {
      stepsFound.push(parseInt(match[1], 10))
    }
  }

  const stepCount = stepsFound.length
  const hasAllSteps1to7 = [1, 2, 3, 4, 5, 6, 7].every(n => stepsFound.includes(n))
  const hasExtraSteps = stepsFound.some(n => n > 7) || stepCount > 7
  const hasDuplicateSteps = new Set(stepsFound).size !== stepsFound.length
  const isRoadmapValid = stepCount === 7 && hasAllSteps1to7 && !hasExtraSteps && !hasDuplicateSteps

  if (!isRoadmapValid) {
    errors.push(`Bölüm 6 (Yol Haritası) geçersiz: ${stepCount} adım bulundu. Beklenen: tam 7 adım (Adım 1-7).`)
  }

  // 2. Calendar Analysis (Section 7)
  const calendarLines = (sec7Body || '').split('\n').map(l => l.trim()).filter(Boolean)
  const daysFound: number[] = []
  for (const l of calendarLines) {
    const match = l.match(/(?:^|[\-\*•\d\.\)]\s*)G[üu]n\s*(\d+)/i)
    if (match && match[1]) {
      daysFound.push(parseInt(match[1], 10))
    }
  }

  const dayCount = daysFound.length
  const hasAllDays1to14 = Array.from({ length: 14 }, (_, i) => i + 1).every(n => daysFound.includes(n))
  const hasExtraDays = daysFound.some(n => n > 14) || dayCount > 14
  const hasDuplicateDays = new Set(daysFound).size !== daysFound.length
  const isCalendarValid = dayCount === 14 && hasAllDays1to14 && !hasExtraDays && !hasDuplicateDays

  if (!isCalendarValid) {
    errors.push(`Bölüm 7 (Mini Takvim) geçersiz: ${dayCount} gün bulundu. Beklenen: tam 14 gün (Gün 1-14).`)
  }

  return {
    isValid: isRoadmapValid && isCalendarValid,
    isRoadmapValid,
    isCalendarValid,
    stepCount,
    dayCount,
    stepsFound,
    daysFound,
    errors
  }
}

export function repairRoadmap7(cevaplar: Record<string, any>, _profileName?: string): string {
  const c = cevaplar || {}
  const rawTopicsList = Array.isArray(c.soru_2) ? c.soru_2 : (c.soru_2 ? [String(c.soru_2)] : ['Sağlık'])
  const mainTopic = rawTopicsList[0] || 'Sağlık İletişimi'
  const formatChoice = String(c.soru_3 || 'Kısa Video')
  const targetWords = String(c.soru_19 || 'Danışılan, Pratik, Yol Gösterici')
  const vision = String(c.soru_20 || 'Doğru sağlık bilgisinin dijital referans adresi.')

  return `## 6. 7 ADIMLI KAPSAMLI UYGULAMA VE GELİŞİM YOL HARİTASI

- Adım 1: [İlk 48 Saat: Biyografi ve Konumlandırma] Profil biyografisine "${targetWords}" algısını destekleyen ve "${vision}" vaadini öne çıkaran net bir açıklama yerleştirilmesi.
- Adım 2: [1. Hafta: Teknik Hazırlık] ${formatChoice} için ses, ışık ve kadraj düzeninin test edilerek standart çekim açısının sabitlenmesi.
- Adım 3: [1. Hafta: İlk Senaryo Taslakları] Seri 1 (${mainTopic}) için 3 adet taslak kurgulanması.
- Adım 4: [2. Hafta: Toplu Çekim Seansı] Hazırlanan taslakların tek seansta çekilmesi ve altyazılandırılması.
- Adım 5: [2. Hafta: Mevzuat ve Etik Kontrol] Yayın öncesinde TİTCK ve KVKK kurallarına uygunluğun teyit edilmesi.
- Adım 6: [3. Hafta: Topluluk Etkileşimi] Gelen geri bildirimlerin mesleki dille yanıtlanması ve yeni soruların toplanması.
- Adım 7: [4. Hafta: Stratejik Değerlendirme] İzlenme ve etkileşim metriklerinin analiz edilerek 2. ay içerik planının güncellenmesi.`
}

export function repairMiniCalendar14(cevaplar: Record<string, any>, _profileName?: string): string {
  const c = cevaplar || {}
  const rawTopicsList = Array.isArray(c.soru_2) ? c.soru_2 : (c.soru_2 ? [String(c.soru_2)] : ['Sağlık'])
  const mainTopic = rawTopicsList[0] || 'Sağlık İletişimi'
  const secondTopic = rawTopicsList[1] || rawTopicsList[0] || 'Koruyucu Sağlık'
  const formatChoice = String(c.soru_3 || 'Kısa Video')
  const duration = String(c.soru_5 || '30-45 saniye')
  const hookPref = String(c.soru_7 || 'Sonucu en başta söyleyerek')

  let dynamicHook1 = `"${mainTopic} alanında klinikte en sık karşılaştığım bu kritik tabloyu doğrudan açıklıyorum:"`
  let dynamicHook2 = `"${secondTopic} konusunda doğru bildiğiniz bu yöntemin aslında sağlığınıza maliyeti ne olabilir?"`
  let dynamicHook3 = `"${mainTopic} ve ${secondTopic} hakkında uzman tavsiyesi almadan önce şu temel gerçeği mutlaka bilmelisiniz:"`

  if (hookPref.toLowerCase().includes('sonuc') || hookPref.toLowerCase().includes('başta')) {
    dynamicHook1 = `"${mainTopic} takviyesi alırken bu hatayı yapıyorsanız paranızı ve sağlığınızı çöpe atıyorsunuz:"`
    dynamicHook2 = `"${secondTopic} için aradığınız en net çözüm aslında şu basit adımda gizli:"`
    dynamicHook3 = `"${mainTopic} kullanımında sonucu değiştiren ilk kuralı baştan söylüyorum:"`
  } else if (hookPref.toLowerCase().includes('soru') || hookPref.toLowerCase().includes('merak')) {
    dynamicHook1 = `"Kullandığınız ${mainTopic} ürününün gerçekten işe yarayıp yaramadığını nasıl anlarsınız?"`
    dynamicHook2 = `"${secondTopic} hakkında danışanlarımın en çok yanıldığı bu sorunun cevabı sizce ne?"`
    dynamicHook3 = `"Hekim veya eczacınıza gitmeden önce ${mainTopic} hakkında kendinize sormanız gereken ilk soru:"`
  }

  return `## 7. İLK 14 GÜN İÇİN MİNİ İÇERİK TAKVİMİ

- Gün 1: [Konumlandırma / Vizyon] | Kanca: "${dynamicHook1}" | Format: ${duration} ${formatChoice} | Amaç: Yeni profil odağını duyurma | Uyum Notu: İlaçsız ve tarafsız dil
- Gün 2: [Soru Kutusu] | Kanca: "—" | Format: Story Etkileşimi | Amaç: "${mainTopic} konusunda en çok merak edilenleri toplama" | Uyum Notu: Reçetesiz bilgilendirme
- Gün 3: [Seri 1 - Bölüm 1] | Kanca: "${dynamicHook2}" | Format: ${formatChoice} | Amaç: ${mainTopic} konusunda bilgi otoritesi kurma | Uyum Notu: Etken madde odaklı
- Gün 4: [Bilgi Kartı] | Kanca: "Günün sağlık notu:" | Format: Görsel / Story | Amaç: Koruyucu sağlık temasını pekiştirme | Uyum Notu: Genel bilgilendirme
- Gün 5: [Seri 2 - Bölüm 1] | Kanca: "${dynamicHook3}" | Format: ${formatChoice} | Amaç: ${secondTopic} ile ilgili pratik danışmanlık sağlama | Uyum Notu: "Uzmanınıza danışın" ibaresi
- Gün 6: [Kamera Arkası / Samimiyet] | Kanca: "Mesai rutininden kısa bir kesit:" | Format: Story Kısa Video | Amaç: Güven ve samimiyet inşası | Uyum Notu: Hasta mahremiyeti
- Gün 7: [Haftalık Değerlendirme] | Kanca: "—" | Format: Metrik Analizi | Amaç: İlk haftanın performansını gözden geçirme | Uyum Notu: —
- Gün 8: [Seri 3 - Bölüm 1] | Kanca: "Sağlıklı bir gün için benimsediğim 3 mesleki alışkanlık:" | Format: Vlog ${formatChoice} | Amaç: Yaşam tarzı liderliği | Uyum Notu: Ürün yerleştirmesiz
- Gün 9: [İnteraktif Anket] | Kanca: "${mainTopic} hakkında bu iki bilgiden hangisi doğru?" | Format: Story Anket | Amaç: İzleyici katılımını artırma | Uyum Notu: Reklamsız
- Gün 10: [Seri 1 - Bölüm 2] | Kanca: "${mainTopic} sürecinde dikkat edilmesi gereken önemli noktalar:" | Format: ${formatChoice} | Amaç: Değer sunumu ve farkındalık | Uyum Notu: TİTCK uyumlu
- Gün 11: [Yorum Yanıtlama] | Kanca: "Gelen popüler bir soruyu birlikte yanıtlayalım:" | Format: Story Video | Amaç: Danışan bağı güçlendirme | Uyum Notu: Teşhis koymama
- Gün 12: [Seri 2 - Bölüm 2] | Kanca: "${secondTopic} hakkında bilmeniz gereken mevsimsel ipuçları:" | Format: ${formatChoice} | Amaç: Çözüm odaklı yaklaşım | Uyum Notu: Mevzuata uygunluk
- Gün 13: [Carousel Bilgi Seti] | Kanca: "${mainTopic} ve ${secondTopic} konusunda bilinmesi gereken 3 temel ilke:" | Format: Carousel Görsel | Amaç: Kaydedilme ve paylaşım | Uyum Notu: Genel bilgilendirme
- Gün 14: [Mentor Brifingi] | Kanca: "14 günlük maratonun özeti ve gelecek adımlar:" | Format: Story & Kapanış | Amaç: Bir sonraki döneme hazırlık | Uyum Notu: —`
}

export function repairReportStructureIfNeeded(reportText: string, cevaplar: Record<string, any>, profileName?: string): string {
  const val = validateReportStructure(reportText)
  if (val.isValid) return reportText

  let repaired = reportText.replace(/\r\n/g, '\n').trim()

  // If roadmap is invalid, replace or append Section 6
  if (!val.isRoadmapValid) {
    const r6 = repairRoadmap7(cevaplar, profileName)
    const sec6Regex = /##\s*6\.\s*[^\n]*[\s\S]*?(?=(?:##\s*7\.|$))/i
    if (sec6Regex.test(repaired)) {
      repaired = repaired.replace(sec6Regex, r6 + '\n\n')
    } else {
      const sec7Index = repaired.search(/##\s*7\./i)
      if (sec7Index !== -1) {
        repaired = repaired.substring(0, sec7Index) + r6 + '\n\n' + repaired.substring(sec7Index)
      } else {
        repaired = repaired + '\n\n' + r6
      }
    }
  }

  // If calendar is invalid, replace or append Section 7
  if (!val.isCalendarValid) {
    const r7 = repairMiniCalendar14(cevaplar, profileName)
    const sec7Regex = /##\s*7\.\s*[^\n]*[\s\S]*$/i
    if (sec7Regex.test(repaired)) {
      repaired = repaired.replace(sec7Regex, r7)
    } else {
      repaired = repaired + '\n\n' + r7
    }
  }

  return repaired.trim()
}

function generateStructuredFallbackReport(cevaplar: Record<string, any>, profileName?: string): string {
  const c = cevaplar || {}
  const rawTopicsList = Array.isArray(c.soru_2) ? c.soru_2 : (c.soru_2 ? [String(c.soru_2)] : ['Sağlık'])
  const rawTopics = rawTopicsList.join(', ')
  const mainTopic = rawTopicsList[0] || 'Sağlık İletişimi'
  const secondTopic = rawTopicsList[1] || rawTopicsList[0] || 'Koruyucu Sağlık'
  const thirdTopic = rawTopicsList[2] || rawTopicsList[0] || 'Günlük Yaşam'

  const tone = String(c.soru_4 || 'Eğitici ve Açıklayıcı')
  const duration = String(c.soru_5 || '30-45 saniye')
  const tempo = String(c.soru_6 || 'Dinamik ve akıcı')
  const primaryGoal = Array.isArray(c.soru_1) ? c.soru_1.join(', ') : String(c.soru_1 || 'Mesleki uzmanlığı doğru aktarmak')
  const formatChoice = String(c.soru_3 || 'Kısa Video')
  const hookPref = String(c.soru_7 || 'Sonucu en başta söyleyerek')
  const ctaPref = String(c.soru_8 || 'Kaydetme ve referans alma')
  const cameraScore = Number(c.soru_9) || 3
  const bottleneck = String(c.soru_10 || 'Zaman yönetimi ve senaryo hazırlığı')
  const narration = String(c.soru_11 || 'Kanıtlara dayalı anlatıcı')
  const motivation = String(c.soru_12 || 'Fayda sağlamak ve güven inşa etmek')
  const crisis = String(c.soru_13 || 'Sakin ve kanıta dayalı tutum')
  const weeklyCap = String(c.soru_14 || '2')
  const archetypeChoice = String(c.soru_16 || 'Klinik ve Akademik Tarz')
  const benchmarks = String(c.soru_17 || 'Kanıta dayalı sağlık profesyonelleri')
  const brandWords = String(c.soru_18 || 'Güvenilir, Yetkin, Bilimsel')
  const targetWords = String(c.soru_19 || 'Danışılan, Pratik, Yol Gösterici')
  const vision = String(c.soru_20 || 'Doğru sağlık bilgisinin dijital referans adresi.')
  const scores = computeDynamicScorecardFromAnswers(cevaplar)

  const isLowCamera = cameraScore <= 2
  const isHighCamera = cameraScore >= 4

  const cameraAdvice = isLowCamera
    ? `Kamera karşısında zorlanma düzeyi (${cameraScore}/5) ve ${formatChoice} tercihi nedeniyle; başlangıçta yüzü doğrudan uzun süre kadrajda tutmak yerine, B-roll görüntüleri üzerine seslendirme (voiceover) ve infografik kart geçişleriyle güvenli bir ısınma evresi planlanmalıdır.`
    : isHighCamera
    ? `Kamera özgüven seviyesi (${cameraScore}/5) oldukça yüksek olduğu için doğrudan izleyiciyle göz teması kurulan, ${tempo} tempolu ve dinamik jest/mimik içeren konuşan kafa (talking head) formatı birincil kaldıraç olacaktır.`
    : `Kamera rahatlığı (${cameraScore}/5) dengeli bir seviyededir; prompter desteği veya kısa 15 saniyelik parçalı çekimler ile akıcı ${tempo} bir ritim kolayca yakalanabilir.`

  // Dynamic Hooks based on S7 & S2
  let dynamicHook1 = `"${mainTopic} alanında klinikte en sık karşılaştığım bu kritik tabloyu doğrudan açıklıyorum:"`
  let dynamicHook2 = `"${secondTopic} konusunda doğru bildiğiniz bu yöntemin aslında sağlığınıza maliyeti ne olabilir?"`
  let dynamicHook3 = `"${thirdTopic} hakkında uzman tavsiyesi almadan önce şu temel gerçeği mutlaka bilmelisiniz:"`

  if (hookPref.toLowerCase().includes('sonuc') || hookPref.toLowerCase().includes('başta')) {
    dynamicHook1 = `"${mainTopic} takviyesi alırken bu hatayı yapıyorsanız paranızı ve sağlığınızı çöpe atıyorsunuz:"`
    dynamicHook2 = `"${secondTopic} için aradığınız en net çözüm aslında şu basit adımda gizli:"`
    dynamicHook3 = `"${thirdTopic} kullanımında sonucu değiştiren ilk kuralı baştan söylüyorum:"`
  } else if (hookPref.toLowerCase().includes('soru') || hookPref.toLowerCase().includes('merak')) {
    dynamicHook1 = `"Kullandığınız ${mainTopic} ürününün gerçekten işe yarayıp yaramadığını nasıl anlarsınız?"`
    dynamicHook2 = `"${secondTopic} hakkında danışanlarımın en çok yanıldığı bu sorunun cevabı sizce ne?"`
    dynamicHook3 = `"Hekim veya eczacınıza gitmeden önce ${thirdTopic} hakkında kendinize sormanız gereken ilk soru:"`
  }

  // Dynamic CTAs based on S8
  let dynamicCta1 = `"Bu klinik notu, ${mainTopic} konusunda bir dahaki sefere doğru adımı atmak için profilinizde saklayın."`
  let dynamicCta2 = `"${secondTopic} alanındaki kendi deneyiminizi veya aklınıza takılan spesifik soruyu aşağıya iletin, yanıtlayalım."`
  let dynamicCta3 = `"Ailenizde veya çevrenizde ${thirdTopic} ile ilgilenen biri varsa, doğru bilgiyi ulaştırmak için bu analizi iletebilirsiniz."`

  if (ctaPref.toLowerCase().includes('kaydet') || vision.toLowerCase().includes('kaydet')) {
    dynamicCta1 = `"${vision.length > 5 ? vision : 'Gerektiğinde danışabileceğiniz bu hap bilgiyi'} unutmamak için şimdiden arşivinize ekleyin."`
    dynamicCta2 = `"${mainTopic} rehberini bir sonraki eczane ziyaretinizde referans almak üzere kaydedebilirsiniz."`
    dynamicCta3 = `"${secondTopic} kontrol listenizi hazırlarken bu içeriği temel başvuru kaynağı olarak saklayın."`
  } else if (ctaPref.toLowerCase().includes('yorum') || ctaPref.toLowerCase().includes('soru')) {
    dynamicCta1 = `"${mainTopic} kullanırken yaşadığınız en büyük tereddüt neydi? Yorumlarda buluşup konuşalım."`
    dynamicCta2 = `"${secondTopic} hakkında bir sonraki videoda hangi konuyu ele almamı istersiniz? Fikirlerinizi yazın."`
    dynamicCta3 = `"Bu konuda sizin gözleminiz nedir? Deneyimlerinizi paylaşarak topluluğa katkı sağlayın."`
  }

  const s6 = repairRoadmap7(cevaplar, profileName)
  const s7 = repairMiniCalendar14(cevaplar, profileName)

  return `## İÇERİK DNA VE OPERASYONEL SKOR KARTI

- Arketip Eşleşmesi: %${scores.arketip_eslesmesi}  
  Seçilen odak alanları (${rawTopics}) ile hedeflenen iletişim dili (${tone}) arasındaki pazar uyumu ve uzmanlık örtüşmesi.
- Marka Tutarlılığı: %${scores.marka_tutarliligi}  
  Mevcut marka algısı (${brandWords}) ile hedef kitlede uyandırılmak istenen intiba (${targetWords}) arasındaki rasyonel gap analizi.
- Kamera ve Prodüksiyon Hazırlığı: %${scores.kamera_prod_hazirligi}  
  Kamera karşısındaki özgüven seviyesi (${cameraScore}/5) ile planlanan format mimarisinin (${formatChoice}) prodüksiyon sürdürülebilirliği.
- İçerik Üretim Kapasitesi: %${scores.icerik_kapasitesi}  
  Haftalık planlanan ${weeklyCap} içerik hedefi ile birincil operasyonel darboğazın (${bottleneck}) dengeli iş yükü yönetimi.
- Kriz Yönetimi Dayanıklılığı: %${scores.kriz_dayanikliligi}  
  Sosyal medyadaki olası eleştirilere karşı belirlenen refleks (${crisis}) ve mevzuat/etik olgunluk skoru.

## 1. STRATEJİK PAZAR KONUMLANDIRMASI VE ARKETİP ANALİZİ

- Ana Profil Tespiti:
  Katılımcı, analiz sonuçlarına göre ağırlıklı olarak "${archetypeChoice.split(':')[0]}" profilinde konumlanmaktadır. İletişim dilindeki "${tone}" yaklaşımı, mesleki otoriteyi samimi ve anlaşılır bir çerçevede sunmaktadır.
- Stratejik Hedef ve Motivasyon Analizi:
  İçerik üretme hedefinin "${primaryGoal}" ekseninde olması ve "${motivation}" motivasyonundan beslenmesi, güvenilir bir dijital marka inşası için sağlam bir zemin oluşturmaktadır.
- Mevcut Algı vs. Hedef Algı:
  Katılımcının bugün sahip olduğu "${brandWords}" intibasını, hedeflediği "${targetWords}" algısına taşıyabilmesi için "${narration}" anlatım tarzını benimsemesi gerekmektedir.

## 2. İLETİŞİM DİLİ, TON VE FORMAT REÇETESİ

- Konuşma Temposu ve Hitabet Modeli:
  ${cameraAdvice}
- İdeal Video Süresi ve Format Mimarisi:
  Planlanan ideal süre ${duration} aralığıdır. ${formatChoice} yapısına uygun olarak ilk 3 saniyede kanca, gövdede çözüm odaklı bilgi ve sonda net yönlendirme uygulanmalıdır.
- Kanca ve CTA Mühendisliği:
  Katılımcının ${mainTopic} ve ${secondTopic} odak alanlarına özel tasarlanmış reçeteler:
  - Kanca 1 (Stratejik Açılış): ${dynamicHook1}
  - Kanca 2 (Merak ve Kanıt): ${dynamicHook2}
  - Kanca 3 (Pratik Öngörü): ${dynamicHook3}
  - CTA 1 (Aksiyonel Yönlendirme): ${dynamicCta1}
  - CTA 2 (Etkileşim Odaklı): ${dynamicCta2}
  - CTA 3 (Farkındalık & Yayılım): ${dynamicCta3}

## 3. KİŞİSELLEŞTİRİLMİŞ İÇERİK SERİLERİ VE ÜRETİM MATRİSİ

- Seri 1: ${mainTopic} Odağında ${archetypeChoice.split(':')[0]} Dosyası
  - Format: ${duration} ${formatChoice}
  - Yayın Kanalı: Instagram & LinkedIn
  - Detaylı İçerik Mantığı: ${mainTopic} konusunda doğru bilginin bilimsel ve pratik boyutunu ele alan öncü seri.
  - Örnek bölüm başlıkları:
    * Bölüm 1: ${mainTopic} pratiğinde yapılan en kritik değerlendirme hataları
    * Bölüm 2: Danışanların ${mainTopic} seçerken dikkat etmesi gereken parametreler
    * Bölüm 3: Bilimsel kanıtlar ışığında ${mainTopic} kullanım protokolü
  - Üretim akışı: Haftalık senaryo taslağı, toplu çekim ve altyazı optimizasyonu.
  - Risk/uyum notu: Ruhsatlı ilaç markası kullanılmamalı, etken madde ve genel ilkeler üzerinden anlatılmalıdır.

- Seri 2: ${secondTopic} & Danışan Kılavuzu
  - Format: ${formatChoice} & Carousel
  - Yayın Kanalı: Instagram & TikTok
  - Detaylı İçerik Mantığı: ${secondTopic} hakkında sahada en sık karşılaşılan soru ve sorunlara yönelik hap çözümler.
  - Örnek bölüm başlıkları:
    * Bölüm 1: ${secondTopic} ile ilgili en yaygın yanlış inanışlar
    * Bölüm 2: Kimler ${secondTopic} takviyelerinde daha temkinli olmalı?
    * Bölüm 3: ${secondTopic} sürecinde yaşam tarzı düzenlemeleri
  - Üretim akışı: Soru kutusundan gelen temaların 15-30 saniyelik parçalara dönüştürülmesi.
  - Risk/uyum notu: Bireysel teşhis veya reçete önerisi yapılmamalı, hekime ve eczacıya danışma vurgusu korunmalıdır.

- Seri 3: ${narration} ile ${thirdTopic} Günlüğü
  - Format: Vlog & Arka Plan ${formatChoice}
  - Yayın Kanalı: Instagram Reels & Hikâyeler
  - Detaylı İçerik Mantığı: Mesleki rutini ve sağlıklı yaşam disiplinini şeffaf şekilde yansıtan güven serisi.
  - Örnek bölüm başlıkları:
    * Bölüm 1: Bir sağlık profesyonelinin ${thirdTopic} rutini
    * Bölüm 2: Yoğun çalışma temposunda enerjiyi koruma yöntemleri
    * Bölüm 3: Mesleki gözlemle sahada fark ettiğim önemli detaylar
  - Üretim akışı: Günlük B-roll arşivinden haftalık 1 kısa video kurgulama.
  - Risk/uyum notu: Hasta mahremiyeti ve KVKK kurallarına tam riayet edilmeli, kişisel veriler kadraja girmemelidir.

## 4. ROL MODEL VE BENCHMARK ANALİZİ

- Referans Alınan Tarzların Değerlendirilmesi:
  Belirtilen benchmark üreticiler (${benchmarks}), ${archetypeChoice.split(':')[0]} tonuyla uyumlu örneklerdir. Bu hesapların kurgu dinamizmi ve anlatım mimarisi ilham kaynağı olarak incelenmelidir.
- Görsel ve İşitsel Estetik Yönlendirmeler:
  Işık ve ses dengesi kurulmalı, doğal bir mesleki arka plan tercih edilmeli ve gereksiz görsel karmaşadan kaçınılmalıdır.
- Kopyalamadan Modelleme:
  İçerik başlıkları birebir alınmamalı; kendi uzmanlık birikimi ve "${brandWords}" kimliğiyle harmanlanmış özgün formatlar geliştirilmelidir.

## 5. OPERASYONEL RİSKLER, MEVZUAT FARKINDALIĞI VE TÜKENMİŞLİK ANALİZİ

- Birincil Operasyonel Darboğaz:
  Katılımcının en çok zorlandığı "${bottleneck}" konusunu yönetmek için; içerik fikir havuzu oluşturulmalı ve çekimler tek oturumda toplu olarak tamamlanmalıdır.
- TİTCK/KVKK ve Sağlık İletişimi Uyarıları:
  * TİTCK: İlaç tanıtımı ve örtülü reklam yasağına titizlikle uyulmalıdır.
  * KVKK: Danışan veya hasta verileri hiçbir şekilde ifşa edilmemelidir.
  * Endikasyon: Gıda takviyelerine tıbbi tedavi edici iddialar yüklenemez.
- Kriz Yönetimi Simülasyonu:
  Olası tartışma veya haksız eleştirilerde "${crisis}" refleksi korunarak profesyonel sınır muhafaza edilmelidir.
- Tükenmişlik Önleme:
  Haftalık ${weeklyCap} içerik hacmi aşırı yük oluşturmayacak şekilde takvimlendirilmeli, sürdürülebilir bir tempo hedeflenmelidir.

${s6}

${s7}`
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
      const userEmail = (user?.email || profile?.email || '').trim().toLowerCase()
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

    let participantName = profile?.ad_soyad || user?.user_metadata?.ad_soyad || ''
    if (!participantName && katilimciId) {
      const { data: katRec } = await adminClient
        .from('core_katilimci')
        .select('ad_soyad, aday:core_aday(ad_soyad)')
        .eq('id', katilimciId)
        .maybeSingle()
      participantName = katRec?.ad_soyad || (katRec?.aday as any)?.ad_soyad || 'Katılımcı'
    }
    if (!participantName) participantName = 'Katılımcı'

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    let raporMetni = ""
    let aiModel = "Stratejik Kişiselleştirilmiş Analiz"
    const promptVersiyonu = "dna-v5-strict"
    const fullPromptVersion = "operational-dna-v5-strict-structure"

    const formattedAnswers = formatAnswersForPrompt(cevaplar, participantName)

    if (geminiKey) {
      try {
        const systemPrompt = `Sen, sağlık profesyonelleri (eczacı, hekim, diyetisyen, fizyoterapist, diş hekimi ve diğer sağlık uzmanları) için dijital içerik stratejileri, kişisel marka konumlandırma, sağlık iletişimi, regülasyon farkındalığı, KVKK hassasiyeti ve operasyonel risk yönetimi alanında uzmanlaşmış kıdemli bir "İçerik Stratejisi ve Dijital DNA Analiz Uzmanı"sın.

RAPORUN AMACI:
Katılımcının (${participantName}) 20 soruluk "İçerik Üretici DNA Envanteri" cevaplarını çapraz analiz ederek kişiye özel, tamamen özgün, somut, uygulanabilir ve profesyonel bir "Kişiselleştirilmiş İçerik ve Operasyonel DNA Raporu" üretmektir.

ÖNEMLİ KİŞİSELLEŞTİRME VE KANIT DAYANAĞI KURALLARI (ŞABLON YASAKTIR):
1. AYNI CTA, HOOK, İÇERİK SERİSİ, ROADMAP VEYA TAKVİM CÜMLESİNİ FARKLI KATILIMCILAR İÇİN TEKRAR KULLANMAK KESİNLİKLE YASAKTIR.
2. Sadece konu adını değiştirip aynı şablon cümleleri basmak (Örn: "Bu bilgiyi ihtiyaç duyduğunuzda kolayca bulmak için kaydedin", "En çok merak ettiğiniz soruyu yoruma yazın", "Benzer şikâyeti olan bir yakınınız varsa paylaşın") KESİNLİKLE YASAKTIR.
3. Her öneri, kanca (hook) ve eylem çağrısı (CTA); katılımcının seçtiği niş (S2), hedef kitle, format tercihi (S3), kamera rahatlığı (S9), konuşma temposu (S6), kriz refleksi (S13), hedef marka kelimeleri (S18-S19) ve vizyon cümlesi (S20) ile birebir bağlantılı ve yaratıcı olmalıdır.
4. Önerilen 3 İçerik Serisi, katılımcının seçtiği spesifik 1. ve 2. niş alanlara (S2) ve hedef arketipine (S16) göre sıfırdan kurgulanmış özgün isimler, mantıklar ve bölüm başlıkları taşımalıdır.
5. Analiz katılımcının verdiği yanıtlara dayansın; ancak metin içinde '[Dayanak: S16=...]' veya 'S16=...' gibi teknik dayanak etiketleri kullanıcıya görünür şekilde yazılmamalıdır. Dayanaklar gerekirse doğal cümle içinde kısa şekilde geçsin.
6. Skor kartındaki yüzde değerlerini katılımcının yanıtlarına göre dinamik ve gerçekçi olarak puanla (Sabit puanlar üretme).
7. TİTCK (Türkiye İlaç ve Tıbbi Cihaz Kurumu), Sağlık Bakanlığı Sağlık İletişimi Kılavuzları ve KVKK regülasyonları ile etik sağlık iletişimi ilkelerine tam uyum farkındalığı üret. Tıbbi teşhis, reçete yönlendirmesi veya ilaç reklamı KESİNLİKLE YASAKTIR.
8. RAPORUN TÜM BÖLÜMLERİ (1. Bölümden 7. Bölümün 14. Gününe kadar) TAMAMEN VE EKSİKSİZ ÜRETİLMELİDİR.
   - BÖLÜM 6 (7 ADIMLI YOL HARİTASI): KESİNLİKLE VE TAM OLARAK 7 ADIMDAN OLUŞMALIDIR (Adım 1, Adım 2, Adım 3, Adım 4, Adım 5, Adım 6, Adım 7). 7'den az veya 7'den fazla adım yazmak KESİNLİKLE YASAKTIR.
   - BÖLÜM 7 (14 GÜNLÜK MİNİ TAKVİM): KESİNLİKLE VE TAM OLARAK 14 GÜNDEN OLUŞMALIDIR (Gün 1, Gün 2, Gün 3, ..., Gün 14). 14'ten az veya 14'ten fazla gün yazmak KESİNLİKLE YASAKTIR.

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
  Katılımcının S2 nişine, S7 kanca stiline ve S8 eylem hedefine özel tasarlanmış tamamen özgün örnekler:
  - Kanca 1 (Stratejik Açılış): "[Özgün kanca metni]"
  - Kanca 2 (Merak ve Kanıt): "[Özgün kanca metni]"
  - Kanca 3 (Pratik Öngörü): "[Özgün kanca metni]"
  - CTA 1 (Aksiyonel Yönlendirme): "[Özgün CTA metni]"
  - CTA 2 (Etkileşim Odaklı): "[Özgün CTA metni]"
  - CTA 3 (Farkındalık & Yayılım): "[Özgün CTA metni]"

## 3. KİŞİSELLEŞTİRİLMİŞ İÇERİK SERİLERİ VE ÜRETİM MATRİSİ

Sürdürülebilir, katılımcının S2 nişine ve S3 formatına tam uygun 3 spesifik ve özgün içerik serisi:

- Seri 1: [Özgün Seri Adı]
  - Format: [Video / Carousel / Shorts vb.]
  - Yayın Kanalı: [Instagram / TikTok / YouTube / LinkedIn]
  - Detaylı İçerik Mantığı: [Serinin amacı, kime hitap ettiği ve değer önerisi]
  - Örnek bölüm başlıkları:
    * Bölüm 1: [Başlık]
    * Bölüm 2: [Başlık]
    * Bölüm 3: [Başlık]
  - Üretim akışı: [Araştırma, senaryo, çekim ve kurgu adımları]
  - Risk/uyum notu: [TİTCK / KVKK / Etik açıdan dikkat edilecek husus]

- Seri 2: [Özgün Seri Adı]
  - Format: [Video / Carousel / Shorts vb.]
  - Yayın Kanalı: [Instagram / TikTok / YouTube / LinkedIn]
  - Detaylı İçerik Mantığı: [Serinin amacı, kime hitap ettiği ve değer önerisi]
  - Örnek bölüm başlıkları:
    * Bölüm 1: [Başlık]
    * Bölüm 2: [Başlık]
    * Bölüm 3: [Başlık]
  - Üretim akışı: [Araştırma, senaryo, çekim ve kurgu adımları]
  - Risk/uyum notu: [TİTCK / KVKK / Etik açıdan dikkat edilecek husus]

- Seri 3: [Özgün Seri Adı]
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
  [S13 kriz tepkisine göre uygulanacak sakin ve kanıta dayalı kriz protokolü]
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

        const activeModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash-lite']
        for (const modelName of activeModels) {
          try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: {
                  temperature: 0.65,
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
                aiModel = `Gemini ${modelName.includes('3.6') ? '3.6 Flash' : modelName.includes('3.5') ? '3.5 Flash' : modelName}`
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
    } else {
      // Enforce strict 7-step and 14-day structure validation & repair
      raporMetni = repairReportStructureIfNeeded(raporMetni, cevaplar, participantName)
    }

    const structureValidation = validateReportStructure(raporMetni)
    if (!structureValidation.isValid) {
      // Final guarantee: repair structure
      raporMetni = repairReportStructureIfNeeded(raporMetni, cevaplar, participantName)
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
      prompt_version: fullPromptVersion,
      validation: validateReportStructure(raporMetni)
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
          prompt_version: fullPromptVersion
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
