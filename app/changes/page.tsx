import { ChangesExplorer } from '@/components/changes-explorer';
import { SiteHeader } from '@/components/site-header';
import { siteData } from '@/lib/site-data';

export default function ChangesPage() {
  return <main className="min-h-screen"><SiteHeader /><ChangesExplorer data={siteData} /></main>;
}
