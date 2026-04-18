import styles from './Topbar.module.scss';

export function Topbar() {
  return (
    <header className={`${styles.topbar} panel`}>
      <div className={styles.headingBlock}>
        <span className={styles.kicker}>Dashboard</span>
        <h2 className={styles.title}>Forgotten value, surfaced with discipline.</h2>
        <p className={styles.subtitle}>
          The operator sees charts, queue state, recent actions, and protocol health. The browser is
          the control surface. The backend remains the execution authority.
        </p>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.metaChip}>
          <span className={styles.dotReady} />
          system healthy
        </span>

        <span className={styles.metaChip}>
          <span className={styles.dotInfo} />
          12 queued opportunities
        </span>

        <span className={styles.metaChip}>builder · Orlando</span>
        <span className={styles.metaChip}>operator · Jorge</span>
      </div>
    </header>
  );
}
