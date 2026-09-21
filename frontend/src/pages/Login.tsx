import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/client'
import BikeLoader from '../components/BikeLoader'
import ThemeToggle from '../components/ThemeToggle'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      localStorage.setItem('kpi_token', data.access_token)
      localStorage.setItem(
        'kpi_user',
        JSON.stringify({
          username: data.username,
          role: data.role,
          asesor_key: data.asesor_key,
          nombre: data.nombre,
          must_change_password: data.must_change_password,
        }),
      )
      navigate(data.must_change_password ? '/cambiar-clave' : '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card neon-card" onSubmit={onSubmit}>
        <div className="login-top">
          <p className="app-kicker">Señal comercial</p>
          <ThemeToggle />
        </div>
        <h1>Desempeño de asesores</h1>
        <p className="hint" style={{ marginTop: 0, color: 'var(--border)' }}>
          Inicia sesión para ver tu tablero
        </p>
        <label>
          Usuario
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <div className="error">{error}</div>}
        {loading && <BikeLoader compact label="Entrando al tablero…" />}
        <button type="submit" disabled={loading}>
          {loading ? 'Pedaleando…' : 'Entrar'}
        </button>
        <p className="hint">
          Primera vez: usuario (nombre + apellido) y clave temporal <strong>HabKpi.2026</strong>.
          Luego te pedirá cambiarla.{' '}
          <Link to="/recuperar">Recuperar o cambiar si la olvidaste</Link>
        </p>
      </form>
    </div>
  )
}
