'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Coins, Gauge, Users } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InvestorPicker } from '@/components/investor-picker';
import { buildAllocation, type AllocationInput } from '@/lib/allocation';
import { parseBudgetInput } from '@/lib/budget-input';
import type { SiteData } from '@/lib/types';

const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
const budgetPresets = [10_000, 50_000, 100_000, 500_000];

type WebMCPContext = {
  registerTool: (tool: {
    name: string;
    title: string;
    description: string;
    inputSchema: object;
    annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
    execute: (input: unknown) => Promise<unknown>;
  }, options: { signal: AbortSignal }) => void | Promise<void>;
};

export function AllocatorClient({ data }: { data: SiteData }) {
  const [budget, setBudget] = useState(100_000);
  const [budgetDraft, setBudgetDraft] = useState('100000');
  const [budgetError, setBudgetError] = useState('');
  const [sourceId, setSourceId] = useState('regime');
  const selectedInvestor = data.investors.find((item) => item.id === sourceId);
  const isRegime = sourceId === 'regime';
  const positions = useMemo<AllocationInput[]>(() => {
    if (isRegime) return data.consensus.map((item) => ({ ticker: item.ticker, name: item.ticker, weight: item.weight, price: item.price, managerCount: item.managerCount }));
    return (selectedInvestor?.calculator || []).map((item) => ({ ticker: item.ticker, name: item.name, weight: item.weight || 0, price: item.price, estimatedPrice: item.estimatedPrice }));
  }, [data.consensus, isRegime, selectedInvestor]);
  const exposure = isRegime ? data.regime.equityExposure : 1;
  const allocation = useMemo(() => buildAllocation(budget, positions, exposure), [budget, positions, exposure]);

  useEffect(() => {
    const context = (document as unknown as { modelContext?: WebMCPContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(context.registerTool({
        name: 'calculate_investment_allocation',
        title: '예산별 매수 수량 계산',
        description: '달러 예산과 현재 레짐 컨센서스 또는 투자자 ID를 사용해 화면의 매수 수량표를 계산합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            budgetUsd: { type: 'number', minimum: 100 },
            source: { type: 'string', description: 'regime 또는 투자자 ID' },
          },
          required: ['budgetUsd', 'source'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        async execute(input) {
          const value = input as { budgetUsd?: unknown; source?: unknown };
          if (typeof value.budgetUsd !== 'number' || !Number.isFinite(value.budgetUsd) || value.budgetUsd < 100) throw new Error('budgetUsd는 100 이상의 숫자여야 합니다.');
          if (typeof value.source !== 'string') throw new Error('source가 필요합니다.');
          const sourceInvestor = data.investors.find((item) => item.id === value.source);
          if (value.source !== 'regime' && !sourceInvestor) throw new Error('알 수 없는 투자자 ID입니다.');
          const webPositions: AllocationInput[] = value.source === 'regime'
            ? data.consensus.map((item) => ({ ticker: item.ticker, name: item.ticker, weight: item.weight, price: item.price, managerCount: item.managerCount }))
            : (sourceInvestor?.calculator || []).map((item) => ({ ticker: item.ticker, name: item.name, weight: item.weight || 0, price: item.price, estimatedPrice: item.estimatedPrice }));
          const result = buildAllocation(value.budgetUsd, webPositions, value.source === 'regime' ? data.regime.equityExposure : 1);
          setBudget(value.budgetUsd);
          setBudgetDraft(String(value.budgetUsd));
          setBudgetError('');
          setSourceId(value.source);
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          return { investedUsd: Math.round(result.invested), cashUsd: Math.round(result.cash), orders: result.rows.map((row) => ({ ticker: row.ticker, shares: row.shares })) };
        },
      }, { signal: lifecycle.signal })).catch(() => undefined);
    } catch {
      return;
    }
    return () => lifecycle.abort();
  }, [data]);

  return (
    <div className="page-shell allocator-shell">
      <header className="page-heading allocator-heading">
        <div><p className="eyebrow">BUDGET ALLOCATOR</p><h1>예산을 실제 수량으로 바꾸기</h1><p>최신 종가와 목표 비중을 이용해 정수 주식 수량, 예상 투자금, 잔여 현금을 계산합니다.</p></div>
        <div className="regime-stamp"><span className="pulse" /><div><small>현재 시장 레짐</small><strong>{data.regime.label}</strong></div><em>주식 노출 {percent(data.regime.equityExposure)}</em></div>
      </header>

      <section className="allocator-workbench">
        <div className="allocator-controls-panel">
          <div className="control-block"><label htmlFor="budget">전체 예산 · USD</label><form onSubmit={(event) => { event.preventDefault(); const next = parseBudgetInput(budgetDraft); if (next == null) { setBudgetError('$100~$100,000,000 범위의 금액을 입력하세요.'); return; } setBudget(next); setBudgetError(''); }}><div className="budget-submit"><div className="money-input"><span>$</span><Input id="budget" type="text" inputMode="decimal" value={budgetDraft} onChange={(event) => { setBudgetDraft(event.target.value); setBudgetError(''); }} aria-invalid={Boolean(budgetError)} aria-describedby={budgetError ? 'budget-error' : 'budget-help'} placeholder="예: 12,500" /></div><button type="submit">계산하기</button></div></form><div className="budget-presets" aria-label="예산 빠른 선택">{budgetPresets.map((preset) => <button type="button" aria-pressed={budget === preset && parseBudgetInput(budgetDraft) === preset} onClick={() => { setBudget(preset); setBudgetDraft(String(preset)); setBudgetError(''); }} key={preset}>{preset >= 1000 ? `$${preset / 1000}K` : money(preset)}</button>)}</div>{budgetError ? <span id="budget-error" className="budget-error" role="alert">{budgetError}</span> : <span className="budget-applied" aria-live="polite">계산된 예산: {money(budget)}</span>}<small id="budget-help">임의의 금액을 직접 입력하고 계산하기를 누르세요. 미국 상장 종목 기준이며 세금·환전비용은 포함하지 않습니다.</small></div>
          <div className="control-block"><span className="control-label">포트폴리오 기준</span><button type="button" className="regime-choice" aria-pressed={isRegime} onClick={() => setSourceId('regime')}>현재 레짐 컨센서스 · {data.regime.label}</button><InvestorPicker investors={data.investors.filter((item) => item.calculator.length)} selectedId={sourceId} onSelect={setSourceId} idPrefix="allocation-investor" /><small>{isRegime ? '복수의 퀄리티·가치 운용사가 동시에 보유한 종목을 결합합니다.' : `${selectedInvestor?.portfolioDate} 13F 상위 매핑 종목을 비중대로 복제합니다.`}</small></div>
          <div className="allocation-flow"><span>예산</span><ArrowRight size={16} /><span>{isRegime ? `${data.regime.label} 노출 ${percent(exposure)}` : selectedInvestor?.styleLabel}</span><ArrowRight size={16} /><strong>{allocation.rows.length}개 주문</strong></div>
        </div>

        <div className="allocation-summary">
          <div><Coins size={18} /><span>예상 투자금</span><strong>{money(allocation.invested)}</strong></div>
          <div><Gauge size={18} /><span>잔여 현금</span><strong>{money(allocation.cash)}</strong></div>
          <div><CheckCircle2 size={18} /><span>투자 비율</span><strong>{budget > 0 ? percent(allocation.invested / budget) : '—'}</strong></div>
          <div><Users size={18} /><span>신호 기준일</span><strong>{isRegime ? data.regime.priceDate : selectedInvestor?.calculator[0]?.priceDate || '—'}</strong></div>
        </div>
      </section>

      <section className="allocation-chart panel" aria-label="추천 포트폴리오 예산 배분 차트">
        <div className="section-heading"><div><p>ALLOCATION MAP</p><h2>예산이 어디에 배분되는가</h2></div><span>실제 매수금 기준</span></div>
        {allocation.rows.length ? <div className="allocation-bars">{allocation.rows.slice(0, 10).map((row) => <div key={row.ticker}><div><strong>{row.ticker}</strong><span>{money(row.estimatedValue)} · {percent(row.actualWeight)}</span></div><span className="allocation-track"><i style={{ width: `${Math.min(100, row.actualWeight * 100)}%` }} /></span></div>)}<div className="cash-row"><div><strong>현금</strong><span>{money(allocation.cash)} · {budget > 0 ? percent(allocation.cash / budget) : '—'}</span></div><span className="allocation-track"><i style={{ width: `${budget > 0 ? Math.min(100, allocation.cash / budget * 100) : 0}%` }} /></span></div></div> : <div className="no-data">현재 예산으로 표시할 배분이 없습니다.</div>}
      </section>

      <section className="allocation-table panel">
        <div className="section-heading"><div><p>ORDER BLUEPRINT</p><h2>{isRegime ? `${data.regime.label} 레짐 추천 포트폴리오` : `${selectedInvestor?.representative} 복제 포트폴리오`}</h2></div><span>{money(budget)}</span></div>
        {allocation.rows.length ? <Table><TableHeader><TableRow><TableHead>종목</TableHead><TableHead>근거</TableHead><TableHead className="text-right">목표 비중</TableHead><TableHead className="text-right">기준 가격</TableHead><TableHead className="text-right">매수 수량</TableHead><TableHead className="text-right">예상 금액</TableHead></TableRow></TableHeader><TableBody>{allocation.rows.map((row) => <TableRow key={row.ticker}><TableCell><strong className="ticker-cell">{row.ticker}</strong><small>{row.name !== row.ticker ? row.name : ''}</small></TableCell><TableCell className="text-muted-foreground">{isRegime ? `${row.managerCount}개 운용사 동시 보유` : row.estimatedPrice ? '보고가격 추정' : '최근 종가'}</TableCell><TableCell className="text-right font-mono">{percent(row.targetWeight * exposure)}</TableCell><TableCell className="text-right font-mono">${row.price.toFixed(2)}</TableCell><TableCell className="text-right"><strong className="share-count">{row.shares.toLocaleString('en-US')}주</strong></TableCell><TableCell className="text-right font-mono">{money(row.estimatedValue)}</TableCell></TableRow>)}</TableBody></Table> : <div className="no-data">이 예산으로 매수할 수 있는 종목이 없습니다. 예산을 늘리거나 다른 포트폴리오를 선택하세요.</div>}
      </section>

      <section className="regime-explainer">
        <div><p className="section-kicker">REGIME LOGIC</p><h2>현재 판단: {data.regime.label}</h2><p>{data.regime.rationale}</p><small>가격 기준 {data.regime.priceDate} · 13F 기준 {data.regime.reportDate}</small></div>
        <div className="regime-rules">{data.regime.rules.map((rule) => <article className={rule.label === data.regime.label ? 'active' : ''} key={rule.label}><span>{rule.label}</span><strong>{percent(rule.exposure)}</strong><p>{rule.description}</p></article>)}</div>
      </section>

      <aside className="risk-callout allocator-risk"><AlertCircle size={19} /><div><strong>주문 전에 확인하세요</strong><p>계산값은 모델 비중을 정수 주식으로 근사한 연구용 주문안입니다. 실시간 호가, 환율, 세금, 거래비용, 기존 보유 수량을 반영하지 않았으며 자동 주문을 전송하지 않습니다.</p></div></aside>
    </div>
  );
}
