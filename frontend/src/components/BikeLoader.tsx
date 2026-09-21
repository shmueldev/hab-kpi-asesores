type Props = {
  label?: string
  compact?: boolean
}

export default function BikeLoader({ label = 'Pedaleando los datos…', compact = false }: Props) {
  return (
    <div className={`bike-loader${compact ? ' compact' : ''}`} role="status" aria-live="polite">
      <svg className="bike" viewBox="0 -4 48 36" width="280" height="auto" aria-hidden>
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1">
          <line className="bike__road" x1="1" y1="29.2" x2="47" y2="29.2" />

          <g transform="translate(9.5 19)">
            <circle className="bike__tire" r="9" />
            <g>
              <circle className="bike__spokes" r="5" />
              <circle className="bike__spokes" r="5" transform="rotate(180)" />
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 0 0"
                to="360 0 0"
                dur="0.5s"
                repeatCount="indefinite"
              />
            </g>
          </g>

          <g transform="translate(24 19)">
            <g>
              <circle className="bike__pedals" r="4" />
              <circle className="bike__pedals" r="4" transform="rotate(180)" />
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 0 0"
                to="360 0 0"
                dur="0.5s"
                repeatCount="indefinite"
              />
            </g>
          </g>

          <g transform="translate(38.5 19)">
            <circle className="bike__tire" r="9" />
            <g>
              <circle className="bike__spokes" r="5" />
              <circle className="bike__spokes" r="5" transform="rotate(180)" />
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 0 0"
                to="360 0 0"
                dur="0.5s"
                repeatCount="indefinite"
              />
            </g>
          </g>

          <polyline className="bike__seat" points="14 3,18 3" />
          <polyline className="bike__body" points="16 3,24 19,9.5 19,18 8,34 7,24 19" />
          <path className="bike__handlebars" d="m30,2h6s1,0,1,1-1,1-1,1" />
          <polyline className="bike__front" points="32.5 2,38.5 19" />

          <g className="bike__rider">
            <circle cx="17.1" cy="-0.2" r="1.75" />
            <line x1="16.8" y1="1.5" x2="16.2" y2="3" />
            <line x1="16.7" y1="1.65" x2="31.8" y2="2.2" />
          </g>
        </g>
      </svg>
      <p>{label}</p>
    </div>
  )
}
