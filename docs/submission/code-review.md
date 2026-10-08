# Independent review and fix verification

An independent reviewer examined the complete implementation range `f475f8578fa28f7485a3063eb8533572cefa9ce4..d25ff7a10e7c52186142b249ac03b2e79f9555c8`. The reviewer used source inspection and two in-memory probes, without authenticated Panta reads. No Critical finding was reported. Five findings were graded Important; a category-retry finding was initially Minor and was regraded Important because a failed core discovery resource could silently disappear and never recover through the refresh control.

The implementer addressed these findings in one fix pass. Every accepted finding had a regression that failed before its fix. No second review was commissioned.

| Finding | Resulting behavior | Regression evidence |
| --- | --- | --- |
| Filtering could automatically select a market from the previous catalogue | Catalogue state is identified by mode and query; auto-selection uses the matching completed read; an empty selection clears research and export controls | Newly filtered detail and empty-selection Chromium tests RED→GREEN |
| Concurrent rate limits could shorten the shared pause | The latest pause preserves the maximum deadline, regardless of response order | Both 120/30-second arrival orders covered; premature-read case RED→GREEN |
| Successful comparison and tape reads did not age during a pause | Shared freshness advances with wall-clock age; brief capture fixes tape staleness at capture time | Freshness boundary tests, old-tape brief test and paused-read Chromium flow RED→GREEN |
| Successful stale catalogue fallback and pagination lost freshness evidence | Original oldest page time, stale flags and warnings survive page merging and remain visible with a retry control | Stale fallback and old-page/new-page Chromium flows RED→GREEN |
| A later quote alert replaced an earlier unacknowledged alert | Identified market notifications remain individually visible, openable and dismissible; a bounded queue reports overflow | Queue identity/deduplication/bound tests and simultaneous/later-crossing Chromium flows RED→GREEN |
| Category failures were hidden and refresh did not retry them | Discovery displays the failure and provides a working category retry | Category failure/recovery Chromium flow RED→GREEN |

The complete post-fix suite passed **110/110 unit tests across nine files**, **21/21 Chromium workflows**, TypeScript checking and a production build. Browser tests use local fictional fixtures with upstream credentials explicitly disabled. Alert-window fixtures are synthetic test inputs, not product-preloaded history or live evidence. Two older browser assertions were narrowed to the catalogue error after the new, intentionally visible category error made their broad text selectors ambiguous.

The rebuilt production example workspace was inspected at desktop and 390px mobile sizes. Captures reported no browser page errors or horizontal page overflow. Export files were downloaded through the real application controls. Live verification remained blocked by the unconfirmed free-access condition, with zero upstream calls in that check.

## Rulings on matters the reviewer declined to judge

The rulings below record the review's state on 8 October. A later explicit request authorised finite production reads; [the dated integration record](live-integration.md) supersedes the earlier pending-read status without claiming a free quota. No second independent review was commissioned.

- **Authenticated compatibility and account allowance:** a legitimate API key has now been created and saved locally, but no free allowance has been confirmed. Production market-data verification and a real observation window remain pending. Cost if wrong: entry preparation is delayed until the actual response contracts and quota are established.
- **Anonymous use of a public key-backed host:** only loopback hosting is configured; no public live-data host is claimed. Cost if wrong: public hosting needs a separate access-control and quota decision before launch.
- **Participant eligibility, registration and entries:** these require actual participant declarations and platform receipts. They are still pending. Cost if wrong: prepared materials alone do not secure entry or prize eligibility.
- **Media and export files changing during capture:** final screenshots, downloads and the recorded walkthrough are checked independently after the code fix pass. Their current state is recorded in the delivery and quality manifests. Cost if wrong: a presentation could show an earlier application version; no video is treated as production-read evidence.
- **An injected fetch implementation that ignores abort:** the production implementation uses native fetch and body consumption with an AbortSignal. No production defect from the proposed late-cache scenario was established, so the implementation stands. Cost if wrong: a runtime violating that cancellation contract could permit a late cache write.

No polish-only Minor finding remains deferred from this review. The category-retry finding was regraded and fixed as a functional issue. This review establishes local software behavior; it does not establish completed entries, authenticated production operation, external demand or a prize outcome.

## Follow-up integration verification, 9 October 2026

Actual responses exposed two additional display problems: null detail valuation hid known catalogue volume, and empty titles made market rows and later research controls unidentifiable. Both received browser regressions that failed against the original behavior and passed after the fixes. The complete suite then passed 110 unit tests, 23 Chromium workflows, TypeScript and a production build. The updated example video and desktop/mobile screenshots were recaptured from that build and inspected independently.

Four authenticated production response contracts and a real 20-sample browser observation/export run are now recorded separately. Missing quotes prevented an uninterrupted alert baseline. Participant eligibility, main registration and both official submission receipts remain pending.
