# Deployment

The application builds into a single server bundle that serves both the UI and the `/api/*` routes.
That means one container, one origin, no CORS configuration in the default setup.

> Nothing in this file claims that AWS resources have been provisioned. These are the steps to deploy;
> the current project has been run and tested locally (see `testing.md`).

## Build artefacts

```bash
bun install
bun run build            # produces .output/
bun run .output/server/index.mjs   # listens on $PORT (default 3000)
```

## Container

```bash
docker build -t careercraft-ai .
docker run --rm -p 3000:3000 -e LOVABLE_API_KEY=<key> careercraft-ai
# or
docker compose up --build   # reads LOVABLE_API_KEY from .env
```

The image contains no secrets: `.env*` is excluded by `.dockerignore` and the key is injected at
runtime. Health probe: `GET /api/health` (also wired as a Docker `HEALTHCHECK`).

## AWS options (simplest first)

### Option A — AWS App Runner (recommended for this scope)

1. Push the image to Amazon ECR:
   ```bash
   aws ecr create-repository --repository-name careercraft-ai
   aws ecr get-login-password | docker login --username AWS --password-stdin <acct>.dkr.ecr.<region>.amazonaws.com
   docker tag careercraft-ai:latest <acct>.dkr.ecr.<region>.amazonaws.com/careercraft-ai:latest
   docker push <acct>.dkr.ecr.<region>.amazonaws.com/careercraft-ai:latest
   ```
2. Create an App Runner service from that image.
3. Port: `3000`. Health check path: `/api/health`.
4. Environment: store `LOVABLE_API_KEY` in AWS Secrets Manager and reference it as a secret
   environment variable. Never paste it into the image or a build argument.
5. App Runner terminates TLS and gives a public HTTPS URL.

### Option B — Amazon ECS on Fargate

Same image; task definition with one container (port 3000), `LOVABLE_API_KEY` from Secrets Manager,
an Application Load Balancer target group with health check `/api/health`, and 1 desired task.

### Option C — AWS Lightsail Containers

Simplest console flow: create a container service, point it at the ECR image, expose port 3000,
add the environment variable, deploy.

## Split frontend / backend (optional)

If the report requires a separated deployment:

- **Backend:** the same container, exposing only `/api/*` (Option A/B/C above).
- **Frontend:** build with `VITE_API_BASE_URL=https://api.example.com` and host the static output
  (S3 + CloudFront or any static host).
- **Backend env:** set `CORS_ALLOW_ORIGIN=https://app.example.com` so the API routes return an
  explicit allow-origin header for that host only.

Because every frontend request goes through `src/lib/api-client.ts`, switching between same-origin and
split deployment is a single environment variable — no code changes.

## Porting the backend to FastAPI (if required by the report)

The HTTP contract is unchanged; only the transport layer moves:

| Current file | FastAPI equivalent |
| --- | --- |
| `src/routes/api/*.ts` | `app/api/routes_resume.py`, `routes_linkedin.py`, `routes_interview.py`, `routes_health.py` |
| `src/lib/schemas.ts` | `app/schemas/*.py` (Pydantic models) |
| `src/lib/career-service.server.ts` | `app/services/career_service.py` |
| `src/lib/prompts.ts` | `app/services/prompts.py` |
| `src/lib/resume-parser.server.ts` | `app/services/resume_parser.py` (`pypdf`, `python-docx`) |
| `src/lib/ai-gateway.server.ts` | `app/services/llm_client.py` (`httpx`) |

Run it with `uvicorn app.main:app`, set `CORS_ALLOW_ORIGIN` for the frontend host, and point the
frontend at it with `VITE_API_BASE_URL`. Routes, request bodies and response bodies stay identical.

## Deployment checklist

- [ ] `LOVABLE_API_KEY` set as a runtime secret (never in the image, never in Git)
- [ ] `GET /api/health` returns `{"status":"ok","aiConfigured":true}` on the deployed URL
- [ ] Port 3000 exposed and mapped
- [ ] HTTPS in front of the container
- [ ] One real resume analysis executed against the deployed URL
- [ ] `VITE_API_BASE_URL` left empty (same-origin) unless the frontend is hosted separately
