export interface OpportunityFlowPoint {
  readonly label: string;
  readonly surfacedValue: number;
  readonly validatedValue: number;
}

export const opportunityFlowData: readonly OpportunityFlowPoint[] = [
  { label: 'Mon', surfacedValue: 420, validatedValue: 510 },
  { label: 'Tue', surfacedValue: 498, validatedValue: 566 },
  { label: 'Wed', surfacedValue: 472, validatedValue: 538 },
  { label: 'Thu', surfacedValue: 648, validatedValue: 498 },
  { label: 'Fri', surfacedValue: 578, validatedValue: 676 },
  { label: 'Sat', surfacedValue: 742, validatedValue: 582 },
  { label: 'Sun', surfacedValue: 688, validatedValue: 658 },
] as const;
