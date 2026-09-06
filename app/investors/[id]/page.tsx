import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CalendarDays, Layers3 } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { InvestorPortrait } from '@/components/investor-portrait';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getInvestor, siteData } from '@/lib/site-data';

export function generateStaticParams() {
  return siteData.investors.map((investor) => ({ id: investor.id }));
}

const percent = (value: number | null, digits = 1) => value == null ? '—' : `${(value * 100).toFixed(digits)}%`;
const money = (value: number | null) => {
  if (value == null) return '—';
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toLocaleString('en-US')}`;
};

export default async function InvestorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const investor = getInvestor(id);
  if (!investor) notFound();
  const excess = investor.metrics.cagr != null && investor.metrics.marketCagr != null ? investor.metrics.cagr - investor.metrics.marketCagr : null;

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <article className="detail-shell">
        <Link href="/investors" className="back-link"><ArrowLeft size={15} /> 투자자 아카이브</Link>
        <header className="profile-hero">
          <div className={`profile-art ${investor.illustration ? 'has-portrait' : ''}`}><InvestorPortrait name={investor.representative} styleLabel={investor.styleLabel} src={investor.illustration} subject={investor.illustrationSubject} width={520} height={520} priority /><span>{investor.illustrationSubject ? `${investor.illustrationSubject} 일러스트` : '이름 기반 프로필'}</span></div>
          <div className="profile-copy">
            <p className="eyebrow">{investor.styleLabel.toUpperCase()}</p>
            <h1>{investor.representative}</h1>
            <h2>{investor.manager}</h2>
            <p className="profile-lead">{investor.characteristics}</p>
            <div className="principle-list">{investor.principles.map((principle, index) => <span key={principle}><i>0{index + 1}</i>{principle}</span>)}</div>
          </div>
        </header>

        <section className="profile-scoreboard">
          <div><span>복제 CAGR</span><strong>{percent(investor.metrics.cagr, 2)}</strong><small>SPY {percent(investor.metrics.marketCagr, 2)}</small></div>
          <div><span>시장 대비</span><strong data-tone={(excess ?? 0) >= 0 ? 'positive' : 'negative'}>{excess == null ? '—' : `${excess >= 0 ? '+' : ''}${percent(excess, 2)}`}</strong><small>연복리 차이</small></div>
          <div><span>최대 낙폭</span><strong>{percent(investor.metrics.maxDrawdown, 2)}</strong><small>변동성 {percent(investor.metrics.volatility, 1)}</small></div>
          <div><span>회전율</span><strong>{percent(investor.metrics.turnover, 1)}</strong><small>연평균</small></div>
          <div><span>데이터 커버리지</span><strong>{percent(investor.metrics.mappingCoverage, 1)}</strong><small>신뢰도 {investor.metrics.confidence || '—'}</small></div>
        </section>

        <div className="detail-columns">
          <section className="article-body">
            <p className="section-kicker">STYLE DOSSIER</p>
            {investor.analysis.map((section, index) => <section key={section.title}><span className="article-index">0{index + 1}</span><div><h2>{section.title}</h2><p>{section.body}</p></div></section>)}
            <aside className="risk-callout"><AlertTriangle size={19} /><div><strong>읽을 때 주의할 점</strong><p>{siteData.methodology.limitations} 따라서 이 분석은 실제 운용 전체가 아니라 공개된 롱 주식 슬리브의 행동을 설명합니다.</p></div></aside>
          </section>

          <aside className="profile-sidebar">
            <div className="sidebar-stat"><CalendarDays size={18} /><div><span>최근 보고 분기</span><strong>{investor.portfolioDate || '—'}</strong></div></div>
            <div className="sidebar-stat"><Layers3 size={18} /><div><span>공개 포지션</span><strong>{investor.positionCount.toLocaleString('ko-KR')}개</strong></div></div>
            <div className="sidebar-note"><p>복제 규칙</p><span>{siteData.methodology.delay}</span><span>거래비용 {siteData.methodology.cost}</span><span>벤치마크 {siteData.methodology.benchmark}</span></div>
          </aside>
        </div>

        <section className="detail-holdings">
          <div className="section-heading"><div><p>RECENT DISCLOSURE</p><h2>최근 포트폴리오 상위 종목</h2></div><span>{investor.portfolioDate || 'N/A'}</span></div>
          <Table>
            <TableHeader><TableRow><TableHead>종목</TableHead><TableHead>기업명</TableHead><TableHead className="text-right">포트폴리오 비중</TableHead><TableHead className="text-right">보고 시장가치</TableHead></TableRow></TableHeader>
            <TableBody>{investor.portfolio.filter((holding) => holding.name !== '기타').map((holding) => <TableRow key={`${holding.ticker}-${holding.name}`}><TableCell className="font-mono text-primary">{holding.ticker || 'CUSIP'}</TableCell><TableCell>{holding.name}</TableCell><TableCell className="text-right font-mono">{percent(holding.weight, 2)}</TableCell><TableCell className="text-right font-mono text-muted-foreground">{money(holding.valueUsd)}</TableCell></TableRow>)}</TableBody>
          </Table>
        </section>
      </article>
    </main>
  );
}
