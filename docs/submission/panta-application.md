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

See `status.json` and `quality-verification.json` for actual completed checks. The local example workspace uses clearly labelled fictional markets. Authenticated production integration and a real-data observation window are **pending Panta credentials and confirmed free access**. Do not describe the example video as live evidence.

No external users, revenue, financial transactions or prior funding are claimed. AI assistance was used for implementation, tests and documentation. Runtime briefs are rule-based and do not use an LLM.

## Final links

- Public repository: pending actual publication
- Working demo / video: pending verified actual URL
- Colosseum main entry: not yet submitted
- Superteam Panta entry: not yet submitted

Replace these fields only with actual verified links before submitting.
