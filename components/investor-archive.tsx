'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SiteData } from '@/lib/types';

const percent = (value: number | null) => value == null ? '—' : `${(value * 100).toFixed(1)}%`;

export function InvestorArchive({ data }: { data: SiteData }) {
  const [query, setQuery] = useState('');
  const [style, setStyle] = useState('all');
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.investors.filter((investor) => {
      const matchesQuery = !needle || `${investor.representative} ${investor.manager}`.toLowerCase().includes(needle);
      return matchesQuery && (style === 'all' || investor.style === style);
    });
  }, [data.investors, query, style]);

  return (
    <div className="page-shell">
      <header className="page-heading archive-heading">
        <div><p className="eyebrow">INVESTOR ARCHIVE · {data.investorCount}</p><h1>거장 투자자 아카이브</h1><p>공개 13F에 남은 선택을 바탕으로 철학, 행동 패턴, 성과와 위험을 함께 읽습니다.</p></div>
        <div className="archive-controls">
          <label className="search-field"><Search size={17} /><span className="sr-only">투자자 검색</span><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름 또는 운용사 검색" /></label>
          <Select value={style} onValueChange={(value) => setStyle(String(value))}>
            <SelectTrigger className="archive-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 투자 스타일</SelectItem>
              {data.styles.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="result-count"><span>{filtered.length}명의 투자자</span><span>수익률은 13F 공개 후 복제 기준</span></div>
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
