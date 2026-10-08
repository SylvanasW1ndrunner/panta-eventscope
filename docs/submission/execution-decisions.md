# Implementation decisions

The following decisions preserve the implementation ledger in chronological order. External entry gates remain pending; this is not a completed-submission record.

## Rulings I made

- reuse the fresh standalone EventScope repository on feat/eventscope instead of creating a second checkout — the parent audit directory is not a Git repository, this project already provides isolation, and a managed worktree tool would address the wrong repository — cost if wrong: less checkout isolation within this new project, with no other changes or collaborators present.
- keep shared data types (including Snapshot) in the market domain and re-export them from the observation module — fixtures and UI need the same type before Task 3 exists — cost if wrong: modest domain coupling, no duplicated runtime representation.
- extend ReadResult with optional retryAt — cached results also need to display a real rate-limit deadline — cost if wrong: an additive metadata field, consumed only when present.
- require no gap above 90 seconds for alerts and chart continuity — 30-second polling can miss two samples without claiming continuous monitoring after a browser pause — cost if wrong: a conservative missed alert, rather than a fabricated interval.
- expose storageNotice as transient SavedWorkspace metadata — the planned load signature needs to return a visible unsaved/reset condition — cost if wrong: an additive field, excluded from saved payloads.
- retain the planned Playwright TypeScript regression suite and use Python Playwright for visual inspection — reproducible npm test commands stay with the app while the testing skill also supplies independent visual inspection — cost if wrong: two test runtimes during development, not in product dependencies.
- split Task 6 into local software/material verification and external gates — legitimate key/free quota, personal eligibility and actual platform entries cannot be invented — cost if wrong: delayed submission; full task remains pending until these gates pass.
- use compatible installed Node 24.18.1 and explicit boundary parsers instead of planned Node 24.19.0/Zod — all required validations have direct tests — cost if wrong: additional manual schema maintenance.
- authenticated compatibility and free allocation declined by reviewer — legitimate key created and privately configured, but free allowance remains unconfirmed; real data verification stays gated — cost if wrong: delayed real integration and entry preparation.
- public key-backed host abuse declined by reviewer — only loopback hosting is configured; no public live host is claimed — cost if wrong: a later public launch needs access controls and quota review.
- eligibility, registration and completed entries declined by reviewer — actual participant declarations and platform receipts are required and remain pending — cost if wrong: local materials do not establish prize eligibility or entry completion.
- changing media and exports declined by reviewer — independently recapture the final built app and inspect actual frames and exports before publishing them — cost if wrong: media could show an older build; example video never proves production reads.
- late cache with an injected fetch ignoring abort — production native fetch and body consumption honor the AbortSignal; no production defect established, code stands — cost if wrong: a broken cancellation contract could allow late cache writes.

## Deferred minors

No polish-only Minor finding remained deferred from the final review. The category-retry finding was regraded as a functional issue and fixed.
