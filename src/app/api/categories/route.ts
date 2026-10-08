import { readRoutes } from '@/server/panta/config';
export async function GET(req: Request) { return readRoutes.categories(req); }
