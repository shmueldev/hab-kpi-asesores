import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { changePassword } from '../api/client'
import BikeLoader from '../components/BikeLoader'

export default function ChangePassword() {
  const navigate = useNavigate()
  useEffect(() => {
    if (!localStorage.getItem('kpi_token')) navigate('/login', { replace: true })
  }, [navigate])
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const forced = (() => {
    try {
      return Boolean(JSON.parse(localStorage.getItem('kpi_user') || '{}').must_change_password)
    } catch {
      return false
    }
  })()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword !== confirm) {
      setError('La confirmación no coincide')
      return
    }
    setLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      const raw = localStorage.getItem('kpi_user')
      if (raw) {
        const user = JSON.parse(raw)
        user.must_change_password = false
        localStorage.setItem('kpi_user', JSON.stringify(user))
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page route-enter">
      <form className="login-card" onSubmit={onSubmit}>
        <h1>Cambiar contraseña</h1>
        <p className="muted">
          {forced
            ? 'Estás usando la clave temporal. Elige una propia para entrar al tablero.'
            : 'Actualiza tu contraseña. Mínimo 8 caracteres, distinta a HabKpi.2026.'}
        </p>
        <label>
          Contraseña actual
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <label>
          Nueva contraseña
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label>
          Confirmar nueva
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        {error && <div className="error">{error}</div>}
        {loading && <BikeLoader compact label="Guardando clave…" />}
        <button type="submit" disabled={loading}>
          {loading ? 'Pedaleando…' : 'Guardar y continuar'}
        </button>
        {!forced && (
          <p className="hint">
            <Link to="/">Volver al tablero</Link>
          </p>
        )}
      </form>
    </div>
  )
}
