import { createFileRoute } from "@tanstack/react-router";
import { FileText, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

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
import type { ResumeAnalysis } from "@/lib/schemas";

export const Route = createFileRoute("/resume-analyzer")({
  head: () => ({
    meta: [
      { title: "AI Resume Analyzer — ATS-style scoring | CareerCraft AI" },
      {
        name: "description",
        content:
          "Upload a PDF or DOCX resume and get a real AI ATS-style score, keyword gaps, strengths and an improved professional summary.",
      },
      { property: "og:title", content: "AI Resume Analyzer | CareerCraft AI" },
      {
        property: "og:description",
        content: "ATS-style resume scoring with actionable AI feedback.",
      },
    ],
  }),
  component: ResumeAnalyzer,
});

const MAX_BYTES = 5 * 1024 * 1024;

function fileKind(file: File): "pdf" | "docx" | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";
  return null;
}

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The file could not be read from your device."));
    reader.readAsDataURL(file);
  });
}

function ResumeAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeAnalysis | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function accept(next: File | null | undefined) {
    setError(null);
    if (!next) return;
    if (!fileKind(next)) {
      setError("Unsupported file type. Please upload a .pdf or .docx resume.");
      return;
    }
    if (next.size === 0) {
      setError("That file is empty. Please choose a resume with content.");
      return;
    }
    if (next.size > MAX_BYTES) {
      setError(
        `That file is ${(next.size / 1024 / 1024).toFixed(1)} MB. The maximum size is 5 MB.`,
      );
      return;
    }
    setFile(next);
  }

  async function analyze() {
    if (!file) return;
    const kind = fileKind(file);
    if (!kind) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const base64 = await toBase64(file);
      const analysis = await api.analyzeResume({
        fileName: file.name,
        fileType: kind,
        fileBase64: base64,
        ...(targetRole.trim() ? { targetRole: targetRole.trim() } : {}),
      });
      setResult(analysis);
      store.saveResume(analysis);
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
      eyebrow="Resume Analyzer"
      title="Get an ATS-style read on your resume."
      description="Upload your resume as PDF or DOCX. The file is sent to the backend, its text is extracted, and a real language model returns scoring and concrete improvements."
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Upload resume" hint="pdf · docx · max 5 mb">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              accept(e.dataTransfer.files?.[0]);
            }}
            className={`relative overflow-hidden rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragging ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <UploadCloud className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm text-foreground">Drag and drop your resume here</p>
            <p className="mt-1 text-xs text-muted-foreground">PDF or DOCX, up to 5 MB</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-4 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Choose file
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx"
              className="sr-only"
              aria-label="Resume file"
              onChange={(e) => accept(e.target.files?.[0])}
            />
          </div>

          {file && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/60 p-3">
              <span className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate text-sm text-foreground">{file.name}</span>
                <span className="label-mono shrink-0">{(file.size / 1024).toFixed(0)} kb</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Remove
              </button>
            </div>
          )}

          <div className="mt-5">
            <label htmlFor="targetRole" className="text-sm font-medium text-foreground">
              Target role <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="targetRole"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Frontend Developer Intern"
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70"
            />
          </div>

          {error && (
            <div className="mt-5">
              <ErrorNotice message={error} />
            </div>
          )}

          <button
            type="button"
            onClick={analyze}
            disabled={!file || loading}
            className="mt-5 w-full rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Analyzing…" : "Analyze Resume"}
          </button>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            ATS-style score is an AI-generated estimate, not a guarantee of recruiter or ATS
            performance.
          </p>
        </SectionCard>

        <div className="space-y-6">
          {loading && <AnalyzingState label="Scanning resume" />}

          {!loading && !result && (
            <SectionCard title="Results">
              <p className="text-sm text-muted-foreground">
                Your AI analysis will appear here once you upload a resume and run the analyzer.
                Nothing is pre-filled and no sample scores are shown.
              </p>
            </SectionCard>
          )}

          {result && !loading && (
            <>
              <SectionCard title="ATS-style score" hint={result.detectedRole}>
                <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
                  <ScoreGauge score={result.overallScore} label="Overall resume score" />
                  <ScoreBars
                    items={[
                      { label: "keywords", value: result.breakdown.keywords },
                      { label: "formatting", value: result.breakdown.formatting },
                      { label: "structure", value: result.breakdown.structure },
                      { label: "length", value: result.breakdown.length },
                      { label: "impact / achievements", value: result.breakdown.impact },
                    ]}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Strengths">
                <FindingList items={result.strengths} variant="strength" />
              </SectionCard>

              <SectionCard title="Weaknesses">
                <FindingList items={result.weaknesses} variant="weakness" />
              </SectionCard>

              <SectionCard title="Missing keywords" hint="add only where genuinely true">
                <KeywordTags items={result.missingKeywords} />
              </SectionCard>

              <SectionCard title="AI recommendations">
                <FindingList items={result.suggestions} variant="suggestion" />
              </SectionCard>

              <SectionCard title="Suggested headline & summary">
                <p className="label-mono">Headline</p>
                <p className="mt-2 text-sm text-foreground">{result.suggestedHeadline || "—"}</p>
                <p className="label-mono mt-5">Improved professional summary</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {result.improvedSummary || "—"}
                </p>
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
