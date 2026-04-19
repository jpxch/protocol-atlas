'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { requestOperatorAction } from '@/lib/api';
import type {
  ApiLiquidationPlanRecord,
  ApiOpportunityRecord,
  ApiOpportunitySignal,
  LiquidationCandidatesResponse,
  LiquidationPlansResponse,
  OperatorActionType,
} from '@/types/api';
import styles from './LiquidationsBoard.module.scss';

interface LiquidationsBoardProps {
  readonly response: LiquidationCandidatesResponse;
  readonly plansResponse: LiquidationPlansResponse;
}

type SignalFilter = 'all' | ApiOpportunitySignal;
type RiskFilter = 'all' | ApiOpportunityRecord['riskLevel'];

interface CandidateDetails {
  readonly signal: ApiOpportunitySignal | 'unknown';
  readonly reason: string;
  readonly isExecutableNow: boolean;
  readonly healthFactor: string | null;
  readonly totalDebtUsd: string | null;
  readonly totalCollateralUsd: string | null;
  readonly maxRepayUsd: string | null;
  readonly liquidationBonusUsd: string | null;
  readonly netUsd: string | null;
  readonly caveat: string | null;
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Readonly<Record<string, unknown>>;
}

function readNested(payload: Readonly<Record<string, unknown>>, path: readonly string[]): unknown {
  let current: unknown = payload;

  for (const key of path) {
    const record = asRecord(current);

    if (!record || !(key in record)) {
      return undefined;
    }

    current = record[key];
  }

  return current;
}

function readText(payload: Readonly<Record<string, unknown>>, path: readonly string[]): string | null {
  const value = readNested(payload, path);

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return null;
}

function readBoolean(payload: Readonly<Record<string, unknown>>, path: readonly string[]): boolean {
  return readNested(payload, path) === true;
}

function readSignal(payload: Readonly<Record<string, unknown>>): ApiOpportunitySignal | 'unknown' {
  const value = readText(payload, ['marketSignal', 'classification']);

  switch (value) {
    case 'actionable':
    case 'watch-close':
    case 'low-margin':
      return value;
    default:
      return 'unknown';
  }
}

function getCandidateDetails(candidate: ApiOpportunityRecord): CandidateDetails {
  const payload = candidate.payload;

  return {
    signal: readSignal(payload),
    reason: readText(payload, ['marketSignal', 'reason']) ?? 'No signal note recorded.',
    isExecutableNow: readBoolean(payload, ['marketSignal', 'isExecutableNow']),
    healthFactor: readText(payload, ['accountData', 'healthFactorFormatted']),
    totalDebtUsd: readText(payload, ['liquidationEstimate', 'totalDebtUsd']),
    totalCollateralUsd: readText(payload, ['liquidationEstimate', 'totalCollateralUsd']),
    maxRepayUsd: readText(payload, ['liquidationEstimate', 'maxRepayUsd']),
    liquidationBonusUsd: readText(payload, ['liquidationEstimate', 'liquidationBonusUsd']),
    netUsd: readText(payload, ['liquidationEstimate', 'netUsd']) ?? candidate.money.netUsd,
    caveat: readText(payload, ['liquidationEstimate', 'caveat']),
  };
}

function parseUsd(value: string | null): number {
  const parsed = Number.parseFloat(value ?? '');

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatUsd(value: string | null): string {
  const parsed = parseUsd(value);

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(parsed);
}

function formatHealthFactor(value: string | null): string {
  const parsed = Number.parseFloat(value ?? '');

  if (!Number.isFinite(parsed)) {
    return 'n/a';
  }

  return parsed.toFixed(4);
}

function signalLabel(signal: CandidateDetails['signal']): string {
  switch (signal) {
    case 'actionable':
      return 'Actionable';
    case 'low-margin':
      return 'Low margin';
    case 'watch-close':
      return 'Watch close';
    default:
      return 'Unknown';
  }
}

function signalClass(signal: CandidateDetails['signal']): string {
  switch (signal) {
    case 'actionable':
      return styles.signalActionable ?? '';
    case 'low-margin':
      return styles.signalLowMargin ?? '';
    case 'watch-close':
      return styles.signalWatchClose ?? '';
    default:
      return styles.signalUnknown ?? '';
  }
}

function summarize(
  candidates: readonly ApiOpportunityRecord[],
  plansByCandidateId: ReadonlyMap<string, ApiLiquidationPlanRecord>,
) {
  let actionable = 0;
  let watchClose = 0;
  let lowMargin = 0;
  let executable = 0;
  let netUsd = 0;

  for (const candidate of candidates) {
    const details = getCandidateDetails(candidate);

    if (details.signal === 'actionable') {
      actionable += 1;
    }

    if (details.signal === 'watch-close') {
      watchClose += 1;
    }

    if (details.signal === 'low-margin') {
      lowMargin += 1;
    }

    if (details.isExecutableNow) {
      executable += 1;
    }

    netUsd += parseUsd(plansByCandidateId.get(candidate.id)?.netProfitUsd ?? details.netUsd);
  }

  return {
    actionable,
    watchClose,
    lowMargin,
    executable,
    netUsd,
  };
}

export function LiquidationsBoard({ response, plansResponse }: LiquidationsBoardProps) {
  const [search, setSearch] = useState('');
  const [signal, setSignal] = useState<SignalFilter>('all');
  const [risk, setRisk] = useState<RiskFilter>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);

  const plansByCandidateId = useMemo(() => {
    return new Map(plansResponse.items.map((plan) => [plan.candidateOpportunityId, plan]));
  }, [plansResponse.items]);

  const visibleCandidates = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return response.items.filter((candidate) => {
      const details = getCandidateDetails(candidate);
      const matchesSearch =
        normalizedSearch.length === 0 ||
        candidate.title.toLowerCase().includes(normalizedSearch) ||
        candidate.id.toLowerCase().includes(normalizedSearch) ||
        (candidate.targetAddress ?? '').toLowerCase().includes(normalizedSearch);
      const matchesSignal = signal === 'all' || details.signal === signal;
      const matchesRisk = risk === 'all' || candidate.riskLevel === risk;

      return matchesSearch && matchesSignal && matchesRisk;
    });
  }, [response.items, risk, search, signal]);

  const summary = useMemo(
    () => summarize(visibleCandidates, plansByCandidateId),
    [plansByCandidateId, visibleCandidates],
  );

  async function handleActionRequest(opportunityId: string, actionType: OperatorActionType) {
    const actionKey = `${opportunityId}:${actionType}`;

    setPendingActionKey(actionKey);
    setToast(null);
    setErrorToast(null);

    try {
      const result = await requestOperatorAction({
        opportunityId,
        actionType,
        requestedBy: 'jorge',
      });

      setToast(
        `Recorded ${result.data.actionType} request for ${result.data.opportunityId} at ${new Date(
          result.data.createdAt,
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
        <section className={`${styles.headerPanel} panel`}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.title}>Liquidation engine</h1>
              <p className={styles.subtitle}>
                Aave V3 borrowers ranked by health, candidate economics, and execution readiness.
              </p>
            </div>

            <span className="kicker">{response.count} candidates</span>
          </div>

          <div className={styles.metricsGrid}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Actionable</span>
              <strong className={styles.metricValue}>{summary.actionable}</strong>
            </div>

            <div className={styles.metric}>
              <span className={styles.metricLabel}>Executable now</span>
              <strong className={styles.metricValue}>{summary.executable}</strong>
            </div>

            <div className={styles.metric}>
              <span className={styles.metricLabel}>Watch close</span>
              <strong className={styles.metricValue}>{summary.watchClose}</strong>
            </div>

            <div className={styles.metric}>
              <span className={styles.metricLabel}>Best plan net</span>
              <strong className={styles.metricValue}>{formatUsd(String(summary.netUsd))}</strong>
            </div>
          </div>
        </section>

        <section className={`${styles.filtersPanel} panel`}>
          <label className={styles.field}>
            <span className={styles.label}>Search</span>
            <input
              className={styles.input}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Address, title, or opportunity id"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Signal</span>
            <select
              className={styles.select}
              value={signal}
              onChange={(event) => setSignal(event.target.value as SignalFilter)}
            >
              <option value="all">All signals</option>
              <option value="actionable">actionable</option>
              <option value="watch-close">watch-close</option>
              <option value="low-margin">low-margin</option>
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
        </section>

        {toast ? <div className={styles.toast}>{toast}</div> : null}
        {errorToast ? <div className={styles.errorToast}>{errorToast}</div> : null}

        <section className={`${styles.candidatesPanel} panel`}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Candidates</h2>
              <p className={styles.panelSubtitle}>
                Estimates are conservative placeholders until reserve-level debt, collateral, swap
                plans now select exact debt and collateral reserves; swap routing is still pending.
              </p>
            </div>

            <span className={styles.panelBadge}>{visibleCandidates.length} visible</span>
          </div>

          <div className={styles.candidateList}>
            {visibleCandidates.length === 0 ? (
              <div className={styles.emptyState}>No liquidation candidates match the filters.</div>
            ) : (
              visibleCandidates.map((candidate) => {
                const details = getCandidateDetails(candidate);
                const plan = plansByCandidateId.get(candidate.id);
                const simulateKey = `${candidate.id}:simulate`;
                const skipKey = `${candidate.id}:skip`;

                return (
                  <article key={candidate.id} className={styles.candidateCard}>
                    <div className={styles.cardTop}>
                      <div>
                        <div className={styles.cardBadges}>
                          <span className={`${styles.signalBadge} ${signalClass(details.signal)}`}>
                            {signalLabel(details.signal)}
                          </span>
                          <span className={styles.riskBadge}>{candidate.riskLevel}</span>
                        </div>

                        <h3 className={styles.cardTitle}>{candidate.title}</h3>
                        <p className={styles.cardMeta}>{candidate.targetAddress ?? candidate.id}</p>
                      </div>

                      <div className={styles.netBlock}>
                        <span className={styles.netLabel}>Best plan net</span>
                        <strong className={styles.netValue}>
                          {formatUsd(plan?.netProfitUsd ?? details.netUsd)}
                        </strong>
                      </div>
                    </div>

                    <div className={styles.statsGrid}>
                      <div>
                        <span className={styles.statLabel}>Health factor</span>
                        <strong className={styles.statValue}>
                          {formatHealthFactor(details.healthFactor)}
                        </strong>
                      </div>

                      <div>
                        <span className={styles.statLabel}>Max repay</span>
                        <strong className={styles.statValue}>{formatUsd(details.maxRepayUsd)}</strong>
                      </div>

                      <div>
                        <span className={styles.statLabel}>Bonus</span>
                        <strong className={styles.statValue}>
                          {formatUsd(details.liquidationBonusUsd)}
                        </strong>
                      </div>

                      <div>
                        <span className={styles.statLabel}>Total debt</span>
                        <strong className={styles.statValue}>{formatUsd(details.totalDebtUsd)}</strong>
                      </div>
                    </div>

                    {plan ? (
                      <div className={styles.planPanel}>
                        <div>
                          <span className={styles.statLabel}>Plan</span>
                          <strong className={styles.statValue}>
                            {plan.debtSymbol ?? 'debt'} to{' '}
                            {plan.collateralSymbol ?? 'collateral'}
                          </strong>
                        </div>

                        <div>
                          <span className={styles.statLabel}>Repay</span>
                          <strong className={styles.statValue}>
                            {formatUsd(plan.debtToCoverUsd)}
                          </strong>
                        </div>

                        <div>
                          <span className={styles.statLabel}>Seize</span>
                          <strong className={styles.statValue}>
                            {formatUsd(plan.estimatedCollateralSeizedUsd)}
                          </strong>
                        </div>

                        <div>
                          <span className={styles.statLabel}>Plan state</span>
                          <strong className={styles.statValue}>
                            {plan.status} / {plan.confidence}
                          </strong>
                        </div>

                        <p className={styles.planReason}>{plan.reason}</p>
                      </div>
                    ) : (
                      <div className={styles.planPanel}>
                        <p className={styles.planReason}>
                          No reserve-level plan has been persisted for this candidate yet.
                        </p>
                      </div>
                    )}

                    <p className={styles.reason}>{details.reason}</p>

                    {details.caveat ? <p className={styles.caveat}>{details.caveat}</p> : null}

                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.primaryAction}
                        disabled={pendingActionKey === simulateKey}
                        onClick={() => handleActionRequest(candidate.id, 'simulate')}
                      >
                        {pendingActionKey === simulateKey ? 'Requesting...' : 'Request simulation'}
                      </button>

                      <button
                        type="button"
                        className={styles.secondaryAction}
                        disabled={pendingActionKey === skipKey}
                        onClick={() => handleActionRequest(candidate.id, 'skip')}
                      >
                        {pendingActionKey === skipKey ? 'Skipping...' : 'Skip'}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
