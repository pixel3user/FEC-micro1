# Coding-agent trajectory and tool disclosure

## Disclosure

Coding-agent use was required for this project. **Kiro** was used as the coding agent across the implementation and submission work. Git history attributes the implementation commits to `Kiro Agent`; this document provides a repository-visible, reviewable index of that work.

Kiro’s role included repository inspection, implementation and refactoring, test and build execution, visual review of the Remotion submission, Git history analysis, and branch/commit/push operations. Human direction supplied the product thesis, requested changes, selected the submission framing, and approved the work to publish.

This is an evidence-linked trajectory summary, not a fabricated raw chat transcript. Historical raw prompts and tool-call events are not stored in the repository. If an evaluator requires a platform-native machine export, it should be attached separately from the coding-agent platform; this index identifies the corresponding repository outputs and validation evidence.

## Tools used

| Tool                             | How it was used                                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Kiro coding agent**            | Planned changes, inspected code, edited files, analyzed failures, and prepared the submission evidence.         |
| **Repository file/search tools** | Located implementation paths, traced contracts and tests, and cross-checked claims against source.              |
| **Linux shell**                  | Ran bounded, non-interactive validation and repository commands.                                                |
| **Git and GitHub CLI/API**       | Inspected history and PRs, created branches and commits, pushed work, and verified remote state.                |
| **pnpm / Corepack**              | Ran workspace package scripts with the repository-pinned package-manager version.                               |
| **TypeScript compiler**          | Checked project types.                                                                                          |
| **Vitest**                       | Ran deterministic unit, integration, and adversarial tests through repository scripts.                          |
| **Vite**                         | Built the browser applications and studio.                                                                      |
| **Remotion CLI/player**          | Rendered and visually checked representative submission frames, including card-copy and chapter handoff states. |

OpenRouter is an application dependency used by opt-in live model/evaluation paths; it is not being listed as a coding-agent tool. Default validation remains deterministic and does not contact it.

## Reviewable implementation trajectory

| Phase                               | Goal and observed problem                                                                                           | Agent-produced change                                                                                                                                                                                  | Verification and trace                                                                                                                                                                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Shared runtime**                  | Avoid per-intent routes, forms, action catalogs, and handlers.                                                      | Built conversational worlds, discovery, generated experiences, a generic invocation envelope, state/events, revisions, and idempotency.                                                                | Deterministic end-to-end integration path in `apps/api/src/app.test.ts`; commit [`5000a2d`](https://github.com/pixel3user/FEC-micro1/commit/5000a2dc2182a77c4a78bea938a3445b68e2bd82).                                                                               |
| **Model boundary**                  | Reasoning traces, fenced JSON, and truncation made raw output parsing unreliable.                                   | Added robust extraction, schema validation, bounded correction, model fallback, timeout, and usage accounting.                                                                                         | JSON extraction tests, an opt-in live test definition, and the showcase report; [`7ac5b1d`](https://github.com/pixel3user/FEC-micro1/commit/7ac5b1df1960f173842d403f09951e1296fcbc98), [PR #1](https://github.com/pixel3user/FEC-micro1/pull/1).                     |
| **Runtime repair**                  | Schema-valid generated code could still fail in the browser.                                                        | Added sandbox error forwarding and regeneration from the failed HTML plus captured error.                                                                                                              | Bridge tests, API repair integration test, an opt-in live test definition, and the showcase report; [`0bfeafa`](https://github.com/pixel3user/FEC-micro1/commit/0bfeafaac07b1cef13b84c0ec7a464f7b3130b9d), [PR #2](https://github.com/pixel3user/FEC-micro1/pull/2). |
| **Discovery**                       | Lexical matching missed synonymous intent.                                                                          | Added embedding indexing, blended semantic/lexical ranking, and lexical fallback.                                                                                                                      | Vector/ranking tests and the documented four-case live evaluation; [`5bd67ef`](https://github.com/pixel3user/FEC-micro1/commit/5bd67efb10863af33db5c01bb19e3443e287e97a), [PR #3](https://github.com/pixel3user/FEC-micro1/pull/3).                                  |
| **Composition**                     | Some intents required more than one provider.                                                                       | Added typed role/dependency planning and combined experience generation over the selected worlds.                                                                                                      | One two-provider integration scenario, an opt-in live test definition, and the showcase report; [`053dd16`](https://github.com/pixel3user/FEC-micro1/commit/053dd16d3026b3490b2c79848a26e3b9607051ca), [PR #4](https://github.com/pixel3user/FEC-micro1/pull/4).     |
| **Evaluation and abuse resistance** | Capability claims needed shared data, explicit metrics, and hostile-input checks.                                   | Added baseline/agent harness, live-cost reporting, injection containment, isolation, concurrency, and hostile-echo tests.                                                                              | `docs/evaluation.md`, harness tests, and adversarial suite; [`8b637cc`](https://github.com/pixel3user/FEC-micro1/commit/8b637cc936cbaaab9a37a7739a982df688c3483d), [PR #5](https://github.com/pixel3user/FEC-micro1/pull/5).                                         |
| **Typed outcomes**                  | Free text could contradict the actual operation result.                                                             | Added machine-readable status, structured display, optional next view, and browser handling while retaining deterministic persistence.                                                                 | Typed outcome, retry, event, and next-view assertions; [`3c7b017`](https://github.com/pixel3user/FEC-micro1/commit/3c7b017f9a447c43b321ebc623e977d1b32be197), [PR #8](https://github.com/pixel3user/FEC-micro1/pull/8).                                              |
| **Submission evidence**             | The project needed a concise, reviewable explanation that did not overstate shallow or modeled evidence.            | Built the Remotion evidence chapter and improvement changelog, classified evidence as documented-live/structural/modeled/tested, added narration, and repaired card/footer layout after visual review. | Typecheck, production build, rendered-frame inspection, and [PRs #11–#14](https://github.com/pixel3user/FEC-micro1/pulls?q=is%3Apr+is%3Aclosed+11..14).                                                                                                              |
| **Written trajectory**              | The submission template required the actual progression and coding-agent disclosure rather than placeholder stages. | Reconstructed chronological decisions from source, tests, commits, and PRs; added `docs/hackathon-submission.md` and this trajectory index.                                                            | Markdown review, link/path checks, repository validation, and the commit containing these files.                                                                                                                                                                     |

## Validation commands used

The exact subset varied by phase. The principal reproducible commands were:

```bash
pnpm typecheck
pnpm test
pnpm build
MODEL_MODE=mock pnpm --filter @agent-web/api eval
pnpm --filter @agent-web/studio typecheck
pnpm --filter @agent-web/studio build
```

Live OpenRouter tests/evaluation were opt-in because they require a key, spend credit, and can vary with external model behavior. Reported results are described as **DOCUMENTED LIVE**, with the lack of checked-in raw run output stated explicitly, rather than silently mixed with deterministic test evidence.

## Integrity notes

- The conventional baseline is a retrospective evaluation comparator, not the repository’s first deployed implementation.
- The progression table follows actual Git chronology; it does not reorder evaluation and typed outcomes merely to improve the story.
- “4/4” refers only to the four fixed documented-live evaluation intents.
- Modeled action counts are not observed user telemetry.
- Generated HTML and composition plans are not proof of completed external-world tasks.
- No secrets, private prompts, or invented raw transcript events are included in this trajectory artifact.
