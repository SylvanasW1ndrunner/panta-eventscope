# EventScope Evidence Brief

**FICTIONAL EXAMPLE — sample data, not live market evidence.**

## Will SOL close above $250 on New Year’s Eve?

Fictional event for product demonstration\. The example settlement condition is a specified year-end close\. No real exchange price or market is represented\.

- Market ID: `CZ8YUVdk7znjrUmnb5n7kgySk9yRAsQDYmyCxzfSky9t`
- Source mode: demo
- Phase: secondary
- Detail API read: 2026-10-08T11:15:26.210Z
- Brief generated: 2026-10-08T11:15:30.391Z
- Read stale: no
- YES quote: 0.38 USDC / share
- NO quote: 0.62 USDC / share
- Catalogue volume: 113420 USDC
- Market ends: 2026-12-02T00:00:00.000Z
- Scheduled resolution: 2026-12-03T00:00:00.000Z

## Observed window

- Observation start: 2026-10-08T11:14:56.209Z
- Samples: 2
- Baseline: not provided
- YES movement: not established

## Trade evidence

Tape API read: 2026-10-08T11:15:26.211Z.

| Signature | Time (UTC) | Phase | YES / NO shares | Link |
| --- | --- | --- | --- | --- |
| fictional-record-0 | 2026-10-08T09:55:00.000Z | secondary | 24 / 0 | No verified-format link |
| fictional-record-1 | 2026-10-08T09:54:00.000Z | secondary | 0 / 18 | No verified-format link |
| fictional-record-2 | 2026-10-08T09:53:00.000Z | secondary | 62 / 0 | No verified-format link |
| fictional-record-3 | 2026-10-08T09:52:00.000Z | secondary | 15 / 0 | No verified-format link |

## Interpretation and limits

- FICTIONAL EXAMPLE: sample markets and trades\. No actual event or on-chain evidence is represented\.
- An uninterrupted 10–15 minute comparison window is not available\.
- API read time is not the last on-chain trade time or Panta’s internal update time\.
- Catalogue volume is cumulative catalogue data; a 24-hour window is not specified\.
- 4 recent catalogue trade records were captured\. This is a bounded tape, not full chain history\.
- Share amounts and fees do not reconstruct historical prices or trade notional\.
- This brief records observations\. It does not explain why quotes moved or provide a model forecast\.
- Fictional examples\. These are not live markets or on-chain evidence\.

## Source contracts

- [Panta market detail contract](https://docs.panta.market/api-reference/markets/get)
- [Panta trade tape contract](https://docs.panta.market/api-reference/markets/trades)

Independent EventScope workspace · Powered by Panta.
