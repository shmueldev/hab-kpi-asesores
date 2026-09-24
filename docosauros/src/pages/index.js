import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import HabBike from '@site/src/components/HabBike';
import styles from './index.module.css';

const chips = ['bdhabEngineer', 'RescueAI', 'Redis por día'];

const kpis = [
  {label: 'Cumplimiento', hint: 'venta / meta'},
  {label: 'Crecimiento', hint: 'vs año anterior'},
  {label: 'Autogestión', hint: 'canal pedido'},
  {label: 'Cartera abierta', hint: 'año de documento'},
];

const cards = [
  {
    title: 'Tablero HAB',
    body: 'Cuatro KPIs en 2×2, cartera abierta según el año y el detalle con las mismas fórmulas de bdhabEngineer.',
    to: '/docs/tablero',
  },
  {
    title: 'Cartera real',
    body: 'UnoEE y Siesa por separado. El asesor solo ve su portafolio. Los dos hechos nunca se cruzan.',
    to: '/docs/cartera',
  },
  {
    title: 'Chat RescueAI',
    body: 'El agente habla del asesor en sesión, con gráficas y voz. Solo alias rescue-*. Nunca OpenAI.',
    to: '/docs/chat',
  },
  {
    title: 'Uso diario',
    body: 'Redis guarda un hash por día: pantallas visitadas. Sin hover ni texto del chat. Solo el admin lo ve.',
    to: '/docs/uso',
  },
];

const steps = [
  {n: '01', title: 'Instalar', to: '/docs/instalar'},
  {n: '02', title: 'Tablero y KPIs', to: '/docs/kpis'},
  {n: '03', title: 'Cartera y pedidos', to: '/docs/cartera'},
  {n: '04', title: 'Chat y uso', to: '/docs/chat'},
];

export default function Home() {
  return (
    <Layout
      title="Documentación"
      description="Guía de HAB KPI Asesores: tablero, KPIs, cartera, chat RescueAI y uso diario.">
      <header className={styles.hero}>
        <div className={styles.aurora} />
        <div className={styles.gridFade} />
        <div className="container">
          <div className={styles.heroGrid}>
            <div className={styles.copy}>
              <p className={styles.kicker}>Señal comercial</p>
              <Heading as="h1" className={styles.title}>
                Desempeño de asesores
              </Heading>
              <p className={styles.lead}>
                Guía de HAB KPI: el tablero, las fórmulas, la cartera sin cruces inventados y el chat RescueAI.
              </p>
              <div className={styles.actions}>
                <Link className={styles.primary} to="/docs/intro">
                  Abrir la guía
                </Link>
                <Link className={styles.ghost} to="/docs/instalar">
                  Instalar
                </Link>
              </div>
              <ul className={styles.chips}>
                {chips.map((chip) => (
                  <li key={chip}>{chip}</li>
                ))}
              </ul>
            </div>
            <div className={styles.visual}>
              <div className={styles.board}>
                <div className={styles.boardHead}>
                  <span>HAB KPI</span>
                  <HabBike className={styles.bike} />
                </div>
                <div className={styles.kpiGrid}>
                  {kpis.map((kpi) => (
                    <div className={styles.kpi} key={kpi.label}>
                      <strong>{kpi.label}</strong>
                      <em>{kpi.hint}</em>
                      <span className={styles.spark} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.section}>
          <div className="container">
            <p className={styles.kicker}>Producto</p>
            <Heading as="h2" className={styles.sectionTitle}>
              Lo que cubre la guía
            </Heading>
            <div className={styles.cards}>
              {cards.map((card, i) => (
                <Link className={styles.card} to={card.to} key={card.title} style={{'--delay': `${0.08 * i}s`}}>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.path}>
          <div className="container">
            <p className={styles.kicker}>Recorrido</p>
            <Heading as="h2" className={styles.sectionTitle}>
              Cómo leerla
            </Heading>
            <ol className={styles.steps}>
              {steps.map((step) => (
                <li key={step.n}>
                  <Link to={step.to}>
                    <span>{step.n}</span>
                    {step.title}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
    </Layout>
  );
}
