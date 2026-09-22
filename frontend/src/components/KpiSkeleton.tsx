export default function KpiSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <section className="cards-grid dash skeleton-grid" aria-hidden>
      {Array.from({ length: cards }, (_, i) => (
        <article key={i} className="kpi-card neon-card kpi-skel">
          <div className="skel-line w-40" />
          <div className="skel-line w-70 lg" />
          <div className="skel-line w-55" />
          <div className="skel-line w-90" />
        </article>
      ))}
    </section>
  )
}
