export default function HabBike({className}) {
  return (
    <svg className={className} viewBox="0 0 48 32" aria-hidden>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.15">
        <line x1="1" y1="29.2" x2="47" y2="29.2" />
        <g transform="translate(9.5 19)">
          <circle r="9" />
          <g>
            <circle r="5" />
            <circle r="5" transform="rotate(180)" />
            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="0.7s" repeatCount="indefinite" />
          </g>
        </g>
        <g transform="translate(24 19)">
          <g>
            <circle r="4" />
            <circle r="4" transform="rotate(180)" />
            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="0.7s" repeatCount="indefinite" />
          </g>
        </g>
        <g transform="translate(38.5 19)">
          <circle r="9" />
          <g>
            <circle r="5" />
            <circle r="5" transform="rotate(180)" />
            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="0.7s" repeatCount="indefinite" />
          </g>
        </g>
        <polyline points="14 3,18 3" />
        <polyline points="16 3,24 19,9.5 19,18 8,34 7,24 19" />
        <path d="m30,2h6s1,0,1,1-1,1-1,1" />
        <polyline points="32.5 2,38.5 19" />
      </g>
    </svg>
  );
}
