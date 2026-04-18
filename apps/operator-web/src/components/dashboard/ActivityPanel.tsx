import styles from './ActivityPanel.module.scss';

const recentEvents = [
  {
    title: 'Scan run completed',
    meta: '14 protocol surfaces checked · 3 opportunities promoted to review',
  },
  {
    title: 'Operator action recorded',
    meta: 'Jorge approved simulation for atlas_arb_aave_001',
  },
  {
    title: 'Execution remains gated',
    meta: 'Privileged action still requires backend validation, audit logging, and preflight checks',
  },
] as const;

export function ActivityPanel() {
  return (
    <section className={`${styles.panelRoot} panel`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Recent events</h3>
        <span className="kicker">Live log</span>
      </div>

      <div className={styles.list}>
        {recentEvents.map((event) => (
          <article key={event.title} className={styles.item}>
            <p className={styles.itemTitle}>{event.title}</p>
            <p className={styles.itemMeta}>{event.meta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
