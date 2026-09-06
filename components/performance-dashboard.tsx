'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BarChart3, ShieldCheck, Sparkles } from 'lucide-react';
import { CartesianGrid, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SiteData } from '@/lib/types';
import { InvestorPortrait } from '@/components/investor-portrait';

const portfolioColors = ['#24527a', '#2f6f62', '#9a6a1f', '#66798a', '#8293a1', '#9faeb9', '#b9c4cc', '#d0d8de', '#e2e7eb'];

const performanceConfig = {
  investor: { label: '13F 복제', color: '#24527a' },
  market: { label: 'SPY', color: '#7a8792' },
} satisfies ChartConfig;

const percent = (value: number | null, digits = 2) => value == null ? '—' : `${(value * 100).toFixed(digits)}%`;
const signedPercent = (value: number | null) => value == null ? '—' : `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;

function Metric({ label, value, detail, tone = 'neutral' }: { label: string; value: string; detail: string; tone?: 'neutral' | 'positive' | 'negative' }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong data-tone={tone}>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

export function PerformanceDashboard({ data }: { data: SiteData }) {
  const [selectedId, setSelectedId] = useState('berkshire');
  const investor = data.investors.find((item) => item.id === selectedId) ?? data.investors[0];
  const portfolio = useMemo(
    () => investor.portfolio.map((holding, index) => ({ ...holding, value: (holding.weight ?? 0) * 100, fill: portfolioColors[index % portfolioColors.length] })),
    [investor],
  );
  const holdingsConfig = Object.fromEntries(portfolio.map((item) => [item.name, { label: item.ticker || item.name, color: item.fill }])) satisfies ChartConfig;
  const excess = investor.metrics.cagr != null && investor.metrics.marketCagr != null ? investor.metrics.cagr - investor.metrics.marketCagr : null;
  const latestCurve = investor.curve.at(-1);

  return (
    <div className="dashboard-shell">
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow"><Sparkles size={14} /> 13F RESEARCH TERMINAL</p>
          <h1>거장의 어깨 위에서<br />포트폴리오를 읽다</h1>
        </div>
        <div className="intro-note">
          <span className="pulse" /> 최신 분석 기준 <strong>{data.regime.reportDate.slice(0, 7)}</strong>
          <small>13F 공개일 이후 매매 가정 · 배당 재투자 · 비용 반영</small>
        </div>
      </section>

      <section className="investor-strip" aria-label="선택한 투자자">
        <InvestorPortrait name={investor.representative} styleLabel={investor.styleLabel} src={investor.illustration} subject={investor.illustrationSubject} width={150} height={150} priority />
        <div className="investor-copy">
          <p>{investor.manager.toUpperCase()}</p>
          <h2>{investor.representative}</h2>
          <div className="tag-row"><span>{investor.styleLabel}</span>{investor.principles.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div>
        </div>
        <div className="investor-select">
          <label htmlFor="investor-picker">분석할 투자자 · {data.investorCount}명</label>
          <Select value={selectedId} onValueChange={(value) => setSelectedId(String(value))}>
            <SelectTrigger id="investor-picker" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {data.investors.map((item) => <SelectItem value={item.id} key={item.id}>{item.representative} · {item.manager}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="metric-grid" aria-label="핵심 성과 지표">
        <Metric label="연복리 수익률" value={percent(investor.metrics.cagr)} detail={`SPY ${percent(investor.metrics.marketCagr)}`} tone={(investor.metrics.cagr ?? 0) >= (investor.metrics.marketCagr ?? 0) ? 'positive' : 'neutral'} />
        <Metric label="시장 대비 연복리" value={signedPercent(excess)} detail={investor.metrics.start && investor.metrics.end ? `${investor.metrics.start.slice(0, 4)} — ${investor.metrics.end.slice(0, 4)}` : '백테스트 자료 부족'} tone={(excess ?? 0) >= 0 ? 'positive' : 'negative'} />
        <Metric label="최대 낙폭" value={percent(investor.metrics.maxDrawdown)} detail={`SPY 대비 위험 · 변동성 ${percent(investor.metrics.volatility)}`} />
        <Metric label="평균 회전율" value={percent(investor.metrics.turnover)} detail={`매핑 커버리지 ${percent(investor.metrics.mappingCoverage, 1)}`} />
      </section>

      <section className="analytics-grid">
        <article className="panel performance-panel">
          <div className="panel-heading">
            <div><p>누적 성장</p><h3>$100의 성장 경로</h3></div>
            <div className="confidence"><ShieldCheck size={15} /> 데이터 신뢰도 {investor.metrics.confidence || '확인 필요'}</div>
          </div>
          {investor.curve.length ? (
            <ChartContainer config={performanceConfig} className="h-[330px] w-full aspect-auto">
              <LineChart data={investor.curve} margin={{ left: 0, right: 12, top: 16, bottom: 4 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 5" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={38} tickFormatter={(value) => String(value).slice(0, 4)} />
                <YAxis tickLine={false} axisLine={false} width={48} domain={['auto', 'auto']} tickFormatter={(value) => `$${Math.round(Number(value))}`} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''} formatter={(value, name) => <><span className="text-muted-foreground">{performanceConfig[String(name) as keyof typeof performanceConfig]?.label || name}</span><span className="ml-auto font-mono">${Number(value).toFixed(1)}</span></>} />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line dataKey="investor" type="monotone" stroke="var(--color-investor)" strokeWidth={3} dot={false} />
                <Line dataKey="market" type="monotone" stroke="var(--color-market)" strokeWidth={2} dot={false} strokeDasharray="6 5" />
              </LineChart>
            </ChartContainer>
          ) : <div className="no-data">연속 가격·매핑 기준을 충족한 수익률 구간이 없습니다.</div>}
          {latestCurve && <p className="chart-footnote">최근 누적값 · 복제 ${latestCurve.investor?.toFixed(1)} / SPY ${latestCurve.market?.toFixed(1)}</p>}
        </article>

        <article className="panel holdings-panel">
          <div className="panel-heading">
            <div><p>최근 13F · {investor.positionCount}개 종목</p><h3>포트폴리오 분포</h3></div>
            <span className="quarter">{investor.portfolioDate?.slice(0, 7) || 'N/A'}</span>
          </div>
          {portfolio.length ? (
            <>
              <ChartContainer config={holdingsConfig} className="mx-auto h-[230px] w-full max-w-[310px] aspect-auto">
                <PieChart><ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value, name) => <><span>{String(name)}</span><span className="ml-auto font-mono">{Number(value).toFixed(1)}%</span></>} />} /><Pie data={portfolio} dataKey="value" nameKey="name" innerRadius={64} outerRadius={94} strokeWidth={3} /></PieChart>
              </ChartContainer>
              <div className="holding-list">
                {portfolio.slice(0, 6).map((holding) => <div key={`${holding.name}-${holding.ticker}`}><span><i style={{ background: holding.fill }} />{holding.ticker || holding.name}</span><strong>{holding.value.toFixed(1)}%</strong></div>)}
              </div>
            </>
          ) : <div className="no-data">최근 13F 포트폴리오가 없습니다.</div>}
        </article>
      </section>

      <section className="insight-bar">
        <div className="insight-icon"><BarChart3 size={21} /></div>
        <div><p>데이터가 말하는 투자 성향</p><strong>{investor.characteristics}</strong></div>
        <Link href={`/investors/${investor.id}`}>상세 리포트 <ArrowUpRight size={16} /></Link>
      </section>

      <p className="legal-note">과거 성과는 미래 수익을 보장하지 않습니다. 본 화면은 공개 13F 자료를 이용한 연구용 시뮬레이션이며 개인화된 투자자문이 아닙니다.</p>
    </div>
  );
}
