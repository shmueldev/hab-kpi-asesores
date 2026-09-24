import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { pingUso } from '../api/client'
import { useChatDock } from '../chat/ChatContext'

function screenFromPath(path: string): string | null {
  if (path === '/') return 'home'
  if (path.startsWith('/detalle/cartera')) return 'cartera'
  if (path.startsWith('/detalle/pedidos')) return 'pedidos'
  if (path.startsWith('/detalle/cumplimiento')) return 'cumplimiento'
  if (path.startsWith('/detalle/crecimiento')) return 'crecimiento'
  if (path.startsWith('/detalle/autogestion')) return 'autogestion'
  return null
}

export default function UsageBeacon() {
  const location = useLocation()
  const { open } = useChatDock()

  useEffect(() => {
    const screen = screenFromPath(location.pathname)
    if (screen) void pingUso(screen)
  }, [location.pathname])

  useEffect(() => {
    if (open) void pingUso('chat')
  }, [open])

  return null
}
