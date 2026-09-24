import { useEffect, useState } from 'react'
import { fetchUso, type UsoDayReport } from '../api/client'
import AppHeader from '../components/AppHeader'
import BikeLoader from '../components/BikeLoader'

const SCREENS = ['login', 'home', 'cumplimiento', 'crecimiento', 'autogestion', 'cartera', 'pedidos', 'chat']

function todayIso() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function heat(n: number, max: number) {
  if (!n || !max) return 0.08
  return 0.18 + (n / max) * 0.82
}

export default function UsoAdmin() {
  const [fecha, setFecha] = useState(todayIso)
  const [data, setData] = useState<UsoDayReport | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    void fetchUso(fecha)
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error'))
  }, [fecha])

  const max = Math.max(1, ...(data?.usuarios || []).flatMap((row) => Object.values(row.screens)))

  return (
    <div className="app-shell hud">
      <AppHeader subtitle={`Uso del ${fecha}`} backTo="/" />
      <main className="dashboard detail-page">
        <section className="filters neon-card">
          <label>
            Día
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <p className="range-hint">
            Redis, un hash por día, 90 días. Sin hover ni texto de chat. Cada celda es visitas a esa pantalla.
          </p>
        </section>
        {error && <div className="error banner">{error}</div>}
        {!data && !error && <BikeLoader label="Leyendo el uso del día…" />}
        {data && (
          <div className="board-enter">
            <p className="uso-summary">
              {data.activos} activos · {data.total_hits} visitas · {data.redis ? 'Redis ok' : 'Redis no respondió'}
            </p>
            {!data.usuarios.length ? (
              <p className="muted">Nadie navegó este día (o Redis estaba apagado).</p>
            ) : (
              <div className="uso-table-wrap neon-card">
                <table className="metrics-table uso-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      {SCREENS.map((screen) => (
                        <th key={screen}>{screen}</th>
                      ))}
                      <th>Ruta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.usuarios.map((row) => (
                      <tr key={row.username}>
                        <td>
                          <strong>{row.nombre || row.username}</strong>
                          <div className="muted">{row.username}</div>
                        </td>
                        {SCREENS.map((screen) => {
                          const n = row.screens[screen] || 0
                          return (
                            <td key={screen} className="num">
                              <span className="uso-cell" style={{ opacity: n ? heat(n, max) : 0.12 }}>
                                {n || '—'}
                              </span>
                            </td>
                          )
                        })}
                        <td className="uso-path">{row.path.join(' → ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
