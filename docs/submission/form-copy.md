# EventScope: copy-ready entry content

Prepared on 9 October 2026 for the Colosseum Crypto World's Fair main entry and Panta API sidetrack. These are suggested answers, not a record of saved or submitted forms. The authenticated editor and its field limits have not been inspected. Match answers to the actual question; do not paste this entire document into one field.

The product claims below are grounded in the [repository](https://github.com/SylvanasW1ndrunner/panta-eventscope), [verification record](quality-verification.json) and [actual API evidence](live-integration.md). Personal details, eligibility declarations and submission receipts remain separate.

## Shared details

| Field | Answer |
| --- | --- |
| Product name | EventScope |
| Category | Data & Analytics |
| Ecosystem, if requested | Solana, through Panta's documented prediction-market API |
| Sponsor integration, if requested | Panta API |
| GitHub repository | https://github.com/SylvanasW1ndrunner/panta-eventscope |
| Product-demo video | https://raw.githubusercontent.com/SylvanasW1ndrunner/panta-eventscope/main/docs/demo/prototype.webm |
| Presentation video | https://raw.githubusercontent.com/SylvanasW1ndrunner/panta-eventscope/main/docs/submission/assets/presentation.mp4 |
| Product logo | https://raw.githubusercontent.com/SylvanasW1ndrunner/panta-eventscope/main/docs/submission/assets/eventscope-logo.png |
| Actual API evidence | https://github.com/SylvanasW1ndrunner/panta-eventscope/tree/main/docs/live |

The product-demo recording is 2 minutes 18 seconds and visibly uses fictional examples. Real production reads are documented separately. If a video field only accepts a video-hosting URL, upload the actual file and use its resulting link. A GitHub raw-file URL has not been confirmed as accepted by the official form.

No public hosted live application URL is available. Leave an optional live-URL field empty; a required field remains pending deployment. A localhost URL cannot be used as a public demo. Do not replace a required live application URL with the repository link.

### Tagline

```text
Follow the event. Keep the evidence.
```

### Short description: compact version

```text
EventScope helps researchers discover prediction markets, observe Panta quotes and export timestamped evidence briefs.
```

### Short description: extended version

```text
A prediction-market research workspace powered by Panta. Discover events, observe YES/NO quotes, compare watched markets and export evidence briefs with actual read times and visible data gaps.
```

## Colosseum main entry

### Product description

```text
EventScope turns prediction-market snapshots into research evidence. A percentage alone is hard to cite: researchers also need the market conditions, observation time and limits of the available data.

The product connects discovery, detail quotes, recent trade records and browser-open observation through Panta's Solana market API. Users can watch up to four events, compare up to three and capture one fixed Evidence Brief as Markdown, JSON or CSV. Every export preserves the same captured market, quote and read timestamp. Missing quotes and interrupted observations remain visible instead of becoming invented price history.

The responsive, open-source Next.js prototype keeps API credentials on the server and respects provider rate limits. Actual production reads have verified all four integrated API resources; source-linked evidence and reproducible tests are included in the repository. The recorded walkthrough uses labelled fictional examples, with real-data checks documented separately.

The initial audience is independent event researchers and creators. Demand is still a hypothesis: the project does not claim external users or revenue. The next validation step is to learn whether timestamped research briefs save effort when people cite prediction-market observations.
```

### Problem and target users

```text
Independent researchers and creators can find a prediction-market percentage, but a screenshot often loses its observation time, market conditions and data gaps. Comparing events across a research session adds another problem: the available API may provide a current quote without the history needed to support a claim about movement. EventScope is designed for people who need to inspect, compare and cite what they actually observed, with those limits preserved in the resulting brief. This target audience has not yet been validated through external user research.
```

### What is distinctive?

```text
EventScope centres the workflow on a fixed evidence capture. The chart contains actual detail-read samples collected while the browser is open; it does not reconstruct historical prices from trade amounts. Missing quotes, stale reads, phase changes and observation gaps are explicit. Markdown, JSON and CSV exports preserve the same capture, so a researcher can share a readable brief and its structured evidence without the two disagreeing. This is the product's design focus, not a claim that no other tool offers comparable features.
```

### Blockchains and integrations

```text
Solana prediction-market data through Panta API. Panta supplies categories, market discovery, individual market details and recent trade records. Format-valid live transaction signatures can link to Solscan; this is not a claim that the application independently verified those transactions on-chain. The current product reads data and does not connect a wallet, deploy a contract, create a market, sign, trade or claim funds.
```

### Technology and implementation

```text
Next.js, React and TypeScript, with Decimal.js for exact quote calculations. A server-only Panta reader validates parameters, caches responses, coalesces duplicate requests, limits upstream concurrency, applies timeouts and respects Retry-After. Browser-local observation storage supports watchlists, comparisons and continuity-aware alerts. Evidence captures export as Markdown, JSON and CSV. Verification includes 110 unit tests, 23 browser workflows, TypeScript checks and a production build. Synthetic browser fixtures and dated production API checks are identified separately in the repository.
```

### Work completed during the hackathon / development history

```text
The local project Git record begins on 8 October 2026, during Crypto World's Fair. Work includes the Panta server reader, market parsing, exact quote calculations, responsive research interface, watchlists, observation continuity, alerts, storage, comparisons and evidence exports, plus tests and integration records. Product code and fictional examples were independently authored with AI assistance. No Panta playground source was copied. Open-source dependencies and their licences are documented in the README and lockfile. The project does not claim earlier product development or validated traction.
```

### Go-to-market and demand validation

```text
Proposed next step: share the prototype with independent event researchers and creators, and observe whether they can complete a discovery-to-export task without assistance. Interviews would test which context they currently lose when citing a prediction market and whether an Evidence Brief reduces that work. Distribution experiments could include research communities, educational walkthroughs and reusable example briefs. Initial measures would be successful task completion, repeat use and whether users reuse the exported evidence. These are planned experiments; no interviews, adoption or conversion results are claimed.
```

### Business model

```text
The first product hypothesis is a free research workflow for individual analysts and creators. If repeat demand is demonstrated, shared team workspaces and reusable evidence feeds could be tested as paid services, subject to Panta's data and commercial terms. Those services are not shipped, and no pricing, paying customers or revenue have been validated. The current prototype is open source.
```

### Traction / current stage

```text
Prelaunch working prototype. Actual Panta production reads, automatic refresh and live-source exports have been checked and documented. Those checks are integration evidence, not user traction. No external adoption or revenue is claimed. The public deliverables are source code, documentation, an example-data walkthrough and dated real-data verification; no public hosted live URL is currently supplied.
```

### AI assistance, if asked

```text
AI assistance was used for implementation, tests and documentation. Product code and fictional examples were independently authored; no Panta playground source was copied. Runtime research briefs use deterministic rules and do not call an LLM. The submission identifies fictional demonstration data separately from actual API verification.
```

## Panta sidetrack entry

### Submission description

```text
EventScope is a prediction-market research desk powered by Panta. It helps researchers discover an event, inspect YES/NO quotes, observe a small watchlist and export the context behind an observation as a fixed Evidence Brief.

Panta is central to the live product: GET /categories/ powers discovery filters; GET /markets/ supplies the catalogue; GET /markets/{marketId}/ supplies detail quotes for observations; and GET /markets/{marketId}/trades/ supplies bounded transaction evidence. Without those resources, the live research workflow cannot operate.

Users can watch up to four events, compare up to three and export a capture as Markdown, JSON or CSV. Every export shares the same market, quote, source mode and read time. Missing quotes, stale reads and observation gaps stay visible. The app keeps the developer key on the server, coalesces repeated requests and respects Panta's rate limits. Deployers configure their own PANTA_API_KEY; the homepage defaults to live data.

The public repository includes the working Next.js/TypeScript prototype, an English walkthrough, tests and actual production-data evidence. The walkthrough uses clearly labelled fictional examples; real API verification is separate. The integration has been checked against all four production response contracts, available detail quotes, automatic refresh and a live-source export. AI assisted implementation and documentation. No external users or revenue are claimed.
```

### Compact Panta description

```text
EventScope turns Panta market data into timestamped research evidence. Four API resources power event discovery, YES/NO observations and a bounded trade tape. Users can watch four events, compare three and export consistent Markdown, JSON and CSV briefs. Actual reads, visible data gaps and server-only credentials are central to the workflow. Source code, the example walkthrough and separate real-data checks are linked below.
```

### Submission link, if there is only one URL field

```text
https://github.com/SylvanasW1ndrunner/panta-eventscope
```

Use the repository for a general source/submission URL field. If the actual field specifically asks for a Colosseum project URL, a hosted app or a video, provide that corresponding URL instead.

### Colosseum entry URL

Pending. Use the actual main-project submission URL after successful submission. The editor URL, registration page and this preparation document are not an entry receipt.

## Participant and media fields still to complete

These fields must follow the actual form. Do not paste a placeholder as a final answer.

- Participant display name, residence, real background and any actual teammates.
- Eligibility and other declarations, answered by the participant.
- Funding and personal commitments, if requested, using actual information.
- Product logo: the existing EventScope mark is available as [PNG](assets/eventscope-logo.png) and [SVG](assets/eventscope-logo.svg).
- Presentation video: the separate [product pitch](assets/presentation.mp4) is 2 minutes 32 seconds, with offline synthetic English narration and burned-in captions. It uses labelled, dated actual API-verification screenshots and contains no participant-background claim. Its [script](pitch-script.md) and [metadata](assets/presentation-metadata.json) are separate files. Confirm whether the actual form accepts a downloadable-file link or requires a video host.
- Video-hosting URLs if the forms require a specific host.
- Public live application URL only if deployment is completed.
- Actual Colosseum project URL and both platform submission receipts.

The [Colosseum FAQ](https://colosseum.com/hackathon) lists a product graphic, a 2–3 minute presentation video and a product-demo video of no more than 3 minutes, plus team and business information. The [Panta listing](https://superteam.fun/earn/listing/panta-api-side-track) requires both platform entries and English submissions.
