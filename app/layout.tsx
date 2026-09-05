import type { Metadata } from 'next';
import './globals.css';

// Root metadata and the Korean document language are shared by every route.

export const metadata: Metadata = {
  title: 'Shoulders of Giants · 13F 투자자 분석',
  description: '거장 투자자의 13F 포트폴리오, 복제 수익률, 레짐별 예산 배분을 한곳에서 분석합니다.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
