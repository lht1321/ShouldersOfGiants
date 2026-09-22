import { PerformanceDashboard } from '@/components/performance-dashboard';
import { SiteHeader } from '@/components/site-header';
import { investorDirectory, siteData } from '@/lib/site-data';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader investors={investorDirectory} />
      <PerformanceDashboard data={siteData} />
    </main>
  );
}
