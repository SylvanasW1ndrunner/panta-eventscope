# EventScope Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Deliver a prediction-market research desk with authenticated Panta integration, reproducible observations, English UI and competition materials.

**Architecture:** Next.js App Router provides the UI and fixed GET routes. The server holds credentials, bounds concurrency and caches reads. The browser keeps watched events and actual snapshots. Calculations, alerts and export remain independent of page components.

**Tech Stack:** Installed: Node.js 24.18.1, Next.js 16.4.0, React/React DOM 19.3.0, TypeScript 7.0.2, Vitest 5.0.3, Playwright 1.64.0, Decimal.js 10.6.0, bs58 6.0.0 and tsx 4.23.15. Package versions were checked against the official npm registry on 2026-10-08 and are pinned in package-lock.json. The plan originally proposed Node.js 24.19.0 and Zod 4.6.5; the compatible installed Node runtime is used, and explicit boundary parsers avoid an additional schema dependency.

**Spec:** `docs/superpowers/specs/2026-10-08-panta-eventscope-design.md`. The user approved the design and instructed development. Execution is inline in this chat.

## Global Constraints

- Production origin: `https://live-api.panta.market/api/v1/`; four GET resource types only. No transactions or market creation.
- Catalogue pages at most 50, trades at most 200; initial catalogue request 20.
- Catalogue/categories cache 60 seconds, detail 15, trades 30; at most two concurrent upstream reads.
- Watch at most four events and compare three; watched details refresh every 30 seconds.
- At most 500 browser samples per market, retained for seven days, deduplicated by original response-read time.
- Alert default 5 pp, adjustable 1–20. Baseline is the closest valid sample 10–15 minutes earlier; latest reads older than 60 seconds cannot alert.
- Do not join history or calculate changes across phase boundaries, missing quotes, or live/example modes. Gaps above 90 seconds break continuity.
- `volumeUsdc` means catalogue volume. Returned trade counts are this response's count. Do not invent 24-hour metrics or full price history.
- English interface, README and submission material; linked `Powered by Panta` attribution.
- Key stays in server environment variables. Confirm free access before authenticated reads. Do not register, pay or accept a paid plan as a substitute for confirmation.
- Record local verification, live integration, public repository, video, main entry and sponsor entry separately.

## Review Focus

1. Decimal boundaries and missing values: zero is valid, null is not; 0.40 to 0.45 is exactly 5 pp. Task 1 price tests.
2. Slow requests, rate limits and cache: no 429 retry loops or cached response disguised as a new observation. Task 2 concurrency, TTL, Retry-After and read-time tests.
3. Corrupt or denied browser storage: old JSON, expired observations and source contamination must not break research. Task 3 storage tests.
4. Filter and selection races: a delayed old market cannot replace the new selection. Task 4 browser cancellation tests.
5. External text and exports: hostile titles, invalid signatures, CSV formula prefixes and example labels need safe handling. Task 5 exports and Task 6 browser tests.

## File Structure and Shared Types

- `src/features/markets/`: domain model, decimal calculations, response parsers, discovery and detail components.
- `src/server/panta/`: credential configuration, fixed reader, cache, scheduling, route validation and safe errors.
- `src/features/observations/`: snapshots, watch storage, 10-minute movement and alert state.
- `src/features/briefs/`: English evidence capture and Markdown/JSON/CSV exports.
- `src/features/workspace/`: view state, reads, mode transitions and research layout.
- `src/app/`: pages, CSS, layout and the four fixed read route types.
- `src/demo/`: visibly fictional data, isolated from live-source paths.
- `tests/`: domain/server tests; `tests/e2e/`: browser flows; `scripts/verify-live.mjs`: authenticated read-only verification.
- `docs/submission/`: requirement mapping, English applications, demo script and actual readiness.

Define shared types in Task 1. Later tasks import these types without renaming:

```ts
type DataMode = 'live' | 'demo';
type MarketPhase = 'primary' | 'secondary' | 'resolved' | 'cancelled' | 'unknown';
type MarketQuery = { category?: string; status?: Exclude<MarketPhase, 'unknown'>; cursor?: string; limit?: number };
type Snapshot = { marketId: string; mode: DataMode; phase: MarketPhase; observedAt: number; yesPrice: string | null; noPrice: string | null };
type ReadResult<T> = { data: T; mode: DataMode; fetchedAt: number; ageMs: number; stale: boolean; warnings: string[]; retryAt?: number };
```

`Market` retains marketId, title, description, category, phase, raw phase, startTime/endTime/resolutionTime, volumeUsdc, YES/NO quotes and warnings. `CatalogPage` is `{ items: Market[]; nextCursor: string | null }`. `Trade` retains documented id, signature, blockTime, wallet, share amounts, feePaid and quoteAsset; never derive an absent trade price.

### Task 1: Typed market contract and exact price calculations

**Files:** Create `package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `.env.example`, `src/features/markets/model.ts`, `src/features/markets/prices.ts`, `src/features/markets/parse.ts`, `tests/fixtures/panta.ts`, `tests/markets.test.ts`.

**Interfaces:** Produces `parseMarket(raw: unknown): Market`, `parseCatalog(raw: unknown): CatalogPage`, `parseTrades(raw: unknown): Trade[]`, `normalizePrice(raw: unknown): string | null`, `percentagePointDelta(before: string, after: string): string`. Price arithmetic uses Decimal.js, not binary floating-point comparisons. Test fixtures export a fictional `rawMarket`, valid `marketId`, and `makeSnapshot({ observedAt, yesPrice, mode?, phase? }): Snapshot` for later tasks. Environment names are `PANTA_API_KEY` and `PANTA_FREE_ACCESS_CONFIRMED` (default false).

- [x] Write `tests/markets.test.ts` with these boundary assertions and invalid root/catalog/schema cases:

```ts
it('preserves missing and zero prices and exact point changes', () => {
  expect(normalizePrice(null)).toBeNull();
  expect(normalizePrice('0')).toBe('0');
  expect(normalizePrice('-0.1')).toBeNull();
  expect(normalizePrice('1.01')).toBeNull();
  expect(normalizePrice('NaN')).toBeNull();
  expect(percentagePointDelta('0.40', '0.45')).toBe('5');
});
```

- [x] Add the minimal pinned dependencies and test command, run `npm.cmd run test -- tests/markets.test.ts`, and confirm the test fails before implementing the missing functions.
- [x] Implement the shared types and parsing functions. Require a valid market identifier for live records, keep null values, mark unknown phases, and preserve distinct API field meanings.
- [x] Run the focused tests and `npm.cmd run typecheck`; both must pass. Commit the contract and tests.

### Task 2: Server-only reads, cache and bounded requests

**Files:** Create `src/server/panta/config.ts`, `errors.ts`, `client.ts`, `cache.ts`, `routes.ts`, `src/demo/markets.ts`, `src/app/api/categories/route.ts`, `src/app/api/markets/route.ts`, `src/app/api/markets/[marketId]/route.ts`, `src/app/api/markets/[marketId]/trades/route.ts`, `tests/panta-client.test.ts`, `tests/panta-routes.test.ts`.

**Interfaces:** Consumes task 1 parsers. Produces `createPantaClient({ fetchImpl, now, apiKey, accessConfirmed }): PantaClient` with `categories(): Promise<ReadResult<string[]>>`, `catalog(query: MarketQuery): Promise<ReadResult<CatalogPage>>`, `market(marketId: string): Promise<ReadResult<Market>>`, and `trades(marketId: string, limit: number): Promise<ReadResult<Trade[]>>`. The injected fetch/clock support isolated tests; the production origin is fixed. Route mode is an explicit `live` or `demo` query, never an automatic fallback.

- [x] Write mocked fetch tests for missing key, access not confirmed, malformed IDs/queries, invalid upstream JSON, expired cache, duplicate pending requests, concurrency capped at 2, 429 and unavailable stale data.

```ts
it('coalesces reads and keeps their original observation time', async () => {
  const [first, cached] = await Promise.all([client.market(marketId), client.market(marketId)]);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(cached.fetchedAt).toBe(first.fetchedAt);
});
```

- [x] Run `npm.cmd run test -- tests/panta-client.test.ts tests/panta-routes.test.ts`; confirm failure before implementation.
- [x] Implement only the documented GET paths and safe query builders. Use an 8-second timeout, reject redirects, validate response bodies, coalesce identical requests and preserve the original fetchedAt for cached/stale results.
- [x] Map errors to fixed public messages and codes. A 429 stores the retry deadline, observes Retry-After, and permits no automatic retry loop. Secrets and raw upstream error bodies never reach the browser.
- [x] Implement explicit fictional demo data with the same normalized contract. Demo trade explorer links are disabled and results are always marked demo. The normal live route never switches to demo on failure.
- [x] Run the focused tests, checking cache deadlines at 15/30/60 seconds and every route's method/parameter bounds. Commit the client and routes.

### Task 3: Observation storage, history and change alerts

**Files:** Create `src/features/observations/model.ts`, `history.ts`, `alerts.ts`, `storage.ts`, `tests/observations.test.ts`, `tests/alerts.test.ts`.

**Interfaces:** Consumes `Snapshot`, `MarketPhase`, `DataMode` and exact price functions. Produces `appendSnapshot(history, snapshot, now): Snapshot[]`, `findChangeBaseline(history, latest): Snapshot | null`, `evaluateAlert(state, history, thresholdPp, now): AlertEvaluation`, `loadWorkspace(storage, mode): SavedWorkspace`, `saveWorkspace(storage, mode, workspace): StorageResult`. `SavedWorkspace` stores watchlist IDs, compare IDs, history and threshold; live/demo keys are separate.

- [x] Write history/storage tests for duplicate fetchedAt, chronological ordering, phase gaps, mode isolation, 500-record cap, 7-day retention, corrupt/unknown stored versions, denied storage, watchlist limit 4 and comparison limit 3.
- [x] Write alert tests for exact 5-point crossing, insufficient 10-minute history, baseline older than 15 minutes, phase change, null quote, 60-second stale latest, sustained condition deduplication and reset/re-crossing.

```ts
it('deduplicates identical observations', () => {
  const sample = makeSnapshot({ observedAt: NOW, yesPrice: '0.45' });
  expect(appendSnapshot([sample], sample, NOW)).toHaveLength(1);
});
it('caps history at 500 samples', () => {
  expect(appendSnapshot(historyOf500, newSnapshot, NOW)).toHaveLength(500);
});
```

- [x] Run `npm.cmd run test -- tests/observations.test.ts tests/alerts.test.ts`; confirm failure before implementing the functions.
- [x] Implement pure calculations and versioned storage. A storage failure leaves an in-memory workspace usable and visible as unsaved. Invalid or stale data produces an explicit warming-up/unavailable result instead of a movement number.
- [x] Run focused tests and typecheck. Commit the observation engine.

### Task 4: Market discovery and research workspace

**Files:** Create `src/app/layout.tsx`, `page.tsx`, `globals.css`, `src/features/workspace/ResearchWorkspace.tsx`, `useMarketData.ts`, `useWorkspace.ts`, `src/features/markets/MarketList.tsx`, `MarketDetail.tsx`, `TradeTape.tsx`, `src/features/observations/Watchlist.tsx`, `HistoryChart.tsx`, `Comparison.tsx`, `tests/e2e/workspace.spec.ts`, `playwright.config.ts`.

**Interfaces:** Consumes server `ReadResult<T>` and task 3 workspace functions. `useMarketData({ mode, query, activeId, watchedIds })` returns catalog, detail, trades, read states and load-more/refresh actions. Mode changes cancel outstanding work; market/filter changes must ignore old responses.

- [x] Write browser tests for discover → detail → watch → compare, categories/phase filters, cursor pagination, scoped text search, loading/empty/error states, changing selection during delayed requests, and live mode without configured access.

```ts
test('cannot silently replace live data with an example', async ({ page }) => {
  await page.goto('/?mode=live'); // test server has no key
  await expect(page.getByText('Live access is not configured', { exact: true })).toBeVisible();
  await expect(page.getByTestId('demo-banner')).toHaveCount(0);
});
```

- [x] Add the app shell needed to run tests, then run `npm.cmd run test:e2e -- tests/e2e/workspace.spec.ts` and confirm the feature assertions fail before implementing the workspace.
- [x] Implement the light English interface, original EventScope identity and linked `Powered by Panta`. Show catalogue volume and API read time with accurate labels. Never display market list null quotes as 0.
- [x] Refresh only active/watched details on a 30-second cadence with cancellation. Persist genuine fetchedAt snapshots, separate source modes, and show observation start, curve gaps and alert warm-up. One valid sample does not become a historical line.
- [x] Provide labelled controls, keyboard navigation, non-color-only changes, desktop layout and narrow-screen detail navigation. Generic setup messages link to local README instructions; no credential entry goes into browser storage.
- [x] Run the browser task tests and typecheck. Commit the usable research workspace.

### Task 5: Evidence brief and reproducible exports

**Files:** Create `src/features/briefs/model.ts`, `build.ts`, `export.ts`, `BriefPanel.tsx`, `tests/briefs.test.ts`, `tests/e2e/exports.spec.ts`.

**Interfaces:** Consumes `Market`, `Snapshot[]`, `Trade[]`, and `ReadResult` metadata. Produces `buildEvidenceBrief(input): EvidenceBrief` plus `exportBriefMarkdown(brief)`, `exportBriefJson(brief)`, `exportBriefCsv(brief)`. The input captures the selected market and time once so output cannot mix refresh states.

- [x] Write tests for consistent quotes/timestamps, null and stale data, no valid baseline, actual transaction evidence, demo labels, invalid explorer signatures, and CSV cells beginning with `=`, `+`, `-`, `@`, tab or newline.

```ts
it('keeps source mode in the exported evidence', () => {
  const json = JSON.parse(exportBriefJson(demoBrief));
  expect(json.mode).toBe('demo');
  expect(json.observedAt).toBe(demoBrief.observedAt);
});
```

- [x] Run `npm.cmd run test -- tests/briefs.test.ts`; confirm failure before implementing generation/export.
- [x] Implement English rule-based observations with no fabricated explanation or news source. Include market identifier, mode, read time, observation window and evidence. Validate explorer IDs and escape CSV formula prefixes.
- [x] Add the brief panel and browser download checks. Run the focused tests and `npm.cmd run test:e2e -- tests/e2e/exports.spec.ts`; commit the complete evidence workflow.

### Task 6: Quality verification and English submission package

**Files:** Create `README.md`, `LICENSE`, `docs/submission/requirements.md`, `panta-application.md`, `colosseum-application.md`, `demo-script.md`, `status.json`, `tests/e2e/accessibility.spec.ts`, `scripts/verify-live.mjs`; refine relevant app/test files only when these checks expose a defect.

**Interfaces:** Consumes the working app. `npm.cmd run verify:live` uses server environment variables, reads categories/catalog/detail/trades, and writes a secret-free dated summary to an ignored output folder. It never registers an account, creates a market or submits a transaction. The status record distinguishes software, live validation, repository, video, main entry and sponsor entry.

- [x] Write browser checks for 390px narrow-screen flows, keyboard operation, safe rendering of malicious titles/descriptions, source-mode changes and unavailable prices. Confirm the affected assertion fails before fixing each discovered defect.

```ts
test('supports narrow-screen research and export', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?mode=demo');
  await expect(page.getByRole('heading', { name: 'Discover markets' })).toBeVisible();
  await expect(page.getByTestId('demo-banner')).toBeVisible();
});
```

- [x] Run `npm.cmd run test`, `npm.cmd run typecheck`, `npm.cmd run build`, and `npm.cmd run test:e2e`. All applicable software checks must pass; inspect desktop/mobile screenshots and fix material visual defects.
- [x] Prepare README startup/key instructions, MIT license for independently written code, feature/limitation descriptions, requirements-to-evidence mapping and English application drafts. Include no invented users, usage, funding or completed submissions.
- [x] On the participant's explicit 9 October request, run finite read-only verification with a legitimate live key. Inspect all four response contracts and collect actual observations; record missing-data interruptions and claim a valid alert baseline only if continuity permits. Keep free-quota confirmation separate and do not replace failed reads with examples. Actual run: 20 samples over 665.702 seconds; baseline unavailable because missing prices interrupted continuity.
- [x] Prepare a 2–3-minute English demo script and screenshot set. A video is complete only after recording actual working screens; a script is not a submitted video.
- [ ] Before publication/submission, recheck official scope/deadline/eligibility, prepare the public repository and both application forms, then record actual created URLs and submission results through supported authenticated tools. Authentication problems or missing participant information remain explicit dependencies.
- [ ] Commit verified software and materials. Update status only with actual evidence; do not mark the task complete solely because the local demo works.

## Execution recommendation and dependencies

Use inline execution in this chat. Tasks share read-time and data contracts closely, so sequential implementation reduces interface drift. Critical calculations and source boundaries have independent tests.

The user authorised the confirmed design and later explicitly requested finite production verification on 9 October. That request authorises bounded reads without asserting a free allocation. Continuous access still requires quota confirmation; official entry completion requires actual participant declarations, account access and both submission receipts.

## References

- Confirmed design: `docs/superpowers/specs/2026-10-08-panta-eventscope-design.md`
- Sponsor requirements: https://superteam.fun/earn/listing/panta-api-side-track
- Next.js installation/runtime requirements: https://nextjs.org/docs/app/getting-started/installation
- Panta contracts and limits: https://docs.panta.market/llms.txt
- Stable package metadata: https://registry.npmjs.org/
