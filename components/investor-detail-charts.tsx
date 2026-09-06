'use client';

import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { Investor } from '@/lib/types';

const portfolioColors = ['#24527a', '#2f6f62', '#9a6a1f', '#66798a', '#8293a1', '#9faeb9', '#b9c4cc', '#d0d8de', '#e2e7eb'];

const performanceConfig = {
  investor: { label: '13F 복제', color: '#24527a' },
  market: { label: 'SPY', color: '#7a8792' },
} satisfies ChartConfig;

export function InvestorDetailCharts({ investor }: { investor: Investor }) {
  const portfolio = useMemo(
    () => investor.portfolio.map((holding, index) => ({
      ...holding,
      value: (holding.weight ?? 0) * 100,
      fill: portfolioColors[index % portfolioColors.length],
    })),
    [investor.portfolio],
  );
  const holdingsConfig = Object.fromEntries(
    portfolio.map((holding) => [holding.name, { label: holding.ticker || holding.name, color: holding.fill }]),
  ) satisfies ChartConfig;

  return (
    <section className="detail-charts" aria-label="투자자 성과와 포트폴리오 차트">
      <article className="panel detail-performance-chart">
        <div className="section-heading">
          <div><p>PERFORMANCE HISTORY</p><h2>13F 복제 수익률과 시장 비교</h2></div>
          <span>시작값 $100</span>
        </div>
        {investor.curve.length ? (
          <>
            <ChartContainer config={performanceConfig} className="h-[320px] w-full aspect-auto">
              <LineChart data={investor.curve} margin={{ left: 2, right: 16, top: 18, bottom: 6 }}>
                <CartesianGrid vertical={false} strokeDasharray="2 5" />
                <XAxis dataKey="date" tickFormatter={(value) => String(value).slice(0, 4)} minTickGap={46} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `$${value}`} width={58} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''} formatter={(value, name) => <><span className="text-muted-foreground">{performanceConfig[String(name) as keyof typeof performanceConfig]?.label || name}</span><span className="ml-auto font-mono">${Number(value).toFixed(1)}</span></>} />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line dataKey="investor" type="monotone" stroke="var(--color-investor)" strokeWidth={2.4} dot={false} connectNulls />
                <Line dataKey="market" type="monotone" stroke="var(--color-market)" strokeWidth={1.8} strokeDasharray="5 4" dot={false} connectNulls />
              </LineChart>
            </ChartContainer>
            <p className="chart-footnote">13F 제출 확인 후 다음 거래일 종가 리밸런싱 · 편도 5bp 비용 반영</p>
          </>
        ) : <div className="no-data">연속 수익률을 계산할 자료가 충분하지 않습니다.</div>}
      </article>

      <article className="panel detail-portfolio-chart">
        <div className="section-heading">
          <div><p>LATEST PORTFOLIO</p><h2>최근 공개 포트폴리오 비중</h2></div>
          <span>{investor.portfolioDate || 'N/A'}</span>
        </div>
        {portfolio.length ? (
          <>
            <ChartContainer config={holdingsConfig} className="mx-auto h-[245px] w-full max-w-[340px] aspect-auto">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value, name) => <><span>{String(name)}</span><span className="ml-auto font-mono">{Number(value).toFixed(1)}%</span></>} />} />
                <Pie data={portfolio} dataKey="value" nameKey="name" innerRadius={66} outerRadius={99} strokeWidth={3} />
              </PieChart>
            </ChartContainer>
            <div className="detail-holding-legend">{portfolio.slice(0, 8).map((holding) => <div key={`${holding.ticker}-${holding.name}`}><i style={{ background: holding.fill }} /><span>{holding.ticker || holding.name}</span><strong>{holding.value.toFixed(1)}%</strong></div>)}</div>
          </>
        ) : <div className="no-data">최근 포트폴리오 데이터가 없습니다.</div>}
      </article>
    </section>
  );
}
