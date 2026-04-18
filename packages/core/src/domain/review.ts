export type ReviewSource = 'deterministic' | 'ai' | 'operator';
export type ReviewVerdict = 'approve' | 'skip' | 'needs-simulation' | 'needs-rescan' | 'blocked';

export interface ReviewRecord {
  readonly id: string;
  readonly opportunityId: string;
  readonly source: ReviewSource;
  readonly verdict: ReviewVerdict | null;
  readonly summary: string | null;
  readonly createdAt: string;
  readonly data: Readonly<Record<string, unknown>>;
}
