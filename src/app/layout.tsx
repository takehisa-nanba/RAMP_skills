import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="ja">
      <body className="min-h-screen bg-slate-100/70 text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
        {children}
      </body>
    </html>
  );
}
