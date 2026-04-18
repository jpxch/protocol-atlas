import { ActivityPanel } from "@/components/dashboard/ActivityPanel";
import { ChartPanel } from "@/components/dashboard/ChartPanel";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AppShell } from "@/components/shell/AppShell";
import type {
  ApiAuditEventRecord,
  ApiOpportunityRecord
} from "@/types/api";
import styles from "./DashboardScreen.module.scss";

interface DashboardScreenProps {
  opportunities: readonly ApiOpportunityRecord[];
  auditEvents: readonly ApiAuditEventRecord[];
}

function parseUsd(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

export function DashboardScreen({
  opportunities,
  auditEvents
}: DashboardScreenProps) {
  const liveQueue = opportunities.length;
  const reviewPending = opportunities.filter(
    (opportunity) => opportunity.status === "review-pending"
  ).length;
  const blockedStates = opportunities.filter((opportunity) =>
    ["blocked", "failed", "expired"].includes(opportunity.status)
  ).length;
  const observedNetUsd = opportunities.reduce((sum, opportunity) => {
    return sum + parseUsd(opportunity.money.netUsd);
  }, 0);

  return (
    <AppShell>
      <div className={styles.root}>
        <section className={styles.metricsGrid}>
          <MetricCard
            label="Observed opportunities"
            value={String(liveQueue)}
            trend="live from postgres"
            status={
              <span className="status-chip status-chip--review">
                {liveQueue === 0 ? "No data yet" : "Observed"}
              </span>
            }
          />

          <MetricCard
            label="Review pending"
            value={String(reviewPending)}
            trend="needs operator attention"
            status={
              <span className="status-chip status-chip--review">
                {reviewPending === 0 ? "Clear" : "Pending"}
              </span>
            }
          />

          <MetricCard
            label="Blocked / failed / expired"
            value={String(blockedStates)}
            trend="safety state"
            status={
              <span className="status-chip status-chip--blocked">
                {blockedStates === 0 ? "None" : "Attention"}
              </span>
            }
          />

          <MetricCard
            label="Observed net USD"
            value={formatUsd(observedNetUsd)}
            trend="derived from stored rows"
            status={
              <span className="status-chip status-chip--ready">
                {observedNetUsd > 0 ? "Measured" : "Zero"}
              </span>
            }
          />
        </section>

        <section className={styles.lowerGrid}>
          <ChartPanel
            title="Net value by chain"
            subtitle="Derived from persisted opportunity records. No placeholder chart points remain."
            opportunities={opportunities}
          />

          <div className={styles.sideStack}>
            <ActivityPanel items={auditEvents} />

            <section className={`${styles.doctrinePanel} panel`}>
              <h3 className={styles.doctrineTitle}>Execution doctrine</h3>
              <p className={styles.doctrineText}>
                Buttons exist in the browser because the operator needs a control surface.
                Authority stays in the backend because auditability, validation, simulation,
                and execution safety must remain enforceable.
              </p>
            </section>
          </div>
        </section>
      </div>
    </AppShell>
  );
}