# EventScope presentation script

This product-focused English script is separate from the existing 2:18 product walkthrough. It makes no personal-background claim. At a measured narration pace it is intended for a 2–3 minute presentation; the final exported recording must be checked for its actual duration. No official form has been saved or submitted by preparing it.

## 1. Opening: evidence behind the percentage

Prediction markets offer a useful snapshot. But when a researcher shares a percentage, what exactly was observed? Which market conditions applied? When was the quote read? And does the available history really support a claim about movement? EventScope turns those questions into a practical research workflow. Follow the event. Keep the evidence.

## 2. The workflow

Start by discovering an event through Panta's market catalogue. Inspect its YES and NO quotes, conditions and recent trade records. Watch up to four events while the browser is open, and compare up to three. Then capture an Evidence Brief. Markdown, JSON and CSV exports preserve the same market, quote, source mode and actual read timestamp.

## 3. The distinction

The difference is how EventScope treats uncertainty. An unavailable quote stays unavailable. Charts contain actual detail reads rather than invented historical prices. Phase changes and observation gaps interrupt continuity. A brief preserves these limits alongside the evidence, helping researchers explain which conclusions their observations can support.

## 4. Panta integration

Panta is central to the live product. Four read resources supply categories, market discovery, detail quotes and a bounded trade tape. Credentials remain on the server. Caching, request coalescing, timeouts and rate-limit backoff keep reads controlled. The homepage defaults to live data once a deployer configures a legitimate Panta API key.

## 5. Current evidence

The open-source prototype has been checked against actual Panta production responses, including available quotes, automatic refresh and a live-source export. The repository separates those dated checks from fictional walkthrough examples. Verification also includes one hundred and ten unit tests, twenty-three browser workflows, TypeScript checks and a production build. Monitoring currently runs while the browser remains open.

## 6. Audience and next validation

The initial audience is independent event researchers and creators. The next validation step would be to observe whether a timestamped brief saves effort when they cite prediction-market data. Repeat use and reuse of exported evidence would be more useful signals than a one-time visit. No external adoption or revenue has yet been established.

## 7. Direction and close

If that demand is demonstrated, shared team workspaces and reusable evidence feeds could be tested as paid services, subject to Panta's commercial terms. These are future hypotheses. Today's deliverable is a working, responsive research prototype with source code and integration evidence, independently authored with AI assistance. EventScope makes each observation something a researcher can keep, inspect and explain.

## Production notes

- Use the existing EventScope palette and mark. Product screenshots must retain their real/example source labels.
- The presentation can use product graphics and English narration without claiming to be a recording of the participant. Synthetic narration, if used, is not a voice imitation.
- A personal introduction or background claim should only be added from participant-provided information.
- Do not claim a public hosted live service, external users, funding or revenue.
- The existing product-demo video remains a separate artefact: `docs/demo/prototype.webm`.
- Upload the finished presentation to the host required by the actual form; a local file or this script is not a submission URL.
