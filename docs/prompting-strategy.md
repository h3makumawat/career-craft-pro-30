# Prompting strategy

All prompts live in `src/lib/prompts.ts`. Each workflow has one system template plus one user-content
builder, so prompts are versioned in a single place and never assembled inside components.

## Shared rule block

Every system prompt begins with the same constraints:

- Analyse **only** the content supplied by the user.
- Never invent employers, dates, degrees, projects or metrics.
- Separate **evidence** (what the supplied content shows) from **recommendations** (what to change).
- No unsupported claims about ATS systems, recruiters or hiring outcomes.
- All scores are integers between 0 and 100.
- Feedback must be specific and actionable — no generic filler.
- Return a **single valid JSON object** matching the given schema; no markdown fences, no prose.
- If the content is too short or is not a resume/profile, still return valid JSON, score low, and
  explain the problem in `weaknesses`.

The last rule is what prevents "helpful" hallucination: the model must report a bad input rather than
imagining a plausible resume.

## Task templates

### Resume analysis
The system prompt appends the exact JSON schema (`overallScore`, five-part `breakdown`,
`detectedRole`, `strengths`, `weaknesses` with severity, `missingKeywords`, `suggestions`,
`improvedSummary`, `suggestedHeadline`) plus quantity guidance (3–6 strengths, 3–6 weaknesses, 5–12
keywords, 4–8 suggestions) and a length constraint on the rewritten summary.

- **DOCX:** extracted plain text is embedded in the user message between delimiters.
- **PDF:** the file is attached as a document part; the instruction adds "if the attached PDF contains
  no extractable text (e.g. a scanned image), set all scores to 0 and say so in weaknesses."

### LinkedIn analysis
Adds a provenance rule: *"You have NOT fetched anything from LinkedIn; never imply that you did. If a
profile URL is given, treat it as a reference label only."* The schema carries seven category scores
(headline, about, skills, experience, clarity, positioning, keywords) plus `improvedHeadline`
(<220 chars) and `improvedAbout` (3–5 short first-person paragraphs grounded in supplied content).

### Interview generation
Adds a safety clause: no discriminatory, personal, medical, political, religious or salary-coercive
questions — professional, job-relevant questions only. The schema requires 16–20 questions balanced
across HR / Technical / Role-specific / Situational (at least 4 each), with `whyAsked` and 3–5
`keyPoints` per question, plus `preparationTips`.

## Determinism and safety net

Prompting alone is not trusted:

1. Requests are sent in JSON mode (`response_format: { type: "json_object" }`).
2. The response is JSON-parsed, with recovery for stray fences or leading text.
3. The parsed object is validated by a Zod schema (`src/lib/schemas.ts`).
4. Scores are coerced to numbers, rounded, and clamped to `0..100`; unknown enum values fall back to
   safe defaults (`severity: "medium"`, `difficulty: "medium"`).
5. A validation failure returns an explicit error to the UI. **No fallback fake result is ever
   substituted.**

## Iterations made while building

- Early prompts returned prose around the JSON; adding "no markdown fences, no prose outside JSON"
  plus server-side fence recovery removed the failure.
- Without explicit counts the model returned 6–8 interview questions; stating "16–20, at least 4 per
  category" produced consistent sets.
- Without the provenance rule the LinkedIn output occasionally implied it had viewed the live
  profile; the explicit "you have NOT fetched anything" line removed that phrasing.
