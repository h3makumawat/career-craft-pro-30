import { z } from "zod";

const score = z.coerce
  .number()
  .transform((n) => Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0))));

const finding = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
});

const weakness = finding.extend({
  severity: z.enum(["low", "medium", "high"]).catch("medium"),
});

const stringList = z.array(z.string().min(1)).default([]);

/* ---------- Resume ---------- */

export const resumeRequestSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.enum(["pdf", "docx"]),
  fileBase64: z.string().min(32),
  targetRole: z.string().max(120).optional(),
});
export type ResumeRequest = z.infer<typeof resumeRequestSchema>;

export const resumeAnalysisSchema = z.object({
  overallScore: score,
  breakdown: z.object({
    keywords: score,
    formatting: score,
    structure: score,
    length: score,
    impact: score,
  }),
  detectedRole: z.string().default("Not specified"),
  strengths: z.array(finding).default([]),
  weaknesses: z.array(weakness).default([]),
  missingKeywords: stringList,
  suggestions: z.array(finding).default([]),
  improvedSummary: z.string().default(""),
  suggestedHeadline: z.string().default(""),
});
export type ResumeAnalysis = z.infer<typeof resumeAnalysisSchema> & {
  fileName?: string | undefined;
  createdAt?: string | undefined;
};

/* ---------- LinkedIn ---------- */

export const linkedinRequestSchema = z
  .object({
    profileUrl: z
      .string()
      .trim()
      .max(300)
      .optional()
      .refine((v) => !v || /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\//i.test(v), {
        message: "Please enter a valid LinkedIn profile URL (or leave it empty).",
      }),
    headline: z.string().trim().max(400).default(""),
    about: z.string().trim().max(6000).default(""),
    skills: z.string().trim().max(2000).default(""),
    experience: z.string().trim().max(8000).default(""),
    targetRole: z.string().trim().max(120).optional(),
  })
  .refine((v) => (v.headline + v.about + v.skills + v.experience).replace(/\s/g, "").length >= 80, {
    message:
      "Please provide more profile content (at least ~80 characters across headline, about, skills and experience) so the AI has something real to analyse.",
  });
export type LinkedInRequest = z.infer<typeof linkedinRequestSchema>;

export const linkedinAnalysisSchema = z.object({
  overallScore: score,
  breakdown: z.object({
    headline: score,
    about: score,
    skills: score,
    experience: score,
    clarity: score,
    positioning: score,
    keywords: score,
  }),
  strengths: z.array(finding).default([]),
  weaknesses: z.array(weakness).default([]),
  improvedHeadline: z.string().default(""),
  improvedAbout: z.string().default(""),
  recommendedSkills: stringList,
  missingKeywords: stringList,
  suggestions: z.array(finding).default([]),
});
export type LinkedInAnalysis = z.infer<typeof linkedinAnalysisSchema> & {
  originalHeadline?: string | undefined;
  originalAbout?: string | undefined;
  profileUrl?: string | undefined;
  createdAt?: string | undefined;
};

/* ---------- Interview ---------- */

export const interviewRequestSchema = z.object({
  role: z.string().trim().min(2, "Please enter a target role.").max(120),
  experienceLevel: z.enum(["Student / Fresher", "Internship", "0-2 years", "2-5 years", "5+ years"]),
  skills: z.string().trim().min(2, "Please list at least one primary skill.").max(600),
  jobDescription: z.string().trim().max(8000).optional(),
});
export type InterviewRequest = z.infer<typeof interviewRequestSchema>;

export const interviewSetSchema = z.object({
  role: z.string().default(""),
  experienceLevel: z.string().default(""),
  focusAreas: stringList,
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        category: z.enum(["HR", "Technical", "Role-specific", "Situational"]).catch("Role-specific"),
        difficulty: z.enum(["easy", "medium", "hard"]).catch("medium"),
        whyAsked: z.string().default(""),
        keyPoints: stringList,
      }),
    )
    .min(1, "The AI returned no usable questions."),
  preparationTips: stringList,
});
export type InterviewSet = z.infer<typeof interviewSetSchema> & { createdAt?: string | undefined };
