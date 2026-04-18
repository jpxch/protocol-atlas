import type { Metadata } from 'next';
import './globals.scss';

export const metadata: Metadata = {
  title: 'Protocol Atlas',
  description: 'Permissionless onchain opportunity intelligence and operator control room',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
