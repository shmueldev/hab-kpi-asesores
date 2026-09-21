import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type ChatCtx = {
  open: boolean
  toggle: () => void
  close: () => void
  show: () => void
}

const ChatContext = createContext<ChatCtx | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const value = useMemo<ChatCtx>(
    () => ({
      open,
      toggle: () => setOpen((prev) => !prev),
      close: () => setOpen(false),
      show: () => setOpen(true),
    }),
    [open],
  )
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChatDock() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatDock requires ChatProvider')
  return ctx
}
