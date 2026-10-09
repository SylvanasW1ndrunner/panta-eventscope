import 'server-only';
import { createPantaClient, type PantaClient } from './client';
import { createRouteHandlers } from './routes';

// Used exclusively by server route modules. No NEXT_PUBLIC credentials.
const scope = globalThis as typeof globalThis & { __eventScopeReader?: PantaClient };
scope.__eventScopeReader ??= createPantaClient({
  apiKey: process.env.PANTA_API_KEY ?? '',
  accessConfirmed: process.env.PANTA_READ_ACCESS_ENABLED === 'true',
});
export const readRoutes = createRouteHandlers(scope.__eventScopeReader);
