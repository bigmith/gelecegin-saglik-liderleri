import { supabase } from '../config/supabaseClient'

// ─── AUTH ──────────────────────────────────────────────────────────────────────
export async function loginUser(email, password) {
  const cleanEmail = email.trim().toLowerCase()

  // 1. Supabase Auth ile gerçek e-posta ve şifre doğrulaması
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: password,
  })

  if (error) {
    if (
      error.message.includes('Invalid login credentials') ||
      error.message.includes('invalid_credentials') ||
      error.status === 400
    ) {
      throw new Error('E-posta adresi veya şifre hatalı.')
    }
    throw new Error(error.message || 'Giriş yapılırken bir hata oluştu.')
  }

  const user = data?.user
  const session = data?.session

  if (!user || !session) {
    throw new Error('Oturum başlatılamadı.')
  }

  // 2. Profiles tablosundan kullanıcının rol ve profil bilgilerini çek
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('Profile query error:', profileError)
    await supabase.auth.signOut()
    throw new Error('Kullanıcı profili okunurken veritabanı hatası oluştu.')
  }

  if (!profile || !profile.role) {
    await supabase.auth.signOut()
    throw new Error('Kullanıcı profil kaydı bulunamadı. Lütfen sistem yöneticiniz ile iletişime geçin.')
  }

  return {
    access: session.access_token,
    refresh: session.refresh_token,
    role: profile.role.toLowerCase(),
    username: profile.ad_soyad || user.email.split('@')[0],
    email: user.email,
    user_id: user.id,
    core_katilimci_id: profile.core_katilimci_id,
    core_mentor_id: profile.core_mentor_id,
  }
}

export async function logoutUser() {
  try {
    await supabase.auth.signOut()
  } catch (err) {
    console.error('Logout error:', err)
  } finally {
    localStorage.clear()
  }
}

// ─── ADAYLAR ───────────────────────────────────────────────────────────────────
export async function getAdaylar() {
  const { data, error } = await supabase.from('core_aday').select('*').order('id', { ascending: false })
  if (error) throw error
  return (data || []).map(a => ({
    ...a,
    ad_soyad: a.ad_soyad || `${a.ad || ''} ${a.soyad || ''}`.trim()
  }))
}

export async function createAday(adayData) {
  const { data, error } = await supabase.from('core_aday').insert([adayData]).select().single()
  if (error) throw error
  return data
}

export async function updateAday(id, updates) {
  const { data, error } = await supabase.from('core_aday').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteAday(id) {
  const { error } = await supabase.from('core_aday').delete().eq('id', id)
  if (error) throw error
  return true
}

// ─── TAKIMLAR ──────────────────────────────────────────────────────────────────
export async function getTakimlar() {
  const { data, error } = await supabase.from('core_takim').select('*').order('id', { ascending: false })
  if (error) throw error
  return (data || []).map(t => ({
    ...t,
    mentor: t.mentor_id
  }))
}

export async function createTakim(takimData) {
  const today = new Date().toISOString().split('T')[0]
  const payload = {
    takim_adi: (takimData.takim_adi || '').trim(),
    toplam_puan: typeof takimData.toplam_puan === 'number' ? takimData.toplam_puan : 0,
    olusturulma_tarihi: takimData.olusturulma_tarihi || today,
    mentor_id: takimData.mentor_id || takimData.mentor || null,
    buyuk_gorev_basligi: takimData.buyuk_gorev_basligi || null
  }
  const { data, error } = await supabase.from('core_takim').insert([payload]).select().single()
  if (error) throw error
  return data
}

export async function updateTakim(id, updates) {
  const { data, error } = await supabase.from('core_takim').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteTakim(id) {
  await supabase.from('core_katilimci').update({ takim_id: null }).eq('takim_id', id)
  await supabase.from('core_teslim').update({ takim_id: null }).eq('takim_id', id)
  await supabase.from('core_gorev').update({ hedef_takim_id: null }).eq('hedef_takim_id', id)
  const { error } = await supabase.from('core_takim').delete().eq('id', id)
  if (error) throw error
  return true
}

// ─── KATILIMCILAR ──────────────────────────────────────────────────────────────
export async function getKatilimcilar() {
  const { data, error } = await supabase
    .from('core_katilimci')
    .select('*, aday:core_aday(ad, soyad, eposta, telefon, universite, sinif)')
    .order('id', { ascending: false })
  if (error) throw error
  return (data || []).map(k => {
    const adayObj = k.aday || {}
    const adayAdSoyad = `${adayObj.ad || ''} ${adayObj.soyad || ''}`.trim()
    const directAdSoyad = `${k.ad || ''} ${k.soyad || ''}`.trim() || k.ad_soyad || ''
    const finalAdSoyad = adayAdSoyad || directAdSoyad || `Katılımcı #${k.id}`
    const finalAd = adayObj.ad || k.ad || (finalAdSoyad.split(' ')[0] || '')
    const finalSoyad = adayObj.soyad || k.soyad || (finalAdSoyad.split(' ').slice(1).join(' ') || '')
    const finalEposta = adayObj.eposta || k.eposta || ''
    const finalTelefon = k.telefon || adayObj.telefon || ''
    const finalUniversite = adayObj.universite || k.universite || ''
    const finalSinif = adayObj.sinif || k.sinif || ''
    const rawTakimId = k.takim_id ?? k.takim
    const takimId = rawTakimId !== undefined && rawTakimId !== null ? Number(rawTakimId) : null

    return {
      ...k,
      id: k.id,
      takim_id: takimId,
      takim: takimId,
      aday: k.aday_id ?? k.aday ?? null,
      aday_id: k.aday_id ?? k.aday ?? null,
      ad: finalAd,
      soyad: finalSoyad,
      aday_adi: finalAdSoyad,
      aday_soyad: finalSoyad,
      ad_soyad: finalAdSoyad,
      eposta: finalEposta,
      telefon: finalTelefon,
      aday_universite: finalUniversite,
      universite: finalUniversite,
      sinif: finalSinif,
      adres: k.adres || '',
      okul_bilgisi: k.okul_bilgisi || '',
      egitim_durumu: k.egitim_durumu || '',
      is_durumu: k.is_durumu || '',
      calistigi_kurum: k.calistigi_kurum || '',
      pozisyon: k.pozisyon || '',
      is_aciklamasi: k.is_aciklamasi || '',
      profil_fotografi_url: k.profil_fotografi_url || '',
      profil_fotografi_file_id: k.profil_fotografi_file_id || '',
      profil_guncelleme_tarihi: k.profil_guncelleme_tarihi || null
    }
  })
}

export async function createKatilimci(katilimciData) {
  const { data, error } = await supabase.from('core_katilimci').insert([katilimciData]).select().single()
  if (error) throw error
  return data
}

export async function updateKatilimci(id, updates) {
  const { data, error } = await supabase.from('core_katilimci').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteKatilimci(id) {
  const { error } = await supabase.from('core_katilimci').delete().eq('id', id)
  if (error) throw error
  return true
}

// ─── GÖREVLER ──────────────────────────────────────────────────────────────────
export async function getGorevler() {
  const { data, error } = await supabase.from('core_gorev').select('*').order('id', { ascending: false })
  if (error) throw error
  return (data || []).map(g => ({
    ...g,
    hedef_katilimci: g.hedef_katilimci_id,
    hedef_takim: g.hedef_takim_id
  }))
}

export async function createGorev(gorevData) {
  const nowIso = new Date().toISOString()
  const payload = {
    hafta: Number(gorevData.hafta) || 1,
    gorev_adi: (gorevData.gorev_adi || '').trim(),
    brief_aciklama: (gorevData.brief_aciklama || '').trim(),
    puan_kriterleri: (gorevData.puan_kriterleri || '').trim(),
    son_teslim_tarihi: gorevData.son_teslim_tarihi || nowIso,
    olusturulma_tarihi: gorevData.olusturulma_tarihi || nowIso,
    maksimum_puan: Number(gorevData.maksimum_puan) || 100,
    gorev_tipi: gorevData.gorev_tipi || 'GENEL',
    hedef_katilimci_id: gorevData.hedef_katilimci_id || null,
    hedef_takim_id: gorevData.hedef_takim_id || null,
    program_task_key: gorevData.program_task_key || null,
    program_week: gorevData.program_week ? Number(gorevData.program_week) : null,
    program_task_type: gorevData.program_task_type || null,
    material_url: gorevData.material_url || null,
    material_title: gorevData.material_title || null,
    material_type: gorevData.material_type || null,
  }
  const { data, error } = await supabase.from('core_gorev').insert([payload]).select().single()
  if (error) throw error
  return data
}

export async function activateProgramGorev(template, options = {}) {
  if (!template || !template.taskKey) {
    throw new Error('Geçersiz görev şablonu.')
  }

  const score = Number(options.maksimumPuan || options.maksimum_puan)
  if (!score || isNaN(score) || score < 1) {
    throw new Error('Lütfen geçerli bir maksimum puan girin (en az 1).')
  }

  // 1. Duplicate kontrolü: program_task_key veya görev adı ile ara
  const { data: existingList, error: checkError } = await supabase
    .from('core_gorev')
    .select('*')
    .or(`program_task_key.eq.${template.taskKey},gorev_adi.eq."${template.taskTitle}"`)

  if (!checkError && existingList && existingList.length > 0) {
    return { created: false, gorev: existingList[0], message: 'Bu program görevi zaten aktif.' }
  }

  const nowIso = new Date().toISOString()
  // Varsayılan son teslim tarihi (ör: hafta planına göre)
  const defaultDueDate = options.son_teslim_tarihi || new Date(Date.now() + ((Number(template.taskWeek) || 1) * 7 + 7) * 24 * 60 * 60 * 1000).toISOString()

  const payload = {
    hafta: Number(template.taskWeek) || 1,
    gorev_adi: template.taskTitle,
    brief_aciklama: `${template.taskDescription}\n\n📦 Teslim Beklentisi:\n${template.deliverableHint || 'Belirtilmedi.'}`,
    puan_kriterleri: `🏆 Değerlendirme Kriterleri:\n${template.evaluationHint || 'Genel değerlendirme kriterleri geçerlidir.'}`,
    son_teslim_tarihi: defaultDueDate,
    olusturulma_tarihi: nowIso,
    maksimum_puan: score,
    gorev_tipi: 'GENEL',
    hedef_katilimci_id: null,
    hedef_takim_id: null,
    program_task_key: template.taskKey,
    program_week: Number(template.taskWeek) || 1,
    program_task_type: template.taskType || 'saha_gorevi',
    material_url: options.material_url || null,
    material_title: options.material_title || null,
    material_type: options.material_type || null,
  }

  const { data, error } = await supabase.from('core_gorev').insert([payload]).select().single()
  if (error) {
    // Unique violation durumunda mevcut kaydı döndür
    if (error.code === '23505') {
      const { data: fallbackList } = await supabase.from('core_gorev').select('*').eq('program_task_key', template.taskKey)
      if (fallbackList && fallbackList.length > 0) {
        return { created: false, gorev: fallbackList[0], message: 'Bu program görevi zaten aktif.' }
      }
    }
    throw error
  }

  return { created: true, gorev: data, message: `"${template.taskTitle}" görevi (${score} Puan) başarıyla aktif edildi!` }
}

export async function updateGorevMaterial(gorevId, { material_url, material_title, material_type }) {
  const updates = {
    material_url: (material_url || '').trim() || null,
    material_title: (material_title || '').trim() || null,
    material_type: material_type || 'PDF',
  }
  const { data, error } = await supabase.from('core_gorev').update(updates).eq('id', gorevId).select().single()
  if (error) throw error
  return data
}

export async function updateGorev(id, updates) {
  const { data, error } = await supabase.from('core_gorev').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteGorev(id) {
  // 1. Check if any deliveries exist for this task ID
  const { count, error: countErr } = await supabase
    .from('core_teslim')
    .select('id', { count: 'exact', head: true })
    .eq('gorev_id', id)

  if (!countErr && count && count > 0) {
    throw new Error('Bu göreve ait teslimler bulunduğu için görev silinemez. Geçmiş veriyi korumak için görev pasifleştirilmeli veya teslimler arşivlenmelidir.')
  }

  // 2. Perform deletion
  const { error } = await supabase.from('core_gorev').delete().eq('id', id)
  if (error) {
    const errStr = (String(error.message || '') + String(error.details || '') + String(error.code || '')).toLowerCase()
    if (error.code === '23503' || errStr.includes('foreign key') || errStr.includes('violates') || errStr.includes('core_teslim')) {
      throw new Error('Bu göreve ait teslimler bulunduğu için görev silinemez. Geçmiş veriyi korumak için görev pasifleştirilmeli veya teslimler arşivlenmelidir.')
    }
    throw error
  }
  return true
}

// ─── TESLİMLER ─────────────────────────────────────────────────────────────────
// DRIVE-LINK-FIX-01: Normalize file link fields so UI always has a consistent
// teslim_dosyasi_url regardless of which DB column was written by the uploader.
function normalizeTeslim(t) {
  if (!t || typeof t !== 'object') return t
  const dosyaUrl =
    (typeof t.teslim_dosyasi_url === 'string' && t.teslim_dosyasi_url) ||
    (typeof t.teslim_dosyasi     === 'string' && t.teslim_dosyasi)     ||
    (typeof t.teslim_linki       === 'string' && t.teslim_linki)       ||
    null
  const dosya =
    (typeof t.teslim_dosyasi     === 'string' && t.teslim_dosyasi)     ||
    (typeof t.teslim_dosyasi_url === 'string' && t.teslim_dosyasi_url) ||
    (typeof t.teslim_linki       === 'string' && t.teslim_linki)       ||
    null
  const linki =
    (typeof t.teslim_linki       === 'string' && t.teslim_linki)       ||
    (typeof t.teslim_dosyasi     === 'string' && t.teslim_dosyasi)     ||
    (typeof t.teslim_dosyasi_url === 'string' && t.teslim_dosyasi_url) ||
    null

  let hareketler = Array.isArray(t.hareketler)
    ? t.hareketler
    : Array.isArray(t.core_teslimhareketi)
    ? t.core_teslimhareketi
    : []

  if (hareketler.length === 0 && (t.teslim_tarihi || dosyaUrl || linki || t.durum)) {
    hareketler = [
      {
        id: `fallback-${t.id}`,
        islem_tipi: t.durum === 'REVIZYON_ISTENDI' ? 'REVIZYON_ISTENDI' : (t.durum === 'TAMAMLANDI' || t.degerlendirildi ? 'NIHAI_DEGERLENDIRME' : 'TESLIM_EDILDI'),
        olusturan_adi: 'Katılımcı',
        tarih: t.teslim_tarihi || t.olusturulma_tarihi || new Date().toISOString(),
        olusturulma_tarihi: t.teslim_tarihi || t.olusturulma_tarihi || new Date().toISOString(),
        teslim_dosyasi_url: dosyaUrl,
        teslim_linki: linki,
        aciklama: t.aciklama || 'Teslim alındı',
        mentor_yorumu: t.mentor_yorumu || null,
        puan: t.alinan_puan ?? null
      }
    ]
  }

  return {
    ...t,
    teslim_dosyasi_url: dosyaUrl,
    teslim_dosyasi:     dosya,
    teslim_linki:       linki,
    hareketler:         hareketler
  }
}

export async function getTeslimler() {
  const { data, error } = await supabase
    .from('core_teslim')
    .select('*, hareketler:core_teslimhareketi(*)')
    .order('id', { ascending: false })
  if (error) {
    const { data: rawData, error: rawErr } = await supabase
      .from('core_teslim')
      .select('*')
      .order('id', { ascending: false })
    if (rawErr) throw rawErr
    return (rawData || []).map(t => ({
      ...normalizeTeslim(t),
      katilimci: t.katilimci_id,
      takim: t.takim_id,
      gorev: t.gorev_id
    }))
  }
  return (data || []).map(t => ({
    ...normalizeTeslim(t),
    katilimci: t.katilimci_id,
    takim: t.takim_id,
    gorev: t.gorev_id
  }))
}

export async function submitTeslim(teslimData) {
  const { data, error } = await supabase.from('core_teslim').insert([{
    ...teslimData,
    teslim_tarihi: new Date().toISOString(),
    durum: 'BEKLIYOR'
  }]).select().single()
  if (error) throw error
  return data
}

export async function evaluateTeslim(id, evaluationData) {
  const { data, error } = await supabase.from('core_teslim').update(evaluationData).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ─── MENTORLAR ─────────────────────────────────────────────────────────────────
export async function getMentorlar(includeInactive = false) {
  let query = supabase.from('core_mentor').select('*')
  if (!includeInactive) {
    query = query.eq('aktif', true)
  }
  const { data, error } = await query.order('id', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createMentor(mentorData) {
  const { data, error } = await supabase.from('core_mentor').insert([mentorData]).select().single()
  if (error) throw error
  return data
}

export async function updateMentor(id, updates) {
  const { data, error } = await supabase.from('core_mentor').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteMentor(id) {
  const { error } = await supabase.from('core_mentor').delete().eq('id', id)
  if (error) throw error
  return true
}

export async function submitIcerikDna(cevaplar) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session?.access_token) {
    throw new Error('Oturum geçersiz veya süresi dolmuş.')
  }

  const { data, error } = await supabase.functions.invoke('ai-content-dna', {
    body: { cevaplar },
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  })

  if (error) {
    let msg = error.message || 'İçerik DNA testi gönderilemedi.'
    if (error.context && typeof error.context.json === 'function') {
      try {
        const body = await error.context.json()
        if (body?.error) msg = body.error
      } catch (_) {}
    }
    throw new Error(msg)
  }
  if (!data?.ok) {
    throw new Error(data?.error || 'İçerik DNA testi işlenirken bir hata oluştu.')
  }
  return data.data
}

// ─── KATILIMCI ÖZEL SORGULARI ──────────────────────────────────────────────────
export async function getKatilimciMe() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session?.user) throw new Error('Oturum geçersiz.')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle()

  if (profileError) throw profileError
  if (!profile) throw new Error('Profil bulunamadı.')

  let katilimciId = profile.core_katilimci_id
  let katilimciData = null

  if (katilimciId) {
    const { data: kData, error: kError } = await supabase
      .from('core_katilimci')
      .select('*, aday:core_aday(ad, soyad, eposta, telefon, universite, sinif)')
      .eq('id', katilimciId)
      .maybeSingle()
    if (!kError && kData) katilimciData = kData
  }

  if (!katilimciData) {
    const { data: kData, error: kError } = await supabase
      .from('core_katilimci')
      .select('*, aday:core_aday(ad, soyad, eposta, telefon, universite, sinif)')
      .eq('user_id', session.user.id)
      .maybeSingle()
    if (!kError && kData) {
      katilimciData = kData
      katilimciId = kData.id
    }
  }

  let takimData = null
  if (katilimciData && katilimciData.takim_id) {
    const { data: tData } = await supabase
      .from('core_takim')
      .select('*')
      .eq('id', katilimciData.takim_id)
      .maybeSingle()
    if (tData) takimData = tData
  }

  const adayObj = katilimciData?.aday || {}
  const finalAdSoyad = `${katilimciData?.ad || ''} ${katilimciData?.soyad || ''}`.trim() || katilimciData?.ad_soyad || profile.ad_soyad || `${adayObj.ad || ''} ${adayObj.soyad || ''}`.trim() || 'Katılımcı'
  const finalEposta = profile.email || katilimciData?.eposta || adayObj.eposta || ''
  const finalTelefon = katilimciData?.telefon || profile.telefon || adayObj.telefon || ''
  const finalUniversite = katilimciData?.universite || adayObj.universite || ''
  const finalSinif = katilimciData?.sinif || adayObj.sinif || ''

  return {
    profile,
    katilimci: katilimciData ? {
      ...katilimciData,
      katilimci_id: katilimciData.id,
      ad_soyad: finalAdSoyad,
      eposta: finalEposta,
      telefon: finalTelefon,
      universite: finalUniversite,
      sinif: finalSinif,
      adres: katilimciData.adres || '',
      okul_bilgisi: katilimciData.okul_bilgisi || '',
      egitim_durumu: katilimciData.egitim_durumu || '',
      is_durumu: katilimciData.is_durumu || '',
      calistigi_kurum: katilimciData.calistigi_kurum || '',
      pozisyon: katilimciData.pozisyon || '',
      is_aciklamasi: katilimciData.is_aciklamasi || '',
      profil_fotografi_url: katilimciData.profil_fotografi_url || profile.avatar_url || '',
      profil_fotografi_file_id: katilimciData.profil_fotografi_file_id || '',
      profil_guncelleme_tarihi: katilimciData.profil_guncelleme_tarihi || null,
      takim: katilimciData.takim_id,
      takim_id: katilimciData.takim_id,
      takim_adi: takimData ? takimData.takim_adi : null,
      toplam_puan: takimData ? takimData.toplam_puan : 0
    } : null,
    takim: takimData
  }
}

export async function getKatilimciProfilim() {
  const meData = await getKatilimciMe()
  if (!meData?.katilimci) {
    throw new Error('Katılımcı profili bulunamadı.')
  }
  return {
    ...meData.katilimci,
    profile: meData.profile,
    takim: meData.takim
  }
}

export async function updateKatilimciProfilim(payload = {}) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session?.user) throw new Error('Oturum geçersiz.')

  const meData = await getKatilimciMe()
  const katilimci = meData?.katilimci
  if (!katilimci || !katilimci.id) {
    throw new Error('Güncellenecek katılımcı profili bulunamadı.')
  }

  // Strict allowlist: ONLY fields that actually exist as columns on public.core_katilimci
  const allowedFields = [
    'telefon',
    'adres',
    'okul_bilgisi',
    'egitim_durumu',
    'is_durumu',
    'calistigi_kurum',
    'pozisyon',
    'is_aciklamasi',
    'profil_fotografi_url',
    'profil_fotografi_file_id'
  ]

  // Construct defensive clean update payload
  const updatePayload = {
    profil_guncelleme_tarihi: new Date().toISOString()
  }

  for (const field of allowedFields) {
    if (payload && Object.prototype.hasOwnProperty.call(payload, field) && payload[field] !== undefined) {
      updatePayload[field] = payload[field] === '' ? null : payload[field]
    }
  }

  const { data, error } = await supabase
    .from('core_katilimci')
    .update(updatePayload)
    .eq('id', katilimci.id)
    .select()
    .single()

  if (error) {
    console.error('updateKatilimciProfilim error:', error)
    throw new Error('Profil bilgileri kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.')
  }

  // Also sync avatar_url / telefon to profiles if provided
  try {
    const profileUpdates = { updated_at: new Date().toISOString() }
    if (updatePayload.profil_fotografi_url !== undefined) {
      profileUpdates.avatar_url = updatePayload.profil_fotografi_url
    }
    if (updatePayload.telefon !== undefined) {
      profileUpdates.telefon = updatePayload.telefon
    }
    await supabase.from('profiles').update(profileUpdates).eq('id', session.user.id)
  } catch (pErr) {
    console.warn('profiles update sync warning:', pErr)
  }

  return data
}

export async function uploadKatilimciProfilFotografi(file) {
  if (!file) {
    throw new Error('Lütfen bir fotoğraf dosyası seçin.')
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error('Geçersiz dosya türü. Sadece JPEG, PNG ve WEBP formatları desteklenir.')
  }

  const maxBytes = 5 * 1024 * 1024 // 5 MB
  if (file.size > maxBytes) {
    throw new Error('Dosya boyutu 5 MB\'tan büyük olamaz.')
  }

  const meData = await getKatilimciMe()
  const katilimci = meData?.katilimci
  if (!katilimci?.id) {
    throw new Error('Katılımcı kaydınız bulunamadı.')
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const customFilename = `profil-fotografi-${katilimci.id}-${Date.now()}.${ext}`

  const fileBase64 = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const driveRes = await uploadFileToGoogleDrive({
    filename: customFilename,
    file_base64: fileBase64,
    content_type: file.type,
    katilimci_adi: katilimci.ad_soyad || '',
    katilimci_id: katilimci.id
  })

  const fileId = driveRes?.file_id || ''
  const photoUrl = driveRes ? (driveRes.webViewLink || driveRes.download_url || `https://drive.google.com/file/d/${fileId}/view`) : ''

  // Profil kaydını güncelle
  await updateKatilimciProfilim({
    profil_fotografi_url: photoUrl,
    profil_fotografi_file_id: fileId
  })

  return {
    profil_fotografi_url: photoUrl,
    profil_fotografi_file_id: fileId
  }
}

export function getDriveThumbnailUrl(fileIdOrUrl, size = 400) {
  if (!fileIdOrUrl || typeof fileIdOrUrl !== 'string') return ''
  // If it's already a direct data: or blob: or thumbnail url, return as is
  if (fileIdOrUrl.startsWith('data:') || fileIdOrUrl.startsWith('blob:') || fileIdOrUrl.includes('drive.google.com/thumbnail')) {
    return fileIdOrUrl
  }
  let fileId = fileIdOrUrl
  if (fileIdOrUrl.includes('/d/')) {
    const match = fileIdOrUrl.match(/\/d\/([^/&?]+)/)
    if (match) fileId = match[1]
  } else if (fileIdOrUrl.includes('id=')) {
    const match = fileIdOrUrl.match(/id=([^&]+)/)
    if (match) fileId = match[1]
  }
  if (!fileId) return ''
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${size}`
}

export function getParticipantAvatarSrc(katilimci, size = 400) {
  if (!katilimci) return ''
  if (katilimci.profil_fotografi_file_id) {
    return getDriveThumbnailUrl(katilimci.profil_fotografi_file_id, size)
  }
  if (katilimci.profil_fotografi_url) {
    return getDriveThumbnailUrl(katilimci.profil_fotografi_url, size)
  }
  if (katilimci.avatar_url) {
    return getDriveThumbnailUrl(katilimci.avatar_url, size)
  }
  return ''
}

export async function getKatilimciPerformansMe(katilimciId) {
  if (!katilimciId) return null
  const { data, error } = await supabase
    .from('core_katilimciperformans')
    .select('*')
    .eq('katilimci_id', katilimciId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getKatilimciDnaMe(katilimciId) {
  if (!katilimciId) return null
  const { data, error } = await supabase
    .from('core_icerikdnatesti')
    .select('*')
    .eq('katilimci_id', katilimciId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getKatilimciTeslimlerMe(katilimciId) {
  if (!katilimciId) return []
  const { data, error } = await supabase
    .from('core_teslim')
    .select('*, hareketler:core_teslimhareketi(*)')
    .eq('katilimci_id', katilimciId)
    .order('id', { ascending: false })
  if (error) {
    const { data: rawData, error: rawErr } = await supabase
      .from('core_teslim')
      .select('*')
      .eq('katilimci_id', katilimciId)
      .order('id', { ascending: false })
    if (rawErr) throw rawErr
    return (rawData || []).map(t => ({
      ...normalizeTeslim(t),
      katilimci: t.katilimci_id,
      takim: t.takim_id,
      gorev: t.gorev_id
    }))
  }
  return (data || []).map(t => ({
    ...normalizeTeslim(t),
    katilimci: t.katilimci_id,
    takim: t.takim_id,
    gorev: t.gorev_id
  }))
}

// ─── MENTOR ÖZEL SORGULARI ───────────────────────────────────────────────────
export async function getMentorMe() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session?.user) throw new Error('Oturum geçersiz.')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle()

  if (profileError) throw profileError
  if (!profile) throw new Error('Profil bulunamadı.')

  let mentorId = profile.core_mentor_id
  let mentorData = null

  if (mentorId) {
    const { data: mData, error: mError } = await supabase
      .from('core_mentor')
      .select('*')
      .eq('id', mentorId)
      .maybeSingle()
    if (!mError) mentorData = mData
  }

  if (!mentorData) {
    const { data: mData, error: mError } = await supabase
      .from('core_mentor')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
    if (!mError && mData) {
      mentorData = mData
      mentorId = mData.id
    }
  }

  return {
    profile,
    mentor: mentorData ? {
      ...mentorData,
      id: mentorData.id,
      ad_soyad: mentorData.ad_soyad,
      eposta: mentorData.eposta,
      uzmanlik: mentorData.uzmanlik
    } : null
  }
}

export async function getMentorTakimlarim(mentorId) {
  const { data, error } = await supabase
    .from('core_takim')
    .select('*')
    .order('id', { ascending: false })
  if (error) throw error
  return (data || []).map(t => ({
    ...t,
    mentor: t.mentor_id
  }))
}

export async function getMentorKatilimcilarim(mentorId) {
  const res = await callMentorAction('get_my_participants', { mentor_id: mentorId })
  if (res && res.ok && Array.isArray(res.data)) {
    return res.data
  }
  return []
}

function groupTeslimlerByTask(rawTeslimList) {
  if (!Array.isArray(rawTeslimList) || rawTeslimList.length === 0) return []

  const groups = new Map()

  for (const item of rawTeslimList) {
    const kId = item.katilimci_id ?? item.katilimci
    const tId = item.takim_id ?? item.takim
    const gId = item.gorev_id ?? item.gorev

    const key = kId ? `kat_${Number(kId)}_${Number(gId)}` : `tak_${Number(tId)}_${Number(gId)}`

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(item)
  }

  const result = []

  for (const items of groups.values()) {
    items.sort((a, b) => Number(a.id || 0) - Number(b.id || 0))
    const latestItem = items[items.length - 1]

    const combinedMovements = []
    for (const it of items) {
      const norm = normalizeTeslim(it)
      if (Array.isArray(norm.hareketler)) {
        combinedMovements.push(...norm.hareketler)
      }
    }

    const seenIds = new Set()
    const uniqueMovements = combinedMovements.filter(h => {
      const hKey = h.id ? String(h.id) : `${h.islem_tipi}_${h.olusturulma_tarihi || h.tarih}`
      if (seenIds.has(hKey)) return false
      seenIds.add(hKey)
      return true
    })

    uniqueMovements.sort((a, b) => {
      const tA = new Date(a.olusturulma_tarihi || a.tarih || 0).getTime()
      const tB = new Date(b.olusturulma_tarihi || b.tarih || 0).getTime()
      return tA - tB
    })

    const normLatest = normalizeTeslim(latestItem)

    result.push({
      ...normLatest,
      katilimci: latestItem.katilimci_id || latestItem.katilimci,
      takim: latestItem.takim_id || latestItem.takim,
      gorev: latestItem.gorev_id || latestItem.gorev,
      hareketler: uniqueMovements
    })
  }

  result.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
  return result
}

export async function getMentorTeslimler(mentorId) {
  const { data, error } = await supabase
    .from('core_teslim')
    .select('*, hareketler:core_teslimhareketi(*)')
    .order('id', { ascending: false })

  const rawList = error
    ? ((await supabase.from('core_teslim').select('*').order('id', { ascending: false })).data || [])
    : (data || [])

  return groupTeslimlerByTask(rawList)
}

// ─── ADMIN EDGE FUNCTION ÇAĞRISI ─────────────────────────────────────────────
const ADMIN_ACTIONS_URL = 'https://wczupupflxvfnjbjkfrj.supabase.co/functions/v1/admin-actions'

export async function callAdminAction(action, payload = {}) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session?.access_token) {
    throw new Error('Oturum geçersiz veya süresi dolmuş.')
  }

  const res = await fetch(ADMIN_ACTIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, payload }),
  })

  const data = await res.json()
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `Edge Function HTTP ${res.status}`)
  }
  return data
}

export async function importCandidatesCsvText(filename, csvText) {
  return await callAdminAction('import_candidates_csv', { filename, csv_text: csvText })
}

// ─── MENTOR EDGE FUNCTION ÇAĞRISI ────────────────────────────────────────────
export async function callMentorAction(action, payload = {}) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session?.access_token) {
    throw new Error('Oturum geçersiz veya süresi dolmuş.')
  }

  const { data, error } = await supabase.functions.invoke('mentor-actions', {
    body: { action, payload },
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  })

  if (error) {
    let msg = error.message || 'Mentor işlemi gerçekleştirilemedi.'
    if (error.context && typeof error.context.json === 'function') {
      try {
        const body = await error.context.json()
        if (body?.error) msg = body.error
      } catch (_) {}
    }
    throw new Error(msg)
  }

  if (!data?.ok) {
    throw new Error(data?.error || 'Mentor işlemi gerçekleştirilirken bir hata oluştu.')
  }

  return data
}

export async function requestRevision(teslim_id, revizyon_notu) {
  const res = await callMentorAction('request_revision', { teslim_id, revizyon_notu })
  return res.data
}

export async function evaluateDelivery(teslim_id, alinan_puan, mentor_yorumu) {
  const res = await callMentorAction('evaluate_delivery', { teslim_id, alinan_puan, mentor_yorumu })
  return res.data
}

export async function getAdminPerformansList() {
  const { data: katData, error: katErr } = await supabase
    .from('core_katilimci')
    .select(`
      *,
      aday:core_aday (ad, soyad, eposta, telefon, universite, sinif),
      takim:core_takim (id, takim_adi)
    `)
    .order('id', { ascending: false })

  if (katErr) {
    console.error('getAdminPerformansList katilimci error:', katErr)
    return []
  }

  const { data: perfData } = await supabase
    .from('core_katilimciperformans')
    .select('*')

  const perfMap = new Map((perfData || []).map(p => [Number(p.katilimci_id), p]))

  return (katData || []).map(k => {
    const kId = Number(k.id)
    const p = perfMap.get(kId) || {}
    const adayObj = k.aday || {}
    const adSoyad = `${k.ad || ''} ${k.soyad || ''}`.trim() || k.ad_soyad || `${adayObj.ad || ''} ${adayObj.soyad || ''}`.trim() || `Katılımcı #${k.id}`
    const eposta = k.eposta || adayObj.eposta || ''
    const telefon = k.telefon || adayObj.telefon || ''
    const universite = k.universite || adayObj.universite || ''
    const sinif = k.sinif || adayObj.sinif || ''

    return {
      id: p.id || null,
      katilimci: kId,
      katilimci_id: kId,
      ad_soyad: adSoyad,
      eposta: eposta,
      telefon: telefon,
      universite: universite,
      sinif: sinif,
      adres: k.adres || '',
      okul_bilgisi: k.okul_bilgisi || '',
      egitim_durumu: k.egitim_durumu || '',
      is_durumu: k.is_durumu || '',
      calistigi_kurum: k.calistigi_kurum || '',
      pozisyon: k.pozisyon || '',
      is_aciklamasi: k.is_aciklamasi || '',
      profil_fotografi_url: k.profil_fotografi_url || '',
      profil_fotografi_file_id: k.profil_fotografi_file_id || '',
      profil_guncelleme_tarihi: k.profil_guncelleme_tarihi || null,
      takim_id: k.takim_id || (k.takim?.id) || null,
      takim_adi: k.takim?.takim_adi || '—',
      bireysel_puan: Number(p.bireysel_puan) || 0,
      gorev_puani: Number(p.gorev_puani) || 0,
      toplanti_katilim_puani: Number(p.toplanti_katilim_puani) || 0,
      etkilesim_bonus_puani: Number(p.etkilesim_bonus_puani) || 0,
      manuel_puan: Number(p.manuel_puan) || 0,
      admin_ici_not: p.admin_ici_not || '',
      katilimciya_gorunen_not: p.katilimciya_gorunen_not || '',
      olusturulma_tarihi: p.olusturulma_tarihi || null,
      guncellenme_tarihi: p.guncellenme_tarihi || null
    }
  }).sort((a, b) => b.bireysel_puan - a.bireysel_puan)
}

export async function getAdminKatilimciDetay(katilimciId) {
  if (!katilimciId) return null
  const { data, error } = await supabase
    .from('core_katilimci')
    .select(`
      *,
      aday:core_aday (ad, soyad, eposta, telefon, universite, sinif),
      takim:core_takim (id, takim_adi)
    `)
    .eq('id', katilimciId)
    .maybeSingle()

  if (error || !data) {
    console.error('getAdminKatilimciDetay error:', error)
    return null
  }

  const adayObj = data.aday || {}
  const adSoyad = `${data.ad || ''} ${data.soyad || ''}`.trim() || data.ad_soyad || `${adayObj.ad || ''} ${adayObj.soyad || ''}`.trim() || `Katılımcı #${data.id}`

  return {
    ...data,
    katilimci_id: data.id,
    ad_soyad: adSoyad,
    eposta: data.eposta || adayObj.eposta || '',
    telefon: data.telefon || adayObj.telefon || '',
    universite: data.universite || adayObj.universite || '',
    sinif: data.sinif || adayObj.sinif || '',
    takim_adi: data.takim?.takim_adi || '—'
  }
}

export async function getAdminKatilimciToplantilari(katilimciId) {
  if (!katilimciId) return []
  const { data, error } = await supabase
    .from('core_toplantikatilimi')
    .select('*')
    .eq('katilimci_id', katilimciId)
    .order('tarih', { ascending: false })
  if (error) {
    console.warn('getAdminKatilimciToplantilari warning:', error)
    return []
  }
  return data || []
}

export async function getAdminKatilimciSosyalMedya(katilimciId) {
  if (!katilimciId) return []
  const { data, error } = await supabase
    .from('core_sosyalmedyaperformansi')
    .select('*')
    .eq('katilimci_id', katilimciId)
    .order('id', { ascending: false })
  if (error) {
    console.warn('getAdminKatilimciSosyalMedya warning:', error)
    return []
  }
  return data || []
}

export async function getAdminKatilimciPerformansNotlari(katilimciId) {
  if (!katilimciId) return []

  const { data: notlar, error } = await supabase
    .from('core_katilimciperformansnotu')
    .select('*')
    .eq('katilimci_id', katilimciId)
    .order('id', { ascending: false })

  if (error || !notlar || notlar.length === 0) {
    if (error) console.warn('getAdminKatilimciPerformansNotlari warning:', error)
    return []
  }

  const kriterIds = [...new Set(notlar.map(n => n.kriter_id).filter(Boolean))]

  let kriterMap = new Map()
  if (kriterIds.length > 0) {
    const { data: kriterler } = await supabase
      .from('core_performanskriteri')
      .select('id, kriter_adi, ad')
      .in('id', kriterIds)

    if (kriterler) {
      kriterMap = new Map(kriterler.map(k => [Number(k.id), k.kriter_adi || k.ad || `Kriter #${k.id}`]))
    }
  }

  return notlar.map(n => {
    const kId = n.kriter_id ? Number(n.kriter_id) : null
    const kAdi = (kId && kriterMap.get(kId)) ? kriterMap.get(kId) : (kId ? `Kriter #${kId}` : 'Kriter bilgisi yok')

    return {
      id: n.id,
      katilimci_id: n.katilimci_id,
      kriter_id: kId,
      kriter_adi: kAdi,
      kriter: { id: kId, kriter_adi: kAdi },
      puan: Number(n.puan) || 0,
      not_metni: n.not_metni || '',
      tarih: n.tarih || n.olusturulma_tarihi || null,
      olusturulma_tarihi: n.olusturulma_tarihi || null
    }
  })
}

export async function recalculateAndSyncKatilimciPerformans(katilimciId) {
  if (!katilimciId) return null

  // 1. Calculate sum of meeting points
  const { data: toplantilar } = await supabase
    .from('core_toplantikatilimi')
    .select('katilim_puani')
    .eq('katilimci_id', katilimciId)

  const toplantiPuan = (toplantilar || []).reduce((acc, curr) => acc + (Number(curr.katilim_puani) || 0), 0)

  // 2. Calculate sum of social media bonus points
  const { data: sosyalMedya } = await supabase
    .from('core_sosyalmedyaperformansi')
    .select('bonus_puan')
    .eq('katilimci_id', katilimciId)

  const etkilesimPuan = (sosyalMedya || []).reduce((acc, curr) => acc + (Number(curr.bonus_puan) || 0), 0)

  // 3. Calculate sum of task scores from core_teslim
  const { data: teslimler } = await supabase
    .from('core_teslim')
    .select('alinan_puan')
    .eq('katilimci_id', katilimciId)

  const gorevPuan = (teslimler || []).reduce((acc, curr) => acc + (Number(curr.alinan_puan) || 0), 0)

  // 4. Fetch existing performance record or lazy-create
  const { data: existing } = await supabase
    .from('core_katilimciperformans')
    .select('*')
    .eq('katilimci_id', katilimciId)
    .maybeSingle()

  const manuelPuan = Number(existing?.manuel_puan) || 0
  const totalPuan = gorevPuan + toplantiPuan + etkilesimPuan + manuelPuan

  const payload = {
    katilimci_id: katilimciId,
    gorev_puani: gorevPuan,
    toplanti_katilim_puani: toplantiPuan,
    etkilesim_bonus_puani: etkilesimPuan,
    manuel_puan: manuelPuan,
    bireysel_puan: totalPuan,
    admin_ici_not: existing?.admin_ici_not || '',
    katilimciya_gorunen_not: existing?.katilimciya_gorunen_not || '',
    guncellenme_tarihi: new Date().toISOString()
  }

  if (existing) {
    const { data } = await supabase
      .from('core_katilimciperformans')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .maybeSingle()
    return data
  } else {
    const { data } = await supabase
      .from('core_katilimciperformans')
      .insert({
        ...payload,
        olusturulma_tarihi: new Date().toISOString()
      })
      .select()
      .maybeSingle()
    return data
  }
}

export async function getAdminKatilimciTeslimleri(katilimciId) {
  if (!katilimciId) return []

  const { data: teslimler, error } = await supabase
    .from('core_teslim')
    .select('*')
    .eq('katilimci_id', katilimciId)
    .order('id', { ascending: false })

  if (error || !teslimler || teslimler.length === 0) {
    if (error) console.warn('getAdminKatilimciTeslimleri warning:', error)
    return []
  }

  const gorevIds = [...new Set(teslimler.map(t => t.gorev_id || t.gorev).filter(Boolean))]
  const teslimIds = teslimler.map(t => t.id).filter(Boolean)

  let gorevMap = new Map()
  if (gorevIds.length > 0) {
    const { data: gorevler } = await supabase
      .from('core_gorev')
      .select('id, gorev_adi')
      .in('id', gorevIds)

    if (gorevler) {
      gorevMap = new Map(gorevler.map(g => [Number(g.id), g.gorev_adi || `Görev #${g.id}`]))
    }
  }

  let hareketlerMap = new Map()
  if (teslimIds.length > 0) {
    const { data: hareketler } = await supabase
      .from('core_teslimhareketi')
      .select('*')
      .in('teslim_id', teslimIds)
      .order('id', { ascending: true })

    if (hareketler) {
      hareketler.forEach(h => {
        const tId = Number(h.teslim_id)
        if (!hareketlerMap.has(tId)) hareketlerMap.set(tId, [])
        hareketlerMap.get(tId).push(h)
      })
    }
  }

  // Group deliveries by task ID
  const taskGroups = new Map()
  teslimler.forEach(t => {
    const gId = Number(t.gorev_id || t.gorev) || 'unassigned'
    if (!taskGroups.has(gId)) {
      taskGroups.set(gId, [])
    }
    taskGroups.get(gId).push(t)
  })

  const groupedResults = []
  taskGroups.forEach((tList, gId) => {
    tList.sort((a, b) => b.id - a.id)
    const latest = tList[0]
    const taskTitle = (gId !== 'unassigned' && gorevMap.get(gId)) ? gorevMap.get(gId) : (gId !== 'unassigned' ? `Görev #${gId}` : 'Görev bilgisi yok')

    let combinedMovements = []
    tList.forEach(t => {
      const hList = hareketlerMap.get(Number(t.id)) || t.hareketler || t.teslim_hareketleri || []
      combinedMovements = combinedMovements.concat(hList)
    })
    combinedMovements.sort((a, b) => (new Date(a.olusturulma_tarihi || a.tarih || 0) - new Date(b.olusturulma_tarihi || b.tarih || 0)) || (a.id - b.id))

    const primaryFileUrl = latest.teslim_dosyasi_url || latest.teslim_dosyasi || ''
    const externalLink = latest.teslim_linki || ''
    const activeFileLink = primaryFileUrl || externalLink || ''

    groupedResults.push({
      id: latest.id,
      katilimci_id: katilimciId,
      gorev_id: gId !== 'unassigned' ? gId : null,
      gorev_adi: taskTitle,
      durum: latest.durum || 'BEKLIYOR',
      durum_etiketi: latest.durum_etiketi || latest.durum || '—',
      teslim_tarihi: latest.teslim_tarihi || latest.olusturulma_tarihi || null,
      aciklama: latest.aciklama || latest.not_metni || '',
      alinan_puan: Number(latest.alinan_puan) || 0,
      mentor_yorumu: latest.mentor_yorumu || '',
      teslim_dosyasi_url: primaryFileUrl,
      teslim_dosyasi: latest.teslim_dosyasi || '',
      teslim_linki: externalLink,
      dosya_linki: activeFileLink,
      hareketler: combinedMovements,
      allSubmissions: tList
    })
  })

  return groupedResults
}

export async function getAdminIcerikDnaList() {
  const { data, error } = await supabase
    .from('core_icerikdnatesti')
    .select(`
      *,
      katilimci:core_katilimci (
        id,
        aday:core_aday (ad, soyad, eposta, universite),
        takim:core_takim (id, takim_adi)
      )
    `)
    .order('gonderim_tarihi', { ascending: false })

  if (error) {
    console.error('getAdminIcerikDnaList error:', error)
    return []
  }

  return (data || []).map(d => {
    const adayObj = d.katilimci?.aday || {}
    const adSoyad = `${adayObj.ad || ''} ${adayObj.soyad || ''}`.trim() || `Katılımcı #${d.katilimci_id}`

    return {
      id: d.id,
      katilimci_id: d.katilimci_id,
      katilimci_ad_soyad: adSoyad,
      katilimci_adi: adSoyad,
      katilimci_eposta: adayObj.eposta || '',
      universite: adayObj.universite || '',
      takim_adi: d.katilimci?.takim?.takim_adi || '—',
      durum: d.durum || 'TAMAMLANDI',
      ai_model: d.ai_model || 'Gemini 2.5 Flash',
      prompt_versiyonu: d.prompt_versiyonu || 'v1',
      gonderim_tarihi: d.gonderim_tarihi,
      rapor_metni: d.rapor_metni || (d.rapor_json ? d.rapor_json.rapor_metni : ''),
      rapor_json: d.rapor_json || null,
      cevaplar: d.cevaplar || (d.rapor_json ? d.rapor_json.cevaplar : {}),
      hata_mesaji: d.hata_mesaji || null
    }
  })
}

export async function updateAdminPerformansScore(katilimci_id, scoreForm) {
  const mPuan = Number(scoreForm.manuel_puan) || 0

  const { data: existing } = await supabase
    .from('core_katilimciperformans')
    .select('*')
    .eq('katilimci_id', katilimci_id)
    .maybeSingle()

  const gPuan = Number(existing?.gorev_puani) || 0
  const tPuan = Number(existing?.toplanti_katilim_puani) || 0
  const ePuan = Number(existing?.etkilesim_bonus_puani) || 0
  const birPuan = gPuan + tPuan + ePuan + mPuan

  const payload = {
    katilimci_id,
    gorev_puani: gPuan,
    toplanti_katilim_puani: tPuan,
    etkilesim_bonus_puani: ePuan,
    manuel_puan: mPuan,
    bireysel_puan: birPuan,
    admin_ici_not: String(scoreForm.admin_ici_not || ''),
    katilimciya_gorunen_not: String(scoreForm.katilimciya_gorunen_not || ''),
    guncellenme_tarihi: new Date().toISOString()
  }

  if (existing) {
    const { data, error } = await supabase
      .from('core_katilimciperformans')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .maybeSingle()

    if (error) throw new Error(error.message)
    await recalculateAndSyncKatilimciPerformans(katilimci_id)
    return data
  } else {
    const { data, error } = await supabase
      .from('core_katilimciperformans')
      .insert({
        ...payload,
        olusturulma_tarihi: new Date().toISOString()
      })
      .select()
      .maybeSingle()

    if (error) throw new Error(error.message)
    await recalculateAndSyncKatilimciPerformans(katilimci_id)
    return data
  }
}

export async function addAdminToplantiKatilimi(katilimci_id, form) {
  const { data, error } = await supabase
    .from('core_toplantikatilimi')
    .insert({
      katilimci_id,
      baslik: String(form.baslik || '').trim(),
      tarih: form.tarih || new Date().toISOString().split('T')[0],
      katildi_mi: Boolean(form.katildi_mi),
      katilim_puani: Number(form.katilim_puani) || 0,
      not_metni: String(form.not_metni || ''),
      olusturulma_tarihi: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  await recalculateAndSyncKatilimciPerformans(katilimci_id)
  return data
}

export async function deleteAdminToplantiKatilimi(id, katilimci_id) {
  const { error } = await supabase
    .from('core_toplantikatilimi')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  await recalculateAndSyncKatilimciPerformans(katilimci_id)
  return true
}

export async function addAdminSosyalMedya(katilimci_id, form) {
  const tSayisi = Number(form.takipci_sayisi) || 0
  const eSayisi = Number(form.etkilesim_sayisi) || 0
  const etkilesimOrani = tSayisi > 0 ? Number(((eSayisi / tSayisi) * 100).toFixed(2)) : 0

  const { data, error } = await supabase
    .from('core_sosyalmedyaperformansi')
    .insert({
      katilimci_id,
      platform: String(form.platform || 'Instagram').trim() || 'Instagram',
      takipci_sayisi: tSayisi,
      etkilesim_sayisi: eSayisi,
      etkilesim_orani: etkilesimOrani,
      bonus_puan: Number(form.bonus_puan) || 0,
      not_metni: String(form.not_metni || ''),
      olusturulma_tarihi: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw new Error("Sosyal medya kaydı eklenemedi. Lütfen alanları kontrol edin.")
  await recalculateAndSyncKatilimciPerformans(katilimci_id)
  return data
}

export async function deleteAdminSosyalMedya(id, katilimci_id) {
  const { error } = await supabase
    .from('core_sosyalmedyaperformansi')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  await recalculateAndSyncKatilimciPerformans(katilimci_id)
  return true
}

export async function addAdminPerformansNotu(katilimci_id, form) {
  const kriterId = form.kriter ? Number(form.kriter) : null
  if (!kriterId) {
    throw new Error('Lütfen geçerli bir performans kriteri seçin.')
  }

  const { data, error } = await supabase
    .from('core_katilimciperformansnotu')
    .insert({
      katilimci_id,
      kriter_id: kriterId,
      puan: Number(form.puan) || 0,
      not_metni: String(form.not_metni || ''),
      tarih: form.tarih || new Date().toISOString().split('T')[0],
      olusturulma_tarihi: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function uploadFileToGoogleDrive({ filename, file_base64, content_type, katilimci_adi, katilimci_id }) {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData?.session?.access_token
  if (!token) throw new Error('Oturum açmanız gerekmektedir.')

  const user = sessionData?.session?.user

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wczupupflxvfnjbjkfrj.supabase.co'
  const res = await fetch(`${supabaseUrl}/functions/v1/google-drive-action`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'upload_file',
      payload: {
        filename,
        file_base64,
        content_type,
        katilimci_adi,
        katilimci_id,
        user_email: user?.email || ''
      }
    })
  })

  const body = await res.json()
  if (!res.ok || !body.ok) {
    throw new Error(body.error || 'Google Drive yükleme hatası oluştu.')
  }
  return body.data
}

export async function submitKatilimciTeslim({ gorev_id, teslim_linki, aciklama, file }) {
  if (!gorev_id) {
    throw new Error('Görev bilgisi bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.')
  }

  const cleanLink = typeof teslim_linki === 'string' ? teslim_linki.trim() : ''
  if (!file && !cleanLink) {
    throw new Error('Lütfen bir dosya yükleyin veya harici bağlantı girin.')
  }

  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Oturum açmanız gerekmektedir.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('core_katilimci_id, ad_soyad')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || !profile.core_katilimci_id) {
    throw new Error('Katılımcı profil kaydınız bulunamadı.')
  }

  const katilimciId = profile.core_katilimci_id
  const katilimciAdi = profile.ad_soyad || ''

  const { data: katilimciRow } = await supabase.from('core_katilimci').select('takim_id').eq('id', katilimciId).maybeSingle()
  const takimId = katilimciRow?.takim_id || null

  let finalFileLink = cleanLink
  let finalFileDosya = ''

  if (file) {
    const fileBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const driveRes = await uploadFileToGoogleDrive({
      filename: file.name,
      file_base64: fileBase64,
      content_type: file.type,
      katilimci_adi: katilimciAdi,
      katilimci_id: katilimciId
    })

    const driveUrl = driveRes ? (driveRes.webViewLink || driveRes.download_url || '') : ''
    finalFileDosya = driveUrl
    if (!finalFileLink) {
      finalFileLink = driveUrl
    }
  }

  const nowIso = new Date().toISOString()

  const { data: existingTeslimList } = await supabase
    .from('core_teslim')
    .select('id')
    .eq('katilimci_id', katilimciId)
    .eq('gorev_id', gorev_id)
    .order('id', { ascending: false })
    .limit(1)

  const existingTeslim = existingTeslimList && existingTeslimList.length > 0 ? existingTeslimList[0] : null

  const { data: inserted, error: iErr } = await supabase
    .from('core_teslim')
    .insert({
      katilimci_id: katilimciId,
      takim_id: takimId,
      gorev_id: gorev_id,
      teslim_linki: finalFileLink,
      teslim_dosyasi: finalFileDosya,
      aciklama: aciklama || '',
      teslim_tarihi: nowIso,
      durum: 'BEKLIYOR',
      revizyon_istendi: false,
      degerlendirildi: false
    })
    .select()

  if (iErr) throw new Error(iErr.message)
  const teslimRecord = (Array.isArray(inserted) && inserted.length > 0) ? inserted[0] : inserted

  if (teslimRecord && teslimRecord.id) {
    try {
      await supabase.from('core_teslimhareketi').insert({
        teslim_id: teslimRecord.id,
        islem_tipi: existingTeslim ? 'REVIZE_TESLIM' : 'TESLIM_EDILDI',
        aciklama: aciklama || (existingTeslim ? 'Katılımcı revize görevi teslim etti' : 'Katılımcı görevi teslim etti'),
        teslim_linki: finalFileLink,
        teslim_dosyasi: finalFileDosya,
        olusturulma_tarihi: nowIso
      })
    } catch (hErr) {
      console.warn('core_teslimhareketi insert skipped:', hErr)
    }
  }

  return normalizeTeslim(teslimRecord)
}


