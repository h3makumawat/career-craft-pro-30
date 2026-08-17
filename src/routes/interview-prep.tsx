import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";

import {
  AnalyzingState,
  ErrorNotice,
  KeywordTags,
  SectionCard,
} from "@/components/site/score-visuals";
import { PageShell } from "@/components/site/site-shell";
import { ApiError, api } from "@/lib/api-client";
import { store } from "@/lib/career-store";
import type { InterviewRequest, InterviewSet } from "@/lib/schemas";

export const Route = createFileRoute("/interview-prep")({
  head: () => ({
    meta: [
      { title: "AI Interview Generator — role-specific prep | CareerCraft AI" },
      {
        name: "description",
        content:
          "Generate HR, technical, role-specific and situational interview questions with expected answer points for your target role.",
      },
      { property: "og:title", content: "AI Interview Generator | CareerCraft AI" },
      {
        property: "og:description",
        content: "Role-specific interview questions with the reasoning behind each one.",
      },
    ],
  }),
  component: InterviewPrep,
});

const ROLES = [
  "Software Developer",
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst",
  "Cloud Intern",
  "AI/ML Intern",
  "Cybersecurity Intern",
];

const LEVELS: InterviewRequest["experienceLevel"][] = [
  "Student / Fresher",
  "Internship",
  "0-2 years",
  "2-5 years",
  "5+ years",
];

const CATEGORIES = ["All", "HR", "Technical", "Role-specific", "Situational"] as const;

function InterviewPrep() {
  const [role, setRole] = useState(ROLES[0]!);
  const [customRole, setCustomRole] = useState("");
  const [level, setLevel] = useState<InterviewRequest["experienceLevel"]>("Student / Fresher");
  const [skills, setSkills] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InterviewSet | null>(null);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [practice, setPractice] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const questions = useMemo(() => {
    if (!result) return [];
    return category === "All"
      ? result.questions
      : result.questions.filter((q) => q.category === category);
  }, [result, category]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const set = await api.generateInterview({
        role: (customRole.trim() || role).slice(0, 120),
        experienceLevel: level,
        skills: skills.trim(),
        ...(jobDescription.trim() ? { jobDescription: jobDescription.trim() } : {}),
      });
      setResult(set);
      store.saveInterview(set);
      setIndex(0);
      setRevealed(false);
    } catch (e) {
      setError(
        e instanceof ApiError || e instanceof Error
          ? e.message
          : "Questions could not be generated. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const current = questions[Math.min(index, Math.max(questions.length - 1, 0))];

  return (
    <PageShell
      eyebrow="Interview Prep"
      title="Practise the questions you will actually be asked."
      description="Describe the role you are targeting and CareerCraft AI generates HR, technical, role-specific and situational questions — each with why it is asked and what a strong answer covers."
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Interview setup">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="role" className="text-sm font-medium text-foreground">
                Target role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="customRole" className="text-sm font-medium text-foreground">
                Or type a different role <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="customRole"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="e.g. DevOps Intern"
                className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70"
              />
            </div>

            <div>
              <label htmlFor="level" className="text-sm font-medium text-foreground">
                Experience level
              </label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value as InterviewRequest["experienceLevel"])}
                className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="skills" className="text-sm font-medium text-foreground">
                Primary skills
              </label>
              <textarea
                id="skills"
                rows={3}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, TypeScript, REST APIs, SQL"
                className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70"
              />
            </div>

            <div>
              <label htmlFor="jd" className="text-sm font-medium text-foreground">
                Job description <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="jd"
                rows={5}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job posting for sharper questions"
                className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70"
              />
            </div>

            {error && <ErrorNotice message={error} />}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {loading ? "Generating…" : "Generate Interview Questions"}
            </button>
          </form>
        </SectionCard>

        <div className="space-y-6">
          {loading && <AnalyzingState label="Generating questions" />}

          {!loading && !result && (
            <SectionCard title="Your question set">
              <p className="text-sm text-muted-foreground">
                Generated questions will appear here, grouped by category, with a practice mode for
                one-at-a-time review.
              </p>
            </SectionCard>
          )}

          {result && !loading && (
            <>
              <SectionCard
                title={`${result.questions.length} questions for ${result.role}`}
                hint={result.experienceLevel}
              >
                <KeywordTags items={result.focusAreas} tone="brass" />
                <div className="mt-5 flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setCategory(c);
                        setIndex(0);
                        setRevealed(false);
                      }}
                      className={`rounded-full border px-3 py-1.5 font-mono text-xs transition-colors ${
                        category === c
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setPractice((v) => !v);
                      setIndex(0);
                      setRevealed(false);
                    }}
                    className="rounded-lg border border-brass/40 bg-brass/10 px-4 py-2 text-sm font-semibold text-brass transition-colors hover:bg-brass/20"
                  >
                    {practice ? "Exit practice mode" : "Practice mode"}
                  </button>
                </div>
              </SectionCard>

              {practice ? (
                <SectionCard
                  title="Practice mode"
                  hint={questions.length ? `${index + 1} / ${questions.length}` : "0 / 0"}
                >
                  {current ? (
                    <div>
                      <span className="label-mono">
                        {current.category} · {current.difficulty}
                      </span>
                      <p className="mt-3 text-lg leading-snug text-foreground">{current.question}</p>
                      <button
                        type="button"
                        onClick={() => setRevealed((v) => !v)}
                        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                      >
                        {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {revealed ? "Hide guidance" : "Show guidance"}
                      </button>
                      {revealed && (
                        <div className="mt-5 space-y-4 rounded-lg border border-border bg-secondary/40 p-4">
                          <div>
                            <p className="label-mono">Why it is asked</p>
                            <p className="mt-1.5 text-sm text-muted-foreground">
                              {current.whyAsked}
                            </p>
                          </div>
                          <div>
                            <p className="label-mono">Key points in a strong answer</p>
                            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                              {current.keyPoints.map((p, i) => (
                                <li key={i}>{p}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      <div className="mt-6 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIndex((i) => Math.max(0, i - 1));
                            setRevealed(false);
                          }}
                          disabled={index === 0}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-foreground disabled:opacity-40"
                        >
                          <ChevronLeft className="h-4 w-4" /> Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIndex((i) => Math.min(questions.length - 1, i + 1));
                            setRevealed(false);
                          }}
                          disabled={index >= questions.length - 1}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
                        >
                          Next <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No questions in this category. Choose another filter.
                    </p>
                  )}
                </SectionCard>
              ) : (
                <SectionCard title="Question bank" hint={`${questions.length} shown`}>
                  <ul className="space-y-3">
                    {questions.map((q, i) => (
                      <li key={i} className="rounded-lg border border-border bg-secondary/30 p-4">
                        <span className="label-mono">
                          {q.category} · {q.difficulty}
                        </span>
                        <p className="mt-2 text-sm font-semibold text-foreground">{q.question}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          <span className="text-foreground">Why: </span>
                          {q.whyAsked}
                        </p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                          {q.keyPoints.map((p, j) => (
                            <li key={j}>{p}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}

              {result.preparationTips.length > 0 && (
                <SectionCard title="Preparation tips">
                  <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                    {result.preparationTips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </SectionCard>
              )}
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
