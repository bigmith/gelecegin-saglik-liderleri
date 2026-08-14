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

function parseCsvLine(line: string, delim: string = ','): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === delim && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''))
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''))
  return result
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i')
    .replace(/[^a-z0-9]/g, '')
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { action, payload } = await req.json()

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: dry_run_cleanup (BÖLÜM 0 DB Dry-Run)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'dry_run_cleanup') {
      const { count: gorevCount } = await adminClient.from('core_gorev').select('*', { count: 'exact', head: true })
      const { count: teslimCount } = await adminClient.from('core_teslim').select('*', { count: 'exact', head: true })
      const { count: hareketCount } = await adminClient.from('core_teslimhareketi').select('*', { count: 'exact', head: true })
      const { count: perfCount } = await adminClient.from('core_katilimciperformans').select('*', { count: 'exact', head: true })

      const { count: katilimciCount } = await adminClient.from('core_katilimci').select('*', { count: 'exact', head: true })
      const { count: adayCount } = await adminClient.from('core_aday').select('*', { count: 'exact', head: true })
      const { count: mentorCount } = await adminClient.from('core_mentor').select('*', { count: 'exact', head: true })
      const { count: takimCount } = await adminClient.from('core_takim').select('*', { count: 'exact', head: true })

      return jsonRes(req, {
        ok: true,
        data: {
          core_gorev_count: gorevCount || 0,
          core_teslim_count: teslimCount || 0,
          core_teslimhareketi_count: hareketCount || 0,
          core_katilimciperformans_count: perfCount || 0,
          protected_counts: {
            core_katilimci: katilimciCount || 0,
            core_aday: adayCount || 0,
            core_mentor: mentorCount || 0,
            core_takim: takimCount || 0
          }
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: clean_task_environment (BÖLÜM 0 DB Cleanup Execution)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'clean_task_environment') {
      // 1. Delete all core_teslimhareketi
      const { error: hErr } = await adminClient.from('core_teslimhareketi').delete().neq('id', 0)
      if (hErr) console.warn('core_teslimhareketi delete warning:', hErr)

      // 2. Delete all core_teslim
      const { error: tErr } = await adminClient.from('core_teslim').delete().neq('id', 0)
      if (tErr) console.warn('core_teslim delete warning:', tErr)

      // 3. Delete all core_gorev
      const { error: gErr } = await adminClient.from('core_gorev').delete().neq('id', 0)
      if (gErr) console.warn('core_gorev delete warning:', gErr)

      // 4. Reset gorev_puani = 0 and recalculate bireysel_puan in core_katilimciperformans
      const { data: perfs } = await adminClient.from('core_katilimciperformans').select('*')
      if (perfs && perfs.length > 0) {
        for (const p of perfs) {
          const newBireysel = (p.toplanti_katilim_puani || 0) + (p.etkilesim_bonus_puani || 0) + (p.manuel_puan || 0)
          await adminClient.from('core_katilimciperformans').update({
            gorev_puani: 0,
            bireysel_puan: newBireysel,
            guncellenme_tarihi: new Date().toISOString()
          }).eq('id', p.id)
        }
      }

      // Verification counts
      const { count: finalGorev } = await adminClient.from('core_gorev').select('*', { count: 'exact', head: true })
      const { count: finalTeslim } = await adminClient.from('core_teslim').select('*', { count: 'exact', head: true })
      const { count: finalHareket } = await adminClient.from('core_teslimhareketi').select('*', { count: 'exact', head: true })

      return jsonRes(req, {
        ok: true,
        data: {
          final_core_gorev_count: finalGorev || 0,
          final_core_teslim_count: finalTeslim || 0,
          final_core_teslimhareketi_count: finalHareket || 0
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: clean_dna_tests (DNA Testlerini Temizleme)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'clean_dna_tests') {
      const { error: dErr } = await adminClient.from('core_icerikdnatesti').delete().neq('id', 0)
      if (dErr) {
        console.error('clean_dna_tests error:', dErr)
        return jsonRes(req, { ok: false, error: dErr.message }, 500)
      }
      return jsonRes(req, { ok: true, data: { success: true } })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonRes(req, { ok: false, error: 'Yetkilendirme başlığı eksik.' }, 401)

    if (action === 'approve_candidate') {
      const { aday_id } = payload
      if (!aday_id) return jsonRes(req, { ok: false, error: 'aday_id zorunludur.' }, 400)

      const { data: aday, error: adayErr } = await adminClient
        .from('core_aday').select('*').eq('id', aday_id).maybeSingle()
      if (adayErr || !aday) return jsonRes(req, { ok: false, error: 'Aday bulunamadı.' }, 404)

      const { error: updateErr } = await adminClient
        .from('core_aday').update({ basvuru_durumu: 'ONAYLANDI' }).eq('id', aday_id)
      if (updateErr) return jsonRes(req, { ok: false, error: 'Aday durumu güncellenemedi.' }, 500)

      const { data: existing } = await adminClient
        .from('core_katilimci').select('id').eq('aday_id', aday_id).maybeSingle()

      let katilimci = existing
      if (!existing) {
        const { data: kData, error: kErr } = await adminClient
          .from('core_katilimci')
          .insert({
            aday_id: aday_id,
            kabul_durumu: true,
            kabul_tarihi: new Date().toISOString().split('T')[0],
            program_katilim_durumu: 'AKTIF',
            notlar: '',
          })
          .select().single()
        if (kErr) return jsonRes(req, { ok: false, error: 'Katılımcı kaydı oluşturulamadı.' }, 500)
        katilimci = kData

        await adminClient.from('core_katilimciperformans').insert({
          katilimci_id: kData.id,
          bireysel_puan: 0, gorev_puani: 0, toplanti_katilim_puani: 0,
          etkilesim_bonus_puani: 0, manuel_puan: 0,
        })
      }

      return jsonRes(req, { ok: true, data: { aday_id, katilimci, action: 'approve_candidate' } })
    }

    if (action === 'reject_candidate') {
      const { aday_id } = payload
      if (!aday_id) return jsonRes(req, { ok: false, error: 'aday_id zorunludur.' }, 400)

      const { error: updateErr } = await adminClient
        .from('core_aday').update({ basvuru_durumu: 'REDDEDILDI' }).eq('id', aday_id)
      if (updateErr) return jsonRes(req, { ok: false, error: 'Aday durumu güncellenemedi.' }, 500)

      return jsonRes(req, { ok: true, data: { aday_id, action: 'reject_candidate' } })
    }

    if (action === 'create_mentor') {
      const { ad_soyad, eposta, uzmanlik, gecici_sifre } = payload
      if (!ad_soyad || !eposta) return jsonRes(req, { ok: false, error: 'ad_soyad ve eposta zorunludur.' }, 400)

      const { data: existingMentor } = await adminClient
        .from('core_mentor')
        .select('*')
        .eq('eposta', eposta)
        .maybeSingle()

      if (existingMentor && existingMentor.aktif === false) {
        const { data: reactivatedMentor, error: reactErr } = await adminClient
          .from('core_mentor')
          .update({ aktif: true, silinme_tarihi: null, ad_soyad, uzmanlik: uzmanlik || existingMentor.uzmanlik })
          .eq('id', existingMentor.id)
          .select()
          .single()

        if (reactErr) return jsonRes(req, { ok: false, error: 'Pasif mentor tekrar aktifleştirilemedi.' }, 500)

        const { data: pRow } = await adminClient.from('profiles').select('id').eq('email', eposta).maybeSingle()
        if (pRow) {
          await adminClient.from('profiles').update({
            role: 'mentor', ad_soyad, core_mentor_id: existingMentor.id
          }).eq('id', pRow.id)
        }

        return jsonRes(req, { ok: true, data: { mentor: reactivatedMentor, action: 'create_mentor', reactivated: true } })
      }

      const password = gecici_sifre || Math.random().toString(36).slice(-10) + 'A1!'
      const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
        email: eposta, password, email_confirm: true,
        user_metadata: { ad_soyad, uzmanlik },
      })

      if (authErr) {
        const msg = authErr.message || ''
        if (msg.includes('already registered') || msg.includes('already exists')) {
          return jsonRes(req, { ok: false, error: 'Bu e-posta adresi zaten kayıtlıdır.' }, 409)
        }
        return jsonRes(req, { ok: false, error: 'Auth kullanıcısı oluşturulamadı.' }, 500)
      }

      const newUserId = authUser.user?.id
      if (!newUserId) return jsonRes(req, { ok: false, error: 'Auth ID alınamadı.' }, 500)

      const { data: mentorData, error: mentorErr } = await adminClient
        .from('core_mentor')
        .insert({ ad_soyad, eposta, uzmanlik: uzmanlik || '', aktif: true })
        .select().single()
      if (mentorErr) return jsonRes(req, { ok: false, error: 'Mentor kaydı oluşturulamadı.' }, 500)

      await adminClient.from('profiles').upsert({
        id: newUserId, email: eposta, role: 'mentor', ad_soyad, core_mentor_id: mentorData.id,
      }, { onConflict: 'id' })

      return jsonRes(req, { ok: true, data: { mentor: mentorData, action: 'create_mentor' } })
    }

    if (action === 'delete_mentor') {
      const { mentor_id } = payload
      if (!mentor_id) return jsonRes(req, { ok: false, error: 'mentor_id zorunludur.' }, 400)

      const now = new Date().toISOString()

      const { error: softDelErr } = await adminClient
        .from('core_mentor')
        .update({ aktif: false, silinme_tarihi: now })
        .eq('id', mentor_id)

      if (softDelErr) {
        console.error('Soft delete mentor error:', softDelErr)
        return jsonRes(req, { ok: false, error: 'Mentor pasif hale getirilemedi.' }, 500)
      }

      await adminClient.from('core_takim').update({ mentor_id: null }).eq('mentor_id', mentor_id)

      return jsonRes(req, { ok: true, data: { mentor_id, action: 'delete_mentor', soft_deleted: true } })
    }

    if (action === 'import_candidates_csv') {
      const { csv_text, filename } = payload
      if (!csv_text || typeof csv_text !== 'string' || !csv_text.trim()) {
        return jsonRes(req, { ok: false, error: 'CSV metni boş olamaz.' }, 400)
      }

      // Strip UTF-8 BOM
      const cleanCsv = csv_text.replace(/^\uFEFF/, '')
      const rawLines = cleanCsv.split(/\r?\n/).filter(line => line.trim().length > 0)
      if (rawLines.length < 2) {
        return jsonRes(req, { ok: false, error: 'CSV dosyası başlık ve en az 1 veri satırı içermelidir.' }, 400)
      }

      if (rawLines.length > 501) {
        return jsonRes(req, { ok: false, error: 'Bir defada en fazla 500 satır içe aktarılabilir.' }, 400)
      }

      // Auto detect delimiter: comma vs semicolon
      const firstLine = rawLines[0]
      const semicolonCount = (firstLine.match(/;/g) || []).length
      const commaCount = (firstLine.match(/,/g) || []).length
      const delimiter = semicolonCount > commaCount ? ';' : ','

      const headers = parseCsvLine(rawLines[0], delimiter).map(normalizeHeader)

      function getColIndex(aliases: string[]): number {
        const normAliases = aliases.map(normalizeHeader)
        return headers.findIndex(h => normAliases.includes(h))
      }

      const colAd = getColIndex(['ad', 'adi', 'adiniz', 'first_name', 'firstname', 'name', 'isim'])
      const colSoyad = getColIndex(['soyad', 'soyadi', 'soyadiniz', 'last_name', 'lastname', 'surname', 'soyisim'])
      const colEposta = getColIndex(['eposta', 'e-posta', 'e posta', 'eposta adresi', 'eposta adresiniz', 'email', 'e-mail', 'mail', 'email adresi', 'email adresiniz'])
      const colTelefon = getColIndex(['telefon', 'telefon numarası', 'telefon numaranız', 'tel', 'phone', 'gsm', 'mobile'])
      const colUniversite = getColIndex(['universite', 'üniversite', 'okuduğunuz / mezun olduğunuz üniversite', 'university', 'okul'])
      const colSinif = getColIndex(['sinif', 'sınıf', 'sınıfınız', 'sinifiniz', 'class', 'grade', 'yil'])
      const colTakvimOnay = getColIndex(['program takvimine uyum ve devamlılık onayı', 'takvim onayi', 'takvim_onay', 'devamlılık onayı'])
      const colKaynak = getColIndex(['kaynak', 'source'])
      const colAdSoyadCombined = getColIndex(['ad_soyad', 'ad soyad', 'isim soyisim', 'adi soyadi', 'adiniz soyadiniz', 'fullname', 'full_name'])

      if (colEposta === -1 || (colAd === -1 && colSoyad === -1 && colAdSoyadCombined === -1)) {
        return jsonRes(req, { ok: false, error: 'CSV başlıkları tanınamadı. Lütfen eposta/email ve ad/soyad veya ad_soyad kolonları kullanın.' }, 400)
      }

      const { data: existingAdaylar } = await adminClient.from('core_aday').select('eposta')
      const existingEmails = new Set((existingAdaylar || []).map(a => (a.eposta || '').trim().toLowerCase()))

      const nowIso = new Date().toISOString()
      const rowsToInsert: any[] = []
      const errors: string[] = []
      let skippedCount = 0

      for (let i = 1; i < rawLines.length; i++) {
        const cols = parseCsvLine(rawLines[i], delimiter)
        if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue

        let email = colEposta !== -1 ? (cols[colEposta] || '').trim().toLowerCase() : ''
        let ad = colAd !== -1 ? (cols[colAd] || '').trim() : ''
        let soyad = colSoyad !== -1 ? (cols[colSoyad] || '').trim() : ''

        if (!ad && !soyad && colAdSoyadCombined !== -1) {
          const combinedVal = (cols[colAdSoyadCombined] || '').trim()
          const parts = combinedVal.split(/\s+/)
          ad = parts[0] || ''
          soyad = parts.slice(1).join(' ') || ''
        }

        const rowNum = i + 1
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email || !emailRegex.test(email)) {
          errors.push(`Satır ${rowNum}: Geçersiz veya boş e-posta adresi ("${cols[colEposta] || ad || 'boş'}")`)
          continue
        }

        if (!ad) {
          errors.push(`Satır ${rowNum}: Ad alanı boş`)
          continue
        }

        if (existingEmails.has(email)) {
          skippedCount++
          continue
        }

        const telefon = colTelefon !== -1 ? (cols[colTelefon] || '').trim() : null
        const universite = colUniversite !== -1 ? (cols[colUniversite] || '').trim() : null
        const sinif = colSinif !== -1 ? (cols[colSinif] || '').trim() : null
        const takvimOnayVal = colTakvimOnay !== -1 ? (cols[colTakvimOnay] || '').trim().toLowerCase() : ''
        const takvim_onay = takvimOnayVal.includes('evet') || takvimOnayVal.includes('onay') || takvimOnayVal.includes('kabul') || takvimOnayVal === 'true' || takvimOnayVal === '1'
        const kaynakVal = colKaynak !== -1 && cols[colKaynak] ? cols[colKaynak].trim() : 'Google Forms CSV Import'

        existingEmails.add(email)
        rowsToInsert.push({
          ad,
          soyad: soyad || ad,
          eposta: email,
          telefon: telefon || null,
          universite: universite || null,
          sinif: sinif || null,
          kaynak: kaynakVal,
          basvuru_tarihi: nowIso,
          basvuru_durumu: 'BEKLIYOR',
          takvim_onay: takvim_onay,
        })
      }

      let insertedCount = 0
      if (rowsToInsert.length > 0) {
        const { data: insertedData, error: insertErr } = await adminClient
          .from('core_aday')
          .insert(rowsToInsert)
          .select()

        if (insertErr) {
          console.error('CSV Bulk Insert Error:', insertErr)
          return jsonRes(req, { ok: false, error: 'Adaylar veritabanına eklenirken hata oluştu: ' + insertErr.message }, 500)
        }
        insertedCount = insertedData ? insertedData.length : rowsToInsert.length
      }

      return jsonRes(req, {
        ok: true,
        data: {
          inserted: insertedCount,
          skipped: skippedCount,
          total: rawLines.length - 1,
          errors: errors,
          filename: filename || 'adaylar.csv'
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: dry_run_cleanup (BÖLÜM 0 DB Dry-Run)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'dry_run_cleanup') {
      const { count: gorevCount } = await adminClient.from('core_gorev').select('*', { count: 'exact', head: true })
      const { count: teslimCount } = await adminClient.from('core_teslim').select('*', { count: 'exact', head: true })
      const { count: hareketCount } = await adminClient.from('core_teslimhareketi').select('*', { count: 'exact', head: true })
      const { count: perfCount } = await adminClient.from('core_katilimciperformans').select('*', { count: 'exact', head: true })

      const { count: katilimciCount } = await adminClient.from('core_katilimci').select('*', { count: 'exact', head: true })
      const { count: adayCount } = await adminClient.from('core_aday').select('*', { count: 'exact', head: true })
      const { count: mentorCount } = await adminClient.from('core_mentor').select('*', { count: 'exact', head: true })
      const { count: takimCount } = await adminClient.from('core_takim').select('*', { count: 'exact', head: true })

      return jsonRes(req, {
        ok: true,
        data: {
          core_gorev_count: gorevCount || 0,
          core_teslim_count: teslimCount || 0,
          core_teslimhareketi_count: hareketCount || 0,
          core_katilimciperformans_count: perfCount || 0,
          protected_counts: {
            core_katilimci: katilimciCount || 0,
            core_aday: adayCount || 0,
            core_mentor: mentorCount || 0,
            core_takim: takimCount || 0
          }
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: clean_task_environment (BÖLÜM 0 DB Cleanup Execution)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'clean_task_environment') {
      // 1. Delete all core_teslimhareketi
      const { error: hErr } = await adminClient.from('core_teslimhareketi').delete().neq('id', 0)
      if (hErr) console.warn('core_teslimhareketi delete warning:', hErr)

      // 2. Delete all core_teslim
      const { error: tErr } = await adminClient.from('core_teslim').delete().neq('id', 0)
      if (tErr) console.warn('core_teslim delete warning:', tErr)

      // 3. Delete all core_gorev
      const { error: gErr } = await adminClient.from('core_gorev').delete().neq('id', 0)
      if (gErr) console.warn('core_gorev delete warning:', gErr)

      // 4. Reset gorev_puani = 0 and recalculate bireysel_puan in core_katilimciperformans
      const { data: perfs } = await adminClient.from('core_katilimciperformans').select('*')
      if (perfs && perfs.length > 0) {
        for (const p of perfs) {
          const newBireysel = (p.toplanti_katilim_puani || 0) + (p.etkilesim_bonus_puani || 0) + (p.manuel_puan || 0)
          await adminClient.from('core_katilimciperformans').update({
            gorev_puani: 0,
            bireysel_puan: newBireysel,
            guncellenme_tarihi: new Date().toISOString()
          }).eq('id', p.id)
        }
      }

      // Verification counts
      const { count: finalGorev } = await adminClient.from('core_gorev').select('*', { count: 'exact', head: true })
      const { count: finalTeslim } = await adminClient.from('core_teslim').select('*', { count: 'exact', head: true })
      const { count: finalHareket } = await adminClient.from('core_teslimhareketi').select('*', { count: 'exact', head: true })

      return jsonRes(req, {
        ok: true,
        data: {
          final_core_gorev_count: finalGorev || 0,
          final_core_teslim_count: finalTeslim || 0,
          final_core_teslimhareketi_count: finalHareket || 0
        }
      })
    }

    return jsonRes(req, { ok: false, error: 'Bilinmeyen action: ' + action }, 400)

  } catch (err: any) {
    console.error('admin-actions error:', err)
    return jsonRes(req, { ok: false, error: err?.message || String(err) }, 500)
  }
})
