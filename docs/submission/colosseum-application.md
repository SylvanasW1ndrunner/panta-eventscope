# Colosseum main application draft

**Project name:** EventScope

**Suggested ecosystem:** Solana, through Panta's documented market infrastructure. Final track selection must match the actual registration form and eligibility.

**Description:** EventScope is an independent prediction-market research workspace. It turns event discovery, detail quotes and bounded transaction records into an observed research window and exportable evidence brief.

## Problem and users

A market percentage is a snapshot, not a complete research record. Researchers and creators need to know when a quote was read, which resolution condition applies, and whether an apparent movement is actually supported by the available samples. EventScope preserves those details instead of filling gaps with invented history.

The initial audience is event researchers and content creators. That audience remains a product hypothesis. There is no claimed external traction.

## Demonstration

Discover an event by category and phase, inspect its detail quotes, watch it while the browser remains open, compare a small set of watched events, and capture a fixed brief. Markdown, JSON and CSV downloads share the same quote and read timestamp. Missing data, phase changes, stale reads and fictional examples are explicit.

## Blockchain integration

The app consumes Panta's Solana prediction-market API through four core GET resources. Valid live transaction signatures can be opened in Solscan; format validation alone is not an on-chain verification claim. The app does not connect a wallet, create a market, sign, trade or claim funds.

## Technical work completed during the hackathon

The local Git record begins on 8 October 2026. Product code and fictional examples were independently authored with AI assistance; no Panta playground code was copied. Implementation includes the server-side reader, market parsers, exact quote movements, observation continuity, alerts, browser storage, responsive interface, evidence capture and exports. Third-party dependency licences are identified in the README and lockfile.

## Future product hypothesis

Start with a free, local research workflow for independent researchers and creators. Test whether a source-labelled brief saves effort when citing prediction-market observations. If that demand is demonstrated, team research workspaces and reusable evidence feeds could become a paid service, subject to Panta's data and commercial terms. Shared workspaces, paid plans and validation interviews are future hypotheses, not shipped features or claimed traction.

The first version delivers one observation-to-export workflow, with continuity and evidence preservation at its centre. Authorised production API reads have now verified all four response contracts, including detail quotes and trade records. The next validation milestone is feedback from researchers; there are no measured adoption or revenue results yet.

## Status

The repository's status and verification records distinguish local software, actual API reads, public code, video and submissions. The production build requires only the server-side `PANTA_API_KEY`; its homepage defaults to live data. The current default-homepage workflow, actual automatic refresh and a live-source JSON export were independently checked. Verification includes 110 unit tests, 23 browser workflows, TypeScript checks and a production build. Null valuations and timeouts remain visible and are documented in [integration evidence](live-integration.md). Browser fixtures and fictional examples are not production evidence. The repository provides server deployment instructions; no public hosted live URL is claimed.

## Participant fields requiring actual information

- Participant/team details and country of residence
- Age and other eligibility declarations, including sponsor affiliations and employer obligations
- Main-registration confirmation and actual ecosystem selection
- Main-entry URL, after actual submission
- Any wallet or payment details requested by the official process

Do not invent profile details, check eligibility boxes without confirmation, or mark this draft submitted. One main project per team and the official registration rules apply.

## Verified public materials

- [Public source repository](https://github.com/SylvanasW1ndrunner/panta-eventscope)
- [English prototype walkthrough, downloadable WebM](https://raw.githubusercontent.com/SylvanasW1ndrunner/panta-eventscope/main/docs/demo/prototype.webm)
- [Screenshots, exports and recording metadata](https://github.com/SylvanasW1ndrunner/panta-eventscope/tree/main/docs/demo)
- [Actual production response checks and live-source exports](https://github.com/SylvanasW1ndrunner/panta-eventscope/tree/main/docs/live)

The 2-minute-18-second recording uses labelled fictional data and actual local application actions. It does not establish authenticated production reads or a completed entry.

## Concise form description

EventScope helps researchers turn prediction-market snapshots into reproducible evidence. Built with Panta's Solana market API, it connects event discovery, independently returned YES/NO quotes and recent trade records to browser-open observations and a fixed exportable brief. Missing prices and observation gaps are explicit, and changes are calculated only from suitable observed samples. The responsive prototype supports small watchlists, comparisons and Markdown, JSON and CSV captures. API keys stay on the server, with caching, request coalescing and rate-limit backoff. The repository includes the working product, English walkthrough, current real-data verification and reproducible tests. The product hypothesis is a research workflow for independent analysts and creators, with possible team workflows after user validation. AI assisted implementation and documentation; no external users, revenue or funding are claimed.
