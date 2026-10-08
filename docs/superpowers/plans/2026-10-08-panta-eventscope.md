# EventScope Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成一个有真实 Panta API 集成、可复核观察记录、英文界面和比赛材料的预测市场研究台。

**Architecture:** Next.js App Router 提供界面与固定 GET 读取路由。服务器持有开发者凭据、控制并发和缓存，浏览器保存观察列表及实际采集快照。领域计算、提醒和导出独立于页面组件。

**Tech Stack:** Node.js 24.19.0、Next.js 16.4.0、React/React DOM 19.3.0、TypeScript 7.0.2、Vitest 5.0.3、Playwright 1.64.0、Decimal.js 10.6.0、Zod 4.6.5、bs58 6.0.0。版本于 2026-10-08 从官方 npm registry 核对；安装时锁定 package-lock.json，不采用宽范围自动升级。

**Spec:** `docs/superpowers/specs/2026-10-08-panta-eventscope-design.md`。用户已确认此设计。本计划尚待审阅和执行方式确认。

## Global Constraints

- 生产地址：`https://live-api.panta.market/api/v1/`；使用四类 GET 读取接口，应用不发交易或创建市场请求。
- 市场目录单页最大 50，交易记录请求最大 200；首屏目录请求 20 条。
- 目录缓存 60 秒，详情缓存 15 秒，交易缓存 30 秒；上游最多同时 2 个请求。分类缓存使用目录的 60 秒期限。
- 最多观察 4 个市场、比较 3 个市场；关注市场每 30 秒刷新。
- 每市场最多 500 个浏览器快照，最长保留 7 天；按上游响应读取时间去重。
- 提醒默认 5 个百分点，允许 1–20；基准为至少 10 分钟前的最近样本，不能早于 15 分钟前；价格读取超过 60 秒时不触发提醒。
- 市场阶段切换、缺失报价、示例与真实数据之间均不拼接历史或计算变化。
- `volumeUsdc` 是目录成交量。交易条数是本次返回条数。不创造 24 小时指标或完整价格历史。
- 英文界面、README 和提交材料；Panta 区域显示带链接的 `Powered by Panta`。
- key 只留在服务器环境变量。联网前确认免费访问条件；不注册、付款或接受收费方案来替代这一步。
- 本地软件验收、真实 API 验证、公开仓库、演示视频、主赛和赛道提交分别记录完成情况。

## Review Focus

1. 边界小数与缺失字段：0 是有效报价，null 不是；0.40 到 0.45 必须恰为 5 个百分点。由任务 1 的价格测试覆盖。
2. 慢请求、限流及缓存：429 不形成循环，缓存返回不能伪装成新的观察；由任务 2 的并发、TTL、Retry-After 和读取时间测试覆盖。
3. 浏览器旧存储或存储拒绝：损坏 JSON、过期记录、模式污染不能破坏研究流程；由任务 3 的存储测试覆盖。
4. 筛选与选择的竞态：慢的旧市场结果不能覆盖新选择；由任务 4 的取消请求浏览器测试覆盖。
5. 文本和导出边界：恶意标题、无效签名、CSV 公式前缀和示例模式必须被安全处理；由任务 5 的导出及任务 6 的页面测试覆盖。

## File Structure and Shared Types

- `src/features/markets/`：市场模型、价格计算、Panta 响应解析、目录与详情组件。
- `src/server/panta/`：凭据配置、固定读取客户端、缓存、调度、路由校验和错误返回。
- `src/features/observations/`：快照、观察列表存储、10 分钟变化和提醒状态。
- `src/features/briefs/`：可复核英文简报及 Markdown/JSON/CSV 导出。
- `src/features/workspace/`：页面状态、数据获取、模式切换和研究工作台布局。
- `src/app/`：页面、全局样式、layout 以及四类固定 API route。
- `src/demo/`：明确标记的虚构数据，与真实数据路径隔离。
- `tests/`：领域及服务器测试；`tests/e2e/`：浏览器流程；`scripts/verify-live.mjs`：只读联网验证。
- `docs/submission/`：官方要求对照、英文产品介绍、演示脚本和实际准备状态。

共享类型在任务 1 定义，后续任务直接导入，不重新命名：

```ts
type DataMode = 'live' | 'demo';
type MarketPhase = 'primary' | 'secondary' | 'resolved' | 'cancelled' | 'unknown';
type MarketQuery = { category?: string; status?: Exclude<MarketPhase, 'unknown'>; cursor?: string; limit?: number };
type Snapshot = { marketId: string; mode: DataMode; phase: MarketPhase; observedAt: number; yesPrice: string | null; noPrice: string | null };
type ReadResult<T> = { data: T; mode: DataMode; fetchedAt: number; ageMs: number; stale: boolean; warnings: string[] };
```

`Market` 保留 marketId、title、description、category、phase、原始阶段、startTime/endTime/resolutionTime、volumeUsdc、YES/NO 报价与字段异常说明。`CatalogPage` 为 `{ items: Market[]; nextCursor: string | null }`。`Trade` 保留 API 文档中的 id、signature、blockTime、wallet、share amounts、feePaid 与 quoteAsset，不从这些字段补出成交价格。

### Task 1: Typed market contract and exact price calculations

**Files:** Create `package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `.env.example`, `src/features/markets/model.ts`, `src/features/markets/prices.ts`, `src/features/markets/parse.ts`, `tests/fixtures/panta.ts`, `tests/markets.test.ts`.

**Interfaces:** Produces `parseMarket(raw: unknown): Market`, `parseCatalog(raw: unknown): CatalogPage`, `parseTrades(raw: unknown): Trade[]`, `normalizePrice(raw: unknown): string | null`, `percentagePointDelta(before: string, after: string): string`. Price arithmetic uses Decimal.js, not binary floating-point comparisons. Test fixtures export a fictional `rawMarket`, valid `marketId`, and `makeSnapshot({ observedAt, yesPrice, mode?, phase? }): Snapshot` for later tasks. Environment names are `PANTA_API_KEY` and `PANTA_FREE_ACCESS_CONFIRMED` (default false).

- [ ] Write `tests/markets.test.ts` with these boundary assertions and invalid root/catalog/schema cases:

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

- [ ] Add the minimal pinned dependencies and test command, run `npm.cmd run test -- tests/markets.test.ts`, and confirm the test fails before implementing the missing functions.
- [ ] Implement the shared types and parsing functions. Require a valid market identifier for live records, keep null values, mark unknown phases, and preserve distinct API field meanings.
- [ ] Run the focused tests and `npm.cmd run typecheck`; both must pass. Commit the contract and tests.

### Task 2: Server-only reads, cache and bounded requests

**Files:** Create `src/server/panta/config.ts`, `errors.ts`, `client.ts`, `cache.ts`, `routes.ts`, `src/demo/markets.ts`, `src/app/api/categories/route.ts`, `src/app/api/markets/route.ts`, `src/app/api/markets/[marketId]/route.ts`, `src/app/api/markets/[marketId]/trades/route.ts`, `tests/panta-client.test.ts`, `tests/panta-routes.test.ts`.

**Interfaces:** Consumes task 1 parsers. Produces `createPantaClient({ fetchImpl, now, apiKey, accessConfirmed }): PantaClient` with `categories(): Promise<ReadResult<string[]>>`, `catalog(query: MarketQuery): Promise<ReadResult<CatalogPage>>`, `market(marketId: string): Promise<ReadResult<Market>>`, and `trades(marketId: string, limit: number): Promise<ReadResult<Trade[]>>`. The injected fetch/clock support isolated tests; the production origin is fixed. Route mode is an explicit `live` or `demo` query, never an automatic fallback.

- [ ] Write mocked fetch tests for missing key, access not confirmed, malformed IDs/queries, invalid upstream JSON, expired cache, duplicate pending requests, concurrency capped at 2, 429 and unavailable stale data.

```ts
it('coalesces reads and keeps their original observation time', async () => {
  const [first, cached] = await Promise.all([client.market(marketId), client.market(marketId)]);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(cached.fetchedAt).toBe(first.fetchedAt);
});
```

- [ ] Run `npm.cmd run test -- tests/panta-client.test.ts tests/panta-routes.test.ts`; confirm failure before implementation.
- [ ] Implement only the documented GET paths and safe query builders. Use an 8-second timeout, reject redirects, validate response bodies, coalesce identical requests and preserve the original fetchedAt for cached/stale results.
- [ ] Map errors to fixed public messages and codes. A 429 stores the retry deadline, observes Retry-After, and permits no automatic retry loop. Secrets and raw upstream error bodies never reach the browser.
- [ ] Implement explicit fictional demo data with the same normalized contract. Demo trade explorer links are disabled and results are always marked demo. The normal live route never switches to demo on failure.
- [ ] Run the focused tests, checking cache deadlines at 15/30/60 seconds and every route's method/parameter bounds. Commit the client and routes.

### Task 3: Observation storage, history and change alerts

**Files:** Create `src/features/observations/model.ts`, `history.ts`, `alerts.ts`, `storage.ts`, `tests/observations.test.ts`, `tests/alerts.test.ts`.

**Interfaces:** Consumes `Snapshot`, `MarketPhase`, `DataMode` and exact price functions. Produces `appendSnapshot(history, snapshot, now): Snapshot[]`, `findChangeBaseline(history, latest): Snapshot | null`, `evaluateAlert(state, history, thresholdPp, now): AlertEvaluation`, `loadWorkspace(storage, mode): SavedWorkspace`, `saveWorkspace(storage, mode, workspace): StorageResult`. `SavedWorkspace` stores watchlist IDs, compare IDs, history and threshold; live/demo keys are separate.

- [ ] Write history/storage tests for duplicate fetchedAt, chronological ordering, phase gaps, mode isolation, 500-record cap, 7-day retention, corrupt/unknown stored versions, denied storage, watchlist limit 4 and comparison limit 3.
- [ ] Write alert tests for exact 5-point crossing, insufficient 10-minute history, baseline older than 15 minutes, phase change, null quote, 60-second stale latest, sustained condition deduplication and reset/re-crossing.

```ts
it('deduplicates identical observations', () => {
  const sample = makeSnapshot({ observedAt: NOW, yesPrice: '0.45' });
  expect(appendSnapshot([sample], sample, NOW)).toHaveLength(1);
});
it('caps history at 500 samples', () => {
  expect(appendSnapshot(historyOf500, newSnapshot, NOW)).toHaveLength(500);
});
```

- [ ] Run `npm.cmd run test -- tests/observations.test.ts tests/alerts.test.ts`; confirm failure before implementing the functions.
- [ ] Implement pure calculations and versioned storage. A storage failure leaves an in-memory workspace usable and visible as unsaved. Invalid or stale data produces an explicit warming-up/unavailable result instead of a movement number.
- [ ] Run focused tests and typecheck. Commit the observation engine.

### Task 4: Market discovery and research workspace

**Files:** Create `src/app/layout.tsx`, `page.tsx`, `globals.css`, `src/features/workspace/ResearchWorkspace.tsx`, `useMarketData.ts`, `useWorkspace.ts`, `src/features/markets/MarketList.tsx`, `MarketDetail.tsx`, `TradeTape.tsx`, `src/features/observations/Watchlist.tsx`, `HistoryChart.tsx`, `Comparison.tsx`, `tests/e2e/workspace.spec.ts`, `playwright.config.ts`.

**Interfaces:** Consumes server `ReadResult<T>` and task 3 workspace functions. `useMarketData({ mode, query, activeId, watchedIds })` returns catalog, detail, trades, read states and load-more/refresh actions. Mode changes cancel outstanding work; market/filter changes must ignore old responses.

- [ ] Write browser tests for discover → detail → watch → compare, categories/phase filters, cursor pagination, scoped text search, loading/empty/error states, changing selection during delayed requests, and live mode without configured access.

```ts
test('cannot silently replace live data with an example', async ({ page }) => {
  await page.goto('/?mode=live'); // test server has no key
  await expect(page.getByText('Live access is not configured', { exact: true })).toBeVisible();
  await expect(page.getByTestId('demo-banner')).toHaveCount(0);
});
```

- [ ] Add the app shell needed to run tests, then run `npm.cmd run test:e2e -- tests/e2e/workspace.spec.ts` and confirm the feature assertions fail before implementing the workspace.
- [ ] Implement the light English interface, original EventScope identity and linked `Powered by Panta`. Show catalogue volume and API read time with accurate labels. Never display market list null quotes as 0.
- [ ] Refresh only active/watched details on a 30-second cadence with cancellation. Persist genuine fetchedAt snapshots, separate source modes, and show observation start, curve gaps and alert warm-up. One valid sample does not become a historical line.
- [ ] Provide labelled controls, keyboard navigation, non-color-only changes, desktop layout and narrow-screen detail navigation. Generic setup messages link to local README instructions; no credential entry goes into browser storage.
- [ ] Run the browser task tests and typecheck. Commit the usable research workspace.

### Task 5: Evidence brief and reproducible exports

**Files:** Create `src/features/briefs/model.ts`, `build.ts`, `export.ts`, `BriefPanel.tsx`, `tests/briefs.test.ts`, `tests/e2e/exports.spec.ts`.

**Interfaces:** Consumes `Market`, `Snapshot[]`, `Trade[]`, and `ReadResult` metadata. Produces `buildEvidenceBrief(input): EvidenceBrief` plus `exportBriefMarkdown(brief)`, `exportBriefJson(brief)`, `exportBriefCsv(brief)`. The input captures the selected market and time once so output cannot mix refresh states.

- [ ] Write tests for consistent quotes/timestamps, null and stale data, no valid baseline, actual transaction evidence, demo labels, invalid explorer signatures, and CSV cells beginning with `=`, `+`, `-`, `@`, tab or newline.

```ts
it('keeps source mode in the exported evidence', () => {
  const json = JSON.parse(exportBriefJson(demoBrief));
  expect(json.mode).toBe('demo');
  expect(json.observedAt).toBe(demoBrief.observedAt);
});
```

- [ ] Run `npm.cmd run test -- tests/briefs.test.ts`; confirm failure before implementing generation/export.
- [ ] Implement English rule-based observations with no fabricated explanation or news source. Include market identifier, mode, read time, observation window and evidence. Validate explorer IDs and escape CSV formula prefixes.
- [ ] Add the brief panel and browser download checks. Run the focused tests and `npm.cmd run test:e2e -- tests/e2e/exports.spec.ts`; commit the complete evidence workflow.

### Task 6: Quality verification and English submission package

**Files:** Create `README.md`, `LICENSE`, `docs/submission/requirements.md`, `panta-application.md`, `colosseum-application.md`, `demo-script.md`, `status.json`, `tests/e2e/accessibility.spec.ts`, `scripts/verify-live.mjs`; refine relevant app/test files only when these checks expose a defect.

**Interfaces:** Consumes the working app. `npm.cmd run verify:live` uses server environment variables, reads categories/catalog/detail/trades, and writes a secret-free dated summary to an ignored output folder. It never registers an account, creates a market or submits a transaction. The status record distinguishes software, live validation, repository, video, main entry and sponsor entry.

- [ ] Write browser checks for 390px narrow-screen flows, keyboard operation, safe rendering of malicious titles/descriptions, source-mode changes and unavailable prices. Confirm the affected assertion fails before fixing each discovered defect.

```ts
test('supports narrow-screen research and export', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?mode=demo');
  await expect(page.getByRole('heading', { name: 'Discover markets' })).toBeVisible();
  await expect(page.getByTestId('demo-banner')).toBeVisible();
});
```

- [ ] Run `npm.cmd run test`, `npm.cmd run typecheck`, `npm.cmd run build`, and `npm.cmd run test:e2e`. All applicable software checks must pass; inspect desktop/mobile screenshots and fix material visual defects.
- [ ] Prepare README startup/key instructions, MIT license for independently written code, feature/limitation descriptions, requirements-to-evidence mapping and English application drafts. Include no invented users, usage, funding or completed submissions.
- [ ] When a legitimate key and free-access conditions are confirmed, run the live verification command and inspect the actual results. Run the real-data demo long enough to collect a valid observation window; do not replace failed verification with example results.
- [ ] Prepare a 2–3-minute English demo script and screenshot set. A video is complete only after recording actual working screens; a script is not a submitted video.
- [ ] Before publication/submission, recheck official scope/deadline/eligibility, prepare the public repository and both application forms, then record actual created URLs and submission results through supported authenticated tools. Authentication problems or missing participant information remain explicit dependencies.
- [ ] Commit verified software and materials. Update status only with actual evidence; do not mark the task complete solely because the local demo works.

## Execution recommendation and dependencies

建议 Native：在本聊天按任务顺序实现。各任务共享的数据和读取时间定义较紧密，单人连续执行可以减少接口漂移；关键计算和来源区分有独立测试。

用户已授权按确认的设计开发，本计划供审阅与调整；默认在本聊天连续实施。联网验证另需合法 Panta 开发者凭据和免费访问条件确认。凭据尚未具备时继续开发与测试本地版本，把真实联网验收保留为未完成。

## References

- Confirmed design: `docs/superpowers/specs/2026-10-08-panta-eventscope-design.md`
- Sponsor requirements: https://superteam.fun/earn/listing/panta-api-side-track
- Next.js installation/runtime requirements: https://nextjs.org/docs/app/getting-started/installation
- Panta contracts and limits: https://docs.panta.market/llms.txt
- Stable package metadata: https://registry.npmjs.org/
