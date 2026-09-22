type Props = {
  size?: number
}

export default function ChatRobot({ size = 120 }: Props) {
  return (
    <svg className="chat-robot" viewBox="0 0 80 80" width={size} height={size} aria-hidden>
      <g className="chat-robot-float">
        <g className="chat-robot-antenna">
          <line x1="40" y1="16" x2="40" y2="6" />
          <circle className="chat-robot-tip" cx="40" cy="6" r="3.2" />
        </g>
        <rect className="chat-robot-head" x="18" y="16" width="44" height="30" rx="11" />
        <rect className="chat-robot-visor" x="24" y="24" width="32" height="12" rx="6" />
        <circle className="chat-robot-eye" cx="33" cy="30" r="2.8" />
        <circle className="chat-robot-eye" cx="47" cy="30" r="2.8" />
        <path className="chat-robot-smile" d="M34 39c2 2 10 2 12 0" />
        <rect className="chat-robot-body" x="22" y="48" width="36" height="22" rx="9" />
        <rect className="chat-robot-badge" x="33" y="54" width="14" height="8" rx="3" />
        <circle className="chat-robot-arm" cx="18" cy="56" r="4.6" />
        <g className="chat-robot-wave">
          <line x1="62" y1="54" x2="70" y2="44" />
          <circle className="chat-robot-arm" cx="71" cy="42" r="4.6" />
        </g>
        <circle className="chat-robot-foot" cx="31" cy="73" r="4.6" />
        <circle className="chat-robot-foot" cx="49" cy="73" r="4.6" />
      </g>
    </svg>
  )
}
