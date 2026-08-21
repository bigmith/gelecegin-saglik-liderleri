import React, { useState } from 'react'

// ─── HELPER: Metin Temizleme ve Ayrıştırma ─────────────────────────────────────

// Dayanak ve AI teknik etiketlerini katılımcı metninden temizler
export const stripEvidenceAndJargon = (str) => {
  if (!str || typeof str !== 'string') return ''
  return str
    .replace(/\[\s*(?:Dayanak|dayanak|Evidence|evidence|based_on|based_on_answers|why_this_fits|personalization_evidence)[^\]]*\]/gi, '')
    .replace(/(?:^|\n)\s*(?:Dayanak|dayanak|Evidence|evidence)\s*:\s*[^\n]*/gi, '')
    .replace(/\bS\d+\s*=\s*[^|\n,]+/g, '')
    .replace(/\s{2,}/g, ' ')
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
  const cleaned = stripEvidenceAndJargon(text)
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

// Başlıkları son kullanıcı dostu sade ifadelere dönüştürür
export const humanizeSectionTitle = (title) => {
  if (!title) return ''
  const t = title.toUpperCase()
  if (t.includes('SKOR')) return 'Dijital DNA Skor Kartı'
  if (t.includes('1.') || t.includes('STRATEJİ') || t.includes('KONUMLANDIRMA')) return 'Seni Sosyal Medyada Nasıl Konumlandıralım?'
  if (t.includes('2.') || t.includes('İLETİŞİM') || t.includes('FORMAT REÇETESİ') || t.includes('KANCA') || t.includes('CTA')) return 'Anlatım Tarzın ve En Uygun Formatların'
  if (t.includes('3.') || t.includes('SERİ')) return 'Önerilen 3 İçerik Serisi'
  if (t.includes('4.') || t.includes('ROL MODEL') || t.includes('BENCHMARK')) return 'İlham Alabileceğin Hesaplar ve Tarzlar'
  if (t.includes('5.') || t.includes('RİSK') || t.includes('MEVZUAT') || t.includes('TİTCK') || t.includes('KVKK') || t.includes('TÜKENMİŞLİK')) return 'Dikkat Etmen Gerekenler & Mevzuat'
  if (t.includes('6.') || t.includes('YOL HARİTASI') || t.includes('7 ADIM') || t.includes('ADIM')) return 'Başlamak İçin 7 Adım'
  if (t.includes('7.') || t.includes('14 GÜN') || t.includes('TAKVİM')) return 'İlk 14 Gün Ne Paylaşabilirsin?'
  return cleanMarkdownSymbols(title)
}

export const ReportBodyRenderer = ({ body }) => {
  if (!body || typeof body !== 'string') return null
  const cleanBody = stripEvidenceAndJargon(body)
  const lines = cleanBody.split('\n')
  const elements = []
  let listItems = []

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-2 my-2 pl-1">
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
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      return
    }

    // Dayanak satırlarını atla
    if (/^(?:\[\s*Dayanak|Dayanak\s*:|\[\s*based_on)/i.test(trimmed)) {
      return
    }

    // Alt Başlık (### veya **)
    if (trimmed.startsWith('###') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 70)) {
      flushList()
      const headingText = cleanMarkdownSymbols(trimmed)
      elements.push(
        <h5 key={`h5-${lineIdx}`} className="text-xs font-bold text-purple-950 tracking-wide mt-3 mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-3 bg-purple-600 rounded-full inline-block"></span>
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
      <p key={`p-${lineIdx}`} className="text-xs text-slate-700 leading-relaxed my-1.5">
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

// 1. Skor Kartı Parser (5 Boyut)
const parseScorecardItems = (body) => {
  const cleanBody = stripEvidenceAndJargon(body || '')
  const lines = cleanBody.split('\n').map(l => l.trim()).filter(Boolean)
  const items = []
  let currentItem = null

  lines.forEach(line => {
    const cleanLine = cleanMarkdownSymbols(line)
    if (!cleanLine || cleanLine.startsWith('_') || cleanLine.length < 3) return

    const isMetricHeader = /^(Arketip Eşleşmesi|Marka Tutarlılığı|Kamera ve Prodüksiyon Hazırlığı|İçerik Üretim Kapasitesi|Kriz Yönetimi Dayanıklılığı|.*?[Ss]kor.*?)[:\-]/i.test(cleanLine) || cleanLine.includes('%')

    if (isMetricHeader) {
      if (currentItem) items.push(currentItem)
      const parts = cleanLine.split(/[:\-]/)
      const label = parts[0].trim()
      const val = parts.slice(1).join(':').trim()
      const pctMatch = val.match(/%?(\d+)/)
      const score = pctMatch ? parseInt(pctMatch[1], 10) : 80
      
      // İlk cümleyi veya kısa özeti al
      let shortDesc = val.replace(/%?\d+/, '').replace(/^[:\-\s]+/, '').trim()
      currentItem = { label, score, desc: shortDesc }
    } else if (currentItem) {
      if (!currentItem.desc) {
        currentItem.desc = cleanLine
      } else if (currentItem.desc.length < 120) {
        currentItem.desc = `${currentItem.desc} ${cleanLine}`
      }
    } else {
      items.push({ label: 'Performans Kriteri', score: 75, desc: cleanLine })
    }
  })
  if (currentItem) items.push(currentItem)

  // Default etiketleri insanileştir
  return items.map(it => {
    let simpleLabel = it.label
    let icon = '📊'
    if (/arketip/i.test(it.label)) { simpleLabel = 'Arketip & Dil Uyumu'; icon = '🎭' }
    else if (/marka/i.test(it.label)) { simpleLabel = 'Marka Netliği'; icon = '💎' }
    else if (/kamera/i.test(it.label)) { simpleLabel = 'Kamera Rahatlığı'; icon = '📹' }
    else if (/kapasite|üretim/i.test(it.label)) { simpleLabel = 'Üretim Kapasitesi'; icon = '⚡' }
    else if (/kriz|dayanıklılık/i.test(it.label)) { simpleLabel = 'Mevzuat & Kriz Refleksi'; icon = '🛡️' }

    return {
      ...it,
      simpleLabel,
      icon,
      desc: it.desc ? it.desc.split('.')[0] + '.' : 'Kişiselleştirilmiş analiz skoru.'
    }
  })
}

// 2. Kanca ve CTA Parser
const parseHookAndCtas = (body) => {
  const hooks = []
  const ctas = []
  const cleanBody = stripEvidenceAndJargon(body || '')
  const lines = cleanBody.split('\n').map(l => l.trim()).filter(Boolean)

  lines.forEach(l => {
    const clean = cleanMarkdownSymbols(l)
    if (/Kanca\s*\d*|Hook/i.test(clean)) {
      // Temiz kanca cümlesini çıkar
      const match = clean.replace(/^(?:[-*•]\s*)?(?:Kanca\s*\d*|Hook\s*\d*)[^:]*:\s*/i, '').replace(/^["'«“]|["'»”]$/g, '').trim()
      if (match && match.length > 5) hooks.push(match)
    } else if (/CTA\s*\d*|Aksiyon Çağrısı/i.test(clean)) {
      // Temiz CTA cümlesini çıkar
      const match = clean.replace(/^(?:[-*•]\s*)?(?:CTA\s*\d*|Aksiyon Çağrısı\s*\d*)[^:]*:\s*/i, '').replace(/^["'«“]|["'»”]$/g, '').trim()
      if (match && match.length > 5) ctas.push(match)
    }
  })

  return { hooks, ctas }
}

// 3. İçerik Serileri Parser (3 Sade Seri)
const parseSeriesBlocks = (body) => {
  const rawBody = stripEvidenceAndJargon(body || '')
  const seriesBlocks = rawBody.split(/(?:^|\n)(?:###|\*\*|\d+[\.\)]|\-)\s*(?:Seri|İçerik Serisi)\s*(\d*[:\-\s]*[^\n]+)/i).filter(Boolean)
  const series = []

  if (seriesBlocks.length >= 2) {
    for (let i = 0; i < seriesBlocks.length; i += 2) {
      const headerTitle = seriesBlocks[i] ? cleanMarkdownSymbols(seriesBlocks[i]) : `Seri ${Math.floor(i / 2) + 1}`
      const content = seriesBlocks[i + 1] || ''
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean)

      let format = ''
      let channel = ''
      let logic = ''
      let riskNote = ''
      const episodes = []

      lines.forEach(l => {
        const cl = cleanMarkdownSymbols(l)
        if (/Format[:\s]*/i.test(cl)) {
          format = cl.replace(/Format[:\s]*/i, '').trim()
        } else if (/Yayın Kanalı|Kanal[:\s]*/i.test(cl)) {
          channel = cl.replace(/(?:Yayın )?Kanalı?[:\s]*/i, '').trim()
        } else if (/Detaylı İçerik Mantığı|Mantık|Amaç|Hedef[:\s]*/i.test(cl)) {
          logic = cl.replace(/(?:Detaylı )?(?:İçerik Mantığı|Mantık|Amaç|Hedef)[:\s]*/i, '').trim()
        } else if (/Risk|Uyum Notu|TİTCK|KVKK[:\s]*/i.test(cl)) {
          riskNote = cl.replace(/(?:Risk\/uyum notu|Risk notu|Uyum notu|Uyum)[:\s]*/i, '').trim()
        } else if (/Bölüm\s*\d*[:\s]*/i.test(cl) || /^\*\s*Bölüm/i.test(l) || /^[-*•]\s*Bölüm/i.test(cl)) {
          episodes.push(cl.replace(/^[\*\-•]\s*/, '').replace(/^Bölüm\s*\d*[:\s\-]*/i, ''))
        } else if (!logic && cl.length > 20 && !cl.startsWith('Format') && !cl.startsWith('Bölüm')) {
          logic = cl
        }
      })

      series.push({
        id: Math.floor(i / 2) + 1,
        title: headerTitle.replace(/^Seri\s*\d*[:\-\s]*/i, '').trim() || `İçerik Serisi ${Math.floor(i / 2) + 1}`,
        format: format || 'Reels / Shorts (Kısa Video)',
        channel: channel || 'Instagram / LinkedIn',
        logic: logic || 'Uzmanlık alanınızda güven inşa eden ve sık sorulan soruları yanıtlayan seri.',
        episodes: episodes.slice(0, 3),
        riskNote: riskNote || 'TİTCK uyumlu; tıbbi iddia ve ilaç ismi olmadan genel etken madde bilgisi.'
      })
    }
  }

  return series
}

// 4. 7 Adımlı Yol Haritası Parser
export const parseRoadmapSteps = (body) => {
  const cleanBody = stripEvidenceAndJargon(body || '')
  const lines = cleanBody.split('\n').map(l => l.trim()).filter(Boolean)
  const steps = []

  lines.forEach(l => {
    const clean = cleanMarkdownSymbols(stripEvidenceAndJargon(l))
    if (!clean || clean.length < 5) return

    const match = clean.match(/(?:^|[\-\*•\d\.\)]\s*)Ad[ıi]m\s*(\d+)[:\s\-]*(.*)/i)
    if (match) {
      const stepNum = parseInt(match[1], 10)
      const rest = match[2] ? match[2].trim() : ''

      let title = `Adım ${stepNum}`
      let desc = rest
      let tip = ''

      // [Başlık] Açıklama yapısı kontrolü
      const bracketMatch = rest.match(/^\[([^\]]+)\]\s*(.*)/)
      if (bracketMatch) {
        title = bracketMatch[1].trim()
        desc = bracketMatch[2].trim()
      } else if (rest.includes(':')) {
        const parts = rest.split(':')
        if (parts[0].length < 35) {
          title = parts[0].trim()
          desc = parts.slice(1).join(':').trim()
        }
      }

      // İpucu varsa ayır
      if (/İpucu:|ipucu:|Not:/i.test(desc)) {
        const tipParts = desc.split(/İpucu:|ipucu:|Not:/i)
        desc = tipParts[0].trim()
        tip = tipParts[1].trim()
      }

      // Desc içindeki gereksiz teknik kalıntıları temizle
      desc = desc.replace(/^-\s*/, '').trim()

      steps.push({
        num: stepNum,
        title: title || `Aksiyon Adımı #${stepNum}`,
        desc: desc || 'Planlanan uygulama adımı.',
        tip: tip || null
      })
    }
  })

  return steps
}

// 5. 14 Günlük Mini Takvim Parser
export const parseCalendarDays = (body) => {
  const cleanBody = stripEvidenceAndJargon(body || '')
  const lines = cleanBody.split('\n').map(l => l.trim()).filter(Boolean)
  const days = []

  lines.forEach(l => {
    const clean = cleanMarkdownSymbols(stripEvidenceAndJargon(l))
    if (/(?:^|[\-\*•\d\.\)]\s*)G[üu]n\s*\d+/i.test(l) || /^G[üu]n\s*\d+/i.test(clean)) {
      const dayMatch = clean.match(/G[üu]n\s*(\d+)[:\s\-]*(.*)/i)
      const dayNum = dayMatch ? parseInt(dayMatch[1], 10) : (days.length + 1)
      const lineContent = dayMatch ? dayMatch[2] : clean

      const parts = lineContent.split('|').map(p => p.trim())
      let title = parts[0] ? parts[0].replace(/^\[|\]$/g, '').trim() : `Gün ${dayNum}`
      let hook = ''
      let format = ''
      let purpose = ''
      let note = ''

      parts.slice(1).forEach(p => {
        if (/Kanca[:\s]*/i.test(p)) {
          hook = p.replace(/Kanca[:\s]*/i, '').replace(/^["'«“]|["'»”]$/g, '').trim()
        } else if (/Format[:\s]*/i.test(p)) {
          format = p.replace(/Format[:\s]*/i, '').trim()
        } else if (/Amaç[:\s]*/i.test(p)) {
          purpose = p.replace(/Amaç[:\s]*/i, '').trim()
        } else if (/Uyum|Risk[:\s]*/i.test(p)) {
          note = p.replace(/(?:Uyum Notu|Risk Notu|Uyum|Risk)[:\s]*/i, '').trim()
        }
      })

      if (hook === '—' || hook === '-') hook = ''
      if (note === '—' || note === '-') note = ''

      // Küçük rozet sadeleştirmesi
      let simpleBadge = null
      if (note) {
        if (note.includes('İlaçsız') || note.includes('Reklamsız')) simpleBadge = 'İlaçsız Bilgi'
        else if (note.includes('Mahremiyet') || note.includes('KVKK')) simpleBadge = 'KVKK / Mahremiyet'
        else if (note.includes('Danışın')) simpleBadge = 'Uzmana Danışın'
        else simpleBadge = 'TİTCK Uyumlu'
      }

      days.push({
        day: dayNum,
        title: title || `İçerik Yayını #${dayNum}`,
        hook: hook && hook.length > 5 ? hook : null,
        format: format || 'Kısa Video / Story',
        purpose: purpose || 'Etkileşim & Otorite',
        note: simpleBadge
      })
    }
  })

  return days
}

// ─── GÖRSEL BİLEŞENLER ───────────────────────────────────────────────────────

// 1. HERO BÖLÜMÜ
function DnaReportHero({ katilimciAdi, takimAdi, aiModel, gonderimTarihi }) {
  const dateStr = gonderimTarihi
    ? new Date(gonderimTarihi).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Güncel Rapor'

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-500/20">
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
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
              {katilimciAdi ? `${katilimciAdi} — Kişisel İçerik ve Strateji Raporu` : 'Kişisel İçerik ve Strateji Raporu'}
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed max-w-2xl">
              20 soruluk DNA testinize göre hazırlanan; iletişim tarzınız, video serileriniz ve 14 günlük pratik paylaşım rehberiniz.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 bg-white/10 text-purple-100 text-xs font-bold px-3 py-1.5 rounded-xl border border-white/15 backdrop-blur-md">
              ✓ Kişiye Özel Analiz
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 2. DNA ÖZETİ & MİNİ AKSİYON KUTUSU (YENİ SADE MODÜL)
function DnaSummaryCard({ summaryStats, answers }) {
  // Dinamik güçlü yön ve dikkat alanı çıkarımı
  const cameraVal = Number(answers?.soru_9) || 3
  const strongArea = cameraVal >= 4
    ? 'Doğal Kamera Rahatlığı & Akıcı Hitabet'
    : answers?.soru_11
    ? String(answers.soru_11).split(':')[0]
    : 'Güçlü Mesleki Uzmanlık & Otorite'

  const focusArea = answers?.soru_10
    ? String(answers.soru_10).split(':')[0]
    : 'Zaman Yönetimi ve Toplu Çekim Disiplini'

  return (
    <div className="bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/50 rounded-3xl p-6 border border-purple-100/90 shadow-soft space-y-5">
      {/* 5 Boyutlu Özet Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-purple-100 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider block">🎭 Ana Tarzın</span>
          <p className="text-xs font-black text-slate-800 truncate">{summaryStats.arketip}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">⚡ En Güçlü Yönün</span>
          <p className="text-xs font-black text-slate-800 truncate">{strongArea}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">🎯 Odak / Dikkat Alanı</span>
          <p className="text-xs font-black text-slate-800 truncate">{focusArea}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">📹 Başlangıç Formatı</span>
          <p className="text-xs font-black text-slate-800 truncate">{summaryStats.format}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-purple-100 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider block">📅 Önerilen Tempo</span>
          <p className="text-xs font-black text-slate-800 truncate">{summaryStats.kapasite}</p>
        </div>
      </div>

      {/* Bugün Ne Yapmalıyım? (3 Maddelik Mini Aksiyon Kutusu) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-indigo-100/90 space-y-3">
        <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xs uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
          <span>Bugün Ne Yapmalıyım? (3 Hızlı Adım)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100/60">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
            <div className="space-y-0.5">
              <h5 className="text-xs font-bold text-slate-900">Biyografini Düzenle</h5>
              <p className="text-[11px] text-slate-600 leading-snug">Uzmanlık nişini ve kime fayda sağladığını profiline 1 cümlede yaz.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50/50 border border-purple-100/60">
            <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
            <div className="space-y-0.5">
              <h5 className="text-xs font-bold text-slate-900">İlk Konunu Seç</h5>
              <p className="text-[11px] text-slate-600 leading-snug">Aşağıdaki İçerik Serisi 1'deki ilk konu başlığını not al.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/60">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
            <div className="space-y-0.5">
              <h5 className="text-xs font-bold text-slate-900">14 Günlük Takvimi İncele</h5>
              <p className="text-[11px] text-slate-600 leading-snug">İlk videon için çekim açını belirle ve kısa bir deneme kaydı al.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 3. HIZLI RAPOR NAVİGASYONU
function DnaQuickNav() {
  const navItems = [
    { id: 'sec-skor', icon: '📊', label: 'Skor Kartı' },
    { id: 'sec-1', icon: '🎯', label: 'Konumlandırma' },
    { id: 'sec-2', icon: '🗣️', label: 'Anlatım & Format' },
    { id: 'sec-3', icon: '🎬', label: 'İçerik Serileri' },
    { id: 'sec-4', icon: '⭐', label: 'İlham & Tarz' },
    { id: 'sec-5', icon: '🛡️', label: 'Mevzuat & Dikkat' },
    { id: 'sec-6', icon: '🗺️', label: '7 Adım' },
    { id: 'sec-7', icon: '📅', label: '14 Günlük Takvim' },
  ]

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-2 shadow-soft overflow-x-auto">
      <div className="flex items-center gap-1.5 min-w-max">
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

// 4. SKOR KARTI (5 BOYUTLU GÖSTERGE - SADELEŞTİRİLMİŞ)
function DnaScoreGrid({ section }) {
  const items = parseScorecardItems(section.body)

  const getScoreColor = (score) => {
    if (score >= 75) return {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      border: 'border-emerald-100 hover:border-emerald-200'
    }
    if (score >= 50) return {
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      bar: 'bg-gradient-to-r from-amber-500 to-orange-500',
      border: 'border-amber-100 hover:border-amber-200'
    }
    return {
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      bar: 'bg-gradient-to-r from-rose-500 to-red-500',
      border: 'border-rose-100 hover:border-rose-200'
    }
  }

  return (
    <div id="sec-skor" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-5 scroll-mt-6">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
          📊
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-md uppercase border border-amber-200">
              5 Boyutlu Değerlendirme
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Dijital DNA Skor Kartı
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            İletişim becerileriniz, sürdürülebilir tempo ve içerik olgunluğunuz
          </p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {items.map((item, i) => {
            const style = getScoreColor(item.score)

            return (
              <div
                key={i}
                className={`bg-slate-50/70 border ${style.border} rounded-2xl p-4 flex flex-col justify-between space-y-2.5 transition-all hover:bg-white hover:shadow-card`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base">{item.icon}</span>
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${style.badge}`}>
                      %{item.score}
                    </span>
                  </div>
                  <h4 className="text-[11px] font-extrabold text-slate-800 tracking-tight leading-snug">
                    {item.simpleLabel || item.label}
                  </h4>
                  <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${style.bar} transition-all duration-500`}
                      style={{ width: `${Math.min(100, Math.max(10, item.score))}%` }}
                    />
                  </div>
                </div>

                {item.desc && (
                  <p className="text-[11px] text-slate-600 leading-relaxed bg-white/90 p-2 rounded-xl border border-slate-100">
                    {item.desc}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <ReportBodyRenderer body={section.body} />
      )}
    </div>
  )
}

// 5. STRATEJİK KONUMLANDIRMA (BÖLÜM 1)
function DnaStrategyCard({ section }) {
  return (
    <div id="sec-1" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-5 scroll-mt-6">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
          🎯
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md uppercase">
              Bölüm 01
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {humanizeSectionTitle(section.title)}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Uzmanlık odağınız, hedef kitle algınız ve dijital kimlik köprünüz
          </p>
        </div>
      </div>

      <div className="bg-purple-50/30 rounded-2xl p-5 border border-purple-100/70">
        <ReportBodyRenderer body={section.body} />
      </div>
    </div>
  )
}

// 6. ANLATIM TARZI VE FORMAT (HOOK & CTA - BÖLÜM 2)
function DnaFormatCard({ section }) {
  const { hooks, ctas } = parseHookAndCtas(section.body)

  return (
    <div id="sec-2" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-5 scroll-mt-6">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
          🗣️
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md uppercase">
              Bölüm 02
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {humanizeSectionTitle(section.title)}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Konuşma temponuz, ideal video süreniz ve kullanabileceğiniz hazır kalıplar
          </p>
        </div>
      </div>

      {/* Genel Analiz Metni */}
      <ReportBodyRenderer body={section.body} />

      {/* Sade Kanca ve CTA Blokları */}
      {(hooks.length > 0 || ctas.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Kancalar */}
          {hooks.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 border border-amber-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <span>🪝</span>
                <span>Videoya Böyle Başlayabilirsin (3 Giriş Örneği)</span>
              </div>
              <div className="space-y-2.5">
                {hooks.map((h, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-amber-200/60 shadow-2xs flex items-start gap-2.5">
                    <span className="text-amber-500 font-bold text-sm leading-none shrink-0 mt-0.5">“</span>
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
            <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/40 border border-indigo-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                <span>📣</span>
                <span>Videoyu Böyle Bitirebilirsin (3 Kapanış Örneği)</span>
              </div>
              <div className="space-y-2.5">
                {ctas.map((c, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-indigo-200/60 shadow-2xs flex items-start gap-2.5">
                    <span className="text-indigo-500 font-bold text-sm leading-none shrink-0 mt-0.5">👉</span>
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

// 7. İÇERİK SERİLERİ (BÖLÜM 3 - 3 SADE KART)
function DnaSeriesMatrix({ section }) {
  const seriesList = parseSeriesBlocks(section.body)

  return (
    <div id="sec-3" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-5 scroll-mt-6">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
          🎬
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md uppercase">
              Bölüm 03
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {humanizeSectionTitle(section.title)}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Sürekli konu aramak zorunda kalmayacağınız, sürdürülebilir 3 video formatı
          </p>
        </div>
      </div>

      {seriesList.length >= 2 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {seriesList.map((s, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-purple-50/30 via-white to-indigo-50/20 border border-purple-200/70 rounded-2xl p-5 flex flex-col justify-between space-y-3.5 hover:shadow-card transition-all"
            >
              <div className="space-y-3">
                {/* Seri Başlığı ve Rozetler */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {s.id}
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

                {/* Mantık / Amaç */}
                <div className="bg-white/90 rounded-xl p-3 border border-purple-100/80 text-[11px] text-slate-700 leading-relaxed">
                  <span className="font-bold text-purple-900 block mb-0.5">🎯 Kimin İçin? / İçerik Mantığı:</span>
                  {s.logic}
                </div>

                {/* Örnek Bölümler */}
                {s.episodes && s.episodes.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      📌 İlk 3 Bölüm Fikri:
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

              {/* Uyum Rozeti */}
              {s.riskNote && (
                <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-2 text-[10px] text-amber-900 leading-snug flex items-start gap-1.5">
                  <span className="shrink-0">⚠️</span>
                  <span>{s.riskNote}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <ReportBodyRenderer body={section.body} />
      )}
    </div>
  )
}

// 8. ROL MODEL VE BENCHMARK (BÖLÜM 4)
function DnaBenchmarkCard({ section }) {
  return (
    <div id="sec-4" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-5 scroll-mt-6">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
          ⭐
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md uppercase">
              Bölüm 04
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {humanizeSectionTitle(section.title)}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Sektördeki iyi örneklerden ilham alırken kendi özgün sesinizi koruma rehberi
          </p>
        </div>
      </div>

      <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/70">
        <ReportBodyRenderer body={section.body} />
      </div>
    </div>
  )
}

// 9. DİKKAT EDİLECEKLER & MEVZUAT (BÖLÜM 5 - SADELEŞTİRİLMİŞ)
function DnaRiskComplianceCard({ section }) {
  return (
    <div id="sec-5" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-5 scroll-mt-6">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
          🛡️
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md uppercase">
              Bölüm 05
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {humanizeSectionTitle(section.title)}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            TİTCK / KVKK sınırları, sakin iletişim ve tükenmişliği önleme taktikleri
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
            <span>⚠️</span> Yasal Sınırlar & TİTCK / KVKK Özeti
          </h4>
          <p className="text-xs text-rose-950 leading-relaxed">
            Ruhsatlı ilaçların reklamı yasaktır. Hasta bilgileri veya reçeteler paylaşılamaz. Marka yerine jenerik etken madde üzerinden genel bilgilendirme yapılmalıdır.
          </p>
        </div>

        <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
            <span>🛡️</span> Sakin İletişim & Toplu Çekim
          </h4>
          <p className="text-xs text-indigo-950 leading-relaxed">
            Haksız yorumlarda tartışmaya girmeden bilimsel ve sakin kalın. Ayda 2 yarım gün ayırarak 6-8 videoyu tek seansta toplu (batch) çekin.
          </p>
        </div>
      </div>

      <ReportBodyRenderer body={section.body} />
    </div>
  )
}

// 10. BAŞLAMAK İÇİN 7 ADIM (BÖLÜM 6 - SADE KARTLAR)
function DnaRoadmapTimeline({ section }) {
  const steps = parseRoadmapSteps(section.body)
  const isStrict7 = steps.length === 7

  return (
    <div id="sec-6" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-5 scroll-mt-6">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 flex-wrap">
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
                {humanizeSectionTitle(section.title)}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Bugünden itibaren sırayla uygulayabileceğiniz 7 pratik görev
            </p>
          </div>
        </div>

        <div>
          {isStrict7 ? (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold px-3 py-1 rounded-full">
              ✓ 7 Adım Tamam
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-extrabold px-3 py-1 rounded-full">
              {steps.length} Adım
            </span>
          )}
        </div>
      </div>

      {steps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 flex items-start gap-3.5 hover:bg-white hover:border-indigo-200/80 transition-all shadow-2xs"
            >
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                {step.num || (i + 1)}
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-slate-900 leading-snug">
                  {step.title}
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
                {step.tip && (
                  <span className="inline-block text-[10px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md mt-1">
                    💡 {step.tip}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ReportBodyRenderer body={section.body} />
      )}
    </div>
  )
}

// 11. İLK 14 GÜN NE PAYLAŞABİLİRSİN? (BÖLÜM 7 - KOMPAKT TAKVİM GRİD)
function DnaCalendarGrid({ section }) {
  const days = parseCalendarDays(section.body)
  const isStrict14 = days.length === 14

  return (
    <div id="sec-7" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-5 scroll-mt-6">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 flex-wrap">
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
                {humanizeSectionTitle(section.title)}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              İlk 2 haftada paylaşabileceğiniz hazır içerik fikirleri ve kancalar
            </p>
          </div>
        </div>

        <div>
          {isStrict14 ? (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold px-3 py-1 rounded-full">
              ✓ 14 Günlük Takvim
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-extrabold px-3 py-1 rounded-full">
              {days.length} Gün
            </span>
          )}
        </div>
      </div>

      {days.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {days.map((d, idx) => (
            <div
              key={idx}
              className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col justify-between space-y-2.5 hover:bg-white hover:shadow-card hover:border-purple-200 transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="bg-purple-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                    {d.day}. Gün
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 truncate">
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

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px] text-slate-500">
                <span className="truncate">🎯 {d.purpose}</span>
                {d.note && (
                  <span className="shrink-0 bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-medium border border-amber-200/60">
                    {d.note}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ReportBodyRenderer body={section.body} />
      )}
    </div>
  )
}

// 12. GENEL / DİĞER BÖLÜM KARTI
function DnaGenericSectionCard({ section, index }) {
  const titleLower = (section.title || '').toLowerCase()
  let icon = '📌'
  let badge = `Ek Bölüm ${index + 1}`

  if (titleLower.includes('arketip')) { icon = '🎭'; badge = 'Arketip' }
  else if (titleLower.includes('dili') || titleLower.includes('karakter')) { icon = '🗣️'; badge = 'İletişim Dili' }
  else if (titleLower.includes('reçete') || titleLower.includes('teknik')) { icon = '📋'; badge = 'Format' }
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
            <h4 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">{humanizeSectionTitle(section.title)}</h4>
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
    arketip: 'Eğitici & Yol Gösterici',
    format: '30-45 sn Kısa Video (Reels)'
  }

  if (answers && typeof answers === 'object') {
    if (answers.soru_15) summaryStats.seviye = cleanMarkdownSymbols(String(answers.soru_15))
    if (answers.soru_14) summaryStats.kapasite = `${cleanMarkdownSymbols(String(answers.soru_14))} İçerik / Hafta`
    if (answers.soru_9) summaryStats.kamera = `${cleanMarkdownSymbols(String(answers.soru_9))}/5`
    if (answers.soru_16) summaryStats.arketip = cleanMarkdownSymbols(String(answers.soru_16)).split(':')[0]
    if (answers.soru_3) summaryStats.format = cleanMarkdownSymbols(String(answers.soru_3)).split('(')[0].trim()
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
      />

      {/* 2. DNA Özeti & Mini Aksiyon Kutusu */}
      <DnaSummaryCard
        summaryStats={summaryStats}
        answers={answers}
      />

      {/* 3. Hızlı Rapor Navigasyonu */}
      <DnaQuickNav />

      {/* 4. Bölüm Kartları */}
      <div className="space-y-6">
        {sections.map((sec, idx) => {
          const titleUpper = (sec.title || '').toUpperCase()

          // SKOR KARTI
          if (titleUpper.includes('SKOR')) {
            return <DnaScoreGrid key={idx} section={sec} />
          }

          // 1. STRATEJİK PAZAR KONUMLANDIRMASI
          if (titleUpper.includes('1.') || titleUpper.includes('STRATEJİ') || titleUpper.includes('STRATEJI') || titleUpper.includes('KONUMLANDIRMA')) {
            return <DnaStrategyCard key={idx} section={sec} />
          }

          // 2. İLETİŞİM DİLİ, TON VE FORMAT
          if (titleUpper.includes('2.') || titleUpper.includes('İLETİŞİM') || titleUpper.includes('ILETISIM') || titleUpper.includes('FORMAT REÇETESİ') || titleUpper.includes('FORMAT')) {
            return <DnaFormatCard key={idx} section={sec} />
          }

          // 3. İÇERİK SERİLERİ
          if (titleUpper.includes('3.') || titleUpper.includes('SERİ') || titleUpper.includes('SERI')) {
            return <DnaSeriesMatrix key={idx} section={sec} />
          }

          // 4. ROL MODEL VE BENCHMARK
          if (titleUpper.includes('4.') || titleUpper.includes('ROL MODEL') || titleUpper.includes('BENCHMARK')) {
            return <DnaBenchmarkCard key={idx} section={sec} />
          }

          // 5. RİSKLER VE MEVZUAT FARKINDALIĞI
          if (titleUpper.includes('5.') || titleUpper.includes('RİSK') || titleUpper.includes('RISK') || titleUpper.includes('MEVZUAT') || titleUpper.includes('TİTCK') || titleUpper.includes('KVKK')) {
            return <DnaRiskComplianceCard key={idx} section={sec} />
          }

          // 6. 7 ADIMLI YOL HARİTASI
          if (titleUpper.includes('6.') || titleUpper.includes('YOL HARİTASI') || titleUpper.includes('YOL HARITASI') || titleUpper.includes('ADIM')) {
            return <DnaRoadmapTimeline key={idx} section={sec} />
          }

          // 7. 14 GÜNLÜK MİNİ İÇERİK TAKVİMİ
          if (titleUpper.includes('7.') || titleUpper.includes('14 GÜN') || titleUpper.includes('14 GUN') || titleUpper.includes('TAKVİM') || titleUpper.includes('TAKVIM')) {
            return <DnaCalendarGrid key={idx} section={sec} />
          }

          // DİĞER / GENEL KART
          return <DnaGenericSectionCard key={idx} section={sec} index={idx} />
        })}
      </div>

      {/* Ham Metin & Teknik Detay Görüntüleyici (Accordion) */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowRawText(!showRawText)}
          className="text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1.5 p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
        >
          <span>{showRawText ? '▼' : '►'}</span>
          <span>{isAdmin ? 'Ham Rapor & Teknik Metni İncele' : 'Detaylı Ham Rapor Metnini Göster'}</span>
        </button>

        {showRawText && (
          <div className="mt-3 bg-slate-900 text-slate-200 p-5 rounded-2xl font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-96 border border-slate-800 shadow-inner">
            {reportText}
          </div>
        )}
      </div>
    </div>
  )
}
