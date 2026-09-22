import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { downloadCsv, slugName, tableToRows } from '../csv'

type Props = {
  filename: string
  headers?: string[]
  rows?: (string | number | null | undefined)[][]
  children: ReactNode
}

export default function TableCsvMenu({ filename, headers, rows, children }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [menu])

  function onContextMenu(e: MouseEvent) {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }

  function exportCsv() {
    if (headers && rows) {
      downloadCsv(slugName(filename), headers, rows)
    } else {
      const table = box.current?.querySelector('table')
      if (!table) return
      const scraped = tableToRows(table)
      downloadCsv(slugName(filename), scraped.headers, scraped.rows)
    }
    setMenu(null)
  }

  return (
    <div ref={box} className="csv-table" onContextMenu={onContextMenu}>
      {children}
      {menu ? (
        <div className="csv-menu" style={{ left: menu.x, top: menu.y }} role="menu">
          <button type="button" className="ghost" onClick={exportCsv}>
            Exportar CSV para Excel
          </button>
        </div>
      ) : null}
    </div>
  )
}
