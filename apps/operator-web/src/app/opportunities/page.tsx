import { OpportunitiesBoard } from '@/features/opportunities/OpportunitiesBoard';
import { getOpportunities } from '@/lib/api';

export default async function OpportunitiesPage() {
  const response = await getOpportunities();

  return <OpportunitiesBoard opportunities={response.items} />;
}
