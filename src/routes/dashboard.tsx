import { Link, createFileRoute } from "@tanstack/react-router";

import {
  KeywordTags,
  ScoreBars,
  ScoreGauge,
  SectionCard,
} from "@/components/site/score-visuals";
import { PageShell } from "@/components/site/site-shell";
import { store, useCareerData } from "@/lib/career-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Career Dashboard — your AI scores | CareerCraft AI" },
      {
        name: "description",
        content:
          "Your resume score, LinkedIn score, top improvement areas, keyword gaps and interview preparation status in one place.",
      },
      { property: "og:title", content: "Career Dashboard | CareerCraft AI" },
      {
        property: "og:description",
        content: "Track your AI resume and LinkedIn scores and interview prep progress.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { resume, linkedin, interview, ready } = useCareerData();
  const hasAny = Boolean(resume || linkedin || interview);

  return (
    <PageShell
      eyebrow="Dashboard"
      title="Your career profile at a glance."
      description="Scores and recommendations from your completed analyses. Results are stored only in this browser."
    >
      {!ready && <p className="text-sm text-muted-foreground">Loading your saved results…</p>}

      {ready && !hasAny && (
        <SectionCard title="Nothing analyzed yet">
          <p className="text-sm text-muted-foreground">
            Your career dashboard will appear here after your first analysis. No sample or
            placeholder data is shown.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/resume-analyzer"
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Analyze my resume
            </Link>
            <Link
              to="/linkedin-coach"
              className="rounded-lg border border-brass/40 bg-brass/10 px-4 py-2.5 text-sm font-semibold text-brass"
            >
              Improve my LinkedIn
            </Link>
            <Link
              to="/interview-prep"
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
            >
              Generate interview questions
            </Link>
          </div>
        </SectionCard>
      )}

      {ready && hasAny && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <SectionCard title="Resume score" hint={resume?.fileName ?? "not analyzed"}>
              {resume ? (
                <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
                  <ScoreGauge score={resume.overallScore} label="ATS-style estimate" size={160} />
                  <ScoreBars
                    items={[
                      { label: "keywords", value: resume.breakdown.keywords },
                      { label: "formatting", value: resume.breakdown.formatting },
                      { label: "structure", value: resume.breakdown.structure },
                      { label: "length", value: resume.breakdown.length },
                      { label: "impact", value: resume.breakdown.impact },
                    ]}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No resume analyzed yet.{" "}
                  <Link to="/resume-analyzer" className="text-primary underline">
                    Upload one
                  </Link>
                  .
                </p>
              )}
            </SectionCard>

            <SectionCard title="LinkedIn score" hint={linkedin ? "profile analyzed" : "not analyzed"}>
              {linkedin ? (
                <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
                  <ScoreGauge score={linkedin.overallScore} label="Profile quality" size={160} />
                  <ScoreBars
                    items={[
                      { label: "headline", value: linkedin.breakdown.headline },
                      { label: "about", value: linkedin.breakdown.about },
                      { label: "skills", value: linkedin.breakdown.skills },
                      { label: "experience", value: linkedin.breakdown.experience },
                      { label: "positioning", value: linkedin.breakdown.positioning },
                    ]}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No profile analyzed yet.{" "}
                  <Link to="/linkedin-coach" className="text-primary underline">
                    Add your content
                  </Link>
                  .
                </p>
              )}
            </SectionCard>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <SectionCard title="Profile strengths">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[...(resume?.strengths ?? []), ...(linkedin?.strengths ?? [])]
                  .slice(0, 6)
                  .map((s, i) => (
                    <li key={i}>
                      <span className="text-foreground">{s.title}</span> — {s.detail}
                    </li>
                  ))}
                {[...(resume?.strengths ?? []), ...(linkedin?.strengths ?? [])].length === 0 && (
                  <li>No strengths recorded yet.</li>
                )}
              </ul>
            </SectionCard>

            <SectionCard title="Top improvement areas">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[...(resume?.weaknesses ?? []), ...(linkedin?.weaknesses ?? [])]
                  .sort((a, b) =>
                    a.severity === "high" ? -1 : b.severity === "high" ? 1 : 0,
                  )
                  .slice(0, 6)
                  .map((w, i) => (
                    <li key={i}>
                      <span className="text-foreground">{w.title}</span> — {w.detail}
                    </li>
                  ))}
                {[...(resume?.weaknesses ?? []), ...(linkedin?.weaknesses ?? [])].length === 0 && (
                  <li>No improvement areas recorded yet.</li>
                )}
              </ul>
            </SectionCard>
          </div>

          <SectionCard title="Missing keywords across your profile">
            <KeywordTags
              items={Array.from(
                new Set([...(resume?.missingKeywords ?? []), ...(linkedin?.missingKeywords ?? [])]),
              )}
            />
          </SectionCard>

          <SectionCard title="Interview preparation status">
            {interview ? (
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground">{interview.questions.length} questions</span>{" "}
                generated for {interview.role} ({interview.experienceLevel}).{" "}
                <Link to="/interview-prep" className="text-primary underline">
                  Practise them
                </Link>
                .
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No question set generated yet.{" "}
                <Link to="/interview-prep" className="text-primary underline">
                  Generate one
                </Link>
                .
              </p>
            )}
          </SectionCard>

          <button
            type="button"
            onClick={() => store.clear()}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-destructive"
          >
            Clear saved results
          </button>
        </div>
      )}
    </PageShell>
  );
}
