import { useState } from 'react'
import { readTheme, toggleTheme } from '../theme'

export default function ThemeToggle() {
  const [mode, setMode] = useState(readTheme)
  const next = mode === 'dark' ? 'claro' : 'oscuro'

  return (
    <button
      type="button"
      data-tour="theme"
      className={`icon-btn${mode === 'dark' ? ' is-dark' : ''}`}
      onClick={() => setMode(toggleTheme())}
      aria-label={`Cambiar a modo ${next}`}
      title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    >
      {mode === 'dark' ? (
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 3.2v2.2M12 18.6v2.2M3.2 12h2.2M18.6 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M6.1 17.9l1.6-1.6M16.3 7.7l1.6-1.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path
            d="M14.8 4.4A7.4 7.4 0 1 0 19.6 14 6.1 6.1 0 0 1 14.8 4.4z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}
