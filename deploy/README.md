# Public deployment

The prototype is a stateless API plus static web client and PostgreSQL. It can run on any Docker host and can add API replicas behind a load balancer because sessions, worlds, events, and generated experiences live in PostgreSQL.

## Required public configuration

- `PUBLIC_API_URL=https://api.your-domain.example`
- `WEB_ORIGIN=https://your-domain.example`
- `DATABASE_URL` supplied by the managed PostgreSQL service
- `MODEL_MODE=live`
- `OPENROUTER_API_KEY` supplied through the host's secret manager
- `OPENROUTER_MODEL=deepseek/deepseek-v4-flash-0731` or another OpenRouter model

Build the web image with `VITE_API_URL` set to the public API URL. Terminate TLS at the platform load balancer or reverse proxy. Never place the OpenRouter key in the web build; only the API service receives it.

## Central index

Anyone can create a draft with `POST /v1/worlds`, keep the returned owner token, and publish with `POST /v1/worlds/{id}/publish`. Published worlds become visible to all clients through `/v1/index/search` and their well-known manifest.

For domain discovery, publish a DNS TXT record at `_agent.your-domain.example` with this value:

```text
agent-manifest=https://api.your-domain.example/.well-known/agents/your-slug.json
```

The resolver returns the HTTPS manifest location. The prototype does not claim DNSSEC identity verification yet.

## Scaling notes

- Run multiple API replicas; do not use in-memory mode publicly.
- Keep PostgreSQL backups and connection limits appropriate for replica count.
- Put a CDN in front of the static web client and well-known manifests.
- Replace process-local rate limiting with Redis when running multiple replicas if globally consistent quotas are required.
- Move model calls to a durable queue only if request duration or provider limits become a bottleneck.
