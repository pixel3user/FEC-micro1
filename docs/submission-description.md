# Project submission: description and reproducibility guide

A condensed version for a submission form. Fuller detail lives in [`README.md`](../README.md),
[`docs/evaluation.md`](evaluation.md), and [`docs/hackathon-submission.md`](hackathon-submission.md).

## Describe your project, solution, or idea

**Agent-Native Web** is a working prototype of a shared runtime where the _interface_ and the
_meaning of an action_ are generated at request time by a model, instead of being hard-coded per
business per screen.

**The problem.** Every provider on the web ships its own pages, forms, and fixed set of API verbs
(`bookAppointment`, `placeOrder`, ...). Adding a new kind of request means a new screen and a new
handler on both sides. That coupling is what makes "the web, but agents talk to it" hard: agents
either have to learn each site's bespoke API, or a human keeps clicking through bespoke UI for them.

**The idea.** Flip which side is generated and which side is fixed:

- **Providers publish a conversational "world"** — a short natural-language description of what
  they do, revised by talking to the model, not a form-based listing.
- **Consumers state an intent** ("plan a 20-person event"), not a pre-selected provider or action.
- **The platform discovers relevant worlds** from a public index (blended lexical + semantic
  search), then **an LLM generates a fresh HTML/CSS/JS interface** for that specific intent —
  there is no template library to select from.
- **Generated code talks back through exactly one bridge**: `agent.invoke({ worldId, action,
arguments })`. The action name and arguments are invented by the model at generation time; there
  is no fixed verb catalog. The _provider's_ model decides what that invented action means, given
  the provider's own knowledge, current state, and event history, and returns a typed decision
  (`ok` / `needs_input` / `declined` / `error`) plus an optional state patch.
- **Everything trust-sensitive stays deterministic**, not generated: identity (owner tokens,
  hashed at rest), authorization, request validation (Zod schemas on every boundary), transactional
  persistence, optimistic revisions, idempotent retries, iframe sandboxing, and a restrictive CSP.

The contribution isn't "an LLM drew a page." It's the split itself: put the open-ended, per-request
part (interface + action semantics) behind a model, and put the part that has to be correct every
time (authz, storage, retries, isolation) behind ordinary, tested, deterministic code — with an
explicit, reviewable line between the two.

**Implemented today:** conversational provider-world creation/revision with owner-token-gated
publish; a public index (PostgreSQL full-text in production, in-memory for the free demo) plus
`/.well-known/agents/{slug}.json` manifests and `_agent.<domain>` DNS-TXT discovery; an
OpenRouter-backed model runtime with JSON-repair, model fallback, output caps, and timeouts; runtime
UI generation and multi-provider composition; a generic typed invocation bridge with server-side
authorization, persisted state/event history, optimistic revisions, and idempotent retries; a
from-scratch evaluation harness that seeds versioned fixtures and measures — not asserts —
discovery ranking, HTML structure/safety, invocation outcomes, persistence, and idempotent retry for
both a naive keyword baseline and the actual agent path, on identical data; deterministic
no-API-key tests and a Dockerized demo with real PostgreSQL.

**What it deliberately does not claim:** it does not verify that a real-world booking, purchase, or
other external effect actually happened — a provider's model decision is recorded as that world's
ground truth, appropriate for a prototype but not for money-, legal-, or safety-critical use.
Semantic discovery quality depends on whichever embedding model is live; the mock embedder is a
deterministic test stand-in, not a quality claim.

## Reproducibility guide

Three tiers, cheapest/most deterministic to most complete — pick the one you want to verify.

| Tier          | Needs                         | Network            | Cost             | Proves                                                                                                                   |
| ------------- | ----------------------------- | ------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1. Mock       | Node ≥ 22, pnpm               | None after install | Free             | Discovery, generation, invocation, persistence, idempotency, adversarial containment vs. a mock model + in-memory store. |
| 2. Live       | Tier 1 + `OPENROUTER_API_KEY` | OpenRouter only    | ~$0.001–0.01/run | Same flow against a real hosted model and embeddings.                                                                    |
| 3. Full stack | Tier 2 + Docker               | OpenRouter only    | Same as tier 2   | API + web client + real PostgreSQL wired together as in a real deployment.                                               |

No tier sends a secret anywhere except directly to OpenRouter from your machine. **Never** commit a
real `OPENROUTER_API_KEY`; `.env` is git-ignored and `.env.example` only has a blank placeholder.

### Tier 1 — deterministic, no key, no database, no network

```bash
git clone https://github.com/pixel3user/FEC-micro1.git
cd FEC-micro1
corepack enable
pnpm install
pnpm typecheck
pnpm test
pnpm build
MODEL_MODE=mock pnpm --filter @agent-web/api eval
```

- `pnpm test` runs the full deterministic suite (contracts, API — including adversarial
  prompt-injection / isolation / concurrency tests — and web) against in-memory storage and a mock
  model. No network calls.
- The eval command prints a JSON report: it seeds the versioned fixtures in
  `apps/api/src/eval/fixtures/` (`providers.v1.json`, `development.v1.json`, `held-out.v1.json`;
  the harness runs the **held-out** split by default), then measures — through real HTTP requests
  with every response schema-validated — discovery ranking (naive keyword baseline vs. the agent's
  blended search), generated-HTML structure/safety, actual invocation results, real persistence of
  the resulting state/event, and whether a same-key retry returns the identical response. Every
  rate is `numerator/denominator` over named case IDs in the report's `caseOutcomes`, not an
  assigned constant.
- To try the product interactively without a key: `MODEL_MODE=mock pnpm dev`, then open
  `http://localhost:5173`.

### Tier 2 — live OpenRouter model, still no database required

Live results are **not byte-identical** across runs — treat this as reproducing the _behavior_,
not an exact transcript. The report records the model ID, dataset version, and timestamp.

1. Get a key at <https://openrouter.ai>. If a key was ever exposed in a log/chat/commit, revoke it
   and create a new one.
2. Set a spending limit on the OpenRouter account itself.
3. `cp .env.example .env`, then set `OPENROUTER_API_KEY=<key>` and `MODEL_MODE=live`.
4. Run `MODEL_MODE=live pnpm --filter @agent-web/api eval` — same held-out fixtures, but through
   OpenRouter's chat/embedding models; the report's `usage` field shows actual cost/tokens.
5. Optionally `pnpm dev` for the interactive app (still in-memory storage unless `DATABASE_URL` is
   set).

Current OpenRouter model IDs/pricing can change; check the
[model catalog](https://openrouter.ai/api/v1/models) before a demo.

### Tier 3 — full stack: OpenRouter + real PostgreSQL

1. Complete tier 2's `.env` setup, plus `PUBLIC_API_URL=http://localhost:8787` and
   `WEB_ORIGIN=http://localhost:5173`.
2. `docker compose up --build` — starts PostgreSQL (persistent volume, internal network), the API
   on `:8787` (applies idempotent schema DDL on startup), and the web client on `:5173`.
3. Use the web client to publish and discover a provider; restart `api` alone
   (`docker compose restart api`) to confirm state survives — the one thing tiers 1–2 can't show.
4. Tear down with `docker compose down` (keep data) or `docker compose down -v` (drop it).

**Scope note:** the eval harness always seeds an in-memory store, even with `MODEL_MODE=live` — it
exercises the real model over real HTTP boundaries, but not PostgreSQL. Tier 3's database path is
exercised through the web client/API directly, not the eval harness; a dedicated PostgreSQL
integration suite is on the near-term list rather than already covered.

### If something doesn't reproduce

- **Install fails / wrong Node** — requires Node ≥ 22; use `corepack enable` for the pinned
  `pnpm@10.15.1`.
- **Live eval/tests fail fast** — check `.env` has a non-empty `OPENROUTER_API_KEY` and
  `MODEL_MODE=live`.
- **Docker Compose can't find a provider** — depends on your local Docker install, unrelated to
  application code.
- **Numbers differ between two live runs** — expected; hosted models aren't deterministic. The
  fixture set, report schema, and structural claims (persistence, idempotency, authorization) are
  enforced by deterministic assertions, not by model wording.
