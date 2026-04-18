import Link from 'next/link';
import styles from './AtlasShell.module.scss';

const opportunities = [
  {
    name: 'Aave V3 liquidation window',
    chain: 'Arbitrum',
    protocol: 'Aave',
    value: '$842.19',
    status: 'Ready',
  },
  {
    name: 'Unclaimed rewards batch',
    chain: 'Base',
    protocol: 'Velodrome',
    value: '$191.44',
    status: 'Review',
  },
  {
    name: 'Stale fee collection',
    chain: 'Optimism',
    protocol: 'Uniswap V3',
    value: '$74.08',
    status: 'Blocked',
  },
] as const;

const recentEvents = [
  {
    title: 'Scan run completed',
    meta: '14 protocol surfaces checked · 3 opportunities promoted to review',
  },
  {
    title: 'Operator action recorded',
    meta: 'Jorge approved simulation for opportunity atlas_arb_aave_001',
  },
  {
    title: 'Execution remains gated',
    meta: 'No privileged action can bypass backend validation or audit recording',
  },
] as const;

export function AtlasShell() {
  return (
    <main className={styles.root}>
      <div className="page-frame">
        <header className={styles.header}>
          <div className={styles.headingBlock}>
            <span className="kicker">Protocol Atlas · Operator Control Room</span>
            <h1 className={styles.title}>Forgotten value, surfaced with discipline.</h1>
            <p className={styles.subtitle}>
              Protocol Atlas is the control room for permissionless onchain opportunities. Jorge
              gets graphs, queues, and buttons. The browser stays the interface. The backend stays
              the executor.
            </p>
          </div>

          <aside className={`${styles.operatorCard} panel`}>
            <p className={styles.operatorLabel}>Current role</p>
            <p className={styles.operatorName}>Operator · Jorge</p>
            <p className={styles.operatorMeta}>
              Review opportunities, inspect history, trigger simulation, approve execution
              workflows, and keep the machine honest.
            </p>
          </aside>
        </header>

        <section className={styles.heroGrid}>
          <article className={`${styles.heroPanel} panel`}>
            <h2 className={styles.heroPanelTitle}>System posture</h2>
            <p className={styles.heroPanelText}>
              This UI is intentionally built like a command deck, not a portfolio toy. The mission
              is to organize signal, preserve auditability, and let operators act with context
              instead of clicking blind.
            </p>
          </article>

          <article className={`${styles.heroPanel} panel`}>
            <h2 className={styles.heroPanelTitle}>Immediate actions</h2>
            <div className={styles.actionRow}>
              <button className={styles.primaryAction}>Run scan</button>
              <button className={styles.secondaryAction}>Open queue</button>
              <Link href="/opportunities" className={styles.secondaryAction}>
                View opportunities
              </Link>
            </div>
          </article>
        </section>

        <section className={styles.metricsGrid}>
          <article className={`${styles.metricCard} panel`}>
            <div className={styles.metricStack}>
              <span className="metric-label">Live queue</span>
              <span className="metric-value">12</span>
              <span className="status-chip status-chip--review">Needs review</span>
            </div>
          </article>

          <article className={`${styles.metricCard} panel`}>
            <div className={styles.metricStack}>
              <span className="metric-label">Ready to simulate</span>
              <span className="metric-value">$2,481</span>
              <span className="status-chip status-chip--ready">Valid surfaces</span>
            </div>
          </article>

          <article className={`${styles.metricCard} panel`}>
            <div className={styles.metricStack}>
              <span className="metric-label">Blocked or stale</span>
              <span className="metric-value">4</span>
              <span className="status-chip status-chip--blocked">Safety gate</span>
            </div>
          </article>

          <article className={`${styles.metricCard} panel`}>
            <div className={styles.metricStack}>
              <span className="metric-label">Net realized trend</span>
              <span className="metric-value">+$684</span>
              <span className="status-chip status-chip--ready">7d outlook</span>
            </div>
          </article>
        </section>

        <section className={styles.mainGrid}>
          <article className={`${styles.tablePanel} panel`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Opportunity queue</h2>
              <Link href="/opportunities" className="kicker">
                Open full board
              </Link>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Opportunity</th>
                  <th>Chain</th>
                  <th>Protocol</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((item) => (
                  <tr key={item.name}>
                    <td className={styles.opportunityName}>{item.name}</td>
                    <td>{item.chain}</td>
                    <td>{item.protocol}</td>
                    <td>{item.value}</td>
                    <td>
                      <span
                        className={[
                          'status-chip',
                          item.status === 'Ready'
                            ? 'status-chip--ready'
                            : item.status === 'Review'
                              ? 'status-chip--review'
                              : 'status-chip--blocked',
                        ].join(' ')}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <div className={styles.sideStack}>
            <aside className={`${styles.sidePanel} panel`}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Recent events</h2>
              </div>

              <div className={styles.logList}>
                {recentEvents.map((event) => (
                  <div key={event.title} className={styles.logItem}>
                    <p className={styles.logTitle}>{event.title}</p>
                    <p className={styles.logMeta}>{event.meta}</p>
                  </div>
                ))}
              </div>
            </aside>

            <aside className={`${styles.sidePanel} panel`}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Execution doctrine</h2>
              </div>
              <p className={styles.logMeta}>
                Buttons live here. Authority does not. Every privileged action must flow through
                backend validation, audit logging, and safety gates before any execution attempt
                exists.
              </p>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
