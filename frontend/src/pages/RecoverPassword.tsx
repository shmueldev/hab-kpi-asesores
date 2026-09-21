import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { recoverPassword } from '../api/client'
import BikeLoader from '../components/BikeLoader'

export default function RecoverPassword() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [asesorKey, setAsesorKey] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword !== confirm) {
      setError('La confirmación no coincide')
      return
    }
    setLoading(true)
    try {
      await recoverPassword(username, Number(asesorKey), newPassword)
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo recuperar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <h1>Recuperar contraseña</h1>
        <p className="muted">
          Escribe tu usuario y tu número de asesor (el de la empresa). Así defines una clave nueva.
        </p>
        <label>
          Usuario
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Número de asesor
          <input
            type="number"
            value={asesorKey}
            onChange={(e) => setAsesorKey(e.target.value)}
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
        {loading && <BikeLoader compact label="Recuperando acceso…" />}
        <button type="submit" disabled={loading}>
          {loading ? 'Pedaleando…' : 'Definir nueva contraseña'}
        </button>
        <p className="hint">
          <Link to="/login">Volver al ingreso</Link>
        </p>
      </form>
    </div>
  )
}
