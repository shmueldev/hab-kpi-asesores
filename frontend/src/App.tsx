import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { ChatProvider } from './chat/ChatContext'
import ChatWidget from './components/ChatWidget'
import ChangePassword from './pages/ChangePassword'
import Cartera from './pages/Cartera'
import CarteraDetail from './pages/CarteraDetail'
import Dashboard from './pages/Dashboard'
import KpiDetail from './pages/KpiDetail'
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
      <Outlet />
      <ChatWidget />
    </ChatProvider>
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
        <Route path="/detalle/:kpi" element={<KpiDetail />} />
        <Route path="/cartera" element={<Cartera />} />
        <Route path="/cartera/:vista" element={<CarteraDetail />} />
      </Route>
      <Route path="/chat" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
