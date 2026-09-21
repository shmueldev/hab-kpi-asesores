import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CarteraAbierta,
  CarteraCanceladas,
  CarteraSiesaSaldo,
  fetchCarteraAbierta,
  fetchCarteraCanceladas,
  fetchCarteraSiesa,
} from '../api/client'
import AppHeader from '../components/AppHeader'
import BikeLoader from '../components/BikeLoader'
import KpiCard from '../components/KpiCard'
import { formatMoney } from '../components/KpiCharts'
import { currentYear } from '../period'

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Cartera() {
  const navigate = useNavigate()
  const [asOf, setAsOf] = useState(todayIso)
  const [abierta, setAbierta] = useState<CarteraAbierta | null>(null)
  const [siesa, setSiesa] = useState<CarteraSiesaSaldo | null>(null)
  const [canceladas, setCanceladas] = useState<CarteraCanceladas | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([
      fetchCarteraAbierta({ as_of: asOf }),
      fetchCarteraSiesa(),
      fetchCarteraCanceladas(currentYear()),
    ])
      .then(([a, s, c]) => {
        setAbierta(a)
        setSiesa(s)
        setCanceladas(c)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Error')
        if (String(err).includes('Sesión')) navigate('/login')
      })
      .finally(() => setLoading(false))
  }, [asOf, navigate])

  return (
    <div className="app-shell hud">
      <AppHeader
        subtitle={`Cartera · foto al ${asOf}${abierta?.vendedor_nombre ? ` · ${abierta.vendedor_nombre}` : ''}`}
      />
      <main className="dashboard">
        <section className="filters neon-card">
          <label>
            Foto al (as_of)
            <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
          </label>
          <p className="range-hint">
            Abierta, cubetas y aging son una foto a esta fecha. El Q de ventas no aplica. El único KPI
            trimestral es canceladas por fecha de cancelación.
          </p>
        </section>
        {error && <div className="error banner">{error}</div>}
        {loading && !abierta && <BikeLoader label="Tomando la foto de cartera…" />}
        {abierta && (
          <section className="cards-grid">
            <KpiCard
              title="UnoEE abierta"
              value={formatMoney(abierta.abierta)}
              subtitle={`${abierta.n_abiertas} documentos/cuotas`}
              detail={abierta.sin_vcto.n ? `${abierta.sin_vcto.n} sin vencimiento (solo en abierta $)` : 'Foto vs as_of'}
              tone="neutral"
              onOpen={() => navigate(`/cartera/abierta?as_of=${asOf}`)}
            />
            <KpiCard
              title="Al día"
              value={formatMoney(abierta.al_dia.monto)}
              subtitle={`${abierta.al_dia.n} · d ≤ 0`}
              tone="ok"
              onOpen={() => navigate(`/cartera/abierta?as_of=${asOf}`)}
            />
            <KpiCard
              title="Gracia 30 días"
              value={formatMoney(abierta.gracia.monto)}
              subtitle={`${abierta.gracia.n} · 1–30 días`}
              tone="neutral"
              onOpen={() => navigate(`/cartera/abierta?as_of=${asOf}`)}
            />
            <KpiCard
              title="Vencida"
              value={formatMoney(abierta.vencida.monto)}
              subtitle={`${abierta.vencida.n} · más de 30 días`}
              tone="bad"
              onOpen={() => navigate(`/cartera/abierta?as_of=${asOf}`)}
            />
          </section>
        )}
        <section className="cards-grid two">
          {siesa && (
            <KpiCard
              title="Saldo Siesa"
              value={formatMoney(siesa.saldo_cartera)}
              subtitle={`${siesa.n_docs} documentos`}
              detail="fact_cartera.total · sin Q"
              onOpen={() => navigate('/cartera/siesa')}
            />
          )}
          {canceladas && (
            <KpiCard
              title={`Canceladas ${canceladas.anio}`}
              value={String(canceladas.total)}
              subtitle={`Q1 ${canceladas.q1 ?? '—'} · Q2 ${canceladas.q2 ?? '—'} · Q3 ${canceladas.q3 ?? '—'} · Q4 ${canceladas.q4 ?? '—'}`}
              detail="Join por fecha_cancelacion"
              onOpen={() => navigate(`/cartera/canceladas?anio=${canceladas.anio}`)}
            />
          )}
        </section>
      </main>
    </div>
  )
}
