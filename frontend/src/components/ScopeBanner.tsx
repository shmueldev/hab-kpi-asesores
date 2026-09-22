export default function ScopeBanner({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className="scope-banner" role="status">
      Estás en <strong>Todos</strong>: KPIs, cartera UnoEE, Siesa y pedidos son de toda la empresa.
      Elige un asesor para recortar.
    </div>
  )
}
