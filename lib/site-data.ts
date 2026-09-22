import rawData from '@/lib/site-data.json';
import type { SiteData } from '@/lib/types';

export const siteData = rawData as SiteData;

export const investorDirectory = siteData.investors.map((investor) => ({
  id: investor.id,
  representative: investor.representative,
  manager: investor.manager,
  cagr: investor.metrics.cagr,
  marketCagr: investor.metrics.marketCagr,
  sharpe: investor.metrics.sharpe,
  maxDrawdown: investor.metrics.maxDrawdown,
}));

export function getInvestor(id: string) {
  return siteData.investors.find((investor) => investor.id === id);
}
