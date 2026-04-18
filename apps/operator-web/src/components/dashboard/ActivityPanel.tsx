import type { ApiAuditEventRecord } from '@/types/api';
import styles from './ActivityPanel.module.scss';

interface ActivityPanelProps {
  items: readonly ApiAuditEventRecord[];
}

function formatEventTitle(eventType: string): string {
  switch (eventType) {
    case 'operator_action_requested':
      return 'Operator action requested';
    default:
      return eventType.replaceAll('_', ' ');
  }
}

export function ActivityPanel({ items }: ActivityPanelProps) {
  return (
    <section className={`${styles.panelRoot} panel`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Recent events</h3>
        <span className="kicker">Audit trail</span>
      </div>

      <div className={styles.list}>
        {items.length === 0 ? (
          <article className={styles.item}>
            <p className={styles.itemTitle}>No audit events recorded yet</p>
            <p className={styles.itemMeta}>
              Operator requests, scan history, simulation events, and execution outcomes will appear
              here once they are persisted.
            </p>
          </article>
        ) : (
          items.map((event) => (
            <article key={event.id} className={styles.item}>
              <p className={styles.itemTitle}>{formatEventTitle(event.eventType)}</p>
              <p className={styles.itemMeta}>
                Entity: {event.entityType} · Actor: {event.actorId ?? 'system'} ·{' '}
                {new Date(event.createdAt).toLocaleString()}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
