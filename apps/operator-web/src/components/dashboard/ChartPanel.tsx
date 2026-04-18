'use client';

import dynamic from 'next/dynamic';
import type { OpportunityFlowPoint } from '@/types/dashboard';
import styles from './ChartPanel.module.scss';

const OpportunityFlowChart = dynamic(
  () => import('./OpportunityFlowChart.client').then((mod) => mod.OpportunityFlowChart),
  {
    ssr: false,
    loading: () => <div className={styles.loadingState}>Loading chart surface…</div>,
  },
);

interface ChartPanelProps {
  title: string;
  subtitle: string;
  data: readonly OpportunityFlowPoint[];
}

export function ChartPanel({ title, subtitle, data }: ChartPanelProps) {
  return (
    <section className={`${styles.panelRoot} panel`}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <span className="kicker">7 day view</span>
      </div>

      <div className={styles.chartHost}>
        <OpportunityFlowChart data={data} />
      </div>
    </section>
  );
}
