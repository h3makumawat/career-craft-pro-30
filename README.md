# CareerCraft AI — Resume & LinkedIn Coach

> Build a stronger career profile. Get interview-ready with AI.

CareerCraft AI is a working full-stack web application that helps students and early-career
candidates improve their career materials with real generative-AI feedback. It is an academic
internship project demonstrating generative AI, prompt engineering, AI-assisted development
(Vibe Coding), full-stack web development, API integration, Docker containerization and
cloud-deployment readiness.

There are **no mock AI responses, no hardcoded scores and no simulated loading states** anywhere in
the application. Every score and every recommendation comes from a live LLM call made server-side.

---

## 1. Project overview

Three AI workflows:

| Workflow | Input | Output |
| --- | --- | --- |
| **AI Resume Analyzer** | PDF or DOCX upload (max 5 MB) | ATS-style score 0–100, 5-part breakdown, strengths, weaknesses, missing keywords, suggestions, improved summary and headline |
| **AI LinkedIn Coach** | Headline / About / Skills / Experience pasted by the user (+ optional profile URL) | Profile score 0–100, 7-category breakdown, strengths, weaknesses, improved headline, rewritten About, recommended skills, keyword gaps |
| **AI Interview Generator** | Role, experience level, skills, optional job description | 16–20 HR / technical / role-specific / situational questions with reasoning and expected answer points, plus practice mode |

Plus a **career dashboard** aggregating completed analyses (real empty state when nothing has been
analyzed) and an **About** page documenting behaviour and limitations.

## 2. Problem statement

Students apply with resumes and LinkedIn profiles that are never reviewed by anyone with recruiting
experience, and they walk into interviews without role-specific preparation. Professional review is
expensive and slow. CareerCraft AI gives structured, evidence-based, actionable feedback in seconds,
while being explicit that scores are AI estimates rather than guarantees.

## 3. Features

- Drag-and-drop upload with type, emptiness and size validation, upload status and remove option
- Server-side document text extraction (DOCX unzip/XML parse; PDF read by the multimodal model)
- Strict JSON-schema validation of every AI response; scores clamped to 0–100
- Circular score gauges, breakdown bars, strength/improvement cards, keyword tags
- Before / AI-improved comparison for LinkedIn headline and About, with copy-to-clipboard
- Practice mode: one question at a time, hidden guidance, keyboard-reachable controls
- Career dashboard with honest empty state (never fake data)
- Meaningful, specific error messages for every failure mode (see §15)
- Mobile-first responsive layout, semantic HTML, visible focus states, ARIA roles on meters/gauges
- Health endpoint reporting whether the AI service is configured

## 4. Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the Mermaid diagrams.

```
Browser (React SPA/SSR)
   │  centralized API client (src/lib/api-client.ts)
   ▼
Server API routes (src/routes/api/*)        ← thin handlers
   │  request validation (Zod schemas)
   ▼
Service layer (src/lib/career-service.server.ts)
   │  prompt templates (src/lib/prompts.ts)
   │  resume parser (src/lib/resume-parser.server.ts)
   ▼
LLM service (src/lib/ai-gateway.server.ts)  ← the only place the API key is read
   ▼
LLM provider (HTTPS)
```

Key boundary rule: files ending in `.server.ts` are server-only. The LLM API key is read from
`process.env` inside a server handler and never reaches the browser, the route loader data or the
bundle.

## 5. Tech stack

- **Frontend:** React 19, TanStack Router/Start, Tailwind CSS v4 design tokens, Lucide icons
- **Backend:** TanStack Start server routes (Node/edge runtime), Zod validation
- **AI:** LLM gateway (`google/gemini-3.6-flash`), JSON-mode structured responses
- **Docs parsing:** `fflate` for DOCX; PDF handled as a document part by the multimodal model
- **Tooling:** Vite, TypeScript (strict), ESLint, Prettier, Bun
- **Container:** Docker multi-stage build, docker-compose

> **Note on the backend language.** The brief suggested Python FastAPI. This deployment runs a single
> TypeScript server (TanStack Start server routes) so the frontend and backend ship as one container
> and one origin — which removes CORS and route-mismatch risk entirely. The architecture is the same
> layered design FastAPI would use (routes → schemas → services → AI service → parser → config), and
> the HTTP contract (`/api/resume/analyze`, `/api/linkedin/analyze`, `/api/interview/generate`,
> `/api/health`) is identical, so the service layer can be ported to FastAPI without touching the
> frontend. `docs/deployment.md` documents both shapes.

## 6. Folder structure

```
src/
  routes/
    __root.tsx                 shared shell, fonts, base metadata
    index.tsx                  Home
    resume-analyzer.tsx        Resume Analyzer page
    linkedin-coach.tsx         LinkedIn Coach page
    interview-prep.tsx         Interview Generator page
    dashboard.tsx              Career dashboard
    about.tsx                  About / limitations
    api/
      health.ts                GET  /api/health
      resume.analyze.ts        POST /api/resume/analyze
      linkedin.analyze.ts      POST /api/linkedin/analyze
      interview.generate.ts    POST /api/interview/generate
  components/site/
    site-shell.tsx             header, footer, page shell
    score-visuals.tsx          gauge, bars, findings, tags, states
  lib/
    api-client.ts              single centralized client (all API URLs live here)
    api-handler.server.ts      thin route wrapper: parse → validate → service → JSON
    career-service.server.ts   service layer / AI orchestration
    ai-gateway.server.ts       LLM transport, error mapping, JSON extraction
    prompts.ts                 reusable prompt templates
    resume-parser.server.ts    DOCX/PDF handling, size limits
    schemas.ts                 Zod request + response schemas (config of validation)
    career-store.ts            browser-side result persistence for the dashboard
docs/                          architecture, prompting-strategy, testing, deployment
Dockerfile, docker-compose.yml, .dockerignore, .env.example
```

## 7. Environment variables

| Variable | Scope | Required | Purpose |
| --- | --- | --- | --- |
| `LOVABLE_API_KEY` | server only | yes | LLM gateway key. Never sent to the browser. |
| `CORS_ALLOW_ORIGIN` | server only | no | Explicit allow-origin when the frontend is hosted separately. Empty = same-origin only. |
| `PORT` | server only | no | HTTP port in the container (default 3000). |
| `VITE_API_BASE_URL` | client (public) | no | Backend base URL. Empty = same origin (default). |

Copy `.env.example` → `.env`. `.env` is git-ignored; only the example with placeholders is committed.

## 8. Local setup

```bash
bun install          # or: npm install
cp .env.example .env # then set LOVABLE_API_KEY
```

## 9. Running the frontend + backend (dev)

```bash
bun run dev          # http://localhost:8080 — serves the UI and the /api routes
```

## 10. Running a production build

```bash
bun run build
bun run .output/server/index.mjs   # honours PORT
```

## 11. Docker setup

```bash
docker compose up --build          # reads LOVABLE_API_KEY from your .env
# or plain docker:
docker build -t careercraft-ai .
docker run --rm -p 3000:3000 -e LOVABLE_API_KEY=... careercraft-ai
```

No secrets are copied into the image: `.env` is excluded via `.dockerignore` and the key is passed
at runtime.

## 12. API endpoints

### `GET /api/health`

```json
{ "status": "ok", "service": "careercraft-ai-backend", "aiConfigured": true, "time": "2026-08-17T11:14:33.840Z" }
```

### `POST /api/resume/analyze`

Request:

```json
{ "fileName": "resume.pdf", "fileType": "pdf", "fileBase64": "data:application/pdf;base64,JVBER...", "targetRole": "Frontend Developer" }
```

Response (`200`):

```json
{ "data": { "overallScore": 68,
  "breakdown": { "keywords": 70, "formatting": 80, "structure": 75, "length": 50, "impact": 68 },
  "detectedRole": "Frontend Developer",
  "strengths": [{ "title": "Quantifiable Achievements", "detail": "…" }],
  "weaknesses": [{ "title": "…", "detail": "…", "severity": "medium" }],
  "missingKeywords": ["Next.js", "CI/CD"],
  "suggestions": [{ "title": "…", "detail": "…" }],
  "improvedSummary": "…", "suggestedHeadline": "…" } }
```

### `POST /api/linkedin/analyze`

Request: `{ profileUrl?, headline, about, skills, experience, targetRole? }`
Response: `{ data: { overallScore, breakdown{headline,about,skills,experience,clarity,positioning,keywords}, strengths[], weaknesses[], improvedHeadline, improvedAbout, recommendedSkills[], missingKeywords[], suggestions[] } }`

### `POST /api/interview/generate`

Request: `{ role, experienceLevel, skills, jobDescription? }`
Response: `{ data: { role, experienceLevel, focusAreas[], questions[{question,category,difficulty,whyAsked,keyPoints[]}], preparationTips[] } }`

Error shape for every endpoint: `{ "error": "human-readable message", "field": "optional field path" }`
with status `400` (bad body), `413` (too large), `422` (validation / unreadable document),
`429` (rate limited), `402/403` (AI quota or policy), `502/503` (AI unavailable / malformed AI output).

## 13. AI prompting strategy

Full write-up in [docs/prompting-strategy.md](./docs/prompting-strategy.md). Summary:

- One shared rule block applied to all three prompts: analyse only supplied content, never invent
  experience, separate evidence from recommendation, no unsupported ATS/recruiter claims, integer
  scores 0–100, single valid JSON object, no markdown fences.
- Each task adds an explicit JSON schema plus quantity/length guidance so responses are predictable.
- The LinkedIn prompt states that nothing was fetched from LinkedIn and that a URL is a label only.
- The interview prompt carries a safety clause forbidding discriminatory or inappropriate questions.
- Requests are sent in JSON mode; responses are JSON-parsed (with fence/prefix recovery) and then
  validated against Zod schemas. Validation failures surface an error — never fabricated fallbacks.

## 14. Security considerations

- API key only in server environment variables; read inside handlers; never logged, never returned
- `.env` git-ignored and docker-ignored; only `.env.example` with placeholders is committed
- Zod validation on every request; file type/size/emptiness checks client- and server-side
- PDF magic-number check; DOCX structural validation
- Safe error messages: provider bodies are never echoed to the client
- Same-origin API by default; `CORS_ALLOW_ORIGIN` is opt-in and empty by default
- CSRF middleware retained for server functions; API routes accept JSON only
- No user accounts and no database — nothing sensitive is stored server-side; results live in the
  user's own browser storage

## 15. Testing

Documented in [docs/testing.md](./docs/testing.md) — it lists only tests that were actually executed,
with observed output (health check, PDF analysis, DOCX analysis, LinkedIn analysis, interview
generation, invalid PDF, malformed JSON body, insufficient LinkedIn content, missing required
fields, oversized/empty file validation, mobile layout).

## 16. Deployment instructions

See [docs/deployment.md](./docs/deployment.md) (container hosting on AWS App Runner / ECS-Fargate /
Lightsail Containers, environment configuration, health checks, and the optional split
frontend/backend layout).

## 17. Known limitations

- ATS-style scores are AI estimates, not real applicant-tracking-system results
- Scanned/image-only PDFs have no text layer; the app reports this instead of guessing
- Model output varies slightly between identical runs
- Only PDF and DOCX are accepted; DOC, RTF, TXT and images are rejected by design
- Results are per-browser (no accounts, no server-side history)
- Very long documents can exceed model limits; the app returns an explicit size error

## 18. Future scope

- Job-description-to-resume gap matching with per-bullet rewrite suggestions
- Optional accounts and history (would introduce a database, deliberately avoided here)
- Exportable PDF report of an analysis
- Mock-interview scoring of typed or spoken answers
- Multi-language resume support

## AI-assisted development disclosure

This project was built using AI-assisted coding (Vibe Coding), as explicitly permitted by the
internship brief. AI assistance was used for: application scaffolding, UI component implementation,
Tailwind design-system tokens, prompt drafting, Zod schema definitions, Docker configuration and
documentation drafting. All prompts, schemas, validation rules, error-handling behaviour and API
contracts were reviewed and tested against the running application. No test results, deployment
status, AWS resources or metrics in this documentation are fabricated.
