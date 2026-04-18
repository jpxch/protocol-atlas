'use client';

import { useMemo, useState } from 'react';
import { OpportunityTable } from '@/components/opportunities/OpportunityTable';
import { AppShell } from '@/components/shell/AppShell';
import { requestOperatorAction } from '@/lib/api';
import type { ApiOpportunityRecord, OperatorActionType } from '@/types/api';
import styles from './OpportunitiesBoard.module.scss';

interface OpportunitiesBoardProps {
  opportunities: readonly ApiOpportunityRecord[];
}

type ChainFilter = 'all' | ApiOpportunityRecord['chain'];
type StatusFilter = 'all' | ApiOpportunityRecord['status'];
type RiskFilter = 'all' | ApiOpportunityRecord['riskLevel'];

export function OpportunitiesBoard({ opportunities }: OpportunitiesBoardProps) {
  const [search, setSearch] = useState('');
  const [chain, setChain] = useState<ChainFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [risk, setRisk] = useState<RiskFilter>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);

  const filteredOpportunities = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return opportunities.filter((opportunity) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        opportunity.title.toLowerCase().includes(normalizedSearch) ||
        opportunity.protocolKey.toLowerCase().includes(normalizedSearch) ||
        opportunity.id.toLowerCase().includes(normalizedSearch);

      const matchesChain = chain === 'all' || opportunity.chain === chain;
      const matchesStatus = status === 'all' || opportunity.status === status;
      const matchesRisk = risk === 'all' || opportunity.riskLevel === risk;

      return matchesSearch && matchesChain && matchesStatus && matchesRisk;
    });
  }, [search, chain, status, risk, opportunities]);

  async function handleActionRequest(opportunityId: string, actionType: OperatorActionType) {
    const actionKey = `${opportunityId}:${actionType}`;

    setPendingActionKey(actionKey);
    setToast(null);
    setErrorToast(null);

    try {
      const response = await requestOperatorAction({
        opportunityId,
        actionType,
        requestedBy: 'jorge',
      });

      setToast(
        `Recorded ${response.data.actionType} request for ${response.data.opportunityId} at ${new Date(
          response.data.createdAt,
        ).toLocaleString()}.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown request failure';

      setErrorToast(`Action request failed: ${message}`);
    } finally {
      setPendingActionKey(null);
    }
  }

  return (
    <AppShell>
      <div className={styles.root}>
        <section className={`${styles.filtersPanel} panel`}>
          <div className={styles.filtersHeader}>
            <div>
              <h1 className={styles.filtersTitle}>Opportunity board</h1>
              <p className={styles.filtersSubtitle}>
                Review persisted opportunities, narrow the field, and request deliberate
                backend-controlled actions.
              </p>
            </div>

            <span className="kicker">Real data surface</span>
          </div>

          <div className={styles.filtersGrid}>
            <label className={styles.field}>
              <span className={styles.label}>Search</span>
              <input
                className={styles.input}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, protocol, or id"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Chain</span>
              <select
                className={styles.select}
                value={chain}
                onChange={(event) => setChain(event.target.value as ChainFilter)}
              >
                <option value="all">All chains</option>
                <option value="ethereum">ethereum</option>
                <option value="arbitrum">arbitrum</option>
                <option value="optimism">optimism</option>
                <option value="base">base</option>
                <option value="polygon">polygon</option>
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Status</span>
              <select
                className={styles.select}
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusFilter)}
              >
                <option value="all">All statuses</option>
                <option value="discovered">discovered</option>
                <option value="review-pending">review-pending</option>
                <option value="simulating">simulating</option>
                <option value="approved">approved</option>
                <option value="skipped">skipped</option>
                <option value="blocked">blocked</option>
                <option value="expired">expired</option>
                <option value="executed">executed</option>
                <option value="failed">failed</option>
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Risk</span>
              <select
                className={styles.select}
                value={risk}
                onChange={(event) => setRisk(event.target.value as RiskFilter)}
              >
                <option value="all">All risk levels</option>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </select>
            </label>
          </div>
        </section>

        {toast ? <div className={styles.toast}>{toast}</div> : null}
        {errorToast ? <div className={styles.errorToast}>{errorToast}</div> : null}

        <OpportunityTable
          title="Visible opportunities"
          subtitle="This board is now backed by real API data. Empty means empty."
          opportunities={filteredOpportunities}
          pendingActionKey={pendingActionKey}
          onActionRequest={handleActionRequest}
        />

        <section className={`${styles.notePanel} panel`}>
          <h2 className={styles.noteTitle}>Interaction doctrine</h2>
          <p className={styles.noteText}>
            These buttons request backend work. They do not execute privileged actions in the
            browser. Every meaningful operator request should become a persisted record and an
            auditable event.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
