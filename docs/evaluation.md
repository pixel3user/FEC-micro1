# Evaluation

## Method

The harness (`apps/api/src/eval/harness.ts`, run with `pnpm --filter @agent-web/api eval`) seeds five provider worlds and runs four intents through two paths on identical data:

- **Baseline** — approximates a conventional multi-site web: naive keyword search over provider text to pick a provider, then fixed per-provider navigation. It cannot compose across providers and never produces a task-specific interface.
- **Agent** — intent → blended semantic + lexical discovery → one generated interface, using composition for multi-need intents.

Metrics:

- **discoveryTopHitRate** — fraction of cases whose most relevant provider ranks first.
- **multiProviderCoverageRate** — for multi-need intents, fraction where all relevant providers are found.
- **taskSpecificUiRate** — fraction producing an interface tailored to the intent.
- **avgUserSteps** — approximate user actions to reach the outcome.
- **canCompose** — whether one intent can be fulfilled across multiple providers in a single flow.

The default suite runs in mock mode and spends nothing. The numbers below are from a **live** run against OpenRouter.

## Live results

| Metric                    | Baseline | Agent |
| ------------------------- | -------- | ----- |
| discoveryTopHitRate       | 0.50     | 1.00  |
| multiProviderCoverageRate | 1.00     | 1.00  |
| taskSpecificUiRate        | 0.00     | 1.00  |
| avgUserSteps              | 3.75     | 2.00  |
| canCompose                | false    | true  |

Total model cost for the full live evaluation: **$0.0051**.

## Reading the results honestly

- The agent's advantage is clearest on **task-specific UI** (only the agent generates one) and **cross-provider composition** (the baseline structurally cannot). These are capability differences, not tuning artifacts.
- **Discovery** is where measurement matters most. With the real embedding model the agent reached a perfect top-hit rate while the naive baseline mis-ranked half the cases. In **mock** mode the deterministic hashing embedder scores _below_ the baseline on discovery — a deliberately visible signal that semantic quality depends on the real embedding model, not the test stand-in.
- **User steps** is an approximation of navigation effort, not a wall-clock benchmark. It reflects that one composed interface replaces multiple site visits.

## Reproduce

```bash
# Free, deterministic
MODEL_MODE=mock pnpm --filter @agent-web/api eval

# Live (costs a few tenths of a cent; requires a key in .env)
MODEL_MODE=live pnpm --filter @agent-web/api eval
```
