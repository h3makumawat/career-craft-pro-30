import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, FileSearch, Linkedin, MessagesSquare } from "lucide-react";

import { SiteFooter, SiteHeader } from "@/components/site/site-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CareerCraft AI — Resume & LinkedIn Coach" },
      {
        name: "description",
        content:
          "Analyze your resume, strengthen your LinkedIn profile and generate role-specific interview questions with real AI feedback.",
      },
      { property: "og:title", content: "CareerCraft AI — Resume & LinkedIn Coach" },
      {
        property: "og:description",
        content:
          "AI-powered career toolkit: ATS-style resume scoring, LinkedIn profile coaching and interview preparation.",
      },
    ],
  }),
  component: Home,
});

const FEATURES = [
  {
    icon: FileSearch,
    title: "Resume Intelligence",
    to: "/resume-analyzer" as const,
    points: [
      "ATS-style scoring",
      "Resume strengths",
      "Missing keywords",
      "Actionable improvements",
    ],
  },
  {
    icon: Linkedin,
    title: "LinkedIn Coach",
    to: "/linkedin-coach" as const,
    points: [
      "Profile quality score",
      "Headline improvement",
      "About section rewrite",
      "Skills recommendations",
    ],
  },
  {
    icon: MessagesSquare,
    title: "Interview Prep",
    to: "/interview-prep" as const,
    points: [
      "Role-specific questions",
      "HR + technical preparation",
      "Personalized question generation",
    ],
  },
];

function ResumeMockup() {
  return (
    <div className="panel relative overflow-hidden p-5 sm:p-7">
      <span className="scan-beam" aria-hidden="true" />
      <div className="flex items-center justify-between">
        <div>
          <div className="h-3 w-32 rounded bg-foreground/80" />
          <div className="mt-2 h-2 w-24 rounded bg-muted-foreground/50" />
        </div>
        <div className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[0.65rem] text-primary">
          SCANNING
        </div>
      </div>
      <div className="mt-6 space-y-5">
        {["Experience", "Skills", "Projects"].map((section) => (
          <div key={section}>
            <p className="label-mono">{section}</p>
            <div className="mt-2 space-y-2">
              <div className="h-2 w-full rounded bg-muted-foreground/25" />
              <div className="h-2 w-[86%] rounded bg-muted-foreground/20" />
              <div className="h-2 w-[64%] rounded bg-muted-foreground/15" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-7 flex items-center gap-3 border-t border-border pt-5">
        <span className="font-mono text-2xl font-bold text-primary">ATS</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
          <div className="animate-pulse-soft h-full w-3/4 rounded-full bg-primary" />
        </div>
        <span className="label-mono">live analysis</span>
      </div>
    </div>
  );
}

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="mx-auto w-full max-w-7xl px-4 pb-4 pt-12 sm:px-6 lg:px-8 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="animate-rise">
              <p className="label-mono">CareerCraft AI · AI-powered career improvement toolkit</p>
              <h1 className="mt-5 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                Turn your career profile into an{" "}
                <span className="text-primary">interview-ready story.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Analyze your resume, strengthen your LinkedIn presence, and prepare for interviews
                with practical AI-powered feedback.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/resume-analyzer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Analyze My Resume <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/linkedin-coach"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-brass/40 bg-brass/10 px-6 py-3.5 text-sm font-semibold text-brass transition-colors hover:bg-brass/20"
                >
                  Improve My LinkedIn
                </Link>
              </div>
              <p className="mt-6 font-mono text-xs text-muted-foreground">
                No sign-up · Your content is analyzed on request and never sold
              </p>
            </div>
            <div className="animate-rise" style={{ animationDelay: "120ms" }}>
              <ResumeMockup />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl">Three AI workflows, one career toolkit</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, points, to }) => (
              <Link key={title} to={to} className="panel group p-6 transition-colors hover:border-primary/40">
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-xl">{title}</h3>
                <ul className="mt-4 space-y-2">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  Open
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="panel flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="label-mono">Technology</p>
              <p className="mt-2 text-lg text-foreground">
                Built with Generative AI, Prompt Engineering and Cloud Technologies.
              </p>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              LLM backend · structured JSON validation · containerized deployment
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
