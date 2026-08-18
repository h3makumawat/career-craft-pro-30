# Testing & Verification Log — CareerCraft AI

All results below come from executing the running application. No mocked AI
responses were used at any point: every pass hit the real LLM backend through
the server-side AI service layer.

## 1. Test environment

| Item | Value |
| --- | --- |
| App server | Vite / TanStack Start dev server, `http://localhost:8080` |
| Backend | Server-side TypeScript API routes (`/api/*`) |
| Model | `google/gemini-3.6-flash` via the AI gateway, JSON-mode + Zod validation |
| Browser automation | Chromium (Playwright), viewports 390x844 (mobile) and 1280x1800 (desktop) |
| Fixtures | Generated `resume.pdf` (single-column text resume), `resume.docx`, `notes.txt` (invalid type) |

## 2. API contract tests

| # | Endpoint | Input | Expected | Result |
| --- | --- | --- | --- | --- |
| A1 | `GET /api/health` | — | `200`, service + AI configuration status | Pass |
| A2 | `POST /api/resume/analyze` | `resume.pdf` + target role | `200`, scored ATS breakdown | Pass |
| A3 | `POST /api/resume/analyze` | `resume.docx` | `200`, text extracted from DOCX XML | Pass |
| A4 | `POST /api/resume/analyze` | `notes.txt` | `4xx`, "Unsupported file type" | Pass |
| A5 | `POST /api/resume/analyze` | no file | `4xx` validation error | Pass |
| A6 | `POST /api/linkedin/analyze` | full profile fields | `200`, score + rewrites | Pass |
| A7 | `POST /api/linkedin/analyze` | near-empty profile | `422` with guidance message | Pass |
| A8 | `POST /api/linkedin/analyze` | malformed profile URL | `422` validation error | Pass |
| A9 | `POST /api/interview/generate` | role + level + skills | `200`, categorised question set | Pass |

## 3. End-to-end UI tests (Playwright, real browser)

| # | Flow | Observation | Result |
| --- | --- | --- | --- |
| B1 | Route smoke test — `/`, `/resume-analyzer`, `/linkedin-coach`, `/interview-prep`, `/dashboard`, `/about` | All `200`, one `h1` per page, zero console errors, zero horizontal overflow on both viewports | Pass |
| B2 | Resume upload of `notes.txt` | Inline alert: "Unsupported file type. Please upload a .pdf or .docx resume." | Pass |
| B3 | Resume upload of `resume.pdf` with target role | `POST /api/resume/analyze` → `200`; UI rendered ATS score 62/100 with sub-scores (Keywords 65, Formatting 60, Structure 70, Length 45, Impact 68), three strengths and severity-tagged weaknesses referencing real resume content (22% bundle reduction, 60 Vitest tests, `StudyMate` project) | Pass |
| B4 | LinkedIn submit with empty content | `422`; alert asks for at least ~80 characters of profile content | Pass |
| B5 | LinkedIn submit with invalid URL | `422`; alert "Please enter a valid LinkedIn profile URL (or leave it empty)." | Pass |
| B6 | LinkedIn submit with full content | `200`; profile score 52/100 with per-section bars (Headline 45, About 35) plus rewrites | Pass |
| B7 | Interview generation (role + skills) | `200`; 16 questions rendered across HR / technical / role-specific / situational | Pass |
| B8 | Practice mode | Question stepper and "Show guidance" reveal work | Pass |
| B9 | Dashboard aggregation | Empty state shows "Nothing analyzed yet" with no placeholder data; after analyses it shows the stored resume and LinkedIn scores and strengths | Pass |

## 4. Hallucination / grounding checks

- Feedback in B3 and B6 quoted only facts present in the submitted document or
  profile fields; no invented employers, dates or metrics appeared.
- Empty-input paths (B2, B4) return errors rather than generated filler, which
  is the intended guardrail: the app never invents a profile for the user.

## 5. Known limitations

- Results are persisted in `localStorage` only, so the dashboard is per-browser
  and clears with site data.
- Scanned/image-only PDFs depend on the model's document reading; very low
  quality scans may extract little text.
- Model output is advisory: scores are ATS-style estimates, not the output of
  any specific commercial ATS.
