import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import AnaSayfa from './pages/AnaSayfa'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import AdminPanel from './pages/AdminPanel'
import MentorPanel from './pages/MentorPanel'
import KatilimciPanel from './pages/KatilimciPanel'
import Hakkinda from './pages/Hakkinda'
import Gizlilik from './pages/Gizlilik'
import Iletisim from './pages/Iletisim'
import AuthGuard from './components/AuthGuard'

/* ─── Scroll to top on route change ─── */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

/* ─── Animated Routes Wrapper ─── */
function AnimatedRoutes() {
  const location = useLocation()

  return (
    <div key={location.pathname} className="animate-page-enter">
      <Routes location={location}>
        <Route path="/" element={<AnaSayfa />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/hakkinda" element={<Hakkinda />} />
        <Route path="/gizlilik" element={<Gizlilik />} />
        <Route path="/iletisim" element={<Iletisim />} />

        {/* Protected Routes */}
        <Route path="/admin" element={
          <AuthGuard allowedRoles={['Admin']}>
            <AdminPanel />
          </AuthGuard>
        } />
        <Route path="/mentor" element={
          <AuthGuard allowedRoles={['Mentor']}>
            <MentorPanel />
          </AuthGuard>
        } />
        <Route path="/katilimci" element={
          <AuthGuard allowedRoles={['Katılımcı', 'Katilimci']}>
            <KatilimciPanel />
          </AuthGuard>
        } />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AnimatedRoutes />
    </BrowserRouter>
  )
}

export default App
