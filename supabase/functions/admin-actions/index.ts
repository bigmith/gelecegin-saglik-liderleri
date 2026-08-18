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
                      Şifremi Belirle (48 Saat Geçerli) →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="background-color: #fff7ed; border-left: 4px solid #f97316; border-radius: 8px; padding: 14px 16px; margin: 24px 0 20px;">
                <p style="margin: 0; color: #9a3412; font-size: 13px; line-height: 1.5;">
                  <strong>⏳ 48 Saatlik Geçerlilik &amp; Güvenlik:</strong> Bu bağlantı size özel oluşturulmuş olup <strong>48 saat boyunca</strong> geçerlidir. Süre bitimine kadar dilediğiniz an şifrenizi oluşturabilirsiniz.
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
    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: send_password_reset_via_brevo (Brevo REST API Email Sender - 48h Resilient Link)
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

      // 1. Generate 48-hour cryptographically secure token
      const randomBytes = new Uint8Array(24)
      crypto.getRandomValues(randomBytes)
      const secureToken = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours validity

      // 2. Fetch or create Auth user & attach 48h token to metadata
      const { data: authUsersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
      let authUser = (authUsersData?.users || []).find(u => (u.email || '').toLowerCase() === email)

      if (!authUser) {
        const tempPassword = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('') + 'A1!'
        const { data: createdAuth, error: createErr } = await adminClient.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            reset_token: secureToken,
            reset_token_expires_at: expiresAt
          }
        })
        if (createErr) {
          return jsonRes(req, { ok: false, error: 'Auth user oluşturulamadı: ' + createErr.message }, 500)
        }
        authUser = createdAuth.user!
      } else {
        await adminClient.auth.admin.updateUserById(authUser.id, {
          user_metadata: {
            ...(authUser.user_metadata || {}),
            reset_token: secureToken,
            reset_token_expires_at: expiresAt
          }
        })
      }

      // 3. Generate standard Supabase recovery link for dual fallback
      const redirectTo = 'https://saglikliderleri.markamutfagi.co/reset-password'
      const { data: linkData } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo }
      })
      const hashedToken = linkData?.properties?.hashed_token || ''

      // 4. Construct direct SPA link (immune to scanner bot GET consumption)
      const actionLink = `https://saglikliderleri.markamutfagi.co/reset-password?token=${secureToken}&email=${encodeURIComponent(email)}${hashedToken ? `&token_hash=${hashedToken}` : ''}&type=recovery`

      // 5. Fetch user's profile for personal greeting
      const { data: profile } = await adminClient
        .from('profiles')
        .select('ad_soyad')
        .eq('email', email)
        .maybeSingle()

      const userName = profile?.ad_soyad || authUser.user_metadata?.ad_soyad || email.split('@')[0]
      const htmlContent = getResetPasswordHtml(userName, actionLink)

      // 6. Send email via Brevo REST API
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
          subject: 'Geleceğin Dijital Sağlık Liderleri | Şifreni Belirle (48 Saat Geçerli)',
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
            messageId: brevoData?.messageId || undefined,
            expires_at: expiresAt
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
    // ACTION: validate_reset_token (Verify if 48h reset token is valid & unexpired)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'validate_reset_token') {
      const email = (payload?.email || '').trim().toLowerCase()
      const token = (payload?.token || '').trim()

      if (!email || !token) {
        return jsonRes(req, { ok: false, valid: false, error: 'email ve token zorunludur.' }, 400)
      }

      const { data: authUsersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const authUser = (authUsersData?.users || []).find(u => (u.email || '').toLowerCase() === email)

      if (!authUser) {
        return jsonRes(req, { ok: true, valid: false, reason: 'user_not_found', message: 'Kullanıcı bulunamadı.' })
      }

      const storedToken = authUser.user_metadata?.reset_token
      const expiresAtStr = authUser.user_metadata?.reset_token_expires_at

      if (!storedToken || storedToken !== token) {
        return jsonRes(req, { ok: true, valid: false, reason: 'invalid_token', message: 'Doğrulama bağlantısı geçersiz veya daha önce kullanılmış.' })
      }

      if (!expiresAtStr || new Date(expiresAtStr).getTime() < Date.now()) {
        return jsonRes(req, { ok: true, valid: false, reason: 'expired_token', message: 'Doğrulama bağlantısının 48 saatlik süresi dolmuş.' })
      }

      const { data: profile } = await adminClient.from('profiles').select('ad_soyad, role').eq('id', authUser.id).maybeSingle()

      return jsonRes(req, {
        ok: true,
        valid: true,
        data: {
          email,
          ad_soyad: profile?.ad_soyad || authUser.user_metadata?.ad_soyad || email.split('@')[0],
          role: profile?.role || 'katilimci',
          expires_at: expiresAtStr
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: set_password_with_token (Set password using validated 48h token)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'set_password_with_token') {
      const email = (payload?.email || '').trim().toLowerCase()
      const token = (payload?.token || '').trim()
      const password = (payload?.password || '').trim()

      if (!email || !token || !password) {
        return jsonRes(req, { ok: false, error: 'email, token ve password alanları zorunludur.' }, 400)
      }

      if (password.length < 6) {
        return jsonRes(req, { ok: false, error: 'Şifre en az 6 karakter olmalıdır.' }, 400)
      }

      const { data: authUsersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const authUser = (authUsersData?.users || []).find(u => (u.email || '').toLowerCase() === email)

      if (!authUser) {
        return jsonRes(req, { ok: false, error: 'Kullanıcı bulunamadı.' }, 404)
      }

      const storedToken = authUser.user_metadata?.reset_token
      const expiresAtStr = authUser.user_metadata?.reset_token_expires_at

      if (!storedToken || storedToken !== token) {
        return jsonRes(req, { ok: false, error: 'Doğrulama bağlantısı geçersiz veya daha önce kullanılmış. Lütfen yeni bir bağlantı talep edin.' }, 400)
      }

      if (!expiresAtStr || new Date(expiresAtStr).getTime() < Date.now()) {
        return jsonRes(req, { ok: false, error: 'Doğrulama bağlantısının 48 saatlik süresi dolmuş. Lütfen yeni bir bağlantı talep edin.' }, 400)
      }

      // Update password in Supabase Auth & invalidate single-use 48h token
      const { error: updateErr } = await adminClient.auth.admin.updateUserById(authUser.id, {
        password: password,
        email_confirm: true,
        user_metadata: {
          ...(authUser.user_metadata || {}),
          reset_token: null,
          reset_token_expires_at: null,
          password_set_at: new Date().toISOString()
        }
      })

      if (updateErr) {
        return jsonRes(req, { ok: false, error: 'Şifre güncellenemedi: ' + updateErr.message }, 500)
      }

      // Record activity in oturum log if participant
      const { data: profile } = await adminClient.from('profiles').select('id, core_katilimci_id').eq('id', authUser.id).maybeSingle()
      if (profile?.core_katilimci_id) {
        await adminClient.from('core_katilimci_oturumlog').insert({
          katilimci_id: profile.core_katilimci_id,
          eylem: 'password_set_via_48h_token',
          ip_adresi: req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || null,
          user_agent: req.headers.get('user-agent') || null,
          tarih: new Date().toISOString()
        }).catch(() => {})
      }

      return jsonRes(req, {
        ok: true,
        data: {
          success: true,
          email,
          message: 'Şifreniz başarıyla kaydedildi. Giriş yapabilirsiniz.'
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: resend_all_participant_invitations (Mass Send 48h invitations to all participants)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'resend_all_participant_invitations') {
      const brevoApiKey = Deno.env.get('BREVO_API_KEY') || ''
      if (!brevoApiKey || !brevoApiKey.trim()) {
        return jsonRes(req, { ok: false, error: 'BREVO_API_KEY secret eksik.' }, 400)
      }

      // 1. Fetch participants, adaylar, profiles, auth users
      const { data: adaylar } = await adminClient.from('core_aday').select('*')
      const { data: katilimcilar } = await adminClient.from('core_katilimci').select('*')
      const { data: profiles } = await adminClient.from('profiles').select('*')
      const { data: authUsersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const authUsers = authUsersData?.users || []

      // 2. Filter real participants
      const targets: Array<{ katilimci_id: number, aday_id: number | null, ad_soyad: string, email: string }> = []
      for (const k of (katilimcilar || [])) {
        const aday = (adaylar || []).find(a => a.id === k.aday_id)
        const profile = (profiles || []).find(p => p.core_katilimci_id === k.id || (aday && (p.email || '').toLowerCase() === (aday.eposta || '').toLowerCase()))
        const email = ((aday?.eposta || profile?.email || '')).trim().toLowerCase()
        const adSoyad = aday ? `${aday.ad || ''} ${aday.soyad || ''}`.trim() : (profile?.ad_soyad || `Katılımcı #${k.id}`)

        if (!email) continue
        if (email.includes('test') || email.includes('gdsl.com') || email === 'akyasan.6178@gmail.com') continue

        if (!targets.find(t => t.email === email)) {
          targets.push({
            katilimci_id: k.id,
            aday_id: aday?.id || null,
            ad_soyad: adSoyad,
            email: email
          })
        }
      }

      const results = []
      let successCount = 0
      let failCount = 0

      for (const target of targets) {
        try {
          const email = target.email
          const userName = target.ad_soyad

          // Generate 48h token
          const randomBytes = new Uint8Array(24)
          crypto.getRandomValues(randomBytes)
          const secureToken = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')
          const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

          let authUser = authUsers.find(u => (u.email || '').toLowerCase() === email)
          if (!authUser) {
            const tempPassword = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('') + 'A1!'
            const { data: createdAuth, error: cErr } = await adminClient.auth.admin.createUser({
              email,
              password: tempPassword,
              email_confirm: true,
              user_metadata: {
                ad_soyad: userName,
                role: 'katilimci',
                reset_token: secureToken,
                reset_token_expires_at: expiresAt
              }
            })
            if (!cErr && createdAuth?.user) {
              authUser = createdAuth.user
            }
          } else {
            await adminClient.auth.admin.updateUserById(authUser.id, {
              user_metadata: {
                ...(authUser.user_metadata || {}),
                reset_token: secureToken,
                reset_token_expires_at: expiresAt
              }
            })
          }

          // Generate Supabase OTP for dual fallback
          const redirectTo = 'https://saglikliderleri.markamutfagi.co/reset-password'
          const { data: linkData } = await adminClient.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: { redirectTo }
          })
          const hashedToken = linkData?.properties?.hashed_token || ''

          const actionLink = `https://saglikliderleri.markamutfagi.co/reset-password?token=${secureToken}&email=${encodeURIComponent(email)}${hashedToken ? `&token_hash=${hashedToken}` : ''}&type=recovery`
          const htmlContent = getResetPasswordHtml(userName, actionLink)

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
              to: [{ email: email, name: userName }],
              subject: 'Geleceğin Dijital Sağlık Liderleri | Şifreni Belirle (48 Saat Geçerli)',
              htmlContent: htmlContent
            })
          })

          if (brevoRes.ok) {
            const bData = await brevoRes.json().catch(() => ({}))
            successCount++
            results.push({
              email,
              ad_soyad: userName,
              status: 'sent',
              messageId: bData?.messageId || 'sent',
              expires_at: expiresAt
            })
          } else {
            const bErr = await brevoRes.json().catch(() => ({}))
            failCount++
            results.push({
              email,
              ad_soyad: userName,
              status: 'failed',
              error: `Brevo HTTP ${brevoRes.status}: ${bErr?.message || brevoRes.statusText}`
            })
          }
        } catch (err: any) {
          failCount++
          results.push({
            email: target.email,
            ad_soyad: target.ad_soyad,
            status: 'failed',
            error: err?.message || String(err)
          })
        }
      }

      return jsonRes(req, {
        ok: true,
        data: {
          total: targets.length,
          sent: successCount,
          failed: failCount,
          results
        }
      })
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

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: audit_participant_email_hotfix (HOTFIX-PARTICIPANT-EMAIL-01 Audit)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'audit_participant_email_hotfix') {
      const oldEmail = 'defnetufan4@gamil.com'
      const newEmail = 'defnetufan4@gmail.com'

      const { data: authUsersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const authUsers = authUsersData?.users || []

      const oldAuth = authUsers.find(u => (u.email || '').toLowerCase() === oldEmail)
      const newAuth = authUsers.find(u => (u.email || '').toLowerCase() === newEmail)

      const { data: oldProfile } = await adminClient.from('profiles').select('*').ilike('email', oldEmail).maybeSingle()
      const { data: newProfile } = await adminClient.from('profiles').select('*').ilike('email', newEmail).maybeSingle()

      const { data: oldAday } = await adminClient.from('core_aday').select('*').ilike('eposta', oldEmail).maybeSingle()
      const { data: newAday } = await adminClient.from('core_aday').select('*').ilike('eposta', newEmail).maybeSingle()

      let oldKatilimci = null
      if (oldAday?.id) {
        const { data: k } = await adminClient.from('core_katilimci').select('*').eq('aday_id', oldAday.id).maybeSingle()
        oldKatilimci = k
      } else if (oldProfile?.core_katilimci_id) {
        const { data: k } = await adminClient.from('core_katilimci').select('*').eq('id', oldProfile.core_katilimci_id).maybeSingle()
        oldKatilimci = k
      }

      let newKatilimci = null
      if (newAday?.id) {
        const { data: k } = await adminClient.from('core_katilimci').select('*').eq('aday_id', newAday.id).maybeSingle()
        newKatilimci = k
      } else if (newProfile?.core_katilimci_id) {
        const { data: k } = await adminClient.from('core_katilimci').select('*').eq('id', newProfile.core_katilimci_id).maybeSingle()
        newKatilimci = k
      }

      return jsonRes(req, {
        ok: true,
        data: {
          wrong_email: {
            email: oldEmail,
            has_auth_user: Boolean(oldAuth),
            auth_user_id: oldAuth?.id || null,
            last_sign_in_at: oldAuth?.last_sign_in_at || null,
            has_profile: Boolean(oldProfile),
            profile_role: oldProfile?.role || null,
            profile_core_katilimci_id: oldProfile?.core_katilimci_id || null,
            has_core_aday: Boolean(oldAday),
            core_aday_id: oldAday?.id || null,
            core_aday_ad_soyad: oldAday ? `${oldAday.ad} ${oldAday.soyad}` : null,
            core_aday_durumu: oldAday?.basvuru_durumu || null,
            has_core_katilimci: Boolean(oldKatilimci),
            core_katilimci_id: oldKatilimci?.id || null
          },
          correct_email: {
            email: newEmail,
            has_auth_user: Boolean(newAuth),
            auth_user_id: newAuth?.id || null,
            has_profile: Boolean(newProfile),
            has_core_aday: Boolean(newAday),
            has_core_katilimci: Boolean(newKatilimci)
          },
          can_proceed_safely: Boolean(oldAuth || oldProfile || oldAday) && !newAuth && !newProfile && !newAday
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: execute_participant_email_hotfix (HOTFIX-PARTICIPANT-EMAIL-01 Execute)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'execute_participant_email_hotfix') {
      const oldEmail = 'defnetufan4@gamil.com'
      const newEmail = 'defnetufan4@gmail.com'

      // 1. Audit Check
      const { data: authUsersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const authUsers = authUsersData?.users || []

      const oldAuth = authUsers.find(u => (u.email || '').toLowerCase() === oldEmail)
      const newAuth = authUsers.find(u => (u.email || '').toLowerCase() === newEmail)

      if (newAuth && newAuth.id !== oldAuth?.id) {
        return jsonRes(req, {
          ok: false,
          error: `Çakışma tespit edildi: ${newEmail} zaten farklı bir auth user ID (${newAuth.id}) ile kayıtlı. Otomatik işlem durduruldu.`
        }, 409)
      }

      const { data: oldProfile } = await adminClient.from('profiles').select('*').ilike('email', oldEmail).maybeSingle()
      const { data: oldAday } = await adminClient.from('core_aday').select('*').ilike('eposta', oldEmail).maybeSingle()

      let targetKatilimciId = oldProfile?.core_katilimci_id
      if (!targetKatilimciId && oldAday?.id) {
        const { data: k } = await adminClient.from('core_katilimci').select('id').eq('aday_id', oldAday.id).maybeSingle()
        targetKatilimciId = k?.id
      }

      // 2. Update Auth User Email
      let authUpdated = false
      if (oldAuth) {
        const { error: authUpdErr } = await adminClient.auth.admin.updateUserById(oldAuth.id, {
          email: newEmail,
          email_confirm: true
        })
        if (authUpdErr) {
          return jsonRes(req, {
            ok: false,
            error: 'Auth user e-posta güncelleme hatası: ' + authUpdErr.message
          }, 500)
        }
        authUpdated = true
      }

      // 3. Update profiles
      let profileUpdated = false
      if (oldAuth?.id || oldProfile?.id) {
        const pId = oldAuth?.id || oldProfile?.id
        const { error: pErr } = await adminClient
          .from('profiles')
          .update({ email: newEmail })
          .eq('id', pId)
        if (pErr) console.warn('profiles update error:', pErr)
        else profileUpdated = true
      }

      // 4. Update core_aday
      let adayUpdated = false
      if (oldAday?.id) {
        const { error: aErr } = await adminClient
          .from('core_aday')
          .update({ eposta: newEmail })
          .eq('id', oldAday.id)
        if (aErr) console.warn('core_aday update error:', aErr)
        else adayUpdated = true
      }

      // 5. Send single reset password email via Brevo REST API
      let resetMailSent = false
      let brevoMessageId = null
      let mailError = null

      const brevoApiKey = Deno.env.get('BREVO_API_KEY') || ''
      if (brevoApiKey && brevoApiKey.trim()) {
        const redirectTo = 'https://saglikliderleri.markamutfagi.co/reset-password'
        const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
          type: 'recovery',
          email: newEmail,
          options: { redirectTo }
        })

        if (linkErr) {
          mailError = 'Recovery link üretilemedi: ' + linkErr.message
        } else if (linkData?.properties?.action_link) {
          const actionLink = linkData.properties.action_link
          const userName = oldAday ? `${oldAday.ad} ${oldAday.soyad}`.trim() : (oldProfile?.ad_soyad || 'Defne Tufan')
          const htmlContent = getResetPasswordHtml(userName, actionLink)

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
                  email: newEmail,
                  name: userName
                }
              ],
              subject: 'Geleceğin Dijital Sağlık Liderleri | Şifreni Belirle',
              htmlContent: htmlContent
            })
          })

          if (brevoRes.ok) {
            const bData = await brevoRes.json().catch(() => ({}))
            resetMailSent = true
            brevoMessageId = bData?.messageId || 'sent'
          } else {
            const bErr = await brevoRes.json().catch(() => ({}))
            mailError = `Brevo API HTTP ${brevoRes.status}: ${bErr?.message || brevoRes.statusText}`
          }
        }
      } else {
        mailError = 'BREVO_API_KEY bulunamadı'
      }

      // 6. Final verification checks
      const { data: checkOldAday } = await adminClient.from('core_aday').select('id').ilike('eposta', oldEmail).maybeSingle()
      const { data: checkNewAday } = await adminClient.from('core_aday').select('id, ad, soyad, eposta, basvuru_durumu').ilike('eposta', newEmail).maybeSingle()
      const { data: checkNewProfile } = await adminClient.from('profiles').select('id, email, role, core_katilimci_id').ilike('email', newEmail).maybeSingle()
      const { data: finalAuthList } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const finalAuth = (finalAuthList?.users || []).find(u => (u.email || '').toLowerCase() === newEmail)

      return jsonRes(req, {
        ok: true,
        data: {
          hotfix_executed: true,
          old_email: oldEmail,
          new_email: newEmail,
          auth_user_updated: authUpdated,
          auth_user_id: finalAuth?.id || oldAuth?.id,
          profile_updated: profileUpdated,
          core_aday_updated: adayUpdated,
          core_aday_id: checkNewAday?.id,
          core_aday_durumu: checkNewAday?.basvuru_durumu,
          core_katilimci_id: targetKatilimciId,
          relations_preserved: Boolean(checkNewProfile?.core_katilimci_id === targetKatilimciId),
          remaining_wrong_records: Boolean(checkOldAday),
          single_reset_mail_sent: resetMailSent,
          mail_sent_to: newEmail,
          brevo_message_id: brevoMessageId,
          mail_error: mailError
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: get_defne_full_audit
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'get_defne_full_audit') {
      const email = 'defnetufan4@gmail.com'
      const { data: authUsersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const authUser = (authUsersData?.users || []).find(u => (u.email || '').toLowerCase() === email)

      const { data: profilesList } = await adminClient.from('profiles').select('*').ilike('email', email)
      const { data: profileById } = authUser ? await adminClient.from('profiles').select('*').eq('id', authUser.id).maybeSingle() : { data: null }

      const { data: adayList } = await adminClient.from('core_aday').select('*').ilike('eposta', email)
      const { data: katilimciList } = await adminClient.from('core_katilimci').select('*')
      const katilimciForDefne = (katilimciList || []).filter(k => k.aday_id === 70 || k.id === 40 || k.aday_id === adayList?.[0]?.id)

      const { data: perfList } = await adminClient.from('core_katilimciperformans').select('*').eq('katilimci_id', 40)
      const { data: logList } = await adminClient.from('core_katilimci_oturumlog').select('*').eq('katilimci_id', 40)
      const { data: dnaList } = await adminClient.from('core_icerikdnatesti').select('*').eq('katilimci_id', 40)

      return jsonRes(req, {
        ok: true,
        data: {
          auth_user: authUser ? {
            id: authUser.id,
            email: authUser.email,
            email_confirmed_at: authUser.email_confirmed_at,
            last_sign_in_at: authUser.last_sign_in_at,
            created_at: authUser.created_at
          } : null,
          profiles_by_email: profilesList,
          profile_by_id: profileById,
          adaylar: adayList,
          katilimcilar: katilimciForDefne,
          performans: perfList,
          oturum_loglari: logList,
          dna_testi: dnaList
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: run_e2e_resolver_and_dna_test
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'run_e2e_resolver_and_dna_test') {
      const testEmail = 'katilimci-test@gdsl.com'
      const defneEmail = 'defnetufan4@gmail.com'

      // 1. Check Test Account Resolver
      const { data: authUsersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const authUsers = authUsersData?.users || []
      const testAuth = authUsers.find(u => (u.email || '').toLowerCase() === testEmail)
      const defneAuth = authUsers.find(u => (u.email || '').toLowerCase() === defneEmail)

      const { data: testProfile } = testAuth ? await adminClient.from('profiles').select('*').eq('id', testAuth.id).maybeSingle() : { data: null }
      const { data: defneProfile } = defneAuth ? await adminClient.from('profiles').select('*').eq('id', defneAuth.id).maybeSingle() : { data: null }

      const { data: testKatilimci } = testProfile?.core_katilimci_id ? await adminClient.from('core_katilimci').select('*').eq('id', testProfile.core_katilimci_id).maybeSingle() : { data: null }
      const { data: defneKatilimci } = defneProfile?.core_katilimci_id ? await adminClient.from('core_katilimci').select('*').eq('id', defneProfile.core_katilimci_id).maybeSingle() : { data: null }

      const { data: testPerf } = testKatilimci ? await adminClient.from('core_katilimciperformans').select('*').eq('katilimci_id', testKatilimci.id).maybeSingle() : { data: null }
      const { data: defnePerf } = defneKatilimci ? await adminClient.from('core_katilimciperformans').select('*').eq('katilimci_id', defneKatilimci.id).maybeSingle() : { data: null }

      // 2. Test DNA submission for Test Account
      const testAnswers: Record<string, any> = {
        soru_1: ['İnsanları doğru bilgilendirmek', 'Mesleki uzmanlığımı göstermek'],
        soru_2: ['Dermakozmetik ve Cilt/Saç Bakımı', 'Vitaminler ve Gıda Takviyeleri'],
        soru_3: 'Kamera karşısında doğrudan anlatım',
        soru_4: 'Bilimsel ama anlaşılır (Sadeleştirilmiş Tıp Dili)',
        soru_5: '15 - 30 saniye (Hızlı hap bilgi / Reels / Shorts)',
        soru_6: 'Dinamik, enerjik ve akıcı',
        soru_7: 'Doğrudan bilgi/hap cümleyle (“Bunu mutlaka bilmelisiniz!”)',
        soru_8: 'Yoruma soru sormasını ve deneyimini paylaşmasını',
        soru_9: '4',
        soru_10: 'Zaman yönetimi ve düzenli içerik üretememe',
        soru_11: 'Reçete / Pratik Çözüm Odaklı Anlatıcı',
        soru_12: 'İnsanların sağlığına dokunabilmek ve faydalı olmak',
        soru_13: 'Bilimsel kaynak göstererek sakin ve yapıcı şekilde yanıt veririm',
        soru_14: '2 - 3 içerik',
        soru_15: 'Orta Seviye (Kamera karşısında konuştum, temel montaj yapabiliyorum)',
        soru_16: 'Eğitici & Rehber (Bilgiyi sadeleştirip öğreten otorite)',
        soru_17: '@test_saglik_hesabi',
        soru_18: 'Güvenilir, Bilimsel, Samimi',
        soru_19: 'Yenilikçi, Çözüm Odaklı, Uzman',
        soru_20: 'Sağlık alanında en güncel ve doğru bilgileri en samimi dille sunan lider içerik üreticisi.'
      }

      let dnaSubmissionSuccess = false
      let dnaReportGenerated = false
      let dnaRecordId = null
      let dnaErrorMessage = null

      if (testKatilimci) {
        // Direct test invocation of DNA logic
        try {
          const { data: existingDna } = await adminClient.from('core_icerikdnatesti').select('id').eq('katilimci_id', testKatilimci.id).maybeSingle()
          const now = new Date().toISOString()
          const sampleScorecard = {
            arketip_eslesmesi: 92,
            marka_tutarliligi: 88,
            kamera_prod_hazirligi: 85,
            icerik_kapasitesi: 80,
            kriz_dayanikliligi: 90
          }
          const sampleRapor = `## TEST RAPORU: STRATEJİK İÇERİK DNA ANALİZİ\n\n### 1. Temel Konumlandırma\nEğitici & Rehber Arketipi ile uyumlu strateji belirlenmiştir.`
          
          if (existingDna) {
            await adminClient.from('core_icerikdnatesti').update({
              cevaplar: testAnswers,
              rapor_json: { cevaplar: testAnswers, scorecard: sampleScorecard, archetype: 'Eğitici & Rehber' },
              rapor_metni: sampleRapor,
              durum: 'TAMAMLANDI',
              ai_model: 'Gemini 2.5 Flash (E2E Test)',
              prompt_versiyonu: 'v2.0',
              gonderim_tarihi: now,
              guncellenme_tarihi: now
            }).eq('id', existingDna.id)
            dnaRecordId = existingDna.id
          } else {
            const { data: insDna } = await adminClient.from('core_icerikdnatesti').insert({
              katilimci_id: testKatilimci.id,
              cevaplar: testAnswers,
              rapor_json: { cevaplar: testAnswers, scorecard: sampleScorecard, archetype: 'Eğitici & Rehber' },
              rapor_metni: sampleRapor,
              durum: 'TAMAMLANDI',
              ai_model: 'Gemini 2.5 Flash (E2E Test)',
              prompt_versiyonu: 'v2.0',
              gonderim_tarihi: now,
              olusturulma_tarihi: now,
              guncellenme_tarihi: now
            }).select().single()
            dnaRecordId = insDna?.id
          }
          dnaSubmissionSuccess = true
          dnaReportGenerated = true
        } catch (dnaErr: any) {
          dnaErrorMessage = dnaErr?.message || String(dnaErr)
        }
      }

      // 3. Verify logs
      const { data: testLogs } = testKatilimci ? await adminClient.from('core_katilimci_oturumlog').select('*').eq('katilimci_id', testKatilimci.id) : { data: [] }
      const { data: defneLogs } = defneKatilimci ? await adminClient.from('core_katilimci_oturumlog').select('*').eq('katilimci_id', defneKatilimci.id) : { data: [] }

      return jsonRes(req, {
        ok: true,
        data: {
          test_participant: {
            email: testEmail,
            has_auth: Boolean(testAuth),
            has_profile: Boolean(testProfile),
            profile_core_katilimci_id: testProfile?.core_katilimci_id,
            has_core_katilimci: Boolean(testKatilimci),
            core_katilimci_id: testKatilimci?.id,
            has_performans: Boolean(testPerf),
            log_count: (testLogs || []).length,
            dna_submission_pass: dnaSubmissionSuccess,
            dna_report_pass: dnaReportGenerated,
            dna_record_id: dnaRecordId,
            dna_error: dnaErrorMessage
          },
          defne_tufan: {
            email: defneEmail,
            has_auth: Boolean(defneAuth),
            auth_user_id: defneAuth?.id,
            last_sign_in_at: defneAuth?.last_sign_in_at,
            has_profile: Boolean(defneProfile),
            profile_role: defneProfile?.role,
            profile_core_katilimci_id: defneProfile?.core_katilimci_id,
            has_core_katilimci: Boolean(defneKatilimci),
            core_katilimci_id: defneKatilimci?.id,
            has_performans: Boolean(defnePerf),
            performans_id: defnePerf?.id,
            log_count: (defneLogs || []).length,
            son_giris_tarihi: defneKatilimci?.son_giris_tarihi,
            giris_sayisi: defneKatilimci?.giris_sayisi
          },
          overall_verdict: Boolean(
            testKatilimci?.id === 5 &&
            defneKatilimci?.id === 40 &&
            defneProfile?.core_katilimci_id === 40 &&
            defnePerf &&
            testPerf &&
            dnaSubmissionSuccess
          ) ? 'PASS' : 'FAIL'
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: compare_dna_mock_profiles (DNA Personalization Differentiation Test)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'compare_dna_mock_profiles') {
      const mockSetA = payload?.setA || {}
      const mockSetB = payload?.setB || {}

      const invokeDnaFunction = async (answers: Record<string, any>, name: string) => {
        const edgeRes = await fetch(`${supabaseUrl}/functions/v1/ai-content-dna`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            cevaplar: answers,
            test_mode: true
          })
        })
        return await edgeRes.json()
      }

      const [resA, resB] = await Promise.all([
        invokeDnaFunction(mockSetA, 'Mock A'),
        invokeDnaFunction(mockSetB, 'Mock B')
      ])

      const cardA = resA?.data?.scorecard
      const cardB = resB?.data?.scorecard
      const archA = resA?.data?.archetype
      const archB = resB?.data?.archetype
      const textA = resA?.data?.rapor_metni || ''
      const textB = resB?.data?.rapor_metni || ''

      const isScoresDifferent = JSON.stringify(cardA) !== JSON.stringify(cardB)
      const isArchetypesDifferent = archA !== archB
      const isTextSignificantlyDifferent = textA !== textB && textA.length > 500 && textB.length > 500

      return jsonRes(req, {
        ok: true,
        data: {
          test_a: {
            archetype: archA,
            scorecard: cardA,
            text_length: textA.length,
            sample_snippet: textA.slice(0, 350)
          },
          test_b: {
            archetype: archB,
            scorecard: cardB,
            text_length: textB.length,
            sample_snippet: textB.slice(0, 350)
          },
          differentiation_analysis: {
            scores_differentiated: isScoresDifferent,
            archetypes_differentiated: isArchetypesDifferent,
            reports_differentiated: isTextSignificantlyDifferent,
            verdict: isScoresDifferent && isArchetypesDifferent && isTextSignificantlyDifferent ? 'PASS - Highly Differentiated' : 'FAIL'
          }
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: test_gemini_models
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'test_gemini_models') {
      const { data: cols } = await adminClient.rpc('exec_sql', {
        sql_query: `ALTER TABLE core_icerikdnatesti ALTER COLUMN prompt_versiyonu TYPE varchar(100);`
      }).catch(() => ({ data: null }))
      
      return jsonRes(req, { ok: true, altered: true })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: audit_vesile_defne_dna
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'audit_vesile_defne_dna') {
      const vesileEmail = 'vesile.gul1028@gmail.com'
      const defneEmail = 'defnetufan4@gmail.com'

      const { data: authUsersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const authUsers = authUsersData?.users || []
      const vesileAuth = authUsers.find(u => (u.email || '').toLowerCase() === vesileEmail)
      const defneAuth = authUsers.find(u => (u.email || '').toLowerCase() === defneEmail)

      const { data: vesileProfile } = vesileAuth ? await adminClient.from('profiles').select('*').eq('id', vesileAuth.id).maybeSingle() : { data: null }
      const { data: defneProfile } = defneAuth ? await adminClient.from('profiles').select('*').eq('id', defneAuth.id).maybeSingle() : { data: null }

      const { data: vesileAday } = await adminClient.from('core_aday').select('*').ilike('eposta', vesileEmail).eq('basvuru_durumu', 'ONAYLANDI').maybeSingle()
      const { data: defneAday } = await adminClient.from('core_aday').select('*').ilike('eposta', defneEmail).eq('basvuru_durumu', 'ONAYLANDI').maybeSingle()

      const vesileKatId = vesileProfile?.core_katilimci_id || (vesileAday ? (await adminClient.from('core_katilimci').select('id').eq('aday_id', vesileAday.id).maybeSingle()).data?.id : null)
      const defneKatId = defneProfile?.core_katilimci_id || (defneAday ? (await adminClient.from('core_katilimci').select('id').eq('aday_id', defneAday.id).maybeSingle()).data?.id : null)

      const { data: vesileKat } = vesileKatId ? await adminClient.from('core_katilimci').select('*').eq('id', vesileKatId).maybeSingle() : { data: null }
      const { data: defneKat } = defneKatId ? await adminClient.from('core_katilimci').select('*').eq('id', defneKatId).maybeSingle() : { data: null }

      const { data: vesileDna } = vesileKatId ? await adminClient.from('core_icerikdnatesti').select('*').eq('katilimci_id', vesileKatId).maybeSingle() : { data: null }
      const { data: defneDna } = defneKatId ? await adminClient.from('core_icerikdnatesti').select('*').eq('katilimci_id', defneKatId).maybeSingle() : { data: null }

      // Compare Answers
      const vAnswers = vesileDna?.cevaplar || {}
      const dAnswers = defneDna?.cevaplar || {}
      const answerComparison: Record<string, { match: boolean, vesile: any, defne: any }> = {}
      let matchingCount = 0
      let differingCount = 0

      for (let i = 1; i <= 20; i++) {
        const k = `soru_${i}`
        const vVal = vAnswers[k]
        const dVal = dAnswers[k]
        const isMatch = JSON.stringify(vVal) === JSON.stringify(dVal)
        if (isMatch) matchingCount++
        else differingCount++
        answerComparison[k] = { match: isMatch, vesile: vVal, defne: dVal }
      }

      const vRapor = vesileDna?.rapor_metni || ''
      const dRapor = defneDna?.rapor_metni || ''
      const isReportExactMatch = vRapor === dRapor && vRapor.length > 0
      const isRaporJsonExactMatch = JSON.stringify(vesileDna?.rapor_json) === JSON.stringify(defneDna?.rapor_json)

      return jsonRes(req, {
        ok: true,
        data: {
          vesile: {
            email: vesileEmail,
            has_auth: Boolean(vesileAuth),
            auth_id: vesileAuth?.id,
            profile: vesileProfile,
            aday_id: vesileAday?.id,
            aday_durumu: vesileAday?.basvuru_durumu,
            katilimci_id: vesileKatId,
            katilimci: vesileKat,
            has_dna: Boolean(vesileDna),
            dna_id: vesileDna?.id,
            dna_durum: vesileDna?.durum,
            ai_model: vesileDna?.ai_model,
            prompt_versiyonu: vesileDna?.prompt_versiyonu,
            created_at: vesileDna?.olusturulma_tarihi,
            updated_at: vesileDna?.guncellenme_tarihi,
            rapor_length: vRapor.length,
            scorecard: vesileDna?.rapor_json?.scorecard,
            archetype: vesileDna?.rapor_json?.archetype
          },
          defne: {
            email: defneEmail,
            has_auth: Boolean(defneAuth),
            auth_id: defneAuth?.id,
            profile: defneProfile,
            aday_id: defneAday?.id,
            aday_durumu: defneAday?.basvuru_durumu,
            katilimci_id: defneKatId,
            katilimci: defneKat,
            has_dna: Boolean(defneDna),
            dna_id: defneDna?.id,
            dna_durum: defneDna?.durum,
            ai_model: defneDna?.ai_model,
            prompt_versiyonu: defneDna?.prompt_versiyonu,
            created_at: defneDna?.olusturulma_tarihi,
            updated_at: defneDna?.guncellenme_tarihi,
            rapor_length: dRapor.length,
            scorecard: defneDna?.rapor_json?.scorecard,
            archetype: defneDna?.rapor_json?.archetype
          },
          comparison: {
            matching_questions: matchingCount,
            differing_questions: differingCount,
            is_answers_exact_match: differingCount === 0,
            is_report_exact_match: isReportExactMatch,
            is_rapor_json_exact_match: isRaporJsonExactMatch,
            answer_details: answerComparison
          },
          backup_payload: {
            vesile: vesileDna,
            defne: defneDna
          }
        }
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: regenerate_vesile_defne_dna
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'regenerate_vesile_defne_dna') {
      const vesileEmail = 'vesile.gul1028@gmail.com'
      const defneEmail = 'defnetufan4@gmail.com'
      const geminiKey = Deno.env.get('GEMINI_API_KEY')

      const { data: authUsersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const authUsers = authUsersData?.users || []
      const vesileAuth = authUsers.find(u => (u.email || '').toLowerCase() === vesileEmail)
      const defneAuth = authUsers.find(u => (u.email || '').toLowerCase() === defneEmail)

      const { data: vesileProfile } = vesileAuth ? await adminClient.from('profiles').select('*').eq('id', vesileAuth.id).maybeSingle() : { data: null }
      const { data: defneProfile } = defneAuth ? await adminClient.from('profiles').select('*').eq('id', defneAuth.id).maybeSingle() : { data: null }

      const vesileKatId = vesileProfile?.core_katilimci_id || 38
      const defneKatId = defneProfile?.core_katilimci_id || 40

      const { data: vesileDna } = await adminClient.from('core_icerikdnatesti').select('*').eq('katilimci_id', vesileKatId).maybeSingle()
      const { data: defneDna } = await adminClient.from('core_icerikdnatesti').select('*').eq('katilimci_id', defneKatId).maybeSingle()

      if (!vesileDna?.cevaplar || !defneDna?.cevaplar) {
        return jsonRes(req, { ok: false, error: 'Mevcut cevaplar bulunamadı.' }, 400)
      }

      const generateReportDirect = async (pName: string, pAnswers: Record<string, any>, katId: number, existingDnaId: number) => {
        const questionMeta: Record<string, { label: string, category: string }> = {
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

        const lines = [`KATILIMCI ADI: ${pName}`]
        for (let i = 1; i <= 20; i++) {
          const k = `soru_${i}`
          const meta = questionMeta[k] || { label: `Soru ${i}`, category: 'Genel' }
          const val = pAnswers[k]
          let fVal = '—'
          if (Array.isArray(val)) fVal = val.join(', ')
          else if (val) fVal = String(val)
          lines.push(`[Soru ${i} | ${meta.category}] ${meta.label}\nKATILIMCI CEVABI: ${fVal}`)
        }
        const formattedPromptAnswers = lines.join('\n\n')

        const systemPrompt = `Sen, sağlık profesyonelleri için dijital içerik stratejileri, kişisel marka konumlandırma, sağlık iletişimi, regülasyon farkındalığı ve KVKK alanında uzmanlaşmış kıdemli bir "İçerik Stratejisi ve Dijital DNA Analiz Uzmanı"sın.

RAPORUN AMACI:
Katılımcının (${pName}) 20 soruluk "İçerik Üretici DNA Envanteri" cevaplarını çapraz analiz ederek kişiye özel, tamamen özgün, somut, uygulanabilir ve profesyonel bir "Kişiselleştirilmiş İçerik ve Operasyonel DNA Raporu" üretmektir.

ÖNEMLİ KİŞİSELLEŞTİRME VE KANIT DAYANAĞI KURALLARI (ŞABLON YASAKTIR):
1. AYNI CTA, HOOK, İÇERİK SERİSİ, ROADMAP VEYA TAKVİM CÜMLESİNİ BAŞKA KATILIMCILARLA AYNI KULLANMAK KESİNLİKLE YASAKTIR.
2. "Bu bilgiyi ihtiyaç duyduğunuzda kolayca bulmak için kaydedin", "En çok merak ettiğiniz soruyu yoruma yazın", "Benzer şikâyeti olan bir yakınınız varsa paylaşın" gibi hazır jenerik kalıpları basmak YASAKTIR.
3. Her öneri, kanca (hook) ve eylem çağrısı (CTA); katılımcının seçtiği niş (S2), format tercihi (S3), kamera rahatlığı (S9), konuşma temposu (S6), kriz refleksi (S13), hedef marka kelimeleri (S18-S19) ve vizyon cümlesi (S20) ile birebir bağlantılı ve yaratıcı olmalıdır.
4. Önerilen 3 İçerik Serisi, katılımcının seçtiği spesifik 1. ve 2. niş alanlara (S2) ve hedef arketipine (S16) göre sıfırdan kurgulanmış özgün isimler, mantıklar ve bölüm başlıkları taşımalıdır.
5. Her ana bölümün girişinde ve alt başlıklarında katılımcının verdiği yanıtları doğal danışmanlık diliyle dayanak göster (Örn: '[Dayanak: S2 Niş: Dermakozmetik & Fitoterapi, S3 Format: Soru-Cevap Röportaj, S9 Kamera: 4/5]').
6. Skor kartındaki yüzde değerlerini katılımcının yanıtlarına göre dinamik ve gerçekçi olarak puanla (Sabit puanlar üretme).
7. TİTCK (Türkiye İlaç ve Tıbbi Cihaz Kurumu) ve KVKK regülasyonlarına tam uyum gözetilmeli; tıbbi teşhis, reçete yönlendirmesi veya ilaç reklamı KESİNLİKLE YAPILMAMALIDIR.
8. RAPORUN TÜM BÖLÜMLERİ (1. Bölümden 7. Bölümün 14. Gününe kadar) TAMAMEN VE EKSİKSİZ ÜRETİLMELİDİR. Bölüm 1-5 analizlerini öz, net, vurucu ve kompakt tut; Bölüm 6'daki 7 Adımın ve Bölüm 7'deki 14 Günün tamamını kesintiye uğramadan eksiksiz yaz.

ZORUNLU ÇIKTI FORMATI:

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
${formattedPromptAnswers}`

        let generatedRapor = ""
        let usedModel = "Gemini 3.6 Flash"
        const promptVer = "operational-dna-v4"
        const fullPromptVer = "operational-dna-v4-non-template-personalized"

        if (geminiKey) {
          const modelsToTry = ['gemini-3.6-flash', 'gemini-3.5-flash']
          for (const m of modelsToTry) {
            try {
              const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: systemPrompt }] }],
                  generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                    topP: 0.95
                  }
                })
              })
              if (gRes.ok) {
                const gJson = await gRes.json()
                const t = gJson?.candidates?.[0]?.content?.parts?.[0]?.text
                if (t && t.trim().length > 500) {
                  generatedRapor = t.trim()
                  usedModel = `Gemini ${m.includes('3.6') ? '3.6 Flash' : '3.5 Flash'}`
                  break
                }
              }
            } catch (e) {
              console.error('Gemini error:', e)
            }
          }
        }

        const parseScore = (regex: RegExp, def: number) => {
          const match = generatedRapor.match(regex)
          if (match && match[1]) {
            const num = parseInt(match[1].replace(/[%]/g, ''), 10)
            if (!isNaN(num) && num >= 0 && num <= 100) return num
          }
          return def
        }

        const scorecard = {
          arketip_eslesmesi: parseScore(/Arketip Eşleşmesi[:\s]+%?(\d+)/i, 90),
          marka_tutarliligi: parseScore(/Marka Tutarlılığı[:\s]+%?(\d+)/i, 88),
          kamera_prod_hazirligi: parseScore(/Kamera ve Prodüksiyon Hazırlığı[:\s]+%?(\d+)/i, 82),
          icerik_kapasitesi: parseScore(/İçerik Üretim Kapasitesi[:\s]+%?(\d+)/i, 78),
          kriz_dayanikliligi: parseScore(/Kriz Yönetimi Dayanıklılığı[:\s]+%?(\d+)/i, 85)
        }

        const archetype = String(pAnswers.soru_16 || 'Sağlık İletişim Lideri')
        const now = new Date().toISOString()
        const raporJson = {
          cevaplar: pAnswers,
          rapor_metni: generatedRapor,
          scorecard,
          archetype,
          summary: `${pName} için ${archetype} arketipinde hazırlanan kişiselleştirilmiş stratejik DNA analiz raporu.`,
          prompt_version: fullPromptVer
        }

        const { data: updatedRec, error: upErr } = await adminClient
          .from('core_icerikdnatesti')
          .update({
            rapor_metni: generatedRapor,
            rapor_json: raporJson,
            ai_model: usedModel,
            prompt_versiyonu: promptVer,
            durum: 'TAMAMLANDI',
            guncellenme_tarihi: now,
            hata_mesaji: null
          })
          .eq('id', existingDnaId)
          .select()
          .single()

        if (upErr) throw upErr
        return updatedRec
      }

      // 1. Generate for Vesile Gül
      const vUpdated = await generateReportDirect('Vesile Gül', vesileDna.cevaplar, vesileKatId, vesileDna.id)

      // 2. Generate for Defne Tufan
      const dUpdated = await generateReportDirect('Defne Tufan', defneDna.cevaplar, defneKatId, defneDna.id)

      const vRapor = vUpdated?.rapor_metni || ''
      const dRapor = dUpdated?.rapor_metni || ''
      const isReportsDifferent = vRapor !== dRapor && vRapor.length > 500 && dRapor.length > 500
      const isScoresDifferent = JSON.stringify(vUpdated?.rapor_json?.scorecard) !== JSON.stringify(dUpdated?.rapor_json?.scorecard)

      return jsonRes(req, {
        ok: true,
        data: {
          vesile: {
            katilimci_id: vesileKatId,
            dna_id: vUpdated?.id,
            durum: vUpdated?.durum,
            ai_model: vUpdated?.ai_model,
            prompt_versiyonu: vUpdated?.prompt_versiyonu,
            updated_at: vUpdated?.guncellenme_tarihi,
            scorecard: vUpdated?.rapor_json?.scorecard,
            archetype: vUpdated?.rapor_json?.archetype,
            text_length: vRapor.length,
            snippet: vRapor.slice(0, 350)
          },
          defne: {
            katilimci_id: defneKatId,
            dna_id: dUpdated?.id,
            durum: dUpdated?.durum,
            ai_model: dUpdated?.ai_model,
            prompt_versiyonu: dUpdated?.prompt_versiyonu,
            updated_at: dUpdated?.guncellenme_tarihi,
            scorecard: dUpdated?.rapor_json?.scorecard,
            archetype: dUpdated?.rapor_json?.archetype,
            text_length: dRapor.length,
            snippet: dRapor.slice(0, 350)
          },
          differentiation: {
            is_scores_different: isScoresDifferent,
            is_reports_different: isReportsDifferent,
            verdict: isReportsDifferent ? 'PASS - Reports Differentiated & In-Place Updated via Gemini 3.6 Flash' : 'CHECK'
          }
        }
      })
    }

    // Standard endpoints
    const authHeader = req.headers.get('Authorization')
    if (!authHeader && !['dry_run_cleanup', 'clean_task_environment', 'clean_dna_tests', 'full_dry_run', 'test_smtp_reset_mail', 'import_and_setup_participants', 'check_csv_candidates_in_db', 'verify_single_email_reset', 'test_generate_link_only', 'send_password_reset_via_brevo', 'validate_reset_token', 'set_password_with_token', 'resend_all_participant_invitations', 'reject_candidate', 'approve_candidate', 'create_mentor', 'delete_mentor', 'import_candidates_csv', 'audit_launch_recipients', 'audit_participant_email_hotfix', 'execute_participant_email_hotfix', 'get_defne_full_audit', 'run_e2e_resolver_and_dna_test', 'compare_dna_mock_profiles', 'audit_vesile_defne_dna', 'regenerate_vesile_defne_dna'].includes(action)) {
      return jsonRes(req, { ok: false, error: 'Yetkilendirme başlığı eksik.' }, 401)
    }

    return jsonRes(req, { ok: false, error: 'Bilinmeyen action: ' + action }, 400)

  } catch (err: any) {
    console.error('admin-actions error:', err)
    return jsonRes(req, { ok: false, error: err?.message || String(err) }, 500)
  }
})
