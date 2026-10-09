# EventScope Product Design

Date: 2026-10-08. Status: the user approved this design and authorised development in this chat. The implementation plan remains available for review and adjustment.

## Goal and audience

The user selected the Panta API sidetrack and wants a well-executed entry. The first version serves prediction-market researchers, creators and event observers by turning Panta market data into a traceable research workspace. This audience is a design hypothesis, not validated demand.

Use an English interface and submission package, with Panta as the core live data source. Preserve the no-upfront-spending requirement. Completion includes a runnable local app, authenticated API verification, public code and English demonstration materials. Any award is recorded separately.

## Options considered

| Direction | Benefits | Cost and limits |
| --- | --- | --- |
| EventScope research desk, selected | Catalogue, detail, categories and trade records support a coherent observe, compare and export workflow with bounded API use. | Needs legitimate credentials and actual samples before showing its own observation history. |
| AI news and market summaries | Natural-language event exploration. | Adds news licensing, model costs, source checks and incorrect attribution risks. Outside the first version. |
| Embeddable market components | Small integration surface for blogs and communities. | Needs a real distribution channel and can remain merely a catalogue widget. Outside the first version. |

## First-version workflow

1. Discover events through Panta categories and phases. Search only the loaded catalogue; cursor pagination expands the search coverage.
2. Select a market to inspect its description, YES/NO quotes, catalogue volume, phase, scheduled end and resolution times, and API read time.
3. Watch at most four events. Read details while the browser is open and keep samples in that browser. Compare at most three events.
4. See observed quotes and recently returned trades. Link format-valid live signatures to an explorer. Show actual gaps when evidence is insufficient.
5. Set quote movement alerts and capture an Evidence Brief with the market identifier, read times, phase, observed change, missing-data notes and trade evidence.

No wallet connection is needed. Do not add trading, market creation, signing or transaction broadcasting.

## Interface

Use the independent EventScope identity and linked **Powered by Panta** attribution wherever Panta data is presented. Desktop shows discovery, current research and the watchlist. Mobile switches between those panels and preserves filters, comparison and export controls.

Use a light background, dark text and restrained violet accents. Changes have direction symbols and numbers in addition to colour. Keep titles, data typography, spacing and loading states consistent. Filters, market selection and watching must work with a keyboard. Narrow screens must not obscure controls.

## API boundary

Fixed production origin: `https://live-api.panta.market/api/v1/`.

| Panta resource | Product role | Verified boundary |
| --- | --- | --- |
| `GET /categories/` | Category filter | API key or Bearer authentication required. |
| `GET /markets/` | Catalogue, phases and cursor pagination | category, status, cursor and limit; at most 50 per page. List quotes are null, not spot prices. |
| `GET /markets/{marketId}/` | Quotes and conditions | Quotes may be available when RPC is available; missing quotes remain possible. |
| `GET /markets/{marketId}/trades/` | Returned trade tape and evidence | At most 200 records. Documented fields cannot reconstruct a complete price history. |

All these resources need credentials. Superteam Google login does not authenticate Panta. The participant authorised normal local read-only use on 9 October, superseding the original local free-confirmation gate. `PANTA_READ_ACCESS_ENABLED=true` enables legitimate server-key reads without asserting a free allowance. A test-prefixed key authenticates on the API host but our verification returned non-mainnet fixtures; actual market reads use a live key.

## Data meaning

- YES/NO are returned quotes. Market-implied odds are an interpretation, not a model forecast.
- Null, invalid or out-of-range quotes and failed reads never become zero. Keep available metadata and display missing values.
- `volumeUsdc` is catalogue volume. Do not claim a 24-hour window or derive trade notional from share amounts.
- Movements use percentage points: 0.40 to 0.45 is exactly +5 pp. Compare valid samples only within the same market and phase.
- History comes from actual detail reads by this app. Display observation start. One sample never creates a historical line. Missing values and phase changes interrupt the curve.
- The trade table contains recently returned records, not full history. Do not invent a missing block time.
- Briefs use deterministic rules over visible data and actual read times. The first version needs no paid LLM or news service.

## Architecture and flow

Use Next.js and TypeScript for one deployable UI/server project.

1. A server Panta reader calls the four GET resources and handles timeout, authentication, rate limits and schema errors.
2. Response parsers normalise market, quote and trade fields and preserve source/read metadata.
3. A browser observation engine owns the watchlist, snapshots, phase boundaries and alerts independently of UI components.
4. React presents discovery, detail, comparison, chart, read states and export.

Keep the developer key solely in server environment variables. Never place it in frontend bundles, URLs, browser storage, logs or public code. Expose fixed read routes rather than arbitrary upstream URLs or paths. Validate path and query parameters.

Initially verify a local single-process app. Public code and demonstration media are deliverables. Public key-backed hosting separately requires confirmed free quota and access controls so anonymous requests cannot consume an uncontrolled allowance.

Cache catalogue and categories for 60 seconds, detail for 15 seconds and trades for 30 seconds, preserving the last actual response time. Coalesce identical reads and cap upstream concurrency at two. Refresh watched details every 30 seconds, at most four watched events. No immediate error retry loops. Honour 429 Retry-After and display the pause deadline. Confirmed account quota is the upper bound on polling cadence.

Keep at most 500 snapshots per market for seven days. Deduplicate by the server's response-read time; serving a cached response is not a new observation. This time is neither the last transaction timestamp nor Panta's internal update time. State that monitoring stops when the browser closes and provide a clear-history control.

Alert threshold defaults to 5 pp and allows 1–20 pp. Compare against the closest valid sample at least ten minutes earlier, but no more than fifteen minutes earlier, in the same uninterrupted phase. A missing baseline means insufficient observations, not an alert. Emit once per threshold crossing; allow another emission after the condition resets. Alerts work only while open.

## Missing data, failures and example mode

- Missing key: show setup guidance and let the user explicitly select clearly labelled fictional examples. Never automatically substitute examples for live data.
- Invalid key: show authentication failure with no secret or raw upstream body. Do not ask for keys in chat.
- Missing quotes or trades: keep readable metadata and mark the relevant analysis unavailable.
- Failed refresh with cached data: retain its original time, mark stale/cache status. Quotes older than 60 seconds never trigger alerts.
- Example markets, histories and exports carry a distinct source mode and are isolated from live observations.
- Render external content as text, validate evidence links and prevent CSV formula injection.

The implementation adds a conservative 90-second continuity boundary: missing more than two normal 30-second polling intervals breaks charts and alert windows. This can suppress an alert rather than invent continuity after a browser pause.

## Acceptance

1. README startup works; TypeScript, production build and necessary tests pass.
2. Categories, phase filters, cursor pagination, loaded-set search, empty states and read failures work.
3. With legitimate credentials and reads enabled, verify real catalogue, detail, categories and trade reads. Record time and results without secrets.
4. Missing prices remain missing, phase switches create no false change, and one sample stays one sample.
5. Polling, charts and alerts consume the same valid snapshots. Verify exact pp calculations, crossings and deduplication.
6. Distinguish live, example, cached and stale reads in UI and exports. Captures match the visible source at generation.
7. Inspect desktop and narrow-screen discovery, selection, watching, comparison and export; repair material obstruction, truncation or inaccessible controls.
8. No developer secret appears in frontend resources, errors, repository or video.

## Delivery and competition materials

Deliver standalone code, English README, environment example, test guidance, screenshots, product explanation and demo script. Recommend a 2–3-minute walkthrough of the problem, source, observations and capture value; this duration is our recommendation, not a Panta requirement. A recording is complete only after actual working screens are recorded. A fictional walkthrough is not live evidence.

Explain how the four Panta resources drive the product and its independent research value. Claim only evidenced users, usage and product status. Panta requires a Colosseum main submission as well as its Superteam entry. The checked deadline is 13 October 2026, 06:59 UTC / 14:59 Asia/Shanghai. Recheck before submitting.

Legitimate credentials and account free-access confirmation remain external dependencies. Actual delivery, eligibility and submission status live in `docs/submission/status.json`; a locally working example does not finish the whole entry.

## Official sources

- [Sponsor requirements](https://superteam.fun/earn/listing/panta-api-side-track)
- [API index](https://docs.panta.market/llms.txt)
- [Authentication](https://docs.panta.market/guides/authentication)
- [Catalogue](https://docs.panta.market/api-reference/markets/list)
- [Market detail](https://docs.panta.market/api-reference/markets/get)
- [Trade records](https://docs.panta.market/api-reference/markets/trades)
- [Categories](https://docs.panta.market/api-reference/markets/categories)
- [Attribution and fees](https://docs.panta.market/guides/terms-of-use)
- [Main competition rules](https://colosseum.com/legal/Crypto%20World%27s%20Fair%20Hackathon%20Rules.pdf)
