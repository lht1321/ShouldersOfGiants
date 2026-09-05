import { PerformanceDashboard } from '@/components/performance-dashboard';
import { SiteHeader } from '@/components/site-header';
import { siteData } from '@/lib/site-data';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <PerformanceDashboard data={siteData} />
    </main>
  );
}
