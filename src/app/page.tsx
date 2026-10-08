import { ResearchWorkspace } from '@/features/workspace/ResearchWorkspace';
export default async function Home({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const query = await searchParams;
  return <ResearchWorkspace initialMode={query.mode === 'demo' ? 'demo' : 'live'} />;
}
