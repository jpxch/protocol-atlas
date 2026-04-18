'use client';

import dynamic from 'next/dynamic';
import type { ApiOpportunityRecord } from '@/types/api';
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
  opportunities: readonly ApiOpportunityRecord[];
}

export function ChartPanel({ title, subtitle, opportunities }: ChartPanelProps) {
  return (
    <section className={`${styles.panelRoot} panel`}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <span className="kicker">Live data</span>
      </div>

      <div className={styles.chartHost}>
        <OpportunityFlowChart opportunities={opportunities} />
      </div>
    </section>
  );
}
