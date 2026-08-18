import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../config/supabaseClient'
import {
  updateUserPassword,
  requestPasswordReset,
  validateResetToken,
  setPasswordWithToken,
  recordParticipantActivity
} from '../services/supabaseService'

export default function ResetPassword() {
  // Page states: 'checking' | 'ready' | 'invalid' | 'success'
  const [pageState, setPageState] = useState('checking')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState(null)
  const [statusMessage, setStatusMessage] = useState(null)

  // 48h Direct Token states
  const [urlToken, setUrlToken] = useState(null)
  const [targetEmail, setTargetEmail] = useState('')
  const [userName, setUserName] = useState('')

  // Resend link state
  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendStatus, setResendStatus] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    async function initSession() {
      // 1. URL Query kontrolü
      const searchParams = new URLSearchParams(window.location.search)
      const token = searchParams.get('token')
      const email = searchParams.get('email') || ''
      const tokenHash = searchParams.get('token_hash')
      const code = searchParams.get('code')
      const type = searchParams.get('type')

      // Query veya Hash içindeki olası hataları kontrol et
      const hashStr = window.location.hash || ''
      const hashParams = new URLSearchParams(hashStr.replace(/^#/, ''))
      
      const errorDesc = searchParams.get('error_description') ||
                        searchParams.get('error') ||
                        hashParams.get('error_description') ||
                        hashParams.get('error')

      if (email) {
        setTargetEmail(email)
        setResendEmail(email)
      }

      // ── DURUM A: 48 Saatlik Güvenli Kriptografik Token Varsa ──
      if (token && email) {
        setUrlToken(token)
        try {
          const valRes = await validateResetToken({ token, email })
          if (valRes?.valid) {
            if (isMounted) {
              if (valRes.data?.ad_soyad) setUserName(valRes.data.ad_soyad)
              setPageState('ready')
            }
            return
          } else {
            if (isMounted) {
              setStatusMessage(valRes?.message || 'Doğrulama bağlantısının 48 saatlik süresi dolmuş veya daha önce kullanılmış.')
              setPageState('invalid')
            }
            return
          }
        } catch (tokenErr) {
          console.warn('Token validation check fallback:', tokenErr)
          // Ağ hatasında formun açılmasına izin ver
          if (isMounted) {
            setPageState('ready')
          }
          return
        }
      }

      // ── DURUM B: Hata Açıklaması Varsa ve 48h Token Yoksa ──
      if (errorDesc && !token) {
        if (isMounted) {
          let userFriendlyError = errorDesc
          if (errorDesc.includes('otp_expired') || errorDesc.includes('expired')) {
            userFriendlyError = 'E-postadaki bağlantının süresi dolmuş. Lütfen aşağıdan yeni bir 48 saatlik bağlantı talep edin.'
          } else if (errorDesc.includes('access_denied')) {
            userFriendlyError = 'Bağlantı tek kullanımlıktır ve daha önce kullanılmış olabilir.'
          }
          setStatusMessage(userFriendlyError)
          setPageState('invalid')
        }
        return
      }

      // ── DURUM C: PKCE Flow (exchangeCodeForSession) ──
      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (!error && data?.session) {
            if (isMounted) setPageState('ready')
            return
          }
        } catch (err) {
          console.warn('Code exchange attempt:', err)
        }
      }

      // ── DURUM D: Token Hash OTP Verify ──
      if (tokenHash && (type === 'recovery' || type === 'magiclink' || type === 'email' || !type)) {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery'
          })
          if (!error && data?.session) {
            if (isMounted) setPageState('ready')
            return
          }
        } catch (err) {
          console.warn('Verify OTP attempt:', err)
        }
      }

      // ── DURUM E: URL Hash Kontrolü (#access_token=...&refresh_token=...) ──
      if (hashStr.includes('access_token')) {
        try {
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            if (!error && data?.session) {
              if (isMounted) setPageState('ready')
              return
            }
          }
        } catch (err) {
          console.warn('Hash session set attempt:', err)
        }
      }

      // ── DURUM F: Mevcut Aktif Session Kontrolü ──
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          if (isMounted) setPageState('ready')
          return
        }
      } catch (err) {
        console.warn('Get session attempt:', err)
      }

      // ── DURUM G: 2.5 Saniye Bekleme ve Son Karar ──
      const timer = setTimeout(async () => {
        if (!isMounted) return
        const { data: { session: finalSession } } = await supabase.auth.getSession()
        if (finalSession) {
          setPageState('ready')
        } else if (token) {
          // Token var ise yine de hazır kabul et
          setPageState('ready')
        } else {
          setPageState('invalid')
        }
      }, 2500)

      return () => clearTimeout(timer)
    }

    // Auth state change dinleyicisi
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        if (isMounted) setPageState('ready')
      }
    })

    initSession()

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (password.length < 6) {
      setFormError('Şifreniz en az 6 karakter uzunluğunda olmalıdır.')
      return
    }

    if (password !== confirmPassword) {
      setFormError('Girdiğiniz şifreler birbiriyle eşleşmiyor.')
      return
    }

    setLoading(true)

    try {
      // 1. Yol: 48 Saatlik Güvenli Token ile Güncelleme
      if (urlToken && targetEmail) {
        await setPasswordWithToken({
          token: urlToken,
          email: targetEmail,
          password: password
        })
      } else {
        // 2. Yol: Aktif Supabase Oturumu ile Güncelleme
        await updateUserPassword(password)
      }

      recordParticipantActivity('password_recovery_login', '/reset-password').catch(() => {})
      setPageState('success')

      // URL query ve hash'i temizle
      if (window.history?.replaceState) {
        window.history.replaceState(null, '', window.location.pathname)
      }

      // 3 saniye sonra login sayfasına yönlendir
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3000)
    } catch (err) {
      const msg = err.message || ''
      if (msg.toLowerCase().includes('session') || msg.toLowerCase().includes('auth') || msg.toLowerCase().includes('oturumu')) {
        setFormError('Doğrulama oturumu zaman aşımına uğramış. Lütfen aşağıdan yeni bir bağlantı talep edin.')
      } else {
        setFormError(msg || 'Şifre güncellenirken bir hata oluştu.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendLink = async (e) => {
    e.preventDefault()
    if (!resendEmail || !resendEmail.trim()) {
      setResendStatus({ type: 'error', msg: 'Lütfen e-posta adresinizi girin.' })
      return
    }

    setResendLoading(true)
    setResendStatus(null)

    try {
      await requestPasswordReset(resendEmail)
      setResendStatus({
        type: 'success',
        msg: 'Yeni 48 saat geçerli şifre belirleme bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.'
      })
    } catch (err) {
      setResendStatus({
        type: 'error',
        msg: err.message || 'E-posta gönderilemedi.'
      })
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-orange-50/30 to-sky-50/40 p-4 overflow-x-hidden font-sans">
      {/* Soft background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-orange-100/50 blur-[80px]" />
        <div className="absolute -bottom-24 -left-24 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-sky-100/50 blur-[80px]" />
      </div>

      <div className="relative bg-white rounded-3xl p-6 sm:p-10 md:p-12 text-center max-w-md w-full shadow-2xl ring-1 ring-slate-100 my-4">
        {/* Logo */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
          <span className="text-white font-black text-lg sm:text-xl">GD</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Şifreni Belirle</h1>
        <p className="text-slate-400 text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed">
          Geleceğin Dijital Sağlık Liderleri<br />
          Hesap Güvenliği &amp; Giriş
        </p>

        {/* ── DURUM 1: DOĞRULAMA KONTROL EDİLİYOR ── */}
        {pageState === 'checking' && (
          <div className="py-8 space-y-4 animate-fade-in">
            <div className="w-10 h-10 border-3 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Doğrulama oturumu kontrol ediliyor...</p>
            <p className="text-xs text-slate-400">Lütfen bekleyin, 48 saatlik bağlantınız güvenle doğrulanıyor.</p>
          </div>
        )}

        {/* ── DURUM 2: BAŞARILI ŞİFRE GÜNCELLEME ── */}
        {pageState === 'success' && (
          <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              ✓
            </div>
            <h3 className="text-base font-bold text-emerald-900 mb-1">Şifreniz Başarıyla Güncellendi!</h3>
            <p className="text-xs text-emerald-700 mb-5 leading-relaxed">
              Yeni şifreniz sisteme kaydedildi. 3 saniye içinde giriş sayfasına yönlendirileceksiniz...
            </p>
            <Link
              to="/login"
              className="inline-block w-full py-3 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold text-xs sm:text-sm hover:shadow-lg transition-all"
            >
              Hemen Giriş Yap →
            </Link>
          </div>
        )}

        {/* ── DURUM 3: ŞİFRE BELİRLEME FORMU (READY) ── */}
        {pageState === 'ready' && (
          <div className="animate-fade-in">
            {/* 48h Security Badge */}
            <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200/80 rounded-full text-[11px] font-semibold text-orange-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {userName ? `${userName} için 48 Saatlik Güvenli Oturum Aktif` : (targetEmail ? `${targetEmail} için Güvenli Oturum Aktif` : '48 Saatlik Güvenli Oturum Aktif')}
            </div>

            {formError && (
              <div className="mb-5 bg-red-50 text-red-600 text-xs sm:text-sm py-3 px-4 rounded-xl border border-red-100 text-left">
                {formError}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="bg-slate-50 rounded-2xl p-4 sm:p-6 mb-6 text-left space-y-4 shadow-inner">
              <div>
                <label className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 sm:h-11 px-3.5 sm:px-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all text-xs sm:text-sm"
                  placeholder="En az 6 karakter"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Yeni Şifre (Tekrar)
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-10 sm:h-11 px-3.5 sm:px-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all text-xs sm:text-sm"
                  placeholder="Şifrenizi tekrar girin"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold text-xs sm:text-sm hover:shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Şifre Kaydediliyor...' : 'Şifremi Kaydet ve Giriş Yap'}
              </button>
            </form>
          </div>
        )}

        {/* ── DURUM 4: GEÇERSİZ / SÜRESİ DOLMUŞ BAĞLANTI (INVALID) ── */}
        {pageState === 'invalid' && (
          <div className="space-y-4 text-left animate-fade-in">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                <span>⚠️</span>
                <span>Bağlantı Geçersiz veya Süresi Dolmuş</span>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                {statusMessage || 'Doğrulama oturumu bulunamadı veya bağlantının 48 saatlik kullanım süresi dolmuş. Lütfen aşağıdan yeni bir bağlantı talep edin.'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
              <p className="text-xs font-semibold text-slate-700">
                Yeni 48 Saatlik Bağlantı İste:
              </p>
              {resendStatus && (
                <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  resendStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-100'
                }`}>
                  {resendStatus.msg}
                </div>
              )}
              <form onSubmit={handleResendLink} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="E-posta adresiniz"
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                />
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="px-4 py-2.5 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl font-bold text-xs hover:shadow transition-all disabled:opacity-60"
                >
                  {resendLoading ? '...' : 'Gönder'}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="mt-6">
          <Link
            to="/login"
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 font-semibold text-xs hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all inline-flex items-center justify-center gap-2"
          >
            ← Giriş Sayfasına Dön
          </Link>
        </div>
      </div>
    </div>
  )
}
