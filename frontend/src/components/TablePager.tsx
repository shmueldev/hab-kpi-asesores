type Props = {
  page: number
  pageSize: number
  total: number
  onPage: (page: number) => void
}

export default function TablePager({ page, pageSize, total, onPage }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pages)
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, total)

  return (
    <div className="table-pager">
      <p className="table-pager-meta">
        {from}–{to} de {total}
      </p>
      <div className="table-pager-btns">
        <button type="button" className="ghost" disabled={current <= 1} onClick={() => onPage(1)}>
          «
        </button>
        <button type="button" className="ghost" disabled={current <= 1} onClick={() => onPage(current - 1)}>
          Anterior
        </button>
        <span className="table-pager-page">
          {current} / {pages}
        </span>
        <button type="button" className="ghost" disabled={current >= pages} onClick={() => onPage(current + 1)}>
          Siguiente
        </button>
        <button type="button" className="ghost" disabled={current >= pages} onClick={() => onPage(pages)}>
          »
        </button>
      </div>
    </div>
  )
}

export function pageSlice<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (Math.max(1, page) - 1) * pageSize
  return rows.slice(start, start + pageSize)
}
