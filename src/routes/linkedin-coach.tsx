import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

import {
  AnalyzingState,
  ErrorNotice,
  FindingList,
  KeywordTags,
  ScoreBars,
  ScoreGauge,
  SectionCard,
} from "@/components/site/score-visuals";
import { PageShell } from "@/components/site/site-shell";
import { ApiError, api } from "@/lib/api-client";
import { store } from "@/lib/career-store";
import type { LinkedInAnalysis } from "@/lib/schemas";

export const Route = createFileRoute("/linkedin-coach")({
  head: () => ({
    meta: [
      { title: "AI LinkedIn Coach — Profile score & rewrite | CareerCraft AI" },
      {
        name: "description",
        content:
          "Paste your LinkedIn headline, about section, skills and experience to get an AI profile score, an improved headline and a rewritten about section.",
      },
      { property: "og:title", content: "AI LinkedIn Coach | CareerCraft AI" },
      {
        property: "og:description",
        content: "Profile scoring, headline improvement and About rewrites powered by AI.",
      },
    ],
  }),
  component: LinkedInCoach,
});

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      disabled={!value}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-40"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function Field({
  id,
  label,
  hint,
  value,
  onChange,
  rows,
  placeholder,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const shared =
    "mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70";
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label} {hint && <span className="text-muted-foreground">({hint})</span>}
      </label>
      {rows ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={shared}
        />
      ) : (
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={shared}
        />
      )}
    </div>
  );
}

function LinkedInCoach() {
  const [profileUrl, setProfileUrl] = useState("");
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LinkedInAnalysis | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const analysis = await api.analyzeLinkedIn({
        ...(profileUrl.trim() ? { profileUrl: profileUrl.trim() } : {}),
        headline: headline.trim(),
        about: about.trim(),
        skills: skills.trim(),
        experience: experience.trim(),
        ...(targetRole.trim() ? { targetRole: targetRole.trim() } : {}),
      });
      setResult(analysis);
      store.saveLinkedIn(analysis);
    } catch (e) {
      setError(
        e instanceof ApiError || e instanceof Error
          ? e.message
          : "The analysis could not be completed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      eyebrow="LinkedIn Coach"
      title="Strengthen the profile recruiters actually read."
      description="Paste the parts of your profile you want reviewed. CareerCraft AI never scrapes LinkedIn — a profile URL is optional and stored as a reference label only."
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Your profile content" hint="you supply the content">
          <form onSubmit={submit} className="space-y-5">
            <Field
              id="profileUrl"
              label="LinkedIn profile URL"
              hint="optional, reference only"
              value={profileUrl}
              onChange={setProfileUrl}
              placeholder="https://linkedin.com/in/your-name"
            />
            <Field
              id="targetRole"
              label="Target role"
              hint="optional"
              value={targetRole}
              onChange={setTargetRole}
              placeholder="e.g. Data Analyst"
            />
            <Field
              id="headline"
              label="Current headline"
              value={headline}
              onChange={setHeadline}
              placeholder="e.g. CS student | Python & SQL"
            />
            <Field
              id="about"
              label="About section"
              value={about}
              onChange={setAbout}
              rows={6}
              placeholder="Paste your current About text"
            />
            <Field
              id="skills"
              label="Skills"
              value={skills}
              onChange={setSkills}
              rows={3}
              placeholder="Python, SQL, Power BI, Excel…"
            />
            <Field
              id="experience"
              label="Experience"
              value={experience}
              onChange={setExperience}
              rows={6}
              placeholder="Roles, internships, projects with responsibilities"
            />

            {error && <ErrorNotice message={error} />}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {loading ? "Analyzing…" : "Analyze My Profile"}
            </button>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Profile scores are AI-generated estimates based only on the text you paste here.
            </p>
          </form>
        </SectionCard>

        <div className="space-y-6">
          {loading && <AnalyzingState label="Scanning profile" />}

          {!loading && !result && (
            <SectionCard title="Results">
              <p className="text-sm text-muted-foreground">
                Submit your profile content to see your score, category breakdown and AI-improved
                headline and About section.
              </p>
            </SectionCard>
          )}

          {result && !loading && (
            <>
              <SectionCard
                title={`Profile Score: ${result.overallScore}/100`}
                hint={result.profileUrl ? "url stored as reference" : "no url supplied"}
              >
                <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
                  <ScoreGauge score={result.overallScore} label="LinkedIn profile score" />
                  <ScoreBars
                    items={[
                      { label: "headline", value: result.breakdown.headline },
                      { label: "about", value: result.breakdown.about },
                      { label: "skills", value: result.breakdown.skills },
                      { label: "experience", value: result.breakdown.experience },
                      { label: "clarity", value: result.breakdown.clarity },
                      { label: "professional positioning", value: result.breakdown.positioning },
                      { label: "keyword optimization", value: result.breakdown.keywords },
                    ]}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Headline">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-secondary/50 p-4">
                    <p className="label-mono">Before</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {result.originalHeadline || "(none supplied)"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <p className="label-mono text-primary">AI-improved version</p>
                    <p className="mt-2 text-sm text-foreground">{result.improvedHeadline || "—"}</p>
                    <div className="mt-3">
                      <CopyButton value={result.improvedHeadline} label="Copy improved headline" />
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="About section">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-secondary/50 p-4">
                    <p className="label-mono">Before</p>
                    <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                      {result.originalAbout || "(none supplied)"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <p className="label-mono text-primary">AI-improved version</p>
                    <p className="mt-2 whitespace-pre-line text-sm text-foreground">
                      {result.improvedAbout || "—"}
                    </p>
                    <div className="mt-3">
                      <CopyButton value={result.improvedAbout} label="Copy About section" />
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Strengths">
                <FindingList items={result.strengths} variant="strength" />
              </SectionCard>

              <SectionCard title="Weaknesses">
                <FindingList items={result.weaknesses} variant="weakness" />
              </SectionCard>

              <SectionCard title="Recommended skills">
                <KeywordTags items={result.recommendedSkills} tone="brass" />
              </SectionCard>

              <SectionCard title="Missing keywords">
                <KeywordTags items={result.missingKeywords} />
              </SectionCard>

              <SectionCard title="Actionable improvements">
                <FindingList items={result.suggestions} variant="suggestion" />
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
