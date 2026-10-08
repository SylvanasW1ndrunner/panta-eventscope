import { readRoutes } from '@/server/panta/config';
export async function GET(req: Request, context: { params: Promise<{ marketId: string }> }) {
  return readRoutes.market(req, (await context.params).marketId);
}
