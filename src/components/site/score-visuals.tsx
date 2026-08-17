import { AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";

function toneFor(score: number) {
  if (score >= 80) return "var(--success)";
  if (score >= 60) return "var(--primary)";
  if (score >= 40) return "var(--warning)";
  return "var(--destructive)";
}

export function ScoreGauge({
  score,
  label,
  size = 200,
}: {
  score: number;
  label: string;
  size?: number;
}) {
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = toneFor(score);

  return (
    <div
      className="relative flex flex-col items-center"
      role="img"
      aria-label={`${label}: ${score} out of 100`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={12}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-4xl font-bold tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="label-mono mt-1">/ 100</span>
      </div>
      <p className="mt-3 text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export function ScoreBars({ items }: { items: { label: string; value: number }[] }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium capitalize text-foreground">{item.label}</span>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {item.value}
            </span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"
            role="meter"
            aria-valuenow={item.value}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={item.label}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${item.value}%`,
                background: toneFor(item.value),
                transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

type Finding = { title: string; detail: string; severity?: "low" | "medium" | "high" };

export function FindingList({
  items,
  variant,
}: {
  items: Finding[];
  variant: "strength" | "weakness" | "suggestion";
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing reported in this category.</p>;
  }
  const Icon =
    variant === "strength" ? CheckCircle2 : variant === "weakness" ? AlertTriangle : Lightbulb;
  const color =
    variant === "strength"
      ? "text-[color:var(--success)]"
      : variant === "weakness"
        ? "text-[color:var(--warning)]"
        : "text-primary";

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item, i) => (
        <li key={`${item.title}-${i}`} className="panel p-4">
          <div className="flex items-start gap-3">
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
              {item.severity && (
                <span className="label-mono mt-2 inline-block">severity: {item.severity}</span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function KeywordTags({ items, tone = "primary" }: { items: string[]; tone?: "primary" | "brass" }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">None returned.</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((k, i) => (
        <li
          key={`${k}-${i}`}
          className={
            tone === "primary"
              ? "rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary"
              : "rounded-full border border-brass/30 bg-brass/10 px-3 py-1 font-mono text-xs text-brass"
          }
        >
          {k}
        </li>
      ))}
    </ul>
  );
}

export function SectionCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg">{title}</h2>
        {hint && <span className="label-mono">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
      <p className="text-sm text-foreground">{message}</p>
    </div>
  );
}

export function AnalyzingState({ label }: { label: string }) {
  return (
    <div className="panel relative overflow-hidden p-10 text-center" aria-live="polite">
      <span className="scan-beam" aria-hidden="true" />
      <p className="label-mono">{label}</p>
      <p className="mt-3 text-sm text-muted-foreground">
        The AI is reading your content and drafting real feedback. This usually takes 10–30 seconds.
      </p>
    </div>
  );
}
