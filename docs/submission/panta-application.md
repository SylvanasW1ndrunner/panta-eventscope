# Panta sidetrack application draft

**Project:** EventScope

**One-line pitch:** A prediction-market research desk that preserves the evidence behind each observed quote and change.

## What we built

Researchers and creators can find an event, but a current percentage is difficult to cite without its observation time, market conditions and data limits. EventScope connects discovery to a reproducible evidence workflow: browse events, inspect detail quotes, watch a small set, compare events and export a fixed research brief.

The prototype handles missing prices, phase changes, cached reads and incomplete trade records explicitly. It does not turn unavailable prices into zero or manufacture a historical chart from trade amounts. Each brief keeps the market, quote, source mode and timestamp that the user actually captured.

## How Panta is used

Panta provides the core event catalogue and classifications through `GET /categories/` and `GET /markets/`. `GET /markets/{marketId}/` supplies detail quotes for observation snapshots. `GET /markets/{marketId}/trades/` supplies a bounded tape and format-valid transaction links where available. Removing these data resources removes the app's live research workflow.

Read requests stay on the server, with validated parameters, caching, deduplication, concurrency limits, timeouts and rate-limit pauses. The interface links **Powered by Panta** and clearly distinguishes source data from fictional examples.

## Product workflow

1. Filter the catalogue by category and market phase; search the currently loaded set.
2. Inspect a market's YES/NO quotes, description, catalogue volume and scheduled dates.
3. Watch up to four events. Browser-open observations create a real sample history; compare up to three.
4. Use conservative percentage-point alerts after an uninterrupted 10–15 minute baseline exists.
5. Capture and export the same Evidence Brief as Markdown, JSON or CSV.

## Execution and originality

The independently authored Next.js/TypeScript product includes exact Decimal.js price calculations, bounded read-only integration, versioned local storage, responsive views and reproducible tests. The product's focus is evidence preservation: it tells the user which claims the available data can support and captures that boundary with the research.

Potential users are event researchers and creators who need repeatable source material. This is a target-user hypothesis; no validated demand or outside usage is claimed.

## Current evidence and limits

See `status.json`, `quality-verification.json` and [live integration evidence](live-integration.md) for actual completed checks. A locally configured live key has verified all four production read contracts, including available detail quotes and 15 returned trade records for the selected event. The earlier test key authenticated but returned explicitly labelled sandbox fixtures; it was not production-market evidence. Credentials remain private.

Real reads also returned null valuations and intermittent timeouts. The app keeps these states visible, preserves valid catalogue volume with its own read time, and identifies records whose titles are missing. The example walkthrough is a clearly labelled fictional demonstration. The dated production checks are separate evidence. Continuous public key-backed hosting remains pending quota and access-control verification.

The actual browser run collected 20 detail samples over about 11 minutes, including four missing quotes. Its JSON, Markdown and CSV exports were checked for the same market, quotes and read time. The missing quotes correctly prevented a continuous ten-minute change baseline. [Production screenshots and captured evidence](../live/README.md) demonstrate that behavior separately from the fictional walkthrough.

No external users, revenue, financial transactions or prior funding are claimed. AI assistance was used for implementation, tests and documentation. Runtime briefs are rule-based and do not use an LLM.

## Final links

- Public repository: [EventScope source and documentation](https://github.com/SylvanasW1ndrunner/panta-eventscope)
- Prototype video: [2-minute-18-second English walkthrough, downloadable WebM](https://raw.githubusercontent.com/SylvanasW1ndrunner/panta-eventscope/main/docs/demo/prototype.webm)
- Screenshots, recording metadata and actual exported examples: [Prototype materials](https://github.com/SylvanasW1ndrunner/panta-eventscope/tree/main/docs/demo)
- Actual production API evidence and captured exports: [Real-data verification](https://github.com/SylvanasW1ndrunner/panta-eventscope/tree/main/docs/live)
- Colosseum main entry: not yet submitted
- Superteam Panta entry: not yet submitted

The public repository and video were verified after publication. Main and sponsor entry links still require actual submission receipts.
