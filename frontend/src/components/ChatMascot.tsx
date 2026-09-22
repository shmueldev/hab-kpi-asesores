import { useEffect, useState } from 'react'
import ChatRobot from './ChatRobot'

const PHOTO = '/chat-mascot.png'

type Props = {
  size?: number
  className?: string
}

export default function ChatMascot({ size = 120, className = '' }: Props) {
  const [photo, setPhoto] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.onload = () => setPhoto(true)
    img.src = PHOTO
  }, [])

  return (
    <div className={`chat-mascot ${className}`.trim()}>
      {photo ? <img src={PHOTO} alt="" width={size} height={size} /> : <ChatRobot size={size} />}
    </div>
  )
}
