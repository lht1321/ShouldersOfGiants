import rawData from '@/lib/site-data.json';
import type { SiteData } from '@/lib/types';

export const siteData = rawData as SiteData;

export function getInvestor(id: string) {
  return siteData.investors.find((investor) => investor.id === id);
}
