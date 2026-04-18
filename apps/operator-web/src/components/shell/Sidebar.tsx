import Link from 'next/link';
import styles from './Sidebar.module.scss';

const navItems = [
  {
    href: '/',
    title: 'Dashboard',
    meta: 'Control room overview, charts, health, and queue state',
    active: true,
  },
  {
    href: '/opportunities',
    title: 'Opportunities',
    meta: 'Review surfaced protocol opportunities and action context',
    active: false,
  },
  {
    href: '#',
    title: 'Reviews',
    meta: 'AI summaries, deterministic checks, and operator verdicts',
    active: false,
  },
  {
    href: '#',
    title: 'Execution',
    meta: 'Simulations, approvals, attempts, and execution history',
    active: false,
  },
] as const;

const protocols = [
  { name: 'Aave', state: 'Healthy' },
  { name: 'Uniswap V3', state: 'Healthy' },
  { name: 'Velodrome', state: 'Healthy' },
] as const;

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandBlock}>
        <span className={styles.brandKicker}>Operator Console</span>
        <h1 className={styles.brandTitle}>Protocol Atlas</h1>
        <p className={styles.brandText}>
          Permissionless onchain opportunity intelligence built as a calm, high-signal control room.
        </p>
      </div>

      <nav className={styles.nav} aria-label="Primary">
        <p className={styles.navLabel}>Navigation</p>

        {navItems.map((item) => {
          const className = item.active ? styles.navLinkActive : styles.navLink;

          return (
            <Link key={item.title} href={item.href} className={className}>
              <span className={styles.navTitle}>{item.title}</span>
              <span className={styles.navMeta}>{item.meta}</span>
            </Link>
          );
        })}
      </nav>

      <section className={`${styles.protocolPanel} panel`}>
        <h2 className={styles.protocolTitle}>Protocol health</h2>

        <div className={styles.protocolList}>
          {protocols.map((protocol) => (
            <div key={protocol.name} className={styles.protocolRow}>
              <span className={styles.protocolName}>{protocol.name}</span>
              <span className={styles.protocolState}>{protocol.state}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.footerCard} panel`}>
        <p className={styles.footerLabel}>Current operator</p>
        <p className={styles.footerValue}>Jorge</p>
        <p className={styles.footerText}>
          Browser buttons request actions. Backend validation, audit logging, and execution safety
          gates decide what actually happens.
        </p>
      </section>
    </aside>
  );
}
