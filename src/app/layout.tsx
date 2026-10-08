import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'EventScope · Panta research workspace', description: 'Observe prediction markets and export reproducible evidence. An independent workspace powered by Panta.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
