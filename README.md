# Agent-Native Web

A connected prototype where providers describe services conversationally, consumers discover them through a centralized public index, and an LLM creates both the interface and action semantics at runtime.

This is deliberately not a conventional API marketplace:

- Live experiences are fresh standalone HTML/CSS/JavaScript generated for each intent—not selected from UI templates.
- There is no catalog of business verbs. Generated code calls `agent.invoke({ worldId, action, arguments })` with any action it invents.
- The provider model interprets that request from provider knowledge, state, and event history.
- Its decision is recorded as the prototype world's current ground truth.
- The fixed platform handles only discovery, persistence, model access, sandboxing, transport, and observability.

## What is implemented

- Conversational provider-world creation and revision.
- Opaque owner tokens for provider mutations; only token digests are stored.
- PostgreSQL-backed public full-text index with an in-memory replay mode.
- Public `/.well-known/agents/{slug}.json` manifests.
- Indexed slug/domain resolution plus `_agent.<domain>` DNS TXT lookup.
- Low-cost OpenRouter model runtime with one JSON-repair attempt.
- Runtime UI generation with no live templates.
- Cross-origin iframe sandbox, restrictive CSP, and generic Promise-based action bridge.
- Unrestricted action names and JSON arguments.
- Persistent event history and model-authored JSON state patches.
- Optimistic revision control and idempotent action retries.
- Docker deployment and deterministic no-credit tests.

## Repository

- `apps/api` — stateless Fastify API, index, worlds, model runtime, and persistence.
- `apps/web` — provider studio, discovery, generated-code sandbox, and decision trace.
- `packages/contracts` — transport envelopes only; no business action definitions.
- `docs/architecture.md` — runtime and trust boundaries.
- `deploy` — production images, reverse-proxy configuration, and public deployment notes.

## Security first

If an API key has appeared in a chat message, terminal log, screenshot, or commit, revoke it before using this repository. Do not reuse the exposed value. Create a replacement in OpenRouter and put it only in a local `.env` or deployment secret manager. The web client never receives the key.

## Fastest reproducible demo (no API credit)

```bash
corepack enable
pnpm install
MODEL_MODE=mock pnpm dev
```

Open `http://localhost:5173`, create and publish a provider, then discover it from the other tab. This mode uses process memory and a deterministic fixture so another reviewer can reproduce the flow without secrets.

## Docker demo with persistent PostgreSQL

```bash
docker compose up --build
```

This starts:

- Web: `http://localhost:5173`
- API: `http://localhost:8787`
- PostgreSQL: internal to the compose network

Compose defaults to `MODEL_MODE=mock`. To run live, create `.env`:

```dotenv
MODEL_MODE=live
OPENROUTER_API_KEY=replace-with-a-new-unexposed-key
OPENROUTER_MODEL=deepseek/deepseek-v4-flash-0731
PUBLIC_API_URL=http://localhost:8787
WEB_ORIGIN=http://localhost:5173
```

Then restart with `docker compose up --build`.

## Native live development

Start PostgreSQL with `docker compose up -d postgres`, copy `.env.example` to `.env`, replace the API key, and run:

```bash
pnpm dev
```

The API applies idempotent schema DDL when it starts.

## Model budget

The configurable default is `deepseek/deepseek-v4-flash-0731`. At implementation time, the [OpenRouter model catalog](https://openrouter.ai/api/v1/models) listed structured-output and tool support with prices around $0.03 per million input tokens and $0.16 per million output tokens. Prices and availability can change, so verify the catalog before a public demo.

Live behaviour has been verified against OpenRouter: provider-world creation and runtime UI generation both return schema-valid JSON, and when the primary model emits reasoning traces or truncates a large document, the runtime strips the trace and falls back to `OPENROUTER_FALLBACK_MODELS`. Observed cost is a fraction of a cent per call. A running cost/usage total is available at `GET /v1/usage`.

Budget controls in this repository:

- One inexpensive primary model with an optional ordered fallback list.
- Per-call output caps and per-call request timeouts.
- Robust JSON extraction (strips `<think>` reasoning and fences) plus a single bounded repair retry.
- PostgreSQL retrieval instead of model-based provider search.
- Deterministic tests that never contact OpenRouter.
- Usage and reported cost metadata logged by the API when OpenRouter supplies it.

Also set a hard spending limit in OpenRouter; application limits are not a substitute for an account-level cap.

## Public API flow

### 1. Create a provider world

```http
POST /v1/worlds
Content-Type: application/json

{
  "preferredName": "Northstar Events",
  "message": "We organize unusual local events and adapt our process to each group..."
}
```

Save the returned `ownerToken`; it is not retrievable later.

### 2. Revise and publish

```http
POST /v1/worlds/{id}/converse
x-owner-token: <owner token>

{ "message": "We also handle outdoor contingency planning..." }
```

```http
POST /v1/worlds/{id}/publish
x-owner-token: <owner token>
```

### 3. Generate an experience

```http
POST /v1/experiences

{ "intent": "Plan a 20-person event and let me explore the tradeoffs" }
```

The response contains newly generated HTML and the provider worlds selected from the public index.

### 4. Invoke anything

```http
POST /v1/worlds/{worldId}/invoke

{
  "sessionId": "...",
  "action": "negotiate an outdoor backup arrangement under my unusual constraints",
  "arguments": { "weatherRisk": "high", "priority": "quiet" },
  "idempotencyKey": "client-generated-retry-key"
}
```

The action has no preregistered implementation. The provider model decides what it means and records the result.

## DNS-linked discovery

A domain can advertise its manifest location with:

```text
_agent.example.com TXT "agent-manifest=https://api.example.net/.well-known/agents/example.json"
```

`GET /v1/resolve/example.com` checks the centralized index first and then that DNS record. This prototype resolves the location but does not yet implement DNSSEC identity verification.

## Evaluation and adversarial testing

A baseline-vs-agent evaluation harness measures discovery quality, task-specific UI, user steps, and cross-provider composition on identical seeded data. See [`docs/evaluation.md`](docs/evaluation.md) for method and live results (agent reached a perfect discovery top-hit rate and produced task-specific UI on every case; the full live run cost about half a cent).

```bash
MODEL_MODE=mock pnpm --filter @agent-web/api eval   # free, deterministic
MODEL_MODE=live pnpm --filter @agent-web/api eval    # real numbers, a few tenths of a cent
```

Adversarial tests (`apps/api/src/adversarial.test.ts`) cover prompt injection in provider data, cross-world state isolation, concurrent-invocation serialization, and hostile-argument echo containment.

## Validation

```bash
pnpm typecheck
pnpm test
pnpm build
```

The API integration test exercises creation, protected publishing, discovery, manifest retrieval, generated UI delivery, an action name invented only inside the test, persistent state, and idempotency.

## Deploying the shared index

Deploy the API and PostgreSQL to a public host, build the web client with the public API URL, and terminate TLS at the platform edge. Because the API keeps no process-local state in PostgreSQL mode, replicas can be added behind a load balancer. See [`deploy/README.md`](deploy/README.md) for configuration and scaling boundaries.

## Prototype limitations

- Provider decisions are intentionally model-authoritative and are not suitable for real money, legal, medical, or other consequential production effects.
- PostgreSQL search is lexical; semantic embeddings can be added later if measured discovery quality requires them.
- Multi-replica global rate limits need a shared Redis-backed limiter.
- DNS records locate manifests but do not yet establish a DNSSEC/DANE trust chain.
- Generated code is isolated, but this remains experimental code execution and should be reviewed before extending sandbox permissions.
