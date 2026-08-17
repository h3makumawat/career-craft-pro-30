import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/site/site-shell";
import { SectionCard } from "@/components/site/score-visuals";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About CareerCraft AI — How it works" },
      {
        name: "description",
        content:
          "How CareerCraft AI analyses resumes and LinkedIn content, the technology behind it, and its documented limitations.",
      },
      { property: "og:title", content: "About CareerCraft AI" },
      {
        property: "og:description",
        content: "Architecture, AI approach, privacy and limitations of CareerCraft AI.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PageShell
      eyebrow="About"
      title="Build a stronger career profile. Get interview-ready with AI."
      description="CareerCraft AI is a full-stack academic internship project that demonstrates generative AI, prompt engineering and AI-assisted development in a real, working product."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="What it does">
          <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>
              <strong className="text-foreground">Resume Analyzer</strong> — you upload a PDF or
              DOCX; the backend extracts the content and an LLM returns an ATS-style score,
              breakdown, strengths, gaps, missing keywords and an improved summary.
            </li>
            <li>
              <strong className="text-foreground">LinkedIn Coach</strong> — you paste your own
              headline, about section, skills and experience; the LLM scores seven categories and
              rewrites your headline and about section.
            </li>
            <li>
              <strong className="text-foreground">Interview Generator</strong> — role, level, skills
              and an optional job description produce HR, technical, role-specific and situational
              questions with the reasoning behind each one.
            </li>
          </ul>
        </SectionCard>

        <SectionCard title="How it works">
          <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>
              React + TanStack Start frontend, server-side API routes at{" "}
              <code className="font-mono text-primary">/api/resume/analyze</code>,{" "}
              <code className="font-mono text-primary">/api/linkedin/analyze</code>,{" "}
              <code className="font-mono text-primary">/api/interview/generate</code> and{" "}
              <code className="font-mono text-primary">/api/health</code>.
            </li>
            <li>
              Every AI call happens server-side. The LLM API key lives only in a server environment
              variable and is never sent to the browser.
            </li>
            <li>
              Each model response is parsed as strict JSON and validated with a schema; scores are
              clamped to 0–100. Malformed responses produce an explicit error, never invented data.
            </li>
            <li>Results are stored in your browser only — there is no user database.</li>
          </ul>
        </SectionCard>

        <SectionCard title="LinkedIn data policy">
          <p className="text-sm leading-relaxed text-muted-foreground">
            CareerCraft AI never scrapes or crawls LinkedIn. A profile URL is optional and is stored
            and displayed as a reference label only. All analysis is based solely on the content you
            paste yourself.
          </p>
        </SectionCard>

        <SectionCard title="Limitations">
          <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>
              ATS-style scores are AI-generated estimates. They are not a guarantee of recruiter or
              applicant-tracking-system performance.
            </li>
            <li>
              Scanned or image-only PDFs contain no extractable text; the app reports this instead of
              guessing.
            </li>
            <li>Results vary slightly between runs, as with any generative model.</li>
            <li>
              AI-assisted development (Vibe Coding) was used to build this project, as permitted by
              the internship brief.
            </li>
          </ul>
        </SectionCard>
      </div>
    </PageShell>
  );
}
