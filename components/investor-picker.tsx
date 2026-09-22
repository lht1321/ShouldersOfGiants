'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { findInvestors, investorSortLabels, type InvestorSort } from '@/lib/investor-directory';
import type { Investor } from '@/lib/types';

type Props = {
  investors: Investor[];
  selectedId: string;
  onSelect: (id: string) => void;
  idPrefix: string;
};

export function InvestorPicker({ investors, selectedId, onSelect, idPrefix }: Props) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<InvestorSort>('cagr');
  const matches = useMemo(() => findInvestors(investors.map((item) => ({
    id: item.id,
    representative: item.representative,
    manager: item.manager,
    cagr: item.metrics.cagr,
    marketCagr: item.metrics.marketCagr,
    sharpe: item.metrics.sharpe,
    maxDrawdown: item.metrics.maxDrawdown,
    positionCount: item.positionCount,
    turnover: item.metrics.turnover,
  })), query, sort), [investors, query, sort]);

  return (
    <section className="investor-picker" aria-label="투자자 검색 및 정렬">
      <div className="investor-picker-controls">
        <label htmlFor={`${idPrefix}-search`}>투자자 검색
          <span className="investor-picker-search"><Search size={16} /><Input id={`${idPrefix}-search`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름 또는 운용사 검색" /></span>
        </label>
        <label htmlFor={`${idPrefix}-sort`}>투자자 정렬
          <Select value={sort} onValueChange={(value) => setSort(value as InvestorSort)}>
            <SelectTrigger id={`${idPrefix}-sort`} aria-label="투자자 정렬"><SelectValue>{investorSortLabels[sort]}</SelectValue></SelectTrigger>
            <SelectContent>{Object.entries(investorSortLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </label>
      </div>
      <p className="investor-picker-count" aria-live="polite">{matches.length}명 · {investorSortLabels[sort]}</p>
      <div className="investor-picker-list" aria-label="투자자 검색 결과">
        {matches.map((item) => <button type="button" aria-pressed={selectedId === item.id} onClick={() => onSelect(item.id)} key={item.id}><strong>{item.representative}</strong><span>{item.manager}</span></button>)}
        {!matches.length && <p>검색 조건에 맞는 투자자가 없습니다.</p>}
      </div>
    </section>
  );
}
