import { InvestorArchive } from '@/components/investor-archive';
import { SiteHeader } from '@/components/site-header';
import { siteData } from '@/lib/site-data';

export default function InvestorsPage() {
  return <main className="min-h-screen"><SiteHeader /><InvestorArchive data={siteData} /></main>;
}
