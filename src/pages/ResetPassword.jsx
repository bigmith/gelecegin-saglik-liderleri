import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../config/supabaseClient'
import { updateUserPassword, requestPasswordReset } from '../services/supabaseService'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [isRecoverySession, setIsRecoverySession] = useState(false)

  // Resend link state
  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendStatus, setResendStatus] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    // 1. URL hash recovery kontrolü (#type=recovery veya access_token)
    const hash = window.location.hash || ''
    if (hash.includes('type=recovery') || hash.includes('access_token')) {
      setIsRecoverySession(true)
    }

    // 2. Supabase Auth session & state dinleyici
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsRecoverySession(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setIsRecoverySession(true)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Şifreniz en az 6 karakter uzunluğunda olmalıdır.')
      return
    }

    if (password !== confirmPassword) {
      setError('Girdiğiniz şifreler birbiriyle eşleşmiyor.')
      return
    }

    setLoading(true)

    try {
      await updateUserPassword(password)
      setSuccess(true)
      
      // URL hash'i temizle
      if (window.history?.replaceState) {
        window.history.replaceState(null, '', window.location.pathname)
      }

      // 3 saniye sonra otomatik login sayfasına yönlendir
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3000)
    } catch (err) {
      setError(err.message || 'Şifre güncellenirken bir hata oluştu. Bağlantı süresi dolmuş olabilir.')
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
        msg: 'Yeni şifre sıfırlama bağlantısı e-posta adresinize gönderildi.'
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
          Hesap Güvenliği
        </p>

        {success ? (
          <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              ✓
            </div>
            <h3 className="text-base font-bold text-emerald-900 mb-1">Şifreniz Başarıyla Güncellendi!</h3>
            <p className="text-xs text-emerald-700 mb-5 leading-relaxed">
              Yeni şifreniz kaydedildi. 3 saniye içinde giriş sayfasına yönlendirileceksiniz...
            </p>
            <Link
              to="/login"
              className="inline-block w-full py-3 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold text-xs sm:text-sm hover:shadow-lg transition-all"
            >
              Hemen Giriş Yap →
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 bg-red-50 text-red-600 text-xs sm:text-sm py-3 px-4 rounded-xl border border-red-100 text-left">
                {error}
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

            {/* Bağlantı süresi dolmuşsa yeniden gönder */}
            <div className="border-t border-slate-100 pt-5 mt-4 text-left">
              <details className="group cursor-pointer">
                <summary className="text-xs text-slate-500 hover:text-orange-500 font-medium transition-colors list-none flex items-center justify-between">
                  <span>Bağlantınız geçersiz mi görünüyor?</span>
                  <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 bg-slate-50 p-3.5 rounded-xl text-xs space-y-3">
                  <p className="text-slate-500 leading-relaxed">
                    E-posta adresinizi girerek yeni bir şifre sıfırlama bağlantısı talep edebilirsiniz:
                  </p>
                  {resendStatus && (
                    <div className={`p-2.5 rounded-lg border ${
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
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                    <button
                      type="submit"
                      disabled={resendLoading}
                      className="px-3 py-2 bg-orange-500 text-white rounded-lg font-semibold text-xs hover:bg-orange-600 disabled:opacity-60 transition-colors"
                    >
                      {resendLoading ? '...' : 'Gönder'}
                    </button>
                  </form>
                </div>
              </details>
            </div>
          </>
        )}

        <div className="mt-6 space-y-2">
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
