import type { ReactNode } from 'react';
import styles from './AppShell.module.scss';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.root}>
      <div className={styles.frame}>
        <Sidebar />

        <div className={styles.content}>
          <div className={styles.contentInner}>
            <Topbar />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
