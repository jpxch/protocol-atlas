'use client';

import { useMemo, useState } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import type {
  ApiChainKey,
  ApiScanRunRecord,
  ApiWatchlistTargetRecord,
  ScanRunsResponse,
  WatchlistTargetsResponse,
} from '@/types/api';
import styles from './WatchlistBoard.module.scss';

interface WatchlistBoardProps {
  readonly watchlistResponse: WatchlistTargetsResponse;
  readonly scanRunsResponse: ScanRunsResponse;
}

type ChainFilter = 'all' | ApiChainKey;
type ActiveStateFilter = 'all' | 'true' | 'false';

const CHAIN_OPTIONS: readonly ApiChainKey[] = [
  'ethereum',
  'arbitrum',
  'optimism',
  'base',
  'polygon',
] as const;

const NEW_TARGET_WINDOW_MS = 24 * 60 * 60 * 1000;
const STALE_TARGET_WINDOW_MS = 24 * 60 * 60 * 1000;

function readMetadataNumber(
  metadata: Readonly<Record<string, unknown>>,
  key: string,
): number | null {
  const value = metadata[key];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function readMetadataText(metadata: Readonly<Record<string, unknown>>, key: string): string {
  const value = metadata[key];

  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return '—';
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
}

function formatAddress(value: string): string {
  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function buildWatchlistUrl(input: {
  readonly chain: ChainFilter;
  readonly protocolKey: string;
  readonly source: string;
  readonly activeState: ActiveStateFilter;
  readonly search: string;
  readonly limit: string;
  readonly offset: number;
}): Route {
  const searchParams = new URLSearchParams();

  if (input.chain !== 'all') {
    searchParams.set('chain', input.chain);
  }

  const normalizedProtocolKey = input.protocolKey.trim();

  if (normalizedProtocolKey.length > 0 && normalizedProtocolKey !== 'all') {
    searchParams.set('protocolKey', normalizedProtocolKey);
  }

  const normalizedSource = input.source.trim();

  if (normalizedSource.length > 0 && normalizedSource !== 'all') {
    searchParams.set('source', normalizedSource);
  }

  if (input.activeState !== 'all') {
    searchParams.set('isActive', input.activeState);
  }

  const normalizedSearch = input.search.trim();

  if (normalizedSearch.length > 0) {
    searchParams.set('search', normalizedSearch);
  }

  const parsedLimit = Number.parseInt(input.limit, 10);

  if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
    searchParams.set('limit', String(parsedLimit));
  } else {
    searchParams.set('limit', '100');
  }

  if (input.offset > 0) {
    searchParams.set('offset', String(input.offset));
  }

  const query = searchParams.toString();

  return (query.length > 0 ? `/watchlist?${query}` : '/watchlist') as Route;
}

function collectProtocolOptions(items: readonly ApiWatchlistTargetRecord[]): string[] {
  return Array.from(new Set(items.map((item) => item.protocolKey))).sort((left, right) =>
    left.localeCompare(right),
  );
}

function collectSourceOptions(items: readonly ApiWatchlistTargetRecord[]): string[] {
  return Array.from(new Set(items.map((item) => item.source))).sort((left, right) =>
    left.localeCompare(right),
  );
}

function computeFailedReadCount(scanRuns: readonly ApiScanRunRecord[]): number {
  return scanRuns.reduce((sum, run) => {
    const failedTargets = readMetadataNumber(run.metadata, 'failedTargets');

    return sum + (failedTargets ?? 0);
  }, 0);
}

function computeSummaryMetrics(items: readonly ApiWatchlistTargetRecord[]) {
  const now = Date.now();

  let activeTargets = 0;
  let newlyDiscoveredTargets = 0;
  let staleTargets = 0;

  for (const item of items) {
    if (item.isActive) {
      activeTargets += 1;
    }

    const firstSeenDeltaMs = now - new Date(item.firstSeenAt).getTime();

    if (firstSeenDeltaMs <= NEW_TARGET_WINDOW_MS) {
      newlyDiscoveredTargets += 1;
    }

    const lastSeenDeltaMs = now - new Date(item.lastSeenAt).getTime();

    if (lastSeenDeltaMs > STALE_TARGET_WINDOW_MS) {
      staleTargets += 1;
    }
  }

  return {
    activeTargets,
    newlyDiscoveredTargets,
    staleTargets,
  };
}

export function WatchlistBoard({ watchlistResponse, scanRunsResponse }: WatchlistBoardProps) {
  const router = useRouter();

  const [search, setSearch] = useState(watchlistResponse.filters.search ?? '');
  const [chain, setChain] = useState<ChainFilter>(watchlistResponse.filters.chain ?? 'all');
  const [protocolKey, setProtocolKey] = useState(watchlistResponse.filters.protocolKey ?? 'all');
  const [source, setSource] = useState(watchlistResponse.filters.source ?? 'all');
  const [activeState, setActiveState] = useState<ActiveStateFilter>(
    watchlistResponse.filters.isActive === null
      ? 'all'
      : watchlistResponse.filters.isActive
        ? 'true'
        : 'false',
  );
  const [limit, setLimit] = useState(String(watchlistResponse.pagination.limit));

  const protocolOptions = useMemo(
    () => collectProtocolOptions(watchlistResponse.items),
    [watchlistResponse.items],
  );

  const sourceOptions = useMemo(
    () => collectSourceOptions(watchlistResponse.items),
    [watchlistResponse.items],
  );

  const summary = useMemo(
    () => computeSummaryMetrics(watchlistResponse.items),
    [watchlistResponse.items],
  );

  const failedReadCount = useMemo(
    () => computeFailedReadCount(scanRunsResponse.items),
    [scanRunsResponse.items],
  );

  const offset = watchlistResponse.pagination.offset;
  const currentPageSize = watchlistResponse.pagination.limit;
  const currentPage = Math.floor(offset / currentPageSize) + 1;
  const hasPreviousPage = offset > 0;
  const hasNextPage = offset + watchlistResponse.pagination.returned < watchlistResponse.count;

  function applyFilters() {
    const url = buildWatchlistUrl({
      chain,
      protocolKey,
      source,
      activeState,
      search,
      limit,
      offset: 0,
    });

    router.push(url);
  }

  function resetFilters() {
    setSearch('');
    setChain('all');
    setProtocolKey('all');
    setSource('all');
    setActiveState('all');
    setLimit('100');
    router.push('/watchlist');
  }

  function goToPreviousPage() {
    const nextOffset = Math.max(0, offset - currentPageSize);

    const url = buildWatchlistUrl({
      chain,
      protocolKey,
      source,
      activeState,
      search,
      limit,
      offset: nextOffset,
    });

    router.push(url);
  }

  function goToNextPage() {
    const nextOffset = offset + currentPageSize;

    const url = buildWatchlistUrl({
      chain,
      protocolKey,
      source,
      activeState,
      search,
      limit,
      offset: nextOffset,
    });

    router.push(url);
  }

  return (
    <AppShell>
      <div className={styles.root}>
        <section className={`${styles.filtersPanel} panel`}>
          <div className={styles.filtersHeader}>
            <div>
              <h1 className={styles.filtersTitle}>Watchlist command surface</h1>
              <p className={styles.filtersSubtitle}>
                Inspect tracked protocol targets, narrow the query surface, and correlate recent
                scanner activity with what the operator is seeing.
              </p>
            </div>

            <span className="kicker">Operator visibility</span>
          </div>

          <div className={styles.filtersGrid}>
            <label className={styles.field}>
              <span className={styles.label}>Address search</span>
              <input
                className={styles.input}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="0x…, partial address, or target fragment"
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
                {CHAIN_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Protocol</span>
              <select
                className={styles.select}
                value={protocolKey}
                onChange={(event) => setProtocolKey(event.target.value)}
              >
                <option value="all">All protocols</option>
                {protocolOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Source</span>
              <select
                className={styles.select}
                value={source}
                onChange={(event) => setSource(event.target.value)}
              >
                <option value="all">All sources</option>
                {sourceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Active state</span>
              <select
                className={styles.select}
                value={activeState}
                onChange={(event) => setActiveState(event.target.value as ActiveStateFilter)}
              >
                <option value="all">All states</option>
                <option value="true">active</option>
                <option value="false">inactive</option>
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Page size</span>
              <input
                className={styles.input}
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
                inputMode="numeric"
                placeholder="100"
              />
            </label>
          </div>

          <div className={styles.actionRow}>
            <button type="button" className={styles.primaryButton} onClick={applyFilters}>
              Apply filters
            </button>

            <button type="button" className={styles.secondaryButton} onClick={resetFilters}>
              Reset
            </button>

            <div className={styles.resultMeta}>
              <span>{watchlistResponse.count} total targets</span>
              <span>Page {currentPage}</span>
            </div>
          </div>
        </section>

        <section className={styles.metricsGrid}>
          <article className={`${styles.metricCard} panel`}>
            <span className={styles.metricLabel}>Active targets</span>
            <strong className={styles.metricValue}>{summary.activeTargets}</strong>
            <p className={styles.metricText}>
              Targets in the current result set still marked active.
            </p>
          </article>

          <article className={`${styles.metricCard} panel`}>
            <span className={styles.metricLabel}>Newly discovered</span>
            <strong className={styles.metricValue}>{summary.newlyDiscoveredTargets}</strong>
            <p className={styles.metricText}>
              First seen within the last 24 hours in this current result window.
            </p>
          </article>

          <article className={`${styles.metricCard} panel`}>
            <span className={styles.metricLabel}>Stale targets</span>
            <strong className={styles.metricValue}>{summary.staleTargets}</strong>
            <p className={styles.metricText}>
              Last seen more than 24 hours ago. This is an operator-view heuristic for now.
            </p>
          </article>

          <article className={`${styles.metricCard} panel`}>
            <span className={styles.metricLabel}>Recent failed reads</span>
            <strong className={styles.metricValue}>{failedReadCount}</strong>
            <p className={styles.metricText}>
              Summed from recent scan-run metadata where the scanner reported failed targets.
            </p>
          </article>
        </section>

        <div className={styles.contentGrid}>
          <section className={`${styles.tablePanel} panel`}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Tracked targets</h2>
                <p className={styles.panelSubtitle}>
                  Deterministic watchlist records persisted by the scanner and exposed to the
                  operator.
                </p>
              </div>

              <span className={styles.panelBadge}>
                {watchlistResponse.pagination.returned} shown
              </span>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Chain</th>
                    <th>Protocol</th>
                    <th>Source</th>
                    <th>State</th>
                    <th>First seen</th>
                    <th>Last seen</th>
                    <th>Health factor</th>
                    <th>Collateral base</th>
                    <th>Debt base</th>
                  </tr>
                </thead>

                <tbody>
                  {watchlistResponse.items.length === 0 ? (
                    <tr>
                      <td colSpan={10}>
                        <div className={styles.emptyState}>
                          No targets matched the current filters.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    watchlistResponse.items.map((item) => {
                      const healthFactor = readMetadataText(item.metadata, 'healthFactor');
                      const totalCollateralBase = readMetadataText(
                        item.metadata,
                        'totalCollateralBase',
                      );
                      const totalDebtBase = readMetadataText(item.metadata, 'totalDebtBase');

                      return (
                        <tr key={item.id}>
                          <td>
                            <div className={styles.addressCell}>
                              <span className={styles.addressFull}>{item.targetAddress}</span>
                              <span className={styles.addressShort}>
                                {formatAddress(item.targetAddress)}
                              </span>
                            </div>
                          </td>
                          <td>{item.chain}</td>
                          <td>{item.protocolKey}</td>
                          <td>{item.source}</td>
                          <td>
                            <span
                              className={
                                item.isActive ? styles.stateBadgeActive : styles.stateBadgeInactive
                              }
                            >
                              {item.isActive ? 'active' : 'inactive'}
                            </span>
                          </td>
                          <td>{formatDateTime(item.firstSeenAt)}</td>
                          <td>{formatDateTime(item.lastSeenAt)}</td>
                          <td>{healthFactor}</td>
                          <td>{totalCollateralBase}</td>
                          <td>{totalDebtBase}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.paginationRow}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={goToPreviousPage}
                disabled={!hasPreviousPage}
              >
                Previous
              </button>

              <span className={styles.paginationMeta}>
                Offset {watchlistResponse.pagination.offset} · Returned{' '}
                {watchlistResponse.pagination.returned} of {watchlistResponse.count}
              </span>

              <button
                type="button"
                className={styles.secondaryButton}
                onClick={goToNextPage}
                disabled={!hasNextPage}
              >
                Next
              </button>
            </div>
          </section>

          <section className={`${styles.scanRunsPanel} panel`}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Recent scan runs</h2>
                <p className={styles.panelSubtitle}>
                  Recent scanner executions for the current watchlist context.
                </p>
              </div>

              <span className={styles.panelBadge}>{scanRunsResponse.count} runs</span>
            </div>

            <div className={styles.scanRunList}>
              {scanRunsResponse.items.length === 0 ? (
                <div className={styles.emptyState}>No scan runs matched the current filters.</div>
              ) : (
                scanRunsResponse.items.map((run) => {
                  const discoveredTargets = readMetadataNumber(run.metadata, 'discoveredTargets');
                  const persistedTargets = readMetadataNumber(run.metadata, 'persistedTargets');
                  const failedTargets = readMetadataNumber(run.metadata, 'failedTargets');

                  return (
                    <article key={run.id} className={styles.scanRunCard}>
                      <div className={styles.scanRunTop}>
                        <div>
                          <p className={styles.scanRunTitle}>{run.scannerKey}</p>
                          <p className={styles.scanRunMeta}>
                            {run.protocolKey} · {run.chain}
                          </p>
                        </div>

                        <span
                          className={
                            run.status === 'completed'
                              ? styles.runStatusCompleted
                              : run.status === 'failed'
                                ? styles.runStatusFailed
                                : styles.runStatusStarted
                          }
                        >
                          {run.status}
                        </span>
                      </div>

                      <div className={styles.scanRunStats}>
                        <div>
                          <span className={styles.scanRunStatLabel}>Started</span>
                          <span className={styles.scanRunStatValue}>
                            {formatDateTime(run.startedAt)}
                          </span>
                        </div>

                        <div>
                          <span className={styles.scanRunStatLabel}>Completed</span>
                          <span className={styles.scanRunStatValue}>
                            {formatDateTime(run.completedAt)}
                          </span>
                        </div>

                        <div>
                          <span className={styles.scanRunStatLabel}>Opportunities</span>
                          <span className={styles.scanRunStatValue}>{run.opportunitiesFound}</span>
                        </div>

                        <div>
                          <span className={styles.scanRunStatLabel}>Discovered</span>
                          <span className={styles.scanRunStatValue}>
                            {discoveredTargets ?? '—'}
                          </span>
                        </div>

                        <div>
                          <span className={styles.scanRunStatLabel}>Persisted</span>
                          <span className={styles.scanRunStatValue}>{persistedTargets ?? '—'}</span>
                        </div>

                        <div>
                          <span className={styles.scanRunStatLabel}>Failed reads</span>
                          <span className={styles.scanRunStatValue}>{failedTargets ?? '—'}</span>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <section className={`${styles.notePanel} panel`}>
          <h2 className={styles.noteTitle}>Operator doctrine</h2>
          <p className={styles.noteText}>
            This screen is for visibility, narrowing, and review. It is not a trusted execution
            surface. The backend remains authoritative for scanner state, action validation, and
            future execution gates.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
