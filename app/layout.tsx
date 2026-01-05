import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { jaJP } from '@clerk/localizations';
import { inter, notoSansJP } from '@/lib/theme';
import ThemeRegistry from '@/lib/registry';
import './globals.css';

export const metadata: Metadata = {
  title: 'はじめて.AI REGAL - AI契約書レビューSaaS',
  description: '中小企業が安心して契約できる世界を作る。AIで契約書リスクを自動分析。',
  keywords: ['契約書', 'レビュー', 'AI', 'リスク分析', 'SaaS'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={jaJP}>
      <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
        <body>
          <ThemeRegistry>{children}</ThemeRegistry>
        </body>
      </html>
    </ClerkProvider>
  );
}
