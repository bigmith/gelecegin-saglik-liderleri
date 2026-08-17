import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../config/supabaseClient'
import { logoutUser, recordParticipantActivity } from '../services/supabaseService'

export default function AuthGuard({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [authenticated, setAuthenticated] = useState(false)
  const location = useLocation()

  useEffect(() => {
    let isMounted = true

    async function evaluateSession(session) {
      if (!session || !session.user) {
        if (isMounted) {
          setAuthenticated(false)
          setUserRole(null)
          setLoading(false)
        }
        return
      }

      try {
        // Supabase profiles tablosundan rol bilgisini çek
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, ad_soyad')
          .eq('id', session.user.id)
          .maybeSingle()

        if (error || !profile || !profile.role) {
          console.error('AuthGuard: Profil okunamadı veya yok:', error)
          if (isMounted) {
            await logoutUser()
            setAuthenticated(false)
            setUserRole(null)
            setLoading(false)
          }
          return
        }

        if (isMounted) {
          const role = profile.role.toLowerCase()
          setUserRole(role)
          setAuthenticated(true)

          // Data API uyumluluğu için localStorage senkronizasyonu
          const roleDisplayName = role === 'admin' ? 'Admin' : role === 'mentor' ? 'Mentor' : 'Katılımcı'
          localStorage.setItem('access', session.access_token)
          localStorage.setItem('role', roleDisplayName)
          if (profile.ad_soyad) {
            localStorage.setItem('username', profile.ad_soyad)
          }

          if (role === 'katilimci') {
            recordParticipantActivity('panel_open', location.pathname).catch(() => {})
          }

          setLoading(false)
        }
      } catch (err) {
        console.error('AuthGuard beklenmeyen hata:', err)
        if (isMounted) {
          setAuthenticated(false)
          setUserRole(null)
          setLoading(false)
        }
      }
    }

    // İlk oturum kontrolü
    try {
      supabase.auth.getSession().then(({ data }) => {
        evaluateSession(data?.session || null)
      }).catch(err => {
        console.error('AuthGuard getSession hatası:', err)
        if (isMounted) {
          setAuthenticated(false)
          setLoading(false)
        }
      })
    } catch (err) {
      console.error('AuthGuard senkron getSession hatası:', err)
      if (isMounted) {
        setAuthenticated(false)
        setLoading(false)
      }
    }

    // Auth durum değişikliklerini dinle (Refresh / SignIn / SignOut)
    let subscription = null
    try {
      const authListener = supabase.auth.onAuthStateChange((_event, session) => {
        evaluateSession(session)
      })
      subscription = authListener?.data?.subscription
    } catch (err) {
      console.error('AuthGuard onAuthStateChange hatası:', err)
    }

    return () => {
      isMounted = false
      if (subscription) subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Oturum doğrulanıyor...</p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Rol kontrolü (büyük/küçük harf bağımsız)
  const normalizedUserRole = userRole?.toLowerCase()
  const normalizedAllowedRoles = allowedRoles?.map((r) => r.toLowerCase())

  if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(normalizedUserRole)) {
    if (normalizedUserRole === 'admin') return <Navigate to="/admin" replace />
    if (normalizedUserRole === 'mentor') return <Navigate to="/mentor" replace />
    if (normalizedUserRole === 'katilimci') return <Navigate to="/katilimci" replace />
    return <Navigate to="/login" replace />
  }

  return children
}
