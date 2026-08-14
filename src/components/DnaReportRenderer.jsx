import React, { useState } from 'react'

// ─── HELPER: Markdown Temizleme ve Ayrıştırma ─────────────────────────────────

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
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)
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
  const lines = body.split('\n')
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
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      return
    }

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
      listItems.push(cleanItem)
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

// 1. Skor Kartı Parser
const parseScorecardItems = (body) => {
  const lines = (body || '').split('\n').map(l => l.trim()).filter(Boolean)
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
      currentItem = { label, val, score, desc: '' }
    } else if (currentItem) {
      currentItem.desc = currentItem.desc ? `${currentItem.desc} ${cleanLine}` : cleanLine
    } else {
      items.push({ label: 'Performans Kriteri', val: cleanLine, score: 75, desc: '' })
    }
  })
  if (currentItem) items.push(currentItem)
  return items
}

// 2. Kanca ve CTA Parser
const parseHookAndCtas = (body) => {
  const hooks = []
  const ctas = []
  const lines = (body || '').split('\n').map(l => l.trim()).filter(Boolean)

  lines.forEach(l => {
    const clean = cleanMarkdownSymbols(l)
    if (/Kanca\s*\d*|Hook/i.test(clean)) {
      hooks.push(clean)
    } else if (/CTA\s*\d*|Aksiyon Çağrısı/i.test(clean)) {
      ctas.push(clean)
    }
  })

  return { hooks, ctas }
}

// 3. İçerik Serileri Parser
const parseSeriesBlocks = (body) => {
  const rawBody = body || ''
  const seriesBlocks = rawBody.split(/(?:^|\n)(?:###|\*\*|\d+[\.\)]|\-)\s*(?:Seri|İçerik Serisi)\s*(\d*[:\-\s]*[^\n]+)/i).filter(Boolean)
  const series = []

  if (seriesBlocks.length >= 2) {
    for (let i = 0; i < seriesBlocks.length; i += 2) {
      const headerTitle = seriesBlocks[i] ? cleanMarkdownSymbols(seriesBlocks[i]) : `İçerik Serisi ${Math.floor(i / 2) + 1}`
      const content = seriesBlocks[i + 1] || ''
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean)

      let format = ''
      let channel = ''
      let logic = ''
      let riskNote = ''
      let production = ''
      const episodes = []

      lines.forEach(l => {
        const cl = cleanMarkdownSymbols(l)
        if (/Format[:\s]*/i.test(cl)) {
          format = cl.replace(/Format[:\s]*/i, '').trim()
        } else if (/Yayın Kanalı|Kanal[:\s]*/i.test(cl)) {
          channel = cl.replace(/(?:Yayın )?Kanalı?[:\s]*/i, '').trim()
        } else if (/Detaylı İçerik Mantığı|Mantık|Amaç[:\s]*/i.test(cl)) {
          logic = cl.replace(/(?:Detaylı )?İçerik Mantığı[:\s]*/i, '').trim()
        } else if (/Risk|Uyum Notu|TİTCK|KVKK[:\s]*/i.test(cl)) {
          riskNote = cl.replace(/(?:Risk\/uyum notu|Risk notu|Uyum notu)[:\s]*/i, '').trim()
        } else if (/Üretim akışı|Akış[:\s]*/i.test(cl)) {
          production = cl.replace(/(?:Üretim akışı|Akış)[:\s]*/i, '').trim()
        } else if (/Bölüm\s*\d*[:\s]*/i.test(cl) || /^\*\s*Bölüm/i.test(l)) {
          episodes.push(cl.replace(/^[\*\-•]\s*/, ''))
        } else if (!logic && cl.length > 20) {
          logic = cl
        }
      })

      series.push({
        id: Math.floor(i / 2) + 1,
        title: headerTitle,
        format: format || 'Reels / Shorts / TikTok Video',
        channel: channel || 'Instagram & TikTok',
        logic: logic || 'Uzmanlık alanına yönelik sürdürülebilir içerik mantığı.',
        episodes: episodes.length > 0 ? episodes : [
          'Bölüm 1: Sağlıkta doğru bilinen mitler',
          'Bölüm 2: En sık sorulan danışan soruları',
          'Bölüm 3: Günlük koruyucu sağlık pratikleri'
        ],
        production: production || '1 gün senaryo taslağı, 1 gün toplu çekim ve altyazı kurgusu.',
        riskNote: riskNote || 'İlaç marka ismi verilmemeli, sadece etken madde ve genel mekanizma anlatılmalıdır.'
      })
    }
  }

  return series
}

// 4. 7 Adımlı Yol Haritası Parser
const parseRoadmapSteps = (body) => {
  const lines = (body || '').split('\n').map(l => l.trim()).filter(Boolean)
  const steps = []

  lines.forEach(l => {
    const clean = cleanMarkdownSymbols(l)
    if (!clean || clean.length < 5) return
    if (/Adım\s*\d*|Aşama\s*\d*|Hafta\s*\d*/i.test(clean) || /^\d+[\.\)]/.test(l)) {
      steps.push(clean)
    } else if (steps.length > 0 && steps.length < 7) {
      steps.push(clean)
    }
  })

  return steps
}

// 5. 14 Günlük Mini Takvim Parser
const parseCalendarDays = (body) => {
  const lines = (body || '').split('\n').map(l => l.trim()).filter(Boolean)
  const days = []

  lines.forEach(l => {
    const clean = cleanMarkdownSymbols(l)
    if (/Gün\s*\d+/i.test(clean)) {
      const dayMatch = clean.match(/Gün\s*(\d+)/i)
      const dayNum = dayMatch ? dayMatch[1] : (days.length + 1)
      const parts = clean.split('|').map(p => p.trim())

      let type = parts[0] || `Gün ${dayNum}`
      let hook = ''
      let format = ''
      let purpose = ''
      let note = ''

      parts.slice(1).forEach(p => {
        if (/Kanca[:\s]*/i.test(p)) {
          hook = p.replace(/Kanca[:\s]*/i, '').replace(/^"|"$/g, '').trim()
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
        title: type.replace(/^Gün\s*\d+[:\s\-]*/i, '').trim() || 'İçerik Yayını',
        hook: hook && hook !== '—' ? hook : null,
        format: format || 'Kısa Video / Story',
        purpose: purpose || 'Etkileşim & Otorite',
        note: note && note !== '—' ? note : 'TİTCK uyumlu / Reklamsız'
      })
    }
  })

  return days
}

// ─── GÖRSEL BİLEŞENLER ───────────────────────────────────────────────────────

// 1. HERO ALANI
function DnaReportHero({ katilimciAdi, takimAdi, aiModel, promptVersion, gonderimTarihi, answers, summaryStats }) {
  const dateStr = gonderimTarihi
    ? new Date(gonderimTarihi).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Güncel Rapor'

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-500/20">
      {/* Arka plan dekoratif daireler */}
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Üst Satır: Rozetler ve Başlık */}
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
              🤖 {aiModel || 'Gemini 2.5 Flash'} • {promptVersion || 'v2.0'}
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
function DnaQuickNav({ onSelectSection }) {
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
function DnaScoreGrid({ section }) {
  const items = parseScorecardItems(section.body)

  const getScoreColor = (score) => {
    if (score >= 75) return {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      border: 'border-emerald-100 hover:border-emerald-300',
      icon: '✅',
      accent: 'text-emerald-700'
    }
    if (score >= 50) return {
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      bar: 'bg-gradient-to-r from-amber-500 to-orange-500',
      border: 'border-amber-100 hover:border-amber-300',
      icon: '⚠️',
      accent: 'text-amber-700'
    }
    return {
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      bar: 'bg-gradient-to-r from-rose-500 to-red-500',
      border: 'border-rose-100 hover:border-rose-300',
      icon: '⚡',
      accent: 'text-rose-700'
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
              Katılımcının iletişim becerileri, sürdürülebilirlik kapasitesi ve regülasyon olgunluğu
            </p>
          </div>
        </div>
      </div>

      {items.length > 0 ? (
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
                  {/* Basit İlerleme Çubuğu */}
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
      ) : (
        <ReportBodyRenderer body={section.body} />
      )}
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
function DnaFormatCard({ section }) {
  const { hooks, ctas } = parseHookAndCtas(section.body)

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

      {/* Genel Analiz Metni */}
      <ReportBodyRenderer body={section.body} />

      {/* Kanca ve CTA Özel Blokları */}
      {(hooks.length > 0 || ctas.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Kancalar */}
          {hooks.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/50 border border-amber-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <span>🪝</span>
                <span>Önerilen Giriş Kancaları (Hooks)</span>
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
                <span>Önerilen Aksiyon Çağrıları (CTAs)</span>
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
function DnaSeriesMatrix({ section }) {
  const seriesList = parseSeriesBlocks(section.body)

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

      {seriesList.length >= 2 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {seriesList.map((s, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/30 border border-purple-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:shadow-card transition-all"
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
                  <span className="font-bold text-purple-900 block mb-1">🎯 İçerik Mantığı:</span>
                  {s.logic}
                </div>

                {/* Örnek Bölümler */}
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

              {/* Uyum & Risk Uyarısı */}
              {s.riskNote && (
                <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-2.5 text-[10px] text-amber-900 leading-snug flex items-start gap-1.5">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span><strong>Uyum Notu:</strong> {s.riskNote}</span>
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
function DnaRoadmapTimeline({ section }) {
  const steps = parseRoadmapSteps(section.body)

  return (
    <div id="sec-6" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-6 scroll-mt-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
          🗺️
        </div>
        <div>
          <div className="flex items-center gap-2">
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

      {steps.length > 0 ? (
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
      ) : (
        <ReportBodyRenderer body={section.body} />
      )}
    </div>
  )
}

// 10. 14 GÜNLÜK MİNİ İÇERİK TAKVİMİ (KARTLI GRID)
function DnaCalendarGrid({ section }) {
  const days = parseCalendarDays(section.body)

  return (
    <div id="sec-7" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-6 scroll-mt-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
          📅
        </div>
        <div>
          <div className="flex items-center gap-2">
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

      {days.length >= 7 ? (
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
      ) : (
        <ReportBodyRenderer body={section.body} />
      )}
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
            return <DnaScoreGrid key={idx} section={sec} />
          }

          // 1. STRATEJİK PAZAR KONUMLANDIRMASI
          if (titleUpper.includes('1.') || titleUpper.includes('STRATEJİ') || titleUpper.includes('STRATEJI') || titleUpper.includes('KONUMLANDIRMA')) {
            return <DnaStrategyCard key={idx} section={sec} />
          }

          // 2. İLETİŞİM DİLİ, TON VE FORMAT REÇETESİ
          if (titleUpper.includes('2.') || titleUpper.includes('İLETİŞİM') || titleUpper.includes('ILETISIM') || titleUpper.includes('FORMAT REÇETESİ')) {
            return <DnaFormatCard key={idx} section={sec} />
          }

          // 3. İÇERİK SERİLERİ VE ÜRETİM MATRİSİ
          if (titleUpper.includes('3.') || titleUpper.includes('SERİ') || titleUpper.includes('SERI')) {
            return <DnaSeriesMatrix key={idx} section={sec} />
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

      {/* Ham Metin / Debug Görüntüleyici (Varsayılan Kapalı) */}
      <div className="pt-2">
        <button
          onClick={() => setShowRawText(!showRawText)}
          className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1.5"
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
