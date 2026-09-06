'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CircleMinus, CirclePlus, SearchCheck } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { filterPositionChanges, summarizePositionChanges, type PositionChangeFilter } from '@/lib/position-changes';
import type { PositionChange, SiteData } from '@/lib/types';

const percent = (value: number | null, digits = 1) => value == null ? '—' : `${(value * 100).toFixed(digits)}%`;
const deltaPercent = (value: number | null, digits = 1) => value == null ? '신규' : `${value >= 0 ? '+' : ''}${(value * 100).toFixed(digits)}%`;
const actionIcon = (action: PositionChange['action']) => {
  if (action === '신규') return <CirclePlus />;
  if (action === '전량매도') return <CircleMinus />;
  if (action === '확대') return <ArrowUpRight />;
  if (action === '축소') return <ArrowDownRight />;
  return <CircleMinus />;
};

export function ChangesExplorer({ data }: { data: SiteData }) {
  const candidates = data.investors.filter((item) => item.changes.length);
  const [selectedId, setSelectedId] = useState(candidates.find((item) => item.id === 'berkshire')?.id || candidates[0]?.id);
  const [actionFilter, setActionFilter] = useState<PositionChangeFilter>('all');
  const [query, setQuery] = useState('');
  const investor = candidates.find((item) => item.id === selectedId) || candidates[0];
  const summary = summarizePositionChanges(investor.changes);
  const counts = summary.counts;
  const notable = investor.changes.filter((item) => item.action !== '유지').slice(0, 4);
  const filteredChanges = filterPositionChanges(investor.changes, actionFilter, query);
  const impactChanges = [...filteredChanges]
    .sort((left, right) => Math.abs(right.weightChange ?? 0) - Math.abs(left.weightChange ?? 0))
    .slice(0, 8);
  const maxImpact = Math.max(...impactChanges.map((change) => Math.abs(change.weightChange ?? 0)), 0.001);

  return (
    <div className="page-shell changes-shell">
      <header className="page-heading changes-heading">
        <div><p className="eyebrow">POSITION CHANGE LAB</p><h1>직전 분기, 무엇이 달라졌나</h1><p>주식 수 변화와 포트폴리오 비중 변화를 분리해 보고, 가능한 의사결정 배경을 데이터로 추정합니다.</p></div>
        <div className="changes-selector"><label htmlFor="changes-investor">분석할 투자자</label><Select value={selectedId} onValueChange={(value) => setSelectedId(String(value))}><SelectTrigger id="changes-investor"><SelectValue /></SelectTrigger><SelectContent>{candidates.map((item) => <SelectItem value={item.id} key={item.id}>{item.representative} · {item.manager}</SelectItem>)}</SelectContent></Select><small>{investor.previousPortfolioDate} → {investor.portfolioDate}</small></div>
      </header>

      <section className="change-summary">
        <div className="change-identity"><span>{investor.styleLabel}</span><h2>{investor.representative}</h2><p>{investor.manager}</p></div>
        <div data-action="신규"><CirclePlus /><span>신규</span><strong>{counts['신규']}</strong></div>
        <div data-action="확대"><ArrowUpRight /><span>확대</span><strong>{counts['확대']}</strong></div>
        <div data-action="축소"><ArrowDownRight /><span>축소</span><strong>{counts['축소']}</strong></div>
        <div data-action="전량매도"><CircleMinus /><span>전량매도</span><strong>{counts['전량매도']}</strong></div>
      </section>

      <section className="change-narratives">
        <div className="section-heading"><div><p>DATA-GROUNDED INFERENCE</p><h2>주요 변화와 가능한 이유</h2></div><span>확정 사유가 아닌 추정</span></div>
        <div className="narrative-grid">{notable.map((change) => <article key={`${change.ticker}-${change.action}`} data-action={change.action}><div className="narrative-top"><span className="action-icon">{actionIcon(change.action)}</span><div><strong>{change.ticker}</strong><small>{change.name}</small></div><em>{change.action}</em></div><div className="weight-move"><span>{percent(change.previousWeight)}</span><ArrowUpRight size={14} /><strong>{percent(change.currentWeight)}</strong><i>{deltaPercent(change.weightChange)}p</i></div><p>{change.inference}</p></article>)}</div>
      </section>

      <section className="change-impact-chart panel" aria-label="포지션 비중 변화 차트">
        <div className="section-heading"><div><p>WEIGHT IMPACT</p><h2>포트폴리오 비중 변화폭</h2></div><span>가운데 기준선 · %p</span></div>
        {impactChanges.length ? <div className="impact-bars">{impactChanges.map((change) => {
          const changeValue = change.weightChange ?? 0;
          const width = Math.abs(changeValue) / maxImpact * 50;
          return <div className="impact-row" key={`${change.ticker}-${change.action}`}><strong>{change.ticker}</strong><div className="impact-track"><i data-direction={changeValue >= 0 ? 'increase' : 'decrease'} style={{ width: `${width}%` }} /></div><span data-tone={changeValue >= 0 ? 'positive' : 'negative'}>{deltaPercent(change.weightChange, 2)}p</span></div>;
        })}</div> : <div className="no-data">선택한 조건에 해당하는 비중 변화가 없습니다.</div>}
      </section>

      <section className="changes-table panel">
        <div className="section-heading changes-table-heading"><div><p>QUARTER-OVER-QUARTER</p><h2>상위 포지션 변화</h2></div><span>{filteredChanges.length}건 · 주식 수 기준</span></div>
        <div className="change-controls">
          <div className="change-filter" aria-label="변화 유형 필터">{(['all', '신규', '확대', '축소', '전량매도', '유지'] as PositionChangeFilter[]).map((action) => <button type="button" aria-pressed={actionFilter === action} onClick={() => setActionFilter(action)} key={action}>{action === 'all' ? '전체' : action}</button>)}</div>
          <label className="change-search" htmlFor="change-search"><SearchCheck size={16} /><span className="sr-only">종목 검색</span><Input id="change-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="티커 또는 기업명 검색" /></label>
        </div>
        {filteredChanges.length ? <Table><TableHeader><TableRow><TableHead>종목</TableHead><TableHead>변화</TableHead><TableHead className="text-right">이전 비중</TableHead><TableHead className="text-right">현재 비중</TableHead><TableHead className="text-right">비중 변화</TableHead><TableHead className="text-right">주식 수 변화</TableHead></TableRow></TableHeader><TableBody>{filteredChanges.map((change) => <TableRow key={`${change.ticker}-${change.action}`}><TableCell><strong className="ticker-cell">{change.ticker}</strong><small>{change.name}</small></TableCell><TableCell><span className="action-badge" data-action={change.action}>{change.action}</span></TableCell><TableCell className="text-right font-mono text-muted-foreground">{percent(change.previousWeight, 2)}</TableCell><TableCell className="text-right font-mono">{percent(change.currentWeight, 2)}</TableCell><TableCell className="text-right font-mono" data-tone={(change.weightChange ?? 0) >= 0 ? 'positive' : 'negative'}>{deltaPercent(change.weightChange, 2)}p</TableCell><TableCell className="text-right font-mono">{deltaPercent(change.sharesChange, 1)}</TableCell></TableRow>)}</TableBody></Table> : <div className="no-data">검색 조건에 맞는 포지션 변화가 없습니다.</div>}
      </section>

      <aside className="inference-method">
        <SearchCheck size={22} /><div><strong>추정 방법</strong><p>가격 변화에 흔들리는 보고 시장가치가 아니라 주식 수의 증감을 먼저 분류하고, 비중 변화와 집중도를 함께 읽었습니다. 신규·전량매도 쌍은 CUSIP 변경이나 합병으로 생길 수도 있습니다.</p></div>
        <AlertTriangle size={18} /><div><strong>한계</strong><p>13F에는 매수·매도 시점, 평균단가, 경영진과의 대화, 숏·파생·현금 포지션이 없습니다. 실제 판단 근거를 확인하려면 투자자 서한과 인터뷰가 필요합니다.</p></div>
      </aside>
    </div>
  );
}
