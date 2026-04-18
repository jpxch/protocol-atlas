import Link from 'next/link';

export default function OpportunitiesPage() {
  return (
    <main className="page-frame" style={{ padding: '32px 0 48px' }}>
      <div className="panel" style={{ padding: '24px' }}>
        <span className="kicker">Opportunity Board</span>
        <h1
          style={{
            margin: '14px 0 10px',
            color: 'var(--atlas-text-strong)',
            fontSize: 'var(--text-2xl)',
            letterSpacing: '-0.03em',
          }}
        >
          Full queue coming next
        </h1>
        <p
          style={{
            margin: 0,
            color: 'var(--atlas-text-muted)',
            lineHeight: 1.7,
          }}
        >
          This route exists now so the App Router has a real second surface. In the next slice, we
          will turn it into the full review board with filters, charts, protocol grouping, and
          action drawers.
        </p>

        <div style={{ marginTop: '20px' }}>
          <Link href="/" className="kicker">
            Return to control room
          </Link>
        </div>
      </div>
    </main>
  );
}
