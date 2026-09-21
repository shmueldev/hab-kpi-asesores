type Row = { label: string; value: string; hint?: string }

export default function BreakdownTable({
  formula,
  rows,
  tour,
}: {
  formula: string
  rows: Row[]
  tour?: string
}) {
  return (
    <section className="metrics-table neon-card" data-tour={tour}>
      <p className="formula-line">Cómo se calcula: {formula}</p>
      <table>
        <thead>
          <tr>
            <th>Concepto</th>
            <th className="num">Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>
                {row.label}
                {row.hint ? <span className="row-hint"> {row.hint}</span> : null}
              </td>
              <td className="num">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
