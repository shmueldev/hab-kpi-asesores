import { useNavigate } from 'react-router-dom'
import { resetTour } from '../tour'
import ThemeToggle from './ThemeToggle'

type Props = {
  subtitle: string
  backTo?: string
  onReplayTour?: () => void
}

export default function AppHeader({ subtitle, backTo, onReplayTour }: Props) {
  const navigate = useNavigate()
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('kpi_user') || '{}') as {
        username?: string
        role?: string
        nombre?: string | null
      }
    } catch {
      return {}
    }
  })()

  function logout() {
    localStorage.removeItem('kpi_token')
    localStorage.removeItem('kpi_user')
    navigate('/login')
  }

  return (
    <header className="app-header" data-tour="header">
      <div className="app-brand">
        <p className="app-kicker">Señal comercial</p>
        <h1>Desempeño de asesores</h1>
        <p className="muted">
          {user.nombre || user.username} · {user.role === 'admin' ? 'gerente' : 'asesor'} · {subtitle}
        </p>
      </div>
      <div className="header-tools no-print">
        {onReplayTour && (
          <button
            className="ghost no-print"
            type="button"
            data-tour="guia"
            onClick={() => {
              resetTour()
              onReplayTour()
            }}
          >
            Guía
          </button>
        )}
        {user.role === 'admin' && (
          <button className="ghost no-print" type="button" onClick={() => navigate('/uso')}>
            Uso
          </button>
        )}
        {backTo && (
          <button className="ghost no-print" type="button" onClick={() => navigate(backTo)}>
            Volver
          </button>
        )}
        <button
          className="icon-btn no-print"
          type="button"
          onClick={() => window.print()}
          aria-label="Imprimir o guardar PDF"
          title="Imprimir / PDF para junta"
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M7 8V4.8h10V8" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <rect x="6" y="13.5" width="12" height="6.2" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M6 11.2H4.6A1.6 1.6 0 0 1 3 9.6V8.4A1.6 1.6 0 0 1 4.6 6.8h14.8A1.6 1.6 0 0 1 21 8.4v1.2a1.6 1.6 0 0 1-1.6 1.6H18" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
        <ThemeToggle />
        <button
          className="icon-btn"
          type="button"
          data-tour="password"
          onClick={() => navigate('/cambiar-clave')}
          aria-label="Cambiar contraseña"
          title="Cambiar contraseña"
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <rect x="5" y="11" width="14" height="9" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 11V8.4a4 4 0 0 1 8 0V11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <button className="icon-btn" type="button" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M10 12h9M16.2 8.8 19.4 12l-3.2 3.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </header>
  )
}
