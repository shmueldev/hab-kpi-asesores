import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { ChatProvider } from './chat/ChatContext'
import BackToTop from './components/BackToTop'
import ChatWidget from './components/ChatWidget'
import ChangePassword from './pages/ChangePassword'
import CarteraDetail from './pages/CarteraDetail'
import Dashboard from './pages/Dashboard'
import KpiDetail from './pages/KpiDetail'
import PedidosDetail from './pages/PedidosDetail'
import Login from './pages/Login'
import RecoverPassword from './pages/RecoverPassword'

function readUser() {
  try {
    return JSON.parse(localStorage.getItem('kpi_user') || '{}') as {
      must_change_password?: boolean
    }
  } catch {
    return {}
  }
}

function PrivateLayout() {
  const token = localStorage.getItem('kpi_token')
  if (!token) return <Navigate to="/login" replace />
  if (readUser().must_change_password) return <Navigate to="/cambiar-clave" replace />
  return (
    <ChatProvider>
      <AnimatedPage />
      <ChatWidget />
      <BackToTop />
    </ChatProvider>
  )
}

function AnimatedPage() {
  const location = useLocation()
  return (
    <div className="route-enter" key={location.pathname}>
      <Outlet />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar" element={<RecoverPassword />} />
      <Route path="/cambiar-clave" element={<ChangePassword />} />
      <Route element={<PrivateLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/detalle/cartera" element={<CarteraDetail />} />
        <Route path="/detalle/pedidos" element={<PedidosDetail />} />
        <Route path="/detalle/:kpi" element={<KpiDetail />} />
        <Route path="/cartera" element={<Navigate to="/detalle/cartera" replace />} />
        <Route path="/cartera/:vista" element={<Navigate to="/detalle/cartera" replace />} />
      </Route>
      <Route path="/chat" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
