'use client';

import { useMemo, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Landmark, Menu, Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { findInvestors, investorSortLabels, type InvestorDirectoryEntry, type InvestorSort } from '@/lib/investor-directory';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const links = [
  { href: '/', label: '성과 분석' },
  { href: '/investors', label: '투자자 아카이브' },
  { href: '/allocator', label: '예산 배분' },
  { href: '/changes', label: '포지션 변화' },
];

function navigateWithReload(event: MouseEvent<HTMLAnchorElement>, href: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  window.location.assign(href);
}

export function SiteHeader({ investors }: { investors: InvestorDirectoryEntry[] }) {
  const pathname = usePathname();
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<InvestorSort>('cagr');
  const matches = useMemo(() => findInvestors(investors, query, sort), [investors, query, sort]);
  const metricText = (investor: InvestorDirectoryEntry) => {
    const value = sort === 'excess' ? investor.cagr == null || investor.marketCagr == null ? null : investor.cagr - investor.marketCagr : sort === 'drawdown' ? investor.maxDrawdown : sort === 'sharpe' ? investor.sharpe : investor.cagr;
    return value == null ? '—' : sort === 'sharpe' ? value.toFixed(2) : `${(value * 100).toFixed(1)}%`;
  };

  return (
    <header className="site-header">
      <Link href="/" prefetch={false} onClick={(event) => navigateWithReload(event, '/')} className="brand" aria-label="Shoulders of Giants 홈" data-native-navigation>
        <span className="brand-mark"><Landmark size={18} /></span>
        <span>SHOULDERS <i>of</i> GIANTS</span>
      </Link>
      <nav className="desktop-nav" aria-label="주요 메뉴">
        {links.map((link) => <Link data-native-navigation prefetch={false} onClick={(event) => navigateWithReload(event, link.href)} className={isActive(link.href) ? 'active' : ''} href={link.href} key={link.href}>{link.label}</Link>)}
      </nav>
      <div className="header-actions">
      <details className="header-finder">
        <summary aria-label="투자자 검색 및 정렬"><Search size={17} /><span>투자자 찾기</span></summary>
        <div className="finder-panel">
          <div className="finder-controls">
            <label htmlFor="global-investor-search">투자자 또는 운용사 검색</label>
            <Input id="global-investor-search" type="search" aria-label="투자자 또는 운용사 검색" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름 또는 운용사" />
            <Select value={sort} onValueChange={(value) => setSort(value as InvestorSort)}>
              <SelectTrigger aria-label="검색 결과 정렬"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(investorSortLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <p className="finder-count">{matches.length}명 · {investorSortLabels[sort]}</p>
          <ul className="finder-results">
            {matches.slice(0, 12).map((investor) => <li key={investor.id}><Link href={`/investors/${investor.id}`} prefetch={false} onClick={(event) => navigateWithReload(event, `/investors/${investor.id}`)}><span><strong>{investor.representative}</strong><small>{investor.manager}</small></span><em>{metricText(investor)}</em></Link></li>)}
            {!matches.length && <li className="finder-empty">검색 결과가 없습니다.</li>}
          </ul>
          <Link className="finder-all" href="/investors" prefetch={false} onClick={(event) => navigateWithReload(event, '/investors')}>전체 투자자 보기</Link>
        </div>
      </details>
      <Sheet>
        <SheetTrigger className="menu-button" aria-label="메뉴 열기"><Menu size={20} /></SheetTrigger>
        <SheetContent className="mobile-sheet">
          <SheetHeader>
            <SheetTitle>Shoulders of Giants</SheetTitle>
            <SheetDescription>13F 리서치 터미널</SheetDescription>
          </SheetHeader>
          <nav className="mobile-nav" aria-label="모바일 메뉴">
            {links.map((link) => <Link data-native-navigation prefetch={false} onClick={(event) => navigateWithReload(event, link.href)} className={isActive(link.href) ? 'active' : ''} href={link.href} key={link.href}>{link.label}</Link>)}
          </nav>
        </SheetContent>
      </Sheet>
      </div>
    </header>
  );
}
