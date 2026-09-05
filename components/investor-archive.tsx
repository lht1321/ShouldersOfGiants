'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SiteData } from '@/lib/types';

const percent = (value: number | null) => value == null ? '—' : `${(value * 100).toFixed(1)}%`;

const sortLabels = {
  name: '이름순',
  cagr: '연복리 수익률 높은순',
  excess: '시장 초과수익 높은순',
  sharpe: '샤프지수 높은순',
  drawdown: '최대 낙폭 낮은순',
  positions: '보유 종목 많은순',
  turnover: '회전율 낮은순',
} as const;

type SortKey = keyof typeof sortLabels;

const descendingNullable = (left: number | null, right: number | null) => {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return right - left;
};

const ascendingNullable = (left: number | null, right: number | null) => {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return left - right;
};

export function InvestorArchive({ data }: { data: SiteData }) {
  const [query, setQuery] = useState('');
  const [style, setStyle] = useState('all');
  const [sort, setSort] = useState<SortKey>('cagr');
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = data.investors.filter((investor) => {
      const matchesQuery = !needle || `${investor.representative} ${investor.manager}`.toLowerCase().includes(needle);
      return matchesQuery && (style === 'all' || investor.style === style);
    });

    return result.sort((left, right) => {
      let comparison = 0;
      if (sort === 'name') comparison = left.representative.localeCompare(right.representative, 'en');
      if (sort === 'cagr') comparison = descendingNullable(left.metrics.cagr, right.metrics.cagr);
      if (sort === 'excess') {
        const leftExcess = left.metrics.cagr != null && left.metrics.marketCagr != null ? left.metrics.cagr - left.metrics.marketCagr : null;
        const rightExcess = right.metrics.cagr != null && right.metrics.marketCagr != null ? right.metrics.cagr - right.metrics.marketCagr : null;
        comparison = descendingNullable(leftExcess, rightExcess);
      }
      if (sort === 'sharpe') comparison = descendingNullable(left.metrics.sharpe, right.metrics.sharpe);
      if (sort === 'drawdown') comparison = descendingNullable(left.metrics.maxDrawdown, right.metrics.maxDrawdown);
      if (sort === 'positions') comparison = right.positionCount - left.positionCount;
      if (sort === 'turnover') comparison = ascendingNullable(left.metrics.turnover, right.metrics.turnover);
      return comparison || left.representative.localeCompare(right.representative, 'en');
    });
  }, [data.investors, query, sort, style]);

  return (
    <div className="page-shell">
      <header className="page-heading archive-heading">
        <div><p className="eyebrow">INVESTOR ARCHIVE · {data.investorCount}</p><h1>거장 투자자 아카이브</h1><p>공개 13F에 남은 선택을 바탕으로 철학, 행동 패턴, 성과와 위험을 함께 읽습니다.</p></div>
        <div className="archive-controls">
          <label className="search-field"><Search size={17} /><span className="sr-only">투자자 검색</span><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름 또는 운용사 검색" /></label>
          <Select value={style} onValueChange={(value) => setStyle(String(value))}>
            <SelectTrigger className="archive-select" aria-label="투자 스타일 필터"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 투자 스타일</SelectItem>
              {data.styles.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => setSort(String(value) as SortKey)}>
            <SelectTrigger className="archive-select" aria-label="투자자 정렬"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(sortLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="result-count"><span>{filtered.length}명의 투자자 · {sortLabels[sort]}</span><span>수익률은 13F 공개 후 복제 기준</span></div>
      <section className="investor-grid" aria-live="polite">
        {filtered.map((investor) => (
          <Link href={`/investors/${investor.id}`} className="investor-card" key={investor.id}>
            <div className="investor-card-art">
              <Image src={investor.illustration} alt={`${investor.styleLabel} 스타일 일러스트`} width={460} height={300} />
              <span>{investor.styleLabel}</span>
            </div>
            <div className="investor-card-body">
              <p>{investor.manager}</p>
              <h2>{investor.representative}</h2>
              <div className="card-metrics"><div><span>CAGR</span><strong>{percent(investor.metrics.cagr)}</strong></div><div><span>SPY 대비</span><strong>{investor.metrics.cagr != null && investor.metrics.marketCagr != null ? percent(investor.metrics.cagr - investor.metrics.marketCagr) : '—'}</strong></div><div><span>종목</span><strong>{investor.positionCount || '—'}</strong></div></div>
              <p className="card-thesis">{investor.characteristics}</p>
              <span className="card-link">분석 읽기 <ArrowUpRight size={15} /></span>
            </div>
          </Link>
        ))}
      </section>
      {!filtered.length && <div className="no-results">검색 조건에 맞는 투자자가 없습니다.</div>}
    </div>
  );
}
