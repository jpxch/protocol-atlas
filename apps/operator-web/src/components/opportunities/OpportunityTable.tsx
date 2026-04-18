import type { ApiOpportunityRecord, OperatorActionType } from '@/types/api';
import styles from './OpportunityTable.module.scss';

interface OpportunityTableProps {
  title: string;
  subtitle: string;
  opportunities: readonly ApiOpportunityRecord[];
  pendingActionKey: string | null;
  onActionRequest: (opportunityId: string, action: OperatorActionType) => Promise<void>;
}

function parseUsd(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function formatStatusLabel(status: ApiOpportunityRecord['status']): string {
  switch (status) {
    case 'review-pending':
      return 'Review pending';
    default:
      return status.replaceAll('-', ' ');
  }
}

function getStatusClass(status: ApiOpportunityRecord['status']) {
  switch (status) {
    case 'approved':
    case 'executed':
      return styles.statusReady;
    case 'discovered':
    case 'review-pending':
      return styles.statusReview;
    case 'blocked':
    case 'failed':
      return styles.statusBlocked;
    case 'simulating':
      return styles.statusSimulating;
    case 'expired':
    case 'skipped':
      return styles.statusDormant;
  }
}

function getFreshnessClass(freshness: ApiOpportunityRecord['freshness']) {
  switch (freshness) {
    case 'fresh':
      return styles.freshnessFresh;
    case 'aging':
      return styles.freshnessAging;
    case 'stale':
      return styles.freshnessStale;
  }
}

function getRiskClass(risk: ApiOpportunityRecord['riskLevel']) {
  switch (risk) {
    case 'low':
      return styles.riskLow;
    case 'medium':
      return styles.riskMedium;
    case 'high':
      return styles.riskHigh;
    case 'critical':
      return styles.riskCritical;
  }
}

export function OpportunityTable({
  title,
  subtitle,
  opportunities,
  pendingActionKey,
  onActionRequest,
}: OpportunityTableProps) {
  return (
    <section className={`${styles.wrapper} panel`}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <span className="kicker">{opportunities.length} visible</span>
      </div>

      <div className={styles.tableShell}>
        {opportunities.length === 0 ? (
          <div className={styles.emptyState}>
            No persisted opportunities match the current filters.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Opportunity</th>
                <th>Chain</th>
                <th>Protocol</th>
                <th>Kind</th>
                <th>Value</th>
                <th>Status</th>
                <th>Freshness</th>
                <th>Risk</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {opportunities.map((opportunity) => (
                <tr key={opportunity.id} className={styles.row}>
                  <td>
                    <div className={styles.primaryText}>
                      <span className={styles.titleText}>{opportunity.title}</span>
                      <span className={styles.metaText}>{opportunity.id}</span>
                    </div>
                  </td>

                  <td>{opportunity.chain}</td>
                  <td>{opportunity.protocolKey}</td>
                  <td>{opportunity.kind}</td>

                  <td>
                    <div className={styles.moneyStack}>
                      <span className={styles.moneyMain}>
                        {formatCurrency(parseUsd(opportunity.money.netUsd))}
                      </span>
                      <span className={styles.moneySub}>
                        Gross {formatCurrency(parseUsd(opportunity.money.grossUsd))}
                      </span>
                    </div>
                  </td>

                  <td>
                    <span className={`${styles.statusPill} ${getStatusClass(opportunity.status)}`}>
                      {formatStatusLabel(opportunity.status)}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`${styles.freshnessPill} ${getFreshnessClass(opportunity.freshness)}`}
                    >
                      {opportunity.freshness}
                    </span>
                  </td>

                  <td>
                    <span className={`${styles.riskPill} ${getRiskClass(opportunity.riskLevel)}`}>
                      {opportunity.riskLevel}
                    </span>
                  </td>

                  <td>{new Date(opportunity.updatedAt).toLocaleString()}</td>

                  <td>
                    <div className={styles.actions}>
                      {(['rescan', 'refresh-review', 'simulate', 'approve', 'skip'] as const).map(
                        (action) => {
                          const actionKey = `${opportunity.id}:${action}`;

                          return (
                            <button
                              key={action}
                              className={styles.actionButton}
                              onClick={() => onActionRequest(opportunity.id, action)}
                              type="button"
                              disabled={pendingActionKey === actionKey}
                            >
                              {pendingActionKey === actionKey
                                ? 'Requesting...'
                                : action.replaceAll('-', ' ')}
                            </button>
                          );
                        },
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
