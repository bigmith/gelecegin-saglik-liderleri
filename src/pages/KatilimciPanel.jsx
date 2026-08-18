import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getKatilimciMe,
  getKatilimciProfilim,
  updateKatilimciProfilim,
  uploadKatilimciProfilFotografi,
  getDriveThumbnailUrl,
  getParticipantAvatarSrc,
  getGorevler,
  getKatilimciTeslimlerMe,
  getKatilimciDnaMe,
  getKatilimciPerformansMe,
  getAktifProgramHaftalari,
  submitIcerikDna,
  submitKatilimciTeslim,
  recordParticipantActivity,
  logoutUser
} from '../services/supabaseService'
import { PROGRAM_WEEKS, PROGRAM_SUMMARY } from '../data/programSchedule'
import DnaReportRenderer from '../components/DnaReportRenderer'

// Form soruları (20 adet final soru ve seçenekleri)
const QUESTIONS = [
  {
    key: 'soru_1',
    label: 'İçerik üretme amacın nedir?',
    type: 'multi_choice',
    options: [
      'İnsanları doğru bilgilendirmek',
      'Mesleki uzmanlığımı göstermek',
      'Kendi kişisel markamı oluşturmak',
      'Yeni danışan/hasta kazanmak',
      'Topluluk oluşturmak',
      'Diğer'
    ]
  },
  {
    key: 'soru_2',
    label: 'En çok hangi konularda içerik üretmek istiyorsun?',
    hint: 'Maksimum 5 seçim yapabilirsiniz.',
    type: 'multi_choice',
    maxSelect: 5,
    options: [
      'Dermakozmetik ve Cilt/Saç Bakımı',
      'Vitaminler ve Gıda Takviyeleri',
      'Anne, Bebek ve Çocuk Sağlığı',
      'Günlük Sağlık Tüyoları (Bağışıklık, uyku, enerji vb.)',
      'İlaç Bilinci ve Akılcı İlaç Kullanımı',
      'Fitoterapi ve Doğal Yaklaşımlar',
      'Sağlıklı Yaşam ve Beslenme Rutinleri',
      'Yanlış Bilinenler ve Sağlık Mitleri',
      'Diğer'
    ]
  },
  {
    key: 'soru_3',
    label: 'İçeriklerini en çok hangi formatta/tarzda üretmeyi düşünüyorsun?',
    type: 'single_choice',
    options: [
      'Kamera karşısında doğrudan anlatım',
      'Ürün incelemesi / Öncesi-sonrası',
      'Günlük vlog / Eczane-Klinik',
      'Hikâye anlatımı',
      'Soru-cevap / Röportaj'
    ]
  },
  {
    key: 'soru_4',
    label: 'İçeriklerinde seni en iyi anlatan iletişim dili hangisi?',
    type: 'single_choice',
    options: [
      'Samimi',
      'Eğitici',
      'Profesyonel',
      'Enerjik',
      'Mizahi',
      'Sakin'
    ]
  },
  {
    key: 'soru_5',
    label: 'Bir konuyu anlatırken kendini en rahat hissettiğin video süresi hangisi?',
    type: 'single_choice',
    options: [
      '15 saniye (Kısa ve vurucu)',
      '30-45 saniye (Akıcı ve dengeli)',
      '60 saniye ve üzeri (Detaylı anlatım)'
    ]
  },
  {
    key: 'soru_6',
    label: 'Kamera karşısındaki konuşma temponu nasıl tanımlarsın?',
    type: 'single_choice',
    options: [
      'Hızlı ve enerjik',
      'Orta tempolu ve akıcı',
      'Yavaş, sakin ve açıklayıcı'
    ]
  },
  {
    key: 'soru_7',
    label: 'Videolarına başlamayı en çok hangi şekilde seversin?',
    type: 'single_choice',
    options: [
      'Dikkat çekici bir soru sorarak',
      'İzleyicinin yaşadığı bir problemi anlatarak',
      'Sonucu en başta söyleyerek',
      'Kısa bir hikâyeyle başlayarak'
    ]
  },
  {
    key: 'soru_8',
    label: 'Videonun sonunda (CTA) izleyiciden en çok hangi davranışı beklemek istersin?',
    type: 'single_choice',
    options: [
      'Yorum yapması / Fikir belirtmesi',
      'Videoyu kaydetmesi veya paylaşması',
      'Bana soru sorması',
      'Eczaneye/Kliniğe yönelmesi',
      'Sadece bilgiyi alıp devam etmesi'
    ]
  },
  {
    key: 'soru_9',
    label: 'Kamera karşısında kendini nasıl hissediyorsun?',
    hint: '1 çok zorlanıyorum, 5 çok rahatım',
    type: 'scale',
    options: ['1', '2', '3', '4', '5']
  },
  {
    key: 'soru_10',
    label: 'Bir video hazırlarken en çok zorlandığın konu nedir?',
    type: 'single_choice',
    options: [
      'Konu bulmak',
      'Senaryo yazmak',
      'Kameraya konuşmak',
      'Video/Işık/Ses ayarlamak',
      'Kurgu (Edit) yapmak',
      'İlk cümleyi bulmak'
    ]
  },
  {
    key: 'soru_11',
    label: 'Videolarında seni en çok hangisi temsil eder?',
    type: 'single_choice',
    options: [
      'Bilgiyi sade anlatırım.',
      'Hikâyeleştirerek anlatırım.',
      'Eğlenceli ve mizahi anlatırım.',
      'Kanıtlara dayanarak anlatırım.',
      'Sohbet eder gibi anlatırım.'
    ]
  },
  {
    key: 'soru_12',
    label: 'Video hazırlarken seni en çok motive eden şey nedir?',
    type: 'single_choice',
    options: [
      'Fayda sağlamak',
      'Beğeni/Etkileşim almak',
      'Geri dönüş almak',
      'Kendimi geliştirmek',
      'Yeni kitlelere ulaşmak'
    ]
  },
  {
    key: 'soru_13',
    label: 'Bir kriz anında (haksız eleştiri vs.) ilk tepkin ne olur?',
    type: 'single_choice',
    options: [
      'Kanıtlarla sakince cevap veririm.',
      'Görmezden gelirim, polemiğe girmem.',
      'İronik veya esprili bir yanıt veririm.',
      'Yorumu silerim / gizlerim.'
    ]
  },
  {
    key: 'soru_14',
    label: 'Kendi mesai yoğunluğunda haftada kaç içerik üretmeyi gerçekçi buluyorsun?',
    type: 'single_choice',
    options: ['1', '2', '3', '4', '5+']
  },
  {
    key: 'soru_15',
    label: 'Kendini içerik üretimi konusunda bugün hangi seviyede görüyorsun?',
    type: 'single_choice',
    options: [
      'Daha yeni başlıyorum',
      'Temel',
      'Orta',
      'İyi / Deneyimliyim'
    ]
  },
  {
    key: 'soru_16',
    label: 'Şu an sosyal medyada (Instagram/TikTok) başarılı olan sağlık içerik üreticilerini incelediğimizde 4 ana tarz (arketip) öne çıkıyor. Sen bu tarzlardan hangisine daha yakın olmak istersin?',
    type: 'single_choice',
    options: [
      'Klinik ve Akademik Tarz: Sadece etken madde, makale ve bilimsel kanıt üzerinden ciddi anlatım yapanlar.',
      'Banko/Tavsiye Tarzı: Doğrudan eczane rafından ürün alıp, pratik ve samimi dille “Bunu kullanmalısın” diyenler.',
      'Trend ve Eğlence Tarzı: Mizahı, popüler müzikleri ve akımları kullanarak yanlış bilinen sağlık mitlerini tiye alanlar.',
      'Lifestyle / Vlog Tarzı: Mesleki bilgisinin yanında kendi hayatını, eczane içi nöbetlerini ve günlük rutinini paylaşanlar.'
    ]
  },
  {
    key: 'soru_17',
    label: 'Sosyal medyada içerik tarzını beğendiğin veya örnek aldığın 1-3 sağlık içerik üreticisi / hesap var mı?',
    placeholder: 'Örn: @dr_ornek, @eczane_ornek',
    type: 'textarea'
  },
  {
    key: 'soru_18',
    label: 'İçeriklerinde kendi markanı yansıtacak en fazla 3 kelime yaz.',
    hint: 'Örn: Güvenilir, Samimi, Bilimsel',
    placeholder: 'Örn: Güvenilir, Samimi, Bilimsel',
    type: 'textarea'
  },
  {
    key: 'soru_19',
    label: 'İnsanların seni düşündüğünde akıllarına gelmesini istediğin, hedeflediğin en fazla 3 kelime nedir?',
    hint: 'Örn: Yenilikçi, İlham Veren, Pratik',
    placeholder: 'Örn: Yenilikçi, İlham Veren, Pratik',
    type: 'textarea'
  },
  {
    key: 'soru_20',
    label: 'Program sonunda insanların seni ve sayfanı tek cümleyle nasıl tanımlamasını istersin?',
    placeholder: 'Cevabınızı yazınız...',
    type: 'textarea'
  }
]

// 5 Adımlı Form Wizard Yapısı
const WIZARD_STEPS = [
  {
    id: 1,
    title: 'Amaç ve Konular',
    subtitle: 'Sorular 1 – 4',
    questionKeys: ['soru_1', 'soru_2', 'soru_3', 'soru_4']
  },
  {
    id: 2,
    title: "İçerik DNA'sı",
    subtitle: 'Sorular 5 – 8',
    questionKeys: ['soru_5', 'soru_6', 'soru_7', 'soru_8']
  },
  {
    id: 3,
    title: 'Yetkinlik ve Gelişim',
    subtitle: 'Sorular 9 – 15',
    questionKeys: ['soru_9', 'soru_10', 'soru_11', 'soru_12', 'soru_13', 'soru_14', 'soru_15']
  },
  {
    id: 4,
    title: 'Arketip ve Benchmark',
    subtitle: 'Sorular 16 – 17',
    questionKeys: ['soru_16', 'soru_17']
  },
  {
    id: 5,
    title: 'Marka Vizyonu',
    subtitle: 'Sorular 18 – 20',
    questionKeys: ['soru_18', 'soru_19', 'soru_20']
  }
]

// ─── Markdown Rapor Render Yardımcıları ─────────────────────────────────────────

// Inline markdown (**kalın**) metinleri react bileşenlerine çevirir
const renderInlineMarkdown = (text) => {
  if (!text) return null
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

// Bir section içindeki gövde metnini satır satır ayrıştırıp kart içi elemanlara çevirir
function ReportBodyRenderer({ body }) {
  if (!body) return null

  const lines = body.split('\n')
  const elements = []
  let currentList = []

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-2 my-3 pl-1">
          {currentList.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
              <span className="flex-1">{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      )
      currentList = []
    }
  }

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      return
    }

    // --- veya *** gibi ayraç çizgileri
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList()
      elements.push(
        <hr key={`hr-${lineIdx}`} className="my-4 border-slate-200" />
      )
      return
    }

    // Liste elemanları (- veya * veya • ile başlayanlar)
    if (/^[\-\*•]\s+/.test(trimmed)) {
      const itemContent = trimmed.replace(/^[\-\*•]\s+/, '')
      currentList.push(itemContent)
      return
    }

    // Numaralı liste elemanları (1. 2. vb.)
    if (/^\d+[\.\)]\s+/.test(trimmed)) {
      flushList()
      const match = trimmed.match(/^(\d+)[\.\)]\s+(.*)/)
      if (match) {
        elements.push(
          <div key={`num-${lineIdx}`} className="flex items-start gap-2.5 my-2 text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md text-[11px] shrink-0 border border-purple-100">
              {match[1]}.
            </span>
            <span className="flex-1 pt-0.5">{renderInlineMarkdown(match[2])}</span>
          </div>
        )
        return
      }
    }

    // Normal paragraf satırları
    flushList()
    elements.push(
      <p key={`p-${lineIdx}`} className="text-xs text-slate-700 leading-relaxed my-1.5">
        {renderInlineMarkdown(trimmed)}
      </p>
    )
  })

  flushList()
  return <div className="space-y-1">{elements}</div>
}

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

// Helper: Multi-choice değerini her zaman Array olarak döner
const getMultiChoiceArray = (val) => {
  if (Array.isArray(val)) return val
  if (typeof val === 'string' && val.trim()) {
    return val.split(',').map(s => s.trim()).filter(Boolean)
  }
  return []
}

// Helper: Bir sorunun doldurulup doldurulmadığını kontrol eder
const isAnswered = (val) => {
  if (val === undefined || val === null) return false
  if (Array.isArray(val)) return val.length > 0
  if (typeof val === 'string') return val.trim().length > 0
  if (typeof val === 'number') return true
  return Boolean(val)
}

// Helper: Cevabı güvenli bir şekilde string'e çevirir
const formatAnswer = (val) => {
  if (val === undefined || val === null) return ''
  if (Array.isArray(val)) return val.join(', ')
  if (typeof val === 'string') return val
  if (typeof val === 'number') return String(val)
  return String(val || '')
}

// Helper: Bir sorunun doldurulup doldurulmadığını kontrol eder
const isQuestionFilled = (qKey, answers) => {
  if (!answers || typeof answers !== 'object') return false
  return isAnswered(answers[qKey])
}

// Helper: Gelen cevapları normalize eder
const normalizeDnaAnswers = (cevaplar) => {
  if (!cevaplar || typeof cevaplar !== 'object') return {}
  const res = { ...cevaplar }
  QUESTIONS.forEach(q => {
    if (q.type === 'multi_choice') {
      res[q.key] = getMultiChoiceArray(res[q.key])
    }
  })
  return res
}

// Kategori renk haritası (wizard adımlarıyla uyumlu)
const KAT_PANEL_DNA_CATEGORIES = {
  soru_1:  { label: 'Amaç & Konular',      bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-200'  },
  soru_2:  { label: 'Amaç & Konular',      bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-200'  },
  soru_3:  { label: 'Amaç & Konular',      bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-200'  },
  soru_4:  { label: 'Amaç & Konular',      bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-200'  },
  soru_5:  { label: "İçerik DNA'sı",       bg: 'bg-indigo-100',  text: 'text-indigo-800',  border: 'border-indigo-200'  },
  soru_6:  { label: "İçerik DNA'sı",       bg: 'bg-indigo-100',  text: 'text-indigo-800',  border: 'border-indigo-200'  },
  soru_7:  { label: "İçerik DNA'sı",       bg: 'bg-indigo-100',  text: 'text-indigo-800',  border: 'border-indigo-200'  },
  soru_8:  { label: "İçerik DNA'sı",       bg: 'bg-indigo-100',  text: 'text-indigo-800',  border: 'border-indigo-200'  },
  soru_9:  { label: 'Yetkinlik & Gelişim', bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-200'    },
  soru_10: { label: 'Yetkinlik & Gelişim', bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-200'    },
  soru_11: { label: 'Yetkinlik & Gelişim', bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-200'    },
  soru_12: { label: 'Yetkinlik & Gelişim', bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-200'    },
  soru_13: { label: 'Yetkinlik & Gelişim', bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-200'    },
  soru_14: { label: 'Yetkinlik & Gelişim', bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-200'    },
  soru_15: { label: 'Yetkinlik & Gelişim', bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-200'    },
  soru_16: { label: 'Arketip & Benchmark', bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-200'   },
  soru_17: { label: 'Arketip & Benchmark', bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-200'   },
  soru_18: { label: 'Marka Vizyonu',       bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  soru_19: { label: 'Marka Vizyonu',       bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  soru_20: { label: 'Marka Vizyonu',       bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
}

// Helper: Cevapları display için QUESTIONS labelları ile parse eder
const parseKatDnaAnswersForDisplay = (cevaplar) => {
  if (!cevaplar) return []
  let raw = cevaplar
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw) } catch { raw = { cevap: raw } }
  }
  // QUESTIONS array'ini key -> label haritası olarak kullan
  const questionLabelMap = {}
  QUESTIONS.forEach(q => { questionLabelMap[q.key] = q.label })

  let entries = []
  if (Array.isArray(raw)) {
    entries = raw.map((v, idx) => [`soru_${idx + 1}`, v])
  } else if (typeof raw === 'object' && raw !== null) {
    const soruKeys = Object.keys(raw)
      .filter(k => /^soru_\d+$/.test(k))
      .sort((a, b) => parseInt(a.replace('soru_', '')) - parseInt(b.replace('soru_', '')))
    const otherKeys = Object.keys(raw).filter(k => !/^soru_\d+$/.test(k))
    entries = [...soruKeys, ...otherKeys].map(k => [k, raw[k]])
  }

  return entries.map(([k, v]) => {
    const questionTitle = questionLabelMap[k] || (String(k).startsWith('soru_') ? `Soru ${String(k).replace('soru_', '')}` : String(k).replace(/_/g, ' '))
    const soruNo = String(k).startsWith('soru_') ? parseInt(String(k).replace('soru_', '')) : null
    const cat = KAT_PANEL_DNA_CATEGORIES[k] || { label: 'Diğer', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' }
    let answerText = ''
    if (Array.isArray(v)) { answerText = v.join(', ') }
    else if (typeof v === 'object' && v !== null) { answerText = JSON.stringify(v, null, 2) }
    else { answerText = String(v || '').trim() }
    return { key: k, soruNo, questionTitle, category: cat, answerText }
  })
}


// SVG İkonlar
const Ic = {
  Dashboard: ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z" /></svg>,
  Task: ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" /><path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.586 4.594a.75.75 0 00-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.116-.062l3-3.75z" clipRule="evenodd" /></svg>,
  Dna: ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M7 3c5 3 5 15 10 18" /><path d="M17 3C12 6 12 18 7 21" /><path d="M9 6h6" /><path d="M8.5 10h7" /><path d="M8.5 14h7" /><path d="M9 18h6" /></svg>,
  Calendar: ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className={c}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" /></svg>,
  User: ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.6-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" /></svg>,
  Logout: ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={c}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>,
  Upload: ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={c}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>,
  Check: ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg>,
  Clock: ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={c}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Trophy: ({ c = 'w-6 h-6' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={c}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" /></svg>,
  Info: ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={c}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>,
  Close: ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={c}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Sparkles: ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={c}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>,
  Refresh: ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" /></svg>,
}

function StatusBadge({ durum, degerlendirildi, revizyon }) {
  const d = durum || (degerlendirildi ? (revizyon ? 'REVIZYON_ISTENDI' : 'TAMAMLANDI') : 'BEKLIYOR')

  if (d === 'TAMAMLANDI' || d === 'Değerlendirildi') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-emerald-100 text-emerald-700 border-emerald-200">
        <Ic.Check />
        Tamamlandı
      </span>
    )
  }
  if (d === 'REVIZYON_ISTENDI' || d === 'Revizyon İstendi') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-orange-100 text-orange-700 border-orange-200">
        <Ic.Info />
        Revizyon İstendi
      </span>
    )
  }
  if (d === 'REVIZE_EDILDI') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-blue-100 text-blue-700 border-blue-200">
        <Ic.Clock />
        Revize Teslim Gönderildi
      </span>
    )
  }
  if (d === 'BEKLIYOR' || d === 'Yüklendi' || d === 'İnceleniyor') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-amber-100 text-amber-700 border-amber-200">
        <Ic.Clock c="w-4 h-4 text-amber-500" />
        Değerlendirme Bekliyor
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-slate-100 text-slate-600 border-slate-200">
      <Ic.Clock c="w-4 h-4 text-slate-400" />
      Bekliyor
    </span>
  )
}

function TeslimTimeline({ hareketler }) {
  const resolveUrl = (url) => {
    if (!url || typeof url !== 'string') return null
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return null
  }

  const safeList = Array.isArray(hareketler)
    ? hareketler
    : Array.isArray(hareketler?.results)
    ? hareketler.results
    : []

  if (safeList.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center text-[11px] text-slate-400 italic">
        Bu teslim için henüz işlem geçmişi bulunmuyor.
      </div>
    )
  }

  const sorted = [...safeList].sort((a, b) => {
    const tA = a?.tarih || a?.olusturulma_tarihi ? new Date(a.tarih || a.olusturulma_tarihi).getTime() : 0
    const tB = b?.tarih || b?.olusturulma_tarihi ? new Date(b.tarih || b.olusturulma_tarihi).getTime() : 0
    return tA - tB
  })

  const ISLEM_CONFIG = {
    ILK_TESLIM: { label: 'İlk Tesliminiz', icon: '🚀', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    TESLIM_EDILDI: { label: 'Teslim Edildi', icon: '🚀', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    REVIZYON_ISTENDI: { label: 'Mentor Revizyon İstedi', icon: '🔄', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
    REVIZE_TESLIM: { label: 'Revize Tesliminiz', icon: '📤', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
    NIHAI_DEGERLENDIRME: { label: 'Değerlendirme Tamamlandı', icon: '✅', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  }

  return (
    <div className="relative pl-3 space-y-2.5 my-2 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200/80">
      {sorted.map((h, idx) => {
        if (!h || typeof h !== 'object') return null
        const tipe = String(h.islem_tipi || '').toUpperCase()
        const config = ISLEM_CONFIG[tipe] || {
          label: String(h.islem_tipi_etiketi || h.islem_tipi || 'İşlem'),
          icon: '📌',
          badge: 'bg-slate-50 text-slate-700 border-slate-200'
        }

        const tarihStr = h.tarih || h.olusturulma_tarihi
          ? new Date(h.tarih || h.olusturulma_tarihi).toLocaleString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : '—'
        const yapan = String(h.olusturan_adi || h.olusturan_user || 'Sistem')
        const dosyaUrl = resolveUrl(
          h.teslim_dosyasi_url ||
          h.drive_file_url ||
          h.file_url ||
          (typeof h.teslim_dosyasi === 'string' ? h.teslim_dosyasi : null)
        )
        const teslimLinki = h.teslim_linki && typeof h.teslim_linki === 'string' ? h.teslim_linki : null
        const aciklama = h.aciklama || h.revizyon_notu || h.not_metni
        const mentorYorumu = h.mentor_yorumu

        return (
          <div key={h.id || idx} className="relative flex items-start gap-2 text-xs">
            <div className="absolute -left-3 top-1.5 w-2 h-2 rounded-full bg-slate-400 ring-2 ring-white" />
            <div className="bg-white border border-slate-100 rounded-xl p-3 w-full shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${config.badge}`}>
                    {config.icon} {config.label}
                  </span>
                  <span className="font-semibold text-slate-700">{yapan}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{tarihStr}</span>
              </div>

              {aciklama && (
                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {String(aciklama)}
                </p>
              )}

              {mentorYorumu && (
                <p className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                  <strong>Mentor Geri Bildirimi:</strong> "{String(mentorYorumu)}"
                </p>
              )}

              {(typeof h.puan === 'number' || typeof h.puan === 'string') && h.puan !== null && (
                <div className="inline-block bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                  Puan: {h.puan}
                </div>
              )}

              <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                {dosyaUrl && (
                  <a
                    href={dosyaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-100 transition-colors"
                  >
                    <span>📎 Teslim Dosyası</span>
                  </a>
                )}
                {teslimLinki && (
                  <a
                    href={teslimLinki}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-100 transition-colors"
                  >
                    <span>🔗 Teslim Linki</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active
        ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-orange-200'
        : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'
        }`}
    >
      {icon}
      <span>{label}</span>
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />}
    </button>
  )
}

export default function KatilimciPanel() {
  const navigate = useNavigate()
  const username = localStorage.getItem('username') || 'Katılımcı'

  const [activeTab, setActiveTab] = useState('genel')
  const [katilimci, setKatilimci] = useState(null)
  const [takim, setTakim] = useState(null)
  const [gorevler, setGorevler] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // İçerik DNA Testi States
  const [dnaData, setDnaData] = useState(null)
  const [dnaLoading, setDnaLoading] = useState(true)
  const [dnaError, setDnaError] = useState(null)
  const [dnaAnswers, setDnaAnswers] = useState({})
  const [dnaSubmitting, setDnaSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [dnaResultTab, setDnaResultTab] = useState('rapor') // 'cevaplar' | 'rapor'

  // Modal states
  const [selectedGorev, setSelectedGorev] = useState(null)
  const [file, setFile] = useState(null)
  const [link, setLink] = useState('')
  const [not, setNot] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Haftalık Program State (Decoupled from tasks)
  const [programHaftalari, setProgramHaftalari] = useState([])
  const [programLoading, setProgramLoading] = useState(false)
  const [programError, setProgramError] = useState(null)

  const fetchProgramHaftalari = async (showSpinner = true) => {
    if (showSpinner) setProgramLoading(true)
    setProgramError(null)
    try {
      const data = await getAktifProgramHaftalari()
      setProgramHaftalari(data || [])
    } catch (err) {
      console.warn('Program haftaları çekilemedi:', err)
      setProgramError(err?.message || 'Program bilgileri alınamadı. Lütfen tekrar deneyin.')
    } finally {
      if (showSpinner) setProgramLoading(false)
    }
  }

  // Performans State
  const [performans, setPerformans] = useState(null)
  const [performansError, setPerformansError] = useState(null)

  // Profil Form States
  const [profileForm, setProfileForm] = useState({
    telefon: '',
    adres: '',
    okul_bilgisi: '',
    egitim_durumu: '',
    is_durumu: '',
    calistigi_kurum: '',
    pozisyon: '',
    is_aciklamasi: ''
  })
  const [profilePhotoFile, setProfilePhotoFile] = useState(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null)
  const [imgError, setImgError] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    if (katilimci) {
      setProfileForm({
        telefon: katilimci.telefon || '',
        adres: katilimci.adres || '',
        okul_bilgisi: katilimci.okul_bilgisi || '',
        egitim_durumu: katilimci.egitim_durumu || '',
        is_durumu: katilimci.is_durumu || '',
        calistigi_kurum: katilimci.calistigi_kurum || '',
        pozisyon: katilimci.pozisyon || '',
        is_aciklamasi: katilimci.is_aciklamasi || ''
      })
      const avatarSrc = getParticipantAvatarSrc(katilimci, 400)
      if (avatarSrc) {
        setProfilePhotoPreview(avatarSrc)
        setImgError(false)
      }
    }
  }, [katilimci])

  const handlePhotoSelect = async (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(selected.type.toLowerCase())) {
      setToast({ type: 'error', message: 'Geçersiz dosya türü. Lütfen JPEG, PNG veya WEBP görsel seçin.' })
      setTimeout(() => setToast(null), 4000)
      return
    }

    if (selected.size > 5 * 1024 * 1024) {
      setToast({ type: 'error', message: 'Fotoğraf boyutu en fazla 5 MB olabilir.' })
      setTimeout(() => setToast(null), 4000)
      return
    }

    setProfilePhotoFile(selected)
    const localPreviewUrl = URL.createObjectURL(selected)
    setProfilePhotoPreview(localPreviewUrl)
    setImgError(false)

    setUploadingPhoto(true)
    try {
      const res = await uploadKatilimciProfilFotografi(selected)
      setToast({ type: 'success', message: 'Profil fotoğrafınız başarıyla güncellendi!' })
      setTimeout(() => setToast(null), 4000)

      const newThumb = getDriveThumbnailUrl(res.profil_fotografi_file_id || res.profil_fotografi_url, 400)
      if (newThumb) setProfilePhotoPreview(newThumb)

      setKatilimci(prev => prev ? ({ ...prev, ...res }) : prev)

      const meData = await getKatilimciMe()
      if (meData?.katilimci) setKatilimci(meData.katilimci)
    } catch (err) {
      console.error('Fotoğraf yükleme hatası:', err)
      setToast({ type: 'error', message: err.message || 'Fotoğraf yüklenirken hata oluştu.' })
      setTimeout(() => setToast(null), 4000)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await updateKatilimciProfilim({
        telefon: profileForm.telefon,
        adres: profileForm.adres,
        okul_bilgisi: profileForm.okul_bilgisi,
        egitim_durumu: profileForm.egitim_durumu,
        is_durumu: profileForm.is_durumu,
        calistigi_kurum: profileForm.calistigi_kurum,
        pozisyon: profileForm.pozisyon,
        is_aciklamasi: profileForm.is_aciklamasi
      })
      setToast({ type: 'success', message: 'Profil bilgileriniz başarıyla güncellendi!' })
      setTimeout(() => setToast(null), 4000)
      const meData = await getKatilimciMe()
      if (meData?.katilimci) setKatilimci(meData.katilimci)
    } catch (err) {
      console.error('Profil güncelleme hatası:', err)
      setToast({ type: 'error', message: err.message || 'Profil güncellenirken hata oluştu.' })
      setTimeout(() => setToast(null), 4000)
    } finally {
      setSavingProfile(false)
    }
  }

  const fetchDna = async () => {
    setDnaLoading(true)
    setDnaError(null)
    try {
      if (katilimci?.id) {
        const dData = await getKatilimciDnaMe(katilimci.id)
        setDnaData(dData)
        if (dData && dData.cevaplar && typeof dData.cevaplar === 'object') {
          setDnaAnswers(prev => ({ ...normalizeDnaAnswers(dData.cevaplar), ...prev }))
        }
      }
    } catch (err) {
      console.error('İçerik DNA çekilemedi:', err)
      setDnaError('İçerik DNA verisi alınırken bağlantı hatası oluştu.')
    } finally {
      setDnaLoading(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Profil ve Katılımcı Bilgisi
      const meData = await getKatilimciMe()
      if (meData?.katilimci) {
        setKatilimci(meData.katilimci)
        if (meData.takim) {
          setTakim(meData.takim)
        } else {
          setTakim(null)
        }
      }

      const katilimciId = meData?.katilimci?.id

      // 2. Görevler, Kendi Teslimleri, DNA, Performans ve Aktif Program Haftaları
      const [rawGorevler, teslimler, dData, pData, pHaftalar] = await Promise.all([
        getGorevler().catch(() => []),
        katilimciId ? getKatilimciTeslimlerMe(katilimciId).catch(() => []) : [],
        katilimciId ? getKatilimciDnaMe(katilimciId).catch(() => null) : null,
        katilimciId ? getKatilimciPerformansMe(katilimciId).catch(() => null) : null,
        getAktifProgramHaftalari().catch((err) => {
          console.warn('Initial getAktifProgramHaftalari warning:', err)
          return null
        }),
      ])

      if (pHaftalar !== null) {
        setProgramHaftalari(pHaftalar || [])
        setProgramError(null)
      } else {
        fetchProgramHaftalari(false)
      }

      // Görevler ile teslimleri eşleştir
      const veriler = rawGorevler.map(g => {
        const matchedTeslim = teslimler.find(t => {
          const tGid = Number(t.gorev || t.gorev_id || t.gorev_obj?.id)
          return tGid === Number(g.id) || (g.program_task_key && (t.program_task_key === g.program_task_key || t.gorev_obj?.program_task_key === g.program_task_key))
        })
        return {
          ...g,
          teslim: matchedTeslim || null
        }
      })
      setGorevler(veriler)

      // DNA
      if (dData) {
        setDnaData(dData)
        if (dData.cevaplar && typeof dData.cevaplar === 'object') {
          setDnaAnswers(prev => ({ ...normalizeDnaAnswers(dData.cevaplar), ...prev }))
        }
      }

      // Performans
      if (pData) {
        setPerformans(pData)
        setPerformansError(null)
      } else {
        setPerformans(null)
        setPerformansError('Performans bilgileriniz henüz oluşturulmamış.')
      }

    } catch (error) {
      console.error('Katılımcı verileri çekilemedi:', error)
      if (error.message?.includes('Oturum geçersiz') || error.message?.includes('Profil bulunamadı')) {
        navigate('/login')
      }
    } finally {
      setLoading(false)
      setDnaLoading(false)
    }
  }

  const handleAnswerChange = (key, val) => {
    setDnaAnswers(prev => ({
      ...prev,
      [key]: val
    }))
  }

  const renderQuestionInput = (q) => {
    const currentVal = dnaAnswers[q.key]

    if (q.type === 'multi_choice') {
      const selectedList = getMultiChoiceArray(currentVal)
      const isOtherSelected = selectedList.some(s => s === 'Diğer' || s.startsWith('Diğer:'))
      const otherItem = selectedList.find(s => s.startsWith('Diğer:'))
      const otherText = otherItem ? otherItem.replace(/^Diğer:\s*/, '') : ''

      const handleToggle = (opt, isChecked) => {
        let newList = [...selectedList]
        if (isChecked) {
          if (q.maxSelect && newList.length >= q.maxSelect) {
            setToast({ type: 'error', message: `2. soruda en fazla ${q.maxSelect} seçim yapabilirsiniz.` })
            setTimeout(() => setToast(null), 3000)
            return
          }
          if (opt === 'Diğer') {
            const newItem = otherText.trim() ? `Diğer: ${otherText.trim()}` : 'Diğer'
            if (!newList.includes(newItem)) newList.push(newItem)
          } else {
            if (!newList.includes(opt)) newList.push(opt)
          }
        } else {
          if (opt === 'Diğer') {
            newList = newList.filter(s => s !== 'Diğer' && !s.startsWith('Diğer:'))
          } else {
            newList = newList.filter(s => s !== opt)
          }
        }
        handleAnswerChange(q.key, newList)
      }

      const handleOtherTextChange = (txt) => {
        let newList = selectedList.filter(s => s !== 'Diğer' && !s.startsWith('Diğer:'))
        if (txt.trim()) {
          newList.push(`Diğer: ${txt}`)
        } else {
          newList.push('Diğer')
        }
        handleAnswerChange(q.key, newList)
      }

      return (
        <div className="space-y-2 mt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options.map((opt) => {
              const isChecked = opt === 'Diğer'
                ? isOtherSelected
                : selectedList.includes(opt)
              const isMaxReached = Boolean(q.maxSelect && selectedList.length >= q.maxSelect && !isChecked)

              return (
                <label
                  key={opt}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${isChecked
                    ? 'bg-purple-50/80 border-purple-300 text-purple-900 font-semibold shadow-xs'
                    : isMaxReached
                      ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isMaxReached}
                    onChange={e => handleToggle(opt, e.target.checked)}
                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 border-slate-300 shrink-0"
                  />
                  <span className="leading-snug">{opt}</span>
                </label>
              )
            })}
          </div>
          {isOtherSelected && (
            <div className="pt-1">
              <input
                type="text"
                value={otherText}
                onChange={e => handleOtherTextChange(e.target.value)}
                placeholder="Diğer seçeneğinizi açıklayınız..."
                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-xs placeholder-slate-400"
              />
            </div>
          )}
        </div>
      )
    }

    if (q.type === 'single_choice') {
      const valStr = formatAnswer(currentVal)
      const isOtherSelected = valStr === 'Diğer' || valStr.startsWith('Diğer:')
      const otherText = valStr.startsWith('Diğer:') ? valStr.replace(/^Diğer:\s*/, '') : ''

      const handleSelect = (opt) => {
        if (opt === 'Diğer') {
          handleAnswerChange(q.key, otherText ? `Diğer: ${otherText}` : 'Diğer')
        } else {
          handleAnswerChange(q.key, opt)
        }
      }

      const handleOtherTextChange = (txt) => {
        handleAnswerChange(q.key, txt.trim() ? `Diğer: ${txt}` : 'Diğer')
      }

      return (
        <div className="space-y-2 mt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options.map((opt) => {
              const isChecked = opt === 'Diğer'
                ? isOtherSelected
                : valStr === opt

              return (
                <label
                  key={opt}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${isChecked
                    ? 'bg-purple-50/80 border-purple-300 text-purple-900 font-semibold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  <input
                    type="radio"
                    name={`radio_${q.key}`}
                    checked={isChecked}
                    onChange={() => handleSelect(opt)}
                    className="mt-0.5 text-purple-600 focus:ring-purple-500 border-slate-300 shrink-0"
                  />
                  <span className="leading-snug">{opt}</span>
                </label>
              )
            })}
          </div>
          {isOtherSelected && (
            <div className="pt-1">
              <input
                type="text"
                value={otherText}
                onChange={e => handleOtherTextChange(e.target.value)}
                placeholder="Diğer seçeneğinizi açıklayınız..."
                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-xs placeholder-slate-400"
              />
            </div>
          )}
        </div>
      )
    }

    if (q.type === 'scale') {
      const valStr = formatAnswer(currentVal)
      return (
        <div className="mt-2">
          <div className="flex items-center gap-2 max-w-xs">
            {q.options.map((val) => {
              const isSelected = valStr === val
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAnswerChange(q.key, val)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-600 shadow-md scale-105'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-200'
                    }`}
                >
                  {val}
                </button>
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-medium max-w-xs mt-1.5 px-1">
            <span>1 (Çok zorlanıyorum)</span>
            <span>5 (Çok rahatım)</span>
          </div>
        </div>
      )
    }

    const valStr = formatAnswer(currentVal)
    return (
      <textarea
        rows={3}
        value={valStr}
        onChange={e => handleAnswerChange(q.key, e.target.value)}
        placeholder={q.placeholder || 'Cevabınızı yazınız...'}
        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs placeholder-slate-400 resize-none transition-all mt-1"
      />
    )
  }

  const handleDnaSubmit = async (e) => {
    e.preventDefault()

    const missing = QUESTIONS.filter(q => !isQuestionFilled(q.key, dnaAnswers))
    if (missing.length > 0) {
      const completedCount = QUESTIONS.filter(q => isQuestionFilled(q.key, dnaAnswers)).length
      const firstMissingStep = WIZARD_STEPS.find(step => step.questionKeys.some(k => !isQuestionFilled(k, dnaAnswers)))
      if (firstMissingStep) {
        setCurrentStep(firstMissingStep.id)
      }
      setToast({ type: 'error', message: `Lütfen tüm 20 soruyu cevaplayınız (${completedCount}/20 tamamlandı).` })
      setTimeout(() => setToast(null), 4000)
      return
    }

    setDnaSubmitting(true)

    try {
      const updated = await submitIcerikDna(dnaAnswers)
      setDnaData(updated)
      if (updated.durum === 'HATA') {
        setToast({ type: 'error', message: updated.hata_mesaji || 'Rapor oluşturulurken hata oluştu.' })
      } else {
        setToast({ type: 'success', message: 'İçerik DNA Testi başarıyla gönderildi!' })
      }
      setTimeout(() => setToast(null), 4000)
    } catch (err) {
      console.error('DNA submit hatası:', err)
      setToast({ type: 'error', message: err.message || 'Bağlantı hatası oluştu.' })
      setTimeout(() => setToast(null), 4000)
    } finally {
      setDnaSubmitting(false)
    }
  }

  useEffect(() => {
    fetchData()
    recordParticipantActivity('panel_open', '/katilimci').catch(() => {})

    // Her 5 dakikada bir arka plan aktivite sinyali (activity_ping) gönder
    const pingInterval = setInterval(() => {
      recordParticipantActivity('activity_ping', '/katilimci').catch(() => {})
    }, 5 * 60 * 1000)

    return () => {
      clearInterval(pingInterval)
    }
  }, [])

  // Aktif sekme 'program' olduğunda haftaları otomatik tazele
  useEffect(() => {
    if (activeTab === 'program') {
      fetchProgramHaftalari(programHaftalari.length === 0)
    }
  }, [activeTab])

  // Pencere odaklandığında veya sekme görünür olduğunda programı arka planda tazele
  useEffect(() => {
    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible' && activeTab === 'program') {
        fetchProgramHaftalari(false)
      }
    }
    window.addEventListener('focus', handleFocusOrVisible)
    document.addEventListener('visibilitychange', handleFocusOrVisible)
    return () => {
      window.removeEventListener('focus', handleFocusOrVisible)
      document.removeEventListener('visibilitychange', handleFocusOrVisible)
    }
  }, [activeTab])

  const handleLogout = async () => {
    await logoutUser()
    navigate('/login', { replace: true })
  }

  const openModal = (gorev) => {
    setSelectedGorev(gorev)
    setFile(null)
    setLink(gorev.teslim?.teslim_linki || '')
    setNot(gorev.teslim?.aciklama || '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const effectiveGorevId = selectedGorev?.id || selectedGorev?.teslim?.gorev_id || selectedGorev?.teslim?.gorev
    if (!effectiveGorevId) {
      setToast({ type: 'error', message: 'Görev bilgisi bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.' })
      return
    }

    const cleanLink = typeof link === 'string' ? link.trim() : ''
    if (!file && !cleanLink) {
      setToast({ type: 'error', message: 'Lütfen bir dosya yükleyin veya harici bağlantı girin.' })
      return
    }

    setSubmitting(true)

    try {
      await submitKatilimciTeslim({
        gorev_id: effectiveGorevId,
        teslim_linki: cleanLink,
        aciklama: not || '',
        file: file
      })

      setToast({ type: 'success', message: 'Tesliminiz başarıyla yüklendi!' })
      setTimeout(() => setToast(null), 3000)
      setSelectedGorev(null)
      fetchData()
    } catch (err) {
      console.error('Gönderim başarısız:', err)
      setToast({ type: 'error', message: err?.message || 'Gönderim sırasında hata oluştu.' })
      setTimeout(() => setToast(null), 5000)
    } finally {
      setSubmitting(false)
    }
  }

  const displayName = katilimci?.ad_soyad || username
  const tamamlaniSayisi = gorevler.filter(g => g.teslim?.durum === 'TAMAMLANDI' || g.teslim?.degerlendirildi).length

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800 max-w-full overflow-x-hidden">

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className="w-full md:w-64 flex-shrink-0 bg-white border-b md:border-b-0 md:border-r border-slate-100 shadow-sm flex flex-col z-20">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-md shadow-orange-200">
              <span className="text-white font-black text-xs">GD</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-tight">Dijital Sağlık</p>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Katılımcı Paneli</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-x-auto md:overflow-x-visible flex md:flex-col gap-1 md:gap-1">
          <p className="hidden md:block text-[10px] text-slate-400 font-semibold uppercase tracking-widest px-4 mb-2">Menü</p>
          {[
            { key: 'genel', label: 'Genel Bakış', icon: <Ic.Dashboard /> },
            { key: 'program', label: 'Haftalık Program', icon: <Ic.Calendar /> },
            { key: 'gorevler', label: 'Görevlerim', icon: <Ic.Task /> },
            { key: 'dna', label: 'İçerik DNA Testi', icon: <Ic.Dna /> },
            { key: 'profil', label: 'Profil / Takım', icon: <Ic.User /> },
          ].map(({ key, ...rest }) => (
            <NavItem key={key} {...rest} active={activeTab === key} onClick={() => setActiveTab(key)} />
          ))}
        </nav>

        <div className="hidden md:block px-4 py-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50">
            {(!imgError && (profilePhotoPreview || getParticipantAvatarSrc(katilimci, 120))) ? (
              <img
                src={profilePhotoPreview || getParticipantAvatarSrc(katilimci, 120)}
                alt={displayName}
                onError={() => setImgError(true)}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-orange-200 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate">{displayName}</p>
              <p className="text-[10px] text-slate-400 truncate">{takim?.takim_adi || 'Takımsız'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
            <Ic.Logout /><span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main className="flex-1 overflow-auto flex flex-col">

        {/* Topbar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 sm:px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              {activeTab === 'genel' && '📊 Genel Bakış'}
              {activeTab === 'program' && '📅 Haftalık Program'}
              {activeTab === 'gorevler' && '📋 Görevlerim & Teslimler'}
              {activeTab === 'dna' && '🧬 İçerik DNA Testi'}
              {activeTab === 'profil' && '👤 Profil & Takım Bilgilerim'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Geleceğin Dijital Sağlık Liderleri Programı
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 transition-all disabled:opacity-50"
            >
              <span className={loading ? 'animate-spin inline-block' : 'inline-block'}>
                <Ic.Refresh c="w-3.5 h-3.5" />
              </span>
              Yenile
            </button>
            <button onClick={handleLogout} className="md:hidden p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50">
              <Ic.Logout c="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg border text-xs font-bold animate-slide-up ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {toast.message}
          </div>
        )}

        {/* Tab Contents */}
        <div className="p-6 sm:p-8 space-y-6 flex-1">

          {loading ? (
            <div className="animate-pulse space-y-6">
              <div className="h-32 bg-white rounded-2xl border border-slate-100" />
              <div className="h-64 bg-white rounded-2xl border border-slate-100" />
            </div>
          ) : (
            <>
              {/* ════════ TAB 1: GENEL BAKIŞ ════════ */}
              {activeTab === 'genel' && (
                <div className="space-y-6">

                  {/* Hero Banner Kartı */}
                  <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 skew-x-12 pointer-events-none" />

                    <div className="relative z-10 space-y-2">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm border border-white/20">
                        {katilimci?.program_katilim_durumu || 'AKTİF'} Katılımcı
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                        Hoş geldin, {displayName}! 👋
                      </h2>
                      <p className="text-white/80 text-sm font-medium">
                        Takımınız: <span className="font-bold text-white">{takim?.takim_adi || 'Takım Bilgisi Bekleniyor'}</span>
                      </p>
                    </div>

                    <div className="relative z-10 flex items-center gap-4 bg-white/15 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 shadow-inner">
                      <div className="w-12 h-12 rounded-xl bg-white text-orange-500 flex items-center justify-center shadow-sm">
                        <Ic.Trophy />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Takım Puanı</p>
                        <p className="text-3xl font-black text-white leading-none tabular-nums">{takim?.toplam_puan || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Özet Stat Kartları Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                        <Ic.User c="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Takımınız</p>
                        <p className="text-base font-bold text-slate-800 truncate max-w-[140px]">{takim?.takim_adi || 'Atanmadı'}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Ic.Task c="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Görev Durumu</p>
                        <p className="text-base font-bold text-slate-800">{tamamlaniSayisi} / {gorevler.length} Tamamlandı</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                        <Ic.Dna c="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İçerik DNA</p>
                        <p className="text-base font-bold text-slate-800">
                          {dnaData?.durum === 'TAMAMLANDI' ? '✅ Rapor Hazır' : dnaData?.durum === 'ISLENIYOR' ? '⏳ İşleniyor' : '📝 Bekliyor'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                        <Ic.Trophy c="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bireysel Puan</p>
                        <p className="text-base font-bold text-amber-700">{performans ? `${Number(performans.bireysel_puan) || 0} Puan` : '—'}</p>
                      </div>
                    </div>

                  </div>

                  {/* Bireysel Performans Özet Kartı */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                          ⭐
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Bireysel Performans & Puan Özeti</h3>
                          <p className="text-[11px] text-slate-400">Takım puanından bağımsız kişisel gelişim skorunuz</p>
                        </div>
                      </div>
                      {performans && (
                        <span className="font-black text-base text-amber-700 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200 shadow-2xs">
                          {Number(performans.bireysel_puan) || 0} Puan
                        </span>
                      )}
                    </div>

                    {performans ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 text-center">
                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Bireysel Puan</p>
                            <p className="text-xl font-black text-amber-800 mt-0.5 tabular-nums">{Number(performans.bireysel_puan) || 0}</p>
                          </div>
                          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3 text-center">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Görev Puanı</p>
                            <p className="text-xl font-extrabold text-blue-800 mt-0.5 tabular-nums">{Number(performans.gorev_puani) || 0}</p>
                          </div>
                          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 text-center">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Toplantı Puanı</p>
                            <p className="text-xl font-extrabold text-emerald-800 mt-0.5 tabular-nums">{Number(performans.toplanti_katilim_puani) || 0}</p>
                          </div>
                          <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-3 text-center">
                            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Etkileşim Bonusu</p>
                            <p className="text-xl font-extrabold text-purple-800 mt-0.5 tabular-nums">{Number(performans.etkilesim_bonus_puani) || 0}</p>
                          </div>
                          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Manuel Puan</p>
                            <p className="text-xl font-extrabold text-slate-800 mt-0.5 tabular-nums">{Number(performans.manuel_puan) || 0}</p>
                          </div>
                        </div>

                        {performans.katilimciya_gorunen_not && String(performans.katilimciya_gorunen_not).trim() && (
                          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 space-y-1">
                            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                              👁️ Değerlendirme Notunuz
                            </span>
                            <p className="text-xs text-emerald-900 leading-relaxed italic">
                              "{performans.katilimciya_gorunen_not}"
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-500 italic">
                        Performans bilgileriniz henüz oluşturulmamış.
                      </div>
                    )}
                  </div>

                  {/* Hızlı Erişim Kartları */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg">
                            🗓️
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm">Haftalık Program</h3>
                            <p className="text-[11px] text-slate-400">Canlı oturumlar & eğitim linkleri</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          3 haftalık canlı dersler, atölyeler, soru-cevap oturumları ve saha görevleri.
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => setActiveTab('program')}
                          className="w-full px-4 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs border border-orange-200 transition-all inline-flex items-center justify-center gap-2"
                        >
                          Programı Gör →
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            <Ic.Task />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm">Haftalık Görevler</h3>
                            <p className="text-[11px] text-slate-400">{tamamlaniSayisi} / {gorevler.length} tamamlandı</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Takım görevlerinizi tamamlayın, dosya/link yükleyin ve mentor geri bildirimlerini inceleyin.
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => setActiveTab('gorevler')}
                          className="w-full px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs border border-blue-200 transition-all inline-flex items-center justify-center gap-2"
                        >
                          Görevlere Git →
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                            🧬
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm">İçerik DNA Analizi</h3>
                            <p className="text-[11px] text-slate-400">Yapay zeka strateji raporu</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          20 soruluk testi doldurarak kişiselleştirilmiş içerik stratejisi raporunuzu keşfedin.
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => setActiveTab('dna')}
                          className="w-full px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 font-bold text-xs border border-purple-200 transition-all inline-flex items-center justify-center gap-2"
                        >
                          DNA Testine Git →
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* ════════ TAB: HAFTALIK PROGRAM ════════ */}
              {activeTab === 'program' && (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* Başlık & Açıklama & Yenile Butonu */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">🗓️</span>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Haftalık Eğitim Programı</h2>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Canlı eğitimler, uygulamalı atölyeler, saha görevleri ve eğitim linkleri bu alanda paylaşılır.
                      </p>
                    </div>

                    <button
                      id="btn-refresh-program"
                      type="button"
                      onClick={() => fetchProgramHaftalari(true)}
                      disabled={programLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition-all self-start sm:self-auto disabled:opacity-50"
                    >
                      <span className={programLoading ? 'animate-spin inline-block' : 'inline-block'}>
                        <Ic.Refresh c="w-3.5 h-3.5" />
                      </span>
                      <span>{programLoading ? 'Yenileniyor...' : 'Programı Yenile'}</span>
                    </button>
                  </div>

                  {/* Üst 4'lü Özet Kartları */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-soft flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-lg shrink-0 shadow-2xs">
                        {PROGRAM_SUMMARY.totalWeeks}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Eğitim Süreci</p>
                        <p className="text-sm sm:text-base font-extrabold text-slate-800">3 Hafta</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-soft flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-black text-lg shrink-0 shadow-2xs">
                        {PROGRAM_SUMMARY.totalDays}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Canlı Ders</p>
                        <p className="text-sm sm:text-base font-extrabold text-slate-800">6 Canlı Gün</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-soft flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-black text-lg shrink-0 shadow-2xs">
                        {PROGRAM_SUMMARY.totalSessions}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modül & Pratik</p>
                        <p className="text-sm sm:text-base font-extrabold text-slate-800">18 Oturum</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-soft flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-lg shrink-0 shadow-2xs">
                        {PROGRAM_SUMMARY.totalTasks}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Uygulama</p>
                        <p className="text-sm sm:text-base font-extrabold text-slate-800">3 Saha Görevi</p>
                      </div>
                    </div>
                  </div>

                  {/* Haftalar Listesi (Decoupled from tasks) */}
                  {programLoading && programHaftalari.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-soft border border-slate-100 space-y-4 animate-pulse">
                      <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-2xl mx-auto shadow-2xs">
                        ⏳
                      </div>
                      <h3 className="text-base font-bold text-slate-800">Haftalık program yükleniyor...</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        Canlı ders bilgileri ve haftalık oturumlar alınıyor.
                      </p>
                    </div>
                  ) : programError && programHaftalari.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-soft border border-red-100 space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-2xl mx-auto shadow-2xs">
                        ⚠️
                      </div>
                      <h3 className="text-base font-bold text-slate-800">Program bilgileri alınamadı</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        {programError}
                      </p>
                      <button
                        type="button"
                        onClick={() => fetchProgramHaftalari(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        <Ic.Refresh c="w-3.5 h-3.5" />
                        Tekrar Dene
                      </button>
                    </div>
                  ) : programHaftalari.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-soft border border-slate-100 space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto shadow-2xs">
                        📅
                      </div>
                      <h3 className="text-base font-bold text-slate-800">Haftalık program henüz açılmadı</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        Eğitim haftaları admin tarafından açıldığında canlı ders Zoom bağlantıları ve oturum detayları burada görünecektir.
                      </p>
                      <button
                        type="button"
                        onClick={() => fetchProgramHaftalari(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                      >
                        <Ic.Refresh c="w-3.5 h-3.5" />
                        Programı Yenile
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {programHaftalari.map((weekData) => {
                        const activeTask = (gorevler || []).find(g =>
                          g.program_task_key === weekData.fieldTask?.taskKey ||
                          g.gorev_adi === weekData.fieldTask?.title ||
                          g.gorev_adi === weekData.fieldTask?.taskTitle ||
                          Number(g.program_week || g.hafta) === Number(weekData.hafta || weekData.week)
                        )

                        return (
                          <div
                            key={weekData.hafta || weekData.week}
                            className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden transition-all"
                          >
                            {/* Hafta Başlık & Materyal Barı */}
                            <div className="bg-gradient-to-r from-orange-50/90 via-pink-50/70 to-purple-50/50 p-6 sm:p-7 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-5">
                              <div className="space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-black px-3.5 py-1 rounded-full shadow-xs tracking-wide">
                                    {weekData.hafta || weekData.week}. HAFTA
                                  </span>
                                  <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                                    {weekData.title}
                                  </h3>
                                </div>
                              </div>

                              {/* Materyal Butonu / Durumu */}
                              <div className="flex flex-wrap items-center gap-2.5">
                                {activeTask?.material_url ? (
                                  <a
                                    href={activeTask.material_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet to-purple-600 hover:from-violet/90 hover:to-purple-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all"
                                  >
                                    <span>📄</span>
                                    <span>{activeTask.material_title || 'Eğitim Materyalini Aç'} ({activeTask.material_type || 'PDF'}) ↗</span>
                                  </a>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs border border-slate-200/80">
                                    <span>📄</span>
                                    <span>Materyal yakında eklenecek</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="p-6 sm:p-7 space-y-6">
                              {/* Haftanın Hedefi & Format */}
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                {/* Hedef */}
                                <div className="lg:col-span-8 bg-amber-50/60 border border-amber-200/70 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
                                  <div className="w-8 h-8 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center font-bold text-base shrink-0 mt-0.5 shadow-2xs">
                                    🎯
                                  </div>
                                  <div className="space-y-1 min-w-0">
                                    <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Haftanın Hedefi</h4>
                                    <p className="text-xs sm:text-[13px] text-amber-950/90 leading-relaxed">
                                      {weekData.goal}
                                    </p>
                                  </div>
                                </div>

                                {/* Format / Akış */}
                                <div className="lg:col-span-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-2">
                                  <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <span>⏱️</span> Oturum Akış Planı
                                  </h4>
                                  <div className="space-y-1.5">
                                    {(weekData.format || []).map((fmt, i) => (
                                      <div key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-snug">
                                        <span className="text-orange-500 font-bold">•</span>
                                        <span>{fmt}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Günler ve Oturumlar (Salı & Perşembe Canlı Dersleri ve Zoom Bilgileri) */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
                                {(weekData.days || []).map((dayData, dayIdx) => {
                                  const isTuesday = dayData.dayName.toLowerCase().includes('salı')
                                  const isThursday = dayData.dayName.toLowerCase().includes('perşembe')

                                  return (
                                    <div
                                      key={dayIdx}
                                      className={`rounded-3xl p-6 sm:p-7 space-y-5 flex flex-col shadow-xs relative overflow-hidden transition-all border-2 ${
                                        isTuesday
                                          ? 'bg-gradient-to-b from-amber-50/60 via-orange-50/30 to-white border-amber-200/90'
                                          : 'bg-gradient-to-b from-indigo-50/60 via-violet-50/30 to-white border-indigo-200/90'
                                      }`}
                                    >
                                      {/* Üst Dekoratif Çizgi */}
                                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                                        isTuesday
                                          ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                          : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                      }`} />

                                      {/* Gün Başlığı ve Saat */}
                                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b ${
                                        isTuesday ? 'border-amber-200/80' : 'border-indigo-200/80'
                                      }`}>
                                        <div className="space-y-1">
                                          <span className={`inline-flex items-center gap-1 text-[11px] font-black px-3 py-1 rounded-xl shadow-2xs uppercase tracking-wider ${
                                            isTuesday
                                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-200'
                                              : 'bg-gradient-to-r from-indigo-600 to-violet text-white shadow-indigo-200'
                                          }`}>
                                            🗓️ {isTuesday ? '1. GÜN · SALI EĞİTİMİ' : isThursday ? '2. GÜN · PERŞEMBE EĞİTİMİ' : `${dayData.dayName} EĞİTİMİ`}
                                          </span>
                                          <h4 className="text-sm sm:text-base font-black text-slate-800 tracking-tight pt-1">
                                            {dayData.title}
                                          </h4>
                                          <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                            <span>🕒</span> Canlı eğitim: 19:00 İstanbul
                                          </p>
                                        </div>
                                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border self-start sm:self-auto ${
                                          isTuesday
                                            ? 'text-amber-800 bg-amber-100/90 border-amber-200'
                                            : 'text-indigo-800 bg-indigo-100/90 border-indigo-200'
                                        }`}>
                                          3 Oturum
                                        </span>
                                      </div>

                                      {/* Zoom & Takvim Katılım Kartı */}
                                      <div className={`p-4 rounded-2xl border space-y-3 ${
                                        isTuesday ? 'bg-amber-100/40 border-amber-200/80' : 'bg-indigo-100/40 border-indigo-200/80'
                                      }`}>
                                        <div className="flex flex-wrap items-center gap-2.5">
                                          {dayData.zoom_url && (
                                            <a
                                              href={dayData.zoom_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs hover:shadow transition-all ${
                                                isTuesday
                                                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
                                                  : 'bg-gradient-to-r from-indigo-600 to-violet hover:from-indigo-700 hover:to-violet/90'
                                              }`}
                                            >
                                              <span>📹</span>
                                              <span>Zoom'a Katıl ↗</span>
                                            </a>
                                          )}
                                          {dayData.calendar_url && (
                                            <a
                                              href={dayData.calendar_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs transition-all"
                                            >
                                              <span>📅</span>
                                              <span>Takvime Ekle (.ics) ↗</span>
                                            </a>
                                          )}
                                        </div>
                                        {(dayData.meeting_id || dayData.passcode) && (
                                          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-700 bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200/60">
                                            {dayData.meeting_id && (
                                              <span><strong>Meeting ID:</strong> {dayData.meeting_id}</span>
                                            )}
                                            {dayData.passcode && (
                                              <span><strong>Parola:</strong> {dayData.passcode}</span>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {/* 3 Oturum Kartları */}
                                      <div className="space-y-3 flex-1">
                                        {(dayData.sessions || []).length === 0 ? (
                                          <div className="bg-white/80 border border-slate-200/60 rounded-2xl p-4 text-center text-xs text-slate-500 italic">
                                            Oturum içerikleri yakında güncellenecek
                                          </div>
                                        ) : (
                                          (dayData.sessions || []).map((session, sIdx) => (
                                            <div
                                              key={sIdx}
                                              className={`bg-white border rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all space-y-1.5 ${
                                                isTuesday ? 'border-amber-100 hover:border-amber-200' : 'border-indigo-100 hover:border-indigo-200'
                                              }`}
                                            >
                                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <div className="flex items-center gap-1.5">
                                                  <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                                                    isTuesday
                                                      ? 'bg-orange-100 text-orange-700'
                                                      : 'bg-indigo-100 text-indigo-700'
                                                  }`}>
                                                    {session.sessionNumber}
                                                  </span>
                                                  <h5 className="font-extrabold text-slate-800 text-xs">
                                                    {session.title}
                                                  </h5>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                  {session.guest && (
                                                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                                                      🎙️ {session.guest}
                                                    </span>
                                                  )}
                                                  {session.duration && (
                                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                                      ⏱️ {session.duration}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                              {session.description && (
                                                <p className="text-[11px] text-slate-600 leading-relaxed pl-6">
                                                  {session.description}
                                                </p>
                                              )}
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>

                              {/* Haftanın Saha / Final Görevi (Görev aktifliğinden bağımsız hafta görünümü) */}
                              {(() => {
                                const isTaskActive = (gorevler || []).some(g =>
                                  g.program_task_key === weekData.fieldTask?.taskKey ||
                                  g.gorev_adi === weekData.fieldTask?.title ||
                                  g.gorev_adi === weekData.fieldTask?.taskTitle ||
                                  (Number(g.hafta) === Number(weekData.hafta || weekData.week) && g.gorev_adi?.toLowerCase().includes((weekData.fieldTask?.taskTitle || weekData.fieldTask?.title || '').toLowerCase()))
                                )

                                return (
                                  <div className={`border rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                                    isTaskActive
                                      ? 'bg-gradient-to-r from-orange-50/90 via-pink-50/80 to-purple-50/70 border-orange-200/90 shadow-sm'
                                      : 'bg-slate-50/70 border-slate-200/80'
                                  }`}>
                                    <div className="flex items-start gap-4">
                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-md shrink-0 ${
                                        isTaskActive
                                          ? 'bg-gradient-to-br from-orange-400 to-pink-500 text-white'
                                          : 'bg-slate-200 text-slate-500'
                                      }`}>
                                        {weekData.fieldTask?.type?.includes('Final') ? '🏆' : '🚀'}
                                      </div>
                                      <div className="space-y-1.5 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                                            isTaskActive
                                              ? 'text-orange-800 bg-orange-200/70 border-orange-300/80'
                                              : 'text-slate-600 bg-slate-200 border-slate-300'
                                          }`}>
                                            {weekData.fieldTask?.type || 'Saha Görevi'}
                                          </span>
                                          <h4 className="text-sm font-black text-slate-800">
                                            {weekData.fieldTask?.title}
                                          </h4>
                                          {isTaskActive ? (
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                              Aktif Görev
                                            </span>
                                          ) : (
                                            <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full border border-slate-300 inline-flex items-center gap-1">
                                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                              Henüz Açılmadı
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-slate-700 leading-relaxed">
                                          {weekData.fieldTask?.description}
                                        </p>
                                        {isTaskActive ? (
                                          <p className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 mt-1">
                                            <span>🟢</span> Bu görev aktif! Görevlerim sekmesinden detayları inceleyebilir ve teslim yükleyebilirsiniz.
                                          </p>
                                        ) : (
                                          <p className="text-[11px] text-slate-500 italic mt-1">
                                            ⏳ Bu görev henüz açılmadı. Canlı eğitim oturumu sonrasında aktif edilecektir.
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {isTaskActive ? (
                                      <button
                                        type="button"
                                        onClick={() => setActiveTab('gorevler')}
                                        className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold text-xs shadow-sm hover:shadow transition-all self-start sm:self-center"
                                      >
                                        <span>Göreve Git</span>
                                        <span>➔</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled
                                        className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs border border-slate-200/80 cursor-not-allowed self-start sm:self-center"
                                      >
                                        <span>Yakında Açılacak</span>
                                      </button>
                                    )}
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
          </div>
        )}

              {/* ════════ TAB 2: GÖREVLERİM ════════ */}
              {activeTab === 'gorevler' && (
                <div className="space-y-6">

                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-800">Haftalık Görevler ve Teslimler</h2>
                      <p className="text-xs text-slate-400 mt-0.5">{gorevler.length} görev tanımlı</p>
                    </div>
                  </div>

                  {gorevler.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-soft border border-slate-100">
                      <p className="text-slate-400 font-medium">Henüz takımınıza atanmış bir görev bulunmuyor.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {gorevler.map((item) => {
                        const gorev = item
                        const teslim = item?.teslim

                        const durumCode = teslim?.durum || (teslim?.degerlendirildi ? (teslim?.revizyon_istendi ? 'REVIZYON_ISTENDI' : 'TAMAMLANDI') : (teslim ? 'BEKLIYOR' : null))
                        const isCompleted = durumCode === 'TAMAMLANDI'
                        const isRevisionRequested = durumCode === 'REVIZYON_ISTENDI'

                        let buttonText = 'Teslim Yükle'
                        if (durumCode === 'REVIZYON_ISTENDI') buttonText = 'Revize Teslim Yükle 🔄'
                        else if (durumCode === 'BEKLIYOR' || durumCode === 'REVIZE_EDILDI') buttonText = 'Teslimi Güncelle'
                        else if (durumCode === 'TAMAMLANDI') buttonText = 'Detay & Geçmişi İncele'

                        const isProgramTask = Boolean(gorev?.program_task_key || gorev?.program_week)
                        const isFinalTask = gorev?.program_task_type === 'final_gorevi' || gorev?.gorev_adi?.toLowerCase().includes('final')

                        if (isProgramTask) {
                          return (
                            <div
                              key={gorev?.id || Math.random()}
                              className="bg-white rounded-3xl border border-orange-200/90 shadow-soft overflow-hidden transition-all hover:shadow-card relative"
                            >
                              {/* Üst Renkli Çizgi */}
                              <div className="h-1.5 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600" />

                              {/* Başlık ve Rozetler Barı */}
                              <div className="p-6 sm:p-7 bg-gradient-to-r from-orange-50/60 via-pink-50/40 to-purple-50/30 border-b border-orange-100/70 flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="space-y-2 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider shadow-2xs ${
                                      isFinalTask
                                        ? 'bg-purple-600 text-white shadow-purple-200'
                                        : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-orange-200'
                                    }`}>
                                      {isFinalTask ? '🏆 Final Görevi' : `🚀 ${gorev.hafta || 1}. Hafta Saha Görevi`}
                                    </span>
                                    <span className="text-[11px] font-black text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200">
                                      ★ {gorev?.maksimum_puan ?? 100} Puan
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200/80">
                                      <Ic.Clock />
                                      Son Teslim: {gorev?.son_teslim_tarihi ? new Date(gorev.son_teslim_tarihi).toLocaleDateString('tr-TR') : 'Belirtilmedi'}
                                    </span>
                                  </div>
                                  <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
                                    {gorev?.gorev_adi || 'Program Görevi'}
                                  </h3>
                                </div>

                                <div className="shrink-0 self-start">
                                  <StatusBadge durum={durumCode} degerlendirildi={teslim?.degerlendirildi} revizyon={teslim?.revizyon_istendi} />
                                </div>
                              </div>

                              <div className="p-6 sm:p-7 space-y-5">
                                {/* Brief ve Açıklama */}
                                <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 space-y-2">
                                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Görev Açıklaması</h4>
                                  <p className="text-slate-700 leading-relaxed text-xs sm:text-sm whitespace-pre-line">
                                    {gorev?.brief_aciklama || 'Açıklama bulunmuyor.'}
                                  </p>
                                </div>

                                {/* Değerlendirme Kriterleri (Varsa) */}
                                {gorev?.puan_kriterleri && (
                                  <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/60">
                                    <h4 className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                      <span>🏆</span> Değerlendirme Esasları
                                    </h4>
                                    <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line">
                                      {gorev.puan_kriterleri}
                                    </p>
                                  </div>
                                )}

                                {/* Materyal Linki (Varsa) */}
                                {gorev?.material_url && (
                                  <div className="bg-violet-50/60 rounded-2xl p-4 border border-violet/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">📄</span>
                                      <div>
                                        <p className="text-xs font-bold text-gray-800">{gorev.material_title || 'Haftalık Eğitim & Vaka Materyali'}</p>
                                        <p className="text-[10px] text-gray-500">Bu görevi hazırlarken eğitim materyalini referans alabilirsiniz.</p>
                                      </div>
                                    </div>
                                    <a
                                      href={gorev.material_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-violet hover:bg-violet/90 text-white font-bold text-xs shadow-2xs transition-all self-start sm:self-center"
                                    >
                                      <span>Materyali İncele</span>
                                      <span>↗</span>
                                    </a>
                                  </div>
                                )}

                                {/* Yüklenen Dosya */}
                                {(teslim?.teslim_dosyasi_url || teslim?.teslim_dosyasi || teslim?.teslim_linki) && (
                                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Yüklenen Dosya:</span>
                                    <a
                                      href={teslim.teslim_dosyasi_url || teslim.teslim_dosyasi || teslim.teslim_linki}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1.5"
                                    >
                                      📎 Dosyayı Görüntüle / İndir
                                    </a>
                                  </div>
                                )}

                                {/* Mentor Geri Bildirim veya Revizyon Notu Kartı */}
                                {isCompleted ? (
                                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                      <div className="flex flex-col items-center justify-center w-16 h-16 bg-white rounded-xl shadow-xs border border-emerald-100 shrink-0">
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">Puan</span>
                                        <span className="font-black text-2xl text-emerald-600 leading-none">
                                          {teslim?.alinan_puan ?? '-'}
                                        </span>
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="font-bold text-emerald-800 text-xs mb-1.5">Mentor Geri Bildirimi</h4>
                                        <p className="text-xs text-emerald-700/80 leading-relaxed bg-white/60 rounded-lg p-3 border border-emerald-100/50">
                                          {teslim?.mentor_yorumu || 'Mentor tarafından yazılı geri bildirim bırakılmamış.'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ) : isRevisionRequested ? (
                                  <div className="bg-orange-50/80 rounded-2xl p-4 border border-orange-200/80">
                                    <h4 className="font-bold text-orange-800 text-xs mb-1 flex items-center gap-1.5">
                                      <Ic.Info c="w-4 h-4 text-orange-600" />
                                      Mentor Revizyon İstedi:
                                    </h4>
                                    <p className="text-xs text-orange-800 bg-white/80 rounded-lg p-3 border border-orange-100">
                                      {teslim?.mentor_yorumu || 'Mentor tarafından açıklama eklenmiş.'}
                                    </p>
                                  </div>
                                ) : null}

                                {/* Teslim Hareketleri ve İşlem Geçmişi */}
                                {teslim?.hareketler && teslim.hareketler.length > 0 && (
                                  <div className="pt-2 border-t border-slate-100">
                                    <details className="text-xs group" open={isRevisionRequested}>
                                      <summary className="cursor-pointer font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1.5 select-none">
                                        <span>📜 Görev Teslim & Revizyon Geçmişiniz ({teslim.hareketler.length} hareket)</span>
                                      </summary>
                                      <div className="mt-3 pl-1">
                                        <TeslimTimeline hareketler={teslim.hareketler} />
                                      </div>
                                    </details>
                                  </div>
                                )}

                                {/* Buton */}
                                <div className="flex justify-end pt-2 border-t border-slate-100">
                                  <button
                                    onClick={() => openModal(gorev)}
                                    className={`flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-xs shadow-md transition-all ${
                                      isRevisionRequested
                                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-orange-200 hover:shadow-lg'
                                        : isCompleted
                                          ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                                          : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-orange-200 hover:shadow-lg'
                                    }`}
                                  >
                                    <Ic.Upload />
                                    {buttonText}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        }

                        return (
                          <div key={gorev?.id || Math.random()} className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100 transition-all hover:shadow-card relative overflow-hidden">

                            {/* Üst bilgi */}
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5 border-b border-slate-100 pb-5">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-pink-50 flex flex-col items-center justify-center text-orange-600 border border-orange-100 shrink-0">
                                  <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Hafta</span>
                                  <span className="text-lg font-black leading-none">{gorev?.hafta || '-'}</span>
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold text-slate-800 mb-1">{gorev?.gorev_adi || 'Görev Adı Bulunamadı'}</h3>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                                      <Ic.Clock />
                                      Son Teslim: {gorev?.son_teslim_tarihi ? new Date(gorev.son_teslim_tarihi).toLocaleDateString('tr-TR') : 'Belirtilmedi'}
                                    </p>
                                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-flex items-center gap-1">
                                      ★ {gorev?.maksimum_puan ?? 100} Puan
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0 self-start">
                                <StatusBadge durum={durumCode} degerlendirildi={teslim?.degerlendirildi} revizyon={teslim?.revizyon_istendi} />
                              </div>
                            </div>

                            {/* Brief */}
                            <div className="bg-slate-50 rounded-xl p-4 mb-5">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Haftalık Brief</h4>
                              <p className="text-slate-600 leading-relaxed text-xs whitespace-pre-line">
                                {gorev?.brief_aciklama || 'Açıklama bulunmuyor.'}
                              </p>
                              {(teslim?.teslim_dosyasi_url || teslim?.teslim_dosyasi || teslim?.teslim_linki) && (
                                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                  <span className="font-semibold text-slate-500">Yüklenen Dosya:</span>
                                  <a
                                    href={teslim.teslim_dosyasi_url || teslim.teslim_dosyasi || teslim.teslim_linki}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1.5"
                                  >
                                    📎 Dosyayı Görüntüle / İndir
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* Mentor Geri Bildirim veya Revizyon Notu Kartı */}
                            {isCompleted ? (
                              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100 mb-5">
                                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                  <div className="flex flex-col items-center justify-center w-16 h-16 bg-white rounded-xl shadow-xs border border-emerald-100 shrink-0">
                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">Puan</span>
                                    <span className="font-black text-2xl text-emerald-600 leading-none">
                                      {teslim?.alinan_puan ?? '-'}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-bold text-emerald-800 text-xs mb-1.5">Mentor Geri Bildirimi</h4>
                                    <p className="text-xs text-emerald-700/80 leading-relaxed bg-white/60 rounded-lg p-3 border border-emerald-100/50">
                                      {teslim?.mentor_yorumu || 'Mentor tarafından yazılı geri bildirim bırakılmamış.'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : isRevisionRequested ? (
                              <div className="bg-orange-50/80 rounded-xl p-4 border border-orange-200/80 mb-5">
                                <h4 className="font-bold text-orange-800 text-xs mb-1 flex items-center gap-1.5">
                                  <Ic.Info c="w-4 h-4 text-orange-600" />
                                  Mentor Revizyon İstedi:
                                </h4>
                                <p className="text-xs text-orange-800 bg-white/80 rounded-lg p-3 border border-orange-100">
                                  {teslim?.mentor_yorumu || 'Mentor tarafından açıklama eklenmiş.'}
                                </p>
                              </div>
                            ) : null}

                            {/* Teslim Hareketleri ve İşlem Geçmişi */}
                            {teslim?.hareketler && teslim.hareketler.length > 0 && (
                              <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100">
                                <details className="text-xs group" open={isRevisionRequested}>
                                  <summary className="cursor-pointer font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1.5 select-none">
                                    <span>📜 Görev Teslim & Revizyon Geçmişiniz ({teslim.hareketler.length} hareket)</span>
                                  </summary>
                                  <div className="mt-3 pl-1">
                                    <TeslimTimeline hareketler={teslim.hareketler} />
                                  </div>
                                </details>
                              </div>
                            )}

                            {/* Buton */}
                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => openModal(gorev)}
                                className={`flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${isRevisionRequested
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-orange-200 hover:shadow-lg'
                                  : isCompleted
                                    ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                                    : 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-orange-200 hover:shadow-lg'
                                  }`}
                              >
                                <Ic.Upload />
                                {buttonText}
                              </button>
                            </div>

                          </div>
                        )
                      })}
                    </div>
                  )}

                </div>
              )}

              {/* ════════ TAB 3: İÇERİK DNA TESTİ ════════ */}
              {activeTab === 'dna' && (
                <div className="space-y-6">

                  {/* Üst Bilgi Kartı */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
                        <Ic.Dna c="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-800">20 Soruluk İçerik DNA Testi</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Cevaplarınıza göre yapay zeka kişisel içerik stratejiniz ve raporunuz oluşturulur.</p>
                      </div>
                    </div>
                    {dnaData?.durum && (
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 ${dnaData.durum === 'TAMAMLANDI' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        dnaData.durum === 'ISLENIYOR' || dnaData.durum === 'GONDERILDI' ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' :
                          dnaData.durum === 'HATA' ? 'bg-red-100 text-red-700 border-red-200' :
                            'bg-purple-100 text-purple-700 border-purple-200'
                        }`}>
                        {dnaData.durum === 'TAMAMLANDI' ? '✅ Rapor Hazır' :
                          dnaData.durum === 'ISLENIYOR' || dnaData.durum === 'GONDERILDI' ? '⏳ Rapor Hazırlanıyor' :
                            dnaData.durum === 'HATA' ? '⚠️ Hata Oluştu' : '📝 Form Bekliyor'}
                      </span>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-soft border border-slate-100">

                    {dnaLoading ? (
                      <div className="py-12 text-center text-slate-400 font-medium animate-pulse">
                        İçerik DNA Testi verileri yükleniyor...
                      </div>
                    ) : dnaError ? (
                      <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-xs font-medium flex items-center justify-between">
                        <span>{dnaError}</span>
                        <button onClick={fetchDna} className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors">
                          Tekrar Dene
                        </button>
                      </div>
                    ) : dnaData?.durum === 'ISLENIYOR' || dnaData?.durum === 'GONDERILDI' ? (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-200 text-center">
                        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                          <Ic.Clock c="w-8 h-8" />
                        </div>
                        <h4 className="text-base font-bold text-amber-900 mb-2">Raporunuz Hazırlanıyor...</h4>
                        <p className="text-xs text-amber-700 max-w-md mx-auto mb-6">
                          Test cevaplarınız başarıyla alındı. Yapay zeka içerik DNA profilinizi analiz ediyor.
                        </p>
                        <button
                          onClick={fetchDna}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all inline-flex items-center gap-2"
                        >
                          Durumu Kontrol Et
                        </button>
                      </div>
                    ) : dnaData?.durum === 'HATA' ? (
                      <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                        <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                          <Ic.Info c="w-5 h-5 text-red-600" />
                          Rapor Oluşturulurken Hata Oluştu
                        </h4>
                        <p className="text-xs text-red-600 mb-4">{dnaData.hata_mesaji || 'Bilinmeyen bir hata oluştu.'}</p>
                        <button
                          onClick={() => setDnaData(prev => ({ ...prev, durum: 'TASLAK' }))}
                          className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition-colors"
                        >
                          Formu Tekrar Doldur
                        </button>
                      </div>
                    ) : dnaData?.durum === 'TAMAMLANDI' ? (
                      <div className="space-y-6">

                        {/* Özet Stat Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-purple-50/80 border border-purple-100 rounded-xl p-3 text-center">
                            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wide block">Durum</span>
                            <p className="text-xs font-extrabold text-purple-900 mt-0.5">✅ Rapor Hazır</p>
                          </div>
                          <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-center">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">Cevaplanan</span>
                            <p className="text-xl font-black text-slate-800 mt-0.5">
                              {parseKatDnaAnswersForDisplay(dnaData.cevaplar).length}
                            </p>
                            <span className="text-[10px] text-slate-500">/ 20 Soru</span>
                          </div>
                          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-center">
                            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide block">AI Model</span>
                            <p className="text-[11px] font-bold text-blue-900 font-mono mt-0.5 truncate">{dnaData.ai_model || '—'}</p>
                          </div>
                          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 text-center">
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide block">Gönderim</span>
                            <p className="text-[10px] font-semibold text-emerald-900 mt-0.5">
                              {dnaData.gonderim_tarihi ? new Date(dnaData.gonderim_tarihi).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </p>
                          </div>
                        </div>

                        {/* Sekme Başlıkları */}
                        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                          <button
                            type="button"
                            id="btn-dna-tab-rapor"
                            onClick={() => setDnaResultTab('rapor')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                              dnaResultTab === 'rapor'
                                ? 'bg-white text-purple-700 shadow-soft border border-purple-100'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <span>🤖</span> AI Raporunuz
                          </button>
                          <button
                            type="button"
                            id="btn-dna-tab-cevaplar"
                            onClick={() => setDnaResultTab('cevaplar')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                              dnaResultTab === 'cevaplar'
                                ? 'bg-white text-indigo-700 shadow-soft border border-indigo-100'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <span>💬</span> Cevaplarım
                          </button>
                        </div>

                        {/* AI Rapor Sekmesi */}
                        {dnaResultTab === 'rapor' && (
                          <DnaReportRenderer
                            reportText={dnaData.rapor_metni}
                            aiModel={dnaData.ai_model}
                            promptVersion={dnaData.prompt_versiyonu}
                            answers={dnaData.cevaplar}
                            katilimciAdi={displayName}
                            takimAdi={takim?.takim_adi}
                            gonderimTarihi={dnaData.gonderim_tarihi}
                            isAdmin={false}
                          />
                        )}

                        {/* Cevaplarım Sekmesi */}
                        {dnaResultTab === 'cevaplar' && (() => {
                          const parsedAnswers = parseKatDnaAnswersForDisplay(dnaData.cevaplar)
                          if (parsedAnswers.length === 0) {
                            return (
                              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
                                Cevap verisi bulunamadı.
                              </div>
                            )
                          }
                          return (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-800">DNA Test Cevaplarınız</h3>
                                <span className="text-xs bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-1 rounded-full font-bold">
                                  {parsedAnswers.length} / 20 Soru
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {parsedAnswers.map((item) => (
                                  <div
                                    key={item.key}
                                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-2.5 hover:border-purple-200 hover:shadow-soft transition-all"
                                  >
                                    {/* Soru numarası + kategori */}
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      {item.soruNo && (
                                        <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md tabular-nums">
                                          #{item.soruNo}
                                        </span>
                                      )}
                                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${item.category.bg} ${item.category.text} ${item.category.border}`}>
                                        {item.category.label}
                                      </span>
                                    </div>
                                    {/* Soru başlığı */}
                                    <p className="text-[11px] font-extrabold text-slate-700 leading-snug">
                                      {item.questionTitle}
                                    </p>
                                    {/* Cevap */}
                                    <p className="text-xs text-slate-800 leading-relaxed break-words font-medium whitespace-pre-wrap border-t border-slate-100 pt-2">
                                      {item.answerText || <span className="italic text-slate-400">Cevap verilmedi.</span>}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })()}

                      </div>
                    ) : (
                      /* Form State — 5 Adımlı Wizard Yapısı */
                      <form onSubmit={handleDnaSubmit} className="space-y-6">

                        {/* Step Indicator & İlerleme Çubuğu */}
                        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-4">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span>Form İlerlemesi</span>
                            <span className="text-purple-700">
                              {QUESTIONS.filter(q => isQuestionFilled(q.key, dnaAnswers)).length} / 20 Soru Cevaplandı (%{Math.round((QUESTIONS.filter(q => isQuestionFilled(q.key, dnaAnswers)).length / 20) * 100)})
                            </span>
                          </div>

                          {/* Toplam İlerleme Çubuğu */}
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 transition-all duration-300 rounded-full"
                              style={{ width: `${(QUESTIONS.filter(q => isQuestionFilled(q.key, dnaAnswers)).length / 20) * 100}%` }}
                            />
                          </div>

                          {/* Adım Butonları (Grid) */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                            {WIZARD_STEPS.map((step) => {
                              const isCurrent = step.id === currentStep
                              const isStepComplete = step.questionKeys.every(k => isQuestionFilled(k, dnaAnswers))

                              return (
                                <button
                                  key={step.id}
                                  type="button"
                                  onClick={() => setCurrentStep(step.id)}
                                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${isCurrent
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-200'
                                    : isStepComplete
                                      ? 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                  <span className={`w-5 h-5 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 ${isCurrent
                                    ? 'bg-white text-purple-700'
                                    : isStepComplete
                                      ? 'bg-purple-200 text-purple-800'
                                      : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {isStepComplete && !isCurrent ? '✓' : step.id}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className={`text-[11px] font-bold truncate leading-tight ${isCurrent ? 'text-white' : 'text-slate-800'}`}>
                                      {step.title}
                                    </p>
                                    <p className={`text-[9px] truncate ${isCurrent ? 'text-purple-100' : 'text-slate-400'}`}>
                                      {step.subtitle}
                                    </p>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Aktif Adımın Soruları */}
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center">
                                  {currentStep}
                                </span>
                                Adım {currentStep}: {WIZARD_STEPS[currentStep - 1].title}
                              </h3>
                              <p className="text-xs text-slate-400 mt-0.5">{WIZARD_STEPS[currentStep - 1].subtitle}</p>
                            </div>
                            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                              Adım {currentStep} / 5
                            </span>
                          </div>

                          <div className="space-y-4">
                            {QUESTIONS.filter(q => WIZARD_STEPS[currentStep - 1].questionKeys.includes(q.key)).map((q) => {
                              const absoluteIdx = QUESTIONS.findIndex(item => item.key === q.key) + 1
                              return (
                                <div key={q.key} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-purple-200 transition-colors">
                                  <label className="block text-xs font-bold text-slate-800 mb-1">
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-purple-100 text-purple-700 mr-2 text-[10px] font-black shrink-0">
                                      {absoluteIdx}
                                    </span>
                                    <span>{q.label}</span>
                                  </label>
                                  {q.hint && (
                                    <p className="text-[11px] text-purple-600 font-medium mb-2.5 ml-7">
                                      ℹ️ {q.hint}
                                    </p>
                                  )}
                                  <div className="sm:ml-7">
                                    {renderQuestionInput(q)}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Navigasyon Butonları (Geri / Devam Et / Testi Gönder) */}
                        <div className="flex flex-col sm:flex-row items-center justify-between pt-5 border-t border-slate-100 gap-4">
                          <div className="w-full sm:w-auto">
                            {currentStep > 1 && (
                              <button
                                type="button"
                                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
                              >
                                ← Geri
                              </button>
                            )}
                          </div>

                          <div className="w-full sm:w-auto flex items-center justify-end gap-3">
                            {currentStep < 5 ? (
                              <button
                                type="button"
                                disabled={!WIZARD_STEPS[currentStep - 1].questionKeys.every(k => isQuestionFilled(k, dnaAnswers))}
                                onClick={() => {
                                  const currentKeys = WIZARD_STEPS[currentStep - 1].questionKeys
                                  const unAnswered = currentKeys.filter(k => !isQuestionFilled(k, dnaAnswers))
                                  if (unAnswered.length > 0) {
                                    setToast({ type: 'error', message: 'Lütfen bu adımdaki tüm soruları cevaplayınız.' })
                                    setTimeout(() => setToast(null), 3000)
                                    return
                                  }
                                  setCurrentStep(prev => Math.min(5, prev + 1))
                                }}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Devam Et →
                              </button>
                            ) : (
                              <button
                                type="submit"
                                disabled={dnaSubmitting || QUESTIONS.filter(q => isQuestionFilled(q.key, dnaAnswers)).length < 20}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs"
                              >
                                {dnaSubmitting ? 'Gönderiliyor...' : 'Testi Gönder 🚀'}
                              </button>
                            )}
                          </div>
                        </div>
                      </form>
                    )}

                  </div>

                </div>
              )}

              {/* ════════ TAB 4: PROFİL / TAKIM ════════ */}
              {activeTab === 'profil' && (() => {
                const requiredOrKeyFields = ['telefon', 'adres', 'okul_bilgisi', 'egitim_durumu', 'is_durumu']
                const isProfileIncomplete = requiredOrKeyFields.some(f => !katilimci?.[f] || !String(katilimci[f]).trim())

                return (
                  <div className="space-y-6">

                    {/* Sayfa Başlığı */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-slate-800">Profil & Katılımcı Bilgilerim</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Kişisel bilgileriniz, iletişim, eğitim, iş durumu ve takım detaylarınız</p>
                      </div>
                    </div>

                    {/* Dostça Eksik Bilgi Uyarısı (Panel Kilitlenmez) */}
                    {isProfileIncomplete && (
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 shadow-xs">
                          💡
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-amber-900">Profil Bilgilerinizi Tamamlayınız</h4>
                          <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                            Program iletişimi, mentor eşleştirmeleri, sertifika düzenleme ve olası materyal gönderimleri için lütfen aşağıdaki formu eksiksiz doldurunuz.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 1. ÜST PROFİL KARTI + FOTOĞRAF YÖNETİMİ */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">

                      {/* Sol: Avatar / Fotoğraf + Katılımcı Detayları */}
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                        
                        {/* Fotoğraf / Avatar Container */}
                        <div className="relative group shrink-0">
                          {(!imgError && (profilePhotoPreview || getParticipantAvatarSrc(katilimci, 400))) ? (
                            <img
                              src={profilePhotoPreview || getParticipantAvatarSrc(katilimci, 400)}
                              alt={katilimci?.ad_soyad || displayName}
                              onError={() => setImgError(true)}
                              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-orange-100 shadow-md transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 text-white font-black text-3xl flex items-center justify-center shadow-md">
                              {((katilimci?.ad_soyad || displayName)[0] || 'K').toUpperCase()}
                            </div>
                          )}

                          {/* Fotoğraf Yükleme Butonu */}
                          <label
                            htmlFor="profile-photo-input"
                            title="Profil fotoğrafını güncelle"
                            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white text-slate-700 border border-slate-200 flex items-center justify-center cursor-pointer shadow-md hover:bg-orange-50 hover:text-orange-600 transition-all group-hover:scale-110"
                          >
                            {uploadingPhoto ? (
                              <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="text-xs">📷</span>
                            )}
                          </label>
                          <input
                            id="profile-photo-input"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            onChange={handlePhotoSelect}
                            disabled={uploadingPhoto}
                            className="hidden"
                          />
                        </div>

                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">
                              {katilimci?.ad_soyad || displayName}
                            </h3>
                            <span className="font-bold text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                              {katilimci?.program_katilim_durumu || 'AKTİF'} Katılımcı
                            </span>
                            {katilimci?.takim_adi && (
                              <span className="font-bold text-[10px] text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                                🏆 {katilimci.takim_adi}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 font-medium justify-center sm:justify-start">
                            <span className="flex items-center gap-1 font-mono text-[11px]">
                              ✉️ {katilimci?.eposta || '—'}
                            </span>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <span className="flex items-center gap-1">
                              📞 {katilimci?.telefon || profileForm.telefon || 'Telefon belirtilmemiş'}
                            </span>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <span className="flex items-center gap-1">
                              🎓 {katilimci?.universite || 'Üniversite belirtilmemiş'}
                            </span>
                          </div>

                          <div className="pt-1 flex items-center gap-2 justify-center sm:justify-start">
                            <label
                              htmlFor="profile-photo-input"
                              className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                            >
                              <span>{uploadingPhoto ? 'Fotoğraf yükleniyor...' : 'Profil fotoğrafını değiştir'}</span>
                            </label>
                            {katilimci?.profil_guncelleme_tarihi && (
                              <span className="text-[10px] text-slate-400">
                                (Son günc: {new Date(katilimci.profil_guncelleme_tarihi).toLocaleDateString('tr-TR')})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sağ: Bireysel Puan Rozeti */}
                      <div className="flex items-center gap-3 bg-gradient-to-br from-amber-50 to-orange-50/70 border border-amber-200/80 rounded-2xl p-4 shrink-0 shadow-2xs self-center md:self-auto">
                        <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-xs">
                          ⭐
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Bireysel Puanım</span>
                          <span className="text-2xl font-black text-amber-900 tabular-nums">
                            {Number(performans?.bireysel_puan) || 0} <span className="text-xs font-bold text-amber-600">Puan</span>
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* 2. DETAYLI PROFİL FORMU */}
                    <form onSubmit={handleProfileSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-soft space-y-7">
                      
                      {/* Form Başlığı (Tek Buton aşağıda) */}
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-base shadow-2xs">
                          📝
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Profil Bilgilerini Düzenle</h3>
                          <p className="text-[11px] text-slate-400">Bilgilerinizi güncel tutup en alttaki "Değişiklikleri Kaydet" butonuna basınız</p>
                        </div>
                      </div>

                      {/* Form Alanları Grid */}
                      <div className="space-y-6 text-xs">

                        {/* BÖLÜM A: İletişim & Adres */}
                        <div className="space-y-3 bg-slate-50/60 p-5 rounded-2xl border border-slate-100">
                          <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-2">
                            <span>📞</span> İletişim & Adres Bilgileri
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Telefon Numarası</label>
                              <input
                                type="tel"
                                value={profileForm.telefon}
                                onChange={e => setProfileForm(f => ({ ...f, telefon: e.target.value }))}
                                placeholder="05XX XXX XX XX"
                                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs placeholder-slate-400 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">E-Posta (Salt Okunur)</label>
                              <input
                                type="email"
                                readOnly
                                value={katilimci?.eposta || ''}
                                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono text-xs cursor-not-allowed"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                İkamet & Gönderim Adresi (Opsiyonel)
                              </label>
                              <textarea
                                rows={2}
                                value={profileForm.adres}
                                onChange={e => setProfileForm(f => ({ ...f, adres: e.target.value }))}
                                placeholder="Sertifika, materyal ve resmi evrak gönderimi için açık adresiniz..."
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs placeholder-slate-400 resize-none transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* BÖLÜM B: Eğitim & Okul Bilgileri */}
                        <div className="space-y-3 bg-slate-50/60 p-5 rounded-2xl border border-slate-100">
                          <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-2">
                            <span>🎓</span> Eğitim & Okul Bilgileri
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                Üniversite (Kayıtlı)
                              </label>
                              <input
                                type="text"
                                readOnly
                                value={katilimci?.universite || 'Belirtilmemiş'}
                                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium text-xs cursor-not-allowed"
                              />
                              <span className="text-[10px] text-slate-400 block mt-1">Üniversite bilgisi başvuru kaydından alınır.</span>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                Sınıf (Kayıtlı)
                              </label>
                              <input
                                type="text"
                                readOnly
                                value={katilimci?.sinif ? (katilimci.sinif === 'Mezun' ? 'Mezun' : `${katilimci.sinif}. Sınıf`) : 'Belirtilmemiş'}
                                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium text-xs cursor-not-allowed"
                              />
                              <span className="text-[10px] text-slate-400 block mt-1">Sınıf bilgisi başvuru kaydından alınır.</span>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Eğitim Durumu</label>
                              <select
                                value={profileForm.egitim_durumu}
                                onChange={e => setProfileForm(f => ({ ...f, egitim_durumu: e.target.value }))}
                                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs text-slate-700 transition-all"
                              >
                                <option value="">Seçiniz</option>
                                <option value="Okuyor">Okuyor</option>
                                <option value="Mezun">Mezun</option>
                                <option value="Diğer">Diğer</option>
                              </select>
                              <span className="text-[10px] text-slate-400 block mt-1">Mevcut öğrenim / mezuniyet durumu.</span>
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                Okul Tam Bilgileri (Fakülte, Bölüm vb.)
                              </label>
                              <textarea
                                rows={2}
                                value={profileForm.okul_bilgisi}
                                onChange={e => setProfileForm(f => ({ ...f, okul_bilgisi: e.target.value }))}
                                placeholder="Fakülte, anabilim dalı, uzmanlık alanı veya okulunuzla ilgili detaylı bilgiler..."
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs placeholder-slate-400 resize-none transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* BÖLÜM C: İş & Kariyer Durumu */}
                        <div className="space-y-3 bg-slate-50/60 p-5 rounded-2xl border border-slate-100">
                          <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-2">
                            <span>💼</span> İş & Kariyer Durumu
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">İş Durumu</label>
                              <select
                                value={profileForm.is_durumu}
                                onChange={e => setProfileForm(f => ({ ...f, is_durumu: e.target.value }))}
                                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs text-slate-700 transition-all"
                              >
                                <option value="">Seçiniz</option>
                                <option value="Çalışmıyor">Çalışmıyor</option>
                                <option value="Çalışıyor">Çalışıyor</option>
                                <option value="Staj yapıyor">Staj yapıyor</option>
                                <option value="Diğer">Diğer</option>
                              </select>
                            </div>

                            {(profileForm.is_durumu === 'Çalışıyor' || profileForm.is_durumu === 'Staj yapıyor' || profileForm.is_durumu === 'Diğer') && (
                              <>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Çalıştığı Kurum</label>
                                  <input
                                    type="text"
                                    value={profileForm.calistigi_kurum}
                                    onChange={e => setProfileForm(f => ({ ...f, calistigi_kurum: e.target.value }))}
                                    placeholder="Hastane, eczane, klinik veya kurum adı..."
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs placeholder-slate-400 transition-all animate-fade-in"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Pozisyon / Ünvan</label>
                                  <input
                                    type="text"
                                    value={profileForm.pozisyon}
                                    onChange={e => setProfileForm(f => ({ ...f, pozisyon: e.target.value }))}
                                    placeholder="Örn: Eczacı, Hekim, Stajyer..."
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs placeholder-slate-400 transition-all animate-fade-in"
                                  />
                                </div>
                              </>
                            )}

                            <div className="sm:col-span-3">
                              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                İş & Sorumluluk Açıklaması (Opsiyonel)
                              </label>
                              <textarea
                                rows={2}
                                value={profileForm.is_aciklamasi}
                                onChange={e => setProfileForm(f => ({ ...f, is_aciklamasi: e.target.value }))}
                                placeholder="Mesleki faaliyetleriniz, çalışma alanlarınız veya iş detaylarınız..."
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs placeholder-slate-400 resize-none transition-all"
                              />
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Tek Ana Kaydet Butonu (Form Footer) */}
                      <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button
                          type="submit"
                          disabled={savingProfile}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 text-white text-xs font-bold shadow-md hover:shadow-lg hover:scale-102 active:scale-98 transition-all disabled:opacity-50"
                        >
                          {savingProfile ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Değişiklikler Kaydediliyor…
                            </>
                          ) : (
                            <>
                              <Ic.Check c="w-4 h-4" />
                              Değişiklikleri Kaydet
                            </>
                          )}
                        </button>
                      </div>

                    </form>

                    {/* 3. TAKIM BİLGİLERİ KARTI */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
                            <Ic.Trophy c="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm">Takım & Program Katılımı</h3>
                            <p className="text-[11px] text-slate-400">Atandığınız takım ve program kabul durumunuz</p>
                          </div>
                        </div>
                        {takim && (
                          <span className="font-extrabold text-xs text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
                            🏆 {takim.toplam_puan || 0} Takım Puanı
                          </span>
                        )}
                      </div>

                      {takim ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                          <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Takım Adı</span>
                            <span className="font-bold text-slate-800 text-sm block truncate">{takim.takim_adi}</span>
                          </div>

                          <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Takım Toplam Puanı</span>
                            <span className="font-bold text-slate-800 text-sm block tabular-nums">{takim.toplam_puan || 0} Puan</span>
                          </div>

                          <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Program Kabul Durumu</span>
                            <span className="font-bold text-emerald-700 text-sm block">
                              {katilimci?.kabul_durumu ? '✅ Kabul Edildi' : '⏳ Değerlendirmede'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center text-xs text-slate-500 italic">
                          Takım bilgisi bekleniyor. Henüz bir takıma atanmamış olabilirsiniz.
                        </div>
                      )}
                    </div>

                    {/* 4. PERFORMANS KIRILIMI KARTLARI */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-base">
                            📊
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm">Performans & Puan Kırılımı</h3>
                            <p className="text-[11px] text-slate-400">Gelişim skorlarınızın kategorilere göre dökümü</p>
                          </div>
                        </div>
                      </div>

                      {/* 4 Küçük Performans Kartı Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

                        <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Görev Puanı</span>
                            <span className="text-base">📝</span>
                          </div>
                          <span className="text-2xl font-black text-blue-900 block tabular-nums">
                            {Number(performans?.gorev_puani) || 0}
                          </span>
                          <span className="text-[10px] text-blue-600/80 font-medium block">Tamamlanan görev & ödevler</span>
                        </div>

                        <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Toplantı Katılımı</span>
                            <span className="text-base">🎙️</span>
                          </div>
                          <span className="text-2xl font-black text-emerald-900 block tabular-nums">
                            {Number(performans?.toplanti_katilim_puani) || 0}
                          </span>
                          <span className="text-[10px] text-emerald-600/80 font-medium block">Canlı oturum & toplantılar</span>
                        </div>

                        <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Etkileşim Bonusu</span>
                            <span className="text-base">🚀</span>
                          </div>
                          <span className="text-2xl font-black text-purple-900 block tabular-nums">
                            {Number(performans?.etkilesim_bonus_puani) || 0}
                          </span>
                          <span className="text-[10px] text-purple-600/80 font-medium block">Sosyal medya & topluluk katkısı</span>
                        </div>

                        <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-4 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Manuel Puan</span>
                            <span className="text-base">🎁</span>
                          </div>
                          <span className="text-2xl font-black text-slate-900 block tabular-nums">
                            {Number(performans?.manuel_puan) || 0}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium block">Admin özel takdir puanı</span>
                        </div>

                      </div>

                      {/* 4. KATILIMCIYA GÖRÜNEN NOT */}
                      {performans?.katilimciya_gorunen_not && String(performans.katilimciya_gorunen_not).trim() ? (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-5 space-y-1.5">
                          <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                            <span>👁️</span> Değerlendirme Notunuz
                          </h4>
                          <p className="text-xs text-emerald-950 leading-relaxed bg-white/80 p-3.5 rounded-xl border border-emerald-100 italic">
                            "{performans.katilimciya_gorunen_not}"
                          </p>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 text-center text-xs text-slate-400 italic">
                          Henüz size özel bir değerlendirme notu eklenmemiş.
                        </div>
                      )}
                    </div>

                  </div>
                )
              })()}

            </>
          )}

        </div>
      </main>

      {/* ══════════ TESLİM YÜKLEME VE DETAY MODALI ══════════ */}
      {selectedGorev && (() => {
        const teslim = selectedGorev.teslim
        const durumCode = teslim?.durum || (teslim?.degerlendirildi ? (teslim?.revizyon_istendi ? 'REVIZYON_ISTENDI' : 'TAMAMLANDI') : (teslim ? 'BEKLIYOR' : null))
        const isCompleted = durumCode === 'TAMAMLANDI'
        const isRevisionRequested = durumCode === 'REVIZYON_ISTENDI'
        const isWaiting = durumCode === 'BEKLIYOR' || durumCode === 'REVIZE_EDILDI'

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedGorev(null)} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slide-up">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white z-10">
                <div className="flex items-center gap-3">
                  <StatusBadge durum={durumCode} degerlendirildi={teslim?.degerlendirildi} revizyon={teslim?.revizyon_istendi} />
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Görev Teslimi</h2>
                    <p className="text-xs font-semibold text-orange-500 mt-0.5">Hafta {selectedGorev?.hafta} - {selectedGorev?.gorev_adi}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedGorev(null)} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">
                  <Ic.Close />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-slate-50/30">

                {/* 1. Durum Bildirim Banner'ları */}
                {isCompleted && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800 text-xs">✅ Değerlendirme Tamamlandı</span>
                      <span className="bg-white text-emerald-700 font-extrabold text-xs px-3 py-1 rounded-full border border-emerald-200">
                        Alınan Puan: {teslim?.alinan_puan ?? 0} / 100
                      </span>
                    </div>
                    {teslim?.mentor_yorumu && (
                      <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 text-xs text-slate-700">
                        <span className="font-bold text-emerald-800 block mb-1">Mentor Geri Bildirimi:</span>
                        {teslim.mentor_yorumu}
                      </div>
                    )}
                    <p className="text-[11px] text-emerald-600 font-medium italic">
                      * Bu görev nihai olarak değerlendirildiği için yeni teslim yüklenemez.
                    </p>
                  </div>
                )}

                {isRevisionRequested && (
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-orange-800 font-bold text-xs">
                      <Ic.Info c="w-4 h-4 text-orange-600" />
                      Mentor Revizyon İstedi
                    </div>
                    {teslim?.mentor_yorumu && (
                      <div className="bg-white/90 p-3 rounded-xl border border-orange-200/80 text-xs text-slate-700">
                        <span className="font-bold text-orange-800 block mb-1">Revizyon Notu:</span>
                        {teslim.mentor_yorumu}
                      </div>
                    )}
                    <p className="text-[11px] text-orange-700 font-medium">
                      Lütfen mentor notunu dikkate alarak tesliminizi güncelleyip aşağıdan tekrar gönderiniz.
                    </p>
                  </div>
                )}

                {isWaiting && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-1">
                    <p className="text-xs font-bold text-blue-800">
                      {durumCode === 'REVIZE_EDILDI'
                        ? ' Revize tesliminiz gönderildi, mentor değerlendirmesi bekleniyor.'
                        : ' Tesliminiz gönderildi, mentor değerlendirmesi bekleniyor.'}
                    </p>
                    <p className="text-[11px] text-blue-600 font-medium">
                      Mentor değerlendirmeden önce dilediğiniz zaman aşağıdaki form ile tesliminizi güncelleyebilirsiniz.
                    </p>
                  </div>
                )}

                {/* 2. Mevcut Yüklemeler (Varsa) */}
                {teslim && (
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-2 text-xs">
                    <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2">Mevcut Teslim Bilgileriniz</h4>
                    {(teslim.teslim_dosyasi_url || teslim.teslim_dosyasi) && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Dosya:</span>
                        <a href={teslim.teslim_dosyasi_url || teslim.teslim_dosyasi} target="_blank" rel="noreferrer" className="font-bold text-orange-600 hover:underline">
                          📎 Yüklenen Dosya
                        </a>
                      </div>
                    )}
                    {teslim.teslim_linki && (teslim.teslim_linki !== teslim.teslim_dosyasi_url && teslim.teslim_linki !== teslim.teslim_dosyasi) && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Harici Link:</span>
                        <a href={teslim.teslim_linki} target="_blank" rel="noreferrer" className="font-bold text-indigo-600 hover:underline truncate max-w-[220px]">
                          🔗 {teslim.teslim_linki}
                        </a>
                      </div>
                    )}
                    {teslim.aciklama && (
                      <div>
                        <span className="text-slate-500 font-medium block mb-1">Açıklamanız:</span>
                        <p className="bg-slate-50 p-2.5 rounded-lg text-slate-700">{teslim.aciklama}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Form (TAMAMLANDI durumunda kapalı) */}
                {!isCompleted && (
                  <form id="submit-form" onSubmit={handleSubmit} className="space-y-4">

                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        {teslim ? 'Yeni / Güncel Dosya Yükle' : 'Dosya Yükle'}
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,image/*,video/*"
                        onChange={e => setFile(e.target.files[0])}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 transition-colors border border-slate-200 rounded-xl p-1 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-2">PDF, Word, görsel veya video desteklenir.</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
                      <label className="block text-xs font-bold text-slate-700 mb-2">Harici Link (Opsiyonel)</label>
                      <input
                        type="url"
                        value={link}
                        onChange={e => setLink(e.target.value)}
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white text-xs placeholder-slate-400 transition-all"
                        placeholder="Google Drive, YouTube, Figma vb."
                      />
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
                      <label className="block text-xs font-bold text-slate-700 mb-2">Teslim Notu / Açıklama</label>
                      <textarea
                        rows={3}
                        value={not}
                        onChange={e => setNot(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white text-xs placeholder-slate-400 resize-none transition-all"
                        placeholder="Tesliminizle ilgili mentora aktarmak istediğiniz notlar..."
                      />
                    </div>

                  </form>
                )}

                {/* 4. Teslim Geçmişi / Timeline */}
                {teslim?.hareketler && teslim.hareketler.length > 0 && (
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <span>📜</span> Teslim Geçmişi & Timeline ({teslim.hareketler.length})
                    </h4>

                    <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {teslim.hareketler.map((h, idx) => {
                        const tipe = String(h.islem_tipi || '').toUpperCase()
                        const labelMap = {
                          ILK_TESLIM: 'İlk Teslim',
                          TESLIM_EDILDI: 'Teslim edildi',
                          REVIZYON_ISTENDI: 'Revizyon istendi',
                          REVIZE_TESLIM: 'Revize Teslim',
                          NIHAI_DEGERLENDIRME: 'Nihai değerlendirme'
                        }
                        const badgeColor =
                          tipe === 'ILK_TESLIM' || tipe === 'TESLIM_EDILDI' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          tipe === 'REVIZYON_ISTENDI' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                          tipe === 'REVIZE_TESLIM' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          'bg-emerald-100 text-emerald-700 border-emerald-200'
                        const islemLabel = labelMap[tipe] || h.islem_tipi_etiketi || h.islem_tipi || 'İşlem'

                        return (
                          <div key={h.id || idx} className="relative flex items-start gap-2.5">
                            <div className="absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-white" />
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 w-full space-y-1 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border ${badgeColor}`}>
                                  {islemLabel}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {h.olusturulma_tarihi ? new Date(h.olusturulma_tarihi).toLocaleString('tr-TR') : ''}
                                </span>
                              </div>

                              {h.olusturan_adi && (
                                <p className="text-[10px] font-semibold text-slate-500">İşlem Yapan: {h.olusturan_adi}</p>
                              )}

                              {h.aciklama && (
                                <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="font-semibold text-slate-400">Not: </span>{h.aciklama}
                                </p>
                              )}

                              {h.revizyon_notu && (
                                <p className="text-orange-800 bg-orange-50 p-2 rounded-lg border border-orange-100">
                                  <span className="font-bold">Revizyon Notu: </span>{h.revizyon_notu}
                                </p>
                              )}

                              {h.mentor_yorumu && h.islem_tipi === 'NIHAI_DEGERLENDIRME' && (
                                <p className="text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                  <span className="font-bold">Mentor Geri Bildirimi: </span>{h.mentor_yorumu}
                                </p>
                              )}

                              {h.puan !== null && h.puan !== undefined && (
                                <p className="font-bold text-emerald-600">Alınan Puan: {h.puan} / 100</p>
                              )}

                              <div className="flex items-center gap-3 pt-1">
                                {h.teslim_linki && (
                                  <a href={h.teslim_linki} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline font-bold text-[10px] inline-flex items-center gap-1">
                                    🔗 Link
                                  </a>
                                )}
                                {(h.teslim_dosyasi_url || h.teslim_dosyasi) && (
                                  <a href={h.teslim_dosyasi_url || h.teslim_dosyasi} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline font-bold text-[10px] inline-flex items-center gap-1">
                                    📎 Dosya
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 z-10">
                <button
                  onClick={() => setSelectedGorev(null)}
                  type="button"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  {isCompleted ? 'Kapat' : 'İptal'}
                </button>
                {!isCompleted && (
                  <button
                    form="submit-form"
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-400 to-pink-500 hover:shadow-md transition-all disabled:opacity-70 flex items-center gap-2"
                  >
                    {submitting ? 'Gönderiliyor...' : isRevisionRequested ? 'Revize Teslim Yükle 🔄' : isWaiting ? 'Teslimi Güncelle' : 'Teslim Yükle'}
                  </button>
                )}
              </div>

            </div>
          </div>
        )
      })()}

    </div>
  )
}
