import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabaseClient'
import { loginUser, logoutUser, requestPasswordReset, updateUserPassword, recordParticipantActivity } from '../services/supabaseService'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [infoMsg, setInfoMsg] = useState(null)

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotStatus, setForgotStatus] = useState(null) // { type: 'success'|'error', msg: '' }

  // Update Password (Recovery) modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    // 1. URL hash recovery kontrolü (#type=recovery veya access_token)
    const hash = window.location.hash || ''
    if (hash.includes('type=recovery') || hash.includes('access_token')) {
      setShowUpdateModal(true)
    }

    // 2. Supabase Auth State dinleyici
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowUpdateModal(true)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfoMsg(null)

    try {
      const data = await loginUser(email, password)

      // Legacy uyumluluğu için geçici localStorage kaydı
      const roleDisplayName = data.role === 'admin' ? 'Admin' : data.role === 'mentor' ? 'Mentor' : 'Katılımcı'
      localStorage.setItem('access', data.access)
      localStorage.setItem('refresh', data.refresh)
      localStorage.setItem('role', roleDisplayName)
      localStorage.setItem('username', data.username)
      localStorage.setItem('user_email', data.email)

      // Role göre yönlendir
      const userRole = data.role?.toLowerCase()
      if (userRole === 'admin') {
        navigate('/admin', { replace: true })
      } else if (userRole === 'mentor') {
        navigate('/mentor', { replace: true })
      } else if (userRole === 'katilimci') {
        // Katılımcı login aktivite kaydı
        recordParticipantActivity('login', '/login').catch(() => {})
        navigate('/katilimci', { replace: true })
      } else {
        setError('Hesabınıza tanımlı geçerli bir rol bulunamadı.')
        await logoutUser()
      }

    } catch (err) {
      setError(err.message || 'Giriş yapılamadı')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotStatus({ type: 'error', msg: 'Lütfen geçerli bir e-posta adresi girin.' })
      return
    }

    setForgotLoading(true)
    setForgotStatus(null)

    try {
      await requestPasswordReset(forgotEmail)
      setForgotStatus({
        type: 'success',
        msg: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu (ve gerekiyorsa spam klasörünü) kontrol edin.'
      })
    } catch (err) {
      setForgotStatus({
        type: 'error',
        msg: err.message || 'Şifre sıfırlama isteği gönderilemedi. Lütfen sistem yöneticisiyle iletişime geçin.'
      })
    } finally {
      setForgotLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setUpdateError(null)

    if (newPassword.length < 6) {
      setUpdateError('Şifre en az 6 karakter olmalıdır.')
      return
    }

    if (newPassword !== confirmPassword) {
      setUpdateError('Şifreler eşleşmiyor.')
      return
    }

    setUpdateLoading(true)

    try {
      await updateUserPassword(newPassword)
      setShowUpdateModal(false)
      setInfoMsg('Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.')
      setNewPassword('')
      setConfirmPassword('')
      // Hash temizle
      if (window.history?.replaceState) {
        window.history.replaceState(null, '', window.location.pathname)
      }
    } catch (err) {
      setUpdateError(err.message || 'Şifre güncellenirken bir hata oluştu.')
    } finally {
      setUpdateLoading(false)
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

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 sm:mb-3">Giriş</h1>
        <p className="text-slate-400 text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed">
          Geleceğin Dijital Sağlık Liderleri<br />
          Yönetim Paneli
        </p>

        {infoMsg && (
          <div className="mb-5 sm:mb-6 bg-emerald-50 text-emerald-700 text-xs sm:text-sm py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-xl border border-emerald-200 text-left">
            {infoMsg}
          </div>
        )}

        {error && (
          <div className="mb-5 sm:mb-6 bg-red-50 text-red-600 text-xs sm:text-sm py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-xl border border-red-100 text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="bg-slate-50 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-left space-y-4 shadow-inner">
          <div>
            <label className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">E-posta</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 sm:h-11 px-3.5 sm:px-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all text-xs sm:text-sm"
              placeholder="E-posta adresiniz"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block">Şifre</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email)
                  setForgotStatus(null)
                  setShowForgotModal(true)
                }}
                className="text-[11px] sm:text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors"
              >
                Şifremi Unuttum?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 sm:h-11 px-3.5 sm:px-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all text-xs sm:text-sm"
              placeholder="Şifreniz"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold text-xs sm:text-sm hover:shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="space-y-3">
          <a
            href="/"
            className="w-full py-2.5 sm:py-3 rounded-xl border border-slate-200 text-slate-500 font-semibold text-xs sm:text-sm hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all duration-200 inline-flex items-center justify-center gap-2"
          >
            ← Ana Sayfaya Dön
          </a>
        </div>
      </div>

      {/* ── ŞİFREMİ UNUTTUM MODAL ── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl ring-1 ring-slate-100 text-left">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Şifremi Unuttum</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
              Kayıtlı e-posta adresinizi girin. Size şifrenizi güvenle yenileyebileceğiniz bir bağlantı göndereceğiz.
            </p>

            {forgotStatus && (
              <div className={`mb-4 p-3 rounded-xl text-xs sm:text-sm border ${
                forgotStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-600 border-red-100'
              }`}>
                {forgotStatus.msg}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">E-posta</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full h-10 sm:h-11 px-3.5 sm:px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all text-xs sm:text-sm"
                  placeholder="ornek@alanadi.com"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold text-xs sm:text-sm hover:shadow-md hover:shadow-orange-200 transition-all disabled:opacity-60"
                >
                  {forgotLoading ? 'Gönderiliyor...' : 'Bağlantı Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── YENİ ŞİFRE BELİRLEME (RECOVERY) MODAL ── */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl ring-1 ring-slate-100 text-left">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center mb-4">
              🔑
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Yeni Şifrenizi Belirleyin</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
              Şifre sıfırlama bağlantınız doğrulandı. Lütfen hesabınız için yeni bir şifre girin.
            </p>

            {updateError && (
              <div className="mb-4 bg-red-50 text-red-600 text-xs sm:text-sm p-3 rounded-xl border border-red-100">
                {updateError}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Yeni Şifre</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 sm:h-11 px-3.5 sm:px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all text-xs sm:text-sm"
                  placeholder="En az 6 karakter"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Yeni Şifre (Tekrar)</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-10 sm:h-11 px-3.5 sm:px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all text-xs sm:text-sm"
                  placeholder="Şifrenizi tekrar girin"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold text-xs sm:text-sm hover:shadow-lg hover:shadow-orange-200 transition-all disabled:opacity-60"
                >
                  {updateLoading ? 'Güncelleniyor...' : 'Şifremi Güncelle ve Giriş Yap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
