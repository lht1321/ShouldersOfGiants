import { ChangesExplorer } from '@/components/changes-explorer';
import { SiteHeader } from '@/components/site-header';
import { investorDirectory, siteData } from '@/lib/site-data';

export default function ChangesPage() {
  return <main className="min-h-screen"><SiteHeader investors={investorDirectory} /><ChangesExplorer data={siteData} /></main>;
}
