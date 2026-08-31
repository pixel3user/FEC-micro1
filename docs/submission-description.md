# Project submission: description and reproducibility guide

This file collects the two pieces most reviewers ask for first: a plain description of the
project for a submission form, and a copy-pasteable guide to reproduce every claim we make about
it. It intentionally repeats a little of what already lives in [`README.md`](../README.md),
[`docs/evaluation.md`](evaluation.md), and [`docs/hackathon-submission.md`](hackathon-submission.md)
so a reviewer does not have to open five files to get an accurate picture.

---

## Describe your project, solution, or idea

**Agent-Native Web** is a working prototype of a shared runtime where the _interface_ and the
_meaning of an action_ are generated at request time by a model, instead of being hard-coded per
business per screen.

**The problem.** Every provider on the web today ships its own pages, forms, and a fixed catalog
of API verbs (`bookAppointment`, `placeOrder`, `submitTicket`, ...). Adding a new kind of request
means a new screen and a new handler on both sides. That coupling is what makes "the web, but
agents talk to it" hard: agents either have to be taught each site's bespoke API, or a human has
to keep clicking through bespoke UI on the agent's behalf.

**The idea.** Flip which side is generated and which side is fixed:

- **Providers publish a conversational "world"** — a short natural-language description of what
  they do, revised by talking to the model, not a form-based product listing.
- **Consumers state an intent** ("plan a 20-person event and let me explore the tradeoffs"), not a
  pre-selected provider or action.
- **The platform discovers relevant worlds** from a public index (blended lexical + semantic
  search), then **an LLM generates a fresh HTML/CSS/JS interface for that specific intent** —
  there is no library of screen templates to select from.
- **Generated code talks back through exactly one bridge**: `agent.invoke({ worldId, action,
arguments })`. The action name and its arguments are invented by the model at generation time;
  there is no fixed verb catalog. The _provider's_ model then decides what that invented action
  means, given the provider's own knowledge, current state, and event history, and returns a typed
  decision (`ok` / `needs_input` / `declined` / `error`) plus an optional state patch.
- **Everything trust-sensitive stays deterministic and fixed**, not generated: identity (owner
  tokens, hashed at rest), authorization, request validation (Zod schemas on every boundary),
  transactional persistence, optimistic revisions, idempotent retries, iframe sandboxing, and a
  restrictive CSP around the generated code.

So the actual contribution isn't "an LLM drew a page." It's the split itself: put the open-ended,
per-request part (interface + action semantics) behind a model, and put the part that has to be
correct every single time (authz, storage, retries, isolation) behind ordinary, tested,
deterministic code — with an explicit, reviewable line between the two.

**What's implemented today:**

- Conversational provider-world creation/revision, with owner-token-gated publish.
- A public index (`PostgreSQL` full-text in production, in-memory for the free demo path) plus
  `/.well-known/agents/{slug}.json` manifests and `_agent.<domain>` DNS-TXT discovery.
- An OpenRouter-backed model runtime with JSON-repair-on-failure, model fallback, output caps, and
  request timeouts, so a single malformed generation doesn't take the whole flow down.
- Runtime UI generation and multi-provider **composition** (one generated interface spanning
  several providers' worlds when a single provider can't satisfy the intent).
- A generic, typed invocation bridge with server-side authorization, persisted state/event
  history, optimistic revision control, and idempotent retries.
- A from-scratch evaluation harness that seeds a fixed, versioned set of provider fixtures and
  intents, then measures — not asserts — discovery ranking, multi-provider coverage, generated-HTML
  structure/safety, actual invocation outcomes, persistence, and idempotent-retry behavior for both
  a naive keyword baseline and the actual agent path, on identical data.
- Deterministic, no-API-key tests and a Dockerized demo with a real PostgreSQL instance.

**What it deliberately does not claim:** this prototype does not verify that a real-world booking,
purchase, or other external effect actually happened — a provider's model decision is recorded as
that world's ground truth, which is appropriate for a prototype and not yet for money-, legal-, or
safety-critical use. Semantic discovery quality depends on whichever embedding model is configured
live; the checked-in mock embedder is a deterministic stand-in for tests, not a claim about
real-world ranking quality. See [`docs/hackathon-submission.md`](hackathon-submission.md) for the
evidence-labeled (`TESTED` / `DOCUMENTED LIVE` / `STRUCTURAL` / `MODELED`) walk-through of how each
part of this was actually built and checked.

---

## Reproducibility guide

There are three reproduction tiers, from cheapest/most deterministic to most complete. Pick the
one that matches what you want to verify — you do not need to run all three.

| Tier                    | Needs                             | Network calls             | Cost                           | What it proves                                                                                                                                                                      |
| ----------------------- | --------------------------------- | ------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Deterministic (mock) | Node.js ≥ 22, pnpm via Corepack   | None after `pnpm install` | Free                           | Every structural/executable claim: discovery, generation, invocation, persistence, idempotency, adversarial containment — all against an in-process mock model and in-memory store. |
| 2. Live model           | Tier 1 + one `OPENROUTER_API_KEY` | OpenRouter only           | A few tenths of a cent per run | The same flow against a real hosted model and real embeddings; ranking/generation quality with an actual LLM instead of the deterministic mock.                                     |
| 3. Full stack           | Tier 2 + Docker                   | OpenRouter only           | Same as tier 2                 | The whole thing — API, web client, and a real PostgreSQL instance — wired together the way it would run in a real deployment.                                                       |

None of these tiers requires any secret to be sent anywhere except directly to OpenRouter from your
own machine. **Never** commit a real `OPENROUTER_API_KEY`; `.env` is git-ignored, and
`.env.example` only ever contains a blank placeholder.

### Tier 1 — Deterministic, no API key, no database, no network

This is the primary reproduction path and the one CI-equivalent checks are run against.

```bash
git clone https://github.com/pixel3user/FEC-micro1.git
cd FEC-micro1
corepack enable
pnpm install
```

Then, in one shell, run all four checks (each is deterministic and exits nonzero on failure):

```bash
pnpm typecheck
pnpm test
pnpm build
MODEL_MODE=mock pnpm --filter @agent-web/api eval
```

- `pnpm test` runs the full deterministic suite (contracts, API — including the adversarial
  prompt-injection / cross-world isolation / concurrency tests — and web), all against in-memory
  storage and a mock model. No test in this suite makes a network call.
- `MODEL_MODE=mock pnpm --filter @agent-web/api eval` prints a JSON report to stdout. It seeds the
  versioned fixture set in `apps/api/src/eval/fixtures/` (`providers.v1.json`,
  `development.v1.json`, `held-out.v1.json`; the harness runs the **held-out** split by default so
  the numbers aren't fit to cases anyone iterated against), then measures — through real HTTP
  requests into the running Fastify app, with every response schema-validated, not just cast —
  discovery ranking for a naive keyword baseline vs. the agent's blended search, generated-HTML
  structural/safety checks, actual invocation results, whether the resulting state patch and event
  were really persisted, and whether a same-key retry returned the identical response without
  double-applying anything. Every rate in the report is a `numerator/denominator` over named case
  IDs, not an assigned constant — you can diff the `caseOutcomes` array yourself.
- To reproduce the _development_ split instead of held-out (useful while iterating, but not the
  numbers to cite as the held-out result), run the eval programmatically with
  `runEval(app, { runtime, split: "development" })`, or read
  `apps/api/src/eval/harness.test.ts` for a runnable example.

To also try the product interactively without any key:

```bash
MODEL_MODE=mock pnpm dev
```

Open `http://localhost:5173`, create and publish a provider in one tab, then discover and interact
with it from another. This uses process memory, not PostgreSQL, so restarting clears state — that
trade-off is what makes it free and instant to reproduce.

### Tier 2 — Live OpenRouter model, still no database required

Live results are **not byte-identical** across runs — hosted model output varies — so treat this
tier as "reproduce the _behavior_," not "reproduce an exact transcript." Record the model ID,
dataset version, and timestamp from the report if you need to cite a specific run.

1. Get an OpenRouter API key at <https://openrouter.ai>. If a key has ever appeared in a chat log,
   screenshot, or commit, revoke it first and create a new one — do not reuse an exposed key.
2. Set a spending limit on the OpenRouter account itself (not just in this app's config) before
   running anything live.
3. Copy the example environment file and fill in the key:

   ```bash
   cp .env.example .env
   # then edit .env and set:
   #   OPENROUTER_API_KEY=<your new key>
   #   MODEL_MODE=live
   ```

4. Run the same three checks as tier 1, now against the real model:

   ```bash
   MODEL_MODE=live pnpm --filter @agent-web/api eval
   ```

   This uses the versioned held-out fixtures exactly as in tier 1, but seeds/generates/discovers
   through OpenRouter's chat and embedding models instead of the mock runtime, and reports actual
   `costUsd`/token usage for that run in the `usage` field of the printed report.

5. Optionally start the whole app live and use it interactively:

   ```bash
   pnpm dev
   ```

   With `DATABASE_URL` left blank in `.env`, this still uses in-memory storage — a real PostgreSQL
   instance is only required for tier 3 or for a real deployment (see
   [`deploy/README.md`](../deploy/README.md)).

Live embedding/model behavior, current OpenRouter model IDs, and pricing can change after this was
written; check the current [OpenRouter model catalog](https://openrouter.ai/api/v1/models) before a
demo if you want to confirm price/availability for the configured `OPENROUTER_MODEL` and
`OPENROUTER_EMBEDDING_MODEL`.

### Tier 3 — Full stack: OpenRouter + a real PostgreSQL instance

This reproduces the deployment-shaped topology: web client, API, and a real database, all talking
to a real model.

1. Complete the `.env` setup from tier 2 (`OPENROUTER_API_KEY`, `MODEL_MODE=live`).
2. Add the remaining variables `compose.yaml` expects, if not already present:

   ```dotenv
   PUBLIC_API_URL=http://localhost:8787
   WEB_ORIGIN=http://localhost:5173
   ```

3. Build and start everything with Docker Compose:

   ```bash
   docker compose up --build
   ```

   This starts PostgreSQL (internal to the compose network, with a persistent named volume), the
   API on `http://localhost:8787` (which applies its idempotent schema DDL on startup — no manual
   migration step), and the web client on `http://localhost:5173`.

4. Use the web client the same way as in tier 1/2: create and publish a provider, then discover and
   invoke it from another session. Because this is now backed by real PostgreSQL, state survives a
   container restart (`docker compose restart api`), which is the one behavior tiers 1–2
   intentionally cannot demonstrate.
5. Tear down when done. If you want a completely clean slate next time (drops the persisted
   database volume too):

   ```bash
   docker compose down -v
   ```

   Leave off `-v` if you want the seeded data to survive to the next `docker compose up`.

**Note on scope:** the evaluation harness (`pnpm --filter @agent-web/api eval`, tiers 1–2) always
seeds an in-process, in-memory store, even when `MODEL_MODE=live` — it measures the real model
against real HTTP boundaries, but it does not currently exercise PostgreSQL. Tier 3 is how you
exercise the real-database path; it's driven through the web client and API directly, not through
the eval harness. This is a known limitation, not an oversight, and it's one of the reasons a
dedicated PostgreSQL integration test suite is on this project's near-term list rather than being
claimed as already covered.

### If something doesn't reproduce

- **`pnpm install` fails / wrong Node version** — this repo requires Node ≥ 22 (`engines.node` in
  the root `package.json`); use `corepack enable` so the pinned `pnpm@10.15.1` is used automatically.
- **Live eval/tests throw immediately** — check `.env` actually has a non-empty
  `OPENROUTER_API_KEY` and `MODEL_MODE=live`; the runtime fails fast rather than silently falling
  back to mock behavior.
- **Docker Compose can't find a provider** — this depends on a working Docker/Compose install on
  your machine; it is unrelated to application code and is out of scope for this guide to fix.
- **Numbers differ slightly between two live runs** — expected; hosted models are not
  deterministic. What should stay stable across runs is the _fixture set_ (versioned and
  checked in), the _report schema_ (validated, so a malformed report fails loudly rather than
  printing something misleading), and the _structural_ claims (persistence, idempotency,
  authorization) — those are enforced by deterministic assertions, not by the model's wording.
