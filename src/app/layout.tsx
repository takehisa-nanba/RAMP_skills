import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '700'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
});

export const metadata: Metadata = {
  title: 'RAMP デジタルスキルダッシュボード | 浜松市ソリューションピッチ＆ミートアップ',
  description: '就労移行支援における「持続可能な作業周期」と企業要件の双方向接続ダッシュボード（PoCプロトタイプ）',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body className={`${notoSansJP.className} min-h-screen bg-slate-100/70 text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900`}>
        {children}
      </body>
    </html>
  );
}
