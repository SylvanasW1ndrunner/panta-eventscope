# Actual Panta integration evidence

The participant explicitly requested read-only verification on 9 October 2026 (Asia/Shanghai). Evidence timestamps below use UTC. This record separates authenticated API reads from the fictional prototype walkthrough.

## Environment distinction

The initial test key authenticated successfully, but a market request returned an explicitly labelled sandbox fixture: “Sandbox test market”, with a disclaimer stating it was not on mainnet. Its synthetic address failed the existing 32-byte base58 validator. The validator was retained.

A live key was created for the same account without revoking other keys. That label describes its use by EventScope; it does not assert that the provider restricts the key itself to GET requests. Both keys remain in ignored local configuration, outside browser assets and public Git history.

## Four production response contracts

At **2026-10-08T16:35:17.453Z**, the existing production reader and parsers completed a finite check:

| Resource | Actual result |
| --- | --- |
| Categories | Parsed successfully; 8 categories |
| Catalogue, limit 1 | Parsed successfully; 1 returned market |
| Detail | Same market ID; secondary phase; YES and NO quotes available |
| Trades, limit 50 | Same market ID; 15 returned records |

The selected market was `9ArgG5SQf9T6QbVWEjNwpBpNkdPjNWNTNB15nkdivv15`, “Will Arsenal beat Leeds United on October 10, 2026?”. There were four upstream GETs and zero transaction requests in this check. No account identifiers or credentials are included in this summary.

## Observed provider variability

Other reads of that detail returned HTTP 200 with null price and volume fields. Two earlier detail reads timed out at the application's eight-second limit. A separate diagnostic request with a 20-second cap later completed in 2.28 seconds, so that diagnostic did not establish that extending the application timeout would fix the variability.

Catalogue quotes were sometimes populated, although the documentation describes a catalogue projection without live pricing. Catalogue and detail reads remain separate sources. EventScope never uses catalogue quotes to fabricate detail history. A 20-row catalogue also included empty titles and zero volume fields; empty titles receive a visible placeholder and abbreviated ID, and returned zero values remain zero.

The actual browser run collected **20 detail samples over 665.702 seconds**, including 16 available YES quotes and four missing quotes. It made 39 upstream GETs; the 100-request cap was not reached. The final capture had YES `0.51684771` and NO `0.48315229`, with 15 returned tape records. Actual JSON, Markdown and CSV downloads were checked for the same market, quotes and read timestamp.

The captured baseline is null because missing quotes interrupt continuity. This run establishes actual observation and export behavior, including interrupted history; it does not establish an uninterrupted ten-minute alert baseline. Alert arithmetic and continuity are separately tested with explicitly synthetic inputs. No independent on-chain confirmation, uptime, external traction or free quota is claimed.

See [the dated verification summary](../live/verification.json), [actual observations](../live/observations.json), [captured brief](../live/evidence-brief.json) and [live screenshots](../live/README.md). The final-build screenshots restored that exact saved workspace, without changing any timestamp or value, and made four additional real GETs under a separate 20-request/three-minute cap. The recapture returned null quotes; the screenshots keep them missing while displaying the earlier observed segments.

## Authorisation and limits

The private UI verification uses the same production reader, a loopback-only server, a 15-minute lifetime and a maximum of 100 upstream GETs. The persistent free-access flag remains false. No purchase, signing, market creation, position, trade-building or claim endpoint is used. Continuous public key-backed hosting is not enabled.

Primary references: [Panta authentication](https://docs.panta.market/guides/authentication), [market catalogue](https://docs.panta.market/api-reference/markets/list), [market detail](https://docs.panta.market/api-reference/markets/get), and [sponsor requirements](https://superteam.fun/earn/listing/panta-api-side-track).
