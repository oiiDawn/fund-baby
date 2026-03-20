import './globals.css';
import AnalyticsGate from './components/analytics-gate';
import { Toaster } from '@/components/ui/sonner';
import packageJson from '../package.json';
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: `养基小宝 V${packageJson.version}`,
  description: '输入基金编号添加基金，实时显示估值与前10重仓',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const GA_ID = 'G-PD2JWJHVEM';

  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={cn('font-sans', geist.variable)}
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('theme');
                if (saved) {
                  document.documentElement.setAttribute('data-theme', saved);
                  document.documentElement.classList.toggle('dark', saved !== 'light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        style={
          {
            '--font-body':
              '"PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", "Segoe UI", sans-serif',
            '--font-mono':
              '"IBM Plex Mono", "Cascadia Code", "JetBrains Mono", "SFMono-Regular", ui-monospace, monospace',
          } as React.CSSProperties
        }
      >
        <AnalyticsGate GA_ID={GA_ID} />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
