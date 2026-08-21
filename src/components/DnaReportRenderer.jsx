import React, { useState } from 'react'

// ─── HELPER: Markdown Temizleme ve Ayrıştırma ─────────────────────────────────

// Dayanak ve AI teknik etiketlerini katılımcı metninden temizler (satır sonlarını ASLA bozmaz)
export const stripEvidenceText = (str) => {
  if (!str || typeof str !== 'string') return ''
  return str
    .replace(/\[\s*(?:Dayanak|dayanak|Evidence|evidence|based_on|based_on_answers|why_this_fits|personalization_evidence)[^\]]*\]/gi, '')
    .replace(/(?:^|\n)\s*(?:Dayanak|dayanak|Evidence|evidence|Bu çıkarım şu cevaplara dayanır)\s*:\s*[^\n]*/gi, '')
    .replace(/\bS\d+\s*=\s*[^|\n,\]\)]+/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export const cleanMarkdownSymbols = (str) => {
  if (!str || typeof str !== 'string') return ''
  return str
    .replace(/^#+\s*/, '')
    .replace(/^\s*[\-\*•]\s*/, '')
    .replace(/^\d+[\.\)]\s*/, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`/g, '')
    .trim()
}

export const renderInlineMarkdown = (text) => {
  if (!text || typeof text !== 'string') return ''
  const cleaned = stripEvidenceText(text)
  const parts = cleaned.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic text-slate-800">
          {part.slice(1, -1)}
        </em>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-slate-100 text-purple-700 px-1.5 py-0.5 rounded text-[11px] font-mono border border-slate-200">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

export const ReportBodyRenderer = ({ body }) => {
  if (!body || typeof body !== 'string') return null
  const cleanBody = stripEvidenceText(body)
  const lines = cleanBody.split('\n')
  const elements = []
  let listItems = []

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-2 my-2.5 pl-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
              <span>{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  lines.forEach((line, lineIdx) => {
    let trimmed = line.trim()
    if (!trimmed) {
      flushList()
      return
    }

    trimmed = stripEvidenceText(trimmed)
    if (!trimmed) return

    // Alt Başlık (### veya **)
    if (trimmed.startsWith('###') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 60)) {
      flushList()
      const headingText = cleanMarkdownSymbols(trimmed)
      elements.push(
        <h5 key={`h5-${lineIdx}`} className="text-xs font-bold text-purple-950 uppercase tracking-wider mt-4 mb-2 flex items-center gap-1.5">
          <span className="w-1.5 h-3.5 bg-purple-600 rounded-full inline-block"></span>
          <span>{headingText}</span>
        </h5>
      )
      return
    }

    // Liste Maddesi (- veya * veya •)
    if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•') || /^\d+[\.\)]/.test(trimmed)) {
      const cleanItem = trimmed.replace(/^[\-\*•]\s*/, '').replace(/^\d+[\.\)]\s*/, '')
      if (cleanItem.trim()) {
        listItems.push(cleanItem)
      }
      return
    }

    // Normal Paragraf
    flushList()
    elements.push(
      <p key={`p-${lineIdx}`} className="text-xs text-slate-700 leading-relaxed my-2">
        {renderInlineMarkdown(trimmed)}
      </p>
    )
  })

  flushList()
  return <div className="space-y-1">{elements}</div>
}

// Markdown metnini # veya ## başlıklarına göre ayırır
export const parseMarkdownSections = (text) => {
  if (!text || typeof text !== 'string') return []
  const cleanText = text.replace(/\r\n/g, '\n').trim()
  const rawSections = cleanText.split(/^##?\s+/m)
  const sections = []

  rawSections.forEach((sec, idx) => {
    if (!sec.trim()) return
    const firstNewline = sec.indexOf('\n')
    let title = ''
    let body = ''
    if (firstNewline === -1) {
      title = sec.trim()
    } else {
      title = sec.substring(0, firstNewline).trim()
      body = sec.substring(firstNewline + 1).trim()
    }
    title = title.replace(/[\*#]/g, '').trim()
    sections.push({ id: idx, title, body })
  })

  return sections
}

// ─── BÖLÜM PARSERLERİ ─────────────────────────────────────────────────────────

// 1. Skor Kartı Parser (Öncelik: raporJson.scorecard, Fallback: Markdown)
export const parseScorecardItems = (body, jsonScorecard = null) => {
  if (jsonScorecard && typeof jsonScorecard === 'object') {
    const s = jsonScorecard
    const mapped = [
      { label: 'Arketip Eşleşmesi', score: Number(s.arketip_eslesmesi) || 85, desc: s.arketip_desc || 'Hedef kitle ve arketip uyumu' },
      { label: 'Marka Tutarlılığı', score: Number(s.marka_tutarliligi) || 80, desc: s.marka_desc || 'Marka konumlandırması ve vizyon tutarlılığı' },
      { label: 'Kamera ve Prodüksiyon Hazırlığı', score: Number(s.kamera_prod_hazirligi) || 75, desc: s.kamera_desc || 'Format ve prodüksiyon rahatlığı' },
      { label: 'İçerik Üretim Kapasitesi', score: Number(s.icerik_kapasitesi) || 80, desc: s.kapasite_desc || 'Haftalık sürdürülebilir üretim dengesi' },
      { label: 'Kriz Yönetimi Dayanıklılığı', score: Number(s.kriz_dayanikliligi) || 85, desc: s.kriz_desc || 'Etik, mevzuat ve kriz dayanıklılığı' }
    ]
    return mapped
  }

  const cleanBody = stripEvidenceText(body || '')
  const lines = cleanBody.split('\n').map(l => l.trim()).filter(Boolean)
  const items = []
  let currentItem = null

  lines.forEach(line => {
    const cleanLine = cleanMarkdownSymbols(line)
    if (!cleanLine || cleanLine.startsWith('_') || cleanLine.length < 3) return

    const isMetricHeader = /^(Arketip Eşleşmesi|Marka Tutarlılığı|Kamera ve Prodüksiyon Hazırlığı|İçerik Üretim Kapasitesi|Kriz Yönetimi Dayanıklılığı|.*?[Ss]kor.*?)[:\-]/i.test(cleanLine) || (cleanLine.includes('%') && /^(Arketip|Marka|Kamera|İçerik|Kriz|Performans)/i.test(cleanLine))

    if (isMetricHeader) {
      if (currentItem) items.push(currentItem)
      const parts = cleanLine.split(/[:\-]/)
      const label = parts[0].trim()
      const val = parts.slice(1).join(':').trim()
      const pctMatch = cleanLine.match(/%?(\d+)/)
      const score = pctMatch ? parseInt(pctMatch[1], 10) : 80
      currentItem = { label, val: val || cleanLine, score, desc: '' }
    } else if (currentItem) {
      currentItem.desc = currentItem.desc ? `${currentItem.desc} ${cleanLine}` : cleanLine
    } else if (cleanLine.includes('%')) {
      const pctMatch = cleanLine.match(/%?(\d+)/)
      const score = pctMatch ? parseInt(pctMatch[1], 10) : 80
      currentItem = { label: 'Performans Kriteri', val: cleanLine, score, desc: '' }
    }
  })
  if (currentItem) items.push(currentItem)

  // Eğer 5'ten az çıkarsa eksikleri tamamla
  if (items.length < 5) {
    const defaultLabels = [
      'Arketip Eşleşmesi',
      'Marka Tutarlılığı',
      'Kamera ve Prodüksiyon Hazırlığı',
      'İçerik Üretim Kapasitesi',
      'Kriz Yönetimi Dayanıklılığı'
    ]
    defaultLabels.forEach(defLabel => {
      const exists = items.some(it => it.label.toLowerCase().includes(defLabel.split(' ')[0].toLowerCase()))
      if (!exists) {
        items.push({ label: defLabel, score: 80, desc: 'Stratejik performans göstergesi' })
      }
    })
  }

  return items.slice(0, 5)
}

// 2. Kanca ve CTA Parser (Öncelik: raporJson, Fallback: Markdown)
export const parseHookAndCtas = (body, jsonHooks = null, jsonCtas = null) => {
  const hooks = []
  const ctas = []

  if (Array.isArray(jsonHooks) && jsonHooks.length > 0) {
    jsonHooks.forEach(h => {
      const text = typeof h === 'string' ? h : h?.text
      if (text) hooks.push(cleanMarkdownSymbols(text))
    })
  }

  if (Array.isArray(jsonCtas) && jsonCtas.length > 0) {
    jsonCtas.forEach(c => {
      const text = typeof c === 'string' ? c : c?.text
      if (text) ctas.push(cleanMarkdownSymbols(text))
    })
  }

  if (hooks.length >= 3 && ctas.length >= 3) {
    return { hooks: hooks.slice(0, 3), ctas: ctas.slice(0, 3) }
  }

  const cleanBody = stripEvidenceText(body || '')
  const lines = cleanBody.split('\n').map(l => l.trim()).filter(Boolean)

  lines.forEach(l => {
    const clean = cleanMarkdownSymbols(l)
    if (/^(?:[\-\*•\d\.\)]\s*)?(?:Kanca|Hook)\s*\d*/i.test(clean) || /Kanca\s*\d*[:\(]/i.test(clean)) {
      const text = clean.replace(/^(?:Kanca|Hook)\s*\d*[:\s\-\(\)\w]*[:\-]?\s*/i, '').replace(/^["']|["']$/g, '').trim()
      if (text && text.length > 5 && !hooks.includes(text)) {
        hooks.push(text)
      }
    } else if (/^(?:[\-\*•\d\.\)]\s*)?(?:CTA|Aksiyon Çağrısı)\s*\d*/i.test(clean) || /CTA\s*\d*[:\(]/i.test(clean)) {
      const text = clean.replace(/^(?:CTA|Aksiyon Çağrısı)\s*\d*[:\s\-\(\)\w]*[:\-]?\s*/i, '').replace(/^["']|["']$/g, '').trim()
      if (text && text.length > 5 && !ctas.includes(text)) {
        ctas.push(text)
      }
    }
  })

  return {
    hooks: hooks.length > 0 ? hooks.slice(0, 3) : [
      'Bunu uygulamadan önce mutlaka bilmeniz gereken kritik kuralı açıklıyorum:',
      'Doğru bildiğiniz bu yöntemin aslında sağlığınıza maliyeti ne olabilir?',
      'Uzman tavsiyesi almadan önce kendinize sormanız gereken ilk soru:'
    ],
    ctas: ctas.length > 0 ? ctas.slice(0, 3) : [
      'Gerektiğinde danışabileceğiniz bu bilgiyi profilinizde saklamak için hemen kaydedin.',
      'Siz bu konuda ne düşünüyorsunuz? Deneyimlerinizi yorumlarda paylaşın.',
      'Bu konuyu merak eden bir yakınınız varsa doğru bilgiyi ulaştırmak için paylaşın.'
    ]
  }
}

// 3. İçerik Serileri Parser (Öncelik: raporJson.content_series, Fallback: Markdown)
export const parseSeriesBlocks = (body, jsonSeries = null) => {
  if (Array.isArray(jsonSeries) && jsonSeries.length >= 3) {
    return jsonSeries.slice(0, 3).map((s, idx) => ({
      id: s.id || (idx + 1),
      title: s.title || `İçerik Serisi ${idx + 1}`,
      format: s.format || 'Reels / Shorts / Video',
      channel: s.channel || s.yayin_kanali || 'Instagram / Sosyal Medya',
      logic: s.logic || s.icerik_mantigi || '',
      episodes: Array.isArray(s.episodes) ? s.episodes : (Array.isArray(s.bolumler) ? s.bolumler : []),
      production: s.production || s.uretim_akisi || '',
      riskNote: s.riskNote || s.uyum_notu || ''
    }))
  }

  const cleanBody = stripEvidenceText(body || '')
  const lines = cleanBody.split('\n')
  const series = []
  let currentSeri = null

  lines.forEach(line => {
    const trimmed = line.trim()
    const clean = cleanMarkdownSymbols(trimmed)
    if (!clean) return

    const seriHeaderMatch = clean.match(/^(?:Seri|İçerik Serisi)\s*(\d+)[:\s\-]*(.*)$/i) || clean.match(/^(\d+)[\.\)]\s*(?:Seri|İçerik Serisi)[:\s]*(.*)$/i)

    if (seriHeaderMatch) {
      if (currentSeri) series.push(currentSeri)
      const num = seriHeaderMatch[1] ? parseInt(seriHeaderMatch[1], 10) : (series.length + 1)
      const title = (seriHeaderMatch[2] || '').trim() || (`Seri ${num}`)
      currentSeri = {
        id: num,
        title: title.startsWith(':') ? title.slice(1).trim() : title,
        format: 'Reels / Shorts / Video',
        channel: 'Instagram / Sosyal Medya',
        logic: '',
        episodes: [],
        production: '',
        riskNote: ''
      }
      return
    }

    if (!currentSeri) return

    if (/Format[:\s]*/i.test(clean)) {
      currentSeri.format = clean.replace(/Format[:\s]*/i, '').trim()
    } else if (/Yayın Kanalı|Kanal[:\s]*/i.test(clean)) {
      currentSeri.channel = clean.replace(/(?:Yayın )?Kanalı?[:\s]*/i, '').trim()
    } else if (/Detaylı İçerik Mantığı|Mantık|Amaç[:\s]*/i.test(clean)) {
      currentSeri.logic = clean.replace(/(?:Detaylı )?İçerik Mantığı[:\s]*/i, '').trim()
    } else if (/Risk|Uyum Notu|TİTCK|KVKK[:\s]*/i.test(clean)) {
      currentSeri.riskNote = clean.replace(/(?:Risk\/uyum notu|Risk notu|Uyum notu)[:\s]*/i, '').trim()
    } else if (/Üretim akışı|Akış[:\s]*/i.test(clean)) {
      currentSeri.production = clean.replace(/(?:Üretim akışı|Akış)[:\s]*/i, '').trim()
    } else if (/Bölüm\s*\d*[:\s]*/i.test(clean) || /^\*\s*Bölüm/i.test(trimmed)) {
      currentSeri.episodes.push(clean.replace(/^[\*\-•]\s*/, ''))
    } else if (!currentSeri.logic && clean.length > 20 && !clean.startsWith('Seri')) {
      currentSeri.logic = clean
    }
  })

  if (currentSeri) series.push(currentSeri)

  // Eğer 3 seri bulunamazsa temel serileri üret
  if (series.length < 3) {
    const diff = 3 - series.length
    for (let i = 0; i < diff; i++) {
      const idx = series.length + 1
      series.push({
        id: idx,
        title: `Uzmanlık Rehberi ve Vaka Analizi (Seri ${idx})`,
        format: 'Dikey Kısa Video & Carousel',
        channel: 'Instagram / LinkedIn',
        logic: 'Sık sorulan sorulara kanıta dayalı pratik çözümler.',
        episodes: [
          `Bölüm 1: Sahada en sık yapılan 3 değerlendirme hatası`,
          `Bölüm 2: Danışanların en çok merak ettiği pratik ipuçları`,
          `Bölüm 3: Bilimsel kanıtlar ışığında doğru uygulama rehberi`
        ],
        production: 'Haftalık senaryo taslağı ve toplu çekim seansı.',
        riskNote: 'Etken madde odaklı anlatım yapılmalı, ürün reklamından kaçınılmalıdır.'
      })
    }
  }

  return series.slice(0, 3)
}

// 4. 7 Adımlı Yol Haritası Parser (Öncelik: raporJson.roadmap, Fallback: Markdown)
export const parseRoadmapSteps = (body, jsonRoadmap = null) => {
  if (Array.isArray(jsonRoadmap) && jsonRoadmap.length >= 7) {
    return jsonRoadmap.slice(0, 7).map((s, idx) => {
      if (typeof s === 'string') return cleanMarkdownSymbols(s)
      const title = s?.title || `Adım ${idx + 1}`
      const desc = s?.description || s?.desc || ''
      const text = s?.text || (desc ? `${title}: ${desc}` : title)
      return cleanMarkdownSymbols(text)
    })
  }

  const cleanBody = stripEvidenceText(body || '')
  const lines = cleanBody.split('\n')
  const steps = []
  let currentStep = null

  lines.forEach(line => {
    const trimmed = line.trim()
    if (!trimmed) return

    const isStepHeader = /(?:^|[\-\*•\d\.\)]\s*|###\s*)Ad[ıi]m\s*(\d+)[:\s\-]*(.*)/i.test(trimmed)
    if (isStepHeader) {
      if (currentStep) steps.push(cleanMarkdownSymbols(currentStep))
      currentStep = trimmed
    } else if (currentStep) {
      currentStep += ' ' + trimmed
    }
  })

  if (currentStep) steps.push(cleanMarkdownSymbols(currentStep))

  // Eğer 7'den az bulunursa tamamla
  if (steps.length < 7) {
    const defaultSteps = [
      'Biyografi ve Konumlandırma: Profil biyografisine uzmanlık algısını destekleyen açıklama eklenmesi.',
      'Teknik Hazırlık: Ses, ışık ve kadraj düzeninin test edilerek standart açının sabitlenmesi.',
      'İlk Senaryo Taslakları: İlk içerik serisi için 3 adet pratik taslak kurgulanması.',
      'Toplu Çekim Seansı: Hazırlanan taslakların tek seansta çekilmesi ve altyazılandırılması.',
      'Mevzuat ve Etik Kontrol: TİTCK ve KVKK kurallarına uygunluğun teyit edilmesi.',
      'Topluluk Etkileşimi: Gelen geri bildirimlerin mesleki dille yanıtlanması ve yeni soruların toplanması.',
      'Stratejik Değerlendirme: İzlenme metriklerinin analiz edilerek 2. ay takviminin güncellenmesi.'
    ]
    while (steps.length < 7) {
      steps.push(defaultSteps[steps.length])
    }
  }

  return steps.slice(0, 7)
}

// 5. 14 Günlük Mini Takvim Parser (Öncelik: raporJson.mini_calendar_14_days, Fallback: Markdown)
export const parseCalendarDays = (body, jsonCalendar = null) => {
  if (Array.isArray(jsonCalendar) && jsonCalendar.length >= 14) {
    return jsonCalendar.slice(0, 14).map((d, idx) => ({
      day: d.day || (idx + 1),
      title: d.title || d.tip || `Gün ${idx + 1}`,
      hook: d.hook || d.kanca || null,
      format: d.format || 'Kısa Video / Story',
      purpose: d.purpose || d.amac || 'Etkileşim & Otorite',
      note: d.note || d.uyum_notu || 'TİTCK uyumlu / Reklamsız'
    }))
  }

  const cleanBody = stripEvidenceText(body || '')
  const lines = cleanBody.split('\n').map(l => l.trim()).filter(Boolean)
  const days = []

  lines.forEach(l => {
    const clean = cleanMarkdownSymbols(l)
    if (/(?:^|[\-\*•\d\.\)]\s*)G[üu]n\s*\d+/i.test(l) || /^G[üu]n\s*\d+/i.test(clean)) {
      const dayMatch = clean.match(/G[üu]n\s*(\d+)/i)
      const dayNum = dayMatch ? parseInt(dayMatch[1], 10) : (days.length + 1)
      const parts = clean.split('|').map(p => p.trim())

      let type = parts[0] || `Gün ${dayNum}`
      let hook = ''
      let format = ''
      let purpose = ''
      let note = ''

      parts.slice(1).forEach(p => {
        if (/Kanca[:\s]*/i.test(p)) {
          hook = p.replace(/Kanca[:\s]*/i, '').replace(/^["']|["']$/g, '').trim()
        } else if (/Format[:\s]*/i.test(p)) {
          format = p.replace(/Format[:\s]*/i, '').trim()
        } else if (/Amaç[:\s]*/i.test(p)) {
          purpose = p.replace(/Amaç[:\s]*/i, '').trim()
        } else if (/Uyum|Risk[:\s]*/i.test(p)) {
          note = p.replace(/(?:Uyum Notu|Risk Notu|Uyum)[:\s]*/i, '').trim()
        }
      })

      days.push({
        day: dayNum,
        title: type.replace(/^G[üu]n\s*\d+[:\s\-]*/i, '').trim() || 'İçerik Yayını',
        hook: hook && hook !== '—' && hook !== '-' ? hook : null,
        format: format || 'Kısa Video / Story',
        purpose: purpose || 'Etkileşim & Otorite',
        note: note && note !== '—' && note !== '-' ? note : 'TİTCK uyumlu / Reklamsız'
      })
    }
  })

  // Eğer 14'ten az gün varsa tamamla
  if (days.length < 14) {
    const defaultDays = [
      { format: 'Kısa Video', purpose: 'Konumlandırma & Vizyon Duyurusu', note: 'İlaçsız ve tarafsız dil' },
      { format: 'Story Etkileşimi', purpose: 'Soru Kutusu & Merak Edilenleri Toplama', note: 'Reçetesiz bilgilendirme' },
      { format: 'Kısa Video', purpose: 'Seri 1 Bölüm 1: Bilgi Otoritesi', note: 'Etken madde odaklı' },
      { format: 'Görsel / Story', purpose: 'Günün Sağlık Notu', note: 'Genel bilgilendirme' },
      { format: 'Kısa Video', purpose: 'Seri 2 Bölüm 1: Pratik Danışmanlık', note: 'Uzmana danışın ibaresi' },
      { format: 'Story Kısa Video', purpose: 'Kamera Arkası & Samimiyet', note: 'Hasta mahremiyeti' },
      { format: 'Metrik Analizi', purpose: 'İlk Hafta Değerlendirmesi', note: '—' },
      { format: 'Vlog / Video', purpose: 'Seri 3 Bölüm 1: Yaşam Tarzı Liderliği', note: 'Ürün yerleştirmesiz' },
      { format: 'Story Anket', purpose: 'İnteraktif Anket & Katılım', note: 'Reklamsız' },
      { format: 'Kısa Video', purpose: 'Seri 1 Bölüm 2: Değer Sunumu', note: 'TİTCK uyumlu' },
      { format: 'Story Video', purpose: 'Yorum Yanıtlama', note: 'Teşhis koymama' },
      { format: 'Kısa Video', purpose: 'Seri 2 Bölüm 2: Çözüm Odaklı Yaklaşım', note: 'Mevzuata uygunluk' },
      { format: 'Carousel Görsel', purpose: '3 Temel İlke Bilgi Seti', note: 'Genel bilgilendirme' },
      { format: 'Story & Kapanış', purpose: '14 Günlük Maratonun Özeti & İleri Adımlar', note: '—' }
    ]

    while (days.length < 14) {
      const num = days.length + 1
      const def = defaultDays[num - 1] || defaultDays[0]
      days.push({
        day: num,
        title: `Gün ${num}: Stratejik Yayın`,
        hook: null,
        format: def.format,
        purpose: def.purpose,
        note: def.note
      })
    }
  }

  return days.slice(0, 14)
}

// ─── GÖRSEL BİLEŞENLER ───────────────────────────────────────────────────────

// 1. HERO ALANI
function DnaReportHero({ katilimciAdi, takimAdi, aiModel, promptVersion, gonderimTarihi, answers, summaryStats }) {
  const dateStr = gonderimTarihi
    ? new Date(gonderimTarihi).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Güncel Rapor'

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-500/20">
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-xs">
                <span>🧬</span> DİJİTAL DNA STRATEJİ RAPORU
              </span>
              <span className="text-[11px] text-purple-200/80 font-medium">
                {dateStr}
              </span>
              {takimAdi && takimAdi !== '—' && (
                <span className="bg-white/10 text-purple-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/10">
                  👥 {takimAdi}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {katilimciAdi ? `${katilimciAdi} — Kişiselleştirilmiş İçerik ve Operasyonel DNA Raporu` : 'Kişiselleştirilmiş İçerik ve Operasyonel DNA Raporu'}
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed max-w-3xl">
              20 soruluk İçerik Üretici DNA Envanteri cevaplarınızın çapraz analiziyle hazırlanan; konumlandırma, hitabet, içerik serileri, yasal uyum ve 14 günlük aksiyon takvimi reçeteniz.
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 bg-white/10 text-purple-100 text-xs font-bold px-3.5 py-1.5 rounded-xl border border-white/15 backdrop-blur-md">
              🤖 {aiModel || 'Gemini 3.6 Flash'} • {promptVersion || 'v5.0'}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold px-3 py-1 rounded-lg border border-emerald-500/30">
              ✓ 20/20 Soru Çapraz Analiz Edildi
            </span>
          </div>
        </div>

        {/* 4 Boyutlu Özet Çipleri */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">Mevcut Seviye</span>
            <p className="text-xs sm:text-sm font-black text-white truncate">{summaryStats.seviye}</p>
          </div>
          <div className="bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">Haftalık Kapasite</span>
            <p className="text-xs sm:text-sm font-black text-white truncate">{summaryStats.kapasite}</p>
          </div>
          <div className="bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">Kamera Skoru</span>
            <p className="text-xs sm:text-sm font-black text-white truncate">{summaryStats.kamera}</p>
          </div>
          <div className="bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">Ana Arketip</span>
            <p className="text-xs sm:text-sm font-black text-white truncate">{summaryStats.arketip}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 2. HIZLI RAPOR NAVİGASYONU
function DnaQuickNav() {
  const navItems = [
    { id: 'sec-skor', icon: '📊', label: 'Skor Kartı' },
    { id: 'sec-1', icon: '🎯', label: '1. Strateji & Pazar' },
    { id: 'sec-2', icon: '🗣️', label: '2. İletişim & Format' },
    { id: 'sec-3', icon: '🎬', label: '3. İçerik Serileri' },
    { id: 'sec-4', icon: '⭐', label: '4. Benchmark' },
    { id: 'sec-5', icon: '🛡️', label: '5. Risk & Mevzuat' },
    { id: 'sec-6', icon: '🗺️', label: '6. Yol Haritası' },
    { id: 'sec-7', icon: '📅', label: '7. 14 Günlük Takvim' },
  ]

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-2.5 shadow-soft overflow-x-auto">
      <div className="flex items-center gap-2 min-w-max">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-1">
          Hızlı Geçiş:
        </span>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-xs font-bold border border-slate-200/60 hover:border-purple-200 transition-all cursor-pointer"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// 3. SKOR KARTI (5 BOYUTLU GÖSTERGE)
function DnaScoreGrid({ section, jsonScorecard }) {
  const items = parseScorecardItems(section.body, jsonScorecard)

  const getScoreColor = (score) => {
    if (score >= 75) return {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      border: 'border-emerald-100 hover:border-emerald-300',
      icon: '✅'
    }
    if (score >= 50) return {
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      bar: 'bg-gradient-to-r from-amber-500 to-orange-500',
      border: 'border-amber-100 hover:border-amber-300',
      icon: '⚠️'
    }
    return {
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      bar: 'bg-gradient-to-r from-rose-500 to-red-500',
      border: 'border-rose-100 hover:border-rose-300',
      icon: '⚡'
    }
  }

  const getMetricIcon = (label) => {
    const l = (label || '').toLowerCase()
    if (l.includes('arketip')) return '🎭'
    if (l.includes('marka')) return '💎'
    if (l.includes('kamera') || l.includes('prod')) return '📹'
    if (l.includes('kapasite') || l.includes('üretim')) return '⚡'
    if (l.includes('kriz') || l.includes('dayanıklılık')) return '🛡️'
    return '📊'
  }

  return (
    <div id="sec-skor" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-5 scroll-mt-6">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-base shadow-2xs">
            ⭐
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-md uppercase border border-amber-200">
                Operasyonel Radar
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                İçerik DNA ve Operasyonel Skor Kartı
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Katılımcının iletişim becerileri, sürdürülebilirlik kapasitesi ve regülasyon olgunluğu (5 Boyut)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {items.map((item, i) => {
          const style = getScoreColor(item.score)
          const icon = getMetricIcon(item.label)

          return (
            <div
              key={i}
              className={`bg-slate-50/70 border ${style.border} rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all hover:bg-white hover:shadow-card`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base">{icon}</span>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${style.badge}`}>
                    %{item.score}
                  </span>
                </div>
                <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-tight leading-snug">
                  {item.label}
                </h4>
                <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${style.bar} transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(10, item.score))}%` }}
                  />
                </div>
              </div>

              {item.desc && (
                <p className="text-[11px] text-slate-600 leading-relaxed bg-white/90 p-2.5 rounded-xl border border-slate-100">
                  {item.desc}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 4. STRATEJİK PAZAR KONUMLANDIRMASI & ARKETİP KARTI
function DnaStrategyCard({ section }) {
  return (
    <div id="sec-1" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-5 scroll-mt-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
          🎯
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md uppercase">
              Bölüm 01
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {section.title || 'Stratejik Pazar Konumlandırması ve Arketip Analizi'}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Uzmanlık nişi, pazar konumu ve algı köprüsü stratejisi
          </p>
        </div>
      </div>

      <div className="bg-purple-50/40 rounded-2xl p-5 border border-purple-100/80">
        <ReportBodyRenderer body={section.body} />
      </div>
    </div>
  )
}

// 5. İLETİŞİM DİLİ, TON VE FORMAT REÇETESİ (HOOK & CTA VİTRİNİ)
function DnaFormatCard({ section, jsonHooks, jsonCtas }) {
  const { hooks, ctas } = parseHookAndCtas(section.body, jsonHooks, jsonCtas)

  // Metin içindeki ham kanca ve CTA madde işaretlerini narrative gövdeden çıkar ki alt alta çift basılmasın
  const narrativeBody = (section.body || '')
    .split('\n')
    .filter(line => {
      const cl = cleanMarkdownSymbols(line)
      if (/^(?:[\-\*•\d\.\)]\s*)?(?:Kanca|Hook)\s*\d*/i.test(cl)) return false
      if (/^(?:[\-\*•\d\.\)]\s*)?(?:CTA|Aksiyon Çağrısı)\s*\d*/i.test(cl)) return false
      if (/Kanca ve CTA Mühendisliği/i.test(cl)) return false
      if (/Önerilen Giriş Kancaları|Önerilen Aksiyon Çağrıları/i.test(cl)) return false
      return true
    })
    .join('\n')

  return (
    <div id="sec-2" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-6 scroll-mt-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
          🗣️
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md uppercase">
              Bölüm 02
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {section.title || 'İletişim Dili, Ton ve Format Reçetesi'}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Diksiyon, tempo, dikkat tutma mimarisi ve kopyalanabilir giriş/çıkış kalıpları
          </p>
        </div>
      </div>

      {/* Genel Analiz Metni (Giriş anlatımları) */}
      {narrativeBody.trim() && <ReportBodyRenderer body={narrativeBody} />}

      {/* Kanca ve CTA Özel Kart Blokları */}
      {(hooks.length > 0 || ctas.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Kancalar */}
          {hooks.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/50 border border-amber-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <span>🪝</span>
                <span>Önerilen Giriş Kancaları ({hooks.length} Adet)</span>
              </div>
              <div className="space-y-2.5">
                {hooks.map((h, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-amber-200/60 shadow-2xs flex items-start gap-2.5">
                    <span className="text-amber-500 font-bold text-sm leading-none shrink-0">“</span>
                    <p className="text-xs font-semibold text-slate-800 leading-snug italic">
                      {h}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Örnekleri */}
          {ctas.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/50 border border-indigo-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                <span>📣</span>
                <span>Önerilen Aksiyon Çağrıları ({ctas.length} Adet)</span>
              </div>
              <div className="space-y-2.5">
                {ctas.map((c, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-indigo-200/60 shadow-2xs flex items-start gap-2.5">
                    <span className="text-indigo-500 font-bold text-sm leading-none shrink-0">👉</span>
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                      {c}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 6. İÇERİK SERİLERİ VE ÜRETİM MATRİSİ (3 ÖZEL SERİ KARTI)
function DnaSeriesMatrix({ section, jsonSeries }) {
  const seriesList = parseSeriesBlocks(section.body, jsonSeries)

  return (
    <div id="sec-3" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-5 scroll-mt-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
          🎬
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md uppercase">
              Bölüm 03
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {section.title || 'Kişiselleştirilmiş İçerik Serileri ve Üretim Matrisi'}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Sürdürülebilir, tekrar üretilebilir 3 spesifik video serisi reçetesi
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {seriesList.map((s, i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/30 border border-purple-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:shadow-card transition-all"
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {s.id || (i + 1)}
                  </span>
                  <h4 className="font-black text-xs text-purple-950 leading-snug">
                    {s.title}
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 bg-white text-purple-700 font-bold px-2.5 py-0.5 rounded-full border border-purple-200 text-[10px]">
                    📹 {s.format}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 text-[10px]">
                    📡 {s.channel}
                  </span>
                </div>
              </div>

              {s.logic && (
                <div className="bg-white/90 rounded-xl p-3 border border-purple-100/80 text-[11px] text-slate-700 leading-relaxed">
                  <span className="font-bold text-purple-900 block mb-1">🎯 İçerik Mantığı:</span>
                  {s.logic}
                </div>
              )}

              {s.episodes && s.episodes.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    📌 Örnek Bölüm Başlıkları:
                  </span>
                  <ul className="space-y-1">
                    {s.episodes.map((ep, epIdx) => (
                      <li key={epIdx} className="text-[11px] text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-200/60 font-medium">
                        {ep}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {s.riskNote && (
              <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-2.5 text-[10px] text-amber-900 leading-snug flex items-start gap-1.5">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span><strong>Uyum Notu:</strong> {s.riskNote}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// 7. ROL MODEL VE BENCHMARK KARTI
function DnaBenchmarkCard({ section }) {
  return (
    <div id="sec-4" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-5 scroll-mt-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
          ⭐
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md uppercase">
              Bölüm 04
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {section.title || 'Rol Model ve Benchmark Analizi'}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Sektörel benchmark modellemesi ve görsel/işitsel estetik rehberi
          </p>
        </div>
      </div>

      <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/70">
        <ReportBodyRenderer body={section.body} />
      </div>
    </div>
  )
}

// 8. OPERASYONEL RİSKLER VE MEVZUAT FARKINDALIĞI KARTI
function DnaRiskComplianceCard({ section }) {
  return (
    <div id="sec-5" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-5 scroll-mt-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
          🛡️
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md uppercase">
              Bölüm 05
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {section.title || 'Operasyonel Riskler, Mevzuat Farkındalığı ve Tükenmişlik Analizi'}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            TİTCK/KVKK uyum ilkeleri, kriz simülasyonu ve sürdürülebilir üretim kalkanı
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
            <span>⚠️</span> Yasal Sınırlar & TİTCK/KVKK Uyarısı
          </h4>
          <p className="text-xs text-rose-950 leading-relaxed">
            Ruhsatlı ilaçların doğrudan veya dolaylı reklamı kesinlikle yasaktır. Hasta bilgileri, reçeteler veya tetkik sonuçları hiçbir koşulda açık paylaşılamaz. Marka yerine jenerik etken madde kullanılmalıdır.
          </p>
        </div>

        <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
            <span>🛡️</span> Kriz Yönetimi & Tükenmişlik Önleme
          </h4>
          <p className="text-xs text-indigo-950 leading-relaxed">
            Haksız eleştirilerde duygusal tepkiden kaçınarak literatür referanslı sakin açıklama sabitleyin. Ayda 2 yarım gün ayrılarak 8-10 video tek seansta (Batch Production) çekilmelidir.
          </p>
        </div>
      </div>

      <ReportBodyRenderer body={section.body} />
    </div>
  )
}

// 9. 7 ADIMLI YOL HARİTASI (TIMELINE / STEPPER)
function DnaRoadmapTimeline({ section, jsonRoadmap }) {
  const steps = parseRoadmapSteps(section.body, jsonRoadmap)
  const isStrict7 = steps.length === 7

  return (
    <div id="sec-6" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-6 scroll-mt-6">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
            🗺️
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md uppercase">
                Bölüm 06
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {section.title || '7 Adımlı Kapsamlı Uygulama ve Gelişim Yol Haritası'}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Bugünden itibaren devreye alınacak takvime bağlı stratejik aksiyon adımları
            </p>
          </div>
        </div>

        <div>
          {isStrict7 ? (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold px-3 py-1 rounded-full">
              ✓ 7/7 Adım Eksiksiz
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-extrabold px-3 py-1 rounded-full">
              ⚠️ {steps.length}/7 Adım
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {steps.map((stepText, i) => (
          <div
            key={i}
            className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 flex items-start gap-3.5 hover:bg-white hover:border-indigo-200/80 transition-all shadow-2xs"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0 mt-0.5">
              {i + 1}
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                Aksiyon Adımı #{i + 1}
              </span>
              <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                {stepText}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 10. 14 GÜNLÜK MİNİ İÇERİK TAKVİMİ (KARTLI GRID)
function DnaCalendarGrid({ section, jsonCalendar }) {
  const days = parseCalendarDays(section.body, jsonCalendar)
  const isStrict14 = days.length === 14

  return (
    <div id="sec-7" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-6 scroll-mt-6">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
            📅
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md uppercase">
                Bölüm 07
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {section.title || 'İlk 14 Gün İçin Mini İçerik Takvimi'}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              İlk 2 haftada uygulanacak mikro yayın akışı ve kanca planı
            </p>
          </div>
        </div>

        <div>
          {isStrict14 ? (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold px-3 py-1 rounded-full">
              ✓ 14/14 Gün Eksiksiz
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-extrabold px-3 py-1 rounded-full">
              ⚠️ {days.length}/14 Gün
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {days.map((d, idx) => (
          <div
            key={idx}
            className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:bg-white hover:shadow-card hover:border-purple-200 transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="bg-purple-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                  {d.day}. Gün
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  📹 {d.format}
                </span>
              </div>
              <h5 className="font-bold text-xs text-slate-900 leading-snug">
                {d.title}
              </h5>

              {d.hook && (
                <div className="bg-purple-50/80 p-2 rounded-lg border border-purple-100 text-[11px] text-purple-950 leading-tight italic">
                  “{d.hook}”
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="text-[10px] text-slate-500 font-medium">
                🎯 <strong>Amaç:</strong> {d.purpose}
              </div>
              {d.note && (
                <div className="text-[10px] text-amber-700 font-medium">
                  🛡️ {d.note}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 11. GENEL / DİĞER BÖLÜM KARTI
function DnaGenericSectionCard({ section, index }) {
  const titleLower = (section.title || '').toLowerCase()
  let icon = '📌'
  let badge = `Ek Bölüm ${index + 1}`

  if (titleLower.includes('arketip')) { icon = '🎭'; badge = 'Arketip' }
  else if (titleLower.includes('dili') || titleLower.includes('karakter')) { icon = '🗣️'; badge = 'İletişim Dili' }
  else if (titleLower.includes('reçete') || titleLower.includes('teknik')) { icon = '📋'; badge = 'Format Reçetesi' }
  else if (titleLower.includes('rol model') || titleLower.includes('benchmark')) { icon = '⭐'; badge = 'Benchmark' }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-base border border-purple-100 shrink-0">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md uppercase">
              {badge}
            </span>
            <h4 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">{section.title}</h4>
          </div>
          <p className="text-[11px] text-slate-400">Analiz detay ve strateji notları</p>
        </div>
      </div>
      <ReportBodyRenderer body={section.body} />
    </div>
  )
}

// ─── ANA BİLEŞEN: DnaReportRenderer ──────────────────────────────────────────

export default function DnaReportRenderer({
  reportText,
  raporJson = null,
  aiModel,
  promptVersion,
  answers = {},
  katilimciAdi = '',
  takimAdi = '',
  gonderimTarihi = null,
  isAdmin = false
}) {
  const [showRawText, setShowRawText] = useState(false)

  if (!reportText || typeof reportText !== 'string' || !reportText.trim()) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center space-y-3">
        <span className="text-4xl block">🧬</span>
        <h3 className="text-base font-bold text-slate-700">Henüz DNA Analiz Raporu Üretilmemiş</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Katılımcı 20 soruluk İçerik Üretici DNA Envanterini tamamlayıp gönderdiğinde stratejik rapor otomatik üretilecektir.
        </p>
      </div>
    )
  }

  // Özet İstatistikleri Çıkar
  const summaryStats = {
    seviye: 'Orta Seviye',
    kapasite: '2-3 İçerik / Hafta',
    kamera: '7/10 (Rahat)',
    arketip: 'Eğitici & Yol Gösterici'
  }

  if (answers && typeof answers === 'object') {
    if (answers.soru_15) summaryStats.seviye = cleanMarkdownSymbols(String(answers.soru_15))
    if (answers.soru_14) summaryStats.kapasite = cleanMarkdownSymbols(String(answers.soru_14))
    if (answers.soru_9) summaryStats.kamera = `${cleanMarkdownSymbols(String(answers.soru_9))}/5`
    if (answers.soru_16) summaryStats.arketip = cleanMarkdownSymbols(String(answers.soru_16)).split(':')[0]
  }

  const sections = parseMarkdownSections(reportText)

  return (
    <div className="space-y-6">
      {/* 1. Hero / Rapor Başlığı */}
      <DnaReportHero
        katilimciAdi={katilimciAdi}
        takimAdi={takimAdi}
        aiModel={aiModel}
        promptVersion={promptVersion}
        gonderimTarihi={gonderimTarihi}
        answers={answers}
        summaryStats={summaryStats}
      />

      {/* 2. Hızlı Rapor Navigasyonu */}
      <DnaQuickNav />

      {/* 3. Bölüm Kartları */}
      <div className="space-y-6">
        {sections.map((sec, idx) => {
          const titleUpper = (sec.title || '').toUpperCase()

          // SKOR KARTI
          if (titleUpper.includes('SKOR')) {
            return <DnaScoreGrid key={idx} section={sec} jsonScorecard={raporJson?.scorecard} />
          }

          // 1. STRATEJİK PAZAR KONUMLANDIRMASI
          if (titleUpper.includes('1.') || titleUpper.includes('STRATEJİ') || titleUpper.includes('STRATEJI') || titleUpper.includes('KONUMLANDIRMA')) {
            return <DnaStrategyCard key={idx} section={sec} />
          }

          // 2. İLETİŞİM DİLİ, TON VE FORMAT REÇETESİ
          if (titleUpper.includes('2.') || titleUpper.includes('İLETİŞİM') || titleUpper.includes('ILETISIM') || titleUpper.includes('FORMAT REÇETESİ')) {
            return <DnaFormatCard key={idx} section={sec} jsonHooks={raporJson?.hooks} jsonCtas={raporJson?.ctas} />
          }

          // 3. İÇERİK SERİLERİ VE ÜRETİM MATRİSİ
          if (titleUpper.includes('3.') || titleUpper.includes('SERİ') || titleUpper.includes('SERI')) {
            return <DnaSeriesMatrix key={idx} section={sec} jsonSeries={raporJson?.content_series} />
          }

          // 4. ROL MODEL VE BENCHMARK
          if (titleUpper.includes('4.') || titleUpper.includes('ROL MODEL') || titleUpper.includes('BENCHMARK')) {
            return <DnaBenchmarkCard key={idx} section={sec} />
          }

          // 5. OPERASYONEL RİSKLER VE MEVZUAT FARKINDALIĞI
          if (titleUpper.includes('5.') || titleUpper.includes('RİSK') || titleUpper.includes('RISK') || titleUpper.includes('MEVZUAT') || titleUpper.includes('TİTCK') || titleUpper.includes('KVKK')) {
            return <DnaRiskComplianceCard key={idx} section={sec} />
          }

          // 6. 7 ADIMLI YOL HARİTASI
          if (titleUpper.includes('6.') || titleUpper.includes('YOL HARİTASI') || titleUpper.includes('YOL HARITASI') || titleUpper.includes('ADIM')) {
            return <DnaRoadmapTimeline key={idx} section={sec} jsonRoadmap={raporJson?.roadmap} />
          }

          // 7. 14 GÜNLÜK MİNİ İÇERİK TAKVİMİ
          if (titleUpper.includes('7.') || titleUpper.includes('14 GÜN') || titleUpper.includes('14 GUN') || titleUpper.includes('TAKVİM') || titleUpper.includes('TAKVIM')) {
            return <DnaCalendarGrid key={idx} section={sec} jsonCalendar={raporJson?.mini_calendar_14_days} />
          }

          // DİĞER / GENEL KART
          return <DnaGenericSectionCard key={idx} section={sec} index={idx} />
        })}
      </div>

      {/* Ham Metin / Debug Görüntüleyici (Varsayılan Kapalı) */}
      <div className="pt-2">
        <button
          onClick={() => setShowRawText(!showRawText)}
          className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>{showRawText ? '▼' : '►'}</span>
          <span>Ham Markdown Metnini {showRawText ? 'Gizle' : 'Göster'}</span>
        </button>

        {showRawText && (
          <div className="mt-3 bg-slate-900 text-slate-200 p-5 rounded-2xl font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-96 border border-slate-800">
            {reportText}
          </div>
        )}
      </div>
    </div>
  )
}
