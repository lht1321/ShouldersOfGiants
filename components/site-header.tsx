'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Landmark, Menu } from 'lucide-react';

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

export function SiteHeader() {
  const pathname = usePathname();
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="site-header">
      <Link href="/" prefetch={false} onClick={(event) => navigateWithReload(event, '/')} className="brand" aria-label="Shoulders of Giants 홈" data-native-navigation>
        <span className="brand-mark"><Landmark size={18} /></span>
        <span>SHOULDERS <i>of</i> GIANTS</span>
      </Link>
      <nav className="desktop-nav" aria-label="주요 메뉴">
        {links.map((link) => <Link data-native-navigation prefetch={false} onClick={(event) => navigateWithReload(event, link.href)} className={isActive(link.href) ? 'active' : ''} href={link.href} key={link.href}>{link.label}</Link>)}
      </nav>
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
    </header>
  );
}
