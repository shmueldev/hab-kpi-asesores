import { useEffect, useMemo, useState } from 'react'
import { useChatDock } from '../chat/ChatContext'
import { TOUR_KEY } from '../tour'

type Step = {
  target: string
  title: string
  text: string
  points?: string[]
  chat?: 'open' | 'close'
}

type Props = {
  ready: boolean
  isAdmin: boolean
  replayToken?: number
}

export default function OnboardingTour({ ready, isAdmin, replayToken = 0 }: Props) {
  const chat = useChatDock()
  const steps = useMemo<Step[]>(() => {
    const list: Step[] = [
      {
        target: '[data-tour="header"]',
        title: 'Esta es tu plataforma de asesores',
        text: 'Aquí se mide el desempeño comercial contra presupuesto, el año anterior y el canal de autogestión. Los datos salen de bdhabEngineer, no de un Excel suelto.',
        points: [
          'Arriba ves quién eres (gerente o asesor) y el periodo activo.',
          'Un asesor solo ve su cartera. Un gerente puede ver el consolidado o a alguien en particular.',
        ],
      },
      {
        target: '[data-tour="filters"]',
        title: 'Elige el periodo antes de leer números',
        text: 'El tablero no es “todo el histórico”. Primero fijas año y recorte.',
        points: [
          'Q1 a Q4 son trimestres de 3 meses.',
          'Si un Q aún no empieza, queda apagado. Pasa el mouse: te dice por qué.',
          'Año muestra lo que va del año, no los 12 meses si todavía no terminan.',
          'Debajo ves las fechas exactas que se están consultando.',
        ],
      },
    ]
    if (isAdmin) {
      list.push({
        target: '[data-tour="asesor"]',
        title: 'Filtro de asesor (gerente)',
        text: 'Todos es la casa completa. Si eliges un nombre, las tres señales y las tablas pasan a esa cartera.',
        points: [
          'Cambia de asesor y espera la primera carga de ese filtro.',
          'Si vuelves al mismo asesor y periodo, no deberías esperar de nuevo: ya quedó en caché.',
        ],
      })
    }
    list.push(
      {
        target: '[data-tour="source"]',
        title: 'De dónde sale el dato',
        text: 'La franja de color te dice la fuente. No es decoración.',
        points: [
          'Señal en vivo: se acaba de leer SQL (bdhabEngineer). La primera vez de un filtro tarda.',
          'Snapshot guardado: se reutilizó un resultado ya calculado (memoria, disco o Redis).',
          'Si SQL falla, se intenta el último snapshot de ese mismo periodo y asesor. No se inventa un demo.',
        ],
      },
      {
        target: '[data-tour="cumplimiento"]',
        title: 'Cumplimiento de presupuesto',
        text: 'Responde: ¿la venta internacional cubrió la meta del periodo?',
        points: [
          'Fórmula: venta internacional ÷ meta.',
          'Verde si llegas o pasas el 100%. Rojo si vas abajo.',
          'La barra es el avance, no un ranking contra otros asesores.',
        ],
      },
      {
        target: '[data-tour="crecimiento"]',
        title: 'Crecimiento en dinero',
        text: 'Compara las ventas de este recorte con el mismo recorte del año pasado.',
        points: [
          'Fórmula: (ventas actuales ÷ ventas año anterior) − 1.',
          'Positivo es más plata que el año pasado. Negativo es caída.',
          'No es crecimiento de clientes ni de tickets: es dinero.',
        ],
      },
      {
        target: '[data-tour="autogestion"]',
        title: 'Autogestión',
        text: 'Qué parte de la venta internacional entró por el canal de autogestión.',
        points: [
          'Fórmula: venta autogestión ÷ venta internacional.',
          'No usa la meta. Solo el mix de canal.',
          'Si la venta internacional es 0, este % no tiene sentido: el periodo está vacío.',
        ],
      },
      {
        target: '[data-tour="charts"]',
        title: 'Las gráficas son el mismo dato, no otro',
        text: 'Barras y dona repiten meta vs venta, actual vs año anterior, y el mix de canal.',
        points: [
          'Sirven para ver la brecha de un vistazo.',
          'Clic en la gráfica abre el mismo detalle que la tarjeta.',
        ],
      },
      {
        target: '[data-tour="table"]',
        title: 'La tabla explica el porqué',
        text: 'El % de arriba no basta. Aquí ves los montos que lo producen.',
        points: [
          'Cumplimiento: meta, venta internacional y el %.',
          'Crecimiento: ventas de ahora, ventas del año anterior y la diferencia.',
          'Autogestión: canal vs el resto de la venta internacional.',
        ],
      },
      {
        target: '[data-tour="cards"]',
        title: 'Entra al detalle de un KPI',
        text: 'Clic en una tarjeta o en “Ver detalle” abre una página solo de ese indicador.',
        points: [
          'Ahí se repite la fórmula, la tabla de montos y la gráfica grande.',
          'Cartera abre aging, Siesa y canceladas en la misma página de detalle.',
          'Volver te regresa al tablero. No hay sección aparte de Cartera.',
        ],
      },
      {
        target: '[data-tour="chat"]',
        title: 'Chat, siempre a la derecha',
        text: 'No es otra página. La pestaña Chat se queda fija. Un toque abre el panel; otro toque lo cierra.',
        points: [
          'Pregunta por el periodo que ya cargaste: “¿cómo va el cumplimiento?”.',
          'Si no hay modelo contratado, responde con el snapshot (ayuda local). No inventa cifras.',
          'No hay botón de chat en el encabezado: usa la pestaña de la derecha.',
        ],
        chat: 'open',
      },
      {
        target: '[data-tour="theme"]',
        title: 'Claro o Dark',
        text: 'Dark es un tablero oscuro de lectura (navy HAB), no un efecto de neón. En oscuro los títulos y valores van en blanco para que se lean.',
        chat: 'close',
      },
      {
        target: '[data-tour="password"]',
        title: 'Tu contraseña',
        text: 'La primera vez entras con una clave temporal. Cámbiala aquí. También puedes recuperarla si olvidas la tuya (con tu usuario y tu asesor_key).',
      },
      {
        target: '[data-tour="guia"]',
        title: 'Puedes repetir esta guía',
        text: 'Cuando quieras, pulsa Guía. Recorre otra vez filtros, KPIs, tablas, detalle y chat. No tapa la cicla de carga: espera a que haya datos.',
        points: [
          'Primera carga de un filtro nuevo: espera (el asesor va por ese Q).',
          'Volver a un filtro ya visto: debe salir al instante.',
          'Listo. Ya puedes medir.',
        ],
      },
    )
    return list
  }, [isAdmin])

  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [box, setBox] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!ready) return
    if (replayToken > 0) {
      setIndex(0)
      setOpen(true)
      return
    }
    if (localStorage.getItem(TOUR_KEY) === '1') return
    const timer = window.setTimeout(() => setOpen(true), 400)
    return () => window.clearTimeout(timer)
  }, [ready, replayToken])

  useEffect(() => {
    if (!open) return
    const step = steps[index]
    if (!step) return
    const el = document.querySelector(step.target)
    if (!el && index < steps.length - 1) {
      setIndex((i) => i + 1)
      return
    }
    if (step.chat === 'open') chat.show()
    if (step.chat === 'close') chat.close()
    function place() {
      const node = document.querySelector(steps[index]?.target)
      if (node instanceof HTMLElement) {
        node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
        setBox(node.getBoundingClientRect())
      } else {
        setBox(null)
      }
    }
    place()
    const later = window.setTimeout(place, 280)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.clearTimeout(later)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
    // chat methods are stable enough for step changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, steps])

  if (!open) return null
  const step = steps[index]
  if (!step) return null

  function finish() {
    localStorage.setItem(TOUR_KEY, '1')
    if (chat.open) chat.close()
    setOpen(false)
  }

  const pad = 8
  const highlight = box
    ? {
        top: Math.max(8, box.top - pad),
        left: Math.max(8, box.left - pad),
        width: Math.min(box.width + pad * 2, window.innerWidth - 16),
        height: Math.min(box.height + pad * 2, window.innerHeight - 16),
      }
    : null

  const panelOnLeft = box ? box.left > window.innerWidth * 0.55 : false
  const panelBelow = box ? box.bottom + 280 < window.innerHeight : true
  const panelStyle = panelOnLeft
    ? { top: Math.max(16, (box?.top ?? 80) - 8), right: 24, left: 'auto' as const }
    : {
        top: panelBelow ? Math.min((box?.bottom ?? 80) + 16, window.innerHeight - 320) : 24,
        left: 24,
        right: 'auto' as const,
      }

  return (
    <div className="tour-root">
      <div className="tour-dim" />
      {highlight && <div className="tour-spot" style={highlight} />}
      <aside className="tour-panel neon-card" style={panelStyle}>
        <p className="tour-step">
          Paso {index + 1} de {steps.length}
        </p>
        <h2>{step.title}</h2>
        <p>{step.text}</p>
        {step.points && (
          <ul className="tour-points">
            {step.points.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        <div className="tour-actions">
          <button type="button" className="ghost" onClick={finish}>
            Saltar
          </button>
          <button type="button" className="ghost" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
            Anterior
          </button>
          {index < steps.length - 1 ? (
            <button type="button" onClick={() => setIndex((i) => i + 1)}>
              Siguiente
            </button>
          ) : (
            <button type="button" onClick={finish}>
              Entendido
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}
