export const theme = {
  navy: '#061953',
  accent: '#0B31A5',
  highlight: '#8BC7F7',
  border: '#46647C',
  text: '#1C2325',
  bg: '#FFFFFF',
  rowAlt: '#D2D3D5',
  ok: '#168980',
  bad: '#BB4A4A',
  dataColors: ['#8BC7F7', '#0B31A5', '#061953', '#46647C', '#168980', '#BB4A4A', '#D2D3D5'],
} as const

export type ThemeMode = 'light' | 'dark'

const THEME_KEY = 'kpi_theme'

export function readTheme(): ThemeMode {
  const saved = localStorage.getItem(THEME_KEY)
  return saved === 'dark' ? 'dark' : 'light'
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode)
  localStorage.setItem(THEME_KEY, mode)
}

export function toggleTheme(): ThemeMode {
  const next = readTheme() === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  return next
}
