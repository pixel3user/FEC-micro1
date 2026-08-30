# Architecture

## Principle

The platform fixes only discovery, model access, persistence, sandboxing, transport, and observability. It does not define provider business schemas, action names, workflows, or generated interface layouts. A provider LLM's recorded decision is the prototype's current ground truth.

## Self-healing generated UI

Generated documents run in the sandbox and report runtime errors (`window.onerror` and `unhandledrejection`) back to the host through the same message channel used for actions. When an error is reported, the host can call `POST /v1/experiences/repair` with the session id and the error text. The model receives the previous (broken) HTML plus the error and returns a corrected full document, which is persisted as a new experience for the session and swapped into the sandbox. This keeps the "generated fresh each time" property while making it robust to the occasional broken generation observed in live testing.

## Runtime flow

1. A provider describes an open-ended service in conversation.
2. The intake model creates a provider world containing knowledge, behavioral instructions, and flexible JSON state.
3. Publishing adds the world to a shared PostgreSQL search index and exposes a machine-readable manifest.
4. A consumer describes an intent. The public index returns candidate worlds.
5. The UI model writes a fresh standalone HTML/CSS/JavaScript document for that intent. It is not selected from a template.
6. The document runs in a sandboxed cross-origin iframe and has one injected transport primitive: `agent.invoke({ worldId, action, arguments })`.
7. The action name and arguments are unrestricted JSON chosen at runtime. The provider model interprets them using its world and event history.
8. The model's decision and state patch are appended to the event log and become context for later decisions.

## Scalable public index

The API is stateless. Shared state lives in PostgreSQL, allowing multiple API replicas behind a load balancer. Search uses a PostgreSQL full-text GIN index to avoid a separate search service for the prototype. The storage interface also has an in-memory implementation for deterministic tests and a zero-setup local demonstration.

Public reads include discovery, manifests, and interactions. Provider mutations require an opaque owner token that is returned once and stored only as a SHA-256 digest. Global rate limits protect the shared prototype.

## Generated-code boundary

Generated code is intentionally unconstrained in presentation and interaction design, but it executes in an iframe without `allow-same-origin`. It cannot read host storage or secrets. It can affect the platform only through the generic message bridge. The bridge validates transport envelopes but does not restrict business action vocabulary.

## Internet discovery

The centralized index is the initial internet-scale rendezvous point. A provider may use a platform slug immediately. Domain-linked manifests and DNS TXT discovery can be layered on without changing the world or invocation protocols. The public manifest is available at `/.well-known/agents/{slug}.json`.
