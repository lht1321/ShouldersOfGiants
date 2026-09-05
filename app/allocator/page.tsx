import { AllocatorClient } from '@/components/allocator-client';
import { SiteHeader } from '@/components/site-header';
import { siteData } from '@/lib/site-data';

export default function AllocatorPage() {
  return <main className="min-h-screen"><SiteHeader /><AllocatorClient data={siteData} /></main>;
}
