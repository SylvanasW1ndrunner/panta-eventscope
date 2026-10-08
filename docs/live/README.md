# Actual production-data evidence

These materials use authenticated Panta production responses. They are separate from the [fictional prototype walkthrough](../demo/README.md).

- [Dated integration summary](verification.json)
- [Actual detail observations, with original timestamps and missing values](observations.json)
- [Captured JSON brief](evidence-brief.json), [Markdown](evidence-brief.md), [CSV](evidence-brief.csv)
- [Final-build desktop viewport](desktop-viewport.png), [full desktop](desktop.png), [390px mobile](mobile.png)
- [Visual verification](visual-check.json)

The browser run collected 20 actual detail samples over about 11 minutes, with 16 available YES quotes and four missing quotes. No earlier history, virtual clock or fabricated prices were used. Missing samples interrupted continuity, so the brief correctly has no ten-minute change baseline. All three exports fix the same market, quotes and API read timestamp.

The final-build screenshot capture restored the exact saved real workspace, preserved its timestamps and made four additional bounded real GETs. The provider returned null valuations during recapture. The screenshots display missing current quotes and the earlier observed segments, rather than pretending continuous pricing was available.

The recorded market ID is a valid 32-byte base58 address. Trade links validate signature format; an independent on-chain verification is not claimed. No purchase, wallet connection, transaction, external users, revenue or completed contest entry is represented.
