type Field = { label: string; value: string }

type Props = {
  title: string
  subtitle?: string
  fields: Field[]
  onClose: () => void
  onFilter?: () => void
  filterLabel?: string
}

export default function RowDrawer({ title, subtitle, fields, onClose, onFilter, filterLabel }: Props) {
  return (
    <div className="drawer-backdrop no-print" role="presentation" onClick={onClose}>
      <aside
        className="drawer-panel"
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-head">
          <div>
            <p className="drawer-kicker">Detalle</p>
            <h2>{title}</h2>
            {subtitle ? <p className="muted">{subtitle}</p> : null}
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            Cerrar
          </button>
        </header>
        <dl className="drawer-fields">
          {fields.map((field) => (
            <div key={field.label}>
              <dt>{field.label}</dt>
              <dd>{field.value || '—'}</dd>
            </div>
          ))}
        </dl>
        {onFilter ? (
          <button type="button" className="ghost" onClick={onFilter}>
            {filterLabel || 'Filtrar esta fila'}
          </button>
        ) : null}
      </aside>
    </div>
  )
}
