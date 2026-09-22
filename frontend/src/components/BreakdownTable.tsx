import TableBanner from './TableBanner'
import TableCsvMenu from './TableCsvMenu'

type Row = { label: string; value: string; hint?: string }

export default function BreakdownTable({
  formula,
  rows,
  tour,
  title,
  description,
}: {
  formula: string
  rows: Row[]
  tour?: string
  title?: string
  description?: string
}) {
  return (
    <TableCsvMenu
      filename={title || 'como-se-calcula'}
      headers={['Concepto', 'Valor', 'Detalle']}
      rows={rows.map((row) => [row.label, row.value, row.hint || ''])}
    >
    <section className={`metrics-table neon-card${title ? ' has-banner' : ''}`} data-tour={tour}>
      {title ? <TableBanner title={title} description={description || `Cómo se calcula: ${formula}`} /> : null}
      {!title ? <p className="formula-line">Cómo se calcula: {formula}</p> : null}
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
    </TableCsvMenu>
  )
}
