import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { getAuditEvents, getOpportunities } from '@/lib/api';

export default async function HomePage() {
  const [opportunitiesResponse, auditEventsResponse] = await Promise.all([
    getOpportunities(),
    getAuditEvents(),
  ]);

  return (
    <DashboardScreen
      opportunities={opportunitiesResponse.items}
      auditEvents={auditEventsResponse.items}
    />
  );
}
