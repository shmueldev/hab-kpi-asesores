import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const LONG_PAGE = 280

function scrollState() {
  const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  const y = window.scrollY
  return {
    long: max > LONG_PAGE,
    down: y < max / 2,
  }
}

export default function BackToTop() {
  const { pathname } = useLocation()
  const [visible, setVisible] = useState(false)
  const [down, setDown] = useState(false)

  function sync() {
    const next = scrollState()
    setVisible(next.long)
    setDown(next.down)
  }

  useEffect(() => {
    sync()
  }, [pathname])

  useEffect(() => {
    const onScroll = () => sync()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  function go() {
    const top = down ? document.documentElement.scrollHeight : 0
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      className={`back-to-top no-print${visible ? ' is-on' : ''}${down ? ' is-down' : ''}`}
      onClick={go}
      aria-label={down ? 'Bajar al final' : 'Subir al inicio'}
      title={down ? 'Bajar al final' : 'Subir al inicio'}
      tabIndex={visible ? 0 : -1}
    >
      <svg viewBox="0 0 48 48" aria-hidden>
        <g className="back-wheel-spin">
          <circle className="back-tire" cx="24" cy="24" r="17" />
          <circle className="back-rim" cx="24" cy="24" r="12.4" />
          <g className="back-spokes">
            {Array.from({ length: 10 }, (_, i) => (
              <line key={i} x1="24" y1="24" x2="24" y2="7.8" transform={`rotate(${i * 18} 24 24)`} />
            ))}
          </g>
        </g>
        <circle className="back-hub" cx="24" cy="24" r="6.4" />
        <path className="back-arrow" d="M24 20.2 20.6 24.2h2.1V28.2h2.6v-4h2.1Z" />
      </svg>
    </button>
  )
}
