import type { ReactNode } from 'react';
import styles from './MetricCard.module.scss';

interface MetricCardProps {
  label: string;
  value: string;
  status: ReactNode;
  trend: string;
}

export function MetricCard({ label, value, status, trend }: MetricCardProps) {
  return (
    <article className={`${styles.card} panel`}>
      <div className={styles.stack}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>

        <div className={styles.footer}>
          {status}
          <span className={styles.trend}>{trend}</span>
        </div>
      </div>
    </article>
  );
}
