import { formatPct } from './KpiCharts'

type Props = {
  pct: number
  period: string
}

export default function AlertBanner({ pct, period }: Props) {
  return (
    <div className="alert-banner" role="status">
      Bajo 80 % de meta a mitad de trimestre · cumplimiento {formatPct(pct)} en {period}.
      No hay envío de correo configurado; el aviso queda en este tablero.
    </div>
  )
}
