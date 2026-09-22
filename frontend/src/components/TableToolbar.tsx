type Props = {
  query: string
  onQuery: (value: string) => void
  placeholder?: string
  facetLabel?: string
  facet?: string
  facets?: string[]
  onFacet?: (value: string) => void
  count: number
  total: number
}

export default function TableToolbar({
  query,
  onQuery,
  placeholder = 'Buscar NIT, cliente o documento',
  facetLabel,
  facet = '',
  facets,
  onFacet,
  count,
  total,
}: Props) {
  return (
    <div className="table-toolbar no-print">
      <label className="table-search">
        Buscar
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
        />
      </label>
      {facets && onFacet ? (
        <label className="table-facet">
          {facetLabel || 'Filtro'}
          <select value={facet} onChange={(e) => onFacet(e.target.value)}>
            <option value="">Todas</option>
            {facets.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <p className="table-toolbar-meta">
        {count === total ? `${total} filas` : `${count} de ${total}`}
      </p>
    </div>
  )
}
