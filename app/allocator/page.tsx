import { AllocatorClient } from '@/components/allocator-client';
import { SiteHeader } from '@/components/site-header';
import { investorDirectory, siteData } from '@/lib/site-data';

export default function AllocatorPage() {
  return <main className="min-h-screen"><SiteHeader investors={investorDirectory} /><AllocatorClient data={siteData} /></main>;
}
