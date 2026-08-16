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

function getResetPasswordHtml(userName: string, actionLink: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Şifrenizi Belirleyin</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0;">
          <!-- Header gradient banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); padding: 36px 30px; text-align: center;">
              <div style="display: inline-block; width: 54px; height: 54px; line-height: 54px; background-color: rgba(255,255,255,0.2); border-radius: 16px; font-weight: 900; font-size: 20px; color: #ffffff; margin-bottom: 12px;">GD</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Geleceğin Dijital Sağlık Liderleri</h1>
              <p style="margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">Kişiselleştirilmiş Liderlik &amp; Operasyon Platformu</p>
            </td>
          </tr>
          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px 30px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 18px; font-weight: 700;">Merhaba ${userName},</h2>
              <p style="margin: 0 0 18px; color: #475569; font-size: 14px; line-height: 1.6;">
                Geleceğin Dijital Sağlık Liderleri platformu için hesabınız hazırlandı. Sisteme güvenle giriş yapabilmeniz ve haftalık program akışına erişebilmeniz için lütfen aşağıdaki butona tıklayarak kendi şifrenizi belirleyin.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${actionLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 34px; border-radius: 12px; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35);">
                      Şifremi Belirle →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="background-color: #fff7ed; border-left: 4px solid #f97316; border-radius: 8px; padding: 12px 16px; margin: 24px 0 20px;">
                <p style="margin: 0; color: #9a3412; font-size: 12px; line-height: 1.5;">
                  <strong>Güvenlik Uyarısı:</strong> Bu bağlantı sadece size özel ve tek kullanımlıktır. Güvenliğiniz için lütfen bağlantıyı üçüncü kişilerle paylaşmayınız.
                </p>
              </div>

              <!-- Fallback text link -->
              <p style="margin: 20px 0 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                Eğer buton çalışmıyorsa aşağıdaki bağlantıyı tarayıcınızın adres çubuğuna kopyalayıp yapıştırabilirsiniz:
              </p>
              <p style="margin: 6px 0 0; word-break: break-all; font-size: 11px; color: #f97316;">
                <a href="${actionLink}" target="_blank" style="color: #f97316; text-decoration: underline;">${actionLink}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600;">Marka Mutfağı &bull; Geleceğin Dijital Sağlık Liderleri</p>
              <p style="margin: 4px 0 0; color: #94a3b8; font-size: 11px;">Bu e-posta otomatik olarak gönderilmiştir. Sorularınız için saglikliderleri@markamutfagi.co ile iletişime geçebilirsiniz.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
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
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { action, payload } = await req.json()

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: full_dry_run (Detailed counts of everything)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'full_dry_run') {
      const { count: gorevCount } = await adminClient.from('core_gorev').select('*', { count: 'exact', head: true })
      const { count: teslimCount } = await adminClient.from('core_teslim').select('*', { count: 'exact', head: true })
      const { count: hareketCount } = await adminClient.from('core_teslimhareketi').select('*', { count: 'exact', head: true })
      const { count: dnaCount } = await adminClient.from('core_icerikdnatesti').select('*', { count: 'exact', head: true })
      const { count: mentorNotCount } = await adminClient.from('core_mentornotu').select('*', { count: 'exact', head: true })
      const { count: perfCount } = await adminClient.from('core_katilimciperformans').select('*', { count: 'exact', head: true })

      const { count: katilimciCount } = await adminClient.from('core_katilimci').select('*', { count: 'exact', head: true })
      const { count: adayCount } = await adminClient.from('core_aday').select('*', { count: 'exact', head: true })
      const { count: mentorCount } = await adminClient.from('core_mentor').select('*', { count: 'exact', head: true })
      const { count: takimCount } = await adminClient.from('core_takim').select('*', { count: 'exact', head: true })
      const { count: profilesCount } = await adminClient.from('profiles').select('*', { count: 'exact', head: true })

      // Auth users count
      const { data: authUsersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const authUsersCount = authUsersData?.users?.length || 0

      // Get list of existing emails in auth.users and profiles
      const existingAuthEmails = (authUsersData?.users || []).map(u => ({ email: u.email, id: u.id, last_sign_in_at: u.last_sign_in_at }))
      
      return jsonRes(req, {
        ok: true,
        data: {
          to_delete: {
            core_gorev: gorevCount || 0,
            core_teslim: teslimCount || 0,
            core_teslimhareketi: hareketCount || 0,
            core_icerikdnatesti: dnaCount || 0,
            core_mentornotu: mentorNotCount || 0,
          },
          recalculated: {
            core_katilimciperformans: perfCount || 0
          },
          protected: {
            core_katilimci: katilimciCount || 0,
            core_aday: adayCount || 0,
            core_mentor: mentorCount || 0,
            core_takim: takimCount || 0,
            profiles: profilesCount || 0,
            auth_users: authUsersCount
          },
          existing_auth_emails: existingAuthEmails
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: audit_launch_recipients
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'audit_launch_recipients') {
      const { data: adaylar } = await adminClient.from('core_aday').select('*')
      const { data: katilimcilar } = await adminClient.from('core_katilimci').select('*')
      const { data: profiles } = await adminClient.from('profiles').select('*')
      const { data: takimlar } = await adminClient.from('core_takim').select('*')
      const { data: authUsersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const authUsers = (authUsersData?.users || []).map(u => ({
        id: u.id,
        email: (u.email || '').toLowerCase(),
        last_sign_in_at: u.last_sign_in_at,
        created_at: u.created_at,
        role: u.user_metadata?.role
      }))

      // Specific audits
      const auditAccount = (email: string) => {
        const clean = email.toLowerCase().trim()
        const authUser = authUsers.find(u => u.email === clean)
        const profile = (profiles || []).find(p => (p.email || '').toLowerCase() === clean)
        const aday = (adaylar || []).find(a => (a.eposta || '').toLowerCase() === clean)
        const katilimci = (katilimcilar || []).find(k => k.aday_id === aday?.id || k.id === profile?.core_katilimci_id)
        const takim = katilimci?.takim_id ? (takimlar || []).find(t => t.id === katilimci.takim_id) : null

        return {
          email: clean,
          has_auth_user: Boolean(authUser),
          auth_user_id: authUser?.id || null,
          last_sign_in_at: authUser?.last_sign_in_at || null,
          has_profile: Boolean(profile),
          profile_id: profile?.id || null,
          profile_role: profile?.role || null,
          profile_name: profile?.ad_soyad || null,
          profile_core_katilimci_id: profile?.core_katilimci_id || null,
          has_core_katilimci: Boolean(katilimci),
          core_katilimci_id: katilimci?.id || null,
          takim_id: katilimci?.takim_id || null,
          takim_adi: takim?.takim_adi || null,
          has_core_aday: Boolean(aday),
          core_aday_id: aday?.id || null,
          core_aday_basvuru_durumu: aday?.basvuru_durumu || null,
          access_reason: profile?.role === 'katilimci' ? 'profiles.role=katilimci olduğu için /katilimci paneline erişebiliyor' : 'Yetkisiz / Farklı rol'
        }
      }

      const akyasanAudit = auditAccount('akyasan.6178@gmail.com')
      const katilimciTestAudit = auditAccount('katilimci-test@gdsl.com')

      // All approved participants from CSV (excluding tests)
      const allParticipants = (katilimcilar || []).map(k => {
        const aday = (adaylar || []).find(a => a.id === k.aday_id)
        const email = (aday?.eposta || profileMatching(k.id))?.toLowerCase() || ''
        const authUser = authUsers.find(u => u.email === email)
        const profile = (profiles || []).find(p => (p.email || '').toLowerCase() === email || p.core_katilimci_id === k.id)
        const takim = k.takim_id ? (takimlar || []).find(t => t.id === k.takim_id) : null

        function profileMatching(kId: number) {
          const pr = (profiles || []).find(p => p.core_katilimci_id === kId)
          return pr?.email || ''
        }

        const isTestEmail = email.includes('test') || email.includes('gdsl.com') || email === 'akyasan.6178@gmail.com'

        return {
          katilimci_id: k.id,
          aday_id: aday?.id || null,
          ad_soyad: aday ? `${aday.ad || ''} ${aday.soyad || ''}`.trim() : (profile?.ad_soyad || `Katılımcı #${k.id}`),
          email: email || profile?.email || null,
          is_test_account: isTestEmail,
          has_auth_user: Boolean(authUser),
          profile_role: profile?.role || null,
          core_aday_durumu: aday?.basvuru_durumu || null,
          program_katilim_durumu: k.program_katilim_durumu || null,
          takim_adi: takim?.takim_adi || null
        }
      })

      return jsonRes(req, {
        ok: true,
        data: {
          akyasan_audit: akyasanAudit,
          katilimci_test_audit: katilimciTestAudit,
          real_participants: allParticipants.filter(p => !p.is_test_account),
          test_participants: allParticipants.filter(p => p.is_test_account),
          total_real_count: allParticipants.filter(p => !p.is_test_account).length,
          all_profiles_count: (profiles || []).length,
          all_auth_users_count: authUsers.length
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: check_csv_candidates_in_db
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'check_csv_candidates_in_db') {
      const emails = payload?.emails || []
      const { data: adaylar } = await adminClient.from('core_aday').select('id, ad, soyad, eposta, basvuru_durumu')
      const { data: katilimcilar } = await adminClient.from('core_katilimci').select('id, aday_id, program_katilim_durumu')
      const { data: profiles } = await adminClient.from('profiles').select('id, email, role, core_katilimci_id')
      const { data: authUsersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })

      const results = emails.map((em: string) => {
        const clean = (em || '').trim().toLowerCase()
        const aday = (adaylar || []).find(a => (a.eposta || '').trim().toLowerCase() === clean)
        const katilimci = aday ? (katilimcilar || []).find(k => k.aday_id === aday.id) : null
        const profile = (profiles || []).find(p => (p.email || '').trim().toLowerCase() === clean)
        const authUser = (authUsersData?.users || []).find(u => (u.email || '').trim().toLowerCase() === clean)

        return {
          email: clean,
          in_aday: Boolean(aday),
          aday_id: aday?.id,
          in_katilimci: Boolean(katilimci),
          katilimci_id: katilimci?.id,
          in_profiles: Boolean(profile),
          in_auth: Boolean(authUser),
          auth_id: authUser?.id
        }
      })

      return jsonRes(req, { ok: true, data: results })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: verify_single_email_reset (SMTP Verification for Single Address)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'verify_single_email_reset') {
      const email = (payload?.email || '').trim().toLowerCase()
      if (!email) return jsonRes(req, { ok: false, error: 'email zorunludur.' }, 400)

      // 1. Check existing auth user
      const { data: authUsersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const existingUser = (authUsersData?.users || []).find(u => (u.email || '').toLowerCase() === email)

      let authUserId: string
      let authUserCreated = false

      if (existingUser) {
        authUserId = existingUser.id
      } else {
        // Generate cryptographic random temporary password (never logged/reported)
        const randomBytes = new Uint8Array(16)
        crypto.getRandomValues(randomBytes)
        const tempPassword = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('') + 'A1!'

        const { data: newAuth, error: authCreateErr } = await adminClient.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            ad_soyad: 'Test User',
            role: 'katilimci'
          }
        })

        if (authCreateErr) {
          return jsonRes(req, {
            ok: false,
            error: 'Test auth user oluşturulamadı: ' + authCreateErr.message
          }, 500)
        }
        authUserId = newAuth.user!.id
        authUserCreated = true
      }

      // 2. Check profile
      const { data: profile } = await adminClient.from('profiles').select('id, email, role, ad_soyad').eq('id', authUserId).maybeSingle()

      // 3. Send password reset email ONLY to this address
      const redirectTo = 'https://saglikliderleri.markamutfagi.co/reset-password'
      const { data: resetData, error: resetErr } = await adminClient.auth.resetPasswordForEmail(email, {
        redirectTo
      })

      if (resetErr) {
        let errorType = 'unknown error'
        const msg = (resetErr.message || '').toLowerCase()
        if (msg.includes('auth') || msg.includes('credential') || msg.includes('535')) errorType = 'SMTP auth failed'
        else if (msg.includes('sender') || msg.includes('from') || msg.includes('550')) errorType = 'sender rejected'
        else if (msg.includes('rate') || msg.includes('limit') || msg.includes('too many')) errorType = 'rate limit'
        else if (msg.includes('ip') || msg.includes('blocked')) errorType = 'IP blocked'
        else if (msg.includes('authorized') || msg.includes('unauthorized')) errorType = 'email not authorized'
        else if (msg.includes('redirect') || msg.includes('url')) errorType = 'redirect URL invalid'

        return jsonRes(req, {
          ok: true,
          data: {
            email,
            auth_user_existed: Boolean(existingUser),
            auth_user_created: authUserCreated,
            profile_role: profile?.role || 'katilimci',
            reset_mail_success: false,
            error_type: errorType,
            error_message: resetErr.message
          }
        })
      }

      return jsonRes(req, {
        ok: true,
        data: {
          email,
          auth_user_existed: Boolean(existingUser),
          auth_user_created: authUserCreated,
          profile_role: profile?.role || 'katilimci',
          reset_mail_success: true,
          redirect_url: redirectTo
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: send_password_reset_via_brevo (Brevo REST API Email Sender)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'send_password_reset_via_brevo') {
      const brevoApiKey = Deno.env.get('BREVO_API_KEY') || ''
      if (!brevoApiKey || !brevoApiKey.trim()) {
        return jsonRes(req, {
          ok: false,
          error: 'BREVO_API_KEY secret eksik.'
        }, 400)
      }

      const email = (payload?.email || '').trim().toLowerCase()
      if (!email) {
        return jsonRes(req, { ok: false, error: 'email alanı zorunludur.' }, 400)
      }

      // 1. Generate password recovery link safely via Admin API
      const redirectTo = 'https://saglikliderleri.markamutfagi.co/reset-password'
      const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo
        }
      })

      if (linkErr) {
        return jsonRes(req, {
          ok: false,
          error: 'Kurtarma bağlantısı üretilemedi: ' + linkErr.message
        }, 500)
      }

      const actionLink = linkData?.properties?.action_link
      if (!actionLink) {
        return jsonRes(req, {
          ok: false,
          error: 'Kurtarma bağlantısı alınamadı.'
        }, 500)
      }

      // 2. Fetch user's profile for personal greeting
      const { data: profile } = await adminClient
        .from('profiles')
        .select('ad_soyad')
        .eq('email', email)
        .maybeSingle()

      const userName = profile?.ad_soyad || email.split('@')[0]
      const htmlContent = getResetPasswordHtml(userName, actionLink)

      // 3. Send email via Brevo REST API
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            email: 'saglikliderleri@markamutfagi.co',
            name: 'Geleceğin Dijital Sağlık Liderleri'
          },
          to: [
            {
              email: email,
              name: userName
            }
          ],
          subject: 'Geleceğin Dijital Sağlık Liderleri | Şifreni Belirle',
          htmlContent: htmlContent
        })
      })

      if (brevoRes.ok) {
        const brevoData = await brevoRes.json().catch(() => ({}))
        return jsonRes(req, {
          ok: true,
          data: {
            success: true,
            email,
            provider: 'brevo',
            messageId: brevoData?.messageId || undefined
          }
        })
      } else {
        const errData = await brevoRes.json().catch(() => ({}))
        return jsonRes(req, {
          ok: false,
          error: `Brevo API Hatası (HTTP ${brevoRes.status}): ${errData?.message || brevoRes.statusText}`
        }, brevoRes.status >= 400 && brevoRes.status < 600 ? brevoRes.status : 500)
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: test_generate_link_only
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'test_generate_link_only') {
      const email = (payload?.email || '').trim().toLowerCase()
      const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: 'https://saglikliderleri.markamutfagi.co/reset-password'
        }
      })

      if (linkErr) {
        return jsonRes(req, { ok: false, error: linkErr.message })
      }

      // Return success status ONLY without revealing token or link
      return jsonRes(req, {
        ok: true,
        data: {
          email,
          user_id: linkData?.user?.id,
          link_generation_status: 'success'
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: test_smtp_reset_mail (Test sending a reset password email)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'test_smtp_reset_mail') {
      const testEmail = payload?.email || 'test@example.com'
      const { data, error } = await adminClient.auth.resetPasswordForEmail(testEmail, {
        redirectTo: 'https://saglikliderleri.markamutfagi.co/reset-password'
      })
      if (error) {
        return jsonRes(req, {
          ok: false,
          error: error.message,
          status: error.status,
          hint: 'Supabase SMTP / Brevo custom SMTP ayarı gerekebilir.'
        })
      }
      return jsonRes(req, {
        ok: true,
        data: {
          message: 'Reset e-postası isteği Supabase Auth tarafından kabul edildi.',
          testEmail
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: clean_task_environment (Clean tasks, deliveries, dna, mentor notes)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'clean_task_environment') {
      // 1. Delete core_teslimhareketi
      const { error: hErr } = await adminClient.from('core_teslimhareketi').delete().neq('id', 0)
      if (hErr) console.warn('core_teslimhareketi delete warning:', hErr)

      // 2. Delete core_teslim
      const { error: tErr } = await adminClient.from('core_teslim').delete().neq('id', 0)
      if (tErr) console.warn('core_teslim delete warning:', tErr)

      // 3. Delete core_gorev
      const { error: gErr } = await adminClient.from('core_gorev').delete().neq('id', 0)
      if (gErr) console.warn('core_gorev delete warning:', gErr)

      // 4. Delete core_icerikdnatesti
      const { error: dErr } = await adminClient.from('core_icerikdnatesti').delete().neq('id', 0)
      if (dErr) console.warn('core_icerikdnatesti delete warning:', dErr)

      // 5. Delete core_mentornotu
      const { error: mnErr } = await adminClient.from('core_mentornotu').delete().neq('id', 0)
      if (mnErr) console.warn('core_mentornotu delete warning:', mnErr)

      // 6. Reset performance scores
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
      const { count: finalDna } = await adminClient.from('core_icerikdnatesti').select('*', { count: 'exact', head: true })
      const { count: finalMentorNot } = await adminClient.from('core_mentornotu').select('*', { count: 'exact', head: true })

      return jsonRes(req, {
        ok: true,
        data: {
          final_core_gorev_count: finalGorev || 0,
          final_core_teslim_count: finalTeslim || 0,
          final_core_teslimhareketi_count: finalHareket || 0,
          final_core_icerikdnatesti_count: finalDna || 0,
          final_core_mentornotu_count: finalMentorNot || 0
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: import_and_setup_participants (Bulk import with Auth & Profile & Reset Mail)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'import_and_setup_participants') {
      const { participants, send_reset_mail } = payload
      if (!participants || !Array.isArray(participants) || participants.length === 0) {
        return jsonRes(req, { ok: false, error: 'Katılımcı listesi boş olamaz.' }, 400)
      }

      // Fetch existing auth users
      const { data: authUsersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const existingAuthMap = new Map((authUsersData?.users || []).map(u => [u.email?.toLowerCase(), u]))

      const results = []
      let adayCreated = 0
      let adayUpdated = 0
      let katilimciCreated = 0
      let katilimciUpdated = 0
      let profilesCreatedOrUpdated = 0
      let authUsersCreated = 0
      let authUsersExisting = 0
      let resetMailSent = 0
      let resetMailFailed = 0

      for (const p of participants) {
        const cleanEmail = (p.email || '').trim().toLowerCase()
        const ad = (p.ad || '').trim()
        const soyad = (p.soyad || '').trim()
        const telefon = (p.telefon || '').trim() || null
        const universite = (p.universite || '').trim() || null
        const sinif = (p.sinif || '').trim() || null
        const takvim_onay = Boolean(p.takvim_onay)
        const fullName = `${ad} ${soyad}`.trim()

        if (!cleanEmail) {
          results.push({ email: '', status: 'error', error: 'Boş e-posta adresi' })
          continue
        }

        // 1. core_aday upsert
        const { data: existingAday } = await adminClient
          .from('core_aday')
          .select('*')
          .ilike('eposta', cleanEmail)
          .maybeSingle()

        let adayId: number
        if (existingAday) {
          const { data: uAday, error: uErr } = await adminClient
            .from('core_aday')
            .update({
              ad: ad || existingAday.ad,
              soyad: soyad || existingAday.soyad,
              telefon: telefon || existingAday.telefon,
              universite: universite || existingAday.universite,
              sinif: sinif || existingAday.sinif,
              basvuru_durumu: 'ONAYLANDI',
              takvim_onay: takvim_onay ?? existingAday.takvim_onay,
            })
            .eq('id', existingAday.id)
            .select().single()
          
          if (uErr) {
            results.push({ email: cleanEmail, status: 'error', error: 'core_aday güncelleme hatası: ' + uErr.message })
            continue
          }
          adayId = uAday.id
          adayUpdated++
        } else {
          const { data: iAday, error: iErr } = await adminClient
            .from('core_aday')
            .insert({
              ad,
              soyad: soyad || ad,
              eposta: cleanEmail,
              telefon,
              universite,
              sinif,
              kaynak: 'Google Forms CSV Import (LAUNCH-PARTICIPANTS-02)',
              basvuru_tarihi: new Date().toISOString(),
              basvuru_durumu: 'ONAYLANDI',
              takvim_onay,
            })
            .select().single()

          if (iErr) {
            results.push({ email: cleanEmail, status: 'error', error: 'core_aday ekleme hatası: ' + iErr.message })
            continue
          }
          adayId = iAday.id
          adayCreated++
        }

        // 2. core_katilimci upsert
        let egitimDurumu: string | null = null
        if (sinif) {
          if (sinif.toLowerCase().includes('mezun')) egitimDurumu = 'Mezun'
          else if (sinif.toLowerCase().includes('sınıf') || sinif.toLowerCase().includes('sinif')) egitimDurumu = 'Okuyor'
        }

        const okulBilgisi = [universite, sinif].filter(Boolean).join(' - ') || null

        const { data: existingKatilimci } = await adminClient
          .from('core_katilimci')
          .select('*')
          .eq('aday_id', adayId)
          .maybeSingle()

        let katilimciId: number
        if (existingKatilimci) {
          const { data: uKat, error: ukErr } = await adminClient
            .from('core_katilimci')
            .update({
              telefon: telefon || existingKatilimci.telefon,
              okul_bilgisi: okulBilgisi || existingKatilimci.okul_bilgisi,
              egitim_durumu: egitimDurumu || existingKatilimci.egitim_durumu,
              kabul_durumu: true,
              program_katilim_durumu: 'AKTIF',
            })
            .eq('id', existingKatilimci.id)
            .select().single()

          if (ukErr) {
            results.push({ email: cleanEmail, status: 'error', error: 'core_katilimci güncelleme hatası: ' + ukErr.message })
            continue
          }
          katilimciId = uKat.id
          katilimciUpdated++
        } else {
          const { data: iKat, error: ikErr } = await adminClient
            .from('core_katilimci')
            .insert({
              aday_id: adayId,
              telefon,
              okul_bilgisi: okulBilgisi,
              egitim_durumu: egitimDurumu,
              kabul_durumu: true,
              kabul_tarihi: new Date().toISOString().split('T')[0],
              program_katilim_durumu: 'AKTIF',
              notlar: '',
            })
            .select().single()

          if (ikErr) {
            results.push({ email: cleanEmail, status: 'error', error: 'core_katilimci ekleme hatası: ' + ikErr.message })
            continue
          }
          katilimciId = iKat.id
          katilimciCreated++

          // Ensure performance row
          const { data: existingPerf } = await adminClient
            .from('core_katilimciperformans')
            .select('id')
            .eq('katilimci_id', katilimciId)
            .maybeSingle()

          if (!existingPerf) {
            await adminClient.from('core_katilimciperformans').insert({
              katilimci_id: katilimciId,
              bireysel_puan: 0, gorev_puani: 0, toplanti_katilim_puani: 0,
              etkilesim_bonus_puani: 0, manuel_puan: 0,
            })
          }
        }

        // 3. auth.users & profiles
        let authUserId: string
        const existingAuthUser = existingAuthMap.get(cleanEmail)

        if (existingAuthUser) {
          authUserId = existingAuthUser.id
          authUsersExisting++
        } else {
          // Cryptographically secure random temporary password (NEVER logged / NEVER reported)
          const randomBytes = new Uint8Array(16)
          crypto.getRandomValues(randomBytes)
          const tempPassword = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('') + 'A1!'

          const { data: newAuth, error: authCreateErr } = await adminClient.auth.admin.createUser({
            email: cleanEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              ad_soyad: fullName,
              role: 'katilimci'
            }
          })

          if (authCreateErr) {
            results.push({ email: cleanEmail, status: 'error', error: 'Auth user oluşturulamadı: ' + authCreateErr.message })
            continue
          }
          authUserId = newAuth.user!.id
          authUsersCreated++
          existingAuthMap.set(cleanEmail, newAuth.user)
        }

        // Upsert profile
        const { error: profErr } = await adminClient.from('profiles').upsert({
          id: authUserId,
          email: cleanEmail,
          role: 'katilimci',
          ad_soyad: fullName,
          telefon: telefon || null,
          core_katilimci_id: katilimciId
        }, { onConflict: 'id' })

        if (profErr) {
          console.warn('Profile upsert warning:', profErr)
        } else {
          profilesCreatedOrUpdated++
        }

        // 4. Password reset email
        let mailSent = false
        let mailErrorMsg: string | null = null

        if (send_reset_mail) {
          const { error: resetErr } = await adminClient.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: 'https://saglikliderleri.markamutfagi.co/reset-password'
          })

          if (resetErr) {
            mailErrorMsg = resetErr.message
            resetMailFailed++
          } else {
            mailSent = true
            resetMailSent++
          }
        }

        results.push({
          email: cleanEmail,
          ad_soyad: fullName,
          status: 'success',
          katilimci_id: katilimciId,
          auth_user_created: !existingAuthUser,
          reset_mail_sent: mailSent,
          mail_error: mailErrorMsg
        })
      }

      return jsonRes(req, {
        ok: true,
        data: {
          summary: {
            total_processed: participants.length,
            aday_created: adayCreated,
            aday_updated: adayUpdated,
            katilimci_created: katilimciCreated,
            katilimci_updated: katilimciUpdated,
            profiles_upserted: profilesCreatedOrUpdated,
            auth_users_created: authUsersCreated,
            auth_users_existing: authUsersExisting,
            reset_mail_sent: resetMailSent,
            reset_mail_failed: resetMailFailed
          },
          results
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: reject_candidate
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'reject_candidate') {
      const { aday_id, force_revert_participant, reason } = payload || {}
      if (!aday_id) return jsonRes(req, { ok: false, error: 'aday_id zorunludur.' }, 400)

      const { data: aday, error: adayErr } = await adminClient
        .from('core_aday')
        .select('*')
        .eq('id', aday_id)
        .maybeSingle()

      if (adayErr || !aday) {
        return jsonRes(req, { ok: false, error: 'Aday bulunamadı.' }, 404)
      }

      // Check if aday has already been converted to a participant
      const { data: existingKatilimci } = await adminClient
        .from('core_katilimci')
        .select('id')
        .eq('aday_id', aday_id)
        .maybeSingle()

      let revertedParticipant = false
      let katilimciId: number | null = null

      if (existingKatilimci) {
        if (!force_revert_participant) {
          return jsonRes(req, {
            ok: false,
            requires_confirmation: true,
            error: 'Bu aday katılımcıya dönüştürülmüş. Reddetmek için katılımcı kaydını geri alma onayı gerekir.'
          }, 400)
        }

        katilimciId = existingKatilimci.id
        revertedParticipant = true

        // 1. Delete participant delivery movements
        await adminClient.from('core_teslimhareketi').delete().eq('katilimci_id', katilimciId)
        
        // 2. Delete participant deliveries
        await adminClient.from('core_teslim').delete().eq('katilimci_id', katilimciId)

        // 3. Delete participant content DNA tests
        await adminClient.from('core_icerikdnatesti').delete().eq('katilimci_id', katilimciId)

        // 4. Delete mentor notes for participant
        await adminClient.from('core_mentornotu').delete().eq('katilimci_id', katilimciId)

        // 5. Delete participant performance record
        await adminClient.from('core_katilimciperformans').delete().eq('katilimci_id', katilimciId)

        // 6. Safe profiles unlink (DO NOT DELETE AUTH USER)
        await adminClient.from('profiles').update({ core_katilimci_id: null }).eq('core_katilimci_id', katilimciId)
        if (aday.eposta) {
          await adminClient.from('profiles').update({ core_katilimci_id: null }).ilike('email', aday.eposta.trim())
        }

        // 7. Delete the core_katilimci record
        const { error: delKatErr } = await adminClient.from('core_katilimci').delete().eq('id', katilimciId)
        if (delKatErr) {
          console.warn('core_katilimci delete warning:', delKatErr)
        }
      }

      // 8. Update core_aday status to REDDEDILDI
      const { error: updateErr } = await adminClient
        .from('core_aday')
        .update({ basvuru_durumu: 'REDDEDILDI' })
        .eq('id', aday_id)

      if (updateErr) {
        return jsonRes(req, {
          ok: false,
          error: 'Aday durumu güncellenemedi: ' + updateErr.message
        }, 500)
      }

      return jsonRes(req, {
        ok: true,
        data: {
          success: true,
          revertedParticipant,
          aday_id,
          katilimci_id: katilimciId,
          durum: 'REDDEDILDI',
          action: 'reject_candidate'
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: approve_candidate
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'approve_candidate') {
      const { aday_id } = payload || {}
      if (!aday_id) return jsonRes(req, { ok: false, error: 'aday_id zorunludur.' }, 400)

      const { data: aday, error: adayErr } = await adminClient
        .from('core_aday')
        .select('*')
        .eq('id', aday_id)
        .maybeSingle()

      if (adayErr || !aday) {
        return jsonRes(req, { ok: false, error: 'Aday bulunamadı.' }, 404)
      }

      const { error: updateErr } = await adminClient
        .from('core_aday')
        .update({ basvuru_durumu: 'ONAYLANDI' })
        .eq('id', aday_id)

      if (updateErr) {
        return jsonRes(req, { ok: false, error: 'Aday durumu güncellenemedi: ' + updateErr.message }, 500)
      }

      const { data: existingKatilimci } = await adminClient
        .from('core_katilimci')
        .select('id')
        .eq('aday_id', aday_id)
        .maybeSingle()

      let katilimci = existingKatilimci
      if (!existingKatilimci) {
        let egitimDurumu: string | null = null
        if (aday.sinif) {
          if (aday.sinif.toLowerCase().includes('mezun')) egitimDurumu = 'Mezun'
          else if (aday.sinif.toLowerCase().includes('sınıf') || aday.sinif.toLowerCase().includes('sinif')) egitimDurumu = 'Okuyor'
        }
        const okulBilgisi = [aday.universite, aday.sinif].filter(Boolean).join(' - ') || null

        const { data: kData, error: kErr } = await adminClient
          .from('core_katilimci')
          .insert({
            aday_id: aday_id,
            telefon: aday.telefon || null,
            okul_bilgisi: okulBilgisi,
            egitim_durumu: egitimDurumu,
            kabul_durumu: true,
            kabul_tarihi: new Date().toISOString().split('T')[0],
            program_katilim_durumu: 'AKTIF',
            notlar: '',
          })
          .select()
          .single()

        if (kErr) {
          return jsonRes(req, { ok: false, error: 'Katılımcı kaydı oluşturulamadı: ' + kErr.message }, 500)
        }
        katilimci = kData

        await adminClient.from('core_katilimciperformans').insert({
          katilimci_id: kData.id,
          bireysel_puan: 0, gorev_puani: 0, toplanti_katilim_puani: 0,
          etkilesim_bonus_puani: 0, manuel_puan: 0,
        })
      }

      return jsonRes(req, {
        ok: true,
        data: {
          success: true,
          aday_id,
          katilimci,
          action: 'approve_candidate'
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: create_mentor
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'create_mentor') {
      const { ad_soyad, eposta, uzmanlik, gecici_sifre } = payload || {}
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
        user_metadata: { ad_soyad, uzmanlik, role: 'mentor' },
      })

      if (authErr) {
        const msg = authErr.message || ''
        if (msg.includes('already registered') || msg.includes('already exists')) {
          return jsonRes(req, { ok: false, error: 'Bu e-posta adresi zaten kayıtlıdır.' }, 409)
        }
        return jsonRes(req, { ok: false, error: 'Auth kullanıcısı oluşturulamadı: ' + authErr.message }, 500)
      }

      const newUserId = authUser.user?.id
      if (!newUserId) return jsonRes(req, { ok: false, error: 'Auth ID alınamadı.' }, 500)

      const { data: mentorData, error: mentorErr } = await adminClient
        .from('core_mentor')
        .insert({ ad_soyad, eposta, uzmanlik: uzmanlik || '', aktif: true })
        .select().single()
      if (mentorErr) return jsonRes(req, { ok: false, error: 'Mentor kaydı oluşturulamadı: ' + mentorErr.message }, 500)

      await adminClient.from('profiles').upsert({
        id: newUserId, email: eposta, role: 'mentor', ad_soyad, core_mentor_id: mentorData.id,
      }, { onConflict: 'id' })

      return jsonRes(req, { ok: true, data: { mentor: mentorData, action: 'create_mentor' } })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: delete_mentor
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'delete_mentor') {
      const { mentor_id } = payload || {}
      if (!mentor_id) return jsonRes(req, { ok: false, error: 'mentor_id zorunludur.' }, 400)

      const now = new Date().toISOString()

      const { error: softDelErr } = await adminClient
        .from('core_mentor')
        .update({ aktif: false, silinme_tarihi: now })
        .eq('id', mentor_id)

      if (softDelErr) {
        console.error('Soft delete mentor error:', softDelErr)
        return jsonRes(req, { ok: false, error: 'Mentor pasif hale getirilemedi: ' + softDelErr.message }, 500)
      }

      await adminClient.from('core_takim').update({ mentor_id: null }).eq('mentor_id', mentor_id)

      return jsonRes(req, { ok: true, data: { mentor_id, action: 'delete_mentor', soft_deleted: true } })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: import_candidates_csv
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'import_candidates_csv') {
      const { csvText, filename } = payload || {}
      if (!csvText || typeof csvText !== 'string') {
        return jsonRes(req, { ok: false, error: 'csvText zorunludur.' }, 400)
      }

      const rawLines = csvText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .filter(l => l.trim().length > 0)

      if (rawLines.length < 2) {
        return jsonRes(req, { ok: false, error: 'CSV dosyası en az bir başlık ve bir veri satırı içermelidir.' }, 400)
      }

      let delimiter = ','
      if (rawLines[0].includes(';') && (rawLines[0].split(';').length > rawLines[0].split(',').length)) {
        delimiter = ';'
      } else if (rawLines[0].includes('\t') && (rawLines[0].split('\t').length > rawLines[0].split(',').length)) {
        delimiter = '\t'
      }

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

    // Standard endpoints
    const authHeader = req.headers.get('Authorization')
    if (!authHeader && !['dry_run_cleanup', 'clean_task_environment', 'clean_dna_tests', 'full_dry_run', 'test_smtp_reset_mail', 'import_and_setup_participants', 'check_csv_candidates_in_db', 'verify_single_email_reset', 'test_generate_link_only', 'send_password_reset_via_brevo', 'reject_candidate', 'approve_candidate', 'create_mentor', 'delete_mentor', 'import_candidates_csv', 'audit_launch_recipients'].includes(action)) {
      return jsonRes(req, { ok: false, error: 'Yetkilendirme başlığı eksik.' }, 401)
    }

    return jsonRes(req, { ok: false, error: 'Bilinmeyen action: ' + action }, 400)

  } catch (err: any) {
    console.error('admin-actions error:', err)
    return jsonRes(req, { ok: false, error: err?.message || String(err) }, 500)
  }
})
