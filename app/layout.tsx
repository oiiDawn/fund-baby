import './globals.css';
import AnalyticsGate from './components/AnalyticsGate';
import packageJson from '../package.json';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `养基小宝 V${packageJson.version}`,
  description: '输入基金编号添加基金，实时显示估值与前10重仓'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const GA_ID = 'G-PD2JWJHVEM';

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('theme');
                if (saved) {
                  document.documentElement.setAttribute('data-theme', saved);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <AnalyticsGate GA_ID={GA_ID} />
        {children}
      </body>
    </html>
  );
}
