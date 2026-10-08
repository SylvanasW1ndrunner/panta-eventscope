# English demo script — EventScope

Target length: 2–3 minutes, an internal recommendation rather than a stated Panta time limit.

## 0:00–0:20 — The research problem

“A prediction-market quote is easy to screenshot. It is harder to explain when it was read, what condition the event settles on, and which part of a claimed change is actually observed. EventScope keeps that evidence together.”

Show the EventScope research desk and linked Powered by Panta label. Identify the source mode immediately. If demonstrating examples, say: “This walkthrough uses clearly labelled fictional examples; production integration verification is separate.”

## 0:20–0:45 — Find the event

“Panta's category and catalogue endpoints provide market discovery. Search covers the loaded markets, and cursor pagination expands that set. The catalogue does not provide live prices, so opening an event reads its detail quotes.”

Filter a category or phase, open an event, and point out current quotes, market conditions, catalogue volume and read time. Do not call volume a 24-hour measure.

## 0:45–1:15 — Observe responsibly

“Add an event to the watchlist. While the browser is open, EventScope reads active and watched details every thirty seconds. The history comes from actual observations. One quote is one sample, not a trend.”

Add a second event and compare. Show the observation-start label and independent read times. If a real ten-minute window has not been collected, retain the warm-up label and say that the alert is not yet eligible.

## 1:15–1:35 — Evidence and limits

“A movement needs an uninterrupted same-phase baseline ten to fifteen minutes earlier. Missing quotes, phase changes, stale reads and long observation gaps pause the signal. The recent trade tape is bounded; its share amounts cannot reconstruct price history.”

Show the threshold control and trade table. Example rows have no explorer links. In live mode, describe a link as format-validated transaction evidence, not proof that a transaction has been independently verified.

## 1:35–2:15 — Make the research reproducible

“Generate a brief to freeze this market, source, quotes and timestamps. The Markdown, JSON and CSV exports all use the same capture. A later refresh cannot silently change the brief.”

Generate, open Interpretation & limits, and download JSON. Display its actual mode and observedAt fields. Download Markdown or CSV. Show a narrow-screen flow if time permits.

## 2:15–2:30 — Close

“Panta provides the market infrastructure. EventScope adds a small, reproducible research workflow with explicit data boundaries. The code, tests and current integration status are available in the project repository.”

Only show links that have actually been created. Do not claim production reads, users, revenue or completed entry forms that remain pending. Keep API keys and personal profile screens out of the recording.
