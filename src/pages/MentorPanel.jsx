import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getMentorMe,
  getMentorTakimlarim,
  getMentorKatilimcilarim,
  getMentorTeslimler,
  getGorevler,
  requestRevision,
  evaluateDelivery,
  logoutUser
} from '../services/supabaseService'

// SVG İkonlar
const Ic = {
  Dashboard: ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z" /></svg>,
  Team:      ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" /><path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" /></svg>,
  Users:     ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" /></svg>,
  Task:      ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" /><path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.586 4.594a.75.75 0 00-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.116-.062l3-3.75z" clipRule="evenodd" /></svg>,
  Logout:    ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>,
  Close:     ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>,
  Check:     ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg>,
  Eye:       ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" /></svg>,
  Refresh:   ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" /></svg>,
  Trophy:    ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={c}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" /></svg>,
  Star:      ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>,
}

function StatusBadge({ durum, degerlendirildi, revizyon }) {
  const d = durum || (degerlendirildi ? (revizyon ? 'REVIZYON_ISTENDI' : 'TAMAMLANDI') : 'BEKLIYOR')

  if (d === 'TAMAMLANDI') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-emerald-100 text-emerald-700 border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Tamamlandı
      </span>
    )
  }
  if (d === 'REVIZYON_ISTENDI') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-orange-100 text-orange-700 border-orange-200">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
        Revizyon İstendi
      </span>
    )
  }
  if (d === 'REVIZE_EDILDI') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-blue-100 text-blue-700 border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        Revize Edildi
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-amber-100 text-amber-700 border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      Bekliyor
    </span>
  )
}

function NavItem({ icon, label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-indigo-600 to-violet text-white shadow-md shadow-indigo-200'
          : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count !== null && (
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${
          active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
        }`}>
          {count}
        </span>
      )}
      {active && count === undefined && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />}
    </button>
  )
}

export default function MentorPanel() {
  const navigate = useNavigate()
  const username = localStorage.getItem('username') || 'Mentor'

  const [activeTab, setActiveTab] = useState('genel')
  const [mentorInfo, setMentorInfo] = useState(null)
  const [takimlar, setTakimlar] = useState([])
  const [katilimcilar, setKatilimcilar] = useState([])
  const [teslimler, setTeslimler] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal states
  const [selectedTeslim, setSelectedTeslim] = useState(null)
  const [modalTab, setModalTab] = useState('eval') // 'eval' | 'revision'
  const [puan, setPuan] = useState('')
  const [yorum, setYorum] = useState('')
  const [revizyonNotu, setRevizyonNotu] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Mentor Profil Bilgisi
      const meData = await getMentorMe()
      if (meData?.mentor) {
        setMentorInfo(meData.mentor)
      } else {
        setMentorInfo({ ad_soyad: username, uzmanlik: 'Mentor' })
      }

      const mentorId = meData?.mentor?.id

      // 2. Takımlarım, Katılımcılarım, Teslimler, Görevler
      const [tData, kData, tesData, gData] = await Promise.all([
        getMentorTakimlarim(mentorId).catch(() => []),
        getMentorKatilimcilarim(mentorId).catch(() => []),
        getMentorTeslimler(mentorId).catch(() => []),
        getGorevler().catch(() => [])
      ])

      // Katılımcı/Görev detaylarını teslim objelerine map'leyelim
      const mappedTeslimler = tesData.map(t => {
        const kMatch = kData.find(k => k.id === t.katilimci || k.id === t.katilimci_id)
        const gMatch = gData.find(g => g.id === t.gorev || g.id === t.gorev_id)
        const tMatch = tData.find(tk => tk.id === t.takim || tk.id === t.takim_id)
        return {
          ...t,
          katilimci_adi: t.katilimci_adi || kMatch?.ad_soyad || 'Katılımcı',
          gorev_adi: t.gorev_adi || gMatch?.gorev_adi || `Görev #${t.gorev_id || t.gorev}`,
          takim_adi: t.takim_adi || tMatch?.takim_adi || ''
        }
      })

      setTakimlar(tData)
      setKatilimcilar(kData)
      setTeslimler(mappedTeslimler)

    } catch (err) {
      console.error('Mentor verileri çekilemedi:', err)
      if (err.message?.includes('Oturum geçersiz') || err.message?.includes('Profil bulunamadı')) {
        navigate('/login')
        return
      }
      setError('Veriler yüklenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchTeslimler = async () => {
    try {
      const mentorId = mentorInfo?.id
      const [tesData, gData, kData, tData] = await Promise.all([
        getMentorTeslimler(mentorId),
        getGorevler().catch(() => []),
        getMentorKatilimcilarim(mentorId).catch(() => []),
        getMentorTakimlarim(mentorId).catch(() => [])
      ])
      const mappedTeslimler = tesData.map(t => {
        const kMatch = kData.find(k => k.id === t.katilimci || k.id === t.katilimci_id)
        const gMatch = gData.find(g => g.id === t.gorev || g.id === t.gorev_id)
        const tMatch = tData.find(tk => tk.id === t.takim || tk.id === t.takim_id)
        return {
          ...t,
          katilimci_adi: t.katilimci_adi || kMatch?.ad_soyad || 'Katılımcı',
          gorev_adi: t.gorev_adi || gMatch?.gorev_adi || `Görev #${t.gorev_id || t.gorev}`,
          takim_adi: t.takim_adi || tMatch?.takim_adi || ''
        }
      })
      setTeslimler(mappedTeslimler)
    } catch (error) {
      console.error('Teslimler çekilemedi:', error)
    }
  }

  const handleLogout = async () => {
    await logoutUser()
    navigate('/login', { replace: true })
  }

  const openModal = (teslim) => {
    setSelectedTeslim(teslim)
    setModalTab('eval')
    setPuan(teslim.alinan_puan !== null && teslim.alinan_puan !== undefined ? teslim.alinan_puan : '')
    setYorum(teslim.mentor_yorumu || '')
    setRevizyonNotu('')
    setModalError(null)
  }

  const handleNihaiDegerlendir = async () => {
    if (!selectedTeslim) return
    setModalError(null)

    if (puan === '' || puan === null || puan === undefined) {
      setModalError('Lütfen 0 ile 100 arasında bir puan giriniz.')
      return
    }

    const pVal = parseInt(puan)
    if (isNaN(pVal) || pVal < 0 || pVal > 100) {
      setModalError('Puan 0 ile 100 arasında geçerli bir sayı olmalıdır.')
      return
    }

    setSaving(true)
    try {
      await evaluateDelivery(selectedTeslim.id, pVal, yorum ? yorum.trim() : '')
      setSelectedTeslim(null)
      fetchAll()
    } catch (err) {
      console.error('Nihai değerlendirme hatası:', err)
      setModalError(err.message || 'Nihai değerlendirme kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  const handleRevizyonIste = async () => {
    if (!selectedTeslim) return
    setModalError(null)

    if (!revizyonNotu || !revizyonNotu.trim()) {
      setModalError('Lütfen revizyon notunu eksiksiz yazınız.')
      return
    }

    setSaving(true)
    try {
      await requestRevision(selectedTeslim.id, revizyonNotu.trim())
      setSelectedTeslim(null)
      fetchAll()
    } catch (err) {
      console.error('Revizyon isteme hatası:', err)
      setModalError(err.message || 'Revizyon isteği kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  const displayName = mentorInfo?.ad_soyad || username
  const bekleyenTeslimler = teslimler.filter(t => t.durum === 'BEKLIYOR' || (!t.durum && !t.degerlendirildi))
  const revizeEdilenler = teslimler.filter(t => t.durum === 'REVIZE_EDILDI')
  const revizyonİstenenler = teslimler.filter(t => t.durum === 'REVIZYON_ISTENDI' || (!t.durum && t.revizyon_istendi))
  const tamamlananTeslimler = teslimler.filter(t => t.durum === 'TAMAMLANDI' || (!t.durum && t.degerlendirildi))

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800 max-w-full overflow-x-hidden">
      
      {/* ══════════ SIDEBAR ══════════ */}
      <aside className="w-full md:w-64 flex-shrink-0 bg-white border-b md:border-b-0 md:border-r border-slate-100 shadow-sm flex flex-col z-20">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet flex items-center justify-center shadow-md shadow-indigo-200">
              <span className="text-white font-black text-xs">GD</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-tight">Dijital Sağlık</p>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Mentor Paneli</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-x-auto md:overflow-x-visible flex md:flex-col gap-1 md:gap-1">
          <p className="hidden md:block text-[10px] text-slate-400 font-semibold uppercase tracking-widest px-4 mb-2">Menü</p>
          {[
            { key: 'genel',          label: 'Genel Bakış',   icon: <Ic.Dashboard /> },
            { key: 'takimlarim',     label: 'Takımlarım',    icon: <Ic.Team />, count: takimlar.length },
            { key: 'katilimcilarim', label: 'Katılımcılarım', icon: <Ic.Users />, count: katilimcilar.length },
            { key: 'teslimler',      label: 'Teslimler',     icon: <Ic.Task />, count: bekleyenTeslimler.length + revizeEdilenler.length },
          ].map(({ key, ...rest }) => (
            <NavItem key={key} {...rest} active={activeTab === key} onClick={() => setActiveTab(key)} />
          ))}
        </nav>

        <div className="hidden md:block px-4 py-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate">{displayName}</p>
              <p className="text-[10px] text-slate-400 truncate">{mentorInfo?.uzmanlik || 'Mentor'}</p>
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
              {activeTab === 'genel'          && '📊 Mentor Genel Bakış'}
              {activeTab === 'takimlarim'     && '🏆 Atanmış Takımlarım'}
              {activeTab === 'katilimcilarim' && '👥 Takım Katılımcıları'}
              {activeTab === 'teslimler'      && '📋 Görev Teslimleri & Değerlendirme'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Geleceğin Dijital Sağlık Liderleri • Marka Mutfağı
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAll}
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

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6 flex-1">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-center gap-3 text-xs">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

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
                  <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
                    
                    <div className="relative z-10 space-y-2">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm border border-white/20">
                        Marka Mutfağı Mentoru
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                        Hoş geldiniz, {displayName}! 👋
                      </h2>
                      <p className="text-indigo-200 text-sm font-medium">
                        Uzmanlık Alanı: <span className="font-bold text-white">{mentorInfo?.uzmanlik || 'Genel Mentorluk'}</span>
                      </p>
                    </div>

                    <div className="relative z-10 flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 shadow-inner">
                      <div className="w-12 h-12 rounded-xl bg-white/20 text-indigo-100 flex items-center justify-center shadow-xs">
                        <Ic.Task c="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Bekleyen İnceleme</p>
                        <p className="text-3xl font-black text-white leading-none tabular-nums">{bekleyenTeslimler.length + revizeEdilenler.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Özet Stat Kartları Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Takımlarım</p>
                      <p className="text-2xl font-black text-indigo-600 tabular-nums">{takimlar.length}</p>
                      <p className="text-[11px] text-slate-400 mt-1">Atanmış Takım</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Katılımcılarım</p>
                      <p className="text-2xl font-black text-violet tabular-nums">{katilimcilar.length}</p>
                      <p className="text-[11px] text-slate-400 mt-1">Toplam Üye</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Bekleyen</p>
                      <p className="text-2xl font-black text-amber-600 tabular-nums">{bekleyenTeslimler.length}</p>
                      <p className="text-[11px] text-slate-400 mt-1">İlk Teslim Bekleyen</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Revize Edilen</p>
                      <p className="text-2xl font-black text-blue-600 tabular-nums">{revizeEdilenler.length}</p>
                      <p className="text-[11px] text-slate-400 mt-1">Tekrar Yüklenen</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
                      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Revizyon</p>
                      <p className="text-2xl font-black text-orange-600 tabular-nums">{revizyonİstenenler.length}</p>
                      <p className="text-[11px] text-slate-400 mt-1">Revizyon İstendi</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Tamamlanan</p>
                      <p className="text-2xl font-black text-emerald-600 tabular-nums">{tamamlananTeslimler.length}</p>
                      <p className="text-[11px] text-slate-400 mt-1">Nihai Puanlanan</p>
                    </div>

                  </div>

                  {/* Hızlı Yönlendirme Kartları */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                          🏆
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Takımlarım</h3>
                          <p className="text-xs text-slate-400">{takimlar.length} takım rehberliğinizde</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('takimlarim')}
                        className="w-full px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs border border-indigo-200 transition-all text-center"
                      >
                        Takımlara Git →
                      </button>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet/10 text-violet flex items-center justify-center font-bold">
                          👥
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Katılımcılarım</h3>
                          <p className="text-xs text-slate-400">{katilimcilar.length} katılımcı takımlarınızda</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('katilimcilarim')}
                        className="w-full px-4 py-2 rounded-xl bg-violet/10 hover:bg-violet/20 text-violet font-bold text-xs border border-violet/20 transition-all text-center"
                      >
                        Katılımcılara Git →
                      </button>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                          📋
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Görev Teslimleri</h3>
                          <p className="text-xs text-slate-400">{bekleyenTeslimler.length + revizeEdilenler.length} inceleme bekliyor</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('teslimler')}
                        className="w-full px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs border border-amber-200 transition-all text-center"
                      >
                        Teslimleri İncele →
                      </button>
                    </div>

                  </div>

                </div>
              )}

              {/* ════════ TAB 2: TAKIMLARIM ════════ */}
              {activeTab === 'takimlarim' && (
                <div className="space-y-6">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-800">Size Atanan Takımlar</h2>
                      <p className="text-xs text-slate-400 mt-0.5">{takimlar.length} takım rehberliğiniz altında</p>
                    </div>
                  </div>

                  {takimlar.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-soft border border-slate-100 space-y-3">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
                        <Ic.Team c="w-8 h-8" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">Henüz Atanmış Takımınız Yok</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Sistem yöneticiniz tarafından mentoru olduğunuz takımlar atandıkça burada görüntülenecektir.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                      {takimlar.map(takim => {
                        const uyeler = katilimcilar.filter(k => k.takim_id && Number(k.takim_id) === Number(takim.id))
                        return (
                          <div key={takim.id} className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 space-y-4 hover:shadow-card transition-all">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-violet/20 flex items-center justify-center font-black text-indigo-600 text-lg shadow-xs">
                                  {(takim.takim_adi || 'T')[0].toUpperCase()}
                                </div>
                                <div>
                                  <h3 className="font-bold text-slate-800 text-base">{takim.takim_adi}</h3>
                                  <p className="text-xs text-slate-400 truncate max-w-[180px]">{takim.buyuk_gorev_basligi || 'Büyük Görev Tanımlanmadı'}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-amber-500 justify-end">
                                  <Ic.Star />
                                  <span className="font-bold text-slate-700 text-sm">{takim.toplam_puan || 0}</span>
                                </div>
                                <p className="text-[10px] text-slate-400">toplam puan</p>
                              </div>
                            </div>

                            {/* Takım Üyeleri */}
                            <div className="pt-3 border-t border-slate-100 space-y-2">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Takım Üyeleri ({uyeler.length})</p>
                              {uyeler.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-1">Henüz üye atanmamış.</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {uyeler.map(u => (
                                    <div key={u.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                                          {(u.aday_ad_soyad || u.ad_soyad || u.aday_adi || '?')[0].toUpperCase()}
                                        </div>
                                        <span className="font-medium text-slate-700">{u.aday_ad_soyad || u.ad_soyad || u.aday_adi}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-400">{u.universite || u.aday_universite || '—'}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                </div>
              )}

              {/* ════════ TAB 3: KATILIMCILARIM ════════ */}
              {activeTab === 'katilimcilarim' && (
                <div className="space-y-6">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-800">Takımlarınızdaki Katılımcılar</h2>
                      <p className="text-xs text-slate-400 mt-0.5">{katilimcilar.length} kayıtlı katılımcı</p>
                    </div>
                  </div>

                  {katilimcilar.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-soft border border-slate-100 space-y-3">
                      <div className="w-16 h-16 bg-violet/10 text-violet rounded-2xl flex items-center justify-center mx-auto">
                        <Ic.Users c="w-8 h-8" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">Henüz Katılımcınız Bulunmuyor</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Mentoru olduğunuz takımlara katılımcılar atandıkça burada listelenecektir.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              {['#', 'Ad Soyad', 'E-posta', 'Takım', 'Üniversite', 'Sınıf', 'Durum'].map(h => (
                                <th key={h} className="text-left px-5 py-3.5 font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {katilimcilar.map((k, idx) => (
                              <tr key={k.id} className="border-t border-slate-100 hover:bg-slate-50/80 transition-colors">
                                <td className="px-5 py-3.5 text-slate-400 font-mono">{idx + 1}</td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-violet/20 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0">
                                      {(k.aday_ad_soyad || k.ad_soyad || '?')[0].toUpperCase()}
                                    </div>
                                    <span className="font-bold text-slate-800 whitespace-nowrap">{k.aday_ad_soyad || k.ad_soyad}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-slate-500 font-mono whitespace-nowrap">{k.eposta || '—'}</td>
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <span className="font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                                    {k.takim_adi || 'Atanmadı'}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{k.universite || '—'}</td>
                                <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{k.sinif || '—'}</td>
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <span className={`px-2.5 py-0.5 rounded-full font-semibold ${
                                    k.program_katilim_durumu === 'AKTIF'
                                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                                  }`}>
                                    {k.program_katilim_durumu || 'AKTİF'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ════════ TAB 4: TESLİMLER ════════ */}
              {activeTab === 'teslimler' && (
                <div className="space-y-6">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-800">Görev Teslimleri ve Değerlendirme</h2>
                      <p className="text-xs text-slate-400 mt-0.5">{teslimler.length} teslim kayıtlı</p>
                    </div>
                  </div>

                  {teslimler.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-soft border border-slate-100 space-y-3">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
                        <Ic.Check c="w-8 h-8" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">Değerlendirilecek Teslim Yok</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Mentoru olduğunuz takımlar görev teslimi yaptıkça teslimler burada listelenecektir.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {teslimler.map(teslim => (
                        <div key={teslim.id} className="bg-white rounded-2xl shadow-soft hover:shadow-card border border-slate-100 p-6 flex flex-col justify-between transition-all group">
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <StatusBadge durum={teslim.durum} degerlendirildi={teslim.degerlendirildi} revizyon={teslim.revizyon_istendi} />
                              <span className="text-xs font-semibold text-slate-400">
                                {new Date(teslim.teslim_tarihi).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-800 mb-1 leading-snug line-clamp-2">
                              {teslim.gorev_adi || `Görev #${teslim.gorev}`}
                            </h3>
                            <p className="text-xs font-semibold text-indigo-600 mb-4 flex items-center gap-1.5">
                              <Ic.Task c="w-4 h-4 opacity-70" />
                              {teslim.takim_adi || teslim.katilimci_adi || 'Bilinmiyor'}
                            </p>
                          </div>
                          <button
                            onClick={() => openModal(teslim)}
                            className="w-full py-2.5 rounded-xl bg-slate-50 text-slate-600 font-semibold text-xs border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <Ic.Eye /> İncele & Değerlendir
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

            </>
          )}

        </div>
      </main>

      {/* ══════════ TESLİM DEĞERLENDİRME VE TIMELINE MODALI ══════════ */}
      {selectedTeslim && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedTeslim(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
            
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white z-10">
              <div className="flex items-center gap-3">
                <StatusBadge durum={selectedTeslim.durum} degerlendirildi={selectedTeslim.degerlendirildi} revizyon={selectedTeslim.revizyon_istendi} />
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    {selectedTeslim.gorev_adi || `Görev #${selectedTeslim.gorev}`}
                  </h2>
                  <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                    {selectedTeslim.takim_adi || selectedTeslim.katilimci_adi}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedTeslim(null)} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">
                <Ic.Close />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-slate-50/50">
              
              {/* Modal Hata Mesajı */}
              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between">
                  <span>⚠️ {modalError}</span>
                  <button onClick={() => setModalError(null)} className="text-red-500 hover:text-red-700">✕</button>
                </div>
              )}

              {/* 1. Teslim Bilgileri Kartı */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Proje Linki</h4>
                    {selectedTeslim.teslim_linki ? (
                      <a href={selectedTeslim.teslim_linki} target="_blank" rel="noreferrer" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline break-all inline-flex items-center gap-1">
                        🔗 {selectedTeslim.teslim_linki}
                      </a>
                    ) : (
                      <p className="text-xs font-medium text-slate-400 italic">
                        Harici proje linki eklenmemiş.
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Yüklenen Dosya</h4>
                    {(selectedTeslim.teslim_dosyasi_url || selectedTeslim.teslim_dosyasi) ? (
                      <a 
                        href={selectedTeslim.teslim_dosyasi_url || selectedTeslim.teslim_dosyasi} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-100 transition-colors"
                      >
                        📎 Dosyayı Görüntüle / İndir
                      </a>
                    ) : (
                      <p className="text-xs font-medium text-slate-400 italic">
                        Dosya yüklenmemiş.
                      </p>
                    )}
                  </div>
                </div>

                {selectedTeslim.aciklama && (
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Öğrenci Notu</h4>
                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl leading-relaxed">
                      {selectedTeslim.aciklama}
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Değerlendirme & Aksiyon Alanı */}
              {selectedTeslim.durum === 'TAMAMLANDI' ? (
                <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Nihai Değerlendirme Tamamlandı
                    </div>
                    <span className="text-xs font-black text-emerald-700 bg-white px-3 py-1 rounded-full border border-emerald-200">
                      Puan: {selectedTeslim.alinan_puan ?? 0} / 100
                    </span>
                  </div>
                  {selectedTeslim.mentor_yorumu && (
                    <div className="bg-white p-3.5 rounded-xl border border-emerald-100 text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-emerald-800 block mb-1">Mentor Geri Bildirimi:</span>
                      {selectedTeslim.mentor_yorumu}
                    </div>
                  )}
                  <p className="text-[11px] text-emerald-600 italic">
                    * Bu görev için nihai değerlendirme tamamlandığı için puan ve revizyon kilitlenmiştir.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
                  
                  {/* Action Mode Toggle */}
                  <div className="flex border-b border-slate-100 bg-slate-50/60 p-1.5 gap-1">
                    <button
                      onClick={() => setModalTab('eval')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        modalTab === 'eval'
                          ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🏆 Nihai Değerlendirme Yap
                    </button>
                    <button
                      onClick={() => setModalTab('revision')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        modalTab === 'revision'
                          ? 'bg-white text-orange-600 shadow-sm border border-slate-200/60'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🔄 Revizyon İste
                    </button>
                  </div>

                  <div className="p-5">
                    {/* Action 1: Nihai Değerlendirme */}
                    {modalTab === 'eval' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Puan Ver (0-100) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0" max="100"
                            value={puan}
                            onChange={e => setPuan(e.target.value)}
                            className="w-36 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base font-bold text-slate-800"
                            placeholder="Örn: 85"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Mentor Geri Bildirimi / Yorumu
                          </label>
                          <textarea
                            rows={3}
                            value={yorum}
                            onChange={e => setYorum(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs text-slate-700 resize-none leading-relaxed"
                            placeholder="Takımın teslimi hakkında nihai değerlendirme notunuzu yazın..."
                          />
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={handleNihaiDegerlendir}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-200 transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            {saving ? 'Kaydediliyor...' : 'Nihai Değerlendirmeyi Kaydet ✓'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action 2: Revizyon İste */}
                    {modalTab === 'revision' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Revizyon Notu & Açıklama <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            rows={4}
                            value={revizyonNotu}
                            onChange={e => setRevizyonNotu(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs text-slate-700 resize-none leading-relaxed"
                            placeholder="Takımın bu teslimde neleri düzeltmesi gerektiğini detaylıca açıklayın..."
                          />
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={handleRevizyonIste}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-md shadow-orange-200 transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            {saving ? 'Kaydediliyor...' : 'Revizyon İsteyin 🔄'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* 3. Teslim Geçmişi / Timeline */}
              {selectedTeslim.hareketler && selectedTeslim.hareketler.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>📜</span> Teslim Geçmişi & Timeline ({selectedTeslim.hareketler.length})
                  </h4>

                  <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {selectedTeslim.hareketler.map((h, idx) => {
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
                        <div key={h.id || idx} className="relative flex items-start gap-3">
                          <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-white" />
                          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 w-full space-y-1.5 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${badgeColor}`}>
                                {islemLabel}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {h.olusturulma_tarihi ? new Date(h.olusturulma_tarihi).toLocaleString('tr-TR') : ''}
                              </span>
                            </div>

                            {h.olusturan_adi && (
                              <p className="text-[11px] font-semibold text-slate-600">İşlem Yapan: {h.olusturan_adi}</p>
                            )}

                            {h.aciklama && (
                              <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                                <span className="font-semibold text-slate-500">Açıklama: </span>{h.aciklama}
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
                                <a href={h.teslim_linki} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-bold text-[11px] inline-flex items-center gap-1">
                                  🔗 Linki Aç
                                </a>
                              )}
                              {(h.teslim_dosyasi_url || h.teslim_dosyasi) && (
                                <a href={h.teslim_dosyasi_url || h.teslim_dosyasi} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-bold text-[11px] inline-flex items-center gap-1">
                                  📎 Dosyayı İndir
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
            <div className="px-8 py-4 border-t border-slate-100 bg-white flex justify-end z-10">
              <button 
                onClick={() => setSelectedTeslim(null)}
                className="px-6 py-2 rounded-xl font-semibold text-xs text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
