import { ActivityPanel } from '@/components/dashboard/ActivityPanel';
import { ChartPanel } from '@/components/dashboard/ChartPanel';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AppShell } from '@/components/shell/AppShell';
import { opportunityFlowData } from '@/types/dashboard';
import styles from './DashboardScreen.module.scss';

export function DashboardScreen() {
  return (
    <AppShell>
      <div className={styles.root}>
        <section className={styles.metricsGrid}>
          <MetricCard
            label="Live queue"
            value="12"
            trend="needs review"
            status={<span className="status-chip status-chip--review">Needs review</span>}
          />

          <MetricCard
            label="Ready to simulate"
            value="$2,481"
            trend="validated surfaces"
            status={<span className="status-chip status-chip--ready">Ready</span>}
          />

          <MetricCard
            label="Blocked or stale"
            value="4"
            trend="safety gate"
            status={<span className="status-chip status-chip--blocked">Blocked</span>}
          />

          <MetricCard
            label="Net realized trend"
            value="+$684"
            trend="7d outlook"
            status={<span className="status-chip status-chip--ready">Positive</span>}
          />
        </section>

        <section className={styles.lowerGrid}>
          <ChartPanel
            title="Opportunity flow"
            subtitle="Surfaced value versus validated value across the last seven days."
            data={opportunityFlowData}
          />

          <div className={styles.sideStack}>
            <ActivityPanel />

            <section className={`${styles.doctrinePanel} panel`}>
              <h3 className={styles.doctrineTitle}>Execution doctrine</h3>
              <p className={styles.doctrineText}>
                Buttons exist in the browser because the operator needs a control surface. Authority
                stays in the backend because auditability, validation, simulation, and execution
                safety must remain enforceable.
              </p>
            </section>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
