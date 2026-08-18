# Architecture (project report material)

The diagrams live in [../ARCHITECTURE.md](../ARCHITECTURE.md). This file expands on the layering,
responsibilities and data flow for the written report.

## Layers

| Layer | Files | Responsibility |
| --- | --- | --- |
| Presentation | `src/routes/*.tsx`, `src/components/site/*` | Pages, forms, gauges, states. No API URLs, no prompts. |
| API client | `src/lib/api-client.ts` | Single place where backend URLs exist; error normalisation into `ApiError`. |
| HTTP boundary | `src/routes/api/*` | Thin route handlers: method, body, delegate. No business logic. |
| Validation / config | `src/lib/schemas.ts` | Zod request + response schemas; score clamping 0–100. |
| Service | `src/lib/career-service.server.ts` | Orchestration: parse document → build prompt → call LLM → validate → enrich. |
| Prompting | `src/lib/prompts.ts` | Reusable system + user prompt templates. |
| Parsing | `src/lib/resume-parser.server.ts` | DOCX unzip/XML text recovery, base64 decode, size/format limits. |
| AI transport | `src/lib/ai-gateway.server.ts` | Only reader of `LOVABLE_API_KEY`; HTTP call, status→message mapping, JSON extraction. |
| Client persistence | `src/lib/career-store.ts` | localStorage results for the dashboard (no server database). |

## Request flow (all three workflows)

1. The page validates input locally and calls the centralized client.
2. The client POSTs JSON to the matching `/api/...` route (same origin by default).
3. The route wrapper parses JSON, runs the Zod request schema, and returns `422` with the offending
   field when validation fails.
4. The service builds a prompt from a template and calls the LLM in JSON mode.
5. The raw text is JSON-parsed (with fence/prefix recovery) and validated against the response
   schema; scores are coerced to integers and clamped to 0–100.
6. Success returns `{ data }`; every failure returns `{ error, field? }` with an accurate status.

## Why no database

The implemented features need no server-side persistence: each analysis is a single request/response
cycle and results belong to one user's browser session. Adding PostgreSQL, Redis, JWT auth, S3 or ECS
would add operational surface with no functional benefit for this scope, so they are deliberately
excluded (documented as future scope in the README).

## Trust boundary

```
Browser (untrusted)        │ Server (trusted)
──────────────────────────┼──────────────────────────────────
form input, file bytes    │ LOVABLE_API_KEY, prompts,
localStorage results      │ provider responses, error details
```

Nothing from the right-hand column is ever serialised into the client bundle, loader data or an API
response body.
