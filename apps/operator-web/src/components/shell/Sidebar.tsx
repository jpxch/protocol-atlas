'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.scss';

const navItems = [
  {
    href: '/',
    title: 'Dashboard',
    meta: 'Control room overview, charts, health, and queue state',
  },
  {
    href: '/opportunities',
    title: 'Opportunities',
    meta: 'Review surfaced opportunities and request backend actions',
  },
  {
    href: '/watchlist',
    title: 'Watchlist',
    meta: 'Inspect tracked targets, filters, scan runs, and target freshness',
  },
] as const;

const protocols = [
  { name: 'Aave', state: 'pending' },
  { name: 'Uniswap V3', state: 'pending' },
  { name: 'Velodrome', state: 'pending' },
] as const;

export function Sidebar() {
  const pathname = usePathname();

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
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          const className = isActive ? styles.navLinkActive : styles.navLink;

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
          Browser actions request backend workflows. Validation, audit logging, and safety gates
          decide what actually happens.
        </p>
      </section>
    </aside>
  );
}
